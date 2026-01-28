/**
 * Tests for uuid transform
 */

import { describe, it, expect } from 'vitest';
import { uuid } from './uuid.js';

// UUID v4 regex pattern
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('uuid', () => {
  describe('generation', () => {
    it('should generate a valid UUIDv4', () => {
      const result = uuid(null, {});
      expect(result).toMatch(UUID_V4_REGEX);
    });

    it('should generate unique UUIDs on each call', () => {
      const uuid1 = uuid(null, {});
      const uuid2 = uuid(null, {});
      const uuid3 = uuid(null, {});
      
      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);
    });

    it('should ignore input value', () => {
      const result = uuid('some-value', {});
      expect(result).toMatch(UUID_V4_REGEX);
    });

    it('should ignore options', () => {
      const result = uuid(null, { foo: 'bar' });
      expect(result).toMatch(UUID_V4_REGEX);
    });
  });

  describe('format', () => {
    it('should return lowercase UUID', () => {
      const result = uuid(null, {});
      expect(result).toBe(result.toLowerCase());
    });

    it('should have correct length (36 characters)', () => {
      const result = uuid(null, {});
      expect(result).toHaveLength(36);
    });

    it('should have hyphens at correct positions', () => {
      const result = uuid(null, {});
      expect(result[8]).toBe('-');
      expect(result[13]).toBe('-');
      expect(result[18]).toBe('-');
      expect(result[23]).toBe('-');
    });
  });
});
