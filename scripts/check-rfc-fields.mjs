#!/usr/bin/env node
/**
 * Cross-checks an RFC against the schema it specifies, in both directions.
 *
 * Two failures this repository has already shipped, one of each kind:
 *
 *   - RFC-005 documented `localized` normatively; the body-atlas schema omitted
 *     it under `additionalProperties: false`, so the published example did not
 *     validate against its own schema.
 *   - The prescription schema promised that RFC-006 documented the conventional
 *     `setScheme` parameters. It did not.
 *
 * Prose and schema drift apart quietly because nothing reads both. This does.
 *
 * Forward:  every field and enum value the schema *authors* appears in the RFC.
 * Backward: every identifier the RFC writes in code style exists in the schema.
 *
 * Only authored definitions count. A flattened copy of `metadata` belongs to
 * RFC-001, and demanding RFC-007 re-document it would be asking every RFC to
 * restate the envelope.
 *
 *   node scripts/check-rfc-fields.mjs
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * RFCs that specify a schema of their own.
 *
 * RFC-001..005 predate this check and are not yet clean against it; retrofitting
 * them is tracked separately rather than bundled into an unrelated change.
 */
const PAIRS = [
  {
    rfc: 'specification/rfc/rfc-006-prescription-primitives.md',
    source: 'specification/schema-sources/prescription/v1.0.0/prescription.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-007-workout-data-model.md',
    source: 'specification/schema-sources/workout/v1.0.0/workout.schema.json',
  },
];

/**
 * Words an RFC may legitimately write in code style without them being fields:
 * JSON Schema keywords it explains, units and scale labels it names, and the
 * handful of literals that appear in prose.
 */
const PROSE = new Set([
  // JSON Schema keywords an RFC explains
  'additionalProperties', 'oneOf', 'anyOf', 'allOf', 'not', 'enum', 'const',
  'required', 'string', 'number', 'integer', 'boolean', 'object', 'array',
  'true', 'false', 'null', 'items', 'properties', 'defs', 'examples',
  // Field names from *other* formats, cited as anti-examples in RFC-007 §1.1
  'isCircuit', 'emomInterval', 'tabataRounds',
  // Conventional setScheme.params keys. Deliberately outside the schema —
  // `params` is open precisely so eleven methodologies are not frozen at 1.0.0
  // — but RFC-006 §4.6 documents them, so they appear in prose by design.
  'activationReps', 'backoffPercent', 'backoffSets', 'direction', 'dropPercent',
  'drops', 'endPercent', 'intraSetRest', 'miniSetReps', 'miniSets', 'repPattern',
  'repsPerCluster', 'restUnit', 'rungs', 'startPercent', 'target', 'timeUnit',
  'waves',
]);

const walk = (node, visit) => {
  if (Array.isArray(node)) return node.forEach((v) => walk(v, visit));
  if (!node || typeof node !== 'object') return;
  visit(node);
  Object.values(node).forEach((v) => walk(v, visit));
};

/**
 * Names a schema authors: property names, definition names, and `const`
 * discriminator values.
 *
 * `enum` values are excluded from the *forward* requirement. They are mostly
 * shared vocabulary owned elsewhere — units belong to RFC-001's metric guide,
 * not to every RFC that happens to reference a duration — and demanding each
 * one be named turns the check into noise. Discriminators are different: they
 * select structure, so they are written with `const` and are required.
 */
function vocabularyOf(schema, { includeEnums = false } = {}) {
  const names = new Set(Object.keys(schema.$defs ?? {}));
  walk(schema, (node) => {
    if (node.properties && typeof node.properties === 'object') {
      for (const key of Object.keys(node.properties)) names.add(key);
    }
    if (typeof node.const === 'string') names.add(node.const);
    if (includeEnums && Array.isArray(node.enum)) {
      for (const value of node.enum) if (typeof value === 'string') names.add(value);
    }
    // Recommended values for an open classifier. Not constraints, but the
    // schema does name them, so an RFC citing one is not inventing it.
    if (includeEnums && Array.isArray(node.examples)) {
      for (const value of node.examples) if (typeof value === 'string') names.add(value);
    }
  });
  return names;
}

/**
 * Everything any FDS schema defines.
 *
 * An RFC legitimately names fields it does not own — RFC-007 refers to
 * `loadTarget`, `metadata` and `schemaVersion` constantly. The backward check
 * is looking for *invented* fields, so it asks whether a name exists anywhere
 * in the standard, not whether this one schema declares it.
 */
async function globalVocabulary() {
  const sources = [
    'specification/schema-sources/common/v1.0.0/common.schema.json',
    'specification/schema-sources/exercises/v1.1.0/exercise.schema.json',
    'specification/schema-sources/equipment/v1.1.0/equipment.schema.json',
    'specification/schema-sources/muscle/v1.0.0/muscle.schema.json',
    'specification/schema-sources/muscle/muscle-category/v1.0.0/muscle-category.schema.json',
    'specification/schema-sources/atlas/v1.0.0/body-atlas.schema.json',
    'specification/schema-sources/prescription/v1.0.0/prescription.schema.json',
    'specification/schema-sources/workout/v1.0.0/workout.schema.json',
  ];
  const all = new Set();
  for (const rel of sources) {
    const schema = JSON.parse(await readFile(join(ROOT, rel), 'utf8'));
    for (const name of vocabularyOf(schema, { includeEnums: true })) all.add(name);
  }
  return all;
}

const GLOBAL = await globalVocabulary();
const problems = [];

for (const { rfc, source } of PAIRS) {
  const schema = JSON.parse(await readFile(join(ROOT, source), 'utf8'));
  const doc = await readFile(join(ROOT, rfc), 'utf8');

  // Fenced blocks are stripped: a field appearing only inside a JSON example is
  // shown, not explained, and backticks inside a fence pair with the wrong ones.
  const prose = doc.replace(/^```[\s\S]*?^```/gm, '');
  const spans = new Set(
    [...prose.matchAll(/`([^`\n]+)`/g)].map((m) => m[1].trim())
  );

  // Forward: any identifier appearing anywhere inside a code span counts as
  // mentioned, so `items[].groupLabel` and `{ id, trigger, action }` both
  // document each name they contain.
  const mentioned = new Set();
  for (const span of spans) {
    for (const word of span.match(/[A-Za-z][A-Za-z0-9_]*/g) ?? []) mentioned.add(word);
  }

  // Backward: only whole spans that are a bare identifier. A fragment of a URL
  // or filename is not a claim that a field exists.
  const claimed = [...spans].filter((span) => /^[a-z][A-Za-z0-9]*$/.test(span));

  const vocabulary = vocabularyOf(schema);

  const undocumented = [...vocabulary].filter((name) => !mentioned.has(name)).sort();
  if (undocumented.length) {
    problems.push(
      `${rfc}\n    does not document ${undocumented.length} name(s) the schema defines:\n` +
        `      ${undocumented.join(', ')}`
    );
  }

  const invented = [...new Set(claimed)]
    .filter((token) => !GLOBAL.has(token) && !PROSE.has(token))
    .sort();
  if (invented.length) {
    problems.push(
      `${rfc}\n    writes ${invented.length} identifier(s) the schema does not define:\n` +
        `      ${invented.join(', ')}\n` +
        '      Either the schema is missing them, or they belong in the PROSE allowlist.'
    );
  }

  if (!undocumented.length && !invented.length) {
    console.log(`  ok    ${rfc} — ${vocabulary.size} names, both directions`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log('\nEvery RFC documents its schema, and documents nothing the schema lacks.');
