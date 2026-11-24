/**
 * The descriptor steps: proposing an FXI and FXE from answers a source carries, and resolving each record's FXI
 * against a library. Runs the round-trip fixture with no network. The fields go at the top level of the record, where
 * RFC-010 defines them. Release 1.6.0 publishes them, and the transformer validates against the current release, so
 * the validating runs pass with the steps on. Most runs turn validation off to test one step at a time.
 */

import { readFileSync } from 'fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
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

async function config(validate = false): Promise<MappingConfig> {
  const mapping = await ConfigLoader.load(`${FIXTURE}mapping.config.json`);
  return validate ? mapping : { ...mapping, validation: { ...mapping.validation, enabled: false } };
}

/** The fixture's mapping, validating against the first release whose exercise schema has the descriptor fields. */
async function descriptorRelease(): Promise<MappingConfig> {
  const mapping = await config(true);
  return {
    ...mapping,
    targetSchema: { ...mapping.targetSchema, version: '1.6.0' },
    mappings: { ...mapping.mappings, schemaVersion: { from: null, default: '1.2.0' } },
  };
}

async function run(descriptors: DescriptorOptions | undefined, input = withAnswers(), mapping?: MappingConfig): Promise<TransformResult[]> {
  const transformer = new Transformer({ config: mapping ?? (await config()), ...(descriptors ? { descriptors } : {}) });
  return transformer.transformAll(input);
}

const FIELDS = ['fxi', 'fxe', 'fxiProvenance', 'fxiGap', 'xrefs'];

