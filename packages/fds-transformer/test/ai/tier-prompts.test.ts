/**
 * Tier Prompts Tests
 */

import { describe, it, expect } from 'vitest';
import {
  SYSTEM_PROMPTS,
  SIMPLE_TIER_PROMPTS,
  MEDIUM_TIER_PROMPTS,
  COMPLEX_TIER_PROMPTS,
  SCHEMA_ENUMS,
  buildTierPrompt,
  buildAllTierPrompts,
  getPromptTemplate,
  getTierPrompts,
  getTierFields,
  validateEnumValue,
  getEnumValues,
  type ExerciseContext,
  type PromptTemplate,
  type BuiltPrompt,
} from '../../src/ai/prompts/tier-prompts.js';
import type { TierName } from '../../src/core/types.js';

// ============================================================================
// Test Data
// ============================================================================

const sampleExercise: ExerciseContext = {
  name: 'Barbell Bench Press',
  slug: 'barbell-bench-press',
  description: 'A compound chest exercise using a barbell.',
  aliases: ['bench press', 'flat bench'],
  primaryTargets: [
    { id: 'pectoralis-major', name: 'Pectoralis Major' },
    { id: 'anterior-deltoid', name: 'Anterior Deltoid' },
  ],
  requiredEquipment: [
    { id: 'barbell', name: 'Barbell' },
    { id: 'flat-bench', name: 'Flat Bench' },
  ],
  exerciseType: 'strength',
};

const sampleExercise2: ExerciseContext = {
  name: 'Pull-Up',
  slug: 'pull-up',
  description: 'A bodyweight pulling exercise.',
  primaryTargets: [
    { id: 'latissimus-dorsi', name: 'Latissimus Dorsi' },
    { id: 'biceps-brachii', name: 'Biceps Brachii' },
  ],
  requiredEquipment: [{ id: 'pull-up-bar', name: 'Pull-Up Bar' }],
  exerciseType: 'strength',
};

const sampleExercise3: ExerciseContext = {
  name: 'Plank',
  slug: 'plank',
  primaryTargets: [{ id: 'rectus-abdominis', name: 'Rectus Abdominis' }],
};

const minimalExercise: ExerciseContext = {
  name: 'Simple Exercise',
  slug: 'simple-exercise',
};

// ============================================================================
// SCHEMA_ENUMS Tests
// ============================================================================

