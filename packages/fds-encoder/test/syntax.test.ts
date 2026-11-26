import { describe, expect, test } from 'vitest';
import { compare } from '../src/compare';
import { parseFxe, parseFxi, standardFxi } from '../src/syntax';

const canon = (s: string): string => {
  const p = parseFxi(s);
  if (!p.ok) throw new Error(p.issues.map((i) => i.message).join('; '));
  return p.canonical;
};
const issues = (s: string): string[] => parseFxi(s).issues.map((i) => i.code);

describe('FXI header', () => {
  test('requires the revision', () => expect(issues('FXI=1/m:el.flex/o:?/l:?')).toContain('no-rev'));
  test('computes the flag', () => {
    expect(canon('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:none')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none');
    // h and p are standard layers, so a key without a is S; a written N is corrected.
    expect(canon('FXI=1.0N/m:hip.ext+kn.ext/o:standing/l:none/h:hands.head')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none/h:hands.head');
    expect(canon('FXI=1.0/m:sh.hadd/o:standing/l:cable@hands/p:hi')).toBe('FXI=1.0S/m:sh.hadd/o:standing/l:cable@hands/p:hi');
  });
  test('rejects a newer revision', () => expect(issues('FXI=1.1S/m:?/o:?/l:?')).toContain('rev'));
});

describe('canonicalisation', () => {
  test('is order-independent and idempotent', () => {
    const a = canon('FXI=1.0/l:none/g:w-t/s:floor@hands,feet/o:prone/m:sh.hadd+el.ext');
    expect(a).toBe('FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:none/g:w-t');
    expect(canon(a)).toBe(a);
  });
  test('requires m, o and l, and keeps a written ?', () => {
    expect(issues('FXI=1.0/o:standing/l:none')).toContain('missing-motion');
    expect(issues('FXI=1.0/m:el.flex/l:none')).toContain('missing-orientation');
    expect(issues('FXI=1.0/m:el.flex/o:standing')).toContain('missing-load');
    expect(issues('FXI=1.0/m:el.flex')).toEqual(['missing-orientation', 'missing-load']);
    expect(canon('FXI=1.0/m:?/o:?/l:?')).toBe('FXI=1.0S/m:?/o:?/l:?');
  });
  test('drops implied points and a bare floor', () => {
    expect(canon('FXI=1.0/m:el.ext+sh.flex/o:prone.pike/s:floor@feet,hands/l:none')).toBe('FXI=1.0S/m:el.ext+sh.flex/o:prone.pike/l:none');
    expect(canon('FXI=1.0/m:hip.ext/o:standing/s:floor@feet/l:none')).toBe('FXI=1.0S/m:hip.ext/o:standing/l:none');
  });
  test('drops the seat surface when seated', () => expect(canon('FXI=1.0/m:el.ext+sh.flex/o:seated/s:bench/l:bell.dumb@hands')).toBe('FXI=1.0S/m:el.ext+sh.flex/o:seated/l:bell.dumb@hands'));
  test('keeps an unstable seat', () => expect(canon('FXI=1.0/m:el.flex/o:seated/s:ball.stab/l:bell.dumb@hands')).toBe('FXI=1.0S/m:el.flex/o:seated/s:ball.stab/l:bell.dumb@hands'));
  test('drops defaults', () => expect(canon('FXI=1.0/m:el.flex/o:standing/k:limbs/f:level/l:bell.dumb@hands/x:b/g:su+w-m')).toBe('FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands'));
  test('keeps the unusual hand orientation', () => expect(canon('FXI=1.0/m:el.flex/o:standing/l:bar.straight@hands/g:pr')).toContain('/g:pr'));
  test('a trap bar forces neutral', () => expect(canon('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:bar.trap@hands/g:ne')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.trap@hands'));
  test('stance only when standing', () => expect(canon('FXI=1.0/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:none/g:st-n')).not.toContain('g:'));
  test('drops none next to an implement', () => expect(canon('FXI=1.0/m:el.ext+sh.ext/o:hanging/s:bar.parallel/l:none+plate@waist')).toContain('l:plate@waist'));
  test('drops an implied symmetry scope', () => {
    expect(canon('FXI=1.0/m:hip.ext+kn.ext/o:standing/f:step.back/l:none/x:u@legs')).toContain('/x:u');
    expect(canon('FXI=1.0/m:hip.ext/o:standing/l:bell.kettle@hands/x:u@arms')).toContain('/x:u@arms');
  });
  test('drops symmetry for trunk turning', () => expect(canon('FXI=1.0/m:sp.rot/o:supine.incline/l:none/x:a')).toBe('FXI=1.0S/m:sp.rot/o:supine.incline/l:none'));
  test('two scoped symmetry items stay', () => expect(canon('FXI=1.0/m:~hip.ext+kn.ext/o:standing/f:travel.fwd/l:bell.dumb@hands/x:u@arms+rc@legs')).toContain('x:rc@legs+u@arms'));
  test('h and p keep ? and drop their default codes', () => {
    expect(canon('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:none/h:?/p:?')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none/h:?/p:?');
    expect(canon('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:none/h:none/p:usual')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none');
  });
  test('h and p reject a default or ? mixed with codes', () => {
    expect(issues('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:none/h:none+hands.head')).toContain('conflict');
    expect(issues('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:none/h:?+hands.head')).toContain('unknown-alone');
    expect(issues('FXI=1.0/m:sh.hadd/o:standing/l:cable@hands/p:hi+lo')).toContain('conflict');
  });
  test('standard projection keeps h and p', () => expect(standardFxi('FXI=1.0N/m:hip.ext+kn.ext/o:standing/l:none/h:hands.head')).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none/h:hands.head'));
});

describe('implement counts', () => {
  const CURL = 'FXI=1.0S/m:el.flex/o:standing';
  const SQUAT = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing';
  const HINGE = 'FXI=1.0S/m:hip.ext/o:standing';
  test('a count equal to the usual one is dropped, and the two spellings compare identical', () => {
    const written = `${CURL}/l:bell.dumb*1@hands/x:u`;
    const bare = `${CURL}/l:bell.dumb@hands/x:u`;
    expect(canon(written)).toBe(bare);
    expect(canon(bare)).toBe(bare);
    expect(compare(written, bare).relation).toBe('identical');
  });
  test('a one-hand implement is one per working hand', () => {
    expect(canon(`${CURL}/l:bell.dumb*2@hands`)).toBe(`${CURL}/l:bell.dumb@hands`);
    expect(canon(`${CURL}/l:bell.dumb*1@hands`)).toBe(`${CURL}/l:bell.dumb*1@hands`);
    expect(canon(`${CURL}/l:bell.dumb*2@hands/x:a`)).toBe(`${CURL}/l:bell.dumb@hands/x:a`);
    expect(canon(`${CURL}/l:bell.dumb*2@hands/x:u`)).toBe(`${CURL}/l:bell.dumb*2@hands/x:u`);
    expect(canon(`${SQUAT}/l:bell.kettle*2@shoulders`)).toBe(`${SQUAT}/l:bell.kettle@shoulders`);
    expect(canon(`${HINGE}/l:bell.kettle*1@hands/x:u@arms`)).toBe(`${HINGE}/l:bell.kettle@hands/x:u@arms`);
    expect(canon(`${HINGE}/l:plate*1@hands/x:u@arms`)).toBe(`${HINGE}/l:plate@hands/x:u@arms`);
    expect(canon(`${HINGE}/l:club*2@hands`)).toBe(`${HINGE}/l:club@hands`);
  });
  test('legs working one side at a time leave both hands loaded', () => {
    expect(canon(`${HINGE}/l:bell.dumb*2@hands/x:u`)).toBe(`${HINGE}/l:bell.dumb@hands/x:u`);
    expect(canon(`${HINGE}/l:bell.dumb*2@hands/x:u@legs`)).toBe(`${HINGE}/l:bell.dumb@hands/x:u`);
    expect(canon(`${HINGE}/l:bell.dumb*1@hands/x:u`)).toBe(`${HINGE}/l:bell.dumb*1@hands/x:u`);
  });
  test('a two-hand implement, any implement at a trunk point and every other token is one', () => {
    expect(canon(`${SQUAT}/l:bar.straight*1@back`)).toBe(`${SQUAT}/l:bar.straight@back`);
    expect(canon(`${SQUAT}/l:bar.straight*2@hands`)).toBe(`${SQUAT}/l:bar.straight*2@hands`);
    expect(canon(`${SQUAT}/l:bell.dumb*1@chest`)).toBe(`${SQUAT}/l:bell.dumb@chest`);
    expect(canon(`${SQUAT}/l:bell.kettle*1@hips`)).toBe(`${SQUAT}/l:bell.kettle@hips`);
    expect(canon('FXI=1.0S/m:kn.ext/o:seated/l:mac*1@ankles')).toBe('FXI=1.0S/m:kn.ext/o:seated/l:mac@ankles');
    expect(canon('FXI=1.0S/m:hip.abd/o:standing/l:wear.ankle*1@ankles/x:u')).toBe('FXI=1.0S/m:hip.abd/o:standing/l:wear.ankle@ankles/x:u');
    expect(canon(`${CURL}/l:bell.dumb*2@hands+cable*1@hands`)).toBe(`${CURL}/l:bell.dumb@hands+cable@hands`);
  });
  test('a count stays when the usual count is unknown', () => {
    expect(canon(`${CURL}/l:?*1@hands`)).toBe(`${CURL}/l:?*1@hands`);
    expect(canon(`${CURL}/l:bell.dumb*2@?`)).toBe(`${CURL}/l:bell.dumb*2@?`);
    expect(canon(`${CURL}/l:bell.dumb*2@hands/x:?`)).toBe(`${CURL}/l:bell.dumb*2@hands/x:?`);
    expect(canon('FXI=1.0S/m:?/o:standing/l:bell.dumb*1@hands/x:u')).toBe('FXI=1.0S/m:?/o:standing/l:bell.dumb*1@hands/x:u');
    expect(canon('FXI=1.0S/m:?/o:standing/l:bell.dumb*2@hands/x:u')).toBe('FXI=1.0S/m:?/o:standing/l:bell.dumb*2@hands/x:u');
  });
});

describe('validation', () => {
  test('forbids the +? hedge', () => expect(issues('FXI=1.0/m:sp.flex+?/o:seated/l:mac@chest')).toContain('open-hedge'));
  test('allows a joint with unknown action', () => expect(parseFxi('FXI=1.0/m:~sh.?/o:standing/l:rope.battle@hands').ok).toBe(true));
  test('rejects opposite actions in a phase', () => expect(issues('FXI=1.0/m:kn.flex+kn.ext/o:?/l:?')).toContain('opposite-actions'));
  test('=0 only as a hold', () => expect(issues('FXI=1.0/m:0/o:standing/l:none')).toContain('zero'));
  test('every implement needs a hold point', () => expect(issues('FXI=1.0/m:el.flex/o:?/l:bell.dumb')).toContain('missing-hold'));
  test('a support is not a load', () => expect(issues('FXI=1.0/m:el.flex/o:?/l:bench@hands')).toContain('support-as-load'));
  test('st-sp is footwork now', () => expect(issues('FXI=1.0/m:hip.ext+kn.ext/o:standing/l:none/g:st-sp')).toContain('st-sp'));
  test('one start position', () => expect(issues('FXI=1.0/m:hip.ext/o:standing/l:bar.straight@hands/r:from-top+from-pins')).toContain('range-conflict'));
  test('symmetry conflict', () => expect(issues('FXI=1.0/m:el.flex/o:?/l:?/x:u+a')).toContain('symmetry-conflict'));
  test('the short-drive suffix and concurrent parts', () => {
    expect(parseFxi('FXI=1.0/m:el.ext+hip.ext-+kn.ext-+sh.flex>hip.ext-+kn.ext-/o:standing/f:level>split/l:bar.straight@shoulders').ok).toBe(true);
    expect(canon('FXI=1.0/m:~hip.ext+kn.ext|=sh.hadd/o:standing/f:travel.fwd/l:sled@hands/x:rc@legs')).toContain('m:=sh.hadd|~hip.ext+kn.ext');
  });
});

describe('FXE', () => {
  const c = (s: string): string => { const p = parseFxe(s); if (!p.ok) throw new Error(p.issues.map((i) => i.message).join('; ')); return p.canonical; };
  test('writes ? for missing standard layers', () => expect(c('FXE=1.0/k:mac/l:feet')).toBe('FXE=1.0S/k:mac/l:feet/s:?/m:?'));
  test('drops extended values the form implies', () => expect(c('FXE=1.0/k:imp/f:bell.dumb/r:grav')).toBe('FXE=1.0S/k:imp/f:bell.dumb'));
  test('keeps stated extended layers and flags N', () => expect(c('FXE=1.0/k:mac/l:feet/s:supine.incline/m:push.fwd/g:incl/r:plate')).toBe('FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/g:incl'));
  test('sorts combination configurations', () => expect(c('FXE=1.0/k:mac/l:hands/s:seated/m:sh.habd ; k:mac/l:arms/s:seated/m:sh.hadd')).toBe('FXE=1.0S/k:mac/l:arms/s:seated/m:sh.hadd;k:mac/l:hands/s:seated/m:sh.habd'));
  test('form must match kind', () => expect(parseFxe('FXE=1.0/k:sup/f:bell.dumb').ok).toBe(false));
  test('requires the revision', () => expect(parseFxe('FXE=1S/k:none').ok).toBe(false));
});
