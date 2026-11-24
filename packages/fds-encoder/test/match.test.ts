import { describe, expect, test } from 'vitest';
import { autoMatchRefusal, checkMatchRow, match, nameSimilarity } from '../src/match.js';
import type { MatchRow } from '../src/match.js';

const SQUAT = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing';
const BACK_SQUAT = `${SQUAT}/l:bb@back`;
/** Refines: the load is open. Ten standard layers equal. */
const SQUAT_LOAD_OPEN = `${SQUAT}/l:?`;
/** Refines: orientation and the hold point are open. Nine standard layers equal. */
const SQUAT_TWO_OPEN = 'FXI=1.0S/m:hip.ext+kn.ext/o:?/l:bb@?';
/** Compatible: orientation open and an extended accessory layer. */
const SQUAT_COMPATIBLE = 'FXI=1.0S/m:hip.ext+kn.ext/o:?/l:bb@back/a:strap';
/** Differs only in the load layer. */
const FRONT_SQUAT = `${SQUAT}/l:bb@shoulders`;
/** Differs only in the load layer; orientation open. */
const FRONT_SQUAT_OPEN = 'FXI=1.0S/m:hip.ext+kn.ext/o:?/l:bb@shoulders';
/** Differs in the load and the held posture. */
const PRISONER_DB_SQUAT = `${SQUAT}/l:db@hands/h:hands.head`;
/** Differs in motion and load. */
const CURL = 'FXI=1.0S/m:el.flex/o:standing/l:db@hands';

const BAR = 'FXE=1.0S/k:imp/f:bar.straight';
const ANY_IMPLEMENT = 'FXE=1.0S/k:imp/f:?';
const EZ_BAR = 'FXE=1.0S/k:imp/f:bar.ez';

const row = (id: string, fxi: string, extra: Partial<MatchRow> = {}): MatchRow => ({ id, fxi, fxiProvenance: 'owner', fxiGap: null, ...extra });
const query = (extra: Partial<MatchRow> = {}): MatchRow => row('q', BACK_SQUAT, { fxiProvenance: 'agent', ...extra });
const candidates = (r: ReturnType<typeof match>) => (r.kind === 'confirm' ? r.candidates : []);

describe('auto-match', () => {
  test('a unique identical FXI with owner provenance and no gap marker matches automatically', () => {
    const library = [row('lib:front', FRONT_SQUAT), row('lib:back', BACK_SQUAT)];
    expect(match(row('q', BACK_SQUAT), library)).toEqual({ kind: 'auto', id: 'lib:back' });
  });
  test('a gap marker or missing owner provenance refuses auto-match and lists the identical entry first', () => {
    const library = [row('lib:front', FRONT_SQUAT), row('lib:back', BACK_SQUAT)];
    const gap = match(row('q', BACK_SQUAT, { fxiGap: 'pause at the bottom' }), library);
    expect(gap).toMatchObject({ kind: 'confirm', why: 'the query carries a gap marker' });
    expect(candidates(gap)[0]).toEqual({ id: 'lib:back', via: 'fxi', relation: 'identical' });
    expect(match(row('q', BACK_SQUAT), [row('lib:back', BACK_SQUAT, { fxiGap: 'tempo' })])).toMatchObject({ kind: 'confirm', why: 'the library entry carries a gap marker' });
    expect(match(query(), library)).toMatchObject({ kind: 'confirm', why: 'the query has no owner provenance' });
    expect(autoMatchRefusal(row('q', BACK_SQUAT), row('l', BACK_SQUAT, { fxiProvenance: 'import' }))).toMatch(/provenance/);
  });
  test('the gap check fails closed: any marker but absent, null or false refuses auto-match', () => {
    const library = [row('lib:back', BACK_SQUAT)];
    for (const fxiGap of [true, '', '   ', 'tempo', { note: 'grip' }, 0] as unknown as MatchRow['fxiGap'][]) {
      expect(match(row('q', BACK_SQUAT, { fxiGap }), library)).toMatchObject({ kind: 'confirm', why: 'the query carries a gap marker' });
      expect(match(row('q', BACK_SQUAT), [row('lib:back', BACK_SQUAT, { fxiGap })])).toMatchObject({ kind: 'confirm', why: 'the library entry carries a gap marker' });
    }
    for (const fxiGap of [undefined, null, false]) expect(match(row('q', BACK_SQUAT, { fxiGap }), library)).toEqual({ kind: 'auto', id: 'lib:back' });
  });
  test('an import-mode row never auto-matches, whatever its provenance says', () => {
    const library = [row('lib:back', BACK_SQUAT)];
    expect(match(row('q', BACK_SQUAT, { mode: 'import' }), library)).toMatchObject({ kind: 'confirm', why: 'the query is an import' });
    expect(match(row('q', BACK_SQUAT), [row('lib:back', BACK_SQUAT, { mode: 'import' })])).toMatchObject({ kind: 'confirm', why: 'the library entry is an import' });
    expect(match(row('q', BACK_SQUAT, { mode: 'owner' }), library)).toEqual({ kind: 'auto', id: 'lib:back' });
  });
  test('several identical entries go to confirm', () => {
    expect(match(row('q', BACK_SQUAT), [row('a', BACK_SQUAT), row('b', BACK_SQUAT)])).toMatchObject({ kind: 'confirm', why: 'several library entries are identical' });
  });
});