describe('SCHEMA_ENUMS', () => {
  describe('exerciseType', () => {
    it('should contain all valid exercise types', () => {
      expect(SCHEMA_ENUMS.exerciseType).toContain('strength');
      expect(SCHEMA_ENUMS.exerciseType).toContain('cardio');
      expect(SCHEMA_ENUMS.exerciseType).toContain('flexibility');
      expect(SCHEMA_ENUMS.exerciseType).toContain('balance');
      expect(SCHEMA_ENUMS.exerciseType).toContain('plyometric');
    });

    it('should have exactly 5 exercise types', () => {
      expect(SCHEMA_ENUMS.exerciseType).toHaveLength(5);
    });
  });

  describe('level', () => {
    it('should contain all valid levels', () => {
      expect(SCHEMA_ENUMS.level).toContain('beginner');
      expect(SCHEMA_ENUMS.level).toContain('intermediate');
      expect(SCHEMA_ENUMS.level).toContain('advanced');
    });

    it('should have exactly 3 levels', () => {
      expect(SCHEMA_ENUMS.level).toHaveLength(3);
    });
  });

  describe('movement', () => {
    it('should contain all valid movement patterns', () => {
      expect(SCHEMA_ENUMS.movement).toContain('squat');
      expect(SCHEMA_ENUMS.movement).toContain('hinge');
      expect(SCHEMA_ENUMS.movement).toContain('lunge');
      expect(SCHEMA_ENUMS.movement).toContain('push-horizontal');
      expect(SCHEMA_ENUMS.movement).toContain('push-vertical');
      expect(SCHEMA_ENUMS.movement).toContain('pull-horizontal');
      expect(SCHEMA_ENUMS.movement).toContain('pull-vertical');
      expect(SCHEMA_ENUMS.movement).toContain('carry');
      expect(SCHEMA_ENUMS.movement).toContain('core-anti-extension');
      expect(SCHEMA_ENUMS.movement).toContain('core-anti-rotation');
      expect(SCHEMA_ENUMS.movement).toContain('rotation');
      expect(SCHEMA_ENUMS.movement).toContain('locomotion');
      expect(SCHEMA_ENUMS.movement).toContain('isolation');
      expect(SCHEMA_ENUMS.movement).toContain('other');
    });

    it('should have exactly 14 movement patterns', () => {
      expect(SCHEMA_ENUMS.movement).toHaveLength(14);
    });
  });

  describe('mechanics', () => {
    it('should contain compound and isolation', () => {
      expect(SCHEMA_ENUMS.mechanics).toContain('compound');
      expect(SCHEMA_ENUMS.mechanics).toContain('isolation');
    });

    it('should have exactly 2 mechanics types', () => {
      expect(SCHEMA_ENUMS.mechanics).toHaveLength(2);
    });
  });

  describe('force', () => {
    it('should contain all valid force types', () => {
      expect(SCHEMA_ENUMS.force).toContain('push');
      expect(SCHEMA_ENUMS.force).toContain('pull');
      expect(SCHEMA_ENUMS.force).toContain('static');
      expect(SCHEMA_ENUMS.force).toContain('mixed');
    });

    it('should have exactly 4 force types', () => {
      expect(SCHEMA_ENUMS.force).toHaveLength(4);
    });
  });

  describe('kineticChain', () => {
    it('should contain all valid kinetic chain types', () => {
      expect(SCHEMA_ENUMS.kineticChain).toContain('open');
      expect(SCHEMA_ENUMS.kineticChain).toContain('closed');
      expect(SCHEMA_ENUMS.kineticChain).toContain('mixed');
    });

    it('should have exactly 3 kinetic chain types', () => {
      expect(SCHEMA_ENUMS.kineticChain).toHaveLength(3);
    });
  });

  describe('relationType', () => {
    it('should contain all valid relation types', () => {
      expect(SCHEMA_ENUMS.relationType).toContain('alternate');
      expect(SCHEMA_ENUMS.relationType).toContain('variation');
      expect(SCHEMA_ENUMS.relationType).toContain('substitute');
      expect(SCHEMA_ENUMS.relationType).toContain('progression');
      expect(SCHEMA_ENUMS.relationType).toContain('regression');
      expect(SCHEMA_ENUMS.relationType).toContain('equipmentVariant');
      expect(SCHEMA_ENUMS.relationType).toContain('accessory');
      expect(SCHEMA_ENUMS.relationType).toContain('mobilityPrep');
      expect(SCHEMA_ENUMS.relationType).toContain('similarPattern');
      expect(SCHEMA_ENUMS.relationType).toContain('unilateralPair');
      expect(SCHEMA_ENUMS.relationType).toContain('contralateralPair');
    });

    it('should have exactly 11 relation types', () => {
      expect(SCHEMA_ENUMS.relationType).toHaveLength(11);
    });
  });

  describe('metricType', () => {
    it('should contain common metric types', () => {
      expect(SCHEMA_ENUMS.metricType).toContain('reps');
      expect(SCHEMA_ENUMS.metricType).toContain('weight');
      expect(SCHEMA_ENUMS.metricType).toContain('duration');
      expect(SCHEMA_ENUMS.metricType).toContain('distance');
    });

    it('should have exactly 13 metric types', () => {
      expect(SCHEMA_ENUMS.metricType).toHaveLength(13);
    });
  });

  describe('metricUnit', () => {
    it('should contain common metric units', () => {
      expect(SCHEMA_ENUMS.metricUnit).toContain('count');
      expect(SCHEMA_ENUMS.metricUnit).toContain('kg');
      expect(SCHEMA_ENUMS.metricUnit).toContain('lb');
      expect(SCHEMA_ENUMS.metricUnit).toContain('s');
      expect(SCHEMA_ENUMS.metricUnit).toContain('min');
    });

    it('should have exactly 17 metric units', () => {
      expect(SCHEMA_ENUMS.metricUnit).toHaveLength(17);
    });
  });
});

// ============================================================================
// SYSTEM_PROMPTS Tests
// ============================================================================

describe('SYSTEM_PROMPTS', () => {
  it('should have prompts for all tiers', () => {
    expect(SYSTEM_PROMPTS.simple).toBeDefined();
    expect(SYSTEM_PROMPTS.medium).toBeDefined();
    expect(SYSTEM_PROMPTS.complex).toBeDefined();
  });

  it('should have non-empty prompts', () => {
    expect(SYSTEM_PROMPTS.simple.length).toBeGreaterThan(0);
    expect(SYSTEM_PROMPTS.medium.length).toBeGreaterThan(0);
    expect(SYSTEM_PROMPTS.complex.length).toBeGreaterThan(0);
  });

  describe('simple tier system prompt', () => {
    it('should mention fitness data specialist role', () => {
      expect(SYSTEM_PROMPTS.simple).toContain('fitness');
    });

    it('should mention JSON response format', () => {
      expect(SYSTEM_PROMPTS.simple).toContain('JSON');
    });
  });

  describe('medium tier system prompt', () => {
    it('should mention exercise science expertise', () => {
      expect(SYSTEM_PROMPTS.medium).toContain('exercise science');
    });

    it('should mention safety considerations', () => {
      expect(SYSTEM_PROMPTS.medium).toContain('safety');
    });
  });

  describe('complex tier system prompt', () => {
    it('should mention biomechanics expertise', () => {
      expect(SYSTEM_PROMPTS.complex).toContain('biomechanics');
    });

    it('should mention accuracy as paramount', () => {
      expect(SYSTEM_PROMPTS.complex).toContain('Accuracy');
    });
  });
});

