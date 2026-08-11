#!/usr/bin/env node
/**
 * Nothing in this repository states a version fact the release manifest
 * contradicts.
 *
 * `specification/releases.json` is generated from one traversal of the published
 * tree, so it knows which schemas exist, which versions of each are served,
 * which of those is current, and what each release names. Everything else — the
 * website, the RFCs, the root markdown, the packages — restates some part of
 * that from memory, and memory is what drifts. Every version defect this project
 * has shipped is the same defect: a second copy of a number that nobody
 * rechecked.
 *
 *   - the navbar label sat at 1.0.0 for three releases;
 *   - the schema listing advertised `workout/v1.0.0` as a thing to build against;
 *   - `SCHEMAS.md` omitted `program` and claimed 36 workout examples when 46
 *     were published;
 *   - RFC-007 §9 pointed at a version its own §6 had just called superseded;
 *   - a roadmap linked `github.com/FDS-Spec/fds-spec`, an organisation that does
 *     not exist;
 *   - an examples page linked five registry paths that were never published.
 *
 * Every one of them is a claim checkable against the manifest and the
 * filesystem, offline. That is what this does.
 *
 * Nine rules:
 *
 *   1. The manifest is present and structurally sound. `check:schemas` proves
 *      the stronger thing — that the file matches what the build would write —
 *      so this is only the assumption the rules below rest on, stated where the
 *      reader can see it. It is deliberately not a second copy of that check.
 *   2. Every schema or registry reference quoted anywhere resolves to a file
 *      that is actually published. A reference to a *withdrawn* version is an
 *      error nothing can excuse: `exercise/v1.0.0` and `equipment/v1.0.0` were
 *      named by release 1.0.0 and are no longer served, and both 404 today.
 *   3. A reference at a version that is published but not *current* needs a
 *      pin marker naming it, with a reason. Without one it is drift, not intent.
 *   4. Every release string in prose names a release the manifest lists, and
 *      every claim about "the current release" — in prose, in the site's version
 *      label, or in a package default — names the manifest's `currentRelease`.
 *   5. Every count marked as a claim about this repository is true of the
 *      repository on disk.
 *   6. Every `github.com` URL naming this project names the actual git remote.
 *   7. The D31 floor: a package's `DEFAULT_SCHEMA_VERSION` is the current
 *      release. A package may lag in its own version number, never in content.
 *   8. URLs the *code* builds resolve too, not only the ones prose quotes. This
 *      repository has now shipped the same bug twice — a URL a mock proves
 *      well-formed and reality proves absent.
 *   9. Markers are used. A pin whose reference is gone, or a count metric
 *      nothing derives, is stale scaffolding claiming to be a check.
 *
 * ── Markers ──────────────────────────────────────────────────────────────────
 *
 * Two annotations, both plain text inside whatever comment syntax the host file
 * uses, so they survive the byte-for-byte page mirroring `check:mirrors`
 * enforces:
 *
 *   <!-- fds:pin workout/v1.0.0/workout.schema.json — superseded; releases
 *        1.2.0 and 1.3.0 declare it and a pinned client must keep resolving -->
 *
 *   <!-- fds:count schemas=10 entities=7 -->
 *
 * A pin is scoped to the file it appears in and names the reference exactly as
 * it resolves — `<dir>/v<version>/<file>`, or a registry filename. A count
 * marker asserts derived facts; the value must also appear in the neighbouring
 * text, as a numeral or an English word, so the marker cannot quietly stop
 * describing the sentence it annotates. Both are documented for authors in
 * `specification/governance/CONTRIBUTING.md`.
 *
 * ── Offline ──────────────────────────────────────────────────────────────────
 *
 * Nothing here fetches anything. A pull-request gate that needs the network
 * fails when the network does, which is why `check:published` is scheduled
 * rather than gated. So this proves a reference names a file the build
 * published, not that the CDN serves it — `check:published` is what proves the
 * second thing, weekly.
 *
 *   node scripts/check-versions.mjs
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import {
  ROOT,
  MANIFEST_PATH,
  PUBLISHED_DIRS,
  loadManifest,
  manifestProblems,
  schemaReferences,
  filesUnder,
} from './lib/releases.mjs';
import { matrixRows } from './lib/coverage-matrix.mjs';

// ── what is read ─────────────────────────────────────────────────────────────

/** Directories walked, plus every markdown file at the repository root. */
const SCAN_ROOTS = ['website', 'specification', 'packages'];

