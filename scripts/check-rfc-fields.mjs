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
import { globalVocabulary, vocabularyOf } from './lib/vocabulary.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * RFCs that specify a schema of their own. All of them.
 *
 * RFC-001..005 predated this check and carried 60 measured gaps between them —
 * every one a field the schema defined that the RFC only ever showed inside a
 * JSON block. Showing a field is not documenting it: a reader learns the name
 * exists and nothing about what it means.
 */
const PAIRS = [
  {
    rfc: 'specification/rfc/rfc-001-exercise-data-model.md',
    source: 'specification/schema-sources/exercises/v1.1.0/exercise.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-002-equipment-data-model.md',
    source: 'specification/schema-sources/equipment/v1.1.0/equipment.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-003-muscle-data-model.md',
    source: 'specification/schema-sources/muscle/v1.0.0/muscle.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-004-muscle-category-data-model.md',
    source: 'specification/schema-sources/muscle/muscle-category/v1.0.0/muscle-category.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-005-body-atlas-data-model.md',
    source: 'specification/schema-sources/atlas/v1.0.0/body-atlas.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-006-prescription-primitives.md',
    source: 'specification/schema-sources/prescription/v1.0.0/prescription.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-007-workout-data-model.md',
    source: 'specification/schema-sources/workout/v1.1.0/workout.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-008-program-data-model.md',
    source: 'specification/schema-sources/program/v1.0.0/program.schema.json',
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
