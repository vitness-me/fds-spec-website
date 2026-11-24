#!/usr/bin/env node
/**
 * Cross-checks an RFC against the schema it specifies, in both directions.
 *
 * Two failures this repository has already shipped, one of each kind:
 *
 *   - RFC-005 documented `localized` normatively; the body-atlas schema omitted
 *     it under `additionalProperties: false`, so the published example did not
 *     validate against its own schema.
 *   - The prescription schema promised that RFC-006 documented the conventional
 *     `setScheme` parameters. It did not.
 *
 * Prose and schema drift apart quietly because nothing reads both. This does.
 *
 * Forward:  every field and enum value the schema *authors* appears in the RFC.
 * Backward: every identifier the RFC writes in code style exists in the schema.
 * Placement: every field the RFC discusses is discussed where it actually lives.
 *
 * Only authored definitions count. A flattened copy of `metadata` belongs to
 * RFC-001, and demanding RFC-007 re-document it would be asking every RFC to
 * restate the envelope.
 *
 * ── Why a third rule, and why not the obvious one ────────────────────────────
 *
 * `check:skill` asks whether every name a document writes exists somewhere in
 * the standard. The backward rule above is already that question, and it caught
 * neither of the two defects this rule was added for:
 *
 *   - RFC-002 §4.2 documented `abbreviation` as part of `classification`.
 *     Equipment's `classification` holds `tags` and closes
 *     `additionalProperties`; `abbreviation` is on `canonical`.
 *   - RFC-003 §4.3 described `regions` and `regionGroup` as muscle fields.
 *     `regions` exists only inside `heatmap`; `regionGroup` is a `$defs` type.
 *
 * Every one of those names exists in the standard. Existence was never the
 * question — *placement* was, and a flat vocabulary cannot express placement.
 * A document that puts a real field in the wrong object is worse than one that
 * invents a field: the reader has no reason to doubt it, and the schema rejects
 * what they write.
 *
 * ── How a section's shape is decided ─────────────────────────────────────────
 *
 * From the RFC's own worked examples, which `check:doc-examples` already
 * validates against the schema. A section that shows `{"classification": {…}}`
 * is a section about `classification`, and the field names it writes in code
 * style must be reachable under that shape.
 *
 * A subsection with no example of its own is read against the one immediately
 * above it — RFC-003 §4.3 continues §4.2's `classification` — but the scope
 * decays after exactly one section. Letting it run further is what made this
 * rule unusable when it was first measured: §4.7 and §4.8 of RFC-007 inherited
 * §4.6's `settings` from three sections away and produced seven false reports
 * in one document.
 *
 * Four things are legitimate to name outside the shape, and each is exempt:
 *
 *   - a top-level field of the entity, which any section may refer to;
 *   - a value in a closed vocabulary, since `optional` and `required` are both
 *     `externalLoad` values in RFC-001 and property names elsewhere;
 *   - a `$defs` key, which is a *type* name rather than a field — `regionGroup`
 *     is what `classification.region` is, not something a document carries;
 *   - anything under a container the section also names, so that an aside about
 *     `loadTarget.method` may go on to discuss `scale` without a second rule
 *     for cross-references. Saying where a field lives is the whole point.
 *
 * Measured over all eight RFCs those four exemptions take the rule from 77
 * reports to 2, both of them real. It is a narrow rule by construction: it sees
 * only sections that show an example, which is roughly one section in four.
 *
 *   node scripts/check-rfc-fields.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFORMANCE_DIR, CONFORMANCE_TIERS, REGISTRY_DIR } from './lib/descriptors.mjs';
import { globalVocabulary, vocabularyOf } from './lib/vocabulary.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * RFCs paired with the schemas they specify: `source` for an RFC that
 * specifies a schema of its own, `adds` for one that adds fields to schemas
 * other RFCs specify, as pairs of the new version's source and the previous
 * version's.
 *
 * RFC-001..005 predated this check and carried 60 measured gaps between them —
 * every one a field the schema defined that the RFC only ever showed inside a
 * JSON block. Showing a field is not documenting it: a reader learns the name
 * exists and nothing about what it means.
 */
