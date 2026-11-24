import { describe, expect, test } from 'vitest';
import { AnswerError, rowMeta } from '../src/build.js';
import type { Entry } from '../src/build.js';
import { autoMatchRefusal, match } from '../src/match.js';
import type { MatchRow } from '../src/match.js';
import { checkRow } from '../src/rows.js';

const PUSH_UP = 'FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:bw';
const KNEE_PUSH_UP = 'FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@hands,knees/l:bw';
const PUSH_UP_OPEN = 'FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:?/l:bw';

describe('equipment rows: one form for "no FXI" and "no notes"', () => {
  test('fxi left out or null, notes left out or null, are the same equipment row', () => {
    const a = checkRow({ id: 'e1', fxe: 'FXE=1.0S/k:sup/f:bench', confidence: 'high' });
    const b = checkRow({ id: 'e1', fxi: null, fxe: 'FXE=1.0S/k:sup/f:bench', confidence: 'high', notes: null });
    expect(a.problems).toEqual([]);
    expect(b.problems).toEqual([]);
    expect(a.row).toEqual(b.row);
    expect(a.row).toEqual({ id: 'e1', fxi: null, fxe: 'FXE=1.0S/k:sup/f:bench', confidence: 'high', notes: null });
  });
  test('a row with neither an FXI nor an FXE is still an error', () => {
    expect(checkRow({ id: 'x', confidence: 'high' }).problems.join(' ')).toMatch(/fxi/);
  });
});

describe('provenance and the gap marker travel with the FXI', () => {
  test('a row may carry fxiProvenance and fxiGap; bad values are errors', () => {
    expect(checkRow({ id: 'r', fxi: PUSH_UP, fxe: 'FXE=1.0S/k:none', confidence: 'high', notes: '', fxiProvenance: 'owner-assisted', fxiGap: 'hands turned out' }).problems).toEqual([]);
    expect(checkRow({ id: 'r', fxi: PUSH_UP, fxe: 'FXE=1.0S/k:none', confidence: 'high', fxiProvenance: 'coach' }).problems.join(' ')).toMatch(/fxiProvenance/);
    expect(checkRow({ id: 'r', fxi: PUSH_UP, fxe: 'FXE=1.0S/k:none', confidence: 'high', fxiGap: 3 }).problems.join(' ')).toMatch(/fxiGap/);
  });
  test('the owner tool sets provenance from the mode and carries the gap marker', () => {
    const e = (extra: Partial<Entry>): Entry => ({ id: 'p', answers: {}, ...extra });
    expect(rowMeta(e({}), 'owner')).toEqual({ mode: 'owner', fxiProvenance: 'owner', fxiGap: null });
    expect(rowMeta(e({}), 'import')).toEqual({ mode: 'import', fxiProvenance: 'import', fxiGap: null });
    expect(rowMeta(e({ provenance: 'agent', gap: 'the bell passes under the leg' }), 'owner')).toEqual({ mode: 'owner', fxiProvenance: 'agent', fxiGap: 'the bell passes under the leg' });
    expect(rowMeta(e({ differs: 'slower lowering on purpose' }), 'owner').fxiGap).toBe('slower lowering on purpose');
    for (const blank of ['', ' ', '\t\n']) {
      expect(rowMeta(e({ gap: blank }), 'owner').fxiGap).toBe('unspecified');
      expect(rowMeta(e({ differs: blank }), 'owner').fxiGap).toBe('unspecified');
    }
    expect(rowMeta(e({ gap: ' ', differs: 'slower lowering on purpose' }), 'owner').fxiGap).toBe('slower lowering on purpose');
    expect(rowMeta(e({ gap: null }), 'owner').fxiGap).toBeNull();
    expect(() => rowMeta(e({ provenance: 'owner' }), 'import')).toThrow(AnswerError);
    expect(() => rowMeta(e({ provenance: 'import' }), 'owner')).toThrow(AnswerError);
  });
});

describe('auto-match', () => {
  const row = (id: string, fxi: string, extra: Partial<MatchRow> = {}): MatchRow => ({ id, fxi, fxiProvenance: 'owner', fxiGap: null, ...extra });
  const library = [row('lib:push-up', PUSH_UP), row('lib:knee-push-up', KNEE_PUSH_UP)];
  test('a unique identical key with owner provenance and no gap marker on either side matches automatically', () => {
    expect(match(row('q', PUSH_UP), library)).toEqual({ kind: 'auto', id: 'lib:push-up' });
    expect(match(row('q', PUSH_UP, { fxiProvenance: 'owner-assisted' }), library)).toEqual({ kind: 'auto', id: 'lib:push-up' });
  });
  test('a gap marker on either side refuses auto-match', () => {
    expect(match(row('q', PUSH_UP, { fxiGap: 'hands on a towel' }), library).kind).toBe('confirm');
    expect(match(row('q', PUSH_UP), [row('lib:push-up', PUSH_UP, { fxiGap: 'tempo' })]).kind).toBe('confirm');
  });
  test('no owner provenance on either side refuses auto-match', () => {
    for (const p of ['agent', 'import', undefined]) {
      expect(autoMatchRefusal(row('q', PUSH_UP, { fxiProvenance: p }), library[0]!)).toMatch(/provenance/);
      expect(autoMatchRefusal(row('q', PUSH_UP), row('l', PUSH_UP, { fxiProvenance: p }))).toMatch(/provenance/);
    }
    expect(match(row('q', PUSH_UP, { fxiProvenance: 'agent' }), library)).toEqual({ kind: 'confirm', candidates: [{ id: 'lib:push-up', via: 'fxi', relation: 'identical' }, { id: 'lib:knee-push-up', via: 'near', layer: 's' }], why: 'the query has no owner provenance' });
  });
  test('several identical keys, or only compatible ones, go to confirm; nothing compatible fills from names; an empty library is absent', () => {
    expect(match(row('q', PUSH_UP), [...library, row('lib:push-up-2', PUSH_UP)]).kind).toBe('confirm');
    expect(match(row('q', PUSH_UP_OPEN), library)).toEqual({ kind: 'confirm', candidates: [{ id: 'lib:push-up', via: 'fxi', relation: 'refined-by' }, { id: 'lib:knee-push-up', via: 'fxi', relation: 'refined-by' }], why: 'no identical entry' });
    expect(match(row('q', 'FXI=1.0S/m:el.flex/o:standing/l:db@hands'), library)).toEqual({ kind: 'confirm', candidates: [{ id: 'lib:push-up', via: 'name' }, { id: 'lib:knee-push-up', via: 'name' }], why: 'no identical entry' });
    expect(match(row('q', PUSH_UP), [])).toEqual({ kind: 'absent' });
  });
});

describe('a blank gap note on a row still marks a gap', () => {
  test('an empty or whitespace fxiGap canonicalises to the unspecified marker', () => {
    for (const fxiGap of ['', '  ']) {
      const c = checkRow({ id: 'r', fxi: PUSH_UP, fxe: 'FXE=1.0S/k:none', confidence: 'high', fxiProvenance: 'owner', fxiGap });
      expect(c.row.fxiGap).toBe('unspecified');
    }
  });
});
