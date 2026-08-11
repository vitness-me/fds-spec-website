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
 * Everything comes out of one run and one traversal of the published tree, so no
 * two of them can disagree about what is published, at what version, or with
 * what bytes:
 *   1. specification/schemas/                  the published schemas
 *   2. specification/schemas/.integrity.json   hash + freeze state per schema
 *   3. specification/releases.json             the release manifest — every
 *                                              version fact, in one document
 *   4. packages/fds-transformer/.../bundled/   the transformer's offline copies
 *   5. packages/fds-transformer/.../releases.generated.ts
 *                                              the release map that package ships
 *
 * Usage:
 *   node scripts/build-schemas.mjs           write all of them
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
 *
 * `kind` defaults to `entity` — something a provider can export and a consumer
 * can validate a document against. `library` is a bag of definitions with a root
 * that validates nothing.
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
  //
  // `kind` states that once. The bundle list, the release manifest and the
  // transformer's entity map all read it, so "is not an entity" and "is not
  // bundled" cannot come apart — which they could while the only marker here
  // was a `bundled: false` flag that said nothing about what the schema is.
  { name: 'prescription', kind: 'library', path: 'prescription/v1.0.0/prescription.schema.json' },
  // After prescription: workout composes its definitions, and a library must be
  // built before anything that references it.
  { name: 'workout', path: 'workout/v1.1.0/workout.schema.json' },
  // After workout: program references it by workoutRef and composes RFC-006
  // progression rules.
  { name: 'program', path: 'program/v1.0.0/program.schema.json' },
];

/** What a published schema is. Anything unmarked is an entity. */
const kindOf = (declaration) => declaration.kind ?? 'entity';

/**
 * Entities the transformer carries an offline copy of.
 *
 * A library is never one: nothing validates against its root, so the loader
 * would never ask for it.
 */
const BUNDLED_ENTITIES = ENTITIES.filter((entity) => kindOf(entity) === 'entity');

/**
 * The current FDS release — the newest one published, the one the transformer
 * bundles, and the directory it bundles it under.
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
const CURRENT_RELEASE = '1.4.0';

/**
 * Published schemas that are served but not generated from an authoring source.
 *
 * `transformer/v1.0.0/mapping.schema.json` describes the transformer's mapping
 * configuration, not an FDS entity: it has no `schema-sources` counterpart and
 * shares no `common` definitions, so there is nothing to flatten. It is still
 * served from spec.vitness.me, so it is still hashed and freezable — it is only
 * exempt from being *rendered*, not from being *tracked*.
 *
 * `workout/v1.0.0/workout.schema.json` is a *superseded* version. Its authoring
 * source is gone — 1.1.0 replaced it — but the published bytes stay, because a
 * frozen URL that disappears is worse than one that changes: transformer
 * releases 1.2.0 and 1.3.0 both declare workout at 1.0.0, and deleting it would
 * leave two shipped releases pointing at nothing. It is served, hashed and
 * frozen; it is simply never rendered again.
 *
 * Each entry carries the same `name` and `kind` a generated one does, because
 * the release manifest has to describe these too and inferring either from a
 * file path is how a tooling schema ends up listed as an entity a provider can
 * export.
 *
 * Adding a file here is a deliberate, reviewable act. That is the point: the
 * integrity manifest is derived from what is actually published, so nothing can
 * reach the published tree without appearing in one of these two lists.
 */
const UNGENERATED = [
  { name: 'mapping', kind: 'tooling', path: 'transformer/v1.0.0/mapping.schema.json' },
  { name: 'workout', kind: 'entity', path: 'workout/v1.0.0/workout.schema.json' },
];

/**
 * What each FDS release names.
 *
 * A release is a *set* of schema versions, not a version every schema shares —
 * see `specification/discovery.md`. Release 1.4.0 serves exercise, equipment and
 * workout at 1.1.0 while muscle, muscle-category, body-atlas, prescription and
 * program stay at 1.0.0. There is no `muscle/v1.4.0/` and there never will be
 * unless muscle itself changes.
 *
 * This is history, so it is declared rather than derived: nothing on disk
 * remembers what 1.2.0 contained. The newest release is the exception that keeps
 * the rest honest — it must name exactly the current version of every schema in
 * ENTITIES, and the build fails if it does not. That is what stops this list
 * drifting from the tree it describes when a schema moves.
 *
 * The transformer mapping schema is absent on purpose. It configures a tool; it
 * is versioned on its own and no FDS release names it.
 */
