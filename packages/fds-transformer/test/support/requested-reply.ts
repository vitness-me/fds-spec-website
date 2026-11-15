/**
 * Shape a mocked model reply to the request it answers.
 *
 * A request schema names the fields asked for and, in a batch, the exercises.
 * A real endpoint enforcing it can only answer those; a mock that answers
 * every field of every prompt would fail the schema and abstain. This keeps
 * the keys and exercises the request asked for, and declines (null) any it
 * asked for that the mock did not answer.
 */

import type { AIProviderOptions } from '../../src/core/types.js';

type Json = Record<string, unknown>;

export function requestedOnly(content: string, options?: AIProviderOptions): string {
  const schema = options?.responseSchema?.schema as Json | undefined;
  if (!schema) return content;
  const parsed = JSON.parse(content) as Json;

  const shape = (answer: Json, item: Json): Json => {
    const keys = Object.keys(item.properties as Json);
    return Object.fromEntries(keys.map((key) => [key, key in answer ? answer[key] : null]));
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
