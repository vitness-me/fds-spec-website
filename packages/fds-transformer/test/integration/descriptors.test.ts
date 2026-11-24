/**
 * The descriptor steps: proposing an FXI and FXE from answers a source carries, and resolving each record's FXI
 * against a library. Runs the round-trip fixture, which validates against the bundled schema with no network.
 */

import { readFileSync } from 'fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Transformer } from '../../src/core/transformer.js';
import { ConfigLoader } from '../../src/config/config-loader.js';
import type { DescriptorOptions } from '../../src/descriptors/descriptor-steps.js';
import type { MappingConfig, TransformResult } from '../../src/core/types.js';

const FIXTURE = new URL('../../fixtures/roundtrip/', import.meta.url).pathname;
const sources = (): Record<string, unknown>[] => JSON.parse(readFileSync(`${FIXTURE}source.json`, 'utf8'));

const SQUAT = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back';
/** A back squat described joint by joint, as an answers record a source catalogue could carry. */
const squatAnswers = {
  subject: 'usual', movement: 'other', changes: ['usual'], 'motion.phases': '1', 'p1.kind': 'usual', 'p1.joints': ['hip', 'kn'],
  'p1.hip': ['ext'], 'p1.kn': ['ext'], 'p1.short': ['usual'], 'p1.also': 'usual', orientation: 'standing', load: 'implement',
  imp1: 'bb', hold1: 'back', symmetry: 'b',
};
/** The first fixture record carries answers; the others carry none. */
const withAnswers = (answers: unknown = { answers: squatAnswers, notes: 'from the source' }): Record<string, unknown>[] =>
  sources().map((s, i) => (i === 0 ? { ...s, fxiAnswers: answers } : s));

async function config(): Promise<MappingConfig> {
  return ConfigLoader.load(`${FIXTURE}mapping.config.json`);
}

async function run(descriptors: DescriptorOptions | undefined, input = withAnswers(), mapping?: MappingConfig): Promise<TransformResult[]> {
  const transformer = new Transformer({ config: mapping ?? (await config()), ...(descriptors ? { descriptors } : {}) });
  return transformer.transformAll(input);
}

const descriptorsOf = (r: TransformResult) => ((r.data as Record<string, any>).extensions ?? {}).descriptors;

