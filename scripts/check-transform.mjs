#!/usr/bin/env node
/**
 * The transformer's output is valid FDS, proved by producing some.
 *
 * Every other check reads something: the schemas, the RFCs, the pages, the
 * tarball, the skill. Nothing took source data through the pipeline and asked
 * whether what came out the far end validates. The unit tests assert on
 * intermediate shapes, `check:packages` proves the package loads, and
 * `check:mapping` proves the configuration schema matches the types — and a
 * transform could still emit documents no consumer would accept.
 *
 * That is not hypothetical. Two committed configurations wrote `"type": "gif"`
 * into `media`, where the schema allows image, video, doc and 3d, and stamped
 * their documents `schemaVersion: "1.0.0"`, a version that has been withdrawn
 * and 404s. Both had been wrong since the day they were written, because their
 * validation ran non-strict and the CLI reported a count of failures without
 * ever saying what they were.
 *
 * ── Why this fixture and not the POC one ─────────────────────────────────────
 *
 * `poc-test/` demonstrates tiered AI enrichment: its mapping deliberately
 * leaves classification and metrics for a model to fill, so it cannot produce a
 * valid document without an API key and a network round trip. That makes it a
 * fine demo and an impossible gate.
 *
 * `fixtures/roundtrip/` maps every required field from source, so a valid
 * document falls out of the mapping alone. No key, no network, no model, and
 * therefore no reason it cannot run on every pull request. What it proves is
 * narrower than the POC's ambition and it actually holds.
 *
 * A configuration that cannot be run can still be read, though, and "cannot be
 * gated" is how the `"gif"` survived. So every committed mapping configuration
 * in the package — runnable or not — has the constants it writes checked
 * against the schema they are written into, and the versions it names checked
 * against the release manifest. That is the half of the check the POC needed.
 *
 * ── What it asserts ──────────────────────────────────────────────────────────
 *
 *   - every committed mapping configuration targets a release the manifest
 *     lists, publishes the entity it claims, stamps the entity version that
 *     release actually names, and writes only constants the entity schema
 *     accepts at the field they land in
 *   - the transform runs from the repository root and produces one document per
 *     source record
 *   - every document validates against the published schema for the version it
 *     declares, resolved through the release manifest
 *   - the documents match `fixtures/roundtrip/expected/exercises.json`, field
 *     for field, once the values only a run can know — the generated UUID and
 *     the two timestamps — are checked for shape and set aside. That file is a
 *     committed copy of the CLI's own output, and the website's landing page
 *     renders it as "what the transformer produces". A demo that quotes a tool
 *     is asserted in one place and implemented in another, which is this
 *     repository's recurring defect; the comparison is what closes the gap. If
 *     it fails because the transformer legitimately changed, re-run the
 *     transform into `fixtures/roundtrip/expected/` and commit the result.
 *   - no registry lookup silently resolved to nothing — a lookup that was asked
 *     for and matched nothing returns an empty array, which validates, writes,
 *     and is indistinguishable from a field nobody asked to fill
 *   - the same transform run from an unrelated working directory produces the
 *     same documents, so schema resolution does not depend on where the tool
 *     was invoked from
 *   - `validate --version <release>` reads the release it was given. It did not:
 *     commander's own `--version` flag answered first, printed the package
 *     version and exited 0, so a script checking the exit status was told data
 *     had validated that was never read. The probe below asks for a release
 *     that does not exist and requires a non-zero exit — a wording-independent
 *     way to prove the option reached the subcommand.
 *
 * ── Self-test ────────────────────────────────────────────────────────────────
 *
 * `--self-test` runs each rule against a synthetic input built to break it,
 * before the real check runs in the same process. A gate that has only ever
 * passed has not been tested, and the rules here are pure functions precisely
 * so that failing them on purpose costs nothing.
 *
 *   node scripts/check-transform.mjs [--self-test]
 */

