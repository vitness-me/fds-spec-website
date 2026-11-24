#!/usr/bin/env node
/**
 * The structural descriptor conformance vectors pass against the reference
 * encoder, at 100% in every tier.
 *
 * The vectors in `specification/descriptors/conformance/` are what any FXI,
 * FXE or FXM implementation is tested on. They are data, not code: each is an
 * input and the output the specification requires, so a second
 * implementation runs the same files with its own adapter. This script is the
 * adapter for the reference, `packages/fds-encoder`, run from its build
 * output. Four tiers, one file each:
 *
 *   syntax    parse, validate, canonicalise; the issue codes of an invalid string
 *   builder   answers record → FXI and FXE, byte for byte
 *   compare   the relation of a pair, overall and per layer; FXM grades
 *   resolver  the match protocol: auto, confirm with its reason and ranked list, absent
 *
 * Besides running them, it checks the suite itself, because a vector file
 * that drifts from what it claims to cover passes just as quietly as one that
 * is right:
 *
 *   - Every tier this script runs has a file, and every file names a tier it
 *     runs or is a data file a tier file references. An orphan fails.
 *   - Each tier file names the rules revision its vectors were written for,
 *     and it must be the rules revision of the descriptor registries and of
 *     the encoder. A rules revision that moves on without the vectors fails.
 *   - Vector ids are unique within a tier.
 *   - The syntax file defines every issue code a vector expects, and every
 *     code it defines is expected by some vector. The resolver file does the
 *     same for confirm reasons, and its reasons are exactly the reference's.
 *   - Every compare vector for FXI or FXE also runs with its sides swapped,
 *     expecting the inverse relation, so a pair cannot pass one way only.
 *   - Every builder error vector gives `fix`, the one change that makes its
 *     entry build, and with it applied the entry does build: the vector fails
 *     for the reason it states and no other.
 *
 * It needs the built encoder (`npm --prefix packages/fds-encoder run build`).
 *
 *   node scripts/check-conformance.mjs              run the suite
 *   node scripts/check-conformance.mjs --self-test  prove it fails on the fixtures
 */

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { CONFORMANCE_DIR as VECTOR_DIR, CONFORMANCE_TIERS as TIERS, REGISTRY_DIR, loadDescriptors } from './lib/descriptors.mjs';
import { assertRecordedFailures } from './lib/self-test.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SELF_TEST = process.argv.includes('--self-test');
const FIXTURES = join(REPO, 'scripts/fixtures/conformance');
const DIR = join(SELF_TEST ? FIXTURES : REPO, VECTOR_DIR);
const ENCODER = join(REPO, 'packages/fds-encoder/dist/index.js');

if (!existsSync(ENCODER)) {
  console.error(
    `The conformance suite runs against the built reference encoder, and ${ENCODER.slice(REPO.length + 1)} does not exist.\n` +
      '    Build it: npm --prefix packages/fds-encoder ci && npm --prefix packages/fds-encoder run build'
  );
  process.exit(1);
}
const enc = await import(pathToFileURL(ENCODER).href);

const problems = [];
const fail = (key, message) => problems.push({ key, message });
const show = (value) => JSON.stringify(value);

// ── load ─────────────────────────────────────────────────────────────────────

const files = {};
for (const name of (await readdir(DIR)).filter((f) => f.endsWith('.json')).sort()) {
  files[name] = JSON.parse(await readFile(join(DIR, name), 'utf8'));
}
const tierFiles = {};
const referenced = new Set();
for (const [name, doc] of Object.entries(files)) {
  if (doc.tier === undefined) continue;
  if (!TIERS.includes(doc.tier)) {
    fail(`unknown-tier:${name}`, `${VECTOR_DIR}/${name}: tier "${doc.tier}" is not one this suite runs (${TIERS.join(', ')}).`);
    continue;
  }
  if (tierFiles[doc.tier]) fail(`two-files:${doc.tier}`, `${VECTOR_DIR}: ${tierFiles[doc.tier]} and ${name} both claim tier "${doc.tier}". One file per tier.`);
  tierFiles[doc.tier] = name;
  for (const field of ['words', 'vocabulary']) if (typeof doc[field] === 'string') referenced.add(doc[field]);
}
for (const tier of TIERS) {
  if (!tierFiles[tier]) fail(`missing-tier:${tier}`, `${VECTOR_DIR}: no file declares tier "${tier}". Each of ${TIERS.join(', ')} has one.`);
}
for (const name of Object.keys(files)) {
  if (files[name].tier === undefined && !referenced.has(name)) {
    fail(`orphan:${name}`, `${VECTOR_DIR}/${name}: no tier file references it. Reference it as "words" or "vocabulary", or delete it.`);
  }
}

