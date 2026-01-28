/**
 * Tests for template transform
 */

import { describe, it, expect } from 'vitest';
import { template } from './template.js';
import type { TransformContext } from '../../core/types.js';

describe('template', () => {
  const createContext = (overrides: Partial<TransformContext> = {}): TransformContext => ({
    source: {
      id: '0001',
      name: 'Test Exercise',
      bodyPart: 'chest',
      equipment: 'barbell',
      nested: {
        value: 'nested-value',
        deep: {
          item: 'deep-item'
        }
      }
    },
    target: {
      slug: 'test-exercise',
      generatedId: 'abc-123'
    },
    field: 'currentField',
    registries: {},
    ...overrides
  });

  describe('no template provided', () => {
    it('should return original value when no template option', () => {
      const result = template('original', {}, createContext());
      expect(result).toBe('original');
    });

    it('should return original value when template is undefined', () => {
      const result = template('original', { template: undefined }, createContext());
      expect(result).toBe('original');
    });
  });

  describe('string template with placeholders', () => {
    it('should replace {{value}} with input value', () => {
      const result = template('hello', { template: 'Greeting: {{value}}' }, createContext());
      expect(result).toBe('Greeting: hello');
    });

    it('should replace {{value}} with empty string when value is null', () => {
      const result = template(null, { template: 'Value: {{value}}' }, createContext());
      expect(result).toBe('Value: ');
    });

    it('should replace source field placeholders', () => {
      const result = template(null, { template: 'Exercise: {{name}}' }, createContext());
      expect(result).toBe('Exercise: Test Exercise');
    });

    it('should replace nested source field placeholders', () => {
      const result = template(null, { template: 'Nested: {{nested.value}}' }, createContext());
      expect(result).toBe('Nested: nested-value');
    });

    it('should replace deeply nested source field placeholders', () => {
      const result = template(null, { template: 'Deep: {{nested.deep.item}}' }, createContext());
      expect(result).toBe('Deep: deep-item');
    });

    it('should replace target field placeholders', () => {
      const result = template(null, { template: 'Slug: {{slug}}' }, createContext());
      expect(result).toBe('Slug: test-exercise');
    });

    it('should replace multiple placeholders', () => {
      const result = template(null, { 
        template: '{{name}} - {{bodyPart}} with {{equipment}}' 
      }, createContext());
      expect(result).toBe('Test Exercise - chest with barbell');
    });

    it('should return empty string for unresolved placeholders', () => {
      const result = template(null, { template: 'Missing: {{nonexistent}}' }, createContext());
      expect(result).toBe('Missing: ');
    });

    it('should handle {{index}} placeholder (field name)', () => {
      const result = template(null, { template: 'Field: {{index}}' }, createContext());
      expect(result).toBe('Field: currentField');
    });
  });

  describe('object template', () => {
    it('should process simple object template', () => {
      const result = template(null, {
        template: {
          name: '{{name}}',
          part: '{{bodyPart}}'
        }
      }, createContext());
      expect(result).toEqual({
        name: 'Test Exercise',
        part: 'chest'
      });
    });

    it('should process nested object template', () => {
      const result = template(null, {
        template: {
          exercise: {
            name: '{{name}}',
            details: {
              bodyPart: '{{bodyPart}}'
            }
          }
        }
      }, createContext());
      expect(result).toEqual({
        exercise: {
          name: 'Test Exercise',
          details: {
            bodyPart: 'chest'
          }
        }
      });
    });

    it('should pass through non-string values in object template', () => {
      const result = template(null, {
        template: {
          name: '{{name}}',
          count: 42,
          active: true
        }
      }, createContext());
      expect(result).toEqual({
        name: 'Test Exercise',
        count: 42,
        active: true
      });
    });
  });

  describe('array template', () => {
    it('should process array of string templates', () => {
      const result = template(null, {
        template: ['{{name}}', '{{bodyPart}}', '{{equipment}}']
      }, createContext());
      expect(result).toEqual(['Test Exercise', 'chest', 'barbell']);
    });

    it('should process array of object templates', () => {
      const result = template(null, {
        template: [
          { type: 'name', value: '{{name}}' },
          { type: 'part', value: '{{bodyPart}}' }
        ]
      }, createContext());
      expect(result).toEqual([
        { type: 'name', value: 'Test Exercise' },
        { type: 'part', value: 'chest' }
      ]);
    });
  });

  describe('static template values', () => {
    it('should return static string template as-is', () => {
      const result = template(null, { template: 'static value' }, createContext());
      expect(result).toBe('static value');
    });

    it('should return static number template as-is', () => {
      const result = template(null, { template: 42 }, createContext());
      expect(result).toBe(42);
    });

    it('should return static boolean template as-is', () => {
      const result = template(null, { template: true }, createContext());
      expect(result).toBe(true);
    });

    it('should return null template as-is', () => {
      const result = template(null, { template: null }, createContext());
      expect(result).toBe(null);
    });
  });

  describe('real-world scenarios', () => {
    it('should create FDS-style description template', () => {
      const result = template(null, {
        template: '{{name}} targeting {{bodyPart}} using {{equipment}}'
      }, createContext());
      expect(result).toBe('Test Exercise targeting chest using barbell');
    });

    it('should create media object from source URL', () => {
      const ctx = createContext({
        source: {
          gifUrl: 'http://example.com/0001.gif',
          name: 'Push Up'
        } as any
      });
      const result = template(null, {
        template: {
          type: 'gif',
          uri: '{{gifUrl}}',
          caption: '{{name}} demonstration'
        }
      }, ctx);
      expect(result).toEqual({
        type: 'gif',
        uri: 'http://example.com/0001.gif',
        caption: 'Push Up demonstration'
      });
    });

    it('should handle exercise classification object', () => {
      const result = template(null, {
        template: {
          force: 'push',
          mechanics: 'compound',
          bodyRegion: '{{bodyPart}}'
        }
      }, createContext());
      expect(result).toEqual({
        force: 'push',
        mechanics: 'compound',
        bodyRegion: 'chest'
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty source context', () => {
      const ctx = createContext({ source: {} as any });
      const result = template(null, { template: 'Name: {{name}}' }, ctx);
      expect(result).toBe('Name: ');
    });

    it('should handle empty target context', () => {
      const ctx = createContext({ target: {} });
      const result = template(null, { template: 'Slug: {{slug}}' }, ctx);
      expect(result).toBe('Slug: ');
    });

    it('should handle placeholder at start of string', () => {
      const result = template(null, { template: '{{name}} is great' }, createContext());
      expect(result).toBe('Test Exercise is great');
    });

    it('should handle placeholder at end of string', () => {
      const result = template(null, { template: 'Great exercise: {{name}}' }, createContext());
      expect(result).toBe('Great exercise: Test Exercise');
    });

    it('should handle only placeholder', () => {
      const result = template(null, { template: '{{name}}' }, createContext());
      expect(result).toBe('Test Exercise');
    });

    it('should handle adjacent placeholders', () => {
      const result = template(null, { template: '{{name}}{{bodyPart}}' }, createContext());
      expect(result).toBe('Test Exercisechest');
    });
  });
});
