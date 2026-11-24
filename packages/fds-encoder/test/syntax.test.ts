import { describe, expect, test } from 'vitest';
import { canonicalFxe, canonicalFxi as canon, parseFxe, parseFxi, standardFxi } from '../src/syntax.js';

const issues = (s: string): string[] => parseFxi(s).issues.map((i) => i.code);

describe('FXI header', () => {
  test('requires the revision', () => expect(issues('FXI=1/m:el.flex/o:?/l:?')).toContain('no-rev'));
  test('computes the flag', () => {
    expect(canon('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:bw')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bw');
    // h and p are standard, so every FXI is S; a written N is corrected.
    expect(canon('FXI=1.0N/m:hip.ext+kn.ext/o:standing/l:bw/h:hands.head')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bw/h:hands.head');
    expect(canon('FXI=1.0/m:sh.hadd/o:standing/l:cable@hands/p:hi')).toBe('FXI=1.0S/m:sh.hadd/o:standing/l:cable@hands/p:hi');
  });
  test('rejects a newer revision', () => expect(issues('FXI=1.1S/m:?/o:?/l:?')).toContain('rev'));
});

describe('canonicalisation', () => {
  test('is order-independent and idempotent', () => {
    const a = canon('FXI=1.0/l:bw/g:w-t/s:floor@hands,feet/o:prone/m:sh.hadd+el.ext');
    expect(a).toBe('FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:bw/g:w-t');
    expect(canon(a)).toBe(a);
  });
  test('writes o and l as ? when left out', () => expect(canon('FXI=1.0/m:el.flex')).toBe('FXI=1.0S/m:el.flex/o:?/l:?'));
  test('drops implied points and a bare floor', () => {
    expect(canon('FXI=1.0/m:el.ext+sh.flex/o:prone.pike/s:floor@feet,hands/l:bw')).toBe('FXI=1.0S/m:el.ext+sh.flex/o:prone.pike/l:bw');
    expect(canon('FXI=1.0/m:hip.ext/o:standing/s:floor@feet/l:bw')).toBe('FXI=1.0S/m:hip.ext/o:standing/l:bw');
  });
  test('drops the seat surface when seated', () => expect(canon('FXI=1.0/m:el.ext+sh.flex/o:seated/s:bench/l:db@hands')).toBe('FXI=1.0S/m:el.ext+sh.flex/o:seated/l:db@hands'));
  test('keeps an unstable seat', () => expect(canon('FXI=1.0/m:el.flex/o:seated/s:ball/l:db@hands')).toBe('FXI=1.0S/m:el.flex/o:seated/s:ball/l:db@hands'));
  test('drops defaults', () => expect(canon('FXI=1.0/m:el.flex/o:standing/k:limbs/f:level/l:db@hands/x:b/g:su+w-m')).toBe('FXI=1.0S/m:el.flex/o:standing/l:db@hands'));
  test('keeps the unusual hand orientation', () => expect(canon('FXI=1.0/m:el.flex/o:standing/l:bb@hands/g:pr')).toContain('/g:pr'));
  test('a trap bar forces neutral', () => expect(canon('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:tb@hands/g:ne')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:tb@hands'));
  test('stance only when standing', () => expect(canon('FXI=1.0/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:bw/g:st-n')).not.toContain('g:'));
  test('drops bw next to an implement', () => expect(canon('FXI=1.0/m:el.ext+sh.ext/o:hanging/s:bars/l:bw+plate@waist')).toContain('l:plate@waist'));
  test('drops an implied symmetry scope', () => {
    expect(canon('FXI=1.0/m:hip.ext+kn.ext/o:standing/f:step.back/l:bw/x:u@legs')).toContain('/x:u');
    expect(canon('FXI=1.0/m:hip.ext/o:standing/l:kb@hands/x:u@arms')).toContain('/x:u@arms');
  });
  test('drops symmetry for trunk turning', () => expect(canon('FXI=1.0/m:sp.rot/o:supine.incline/l:bw/x:a')).toBe('FXI=1.0S/m:sp.rot/o:supine.incline/l:bw'));
  test('two scoped symmetry items stay', () => expect(canon('FXI=1.0/m:~hip.ext+kn.ext/o:standing/f:travel.fwd/l:db@hands/x:u@arms+rc@legs')).toContain('x:rc@legs+u@arms'));
  test('h and p keep ? and drop their default codes', () => {
    expect(canon('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:bw/h:?/p:?')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bw/h:?/p:?');
    expect(canon('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:bw/h:none/p:usual')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bw');
  });
  test('h and p reject a default or ? mixed with codes', () => {
    expect(issues('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:bw/h:none+hands.head')).toContain('conflict');
    expect(issues('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:bw/h:?+hands.head')).toContain('unknown-alone');
    expect(issues('FXI=1.0/m:sh.hadd/o:standing/l:cable@hands/p:hi+lo')).toContain('conflict');
  });
  test('standard projection keeps h and p', () => expect(standardFxi('FXI=1.0N/m:hip.ext+kn.ext/o:standing/l:bw/h:hands.head')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bw/h:hands.head'));
});

describe('validation', () => {
  test('forbids the +? hedge', () => expect(issues('FXI=1.0/m:sp.flex+?/o:seated/l:mach@chest')).toContain('open-hedge'));
  test('allows a joint with unknown action', () => expect(parseFxi('FXI=1.0/m:~sh.?/o:standing/l:rope@hands').ok).toBe(true));
  test('rejects opposite actions in a phase', () => expect(issues('FXI=1.0/m:kn.flex+kn.ext/o:?/l:?')).toContain('opposite-actions'));
  test('=0 only as a hold', () => expect(issues('FXI=1.0/m:0/o:standing/l:bw')).toContain('zero'));
  test('every implement needs a hold point', () => expect(issues('FXI=1.0/m:el.flex/o:?/l:db')).toContain('missing-hold'));
  test('a support is not a load', () => expect(issues('FXI=1.0/m:el.flex/o:?/l:bench@hands')).toContain('support-as-load'));
  test('st-sp is footwork now', () => expect(issues('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:bw/g:st-sp')).toContain('st-sp'));
  test('one start position', () => expect(issues('FXI=1.0/m:hip.ext/o:standing/l:bb@hands/r:from-top+from-pins')).toContain('range-conflict'));
  test('symmetry conflict', () => expect(issues('FXI=1.0/m:el.flex/o:?/l:?/x:u+a')).toContain('symmetry-conflict'));
  test('the short-drive suffix and concurrent parts', () => {
    expect(parseFxi('FXI=1.0/m:el.ext+hip.ext-+kn.ext-+sh.flex>hip.ext-+kn.ext-/o:standing/f:level>split/l:bb@shoulders').ok).toBe(true);
    expect(canon('FXI=1.0/m:~hip.ext+kn.ext|=sh.hadd/o:standing/f:travel.fwd/l:sled@hands/x:rc@legs')).toContain('m:=sh.hadd|~hip.ext+kn.ext');
  });
});

describe('FXE', () => {
  const c = canonicalFxe;
  test('writes ? for missing standard layers', () => expect(c('FXE=1.0/k:mac/l:foot')).toBe('FXE=1.0S/k:mac/l:foot/s:?/m:?'));
  test('drops extended values the form implies', () => expect(c('FXE=1.0/k:imp/f:bell.dumb/r:grav')).toBe('FXE=1.0S/k:imp/f:bell.dumb'));
  test('keeps stated extended layers and flags N', () => expect(c('FXE=1.0/k:mac/l:foot/s:recline/m:push.fwd/g:incl/r:plate')).toBe('FXE=1.0N/k:mac/l:foot/s:recline/m:push.fwd/r:plate/g:incl'));
  test('sorts combination configurations', () => expect(c('FXE=1.0/k:mac/l:hand/s:seat/m:sh.habd ; k:mac/l:arm/s:seat/m:sh.hadd')).toBe('FXE=1.0S/k:mac/l:arm/s:seat/m:sh.hadd;k:mac/l:hand/s:seat/m:sh.habd'));
  test('form must match kind', () => expect(parseFxe('FXE=1.0/k:sup/f:bell.dumb').ok).toBe(false));
  test('requires the revision', () => expect(parseFxe('FXE=1S/k:none').ok).toBe(false));
});