/** A data file a tier file names, or undefined (and a failure) when it does not exist. */
function data(tierFile, field) {
  const name = files[tierFile]?.[field];
  if (name === undefined) return undefined;
  if (!files[name]) fail(`missing-data:${tierFile}:${name}`, `${VECTOR_DIR}/${tierFile}: "${field}" names ${name}, which is not in ${VECTOR_DIR}.`);
  return files[name];
}

// ── the suite agrees with the registries and the reference ───────────────────

const { registries, files: registryFiles } = await loadDescriptors(REPO);
for (const [tier, name] of Object.entries(tierFiles)) {
  const rules = files[name].rules;
  const stale = Object.entries(registries).find(([, doc]) => doc.rules !== rules);
  if (stale) {
    const [registry, doc] = stale;
    fail(
      `rules:${tier}`,
      `${VECTOR_DIR}/${name}: written for rules ${rules}, but ${REGISTRY_DIR}/${registryFiles[registry]} is rules ${doc.rules}.\n` +
        '    Review every vector against the new rules revision, then update "rules".'
    );
  }
  if (rules !== enc.FXI_RULES) fail(`rules-encoder:${tier}`, `${VECTOR_DIR}/${name}: written for rules ${rules}, but the built encoder implements ${enc.FXI_RULES}.\n    If the vectors and registries are current, rebuild the encoder: npm --prefix packages/fds-encoder run build`);
  const seen = new Set();
  for (const v of files[name].vectors ?? []) {
    if (seen.has(v.id)) fail(`duplicate:${tier}:${v.id}`, `${VECTOR_DIR}/${name}: vector id "${v.id}" is used twice.`);
    seen.add(v.id);
  }
  if (!files[name].vectors?.length) fail(`empty:${tier}`, `${VECTOR_DIR}/${name}: no vectors.`);
}

// ── tiers ────────────────────────────────────────────────────────────────────

const counts = {};
function record(tier, id, expected, actual) {
  counts[tier] ??= { run: 0, passed: 0 };
  counts[tier].run += 1;
  if (isDeepStrictEqual(expected, actual)) counts[tier].passed += 1;
  else fail(`${tier}:${id}`, `${tier} ${id}\n    expected ${show(expected)}\n    actual   ${show(actual)}`);
}

const vocabularyOf = (tierFile) => {
  const raw = data(tierFile, 'vocabulary');
  return raw === undefined ? undefined : enc.readFxmVocabulary(raw);
};

function runSyntax(file) {
  const doc = files[file];
  const vocabulary = vocabularyOf(file);
  const codes = doc.codes ?? {};
  const used = new Set();
  for (const v of doc.vectors) {
    const parse = { fxi: enc.parseFxi, fxe: enc.parseFxe, fxm: (s) => enc.parseFxm(s, v.vocabulary ? vocabulary : undefined) }[v.kind];
    if (!parse) { fail(`syntax-kind:${v.id}`, `syntax ${v.id}: kind "${v.kind}" is not fxi, fxe or fxm.`); continue; }
    const p = parse(v.input);
    const actual = p.ok ? { valid: true, canonical: p.canonical } : { valid: false, issues: [...new Set(p.issues.map((i) => i.code))].sort() };
    if (p.ok && v.expect.standard !== undefined) actual.standard = (v.kind === 'fxi' ? enc.standardFxi : enc.standardFxe)(v.input);
    record('syntax', v.id, v.expect, actual);
    for (const code of v.expect.issues ?? []) {
      used.add(code);
      if (!(code in codes)) fail(`syntax-code-undefined:${code}`, `syntax ${v.id}: expects issue "${code}", which ${file} does not define under "codes".`);
    }
  }
  for (const code of Object.keys(codes)) {
    if (!used.has(code)) fail(`syntax-code-untested:${code}`, `${VECTOR_DIR}/${file}: issue code "${code}" is defined but no vector expects it. Add a vector that breaks that rule.`);
  }
}

function runBuilder(file) {
  const doc = files[file];
  const raw = data(file, 'words');
  const flow = enc.createFlow(raw === undefined ? enc.NO_WORDS : enc.readWordSet(raw, `${VECTOR_DIR}/${doc.words}`));
  for (const v of doc.vectors) {
    const mode = v.mode ?? 'owner';
    let actual;
    try {
      const built = enc.build(v.entry, flow);
      const meta = enc.rowMeta(v.entry, mode);
      actual = { fxi: built.fxi, fxe: built.fxe };
      if (built.fxeFull !== undefined) actual.fxeFull = built.fxeFull;
      if (built.fxi !== null) Object.assign(actual, { fxiProvenance: meta.fxiProvenance, fxiGap: meta.fxiGap });
    } catch (e) {
      if (!(e instanceof enc.AnswerError)) throw e;
      actual = { error: true };
    }
    record('builder', v.id, v.expect, actual);
    if (v.expect.error === true) checkFix(v, flow, mode);
    else if (v.fix !== undefined) fail(`builder-fix-unexpected:${v.id}`, `builder ${v.id}: "fix" belongs to an error vector, and this one expects strings.`);
  }
}

