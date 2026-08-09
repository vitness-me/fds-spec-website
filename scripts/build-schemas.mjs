#!/usr/bin/env node
/**
 * Publishes FDS entity schemas.
 *
 * Authoring sources in `specification/schema-sources/` reference
 * `common.schema.json` so each shared definition exists exactly once. Consumers,
 * however, must be able to validate a single entity without resolving anything
 * over the network — several JSON Schema toolchains (Ajv's synchronous
 * `compile()` among them) cannot fetch an external `$ref` at all, and either
 * throw or silently skip validation when they meet one.
 *
 * So the published artifact is flattened: every definition reached from
 * `common.schema.json` is copied into the entity's own `$defs` under its
 * original name, and the external ref becomes a local `#/$defs/<name>`. The
 * published duplication is generated, never hand-maintained, so it cannot drift.
 *
 * Only *external* refs are rewritten. Internal `#/$defs/...` refs are left alone,
 * and nothing is ever rewritten to point into `properties` — a pointer into an
 * entity's instance shape is not a stable contract.
 *
 * Three artifacts come out of one run, so they cannot disagree:
 *   1. specification/schemas/                  the published schemas
 *   2. specification/schemas/.integrity.json   hash + freeze state per schema
 *   3. packages/fds-transformer/.../bundled/   the transformer's offline copies
 *
 * Usage:
 *   node scripts/build-schemas.mjs           write all three
 *   node scripts/build-schemas.mjs --check   verify they match sources (CI)
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'specification/schema-sources');
const OUT = join(ROOT, 'specification/schemas');
const INTEGRITY = join(OUT, '.integrity.json');
const BUNDLED = join(ROOT, 'packages/fds-transformer/src/schemas/bundled');

/**
 * Entity schemas to publish. `common` is authoring-only and deliberately absent.
 *
 * Entities version independently: a change to the exercise model must not force
 * a new muscle URL, and once RFC-006..008 land, a new workout entity must not
 * drag exercise to a version it did not change in.
 */
const ENTITIES = [
  { name: 'exercise', path: 'exercises/v1.1.0/exercise.schema.json' },
  { name: 'equipment', path: 'equipment/v1.1.0/equipment.schema.json' },
  { name: 'muscle', path: 'muscle/v1.0.0/muscle.schema.json' },
  { name: 'muscle-category', path: 'muscle/muscle-category/v1.0.0/muscle-category.schema.json' },
  { name: 'body-atlas', path: 'atlas/v1.0.0/body-atlas.schema.json' },
  // A definition library rather than an entity — nothing is ever "a prescription
  // document", so the transformer has nothing to validate against it. RFC-007 and
  // RFC-008 reference these definitions, and flattening copies them into those
  // schemas, so a bundled copy would be dead weight the loader never asks for.
  { name: 'prescription', path: 'prescription/v1.0.0/prescription.schema.json', bundled: false },
  // After prescription: workout composes its definitions, and a library must be
  // built before anything that references it.
  { name: 'workout', path: 'workout/v1.0.0/workout.schema.json' },
  // After workout: program references it by workoutRef and composes RFC-006
  // progression rules.
  { name: 'program', path: 'program/v1.0.0/program.schema.json' },
];

/** Entities the transformer carries an offline copy of. */
const BUNDLED_ENTITIES = ENTITIES.filter((entity) => entity.bundled !== false);

/**
 * The FDS release the bundled entity set constitutes, and the directory the
 * transformer bundles it under.
 *
 * Adding an entity changes what a release *contains*, so it gets a new release
 * name rather than being folded into the last one — a consumer pinned to 1.1.0
 * should not find a workout schema appearing in it.
 *
 * Earlier bundle directories are not regenerated. `v1.0.0`'s exercise and
 * equipment sources no longer exist (D9), `v1.1.0` predates workout and
 * `v1.2.0` predates program; all are checked-in historical artifacts kept for
 * consumers pinned to them.
 */
