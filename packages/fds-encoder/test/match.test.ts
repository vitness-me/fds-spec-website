import { describe, expect, test } from 'vitest';
import { match, nameSimilarity } from '../src/match';
import type { MatchEntry } from '../src/match';

const SQUAT = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing';
const BACK_SQUAT = `${SQUAT}/l:bar.straight@back`;
/** Refines: the load is open. Ten standard layers equal. */
const SQUAT_LOAD_OPEN = `${SQUAT}/l:?`;
/** Refines: orientation and the hold point are open. Nine standard layers equal. */
const SQUAT_TWO_OPEN = 'FXI=1.0S/m:hip.ext+kn.ext/o:?/l:bar.straight@?';
/** Compatible: orientation open and an extended accessory layer. */
const SQUAT_COMPATIBLE = 'FXI=1.0S/m:hip.ext+kn.ext/o:?/l:bar.straight@back/a:strap.stretch';
/** Differs only in the load layer. */
const FRONT_SQUAT = `${SQUAT}/l:bar.straight@shoulders`;
/** Differs only in the load layer; orientation open. */
const FRONT_SQUAT_OPEN = 'FXI=1.0S/m:hip.ext+kn.ext/o:?/l:bar.straight@shoulders';
/** Differs in the load and the held posture. */
const PRISONER_DB_SQUAT = `${SQUAT}/l:bell.dumb@hands/h:hands.head`;
/** Differs in motion and load. */
const CURL = 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands';

const BAR = 'FXE=1.0S/k:imp/f:bar.straight';
const ANY_IMPLEMENT = 'FXE=1.0S/k:imp/f:?';
const EZ_BAR = 'FXE=1.0S/k:imp/f:bar.ez';

const row = (id: string, key: string, extra: Partial<MatchEntry> = {}): MatchEntry => ({ id, key, ...extra });
const query = (extra: Partial<MatchEntry> = {}): MatchEntry => row('q', BACK_SQUAT, extra);
const candidates = (r: ReturnType<typeof match>) => (r.kind === 'absent' ? [] : r.candidates);

describe('an identical key', () => {
  test('a unique identical key is identical, and is the first candidate', () => {
    const library = [row('lib:front', FRONT_SQUAT), row('lib:back', BACK_SQUAT)];
    const r = match(query(), library);
    expect(r).toMatchObject({ kind: 'identical', id: 'lib:back' });
    expect(candidates(r)[0]).toEqual({ id: 'lib:back', via: 'key', result: 'same' });
  });
  test('several identical entries go to confirm', () => {
    expect(match(query(), [row('a', BACK_SQUAT), row('b', BACK_SQUAT)])).toMatchObject({ kind: 'confirm', why: 'several library entries have the same key' });
  });
});

describe('an identical key needs the same equipment key when both entries carry one', () => {
  const PULLDOWN_MACHINE = 'FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down';
  const ROW_MACHINE = 'FXE=1.0S/k:mac/l:hands/s:seated/m:pull.back';
  test('two identical exercise keys whose equipment keys differ go to confirm, the identical entry first', () => {
    const r = match(query({ fxe: PULLDOWN_MACHINE }), [row('lib:row', BACK_SQUAT, { fxe: ROW_MACHINE }), row('lib:front', FRONT_SQUAT)]);
    expect(r).toMatchObject({ kind: 'confirm', why: 'the equipment keys are not the same' });
    expect(candidates(r)[0]).toEqual({ id: 'lib:row', via: 'key', result: 'same' });
  });
  test('an equipment key that is only more specific, or holds ?, is not the same', () => {
    expect(match(query({ fxe: BAR }), [row('l', BACK_SQUAT, { fxe: ANY_IMPLEMENT })]).kind).toBe('confirm');
    expect(match(query({ fxe: ANY_IMPLEMENT }), [row('l', BACK_SQUAT, { fxe: ANY_IMPLEMENT })]).kind).toBe('confirm');
  });
  test('the same equipment key, or one on one side only, leaves the result to the exercise key', () => {
    expect(match(query({ fxe: BAR }), [row('lib:back', BACK_SQUAT, { fxe: BAR })]).kind).toBe('identical');
    expect(match(query({ fxe: BAR }), [row('lib:back', BACK_SQUAT)]).kind).toBe('identical');
    expect(match(query(), [row('lib:back', BACK_SQUAT, { fxe: BAR })]).kind).toBe('identical');
    expect(match(query({ fxe: ' ' }), [row('lib:back', BACK_SQUAT, { fxe: BAR })]).kind).toBe('identical');
  });
});