const PAIRS = [
  {
    rfc: 'specification/rfc/rfc-001-exercise-data-model.md',
    source: 'specification/schema-sources/exercises/v1.2.0/exercise.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-002-equipment-data-model.md',
    source: 'specification/schema-sources/equipment/v1.2.0/equipment.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-003-muscle-data-model.md',
    source: 'specification/schema-sources/muscle/v1.1.0/muscle.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-004-muscle-category-data-model.md',
    source: 'specification/schema-sources/muscle/muscle-category/v1.0.0/muscle-category.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-005-body-atlas-data-model.md',
    source: 'specification/schema-sources/atlas/v1.1.0/body-atlas.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-006-prescription-primitives.md',
    source: 'specification/schema-sources/prescription/v1.0.0/prescription.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-007-workout-data-model.md',
    source: 'specification/schema-sources/workout/v1.1.0/workout.schema.json',
  },
  {
    rfc: 'specification/rfc/rfc-008-program-data-model.md',
    source: 'specification/schema-sources/program/v1.0.0/program.schema.json',
  },
  // RFC-010 specifies no schema of its own: it adds fields to three entities and
  // to `common`. What it must document is what each new version adds over the
  // one before, which is read from the two sources rather than listed here.
  {
    rfc: 'specification/rfc/rfc-010-structural-descriptors.md',
    adds: [
      ['specification/schema-sources/common/v1.1.0/common.schema.json', 'specification/schema-sources/common/v1.0.0/common.schema.json'],
      ['specification/schema-sources/exercises/v1.2.0/exercise.schema.json', 'specification/schema-sources/exercises/v1.1.0/exercise.schema.json'],
      ['specification/schema-sources/equipment/v1.2.0/equipment.schema.json', 'specification/schema-sources/equipment/v1.1.0/equipment.schema.json'],
      ['specification/schema-sources/muscle/v1.1.0/muscle.schema.json', 'specification/schema-sources/muscle/v1.0.0/muscle.schema.json'],
    ],
  },
];

/**
 * Words an RFC may legitimately write in code style without them being fields:
 * JSON Schema keywords it explains, units and scale labels it names, and the
 * handful of literals that appear in prose.
 */
const PROSE = new Set([
  // JSON Schema keywords an RFC explains
  'additionalProperties', 'oneOf', 'anyOf', 'allOf', 'not', 'enum', 'const',
  'required', 'string', 'number', 'integer', 'boolean', 'object', 'array',
  'true', 'false', 'null', 'items', 'properties', 'defs', 'examples',
  // Field names from *other* formats, cited as anti-examples in RFC-007 §1.1
  'isCircuit', 'emomInterval', 'tabataRounds',
  // Conventional setScheme.params keys. Deliberately outside the schema —
  // `params` is open precisely so eleven methodologies are not frozen at 1.0.0
  // — but RFC-006 §4.6 documents them, so they appear in prose by design.
  'activationReps', 'backoffPercent', 'backoffSets', 'direction', 'dropPercent',
  'drops', 'endPercent', 'intraSetRest', 'miniSetReps', 'miniSets', 'repPattern',
  'repsPerCluster', 'restUnit', 'rungs', 'startPercent', 'target', 'timeUnit',
  'waves',
]);

/**
 * The published counterpart of an authoring source.
 *
 * `build-schemas.mjs` writes `specification/schema-sources/X` to
 * `specification/schemas/X` and asserts the result is self-contained, so the
 * published copy is the same schema with every `$ref` to `common` resolved.
 * The placement rule needs to walk *into* `canonical` and `metadata`, which the
 * sources only point at, so it reads the published copy — the same bytes a
 * consumer validates against. `check:schemas` keeps the two in step.
 */
const publishedOf = (source) => source.replace('/schema-sources/', '/schemas/');

const FENCE = /^```([^\n]*)\n([\s\S]*?)^```/gm;
const IDENTIFIER = /^[a-z][A-Za-z0-9]*$/;

