// The interactive answer session behind `fds-encoder ask`, as a pure stepper: each input line maps one state to the
// next and the text to print. The terminal loop only reads lines, prints and saves.
import { AnswerError, build, buildWith, openOptions } from './build';
import type { Answer, Built, Entry, Reading } from './build';
import type { FlowOption, FlowQuestion } from './flow';

/** One row to answer: an id and a name, with the row's own text and media links when it has them. */
export interface AskRow {
  readonly id: string;
  readonly name: string;
  readonly alsoCalled?: string;
  readonly text?: string;
  readonly media?: readonly string[];
}

/**
 * The session. `entries` is the answers file: finished rows in row order, then any other entries the file held.
 * `asked` lists the questions answered for the current row, in the order asked. `question` is the question waiting for
 * an answer while `stage` is `question`. In `review` the row is complete and `built` or `problems` holds the result.
 */
export interface AskState {
  readonly rows: readonly AskRow[];
  readonly entries: readonly Entry[];
  readonly row: number;
  readonly answers: Readonly<Record<string, Answer>>;
  readonly asked: readonly string[];
  readonly stage: 'question' | 'review' | 'done' | 'quit';
  readonly question?: string;
  readonly built?: Built;
  readonly problems?: readonly string[];
}

/** The next state, the lines to print, and whether the answers file must be written now. */
export interface AskStep { readonly state: AskState; readonly out: readonly string[]; readonly save: boolean }


/** Options are listed in full up to this many; longer lists print as compact columns of ids. */
const FULL_LIST = 40;
const COMMANDS = ['?', 'b', 's', 'q'];
const KEYS = 'Keys: a number or option id answers, ? help, b back one question, s skip this row, q save and stop, Enter shows the question again.';

/** Reads a rows file: a list of {id, name, alsoCalled?, text?, media?}, where media is one link or a list of links. */
export function askRows(raw: unknown): AskRow[] {
  if (!Array.isArray(raw)) throw new Error('The rows file must hold a list of rows.');
  const seen = new Set<string>();
  return raw.map((r: Record<string, unknown>, i): AskRow => {
    const where = `row ${i + 1}`;
    if (typeof r?.id !== 'string' || r.id === '') throw new Error(`${where}: needs a non-empty string "id".`);
    if (typeof r.name !== 'string' || r.name === '') throw new Error(`${where} (${r.id}): needs a non-empty string "name".`);
    if (seen.has(r.id)) throw new Error(`${where}: the id "${r.id}" is repeated.`);
    seen.add(r.id);
    const media = typeof r.media === 'string' ? [r.media] : Array.isArray(r.media) ? r.media.filter((m): m is string => typeof m === 'string') : [];
    return {
      id: r.id, name: r.name,
      ...(typeof r.alsoCalled === 'string' && r.alsoCalled !== '' ? { alsoCalled: r.alsoCalled } : {}),
      ...(typeof r.text === 'string' && r.text !== '' ? { text: r.text } : {}),
      ...(media.length > 0 ? { media } : {}),
    };
  });
}

/** Starts a session at the first row with no entry in `existing`. */
export function startAsk(rows: readonly AskRow[], existing: readonly Entry[] = []): AskStep {
  const base: AskState = { rows, entries: ordered(rows, existing), row: -1, answers: {}, asked: [], stage: 'question' };
  const done = base.entries.filter((e) => rows.some((r) => r.id === e.id)).length;
  const intro = [`${rows.length} rows, ${done} already answered.`, KEYS];
  const next = enterRow(base, nextOpen(base, -1));
  return { ...next, out: [...intro, ...next.out] };
}

/** Applies one input line. */
export function stepAsk(s: AskState, input: string): AskStep {
  const line = input.trim();
  if (s.stage === 'done' || s.stage === 'quit') return { state: s, out: [], save: false };
  if (s.stage === 'review') return onReview(s, line);
  return onQuestion(s, line);
}

// ───────────────────────────── rows ─────────────────────────────

function ordered(rows: readonly AskRow[], entries: readonly Entry[]): Entry[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const own = rows.map((r) => byId.get(r.id)).filter((e): e is Entry => e !== undefined);
  return [...own, ...entries.filter((e) => !rows.some((r) => r.id === e.id))];
}

/** The index of the first row after `from` with no entry, or rows.length when there is none. */
function nextOpen(s: AskState, from: number): number {
  for (let i = from + 1; i < s.rows.length; i++) if (!s.entries.some((e) => e.id === s.rows[i]!.id)) return i;
  return s.rows.length;
}

