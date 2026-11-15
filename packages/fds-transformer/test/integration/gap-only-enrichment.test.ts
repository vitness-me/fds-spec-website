/**
 * Enrichment fills gaps and never overwrites mapped values.
 *
 * An AI value may land only in a field the configuration names, and only where
 * the mapped value is a gap under that field's `when`. These tests drive the
 * real transformer with a stub provider that answers every key it knows, for
 * every exercise, whatever it was asked: the code under test is what decides
 * which of those values may land.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Transformer } from '../../src/core/transformer.js';
import { EnrichmentEngine } from '../../src/ai/enrichment-engine.js';
import { CheckpointManager } from '../../src/ai/checkpoint-manager.js';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getTierPrompts, SYSTEM_PROMPTS } from '../../src/ai/prompts/tier-prompts.js';
import type {
  EnrichmentConfig,
  FieldMapping,
  MappingConfig,
  TierName,
  TieredFieldEnrichmentConfig,
} from '../../src/core/types.js';

type When = 'missing' | 'empty' | 'notFound' | 'always';
type FieldState = 'mapped' | 'absent' | 'null' | 'emptyString' | 'emptyArray' | 'emptyObject';

const TIERS: TierName[] = ['simple', 'medium', 'complex'];
const PROMPTS = TIERS.flatMap((tier) =>
  Object.values(getTierPrompts(tier)).map((t) => ({ tier, id: t.id, fields: t.fields }))
);
/** Every path any tier prompt can write. */
const ALL_PATHS = [...new Set(PROMPTS.flatMap((p) => p.fields))];
const WHENS: When[] = ['missing', 'empty', 'notFound', 'always'];
const GAP_STATES: FieldState[] = ['absent', 'null', 'emptyString', 'emptyArray', 'emptyObject'];

const sourceKey = (path: string) => path.replace(/\./g, '__');
const responseKey = (path: string) => path.split('.').pop()!;
/** A mapped value: a string, a populated array or a populated object, by path. */
const mappedValue = (path: string): unknown => {
  const text = `mapped:${path}`;
  switch (ALL_PATHS.indexOf(path) % 3) {
    case 0:
      return text;
    case 1:
      return [text];
    default:
      return { value: text };
  }
};

/** Deterministic PRNG (mulberry32), so a failure reproduces. */
function prng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sourceValue(state: FieldState, path: string): unknown {
  switch (state) {
    case 'mapped':
      return mappedValue(path);
    case 'null':
      return null;
    case 'emptyString':
      return '';
    case 'emptyArray':
      return [];
    case 'emptyObject':
      return {};
    case 'absent':
      return undefined;
  }
}

/** Whether `when` treats a field in this state as a gap to fill. */
function isGapFor(when: When, state: FieldState): boolean {
  if (state === 'mapped') return false;
  switch (when) {
    case 'missing':
      return state === 'absent';
    case 'notFound':
      return state === 'absent' || state === 'null';
    case 'empty':
    case 'always':
      return true;
  }
}

