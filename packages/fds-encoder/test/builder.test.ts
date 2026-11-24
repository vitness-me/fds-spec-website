import { describe, expect, test } from 'vitest';
import {
  ACCESSORIES, BODY_POINTS, DESIGN_ATTRS, DRIVES, EQUIPMENT_TOKENS, FOOTWORK, FORMS, GUIDE_ANGLES, HELD, JOINT_ACTIONS, LINES, LOAD_IFACES,
  MAC_CONSTRAINTS, MAC_DIRECTIONS, MAC_SINGLE_JOINT, ORIENTATIONS, POSTURES, RANGES,
} from '../src/alphabet.js';
import { AnswerError, InternalError, build, buildWith, openOptions } from '../src/build.js';
import type { Answer, Answers } from '../src/build.js';
import type { FlowQuestion } from '../src/flow.js';
import { compare } from '../src/compare.js';
import { parseFxe, parseFxi } from '../src/syntax.js';
import { FLOW, WORDS, eq, ex, phase } from './support.js';

const QUESTIONS = FLOW.questions;
const TEMPLATES = WORDS.words;

// Owner answers and the strings they build. Most use the test word set; the "joint by joint" ones describe the motion
// through "other", as an encoder with no movement-word dataset does.
const EXAMPLES: [string, Answers, string | null, string | null][] = [
  ['1 Push-up', ex('push-up'), 'FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:bw', 'FXE=1.0S/k:none'],
  ['2 Diamond push-up', ex('push-up', ['width'], { 'grip.width': 'touching' }), 'FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:bw/g:w-t', null],
  ['8 Barbell back squat', ex('squat', [], { load: 'implement', imp1: 'bb', hold1: 'usual' }), 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back', 'FXE=1.0S/k:imp/f:bar.straight'],
  ['14 Barbell full clean', ex('clean'), 'FXI=1.0S/m:ank.pf+hip.ext+kn.ext>el.flex>hip.ext+kn.ext/o:standing/l:bb@hands', null],
  ['17 Alternating dumbbell curl', ex('curl', ['sides'], { load: 'implement', imp1: 'db', hold1: 'usual', symmetry: 'a', 'symmetry.scope': 'usual' }), 'FXI=1.0S/m:el.flex/o:standing/l:db@hands/x:a', null],
  ['18 One-arm cable curl', ex('curl', ['sides'], { load: 'cable', hold1: 'usual', symmetry: 'u', 'symmetry.scope': 'arms' }), 'FXI=1.0S/m:el.flex/o:standing/l:cable@hands/x:u', 'FXE=1.0S/k:stn/f:cable'],
  ['20 Chin-up', ex('chin-up'), 'FXI=1.0S/m:el.flex+sh.ext/o:hanging/s:bar/l:bw/g:su', null],
  ['21 Wide-grip pull-up', ex('pull-up', ['width'], { 'grip.width': 'wide' }), 'FXI=1.0S/m:el.flex+sh.add/o:hanging/s:bar/l:bw/g:w-w', null],
  ['22 Lat machine pulldown, wide grip', ex('lat-pulldown', ['width'], { 'grip.width': 'wide' }), 'FXI=1.0S/m:el.flex+sh.add/o:seated/l:mach@hands/g:w-w', 'FXE=1.0S/k:mac/l:hand/s:seat/m:pull.down'],
  ['23 Seated machine leg curl', ex('seated-leg-curl'), 'FXI=1.0S/m:kn.flex/o:seated/l:mach@ankles', 'FXE=1.0S/k:mac/l:ankle/s:seat/m:kn.flex'],
  ['24 High cable fly, standing', ex('cable-fly', ['motion', 'line'], { load: 'cable', hold1: 'usual', symmetry: 'usual', 'motion.phases': '1', ...phase(1, { sh: ['away-footward'] }), line: ['hi'] }), 'FXI=1.0S/m:sh.ext+sh.hadd/o:standing/l:cable@hands/p:hi', null],
  ['26 One-arm kettlebell clean and push press', ex('other', ['sides'], {
    'motion.phases': '3', ...phase(1, { hip: ['ext'] }), ...phase(2, { el: ['flex'] }),
    ...phase(3, { el: ['ext'], hip: ['ext'], kn: ['ext'], sh: ['up-overhead'] }, { 'p3.short': ['hip', 'kn'] }),
    orientation: 'standing', load: 'implement', imp1: 'kb', hold1: 'hands', symmetry: 'u', 'symmetry.scope': 'arms',
  }), 'FXI=1.0S/m:hip.ext>el.flex>el.ext+hip.ext-+kn.ext-+sh.flex/o:standing/l:kb@hands/x:u@arms', null],
  ['27 Dumbbell lunge with overhead press', ex('other', ['footwork', 'sides'], {
    'motion.phases': '2', ...phase(1, { el: ['ext'], sh: ['up-overhead'] }), ...phase(2, { hip: ['ext'], kn: ['ext'] }),
    orientation: 'standing', load: 'implement', imp1: 'db', hold1: 'hands', footwork: 'step.fwd', symmetry: 'u', 'symmetry.scope': 'legs',
  }), 'FXI=1.0S/m:el.ext+sh.flex>hip.ext+kn.ext/o:standing/f:step.fwd/l:db@hands/x:u@legs', null],
  ['28 Rower', ex('rower'), 'FXI=1.0S/m:~el.flex+hip.ext+kn.ext+sh.ext/o:seated/l:erg.row@hands', 'FXE=1.0S/k:erg/c:rail/l:hand/s:seat/m:row'],
  ['29 Walking', ex('walk'), 'FXI=1.0S/m:~hip.ext+kn.ext/o:standing/f:travel.fwd/l:bw/x:rc', null],
  ['33a Static hip flexor stretch', ex('hip-flexor-stretch'), 'FXI=1.0S/m:%hip.ext/o:kneeling.half/l:bw/x:u', null],
  ['33b Dynamic hip flexor stretch', ex('hip-flexor-stretch', ['kind'], { 'motion.kind': 'dynamic-stretch' }), 'FXI=1.0S/m:&hip.ext/o:kneeling.half/l:bw/x:u', null],
  ['39 American kettlebell swing', ex('american-swing'), 'FXI=1.0S/m:hip.ext+sh.flex/o:standing/l:kb*1@hands', null],
  ["40 Coach's finisher", ex('unknown', [], { orientation: 'unknown', load: 'implement', imp1: 'unknown', hold1: 'unknown' }), 'FXI=1.0S/m:?/o:?/l:?@?', 'FXE=1.0S/k:imp/f:?'],
  ['42 Monster walk', ex('monster-walk', [], { 'band.type': 'usual' }), 'FXI=1.0S/m:~hip.abd/o:standing/f:travel.fwd/l:band@?/x:rc', 'FXE=1.0S/k:imp/f:band'],
  ['E1 45° sled leg press (row)', ex('leg-press'), null, 'FXE=1.0S/k:mac/l:foot/s:recline/m:push.fwd'],
  ['E1 45° sled leg press (registry)', eq({
    'eq.kind': 'mac', 'eq.mac.motion': 'push', 'eq.mac.direction': 'fwd', 'eq.mac.contact': ['foot'], 'eq.mac.posture': 'usual',
    'eq.details': 'yes', 'eq.drive': 'plate', 'eq.constraint': 'line', 'eq.angle': 'incl', 'eq.attrs': ['usual'], 'eq.more': 'usual',
  }), null, 'FXE=1.0N/k:mac/l:foot/s:recline/m:push.fwd/r:plate/c:line/g:incl'],
  ['E3a Seated leg curl machine', ex('seated-leg-curl'), null, 'FXE=1.0S/k:mac/l:ankle/s:seat/m:kn.flex'],
  ['E5 Seated lever row machine', ex('row-machine'), null, 'FXE=1.0S/k:mac/l:hand/s:seat.chest/m:pull.back'],
  ['E6 Assisted wide-grip pull-up machine', eq({ 'eq.kind': 'mac', 'eq.mac.motion': 'assist', 'eq.mac.direction': 'up', 'eq.mac.contact': ['knee'], 'eq.mac.posture': 'usual', 'eq.details': 'usual', 'eq.more': 'usual' }), null, 'FXE=1.0S/k:mac/l:knee/s:hang/m:assist.up'],
  ['E7 Stepmill walk', eq({ 'eq.kind': 'erg', 'eq.erg.type': 'stepmill', 'eq.details': 'usual' }), null, 'FXE=1.0S/k:erg/c:belt/l:foot/s:stand/m:step'],
  ['E8 Stair climber', eq({ 'eq.kind': 'erg', 'eq.erg.type': 'stair', 'eq.details': 'usual' }), null, 'FXE=1.0S/k:erg/c:?/l:foot/s:stand/m:step'],
  ['E9 Smith machine', eq({ 'eq.kind': 'stn', 'eq.form.stn': 'smith', 'eq.details': 'usual' }), null, 'FXE=1.0S/k:stn/f:smith'],
  ['E10 cable', eq({ 'eq.kind': 'stn', 'eq.form.stn': 'cable', 'eq.details': 'usual' }), null, 'FXE=1.0S/k:stn/f:cable'],
  ['E11 Roman chair', eq({ 'eq.kind': 'sup', 'eq.form.sup': 'pad.hyper', 'eq.details': 'usual' }), null, 'FXE=1.0S/k:sup/f:pad.hyper'],
  ['E12 knee-raise station', eq({ 'eq.kind': 'sup', 'eq.form.sup': 'station.vkr', 'eq.details': 'usual' }), null, 'FXE=1.0S/k:sup/f:station.vkr'],
  ['E13 Superband', eq({ 'eq.kind': 'imp', 'eq.form.imp': 'band.loop', 'eq.details': 'usual' }), null, 'FXE=1.0S/k:imp/f:band.loop'],
  ['E13 band (parent)', eq({ 'eq.kind': 'imp', 'eq.form.imp': 'band', 'eq.details': 'usual' }), null, 'FXE=1.0S/k:imp/f:band'],
  ['E14 machine', eq({ 'eq.kind': 'mac', 'eq.mac.motion': 'unknown', 'eq.mac.contact': ['unknown'], 'eq.mac.posture': 'usual', 'eq.details': 'usual', 'eq.more': 'usual' }), null, 'FXE=1.0S/k:mac/l:?/s:?/m:?'],
  ['E15 pec deck with rear-delt arms', eq({
    'eq.kind': 'mac', 'eq.mac.motion': 'sh.hadd', 'eq.mac.contact': ['usual'], 'eq.mac.posture': 'usual', 'eq.details': 'usual', 'eq.more': 'yes',
    'eq2.mac.motion': 'sh.habd', 'eq2.mac.contact': ['usual'], 'eq2.mac.posture': 'usual', 'eq2.details': 'usual',
  }), null, 'FXE=1.0S/k:mac/l:arm/s:seat/m:sh.hadd;k:mac/l:hand/s:seat.chest/m:sh.habd'],
  ['43 Dumbbell lateral raise', {'subject': 'usual', 'movement': 'lateral-raise', 'changes': ['equipment'], 'load': 'implement', 'imp1': 'db', 'hold1': 'usual'}, 'FXI=1.0S/m:sh.abd/o:standing/l:db@hands', 'FXE=1.0S/k:imp/f:bell.dumb'],
  ['44 Seated bent-over lateral raise, bent arms', {'subject': 'usual', 'movement': 'lateral-raise', 'changes': ['posture', 'equipment', 'held'], 'orientation': 'seated.bent', 'load': 'implement', 'imp1': 'db', 'hold1': 'usual', 'held': ['el.bent']}, 'FXI=1.0S/m:sh.abd/o:seated.bent/l:db@hands/h:el.bent', 'FXE=1.0S/k:imp/f:bell.dumb'],
  ['45a Straight-knee calf stretch', {'subject': 'usual', 'movement': 'calf-stretch', 'word.knee': 'straight', 'word.setup': 'wall-hands', 'changes': ['usual']}, 'FXI=1.0S/m:%ank.df+kn.ext/o:standing/s:wall@hands/l:bw/x:u', 'FXE=1.0S/k:sup/f:wall'],
  ['45b Bent-knee calf stretch', {'subject': 'usual', 'movement': 'calf-stretch', 'word.knee': 'bent', 'word.setup': 'wall-hands', 'changes': ['usual']}, 'FXI=1.0S/m:%ank.df+kn.flex/o:standing/s:wall@hands/l:bw/x:u', 'FXE=1.0S/k:sup/f:wall'],
  ['46 Rope calf stretch', {'subject': 'usual', 'movement': 'calf-stretch', 'word.knee': 'usual', 'word.setup': 'strap', 'changes': ['usual']}, 'FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:bw/x:u/a:strap', 'FXE=1.0S/k:none'],
  ['48 Barbell hang clean from below the knees', {'subject': 'usual', 'movement': 'clean', 'changes': ['start'], 'range.start': 'from-top.knee'}, 'FXI=1.0S/m:ank.pf+hip.ext+kn.ext>el.flex>hip.ext+kn.ext/o:standing/l:bb@hands/r:from-top.knee', 'FXE=1.0S/k:imp/f:bar.straight'],
  ['49 Dome-down BOSU push-up', {'subject': 'usual', 'movement': 'push-up', 'changes': ['support'], 'support': 'custom', 'sup1.surface': 'dome.down', 'sup1.points': ['hands'], 'sup.more': 'yes', 'sup2.surface': 'floor', 'sup2.points': ['feet']}, 'FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:dome.down@hands+floor@feet/l:bw', 'FXE=1.0S/k:sup/f:dome'],
  ['50 Narrow-stance leg press', {'subject': 'usual', 'movement': 'leg-press', 'changes': ['stance'], 'stance': 'narrow'}, 'FXI=1.0S/m:hip.ext+kn.ext/o:supine.incline/l:mach@feet/g:st-n', 'FXE=1.0S/k:mac/l:foot/s:recline/m:push.fwd'],
  ['51b One-arm cable triceps extension', {'subject': 'usual', 'movement': 'triceps-pushdown', 'changes': ['sides'], 'symmetry': 'u', 'symmetry.scope': 'usual'}, 'FXI=1.0S/m:el.ext/o:standing/l:cable@hands/x:u', 'FXE=1.0S/k:stn/f:cable'],
  ['55 Assisted pull-up', {'subject': 'usual', 'movement': 'pull-up', 'changes': ['equipment'], 'load': 'machine', 'mac.motion': 'assist', 'mac.direction': 'up', 'mac.contact': 'knee', 'mac.chest': 'usual'}, 'FXI=1.0S/m:el.flex+sh.add/o:hanging/l:mach@assist', 'FXE=1.0S/k:mac/l:knee/s:hang/m:assist.up'],
  ['56 Alternating plank with arm and leg raise', {'subject': 'usual', 'movement': 'plank-limb-raise', 'word.limbs': 'both', 'word.base': 'hands', 'changes': ['usual']}, 'FXI=1.0S/m:=sp.flex|hip.ext+sh.flex/o:prone/s:floor@feet,hands/l:bw/x:a', 'FXE=1.0S/k:none'],
  ['57 Behind-the-neck barbell press', {'subject': 'usual', 'movement': 'shoulder-press', 'changes': ['equipment', 'line'], 'load': 'implement', 'imp1': 'bb', 'hold1': 'usual', 'line': ['behind']}, 'FXI=1.0S/m:el.ext+sh.flex/o:standing/l:bb@back/p:behind', 'FXE=1.0S/k:imp/f:bar.straight'],
  ['E16 Seated reverse fly machine', {'subject': 'equipment', 'eq.kind': 'mac', 'eq.mac.motion': 'sh.habd', 'eq.mac.contact': ['usual'], 'eq.mac.posture': 'usual', 'eq.details': 'usual', 'eq.more': 'usual'}, null, 'FXE=1.0S/k:mac/l:hand/s:seat.chest/m:sh.habd'],
  ['E17 Lying lever leg curl (registry, details)', {'subject': 'equipment', 'eq.kind': 'mac', 'eq.mac.motion': 'kn.flex', 'eq.mac.contact': ['usual'], 'eq.mac.posture': 'prone', 'eq.details': 'yes', 'eq.drive': 'plate', 'eq.constraint': 'arc', 'eq.angle': 'usual', 'eq.attrs': ['usual'], 'eq.more': 'usual'}, null, 'FXE=1.0N/k:mac/l:ankle/s:prone/m:kn.flex/r:plate/c:arc'],
  ['60 Close-grip lat pulldown', ex('lat-pulldown', ['width'], { 'grip.width': 'narrow' }), 'FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:w-n', 'FXE=1.0S/k:mac/l:hand/s:seat/m:pull.down'],
  ['61 Bench lean-back row', ex('inverted-row', ['support'], { support: 'custom', 'sup1.surface': 'bench', 'sup1.points': ['hands'], 'sup.more': 'yes', 'sup2.surface': 'floor', 'sup2.points': ['feet'] }), 'FXI=1.0S/m:el.flex+sh.ext/o:supine/s:bench@hands+floor@feet/l:bw', 'FXE=1.0S/k:sup/f:bench'],
  ['63a Depth jump', ex('depth-jump'), 'FXI=1.0S/m:^ank.pf+hip.ext+kn.ext/o:standing/l:bw/r:from-drop', null],
  ['65 Hanging knee raise', ex('hanging-knee-raise'), 'FXI=1.0S/m:hip.flex/o:hanging/s:bar/l:bw/h:kn.bent', null],
  ['E18 Stretching strap', eq({ 'eq.kind': 'acc', 'eq.form.acc': 'strap.stretch' }), null, 'FXE=1.0S/k:acc/f:strap.stretch'],
  // Joint by joint, with no movement word.
  ['16 Split jerk, joint by joint', ex('other', ['footwork'], {
    'motion.phases': '2', ...phase(1, { el: ['ext'], hip: ['ext'], kn: ['ext'], sh: ['up-overhead'] }, { 'p1.short': ['hip', 'kn'] }),
    ...phase(2, { hip: ['ext'], kn: ['ext'] }, { 'p2.short': ['hip', 'kn'] }),
    orientation: 'standing', footwork: 'level>split', load: 'implement', imp1: 'bb', hold1: 'shoulders', symmetry: 'b',
  }), 'FXI=1.0S/m:el.ext+hip.ext-+kn.ext-+sh.flex>hip.ext-+kn.ext-/o:standing/f:level>split/l:bb@shoulders', 'FXE=1.0S/k:imp/f:bar.straight'],
  ['30 Mountain climber, joint by joint', ex('other', ['support'], {
    'motion.phases': '1', 'p1.kind': 'cyclic', 'p1.joints': ['hip'], 'p1.hip': ['flex'], 'p1.also': 'usual', orientation: 'prone',
    support: 'custom', 'sup1.surface': 'floor', 'sup1.points': ['feet', 'hands'], 'sup.more': 'usual', load: 'bodyweight', symmetry: 'rc', 'symmetry.scope': 'usual',
  }), 'FXI=1.0S/m:~hip.flex/o:prone/s:floor@feet,hands/l:bw/x:rc', 'FXE=1.0S/k:none'],
  ['32 Forearm side plank, joint by joint', ex('other', ['support'], {
    'motion.phases': '1', 'p1.kind': 'hold', 'p1.joints': ['sp'], 'p1.sp': ['lflex'], 'p1.also': 'usual', orientation: 'side-lying',
    support: 'custom', 'sup1.surface': 'floor', 'sup1.points': ['feet', 'forearms'], 'sup.more': 'usual', load: 'bodyweight', symmetry: 'b',
  }), 'FXI=1.0S/m:=sp.lflex/o:side-lying/s:floor@feet,forearms/l:bw', null],
  ['34 Single-leg balance board hold, joint by joint', ex('other', ['support'], {
    'motion.phases': '1', 'p1.kind': 'balance', 'p1.also': 'usual', orientation: 'standing',
    support: 'custom', 'sup1.surface': 'board', 'sup1.points': ['usual'], 'sup.more': 'usual', load: 'bodyweight', symmetry: 'u', 'symmetry.scope': 'legs',
  }), 'FXI=1.0S/m:=0/o:standing/s:board/l:bw/x:u', 'FXE=1.0S/k:sup/f:board.bal'],
  ['35a Sit-up, joint by joint', ex('other', ['moving-end'], {
    'motion.phases': '1', ...phase(1, { sp: ['flex'], hip: ['flex'] }), orientation: 'supine', end: 'trunk', load: 'bodyweight', symmetry: 'b',
  }), 'FXI=1.0S/m:hip.flex+sp.flex/o:supine/k:trunk/l:bw', null],
  ['37 Medicine ball slam, joint by joint', ex('other', [], {
    'motion.phases': '1', 'p1.kind': 'ballistic', 'p1.joints': ['sp', 'sh'], 'p1.sp': ['flex'], 'p1.sh': ['down-along'], 'p1.also': 'usual',
    orientation: 'standing', load: 'implement', imp1: 'mb', hold1: 'hands', symmetry: 'b',
  }), 'FXI=1.0S/m:^sh.ext+sp.flex/o:standing/l:mb@hands', 'FXE=1.0S/k:imp/f:ball.med'],
  ['31 Yoke walk, from the walk word', ex('walk', ['equipment'], { load: 'implement', imp1: 'yoke', hold1: 'usual' }), 'FXI=1.0S/m:~hip.ext+kn.ext/o:standing/f:travel.fwd/l:yoke@back/x:rc', 'FXE=1.0S/k:imp/f:yoke'],
];

describe('answers round-trip to the strings the rules give', () => {
  for (const [name, answers, fxi, fxe] of EXAMPLES) {
    test(name, () => {
      const b = build({ id: name, answers }, FLOW);
      if (fxi !== null) expect(b.fxi).toBe(fxi);
      if (fxe !== null) expect(b.fxeFull ?? b.fxe).toBe(fxe);
    });
  }
});

describe('templates and flow data', () => {
  test('every template parses', () => {
    for (const t of TEMPLATES) {
      const p = parseFxi(`FXI=1.0/${t.fxi}`);
      expect({ id: t.id, issues: p.issues.map((i) => i.message) }).toEqual({ id: t.id, issues: [] });
    }
  });
  test('question and option ids are unique; usual and unknown are exclusive', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
      const u = q.options.find((o) => o.id === 'usual');
      if (u !== undefined) expect(u.exclusive).toBe(true);
      if (q.usual === null) expect(u).toBeUndefined();
    }
  });
  test('every question with a published default offers "usual"', () => {
    const withoutUsual = QUESTIONS.filter((q) => q.usual === null).map((q) => q.id.replace(/^p\db?\./, 'p<n>.').replace(/^(sup)\d/, '$1<n>').replace(/^eq2\./, 'eq.'));
    expect([...new Set(withoutUsual)].sort()).toEqual([
      'eq.erg.type', 'eq.form.acc', 'eq.form.imp', 'eq.form.stn', 'eq.form.sup', 'eq.kind', 'eq.mac.direction', 'eq.mac.motion',
      'grip.end', 'grip.start', 'imp1', 'imp2', 'motion.phases', 'movement', 'word.limbs',
      ...['ank', 'el', 'fa', 'hip', 'joints', 'kn', 'nk', 'sc', 'sh', 'sp', 'wr'].map((j) => `p<n>.${j}`), 'sup<n>.surface',
    ].sort());
  });
  test('every code an FXI or FXE layer can hold is reachable from some option', () => {
    const values = new Set(QUESTIONS.flatMap((q) => q.options.flatMap((o) => (o.value ?? o.id).split('+'))));
    const missing = (codes: Iterable<string>): string[] => [...codes].filter((c) => !values.has(c));
    expect(missing(Object.keys(ORIENTATIONS))).toEqual([]);
    expect(missing(Object.keys(FOOTWORK))).toEqual([]);
    expect(missing(Object.keys(HELD))).toEqual([]);
    expect(missing(Object.keys(LINES).filter((c) => c !== 'usual'))).toEqual([]);
    expect(missing(Object.keys(RANGES))).toEqual([]);
    expect(missing(Object.keys(BODY_POINTS))).toEqual([]);
    expect(missing(Object.keys(JOINT_ACTIONS))).toEqual([]);
    expect(missing(Object.keys(EQUIPMENT_TOKENS).filter((t) => !['bw', 'mach', 'erg'].includes(t) && EQUIPMENT_TOKENS[t]!.parent !== 'erg'))).toEqual([]);
    expect(missing(Object.keys(ACCESSORIES))).toEqual([]);
    expect(missing(Object.keys(FORMS))).toEqual([]);
    expect(missing(Object.keys(LOAD_IFACES))).toEqual([]);
    expect(missing(Object.keys(POSTURES))).toEqual([]);
    expect(missing(MAC_SINGLE_JOINT)).toEqual([]);
    expect(missing(Object.keys(MAC_DIRECTIONS))).toEqual([]);
    for (const g of [DRIVES, MAC_CONSTRAINTS, GUIDE_ANGLES, DESIGN_ATTRS]) expect(missing(Object.keys(g))).toEqual([]);
    for (const c of ['w-t', 'w-n', 'w-m', 'w-w', 'st-n', 'st-m', 'st-w', 'pr', 'su', 'ne', 'mx', 'b', 'u', 'a', 'rc', 'trunk', 'both', 'limbs', '^', '~', '=', '=0', '%', '&']) expect(values.has(c)).toBe(true);
  });
});

