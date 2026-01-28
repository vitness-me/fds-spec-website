/**
 * Tier Prompts - Tier-specific prompt templates for AI enrichment
 *
 * Provides structured prompts for each complexity tier:
 * - Simple (Haiku): description, aliases, exerciseType, level, unilateral, metrics, equipment.optional
 * - Medium (Sonnet): constraints.*, relations
 * - Complex (Opus): classification.movement/mechanics/force/kineticChain/tags, targets.secondary
 *
 * All prompts instruct the model to return structured JSON for reliable parsing.
 */

import type { TierName } from '../../core/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Exercise context provided to prompt builders
 */
export interface ExerciseContext {
  /** Exercise name */
  name: string;
  /** Exercise slug (URL-safe identifier) */
  slug: string;
  /** Current description if available */
  description?: string;
  /** Current aliases if available */
  aliases?: string[];
  /** Primary target muscles */
  primaryTargets?: Array<{ name: string; id: string }>;
  /** Required equipment */
  requiredEquipment?: Array<{ name: string; id: string }>;
  /** Exercise type if known */
  exerciseType?: string;
  /** Any additional context fields */
  [key: string]: unknown;
}

/**
 * Batch of exercises for batch processing
 */
export interface ExerciseBatch {
  exercises: ExerciseContext[];
}

/**
 * Prompt template with metadata
 */
export interface PromptTemplate {
  /** Unique identifier for this prompt */
  id: string;
  /** Fields this prompt generates */
  fields: string[];
  /** The prompt template with placeholders */
  template: string;
  /** Expected output schema description */
  outputSchema: string;
}

/**
 * Built prompt ready for API call
 */
export interface BuiltPrompt {
  /** System prompt for the tier */
  system: string;
  /** User prompt with exercise context */
  user: string;
  /** Fields being generated */
  fields: string[];
  /** Tier this prompt is for */
  tier: TierName;
}

// ============================================================================
// Schema Enums - Valid values from FDS schema
// ============================================================================

/**
 * FDS schema enum values for validation and prompt context
 */
export const SCHEMA_ENUMS = {
  exerciseType: ['strength', 'cardio', 'flexibility', 'balance', 'plyometric'] as const,

  level: ['beginner', 'intermediate', 'advanced'] as const,

  movement: [
    'squat',
    'hinge',
    'lunge',
    'push-horizontal',
    'push-vertical',
    'pull-horizontal',
    'pull-vertical',
    'carry',
    'core-anti-extension',
    'core-anti-rotation',
    'rotation',
    'locomotion',
    'isolation',
    'other',
  ] as const,

  mechanics: ['compound', 'isolation'] as const,

  force: ['push', 'pull', 'static', 'mixed'] as const,

  kineticChain: ['open', 'closed', 'mixed'] as const,

  relationType: [
    'alternate',
    'variation',
    'substitute',
    'progression',
    'regression',
    'equipmentVariant',
    'accessory',
    'mobilityPrep',
    'similarPattern',
    'unilateralPair',
    'contralateralPair',
  ] as const,

  metricType: [
    'reps',
    'weight',
    'duration',
    'distance',
    'speed',
    'pace',
    'power',
    'heartRate',
    'steps',
    'calories',
    'height',
    'tempo',
    'rpe',
  ] as const,

  metricUnit: [
    'count',
    'kg',
    'lb',
    's',
    'min',
    'm',
    'km',
    'mi',
    'm_s',
    'km_h',
    'min_per_km',
    'min_per_mi',
    'W',
    'bpm',
    'kcal',
    'cm',
    'in',
  ] as const,
} as const;

// Type exports for enum values
export type ExerciseType = (typeof SCHEMA_ENUMS.exerciseType)[number];
export type Level = (typeof SCHEMA_ENUMS.level)[number];
export type Movement = (typeof SCHEMA_ENUMS.movement)[number];
export type Mechanics = (typeof SCHEMA_ENUMS.mechanics)[number];
export type Force = (typeof SCHEMA_ENUMS.force)[number];
export type KineticChain = (typeof SCHEMA_ENUMS.kineticChain)[number];
export type RelationType = (typeof SCHEMA_ENUMS.relationType)[number];
export type MetricType = (typeof SCHEMA_ENUMS.metricType)[number];
export type MetricUnit = (typeof SCHEMA_ENUMS.metricUnit)[number];

