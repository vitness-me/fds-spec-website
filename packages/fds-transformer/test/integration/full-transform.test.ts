/**
 * Integration tests for full exercise transformation pipeline
 * 
 * These tests use fixture data (inline registries) to simulate the complete
 * transformation of user's exercise data to FDS format.
 * 
 * NOTE: Real-world usage would provide paths to user's own registry files.
 * The fds-transformer tool does NOT bundle any registries - users provide their own.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Transformer } from '../../src/core/transformer.js';
import { RegistryManager } from '../../src/registries/registry-manager.js';
import { MappingEngine } from '../../src/core/mapping-engine.js';
import type { MappingConfig, TransformContext } from '../../src/core/types.js';
import { 
  testMuscles, 
  testEquipment, 
  testMuscleCategories,
  sampleExercises 
} from '../fixtures/registries.js';

// Complete mapping configuration for transforming user exercises to FDS
// Using inline registry data for tests (real usage would use file paths)
const exerciseMappingConfig: MappingConfig = {
  version: '1.0.0',
  targetSchema: {
    version: '1.0.0',
    entity: 'exercise'
  },
  registries: {
    muscles: {
      inline: testMuscles
    },
    equipment: {
      inline: testEquipment
    },
    muscleCategories: {
      inline: testMuscleCategories
    }
  },
  mappings: {
    // Generate new UUIDv4 for FDS exercise ID
    exerciseId: { from: null, transform: 'uuid' },
    
    // Schema version
    schemaVersion: { from: null, default: '1.0.0' },
    
    // Canonical information
    'canonical.name': { from: 'name', transform: 'titleCase' },
    'canonical.slug': { from: 'name', transform: 'slugify' },
    
    // Target muscles - lookup from registry
    'targets.primary': {
      from: 'target',
      transform: 'registryLookup',
      options: { registry: 'muscles', toArray: true, fuzzyMatch: true }
    },
    
    // Equipment - lookup from registry
    'equipment.required': {
      from: 'equipment',
      transform: 'registryLookup',
      options: { registry: 'equipment', toArray: true, fuzzyMatch: true }
    },
    
    // Media - transform gif URL to media array
    media: {
      from: 'gifUrl',
      transform: 'toMediaArray',
      options: { type: 'gif' }
    },
    
    // Metadata
    'metadata.status': { from: null, default: 'draft' },
    'metadata.createdAt': { from: null, transform: 'timestamp' },
    'metadata.updatedAt': { from: null, transform: 'timestamp' },
    'metadata.source': { from: null, default: 'exercisedb' },
    'metadata.externalRefs': {
      from: 'id',
      transform: 'template',
      options: {
        template: [{ system: 'exercisedb', id: '{{value}}' }]
      }
    }
  },
  validation: { enabled: false }, // Disable for now until schemas are fixed
  enrichment: { enabled: false }  // Disable AI for integration tests
};

describe('Integration: Full Exercise Transformation', () => {
  describe('RegistryManager with inline data', () => {
    let registryManager: RegistryManager;

    beforeAll(async () => {
      registryManager = new RegistryManager();
      await registryManager.load({
        muscles: { inline: testMuscles },
        equipment: { inline: testEquipment },
        muscleCategories: { inline: testMuscleCategories }
      });
    });

    it('should load all registries from inline data', () => {
      expect(registryManager.getMuscles().length).toBeGreaterThan(0);
      expect(registryManager.getEquipment().length).toBeGreaterThan(0);
      expect(registryManager.getMuscleCategories().length).toBeGreaterThan(0);
    });

    it('should find "abs" muscle by name', () => {
      const result = registryManager.findMuscle('abs');
      expect(result).not.toBeNull();
      expect(result?.canonical.slug).toBe('abs');
    });

    it('should find "body weight" equipment by alias', () => {
      const result = registryManager.findEquipment('body weight');
      expect(result).not.toBeNull();
      expect(result?.canonical.slug).toBe('body-weight');
    });

    it('should find "barbell" equipment', () => {
      const result = registryManager.findEquipment('barbell');
      expect(result).not.toBeNull();
      expect(result?.canonical.slug).toBe('barbell');
    });

    it('should find "biceps" muscle', () => {
      const result = registryManager.findMuscle('biceps');
      expect(result).not.toBeNull();
      expect(result?.canonical.slug).toBe('biceps');
    });

    it('should find "cable" equipment (fuzzy match to cable machine)', () => {
      const result = registryManager.findEquipment('cable', true);
      expect(result).not.toBeNull();
      // Should match "Cable Machine" or similar
      expect(result?.canonical.name.toLowerCase()).toContain('cable');
    });

    it('should find "dumbbell" equipment', () => {
      const result = registryManager.findEquipment('dumbbell');
      expect(result).not.toBeNull();
      expect(result?.canonical.slug).toBe('dumbbell');
    });
  });

  describe('MappingEngine with inline registries', () => {
    let mappingEngine: MappingEngine;
    let context: TransformContext;

    beforeAll(async () => {
      mappingEngine = new MappingEngine();
      
      // Use inline fixture data for context
      context = {
        source: {},
        target: {},
        field: '',
        registries: {
          muscles: testMuscles,
          equipment: testEquipment,
          muscleCategories: testMuscleCategories
        },
        config: exerciseMappingConfig
      };
    });

    it('should transform exercise with registry lookups', async () => {
      const source = sampleExercises[0]; // 3/4 sit-up
      const result = await mappingEngine.apply(
        source,
        exerciseMappingConfig.mappings,
        { ...context, source }
      );

      // Check canonical fields
      expect(result.canonical).toBeDefined();
      expect((result.canonical as any).name).toBe('3/4 Sit-up');
      expect((result.canonical as any).slug).toBe('three-quarter-sit-up');

      // Check targets
      expect(result.targets).toBeDefined();
      expect((result.targets as any).primary).toBeInstanceOf(Array);
      expect((result.targets as any).primary.length).toBeGreaterThan(0);
      
      // Check equipment
      expect(result.equipment).toBeDefined();
      expect((result.equipment as any).required).toBeInstanceOf(Array);
      expect((result.equipment as any).required.length).toBeGreaterThan(0);
      expect((result.equipment as any).required[0].name).toBe('Body Weight');

      // Check media
      expect(result.media).toBeInstanceOf(Array);
      expect((result.media as any)[0].type).toBe('gif');
      expect((result.media as any)[0].uri).toContain('0001.gif');

      // Check metadata
      expect(result.metadata).toBeDefined();
      expect((result.metadata as any).status).toBe('draft');
      expect((result.metadata as any).externalRefs).toEqual([
        { system: 'exercisedb', id: '0001' }
      ]);
    });
  });

  describe('Full Transformer pipeline', () => {
    let transformer: Transformer;

    beforeAll(async () => {
      transformer = new Transformer({ config: exerciseMappingConfig });
    });

    it('should transform "3/4 sit-up" exercise', async () => {
      const result = await transformer.transform(sampleExercises[0]);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const data = result.data as any;
      
      // Verify exerciseId is a valid UUID
      expect(data.exerciseId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      // Verify canonical
      expect(data.canonical.name).toBe('3/4 Sit-up');
      expect(data.canonical.slug).toBe('three-quarter-sit-up');

      // Verify targets (abs should resolve to a muscle)
      expect(data.targets.primary).toBeInstanceOf(Array);
      expect(data.targets.primary.length).toBeGreaterThan(0);
      expect(data.targets.primary[0].id).toBeDefined();

      // Verify equipment
      expect(data.equipment.required).toBeInstanceOf(Array);
      expect(data.equipment.required[0].name).toBe('Body Weight');

      // Verify media
      expect(data.media).toHaveLength(1);
      expect(data.media[0].type).toBe('gif');
    });

    it('should transform "barbell bench press" exercise', async () => {
      const result = await transformer.transform(sampleExercises[1]);

      expect(result.success).toBe(true);
      const data = result.data as any;

      expect(data.canonical.name).toBe('Barbell Bench Press');
      expect(data.canonical.slug).toBe('barbell-bench-press');
      expect(data.equipment.required[0].name).toBe('Barbell');
    });

    it('should transform "cable biceps curl" exercise', async () => {
      const result = await transformer.transform(sampleExercises[2]);

      expect(result.success).toBe(true);
      const data = result.data as any;

      expect(data.canonical.name).toBe('Cable Biceps Curl');
      expect(data.canonical.slug).toBe('cable-biceps-curl');
      
      // Biceps should be found
      expect(data.targets.primary.length).toBeGreaterThan(0);
      expect(data.targets.primary[0].slug).toBe('biceps');
    });

    it('should transform "dumbbell lateral raise" exercise', async () => {
      const result = await transformer.transform(sampleExercises[3]);

      expect(result.success).toBe(true);
      const data = result.data as any;

      expect(data.canonical.name).toBe('Dumbbell Lateral Raise');
      expect(data.equipment.required[0].name).toBe('Dumbbell');
    });

    it('should transform all sample exercises successfully', async () => {
      const results = await transformer.transformAll(sampleExercises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect((result.data as any).exerciseId).toBeDefined();
        expect((result.data as any).canonical.name).toBeDefined();
        expect((result.data as any).canonical.slug).toBeDefined();
      });
    });

    it('should generate unique UUIDs for each exercise', async () => {
      const results = await transformer.transformAll(sampleExercises);
      const ids = results.map(r => (r.data as any).exerciseId);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(results.length);
    });
  });

  describe('Edge cases and error handling', () => {
    let transformer: Transformer;

    beforeAll(async () => {
      transformer = new Transformer({ config: exerciseMappingConfig });
    });

    it('should handle exercise with unrecognized muscle target', async () => {
      const exercise = {
        id: '9999',
        name: 'unknown exercise',
        bodyPart: 'unknown',
        equipment: 'body weight',
        target: 'unknown_muscle_xyz',
        gifUrl: 'http://example.com/9999.gif'
      };

      const result = await transformer.transform(exercise);
      
      // Should still succeed, just with empty or fuzzy-matched targets
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle exercise with empty target', async () => {
      const exercise = {
        id: '9998',
        name: 'no target exercise',
        bodyPart: 'full body',
        equipment: 'body weight',
        target: '',
        gifUrl: 'http://example.com/9998.gif'
      };

      const result = await transformer.transform(exercise);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // targets.primary should be empty array for empty input
      expect((result.data as any).targets.primary).toEqual([]);
    });

    it('should handle exercise with missing gifUrl', async () => {
      const exercise = {
        id: '9997',
        name: 'no gif exercise',
        bodyPart: 'chest',
        equipment: 'barbell',
        target: 'pectorals'
        // gifUrl is missing
      };

      const result = await transformer.transform(exercise as any);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // media should be empty array
      expect((result.data as any).media).toEqual([]);
    });
  });

  describe('Stream transformation', () => {
    let transformer: Transformer;

    beforeAll(async () => {
      transformer = new Transformer({ config: exerciseMappingConfig });
    });

    it('should transform exercises via stream', async () => {
      const results: any[] = [];
      
      for await (const result of transformer.transformStream(sampleExercises)) {
        results.push(result);
      }

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle async iterable input', async () => {
      // Create an async generator
      async function* generateExercises() {
        for (const exercise of sampleExercises.slice(0, 3)) {
          yield exercise;
        }
      }

      const results: any[] = [];
      for await (const result of transformer.transformStream(generateExercises())) {
        results.push(result);
      }

      expect(results).toHaveLength(3);
    });
  });

  describe('Output format verification', () => {
    let transformer: Transformer;

    beforeAll(async () => {
      transformer = new Transformer({ config: exerciseMappingConfig });
    });

    it('should produce FDS-compliant exercise structure', async () => {
      const result = await transformer.transform(sampleExercises[0]);
      const data = result.data as any;

      // Verify all top-level FDS fields exist
      expect(data).toHaveProperty('exerciseId');
      expect(data).toHaveProperty('schemaVersion');
      expect(data).toHaveProperty('canonical');
      expect(data).toHaveProperty('canonical.name');
      expect(data).toHaveProperty('canonical.slug');
      expect(data).toHaveProperty('targets');
      expect(data).toHaveProperty('targets.primary');
      expect(data).toHaveProperty('equipment');
      expect(data).toHaveProperty('equipment.required');
      expect(data).toHaveProperty('media');
      expect(data).toHaveProperty('metadata');
      expect(data).toHaveProperty('metadata.status');
      expect(data).toHaveProperty('metadata.createdAt');
      expect(data).toHaveProperty('metadata.updatedAt');
      expect(data).toHaveProperty('metadata.source');
      expect(data).toHaveProperty('metadata.externalRefs');
    });

    it('should produce valid muscle references', async () => {
      const result = await transformer.transform(sampleExercises[2]); // cable biceps curl
      const data = result.data as any;

      expect(data.targets.primary.length).toBeGreaterThan(0);
      const muscleRef = data.targets.primary[0];
      
      // MuscleRef should have required fields
      expect(muscleRef).toHaveProperty('id');
      expect(muscleRef).toHaveProperty('name');
      expect(muscleRef).toHaveProperty('slug');
      expect(muscleRef).toHaveProperty('categoryId');
      
      // ID should be a valid UUID format
      expect(muscleRef.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should produce valid equipment references', async () => {
      const result = await transformer.transform(sampleExercises[1]); // barbell bench press
      const data = result.data as any;

      expect(data.equipment.required.length).toBeGreaterThan(0);
      const equipRef = data.equipment.required[0];
      
      // EquipmentRef should have required fields
      expect(equipRef).toHaveProperty('id');
      expect(equipRef).toHaveProperty('name');
      expect(equipRef).toHaveProperty('slug');
      
      // ID should be a valid UUID format
      expect(equipRef.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should produce valid media items', async () => {
      const result = await transformer.transform(sampleExercises[0]);
      const data = result.data as any;

      expect(data.media.length).toBe(1);
      const mediaItem = data.media[0];
      
      expect(mediaItem).toHaveProperty('type');
      expect(mediaItem).toHaveProperty('uri');
      expect(mediaItem.type).toBe('gif');
      expect(mediaItem.uri).toMatch(/\.gif$/);
    });
  });
});
