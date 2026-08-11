#!/usr/bin/env node
/**
 * Every validation command this repository publishes is run, as written, from a
 * checkout with nothing installed.
 *
 * The paths inside those commands were already checked — `check:versions` reads
 * every schema reference in the repository and proves it resolves to something
 * published. Nothing read the command around them. So four documents shipped
 *
 *     npx ajv -s <a real schema> -d <a real example>
 *
 * with correct paths, a correct schema, a valid example, and a command that
 * fails on its first line: ajv-cli defaults to draft-07 and every FDS schema
 * declares 2020-12. Adding `--spec=draft2020` then fails again, on the first
 * `format` the schema uses. Both failures are invisible to a check that reads
 * arguments instead of running them.
 *
 * That is the shape this repository keeps hitting: something asserted in one
 * place and implemented in another, with nothing comparing them. The only way
 * to compare a documented command with reality is to run it.
 *
 * ── Executed, not pattern-matched ────────────────────────────────────────────
 *
 * The alternative was to compare each command against a known-good form. It is
 * faster, needs no network, and would have caught the four documents. It would
 * not have caught what running them caught: the form the other three RFCs had
 * already been "corrected" to does not work either, for the reader it is
 * written for. `npx ajv …` resolves the npm package named `ajv` — the validator
 * library, which publishes no executable — so from a cold cache it fails with
 * "could not determine executable to run", and `-c ajv-formats` is a module npx
 * was never told to install. Both commands only appeared to work because the
 * machine running them already had `ajv-cli` in `node_modules`.
 *
 * A known-good form would have enshrined exactly that. Matching a shape can
 * only ever prove a command resembles one somebody once believed in.
 *
 * So every command is executed, verbatim, in a scratch directory that mirrors
 * the repository through symlinks and deliberately has **no `node_modules`**.
 * That is a reader's situation: a clone, a shell, npm, and nothing else. A
 * command that needs something installed first fails here, which is the point.
 *
 * ── Two rules that run before anything is executed ───────────────────────────
 *
 * Both are about resolution, which is the half of "does it run" that a green
 * result on a developer machine hides:
 *
 *   1. An ajv command is invoked through `npx`. A bare `ajv …` runs only for a
 *      reader who already installed it globally, and a documented command
 *      should not depend on a step in a different document.
 *
 *   2. An `npx` invocation names every package it needs with `--package=`.
 *      Without it npx guesses the package from the binary name, and whether
 *      that guess is right is a fact about the registry this check cannot
 *      establish offline — so it has to be stated. `-c <module>` is `require`d
 *      from inside the sandbox npx builds, so it needs naming too.
 *
 * A command that fails either rule is not executed: it has already been shown
 * not to resolve, and running it would only spend the network proving it again.
 *
 * ── What it reads ────────────────────────────────────────────────────────────
 *
 * Fenced blocks in `specification/`, `website/docs/`, `website/blog/` and the
 * root markdown — the same reach as `check:doc-examples`, for the same reason:
 * a reader does not distinguish an RFC from a getting-started page, they copy
 * whichever they reach first. Nothing is listed; the tree is walked. A command
 * that invokes `ajv` outside a fence is an error, because a command nobody
 * fenced is a command nothing here can run.
 *
 * Identical blocks are executed once. Every RFC is mirrored to a website page
 * byte for byte, so half of what is found is the same bytes twice; the report
 * names every file a block appears in.
 *
 * ── The network ──────────────────────────────────────────────────────────────
 *
 * This needs the npm registry, and is the one check here that does. It is the
 * price of executing rather than reading: resolution is most of what goes wrong
 * in these commands, and resolution is a fact about the registry. The job it
 * runs in already installs from the registry twice, so it adds no dependency
 * that job did not have.
 *
 *   node scripts/check-doc-commands.mjs
 *   node scripts/check-doc-commands.mjs --self-test
 */

import { readFile, readdir, mkdtemp, symlink, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * `--self-test` runs every rule over scripts/fixtures/doc-commands/ and
 * requires it to fail in exactly the recorded ways.
 *
 * A gate that has only ever passed has not been tested, and this one is easy to
 * break silently: narrow the fence scan, or the notion of "an ajv command", and
 * it goes quiet while still printing `ok`. The fixtures are the four real
 * failures — the bare command that shipped, the draft mismatch behind it, the
 * unknown format behind that, and the two ways a command fails to resolve.
 */
const SELF_TEST = process.argv.includes('--self-test');
const FIXTURES = 'scripts/fixtures/doc-commands';
const EXPECTED_FAILURES = `${FIXTURES}/expected-failures.txt`;

/** Where a reader finds a command. */
const MARKDOWN_ROOTS = SELF_TEST ? [FIXTURES] : ['specification', 'website/docs', 'website/blog'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'build', '.docusaurus', 'dist']);

