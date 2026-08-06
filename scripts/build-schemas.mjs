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
];

/**
 * The FDS release the entity set above constitutes, and the directory the
 * transformer bundles it under.
 *
 * `bundled/v1.0.0/` is not generated: its exercise and equipment sources no
 * longer exist (D9 — 1.0.0 was superseded rather than frozen in place), so it is
 * a checked-in historical artifact kept for consumers pinned to 1.0.0.
 */
const BUNDLE_RELEASE = '1.1.0';

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

const COMMON_REL = 'common/v1.0.0/common.schema.json';
const COMMON_ID = `https://spec.vitness.me/schemas/${COMMON_REL}`;
const COMMON_REF = `${COMMON_ID}#/$defs/`;

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

const walk = (node, visit) => {
  if (Array.isArray(node)) return node.forEach((v) => walk(v, visit));
  if (!node || typeof node !== 'object') return;
  visit(node);
  Object.values(node).forEach((v) => walk(v, visit));
};

/**
 * Names pulled in from common, including transitive ones — `metadata` reaches
 * `status`, `metricRef` reaches `metricType` and `metricUnit`.
 */
function collectRequiredDefs(schema, commonDefs) {
  const required = new Set();
  const queue = [];

  walk(schema, (node) => {
    if (typeof node.$ref === 'string' && node.$ref.startsWith(COMMON_REF)) {
      queue.push(node.$ref.slice(COMMON_REF.length));
    }
  });

  while (queue.length) {
    const name = queue.pop();
    if (required.has(name)) continue;
    const def = commonDefs[name];
    if (!def) throw new Error(`common.schema.json has no $defs/${name}`);
    required.add(name);
    // definitions inside common reference their siblings as #/$defs/<name>
    walk(def, (node) => {
      if (typeof node.$ref === 'string' && node.$ref.startsWith('#/$defs/')) {
        queue.push(node.$ref.slice('#/$defs/'.length));
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

async function build(entity, commonDefs) {
  const schema = await readJson(join(SRC, entity.path));
  assertIdMatchesPath(schema, entity.path);
  const required = collectRequiredDefs(schema, commonDefs);

  const defs = { ...(schema.$defs ?? {}) };
  for (const name of required) {
    if (name in defs) {
      throw new Error(`${entity.path}: local $defs/${name} collides with common`);
    }
    defs[name] = structuredClone(commonDefs[name]);
  }

  walk(schema, (node) => {
    if (typeof node.$ref === 'string' && node.$ref.startsWith(COMMON_REF)) {
      node.$ref = `#/$defs/${node.$ref.slice(COMMON_REF.length)}`;
    }
  });

  if (Object.keys(defs).length) {
    schema.$defs = Object.fromEntries(Object.keys(defs).sort().map((k) => [k, defs[k]]));
  } else {
    delete schema.$defs;
  }

  assertSelfContained(schema, `specification/schemas/${entity.path}`);
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
const commonDefs = (await readJson(join(SRC, COMMON_REL))).$defs;
const integrity = await readIntegrity();
const recorded = integrity.schemas ?? {};
const problems = [];

const rendered = new Map();
for (const entity of ENTITIES) {
  rendered.set(entity.name, await build(entity, commonDefs));
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
  ...ENTITIES.map((e) => ({
    path: join(bundleDir, `${e.name}.schema.json`),
    content: rendered.get(e.name),
    note: 'bundled copy does not match the published schema',
  })),
  {
    path: join(bundleDir, 'index.ts'),
    content: renderBundleIndex(BUNDLE_RELEASE, ENTITIES),
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
