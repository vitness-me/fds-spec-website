#!/usr/bin/env node
/**
 * The publish job proves it can authenticate before it tries to publish.
 *
 * The publish job authenticates by npm trusted publishing: no token, an OIDC
 * exchange the npm CLI performs at publish time. That exchange never throws.
 * When it fails, npm carries on with whatever credential it already has, and a
 * placeholder credential (the one `registry-url:` on actions/setup-node writes)
 * turns the failure into an E404 about the package name instead of an
 * ENEEDAUTH about being logged out. The gates that open and run the tarball
 * need no credential, so none of them can see this. This check can.
 *
 * ── the rules ────────────────────────────────────────────────────────────────
 *
 *   RUNNER.   The job runs on a GitHub-hosted runner. npm trusted publishing
 *             refuses id-tokens marked `runner_environment: self-hosted`, which
 *             is every runner GitHub does not host, Blacksmith's included.
 *
 *   NPM.      The npm CLI is at least the documented floor for trusted
 *             publishing. Below it there is no exchange at all.
 *
 *   CONTROL.  `npm publish --dry-run` with the id-token request variables
 *             removed must report "requires you to be logged in". Otherwise a
 *             configured credential exists, and it would hide a failed exchange.
 *
 *   PROBE.    The same dry run with the real environment must not report it.
 *             The control established that the only credential available is a
 *             minted one, so silence here means the exchange succeeded.
 *
 * Both probes run the real exchange (npm does not skip it on `--dry-run`) and
 * stop before the write. Both turn on one sentence of npm's; if npm rewords it,
 * the control fails and says so, rather than the probe passing on nothing.
 *
 * ── running it ───────────────────────────────────────────────────────────────
 *
 *   node scripts/check-publish-auth.mjs packages/fds-transformer [--exists true|false]
 *   node scripts/check-publish-auth.mjs --self-test   prove the rules can fail
 *
 * `--exists` is whether the package is on npm at all, as the publish plan found
 * it; `false` turns a failed exchange into the first-publish diagnosis. The full
 * check needs a real id-token, so it refuses to run outside GitHub Actions.
 * `--self-test` is offline: it hands the rules two recorded npm 11.19.0
 * transcripts, one with no credential configured and one with setup-node's
 * npmrc and its placeholder token, and requires each rule to fail on the one
 * that should fail it.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FIXTURES = join(ROOT, 'scripts/fixtures/publish-auth');

/**
 * Documented floors, quoted from https://docs.npmjs.com/trusted-publishers:
 * "Trusted publishing requires npm CLI version 11.5.1 or later and Node version
 * 22.14.0 or higher."
 *
 * The npm floor is enforced: below it `lib/utils/oidc.js` does not exist and no
 * exchange is attempted, so the run cannot succeed. The Node floor is reported
 * rather than enforced — npm 11 declares `^20.17.0 || >=22.9.0` and runs the
 * exchange on Node 20 without complaint, so refusing here would be this file
 * asserting something npm does not. It is named in the diagnosis when the
 * exchange fails, because it is a documented difference worth ruling out.
 */
const NPM_FLOOR = '11.5.1';
const NODE_FLOOR = '22.14.0';

/** npm's ENEEDAUTH sentence, in both its thrown and its dry-run warning form. */
const NOT_LOGGED_IN = /requires you to be logged in/;

const ok = (message) => console.log(`  \x1b[32mok\x1b[0m    ${message}`);

function fail(problems) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('');
  process.exit(1);
}

// ── the rules, as functions over what npm printed ─────────────────────────────

/** Numeric compare of two dotted versions. Prerelease tags are ignored. */
function atLeast(version, floor) {
  const parts = (value) => String(value).split('.').map((n) => Number.parseInt(n, 10) || 0);
  const [a, b] = [parts(version), parts(floor)];
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return true;
}

const saysNotLoggedIn = (output) => NOT_LOGGED_IN.test(output);

/**
 * Rule 0: the job runs on a GitHub-hosted runner. npm trusted publishing does
 * not accept self-hosted runners, and GitHub marks every runner it does not
 * host, Blacksmith's included, `runner_environment: self-hosted` in the
 * id-token. The exchange is then refused whatever npmjs.com is configured with.
 */