/** The executables this check knows how to run, and therefore looks for. */
const VALIDATOR_BINARIES = new Set(['ajv', 'ajv-cli']);

/** How long one block gets. Generous: a cold npx installs before it runs. */
const TIMEOUT_MS = 300_000;

/**
 * ⚠️ TEMPORARY ALLOWANCES — commands this gate catches and does not fix.
 *
 * Each is a real failure in a file this change does not own. Each is scoped to
 * the exact files and the exact rule involved, so nothing else slips past under
 * the same heading, and an allowance that matches nothing is itself an error —
 * which is what makes the list self-expiring. When the owning change lands,
 * this check fails until the entry is deleted.
 */
const TEMPORARY_ALLOWANCES = [
  {
    files: /^(specification\/rfc|website\/docs\/specifications)\/rfc-00[234]-/,
    rule: 'npx-package',
    reason:
      'RFC-002, RFC-003 and RFC-004 carry `npx ajv validate --spec=draft2020 -c ajv-formats`, ' +
      'which runs only where ajv-cli is already installed. They are the same one-line change ' +
      'as RFC-001 and RFC-005 and belong to whoever owns those three files. Delete this entry ' +
      'with that change.',
  },
  {
    files: /^(SCHEMAS\.md|website\/docs\/getting-started\/quick-validation\.md)$/,
    rule: 'npx-required',
    reason:
      'Both document `ajv validate -s <https URL> -d your-exercise.json` against a global ' +
      'install. Three things are wrong at once — the global install, the placeholder document, ' +
      'and the URL, which ajv-cli resolves as a file path and cannot fetch — so repairing them ' +
      'is a rewrite of what those two pages teach, not a flag. Delete this entry with it.',
  },
];

function allowanceFor(rule, files) {
  for (const allowance of TEMPORARY_ALLOWANCES) {
    if (allowance.rule !== rule) continue;
    if (!files.every((file) => allowance.files.test(file))) continue;
    allowance.used = true;
    return allowance;
  }
  return null;
}

// ── reading ──────────────────────────────────────────────────────────────────

async function markdownFiles() {
  const found = [];
  const walk = async (relativeDir) => {
    for (const entry of await readdir(join(ROOT, relativeDir), { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(`${relativeDir}/${entry.name}`);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        found.push(`${relativeDir}/${entry.name}`);
      }
    }
  };
  for (const root of MARKDOWN_ROOTS) await walk(root);

  if (!SELF_TEST) {
    for (const entry of await readdir(ROOT, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) found.push(entry.name);
    }
  }
  return found.sort();
}

/** Fenced blocks in a markdown file, as {text, line}. */
function fencedBlocks(source) {
  const lines = source.split('\n');
  const blocks = [];
  let open = null;
  for (const [index, line] of lines.entries()) {
    const fence = line.match(/^\s*(```+|~~~+)/);
    if (!fence) continue;
    if (open === null) {
      open = { marker: fence[1][0], length: fence[1].length, start: index };
    } else if (fence[1][0] === open.marker && fence[1].length >= open.length) {
      blocks.push({ text: lines.slice(open.start + 1, index).join('\n'), line: open.start + 2 });
      open = null;
    }
  }
  return blocks;
}

/** The same source with every fenced block blanked out, line numbering intact. */
function withoutFences(source) {
  const lines = source.split('\n');
  let open = null;
  return lines
    .map((line) => {
      const fence = line.match(/^\s*(```+|~~~+)/);
      if (fence && open === null) {
        open = { marker: fence[1][0], length: fence[1].length };
        return '';
      }
      if (fence && fence[1][0] === open.marker && fence[1].length >= open.length) {
        open = null;
        return '';
      }
      return open === null ? line : '';
    })
    .join('\n');
}

/**
 * The logical commands in a block: comments dropped, `\` continuations joined.
 */
