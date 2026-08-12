#!/usr/bin/env node
/**
 * The publish job proves it can authenticate before it tries to publish.
 *
 * Five publish attempts failed with the same error, and every gate in both
 * publish workflows was green for all five:
 *
 *   npm error code E404
 *   npm error 404 Not Found - PUT https://registry.npmjs.org/@vitness%2ffds-transformer
 *   npm error 404 The requested resource '@vitness/fds-transformer@0.2.0' could not be
 *   npm error 404 found or you do not have permission to access it.
 *
 * The gates could not have caught it. They pack the tarball, open it, run what
 * is inside and compare it against the release manifest — every one of them
 * reads or executes files, and none of them needs a credential. The only step
 * that authenticates is `npm publish` itself, and the dry-run path skips it. So
 * the proof gate proved everything except the thing that was broken, and
 * `dry_run: true` was structurally incapable of ever finding it.
 *
 * ── what the 404 actually was ────────────────────────────────────────────────
 *
 * This job publishes by trusted publishing: no token, an OIDC exchange the npm
 * CLI performs at publish time. In npm's implementation (lib/utils/oidc.js, and
 * its one call site at lib/commands/publish.js) that exchange:
 *
 *   - is attempted unconditionally on GitHub Actions when `id-token: write` is
 *     granted. A credential already configured does NOT suppress it — the
 *     function takes no interest in existing config, and on success it
 *     overwrites `//registry/:_authToken` with the token it obtained;
 *   - never throws. Every failure path logs at verbose or silly and returns
 *     `undefined`, because OIDC is optional and npm must still work without it.
 *
 * Publish then reads `getCredentialsByURI(registry)`. With no credential it
 * raises ENEEDAUTH — "This command requires you to be logged in to …" — which
 * names the problem. With any credential it proceeds.
 *
 * `registry-url:` on actions/setup-node@v4 supplies one. It writes
 * `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}` into a temporary npmrc
 * and exports `NODE_AUTH_TOKEN=XXXXX-XXXXX-XXXXX-XXXXX` when the workflow does
 * not set one (actions/setup-node@v4 src/authutil.ts; main has since made that
 * export conditional). Nothing in either workflow sets NODE_AUTH_TOKEN, so npm
 * held a placeholder, skipped ENEEDAUTH, and PUT the tarball with a credential
 * that authenticates as nobody. The registry answers 404 rather than 403 so an
 * anonymous caller cannot probe which packages exist — meaning the message
 * everyone read as "wrong package name" meant "not authenticated".
 *
 * So the placeholder did not cause the exchange to fail. It hid that the
 * exchange had failed, and turned a self-describing ENEEDAUTH into a 404 about
 * a package name. That is what five attempts were spent chasing.
 *
 * ── the two rules, and why they are a pair ───────────────────────────────────
 *
 * Both are the same probe: `npm publish --dry-run`, which runs the real OIDC
 * exchange (the call in publish.js is not guarded by dry-run) and stops short of
 * the write. Neither rule alone proves anything.
 *
 *   CONTROL. Run it with the id-token request variables removed, so no token can
 *   possibly be minted, and require npm to say it is not logged in. If it stays
 *   quiet, a credential exists that the exchange did not produce — a configured
 *   one, which will mask the next failure exactly as it masked this one.
 *
 *   PROBE. Run it with the real environment and require npm not to say it. Since
 *   the control just established that the only credential available is a minted
 *   one, silence here means the exchange succeeded.
 *
 * The pair also keeps the gate honest about itself. Both rules turn on one
 * string of npm's, `requires you to be logged in`; if npm ever rewords it, the
 * control fails on the next run and says so, rather than the probe passing
 * because it found nothing. A recorded needle that is re-proved on every run.
 *
 * ── running it ───────────────────────────────────────────────────────────────
 *
 *   node scripts/check-publish-auth.mjs packages/fds-transformer
 *   node scripts/check-publish-auth.mjs --self-test   prove the rules can fail
 *
 * The full check drives a real exchange against the registry, so it only means
 * anything inside GitHub Actions and refuses to run elsewhere. `--self-test` is
 * offline and runs in CI: it hands the rules two recorded npm 11.19.0
 * transcripts, one from a run with no credential configured and one from a run
 * with setup-node's npmrc and its placeholder token, and requires each rule to
 * fail on the transcript that should fail it. Those files are transcripts, not
 * expectations — nothing is derived from their contents but the presence or
 * absence of that one sentence.
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

  const { packageName, owner, repository, workflowFile, environment, nodeVersion } = context;
  const said = (output.match(/^.*oidc.*$/gim) || []).map((line) => `      ${line.trim()}`);

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
// The rules are pure functions over npm's output, so they can be handed output
// from a run that was really broken. Both transcripts below are real npm 11.19.0
// runs of `npm publish --dry-run --ignore-scripts` against packages/fds-transformer:
// one with an empty npmrc, one with the npmrc actions/setup-node@v4 writes and
// the placeholder NODE_AUTH_TOKEN it exports. The second is byte-for-byte the
// configuration that produced the five E404s.

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

  // The npm floor, either side of the version the exchange landed in.
  for (const [version, supported] of [
    ['10.8.2', false], // what Node 20 ships, and what the first four attempts ran
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
    workflowFile: 'publish-transformer.yml',
    environment: '(empty — publish-transformer.yml declares no environment)',
    nodeVersion: '20.20.0',
  });
  for (const needed of ['vitness-me', 'fds-spec-website', 'publish-transformer.yml', NODE_FLOOR]) {
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

function check(packageDir) {
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
  // publishes, and an environment claim in the token where npm expects none is
  // itself a 404. Read it off the workflow rather than stating it here, so this
  // stays true the day one is added.
  const workflow = join(ROOT, '.github/workflows', workflowFile ?? '');
  const environment =
    workflowFile && existsSync(workflow)
      ? /^\s*environment:/m.test(readFileSync(workflow, 'utf8'))
        ? `(this workflow declares an environment — it must match the publish job's)`
        : `(empty — ${workflowFile} declares no environment)`
      : '(unknown — could not read the workflow)';

  const npmVersion = spawnSync('npm', ['--version'], { encoding: 'utf8' }).stdout?.trim();
  console.log(`  npm ${npmVersion}, Node ${nodeVersion}`);
  console.log(`  publishing ${packageName} as ${owner}/${repository} via ${workflowFile}`);

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
  });
  if (probe.length) fail(probe);
  ok(`the OIDC exchange returned a publish credential for ${packageName}`);
}

// ── run ──────────────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const target = process.argv.slice(2).find((argument) => !argument.startsWith('-'));
if (!target) {
  fail(['no package directory given, e.g. `node scripts/check-publish-auth.mjs packages/fds-transformer`.']);
}
check(target);
