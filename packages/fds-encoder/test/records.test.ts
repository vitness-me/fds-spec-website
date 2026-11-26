import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { checkRecord, matchEntryOf, recordKeys } from '../src/records';

const CURL = {
  exerciseId: 'ex.dumbbellCurl',
  fxi: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands',
  canonical: { name: 'Dumbbell Curl', slug: 'dumbbell-curl' },
  targets: {
    primary: [{ id: 'mus.bicepsBrachii', name: 'Biceps Brachii', categoryId: 'cat.upperArmFront', fxm: 'FXM=1.0/biceps-brachii', fxmg: 'FXMG=1.0/arm.anterior' }],
    secondary: [{ id: 'mus.brachialis', name: 'Brachialis', categoryId: 'cat.upperArmFront', fxm: 'FXM=1.0/brachialis', fxmg: 'FXMG=1.0/arm.anterior' }],
  },
  equipment: { required: [{ id: 'eq.dumbbell', name: 'Dumbbell', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' }] },
  attributes: { platform: { anything: 'the encoder never reads or writes this' } },
};

describe('recordKeys', () => {
  test('finds every key field on the record and its references, with its path', () => {
    expect(recordKeys(CURL)).toEqual([
      { path: 'fxi', field: 'fxi', key: CURL.fxi },
      { path: 'targets.primary[0].fxm', field: 'fxm', key: 'FXM=1.0/biceps-brachii' },
      { path: 'targets.primary[0].fxmg', field: 'fxmg', key: 'FXMG=1.0/arm.anterior' },
      { path: 'targets.secondary[0].fxm', field: 'fxm', key: 'FXM=1.0/brachialis' },
      { path: 'targets.secondary[0].fxmg', field: 'fxmg', key: 'FXMG=1.0/arm.anterior' },
      { path: 'equipment.required[0].fxe', field: 'fxe', key: 'FXE=1.0S/k:imp/f:bell.dumb' },
    ]);
  });
});

describe('checkRecord', () => {
  test('a consistent record has no problems or warnings and comes back unchanged', () => {
    const c = checkRecord(CURL);
    expect([c.problems, c.warnings, c.rewritten]).toEqual([[], [], []]);
    expect(c.record).toEqual(CURL);
  });
  test('writes each key in its written form and changes nothing else', () => {
    const c = checkRecord({ ...CURL, fxi: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb*2@hands/g:su' });
    expect(c.rewritten).toEqual([{ path: 'fxi', from: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb*2@hands/g:su', to: CURL.fxi }]);
    expect(c.record).toEqual(CURL);
  });
  test('reports a key that does not check, and a field holding another type of key', () => {
    const c = checkRecord({ ...CURL, fxi: 'FXI=1.0S/m:el.bend/o:standing/l:none', equipment: { required: [{ id: 'eq.x', fxe: 'FXM=1.0/deltoid' }] } });
    expect(c.problems.map((p) => [p.path, p.code])).toEqual([['fxi', 'unknown-action'], ['equipment.required[0].fxe', 'wrong-type']]);
  });
  test('checks an exercise against its main equipment reference', () => {
    const kettlebell = checkRecord({ ...CURL, equipment: { required: [{ id: 'eq.kb', fxe: 'FXE=1.0S/k:imp/f:bell.kettle' }] } });
    expect(kettlebell.warnings.map((w) => [w.path, w.code])).toEqual([['equipment.required[0].fxe', 'main-equipment']]);
    const legPress = {
      exerciseId: 'ex.legPress', fxi: 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:mac@feet',
      equipment: { required: [{ id: 'eq.bench', fxe: 'FXE=1.0S/k:sup/f:bench' }, { id: 'eq.legPress45', fxe: 'FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl' }] },
    };
    expect(checkRecord(legPress).warnings.map((w) => [w.path, w.code])).toEqual([['equipment.required[1].fxe', 'posture']]);
  });
  test('a muscle reference is checked to be in its category', () => {
    const c = checkRecord({ ...CURL, targets: { primary: [{ id: 'm', fxm: 'FXM=1.0/trapezius', fxmg: 'FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse' }] } });
    expect(c.warnings.map((w) => [w.path, w.code])).toEqual([['targets.primary[0].fxmg', 'category']]);
  });
});

describe('matchEntryOf', () => {
  test('a record as a match entry: its own key, id, name and main equipment key', () => {
    expect(matchEntryOf(CURL)).toEqual({ id: 'ex.dumbbellCurl', key: CURL.fxi, name: 'Dumbbell Curl', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' });
    expect(matchEntryOf({ id: 'cat.hamstrings', fxmg: 'FXMG=1.0/hamstring', canonical: { name: 'Hamstrings' } })).toEqual({ id: 'cat.hamstrings', key: 'FXMG=1.0/hamstring', name: 'Hamstrings' });
    expect(matchEntryOf({ id: 'x', canonical: { name: 'No key' } })).toBeUndefined();
  });
});

describe('the published examples', () => {
  const root = fileURLToPath(new URL('../../../specification/schemas/', import.meta.url));
  const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.json') && !f.endsWith('.schema.json') && !f.split('/').pop()!.startsWith('invalid.'));
  const keyed = files.map((f) => [f, JSON.parse(readFileSync(join(root, f), 'utf8')) as unknown] as const).filter(([, doc]) => recordKeys(doc).length > 0);
  test('many carry keys', () => expect(keyed.length).toBeGreaterThan(20));
  for (const [file, doc] of keyed) {
    test(`${file}: every key checks, is written in standard form and agrees with the others`, () => {
      const c = checkRecord(doc);
      expect({ problems: c.problems, warnings: c.warnings, rewritten: c.rewritten }).toEqual({ problems: [], warnings: [], rewritten: [] });
    });
  }
});