function enterRow(s: AskState, row: number): AskStep {
  if (row >= s.rows.length) {
    const done = s.entries.filter((e) => s.rows.some((r) => r.id === e.id)).length;
    const left = s.rows.length - done;
    const msg = left === 0 ? `All ${s.rows.length} rows are answered.` : `End of the rows. ${left} rows are still open; they are asked again next time.`;
    return { state: { ...s, row, answers: {}, asked: [], stage: 'done', question: undefined }, out: [msg], save: false };
  }
  const r = s.rows[row]!;
  const head = [
    '',
    `════ Row ${row + 1} of ${s.rows.length} · ${r.id} ════`,
    r.name,
    ...(r.alsoCalled === undefined ? [] : [`Also called: ${r.alsoCalled}`]),
    ...(r.text === undefined ? [] : ['', r.text]),
    ...(r.media === undefined ? [] : ['', ...r.media.map((m) => `Media: ${m}`)]),
  ];
  const next = advance({ ...s, row, answers: {}, asked: [], built: undefined, problems: undefined });
  return { ...next, out: [...head, ...next.out] };
}

// ───────────────────────────── the walk ─────────────────────────────

class Waiting { constructor(readonly q: FlowQuestion, readonly reading: Reading) {} }

/** The first question on the path that has no answer yet, with the reading at that point; undefined when none is left. */
function pending(answers: Readonly<Record<string, Answer>>): Waiting | undefined {
  try {
    buildWith('ask', (q, r) => {
      const a = answers[q.id];
      if (a === undefined) throw new Waiting(q, r);
      return a;
    });
  } catch (e) {
    if (e instanceof Waiting) return e;
    if (!(e instanceof AnswerError)) throw e;
  }
  return undefined;
}

/** Moves to the next unanswered question, or to the result when the row is complete. */
function advance(s: AskState): AskStep {
  const w = pending(s.answers);
  if (w !== undefined) return { state: { ...s, stage: 'question', question: w.q.id }, out: show(w.q, open(w)), save: false };
  try {
    return review({ ...s, stage: 'review', question: undefined, built: build(entryOf(s)), problems: undefined });
  } catch (e) {
    if (!(e instanceof AnswerError)) throw e;
    return review({ ...s, stage: 'review', question: undefined, built: undefined, problems: e.problems });
  }
}

function open(w: Waiting): readonly FlowOption[] { return openOptions(w.q, w.reading); }

function entryOf(s: AskState): Entry {
  const id = s.rows[s.row]!.id;
  return { id, answers: s.answers };
}

// ───────────────────────────── questions ─────────────────────────────

function show(q: FlowQuestion, opts: readonly FlowOption[]): string[] {
  const lines = ['', `[${q.id}] ${q.text}`, q.select === 'many' ? `Pick one or more${q.max === undefined ? '' : ` (at most ${q.max})`}, separated by spaces or commas.` : 'Pick one.'];
  if (opts.length > FULL_LIST) {
    lines.push(...columns(opts), 'Type a word to see the options that contain it, with their full descriptions.');
  } else {
    let group: string | undefined;
    opts.forEach((o, i) => {
      if (o.group !== undefined && o.group !== group) { group = o.group; lines.push(`  ${group}:`); }
      lines.push(`  ${String(i + 1).padStart(2)}  ${o.id.padEnd(14)} ${o.label}`);
    });
  }
  opts.forEach((o, i) => { if (COMMANDS.includes(o.id)) lines.push(`Type ${i + 1} to pick "${o.id}"; the letter ${o.id} is a command.`); });
  return lines;
}

function columns(opts: readonly FlowOption[]): string[] {
  const lines: string[] = [];
  let group: string | undefined;
  let cur = '';
  const flush = (): void => { if (cur !== '') lines.push(cur); cur = ''; };
  opts.forEach((o, i) => {
    if (o.group !== group) { flush(); group = o.group; if (group !== undefined) lines.push(`  ${group}:`); }
    const cell = `${String(i + 1).padStart(4)} ${o.id}`.padEnd(30);
    if (cur.length + cell.length > 96) flush();
    cur += cell;
  });
  flush();
  return lines.map((l) => l.trimEnd());
}

function help(q: FlowQuestion): string[] {
  return [
    `Help: ${q.help}`,
    `Usual: ${q.usual ?? 'there is no usual answer; this question sets the value.'}`,
    `Fills: ${q.layer}.`,
  ];
}

/** Maps one typed token to an open option: its number in the list, its id, or the code it writes. */
function resolve(token: string, opts: readonly FlowOption[]): FlowOption | undefined {
  if (/^\d+$/.test(token)) return opts[Number(token) - 1];
  const lower = token.toLowerCase();
  const byId = opts.find((o) => o.id.toLowerCase() === lower);
  if (byId !== undefined) return byId;
  const byValue = opts.filter((o) => o.value !== undefined && o.value !== '' && o.value.toLowerCase() === lower);
  return byValue.length === 1 ? byValue[0] : undefined;
}

