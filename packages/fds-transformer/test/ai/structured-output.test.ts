/**
 * Structured output on OpenRouter, end to end against a local stub endpoint.
 *
 * Every reply comes from `test/fixtures/openrouter` or is built in the test and
 * served from 127.0.0.1. Nothing here calls OpenRouter or a model.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenRouterProvider, OpenRouterAPIError } from '../../src/ai/providers/openrouter.js';
import { EnrichmentEngine, type ExerciseInput } from '../../src/ai/enrichment-engine.js';
import { getTierPrompts } from '../../src/ai/prompts/tier-prompts.js';
import { replyKey } from '../../src/ai/response-schema.js';
import { ConfigLoader } from '../../src/config/config-loader.js';
import type { EnrichmentConfig, TierConfig } from '../../src/core/types.js';
import { OpenRouterStub, fixture, completion } from '../support/openrouter-stub.js';

const exercises: ExerciseInput[] = [
  { id: 'ex-1', slug: 'barbell-bench-press', name: 'Barbell Bench Press' },
  { id: 'ex-2', slug: 'push-up', name: 'Push Up' },
];

const tier = (model: string, batchSize: number): TierConfig => ({
  model,
  temperature: 0,
  maxTokens: 800,
  batchSize,
  priority: 'balanced',
});

function engineConfig(stub: OpenRouterStub, fields: EnrichmentConfig['fields']): EnrichmentConfig {
  return {
    enabled: true,
    provider: 'openrouter',
    model: 'configured/default-model',
    baseUrl: stub.baseUrl,
    options: { maxRetries: 1, retryDelay: 1 },
    tiers: {
      simple: tier('test/simple-model', 10),
      medium: tier('test/medium-model', 10),
      complex: tier('test/complex-model', 1),
    },
    fields,
    fallback: {
      retries: 0,
      degradeModel: true,
      useDefaults: false,
      degradeChain: { complex: 'medium', medium: 'simple', simple: null },
    },
    rateLimit: { requestsPerMinute: 6000, backoffStrategy: 'exponential', initialBackoffMs: 1, maxBackoffMs: 1 },
    checkpoint: { enabled: false, saveInterval: 1 },
  };
}

const descriptionOnly: EnrichmentConfig['fields'] = {
  'canonical.description': { tier: 'simple', prompt: 'description' },
};

let stub: OpenRouterStub;

beforeEach(async () => {
  stub = await new OpenRouterStub().start();
  vi.stubEnv('OPENROUTER_API_KEY', 'env-key-for-stub');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
  await stub.stop();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('OpenRouterProvider structured output', () => {
  const provider = () =>
    new OpenRouterProvider({ apiKey: 'k', baseUrl: stub.baseUrl, model: 'provider/default', maxRetries: 3, retryDelay: 1 });

  it('sends the schema as response_format json_schema and requires endpoints that support it', async () => {
    stub.reply(fixture('valid-description'));
    const schema = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'], additionalProperties: false };

    await provider().complete('prompt', { responseSchema: { name: 'description', schema, strict: true } });

    expect(stub.requests[0].response_format).toEqual({
      type: 'json_schema',
      json_schema: { name: 'description', strict: true, schema },
    });
    expect(stub.requests[0].provider).toEqual({ require_parameters: true });
  });

  it('sends no response_format when no schema is given', async () => {
    stub.reply(fixture('valid-description'));
    await provider().complete('prompt');
    expect(stub.requests[0]).not.toHaveProperty('response_format');
  });

  it('uses a per-call model without changing the provider model', async () => {
    stub.reply(fixture('valid-description'), fixture('valid-description'));
    const p = provider();

    await p.complete('prompt', { model: 'per/call-model' });
    await p.complete('prompt');

    expect(stub.requests.map((r) => r.model)).toEqual(['per/call-model', 'provider/default']);
    expect(p.getModel()).toBe('provider/default');
  });

  it('reports finish reason, served model, token usage and cost', async () => {
    stub.reply(fixture('valid-description'));
    const response = await provider().complete('prompt');

    expect(response.finishReason).toBe('stop');
    expect(response.model).toBe('anthropic/claude-haiku-4.5');
    expect(response.usage).toEqual({ promptTokens: 412, completionTokens: 58, totalTokens: 470, cost: 0.000702 });
    expect(response.tokensUsed).toBe(470);
  });

  it('returns a refusal the model gives as its output', async () => {
    stub.reply(fixture('refusal'));
    const response = await provider().complete('prompt');

    expect(response.finishReason).toBe('content_filter');
    expect(response.refusal).toBe("I can't help with that request.");
    expect(response.content).toBe('');
  });

  it('returns a refusal reported as a 403 error, without retrying it', async () => {
    stub.reply(fixture('refusal-403'), fixture('valid-description'));
    const response = await provider().complete('prompt');

    expect(response.finishReason).toBe('content_filter');
    expect(response.refusal).toBe('The model refused to respond to this request.');
    expect(stub.requests).toHaveLength(1);
  });

  it('returns a length stop as such', async () => {
    stub.reply(fixture('length'));
    const response = await provider().complete('prompt');
    expect(response.finishReason).toBe('length');
  });

  it.each(['refusal', 'refusal-403', 'length'])('completeJSON never parses a %s reply', async (name) => {
    stub.reply(fixture(name));
    await expect(provider().completeJSON('prompt')).rejects.toThrow(/No usable JSON reply/);
  });

  it('keeps a 403 that is not a policy block an error', async () => {
    stub.reply({ status: 403, body: { error: { code: 403, message: 'Key disabled.' } } });
    const p = new OpenRouterProvider({ apiKey: 'k', baseUrl: stub.baseUrl, maxRetries: 1, retryDelay: 1 });
    await expect(p.complete('prompt')).rejects.toBeInstanceOf(OpenRouterAPIError);
  });

  it('treats a 200 whose body holds only an error as an error', async () => {
    stub.reply(fixture('error-200'));
    const p = new OpenRouterProvider({ apiKey: 'k', baseUrl: stub.baseUrl, maxRetries: 1, retryDelay: 1 });
    await expect(p.complete('prompt')).rejects.toBeInstanceOf(OpenRouterAPIError);
  });
});

describe('EnrichmentEngine structured output', () => {
  it('asks for only the configured fields of the exercises in the batch, and writes a valid reply', async () => {
    stub.reply(fixture('valid-description'));
    const engine = new EnrichmentEngine(engineConfig(stub, descriptionOnly));

    const result = await engine.enrichBatch(exercises);

    const format = stub.requests[0].response_format;
    expect(format.type).toBe('json_schema');
    const item = format.json_schema.schema.properties.results.items;
    expect(item.properties.slug.enum).toEqual(['barbell-bench-press', 'push-up']);
    // Each answered field, plus the optional confidence the model may give for it
    expect(Object.keys(item.properties).sort()).toEqual(['confidence', 'description', 'slug']);
    expect(item.required.sort()).toEqual(['description', 'slug']);
    expect(Object.keys(item.properties.confidence.properties)).toEqual(['description']);
    expect(item.additionalProperties).toBe(false);

    expect(result.results.get('ex-1')).toEqual({
      canonical: { description: 'Lie on a flat bench and press a barbell from the chest to straight arms.' },
    });
    expect(result.abstentions).toEqual([]);
  });

  it('records a refusal as an abstention for every exercise in the call, and writes nothing', async () => {
    stub.reply(fixture('refusal'));
    const engine = new EnrichmentEngine(engineConfig(stub, descriptionOnly));

    const result = await engine.enrichBatch(exercises);

    expect(result.results.size).toBe(0);
    expect(result.failedIds).toEqual([]);
    expect(result.abstentions.map((a) => [a.exerciseId, a.reason])).toEqual([
      ['ex-1', 'refusal'],
      ['ex-2', 'refusal'],
    ]);
    expect(result.abstentions[0]).toMatchObject({ tier: 'simple', promptId: 'description', model: 'test/simple-model' });
    // An abstention is an answer, not a failure: no retry and no degrade.
    expect(stub.requests).toHaveLength(1);
  });

  it('records a refusal reported as a 403 as an abstention', async () => {
    stub.reply(fixture('refusal-403'));
    const engine = new EnrichmentEngine(engineConfig(stub, descriptionOnly));

    const result = await engine.enrichBatch(exercises);

    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['refusal', 'refusal']);
  });

  const validReply = { results: exercises.map((e) => ({ slug: e.slug, description: 'Looks fine.' })) };

  it('treats message.refusal alone as a refusal, even with schema-valid content', async () => {
    const reply = completion(validReply);
    (reply.body as any).choices[0].message.refusal = 'I will not.';
    stub.reply(reply);
    const result = await new EnrichmentEngine(engineConfig(stub, descriptionOnly)).enrichBatch(exercises);
    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['refusal', 'refusal']);
  });

  it('treats finish_reason content_filter alone as a refusal, even with schema-valid content', async () => {
    stub.reply(completion(validReply, { finishReason: 'content_filter' }));
    const result = await new EnrichmentEngine(engineConfig(stub, descriptionOnly)).enrichBatch(exercises);
    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['refusal', 'refusal']);
  });

  it.each([
    ['at the root', { error: { code: 403, message: 'Refused.', metadata: { error_type: 'refusal' } } }],
    [
      'inside the choice',
      { choices: [{ finish_reason: 'error', message: { content: '' }, error: { code: 403, message: 'Refused.', metadata: { error_type: 'refusal' } } }] },
    ],
  ])('records a refusal error in a 200 body %s as an abstention, without retrying', async (_where, body) => {
    stub.reply({ status: 200, body }, completion(validReply), completion(validReply));
    const config = engineConfig(stub, descriptionOnly);
    config.options = { maxRetries: 3, retryDelay: 1 };
    const result = await new EnrichmentEngine(config).enrichBatch(exercises);
    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['refusal', 'refusal']);
    expect(stub.requests).toHaveLength(1);
  });

  it('writes nothing for a field the model declines with null', async () => {
    stub.reply(
      completion({
        results: [
          { slug: 'barbell-bench-press', exerciseType: 'strength', unilateral: null },
          { slug: 'push-up', exerciseType: null, unilateral: false },
        ],
      })
    );
    const engine = new EnrichmentEngine(
      engineConfig(stub, {
        'classification.exerciseType': { tier: 'simple', prompt: 'classification-simple' },
        'classification.unilateral': { tier: 'simple', prompt: 'classification-simple' },
      })
    );

    const result = await engine.enrichBatch(exercises);

    expect(result.results.get('ex-1')).toEqual({ classification: { exerciseType: 'strength' } });
    expect(result.results.get('ex-2')).toEqual({ classification: { unilateral: false } });
  });

  it('records a batch reply that leaves out an exercise as an abstention', async () => {
    stub.reply(completion({ results: [{ slug: 'barbell-bench-press', description: 'A press.' }] }));
    const result = await new EnrichmentEngine(engineConfig(stub, descriptionOnly)).enrichBatch(exercises);
    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['invalid', 'invalid']);
  });

  it('records a batch reply that answers an exercise twice as an abstention', async () => {
    stub.reply(
      completion({
        results: [
          { slug: 'barbell-bench-press', description: 'First.' },
          { slug: 'barbell-bench-press', description: 'Last.' },
        ],
      })
    );
    const result = await new EnrichmentEngine(engineConfig(stub, descriptionOnly)).enrichBatch(exercises);
    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['invalid', 'invalid']);
  });

  it('records a length stop as an abstention, and writes nothing from the cut-off reply', async () => {
    stub.reply(fixture('length'));
    const engine = new EnrichmentEngine(engineConfig(stub, descriptionOnly));

    const result = await engine.enrichBatch(exercises);

    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['length', 'length']);
  });

  it('records a reply that fails the schema as an abstention, and writes none of it', async () => {
    stub.reply(fixture('schema-invalid'));
    const engine = new EnrichmentEngine(engineConfig(stub, descriptionOnly));

    const result = await engine.enrichBatch(exercises);

    // The first item alone looks usable; it is still not written.
    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['invalid', 'invalid']);
    expect(result.abstentions[0].detail).toBeTruthy();
  });

  it('records unparseable text as an invalid abstention', async () => {
    stub.reply(completion('Sure! Here is the description you asked for.'));
    const engine = new EnrichmentEngine(engineConfig(stub, descriptionOnly));

    const result = await engine.enrichBatch(exercises);

    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['invalid', 'invalid']);
  });

  it('reports each call with its model, token usage, cost and outcome', async () => {
    stub.reply(fixture('valid-description'));
    const engine = new EnrichmentEngine(engineConfig(stub, descriptionOnly));

    const result = await engine.enrichBatch(exercises);

    expect(result.calls).toEqual([
      {
        tier: 'simple',
        promptId: 'description',
        model: 'test/simple-model',
        servedModel: 'anthropic/claude-haiku-4.5',
        usage: { promptTokens: 412, completionTokens: 58, totalTokens: 470, cost: 0.000702 },
        outcome: 'ok',
      },
    ]);
  });
});

describe('legacy enrich() path', () => {
  const context = {
    source: { name: 'Push Up' },
    target: {},
    field: '',
    registries: { muscles: [], equipment: [], muscleCategories: [] },
    config: {} as never,
  };

  it.each(['refusal', 'refusal-403', 'length'])('writes nothing after a %s, and does not fall back to per-field calls', async (name) => {
    stub.reply(fixture(name), completion({ description: 'Written anyway.' }));
    const engine = new EnrichmentEngine({ enabled: true, baseUrl: stub.baseUrl, options: { maxRetries: 1, retryDelay: 1 } });

    const result = await engine.enrich({}, { 'canonical.description': { enrichment: { enabled: true } } }, context);

    expect(result.data).toEqual({});
    expect(stub.requests).toHaveLength(1);
  });
});

describe('request schema keys', () => {
  // The schema asks for each field under replyKey(path); the reply is mapped
  // back to paths by the engine. If the two ever disagree, every reply to that
  // prompt fails its schema.
  const engine = new EnrichmentEngine({ enabled: false });
  const map = (promptId: string, fields: Record<string, unknown>) =>
    (engine as unknown as { mapFieldsFromPrompt(p: string, f: Record<string, unknown>): Record<string, unknown> })
      .mapFieldsFromPrompt(promptId, fields);

  for (const tierName of ['simple', 'medium', 'complex'] as const) {
    for (const [promptId, template] of Object.entries(getTierPrompts(tierName))) {
      it.each(template.fields)(`${promptId}: %s round-trips through its reply key`, (path) => {
        const mapped = map(promptId, { [replyKey(path)]: 'marker' });
        const value = path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], mapped);
        expect(value).toBe('marker');
      });
    }
  }
});

describe('EnrichmentEngine degrade', () => {
  const movementOnly: EnrichmentConfig['fields'] = {
    'classification.movement': { tier: 'complex', prompt: 'biomechanics' },
  };

  it('degrades one call to the lower tier and reports it', async () => {
    stub.reply(
      { status: 500, body: { error: { code: 500, message: 'down' } } },
      completion({ movement: 'push-horizontal' }, { model: 'served/medium' })
    );
    const engine = new EnrichmentEngine(engineConfig(stub, movementOnly));

    const result = await engine.enrichBatch([exercises[0]]);

    expect(stub.requests.map((r) => r.model)).toEqual(['test/complex-model', 'test/medium-model']);
    expect(result.results.get('ex-1')).toEqual({ classification: { movement: 'push-horizontal' } });
    expect(result.calls).toMatchObject([{ tier: 'medium', degradedFrom: 'complex', model: 'test/medium-model', outcome: 'ok' }]);
  });

  it('a degraded call does not change the model of later calls', async () => {
    stub.reply(
      { status: 500, body: { error: { code: 500, message: 'down' } } },
      completion({ movement: 'push-horizontal' }),
      completion({ movement: 'push-horizontal' }),
      // the legacy single-call path, which uses the provider's own model
      completion({ description: 'A press.' })
    );
    const engine = new EnrichmentEngine(engineConfig(stub, movementOnly));

    await engine.enrichBatch(exercises);
    await engine.enrich({}, { 'canonical.description': { enrichment: { enabled: true } } }, {
      source: { name: 'Push Up' },
      target: {},
      field: '',
      registries: { muscles: [], equipment: [], muscleCategories: [] },
      config: {} as never,
    });

    expect(stub.requests.map((r) => r.model)).toEqual([
      'test/complex-model',
      'test/medium-model',
      'test/complex-model',
      'configured/default-model',
    ]);
  });
});

describe('API key', () => {
  it('is read from OPENROUTER_API_KEY', async () => {
    stub.reply(fixture('valid-description'));
    const engine = new EnrichmentEngine(engineConfig(stub, descriptionOnly));

    await engine.enrichBatch(exercises);

    expect(stub.headers[0].authorization).toBe('Bearer env-key-for-stub');
  });

  it('is never taken from the config, which only warns', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const warn = vi.mocked(console.warn);
    const engine = new EnrichmentEngine({ ...engineConfig(stub, descriptionOnly), apiKey: 'key-in-config' });

    const result = await engine.enrichBatch(exercises);

    expect(engine.getProvider()).toBeNull();
    expect(stub.requests).toHaveLength(0);
    expect(result.results.size).toBe(0);
    const warnings = warn.mock.calls.map((c) => String(c[0]));
    expect(warnings.some((w) => w.includes('enrichment.apiKey is ignored') && w.includes('OPENROUTER_API_KEY'))).toBe(true);
    expect(warnings.some((w) => w.includes('key-in-config'))).toBe(false);
  });

  it('is never taken from enrichment.options either', async () => {
    stub.reply(fixture('valid-description'));
    const config = engineConfig(stub, descriptionOnly);
    config.options = { ...config.options, apiKey: 'key-in-options' } as typeof config.options;
    await new EnrichmentEngine(config).enrichBatch(exercises);
    expect(stub.headers[0].authorization).toBe('Bearer env-key-for-stub');
  });

  it('is not copied from the environment into the config', () => {
    const config = ConfigLoader.applyEnvOverrides({ version: '1.0.0', targetSchema: { version: '1.4.0' }, mappings: {} });
    expect(config.enrichment?.apiKey).toBeUndefined();
  });
});
