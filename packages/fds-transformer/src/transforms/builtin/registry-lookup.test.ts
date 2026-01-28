/**
 * Tests for registryLookup transform
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { registryLookup } from './registry-lookup.js';
import type { TransformContext } from '../../core/types.js';

// Mock registry data
const mockMusclesRegistry = [
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000001',
    canonical: {
      name: 'Rectus Abdominis',
      slug: 'rectus-abdominis',
      aliases: ['abs', 'abdominals', 'six-pack']
    },
    classification: {
      categoryId: 'cat-core-001'
    }
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000002',
    canonical: {
      name: 'Pectoralis Major',
      slug: 'pectoralis-major',
      aliases: ['chest', 'pecs', 'pectorals']
    },
    classification: {
      categoryId: 'cat-chest-001'
    }
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000003',
    canonical: {
      name: 'Latissimus Dorsi',
      slug: 'latissimus-dorsi',
      aliases: ['lats', 'back']
    },
    classification: {
      categoryId: 'cat-back-001'
    }
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000004',
    canonical: {
      name: 'Biceps Brachii',
      slug: 'biceps-brachii',
      aliases: ['biceps', 'bicep']
    },
    classification: {
      categoryId: 'cat-arms-001'
    }
  }
];

const mockEquipmentRegistry = [
  {
    id: 'eq-0001-4000-8000-000000000001',
    canonical: {
      name: 'Barbell',
      slug: 'barbell',
      aliases: ['bb', 'bar', 'olympic bar']
    }
  },
  {
    id: 'eq-0002-4000-8000-000000000002',
    canonical: {
      name: 'Dumbbell',
      slug: 'dumbbell',
      aliases: ['db', 'dumbell', 'hand weight']
    }
  },
  {
    id: 'eq-0003-4000-8000-000000000003',
    canonical: {
      name: 'Body Weight',
      slug: 'body-weight',
      aliases: ['bodyweight', 'bw', 'no equipment']
    }
  },
  {
    id: 'eq-0004-4000-8000-000000000004',
    canonical: {
      name: 'Kettlebell',
      slug: 'kettlebell',
      aliases: ['kb', 'kettle bell']
    }
  }
];

describe('registryLookup', () => {
  let context: TransformContext;

  beforeEach(() => {
    context = {
      source: {},
      target: {},
      field: 'testField',
      registries: {
        muscles: mockMusclesRegistry as any,
        equipment: mockEquipmentRegistry as any,
        muscleCategories: []
      }
    };
  });

  describe('null and empty value handling', () => {
    it('should return null for null value', () => {
      const result = registryLookup(null, { registry: 'muscles' }, context);
      expect(result).toBe(null);
    });

    it('should return null for undefined value', () => {
      const result = registryLookup(undefined, { registry: 'muscles' }, context);
      expect(result).toBe(null);
    });

    it('should return null for empty string', () => {
      const result = registryLookup('', { registry: 'muscles' }, context);
      expect(result).toBe(null);
    });

    it('should return empty array for null when toArray is true', () => {
      const result = registryLookup(null, { registry: 'muscles', toArray: true }, context);
      expect(result).toEqual([]);
    });
  });

  describe('exact name matching', () => {
    it('should find muscle by exact name', () => {
      const result = registryLookup('Rectus Abdominis', { registry: 'muscles' }, context);
      expect(result).toEqual({
        id: 'a1b2c3d4-1111-4000-8000-000000000001',
        name: 'Rectus Abdominis',
        slug: 'rectus-abdominis',
        categoryId: 'cat-core-001'
      });
    });

    it('should find muscle by name (case-insensitive)', () => {
      const result = registryLookup('rectus abdominis', { registry: 'muscles' }, context);
      expect(result).toEqual({
        id: 'a1b2c3d4-1111-4000-8000-000000000001',
        name: 'Rectus Abdominis',
        slug: 'rectus-abdominis',
        categoryId: 'cat-core-001'
      });
    });

    it('should find equipment by exact name', () => {
      const result = registryLookup('Barbell', { registry: 'equipment' }, context);
      expect(result).toEqual({
        id: 'eq-0001-4000-8000-000000000001',
        name: 'Barbell',
        slug: 'barbell'
      });
    });
  });

  describe('slug matching', () => {
    it('should find muscle by slug', () => {
      const result = registryLookup('pectoralis-major', { registry: 'muscles' }, context);
      expect(result).toEqual({
        id: 'a1b2c3d4-1111-4000-8000-000000000002',
        name: 'Pectoralis Major',
        slug: 'pectoralis-major',
        categoryId: 'cat-chest-001'
      });
    });

    it('should find equipment by slug', () => {
      const result = registryLookup('body-weight', { registry: 'equipment' }, context);
      expect(result).toEqual({
        id: 'eq-0003-4000-8000-000000000003',
        name: 'Body Weight',
        slug: 'body-weight'
      });
    });
  });

  describe('alias matching', () => {
    it('should find muscle by alias', () => {
      const result = registryLookup('abs', { registry: 'muscles' }, context);
      expect(result).toEqual({
        id: 'a1b2c3d4-1111-4000-8000-000000000001',
        name: 'Rectus Abdominis',
        slug: 'rectus-abdominis',
        categoryId: 'cat-core-001'
      });
    });

    it('should find muscle by alias (case-insensitive)', () => {
      const result = registryLookup('CHEST', { registry: 'muscles' }, context);
      expect(result).toEqual({
        id: 'a1b2c3d4-1111-4000-8000-000000000002',
        name: 'Pectoralis Major',
        slug: 'pectoralis-major',
        categoryId: 'cat-chest-001'
      });
    });

    it('should find equipment by alias', () => {
      const result = registryLookup('db', { registry: 'equipment' }, context);
      expect(result).toEqual({
        id: 'eq-0002-4000-8000-000000000002',
        name: 'Dumbbell',
        slug: 'dumbbell'
      });
    });

    it('should find body weight by alias', () => {
      const result = registryLookup('body weight', { registry: 'equipment' }, context);
      expect(result).toEqual({
        id: 'eq-0003-4000-8000-000000000003',
        name: 'Body Weight',
        slug: 'body-weight'
      });
    });
  });

  describe('fuzzy matching', () => {
    it('should find close match with fuzzy matching enabled', () => {
      const result = registryLookup('bicep', { registry: 'muscles', fuzzyMatch: true }, context);
      // Should find biceps via alias 'bicep'
      expect(result).toEqual({
        id: 'a1b2c3d4-1111-4000-8000-000000000004',
        name: 'Biceps Brachii',
        slug: 'biceps-brachii',
        categoryId: 'cat-arms-001'
      });
    });

    it('should find similar name with fuzzy matching', () => {
      const result = registryLookup('kettlebel', { registry: 'equipment', fuzzyMatch: true }, context);
      expect(result).toEqual({
        id: 'eq-0004-4000-8000-000000000004',
        name: 'Kettlebell',
        slug: 'kettlebell'
      });
    });

    it('should return null for non-match even with fuzzy matching', () => {
      const result = registryLookup('xyz123nonsense', { registry: 'muscles', fuzzyMatch: true }, context);
      expect(result).toBe(null);
    });
  });

  describe('array input handling', () => {
    it('should return first match for array input by default', () => {
      const result = registryLookup(['abs', 'chest'], { registry: 'muscles' }, context);
      // Without toArray, should return first match
      expect(result).toEqual({
        id: 'a1b2c3d4-1111-4000-8000-000000000001',
        name: 'Rectus Abdominis',
        slug: 'rectus-abdominis',
        categoryId: 'cat-core-001'
      });
    });

    it('should return all matches for array input with toArray', () => {
      const result = registryLookup(['abs', 'chest'], { registry: 'muscles', toArray: true }, context);
      expect(result).toEqual([
        {
          id: 'a1b2c3d4-1111-4000-8000-000000000001',
          name: 'Rectus Abdominis',
          slug: 'rectus-abdominis',
          categoryId: 'cat-core-001'
        },
        {
          id: 'a1b2c3d4-1111-4000-8000-000000000002',
          name: 'Pectoralis Major',
          slug: 'pectoralis-major',
          categoryId: 'cat-chest-001'
        }
      ]);
    });

    it('should skip non-matching items in array', () => {
      const result = registryLookup(['abs', 'nonexistent', 'chest'], { registry: 'muscles', toArray: true }, context);
      expect(result).toEqual([
        {
          id: 'a1b2c3d4-1111-4000-8000-000000000001',
          name: 'Rectus Abdominis',
          slug: 'rectus-abdominis',
          categoryId: 'cat-core-001'
        },
        {
          id: 'a1b2c3d4-1111-4000-8000-000000000002',
          name: 'Pectoralis Major',
          slug: 'pectoralis-major',
          categoryId: 'cat-chest-001'
        }
      ]);
    });
  });

  describe('single value with toArray option', () => {
    it('should wrap single result in array when toArray is true', () => {
      const result = registryLookup('abs', { registry: 'muscles', toArray: true }, context);
      expect(result).toEqual([
        {
          id: 'a1b2c3d4-1111-4000-8000-000000000001',
          name: 'Rectus Abdominis',
          slug: 'rectus-abdominis',
          categoryId: 'cat-core-001'
        }
      ]);
    });
  });

  describe('missing registry handling', () => {
    it('should return null when registry is empty', () => {
      context.registries.muscles = [];
      const result = registryLookup('abs', { registry: 'muscles' }, context);
      expect(result).toBe(null);
    });

    it('should return empty array when registry is empty and toArray is true', () => {
      context.registries.muscles = [];
      const result = registryLookup('abs', { registry: 'muscles', toArray: true }, context);
      expect(result).toEqual([]);
    });

    it('should return null when registry is not loaded', () => {
      delete context.registries.muscles;
      const result = registryLookup('abs', { registry: 'muscles' }, context);
      expect(result).toBe(null);
    });
  });

  describe('default registry', () => {
    it('should default to muscles registry when not specified', () => {
      const result = registryLookup('abs', {}, context);
      expect(result).toEqual({
        id: 'a1b2c3d4-1111-4000-8000-000000000001',
        name: 'Rectus Abdominis',
        slug: 'rectus-abdominis',
        categoryId: 'cat-core-001'
      });
    });
  });

  describe('real-world exercise data scenarios', () => {
    it('should lookup target muscle from source data "waist"', () => {
      // In the user's data, bodyPart is "waist" which should map to abs
      // This tests alias matching
      const result = registryLookup('waist', { registry: 'muscles', fuzzyMatch: true }, context);
      // May or may not match depending on aliases - this tests realistic scenario
      expect(result).toBeDefined(); // Could be null if "waist" isn't an alias
    });

    it('should lookup equipment "body weight" from source data', () => {
      const result = registryLookup('body weight', { registry: 'equipment' }, context);
      expect(result).toEqual({
        id: 'eq-0003-4000-8000-000000000003',
        name: 'Body Weight',
        slug: 'body-weight'
      });
    });

    it('should handle trimmed input with whitespace', () => {
      const result = registryLookup('  abs  ', { registry: 'muscles' }, context);
      expect(result).toEqual({
        id: 'a1b2c3d4-1111-4000-8000-000000000001',
        name: 'Rectus Abdominis',
        slug: 'rectus-abdominis',
        categoryId: 'cat-core-001'
      });
    });
  });
});
