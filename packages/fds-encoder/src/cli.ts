// The fds-encoder command line: check, compare, build and match structural keys.
import { readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import pkg from '../package.json';
import { answersText, askRows, startAsk, stepAsk } from './builder/ask';
import type { AskRow, AskStep } from './builder/ask';
import { AnswerError, build } from './builder/build';
import type { Entry } from './builder/build';
import { FACTS, FLOW, QUESTIONS } from './builder/flow';
import type { Cond, FlowQuestion } from './builder/flow';
import { fxmInFxmg } from './fxmg';
import { editJsonStrings } from './json-text';
import type { JsonStringEdit } from './json-text';
import { checkKey, compareKeys, KeyError, keyType, writeKey } from './keys';
import type { KeyComparison } from './keys';
import { match } from './match';
import type { MatchEntry } from './match';
import { checkRecordEdits, matchEntryOf } from './records';

const USAGE = `fds-encoder ${pkg.version}: structural keys of the Fitness Data Standard

  fds-encoder check <key>...                     check keys and print each in its written form
  fds-encoder check --records <file.json> [--write <out.json>]
                                                 check every key in FDS records; --write saves them in written form
  fds-encoder compare <a> <b>                    compare two keys, or place a muscle key in a category key
  fds-encoder build <answers.json>               build keys from answers: [{ "id", "answers": { question: option } }]
  fds-encoder ask [rows.json] [--out <answers.json>]
                                                 answer the questions in the terminal and build the keys
  fds-encoder questions [--json | --text]        print the question flow
  fds-encoder match <records.json> --library <records.json> [--top <n>]
                                                 suggest library records for each record, by key
  fds-encoder --version | --help`;

/** Where the command line writes and reads. */
export interface CliIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
  /** Lines typed by the user, for `ask`. */
  readonly lines: () => AsyncIterable<string>;
}

const nodeIo: CliIo = {
  out: (text) => { process.stdout.write(text); },
  err: (text) => { process.stderr.write(text); },
  lines: () => createInterface({ input: process.stdin, terminal: false }),
};

let io: CliIo = nodeIo;
const say = (s: string): void => { io.out(`${s}\n`); };
const warn = (s: string): void => { io.err(`${s}\n`); };

function flag(args: readonly string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

/** The value after `name`: absent when the flag is, `null` when the flag is given without a value. */
function flagValue(args: readonly string[], name: string): string | null | undefined {
  if (!args.includes(name)) return undefined;
  const value = flag(args, name);
  return value === undefined || value.startsWith('--') ? null : value;
}

/** A problem with the command's input: a file that cannot be read or written, is not JSON, or holds the wrong thing. */
class InputError extends Error {}

const FILE_PROBLEMS: Readonly<Record<string, string>> = {
  ENOENT: 'no such file', EISDIR: 'is a directory, not a file', ENOTDIR: 'a part of the path is not a directory',
  EACCES: 'permission denied', EPERM: 'permission denied', EROFS: 'the file system is read-only', ENOSPC: 'no space left on the device',
  ENAMETOOLONG: 'the path is too long', EMFILE: 'too many open files', ELOOP: 'too many symbolic links in the path',
};

/** A file system error as an InputError naming the path; undefined for any other error. */
function fileError(err: unknown, path: string): InputError | undefined {
  const code = (err as NodeJS.ErrnoException | null)?.code;
  if (typeof code !== 'string') return undefined;
  return new InputError(`${path}: ${FILE_PROBLEMS[code] ?? `cannot be read or written (${code})`}.`);
}

async function readText(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch (err) {
    throw fileError(err, path) ?? err;
  }
}

function parseJson(text: string, path: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (err) {
    if (err instanceof SyntaxError) throw new InputError(`${path} is not valid JSON: ${err.message}`);
    throw err;
  }
}

const readJson = async (path: string): Promise<unknown> => parseJson(await readText(path), path);

let temporaries = 0;

/** Writes a whole file: to a temporary file beside it, then renamed over it, so a failed write never leaves part of one. */
async function writeWhole(path: string, text: string): Promise<void> {
  if ((await stat(path).catch(() => undefined))?.isDirectory()) throw new InputError(`${path}: ${FILE_PROBLEMS.EISDIR}.`);
  const tmp = join(dirname(path), `.${basename(path)}.${process.pid}.${temporaries++}.tmp`);
  try {
    await writeFile(tmp, text);
    await rename(tmp, path);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => undefined);
    throw fileError(err, path) ?? err;
  }
}