/** A local `#/…` JSON pointer, resolved against the schema it came from. */
function pointer(schema, ref) {
  if (!ref.startsWith('#/')) return null;
  let node = schema;
  for (const raw of ref.slice(2).split('/')) {
    node = node?.[raw.replace(/~1/g, '/').replace(/~0/g, '~')];
    if (node === undefined) return null;
  }
  return node;
}

/** Every property name reachable from `node`, local `$ref`s followed. */
function reachable(schema, node, seen = new Set(), out = new Set()) {
  if (Array.isArray(node)) {
    for (const value of node) reachable(schema, value, seen, out);
    return out;
  }
  if (!node || typeof node !== 'object' || seen.has(node)) return out;
  seen.add(node);
  if (typeof node.$ref === 'string') {
    const target = pointer(schema, node.$ref);
    if (target) reachable(schema, target, seen, out);
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'properties' && value && typeof value === 'object') {
      for (const [name, child] of Object.entries(value)) {
        out.add(name);
        reachable(schema, child, seen, out);
      }
    } else {
      reachable(schema, value, seen, out);
    }
  }
  return out;
}

/** Where a name lives, as dotted paths from the root, for the failure message. */
function pathsTo(schema, wanted) {
  const found = new Set();
  const visit = (node, trail, seen) => {
    if (Array.isArray(node)) {
      for (const value of node) visit(value, trail, seen);
      return;
    }
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    const nextSeen = new Set(seen).add(node);
    if (typeof node.$ref === 'string') {
      const target = pointer(schema, node.$ref);
      if (target) visit(target, trail, nextSeen);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'properties' && value && typeof value === 'object') {
        for (const [name, child] of Object.entries(value)) {
          if (name === wanted) found.add([...trail, name].join('.'));
          visit(child, [...trail, name], nextSeen);
        }
      } else if (key !== '$defs') {
        visit(value, trail, nextSeen);
      }
    }
  };
  visit(schema, [], new Set());
  return [...found].sort();
}

/**
 * An RFC split at every ATX heading, each section carrying its own text.
 *
 * Headings inside a fence are not headings. A shell comment in RFC-008's
 * `bash` block starts with `#`, and treating it as one would cut a code block
 * in half and hand each part to a different section.
 */
function sectionsOf(doc) {
  const sections = [];
  let current = { heading: '(preamble)', level: 0, lines: [] };
  let fenced = false;
  for (const line of doc.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    const heading = fenced ? null : /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      sections.push(current);
      current = { heading: heading[2].trim(), level: heading[1].length, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);
  return sections;
}

/** The top-level keys of the FDS examples a section shows. */
function shapeOf(text) {
  const keys = new Set();
  for (const [, info, body] of text.matchAll(FENCE)) {
    if (!/\bfds:(document|fragment)\b/.test(info)) continue;
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      continue; // `check:doc-examples` owns malformed examples.
    }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const key of Object.keys(parsed)) keys.add(key);
    }
  }
  return keys;
}

const GLOBAL = await globalVocabulary();
const problems = [];
const readJson = async (path) => JSON.parse(await readFile(join(ROOT, path), 'utf8'));

/**
 * The descriptors' own terms, which RFC-010 writes in code style beside the
 * fields: the registries' fields, layer letters and codes, the conformance
 * tiers, and the relations and grades the compare vectors expect. Read from
 * those files, so a term they drop is no longer accepted here.
 */
async function descriptorTerms() {
  const terms = new Set(CONFORMANCE_TIERS);
  for (const file of await readdir(join(ROOT, REGISTRY_DIR))) {
    const registry = await readJson(`${REGISTRY_DIR}/${file}`);
    for (const key of Object.keys(registry)) terms.add(key);
    for (const entry of registry.layers ?? []) terms.add(entry.layer);
    for (const vocabulary of Object.values(registry.vocabularies ?? {})) for (const entry of vocabulary.entries ?? []) terms.add(entry.value);
  }
  for (const vector of (await readJson(`${CONFORMANCE_DIR}/compare.json`)).vectors) {
    for (const value of [vector.expect.relation, vector.expect.grade, ...Object.values(vector.expect.layers ?? {})]) if (value) terms.add(value);
  }
  return terms;
}