beforeEach(() => {
  vi.stubGlobal('fetch', () => {
    throw new Error('a test tried to reach the network');
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('without descriptor steps', () => {
  it('a run is unchanged: no descriptor fields and no outcome', async () => {
    const results = await run(undefined);
    expect(results.every((r) => r.success)).toBe(true);
    expect(results.map(descriptorsOf)).toEqual([undefined, undefined, undefined]);
    expect(results.some((r) => 'descriptors' in r)).toBe(false);
  });
});

describe('propose', () => {
  it('builds the strings from the source answers, keeps the answers record beside them, and still validates', async () => {
    const [squat, ...rest] = await run({ propose: { answersFrom: 'fxiAnswers' } });
    expect(squat!.success).toBe(true);
    expect(squat!.errors).toEqual([]);
    expect(descriptorsOf(squat!)).toMatchObject({
      fxi: SQUAT,
      fxe: 'FXE=1.0S/k:imp/f:bar.straight',
      fxiProvenance: 'import',
      fxiGap: null,
      record: { answers: squatAnswers, notes: 'from the source', provenance: 'import', mode: 'import' },
    });
    expect(squat!.descriptors).toEqual({ id: (squat!.data as Record<string, unknown>).exerciseId, proposed: 'import' });
    expect(squat!.provenance!['extensions.descriptors.fxi']).toEqual({ origin: 'source', from: 'fxiAnswers', transform: ['fds-encoder:build'] });
    expect(rest.map(descriptorsOf)).toEqual([undefined, undefined]);
  });

  it('marks an agent proposal as agent, and never accepts an owner provenance', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers', provenance: 'agent' } });
    expect(descriptorsOf(squat!)).toMatchObject({ fxiProvenance: 'agent', record: { provenance: 'agent' } });
    expect(descriptorsOf(squat!).record.mode).toBeUndefined();
    expect(() => new Transformer({ descriptors: { propose: { answersFrom: 'x', provenance: 'owner' as never } } })).toThrow(/Owner provenance comes only from the owner/);
  });

  it('reads a bare answers object as well as an answers record', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' } }, withAnswers(squatAnswers));
    expect(descriptorsOf(squat!).fxi).toBe(SQUAT);
  });

  it('answers that do not build write nothing, and say why', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' } }, withAnswers({ ...squatAnswers, orientation: 'sitting' }));
    expect(squat!.success).toBe(true);
    expect(descriptorsOf(squat!)).toBeUndefined();
    expect(squat!.descriptors!.problems!.join()).toMatch(/orientation: "sitting" is not an option/);
  });

  it('never replaces an FXI the mapping already wrote', async () => {
    const mapping = await config();
    mapping.mappings['extensions.descriptors.fxi'] = { from: 'ownFxi' };
    const input = withAnswers().map((s, i) => (i === 0 ? { ...s, ownFxi: 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@shoulders' } : s));
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' } }, input, mapping);
    expect(descriptorsOf(squat!)).toEqual({ fxi: 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@shoulders' });
  });
});

describe('the batch path', () => {
  it('runs the same steps', async () => {
    const transformer = new Transformer({ config: await config(), descriptors: { propose: { answersFrom: 'fxiAnswers' } } });
    const { results } = await transformer.transformAllBatch(withAnswers());
    expect(descriptorsOf(results[0]!).fxi).toBe(SQUAT);
    expect(results[0]!.descriptors!.proposed).toBe('import');
  });
});

describe('resolve', () => {
  const library = [
    { id: 'lib:back-squat', fxi: SQUAT, fxiProvenance: 'owner', fxiGap: null },
    { id: 'lib:front-squat', fxi: 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@shoulders', fxiProvenance: 'owner', fxiGap: null },
  ];

  it('an import proposal never links: the identical entry is offered to a person to confirm', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' }, resolve: { library, system: 'gym-library' } });
    expect(descriptorsOf(squat!).xrefs).toBeUndefined();
    expect(squat!.descriptors!.match).toEqual({
      kind: 'confirm',
      why: 'the query has no owner provenance',
      candidates: [{ id: 'lib:back-squat', via: 'fxi', relation: 'identical' }, { id: 'lib:front-squat', via: 'near', layer: 'l' }],
    });
  });

  it('an owner FXI mapped from the source links automatically to the one identical owner entry, in xrefs', async () => {
    const mapping = await config();
    mapping.mappings['extensions.descriptors.fxi'] = { from: 'ownFxi' };
    mapping.mappings['extensions.descriptors.fxiProvenance'] = { from: null, default: 'owner' };
    const input = sources().map((s, i) => (i === 0 ? { ...s, ownFxi: SQUAT } : s));
    const [squat, other] = await run({ resolve: { library, system: 'gym-library' } }, input, mapping);
    expect(squat!.success).toBe(true);
    expect(descriptorsOf(squat!).xrefs).toEqual([{ system: 'gym-library', id: 'lib:back-squat', link: 'auto' }]);
    expect(squat!.descriptors!.match).toEqual({ kind: 'auto', id: 'lib:back-squat' });
    expect(squat!.provenance!['extensions.descriptors.xrefs']).toEqual({ origin: 'transform', transform: ['fds-encoder:match'] });
    expect(other!.descriptors).toBeUndefined();
  });

  it('a gap marker refuses the link', async () => {
    const mapping = await config();
    mapping.mappings['extensions.descriptors.fxi'] = { from: 'ownFxi' };
    mapping.mappings['extensions.descriptors.fxiProvenance'] = { from: null, default: 'owner' };
    mapping.mappings['extensions.descriptors.fxiGap'] = { from: 'gap' };
    const input = sources().map((s, i) => (i === 0 ? { ...s, ownFxi: SQUAT, gap: 'paused at the bottom' } : s));
    const [squat] = await run({ resolve: { library, system: 'gym-library' } }, input, mapping);
    expect(descriptorsOf(squat!).xrefs).toBeUndefined();
    expect(squat!.descriptors!.match).toMatchObject({ kind: 'confirm', why: 'the query carries a gap marker' });
  });

  it('an empty library name is refused', () => {
    expect(() => new Transformer({ descriptors: { resolve: { library, system: ' ' } } })).toThrow(/names the library/);
  });
});
