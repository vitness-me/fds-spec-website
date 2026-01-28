/**
 * Test fixture data for registries
 * 
 * These are minimal registry entries for testing purposes only.
 * Real registries are provided by users of the tool.
 */

import type { MuscleRegistryEntry, EquipmentRegistryEntry, MuscleCategoryRegistryEntry } from '../../src/core/types.js';

export const testMuscles: MuscleRegistryEntry[] = [
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    canonical: {
      name: 'Abs',
      slug: 'abs',
      aliases: ['abdominals', 'rectus abdominis', 'six-pack']
    },
    classification: {
      categoryId: 'a1b2c3d4-cat1-4000-8000-000000000001',
      region: 'core',
      laterality: 'bilateral'
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    canonical: {
      name: 'Pectorals',
      slug: 'pectorals',
      aliases: ['pecs', 'chest', 'pectoralis major']
    },
    classification: {
      categoryId: 'a1b2c3d4-cat2-4000-8000-000000000002',
      region: 'upper-front',
      laterality: 'bilateral'
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    canonical: {
      name: 'Biceps',
      slug: 'biceps',
      aliases: ['biceps brachii', 'bi\'s']
    },
    classification: {
      categoryId: 'a1b2c3d4-cat3-4000-8000-000000000003',
      region: 'upper-front',
      laterality: 'bilateral'
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    canonical: {
      name: 'Lats',
      slug: 'lats',
      aliases: ['latissimus dorsi', 'back']
    },
    classification: {
      categoryId: 'a1b2c3d4-cat4-4000-8000-000000000004',
      region: 'upper-back',
      laterality: 'bilateral'
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-0005-4000-8000-000000000005',
    canonical: {
      name: 'Deltoids',
      slug: 'deltoids',
      aliases: ['delts', 'shoulders', 'shoulder muscles']
    },
    classification: {
      categoryId: 'a1b2c3d4-cat5-4000-8000-000000000005',
      region: 'upper-front',
      laterality: 'bilateral'
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-0006-4000-8000-000000000006',
    canonical: {
      name: 'Quadriceps',
      slug: 'quadriceps',
      aliases: ['quads', 'thighs', 'quad muscles']
    },
    classification: {
      categoryId: 'a1b2c3d4-cat6-4000-8000-000000000006',
      region: 'lower-front',
      laterality: 'bilateral'
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  }
];

export const testEquipment: EquipmentRegistryEntry[] = [
  {
    schemaVersion: '1.0.0',
    id: 'b2c3d4e5-0001-4000-8000-000000000001',
    canonical: {
      name: 'Body Weight',
      slug: 'body-weight',
      abbreviation: 'BW',
      aliases: ['bodyweight', 'no equipment', 'body weight']
    },
    classification: {
      tags: ['bodyweight', 'no-equipment']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'b2c3d4e5-0002-4000-8000-000000000002',
    canonical: {
      name: 'Barbell',
      slug: 'barbell',
      abbreviation: 'BB',
      aliases: ['olympic bar', 'bar']
    },
    classification: {
      tags: ['free-weight', 'bilateral']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'b2c3d4e5-0003-4000-8000-000000000003',
    canonical: {
      name: 'Dumbbell',
      slug: 'dumbbell',
      abbreviation: 'DB',
      aliases: ['dumbbells', 'db']
    },
    classification: {
      tags: ['free-weight', 'unilateral']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'b2c3d4e5-0004-4000-8000-000000000004',
    canonical: {
      name: 'Cable Machine',
      slug: 'cable-machine',
      aliases: ['cable', 'cables', 'pulley']
    },
    classification: {
      tags: ['machine', 'cable']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'b2c3d4e5-0005-4000-8000-000000000005',
    canonical: {
      name: 'Leverage Machine',
      slug: 'leverage-machine',
      aliases: ['lever', 'leverage machine', 'plate loaded machine']
    },
    classification: {
      tags: ['machine', 'leverage']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  }
];

export const testMuscleCategories: MuscleCategoryRegistryEntry[] = [
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-cat1-4000-8000-000000000001',
    canonical: {
      name: 'Core',
      slug: 'core',
      aliases: ['abs', 'midsection']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-cat2-4000-8000-000000000002',
    canonical: {
      name: 'Chest',
      slug: 'chest',
      aliases: ['pectorals']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-cat3-4000-8000-000000000003',
    canonical: {
      name: 'Arms',
      slug: 'arms',
      aliases: ['upper arms']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-cat4-4000-8000-000000000004',
    canonical: {
      name: 'Back',
      slug: 'back',
      aliases: ['upper back', 'lats']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-cat5-4000-8000-000000000005',
    canonical: {
      name: 'Shoulders',
      slug: 'shoulders',
      aliases: ['delts']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'a1b2c3d4-cat6-4000-8000-000000000006',
    canonical: {
      name: 'Legs',
      slug: 'legs',
      aliases: ['upper legs', 'lower body']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  }
];

/**
 * Sample exercises in ExerciseDB format (user's source format)
 */
export const sampleExercises = [
  {
    id: '0001',
    name: '3/4 sit-up',
    bodyPart: 'waist',
    equipment: 'body weight',
    target: 'abs',
    gifUrl: 'http://d205bpvrqc9yn1.cloudfront.net/0001.gif'
  },
  {
    id: '0002',
    name: 'barbell bench press',
    bodyPart: 'chest',
    equipment: 'barbell',
    target: 'pectorals',
    gifUrl: 'http://d205bpvrqc9yn1.cloudfront.net/0002.gif'
  },
  {
    id: '0003',
    name: 'cable biceps curl',
    bodyPart: 'upper arms',
    equipment: 'cable',
    target: 'biceps',
    gifUrl: 'http://d205bpvrqc9yn1.cloudfront.net/0003.gif'
  },
  {
    id: '0045',
    name: 'dumbbell lateral raise',
    bodyPart: 'shoulders',
    equipment: 'dumbbell',
    target: 'delts',
    gifUrl: 'http://d205bpvrqc9yn1.cloudfront.net/0045.gif'
  },
  {
    id: '1234',
    name: 'lever leg extension',
    bodyPart: 'upper legs',
    equipment: 'leverage machine',
    target: 'quads',
    gifUrl: 'http://d205bpvrqc9yn1.cloudfront.net/1234.gif'
  }
];
