// The owner question flow, as data. An owner answers closed questions; build.ts writes the FXI and FXE.
// Every option carries the code it writes. `usual` picks the published default and `unknown` writes `?`.
// The movement words and their own questions come from a movement-word dataset; `createFlow` adds them.
import {
  ACCESSORIES, BODY_POINTS, COMPLIANCE, DESIGN_ATTRS, DRIVES, EQUIPMENT_TOKENS, ERG_TYPES, FORMS, FXI_RULES, GUIDE_ANGLES, HELD,
  HOLD_ONLY, LOAD_IFACES, MAC_CONSTRAINTS, MAC_DIRECTIONS, ORIENTATIONS, POSTURES,
} from './alphabet.js';
import type { FxeKind } from './alphabet.js';
import { NO_WORDS } from './words.js';
import type { MovementWord, WordSet } from './words.js';

export interface FlowOption {
  readonly id: string;
  readonly label: string;
  /** The code the option writes, when it writes one directly. */
  readonly value?: string;
  /** Options marked exclusive cannot be combined with any other option of a multi-select question. */
  readonly exclusive?: boolean;
  readonly group?: string;
  /** The option applies only when this holds. A UI hides it otherwise; the builder rejects it with `whenNot`. */
  readonly when?: Cond;
  readonly whenNot?: string;
}

/** Branching conditions. A question is asked only when its condition holds. */
export type Cond =
  | { readonly q: string; readonly is: string | readonly string[] }
  | { readonly q: string; readonly has: string }
  | { readonly q: string; readonly atLeast: number }
  | { readonly fact: FactId }
  | { readonly not: Cond }
  | { readonly all: readonly Cond[] }
  | { readonly any: readonly Cond[] };

export interface FlowQuestion {
  readonly id: string;
  /** The FXI or FXE layer the answer fills, in the notation's own terms. */
  readonly layer: string;
  readonly text: string;
  readonly help: string;
  readonly select: 'one' | 'many';
  /** The most options a multi-select answer may hold. */
  readonly max?: number;
  readonly options: readonly FlowOption[];
  /** What `usual` picks, in plain English; null when the question has no published default. */
  readonly usual: string | null;
  readonly when?: Cond;
  /** How to answer in import mode (reading only a catalogue's name and fields), where it differs from owner mode. */
  readonly importHelp?: string;
}

/** Facts the flow branches on. build.ts computes each one from the answers given so far. */
export const FACTS = {
  exercise: 'The subject is an exercise (the usual answer to "subject").',
  equipment: 'The subject is a piece of equipment on its own.',
  template: 'The movement is one of the published movement words.',
  'motion-from-scratch': 'The movement is "other", or the owner said the joint movement differs from the movement word.',
  'posture-has-usual': 'The movement word fixes a posture.',
  'load-has-usual': 'The movement word fixes the load (body weight, a cable, a machine, a named implement).',
  'load-holdable': 'The first load is a free implement, a cable, a Smith machine or a landmine.',
  'hold-has-usual': 'The rules give a usual hold point for that implement in this movement.',
  'load-band': 'A band is one of the loads.',
  'load-machine': 'The load is a strength machine.',
  'load-cardio': 'The load is a cardio machine.',
  'machine-has-usual': 'The movement word fixes which machine is used.',
  'cardio-has-usual': 'The movement word fixes which cardio machine is used.',
  'hold2-has-usual': 'The rules give a usual hold point for the second implement in this movement.',
  'machine-direction-has-usual': 'The movement word names a multi-joint machine, so its direction is known.',
  'contact-has-usual': 'The movement word names the machine, or the rules give a default contact for the guided motion.',
  'eq-contact-has-usual': 'The rules give a default contact for the guided motion of the equipment.',
  'eq2-contact-has-usual': 'The rules give a default contact for the guided motion of the second setup.',
  'single-phase-template': 'The movement word has one phase with joint actions, so its kind can change on its own.',
  'stance-recorded': 'The body position at the start is standing, standing bent over, either or unknown; or the feet push a machine\'s foot plate (leg press).',
  'word-asks': 'The chosen movement word carries closed questions of its own in the movement-word dataset.',
} as const;
export type FactId = keyof typeof FACTS;

const U = (label: string, when?: Cond, whenNot?: string): FlowOption =>
  ({ id: 'usual', label, exclusive: true, ...(when === undefined ? {} : { when, whenNot: whenNot ?? 'there is no usual answer here' }) });
const onlyIf = (o: FlowOption, when: Cond, whenNot: string): FlowOption => ({ ...o, when, whenNot });
const UNK = (label = "I don't know"): FlowOption => ({ id: 'unknown', label, value: '?', exclusive: true });
const opt = (id: string, label: string, value?: string, group?: string): FlowOption =>
  ({ id, label, ...(value === undefined ? {} : { value }), ...(group === undefined ? {} : { group }) });
const fromGlossary = (g: Readonly<Record<string, string>>, skip: string[] = []): FlowOption[] =>
  Object.entries(g).filter(([c]) => !skip.includes(c)).map(([c, label]) => opt(c, label, c));
const changed = (id: string): Cond => ({ q: 'changes', has: id });
const EX: Cond = { fact: 'exercise' };
const EQ: Cond = { fact: 'equipment' };

// ───────────────────────────── motion from scratch ─────────────────────────────

export const MAX_PHASES = 5;

export const PHASE_KINDS: readonly FlowOption[] = [
  opt('normal', 'A normal moving rep: the joints move through range against the load', ''),
  opt('ballistic', 'Ends in flight or release: the body leaves the ground or the implement leaves the hands (jump, hop, throw, slam, clap)', '^'),
  opt('cyclic', 'Continuous cycles with no rep boundary, counted by time or distance (running, rowing, circles)', '~'),
  opt('hold', 'Held still under effort for the whole set (plank, wall sit); the joints answer is what the muscles push toward', '='),
  opt('balance', 'A balance hold with no direction (single-leg stand)', '=0'),
  opt('static-stretch', 'A static stretch: joints taken to end range and held', '%'),
  opt('dynamic-stretch', 'A dynamic stretch: taken to end range and released, again and again (leg swings, pass-throughs)', '&'),
];