describe('confirm list', () => {
  test('FXI candidates rank identical, then refines or refined-by, then compatible', () => {
    const library = [row('compatible', SQUAT_COMPATIBLE), row('refines', SQUAT_LOAD_OPEN), row('identical', BACK_SQUAT)];
    expect(candidates(match(query(), library))).toEqual([
      { id: 'identical', via: 'fxi', relation: 'identical' },
      { id: 'refines', via: 'fxi', relation: 'refines' },
      { id: 'compatible', via: 'fxi', relation: 'compatible' },
    ]);
  });
  test('within a tier, more standard layers marked identical rank first', () => {
    const library = [row('two-open', SQUAT_TWO_OPEN), row('one-open', SQUAT_LOAD_OPEN)];
    expect(candidates(match(query(), library)).map((c) => c.id).slice(0, 2)).toEqual(['one-open', 'two-open']);
  });
  test('then the FXE relation when both rows carry one: identical, then refines or refined-by, then anything else', () => {
    const library = [
      row('none', SQUAT_LOAD_OPEN),
      row('ez', SQUAT_LOAD_OPEN, { fxe: EZ_BAR }),
      row('any', SQUAT_LOAD_OPEN, { fxe: ANY_IMPLEMENT }),
      row('bar', SQUAT_LOAD_OPEN, { fxe: BAR }),
    ];
    expect(candidates(match(query({ fxe: BAR }), library, { top: 4 })).map((c) => c.id)).toEqual(['bar', 'any', 'none', 'ez']);
  });
  test('the FXE outranks the name, and the name outranks library order', () => {
    const library = [
      row('first', SQUAT_LOAD_OPEN, { name: 'Overhead walk' }),
      row('named', SQUAT_LOAD_OPEN, { name: 'Barbell back squat' }),
      row('equipped', SQUAT_LOAD_OPEN, { name: 'Overhead walk', fxe: BAR }),
      row('last', SQUAT_LOAD_OPEN, { name: 'Overhead walk' }),
    ];
    expect(candidates(match(query({ name: 'Barbell back squat', fxe: BAR }), library, { top: 4 })).map((c) => c.id)).toEqual(['equipped', 'named', 'first', 'last']);
  });
  test('a near-compatible entry differs in exactly one standard layer and follows every FXI candidate', () => {
    const library = [row('front', FRONT_SQUAT), row('prisoner', PRISONER_DB_SQUAT), row('compatible', SQUAT_COMPATIBLE)];
    expect(candidates(match(query(), library))).toEqual([
      { id: 'compatible', via: 'fxi', relation: 'compatible' },
      { id: 'front', via: 'near', layer: 'l' },
      { id: 'prisoner', via: 'name' },
    ]);
  });
  test('a near-compatible entry may have other layers open; near entries rank by name, then library order', () => {
    const library = [
      row('front-open', FRONT_SQUAT_OPEN, { name: 'Front squat' }),
      row('front', FRONT_SQUAT, { name: 'Barbell front squat' }),
      row('front-2', FRONT_SQUAT),
    ];
    expect(candidates(match(query({ name: 'Barbell back squat' }), library))).toEqual([
      { id: 'front', via: 'near', layer: 'l' },
      { id: 'front-open', via: 'near', layer: 'l' },
      { id: 'front-2', via: 'near', layer: 'l' },
    ]);
  });
  test('remaining places fill by name similarity alone, with no cut-off', () => {
    const library = [
      row('curl', CURL, { name: 'Dumbbell curl' }),
      row('prisoner', PRISONER_DB_SQUAT, { name: 'Prisoner squat' }),
      row('unnamed', CURL),
      row('back', CURL, { name: 'Barbell back squat' }),
    ];
    const r = match(query({ name: 'Barbell back squat' }), library);
    expect(r).toEqual({
      kind: 'confirm',
      why: 'no identical entry',
      candidates: [{ id: 'back', via: 'name' }, { id: 'prisoner', via: 'name' }, { id: 'curl', via: 'name' }],
    });
  });
  test('an entry is listed once, at its best place', () => {
    const library = [row('dup', SQUAT_LOAD_OPEN), row('dup', FRONT_SQUAT), row('other', CURL)];
    expect(candidates(match(query(), library))).toEqual([
      { id: 'dup', via: 'fxi', relation: 'refines' },
      { id: 'other', via: 'name' },
    ]);
  });
  test('absent only when the library is empty', () => {
    expect(match(query(), [])).toEqual({ kind: 'absent' });
    expect(match(query(), [row('curl', CURL)])).toEqual({ kind: 'confirm', why: 'no identical entry', candidates: [{ id: 'curl', via: 'name' }] });
  });
  test('top sets the list length; a bare number still works', () => {
    const library = [row('a', SQUAT_LOAD_OPEN), row('b', FRONT_SQUAT), row('c', CURL), row('d', CURL)];
    expect(candidates(match(query(), library))).toHaveLength(3);
    expect(candidates(match(query(), library, { top: 1 })).map((c) => c.id)).toEqual(['a']);
    expect(candidates(match(query(), library, 2)).map((c) => c.id)).toEqual(['a', 'b']);
  });
});

