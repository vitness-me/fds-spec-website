// The question flow, as data. Closed questions describe an exercise or a piece of equipment; build.ts writes its keys.
// Every option carries the code it writes. `usual` picks the published default and `unknown` writes `?`.
import {
  ACCESSORIES, BODY_POINTS, COMPLIANCE, DESIGN_ATTRS, DRIVES, EQUIPMENT_TOKENS, FORMS, GUIDE_ANGLES, HELD, HOLD_ONLY,
  MAC_CONSTRAINTS, MAC_DIRECTIONS, ORIENTATIONS,
} from '../alphabet';
import type { FxeKind } from '../alphabet';
import { ERG_TYPES } from './cardio';

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
}

/** Facts the flow branches on. build.ts computes each one from the answers given so far. */
export const FACTS = {
  exercise: 'The subject is an exercise (the usual answer to "subject").',
  equipment: 'The subject is a piece of equipment on its own.',
  'load-holdable': 'The first load is a free implement, a cable, a Smith machine or a landmine.',
  'load-band': 'A band is one of the loads.',
  'load-machine': 'The load is a strength machine.',
  'load-cardio': 'The load is a cardio machine.',
  'contact-has-usual': 'The guided motion of the machine has a default load interface.',
  'eq-contact-has-usual': 'The guided motion of the equipment has a default load interface.',
  'eq2-contact-has-usual': 'The guided motion of the second setup has a default load interface.',
  'stance-recorded': 'The body position at the start is standing, standing bent over, either or unknown; or the feet push a machine\'s foot plate (leg press).',
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

const MAX_PHASES = 5;

export const PHASE_KINDS: readonly FlowOption[] = [
  opt('normal', 'A normal moving rep: the joints move through range against the load', ''),
  opt('ballistic', 'Ends in flight or release: the body leaves the ground or the implement leaves the hands (jump, hop, throw, slam, clap)', '^'),
  opt('cyclic', 'Continuous cycles with no rep boundary, counted by time or distance (running, rowing, circles)', '~'),
  opt('hold', 'Held still under effort for the whole set (plank, wall sit); the joints answer is what the muscles push toward', '='),
  opt('balance', 'A balance hold with no direction (single-leg stand)', '=0'),
  opt('static-stretch', 'A static stretch: joints taken to end range and held', '%'),
  opt('dynamic-stretch', 'A dynamic stretch: taken to end range and released, again and again (leg swings, pass-throughs)', '&'),
];

const JOINT_OPTIONS: Readonly<Record<string, { label: string; options: readonly FlowOption[] }>> = {
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
      opt('pull-front', 'Down from overhead in front of the face (chin-up; any pull-up or pulldown with an underhand, neutral or close grip; straight-arm pulldown, pullover, slam)', 'sh.ext.oh'),
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
  const phaseOn: Cond = { all: [EX, { q: 'motion.phases', atLeast: n }] };
  const partOn: Cond = part === 'a' ? phaseOn : { all: [phaseOn, { q: `p${n}.also`, is: 'yes' }] };
  const which = part === 'a' ? `phase ${n}` : `the second part of phase ${n}`;
  const moving: Cond = { all: [partOn, { not: { q: `${p}.kind`, is: ['balance', 'unknown'] } }] };
  const qs: FlowQuestion[] = [
    {
      id: `${p}.kind`, layer: 'FXI m (prefix)', select: 'one', when: partOn,
      text: `What kind of movement is ${which}?`,
      help: 'Pick how the joints move. "Explosive" or "fast" alone is a normal rep: ballistic needs flight or release. A slam is ballistic only when the implement leaves the hands: a battle rope slam is a normal rep.',
      usual: 'A normal moving rep.', options: [U('A normal moving rep (the default)'), ...PHASE_KINDS.slice(1), UNK()],
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
      options: [U('No (the default)'), ...JOINT_IDS.map((j) => onlyIf(opt(j, JOINT_OPTIONS[j]!.label), { q: `${p}.joints`, has: j }, `that joint does not move in ${which}`))],
    },
  ];
  if (part === 'a') {
    qs.push({
      id: `p${n}.also`, layer: 'FXI m (simultaneous parts "|")', select: 'one',
      when: { all: [phaseOn, { not: { q: `p${n}.kind`, is: 'unknown' } }] },
      text: `In phase ${n}, does another part of the body do something of a different kind at the same time, or move the opposite way?`,
      help: 'Example: the arms hold the sled handles still while the legs walk, or the trunk holds a plank while a leg lifts. Also answer yes when two limbs are taken in opposite directions at once (runner\'s stretch: the back hip into extension, the front hip into flexion). Two limbs doing the same thing are one part.',
      usual: 'No.', options: [U('No (the default)'), opt('yes', 'Yes')],
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
      usual: null,
      options: [...MAC_MOTIONS, UNK()],
    },
    {
      id: `${prefix}.direction`, layer: 'FXE m (mac direction)', select: 'one',
      when: { all: [on, { q: motionQ, is: ['push', 'pull', 'assist'] }] },
      text: 'Which way does the handle, pad or plate move, relative to your trunk, while you work?',
      help: 'Up is toward the head, down toward the feet, forward is away from the front of the trunk.',
      usual: null,
      options: [...fromGlossary(MAC_DIRECTIONS), UNK()],
    },
    {
      id: `${prefix}.contact`, layer: exerciseMode ? 'FXE l (mac) and the FXI hold point of mac' : 'FXE l (mac)', select: exerciseMode ? 'one' : 'many', ...(exerciseMode ? {} : { max: 2 }),
      when: on,
      text: 'Where does the moving part of the machine meet your body?',
      help: exerciseMode
        ? 'The part you push or pull: handles, a foot plate, a pad on the lower leg. On an assisted pull-up or dip machine, answer where the assist pad or platform meets you (knee or foot): that goes in the FXE. The FXI always writes an assisted machine as mac@assist.'
        : 'Pick two only when both move the load (an air bike moves with the hands and the feet).',
      usual: 'The default load interface for that guided motion.',
      options: [U('The default for this motion', { fact: prefix === 'mac' ? 'contact-has-usual' : prefix === 'eq.mac' ? 'eq-contact-has-usual' : 'eq2-contact-has-usual' }, 'that guided motion has no default load interface'), ...fromGlossary(BODY_POINTS), UNK()],
    },
    ...(exerciseMode
      ? [{
        id: `${prefix}.chest`, layer: 'FXI o and FXE s (chest pad)', select: 'one' as const, when: on,
        text: 'Does a pad support your chest while you work?',
        help: 'A chest pad on a row machine or a donkey calf raise. Yes makes a seated start "seated.chest" and a standing start "standing.chest"; the machine posture is the body position.',
        usual: 'As the body position says.',
        options: [U('As the body position says (the default)'), opt('yes', 'Yes'), opt('no', 'No')],
      }]
      : [{
        id: `${prefix}.posture`, layer: 'FXE s (mac)', select: 'one' as const, when: on,
        text: 'What position does the machine put the user in?',
        help: 'Every leg press is "supine.incline"; hack, pendulum and belt squats are "standing"; a dedicated row machine is "seated.chest".',
        usual: 'The default posture for that guided motion.',
        options: [U('The default for this motion'), ...fromGlossary(ORIENTATIONS), UNK()],
      }]),
  ];
}

function equipmentDetailQuestions(prefix: string, kind: Cond, kinds: (k: FxeKind[]) => Cond): FlowQuestion[] {
  const on: Cond = { all: [kind, { q: `${prefix}.details`, is: 'yes' }] };
  return [
    {
      id: `${prefix}.details`, layer: 'FXE extended layers', select: 'one', when: { all: [kind, kinds(['imp', 'sup', 'stn', 'mac', 'erg'])] },
      text: 'Do you want to record how it is built (drive, track, angle, design)?',
      help: 'These details go in the equipment\'s own key as extended layers. An exercise never depends on them.',
      usual: 'No build details.', options: [U('No (the default)'), opt('yes', 'Yes')],
    },
    {
      id: `${prefix}.drive`, layer: 'FXE r', select: 'one', when: { all: [on, kinds(['imp', 'stn', 'mac', 'erg'])] },
      text: 'What resists the movement?', help: 'Leave it as usual if you are not sure. A form that implies its drive (a dumbbell is free weight) never needs it.',
      usual: 'Not stated.', options: [U('Not stated (the default)'), ...fromGlossary(DRIVES)],
    },
    {
      id: `${prefix}.constraint`, layer: 'FXE c (mac, stn)', select: 'one', when: { all: [on, kinds(['stn', 'mac'])] },
      text: 'How is the moving part guided?', help: '"Lever" or "leverage" in a machine name means a lever on one pivot. "Sled" means a straight track.',
      usual: 'Not stated.', options: [U('Not stated (the default)'), ...fromGlossary(MAC_CONSTRAINTS)],
    },
    {
      id: `${prefix}.compliance`, layer: 'FXE c (imp, sup)', select: 'one', when: { all: [on, kinds(['imp', 'sup'])] },
      text: 'Does it move under the body?', help: 'A stability ball tilts, an ab wheel rolls. A form that implies it never needs it.',
      usual: 'Not stated.', options: [U('Not stated (the default)'), ...fromGlossary(COMPLIANCE)],
    },
    {
      id: `${prefix}.angle`, layer: 'FXE g', select: 'one', when: { all: [on, kinds(['mac'])] },
      text: 'At what angle is the track or lever set?', help: 'Only fixed geometry: a 45° leg press is inclined.',
      usual: 'Not stated.', options: [U('Not stated (the default)'), ...fromGlossary(GUIDE_ANGLES)],
    },
    {
      id: `${prefix}.attrs`, layer: 'FXE a', select: 'many', when: { all: [on, kinds(['stn', 'mac'])] },
      text: 'Which design features does it have?', help: 'Pick every one that applies.',
      usual: 'None stated.', options: [U('None stated (the default)'), ...fromGlossary(DESIGN_ATTRS)],
    },
  ];
}

// ───────────────────────────── the flow ─────────────────────────────

const LOAD_TOKENS = Object.entries(EQUIPMENT_TOKENS).filter(([t, v]) => v.load && !['none', 'mac', 'erg'].includes(t) && FORMS[t]?.k !== 'stn' && v.parent !== 'erg');
const SUPPORT_TOKENS = Object.entries(EQUIPMENT_TOKENS).filter(([t, v]) => t !== 'none' && v.parent !== 'erg');
const HOLD_POINTS: FlowOption[] = [...fromGlossary(BODY_POINTS), ...fromGlossary(HOLD_ONLY)];

const CHANGES: FlowOption[] = [
  U('Nothing: every other layer is at its default'),
  opt('end-posture', 'The rep ends in a different body position from its start (get-up)'),
  opt('moving-end', 'Which end of the body moves (trunk or both ends, as in a sit-up or V-up)'),
  opt('footwork', 'The footwork: stepping, split stance, travelling'),
  opt('support', 'What the body rests on, beyond the floor'),
  opt('count', 'How many implements'),
  opt('extra', 'A second implement'),
  opt('hand', 'Hand orientation: overhand, underhand, neutral, mixed, or a turn during the rep'),
  opt('width', 'Grip width'),
  opt('stance', 'Stance width'),
  opt('depth', 'Range: partial, deeper than usual, or from a deficit'),
  opt('start', 'Where each rep starts: the floor, the hang, pins or blocks'),
  opt('held', 'A held posture of limbs that do not work: hands behind the head, arms crossed, free leg forward'),
  opt('line', 'The line of pull: cable or band anchored high or low, from the side, or the load passing behind the head'),
  opt('accessory', 'An accessory that helps without loading: a strap, towel or rope pulling a limb, or a partner'),
];

export const QUESTIONS: readonly FlowQuestion[] = [
  {
    id: 'subject', layer: 'FXI or FXE', select: 'one',
    text: 'Are you describing an exercise, or a piece of equipment on its own?',
    help: 'An exercise gets an exercise key and the equipment key of its main equipment. Equipment on its own gets its equipment key.',
    usual: 'An exercise.', options: [U('An exercise (the usual case)'), opt('equipment', 'A piece of equipment on its own')],
  },
  // ── exercise ──
  {
    id: 'changes', layer: 'selects which layers differ from their defaults', select: 'many', when: EX,
    text: 'Which of these does the exercise state, beyond its motion, body position, load and sides?',
    help: 'Every layer not picked here is at its default: feet planted level, the floor the body position implies, the usual grip, medium width and stance, full range from the usual start, no held posture, the usual line of pull, no accessory. Pick every way your exercise, as you actually run it, differs, whether or not its name says so. Each pick opens one question.',
    usual: 'Nothing differs.', options: CHANGES,
  },
  {
    id: 'motion.phases', layer: 'FXI m (phases ">")', select: 'one', when: EX,
    text: 'How many separate movements does one rep have?',
    help: 'Ask one closed question for each pair of movements: does the second start before the first ends? Yes: one phase (a thruster: the press starts while you still rise). No: two phases (squat, stand, then press; a push-up then a shoulder-blade push). Never count the lowering or return.',
    usual: null,
    options: Array.from({ length: MAX_PHASES }, (_, i) => opt(String(i + 1), i === 0 ? 'One' : `${['', 'Two', 'Three', 'Four', 'Five'][i]}`)).concat([UNK()]),
  },
  ...Array.from({ length: MAX_PHASES }, (_, i) => [...partQuestions(i + 1, 'a'), ...partQuestions(i + 1, 'b')]).flat(),
  {
    id: 'orientation', layer: 'FXI o', select: 'one', when: EX,
    text: 'What is the body position at the start of the rep?',
    help: 'Flat means within about 15° of horizontal; incline and decline 15–60°. Hinged forward and held there (bent-over row) is "standing, bent". On hands and knees, in a plank or a push-up is "prone". The trunk decides: kneeling with the trunk folded forward over the thighs (child\'s pose) is "prone"; "kneeling" has the trunk upright. On a machine, use your body position.',
    usual: null,
    options: [...fromGlossary(ORIENTATIONS), opt('either', 'Either way on purpose ("seated or standing")', '*'), UNK()],
  },
  {
    id: 'orientation.end', layer: 'FXI o (start>end)', select: 'one', when: { all: [EX, changed('end-posture')] },
    text: 'In what position does the rep end?',
    help: 'Only when the rep ends somewhere else, like a get-up. A rep that goes down and comes back (burpee) ends where it started.',
    usual: 'Where it started.', options: [U('Where it started (the default)'), ...fromGlossary(ORIENTATIONS), UNK()],
  },
  {
    id: 'end', layer: 'FXI k', select: 'one', when: { all: [EX, changed('moving-end')] },
    text: 'Which end of the body moves?',
    help: 'Usually the limbs move. In a sit-up, crunch, bridge or back extension the trunk moves and the legs stay put. In a V-up both ends move toward each other.',
    usual: 'The limbs.',
    options: [U('The limbs (the default)'), opt('limbs', 'The limbs move', 'limbs'), opt('trunk', 'The trunk moves; the legs stay put', 'trunk'), opt('both', 'Both ends move toward each other', 'both'), UNK()],
  },
  {
    id: 'footwork', layer: 'FXI f', select: 'one', when: { all: [EX, changed('footwork')] },
    text: 'What do the feet do?',
    help: 'A step returns each rep; travel keeps going. "In place" or on a cardio machine is planted.',
    usual: 'Feet planted level.',
    options: [
      U('Feet planted level (the default)'), opt('level', 'Planted level, side by side', 'level'), opt('split', 'Planted in a split stance, one foot in front', 'split'),
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
    usual: 'Only the floor, the way the body position implies.',
    options: [U('The default'), opt('none', 'Only the floor, the way the body position implies'), opt('custom', 'Something else: I will name it'), UNK()],
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
        options: [U('Only the points the position implies (the default)'), ...fromGlossary(BODY_POINTS), { id: 'unknown', label: 'A point I don\'t know', value: '?' }],
      },
    ];
    if (n === 1) qs.push({ id: 'sup.more', layer: 'FXI s (items)', select: 'one', when: on, text: 'Is there a second support?', help: 'Example: feet on a ball and hands on the floor.', usual: 'No.', options: [U('No (the default)'), opt('yes', 'Yes')] });
    return qs;
  }),
  {
    id: 'load', layer: 'FXI l, and the main equipment\'s FXE', select: 'one', when: EX,
    text: 'What loads the working muscles?',
    help: 'Not supports: a bench, box or bar you hang from goes under support. A weighted vest or belt is an implement. A lat pulldown and a seated cable row with its own seat are strength machines.',
    usual: null,
    options: [
      opt('bodyweight', 'Body weight only', 'none'), opt('implement', 'A free implement: barbell, dumbbell, kettlebell, band, ball, plate…'),
      opt('cable', 'A cable column or crossover', 'cable'), opt('smith', 'A Smith machine', 'smith'), opt('landmine', 'A landmine', 'landmine'),
      opt('machine', 'A strength machine built for one movement', 'mac'), opt('cardio', 'A cardio machine', 'erg'), UNK(),
    ],
  },
  {
    id: 'imp1', layer: 'FXI l (code) and the main equipment\'s FXE', select: 'one', when: { all: [EX, { q: 'load', is: 'implement' }] },
    text: 'Which implement?', help: 'The kind of object, not its weight. Any resistance band, tube, superband or miniband is "band".',
    usual: null, options: [...LOAD_TOKENS.map(([t, v]) => opt(t, v.gloss, t)), UNK('A free weight of a kind I don\'t know')],
  },
  {
    id: 'hold1', layer: 'FXI l (hold point)', select: 'one', when: { all: [EX, { fact: 'load-holdable' }] },
    text: 'Where is it held?',
    help: 'In the hands, at the sides, swung or by a handle is "hands", and so are dumbbells held at shoulder height and a bar pressed without resting on the shoulders. Resting on the front of the shoulders (front rack), or a landmine end held at the shoulder, is "shoulders". A bar behind the neck rests on the "back". Straight-armed overhead for the whole rep is "overhead". A load on the lap in a seated calf raise is "thighs". A band goes where it presses or pulls on the body; in leg-only work that is usually the feet or ankles. A band whose ends you hold at the shoulders (a band thruster) is "hands": "shoulders" is a load resting on them.',
    usual: null,
    options: [...HOLD_POINTS, UNK()],
  },
  {
    id: 'count1', layer: 'FXI l (count "*n")', select: 'one', when: { all: [EX, { fact: 'load-holdable' }, changed('count')] },
    text: 'How many of them, in total?',
    help: 'The usual count is one per working hand for a one-hand implement (two dumbbells in a two-arm curl, one in a one-arm curl) and one for a two-hand implement or anything held on the trunk. When the legs also work one side at a time (a lunge with a one-arm press), the usual count is two: answer 1 if you hold one dumbbell. If your total is the usual one, the answer changes nothing.',
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
    usual: null, options: [...HOLD_POINTS, UNK()],
  },
  {
    id: 'band.type', layer: 'FXE f (band child)', select: 'one', when: { all: [EX, { fact: 'load-band' }] },
    text: 'Which kind of band?',
    help: 'Name the kind only when you know it. The exercise key\'s load and the main equipment\'s key both name it.',
    usual: 'A band of a type not stated.',
    options: [U('Not stated (the default)'), opt('loop', 'Long loop band: superband, power band', 'band.loop'), opt('mini', 'Short loop band around the legs: miniband', 'band.mini'), opt('tube', 'Tube with handles', 'band.tube')],
  },
  ...machineQuestions('mac', { all: [EX, { fact: 'load-machine' }] }, true),
  {
    id: 'erg.type', layer: 'FXE k:erg layers, and the FXI hold point of erg', select: 'one',
    when: { all: [EX, { fact: 'load-cardio' }] },
    text: 'Which cardio machine?', help: 'Pick the type. If you only know it is a stationary bike or a stair machine, pick the "not known" entry.',
    usual: null,
    options: [...Object.entries(ERG_TYPES).map(([id, e]) => opt(id, e.label, id)), UNK('A cardio machine of a type I don\'t know')],
  },
  {
    id: 'symmetry', layer: 'FXI x', select: 'one', when: EX,
    text: 'How do the two sides work?',
    help: 'Doing every rep on one side and then switching is different from alternating sides rep by rep. Reciprocal means both sides move at once in opposite directions: walking, flutter kicks, alternating rope waves. A stretch or roll that works one limb and then the other is "one side, then the other". Legs that pedal are reciprocal even when the trunk turns to each side in turn (bicycle crunch); a trunk turn alone has no sides.',
    usual: 'Both sides together.',
    options: [
      U('Both sides together (the default)'), opt('b', 'Both sides together, or the movement has no sides', 'b'), opt('u', 'One side does every rep, then the other side', 'u'),
      opt('a', 'The sides take turns rep by rep', 'a'), opt('rc', 'Both sides move at once in opposite directions', 'rc'),
      opt('split', 'The arms and the legs follow different patterns (suitcase carry)'), UNK(),
    ],
  },
  {
    id: 'symmetry.scope', layer: 'FXI x (scope)', select: 'one', when: { all: [EX, { q: 'symmetry', is: ['u', 'a', 'rc'] }] },
    text: 'Does that pattern apply to the arms only, the legs only, or every working limb?',
    help: 'A single-arm kettlebell swing is the arms only: the legs still work together.',
    usual: 'Every working limb.', options: [U('Every working limb (the default)'), opt('arms', 'The arms only', 'arms'), opt('legs', 'The legs only', 'legs')],
  },
  ...(['arms', 'legs'] as const).map((limb): FlowQuestion => ({
    id: `symmetry.${limb}`, layer: 'FXI x (scoped item)', select: 'one', when: { all: [EX, { q: 'symmetry', is: 'split' }] },
    text: `How do the ${limb} work?`, help: 'A suitcase carry: the legs are reciprocal, the arms one side then the other.',
    usual: 'Both sides together.',
    options: [U('Both together (the default)'), opt('b', 'Both together', 'b'), opt('u', 'One side, then the other', 'u'), opt('a', 'Taking turns rep by rep', 'a'), opt('rc', 'At once, in opposite directions', 'rc')],
  })),
  {
    id: 'grip.hand', layer: 'FXI g (hand)', select: 'one', when: { all: [EX, changed('hand')] },
    text: 'Which way do the palms face?',
    help: 'Overhand is palms down or away; underhand palms up or toward you; neutral palms facing each other. A turn during the rep (Zottman, Arnold press) is "turns". A grip the implement forces still counts: parallel handles (farmer or rickshaw handles) or a rope attachment are "neutral". Only a trap bar\'s neutral grip is left out of the key.',
    usual: 'Underhand when every joint action is elbow flexion (a curl), overhand otherwise.',
    options: [
      U('The usual grip for this motion (the default)'), opt('pr', 'Overhand', 'pr'), opt('su', 'Underhand', 'su'), opt('ne', 'Neutral', 'ne'), opt('mx', 'Mixed: one over, one under', 'mx'),
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
    usual: 'About shoulder width.',
    options: [U('About shoulder width (the default)'), opt('touching', 'Touching or overlapping', 'w-t'), opt('narrow', 'Inside shoulder width', 'w-n'), opt('medium', 'About shoulder width', 'w-m'), opt('wide', 'Well outside shoulder width', 'w-w'), UNK()],
  },
  {
    id: 'stance', layer: 'FXI g (stance)', select: 'one', when: { all: [EX, changed('stance')] },
    text: 'How far apart are the feet?',
    help: 'Only for standing exercises, and for the feet on a machine\'s foot plate (leg press). A split stance is footwork, not stance.',
    usual: 'About hip width.',
    options: [U('About hip width (the default)'), ...[opt('narrow', 'Feet together or closer than hip width', 'st-n'), opt('medium', 'About hip width', 'st-m'), opt('wide', 'Wide (sumo)', 'st-w'), UNK()].map((o) => onlyIf(o, { fact: 'stance-recorded' }, 'stance is recorded only for standing exercises and foot-plate machines'))],
  },
  {
    id: 'range.depth', layer: 'FXI r (range)', select: 'one', when: { all: [EX, changed('depth')] },
    text: 'How much of the range does each rep use?',
    help: 'Box or step height, and small angle changes, are prescription and never count. A box you sit down to is a support.',
    usual: 'The full usual range.',
    options: [U('The full usual range (the default)'), opt('full', 'The full usual range', ''), opt('partial', 'Part of the range on purpose: half, quarter, pulses', 'partial'), opt('deep', 'Deeper than usual: full depth, ass to grass', 'deep'), opt('deficit', 'Deeper than usual by standing on something (deficit)', 'deficit'), UNK()],
  },
  {
    id: 'range.start', layer: 'FXI r (start)', select: 'one', when: { all: [EX, changed('start')] },
    text: 'Where does each rep start?',
    help: 'Only when it is not the movement\'s usual start. A deadlift usually starts from the floor; a Romanian deadlift and a row from the top; a bell clean or snatch from a swing (a dead clean starts from the floor).',
    usual: 'The movement\'s usual start.',
    options: [U('The usual start (the default)'), opt('from-floor', 'From the floor, load at rest each rep', 'from-floor'), opt('from-top', 'From a hang above the knee: standing with the load held, lowered without setting it down', 'from-top'), opt('from-top.knee', 'From a hang at or below the knee', 'from-top.knee'), opt('from-pins', 'From pins, blocks or a rack above the floor', 'from-pins'), opt('from-drop', 'From a drop: step off a box and land first (depth jump)', 'from-drop'), UNK()],
  },
  {
    id: 'held', layer: 'FXI h', select: 'many', when: { all: [EX, changed('held')] },
    text: 'What do the limbs that do not work hold?',
    help: 'Pick every held posture your exercise is done with, whether or not its name says so. A coaching cue ("keep your chest up") is not a held posture. Hands behind the head with nothing loaded there is "hands behind the head", not the line of pull.',
    usual: 'No held posture.',
    options: [U('No held posture (the default)'), ...Object.entries(HELD).map(([c, l]) => ({ ...opt(c, l, c), ...(c === 'none' ? { exclusive: true } : {}) })), UNK()],
  },
  {
    id: 'line', layer: 'FXI p', select: 'many', when: { all: [EX, changed('line')] },
    text: 'Where does the load pull from, compared with the usual line for the movement?',
    help: 'Usual anchors: low for curls, raises, upright rows, shrugs, kickbacks and hip work; high for pushdowns, pulldowns, face pulls, kneeling crunches and woodchops; middle for rows, flys, crossovers, rotations and chest presses; from the side for a Pallof press. Answer "high" or "low" only when yours differs; an anchor on the floor (a sled on the ground, a band under the feet) is low. A bar lowered to the neck or throat (JM press, guillotine press) and a rope that passes twice in each jump (double under) are lines too.',
    usual: 'The line the movement implies.',
    options: [U('The usual line (the default)'), opt('hi', 'Anchored higher than usual (high-to-low)', 'hi'), opt('lo', 'Anchored lower than usual (low-to-high)', 'lo'), opt('side', 'Pulls from one side: you stand side-on to the anchor', 'side'), opt('behind', 'The load or body passes behind the head or trunk (behind-the-neck press, rear pull-up)', 'behind'), opt('neck', 'The load comes down to the neck, throat or chin instead of the chest (JM press, guillotine press)', 'neck'), opt('double', 'A rope passes under the feet twice in each jump (double under)', 'double'), UNK()],
  },
  {
    id: 'accessory', layer: 'FXI a (extended)', select: 'many', when: { all: [EX, changed('accessory')] },
    text: 'What helps the exercise without loading it?',
    help: 'A strap, belt, towel or rope used to pull or hold a limb (a stretching strap), another accessory the name states, or a partner who holds, resists or assists. A handle or bar on a cable is part of the station, not an accessory.',
    usual: 'No accessory stated.',
    options: [U('Not stated (the default)'), ...Object.entries(ACCESSORIES).map(([c, l]) => ({ ...opt(c, l, c), ...(c === 'none' ? { exclusive: true } : {}) }))],
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
    help: 'Answer the machine questions once more for the second setup.', usual: 'No.', options: [U('No (the default)'), opt('yes', 'Yes')],
  },
  ...machineQuestions('eq2.mac', { all: [EQ, { q: 'eq.kind', is: 'mac' }, { q: 'eq.more', is: 'yes' }] }, false),
  ...equipmentDetailQuestions('eq2', { all: [EQ, { q: 'eq.kind', is: 'mac' }, { q: 'eq.more', is: 'yes' }] }, (ks) => ({ q: 'eq.kind', is: ks })),
];

/** The questions each "changes" option opens. A pick that opens none of them does not apply to these answers. */
export const CHANGE_OPENS: Readonly<Record<string, readonly string[]>> = {
  'end-posture': ['orientation.end'], 'moving-end': ['end'], footwork: ['footwork'], support: ['support'], count: ['count1'], extra: ['imp2'],
  hand: ['grip.hand'], width: ['grip.width'], stance: ['stance'], depth: ['range.depth'], start: ['range.start'], held: ['held'], line: ['line'],
  accessory: ['accessory'],
};

export const QUESTION_BY_ID: ReadonlyMap<string, FlowQuestion> = new Map(QUESTIONS.map((q) => [q.id, q]));

/** The whole flow as one JSON-ready object. */
export const FLOW = { notation: 'FXI=1.0 / FXE=1.0', facts: FACTS, questions: QUESTIONS } as const;
