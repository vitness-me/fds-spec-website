/**
 * Structured output on OpenRouter, end to end against a local stub endpoint.
 *
 * Every reply comes from `test/fixtures/openrouter` or is built in the test and
 * served from 127.0.0.1. Nothing here calls OpenRouter or a model.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenRouterProvider, OpenRouterAPIError } from '../../src/ai/providers/openrouter.js';
import { EnrichmentEngine, type ExerciseInput } from '../../src/ai/enrichment-engine.js';
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
    expect(Object.keys(item.properties).sort()).toEqual(['description', 'slug']);
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
        promptTokens: 412,
        completionTokens: 58,
        totalTokens: 470,
        cost: 0.000702,
        outcome: 'ok',
      },
    ]);
  });
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

  it('is not copied from the environment into the config', () => {
    const config = ConfigLoader.applyEnvOverrides({ version: '1.0.0', targetSchema: { version: '1.4.0' }, mappings: {} });
    expect(config.enrichment?.apiKey).toBeUndefined();
  });
});