function logicalCommands(text) {
  const commands = [];
  let pending = '';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!pending && (line === '' || line.startsWith('#'))) continue;
    if (line.endsWith('\\')) {
      pending += `${line.slice(0, -1).trim()} `;
      continue;
    }
    commands.push(`${pending}${line}`.trim());
    pending = '';
  }
  if (pending) commands.push(pending.trim());
  return commands.filter(Boolean);
}

/**
 * What an invocation runs and with what, or null if it runs no validator.
 *
 * npx flags are consumed until the first bare word, which is the binary. Only
 * `--package`/`-p` and npx's own `-c`/`--call` take a separate value, so those
 * are the only ones that need naming here.
 */
function invocation(command) {
  const tokens = command.split(/\s+/);
  let index = 0;
  const packages = [];
  let viaNpx = false;

  if (tokens[0] === 'npx') {
    viaNpx = true;
    index = 1;
    while (index < tokens.length) {
      const token = tokens[index];
      if (!token.startsWith('-')) break;
      if (token.startsWith('--package=')) {
        packages.push(token.slice('--package='.length));
        index += 1;
      } else if (token === '--package' || token === '-p') {
        packages.push(tokens[index + 1]);
        index += 2;
      } else if (token === '-c' || token === '--call') {
        index += 2;
      } else {
        index += 1;
      }
    }
  }

  const binary = tokens[index];
  if (!VALIDATOR_BINARIES.has(binary)) return null;

  // `-c <module>` is ajv-cli's custom-module flag, and it is `require`d from
  // wherever ajv-cli itself was installed.
  const rest = tokens.slice(index + 1);
  const modules = [];
  for (const [position, token] of rest.entries()) {
    if (token.startsWith('-c=')) modules.push(token.slice(3));
    else if (token === '-c' && rest[position + 1]) modules.push(rest[position + 1]);
  }

  return { viaNpx, packages, binary, modules };
}

// ── the sandbox ──────────────────────────────────────────────────────────────

/**
 * A directory that looks like the repository and has no `node_modules`.
 *
 * Symlinked rather than copied: the commands only read. The absence of
 * `node_modules` is the whole point — with one present, `npx ajv` finds
 * `node_modules/.bin/ajv` and every broken command in this repository passes,
 * which is exactly how they stayed broken. Node walks *up* from the working
 * directory looking for `node_modules`, so the scratch directory has to live
 * outside the checkout, not inside it.
 */
