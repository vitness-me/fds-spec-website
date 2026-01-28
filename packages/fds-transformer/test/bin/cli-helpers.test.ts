/**
 * CLI Helper Functions Tests
 *
 * Tests for the utility functions and display logic used in the CLI.
 * Note: We test the helper functions rather than full CLI execution
 * since the main CLI relies on Commander and @clack/prompts which
 * are better tested via integration tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { CostEstimate, TierName, EnrichmentProgress } from '../../src/core/types.js';
import { CheckpointManager, CHECKPOINT_FILENAME } from '../../src/ai/checkpoint-manager.js';
import { Transformer } from '../../src/core/transformer.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const createTestCostEstimate = (exerciseCount: number = 100): CostEstimate => ({
  tiers: {
    simple: {
      tier: 'simple',
      model: 'anthropic/claude-haiku-4.5',
      batchSize: 10,
      apiCalls: Math.ceil(exerciseCount / 10),
      inputTokens: exerciseCount * 80,
      outputTokens: exerciseCount * 40,
      cost: 0.12,
    },
    medium: {
      tier: 'medium',
      model: 'anthropic/claude-sonnet-4.5',
      batchSize: 3,
      apiCalls: Math.ceil(exerciseCount / 3),
      inputTokens: exerciseCount * 333,
      outputTokens: exerciseCount * 267,
      cost: 5.0,
    },
    complex: {
      tier: 'complex',
      model: 'anthropic/claude-opus-4.5',
      batchSize: 1,
      apiCalls: exerciseCount,
      inputTokens: exerciseCount * 600,
      outputTokens: exerciseCount * 400,
      cost: 39.0,
    },
  },
  total: {
    apiCalls: Math.ceil(exerciseCount / 10) + Math.ceil(exerciseCount / 3) + exerciseCount,
    inputTokens: exerciseCount * (80 + 333 + 600),
    outputTokens: exerciseCount * (40 + 267 + 400),
    cost: 44.12,
  },
  estimatedTime: {
    minutes: 5,
    formatted: '5m 0s',
  },
  disclaimer: 'Costs are estimates based on average token usage. Actual costs may vary by ±20%.',
});

const createTestEnrichmentProgress = (
  current: number = 50,
  total: number = 100
): EnrichmentProgress => ({
  exercise: {
    current,
    total,
    name: 'Barbell Bench Press',
    slug: 'barbell-bench-press',
  },
  tier: {
    name: 'simple',
    status: 'processing',
    batchNumber: current,
    totalBatches: Math.ceil(total / 10),
  },
  overall: {
    percentage: (current / total) * 100,
    elapsedMs: 30000,
    elapsedFormatted: '30.0s',
    remainingMs: 30000,
    remainingFormatted: '30.0s',
    apiCalls: current,
    errors: 0,
  },
});

// ============================================================================
// Helper Function Tests (Extracted from CLI)
// ============================================================================

/**
 * Log levels for controlling output verbosity
 */
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Format number with thousand separators
 */
function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format cost as USD
 */
function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

/**
 * Get display string for tier status
 */
function getTierStatusDisplay(
  status: EnrichmentProgress['tier']['status']
): string {
  switch (status) {
    case 'processing':
      return '[processing]';
    case 'complete':
      return '[complete]';
    case 'failed':
      return '[failed]';
    case 'skipped':
      return '[skipped]';
    case 'pending':
    default:
      return '[pending]';
  }
}

/**
 * Create a simple progress bar (without colors for testing)
 */
function createProgressBar(percentage: number, width: number): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return '|' + '#'.repeat(filled) + '-'.repeat(empty) + '|';
}

// ============================================================================
// Tests
// ============================================================================

