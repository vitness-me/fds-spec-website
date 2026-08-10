#!/usr/bin/env node
/**
 * Every scenario in the coverage matrix has a worked, validating example.
 *
 * The epic these schemas belong to states it plainly: no scenario without an
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
 * Validation of the examples themselves is the ordinary CI job: they live beside
 * their schema and are checked against it like any other entity example. This
 * check is only about coverage and explanation.
 *
 *   node scripts/check-scenarios.mjs
 */

import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkReadmeIndex } from './lib/fixture-readme.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * One entity's examples, and the matrix sections they answer.
 *
 * `entity` is both the directory under specification/schemas and the filename
 * prefix, so `workout` covers specification/schemas/workout/v1.0.0 and files
 * named `workout.<row>.example.json`.
 */
const SUITES = [
  {
    entity: 'workout',
    version: 'v1.0.0',
    sections: [
      [
        '§4.1 set and rep schemes',
        [
          'straight', 'ramping', 'reverse-pyramid', 'drop-sets', 'rest-pause',
          'cluster', 'myo-reps', 'amrap-reps', 'top-set-backoff', 'wave-loading',
          'ladders', 'density', 'technical-failure', 'tempo-reps', 'paused-reps',
          'partials', 'one-and-a-half-reps', 'isometric-holds', 'timed-sets',
        ],
      ],
      [
        '§4.2 grouping structures',
        [
          'single', 'superset', 'triset', 'giant-set', 'compound-set',
          'antagonist-pairing', 'barbell-complex', 'circuit', 'emom',
          'amrap-block', 'for-time', 'chipper', 'tabata', 'ladder-circuit',
          'warmup-block', 'cooldown-block', 'finisher',
        ],
      ],
    ],
  },
  {
    entity: 'program',
    version: 'v1.0.0',
    sections: [
      [
        '§4.6 periodization models',
        [
          'linear', 'daily-undulating', 'weekly-undulating', 'block', 'conjugate',
          'percentage-waves', 'deload-weeks', 'double-progression', 'test-weeks',
          'conditional-branching', 'adaptive',
        ],
      ],
      [
        '§4.7 scheduling structures',
        [
          'fixed-weekday', 'relative-offsets', 'rolling', 'sequence',
          'optional-days', 'accessory-days', 'rest-days',
        ],
      ],
    ],
  },
];

const problems = [];
let rowTotal = 0;

for (const { entity, version, sections } of SUITES) {
  const dir = join(ROOT, 'specification/schemas', entity, version);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.example.json')).sort();
  const slugOf = new RegExp(`^${entity}\\.|\\.example\\.json$`, 'g');
  const present = new Set(files.map((f) => f.replace(slugOf, '')));

  for (const [section, rows] of sections) {
    rowTotal += rows.length;
    const missing = rows.filter((row) => !present.has(row));
    if (missing.length) {
      problems.push(
        `${section}: ${missing.length} row(s) with no worked example:\n` +
          missing.map((row) => `    ${entity}.${row}.example.json`).join('\n')
      );
    } else {
      console.log(`  ok    ${section} — all ${rows.length} rows`);
    }
  }

  // An example nobody planned for is not an error, but an example whose slug
  // does not match any row cannot be what its name claims — usually a typo that
  // also left a real row uncovered.
  const declared = new Set(sections.flatMap(([, rows]) => rows));
  const unmatched = [...present].filter((slug) => !declared.has(slug));
  if (unmatched.length) {
    problems.push(
      `${entity}: ${unmatched.length} example(s) match no row in the matrix:\n` +
        unmatched.map((slug) => `    ${entity}.${slug}.example.json`).join('\n') +
        '\n    Either the slug is misspelled, or the row belongs in this file.'
    );
  }

  const { problems: readmeProblems } = await checkReadmeIndex(dir, files, [
    `${entity}.schema.json`,
  ]);
  problems.push(...readmeProblems.map((p) => `${entity}: ${p}`));
  if (!readmeProblems.length) {
    console.log(`  ok    ${entity} readme — all ${files.length} examples documented`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`\nEvery scenario in the matrix has a worked example: ${rowTotal} rows.`);
