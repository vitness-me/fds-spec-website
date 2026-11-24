import { describe, expect, test } from 'vitest';
import { build } from '../src/build.js';
import type { Answers, Built, Entry } from '../src/build.js';
import { checkCollisions, readLibrary } from '../src/collide.js';
import { compare } from '../src/compare.js';
import { crossCheck, mainEquipment } from '../src/crosscheck.js';
import { parseFxi } from '../src/syntax.js';
import { FLOW, ex, fxi, problems } from './support.js';

describe('compare: a parent code covers its children', () => {
  const push = (s: string): string => `FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:${s}@hands+floor@feet/l:bw`;
  test('BOSU side', () => {
    expect(compare(push('dome'), push('dome.up')).relation).toBe('refined-by');
    expect(compare(push('dome.up'), push('dome')).relation).toBe('refines');
    expect(compare(push('dome.up'), push('dome.down')).relation).toBe('contradicting');
    expect(compare(push('dome.up'), push('ball')).relation).toBe('contradicting');
  });
  test('cardio cycle', () => {
    const tm = (t: string): string => `FXI=1.0S/m:~hip.ext+kn.ext/o:standing/l:${t}@feet/x:rc`;
    expect(compare(tm('erg'), tm('erg.gait')).relation).toBe('refined-by');
    expect(compare(tm('erg.step'), tm('erg.gait')).relation).toBe('contradicting');
  });
  test('hang height', () => {
    const c = (r: string): string => `FXI=1.0S/m:ank.pf+hip.ext+kn.ext>el.flex>hip.ext+kn.ext/o:standing/l:bb@hands/r:${r}`;
    expect(compare(c('from-top'), c('from-top.knee')).relation).toBe('refined-by');
    expect(compare(c('from-top.knee'), c('from-floor')).relation).toBe('contradicting');
    expect(compare(c('from-top.knee'), c('from-top.knee')).relation).toBe('identical');
  });
  test('the accessory layer is extended: absent on one side refines, different values contradict', () => {
    const s = 'FXI=1.0S/m:%ank.df+kn.ext/o:seated/l:bw/x:u';
    expect(compare(`${s}/a:strap`, s).relation).toBe('refines');
    expect(compare(`${s}/a:strap`, `${s}/a:partner`).relation).toBe('contradicting');
    expect(parseFxi(`${s}/a:strap`).canonical).toBe('FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:bw/x:u/a:strap');
    expect(parseFxi(`${s}/a:none`).canonical).toBe(s);
  });
  test('1.1 strings without children keep their relations', () => {
    expect(compare('FXI=1.0S/m:~hip.ext+kn.ext/o:standing/l:erg@feet/x:rc', 'FXI=1.0S/m:~hip.ext+kn.ext/o:standing/l:erg@feet/x:rc').relation).toBe('identical');
  });
});

describe('syntax additions', () => {
  test('rolling and pressure holds have no joint direction', () => {
    expect(parseFxi('FXI=1.0S/m:~0/o:prone/s:roller@thighs/l:bw').ok).toBe(true);
    expect(parseFxi('FXI=1.0S/m:%0/o:prone/l:bw').ok).toBe(false);
  });
  test('stance is kept for a leg press, still dropped for a push-up', () => {
    expect(parseFxi('FXI=1.0S/m:hip.ext+kn.ext/o:supine.incline/l:mach@feet/g:st-w').canonical).toContain('g:st-w');
    expect(parseFxi('FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:bw/g:st-w').canonical).not.toContain('g:');
  });
  test('seated.bent drops a seat surface like seated', () => {
    expect(parseFxi('FXI=1.0S/m:sh.abd/o:seated.bent/s:bench/l:db@hands').canonical).toBe('FXI=1.0S/m:sh.abd/o:seated.bent/l:db@hands');
  });
  test('side line of pull cannot combine with high or low', () => {
    expect(parseFxi('FXI=1.0S/m:el.ext+sh.hadd/o:standing/l:cable@hands/p:hi+side').ok).toBe(false);
  });
});

