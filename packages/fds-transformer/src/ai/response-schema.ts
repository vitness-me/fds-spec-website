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
import type { AIResponse, AIResponseSchema } from '../core/types.js';

/** Why a reply was not written. */
export type AbstentionReason = 'refusal' | 'length' | 'invalid';

export type ReplyOutcome =
  | { ok: true; value: unknown }
  | { ok: false; reason: AbstentionReason; detail: string };

const ajv = new Ajv2020({ allErrors: false });

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
      ? closedObject(fields)
      : closedObject({
          results: {
            type: 'array',
            items: closedObject({ slug: { type: 'string', enum: slugs }, ...fields }),
          },
        });
  return { name: promptId.replace(/[^a-zA-Z0-9_-]/g, '_'), schema, strict: false };
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
 * cut off at the token limit, and anything that is not JSON matching the
 * schema are abstentions: nothing from them may be written.
 */
export function readReply(response: AIResponse, schema: Record<string, unknown>): ReplyOutcome {
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

  const validate = ajv.compile(schema);
  ajv.removeSchema(schema);
  if (!validate(value)) {
    return { ok: false, reason: 'invalid', detail: ajv.errorsText(validate.errors) };
  }
  return { ok: true, value };
}