/** Extensions worth reading. Anything else cannot state a version claim. */
const SCAN_EXTENSIONS = new Set([
  '.md', '.mdx', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.yml', '.yaml',
]);

/** Directory names never descended into. */
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', 'coverage', '.docusaurus', '.next', '.git',
]);

/**
 * Files this check does not read, and why.
 *
 * All of them are generated, and `check:schemas` already proves each matches the
 * published tree byte for byte. Reading them would report the superseded
 * `workout/v1.0.0` `$id` — which is correct, frozen, and unfixable — as drift,
 * and no marker can be added to a frozen schema without changing its bytes.
 *
 * `specification/schema-sources/` is here for the same reason from the other
 * side: `build-schemas.mjs` asserts every source's `$id` equals the URL its path
 * resolves to, which is a stricter statement than anything below.
 */
const GENERATED = [
  'specification/releases.json',
  'specification/schemas/',
  'specification/schema-sources/',
  'packages/fds-transformer/src/schemas/bundled/',
  'packages/fds-transformer/src/schemas/releases.generated.ts',
];

/** Published-tree markdown is hand-written and stays in scope. */
const GENERATED_EXCEPTIONS = [/^specification\/schemas\/.*\.md$/];

/**
 * ⚠️ TEMPORARY ALLOWANCES — known defects this gate catches and does not fix.
 *
 * Each is a real failure. Each belongs to a change that is not this one, and
 * each is written down here rather than silently tolerated, scoped to the exact
 * files and the exact references involved so that nothing else slips past under
 * the same heading.
 *
 * An allowance that matches nothing is itself an error (rule 9). That is what
 * makes the list self-expiring: when the owning change lands, this gate fails
 * until the entry is deleted.
 */
