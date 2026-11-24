import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { FXI_RULES } from '../src/alphabet.js';
import { run } from '../src/cli.js';
import { ex, fixture } from './support.js';

interface Ran { code: number; out: string; err: string }

async function cli(args: string[], lines: string[] = []): Promise<Ran> {
  const out: string[] = [];
  const err: string[] = [];
  const code = await run(args, {
    out: (t) => out.push(t), err: (t) => err.push(t), prompt: () => {},
    lines: async function* () { yield* lines; },
  }, '9.9.9');
  return { code, out: out.join('\n'), err: err.join('\n') };
}

const dir = mkdtempSync(join(tmpdir(), 'fds-encoder-cli-'));
const file = (name: string, data: unknown): string => { const p = join(dir, name); writeFileSync(p, JSON.stringify(data)); return p; };
const WORDS = fixture('words.json');
const SQUAT = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back';
const squatBy = (movement: 'squat' | 'other') => (movement === 'squat'
  ? ex('squat', [], { load: 'implement', imp1: 'bb', hold1: 'usual' })
  : ex('other', [], {
    'motion.phases': '1', 'p1.kind': 'usual', 'p1.joints': ['hip', 'kn'], 'p1.hip': ['ext'], 'p1.kn': ['ext'], 'p1.short': ['usual'], 'p1.also': 'usual',
    orientation: 'standing', load: 'implement', imp1: 'bb', hold1: 'back', symmetry: 'b',
  }));

describe('validate', () => {
  test('prints the canonical form of FXI, FXE and FXM strings, and fails on a bad one', async () => {
    const r = await cli(['validate', 'FXI=1.0/l:bb@back/o:standing/m:kn.ext+hip.ext', 'FXE=1.0/k:mac/l:foot', 'FXM=1.0S/any-muscle', 'FXI=1/m:x']);
    expect(r.out.split('\n').slice(0, 6)).toEqual([
      `ok   ${SQUAT}`, '     canonicalised from FXI=1.0/l:bb@back/o:standing/m:kn.ext+hip.ext: write the canonical form',
      'ok   FXE=1.0S/k:mac/l:foot/s:?/m:?', '     canonicalised from FXE=1.0/k:mac/l:foot: write the canonical form',
      'ok   FXM=1.0/any-muscle', '     canonicalised from FXM=1.0S/any-muscle: write the canonical form',
    ]);
    expect(r.out).toContain('bad  FXI=1/m:x');
    expect(r.code).toBe(1);
  });

  test('a string already canonical is printed once, with no note', async () => {
    const r = await cli(['validate', SQUAT]);
    expect(r.out).toBe(`ok   ${SQUAT}`);
    expect(r.code).toBe(0);
  });

  test('checks an FXM against a provider vocabulary only when one is given', async () => {
    expect((await cli(['validate', 'FXM=1.0/not-listed'])).code).toBe(0);
    const r = await cli(['validate', '--muscles', fixture('muscles.json'), 'FXM=1.0/not-listed', 'FXM=1.0/g:hamstrings']);
    expect(r.out).toContain('There is no muscle "not-listed"');
    expect(r.out).toContain('ok   FXM=1.0/g:hamstrings');
    expect(r.code).toBe(1);
  });

  test('checks a rows file and writes its canonical rows', async () => {
    const rows = file('rows.json', [{ id: 'r1', fxi: 'FXI=1.0/m:el.flex/o:standing/l:db@hands', fxe: 'FXE=1.0S/k:imp/f:bell.dumb', confidence: 'high' }, { id: 'r2', confidence: 'high' }]);
    const written = join(dir, 'rows.out.json');
    const r = await cli(['validate', '--rows', rows, '--write', written]);
    expect(r.out).toContain('row 0 (r1): fxi canonicalised');
    expect(r.out).toContain('2 rows, 1 with errors, 1 strings canonicalised');
    expect(r.code).toBe(1);
    expect(JSON.parse(readFileSync(written, 'utf8'))[0].fxi).toBe('FXI=1.0S/m:el.flex/o:standing/l:db@hands');
  });
});

