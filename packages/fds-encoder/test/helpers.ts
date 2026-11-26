import type { Answers } from '../src/builder/build';

/** The answers of one motion phase: each joint and the option ids of its directions, a normal moving rep. */
export const phase = (n: number, joints: Record<string, string[]>, extra: Answers = {}): Answers => ({
  [`p${n}.kind`]: 'usual', [`p${n}.joints`]: Object.keys(joints), ...Object.fromEntries(Object.entries(joints).map(([j, d]) => [`p${n}.${j}`, d])),
  [`p${n}.short`]: ['usual'], [`p${n}.also`]: 'usual', ...extra,
});

/** An exercise of one phase: the joints, the start position and the load, both sides together unless `rest` says otherwise. */
export const exercise = (joints: Record<string, string[]>, orientation: string, load: Answers, changes: string[] = [], rest: Answers = {}): Answers => ({
  subject: 'usual', changes: changes.length === 0 ? ['usual'] : changes, 'motion.phases': '1', ...phase(1, joints), orientation, ...load, symmetry: 'usual', ...rest,
});

export const equipment = (rest: Answers): Answers => ({ subject: 'equipment', ...rest });

export const ROW_MACHINE: Answers = { load: 'machine', 'mac.motion': 'pull', 'mac.direction': 'back', 'mac.contact': 'usual' };
