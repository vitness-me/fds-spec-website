/**
 * Request schemas for structured output, and reading a reply against one.
 *
 * A tier prompt answers for a set of FDS field paths. Its request schema asks
 * for the configured ones only, each keyed as the prompt replies (the path's
 * last segment). Batched prompts wrap one item per exercise in `results`, and
 * the item's `slug` can only name an exercise in the batch. Every key is
 * required so the model has to answer each one; `null` is how it declines a
 * field.
 *
 * With a target schema, each field's value schema is the one the target
 * schema gives that path, `$ref`s into `$defs` inlined. A muscle or equipment
 * reference becomes a choice among the loaded registry's slugs, which
 * `resolveRefs` turns back into registry entries: the model names an entry, it
 * never writes one. The request is sent strict, without the keywords strict
 * endpoints may reject; the reply is validated against the full schema.
 * Without a target schema, field values are unconstrained and the request is
 * sent non-strict.
 */

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { AIResponse, AIResponseSchema, TransformContext } from '../core/types.js';
import { registryLookup } from '../transforms/builtin/registry-lookup.js';

/** Why a reply was not written. */
export type AbstentionReason = 'refusal' | 'length' | 'invalid';

/** A reply the model gave but that must not be used: it refused or was cut off. */
export class AbstentionError extends Error {
  constructor(readonly reason: AbstentionReason, detail: string) {
    super(`No usable JSON reply (${reason}): ${detail}`);
    this.name = 'AbstentionError';
  }
}

export type ReplyOutcome =
  | { ok: true; value: unknown }
  | { ok: false; reason: AbstentionReason; detail: string };

/** The key a prompt replies with for an FDS field path. */
export function replyKey(fieldPath: string): string {
  return fieldPath.slice(fieldPath.lastIndexOf('.') + 1);
}

export type Registries = TransformContext['registries'];
export type RegistryName = 'muscles' | 'equipment';

/** A configured field to ask for, with the enum its config narrows it to. */
export interface RequestedField {
  path: string;
  enum?: string[];
}

/** What the request schema is generated from. */
export interface RequestTarget {
  /** The target entity schema, with its `$defs`. */
  schema: Record<string, unknown>;
  registries: Registries;
}

export interface PromptRequest {
  /** Sent as `response_format`. */
  responseSchema: AIResponseSchema;
  /** The reply is validated against this. */
  validationSchema: Record<string, unknown>;
  /** Reply keys whose values are registry slugs, and their registry. */
  refs: Record<string, RegistryName>;
}

/** `$defs` entries that are references into a registry. */
const REGISTRY_REFS: Record<string, RegistryName> = {
  muscleRef: 'muscles',
  equipmentRef: 'equipment',
};

/** Keywords strict structured-output endpoints may reject; checked locally instead. */
const VALIDATION_ONLY = new Set([
  'minLength', 'maxLength', 'pattern', 'format', 'minimum', 'maximum',
  'exclusiveMinimum', 'exclusiveMaximum', 'minItems', 'maxItems', 'uniqueItems', 'default',
]);

/**
 * The request for one prompt call.
 *
 * @param slugs - the batch's slugs, or null for a prompt that answers for a
 *   single exercise with a bare object
 */
export function buildRequest(
  promptId: string,
  fields: RequestedField[],
  slugs: string[] | null,
  target?: RequestTarget
): PromptRequest {
  const validation: Record<string, unknown> = {};
  const refs: Record<string, RegistryName> = {};
  for (const field of fields) {
    const key = replyKey(field.path);
    if (!target) {
      validation[key] = {};
      continue;
    }
    const { schema, registry } = fieldSchema(field, target);
    validation[key] = schema.type === 'null' ? schema : { anyOf: [schema, { type: 'null' }] };
    if (registry) refs[key] = registry;
  }

  const envelope = (fieldSchemas: Record<string, unknown>) =>
    slugs === null
      ? closedObject(fieldSchemas)
      : closedObject({
          results: {
            type: 'array',
            items: closedObject({ slug: { type: 'string', enum: slugs }, ...fieldSchemas }),
          },
        });

  const validationSchema = envelope(validation);
  const sent = target ? (withoutValidationOnly(validationSchema) as Record<string, unknown>) : validationSchema;
  return {
    responseSchema: {
      name: promptId.replace(/[^a-zA-Z0-9_-]/g, '_'),
      schema: sent,
      // Strict endpoints require every object closed with all its properties
      // required, and reject some keywords; any other schema is sent as a hint
      // and still checked locally.
      strict: target !== undefined && strictCompatible(sent),
    },
    validationSchema,
    refs,
  };
}