// ============================================================================
// System Prompts - Per-tier expert context
// ============================================================================

/**
 * System prompts that establish expert context for each tier
 */
export const SYSTEM_PROMPTS: Record<TierName, string> = {
  simple: `You are a fitness data specialist helping to enrich exercise metadata for a fitness application database.

Your role is to provide accurate, concise information for basic exercise fields. Focus on:
- Clear, actionable descriptions
- Common alternative names (aliases)
- Appropriate difficulty levels
- Standard exercise classifications
- Relevant metrics for tracking

Always respond with valid JSON matching the requested schema. Be consistent and precise.`,

  medium: `You are an exercise science specialist with expertise in movement assessment and programming.

Your role is to analyze exercise requirements and relationships. Focus on:
- Safety considerations and contraindications
- Movement prerequisites and competency requirements
- Logical progressions and regressions
- Exercise relationships and substitutes

Consider the full context of each exercise including equipment, primary muscles, and movement patterns.
Always respond with valid JSON matching the requested schema. Prioritize safety and evidence-based recommendations.`,

  complex: `You are a biomechanics expert with deep knowledge of human movement, kinesiology, and exercise physiology.

Your role is to provide precise biomechanical classifications and muscle targeting analysis. Focus on:
- Accurate movement pattern classification based on joint actions
- Force vector and kinetic chain analysis
- Primary and secondary muscle recruitment patterns
- Compound vs isolation mechanics

Use your expertise to make nuanced distinctions. Consider muscle activation patterns, joint involvement, and force directions.
Always respond with valid JSON matching the requested schema. Accuracy is paramount - when uncertain, choose the most defensible classification.`,
};

// ============================================================================
// Simple Tier Prompts
// ============================================================================

/**
 * Prompt templates for simple tier fields (batched, Haiku model)
 */
export const SIMPLE_TIER_PROMPTS: Record<string, PromptTemplate> = {
  description: {
    id: 'description',
    fields: ['canonical.description'],
    template: `Generate a clear, professional description for each exercise.

The description should:
- Be 1-3 sentences
- Explain what the exercise is and its primary benefit
- Use active voice
- Be suitable for a fitness app

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { "slug": "exercise-slug", "description": "..." },
    ...
  ]
}`,
    outputSchema: '{ "results": [{ "slug": string, "description": string }] }',
  },

  aliases: {
    id: 'aliases',
    fields: ['canonical.aliases'],
    template: `Generate common alternative names (aliases) for each exercise.

Include:
- Gym slang and informal names
- Regional variations
- Equipment-specific names if applicable
- Maximum 5 aliases per exercise

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { "slug": "exercise-slug", "aliases": ["alias1", "alias2", ...] },
    ...
  ]
}`,
    outputSchema: '{ "results": [{ "slug": string, "aliases": string[] }] }',
  },

  'classification-simple': {
    id: 'classification-simple',
    fields: ['classification.exerciseType', 'classification.level', 'classification.unilateral'],
    template: `Classify each exercise with basic attributes.

For exerciseType, choose from: ${SCHEMA_ENUMS.exerciseType.join(', ')}
For level, choose from: ${SCHEMA_ENUMS.level.join(', ')}
For unilateral, determine if the exercise works one side at a time (true/false)

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { 
      "slug": "exercise-slug",
      "exerciseType": "strength|cardio|flexibility|balance|plyometric",
      "level": "beginner|intermediate|advanced",
      "unilateral": true|false
    },
    ...
  ]
}`,
    outputSchema:
      '{ "results": [{ "slug": string, "exerciseType": string, "level": string, "unilateral": boolean }] }',
  },

  metrics: {
    id: 'metrics',
    fields: ['metrics.primary', 'metrics.secondary'],
    template: `Determine the appropriate tracking metrics for each exercise.

For metric types, choose from: ${SCHEMA_ENUMS.metricType.join(', ')}
For metric units, choose appropriate unit for the type.

Primary metric: The main way to track this exercise
Secondary metrics: Additional useful metrics (0-3)

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { 
      "slug": "exercise-slug",
      "primary": { "type": "reps|weight|duration|...", "unit": "count|kg|s|..." },
      "secondary": [
        { "type": "...", "unit": "..." }
      ]
    },
    ...
  ]
}`,
    outputSchema:
      '{ "results": [{ "slug": string, "primary": { "type": string, "unit": string }, "secondary": [{ "type": string, "unit": string }] }] }',
  },

  equipment: {
    id: 'equipment',
    fields: ['equipment.optional'],
    template: `Identify optional equipment that can enhance each exercise.

Consider equipment that:
- Can add resistance or difficulty
- Provides support or stability
- Enables variations of the exercise

Exercises (with their required equipment noted):
{{exercises}}

Respond with JSON:
{
  "results": [
    { 
      "slug": "exercise-slug",
      "optional": [
        { "id": "equipment-id", "name": "Equipment Name" }
      ]
    },
    ...
  ]
}

Use standardized equipment names like: dumbbell, barbell, kettlebell, resistance-band, cable-machine, bench, stability-ball, foam-roller, etc.`,
    outputSchema:
      '{ "results": [{ "slug": string, "optional": [{ "id": string, "name": string }] }] }',
  },
};

