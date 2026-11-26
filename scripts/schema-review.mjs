#!/usr/bin/env node
/**
 * Writes a static review site for the schema changes a branch makes.
 *
 * A maintainer tool, not part of the published site. It compares a checkout
 * against a base ref and writes, to `.schema-review/` in the current directory:
 *
 *   index.html          every published schema the branch adds, changes or
 *                       removes, with property counts; the release manifest
 *                       change; other changed specification files; and the
 *                       unchanged schemas, collapsed
 *   <entity>-<v>.html   one page per added or changed schema: a summary of new,
 *                       changed and removed fields and definitions, every
 *                       change by JSON path, a side-by-side diff, both sources,
 *                       and every example — validated against both versions,
 *                       searchable, with the structural key fields marked
 *
 * A new version directory is compared with the newest version of the same
 * schema on the base, found by the path with its `vX.Y.Z` segment set aside, so
 * `exercises/v1.2.0/exercise.schema.json` is read against
 * `exercises/v1.1.0/exercise.schema.json`. An unfrozen schema edited in place is
 * compared with its own base bytes.
 *
 * The new side is the working tree, so uncommitted edits are reviewed too;
 * `--head <ref>` reads a commit instead. The site needs no network and no
 * server beyond a static one.
 *
 * Usage:
 *   node scripts/schema-review.mjs [--repo <path>] [--base <ref>] [--head <ref>] [--out <dir>]
 *   node scripts/schema-review.mjs --self-test
 *
 *   --repo  checkout to review (default: current directory)
 *   --base  ref to compare against (default: origin/main); not fetched
 *   --head  ref to review instead of the working tree
 *   --out   output directory (default: .schema-review in the current directory)
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  KEY_FIELDS,
  deepEqual,
  diffLines,
  formatPath,
  jsonDiff,
  keyFieldOccurrences,
  summarizeSchemaChange,
} from './lib/schema-diff.mjs';

const { values: opts } = parseArgs({
  options: {
    repo: { type: 'string', default: process.cwd() },
    base: { type: 'string', default: 'origin/main' },
    head: { type: 'string' },
    out: { type: 'string', default: join(process.cwd(), '.schema-review') },
    'self-test': { type: 'boolean', default: false },
  },
});

if (opts['self-test']) {
  process.exit(selfTest());
}

const SCHEMAS_DIR = 'specification/schemas/';
const MANIFEST = 'specification/releases.json';
const SCANNED_ROOTS = ['specification', 'website/docs', 'README.md', 'SCHEMAS.md'];
const MARKER = '.schema-review-output';
let prepared = false;

let Ajv;
let addFormats;
try {
  Ajv = (await import('ajv/dist/2020.js')).default;
  addFormats = (await import('ajv-formats')).default;
} catch {
  console.error('ajv is not installed. Run `npm install --no-save ajv@8 ajv-formats@3`.');
  process.exit(1);
}

const repo = resolve(opts.repo.replace(/^~(?=\/)/, process.env.HOME));
const git = (...args) =>
  execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });

let baseSha;
try {
  baseSha = git('rev-parse', '--verify', `${opts.base}^{commit}`).trim();
} catch {
  console.error(`schema-review: ${opts.base} is not a commit in ${repo}`);
  process.exit(1);
}

// ── Reading both sides ────────────────────────────────────────────────────────

/** A ref's files under the scanned roots, read on demand. */
function refTree(ref, label) {
  const files = git('ls-tree', '-r', '--name-only', '-z', ref, '--', ...SCANNED_ROOTS).split('\0').filter(Boolean);
  const set = new Set(files);
  const cache = new Map();
  return {
    label,
    files,
    has: (p) => set.has(p),
    read(p) {
      if (!set.has(p)) return null;
      if (!cache.has(p)) cache.set(p, git('show', `${ref}:${p}`));
      return cache.get(p);
    },
  };
}

/** The working tree's files under the scanned roots, tracked or not. */
function workTree(label) {
  const files = [];
  const walk = (rel) => {
    const abs = join(repo, rel);
    if (!existsSync(abs)) return;
    if (statSync(abs).isDirectory()) {
      for (const name of readdirSync(abs)) {
        if (name === 'node_modules' || name === '.git') continue;
        walk(rel ? `${rel}/${name}` : name);
      }
    } else files.push(rel);
  };
  for (const root of SCANNED_ROOTS) walk(root);
  const set = new Set(files);
  return { label, files, has: (p) => set.has(p), read: (p) => (set.has(p) ? readFileSync(join(repo, p), 'utf8') : null) };
}

const branch = git('rev-parse', '--abbrev-ref', 'HEAD').trim();
const headSha = git('rev-parse', opts.head ?? 'HEAD').trim();
const dirty = !opts.head && git('status', '--porcelain', '--', 'specification').trim() !== '';
const base = refTree(baseSha, opts.base);
const head = opts.head
  ? refTree(headSha, opts.head)
  : workTree(`working tree${dirty ? ' (uncommitted specification changes)' : ''}`);

const parse = (text, where) => {
  try {
    return { value: JSON.parse(text) };
  } catch (e) {
    return { error: `${where}: ${e.message}` };
  }
};

const baseManifest = base.read(MANIFEST) ? parse(base.read(MANIFEST), MANIFEST).value : null;
const headManifest = head.read(MANIFEST) ? parse(head.read(MANIFEST), MANIFEST).value : null;

/** published path → { name, kind, status } from either manifest. */
function manifestIndex(manifest) {
  const map = new Map();
  for (const [name, entry] of Object.entries(manifest?.schemas ?? {})) {
    for (const [version, rec] of Object.entries(entry.versions ?? {})) {
      if (rec.path) map.set(rec.path, { name, kind: entry.kind, status: rec.status, frozen: rec.frozen, version });
    }
  }
  return map;
}
const baseIndex = manifestIndex(baseManifest);
const headIndex = manifestIndex(headManifest);

const VERSION_DIR = /\/v(\d+\.\d+\.\d+)\//;
const cmpVersion = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
};