describe('confirm list', () => {
  test('key candidates rank the same key, then more or less specific, then overlapping', () => {
    const library = [row('compatible', SQUAT_COMPATIBLE), row('refines', SQUAT_LOAD_OPEN), row('identical', BACK_SQUAT)];
    expect(candidates(match(query(), library))).toEqual([
      { id: 'identical', via: 'key', result: 'same' },
      { id: 'refines', via: 'key', result: 'more-specific', specific: 'a' },
      { id: 'compatible', via: 'key', result: 'overlap' },
    ]);
  });
  test('within a tier, more standard layers marked identical rank first', () => {
    const library = [row('two-open', SQUAT_TWO_OPEN), row('one-open', SQUAT_LOAD_OPEN)];
    expect(candidates(match(query(), library)).map((c) => c.id).slice(0, 2)).toEqual(['one-open', 'two-open']);
  });
  test('then the equipment key when both carry one: the same, then more or less specific, then anything else', () => {
    const library = [
      row('none', SQUAT_LOAD_OPEN),
      row('ez', SQUAT_LOAD_OPEN, { fxe: EZ_BAR }),
      row('any', SQUAT_LOAD_OPEN, { fxe: ANY_IMPLEMENT }),
      row('bar', SQUAT_LOAD_OPEN, { fxe: BAR }),
    ];
    expect(candidates(match(query({ fxe: BAR }), library, { top: 4 })).map((c) => c.id)).toEqual(['bar', 'any', 'none', 'ez']);
  });
  test('the equipment key outranks the name, and the name outranks library order', () => {
    const library = [
      row('first', SQUAT_LOAD_OPEN, { name: 'Overhead walk' }),
      row('named', SQUAT_LOAD_OPEN, { name: 'Barbell back squat' }),
      row('equipped', SQUAT_LOAD_OPEN, { name: 'Overhead walk', fxe: BAR }),
      row('last', SQUAT_LOAD_OPEN, { name: 'Overhead walk' }),
    ];
    expect(candidates(match(query({ name: 'Barbell back squat', fxe: BAR }), library, { top: 4 })).map((c) => c.id)).toEqual(['equipped', 'named', 'first', 'last']);
  });
  test('an exercise that differs in exactly one standard layer follows every key candidate', () => {
    const library = [row('front', FRONT_SQUAT), row('prisoner', PRISONER_DB_SQUAT), row('compatible', SQUAT_COMPATIBLE)];
    expect(candidates(match(query(), library))).toEqual([
      { id: 'compatible', via: 'key', result: 'overlap' },
      { id: 'front', via: 'near', layer: 'l' },
      { id: 'prisoner', via: 'name' },
    ]);
  });
  test('a near entry may have other layers open; near entries rank by name, then library order', () => {
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
      why: 'no library entry has the same key',
      candidates: [{ id: 'back', via: 'name' }, { id: 'prisoner', via: 'name' }, { id: 'curl', via: 'name' }],
    });
  });
  test('an entry is listed once, at its best place', () => {
    const library = [row('dup', SQUAT_LOAD_OPEN), row('dup', FRONT_SQUAT), row('other', CURL)];
    expect(candidates(match(query(), library))).toEqual([
      { id: 'dup', via: 'key', result: 'more-specific', specific: 'a' },
      { id: 'other', via: 'name' },
    ]);
  });
  test('absent only when the library is empty', () => {
    expect(match(query(), [])).toEqual({ kind: 'absent' });
    expect(match(query(), [row('curl', CURL)])).toEqual({ kind: 'confirm', why: 'no library entry has the same key', candidates: [{ id: 'curl', via: 'name' }] });
  });
  test('top sets the list length; a bare number still works', () => {
    const library = [row('a', SQUAT_LOAD_OPEN), row('b', FRONT_SQUAT), row('c', CURL), row('d', CURL)];
    expect(candidates(match(query(), library))).toHaveLength(3);
    expect(candidates(match(query(), library, { top: 1 })).map((c) => c.id)).toEqual(['a']);
    expect(candidates(match(query(), library, 2)).map((c) => c.id)).toEqual(['a', 'b']);
  });
});

describe('other key types', () => {
  test('category keys rank the same members, then more specific, then overlapping', () => {
    const library = [
      row('quads', 'FXMG=1.0/quadriceps-femoris', { name: 'Quads' }),
      row('pecs', 'FXMG=1.0/pectoral', { name: 'Chest' }),
      row('posterior', 'FXMG=1.0/thigh.posterior', { name: 'Back of thigh' }),
      row('thigh', 'FXMG=1.0/thigh', { name: 'Thigh' }),
    ];
    const r = match(row('q', 'FXMG=1.0/hamstring', { name: 'Hamstrings' }), library, { top: 4 });
    expect(r).toMatchObject({ kind: 'identical', id: 'posterior' });
    expect(candidates(r)).toEqual([
      { id: 'posterior', via: 'key', result: 'same' },
      { id: 'thigh', via: 'key', result: 'more-specific', specific: 'a' },
      { id: 'quads', via: 'name' },
      { id: 'pecs', via: 'name' },
    ]);
  });
  test('muscle and equipment keys', () => {
    expect(candidates(match(row('q', 'FXM=1.0/biceps-brachii.long'), [row('b', 'FXM=1.0/biceps-brachii'), row('s', 'FXM=1.0/biceps-brachii.short')]))[0])
      .toEqual({ id: 'b', via: 'key', result: 'more-specific', specific: 'a' });
    expect(match(row('q', 'FXE=1.0S/k:imp/f:band.loop'), [row('band', 'FXE=1.0S/k:imp/f:band')])).toMatchObject({
      kind: 'confirm', candidates: [{ id: 'band', via: 'key', result: 'more-specific', specific: 'a' }],
    });
  });
  test('a library entry whose key does not check, or is of another type, is matched by name only', () => {
    expect(candidates(match(query(), [row('bad', 'FXI=1.0S/m:nope'), row('muscle', 'FXM=1.0/deltoid')]))).toEqual([
      { id: 'bad', via: 'name' }, { id: 'muscle', via: 'name' },
    ]);
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
