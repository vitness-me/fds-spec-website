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

describe('where keys are read', () => {
  test('a property name with a dot or a bracket never breaks the walk, and a key under it is still written', () => {
    const record = { ...CURL, 'x.y': { fxi: 'FXI=1.0S/m:el.flex' }, targets: { primary: [{ id: 'm', 'a.b[0]': 1, fxm: 'FXM=1.0S/biceps-brachii' }] } };
    const c = checkRecord(record);
    expect(c.problems).toEqual([]);
    expect(c.rewritten).toEqual([{ path: 'targets.primary[0].fxm', from: 'FXM=1.0S/biceps-brachii', to: 'FXM=1.0/biceps-brachii' }]);
    expect((c.record as { targets: { primary: { fxm: string }[] } }).targets.primary[0]!.fxm).toBe('FXM=1.0/biceps-brachii');
    expect(recordKeys({ equipment: { required: [{ 'odd.name': true, fxe: 'FXE=1.0S/k:none' }] } })).toEqual([{ path: 'equipment.required[0].fxe', field: 'fxe', key: 'FXE=1.0S/k:none' }]);
  });
  test('only the record\'s own key field and the key fields of its references are keys', () => {
    const record = {
      ...CURL,
      metadata: { fxi: 'not a key' },
      extensions: { vendor: { exercise: { fxi: 'FXI=1.0N/m:el.flex/o:standing/l:bell.dumb@hands' } } },
      attributes: { fxe: 'FXE=1.0/k:none' },
      canonical: { name: 'Dumbbell Curl', fxi: 'free text' },
      equipment: { required: [{ id: 'eq.dumbbell', fxe: 'FXE=1.0S/k:imp/f:bell.dumb', fxi: 'FXI=1.0N/m:el.flex' }] },
      targets: { primary: [{ id: 'mus.bicepsBrachii', fxm: 'FXM=1.0/biceps-brachii', fxe: 'not a key' }] },
    };
    expect(recordKeys(record).map((k) => k.path)).toEqual(['fxi', 'targets.primary[0].fxm', 'equipment.required[0].fxe']);
    const c = checkRecord(record);
    expect([c.problems, c.rewritten]).toEqual([[], []]);
    expect(c.record).toEqual(record);
  });
  test('an exercise reference holds fxi, and an equipment reference anywhere holds fxe', () => {
    const workout = {
      blocks: [{ items: [{ exercise: { id: 'ex.curl', fxi: 'FXI=1.0N/m:el.flex/o:standing/l:bell.dumb@hands' }, alternatives: [{ id: 'ex.hammer', fxi: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands/g:ne', fxe: 'x' }] }] }],
      load: { equipment: { id: 'eq.dumbbell', fxe: 'FXE=1.0/k:imp/f:bell.dumb' } },
    };
    expect(recordKeys(workout).map((k) => k.path)).toEqual(['blocks[0].items[0].exercise.fxi', 'blocks[0].items[0].alternatives[0].fxi', 'load.equipment.fxe']);
    expect(checkRecord(workout).rewritten.map((r) => r.path)).toEqual(['blocks[0].items[0].exercise.fxi', 'load.equipment.fxe']);
  });
  test('properties inherited from Object.prototype are never key fields', () => {
    expect(recordKeys({ constructor: 'FXI=1.0S/m:el.flex/o:standing/l:none', toString: 'x' })).toEqual([]);
    expect(matchEntryOf({ id: 'x', constructor: 'FXI=1.0S/m:el.flex/o:standing/l:none' })).toBeUndefined();
    expect(matchEntryOf(JSON.parse('{"id":"x","fxi":"FXI=1.0S/m:el.flex/o:standing/l:none","__proto__":{"name":"inherited"}}'))).toEqual({ id: 'x', key: 'FXI=1.0S/m:el.flex/o:standing/l:none' });
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
