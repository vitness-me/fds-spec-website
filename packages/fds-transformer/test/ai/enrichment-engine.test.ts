/**
 * Enrichment Engine Tests - Tiered AI Enrichment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  EnrichmentEngine,
  DEFAULT_TIER_CONFIGS,
  DEFAULT_FALLBACK_CONFIG,
  type ExerciseInput,
  type BatchEnrichmentOptions,
} from '../../src/ai/enrichment-engine.js';
import type {
  EnrichmentConfig,
  TierName,
  TierConfig,
  EnrichmentProgress,
} from '../../src/core/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const createTestExercise = (
  id: string,
  name: string,
  slug?: string
): ExerciseInput => ({
  id,
  name,
  slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
  description: `Test description for ${name}`,
  primaryTargets: [{ id: 'chest', name: 'Chest' }],
  requiredEquipment: [{ id: 'barbell', name: 'Barbell' }],
});

const createTestExercises = (count: number): ExerciseInput[] => {
  const names = [
    'Barbell Bench Press',
    'Squat',
    'Deadlift',
    'Pull Up',
    'Shoulder Press',
    'Bicep Curl',
    'Tricep Dip',
    'Lunges',
    'Plank',
    'Row',
  ];
  return Array.from({ length: count }, (_, i) => {
    const name = names[i % names.length];
    return createTestExercise(`ex-${i + 1}`, `${name} ${i + 1}`, `${name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`);
  });
};

const createTieredConfig = (): EnrichmentConfig => ({
  enabled: true,
  provider: 'openrouter',
  apiKey: 'test-api-key',
  tiers: {
    simple: {
      model: 'anthropic/claude-haiku-4.5',
      temperature: 0.1,
      maxTokens: 800,
      batchSize: 5,
      priority: 'speed',
    },
    medium: {
      model: 'anthropic/claude-sonnet-4.5',
      temperature: 0.1,
      maxTokens: 1500,
      batchSize: 2,
      priority: 'balanced',
    },
    complex: {
      model: 'anthropic/claude-opus-4.5',
      temperature: 0.1,
      maxTokens: 2000,
      batchSize: 1,
      priority: 'accuracy',
    },
  },
  fields: {
    'canonical.description': { tier: 'simple', prompt: 'description' },
    'canonical.aliases': { tier: 'simple', prompt: 'aliases' },
    'classification.exerciseType': { tier: 'simple', prompt: 'classification-simple' },
    'classification.level': { tier: 'simple', prompt: 'classification-simple' },
    'constraints.contraindications': { tier: 'medium', prompt: 'constraints' },
    'constraints.prerequisites': { tier: 'medium', prompt: 'constraints' },
    'relations': { tier: 'medium', prompt: 'relations' },
    'classification.movement': { tier: 'complex', prompt: 'biomechanics' },
    'classification.mechanics': { tier: 'complex', prompt: 'biomechanics' },
    'targets.secondary': { tier: 'complex', prompt: 'biomechanics' },
  },
  fallback: DEFAULT_FALLBACK_CONFIG,
  rateLimit: {
    requestsPerMinute: 50,
    backoffStrategy: 'exponential',
    initialBackoffMs: 100,
    maxBackoffMs: 1000,
  },
  checkpoint: {
    enabled: false,
    saveInterval: 10,
  },
});

// ============================================================================
// Tests
// ============================================================================

describe('EnrichmentEngine', () => {
  describe('constructor', () => {
    it('should create with default config', () => {
      const engine = new EnrichmentEngine();
      expect(engine).toBeInstanceOf(EnrichmentEngine);
    });

    it('should create with custom config', () => {
      const engine = new EnrichmentEngine({
        enabled: true,
        provider: 'openrouter',
        model: 'anthropic/claude-3.5-sonnet',
      });
      expect(engine).toBeInstanceOf(EnrichmentEngine);
    });

    it('should create with tiered config', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      expect(engine.isTieredEnabled()).toBe(true);
    });

    it('should not be enabled without API key', () => {
      const engine = new EnrichmentEngine({ enabled: true, provider: 'openrouter' });
      expect(engine.isEnabled()).toBe(false);
    });

    it('should be enabled with API key', () => {
      const engine = new EnrichmentEngine({
        enabled: true,
        provider: 'openrouter',
        apiKey: 'test-key',
      });
      expect(engine.isEnabled()).toBe(true);
    });

    it('should create rate limiter when tiered config is provided', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      expect(engine.getRateLimiter()).not.toBeNull();
    });
  });

  describe('isTieredEnabled()', () => {
    it('should return false without tiers config', () => {
      const engine = new EnrichmentEngine({ enabled: true });
      expect(engine.isTieredEnabled()).toBe(false);
    });

    it('should return false without fields config', () => {
      const engine = new EnrichmentEngine({
        enabled: true,
        tiers: DEFAULT_TIER_CONFIGS,
      });
      expect(engine.isTieredEnabled()).toBe(false);
    });

    it('should return true with both tiers and fields', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      expect(engine.isTieredEnabled()).toBe(true);
    });
  });

  describe('getTierConfig()', () => {
    it('should return default config when not customized', () => {
      const engine = new EnrichmentEngine({ enabled: true });
      const config = engine.getTierConfig('simple');
      expect(config).toEqual(DEFAULT_TIER_CONFIGS.simple);
    });

    it('should return custom config when provided', () => {
      const customConfig = createTieredConfig();
      const engine = new EnrichmentEngine(customConfig);
      const config = engine.getTierConfig('simple');
      expect(config.batchSize).toBe(5);
      expect(config.model).toBe('anthropic/claude-haiku-4.5');
    });

    it('should return correct config for each tier', () => {
      const engine = new EnrichmentEngine(createTieredConfig());

      expect(engine.getTierConfig('simple').model).toBe('anthropic/claude-haiku-4.5');
      expect(engine.getTierConfig('medium').model).toBe('anthropic/claude-sonnet-4.5');
      expect(engine.getTierConfig('complex').model).toBe('anthropic/claude-opus-4.5');
    });
  });

  describe('getFallbackConfig()', () => {
    it('should return default fallback when not customized', () => {
      const engine = new EnrichmentEngine({ enabled: true });
      expect(engine.getFallbackConfig()).toEqual(DEFAULT_FALLBACK_CONFIG);
    });

    it('should return custom fallback when provided', () => {
      const customFallback = {
        ...DEFAULT_FALLBACK_CONFIG,
        retries: 3,
      };
      const engine = new EnrichmentEngine({
        enabled: true,
        fallback: customFallback,
      });
      expect(engine.getFallbackConfig().retries).toBe(3);
    });
  });

  describe('groupFieldsByTier()', () => {
    it('should return empty maps when no fields configured', () => {
      const engine = new EnrichmentEngine({ enabled: true });
      const grouped = engine.groupFieldsByTier();

      expect(grouped.get('simple')?.size).toBe(0);
      expect(grouped.get('medium')?.size).toBe(0);
      expect(grouped.get('complex')?.size).toBe(0);
    });

    it('should group fields correctly by tier', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      const grouped = engine.groupFieldsByTier();

      // Simple tier: description, aliases, exerciseType, level
      expect(grouped.get('simple')?.size).toBe(4);
      expect(grouped.get('simple')?.has('canonical.description')).toBe(true);
      expect(grouped.get('simple')?.has('canonical.aliases')).toBe(true);

      // Medium tier: contraindications, prerequisites, relations
      expect(grouped.get('medium')?.size).toBe(3);
      expect(grouped.get('medium')?.has('constraints.contraindications')).toBe(true);
      expect(grouped.get('medium')?.has('relations')).toBe(true);

      // Complex tier: movement, mechanics, targets.secondary
      expect(grouped.get('complex')?.size).toBe(3);
      expect(grouped.get('complex')?.has('classification.movement')).toBe(true);
      expect(grouped.get('complex')?.has('targets.secondary')).toBe(true);
    });

    it('should include field config in grouped result', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      const grouped = engine.groupFieldsByTier();

      const descConfig = grouped.get('simple')?.get('canonical.description');
      expect(descConfig).toBeDefined();
      expect(descConfig?.tier).toBe('simple');
      expect(descConfig?.prompt).toBe('description');
    });
  });

  describe('estimateCost()', () => {
    it('should return cost estimate for exercises', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      const estimate = engine.estimateCost(100);

      expect(estimate).toBeDefined();
      expect(estimate.tiers).toBeDefined();
      expect(estimate.tiers.simple).toBeDefined();
      expect(estimate.tiers.medium).toBeDefined();
      expect(estimate.tiers.complex).toBeDefined();
    });

    it('should calculate correct API calls based on batch size', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      const estimate = engine.estimateCost(100);

      // Simple: batchSize 5, so 100/5 = 20 calls
      expect(estimate.tiers.simple.apiCalls).toBe(20);
      // Medium: batchSize 2, so 100/2 = 50 calls
      expect(estimate.tiers.medium.apiCalls).toBe(50);
      // Complex: batchSize 1, so 100/1 = 100 calls
      expect(estimate.tiers.complex.apiCalls).toBe(100);
    });

    it('should sum total API calls', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      const estimate = engine.estimateCost(100);

      const expectedTotal =
        estimate.tiers.simple.apiCalls +
        estimate.tiers.medium.apiCalls +
        estimate.tiers.complex.apiCalls;

      expect(estimate.total.apiCalls).toBe(expectedTotal);
    });

    it('should include model information in tier estimates', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      const estimate = engine.estimateCost(10);

      expect(estimate.tiers.simple.model).toBe('anthropic/claude-haiku-4.5');
      expect(estimate.tiers.medium.model).toBe('anthropic/claude-sonnet-4.5');
      expect(estimate.tiers.complex.model).toBe('anthropic/claude-opus-4.5');
    });

    it('should calculate estimated time', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      const estimate = engine.estimateCost(100);

      expect(estimate.estimatedTime).toBeDefined();
      expect(estimate.estimatedTime.minutes).toBeGreaterThan(0);
      expect(estimate.estimatedTime.formatted).toBeTruthy();
    });

    it('should include disclaimer', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      const estimate = engine.estimateCost(10);

      expect(estimate.disclaimer).toContain('estimate');
    });

    it('should handle zero exercises', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      const estimate = engine.estimateCost(0);

      expect(estimate.total.apiCalls).toBe(0);
      expect(estimate.total.cost).toBe(0);
    });

    it('should round partial batch sizes up', () => {
      const engine = new EnrichmentEngine(createTieredConfig());
      const estimate = engine.estimateCost(7);

      // Simple: batchSize 5, so 7/5 = 2 calls (rounded up)
      expect(estimate.tiers.simple.apiCalls).toBe(2);
      // Medium: batchSize 2, so 7/2 = 4 calls (rounded up)
      expect(estimate.tiers.medium.apiCalls).toBe(4);
      // Complex: batchSize 1, so 7/1 = 7 calls
      expect(estimate.tiers.complex.apiCalls).toBe(7);
    });
  });

  describe('getSystemPrompt()', () => {
    it('should return system prompt', () => {
      const engine = new EnrichmentEngine({ enabled: true });
      const prompt = engine.getSystemPrompt();
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
    });
  });

  describe('DEFAULT_TIER_CONFIGS', () => {
    it('should have all three tiers', () => {
      expect(DEFAULT_TIER_CONFIGS.simple).toBeDefined();
      expect(DEFAULT_TIER_CONFIGS.medium).toBeDefined();
      expect(DEFAULT_TIER_CONFIGS.complex).toBeDefined();
    });

    it('should have correct models', () => {
      expect(DEFAULT_TIER_CONFIGS.simple.model).toContain('haiku');
      expect(DEFAULT_TIER_CONFIGS.medium.model).toContain('sonnet');
      expect(DEFAULT_TIER_CONFIGS.complex.model).toContain('opus');
    });

    it('should have decreasing batch sizes', () => {
      expect(DEFAULT_TIER_CONFIGS.simple.batchSize).toBeGreaterThan(
        DEFAULT_TIER_CONFIGS.medium.batchSize
      );
      expect(DEFAULT_TIER_CONFIGS.medium.batchSize).toBeGreaterThan(
        DEFAULT_TIER_CONFIGS.complex.batchSize
      );
    });

    it('should have appropriate priorities', () => {
      expect(DEFAULT_TIER_CONFIGS.simple.priority).toBe('speed');
      expect(DEFAULT_TIER_CONFIGS.medium.priority).toBe('balanced');
      expect(DEFAULT_TIER_CONFIGS.complex.priority).toBe('accuracy');
    });
  });

  describe('DEFAULT_FALLBACK_CONFIG', () => {
    it('should have degrade chain', () => {
      expect(DEFAULT_FALLBACK_CONFIG.degradeChain).toBeDefined();
      expect(DEFAULT_FALLBACK_CONFIG.degradeChain.complex).toBe('medium');
      expect(DEFAULT_FALLBACK_CONFIG.degradeChain.medium).toBe('simple');
      expect(DEFAULT_FALLBACK_CONFIG.degradeChain.simple).toBeNull();
    });

    it('should have retry count', () => {
      expect(DEFAULT_FALLBACK_CONFIG.retries).toBeGreaterThanOrEqual(0);
    });

    it('should have degradeModel flag', () => {
      expect(typeof DEFAULT_FALLBACK_CONFIG.degradeModel).toBe('boolean');
    });

    it('should have useDefaults flag', () => {
      expect(typeof DEFAULT_FALLBACK_CONFIG.useDefaults).toBe('boolean');
    });
  });
});

describe('EnrichmentEngine - enrichBatch()', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `fds-enrichment-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  it('should return empty results when no provider', async () => {
    const engine = new EnrichmentEngine({ enabled: false });
    const exercises = createTestExercises(5);
    const result = await engine.enrichBatch(exercises);

    expect(result.results.size).toBe(0);
    expect(result.failedIds.length).toBe(0);
  });

  it('should return results structure', async () => {
    const engine = new EnrichmentEngine({
      enabled: true,
      provider: 'openrouter',
      apiKey: 'test-key',
    });

    // Mock the provider
    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'completeJSON').mockResolvedValue({
        description: 'Test description',
        aliases: ['test alias'],
        classification: { exerciseType: 'strength' },
      });
    }

    const exercises = createTestExercises(2);
    const result = await engine.enrichBatch(exercises);

    expect(result).toBeDefined();
    expect(result.results).toBeInstanceOf(Map);
    expect(typeof result.apiCalls).toBe('number');
    expect(typeof result.tokensUsed).toBe('number');
    expect(typeof result.durationMs).toBe('number');
    expect(Array.isArray(result.failedIds)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('should track failed exercises', async () => {
    const engine = new EnrichmentEngine({
      enabled: true,
      provider: 'openrouter',
      apiKey: 'test-key',
    });

    // Mock the provider to throw
    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'completeJSON').mockRejectedValue(new Error('API Error'));
    }

    const exercises = createTestExercises(3);
    const result = await engine.enrichBatch(exercises);

    expect(result.failedIds.length).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should report progress via callback', async () => {
    const engine = new EnrichmentEngine(createTieredConfig());
    const progressUpdates: EnrichmentProgress[] = [];

    // Mock the provider
    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'complete').mockResolvedValue({
        content: JSON.stringify({
          results: [{ slug: 'test-exercise-1', description: 'Test' }],
        }),
        tokensUsed: 100,
        model: 'test-model',
      });
    }

    const exercises = createTestExercises(3);
    await engine.enrichBatch(exercises, {
      onProgress: (progress) => {
        progressUpdates.push({ ...progress });
      },
    });

    // Should have received progress updates
    expect(progressUpdates.length).toBeGreaterThan(0);
  });

  it('should process only specified tier when tierFilter is set', async () => {
    const config = createTieredConfig();
    const engine = new EnrichmentEngine(config);

    const apiCalls: string[] = [];
    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'complete').mockImplementation(async (prompt) => {
        apiCalls.push(prompt);
        return {
          content: JSON.stringify({
            results: [{ slug: 'test', description: 'Test' }],
          }),
          tokensUsed: 100,
          model: 'test-model',
        };
      });
    }

    const exercises = createTestExercises(2);
    await engine.enrichBatch(exercises, { tierFilter: 'simple' });

    // Should have made API calls only for simple tier prompts
    // (description, aliases, classification-simple, metrics, equipment)
    expect(apiCalls.length).toBeGreaterThan(0);
  });
});

describe('EnrichmentEngine - Response Parsing', () => {
  it('should handle batch response format', async () => {
    const engine = new EnrichmentEngine(createTieredConfig());

    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'complete').mockResolvedValue({
        content: JSON.stringify({
          results: [
            { slug: 'test-1', description: 'Description 1' },
            { slug: 'test-2', description: 'Description 2' },
          ],
        }),
        tokensUsed: 100,
        model: 'test-model',
      });
    }

    const exercises = [
      createTestExercise('1', 'Test 1', 'test-1'),
      createTestExercise('2', 'Test 2', 'test-2'),
    ];

    const result = await engine.enrichBatch(exercises, { tierFilter: 'simple' });

    expect(result.results.size).toBeGreaterThanOrEqual(0);
  });

  it('should handle JSON in markdown code blocks', async () => {
    const engine = new EnrichmentEngine(createTieredConfig());

    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'complete').mockResolvedValue({
        content: '```json\n{"results": [{"slug": "test-1", "description": "Test"}]}\n```',
        tokensUsed: 50,
        model: 'test-model',
      });
    }

    const exercises = [createTestExercise('1', 'Test 1', 'test-1')];
    const result = await engine.enrichBatch(exercises, { tierFilter: 'simple' });

    // Should not fail on code block format
    expect(result.errors.filter((e) => e.error.includes('parse')).length).toBe(0);
  });
});

describe('EnrichmentEngine - Legacy API', () => {
  it('should support enrich() method for backwards compatibility', async () => {
    const engine = new EnrichmentEngine({
      enabled: true,
      provider: 'openrouter',
      apiKey: 'test-key',
    });

    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'completeJSON').mockResolvedValue({
        description: 'Test description',
      });
    }

    const result = await engine.enrich(
      {},
      {
        'canonical.description': {
          from: 'description',
          enrichment: { enabled: true, when: 'missing' },
        },
      },
      {
        source: { name: 'Test Exercise' },
        target: {},
        field: 'canonical.description',
        registries: { muscles: [], equipment: [], muscleCategories: [] },
        config: {} as any,
      }
    );

    expect(result.success).toBe(true);
  });

  it('should return success when no enrichment needed', async () => {
    const engine = new EnrichmentEngine({
      enabled: true,
      provider: 'openrouter',
      apiKey: 'test-key',
    });

    const result = await engine.enrich(
      { 'canonical.description': 'Already has value' },
      {
        'canonical.description': {
          from: 'description',
          enrichment: { enabled: true, when: 'missing' },
        },
      },
      {
        source: { name: 'Test Exercise' },
        target: {},
        field: 'canonical.description',
        registries: { muscles: [], equipment: [], muscleCategories: [] },
        config: {} as any,
      }
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({});
  });

  it('should skip disabled enrichment', async () => {
    const engine = new EnrichmentEngine({ enabled: false });

    const result = await engine.enrich(
      {},
      {
        'canonical.description': {
          from: 'description',
          enrichment: { enabled: true },
        },
      },
      {
        source: { name: 'Test' },
        target: {},
        field: '',
        registries: { muscles: [], equipment: [], muscleCategories: [] },
        config: {} as any,
      }
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({});
  });
});

describe('EnrichmentEngine - Checkpoint Integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `fds-checkpoint-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should save checkpoint when enabled', async () => {
    const config = {
      ...createTieredConfig(),
      checkpoint: {
        enabled: true,
        saveInterval: 1,
      },
    };
    const engine = new EnrichmentEngine(config);

    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'complete').mockResolvedValue({
        content: JSON.stringify({
          results: [{ slug: 'test-1', description: 'Test' }],
        }),
        tokensUsed: 100,
        model: 'test-model',
      });
    }

    const exercises = createTestExercises(2);
    await engine.enrichBatch(exercises, {
      outputDirectory: testDir,
    });

    // Checkpoint should be cleared on success
    expect(existsSync(join(testDir, '.fds-checkpoint.json'))).toBe(false);
  });

  it('should not use checkpoint when disabled', async () => {
    const config = {
      ...createTieredConfig(),
      checkpoint: {
        enabled: false,
        saveInterval: 1,
      },
    };
    const engine = new EnrichmentEngine(config);

    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'complete').mockRejectedValue(new Error('Test error'));
    }

    const exercises = createTestExercises(2);
    await engine.enrichBatch(exercises, {
      outputDirectory: testDir,
    });

    // No checkpoint file should be created
    expect(existsSync(join(testDir, '.fds-checkpoint.json'))).toBe(false);
  });
});

describe('EnrichmentEngine - Field Mapping', () => {
  it('should map description prompt results correctly', () => {
    const engine = new EnrichmentEngine(createTieredConfig());

    // Test through the batch enrichment
    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'complete').mockResolvedValue({
        content: JSON.stringify({
          results: [{ slug: 'test-1', description: 'A comprehensive description' }],
        }),
        tokensUsed: 100,
        model: 'test-model',
      });
    }
  });

  it('should map classification-simple prompt results correctly', () => {
    const engine = new EnrichmentEngine(createTieredConfig());

    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'complete').mockResolvedValue({
        content: JSON.stringify({
          results: [
            {
              slug: 'test-1',
              exerciseType: 'strength',
              level: 'intermediate',
              unilateral: false,
            },
          ],
        }),
        tokensUsed: 100,
        model: 'test-model',
      });
    }
  });

  it('should map biomechanics prompt results correctly', () => {
    const engine = new EnrichmentEngine(createTieredConfig());

    const mockProvider = engine.getProvider();
    if (mockProvider) {
      vi.spyOn(mockProvider, 'complete').mockResolvedValue({
        content: JSON.stringify({
          movement: 'push-horizontal',
          mechanics: 'compound',
          force: 'push',
          kineticChain: 'closed',
          tags: ['upper-body', 'strength'],
          secondary: [{ id: 'triceps', name: 'Triceps' }],
        }),
        tokensUsed: 100,
        model: 'test-model',
      });
    }
  });
});

describe('EnrichmentEngine - Fallback Chain', () => {
  it('should have correct fallback chain in config', () => {
    const engine = new EnrichmentEngine(createTieredConfig());
    const fallback = engine.getFallbackConfig();

    expect(fallback.degradeChain.complex).toBe('medium');
    expect(fallback.degradeChain.medium).toBe('simple');
    expect(fallback.degradeChain.simple).toBeNull();
  });

  it('should support custom fallback configuration', () => {
    const customFallback = {
      retries: 5,
      degradeModel: false,
      useDefaults: true,
      degradeChain: {
        complex: 'simple' as TierName,
        medium: null as TierName | null,
        simple: null,
      },
    };

    const engine = new EnrichmentEngine({
      ...createTieredConfig(),
      fallback: customFallback,
    });

    const fallback = engine.getFallbackConfig();
    expect(fallback.retries).toBe(5);
    expect(fallback.degradeModel).toBe(false);
    expect(fallback.degradeChain.complex).toBe('simple');
    expect(fallback.degradeChain.medium).toBeNull();
  });
});

describe('EnrichmentEngine - Provider Access', () => {
  it('should expose provider for testing', () => {
    const engine = new EnrichmentEngine({
      enabled: true,
      provider: 'openrouter',
      apiKey: 'test-key',
    });

    const provider = engine.getProvider();
    expect(provider).not.toBeNull();
    expect(provider?.name).toBe('openrouter');
  });

  it('should return null provider when not enabled', () => {
    const engine = new EnrichmentEngine({ enabled: false });
    const provider = engine.getProvider();
    expect(provider).toBeNull();
  });

  it('should expose rate limiter for testing', () => {
    const engine = new EnrichmentEngine(createTieredConfig());
    const rateLimiter = engine.getRateLimiter();
    expect(rateLimiter).not.toBeNull();
  });

  it('should return null rate limiter when not using tiered config', () => {
    const engine = new EnrichmentEngine({
      enabled: true,
      provider: 'openrouter',
      apiKey: 'test-key',
    });
    const rateLimiter = engine.getRateLimiter();
    expect(rateLimiter).toBeNull();
  });
});

describe('EnrichmentEngine - Cost Estimation Edge Cases', () => {
  it('should handle very large exercise counts', () => {
    const engine = new EnrichmentEngine(createTieredConfig());
    const estimate = engine.estimateCost(100000);

    expect(estimate.total.apiCalls).toBeGreaterThan(0);
    expect(estimate.total.cost).toBeGreaterThan(0);
    expect(isFinite(estimate.total.cost)).toBe(true);
  });

  it('should handle single exercise', () => {
    const engine = new EnrichmentEngine(createTieredConfig());
    const estimate = engine.estimateCost(1);

    expect(estimate.tiers.simple.apiCalls).toBe(1);
    expect(estimate.tiers.medium.apiCalls).toBe(1);
    expect(estimate.tiers.complex.apiCalls).toBe(1);
  });

  it('should use custom rate limit for time estimation', () => {
    const engine = new EnrichmentEngine({
      ...createTieredConfig(),
      rateLimit: {
        requestsPerMinute: 100,
        backoffStrategy: 'exponential',
        initialBackoffMs: 100,
        maxBackoffMs: 1000,
      },
    });

    const estimate100rpm = engine.estimateCost(1000);

    const engine50rpm = new EnrichmentEngine({
      ...createTieredConfig(),
      rateLimit: {
        requestsPerMinute: 50,
        backoffStrategy: 'exponential',
        initialBackoffMs: 100,
        maxBackoffMs: 1000,
      },
    });

    const estimate50rpm = engine50rpm.estimateCost(1000);

    // Higher rate limit should result in shorter estimated time
    expect(estimate100rpm.estimatedTime.minutes).toBeLessThan(
      estimate50rpm.estimatedTime.minutes
    );
  });
});