const RELEASES = {
  '1.0.0': {
    exercise: '1.0.0',
    equipment: '1.0.0',
    muscle: '1.0.0',
    'muscle-category': '1.0.0',
    'body-atlas': '1.0.0',
  },
  // exercise and equipment gain `loading`; the other three did not change and
  // keep their 1.0.0 URLs.
  '1.1.0': {
    exercise: '1.1.0',
    equipment: '1.1.0',
    muscle: '1.0.0',
    'muscle-category': '1.0.0',
    'body-atlas': '1.0.0',
  },
  // Adds the RFC-006 prescription library and the RFC-007 workout entity. No
  // existing schema moved: gaining one is still a new set.
  '1.2.0': {
    exercise: '1.1.0',
    equipment: '1.1.0',
    muscle: '1.0.0',
    'muscle-category': '1.0.0',
    'body-atlas': '1.0.0',
    prescription: '1.0.0',
    workout: '1.0.0',
  },
  // Adds the RFC-008 program entity. Again nothing existing moved.
  '1.3.0': {
    exercise: '1.1.0',
    equipment: '1.1.0',
    muscle: '1.0.0',
    'muscle-category': '1.0.0',
    'body-atlas': '1.0.0',
    prescription: '1.0.0',
    workout: '1.0.0',
    program: '1.0.0',
  },
  // Moves workout to 1.1.0 — per-set intensity zones and machine settings. The
  // first release where a schema this batch introduced has itself moved, which
  // makes it the first proof the set is doing real work: 1.2.0 and 1.3.0 keep
  // naming workout 1.0.0, and that URL is still served.
  '1.4.0': {
    exercise: '1.1.0',
    equipment: '1.1.0',
    muscle: '1.0.0',
    'muscle-category': '1.0.0',
    'body-atlas': '1.0.0',
    prescription: '1.0.0',
    workout: '1.1.0',
    program: '1.0.0',
  },
};

/**
 * Versions a release names that are no longer served.
 *
 * exercise and equipment 1.0.0 were removed rather than frozen in place when
 * 1.1.0 replaced them — they had no external consumers at the time. Release
 * 1.0.0 still names them, so the manifest has to say what became of them: named
 * by a release, not fetchable, no bytes to hash.
 *
 * This is the exception. `workout/v1.0.0` is the rule — a superseded version
 * stays published, because a frozen URL that disappears is worse than one that
 * changes. Nothing belongs here that has not actually been unpublished, and the
 * build rejects an entry that is still on disk.
 */
const WITHDRAWN = {
  exercise: ['1.0.0'],
  equipment: ['1.0.0'],
};

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
 * The version a published path carries.
 *
 * The path is where the version actually lives — it is the URL segment an
 * implementer types — so it is what the manifest reports, rather than a second
 * copy of the number kept beside it.
 */
function versionFromPath(path) {
  const match = /\/v(\d+\.\d+\.\d+)\//.exec(`/${path}`);
  if (!match) throw new Error(`no /vX.Y.Z/ segment in published path: ${path}`);
  return match[1];
}

/** Ascending semver order, for the two-part version numbers this project uses. */
function compareVersions(a, b) {
  const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
  const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
  return aMajor - bMajor || aMinor - bMinor || aPatch - bPatch;
}

/** An object with its keys in a stated order, so generated output is stable. */
const ordered = (object, compare) =>
  Object.fromEntries(Object.keys(object).sort(compare).map((k) => [k, object[k]]));