const TEMPORARY_ALLOWANCES = [
  {
    label: 'registry URLs the transformer builds that were never published',
    removedBy: 'the change that repairs RegistryManager.getDefaultUrl()',
    why:
      'getDefaultUrl() builds muscles/equipment/muscle-categories `.registry.json` URLs. ' +
      'The published files carry `.example.` in the name — they are illustrative ' +
      'catalogs, not normative vocabularies — so all three 404, and the unit test ' +
      'asserts one of the broken URLs against a mock, which is how it survived. ' +
      'Rules 2 and 8 catch it; that is why this gate had to exist before the fix.',
    files: /^packages\/fds-transformer\/src\/registries\/registry-manager(\.test)?\.ts$/,
    references: [
      'registries/muscles.registry.json',
      'registries/equipment.registry.json',
      'registries/muscle-categories.registry.json',
    ],
  },
  {
    label: 'malformed `v.1.0.0` schema paths in RFC-002, RFC-003 and RFC-004',
    removedBy: 'the change that enrols the early RFCs',
    why:
      'Their §8 and §9 spell the version segment `v.1.0.0` rather than `v1.0.0`, so ' +
      'every link is broken. RFC-002 compounds it: the version it points at is ' +
      'equipment 1.0.0, which is withdrawn, so the repair is editorial rather than ' +
      'mechanical — it has to choose what the RFC now documents.',
    files: /(?:specification\/rfc|website\/docs\/specifications)\/rfc-00[234]-[\w-]+\.md$/,
    references: [/^schemas\/.*\/v\.\d+\.\d+\.\d+\//],
  },
];

/** Whether a known defect covers this reference, marking the allowance used. */
function allowed(file, reference) {
  for (const allowance of TEMPORARY_ALLOWANCES) {
    if (!allowance.files.test(file)) continue;
    const matches = allowance.references.some((pattern) =>
      typeof pattern === 'string' ? pattern === reference : pattern.test(reference)
    );
    if (!matches) continue;
    allowance.used = true;
    return true;
  }
  return false;
}

// ── derived counts ───────────────────────────────────────────────────────────

const isExample = (name) => name.includes('.example.') && name.endsWith('.json');
const isInvalid = (name) => name.includes('.invalid.') && name.endsWith('.json');

/**
 * Every count a document is allowed to assert, and how it is derived.
 *
 * Derived from disk and from the manifest, never from parsing the sentence that
 * makes the claim: "eight reps at one hundred kilograms" and "Node.js 18+" are
 * both numbers next to a noun, and neither is a count of anything in this
 * repository. A marker is what separates a claim from a sentence.
 */
async function deriveCounts({ manifest, byPath, currentOf }) {
  const counts = new Map();
  const set = (metric, value) => counts.set(metric, value);

  const rfcs = await readdir(join(ROOT, 'specification/rfc'));
  set('rfcs', rfcs.filter((f) => /^rfc-\d+.*\.md$/.test(f)).length);

  set('releases', Object.keys(manifest.releases ?? {}).length);
  set('schemas', byPath.size);

  const versions = Object.values(manifest.schemas ?? {});
  for (const kind of ['entity', 'library', 'tooling']) {
    set(`${kind === 'entity' ? 'entities' : kind === 'library' ? 'libraries' : 'tooling'}`,
      versions.filter((entry) => entry.kind === kind).length);
  }
  for (const status of ['current', 'superseded', 'withdrawn']) {
    set(status === 'current' ? 'current-versions' : status,
      versions.flatMap((entry) => Object.values(entry.versions))
        .filter((version) => version.status === status).length);
  }

  const registries = await readdir(join(ROOT, PUBLISHED_DIRS.registries));
  set('registries', registries.filter((f) => f.endsWith('.registry.json')).length);
  set('registry-examples', registries.filter((f) => f.endsWith('.registry.example.json')).length);

  const published = await filesUnder(PUBLISHED_DIRS.schemas);
  set('examples', published.filter(isExample).length);
  set('invalid', published.filter(isInvalid).length);

  // Per-schema counts are keyed on the manifest's current path, so renaming a
  // directory moves the count with it instead of silently reading zero.
  for (const [name, current] of currentOf) {
    const path = manifest.schemas[name].versions[current]?.path;
    if (!path) continue;
    const dir = `${dirname(path)}/`;
    const inDir = published.filter((file) => file.startsWith(dir));
    set(`examples:${name}`, inDir.filter(isExample).length);
    set(`invalid:${name}`, inDir.filter(isInvalid).length);
    // Everything shipped beside the schema to demonstrate or constrain it —
    // what the prescription library's README calls a fixture, since a negative
    // case is not an example of anything.
    set(`fixtures:${name}`, inDir.filter((f) => isExample(f) || isInvalid(f)).length);
    set(`scenarios:${name}`, matrixRows(name));
  }
  set('scenarios', matrixRows());

  return counts;
}

// ── markers ──────────────────────────────────────────────────────────────────

const PIN = /fds:pin\s+(\S+)/g;
const COUNT = /fds:count\s+((?:[\w:-]+=\d+\s*)+)/g;

/**
 * Character ranges covered by fenced code blocks.
 *
 * A marker inside a fence is being *shown*, not made — the contributing guide
 * has to be able to print one without annotating itself. References inside a
 * fence stay in scope: a URL in a worked `ajv` command or a `$id` snippet is as
 * real a claim as one in a sentence, and those are exactly the ones readers
 * copy.
 */
function fencedRanges(text) {
  const ranges = [];
  let open = null;
  let offset = 0;
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      if (open === null) open = offset;
      else {
        ranges.push([open, offset + line.length]);
        open = null;
      }
    }
    offset += line.length + 1;
  }
  return ranges;
}

