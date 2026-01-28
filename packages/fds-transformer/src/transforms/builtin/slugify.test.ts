/**
 * Tests for slugify transform
 */

import { describe, it, expect } from 'vitest';
import { slugify } from './slugify.js';

describe('slugify', () => {
  describe('basic string conversion', () => {
    it('should convert simple string to lowercase slug', () => {
      expect(slugify('Hello World', {})).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('bench press', {})).toBe('bench-press');
    });

    it('should replace underscores with hyphens', () => {
      expect(slugify('bench_press', {})).toBe('bench-press');
    });

    it('should collapse multiple spaces into single hyphen', () => {
      expect(slugify('bench   press', {})).toBe('bench-press');
    });

    it('should collapse multiple hyphens into single hyphen', () => {
      expect(slugify('bench---press', {})).toBe('bench-press');
    });

    it('should trim leading and trailing hyphens', () => {
      expect(slugify('  bench press  ', {})).toBe('bench-press');
    });
  });

  describe('special character handling', () => {
    it('should remove special characters', () => {
      expect(slugify('bench (press)', {})).toBe('bench-press');
    });

    it('should remove apostrophes', () => {
      expect(slugify("arnold's press", {})).toBe('arnolds-press');
    });

    it('should remove dots', () => {
      expect(slugify('e.z. bar curl', {})).toBe('ez-bar-curl');
    });

    it('should remove commas', () => {
      expect(slugify('press, incline', {})).toBe('press-incline');
    });
  });

  describe('word replacements', () => {
    it('should replace 3/4 with three-quarter', () => {
      expect(slugify('3/4 sit-up', {})).toBe('three-quarter-sit-up');
    });

    it('should replace 1/4 with quarter', () => {
      expect(slugify('1/4 squat', {})).toBe('quarter-squat');
    });

    it('should replace 1/2 with half', () => {
      expect(slugify('1/2 kneeling', {})).toBe('half-kneeling');
    });

    it('should replace & with and', () => {
      expect(slugify('push & pull', {})).toBe('push-and-pull');
    });

    it('should replace + with plus', () => {
      expect(slugify('curl + press', {})).toBe('curl-plus-press');
    });

    it('should replace @ with at', () => {
      expect(slugify('exercise @ home', {})).toBe('exercise-at-home');
    });
  });

  describe('null and undefined handling', () => {
    it('should return empty string for null', () => {
      expect(slugify(null, {})).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(slugify(undefined, {})).toBe('');
    });
  });

  describe('non-string input handling', () => {
    it('should convert number to string', () => {
      expect(slugify(123, {})).toBe('123');
    });

    it('should handle boolean values', () => {
      expect(slugify(true, {})).toBe('true');
    });
  });

  describe('minimum length enforcement', () => {
    it('should pad single character to minimum 2 characters', () => {
      expect(slugify('a', {})).toBe('a0');
    });

    it('should not modify strings already at minimum length', () => {
      expect(slugify('ab', {})).toBe('ab');
    });

    it('should handle empty result after processing', () => {
      expect(slugify('!!!', {})).toBe('00');
    });
  });

  describe('real-world exercise names', () => {
    it('should slugify "3/4 sit-up"', () => {
      expect(slugify('3/4 sit-up', {})).toBe('three-quarter-sit-up');
    });

    it('should slugify "Incline Dumbbell Press"', () => {
      expect(slugify('Incline Dumbbell Press', {})).toBe('incline-dumbbell-press');
    });

    it('should slugify "Lat Pulldown (Wide Grip)"', () => {
      expect(slugify('Lat Pulldown (Wide Grip)', {})).toBe('lat-pulldown-wide-grip');
    });

    it('should slugify "45° Back Extension"', () => {
      expect(slugify('45° Back Extension', {})).toBe('45-back-extension');
    });

    it('should slugify "T-Bar Row"', () => {
      expect(slugify('T-Bar Row', {})).toBe('t-bar-row');
    });

    it('should slugify "Cable Fly (High-to-Low)"', () => {
      expect(slugify('Cable Fly (High-to-Low)', {})).toBe('cable-fly-high-to-low');
    });
  });
});