describe('one main-equipment rule for the builder and the checker', () => {
  test('an implement of unknown kind beats a support', () => {
    expect(mainEquipment({ l: '?@hands', s: 'wall@back' }).fxe).toBe('FXE=1.0S/k:imp/f:?');
    expect(mainEquipment({ l: '?', s: 'wall@back' }).fxe).toBe('FXE=1.0S/k:sup/f:wall');
    expect(mainEquipment({ l: 'band@hands+db@hands' }).token).toBe('db');
    expect(mainEquipment({ l: 'db@hands+cable@hands' }).token).toBe('cable');
    expect(mainEquipment({ l: 'bw' }).fxe).toBe('FXE=1.0S/k:none');
  });
  test('the builder and the checker agree on the main equipment', () => {
    const rows: [string, Answers][] = [
      ['unknown implement', ex('squat', ['equipment'], { load: 'implement', imp1: 'unknown', hold1: 'hands' })],
      ['db + band', ex('curl', ['equipment', 'extra'], { load: 'implement', imp1: 'db', hold1: 'usual', imp2: 'band', hold2: 'usual', 'band.type': 'usual' })],
    ];
    for (const [, a] of rows) {
      const b = build({ id: 't', answers: a }, FLOW);
      expect(crossCheck(b.fxi!, b.fxe).filter((w) => w.includes('main equipment'))).toEqual([]);
    }
  });
});

describe('builder rules', () => {
  test('hold1 is asked whenever the owner names the load', () => {
    expect(problems(ex('squat', ['equipment'], { load: 'implement', imp1: 'bb' }))).toMatch(/hold1: no answer/);
    expect(fxi(ex('squat', ['equipment'], { load: 'implement', imp1: 'bb', hold1: 'shoulders' }))).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@shoulders');
  });
  test('an assisted machine drops the template bar', () => {
    expect(fxi(ex('chin-up', ['equipment'], { load: 'machine', 'mac.motion': 'assist', 'mac.direction': 'up', 'mac.contact': 'knee', 'mac.chest': 'usual' })))
      .toBe('FXI=1.0S/m:el.flex+sh.ext/o:hanging/l:mach@assist/g:su');
  });
  test('the snatch width belongs to a bar only', () => {
    expect(fxi(ex('snatch', ['equipment', 'sides'], { load: 'implement', imp1: 'kb', hold1: 'usual', symmetry: 'u', 'symmetry.scope': 'arms' }))).not.toContain('w-w');
    expect(fxi(ex('snatch'))).toContain('g:w-w');
  });
  test('a band in leg-only work goes on the feet', () => {
    expect(fxi(ex('hanging-leg-raise', ['equipment'], { load: 'implement', imp1: 'band', hold1: 'usual', 'band.type': 'usual' }))).toBe('FXI=1.0S/m:hip.flex/o:hanging/s:bar/l:band@feet');
  });
  test('a Smith press is held in the hands; behind the neck a bar rests on the back', () => {
    expect(fxi(ex('shoulder-press', ['equipment'], { load: 'smith', hold1: 'usual' }))).toBe('FXI=1.0S/m:el.ext+sh.flex/o:standing/l:smith@hands');
    expect(fxi(ex('shoulder-press', ['equipment', 'line'], { load: 'implement', imp1: 'bb', hold1: 'usual', line: ['behind'] }))).toBe('FXI=1.0S/m:el.ext+sh.flex/o:standing/l:bb@back/p:behind');
  });
  test('feet on the floor are implied under a body on a ball', () => {
    expect(fxi(ex('crunch', ['support'], { support: 'custom', 'sup1.surface': 'ball', 'sup1.points': ['usual'], 'sup.more': 'yes', 'sup2.surface': 'floor', 'sup2.points': ['feet'] })))
      .toBe('FXI=1.0S/m:sp.flex/o:supine/k:trunk/s:ball/l:bw');
  });
  test('sides are asked on every build path', () => {
    const scratch = ex('other', [], { 'motion.phases': '1', 'p1.kind': 'static-stretch', 'p1.joints': ['ank'], 'p1.ank': ['df'], 'p1.also': 'usual', orientation: 'standing', load: 'bodyweight' });
    expect(problems(scratch)).toMatch(/symmetry: no answer/);
    expect(fxi({ ...scratch, symmetry: 'u', 'symmetry.scope': 'usual' })).toBe('FXI=1.0S/m:%ank.df/o:standing/l:bw/x:u');
  });
  test('word questions: required where there is no usual, and gated by word', () => {
    expect(problems(ex('plank-limb-raise', [], { 'word.base': 'usual' }))).toMatch(/word.limbs: no answer/);
    expect(problems(ex('calf-stretch', [], { 'word.knee': 'usual', 'word.setup': 'step', 'word.limbs': 'arm' }))).toMatch(/not asked/);
    expect(fxi(ex('calf-stretch', [], { 'word.knee': 'bent', 'word.setup': 'usual' }))).toBe('FXI=1.0S/m:%ank.df+kn.flex/o:standing/l:bw/x:u');
  });
  test('stance on a leg press is accepted, on a push-up rejected', () => {
    expect(fxi(ex('leg-press', ['stance'], { stance: 'wide' }))).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:supine.incline/l:mach@feet/g:st-w');
    expect(problems(ex('push-up', ['stance'], { stance: 'wide' }))).toMatch(/only for standing exercises and foot-plate machines/);
  });
  test('an equipment row prints the standard FXE, and the full record separately', () => {
    const b = build({ id: 'e', answers: { subject: 'equipment', 'eq.kind': 'mac', 'eq.mac.motion': 'kn.flex', 'eq.mac.contact': ['usual'], 'eq.mac.posture': 'prone', 'eq.details': 'yes', 'eq.drive': 'plate', 'eq.constraint': 'arc', 'eq.angle': 'usual', 'eq.attrs': ['usual'], 'eq.more': 'usual' } });
    expect(b.fxe).toBe('FXE=1.0S/k:mac/l:ankle/s:prone/m:kn.flex');
    expect(b.fxeFull).toBe('FXE=1.0N/k:mac/l:ankle/s:prone/m:kn.flex/r:plate/c:arc');
  });
  test('an entry may carry notes, null included, and a mode', () => {
    expect(build({ id: 'n', answers: ex('push-up'), notes: null, mode: 'import' } as Entry, FLOW).fxi).toBe('FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:bw');
  });
});