/**
 * A pin's reason: the rest of the comment it sits in.
 *
 * The marker has to work inside whatever syntax the host file uses, so the
 * reason ends where the comment does — at an HTML or block-comment close — and
 * otherwise at the end of the line, which is what a `//` comment gives. Comment
 * decoration is stripped so a reason wrapped across a JSDoc block reads as one
 * sentence.
 */
function pinReason(text, from) {
  const window = text.slice(from, from + 500);
  const close = [window.indexOf('-->'), window.indexOf('*/')].filter((i) => i >= 0);
  const end = close.length ? Math.min(...close) : window.indexOf('\n');
  return window
    .slice(0, end < 0 ? undefined : end)
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\*|\/\/|#)?\s*/, ''))
    .join(' ')
    .replace(/^[\s—-]+/, '')
    .trim();
}

const UNITS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
];

/**
 * A count as this project writes it in prose — "Forty-six sessions", "Ten
 * schemas are published". Numbers under a hundred are routinely spelled out
 * here, so a check that only looked for digits would pass every such sentence
 * without reading it.
 */
function spellNumber(n) {
  if (n < 20) return UNITS[n];
  if (n < 100) {
    const tens = TENS[Math.floor(n / 10)];
    return n % 10 ? `${tens}-${UNITS[n % 10]}` : tens;
  }
  const rest = n % 100;
  return `${UNITS[Math.floor(n / 100)]} hundred${rest ? ` ${spellNumber(rest)}` : ''}`;
}

/**
 * The text a count marker annotates.
 *
 * Its own line, the previous non-blank one, and the next two — enough to reach
 * the sentence through a markdown heading or an opening JSX tag, and not so much
 * that an unrelated number in the next paragraph satisfies the marker.
 */
function neighbourhood(lines, index) {
  const near = [lines[index] ?? ''];
  for (let i = index - 1; i >= 0; i -= 1) {
    if (lines[i].trim()) {
      near.push(lines[i]);
      break;
    }
  }
  for (let i = index + 1, taken = 0; i < lines.length && taken < 2; i += 1) {
    if (lines[i].trim()) {
      near.push(lines[i]);
      taken += 1;
    }
  }
  // The markers themselves are full of numbers. A marker must be satisfied by
  // the prose, not by the marker on the line above it.
  return near.join('\n').replace(COUNT, '');
}

// ── code-constructed URLs ────────────────────────────────────────────────────

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

/**
 * URLs a source file builds, with the parts it computes left as wildcards.
 *
 * `const baseUrl = 'https://spec.vitness.me/registries'` followed by
 * `` `${baseUrl}/muscles.registry.json` `` resolves completely, and the result
 * either names a published file or does not. Where a segment is computed —
 * `` `${baseUrl}/exercises/v${v}/exercise.schema.json` `` — that segment becomes
 * `*` and the rest still has to match something published, which is enough to
 * catch a wrong directory or a wrong filename.
 *
 * Deliberately shallow: file-local `const` string literals only, no imports and
 * no control flow. A URL assembled across modules is not checked, and saying so
 * is better than a static analysis that quietly gives up.
 */
