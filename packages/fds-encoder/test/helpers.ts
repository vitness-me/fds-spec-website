import { readFileSync } from 'node:fs';
import type { Answer, Answers } from '../src/builder/build';

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

/** The four key pages under website/docs/core-concepts/structural-keys. */
export const KEY_PAGES = ['exercise-key', 'equipment-key', 'muscle-key', 'muscle-category-key'];
export const keyPage = (name: string): string => readFileSync(new URL(`../../../website/docs/core-concepts/structural-keys/${name}.md`, import.meta.url), 'utf8');

/** A seeded pseudo-random generator in [0, 1). */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** A random answer of the right shape from the given options: often "usual", otherwise any option (or a few, for multi-select). */
export function randomAnswer(q: { select: string; max?: number }, options: readonly { id: string; exclusive?: boolean }[], rnd: () => number): Answer {
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