/** The value schema the target schema gives a field path. */
function fieldSchema(
  field: RequestedField,
  target: RequestTarget
): { schema: Record<string, unknown>; registry?: RegistryName } {
  const defs = (target.schema.$defs ?? {}) as Record<string, Record<string, unknown>>;
  const deref = (node: Record<string, unknown>) => {
    const name = defName(node);
    return name ? defs[name] : node;
  };

  let node: Record<string, unknown> | undefined = target.schema;
  for (const segment of field.path.split('.')) {
    const properties: Record<string, Record<string, unknown>> | undefined = node
      ? (deref(node)?.properties as Record<string, Record<string, unknown>> | undefined)
      : undefined;
    node = properties?.[segment];
  }
  if (!node) {
    throw new Error(`Enrichment field "${field.path}" is not in the target schema`);
  }

  const items = node.items as Record<string, unknown> | undefined;
  const registry = registryOf(node) ?? (items && registryOf(items));
  if (registry) {
    const held = target.registries[registry].map((entry) => entry.canonical.slug);
    const unknown = (field.enum ?? []).filter((slug) => !held.includes(slug));
    if (unknown.length > 0) {
      throw new Error(`Enrichment field "${field.path}" lists slugs the ${registry} registry does not hold: ${unknown.join(', ')}`);
    }
    const offered = field.enum ?? held;
    if (offered.length === 0) {
      // Nothing to choose from: the model can only decline.
      return { schema: { type: 'null' }, registry };
    }
    const choice = { type: 'string', enum: offered };
    if (!items) return { schema: choice, registry };
    // Keep the field's own array limits; a reference listed twice is never wanted.
    const limits = Object.fromEntries(Object.entries(node).filter(([key]) => key !== 'items'));
    return { schema: { ...limits, type: 'array', items: choice, uniqueItems: true }, registry };
  }

  const schema = inline(node, defs, field.path) as Record<string, unknown>;
  return { schema: field.enum ? narrow(schema, field.enum, field.path) : schema };
}

/** The `$defs` entry a local `$ref` names, if `node` is one. */
function defName(node: Record<string, unknown>): string | undefined {
  return typeof node.$ref === 'string' ? node.$ref.replace('#/$defs/', '') : undefined;
}

function registryOf(node: Record<string, unknown>): RegistryName | undefined {
  const name = defName(node);
  return name ? REGISTRY_REFS[name] : undefined;
}

/** A copy of `node` with every local `$ref` replaced by its definition. */
function inline(node: unknown, defs: Record<string, unknown>, path: string): unknown {
  if (Array.isArray(node)) return node.map((item) => inline(item, defs, path));
  if (!node || typeof node !== 'object') return node;
  const record = node as Record<string, unknown>;
  const name = defName(record);
  if (name && REGISTRY_REFS[name]) {
    // Inlined, a reference would become an object the model fills in itself.
    throw new Error(
      `Enrichment field "${path}" contains a registry reference (${name}); ask for the reference field itself`
    );
  }
  if (name) {
    return inline(defs[name], defs, path);
  }
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, inline(value, defs, path)]));
}

/** Narrow a string, or list of strings, to the config's enum. */
function narrow(schema: Record<string, unknown>, values: string[], path: string): Record<string, unknown> {
  const scalar = schema.type === 'string' ? schema : undefined;
  const items = schema.type === 'array' ? (schema.items as Record<string, unknown>) : undefined;
  const base = scalar ?? (items?.type === 'string' ? items : undefined);
  if (!base) {
    throw new Error(`Enrichment field "${path}" has an enum, but the target schema does not make it a string`);
  }
  const allowed = base.enum as string[] | undefined;
  const outside = allowed ? values.filter((value) => !allowed.includes(value)) : [];
  if (outside.length > 0) {
    throw new Error(`Enrichment field "${path}" lists values its schema does not allow: ${outside.join(', ')}`);
  }
  const narrowed = { ...base, enum: values };
  return scalar ? narrowed : { ...schema, items: narrowed };
}

