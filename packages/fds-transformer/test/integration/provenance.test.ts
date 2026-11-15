/**
 * Every written value carries its origin.
 *
 * Each field path a transform writes gets a provenance entry: the source path
 * it was read from, the default that stood in for an empty source, the
 * transform that generated it, or the model, prompt version and confidence
 * behind an enriched value. No real model is called: a stub provider answers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Transformer } from '../../src/core/transformer.js';
import type { EnrichmentConfig, MappingConfig } from '../../src/core/types.js';
import { SYSTEM_PROMPTS } from '../../src/ai/prompts/tier-prompts.js';

const PROMPT_VERSION = /^sha256:[0-9a-f]{16}$/;

const TIERS: EnrichmentConfig['tiers'] = {
  simple: { model: 'stub/simple', temperature: 0, maxTokens: 100, batchSize: 1, priority: 'speed' },
  medium: { model: 'stub/medium', temperature: 0, maxTokens: 100, batchSize: 1, priority: 'balanced' },
  complex: { model: 'stub/complex', temperature: 0, maxTokens: 100, batchSize: 1, priority: 'accuracy' },
};

function config(overrides: Partial<MappingConfig> = {}): MappingConfig {
  return {
    version: '1.0.0',
    targetSchema: { version: '1.4.0', entity: 'exercise' },
    mappings: {
      exerciseId: { from: 'id' },
      'canonical.name': { from: 'name' },
      'canonical.slug': { from: 'slug' },
    },
    validation: { enabled: false },
    enrichment: { enabled: false },
    ...overrides,
  };
}

function tieredConfig(fields: EnrichmentConfig['fields'], mappings: MappingConfig['mappings'] = {}) {
  const base = config();
  return config({
    mappings: { ...base.mappings, ...mappings },
    enrichment: {
      enabled: true,
      provider: 'openrouter',
      apiKey: 'stub-key-not-used',
      tiers: TIERS,
      fields,
    },
  });
}

/** Stub the provider; `reply` builds the content for each call from its user prompt. */
async function stubbed(cfg: MappingConfig, reply: (prompt: string) => unknown) {
  const transformer = new Transformer({ config: cfg });
  await transformer.init();
  const prompts: string[] = [];
  vi.spyOn(transformer.getEnrichmentEngine()!.getProvider()!, 'complete').mockImplementation(
    async (prompt: string) => {
      prompts.push(prompt);
      return { content: JSON.stringify(reply(prompt)), tokensUsed: 1, model: 'stub/served' };
    }
  );
  return { transformer, prompts };
}

const slugOf = (prompt: string) => prompt.match(/slug: ([\w-]+)/)![1];

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Provenance of mapped values', () => {
  it('reports source, default and generated values as what they are', async () => {
    const transformer = new Transformer({
      config: config({
        mappings: {
          exerciseId: { from: null, transform: 'uuid' },
          'canonical.name': { from: 'name', transform: 'titleCase' },
          'canonical.slug': { from: ['slugA', 'slugB'] },
          'classification.level': { from: 'level', default: 'beginner' },
          'classification.force': { from: 'force', default: 'push' },
          'metadata.status': { from: null, default: 'draft' },
          'classification.mechanics': { from: 'mechanics' },
        },
      }),
    });

    const result = await transformer.transform({
      name: 'barbell squat',
      slugB: 'barbell-squat',
      level: 'advanced',
      force: '',
    });

    expect(result.provenance).toEqual({
      exerciseId: { origin: 'transform', transform: ['uuid'] },
      'canonical.name': { origin: 'source', from: 'name', transform: ['titleCase'] },
      'canonical.slug': { origin: 'source', from: 'slugB' },
      'classification.level': { origin: 'source', from: 'level' },
      'classification.force': { origin: 'default' },
      'metadata.status': { origin: 'default' },
    });
  });

  it('fails a record whose rejected path holds a mapping default', async () => {
    const transformer = new Transformer({
      config: config({
        mappings: {
          'canonical.name': { from: 'name' },
          'classification.level': { from: 'level', default: 'intermediate' },
          'metadata.status': { from: null, default: 'review' },
        },
        validation: { enabled: false, rejectDefaults: ['classification.level'] },
      }),
    });

    const defaulted = await transformer.transform({ name: 'Squat' });
    const sourced = await transformer.transform({ name: 'Squat', level: 'beginner' });

    expect(defaulted.success).toBe(false);
    expect(defaulted.errors).toContainEqual(
      expect.objectContaining({ field: 'classification.level' })
    );
    // metadata.status is a default too, but not a rejected path.
    expect(defaulted.errors?.map((e) => e.field)).toEqual(['classification.level']);
    expect(sourced.success).toBe(true);
  });

  it('rejects defaults in the batch path too', async () => {
    const transformer = new Transformer({
      config: config({
        mappings: {
          'canonical.name': { from: 'name' },
          'classification.level': { from: 'level', default: 'intermediate' },
        },
        validation: { enabled: false, rejectDefaults: ['classification.level'] },
      }),
    });

    const { results } = await transformer.transformAllBatch([
      { name: 'Squat' },
      { name: 'Lunge', level: 'beginner' },
    ]);

    expect(results.map((r) => r.success)).toEqual([false, true]);
  });
});

