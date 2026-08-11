#!/usr/bin/env node
/**
 * Every FDS document a reader can see must validate against the schema it claims.
 *
 * Nine checks were green while the site's headline "this is FDS" example was
 * invalid. The landing page exported an exercise with no `metrics`, no
 * `classification.force` and no `categoryId` on any muscle reference — five
 * errors in the one document most readers would ever copy. Every gate read
 * schemas, sources, RFCs or fixtures. Nothing read the JSON on the page.
 *
 * A reader does not distinguish "example under specification/schemas/" from
 * "example in the RFC" from "example on the landing page". They copy whichever
 * one they reach first. So the ones nobody was checking are exactly the
 * dangerous ones, and this check reads all of them:
 *
 *   - fenced ```json blocks in website/docs/**, website/blog/**,
 *     specification/** and the root markdown
 *   - JSON-bearing literals in website/src/**
 *
 * The blog carries no JSON today. It is read anyway, because "a post nobody
 * thought of as documentation" is precisely how the last one got through.
 *
 * ── How a block is classified ────────────────────────────────────────────────
 *
 * A block with a top-level `schemaVersion` claims to be a document, because
 * that is how FDS says a document identifies itself. Its entity is resolved
 * from shape: every entity schema closes `additionalProperties` at the root, so
 * the set of top-level names each one permits is known, and a document whose
 * keys fit exactly one of them has named itself. Where more than one fits —
 * `{schemaVersion, id, canonical, metadata}` is a legal shape for equipment,
 * muscle and muscle-category alike — the block must say which, and the check
 * fails until it does. Guessing there is how the wrong schema gets applied and
 * a document passes for the wrong reason.
 *
 * The version comes from the document, resolved through specification/
 * releases.json. Nothing here keeps its own entity → path map; the manifest is
 * generated from the published tree and is the only thing that knows.
 *
 * Everything else needs a marker, in the fence, where a reviewer sees it:
 *
 *   ```json fds:fragment entity=exercise
 *   ```json fds:fragment entity=prescription def=loadTarget
 *   ```json fds:fragment entity=prescription defs=load:loadTarget,reps:repTarget
 *   ```json fds:document entity=muscle
 *   ```json fds:ignore <reason, to end of line>
 *
 * `fds:fragment` is the opt-out documentation actually needs: a page showing
 * the `classification` block alone is not showing an invalid document, it is
 * showing part of one. It still has to name the entity, and where the fragment
 * is a set of whole top-level properties those properties are validated against
 * that entity's subschemas — a fragment is not an excuse, only a narrower
 * question. `fds:ignore` is the real escape hatch, for JSON that is not FDS at
 * all, and both are counted against EXPECTED below so neither can grow without
 * someone editing this file in the same diff.
 *
 * Prescription is a `$defs` library whose root validates nothing, so
 * `entity=prescription` without `def=` is an error rather than a pass — the
 * same rule check-prescription.mjs applies to its fixtures.
 *
 * ── Recognising JSON inside TypeScript, and where that can be fooled ─────────
 *
 * There is no TypeScript parser here and no dependency that would supply one,
 * so the recogniser is deliberately narrow: it reads the initializer of a
 * top-level `const`, whether that is an object literal, an array, or a string
 * or template holding JSON, and parses it with a small literal parser that
 * accepts JSON plus the things TypeScript source actually uses — unquoted keys,
 * single quotes, trailing commas, comments. Anything else (an identifier, a
 * call, a spread, a `${}` interpolation) is a parse error, not a skip.
 *
 * Narrow would normally mean "silently misses things", so it is paired with a
 * second, exhaustive pass: every occurrence of the token `schemaVersion` in the
 * file must fall inside something the first pass extracted, or the check fails
 * naming the line. A document the recogniser cannot read is therefore loud, not
 * absent. That is the whole reason the recogniser is allowed to be simple.
 *
 * It can still be fooled, and by exactly one thing: a document that does not
 * contain the token `schemaVersion` — built by spreading a constant, assembled
 * from a variable, or written without the field at all. Such a document is
 * invisible here. It is also invalid under every published entity schema, which
 * requires `schemaVersion`, so the blind spot is narrower than it sounds, but
 * it is real: this check cannot tell you that a page renders an object that
 * never claimed to be FDS in the first place.
 *
 * Two smaller limits worth knowing. The `schemaVersion` sweep is textual, so
 * the word appearing in prose or a comment needs `// fds:ignore` to acknowledge
 * it. And a document nested inside a non-const expression — a prop, a return
 * value — fails the sweep rather than being validated; the fix is to lift it to
 * a `const`, which is where a reader would want it anyway.
 *
 *   node scripts/check-doc-examples.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * How many blocks are allowed to opt out, exactly.
 *
 * A count printed in a log still grows quietly; a count asserted here cannot,
 * because raising it is an edit to this file in the same diff that added the
 * marker. `fragments` is documentation showing part of a document, which is
 * legitimate and common. `ignored` is JSON that is not FDS, or is deliberately
 * not valid — every one of those is a decision someone made on purpose.
 */