// ============================================================================
// Medium Tier Prompts
// ============================================================================

/**
 * Prompt templates for medium tier fields (batched, Sonnet model)
 */
export const MEDIUM_TIER_PROMPTS: Record<string, PromptTemplate> = {
  constraints: {
    id: 'constraints',
    fields: [
      'constraints.contraindications',
      'constraints.prerequisites',
      'constraints.progressions',
      'constraints.regressions',
    ],
    template: `Analyze each exercise and determine its constraints.

Contraindications: Medical conditions or situations where this exercise should be avoided
Prerequisites: Exercises or abilities needed before attempting this exercise
Progressions: More challenging variations to progress to
Regressions: Easier variations for those not ready for this exercise

Be specific and evidence-based. Use exercise slugs for progressions/regressions when referencing other exercises.

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { 
      "slug": "exercise-slug",
      "contraindications": ["condition1", "condition2"],
      "prerequisites": ["prerequisite-exercise-slug", "ability or skill"],
      "progressions": ["harder-exercise-slug", "harder-variation"],
      "regressions": ["easier-exercise-slug", "easier-variation"]
    },
    ...
  ]
}`,
    outputSchema:
      '{ "results": [{ "slug": string, "contraindications": string[], "prerequisites": string[], "progressions": string[], "regressions": string[] }] }',
  },

  relations: {
    id: 'relations',
    fields: ['relations'],
    template: `Identify relationships between each exercise and other exercises.

Relation types: ${SCHEMA_ENUMS.relationType.join(', ')}

- alternate: Can be used interchangeably
- variation: A variant of the same base movement
- substitute: Can replace when equipment unavailable
- progression: A harder version
- regression: An easier version
- equipmentVariant: Same movement, different equipment
- accessory: Supports or complements this exercise
- mobilityPrep: Mobility work that prepares for this exercise
- similarPattern: Uses similar movement pattern
- unilateralPair: Single-limb version
- contralateralPair: Opposite-side movement

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { 
      "slug": "exercise-slug",
      "relations": [
        { "type": "variation", "targetId": "related-exercise-slug", "confidence": 0.9, "notes": "optional note" }
      ]
    },
    ...
  ]
}

Confidence should be 0.0-1.0. Only include relations you're confident about (>0.7).`,
    outputSchema:
      '{ "results": [{ "slug": string, "relations": [{ "type": string, "targetId": string, "confidence": number, "notes"?: string }] }] }',
  },
};

// ============================================================================
// Complex Tier Prompts
// ============================================================================

/**
 * Prompt templates for complex tier fields (single exercise, Opus model)
 */
