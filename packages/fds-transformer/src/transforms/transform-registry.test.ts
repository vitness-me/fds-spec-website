/**
 * Tests for TransformRegistry - plugin registration and transform execution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TransformRegistry } from './transform-registry.js';
import type { TransformPlugin, TransformContext, TransformFunction } from '../core/types.js';

describe('TransformRegistry', () => {
  let registry: TransformRegistry;

  beforeEach(() => {
    registry = new TransformRegistry();
  });

  describe('built-in transforms', () => {
    it('should have all built-in transforms registered', () => {
      const builtins = [
        'slugify',
        'titleCase',
        'lowerCase',
        'upperCase',
        'trim',
        'uuid',
        'toArray',
        'toMediaArray',
        'timestamp',
        'autoGenerate',
        'registryLookup',
        'template',
        'urlTransform',
        'coalesce',
        'split',
        'join',
        'replace',
        'jsonParse',
        'jsonStringify',
      ];

      for (const name of builtins) {
        expect(registry.has(name), `Missing builtin: ${name}`).toBe(true);
      }
    });

    it('should list all registered transforms', () => {
      const list = registry.list();
      expect(list).toContain('slugify');
      expect(list).toContain('uuid');
      expect(list).toContain('toArray');
    });
  });

  describe('register', () => {
    it('should register a custom transform', () => {
      const customTransform: TransformFunction = (value) => `custom-${value}`;
      registry.register('myCustom', customTransform);

      expect(registry.has('myCustom')).toBe(true);
      expect(registry.get('myCustom')).toBe(customTransform);
    });

    it('should override existing transform with same name', () => {
      const original = registry.get('slugify');
      const override: TransformFunction = () => 'overridden';
      registry.register('slugify', override);

      expect(registry.get('slugify')).toBe(override);
      expect(registry.get('slugify')).not.toBe(original);
    });
  });

  describe('registerPlugin', () => {
    it('should register a valid plugin', () => {
      const plugin: TransformPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        transforms: {
          customSlug: (value) => `plugin-${String(value).toLowerCase()}`,
          customUpper: (value) => String(value).toUpperCase(),
        },
      };

      registry.registerPlugin(plugin);

      expect(registry.listPlugins()).toContain('test-plugin');
    });

    it('should register plugin transforms with namespaced names', () => {
      const plugin: TransformPlugin = {
        name: 'my-plugin',
        version: '1.0.0',
        transforms: {
          format: (value) => `formatted: ${value}`,
        },
      };

      registry.registerPlugin(plugin);

      expect(registry.has('my-plugin:format')).toBe(true);
    });

    it('should allow calling namespaced plugin transforms', async () => {
      const plugin: TransformPlugin = {
        name: 'example',
        version: '1.0.0',
        transforms: {
          reverse: (value) => String(value).split('').reverse().join(''),
        },
      };

      registry.registerPlugin(plugin);

      const mockContext = {} as TransformContext;
      const result = await registry.apply('example:reverse', 'hello', {}, mockContext);

      expect(result).toBe('olleh');
    });

    it('should register multiple plugins without conflict', () => {
      const plugin1: TransformPlugin = {
        name: 'plugin-a',
        version: '1.0.0',
        transforms: {
          transform: () => 'a',
        },
      };

      const plugin2: TransformPlugin = {
        name: 'plugin-b',
        version: '2.0.0',
        transforms: {
          transform: () => 'b',
        },
      };

      registry.registerPlugin(plugin1);
      registry.registerPlugin(plugin2);

      expect(registry.has('plugin-a:transform')).toBe(true);
      expect(registry.has('plugin-b:transform')).toBe(true);
    });
  });

  describe('apply', () => {
    it('should apply a registered transform', async () => {
      const mockContext = {} as TransformContext;
      const result = await registry.apply('slugify', 'Hello World', {}, mockContext);

      expect(result).toBe('hello-world');
    });

    it('should pass options to transform', async () => {
      const mockContext = {} as TransformContext;
      const result = await registry.apply('split', 'a,b,c', { delimiter: ',' }, mockContext);

      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should throw error for unknown transform', async () => {
      const mockContext = {} as TransformContext;

      await expect(
        registry.apply('nonExistent', 'value', {}, mockContext)
      ).rejects.toThrow('Unknown transform: nonExistent');
    });

    it('should pass context to transform', async () => {
      let receivedContext: TransformContext | null = null;

      const customTransform: TransformFunction = (value, options, context) => {
        receivedContext = context;
        return value;
      };

      registry.register('contextTest', customTransform);

      const mockContext = {
        source: { name: 'test' },
        target: {},
        field: 'testField',
      } as TransformContext;

      await registry.apply('contextTest', 'value', {}, mockContext);

      expect(receivedContext).toBe(mockContext);
    });
  });

  describe('get', () => {
    it('should return transform function for existing transform', () => {
      const fn = registry.get('slugify');
      expect(typeof fn).toBe('function');
    });

    it('should return undefined for non-existent transform', () => {
      const fn = registry.get('doesNotExist');
      expect(fn).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for existing transform', () => {
      expect(registry.has('uuid')).toBe(true);
    });

    it('should return false for non-existent transform', () => {
      expect(registry.has('nonExistent')).toBe(false);
    });
  });

  describe('utility transforms', () => {
    const mockContext = {} as TransformContext;

    it('coalesce should return first non-empty value', async () => {
      const result = await registry.apply('coalesce', [null, '', 'value', 'other'], {}, mockContext);
      expect(result).toBe('value');
    });

    it('split should split string by delimiter', async () => {
      const result = await registry.apply('split', 'a|b|c', { delimiter: '|' }, mockContext);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('join should join array with delimiter', async () => {
      const result = await registry.apply('join', ['a', 'b', 'c'], { delimiter: ' - ' }, mockContext);
      expect(result).toBe('a - b - c');
    });

    it('replace should replace pattern in string', async () => {
      const result = await registry.apply('replace', 'hello world', { pattern: 'world', replacement: 'there' }, mockContext);
      expect(result).toBe('hello there');
    });

    it('jsonParse should parse JSON string', async () => {
      const result = await registry.apply('jsonParse', '{"key": "value"}', {}, mockContext);
      expect(result).toEqual({ key: 'value' });
    });

    it('jsonParse should return original value on invalid JSON', async () => {
      const result = await registry.apply('jsonParse', 'not json', {}, mockContext);
      expect(result).toBe('not json');
    });

    it('jsonStringify should stringify object', async () => {
      const result = await registry.apply('jsonStringify', { key: 'value' }, {}, mockContext);
      expect(result).toBe('{"key":"value"}');
    });

    it('lowerCase should convert to lowercase', async () => {
      const result = await registry.apply('lowerCase', 'HELLO', {}, mockContext);
      expect(result).toBe('hello');
    });

    it('upperCase should convert to uppercase', async () => {
      const result = await registry.apply('upperCase', 'hello', {}, mockContext);
      expect(result).toBe('HELLO');
    });

    it('trim should remove whitespace', async () => {
      const result = await registry.apply('trim', '  hello  ', {}, mockContext);
      expect(result).toBe('hello');
    });
  });
});