// ============================================================================
// SIMPLE_TIER_PROMPTS Tests
// ============================================================================

describe('SIMPLE_TIER_PROMPTS', () => {
  it('should have all expected prompt templates', () => {
    expect(SIMPLE_TIER_PROMPTS.description).toBeDefined();
    expect(SIMPLE_TIER_PROMPTS.aliases).toBeDefined();
    expect(SIMPLE_TIER_PROMPTS['classification-simple']).toBeDefined();
    expect(SIMPLE_TIER_PROMPTS.metrics).toBeDefined();
    expect(SIMPLE_TIER_PROMPTS.equipment).toBeDefined();
  });

  describe('description template', () => {
    it('should have correct fields', () => {
      expect(SIMPLE_TIER_PROMPTS.description.fields).toContain('canonical.description');
    });

    it('should have exercises placeholder', () => {
      expect(SIMPLE_TIER_PROMPTS.description.template).toContain('{{exercises}}');
    });

    it('should specify JSON response format', () => {
      expect(SIMPLE_TIER_PROMPTS.description.template).toContain('JSON');
    });
  });

  describe('aliases template', () => {
    it('should have correct fields', () => {
      expect(SIMPLE_TIER_PROMPTS.aliases.fields).toContain('canonical.aliases');
    });

    it('should mention maximum aliases', () => {
      expect(SIMPLE_TIER_PROMPTS.aliases.template).toContain('Maximum 5');
    });
  });

  describe('classification-simple template', () => {
    it('should have all classification fields', () => {
      const fields = SIMPLE_TIER_PROMPTS['classification-simple'].fields;
      expect(fields).toContain('classification.exerciseType');
      expect(fields).toContain('classification.level');
      expect(fields).toContain('classification.unilateral');
    });

    it('should include exerciseType options', () => {
      expect(SIMPLE_TIER_PROMPTS['classification-simple'].template).toContain('strength');
      expect(SIMPLE_TIER_PROMPTS['classification-simple'].template).toContain('cardio');
    });

    it('should include level options', () => {
      expect(SIMPLE_TIER_PROMPTS['classification-simple'].template).toContain('beginner');
      expect(SIMPLE_TIER_PROMPTS['classification-simple'].template).toContain('advanced');
    });
  });

  describe('metrics template', () => {
    it('should have correct fields', () => {
      const fields = SIMPLE_TIER_PROMPTS.metrics.fields;
      expect(fields).toContain('metrics.primary');
      expect(fields).toContain('metrics.secondary');
    });

    it('should include metric type options', () => {
      expect(SIMPLE_TIER_PROMPTS.metrics.template).toContain('reps');
      expect(SIMPLE_TIER_PROMPTS.metrics.template).toContain('weight');
      expect(SIMPLE_TIER_PROMPTS.metrics.template).toContain('duration');
    });
  });

  describe('equipment template', () => {
    it('should have correct fields', () => {
      expect(SIMPLE_TIER_PROMPTS.equipment.fields).toContain('equipment.optional');
    });

    it('should mention equipment examples', () => {
      expect(SIMPLE_TIER_PROMPTS.equipment.template).toContain('dumbbell');
      expect(SIMPLE_TIER_PROMPTS.equipment.template).toContain('barbell');
    });
  });
});

// ============================================================================
// MEDIUM_TIER_PROMPTS Tests
// ============================================================================

