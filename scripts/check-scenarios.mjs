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
 * The rows are `scripts/lib/coverage-matrix.mjs`. They are declared rather than
 * derived, because they come from a planning document and not from any schema —
 * there is nothing to read them out of. Adding a row there without adding an
 * example fails, which is the point. They sit in `lib/` rather than here
 * because `check:versions` counts them too, and the count documentation quotes
 * has to be the same list this check walks.
 *
 * Validation of the examples themselves is the ordinary CI job: they live beside
 * their schema and are checked against it like any other entity example. This
 * check is only about coverage and explanation.
 *
 * Sections §4.1 to §4.7 are enumerated there — 87 rows, the whole of what this
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
 * Adding a section without adding its examples fails, which is the point.
 *
 *   node scripts/check-scenarios.mjs
 */

import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkReadmeIndex } from './lib/fixture-readme.mjs';
// The matrix itself lives in scripts/lib/ because check:versions asserts the
// row count documentation quotes. One list, two readers.
import { SUITES } from './lib/coverage-matrix.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

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
