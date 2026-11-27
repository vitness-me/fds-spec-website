#!/usr/bin/env node
/**
 * Which packages a run of `.github/workflows/publish.yml` publishes.
 *
 * A package is published when the version in its `package.json` is not on npm.
 * Nothing else decides it: no tag, no input, no list kept here. Every
 * `packages/<dir>/package.json` that is not `private` is a candidate, so a new
 * public package is covered the day it lands.
 *
 * Each package is planned on its own. A package whose version is not on npm
 * must be releasable, or that package is refused and the others still go:
 *
 *   - the version is a release, not a pre-release. `npm publish` moves `latest`
 *     to whatever it publishes, and this workflow publishes without `--tag`;
 *   - the version is higher than the one npm calls `latest`, for the same
 *     reason: a lower version would become what `npm install` resolves;
 *   - its CHANGELOG.md has a `## [<version>]` section, which becomes the
 *     GitHub release notes;
 *   - no git tag `<dir>@<version>` exists yet. A tag for a version npm does not
 *     have points at a commit that did not publish.
 *
 * A package whose version is on npm is skipped, unless its tag is missing and
 * this is a re-run (`GITHUB_RUN_ATTEMPT` above 1): the run then completes the
 * tag and release that an earlier attempt of the same commit failed to create.
 * A first attempt only warns, because its commit is not the one that published.
 *
 * Any npm answer other than "found" or "E404 not found" refuses that package:
 * a registry outage must not read as "nothing is published, publish everything".
 *
 * `--environment <name>` also requires the GitHub environment the publish job
 * runs in to exist and to allow deployments from `main` only. Without that rule
 * every package is refused.
 *
 * ── running it ───────────────────────────────────────────────────────────────
 *
 *   node scripts/publish-plan.mjs                      print the plan
 *   node scripts/publish-plan.mjs --github             also write `publish`,
 *                                                      `release` and `refused`
 *                                                      to $GITHUB_OUTPUT
 *   node scripts/publish-plan.mjs --environment npm    also check the environment
 *   node scripts/publish-plan.mjs --self-test          the rules, offline
 *
 * `publish` lists the packages to build and publish; `release` those plus any
 * package whose version is on npm and whose tag a re-run completes. With
 * `--github` the plan exits 0 when it could decide, even if it refused a
 * package, so the workflow can publish the rest; `refused` is the number of
 * packages refused, and the workflow fails on it after the others are planned.
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const GITHUB = process.argv.includes('--github');

const ok = (message) => console.log(`  \x1b[32mok\x1b[0m    ${message}`);

function fail(problems) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('');
  process.exit(1);
}

/** A problem as a GitHub annotation when running in Actions, plain otherwise. */
function report(level, message) {
  if (GITHUB) console.log(`::${level}::${message.replace(/%/g, '%25').replace(/\r?\n/g, '%0A')}`);
  else console.error(`  ${level}: ${message}`);
}