describe('MEDIUM_TIER_PROMPTS', () => {
  it('should have all expected prompt templates', () => {
    expect(MEDIUM_TIER_PROMPTS.constraints).toBeDefined();
    expect(MEDIUM_TIER_PROMPTS.relations).toBeDefined();
  });

  describe('constraints template', () => {
    it('should have all constraint fields', () => {
      const fields = MEDIUM_TIER_PROMPTS.constraints.fields;
      expect(fields).toContain('constraints.contraindications');
      expect(fields).toContain('constraints.prerequisites');
      expect(fields).toContain('constraints.progressions');
      expect(fields).toContain('constraints.regressions');
    });

    it('should explain contraindications', () => {
      expect(MEDIUM_TIER_PROMPTS.constraints.template).toContain('Contraindications');
      expect(MEDIUM_TIER_PROMPTS.constraints.template).toContain('avoided');
    });

    it('should explain prerequisites', () => {
      expect(MEDIUM_TIER_PROMPTS.constraints.template).toContain('Prerequisites');
    });
  });

  describe('relations template', () => {
    it('should have correct fields', () => {
      expect(MEDIUM_TIER_PROMPTS.relations.fields).toContain('relations');
    });

    it('should include all relation types', () => {
      const template = MEDIUM_TIER_PROMPTS.relations.template;
      expect(template).toContain('alternate');
      expect(template).toContain('variation');
      expect(template).toContain('substitute');
      expect(template).toContain('progression');
    });

    it('should mention confidence scoring', () => {
      expect(MEDIUM_TIER_PROMPTS.relations.template).toContain('confidence');
      expect(MEDIUM_TIER_PROMPTS.relations.template).toContain('0.7');
    });
  });
});

// ============================================================================
// COMPLEX_TIER_PROMPTS Tests
// ============================================================================

describe('COMPLEX_TIER_PROMPTS', () => {
  it('should have biomechanics template', () => {
    expect(COMPLEX_TIER_PROMPTS.biomechanics).toBeDefined();
  });

  describe('biomechanics template', () => {
    it('should have all classification fields', () => {
      const fields = COMPLEX_TIER_PROMPTS.biomechanics.fields;
      expect(fields).toContain('classification.movement');
      expect(fields).toContain('classification.mechanics');
      expect(fields).toContain('classification.force');
      expect(fields).toContain('classification.kineticChain');
      expect(fields).toContain('classification.tags');
      expect(fields).toContain('targets.secondary');
    });

    it('should use single exercise placeholder', () => {
      expect(COMPLEX_TIER_PROMPTS.biomechanics.template).toContain('{{exercise}}');
      expect(COMPLEX_TIER_PROMPTS.biomechanics.template).toContain('{{primaryTargets}}');
      expect(COMPLEX_TIER_PROMPTS.biomechanics.template).toContain('{{equipment}}');
    });

    it('should include movement pattern guidance', () => {
      const template = COMPLEX_TIER_PROMPTS.biomechanics.template;
      expect(template).toContain('squat: Knee-dominant');
      expect(template).toContain('hinge: Hip-dominant');
      expect(template).toContain('lunge: Single-leg');
    });

    it('should include kinetic chain guidance', () => {
      expect(COMPLEX_TIER_PROMPTS.biomechanics.template).toContain('closed: Distal segment');
      expect(COMPLEX_TIER_PROMPTS.biomechanics.template).toContain('open: Distal segment free');
    });

    it('should include all movement enum values', () => {
      const template = COMPLEX_TIER_PROMPTS.biomechanics.template;
      for (const movement of SCHEMA_ENUMS.movement) {
        expect(template).toContain(movement);
      }
    });
  });
});

// ============================================================================
// getPromptTemplate Tests
// ============================================================================

describe('getPromptTemplate', () => {
  it('should return simple tier templates', () => {
    expect(getPromptTemplate('simple', 'description')).toBe(SIMPLE_TIER_PROMPTS.description);
    expect(getPromptTemplate('simple', 'aliases')).toBe(SIMPLE_TIER_PROMPTS.aliases);
    expect(getPromptTemplate('simple', 'classification-simple')).toBe(
      SIMPLE_TIER_PROMPTS['classification-simple']
    );
  });

  it('should return medium tier templates', () => {
    expect(getPromptTemplate('medium', 'constraints')).toBe(MEDIUM_TIER_PROMPTS.constraints);
    expect(getPromptTemplate('medium', 'relations')).toBe(MEDIUM_TIER_PROMPTS.relations);
  });

  it('should return complex tier templates', () => {
    expect(getPromptTemplate('complex', 'biomechanics')).toBe(COMPLEX_TIER_PROMPTS.biomechanics);
  });

  it('should return undefined for non-existent templates', () => {
    expect(getPromptTemplate('simple', 'nonexistent')).toBeUndefined();
    expect(getPromptTemplate('medium', 'nonexistent')).toBeUndefined();
    expect(getPromptTemplate('complex', 'nonexistent')).toBeUndefined();
  });

  it('should return undefined for invalid tier', () => {
    expect(getPromptTemplate('invalid' as TierName, 'description')).toBeUndefined();
  });
});

