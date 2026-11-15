/**
 * A request target for engine tests: the bundled 1.4.0 exercise schema and
 * the test registries. Tiered enrichment needs one.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RequestTarget } from '../../src/ai/response-schema.js';
import { testMuscles, testEquipment, testMuscleCategories } from '../fixtures/registries.js';

const here = dirname(fileURLToPath(import.meta.url));

export const exerciseSchema = JSON.parse(
  readFileSync(join(here, '../../src/schemas/bundled/v1.4.0/exercise.schema.json'), 'utf-8')
) as Record<string, unknown>;

export const exerciseTarget: RequestTarget = {
  schema: exerciseSchema,
  registries: { muscles: testMuscles, equipment: testEquipment, muscleCategories: testMuscleCategories },
};
