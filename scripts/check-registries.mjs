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
 * The muscle registry (RFC-010) has more structure than a flat vocabulary: its
 * groups roll up other entries, so it can also be wrong *internally*. A member
 * that names no entry, a cycle, a category the registry does not list or a
 * muscle `full-body` fails to reach are all checked. So is every muscle slug a
 * published example uses: it must be official or carry the private `x-<vendor>-`
 * prefix, and every muscle reference must carry one, because the slug is the
 * only portable key a reference has.
 *
 *   node scripts/check-registries.mjs
 *   node scripts/check-registries.mjs --self-test   the muscle rules fail on bad input
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'specification/registries');
const SELF_TEST = process.argv.includes('--self-test');

/** RFC-010 §4.2: a provider's own muscle, which can never collide with an official one. */
const PRIVATE_MUSCLE = /^x-[a-z0-9]+-[a-z0-9-]+$/;

/**
 * The slug form `canonical.slug` requires, read from the schema rather than
 * restated, so an official slug is always one a muscle record can carry.
 */
const MUSCLE_SLUG = new RegExp(
  JSON.parse(
    await readFile(
      join(ROOT, 'specification/schema-sources/common/v1.0.0/common.schema.json'),
      'utf8'
    )
  ).$defs.canonical.properties.slug.pattern
);

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
  {
    // A `slug` key appears on every entity, so a muscle slug is found by where
    // it sits rather than by its name: see muscleSlugsUsed below.
    file: 'muscle.registry.json',
    collect: () => muscleSlugsUsed(),
    validate: (doc) => muscleRegistryProblems(doc, MUSCLE_SLUG),
    privatePrefix: PRIVATE_MUSCLE,
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

/** Values a published example uses that the registry neither lists nor allows as private. */
const unlistedValues = (values, used, privatePrefix) =>
  [...used.entries()].filter(([value]) => !values.has(value) && !privatePrefix?.test(value));

/**
 * The muscle slugs one document uses, and the muscle references that carry none.
 *
 * A muscle reference is recognised by shape — `id` and `categoryId`, which
 * `muscleRef` requires — inside a `targets` list. A muscle record's own slug is
 * `canonical.slug`, read only from files known to hold muscle records, because
 * every entity has a `canonical.slug` and most of them are not muscles.
 */
function muscleSlugsIn(doc, where, isMuscleCatalog) {
  const slugs = [];
  const unslugged = [];
  walk(doc, (node) => {
    const targets = node.targets;
    if (!targets || typeof targets !== 'object') return;
    for (const ref of [targets.primary, targets.secondary].flat()) {
      if (!ref || typeof ref !== 'object' || !ref.id || !ref.categoryId) continue;
      if (typeof ref.slug === 'string') slugs.push([ref.slug, where]);
      else unslugged.push(`${ref.id} — ${where}`);
    }
  });
  if (isMuscleCatalog) {
    for (const record of [doc].flat()) {
      if (typeof record?.canonical?.slug === 'string') slugs.push([record.canonical.slug, where]);
    }
  }
  return { slugs, unslugged };
}

/** Every published example, as paths relative to specification/schemas. */
async function publishedExamples(rel = '') {
  const found = [];
  for (const entry of await readdir(join(ROOT, 'specification/schemas', rel), { withFileTypes: true })) {
    const path = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...(await publishedExamples(path)));
    else if (
      entry.name.endsWith('.json') &&
      !entry.name.endsWith('.schema.json') &&
      !entry.name.startsWith('invalid.') &&
      !entry.name.startsWith('.')
    ) {
      found.push(path);
    }
  }
  return found;
}

/** Muscle slugs used across every published example and the muscle catalog example. */
async function muscleSlugsUsed() {
  const sources = [
    ...(await publishedExamples()).map((rel) => ({
      path: join(ROOT, 'specification/schemas', rel),
      where: rel,
      isMuscleCatalog: rel.startsWith('muscle/v'),
    })),
    {
      path: join(DIR, 'muscles.registry.example.json'),
      where: 'registries/muscles.registry.example.json',
      isMuscleCatalog: true,
    },
  ];
  const used = new Map();
  const unslugged = [];
  for (const { path, where, isMuscleCatalog } of sources) {
    const found = muscleSlugsIn(JSON.parse(await readFile(path, 'utf8')), where, isMuscleCatalog);
    for (const [slug, at] of found.slugs) if (!used.has(slug)) used.set(slug, at);
    unslugged.push(...found.unslugged);
  }
  const problems = unslugged.length
    ? [
        `${unslugged.length} muscle reference(s) in published examples carry no slug:\n` +
          unslugged.map((u) => `    ${u}`).join('\n') +
          '\n    The slug is the only key another application can match on (RFC-010 §4.1).',
      ]
    : [];
  return { used, problems };
}