// ============================================================================
// getTierPrompts Tests
// ============================================================================

describe('getTierPrompts', () => {
  it('should return all simple tier prompts', () => {
    const prompts = getTierPrompts('simple');
    expect(prompts).toBe(SIMPLE_TIER_PROMPTS);
    expect(Object.keys(prompts)).toHaveLength(5);
  });

  it('should return all medium tier prompts', () => {
    const prompts = getTierPrompts('medium');
    expect(prompts).toBe(MEDIUM_TIER_PROMPTS);
    expect(Object.keys(prompts)).toHaveLength(2);
  });

  it('should return all complex tier prompts', () => {
    const prompts = getTierPrompts('complex');
    expect(prompts).toBe(COMPLEX_TIER_PROMPTS);
    expect(Object.keys(prompts)).toHaveLength(1);
  });

  it('should return empty object for invalid tier', () => {
    const prompts = getTierPrompts('invalid' as TierName);
    expect(prompts).toEqual({});
  });
});

// ============================================================================
// getTierFields Tests
// ============================================================================

describe('getTierFields', () => {
  describe('simple tier', () => {
    it('should return all simple tier fields', () => {
      const fields = getTierFields('simple');
      expect(fields).toContain('canonical.description');
      expect(fields).toContain('canonical.aliases');
      expect(fields).toContain('classification.exerciseType');
      expect(fields).toContain('classification.level');
      expect(fields).toContain('classification.unilateral');
      expect(fields).toContain('metrics.primary');
      expect(fields).toContain('metrics.secondary');
      expect(fields).toContain('equipment.optional');
    });

    it('should have no duplicates', () => {
      const fields = getTierFields('simple');
      const uniqueFields = [...new Set(fields)];
      expect(fields).toHaveLength(uniqueFields.length);
    });
  });

  describe('medium tier', () => {
    it('should return all medium tier fields', () => {
      const fields = getTierFields('medium');
      expect(fields).toContain('constraints.contraindications');
      expect(fields).toContain('constraints.prerequisites');
      expect(fields).toContain('constraints.progressions');
      expect(fields).toContain('constraints.regressions');
      expect(fields).toContain('relations');
    });
  });

  describe('complex tier', () => {
    it('should return all complex tier fields', () => {
      const fields = getTierFields('complex');
      expect(fields).toContain('classification.movement');
      expect(fields).toContain('classification.mechanics');
      expect(fields).toContain('classification.force');
      expect(fields).toContain('classification.kineticChain');
      expect(fields).toContain('classification.tags');
      expect(fields).toContain('targets.secondary');
    });
  });

  it('should return empty array for invalid tier', () => {
    const fields = getTierFields('invalid' as TierName);
    expect(fields).toEqual([]);
  });
});

// ============================================================================
// buildTierPrompt Tests
// ============================================================================