function constructedUrls(source) {
  const constants = new Map();
  for (const [, name, value] of source.matchAll(
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"\n]*)['"]/g
  )) {
    constants.set(name, value);
  }

  const urls = [];
  for (const match of source.matchAll(/`([^`]*)`/g)) {
    const raw = match[1];
    if (!/\$\{/.test(raw)) continue;
    const resolved = raw.replace(/\$\{\s*([^}]*?)\s*\}/g, (_, expression) =>
      constants.has(expression) ? constants.get(expression) : '*'
    );
    if (!/spec\.vitness\.me\/(schemas|registries)\//.test(resolved)) continue;
    urls.push({
      pattern: resolved.replace(/^https:\/\/spec\.vitness\.me\//, ''),
      line: source.slice(0, match.index).split('\n').length,
    });
  }
  return urls;
}

const globToRegExp = (pattern) =>
  new RegExp(`^${pattern.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')}$`);

// ── file discovery ───────────────────────────────────────────────────────────

async function scannedFiles() {
  const files = [];

  for (const name of await readdir(ROOT)) {
    if (name.endsWith('.md')) files.push(name);
  }

  for (const root of SCAN_ROOTS) {
    for (const relative of await filesUnder(root)) {
      const path = `${root}/${relative}`;
      if (relative.split('/').some((segment) => SKIP_DIRS.has(segment))) continue;
      if (path.endsWith('package-lock.json')) continue;
      if (!SCAN_EXTENSIONS.has(path.slice(path.lastIndexOf('.')))) continue;
      const generated =
        GENERATED.some((prefix) => path === prefix || path.startsWith(prefix)) &&
        !GENERATED_EXCEPTIONS.some((pattern) => pattern.test(path));
      if (generated) continue;
      files.push(path);
    }
  }

  return files.sort();
}

/** The repository this project is, from the checkout rather than from a claim. */
function gitRemote() {
  if (process.env.GITHUB_REPOSITORY) {
    const [org, repo] = process.env.GITHUB_REPOSITORY.split('/');
    return { org, repo, source: 'GITHUB_REPOSITORY' };
  }
  try {
    const url = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    const match = /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/.exec(url);
    return match ? { org: match[1], repo: match[2], source: 'git remote origin' } : null;
  } catch {
    return null;
  }
}

// ── run ──────────────────────────────────────────────────────────────────────

const problems = [];
const note = (problem) => problems.push(problem);

const loaded = await loadManifest();
const { manifest, byPath, currentOf, versionsOf } = loaded;

// Rule 1 — the assumption every other rule rests on. Nothing below can report
// anything meaningful about a manifest that does not describe itself.
problems.push(...manifestProblems(loaded));
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

/**
 * Which schema and status a published directory belongs to.
 *
 * A withdrawn version has no `path` — there are no bytes to record one from —
 * so its directory is reconstructed from the current version's, which is the
 * only place the naming convention is written down (`exercises/` for exercise,
 * `muscle/muscle-category/` for muscle-category).
 */
const dirIndex = new Map();
for (const [path, entry] of byPath) dirIndex.set(dirname(path), entry);
for (const [name, versions] of versionsOf) {
  const current = versions.get(currentOf.get(name));
  if (!current?.path) continue;
  for (const [version, entry] of versions) {
    if (entry.status !== 'withdrawn') continue;
    dirIndex.set(dirname(current.path).replace(/v[\d.]+$/, `v${version}`), entry);
  }
}

const publishedFiles = new Set(await filesUnder(PUBLISHED_DIRS.schemas));
const registryFiles = new Set(await filesUnder(PUBLISHED_DIRS.registries));
const exists = (ref) =>
  ref.kind === 'registries' ? registryFiles.has(ref.path) : publishedFiles.has(ref.path);

const counts = await deriveCounts(loaded);
const remote = gitRemote();
const files = await scannedFiles();

let referencesChecked = 0;
let pinsDeclared = 0;
let countsAsserted = 0;
let releaseStrings = 0;
let constructedChecked = 0;

for (const file of files) {
  const text = await readFile(join(ROOT, file), 'utf8');
  const lines = text.split('\n');

  // ── pins declared by this file ─────────────────────────────────────────────
  const pins = new Map(); // reference path -> { reason, line, used }
  // A marker names the reference it excuses, so the marker itself reads as a
  // reference to it. These spans are what stops a pin from pinning itself.
  const markerSpans = [];
  const fenced = fencedRanges(text);
  const isShown = (index) => fenced.some(([start, end]) => index >= start && index < end);

  for (const match of text.matchAll(PIN)) {
    if (isShown(match.index)) continue;
    const [, reference] = match;
    const line = text.slice(0, match.index).split('\n').length;
    markerSpans.push([match.index, match.index + match[0].length]);
    const reason = pinReason(text, match.index + match[0].length);

    if (reason.length < 20) {
      note(
        `${file}:${line}: fds:pin ${reference} has no reason worth the name.\n` +
          '    A pin is a decision. Write down why this version, not the current one.'
      );
      continue;
    }
    if (pins.has(reference)) {
      note(`${file}:${line}: fds:pin ${reference} is declared twice.`);
      continue;
    }
    pins.set(reference, { reason, line, used: false });
    pinsDeclared += 1;
  }

  // ── rules 2 and 3 — every reference resolves, and non-current ones are pinned
  for (const ref of schemaReferences(text)) {
    if (markerSpans.some(([start, end]) => ref.start >= start && ref.start < end)) continue;
    referencesChecked += 1;
    if (allowed(file, `${ref.kind}/${ref.path}`)) continue;
    const entry = ref.kind === 'schemas' ? dirIndex.get(dirname(ref.path)) : null;
    const pin = pins.get(ref.path);

    if (entry?.status === 'withdrawn') {
      note(
        `${file}:${ref.line}: references ${ref.path}, a withdrawn version.\n` +
          `    ${entry.name} ${entry.version} was named by a release and is no longer served; ` +
          'the URL 404s.\n' +
          `    Point at ${entry.name} ${currentOf.get(entry.name)}. A pin cannot excuse this — ` +
          'there are no bytes behind it.'
      );
      continue;
    }

    if (!exists(ref)) {
      if (pin) {
        pin.used = true;
        continue;
      }
      note(
        `${file}:${ref.line}: references ${PUBLISHED_DIRS[ref.kind]}/${ref.path}, which is not published.\n` +
          '    Either the path is wrong, or the file was never there. If the reference is ' +
          'deliberately unresolvable — a negative fixture, say — pin it:\n' +
          `        fds:pin ${ref.path} — why it does not resolve`
      );
      continue;
    }

    if (entry && entry.status !== 'current') {
      if (pin) {
        pin.used = true;
        continue;
      }
      note(
        `${file}:${ref.line}: references ${entry.name} ${entry.version}, which is ` +
          `${entry.status}. The current version is ${currentOf.get(entry.name)}.\n` +
          '    Point at the current version, or say why this one:\n' +
          `        fds:pin ${ref.path} — the reason this version and not the current one`
      );
    }
  }

  // ── rule 4 — release strings and current-release claims ────────────────────
  for (const match of text.matchAll(
    /\breleases?\s+((?:\d+\.\d+\.\d+)(?:(?:,| and|,? and)?\s+\d+\.\d+\.\d+)*)/gi
  )) {
    const line = text.slice(0, match.index).split('\n').length;
    for (const version of match[1].match(/\d+\.\d+\.\d+/g) ?? []) {
      releaseStrings += 1;
      if (!manifest.releases[version]) {
        note(
          `${file}:${line}: names release ${version}, which the manifest does not list ` +
            `(${Object.keys(manifest.releases).join(', ')}).\n` +
            '    A release nobody published is a URL nobody can resolve.'
        );
      }
    }
  }

  for (const pattern of [
    /current(?: FDS)? release is\s+\*{0,2}(\d+\.\d+\.\d+)/gi,
    /\*\*Specification Version:\*\*\s*FDS release\s+(\d+\.\d+\.\d+)/g,
  ]) {
    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split('\n').length;
      if (match[1] !== manifest.currentRelease) {
        note(
          `${file}:${line}: calls ${match[1]} the current release; the manifest says ` +
            `${manifest.currentRelease}.`
        );
      }
    }
  }

  // ── rule 5 — marked counts ─────────────────────────────────────────────────
  for (const match of text.matchAll(COUNT)) {
    if (isShown(match.index)) continue;
    const index = text.slice(0, match.index).split('\n').length - 1;
    const near = neighbourhood(lines, index);
    for (const assertion of match[1].trim().split(/\s+/)) {
      const [metric, raw] = assertion.split('=');
      const claimed = Number(raw);
      countsAsserted += 1;

      if (!counts.has(metric)) {
        note(
          `${file}:${index + 1}: fds:count names "${metric}", which nothing derives.\n` +
            `    Known: ${[...counts.keys()].sort().join(', ')}`
        );
        continue;
      }

      const actual = counts.get(metric);
      if (claimed !== actual) {
        note(
          `${file}:${index + 1}: claims ${metric}=${claimed}; the repository has ${actual}.\n` +
            '    Either the prose is stale or something was added without being counted.'
        );
        continue;
      }

      const spelled = new RegExp(`\\b(${claimed}|${spellNumber(claimed)})\\b`, 'i');
      if (!spelled.test(near)) {
        note(
          `${file}:${index + 1}: asserts ${metric}=${claimed}, but ${claimed} does not appear ` +
            'in the text beside it.\n' +
            '    A marker that has stopped describing its sentence checks nothing.'
        );
      }
    }
  }

  // ── rule 6 — this project's own GitHub URLs ────────────────────────────────
  if (remote) {
    for (const match of text.matchAll(/github\.com\/([\w.-]+)(?:\/([\w.-]+))?/g)) {
      const org = match[1];
      // A clone URL ends `.git`; it is the same repository under a longer name.
      const repo = match[2]?.replace(/\.git$/, '');
      // Only this project's own links are in scope. A third-party link is
      // somebody else's organisation and this check has no opinion about it.
      if (repo !== remote.repo && org !== remote.org) continue;
      if (org === remote.org && (repo === undefined || repo === remote.repo)) continue;
      const line = text.slice(0, match.index).split('\n').length;
      note(
        `${file}:${line}: links github.com/${org}${repo ? `/${repo}` : ''}; the ${remote.source} ` +
          `is ${remote.org}/${remote.repo}.\n` +
          '    A link to an organisation that does not own this repository resolves to nothing.'
      );
    }
  }

  // ── rule 8 — URLs the code builds ──────────────────────────────────────────
  if (CODE_EXTENSIONS.has(file.slice(file.lastIndexOf('.')))) {
    for (const { pattern, line } of constructedUrls(text)) {
      constructedChecked += 1;
      if (allowed(file, pattern)) continue;
      const kind = pattern.startsWith('registries/') ? 'registries' : 'schemas';
      const relative = pattern.slice(pattern.indexOf('/') + 1);
      const candidates = kind === 'registries' ? registryFiles : publishedFiles;
      const matcher = globToRegExp(relative);
      if (![...candidates].some((candidate) => matcher.test(candidate))) {
        note(
          `${file}:${line}: builds ${PUBLISHED_DIRS[kind]}/${relative}, which matches nothing ` +
            'published.\n' +
            '    A mock proves a URL is well formed. Only the published tree proves it exists.'
        );
      }
    }
  }

  // ── rule 9 — a pin nobody needed ───────────────────────────────────────────
  for (const [reference, pin] of pins) {
    if (pin.used) continue;
    note(
      `${file}:${pin.line}: fds:pin ${reference} matches no reference in this file.\n` +
        '    Either the reference moved and the pin did not, or the pin outlived its reason. ' +
        'Delete it.'
    );
  }
}

