/**
 * Exercise enrichment prompts for FDS Transformer
 * These prompts generate high-quality exercise data matching POC standards
 */

export interface ExerciseContext {
  name: string;
  target?: string;
  equipment?: string;
  bodyPart?: string;
}

/**
 * System prompt for exercise enrichment
 */
export const EXERCISE_SYSTEM_PROMPT = `You are an expert exercise physiologist and certified strength and conditioning specialist (CSCS) with deep knowledge of biomechanics, anatomy, and exercise programming.

Your responses must be:
1. Technically accurate based on exercise science
2. Practical and applicable for fitness professionals
3. Formatted as valid JSON only - no markdown, no explanations

Use proper anatomical terminology and exercise science concepts.`;

/**
 * Get prompt for comprehensive exercise enrichment
 */
export function getExerciseEnrichmentPrompt(context: ExerciseContext): string {
  return `Analyze this exercise and provide comprehensive enrichment data:

Exercise: ${context.name}
${context.target ? `Primary Target: ${context.target}` : ''}
${context.equipment ? `Equipment: ${context.equipment}` : ''}
${context.bodyPart ? `Body Part: ${context.bodyPart}` : ''}

Provide a JSON object with ALL of the following fields:

{
  "description": "A detailed 1-2 sentence description of the exercise emphasizing the movement pattern and primary benefits",
  "aliases": ["3-5 common alternative names for this exercise"],
  "localized": [
    {
      "lang": "sr",
      "name": "Serbian name",
      "description": "Serbian description",
      "aliases": ["Serbian aliases"]
    },
    {
      "lang": "es", 
      "name": "Spanish name",
      "description": "Spanish description",
      "aliases": ["Spanish aliases"]
    }
  ],
  "classification": {
    "exerciseType": "strength|cardio|flexibility|balance|plyometric",
    "movement": "squat|hinge|push|pull|lunge|carry|rotation|core-anti-extension|core-anti-rotation|other",
    "mechanics": "compound|isolation",
    "force": "push|pull|static|dynamic",
    "level": "beginner|intermediate|advanced",
    "unilateral": false,
    "kineticChain": "open|closed",
    "tags": ["relevant tags like bilateral, freeWeight, barbell, kneeDominant, upperBody, etc."]
  },
  "targets": {
    "secondary": [
      {"id": "mus.muscleName", "name": "Muscle Name", "categoryId": "cat.category"}
    ]
  },
  "equipment": {
    "optional": [
      {"id": "eq.equipmentName", "name": "Equipment Name"}
    ]
  },
  "constraints": {
    "contraindications": ["3-4 specific medical/injury conditions that would make this exercise inadvisable"],
    "prerequisites": ["3-4 movement competencies or abilities required before attempting this exercise"],
    "progressions": ["4-5 harder variations or next-level exercises"],
    "recessions": ["4-5 easier variations or regression exercises"]
  },
  "relations": [
    {"type": "alternate", "targetId": "urn:slug:exercise-slug"},
    {"type": "regression", "targetId": "urn:slug:exercise-slug"},
    {"type": "progression", "targetId": "urn:slug:exercise-slug"},
    {"type": "equipmentVariant", "targetId": "urn:slug:exercise-slug"},
    {"type": "accessory", "targetId": "urn:slug:exercise-slug"},
    {"type": "mobilityPrep", "targetId": "urn:slug:exercise-slug"},
    {"type": "similarPattern", "targetId": "urn:slug:exercise-slug"}
  ],
  "metrics": {
    "primary": {"type": "reps|duration|distance", "unit": "count|s|m"},
    "secondary": [
      {"type": "weight|tempo|rpe|rest|speed", "unit": "kg|count|s|km/h"}
    ]
  }
}

IMPORTANT:
- Use realistic exercise slugs for relations (e.g., "goblet-squat", "front-squat")
- Use standard muscle IDs: mus.quadriceps, mus.glutes, mus.hamstrings, mus.lats, mus.pectorals, mus.deltoids, mus.triceps, mus.biceps, mus.abs, mus.obliques, mus.erectorSpinae, etc.
- Use standard category IDs: cat.legs, cat.back, cat.chest, cat.shoulders, cat.arms, cat.core
- Use standard equipment IDs: eq.barbell, eq.dumbbell, eq.cable, eq.machine, eq.bench, eq.rack, eq.mat, eq.band, eq.kettlebell
- Provide 8-12 relations covering different relationship types
- Be specific and technically accurate`;
}

/**
 * Prompt templates by field type (for targeted enrichment)
 */
