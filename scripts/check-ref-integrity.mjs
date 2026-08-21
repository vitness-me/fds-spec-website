#!/usr/bin/env node
/**
 * A denormalised copy accepts exactly what the field it copies accepts.
 *
 * An FDS entity reference is a pointer plus a copy of enough of the target to
 * be useful without following it — RFC-008 §3.2 puts the bargain plainly: the
 * denormalised name "exists precisely so that a program remains *listable*
 * without resolution". A copy that is the empty string collects the cost of
 * carrying redundant data and delivers none of the benefit.
 *
 * Today five references collect exactly that cost. An entity's own
 * `canonical.name` must be non-empty and its `canonical.slug` must match the
 * slug pattern; the same two fields on a reference *to* that entity accept the
 * empty string, so a document whose every reference is blank validates against
 * the published schema and cannot be rendered by anything.
 *
 * RFC-010 specifies the rule and says why encoding it waits on a major release:
 * a schema that newly rejects the empty string rejects documents its
 * predecessor accepted, and every schema carrying a reference is frozen.
 *
 * ── What this can and cannot do about that ───────────────────────────────────
 *
 * It cannot fix the divergences. It can stop them multiplying, which is the
 * failure that actually happened: two unconstrained references became five
 * because each new one was shaped from the last. The third of them says so in
 * its own `description` — "mirroring muscleRef/equipmentRef" — and the laxity
 * came along with the shape.
 *
 * So the divergences that exist are recorded in KNOWN below, and anything else
 * fails:
 *
 *   - a reference field that diverges from its source and is not recorded —
 *     a sixth reference copied from the fifth fails on the commit that adds it;
 *   - a recorded divergence that no longer exists — the record is stale, which
 *     is how a baseline quietly stops describing the tree. Encoding RFC-010
 *     fails this check until KNOWN is emptied in the same change.
 *
 * ── Which fields are compared, and against what ──────────────────────────────
 *
 * Nothing here keeps a list of references or of entities. The references are
 * every `*Ref` definition in the shared authoring source that is entity-shaped
 * (carries `id` and `name`); the entity each points at is its name without the
 * suffix, resolved to a schema source through the generated release manifest,
 * so publishing a new entity version moves this check with it. A reference
 * naming no published entity fails rather than being skipped.
 *
 * A reference field's source is the entity field of the same name on
 * `canonical`, or for `id` the entity's own identifier. A field with no source
 * — `muscleRef.categoryId` copies an identifier of a *different* entity, and
 * `equipmentRef.categories` copies a field equipment does not have — has no
 * constraint to inherit and is reported as unsourced rather than as diverging.
 * RFC-010 §4.3 is where that finding goes; this only keeps count of it.
 *
 * Comparison is over the keywords that decide which values are accepted, not
 * over the whole subschema: `title` and `description` differ legitimately
 * between a field and a copy of it. A reference that is *stricter* than its
 * source is a divergence too — it would make a valid entity unreferenceable.
 *
 *   node scripts/check-ref-integrity.mjs
 *   node scripts/check-ref-integrity.mjs --self-test
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = 'specification/schema-sources';
const COMMON = `${SOURCES}/common/v1.0.0/common.schema.json`;
const MANIFEST = 'specification/releases.json';

/**
 * The divergences on the tree today, and what retires each one.
 *
 * Keyed `<ref>.<field>`. The value is the reason it is still here, not a
 * judgement that it is acceptable — every entry is a defect RFC-010 §3 says
 * must go, held open only because the schemas that carry it are frozen.
 */
const KNOWN = new Map(
  [
    'equipmentRef.aliases', 'equipmentRef.name', 'equipmentRef.slug',
    'exerciseRef.aliases', 'exerciseRef.name', 'exerciseRef.slug',
    'muscleRef.aliases', 'muscleRef.name', 'muscleRef.slug',
    'programRef.aliases', 'programRef.name', 'programRef.slug',
    'workoutRef.aliases', 'workoutRef.name', 'workoutRef.slug',
  ].map((key) => [key, 'RFC-010 §3.1 — encoded at the next major release'])
);

/** Keywords that decide which values a subschema accepts. */
const NARROWING = [
  'type', 'enum', 'const', 'format', 'pattern',
  'minLength', 'maxLength', 'minItems', 'maxItems', 'uniqueItems',
];

/** Resolve a local `#/$defs/x` reference; anything else is returned as-is. */
function deref(node, defs, seen = 0) {
  if (!node || typeof node !== 'object' || typeof node.$ref !== 'string') return node;
  const local = node.$ref.split('#').pop();
  const key = local?.startsWith('/$defs/') ? local.slice('/$defs/'.length) : null;
  if (!key || !defs[key] || seen > 8) return node;
  return deref(defs[key], defs, seen + 1);
}

