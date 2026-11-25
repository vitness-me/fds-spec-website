#!/usr/bin/env node
/**
 * The current release is published only when it is frozen, dated and accepted.
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
 *      date it shipped in its heading, `(YYYY-MM-DD)`, and
 *   3. every RFC that proposes the current release (its text says
 *      "Release **<version>**") has the status Accepted, and
 *   4. once such an RFC is Accepted, no document still calls it a draft: no
 *      line outside the RFC's own pages that names the RFC (`RFC-010`) or a
 *      word of its title (`Structural`, `Descriptors`, `FXI`) together with
 *      "draft", or the Spanish "borrador" or Serbian "nacrt". Fenced code is
 *      skipped, and so is a line that names a header without a revision
 *      (`FXI=1/`): its "draft" is the pre-release string format, in every
 *      locale.
 *
 * The change that accepts the RFC makes all four true in one merge: it sets
 * the RFC's status, flips the new versions' `frozen` flags in
 * `specification/schemas/.integrity.json`, rebuilds the manifest, dates the
 * changelog heading, and drops every draft label, translations included.
 *
 * It does not run on pull requests. A branch that prepares a release is
 * expected to fail it, and that is not a defect in the branch: it is the state
 * the release is in until acceptance. CI runs the self-test, which proves the
 * guard still refuses an unfrozen or undated release.
 *
 *   node scripts/check-release-state.mjs              check the repository
 *   node scripts/check-release-state.mjs --self-test  prove it fails on the fixtures
 */

import { readFile, readdir, stat } from 'node:fs/promises';
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

// An RFC that proposes the release names it the way the changelog does.
const RFC_DIR = 'specification/rfc';
const accepted = [];
for (const file of (await readdir(join(ROOT, RFC_DIR)).catch(() => [])).filter((f) => /^rfc-\d+.*\.md$/.test(f)).sort()) {
  const text = await readFile(join(ROOT, RFC_DIR, file), 'utf8');
  if (!text.includes(`Release **${release}**`)) continue;
  const status = /^\*\*Status\*\*:\s*(.+)$/m.exec(text)?.[1]?.trim();
  if (status === 'Accepted') accepted.push({ file, text });
  else {
    fail(
      `rfc-status:${file}`,
      `${RFC_DIR}/${file}: proposes release ${release}, and its status is "${status ?? '(none)'}".\n` +
        '    A release is published only once the RFC that proposes it is accepted. Set "**Status**: Accepted" in the change that accepts it.'
    );
  }
}

// An accepted RFC is not a draft anywhere: not in a page, a translation, a package README or a sidebar label.
const SCAN_ROOTS = ['README.md', 'specification', 'packages', 'website/docs', 'website/i18n', 'website/src', 'website/sidebars.ts'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.docusaurus', 'coverage', 'test', 'tests', 'fixtures']);
const SCANNED = /\.(md|mdx|json|ts|tsx)$/;
const DRAFT = /\bdraft\b|\bborrador|\bnacrt/i;
const PRE_RELEASE_HEADER = /\b[A-Z]{3}=\d+\//;

async function scannedFiles(rel) {
  const s = await stat(join(ROOT, rel)).catch(() => null);
  if (s === null) return [];
  if (s.isFile()) return SCANNED.test(rel) ? [rel] : [];
  const out = [];
  for (const entry of await readdir(join(ROOT, rel), { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    out.push(...(await scannedFiles(`${rel}/${entry.name}`)));
  }
  return out;
}

/** The lines of a file that are not inside a Markdown code fence, with their 1-based numbers. */
function proseLines(rel, text) {
  const lines = text.split('\n').map((line, i) => ({ line, n: i + 1 }));
  if (!/\.mdx?$/.test(rel)) return lines;
  let fenced = false;
  return lines.filter(({ line }) => {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return false; }
    return !fenced;
  });
}

if (accepted.length) {
  const files = (await Promise.all(SCAN_ROOTS.map(scannedFiles))).flat();
  for (const { file, text } of accepted) {
    const number = /^rfc-(\d+)/.exec(file)[1];
    const id = `RFC-${number}`;
    const title = /^# RFC-\d+:\s*(.+)$/m.exec(text)?.[1] ?? '';
    const words = [...new Set(title.split(/[^A-Za-z]+/).filter((w) => w.length >= 3 && /^[A-Z]/.test(w)))];
    // A title word matches as a word stem, so "Descriptors" also finds "descriptor" and "descriptores"; an acronym matches whole.
    const subject = [id, ...words.map((w) => (w === w.toUpperCase() ? `\\b${w}\\b` : `\\b${w.replace(/s$/, '')}`))];
    const names = new RegExp(subject.join('|'), 'i');
    for (const rel of files) {
      if (rel.split('/').pop().startsWith(`rfc-${number}-`)) continue;
      for (const { line, n } of proseLines(rel, await readFile(join(ROOT, rel), 'utf8'))) {
        if (!DRAFT.test(line) || !names.test(line) || PRE_RELEASE_HEADER.test(line)) continue;
        fail(
          `draft-label:${rel}:${n}`,
          `${rel}:${n}: ${id} is Accepted, and this line still calls it a draft:\n      ${line.trim()}\n` +
            '    Drop the draft label in the change that accepts the RFC, in every locale.'
        );
      }
    }
  }
}

if (SELF_TEST) await assertRecordedFailures(join(FIXTURES, 'expected-failures.txt'), problems.map((p) => p.key));

if (problems.length) {
  console.error(`\n${problems.length} problem(s): release ${release} is not ready to publish.\n`);
  for (const p of problems) console.error(`  ${p.message}\n`);
  process.exit(1);
}
console.log(`  ok    release ${release} is frozen, dated and accepted: ${Object.keys(named).length} schema versions frozen.`);
