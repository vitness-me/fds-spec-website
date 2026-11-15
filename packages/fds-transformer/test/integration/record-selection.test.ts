/**
 * A run limited to chosen records, so enrichment can go in small batches a
 * curator reviews one at a time. The model is a stubbed `claude` executable.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Transformer } from '../../src/core/transformer.js';
import type { EnrichmentConfig, MappingConfig } from '../../src/core/types.js';
import { ClaudeStub, structured, flagValue } from '../support/claude-stub.js';

const NAMESPACE = 'e56e0365-0000-4000-8000-000000000001';

const sources = (): Record<string, unknown>[] => [
  { v6Id: 'v6-1', name: 'back squat' },
  { v6Id: 'v6-2', name: 'bench press' },
  { v6Id: 'v6-3', name: 'deadlift' },
  { v6Id: 'v6-4', name: 'push up' },
];

const config = (enrichment: EnrichmentConfig = { enabled: false }): MappingConfig => ({
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
  },
  enrichment,
  validation: { enabled: false },
});

const slugsOf = (results: Array<{ data?: unknown }>) =>
  results.map((r) => (r.data as { canonical: { slug: string } }).canonical.slug);

async function idsBySlug(): Promise<Record<string, string>> {
  const { results } = await new Transformer({ config: config() }).transformAllBatch(sources());
  return Object.fromEntries(
    results.map((r) => {
      const data = r.data as { exerciseId: string; canonical: { slug: string } };
      return [data.canonical.slug, data.exerciseId];
    })
  );
}

describe('transformAllBatch record selection', () => {
  it('transforms and returns only the records whose ids are listed, in input order', async () => {
    const ids = await idsBySlug();

    const result = await new Transformer({ config: config() }).transformAllBatch(sources(), {
      ids: [ids['push-up'], ids['bench-press']],
    });

    expect(slugsOf(result.results)).toEqual(['bench-press', 'push-up']);
    expect(result.stats.total).toBe(2);
    expect(result.stats.success).toBe(2);
  });

  it('also matches a record by its slug', async () => {
    const result = await new Transformer({ config: config() }).transformAllBatch(sources(), { ids: ['deadlift'] });
    expect(slugsOf(result.results)).toEqual(['deadlift']);
  });

  it('takes at most maxRecords, the first in input order', async () => {
    const result = await new Transformer({ config: config() }).transformAllBatch(sources(), { maxRecords: 2 });
    expect(slugsOf(result.results)).toEqual(['back-squat', 'bench-press']);
    expect(result.stats.total).toBe(2);
  });

  it('applies maxRecords to the listed ids', async () => {
    const result = await new Transformer({ config: config() }).transformAllBatch(sources(), {
      ids: ['push-up', 'deadlift', 'bench-press'],
      maxRecords: 2,
    });
    expect(slugsOf(result.results)).toEqual(['bench-press', 'deadlift']);
  });

  it('refuses an id that names no record, before anything runs', async () => {
    await expect(
      new Transformer({ config: config() }).transformAllBatch(sources(), { ids: ['deadlift', 'no-such-exercise'] })
    ).rejects.toThrow(/not in the input: no-such-exercise/);
  });

  it.each([0, -1, 1.5])('refuses maxRecords %s', async (maxRecords) => {
    await expect(
      new Transformer({ config: config() }).transformAllBatch(sources(), { maxRecords })
    ).rejects.toThrow(/maxRecords must be a positive whole number/);
  });

  describe('with enrichment', () => {
    let stub: ClaudeStub;
    beforeEach(() => {
      stub = new ClaudeStub().start();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      stub.stop();
      vi.restoreAllMocks();
    });

    it('asks the model about the selected records only', async () => {
      stub.reply(
        structured({
          results: [
            { slug: 'bench-press', description: 'Press a bar from the chest.' },
            { slug: 'push-up', description: 'Press the body up from the floor.' },
          ],
        })
      );
      const tier = { model: 'unused', temperature: 0, maxTokens: 100, batchSize: 25, priority: 'balanced' as const };
      const transformer = new Transformer({
        config: config({
          enabled: true,
          provider: 'claude-code',
          claudeCode: { command: stub.command },
          tiers: { simple: tier, medium: tier, complex: { ...tier, batchSize: 1 } },
          fields: { 'canonical.description': { tier: 'simple', prompt: 'description' } },
          checkpoint: { enabled: false, saveInterval: 1 },
        }),
      });

      const result = await transformer.transformAllBatch(sources(), { ids: ['push-up', 'bench-press'] });

      expect(stub.calls).toHaveLength(1);
      const schema = JSON.parse(flagValue(stub.calls[0], '--json-schema')!);
      expect(schema.properties.results.items.properties.slug.enum).toEqual(['bench-press', 'push-up']);
      expect(result.results.map((r) => (r.data as any).canonical.description)).toEqual([
        'Press a bar from the chest.',
        'Press the body up from the floor.',
      ]);
      expect(result.results[0].provenance?.['canonical.description']).toMatchObject({
        origin: 'model',
        provider: 'claude-code',
        model: 'claude-opus-5-5',
      });
    });
  });
});
