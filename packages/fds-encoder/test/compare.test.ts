import { describe, expect, test } from 'vitest';
import { compare } from '../src/compare';

const PUSH = 'FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:none';
describe('FXI compare', () => {
  test('identical only for byte-equal complete strings', () => {
    expect(compare(PUSH, PUSH).relation).toBe('identical');
    const partial = 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands';
    expect(compare(partial, partial).relation).toBe('compatible');
  });
  test('keys that differ in one layer are different', () => {
    expect(compare(PUSH, `${PUSH}/g:w-t`).relation).toBe('contradicting');
    expect(compare(PUSH, PUSH.replace('m:', 'm:^')).relation).toBe('contradicting');
    const lunge = (f: string): string => `FXI=1.0S/m:hip.ext+kn.ext/o:standing/f:${f}/l:none/x:u`;
    expect(compare(lunge('step.fwd'), lunge('step.back')).relation).toBe('contradicting');
    expect(compare(lunge('split'), lunge('step.back')).relation).toBe('contradicting');
  });
  test('alternating and one-side-then-the-other contradict', () => {
    expect(compare('FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands/x:a', 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands/x:u').relation).toBe('contradicting');
  });
  test('unknown refines to known', () => {
    expect(compare('FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands').relation).toBe('refines');
    expect(compare('FXI=1.0S/m:el.flex/o:?/l:?@hands', 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands').relation).toBe('refined-by');
    expect(compare('FXI=1.0S/m:~sh.?/o:standing/l:rope.battle@hands', 'FXI=1.0S/m:~sh.flex/o:standing/l:rope.battle@hands').relation).toBe('refined-by');
  });
  test('held posture and line of pull are standard: a variant contradicts the bare name', () => {
    const squat = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none';
    expect(compare(`${squat}/h:hands.head`, squat).relation).toBe('contradicting');
    expect(compare(`${squat}/h:hands.head`, `${squat}/h:arms.cross`).relation).toBe('contradicting');
    expect(compare(`${squat}/h:?`, squat).relation).toBe('refined-by');
    const fly = 'FXI=1.0S/m:sh.hadd/o:standing/l:cable@hands';
    expect(compare(`${fly}/p:hi`, `${fly}/p:lo`).relation).toBe('contradicting');
    expect(compare(`${fly}/p:hi`, fly).relation).toBe('contradicting');
    expect(compare(`${fly}/p:?`, `${fly}/p:hi`).relation).toBe('refined-by');
  });
  // A published default is a value. For every defaulted layer the bare string contradicts a written
  // non-default value, and refines `?`, because only `?` means unstated.
  const BASE = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back';
  const VARIANTS: [string, string][] = [
    ['k', 'k:trunk'], ['f', 'f:split'], ['s', 's:box@seat'], ['x', 'x:u'], ['g', 'g:st-w'], ['r', 'r:partial'],
    ['h', 'h:arms.cross'], ['p', 'p:behind'],
  ];
  for (const [layer, v] of VARIANTS) {
    test(`defaults are values: absent ${layer} contradicts ${v} and refines ${layer}:?`, () => {
      const r = compare(BASE, `${BASE}/${v}`);
      expect(r.relation).toBe('contradicting');
      expect(r.contradicting).toEqual([layer]);
      expect(compare(BASE, `${BASE}/${layer}:?`).relation).toBe('refines');
      expect(compare(BASE, BASE).relation).toBe('identical');
    });
  }
  test('defaults are values: the explicit default code equals the absent layer', () => {
    expect(compare(BASE, `${BASE}/k:limbs/f:level/x:b/g:pr+w-m+st-m/h:none/p:usual`).relation).toBe('identical');
  });
  test('o and l have no default: a key must write them, ? when unknown', () => {
    expect(compare('FXI=1.0S/m:el.flex', 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands').relation).toBe('invalid');
    expect(compare('FXI=1.0S/m:el.flex/o:?/l:?', 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands').relation).toBe('refined-by');
  });
  test('range codes unify as an open set', () => {
    const dl = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@hands';
    expect(compare(`${dl}/r:from-pins+?`, `${dl}/r:from-pins`).relation).toBe('refined-by');
    expect(compare(`${dl}/r:partial+?`, `${dl}/r:deep`).relation).toBe('contradicting');
    expect(compare(`${dl}/r:from-pins+?`, dl).relation).toBe('contradicting');
  });
  test('support items unify through ?', () => {
    expect(compare('FXI=1.0S/m:=sp.flex/o:prone/s:floor@feet,?/l:none', 'FXI=1.0S/m:=sp.flex/o:prone/s:floor@feet,forearms/l:none').relation).toBe('refined-by');
  });
  test('motion phase counts must match', () => {
    expect(compare('FXI=1.0S/m:a/o:?/l:?'.replace('a', 'hip.ext'), 'FXI=1.0S/m:hip.ext>el.flex/o:?/l:?').relation).toBe('contradicting');
  });
});

describe('FXI compare: implement counts', () => {
  const CURL = 'FXI=1.0S/m:el.flex/o:standing';
  const HINGE = 'FXI=1.0S/m:hip.ext/o:standing';
  test('a count kept for an unknown symmetry equals the usual count the other side leaves out', () => {
    const r = compare(`${CURL}/l:bell.dumb*2@hands/x:?`, `${CURL}/l:bell.dumb@hands`);
    expect(r.relation).toBe('refined-by');
    expect(r.layers.l).toBe('equal');
    expect(compare(`${CURL}/l:bell.dumb@hands`, `${CURL}/l:bell.dumb*2@hands/x:?`).relation).toBe('refines');
    expect(compare(`${CURL}/l:bell.dumb*1@hands/x:?`, `${CURL}/l:bell.dumb@hands`).contradicting).toEqual(['l']);
  });
  test('one arm at a time usually holds one implement', () => {
    const r = compare(`${HINGE}/l:bell.dumb*1@hands/x:?`, `${HINGE}/l:bell.dumb@hands/x:u@arms`);
    expect(r.relation).toBe('refined-by');
    expect(r.layers.l).toBe('equal');
    expect(compare(`${HINGE}/l:bell.dumb*2@hands/x:?`, `${HINGE}/l:bell.dumb@hands/x:u@arms`).contradicting).toEqual(['l']);
  });
  test('the usual count under a plain u follows the side\'s own motion', () => {
    const known = `${CURL}/l:bell.dumb@hands/x:u`;
    const open = 'FXI=1.0S/m:el.?/o:standing/l:bell.dumb@hands/x:u';
    expect(compare(`${CURL}/l:bell.dumb*2@hands/x:u`, known).contradicting).toEqual(['l']);
    const r = compare(`${CURL}/l:bell.dumb*2@hands/x:u`, open);
    expect(r.relation).not.toBe('contradicting');
    expect(r.layers.l).toBe('narrower');
    expect(r.layers.m).toBe('narrower');
    expect(compare(`${CURL}/l:bell.dumb@hands/x:u`, open).relation).toBe('refines');
    expect(compare(`${HINGE}/l:bell.dumb*1@hands/x:u`, `${HINGE}/l:bell.dumb@hands/x:u`).contradicting).toEqual(['l']);
  });
});

describe('FXE compare', () => {
  test('parent form is compatible', () => expect(compare('FXE=1.0S/k:imp/f:band', 'FXE=1.0S/k:imp/f:band.loop').relation).toBe('refined-by'));
  test('generic machine vs named machine', () => expect(compare('FXE=1.0S/k:mac/l:?/s:?/m:?', 'FXE=1.0S/k:mac/l:ankles/s:seated/m:kn.flex').relation).toBe('refined-by'));
  test('strength and cardio generics differ', () => expect(compare('FXE=1.0S/k:mac/l:?/s:?/m:?', 'FXE=1.0S/k:erg/c:?/l:?/s:?/m:?').relation).toBe('contradicting'));
  test('seated vs lying leg curl', () => expect(compare('FXE=1.0S/k:mac/l:ankles/s:seated/m:kn.flex', 'FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex').relation).toBe('contradicting'));
  test('combination contains a configuration', () => {
    expect(compare('FXE=1.0S/k:mac/l:arms/s:seated/m:sh.hadd;k:mac/l:hands/s:seated/m:sh.habd', 'FXE=1.0S/k:mac/l:arms/s:seated/m:sh.hadd').relation).toBe('compatible');
  });
});