const EXPECTED = { fragments: 113, ignored: 27 };

/**
 * `--self-test` runs the whole check over scripts/fixtures/doc-examples/ and
 * requires it to fail in exactly the recorded way.
 *
 * A gate that has only ever passed has not been tested. The fixtures are the
 * failures this check exists for — chief among them the landing-page exercise
 * that actually shipped, recovered from the commit that deleted it. Keeping it
 * as a fixture means the regression that motivated the gate stays demonstrated
 * rather than remembered.
 */
const SELF_TEST = process.argv.includes('--self-test');
const FIXTURES = 'scripts/fixtures/doc-examples';

/** Where a reader finds JSON. */
const MARKDOWN_ROOTS = SELF_TEST ? [FIXTURES] : ['website/docs', 'website/blog', 'specification'];
const ROOT_MARKDOWN = SELF_TEST ? [] : ['README.md', 'SCHEMAS.md'];
const SOURCE_ROOT = SELF_TEST ? FIXTURES : 'website/src';
const SOURCE_EXTENSIONS = /\.(?:[cm]?[jt]sx?)$/;
const SKIP_DIRS = new Set(['node_modules', '.git', 'build', '.docusaurus', 'dist']);

let Ajv;
let addFormats;
try {
  Ajv = (await import('ajv/dist/2020.js')).default;
  addFormats = (await import('ajv-formats')).default;
} catch {
  console.error(
    'ajv is not installed. Run `npm install --no-save ajv@8 ajv-formats@3`\n' +
      '(the schemas CI job installs it before this step).'
  );
  process.exit(1);
}

const manifest = JSON.parse(await readFile(join(ROOT, 'specification/releases.json'), 'utf8'));
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

const problems = [];
const loaded = new Map(); // "entity@version" -> parsed schema
const validators = new Map(); // cache key -> compiled validator

/** Names the manifest publishes, by kind. */
const kindsOf = (kind) =>
  Object.entries(manifest.schemas)
    .filter(([, entry]) => entry.kind === kind)
    .map(([name]) => name);

const ENTITIES = kindsOf('entity');
const LIBRARIES = kindsOf('library');

/**
 * A published schema, by name and version.
 *
 * Published entity schemas are self-contained on purpose: an implementer can
 * validate one entity without fetching the others, which is what makes the
 * frozen URLs usable on their own. A `$ref` that leaves the document would
 * break that silently — Ajv would simply fail to resolve it — so it is checked
 * here rather than assumed.
 */
async function schemaFor(name, version) {
  const key = `${name}@${version}`;
  if (loaded.has(key)) return loaded.get(key);

  const info = manifest.schemas[name]?.versions?.[version];
  if (!info?.path) return null;

  const schema = JSON.parse(await readFile(join(ROOT, 'specification/schemas', info.path), 'utf8'));
  const external = [];
  walk(schema, (node) => {
    if (typeof node.$ref === 'string' && !node.$ref.startsWith('#')) external.push(node.$ref);
  });
  if (external.length) {
    problems.push(
      `${info.path} carries ${external.length} cross-schema $ref(s): ${[...new Set(external)].join(', ')}\n` +
        '    Published entity schemas are self-contained; a reference that leaves the ' +
        'document cannot be resolved by an implementer validating one entity alone.'
    );
  }
  loaded.set(key, schema);
  return schema;
}

/**
 * A validator for a whole schema, or for one location inside it.
 *
 * Validating against a location is the same device check-prescription.mjs uses:
 * the library root deliberately accepts nothing, so a fragment is checked
 * against the definition it exemplifies instead. Here it also serves fragments
 * of entities — `#/properties/classification` asks whether the classification
 * block is right without asking the block to be a whole exercise.
 *
 * The reference is absolute, through the schema's own `$id`, and the schema is
 * registered once rather than being spread into a wrapper. Spreading it would
 * leave the root's own `type`, `required` and `additionalProperties` in force
 * alongside the `$ref` — draft 2020-12 applies both — and every fragment would
 * be told it is not a whole document, which is the one thing it never claimed.
 */