/**
 * An error vector names the one change that makes its entry build, so it fails for the reason it states and no other:
 * a vector that also leaves a question unanswered would pass for an implementation that accepts what it claims to refuse.
 */
function checkFix(v, flow, mode) {
  if (v.fix === undefined) {
    fail(`builder-fix-missing:${v.id}`, `builder ${v.id}: an error vector gives "fix", the one change that makes the entry build. Add it, answering every other question.`);
    return;
  }
  const fixed = { ...v.entry, ...v.fix, answers: { ...v.entry.answers, ...(v.fix.answers ?? {}) } };
  try {
    enc.build(fixed, flow);
    enc.rowMeta(fixed, mode);
  } catch (e) {
    if (!(e instanceof enc.AnswerError)) throw e;
    fail(
      `builder-fix:${v.id}`,
      `builder ${v.id}: with "fix" applied the entry still does not build, so the vector fails for more than one reason:\n    ${e.problems.join('\n    ')}\n` +
        '    Answer every question but the one the vector breaks.'
    );
  }
}

const INVERSE = { refines: 'refined-by', 'refined-by': 'refines', narrower: 'broader', broader: 'narrower' };
const invert = (x) => INVERSE[x] ?? x;

function runCompare(file) {
  const doc = files[file];
  const vocabulary = vocabularyOf(file);
  for (const v of doc.vectors) {
    if (v.kind === 'fxm') {
      const g = enc.gradeFxm(v.a, v.b, vocabulary);
      record('compare', v.id, v.expect, { grade: g.grade, shared: [...g.shared], ...(g.container ? { container: g.container } : {}) });
      continue;
    }
    const run = (a, b) => { const r = enc.compare(a, b); return { relation: r.relation, layers: { ...r.layers } }; };
    record('compare', v.id, v.expect, run(v.a, v.b));
    const swapped = {
      relation: invert(v.expect.relation),
      layers: Object.fromEntries(Object.entries(v.expect.layers).map(([k, x]) => [k, invert(x)])),
    };
    record('compare', `${v.id} (swapped)`, swapped, run(v.b, v.a));
  }
}

function runResolver(file) {
  const doc = files[file];
  const reasons = doc.reasons ?? {};
  const used = new Set();
  for (const v of doc.vectors) {
    const r = enc.match(v.query, v.library, v.top === undefined ? {} : { top: v.top });
    const actual = r.kind === 'confirm' ? { kind: r.kind, reason: r.reason, candidates: r.candidates } : r;
    record('resolver', v.id, v.expect, actual);
    if (v.expect.reason !== undefined) {
      used.add(v.expect.reason);
      if (!(v.expect.reason in reasons)) fail(`resolver-reason-undefined:${v.expect.reason}`, `resolver ${v.id}: expects reason "${v.expect.reason}", which ${file} does not define under "reasons".`);
    }
  }
  for (const reason of Object.keys(reasons)) {
    if (!used.has(reason)) fail(`resolver-reason-untested:${reason}`, `${VECTOR_DIR}/${file}: reason "${reason}" is defined but no vector expects it.`);
  }
  const reference = Object.keys(enc.CONFIRM_REASONS).sort();
  const listed = Object.keys(reasons).sort();
  if (!isDeepStrictEqual(reference, listed)) {
    fail(
      'resolver-reasons-differ',
      `${VECTOR_DIR}/${file}: "reasons" lists ${show(listed)}, but the reference encoder can return ${show(reference)}.\n` +
        '    A reason the reference returns must be defined and tested here; a reason it cannot return must not be.'
    );
  }
}

const RUN = { syntax: runSyntax, builder: runBuilder, compare: runCompare, resolver: runResolver };
for (const tier of TIERS) if (tierFiles[tier]) RUN[tier](tierFiles[tier]);

// ── result ───────────────────────────────────────────────────────────────────

if (SELF_TEST) await assertRecordedFailures(join(FIXTURES, 'expected-failures.txt'), problems.map((p) => p.key));

const summary = TIERS.map((t) => {
  const c = counts[t] ?? { run: 0, passed: 0 };
  return `${t} ${c.passed}/${c.run}`;
}).join(', ');

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ${p.message}\n`);
  console.error(`  ${summary}`);
  process.exit(1);
}
console.log(`  ok    conformance at 100% against the reference encoder: ${summary}.`);
