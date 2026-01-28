/**
 * Tests for titleCase transform
 */

import { describe, it, expect } from 'vitest';
import { titleCase } from './title-case.js';

describe('titleCase', () => {
  describe('basic string conversion', () => {
    it('should convert lowercase to title case', () => {
      expect(titleCase('hello world', {})).toBe('Hello World');
    });

    it('should convert uppercase to title case', () => {
      expect(titleCase('HELLO WORLD', {})).toBe('Hello World');
    });

    it('should handle single word', () => {
      expect(titleCase('press', {})).toBe('Press');
    });
  });

  describe('lowercase word handling', () => {
    it('should keep "the" lowercase when not first word', () => {
      expect(titleCase('push the weight', {})).toBe('Push the Weight');
    });

    it('should capitalize "the" when first word', () => {
      expect(titleCase('the quick movement', {})).toBe('The Quick Movement');
    });

    it('should keep "of" lowercase when not first word', () => {
      expect(titleCase('range of motion', {})).toBe('Range of Motion');
    });

    it('should keep "and" lowercase when not first word', () => {
      expect(titleCase('push and pull', {})).toBe('Push and Pull');
    });

    it('should keep "for" lowercase when not first word', () => {
      expect(titleCase('exercise for beginners', {})).toBe('Exercise for Beginners');
    });
  });

  describe('fitness acronym handling', () => {
    it('should uppercase DB (dumbbell)', () => {
      expect(titleCase('db press', {})).toBe('DB Press');
    });

    it('should uppercase BB (barbell)', () => {
      expect(titleCase('bb curl', {})).toBe('BB Curl');
    });

    it('should uppercase KB (kettlebell)', () => {
      expect(titleCase('kb swing', {})).toBe('KB Swing');
    });

    it('should uppercase EZ (ez bar)', () => {
      expect(titleCase('ez bar curl', {})).toBe('EZ Bar Curl');
    });

    it('should uppercase TRX', () => {
      expect(titleCase('trx row', {})).toBe('TRX Row');
    });

    it('should uppercase HIIT', () => {
      expect(titleCase('hiit workout', {})).toBe('HIIT Workout');
    });

    it('should uppercase AMRAP', () => {
      expect(titleCase('amrap circuit', {})).toBe('AMRAP Circuit');
    });

    it('should uppercase EMOM', () => {
      expect(titleCase('emom training', {})).toBe('EMOM Training');
    });

    it('should uppercase BW (bodyweight)', () => {
      expect(titleCase('bw squat', {})).toBe('BW Squat');
    });
  });

  describe('preserveAcronyms option', () => {
    it('should preserve acronyms by default', () => {
      expect(titleCase('db press', {})).toBe('DB Press');
    });

    it('should preserve acronyms when option is true', () => {
      expect(titleCase('db press', { preserveAcronyms: true })).toBe('DB Press');
    });

    it('should not preserve acronyms when option is false', () => {
      expect(titleCase('db press', { preserveAcronyms: false })).toBe('Db Press');
    });
  });

  describe('hyphenated word handling', () => {
    it('should handle hyphenated words (keeps lowercase words lowercase)', () => {
      // "up" is in the lowercase words list, so it stays lowercase after hyphen
      expect(titleCase('sit-up', {})).toBe('Sit-up');
    });

    it('should handle multiple hyphens with lowercase words', () => {
      // "to" is in the lowercase words list
      expect(titleCase('high-to-low', {})).toBe('High-to-Low');
    });

    it('should capitalize non-lowercase words after hyphen', () => {
      expect(titleCase('cable-row', {})).toBe('Cable-Row');
    });

    it('should keep lowercase words lowercase after hyphen when appropriate', () => {
      expect(titleCase('one-and-done', {})).toBe('One-and-Done');
    });
  });

  describe('null and undefined handling', () => {
    it('should return empty string for null', () => {
      expect(titleCase(null, {})).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(titleCase(undefined, {})).toBe('');
    });
  });

  describe('non-string input handling', () => {
    it('should convert number to string and process', () => {
      expect(titleCase(123, {})).toBe('123');
    });

    it('should handle boolean values', () => {
      expect(titleCase(true, {})).toBe('True');
    });
  });

  describe('real-world exercise names', () => {
    it('should convert "3/4 sit-up"', () => {
      // "up" is in lowercase words list, so stays lowercase after hyphen
      expect(titleCase('3/4 sit-up', {})).toBe('3/4 Sit-up');
    });

    it('should convert "incline dumbbell press"', () => {
      expect(titleCase('incline dumbbell press', {})).toBe('Incline Dumbbell Press');
    });

    it('should convert "lat pulldown"', () => {
      expect(titleCase('lat pulldown', {})).toBe('Lat Pulldown');
    });

    it('should convert "CABLE FLY"', () => {
      expect(titleCase('CABLE FLY', {})).toBe('Cable Fly');
    });

    it('should convert "body weight squat"', () => {
      expect(titleCase('body weight squat', {})).toBe('Body Weight Squat');
    });

    it('should preserve case in mixed-case words like "iPhone" (if not all caps)', () => {
      // This tests the behavior that only all-caps words get lowercased
      expect(titleCase('iPhone exercise', {})).toBe('IPhone Exercise');
    });
  });
});