export const JOINT_OPTIONS: Readonly<Record<string, { label: string; options: readonly FlowOption[] }>> = {
  nk: { label: 'Neck', options: [opt('flex', 'Chin toward the chest', 'nk.flex'), opt('ext', 'Head tips back', 'nk.ext'), opt('lflex', 'Ear toward the shoulder', 'nk.lflex'), opt('rot', 'Head turns', 'nk.rot'), opt('circ', 'Circles', 'nk.circ')] },
  sp: { label: 'Trunk (spine)', options: [opt('flex', 'Curls forward, ribs toward the pelvis (crunch)', 'sp.flex'), opt('ext', 'Straightens or arches back (back extension)', 'sp.ext'), opt('lflex', 'Bends sideways (side bend)', 'sp.lflex'), opt('rot', 'Twists, shoulders against the hips (woodchop)', 'sp.rot'), opt('circ', 'Circles', 'sp.circ')] },
  sc: { label: 'Shoulder blades, moving on their own', options: [opt('elev', 'Shrug up', 'sc.elev'), opt('dep', 'Pulled down', 'sc.dep'), opt('pro', 'Spread apart around the ribs (scapular push-up)', 'sc.pro'), opt('ret', 'Squeezed together', 'sc.ret')] },
  sh: {
    label: 'Shoulder (judge by the path of the hands relative to the trunk)',
    options: [
      opt('away-square', 'Away from the chest, square to the trunk; or sweeping together in front at chest height (bench press, push-up, chest press, fly)', 'sh.hadd'),
      opt('away-headward', 'Away from the chest toward the head end (incline press, feet-up push-up, incline fly)', 'sh.flex+sh.hadd'),
      opt('up-overhead', 'Forward and up, or up past the head (front raise, overhead press, pike push-up)', 'sh.flex'),
      opt('away-footward', 'Away from the chest toward the feet end (decline press, hands-up push-up, high-to-low fly)', 'sh.ext+sh.hadd'),
      opt('down-along', 'Down along the trunk toward the feet (dip, straight-arm press-down)', 'sh.ext'),
      opt('row-close', 'Toward the trunk from in front, elbows close (row)', 'sh.ext'),
      opt('row-wide', 'Toward the trunk from in front, elbows wide at shoulder height (rear-delt row, face pull)', 'sh.habd'),
      opt('apart', 'Apart sideways at chest height, arms nearly straight (reverse fly, pull-apart)', 'sh.habd'),
      opt('pull-front', 'Down from overhead in front of the face (chin-up; any pull-up or pulldown with an underhand, neutral or close grip; straight-arm pulldown)', 'sh.ext'),
      opt('pull-side', 'Down from overhead out at the sides (pull-up or pulldown with an overhand grip at medium or wide width)', 'sh.add'),
      opt('up-side', 'Up out to the side (lateral raise, upright row)', 'sh.abd'),
      opt('rot-in', 'Rotates in: forearm turns toward the belly, elbow bent', 'sh.ir'),
      opt('rot-out', 'Rotates out: forearm turns away, elbow bent', 'sh.er'),
      opt('circ', 'Circles', 'sh.circ'),
    ],
  },
  el: { label: 'Elbow', options: [opt('flex', 'Bends (curl)', 'el.flex'), opt('ext', 'Straightens (press, triceps extension)', 'el.ext')] },
  fa: { label: 'Forearm turning against resistance', options: [opt('pron', 'Palm turns down', 'fa.pron'), opt('sup', 'Palm turns up', 'fa.sup')] },
  wr: { label: 'Wrist', options: [opt('flex', 'Palm toward the forearm (wrist curl)', 'wr.flex'), opt('ext', 'Back of the hand toward the forearm', 'wr.ext'), opt('rdev', 'Thumb side toward the forearm', 'wr.rdev'), opt('udev', 'Little-finger side toward the forearm', 'wr.udev'), opt('circ', 'Circles', 'wr.circ')] },
  hip: { label: 'Hip', options: [opt('flex', 'Thigh toward the trunk, or trunk toward the thigh', 'hip.flex'), opt('ext', 'Thigh away from the trunk (standing up from a squat)', 'hip.ext'), opt('abd', 'Leg out to the side', 'hip.abd'), opt('add', 'Leg in toward the other leg', 'hip.add'), opt('ir', 'Knee turns in', 'hip.ir'), opt('er', 'Knee turns out', 'hip.er'), opt('circ', 'Circles', 'hip.circ')] },
  kn: { label: 'Knee', options: [opt('flex', 'Bends against resistance (leg curl)', 'kn.flex'), opt('ext', 'Straightens (standing up from a squat)', 'kn.ext')] },
  ank: { label: 'Ankle', options: [opt('pf', 'Rises onto the toes or pushes off', 'ank.pf'), opt('df', 'Toes pulled toward the shin', 'ank.df'), opt('inv', 'Sole turns in', 'ank.inv'), opt('ev', 'Sole turns out', 'ank.ev'), opt('circ', 'Circles', 'ank.circ')] },
};
export const JOINT_IDS = Object.keys(JOINT_OPTIONS);

const JOINT_HELP = 'Count a joint only when the working muscles move it through a clear range (about 30° or more) as part of what the exercise trains. '
  + 'Never count a joint held still on purpose: the knee in a Romanian deadlift or hip thrust, the elbow in a fly or lateral raise, '
  + 'the spine unless bending or twisting the trunk is the exercise, the ankle unless the exercise rises onto the toes or pushes off.';

function partQuestions(n: number, part: 'a' | 'b'): FlowQuestion[] {
  const p = part === 'a' ? `p${n}` : `p${n}b`;
  const phaseOn: Cond = { all: [{ fact: 'motion-from-scratch' }, { q: 'motion.phases', atLeast: n }] };
  const partOn: Cond = part === 'a' ? phaseOn : { all: [phaseOn, { q: `p${n}.also`, is: 'yes' }] };
  const which = part === 'a' ? `phase ${n}` : `the second part of phase ${n}`;
  const moving: Cond = { all: [partOn, { not: { q: `${p}.kind`, is: ['balance', 'unknown'] } }] };
  const qs: FlowQuestion[] = [
    {
      id: `${p}.kind`, layer: 'FXI m (prefix)', select: 'one', when: partOn,
      text: `What kind of movement is ${which}?`,
      help: 'Pick how the joints move. "Explosive" or "fast" alone is a normal rep: ballistic needs flight or release.',
      usual: 'A normal moving rep.', options: [U('A normal moving rep (the usual way)'), ...PHASE_KINDS.slice(1), UNK()],
    },
    {
      id: `${p}.joints`, layer: 'FXI m (joints)', select: 'many', when: moving,
      text: `Which joints move in ${which}?`, help: JOINT_HELP, usual: null,
      options: [...JOINT_IDS.map((j) => opt(j, JOINT_OPTIONS[j]!.label, undefined)), UNK("Some joints move, I don't know which")],
    },
    ...JOINT_IDS.map((j): FlowQuestion => ({
      id: `${p}.${j}`, layer: 'FXI m (joint actions)', select: 'many',
      when: { all: [moving, { q: `${p}.joints`, has: j }] },
      text: `${which[0]!.toUpperCase()}${which.slice(1)}: which way does the ${JOINT_OPTIONS[j]!.label.split(' (')[0]!.toLowerCase()} move?`,
      help: 'For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.',
      usual: null, options: [...JOINT_OPTIONS[j]!.options, UNK('It moves, direction not known')],
    })),
    {
      id: `${p}.short`, layer: 'FXI m (short drive "-")', select: 'many',
      when: { all: [partOn, { q: `${p}.kind`, is: 'usual' }] },
      text: `In ${which}, does any joint move through only a short range on purpose?`,
      help: 'Only the dip-and-drive of a push press or jerk, or the short stand-up after a power receive. Partial range for the whole exercise is a separate question.',
      usual: 'No: every joint moves through its full range.',
      options: [U('No (the usual way)'), ...JOINT_IDS.map((j) => onlyIf(opt(j, JOINT_OPTIONS[j]!.label), { q: `${p}.joints`, has: j }, `that joint does not move in ${which}`))],
    },
  ];
  if (part === 'a') {
    qs.push({
      id: `p${n}.also`, layer: 'FXI m (simultaneous parts "|")', select: 'one',
      when: { all: [phaseOn, { not: { q: `p${n}.kind`, is: 'unknown' } }] },
      text: `In phase ${n}, does another part of the body do something of a different kind at the same time, or move the opposite way?`,
      help: 'Example: the arms hold the sled handles still while the legs walk, or the trunk holds a plank while a leg lifts. Also answer yes when two limbs are taken in opposite directions at once (runner\'s stretch: the back hip into extension, the front hip into flexion). Two limbs doing the same thing are one part.',
      usual: 'No.', options: [U('No (the usual way)'), opt('yes', 'Yes')],
    });
  }
  return qs;
}

