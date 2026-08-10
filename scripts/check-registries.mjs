#!/usr/bin/env node
/**
 * A recommended value is only recommended if it is written down somewhere.
 *
 * Several fields in FDS are deliberately open strings with a recommended
 * registry (D8): `exerciseType` carries no `enum` and no `examples` at all, so
 * the registry is the *only* place its vocabulary exists. That makes the
 * registry load-bearing, and something load-bearing that nothing checks drifts.
 *
 * Three ways it drifts, all checked here:
 *
 *   - A schema recommends a value in `examples` that the registry never lists,
 *     so two documents disagree about what the vocabulary is.
 *   - A published example uses a value in no registry, which is either a typo or
 *     a vocabulary item nobody wrote down.
 *   - A registry lists a value twice, or points at a schema field that no longer
 *     exists — the entry survives a rename that removed its subject.
 *
 * The registry may legitimately be a *superset* of what the schemas and examples
 * use. Recommending a value nothing has needed yet is the point of a registry.
 * The failure is the other direction.
 *
 *   node scripts/check-registries.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'specification/registries');

/**
 * Where each registry's vocabulary is actually used.
 *
 * `field` is the property name to collect from published examples. `schemaField`
 * is the property whose `examples` must be a subset of the registry — omitted
 * where the schema declares none, as `exerciseType` deliberately does.
 */
const REGISTRIES = [
  {
    file: 'exercise-type.registry.json',
    field: 'exerciseType',
    usedIn: ['exercises/v1.1.0'],
  },
  {
    file: 'workout-type.registry.json',
    field: 'workoutType',
    schemaField: {
      source: 'workout/v1.1.0/workout.schema.json',
      property: 'workoutType',
    },
    usedIn: ['workout/v1.1.0'],
  },
  {
    file: 'block-role.registry.json',
    field: 'role',
    schemaField: {
      source: 'workout/v1.1.0/workout.schema.json',
      property: 'role',
    },
    usedIn: ['workout/v1.1.0'],
  },
  {
    file: 'intensity-zone.registry.json',
    field: 'boundsRef',
    usedIn: ['workout/v1.1.0', 'prescription/v1.0.0', 'program/v1.0.0'],
  },
];

/** Systems a zone entry may claim, read from the schema rather than restated. */
async function zoneSystems() {
  const schema = JSON.parse(
    await readFile(
      join(ROOT, 'specification/schema-sources/prescription/v1.0.0/prescription.schema.json'),
      'utf8'
    )
  );
  return new Set(schema.$defs?.intensityZone?.properties?.system?.enum ?? []);
}

const walk = (node, visit) => {
  if (Array.isArray(node)) return node.forEach((v) => walk(v, visit));
  if (!node || typeof node !== 'object') return;
  visit(node);
  Object.values(node).forEach((v) => walk(v, visit));
};

/** Every string value of `field` appearing anywhere in a directory's examples. */
async function valuesUsedIn(dirs, field) {
  const used = new Map(); // value -> first file that used it
  for (const rel of dirs) {
    const dir = join(ROOT, 'specification/schemas', rel);
    const files = (await readdir(dir)).filter(
      (f) => f.endsWith('.json') && !f.endsWith('.schema.json') && !f.startsWith('invalid.')
    );
    for (const file of files) {
      const doc = JSON.parse(await readFile(join(dir, file), 'utf8'));
      walk(doc, (node) => {
        if (typeof node[field] === 'string' && !used.has(node[field])) {
          used.set(node[field], `${rel}/${file}`);
        }
      });
    }
  }
  return used;
}

/** The `examples` a schema declares for a named property. */
async function schemaExamplesFor({ source, property }) {
  const schema = JSON.parse(
    await readFile(join(ROOT, 'specification/schema-sources', source), 'utf8')
  );
  const values = new Set();
  walk(schema, (node) => {
    const declared = node.properties?.[property];
    if (declared && Array.isArray(declared.examples)) {
      for (const value of declared.examples) {
        if (typeof value === 'string') values.add(value);
      }
    }
  });
  return values;
}