function runnerProblems(runnerEnvironment) {
  if (runnerEnvironment === 'github-hosted') return [];
  return [
    `this job runs on a ${runnerEnvironment || 'runner of unknown kind'}, not a GitHub-hosted runner.\n` +
      '    npm trusted publishing accepts id-tokens from GitHub-hosted runners only, so the exchange\n' +
      '    is refused here however the trusted publisher on npmjs.com is configured. Run the publish\n' +
      '    job on `ubuntu-latest`.',
  ];
}

/** Rule 1: the CONTROL run must find npm with no credential at all. */
function controlProblems(output) {
  if (saysNotLoggedIn(output)) return [];
  return [
    'npm has a registry credential that the OIDC exchange did not mint.\n' +
      '    The control run had ACTIONS_ID_TOKEN_REQUEST_URL, ACTIONS_ID_TOKEN_REQUEST_TOKEN and\n' +
      '    NPM_ID_TOKEN removed, so no token could be obtained — and npm still did not report\n' +
      '    itself logged out. Something configured one, and a configured credential is what turns\n' +
      '    a failed exchange into a 404 about a package name instead of an ENEEDAUTH about auth.\n' +
      "    Remove `registry-url:` from this job's actions/setup-node step (it writes\n" +
      '    //registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN} and exports a placeholder\n' +
      '    NODE_AUTH_TOKEN), and remove any NODE_AUTH_TOKEN or _authToken this job sets.\n' +
      '    If this job is meant to publish with a token rather than by trusted publishing, this\n' +
      '    check is the wrong gate for it — say so in the workflow and drop the step.',
  ];
}

/** Rule 2: the PROBE run must find npm holding a credential it minted. */
function probeProblems(output, context = {}) {
  if (!saysNotLoggedIn(output)) return [];

  const { packageName, owner, repository, workflowFile, environment, nodeVersion, onRegistry } = context;
  const said = (output.match(/^.*oidc.*$/gim) || []).map((line) => `      ${line.trim()}`);

  if (onRegistry === false) {
    return [
      `${packageName ?? 'this package'} is not on npm yet, and trusted publishing cannot create a package.\n` +
        '    npm attaches a trusted publisher to a package that already exists, so an owner first\n' +
        '    publishes a placeholder 0.0.1 by hand, and this workflow publishes every release after it.\n' +
        '    RELEASE.md, "First publish of a new package", has the commands. The trusted publisher:\n' +
        `      organization or user  ${owner ?? '(unknown)'}\n` +
        `      repository            ${repository ?? '(unknown)'}\n` +
        `      workflow filename     ${workflowFile ?? '(unknown)'}\n` +
        `      environment           ${environment || '(unknown)'}`,
    ];
  }

  return [
    `the OIDC exchange produced no credential, so publishing ${packageName ?? 'this package'} would fail.\n` +
      '    npm asked the registry to exchange this run\'s GitHub id-token for a publish token\n' +
      '    (POST /-/npm/v1/oidc/token/exchange/package/…) and got nothing back. npm swallows that\n' +
      '    — lib/utils/oidc.js never throws — so an unchecked publish carries on and fails as\n' +
      '    E404, which the registry also returns for "not authenticated".\n' +
      '    Check the trusted publisher on npmjs.com for this package. Every field is\n' +
      '    case-sensitive and must match this run exactly:\n' +
      `      organization or user  ${owner ?? '(unknown)'}\n` +
      `      repository            ${repository ?? '(unknown)'}\n` +
      `      workflow filename     ${workflowFile ?? '(unknown)'}\n` +
      `      environment           ${environment || '(unknown)'}\n` +
      (nodeVersion && !atLeast(nodeVersion, NODE_FLOOR)
        ? `    Also note: this runner is Node ${nodeVersion}, and npm documents trusted publishing\n` +
          `    as requiring Node ${NODE_FLOOR} or higher. npm 11 runs the exchange on Node 20 anyway,\n` +
          '    so this is a documented difference to rule out, not a proven cause.\n'
        : '') +
      (said.length
        ? '    What npm said about the exchange:\n' + said.join('\n')
        : '    npm logged nothing about the exchange, which usually means it never reached it.'),
  ];
}

