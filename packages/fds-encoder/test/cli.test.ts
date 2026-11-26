import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import pkg from '../package.json';
import { runCli } from '../src/cli';
import { exercise } from './helpers';

async function cli(args: string[], lines: string[] = []): Promise<{ code: number; out: string; err: string }> {
  let out = '';
  let err = '';
  const code = await runCli(args, {
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
    expect([mixed.code, mixed.err]).toEqual([1, 'A FXI key and a FXE key do not compare.\n']);
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
});
