/**
 * Tests for auto-generate transforms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timestamp, autoGenerate } from './auto-generate.js';
import type { TransformContext } from '../../core/types.js';

describe('timestamp', () => {
  const CLOCK = '2026-01-15T10:30:00.000Z';

  describe('format options', () => {
    it('should format as ISO 8601 by default', () => {
      expect(timestamp(null, { clock: CLOCK })).toBe(CLOCK);
    });

    it('should format with iso8601 format', () => {
      expect(timestamp(null, { clock: CLOCK, format: 'iso8601' })).toBe(CLOCK);
    });

    it('should format with iso format', () => {
      expect(timestamp(null, { clock: CLOCK, format: 'iso' })).toBe(CLOCK);
    });

    it('should format as Unix seconds with unix format', () => {
      expect(timestamp(null, { clock: CLOCK, format: 'unix' })).toBe(
        String(Math.floor(Date.parse(CLOCK) / 1000))
      );
    });

    it('should format as Unix milliseconds with unixms format', () => {
      expect(timestamp(null, { clock: CLOCK, format: 'unixms' })).toBe(String(Date.parse(CLOCK)));
    });

    it('should format a date-only string with date format', () => {
      expect(timestamp(null, { clock: CLOCK, format: 'date' })).toBe('2026-01-15');
    });

    it('should default to ISO 8601 for unknown format', () => {
      expect(timestamp(null, { clock: CLOCK, format: 'unknown' })).toBe(CLOCK);
    });
  });

  describe('input value handling', () => {
    it('should parse and format provided date string', () => {
      const result = timestamp('2024-01-15T10:30:00.000Z', { format: 'date' });
      expect(result).toBe('2024-01-15');
    });

    it('should parse ISO date and output different format', () => {
      const result = timestamp('2024-01-15T10:30:00.000Z', { format: 'unix' });
      expect(result).toBe(String(Math.floor(new Date('2024-01-15T10:30:00.000Z').getTime() / 1000)));
    });

    it('should prefer the source value over the configured clock', () => {
      expect(timestamp('2020-05-17T21:03:21+00:00', { clock: CLOCK })).toBe(
        '2020-05-17T21:03:21.000Z'
      );
    });

    it('should reject a source value that is not a date', () => {
      expect(() => timestamp('yesterday', {})).toThrow(/not a date/);
    });
  });

  describe('clock', () => {
    it('should never fall back to the wall clock when nothing is configured', () => {
      expect(() => timestamp(null, {})).toThrow(/no clock/);
      expect(() => timestamp(undefined, {})).toThrow(/no clock/);
      expect(() => timestamp('', {})).toThrow(/no clock/);
    });

    it('should give the same instant on every call with a fixed clock', () => {
      expect(timestamp(null, { clock: CLOCK })).toBe(timestamp(null, { clock: CLOCK }));
    });

    it('should reject a clock that is not an instant', () => {
      expect(() => timestamp(null, { clock: 'soon' })).toThrow(/clock/);
    });

    it('should reject a clock with no zone, which reads differently on each host', () => {
      expect(() => timestamp(null, { clock: '2026-01-01 00:00' })).toThrow(/zone/);
      expect(() => timestamp(null, { clock: '2026-01-01T00:00:00' })).toThrow(/zone/);
      expect(() => timestamp(null, { clock: 0 })).toThrow(/zone/);
      expect(timestamp(null, { clock: '2026-01-01T02:00:00+02:00' })).toBe('2026-01-01T00:00:00.000Z');
    });

    it('should read the wall clock only when the clock is "now"', () => {
      const before = Date.now();
      const resultMs = Date.parse(timestamp(null, { clock: 'now' }) as string);
      expect(resultMs).toBeGreaterThanOrEqual(before);
      expect(resultMs).toBeLessThanOrEqual(Date.now());
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
