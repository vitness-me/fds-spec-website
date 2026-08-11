#!/usr/bin/env node
/**
 * The published mapping schema names every configuration key the transformer
 * reads, and no others.
 *
 * `transformer/v1.0.0/mapping.schema.json` closed `additionalProperties` at the
 * root and inside `enrichment`, which is a promise: these are the keys, a key
 * not listed is a mistake, and an editor pointed at `$schema` may say so. The
 * transformer then grew `allowUnsafeEval`, `enrichment.tiers`, `.fields`,
 * `.fallback`, `.rateLimit` and `.checkpoint`, documented all six, and shipped
 * example configurations using them. None of them validated. A user following
 * the tool's own documentation wrote a file the standard rejected, and eight
 * documentation blocks carried an opt-out saying so.
 *
 * That is the defect this repository keeps finding in new places: something
 * *asserted* in one document and *implemented* in another, with nothing
 * comparing the two. A mocked fetch proving a URL well-formed while the endpoint
 * 404s. A command in a README that never ran. Here, a schema rejecting the
 * configuration its own tool accepts. The repair is never the instance; it is
 * something that reads both.
 *
 * So this reads both:
 *
 *   1. Key parity. Walking from `MappingConfig` in the transformer's own
 *      `types.ts` and from the schema root at the same time, every object the
 *      schema constrains declares exactly the properties the matching interface
 *      declares. A key added to one and not the other fails here, in the commit
 *      that adds it.
 *
 *   2. Closure. Parity is only worth something where the schema is closed:
 *      `additionalProperties: false` is what turns "these are the keys" from a
 *      list into a claim. Every object compared must carry it.
 *
 *   3. The configurations in this repository validate. The transformer's
 *      examples, its proof-of-concept config and the skill's worked mappings are
 *      real files a reader copies, and until now nothing read them at all — the
 *      documentation gate reads markdown, and these are `.json` on disk.
 *
 * ── What is *not* compared, and why ──────────────────────────────────────────
 *
 * Which keys exist is mechanical. Which are *required*, and what types and
 * ranges they take, is a judgement about what the implementation defaults —
 * `enrichment.rateLimit` merges with a default and may be partial, while
 * `enrichment.fallback` replaces the default wholesale and may not. TypeScript's
 * `?` records neither, so comparing optionality here would enforce a distinction
 * the source does not make and would have to be defeated with exceptions. It
 * stays a review question, argued in the schema's own descriptions.
 *
 * The walk stops where the schema stops making a claim. `mappings.*.options` and
 * `registries.*.inline` are deliberately unconstrained — transform options and
 * registry entries are not mapping configuration — so an object with no
 * `properties` is a leaf here rather than a comparison nobody could satisfy.
 *
 *   node scripts/check-mapping-schema.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(ROOT, 'specification/releases.json');
const TYPES = 'packages/fds-transformer/src/core/types.ts';

/** The interface the transformer parses a `mapping.json` into. */
const ROOT_INTERFACE = 'MappingConfig';

/**
 * Properties the schema declares that the implementation has no field for.
 *
 * Both are annotations for whoever opens the file, not inputs: the transformer
 * reads neither, and a configuration is a document a person writes. `$schema` is
 * not here because `MappingConfig` does declare it.
 *
 * An entry that matches nothing is an error. A list of exceptions nobody has
 * needed for a year is scaffolding pretending to be a decision.
 */
const ANNOTATIONS = [
  {
    at: '/',
    property: 'description',
    reason: 'a note to the reader, like $schema; the transformer never reads it',
  },
];

const problems = [];
const note = (message) => problems.push(message);

// ── the schema ───────────────────────────────────────────────────────────────

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
const entry = manifest.schemas?.mapping;
if (!entry) {
  console.error(
    `specification/releases.json publishes no "mapping" schema.\n` +
      '  This check compares the transformer against its published configuration schema. ' +
      'If the schema has been withdrawn, delete this check with it.'
  );
  process.exit(1);
}
/** A published mapping version, as {schema, rel}. */
async function published(version) {
  const record = entry.versions[version];
  if (!record?.path) return null;
  const rel = `specification/schemas/${record.path}`;
  return { schema: JSON.parse(await readFile(join(ROOT, rel), 'utf8')), rel };
}