describe('name similarity', () => {
  test('case, accents, punctuation and filler words do not count', () => {
    expect(nameSimilarity('Sentadilla trasera con barra', 'sentadílla trasera, barra!')).toBe(1);
    expect(nameSimilarity('Squat with a barbell', 'Barbell squat')).toBe(1);
  });
  test('Dice over word sets', () => {
    expect(nameSimilarity('Barbell back squat', 'Barbell front squat')).toBeCloseTo(2 / 3);
    expect(nameSimilarity('Barbell back squat', 'Dumbbell curl')).toBe(0);
  });
  test('a one-word name also scores by character trigrams', () => {
    expect(nameSimilarity('Squat', 'Squats')).toBeGreaterThan(0);
    expect(nameSimilarity('Squat', 'Squats')).toBeLessThan(1);
  });
  test('a missing or empty name scores 0', () => {
    expect(nameSimilarity(undefined, 'Barbell back squat')).toBe(0);
    expect(nameSimilarity('the', 'Barbell back squat')).toBe(0);
    expect(nameSimilarity(null, null)).toBe(0);
  });
});

describe('checkMatchRow', () => {
  test('a row fit for matching has no problems', () => {
    expect(checkMatchRow({ id: 'a', fxi: BACK_SQUAT, fxiProvenance: 'owner', mode: 'owner', fxiGap: null })).toEqual([]);
    expect(checkMatchRow({ id: 'a', fxi: BACK_SQUAT, fxiProvenance: 'import', mode: 'import', fxiGap: true })).toEqual([]);
    expect(checkMatchRow({ id: 7, fxi: BACK_SQUAT })).toEqual([]);
  });
  test('provenance that contradicts the mode is refused, both ways', () => {
    expect(checkMatchRow({ id: 'a', fxi: BACK_SQUAT, fxiProvenance: 'owner', mode: 'import' }).join()).toMatch(/contradicts mode "import"/);
    expect(checkMatchRow({ id: 'a', fxi: BACK_SQUAT, fxiProvenance: 'import', mode: 'owner' }).join()).toMatch(/contradicts mode "owner"/);
  });
  test('unknown values and shapes are refused', () => {
    expect(checkMatchRow({ fxi: BACK_SQUAT })).toEqual(['id is missing']);
    expect(checkMatchRow({ id: 'a', fxi: null })).toEqual(['fxi must be a string']);
    expect(checkMatchRow({ id: 'a', fxi: BACK_SQUAT, mode: 'guess' })).toEqual(['mode must be owner or import']);
    expect(checkMatchRow({ id: 'a', fxi: BACK_SQUAT, fxiProvenance: 'self' }).join()).toMatch(/fxiProvenance must be one of/);
    expect(checkMatchRow({ id: 'a', fxi: BACK_SQUAT, fxiGap: { note: 'grip' } })).toEqual(['fxiGap must be a string, a boolean or null']);
    expect(checkMatchRow('row')).toEqual(['not a row {id, fxi, …}']);
  });
});