// ── rule 4, continued — the site's version label ─────────────────────────────

const SITE_CONFIG = 'website/docusaurus.config.ts';
const siteConfig = await readFile(join(ROOT, SITE_CONFIG), 'utf8');
const label = /versions:\s*\{\s*current:\s*\{\s*label:\s*'([^']+)'/.exec(siteConfig);
if (!label) {
  note(
    `${SITE_CONFIG}: no docs version label found.\n` +
      '    The label names the current release to every reader of the site; it cannot go ' +
      'unchecked.'
  );
} else if (label[1] !== manifest.currentRelease) {
  note(
    `${SITE_CONFIG}: the docs version label is ${label[1]}; the current release is ` +
      `${manifest.currentRelease}.\n` +
      '    Every page on the site carries this number.'
  );
}

// ── rule 7 — the D31 floor ───────────────────────────────────────────────────

let floorsChecked = 0;
for (const pkg of await readdir(join(ROOT, 'packages'))) {
  const sources = (await filesUnder(`packages/${pkg}`)).filter(
    (file) =>
      CODE_EXTENSIONS.has(file.slice(file.lastIndexOf('.'))) &&
      !file.split('/').some((segment) => SKIP_DIRS.has(segment)) &&
      !file.endsWith('.test.ts')
  );

  const literals = new Map(); // exported const name -> string literal
  let declaration = null;
  for (const file of sources) {
    const text = await readFile(join(ROOT, `packages/${pkg}/${file}`), 'utf8');
    for (const [, name, value] of text.matchAll(
      /export const ([A-Z][A-Z0-9_]*)(?::[^=]+)?\s*=\s*'([^']*)'/g
    )) {
      literals.set(name, value);
    }
    const match = /export const DEFAULT_SCHEMA_VERSION(?::[^=]+)?\s*=\s*([^;]+);/.exec(text);
    if (match) declaration = { file: `packages/${pkg}/${file}`, expression: match[1].trim() };
  }

  if (!declaration) continue;
  floorsChecked += 1;

  const expression = declaration.expression;
  const resolved = /^'([^']*)'$/.test(expression)
    ? expression.slice(1, -1)
    : literals.get(expression);

  if (resolved === undefined) {
    note(
      `${declaration.file}: DEFAULT_SCHEMA_VERSION is \`${expression}\`, which this check ` +
        'cannot resolve to a version.\n' +
        '    Assign it a string literal, or a constant this package exports as one.'
    );
  } else if (resolved !== manifest.currentRelease) {
    note(
      `${declaration.file}: DEFAULT_SCHEMA_VERSION is ${resolved}; the current release is ` +
        `${manifest.currentRelease}.\n` +
        '    A package may lag in its own version number. It may not lag in the release it ' +
        'targets — D31.'
    );
  }
}

