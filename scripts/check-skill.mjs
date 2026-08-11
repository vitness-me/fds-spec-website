#!/usr/bin/env node
/**
 * The skill's knowledge base describes a standard that exists, describes all of
 * it, and does not hide behind the method document shipped beside it.
 *
 * `packages/fds-skill/` is a knowledge base an assistant answers from. Wrong
 * knowledge there is worse than none: it produces confident, specific, invalid
 * output, and the person asking has no way to tell.
 *
 * That is not hypothetical. Writing the workout and program sections by hand
 * produced six wrong names in one sitting — `dropSet` for `drop`, `waveLoading`
 * for `wave`, a rest method `none` that does not exist while omitting `ratio`,
 * `max` where an AMRAP target uses `cap`, a `notation` field on tempo, and a
 * rest scope `exercise` instead of `round`. Every one would have validated as
 * prose and failed as data. A seventh survived every green run until this check
 * was widened: `heatmap.areaIds`, for a muscle heatmap that is actually
 * `regions: [{ areaId, weight }]`.
 *
 * ── What the previous version of this file missed ────────────────────────────
 *
 * It read two of the twelve files, and inside those two it read only fenced
 * ```typescript blocks. `SKILL.md` contains no TypeScript, so the entry-point
 * document of the skill contributed exactly zero literals. The gate was
 * therefore presence-only: deleting every Workout, Program and Prescription
 * section left it green, and so did planting a wrong field name in prose.
 *
 * Two lessons are built into what replaced it. Read *everything* — prose,
 * fenced blocks in any language, JSON examples, prompts, `CLAUDE.md`. And check
 * for *silence* as well as for error, because a knowledge base fails far more
 * often by omitting a thing than by misspelling it.
 *
 * ── Six rules ────────────────────────────────────────────────────────────────
 *
 *   1. NAMES.  Every FDS name the skill states exists in the standard. Names
 *      are taken from prose backticks, from TypeScript property declarations
 *      and string literals, and from JSON keys.
 *
 *   2. REFERENCES.  Every schema or registry URL the skill quotes resolves to a
 *      file the manifest publishes, and none is at a *withdrawn* version.
 *      `check:versions` enforces this repository-wide and is the stronger
 *      statement; it is restated here so that the gate guarding the knowledge
 *      base does not depend on another gate's scope staying what it is today.
 *
 *   3. PATHS.  Every repository path the skill points a reader at exists.
 *      `CLAUDE.md` shipped eight that did not — five RFCs under their
 *      pre-rename filenames and three registries under a directory that was
 *      never published — and nothing read them.
 *
 *   4. COVERAGE.  Every entity and library the current release names is
 *      documented. See DOCUMENTED below; this is the rule the old gate had no
 *      form of at all.
 *
 *   5. EXAMPLES.  Every JSON file the skill ships is either validated against a
 *      published schema or declared, in the file, not to be FDS. The
 *      transformed-exercise example claimed `schemaVersion: "1.0.0"`, a version
 *      that was withdrawn and 404s.
 *
 *   6. METHOD.  `AGENT.md` states no fact the knowledge owns. See below.
 *
 * ── The method document, and why it is checked backwards ─────────────────────
 *
 * The package ships two things with different lifetimes. `SKILL.md` and
 * `knowledge/` are what is true, rewritten every release and held to rules 1..5.
 * `AGENT.md` is how to work — resolve before constructing a URL, validate before
 * claiming, say which claim you could not check — and it changes almost never,
 * because a procedure has no release.
 *
 * That only stays true if the procedure never restates a fact. A persona saying
 * "FDS has seven entities, currently at release X" is a second copy of the
 * manifest inside a document nobody thinks to update, which is the bug this
 * whole repository is organised against. So rule 6 asks the *opposite* question
 * to rule 1: not "is every name here real" but "is any name here real at all".
 * Together the two mean the method document backticks no bare identifier, which
 * is exactly the shape of a document that carries no facts.
 *
 * Three things are refused: a version number anywhere in it, a backticked name
 * any FDS schema defines, and a reference to a published schema or registry
 * path. All three are derived — from the schemas and from the manifest — so
 * there is no list here to keep in step with anything.
 *
 * What rule 6 cannot see is a count written in words. "Seven entities" names
 * nothing and versions nothing, and a regular expression that caught it would
 * catch every other numeral too. It is left uncaught rather than approximated,
 * on the grounds that a count with no name attached is not knowledge anyone can
 * act on.
 *
 * The other half of this is subtraction, and it matters more than the rule. The
 * method document is excluded from the vocabulary rule 4 reads, so a name spoken
 * only there does not count as documented. Without that, adding any second
 * document to this package silently weakens the coverage gate on the first: the
 * knowledge could drop `metricType` entirely and stay green because a procedure
 * happened to use the word.
 *
 * ── What DOCUMENTED means, and why ───────────────────────────────────────────
 *
 * An entity is documented when the skill names *every* property, `enum` member
 * and `const` its current schema authors, plus its schema URL.
 *
 * The obvious rule — "the word `workout` appears somewhere" — is worthless: a
 * table of contents passes it. The useful question is whether an assistant
 * reading only this skill could answer about the entity without inventing
 * anything, and that is a question about vocabulary. So the requirement is
 * derived from the schema rather than declared here: `documentableVocabulary`
 * takes the names a document author can type and the closed sets they must
 * choose from, and drops `$defs` keys (internal identifiers nobody writes) and
 * `examples` (recommended values, which are `check:registries`' subject).
 *
 * The threshold is 100%, which sounds brittle and is not. A missing name means
 * one of two things: the schema gained something the skill has not been told
 * about — exactly the drift this exists to catch — or the skill is describing
 * an entity it never really learned. `body-atlas` was the second kind: one
 * table row, one URL, and no mention of `views` or `areas`, which are both
 * *required*. A percentage threshold would have called that documented.
 *
 * Matching is on whole tokens. A substring test would score `set` as covered by
 * the word "settings" and `left` by `left-lateral`, which is how a coverage
 * number gets to be high and meaningless.
 *
 * The entity list comes from `specification/releases.json`, so publishing an
 * entity extends this gate with no edit here.
 *
 * ── Declaring a name that is not FDS ─────────────────────────────────────────
 *
 * A knowledge base about transformation necessarily names things that are not
 * FDS: the source format's `gifUrl`, the transformer's `fuzzyMatch`, and the
 * counter-examples `isCircuit` and `emomInterval` that exist in the text
 * precisely because they do *not* exist in the schema. Those are declared where
 * they are used, so a reviewer sees the claim next to the text making it:
 *
 *   <!-- fds:not-a-field gifUrl, bodyPart — source database fields, not FDS -->
 *
 *   ```json fds:not-a-field — a transformer mapping config, not an FDS document
 *
 *   "$comment": "fds:not-a-field — a source schema, not an FDS document"
 *
 * A declaration is scoped to the file it appears in (or the block, or the JSON
 * file), it must carry a reason after an em dash, and the totals are asserted
 * in EXPECTED below. A budget is the difference between an escape hatch and a
 * hole: widening it is an edit to this file in the same diff.
 *
 *   node scripts/check-skill.mjs
 *   node scripts/check-skill.mjs --self-test
 */

