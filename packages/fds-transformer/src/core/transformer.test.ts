/**
 * Tests for main Transformer class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Transformer } from './transformer.js';
import type { MappingConfig, MuscleRegistryEntry, EquipmentRegistryEntry } from './types.js';

// Sample registry data for testing
const sampleMuscles: MuscleRegistryEntry[] = [
  {
    schemaVersion: '1.0.0',
    id: 'muscle-abs-001',
    canonical: {
      name: 'Rectus Abdominis',
      slug: 'rectus-abdominis',
      aliases: ['abs', 'abdominals', 'waist']
    },
    classification: {
      categoryId: 'cat-core',
      region: 'core'
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'muscle-chest-001',
    canonical: {
      name: 'Pectoralis Major',
      slug: 'pectoralis-major',
      aliases: ['chest', 'pecs']
    },
    classification: {
      categoryId: 'cat-chest',
      region: 'upper-front'
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  }
];

const sampleEquipment: EquipmentRegistryEntry[] = [
  {
    schemaVersion: '1.0.0',
    id: 'equip-bodyweight-001',
    canonical: {
      name: 'Body Weight',
      slug: 'body-weight',
      aliases: ['bodyweight', 'bw', 'body weight']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'equip-barbell-001',
    canonical: {
      name: 'Barbell',
      slug: 'barbell',
      aliases: ['bb', 'olympic bar']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  }
];

// Create a minimal mapping config for testing
const createTestConfig = (mappings: MappingConfig['mappings']): MappingConfig => ({
  version: '1.0.0',
  targetSchema: {
    version: '1.0.0',
    entity: 'exercise'
  },
  registries: {
    muscles: { inline: sampleMuscles },
    equipment: { inline: sampleEquipment }
  },
  mappings,
  validation: { enabled: false }, // Disable validation for unit tests
  enrichment: { enabled: false } // Disable AI for unit tests
});

describe('Transformer', () => {
  describe('basic transformation', () => {
    it('should transform a simple source object', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
        'canonical.slug': { from: 'name', transform: 'slugify' }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Bench Press'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((result.data as any).canonical.name).toBe('Bench Press');
      expect((result.data as any).canonical.slug).toBe('bench-press');
    });

    it('should generate UUID for exerciseId', async () => {
      const config = createTestConfig({
        exerciseId: { from: null, transform: 'uuid' },
        'canonical.name': 'name'
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Squat'
      });

      expect(result.success).toBe(true);
      expect((result.data as any).exerciseId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should apply multiple transforms in sequence', async () => {
      const config = createTestConfig({
        'canonical.name': { from: 'name', transform: 'titleCase' },
        'canonical.slug': { from: 'name', transform: 'slugify' }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: '3/4 sit-up'
      });

      expect(result.success).toBe(true);
      expect((result.data as any).canonical.name).toBe('3/4 Sit-up');
      expect((result.data as any).canonical.slug).toBe('three-quarter-sit-up');
    });
  });

  describe('registry lookup', () => {
    it('should lookup equipment from registry', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
        'equipment.required': {
          from: 'equipment',
          transform: 'registryLookup',
          options: { registry: 'equipment', toArray: true }
        }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Push Up',
        equipment: 'body weight'
      });

      expect(result.success).toBe(true);
      const equipment = (result.data as any).equipment?.required;
      expect(equipment).toBeDefined();
      expect(equipment).toHaveLength(1);
      expect(equipment[0].name).toBe('Body Weight');
      expect(equipment[0].id).toBe('equip-bodyweight-001');
    });

    it('should lookup muscles from registry', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
        'targets.primary': {
          from: 'target',
          transform: 'registryLookup',
          options: { registry: 'muscles', toArray: true }
        }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Crunch',
        target: 'abs'
      });

      expect(result.success).toBe(true);
      const primary = (result.data as any).targets?.primary;
      expect(primary).toBeDefined();
      expect(primary).toHaveLength(1);
      expect(primary[0].name).toBe('Rectus Abdominis');
    });
  });

  describe('media transformation', () => {
    it('should transform gifUrl to media array', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
        media: {
          from: 'gifUrl',
          transform: 'toMediaArray',
          options: { type: 'gif' }
        }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Squat',
        gifUrl: 'http://example.com/squat.gif'
      });

      expect(result.success).toBe(true);
      const media = (result.data as any).media;
      expect(media).toBeDefined();
      expect(media).toHaveLength(1);
      expect(media[0].type).toBe('gif');
      expect(media[0].uri).toBe('http://example.com/squat.gif');
    });

    it('should apply URL transformation to media', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
        media: {
          from: 'gifUrl',
          transform: 'toMediaArray',
          options: {
            type: 'gif',
            baseUrl: 'https://cdn.example.com/gifs'
          }
        }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Squat',
        gifUrl: 'http://d205bpvrqc9yn1.cloudfront.net/0001.gif'
      });

      expect(result.success).toBe(true);
      const media = (result.data as any).media;
      expect(media[0].uri).toBe('https://cdn.example.com/gifs/0001.gif');
    });
  });

  describe('default values', () => {
    it('should use default values when source is missing', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
        'metadata.status': { from: 'status', default: 'draft' },
        schemaVersion: { from: null, default: '1.0.0' }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Test Exercise'
      });

      expect(result.success).toBe(true);
      expect((result.data as any).metadata.status).toBe('draft');
      expect((result.data as any).schemaVersion).toBe('1.0.0');
    });
  });

  describe('conditional mapping', () => {
    it('should include field when condition is true', async () => {
      const config = {
        ...createTestConfig({
          'canonical.name': 'name',
          'constraints.environment': {
            from: 'environment',
            condition: 'source.hasEnvironment === true'
          }
        }),
        allowUnsafeEval: true
      };

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Outdoor Run',
        hasEnvironment: true,
        environment: ['outdoor', 'track']
      });

      expect(result.success).toBe(true);
      expect((result.data as any).constraints?.environment).toEqual(['outdoor', 'track']);
    });

    it('should exclude field when condition is false', async () => {
      const config = {
        ...createTestConfig({
          'canonical.name': 'name',
          'constraints.environment': {
            from: 'environment',
            condition: 'source.hasEnvironment === true'
          }
        }),
        allowUnsafeEval: true
      };

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Push Up',
        hasEnvironment: false,
        environment: ['gym']
      });

      expect(result.success).toBe(true);
      expect((result.data as any).constraints?.environment).toBeUndefined();
    });
  });

  describe('template transformation', () => {
    it('should apply template with placeholders', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
        'metadata.externalRefs': {
          from: 'id',
          transform: 'template',
          options: {
            template: [{ system: 'exercisedb', id: '{{value}}' }]
          }
        }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Squat',
        id: '0001'
      });

      expect(result.success).toBe(true);
      expect((result.data as any).metadata.externalRefs).toEqual([
        { system: 'exercisedb', id: '0001' }
      ]);
    });
  });

  describe('transformAll', () => {
    it('should transform multiple items', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
        'canonical.slug': { from: 'name', transform: 'slugify' }
      });

      const transformer = new Transformer({ config });
      const results = await transformer.transformAll([
        { name: 'Push Up' },
        { name: 'Pull Up' },
        { name: 'Squat' }
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
      expect((results[0].data as any).canonical.slug).toBe('push-up');
      expect((results[1].data as any).canonical.slug).toBe('pull-up');
      expect((results[2].data as any).canonical.slug).toBe('squat');
    });
  });

  describe('transformStream', () => {
    it('should transform items as async generator', async () => {
      const config = createTestConfig({
        'canonical.name': 'name'
      });

      const transformer = new Transformer({ config });
      const items = [
        { name: 'Exercise 1' },
        { name: 'Exercise 2' },
        { name: 'Exercise 3' }
      ];

      const results: any[] = [];
      for await (const result of transformer.transformStream(items)) {
        results.push(result);
      }

      expect(results).toHaveLength(3);
      results.forEach(r => expect(r.success).toBe(true));
    });
  });

  describe('error handling', () => {
    it('should return error result when required field is missing', async () => {
      const config = createTestConfig({
        'canonical.name': { from: 'name', required: true }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        // name is missing
        id: '0001'
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should handle transformation errors gracefully', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
        broken: { from: 'data', transform: 'nonExistentTransform' as any }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        name: 'Test',
        data: 'value'
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('real-world exercise transformation', () => {
    it('should transform user exercise format to FDS structure', async () => {
      const config = createTestConfig({
        exerciseId: { from: null, transform: 'uuid' },
        schemaVersion: { from: null, default: '1.0.0' },
        'canonical.name': { from: 'name', transform: 'titleCase' },
        'canonical.slug': { from: 'name', transform: 'slugify' },
        'targets.primary': {
          from: 'target',
          transform: 'registryLookup',
          options: { registry: 'muscles', toArray: true, fuzzyMatch: true }
        },
        'equipment.required': {
          from: 'equipment',
          transform: 'registryLookup',
          options: { registry: 'equipment', toArray: true }
        },
        media: {
          from: 'gifUrl',
          transform: 'toMediaArray',
          options: { type: 'gif' }
        },
        'metadata.status': { from: null, default: 'draft' },
        'metadata.createdAt': { from: null, transform: 'timestamp' },
        'metadata.updatedAt': { from: null, transform: 'timestamp' },
        'metadata.externalRefs': {
          from: 'id',
          transform: 'template',
          options: {
            template: [{ system: 'exercisedb', id: '{{value}}' }]
          }
        }
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transform({
        id: '0001',
        name: '3/4 sit-up',
        bodyPart: 'waist',
        equipment: 'body weight',
        target: 'abs',
        gifUrl: 'http://d205bpvrqc9yn1.cloudfront.net/0001.gif'
      });

      expect(result.success).toBe(true);
      const data = result.data as any;
      
      // Check exerciseId is a valid UUID
      expect(data.exerciseId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      // Check canonical
      expect(data.canonical.name).toBe('3/4 Sit-up');
      expect(data.canonical.slug).toBe('three-quarter-sit-up');

      // Check targets (looked up from registry)
      expect(data.targets.primary).toHaveLength(1);
      expect(data.targets.primary[0].name).toBe('Rectus Abdominis');
      expect(data.targets.primary[0].id).toBe('muscle-abs-001');

      // Check equipment (looked up from registry)
      expect(data.equipment.required).toHaveLength(1);
      expect(data.equipment.required[0].name).toBe('Body Weight');

      // Check media
      expect(data.media).toHaveLength(1);
      expect(data.media[0].type).toBe('gif');

      // Check metadata
      expect(data.metadata.status).toBe('draft');
      expect(data.metadata.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(data.metadata.externalRefs).toEqual([
        { system: 'exercisedb', id: '0001' }
      ]);
    });
  });

  describe('tiered enrichment integration', () => {
    it('should expose enrichment engine', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
      });

      const transformer = new Transformer({ config });
      await transformer.transform({ name: 'Test' }); // Initialize

      // Enrichment is disabled in test config, so engine should be null
      expect(transformer.getEnrichmentEngine()).toBeNull();
    });

    it('should expose schema manager', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
      });

      const transformer = new Transformer({ config });
      const schemaManager = transformer.getSchemaManager();

      expect(schemaManager).toBeDefined();
      expect(typeof schemaManager.validate).toBe('function');
    });

    it('should report tiered enrichment as disabled when not configured', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
      });

      const transformer = new Transformer({ config });
      await transformer.transform({ name: 'Test' }); // Initialize

      expect(transformer.isTieredEnrichmentEnabled()).toBe(false);
    });

    it('should return null for cost estimate when enrichment is disabled', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
      });

      const transformer = new Transformer({ config });
      await transformer.transform({ name: 'Test' }); // Initialize

      expect(transformer.estimateCost(100)).toBeNull();
    });
  });

  describe('transformAllBatch', () => {
    it('should transform multiple items in batch mode', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
        'canonical.slug': { from: 'name', transform: 'slugify' },
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transformAllBatch([
        { name: 'Push Up' },
        { name: 'Pull Up' },
        { name: 'Squat' },
      ]);

      expect(result.stats.total).toBe(3);
      expect(result.stats.success).toBe(3);
      expect(result.stats.failed).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(true);
      expect(result.results[2].success).toBe(true);
    });

    it('should return stats about the transformation', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transformAllBatch([
        { name: 'Exercise 1' },
        { name: 'Exercise 2' },
      ]);

      expect(result.stats).toEqual({
        total: 2,
        success: 2,
        failed: 0,
        enriched: 0,
        apiCalls: 0,
        tokensUsed: 0,
        durationMs: expect.any(Number),
      });
      expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle mapping errors gracefully', async () => {
      const config = createTestConfig({
        'canonical.name': { from: 'name', required: true },
        'broken': { from: 'data', transform: 'nonExistentTransform' as any },
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transformAllBatch([
        { name: 'Valid', data: 'test' },
      ]);

      expect(result.stats.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(0);
    });

    it('should skip enrichment when skipEnrichment option is true', async () => {
      const config: MappingConfig = {
        ...createTestConfig({
          'canonical.name': 'name',
        }),
        enrichment: { enabled: true }, // Enable enrichment in config
      };

      const transformer = new Transformer({ config });
      const result = await transformer.transformAllBatch(
        [{ name: 'Test' }],
        { skipEnrichment: true }
      );

      expect(result.stats.success).toBe(1);
      expect(result.stats.enriched).toBe(0);
    });

    it('should preserve index ordering in results', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transformAllBatch([
        { name: 'First' },
        { name: 'Second' },
        { name: 'Third' },
      ]);

      expect((result.results[0].data as any).canonical.name).toBe('First');
      expect((result.results[1].data as any).canonical.name).toBe('Second');
      expect((result.results[2].data as any).canonical.name).toBe('Third');
    });

    it('should work with empty array', async () => {
      const config = createTestConfig({
        'canonical.name': 'name',
      });

      const transformer = new Transformer({ config });
      const result = await transformer.transformAllBatch([]);

      expect(result.stats.total).toBe(0);
      expect(result.stats.success).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply validation to each result', async () => {
      const config: MappingConfig = {
        ...createTestConfig({
          'canonical.name': 'name',
        }),
        validation: { enabled: true, strict: false },
      };

      const transformer = new Transformer({ config });
      const result = await transformer.transformAllBatch([
        { name: 'Test Exercise' },
      ]);

      expect(result.results[0]).toHaveProperty('__validation');
      expect(result.results[0].__validation).toHaveProperty('valid');
    });
  });
});
