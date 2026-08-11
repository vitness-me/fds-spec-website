/**
 * Every name the FDS schemas define, read from the schemas themselves.
 *
 * Two checks need this and neither should restate it: the RFC cross-check asks
 * whether a document invents a field, and the skill check asks whether the
 * knowledge base does. Both questions are "does this name exist in the
 * standard", and the answer has exactly one source.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** Every authoring source. A schema missing here is invisible to both checks. */
export const SCHEMA_SOURCES = [
  'specification/schema-sources/common/v1.0.0/common.schema.json',
  'specification/schema-sources/exercises/v1.1.0/exercise.schema.json',
  'specification/schema-sources/equipment/v1.1.0/equipment.schema.json',
  'specification/schema-sources/muscle/v1.0.0/muscle.schema.json',
  'specification/schema-sources/muscle/muscle-category/v1.0.0/muscle-category.schema.json',
  'specification/schema-sources/atlas/v1.0.0/body-atlas.schema.json',
  'specification/schema-sources/prescription/v1.0.0/prescription.schema.json',
  'specification/schema-sources/workout/v1.1.0/workout.schema.json',
  'specification/schema-sources/program/v1.0.0/program.schema.json',
];

export const walk = (node, visit) => {
  if (Array.isArray(node)) return node.forEach((v) => walk(v, visit));
  if (!node || typeof node !== 'object') return;
  visit(node);
  Object.values(node).forEach((v) => walk(v, visit));
};

/**
 * Names a single schema authors: property names, definition names, and `const`
 * discriminator values.
 *
 * With `includeEnums`, also every `enum` member and every `examples` entry.
 * Those are excluded by default because a *forward* requirement over them is
 * noise — units belong to the metric guide, not to every document that mentions
 * a duration — but they are legitimate vocabulary for a backward check.
 */
export function vocabularyOf(schema, { includeEnums = false } = {}) {
  const names = new Set(Object.keys(schema.$defs ?? {}));
  walk(schema, (node) => {
    if (node.properties && typeof node.properties === 'object') {
      for (const key of Object.keys(node.properties)) names.add(key);
    }
    if (typeof node.const === 'string') names.add(node.const);
    if (includeEnums && Array.isArray(node.enum)) {
      for (const value of node.enum) if (typeof value === 'string') names.add(value);
    }
    if (includeEnums && Array.isArray(node.examples)) {
      for (const value of node.examples) if (typeof value === 'string') names.add(value);
    }
  });
  return names;
}

/**
 * Everything any FDS schema defines, enums and recommended values included.
 *
 * A document legitimately names fields it does not own — RFC-007 refers to
 * `loadTarget` and `metadata` constantly — so the question is whether a name
 * exists anywhere in the standard, not whether one schema declares it.
 */
export async function globalVocabulary() {
  const all = new Set();
  for (const rel of SCHEMA_SOURCES) {
    const schema = JSON.parse(await readFile(join(ROOT, rel), 'utf8'));
    for (const name of vocabularyOf(schema, { includeEnums: true })) all.add(name);
  }
  return all;
}

/**
 * The vocabulary a *reader* of one schema is expected to know: every property
 * name, every `enum` member, every `const` discriminator.
 *
 * This is `vocabularyOf` asked in the other direction. That function answers
 * "may a document name this?", so it is generous — it includes `$defs` keys and
 * `examples` entries, because naming either of those is legitimate. This answers
 * "must documentation teach this?", so it excludes both:
 *
 *   - `$defs` keys are internal identifiers. `blockItem` and `setPrescription`
 *     are how the schema refers to itself; nobody writes them in a document, and
 *     requiring a knowledge base to recite them teaches nothing.
 *   - `examples` are *recommended* values, not the vocabulary. Which values are
 *     recommended is `check:registries`' question, and answering it twice means
 *     two places to update when a registry gains an entry.
 *
 * What is left is exactly the set a document author can get wrong: the names
 * they type and the closed vocabularies they must choose from.
 */
export function documentableVocabulary(schema) {
  const names = new Set();
  walk(schema, (node) => {
    if (node.properties && typeof node.properties === 'object') {
      for (const key of Object.keys(node.properties)) names.add(key);
    }
    if (typeof node.const === 'string') names.add(node.const);
    if (Array.isArray(node.enum)) {
      for (const value of node.enum) if (typeof value === 'string') names.add(value);
    }
  });
  return names;
}

/**
 * The transformer mapping schema's vocabulary.
 *
 * Deliberately not in `SCHEMA_SOURCES`. That list is the *standard*, and the
 * mapping schema configures a tool — `build-schemas.mjs` marks it `kind:
 * "tooling"` and no release names it. Folding it into `globalVocabulary` would
 * quietly let an RFC invent `fuzzyMatch` and pass.
 *
 * A knowledge base that teaches transformation does need it, though: a worked
 * mapping config names `from`, `transform` and `registries`, and none of those
 * is an FDS field. So it is loaded separately, by the one check that wants it.
 *
 * Read from the published copy rather than an authoring source because there is
 * no source — `build-schemas.mjs` publishes this schema as written.
 */
export async function mappingVocabulary() {
  const schema = JSON.parse(
    await readFile(join(ROOT, 'specification/schemas/transformer/v1.0.0/mapping.schema.json'), 'utf8')
  );
  return vocabularyOf(schema, { includeEnums: true });
}