describe('buildTierPrompt', () => {
  describe('simple tier prompts', () => {
    it('should build description prompt', () => {
      const prompt = buildTierPrompt('simple', 'description', [sampleExercise]);

      expect(prompt).toBeDefined();
      expect(prompt!.system).toBe(SYSTEM_PROMPTS.simple);
      expect(prompt!.tier).toBe('simple');
      expect(prompt!.fields).toContain('canonical.description');
    });

    it('should include exercise details in user prompt', () => {
      const prompt = buildTierPrompt('simple', 'description', [sampleExercise]);

      expect(prompt!.user).toContain('Barbell Bench Press');
      expect(prompt!.user).toContain('barbell-bench-press');
    });

    it('should format multiple exercises', () => {
      const prompt = buildTierPrompt('simple', 'description', [
        sampleExercise,
        sampleExercise2,
        sampleExercise3,
      ]);

      expect(prompt!.user).toContain('Barbell Bench Press');
      expect(prompt!.user).toContain('Pull-Up');
      expect(prompt!.user).toContain('Plank');
      expect(prompt!.user).toContain('1.');
      expect(prompt!.user).toContain('2.');
      expect(prompt!.user).toContain('3.');
    });

    it('should include description when available', () => {
      const prompt = buildTierPrompt('simple', 'aliases', [sampleExercise]);

      expect(prompt!.user).toContain('Description: A compound chest exercise');
    });

    it('should include primary targets when available', () => {
      const prompt = buildTierPrompt('simple', 'equipment', [sampleExercise]);

      expect(prompt!.user).toContain('Pectoralis Major');
      expect(prompt!.user).toContain('Primary targets');
    });

    it('should include equipment when available', () => {
      const prompt = buildTierPrompt('simple', 'equipment', [sampleExercise]);

      expect(prompt!.user).toContain('Barbell');
      expect(prompt!.user).toContain('Flat Bench');
    });

    it('should handle minimal exercise data', () => {
      const prompt = buildTierPrompt('simple', 'description', [minimalExercise]);

      expect(prompt).toBeDefined();
      expect(prompt!.user).toContain('Simple Exercise');
      expect(prompt!.user).toContain('simple-exercise');
      // Should not crash with missing optional fields
    });
  });

  describe('medium tier prompts', () => {
    it('should build constraints prompt', () => {
      const prompt = buildTierPrompt('medium', 'constraints', [sampleExercise, sampleExercise2]);

      expect(prompt).toBeDefined();
      expect(prompt!.system).toBe(SYSTEM_PROMPTS.medium);
      expect(prompt!.tier).toBe('medium');
      expect(prompt!.fields).toContain('constraints.contraindications');
    });

    it('should build relations prompt', () => {
      const prompt = buildTierPrompt('medium', 'relations', [sampleExercise]);

      expect(prompt).toBeDefined();
      expect(prompt!.fields).toContain('relations');
    });
  });

  describe('complex tier prompts', () => {
    it('should build biomechanics prompt', () => {
      const prompt = buildTierPrompt('complex', 'biomechanics', [sampleExercise]);

      expect(prompt).toBeDefined();
      expect(prompt!.system).toBe(SYSTEM_PROMPTS.complex);
      expect(prompt!.tier).toBe('complex');
      expect(prompt!.fields).toContain('classification.movement');
      expect(prompt!.fields).toContain('classification.mechanics');
    });

    it('should use single exercise format', () => {
      const prompt = buildTierPrompt('complex', 'biomechanics', [sampleExercise]);

      // Should have the Name: format, not numbered list
      expect(prompt!.user).toContain('Name: Barbell Bench Press');
      expect(prompt!.user).toContain('Slug: barbell-bench-press');
    });

    it('should replace primaryTargets placeholder', () => {
      const prompt = buildTierPrompt('complex', 'biomechanics', [sampleExercise]);

      expect(prompt!.user).toContain('Pectoralis Major, Anterior Deltoid');
      expect(prompt!.user).not.toContain('{{primaryTargets}}');
    });

    it('should replace equipment placeholder', () => {
      const prompt = buildTierPrompt('complex', 'biomechanics', [sampleExercise]);

      expect(prompt!.user).toContain('Barbell, Flat Bench');
      expect(prompt!.user).not.toContain('{{equipment}}');
    });

    it('should handle missing primaryTargets', () => {
      const prompt = buildTierPrompt('complex', 'biomechanics', [minimalExercise]);

      expect(prompt!.user).toContain('Not specified');
    });

    it('should handle missing equipment', () => {
      const prompt = buildTierPrompt('complex', 'biomechanics', [minimalExercise]);

      expect(prompt!.user).toContain('Bodyweight / None');
    });

    it('should only use first exercise for complex tier', () => {
      const prompt = buildTierPrompt('complex', 'biomechanics', [sampleExercise, sampleExercise2]);

      // Only first exercise should be used
      expect(prompt!.user).toContain('Barbell Bench Press');
      expect(prompt!.user).not.toContain('Pull-Up');
    });
  });

  describe('error cases', () => {
    it('should return undefined for non-existent prompt', () => {
      const prompt = buildTierPrompt('simple', 'nonexistent', [sampleExercise]);
      expect(prompt).toBeUndefined();
    });

    it('should return undefined for empty exercises array in complex tier', () => {
      const prompt = buildTierPrompt('complex', 'biomechanics', []);
      expect(prompt).toBeUndefined();
    });

    it('should return undefined for invalid tier', () => {
      const prompt = buildTierPrompt('invalid' as TierName, 'description', [sampleExercise]);
      expect(prompt).toBeUndefined();
    });
  });
});

// ============================================================================
// buildAllTierPrompts Tests
// ============================================================================

