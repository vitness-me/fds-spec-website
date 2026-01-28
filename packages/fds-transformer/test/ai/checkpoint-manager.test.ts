/**
 * Checkpoint Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  CheckpointManager,
  CHECKPOINT_FILENAME,
  ENRICHMENT_LOG_FILENAME,
  CHECKPOINT_VERSION,
  DEFAULT_CHECKPOINT_CONFIG,
} from '../../src/ai/checkpoint-manager.js';
import type { CheckpointData } from '../../src/core/types.js';

describe('CheckpointManager', () => {
  let testDir: string;
  let manager: CheckpointManager;

  beforeEach(() => {
    // Create unique test directory
    testDir = join(tmpdir(), `fds-checkpoint-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    manager = new CheckpointManager(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should use default config when none provided', () => {
      const mgr = new CheckpointManager(testDir);
      expect(mgr.isEnabled()).toBe(DEFAULT_CHECKPOINT_CONFIG.enabled);
      expect(mgr.getSaveInterval()).toBe(DEFAULT_CHECKPOINT_CONFIG.saveInterval);
    });

    it('should merge provided config with defaults', () => {
      const mgr = new CheckpointManager(testDir, { saveInterval: 5 });
      expect(mgr.getSaveInterval()).toBe(5);
      expect(mgr.isEnabled()).toBe(true);
    });

    it('should accept full config', () => {
      const mgr = new CheckpointManager(testDir, { enabled: false, saveInterval: 20 });
      expect(mgr.isEnabled()).toBe(false);
      expect(mgr.getSaveInterval()).toBe(20);
    });

    it('should set correct paths', () => {
      const mgr = new CheckpointManager(testDir);
      expect(mgr.getCheckpointPath()).toBe(join(testDir, CHECKPOINT_FILENAME));
      expect(mgr.getLogFilePath()).toBe(join(testDir, ENRICHMENT_LOG_FILENAME));
    });
  });

  describe('exists()', () => {
    it('should return false when no checkpoint exists', () => {
      expect(manager.exists()).toBe(false);
    });

    it('should return true when checkpoint exists', () => {
      manager.initialize({
        inputFile: 'test.json',
        totalExercises: 10,
        config: { test: true },
      });
      expect(manager.exists()).toBe(true);
    });
  });

  describe('initialize()', () => {
    it('should create new checkpoint', () => {
      const data = manager.initialize({
        inputFile: 'exercises.json',
        totalExercises: 100,
        config: { model: 'test' },
      });

      expect(data).toBeDefined();
      expect(data.version).toBe(CHECKPOINT_VERSION);
      expect(data.inputFile).toBe('exercises.json');
      expect(data.totalExercises).toBe(100);
      expect(data.completedExercises).toBe(0);
      expect(data.completedIds).toEqual([]);
      expect(data.failedIds).toEqual([]);
      expect(data.currentTier).toBe('simple');
      expect(data.results).toEqual({});
    });

    it('should save checkpoint to file', () => {
      manager.initialize({
        inputFile: 'test.json',
        totalExercises: 50,
        config: {},
      });

      expect(existsSync(manager.getCheckpointPath())).toBe(true);
    });

    it('should set timestamps', () => {
      const before = new Date().toISOString();
      const data = manager.initialize({
        inputFile: 'test.json',
        totalExercises: 10,
        config: {},
      });
      const after = new Date().toISOString();

      expect(data.startedAt >= before).toBe(true);
      expect(data.startedAt <= after).toBe(true);
      expect(data.lastUpdatedAt >= data.startedAt).toBe(true);
      expect(data.lastUpdatedAt <= after).toBe(true);
    });

    it('should hash config for change detection', () => {
      const data1 = manager.initialize({
        inputFile: 'test.json',
        totalExercises: 10,
        config: { a: 1, b: 2 },
      });

      // New manager with same config should have same hash
      const manager2 = new CheckpointManager(join(testDir, 'other'));
      const data2 = manager2.initialize({
        inputFile: 'test.json',
        totalExercises: 10,
        config: { a: 1, b: 2 },
      });

      expect(data1.configHash).toBe(data2.configHash);
    });

    it('should produce different hash for different config', () => {
      const data1 = manager.initialize({
        inputFile: 'test.json',
        totalExercises: 10,
        config: { a: 1 },
      });

      const manager2 = new CheckpointManager(join(testDir, 'other'));
      const data2 = manager2.initialize({
        inputFile: 'test.json',
        totalExercises: 10,
        config: { a: 2 },
      });

      expect(data1.configHash).not.toBe(data2.configHash);
    });

    it('should create output directory if it does not exist', () => {
      const nestedDir = join(testDir, 'nested', 'deep', 'output');
      const mgr = new CheckpointManager(nestedDir);

      mgr.initialize({
        inputFile: 'test.json',
        totalExercises: 10,
        config: {},
      });

      expect(existsSync(nestedDir)).toBe(true);
    });
  });

  describe('load()', () => {
    it('should return null when no checkpoint exists', () => {
      expect(manager.load()).toBeNull();
    });

    it('should load existing checkpoint', () => {
      // Create checkpoint
      manager.initialize({
        inputFile: 'exercises.json',
        totalExercises: 100,
        config: { test: true },
      });

      // New manager should load it
      const manager2 = new CheckpointManager(testDir);
      const loaded = manager2.load();

      expect(loaded).not.toBeNull();
      expect(loaded!.inputFile).toBe('exercises.json');
      expect(loaded!.totalExercises).toBe(100);
    });

    it('should return null for corrupted JSON', () => {
      writeFileSync(manager.getCheckpointPath(), 'not valid json {{{');
      expect(manager.load()).toBeNull();
    });

    it('should return null for invalid checkpoint structure', () => {
      writeFileSync(manager.getCheckpointPath(), JSON.stringify({ foo: 'bar' }));
      expect(manager.load()).toBeNull();
    });

    it('should return null for missing required fields', () => {
      writeFileSync(
        manager.getCheckpointPath(),
        JSON.stringify({
          version: '1.0.0',
          // missing configHash and completedIds
        })
      );
      expect(manager.load()).toBeNull();
    });
  });

  describe('validate()', () => {
    it('should return invalid when no checkpoint loaded', () => {
      const result = manager.validate({ test: true });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('No checkpoint loaded');
    });

    it('should return valid when config hash matches', () => {
      const config = { model: 'test-model', temperature: 0.5 };
      manager.initialize({
        inputFile: 'test.json',
        totalExercises: 10,
        config,
      });

      const result = manager.validate(config);
      expect(result.valid).toBe(true);
      expect(result.configMatches).toBe(true);
    });

    it('should return invalid when config has changed', () => {
      manager.initialize({
        inputFile: 'test.json',
        totalExercises: 10,
        config: { model: 'original' },
      });

      const result = manager.validate({ model: 'changed' });
      expect(result.valid).toBe(false);
      expect(result.configMatches).toBe(false);
      expect(result.reason).toContain('Configuration has changed');
    });

    it('should return invalid for version mismatch', () => {
      // Create checkpoint with different version
      const checkpoint: CheckpointData = {
        version: '0.9.0',
        configHash: 'abc123',
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        inputFile: 'test.json',
        totalExercises: 10,
        completedExercises: 0,
        completedIds: [],
        failedIds: [],
        currentTier: 'simple',
        results: {},
      };
      writeFileSync(manager.getCheckpointPath(), JSON.stringify(checkpoint));
      manager.load();

      const result = manager.validate({});
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('version mismatch');
    });
  });

  describe('update()', () => {
    beforeEach(() => {
      manager.initialize({
        inputFile: 'test.json',
        totalExercises: 5,
        config: {},
      });
    });

    it('should throw when checkpoint not initialized', () => {
      const mgr = new CheckpointManager(join(testDir, 'empty'));
      expect(() =>
        mgr.update({
          exerciseId: 'ex1',
          success: true,
          currentTier: 'simple',
        })
      ).toThrow('Checkpoint not initialized');
    });

    it('should track successful completion', () => {
      manager.update({
        exerciseId: 'exercise-1',
        success: true,
        currentTier: 'simple',
      });

      expect(manager.getCompletedIds()).toContain('exercise-1');
      expect(manager.getFailedIds()).not.toContain('exercise-1');
    });

    it('should track failed exercises', () => {
      manager.update({
        exerciseId: 'exercise-1',
        success: false,
        currentTier: 'simple',
      });

      expect(manager.getFailedIds()).toContain('exercise-1');
      expect(manager.getCompletedIds()).not.toContain('exercise-1');
    });

    it('should update completed count', () => {
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });
      manager.update({ exerciseId: 'ex2', success: true, currentTier: 'simple' });
      manager.update({ exerciseId: 'ex3', success: true, currentTier: 'simple' });

      const data = manager.getData();
      expect(data!.completedExercises).toBe(3);
    });

    it('should not double-count exercises', () => {
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'medium' }); // Same exercise, different tier

      const data = manager.getData();
      expect(data!.completedExercises).toBe(1);
      expect(manager.getCompletedIds()).toEqual(['ex1']);
    });

    it('should remove from failed on retry success', () => {
      // First attempt fails
      manager.update({ exerciseId: 'ex1', success: false, currentTier: 'simple' });
      expect(manager.getFailedIds()).toContain('ex1');

      // Retry succeeds
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });
      expect(manager.getFailedIds()).not.toContain('ex1');
      expect(manager.getCompletedIds()).toContain('ex1');
    });

    it('should update current tier', () => {
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'medium' });
      expect(manager.getCurrentTier()).toBe('medium');

      manager.update({ exerciseId: 'ex2', success: true, currentTier: 'complex' });
      expect(manager.getCurrentTier()).toBe('complex');
    });

    it('should store partial results', () => {
      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'simple',
        results: {
          simple: { description: 'A test exercise', level: 'beginner' },
        },
      });

      const results = manager.getResults('ex1');
      expect(results).toEqual({
        simple: { description: 'A test exercise', level: 'beginner' },
      });
    });

    it('should merge results across tiers', () => {
      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'simple',
        results: { simple: { description: 'Test' } },
      });

      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'medium',
        results: { medium: { constraints: ['none'] } },
      });

      const results = manager.getResults('ex1');
      expect(results).toEqual({
        simple: { description: 'Test' },
        medium: { constraints: ['none'] },
      });
    });

    it('should merge fields within same tier', () => {
      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'simple',
        results: { simple: { description: 'Test' } },
      });

      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'simple',
        results: { simple: { level: 'beginner' } },
      });

      const results = manager.getResults('ex1');
      expect(results!.simple).toEqual({
        description: 'Test',
        level: 'beginner',
      });
    });

    it('should update timestamp', () => {
      const before = manager.getData()!.lastUpdatedAt;

      // Small delay to ensure different timestamp
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });

      const after = manager.getData()!.lastUpdatedAt;
      expect(after >= before).toBe(true);
    });
  });

  describe('save()', () => {
    beforeEach(() => {
      manager.initialize({
        inputFile: 'test.json',
        totalExercises: 5,
        config: {},
      });
    });

    it('should return false when no updates pending', () => {
      expect(manager.save()).toBe(false);
    });

    it('should return true when updates are saved', () => {
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });
      expect(manager.save()).toBe(true);
    });

    it('should persist changes to file', () => {
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });
      manager.save();

      // Read file directly
      const content = readFileSync(manager.getCheckpointPath(), 'utf-8');
      const data = JSON.parse(content) as CheckpointData;

      expect(data.completedIds).toContain('ex1');
    });

    it('should auto-save after saveInterval updates', () => {
      // Create manager with small saveInterval
      const mgr = new CheckpointManager(testDir, { saveInterval: 3 });
      mgr.initialize({ inputFile: 'test.json', totalExercises: 10, config: {} });

      // First two updates don't trigger save
      mgr.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });
      mgr.update({ exerciseId: 'ex2', success: true, currentTier: 'simple' });

      let content = readFileSync(mgr.getCheckpointPath(), 'utf-8');
      let data = JSON.parse(content) as CheckpointData;
      expect(data.completedIds).toEqual([]); // Not saved yet

      // Third update triggers auto-save
      mgr.update({ exerciseId: 'ex3', success: true, currentTier: 'simple' });

      content = readFileSync(mgr.getCheckpointPath(), 'utf-8');
      data = JSON.parse(content) as CheckpointData;
      expect(data.completedIds).toContain('ex1');
      expect(data.completedIds).toContain('ex2');
      expect(data.completedIds).toContain('ex3');
    });
  });

  describe('forceSave()', () => {
    it('should do nothing when no data', () => {
      // Should not throw
      manager.forceSave();
    });

    it('should save even without pending updates', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });

      // Modify data in memory but don't call update
      const data = manager.getData()!;
      expect(data.completedExercises).toBe(0);

      // Force save should still write current state
      manager.forceSave();

      const content = readFileSync(manager.getCheckpointPath(), 'utf-8');
      expect(content).toContain('"completedExercises": 0');
    });
  });

  describe('clear()', () => {
    it('should remove checkpoint file', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      expect(existsSync(manager.getCheckpointPath())).toBe(true);

      manager.clear();

      expect(existsSync(manager.getCheckpointPath())).toBe(false);
    });

    it('should reset internal state', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });

      manager.clear();

      expect(manager.getData()).toBeNull();
      expect(manager.getCompletedIds()).toEqual([]);
    });

    it('should handle non-existent file gracefully', () => {
      // Should not throw
      manager.clear();
      expect(manager.exists()).toBe(false);
    });
  });

  describe('getCompletedIds()', () => {
    it('should return empty array when no checkpoint', () => {
      expect(manager.getCompletedIds()).toEqual([]);
    });

    it('should return completed IDs', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });
      manager.update({ exerciseId: 'ex2', success: true, currentTier: 'simple' });
      manager.update({ exerciseId: 'ex3', success: false, currentTier: 'simple' });

      const ids = manager.getCompletedIds();
      expect(ids).toContain('ex1');
      expect(ids).toContain('ex2');
      expect(ids).not.toContain('ex3');
    });
  });

  describe('getFailedIds()', () => {
    it('should return empty array when no checkpoint', () => {
      expect(manager.getFailedIds()).toEqual([]);
    });

    it('should return failed IDs', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });
      manager.update({ exerciseId: 'ex2', success: false, currentTier: 'simple' });
      manager.update({ exerciseId: 'ex3', success: false, currentTier: 'simple' });

      const ids = manager.getFailedIds();
      expect(ids).not.toContain('ex1');
      expect(ids).toContain('ex2');
      expect(ids).toContain('ex3');
    });
  });

  describe('getResults()', () => {
    it('should return undefined for unknown exercise', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      expect(manager.getResults('unknown')).toBeUndefined();
    });

    it('should return results for exercise', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'simple',
        results: { simple: { foo: 'bar' } },
      });

      expect(manager.getResults('ex1')).toEqual({ simple: { foo: 'bar' } });
    });
  });

  describe('getAllResults()', () => {
    it('should return empty object when no checkpoint', () => {
      expect(manager.getAllResults()).toEqual({});
    });

    it('should return all results', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'simple',
        results: { simple: { a: 1 } },
      });
      manager.update({
        exerciseId: 'ex2',
        success: true,
        currentTier: 'medium',
        results: { medium: { b: 2 } },
      });

      const all = manager.getAllResults();
      expect(all.ex1).toEqual({ simple: { a: 1 } });
      expect(all.ex2).toEqual({ medium: { b: 2 } });
    });
  });

  describe('getLogFilePath()', () => {
    it('should return correct log file path', () => {
      expect(manager.getLogFilePath()).toBe(join(testDir, ENRICHMENT_LOG_FILENAME));
    });
  });

  describe('getCheckpointPath()', () => {
    it('should return correct checkpoint path', () => {
      expect(manager.getCheckpointPath()).toBe(join(testDir, CHECKPOINT_FILENAME));
    });
  });

  describe('getData()', () => {
    it('should return null when no checkpoint', () => {
      expect(manager.getData()).toBeNull();
    });

    it('should return copy of data', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });

      const data1 = manager.getData()!;
      const data2 = manager.getData()!;

      // Should be copies, not same reference
      expect(data1).not.toBe(data2);
      expect(data1).toEqual(data2);
    });
  });

  describe('getCurrentTier()', () => {
    it('should return null when no checkpoint', () => {
      expect(manager.getCurrentTier()).toBeNull();
    });

    it('should return current tier', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      expect(manager.getCurrentTier()).toBe('simple');

      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'complex' });
      expect(manager.getCurrentTier()).toBe('complex');
    });
  });

  describe('getProgress()', () => {
    it('should return 0 when no checkpoint', () => {
      expect(manager.getProgress()).toBe(0);
    });

    it('should return 0 when no exercises completed', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 10, config: {} });
      expect(manager.getProgress()).toBe(0);
    });

    it('should calculate percentage correctly', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 10, config: {} });

      manager.update({ exerciseId: 'ex1', success: true, currentTier: 'simple' });
      expect(manager.getProgress()).toBe(10);

      manager.update({ exerciseId: 'ex2', success: true, currentTier: 'simple' });
      expect(manager.getProgress()).toBe(20);

      manager.update({ exerciseId: 'ex3', success: true, currentTier: 'simple' });
      manager.update({ exerciseId: 'ex4', success: true, currentTier: 'simple' });
      manager.update({ exerciseId: 'ex5', success: true, currentTier: 'simple' });
      expect(manager.getProgress()).toBe(50);
    });

    it('should handle totalExercises of 0', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 0, config: {} });
      expect(manager.getProgress()).toBe(0);
    });
  });

  describe('isEnabled()', () => {
    it('should return config enabled value', () => {
      expect(new CheckpointManager(testDir, { enabled: true }).isEnabled()).toBe(true);
      expect(new CheckpointManager(testDir, { enabled: false }).isEnabled()).toBe(false);
    });
  });

  describe('getSaveInterval()', () => {
    it('should return config saveInterval value', () => {
      expect(new CheckpointManager(testDir, { saveInterval: 5 }).getSaveInterval()).toBe(5);
      expect(new CheckpointManager(testDir, { saveInterval: 100 }).getSaveInterval()).toBe(100);
    });
  });

  describe('resume workflow', () => {
    it('should support full resume workflow', () => {
      const config = { model: 'test', tiers: { simple: { batchSize: 10 } } };

      // Initial run - process some exercises
      manager.initialize({
        inputFile: 'exercises.json',
        totalExercises: 100,
        config,
      });

      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'simple',
        results: { simple: { description: 'Ex 1' } },
      });
      manager.update({
        exerciseId: 'ex2',
        success: true,
        currentTier: 'simple',
        results: { simple: { description: 'Ex 2' } },
      });
      manager.update({
        exerciseId: 'ex3',
        success: false,
        currentTier: 'simple',
      });

      manager.forceSave();

      // Simulate restart - new manager instance
      const resumeManager = new CheckpointManager(testDir);
      const loaded = resumeManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded!.completedExercises).toBe(2);

      // Validate config hasn't changed
      const validation = resumeManager.validate(config);
      expect(validation.valid).toBe(true);

      // Get IDs to skip
      const completedIds = resumeManager.getCompletedIds();
      expect(completedIds).toContain('ex1');
      expect(completedIds).toContain('ex2');
      expect(completedIds).not.toContain('ex3');

      // Get partial results to reuse
      const results = resumeManager.getAllResults();
      expect(results.ex1.simple.description).toBe('Ex 1');
      expect(results.ex2.simple.description).toBe('Ex 2');

      // Continue processing
      resumeManager.update({
        exerciseId: 'ex3',
        success: true,
        currentTier: 'simple',
        results: { simple: { description: 'Ex 3' } },
      });
      resumeManager.update({
        exerciseId: 'ex4',
        success: true,
        currentTier: 'simple',
        results: { simple: { description: 'Ex 4' } },
      });

      expect(resumeManager.getCompletedIds().length).toBe(4);
      expect(resumeManager.getFailedIds().length).toBe(0); // ex3 succeeded on retry
    });

    it('should detect config changes on resume', () => {
      manager.initialize({
        inputFile: 'exercises.json',
        totalExercises: 100,
        config: { model: 'claude-haiku' },
      });
      manager.forceSave();

      // Simulate restart with different config
      const resumeManager = new CheckpointManager(testDir);
      resumeManager.load();

      const validation = resumeManager.validate({ model: 'claude-opus' });
      expect(validation.valid).toBe(false);
      expect(validation.configMatches).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty results object', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'simple',
        results: {},
      });

      expect(manager.getResults('ex1')).toEqual({});
    });

    it('should handle deeply nested results', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'complex',
        results: {
          complex: {
            classification: {
              movement: 'squat',
              mechanics: 'compound',
              tags: ['strength', 'lower-body'],
            },
            targets: {
              secondary: [
                { id: 'm1', name: 'hamstrings' },
                { id: 'm2', name: 'glutes' },
              ],
            },
          },
        },
      });

      const results = manager.getResults('ex1');
      expect(results!.complex.classification).toEqual({
        movement: 'squat',
        mechanics: 'compound',
        tags: ['strength', 'lower-body'],
      });
    });

    it('should handle unicode in results', () => {
      manager.initialize({ inputFile: 'test.json', totalExercises: 5, config: {} });
      manager.update({
        exerciseId: 'ex1',
        success: true,
        currentTier: 'simple',
        results: {
          simple: {
            description: 'Čučanj sa šipkom - основно упражнение',
            aliases: ['スクワット', '深蹲'],
          },
        },
      });

      manager.forceSave();

      // Reload and verify
      const mgr2 = new CheckpointManager(testDir);
      mgr2.load();

      const results = mgr2.getResults('ex1');
      expect(results!.simple.description).toBe('Čučanj sa šipkom - основно упражнение');
      expect(results!.simple.aliases).toEqual(['スクワット', '深蹲']);
    });

    it('should handle config key ordering', () => {
      // Same config with different key order should produce same hash
      const config1 = { a: 1, b: 2, c: 3 };
      const config2 = { c: 3, a: 1, b: 2 };

      const mgr1 = new CheckpointManager(join(testDir, 'dir1'));
      const mgr2 = new CheckpointManager(join(testDir, 'dir2'));

      const data1 = mgr1.initialize({ inputFile: 'test.json', totalExercises: 5, config: config1 });
      const data2 = mgr2.initialize({ inputFile: 'test.json', totalExercises: 5, config: config2 });

      expect(data1.configHash).toBe(data2.configHash);
    });
  });
});