describe('collision check', () => {
  const entry = (id: string, answers: Answers, extra: Partial<Entry> = {}): { entry: Entry; built: Built } => {
    const e: Entry = { id, answers, ...extra };
    return { entry: e, built: build(e, FLOW) };
  };
  const curl = ex('curl', ['equipment'], { load: 'implement', imp1: 'db', hold1: 'usual' });
  const hammer = ex('curl', ['equipment', 'hand'], { load: 'implement', imp1: 'db', hold1: 'usual', 'grip.hand': 'ne' });
  const library = readLibrary([{ id: 'lib:curl', fxi: build({ id: 'x', answers: curl }, FLOW).fxi }]);
  test('a new FXI equal to a library FXI is a collision, with questions that could separate them', () => {
    const r = checkCollisions([entry('new:curl', curl)], library, FLOW);
    expect(r.open.map((c) => [c.id, c.with.id])).toEqual([['new:curl', 'lib:curl']]);
    expect(r.open[0]!.separating.some((s) => s.startsWith('changes → hand'))).toBe(true);
  });
  test('sameAs confirms; differs records a vocabulary gap; a different exercise passes', () => {
    expect(checkCollisions([entry('new:curl', curl, { sameAs: 'lib:curl' })], library)).toEqual({ open: [], gaps: [], confirmed: 1 });
    expect(checkCollisions([entry('new:curl', curl, { differs: 'tempo-free cheat curl' })], library).gaps.length).toBe(1);
    expect(checkCollisions([entry('new:hammer', hammer)], library).open).toEqual([]);
  });
  test('two equal keys within one answers file collide', () => {
    const r = checkCollisions([entry('a', curl), entry('b', curl)], []);
    expect(r.open.map((c) => [c.id, c.with.kind, c.with.id])).toEqual([['b', 'file', 'a']]);
    expect(checkCollisions([entry('a', curl), entry('b', curl, { sameAs: 'a' })], []).open).toEqual([]);
  });
  test('rebuilding an entry already in the library is not a collision', () => {
    expect(checkCollisions([entry('lib:curl', curl)], library).open).toEqual([]);
  });
  test('a library may hold FXI and FXE strings, made canonical; no hashed key is read', () => {
    const k = build({ id: 'x', answers: curl }, FLOW).fxi!;
    const reordered = 'FXI=1.0/l:db@hands/o:standing/m:el.flex';
    expect(readLibrary([reordered, 'FXE=1.0S/k:imp/f:bell.dumb']).map((l) => l.fxi ?? l.fxe)).toEqual([k, 'FXE=1.0S/k:imp/f:bell.dumb']);
    expect(checkCollisions([entry('n', curl)], readLibrary({ rows: [reordered] })).open.length).toBe(1);
    expect(() => readLibrary([{ id: 'old', key: 'ABCDEFGHJK-0123456789ABC-SF10' }])).toThrow(/no hashed key/);
    expect(() => readLibrary(['not a descriptor'])).toThrow(/not a valid FXI or FXE/);
  });
});
