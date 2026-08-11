#!/usr/bin/env node
/**
 * The published tarball is the thing that gets checked, not the working tree.
 *
 * Every packaging defect this repository has shipped survived a green run
 * because every gate read the repository. A package is not its repository: it
 * is one tarball, containing the subset of files `files` and npm's own rules
 * let through, resolved by a consumer whose working directory is
 * `node_modules/@vitness/<name>/` and not this checkout. Those two views agree
 * right up until they don't, and where they disagree is exactly where the
 * defects were.
 *
 * Four of them, all live on `main` when this was written, all invisible to ten
 * checks and to `npm pack --dry-run` in both publish workflows:
 *
 *   - `main` was `./SKILL.md`, so importing the skill threw
 *     `TypeError: Unknown file extension ".md"` in the consumer's loader. Every
 *     gate that reads the skill reads it as documents; none of them ever asked
 *     Node to load it as a package.
 *   - Both packages declared MIT and neither carried the licence text. A
 *     `license` field is metadata; the grant is the file.
 *   - `packages/fds-skill/CLAUDE.md` shipped, pointing at
 *     `/specification/...` paths that exist here and exist nowhere in an
 *     installed package. `check:skill` validates those paths — against this
 *     tree, which is the wrong tree. A correct document inside an incorrect
 *     package.
 *   - The transformer's build copied one release's schemas into `dist/`,
 *     described as the offline fallback. Nothing read them; the real fallback
 *     is inlined into the bundle. So the tarball's own directory listing
 *     asserted a capability, the code implemented it somewhere else entirely,
 *     and nothing compared the two.
 *
 * That last one is the recurring shape here — asserted in one place,
 * implemented in another, nothing comparing them — so the rule that replaces it
 * refuses to look at files at all. It installs the tarball and asks it to do
 * the thing.
 *
 * ── Five rules ───────────────────────────────────────────────────────────────
 *
 *   1. LOCKFILE.  A package has exactly one lockfile and it is
 *      `package-lock.json`. CI, both publish workflows and `ci-local.sh` all
 *      install with `npm ci`; a `pnpm-lock.yaml` beside it is a second answer
 *      to the same question that nothing reads and nothing rechecks. A package
 *      with no lockfile fails `npm ci` outright, which is how the skill was
 *      blocked from publishing at all.
 *
 *   2. LICENCE.  The tarball carries the licence its manifest declares. Checked
 *      in the tarball rather than the directory because npm's force-include
 *      rules are what put it there, and rules are worth confirming rather than
 *      trusting.
 *
 *   3. ENTRY POINTS.  Every entry point the manifest declares resolves inside
 *      the tarball, names a file Node can actually load, and — for the ones
 *      that execute — runs. `main`, `bin`, `types` and every `exports` target,
 *      taken from the manifest rather than listed here, so a package that gains
 *      an entry point gains coverage without this file being edited.
 *
 *      The executing half was a claim this sentence made and nothing performed:
 *      a `bin` was read for its `#!` line and never started. So the version it
 *      reports was free to be a string literal in the source, and it was — the
 *      CLI answered `--version` with a hard-coded `0.1.0` that a bump in
 *      `package.json` would leave behind. A consumer who installs 0.2.0, runs
 *      the binary and is told 0.1.0 has no way to tell which number is wrong,
 *      and every bug report from then on names the wrong release. It now runs
 *      each `bin` with `--version` and requires the answer to be the version
 *      the tarball's own manifest declares.
 *
 *   4. SHIPPED PATHS.  A path in a shipped document resolves for the person the
 *      package was shipped to. A candidate that resolves from the repository
 *      root and not from the package root is the defect: the document is
 *      correct and the package is not. Both sides are read off disk, so there
 *      is no list of allowed paths to go stale.
 *
 *   5. OFFLINE RELEASES.  The installed transformer resolves every release the
 *      manifest names, from bundled copies, with no network — and covers
 *      exactly the entities that release names. The release list comes from
 *      `specification/releases.json`, so publishing a release makes this
 *      stricter with no edit here. This is the rule that would have caught the
 *      dead `dist/` copies, and it is deliberately behavioural: it asserts what
 *      a consumer gets, not which files are present.
 *
 * ── Why a tarball on every pull request ──────────────────────────────────────
 *
 * Because it is cheap where it runs. The transformer half needs `dist/`, so it
 * runs in the transformer CI job, after the build that job already does —
 * `prepack` rebuilds, `npm pack` writes ~400 kB, `tar` extracts it, and the
 * probe imports it once. The skill half has no build and no dependencies.
 * Together they cost a couple of seconds on top of a job that already installs
 * and builds, which is far less than one publish of a broken package costs.
 *
 * The probe deliberately does not `npm install` the tarball from the registry:
 * that would need the network, and a gate that needs the network fails when the
 * network does. It symlinks the package's own locked `node_modules` next to the
 * extracted tree instead, so the shipped files run against the same dependency
 * tree CI tested and publishing installs.
 *
 *   node scripts/check-packages.mjs             both packages
 *   node scripts/check-packages.mjs transformer just one
 *   node scripts/check-packages.mjs --self-test prove the rules can fail
 */

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, posix } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadManifest, manifestProblems, ROOT } from './lib/releases.mjs';

