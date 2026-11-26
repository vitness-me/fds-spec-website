#!/usr/bin/env node
/**
 * The structural-key code registries, and the key pages that quote them.
 *
 * The six key registries under specification/registries/ are generated from the
 * FDS Encoder's code lists (packages/fds-encoder), so the codes a key may use are
 * written down once. This script writes them, or checks four things:
 *
 *   1. REGISTRIES.  Every key registry on disk is byte-equal to what the encoder
 *      generates. A hand edit to a registry, or a code-list change in the encoder
 *      that nobody regenerated, fails here.
 *   2. CODES.  Every code shown in a table on the four key pages exists in a
 *      registry. A page that documents a code the encoder doesn't know is either a
 *      typo or a code nobody added.
 *   3. KEYS.  Every full key quoted on a docs page, English or translated, and in a
 *      JSON example under specification/ passes the encoder's check. The few keys a
 *      page quotes to show a mistake are listed in DELIBERATELY_WRONG, each with the
 *      reason. The conformance cases are left out: they quote invalid keys on purpose.
 *   4. LINKS.  Each key page links the registries that hold its codes.
 *
 * It reads the built encoder, so build it first:
 *
 *   npm --prefix packages/fds-encoder ci && npm --prefix packages/fds-encoder run build
 *   node scripts/key-registries.mjs --write     regenerate the registries
 *   node scripts/key-registries.mjs             check
 *   node scripts/key-registries.mjs --self-test prove each rule fails on a broken input
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEncoder } from './lib/encoder.mjs';
import { walk } from './lib/vocabulary.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_DIR = join(ROOT, 'specification/registries');
const PAGE_DIR = join(ROOT, 'website/docs/core-concepts/structural-keys');
/** Where the docs pages live: the English pages and each locale's translations. */
const DOC_DIRS = ['website/docs', ...readdirSync(join(ROOT, 'website/i18n'), { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => `website/i18n/${d.name}/docusaurus-plugin-content-docs`)]
  .filter((d) => existsSync(join(ROOT, d)));
const REGISTRY_URL = 'https://spec.vitness.me/registries/';

/** The registries each key page must link. */
const PAGE_REGISTRIES = {
  'exercise-key.md': ['exercise-key.registry.json', 'equipment-key.registry.json', 'body-points.registry.json', 'body-positions.registry.json'],
  'equipment-key.md': ['equipment-key.registry.json', 'body-points.registry.json', 'body-positions.registry.json'],
  'muscle-key.md': ['muscle-key.registry.json'],
  'muscle-category-key.md': ['muscle-category-key.registry.json', 'muscle-key.registry.json'],
};

/** Keys a page quotes on purpose to show a key that does not check. */
const DELIBERATELY_WRONG = new Map([
  ['FXM=1.0/deltoid.lateral', 'muscle-key.md shows the gym word "lateral" as the mistake; the FMA part is acromial'],
  ['FXMG=1.0/a:ank.ev', 'muscle-category-key.md says ankle eversion has no action category'],
  ['FXE=1.0S/k:robot', 'the Encoder\'s CLI reference and library API show the error for an unknown kind'],
  ['FXI=1.0S/m:el.flexx/o:standing/l:bell.dumb@hands', 'the Encoder\'s examples show check catching a typo'],
  ['FXI=1.0S/m:el.bend/o:standing/l:bell.dumb@hands', 'the Encoder\'s library API shows the KeyError for an unknown joint action'],
]);

/** Words a key-page table shows as what not to write. */
const NOT_CODES = new Map([
  ['lats', 'muscle-key.md: "latissimus-dorsi, never lats"'],
  ['glutes', 'muscle-category-key.md: "buttock, never glutes"'],
]);

const encoder = await loadEncoder();

const text = (registry) => `${JSON.stringify(registry, null, 2)}\n`;

// ── rule 1: the registries are the encoder's ────────────────────────────────

function registryProblems(generated, read) {
  const problems = [];
  for (const [file, registry] of Object.entries(generated)) {
    const onDisk = read(file);
    if (onDisk === undefined) problems.push(`${file} is missing. Run node scripts/key-registries.mjs --write.`);
    else if (onDisk !== text(registry)) problems.push(`${file} is not what the encoder generates. Run node scripts/key-registries.mjs --write, or change the encoder's code lists instead of the file.`);
  }
  return problems;
}

// ── rule 2: every code in a key-page table is in a registry ─────────────────

/** Every code the registries hold: values, codes, layer letters, actions, and each muscle part as muscle.part. */
function knownCodes(registries) {
  const known = new Set(['FXI', 'FXE', 'FXM', 'FXMG', '1.0', 'S', 'N', 'fxi', 'fxe', 'fxm', 'fxmg']);
  walk(registries, (node) => {
    for (const field of ['value', 'code', 'letter', 'action']) if (typeof node[field] === 'string') known.add(node[field]);
    if (typeof node.code === 'string' && Array.isArray(node.parts)) for (const part of node.parts) known.add(`${node.code}.${part.code}`);
  });
  return known;
}

/** The codes in one backticked span: layer letters, symbols and placeholders dropped. */
function codesIn(span) {
  if (/[<…]/.test(span) || /^FX(MG|M|I|E)=/.test(span)) return [];
  return span.split(/[\s/;]+/).flatMap((piece) => piece.replace(/^[a-z]:(?!$)/, '').split(/[+>|@,]/))
    .map((c) => c.replace(/^\*n$/, '').replace(/\*\d$/, '').replace(/^[~=%&^]+/, '').replace(/-$/, ''))
    .filter((c) => c !== '' && !/^[?*.:/\\\-|+>@,=~%&^0-9]+$/.test(c));
}

function codeProblems(pages, known) {
  const list = [...known];
  const isKnown = (c) => known.has(c)
    || (c.endsWith('.*') && list.some((k) => k.startsWith(c.slice(0, -1))))
    || (c.endsWith('.') && list.some((k) => k.startsWith(c)))
    || (/^(push|pull|assist)\.[a-z]+$/.test(c) && known.has(c.split('.')[1]))
    || (/^[a-z]+\.\?$/.test(c) && known.has(c.slice(0, -2)))
    || NOT_CODES.has(c);
  const problems = [];
  let count = 0;
  for (const [page, body] of Object.entries(pages)) {
    for (const line of body.split('\n')) {
      if (!line.startsWith('|') || /^\|[-| ]+\|$/.test(line)) continue;
      for (const [, span] of line.replaceAll('\\|', '\u0000').matchAll(/`([^`]+)`/g)) {
        for (const code of codesIn(span.replaceAll('\u0000', '|'))) {
          count++;
          if (!isKnown(code)) problems.push(`${page}: \`${code}\` (in \`${span}\`) is in no key registry.`);
        }
      }
    }
  }
  return { problems: [...new Set(problems)], count };
}

