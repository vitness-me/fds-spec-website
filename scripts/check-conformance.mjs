#!/usr/bin/env node
/**
 * The conformance corpus is real, validates, and cites the RFCs honestly.
 *
 * Every other gate reads what FDS says about itself: the schemas, the RFCs, the
 * scenario matrix we authored. All of it answers one question — is the standard
 * internally consistent? — and answers it well. None of it answers the other
 * one: does FDS survive contact with what the fitness industry already ships?
 *
 * `conformance/` is the corpus that asks. Each platform under it is a real
 * product — Trainerize, TrainHeroic, wger — whose data model was researched
 * from public sources and then expressed as FDS. The expression either
 * validates or it does not, and where it cannot be expressed at all, the gap is
 * written down against the RFC section that would have to change. That gap list
 * is the payload: it turns "we think RFC-007 is complete" into "RFC-007
 * round-trips three archetypes; here is the field that does not fit."
 *
 * A corpus that is not gated rots into fiction the same way a demo does. So:
 *
 *   - every platform `corpus.json` declares has its directory, its profile and
 *     its gap report on disk, and every directory on disk is declared — a
 *     platform researched but never registered, or registered but deleted, is
 *     the drift this catches
 *   - a `transform`-mode platform's source records go through the built CLI and
 *     the output validates against the published schema, exactly as a consumer
 *     would receive it. This is the same proof `check:transform` makes for the
 *     roundtrip fixture, made for real platform data
 *   - a `fidelity`-mode platform's every `*.fds.json` fixture validates against
 *     the published schema for the entity and version it declares. These are the
 *     nested entities — workouts, programs — the transformer's dotted-path
 *     engine does not emit, so they are modelled by hand and checked here
 *   - every `RFC-00N §X.Y` citation in a gap report names a section that RFC
 *     actually has. A gap report that cites a section which does not exist is
 *     how "the assertion and its implementation were never introduced" — this
 *     repository's recurring defect — would reappear in the corpus
 *   - the cross-platform rollup names every registered platform, so a platform
 *     added to the corpus cannot be left out of the standard's gap picture
 *
 * `--self-test` runs each pure rule against an input built to break it, before
 * the real check runs in the same process. A gate that has only ever passed has
 * not been tested.
 *
 *   node scripts/check-conformance.mjs [--self-test]
 */

