/**
 * Shape a mocked model reply to the request it answers.
 *
 * A request schema names the fields asked for and, in a batch, the exercises.
 * A real endpoint enforcing it can only answer those; a mock that answers
 * every field of every prompt would fail the schema and abstain. This keeps
 * the keys and exercises the request asked for, declines (null) any it
 * asked for that the mock did not answer, and fits each answer to the schema
 * sent: a string where a string is asked, the first allowed value where the
 * answer is not one, a list where a list is asked.
 */

import type { AIProviderOptions } from '../../src/core/types.js';

type Json = Record<string, unknown>;

export function requestedOnly(content: string, options?: AIProviderOptions): string {
  const schema = options?.responseSchema?.schema as Json | undefined;
  if (!schema) return content;
  const parsed = JSON.parse(content) as Json;

  const shape = (answer: Json, item: Json): Json => {
    const properties = item.properties as Json;
    return Object.fromEntries(
      Object.entries(properties).map(([key, schema]) => [
        key,
        key in answer && key !== 'slug' ? fit(answer[key], schema as Json, key) : (answer[key] ?? null),
      ])
    );
  };

  const results = (schema.properties as Json).results as Json | undefined;
  if (!results) return JSON.stringify(shape(parsed, schema));

  const item = results.items as Json;
  const slugs = ((item.properties as Json).slug as { enum: string[] }).enum;
  const answers = (parsed.results as Json[] | undefined) ?? [];
  return JSON.stringify({
    results: slugs.map((slug) => shape(answers.find((a) => a.slug === slug) ?? { slug }, item)),
  });
}

/** Fit a mocked answer to the value schema a request sent for it. */
function fit(value: unknown, schema: Json, key: string): unknown {
  if (value === null || value === undefined) return value ?? null;
  const s = (Array.isArray(schema.anyOf) ? (schema.anyOf as Json[])[0] : schema) as Json;
  if (s.type === 'null') return null;
  if (Array.isArray(s.enum)) return (s.enum as unknown[]).includes(value) ? value : s.enum[0];
  switch (s.type) {
    case 'string':
      return typeof value === 'string' ? value : `ai:${key}`;
    case 'number':
    case 'integer':
      return typeof value === 'number' ? value : 1;
    case 'boolean':
      return typeof value === 'boolean' ? value : true;
    case 'array': {
      const items = (Array.isArray(value) ? value : [value]).map((v) => fit(v, s.items as Json, key));
      return [...new Set(items.map((v) => JSON.stringify(v)))].map((v) => JSON.parse(v));
    }
    case 'object': {
      const answer = (typeof value === 'object' ? value : {}) as Json;
      return Object.fromEntries(
        Object.entries((s.properties as Json) ?? {}).map(([k, p]) => [k, fit(answer[k] ?? `ai:${k}`, p as Json, k)])
      );
    }
    default:
      return value;
  }
}