/**
 * What can be wrong inside the muscle registry itself. Pure, so --self-test can
 * hand it broken registries.
 */
function muscleRegistryProblems(doc, slugPattern) {
  const found = [];
  const categories = new Set(doc.categories ?? []);
  const byValue = new Map((doc.entries ?? []).map((e) => [e.value, e]));

  for (const entry of doc.entries ?? []) {
    const { value, kind, category, members } = entry;
    if (!slugPattern.test(value)) {
      found.push(`"${value}" is not a slug canonical.slug accepts (${slugPattern.source}).`);
    }
    if (value.startsWith('x-')) {
      found.push(`"${value}" uses the x- prefix, which is reserved for private additions.`);
    }
    if (!categories.has(category)) {
      found.push(`"${value}" has category "${category}", which "categories" does not list.`);
    }
    if (!Array.isArray(entry.atlasAreas)) {
      found.push(`"${value}" has no atlasAreas list (an empty one is allowed).`);
    }
    if (kind === 'muscle') {
      if (members !== undefined) found.push(`muscle "${value}" has members; only a group does.`);
    } else if (kind === 'group') {
      if (!Array.isArray(members) || members.length === 0) {
        found.push(`group "${value}" has no members.`);
        continue;
      }
      for (const member of members) {
        if (!byValue.has(member)) found.push(`group "${value}" names member "${member}", which is not an entry.`);
      }
      if (new Set(members).size !== members.length) found.push(`group "${value}" lists a member twice.`);
    } else {
      found.push(`"${value}" has kind "${kind}"; expected "muscle" or "group".`);
    }
  }

  // A cycle would make a roll-up never finish. Depth-first, with the path kept
  // so the message names the loop rather than just one of its entries.
  const state = new Map(); // value -> 'visiting' | 'done'
  const visit = (value, path) => {
    if (state.get(value) === 'done') return;
    if (state.get(value) === 'visiting') {
      found.push(`groups form a cycle: ${[...path.slice(path.indexOf(value)), value].join(' → ')}.`);
      return;
    }
    state.set(value, 'visiting');
    for (const member of byValue.get(value)?.members ?? []) {
      if (byValue.has(member)) visit(member, [...path, value]);
    }
    state.set(value, 'done');
  };
  for (const value of byValue.keys()) visit(value, []);

  // RFC-010 §3.2: `full-body` rolls up every muscle. Checked here so a muscle
  // added without a group cannot silently fall out of the whole-body view.
  if (byValue.has('full-body') && !found.some((p) => p.startsWith('groups form a cycle'))) {
    const reached = new Set();
    const expand = (value) => {
      for (const member of byValue.get(value)?.members ?? []) {
        if (reached.has(member)) continue;
        reached.add(member);
        expand(member);
      }
    };
    expand('full-body');
    const missed = [...byValue.values()]
      .filter((e) => e.kind === 'muscle' && !reached.has(e.value))
      .map((e) => e.value);
    if (missed.length) found.push(`"full-body" does not roll up ${missed.join(', ')}.`);
  }
  return found;
}

