#!/usr/bin/env node
/**
 * Which packages a run of `.github/workflows/publish.yml` publishes.
 *
 * A package is published when the version in its `package.json` is not on npm.
 * Nothing else decides it: no tag, no input, no list kept here. Every
 * `packages/<dir>/package.json` that is not `private` is a candidate, so a new
 * public package is covered the day it lands.
 *
 * A candidate whose version is already on npm is skipped. A candidate whose
 * version is not on npm must also be releasable, or the plan fails before
 * anything is built:
 *
 *   - the version is higher than the one npm calls `latest`. `npm publish`
 *     moves `latest` to whatever it publishes, so a lower version would become
 *     what `npm install` resolves;
 *   - its CHANGELOG.md has a `## [<version>]` section, which becomes the
 *     GitHub release notes;
 *   - no git tag `<dir>@<version>` exists yet. A tag for a version npm does not
 *     have points at a commit that did not publish; tagging another commit with
 *     the same name would be a lie, and reusing it would publish code the tag
 *     does not name.
 *
 * Any npm answer other than "found" or "E404 not found" fails the plan: a
 * registry outage must not read as "nothing is published, publish everything".
 *
 * ── running it ───────────────────────────────────────────────────────────────
 *
 *   node scripts/publish-plan.mjs              print the plan
 *   node scripts/publish-plan.mjs --github     also write `packages` and `any`
 *                                              to $GITHUB_OUTPUT
 *   node scripts/publish-plan.mjs --self-test  the rules, offline
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const ok = (message) => console.log(`  \x1b[32mok\x1b[0m    ${message}`);

function fail(problems) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('');
  process.exit(1);
}

/** Numeric compare of two `x.y.z` versions: negative, zero or positive. */
function compareVersions(a, b) {
  const parts = (value) => String(value).split(/[.-]/).slice(0, 3).map((n) => Number.parseInt(n, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i += 1) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

const hasChangelogSection = (changelog, version) =>
  new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm').test(changelog ?? '');

/**
 * The decision for one package, from facts gathered elsewhere.
 *
 * `registry` is `{ published, latest }`: whether this exact version is on npm,
 * and npm's `latest` dist-tag, or null when the package does not exist yet.
 */
function decide({ dir, name, version, registry, changelog, tagExists }) {
  if (registry.published) return { dir, name, version, publish: false, problems: [] };

  const problems = [];
  if (registry.latest && compareVersions(version, registry.latest) <= 0) {
    problems.push(
      `${name} ${version} is not on npm, but npm's latest is ${registry.latest}.\n` +
        '    Publishing it would move `latest` back to an older version. Bump the version\n' +
        `    in packages/${dir}/package.json above ${registry.latest}.`
    );
  }
  if (!hasChangelogSection(changelog, version)) {
    problems.push(
      `${name} ${version} is not on npm and packages/${dir}/CHANGELOG.md has no "## [${version}]" section.\n` +
        '    The section is the GitHub release notes. Move the Unreleased entries under it.'
    );
  }
  if (tagExists) {
    problems.push(
      `${name} ${version} is not on npm, but the tag ${dir}@${version} already exists.\n` +
        '    That tag names a commit that never published. Bump the version, or delete the tag\n' +
        `    if nothing else refers to it: git push origin :refs/tags/${dir}@${version}`
    );
  }
  return { dir, name, version, publish: true, problems };
}

// ── facts ────────────────────────────────────────────────────────────────────

/** Every non-private package under packages/, with its manifest and changelog. */
function candidates() {
  return readdirSync(join(ROOT, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(ROOT, 'packages', entry.name, 'package.json')))
    .map((entry) => {
      const dir = entry.name;
      const manifest = JSON.parse(readFileSync(join(ROOT, 'packages', dir, 'package.json'), 'utf8'));
      const changelogPath = join(ROOT, 'packages', dir, 'CHANGELOG.md');
      return {
        dir,
        name: manifest.name,
        version: manifest.version,
        private: manifest.private === true,
        changelog: existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8') : null,
      };
    })
    .filter((pkg) => !pkg.private)
    .sort((a, b) => a.dir.localeCompare(b.dir));
}

/** `npm view <name>` as JSON; null for E404, and a failure for anything else. */
function npmView(name) {
  const result = spawnSync('npm', ['view', name, '--json'], { cwd: ROOT, encoding: 'utf8' });
  if (result.error) fail([`could not run npm: ${result.error.message}`]);
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.status === 0) return JSON.parse(result.stdout);
  if (/\bE404\b/.test(output)) return null;
  fail([`npm view ${name} failed, and not with E404:\n${output.trim().replace(/^/gm, '      ')}`]);
}

function registryFacts(name, version) {
  const view = npmView(name);
  if (!view) return { published: false, latest: null };
  const versions = Array.isArray(view.versions) ? view.versions : [view.versions].filter(Boolean);
  return { published: versions.includes(version), latest: view['dist-tags']?.latest ?? null };
}

/** Whether `origin` has the tag. Asks the remote, so a shallow checkout does not matter. */
function tagExists(tag) {
  const result = spawnSync('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) fail([`git ls-remote failed:\n${(result.stderr ?? '').trim()}`]);
  return result.stdout.trim() !== '';
}

// ── self-test ────────────────────────────────────────────────────────────────

function selfTest() {
  const silent = [];
  const expect = (condition, message) => {
    if (!condition) silent.push(message);
  };
  const base = {
    dir: 'fds-x',
    name: '@vitness/fds-x',
    version: '0.3.0',
    changelog: '# Changelog\n\n## [Unreleased]\n\n## [0.3.0] - 2026-11-26\n',
    tagExists: false,
  };

  const published = decide({ ...base, registry: { published: true, latest: '0.3.0' } });
  expect(!published.publish && published.problems.length === 0, 'a published version was planned for publishing.');

  const next = decide({ ...base, registry: { published: false, latest: '0.2.0' } });
  expect(next.publish && next.problems.length === 0, 'a new, higher, documented version was refused.');

  const brandNew = decide({ ...base, version: '0.1.0', changelog: '## [0.1.0]', registry: { published: false, latest: null } });
  expect(brandNew.publish && brandNew.problems.length === 0, 'a package not yet on npm was refused.');

  const older = decide({ ...base, version: '0.2.5', changelog: '## [0.2.5]', registry: { published: false, latest: '0.3.0' } });
  expect(older.problems.length === 1, 'a version below npm latest was not refused.');

  const undocumented = decide({ ...base, changelog: '## [Unreleased]\n## [0.2.0]', registry: { published: false, latest: '0.2.0' } });
  expect(undocumented.problems.length === 1, 'a version with no CHANGELOG section was not refused.');

  const prefixOnly = decide({ ...base, version: '0.3.0', changelog: '## [0.3.0-beta.1]', registry: { published: false, latest: null } });
  expect(prefixOnly.problems.length === 1, 'a CHANGELOG section for a prerelease was taken for the release.');

  const tagged = decide({ ...base, tagExists: true, registry: { published: false, latest: '0.2.0' } });
  expect(tagged.problems.length === 1, 'an existing tag for an unpublished version was not refused.');

  expect(compareVersions('0.10.0', '0.9.0') > 0, '0.10.0 was judged lower than 0.9.0.');

  if (silent.length) fail(silent);
  ok('self-test — published versions are skipped and unreleasable ones refused');
}

// ── run ──────────────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const plan = candidates().map((pkg) =>
  decide({
    ...pkg,
    registry: registryFacts(pkg.name, pkg.version),
    tagExists: tagExists(`${pkg.dir}@${pkg.version}`),
  })
);

for (const entry of plan) {
  console.log(`  ${entry.publish ? 'publish' : 'skip   '}  ${entry.name}@${entry.version}${entry.publish ? '' : '  (on npm)'}`);
}

const problems = plan.flatMap((entry) => entry.problems);
if (problems.length) fail(problems);

const toPublish = plan.filter((entry) => entry.publish).map((entry) => entry.dir);
if (!toPublish.length) ok('every package version is already on npm — nothing to publish');

if (process.argv.includes('--github')) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) fail(['--github needs GITHUB_OUTPUT, which only GitHub Actions sets.']);
  appendFileSync(out, `packages=${JSON.stringify(toPublish)}\nany=${toPublish.length > 0}\n`);
}