const BUNDLE_RELEASE = '1.3.0';

/**
 * Published schemas that are served but not generated from an authoring source.
 *
 * `transformer/v1.0.0/mapping.schema.json` describes the transformer's mapping
 * configuration, not an FDS entity: it has no `schema-sources` counterpart and
 * shares no `common` definitions, so there is nothing to flatten. It is still
 * served from spec.vitness.me, so it is still hashed and freezable — it is only
 * exempt from being *rendered*, not from being *tracked*.
 *
 * Adding a file here is a deliberate, reviewable act. That is the point: the
 * integrity manifest is derived from what is actually published, so nothing can
 * reach the published tree without appearing in one of these two lists.
 */
const UNGENERATED = ['transformer/v1.0.0/mapping.schema.json'];

/** Every `*.schema.json` under the published tree, relative to it. */
async function publishedSchemaFiles() {
  const entries = await readdir(OUT, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.schema.json'))
    .map((entry) => relative(OUT, join(entry.parentPath ?? entry.path, entry.name)))
    .sort();
}

const SCHEMA_BASE = 'https://spec.vitness.me/schemas/';
const COMMON_REL = 'common/v1.0.0/common.schema.json';

/**
 * Definition libraries an entity may reference, keyed by `$id`.
 *
 * `common` seeds it. Every entity built adds itself, so a later entity can
 * compose an earlier one — which is how RFC-007 Workout references the RFC-006
 * prescription primitives instead of restating them. ENTITIES is therefore
 * ordered by dependency, and a forward reference fails with a clear message
 * rather than silently inlining nothing.
 *
 * Registered defs are always the *flattened* ones, so anything copied out of a
 * library refers only to that library's own `$defs` — no chains to chase.
 */
const libraries = new Map();

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

const walk = (node, visit) => {
  if (Array.isArray(node)) return node.forEach((v) => walk(v, visit));
  if (!node || typeof node !== 'object') return;
  visit(node);
  Object.values(node).forEach((v) => walk(v, visit));
};

/** Split `<libraryId>#/$defs/<name>` into its parts, or null for a local ref. */
function parseExternalRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith(SCHEMA_BASE)) return null;
  const [id, pointer] = ref.split('#');
  if (!pointer || !pointer.startsWith('/$defs/')) {
    throw new Error(
      `refs must point at a $defs entry, not into an instance shape: ${ref}`
    );
  }
  return { id, name: pointer.slice('/$defs/'.length) };
}

/**
 * Every definition an entity pulls in, transitively.
 *
 * Transitive in two directions: `metadata` reaches `status` inside common, and
 * `loadTarget` reaches `equipmentRef` across libraries. Provenance is tracked so
 * a `#/$defs/x` inside a copied definition resolves against the library it came
 * from, not against the entity doing the copying.
 */
function collectRequiredDefs(schema, label) {
  const required = new Map(); // name -> { def, from }
  const queue = [];

  walk(schema, (node) => {
    const ref = parseExternalRef(node.$ref);
    if (ref) queue.push(ref);
  });

  while (queue.length) {
    const { id, name } = queue.pop();
    const library = libraries.get(id);
    if (!library) {
      throw new Error(
        `${label} references ${id}, which is not a known library.\n` +
          `  Known: ${[...libraries.keys()].join(', ') || 'none'}\n` +
          '  If it is another entity, move it earlier in ENTITIES — the list is dependency-ordered.'
      );
    }

    const def = library[name];
    if (!def) throw new Error(`${id} has no $defs/${name} (needed by ${label})`);

    const seen = required.get(name);
    if (seen) {
      // The same definition legitimately arrives by two routes: workout takes
      // `equipmentRef` straight from common, and again inside `loadTarget`,
      // which already had it flattened in. Identical content is that, and is
      // fine. Different content under one name is a real collision — the two
      // would overwrite each other and whichever lost would be silently wrong.
      if (seen.from !== id && JSON.stringify(seen.def) !== JSON.stringify(def)) {
        throw new Error(
          `${label}: "${name}" is defined differently by ${seen.from} and ${id}. ` +
            'Two libraries cannot contribute different definitions under one name.'
        );
      }
      continue;
    }
    required.set(name, { def, from: id });

    walk(def, (node) => {
      if (typeof node.$ref === 'string' && node.$ref.startsWith('#/$defs/')) {
        // A local ref inside a copied definition belongs to its own library.
        queue.push({ id, name: node.$ref.slice('#/$defs/'.length) });
      } else {
        const ref = parseExternalRef(node.$ref);
        if (ref) queue.push(ref);
      }
    });
  }

  return required;
}