/** Keywords strict structured-output endpoints do not accept. */
const STRICT_UNSUPPORTED = new Set([
  'oneOf', 'allOf', 'not', 'if', 'then', 'else', 'patternProperties', 'dependentRequired', 'dependentSchemas',
]);

/**
 * Whether `node` can be sent strict: every object is closed and requires all
 * of its properties, and no keyword strict endpoints reject is used.
 */
function strictCompatible(node: unknown): boolean {
  if (Array.isArray(node)) return node.every(strictCompatible);
  if (!node || typeof node !== 'object') return true;
  const record = node as Record<string, unknown>;
  if (Object.keys(record).some((key) => STRICT_UNSUPPORTED.has(key))) return false;
  const properties = record.properties as Record<string, unknown> | undefined;
  if (properties) {
    const required = (record.required as string[] | undefined) ?? [];
    if (record.additionalProperties !== false) return false;
    if (!Object.keys(properties).every((name) => required.includes(name))) return false;
    if (!Object.values(properties).every(strictCompatible)) return false;
  }
  return Object.entries(record)
    .filter(([key]) => key !== 'properties')
    .every(([, value]) => strictCompatible(value));
}

function withoutValidationOnly(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(withoutValidationOnly);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(
    Object.entries(node as Record<string, unknown>)
      .filter(([key]) => !VALIDATION_ONLY.has(key))
      .map(([key, value]) => [
        key,
        // property names are not keywords: keep every one, strip inside each
        key === 'properties'
          ? Object.fromEntries(
              Object.entries(value as Record<string, unknown>).map(([name, sub]) => [name, withoutValidationOnly(sub)])
            )
          : withoutValidationOnly(value),
      ])
  );
}

/**
 * Replace each registry slug the model chose with the registry's entry, so a
 * reference is always the registry's, never the model's text.
 */
export function resolveRefs(
  fields: Record<string, unknown>,
  refs: Record<string, RegistryName>,
  registries: Registries
): Record<string, unknown> {
  const resolved = { ...fields };
  for (const [key, registry] of Object.entries(refs)) {
    const value = resolved[key];
    if (value === null || value === undefined) continue;
    resolved[key] = registryLookup(
      value,
      { registry, matchField: 'slug', fuzzyMatch: false, toArray: Array.isArray(value) },
      { registries } as TransformContext
    );
  }
  return resolved;
}

function closedObject(properties: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

/**
 * Read a reply against the schema it was requested with. A refusal, a reply
 * cut off at the token limit, anything that is not JSON matching the schema,
 * and a batch reply that does not answer each of `slugs` exactly once are
 * abstentions: nothing from them may be written.
 */
export function readReply(
  response: AIResponse,
  schema?: Record<string, unknown>,
  slugs?: string[]
): ReplyOutcome {
  if (response.refusal || response.finishReason === 'content_filter') {
    return { ok: false, reason: 'refusal', detail: response.refusal ?? 'content_filter' };
  }
  if (response.finishReason === 'length') {
    return { ok: false, reason: 'length', detail: 'the reply reached the token limit' };
  }

  let value: unknown;
  try {
    const fenced = response.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    value = JSON.parse(fenced ? fenced[1] : response.content.trim());
  } catch {
    return { ok: false, reason: 'invalid', detail: 'the reply is not JSON' };
  }

  if (schema) {
    // A fresh instance per reply: request schemas differ per batch, and Ajv
    // keeps every schema it compiled for the life of the instance. About 10 ms,
    // next to a model call of seconds.
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    if (!validate(value)) {
      return { ok: false, reason: 'invalid', detail: ajv.errorsText(validate.errors) };
    }
  }
  if (slugs) {
    // The schema already limits each slug to the batch; this makes each appear once.
    const answered = (value as { results: Array<{ slug: string }> }).results.map((r) => r.slug);
    const expected = new Set(slugs).size;
    if (answered.length !== expected || new Set(answered).size !== expected) {
      return { ok: false, reason: 'invalid', detail: 'the reply must answer each exercise in the batch exactly once' };
    }
  }
  return { ok: true, value };
}
