// The fds-encoder command line. `run` takes the arguments and the streams, so tests drive it without a process.
import { writeFile } from 'node:fs/promises';
import { Command, CommanderError, Option } from 'commander';
import { FXI_RULES } from './alphabet.js';
import { answersText, askRows, MODE_TEXT, startAsk, stepAsk } from './ask.js';
import type { AskStep } from './ask.js';
import { AnswerError, build, rowMeta } from './build.js';
import type { Built, Entry } from './build.js';
import { checkCollisions, readLibrary } from './collide.js';
import type { Collision } from './collide.js';
import { compare } from './compare.js';
import { createFlow, DEFAULT_FLOW, FACTS } from './flow.js';
import type { Cond, Flow, FlowQuestion } from './flow.js';
import { checkMuscleRow, parseFxm, readFxmVocabulary } from './fxm.js';
import type { FxmVocabulary } from './fxm.js';
import { loadWordSet, readJson } from './load.js';
import { checkMatchRow, match } from './match.js';
import type { MatchRow } from './match.js';
import { checkRow, rowsOf } from './rows.js';
import type { Row } from './rows.js';
import { parseFxe, parseFxi } from './syntax.js';
import { upgrade } from './upgrade.js';
import type { UpgradeInput } from './upgrade.js';

/** Where the CLI reads lines and writes text. */
export interface Io {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
  /** The lines typed at the terminal, for `ask`. */
  readonly lines: () => AsyncIterable<string>;
  readonly prompt: (text: string) => void;
}

type Mode = 'owner' | 'import';

export const CANDIDATE_SEARCH_ONLY = 'import mode is candidate search only: its strings never link without a person, and no accuracy is claimed for them';

const MODE_HELP = 'owner: the owner of the exercise answers. import: someone reads another catalogue\'s row; candidate search only, with no accuracy claim';
const WORDS_HELP = 'a movement-word dataset (file or http(s) URL); without one, describe the motion joint by joint through "other"';

