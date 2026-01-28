/**
 * Tests for MappingEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MappingEngine } from './mapping-engine.js';
import type { TransformContext, FieldMapping, MappingConfig } from './types.js';

describe('MappingEngine', () => {
  let engine: MappingEngine;
  let defaultContext: TransformContext;

  beforeEach(() => {
    engine = new MappingEngine();
    defaultContext = {
      source: {},
      target: {},
      field: '',
      registries: {
        muscles: [],
        equipment: [],
        muscleCategories: []
      },
      config: {} as MappingConfig
    };
  });

  describe('simple field mapping', () => {
    it('should map a simple string field', async () => {
      const source = { name: 'Test Exercise' };
      const mappings: Record<string, FieldMapping> = {
        'canonical.name': 'name'
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        canonical: {
          name: 'Test Exercise'
        }
      });
    });

    it('should map multiple simple fields', async () => {
      const source = { 
        name: 'Test Exercise',
        id: '0001',
        bodyPart: 'chest'
      };
      const mappings: Record<string, FieldMapping> = {
        name: 'name',
        originalId: 'id',
        bodyPart: 'bodyPart'
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        name: 'Test Exercise',
        originalId: '0001',
        bodyPart: 'chest'
      });
    });

    it('should handle missing source fields gracefully', async () => {
      const source = { name: 'Test' };
      const mappings: Record<string, FieldMapping> = {
        name: 'name',
        description: 'description' // doesn't exist in source
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        name: 'Test'
        // description is undefined, so not included
      });
    });
  });

  describe('nested path mapping', () => {
    it('should read from nested source paths', async () => {
      const source = {
        meta: {
          author: 'John Doe',
          created: '2024-01-01'
        }
      };
      const mappings: Record<string, FieldMapping> = {
        author: 'meta.author',
        date: 'meta.created'
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        author: 'John Doe',
        date: '2024-01-01'
      });
    });

    it('should write to nested target paths', async () => {
      const source = { name: 'Test', author: 'John' };
      const mappings: Record<string, FieldMapping> = {
        'canonical.name': 'name',
        'metadata.author': 'author'
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        canonical: {
          name: 'Test'
        },
        metadata: {
          author: 'John'
        }
      });
    });

    it('should handle deeply nested paths', async () => {
      const source = {
        data: {
          nested: {
            deep: {
              value: 'found'
            }
          }
        }
      };
      const mappings: Record<string, FieldMapping> = {
        'output.nested.value': 'data.nested.deep.value'
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        output: {
          nested: {
            value: 'found'
          }
        }
      });
    });

    it('should handle array index notation in source path', async () => {
      const source = {
        items: ['first', 'second', 'third']
      };
      const mappings: Record<string, FieldMapping> = {
        firstItem: 'items[0]',
        secondItem: 'items[1]'
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        firstItem: 'first',
        secondItem: 'second'
      });
    });
  });

  describe('mapping object syntax', () => {
    it('should handle from property in mapping object', async () => {
      const source = { name: 'Test' };
      const mappings: Record<string, FieldMapping> = {
        title: { from: 'name' }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        title: 'Test'
      });
    });

    it('should handle multiple source fields (fallback)', async () => {
      const source = { alternateName: 'Alternate Title' };
      const mappings: Record<string, FieldMapping> = {
        name: { from: ['name', 'alternateName', 'title'] }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        name: 'Alternate Title'
      });
    });

    it('should use first non-empty value from multiple sources', async () => {
      const source = { 
        name: '', // empty string
        alternateName: null, // null
        title: 'Final Title' // this should be used
      };
      const mappings: Record<string, FieldMapping> = {
        result: { from: ['name', 'alternateName', 'title'] }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        result: 'Final Title'
      });
    });
  });

  describe('default values', () => {
    it('should use default when source is undefined', async () => {
      const source = {};
      const mappings: Record<string, FieldMapping> = {
        status: { from: 'status', default: 'draft' }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        status: 'draft'
      });
    });

    it('should use default when source is null', async () => {
      const source = { status: null };
      const mappings: Record<string, FieldMapping> = {
        status: { from: 'status', default: 'active' }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        status: 'active'
      });
    });

    it('should use default when source is empty string', async () => {
      const source = { status: '' };
      const mappings: Record<string, FieldMapping> = {
        status: { from: 'status', default: 'pending' }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        status: 'pending'
      });
    });

    it('should NOT use default when source has a value', async () => {
      const source = { status: 'completed' };
      const mappings: Record<string, FieldMapping> = {
        status: { from: 'status', default: 'draft' }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        status: 'completed'
      });
    });

    it('should handle complex default values', async () => {
      const source = {};
      const mappings: Record<string, FieldMapping> = {
        metrics: { 
          from: 'metrics', 
          default: { primary: { type: 'reps', unit: 'count' } } 
        }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        metrics: { primary: { type: 'reps', unit: 'count' } }
      });
    });
  });

  describe('transform application', () => {
    it('should apply single transform', async () => {
      const source = { name: 'Test Exercise' };
      const mappings: Record<string, FieldMapping> = {
        slug: { from: 'name', transform: 'slugify' }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        slug: 'test-exercise'
      });
    });

    it('should apply multiple transforms in sequence', async () => {
      const source = { name: 'test exercise' };
      const mappings: Record<string, FieldMapping> = {
        formattedName: { from: 'name', transform: ['titleCase', 'slugify'] }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      // titleCase -> "Test Exercise" -> slugify -> "test-exercise"
      expect(result).toEqual({
        formattedName: 'test-exercise'
      });
    });

    it('should pass options to transform', async () => {
      const source = { media: 'http://example.com/image.jpg' };
      const mappings: Record<string, FieldMapping> = {
        media: { 
          from: 'media', 
          transform: 'toMediaArray',
          options: { type: 'gif', caption: 'Demo' }
        }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        media: [{ type: 'gif', uri: 'http://example.com/image.jpg', caption: 'Demo' }]
      });
    });

    it('should generate UUID without source value', async () => {
      const source = {};
      const mappings: Record<string, FieldMapping> = {
        id: { from: null, transform: 'uuid' }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('conditional mapping', () => {
    it('should include field when condition is true', async () => {
      const source = { name: 'Test', hasMedia: true, mediaUrl: 'http://example.com/img.jpg' };
      const mappings: Record<string, FieldMapping> = {
        name: 'name',
        media: { 
          from: 'mediaUrl', 
          condition: 'source.hasMedia === true' 
        }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        name: 'Test',
        media: 'http://example.com/img.jpg'
      });
    });

    it('should exclude field when condition is false', async () => {
      const source = { name: 'Test', hasMedia: false, mediaUrl: 'http://example.com/img.jpg' };
      const mappings: Record<string, FieldMapping> = {
        name: 'name',
        media: { 
          from: 'mediaUrl', 
          condition: 'source.hasMedia === true' 
        }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        name: 'Test'
        // media should not be included
      });
    });

    it('should evaluate complex conditions', async () => {
      const source = { count: 10, type: 'premium' };
      const mappings: Record<string, FieldMapping> = {
        bonus: { 
          from: 'count', 
          condition: 'source.count > 5 && source.type === "premium"' 
        }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({
        bonus: 10
      });
    });
  });

  describe('required fields', () => {
    it('should throw error when required field is missing', async () => {
      const source = {};
      const mappings: Record<string, FieldMapping> = {
        name: { from: 'name', required: true }
      };

      await expect(
        engine.apply(source, mappings, defaultContext)
      ).rejects.toThrow('Required field name could not be populated');
    });

    it('should throw error when required field is null', async () => {
      const source = { name: null };
      const mappings: Record<string, FieldMapping> = {
        name: { from: 'name', required: true }
      };

      await expect(
        engine.apply(source, mappings, defaultContext)
      ).rejects.toThrow('Required field name could not be populated');
    });

    it('should not throw when required field has a value', async () => {
      const source = { name: 'Test' };
      const mappings: Record<string, FieldMapping> = {
        name: { from: 'name', required: true }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({ name: 'Test' });
    });

    it('should use default for required field', async () => {
      const source = {};
      const mappings: Record<string, FieldMapping> = {
        name: { from: 'name', required: true, default: 'Unknown' }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      expect(result).toEqual({ name: 'Unknown' });
    });
  });

  describe('real-world exercise transformation', () => {
    it('should transform user exercise format to FDS structure', async () => {
      const source = {
        id: '0001',
        name: '3/4 sit-up',
        bodyPart: 'waist',
        equipment: 'body weight',
        target: 'abs',
        gifUrl: 'http://d205bpvrqc9yn1.cloudfront.net/0001.gif'
      };

      const mappings: Record<string, FieldMapping> = {
        'canonical.name': { from: 'name', transform: 'titleCase' },
        'canonical.slug': { from: 'name', transform: 'slugify' },
        exerciseId: { from: null, transform: 'uuid' },
        'metadata.externalRefs': {
          from: 'id',
          transform: 'template',
          options: {
            template: [{ system: 'exercisedb', id: '{{value}}' }]
          }
        }
      };

      const result = await engine.apply(source, mappings, defaultContext);
      
      expect(result.canonical).toBeDefined();
      expect((result.canonical as any).name).toBe('3/4 Sit-up');
      expect((result.canonical as any).slug).toBe('three-quarter-sit-up');
      expect(result.exerciseId).toMatch(/^[0-9a-f]{8}-/);
      expect(result.metadata).toBeDefined();
      expect((result.metadata as any).externalRefs).toEqual([
        { system: 'exercisedb', id: '0001' }
      ]);
    });
  });
});
