import { describe, expect, test } from 'vitest';
import { build } from '../src/builder/build';
import { compare } from '../src/compare';
import { mainEquipment } from '../src/crosscheck';
import { parseFxi } from '../src/syntax';


describe('compare: a parent code covers its children', () => {
  const push = (s: string): string => `FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:${s}@hands+floor@feet/l:none`;
  test('BOSU side', () => {
    expect(compare(push('dome'), push('dome.up')).relation).toBe('refined-by');
    expect(compare(push('dome.up'), push('dome')).relation).toBe('refines');
    expect(compare(push('dome.up'), push('dome.down')).relation).toBe('contradicting');
    expect(compare(push('dome.up'), push('ball.stab')).relation).toBe('contradicting');
  });
  test('cardio cycle', () => {
    const tm = (t: string): string => `FXI=1.0S/m:~hip.ext+kn.ext/o:standing/l:${t}@feet/x:rc`;
    expect(compare(tm('erg'), tm('erg.gait')).relation).toBe('refined-by');
    expect(compare(tm('erg.step'), tm('erg.gait')).relation).toBe('contradicting');
  });
  test('hang height', () => {
    const c = (r: string): string => `FXI=1.0S/m:ank.pf+hip.ext+kn.ext>el.flex>hip.ext+kn.ext/o:standing/l:bar.straight@hands/r:${r}`;
    expect(compare(c('from-top'), c('from-top.knee')).relation).toBe('refined-by');
    expect(compare(c('from-top.knee'), c('from-floor')).relation).toBe('contradicting');
    expect(compare(c('from-top.knee'), c('from-top.knee')).relation).toBe('identical');
  });
  test('the accessory layer is extended: absent on one side refines, different values contradict', () => {
    const s = 'FXI=1.0S/m:%ank.df+kn.ext/o:seated/l:none/x:u';
    expect(compare(`${s}/a:strap.stretch`, s).relation).toBe('refines');
    expect(compare(`${s}/a:strap.stretch`, `${s}/a:partner`).relation).toBe('contradicting');
    expect(parseFxi(`${s}/a:strap.stretch`).canonical).toBe('FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:none/x:u/a:strap.stretch');
    expect(parseFxi(`${s}/a:none`).canonical).toBe(s);
  });
  test('a key with a parent code is the same as itself', () => {
    expect(compare('FXI=1.0S/m:~hip.ext+kn.ext/o:standing/l:erg@feet/x:rc', 'FXI=1.0S/m:~hip.ext+kn.ext/o:standing/l:erg@feet/x:rc').relation).toBe('identical');
  });
});

describe('syntax', () => {
  test('rolling and pressure holds have no joint direction', () => {
    expect(parseFxi('FXI=1.0S/m:~0/o:prone/s:roller.foam@thighs/l:none').ok).toBe(true);
    expect(parseFxi('FXI=1.0S/m:%0/o:prone/l:none').ok).toBe(false);
  });
  test('stance is kept for a leg press, still dropped for a push-up', () => {
    expect(parseFxi('FXI=1.0S/m:hip.ext+kn.ext/o:supine.incline/l:mac@feet/g:st-w').canonical).toContain('g:st-w');
    expect(parseFxi('FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:none/g:st-w').canonical).not.toContain('g:');
  });
  test('seated.bent drops a seat surface like seated', () => {
    expect(parseFxi('FXI=1.0S/m:sh.abd/o:seated.bent/s:bench/l:bell.dumb@hands').canonical).toBe('FXI=1.0S/m:sh.abd/o:seated.bent/l:bell.dumb@hands');
  });
  test('side line of pull cannot combine with high or low', () => {
    expect(parseFxi('FXI=1.0S/m:el.ext+sh.hadd/o:standing/l:cable@hands/p:hi+side').ok).toBe(false);
  });
});

describe('one main-equipment rule for the tool and the checker', () => {
  test('an implement of unknown kind beats a support', () => {
    expect(mainEquipment({ l: '?@hands', s: 'wall@back' }).fxe).toBe('FXE=1.0S/k:imp/f:?');
    expect(mainEquipment({ l: '?', s: 'wall@back' }).fxe).toBe('FXE=1.0S/k:sup/f:wall');
    expect(mainEquipment({ l: 'band@hands+bell.dumb@hands' }).token).toBe('bell.dumb');
    expect(mainEquipment({ l: 'bell.dumb@hands+cable@hands' }).token).toBe('cable');
    expect(mainEquipment({ l: 'none' }).fxe).toBe('FXE=1.0S/k:none');
  });
});

describe('equipment on its own', () => {
  test('an equipment row prints its whole key in fxe, extended layers included', () => {
    const b = build({ id: 'e', answers: { subject: 'equipment', 'eq.kind': 'mac', 'eq.mac.motion': 'kn.flex', 'eq.mac.contact': ['usual'], 'eq.mac.posture': 'prone', 'eq.details': 'yes', 'eq.drive': 'plate', 'eq.constraint': 'arc', 'eq.angle': 'usual', 'eq.attrs': ['usual'], 'eq.more': 'usual' } });
    expect(b.fxe).toBe('FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc');
  });
});

