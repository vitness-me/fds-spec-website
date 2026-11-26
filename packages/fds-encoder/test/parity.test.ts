// Parity with the reference tool. Every key, comparison, cross-check, build and match below runs through both the
// package and the reference tool, and the results must be identical. The reference tool is imported from the path in
// FDS_ENCODER_REFERENCE; when the variable is unset, as it is in CI, the whole file is skipped.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import * as A from '../src/alphabet';
import { AnswerError, buildWith, openOptions } from '../src/builder/build';
import type { Answer, Answers } from '../src/builder/build';
import { compareFxe, compareFxi } from '../src/compare';
import { crossCheck, mainEquipment } from '../src/crosscheck';
import { FXM_MUSCLES } from '../src/fxm-alphabet';
import { expandFxm, gradeFxm, parseFxm } from '../src/fxm';
import { FXMG_ACTIONS, FXMG_SETS } from '../src/fxmg-alphabet';
import { buildFxmgIndex, fxmgMembers, fxmInFxmg, gradeFxmg, parseFxmg } from '../src/fxmg';
import { compareKeys } from '../src/keys';
import type { KeyComparison } from '../src/keys';
import { match } from '../src/match';
import type { MatchEntry, MatchResult } from '../src/match';
import { parseFxe, parseFxi } from '../src/syntax';
import { loadReference, present, REF, referenceAnswers, skipReason, warningCode } from './reference';
import type { Mod } from './reference';

const PKG = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(PKG, '../..');

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ───────────────────────────── the key corpus ─────────────────────────────