async function makeSandbox() {
  const sandbox = await mkdtemp(join(tmpdir(), 'fds-doc-commands-'));
  for (const entry of await readdir(ROOT, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    await symlink(join(ROOT, entry.name), join(sandbox, entry.name));
  }
  return sandbox;
}

function run(script, cwd) {
  // `-e`: a block is a sequence of commands a reader runs in order, and the
  // last one succeeding says nothing about the third. Without it a block of
  // five validations reports the exit status of the fifth.
  const result = spawnSync('bash', ['-c', `set -euo pipefail\n${script}`], {
    cwd,
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    env: {
      ...process.env,
      // npx prompts before installing when it has a terminal. A gate has to
      // decide the same way with and without one.
      npm_config_yes: 'true',
      npm_config_fund: 'false',
      npm_config_audit: 'false',
      npm_config_update_notifier: 'false',
    },
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    .split('\n')
    .filter((line) => !/^npm (notice|warn deprecated)/.test(line))
    .join('\n')
    .trim();
  if (result.error?.code === 'ETIMEDOUT') {
    return { ok: false, output: `timed out after ${TIMEOUT_MS / 1000}s\n${output}` };
  }
  return { ok: result.status === 0, output };
}

// ── checking ─────────────────────────────────────────────────────────────────

const problems = [];
const allowed = [];
const files = await markdownFiles();

/** Distinct block text -> {text, sites: ["file:line", …], files: [file, …]} */
const blocks = new Map();

for (const file of files) {
  const source = await readFile(join(ROOT, file), 'utf8');

  for (const block of fencedBlocks(source)) {
    const commands = logicalCommands(block.text);
    if (!commands.some((command) => invocation(command))) continue;
    const key = block.text.trim();
    if (!blocks.has(key)) blocks.set(key, { text: key, sites: [], files: [] });
    blocks.get(key).sites.push(`${file}:${block.line}`);
    blocks.get(key).files.push(file);
  }

  // A command outside a fence is a command nothing renders as copyable and
  // nothing here can run.
  for (const [index, line] of withoutFences(source).split('\n').entries()) {
    if (!/(^|\s)(npx\s[^\n]*\bajv\b|ajv(-cli)?\s+(validate|compile|-s\b))/.test(line)) continue;
    problems.push(
      `${file}:${index + 1}: an ajv command outside a fenced block.\n` +
        '    Fence it, so readers can copy it and this check can run it.'
    );
  }
}

const sandbox = await makeSandbox();
let executed = 0;

try {
  for (const block of [...blocks.values()].sort((a, b) => a.sites[0].localeCompare(b.sites[0]))) {
    const where = block.sites.join(', ');
    let resolvable = true;

    for (const command of logicalCommands(block.text)) {
      const parsed = invocation(command);
      if (!parsed) continue;

      if (!parsed.viaNpx) {
        resolvable = false;
        const allowance = allowanceFor('npx-required', block.files);
        const problem =
          `${where}: \`${parsed.binary}\` is run directly.\n` +
          '    A reader who has installed nothing has no `ajv` on PATH. Invoke it through\n' +
          '    `npx --package=ajv-cli --package=ajv-formats ajv …`.';
        (allowance ? allowed : problems).push(problem);
        continue;
      }

      if (parsed.packages.length === 0) {
        resolvable = false;
        const allowance = allowanceFor('npx-package', block.files);
        const problem =
          `${where}: \`npx ${parsed.binary}\` names no package.\n` +
          `    npx then guesses the package from the binary name, and whether npm publishes\n` +
          `    an executable called \`${parsed.binary}\` under a package of that name is not\n` +
          '    something this check can establish offline. Say it: `npx --package=ajv-cli …`.';
        (allowance ? allowed : problems).push(problem);
        continue;
      }

      const undeclared = parsed.modules.filter((module) => !parsed.packages.includes(module));
      if (undeclared.length) {
        resolvable = false;
        const allowance = allowanceFor('npx-package', block.files);
        const problem =
          `${where}: \`-c ${undeclared.join(', -c ')}\` names ` +
          `${undeclared.length > 1 ? 'modules' : 'a module'} npx was not asked to install.\n` +
          '    ajv-cli requires it from the sandbox npx builds, which holds only what\n' +
          `    --package names. Add ${undeclared.map((m) => `\`--package=${m}\``).join(' and ')}.`;
        (allowance ? allowed : problems).push(problem);
      }
    }

    if (!resolvable) continue;

    const result = run(block.text, sandbox);
    executed += 1;
    if (!result.ok) {
      problems.push(
        `${where}: the documented command does not run.\n` +
          `${result.output.split('\n').map((line) => `      ${line}`).join('\n')}`
      );
    }
  }
} finally {
  await rm(sandbox, { recursive: true, force: true });
}

// Under --self-test only the fixtures are read, so no allowance can match and
// an unused-allowance report would say nothing about the fixtures.
for (const allowance of SELF_TEST ? [] : TEMPORARY_ALLOWANCES) {
  if (allowance.used) continue;
  problems.push(
    `a temporary allowance matches nothing:\n    ${allowance.reason}\n` +
      '    Whatever it excused is fixed. Delete the entry from ' +
      'scripts/check-doc-commands.mjs.'
  );
}

// ── result ───────────────────────────────────────────────────────────────────

if (SELF_TEST) {
  const keys = problems.map((problem) => problem.split('\n')[0].trim()).sort();
  const recorded = (await readFile(join(ROOT, EXPECTED_FAILURES), 'utf8'))
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .sort();

  const missing = recorded.filter((line) => !keys.includes(line));
  const extra = keys.filter((line) => !recorded.includes(line));
  if (missing.length || extra.length) {
    console.error(
      '\nThe fixtures no longer fail the way they were recorded.\n\n' +
        missing.map((line) => `  no longer fails: ${line}`).join('\n') +
        (missing.length && extra.length ? '\n' : '') +
        extra.map((line) => `  newly fails:     ${line}`).join('\n') +
        `\n\nEither the check changed or ${EXPECTED_FAILURES} is stale. Both need a human.\n`
    );
    process.exit(1);
  }
  console.log(`  ok    self-test — the fixtures fail in all ${recorded.length} recorded ways`);
  process.exit(0);
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `  ok    ${executed} documented command block(s) ran from a checkout with nothing ` +
    `installed, across ${[...blocks.values()].reduce((n, b) => n + b.sites.length, 0)} ` +
    `site(s)${allowed.length ? `; ${allowed.length} known failure(s) allowed` : ''}.`
);