// ───────────────────────────── machines ─────────────────────────────

const MAC_MOTIONS: FlowOption[] = [
  opt('push', 'It pushes away: a multi-joint press or squat machine', undefined, 'Multi-joint'),
  opt('pull', 'It pulls toward you: a multi-joint row, pulldown or deadlift machine', undefined, 'Multi-joint'),
  opt('assist', 'It helps lift the body: an assisted pull-up or dip machine', undefined, 'Multi-joint'),
  ...[
    ['kn.flex', 'Knee bends (leg curl)'], ['kn.ext', 'Knee straightens (leg extension)'], ['el.flex', 'Elbow bends (curl machine)'],
    ['el.ext', 'Elbow straightens (triceps machine)'], ['sh.hadd', 'Arms sweep together in front (pec deck)'], ['sh.habd', 'Arms sweep apart (rear-delt machine)'],
    ['sh.abd', 'Arms raise out to the sides (lateral raise machine)'], ['sh.ext', 'Arms pull down from in front (pullover machine)'], ['sh.flex', 'Arms raise forward'],
    ['sh.add', 'Arms pull down from the sides'], ['sh.ir', 'Shoulder rotates in'], ['sh.er', 'Shoulder rotates out'], ['sc.elev', 'Shrug'],
    ['hip.flex', 'Hip bends (leg-raise or knee-raise machine)'], ['hip.ext', 'Hip extends (glute kickback, hip thrust, reverse hyper)'],
    ['hip.abd', 'Legs push apart (abductor)'], ['hip.add', 'Legs squeeze together (adductor)'], ['sp.flex', 'Trunk curls (ab crunch machine)'],
    ['sp.ext', 'Trunk extends (back extension machine)'], ['sp.rot', 'Trunk twists (rotary torso)'], ['sp.lflex', 'Trunk bends sideways'],
    ['ank.pf', 'Rise onto the toes (calf raise machine)'], ['ank.df', 'Toes pull up (tibialis machine)'], ['nk.flex', 'Neck flexes'],
    ['nk.ext', 'Neck extends'], ['nk.lflex', 'Neck bends sideways'], ['wr.flex', 'Wrist curls'], ['wr.ext', 'Wrist extends'],
  ].map(([v, l]) => opt(v!, l!, v!, 'Pivots at one joint')),
];

function machineQuestions(prefix: string, on: Cond, exerciseMode: boolean): FlowQuestion[] {
  const motionQ = `${prefix}.motion`;
  return [
    {
      id: motionQ, layer: 'FXE m (mac)', select: 'one', when: on,
      text: 'What does the machine guide?',
      help: 'Answer for the machine as it is built, not the exercise done on it. A calf raise done on a leg press uses a leg press: answer "pushes away". A pivot that lines up with one joint is a single-joint machine.',
      usual: exerciseMode ? 'The machine the movement word names.' : null,
      options: [...(exerciseMode ? [U('The machine built for this movement (the usual way)', { fact: 'machine-has-usual' }, 'the movement word names no machine')] : []), ...MAC_MOTIONS, UNK()],
    },
    {
      id: `${prefix}.direction`, layer: 'FXE m (mac direction)', select: 'one',
      when: { all: [on, { q: motionQ, is: ['push', 'pull', 'assist'] }] },
      text: 'Which way does the handle, pad or plate move, relative to your trunk, while you work?',
      help: 'Up is toward the head, down toward the feet, forward is away from the front of the trunk.',
      usual: exerciseMode ? 'The direction of the machine the movement word names.' : null,
      options: [...(exerciseMode ? [U('The usual direction for this movement', { fact: 'machine-direction-has-usual' }, 'the movement word gives no machine direction')] : []), ...fromGlossary(MAC_DIRECTIONS), UNK()],
    },
    {
      id: `${prefix}.contact`, layer: exerciseMode ? 'FXE l (mac) and the FXI hold point of mach' : 'FXE l (mac)', select: exerciseMode ? 'one' : 'many', ...(exerciseMode ? {} : { max: 2 }),
      when: on,
      text: 'Where does the moving part of the machine meet your body?',
      help: exerciseMode
        ? 'The part you push or pull: handles, a foot plate, a pad on the lower leg. On an assisted pull-up or dip machine, answer where the assist pad or platform meets you (knee or foot): that goes in the FXE. The FXI always writes an assisted machine as mach@assist.'
        : 'Pick two only when both move the load (an air bike moves with the hands and the feet).',
      usual: 'The FXE default for that guided motion (FXE machine defaults), or the machine the movement word names.',
      options: [U('The usual place for this motion', { fact: prefix === 'mac' ? 'contact-has-usual' : prefix === 'eq.mac' ? 'eq-contact-has-usual' : 'eq2-contact-has-usual' }, 'the rules give no usual contact for that guided motion'), ...fromGlossary(LOAD_IFACES), UNK()],
    },
    ...(exerciseMode
      ? [{
        id: `${prefix}.chest`, layer: 'FXE s (mac posture)', select: 'one' as const, when: on,
        text: 'Does a pad support your chest while you work?',
        help: 'A chest pad on a row machine or a donkey calf raise. The rest of the machine posture is read from your body position.',
        usual: 'No chest pad, unless the movement word names a machine that has one (row machine).',
        options: [U('The usual way for this movement'), opt('yes', 'Yes'), opt('no', 'No')],
      }]
      : [{
        id: `${prefix}.posture`, layer: 'FXE s (mac)', select: 'one' as const, when: on,
        text: 'What position does the machine put the user in?',
        help: 'Every leg press is "recline"; hack, pendulum and belt squats are "stand"; a dedicated row machine is "seat.chest".',
        usual: 'The FXE default for that guided motion (FXE machine defaults).',
        options: [U('The usual position for this motion'), ...fromGlossary(POSTURES), UNK()],
      }]),
  ];
}

