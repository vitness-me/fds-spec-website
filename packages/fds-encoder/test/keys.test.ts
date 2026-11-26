import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { fxmInFxmg } from '../src/fxmg';
import { checkKey, compareKeys, KeyError, keyType, writeKey } from '../src/keys';

const PAGES = ['exercise-key', 'equipment-key', 'muscle-key', 'muscle-category-key'];
const page = (name: string): string => readFileSync(new URL(`../../../website/docs/core-concepts/structural-keys/${name}.md`, import.meta.url), 'utf8');

/** The rows of a page's comparison tables: `| key A | key B | Result |`. */
function comparisonRows(text: string): [string, string, string][] {
  const rows: [string, string, string][] = [];
  for (const line of text.split('\n')) {
    const m = /^\| `(FX[A-Z]+=[^`]+)` \| `(FX[A-Z]+=[^`]+)` \| ([^|]+) \|$/.exec(line.trim());
    if (m !== null) rows.push([m[1]!, m[2]!, m[3]!.trim()]);
  }
  return rows;
}

const expected = (text: string): { result: string; specific?: 'a' | 'b' } => {
  if (text.startsWith('Same')) return { result: 'same' };
  if (text.startsWith('A is more specific')) return { result: 'more-specific', specific: 'a' };
  if (text.startsWith('B is more specific')) return { result: 'more-specific', specific: 'b' };
  if (text.startsWith('Overlap')) return { result: 'overlap' };
  if (text.startsWith('Different')) return { result: 'different' };
  throw new Error(`no result in "${text}"`);
};

describe('every comparison table on the key pages', () => {
  for (const name of PAGES) {
    const rows = comparisonRows(page(name));
    test(`${name}: has comparisons`, () => expect(rows.length).toBeGreaterThan(2));
    for (const [a, b, result] of rows) {
      test(`${name}: ${a} against ${b} is ${result.split(':')[0]}`, () => {
        const c = compareKeys(a, b);
        const want = expected(result);
        expect({ result: c.result, ...(c.specific === undefined ? {} : { specific: c.specific }) }).toEqual(want);
      });
    }
  }
});

describe('a muscle in a category, as the muscle category page says', () => {
  test('in, partly in and not in', () => {
    expect(fxmInFxmg('FXM=1.0/semitendinosus', 'FXMG=1.0/hamstring').relation).toBe('in');
    expect(fxmInFxmg('FXM=1.0/trapezius', 'FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse').relation).toBe('partly-in');
    expect(fxmInFxmg('FXM=1.0/brachialis', 'FXMG=1.0/hamstring').relation).toBe('not-in');
    for (const category of ['FXMG=1.0/quadriceps-femoris', 'FXMG=1.0/a:hip.flex']) expect(fxmInFxmg('FXM=1.0/rectus-femoris', category).relation).toBe('in');
  });
});

describe('checkKey and writeKey', () => {
  test('every key type is read by its header', () => {
    expect(['FXI=1.0S/m:el.flex/o:standing/l:none', 'FXE=1.0S/k:none', 'FXM=1.0/deltoid', 'FXMG=1.0/hamstring', 'nope'].map(keyType)).toEqual(['FXI', 'FXE', 'FXM', 'FXMG', undefined]);
  });
  test('the standard written form', () => {
    expect(writeKey('FXI=1.0S/m:el.flex/o:standing/l:bell.dumb*2@hands/x:b/g:su')).toBe('FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands');
    expect(writeKey('FXI=1.0S/m:el.flex/o:standing/l:none/a:strap.stretch')).toBe('FXI=1.0N/m:el.flex/o:standing/l:none/a:strap.stretch');
    expect(writeKey('FXE=1.0S/k:imp/f:bell.dumb/r:grav')).toBe('FXE=1.0S/k:imp/f:bell.dumb');
    expect(writeKey('FXM=1.0S/biceps-brachii')).toBe('FXM=1.0/biceps-brachii');
    expect(writeKey('FXMG=1.0/thigh.posterior+hamstring')).toBe('FXMG=1.0/hamstring');
  });
  test('a key that does not check lists its issues', () => {
    const c = checkKey('FXI=1.0S/m:el.flex+el.ext/o:sitting/l:none');
    expect(c.ok).toBe(false);
    expect(c.issues.map((i) => i.code)).toEqual(['opposite-actions', 'unknown-code']);
    expect(checkKey('FXM=1.0/deltoid.lateral').issues.map((i) => i.code)).toEqual(['unknown-part']);
    expect(checkKey('hello').issues.map((i) => i.code)).toEqual(['prefix']);
    expect(() => writeKey('FXE=1.0S/k:robot')).toThrow(KeyError);
  });
});

describe('compareKeys', () => {
  test('keys of different types, or keys that do not check, do not compare', () => {
    expect(() => compareKeys('FXM=1.0/deltoid', 'FXMG=1.0/shoulder.intrinsic')).toThrow(/do not compare/);
    expect(() => compareKeys('FXI=1.0S/m:nope', 'FXI=1.0S/m:el.flex')).toThrow(KeyError);
  });
  test('exercise and equipment keys report their layers; muscle and category keys the muscles they share', () => {
    expect(compareKeys('FXI=1.0S/m:el.flex/o:standing/l:none', 'FXI=1.0S/m:el.flex/o:?/l:none').layers?.o).toBe('narrower');
    expect(compareKeys('FXE=1.0S/k:mac/l:hands/s:?/m:pull.back', 'FXE=1.0S/k:mac/l:?/s:seated.chest/m:pull.back').result).toBe('overlap');
    expect(compareKeys('FXMG=1.0/quadriceps-femoris', 'FXMG=1.0/a:hip.flex').shared).toEqual(['rectus-femoris']);
    expect(compareKeys('FXM=1.0/biceps-brachii', 'FXM=1.0/biceps-brachii.long')).toMatchObject({ result: 'more-specific', specific: 'b' });
  });
  test('a key with ? is never the same as itself, only overlapping', () => {
    expect(compareKeys('FXI=1.0S/m:el.flex/o:?/l:none', 'FXI=1.0S/m:el.flex/o:?/l:none').result).toBe('overlap');
    expect(compareKeys('FXE=1.0S/k:imp/f:?', 'FXE=1.0S/k:imp/f:?').result).toBe('overlap');
  });
});