/** Numeric compare of two `x.y.z` versions: negative, zero or positive. */
function compareVersions(a, b) {
  const parts = (value) => String(value).split(/[.-]/).slice(0, 3).map((n) => Number.parseInt(n, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i += 1) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

const isPrerelease = (version) => /[-+]/.test(String(version));

const hasChangelogSection = (changelog, version) =>
  new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm').test(changelog ?? '');

/**
 * The decision for one package, from facts gathered elsewhere.
 *
 * `registry` is `{ published, latest, exists }`: whether this exact version is
 * on npm, npm's `latest` dist-tag, and whether the package exists at all; or
 * `{ error }` when npm could not say. `rerun` is whether this is a re-run.
 *
 * Returns `publish` (build and publish), `release` (only the tag and release,
 * the version is on npm), or neither, with `problems` that refuse the package
 * and `warnings` that do not.
 */
function decide({ dir, name, version, registry, changelog, tagExists, rerun }) {
  const base = { dir, name, version, exists: Boolean(registry.exists), publish: false, release: false, problems: [], warnings: [] };

  if (registry.error) {
    return { ...base, problems: [`npm view ${name} failed, and not with E404:\n${registry.error}`] };
  }

  if (registry.published) {
    if (tagExists) return base;
    if (rerun) return { ...base, release: true };
    return {
      ...base,
      warnings: [
        `${name} ${version} is on npm but the tag ${dir}@${version} does not exist.\n` +
          'An earlier run published it and did not finish its release. Re-run that run, which tags the\n' +
          'commit it published from; this run is on another commit and does not tag it.',
      ],
    };
  }

  const problems = [];
  if (isPrerelease(version)) {
    problems.push(
      `${name} ${version} is a pre-release, and this workflow publishes to npm's \`latest\` tag only.\n` +
        `Publishing it would make a pre-release what \`npm install\` resolves. Set packages/${dir}/package.json\n` +
        'to a release version, or publish the pre-release by hand with `npm publish --tag next`.'
    );
  }
  if (registry.latest && compareVersions(version, registry.latest) <= 0) {
    problems.push(
      `${name} ${version} is not on npm, but npm's latest is ${registry.latest}.\n` +
        'Publishing it would move `latest` back to an older version. Bump the version\n' +
        `in packages/${dir}/package.json above ${registry.latest}.`
    );
  }
  if (!hasChangelogSection(changelog, version)) {
    problems.push(
      `${name} ${version} is not on npm and packages/${dir}/CHANGELOG.md has no "## [${version}]" section.\n` +
        'The section is the GitHub release notes. Move the Unreleased entries under it.'
    );
  }
  if (tagExists) {
    problems.push(
      `${name} ${version} is not on npm, but the tag ${dir}@${version} already exists.\n` +
        'That tag names a commit that never published. Bump the version, or delete the tag\n' +
        `if nothing else refers to it: git push origin :refs/tags/${dir}@${version}`
    );
  }
  return problems.length ? { ...base, problems } : { ...base, publish: true, release: true };
}

/**
 * The environment rule: it exists, and only `main` may deploy to it.
 *
 * `environment` is GitHub's environment object, or null when it does not exist;
 * `policies` the names of its custom deployment branch policies.
 */
function environmentProblems({ repository, name, environment, policies }) {
  const settings = `https://github.com/${repository}/settings/environments`;
  if (!environment) {
    return [
      `the GitHub environment "${name}" does not exist, and the publish job runs in it.\n` +
        `Create it at ${settings} → New environment → "${name}". Under Deployment branches and tags\n` +
        'choose "Selected branches and tags" and add the branch rule `main`. Then name the environment\n' +
        `"${name}" in each package's trusted publisher on npmjs.com (RELEASE.md, "Credentials on npmjs.com").`,
    ];
  }
  const rule = environment.deployment_branch_policy;
  const onlyMain = rule?.custom_branch_policies === true && policies.length === 1 && policies[0] === 'main';
  if (onlyMain) return [];
  const now = !rule
    ? 'any branch can deploy to it'
    : rule.protected_branches
      ? 'every protected branch can deploy to it'
      : `its branch rules are ${policies.length ? policies.map((p) => `\`${p}\``).join(', ') : 'empty'}`;
  return [
    `the GitHub environment "${name}" does not limit deployments to \`main\`: ${now}.\n` +
      `Open ${settings} → "${name}" → Deployment branches and tags, choose "Selected branches and tags",\n` +
      'and leave exactly one branch rule, `main`.',
  ];
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

/** What npm knows about `name`, from one `npm view`. */
function registryFacts(name, version) {
  const result = spawnSync('npm', ['view', name, '--json'], { cwd: ROOT, encoding: 'utf8' });
  if (result.error) return { error: `could not run npm: ${result.error.message}` };
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.status !== 0) {
    if (/\bE404\b/.test(output)) return { published: false, latest: null, exists: false };
    return { error: output.trim() };
  }
  const view = JSON.parse(result.stdout);
  const versions = Array.isArray(view.versions) ? view.versions : [view.versions].filter(Boolean);
  return { published: versions.includes(version), latest: view['dist-tags']?.latest ?? null, exists: true };
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

