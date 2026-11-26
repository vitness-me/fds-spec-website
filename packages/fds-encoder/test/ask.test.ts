import { describe, expect, test } from 'vitest';
import { askRows, startAsk, stepAsk } from '../src/builder/ask';
import type { AskRow, AskState } from '../src/builder/ask';
import { build } from '../src/builder/build';
import type { Entry } from '../src/builder/build';

const SQUAT: AskRow = {
  id: 'ex.backSquat', name: 'Barbell back squat',
  text: 'Bar across the upper back. Sit down between the heels and stand back up.', media: ['https://media.example/back-squat.mp4'],
};
const RAISE: AskRow = { id: 'ex.oneArmLateralRaise', name: 'One-arm dumbbell lateral raise', text: 'Raise one dumbbell out to the side, all reps, then switch.' };
const CURL: AskRow = { id: 'ex.cableCurl', name: 'Cable curl' };
const ROWS = [SQUAT, RAISE, CURL];

/** The answers that describe the back squat, one line per question. */
const SQUAT_LINES = ['1', 'usual', '1', 'usual', 'hip kn', 'ext', 'ext', 'usual', 'usual', 'standing', 'implement', 'bar.straight', 'back', 'usual'];
const SQUAT_ANSWERS = {
  subject: 'usual', changes: ['usual'], 'motion.phases': '1', 'p1.kind': 'usual', 'p1.joints': ['hip', 'kn'], 'p1.hip': ['ext'], 'p1.kn': ['ext'],
  'p1.short': ['usual'], 'p1.also': 'usual', orientation: 'standing', load: 'implement', imp1: 'bar.straight', hold1: 'back', symmetry: 'usual',
};
const SQUAT_FXI = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back';

interface Run { state: AskState; text: string; saves: number; last: string }

function run(lines: string[], opts: { rows?: AskRow[]; existing?: readonly Entry[] } = {}): Run {
  let s = startAsk(opts.rows ?? ROWS, opts.existing ?? []);
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
    expect(r.state.asked).toEqual(build({ id: SQUAT.id, answers: r.state.answers }).path);
    expect(r.state.answers).toEqual(SQUAT_ANSWERS);
  });

  test('accepts the code an option writes', () => {
    const r = run(['1', 'width', '1', 'usual', 'sh el', 'away-square', 'ext', 'usual', 'usual', 'supine', 'implement', 'bar.straight', 'hands', 'usual', 'w-w']);
    expect(r.state.answers['grip.width']).toBe('wide');
  });

  test('accepts several options for a pick-many question, separated by spaces or commas', () => {
    const r = run(['1', 'footwork, held']);
    expect(r.state.answers.changes).toEqual(['footwork', 'held']);
    expect(r.state.question).toBe('motion.phases');
  });

  test('prints the built exercise key and equipment key after the last question', () => {
    const r = run(SQUAT_LINES);
    expect(r.last).toContain(SQUAT_FXI);
    expect(r.last).toContain('FXE=1.0S/k:imp/f:bar.straight');
  });

  test('keeps the row on Enter, saves, and moves to the next row', () => {
    const r = run([...SQUAT_LINES, '']);
    expect(r.saves).toBe(1);
    expect(r.state.row).toBe(1);
    expect(r.state.entries).toEqual([{ id: SQUAT.id, answers: SQUAT_ANSWERS }]);
    expect(r.text).toContain('Kept ex.backSquat.');
  });

  test('finishes after the last row', () => {
    const r = run(['s', 's', 's']);
    expect(r.state.stage).toBe('done');
    expect(r.last).toContain('3 rows are still open');
  });
});