async function validatorFor(name, version, pointer = null) {
  const key = `${name}@${version}${pointer ?? ''}`;
  if (validators.has(key)) return validators.get(key);

  const schema = await schemaFor(name, version);
  if (!schema) return null;

  if (!ajv.getSchema(schema.$id)) ajv.addSchema(schema);
  const compiled = pointer
    ? ajv.compile({ $id: `urn:fds:${name}:${version}:${pointer}`, $ref: `${schema.$id}#${pointer}` })
    : ajv.getSchema(schema.$id);
  validators.set(key, compiled);
  return compiled;
}

export const walk = (node, visit) => {
  if (Array.isArray(node)) return node.forEach((v) => walk(v, visit));
  if (!node || typeof node !== 'object') return;
  visit(node);
  Object.values(node).forEach((v) => walk(v, visit));
};

/**
 * Top-level property names each schema permits, at its current version.
 *
 * Every entity closes `additionalProperties` at the root, so this set is the
 * whole of what a document of that kind may say at the top level — which is
 * what makes resolution by shape possible at all. The library is excluded: its
 * root permits nothing, on purpose.
 */
const rootNames = new Map();
for (const [name, entry] of Object.entries(manifest.schemas)) {
  if (entry.kind === 'library') continue;
  const schema = await schemaFor(name, entry.current);
  if (schema) rootNames.set(name, new Set(Object.keys(schema.properties ?? {})));
}

// ── reading the sources ───────────────────────────────────────────────────────

async function* walkFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkFiles(path);
    else yield path;
  }
}

/**
 * Fenced ```json blocks, with whatever follows `json` on the fence line.
 *
 * Scanned line by line rather than by regex so that a fence opened with four
 * backticks — which documentation uses to show a three-backtick fence — closes
 * on its own run length and does not end early on the example inside it.
 */
function jsonFences(source) {
  const lines = source.split('\n');
  const blocks = [];
  let open = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (open) {
      const close = line.match(/^\s*(`{3,})\s*$/);
      if (close && close[1].length >= open.ticks) {
        if (open.json) blocks.push({ line: open.line, meta: open.meta, text: open.body.join('\n') });
        open = null;
      } else if (open.json) {
        open.body.push(line);
      }
      continue;
    }
    const fence = line.match(/^\s*(`{3,})\s*([A-Za-z0-9_-]*)\s*(.*)$/);
    if (!fence) continue;
    open = {
      ticks: fence[1].length,
      json: fence[2].toLowerCase() === 'json',
      meta: fence[3].trim(),
      line: i + 1,
      body: [],
    };
  }
  if (open?.json) {
    problems.push('a ```json fence is never closed — the rest of the file reads as code');
  }
  return blocks;
}

// ── the literal parser ────────────────────────────────────────────────────────

/**
 * JSON, plus what TypeScript source actually writes: unquoted keys, single
 * quotes, backticks without interpolation, trailing commas, comments.
 *
 * Written out rather than evaluated. `eval` and `vm` would accept far more than
 * data — a call, a reference, a getter — and quietly produce a value that no
 * reader of the source would predict. Everything this does not understand
 * throws, which is what lets the caller treat a parse failure as a finding
 * instead of a reason to skip the block.
 */