const listOf = (data: unknown): unknown[] => (Array.isArray(data) ? data : [data]);

function check(keys: readonly string[]): number {
  let code = 0;
  for (const k of keys) {
    const c = checkKey(k);
    if (c.ok) say(`ok   ${c.written}`);
    else { code = 1; say(`bad  ${k}\n     ${c.issues.map((i) => i.message).join('\n     ')}`); }
  }
  return code;
}

async function checkRecords(file: string, out: string | undefined): Promise<number> {
  const text = await readText(file);
  const data = parseJson(text, file);
  const records = listOf(data);
  const edits: JsonStringEdit[] = [];
  let bad = 0;
  records.forEach((record, n) => {
    const c = checkRecordEdits(record);
    const where = `record ${n}`;
    for (const r of c.rewritten) say(`${where} ${r.path}: written form\n  ${r.from}\n  ${r.to}`);
    for (const w of c.warnings) say(`${where} ${w.path}: warning: ${w.message}`);
    for (const p of c.problems) say(`${where} ${p.path}: ${p.message}`);
    if (c.problems.length > 0) bad++;
    for (const e of c.edits) edits.push({ steps: Array.isArray(data) ? [n, ...e.steps] : e.steps, to: e.to });
  });
  say(`${records.length} records, ${bad} with problems`);
  // Only the rewritten key strings change: numbers, spacing and everything else stay exactly as written.
  if (out !== undefined) await writeWhole(out, editJsonStrings(text, edits));
  return bad === 0 ? 0 : 1;
}

function describeComparison(c: KeyComparison): string {
  const head = c.result === 'more-specific' ? `more-specific: ${c.specific === 'a' ? 'A' : 'B'} is more specific` : c.result;
  return `${head}  ${JSON.stringify(c.layers ?? { shared: c.shared })}`;
}

function compare(a: string, b: string): number {
  const ta = keyType(a);
  const tb = keyType(b);
  if ((ta === 'FXM' && tb === 'FXMG') || (ta === 'FXMG' && tb === 'FXM')) {
    const [fxm, fxmg] = ta === 'FXM' ? [a, b] : [b, a];
    writeKey(fxm);
    writeKey(fxmg);
    const p = fxmInFxmg(fxm, fxmg);
    say(`${p.relation}  ${JSON.stringify({ shared: p.shared })}`);
    return 0;
  }
  say(describeComparison(compareKeys(a, b)));
  return 0;
}

async function buildFile(file: string): Promise<number> {
  const entries = listOf(await readJson(file)) as Entry[];
  const out: Record<string, unknown>[] = [];
  let failed = 0;
  for (const e of entries) {
    try {
      const b = build(e);
      out.push({ id: b.id, fxi: b.fxi, fxe: b.fxe });
    } catch (err) {
      if (!(err instanceof AnswerError)) throw err;
      failed++;
      warn(`${err.entryId}:\n  ${err.problems.join('\n  ')}`);
    }
  }
  say(JSON.stringify(out, null, 2));
  return failed > 0 ? 1 : 0;
}

function describe(c: Cond): string {
  if ('fact' in c) return FACTS[c.fact].replace(/\.$/, '');
  if ('not' in c) return `not (${describe(c.not)})`;
  if ('all' in c) return c.all.map(describe).join(' and ');
  if ('any' in c) return `(${c.any.map(describe).join(' or ')})`;
  if ('is' in c) return `${c.q} is ${typeof c.is === 'string' ? c.is : c.is.join(' or ')}`;
  if ('has' in c) return `${c.q} includes ${c.has}`;
  return `${c.q} is at least ${c.atLeast}`;
}

