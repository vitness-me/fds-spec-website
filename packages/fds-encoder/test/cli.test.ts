import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import pkg from '../package.json';
import { EventEmitter } from 'node:events';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { main, onOutputError, runCli } from '../src/cli';
import type { CliIo } from '../src/cli';
import { exercise } from './helpers';

async function cli(args: string[], lines: string[] = [], run: (args: string[], io: CliIo) => Promise<number> = runCli): Promise<{ code: number; out: string; err: string }> {
  let out = '';
  let err = '';
  const code = await run(args, {
    out: (t) => { out += t; },
    err: (t) => { err += t; },
    lines: async function* () { yield* lines; },
  });
  return { code, out, err };
}

const dir = mkdtempSync(join(tmpdir(), 'fds-encoder-'));
const file = (name: string, data: unknown): string => {
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(data));
  return path;
};

describe('fds-encoder', () => {
  test('--version prints the package version; no command prints the usage', async () => {
    expect(await cli(['--version'])).toEqual({ code: 0, out: `${pkg.version}\n`, err: '' });
    const none = await cli([]);
    expect(none.code).toBe(1);
    expect(none.out).toContain('fds-encoder check <key>...');
  });

  test('check prints each key in its written form, and fails on one that does not check', async () => {
    const r = await cli(['check', 'FXM=1.0S/biceps-brachii', 'FXI=1.0S/m:el.flex/o:standing/l:none/x:b']);
    expect(r).toEqual({ code: 0, out: 'ok   FXM=1.0/biceps-brachii\nok   FXI=1.0S/m:el.flex/o:standing/l:none\n', err: '' });
    const bad = await cli(['check', 'FXE=1.0S/k:robot']);
    expect(bad.code).toBe(1);
    expect(bad.out).toContain('"robot" is not an FXE kind.');
  });

  test('check --records writes the keys in written form and nothing else', async () => {
    const records = file('records.json', [{ id: 'cat.hamstrings', fxmg: 'FXMG=1.0/thigh.posterior+hamstring', canonical: { name: 'Hamstrings' }, extensions: { x: 1 } }]);
    const out = join(dir, 'out.json');
    const r = await cli(['check', '--records', records, '--write', out]);
    expect(r.code).toBe(0);
    expect(r.out).toContain('record 0 fxmg: written form');
    expect(JSON.parse(readFileSync(out, 'utf8'))).toEqual([{ id: 'cat.hamstrings', fxmg: 'FXMG=1.0/hamstring', canonical: { name: 'Hamstrings' }, extensions: { x: 1 } }]);
  });

  test('compare uses the results of the key pages, and places a muscle in a category', async () => {
    expect((await cli(['compare', 'FXM=1.0/biceps-brachii.long', 'FXM=1.0/biceps-brachii'])).out).toMatch(/^more-specific: A is more specific/);
    expect((await cli(['compare', 'FXMG=1.0/triceps-surae', 'FXMG=1.0/pectoral'])).out).toMatch(/^different/);
    expect((await cli(['compare', 'FXMG=1.0/hamstring', 'FXM=1.0/semitendinosus'])).out).toMatch(/^in /);
    const mixed = await cli(['compare', 'FXI=1.0S/m:el.flex/o:standing/l:none', 'FXE=1.0S/k:none']);
    expect([mixed.code, mixed.err]).toEqual([1, 'An FXI key and an FXE key do not compare.\n']);
  });

  test('build prints the keys of each entry and reports answers that do not build', async () => {
    const answers = file('answers.json', [
      { id: 'curl', answers: exercise({ el: ['flex'] }, 'standing', { load: 'implement', imp1: 'bell.dumb', hold1: 'hands' }) },
      { id: 'broken', answers: { subject: 'usual' } },
    ]);
    const r = await cli(['build', answers]);
    expect(r.code).toBe(1);
    expect(JSON.parse(r.out)).toEqual([{ id: 'curl', fxi: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' }]);
    expect(r.err).toContain('broken:\n  changes: no answer.');
  });

  test('ask walks the questions and prints the keys', async () => {
    const lines = ['1', 'usual', '1', 'usual', 'el', 'flex', 'usual', 'usual', 'standing', 'implement', 'bell.dumb', 'hands', 'usual', ''];
    const out = join(dir, 'asked.json');
    const r = await cli(['ask', '--out', out], lines);
    expect(r.code).toBe(0);
    expect(r.out).toContain('key-1: FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands  FXE=1.0S/k:imp/f:bell.dumb');
    expect(JSON.parse(readFileSync(out, 'utf8'))[0].id).toBe('key-1');
  });

  test('questions prints the flow as text and JSON', async () => {
    const r = await cli(['questions', '--json']);
    const flow = JSON.parse(r.out) as { questions: { id: string }[] };
    expect(flow.questions[0]!.id).toBe('subject');
    expect((await cli(['questions', '--text'])).out).toContain('1. [subject] Are you describing an exercise');
  });

  test('match suggests library records by key', async () => {
    const records = file('q.json', [{ exerciseId: 'q', fxi: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', canonical: { name: 'Biceps curl' } }]);
    const library = file('lib.json', [
      { exerciseId: 'lib.curl', fxi: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', canonical: { name: 'Dumbbell curl' } },
      { id: 'eq.dumbbell', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' },
    ]);
    const r = await cli(['match', records, '--library', library]);
    expect(JSON.parse(r.out)).toEqual([{
      id: 'q', key: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands',
      match: { kind: 'identical', id: 'lib.curl', candidates: [{ id: 'lib.curl', via: 'key', result: 'same' }] },
    }]);
  });

  test('usage errors exit 2', async () => {
    expect((await cli(['compare', 'FXM=1.0/deltoid'])).code).toBe(2);
    expect((await cli(['nope'])).code).toBe(2);
    expect((await cli(['match', 'x.json'])).code).toBe(2);
  });

  test('check --records without a file, or --write without a path, is a usage error', async () => {
    const records = file('usage.json', [{ id: 'm', fxm: 'FXM=1.0/biceps-brachii' }]);
    expect(await cli(['check', '--records'])).toEqual({ code: 2, out: '', err: 'check --records needs a file: --records <file.json>.\n' });
    expect(await cli(['check', '--records', '--write', join(dir, 'w.json')])).toEqual({ code: 2, out: '', err: 'check --records needs a file: --records <file.json>.\n' });
    expect(await cli(['check', '--records', records, '--write'])).toEqual({ code: 2, out: '', err: '--write needs a path: --write <out.json>.\n' });
  });

  test('check --write without --records is a usage error, not a key', async () => {
    const out = join(dir, 'unwritten.json');
    expect(await cli(['check', '--write', out, 'FXM=1.0/deltoid'])).toEqual({ code: 2, out: '', err: '--write needs --records: check --records <file.json> --write <out.json>.\n' });
    expect(existsSync(out)).toBe(false);
  });
});

describe('check --records --write', () => {
  test('changes only the rewritten key strings: numbers, spacing and order stay as written', async () => {
    const text = '{\n  "id": "cat.hamstrings",\n  "big": 12345678901234567890,\n  "ratio": 1.50,\n  "fxmg":   "FXMG=1.0/thigh.posterior+hamstring" ,\n  "canonical": {"name":"Hamstrings"}\n}\n';
    const records = join(dir, 'precise.json');
    writeFileSync(records, text);
    const out = join(dir, 'precise.out.json');
    expect((await cli(['check', '--records', records, '--write', out])).code).toBe(0);
    expect(readFileSync(out, 'utf8')).toBe(text.replace('"FXMG=1.0/thigh.posterior+hamstring"', '"FXMG=1.0/hamstring"'));
  });
  test('a list of records: each key is found by its record, and an unchanged file is written byte for byte', async () => {
    const text = '[ {"id":"a","fxm":"FXM=1.0S/biceps-brachii","n":1e3}, {"id":"b","fxm":"FXM=1.0/biceps-brachii","x":-0.0} ]';
    const records = join(dir, 'list.json');
    writeFileSync(records, text);
    const out = join(dir, 'list.out.json');
    await cli(['check', '--records', records, '--write', out]);
    expect(readFileSync(out, 'utf8')).toBe(text.replace('FXM=1.0S/biceps-brachii', 'FXM=1.0/biceps-brachii'));
    const same = join(dir, 'same.json');
    writeFileSync(same, '{"id":"b",  "fxm":"FXM=1.0/biceps-brachii", "w": 2.000}');
    await cli(['check', '--records', same, '--write', out]);
    expect(readFileSync(out, 'utf8')).toBe('{"id":"b",  "fxm":"FXM=1.0/biceps-brachii", "w": 2.000}');
  });
});

describe('errors', () => {
  test('a file that cannot be read gets one line naming it and what is wrong', async () => {
    expect(await cli(['check', '--records', dir])).toEqual({ code: 1, out: '', err: `${dir}: is a directory, not a file.\n` });
    expect(await cli(['check', '--records', join(dir, 'missing.json')])).toEqual({ code: 1, out: '', err: `${join(dir, 'missing.json')}: no such file.\n` });
    expect(await cli(['build', join(dir, 'missing.json', 'x.json')])).toMatchObject({ code: 1, err: `${join(dir, 'missing.json', 'x.json')}: no such file.\n` });
    const notJson = join(dir, 'not.json');
    writeFileSync(notJson, '{ nope');
    const r = await cli(['build', notJson]);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(new RegExp(`^${notJson.replaceAll('/', '\\/').replaceAll('.', '\\.')} is not valid JSON: .+\n$`));
  });
  test('a file that cannot be written is reported the same way', async () => {
    const records = file('ok.json', [{ id: 'm', fxm: 'FXM=1.0S/biceps-brachii' }]);
    const r = await cli(['check', '--records', records, '--write', dir]);
    expect([r.code, r.err]).toEqual([1, `${dir}: is a directory, not a file.\n`]);
    const slash = await cli(['check', '--records', records, '--write', `${dir}/`]);
    expect([slash.code, slash.err]).toEqual([1, `${dir}/: is a directory, not a file.\n`]);
  });
  test('main prints any other error as one line and exits 1; a closed output pipe exits 0 quietly', async () => {
    const throwing = (e: Error) => async (_: string[], io: CliIo) => main(['--version'], { ...io, out: () => { throw e; } });
    expect(await cli([], [], throwing(new TypeError('boom\n  at somewhere')))).toEqual({ code: 1, out: '', err: 'fds-encoder: boom\n' });
    expect(await cli([], [], throwing(Object.assign(new Error('write EPIPE'), { code: 'EPIPE' })))).toEqual({ code: 0, out: '', err: '' });
  });
  test('an EPIPE on standard output ends the program quietly; another output error is one line and exit 1', () => {
    const codes: number[] = [];
    let err = '';
    const stdout = new EventEmitter();
    stdout.on('error', onOutputError((c) => codes.push(c), (t) => { err += t; }));
    stdout.emit('error', Object.assign(new Error('write EPIPE'), { code: 'EPIPE' }));
    stdout.emit('error', Object.assign(new Error('write EIO'), { code: 'EIO' }));
    expect([codes, err]).toEqual([[0, 1], 'fds-encoder: write EIO\n']);
  });
});

describe('ask', () => {
  test('a rows file that is not a list of rows, or an answers file that is not a list of entries, is one clear line', async () => {
    const rows = file('bad-rows.json', { id: 'x' });
    expect(await cli(['ask', rows])).toEqual({ code: 1, out: '', err: `${rows}: The rows file must hold a list of rows.\n` });
    const unnamed = file('unnamed-rows.json', [{ id: 'x' }]);
    expect((await cli(['ask', unnamed])).err).toBe(`${unnamed}: row 1 (x): needs a non-empty string "name".\n`);
    const answers = file('bad-answers.json', [{ answers: {} }]);
    expect(await cli(['ask', '--out', answers])).toEqual({ code: 1, out: '', err: `${answers} holds no answers file: it holds a list of entries, each with a string "id".\n` });
  });
  test('at the end of input, ask says the row in progress was not saved, and exits 1', async () => {
    const out = join(dir, 'ended.json');
    const r = await cli(['ask', '--out', out], ['1', 'usual']);
    expect(r.code).toBe(1);
    expect(r.out).toContain(`The input ended before row key-1 was finished: its answers were not saved. Nothing was saved to ${out}.`);
    expect(r.out).not.toContain('The rows finished before it');
    expect(existsSync(out)).toBe(false);
    expect((await cli(['ask'], ['1'])).out).toContain('Nothing was saved: run with --out <answers.json> to keep answers.');
  });
  test('at the end of input after a finished row, ask says the finished rows are in the answers file', async () => {
    const rows = file('two-rows.json', [{ id: 'a', name: 'Curl' }, { id: 'b', name: 'Press' }]);
    const out = join(dir, 'ended-later.json');
    const lines = ['1', 'usual', '1', 'usual', 'el', 'flex', 'usual', 'usual', 'standing', 'implement', 'bell.dumb', 'hands', 'usual', '', '1'];
    const r = await cli(['ask', rows, '--out', out], lines);
    expect(r.code).toBe(1);
    expect(r.out).toContain(`The input ended before row b was finished: its answers were not saved. The rows finished before it are in ${out}.`);
    expect(JSON.parse(readFileSync(out, 'utf8')).map((e: { id: string }) => e.id)).toEqual(['a']);
  });
  test('ask --out writes the answers file whole, through a temporary file it then removes', async () => {
    const sub = join(dir, 'atomic');
    mkdirSync(sub);
    const out = join(sub, 'answers.json');
    writeFileSync(out, '[]');
    const lines = ['1', 'usual', '1', 'usual', 'el', 'flex', 'usual', 'usual', 'standing', 'implement', 'bell.dumb', 'hands', 'usual', ''];
    expect((await cli(['ask', '--out', out], lines)).code).toBe(0);
    expect(JSON.parse(readFileSync(out, 'utf8'))[0].id).toBe('key-1');
    expect(readdirSync(sub)).toEqual(['answers.json']);
  });
});