/** A published schema file, described by its place in the tree. */
function schemaInfo(path) {
  const rel = path.slice(SCHEMAS_DIR.length);
  const m = rel.match(VERSION_DIR) ?? `/${rel}`.match(VERSION_DIR);
  const version = m ? m[1] : '?';
  const family = rel.replace(/(^|\/)v\d+\.\d+\.\d+\//, '$1{v}/');
  const meta = headIndex.get(rel) ?? baseIndex.get(rel);
  const name = meta?.name ?? basename(rel).replace(/\.schema\.json$/, '');
  return { path, rel, version, family, name, kind: meta?.kind ?? 'unlisted', dir: dirname(path) };
}

const schemaFiles = (tree) => tree.files.filter((p) => p.startsWith(SCHEMAS_DIR) && p.endsWith('.schema.json')).map(schemaInfo);
const baseSchemas = schemaFiles(base);
const headSchemas = schemaFiles(head);
const baseByPath = new Map(baseSchemas.map((s) => [s.path, s]));
const headByPath = new Map(headSchemas.map((s) => [s.path, s]));

const changes = []; // { status: 'added' | 'changed', old?, new }
const unchanged = [];
for (const s of headSchemas) {
  if (baseByPath.has(s.path)) {
    if (base.read(s.path) === head.read(s.path)) unchanged.push(s);
    else changes.push({ status: 'edited in place', old: baseByPath.get(s.path), new: s });
  } else {
    const prior = baseSchemas
      .filter((b) => b.family === s.family && cmpVersion(b.version, s.version) < 0)
      .sort((x, y) => cmpVersion(y.version, x.version))[0];
    changes.push({ status: prior ? 'new version' : 'new schema', old: prior, new: s });
  }
}
const removedSchemas = baseSchemas.filter((s) => !headByPath.has(s.path));
const byName = (x, y) => x.name.localeCompare(y.name) || cmpVersion(x.version, y.version);
changes.sort((x, y) => byName(x.new, y.new));
unchanged.sort(byName);

// ── Validation ───────────────────────────────────────────────────────────────

/** A validator for one side's schema; each gets its own Ajv so equal `$id`s never collide. */
function compile(schema) {
  try {
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    return { validate: ajv.compile(schema) };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Validators for one side, by definition. A library's root validates nothing, so
 * its fixtures are checked against the `$defs` entry their file name starts
 * with, as `check-prescription` does.
 */
function validators(schema) {
  const cache = new Map();
  return (def) => {
    if (!schema) return null;
    const key = def ?? '';
    if (!cache.has(key)) {
      // The root's `not` only stops a whole document validating against the library.
      const { $id, not, ...rest } = schema;
      cache.set(key, compile(def ? { ...rest, $id: `urn:schema-review:${def}`, $ref: `#/$defs/${def}` } : schema));
    }
    return cache.get(key);
  };
}

/** `ok` is whether the document did what it is for: an `.invalid.json` fixture passes by being rejected. */
function validateWith(compiled, doc, expectInvalid = false) {
  if (!compiled) return null;
  if (compiled.error) return { ok: false, errors: [`schema does not compile: ${compiled.error}`] };
  const valid = compiled.validate(doc);
  const errors = valid
    ? []
    : compiled.validate.errors.map(
        (e) => `${e.instancePath || '(root)'} ${e.message}${Object.keys(e.params ?? {}).length ? ` ${JSON.stringify(e.params)}` : ''}`
      );
  if (expectInvalid) return { ok: !valid, rejected: !valid, errors: valid ? ['accepted, but this fixture must be rejected'] : [] , reasons: errors };
  return { ok: valid, errors };
}

// ── Examples and documentation blocks ────────────────────────────────────────

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exampleRe = (info) =>
  info.kind === 'library'
    ? /^[^/]+\.(?:example|invalid)\.json$/
    : new RegExp(`^${escapeRe(info.name)}\\.(?:[^/]+\\.)?example(?:\\.[^/]+)?\\.json$`);

/**
 * Example files for a schema, in any version directory of its family. An entity's
 * are named after it; a library's are `<definition>.<variant>.example.json`, with
 * `.invalid.json` fixtures that must be rejected.
 */
function examplesIn(tree, info) {
  const re = exampleRe(info);
  return tree.files.filter((p) => {
    if (!p.startsWith(SCHEMAS_DIR) || !re.test(basename(p))) return false;
    const dirFamily = dirname(p.slice(SCHEMAS_DIR.length)).replace(/(^|\/)v\d+\.\d+\.\d+$/, '$1{v}');
    return dirFamily === dirname(info.family);
  });
}

/** Root property names and required list of an entity schema that closes its root. */
function rootShape(schema) {
  if (schema?.additionalProperties !== false || !schema.properties) return null;
  return { allowed: new Set(Object.keys(schema.properties)), required: schema.required ?? [] };
}

/**
 * JSON documents in the docs that declare a schema: a fence marked
 * `fds:document entity=<name>`, a top-level `$schema` naming its `$id`, or a
 * top-level `schemaVersion` whose keys fit exactly one current entity's root.
 * Fragments and ignored blocks are skipped, as `check:doc-examples` reads them.
 */
function docBlocks(tree, shapes) {
  const found = [];
  const mdFiles = tree.files.filter((p) => /\.mdx?$/.test(p) && !p.startsWith(SCHEMAS_DIR));
  for (const file of mdFiles) {
    const text = tree.read(file);
    const fence = /^```json([^\n]*)\n([\s\S]*?)^```/gm;
    let m;
    while ((m = fence.exec(text))) {
      const info = m[1];
      if (/fds:(fragment|ignore)/.test(info)) continue;
      const line = text.slice(0, m.index).split('\n').length;
      const parsed = parse(m[2], `${file}:${line}`);
      const marked = info.match(/fds:document\s+entity=([\w-]+)/)?.[1];
      let entity = marked;
      const doc = parsed.value;
      if (!entity && isRecord(doc)) {
        if (typeof doc.$schema === 'string') entity = shapes.byId.get(doc.$schema);
        if (!entity && 'schemaVersion' in doc) {
          const keys = Object.keys(doc);
          const fits = [...shapes.byName].filter(
            ([, s]) => keys.every((k) => s.allowed.has(k)) && s.required.every((r) => keys.includes(r))
          );
          if (fits.length === 1) entity = fits[0][0];
        }
      }
      if (entity) found.push({ file, line, entity, text: m[2], parsed, how: marked ? 'marked' : 'shape' });
    }
  }
  return found;
}
const isRecord = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// Current entity shapes on the head side, for attributing unmarked doc blocks.
const shapes = { byName: new Map(), byId: new Map() };
for (const s of headSchemas) {
  if (s.kind !== 'entity') continue;
  const schema = parse(head.read(s.path), s.path).value;
  if (!schema) continue;
  if (schema.$id) shapes.byId.set(schema.$id, s.name);
  const latest = headSchemas.filter((o) => o.family === s.family).sort((x, y) => cmpVersion(y.version, x.version))[0];
  const shape = rootShape(schema);
  if (latest === s && shape) shapes.byName.set(s.name, shape);
}
const blocks = docBlocks(head, shapes);

// ── HTML ──────────────────────────────────────────────────────────────────────

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const compact = (v, max = 400) => {
  const s = v === undefined ? 'undefined' : JSON.stringify(v);
  return s.length > max ? `${s.slice(0, max)}…` : s;
};
const KEY_RE = new RegExp(`^"(${KEY_FIELDS.join('|')})"$`);

/** One line of pretty JSON with light token colouring and the key fields marked. */
function jsonLine(line) {
  const tok = /"(?:[^"\\]|\\.)*"(\s*:)?|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = tok.exec(line))) {
    out += esc(line.slice(last, m.index));
    const t = m[0];
    if (m[1] !== undefined) {
      const key = t.slice(0, t.length - m[1].length);
      out += `<span class="${KEY_RE.test(key) ? 'k fx' : 'k'}">${esc(key)}</span>${esc(m[1])}`;
    } else if (t[0] === '"') out += `<span class="s">${esc(t)}</span>`;
    else out += `<span class="n">${esc(t)}</span>`;
    last = m.index + t.length;
  }
  return out + esc(line.slice(last));
}