function assertSelfContained(schema, label) {
  const offenders = [];
  walk(schema, (node) => {
    if (typeof node.$ref === 'string' && !node.$ref.startsWith('#/$defs/')) {
      offenders.push(node.$ref);
    }
  });
  if (offenders.length) {
    throw new Error(
      `${label} is not self-contained — refs must be #/$defs/<name>:\n  ${[...new Set(offenders)].join('\n  ')}`
    );
  }
}

/**
 * A published schema's `$id` must be the URL its path resolves to, or an
 * implementer who fetches the URL gets a document claiming to be something else.
 */
function assertIdMatchesPath(schema, entityPath) {
  const expected = `https://spec.vitness.me/schemas/${entityPath}`;
  if (schema.$id !== expected) {
    throw new Error(
      `${entityPath}: $id is "${schema.$id}" but its published URL is "${expected}"`
    );
  }
}

async function build(entity) {
  const schema = await readJson(join(SRC, entity.path));
  assertIdMatchesPath(schema, entity.path);
  const required = collectRequiredDefs(schema, entity.path);

  const defs = { ...(schema.$defs ?? {}) };
  for (const [name, { def, from }] of required) {
    if (name in defs) {
      throw new Error(`${entity.path}: local $defs/${name} collides with ${from}`);
    }
    defs[name] = structuredClone(def);
  }

  walk(schema, (node) => {
    const ref = parseExternalRef(node.$ref);
    if (ref) node.$ref = `#/$defs/${ref.name}`;
  });

  if (Object.keys(defs).length) {
    schema.$defs = Object.fromEntries(Object.keys(defs).sort().map((k) => [k, defs[k]]));
  } else {
    delete schema.$defs;
  }

  assertSelfContained(schema, `specification/schemas/${entity.path}`);

  // Publish this entity as a library so later entities can compose it.
  libraries.set(schema.$id, schema.$defs ?? {});

  return `${JSON.stringify(schema, null, 2)}\n`;
}

/**
 * The generated barrel for a bundled release. Written from the same run that
 * writes the published schemas, so the transformer's offline copies cannot
 * silently fall behind the URLs they stand in for — a stale bundle rejects data
 * the live schema accepts, which is worse than no bundle at all.
 */
function renderBundleIndex(release, entities) {
  const ident = (name) =>
    name.replace(/-(.)/g, (_, c) => c.toUpperCase()) + 'Schema';

  const imports = entities
    .map((e) => `import ${ident(e.name)} from './${e.name}.schema.json' assert { type: 'json' };`)
    .join('\n');
  const map = entities
    .map((e) => `  ${/^[a-z][a-zA-Z]*$/.test(e.name) ? e.name : `'${e.name}'`}: ${ident(e.name)},`)
    .join('\n');
  const versions = entities
    .map((e) => `  ${/^[a-z][a-zA-Z]*$/.test(e.name) ? e.name : `'${e.name}'`}: '${e.path.match(/\/v([^/]+)\//)[1]}',`)
    .join('\n');

  return `/**
 * Bundled FDS schemas v${release}
 *
 * GENERATED by scripts/build-schemas.mjs — do not edit.
 * Run \`npm run build:schemas\` from the repository root.
 *
 * These are byte-identical copies of the published schemas, bundled so the
 * transformer can validate without a network round trip.
 */

${imports}

/**
 * Entity versions this release is composed of. Entities version independently,
 * so a release names a *set* of entity versions rather than one shared segment.
 */
export const entityVersions = {
${versions}
} as const;

export default {
${map}
};

export {
${entities.map((e) => `  ${ident(e.name)},`).join('\n')}
};
`;
}