import { readFile } from 'node:fs/promises';
import { join, dirname, relative, resolve } from 'node:path';
import { globalVocabulary, mappingVocabulary, documentableVocabulary } from './lib/vocabulary.mjs';
import { loadManifest, schemaReferences, filesUnder, ROOT } from './lib/releases.mjs';

/**
 * `--self-test` runs every rule over `scripts/fixtures/skill/` and requires it
 * to fail in exactly the recorded way.
 *
 * A gate that has only ever passed has not been tested, and this one had only
 * ever passed. The fixtures are the failures it exists for: a planted wrong
 * field name, a deleted entity, a withdrawn schema URL, a path that does not
 * exist, an example that does not validate, and a method document that has
 * started restating the manifest.
 */
const SELF_TEST = process.argv.includes('--self-test');
const SKILL = SELF_TEST ? 'scripts/fixtures/skill' : 'packages/fds-skill';
const EXPECTED_FAILURES = 'scripts/fixtures/skill/expected-failures.txt';

/**
 * The method document: how an assistant works, rather than what is true.
 *
 * One filename, checked by rule 6 and subtracted from rule 4's vocabulary.
 * Vendor-neutral on purpose — a harness-specific agent file inside an npm
 * package bets the package on one vendor's format outliving the standard.
 */
const METHOD = 'AGENT.md';

