/**
 * Tests for auto-generate transforms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timestamp, autoGenerate } from './auto-generate.js';
import type { TransformContext } from '../../core/types.js';

describe('timestamp', () => {
  describe('format options', () => {
    it('should generate ISO 8601 timestamp by default', () => {
      const result = timestamp(null, {});
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should generate ISO 8601 timestamp with iso8601 format', () => {
      const result = timestamp(null, { format: 'iso8601' });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should generate ISO 8601 timestamp with iso format', () => {
      const result = timestamp(null, { format: 'iso' });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should generate Unix timestamp with unix format', () => {
      const result = timestamp(null, { format: 'unix' });
      expect(result).toMatch(/^\d+$/);
      expect(parseInt(result, 10)).toBeGreaterThan(1600000000); // After 2020
    });

    it('should generate Unix timestamp in milliseconds with unixms format', () => {
      const result = timestamp(null, { format: 'unixms' });
      expect(result).toMatch(/^\d+$/);
      expect(parseInt(result, 10)).toBeGreaterThan(1600000000000); // After 2020 in ms
    });

    it('should generate date-only string with date format', () => {
      const result = timestamp(null, { format: 'date' });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should default to ISO 8601 for unknown format', () => {
      const result = timestamp(null, { format: 'unknown' });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe('input value handling', () => {
    it('should use current date when value is null', () => {
      const before = Date.now();
      const result = timestamp(null, {});
      const after = Date.now();
      const resultMs = new Date(result).getTime();
      expect(resultMs).toBeGreaterThanOrEqual(before);
      expect(resultMs).toBeLessThanOrEqual(after);
    });

    it('should use current date when value is undefined', () => {
      const result = timestamp(undefined, {});
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should parse and format provided date string', () => {
      const result = timestamp('2024-01-15T10:30:00.000Z', { format: 'date' });
      expect(result).toBe('2024-01-15');
    });

    it('should parse ISO date and output different format', () => {
      const result = timestamp('2024-01-15T10:30:00.000Z', { format: 'unix' });
      expect(result).toBe(String(Math.floor(new Date('2024-01-15T10:30:00.000Z').getTime() / 1000)));
    });
  });
});

describe('autoGenerate', () => {
  let mockContext: TransformContext;

  beforeEach(() => {
    mockContext = {
      source: {
        id: '0001',
        name: 'Test Exercise',
        nested: {
          value: 'nested-value'
        }
      },
      target: {},
      field: 'testField',
      registries: {}
    };
  });

  describe('now value', () => {
    it('should generate current timestamp for "now" value', () => {
      const result = autoGenerate(null, { createdAt: 'now' }, mockContext);
      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should generate multiple timestamps for multiple "now" values', () => {
      const result = autoGenerate(null, { 
        createdAt: 'now',
        updatedAt: 'now' 
      }, mockContext);
      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe('source value retrieval', () => {
    it('should retrieve value from source by key name', () => {
      const result = autoGenerate(null, { name: 'source' }, mockContext);
      // When value is 'source', it looks up the key name in source
      expect(result.name).toBe('Test Exercise');
    });

    it('should retrieve nested value from source with dot notation', () => {
      const result = autoGenerate(null, { 
        nestedVal: 'source.nested.value' 
      }, mockContext);
      expect(result.nestedVal).toBe('nested-value');
    });

    it('should retrieve specific field from source', () => {
      const result = autoGenerate(null, { 
        originalId: 'source.id' 
      }, mockContext);
      expect(result.originalId).toBe('0001');
    });
  });

  describe('static value handling', () => {
    it('should pass through static string values', () => {
      const result = autoGenerate(null, { 
        status: 'draft' 
      }, mockContext);
      expect(result.status).toBe('draft');
    });

    it('should pass through static number values', () => {
      const result = autoGenerate(null, { 
        version: 1 
      }, mockContext);
      expect(result.version).toBe(1);
    });

    it('should pass through static boolean values', () => {
      const result = autoGenerate(null, { 
        published: false 
      }, mockContext);
      expect(result.published).toBe(false);
    });

    it('should pass through static array values', () => {
      const result = autoGenerate(null, { 
        tags: ['fitness', 'strength'] 
      }, mockContext);
      expect(result.tags).toEqual(['fitness', 'strength']);
    });

    it('should pass through static object values', () => {
      const result = autoGenerate(null, { 
        meta: { key: 'value' } 
      }, mockContext);
      expect(result.meta).toEqual({ key: 'value' });
    });
  });

  describe('mixed options', () => {
    it('should handle mix of now, source, and static values', () => {
      const result = autoGenerate(null, {
        createdAt: 'now',
        originalName: 'source.name',
        status: 'active',
        version: 1
      }, mockContext);

      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(result.originalName).toBe('Test Exercise');
      expect(result.status).toBe('active');
      expect(result.version).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should return empty object when no options provided', () => {
      const result = autoGenerate(null, {}, mockContext);
      expect(result).toEqual({});
    });

    it('should handle missing source field gracefully', () => {
      const result = autoGenerate(null, { 
        missing: 'source.nonexistent.field' 
      }, mockContext);
      expect(result.missing).toBeUndefined();
    });

    it('should handle undefined source value', () => {
      mockContext.source = {} as any;
      const result = autoGenerate(null, { 
        name: 'source.name' 
      }, mockContext);
      expect(result.name).toBeUndefined();
    });
  });
});