const PACKAGES = ['fds-transformer', 'fds-skill'];

/** Extensions Node will load as a module. Anything else is not an entry point. */
const LOADABLE = new Set(['.js', '.mjs', '.cjs', '.node']);

const ok = (message) => console.log(`  \x1b[32mok\x1b[0m    ${message}`);

function fail(problems) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('');
  process.exit(1);
}

// ── the rules, as functions over a described tarball ──────────────────────────
//
// Separated from the packing so they can be run against a synthetic package in
// --self-test. A rule that has only ever been handed a real, working tarball has
// not been shown to fail, and this project's position is that such a rule is not
// yet a gate.

/**
 * A described package: `json` is its manifest, `entries` the tarball's paths
 * relative to the package root, `read` returns a shipped file's text.
 */

/** Rule 2. */
function licenceProblems({ name, json, entries }) {
  const problems = [];
  const declared = json.license;
  if (!declared) {
    problems.push(
      `${name}: package.json declares no license.\n` +
        '    Add a "license" field and a LICENSE file carrying its text.'
    );
    return problems;
  }
  const file = entries.find((entry) => /^LICEN[CS]E(\.\w+)?$/.test(entry));
  if (!file) {
    problems.push(
      `${name}: declares "license": ${JSON.stringify(declared)} and the tarball carries no ` +
        'LICENSE file.\n' +
        `    The field is metadata; the grant is the file. Add packages/${name}/LICENSE ` +
        `with the ${declared} text.`
    );
  }
  return problems;
}

/**
 * Every entry point the manifest declares.
 *
 * `subpath` is what a consumer writes after the package name, and `condition`
 * the last resolution condition on the way to the file. Both matter, because
 * only one combination has to be loadable JavaScript: the root subpath under a
 * runtime condition. `@vitness/fds-skill/knowledge/schemas.md` is markdown on
 * purpose — a knowledge pack's subpaths are assets, and a rule that demanded
 * `.js` everywhere would be demanding the package not exist. Likewise `types`
 * resolves for the type checker and is never loaded.
 */
function entryPoints(json) {
  const found = [];
  const add = (field, target, subpath, condition) => {
    if (typeof target === 'string') found.push({ field, target, subpath, condition });
  };

  add('main', json.main, '.', 'default');
  add('module', json.module, '.', 'default');
  add('types', json.types, '.', 'types');

  if (typeof json.bin === 'string') add('bin', json.bin, null, 'bin');
  else {
    for (const [name, target] of Object.entries(json.bin ?? {})) {
      add(`bin.${name}`, target, null, 'bin');
    }
  }

  const walkExports = (node, subpath, condition) => {
    if (typeof node === 'string') {
      const label = condition === 'default' ? subpath : `${subpath} ${condition}`;
      return add(`exports[${label}]`, node, subpath, condition);
    }
    for (const [key, value] of Object.entries(node ?? {})) {
      if (key.startsWith('.')) walkExports(value, key, 'default');
      else walkExports(value, subpath, key);
    }
  };
  walkExports(json.exports, '.', 'default');

  return found;
}

/**
 * The path `import '<package>'` resolves to, as the package itself declares it.
 *
 * Taken from the manifest so the probe imports what a consumer imports. Reading
 * it out of `exports` rather than assuming `dist/index.js` is the difference
 * between testing the package and testing a guess about the package.
 */