/** A schema name as a JS object key — quoted only when it has to be. */
const key = (name) => (/^[a-z][a-zA-Z]*$/.test(name) ? name : `'${name}'`);

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
    .map((e) => `  ${key(e.name)}: ${ident(e.name)},`)
    .join('\n');
  const versions = entities
    .map((e) => `  ${key(e.name)}: '${versionFromPath(e.path)}',`)
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
      schemas: ordered(schemas),
    },
    null,
    2
  )}\n`;


// ── release manifest ─────────────────────────────────────────────────────────
//
// Every version fact this project has, in one document, so that nothing else
// has to keep a copy: which schemas exist, which versions of each are published,
// which of those is current and which is merely still served, what each release
// names, and which release is current.
//
// It is built from the same list the integrity manifest is written from. Two
// independent walks of the published tree can disagree — one of them has to be
// wrong and neither knows which — so there is only one walk.

const MANIFEST = join(ROOT, 'specification/releases.json');
const TRANSFORMER_RELEASES = join(
  ROOT,
  'packages/fds-transformer/src/schemas/releases.generated.ts'
);

const MANIFEST_COMMENT =
  'Generated by scripts/build-schemas.mjs from the published schemas — do not ' +
  'edit by hand; run `npm run build:schemas`. A release names a *set* of schema ' +
  'versions, not a version they all share. status "current" is the version ' +
  'documentation and packages should point at; "superseded" is still published ' +
  'and still frozen, because an older release names it; "withdrawn" was named by ' +
  'a release and is no longer served, so it has no bytes to hash. kind separates ' +
  'an entity a provider can export from a definition library whose root ' +
  'validates nothing (prescription) and from tooling configuration that is not ' +
  'part of any release (the transformer mapping schema).';

/**
 * The manifest, and the problems found building it.
 *
 * `published` is the single traversal: one record per published schema, already
 * carrying the hash and freeze state the integrity manifest is written from.
 */
function buildManifest(published) {
  const problems = [];
  const schemas = {};

  const entryFor = (name, kind) => {
    const entry = (schemas[name] ??= { kind, current: null, versions: {} });
    if (entry.kind !== kind) {
      problems.push(`CONFLICT   "${name}" is declared as both ${entry.kind} and ${kind}`);
    }
    return entry;
  };

  for (const schema of published) {
    entryFor(schema.name, schema.kind).versions[schema.version] = {
      // Provisional. Which version is current is decided once every version of
      // that schema is in hand, below.
      status: 'superseded',
      path: schema.path,
      $id: schema.$id,
      frozen: schema.frozen,
      sha256: schema.sha256,
    };
  }

  for (const [name, versions] of Object.entries(WITHDRAWN)) {
    const entry = schemas[name];
    if (!entry) {
      problems.push(`WITHDRAWN  "${name}" is recorded as withdrawn but nothing publishes it`);
      continue;
    }
    for (const version of versions) {
      if (entry.versions[version]) {
        problems.push(
          `WITHDRAWN  ${name} ${version} is recorded as withdrawn but is still published`
        );
        continue;
      }
      entry.versions[version] = { status: 'withdrawn' };
    }
  }

  for (const [name, entry] of Object.entries(schemas)) {
    // The current version is the greatest one still served. Derived rather than
    // declared, so a superseded version that is published later than the current
    // one — the shape of the workout 1.0.0 entry — cannot be mistaken for it.
    const served = Object.keys(entry.versions)
      .filter((version) => entry.versions[version].status !== 'withdrawn')
      .sort(compareVersions);
    entry.current = served.at(-1);
    entry.versions[entry.current].status = 'current';
    entry.versions = ordered(entry.versions, compareVersions);
  }

  // A generated schema's version is the one ENTITIES points the build at. If
  // that is not the greatest published, something newer is being served that
  // nothing regenerates — which is how a superseded copy quietly becomes the
  // one implementers fetch.
  for (const declaration of ENTITIES) {
    const declared = versionFromPath(declaration.path);
    const current = schemas[declaration.name]?.current;
    if (current !== declared) {
      problems.push(
        `CURRENT    ${declaration.name} is built at ${declared} but ${current} is published — ` +
          'the greatest published version must be the one this build generates.'
      );
    }
  }

  const releases = {};
  for (const release of Object.keys(RELEASES).sort(compareVersions)) {
    const named = RELEASES[release];
    const entities = {};
    const libraries = {};

    // Declaration order, not alphabetical. It is the order ENTITIES builds in,
    // and the transformer walks the map to decide what to fetch — sorting here
    // would silently reorder the requests a consumer makes.
    for (const [name, version] of Object.entries(named)) {
      const entry = schemas[name];
      if (!entry) {
        problems.push(`RELEASE    ${release} names "${name}", which is not a published schema`);
        continue;
      }
      if (!entry.versions[version]) {
        problems.push(
          `RELEASE    ${release} names ${name} ${version}, which is neither published nor ` +
            'recorded as withdrawn. Publish it, or record it in WITHDRAWN.'
        );
        continue;
      }
      if (entry.kind === 'tooling') {
        problems.push(
          `RELEASE    ${release} names "${name}", which is tooling configuration. ` +
            'A release names entities and the libraries they compose, nothing else.'
        );
        continue;
      }
      (entry.kind === 'library' ? libraries : entities)[name] = version;
    }

    releases[release] = { entities, libraries };
  }

  // The current release is the one nobody remembers to update, so it is the one
  // that is checked against the tree: it must name exactly what this build
  // publishes, at the versions it publishes them.
  const expected = Object.fromEntries(
    ENTITIES.map((entity) => [entity.name, versionFromPath(entity.path)])
  );
  const newest = Object.keys(RELEASES).sort(compareVersions).at(-1);
  if (newest !== CURRENT_RELEASE) {
    problems.push(
      `RELEASE    ${newest} is the newest release declared but ${CURRENT_RELEASE} is named as ` +
        'current. A manifest whose currentRelease is not its newest release describes ' +
        'a tree nobody has.'
    );
  }

  const named = RELEASES[CURRENT_RELEASE];
  if (!named) {
    problems.push(
      `RELEASE    ${CURRENT_RELEASE} is the current release but RELEASES has no entry for it`
    );
  } else if (JSON.stringify(ordered(named)) !== JSON.stringify(ordered(expected))) {
    problems.push(
      `RELEASE    ${CURRENT_RELEASE} does not name what this build publishes.\n` +
        `             declared ${JSON.stringify(ordered(named))}\n` +
        `             built    ${JSON.stringify(ordered(expected))}`
    );
  }

  return {
    manifest: {
      $comment: MANIFEST_COMMENT,
      currentRelease: CURRENT_RELEASE,
      releases,
      schemas: ordered(schemas),
    },
    problems,
  };
}

const renderManifest = (manifest) => `${JSON.stringify(manifest, null, 2)}\n`;

/**
 * The transformer's copy of the release map, generated from the manifest.
 *
 * The package cannot import `specification/releases.json` — it is published to
 * npm and the manifest is not in the package — so it carries the facts in
 * source. Carrying them by hand is what this whole file exists to stop, so they
 * are written here instead and `npm run check:schemas` fails on any divergence.
 *
 * Libraries are left out. `prescription` is not an entity: nothing validates
 * against its root, the transformer never fetches it, and listing it would make
 * it representable as something a provider exports.
 */
function renderTransformerReleases(manifest) {
  const releases = Object.entries(manifest.releases)
    .map(([release, { entities }]) => {
      const lines = Object.entries(entities)
        .map(([name, version]) => `    ${key(name)}: '${version}',`)
        .join('\n');
      return `  '${release}': {\n${lines}\n  },`;
    })
    .join('\n');

  return `/**
 * FDS releases and the entity versions each one names.
 *
 * GENERATED by scripts/build-schemas.mjs from specification/releases.json —
 * do not edit. Run \`npm run build:schemas\` from the repository root.
 *
 * A release is a *set* of entity versions rather than one path segment they all
 * share: 1.4.0 serves exercise, equipment and workout at 1.1.0 while muscle,
 * muscle-category, body-atlas and program stay at 1.0.0. Expanding a release
 * name into a path segment requests URLs that were never published.
 *
 * Definition libraries are absent by construction. \`prescription\` publishes
 * alongside these entities but validates nothing, so there is no document to
 * fetch it for.
 */