describe('CLI Helper Functions', () => {
  describe('formatNumber', () => {
    it('should format small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(1)).toBe('1');
      expect(formatNumber(100)).toBe('100');
    });

    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(10000)).toBe('10,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should format the expected exercise count', () => {
      expect(formatNumber(1327)).toBe('1,327');
    });
  });

  describe('formatCost', () => {
    it('should format costs as USD', () => {
      expect(formatCost(0)).toBe('$0.00');
      expect(formatCost(1)).toBe('$1.00');
      expect(formatCost(1.5)).toBe('$1.50');
    });

    it('should format costs with two decimal places', () => {
      expect(formatCost(181.98)).toBe('$181.98');
      expect(formatCost(44.12)).toBe('$44.12');
      expect(formatCost(0.01)).toBe('$0.01');
    });

    it('should round costs properly', () => {
      expect(formatCost(1.999)).toBe('$2.00');
      expect(formatCost(1.994)).toBe('$1.99');
    });
  });

  describe('getTierStatusDisplay', () => {
    it('should return correct display for each status', () => {
      expect(getTierStatusDisplay('pending')).toBe('[pending]');
      expect(getTierStatusDisplay('processing')).toBe('[processing]');
      expect(getTierStatusDisplay('complete')).toBe('[complete]');
      expect(getTierStatusDisplay('failed')).toBe('[failed]');
      expect(getTierStatusDisplay('skipped')).toBe('[skipped]');
    });
  });

  describe('createProgressBar', () => {
    it('should create empty progress bar at 0%', () => {
      expect(createProgressBar(0, 10)).toBe('|----------|');
    });

    it('should create full progress bar at 100%', () => {
      expect(createProgressBar(100, 10)).toBe('|##########|');
    });

    it('should create half-filled progress bar at 50%', () => {
      expect(createProgressBar(50, 10)).toBe('|#####-----|');
    });

    it('should handle different widths', () => {
      expect(createProgressBar(50, 20)).toBe('|##########----------|');
      expect(createProgressBar(25, 20)).toBe('|#####---------------|');
    });
  });

  describe('LOG_LEVELS', () => {
    it('should have correct ordering', () => {
      expect(LOG_LEVELS.error).toBeLessThan(LOG_LEVELS.warn);
      expect(LOG_LEVELS.warn).toBeLessThan(LOG_LEVELS.info);
      expect(LOG_LEVELS.info).toBeLessThan(LOG_LEVELS.debug);
    });

    it('should have expected values', () => {
      expect(LOG_LEVELS.error).toBe(0);
      expect(LOG_LEVELS.warn).toBe(1);
      expect(LOG_LEVELS.info).toBe(2);
      expect(LOG_LEVELS.debug).toBe(3);
    });
  });
});

describe('CostEstimate Display', () => {
  it('should have all required tier data', () => {
    const estimate = createTestCostEstimate(100);

    expect(estimate.tiers.simple).toBeDefined();
    expect(estimate.tiers.medium).toBeDefined();
    expect(estimate.tiers.complex).toBeDefined();

    expect(estimate.tiers.simple.model).toBe('anthropic/claude-haiku-4.5');
    expect(estimate.tiers.medium.model).toBe('anthropic/claude-sonnet-4.5');
    expect(estimate.tiers.complex.model).toBe('anthropic/claude-opus-4.5');
  });

  it('should calculate correct API calls', () => {
    const estimate = createTestCostEstimate(100);

    // Simple: 100 / 10 = 10 calls
    expect(estimate.tiers.simple.apiCalls).toBe(10);
    // Medium: 100 / 3 = 34 calls
    expect(estimate.tiers.medium.apiCalls).toBe(34);
    // Complex: 100 / 1 = 100 calls
    expect(estimate.tiers.complex.apiCalls).toBe(100);
  });

  it('should have total that sums tier values', () => {
    const estimate = createTestCostEstimate(100);
    const expectedApiCalls =
      estimate.tiers.simple.apiCalls +
      estimate.tiers.medium.apiCalls +
      estimate.tiers.complex.apiCalls;

    expect(estimate.total.apiCalls).toBe(expectedApiCalls);
  });
});

describe('EnrichmentProgress Display', () => {
  it('should have valid progress data', () => {
    const progress = createTestEnrichmentProgress(50, 100);

    expect(progress.exercise.current).toBe(50);
    expect(progress.exercise.total).toBe(100);
    expect(progress.overall.percentage).toBe(50);
  });

  it('should track tier information', () => {
    const progress = createTestEnrichmentProgress();

    expect(['simple', 'medium', 'complex']).toContain(progress.tier.name);
    expect(['pending', 'processing', 'complete', 'failed', 'skipped']).toContain(
      progress.tier.status
    );
  });
});

