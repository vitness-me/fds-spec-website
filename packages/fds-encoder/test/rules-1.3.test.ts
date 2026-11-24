import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { FXI_RULES } from '../src/alphabet.js';
import { build } from '../src/build.js';
import type { Answers, Built, Entry } from '../src/build.js';
import { checkCollisions, readLibrary } from '../src/collide.js';
import { compare } from '../src/compare.js';
import { crossCheck, mainEquipment } from '../src/crosscheck.js';
import { parseFxe, parseFxi } from '../src/syntax.js';
import { FLOW, REPO, WORDS, ex, fxi, problems } from './support.js';

const TEMPLATES = WORDS.words;
const FEET_IMPLIED = 'floor@feet is implied';

describe('the rules revision', () => {
  test('is the revision of the FDS registries the encoder was built from', () => {
    const registry = JSON.parse(readFileSync(`${REPO}specification/registries/descriptors/fxi.registry.json`, 'utf8')) as { rules: string };
    expect(FXI_RULES).toBe(registry.rules);
    expect(FLOW.rules).toBe(registry.rules);
  });
});



describe('a grip change on a pull-up or pulldown word changes the shoulder action', () => {
  test('close, neutral or underhand grips pull down from overhead in front of the face', () => {
    expect(fxi(ex('lat-pulldown', ['width'], { 'grip.width': 'narrow' }))).toBe('FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mach@hands/g:w-n');
    expect(fxi(ex('lat-pulldown', ['hand'], { 'grip.hand': 'ne' }))).toBe('FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mach@hands/g:ne');
    expect(fxi(ex('pull-up', ['hand'], { 'grip.hand': 'su' }))).toBe('FXI=1.0S/m:el.flex+sh.ext.oh/o:hanging/s:bar/l:bw/g:su');
  });
  test('an overhand grip at medium or wide width keeps the pull out at the sides', () => {
    expect(fxi(ex('lat-pulldown', ['width'], { 'grip.width': 'wide' }))).toBe('FXI=1.0S/m:el.flex+sh.add/o:seated/l:mach@hands/g:w-w');
    expect(fxi(ex('pull-up', ['hand'], { 'grip.hand': 'pr' }))).toBe('FXI=1.0S/m:el.flex+sh.add/o:hanging/s:bar/l:bw');
    expect(fxi(ex('lat-pulldown'))).toBe('FXI=1.0S/m:el.flex+sh.add/o:seated/l:mach@hands');
  });
  test('the word and a joint-by-joint build of a close-grip pulldown agree', () => {
    const scratch = ex('lat-pulldown', ['motion', 'width'], {
      'motion.phases': '1', 'p1.kind': 'usual', 'p1.joints': ['el', 'sh'], 'p1.el': ['flex'], 'p1.sh': ['pull-front'], 'p1.short': ['usual'], 'p1.also': 'usual',
      symmetry: 'usual', 'grip.width': 'narrow',
    });
    expect(fxi(scratch)).toBe(fxi(ex('lat-pulldown', ['width'], { 'grip.width': 'narrow' })));
  });
});

describe('feet on the floor are implied only under a surface that bears the trunk', () => {
  test('no movement word trips the checker', () => {
    for (const t of TEMPLATES) {
      const text = `FXI=1.0S/${t.fxi}${t.fxi.includes('l:') ? '' : '/l:?'}`;
      const p = parseFxi(text);
      if (!p.ok) continue;
      expect([t.id, crossCheck(p.canonical, 'FXE=1.0S/k:?').filter((w) => w.includes(FEET_IMPLIED))]).toEqual([t.id, []]);
    }
  });
  test('a lean-back row keeps its feet; a body lying on a ball or bench does not', () => {
    expect(crossCheck('FXI=1.0S/m:el.flex+sh.ext/o:supine/s:bar@hands+floor@feet/l:bw', 'FXE=1.0S/k:sup/f:bar.fixed')).toEqual([]);
    expect(crossCheck('FXI=1.0S/m:el.flex+sh.ext/o:supine.incline/s:floor@feet+strap@hands/l:bw', 'FXE=1.0S/k:sup/f:strap.susp')).toEqual([]);
    expect(crossCheck('FXI=1.0S/m:sp.flex/o:supine/k:trunk/s:ball+floor@feet/l:bw', 'FXE=1.0S/k:sup/f:ball.stab').some((w) => w.includes(FEET_IMPLIED))).toBe(true);
    expect(crossCheck('FXI=1.0S/m:hip.ext/o:supine/k:trunk/s:bench@back+floor@feet/l:bw', 'FXE=1.0S/k:sup/f:bench').some((w) => w.includes(FEET_IMPLIED))).toBe(true);
  });
  test('a custom support under a lean-back row keeps the feet, as the word does', () => {
    const custom = ex('inverted-row', ['support'], { support: 'custom', 'sup1.surface': 'bench', 'sup1.points': ['hands'], 'sup.more': 'yes', 'sup2.surface': 'floor', 'sup2.points': ['feet'] });
    expect(fxi(custom)).toBe('FXI=1.0S/m:el.flex+sh.ext/o:supine/s:bench@hands+floor@feet/l:bw');
    expect(fxi(ex('crunch', ['support'], { support: 'custom', 'sup1.surface': 'ball', 'sup1.points': ['usual'], 'sup.more': 'yes', 'sup2.surface': 'floor', 'sup2.points': ['feet'] })))
      .toBe('FXI=1.0S/m:sp.flex/o:supine/k:trunk/s:ball/l:bw');
  });
});