/** The accepted-values shape of a subschema, with documentation stripped out. */
function shapeOf(node, defs) {
  const resolved = deref(node, defs);
  if (!resolved || typeof resolved !== 'object') return null;
  const shape = {};
  for (const key of NARROWING) if (key in resolved) shape[key] = resolved[key];
  if (resolved.items) shape.items = shapeOf(resolved.items, defs);
  return shape;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Compare one reference against the entity it copies.
 *
 * Returns `{ diverging, unsourced }`, both arrays of field names. Exported in
 * all but name so the self-test can drive it without a fixture tree.
 */
function compare(ref, entity, defs) {
  const canonical = deref(entity.properties?.canonical ?? {}, defs).properties ?? {};
  const identifier = Object.keys(entity.properties ?? {}).find(
    (name) => name === 'id' || /Id$/.test(name)
  );

  const diverging = [];
  const unsourced = [];
  for (const [field, subschema] of Object.entries(ref.properties ?? {})) {
    const source =
      canonical[field] ?? (field === 'id' && identifier ? entity.properties[identifier] : null);
    if (!source) {
      unsourced.push(field);
      continue;
    }
    if (!same(shapeOf(subschema, defs), shapeOf(source, defs))) diverging.push(field);
  }
  return { diverging: diverging.sort(), unsourced: unsourced.sort() };
}

/**
 * Proves the comparison reports a divergence, accepts a faithful copy, and
 * separates a field with no source from one that has drifted. Inline schemas
 * rather than a fixture tree: what is under test is the comparison, and the
 * traversal around it is exercised by every real run.
 */
function selfTest() {
  const defs = { slug: { type: 'string', pattern: '^[a-z0-9-]{2,}$' } };
  const entity = {
    properties: {
      id: { type: 'string' },
      canonical: {
        properties: {
          name: { type: 'string', minLength: 1 },
          slug: { $ref: '#/$defs/slug' },
        },
      },
    },
  };
  const cases = [
    [
      'a faithful copy diverges nowhere',
      { properties: { id: { type: 'string' }, name: { type: 'string', minLength: 1 }, slug: { type: 'string', pattern: '^[a-z0-9-]{2,}$' } } },
      { diverging: [], unsourced: [] },
    ],
    [
      'an unconstrained copy of a constrained field diverges',
      { properties: { name: { type: 'string' }, slug: { type: 'string' } } },
      { diverging: ['name', 'slug'], unsourced: [] },
    ],
    [
      'a copy stricter than its source diverges too',
      { properties: { name: { type: 'string', minLength: 3 } } },
      { diverging: ['name'], unsourced: [] },
    ],
    [
      'a description does not count as a difference',
      { properties: { name: { type: 'string', minLength: 1, description: 'display name' } } },
      { diverging: [], unsourced: [] },
    ],
    [
      'a field the entity does not have is unsourced, not diverging',
      { properties: { categories: { type: 'array', items: { type: 'string' } } } },
      { diverging: [], unsourced: ['categories'] },
    ],
  ];

  let failed = 0;
  for (const [label, ref, expected] of cases) {
    const actual = compare(ref, entity, defs);
    if (same(actual, expected)) {
      console.log(`  ok    ${label}`);
    } else {
      failed += 1;
      console.error(`  FAIL  ${label}\n          expected ${JSON.stringify(expected)}\n          got      ${JSON.stringify(actual)}`);
    }
  }
  if (failed) process.exit(1);
  console.log(`\nself-test OK — the comparison holds in all ${cases.length} recorded ways.`);
}

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const common = JSON.parse(await readFile(join(ROOT, COMMON), 'utf8'));
const manifest = JSON.parse(await readFile(join(ROOT, MANIFEST), 'utf8'));
const defs = common.$defs ?? {};

const references = Object.entries(defs)
  .filter(([name, def]) => name.endsWith('Ref') && def?.properties?.id && def?.properties?.name)
  .sort(([a], [b]) => a.localeCompare(b));

const problems = [];
if (!references.length) {
  problems.push(
    `${COMMON}\n    defines no entity references, so this check compared nothing.\n` +
      `      A check that passes over the empty set is the defect it exists to catch.`
  );
}

const seen = new Set();
let unsourcedCount = 0;

for (const [name, ref] of references) {
  // `muscleCategoryRef` names `muscle-category`: the manifest is keyed the way
  // the schema directories are, and a definition name cannot be.
  const entityKey = name
    .replace(/Ref$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
  const entry = manifest.schemas?.[entityKey];
  if (!entry) {
    problems.push(
      `${name}\n    names entity "${entityKey}", which ${MANIFEST} does not list.\n` +
        `      Rename the definition to match the entity it references, or publish the entity.`
    );
    continue;
  }
  const published = entry.versions?.[entry.current]?.path;
  const source = published && join(ROOT, SOURCES, published);
  const entity = source && (await readFile(source, 'utf8').then(JSON.parse).catch(() => null));
  if (!entity) {
    problems.push(
      `${name}\n    references ${entityKey} ${entry.current}, whose authoring source is not at\n` +
        `      ${SOURCES}/${published}.\n` +
        `      Run \`npm run build:schemas\`, or check the manifest is current.`
    );
    continue;
  }

  const { diverging, unsourced } = compare(ref, entity, defs);
  unsourcedCount += unsourced.length;

  for (const field of diverging) {
    const key = `${name}.${field}`;
    seen.add(key);
    if (KNOWN.has(key)) continue;
    problems.push(
      `${key}\n    accepts values that ${entityKey}'s own \`${field}\` does not, or refuses values it accepts.\n` +
        `      A denormalised copy carries the constraints of the field it copies (RFC-010 §3.1).\n` +
        `      Give \`${key}\` the same constraints as ${entityKey} \`canonical.${field}\`, or — if this\n` +
        `      is a frozen schema that cannot be changed yet — record it in KNOWN in this file\n` +
        `      with what retires it.`
    );
  }
}

for (const key of [...KNOWN.keys()].sort()) {
  if (seen.has(key)) continue;
  problems.push(
    `${key}\n    is recorded in KNOWN but no longer diverges from its source.\n` +
      `      Delete the entry. A record that has stopped describing the tree makes this\n` +
      `      check pass for a reason that is no longer true.`
  );
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  process.exit(1);
}

console.log(
  `  ok    ${references.length} entity references compared against the entities they copy; ` +
    `${KNOWN.size} recorded divergence(s) still present, ${unsourcedCount} field(s) with no source field.`
);
