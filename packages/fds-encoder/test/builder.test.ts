import { describe, expect, test } from 'vitest';
import {
  ACCESSORIES, BODY_POINTS, DESIGN_ATTRS, DRIVES, EQUIPMENT_TOKENS, FOOTWORK, FORMS, GUIDE_ANGLES, HELD, JOINT_ACTIONS, LINES,
  MAC_CONSTRAINTS, MAC_DIRECTIONS, MAC_SINGLE_JOINT, ORIENTATIONS, RANGES,
} from '../src/alphabet';
import { AnswerError, InternalError, build, buildWith, openOptions } from '../src/builder/build';
import type { Answer, Answers } from '../src/builder/build';
import { QUESTIONS } from '../src/builder/flow';
import { compare } from '../src/compare';
import { parseFxe, parseFxi } from '../src/syntax';
import { equipment, exercise, KEY_PAGES, keyPage, phase, randomAnswer, rng } from './helpers';

const pages = KEY_PAGES.map(keyPage).join('\n');

const dumbbells = { load: 'implement', imp1: 'bell.dumb', hold1: 'hands' };
const pulldownMachine = { load: 'machine', 'mac.motion': 'pull', 'mac.direction': 'down', 'mac.contact': 'usual', 'mac.chest': 'usual' };
const noDetails = { 'eq.details': 'usual' };