/** The newest published release. */
export const CURRENT_RELEASE = '${manifest.currentRelease}';

/** Entity schema versions per release. */
export const RELEASE_ENTITY_VERSIONS: Record<string, Record<string, string>> = {
${releases}
};
`;
}


// ── run ──────────────────────────────────────────────────────────────────────

const check = process.argv.includes('--check');
libraries.set(`${SCHEMA_BASE}${COMMON_REL}`, (await readJson(join(SRC, COMMON_REL))).$defs);
const integrity = await readIntegrity();
const recorded = integrity.schemas ?? {};
const problems = [];

function report() {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  if (check) {
    console.error(
      '\nRun `npm run build:schemas` and commit the result.\n' +
        'Never edit specification/schemas/, specification/releases.json or ' +
        'src/schemas/bundled/ by hand — edit specification/schema-sources/.'
    );
  }
  process.exit(1);
}

const rendered = new Map();
for (const entity of ENTITIES) {
  rendered.set(entity.name, await build(entity));
}

/**
 * Every published schema, generated and served-as-is alike.
 *
 * This is the single traversal. The integrity manifest, the release manifest and
 * the transformer's release map are all written from this list and from nothing
 * else, so none of them can describe a tree the others do not.
 *
 * `content: null` means the file is tracked but not rendered (see UNGENERATED):
 * hashed and freezable, never rewritten.
 */
const published = [
  ...ENTITIES.map((entity) => ({
    name: entity.name,
    kind: kindOf(entity),
    path: entity.path,
    content: rendered.get(entity.name),
    note: 'published file does not match its authoring source',
  })),
  ...UNGENERATED.map((schema) => ({
    name: schema.name,
    kind: schema.kind,
    path: schema.path,
    content: null,
  })),
];

for (const schema of published) {
  schema.onDisk = await readFile(join(OUT, schema.path), 'utf8').catch(() => null);

  // What this run considers authoritative: the render for generated schemas,
  // the file itself for the ones served as-is.
  const authoritative = schema.content ?? schema.onDisk;
  if (authoritative === null) {
    problems.push(
      `MISSING    specification/schemas/${schema.path} — declared as ungenerated but not present`
    );
    continue;
  }

  schema.version = versionFromPath(schema.path);
  schema.$id = JSON.parse(authoritative).$id;
  schema.sha256 = sha256(authoritative);
  schema.frozen = recorded[schema.path]?.frozen ?? false;

  // A `$id` is a promise that the document can be fetched from that address.
  // `build()` already holds generated schemas to it; the ones served as-is are
  // exactly the ones nothing regenerates, so nothing else would notice.
  if (schema.$id !== `${SCHEMA_BASE}${schema.path}`) {
    problems.push(
      `IDENTITY   ${schema.path} — $id is "${schema.$id ?? '(absent)'}" but its ` +
        `published URL is "${SCHEMA_BASE}${schema.path}"`
    );
  }
}

// Nothing downstream can describe a tree it was unable to read.
if (problems.length) report();

/**
 * Derive the tracked set from what is actually on disk, not from ENTITIES.
 *
 * A manifest built only from the entity list can only describe what someone
 * remembered to list — a schema published without being registered would be
 * unhashed, unfrozen and invisible, which is exactly how mapping.schema.json
 * went untracked. Every published schema must be generated or declared.
 */
{
  const declared = new Set(published.map((schema) => schema.path));
  for (const rel of await publishedSchemaFiles()) {
    if (declared.has(rel)) continue;
    problems.push(
      `UNTRACKED  ${rel} — published but neither generated nor declared.\n` +
        `             Add it to ENTITIES (generated from schema-sources) or to ` +
        `UNGENERATED (served as-is) in ${relative(ROOT, fileURLToPath(import.meta.url))}.`
    );
  }
}

const { manifest, problems: manifestProblems } = buildManifest(published);
problems.push(...manifestProblems);

/** Every file this run owns. */
const bundleDir = join(BUNDLED, `v${CURRENT_RELEASE}`);
const artifacts = [
  ...published.map((schema) => ({
    path: join(OUT, schema.path),
    content: schema.content,
    note: schema.note,
  })),
  ...BUNDLED_ENTITIES.map((e) => ({
    path: join(bundleDir, `${e.name}.schema.json`),
    content: rendered.get(e.name),
    note: 'bundled copy does not match the published schema',
  })),
  {
    path: join(bundleDir, 'index.ts'),
    content: renderBundleIndex(CURRENT_RELEASE, BUNDLED_ENTITIES),
    note: 'bundled barrel does not match the entity set',
  },
  {
    // Diff-checked like everything else, not merely consulted. Its hashes are an
    // output of this run, so a hand-edit to one is a claim about the tree that
    // nothing else would contradict. Freeze flags are the input here, and they
    // survive: they are read back in before the render.
    path: INTEGRITY,
    content: renderIntegrity(
      Object.fromEntries(
        published.map((schema) => [schema.path, { sha256: schema.sha256, frozen: schema.frozen }])
      )
    ),
    note: 'the integrity manifest does not match the published tree',
  },
  {
    path: MANIFEST,
    content: renderManifest(manifest),
    note: 'the release manifest does not match the published tree',
  },
  {
    path: TRANSFORMER_RELEASES,
    content: renderTransformerReleases(manifest),
    note: "the transformer's release map does not match the manifest",
  },
];

// Phase 1 — decide. Nothing is written until every artifact passes, so a frozen
// violation cannot leave the published tree and the bundle half-updated.
for (const artifact of artifacts) {
  const label = relative(ROOT, artifact.path);

  // Tracked but not rendered: there is nothing to compare it against.
  if (artifact.content === null) {
    if (check) console.log(`checked  ${label} (tracked, not generated)`);
    continue;
  }

  if (!check) continue;

  // A generated file legitimately does not exist on a first build, but a --check
  // run is asking whether the committed tree is up to date, and an absent file
  // is not.
  const current = await readFile(artifact.path, 'utf8').catch(() => null);
  if (current === null) problems.push(`MISSING    ${label}`);
  else if (current !== artifact.content) problems.push(`DRIFT      ${label} — ${artifact.note}`);
  else console.log(`checked  ${label}`);
}

for (const schema of published) {
  const entry = recorded[schema.path];

  if (check) {
    // Absent from the tree entirely — the artifacts loop has already said so,
    // and there are no bytes to hash.
    if (schema.onDisk === null) continue;

    // Hash the file on disk, not the render: a hand-edit to a published schema
    // must fail here even when the render happens to agree with it.
    const actual = sha256(schema.onDisk);
    if (!entry) {
      problems.push(`UNRECORDED ${schema.path} — absent from ${relative(ROOT, INTEGRITY)}`);
    } else if (actual !== entry.sha256) {
      problems.push(
        `INTEGRITY  ${schema.path} — sha256 ${actual.slice(0, 12)}… does not match ` +
          `recorded ${entry.sha256.slice(0, 12)}…${entry.frozen ? ' (frozen)' : ''}`
      );
    }
  } else if (entry?.frozen && entry.sha256 !== schema.sha256) {
    problems.push(
      `FROZEN     ${schema.path} — content changed but this version is frozen.\n` +
        `             Publish a new version directory, or unfreeze deliberately in ` +
        `${relative(ROOT, INTEGRITY)}.`
    );
  }
}

if (problems.length) report();

if (check) {
  console.log(
    '\nPublished schemas, integrity manifest, release manifest and transformer ' +
      'bundle all match their sources.'
  );
  process.exit(0);
}

// Phase 2 — write.
for (const artifact of artifacts) {
  const label = relative(ROOT, artifact.path);

  // Ungenerated schemas are tracked, not produced. Their hash was taken above.
  if (artifact.content === null) {
    console.log(`tracked  ${label}`);
    continue;
  }

  await mkdir(dirname(artifact.path), { recursive: true });
  await writeFile(artifact.path, artifact.content);
  console.log(`built    ${label}`);
}
