import { describe, expect, test } from 'vitest';
import { askRows, startAsk, stepAsk } from '../src/ask.js';
import type { AskRow, AskState } from '../src/ask.js';
import { build, rowMeta } from '../src/build.js';
import type { Entry } from '../src/build.js';
import { DEFAULT_FLOW } from '../src/flow.js';
import { FLOW } from './support.js';

const CITED = { words: { name: 'vitness-test-words', version: '1' } };

const SQUAT: AskRow = {
  id: 'vitness:back-squat', name: 'Barbell back squat',
  text: 'Bar across the upper back. Sit down between the heels and stand back up.', media: ['https://media.example/back-squat.mp4'],
};
const RAISE: AskRow = { id: 'vitness:one-arm-lateral-raise', name: 'One-arm dumbbell lateral raise', text: 'Raise one dumbbell out to the side, all reps, then switch.' };
const CURL: AskRow = { id: 'vitness:cable-curl', name: 'Cable curl' };
const ROWS = [SQUAT, RAISE, CURL];

/** The answers that encode the back squat, one line per question. */
const SQUAT_LINES = ['1', 'squat', 'usual', 'implement', 'bb', 'usual'];
const SQUAT_FXI = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back';

interface Run { state: AskState; text: string; saves: number; last: string }

function run(lines: string[], opts: { rows?: AskRow[]; existing?: readonly Entry[]; mode?: 'owner' | 'import' } = {}): Run {
  let s = startAsk(opts.rows ?? ROWS, opts.existing ?? [], opts.mode ?? 'owner', FLOW);
  const out = [...s.out];
  let saves = 0;
  let last = s.out.join('\n');
  for (const line of lines) {
    s = stepAsk(s.state, line);
    out.push(...s.out);
    last = s.out.join('\n');
    if (s.save) saves++;
  }
  return { state: s.state, text: out.join('\n'), saves, last };
}

describe('ask: walking a row', () => {
  test('starts at the first row and shows its name, text and media, then the first question', () => {
    const r = run([]);
    expect(r.text).toContain('Barbell back squat');
    expect(r.text).toContain('Sit down between the heels');
    expect(r.text).toContain('https://media.example/back-squat.mp4');
    expect(r.state.question).toBe('subject');
  });

  test('accepts an option by number or by id, and asks only the questions whose condition holds', () => {
    const r = run(SQUAT_LINES);
    expect(r.state.stage).toBe('review');
    expect(r.state.asked).toEqual(build({ id: SQUAT.id, answers: r.state.answers }, FLOW).path);
    expect(r.state.answers).toEqual({ subject: 'usual', movement: 'squat', changes: ['usual'], load: 'implement', imp1: 'bb', hold1: 'usual' });
  });

  test('accepts the code an option writes', () => {
    const r = run(['1', 'shoulder-press', 'width', 'implement', 'bb', 'usual', 'w-w']);
    expect(r.state.answers['grip.width']).toBe('wide');
  });

  test('accepts several options for a pick-many question, separated by spaces or commas', () => {
    const r = run(['1', 'curl', 'equipment, sides']);
    expect(r.state.answers.changes).toEqual(['equipment', 'sides']);
    expect(r.state.question).toBe('load');
  });

  test('prints the built FXI and FXE after the last question', () => {
    const r = run(SQUAT_LINES);
    expect(r.last).toContain(SQUAT_FXI);
    expect(r.last).toContain('FXE=1.0S/k:imp/f:bar.straight');
  });

  test('keeps the row on Enter, saves, and moves to the next row', () => {
    const r = run([...SQUAT_LINES, '']);
    expect(r.saves).toBe(1);
    expect(r.state.entries).toEqual([{ id: SQUAT.id, answers: { subject: 'usual', movement: 'squat', changes: ['usual'], load: 'implement', imp1: 'bb', hold1: 'usual' }, ...CITED }]);
    expect(r.state.row).toBe(1);
    expect(r.last).toContain('One-arm dumbbell lateral raise');
    expect(r.state.question).toBe('subject');
  });

  test('the saved entries are exactly what build reads', () => {
    const r = run([...SQUAT_LINES, '']);
    expect(build(r.state.entries[0]!, FLOW).fxi).toBe(SQUAT_FXI);
  });

  test('finishes after the last row', () => {
    const r = run([...SQUAT_LINES, ''], { rows: [SQUAT] });
    expect(r.state.stage).toBe('done');
    expect(r.last).toContain('All 1 rows are answered');
  });
});