// ── integrity ────────────────────────────────────────────────────────────────
//
// A published URL is a contract. Once an entity version is released, its bytes
// must never change — a consumer that fetched it yesterday and again today must
// get the same document. `frozen: true` makes the build refuse to alter it; the
// only legitimate way to change a frozen schema is to publish a new version.
//
// New entries are recorded unfrozen so a schema can be iterated on before it
// ships. Flipping the flag is a one-line, reviewable diff.

const INTEGRITY_COMMENT =
  'Generated by scripts/build-schemas.mjs. A frozen entry may never change ' +
  'content — publish a new version instead. Unfreezing is a deliberate, ' +
  'reviewable edit to this file.';

async function readIntegrity() {
  try {
    return await readJson(INTEGRITY);
  } catch {
    return { $comment: INTEGRITY_COMMENT, schemas: {} };
  }
}

const renderIntegrity = (schemas) =>
  `${JSON.stringify(
    {
      $comment: INTEGRITY_COMMENT,
      schemas: Object.fromEntries(Object.keys(schemas).sort().map((k) => [k, schemas[k]])),
    },
    null,
    2
  )}\n`;


// ── run ──────────────────────────────────────────────────────────────────────

const check = process.argv.includes('--check');
libraries.set(`${SCHEMA_BASE}${COMMON_REL}`, (await readJson(join(SRC, COMMON_REL))).$defs);
const integrity = await readIntegrity();
const recorded = integrity.schemas ?? {};
const problems = [];

const rendered = new Map();
for (const entity of ENTITIES) {
  rendered.set(entity.name, await build(entity));
}

/**
 * Every file this run owns.
 *
 * `key` marks a *published* schema — the ones the integrity manifest tracks; the
 * bundled copies inherit their fate. `content: null` means the file is tracked
 * but not rendered (see UNGENERATED): it is hashed and freezable, never rewritten.
 */
const bundleDir = join(BUNDLED, `v${BUNDLE_RELEASE}`);
const artifacts = [
  ...ENTITIES.map((e) => ({
    key: e.path,
    path: join(OUT, e.path),
    content: rendered.get(e.name),
    note: 'published file does not match its authoring source',
  })),
  ...UNGENERATED.map((rel) => ({
    key: rel,
    path: join(OUT, rel),
    content: null,
  })),
  ...BUNDLED_ENTITIES.map((e) => ({
    path: join(bundleDir, `${e.name}.schema.json`),
    content: rendered.get(e.name),
    note: 'bundled copy does not match the published schema',
  })),
  {
    path: join(bundleDir, 'index.ts'),
    content: renderBundleIndex(BUNDLE_RELEASE, BUNDLED_ENTITIES),
    note: 'bundled barrel does not match the entity set',
  },
];

/**
 * Derive the tracked set from what is actually on disk, not from ENTITIES.
 *
 * A manifest built only from the entity list can only describe what someone
 * remembered to list — a schema published without being registered would be
 * unhashed, unfrozen and invisible, which is exactly how mapping.schema.json
 * went untracked. Every published schema must be generated or declared.
 */
{
  const declared = new Set([...ENTITIES.map((e) => e.path), ...UNGENERATED]);
  for (const rel of await publishedSchemaFiles()) {
    if (declared.has(rel)) continue;
    problems.push(
      `UNTRACKED  ${rel} — published but neither generated nor declared.\n` +
        `             Add it to ENTITIES (generated from schema-sources) or to ` +
        `UNGENERATED (served as-is) in ${relative(ROOT, fileURLToPath(import.meta.url))}.`
    );
  }
}