function equipmentDetailQuestions(prefix: string, kind: Cond, kinds: (k: FxeKind[]) => Cond): FlowQuestion[] {
  const on: Cond = { all: [kind, { q: `${prefix}.details`, is: 'yes' }] };
  return [
    {
      id: `${prefix}.details`, layer: 'FXE extended layers', select: 'one', when: { all: [kind, kinds(['imp', 'sup', 'stn', 'mac', 'erg'])] },
      text: 'Do you want to record how it is built (drive, track, angle, design)?',
      help: 'These details go only in the equipment registry record. Exercise rows never carry them.',
      usual: 'No build details.', options: [U('No (the usual way)'), opt('yes', 'Yes')],
    },
    {
      id: `${prefix}.drive`, layer: 'FXE r', select: 'one', when: { all: [on, kinds(['imp', 'stn', 'mac', 'erg'])] },
      text: 'What resists the movement?', help: 'Leave it as usual if you are not sure. A form that implies its drive (a dumbbell is free weight) never needs it.',
      usual: 'Not stated.', options: [U('Not stated (the usual way)'), ...fromGlossary(DRIVES)],
    },
    {
      id: `${prefix}.constraint`, layer: 'FXE c (mac, stn)', select: 'one', when: { all: [on, kinds(['stn', 'mac'])] },
      text: 'How is the moving part guided?', help: '"Lever" or "leverage" in a machine name means a lever on one pivot. "Sled" means a straight track.',
      usual: 'Not stated.', options: [U('Not stated (the usual way)'), ...fromGlossary(MAC_CONSTRAINTS)],
    },
    {
      id: `${prefix}.compliance`, layer: 'FXE c (imp, sup)', select: 'one', when: { all: [on, kinds(['imp', 'sup'])] },
      text: 'Does it move under the body?', help: 'A stability ball tilts, an ab wheel rolls. A form that implies it never needs it.',
      usual: 'Not stated.', options: [U('Not stated (the usual way)'), ...fromGlossary(COMPLIANCE)],
    },
    {
      id: `${prefix}.angle`, layer: 'FXE g', select: 'one', when: { all: [on, kinds(['mac'])] },
      text: 'At what angle is the track or lever set?', help: 'Only fixed geometry: a 45° leg press is inclined.',
      usual: 'Not stated.', options: [U('Not stated (the usual way)'), ...fromGlossary(GUIDE_ANGLES)],
    },
    {
      id: `${prefix}.attrs`, layer: 'FXE a', select: 'many', when: { all: [on, kinds(['stn', 'mac'])] },
      text: 'Which design features does it have?', help: 'Pick every one that applies.',
      usual: 'None stated.', options: [U('None stated (the usual way)'), ...fromGlossary(DESIGN_ATTRS)],
    },
  ];
}

// ───────────────────────────── word questions ─────────────────────────────

/** One question per closed question inside a movement word. Each option applies only to the words that offer it. */
function wordQuestions(words: WordSet): FlowQuestion[] {
  return Object.entries(words.questions).map(([id, w]): FlowQuestion => {
    const askers = words.words.filter((t) => t.asks?.[id] !== undefined);
    const withUsual = askers.filter((t) => t.asks![id]!.usual !== undefined).map((t) => t.id);
    const offering = (o: string): string[] => askers.filter((t) => t.asks![id]!.options[o] !== undefined).map((t) => t.id);
    const notHere = 'the movement word does not offer this option';
    return {
      id, layer: 'FXI layers the movement word fixes', select: 'one', when: { all: [EX, { q: 'movement', is: askers.map((t) => t.id) }] },
      text: w.text, help: w.help,
      usual: withUsual.length > 0 ? 'The option the movement word means when nothing else is said.' : null,
      options: [
        ...(withUsual.length > 0 ? [U('The usual way for this movement word', { q: 'movement', is: withUsual }, 'this movement word has no usual answer here; pick one')] : []),
        ...Object.entries(w.labels).map(([o, label]) => (o === 'unknown'
          ? { ...UNK(label), when: { q: 'movement', is: offering(o) } as Cond, whenNot: notHere }
          : onlyIf(opt(o, label), { q: 'movement', is: offering(o) }, notHere))),
      ],
    };
  });
}

// ───────────────────────────── the flow ─────────────────────────────

const LOAD_TOKENS = Object.entries(EQUIPMENT_TOKENS).filter(([t, v]) => v.load && !['bw', 'mach', 'erg', 'cable', 'smith', 'landmine'].includes(t) && v.parent !== 'erg');
const SUPPORT_TOKENS = Object.entries(EQUIPMENT_TOKENS).filter(([t, v]) => t !== 'bw' && v.parent !== 'erg');
const HOLD_POINTS: FlowOption[] = [...fromGlossary(BODY_POINTS), ...fromGlossary(HOLD_ONLY)];

const CHANGES: FlowOption[] = [
  U('Nothing: it is done the usual way for this movement'),
  opt('motion', 'The joint movement itself (rebuild it joint by joint)'),
  opt('kind', 'The kind of motion: explosive with flight, continuous, a hold, a static or dynamic stretch'),
  opt('posture', 'The body position (standing, seated, lying, kneeling, hanging)'),
  opt('end-posture', 'The rep ends in a different body position from its start (get-up)'),
  opt('moving-end', 'Which end of the body moves (trunk or both ends, as in a sit-up or V-up)'),
  opt('footwork', 'The footwork: stepping, split stance, travelling'),
  opt('support', 'What the body rests on, beyond the floor'),
  opt('equipment', 'The equipment that loads the muscles'),
  opt('hold', 'Where the implement is held'),
  opt('count', 'How many implements'),
  opt('extra', 'A second implement'),
  opt('machine', 'Which machine (strength or cardio)'),
  opt('sides', 'How the sides work: one side then the other, alternating, reciprocal'),
  opt('hand', 'Hand orientation: overhand, underhand, neutral, mixed, or a turn during the rep'),
  opt('width', 'Grip width'),
  opt('stance', 'Stance width'),
  opt('depth', 'Range: partial, deeper than usual, or from a deficit'),
  opt('start', 'Where each rep starts: the floor, the hang, pins or blocks'),
  opt('held', 'A held posture of limbs that do not work: hands behind the head, arms crossed, free leg forward'),
  opt('line', 'The line of pull: cable or band anchored high or low, from the side, or the load passing behind the head'),
  opt('accessory', 'An accessory that helps without loading: a strap, towel or rope pulling a limb, or a partner'),
];