/** Lines of pretty JSON, each marked when it falls inside a key field's value. */
function markedLines(text) {
  const lines = text.split('\n');
  const marked = new Array(lines.length).fill(false);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(new RegExp(`^(\\s*)"(${KEY_FIELDS.join('|')})"\\s*:\\s*(.*)$`));
    if (!m) continue;
    marked[i] = true;
    if (/[[{]$/.test(m[3])) {
      for (let j = i + 1; j < lines.length; j++) {
        marked[j] = true;
        if (lines[j].match(/^\s*/)[0].length === m[1].length) break;
      }
    }
  }
  return lines.map((l, i) => ({ text: l, fx: marked[i] }));
}

/** A searchable, numbered code view. */
function codeView(text, { search = true } = {}) {
  const lines = markedLines(text)
    .map((l, i) => `<span class="ln${l.fx ? ' fxl' : ''}" data-n="${i + 1}">${jsonLine(l.text) || ' '}</span>`)
    .join('');
  const bar = search
    ? `<div class="search"><input type="search" placeholder="Search" aria-label="Search this document">` +
      `<button type="button" data-step="-1" aria-label="Previous match">↑</button>` +
      `<button type="button" data-step="1" aria-label="Next match">↓</button>` +
      `<label><input type="checkbox" class="only"> matching lines only</label><span class="count"></span></div>`
    : '';
  return `<div class="codebox">${bar}<pre class="code">${lines}</pre></div>`;
}

/** Side-by-side line diff, unchanged runs folded; stacks into one column on a phone. */
function sideBySide(oldText, newText, { context = 3, foldMin = 8 } = {}) {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  const am = markedLines(oldText);
  const bm = markedLines(newText);
  const rows = [];
  let dels = [];
  let adds = [];
  const flush = () => {
    const n = Math.max(dels.length, adds.length);
    for (let i = 0; i < n; i++) rows.push({ kind: 'chg', l: dels[i], r: adds[i] });
    dels = [];
    adds = [];
  };
  for (const op of diffLines(oldText, newText)) {
    if (op.type === 'eq') {
      flush();
      rows.push({ kind: 'eq', l: op.a, r: op.b });
    } else if (op.type === 'del') dels.push(op.a);
    else adds.push(op.b);
  }
  flush();
  if (!rows.some((r) => r.kind === 'chg')) return '<p class="muted">No line differences.</p>';

  const near = new Array(rows.length).fill(false);
  rows.forEach((r, i) => {
    if (r.kind !== 'chg') return;
    for (let k = Math.max(0, i - context); k <= Math.min(rows.length - 1, i + context); k++) near[k] = true;
  });
  const cell = (side, idx, cls) =>
    idx === undefined
      ? `<div class="c ${side} empty"></div>`
      : `<div class="c ${side} ${cls}${(side === 'l' ? am : bm)[idx].fx ? ' fxl' : ''}"><span class="no">${idx + 1}</span>` +
        `<span class="t">${jsonLine((side === 'l' ? a : b)[idx]) || ' '}</span></div>`;
  const rowHtml = (r) =>
    r.kind === 'eq'
      ? `<div class="row eq">${cell('l', r.l, '')}${cell('r', r.r, '')}</div>`
      : `<div class="row chg">${cell('l', r.l, 'del')}${cell('r', r.r, 'add')}</div>`;

  let html = '';
  for (let i = 0; i < rows.length; ) {
    if (rows[i].kind === 'eq' && !near[i]) {
      let j = i;
      while (j < rows.length && rows[j].kind === 'eq' && !near[j]) j++;
      if (j - i >= foldMin) {
        html += `<details class="fold"><summary>${j - i} unchanged lines (${rows[i].r + 1}–${rows[j - 1].r + 1})</summary>${rows
          .slice(i, j)
          .map(rowHtml)
          .join('')}</details>`;
      } else html += rows.slice(i, j).map(rowHtml).join('');
      i = j;
    } else html += rowHtml(rows[i++]);
  }
  return `<div class="sbs"><div class="row head"><div class="c l">before</div><div class="c r"><span class="wide">after</span></div></div>${html}</div>`;
}

function opsList(ops, { empty = 'No differences.' } = {}) {
  if (!ops.length) return `<p class="muted">${empty}</p>`;
  return `<ul class="ops">${ops
    .map((o) => {
      const where = `<code class="path">${esc(formatPath(o.path))}</code>`;
      if (o.op === 'add') return `<li class="add">${where} ${o.item ? 'gains item' : 'added'} <code>${esc(compact(o.new))}</code></li>`;
      if (o.op === 'remove') return `<li class="del">${where} ${o.item ? 'loses item' : 'removed'} <code>${esc(compact(o.old))}</code></li>`;
      if (o.note === 'order') return `<li class="chg">${where} reordered: <code>${esc(compact(o.old))}</code> → <code>${esc(compact(o.new))}</code></li>`;
      return `<li class="chg">${where} <code>${esc(compact(o.old))}</code> → <code>${esc(compact(o.new))}</code></li>`;
    })
    .join('')}</ul>`;
}

function fieldTable(fields) {
  if (!fields.length) return '<p class="muted">None.</p>';
  const facts = (f) =>
    [
      f.type !== undefined && `type <code>${esc(typeof f.type === 'string' ? f.type : compact(f.type))}</code>${f.itemType ? ` of <code>${esc(f.itemType)}</code>` : ''}`,
      f.ref && `ref <code>${esc(f.ref)}</code>`,
      f.pattern && `pattern <code>${esc(f.pattern)}</code>`,
      f.format && `format <code>${esc(f.format)}</code>`,
      f.enum && `enum <code>${esc(compact(f.enum, 200))}</code>`,
      f.const !== undefined && `const <code>${esc(compact(f.const))}</code>`,
    ]
      .filter(Boolean)
      .join('<br>');
  return `<div class="tablewrap"><table class="fields cards"><thead><tr><th>Field</th><th>Shape</th><th>Description</th></tr></thead><tbody>${fields
    .map(
      (f) =>
        `<tr><td data-label="Field"><code class="path${KEY_FIELDS.includes(f.label.split('.').pop()) ? ' fx' : ''}">${esc(f.label)}</code>${
          f.required ? ' <span class="badge req">required</span>' : ''
        }</td><td data-label="Shape">${facts(f) || '<span class="muted">—</span>'}</td><td data-label="Description">${esc(f.description ?? '')}</td></tr>`
    )
    .join('')}</tbody></table></div>`;
}

const badge = (r, label) =>
  r === null ? '' : `<span class="badge ${r.ok ? 'pass' : 'fail'}">${esc(label)}: ${r.ok ? 'pass' : 'fail'}</span>`;

const STYLE = `
:root{--bg:#fff;--fg:#1d2125;--muted:#667;--line:#dde1e6;--panel:#f6f8fa;--add:#e6ffec;--addb:#2da44e;--del:#ffebe9;--delb:#cf222e;--chg:#fff8c5;--fx:#ddf4ff;--fxb:#0969da;--k:#0550ae;--s:#0a3069;--n:#953800;--hit:#ffe58a}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--muted:#8b949e;--line:#30363d;--panel:#161b22;--add:#12261e;--addb:#3fb950;--del:#2d1517;--delb:#f85149;--chg:#2e2a12;--fx:#0c2d4a;--fxb:#58a6ff;--k:#79c0ff;--s:#a5d6ff;--n:#ffa657;--hit:#5a4a00}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1400px;margin:0 auto;padding:16px}
a{color:var(--fxb)}h1{font-size:1.4rem;margin:.2em 0}h2{font-size:1.15rem;margin:1.6em 0 .5em;border-bottom:1px solid var(--line);padding-bottom:.2em}h3{font-size:1rem;margin:1.2em 0 .4em}
code{font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-wrap:anywhere}
.muted{color:var(--muted)}.meta{color:var(--muted);font-size:.9em;overflow-wrap:anywhere}.meta code{color:var(--fg)}
.tablewrap{overflow-x:auto;max-width:100%}
table{border-collapse:collapse;width:100%;font-size:.95em}th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}th{background:var(--panel)}
.badge{display:inline-block;font-size:.75em;padding:1px 7px;border-radius:10px;border:1px solid var(--line);background:var(--panel);white-space:nowrap}
.badge.pass{border-color:var(--addb);color:var(--addb)}.badge.fail{border-color:var(--delb);color:var(--delb)}.badge.req{border-color:var(--n);color:var(--n)}
.cnt-add{color:var(--addb)}.cnt-del{color:var(--delb)}.cnt-chg{color:var(--n)}
details{margin:.4em 0}summary{cursor:pointer}
details.box{border:1px solid var(--line);border-radius:6px;padding:6px 10px;background:var(--panel)}details.box[open]{background:var(--bg)}
ul.ops{list-style:none;padding:0;margin:.3em 0}ul.ops li{padding:3px 8px;border-left:3px solid var(--line);margin:2px 0;overflow-wrap:anywhere}
ul.ops li.add{border-color:var(--addb);background:var(--add)}ul.ops li.del{border-color:var(--delb);background:var(--del)}ul.ops li.chg{border-color:var(--n);background:var(--chg)}
code.path{font-weight:600}.fx,code.fx{background:var(--fx);outline:1px solid var(--fxb);border-radius:3px}
.k{color:var(--k)}.s{color:var(--s)}.n{color:var(--n)}.k.fx{font-weight:700}
.codebox{border:1px solid var(--line);border-radius:6px;overflow:hidden}
pre.code{margin:0;padding:6px 0;max-height:70vh;overflow:auto;font:12.5px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;counter-reset:l}
pre.code .ln{display:block;padding:0 8px 0 3.6em;text-indent:-3.6em;white-space:pre-wrap;overflow-wrap:anywhere}
pre.code .ln::before{content:attr(data-n);display:inline-block;width:3em;margin-right:.6em;text-align:right;color:var(--muted);text-indent:0}
.ln.fxl,.c.fxl{box-shadow:inset 3px 0 var(--fxb)}.ln.fxl{background:var(--fx)}
.ln.hit{background:var(--hit)}.ln.cur{outline:2px solid var(--n)}pre.code.filter .ln:not(.hit){display:none}
.search{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px;background:var(--panel);border-bottom:1px solid var(--line);font-size:.9em}
.search input[type=search]{flex:1 1 160px;min-width:0;padding:5px 8px;font:inherit;border:1px solid var(--line);border-radius:4px;background:var(--bg);color:var(--fg)}
.search button{font:inherit;padding:3px 10px;border:1px solid var(--line);border-radius:4px;background:var(--bg);color:var(--fg)}
.sbs{border:1px solid var(--line);border-radius:6px;font:12.5px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.sbs .row{display:grid;grid-template-columns:1fr 1fr}
.sbs .c{padding:0 8px 0 4.6em;text-indent:-4.6em;white-space:pre-wrap;overflow-wrap:anywhere;min-width:0}
.sbs .c.l{border-right:1px solid var(--line)}.sbs .row.head .c{font:600 12px system-ui,sans-serif;text-indent:0;padding:4px 8px;background:var(--panel);border-bottom:1px solid var(--line)}
.sbs .no{display:inline-block;width:4em;margin-right:.6em;white-space:nowrap;text-align:right;color:var(--muted);text-indent:0;user-select:none}
.sbs .c.del{background:var(--del)}.sbs .c.add{background:var(--add)}.sbs .c.empty{background:repeating-linear-gradient(45deg,var(--panel),var(--panel) 4px,var(--bg) 4px,var(--bg) 8px)}
.sbs .c.del .no::after{content:" −";color:var(--delb)}.sbs .c.add .no::after{content:" +";color:var(--addb)}
.sbs details.fold{margin:0;border-block:1px dashed var(--line)}.sbs details.fold>summary{padding:2px 8px;color:var(--muted);font:12px system-ui,sans-serif;background:var(--panel)}
.legend span{margin-right:1em}
.ex>summary{padding:4px 0}.ex .body{padding:4px 0 8px 0}
.errors{margin:.3em 0;padding-left:1.2em;color:var(--delb);overflow-wrap:anywhere}
nav.crumbs{font-size:.9em;margin-bottom:.4em}
.filters{display:flex;gap:6px;flex-wrap:wrap;margin:.4em 0}.filters button{font:inherit;font-size:.9em;padding:3px 10px;border:1px solid var(--line);border-radius:14px;background:var(--panel);color:var(--fg)}.filters button[aria-pressed=true]{border-color:var(--fxb);color:var(--fxb)}
@media (max-width:760px){
 main{padding:12px}
 table.cards,table.cards tbody,table.cards tr,table.cards td{display:block;width:100%}table.cards thead{display:none}
 table.cards tr{border:1px solid var(--line);border-radius:6px;margin:0 0 8px;padding:4px 0}table.cards td{border:0;padding:3px 10px}
 table.cards td[data-label]::before{content:attr(data-label);display:block;font-size:.75em;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
 .sbs .row{grid-template-columns:1fr}.sbs .row.eq .c.l,.sbs .c.empty,.sbs .row.head .c.l{display:none}.sbs .c.l{border-right:0}
 .sbs .row.head .c.r .wide{display:none}.sbs .row.head .c.r::before{content:"unified: − before, + after"}
 table.cards td:empty{display:none}
}`;

const SCRIPT = `
for (const box of document.querySelectorAll('.codebox')) {
  const input = box.querySelector('input[type=search]'); if (!input) continue;
  const pre = box.querySelector('pre'); const count = box.querySelector('.count'); const only = box.querySelector('.only');
  const lines = [...pre.querySelectorAll('.ln')]; let hits = []; let cur = -1;
  const run = () => {
    const q = input.value.trim().toLowerCase(); hits = []; cur = -1;
    for (const l of lines) { const h = q !== '' && l.textContent.toLowerCase().includes(q); l.classList.toggle('hit', h); l.classList.remove('cur'); if (h) hits.push(l); }
    count.textContent = q ? hits.length + ' line' + (hits.length === 1 ? '' : 's') : '';
    pre.classList.toggle('filter', only.checked && q !== '');
  };
  const step = (d) => { if (!hits.length) return; if (cur >= 0) hits[cur].classList.remove('cur'); cur = (cur + d + hits.length) % hits.length; hits[cur].classList.add('cur'); hits[cur].scrollIntoView({ block: 'center' }); };
  input.addEventListener('input', run); only.addEventListener('change', run);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); } });
  for (const b of box.querySelectorAll('button[data-step]')) b.addEventListener('click', () => step(Number(b.dataset.step)));
}
for (const group of document.querySelectorAll('.filters')) {
  const list = document.getElementById(group.dataset.for);
  for (const b of group.querySelectorAll('button')) b.addEventListener('click', () => {
    for (const o of group.querySelectorAll('button')) o.setAttribute('aria-pressed', String(o === b));
    for (const ex of list.querySelectorAll('.ex')) ex.hidden = b.dataset.show !== 'all' && !ex.classList.contains(b.dataset.show);
  });
}`;

const page = (title, body) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<meta name="robots" content="noindex"><title>${esc(title)}</title><style>${STYLE}</style></head><body><main>${body}</main>` +
  `<script>${SCRIPT}</script></body></html>\n`;

const pageName = (c) => `${c.new.rel.replace(/\.schema\.json$/, '').replace(/[^\w.-]+/g, '_')}.html`;
const versionLabel = (c) => (c.old ? `${c.old.version} → ${c.new.version}` : `new → ${c.new.version}`);
const counts = (k) =>
  `<span class="cnt-add">+${k.added}</span> <span class="cnt-del">−${k.removed}</span> <span class="cnt-chg">~${k.changed}</span>`;
const pretty = (text) => {
  const p = parse(text, '');
  return p.value === undefined ? text : JSON.stringify(p.value, null, 2);
};

// ── Per-schema pages ─────────────────────────────────────────────────────────

const results = [];
for (const c of changes) {
  const oldText = c.old ? base.read(c.old.path) : null;
  const newText = head.read(c.new.path);
  const oldParsed = oldText === null ? null : parse(oldText, c.old.path);
  const newParsed = parse(newText, c.new.path);
  const oldSchema = oldParsed?.value ?? null;
  const newSchema = newParsed.value ?? null;
  const summary = summarizeSchemaChange(oldSchema, newSchema);
  const oldValidator = validators(oldSchema);
  const newValidator = newSchema ? validators(newSchema) : () => ({ error: newParsed.error });
  const isLibrary = c.new.kind === 'library';

  // Examples: every file of this family on the head side, plus any the base had in the old directory.
  const exFiles = examplesIn(head, c.new);
  const oldExFiles = c.old ? examplesIn(base, c.old).filter((p) => dirname(p) === c.old.dir) : [];
  const examples = exFiles.map((p) => {
    const text = head.read(p);
    const doc = parse(text, p);
    const counterpart =
      (base.has(p) && p) || oldExFiles.find((o) => basename(o) === basename(p) && dirname(p) === c.new.dir) || null;
    return { source: 'file', label: p, text, doc, counterpart, counterpartText: counterpart ? base.read(counterpart) : null };
  });
  for (const o of oldExFiles) {
    if (!head.has(o) && !examples.some((e) => e.counterpart === o)) {
      examples.push({ source: 'removed', label: o, text: base.read(o), doc: parse(base.read(o), o), counterpart: null });
    }
  }
  for (const b of blocks.filter((b) => b.entity === c.new.name)) {
    examples.push({ source: 'docs', label: `${b.file}:${b.line}`, text: b.text, doc: b.parsed, how: b.how });
  }
  for (const e of examples) {
    const file = basename(e.label);
    e.def = isLibrary && e.source !== 'docs' ? file.split('.')[0] : undefined;
    e.expectInvalid = file.endsWith('.invalid.json');
    e.newResult = e.doc.error ? { ok: false, errors: [e.doc.error] } : validateWith(newValidator(e.def), e.doc.value, e.expectInvalid);
    e.oldResult = e.doc.error || !oldSchema ? null : validateWith(oldValidator(e.def), e.doc.value, e.expectInvalid);
    e.keys = e.doc.value === undefined ? [] : keyFieldOccurrences(e.doc.value);
  }

  const passCount = examples.filter((e) => e.newResult?.ok).length;
  results.push({ c, summary, examples, passCount });

  const defsHtml = summary.definitions.length
    ? summary.definitions
        .map(
          (d) =>
            `<details class="box" open><summary><code class="path">$defs/${esc(d.name)}</code> <span class="badge">${d.status}</span></summary>` +
            (d.shape ? fieldTable([d.shape]) : '') +
            (d.added.length ? `<h4>Gains</h4>${fieldTable(d.added)}` : '') +
            (d.removed.length ? `<h4>Loses</h4>${fieldTable(d.removed)}` : '') +
            (d.changed.length
              ? `<h4>Changed fields</h4>${d.changed.map((f) => `<p><code class="path">${esc(f.label)}</code></p>${opsList(f.ops)}`).join('')}`
              : '') +
            (d.ops.length ? `<h4>Own constraints</h4>${opsList(d.ops)}` : '') +
            `</details>`
        )
        .join('')
    : '<p class="muted">No definition changes.</p>';

  const changedHtml = summary.changed.length
    ? summary.changed
        .map(
          (f) =>
            `<div><code class="path">${esc(f.label)}</code>${
              f.requiredBefore !== f.requiredAfter ? ` <span class="badge req">${f.requiredAfter ? 'now required' : 'no longer required'}</span>` : ''
            }${opsList(f.ops, { empty: '' })}</div>`
        )
        .join('')
    : '<p class="muted">None.</p>';

  const allOps = oldSchema && newSchema ? jsonDiff(oldSchema, newSchema) : [];
  const exampleHtml = examples
    .map((e, i) => {
      const cls = [e.newResult?.ok ? 'pass' : 'fail', e.keys.length ? 'haskeys' : '', e.source].join(' ');
      const errs = (r, label) =>
        r && !r.ok ? `<p><strong>${label}</strong></p><ul class="errors">${r.errors.map((x) => `<li><code>${esc(x)}</code></li>`).join('')}</ul>` : '';
      const keys = e.keys.length
        ? `<h4>Key fields (${e.keys.length})</h4><ul class="ops">${e.keys
            .map((k) => `<li><code class="path fx">${esc(formatPath(k.path))}</code> <code>${esc(compact(k.value))}</code></li>`)
            .join('')}</ul>`
        : '';
      const rejectedFor = e.expectInvalid && e.newResult?.reasons?.length
        ? `<p><strong>Rejected by ${esc(c.new.version)}, as intended</strong></p><ul class="errors">${e.newResult.reasons.map((x) => `<li><code>${esc(x)}</code></li>`).join('')}</ul>`
        : '';
      let diff = '';
      if (e.counterpart) {
        diff =
          e.counterpartText === e.text
            ? `<p class="muted">Identical to <code>${esc(e.counterpart)}</code> on the base.</p>`
            : `<details class="box"><summary>Diff against <code>${esc(e.counterpart)}</code> on the base</summary>` +
              opsList(jsonDiff(parse(e.counterpartText, '').value, e.doc.value)) +
              sideBySide(pretty(e.counterpartText), pretty(e.text)) +
              `</details>`;
      }
      const where =
        e.source === 'docs' ? ` <span class="badge">docs, ${e.how === 'marked' ? 'marked' : 'by shape'}</span>` : e.source === 'removed' ? ' <span class="badge">removed on branch</span>' : '';
      return (
        `<details class="ex ${cls}" id="ex-${i}"><summary>${badge(e.newResult, c.new.version)} ${badge(e.oldResult, c.old?.version ?? '')} ` +
        `<code>${esc(e.label)}</code>${where}${e.keys.length ? ` <span class="badge fx">${e.keys.length} key field${e.keys.length === 1 ? '' : 's'}</span>` : ''}</summary>` +
        `<div class="body">${e.def ? `<p class="meta">Validated against <code>#/$defs/${esc(e.def)}</code>${e.expectInvalid ? '; must be rejected' : ''}.</p>` : ''}${rejectedFor}${errs(e.newResult, `Errors against ${c.new.version}`)}${errs(e.oldResult, `Errors against ${c.old?.version}`)}${keys}${diff}` +
        `${codeView(e.doc.value === undefined ? e.text : JSON.stringify(e.doc.value, null, 2))}</div></details>`
      );
    })
    .join('');

  const body =
    `<nav class="crumbs"><a href="index.html">← all schema changes</a></nav>` +
    `<h1>${esc(c.new.name)} ${esc(versionLabel(c))}</h1>` +
    `<p class="meta">${esc(c.status)} · ${esc(c.new.kind)} · new <code>${esc(c.new.path)}</code>${c.old ? ` · base <code>${esc(c.old.path)}</code>` : ''}</p>` +
    (newParsed.error ? `<p class="badge fail">${esc(newParsed.error)}</p>` : '') +
    (!isLibrary && newValidator().error ? `<p><span class="badge fail">does not compile</span> <code>${esc(newValidator().error)}</code></p>` : '') +
    `<h2>Summary</h2><p>Properties ${counts(summary.counts)} · definitions changed: ${summary.definitions.length} · examples ${passCount}/${examples.length} valid against ${esc(c.new.version)}</p>` +
    `<h3>New fields</h3>${fieldTable(summary.added)}` +
    `<h3>Changed definitions</h3>${defsHtml}` +
    `<h3>Changed fields</h3>${changedHtml}` +
    `<h3>Removed fields</h3>${fieldTable(summary.removed)}` +
    `<h3>Other changes</h3>${opsList(summary.other, { empty: 'None.' })}` +
    (c.old
      ? `<h2>Every change by JSON path (${allOps.length})</h2><details class="box"${allOps.length <= 80 ? ' open' : ''}><summary>${allOps.length} operations</summary>${opsList(allOps)}</details>` +
        `<h2>Side by side</h2><p class="legend muted"><span>− before</span><span>+ after</span><span class="fx">key field</span></p>${sideBySide(oldText, newText)}`
      : '') +
    `<h2>Full source</h2>` +
    (c.old ? `<details class="box"><summary>Before: <code>${esc(c.old.path)}</code> (${esc(opts.base)})</summary>${codeView(oldText)}</details>` : '') +
    `<details class="box"><summary>After: <code>${esc(c.new.path)}</code></summary>${codeView(newText)}</details>` +
    `<h2>Examples (${passCount}/${examples.length} valid)</h2>` +
    `<p class="muted">Example files of every version directory of this schema, and JSON blocks in the docs that declare it, validated with Ajv (draft 2020-12, ajv-formats) against ${esc(
      c.new.version
    )}${c.old ? ` and ${esc(c.old.version)}` : ''}. Key fields (${KEY_FIELDS.join(', ')}) are marked.</p>` +
    (examples.length
      ? `<div class="filters" data-for="exlist"><button type="button" data-show="all" aria-pressed="true">All</button><button type="button" data-show="fail" aria-pressed="false">Failing</button><button type="button" data-show="haskeys" aria-pressed="false">With key fields</button><button type="button" data-show="docs" aria-pressed="false">From docs</button></div><div id="exlist">${exampleHtml}</div>`
      : '<p class="muted">No examples found.</p>');
  await writeOut(pageName(c), page(`${c.new.name} ${versionLabel(c)} — schema review`, body));
}

// ── Release manifest ─────────────────────────────────────────────────────────

function manifestSummary(a, b) {
  if (!a || !b) return [];
  const notes = [];
  if (a.currentRelease !== b.currentRelease) notes.push(`currentRelease ${a.currentRelease} → ${b.currentRelease}`);
  for (const r of Object.keys(b.releases ?? {})) {
    if (!(r in (a.releases ?? {}))) {
      const ents = Object.entries(b.releases[r].entities ?? {}).map(([n, v]) => `${n} ${v}`).join(', ');
      notes.push(`release ${r} added: ${ents}`);
    } else if (!deepEqual(a.releases[r], b.releases[r])) notes.push(`release ${r} edited — a published release should not change`);
  }
  for (const r of Object.keys(a.releases ?? {})) if (!(r in (b.releases ?? {}))) notes.push(`release ${r} removed`);
  for (const [name, entry] of Object.entries(b.schemas ?? {})) {
    const before = a.schemas?.[name];
    if (!before) {
      notes.push(`${name}: new schema (${entry.kind})`);
      continue;
    }
    if (before.current !== entry.current) notes.push(`${name}: current ${before.current} → ${entry.current}`);
    for (const [v, rec] of Object.entries(entry.versions ?? {})) {
      const old = before.versions?.[v];
      if (!old) notes.push(`${name} ${v}: added, ${rec.status}${rec.frozen ? ', frozen' : ', not frozen'}`);
      else {
        if (old.status !== rec.status) notes.push(`${name} ${v}: ${old.status} → ${rec.status}`);
        if (old.frozen !== rec.frozen) notes.push(`${name} ${v}: frozen ${old.frozen} → ${rec.frozen}`);
        if (old.frozen && old.sha256 !== rec.sha256) notes.push(`${name} ${v}: frozen hash changed`);
      }
    }
  }
  return notes;
}

const baseManifestText = base.read(MANIFEST) ?? '';
const headManifestText = head.read(MANIFEST) ?? '';
let manifestHtml;
if (baseManifestText === headManifestText) manifestHtml = '<p class="muted">Unchanged.</p>';
else {
  const notes = manifestSummary(baseManifest, headManifest);
  manifestHtml =
    (notes.length ? `<ul>${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '') +
    `<details class="box"><summary>Every change by JSON path</summary>${opsList(jsonDiff(baseManifest, headManifest))}</details>` +
    `<details class="box"><summary>Side by side</summary>${sideBySide(baseManifestText, headManifestText)}</details>`;
}