// The worked examples of the key pages: answers, and the keys the page prints.
const EXAMPLES: [string, Answers, string | null, string | null][] = [
  ['Standing dumbbell curl', exercise({ el: ['flex'] }, 'standing', dumbbells), 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', 'FXE=1.0S/k:imp/f:bell.dumb'],
  ['Barbell back squat', exercise({ hip: ['ext'], kn: ['ext'] }, 'standing', { load: 'implement', imp1: 'bar.straight', hold1: 'back' }), 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back', 'FXE=1.0S/k:imp/f:bar.straight'],
  ['Lat pulldown', exercise({ sh: ['pull-side'], el: ['flex'] }, 'seated', pulldownMachine), 'FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands', 'FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down'],
  ['Close neutral-grip pulldown', exercise({ sh: ['pull-front'], el: ['flex'] }, 'seated', pulldownMachine, ['hand', 'width'], { 'grip.hand': 'ne', 'grip.width': 'narrow' }), 'FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mac@hands/g:ne+w-n', null],
  ['Plank', {
    subject: 'usual', changes: ['support'], 'motion.phases': '1', 'p1.kind': 'hold', 'p1.joints': ['sp'], 'p1.sp': ['flex'], 'p1.also': 'usual',
    orientation: 'prone', support: 'custom', 'sup1.surface': 'floor', 'sup1.points': ['feet', 'forearms'], 'sup.more': 'usual', load: 'bodyweight', symmetry: 'usual',
  }, 'FXI=1.0S/m:=sp.flex/o:prone/s:floor@feet,forearms/l:none', 'FXE=1.0S/k:none'],
  ['Walking lunge', exercise({ hip: ['ext'], kn: ['ext'] }, 'standing', dumbbells, ['footwork'], { footwork: 'travel.fwd', symmetry: 'a', 'symmetry.scope': 'usual' }), 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/f:travel.fwd/l:bell.dumb@hands/x:a', null],
  ['Kettlebell swing', exercise({ hip: ['ext'] }, 'standing', { load: 'implement', imp1: 'bell.kettle', hold1: 'hands' }, ['count'], { count1: '1' }), 'FXI=1.0S/m:hip.ext/o:standing/l:bell.kettle*1@hands', null],
  ['Rowing', {
    subject: 'usual', changes: ['usual'], 'motion.phases': '1', 'p1.kind': 'cyclic', 'p1.joints': ['el', 'hip', 'kn', 'sh'], 'p1.el': ['flex'], 'p1.hip': ['ext'], 'p1.kn': ['ext'],
    'p1.sh': ['row-close'], 'p1.also': 'usual', orientation: 'seated', load: 'cardio', 'erg.type': 'rower', symmetry: 'usual',
  }, 'FXI=1.0S/m:~el.flex+hip.ext+kn.ext+sh.ext/o:seated/l:erg.row@hands', 'FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row'],
  ['Strap stretch', {
    subject: 'usual', changes: ['accessory'], 'motion.phases': '1', 'p1.kind': 'static-stretch', 'p1.joints': ['ank', 'kn'], 'p1.ank': ['df'], 'p1.kn': ['ext'],
    'p1.also': 'usual', orientation: 'seated', load: 'bodyweight', symmetry: 'u', 'symmetry.scope': 'usual', accessory: ['strap.stretch'],
  }, 'FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:none/x:u/a:strap.stretch', 'FXE=1.0S/k:none'],
  ['Dumbbell', equipment({ 'eq.kind': 'imp', 'eq.form.imp': 'bell.dumb', ...noDetails }), null, 'FXE=1.0S/k:imp/f:bell.dumb'],
  ['Long loop band', equipment({ 'eq.kind': 'imp', 'eq.form.imp': 'band.loop', ...noDetails }), null, 'FXE=1.0S/k:imp/f:band.loop'],
  ['Cable column', equipment({ 'eq.kind': 'stn', 'eq.form.stn': 'cable', ...noDetails }), null, 'FXE=1.0S/k:stn/f:cable'],
  ['Lat pulldown machine', equipment({ 'eq.kind': 'mac', 'eq.mac.motion': 'pull', 'eq.mac.direction': 'down', 'eq.mac.contact': ['usual'], 'eq.mac.posture': 'usual', ...noDetails, 'eq.more': 'usual' }), null, 'FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down'],
  ['Lying leg curl machine', equipment({
    'eq.kind': 'mac', 'eq.mac.motion': 'kn.flex', 'eq.mac.contact': ['usual'], 'eq.mac.posture': 'prone', 'eq.details': 'yes', 'eq.drive': 'plate', 'eq.constraint': 'arc', 'eq.angle': 'usual', 'eq.attrs': ['usual'], 'eq.more': 'usual',
  }), null, 'FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc'],
  ['45° leg press', equipment({
    'eq.kind': 'mac', 'eq.mac.motion': 'push', 'eq.mac.direction': 'fwd', 'eq.mac.contact': ['feet'], 'eq.mac.posture': 'usual', 'eq.details': 'yes', 'eq.drive': 'plate', 'eq.constraint': 'line', 'eq.angle': 'incl', 'eq.attrs': ['usual'], 'eq.more': 'usual',
  }), null, 'FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl'],
  ['Rowing machine', equipment({ 'eq.kind': 'erg', 'eq.erg.type': 'rower', ...noDetails }), null, 'FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row'],
  ['Pec deck with rear-delt arms', equipment({
    'eq.kind': 'mac', 'eq.mac.motion': 'sh.hadd', 'eq.mac.contact': ['usual'], 'eq.mac.posture': 'usual', ...noDetails, 'eq.more': 'yes',
    'eq2.mac.motion': 'sh.habd', 'eq2.mac.contact': ['usual'], 'eq2.mac.posture': 'usual', 'eq2.details': 'usual',
  }), null, 'FXE=1.0S/k:mac/l:arms/s:seated/m:sh.hadd;k:mac/l:hands/s:seated.chest/m:sh.habd'],
];

describe('every worked example on the key pages round-trips through answers', () => {
  for (const [name, answers, fxi, fxe] of EXAMPLES) {
    test(name, () => {
      if (fxi !== null) expect(pages).toContain(`\`${fxi}\``);
      if (fxe !== null) expect(pages).toContain(`\`${fxe}\``);
      const b = build({ id: name, answers });
      if (fxi !== null) expect(b.fxi).toBe(fxi);
      if (fxe !== null) expect(b.fxe).toBe(fxe);
    });
  }
});

describe('flow data', () => {
  test('question and option ids are unique; usual and unknown are exclusive', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
      const u = q.options.find((o) => o.id === 'usual');
      if (u !== undefined) expect(u.exclusive).toBe(true);
      if (q.usual === null) expect(u, q.id).toBeUndefined();
    }
  });
  test('the questions without a published default are the ones that set a value', () => {
    const withoutUsual = QUESTIONS.filter((q) => q.usual === null).map((q) => q.id.replace(/^p\db?\./, 'p<n>.').replace(/^(sup)\d/, '$1<n>').replace(/^eq2\./, 'eq.'));
    expect([...new Set(withoutUsual)].sort()).toEqual([
      'eq.erg.type', 'eq.form.acc', 'eq.form.imp', 'eq.form.stn', 'eq.form.sup', 'eq.kind', 'eq.mac.direction', 'eq.mac.motion', 'erg.type',
      'grip.end', 'grip.start', 'hold1', 'hold2', 'imp1', 'imp2', 'load', 'mac.direction', 'mac.motion', 'motion.phases', 'orientation',
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
    expect(missing(Object.keys(EQUIPMENT_TOKENS).filter((t) => !['none', 'mac', 'erg'].includes(t) && EQUIPMENT_TOKENS[t]!.parent !== 'erg'))).toEqual([]);
    expect(missing(Object.keys(ACCESSORIES))).toEqual([]);
    expect(missing(Object.keys(FORMS))).toEqual([]);
    expect(missing(MAC_SINGLE_JOINT)).toEqual([]);
    expect(missing(Object.keys(MAC_DIRECTIONS))).toEqual([]);
    for (const g of [DRIVES, MAC_CONSTRAINTS, GUIDE_ANGLES, DESIGN_ATTRS]) expect(missing(Object.keys(g))).toEqual([]);
    for (const c of ['w-t', 'w-n', 'w-m', 'w-w', 'st-n', 'st-m', 'st-w', 'pr', 'su', 'ne', 'mx', 'b', 'u', 'a', 'rc', 'trunk', 'both', 'limbs', '^', '~', '=', '=0', '%', '&']) expect(values.has(c)).toBe(true);
  });
});

describe('errors are clear', () => {
  const problems = (answers: Answers): string[] => {
    try { build({ id: 'x', answers }); } catch (e) { if (e instanceof AnswerError) return [...e.problems]; throw e; }
    return [];
  };
  const squat = exercise({ hip: ['ext'], kn: ['ext'] }, 'standing', { load: 'bodyweight' });
  const pushUp = exercise({ sh: ['away-square'], el: ['ext'] }, 'prone', { load: 'bodyweight' });
  test('missing, unknown and off-path answers', () => {
    expect(problems({ subject: 'usual' })[0]).toMatch(/^changes: no answer/);
    expect(problems({ ...squat, 'grip.width': 'wide' })[0]).toMatch(/not asked/);
    expect(problems({ ...squat, nonsense: 'x' })[0]).toMatch(/not a question/);
    expect(problems({ ...squat, orientation: 'squatting' })[0]).toMatch(/is not an option/);
    expect(problems({ ...squat, changes: 'usual' })[0]).toMatch(/list of option ids/);
    expect(problems({ ...squat, changes: ['usual', 'width'] }).join()).toMatch(/cannot be combined/);
  });
  test('an option whose condition does not hold says why', () => {
    expect(problems({ ...exercise({ kn: ['flex'] }, 'prone', { load: 'machine', 'mac.motion': 'push', 'mac.direction': 'fwd', 'mac.contact': 'usual', 'mac.chest': 'usual' }) }).join()).toMatch(/^$/);
    expect(problems(exercise({ kn: ['flex'] }, 'prone', { load: 'machine', 'mac.motion': 'pull', 'mac.direction': 'unknown', 'mac.contact': 'usual', 'mac.chest': 'usual' })).join()).toMatch(/"usual" does not apply here: that guided motion has no default load interface/);
  });
  test('contradictions', () => {
    expect(problems(exercise({ kn: ['flex', 'ext'] }, 'standing', { load: 'bodyweight' })).join()).toMatch(/kn.flex and kn.ext cannot happen in one phase/);
    expect(problems({ ...exercise({ sh: ['away-square'] }, 'standing', { load: 'cable', hold1: 'hands' }, ['line']), line: ['hi', 'lo'] }).join()).toMatch(/pick one of higher, lower or from the side/);
    expect(problems({ ...pushUp, changes: ['stance'], stance: 'wide' }).join()).toMatch(/only for standing exercises/);
    expect(problems({ ...pushUp, changes: ['count'] }).join()).toMatch(/does not apply/);
    expect(problems({ ...squat, changes: ['held'], held: ['legs.l', 'kn.bent'] }).join()).toMatch(/cannot both be held/);
    expect(problems({ ...exercise({ el: ['flex'] }, 'standing', dumbbells, ['hand']), 'grip.hand': 'turn', 'grip.start': 'su', 'grip.end': 'su' }).join()).toMatch(/not a turn/);
    expect(problems({ ...exercise({ hip: ['ext'], kn: ['ext'] }, 'standing', { load: 'bodyweight' }), 'p1.short': ['ank'] }).join()).toMatch(/does not apply here|not one of the joints/);
  });
  test('a pull from overhead and a row picked together keep the child and drop the parent', () => {
    const b = build({ id: 'pull', answers: exercise({ sh: ['pull-front', 'row-close'], el: ['flex'] }, 'hanging', { load: 'bodyweight' }) });
    expect(b.fxi).toBe('FXI=1.0S/m:el.flex+sh.ext.oh/o:hanging/l:none');
  });
  test('two supports under different body points', () => {
    const b = build({ id: 'push-up', answers: {
      ...exercise({ sh: ['away-square'], el: ['ext'] }, 'prone', { load: 'bodyweight' }, ['support']),
      support: 'custom', 'sup1.surface': 'ball.stab', 'sup1.points': ['feet'], 'sup.more': 'yes', 'sup2.surface': 'floor', 'sup2.points': ['hands'],
    } });
    expect([b.fxi, b.fxe]).toEqual(['FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:ball.stab@feet+floor@hands/l:none', 'FXE=1.0S/k:sup/f:ball.stab']);
  });
  test('two phases', () => {
    const b = build({ id: 'thruster', answers: { ...exercise({ hip: ['ext'], kn: ['ext'] }, 'standing', { load: 'implement', imp1: 'bar.straight', hold1: 'shoulders' }), 'motion.phases': '2', ...phase(2, { sh: ['up-overhead'], el: ['ext'] }) } });
    expect(b.fxi).toBe('FXI=1.0S/m:hip.ext+kn.ext>el.ext+sh.flex/o:standing/l:bar.straight@shoulders');
  });
});

// ───────────────────────────── properties ─────────────────────────────


const shuffle = <T>(xs: T[], rnd: () => number): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
};

// Two walkers. The UI walker picks only options that apply (openOptions), as a screen would show them.
// The blind walker picks any option of any question on the path, to test the error handling.
for (const mode of ['ui', 'blind'] as const) describe(`property (${mode} walker): every valid answer path yields a canonical string the parser accepts`, () => {
  const RUNS = 20000;
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
        else a = randomAnswer(q, options, rnd);
        answers[q.id] = a;
        return a;
      });
      tally.built++;
      if (b.fxi === null) tally.equipment++;
      if (answers['motion.phases'] !== undefined && answers['motion.phases'] !== 'unknown') tally.scratch++;
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
    expect(tally.built).toBeGreaterThan(RUNS * (mode === 'ui' ? 0.45 : 0.3));
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
      const again = build({ id: 'again', answers });
      expect([again.fxi, again.fxe]).toEqual([b.fxi, b.fxe]);
    }
  });
});