// ── self-test ────────────────────────────────────────────────────────────────
//
// Both transcripts are npm 11.19.0 runs of `npm publish --dry-run
// --ignore-scripts` against packages/fds-transformer: one with an empty npmrc,
// one with the npmrc actions/setup-node@v4 writes and the placeholder
// NODE_AUTH_TOKEN it exports.

function selfTest() {
  const transcript = (name) => readFileSync(join(FIXTURES, name), 'utf8');
  const noCredential = transcript('npm-11-no-credential.txt');
  const setupNodeNpmrc = transcript('npm-11-setup-node-npmrc.txt');

  const silent = [];
  const expect = (condition, message) => {
    if (!condition) silent.push(message);
  };

  // Each rule fails on the transcript that should fail it …
  expect(
    controlProblems(setupNodeNpmrc).length === 1,
    'the control stayed silent on: a credential configured by setup-node\'s npmrc.'
  );
  expect(
    probeProblems(noCredential).length === 1,
    'the probe stayed silent on: an exchange that produced no credential.'
  );

  // … and neither fires on the transcript that should pass it.
  expect(
    controlProblems(noCredential).length === 0,
    'the control flagged a run that correctly had no credential.'
  );
  expect(
    probeProblems(setupNodeNpmrc).length === 0,
    'the probe flagged a run in which npm held a credential.'
  );

  // A package npm has never seen gets the first-publish diagnosis, not the
  // trusted-publisher one: there is no package page to configure yet.
  const [unpublished] = probeProblems(noCredential, { packageName: '@vitness/fds-x', onRegistry: false });
  expect(
    unpublished?.includes('not on npm yet'),
    'a package that is not on npm was diagnosed as a trusted-publisher mismatch.'
  );

  // Only a GitHub-hosted runner can do the exchange.
  expect(runnerProblems('github-hosted').length === 0, 'a GitHub-hosted runner was refused.');
  expect(runnerProblems('self-hosted').length === 1, 'a self-hosted runner was accepted.');
  expect(runnerProblems(undefined).length === 1, 'a runner of unknown kind was accepted.');

  // The npm floor, either side of the version the exchange landed in.
  for (const [version, supported] of [
    ['10.8.2', false], // what Node 20 ships
    ['11.5.0', false],
    ['11.5.1', true],
    ['11.19.0', true],
    ['12.0.2', true],
  ]) {
    expect(
      atLeast(version, NPM_FLOOR) === supported,
      `npm ${version} was judged ${supported ? 'too old' : 'new enough'} for trusted publishing.`
    );
  }

  // The diagnosis has to carry the values a reader compares against npmjs.com,
  // or the failure names a fix nobody can act on.
  const [diagnosis] = probeProblems(noCredential, {
    packageName: '@vitness/fds-transformer',
    owner: 'vitness-me',
    repository: 'fds-spec-website',
    workflowFile: 'publish.yml',
    environment: 'npm',
    nodeVersion: '20.20.0',
  });
  for (const needed of ['vitness-me', 'fds-spec-website', 'publish.yml', 'npm', NODE_FLOOR]) {
    expect(diagnosis?.includes(needed), `the diagnosis did not mention ${needed}.`);
  }

  if (silent.length) fail(silent);
  ok('self-test — both rules fail on recorded broken runs, and pass a working one');
}

// ── the live check ───────────────────────────────────────────────────────────