// ── Other specification changes ──────────────────────────────────────────────

const diffArgs = opts.head ? [baseSha, headSha] : [baseSha];
const otherChanged = git('diff', '--name-status', ...diffArgs, '--', 'specification')
  .split('\n')
  .filter(Boolean)
  .map((l) => l.split('\t'))
  .filter(([, p]) => !(p.startsWith(SCHEMAS_DIR) && p.endsWith('.schema.json')) && p !== MANIFEST);
if (!opts.head) {
  for (const p of git('ls-files', '--others', '--exclude-standard', '--', 'specification').split('\n').filter(Boolean)) {
    if (!(p.startsWith(SCHEMAS_DIR) && p.endsWith('.schema.json'))) otherChanged.push(['?', p]);
  }
}

// ── Index ────────────────────────────────────────────────────────────────────

const changeRows = results
  .map(
    ({ c, summary, examples, passCount }) =>
      `<tr><td data-label="Schema"><a href="${esc(pageName(c))}"><strong>${esc(c.new.name)}</strong></a><br><span class="meta">${esc(c.new.rel)}</span></td>` +
      `<td data-label="Version">${esc(versionLabel(c))}<br><span class="meta">${esc(c.status)}, ${esc(c.new.kind)}</span></td>` +
      `<td data-label="Properties">${counts(summary.counts)}<br><span class="meta">${summary.definitions.length} definition${summary.definitions.length === 1 ? '' : 's'}</span></td>` +
      `<td data-label="Examples">${examples.length ? `<span class="badge ${passCount === examples.length ? 'pass' : 'fail'}">${passCount}/${examples.length}</span>` : '<span class="muted">none</span>'}</td></tr>`
  )
  .join('');