async function flowFor(words: string | undefined): Promise<Flow> {
  return words === undefined ? DEFAULT_FLOW : createFlow(await loadWordSet(words));
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

function questionText(q: FlowQuestion, n: number, mode: Mode): string {
  const lines = [`${n}. [${q.id}] ${q.text}`, `   fills: ${q.layer}; ${q.select === 'many' ? 'pick one or more' : 'pick one'}`];
  if (q.when !== undefined) lines.push(`   asked when: ${describe(q.when)}`);
  lines.push(`   help: ${q.help}`);
  if (mode === 'import' && q.importHelp !== undefined) lines.push(`   import mode: ${q.importHelp}`);
  lines.push(`   usual: ${q.usual ?? 'no published default; this question defines the value'}`);
  let group: string | undefined;
  for (const o of q.options) {
    if (o.group !== undefined && o.group !== group) { group = o.group; lines.push(`     ${group}:`); }
    lines.push(`     - ${o.id}: ${o.label}${o.value !== undefined && o.value !== o.id ? `  → ${o.value === '' ? '(default)' : o.value}` : ''}`);
  }
  return lines.join('\n');
}

function collisionText(c: Collision): string {
  const head = c.with.kind === 'library'
    ? `${c.id}: its ${c.on} equals library entry "${c.with.id}" (${c.value}).`
    : `${c.id}: its ${c.on} equals "${c.with.id}" in this file (${c.value}).`;
  const qs = c.separating.length > 0 ? `\n  Questions that could separate them:\n    - ${c.separating.join('\n    - ')}` : '';
  const what = c.on === 'FXE' ? 'the same equipment' : 'the same exercise';
  return `${head}\n  If they are ${what}, add "sameAs": "${c.with.id}" to the entry. Otherwise answer what differs, so the ${c.on} changes.${qs}\n  If the notation cannot say the difference, add "differs": "<what differs>"; it is reported as a vocabulary gap.`;
}

function entriesOf(raw: unknown, file: string): Entry[] {
  const list = Array.isArray(raw) ? raw : [raw];
  for (const [i, e] of list.entries()) {
    if (typeof e !== 'object' || e === null) throw new Error(`${file}: entry ${i + 1} is not an answers record {id, answers}.`);
  }
  return list as Entry[];
}

/**
 * The record `build` writes for one entry: the strings, who answered and the gap marker, the rules revision they were
 * built under, and the answers record they were built from, kept so `upgrade` can rebuild them.
 */
export function builtRecord(e: Entry, b: Built, mode: Mode, flow: Flow): Record<string, unknown> {
  const meta = rowMeta(e, mode);
  const { name, version } = flow.words;
  const cites = typeof e.answers.movement === 'string' && flow.wordById.has(e.answers.movement);
  const record: Entry = { ...e, ...(cites && e.words === undefined ? { words: { name, version } } : {}) };
  return {
    id: b.id,
    fxi: b.fxi,
    fxe: b.fxe,
    ...(b.fxeFull === undefined ? {} : { fxeFull: b.fxeFull }),
    ...(b.fxi === null ? {} : { fxiProvenance: meta.fxiProvenance, fxiGap: meta.fxiGap }),
    mode: meta.mode,
    rules: FXI_RULES,
    record,
  };
}

/** Builds every entry; the entries that do not build are reported on `err`. */
function buildAll(entries: readonly Entry[], mode: Mode, flow: Flow, io: Io): { out: Record<string, unknown>[]; built: { entry: Entry; built: Built }[]; failed: number } {
  const out: Record<string, unknown>[] = [];
  const built: { entry: Entry; built: Built }[] = [];
  let failed = 0;
  for (const e of entries) {
    try {
      const b = build(e, flow);
      out.push(builtRecord(e, b, mode, flow));
      built.push({ entry: e, built: b });
    } catch (err) {
      if (!(err instanceof AnswerError)) throw err;
      failed++;
      io.err(`${err.entryId}:\n  ${err.problems.join('\n  ')}`);
    }
  }
  return { out, built, failed };
}

function validateString(s: string, vocabulary: FxmVocabulary | undefined): { ok: boolean; text: string } {
  const t = s.trim();
  const p = t.startsWith('FXM=') ? parseFxm(t, vocabulary) : t.startsWith('FXE=') ? parseFxe(t) : parseFxi(t);
  return p.ok ? { ok: true, text: `ok   ${p.canonical}` } : { ok: false, text: `bad  ${s}\n     ${p.issues.map((i) => i.message).join('\n     ')}` };
}

async function validateRows(file: string, vocabulary: FxmVocabulary | undefined, writeTo: string | undefined, io: Io): Promise<number> {
  const rows = rowsOf(await readJson(file));
  if (rows === undefined) { io.err(`${file}: not a rows file (a JSON array of rows, or an object with an entries array)`); return 1; }
  let bad = 0;
  let changed = 0;
  const out = rows.map((row, n) => {
    const where = `row ${n} (${String(row.id)})`;
    const c = 'fxm' in row ? checkMuscleRow(row, vocabulary) : checkRow(row);
    for (const f of c.changed) { changed++; io.out(`${where}: ${f} canonicalised\n  ${String(row[f as keyof Row])}\n  ${String(c.row[f])}`); }
    for (const w of c.warnings) io.out(`${where}: cross-check: ${w}`);
    if (c.problems.length > 0) { bad++; io.out(`${where}: ${c.problems.join(' | ')}`); }
    return c.row;
  });
  io.out(`${rows.length} rows, ${bad} with errors, ${changed} strings canonicalised${vocabulary === undefined && rows.some((r) => 'fxm' in r) ? ' (FXM format only: no --muscles vocabulary given)' : ''}`);
  if (writeTo !== undefined) await writeFile(writeTo, `${JSON.stringify(out, null, 1)}\n`);
  return bad === 0 ? 0 : 1;
}

const json = (v: unknown): string => JSON.stringify(v, null, 1);

/**
 * The rows of a match file that carry an FXI; an equipment row (`fxi` null or left out) is skipped. Undefined, with
 * every problem reported, when the file is not a rows file or any row is unfit for matching.
 */
async function matchRows(file: string, io: Io): Promise<MatchRow[] | undefined> {
  const rows = rowsOf(await readJson(file));
  if (rows === undefined) { io.err(`${file}: not a rows file (a JSON array of rows, or an object with an entries array)`); return undefined; }
  const withFxi = rows.filter((r) => r.fxi !== undefined && r.fxi !== null);
  const bad = withFxi.flatMap((r, n) => {
    const problems = checkMatchRow(r);
    return problems.length === 0 ? [] : [`${file}: row ${n} (${String(r.id)}): ${problems.join(' | ')}`];
  });
  for (const line of bad) io.err(line);
  return bad.length === 0 ? (withFxi as unknown as MatchRow[]) : undefined;
}

/** Runs one command. Resolves to the exit code. */
export async function run(argv: readonly string[], io: Io, version = '0.0.0'): Promise<number> {
  let code = 0;
  const program = new Command('fds-encoder')
    .description('Encode exercises and equipment as FDS structural descriptors (FXI, FXE, FXM), and compare and match them. FXI is a descriptor: it describes how an exercise is done, and two strings compare the same way every time.')
    .version(version)
    .exitOverride()
    .configureOutput({ writeOut: (s) => io.out(s.replace(/\n$/, '')), writeErr: (s) => io.err(s.replace(/\n$/, '')) });
  const modeOption = (): Option => new Option('--mode <mode>', MODE_HELP).choices(['owner', 'import']).default('owner');

  program.command('questions')
    .description('print the question flow: every question, when it is asked, and the code each answer writes')
    .option('--json', 'print it as JSON instead')
    .addOption(modeOption())
    .option('--words <file|url>', WORDS_HELP)
    .action(async (o: { json?: boolean; mode: Mode; words?: string }) => {
      const flow = await flowFor(o.words);
      if (o.json) { io.out(json({ rules: flow.rules, facts: FACTS, questions: flow.questions })); return; }
      io.out(`FXI/FXE owner questions, rules ${flow.rules}. ${flow.questions.length} questions; each is asked only when its condition holds.\n${MODE_TEXT[o.mode]}\n`);
      io.out(flow.questions.map((q, i) => questionText(q, i + 1, o.mode)).join('\n\n'));
    });

  program.command('ask')
    .description('ask the questions for each row in the terminal, and save the answers records `build` reads; rerunning continues at the first row without an answer')
    .argument('<rows>', 'a JSON list of rows to answer: {id, name, alsoCalled?, text?, media?}')
    .requiredOption('--out <answers>', 'the answers file to write (and to continue from)')
    .addOption(modeOption())
    .option('--words <file|url>', WORDS_HELP)
    .action(async (rowsFile: string, o: { out: string; mode: Mode; words?: string }) => {
      const flow = await flowFor(o.words);
      const rows = askRows(await readJson(rowsFile));
      let existing: Entry[] = [];
      try { existing = entriesOf(await readJson(o.out), o.out); } catch (e) { if (!String(e).includes('no such file')) throw e; }
      if (o.mode === 'import') io.err(`Note: ${CANDIDATE_SEARCH_ONLY}.`);
      const show = async (step: AskStep): Promise<boolean> => {
        io.out(step.out.join('\n'));
        if (step.save) await writeFile(o.out, answersText(step.state));
        const over = step.state.stage === 'done' || step.state.stage === 'quit';
        if (over) io.out(`Answers file: ${o.out}`);
        else io.prompt('> ');
        return over;
      };
      let step = startAsk(rows, existing, o.mode, flow);
      if (await show(step)) return;
      for await (const line of io.lines()) {
        step = stepAsk(step.state, line);
        if (await show(step)) return;
      }
      if (step.state.stage === 'question' || step.state.stage === 'review') io.out('Input ended; the row in progress is asked again next time.');
    });

  program.command('build')
    .description('build the FXI and FXE of each answers record; each output record keeps its answers, so `upgrade` can rebuild it')
    .argument('<answers>', 'a JSON list of answers records {id, answers, provenance?, gap?, notes?, words?}')
    .addOption(modeOption())
    .option('--words <file|url>', WORDS_HELP)
    .option('--out <file>', 'write the built records to a file instead of printing them')
    .action(async (file: string, o: { mode: Mode; words?: string; out?: string }) => {
      const flow = await flowFor(o.words);
      if (o.mode === 'import') io.err(`Note: ${CANDIDATE_SEARCH_ONLY}.`);
      const { out, failed } = buildAll(entriesOf(await readJson(file), file), o.mode, flow, io);
      if (o.out === undefined) io.out(json(out));
      else { await writeFile(o.out, `${json(out)}\n`); io.err(`${out.length} built, ${failed} failed: ${o.out}`); }
      code = failed > 0 ? 1 : 0;
    });

  program.command('validate')
    .description('validate FXI, FXE and FXM strings and print their canonical forms, or check a rows file')
    .argument('[strings...]', 'FXI, FXE or FXM strings')
    .option('--rows <file>', 'a rows file: {id, fxi, fxe?, confidence, notes, fxiProvenance?, fxiGap?}, or muscle rows {id, slug, name, class, fxm}')
    .option('--muscles <file|url>', 'a provider\'s FXM vocabulary {muscles, groups}; without one, FXM keys are checked for format only')
    .option('--write <file>', 'with --rows, write the canonical rows')
    .action(async (strings: string[], o: { rows?: string; muscles?: string; write?: string }) => {
      const vocabulary = o.muscles === undefined ? undefined : readFxmVocabulary(await readJson(o.muscles));
      if (o.rows !== undefined) { code = await validateRows(o.rows, vocabulary, o.write, io); return; }
      if (strings.length === 0) { io.err('Give strings to validate, or --rows <file>.'); code = 1; return; }
      for (const s of strings) {
        const r = validateString(s, vocabulary);
        io.out(r.text);
        if (!r.ok) code = 1;
      }
    });

  program.command('compare')
    .description('compare two FXIs or two FXEs: identical, refines, refined-by, compatible, contradicting or invalid')
    .argument('<a>').argument('<b>')
    .action((a: string, b: string) => {
      const r = compare(a, b);
      io.out(`${r.relation} ${JSON.stringify(r.layers)}`);
      code = r.relation === 'invalid' ? 1 : 0;
    });

  program.command('match')
    .description('match each row against a library by the match protocol: auto only on a unique identical FXI with owner provenance, outside import mode, and no gap marker on either side; otherwise a ranked list to confirm')
    .argument('<rows>', 'a JSON list of {id, fxi, fxiProvenance?, mode?, fxiGap?, name?, fxe?}; a row whose provenance contradicts its mode is refused')
    .requiredOption('--library <file>', 'the library to match against, in the same shape')
    .option('--top <n>', 'length of the confirm list', '3')
    .action(async (file: string, o: { library: string; top: string }) => {
      const top = Number(o.top);
      if (!Number.isInteger(top) || top < 1) { io.err('--top is a whole number of 1 or more.'); code = 1; return; }
      const queries = await matchRows(file, io);
      const library = await matchRows(o.library, io);
      if (queries === undefined || library === undefined) { code = 1; return; }
      const imported = (r: MatchRow): boolean => r.fxiProvenance === 'import' || r.mode === 'import';
      if (queries.some(imported) || library.some(imported)) io.err(`Note: ${CANDIDATE_SEARCH_ONLY}.`);
      // The query's id and the match sit side by side: an auto result names the library entry as its own `id`.
      io.out(json(queries.map((r) => ({ id: r.id, ...(imported(r) ? { use: 'candidate search only' } : {}), match: match(r, library, { top }) }))));
    });

  program.command('review')
    .description('the collision check: an entry whose FXI (or, for equipment, FXE) equals another\'s in the library or in the same file must be confirmed the same, answered apart, or marked as a vocabulary gap')
    .argument('<answers>', 'a JSON list of answers records')
    .option('--library <file>', 'the owner\'s library: records {id, fxi, fxe, sameAs?} or bare FXI and FXE strings')
    .addOption(modeOption())
    .option('--words <file|url>', WORDS_HELP)
    .action(async (file: string, o: { library?: string; mode: Mode; words?: string }) => {
      const flow = await flowFor(o.words);
      const library = o.library === undefined ? [] : readLibrary(await readJson(o.library));
      const { built, failed } = buildAll(entriesOf(await readJson(file), file), o.mode, flow, io);
      const { open, gaps, confirmed } = checkCollisions(built, library, flow);
      for (const c of open) io.out(`collision: ${collisionText(c)}`);
      for (const g of gaps) io.out(`vocabulary gap: ${g.id} equals "${g.with.id}" (${g.value}); the owner says they differ: ${g.differs}`);
      io.out(`collision check: ${open.length} open, ${gaps.length} vocabulary gaps, ${confirmed} confirmed same (library ${library.length} entries, ${built.length} built)`);
      code = failed > 0 ? 1 : open.length > 0 ? 3 : 0;
    });

  program.command('upgrade')
    .description(`rebuild every string from its stored answers record under the rules this encoder implements (${FXI_RULES}), and report every string that changes`)
    .argument('<records>', 'records written by `build`: {id, fxi, fxe, fxeFull?, rules, record}')
    .option('--words <file|url>', WORDS_HELP)
    .option('--write <file>', 'write the upgraded records')
    .option('--check', 'exit 1 when any string would change')
    .action(async (file: string, o: { words?: string; write?: string; check?: boolean }) => {
      const flow = await flowFor(o.words);
      const raw = await readJson(file);
      if (!Array.isArray(raw)) { io.err(`${file}: a JSON list of built records.`); code = 1; return; }
      const r = upgrade(raw as UpgradeInput[], flow);
      for (const c of r.changes) io.out(`${c.id}: ${c.field} changes (rules ${c.fromRules ?? 'unknown'} → ${FXI_RULES})\n  ${c.before ?? '(none)'}\n  ${c.after ?? '(none)'}`);
      for (const k of r.kept) io.out(`${k.id}: ${k.reason}`);
      for (const f of r.failed) io.err(`${f.id}: no longer builds:\n  ${f.problems.join('\n  ')}`);
      io.out(`upgrade to rules ${FXI_RULES}: ${r.records.length} records, ${r.changes.length} strings change, ${r.kept.length} kept as written, ${r.failed.length} failed`);
      if (o.write !== undefined) await writeFile(o.write, `${json(r.records)}\n`);
      code = r.failed.length > 0 || (o.check === true && r.changes.length > 0) ? 1 : 0;
    });

  try {
    await program.parseAsync(['node', 'fds-encoder', ...argv]);
  } catch (e) {
    if (e instanceof CommanderError) return e.exitCode;
    io.err(e instanceof Error ? e.message : String(e));
    return 1;
  }
  return code;
}
