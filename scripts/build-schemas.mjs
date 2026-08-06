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
 * Usage:
 *   node scripts/build-schemas.mjs           write specification/schemas/
 *   node scripts/build-schemas.mjs --check   verify output matches sources (CI)
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'specification/schema-sources');
const OUT = join(ROOT, 'specification/schemas');

/** Entity schemas to publish. `common` is authoring-only and deliberately absent. */
const ENTITIES = [
  'exercises/v1.1.0/exercise.schema.json',
  'equipment/v1.1.0/equipment.schema.json',
  'muscle/v1.0.0/muscle.schema.json',
  'muscle/muscle-category/v1.0.0/muscle-category.schema.json',
  'atlas/v1.0.0/body-atlas.schema.json',
];

const COMMON_REL = 'common/v1.0.0/common.schema.json';
const COMMON_ID = `https://spec.vitness.me/schemas/${COMMON_REL}`;
const COMMON_REF = `${COMMON_ID}#/$defs/`;

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

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
  const schema = await readJson(join(SRC, entity));
  assertIdMatchesPath(schema, entity);
  const required = collectRequiredDefs(schema, commonDefs);

  const defs = { ...(schema.$defs ?? {}) };
  for (const name of required) {
    if (name in defs) {
      throw new Error(`${entity}: local $defs/${name} collides with common`);
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

  assertSelfContained(schema, `specification/schemas/${entity}`);
  return `${JSON.stringify(schema, null, 2)}\n`;
}

const check = process.argv.includes('--check');
const commonDefs = (await readJson(join(SRC, COMMON_REL))).$defs;
let drifted = 0;

for (const entity of ENTITIES) {
  const rendered = await build(entity, commonDefs);
  const outPath = join(OUT, entity);
  const label = relative(ROOT, outPath);

  if (check) {
    const current = await readFile(outPath, 'utf8').catch(() => null);
    if (current === rendered) {
      console.log(`ok     ${label}`);
    } else {
      drifted += 1;
      console.error(`DRIFT  ${label}`);
    }
  } else {
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, rendered);
    console.log(`built  ${label}`);
  }
}

if (check && drifted > 0) {
  console.error(
    `\n${drifted} published schema(s) do not match their authoring source.\n` +
      'Run `npm run build:schemas` and commit the result.\n' +
      'Never edit specification/schemas/ by hand — edit specification/schema-sources/.'
  );
  process.exit(1);
}

console.log(check ? '\nAll published schemas match their authoring sources.' : '');