// ── rule 3: every quoted key checks ─────────────────────────────────────────

// A key runs to the quote, backtick, space or bracket that closes it. `,`, `>` and `|` are symbols inside a key; a
// table cell writes `|` as `\|`.
const KEY = /(FX(?:MG|M|I|E)=[^\s`'")<…\]\\]+)/g;

/** A code pattern (`bell.*`, `deltoid.*`): the prefix before `.*`. What follows it in the item (`*1`, `@hands`) stays. */
const PATTERN = /(?<![a-z0-9.-])([a-z][a-z0-9-]*(?:\.[a-z0-9-]+)*)\.\*/g;

/**
 * A key with each pattern (`l:bell.*@hands`, `FXM=1.0/deltoid.*`) replaced by the first of the sorted codes it matches,
 * so the rest of the key is checked too. Undefined when no code matches a pattern.
 */
function patternInstance(key, codes) {
  let unmatched = false;
  const filled = key.replace(PATTERN, (_, prefix) => {
    const code = codes.find((k) => k.startsWith(`${prefix}.`));
    if (code === undefined) unmatched = true;
    return code ?? prefix;
  });
  return unmatched ? undefined : filled;
}

function keyProblems(sources, known) {
  const codes = [...known].sort();
  const problems = [];
  let count = 0;
  for (const [where, text] of Object.entries(sources)) {
    const body = text.replaceAll('\\|', '|');
    for (const m of body.matchAll(KEY)) {
      const key = m[1].replace(/[.;:,]+$/, '');
      const next = body[m.index + m[1].length] ?? '';
      // A header alone (`FXI=1.0`) or a placeholder (`<joint>`, `…`) is not a key. A key with a pattern
      // (`deltoid.*`, `bell.*@hands`) is checked with the pattern filled in.
      if (!/=\d+\.\d+[SN]?\/./.test(key) || next === '<' || next === '…' || DELIBERATELY_WRONG.has(key)) continue;
      count++;
      const checked = key.includes('.*') ? patternInstance(key, codes) : key;
      if (checked === undefined) { problems.push(`${where}: ${key}: no code matches the pattern.`); continue; }
      const c = encoder.checkKey(checked);
      if (!c.ok) problems.push(`${where}: ${key} does not check: ${c.issues.map((i) => i.message).join(' ')}`);
    }
  }
  return { problems: [...new Set(problems)], count };
}

// ── rule 4: the pages link their registries ─────────────────────────────────

function linkProblems(pages) {
  const problems = [];
  for (const [page, files] of Object.entries(PAGE_REGISTRIES)) {
    for (const file of files) if (!(pages[page] ?? '').includes(`](${REGISTRY_URL}${file})`)) problems.push(`${page} does not link ${REGISTRY_URL}${file}.`);
  }
  return problems;
}

// ── run ─────────────────────────────────────────────────────────────────────

const generated = encoder.buildRegistries();
const readRegistry = (file) => (existsSync(join(REGISTRY_DIR, file)) ? readFileSync(join(REGISTRY_DIR, file), 'utf8') : undefined);
if (process.argv.includes('--write')) {
  for (const [file, registry] of Object.entries(generated)) writeFileSync(join(REGISTRY_DIR, file), text(registry));
  console.log(`wrote ${Object.keys(generated).length} key registries to specification/registries/`);
  process.exit(0);
}

const pages = Object.fromEntries(Object.keys(PAGE_REGISTRIES).map((p) => [p, readFileSync(join(PAGE_DIR, p), 'utf8')]));

const known = knownCodes(generated);

/** Every docs page and JSON example whose keys rule 3 checks, by repository path. */
function keySources() {
  const files = (dir, keep) => readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' }).filter(keep).map((f) => `${dir}/${f}`);
  const docs = DOC_DIRS.flatMap((dir) => files(dir, (f) => /\.mdx?$/.test(f)));
  const examples = files('specification', (f) => f.endsWith('.json') && !f.endsWith('.schema.json')
    && !f.startsWith('conformance/') && !f.split('/').pop().startsWith('invalid.'));
  return Object.fromEntries([...docs, ...examples].sort().map((p) => [p, readFileSync(join(ROOT, p), 'utf8')]));
}

const sources = keySources();

if (process.argv.includes('--self-test')) {
  const failures = [];
  const expectFail = (name, problems) => { if (problems.length === 0) failures.push(`${name} passed a broken input`); };
  const [first] = Object.keys(generated);
  expectFail('registries', registryProblems(generated, (f) => (f === first ? text({ tampered: true }) : text(generated[f]))));
  expectFail('registries (missing)', registryProblems(generated, (f) => (f === first ? undefined : text(generated[f]))));
  expectFail('codes', codeProblems({ 'page.md': '| `bell.dumbb` | A typo |' }, known).problems);
  expectFail('codes (layer value)', codeProblems({ 'page.md': '| `l:bar.straight@backside` | x |' }, known).problems);
  expectFail('keys', keyProblems({ 'page.md': 'A key `FXI=1.0S/m:el.bend/o:standing/l:none` here.' }, known).problems);
  expectFail('keys (muscle)', keyProblems({ 'page.md': '`FXM=1.0/lats`' }, known).problems);
  // A key ending in a pattern is still checked before the pattern, and the pattern must match a code.
  expectFail('keys (pattern, bad motion)', keyProblems({ 'page.md': '`FXI=1.0S/m:el.bend/o:standing/l:bell.*`' }, known).problems);
  expectFail('keys (pattern with hold, bad motion)', keyProblems({ 'page.md': '`FXI=1.0S/m:el.bend/o:standing/l:bell.*@hands`' }, known).problems);
  expectFail('keys (pattern, bad motion before a good pattern)', keyProblems({ 'page.md': '`FXI=1.0S/m:el.bend/o:standing/l:bell.dumb@hands/h:arms.*`' }, known).problems);
  expectFail('keys (pattern, no code)', keyProblems({ 'page.md': '`FXM=1.0/nomuscle.*`' }, known).problems);
  if (keyProblems({ 'page.md': '`FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands/h:arms.*` `FXM=1.0/deltoid.*` `FXI=1.0S/m:el.flex/o:standing/l:bell.*@hands` `FXI=1.0S/m:hip.ext/o:standing/l:bell.**1@hands`' }, known).problems.length > 0) failures.push('keys rejected a valid pattern');
  // Each key is valid up to a , > or | and broken after it: a check that stops at the separator passes all three.
  const separated = '`FXI=1.0S/o:standing/l:none/m:el.flex>el.bend` `FXI=1.0S/m:=sp.flex/o:prone/l:none/s:floor@feet,nope` `FXI=1.0S/o:prone/l:none/m:=sp.flex\\|hip.bend`';
  if (keyProblems({ 'page.md': separated }, known).problems.length !== 3) failures.push('keys are checked only up to a , > or |');
  // A bad key in any docs page fails: an Encoder page, and a translation alone, are scanned too.
  const planted = (path) => {
    if (!(path in sources)) { failures.push(`keys: ${path} is not scanned`); return []; }
    return keyProblems({ ...sources, [path]: `${sources[path]}\n\n\`FXI=1.0S/m:el.twist/o:standing/l:none\`\n` }, known).problems;
  };
  if (keyProblems(sources, known).problems.length > 0) failures.push('keys: the repository fails before anything is planted');
  expectFail('keys (Encoder page)', planted('website/docs/tools/encoder/index.md'));
  expectFail('keys (Spanish page only)', planted('website/i18n/es/docusaurus-plugin-content-docs/current/core-concepts/structural-keys/exercise-key.md'));
  expectFail('links', linkProblems({ ...pages, 'muscle-key.md': '' }));
  if (codeProblems({ 'page.md': '| `m:hip.ext+kn.ext` | `l:bell.dumb@hands` | `x:rc@legs+u@arms` | `bell.*` | `FXMG=1.0/a:hip.flex` |' }, known).problems.length > 0) failures.push('codes rejected valid codes');
  if (failures.length > 0) { console.error(failures.join('\n')); process.exit(1); }
  console.log('  ok    self-test — every rule fails on a broken input and passes a good one');
  process.exit(0);
}

const problems = [];
problems.push(...registryProblems(generated, readRegistry));
const codes = codeProblems(pages, known);
problems.push(...codes.problems);
const keys = keyProblems(sources, known);
problems.push(...keys.problems);
problems.push(...linkProblems(pages));

if (problems.length > 0) {
  console.error(`${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`  ok    ${Object.keys(generated).length} key registries match the encoder; ${codes.count} table codes are in them; ${keys.count} quoted keys in ${Object.keys(sources).length} docs pages and examples check; the key pages link them`);
