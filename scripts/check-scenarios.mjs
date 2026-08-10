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
 * Sections §4.1 to §4.7 are enumerated below — 87 rows, the whole of what this
 * batch of RFCs is answerable for. The two remaining sections are absent on
 * purpose:
 *
 *   §4.8 logging — performed data, which is RFC-009. Deferred pending a consent
 *   and privacy model, not pending schema design. No schema here can carry an
 *   example of it, because the thing being logged does not exist yet.
 *
 *   §4.9 cross-cutting — concerns rather than scenarios. Several are already
 *   settled and their answers live in the documents rather than in fixtures:
 *   plate increments belong to equipment, program authorship and licensing to
 *   RFC-008 §4.8, and "logs are PII" is the reason §4.8 is deferred at all. The
 *   rest — per-record units, local date versus UTC instant, sync idempotency,
 *   coach-to-athlete assignment — are RFC-009 questions for the same reason.
 *
 * Adding a section here without adding its examples fails, which is the point.
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
 * `entity` is the directory under specification/schemas and, by default, the
 * filename prefix — `workout` covers specification/schemas/workout/v1.0.0 and
 * files named `workout.<row>.example.json`.
 *
 * The prescription fixtures are named for the *definition* they exemplify
 * rather than the entity, so that suite sets `prefixed: false` and its rows are
 * full basenames. It also opts out of the unmatched-example and README rules:
 * check:prescription already enforces both, against a different and stricter
 * standard, and running two checks over the same list means fixing a rename in
 * two places.
 */
const SUITES = [
  {
    entity: 'workout',
    version: 'v1.1.0',
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
        '§4.4 cardio and endurance',
        [
          'duration', 'distance', 'pace', 'hr-zone', 'power-zone',
          'structured-intervals', 'fartlek', 'machine-settings',
          'negative-splits', 'progressive',
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
    entity: 'prescription',
    version: 'v1.0.0',
    prefixed: false,
    allowUnmatched: true,
    checkReadme: false,
    sections: [
      [
        '§4.3 load prescription',
        [
          'loadTarget.absolute', 'loadTarget.percent1RM', 'loadTarget.percent-bodyweight',
          'loadTarget.rpe', 'loadTarget.rir', 'loadTarget.velocity-with-loss-threshold',
          'loadTarget.machine-level', 'loadTarget.band-resistance', 'loadTarget.autoregulated',
          'loadTarget.relative-last-session', 'loadTarget.relative-e1rm',
          'loadTarget.relative-training-max', 'loadTarget.percent1RM-of-another-lift',
          'loadTarget.bodyweight', 'loadTarget.assisted',
        ],
      ],
      [
        '§4.5 rest',
        [
          'restSpec.fixed', 'restSpec.range', 'restSpec.to-heart-rate', 'restSpec.as-needed',
          'restSpec.work-to-rest-ratio',
          'restScope.set', 'restScope.group', 'restScope.round',
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

for (const suite of SUITES) {
  const { entity, version, sections, prefixed = true, allowUnmatched = false, checkReadme = true } = suite;
  const dir = join(ROOT, 'specification/schemas', entity, version);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.example.json')).sort();
  const slugOf = prefixed
    ? new RegExp(`^${entity}\\.|\\.example\\.json$`, 'g')
    : /\.example\.json$/g;
  const name = (row) => (prefixed ? `${entity}.${row}.example.json` : `${row}.example.json`);
  const present = new Set(files.map((f) => f.replace(slugOf, '')));

  for (const [section, rows] of sections) {
    rowTotal += rows.length;
    const missing = rows.filter((row) => !present.has(row));
    if (missing.length) {
      problems.push(
        `${section}: ${missing.length} row(s) with no worked example:\n` +
          missing.map((row) => `    ${name(row)}`).join('\n')
      );
    } else {
      console.log(`  ok    ${section} — all ${rows.length} rows`);
    }
  }

  // An example nobody planned for is not an error, but an example whose slug
  // does not match any row cannot be what its name claims — usually a typo that
  // also left a real row uncovered.
  const declared = new Set(sections.flatMap(([, rows]) => rows));
  const unmatched = allowUnmatched ? [] : [...present].filter((slug) => !declared.has(slug));
  if (unmatched.length) {
    problems.push(
      `${entity}: ${unmatched.length} example(s) match no row in the matrix:\n` +
        unmatched.map((slug) => `    ${name(slug)}`).join('\n') +
        '\n    Either the slug is misspelled, or the row belongs in this file.'
    );
  }

  if (checkReadme) {
    const { problems: readmeProblems } = await checkReadmeIndex(dir, files, [
      `${entity}.schema.json`,
    ]);
    problems.push(...readmeProblems.map((p) => `${entity}: ${p}`));
    if (!readmeProblems.length) {
      console.log(`  ok    ${entity} readme — all ${files.length} examples documented`);
    }
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`\nEvery scenario in the matrix has a worked example: ${rowTotal} rows.`);