function getPath(obj: unknown, path: string): unknown {
  let current = obj;
  for (const part of path.split('.')) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Every path in `doc` that holds a value the stub model wrote. */
function aiWrittenPaths(doc: unknown, prefix = ''): string[] {
  if (typeof doc === 'string') return doc.startsWith('ai:') ? [prefix] : [];
  if (doc === null || typeof doc !== 'object') return [];
  if (Array.isArray(doc)) {
    return doc.some((v) => aiWrittenPaths(v).length > 0) ? [prefix] : [];
  }
  return Object.entries(doc).flatMap(([k, v]) =>
    aiWrittenPaths(v, prefix ? `${prefix}.${k}` : k)
  );
}

/** The model answers every key of every prompt, for every slug given. */
function modelReply(tier: TierName, slugs: string[]): string {
  const fields: Record<string, unknown> = {};
  for (const path of ALL_PATHS) {
    fields[responseKey(path)] = `ai:${responseKey(path)}`;
  }
  if (tier === 'complex') return JSON.stringify(fields);
  return JSON.stringify({ results: slugs.map((slug) => ({ slug, ...fields })) });
}

const TIERS_CONFIG: EnrichmentConfig['tiers'] = {
  simple: { model: 'stub/simple', temperature: 0, maxTokens: 100, batchSize: 7, priority: 'speed' },
  medium: { model: 'stub/medium', temperature: 0, maxTokens: 100, batchSize: 5, priority: 'balanced' },
  complex: { model: 'stub/complex', temperature: 0, maxTokens: 100, batchSize: 1, priority: 'accuracy' },
};

function baseConfig(
  mappings: Record<string, FieldMapping>,
  fields: Record<string, TieredFieldEnrichmentConfig>
): MappingConfig {
  return {
    version: '1.0.0',
    targetSchema: { version: '1.4.0', entity: 'exercise' },
    mappings: {
      exerciseId: { from: 'id' },
      'canonical.name': { from: 'name' },
      'canonical.slug': { from: 'slug' },
      ...mappings,
    },
    validation: { enabled: false },
    enrichment: {
      enabled: true,
      provider: 'openrouter',
      apiKey: 'stub-key-not-used',
      tiers: TIERS_CONFIG,
      fields,
    },
  };
}

/** A transformer whose provider is the stub model; returns the slugs each call asked for. */
async function stubbedTransformer(config: MappingConfig, tier: TierName, slugs: string[]) {
  const transformer = new Transformer({ config });
  await transformer.init();
  const asked: string[][] = [];
  vi.spyOn(transformer.getEnrichmentEngine()!.getProvider()!, 'complete').mockImplementation(
    async (prompt: string) => {
      asked.push([...prompt.matchAll(/slug: ([\w-]+)/g)].map((m) => m[1]));
      return { content: modelReply(tier, slugs), tokensUsed: 1, model: 'stub' };
    }
  );
  return { transformer, asked };
}

// Offline: schemas come from the bundle, and no request leaves the test.
beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Enrichment fills gaps only', () => {
  it('never replaces a mapped value, and writes only configured gaps, for every prompt', { timeout: 60_000 }, async () => {
    const random = prng(20261115);
    let cases = 0;

    for (const prompt of PROMPTS) {
      const n = prompt.fields.length;

      // Every non-empty subset of the prompt's fields, as the configured set.
      for (let configMask = 1; configMask < 1 << n; configMask++) {
        const configured = prompt.fields.filter((_, i) => configMask & (1 << i));
        const when: Record<string, When> = {};
        const mappings: Record<string, FieldMapping> = {};
        for (const path of ALL_PATHS) {
          when[path] = WHENS[Math.floor(random() * WHENS.length)];
          mappings[path] = { from: sourceKey(path), enrichment: { when: when[path] } };
        }
        const fields = Object.fromEntries(
          configured.map((path) => [path, { tier: prompt.tier, prompt: prompt.id }])
        );

        // Every combination of mapped vs gap across the prompt's fields; gap
        // kinds and every other path's state are drawn at random.
        const states: Array<Record<string, FieldState>> = [];
        const sources: Record<string, unknown>[] = [];
        for (let stateMask = 0; stateMask < 1 << n; stateMask++) {
          const state: Record<string, FieldState> = {};
          for (const path of ALL_PATHS) {
            const i = prompt.fields.indexOf(path);
            const mapped = i >= 0 ? (stateMask & (1 << i)) !== 0 : random() < 0.5;
            state[path] = mapped
              ? 'mapped'
              : GAP_STATES[Math.floor(random() * GAP_STATES.length)];
          }
          const slug = `ex-${stateMask}`;
          const source: Record<string, unknown> = { id: slug, slug, name: `Exercise ${stateMask}` };
          for (const path of ALL_PATHS) {
            const value = sourceValue(state[path], path);
            if (value !== undefined) source[sourceKey(path)] = value;
          }
          states.push(state);
          sources.push(source);
        }

        const { transformer } = await stubbedTransformer(
          baseConfig(mappings, fields),
          prompt.tier,
          sources.map((s) => s.slug as string)
        );
        const { results } = await transformer.transformAllBatch(sources);

        results.forEach((result, i) => {
          const doc = result.data as unknown as Record<string, unknown>;
          const label = `${prompt.id} configured=[${configured}] ${sources[i].slug}`;
          const expectedWritten: string[] = [];

          for (const path of ALL_PATHS) {
            const state = states[i][path];
            const actual = getPath(doc, path);
            if (state === 'mapped') {
              expect(actual, `${label}: mapped ${path} replaced`).toEqual(mappedValue(path));
            } else if (configured.includes(path) && isGapFor(when[path], state)) {
              expectedWritten.push(path);
            } else {
              expect(actual, `${label}: ${path} (${state}, when ${when[path]}) touched`).toEqual(
                sourceValue(state, path)
              );
            }
          }

          expect(aiWrittenPaths(doc).sort(), `${label}: AI wrote outside configured gaps`).toEqual(
            expectedWritten.sort()
          );
          cases++;
        });
      }
    }

    // 8 prompts, every configured subset × every mapped/gap combination.
    expect(cases).toBe(
      PROMPTS.reduce((sum, p) => sum + ((1 << p.fields.length) - 1) * (1 << p.fields.length), 0)
    );
  });

  it('writes every configured field when several prompts write under one parent', async () => {
    const fields = Object.fromEntries(
      PROMPTS.flatMap((p) => p.fields.map((path) => [path, { tier: p.tier, prompt: p.id }]))
    );
    const { transformer } = await stubbedTransformer(baseConfig({}, fields), 'simple', ['squat']);
    // One stub answers every tier, in each tier's reply shape.
    const provider = transformer.getEnrichmentEngine()!.getProvider()!;
    vi.spyOn(provider, 'complete').mockImplementation(async (_prompt, options) => ({
      content: modelReply(options?.systemPrompt === SYSTEM_PROMPTS.complex ? 'complex' : 'simple', ['squat']),
      tokensUsed: 1,
      model: 'stub',
    }));

    const { results } = await transformer.transformAllBatch([{ id: 'squat', slug: 'squat', name: 'Squat' }]);

    expect(aiWrittenPaths(results[0].data).sort()).toEqual(ALL_PATHS.slice().sort());
  });

  it('keeps every tier of a result resumed from a checkpoint', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fds-gap-only-'));
    try {
      const config: EnrichmentConfig = {
        enabled: true,
        provider: 'openrouter',
        apiKey: 'stub-key-not-used',
        tiers: TIERS_CONFIG,
        fields: {
          'classification.exerciseType': { tier: 'simple', prompt: 'classification-simple' },
          'classification.movement': { tier: 'complex', prompt: 'biomechanics' },
        },
        checkpoint: { enabled: true, saveInterval: 1 },
      };
      const checkpoint = new CheckpointManager(dir, config.checkpoint);
      checkpoint.initialize({
        inputFile: 'batch-enrichment',
        totalExercises: 1,
        config: { model: 'anthropic/claude-3.5-sonnet', ...config },
      });
      checkpoint.update({
        exerciseId: 'squat',
        success: true,
        currentTier: 'complex',
        results: {
          simple: { classification: { exerciseType: 'ai:exerciseType' } },
          complex: { classification: { movement: 'ai:movement' } },
        },
      });
      checkpoint.forceSave();

      const engine = new EnrichmentEngine(config);
      const { results } = await engine.enrichBatch(
        [{ id: 'squat', slug: 'squat', name: 'Squat' }],
        { resume: true, outputDirectory: dir }
      );

      expect(results.get('squat')).toEqual({
        classification: { exerciseType: 'ai:exerciseType', movement: 'ai:movement' },
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('enabling exerciseType leaves a mapped level untouched', async () => {
    const config = baseConfig(
      { 'classification.level': { from: 'level' } },
      { 'classification.exerciseType': { tier: 'simple', prompt: 'classification-simple' } }
    );
    const { transformer } = await stubbedTransformer(config, 'simple', ['bench', 'curl']);

    const { results } = await transformer.transformAllBatch([
      { id: 'bench', slug: 'bench', name: 'Bench', level: 'beginner' },
      { id: 'curl', slug: 'curl', name: 'Curl' },
    ]);

    expect((results[0].data as any).classification).toEqual({
      level: 'beginner',
      exerciseType: 'ai:exerciseType',
    });
    // Not configured, so not written even where the mapping left it empty.
    expect((results[1].data as any).classification).toEqual({ exerciseType: 'ai:exerciseType' });
  });

  it('honours `when` in the tiered path and asks only for records with a gap', async () => {
    const run = async (when: When) => {
      const config = baseConfig(
        { 'canonical.description': { from: 'description', enrichment: { when } } },
        { 'canonical.description': { tier: 'simple', prompt: 'description' } }
      );
      const stub = await stubbedTransformer(config, 'simple', ['blank', 'written', 'none']);
      const { results } = await stub.transformer.transformAllBatch([
        { id: 'blank', slug: 'blank', name: 'Blank', description: '' },
        { id: 'written', slug: 'written', name: 'Written', description: 'From the source.' },
        { id: 'none', slug: 'none', name: 'None' },
      ]);
      return {
        asked: stub.asked,
        descriptions: results.map((r) => (r.data as any).canonical.description),
      };
    };

    const missing = await run('missing');
    expect(missing.asked).toEqual([['none']]);
    expect(missing.descriptions).toEqual(['', 'From the source.', 'ai:description']);

    const empty = await run('empty');
    expect(empty.asked).toEqual([['blank', 'none']]);
    expect(empty.descriptions).toEqual(['ai:description', 'From the source.', 'ai:description']);
  });

  it('makes no call when no record has a gap', async () => {
    const config = baseConfig(
      { 'canonical.description': { from: 'description' } },
      { 'canonical.description': { tier: 'simple', prompt: 'description' } }
    );
    const stub = await stubbedTransformer(config, 'simple', ['a']);
    const completeJSON = vi.spyOn(
      stub.transformer.getEnrichmentEngine()!.getProvider()!,
      'completeJSON'
    );
    const { stats, errors, results } = await stub.transformer.transformAllBatch([
      { id: 'a', slug: 'a', name: 'A', description: 'Written.' },
    ]);
    expect(stub.asked).toEqual([]);
    expect(completeJSON).not.toHaveBeenCalled();
    expect(stats.apiCalls).toBe(0);
    expect(stats.failed).toBe(0);
    expect(errors).toEqual([]);
    expect((results[0].data as any).canonical.description).toBe('Written.');
  });

  it('applies an AI value resumed from a checkpoint only to a current gap', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fds-gap-only-'));
    try {
      const config = baseConfig(
        { 'canonical.description': { from: 'description' } },
        { 'canonical.description': { tier: 'simple', prompt: 'description' } }
      );
      config.enrichment!.checkpoint = { enabled: true, saveInterval: 1 };

      // An earlier run enriched the record while its description was a gap.
      const checkpoint = new CheckpointManager(dir, config.enrichment!.checkpoint);
      checkpoint.initialize({
        inputFile: 'batch-enrichment',
        totalExercises: 2,
        // The engine's config, as it fills in its defaults.
        config: { model: 'anthropic/claude-3.5-sonnet', ...config.enrichment },
      });
      for (const exerciseId of ['squat', 'lunge']) {
        checkpoint.update({
          exerciseId,
          success: true,
          currentTier: 'simple',
          results: { simple: { canonical: { description: 'ai:stale' } } },
        });
      }
      checkpoint.forceSave();

      // The source now has one for squat, and null for lunge, which is not a
      // gap under the default `when: missing`.
      const stub = await stubbedTransformer(config, 'simple', ['squat', 'lunge']);
      const { results } = await stub.transformer.transformAllBatch(
        [
          { id: 'squat', slug: 'squat', name: 'Squat', description: 'From the source.' },
          { id: 'lunge', slug: 'lunge', name: 'Lunge', description: null },
        ],
        { resume: true, outputDirectory: dir }
      );

      expect((results[0].data as any).canonical.description).toBe('From the source.');
      expect((results[1].data as any).canonical.description).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('scopes direct engine results to fieldsToEnrich on the single-model fallback', async () => {
    const engine = new EnrichmentEngine({ enabled: true, provider: 'openrouter', apiKey: 'stub-key-not-used' });
    vi.spyOn(engine.getProvider()!, 'completeJSON').mockResolvedValue({
      description: 'ai:description',
      classification: { level: 'ai:level' },
    });

    const { results } = await engine.enrichBatch([
      { id: 'squat', slug: 'squat', name: 'Squat', fieldsToEnrich: ['canonical.description'] },
    ]);

    expect(results.get('squat')).toEqual({ canonical: { description: 'ai:description' } });
  });

  it('scopes direct engine results resumed from a checkpoint to fieldsToEnrich', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fds-gap-only-'));
    try {
      const config: EnrichmentConfig = {
        enabled: true,
        provider: 'openrouter',
        apiKey: 'stub-key-not-used',
        tiers: TIERS_CONFIG,
        fields: { 'canonical.description': { tier: 'simple', prompt: 'description' } },
        checkpoint: { enabled: true, saveInterval: 1 },
      };
      const checkpoint = new CheckpointManager(dir, config.checkpoint);
      checkpoint.initialize({
        inputFile: 'batch-enrichment',
        totalExercises: 1,
        config: { model: 'anthropic/claude-3.5-sonnet', ...config },
      });
      checkpoint.update({
        exerciseId: 'squat',
        success: true,
        currentTier: 'simple',
        results: { simple: { canonical: { description: 'ai:stale' }, classification: { level: 'ai:level' } } },
      });
      checkpoint.forceSave();

      const engine = new EnrichmentEngine(config);
      const { results } = await engine.enrichBatch(
        [{ id: 'squat', slug: 'squat', name: 'Squat', fieldsToEnrich: [] }],
        { resume: true, outputDirectory: dir }
      );

      expect(results.get('squat')).toEqual({});
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('scopes engine results to configured field paths, not to the prompt', async () => {
    const engine = new EnrichmentEngine({
      enabled: true,
      provider: 'openrouter',
      apiKey: 'stub-key-not-used',
      tiers: TIERS_CONFIG,
      fields: { 'classification.exerciseType': { tier: 'simple', prompt: 'classification-simple' } },
    });
    vi.spyOn(engine.getProvider()!, 'complete').mockResolvedValue({
      content: modelReply('simple', ['squat']),
      tokensUsed: 1,
      model: 'stub',
    });

    const { results } = await engine.enrichBatch([{ id: 'squat', slug: 'squat', name: 'Squat' }]);

    expect(results.get('squat')).toEqual({ classification: { exerciseType: 'ai:exerciseType' } });
  });
});

describe('Legacy single-model enrichment fills gaps only', () => {
  it('writes only the configured field and keeps mapped values', async () => {
    const config: MappingConfig = {
      version: '1.0.0',
      targetSchema: { version: '1.4.0', entity: 'exercise' },
      mappings: {
        'canonical.name': { from: 'name' },
        'canonical.description': { from: 'description', enrichment: { enabled: true, when: 'missing' } },
        'classification.level': { from: 'level' },
      },
      validation: { enabled: false },
      enrichment: { enabled: true, provider: 'openrouter', apiKey: 'stub-key-not-used' },
    };
    const transformer = new Transformer({ config });
    await transformer.init();
    vi.spyOn(transformer.getEnrichmentEngine()!.getProvider()!, 'completeJSON').mockResolvedValue({
      description: 'ai:description',
      aliases: ['ai:alias'],
      classification: { level: 'ai:level', exerciseType: 'ai:exerciseType' },
    });

    const result = await transformer.transform({ name: 'Squat', level: 'beginner' });

    expect(result.data).toEqual({
      canonical: { name: 'Squat', description: 'ai:description' },
      classification: { level: 'beginner' },
    });
  });
});
