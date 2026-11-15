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
import { buildProvenanceSidecar } from '../../src/core/provenance.js';
import { requestedOnly } from '../support/requested-reply.js';
import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const validateSidecar = (() => {
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  return ajv.compile(
    JSON.parse(
      readFileSync(
        join(
          dirname(fileURLToPath(import.meta.url)),
          '../../../../specification/schemas/transformer/provenance/v1.1.0/provenance.schema.json'
        ),
        'utf8'
      )
    )
  );
})();

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
    async (prompt: string, options) => {
      prompts.push(prompt);
      // Answer as the structured-output endpoint would: only the requested keys
      return {
        content: requestedOnly(JSON.stringify(reply(prompt)), options),
        tokensUsed: 1,
        model: 'stub/served',
      };
    }
  );
  return { transformer, prompts };
}

const slugOf = (prompt: string) => prompt.match(/slug: ([\w-]+)/)![1];

beforeEach(() => {
  // The engine reads its key only from OPENROUTER_API_KEY; the provider is stubbed.
  vi.stubEnv('OPENROUTER_API_KEY', 'stub-key-not-used');
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
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

  it('rejects a default a named path inherits from, or holds beneath it', async () => {
    const run = async (mappings: MappingConfig['mappings'], rejectDefaults: string[]) =>
      new Transformer({
        config: config({ mappings, validation: { enabled: false, rejectDefaults } }),
      }).transform({});

    const inherited = await run(
      { classification: { from: null, default: { level: 'beginner' } } },
      ['classification.level']
    );
    const beneath = await run(
      { 'classification.level': { from: null, default: 'beginner' } },
      ['classification']
    );
    const elsewhere = await run(
      { classification: { from: null, default: { force: 'push' } } },
      ['classification.level']
    );

    expect(inherited.success).toBe(false);
    expect(inherited.errors?.map((e) => e.field)).toEqual(['classification.level']);
    expect(beneath.success).toBe(false);
    // The default object holds no level, so no default stands in for one.
    expect(elsewhere.success).toBe(true);
  });

  it('rejects defaults on array-index paths the same way', async () => {
    const run = async (mappings: MappingConfig['mappings'], rejectDefaults: string[]) =>
      new Transformer({
        config: config({ mappings, validation: { enabled: false, rejectDefaults } }),
      }).transform({});

    const own = await run({ 'media[0].url': { from: null, default: 'https://x' } }, ['media[0].url']);
    const inherited = await run(
      { media: { from: null, default: [{ url: 'https://x' }] } },
      ['media[0].url']
    );
    const beneath = await run({ 'media[0].url': { from: null, default: 'https://x' } }, ['media']);

    expect([own.success, inherited.success, beneath.success]).toEqual([false, false, false]);
  });

  it('keeps provenance true when mappings overlap', async () => {
    const overwritten = await new Transformer({
      config: config({
        mappings: {
          'classification.level': { from: null, default: 'beginner' },
          classification: { from: 'classification' },
        },
        validation: { enabled: false, rejectDefaults: ['classification.level'] },
      }),
    }).transform({ classification: { level: 'advanced' } });

    // The later mapping replaced the default; nothing records it any more.
    expect(overwritten.data).toMatchObject({ classification: { level: 'advanced' } });
    expect(overwritten.provenance).toEqual({
      classification: { origin: 'source', from: 'classification' },
    });
    expect(overwritten.success).toBe(true);

    const replacedArray = await new Transformer({
      config: config({
        mappings: {
          'media[0].url': { from: null, default: 'https://x' },
          media: { from: 'media' },
        },
      }),
    }).transform({ media: [{ url: 'https://y' }] });

    expect(replacedArray.provenance).toEqual({ media: { origin: 'source', from: 'media' } });

    const unwritable = await new Transformer({
      config: config({
        mappings: {
          classification: { from: null, default: null },
          'classification.level': { from: 'level' },
        },
      }),
    }).transform({ level: 'advanced' });

    // A null parent leaves nowhere to write the level, so it has no origin.
    expect((unwritable.data as any).classification).toBeNull();
    expect(unwritable.provenance).toEqual({ classification: { origin: 'default' } });
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
      provider: 'openrouter',
      model: 'stub/served',
      prompt: 'classification-simple',
      promptVersion: expect.stringMatching(PROMPT_VERSION),
      tier: 'simple',
      confidence: 0.9,
    });
    // A gap the mapping left ('') and the model filled is the model's now.
    expect(provenance['canonical.description']).toEqual({
      origin: 'model',
      provider: 'openrouter',
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
    // A sidecar holding model entries is valid under the published schema.
    const sidecar = buildProvenanceSidecar(results);
    expect(validateSidecar(sidecar), JSON.stringify(validateSidecar.errors)).toBe(true);
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

  it('records the single-model path with the confidence the model reports', async () => {
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
            },
      }),
    });
    await transformer.init();
    const completeJSON = vi
      .spyOn(transformer.getEnrichmentEngine()!.getProvider()!, 'completeJSON')
      .mockResolvedValue({
        description: 'A squat.',
        confidence: { 'canonical.description': 0.93 },
      });

    const result = await transformer.transform({ name: 'Squat' });

    expect(result.provenance!['canonical.description']).toEqual({
      origin: 'model',
      provider: 'openrouter',
      model: 'stub/single',
      prompt: 'comprehensive',
      promptVersion: expect.stringMatching(PROMPT_VERSION),
      confidence: 0.93,
    });
    expect(completeJSON.mock.calls[0][0]).toContain('"confidence"');
  });

  it('writes an array reply on the per-field fallback as an array', async () => {
    const transformer = new Transformer({
      config: config({
        mappings: {
          'canonical.name': { from: 'name' },
          'canonical.aliases': { from: 'aliases', enrichment: { enabled: true, prompt: 'aliases' } },
        },
        enrichment: { enabled: true, provider: 'openrouter', model: 'stub/single' },
      }),
    });
    await transformer.init();
    vi.spyOn(transformer.getEnrichmentEngine()!.getProvider()!, 'completeJSON')
      .mockRejectedValueOnce(new Error('comprehensive failed'))
      .mockResolvedValueOnce(['Back squat', 'High-bar squat']);

    const result = await transformer.transform({ name: 'Squat' });

    expect((result.data as any).canonical.aliases).toEqual(['Back squat', 'High-bar squat']);
    expect(result.provenance!['canonical.aliases']).toMatchObject({ origin: 'model', confidence: null });
  });

  it('reads confidence on the per-field fallback and does not write it as data', async () => {
    const transformer = new Transformer({
      config: config({
        mappings: {
          'canonical.name': { from: 'name' },
          'canonical.description': {
            from: 'description',
            enrichment: { enabled: true, prompt: 'description' },
          },
        },
        enrichment: { enabled: true, provider: 'openrouter', model: 'stub/single' },
      }),
    });
    await transformer.init();
    const completeJSON = vi
      .spyOn(transformer.getEnrichmentEngine()!.getProvider()!, 'completeJSON')
      // The comprehensive call fails, so each field is asked on its own.
      .mockRejectedValueOnce(new Error('comprehensive failed'))
      .mockResolvedValueOnce({ text: 'A squat.', confidence: 0.6 });

    const result = await transformer.transform({ name: 'Squat' });

    expect((result.data as any).canonical.description).toEqual({ text: 'A squat.' });
    expect(result.provenance!['canonical.description']).toMatchObject({
      origin: 'model',
      prompt: 'description',
      confidence: 0.6,
    });
    expect(completeJSON.mock.calls[1][0]).toContain('"confidence"');
  });
});
