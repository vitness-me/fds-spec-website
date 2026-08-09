#!/usr/bin/env node
/**
 * Every scenario in the coverage matrix has a worked, validating example.
 *
 * The epic this schema belongs to states it plainly: no scenario without an
 * example ships. That is a promise about a list of training structures, and a
 * list is exactly the sort of thing that quietly falls out of date — a row gets
 * added to the plan, nobody notices the example is missing, and the standard
 * claims coverage it does not have.
 *
 * The rows below are the matrix. They are declared here rather than derived,
 * because they come from a planning document and not from any schema — there is
 * nothing to read them out of. Adding a row here without adding an example
 * fails, which is the point.
 *
 * Validation of the examples themselves is the ordinary CI job: they live in the
 * workout directory and are checked against the workout schema like any other
 * entity example. This check is only about coverage and explanation.
 *
 *   node scripts/check-scenarios.mjs
 */

import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkReadmeIndex } from './lib/fixture-readme.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'specification/schemas/workout/v1.0.0');

/** §4.1 — set and rep schemes. */
const SET_REP_SCHEMES = [
  'straight',
  'ramping',
  'reverse-pyramid',
  'drop-sets',
  'rest-pause',
  'cluster',
  'myo-reps',
  'amrap-reps',
  'top-set-backoff',
  'wave-loading',
  'ladders',
  'density',
  'technical-failure',
  'tempo-reps',
  'paused-reps',
  'partials',
  'one-and-a-half-reps',
  'isometric-holds',
  'timed-sets',
];

/** §4.2 — grouping structures. */
const GROUPING_STRUCTURES = [
  'single',
  'superset',
  'triset',
  'giant-set',
  'compound-set',
  'antagonist-pairing',
  'barbell-complex',
  'circuit',
  'emom',
  'amrap-block',
  'for-time',
  'chipper',
  'tabata',
  'ladder-circuit',
  'warmup-block',
  'cooldown-block',
  'finisher',
];

const MATRIX = [
  ['§4.1 set and rep schemes', SET_REP_SCHEMES],
  ['§4.2 grouping structures', GROUPING_STRUCTURES],
];

const files = (await readdir(DIR)).filter((f) => f.endsWith('.example.json'));
const present = new Set(files.map((f) => f.replace(/^workout\.|\.example\.json$/g, '')));

const problems = [];

for (const [section, rows] of MATRIX) {
  const missing = rows.filter((row) => !present.has(row));
  if (missing.length) {
    problems.push(
      `${section}: ${missing.length} row(s) with no worked example:\n` +
        missing.map((row) => `    workout.${row}.example.json`).join('\n')
    );
  } else {
    console.log(`  ok    ${section} — all ${rows.length} rows`);
  }
}

// An example nobody planned for is not an error, but an example whose slug does
// not match any row cannot be what its name claims — usually a typo that also
// left a real row uncovered.
const declared = new Set(MATRIX.flatMap(([, rows]) => rows));
const unmatched = [...present].filter((slug) => !declared.has(slug));
if (unmatched.length) {
  problems.push(
    `${unmatched.length} example(s) match no row in the matrix:\n` +
      unmatched.map((slug) => `    workout.${slug}.example.json`).join('\n') +
      '\n    Either the slug is misspelled, or the row belongs in this file.'
  );
}

const { problems: readmeProblems } = await checkReadmeIndex(DIR, files.sort(), [
  'workout.schema.json',
]);
problems.push(...readmeProblems);
if (!readmeProblems.length) {
  console.log(`  ok    readme  all ${files.length} examples documented`);
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `\nEvery scenario in the matrix has a worked example: ${declared.size} rows.`
);