/** `npm publish --dry-run` in `cwd`, with `env`, returning everything it printed. */
function dryRunPublish(cwd, env) {
  const result = spawnSync(
    'npm',
    ['publish', '--dry-run', '--ignore-scripts', '--loglevel', 'verbose'],
    { cwd, env, encoding: 'utf8' }
  );
  if (result.error) {
    fail([`could not run npm in ${cwd}: ${result.error.message}`]);
  }
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

function check(packageDir, exists) {
  const root = join(ROOT, packageDir);
  const manifest = join(root, 'package.json');
  if (!existsSync(manifest)) {
    fail([`${packageDir}/package.json does not exist — pass a package directory, e.g. packages/fds-transformer.`]);
  }
  const packageName = JSON.parse(readFileSync(manifest, 'utf8')).name;

  if (process.env.GITHUB_ACTIONS !== 'true') {
    fail([
      'this check only means something inside GitHub Actions.\n' +
        '    It drives a real OIDC exchange against the registry using this run\'s id-token, and\n' +
        '    there is no id-token outside a CI run. Locally, run the rules against their recorded\n' +
        '    transcripts instead: `node scripts/check-publish-auth.mjs --self-test`.',
    ]);
  }

  // Identity this run will present, read off the run rather than written down.
  // GITHUB_WORKFLOW_REF is owner/repo/.github/workflows/<file>@<ref>.
  const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? '/').split('/');
  const workflowFile = (process.env.GITHUB_WORKFLOW_REF ?? '').split('@')[0].split('/').pop();
  const nodeVersion = process.versions.node;

  // npm's environment field must match the `environment:` of the job that
  // publishes. Read off the workflow, so this stays true when it changes.
  const workflow = join(ROOT, '.github/workflows', workflowFile ?? '');
  const declared =
    workflowFile && existsSync(workflow)
      ? readFileSync(workflow, 'utf8').match(/^\s*environment:\s*([\w.-]+)\s*$/m)?.[1]
      : undefined;
  const environment = declared ?? `(empty — ${workflowFile || 'the workflow'} declares no environment)`;

  const npmVersion = spawnSync('npm', ['--version'], { encoding: 'utf8' }).stdout?.trim();
  console.log(`  npm ${npmVersion}, Node ${nodeVersion}, ${process.env.RUNNER_ENVIRONMENT ?? 'unknown'} runner`);
  console.log(`  publishing ${packageName} as ${owner}/${repository} via ${workflowFile}`);

  const runner = runnerProblems(process.env.RUNNER_ENVIRONMENT);
  if (runner.length) fail(runner);

  if (!npmVersion || !atLeast(npmVersion, NPM_FLOOR)) {
    fail([
      `npm ${npmVersion ?? '(unknown)'} cannot do trusted publishing; ${NPM_FLOOR} or later can.\n` +
        '    Below that version the CLI has no OIDC exchange at all: it sends an unauthenticated\n' +
        '    PUT and the registry answers E404. Node 20 and 22 both ship npm 10, so this job\n' +
        '    upgrades npm before publishing — check that step ran and that its pin still resolves\n' +
        `    to ${NPM_FLOOR} or later.`,
    ]);
  }

  if (!(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)) {
    fail([
      'this job cannot request an id-token, so the OIDC exchange cannot happen.\n' +
        '    ACTIONS_ID_TOKEN_REQUEST_URL and ACTIONS_ID_TOKEN_REQUEST_TOKEN are set by the runner\n' +
        '    only when the workflow grants `permissions: id-token: write`. Add it.',
    ]);
  }

  // CONTROL: nothing to mint a token with. npm must report itself logged out.
  const blinded = { ...process.env };
  delete blinded.ACTIONS_ID_TOKEN_REQUEST_URL;
  delete blinded.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  delete blinded.NPM_ID_TOKEN;
  const control = controlProblems(dryRunPublish(root, blinded));
  if (control.length) fail(control);
  ok('no credential is configured — the only one available is the one this run mints');

  // PROBE: the real environment. npm must come away holding a token.
  const probe = probeProblems(dryRunPublish(root, process.env), {
    packageName,
    owner,
    repository,
    workflowFile,
    environment,
    nodeVersion,
    onRegistry: exists,
  });
  if (probe.length) fail(probe);
  ok(`the OIDC exchange returned a publish credential for ${packageName}`);
}

// ── run ──────────────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const args = process.argv.slice(2);
const existsFlag = args.indexOf('--exists');
const exists = existsFlag === -1 ? undefined : args[existsFlag + 1] === 'true';
const target = args.find((argument, index) => !argument.startsWith('-') && index !== existsFlag + 1);
if (!target) {
  fail(['no package directory given, e.g. `node scripts/check-publish-auth.mjs packages/fds-transformer`.']);
}
check(target, exists);