import { execFile } from 'node:child_process';
import { access, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { loadManifest, ROOT } from './lib/releases.mjs';

const run = promisify(execFile);

const CORPUS_DIR = 'conformance';
const PLATFORMS_DIR = `${CORPUS_DIR}/platforms`;
const ROLLUP_FILE = `${CORPUS_DIR}/gaps/RFC-GAPS.md`;
const PACKAGE_DIR = 'packages/fds-transformer';
const CLI_PATH = `${PACKAGE_DIR}/dist/bin/fds-transformer.js`;
const PUBLISHED_SCHEMAS = 'specification/schemas';
const RFC_DIR = 'specification/rfc';

// ── pure rules ───────────────────────────────────────────────────────────────

/**
 * The corpus registry against the directories on disk.
 *
 * A platform declared without a directory is a dangling row; a directory
 * without a row is a platform nobody registered, and the gate below would never
 * look at it. Both are the same drift — the registry and the tree disagreeing —
 * and both are caught here rather than surfacing as a confusing absence later.
 */
export function reconcile({ platforms, dirs, present }) {
  const problems = [];
  const declared = new Set();

  for (const platform of platforms) {
    const slug = platform.slug;
    if (typeof slug !== 'string' || !slug) {
      problems.push(`${CORPUS_DIR}/corpus.json has a platform with no slug.`);
      continue;
    }
    declared.add(slug);

    if (!dirs.includes(slug)) {
      problems.push(
        `corpus.json declares platform ${JSON.stringify(slug)}, but ` +
          `${PLATFORMS_DIR}/${slug}/ does not exist.\n` +
          '    Every registered platform is a directory holding its profile, its ' +
          'mapping or fixtures, and its gap report.'
      );
      continue;
    }

    for (const required of ['profile.md', 'gaps.md']) {
      if (!present(slug, required)) {
        problems.push(
          `${PLATFORMS_DIR}/${slug}/ has no ${required}.\n` +
            (required === 'profile.md'
              ? '    A platform without a profile is a mapping nobody can check the sourcing of.'
              : '    A platform without a gap report has been mapped but never scored against the RFCs — which is the only reason the corpus exists.')
        );
      }
    }

    if (platform.mode !== 'transform' && platform.mode !== 'fidelity') {
      problems.push(
        `platform ${slug} declares mode ${JSON.stringify(platform.mode)}, which is ` +
          'neither "transform" nor "fidelity".'
      );
    }
  }

  for (const dir of dirs) {
    if (!declared.has(dir)) {
      problems.push(
        `${PLATFORMS_DIR}/${dir}/ exists but corpus.json does not declare it.\n` +
          '    An unregistered platform is not run by this gate — it is dead ' +
          'weight that looks like coverage. Add it to corpus.json or remove it.'
      );
    }
  }

  return problems;
}

/** The entity a fidelity fixture is for, taken from its `<entity>.<name>.fds.json` name. */
export function fixtureEntity(filename) {
  const match = /^([a-z-]+)\.[^/]*\.fds\.json$/.exec(filename);
  return match ? match[1] : null;
}

/**
 * One fidelity fixture against the schema for the entity and version it declares.
 *
 * The entity comes from the filename and the version from the document's own
 * `schemaVersion`, resolved through the manifest — the same resolution a
 * consumer performs. A fixture naming an entity the platform does not produce,
 * or a version no release serves, is stamping something no consumer could route.
 */
export function inspectFixture({ file, entity, doc, produces, versionsOf, schemaOf, compile }) {
  const problems = [];

  if (!entity) {
    problems.push(
      `${file} is not named <entity>.<name>.fds.json, so the gate cannot tell ` +
        'which schema to validate it against.'
    );
    return problems;
  }

  if (Array.isArray(produces) && !produces.includes(entity)) {
    problems.push(
      `${file} is a ${entity} document, but corpus.json says this platform ` +
        `produces ${produces.join(', ') || 'nothing'}.\n` +
        '    Either the fixture is misfiled or the registry understates what the ' +
        'platform models.'
    );
    return problems;
  }

  const version = doc?.schemaVersion;
  const record = versionsOf.get(entity)?.get(version);
  if (!record?.path || record.status === 'withdrawn') {
    problems.push(
      `${file} declares ${entity} ${JSON.stringify(version)}, which is ` +
        `${record ? record.status : 'not published'}.\n` +
        '    A conformance fixture must validate against a version a consumer can ' +
        'actually resolve.'
    );
    return problems;
  }

  const validate = compile(`${entity}@${version}`, schemaOf(entity, version));
  if (!validate(doc)) {
    problems.push(
      `${file} does not validate against ${entity} ${version}:\n` +
        validate.errors
          .slice(0, 8)
          .map((error) => `      ${error.instancePath || '/'} ${error.message}`)
          .join('\n') +
        '\n    The corpus claims FDS can express this platform artifact; the schema ' +
        'says this expression of it is invalid. Fix the fixture, or if the schema ' +
        'is genuinely too narrow, that is a gap — write it up in gaps.md.'
    );
  }

  return problems;
}

/**
 * Every `RFC-00N §X.Y` citation in a gap report, against the sections that RFC has.
 *
 * `rfcSections` maps an RFC number to the set of section ids it defines — "4",
 * "4.4", "8.1". A citation that resolves to nothing is either a typo or a
 * reference to a section that was renumbered out from under it, and a gap
 * pinned to a section that does not exist cannot be acted on.
 */
export function rfcCitationProblems({ file, text, rfcSections }) {
  const problems = [];
  const citation = /RFC-0*(\d+)\s*§\s*(\d+(?:\.\d+)*)/g;

  for (const match of text.matchAll(citation)) {
    const number = String(Number(match[1])).padStart(3, '0');
    const section = match[2];
    const sections = rfcSections.get(number);

    if (!sections) {
      problems.push(
        `${file} cites RFC-${number} §${section}, but there is no RFC-${number} ` +
          'in specification/rfc/.'
      );
      continue;
    }
    if (!sections.has(section)) {
      problems.push(
        `${file} cites RFC-${number} §${section}, which that RFC does not have.\n` +
          '    A gap must be pinned to a section that exists, or it cannot be ' +
          'acted on. Check the section was not renumbered.'
      );
    }
  }

  return problems;
}

/** The rollup must name every registered platform, so none is left out of the picture. */
export function rollupProblems({ text, slugs }) {
  const problems = [];
  for (const slug of slugs) {
    if (!text.includes(slug)) {
      problems.push(
        `${ROLLUP_FILE} does not mention ${JSON.stringify(slug)}.\n` +
          '    Every platform in the corpus belongs in the cross-platform gap ' +
          'rollup, even if only to say it surfaced no gap.'
      );
    }
  }
  return problems;
}

/** Section ids a markdown RFC defines, from its `## N.` and `### N.N.` headings. */
export function rfcSectionsFrom(text) {
  const ids = new Set();
  for (const match of text.matchAll(/^#{2,4}\s+(\d+(?:\.\d+)*)\.?(?:\s|$)/gm)) {
    ids.add(match[1]);
  }
  return ids;
}

// ── plumbing ─────────────────────────────────────────────────────────────────

function report(problems) {
  if (!problems.length) return false;
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  return true;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function exists(path) {
  return access(path).then(() => true, () => false);
}

/** Every `*.fds.json` under a platform's fixtures directory, relative to it. */
async function fidelityFixtures(slug) {
  const base = join(ROOT, PLATFORMS_DIR, slug, 'fixtures');
  const entries = await readdir(base, { recursive: true, withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.fds.json'))
    .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
    .sort();
}

// ── self-test ────────────────────────────────────────────────────────────────

function selfTest({ versionsOf, schemaOf, compile, rfcSections }) {
  const failures = [];
  let cases = 0;
  const expect = (label, problems, fragment) => {
    cases += 1;
    if (problems.length && problems.join('\n').includes(fragment)) return;
    failures.push(`self-test: ${label} was not reported${problems.length ? `; got: ${problems.join('\n')}` : ''}`);
  };
  const expectClean = (label, problems) => {
    cases += 1;
    if (!problems.length) return;
    failures.push(`self-test: ${label} was reported when it should not have been: ${problems.join('\n')}`);
  };

  expect(
    'a declared platform with no directory',
    reconcile({ platforms: [{ slug: 'ghost', mode: 'fidelity' }], dirs: [], present: () => true }),
    'does not exist'
  );
  expect(
    'a directory with no registry row',
    reconcile({ platforms: [], dirs: ['orphan'], present: () => true }),
    'corpus.json does not declare it'
  );
  expect(
    'a platform missing its gap report',
    reconcile({
      platforms: [{ slug: 'p', mode: 'transform' }],
      dirs: ['p'],
      present: (_slug, file) => file !== 'gaps.md',
    }),
    'has no gaps.md'
  );
  expect(
    'an unknown mode',
    reconcile({ platforms: [{ slug: 'p', mode: 'sideways' }], dirs: ['p'], present: () => true }),
    'neither "transform" nor "fidelity"'
  );

  {
    cases += 1;
    if (fixtureEntity('workout.superset.fds.json') !== 'workout') {
      failures.push('self-test: fixtureEntity did not read the entity from a well-formed name');
    }
    cases += 1;
    if (fixtureEntity('not-a-fixture.json') !== null) {
      failures.push('self-test: fixtureEntity accepted a name that is not a fixture');
    }
  }

  expect(
    'a fixture naming an entity the platform does not produce',
    inspectFixture({
      file: 'x.fds.json',
      entity: 'program',
      doc: { schemaVersion: '1.0.0' },
      produces: ['workout'],
      versionsOf,
      schemaOf,
      compile,
    }),
    'corpus.json says this platform produces'
  );
  expect(
    'a fixture on an unpublished version',
    inspectFixture({
      file: 'x.fds.json',
      entity: 'workout',
      doc: { schemaVersion: '99.0.0' },
      produces: ['workout'],
      versionsOf,
      schemaOf,
      compile,
    }),
    'not published'
  );
  expect(
    'a fixture that does not validate',
    inspectFixture({
      file: 'x.fds.json',
      entity: 'workout',
      doc: { schemaVersion: versionsOf.get('workout') ? [...versionsOf.get('workout').keys()].find((v) => versionsOf.get('workout').get(v).status !== 'withdrawn') : '1.1.0' },
      produces: ['workout'],
      versionsOf,
      schemaOf,
      compile,
    }),
    'does not validate against workout'
  );

  expect(
    'a citation to a section that does not exist',
    rfcCitationProblems({ file: 'g.md', text: 'see RFC-007 §99.99', rfcSections }),
    'which that RFC does not have'
  );
  expect(
    'a citation to an RFC that does not exist',
    rfcCitationProblems({ file: 'g.md', text: 'see RFC-042 §1', rfcSections }),
    'there is no RFC-042'
  );
  expectClean(
    'a citation to a real section',
    rfcCitationProblems({ file: 'g.md', text: 'see RFC-007 §4.4', rfcSections })
  );

  expect(
    'a rollup missing a platform',
    rollupProblems({ text: 'covers wger', slugs: ['wger', 'trainerize'] }),
    'does not mention "trainerize"'
  );

  {
    cases += 1;
    const ids = rfcSectionsFrom('## 4. Reference\n### 4.4. `setPrescription`\n#### 8.1. Slots\n');
    if (!ids.has('4') || !ids.has('4.4') || !ids.has('8.1')) {
      failures.push(`self-test: rfcSectionsFrom missed a heading; got ${[...ids].join(', ')}`);
    }
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

const { manifest, versionsOf } = await loadManifest();

const schemas = new Map();
for (const [entity, versions] of versionsOf) {
  for (const [version, record] of versions) {
    if (!record.path) continue;
    schemas.set(
      `${entity}@${version}`,
      await readJson(join(ROOT, PUBLISHED_SCHEMAS, record.path))
    );
  }
}
const schemaOf = (entity, version) => schemas.get(`${entity}@${version}`);

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const compiled = new Map();
const compile = (key, schema) => {
  if (!compiled.has(key)) {
    const { $id, ...body } = schema;
    compiled.set(key, ajv.compile(body));
  }
  return compiled.get(key);
};

// The sections each RFC defines, read once, for the citation check.
const rfcSections = new Map();
for (const name of await readdir(join(ROOT, RFC_DIR)).catch(() => [])) {
  const match = /^rfc-0*(\d+)-/.exec(name);
  if (!match || !name.endsWith('.md')) continue;
  const number = String(Number(match[1])).padStart(3, '0');
  rfcSections.set(number, rfcSectionsFrom(await readFile(join(ROOT, RFC_DIR, name), 'utf8')));
}

if (process.argv.includes('--self-test')) {
  const { failures, cases } = selfTest({ versionsOf, schemaOf, compile, rfcSections });
  if (report(failures)) process.exit(1);
  console.log(`  ok    self-test: ${cases} rule(s) reported the input built to break them`);
}

const problems = [];

const corpus = await readJson(join(ROOT, CORPUS_DIR, 'corpus.json'));
const platforms = corpus.platforms ?? [];

// The platform directories actually present.
const dirs = (await readdir(join(ROOT, PLATFORMS_DIR), { withFileTypes: true }).catch(() => []))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const filePresence = new Map();
for (const dir of dirs) {
  const files = await readdir(join(ROOT, PLATFORMS_DIR, dir)).catch(() => []);
  filePresence.set(dir, new Set(files));
}
const present = (slug, file) => filePresence.get(slug)?.has(file) ?? false;

problems.push(...reconcile({ platforms, dirs, present }));

// ── each platform, in its mode ───────────────────────────────────────────────

const cliBuilt = await exists(join(ROOT, CLI_PATH));

for (const platform of platforms) {
  const slug = platform.slug;
  if (!dirs.includes(slug)) continue; // reconcile already reported it

  if (platform.mode === 'fidelity') {
    const fixtures = await fidelityFixtures(slug);
    if (fixtures.length === 0) {
      problems.push(
        `${PLATFORMS_DIR}/${slug}/ is a fidelity platform with no *.fds.json fixture ` +
          `under fixtures/.\n    Fidelity mode proves FDS can express the platform's ` +
          'artifacts by validating them; with no fixture it proves nothing.'
      );
      continue;
    }
    for (const path of fixtures) {
      const rel = path.slice(join(ROOT, '').length);
      let doc;
      try {
        doc = await readJson(path);
      } catch (error) {
        problems.push(`${rel} is not valid JSON: ${error.message}`);
        continue;
      }
      problems.push(
        ...inspectFixture({
          file: rel,
          entity: fixtureEntity(path.split('/').at(-1)),
          doc,
          produces: platform.produces,
          versionsOf,
          schemaOf,
          compile,
        })
      );
    }
  }

  if (platform.mode === 'transform') {
    const spec = platform.transform;
    if (!spec?.config || !spec?.source) {
      problems.push(
        `platform ${slug} is transform-mode but its corpus.json row has no ` +
          'transform.config and transform.source.'
      );
      continue;
    }
    if (!cliBuilt) {
      problems.push(
        `${CLI_PATH} does not exist, so transform-mode platform ${slug} cannot be run.\n` +
          `    Build the transformer first:\n      npm --prefix ${PACKAGE_DIR} ci\n` +
          `      npm --prefix ${PACKAGE_DIR} run build`
      );
      continue;
    }

    const configPath = join(ROOT, CORPUS_DIR, spec.config);
    const sourcePath = join(ROOT, CORPUS_DIR, spec.source);
    const outName = spec.output ?? 'exercises.json';
    const entity = spec.entity ?? 'exercise';
    const source = await readJson(sourcePath).catch(() => null);
    const outDir = await mkdtemp(join(tmpdir(), `fds-conformance-${slug}-`));

    try {
      await run(
        process.execPath,
        [
          join(ROOT, CLI_PATH), 'transform',
          '-i', sourcePath,
          '-c', configPath,
          '-o', outDir,
          '--no-enrichment',
          '--log-level', 'error',
        ],
        { cwd: ROOT }
      );

      const documents = await readJson(join(outDir, outName));
      if (!Array.isArray(documents)) {
        problems.push(`${slug}: the transform did not write an array of documents to ${outName}.`);
      } else {
        if (Array.isArray(source) && documents.length !== source.length) {
          problems.push(
            `${slug}: ${source.length} source record(s) in, ${documents.length} document(s) out.\n` +
              '    A record that fails validation is dropped, so a short output is a ' +
              'silent failure. Run the transform by hand; it reports each failed record.'
          );
        }
        for (const [index, document] of documents.entries()) {
          const version = document?.schemaVersion;
          const record = versionsOf.get(entity)?.get(version);
          if (!record?.path || record.status === 'withdrawn') {
            problems.push(
              `${slug} document ${index + 1} declares ${entity} ${JSON.stringify(version)}, ` +
                `which is ${record ? record.status : 'not published'}.`
            );
            continue;
          }
          const validate = compile(`${entity}@${version}`, schemaOf(entity, version));
          if (!validate(document)) {
            problems.push(
              `${slug} document ${index + 1} does not validate against ${entity} ${version}:\n` +
                validate.errors
                  .slice(0, 6)
                  .map((error) => `      ${error.instancePath || '/'} ${error.message}`)
                  .join('\n') +
                '\n    The transform produced something no consumer would accept.'
            );
          }
        }
      }
    } catch (error) {
      problems.push(
        `${slug}: the transform did not complete: ${error.stderr?.trim() || error.message}`
      );
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  }
}

// ── gap reports cite real RFC sections ───────────────────────────────────────

for (const dir of dirs) {
  if (!present(dir, 'gaps.md')) continue; // reconcile reported it
  const text = await readFile(join(ROOT, PLATFORMS_DIR, dir, 'gaps.md'), 'utf8');
  problems.push(...rfcCitationProblems({ file: `${PLATFORMS_DIR}/${dir}/gaps.md`, text, rfcSections }));
}

// ── the cross-platform rollup ────────────────────────────────────────────────

if (!(await exists(join(ROOT, ROLLUP_FILE)))) {
  problems.push(
    `${ROLLUP_FILE} does not exist.\n` +
      '    The corpus exists to produce one cross-platform picture of where the ' +
      'RFCs hold and where they do not; that picture is the rollup.'
  );
} else {
  const text = await readFile(join(ROOT, ROLLUP_FILE), 'utf8');
  problems.push(...rfcCitationProblems({ file: ROLLUP_FILE, text, rfcSections }));
  problems.push(...rollupProblems({ text, slugs: platforms.map((p) => p.slug).filter(Boolean) }));
}

if (report(problems)) process.exit(1);
console.log(
  `  ok    conformance: ${platforms.length} platform(s) validated against the published schemas, ` +
    'gaps cite real RFC sections'
);