/**
 * How much of the skill is allowed to say "this name is not FDS", exactly.
 *
 * `names` counts declared names across all files, `blocks` fenced blocks that
 * opt out whole, `files` JSON files that do. Asserted rather than logged: a
 * number in a log still grows quietly.
 */
const EXPECTED = { names: 25, blocks: 9, files: 1 };

/**
 * `package.json` is an npm manifest. `files`, `keywords` and `exports` are npm's
 * vocabulary, its description is marketing prose, and neither is a claim about
 * FDS. Reading it would mean declaring npm's field names as not-FDS, which
 * teaches a reviewer nothing.
 *
 * `package-lock.json` is the same argument with no room for disagreement: it is
 * generated by npm, npm rewrites it on every install, and any `$comment`
 * declaring it not-FDS would be erased the next time someone ran the command
 * that produces it. `LICENSE` carries no extension and so is never swept, but
 * it is named here anyway so the packaging files are one visible list rather
 * than two — one enforced and one accidental.
 */
const NOT_KNOWLEDGE = new Set([
  'package.json',
  'package-lock.json',
  'LICENSE',
  'expected-failures.txt',
]);

/**
 * Vocabulary that is real but belongs to something other than the standard.
 *
 * JSON Schema's own keywords appear because the prompts show the response
 * schema they expect back, which is the correct way to write a prompt.
 */
const JSON_SCHEMA_KEYWORDS = new Set([
  '$schema', '$id', '$ref', '$defs', '$comment', 'type', 'properties', 'required',
  'items', 'enum', 'const', 'default', 'examples', 'description', 'title',
  'additionalProperties', 'minItems', 'maxItems', 'minimum', 'maximum',
  'minLength', 'maxLength', 'pattern', 'format', 'oneOf', 'anyOf', 'allOf', 'not',
]);

/**
 * Containers whose keys belong to whoever wrote the document, not to FDS.
 *
 * Every one of these is declared open by a schema: `attributes` and `extensions`
 * are the vendor extension mechanism, `params`, `modeParams`, `schemeParams` and
 * `progressionState` are `Record<string, unknown>` by construction, and the
 * transformer's `options` is `{"type": "object"}` with a one-line description
 * saying it is transform-specific. Checking their keys against the standard
 * would flag every correct worked example of an open payload.
 *
 * Descent stops at the key, so this is a statement about structure rather than
 * a list of forgiven names: `attributes` may contain anything, at any depth.
 */
const OPEN_PAYLOADS = new Set([
  'attributes', 'extensions', 'params', 'modeParams', 'schemeParams',
  'progressionState', 'options',
]);

/** A single path segment that could be an FDS name: lowerCamel, or kebab. */
const NAME_SEGMENT = /^(?:[a-z][A-Za-z0-9]*|[a-z0-9]+(?:-[a-z0-9]+)+)$/;
/** A filename, which is a path question rather than a name question. */
const FILE_EXTENSION = /\.(?:json|md|ts|mjs|js|svg|ya?ml|gif|png|jpe?g|html|txt|sh|csv)$/i;
/** An illustrative UUID. Kebab-shaped, and not a name. */
const UUID_ISH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i;

const problems = [];
const fail = (message) => problems.push(message);

// ── Load what the standard says ───────────────────────────────────────────────

const { manifest, versionsOf, currentOf } = await loadManifest();
const release = manifest.releases?.[manifest.currentRelease] ?? {};
/** Everything the current release names, entity or library, in one list. */
const released = Object.entries({ ...(release.entities ?? {}), ...(release.libraries ?? {}) });

const fdsNames = await globalVocabulary();
const toolingNames = await mappingVocabulary();
/** Schema names — `workout`, `muscle-category` — read as prose nouns constantly. */
const schemaNames = new Set(Object.keys(manifest.schemas ?? {}));

const isKnown = (name) =>
  fdsNames.has(name) ||
  toolingNames.has(name) ||
  schemaNames.has(name) ||
  JSON_SCHEMA_KEYWORDS.has(name);

// ── Read the skill ────────────────────────────────────────────────────────────

const files = (await filesUnder(SKILL)).filter((file) => !NOT_KNOWLEDGE.has(file));
if (!files.length) fail(`${SKILL}/ has no files to check.`);