const indexBody =
  `<h1>Schema review</h1>` +
  `<p class="meta">Repository <code>${esc(repo)}</code><br>Reviewing <code>${esc(head.label)}</code> on <code>${esc(branch)}</code> @ <code>${esc(
    headSha.slice(0, 10)
  )}</code><br>Against <code>${esc(opts.base)}</code> @ <code>${esc(baseSha.slice(0, 10))}</code><br>Generated ${esc(new Date().toISOString())}</p>` +
  `<h2>Changed schemas (${changes.length})</h2>` +
  (changes.length
    ? `<p class="meta">Properties: <span class="cnt-add">+added</span> <span class="cnt-del">−removed</span> <span class="cnt-chg">~changed</span>. Examples: valid against the new version / total.</p>` +
      `<div class="tablewrap"><table class="cards"><thead><tr><th>Schema</th><th>Version</th><th>Properties</th><th>Examples</th></tr></thead><tbody>${changeRows}</tbody></table></div>`
    : `<p>No published schema differs from <code>${esc(opts.base)}</code>.</p>`) +
  (removedSchemas.length
    ? `<h2>Removed schemas (${removedSchemas.length})</h2><ul>${removedSchemas.map((s) => `<li><code>${esc(s.path)}</code> (${esc(s.name)} ${esc(s.version)})</li>`).join('')}</ul>`
    : '') +
  `<h2>Release manifest</h2><p class="meta"><code>${MANIFEST}</code></p>${manifestHtml}` +
  `<h2>Other specification changes (${otherChanged.length})</h2>` +
  (otherChanged.length
    ? `<details class="box"><summary>${otherChanged.length} file${otherChanged.length === 1 ? '' : 's'} under specification/</summary><ul>${otherChanged
        .map(([s, p, q]) => `<li><code>${esc(s)}</code> <code>${esc(p)}</code>${q ? ` → <code>${esc(q)}</code>` : ''}</li>`)
        .join('')}</ul></details>`
    : '<p class="muted">None.</p>') +
  `<h2>Unchanged schemas (${unchanged.length})</h2><details class="box"><summary>${unchanged.length} schemas identical to the base</summary><ul>${unchanged
    .map((s) => `<li>${esc(s.name)} ${esc(s.version)} <span class="meta">${esc(s.kind)} · <code>${esc(s.rel)}</code></span></li>`)
    .join('')}</ul></details>`;