describe('ask: commands', () => {
  test('? shows the help and the usual reading, and changes nothing', () => {
    const before = run(['1', 'squat']);
    const r = run(['1', 'squat', '?']);
    expect(r.last).toContain('Pick every way your exercise');
    expect(r.last).toContain('Usual: Nothing differs.');
    expect(r.state.answers).toEqual(before.state.answers);
    expect(r.state.question).toBe('changes');
  });

  test('? shows the import-mode reading in import mode', () => {
    expect(run(['1', 'squat', '?'], { mode: 'import' }).last).toContain('Import mode: body differences');
    expect(run(['1', 'squat', '?']).last).not.toContain('Import mode: body differences');
  });

  test('b goes back one question and forgets its answer', () => {
    const r = run(['1', 'squat', 'usual', 'b']);
    expect(r.state.question).toBe('changes');
    expect(r.state.answers).toEqual({ subject: 'usual', movement: 'squat' });
    expect(r.state.asked).toEqual(['subject', 'movement']);
  });

  test('b on the first question of a row stays put', () => {
    const r = run(['b']);
    expect(r.state.question).toBe('subject');
    expect(r.last).toContain('first question');
  });

  test('b after the last question reopens it', () => {
    const r = run([...SQUAT_LINES, 'b']);
    expect(r.state.stage).toBe('question');
    expect(r.state.question).toBe('hold1');
    expect(r.state.answers.hold1).toBeUndefined();
  });

  test('s skips the row without saving it', () => {
    const r = run(['1', 's']);
    expect(r.state.entries).toEqual([]);
    expect(r.state.row).toBe(1);
    expect(r.state.answers).toEqual({});
    expect(r.saves).toBe(0);
  });

  test('q saves the finished rows and stops; the row in progress is not kept', () => {
    const r = run([...SQUAT_LINES, '', '1', 'q']);
    expect(r.state.stage).toBe('quit');
    expect(r.state.entries.map((e) => e.id)).toEqual([SQUAT.id]);
    expect(r.saves).toBe(2);
  });

  test('r on the result redoes the row from its first question', () => {
    const r = run([...SQUAT_LINES, 'r']);
    expect(r.state.stage).toBe('question');
    expect(r.state.question).toBe('subject');
    expect(r.state.answers).toEqual({});
    expect(r.state.entries).toEqual([]);
  });

  test('g on the result records a gap note that the entry carries', () => {
    const r = run([...SQUAT_LINES, 'g', 'the bar sits low on the back', '']);
    const entry = r.state.entries[0]!;
    expect(entry.gap).toBe('the bar sits low on the back');
    expect(rowMeta(entry, 'owner').fxiGap).toBe('the bar sits low on the back');
  });

  test('an empty gap note clears it', () => {
    const r = run([...SQUAT_LINES, 'g', 'low bar', 'g', '', '']);
    expect(r.state.entries[0]!.gap).toBeUndefined();
  });

  test('Enter on a question shows it again', () => {
    const r = run(['1', '']);
    expect(r.state.question).toBe('movement');
    expect(r.last).toContain('Which movement is it?');
  });

  test('when an option id is also a command letter, the question says to pick it by number', () => {
    const r = run(['1', 'lateral-raise', 'sides', 'implement', 'db', 'usual']);
    expect(r.state.question).toBe('symmetry');
    expect(r.last).toMatch(/Type \d+ to pick "b"/);
  });
});

describe('ask: rejecting answers', () => {
  test('an unknown option is rejected and the question stays', () => {
    const r = run(['1', 'squat', 'zzz']);
    expect(r.state.question).toBe('changes');
    expect(r.last).toContain('"zzz" is not an option here');
  });

  test('text that is not an option lists the options whose words contain it', () => {
    const r = run(['1', 'pulldown']);
    expect(r.state.question).toBe('movement');
    expect(r.last).toContain('lat-pulldown');
  });

  test('a pick-one question takes exactly one option', () => {
    const r = run(['1 2']);
    expect(r.state.question).toBe('subject');
    expect(r.last).toContain('Pick one option');
  });

  test('an exclusive option cannot be combined', () => {
    const r = run(['1', 'squat', 'usual sides']);
    expect(r.state.question).toBe('changes');
    expect(r.last).toContain('"usual" cannot be combined');
  });

  test('an option that does not apply says why', () => {
    const r = run(['1', 'push-up', 'stance', 'wide']);
    expect(r.state.question).toBe('stance');
    expect(r.last).toContain('does not apply here');
  });

  test('a number outside the list is rejected', () => {
    const r = run(['99']);
    expect(r.state.question).toBe('subject');
    expect(r.last).toContain('"99" is not an option here');
  });

  test('answers the builder rejects are shown, and the row cannot be kept until fixed', () => {
    const r = run(['1', 'squat', 'machine', 'implement', 'bb', 'usual']);
    expect(r.state.stage).toBe('review');
    expect(r.last).toContain('does not apply');
    const kept = stepAsk(r.state, '');
    expect(kept.state.stage).toBe('review');
    expect(kept.state.entries).toEqual([]);
  });
});