export const COMPLEX_TIER_PROMPTS: Record<string, PromptTemplate> = {
  biomechanics: {
    id: 'biomechanics',
    fields: [
      'classification.movement',
      'classification.mechanics',
      'classification.force',
      'classification.kineticChain',
      'classification.tags',
      'targets.secondary',
    ],
    template: `Perform a detailed biomechanical analysis of this exercise.

Movement patterns: ${SCHEMA_ENUMS.movement.join(', ')}
Mechanics: ${SCHEMA_ENUMS.mechanics.join(', ')}
Force: ${SCHEMA_ENUMS.force.join(', ')}
Kinetic chain: ${SCHEMA_ENUMS.kineticChain.join(', ')}

Movement classification guidance:
- squat: Knee-dominant bilateral lowering (squats, leg press)
- hinge: Hip-dominant posterior chain (deadlifts, good mornings)
- lunge: Single-leg knee-dominant (lunges, step-ups, split squats)
- push-horizontal: Pushing away from body horizontally (bench press, push-ups)
- push-vertical: Pushing overhead (shoulder press, pike push-ups)
- pull-horizontal: Pulling toward body horizontally (rows)
- pull-vertical: Pulling from overhead (pull-ups, lat pulldown)
- carry: Loaded locomotion (farmer's walk, suitcase carry)
- core-anti-extension: Resisting spinal extension (planks, rollouts)
- core-anti-rotation: Resisting rotation (Pallof press, bird dogs)
- rotation: Active rotation (Russian twists, woodchops)
- locomotion: Cyclical movement patterns (running, cycling)
- isolation: Single-joint movements (curls, extensions, raises)
- other: Doesn't fit above patterns

Mechanics guidance:
- compound: Multiple joints involved
- isolation: Single joint involved

Force guidance:
- push: Force directed away from body
- pull: Force directed toward body
- static: Isometric, no movement
- mixed: Combination of force vectors

Kinetic chain guidance:
- closed: Distal segment (hand/foot) fixed (push-ups, squats)
- open: Distal segment free (leg curls, chest fly)
- mixed: Elements of both

Exercise:
{{exercise}}

Primary targets: {{primaryTargets}}
Required equipment: {{equipment}}

Respond with JSON:
{
  "movement": "squat|hinge|lunge|push-horizontal|...",
  "mechanics": "compound|isolation",
  "force": "push|pull|static|mixed",
  "kineticChain": "open|closed|mixed",
  "tags": ["tag1", "tag2"],
  "secondary": [
    { "id": "muscle-id", "name": "Muscle Name" }
  ]
}

For tags, include relevant descriptors like: "upper-body", "lower-body", "core", "stability", "power", "strength", "endurance", "mobility", etc.
For secondary targets, list muscles that assist but are not the primary focus. Use anatomical muscle names.`,
    outputSchema:
      '{ "movement": string, "mechanics": string, "force": string, "kineticChain": string, "tags": string[], "secondary": [{ "id": string, "name": string }] }',
  },
};

// ============================================================================
// Prompt Builders
// ============================================================================

/**
 * Format exercises for batch prompts
 */
function formatExercisesForPrompt(exercises: ExerciseContext[]): string {
  return exercises
    .map((ex, index) => {
      const parts = [`${index + 1}. ${ex.name} (slug: ${ex.slug})`];

      if (ex.description) {
        parts.push(`   Description: ${ex.description}`);
      }
      if (ex.primaryTargets && ex.primaryTargets.length > 0) {
        parts.push(`   Primary targets: ${ex.primaryTargets.map((t) => t.name).join(', ')}`);
      }
      if (ex.requiredEquipment && ex.requiredEquipment.length > 0) {
        parts.push(`   Equipment: ${ex.requiredEquipment.map((e) => e.name).join(', ')}`);
      }
      if (ex.exerciseType) {
        parts.push(`   Type: ${ex.exerciseType}`);
      }

      return parts.join('\n');
    })
    .join('\n\n');
}

/**
 * Format single exercise for complex prompts
 */
function formatSingleExercise(exercise: ExerciseContext): string {
  const parts = [`Name: ${exercise.name}`, `Slug: ${exercise.slug}`];

  if (exercise.description) {
    parts.push(`Description: ${exercise.description}`);
  }
  if (exercise.aliases && exercise.aliases.length > 0) {
    parts.push(`Aliases: ${exercise.aliases.join(', ')}`);
  }
  if (exercise.exerciseType) {
    parts.push(`Exercise type: ${exercise.exerciseType}`);
  }

  return parts.join('\n');
}

