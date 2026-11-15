/**
 * The guarantees every enrichment provider gives, run against each one.
 *
 * OpenRouter answers from a local HTTP stub; Claude Code answers from a
 * stubbed `claude` executable. Nothing here calls a real endpoint, CLI or model.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnrichmentEngine, type ExerciseInput } from '../../src/ai/enrichment-engine.js';
import type { EnrichmentConfig, ModelProvenance, TierConfig } from '../../src/core/types.js';
import { testMuscles } from '../fixtures/registries.js';
import { exerciseTarget } from '../support/exercise-target.js';
import { OpenRouterStub, completion, fixture } from '../support/openrouter-stub.js';
import * as cli from '../support/claude-stub.js';

/** One provider behind a stub, driven through provider-neutral replies. */
interface Harness {
  readonly provider: 'openrouter' | 'claude-code';
  /** The model each call asks for, given the tier's configured model */
  askedModel(tierModel: string): string;
  start(): Promise<void>;
  stop(): Promise<void>;
  config(fields: EnrichmentConfig['fields']): EnrichmentConfig;
  /** A reply whose content is `value`, served by `model` */
  answer(value: unknown, model: string): void;
  /** A reply whose content is `text`, which need not be JSON */
  text(text: string): void;
  refuse(): void;
  cutOff(): void;
  fail(): void;
  /** The request schema each call sent */
  sentSchemas(): Array<Record<string, any>>;
}

const tier = (model: string, batchSize: number): TierConfig => ({
  model,
  temperature: 0,
  maxTokens: 800,
  batchSize,
  priority: 'balanced',
});

const shared = (fields: EnrichmentConfig['fields']): EnrichmentConfig => ({
  enabled: true,
  tiers: {
    simple: tier('test/simple-model', 10),
    medium: tier('test/medium-model', 10),
    complex: tier('test/complex-model', 1),
  },
  fields,
  fallback: { retries: 0, degradeModel: false, useDefaults: false, degradeChain: { complex: 'medium', medium: 'simple', simple: null } },
  rateLimit: { requestsPerMinute: 6000, backoffStrategy: 'exponential', initialBackoffMs: 1, maxBackoffMs: 1 },
  checkpoint: { enabled: false, saveInterval: 1 },
});

function openRouter(): Harness {
  let stub: OpenRouterStub;
  return {
    provider: 'openrouter',
    askedModel: (tierModel) => tierModel,
    async start() {
      stub = await new OpenRouterStub().start();
      vi.stubEnv('OPENROUTER_API_KEY', 'env-key-for-stub');
    },
    stop: () => stub.stop(),
    config: (fields) => ({
      ...shared(fields),
      provider: 'openrouter',
      baseUrl: stub.baseUrl,
      options: { maxRetries: 1, retryDelay: 1 },
    }),
    answer: (value, model) => void stub.reply(completion(value, { model })),
    text: (text) => void stub.reply(completion(text)),
    refuse: () => void stub.reply(fixture('refusal')),
    cutOff: () => void stub.reply(fixture('length')),
    fail: () => void stub.reply({ status: 500, body: { error: { code: 500, message: 'down' } } }),
    sentSchemas: () => stub.requests.map((r) => r.response_format.json_schema.schema),
  };
}

function claudeCode(): Harness {
  let stub: cli.ClaudeStub;
  return {
    provider: 'claude-code',
    // Every enrichment call is a writer call
    askedModel: () => 'claude-opus-5-5',
    async start() {
      stub = new cli.ClaudeStub().start();
    },
    async stop() {
      stub.stop();
    },
    config: (fields) => ({
      ...shared(fields),
      provider: 'claude-code',
      claudeCode: { command: stub.command },
    }),
    answer: (value, model) => void stub.reply(cli.structured(value, model)),
    text: (text) => void stub.reply(cli.cliResult({ result: text })),
    refuse: () => void stub.reply(cli.refusal()),
    cutOff: () => void stub.reply(cli.maxTokens()),
    fail: () => void stub.reply(cli.apiError()),
    sentSchemas: () => stub.calls.map((call) => JSON.parse(cli.flagValue(call, '--json-schema')!)),
  };
}

const exercises: ExerciseInput[] = [
  { id: 'ex-1', slug: 'barbell-bench-press', name: 'Barbell Bench Press' },
  { id: 'ex-2', slug: 'push-up', name: 'Push Up' },
];

const descriptionOnly: EnrichmentConfig['fields'] = {
  'canonical.description': { tier: 'simple', prompt: 'description' },
};

const validDescriptions = {
  results: [
    { slug: 'barbell-bench-press', description: 'Press a barbell from the chest.', confidence: { description: 0.9 } },
    { slug: 'push-up', description: 'Lower the chest to the floor and press up.', confidence: { description: null } },
  ],
};