const problems = [];
const systems = await zoneSystems();
const onDisk = (await readdir(DIR)).filter((f) => f.endsWith('.registry.json'));
let entryTotal = 0;

for (const registry of REGISTRIES) {
  const { file, field, schemaField, usedIn } = registry;
  const label = file.replace('.registry.json', '');

  const raw = await readFile(join(DIR, file), 'utf8').catch(() => null);
  if (raw === null) {
    problems.push(`${file} is missing.`);
    continue;
  }

  const doc = JSON.parse(raw);
  const values = new Set();
  const duplicates = [];
  for (const entry of doc.entries ?? []) {
    if (values.has(entry.value)) duplicates.push(entry.value);
    values.add(entry.value);
    if (!entry.label || !entry.description) {
      problems.push(`${label}: entry "${entry.value}" is missing a label or description.`);
    }
    // A zone entry claims a system, and the systems are a closed enum in the
    // schema. Reading them from there means the registry cannot invent one.
    if (entry.system !== undefined && !systems.has(entry.system)) {
      problems.push(
        `${label}: entry "${entry.value}" claims system "${entry.system}", ` +
          `which intensityZone.system does not allow (${[...systems].join(', ')}).`
      );
    }
  }
  entryTotal += values.size;

  if (duplicates.length) {
    problems.push(`${label}: duplicate entries — ${[...new Set(duplicates)].join(', ')}`);
  }

  // Every field a registry claims to govern must still exist. A rename that
  // removed the field would otherwise leave the registry describing nothing.
  for (const governed of doc.governs ?? []) {
    const source = await readFile(join(ROOT, governed.source), 'utf8').catch(() => null);
    if (source === null) {
      problems.push(`${label}: governs "${governed.source}", which does not exist.`);
      continue;
    }
    const property = governed.pointer.split('.').pop().replace(/\[\]$/, '');
    if (!JSON.parse(source) || !source.includes(`"${property}"`)) {
      problems.push(
        `${label}: governs "${governed.pointer}", but "${property}" does not appear in ${governed.source}.`
      );
    }
  }

  if (schemaField) {
    const declared = await schemaExamplesFor(schemaField);
    const missing = [...declared].filter((value) => !values.has(value)).sort();
    if (missing.length) {
      problems.push(
        `${label}: the schema recommends ${missing.length} value(s) the registry does not list:\n` +
          `    ${missing.join(', ')}\n` +
          '    Two documents recommending different vocabularies is worse than one.'
      );
    }
  }

  const used = await valuesUsedIn(usedIn, field);
  const unlisted = [...used.entries()].filter(([value]) => !values.has(value));
  if (unlisted.length) {
    problems.push(
      `${label}: ${unlisted.length} value(s) used by a published example are in no registry:\n` +
        unlisted.map(([value, where]) => `    "${value}" — ${where}`).join('\n') +
        '\n    Either a typo, or a vocabulary item nobody wrote down.'
    );
  }

  if (!problems.length || !problems.some((p) => p.startsWith(label))) {
    console.log(
      `  ok    ${label} — ${values.size} entries, ${used.size} used by examples`
    );
  }
}

const known = new Set(REGISTRIES.map((r) => r.file));
const untracked = onDisk.filter((f) => !known.has(f)).sort();
if (untracked.length) {
  problems.push(
    `${untracked.length} registry file(s) this check does not know about:\n` +
      untracked.map((f) => `    ${f}`).join('\n') +
      '\n    Add it to REGISTRIES, or it ships unchecked.'
  );
}

const readme = await readFile(join(DIR, 'README.md'), 'utf8').catch(() => null);
if (readme === null) {
  problems.push('specification/registries/README.md is missing.');
} else {
  const undocumented = onDisk.filter((f) => !readme.includes(f)).sort();
  if (undocumented.length) {
    problems.push(
      `README.md does not mention ${undocumented.length} registry file(s):\n` +
        undocumented.map((f) => `    ${f}`).join('\n')
    );
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `\nEvery recommended value is written down: ${REGISTRIES.length} registries, ${entryTotal} entries.`
);