function questions(words: WordSet): FlowQuestion[] {
  return [
  {
    id: 'subject', layer: 'FXI or FXE', select: 'one',
    text: 'Are you describing an exercise, or a piece of equipment on its own?',
    help: 'An exercise gets an FXI and the FXE of its main equipment. Equipment on its own gets a registry FXE.',
    usual: 'An exercise.', options: [U('An exercise (the usual case)'), opt('equipment', 'A piece of equipment on its own')],
  },
  // ── exercise ──
  {
    id: 'movement', layer: 'FXI m, and the defaults of every other layer', select: 'one', when: EX,
    text: 'Which movement is it?',
    help: 'Pick the movement word that matches the exercise as you would name it with nothing added. Variations come next. Pick "other" only when no word fits. The movement words themselves are not part of the notation: the encoder loads them from a movement-word dataset.',
    usual: null,
    options: [...words.words.map((t) => opt(t.id, t.note === undefined ? t.label : `${t.label}. ${t.note}`, t.id, t.group)), opt('other', 'Something else: describe the joint movement step by step'), UNK('I do not know how it is done')],
  },
  ...wordQuestions(words),
  {
    id: 'changes', layer: 'selects which layers differ from their defaults', select: 'many', when: EX,
    text: 'What, if anything, is different from the usual way of doing this movement?',
    help: 'The usual way is what the movement word means with nothing added: "squat" is both feet, no held posture, full range. Pick every way your exercise, as you actually run it, differs, whether or not its name says so. Each pick opens one question. For "other" or "unknown" movements, body position, equipment and sides are asked anyway.',
    importHelp: 'Import mode: body differences (motion, position, footwork, support, equipment) may come from the description; sides, grip, stance, range, held posture and line of pull come only from the name, the alternate name and the fields (the source rule).',
    usual: 'Nothing differs.', options: CHANGES,
  },
  {
    id: 'motion.kind', layer: 'FXI m (prefix)', select: 'one', when: { all: [EX, { fact: 'template' }, { not: { fact: 'motion-from-scratch' } }, changed('kind')] },
    text: 'What kind of motion is it?',
    help: 'Only for movement words with one phase. Changing the kind keeps the joints the movement word gives.',
    usual: 'The kind the movement word gives.',
    options: [U('As the movement word says (the usual way)'), ...PHASE_KINDS.filter((k) => k.id !== 'balance').map((k) => onlyIf(k, { fact: 'single-phase-template' }, 'the movement word has several phases or no joint actions to change; pick "the joint movement itself" in changes instead'))],
  },
  {
    id: 'motion.phases', layer: 'FXI m (phases ">")', select: 'one', when: { all: [EX, { fact: 'motion-from-scratch' }] },
    text: 'How many separate movements does one rep have?',
    help: 'Ask one closed question for each pair of movements: does the second start before the first ends? Yes: one phase (a thruster: the press starts while you still rise). No: two phases (squat, stand, then press; a push-up then a shoulder-blade push). Never count the lowering or return.',
    importHelp: 'Import mode, text silent: two movement words in one name are two phases in name order, unless the name is a one-phase word (thruster).',
    usual: null,
    options: Array.from({ length: MAX_PHASES }, (_, i) => opt(String(i + 1), i === 0 ? 'One' : `${['', 'Two', 'Three', 'Four', 'Five'][i]}`)).concat([UNK()]),
  },
  ...Array.from({ length: MAX_PHASES }, (_, i) => [...partQuestions(i + 1, 'a'), ...partQuestions(i + 1, 'b')]).flat(),
  {
    id: 'orientation', layer: 'FXI o', select: 'one',
    when: { all: [EX, { any: [{ not: { fact: 'posture-has-usual' } }, changed('posture')] }] },
    text: 'What is the body position at the start of the rep?',
    help: 'Flat means within about 15° of horizontal; incline and decline 15–60°. Hinged forward and held there (bent-over row) is "standing, bent". On hands and knees, in a plank or a push-up is "prone". On a machine, use your body position.',
    usual: 'The position the movement word fixes.',
    options: [U('The usual position for this movement', { fact: 'posture-has-usual' }, 'no movement word with a fixed position was chosen'), ...fromGlossary(ORIENTATIONS), opt('either', 'Either way on purpose ("seated or standing")', '*'), UNK()],
  },
  {
    id: 'orientation.end', layer: 'FXI o (start>end)', select: 'one', when: { all: [EX, changed('end-posture')] },
    text: 'In what position does the rep end?',
    help: 'Only when the rep ends somewhere else, like a get-up. A rep that goes down and comes back (burpee) ends where it started.',
    usual: 'Where it started.', options: [U('Where it started (the usual way)'), ...fromGlossary(ORIENTATIONS), UNK()],
  },
  {
    id: 'end', layer: 'FXI k', select: 'one', when: { all: [EX, changed('moving-end')] },
    text: 'Which end of the body moves?',
    help: 'Usually the limbs move. In a sit-up, crunch, bridge or back extension the trunk moves and the legs stay put. In a V-up both ends move toward each other.',
    usual: 'What the movement word says, else the limbs.',
    options: [U('The usual end for this movement'), opt('limbs', 'The limbs move', 'limbs'), opt('trunk', 'The trunk moves; the legs stay put', 'trunk'), opt('both', 'Both ends move toward each other', 'both'), UNK()],
  },
  {
    id: 'footwork', layer: 'FXI f', select: 'one', when: { all: [EX, changed('footwork')] },
    text: 'What do the feet do?',
    help: 'A step returns each rep; travel keeps going. "In place" or on a cardio machine is planted.',
    usual: 'What the movement word says, else feet planted level.',
    options: [
      U('The usual footwork for this movement'), opt('level', 'Planted level, side by side', 'level'), opt('split', 'Planted in a split stance, one foot in front', 'split'),
      opt('step.fwd', 'Each rep steps forward and returns', 'step.fwd'), opt('step.back', 'Each rep steps back and returns', 'step.back'),
      opt('step.side', 'Each rep steps to the side and returns', 'step.side'), opt('step.cross', 'Each rep steps back and across (curtsy) and returns', 'step.cross'),
      opt('travel.fwd', 'Travels forward', 'travel.fwd'), opt('travel.back', 'Travels backward', 'travel.back'), opt('travel.side', 'Travels sideways', 'travel.side'),
      opt('level>split', 'Starts level and lands in a split (split jerk)', 'level>split'), UNK(),
    ],
  },
  {
    id: 'support', layer: 'FXI s', select: 'one', when: { all: [EX, changed('support')] },
    text: 'What does the body rest on, hang from or brace against?',
    help: 'Only what bears weight or braces a limb, beyond the floor your position implies. Not a mat, not the seat you sit on, not a machine\'s own seat or pads, not a hand rail used only for balance.',
    usual: 'What the movement word says.',
    options: [U('The usual support for this movement'), opt('none', 'Only the floor, the way the body position implies'), opt('custom', 'Something else: I will name it'), UNK()],
  },
  ...[1, 2].flatMap((n): FlowQuestion[] => {
    const on: Cond = n === 1 ? { all: [EX, { q: 'support', is: 'custom' }] } : { all: [EX, { q: 'support', is: 'custom' }, { q: 'sup.more', is: 'yes' }] };
    const qs: FlowQuestion[] = [
      {
        id: `sup${n}.surface`, layer: 'FXI s (surface)', select: 'one', when: on,
        text: n === 1 ? 'What is the support?' : 'What is the second support?',
        help: 'Different surfaces under different body points are separate supports: feet on a ball, hands on the floor.',
        usual: null, options: [...SUPPORT_TOKENS.map(([t, v]) => opt(t, v.gloss, t)), UNK('Something not named')],
      },
      {
        id: `sup${n}.points`, layer: 'FXI s (points)', select: 'many', when: on,
        text: 'Which body points bear weight on it?',
        help: 'Leave out the points your body position already implies (standing implies the feet; lying face up, the back). When the trunk rests on nothing (plank, push-up), list every point.',
        usual: 'Only the points the body position implies.',
        options: [U('Only the points the position implies (the usual way)'), ...fromGlossary(BODY_POINTS), { id: 'unknown', label: 'A point I don\'t know', value: '?' }],
      },
    ];
    if (n === 1) qs.push({ id: 'sup.more', layer: 'FXI s (items)', select: 'one', when: on, text: 'Is there a second support?', help: 'Example: feet on a ball and hands on the floor.', usual: 'No.', options: [U('No (the usual way)'), opt('yes', 'Yes')] });
    return qs;
  }),
  {
    id: 'load', layer: 'FXI l, and the row FXE', select: 'one',
    when: { all: [EX, { any: [{ not: { fact: 'load-has-usual' } }, changed('equipment')] }] },
    text: 'What loads the working muscles?',
    help: 'Not supports: a bench, box or bar you hang from goes under support. A weighted vest or belt is an implement. A lat pulldown and a seated cable row with its own seat are strength machines.',
    usual: 'The load the movement word names.',
    options: [
      U('The usual load for this movement', { fact: 'load-has-usual' }, 'the movement word fixes no load'), opt('bodyweight', 'Body weight only', 'bw'), opt('implement', 'A free implement: barbell, dumbbell, kettlebell, band, ball, plate…'),
      opt('cable', 'A cable column or crossover', 'cable'), opt('smith', 'A Smith machine', 'smith'), opt('landmine', 'A landmine', 'landmine'),
      opt('machine', 'A strength machine built for one movement', 'mach'), opt('cardio', 'A cardio machine', 'erg'), UNK(),
    ],
  },
  {
    id: 'imp1', layer: 'FXI l (token) and the row FXE', select: 'one', when: { all: [EX, { q: 'load', is: 'implement' }] },
    text: 'Which implement?', help: 'The kind of object, not its weight. Any resistance band, tube, superband or miniband is "band".',
    usual: null, options: [...LOAD_TOKENS.map(([t, v]) => opt(t, v.gloss, t)), UNK('A free weight of a kind I don\'t know')],
  },
  {
    id: 'hold1', layer: 'FXI l (hold point)', select: 'one',
    when: { all: [EX, { fact: 'load-holdable' }, { any: [{ not: { fact: 'hold-has-usual' } }, changed('hold'), { q: 'load', is: ['implement', 'cable', 'smith', 'landmine'] }] }] },
    text: 'Where is it held?',
    help: 'In the hands, at the sides, swung or by a handle is "hands", and so are dumbbells held at shoulder height and a bar pressed without resting on the shoulders. Resting on the front of the shoulders (front rack), or a landmine end held at the shoulder, is "shoulders". A bar behind the neck rests on the "back". Straight-armed overhead for the whole rep is "overhead". A load on the lap in a seated calf raise is "thighs". A band goes where it presses or pulls on the body; in leg-only work that is usually the feet or ankles.',
    usual: 'The hold the movement word gives for this implement, else the hands for an implement held in the hands.',
    options: [U('The usual place for this movement', { fact: 'hold-has-usual' }, 'the rules give no usual hold for this implement here'), ...HOLD_POINTS, UNK()],
  },
  {
    id: 'count1', layer: 'FXI l (count "*n")', select: 'one', when: { all: [EX, { fact: 'load-holdable' }, changed('count')] },
    text: 'How many of them, in total?',
    help: 'The usual count is one per working hand for a one-hand implement (two dumbbells in a two-arm curl, one in a one-arm curl) and one for a two-hand implement or anything held on the trunk. If your total is the usual one, the answer changes nothing.',
    usual: 'The usual count.', options: [U('The usual count'), ...[1, 2, 3, 4].map((n) => opt(String(n), String(n), String(n)))],
  },
  {
    id: 'imp2', layer: 'FXI l (second item)', select: 'one', when: { all: [EX, changed('extra')] },
    text: 'What is the second implement?', help: 'Example: a weight vest on top of dumbbells, or a plate on a dip belt with body weight.',
    usual: null, options: [...LOAD_TOKENS.map(([t, v]) => opt(t, v.gloss, t)), opt('cable', 'Cable', 'cable'), UNK('A free weight of a kind I don\'t know')],
  },
  {
    id: 'hold2', layer: 'FXI l (hold point)', select: 'one', when: { all: [EX, changed('extra')] },
    text: 'Where is the second implement held?', help: 'Same rules as the first implement.',
    usual: 'The usual place for that implement in this movement.', options: [U('The usual place for this movement', { fact: 'hold2-has-usual' }, 'the rules give no usual hold for this implement here'), ...HOLD_POINTS, UNK()],
  },
  {
    id: 'band.type', layer: 'FXE f (band child)', select: 'one', when: { all: [EX, { fact: 'load-band' }] },
    text: 'Which kind of band?',
    help: 'Name the kind only when you know it. The FXI is the same for every band; only the row\'s FXE changes.',
    usual: 'A band of a type not stated.',
    options: [U('Not stated (the usual way)'), opt('loop', 'Long loop band: superband, power band', 'band.loop'), opt('mini', 'Short loop band around the legs: miniband', 'band.mini'), opt('tube', 'Tube with handles', 'band.tube')],
  },
  ...machineQuestions('mac', { all: [EX, { fact: 'load-machine' }, { any: [{ not: { fact: 'machine-has-usual' } }, changed('machine')] }] }, true),
  {
    id: 'erg.type', layer: 'FXE k:erg layers, and the FXI hold point of erg', select: 'one',
    when: { all: [EX, { fact: 'load-cardio' }, { any: [{ not: { fact: 'cardio-has-usual' } }, changed('machine')] }] },
    text: 'Which cardio machine?', help: 'Pick the type. If you only know it is a stationary bike or a stair machine, pick the "not known" entry.',
    usual: 'The machine the movement word names.',
    options: [U('The usual machine for this movement', { fact: 'cardio-has-usual' }, 'the movement word names no cardio machine'), ...Object.entries(ERG_TYPES).map(([id, e]) => opt(id, e.label, id)), UNK('A cardio machine of a type I don\'t know')],
  },
  {
    id: 'symmetry', layer: 'FXI x', select: 'one', when: { all: [EX, { any: [changed('sides'), { fact: 'motion-from-scratch' }] }] },
    text: 'How do the two sides work?',
    help: 'Doing every rep on one side and then switching is different from alternating sides rep by rep. Reciprocal means both sides move at once in opposite directions: walking, flutter kicks, alternating rope waves. A stretch or roll that works one limb and then the other is "one side, then the other".',
    importHelp: 'Import mode: from the name and fields only. "Alternating" means the sides take turns only when nothing else in the name alternates ("alternating front and lateral raise" alternates two raises).',
    usual: 'What the movement word says, else both sides together.',
    options: [
      U('The usual way for this movement'), opt('b', 'Both sides together, or the movement has no sides', 'b'), opt('u', 'One side does every rep, then the other side', 'u'),
      opt('a', 'The sides take turns rep by rep', 'a'), opt('rc', 'Both sides move at once in opposite directions', 'rc'),
      opt('split', 'The arms and the legs follow different patterns (suitcase carry)'), UNK(),
    ],
  },
  {
    id: 'symmetry.scope', layer: 'FXI x (scope)', select: 'one', when: { all: [EX, { q: 'symmetry', is: ['u', 'a', 'rc'] }] },
    text: 'Does that pattern apply to the arms only, the legs only, or every working limb?',
    help: 'A single-arm kettlebell swing is the arms only: the legs still work together.',
    usual: 'Every working limb.', options: [U('Every working limb (the usual way)'), opt('arms', 'The arms only', 'arms'), opt('legs', 'The legs only', 'legs')],
  },
  ...(['arms', 'legs'] as const).map((limb): FlowQuestion => ({
    id: `symmetry.${limb}`, layer: 'FXI x (scoped item)', select: 'one', when: { all: [EX, { q: 'symmetry', is: 'split' }] },
    text: `How do the ${limb} work?`, help: 'A suitcase carry: the legs are reciprocal, the arms one side then the other.',
    usual: 'Both sides together.',
    options: [U('Both together (the usual way)'), opt('b', 'Both together', 'b'), opt('u', 'One side, then the other', 'u'), opt('a', 'Taking turns rep by rep', 'a'), opt('rc', 'At once, in opposite directions', 'rc')],
  })),
  {
    id: 'grip.hand', layer: 'FXI g (hand)', select: 'one', when: { all: [EX, changed('hand')] },
    text: 'Which way do the palms face?',
    help: 'Overhand is palms down or away; underhand palms up or toward you; neutral palms facing each other. A turn during the rep (Zottman, Arnold press) is "turns".',
    usual: 'What the movement word says, else underhand for a curl and overhand for everything else.',
    importHelp: 'Import mode: "reverse grip" in a name means the grip opposite the movement word\'s usual one: overhand on a curl, underhand elsewhere.',
    options: [
      U('The usual way for this movement'), opt('pr', 'Overhand', 'pr'), opt('su', 'Underhand', 'su'), opt('ne', 'Neutral', 'ne'), opt('mx', 'Mixed: one over, one under', 'mx'),
      opt('turn', 'The palms turn during the rep'), UNK(),
    ],
  },
  ...(['start', 'end'] as const).map((w): FlowQuestion => ({
    id: `grip.${w}`, layer: 'FXI g (hand, by phase)', select: 'one', when: { all: [EX, changed('hand'), { q: 'grip.hand', is: 'turn' }] },
    text: w === 'start' ? 'Which way do the palms face at the start?' : 'Which way do they face at the end of the working movement?',
    help: 'A Zottman curl starts underhand and ends overhand.', usual: null,
    options: [opt('pr', 'Overhand', 'pr'), opt('su', 'Underhand', 'su'), opt('ne', 'Neutral', 'ne'), opt('mx', 'Mixed', 'mx')],
  })),
  {
    id: 'grip.width', layer: 'FXI g (width)', select: 'one', when: { all: [EX, changed('width')] },
    text: 'How far apart are the hands?',
    help: 'On an implement or on a support: a diamond push-up has the hands touching.',
    usual: 'What the movement word says, else about shoulder width.',
    options: [U('The usual width for this movement'), opt('touching', 'Touching or overlapping', 'w-t'), opt('narrow', 'Inside shoulder width', 'w-n'), opt('medium', 'About shoulder width', 'w-m'), opt('wide', 'Well outside shoulder width', 'w-w'), UNK()],
  },
  {
    id: 'stance', layer: 'FXI g (stance)', select: 'one', when: { all: [EX, changed('stance')] },
    text: 'How far apart are the feet?',
    help: 'Only for standing exercises, and for the feet on a machine\'s foot plate (leg press). A split stance is footwork, not stance.',
    usual: 'What the movement word says, else about hip width.',
    options: [U('The usual stance for this movement'), ...[opt('narrow', 'Feet together or closer than hip width', 'st-n'), opt('medium', 'About hip width', 'st-m'), opt('wide', 'Wide (sumo)', 'st-w'), UNK()].map((o) => onlyIf(o, { fact: 'stance-recorded' }, 'stance is recorded only for standing exercises and foot-plate machines'))],
  },
  {
    id: 'range.depth', layer: 'FXI r (range)', select: 'one', when: { all: [EX, changed('depth')] },
    text: 'How much of the range does each rep use?',
    help: 'Box or step height, and small angle changes, are prescription and never count. A box you sit down to is a support.',
    usual: 'What the movement word says, else the full usual range.',
    options: [U('The usual range for this movement'), opt('full', 'The full usual range', ''), opt('partial', 'Part of the range on purpose: half, quarter, pulses', 'partial'), opt('deep', 'Deeper than usual: full depth, ass to grass', 'deep'), opt('deficit', 'Deeper than usual by standing on something (deficit)', 'deficit'), UNK()],
  },
  {
    id: 'range.start', layer: 'FXI r (start)', select: 'one', when: { all: [EX, changed('start')] },
    text: 'Where does each rep start?',
    help: 'Only when it is not the movement\'s usual start. A deadlift usually starts from the floor; a Romanian deadlift and a row from the top; a bell clean or snatch from a swing (a dead clean starts from the floor).',
    usual: 'The movement\'s usual start.',
    options: [U('The usual start for this movement'), opt('from-floor', 'From the floor, load at rest each rep', 'from-floor'), opt('from-top', 'From a hang above the knee: standing with the load held, lowered without setting it down', 'from-top'), opt('from-top.knee', 'From a hang at or below the knee', 'from-top.knee'), opt('from-pins', 'From pins, blocks or a rack above the floor', 'from-pins'), opt('from-drop', 'From a drop: step off a box and land first (depth jump)', 'from-drop'), UNK()],
  },
  {
    id: 'held', layer: 'FXI h', select: 'many', when: { all: [EX, changed('held')] },
    text: 'What do the limbs that do not work hold?',
    help: 'Pick every held posture your exercise is done with, whether or not its name says so. A coaching cue ("keep your chest up") is not a held posture. Hands behind the head with nothing loaded there is "hands behind the head", not the line of pull.',
    importHelp: 'Import mode: only from the name, through the import lexicon: prisoner, pistol, arms crossed, "arms extended" or "straight arm" (arms forward), "bent arm" or 90 degree (elbows bent), "behind head" with nothing loaded behind the head.',
    usual: 'What the movement word says, else no held posture.',
    options: [U('The usual way for this movement'), ...Object.entries(HELD).map(([c, l]) => ({ ...opt(c, l, c), ...(c === 'none' ? { exclusive: true } : {}) })), UNK()],
  },
  {
    id: 'line', layer: 'FXI p', select: 'many', when: { all: [EX, changed('line')] },
    text: 'Where does the load pull from, compared with the usual way?',
    help: 'Usual anchors: low for curls, raises, upright rows, shrugs, kickbacks and hip work; high for pushdowns, pulldowns, face pulls, kneeling crunches and woodchops; middle for rows, flys, crossovers, rotations and chest presses; from the side for a Pallof press. Answer "high" or "low" only when yours differs. "Low row" or "low pulley" in a name is a machine, not a line.',
    importHelp: 'Import mode: only from the name, through the import lexicon.',
    usual: 'The line the movement word implies.',
    options: [U('The usual line for this movement'), opt('hi', 'Anchored higher than usual (high-to-low)', 'hi'), opt('lo', 'Anchored lower than usual (low-to-high)', 'lo'), opt('side', 'Pulls from one side: you stand side-on to the anchor', 'side'), opt('behind', 'The load or body passes behind the head or trunk (behind-the-neck press, rear pull-up)', 'behind'), UNK()],
  },
  {
    id: 'accessory', layer: 'FXI a (extended)', select: 'many', when: { all: [EX, changed('accessory')] },
    text: 'What helps the exercise without loading it?',
    help: 'A strap, belt, towel or rope used to pull or hold a limb (a stretching strap), or a partner who holds, resists or assists. A handle on a cable is not an accessory.',
    usual: 'What the movement word says, else no accessory.',
    options: [U('The usual way for this movement'), ...Object.entries(ACCESSORIES).map(([c, l]) => ({ ...opt(c, l, c), ...(c === 'none' ? { exclusive: true } : {}) }))],
  },
  // ── equipment on its own ──
  {
    id: 'eq.kind', layer: 'FXE k', select: 'one', when: EQ,
    text: 'What kind of equipment is it?',
    help: 'A machine built for one movement is a strength machine. A cable column, Smith machine or landmine serves many movements: a station.',
    usual: null,
    options: [opt('none', 'No equipment: body weight', 'none'), opt('imp', 'An object moved, held or worn', 'imp'), opt('sup', 'A surface or frame the body rests on, hangs from or pushes against', 'sup'), opt('acc', 'A handle, strap, belt, mat, towel or marker', 'acc'), opt('stn', 'A cable column, Smith machine or landmine', 'stn'), opt('mac', 'A strength machine built for one movement', 'mac'), opt('erg', 'A cardio machine', 'erg'), UNK()],
  },
  ...(['imp', 'sup', 'acc', 'stn'] as const).map((k): FlowQuestion => ({
    id: `eq.form.${k}`, layer: 'FXE f', select: 'one', when: { all: [EQ, { q: 'eq.kind', is: k }] },
    text: 'Which one is it?', help: 'Pick a child (superband, miniband) only when you know it. Otherwise pick the general entry.', usual: null,
    options: [...Object.entries(FORMS).filter(([, a]) => a.k === k).map(([f, a]) => opt(f, a.gloss, f)), UNK()],
  })),
  ...machineQuestions('eq.mac', { all: [EQ, { q: 'eq.kind', is: 'mac' }] }, false),
  {
    id: 'eq.erg.type', layer: 'FXE k:erg layers', select: 'one', when: { all: [EQ, { q: 'eq.kind', is: 'erg' }] },
    text: 'Which cardio machine?', help: 'If you only know it is a stationary bike or a stair machine, pick the "not known" entry.', usual: null,
    options: [...Object.entries(ERG_TYPES).map(([id, e]) => opt(id, e.label, id)), UNK('A cardio machine of a type I don\'t know')],
  },
  ...equipmentDetailQuestions('eq', EQ, (ks) => ({ q: 'eq.kind', is: ks })),
  {
    id: 'eq.more', layer: 'FXE combination (";")', select: 'one', when: { all: [EQ, { q: 'eq.kind', is: 'mac' }] },
    text: 'Can the machine be set up as a second machine (multi-hip, pec deck with rear-delt arms, pulldown with low row)?',
    help: 'Answer the machine questions once more for the second setup.', usual: 'No.', options: [U('No (the usual way)'), opt('yes', 'Yes')],
  },
  ...machineQuestions('eq2.mac', { all: [EQ, { q: 'eq.kind', is: 'mac' }, { q: 'eq.more', is: 'yes' }] }, false),
  ...equipmentDetailQuestions('eq2', { all: [EQ, { q: 'eq.kind', is: 'mac' }, { q: 'eq.more', is: 'yes' }] }, (ks) => ({ q: 'eq.kind', is: ks })),
  ];
}