describe('compare', () => {
  test('prints the relation and each layer', async () => {
    const r = await cli(['compare', SQUAT, 'FXI=1.0S/m:hip.ext+kn.ext/o:*/l:bb@back']);
    expect(r.out).toMatch(/^refines \{"m":"equal","o":"narrower"/);
    expect((await cli(['compare', SQUAT, 'FXE=1.0S/k:none'])).code).toBe(1);
  });

  test('an invalid comparison says why', async () => {
    const bad = await cli(['compare', SQUAT, 'FXI=1.0S/m:hip.ext/o:standing/l:db']);
    expect(bad.out).toBe('invalid\n  b: Every implement needs a hold point; write @? if it is unknown.');
    expect(bad.code).toBe(1);
    const kinds = await cli(['compare', SQUAT, 'FXE=1.0S/k:none']);
    expect(kinds.out).toBe('invalid\n  compare takes two FXIs or two FXEs; these are of different kinds');
  });
});

describe('build and upgrade', () => {
  test('build writes each string with the answers record it came from and the rules it was built under', async () => {
    const answers = file('answers.json', [{ id: 'back-squat', answers: squatBy('squat') }, { id: 'joint-by-joint', answers: squatBy('other') }]);
    const r = await cli(['build', answers, '--words', WORDS]);
    expect(r.code).toBe(0);
    const built = JSON.parse(r.out) as Record<string, unknown>[];
    expect(built.map((b) => b.fxi)).toEqual([SQUAT, SQUAT]);
    expect(built[0]).toMatchObject({ id: 'back-squat', fxe: 'FXE=1.0S/k:imp/f:bar.straight', fxiProvenance: 'owner', fxiGap: null, mode: 'owner', rules: FXI_RULES });
    expect(built[0]!.record).toEqual({ id: 'back-squat', answers: squatBy('squat'), words: { name: 'vitness-test-words', version: '1' } });
    expect(built[1]!.record).toEqual({ id: 'joint-by-joint', answers: squatBy('other') });
  });

  test('build cites the dataset that built the strings, whatever the answers record cited, so upgrade works with it', async () => {
    const answers = file('answers-cited.json', [
      { id: 'back-squat', answers: squatBy('squat'), words: { name: 'some-other-dataset', version: '7' } },
      { id: 'joint-by-joint', answers: squatBy('other'), words: { name: 'some-other-dataset', version: '7' } },
    ]);
    const built = JSON.parse((await cli(['build', answers, '--words', WORDS])).out) as { record: Record<string, unknown> }[];
    expect(built[0]!.record.words).toEqual({ name: 'vitness-test-words', version: '1' });
    expect(built[1]!.record.words).toBeUndefined();
    const up = await cli(['upgrade', file('built-cited.json', built), '--words', WORDS, '--check']);
    expect(up.code).toBe(0);
    expect(up.out).toContain('0 strings change, 0 kept as written, 0 failed');
  });

  test('build without a dataset still encodes through "other", and names what a word needs', async () => {
    const answers = file('answers-nowords.json', [{ id: 'a', answers: squatBy('other') }, { id: 'b', answers: squatBy('squat') }]);
    const r = await cli(['build', answers]);
    expect(JSON.parse(r.out).map((b: { id: string }) => b.id)).toEqual(['a']);
    expect(r.err).toMatch(/movement: "squat" is not an option/);
    expect(r.code).toBe(1);
  });

  test('import mode is labelled candidate search only, and writes provenance import', async () => {
    const answers = file('answers-import.json', [{ id: 'a', answers: squatBy('other') }]);
    const r = await cli(['build', answers, '--mode', 'import']);
    expect(r.err).toContain('candidate search only');
    expect(JSON.parse(r.out)[0]).toMatchObject({ mode: 'import', fxiProvenance: 'import' });
    expect((await cli(['build', '--help'])).out).toContain('candidate search only');
  });

  test('upgrade reports every string that changes, and --check fails on any', async () => {
    const answers = file('answers-up.json', [{ id: 'back-squat', answers: squatBy('squat') }]);
    const built = JSON.parse((await cli(['build', answers, '--words', WORDS])).out) as Record<string, unknown>[];
    const records = file('built.json', [{ ...built[0], fxi: 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@shoulders', rules: '1.2' }]);
    const written = join(dir, 'upgraded.json');
    const r = await cli(['upgrade', records, '--words', WORDS, '--write', written, '--check']);
    expect(r.out).toContain('back-squat: fxi changes (rules 1.2 → ');
    expect(r.out).toContain(`upgrade to rules ${FXI_RULES}: 1 records, 1 strings change, 0 kept as written, 0 failed`);
    expect(r.code).toBe(1);
    expect(JSON.parse(readFileSync(written, 'utf8'))[0]).toMatchObject({ fxi: SQUAT, rules: FXI_RULES });
    const clean = await cli(['upgrade', written, '--words', WORDS, '--check']);
    expect(clean.code).toBe(0);
    expect(clean.out).toContain('0 strings change');
  });

  test('a movement-word dataset that does not meet the format is refused with every fault', async () => {
    const bad = file('bad-words.json', { name: 'x', version: '1', words: [{ id: 'Squat', label: 'S', group: 'g', fxi: 'm:hip.ext/o:sitting' }], questions: {} });
    const r = await cli(['build', file('a.json', []), '--words', bad]);
    expect(r.err).toContain('"id" is lowercase kebab-case');
    expect(r.err).toContain('"sitting" is not an orientation');
    expect(r.code).toBe(1);
  });
});

describe('match', () => {
  const row = (id: string, fxi: string, extra: Record<string, unknown> = {}) => ({ id, fxi, fxiProvenance: 'owner', fxiGap: null, ...extra });
  test('auto on a unique identical owner FXI; confirm otherwise, labelled for import rows', async () => {
    const library = file('library.json', [row('lib:squat', SQUAT), row('lib:front', 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@shoulders')]);
    const rows = file('queries.json', [row('q1', SQUAT), row('q2', SQUAT, { fxiProvenance: 'import' })]);
    const r = await cli(['match', rows, '--library', library]);
    expect(JSON.parse(r.out)).toEqual([
      { id: 'q1', match: { kind: 'auto', id: 'lib:squat' } },
      { id: 'q2', use: 'candidate search only', match: { kind: 'confirm', why: 'the query has no owner provenance', candidates: [{ id: 'lib:squat', via: 'fxi', relation: 'identical' }, { id: 'lib:front', via: 'near', layer: 'l' }] } },
    ]);
    expect(r.err).toContain('candidate search only');
  });

  test('an import-mode row never links, whatever its provenance, and a gap of true blocks auto', async () => {
    const library = file('library-gap.json', [row('lib:squat', SQUAT)]);
    const rows = file('queries-gap.json', [row('q1', SQUAT, { fxiGap: true }), row('q2', SQUAT, { mode: 'import', fxiProvenance: 'import' })]);
    const r = await cli(['match', rows, '--library', library]);
    expect(JSON.parse(r.out).map((m: { match: { why?: string } }) => m.match.why)).toEqual(['the query carries a gap marker', 'the query is an import']);
  });

  test('a row whose provenance contradicts its mode is refused, in the queries or the library', async () => {
    const library = file('library-bad.json', [row('lib:squat', SQUAT, { mode: 'import' })]);
    const rows = file('queries-ok.json', [row('q1', SQUAT)]);
    const r = await cli(['match', rows, '--library', library]);
    expect(r.code).toBe(1);
    expect(r.out).toBe('');
    expect(r.err).toContain('row 0 (lib:squat): fxiProvenance "owner" contradicts mode "import"');
  });
});

describe('review', () => {
  test('an FXI equal to a library entry is an open collision until settled', async () => {
    const answers = file('review.json', [{ id: 'new-squat', answers: squatBy('other') }]);
    const library = file('review-lib.json', [{ id: 'lib:squat', fxi: SQUAT }]);
    const r = await cli(['review', answers, '--library', library]);
    expect(r.out).toContain('new-squat: its FXI equals library entry "lib:squat"');
    expect(r.code).toBe(3);
    const settled = file('review-same.json', [{ id: 'new-squat', answers: squatBy('other'), sameAs: 'lib:squat' }]);
    expect((await cli(['review', settled, '--library', library])).code).toBe(0);
  });
});

describe('questions and ask', () => {
  test('questions --json prints the flow with the dataset\'s words in it', async () => {
    const without = JSON.parse((await cli(['questions', '--json'])).out) as { questions: { id: string; options: { id: string }[] }[] };
    const movement = (f: typeof without) => f.questions.find((q) => q.id === 'movement')!.options.map((o) => o.id);
    expect(movement(without)).toEqual(['other', 'unknown']);
    const withWords = JSON.parse((await cli(['questions', '--json', '--words', WORDS])).out) as typeof without;
    expect(movement(withWords)).toContain('squat');
    expect(withWords.questions.map((q) => q.id)).toContain('word.knee');
  });

  test('a dataset can be read from a URL; a URL that fails says so', async () => {
    const server = createServer((req, res) => {
      if (req.url === '/words.json') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(readFileSync(WORDS)); }
      else { res.writeHead(404); res.end(); }
    });
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const flow = JSON.parse((await cli(['questions', '--json', '--words', `${base}/words.json`])).out) as { questions: { id: string }[] };
      expect(flow.questions.map((q) => q.id)).toContain('word.knee');
      const missing = await cli(['questions', '--words', `${base}/nothing.json`]);
      expect(missing.err).toBe(`${base}/nothing.json: HTTP 404 Not Found`);
      expect(missing.code).toBe(1);
    } finally {
      server.close();
    }
  });

  test('ask saves the answers records build reads', async () => {
    const rows = file('ask-rows.json', [{ id: 'back-squat', name: 'Back squat' }]);
    const out = join(dir, 'ask-answers.json');
    const r = await cli(['ask', rows, '--out', out, '--words', WORDS], ['1', 'squat', 'usual', 'implement', 'bb', 'usual', '']);
    expect(r.out).toContain('All 1 rows are answered');
    const built = await cli(['build', out, '--words', WORDS]);
    expect(JSON.parse(built.out)[0].fxi).toBe(SQUAT);
  });

  test('the version is the package\'s', async () => {
    expect((await cli(['--version'])).out).toBe('9.9.9');
  });
});