describe('ask: commands', () => {
  test('? shows the help, the usual answer and the layer the question fills', () => {
    const r = run(['1', '?']);
    expect(r.last).toContain('Help: Every layer not picked here is at its default');
    expect(r.last).toContain('Usual: Nothing differs.');
    expect(r.last).toContain('Fills: selects which layers differ from their defaults.');
  });

  test('b goes back one question and forgets its answer', () => {
    const r = run(['1', 'usual', 'b']);
    expect(r.state.question).toBe('changes');
    expect(r.state.answers).toEqual({ subject: 'usual' });
    expect(r.state.asked).toEqual(['subject']);
  });

  test('b on the first question of a row stays put', () => {
    const r = run(['b']);
    expect(r.state.question).toBe('subject');
    expect(r.last).toContain('first question of the row');
  });

  test('s skips the row without saving it', () => {
    const r = run(['1', 's']);
    expect(r.state.row).toBe(1);
    expect(r.saves).toBe(0);
    expect(r.state.entries).toEqual([]);
  });

  test('q saves the finished rows and stops; the row in progress is not kept', () => {
    const r = run([...SQUAT_LINES, '', '1', 'q']);
    expect(r.state.stage).toBe('quit');
    expect(r.saves).toBe(2);
    expect(r.state.entries.map((e) => e.id)).toEqual([SQUAT.id]);
  });

  test('r on the result redoes the row from its first question', () => {
    const r = run([...SQUAT_LINES, 'r']);
    expect(r.state.stage).toBe('question');
    expect(r.state.question).toBe('subject');
    expect(r.state.answers).toEqual({});
    expect(r.state.entries).toEqual([]);
  });

  test('b on the result goes back to the last question', () => {
    const r = run([...SQUAT_LINES, 'b']);
    expect(r.state.question).toBe('symmetry');
  });

  test('Enter on a question shows it again', () => {
    const r = run(['1', '']);
    expect(r.state.question).toBe('changes');
    expect(r.last).toContain('Which of these does the exercise state');
  });

  test('when an option id is also a command letter, the question says to pick it by number', () => {
    const r = run(['1', 'usual', '1', 'usual', 'sh', 'up-side', 'usual', 'usual', 'standing', 'implement', 'bell.dumb', 'hands']);
    expect(r.state.question).toBe('symmetry');
    expect(r.last).toMatch(/Type \d+ to pick "b"/);
  });
});

describe('ask: rejecting answers', () => {
  test('an unknown option is rejected and the question stays', () => {
    const r = run(['1', 'zzz']);
    expect(r.state.question).toBe('changes');
    expect(r.last).toContain('"zzz" is not an option here');
  });

  test('text that is not an option lists the options whose words contain it', () => {
    const r = run(['1', 'usual', '1', 'usual', 'hip', 'thigh']);
    expect(r.state.question).toBe('p1.hip');
    expect(r.last).toContain('Options containing "thigh"');
  });

  test('a pick-one question takes exactly one option', () => {
    const r = run(['1 2']);
    expect(r.state.question).toBe('subject');
    expect(r.last).toContain('Pick one option');
  });

  test('an exclusive option cannot be combined', () => {
    const r = run(['1', 'usual footwork']);
    expect(r.state.question).toBe('changes');
    expect(r.last).toContain('"usual" cannot be combined');
  });

  test('an option that does not apply says why', () => {
    const r = run(['1', 'stance', '1', 'usual', 'sh el', 'away-square', 'ext', 'usual', 'usual', 'supine', 'implement', 'bar.straight', 'hands', 'usual', 'wide']);
    expect(r.state.question).toBe('stance');
    expect(r.last).toContain('does not apply here');
  });

  test('a number outside the list is rejected', () => {
    const r = run(['99']);
    expect(r.state.question).toBe('subject');
    expect(r.last).toContain('"99" is not an option here');
  });

  test('answers the builder rejects are shown, and the row cannot be kept until fixed', () => {
    const r = run(['1', 'usual', '1', 'usual', 'kn', 'flex ext']);
    const done = run(['1', 'usual', '1', 'usual', 'kn', 'flex ext', 'usual', 'usual', 'standing', 'bodyweight', 'usual']);
    expect(r.state.question).toBe('p1.short');
    expect(done.state.stage).toBe('review');
    expect(done.last).toContain('kn.flex and kn.ext cannot happen in one phase');
    const kept = stepAsk(done.state, '');
    expect(kept.state.stage).toBe('review');
    expect(kept.state.entries).toEqual([]);
  });
});

describe('ask: resuming', () => {
  test('starts at the first row that has no entry', () => {
    const r = run([], { existing: [{ id: SQUAT.id, answers: SQUAT_ANSWERS }] });
    expect(r.state.row).toBe(1);
    expect(r.text).toContain('One-arm dumbbell lateral raise');
  });

  test('a skipped row comes back on the next start', () => {
    const first = run(['s']);
    expect(first.state.row).toBe(1);
    expect(run([], { existing: first.state.entries }).state.row).toBe(0);
  });

  test('after skipping, the walk passes over rows that are already finished', () => {
    const r = run(['s'], { existing: [{ id: RAISE.id, answers: {} }] });
    expect(r.state.row).toBe(2);
    expect(r.last).toContain('Cable curl');
  });

  test('entries keep the order of the rows, and other entries stay in the file', () => {
    const other: Entry = { id: 'ex.elsewhere', answers: { subject: 'usual' } };
    const r = run([...SQUAT_LINES, ''], { existing: [other, { id: RAISE.id, answers: {} }] });
    expect(r.state.entries.map((e) => e.id)).toEqual([SQUAT.id, RAISE.id, 'ex.elsewhere']);
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
