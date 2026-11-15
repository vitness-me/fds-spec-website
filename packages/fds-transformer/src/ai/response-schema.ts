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
 * Field values are not constrained here, so the schema is sent non-strict.
 */

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { AIResponse, AIResponseSchema } from '../core/types.js';

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

/**
 * The request schema for one prompt call.
 *
 * @param slugs - the batch's slugs, or null for a prompt that answers for a
 *   single exercise with a bare object
 */
export function buildResponseSchema(
  promptId: string,
  fieldPaths: string[],
  slugs: string[] | null
): AIResponseSchema {
  const fields = Object.fromEntries(fieldPaths.map((path) => [replyKey(path), {}]));
  const schema =
    slugs === null
      ? withConfidence(closedObject(fields), fieldPaths)
      : closedObject({
          results: {
            type: 'array',
            items: withConfidence(
              closedObject({ slug: { type: 'string', enum: slugs }, ...fields }),
              fieldPaths
            ),
          },
        });
  return { name: promptId.replace(/[^a-zA-Z0-9_-]/g, '_'), schema, strict: false };
}

/**
 * Allow an optional `confidence` object beside the fields, keyed like them.
 * Optional, nullable, open and any number, so a missing or odd confidence
 * never turns an answer into an abstention; only the requested fields'
 * confidence is read, and an unusable one is recorded as null.
 */
function withConfidence(
  object: Record<string, unknown>,
  fieldPaths: string[]
): Record<string, unknown> {
  const confidence = {
    type: ['object', 'null'],
    properties: Object.fromEntries(
      fieldPaths.map((path) => [replyKey(path), { type: ['number', 'null'] }])
    ),
  };
  return {
    ...object,
    properties: { ...(object.properties as Record<string, unknown>), confidence },
  };
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