await writeOut('index.html', page('Schema review', indexBody));
console.log(
  `schema-review: ${changes.length} changed, ${removedSchemas.length} removed, ${unchanged.length} unchanged; ` +
    `manifest ${baseManifestText === headManifestText ? 'unchanged' : 'changed'} → ${join(outDir(), 'index.html')}`
);

// ── Output ───────────────────────────────────────────────────────────────────

function outDir() {
  return resolve(opts.out.replace(/^~(?=\/)/, process.env.HOME));
}

/**
 * Writes one page. The first write empties the output directory, but only one
 * this script made (it carries a marker file) or an empty one.
 */
async function writeOut(name, html) {
  const dir = outDir();
  if (!prepared) {
    if (existsSync(dir)) {
      const entries = await readdir(dir);
      if (entries.length && !entries.includes(MARKER)) {
        console.error(`schema-review: ${dir} exists and was not written by this script; choose another --out`);
        process.exit(1);
      }
      for (const e of entries) await rm(join(dir, e), { recursive: true, force: true });
    }
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, MARKER), 'Written by scripts/schema-review.mjs; emptied on every run.\n');
    prepared = true;
  }
  await writeFile(join(dir, name), html);
}

// ── self-test ────────────────────────────────────────────────────────────────

/**
 * Proves the summary reports a schema change the way the review page states it:
 * a field gained by a nested object and by a reference definition, a field
 * removed, a field whose own constraint changed, a `required` gain, and the
 * line diff reproducing both texts.
 */