describe.each([openRouter(), claudeCode()])('$provider provider', (harness) => {
  beforeEach(async () => {
    await harness.start();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    await harness.stop();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const run = (fields: EnrichmentConfig['fields'], batch = exercises) =>
    new EnrichmentEngine(harness.config(fields)).enrichBatch(batch, { target: exerciseTarget });

  it('sends the request schema for the configured fields and the batch, and writes a valid reply', async () => {
    harness.answer(validDescriptions, 'served/model');

    const result = await run(descriptionOnly);

    const [schema] = harness.sentSchemas();
    const item = schema.properties.results.items;
    expect(item.properties.slug.enum).toEqual(['barbell-bench-press', 'push-up']);
    expect(Object.keys(item.properties).sort()).toEqual(['confidence', 'description', 'slug']);
    expect(item.additionalProperties).toBe(false);
    expect(result.results.get('ex-1')).toEqual({ canonical: { description: 'Press a barbell from the chest.' } });
    expect(result.abstentions).toEqual([]);
  });

  it('records the provider, the served model, the prompt version and the confidence', async () => {
    harness.answer(validDescriptions, 'served/model');

    const result = await run(descriptionOnly);

    const first = result.provenance.get('ex-1')!['canonical.description'] as ModelProvenance;
    expect(first).toEqual({
      origin: 'model',
      provider: harness.provider,
      model: 'served/model',
      prompt: 'description',
      promptVersion: expect.stringMatching(/^sha256:[0-9a-f]{16}$/),
      tier: 'simple',
      confidence: 0.9,
    });
    expect((result.provenance.get('ex-2')!['canonical.description'] as ModelProvenance).confidence).toBeNull();
    expect(result.calls).toMatchObject([
      { tier: 'simple', model: harness.askedModel('test/simple-model'), servedModel: 'served/model', outcome: 'ok' },
    ]);
  });

  it('records a refusal as an abstention for every exercise in the call, and writes nothing', async () => {
    harness.refuse();

    const result = await run(descriptionOnly);

    expect(result.results.size).toBe(0);
    expect(result.failedIds).toEqual([]);
    expect(result.abstentions.map((a) => [a.exerciseId, a.reason])).toEqual([
      ['ex-1', 'refusal'],
      ['ex-2', 'refusal'],
    ]);
    expect(result.abstentions[0]).toMatchObject({ model: harness.askedModel('test/simple-model') });
    expect(harness.sentSchemas()).toHaveLength(1);
  });

  it('records a reply cut off at the token limit as an abstention, and writes nothing', async () => {
    harness.cutOff();
    const result = await run(descriptionOnly);
    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['length', 'length']);
  });

  it('records a reply that fails the schema as an abstention, and writes none of it', async () => {
    harness.answer(
      {
        results: [
          { slug: 'barbell-bench-press', description: 'Press a barbell.', level: 'intermediate' },
          { slug: 'push-up', description: 'Press up.' },
        ],
      },
      'served/model'
    );
    const result = await run(descriptionOnly);
    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['invalid', 'invalid']);
  });

  it('records a reply that is not JSON as an abstention', async () => {
    harness.text('Sure! Here is the description you asked for.');
    const result = await run(descriptionOnly);
    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['invalid', 'invalid']);
  });

  it('reports an error as a failure of the call, and writes nothing', async () => {
    harness.fail();
    const result = await run(descriptionOnly);
    expect(result.results.size).toBe(0);
    expect(result.abstentions).toEqual([]);
    expect(result.failedIds).toEqual(['ex-1', 'ex-2']);
  });

  it('asks only for the gaps, and writes only them', async () => {
    const fields: EnrichmentConfig['fields'] = {
      'classification.exerciseType': { tier: 'simple', prompt: 'classification-simple' },
      'classification.level': { tier: 'simple', prompt: 'classification-simple' },
    };
    harness.answer(
      {
        results: [
          { slug: 'barbell-bench-press', exerciseType: 'strength', level: null },
          { slug: 'push-up', exerciseType: null, level: 'beginner' },
        ],
      },
      'served/model'
    );

    const result = await run(fields, [
      { ...exercises[0], fieldsToEnrich: ['classification.exerciseType'] },
      { ...exercises[1], fieldsToEnrich: ['classification.level'] },
    ]);

    expect(Object.keys(harness.sentSchemas()[0].properties.results.items.properties).sort()).toEqual([
      'confidence',
      'exerciseType',
      'level',
      'slug',
    ]);
    expect(result.results.get('ex-1')).toEqual({ classification: { exerciseType: 'strength' } });
    expect(result.results.get('ex-2')).toEqual({ classification: { level: 'beginner' } });
    expect(Object.keys(result.provenance.get('ex-1')!)).toEqual(['classification.exerciseType']);
  });

  it('writes a registry reference as the registry entry, never as the model wrote it', async () => {
    harness.answer({ secondary: ['deltoids'] }, 'served/model');

    const result = await run({ 'targets.secondary': { tier: 'complex', prompt: 'biomechanics' } }, [exercises[0]]);

    const deltoids = testMuscles.find((m) => m.canonical.slug === 'deltoids')!;
    expect(harness.sentSchemas()[0].properties.secondary.anyOf[0].items.enum).toContain('deltoids');
    expect(result.results.get('ex-1')).toEqual({
      targets: {
        secondary: [
          { id: deltoids.id, name: deltoids.canonical.name, slug: 'deltoids', categoryId: deltoids.classification.categoryId },
        ],
      },
    });
  });

  it('records a value outside the schema as an abstention, not a write', async () => {
    harness.answer({ secondary: ['anterior-deltoid'] }, 'served/model');
    const result = await run({ 'targets.secondary': { tier: 'complex', prompt: 'biomechanics' } }, [exercises[0]]);
    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['invalid']);
  });
});
