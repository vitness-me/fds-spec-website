/**
 * Model output constrained to the target schema and the loaded registries.
 *
 * Request schemas are generated from the exercise schema's `$defs` and the
 * registries; registry references come back as registry entries, never as the
 * model's text. Every reply is served by the local stub; nothing calls
 * OpenRouter or a model.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRequest } from '../../src/ai/response-schema.js';
import { EnrichmentEngine, type ExerciseInput } from '../../src/ai/enrichment-engine.js';
import { Transformer } from '../../src/core/transformer.js';
import { ConfigLoader } from '../../src/config/config-loader.js';
import type { EnrichmentConfig, MappingConfig, TierConfig } from '../../src/core/types.js';
import { testMuscles, testEquipment, testMuscleCategories } from '../fixtures/registries.js';
import { OpenRouterStub, completion, type StubReply } from '../support/openrouter-stub.js';

const here = dirname(fileURLToPath(import.meta.url));
const exerciseSchema = JSON.parse(
  readFileSync(join(here, '../../src/schemas/bundled/v1.4.0/exercise.schema.json'), 'utf-8')
) as Record<string, unknown>;
const registries = { muscles: testMuscles, equipment: testEquipment, muscleCategories: testMuscleCategories };
const target = { schema: exerciseSchema, registries };

const nullable = (schema: unknown) => ({ anyOf: [schema, { type: 'null' }] });
const itemOf = (request: ReturnType<typeof buildRequest>, schema: 'request' | 'validation') => {
  const root = schema === 'request' ? request.responseSchema.schema : request.validationSchema;
  return (root as any).properties.results.items;
};

describe('buildRequest', () => {
  it('takes an enum field from the schema $defs', () => {
    const request = buildRequest('biomechanics', [{ path: 'classification.movement' }], null, target);
    const movement = (exerciseSchema.$defs as any).movement;
    expect((request.responseSchema.schema as any).properties.movement).toEqual(nullable(movement));
  });

  it('offers registry entries, by slug, for a muscle or equipment reference', () => {
    const request = buildRequest(
      'biomechanics',
      [{ path: 'targets.secondary' }],
      null,
      target
    );
    expect((request.responseSchema.schema as any).properties.secondary).toEqual(
      nullable({ type: 'array', items: { type: 'string', enum: testMuscles.map((m) => m.canonical.slug) } })
    );
    expect(request.refs).toEqual({ secondary: 'muscles' });

    const equipment = buildRequest('equipment', [{ path: 'equipment.optional' }], ['push-up'], target);
    expect(itemOf(equipment, 'request').properties.optional).toEqual(
      nullable({ type: 'array', items: { type: 'string', enum: testEquipment.map((e) => e.canonical.slug) } })
    );
    expect(equipment.refs).toEqual({ optional: 'equipment' });
  });

  it('inlines nested $refs, so the request carries no $defs', () => {
    const request = buildRequest('metrics', [{ path: 'metrics.primary' }], ['push-up'], target);
    const primary = itemOf(request, 'request').properties.primary.anyOf[0];
    expect(primary.properties.type.enum).toEqual((exerciseSchema.$defs as any).metricType.enum);
    expect(JSON.stringify(request.responseSchema.schema)).not.toContain('$ref');
  });

  it('narrows a field to the enum its config names', () => {
    const request = buildRequest(
      'classification-simple',
      [{ path: 'classification.exerciseType', enum: ['strength', 'cardio'] }],
      ['push-up'],
      target
    );
    expect(itemOf(request, 'request').properties.exerciseType).toEqual(
      nullable({ type: 'string', enum: ['strength', 'cardio'] })
    );
  });

  it('sends a strict schema without validation-only keywords, and validates with all of them', () => {
    const request = buildRequest('description', [{ path: 'canonical.description' }], ['push-up'], target);
    expect(request.responseSchema.strict).toBe(true);
    expect(itemOf(request, 'request').properties.description).toEqual(nullable({ type: 'string' }));
    expect(itemOf(request, 'validation').properties.description).toEqual(nullable({ type: 'string', minLength: 1 }));
  });

  it('refuses a field the target schema does not have', () => {
    expect(() => buildRequest('description', [{ path: 'canonical.nickname' }], ['push-up'], target)).toThrow(
      /canonical\.nickname/
    );
  });
});

// ============================================================================
// Through the engine and the transformer, against the stub
// ============================================================================

const tier = (model: string, batchSize: number): TierConfig => ({
  model,
  temperature: 0,
  maxTokens: 800,
  batchSize,
  priority: 'balanced',
});

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

/** The reply keys a request asks for, and the batch slugs if it is batched. */
function asked(body: Record<string, any>): { batched: boolean; slugs: string[]; keys: string[] } {
  const schema = body.response_format.json_schema.schema;
  const item = schema.properties.results?.items ?? schema;
  return {
    batched: !!schema.properties.results,
    slugs: item.properties.slug?.enum ?? [],
    keys: Object.keys(item.properties).filter((k) => k !== 'slug'),
  };
}

/** Answer every request, using `value(key)` for each field asked for. */
function answer(value: (key: string) => unknown) {
  return (body: Record<string, any>): StubReply => {
    const { batched, slugs, keys } = asked(body);
    const fields = (slug?: string) => ({ ...(slug ? { slug } : {}), ...Object.fromEntries(keys.map((k) => [k, value(k)])) });
    return completion(batched ? { results: slugs.map((slug) => fields(slug)) } : fields());
  };
}