describe('buildAllTierPrompts', () => {
  it('should build all simple tier prompts', () => {
    const prompts = buildAllTierPrompts('simple', [sampleExercise, sampleExercise2]);

    expect(prompts).toHaveLength(5); // description, aliases, classification-simple, metrics, equipment
    expect(prompts.every((p) => p.tier === 'simple')).toBe(true);
    expect(prompts.every((p) => p.system === SYSTEM_PROMPTS.simple)).toBe(true);
  });

  it('should build all medium tier prompts', () => {
    const prompts = buildAllTierPrompts('medium', [sampleExercise]);

    expect(prompts).toHaveLength(2); // constraints, relations
    expect(prompts.every((p) => p.tier === 'medium')).toBe(true);
  });

  it('should build all complex tier prompts', () => {
    const prompts = buildAllTierPrompts('complex', [sampleExercise]);

    expect(prompts).toHaveLength(1); // biomechanics
    expect(prompts[0].tier).toBe('complex');
  });

  it('should return empty array for invalid tier', () => {
    const prompts = buildAllTierPrompts('invalid' as TierName, [sampleExercise]);
    expect(prompts).toHaveLength(0);
  });

  it('should include all fields across all prompts', () => {
    const prompts = buildAllTierPrompts('simple', [sampleExercise]);
    const allFields = prompts.flatMap((p) => p.fields);

    expect(allFields).toContain('canonical.description');
    expect(allFields).toContain('canonical.aliases');
    expect(allFields).toContain('classification.exerciseType');
    expect(allFields).toContain('metrics.primary');
    expect(allFields).toContain('equipment.optional');
  });
});

// ============================================================================
// validateEnumValue Tests
// ============================================================================

describe('validateEnumValue', () => {
  describe('exerciseType', () => {
    it('should validate correct values', () => {
      expect(validateEnumValue('exerciseType', 'strength')).toBe(true);
      expect(validateEnumValue('exerciseType', 'cardio')).toBe(true);
      expect(validateEnumValue('exerciseType', 'flexibility')).toBe(true);
      expect(validateEnumValue('exerciseType', 'balance')).toBe(true);
      expect(validateEnumValue('exerciseType', 'plyometric')).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(validateEnumValue('exerciseType', 'invalid')).toBe(false);
      expect(validateEnumValue('exerciseType', 'STRENGTH')).toBe(false);
      expect(validateEnumValue('exerciseType', '')).toBe(false);
    });
  });

  describe('level', () => {
    it('should validate correct values', () => {
      expect(validateEnumValue('level', 'beginner')).toBe(true);
      expect(validateEnumValue('level', 'intermediate')).toBe(true);
      expect(validateEnumValue('level', 'advanced')).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(validateEnumValue('level', 'expert')).toBe(false);
      expect(validateEnumValue('level', 'Beginner')).toBe(false);
    });
  });

  describe('movement', () => {
    it('should validate correct values', () => {
      expect(validateEnumValue('movement', 'squat')).toBe(true);
      expect(validateEnumValue('movement', 'hinge')).toBe(true);
      expect(validateEnumValue('movement', 'push-horizontal')).toBe(true);
      expect(validateEnumValue('movement', 'core-anti-extension')).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(validateEnumValue('movement', 'bench-press')).toBe(false);
      expect(validateEnumValue('movement', 'pushHorizontal')).toBe(false);
    });
  });

  describe('mechanics', () => {
    it('should validate correct values', () => {
      expect(validateEnumValue('mechanics', 'compound')).toBe(true);
      expect(validateEnumValue('mechanics', 'isolation')).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(validateEnumValue('mechanics', 'hybrid')).toBe(false);
    });
  });

  describe('force', () => {
    it('should validate correct values', () => {
      expect(validateEnumValue('force', 'push')).toBe(true);
      expect(validateEnumValue('force', 'pull')).toBe(true);
      expect(validateEnumValue('force', 'static')).toBe(true);
      expect(validateEnumValue('force', 'mixed')).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(validateEnumValue('force', 'dynamic')).toBe(false);
    });
  });

  describe('kineticChain', () => {
    it('should validate correct values', () => {
      expect(validateEnumValue('kineticChain', 'open')).toBe(true);
      expect(validateEnumValue('kineticChain', 'closed')).toBe(true);
      expect(validateEnumValue('kineticChain', 'mixed')).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(validateEnumValue('kineticChain', 'hybrid')).toBe(false);
    });
  });

  describe('relationType', () => {
    it('should validate correct values', () => {
      expect(validateEnumValue('relationType', 'alternate')).toBe(true);
      expect(validateEnumValue('relationType', 'variation')).toBe(true);
      expect(validateEnumValue('relationType', 'equipmentVariant')).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(validateEnumValue('relationType', 'similar')).toBe(false);
    });
  });
});

// ============================================================================
// getEnumValues Tests
// ============================================================================

