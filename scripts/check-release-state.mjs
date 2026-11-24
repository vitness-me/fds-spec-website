#!/usr/bin/env node
/**
 * The current release is published only when it is frozen and dated.
 *
 * A release can be prepared on a branch before the RFC that introduces it is
 * accepted: the schemas, the manifest naming it as `currentRelease`, the
 * transformer bundling it. Everything about it is ready except the two things
 * acceptance decides — that its bytes may never change again, and the date it
 * shipped. Until then, publishing it would serve a URL as current whose bytes
 * are still allowed to move, under a changelog entry that says it has not been
 * released.
 *
 * So the deploy and publish workflows run this before anything leaves the
 * repository, and it fails unless:
 *
 *   1. every schema version the current release names is `frozen: true` in
 *      the manifest, and
 *   2. the changelog section that introduces the current release carries the
 *      date it shipped in its heading, `(YYYY-MM-DD)`.
 *
 * The change that accepts the RFC makes both true in one merge: it flips the
 * new versions' `frozen` flags in `specification/schemas/.integrity.json`,
 * rebuilds the manifest, and dates the changelog heading.
 *
 * It does not run on pull requests. A branch that prepares a release is
 * expected to fail it, and that is not a defect in the branch: it is the state
 * the release is in until acceptance. CI runs the self-test, which proves the
 * guard still refuses an unfrozen or undated release.
 *
 *   node scripts/check-release-state.mjs              check the repository
 *   node scripts/check-release-state.mjs --self-test  prove it fails on the fixtures
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRecordedFailures } from './lib/self-test.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SELF_TEST = process.argv.includes('--self-test');
const FIXTURES = join(REPO, 'scripts/fixtures/release-state');
const ROOT = SELF_TEST ? FIXTURES : REPO;
const MANIFEST = 'specification/releases.json';
const CHANGELOG = 'specification/governance/CHANGELOG.md';
const INTEGRITY = 'specification/schemas/.integrity.json';

const problems = [];
const fail = (key, message) => problems.push({ key, message });

const manifest = JSON.parse(await readFile(join(ROOT, MANIFEST), 'utf8'));
const release = manifest.currentRelease;
const named = { ...manifest.releases[release]?.entities, ...manifest.releases[release]?.libraries };

for (const [name, version] of Object.entries(named)) {
  const entry = manifest.schemas[name]?.versions?.[version];
  if (entry?.frozen !== true) {
    fail(
      `unfrozen:${name}@${version}`,
      `${MANIFEST}: release ${release} is current and names ${name} ${version}, which is not frozen.\n` +
        `    A release is published frozen. If its RFC is accepted, set "frozen": true for ${entry?.path ?? `${name} ${version}`}\n` +
        `    in ${INTEGRITY}, run \`npm run build:schemas\`, and date the changelog entry in the same change.`
    );
  }
}

// The section that introduces the release is the one whose text says "Release **<version>** names".
const changelog = await readFile(join(ROOT, CHANGELOG), 'utf8');
const sections = changelog.split(/^(?=## )/m);
const introducing = sections.find((s) => s.includes(`Release **${release}** names`));
if (introducing === undefined) {
  fail('no-entry', `${CHANGELOG}: no section says "Release **${release}** names …". The current release needs its changelog entry.`);
} else {
  const heading = introducing.split('\n')[0];
  if (!/\(\d{4}-\d{2}-\d{2}\)\s*$/.test(heading)) {
    fail(
      'undated',
      `${CHANGELOG}: the entry for release ${release} is not dated: "${heading}".\n` +
        '    A release is published with the date it shipped. Write it in the heading, "(YYYY-MM-DD)", in the change that accepts its RFC.'
    );
  }
}

if (SELF_TEST) await assertRecordedFailures(join(FIXTURES, 'expected-failures.txt'), problems.map((p) => p.key));

if (problems.length) {
  console.error(`\n${problems.length} problem(s): release ${release} is not ready to publish.\n`);
  for (const p of problems) console.error(`  ${p.message}\n`);
  process.exit(1);
}
console.log(`  ok    release ${release} is frozen and dated: ${Object.keys(named).length} schema versions frozen.`);