const documents = [];
for (const file of files) {
  const text = await readFile(join(ROOT, SKILL, file), 'utf8');
  documents.push({ file, path: `${SKILL}/${file}`, text });
}

/**
 * Every token in the *knowledge*, for the coverage question "is this name said".
 *
 * The method document is subtracted. It is held to rule 1 like everything else —
 * a name it states must be real — but a name only it states is not documentation
 * of anything, and letting it count would mean a procedure's word choice could
 * satisfy the gate that guards the knowledge.
 */
const spoken = new Set();
for (const { file, text } of documents) {
  if (file === METHOD) continue;
  for (const token of text.match(/[A-Za-z0-9_$-]+/g) ?? []) spoken.add(token);
  // A second pass including `/`, so that `n/a` — a real enum member in two
  // schemas — can be found at all. It only ever adds tokens.
  for (const token of text.match(/[A-Za-z0-9_$/-]+/g) ?? []) spoken.add(token);
}

// ── Rule 1: every name the skill states exists ────────────────────────────────

/**
 * A backticked or quoted span, reduced to the FDS names it claims.
 *
 * `metadata.externalRefs[0].id` claims three names; `workout/v1.0.0/w.json`
 * claims none, because it is a path; `^[a-z0-9-]{2,}$` claims none, because it
 * is a pattern. Returning null means "this span is not naming fields".
 */
function namesIn(span) {
  if (FILE_EXTENSION.test(span) || UUID_ISH.test(span)) return null;
  if (!/^[A-Za-z0-9_.[\]-]+$/.test(span)) return null;
  const segments = span.replace(/\[\d*\]/g, '').split('.').filter(Boolean);
  if (!segments.length || !segments.every((s) => NAME_SEGMENT.test(s))) return null;
  return segments;
}

const fencesOf = (text) => [...text.matchAll(/^```([^\n]*)\n([\s\S]*?)^```/gm)];
const proseOf = (text) => fencesOf(text).reduce((rest, m) => rest.split(m[0]).join('\n'), text);
const stripComments = (code) =>
  code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