describe('an implement of unknown kind stays an implement when its hold point is unknown too', () => {
  test('?@? is kept; a bare ? stays open', () => {
    expect(parseFxi('FXI=1.0S/m:sp.lflex/o:side-lying/s:ball/l:?@?').canonical).toBe('FXI=1.0S/m:sp.lflex/o:side-lying/s:ball/l:?@?');
    expect(parseFxi('FXI=1.0S/m:sp.lflex/o:side-lying/s:ball/l:?').canonical).toBe('FXI=1.0S/m:sp.lflex/o:side-lying/s:ball/l:?');
  });
  test('the main equipment is the unknown implement, not the support, in the tool and the checker', () => {
    expect(mainEquipment({ l: '?@?', s: 'ball' }).fxe).toBe('FXE=1.0S/k:imp/f:?');
    const b = build({ id: 'w', answers: ex('push-up', ['equipment'], { load: 'implement', imp1: 'unknown', hold1: 'unknown' }) }, FLOW);
    expect(b.fxi).toBe('FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:?@?');
    expect(b.fxe).toBe('FXE=1.0S/k:imp/f:?');
    const onBall = build({ id: 'b', answers: ex('crunch', ['equipment', 'support'], { support: 'custom', 'sup1.surface': 'ball', 'sup1.points': ['usual'], 'sup.more': 'usual', load: 'implement', imp1: 'unknown', hold1: 'unknown' }) }, FLOW);
    expect(onBall.fxe).toBe('FXE=1.0S/k:imp/f:?');
    expect(crossCheck(onBall.fxi!, onBall.fxe)).toEqual([]);
  });
  test('compare: ?@? is narrower than ? and broader than a named implement', () => {
    const s = (l: string): string => `FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:${l}`;
    expect(compare(s('db@hands'), s('?@?')).relation).toBe('refines');
    expect(compare(s('?@?'), s('?')).relation).toBe('compatible');
  });
});

describe('the collision check compares an entry with every entry that has its FXI', () => {
  const entry = (id: string, answers: Answers, extra: Partial<Entry> = {}): { entry: Entry; built: Built } => {
    const e: Entry = { id, answers, ...extra };
    return { entry: e, built: build(e, FLOW) };
  };
  const curl = ex('curl', ['equipment'], { load: 'implement', imp1: 'db', hold1: 'usual' });
  test('a chain of confirmed twins in one file is settled', () => {
    const r = checkCollisions([entry('a', curl), entry('b', curl, { sameAs: 'a' }), entry('c', curl, { sameAs: 'b' })], []);
    expect(r.open).toEqual([]);
    expect(r.confirmed).toBe(3);
  });
  test('a third twin is checked against the second, not only the first', () => {
    const r = checkCollisions([entry('a', curl), entry('b', curl, { differs: 'held at a slower pace' }), entry('c', curl, { sameAs: 'b' })], []);
    expect(r.open.map((c) => [c.id, c.with.id])).toEqual([['c', 'a']]);
  });
  test('every library entry with the FXI is a twin; a library entry may carry its own sameAs', () => {
    const k = build({ id: 'x', answers: curl }, FLOW).fxi!;
    const twoLib = readLibrary([{ id: 'L1', fxi: k }, { id: 'L2', fxi: k }]);
    expect(checkCollisions([entry('n', curl, { sameAs: 'L2' })], twoLib).open.map((c) => c.with.id)).toEqual(['L1']);
    const linked = readLibrary([{ id: 'L1', fxi: k }, { id: 'L2', fxi: k, sameAs: 'L1' }]);
    expect(checkCollisions([entry('n', curl, { sameAs: 'L2' })], linked)).toEqual({ open: [], gaps: [], confirmed: 2 });
    expect(checkCollisions([entry('n', curl, { sameAs: ['L1', 'L2'] })], twoLib).open).toEqual([]);
  });
});