/** The questions each "changes" option opens. A pick that opens none of them does not apply to these answers. */
export const CHANGE_OPENS: Readonly<Record<string, readonly string[]>> = {
  motion: ['motion.phases'], kind: ['motion.kind'], posture: ['orientation'], 'end-posture': ['orientation.end'], 'moving-end': ['end'],
  footwork: ['footwork'], support: ['support'], equipment: ['load'], hold: ['hold1'], count: ['count1'], extra: ['imp2'],
  machine: ['mac.motion', 'erg.type'], sides: ['symmetry'], hand: ['grip.hand'], width: ['grip.width'], stance: ['stance'],
  depth: ['range.depth'], start: ['range.start'], held: ['held'], line: ['line'], accessory: ['accessory'],
};

/** The question flow with one movement-word dataset's words and questions in it. */
export interface Flow {
  /** The rules revision the flow implements. */
  readonly rules: string;
  readonly words: WordSet;
  readonly questions: readonly FlowQuestion[];
  readonly byId: ReadonlyMap<string, FlowQuestion>;
  readonly wordById: ReadonlyMap<string, MovementWord>;
  /** Ids of the closed questions inside movement words. */
  readonly wordQuestionIds: readonly string[];
}

/** The flow for a movement-word dataset; without one, the movement is `other` or `unknown`. */
export function createFlow(words: WordSet = NO_WORDS): Flow {
  const qs = questions(words);
  return {
    rules: FXI_RULES,
    words,
    questions: qs,
    byId: new Map(qs.map((q) => [q.id, q])),
    wordById: new Map(words.words.map((w) => [w.id, w])),
    wordQuestionIds: Object.keys(words.questions),
  };
}

/** The flow with no movement-word dataset. */
export const DEFAULT_FLOW: Flow = createFlow();

/**
 * The flow in the shape FDS publishes it (`specification/descriptors/question-flow.json`): phase 1's questions stand
 * for every phase and are marked `repeatsPerPhase`, the movement word's own questions are not listed, and the
 * movement offers only `other` and `unknown`. Built from a flow with no dataset, it is the published flow.
 */
export function publishedQuestions(flow: Flow = DEFAULT_FLOW): unknown[] {
  const out: unknown[] = [];
  for (const q of flow.questions) {
    if (flow.wordQuestionIds.includes(q.id)) continue;
    const phase = /^p(\d+)b?\./.exec(q.id);
    if (phase !== null && phase[1] !== '1') continue;
    const copy = JSON.parse(JSON.stringify(q)) as Record<string, unknown> & { options: FlowOption[] };
    if (phase !== null) copy.repeatsPerPhase = true;
    if (q.id === 'movement') {
      copy.fromDataset = 'movement-words';
      copy.options = copy.options.filter((o) => o.id === 'other' || o.id === 'unknown');
    }
    out.push(copy);
  }
  return out;
}