/**
 * An RFC that adds fields to schemas other RFCs specify. Forward: every name a
 * new version authors that the version before it did not is in the RFC.
 * Backward, as for any RFC: every bare identifier it writes exists somewhere in
 * the standard or is one of the descriptors' own terms. Placement is not run: it reads one schema's shapes, and these
 * RFCs document fields on several.
 */
const TERMS = await descriptorTerms();
for (const { rfc, adds } of PAIRS.filter((pair) => pair.adds)) {
  const doc = await readFile(join(ROOT, rfc), 'utf8');
  const spans = new Set([...doc.replace(/^```[\s\S]*?^```/gm, '').matchAll(/`([^`\n]+)`/g)].map((m) => m[1].trim()));
  const mentioned = new Set([...spans].flatMap((span) => span.match(/[A-Za-z][A-Za-z0-9_]*/g) ?? []));
  const added = new Set();
  for (const [source, since] of adds) {
    const before = vocabularyOf(await readJson(since));
    for (const name of vocabularyOf(await readJson(source))) if (!before.has(name)) added.add(name);
  }
  const undocumented = [...added].filter((name) => !mentioned.has(name)).sort();
  if (undocumented.length) {
    problems.push(`${rfc}\n    does not document ${undocumented.length} name(s) its schema versions add:\n      ${undocumented.join(', ')}`);
  }
  const invented = [...new Set([...spans].filter((span) => IDENTIFIER.test(span)))]
    .filter((token) => !GLOBAL.has(token) && !PROSE.has(token) && !TERMS.has(token))
    .sort();
  if (invented.length) {
    problems.push(
      `${rfc}\n    writes ${invented.length} identifier(s) no schema or descriptor registry defines:\n      ${invented.join(', ')}\n` +
        '      Either the schema is missing them, or they belong in the PROSE allowlist.'
    );
  }
  if (!undocumented.length && !invented.length) {
    console.log(`  ok    ${rfc} — ${added.size} names its schema versions add, both directions`);
  }
}

for (const { rfc, source } of PAIRS.filter((pair) => pair.source)) {
  const schema = JSON.parse(await readFile(join(ROOT, source), 'utf8'));
  const publishedPath = publishedOf(source);
  const publishedText = await readFile(join(ROOT, publishedPath), 'utf8').catch(() => null);
  if (publishedText === null) {
    problems.push(
      `${rfc}\n    has no published schema at ${publishedPath}.\n` +
        `      Run \`npm run build:schemas\`, or correct the source path in PAIRS.`
    );
    continue;
  }
  const published = JSON.parse(publishedText);
  const doc = await readFile(join(ROOT, rfc), 'utf8');

  // Fenced blocks are stripped: a field appearing only inside a JSON example is
  // shown, not explained, and backticks inside a fence pair with the wrong ones.
  const prose = doc.replace(/^```[\s\S]*?^```/gm, '');
  const spans = new Set(
    [...prose.matchAll(/`([^`\n]+)`/g)].map((m) => m[1].trim())
  );

  // Forward: any identifier appearing anywhere inside a code span counts as
  // mentioned, so `items[].groupLabel` and `{ id, trigger, action }` both
  // document each name they contain.
  const mentioned = new Set();
  for (const span of spans) {
    for (const word of span.match(/[A-Za-z][A-Za-z0-9_]*/g) ?? []) mentioned.add(word);
  }

  // Backward: only whole spans that are a bare identifier. A fragment of a URL
  // or filename is not a claim that a field exists.
  const claimed = [...spans].filter((span) => /^[a-z][A-Za-z0-9]*$/.test(span));

  const vocabulary = vocabularyOf(schema);

  const undocumented = [...vocabulary].filter((name) => !mentioned.has(name)).sort();
  if (undocumented.length) {
    problems.push(
      `${rfc}\n    does not document ${undocumented.length} name(s) the schema defines:\n` +
        `      ${undocumented.join(', ')}`
    );
  }

  const invented = [...new Set(claimed)]
    .filter((token) => !GLOBAL.has(token) && !PROSE.has(token))
    .sort();
  if (invented.length) {
    problems.push(
      `${rfc}\n    writes ${invented.length} identifier(s) the schema does not define:\n` +
        `      ${invented.join(', ')}\n` +
        '      Either the schema is missing them, or they belong in the PROSE allowlist.'
    );
  }

  // Placement: a field discussed in a section is discussed where it lives.
  const subschemas = new Map(); // property name -> every subschema declaring it
  const fields = new Set();
  const values = new Set();
  const collect = (node) => {
    if (Array.isArray(node)) return node.forEach(collect);
    if (!node || typeof node !== 'object') return;
    if (node.properties && typeof node.properties === 'object') {
      for (const [name, child] of Object.entries(node.properties)) {
        fields.add(name);
        if (!subschemas.has(name)) subschemas.set(name, []);
        subschemas.get(name).push(child);
      }
    }
    if (Array.isArray(node.enum)) {
      for (const value of node.enum) if (typeof value === 'string') values.add(value);
    }
    if (typeof node.const === 'string') values.add(node.const);
    Object.values(node).forEach(collect);
  };
  collect(published);

  const rootFields = new Set(Object.keys(published.properties ?? {}));
  const types = new Set(Object.keys(published.$defs ?? {}));

  const misplaced = [];
  let inScope = 0;
  let carried = null; // a shape reaches exactly one section past the one showing it

  for (const section of sectionsOf(doc)) {
    const text = section.lines.join('\n');
    const shown = shapeOf(text);
    const shape = shown.size ? shown : section.level >= 3 ? carried : null;
    carried = shown.size ? shown : null;
    if (!shape) continue;

    const sectionSpans = [...text.replace(FENCE, '\n').matchAll(/`([^`\n]+)`/g)].map((m) =>
      m[1].trim()
    );

    const allowed = new Set(shape);
    const widen = (node) => {
      for (const name of reachable(published, node)) allowed.add(name);
    };
    for (const key of shape) for (const node of subschemas.get(key) ?? []) widen(node);
    // Widened by any container or type the section names: a section that says
    // where a field lives has earned the right to talk about it.
    for (const span of sectionSpans) {
      for (const word of span.match(/[A-Za-z][A-Za-z0-9_]*/g) ?? []) {
        for (const node of subschemas.get(word) ?? []) widen(node);
        if (published.$defs?.[word]) widen(published.$defs[word]);
      }
    }

    for (const span of sectionSpans) {
      if (!IDENTIFIER.test(span)) continue;
      if (!fields.has(span) || types.has(span)) continue;
      if (rootFields.has(span) || values.has(span)) continue;
      if (allowed.has(span)) {
        inScope += 1;
        continue;
      }
      misplaced.push({ section: section.heading, name: span, shape: [...shape] });
    }
  }

  if (misplaced.length) {
    problems.push(
      `${rfc}\n    documents ${misplaced.length} field(s) somewhere the schema does not accept them:\n` +
        misplaced
          .map(({ section, name, shape }) => {
            const homes = pathsTo(published, name);
            return (
              `      \`${name}\` in "${section}", a section about ${shape
                .map((key) => `\`${key}\``)
                .join(', ')}\n` +
              `        The schema puts it at ${homes.map((p) => `\`${p}\``).join(' or ') || '(nowhere reachable)'}. ` +
              'Move the text to the section documenting that shape, or name the\n' +
              '        containing field here so the reference says where it lives.'
            );
          })
          .join('\n')
    );
  }

  if (!undocumented.length && !invented.length && !misplaced.length) {
    console.log(
      `  ok    ${rfc} — ${vocabulary.size} names, both directions; ` +
        `${inScope} in the shape their section documents`
    );
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  '\nEvery RFC documents its schema, documents nothing the schema lacks, and ' +
    'puts each field where the schema accepts it.'
);