describe('getEnumValues', () => {
  it('should return exerciseType values', () => {
    const values = getEnumValues('exerciseType');
    expect(values).toEqual(SCHEMA_ENUMS.exerciseType);
    expect(values).toContain('strength');
  });

  it('should return level values', () => {
    const values = getEnumValues('level');
    expect(values).toEqual(SCHEMA_ENUMS.level);
    expect(values).toContain('beginner');
  });

  it('should return movement values', () => {
    const values = getEnumValues('movement');
    expect(values).toEqual(SCHEMA_ENUMS.movement);
    expect(values).toHaveLength(14);
  });

  it('should return readonly arrays', () => {
    const values = getEnumValues('exerciseType');
    // TypeScript should prevent modification, but at runtime it's still an array
    expect(Array.isArray(values)).toBe(true);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('integration', () => {
  describe('prompt building workflow', () => {
    it('should handle full simple tier workflow', () => {
      const exercises = [sampleExercise, sampleExercise2, sampleExercise3];

      // Get all fields for the tier
      const fields = getTierFields('simple');
      expect(fields.length).toBeGreaterThan(0);

      // Build all prompts
      const prompts = buildAllTierPrompts('simple', exercises);
      expect(prompts.length).toBeGreaterThan(0);

      // Each prompt should be valid
      for (const prompt of prompts) {
        expect(prompt.system).toBe(SYSTEM_PROMPTS.simple);
        expect(prompt.tier).toBe('simple');
        expect(prompt.fields.length).toBeGreaterThan(0);
        expect(prompt.user).toContain('Barbell Bench Press');
        expect(prompt.user).toContain('Pull-Up');
        expect(prompt.user).toContain('Plank');
      }
    });

    it('should handle full complex tier workflow', () => {
      // Complex tier processes one exercise at a time
      const exercises = [sampleExercise];

      // Get all fields for the tier
      const fields = getTierFields('complex');
      expect(fields).toContain('classification.movement');
      expect(fields).toContain('targets.secondary');

      // Build prompt
      const prompt = buildTierPrompt('complex', 'biomechanics', exercises);
      expect(prompt).toBeDefined();
      expect(prompt!.system).toContain('biomechanics');
      expect(prompt!.user).toContain('Pectoralis Major');
    });
  });

  describe('enum consistency', () => {
    it('should have SCHEMA_ENUMS match prompt templates', () => {
      // exerciseType in classification-simple should match SCHEMA_ENUMS.exerciseType
      const template = SIMPLE_TIER_PROMPTS['classification-simple'].template;
      for (const type of SCHEMA_ENUMS.exerciseType) {
        expect(template).toContain(type);
      }
    });

    it('should have movement patterns in biomechanics template', () => {
      const template = COMPLEX_TIER_PROMPTS.biomechanics.template;
      for (const movement of SCHEMA_ENUMS.movement) {
        expect(template).toContain(movement);
      }
    });

    it('should have relation types in relations template', () => {
      const template = MEDIUM_TIER_PROMPTS.relations.template;
      for (const relationType of SCHEMA_ENUMS.relationType) {
        expect(template).toContain(relationType);
      }
    });
  });

  describe('prompt template structure', () => {
    it('all templates should have required properties', () => {
      const allTemplates = [
        ...Object.values(SIMPLE_TIER_PROMPTS),
        ...Object.values(MEDIUM_TIER_PROMPTS),
        ...Object.values(COMPLEX_TIER_PROMPTS),
      ];

      for (const template of allTemplates) {
        expect(template.id).toBeDefined();
        expect(template.id.length).toBeGreaterThan(0);
        expect(template.fields).toBeDefined();
        expect(template.fields.length).toBeGreaterThan(0);
        expect(template.template).toBeDefined();
        expect(template.template.length).toBeGreaterThan(0);
        expect(template.outputSchema).toBeDefined();
        expect(template.outputSchema.length).toBeGreaterThan(0);
      }
    });

    it('all templates should instruct JSON output', () => {
      const allTemplates = [
        ...Object.values(SIMPLE_TIER_PROMPTS),
        ...Object.values(MEDIUM_TIER_PROMPTS),
        ...Object.values(COMPLEX_TIER_PROMPTS),
      ];

      for (const template of allTemplates) {
        expect(template.template.toLowerCase()).toContain('json');
      }
    });

    it('batch templates should have exercises placeholder', () => {
      const batchTemplates = [
        ...Object.values(SIMPLE_TIER_PROMPTS),
        ...Object.values(MEDIUM_TIER_PROMPTS),
      ];

      for (const template of batchTemplates) {
        expect(template.template).toContain('{{exercises}}');
      }
    });

    it('complex templates should have single exercise placeholder', () => {
      const complexTemplates = Object.values(COMPLEX_TIER_PROMPTS);

      for (const template of complexTemplates) {
        expect(template.template).toContain('{{exercise}}');
        expect(template.template).not.toContain('{{exercises}}');
      }
    });
  });
});