describe('implement counts', () => {
  test('a template count that the chosen symmetry makes usual is not written', () => {
    const built = build({ id: 'one-arm', answers: ex('american-swing', ['sides'], { symmetry: 'u', 'symmetry.scope': 'arms' }) }, FLOW);
    expect(built.fxi).toBe('FXI=1.0S/m:hip.ext+sh.flex/o:standing/l:kb@hands/x:u@arms');
  });
});

describe('errors are clear', () => {
  const problems = (answers: Answers): string[] => {
    try { build({ id: 'x', answers }, FLOW); } catch (e) { if (e instanceof AnswerError) return [...e.problems]; throw e; }
    return [];
  };
  test('missing, unknown and off-path answers', () => {
    expect(problems({ subject: 'usual', movement: 'push-up' })[0]).toMatch(/^changes: no answer/);
    expect(problems(ex('push-up', [], { 'grip.width': 'wide' }))[0]).toMatch(/not asked/);
    expect(problems(ex('push-up', [], { nonsense: 'x' }))[0]).toMatch(/not a question/);
    expect(problems(ex('no-such-move'))[0]).toMatch(/is not an option/);
    expect(problems({ ...ex('push-up'), changes: 'usual' })[0]).toMatch(/list of option ids/);
    expect(problems({ ...ex('push-up'), changes: ['usual', 'width'] }).join()).toMatch(/cannot be combined/);
  });
  test('"usual" with no published default', () => {
    expect(problems(ex('other', [], { 'motion.phases': 'unknown', orientation: 'usual', load: 'bodyweight' })).join()).toMatch(/"usual" does not apply here: no movement word with a fixed position/);
    expect(problems(ex('other', [], { 'motion.phases': 'unknown', orientation: 'usual', load: 'bodyweight' })).join()).toMatch(/"usual" does not apply here/);
    expect(problems(ex('curl', [], { load: 'usual' })).join()).toMatch(/fixes no load/);
  });
  test('contradictions', () => {
    const p = problems(ex('other', [], { 'motion.phases': '1', 'p1.kind': 'usual', 'p1.joints': ['kn'], 'p1.kn': ['flex', 'ext'], 'p1.short': ['usual'], 'p1.also': 'usual', orientation: 'standing', load: 'bodyweight', symmetry: 'usual' }));
    expect(p.join()).toMatch(/kn.flex and kn.ext cannot happen in one phase/);
    expect(problems(ex('cable-fly', ['line'], { load: 'cable', hold1: 'usual', line: ['hi', 'lo'] })).join()).toMatch(/pick one of higher, lower or from the side/);
    expect(problems(ex('push-up', ['stance'], { stance: 'wide' })).join()).toMatch(/only for standing exercises/);
    expect(problems(ex('push-up', ['hold'])).join()).toMatch(/does not apply/);
    expect(problems(ex('clean', ['kind'], { 'motion.kind': 'ballistic' })).join()).toMatch(/several phases/);
    expect(problems(ex('push-up', ['motion', 'kind'], { 'motion.phases': 'unknown' })).join()).toMatch(/either the kind or the whole joint movement/);
    expect(problems(ex('curl', ['equipment', 'hand'], { load: 'implement', imp1: 'db', hold1: 'usual', 'grip.hand': 'turn', 'grip.start': 'su', 'grip.end': 'su' })).join()).toMatch(/not a turn/);
  });
});