/** `<!-- fds:not-a-field a, b — reason -->`, and the same marker on a fence. */
const DECLARATION = /fds:not-a-field\s*([^\n>`]*)/;

function parseDeclaration(raw, where) {
  const [namePart, ...reasonParts] = raw.split('—');
  const reason = reasonParts.join('—').trim();
  if (!reason) {
    fail(`${where}: an fds:not-a-field declaration with no reason after the em dash.`);
  }
  return namePart
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

let declaredNames = 0;
let declaredBlocks = 0;
let declaredFiles = 0;

for (const doc of documents) {
  const { path, text } = doc;
  const declared = new Set();

  if (path.endsWith('.md')) {
    for (const [, raw] of text.matchAll(/<!--\s*fds:not-a-field([^>]*?)-->/g)) {
      const names = parseDeclaration(raw, path);
      for (const name of names) declared.add(name);
      declaredNames += names.length;
    }
  }

  const unknown = new Map(); // name -> where first seen
  const see = (name, where) => {
    if (isKnown(name) || declared.has(name)) return;
    if (!unknown.has(name)) unknown.set(name, where);
  };

  if (path.endsWith('.json')) {
    // A JSON file declares itself whole, in its own `$comment`, or not at all.
    // Its keys are not swept here: whatever it validates against (Rule 5) closes
    // `additionalProperties`, so a key that does not exist is already an error
    // there, said in the schema's own words.
    const whole = /"\$comment"\s*:\s*"fds:not-a-field([^"]*)"/.exec(text);
    doc.declaredWhole = Boolean(whole);
    if (whole) {
      parseDeclaration(whole[1], path);
      declaredFiles += 1;
    }
  } else if (path.endsWith('.md')) {
    for (const [, span] of proseOf(text).matchAll(/`([^`\n]+)`/g)) {
      for (const name of namesIn(span) ?? []) see(name, 'prose');
    }

    for (const [whole, info, body] of fencesOf(text)) {
      const language = info.trim().split(/\s+/)[0] ?? '';
      if (DECLARATION.test(info)) {
        parseDeclaration(DECLARATION.exec(info)[1], `${path} (fenced ${language || 'block'})`);
        declaredBlocks += 1;
        continue;
      }
      const line = text.slice(0, text.indexOf(whole)).split('\n').length;
      if (language === 'typescript' || language === 'ts') {
        // Comments go first: `// note: \`cap\`, not \`max\`` explains a mistake
        // rather than making one. Only here — running the same strip over JSON
        // truncates every `"http://…"` at the `//` and makes the block
        // unparseable, which is how a structural read silently becomes a
        // textual one.
        const code = stripComments(body);
        // Property declarations. The old check read only quoted literals, which
        // is why `areaIds` — an unquoted interface property — survived.
        for (const [, property] of code.matchAll(/^\s*([a-z_$][\w$]*)\??\s*:/gm)) {
          see(property, `typescript block at line ${line}`);
        }
        for (const [, literal] of code.matchAll(/'([^'\n]+)'/g)) {
          for (const name of namesIn(literal) ?? []) see(name, `typescript block at line ${line}`);
        }
      } else {
        // Keys only. A value in an illustrative block is `"uuid-v4-here"` or
        // `"strength|cardio|..."` — shape, not vocabulary. Enum members are
        // checked where they are actually asserted, in prose and in TypeScript.
        //
        // A block that parses is read structurally, so descent can stop at an
        // open payload. One that does not — most of them, because documentation
        // elides with `...` — falls back to a flat sweep, which is stricter.
        const where = `${language || 'fenced'} block at line ${line}`;
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = undefined;
        }
        if (parsed !== undefined) {
          const descend = (node) => {
            if (Array.isArray(node)) return node.forEach(descend);
            if (!node || typeof node !== 'object') return;
            for (const [key, value] of Object.entries(node)) {
              for (const name of namesIn(key) ?? []) see(name, where);
              if (!OPEN_PAYLOADS.has(key)) descend(value);
            }
          };
          descend(parsed);
        } else {
          for (const [, key] of body.matchAll(/"([^"\n]+)"\s*:/g)) {
            for (const name of namesIn(key) ?? []) see(name, where);
          }
        }
      }
    }
  }

  if (unknown.size) {
    fail(
      `${path}: ${unknown.size} name(s) no schema defines:\n` +
        [...unknown.entries()]
          .sort()
          .map(([name, where]) => `    '${name}' — ${where}`)
          .join('\n') +
        '\n    Wrong knowledge is worse than none. Check the name against the schema,\n' +
        '    or declare it with <!-- fds:not-a-field ' +
        [...unknown.keys()].sort().join(', ') +
        ' — reason -->.'
    );
  }
}

if (!SELF_TEST) {
  const counted = { names: declaredNames, blocks: declaredBlocks, files: declaredFiles };
  for (const [kind, expected] of Object.entries(EXPECTED)) {
    if (counted[kind] !== expected) {
      fail(
        `${SKILL}: ${counted[kind]} declared not-a-field ${kind}, EXPECTED says ${expected}.\n` +
          '    Every declaration is a claim that a name is not part of the standard.\n' +
          '    If the new one is right, raise EXPECTED in scripts/check-skill.mjs in this diff.'
      );
    }
  }
}

// ── Rule 2: every schema and registry reference resolves ──────────────────────

const publishedRegistries = new Set(await filesUnder('specification/registries'));

/**
 * Published directory prefix -> schema name. `exercises/` is exercise's and
 * `atlas/` is body-atlas's; neither is guessable from the name.
 *
 * Derived from the paths the manifest records rather than written out, so it
 * cannot disagree with the tree. A withdrawn version has no path of its own —
 * there are no bytes — which is exactly why the prefix has to come from a
 * sibling version that does.
 */
const prefixOwner = new Map();
for (const [name, versions] of versionsOf) {
  for (const { path } of versions.values()) {
    if (path) prefixOwner.set(path.slice(0, path.lastIndexOf(`/v`)), name);
  }
}

const publishedSchemaPaths = new Set(
  [...versionsOf.values()].flatMap((versions) => [...versions.values()].map((v) => v.path)).filter(Boolean)
);