/** The environment and its branch policy names, from the GitHub API. */
async function environmentFacts(repository, name) {
  const headers = { accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const base = `${process.env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${repository}/environments/${encodeURIComponent(name)}`;

  const response = await fetch(base, { headers });
  if (response.status === 404) return { environment: null, policies: [] };
  if (!response.ok) fail([`GitHub answered ${response.status} for environment "${name}": ${await response.text()}`]);
  const environment = await response.json();

  let policies = [];
  if (environment.deployment_branch_policy?.custom_branch_policies) {
    const listed = await fetch(`${base}/deployment-branch-policies?per_page=100`, { headers });
    if (!listed.ok) fail([`GitHub answered ${listed.status} for the branch policies of "${name}": ${await listed.text()}`]);
    policies = (await listed.json()).branch_policies.map((policy) => (policy.type === 'tag' ? `tag:${policy.name}` : policy.name));
  }
  return { environment, policies };
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
    rerun: false,
  };
  const on = (latest) => ({ published: false, latest, exists: latest !== null });

  const published = decide({ ...base, tagExists: true, registry: { published: true, latest: '0.3.0', exists: true } });
  expect(!published.publish && !published.release && !published.problems.length, 'a published, tagged version was planned.');

  const untagged = decide({ ...base, registry: { published: true, latest: '0.3.0', exists: true } });
  expect(!untagged.release && untagged.warnings.length === 1, 'a published, untagged version was released on a first attempt.');

  const healed = decide({ ...base, rerun: true, registry: { published: true, latest: '0.3.0', exists: true } });
  expect(healed.release && !healed.publish && !healed.problems.length, 'a re-run did not complete a missing release.');

  const next = decide({ ...base, registry: on('0.2.0') });
  expect(next.publish && next.release && !next.problems.length, 'a new, higher, documented version was refused.');

  const brandNew = decide({ ...base, version: '0.1.0', changelog: '## [0.1.0]', registry: on(null) });
  expect(brandNew.publish && !brandNew.problems.length, 'a package not yet on npm was refused.');

  const older = decide({ ...base, version: '0.2.5', changelog: '## [0.2.5]', registry: on('0.3.0') });
  expect(!older.publish && older.problems.length === 1, 'a version below npm latest was not refused.');

  const undocumented = decide({ ...base, changelog: '## [Unreleased]\n## [0.2.0]', registry: on('0.2.0') });
  expect(undocumented.problems.length === 1, 'a version with no CHANGELOG section was not refused.');

  const prefixOnly = decide({ ...base, changelog: '## [0.3.0-beta.1]', registry: on(null) });
  expect(prefixOnly.problems.length === 1, 'a CHANGELOG section for a prerelease was taken for the release.');

  const prerelease = decide({ ...base, version: '0.4.0-beta.1', changelog: '## [0.4.0-beta.1]', registry: on('0.3.0') });
  expect(!prerelease.publish && prerelease.problems.length === 1, 'a pre-release was not refused.');

  const tagged = decide({ ...base, tagExists: true, registry: on('0.2.0') });
  expect(tagged.problems.length === 1, 'an existing tag for an unpublished version was not refused.');

  const outage = decide({ ...base, registry: { error: 'npm error code E500' } });
  expect(!outage.publish && outage.problems.length === 1, 'an npm error other than E404 was not refused.');

  expect(compareVersions('0.10.0', '0.9.0') > 0, '0.10.0 was judged lower than 0.9.0.');

  const env = (rule, policies) => environmentProblems({ repository: 'o/r', name: 'npm', environment: { deployment_branch_policy: rule }, policies });
  expect(environmentProblems({ repository: 'o/r', name: 'npm', environment: null, policies: [] })[0]?.includes('New environment'), 'a missing environment did not say how to create it.');
  expect(env(null, []).length === 1, 'an environment any branch can deploy to was accepted.');
  expect(env({ protected_branches: true, custom_branch_policies: false }, []).length === 1, 'an environment open to every protected branch was accepted.');
  expect(env({ protected_branches: false, custom_branch_policies: true }, ['main', 'develop']).length === 1, 'an environment open to a second branch was accepted.');
  expect(env({ protected_branches: false, custom_branch_policies: true }, ['main']).length === 0, 'an environment limited to main was refused.');

  if (silent.length) fail(silent);
  ok('self-test — each package is planned on its own, and unreleasable ones refused');
}

// ── run ──────────────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const environmentFlag = process.argv.indexOf('--environment');
if (environmentFlag !== -1) {
  const name = process.argv[environmentFlag + 1];
  const repository = process.env.GITHUB_REPOSITORY;
  if (!name || !repository) fail(['--environment needs a name, and GITHUB_REPOSITORY set to owner/repo.']);
  const problems = environmentProblems({ repository, name, ...(await environmentFacts(repository, name)) });
  if (problems.length) {
    if (GITHUB) for (const problem of problems) report('error', problem);
    fail(problems);
  }
  ok(`the environment "${name}" allows deployments from main only`);
}

const rerun = Number.parseInt(process.env.GITHUB_RUN_ATTEMPT ?? '1', 10) > 1;
const plan = candidates().map((pkg) =>
  decide({
    ...pkg,
    rerun,
    registry: registryFacts(pkg.name, pkg.version),
    tagExists: tagExists(`${pkg.dir}@${pkg.version}`),
  })
);

for (const entry of plan) {
  const verdict = entry.problems.length ? 'refuse ' : entry.publish ? 'publish' : entry.release ? 'release' : 'skip   ';
  const note = entry.publish || entry.problems.length ? '' : entry.release ? '  (on npm, completing its tag and release)' : '  (on npm)';
  console.log(`  ${verdict}  ${entry.name}@${entry.version}${note}`);
}
for (const entry of plan) {
  for (const warning of entry.warnings) report('warning', warning);
  for (const problem of entry.problems) report('error', problem);
}

const release = plan
  .filter((entry) => entry.release)
  .map(({ dir, name, version, publish, exists }) => ({ dir, name, version, publish, exists }));
const publish = release.filter((entry) => entry.publish);
const refused = plan.filter((entry) => entry.problems.length).length;
if (!release.length && !refused) ok('every package version is already on npm — nothing to publish');

if (GITHUB) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) fail(['--github needs GITHUB_OUTPUT, which only GitHub Actions sets.']);
  appendFileSync(out, `publish=${JSON.stringify(publish)}\nrelease=${JSON.stringify(release)}\nrefused=${refused}\n`);
} else if (refused) {
  process.exit(1);
}