function onQuestion(s: AskState, line: string): AskStep {
  const w = pending(s.answers)!;
  const q = w.q;
  const opts = open(w);
  const stay = (out: string[]): AskStep => ({ state: s, out, save: false });
  if (line === '') return stay(show(q, opts));
  if (line === '?') return stay(help(q));
  if (line === 'q') return { state: { ...s, stage: 'quit' }, out: ['Saved. The row in progress is asked again next time.'], save: true };
  if (line === 's') {
    const next = enterRow(s, nextOpen(s, s.row));
    return { ...next, out: [`Skipped ${s.rows[s.row]!.id}.`, ...next.out] };
  }
  if (line === 'b') return back(s);

  const tokens = line.split(/[\s,]+/).filter((t) => t !== '');
  if (q.select === 'one' && tokens.length > 1) return stay(['Pick one option.']);
  const picked: FlowOption[] = [];
  for (const t of tokens) {
    const o = resolve(t, opts);
    if (o !== undefined) { picked.push(o); continue; }
    const closed = /^\d+$/.test(t) ? undefined : q.options.find((x) => x.id.toLowerCase() === t.toLowerCase() || (x.value !== undefined && x.value !== '' && x.value === t));
    if (closed !== undefined) return stay([`"${closed.id}" does not apply here: ${closed.whenNot ?? 'its condition does not hold'}.`]);
    if (tokens.length === 1) {
      const needle = t.toLowerCase();
      const hits = opts.map((x, i) => ({ x, i })).filter(({ x }) => x.id.toLowerCase().includes(needle) || x.label.toLowerCase().includes(needle));
      if (hits.length > 0) return stay([`Options containing "${t}":`, ...hits.map(({ x, i }) => `  ${String(i + 1).padStart(3)}  ${x.id.padEnd(14)} ${x.label}`)]);
    }
    return stay([`"${t}" is not an option here. Enter shows the list.`]);
  }
  if (new Set(picked.map((o) => o.id)).size !== picked.length) return stay(['An option is repeated.']);
  if (q.max !== undefined && picked.length > q.max) return stay([`Pick at most ${q.max}.`]);
  const excl = picked.find((o) => o.exclusive);
  if (excl !== undefined && picked.length > 1) return stay([`"${excl.id}" cannot be combined with other options.`]);
  const answer: Answer = q.select === 'one' ? picked[0]!.id : picked.map((o) => o.id);
  return advance({ ...s, answers: { ...s.answers, [q.id]: answer }, asked: [...s.asked, q.id] });
}

function back(s: AskState): AskStep {
  const last = s.asked[s.asked.length - 1];
  if (last === undefined) return { state: s, out: ['This is the first question of the row.'], save: false };
  const answers = { ...s.answers };
  delete answers[last];
  return advance({ ...s, answers, asked: s.asked.slice(0, -1), built: undefined, problems: undefined });
}

// ───────────────────────────── the result ─────────────────────────────

function review(s: AskState): AskStep {
  const shown = Object.entries(s.answers).map(([k, v]) => `${k}=${typeof v === 'string' ? v : v.join('+')}`).join('  ');
  const lines = ['', `Answers: ${shown}`];
  if (s.built !== undefined) {
    lines.push(s.built.fxi === null ? '(equipment on its own: no exercise key)' : `  ${s.built.fxi}`, `  ${s.built.fxe}`);
    lines.push('Enter keeps this row and moves on. r redoes the row, b goes back one question, q stops without keeping this row.');
  } else {
    lines.push('These answers do not build:', ...(s.problems ?? []).map((p) => `  ${p}`), 'b goes back one question, r redoes the row, s skips it, q stops.');
  }
  return { state: s, out: lines, save: false };
}

function onReview(s: AskState, line: string): AskStep {
  const stay = (out: string[]): AskStep => ({ state: s, out, save: false });
  if (line === 'b') return back(s);
  if (line === 'r') return enterRow(s, s.row);
  if (line === 'q') return { state: { ...s, stage: 'quit' }, out: ['Saved. This row is asked again next time.'], save: true };
  if (s.built === undefined) {
    if (line === 's') return enterRow(s, nextOpen(s, s.row));
    return stay(['These answers do not build. b goes back one question, r redoes the row, s skips it.']);
  }
  if (line !== '') return stay(['Enter keeps the row; r, b and q are the other choices.']);
  const entry = entryOf(s);
  const entries = ordered(s.rows, [...s.entries.filter((e) => e.id !== entry.id), entry]);
  const next = enterRow({ ...s, entries }, nextOpen({ ...s, entries }, s.row));
  return { ...next, out: [`Kept ${entry.id}.`, ...next.out], save: true };
}

/** The answers file text for a state. */
export function answersText(s: AskState): string {
  return `${JSON.stringify(s.entries, null, 1)}\n`;
}