function questionText(q: FlowQuestion, n: number): string {
  const lines = [`${n}. [${q.id}] ${q.text}`, `   fills: ${q.layer}; ${q.select === 'many' ? 'pick one or more' : 'pick one'}`];
  if (q.when !== undefined) lines.push(`   asked when: ${describe(q.when)}`);
  lines.push(`   help: ${q.help}`, `   usual: ${q.usual ?? 'no published default; this question sets the value'}`);
  let group: string | undefined;
  for (const o of q.options) {
    if (o.group !== undefined && o.group !== group) { group = o.group; lines.push(`     ${group}:`); }
    lines.push(`     - ${o.id}: ${o.label}${o.value !== undefined && o.value !== o.id ? `  → ${o.value === '' ? '(default)' : o.value}` : ''}`);
  }
  return lines.join('\n');
}

function questions(args: readonly string[]): number {
  const only = args.includes('--json') ? 'json' : args.includes('--text') ? 'text' : 'both';
  if (only !== 'json') {
    say(`Questions for ${FLOW.notation}. ${QUESTIONS.length} questions; each is asked only when its condition holds.\n`);
    say(QUESTIONS.map((q, i) => questionText(q, i + 1)).join('\n\n'));
  }
  if (only === 'both') say('\n──────── JSON ────────');
  if (only !== 'text') say(JSON.stringify(FLOW, null, 2));
  return 0;
}

/** The answers file `ask --out` continues: a list of entries, each with a string id. */
function answersIn(data: unknown, path: string): Entry[] {
  const entries = listOf(data);
  if (!entries.every((e) => typeof e === 'object' && e !== null && !Array.isArray(e) && typeof (e as { id?: unknown }).id === 'string')) {
    throw new InputError(`${path} holds no answers file: it holds a list of entries, each with a string "id".`);
  }
  return entries as Entry[];
}