describe('a drop start (depth jump)', () => {
  const jump = 'm:^ank.pf+hip.ext+kn.ext/o:standing';
  test('from-drop is a start code', () => {
    expect(parseFxi(`FXI=1.0S/${jump}/l:bw/r:from-drop`).ok).toBe(true);
    expect(parseFxi(`FXI=1.0S/${jump}/l:bw/r:from-drop+from-floor`).ok).toBe(false);
  });
  test('a depth jump, one onto a box, and a jump from the floor all differ', () => {
    const depth = fxi(ex('depth-jump'));
    const depthBox = fxi(ex('depth-jump', ['support'], { support: 'custom', 'sup1.surface': 'box', 'sup1.points': ['usual'], 'sup.more': 'usual' }));
    const jumpUp = fxi(ex('other', [], {
      'motion.phases': '1', 'p1.kind': 'ballistic', 'p1.joints': ['ank', 'hip', 'kn'], 'p1.ank': ['pf'], 'p1.hip': ['ext'], 'p1.kn': ['ext'], 'p1.also': 'usual',
      orientation: 'standing', load: 'bodyweight', symmetry: 'b',
    }));
    expect(depth).toBe(`FXI=1.0S/${jump}/l:bw/r:from-drop`);
    expect(depthBox).toBe(`FXI=1.0S/${jump}/s:box/l:bw/r:from-drop`);
    expect(jumpUp).toBe(`FXI=1.0S/${jump}/l:bw`);
    for (const a of [depth, depthBox]) expect(compare(a!, jumpUp!).relation).toBe('contradicting');
    expect(compare(depth!, depthBox!).relation).toBe('contradicting');
  });
});

describe('a stretching strap is an equipment form', () => {
  test('FXE strap.stretch is an accessory', () => {
    expect(parseFxe('FXE=1.0S/k:acc/f:strap.stretch').ok).toBe(true);
    expect(build({ id: 'e', answers: { subject: 'equipment', 'eq.kind': 'acc', 'eq.form.acc': 'strap.stretch' } }, FLOW).fxe).toBe('FXE=1.0S/k:acc/f:strap.stretch');
  });
});

describe('held upper arms out to the sides, and held bent knees', () => {
  test('ua.side separates an inner curl from a curl', () => {
    expect(compare(fxi(ex('curl', ['equipment', 'held'], { load: 'implement', imp1: 'db', hold1: 'usual', held: ['ua.side'] }))!, fxi(ex('curl', ['equipment'], { load: 'implement', imp1: 'db', hold1: 'usual' }))!).relation).toBe('contradicting');
    expect(fxi(ex('curl', ['equipment', 'held'], { load: 'implement', imp1: 'db', hold1: 'usual', held: ['ua.side'] }))).toBe('FXI=1.0S/m:el.flex/o:standing/l:db@hands/h:ua.side');
  });
  test('a hanging knee raise and a hanging leg raise differ', () => {
    const knee = fxi(ex('hanging-knee-raise'));
    expect(knee).toBe('FXI=1.0S/m:hip.flex/o:hanging/s:bar/l:bw/h:kn.bent');
    expect(compare(knee!, fxi(ex('hanging-leg-raise'))!).relation).toBe('contradicting');
    expect(fxi(ex('inverted-row', ['held'], { held: ['kn.bent'] }))).toBe('FXI=1.0S/m:el.flex+sh.ext/o:supine/s:bar@hands+floor@feet/l:bw/h:kn.bent');
  });
});


describe('word data fixes', () => {
  test('a barbell on the squat word rests on the back', () => {
    expect(fxi(ex('squat', ['equipment'], { load: 'implement', imp1: 'bb', hold1: 'usual' }))).toBe('FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back');
  });
  test('a snatch width needs both hands on the bar', () => {
    expect(fxi(ex('snatch', ['sides'], { symmetry: 'u', 'symmetry.scope': 'arms' }))).not.toContain('w-w');
    expect(fxi(ex('snatch'))).toContain('g:w-w');
    expect(problems(ex('snatch', ['sides', 'width'], { symmetry: 'u', 'symmetry.scope': 'arms', 'grip.width': 'wide' }))).toBe('');
  });
});

describe('held codes that cannot combine', () => {
  test('straight legs and bent knees, upper arms overhead and out to the sides', () => {
    expect(parseFxi('FXI=1.0S/m:hip.flex/o:hanging/s:bar/l:bw/h:kn.bent+legs.l').ok).toBe(false);
    expect(parseFxi('FXI=1.0S/m:el.ext/o:standing/l:db@hands/h:ua.oh+ua.side').ok).toBe(false);
  });
});

describe('the owner cannot pick held codes that contradict', () => {
  test('the tool rejects them as an answer error', () => {
    expect(problems(ex('curl', ['equipment', 'held'], { load: 'implement', imp1: 'db', hold1: 'usual', held: ['ua.oh', 'ua.side'] }))).toMatch(/cannot both be held/);
    expect(problems(ex('hanging-leg-raise', ['held'], { held: ['kn.bent', 'legs.l'] }))).toMatch(/cannot both be held/);
  });
});
