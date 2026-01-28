/**
 * Bundled FDS schemas v1.0.0
 * 
 * These schemas are bundled with the transformer to avoid network dependency
 * and ensure consistent validation behavior.
 */

import exerciseSchema from './exercise.schema.json' assert { type: 'json' };
import equipmentSchema from './equipment.schema.json' assert { type: 'json' };
import muscleSchema from './muscle.schema.json' assert { type: 'json' };
import muscleCategorySchema from './muscle-category.schema.json' assert { type: 'json' };
import bodyAtlasSchema from './body-atlas.schema.json' assert { type: 'json' };

export default {
  exercise: exerciseSchema,
  equipment: equipmentSchema,
  muscle: muscleSchema,
  'muscle-category': muscleCategorySchema,
  'body-atlas': bodyAtlasSchema,
};

export {
  exerciseSchema,
  equipmentSchema,
  muscleSchema,
  muscleCategorySchema,
  bodyAtlasSchema,
};