function selfTest() {
  const oldSchema = {
    $id: 'https://example.test/v1.0.0/thing.schema.json',
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      legacy: { type: 'boolean' },
      canonical: { type: 'object', required: ['slug'], properties: { slug: { type: 'string' } } },
      muscles: { type: 'array', items: { $ref: '#/$defs/muscleRef' } },
    },
    $defs: {
      muscleRef: { type: 'object', properties: { id: { type: 'string' } } },
      unchanged: { type: 'string' },
    },
  };
  const newSchema = {
    $id: 'https://example.test/v1.1.0/thing.schema.json',
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', maxLength: 80 },
      canonical: {
        type: 'object',
        required: ['slug', 'fxi'],
        properties: {
          slug: { type: 'string' },
          fxi: { type: 'string', pattern: '^FXI-[A-Z0-9]+$', description: 'Structural exercise key.' },
        },
      },
      muscles: { type: 'array', items: { $ref: '#/$defs/muscleRef' } },
    },
    $defs: {
      muscleRef: { type: 'object', properties: { id: { type: 'string' }, fxm: { $ref: '#/$defs/fxm' } } },
      fxm: { type: 'string', pattern: '^FXM=', description: 'Muscle key.' },
      unchanged: { type: 'string' },
    },
  };

  const s = summarizeSchemaChange(oldSchema, newSchema);
  const failures = [];
  const expect = (what, actual, wanted) => {
    if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
      failures.push(`${what}: expected ${JSON.stringify(wanted)}, got ${JSON.stringify(actual)}`);
    }
  };

  expect('added fields', s.added.map((f) => f.label), ['canonical.fxi', '$defs/muscleRef.fxm']);
  expect('new field shape', [s.added[0].type, s.added[0].pattern, s.added[0].required, s.added[0].description], [
    'string', '^FXI-[A-Z0-9]+$', true, 'Structural exercise key.',
  ]);
  expect('removed fields', s.removed.map((f) => f.label), ['legacy']);
  expect('changed fields', s.changed.map((f) => f.label), ['name', 'canonical']);
  expect('a constraint change', s.changed[0].ops.map((o) => [o.op, formatPath(o.path), o.new]), [['add', 'maxLength', 80]]);
  expect('a required gain', s.changed[1].ops.map((o) => [o.op, formatPath(o.path), o.new, o.item]), [['add', 'required', 'fxi', true]]);
  expect('a definition gaining a field', s.definitions.map((d) => [d.name, d.status, d.added.map((f) => f.label)]), [
    ['muscleRef', 'changed', ['$defs/muscleRef.fxm']],
    ['fxm', 'added', []],
  ]);
  expect('a referenced field reads through its $ref', [s.added[1].ref, s.added[1].type, s.added[1].pattern, s.added[1].description], [
    '#/$defs/fxm', 'string', '^FXM=', 'Muscle key.',
  ]);
  expect('an added definition states its shape', [s.definitions[1].shape.type, s.definitions[1].shape.pattern], ['string', '^FXM=']);
  expect('root-level changes', s.other.map((o) => formatPath(o.path)), ['$id']);
  expect('counts', s.counts, { added: 2, removed: 1, changed: 2 });
  expect('no change', summarizeSchemaChange(newSchema, newSchema).counts, { added: 0, removed: 0, changed: 0 });

  expect(
    'array alignment',
    jsonDiff([{ a: 1 }, { b: 2 }], [{ z: 0 }, { a: 1 }, { b: 2 }]).map((o) => [o.op, formatPath(o.path)]),
    [['add', '[0]']]
  );
  expect('primitive arrays as sets', jsonDiff(['a', 'b'], ['b', 'a']).map((o) => o.note), ['order']);

  // Line diff: replaying the ops must rebuild both texts.
  const texts = [
    ['a\nb\nc\nd', 'a\nx\nc\nd\ne'],
    ['', 'one'],
    ['same\nsame', 'same\nsame'],
    [JSON.stringify(oldSchema, null, 2), JSON.stringify(newSchema, null, 2)],
  ];
  for (const [x, y] of texts) {
    const ops = diffLines(x, y);
    const xs = x.split('\n');
    const ys = y.split('\n');
    const left = ops.filter((o) => o.type !== 'add').map((o) => xs[o.a]).join('\n');
    const right = ops.filter((o) => o.type !== 'del').map((o) => ys[o.b]).join('\n');
    if (left !== x || right !== y) failures.push(`diffLines does not reproduce ${JSON.stringify([x, y]).slice(0, 60)}`);
    const changedLines = ops.filter((o) => o.type !== 'eq').length;
    if (x === y && changedLines) failures.push('diffLines reports changes between equal texts');
  }
  expect('minimal line diff', diffLines('a\nb\nc\nd', 'a\nx\nc\nd\ne').filter((o) => o.type !== 'eq').length, 3);

  expect('key occurrences', keyFieldOccurrences({ canonical: { fxi: 'X' }, muscles: [{ fxm: 'M' }] }).map((k) => formatPath(k.path)), [
    'canonical.fxi',
    'muscles[0].fxm',
  ]);

  if (failures.length) {
    console.error(`self-test — ${failures.length} failure(s):\n  ${failures.join('\n  ')}`);
    return 1;
  }
  console.log('self-test — the summary reports added, removed and changed fields and definitions as recorded');
  return 0;
}
