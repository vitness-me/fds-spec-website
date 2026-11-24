import { readFileSync } from 'node:fs';
import { AnswerError, build } from '../src/build.js';
import type { Answers } from '../src/build.js';
import { createFlow } from '../src/flow.js';
import { readWordSet } from '../src/words.js';

/** The repository root, for tests that read the specification the package implements. */
export const REPO = new URL('../../../', import.meta.url).pathname;
export const fixture = (name: string): string => new URL(`./fixtures/${name}`, import.meta.url).pathname;

/** A small movement-word dataset written for these tests. */
export const WORDS = readWordSet(JSON.parse(readFileSync(fixture('words.json'), 'utf8')), 'test words');
export const FLOW = createFlow(WORDS);

export const ex = (movement: string, changes: string[] = [], rest: Answers = {}): Answers =>
  ({ subject: 'usual', movement, changes: changes.length === 0 ? ['usual'] : changes, ...rest });
export const eq = (rest: Answers): Answers => ({ subject: 'equipment', ...rest });
export const phase = (n: number, joints: Record<string, string[]>, extra: Answers = {}): Answers => ({
  [`p${n}.kind`]: 'usual', [`p${n}.joints`]: Object.keys(joints), ...Object.fromEntries(Object.entries(joints).map(([j, d]) => [`p${n}.${j}`, d])),
  [`p${n}.short`]: ['usual'], [`p${n}.also`]: 'usual', ...extra,
});
export const fxi = (answers: Answers): string | null => build({ id: 't', answers }, FLOW).fxi;
export const problems = (answers: Answers): string => {
  try { build({ id: 'x', answers }, FLOW); } catch (e) { if (e instanceof AnswerError) return e.problems.join(' | '); throw e; }
  return '';
};
