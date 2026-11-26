// The fds-encoder command line: check, compare, build and match structural keys.
import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import pkg from '../package.json';
import { answersText, askRows, startAsk, stepAsk } from './builder/ask';
import type { AskRow, AskStep } from './builder/ask';
import { AnswerError, build } from './builder/build';
import type { Entry } from './builder/build';
import { FACTS, FLOW, QUESTIONS } from './builder/flow';
import type { Cond, FlowQuestion } from './builder/flow';
import { fxmInFxmg } from './fxmg';
import { checkKey, compareKeys, KeyError, keyType } from './keys';
import type { KeyComparison } from './keys';
import { match } from './match';
import { checkRecord, matchEntryOf } from './records';

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

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
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
  const data = await readJson(file);
  const records = listOf(data);
  let bad = 0;
  const checked = records.map((record, n) => {
    const c = checkRecord(record);
    const where = `record ${n}`;
    for (const r of c.rewritten) say(`${where} ${r.path}: written form\n  ${r.from}\n  ${r.to}`);
    for (const w of c.warnings) say(`${where} ${w.path}: warning: ${w.message}`);
    for (const p of c.problems) say(`${where} ${p.path}: ${p.message}`);
    if (c.problems.length > 0) bad++;
    return c.record;
  });
  say(`${records.length} records, ${bad} with problems`);
  if (out !== undefined) await writeFile(out, `${JSON.stringify(Array.isArray(data) ? checked : checked[0], null, 2)}\n`);
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
    for (const k of [fxm, fxmg]) { const c = checkKey(k); if (!c.ok) throw new KeyError(`${k}: ${c.issues.map((i) => i.message).join('; ')}`); }
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

async function ask(rowsFile: string | undefined, outPath: string | undefined): Promise<number> {
  const rows: AskRow[] = rowsFile === undefined ? [{ id: 'key-1', name: 'New key' }] : askRows(await readJson(rowsFile));
  let existing: Entry[] = [];
  if (outPath !== undefined) {
    try { existing = listOf(await readJson(outPath)) as Entry[]; } catch (err) { if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err; }
  }
  const show = async (step: AskStep): Promise<boolean> => {
    say(step.out.join('\n'));
    if (step.save && outPath !== undefined) await writeFile(outPath, answersText(step.state));
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
    if (await show(step)) break;
  }
  return 0;
}

async function matchFiles(file: string, libraryFile: string, top: number): Promise<number> {
  const entries = (path: string, data: unknown): ReturnType<typeof matchEntryOf>[] => listOf(data).map((r, i) => {
    const e = matchEntryOf(r);
    if (e === undefined) warn(`${path} record ${i}: no key of its own or no id; skipped.`);
    return e;
  });
  const queries = entries(file, await readJson(file));
  const library = entries(libraryFile, await readJson(libraryFile)).filter((e) => e !== undefined);
  const out = queries.filter((q) => q !== undefined).map((q) => ({ id: q.id, key: q.key, match: match(q, library.filter((l) => keyType(l.key) === keyType(q.key)), { top }) }));
  say(JSON.stringify(out, null, 2));
  return 0;
}

async function dispatch(args: readonly string[]): Promise<number> {
  const [cmd, ...rest] = args;
  if (cmd === '--version' || cmd === '-v') { say(pkg.version); return 0; }
  if (cmd === undefined || cmd === '--help' || cmd === '-h' || cmd === 'help') { say(USAGE); return cmd === undefined ? 1 : 0; }
  if (cmd === 'check') {
    const records = flag(rest, '--records');
    if (records !== undefined) return checkRecords(records, flag(rest, '--write'));
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
 * Runs one command line and gives its exit code: 0 success, 1 a key, record or answer that does not check, 2 a usage
 * error. Errors in the input are reported on `err`; any other error is thrown.
 */
export async function runCli(args: readonly string[], cliIo: CliIo = nodeIo): Promise<number> {
  io = cliIo;
  try {
    return await dispatch(args);
  } catch (err) {
    if (err instanceof KeyError || err instanceof AnswerError || err instanceof SyntaxError || (err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      warn((err as Error).message);
      return 1;
    }
    throw err;
  }
}
