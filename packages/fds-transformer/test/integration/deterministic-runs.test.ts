/**
 * The same input gives the same output: ids, timestamps, checkpoint keys,
 * slugs and the plugins a config names.
 *
 * No test here reaches a model. The provider's `complete` is stubbed and
 * `fetch` throws, so a real request would fail the test instead of leaving.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Transformer } from '../../src/core/transformer.js';
import { BatchProcessor } from '../../src/core/batch-processor.js';
import { ConfigLoader } from '../../src/config/config-loader.js';
import { CHECKPOINT_FILENAME } from '../../src/ai/checkpoint-manager.js';
import type { EnrichmentConfig, MappingConfig } from '../../src/core/types.js';

const NAMESPACE = 'e56e0365-0000-4000-8000-000000000001';
const CLOCK = '2026-01-01T00:00:00.000Z';

const sources = (): Record<string, unknown>[] => [
  { v6Id: 'v6-1', name: 'back squat', createdAt: '2020-05-17T21:03:21+00:00' },
  { v6Id: 'v6-2', name: 'bench press' },
  { v6Id: 'v6-3', name: 'deadlift', createdAt: '2021-02-03T04:05:06Z' },
];

const mappingConfig = (overrides: Partial<MappingConfig> = {}): MappingConfig => ({
  version: '1.0.0',
  targetSchema: { version: '1.4.0', entity: 'exercise' },
  mappings: {
    exerciseId: {
      from: null,
      transform: 'uuidv5',
      options: { namespace: NAMESPACE, name: 'exercises_v6/Exercises/{{v6Id}}' },
    },
    'canonical.name': { from: 'name', transform: 'titleCase' },
    'canonical.slug': { from: 'name', transform: 'slugify' },
    'metadata.createdAt': { from: 'createdAt', transform: 'timestamp', options: { clock: CLOCK } },
    'metadata.updatedAt': { from: 'createdAt', transform: 'timestamp', options: { clock: CLOCK } },
  },
  enrichment: { enabled: false },
  validation: { enabled: false },
  ...overrides,
});

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'fds-deterministic-'));
  vi.stubGlobal('fetch', () => {
    throw new Error('a test tried to reach the network');
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  rmSync(workDir, { recursive: true, force: true });
});

describe('a rerun', () => {
  it('produces byte-identical output', async () => {
    const run = async () =>
      JSON.stringify(
        (await new Transformer({ config: mappingConfig() }).transformAll(sources())).map(
          (result) => result.data
        )
      );

    const first = await run();
    const second = await run();

    expect(second).toBe(first);
    const [squat, bench] = JSON.parse(first);
    expect(squat.metadata.createdAt).toBe('2020-05-17T21:03:21.000Z');
    expect(bench.metadata.createdAt).toBe(CLOCK);
  });
});

describe('slug collisions', () => {
  const colliding = () => [
    { v6Id: 'v6-1', name: 'back squat' },
    { v6Id: 'v6-2', name: 'bench press' },
    { v6Id: 'v6-3', name: 'Back Squat' },
  ];
  const message = /"back-squat".*#1, #3/;

  it('fail transformAll', async () => {
    await expect(
      new Transformer({ config: mappingConfig() }).transformAll(colliding())
    ).rejects.toThrow(message);
  });

  it('fail transformAllBatch before any enrichment', async () => {
    await expect(
      new Transformer({ config: mappingConfig() }).transformAllBatch(colliding())
    ).rejects.toThrow(message);
  });

  it('fail the batch processor the CLI runs', async () => {
    const transformer = new Transformer({ config: mappingConfig() });
    await expect(new BatchProcessor(transformer).process(colliding())).rejects.toThrow(message);
  });

  it('leave distinct slugs alone', async () => {
    const results = await new Transformer({ config: mappingConfig() }).transformAll(sources());
    expect(results).toHaveLength(3);
  });
});

describe('config plugins', () => {
  const writePlugin = (file: string, body: string) => {
    const path = join(workDir, file);
    writeFileSync(path, body);
    return path;
  };

  it('are loaded and their transforms are usable', async () => {
    const path = writePlugin(
      'shout.mjs',
      `export default { name: 'shout', version: '1.0.0',
         transforms: { upper: (value) => String(value).toUpperCase() } };`
    );
    const config = mappingConfig({ plugins: [path] });
    config.mappings['canonical.name'] = { from: 'name', transform: 'shout:upper' };

    const [result] = await new Transformer({ config }).transformAll(sources().slice(0, 1));

    expect((result.data as any).canonical.name).toBe('BACK SQUAT');
  });

  it('receive their options when the module exports a factory', async () => {
    const path = writePlugin(
      'prefix.mjs',
      `export default (options) => ({ name: 'prefix', version: '1.0.0',
         transforms: { add: (value) => options.prefix + value } });`
    );
    const config = mappingConfig({ plugins: [{ name: path, options: { prefix: 'v6:' } }] });
    config.mappings['canonical.name'] = { from: 'v6Id', transform: 'prefix:add' };

    const [result] = await new Transformer({ config }).transformAll(sources().slice(0, 1));

    expect((result.data as any).canonical.name).toBe('v6:v6-1');
  });

  it('resolve a relative path against the config file', async () => {
    writePlugin(
      'local.mjs',
      `export default { name: 'local', version: '1.0.0', transforms: { one: () => 1 } };`
    );
    const configPath = join(workDir, 'mapping.json');
    writeFileSync(
      configPath,
      JSON.stringify({ ...mappingConfig(), plugins: ['./local.mjs', { name: './local.mjs' }] })
    );

    const config = await ConfigLoader.load(configPath);

    expect(config.plugins).toEqual([
      join(workDir, 'local.mjs'),
      { name: join(workDir, 'local.mjs') },
    ]);
  });

  it('fail the run when one cannot be loaded', async () => {
    const path = writePlugin('broken.mjs', `export default { name: 'broken' };`);
    await expect(
      new Transformer({ config: mappingConfig({ plugins: [path] }) }).init()
    ).rejects.toThrow(/broken\.mjs/);
  });
});

describe('checkpoint keys', () => {
  const enrichment = (): EnrichmentConfig => ({
    enabled: true,
    provider: 'openrouter',
    apiKey: 'test-key-never-sent',
    tiers: {
      simple: { model: 'test/simple', temperature: 0, maxTokens: 100, batchSize: 1, priority: 'speed' },
      medium: { model: 'test/medium', temperature: 0, maxTokens: 100, batchSize: 1, priority: 'balanced' },
      complex: { model: 'test/complex', temperature: 0, maxTokens: 100, batchSize: 1, priority: 'accuracy' },
    },
    fields: { 'canonical.description': { tier: 'simple', prompt: 'description' } },
    fallback: {
      retries: 0,
      degradeModel: false,
      useDefaults: false,
      degradeChain: { complex: null, medium: null, simple: null },
    },
    checkpoint: { enabled: true, saveInterval: 1 },
  });

  /**
   * One run, with every prompt recorded. A prompt naming an exercise in
   * `failing` throws, so that exercise stays out of the checkpoint.
   */
  const enrichRun = async (input: Record<string, unknown>[], failing: string[] = []) => {
    const transformer = new Transformer({ config: mappingConfig({ enrichment: enrichment() }) });
    await transformer.init();
    const prompts: string[] = [];
    vi.spyOn(transformer.getEnrichmentEngine()!.getProvider()!, 'complete').mockImplementation(
      async (prompt: string) => {
        prompts.push(prompt);
        const exercise = input.find((source) => prompt.includes(`(slug: ${slugOf(source)})`))!;
        if (failing.includes(String(exercise.name))) throw new Error('simulated outage');
        return {
          content: JSON.stringify({
            results: [{ slug: slugOf(exercise), description: `About ${exercise.name}.` }],
          }),
          tokensUsed: 1,
          model: 'test/simple',
        };
      }
    );
    const result = await transformer.transformAllBatch(input, {
      resume: true,
      outputDirectory: workDir,
    });
    return { result, prompts };
  };
  const slugOf = (source: Record<string, unknown>) =>
    String(source.name).toLowerCase().replace(/\s+/g, '-');
  const descriptions = (result: Awaited<ReturnType<typeof enrichRun>>['result']) =>
    result.results.map((r) => (r.data as any)?.canonical?.description);

  it('are a stable id plus an input hash', async () => {
    await enrichRun(sources(), ['deadlift']);

    const checkpoint = JSON.parse(readFileSync(join(workDir, CHECKPOINT_FILENAME), 'utf8'));
    const [squat] = (
      await new Transformer({ config: mappingConfig() }).transformAll(sources())
    ).map((r) => (r.data as any).exerciseId);

    expect(checkpoint.completedIds).toHaveLength(2);
    expect(checkpoint.completedIds[0]).toMatch(new RegExp(`^${squat}@[0-9a-f]{16}$`));
  });

  it('let a resumed run reuse its checkpoint', async () => {
    const first = await enrichRun(sources(), ['deadlift']);
    expect(first.prompts).toHaveLength(3);

    const resumed = await enrichRun(sources());

    expect(resumed.prompts).toHaveLength(1);
    expect(resumed.prompts[0]).toContain('(slug: deadlift)');
    expect(descriptions(resumed.result)).toEqual([
      'About back squat.',
      'About bench press.',
      'About deadlift.',
    ]);
  });

  it('miss when the record changed since the checkpoint', async () => {
    await enrichRun(sources(), ['deadlift']);

    const changed = sources();
    changed[0] = { ...changed[0], name: 'front squat' };
    const resumed = await enrichRun(changed);

    expect(resumed.prompts.map((prompt) => prompt.match(/\(slug: ([\w-]+)\)/)?.[1])).toEqual([
      'front-squat',
      'deadlift',
    ]);
    expect(descriptions(resumed.result)[0]).toBe('About front squat.');
  });
});