/** A validator for one bundled release's exercise schema, read from the files the build generates. */
const exerciseSchemaOf = (release: string) => {
  const schema = JSON.parse(readFileSync(new URL(`../../src/schemas/bundled/v${release}/exercise.schema.json`, import.meta.url), 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
};
/** The descriptor fields at the top level of a record, or undefined when it has none. */
const descriptorsOf = (r: TransformResult): Record<string, any> | undefined => {
  const data = r.data as Record<string, unknown>;
  const found = Object.fromEntries(FIELDS.filter((f) => f in data).map((f) => [f, data[f]]));
  return Object.keys(found).length > 0 ? found : undefined;
};

beforeEach(() => {
  vi.stubGlobal('fetch', () => {
    throw new Error('a test tried to reach the network');
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('without descriptor steps', () => {
  it('a run is unchanged: no descriptor fields, no outcome, and it validates', async () => {
    const results = await run(undefined, withAnswers(), await config(true));
    expect(results.every((r) => r.success)).toBe(true);
    expect(results.map(descriptorsOf)).toEqual([undefined, undefined, undefined]);
    expect(results.some((r) => 'descriptors' in r)).toBe(false);
  });
});

describe('propose', () => {
  it('writes the strings at the top level of the record, and the answers record into the outcome', async () => {
    const [squat, ...rest] = await run({ propose: { answersFrom: 'fxiAnswers' } });
    expect(squat!.success).toBe(true);
    expect(descriptorsOf(squat!)).toEqual({ fxi: SQUAT, fxe: 'FXE=1.0S/k:imp/f:bar.straight', fxiProvenance: 'import', fxiGap: null });
    expect((squat!.data as Record<string, unknown>).extensions).toBeUndefined();
    expect(squat!.descriptors).toMatchObject({
      id: (squat!.data as Record<string, unknown>).exerciseId,
      proposed: 'import',
      built: { record: { answers: squatAnswers, notes: 'from the source', provenance: 'import', mode: 'import' } },
    });
    expect(squat!.provenance!.fxi).toEqual({ origin: 'source', from: 'fxiAnswers', transform: ['fds-encoder:build'] });
    expect(rest.map(descriptorsOf)).toEqual([undefined, undefined]);
  });

  it('with the step on, the record validates against release 1.6.0, which publishes the fields', async () => {
    const results = await run({ propose: { answersFrom: 'fxiAnswers' } }, withAnswers(), await descriptorRelease());
    expect(results.map((r) => r.errors ?? [])).toEqual([[], [], []]);
    expect(results.every((r) => r.success)).toBe(true);
    expect(descriptorsOf(results[0]!)).toEqual({ fxi: SQUAT, fxe: 'FXE=1.0S/k:imp/f:bar.straight', fxiProvenance: 'import', fxiGap: null });
  });

  it('the same record is refused by release 1.5.0, whose exercise schema does not have the fields', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' } });
    const record = { ...(squat!.data as Record<string, unknown>), schemaVersion: '1.1.0' };
    const before = exerciseSchemaOf('1.5.0');
    expect(before(record)).toBe(false);
    expect(before.errors!.map((e) => e.params)).toContainEqual({ additionalProperty: 'fxi' });
    expect(exerciseSchemaOf('1.6.0')({ ...record, schemaVersion: '1.2.0' })).toBe(true);
  });

  it('marks an agent proposal as agent, and never accepts an owner provenance', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers', provenance: 'agent' } });
    expect(descriptorsOf(squat!)).toMatchObject({ fxiProvenance: 'agent' });
    expect(squat!.descriptors!.built!.record).toMatchObject({ provenance: 'agent' });
    expect(squat!.descriptors!.built!.record.mode).toBeUndefined();
    expect(() => new Transformer({ descriptors: { propose: { answersFrom: 'x', provenance: 'owner' as never } } })).toThrow(/Owner provenance comes only from the owner/);
  });

  it('takes the gap marker from the collision answer "differs" when there is no "gap"', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' } }, withAnswers({ answers: squatAnswers, differs: 'paused at the bottom' }));
    expect(descriptorsOf(squat!)!.fxiGap).toBe('paused at the bottom');
  });

  it('the kept answers record cites the dataset that built it, not the one the source cited', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' } }, withAnswers({ answers: squatAnswers, words: { name: 'some-other-dataset', version: '7' } }));
    expect(squat!.descriptors!.built!.record.words).toBeUndefined();
  });

  it('reads a bare answers object as well as an answers record', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' } }, withAnswers(squatAnswers));
    expect(descriptorsOf(squat!)!.fxi).toBe(SQUAT);
  });

  it('answers that do not build write nothing, and say why', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' } }, withAnswers({ ...squatAnswers, orientation: 'sitting' }));
    expect(squat!.success).toBe(true);
    expect(descriptorsOf(squat!)).toBeUndefined();
    expect(squat!.descriptors!.problems!.join()).toMatch(/orientation: "sitting" is not an option/);
  });

  it('never replaces an FXI the mapping already wrote', async () => {
    const mapping = await config();
    mapping.mappings.fxi = { from: 'ownFxi' };
    const input = withAnswers().map((s, i) => (i === 0 ? { ...s, ownFxi: 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@shoulders' } : s));
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' } }, input, mapping);
    expect(descriptorsOf(squat!)).toEqual({ fxi: 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@shoulders' });
  });
});

describe('the batch path', () => {
  it('runs the same steps', async () => {
    const transformer = new Transformer({ config: await config(), descriptors: { propose: { answersFrom: 'fxiAnswers' } } });
    const { results } = await transformer.transformAllBatch(withAnswers());
    expect(descriptorsOf(results[0]!)!.fxi).toBe(SQUAT);
    expect(results[0]!.descriptors!.proposed).toBe('import');
    expect(descriptorsOf(results[0]!)!.fxiProvenance).toBe('import');
  });
});

describe('resolve', () => {
  const library = [
    { id: 'lib:back-squat', fxi: SQUAT, fxiProvenance: 'owner', fxiGap: null },
    { id: 'lib:front-squat', fxi: 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@shoulders', fxiProvenance: 'owner', fxiGap: null },
  ];

  it('an import proposal never links: the identical entry is offered to a person to confirm', async () => {
    const [squat] = await run({ propose: { answersFrom: 'fxiAnswers' }, resolve: { library, system: 'gym-library' } });
    expect(descriptorsOf(squat!)!.xrefs).toBeUndefined();
    expect(squat!.descriptors!.match).toEqual({
      kind: 'confirm',
      reason: 'query-not-owner',
      why: 'the query has no owner provenance',
      candidates: [{ id: 'lib:back-squat', via: 'fxi', relation: 'identical' }, { id: 'lib:front-squat', via: 'near', layer: 'l' }],
    });
  });

  it('an owner FXI mapped from the source links automatically to the one identical owner entry, in xrefs', async () => {
    const mapping = await config();
    mapping.mappings.fxi = { from: 'ownFxi' };
    mapping.mappings.fxiProvenance = { from: 'ownProvenance' };
    const input = sources().map((s, i) => (i === 0 ? { ...s, ownFxi: SQUAT, ownProvenance: 'owner' } : s));
    const [squat, other] = await run({ resolve: { library, system: 'gym-library' } }, input, mapping);
    expect(squat!.success).toBe(true);
    expect(descriptorsOf(squat!)!.xrefs).toEqual([{ system: 'gym-library', id: 'lib:back-squat', link: 'auto' }]);
    expect(squat!.descriptors!.match).toEqual({ kind: 'auto', id: 'lib:back-squat' });
    expect(squat!.provenance!.xrefs).toEqual({ origin: 'transform', transform: ['fds-encoder:match'] });
    expect(other!.descriptors).toBeUndefined();
  });

  it('a record carrying an automatic link validates against release 1.6.0', async () => {
    const mapping = await descriptorRelease();
    mapping.mappings.fxi = { from: 'ownFxi' };
    mapping.mappings.fxiProvenance = { from: 'ownProvenance' };
    const input = sources().map((s, i) => (i === 0 ? { ...s, ownFxi: SQUAT, ownProvenance: 'owner' } : s));
    const [squat] = await run({ resolve: { library, system: 'gym-library' } }, input, mapping);
    expect(squat!.errors ?? []).toEqual([]);
    expect(squat!.success).toBe(true);
    expect(descriptorsOf(squat!)!.xrefs).toEqual([{ system: 'gym-library', id: 'lib:back-squat', link: 'auto' }]);
  });

  it('owner provenance from a mapping default is written as import, with a warning, and never links', async () => {
    const mapping = await config();
    mapping.mappings.fxi = { from: 'ownFxi' };
    mapping.mappings.fxiProvenance = { from: null, default: 'owner' };
    const input = sources().map((s, i) => (i === 0 ? { ...s, ownFxi: SQUAT } : s));
    const [squat] = await run({ resolve: { library, system: 'gym-library' } }, input, mapping);
    expect(descriptorsOf(squat!)).toEqual({ fxi: SQUAT, fxiProvenance: 'import' });
    expect(squat!.descriptors!.match).toMatchObject({ kind: 'confirm', why: 'the query has no owner provenance' });
    expect(squat!.descriptors!.warnings!.join()).toMatch(/did not come from the source record, so it is written as "import"/);
    expect(squat!.provenance!.fxiProvenance).toEqual({ origin: 'transform', transform: ['fds-encoder:resolve'] });
  });

  it('a library row whose provenance contradicts its mode is refused', () => {
    const bad = [{ id: 'lib:x', fxi: SQUAT, fxiProvenance: 'owner', mode: 'import' }];
    expect(() => new Transformer({ descriptors: { resolve: { library: bad, system: 'gym-library' } } })).toThrow(/row 0 \(lib:x\): fxiProvenance "owner" contradicts mode "import"/);
  });

  it('an import-mode library row never links', async () => {
    const mapping = await config();
    mapping.mappings.fxi = { from: 'ownFxi' };
    mapping.mappings.fxiProvenance = { from: 'ownProvenance' };
    const input = sources().map((s, i) => (i === 0 ? { ...s, ownFxi: SQUAT, ownProvenance: 'owner' } : s));
    const imported = [{ id: 'lib:back-squat', fxi: SQUAT, fxiProvenance: 'import', mode: 'import', fxiGap: null }];
    const [squat] = await run({ resolve: { library: imported, system: 'gym-library' } }, input, mapping);
    expect(squat!.descriptors!.match).toMatchObject({ kind: 'confirm', why: 'the library entry is an import' });
  });

  it('a gap marker refuses the link', async () => {
    const mapping = await config();
    mapping.mappings.fxi = { from: 'ownFxi' };
    mapping.mappings.fxiProvenance = { from: 'ownProvenance' };
    mapping.mappings.fxiGap = { from: 'gap' };
    const input = sources().map((s, i) => (i === 0 ? { ...s, ownFxi: SQUAT, ownProvenance: 'owner', gap: 'paused at the bottom' } : s));
    const [squat] = await run({ resolve: { library, system: 'gym-library' } }, input, mapping);
    expect(descriptorsOf(squat!)!.xrefs).toBeUndefined();
    expect(squat!.descriptors!.match).toMatchObject({ kind: 'confirm', why: 'the query carries a gap marker' });
  });

  it('an empty library name is refused', () => {
    expect(() => new Transformer({ descriptors: { resolve: { library, system: ' ' } } })).toThrow(/names the library/);
  });
});