if (SELF_TEST) {
  // Each case is one way the muscle rules must fail. A rule that stops firing
  // turns its case red here, before it can wave a bad registry through.
  const entry = (value, kind, extra = {}) => ({ value, kind, category: 'legs', atlasAreas: [], ...extra });
  const base = () => ({
    categories: ['legs'],
    entries: [
      entry('full-body', 'group', { members: ['legs'] }),
      entry('legs', 'group', { members: ['quadriceps'] }),
      entry('quadriceps', 'muscle'),
    ],
  });
  const withEntries = (...extra) => {
    const doc = base();
    doc.entries.push(...extra);
    return doc;
  };
  const registryCases = [
    ['camelCase slug', withEntries(entry('posteriorDeltoid', 'muscle')), 'is not a slug'],
    ['private prefix in the official list', withEntries(entry('x-acme-thing', 'muscle')), 'reserved for private'],
    ['unknown category', withEntries(entry('neck', 'muscle', { category: 'torso' })), 'does not list'],
    ['unknown member', withEntries(entry('back', 'group', { members: ['rhomboids'] })), 'which is not an entry'],
    ['empty group', withEntries(entry('arms', 'group', { members: [] })), 'has no members'],
    ['muscle with members', withEntries(entry('calf', 'muscle', { members: ['quadriceps'] })), 'only a group does'],
    [
      'cycle',
      withEntries(entry('a', 'group', { members: ['b'] }), entry('b', 'group', { members: ['a'] })),
      'groups form a cycle',
    ],
    ['muscle full-body misses', withEntries(entry('soleus', 'muscle')), 'does not roll up soleus'],
  ];

  const failures = [];
  if (muscleRegistryProblems(base(), MUSCLE_SLUG).length) failures.push('the valid base registry raised a problem');
  for (const [name, doc, expected] of registryCases) {
    const raised = muscleRegistryProblems(doc, MUSCLE_SLUG);
    if (!raised.some((p) => p.includes(expected))) {
      failures.push(`${name}: expected "${expected}", got ${JSON.stringify(raised)}`);
    }
  }

  // Usage: a bad name in an example is reported, a private one is not, and a
  // reference without a slug is reported.
  const exercise = {
    targets: {
      primary: [{ id: 'mus.a', slug: 'rear-delts', name: 'Rear delts', categoryId: 'cat.shoulders' }],
      secondary: [
        { id: 'mus.b', slug: 'x-acme-rotator-cuff', name: 'Rotator cuff', categoryId: 'cat.shoulders' },
        { id: 'mus.c', name: 'Quads', categoryId: 'cat.legs' },
      ],
    },
  };
  const { slugs, unslugged } = muscleSlugsIn(exercise, 'fixture.json', false);
  const unlisted = unlistedValues(new Set(['quadriceps']), new Map(slugs), PRIVATE_MUSCLE).map(([v]) => v);
  if (unlisted.join() !== 'rear-delts') failures.push(`usage: expected only "rear-delts" unlisted, got ${unlisted}`);
  if (unslugged.join() !== 'mus.c — fixture.json') failures.push(`usage: expected mus.c unslugged, got ${unslugged}`);
  const catalog = muscleSlugsIn([{ canonical: { slug: 'latissimus-dorsi' } }], 'cat.json', true).slugs;
  if (unlistedValues(new Set(['lats']), new Map(catalog)).length !== 1) {
    failures.push('usage: a muscle record whose canonical.slug is unofficial was not reported');
  }

  if (failures.length) {
    console.error(`self-test: ${failures.length} rule(s) did not fire as expected:\n`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`  ok    self-test — the muscle rules fail in all ${registryCases.length + 3} recorded ways`);
  process.exit(0);
}

const problems = [];
const systems = await zoneSystems();
const onDisk = (await readdir(DIR)).filter((f) => f.endsWith('.registry.json'));
let entryTotal = 0;

for (const registry of REGISTRIES) {
  const { file, field, schemaField, usedIn, collect, validate, privatePrefix } = registry;
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
  for (const problem of validate?.(doc) ?? []) problems.push(`${label}: ${problem}`);

  // Every field a registry claims to govern must still exist. A rename that
  // removed the field would otherwise leave the registry describing nothing.
  // A field that a source schema reaches through a shared `$ref` (`slug`, via
  // the common definitions) is spelled out only in its published, bundled
  // build, so that is read as well.
  for (const governed of doc.governs ?? []) {
    const source = await readFile(join(ROOT, governed.source), 'utf8').catch(() => null);
    if (source === null) {
      problems.push(`${label}: governs "${governed.source}", which does not exist.`);
      continue;
    }
    const built = await readFile(
      join(ROOT, governed.source.replace('specification/schema-sources/', 'specification/schemas/')),
      'utf8'
    ).catch(() => '');
    const property = governed.pointer.split('.').pop().replace(/\[\]$/, '');
    if (!JSON.parse(source) || ![source, built].some((text) => text.includes(`"${property}"`))) {
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

  const { used, problems: usageProblems } = collect
    ? await collect()
    : { used: await valuesUsedIn(usedIn, field), problems: [] };
  for (const problem of usageProblems) problems.push(`${label}: ${problem}`);
  const unlisted = unlistedValues(values, used, privatePrefix);
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