describe('ask: resuming and modes', () => {
  test('starts at the first row that has no entry', () => {
    const done: Entry = { id: SQUAT.id, answers: { subject: 'usual', movement: 'squat', changes: ['usual'], load: 'implement', imp1: 'bb', hold1: 'usual' } };
    const r = run([], { existing: [done] });
    expect(r.state.row).toBe(1);
    expect(r.text).toContain('One-arm dumbbell lateral raise');
  });

  test('a skipped row comes back on the next start', () => {
    const first = run(['s']);
    expect(first.state.row).toBe(1);
    expect(run([], { existing: first.state.entries }).state.row).toBe(0);
  });

  test('after skipping, the walk passes over rows that are already finished', () => {
    const raiseDone: Entry = { id: RAISE.id, answers: {} };
    const r = run(['s'], { existing: [raiseDone] });
    expect(r.state.row).toBe(2);
    expect(r.last).toContain('Cable curl');
  });

  test('entries keep the order of the rows, and other entries stay in the file', () => {
    const other: Entry = { id: 'vitness:elsewhere', answers: { subject: 'usual' } };
    const raiseDone: Entry = { id: RAISE.id, answers: {} };
    const r = run([...SQUAT_LINES, ''], { existing: [other, raiseDone] });
    expect(r.state.entries.map((e) => e.id)).toEqual([SQUAT.id, RAISE.id, 'vitness:elsewhere']);
  });

  test('import mode writes the mode into each entry', () => {
    const r = run([...SQUAT_LINES, ''], { mode: 'import' });
    expect(r.state.entries[0]!.mode).toBe('import');
    expect(rowMeta(r.state.entries[0]!, 'owner').fxiProvenance).toBe('import');
  });
});

describe('ask: rows file', () => {
  test('reads rows with an id and a name; text and media are optional', () => {
    expect(askRows([{ id: 'a', name: 'A', media: 'https://media.example/a.jpg' }, { id: 'b', name: 'B', text: 'x' }]))
      .toEqual([{ id: 'a', name: 'A', media: ['https://media.example/a.jpg'] }, { id: 'b', name: 'B', text: 'x' }]);
  });

  test('rejects rows without an id or a name, and repeated ids', () => {
    expect(() => askRows([{ name: 'A' }])).toThrow('id');
    expect(() => askRows([{ id: 'a' }])).toThrow('name');
    expect(() => askRows([{ id: 'a', name: 'A' }, { id: 'a', name: 'B' }])).toThrow('repeated');
    expect(() => askRows({})).toThrow('list');
  });
});

describe('ask: movement words are optional', () => {
  test('with no dataset, the movement is "other" or "unknown" and the motion is asked joint by joint', () => {
    let s = startAsk([SQUAT], [], 'owner', DEFAULT_FLOW);
    for (const line of ['1', 'squat']) s = stepAsk(s.state, line);
    expect(s.state.question).toBe('movement');
    expect(s.out.join('\n')).toContain('"squat" is not an option here');
    for (const line of ['other', 'usual', '1', 'usual', 'hip kn', 'ext', 'ext', 'usual', 'usual', 'standing', 'implement', 'bb', 'back', '2']) s = stepAsk(s.state, line);
    expect(s.state.stage).toBe('review');
    expect(s.state.built?.fxi).toBe(SQUAT_FXI);
  });

  test('an answers record cites the dataset only when its movement is a word from it', () => {
    let s = startAsk([SQUAT], [], 'owner', FLOW);
    for (const line of ['1', 'other', 'usual', '1', 'usual', 'hip kn', 'ext', 'ext', 'usual', 'usual', 'standing', 'implement', 'bb', 'back', '2', '']) s = stepAsk(s.state, line);
    expect(s.state.entries[0]!.words).toBeUndefined();
  });

  test('import mode says it is for candidate search only', () => {
    expect(run([], { mode: 'import' }).text).toContain('candidate search only');
  });
});