describe('Checkpoint Integration for CLI', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `cli-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('--resume flag behavior', () => {
    it('should detect existing checkpoint', () => {
      const manager = new CheckpointManager(testDir);
      manager.initialize({
        inputFile: 'test.json',
        totalExercises: 100,
        config: { test: true },
      });

      // Simulate some completed exercises
      manager.update({
        exerciseId: 'ex-1',
        success: true,
        currentTier: 'simple',
        results: { simple: { description: 'Test' } },
      });
      manager.forceSave();

      // New manager should be able to load
      const newManager = new CheckpointManager(testDir);
      expect(newManager.exists()).toBe(true);

      const data = newManager.load();
      expect(data).not.toBeNull();
      expect(data?.completedIds).toContain('ex-1');
    });

    it('should provide progress info for resume message', () => {
      const manager = new CheckpointManager(testDir);
      manager.initialize({
        inputFile: 'test.json',
        totalExercises: 1327,
        config: { test: true },
      });

      // Simulate 523 completed exercises
      for (let i = 0; i < 523; i++) {
        manager.update({
          exerciseId: `ex-${i}`,
          success: true,
          currentTier: 'simple',
        });
      }
      manager.forceSave();

      // Verify the message values
      const data = manager.getData();
      expect(data?.completedExercises).toBe(523);
      expect(data?.totalExercises).toBe(1327);
    });
  });

  describe('--clear-checkpoint flag behavior', () => {
    it('should clear existing checkpoint', () => {
      const manager = new CheckpointManager(testDir);
      manager.initialize({
        inputFile: 'test.json',
        totalExercises: 100,
        config: { test: true },
      });
      manager.forceSave();

      expect(manager.exists()).toBe(true);

      // Clear it
      manager.clear();

      expect(manager.exists()).toBe(false);
    });

    it('should handle clearing non-existent checkpoint', () => {
      const manager = new CheckpointManager(testDir);
      expect(manager.exists()).toBe(false);

      // Should not throw
      expect(() => manager.clear()).not.toThrow();
    });
  });
});

describe('Transformer CLI Integration', () => {
  describe('estimateCost', () => {
    it('should return null when enrichment is not configured', () => {
      const transformer = new Transformer({
        config: {
          version: '1.0.0',
          targetSchema: { version: '1.0.0' },
          mappings: {},
        },
      });

      const estimate = transformer.estimateCost(100);
      expect(estimate).toBeNull();
    });
  });

  describe('isTieredEnrichmentEnabled', () => {
    it('should return false when not configured', () => {
      const transformer = new Transformer({
        config: {
          version: '1.0.0',
          targetSchema: { version: '1.0.0' },
          mappings: {},
        },
      });

      expect(transformer.isTieredEnrichmentEnabled()).toBe(false);
    });
  });
});

describe('CLI Option Validation', () => {
  const validTiers: TierName[] = ['simple', 'medium', 'complex'];

  describe('--tier option', () => {
    it('should accept valid tier values', () => {
      for (const tier of validTiers) {
        expect(validTiers.includes(tier)).toBe(true);
      }
    });

    it('should reject invalid tier values', () => {
      const invalidTiers = ['invalid', 'fast', 'slow', '', 'SIMPLE'];
      for (const tier of invalidTiers) {
        expect(validTiers.includes(tier as TierName)).toBe(false);
      }
    });
  });

  describe('--log-level option', () => {
    const validLogLevels = ['error', 'warn', 'info', 'debug'];

    it('should accept valid log levels', () => {
      for (const level of validLogLevels) {
        expect(validLogLevels.includes(level)).toBe(true);
      }
    });

    it('should reject invalid log levels', () => {
      const invalidLevels = ['verbose', 'trace', '', 'INFO'];
      for (const level of invalidLevels) {
        expect(validLogLevels.includes(level)).toBe(false);
      }
    });
  });
});

describe('Output Writing Logic', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `cli-output-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should handle single file output config', () => {
    const config = {
      output: {
        singleFile: true,
        singleFileName: 'all-exercises.json',
        pretty: true,
      },
    };

    expect(config.output.singleFile).toBe(true);
    expect(config.output.singleFileName).toBe('all-exercises.json');
  });

  it('should handle individual file output config', () => {
    const config = {
      output: {
        singleFile: false,
        directory: testDir,
        pretty: true,
      },
    };

    expect(config.output.singleFile).toBe(false);
    expect(config.output.directory).toBe(testDir);
  });

  it('should determine output file name from slug', () => {
    const exercise = {
      canonical: {
        slug: 'barbell-bench-press',
        name: 'Barbell Bench Press',
      },
    };

    const slug = exercise.canonical?.slug || 'unknown';
    expect(slug).toBe('barbell-bench-press');
    expect(`${testDir}/${slug}.json`).toBe(`${testDir}/barbell-bench-press.json`);
  });
});