const KEY_TEXT = /(FX(?:MG|M|I|E)=[^\s`'"|)<>…\]\\,]+)/g;
function keysIn(text: string): string[] {
  return [...text.matchAll(KEY_TEXT)].map((m) => m[1]!.replace(/[.;:]+$/, ''));
}
function filesUnder(dir: string, ext: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => ext.test(f) && !f.includes('node_modules')).map((f) => join(dir, f));
}

/** Random exercise keys from the code lists, written loosely: unsorted, defaults spelt out, now and then a wrong code. */
function randomFxi(rnd: () => number): string {
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
  const some = (xs: readonly string[], max = 2): string => Array.from({ length: 1 + Math.floor(rnd() * max) }, () => pick(xs)).join('+');
  const actions = [...Object.keys(A.JOINT_ACTIONS), 'sh.?', 'hip.circ', 'kn.?'];
  const part = (): string => `${pick(['', '', '', '^', '~', '=', '%', '&'])}${rnd() < 0.05 ? pick(['0', '?']) : Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => pick(actions) + (rnd() < 0.05 ? '-' : '')).join('+')}`;
  const phase = (): string => (rnd() < 0.1 ? `${part()}|${part()}` : part());
  const points = Object.keys(A.BODY_POINTS);
  const tokens = Object.keys(A.EQUIPMENT_TOKENS);
  const load = (): string => (rnd() < 0.2 ? 'none' : Array.from({ length: 1 + Math.floor(rnd() * 2) }, () =>
    `${rnd() < 0.05 ? '?' : pick(tokens)}${rnd() < 0.15 ? `*${1 + Math.floor(rnd() * 3)}` : ''}@${rnd() < 0.05 ? '?' : pick([...points, 'overhead', 'assist'])}`).join('+'));
  const layers: string[] = [`m:${rnd() < 0.05 ? '?' : Array.from({ length: 1 + Math.floor(rnd() * 2) }, phase).join('>')}`];
  if (rnd() < 0.95) layers.push(`o:${rnd() < 0.05 ? pick(['?', '*']) : pick(Object.keys(A.ORIENTATIONS)) + (rnd() < 0.05 ? `>${pick(Object.keys(A.ORIENTATIONS))}` : '')}`);
  if (rnd() < 0.15) layers.push(`k:${pick([...Object.keys(A.MOVING_END), '?'])}`);
  if (rnd() < 0.2) layers.push(`f:${pick(Object.keys(A.FOOTWORK))}`);
  if (rnd() < 0.3) layers.push(`s:${Array.from({ length: 1 + Math.floor(rnd() * 2) }, () => `${pick(tokens)}${rnd() < 0.7 ? `@${some(points).replaceAll('+', ',')}` : ''}`).join('+')}`);
  if (rnd() < 0.95) layers.push(`l:${rnd() < 0.05 ? '?' : load()}`);
  if (rnd() < 0.3) layers.push(`x:${pick(['b', 'u', 'a', 'rc', 'u@arms', 'a@legs', 'rc@legs+u@arms', '?'])}`);
  if (rnd() < 0.3) layers.push(`g:${some(Object.keys(A.GRIP_ELEMENTS), 3)}${rnd() < 0.1 ? `>${pick(Object.keys(A.HAND_ORIENTATIONS))}` : ''}`);
  if (rnd() < 0.2) layers.push(`r:${some(Object.keys(A.RANGES))}`);
  if (rnd() < 0.2) layers.push(`h:${some(Object.keys(A.HELD))}`);
  if (rnd() < 0.15) layers.push(`p:${some(Object.keys(A.LINES))}`);
  if (rnd() < 0.1) layers.push(`a:${some(Object.keys(A.ACCESSORIES))}`);
  if (rnd() < 0.03) layers.push(pick(['z:1', 'o:sitting', 'l:dumbbell@hands', 'm:el.bend']));
  const ordered = rnd() < 0.2 ? layers.sort(() => rnd() - 0.5) : layers;
  return `FXI=1.0${rnd() < 0.9 ? 'S' : 'N'}/${ordered.join('/')}`;
}

/** Random equipment keys: every kind with random layer values, extended layers and now and then a combination. */
function randomFxe(rnd: () => number): string {
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
  const config = (): string => {
    const k = pick([...Object.keys(A.FXE_KINDS), '?']) as A.FxeKind | '?';
    if (k === '?' || k === 'none') return `k:${k}`;
    const out = [`k:${k}`];
    const forms = Object.entries(A.FORMS).filter(([, f]) => f.k === k || rnd() < 0.02).map(([c]) => c);
    if (A.FXE_STANDARD[k].includes('f')) out.push(`f:${rnd() < 0.1 ? '?' : pick(forms)}`);
    if (k === 'erg') out.push(`c:${pick([...Object.keys(A.ERG_TRACKS), '?'])}`);
    if (k === 'mac' || k === 'erg') {
      out.push(`l:${rnd() < 0.1 ? '?' : [pick(Object.keys(A.BODY_POINTS)), ...(rnd() < 0.2 ? [pick(Object.keys(A.BODY_POINTS))] : [])].join('+')}`);
      out.push(`s:${rnd() < 0.1 ? '?' : pick(Object.keys(A.ORIENTATIONS))}`);
      out.push(`m:${rnd() < 0.1 ? '?' : k === 'erg' ? pick(Object.keys(A.ERG_CYCLES)) : rnd() < 0.5 ? pick(A.MAC_SINGLE_JOINT) : `${pick(A.MAC_VERBS)}.${pick(Object.keys(A.MAC_DIRECTIONS))}`}`);
    }
    if (rnd() < 0.3) out.push(`r:${pick(Object.keys(A.DRIVES))}`);
    if (rnd() < 0.3 && k !== 'erg') out.push(`c:${pick([...Object.keys(A.COMPLIANCE), ...Object.keys(A.MAC_CONSTRAINTS)])}`);
    if (rnd() < 0.2) out.push(`g:${pick(Object.keys(A.GUIDE_ANGLES))}`);
    if (rnd() < 0.2) out.push(`a:${pick(Object.keys(A.DESIGN_ATTRS))}`);
    return out.join('/');
  };
  return `FXE=1.0${pick(['S', 'N', ''])}/${rnd() < 0.08 ? `${config()};${config()}` : config()}`;
}

function randomMuscleKeys(rnd: () => number): string[] {
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
  const terms = [
    ...FXM_MUSCLES.flatMap((m) => [m.token, ...(m.parts ?? []).map((p) => `${m.token}.${p.token}`)]),
    ...FXMG_SETS.map((s) => s.code), ...FXMG_ACTIONS.map((a) => `a:${a.action}`), 'thigh.lateral', 'glutes', 'a:ank.ev',
  ];
  const out: string[] = [];
  for (let i = 0; i < 1500; i++) {
    out.push(`FXMG=1.0/${Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => pick(terms)).join('+')}`);
    const m = pick(FXM_MUSCLES);
    out.push(`FXM=1.0${pick(['', '', 'S'])}/${m.token}${rnd() < 0.4 ? `.${pick([...(m.parts ?? []).map((p) => p.token), 'lateral', 'upper'])}` : ''}`);
  }
  return out;
}

// ───────────────────────────── random answers ─────────────────────────────

function randomAnswer(q: { select: string; max?: number }, options: readonly { id: string; exclusive?: boolean }[], rnd: () => number): Answer {
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
  const usual = options.find((o) => o.id === 'usual');
  if (q.select === 'one') return usual !== undefined && rnd() < 0.45 ? 'usual' : pick(options).id;
  if (usual !== undefined && rnd() < 0.45) return ['usual'];
  const excl = options.filter((o) => o.exclusive);
  const free = options.filter((o) => !o.exclusive);
  if (free.length === 0 || (excl.length > 0 && rnd() < 0.15)) return [pick(excl.length > 0 ? excl : free).id];
  const n = 1 + Math.floor(rnd() * Math.min(q.max ?? 3, free.length));
  return [...new Set(Array.from({ length: n }, () => pick(free).id))];
}

const relationOf = (c: KeyComparison): string =>
  c.result === 'same' ? 'identical' : c.result === 'more-specific' ? (c.specific === 'a' ? 'refines' : 'refined-by') : c.result === 'overlap' ? 'compatible' : 'contradicting';

describe.skipIf(!present)('parity with the reference tool', async () => {
  // A skipped suite is still collected; without the reference tool there is nothing to import.
  if (!present) { test.skip(skipReason, () => {}); return; }
  const R = await loadReference();

  // Keys quoted anywhere in the docs, the published examples, both test suites and the reference manual, then random ones.
  const quoted = new Set<string>();
  for (const f of [
    ...filesUnder(join(REPO, 'website/docs/core-concepts'), /\.md$/), ...filesUnder(join(REPO, 'specification/schemas'), /\.json$/),
    ...filesUnder(join(PKG, 'test'), /\.ts$/), ...filesUnder(join(REF, 'test'), /\.ts$/), join(REF, 'encoding-manual-v1.md'),
  ]) for (const k of keysIn(readFileSync(f, 'utf8'))) quoted.add(k);
  const rnd = rng(20261126);
  const random = [...Array.from({ length: 6000 }, () => randomFxi(rnd)), ...Array.from({ length: 2500 }, () => randomFxe(rnd)), ...randomMuscleKeys(rnd)];

  // Keys built from random answers, through the package's flow; the reference tool gets the same answers.
  const walks: { answers: Answers; built?: { fxi: string | null; fxe: string }; rejected?: boolean }[] = [];
  const wrnd = rng(1126);
  for (let i = 0; i < 6000; i++) {
    const answers: Record<string, Answer> = {};
    try {
      const b = buildWith(`w${i}`, (q, reading) => {
        const a = q.id === 'subject' ? (wrnd() < 0.2 ? 'equipment' : 'usual') : randomAnswer(q, wrnd() < 0.85 ? openOptions(q, reading) : q.options, wrnd);
        answers[q.id] = a;
        return a;
      });
      walks.push({ answers, built: { fxi: b.fxi, fxe: b.fxe } });
    } catch (e) {
      if (!(e instanceof AnswerError)) throw e;
      walks.push({ answers, rejected: true });
    }
  }
  const built = walks.flatMap((w) => (w.built === undefined ? [] : [w.built.fxi, w.built.fxe].filter((k): k is string => k !== null)));
  const corpus = [...new Set([...quoted, ...random, ...built])];
  const byType = (re: RegExp): string[] => corpus.filter((k) => re.test(k));
  const fxis = byType(/^FXI=/);
  const fxes = byType(/^FXE=/);
  const fxms = byType(/^FXM=/);
  const fxmgs = byType(/^FXMG=/);

  test('the corpus is large and covers every key type, valid and not', () => {
    console.log(`parity corpus: ${corpus.length} keys (${fxis.length} FXI, ${fxes.length} FXE, ${fxms.length} FXM, ${fxmgs.length} FXMG), ${quoted.size} quoted, ${walks.filter((w) => w.built).length} built`);
    expect(corpus.length).toBeGreaterThan(10000);
    for (const list of [fxis, fxes, fxms, fxmgs]) {
      expect(list.filter((k) => checkOk(k)).length).toBeGreaterThan(50);
      expect(list.filter((k) => !checkOk(k)).length).toBeGreaterThan(10);
    }
  });
  const checkOk = (k: string): boolean => (k.startsWith('FXMG=') ? parseFxmg(k) : k.startsWith('FXM=') ? parseFxm(k) : k.startsWith('FXE=') ? parseFxe(k) : parseFxi(k)).ok;

  test('the code lists are the reference tool\'s', () => {
    for (const name of ['JOINTS', 'JOINT_ACTIONS', 'ORIENTATIONS', 'IMPLIED_POINTS', 'MOVING_END', 'FOOTWORK', 'BODY_POINTS', 'HOLD_ONLY', 'SYMMETRY', 'SYMMETRY_SCOPES',
      'GRIP_ELEMENTS', 'RANGES', 'HELD', 'LINES', 'ACCESSORIES', 'FXE_KINDS', 'FORMS', 'MAC_DIRECTIONS', 'ERG_CYCLES', 'ERG_TRACKS', 'DRIVES', 'MAC_CONSTRAINTS',
      'COMPLIANCE', 'GUIDE_ANGLES', 'DESIGN_ATTRS', 'EQUIPMENT_TOKENS', 'FXI_LAYERS']) {
      expect(Object.keys((A as Mod)[name]), name).toEqual(Object.keys(R.alphabet[name]));
    }
    for (const name of ['ACTION_PARENT', 'RANGE_PARENT', 'OPPOSITE_ACTIONS', 'HELD_CONFLICTS', 'CIRC_JOINTS', 'START_RANGES', 'MAC_VERBS', 'MAC_SINGLE_JOINT', 'FXE_STANDARD', 'FXE_EXTENDED', 'IMPLIED_POINTS']) {
      expect((A as Mod)[name], name).toEqual(R.alphabet[name]);
    }
    const formFacts = (forms: Mod): unknown => Object.fromEntries(Object.entries(forms).map(([c, f]) => [c, { k: f.k, r: f.r, c: f.c, parent: f.parent }]));
    expect(formFacts(A.FORMS)).toEqual(formFacts(R.alphabet.FORMS));
    const tokenFacts = (t: Mod): unknown => Object.fromEntries(Object.entries(t).map(([c, v]) => [c, { fxe: v.fxe, load: v.load, parent: v.parent }]));
    expect(tokenFacts(A.EQUIPMENT_TOKENS)).toEqual(tokenFacts(R.alphabet.EQUIPMENT_TOKENS));
  });

  test('the muscle and category data are the reference tool\'s', () => {
    expect(FXM_MUSCLES).toEqual(R.fxmAlphabet.FXM_MUSCLES);
    expect(FXMG_SETS).toEqual(R.fxmgAlphabet.FXMG_SETS);
    expect(FXMG_ACTIONS).toEqual(R.fxmgAlphabet.FXMG_ACTIONS);
    expect([...buildFxmgIndex()]).toEqual([...R.fxmg.buildFxmgIndex()]);
  });

  test('every key checks the same and has the same written form', () => {
    const diff: unknown[] = [];
    for (const k of corpus) {
      const [mine, theirs] = k.startsWith('FXMG=') ? [parseFxmg(k), R.fxmg.parseFxmg(k)] : k.startsWith('FXM=') ? [parseFxm(k), R.fxm.parseFxm(k)]
        : k.startsWith('FXE=') ? [parseFxe(k), R.syntax.parseFxe(k)] : [parseFxi(k), R.syntax.parseFxi(k)];
      const a = { ok: mine.ok, written: mine.canonical, issues: mine.issues.map((i) => i.code) };
      const b = { ok: theirs.ok, written: theirs.canonical, issues: theirs.issues.map((i: { code: string }) => i.code) };
      if (JSON.stringify(a) !== JSON.stringify(b)) diff.push({ k, a, b });
    }
    expect(diff.slice(0, 5)).toEqual([]);
  });

  test('every comparison gives the same result', () => {
    const crnd = rng(7);
    const pick = <T>(xs: readonly T[]): T => xs[Math.floor(crnd() * xs.length)]!;
    const diff: unknown[] = [];
    let n = 0;
    const pairs = (list: string[], count: number): [string, string][] => Array.from({ length: count }, () => [pick(list), pick(list)] as [string, string]);
    // Keys with the same motion meet often enough to give every result, not only `different`.
    const byMotion = new Map<string, string[]>();
    for (const k of fxis.filter(checkOk)) { const m = parseFxi(k).layers.m ?? '?'; byMotion.set(m, [...(byMotion.get(m) ?? []), k]); }
    const sameMotion = [...byMotion.values()].filter((g) => g.length > 1);
    for (const [a, b] of [...pairs(fxis, 8000), ...Array.from({ length: 8000 }, () => { const g = pick(sameMotion); return [pick(g), pick(g)] as [string, string]; })]) {
      n++;
      const mine = compareFxi(a, b);
      const theirs = R.compare.compareFxi(a, b);
      if (JSON.stringify(mine) !== JSON.stringify(theirs)) diff.push({ a, b, mine: mine.relation, theirs: theirs.relation });
      if (mine.relation !== 'invalid' && relationOf(compareKeys(a, b)) !== theirs.relation) diff.push({ a, b, api: compareKeys(a, b).result });
    }
    for (const [a, b] of pairs(fxes, 8000)) {
      n++;
      const mine = compareFxe(a, b);
      const theirs = R.compare.compareFxe(a, b);
      if (JSON.stringify(mine) !== JSON.stringify(theirs)) diff.push({ a, b, mine: mine.relation, theirs: theirs.relation });
    }
    const validFxm = fxms.filter(checkOk);
    const validFxmg = fxmgs.filter(checkOk);
    for (const [a, b] of pairs(validFxm, 3000)) { n++; if (JSON.stringify(gradeFxm(a, b)) !== JSON.stringify(R.fxm.gradeFxm(a, b))) diff.push({ a, b }); }
    for (const [a, b] of pairs(validFxmg, 5000)) { n++; if (JSON.stringify(gradeFxmg(a, b)) !== JSON.stringify(R.fxmg.gradeFxmg(a, b))) diff.push({ a, b }); }
    for (let i = 0; i < 5000; i++) {
      const [m, g] = [pick(validFxm), pick(validFxmg)];
      n++;
      if (JSON.stringify(fxmInFxmg(m, g)) !== JSON.stringify(R.fxmg.fxmInFxmg(m, g))) diff.push({ m, g });
    }
    for (const g of validFxmg) { n++; if (JSON.stringify(fxmgMembers(g)) !== JSON.stringify(R.fxmg.fxmgMembers(g))) diff.push({ g }); }
    for (const m of validFxm) { n++; if (JSON.stringify(expandFxm(m)) !== JSON.stringify(R.fxm.expandFxm(m))) diff.push({ m }); }
    console.log(`parity comparisons: ${n}`);
    expect(diff.slice(0, 5)).toEqual([]);
  });

  test('every cross-check and main equipment is the same', () => {
    const xrnd = rng(11);
    const pick = <T>(xs: readonly T[]): T => xs[Math.floor(xrnd() * xs.length)]!;
    const diff: unknown[] = [];
    const exercises = walks.flatMap((w) => (w.built?.fxi ? [w.built] : []));
    const pairs: [string, string][] = [
      ...exercises.map((b) => [b.fxi!, b.fxe] as [string, string]),
      ...Array.from({ length: 6000 }, () => [pick(fxis), pick(fxes)] as [string, string]),
    ];
    for (const [i, e] of pairs) {
      const mine = crossCheck(i, e).map((w) => w.code);
      const theirs = (R.crosscheck.crossCheck(i, e) as string[]).map(warningCode);
      if (JSON.stringify(mine) !== JSON.stringify(theirs)) diff.push({ i, e, mine, theirs });
    }
    for (const k of fxis) {
      const p = parseFxi(k);
      if (p.ok && JSON.stringify(mainEquipment(p.layers)) !== JSON.stringify(R.crosscheck.mainEquipment(R.syntax.parseFxi(k).layers))) diff.push({ k });
    }
    console.log(`parity cross-checks: ${pairs.length}`);
    expect(diff.slice(0, 5)).toEqual([]);
  });

  test('the same answers build the same keys, and the same answers are rejected', () => {
    const diff: unknown[] = [];
    for (const w of walks) {
      const answers = referenceAnswers(w.answers);
      let theirs: { fxi: string | null; fxe: string } | 'rejected';
      try { const b = R.build.build({ id: 'w', answers }); theirs = { fxi: b.fxi, fxe: b.fxe }; } catch (e) {
        if (!(e instanceof R.build.AnswerError)) throw e;
        theirs = 'rejected';
      }
      const mine = w.built ?? 'rejected';
      if (JSON.stringify(mine) !== JSON.stringify(theirs)) diff.push({ answers: w.answers, mine, theirs });
    }
    console.log(`parity builds: ${walks.length} (${walks.filter((w) => w.built).length} built, ${walks.filter((w) => w.rejected).length} rejected)`);
    expect(walks.filter((w) => w.built).length).toBeGreaterThan(2000);
    expect(diff.slice(0, 5)).toEqual([]);
  });

  test('every machine motion builds the same keys with its default contact and posture', () => {
    const singles = A.MAC_SINGLE_JOINT;
    const multi = A.MAC_VERBS.flatMap((v) => Object.keys(A.MAC_DIRECTIONS).map((d) => [v, d] as const));
    const motions: Answers[] = [...singles.map((m) => ({ motion: m })), ...multi.map(([v, d]) => ({ motion: v, direction: d })), { motion: 'unknown' }];
    const answerSets: Answers[] = [];
    for (const m of motions) {
      const eq = { 'eq.mac.motion': m.motion as string, ...(m.direction === undefined ? {} : { 'eq.mac.direction': m.direction as string }) };
      const ex = { 'mac.motion': m.motion as string, ...(m.direction === undefined ? {} : { 'mac.direction': m.direction as string }) };
      for (const contact of ['usual', 'feet', 'unknown']) {
        for (const posture of ['usual', 'seated', 'unknown']) {
          answerSets.push({ subject: 'equipment', 'eq.kind': 'mac', ...eq, 'eq.mac.contact': [contact], 'eq.mac.posture': posture, 'eq.details': 'usual', 'eq.more': 'usual' });
        }
        for (const [orientation, chest] of [['seated', 'usual'], ['standing', 'yes'], ['seated.chest', 'no'], ['supine.incline', 'usual']] as const) {
          answerSets.push({
            subject: 'usual', changes: ['stance'], 'motion.phases': '1', 'p1.kind': 'usual', 'p1.joints': ['hip', 'kn'], 'p1.hip': ['ext'], 'p1.kn': ['ext'],
            'p1.short': ['usual'], 'p1.also': 'usual', orientation, load: 'machine', ...ex, 'mac.contact': contact, 'mac.chest': chest, symmetry: 'usual', stance: 'wide',
          });
        }
      }
    }
    const outcome = (f: () => { fxi: string | null; fxe: string }, isAnswerError: (e: unknown) => boolean): unknown => {
      try { const b = f(); return { fxi: b.fxi, fxe: b.fxe }; } catch (e) { if (isAnswerError(e)) return 'rejected'; throw e; }
    };
    const diff: unknown[] = [];
    for (const answers of answerSets) {
      const mine = outcome(() => buildWith('m', (q) => answers[q.id], Object.keys(answers)), (e) => e instanceof AnswerError);
      const ref = referenceAnswers(answers);
      const theirs = outcome(() => R.build.build({ id: 'm', answers: ref }), (e) => e instanceof R.build.AnswerError);
      if (JSON.stringify(mine) !== JSON.stringify(theirs)) diff.push({ answers, mine, theirs });
    }
    console.log(`parity machine builds: ${answerSets.length}`);
    expect(diff.slice(0, 5)).toEqual([]);
  });

  test('matching gives the same candidates', () => {
    const mrnd = rng(13);
    const pick = <T>(xs: readonly T[]): T => xs[Math.floor(mrnd() * xs.length)]!;
    const NAMES = ['Barbell back squat', 'Dumbbell curl', 'Sentadilla con barra', 'Cable row', 'Plank', 'Hip thrust', 'Curl', 'Squat', ''];
    const valid = fxis.filter(checkOk);
    const exercises = walks.flatMap((w) => (w.built?.fxi ? [w.built] : []));
    const entry = (id: string): MatchEntry => {
      const b = mrnd() < 0.5 && exercises.length > 0 ? pick(exercises) : { fxi: pick(valid), fxe: mrnd() < 0.5 ? pick(fxes) : '' };
      return { id, key: b.fxi!, name: pick(NAMES), ...(b.fxe === '' || mrnd() < 0.3 ? {} : { fxe: b.fxe }) };
    };
    const asReference = (e: MatchEntry): Mod => ({ id: e.id, fxi: e.key, name: e.name, fxe: e.fxe, fxiProvenance: 'owner', fxiGap: null });
    const fromReference = (r: Mod): MatchResult | Mod => {
      const cands = (r.candidates ?? []).map((c: Mod) => (c.via === 'fxi'
        ? { id: c.id, via: 'key', result: c.relation === 'identical' ? 'same' : c.relation === 'compatible' ? 'overlap' : 'more-specific', ...(c.relation === 'refines' ? { specific: 'a' } : c.relation === 'refined-by' ? { specific: 'b' } : {}) }
        : c));
      if (r.kind === 'absent') return r;
      return r.kind === 'auto' ? { kind: 'identical', id: r.id } : { kind: 'confirm', candidates: cands };
    };
    const diff: unknown[] = [];
    let n = 0;
    for (let i = 0; i < 600; i++) {
      const library = Array.from({ length: Math.floor(mrnd() * 12) }, (_, j) => entry(`lib${j}`));
      if (library.length > 0 && mrnd() < 0.4) library.push({ ...pick(library), id: 'twin' });
      const query = mrnd() < 0.4 && library.length > 0 ? { ...pick(library), id: 'q' } : entry('q');
      const top = 1 + Math.floor(mrnd() * 5);
      n++;
      const mine = match(query, library, { top });
      const theirs = fromReference(R.match.match(asReference(query), library.map(asReference), { top }));
      const shape = mine.kind === 'identical' ? { kind: 'identical', id: mine.id } : mine.kind === 'confirm' ? { kind: 'confirm', candidates: mine.candidates } : mine;
      if (JSON.stringify(shape) !== JSON.stringify(theirs)) diff.push({ query, library, top, mine: shape, theirs });
    }
    console.log(`parity matches: ${n}`);
    expect(diff.slice(0, 3)).toEqual([]);
  });
});
