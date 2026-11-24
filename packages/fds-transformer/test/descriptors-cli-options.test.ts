import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { descriptorOptionsFrom, descriptorReport } from '../src/descriptors/cli-options.js';

const dir = mkdtempSync(join(tmpdir(), 'fds-descriptor-flags-'));
const file = (name: string, data: unknown): string => { const p = join(dir, name); writeFileSync(p, JSON.stringify(data)); return p; };
const FXI = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back';

describe('descriptor flags', () => {
  it('no flags, no steps', async () => {
    expect(await descriptorOptionsFrom({})).toBeUndefined();
  });

  it('--fxi-answers proposes as import unless --fxi-provenance says agent; owner is refused', async () => {
    expect(await descriptorOptionsFrom({ fxiAnswers: 'fxi' })).toEqual({ propose: { answersFrom: 'fxi', provenance: 'import' } });
    expect((await descriptorOptionsFrom({ fxiAnswers: 'fxi', fxiProvenance: 'agent' }))!.propose!.provenance).toBe('agent');
    await expect(descriptorOptionsFrom({ fxiAnswers: 'fxi', fxiProvenance: 'owner' })).rejects.toThrow(/import or agent/);
  });

  it('--resolve-library reads the library rows that carry an FXI, named by the file unless --resolve-system says', async () => {
    const lib = file('gym-library.json', [{ id: 'a', fxi: FXI, fxiProvenance: 'owner' }, { id: 'b' }]);
    expect(await descriptorOptionsFrom({ resolveLibrary: lib })).toEqual({ resolve: { library: [{ id: 'a', fxi: FXI, fxiProvenance: 'owner' }], system: 'gym-library' } });
    expect((await descriptorOptionsFrom({ resolveLibrary: lib, resolveSystem: 'gym' }))!.resolve!.system).toBe('gym');
    await expect(descriptorOptionsFrom({ resolveLibrary: file('bad.json', { rows: [] }) })).rejects.toThrow(/a library is a JSON list/);
  });

  it('a flag that applies to neither step is refused rather than ignored', async () => {
    await expect(descriptorOptionsFrom({ words: 'w.json' })).rejects.toThrow(/apply to --fxi-answers or --resolve-library/);
    await expect(descriptorOptionsFrom({ resolveLibrary: file('l.json', []), words: 'w.json' })).rejects.toThrow(/--words applies to --fxi-answers/);
  });

  it('--words loads and checks a movement-word dataset', async () => {
    await expect(descriptorOptionsFrom({ fxiAnswers: 'fxi', words: file('w.json', { name: 'w', version: '1', words: [{ id: 'Bad' }] }) })).rejects.toThrow(/not a movement-word dataset/);
  });
});

describe('descriptor report', () => {
  it('counts each outcome and lists every record a step acted on', () => {
    const report = descriptorReport([
      { descriptors: { id: 'a', proposed: 'import', match: { kind: 'confirm', reason: 'no-identical', why: 'no identical entry', candidates: [] } } },
      { descriptors: { id: 'b', problems: ['orientation: no answer.'] } },
      { descriptors: { id: 'c', match: { kind: 'auto', id: 'lib:c' } } },
      {},
    ]);
    expect(report.summary).toEqual({ proposed: 1, notBuilt: 1, auto: 1, confirm: 1, absent: 0 });
    expect(report.records.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});