import { execFile } from 'node:child_process';
import { access, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { loadManifest, PUBLISHED_DIRS, ROOT } from './lib/releases.mjs';

const run = promisify(execFile);

const PACKAGE_DIR = 'packages/fds-transformer';
const FIXTURE_DIR = `${PACKAGE_DIR}/fixtures/roundtrip`;
const CLI_PATH = `${PACKAGE_DIR}/dist/bin/fds-transformer.js`;

/** Directories under the package that hold no authored configuration. */
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', 'output', '.git']);

// ── schema navigation ────────────────────────────────────────────────────────

/**
 * Follow a local `$ref` chain to the node it names.
 *
 * The entity schemas keep almost every constrained shape in `$defs` and point
 * at it, so a walk down `properties` that does not dereference stops at the
 * first `$ref` and concludes the field is unconstrained — which is the same as
 * checking nothing, while looking like a check.
 */
function deref(root, node) {
  for (let hops = 0; node && typeof node.$ref === 'string' && hops < 16; hops += 1) {
    if (!node.$ref.startsWith('#/')) return null;
    node = node.$ref
      .slice(2)
      .split('/')
      .map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'))
      .reduce((current, key) => (current == null ? current : current[key]), root);
  }
  return node ?? null;
}

/** The subschema a dotted mapping target lands in, or null if not constrained. */
export function subschemaAt(root, dotted) {
  let node = root;
  for (const key of dotted.split('.')) {
    node = deref(root, node);
    node = node?.properties?.[key];
    if (!node) return null;
  }
  node = deref(root, node);
  if (!node || typeof node !== 'object') return null;
  // `$defs` travels with the extracted node so its own internal `$ref`s still
  // resolve once it is compiled standalone.
  return { ...node, $defs: { ...root.$defs, ...node.$defs } };
}

/**
 * The constants a mapping writes into the document, with where they land.
 *
 * Only values fixed by the configuration itself. Anything derived from source
 * data, a timestamp or a model is not knowable without running the transform,
 * and the transform is what the round trip below is for.
 */
export function constantsWritten(mappings) {
  const constants = [];

  for (const [target, rule] of Object.entries(mappings ?? {})) {
    if (!rule || typeof rule !== 'object') continue;

    if (rule.transform === 'toMediaArray') {
      if (typeof rule.options?.type !== 'string') continue;
      constants.push({
        target,
        // A media entry needs a uri to be judged on its type at all; the type is
        // the configured constant and the uri is scaffolding around it.
        value: [{ type: rule.options.type, uri: 'https://example.invalid/media' }],
        what: `toMediaArray options.type "${rule.options.type}"`,
      });
      continue;
    }

    if (!rule.transform && rule.default !== undefined) {
      constants.push({
        target,
        value: rule.default,
        what: `default ${JSON.stringify(rule.default)}`,
      });
    }
  }

  return constants;
}

// ── rules ────────────────────────────────────────────────────────────────────

/**
 * What a mapping configuration claims, checked against the manifest and the
 * schema it names. Returns problem strings; empty means it holds.
 */
export function inspectConfig({ file, config, manifest, versionsOf, schemaOf, compile }) {
  const problems = [];
  const release = config.targetSchema?.version;
  const releases = Object.keys(manifest.releases ?? {});

  if (!releases.includes(release)) {
    problems.push(
      `${file} targets release ${JSON.stringify(release)}, which the release ` +
        `manifest does not list.\n    Published releases: ${releases.join(', ')}.\n` +
        '    targetSchema.version names a release, not an entity version.'
    );
    return problems;
  }

  const entity = config.targetSchema?.entity ?? 'exercise';
  const entityVersion = manifest.releases[release].entities?.[entity];

  if (!entityVersion) {
    problems.push(
      `${file} targets ${entity}, which release ${release} does not publish.\n` +
        `    Release ${release} publishes: ` +
        `${Object.keys(manifest.releases[release].entities ?? {}).join(', ') || 'nothing'}.`
    );
    return problems;
  }

  const record = versionsOf.get(entity)?.get(entityVersion);
  if (!record?.path || record.status === 'withdrawn') {
    problems.push(
      `${file} targets release ${release}, which names ${entity} ${entityVersion} — ` +
        `${record ? record.status : 'a version the manifest does not record'}.\n` +
        '    A document stamped with it resolves to nothing. Target a release ' +
        'whose entity versions are still served.'
    );
    return problems;
  }

  const declared = config.mappings?.schemaVersion?.default;
  if (typeof declared === 'string' && declared !== entityVersion) {
    problems.push(
      `${file} stamps schemaVersion ${declared} but targets release ${release}, ` +
        `which publishes ${entity} ${entityVersion}.\n` +
        '    A release names a *set* of entity versions; the document carries the ' +
        `entity version. Set the default to ${entityVersion}.`
    );
  }

  const schema = schemaOf(entity, entityVersion);
  for (const { target, value, what } of constantsWritten(config.mappings)) {
    const subschema = subschemaAt(schema, target);
    if (!subschema) continue; // the schema constrains nothing there; nothing to check

    const validate = compile(`${entity}@${entityVersion}#${target}`, subschema);
    if (validate(value)) continue;

    problems.push(
      `${file} writes ${what} into ${target}, which ${entity} ${entityVersion} rejects:\n` +
        validate.errors
          .slice(0, 4)
          .map((error) => `      ${target}${error.instancePath} ${error.message}`)
          .join('\n') +
        '\n    The configuration was never run against the schema it names, so ' +
        'the value only had to look plausible.'
    );
  }

  return problems;
}

/**
 * The produced documents, checked against the schema each one declares.
 *
 * `lookups` are the mapping targets fed by a registry, taken from the
 * configuration rather than listed here: a lookup that matches nothing yields
 * an empty array and no error, and is indistinguishable from a field nobody
 * asked to fill.
 */
export function inspectDocuments({
  documents,
  sourceCount,
  entity,
  lookups,
  versionsOf,
  schemaOf,
  compile,
}) {
  const problems = [];

  if (!Array.isArray(documents)) {
    problems.push(
      'the transform wrote something that is not an array of documents.\n' +
        '    The fixture configures singleFile output, which is a JSON array.'
    );
    return problems;
  }

  if (documents.length !== sourceCount) {
    problems.push(
      `${sourceCount} source record(s) in, ${documents.length} document(s) out.\n` +
        '    A record that fails validation is dropped, so a short output is a ' +
        'silent failure. Run the transform by hand; it reports each failed record.'
    );
  }

  for (const [index, document] of documents.entries()) {
    const where = `document ${index + 1}`;
    const version = document?.schemaVersion;
    const record = versionsOf.get(entity)?.get(version);

    if (!record?.path || record.status === 'withdrawn') {
      problems.push(
        `${where} declares ${entity} ${JSON.stringify(version)}, which is ` +
          `${record ? record.status : 'not published'}.\n` +
          '    The transform is stamping a version no consumer can resolve.'
      );
      continue;
    }

    const validate = compile(`${entity}@${version}`, schemaOf(entity, version));
    if (!validate(document)) {
      problems.push(
        `${where} does not validate against ${entity} ${version}:\n` +
          validate.errors
            .slice(0, 6)
            .map((error) => `      ${error.instancePath || '/'} ${error.message}`)
            .join('\n') +
          '\n    The transformer produced something no consumer would accept.'
      );
    }

    for (const { target, registry } of lookups) {
      const value = target
        .split('.')
        .reduce((node, key) => (node == null ? node : node[key]), document);
      const empty = value == null || (Array.isArray(value) && value.length === 0);
      if (!empty) continue;

      problems.push(
        `${where}: ${target} is empty.\n` +
          `    The ${registry} registry matched nothing and the transform carried ` +
          'on. An empty lookup is indistinguishable from a lookup nobody asked for.'
      );
    }
  }

  return problems;
}

// ── the committed expected output ────────────────────────────────────────────

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Fields a fresh run cannot reproduce, each with the shape it must still have. */
const RUN_DEPENDENT = [
  { path: 'exerciseId', pattern: UUID, expects: 'a UUID' },
  { path: 'metadata.createdAt', pattern: ISO_INSTANT, expects: 'an ISO 8601 instant' },
  { path: 'metadata.updatedAt', pattern: ISO_INSTANT, expects: 'an ISO 8601 instant' },
];

function valueAt(node, dotted) {
  return dotted.split('.').reduce((current, key) => (current == null ? current : current[key]), node);
}

/** Every path at which two JSON values differ, depth-first, capped by the caller. */
function diffPaths(actual, expected, path = '') {
  if (actual === expected) return [];
  const kind = (value) =>
    Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;

  if (kind(actual) !== kind(expected) || kind(actual) !== 'object' && kind(actual) !== 'array') {
    return [`${path || '/'}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`];
  }

  const keys = [...new Set([...Object.keys(actual), ...Object.keys(expected)])];
  return keys.flatMap((key) => diffPaths(actual[key], expected[key], path ? `${path}.${key}` : key));
}

/**
 * The run's documents against the committed expected output.
 *
 * Both sides are compared with the run-dependent fields replaced by a
 * placeholder — after each is checked, on the *run* side, for the shape it
 * cannot help having. The expected file is a real CLI run committed verbatim,
 * so its own UUIDs and timestamps stay in the repository and in what the
 * website renders, but never decide this comparison.
 */
export function compareToExpected({ documents, expected }) {
  const problems = [];

  if (!Array.isArray(expected) || expected.length !== documents.length) {
    problems.push(
      `the committed expected output has ${Array.isArray(expected) ? expected.length : 'no'} ` +
        `document(s); the transform produced ${documents.length}.\n` +
        '    Re-run the transform into fixtures/roundtrip/expected/ and commit the result.'
    );
    return problems;
  }

  for (const [index, document] of documents.entries()) {
    const where = `document ${index + 1}`;
    const masked = { actual: structuredClone(document), expected: structuredClone(expected[index]) };

    for (const { path, pattern, expects } of RUN_DEPENDENT) {
      const produced = valueAt(document, path);
      if (typeof produced !== 'string' || !pattern.test(produced)) {
        problems.push(
          `${where}: ${path} is ${JSON.stringify(produced)}, not ${expects}.\n` +
            '    This field is excused from the expected-output comparison because a ' +
            'fresh run cannot reproduce it — but only while it keeps its shape.'
        );
      }
      for (const side of Object.values(masked)) {
        const parent = valueAt(side, path.split('.').slice(0, -1).join('.')) ?? side;
        if (parent && typeof parent === 'object') parent[path.split('.').at(-1)] = '<run-dependent>';
      }
    }

    const diverged = diffPaths(masked.actual, masked.expected);
    if (diverged.length) {
      problems.push(
        `${where} does not match fixtures/roundtrip/expected/exercises.json:\n` +
          diverged.slice(0, 6).map((line) => `      ${line}`).join('\n') +
          '\n    The website renders the committed file as what the transformer ' +
          'produces. If the transformer legitimately changed, re-run the transform ' +
          'into fixtures/roundtrip/expected/ and commit the result.'
      );
    }
  }

  return problems;
}

/** Mapping targets filled by a registry lookup, taken from the configuration. */
export function registryLookups(mappings) {
  return Object.entries(mappings ?? {})
    .filter(([, rule]) => rule && typeof rule === 'object' && rule.transform === 'registryLookup')
    .map(([target, rule]) => ({ target, registry: rule.options?.registry ?? 'unnamed' }));
}

// ── plumbing ─────────────────────────────────────────────────────────────────

/** Every JSON file under a directory that reads as a mapping configuration. */
async function mappingConfigs(dir) {
  const found = [];
  const entries = await readdir(join(ROOT, dir), { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const relative = `${dir}/${entry.name}`;

    if (entry.isDirectory()) {
      found.push(...(await mappingConfigs(relative)));
      continue;
    }
    if (!entry.name.endsWith('.json')) continue;

    let config;
    try {
      config = JSON.parse(await readFile(join(ROOT, relative), 'utf8'));
    } catch {
      continue; // not our file to judge; check:mapping owns configuration validity
    }
    if (config && typeof config === 'object' && config.targetSchema && config.mappings) {
      found.push({ file: relative, config });
    }
  }

  return found.sort((a, b) => a.file.localeCompare(b.file));
}

function report(problems) {
  if (!problems.length) return false;
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  return true;
}

// ── self-test ────────────────────────────────────────────────────────────────

/**
 * Each rule, run against an input built to break it.
 *
 * Failing here means the rule stopped catching what it was written for, which
 * is worse than the defect: a green run would then be evidence of nothing.
 */
function selfTest(context) {
  const failures = [];
  let cases = 0;
  const expect = (label, problems, fragment) => {
    cases += 1;
    const joined = problems.join('\n');
    if (problems.length && joined.includes(fragment)) return;
    failures.push(
      `self-test: ${label} was not reported${problems.length ? `; got: ${joined}` : ''}`
    );
  };

  const base = {
    file: 'synthetic.json',
    manifest: context.manifest,
    versionsOf: context.versionsOf,
    schemaOf: context.schemaOf,
    compile: context.compile,
  };
  const release = context.manifest.currentRelease;
  const entity = 'exercise';
  const entityVersion = context.manifest.releases[release].entities[entity];

  expect(
    'a release the manifest does not list',
    inspectConfig({ ...base, config: { targetSchema: { version: '99.99.99' }, mappings: {} } }),
    'which the release manifest does not list'
  );

  expect(
    'a media type outside the schema enum',
    inspectConfig({
      ...base,
      config: {
        targetSchema: { version: release, entity },
        mappings: { media: { transform: 'toMediaArray', options: { type: 'gif' } } },
      },
    }),
    'writes toMediaArray options.type "gif" into media'
  );

  expect(
    'a schemaVersion that is not what the release publishes',
    inspectConfig({
      ...base,
      config: {
        targetSchema: { version: release, entity },
        mappings: { schemaVersion: { default: '0.0.1' } },
      },
    }),
    'stamps schemaVersion 0.0.1'
  );

  const documentBase = {
    sourceCount: 1,
    entity,
    lookups: [{ target: 'targets.primary', registry: 'muscles' }],
    versionsOf: context.versionsOf,
    schemaOf: context.schemaOf,
    compile: context.compile,
  };

  expect(
    'a document missing a required field',
    inspectDocuments({ ...documentBase, documents: [{ schemaVersion: entityVersion }] }),
    'does not validate against exercise'
  );

  expect(
    'a registry lookup that matched nothing',
    inspectDocuments({
      ...documentBase,
      documents: [{ schemaVersion: entityVersion, targets: { primary: [] } }],
    }),
    'targets.primary is empty'
  );

  expect(
    'a document short of the source record count',
    inspectDocuments({ ...documentBase, sourceCount: 3, documents: [] }),
    '3 source record(s) in, 0 document(s) out'
  );

  const produced = {
    exerciseId: '00000000-0000-4000-8000-000000000000',
    canonical: { name: 'Back Squat' },
    metadata: {
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  };
  const committed = structuredClone(produced);
  committed.exerciseId = '11111111-1111-4111-8111-111111111111'; // differs; must not matter

  expect(
    'a field that drifted from the committed expected output',
    compareToExpected({
      documents: [produced],
      expected: [{ ...committed, canonical: { name: 'Front Squat' } }],
    }),
    'does not match fixtures/roundtrip/expected/exercises.json'
  );

  expect(
    'an exerciseId that stopped being a UUID',
    compareToExpected({
      documents: [{ ...produced, exerciseId: 'not-a-uuid' }],
      expected: [committed],
    }),
    'not a UUID'
  );

  expect(
    'an expected file with the wrong document count',
    compareToExpected({ documents: [produced], expected: [] }),
    'Re-run the transform'
  );

  if (compareToExpected({ documents: [produced], expected: [committed] }).length) {
    cases += 1;
    failures.push(
      'self-test: documents differing only in run-dependent fields were reported as drift'
    );
  }

  return { failures, cases };
}

// ── main ─────────────────────────────────────────────────────────────────────

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

if (!(await access(join(ROOT, CLI_PATH)).then(() => true, () => false))) {
  console.error(
    `${CLI_PATH} does not exist.\n` +
      '    Build the transformer first:\n' +
      `      npm --prefix ${PACKAGE_DIR} ci\n` +
      `      npm --prefix ${PACKAGE_DIR} run build`
  );
  process.exit(1);
}

const { manifest, versionsOf } = await loadManifest();

// Every published entity schema, read once. Keyed entity@version because a
// release names a set of entity versions and two entities in the same release
// are routinely at different ones.
const schemas = new Map();
for (const [entity, versions] of versionsOf) {
  for (const [version, record] of versions) {
    if (!record.path) continue;
    schemas.set(
      `${entity}@${version}`,
      JSON.parse(await readFile(join(ROOT, PUBLISHED_DIRS.schemas, record.path), 'utf8'))
    );
  }
}
const schemaOf = (entity, version) => schemas.get(`${entity}@${version}`);

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const compiled = new Map();
const compile = (key, schema) => {
  if (!compiled.has(key)) {
    // The `$id` is dropped so the same schema can be compiled twice — once
    // whole, once as an extracted subschema — without Ajv rejecting the second.
    const { $id, ...body } = schema;
    compiled.set(key, ajv.compile(body));
  }
  return compiled.get(key);
};

const problems = [];

if (process.argv.includes('--self-test')) {
  const { failures, cases } = selfTest({ manifest, versionsOf, schemaOf, compile });
  if (report(failures)) process.exit(1);
  console.log(`  ok    self-test: ${cases} rule(s) reported the input built to break them`);
}

// ── every committed mapping configuration ────────────────────────────────────

const configs = await mappingConfigs(PACKAGE_DIR);
if (configs.length === 0) {
  problems.push(
    `no mapping configurations were found under ${PACKAGE_DIR}.\n` +
      '    A loop over an empty list exits zero and reports success.'
  );
}
for (const { file, config } of configs) {
  problems.push(...inspectConfig({ file, config, manifest, versionsOf, schemaOf, compile }));
}

// ── the round trip ───────────────────────────────────────────────────────────

const fixtureConfig = JSON.parse(await readFile(join(ROOT, FIXTURE_DIR, 'mapping.config.json'), 'utf8'));
const source = JSON.parse(await readFile(join(ROOT, FIXTURE_DIR, 'source.json'), 'utf8'));
const outputName = fixtureConfig.output?.singleFileName ?? 'exercises.json';

/**
 * The transform, run through the built CLI rather than the library, because the
 * CLI is what ships. Absolute paths and an explicit `cwd`, so the only thing
 * left that could depend on the working directory is schema resolution — which
 * is what the second run exists to catch.
 */
async function transformInto(outDir, cwd) {
  await run(
    process.execPath,
    [
      join(ROOT, CLI_PATH), 'transform',
      '-i', join(ROOT, FIXTURE_DIR, 'source.json'),
      '-c', join(ROOT, FIXTURE_DIR, 'mapping.config.json'),
      '-o', outDir,
      '--no-enrichment',
      '--log-level', 'error',
    ],
    { cwd }
  );
  return JSON.parse(await readFile(join(outDir, outputName), 'utf8'));
}

const workspace = await mkdtemp(join(tmpdir(), 'fds-roundtrip-'));

try {
  let documents = null;

  try {
    documents = await transformInto(join(workspace, 'from-root'), ROOT);
  } catch (error) {
    problems.push(
      'the transform did not complete when run from the repository root: ' +
        `${error.stderr?.trim() || error.message}`
    );
  }

  if (documents) {
    const expected = JSON.parse(
      await readFile(join(ROOT, FIXTURE_DIR, 'expected', outputName), 'utf8')
    );
    problems.push(...compareToExpected({ documents, expected }));

    problems.push(
      ...inspectDocuments({
        documents,
        sourceCount: source.length,
        entity: fixtureConfig.targetSchema?.entity ?? 'exercise',
        lookups: registryLookups(fixtureConfig.mappings),
        versionsOf,
        schemaOf,
        compile,
      })
    );

    // Same inputs, a working directory with no relation to this repository. A
    // tool whose schema resolution depends on where it was invoked from is
    // broken for anyone scripting it, and the failure surfaces as a missing file
    // on a path the caller never wrote. Strict validation drops what it cannot
    // check, so a resolution failure shows up as a shorter output.
    try {
      const elsewhere = await transformInto(join(workspace, 'from-elsewhere'), workspace);
      if (elsewhere.length !== documents.length) {
        problems.push(
          `the transform produced ${documents.length} document(s) from the ` +
            `repository root and ${elsewhere.length} from ${workspace}.\n` +
            '    Its behaviour depends on the working directory.'
        );
      }
    } catch (error) {
      problems.push(
        `the transform completed from the repository root but not from ${workspace}: ` +
          `${error.stderr?.trim() || error.message}\n` +
          '    Its behaviour depends on the working directory.'
      );
    }

    // `validate` is a documented command, and a documented command that never
    // runs is how this repository keeps discovering that an assertion and its
    // implementation were never introduced to each other.
    const validated = join(workspace, 'from-root', outputName);
    const entity = fixtureConfig.targetSchema?.entity ?? 'exercise';
    const release = fixtureConfig.targetSchema?.version;

    try {
      await run(process.execPath, [
        join(ROOT, CLI_PATH), 'validate',
        '-i', validated, '-e', entity, '--version', release,
      ], { cwd: ROOT });
    } catch (error) {
      problems.push(
        `\`validate --version ${release}\` rejected output the transform just ` +
          `produced: ${error.stdout?.trim() || error.stderr?.trim() || error.message}`
      );
    }

    // A release no manifest lists. Derived rather than picked, so it cannot
    // become a real release later and quietly stop proving anything.
    let absent = '0.0.0';
    while (manifest.releases?.[absent]) absent = `${Number(absent.split('.')[0]) + 1}.0.0`;

    const refused = await run(process.execPath, [
      join(ROOT, CLI_PATH), 'validate',
      '-i', validated, '-e', entity, '--version', absent,
    ], { cwd: ROOT }).then(() => false, () => true);

    if (!refused) {
      problems.push(
        `\`validate --version ${absent}\` exited 0, but no such release is published.\n` +
          '    The option is not reaching the subcommand — commander\'s own ' +
          '`--version` flag answers first, prints the package version and exits 0, ' +
          'so a caller reading the exit status is told data validated that was ' +
          'never read.'
      );
    }
  }
} finally {
  await rm(workspace, { recursive: true, force: true });
}

if (report(problems)) process.exit(1);

console.log(
  `  ok    ${configs.length} mapping configuration(s) name published versions and ` +
    `write constants their schema accepts; ${source.length} source record(s) ` +
    'transformed and validated against their published schema.'
);