function importEntry(json) {
  const root = json.exports?.['.'];
  const target =
    (typeof root === 'string' ? root : root?.import ?? root?.default) ?? json.main ?? json.module;
  return typeof target === 'string' ? posix.normalize(target.replace(/^\.\//, '')) : null;
}

/** Rule 3, the part that can be decided from the file list alone. */
function entryPointProblems({ name, json, entries, read }) {
  const problems = [];
  const shipped = new Set(entries);
  const points = entryPoints(json);

  if (!points.length) {
    // Not an error. A package may legitimately expose no entry point — but it
    // must do so by declaring none, not by declaring one that cannot load.
    return problems;
  }

  for (const { field, target, subpath, condition } of points) {
    const path = posix.normalize(target.replace(/^\.\//, ''));

    // A wildcard names a set. It resolves if the set is non-empty; an `exports`
    // pattern pointing into a directory `files` does not ship resolves to
    // nothing, silently, for every subpath a consumer tries.
    if (path.includes('*')) {
      const prefix = path.slice(0, path.indexOf('*'));
      if (!entries.some((entry) => entry.startsWith(prefix))) {
        problems.push(
          `${name}: ${field} is ${JSON.stringify(target)} and the tarball has nothing under ` +
            `${prefix}.\n` +
            `    Every subpath a consumer resolves through this pattern will fail. Either ship ` +
            `${prefix} by adding it to "files", or drop the pattern.`
        );
      }
      continue;
    }

    if (!shipped.has(path)) {
      problems.push(
        `${name}: ${field} is ${JSON.stringify(target)}, which the tarball does not contain.\n` +
          `    npm packs a "files" entry that does not exist without failing, so this installs ` +
          `cleanly and fails at import in someone else's build. Add ${path} to "files", or ` +
          `build it before packing.`
      );
      continue;
    }

    // The defect that made the skill unimportable: a manifest may name any file
    // it likes, and npm will pack it, but Node decides what it can load by
    // extension. `main: "./SKILL.md"` throws ERR_UNKNOWN_FILE_EXTENSION inside
    // the consumer's loader, which names their code and not this package.
    //
    // Only the root subpath under a runtime condition. A subpath export of an
    // asset is the correct way to publish one, and `types` is never loaded.
    const isRootImport = subpath === '.' && condition !== 'types' && condition !== 'typings';
    const extension = path.slice(path.lastIndexOf('.'));
    if (isRootImport && !LOADABLE.has(extension)) {
      problems.push(
        `${name}: ${field} is ${JSON.stringify(target)}, which Node cannot load as a module — ` +
          `it will throw ERR_UNKNOWN_FILE_EXTENSION for "${extension}".\n` +
          '    A package with nothing importable should declare nothing importable: remove ' +
          '"main" and expose the files as "exports" subpaths, so the failure is ' +
          'ERR_PACKAGE_PATH_NOT_EXPORTED at resolution rather than a type error inside the ' +
          'consumer\'s loader.'
      );
      continue;
    }

    // npm symlinks a `bin` onto PATH. Without a shebang the shell runs it as a
    // shell script, and the first line of a bundle is not shell.
    if (field.startsWith('bin')) {
      const text = read(path) ?? '';
      if (!text.startsWith('#!')) {
        problems.push(
          `${name}: ${field} is ${JSON.stringify(target)} and it has no #! line.\n` +
            '    npm links it onto PATH, so the shell will try to run a JavaScript bundle as a ' +
            'shell script. Add a shebang banner in tsup.config.ts.'
        );
      }
    }
  }

  return problems;
}

/** Every executable the manifest declares, as `{ name, path }` inside the tarball. */
function binTargets(json) {
  const declared =
    typeof json.bin === 'string' ? { [json.name ?? 'bin']: json.bin } : (json.bin ?? {});
  return Object.entries(declared).map(([name, target]) => ({
    name,
    path: posix.normalize(target.replace(/^\.\//, '')),
  }));
}

/**
 * Rule 3, the half that cannot be decided by reading.
 *
 * A shipped executable is asked what version it is, and has to answer with the
 * version the manifest beside it declares. Two things are settled at once, and
 * the second is the reason this runs the binary rather than grepping the source:
 * that the number is derived from the manifest rather than restated, and that
 * whatever it derives it *from* survived the build — the transformer reads
 * `../../package.json`, which is the package root from `dist/bin/` and from
 * `src/bin/` alike, and a change to the output layout would break that silently
 * in the tarball while every test in the package still passed.
 *
 * `--version` is assumed rather than discovered. A command-line tool that cannot
 * say which version it is has a defect of its own, and the alternative — parsing
 * the source for a `.version()` call — is the reading this rule exists to stop
 * doing.
 */
function runBinaryProblems({ name, json, root }) {
  const problems = [];

  for (const bin of binTargets(json)) {
    let stdout;
    try {
      stdout = execFileSync(process.execPath, [join(root, bin.path), '--version'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 60_000,
      });
    } catch (error) {
      const detail = `${error.stderr ?? ''}${error.stdout ?? error.message ?? ''}`.trim();
      problems.push(
        `${name}: \`${bin.name} --version\` did not run.\n` +
          `    ${detail.split('\n').slice(0, 4).join('\n    ')}\n` +
          '    npm links this onto PATH, so this is the first thing a consumer does with the ' +
          'package.'
      );
      continue;
    }

    const reported = stdout.trim();
    if (reported !== json.version) {
      problems.push(
        `${name}: \`${bin.name} --version\` reports ${JSON.stringify(reported)} and the tarball ` +
          `declares ${JSON.stringify(json.version)}.\n` +
          '    The executable is stating a version of its own instead of deriving the one it ' +
          `was published as. Read it from the manifest — \`package.json\` is two levels above ` +
          `${bin.path}, in the checkout and in the tarball alike — rather than writing it out ` +
          'in the source, where a release bump leaves it behind.'
      );
    }
  }

  return problems;
}

/**
 * Rule 4.
 *
 * Candidates are paths written the way a reader is expected to follow them: a
 * markdown link target, or a backticked span containing a slash. A candidate is
 * a problem when it resolves against the repository root and not against the
 * package root — that is precisely "written for someone standing in the
 * checkout, shipped to someone who is not".
 *
 * Deliberately not "every path that fails to resolve in the tarball". A document
 * naming a path on the operator's own disk, or a path in some other project, is
 * not making a claim about this package. Only the ones this repository would
 * satisfy are evidence of the mistake.
 */
function shippedPathProblems({ name, entries, read, repoFiles }) {
  const problems = [];
  const shipped = new Set(entries);

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    const text = read(entry);
    if (text === null) continue;

    const candidates = new Set();
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) candidates.add(target);
    for (const [, span] of text.matchAll(/`([^`\n]+)`/g)) candidates.add(span);

    const flagged = new Set();
    for (const raw of candidates) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('#')) continue; // a URL or an anchor
      const path = posix.normalize(raw.replace(/^\.\//, '').replace(/^\//, ''));
      if (!path.includes('/') || path.startsWith('..')) continue;
      if (shipped.has(path)) continue;
      if (!repoFiles.has(path)) continue;
      flagged.add(raw);
    }

    for (const raw of [...flagged].sort()) {
      problems.push(
        `${name}: ${entry} points at ${JSON.stringify(raw)}, which exists in this repository ` +
          'and not in the tarball.\n' +
          '    A consumer reads this file from node_modules, where that path resolves to ' +
          'nothing. Either link it as a URL under https://spec.vitness.me or the repository ' +
          `on GitHub, or take ${entry} out of "files" because it is addressed to someone ` +
          'working in the checkout.'
      );
    }
  }

  return problems;
}

/** Rule 1. Filesystem rather than tarball: a lockfile is never packed. */
async function lockfileProblems(name) {
  const dir = join(ROOT, 'packages', name);
  const present = readdirSync(dir).filter((entry) =>
    ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock'].includes(entry)
  );

  if (!present.includes('package-lock.json')) {
    return [
      `${name}: no package-lock.json.\n` +
        '    CI, ci-local.sh and the publish workflow all install with `npm ci`, which fails ' +
        'without one — so the package cannot be published at all. Create it with ' +
        `\`cd packages/${name} && npm install --package-lock-only\` and commit it.`,
    ];
  }

  const others = present.filter((entry) => entry !== 'package-lock.json');
  if (others.length) {
    return [
      `${name}: ${others.join(' and ')} beside package-lock.json.\n` +
        '    Nothing installs from it — CI, ci-local.sh and the publish workflow all use ' +
        '`npm ci` — so it is a second answer to "which versions" that no run ever rechecks. ' +
        `Delete packages/${name}/${others[0]}.`,
    ];
  }

  return [];
}

// ── self-test ────────────────────────────────────────────────────────────────
//
// The four rules above are pure, so they can be handed a package that is wrong
// on purpose. Each case is a defect that was really on `main`; a run that passes
// has therefore also failed, four times, in the ways it claims to catch.

/**
 * The one rule that cannot be handed a fixture, because it runs one.
 *
 * A three-line package is written to a temporary directory and executed. Its
 * `bin` has no dependencies, so nothing is linked and nothing is installed —
 * which is also what makes this a fair test of the rule rather than of the
 * transformer.
 */
function selfTestBinaries(silent) {
  const cases = [
    [
      'an executable reporting a version its manifest does not declare',
      '0.2.0',
      "console.log('0.1.0');",
      true,
    ],
    [
      'an executable that cannot answer --version at all',
      '0.2.0',
      "process.exit(1);",
      true,
    ],
    ['an executable reporting the version it was published as', '0.2.0', "console.log('0.2.0');", false],
  ];

  const work = mkdtempSync(join(tmpdir(), 'fds-packages-selftest-'));
  try {
    for (const [label, version, body, shouldFail] of cases) {
      const root = join(work, label.replace(/\W+/g, '-'));
      mkdirSync(join(root, 'bin'), { recursive: true });
      const json = { name: 'fixture', version, bin: { tool: './bin/tool.js' } };
      writeFileSync(join(root, 'package.json'), JSON.stringify(json));
      writeFileSync(join(root, 'bin/tool.js'), `#!/usr/bin/env node\n${body}\n`);

      const found = runBinaryProblems({ name: 'fixture', json, root }).length > 0;
      if (found !== shouldFail) {
        silent.push(
          shouldFail
            ? `the rules stayed silent on: ${label}.`
            : `a clean fixture was flagged: ${label}.`
        );
      }
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }

  return cases.filter(([, , , shouldFail]) => shouldFail).length;
}

function selfTest() {
  const repoFiles = new Set(['specification/releases.json', 'specification/rfc/rfc-001.md']);
  const clean = {
    name: 'fixture',
    json: {
      license: 'MIT',
      exports: { './knowledge/*': './knowledge/*' },
      bin: { tool: './dist/bin/tool.js' },
      types: './dist/index.d.ts',
    },
    entries: ['LICENSE', 'README.md', 'dist/bin/tool.js', 'dist/index.d.ts', 'knowledge/a.md'],
    read: (path) => (path === 'dist/bin/tool.js' ? '#!/usr/bin/env node\n' : ''),
    repoFiles,
  };

  const cases = [
    ['a declared licence with no LICENSE file', licenceProblems, { ...clean, entries: ['README.md', 'dist/bin/tool.js', 'dist/index.d.ts', 'knowledge/a.md'] }],
    ['main naming a file Node cannot load', entryPointProblems, { ...clean, json: { ...clean.json, main: './SKILL.md' }, entries: [...clean.entries, 'SKILL.md'] }],
    ['an entry point absent from the tarball', entryPointProblems, { ...clean, json: { ...clean.json, main: './dist/index.js' } }],
    ['an exports pattern over a directory that does not ship', entryPointProblems, { ...clean, json: { ...clean.json, exports: { './prompts/*': './prompts/*' } } }],
    ['a bin with no shebang', entryPointProblems, { ...clean, read: () => 'import x from "y";\n' }],
    ['a shipped document pointing at a repository-only path', shippedPathProblems, { ...clean, entries: [...clean.entries, 'CLAUDE.md'], read: (path) => (path === 'CLAUDE.md' ? 'See `/specification/releases.json` for versions.\n' : '#!/usr/bin/env node\n') }],
  ];

  const silent = [];
  for (const [label, rule, input] of cases) {
    if (!rule(input).length) silent.push(`the rules stayed silent on: ${label}.`);
  }

  const noise = [
    ...licenceProblems(clean),
    ...entryPointProblems(clean),
    ...shippedPathProblems(clean),
  ];
  for (const problem of noise) silent.push(`a clean fixture was flagged: ${problem.split('\n')[0]}`);

  const executed = selfTestBinaries(silent);

  if (silent.length) fail(silent);
  ok(
    `self-test — the rules fail in all ${cases.length + executed} recorded ways, and pass a ` +
      'clean package'
  );
}

// ── packing ──────────────────────────────────────────────────────────────────

/**
 * Pack a package and extract it, returning the described tarball.
 *
 * `npm pack` runs `prepack`, so the transformer rebuilds here and the tarball is
 * the one `npm publish` would upload rather than whatever `dist/` happened to
 * hold. That equivalence is the whole reason the build hook is `prepack` and not
 * `prepublishOnly`: under the latter, `npm pack` inspects a stale tree and
 * `npm publish` uploads a fresh one, and the check and the artifact are two
 * different things again.
 */
function packAndExtract(name, work) {
  const dir = join(ROOT, 'packages', name);
  const out = join(work, `${name}-tarball`);
  const extracted = join(work, `${name}-extracted`);

  mkdirSync(out, { recursive: true });
  try {
    execFileSync('npm', ['pack', '--pack-destination', out], {
      cwd: dir,
      stdio: 'pipe',
      env: { ...process.env, npm_config_loglevel: 'error' },
    });
  } catch (error) {
    const detail = `${error.stderr ?? ''}${error.stdout ?? ''}`.trim();
    fail([
      `${name}: \`npm pack\` failed.\n` +
        `    ${detail.split('\n').slice(-6).join('\n    ')}\n` +
        `    Packing runs the package's prepack script, so this usually means the build did not ` +
        `run. Try \`cd packages/${name} && npm ci && npm run build\`.`,
    ]);
  }

  const [tarball] = readdirSync(out);
  mkdirSync(extracted, { recursive: true });
  execFileSync('tar', ['-xzf', join(out, tarball), '-C', extracted]);

  return { root: join(extracted, 'package'), tarball: join(out, tarball) };
}

async function describe(name, root) {
  const entries = (await readdir(root, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath ?? entry.path, entry.name).slice(root.length + 1))
    .sort();

  const contents = new Map();
  for (const entry of entries) {
    if (!/\.(md|js|mjs|cjs|json|txt)$/.test(entry) && entry !== 'LICENSE') continue;
    contents.set(entry, await readFile(join(root, entry), 'utf8'));
  }

  return {
    name,
    json: JSON.parse(await readFile(join(root, 'package.json'), 'utf8')),
    entries,
    read: (path) => contents.get(path) ?? null,
  };
}

/** Every file in the repository, relative to the root, for Rule 4. */
async function repositoryFiles() {
  const listed = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' });
  return new Set(listed.split('\n').filter(Boolean));
}

// ── ask the tarball to do the thing ──────────────────────────────────────────

/**
 * Make the extracted tarball runnable.
 *
 * `node_modules` is symlinked from the package directory rather than installed:
 * the point is to run the *shipped* files against the *locked* dependency tree,
 * which is what a consumer gets and what CI tested. Installing from the registry
 * would prove the same thing while needing the network to do it.
 */
function linkDependencies(name, root) {
  const modules = join(ROOT, 'packages', name, 'node_modules');
  if (!existsSync(modules)) {
    return [
      `${name}: node_modules is missing, so the packed tarball cannot be run.\n` +
        `    Run \`cd packages/${name} && npm ci\` first. CI installs before it packs.`,
    ];
  }
  try {
    symlinkSync(modules, join(root, 'node_modules'), 'dir');
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  return [];
}

/**
 * Rule 5. Load every release the manifest names, from the extracted tarball,
 * offline.
 *
 * Run in a child process because proving "no network" means replacing `fetch`
 * before the package is imported, and because a package that hangs or exits
 * should not take the gate with it.
 */
function offlineReleaseProblems({ name, root, manifest, entry }) {
  const expected = {};
  for (const [release, named] of Object.entries(manifest.releases ?? {})) {
    expected[release] = Object.keys(named.entities ?? {}).sort();
  }

  const probe = `
    globalThis.fetch = async (url) => {
      throw new Error('the packaging gate disabled the network; requested ' + url);
    };
    const expected = ${JSON.stringify(expected)};
    const { SchemaManager } = await import(${JSON.stringify(pathToFileURL(join(root, entry)).href)});
    const report = {};
    for (const [release, entities] of Object.entries(expected)) {
      try {
        const manager = new SchemaManager();
        await manager.loadVersion(release);
        const result = manager.getLoadResult();
        report[release] = { source: result.source, entities: result.entities.slice().sort() };
      } catch (error) {
        report[release] = { error: String(error && error.message).split('\\n')[0] };
      }
    }
    process.stdout.write(JSON.stringify(report));
  `;

  let report;
  try {
    const stdout = execFileSync(process.execPath, ['--input-type=module', '-e', probe], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    report = JSON.parse(stdout);
  } catch (error) {
    return [
      `${name}: the packed tarball could not be imported at all.\n` +
        `    ${`${error.stderr ?? error.message}`.trim().split('\n').slice(0, 4).join('\n    ')}`,
    ];
  }

  const problems = [];
  for (const [release, entities] of Object.entries(expected)) {
    const got = report[release];
    if (got.error) {
      problems.push(
        `${name}: release ${release} does not resolve offline from the published tarball — ` +
          `${got.error}\n` +
          '    specification/releases.json names this release, so a consumer with no network ' +
          'gets nothing for it. Bundle it under src/schemas/bundled/ and register a loader in ' +
          'src/schemas/schema-manager.ts.'
      );
      continue;
    }
    if (got.source !== 'bundled') {
      problems.push(
        `${name}: release ${release} loaded from "${got.source}" with fetch disabled.\n` +
          '    The probe replaces fetch before importing, so nothing should reach the network. ' +
          'Something is fetching by another route.'
      );
      continue;
    }
    const missing = entities.filter((entity) => !got.entities.includes(entity));
    if (missing.length) {
      problems.push(
        `${name}: release ${release} resolves offline without ${missing.join(', ')}.\n` +
          `    The manifest says release ${release} names ${entities.join(', ')}. A consumer ` +
          'validating one of the missing entities offline gets no schema at all. Rebuild the ' +
          'bundled copies with `npm run build:schemas`.'
      );
    }
  }

  return problems;
}

// ── run ──────────────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const only = process.argv.slice(2).find((argument) => !argument.startsWith('-'));
const selected = only ? PACKAGES.filter((name) => name.includes(only)) : PACKAGES;
if (!selected.length) {
  fail([`no package matches "${only}". Known: ${PACKAGES.join(', ')}.`]);
}

const { manifest, versionsOf } = await loadManifest();
const structural = manifestProblems({ manifest, versionsOf });
if (structural.length) fail(structural);

const repoFiles = await repositoryFiles();
const work = mkdtempSync(join(tmpdir(), 'fds-packages-'));
const problems = [];
const summaries = [];
let binariesRun = 0;

try {
  for (const name of selected) {
    problems.push(...(await lockfileProblems(name)));

    const { root } = packAndExtract(name, work);
    const described = await describe(name, root);

    problems.push(...licenceProblems(described));
    problems.push(...entryPointProblems(described));
    problems.push(...shippedPathProblems({ ...described, repoFiles }));

    // Rule 5 applies to whichever package claims to work offline, and the claim
    // is a directory of bundled schemas in its source — not a package name
    // written here. A second package that started bundling releases would be
    // held to the same rule without this file being touched.
    const bundles = existsSync(join(ROOT, 'packages', name, 'src/schemas/bundled'));
    const entry = importEntry(described.json);

    // Both of the rules that run the tarball need its dependencies beside it.
    // Linked once, on demand: a package that ships neither an executable nor a
    // bundle never runs, so it is never asked for a `node_modules` it has no
    // reason to have — the skill declares no dependencies at all.
    const executables = binTargets(described.json);
    const runnable = executables.length || (bundles && entry);
    const linkage = runnable ? linkDependencies(name, root) : [];
    problems.push(...linkage);

    if (executables.length && !linkage.length) {
      problems.push(...runBinaryProblems({ ...described, root }));
      binariesRun += executables.length;
    }

    if (bundles && entry && !linkage.length) {
      problems.push(...offlineReleaseProblems({ name, root, manifest, entry }));
    } else if (bundles && !entry) {
      problems.push(
        `${name}: bundles schemas under src/schemas/bundled/ but declares no importable entry ` +
          'point, so the offline claim cannot be tested.\n' +
          '    Declare "exports" with an "import" condition, or "main".'
      );
    }

    summaries.push(
      `${name} — ${described.entries.length} files, ` +
        `${entryPoints(described.json).length} entry point(s)`
    );
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (problems.length) fail(problems);

const releases = Object.keys(manifest.releases ?? {}).length;
ok(
  `packaged tarballs — ${summaries.join('; ')}; ` +
    `all ${releases} releases resolve offline from the published build; ` +
    `${binariesRun} executable(s) report the version their tarball declares`
);