// ───────────────────────────── properties ─────────────────────────────

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** A random answer of the right shape from the given options: often "usual", otherwise any option (or a few, for multi-select). */
function randomAnswer(q: FlowQuestion, options: FlowQuestion['options'], rnd: () => number): Answer {
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
  const usual = options.find((o) => o.id === 'usual');
  if (q.select === 'one') return usual !== undefined && rnd() < 0.45 ? 'usual' : pick(options).id;
  if (usual !== undefined && rnd() < 0.45) return ['usual'];
  const excl = options.filter((o) => o.exclusive);
  const free = options.filter((o) => !o.exclusive);
  if (free.length === 0 || (excl.length > 0 && rnd() < 0.15)) return [pick(excl.length > 0 ? excl : free).id];
  const n = 1 + Math.floor(rnd() * Math.min(q.max ?? 3, free.length));
  return [...new Set(Array.from({ length: n }, () => pick(free).id))];
}

const shuffle = <T>(xs: T[], rnd: () => number): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
};

// Two walkers. The UI walker picks only options that apply (openOptions), as an owner's screen would show them.
// The blind walker picks any option of any question on the path, to test the error handling.
for (const mode of ['ui', 'blind'] as const) describe(`property (${mode} walker): every valid answer path yields a canonical string the parser accepts`, () => {
  const RUNS = 30000;
  const tally = { built: 0, rejected: 0, internal: 0, equipment: 0, scratch: 0, layers: new Set<string>() };
  const internal: string[] = [];
  const reasons: Record<string, number> = {};
  const built: { answers: Record<string, Answer>; fxi: string | null; fxe: string }[] = [];
  const rnd = rng(mode === 'ui' ? 20261119 : 1119);
  for (let i = 0; i < RUNS; i++) {
    const answers: Record<string, Answer> = {};
    try {
      // Bias the first answers so the walk reaches every part of the flow.
      const b = buildWith(`run-${i}`, (q, reading) => {
        const options = mode === 'ui' ? openOptions(q, reading) : q.options;
        let a: Answer;
        if (q.id === 'subject') a = rnd() < 0.15 ? 'equipment' : 'usual';
        else if (q.id === 'movement') a = rnd() < 0.3 ? 'other' : randomAnswer(q, options, rnd);
        else a = randomAnswer(q, options, rnd);
        answers[q.id] = a;
        return a;
      }, [], FLOW);
      tally.built++;
      if (b.fxi === null) tally.equipment++;
      if (answers['motion.phases'] !== undefined) tally.scratch++;
      for (const l of (b.fxi ?? '').split('/').slice(1)) tally.layers.add(l.split(':')[0]!);
      built.push({ answers, fxi: b.fxi, fxe: b.fxe });
    } catch (e) {
      if (e instanceof InternalError) { tally.internal++; internal.push(e.message); } else if (e instanceof AnswerError) {
        tally.rejected++;
        for (const p of e.problems) { const k = p.split(':')[0]!.replace(/\d/g, 'n'); reasons[k] = (reasons[k] ?? 0) + 1; }
      } else throw e;
    }
  }
  test(`no builder bugs in ${RUNS} random walks`, () => {
    if (internal.length > 0) console.log(internal.slice(0, 9).join("\n"));
    expect(internal.slice(0, 5)).toEqual([]);
    expect(tally.internal).toBe(0);
  });
  test('a large share of random walks build, across every part of the flow', () => {
    console.log(`${mode} walks: ${JSON.stringify({ ...tally, layers: [...tally.layers].sort().join('') })}\n  rejections by question: ${JSON.stringify(reasons)}`);
    expect(tally.built).toBeGreaterThan(RUNS * (mode === 'ui' ? 0.75 : 0.3));
    expect(tally.equipment).toBeGreaterThan(500);
    expect(tally.scratch).toBeGreaterThan(500);
    expect([...tally.layers].sort().join('')).toBe('afghklmoprsx');
  });
  test('every built string parses, is canonical and is idempotent', () => {
    for (const b of built) {
      if (b.fxi !== null) {
        const p = parseFxi(b.fxi);
        expect(p.issues).toEqual([]);
        expect(p.canonical).toBe(b.fxi);
        expect(compare(b.fxi, b.fxi).relation).not.toBe('invalid');
      }
      const e = parseFxe(b.fxe);
      expect(e.issues).toEqual([]);
      expect(e.canonical).toBe(b.fxe);
    }
  });
  test('the same answers always give the same strings, whatever the key order and the order of multi-select picks', () => {
    const r2 = rng(7);
    for (const b of built.slice(0, 5000)) {
      const keys = shuffle(Object.keys(b.answers), r2);
      const answers = Object.fromEntries(keys.map((k) => { const v = b.answers[k]!; return [k, typeof v === 'string' ? v : shuffle([...v], r2)]; }));
      const again = build({ id: 'again', answers }, FLOW);
      expect([again.fxi, again.fxe]).toEqual([b.fxi, b.fxe]);
    }
  });
});