const current = await published(entry.current);

/** The schema the walk is currently reading. Set by `parity()`. */
let schema = current.schema;
let schemaRel = current.rel;

// ── the implementation ───────────────────────────────────────────────────────

const source = await readFile(join(ROOT, TYPES), 'utf8');

/**
 * The text between the braces that follow `from`, brace-matched.
 *
 * Brace-matched rather than line-counted because the declarations here nest —
 * `FallbackConfig.degradeChain` is an object literal inside an interface body,
 * and a regex that stops at the first `}` would silently return half a type.
 */
function braceBody(text, from) {
  const open = text.indexOf('{', from);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return { body: text.slice(open + 1, i), end: i + 1 };
    }
  }
  return null;
}

/** Every `interface Name { … }` in the file, by name. */
const interfaces = new Map();
for (const match of source.matchAll(/(?:export\s+)?interface\s+(\w+)\s*(?=\{)/g)) {
  const found = braceBody(source, match.index);
  if (found) interfaces.set(match[1], found.body);
}

/** Every `type Name = …;` in the file, by name, as the text of its right side. */
const aliases = new Map();
for (const match of source.matchAll(/(?:export\s+)?type\s+(\w+)\s*=\s*/g)) {
  const from = match.index + match[0].length;
  // The alias runs to the semicolon that is not inside a brace, bracket or angle.
  let depth = 0;
  let end = source.length;
  for (let i = from; i < source.length; i += 1) {
    const c = source[i];
    if ('{[<('.includes(c)) depth += 1;
    else if ('}])>'.includes(c)) depth -= 1;
    else if (c === ';' && depth === 0) {
      end = i;
      break;
    }
  }
  aliases.set(match[1], source.slice(from, end).trim());
}

if (!interfaces.has(ROOT_INTERFACE)) {
  console.error(
    `${TYPES} declares no ${ROOT_INTERFACE}.\n` +
      '  That interface is what this check walks from. If it was renamed, rename it here too — ' +
      'a check that cannot find its starting point must fail loudly, not pass quietly.'
  );
  process.exit(1);
}

/**
 * The properties an interface body declares, as name → type text.
 *
 * Split at the top level only, so a nested object literal stays with the
 * property that owns it. Comments are dropped first: a `/** … *\/` doc block
 * contains colons and would otherwise read as a declaration.
 */
function propertiesOf(body, label) {
  const stripped = body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < stripped.length; i += 1) {
    const c = stripped[i];
    if ('{[<('.includes(c)) depth += 1;
    else if ('}])>'.includes(c)) depth -= 1;
    else if ((c === ';' || c === '\n') && depth === 0) {
      parts.push(stripped.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(stripped.slice(start));

  const properties = new Map();
  for (const part of parts) {
    const match = /^\s*(\[[^\]]+\]|[$\w]+)\s*(\??)\s*:\s*([\s\S]+)$/.exec(part);
    if (!match) continue;
    if (match[1].startsWith('[')) continue; // an index signature, handled as a map
    properties.set(match[1], match[3].trim());
  }

  if (!properties.size) {
    note(
      `${TYPES}: ${label} parsed as having no properties.\n` +
        '    Either it genuinely has none, or the declaration style changed and this check has ' +
        'stopped reading it. Both need a human; a comparison against an empty set proves nothing.'
    );
  }
  return properties;
}

// ── resolving a TypeScript type to a shape ───────────────────────────────────

/**
 * What a type text is, for the purpose of walking beside a schema.
 *
 * `object` carries properties to compare, `map` and `array` carry a member type
 * to descend into, and `leaf` is everything the schema is not going to describe
 * as an object — a string, an enum, `unknown`.
 */
function shapeOf(text, label, seen = new Set()) {
  const type = text.trim().replace(/;$/, '');

  // A union: drop the null and undefined members, then take the object-ish ones.
  // `splitTop` returning a single part means every `|` was nested — inside a
  // `Record<…>` or an object literal — so this is not a union at all, and
  // recursing on it would be recursing on the same text forever.
  const members = type.includes('|')
    ? splitTop(type, '|').map((member) => member.trim())
    : [];
  if (members.length > 1) {
    const real = members.filter((member) => member !== 'null' && member !== 'undefined');
    const shapes = real
      .map((member) => shapeOf(member, label, seen))
      .filter((shape) => shape.kind !== 'leaf');
    if (!shapes.length) return { kind: 'leaf' };
    if (shapes.length === 1) return shapes[0];
    // Two object branches under one name would need the schema to say which is
    // which. Nothing in this file does it, and guessing is how a comparison
    // passes against the wrong half.
    note(
      `${TYPES}: ${label} is a union of ${shapes.length} object types.\n` +
        '    This check cannot tell which schema branch each belongs to. Name them, or split ' +
        'the property.'
    );
    return { kind: 'leaf' };
  }

  const array = /^(.*)\[\]$/.exec(type) ?? /^Array<([\s\S]+)>$/.exec(type);
  if (array) return { kind: 'array', member: array[1].trim() };

  const record = /^Record<\s*string\s*,([\s\S]+)>$/.exec(type);
  if (record) return { kind: 'map', member: record[1].trim() };

  if (type.startsWith('{')) {
    const found = braceBody(type, 0);
    return found
      ? { kind: 'object', properties: propertiesOf(found.body, `${label} (inline object)`) }
      : { kind: 'leaf' };
  }

  if (interfaces.has(type)) {
    if (seen.has(type)) return { kind: 'leaf' };
    return { kind: 'object', properties: propertiesOf(interfaces.get(type), type), name: type };
  }

  if (aliases.has(type)) {
    if (seen.has(type)) return { kind: 'leaf' };
    return shapeOf(aliases.get(type), type, new Set([...seen, type]));
  }

  return { kind: 'leaf' };
}

/** Split on a separator that is not inside braces, brackets or angles. */
function splitTop(text, separator) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if ('{[<('.includes(c)) depth += 1;
    else if ('}])>'.includes(c)) depth -= 1;
    else if (c === separator && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

// ── resolving a schema node ──────────────────────────────────────────────────

const deref = (node) => {
  if (node && typeof node.$ref === 'string' && node.$ref.startsWith('#/$defs/')) {
    const name = node.$ref.slice('#/$defs/'.length);
    const target = schema.$defs?.[name];
    if (!target) {
      note(`${schemaRel}: $ref ${node.$ref} does not resolve.`);
      return null;
    }
    return target;
  }
  return node;
};

/**
 * The one object branch of a schema node, or null.
 *
 * `oneOf` is how this schema says "a string, or the object form" — the string
 * branch is not something to compare properties against.
 */
function objectBranch(node) {
  const resolved = deref(node);
  if (!resolved) return null;
  if (resolved.properties || resolved.additionalProperties !== undefined) return resolved;
  for (const key of ['oneOf', 'anyOf', 'allOf']) {
    const branches = (resolved[key] ?? []).map(deref).filter(Boolean);
    const objects = branches.filter(
      (branch) => branch.properties || branch.additionalProperties !== undefined
    );
    if (objects.length === 1) return objects[0];
    if (objects.length > 1) {
      note(
        `${schemaRel}: a ${key} has ${objects.length} object branches; this check cannot tell ` +
          'which the implementation means.'
      );
      return null;
    }
  }
  return null;
}

// ── the walk ─────────────────────────────────────────────────────────────────

let compared = 0;
let leaves = 0;
const visited = new Set();

function walk(typeText, node, path, label) {
  const shape = shapeOf(typeText, label);
  const branch = objectBranch(node);

  if (shape.kind === 'array') {
    const items = node && deref(node).items;
    if (items) walk(shape.member, items, `${path}[]`, `${label}[]`);
    return;
  }

  if (shape.kind === 'map') {
    const values = branch && typeof branch.additionalProperties === 'object'
      ? branch.additionalProperties
      : null;
    if (!values) {
      leaves += 1;
      return;
    }
    walk(shape.member, values, `${path}*`, `${label} value`);
    return;
  }

  if (shape.kind !== 'object' || !branch || !branch.properties) {
    leaves += 1;
    return;
  }

  const key = `${path} ${shape.name ?? label}`;
  if (visited.has(key)) return;
  visited.add(key);

  if (branch.additionalProperties !== false) {
    note(
      `${schemaRel}: the object at ${path} lists properties but does not close ` +
        '`additionalProperties`.\n' +
        '    An open object cannot promise it names every key the transformer reads, which is ' +
        'the only thing this document is for. Set `"additionalProperties": false`.'
    );
  }

  const declared = new Set(shape.properties.keys());
  const published = new Set(Object.keys(branch.properties));
  const allowed = ANNOTATIONS.filter((annotation) => annotation.at === path);

  for (const annotation of allowed) {
    if (published.has(annotation.property) && !declared.has(annotation.property)) {
      annotation.used = true;
      published.delete(annotation.property);
    }
  }

  const missing = [...declared].filter((name) => !published.has(name));
  const extra = [...published].filter((name) => !declared.has(name));

  if (missing.length) {
    note(
      `${schemaRel}: ${path} does not publish ${missing.length} key(s) the transformer reads: ` +
        `${missing.join(', ')}\n` +
        `    ${TYPES} declares them on ${shape.name ?? label}, and the object is closed, so a ` +
        'configuration using them is rejected by the schema its own tool ships.\n' +
        '    Publish a new mapping version that includes them — the published bytes of an ' +
        'existing version never change.'
    );
  }
  if (extra.length) {
    note(
      `${schemaRel}: ${path} publishes ${extra.length} key(s) the transformer does not read: ` +
        `${extra.join(', ')}\n` +
        `    Nothing in ${TYPES} declares them on ${shape.name ?? label}. A schema that accepts a ` +
        'key the tool ignores tells the user their configuration is correct while it does ' +
        'nothing.\n' +
        '    Remove it, or — if it is an annotation for the reader rather than an input — add it ' +
        'to ANNOTATIONS in this file with the reason.'
    );
  }

  compared += 1;

  for (const [name, text] of shape.properties) {
    const child = branch.properties[name];
    if (!child) continue; // already reported as missing
    walk(text, child, path === '/' ? `/${name}` : `${path}/${name}`, `${shape.name ?? label}.${name}`);
  }
}

/** One parity pass over a published version, returning the problems it found. */
function parity(version) {
  schema = version.schema;
  schemaRel = version.rel;
  compared = 0;
  leaves = 0;
  visited.clear();
  const before = problems.length;
  walk(ROOT_INTERFACE, schema, '/', ROOT_INTERFACE);
  return problems.splice(before);
}

// ── self-test ────────────────────────────────────────────────────────────────
//
// A gate that has only ever passed has not been tested, so this one is run
// against the defect it was written for before it is trusted with anything else.
//
// mapping 1.0.0 is the fixture, and it is a good one: it is a published,
// superseded, frozen document, so its bytes are exactly what shipped and can
// never be quietly fixed to make this pass. Against today's transformer it is
// missing six keys. If this check cannot see them it cannot see anything, and
// saying so is worth more than a green line.

const SELF_TEST_VERSION = '1.0.0';
const SELF_TEST_MISSING = [
  'allowUnsafeEval',
  'tiers',
  'fields',
  'fallback',
  'rateLimit',
  'checkpoint',
];

if (process.argv.includes('--self-test')) {
  const fixture = await published(SELF_TEST_VERSION);
  if (!fixture) {
    console.error(
      `mapping ${SELF_TEST_VERSION} is no longer published, so this check has lost the only ` +
        'recorded example of what it looks for.\n' +
        '  Point SELF_TEST_VERSION at another version that is genuinely behind the ' +
        'implementation, and record what it is missing.'
    );
    process.exit(1);
  }

  const found = parity(fixture);
  const text = found.join('\n');
  const unseen = SELF_TEST_MISSING.filter((key) => !text.includes(key));
  if (unseen.length) {
    console.error(
      `Self-test failed: reading mapping ${SELF_TEST_VERSION} did not report ` +
        `${unseen.join(', ')} as missing.\n` +
        `  That version rejects every one of them and the transformer reads every one of them. ` +
        'A check that cannot see that is not checking anything.\n' +
        (found.length ? `  What it did report:\n${found.map((p) => `    ${p}`).join('\n')}` : '  It reported nothing at all.')
    );
    process.exit(1);
  }
  console.log(
    `  ok    self-test: mapping ${SELF_TEST_VERSION} still fails on all ` +
      `${SELF_TEST_MISSING.length} keys the transformer grew past it`
  );
  // The exception is scoped to the current schema; the fixture predates it.
  for (const annotation of ANNOTATIONS) delete annotation.used;
}

problems.push(...parity(current));

for (const annotation of ANNOTATIONS) {
  if (annotation.used) continue;
  note(
    `The annotation exception for "${annotation.property}" at ${annotation.at} matches nothing.\n` +
      '    Either the schema stopped publishing it or the implementation started reading it. ' +
      'Delete the entry from ANNOTATIONS in this file.'
  );
}

// A walk that compared nothing exits zero and says everything agrees. That is
// the shape of failure this whole check exists to remove, so it is named.
if (!compared) {
  note(
    'No object was compared at all.\n' +
      `    Either ${TYPES} or the published schema stopped having the shape this check reads. ` +
      'A check that examines nothing is not a passing check.'
  );
}

// ── rule 3: the configurations in this repository ────────────────────────────

let Ajv;
let addFormats;
try {
  Ajv = (await import('ajv/dist/2020.js')).default;
  addFormats = (await import('ajv-formats')).default;
} catch {
  console.error(
    'ajv is not installed. Run `npm install --no-save ajv@8 ajv-formats@3`\n' +
      '  (CI installs it for the documented-example check, which runs before this one.)'
  );
  process.exit(1);
}

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const SKIP = new Set(['node_modules', 'dist', 'build', 'coverage', '.docusaurus', '.git']);

async function* jsonFiles(dir) {
  for (const item of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    if (SKIP.has(item.name)) continue;
    const rel = `${dir}/${item.name}`;
    if (item.isDirectory()) yield* jsonFiles(rel);
    else if (item.name.endsWith('.json')) yield rel;
  }
}

/**
 * A mapping configuration, recognised by the two properties only a mapping
 * configuration has.
 *
 * Deliberately *not* "every key is one the schema knows" — that is how a
 * configuration using a key the schema is missing stops being recognised as a
 * configuration and is skipped by the check that would have caught it.
 */
const isMappingConfig = (doc) =>
  doc && typeof doc === 'object' && !Array.isArray(doc) && 'targetSchema' in doc && 'mappings' in doc;

let configs = 0;
for (const dir of ['packages', 'specification', 'website/src', 'website/static']) {
  let entries;
  try {
    entries = jsonFiles(dir);
  } catch {
    continue;
  }
  for await (const rel of entries) {
    let doc;
    try {
      doc = JSON.parse(await readFile(join(ROOT, rel), 'utf8'));
    } catch {
      continue;
    }
    if (!isMappingConfig(doc)) continue;
    configs += 1;
    if (validate(doc)) continue;
    note(
      `${rel} does not validate against ${schemaRel} (${validate.errors.length} error(s)):\n` +
        validate.errors
          .slice(0, 12)
          .map(
            (error) =>
              `        ${error.instancePath || '/'} ${error.message}` +
              (error.params?.additionalProperty ? ` — ${error.params.additionalProperty}` : '')
          )
          .join('\n')
    );
  }
}

// ── result ───────────────────────────────────────────────────────────────────

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    `\nThe published mapping schema is the transformer's configuration contract. It closes ` +
      '`additionalProperties`,\nwhich is a promise that it lists every key the tool reads — so ' +
      'the two have to be changed together.\n' +
      `Sources: ${relative(ROOT, join(ROOT, TYPES))} and ${schemaRel}.\n`
  );
  process.exit(1);
}

console.log(
  `  ok    ${schemaRel} names what ${TYPES} reads: ` +
    `${compared} object(s) compared, ${leaves} unconstrained, ${configs} configuration(s) validated.`
);
