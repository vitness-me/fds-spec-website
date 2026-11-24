import { describe, expect, test } from 'vitest';
import { build } from '../src/build.js';
import { createFlow } from '../src/flow.js';
import { NO_WORDS, readWordSet, WordSetError } from '../src/words.js';
import { ex, WORDS } from './support.js';

const word = (over: Record<string, unknown>) => ({ id: 'press', label: 'Press', group: 'Pushes', fxi: 'm:el.ext+sh.flex/o:standing', ...over });
const set = (words: unknown[], questions: Record<string, unknown> = {}) => ({ name: 'w', version: '1', words, questions });
const faults = (raw: unknown): string[] => {
  try { readWordSet(raw, 'w.json'); } catch (e) { if (e instanceof WordSetError) return [...e.problems]; throw e; }
  return [];
};

describe('a movement-word dataset', () => {
  test('the test dataset reads, and its words open in the flow', () => {
    expect(WORDS.words.length).toBeGreaterThan(20);
    const flow = createFlow(WORDS);
    expect(flow.byId.get('movement')!.options.map((o) => o.id)).toEqual([...WORDS.words.map((w) => w.id), 'other', 'unknown']);
    expect(flow.wordQuestionIds).toEqual(Object.keys(WORDS.questions));
  });

  test('with no dataset there are no words and no word questions', () => {
    const flow = createFlow(NO_WORDS);
    expect(flow.byId.get('movement')!.options.map((o) => o.id)).toEqual(['other', 'unknown']);
    expect(flow.questions.some((q) => q.id.startsWith('word.'))).toBe(false);
  });

  test('names itself, so an answers record can cite it', () => {
    expect(faults({ words: [], questions: {} })).toEqual(['needs a "name", which answers records cite.', 'needs a "version", which answers records cite.']);
    expect(faults([])).toEqual(['The dataset is a JSON object {name, version, words, questions}.']);
  });

  test('every word parses as FXI layers and names only real codes', () => {
    expect(faults(set([word({ fxi: 'm:el.ext/o:sitting' })])).join()).toMatch(/"sitting" is not an orientation/);
    expect(faults(set([word({ fxi: 'm:el.ext/q:1' })])).join()).toMatch(/"q" is not an FXI layer/);
    expect(faults(set([word({ fxi: 'm:el.ext/l:-' })])).join()).toMatch(/removes a layer/);
    expect(faults(set([word({ hold: { bench: 'hands', db: 'pocket' } })]))).toEqual([
      'word 1 (press): hold names "bench", which is not a load token.',
      'word 1 (press): hold.db "pocket" is not a hold point.',
    ]);
    expect(faults(set([word({ mac: { m: 'push.sideways', l: 'hand' } })])).join()).toMatch(/not a guided motion/);
    expect(faults(set([word({ erg: 'hoverboard' })])).join()).toMatch(/not a cardio machine type/);
  });

  test('ids are kebab-case, unique, and never an answer the flow already has', () => {
    expect(faults(set([word({ id: 'Press' }), word({ id: 'other' }), word({}), word({})]))).toEqual([
      'word 1 (Press): "id" is lowercase kebab-case.',
      'word 2 (other): "other" is an answer the flow already has.',
      'word 4 (press): the id is repeated.',
    ]);
  });

  test('a word asks only questions the dataset defines, and every option leaves the word valid', () => {
    const q = { 'word.grip': { text: 'Which grip?', help: '', labels: { wide: 'Wide', bad: 'Bad' } } };
    expect(faults(set([word({ asks: { 'word.other': { options: {} } } })], q)).join()).toMatch(/"word.other" is not in the dataset's questions/);
    expect(faults(set([word({ asks: { 'word.grip': { options: { wide: 'g:w-w', bad: 'g:w-x' } } } })], q)).join()).toMatch(/word.grip.bad.*"w-x" is not a grip/);
    expect(faults(set([word({ asks: { 'word.grip': { usual: 'narrow', options: { wide: 'g:w-w' } } } })], q)).join()).toMatch(/usual "narrow" is not one of its options/);
    expect(faults(set([word({})], { grip: { text: 'x', help: '', labels: {} } })).join()).toMatch(/"word." and a lowercase name/);
  });

  test('a word builds the strings its layers say', () => {
    const flow = createFlow(readWordSet(set([word({ hold: { '*': 'hands' } })])));
    expect(build({ id: 'p', answers: ex('press', ['equipment'], { load: 'implement', imp1: 'db', hold1: 'usual' }) }, flow).fxi)
      .toBe('FXI=1.0S/m:el.ext+sh.flex/o:standing/l:db@hands');
  });
});
