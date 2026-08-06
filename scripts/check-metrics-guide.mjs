#!/usr/bin/env node
/**
 * Verifies that the metrics guide documents the whole metric vocabulary.
 *
 * The schema decides which `type` and `unit` values exist; the guide decides
 * which combinations mean anything. Extending the enum without touching the
 * guide leaves a value that validates but has no documented unit — which is how
 * eleven types and five units shipped undocumented.
 *
 * This only checks coverage, in the direction that can be checked mechanically:
 * every enum member must appear in the guide. Whether a documented pairing is
 * *sensible* is a human judgement and stays one.
 *
 *   node scripts/check-metrics-guide.mjs
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GUIDE = join(ROOT, 'specification/metrics-guide.md');
const SCHEMA = join(
  ROOT,
  'specification/schemas/exercises/v1.1.0/exercise.schema.json'
);

const schema = JSON.parse(await readFile(SCHEMA, 'utf8'));
const guide = await readFile(GUIDE, 'utf8');

// Only inline-code spans count. A bare word in prose is not documentation of a
// vocabulary member — `rest` the metric must be distinguishable from rest the
// English word.
//
// Fenced blocks are stripped first: their backticks would otherwise pair with
// the surrounding prose and swallow whole paragraphs into one "span".
const prose = guide.replace(/^```[\s\S]*?^```/gm, '');
const mentioned = new Set(
  [...prose.matchAll(/`([^`\n]+)`/g)].map((match) => match[1].trim())
);

const missing = [];
for (const [name, values] of [
  ['metricType', schema.$defs.metricType.enum],
  ['metricUnit', schema.$defs.metricUnit.enum],
]) {
  for (const value of values) {
    if (!mentioned.has(value)) missing.push(`${name}: ${value}`);
  }
  console.log(`${values.length} ${name} values checked`);
}

if (missing.length) {
  console.error(
    `\n${missing.length} vocabulary value(s) missing from specification/metrics-guide.md:\n`
  );
  for (const entry of missing) console.error(`  ${entry}`);
  console.error('\nDocument each one with at least one valid unit.');
  process.exit(1);
}

console.log('\nEvery metric type and unit is documented in the metrics guide.');
