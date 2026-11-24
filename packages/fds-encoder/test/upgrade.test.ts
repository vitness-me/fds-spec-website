import { describe, expect, test } from 'vitest';
import { FXI_RULES } from '../src/alphabet.js';
import { build } from '../src/build.js';
import type { Entry } from '../src/build.js';
import { createFlow, DEFAULT_FLOW } from '../src/flow.js';
import { upgrade } from '../src/upgrade.js';
import { FLOW, WORDS, eq, ex } from './support.js';

const CITED = { name: WORDS.name, version: WORDS.version };
const narrowPulldown: Entry = { id: 'close-pulldown', answers: ex('lat-pulldown', ['width'], { 'grip.width': 'narrow' }), words: CITED };
/** What an earlier rules revision wrote for the same answers: the pull still out at the sides. */
const OLDER = 'FXI=1.0S/m:el.flex+sh.add/o:seated/l:mach@hands/g:w-n';
const CURRENT = 'FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mach@hands/g:w-n';

const stored = (e: Entry, over: Record<string, unknown> = {}): Record<string, unknown> => {
  const b = build(e, FLOW);
  return { id: e.id, fxi: b.fxi, fxe: b.fxe, ...(b.fxeFull === undefined ? {} : { fxeFull: b.fxeFull }), fxiProvenance: 'owner', fxiGap: null, rules: FXI_RULES, record: e, ...over };
};

describe('upgrade rebuilds every string from its stored answers', () => {
  test('a record built under the current rules does not change', () => {
    const r = upgrade([stored(narrowPulldown)], FLOW);
    expect(r.changes).toEqual([]);
    expect(r.failed).toEqual([]);
    expect(r.records).toEqual([stored(narrowPulldown)]);
  });

  test('a string an earlier rules revision wrote differently is reported and rebuilt', () => {
    const r = upgrade([stored(narrowPulldown, { fxi: OLDER, rules: '1.2' })], FLOW);
    expect(r.changes).toEqual([{ id: 'close-pulldown', field: 'fxi', before: OLDER, after: CURRENT, fromRules: '1.2' }]);
    expect(r.records[0]).toMatchObject({ fxi: CURRENT, rules: FXI_RULES, fxiProvenance: 'owner', fxiGap: null, record: narrowPulldown });
  });

  test('every string that changes is reported, the full equipment record included', () => {
    const machine: Entry = { id: 'leg-curl-machine', answers: eq({ 'eq.kind': 'mac', 'eq.mac.motion': 'kn.flex', 'eq.mac.contact': ['usual'], 'eq.mac.posture': 'prone', 'eq.details': 'yes', 'eq.drive': 'plate', 'eq.constraint': 'arc', 'eq.angle': 'usual', 'eq.attrs': ['usual'], 'eq.more': 'usual' }) };
    const before = stored(machine, { fxe: 'FXE=1.0S/k:mac/l:?/s:prone/m:kn.flex', fxeFull: 'FXE=1.0N/k:mac/l:?/s:prone/m:kn.flex/r:plate/c:arc' });
    const r = upgrade([before], FLOW);
    expect(r.changes.map((c) => [c.field, c.after])).toEqual([
      ['fxe', 'FXE=1.0S/k:mac/l:ankle/s:prone/m:kn.flex'],
      ['fxeFull', 'FXE=1.0N/k:mac/l:ankle/s:prone/m:kn.flex/r:plate/c:arc'],
    ]);
    expect(r.changes[0]!.fromRules).toBe(FXI_RULES);
  });

  test('a record with no answers is kept as written, and still checked', () => {
    const r = upgrade([{ id: 'legacy', fxi: 'FXI=1.0S/m:el.flex/o:standing/l:db@hands', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' }], FLOW);
    expect(r.kept).toEqual([{ id: 'legacy', reason: 'no answers record: kept as written' }]);
    expect(r.changes).toEqual([]);
    expect(r.records[0]).toEqual({ id: 'legacy', fxi: 'FXI=1.0S/m:el.flex/o:standing/l:db@hands', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' });
    expect(upgrade([{ id: 'broken', fxi: 'FXI=1.0S/m:el.flex/o:standing/l:db' }], FLOW).failed[0]!.problems.join()).toMatch(/hold point/);
  });

  test('answers that no longer build fail, and the record is kept unchanged', () => {
    const bad = stored(narrowPulldown, { record: { ...narrowPulldown, answers: { ...narrowPulldown.answers, 'grip.width': 'very-wide' } } });
    const r = upgrade([bad], FLOW);
    expect(r.failed.map((f) => f.id)).toEqual(['close-pulldown']);
    expect(r.failed[0]!.problems.join()).toMatch(/"very-wide" is not an option/);
    expect(r.records[0]).toEqual(bad);
  });

  test('a record whose word came from a dataset needs that dataset', () => {
    const r = upgrade([stored(narrowPulldown)], DEFAULT_FLOW);
    expect(r.failed[0]!.problems).toEqual([`its movement word comes from "${WORDS.name}" version ${WORDS.version}; give that dataset with --words`]);
    const other = createFlow({ ...WORDS, name: 'another-word-set' });
    expect(upgrade([stored(narrowPulldown)], other).failed[0]!.problems[0]).toMatch(/comes from "vitness-test-words"/);
  });

  test('a different version of the same dataset is used, and said', () => {
    const r = upgrade([stored(narrowPulldown)], createFlow({ ...WORDS, version: '2' }));
    expect(r.failed).toEqual([]);
    expect(r.warnings).toEqual(['close-pulldown: built with vitness-test-words version 1, rebuilt with version 2']);
  });

  test('a record that is not an object, or has no id, fails', () => {
    const r = upgrade([null, { fxi: CURRENT }] as never[], FLOW);
    expect(r.failed.map((f) => f.problems[0])).toEqual(['not a built record {id, fxi, fxe, record}', 'not a built record {id, fxi, fxe, record}']);
  });
});