describe('Provenance of enriched values', () => {
  it('records model, prompt, prompt version, tier and confidence per written field', async () => {
    const { transformer, prompts } = await stubbed(
      tieredConfig(
        {
          'classification.exerciseType': { tier: 'simple', prompt: 'classification-simple' },
          'canonical.description': { tier: 'simple', prompt: 'description' },
        },
        {
          'classification.level': { from: 'level' },
          'canonical.description': { from: 'description', enrichment: { when: 'empty' } },
        }
      ),
      (prompt) => ({
        results: [
          {
            slug: slugOf(prompt),
            exerciseType: 'strength',
            level: 'advanced',
            description: 'A squat.',
            confidence: { exerciseType: 0.9, level: 0.4, description: 1.7 },
          },
        ],
      })
    );

    const { results } = await transformer.transformAllBatch([
      { id: 'squat', slug: 'squat', name: 'Squat', level: 'beginner', description: '' },
    ]);
    const provenance = results[0].provenance!;

    expect(provenance['classification.exerciseType']).toEqual({
      origin: 'model',
      model: 'stub/served',
      prompt: 'classification-simple',
      promptVersion: expect.stringMatching(PROMPT_VERSION),
      tier: 'simple',
      confidence: 0.9,
    });
    // A gap the mapping left ('') and the model filled is the model's now.
    expect(provenance['canonical.description']).toEqual({
      origin: 'model',
      model: 'stub/served',
      prompt: 'description',
      promptVersion: expect.stringMatching(PROMPT_VERSION),
      tier: 'simple',
      // Outside 0..1, so not a confidence.
      confidence: null,
    });
    expect(provenance['canonical.description'].promptVersion).not.toBe(
      provenance['classification.exerciseType'].promptVersion
    );
    // The mapped level was not touched, and keeps its origin.
    expect(provenance['classification.level']).toEqual({ origin: 'source', from: 'level' });
    // Every prompt asks for a confidence.
    expect(prompts.every((p) => p.includes('"confidence"'))).toBe(true);
  });

  it('records the tier and model that answered when a tier degrades', async () => {
    const transformer = new Transformer({
      config: tieredConfig({ 'classification.movement': { tier: 'complex', prompt: 'biomechanics' } }),
    });
    await transformer.init();
    vi.spyOn(transformer.getEnrichmentEngine()!.getProvider()!, 'complete').mockImplementation(
      async (_prompt, options) => {
        if (options?.systemPrompt === SYSTEM_PROMPTS.complex) throw new Error('complex tier down');
        return {
          content: JSON.stringify({ movement: 'squat', confidence: { movement: 0.7 } }),
          tokensUsed: 1,
          model: 'stub/medium-served',
        };
      }
    );

    const { results } = await transformer.transformAllBatch([{ id: 'sq', slug: 'sq', name: 'Squat' }]);

    expect(results[0].provenance!['classification.movement']).toMatchObject({
      origin: 'model',
      model: 'stub/medium-served',
      prompt: 'biomechanics',
      tier: 'medium',
      confidence: 0.7,
    });
  });

  it('gives the same prompt the same version on every record and every run', async () => {
    const run = async () => {
      const { transformer } = await stubbed(
        tieredConfig({ 'canonical.aliases': { tier: 'simple', prompt: 'aliases' } }),
        (prompt) => ({ results: [{ slug: slugOf(prompt), aliases: ['x'] }] })
      );
      const { results } = await transformer.transformAllBatch([
        { id: 'a', slug: 'a', name: 'A' },
        { id: 'b', slug: 'b', name: 'B' },
      ]);
      return results.map((r) => r.provenance!['canonical.aliases']);
    };

    const [first, second] = [await run(), await run()];
    expect(first[0]).toEqual(first[1]);
    expect(first).toEqual(second);
    expect(first[0].confidence).toBeNull();
  });

  it('keeps provenance for values resumed from a checkpoint', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fds-provenance-'));
    try {
      const cfg = tieredConfig({ 'canonical.description': { tier: 'simple', prompt: 'description' } });
      cfg.enrichment!.checkpoint = { enabled: true, saveInterval: 1 };
      cfg.enrichment!.fallback = {
        retries: 0,
        degradeModel: false,
        useDefaults: false,
        degradeChain: { complex: null, medium: null, simple: null },
      };
      const sources = [
        { id: 'squat', slug: 'squat', name: 'Squat' },
        { id: 'lunge', slug: 'lunge', name: 'Lunge' },
      ];
      const answer = (prompt: string) => ({
        results: [{ slug: slugOf(prompt), description: 'Done.', confidence: { description: 0.8 } }],
      });

      // First run: lunge fails, so the checkpoint is kept.
      const first = await stubbed(cfg, (prompt) => {
        if (slugOf(prompt) === 'lunge') throw new Error('provider down');
        return answer(prompt);
      });
      const firstRun = await first.transformer.transformAllBatch(sources, { outputDirectory: dir });
      const squatFirst = firstRun.results[0].provenance!['canonical.description'];
      expect(squatFirst).toMatchObject({ origin: 'model', confidence: 0.8 });

      // Resume: squat comes from the checkpoint, with no call for it.
      const second = await stubbed(cfg, answer);
      const resumed = await second.transformer.transformAllBatch(sources, {
        outputDirectory: dir,
        resume: true,
      });

      expect(second.prompts.map(slugOf)).toEqual(['lunge']);
      expect(resumed.results[0].provenance!['canonical.description']).toEqual(squatFirst);
      expect(resumed.results[1].provenance!['canonical.description']).toMatchObject({
        origin: 'model',
        confidence: 0.8,
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('records the single-model path as model output with no reported confidence', async () => {
    const transformer = new Transformer({
      config: config({
        mappings: {
          'canonical.name': { from: 'name' },
          'canonical.description': { from: 'description', enrichment: { enabled: true } },
        },
        enrichment: {
          enabled: true,
          provider: 'openrouter',
          model: 'stub/single',
          apiKey: 'stub-key-not-used',
        },
      }),
    });
    await transformer.init();
    vi.spyOn(transformer.getEnrichmentEngine()!.getProvider()!, 'completeJSON').mockResolvedValue({
      description: 'A squat.',
    });

    const result = await transformer.transform({ name: 'Squat' });

    expect(result.provenance!['canonical.description']).toEqual({
      origin: 'model',
      model: 'stub/single',
      prompt: 'comprehensive',
      promptVersion: expect.stringMatching(PROMPT_VERSION),
      confidence: null,
    });
  });
});