// Phase 1 — decide. Nothing is written until every artifact passes, so a frozen
// violation cannot leave the published tree and the bundle half-updated.
for (const artifact of artifacts) {
  const label = relative(ROOT, artifact.path);
  const current = await readFile(artifact.path, 'utf8').catch(() => null);

  // A generated file legitimately does not exist on a first build. A tracked but
  // ungenerated one cannot be conjured, so its absence is always a problem.
  if (current === null) {
    if (check || artifact.content === null) {
      problems.push(
        `MISSING    ${label}` +
          (artifact.content === null ? ' — declared as ungenerated but not present' : '')
      );
      continue;
    }
  }

  if (check) {
    if (artifact.content === null) console.log(`checked  ${label} (tracked, not generated)`);
    else if (current !== artifact.content) problems.push(`DRIFT      ${label} — ${artifact.note}`);
    else console.log(`checked  ${label}`);
  }

  if (!artifact.key) continue;
  const entry = recorded[artifact.key];

  // What this run considers authoritative: the render for generated schemas,
  // the file itself for the ones served as-is.
  const authoritative = artifact.content ?? current;

  if (check) {
    // Hash the file on disk, not the render: a hand-edit to a published schema
    // must fail here even when the render happens to agree with it.
    if (!entry) {
      problems.push(`UNRECORDED ${artifact.key} — absent from ${relative(ROOT, INTEGRITY)}`);
    } else if (sha256(current) !== entry.sha256) {
      problems.push(
        `INTEGRITY  ${artifact.key} — sha256 ${sha256(current).slice(0, 12)}… does not match ` +
          `recorded ${entry.sha256.slice(0, 12)}…${entry.frozen ? ' (frozen)' : ''}`
      );
    }
  } else if (entry?.frozen && entry.sha256 !== sha256(authoritative)) {
    problems.push(
      `FROZEN     ${artifact.key} — content changed but this version is frozen.\n` +
        `             Publish a new version directory, or unfreeze deliberately in ` +
        `${relative(ROOT, INTEGRITY)}.`
    );
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  if (check) {
    console.error(
      '\nRun `npm run build:schemas` and commit the result.\n' +
        'Never edit specification/schemas/ or src/schemas/bundled/ by hand — ' +
        'edit specification/schema-sources/.'
    );
  }
  process.exit(1);
}

if (check) {
  console.log('\nPublished schemas, integrity manifest and transformer bundle all match their sources.');
  process.exit(0);
}

// Phase 2 — write.
for (const artifact of artifacts) {
  const label = relative(ROOT, artifact.path);

  // Ungenerated schemas are tracked, not produced: hash what is there.
  if (artifact.content === null) {
    recorded[artifact.key] = {
      sha256: sha256(await readFile(artifact.path, 'utf8')),
      frozen: recorded[artifact.key]?.frozen ?? false,
    };
    console.log(`tracked  ${label}`);
    continue;
  }

  await mkdir(dirname(artifact.path), { recursive: true });
  await writeFile(artifact.path, artifact.content);
  if (artifact.key) {
    recorded[artifact.key] = {
      sha256: sha256(artifact.content),
      frozen: recorded[artifact.key]?.frozen ?? false,
    };
  }
  console.log(`built    ${label}`);
}

// Drop entries for schemas that are no longer published — a superseded version
// leaves the tree, so its hash should leave the manifest with it.
const tracked = new Set([...ENTITIES.map((e) => e.path), ...UNGENERATED]);
for (const key of Object.keys(recorded)) {
  if (!tracked.has(key)) delete recorded[key];
}
await writeFile(INTEGRITY, renderIntegrity(recorded));
console.log(`built    ${relative(ROOT, INTEGRITY)}`);