function parseLiteral(text) {
  let i = 0;

  const fail = (message) => {
    const upto = text.slice(0, i);
    const line = upto.split('\n').length;
    throw new Error(`${message} at literal line ${line}`);
  };

  const skip = () => {
    for (;;) {
      while (i < text.length && /\s/.test(text[i])) i += 1;
      if (text.startsWith('//', i)) {
        while (i < text.length && text[i] !== '\n') i += 1;
      } else if (text.startsWith('/*', i)) {
        const end = text.indexOf('*/', i + 2);
        if (end === -1) fail('unterminated block comment');
        i = end + 2;
      } else {
        return;
      }
    }
  };

  const string = (quote) => {
    i += 1;
    let out = '';
    while (i < text.length) {
      const ch = text[i];
      if (ch === '\\') {
        const next = text[i + 1];
        const simple = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', '0': '\0' };
        if (next === 'u') {
          out += String.fromCharCode(parseInt(text.slice(i + 2, i + 6), 16));
          i += 6;
        } else if (next === 'x') {
          out += String.fromCharCode(parseInt(text.slice(i + 2, i + 4), 16));
          i += 4;
        } else if (next === '\n') {
          i += 2;
        } else {
          out += simple[next] ?? next;
          i += 2;
        }
        continue;
      }
      if (ch === quote) {
        i += 1;
        return out;
      }
      if (quote === '`' && ch === '$' && text[i + 1] === '{') {
        fail('template interpolation — this is not data');
      }
      if (quote !== '`' && ch === '\n') fail('unterminated string');
      out += ch;
      i += 1;
    }
    return fail('unterminated string');
  };

  const value = () => {
    skip();
    const ch = text[i];
    if (ch === undefined) return fail('unexpected end of literal');
    if (ch === '{') {
      i += 1;
      const out = {};
      skip();
      if (text[i] === '}') {
        i += 1;
        return out;
      }
      for (;;) {
        skip();
        let key;
        if (text[i] === '"' || text[i] === "'" || text[i] === '`') key = string(text[i]);
        else {
          const name = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(text.slice(i));
          if (!name) fail(`expected a property name, found ${JSON.stringify(text.slice(i, i + 12))}`);
          key = name[0];
          i += key.length;
        }
        skip();
        if (text[i] !== ':') fail(`expected ":" after "${key}"`);
        i += 1;
        out[key] = value();
        skip();
        if (text[i] === ',') {
          i += 1;
          skip();
          if (text[i] === '}') {
            i += 1;
            return out;
          }
          continue;
        }
        if (text[i] === '}') {
          i += 1;
          return out;
        }
        fail('expected "," or "}"');
      }
    }
    if (ch === '[') {
      i += 1;
      const out = [];
      skip();
      if (text[i] === ']') {
        i += 1;
        return out;
      }
      for (;;) {
        out.push(value());
        skip();
        if (text[i] === ',') {
          i += 1;
          skip();
          if (text[i] === ']') {
            i += 1;
            return out;
          }
          continue;
        }
        if (text[i] === ']') {
          i += 1;
          return out;
        }
        fail('expected "," or "]"');
      }
    }
    if (ch === '"' || ch === "'" || ch === '`') return string(ch);
    if (text.startsWith('true', i)) {
      i += 4;
      return true;
    }
    if (text.startsWith('false', i)) {
      i += 5;
      return false;
    }
    if (text.startsWith('null', i)) {
      i += 4;
      return null;
    }
    const number = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(i));
    if (number) {
      i += number[0].length;
      return Number(number[0]);
    }
    return fail(`expected data, found ${JSON.stringify(text.slice(i, i + 16))}`);
  };

  const result = value();
  skip();
  if (i < text.length) fail(`trailing content ${JSON.stringify(text.slice(i, i + 16))}`);
  return result;
}

/**
 * The text of a balanced literal starting at `start`, or null if it never
 * closes. Aware of the four things that legally contain a brace: the three
 * kinds of string and a comment.
 */
function balancedFrom(source, start) {
  const openers = { '{': '}', '[': ']' };
  const stack = [openers[source[start]]];
  if (!stack[0]) return null;

  for (let i = start + 1; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '/' && source[i + 1] === '/') {
      i = source.indexOf('\n', i);
      if (i === -1) return null;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) return null;
      i = end + 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      i += 1;
      while (i < source.length && source[i] !== ch) i += source[i] === '\\' ? 2 : 1;
      if (i >= source.length) return null;
      continue;
    }
    if (openers[ch]) {
      stack.push(openers[ch]);
      continue;
    }
    if (ch === '}' || ch === ']') {
      if (stack.pop() !== ch) return null;
      if (!stack.length) return source.slice(start, i + 1);
    }
  }
  return null;
}

/** The text of a string or template literal starting at `start`. */
function stringFrom(source, start) {
  const quote = source[start];
  for (let i = start + 1; i < source.length; i += 1) {
    if (source[i] === '\\') {
      i += 1;
      continue;
    }
    if (source[i] === quote) return source.slice(start, i + 1);
  }
  return null;
}

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/**
 * A parse failure, said the same way on every Node version.
 *
 * V8 appends `(line N column M)` to `JSON.parse` messages from Node 21 onward
 * and omits it before that. The recorded self-test transcript compares messages
 * byte for byte, so an unnormalised message makes this check pass on a
 * developer's Node and fail on CI's — which is exactly what it did.
 *
 * The byte offset is already in the message and is the part that locates the
 * error; the line and column are a restatement of it.
 */