if (!floorsChecked) {
  note(
    'No package declares DEFAULT_SCHEMA_VERSION.\n' +
      '    The D31 floor is checked by finding that declaration; if it is renamed, this check ' +
      'silently stops checking anything.'
  );
}

// ── rule 9, continued — an allowance nobody needed ───────────────────────────

for (const allowance of TEMPORARY_ALLOWANCES) {
  if (allowance.used) continue;
  note(
    `The temporary allowance for ${allowance.label} matches nothing.\n` +
      `    It was to be removed by ${allowance.removedBy}. That appears to have happened — ` +
      'delete the entry from TEMPORARY_ALLOWANCES in scripts/check-versions.mjs.'
  );
}

// ── result ───────────────────────────────────────────────────────────────────

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    `\nEvery version fact in this repository is checked against ${MANIFEST_PATH}, which is ` +
      'generated.\nFix the claim, not the manifest — or run `npm run build:schemas` if the ' +
      'manifest is what is stale.'
  );
  process.exit(1);
}

console.log(
  `  ok    ${files.length} files agree with ${MANIFEST_PATH}: ` +
    `${referencesChecked} references (${pinsDeclared} pinned), ` +
    `${releaseStrings} release strings, ${countsAsserted} counts, ` +
    `${constructedChecked} constructed URLs, ${floorsChecked} package default(s), ` +
    `release ${manifest.currentRelease}.`
);

// Loud on purpose. An allowance is a known defect still in the tree, and a
// tolerated failure that nobody is reminded of is indistinguishable from a
// passing check.
for (const allowance of TEMPORARY_ALLOWANCES) {
  console.log(`  allowed  ${allowance.label} — until ${allowance.removedBy}.`);
}