for (const { path, text } of documents) {
  for (const reference of schemaReferences(text)) {
    if (reference.kind === 'registries') {
      if (!publishedRegistries.has(reference.path)) {
        fail(`${path}:${reference.line}: quotes registries/${reference.path}, which is not published.`);
      }
      continue;
    }
    if (publishedSchemaPaths.has(reference.path)) continue;

    const owner = prefixOwner.get(reference.path.slice(0, reference.path.lastIndexOf('/v')));
    const status = owner ? versionsOf.get(owner)?.get(reference.version)?.status : null;
    fail(
      `${path}:${reference.line}: quotes ${reference.path}, which is not published.` +
        (status === 'withdrawn'
          ? `\n    ${owner} ${reference.version} is withdrawn — it 404s, and no release names it any more.` +
            `\n    The current version is ${currentOf.get(owner)}.`
          : '')
    );
  }
}

// ── Rule 3: every repository path the skill points at exists ─────────────────

const repository = new Set([
  ...(await filesUnder('specification')).map((p) => `specification/${p}`),
  ...(await filesUnder('packages')).map((p) => `packages/${p}`),
  ...(await filesUnder('scripts')).map((p) => `scripts/${p}`),
]);
const directories = new Set();
for (const path of repository) {
  const parts = path.split('/');
  for (let i = 1; i < parts.length; i += 1) directories.add(parts.slice(0, i).join('/'));
}

const PATH_ROOTS = ['specification/', 'packages/', 'scripts/', 'website/'];

/**
 * Paths are read from prose only.
 *
 * A path inside a worked example is the *operator's* — `"local":
 * "./registries/muscles.registry.json"` names a file on their disk, and
 * resolving it against this repository would flag every correct example of a
 * local registry. A path in prose is an instruction to the reader: go and look
 * at this. That one has to exist.
 */