describe('EnrichmentEngine with a target schema and registries', () => {
  const exercise: ExerciseInput = { id: 'ex-1', slug: 'barbell-bench-press', name: 'Barbell Bench Press' };

  const config = (fields: EnrichmentConfig['fields']): EnrichmentConfig => ({
    enabled: true,
    baseUrl: stub.baseUrl,
    options: { maxRetries: 1, retryDelay: 1 },
    tiers: { simple: tier('t/simple', 10), medium: tier('t/medium', 10), complex: tier('t/complex', 1) },
    fields,
    fallback: { retries: 0, degradeModel: false, useDefaults: false, degradeChain: { complex: 'medium', medium: 'simple', simple: null } },
    rateLimit: { requestsPerMinute: 6000, backoffStrategy: 'exponential', initialBackoffMs: 1, maxBackoffMs: 1 },
    checkpoint: { enabled: false, saveInterval: 1 },
  });

  it('writes a chosen muscle as the registry entry, not as the model wrote it', async () => {
    stub.reply(completion({ secondary: ['deltoids'] }));
    const engine = new EnrichmentEngine(config({ 'targets.secondary': { tier: 'complex', prompt: 'biomechanics' } }));

    const result = await engine.enrichBatch([exercise], { targetSchema: exerciseSchema, registries });

    const deltoids = testMuscles.find((m) => m.canonical.slug === 'deltoids')!;
    expect(result.results.get('ex-1')).toEqual({
      targets: {
        secondary: [
          { id: deltoids.id, name: deltoids.canonical.name, slug: 'deltoids', categoryId: deltoids.classification.categoryId },
        ],
      },
    });
  });

  it('abstains on a reference the model invents, writing none of it', async () => {
    stub.reply(completion({ secondary: [{ id: 'anterior-deltoid', name: 'Anterior Deltoid' }] }));
    const engine = new EnrichmentEngine(config({ 'targets.secondary': { tier: 'complex', prompt: 'biomechanics' } }));

    const result = await engine.enrichBatch([exercise], { targetSchema: exerciseSchema, registries });

    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['invalid']);
  });

  it('abstains on a value outside the schema enum', async () => {
    stub.reply(completion({ movement: 'push' }));
    const engine = new EnrichmentEngine(config({ 'classification.movement': { tier: 'complex', prompt: 'biomechanics' } }));

    const result = await engine.enrichBatch([exercise], { targetSchema: exerciseSchema, registries });

    expect(result.results.size).toBe(0);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['invalid']);
  });
});

describe("VP's poc-output-final case", () => {
  // The poc-output-final run asked every tier for every field, and the model
  // answered secondary muscles and optional equipment with refs of its own:
  // { "id": "anterior-deltoid" }, "coracobrachialis", "bench", "safety-rack",
  // "spotter-arms". None of them is a registry entry. This replays that shape
  // through the PoC configuration in poc-test/.
  const invented: Record<string, unknown> = {
    secondary: [
      { id: 'anterior-deltoid', name: 'Anterior Deltoid' },
      { id: 'coracobrachialis', name: 'Coracobrachialis' },
    ],
    optional: [
      { id: 'bench', name: 'Bench' },
      { id: 'safety-rack', name: 'Safety Rack' },
      { id: 'spotter-arms', name: 'Spotter Arms' },
    ],
  };

  async function runPoc(reply: (body: Record<string, any>) => StubReply) {
    const configPath = join(here, '../../poc-test/mapping.config.poc.json');
    const config = (await ConfigLoader.load(configPath)) as MappingConfig;
    config.enrichment = {
      ...config.enrichment,
      baseUrl: stub.baseUrl,
      options: { maxRetries: 1, retryDelay: 1 },
      fallback: { retries: 0, degradeModel: false, useDefaults: false, degradeChain: { complex: null, medium: null, simple: null } },
      rateLimit: { requestsPerMinute: 6000, backoffStrategy: 'exponential', initialBackoffMs: 1, maxBackoffMs: 1 },
      checkpoint: { enabled: false, saveInterval: 1 },
    };
    const sources = JSON.parse(readFileSync(join(here, '../../poc-test/exercises-poc.json'), 'utf-8'));
    for (let i = 0; i < 40; i++) stub.reply(reply);

    const transformer = new Transformer({ config });
    const result = await transformer.transformAllBatch(sources);

    const registryIds = (name: 'muscles' | 'equipment') =>
      new Set(
        JSON.parse(readFileSync(join(here, `../../poc-test/registries/${name}.registry.example.json`), 'utf-8')).map(
          (e: { id: string }) => e.id
        )
      );
    const refs = result.results.flatMap((r) => {
      const data = (r.data ?? {}) as Record<string, any>;
      return [
        ...(data.targets?.secondary ?? []).map((ref: { id: string }) => ['muscles', ref.id] as const),
        ...(data.equipment?.optional ?? []).map((ref: { id: string }) => ['equipment', ref.id] as const),
      ];
    });
    return { result, refs, registryIds, sources };
  }

  it('writes no invented muscle or equipment ref when the model invents them', async () => {
    const { result, refs } = await runPoc(answer((key) => invented[key] ?? null));

    expect(stub.requests.length).toBeGreaterThan(0);
    expect(refs).toEqual([]);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('writes only registry entries when the model chooses from the registry', async () => {
    const { refs, registryIds } = await runPoc(
      answer((key) => (key === 'secondary' ? ['quadriceps'] : key === 'optional' ? ['dumbbell'] : null))
    );

    expect(refs.length).toBeGreaterThan(0);
    for (const [registry, id] of refs) {
      expect(registryIds(registry).has(id)).toBe(true);
    }
  });
});