const parseMessage = (error) =>
  String(error?.message ?? error).replace(/ \(line \d+ column \d+\)$/, '');

/**
 * Documents in a TypeScript source file, plus the regions they came from.
 *
 * Only `const` initializers are read. The exhaustive `schemaVersion` sweep in
 * the caller is what makes that safe: anything this misses is reported rather
 * than skipped.
 */
function sourceDocuments(source, rel) {
  const found = [];
  const covered = [];
  const DECL = /(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+[A-Za-z0-9_$]+\s*(?::[^=;]+)?=\s*/g;

  for (const match of source.matchAll(DECL)) {
    const start = match.index + match[0].length;
    const ch = source[start];
    let text = null;
    let isString = false;

    if (ch === '{' || ch === '[') text = balancedFrom(source, start);
    else if (ch === '"' || ch === "'" || ch === '`') {
      text = stringFrom(source, start);
      isString = true;
    }
    if (text === null) continue;
    if (!text.includes('schemaVersion')) continue;

    covered.push([start, start + text.length]);
    const line = lineOf(source, start);

    let parsed;
    try {
      parsed = isString ? JSON.parse(parseLiteral(text)) : parseLiteral(text);
    } catch (error) {
      problems.push(
        `${rel}:${line} — a literal naming schemaVersion could not be read as data: ${parseMessage(error)}\n` +
          '    An FDS document in source must be plain data, or nothing can check it.'
      );
      continue;
    }

    // One initializer may hold several documents — an array of them, or an
    // object with a document under a key. Every object that declares its own
    // schemaVersion is one.
    walk(parsed, (node) => {
      if (typeof node.schemaVersion === 'string') found.push({ line, doc: node });
    });
  }

  return { found, covered };
}

// ── markers ───────────────────────────────────────────────────────────────────

/**
 * `fds:` marker on a fence line or source comment.
 *
 * `fds:ignore` takes the rest of the line as its reason, so it comes last. The
 * other two take `key=value` pairs.
 */
function parseMarker(meta) {
  const at = meta.search(/\bfds:/);
  if (at === -1) return null;
  const rest = meta.slice(at + 4);
  const kind = rest.match(/^[a-z-]+/)?.[0];
  if (!kind) return { kind: 'invalid', message: 'fds: with no directive' };

  if (kind === 'ignore') {
    const reason = rest.slice(kind.length).trim();
    if (!reason) return { kind: 'invalid', message: 'fds:ignore needs a reason' };
    return { kind, reason };
  }
  if (kind !== 'fragment' && kind !== 'document') {
    return { kind: 'invalid', message: `unknown directive fds:${kind}` };
  }
  const marker = { kind, partial: /\bpartial\b/.test(rest) };
  for (const pair of rest.slice(kind.length).matchAll(/([a-z]+)=([A-Za-z0-9_.,:-]+)/g)) {
    marker[pair[1]] = pair[2];
  }
  if (!marker.entity) return { kind: 'invalid', message: `fds:${kind} needs entity=<name>` };
  return marker;
}

// ── classification and validation ────────────────────────────────────────────

const counts = {
  documents: 0,
  fragments: 0,
  deepFragments: 0,
  partialFragments: 0,
  ignored: 0,
  mappings: 0,
};
const fragmentsBy = new Map();

/**
 * Ajv says "must NOT have additional properties" without saying which one, and
 * an error a reader cannot act on is barely an error. The offending name lives
 * in `params`, so it is printed.
 */
const errorLines = (errors) =>
  errors
    .slice(0, 12)
    .map((e) => {
      const detail =
        e.params?.additionalProperty ??
        e.params?.allowedValues?.join(' | ') ??
        e.params?.allowedValue ??
        '';
      return `    ${e.instancePath || '/'} ${e.message}${detail ? ` — ${detail}` : ''}`;
    })
    .join('\n');

/** Entities whose root would accept every top-level name this document uses. */
function candidateEntities(doc) {
  const keys = Object.keys(doc);
  return ENTITIES.filter((name) => keys.every((key) => rootNames.get(name).has(key)));
}

async function validateDocument(where, doc, forced) {
  counts.documents += 1;
  const keys = Object.keys(doc);

  let entity = forced;
  if (!entity) {
    const candidates = candidateEntities(doc);
    if (candidates.length === 0) {
      problems.push(
        `${where} — no published entity allows these top-level names: ${keys.join(', ')}\n` +
          '    Either a field the standard does not have, or a fragment that needs ' +
          '`fds:fragment entity=<name>`.'
      );
      return;
    }
    if (candidates.length > 1) {
      problems.push(
        `${where} — shape fits ${candidates.join(', ')}; the document does not say which.\n` +
          `    Add \`fds:document entity=<name>\` to the fence. Guessing here is how a ` +
          'document comes to pass against the wrong schema.'
      );
      return;
    }
    [entity] = candidates;
  }

  if (!manifest.schemas[entity]) {
    problems.push(`${where} — entity "${entity}" is not in specification/releases.json.`);
    return;
  }
  if (manifest.schemas[entity].kind !== 'entity') {
    problems.push(
      `${where} — "${entity}" is a ${manifest.schemas[entity].kind}, not an entity; it has no document form.`
    );
    return;
  }

  const declared = doc.schemaVersion;
  const info = manifest.schemas[entity].versions[declared];
  let version = declared;

  if (!info || !info.path) {
    const published = Object.entries(manifest.schemas[entity].versions)
      .filter(([, v]) => v.path)
      .map(([v]) => v);
    problems.push(
      `${where} — declares ${entity} schemaVersion ${declared}, which is ${
        info ? `${info.status} and no longer served` : 'not published'
      }.\n` +
        `    Published: ${published.join(', ')}. A reader validating this against the URL ` +
        'it names gets nothing.\n' +
        `    Validated against the current ${manifest.schemas[entity].current} instead, so the ` +
        'rest of the errors are still visible.'
    );
    version = manifest.schemas[entity].current;
  }

  const validate = await validatorFor(entity, version);
  if (!validate) {
    problems.push(`${where} — no published ${entity} schema at ${version}.`);
    return;
  }
  if (!validate(doc)) {
    problems.push(
      `${where} — does not validate against ${entity} ${version} (${validate.errors.length} error(s)):\n` +
        errorLines(validate.errors)
    );
  }
}

async function validateFragment(where, doc, marker) {
  counts.fragments += 1;
  fragmentsBy.set(marker.entity, (fragmentsBy.get(marker.entity) ?? 0) + 1);

  const entry = manifest.schemas[marker.entity];
  if (!entry) {
    problems.push(
      `${where} — fds:fragment names entity "${marker.entity}", which specification/releases.json does not publish.\n` +
        `    Published: ${Object.keys(manifest.schemas).join(', ')}`
    );
    return;
  }

  if (entry.kind === 'library') {
    // `def=` checks the whole snippet against one definition. `defs=` maps each
    // property to the definition it holds, which is what a worked example of a
    // *set* of primitives looks like — the load, the reps and the rest of one
    // prescription written together, as a reader would meet them.
    const pairs = marker.defs
      ? marker.defs.split(',').map((pair) => pair.split(':'))
      : marker.def
        ? [[null, marker.def]]
        : null;
    if (!pairs) {
      problems.push(
        `${where} — ${marker.entity} is a $defs library whose root validates nothing.\n` +
          '    Name the definition the snippet exemplifies: `fds:fragment entity=' +
          `${marker.entity} def=<name>\`, or \`defs=<property>:<name>,…\` for a snippet ` +
          'that combines several.'
      );
      return;
    }

    const schema = await schemaFor(marker.entity, entry.current);
    for (const [property, def] of pairs) {
      if (!def || !schema?.$defs?.[def]) {
        problems.push(
          `${where} — #/$defs/${def} is not in ${marker.entity} ${entry.current}.\n` +
            `    Available: ${Object.keys(schema?.$defs ?? {}).join(', ')}`
        );
        continue;
      }
      const subject = property === null ? doc : doc?.[property];
      if (property !== null && subject === undefined) {
        problems.push(`${where} — defs= names property "${property}", which the snippet does not have.`);
        continue;
      }
      const validate = await validatorFor(marker.entity, entry.current, `/$defs/${def}`);
      if (!validate(subject)) {
        problems.push(
          `${where} — ${property === null ? 'the snippet' : `"${property}"`} does not satisfy ` +
            `#/$defs/${def} (${validate.errors.length} error(s)):\n${errorLines(validate.errors)}`
        );
      }
    }
    if (marker.defs) {
      const named = new Set(pairs.map(([property]) => property));
      const unnamed = Object.keys(doc ?? {}).filter((key) => !named.has(key));
      if (unnamed.length) {
        problems.push(
          `${where} — defs= does not say which definition ${unnamed.join(', ')} exemplifies.\n` +
            '    Every property of a library snippet names a definition, or the ones left ' +
            'out ship unchecked.'
        );
      }
    }
    return;
  }

  if (marker.def || marker.defs) {
    problems.push(`${where} — def= only applies to a definition library, not to ${marker.entity}.`);
    return;
  }

  // A fragment made of whole top-level properties is still checkable: each one
  // is validated against the subschema that owns it, with the document's own
  // `required` set aside. A fragment that reaches deeper than that — the inside
  // of `metadata`, a bare array — has no such anchor and is only counted.
  //
  // `partial` says the properties are themselves incomplete, which the "optional
  // fields" sections of the RFCs genuinely are: they show what `canonical` may
  // carry beyond its required `name` and `slug`, and demanding those back would
  // be demanding the section stop being about optional fields. It buys nothing
  // but the count, so it is spelled out rather than inferred.
  const keys = Object.keys(doc ?? {});
  const names = rootNames.get(marker.entity);
  if (marker.partial) {
    counts.partialFragments += 1;
    return;
  }
  if (!names || !keys.length || !keys.every((key) => names.has(key))) {
    counts.deepFragments += 1;
    return;
  }

  for (const key of keys) {
    const validate = await validatorFor(marker.entity, entry.current, `/properties/${key}`);
    if (validate && !validate(doc[key])) {
      problems.push(
        `${where} — fragment property "${key}" does not validate against ${marker.entity} ` +
          `${entry.current} (${validate.errors.length} error(s)):\n` +
          errorLines(validate.errors)
      );
    }
  }
}

/** A complete transformer mapping configuration, recognised by its own required set. */
function looksLikeMapping(doc) {
  const entry = manifest.schemas.mapping;
  if (!entry || !doc || typeof doc !== 'object' || Array.isArray(doc)) return false;
  const schema = loaded.get(`mapping@${entry.current}`);
  if (!schema) return false;
  const keys = Object.keys(doc);
  return (
    schema.required.every((name) => keys.includes(name)) &&
    keys.every((name) => name in schema.properties)
  );
}

async function classify(where, doc, marker) {
  if (marker?.kind === 'invalid') {
    problems.push(`${where} — ${marker.message}`);
    return;
  }
  if (marker?.kind === 'ignore') {
    counts.ignored += 1;
    return;
  }
  if (marker?.kind === 'fragment') return validateFragment(where, doc, marker);

  const isDocument = doc && typeof doc === 'object' && !Array.isArray(doc) && typeof doc.schemaVersion === 'string';
  if (marker?.kind === 'document') {
    if (!isDocument) {
      problems.push(`${where} — fds:document, but the block has no top-level schemaVersion string.`);
      return;
    }
    return validateDocument(where, doc, marker.entity);
  }
  if (isDocument) return validateDocument(where, doc, null);

  if (looksLikeMapping(doc)) {
    counts.mappings += 1;
    const validate = await validatorFor('mapping', manifest.schemas.mapping.current);
    if (!validate(doc)) {
      problems.push(
        `${where} — does not validate against the transformer mapping schema ` +
          `(${validate.errors.length} error(s)):\n${errorLines(validate.errors)}`
      );
    }
    return;
  }

  problems.push(
    `${where} — this block is neither a document nor marked.\n` +
      `    Top-level names: ${
        Array.isArray(doc) ? '(array)' : Object.keys(doc ?? {}).join(', ') || '(none)'
      }\n` +
      '    Add `fds:fragment entity=<name>` if it is part of an FDS document, or ' +
      '`fds:ignore <reason>` if it is not FDS data at all.'
  );
}

// ── run ───────────────────────────────────────────────────────────────────────

const markdownFiles = [...ROOT_MARKDOWN.map((name) => join(ROOT, name))];
for (const dir of MARKDOWN_ROOTS) {
  for await (const file of walkFiles(join(ROOT, dir))) {
    if (/\.mdx?$/.test(file)) markdownFiles.push(file);
  }
}
markdownFiles.sort();

let blockCount = 0;
for (const file of markdownFiles) {
  const rel = relative(ROOT, file);
  const source = await readFile(file, 'utf8');
  for (const block of jsonFences(source)) {
    blockCount += 1;
    const where = `${rel}:${block.line}`;
    const marker = parseMarker(block.meta);
    if (marker?.kind === 'ignore') {
      counts.ignored += 1;
      continue;
    }
    let doc;
    try {
      doc = JSON.parse(block.text);
    } catch (error) {
      problems.push(
        `${where} — a \`\`\`json block that is not JSON: ${parseMessage(error)}\n` +
          '    A reader copying it gets a parse error. Fence it as text, or mark it ' +
          '`fds:ignore <reason>`.'
      );
      continue;
    }
    await classify(where, doc, marker);
  }
}

const sourceFiles = [];
for await (const file of walkFiles(join(ROOT, SOURCE_ROOT))) {
  if (SOURCE_EXTENSIONS.test(file)) sourceFiles.push(file);
}
sourceFiles.sort();

for (const file of sourceFiles) {
  const rel = relative(ROOT, file);
  const source = await readFile(file, 'utf8');
  if (!source.includes('schemaVersion')) continue;

  const { found, covered } = sourceDocuments(source, rel);
  const markers = new Map(); // line -> marker
  source.split('\n').forEach((line, index) => {
    const marker = parseMarker(line);
    if (marker) markers.set(index + 1, marker);
  });

  // Exhaustive sweep: every mention of schemaVersion is either inside something
  // the recogniser read, or acknowledged by a marker on the line or the one
  // above it. Nothing gets to be absent.
  for (const hit of source.matchAll(/\bschemaVersion\b/g)) {
    if (covered.some(([from, to]) => hit.index >= from && hit.index < to)) continue;
    const line = lineOf(source, hit.index);
    const marker = markers.get(line) ?? markers.get(line - 1);
    if (marker?.kind === 'ignore') {
      counts.ignored += 1;
      continue;
    }
    problems.push(
      `${rel}:${line} — "schemaVersion" appears here and this check cannot read the ` +
        'value it belongs to.\n' +
        '    Lift the document to a top-level `const` so it can be validated, or add ' +
        '`// fds:ignore <reason>` if it is prose.'
    );
  }

  for (const { line, doc } of found) {
    blockCount += 1;
    const marker = markers.get(line) ?? markers.get(line - 1);
    await classify(`${rel}:${line}`, doc, marker);
  }
}

// ── result ────────────────────────────────────────────────────────────────────

/**
 * Self-test: the fixtures must fail, and fail in the recorded way.
 *
 * Compared against a stored transcript rather than merely counted, because
 * "five errors" is not the claim — "these five errors, named" is. A message
 * that stops telling the author which property is missing has stopped being
 * useful long before it stops being red.
 */
if (SELF_TEST) {
  const expectedPath = join(ROOT, FIXTURES, 'expected-failures.txt');
  const actual = `${problems.map((p) => `  ${p}`).join('\n\n')}\n`;

  if (process.argv.includes('--record')) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(expectedPath, actual);
    console.log(`recorded ${problems.length} expected failure(s)`);
    process.exit(0);
  }

  const expected = await readFile(expectedPath, 'utf8').catch(() => null);
  if (expected === null) {
    console.error(`${FIXTURES}/expected-failures.txt is missing; run with --record.`);
    process.exit(1);
  }
  if (actual !== expected) {
    console.error(
      'The fixtures no longer fail the way they were recorded.\n\n' +
        `--- expected (${expected.split('\n').length} lines)\n${expected}\n` +
        `--- actual (${actual.split('\n').length} lines)\n${actual}`
    );
    process.exit(1);
  }
  console.log(
    `  ok    ${problems.length} recorded failure(s) still fail, including the landing-page ` +
      'exercise that shipped invalid'
  );
  process.exit(0);
}

for (const [label, actual] of [
  ['fragments', counts.fragments],
  ['ignored', counts.ignored],
]) {
  if (actual !== EXPECTED[label]) {
    problems.push(
      `${actual} block(s) marked ${label}; EXPECTED.${label} in this file says ${EXPECTED[label]}.\n` +
        '    Every opt-out is a decision. Update the number in the same diff that ' +
        'changes it, so it cannot grow quietly.'
    );
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  process.exit(1);
}

const byEntity = [...fragmentsBy.entries()]
  .sort()
  .map(([name, n]) => `${name} ${n}`)
  .join(', ');

console.log(
  `  ok    ${blockCount} JSON blocks read from ${markdownFiles.length} documents and ` +
    `${sourceFiles.length} source files\n` +
    `  ok    ${counts.documents} validated as documents, ${counts.mappings} as transformer configuration\n` +
    `  ok    ${counts.fragments} fragments (${byEntity || 'none'}); ` +
    `${counts.deepFragments} reach below a top-level property and ` +
    `${counts.partialFragments} are declared incomplete, so neither is validated\n` +
    `  ok    ${counts.ignored} blocks explicitly ignored`
);