async function ask(rowsFile: string | undefined, outPath: string | undefined): Promise<number> {
  let rows: AskRow[] = [{ id: 'key-1', name: 'New key' }];
  if (rowsFile !== undefined) {
    const data = await readJson(rowsFile);
    try {
      rows = askRows(data);
    } catch (err) {
      throw new InputError(`${rowsFile}: ${(err as Error).message}`);
    }
  }
  let existing: Entry[] = [];
  if (outPath !== undefined) {
    let text: string | undefined;
    try {
      text = await readFile(outPath, 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw fileError(err, outPath) ?? err;
    }
    if (text !== undefined) existing = answersIn(parseJson(text, outPath), outPath);
  }
  let wrote = false;
  const show = async (step: AskStep): Promise<boolean> => {
    say(step.out.join('\n'));
    if (step.save && outPath !== undefined) { await writeWhole(outPath, answersText(step.state)); wrote = true; }
    const over = step.state.stage === 'done' || step.state.stage === 'quit';
    if (over) {
      for (const e of step.state.entries) {
        try { const b = build(e); say(`${b.id}: ${b.fxi ?? '(no exercise key)'}  ${b.fxe}`); } catch (err) { if (!(err instanceof AnswerError)) throw err; }
      }
      if (outPath !== undefined) say(`Answers file: ${outPath}`);
    } else io.out('> ');
    return over;
  };
  let step = startAsk(rows, existing);
  if (await show(step)) return 0;
  for await (const line of io.lines()) {
    step = stepAsk(step.state, line);
    if (await show(step)) return 0;
  }
  const row = step.state.rows[step.state.row];
  const saved = outPath === undefined ? 'Nothing was saved: run with --out <answers.json> to keep answers.'
    : wrote ? `The rows finished before it are in ${outPath}.` : `Nothing was saved to ${outPath}.`;
  say(`\nThe input ended before ${row === undefined ? 'the session finished' : `row ${row.id} was finished`}: ${row === undefined ? '' : 'its answers were not saved. '}${saved}`);
  return 1;
}

async function matchFiles(file: string, libraryFile: string, top: number): Promise<number> {
  const entries = (path: string, data: unknown): MatchEntry[] => listOf(data).flatMap((r, i) => {
    const e = matchEntryOf(r);
    if (e === undefined) warn(`${path} record ${i}: no key of its own or no id; skipped.`);
    return e === undefined ? [] : [e];
  });
  const queries = entries(file, await readJson(file));
  const library = entries(libraryFile, await readJson(libraryFile));
  for (const l of library) if (!checkKey(l.key).ok) warn(`${libraryFile} ${l.id}: its key ${l.key} does not check, so it matches by name only.`);
  const out = queries.map((q) => {
    const m = match(q, library.filter((l) => keyType(l.key) === keyType(q.key)), { top });
    for (const w of m.warnings ?? []) warn(`${file} ${q.id}: ${w}`);
    return { id: q.id, key: q.key, match: m };
  });
  say(JSON.stringify(out, null, 2));
  return 0;
}

async function dispatch(args: readonly string[]): Promise<number> {
  const [cmd, ...rest] = args;
  if (cmd === '--version' || cmd === '-v') { say(pkg.version); return 0; }
  if (cmd === undefined || cmd === '--help' || cmd === '-h' || cmd === 'help') { say(USAGE); return cmd === undefined ? 1 : 0; }
  if (cmd === 'check') {
    const records = flagValue(rest, '--records');
    if (records === null) { warn('check --records needs a file: --records <file.json>.'); return 2; }
    if (records !== undefined) {
      const out = flagValue(rest, '--write');
      if (out === null) { warn('--write needs a path: --write <out.json>.'); return 2; }
      return checkRecords(records, out);
    }
    if (rest.includes('--write')) { warn('--write needs --records: check --records <file.json> --write <out.json>.'); return 2; }
    if (rest.length === 0) { warn('check needs at least one key, or --records <file.json>.'); return 2; }
    return check(rest);
  }
  if (cmd === 'compare') {
    if (rest.length !== 2) { warn('compare needs two keys.'); return 2; }
    return compare(rest[0]!, rest[1]!);
  }
  if (cmd === 'build') {
    if (rest[0] === undefined) { warn('build needs an answers file.'); return 2; }
    return buildFile(rest[0]);
  }
  if (cmd === 'questions') return questions(rest);
  if (cmd === 'ask') {
    const out = flag(rest, '--out');
    const rows = rest.find((a, i) => !a.startsWith('--') && rest[i - 1] !== '--out');
    return ask(rows, out);
  }
  if (cmd === 'match') {
    const library = flag(rest, '--library');
    const top = Number(flag(rest, '--top') ?? 3);
    if (rest[0] === undefined || rest[0].startsWith('--') || library === undefined) { warn('match needs <records.json> --library <records.json>.'); return 2; }
    if (!Number.isInteger(top) || top < 1) { warn('--top is a whole number of at least 1.'); return 2; }
    return matchFiles(rest[0], library, top);
  }
  warn(`Unknown command "${cmd}".\n\n${USAGE}`);
  return 2;
}

/**
 * Runs one command line and gives its exit code: 0 success, 1 a key, record, answer or file that does not check or
 * cannot be read, or input that ends before `ask` finishes, 2 a usage error. Errors in the input are reported on `err`;
 * any other error is thrown.
 */
export async function runCli(args: readonly string[], cliIo: CliIo = nodeIo): Promise<number> {
  io = cliIo;
  try {
    return await dispatch(args);
  } catch (err) {
    if (err instanceof InputError || err instanceof KeyError || err instanceof AnswerError) {
      warn(err.message);
      return 1;
    }
    throw err;
  }
}

const isBrokenPipe = (err: unknown): boolean => (err as NodeJS.ErrnoException | null)?.code === 'EPIPE';
const oneLine = (err: unknown): string => (err instanceof Error ? err.message : String(err)).split('\n')[0]!;

/**
 * Runs the command line as a program: like {@link runCli}, but any other error is printed as one line on `err` and
 * gives exit code 1, and output closed by the reader (`fds-encoder questions | head`) ends the program quietly.
 */
export async function main(args: readonly string[], cliIo: CliIo = nodeIo): Promise<number> {
  try {
    return await runCli(args, cliIo);
  } catch (err) {
    if (isBrokenPipe(err)) return 0;
    try { cliIo.err(`fds-encoder: ${oneLine(err)}\n`); } catch { /* standard error is closed too */ }
    return 1;
  }
}

/**
 * The handler for an `error` event on standard output: a reader that closed the pipe ends the program quietly with
 * code 0; any other error is printed as one line and ends it with code 1.
 */
export function onOutputError(exit: (code: number) => void, err: (text: string) => void = nodeIo.err): (e: unknown) => void {
  return (e) => {
    if (isBrokenPipe(e)) { exit(0); return; }
    try { err(`fds-encoder: ${oneLine(e)}\n`); } catch { /* standard error is closed too */ }
    exit(1);
  };
}