export const FIELD_PROMPTS: Record<string, (ctx: ExerciseContext) => string> = {
  'exercise-description': (ctx) => `
Generate a professional exercise description for: ${ctx.name}
Context: ${ctx.target ? `targets ${ctx.target}` : ''} ${ctx.equipment ? `using ${ctx.equipment}` : ''}

Return JSON: {"description": "1-2 sentence description emphasizing movement pattern and primary benefits"}`,

  'exercise-aliases': (ctx) => `
List common alternative names for: ${ctx.name}

Return JSON: {"aliases": ["3-5 alternative names commonly used by trainers and athletes"]}`,

  'exercise-classification': (ctx) => `
Classify this exercise: ${ctx.name}
${ctx.target ? `Target: ${ctx.target}` : ''}
${ctx.equipment ? `Equipment: ${ctx.equipment}` : ''}

Return JSON with classification data:
{
  "exerciseType": "strength|cardio|flexibility|balance|plyometric",
  "movement": "squat|hinge|push|pull|lunge|carry|rotation|core-anti-extension|other",
  "mechanics": "compound|isolation",
  "force": "push|pull|static|dynamic",
  "level": "beginner|intermediate|advanced",
  "unilateral": true|false,
  "kineticChain": "open|closed"
}`,

  'exercise-tags': (ctx) => `
Generate relevant tags for: ${ctx.name}
${ctx.equipment ? `Equipment: ${ctx.equipment}` : ''}
${ctx.bodyPart ? `Body part: ${ctx.bodyPart}` : ''}

Return JSON: {"tags": ["6-10 relevant tags like bilateral, freeWeight, barbell, kneeDominant, upperBody, compound, etc."]}`,

  'exercise-muscles': (ctx) => `
Identify secondary muscles for: ${ctx.name}
${ctx.target ? `Primary target: ${ctx.target}` : ''}

Return JSON with secondary muscles activated:
{
  "secondary": [
    {"id": "mus.muscleName", "name": "Muscle Name", "categoryId": "cat.category"}
  ]
}

Use standard IDs: mus.quadriceps, mus.glutes, mus.hamstrings, mus.lats, mus.pectorals, mus.deltoids, mus.triceps, mus.biceps, mus.abs, mus.obliques, mus.erectorSpinae, mus.adductors, mus.calves, mus.forearms, mus.traps, mus.rhomboids, mus.serratus
Categories: cat.legs, cat.back, cat.chest, cat.shoulders, cat.arms, cat.core`,

  'exercise-constraints': (ctx) => `
Identify constraints for: ${ctx.name}

Return JSON:
{
  "contraindications": ["3-4 specific medical/injury conditions making this exercise inadvisable"],
  "prerequisites": ["3-4 movement competencies required before attempting"],
  "progressions": ["4-5 harder variations"],
  "recessions": ["4-5 easier variations"]
}`,

  'exercise-relations': (ctx) => `
Identify related exercises for: ${ctx.name}

Return JSON with 8-12 relations:
{
  "relations": [
    {"type": "alternate", "targetId": "urn:slug:exercise-slug"},
    {"type": "regression", "targetId": "urn:slug:exercise-slug"},
    {"type": "progression", "targetId": "urn:slug:exercise-slug"},
    {"type": "equipmentVariant", "targetId": "urn:slug:exercise-slug"},
    {"type": "accessory", "targetId": "urn:slug:exercise-slug"},
    {"type": "mobilityPrep", "targetId": "urn:slug:exercise-slug"},
    {"type": "similarPattern", "targetId": "urn:slug:exercise-slug"}
  ]
}

Use realistic slugs like: goblet-squat, front-squat, leg-press, romanian-deadlift, etc.`,

  'exercise-metrics': (ctx) => `
Determine appropriate metrics for: ${ctx.name}

Return JSON:
{
  "primary": {"type": "reps|duration|distance", "unit": "count|s|m"},
  "secondary": [
    {"type": "weight|tempo|rpe|rest|speed|incline", "unit": "kg|count|s|km/h|%"}
  ]
}`,

  'exercise-localization': (ctx) => `
Translate exercise data for: ${ctx.name}

Return JSON with Serbian (sr) and Spanish (es) translations:
{
  "localized": [
    {
      "lang": "sr",
      "name": "Serbian name using Cyrillic script",
      "description": "Serbian description",
      "aliases": ["2-3 Serbian alternative names"]
    },
    {
      "lang": "es",
      "name": "Spanish name",
      "description": "Spanish description", 
      "aliases": ["2-3 Spanish alternative names"]
    }
  ]
}`,
};

export default {
  EXERCISE_SYSTEM_PROMPT,
  getExerciseEnrichmentPrompt,
  FIELD_PROMPTS,
};