for (const { path, text } of documents) {
  if (!path.endsWith('.md')) continue;
  const prose = proseOf(text);
  const claimed = new Set(schemaReferences(text).map((r) => r.text));
  const spans = [
    ...[...prose.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]),
    ...[...prose.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]),
  ];
  for (const span of spans) {
    if (claimed.has(span) || /\s|:\/\/|\{\{|[*?<>|]/.test(span)) continue;
    if (!span.includes('/')) continue;
    let candidate = null;
    if (span.startsWith('/')) candidate = span.slice(1);
    else if (span.startsWith('./') || span.startsWith('../')) {
      candidate = relative(ROOT, resolve(join(ROOT, dirname(path)), span));
    } else if (PATH_ROOTS.some((root) => span.startsWith(root))) candidate = span;
    if (candidate === null || candidate.startsWith('..')) continue;
    candidate = candidate.replace(/\/$/, '');
    if (repository.has(candidate) || directories.has(candidate)) continue;
    fail(`${path}: points a reader at ${span}, which does not exist.`);
  }
}

// ── Rule 4: every entity and library the release names is documented ─────────

const schemaOf = new Map();
for (const [name, version] of released) {
  const entry = versionsOf.get(name)?.get(version);
  if (!entry?.path) {
    fail(`${SKILL}: release ${manifest.currentRelease} names ${name} ${version}, which has no published path.`);
    continue;
  }
  schemaOf.set(name, {
    entry,
    schema: JSON.parse(await readFile(join(ROOT, 'specification/schemas', entry.path), 'utf8')),
  });
}

for (const [name, { entry, schema }] of schemaOf) {
  const gaps = [];
  if (!spoken.has(name)) gaps.push(`it is never named`);
  if (!documents.some((doc) => doc.text.includes(entry.$id))) {
    gaps.push(`its schema URL ${entry.$id} appears nowhere`);
  }

  const missingRequired = (schema.required ?? []).filter((property) => !spoken.has(property));
  if (missingRequired.length) {
    gaps.push(`${missingRequired.length} required top-level field(s) unmentioned: ${missingRequired.join(', ')}`);
  }

  const vocabulary = documentableVocabulary(schema);
  const missing = [...vocabulary].filter((word) => !spoken.has(word)).sort();
  if (missing.length) {
    gaps.push(
      `${missing.length} of ${vocabulary.size} names unmentioned:\n      ` + missing.join(', ')
    );
  }

  if (gaps.length) {
    fail(
      `${SKILL}: ${name} ${entry.version} is not documented.\n` +
        gaps.map((gap) => `    - ${gap}`).join('\n') +
        '\n    An assistant answering from this skill would have to invent the rest.'
    );
  }
}

// ── Rule 5: every example the skill ships validates ──────────────────────────

const jsonFiles = documents.filter((doc) => doc.path.endsWith('.json'));

let Ajv;
let addFormats;
if (jsonFiles.some((doc) => !doc.declaredWhole)) {
  try {
    Ajv = (await import('ajv/dist/2020.js')).default;
    addFormats = (await import('ajv-formats')).default;
  } catch {
    console.error(
      'ajv is not installed. Run `npm install --no-save ajv@8 ajv-formats@3`\n' +
        '(the schemas CI job installs it before this step, in check:doc-examples).'
    );
    process.exit(1);
  }
}

const ajv = Ajv ? new Ajv({ strict: false, allErrors: true }) : null;
if (ajv) addFormats(ajv);

const validators = new Map();
async function validatorFor(path) {
  if (!validators.has(path)) {
    const schema = JSON.parse(await readFile(join(ROOT, 'specification/schemas', path), 'utf8'));
    validators.set(path, ajv.compile(schema));
  }
  return validators.get(path);
}

/**
 * Which entity a document is, from its shape.
 *
 * Every entity schema closes `additionalProperties` at the root, so the set of
 * top-level names each permits is known and a document whose keys fit exactly
 * one of them has named itself. Guessing where more than one fits is how a
 * document passes against the wrong schema, so ambiguity is an error.
 */
function entityOf(document) {
  const keys = Object.keys(document);
  const fits = [];
  for (const [name, { schema }] of schemaOf) {
    if (schema.kind === 'library') continue;
    const permitted = new Set(Object.keys(schema.properties ?? {}));
    if (!permitted.size) continue;
    if (!keys.every((key) => permitted.has(key))) continue;
    if (!(schema.required ?? []).every((key) => keys.includes(key))) continue;
    fits.push(name);
  }
  return fits;
}

const describe = (errors) =>
  (errors ?? [])
    .slice(0, 6)
    .map((error) => `      ${error.instancePath || '/'} ${error.message}`)
    .join('\n');

for (const doc of jsonFiles) {
  if (doc.declaredWhole) continue;
  let parsed;
  try {
    parsed = JSON.parse(doc.text);
  } catch (error) {
    fail(`${doc.path}: is not parseable JSON — ${error.message}`);
    continue;
  }

  const records = Array.isArray(parsed) ? parsed : [parsed];
  for (const [index, record] of records.entries()) {
    const at = Array.isArray(parsed) ? `${doc.path}[${index}]` : doc.path;
    if (!record || typeof record !== 'object') {
      fail(`${at}: is not a JSON object, so nothing can validate it.`);
      continue;
    }

    // A `$schema` naming something FDS publishes is the document telling us
    // outright. The transformer mapping schema is reached this way and no other.
    const declaredSchema = typeof record.$schema === 'string' ? record.$schema : null;
    const byId = declaredSchema
      ? [...versionsOf.values()]
          .flatMap((versions) => [...versions.values()])
          .find((entry) => entry.$id === declaredSchema)
      : null;
    if (declaredSchema && !byId) {
      fail(`${at}: declares $schema ${declaredSchema}, which the manifest does not publish.`);
      continue;
    }

    let target = byId ?? null;
    if (!target) {
      if (typeof record.schemaVersion !== 'string') {
        fail(
          `${at}: has neither a published $schema nor a schemaVersion, so nothing can say what it is.\n` +
            '    Add one, or declare the file with "$comment": "fds:not-a-field — reason".'
        );
        continue;
      }
      const fits = entityOf(record);
      if (fits.length !== 1) {
        fail(
          `${at}: its top-level keys fit ${fits.length === 0 ? 'no' : fits.join(' and ')} entity` +
            (fits.length === 0 ? ', so it is not a valid FDS document of any kind.' : ', so which one is a guess.')
        );
        continue;
      }
      const [name] = fits;
      const entry = versionsOf.get(name)?.get(record.schemaVersion);
      if (!entry?.path) {
        const status = entry?.status ?? 'never published';
        fail(
          `${at}: claims ${name} ${record.schemaVersion}, which is ${status}.\n` +
            `    The current version is ${currentOf.get(name)}.`
        );
        continue;
      }
      target = entry;
    }

    const validate = await validatorFor(target.path);
    if (!validate(record)) {
      fail(
        `${at}: does not validate against ${target.path}.\n` +
          describe(validate.errors) +
          '\n    An example that does not validate teaches the reader to write one that does not either.'
      );
    }
  }
}

// ── Rule 6: the method document states no fact the knowledge owns ────────────

const method = documents.find((doc) => doc.file === METHOD);

if (!method) {
  fail(
    `${SKILL}: has no ${METHOD}.\n` +
      '    The package ships knowledge and a method, and the method is what an assistant\n' +
      '    follows when the knowledge does not answer the question. Restore it, or take\n' +
      `    ${METHOD} out of "files" and "exports" and out of this check in the same diff.`
  );
} else {
  // The whole text rather than prose only. A fenced command in a procedure is
  // still the procedure talking, and it should be naming a tool rather than a
  // field.
  const versions = [...new Set(method.text.match(/\b\d+\.\d+\.\d+\b/g) ?? [])];
  if (versions.length) {
    fail(
      `${SKILL}/${METHOD}: states ${versions.length} version number(s): ${versions.join(', ')}.\n` +
        '    A procedure has no version. Whatever this number answers, the manifest at\n' +
        '    https://spec.vitness.me/releases.json answers it correctly and for ever; say\n' +
        '    to read it there instead.'
    );
  }

  const owned = new Set();
  for (const [, span] of method.text.matchAll(/`([^`\n]+)`/g)) {
    for (const name of namesIn(span) ?? []) {
      if (fdsNames.has(name) || schemaNames.has(name)) owned.add(name);
    }
  }
  if (owned.size) {
    fail(
      `${SKILL}/${METHOD}: names ${owned.size} thing(s) the standard defines: ` +
        `${[...owned].sort().join(', ')}.\n` +
        '    Rule 1 asks whether a name is real; this asks whether it belongs here, and a\n' +
        '    name the schemas define belongs in the knowledge, once. Say what to do with a\n' +
        '    field of that kind rather than which field it is.'
    );
  }

  const references = schemaReferences(method.text);
  if (references.length) {
    fail(
      `${SKILL}/${METHOD}: quotes ${references.length} published path(s): ` +
        `${[...new Set(references.map((r) => r.path))].sort().join(', ')}.\n` +
        '    Every one of them names a version, and the method outlives every version.\n' +
        '    Say to resolve the entity against the manifest and build the URL from what it\n' +
        '    returns.'
    );
  }
}

// ── Result ────────────────────────────────────────────────────────────────────

if (SELF_TEST) {
  // A bare version is normalised out of the recorded keys; one inside a path is
  // not. A release moves workout from 1.1.0 to 1.2.0 and all eight coverage
  // lines would otherwise change at once, which trains whoever ships it to
  // update this file without reading it. A *path* changing is a smaller, more
  // interesting event, and worth making someone look.
  const keys = problems
    .map((problem) => problem.split('\n')[0].trim().replace(/\b\d+\.\d+\.\d+\b/g, '<version>'))
    .sort();
  const recorded = (await readFile(join(ROOT, EXPECTED_FAILURES), 'utf8'))
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .sort();

  const missing = recorded.filter((line) => !keys.includes(line));
  const extra = keys.filter((line) => !recorded.includes(line));
  if (missing.length || extra.length) {
    console.error(
      '\nThe fixtures no longer fail the way they were recorded.\n\n' +
        missing.map((line) => `  no longer fails: ${line}`).join('\n') +
        (missing.length && extra.length ? '\n' : '') +
        extra.map((line) => `  newly fails:     ${line}`).join('\n') +
        `\n\nEither the check changed or ${EXPECTED_FAILURES} is stale. Both need a human.\n`
    );
    process.exit(1);
  }
  console.log(`  ok    self-test — the fixtures fail in all ${recorded.length} recorded ways`);
  process.exit(0);
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

const vocabularySize = [...schemaOf.values()].reduce(
  (total, { schema }) => total + documentableVocabulary(schema).size,
  0
);
console.log(
  `  ok    skill knowledge — ${files.length - 1} files: every name real, ` +
    `${schemaOf.size} released schemas documented across ${vocabularySize} names; ` +
    `${METHOD} states none of them`
);