/**
 * Get the appropriate prompt template for a tier and prompt ID
 */
export function getPromptTemplate(tier: TierName, promptId: string): PromptTemplate | undefined {
  switch (tier) {
    case 'simple':
      return SIMPLE_TIER_PROMPTS[promptId];
    case 'medium':
      return MEDIUM_TIER_PROMPTS[promptId];
    case 'complex':
      return COMPLEX_TIER_PROMPTS[promptId];
    default:
      return undefined;
  }
}

/**
 * Get all prompt templates for a tier
 */
export function getTierPrompts(tier: TierName): Record<string, PromptTemplate> {
  switch (tier) {
    case 'simple':
      return SIMPLE_TIER_PROMPTS;
    case 'medium':
      return MEDIUM_TIER_PROMPTS;
    case 'complex':
      return COMPLEX_TIER_PROMPTS;
    default:
      return {};
  }
}

/**
 * Build a complete prompt for a tier with exercise context
 *
 * @param tier - The complexity tier
 * @param promptId - The prompt template ID
 * @param exercises - Array of exercises (1 for complex tier, multiple for others)
 * @returns Built prompt ready for API call, or undefined if template not found
 */
export function buildTierPrompt(
  tier: TierName,
  promptId: string,
  exercises: ExerciseContext[]
): BuiltPrompt | undefined {
  const template = getPromptTemplate(tier, promptId);
  if (!template) {
    return undefined;
  }

  const system = SYSTEM_PROMPTS[tier];
  let user = template.template;

  // Replace placeholders based on tier
  if (tier === 'complex') {
    // Complex tier uses single exercise format
    const exercise = exercises[0];
    if (!exercise) {
      return undefined;
    }

    user = user.replace('{{exercise}}', formatSingleExercise(exercise));

    // Replace specific placeholders for biomechanics prompt
    if (exercise.primaryTargets && exercise.primaryTargets.length > 0) {
      user = user.replace(
        '{{primaryTargets}}',
        exercise.primaryTargets.map((t) => t.name).join(', ')
      );
    } else {
      user = user.replace('{{primaryTargets}}', 'Not specified');
    }

    if (exercise.requiredEquipment && exercise.requiredEquipment.length > 0) {
      user = user.replace(
        '{{equipment}}',
        exercise.requiredEquipment.map((e) => e.name).join(', ')
      );
    } else {
      user = user.replace('{{equipment}}', 'Bodyweight / None');
    }
  } else {
    // Simple and medium tiers use batch format
    user = user.replace('{{exercises}}', formatExercisesForPrompt(exercises));
  }

  return {
    system,
    user,
    fields: template.fields,
    tier,
  };
}

/**
 * Build prompts for all templates in a tier
 *
 * @param tier - The complexity tier
 * @param exercises - Array of exercises
 * @returns Array of built prompts for the tier
 */
export function buildAllTierPrompts(tier: TierName, exercises: ExerciseContext[]): BuiltPrompt[] {
  const templates = getTierPrompts(tier);
  const prompts: BuiltPrompt[] = [];

  for (const [promptId] of Object.entries(templates)) {
    const prompt = buildTierPrompt(tier, promptId, exercises);
    if (prompt) {
      prompts.push(prompt);
    }
  }

  return prompts;
}

/**
 * Get all fields covered by a tier's prompts
 */
export function getTierFields(tier: TierName): string[] {
  const templates = getTierPrompts(tier);
  const fields: string[] = [];

  for (const template of Object.values(templates)) {
    fields.push(...template.fields);
  }

  return [...new Set(fields)]; // Deduplicate
}

/**
 * Validate that an enum value is valid for a field
 */
export function validateEnumValue(
  enumName: keyof typeof SCHEMA_ENUMS,
  value: string
): value is (typeof SCHEMA_ENUMS)[typeof enumName][number] {
  return (SCHEMA_ENUMS[enumName] as readonly string[]).includes(value);
}

/**
 * Get enum values for a field
 */
export function getEnumValues(enumName: keyof typeof SCHEMA_ENUMS): readonly string[] {
  return SCHEMA_ENUMS[enumName];
}
