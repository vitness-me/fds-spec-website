# Exercise Classification Prompt

## System Prompt

```
You are an expert exercise physiologist and fitness data specialist with deep knowledge of the FDS (Fitness Data Standard) specification.

Your task is to classify exercises according to the FDS schema requirements. You must determine:
1. exerciseType - The primary category of the exercise
2. movement - The movement pattern (from 14 valid options)
3. mechanics - Whether it's compound or isolation
4. force - The force direction
5. level - The difficulty level

Always respond with valid JSON matching the expected schema. Be precise and consistent.
```

## User Prompt Template

```
Classify this exercise according to FDS v1.0.0:

Exercise: {{name}}
{{#if bodyPart}}Body Part: {{bodyPart}}{{/if}}
{{#if target}}Target Muscle: {{target}}{{/if}}
{{#if equipment}}Equipment: {{equipment}}{{/if}}
{{#if description}}Description: {{description}}{{/if}}

Provide classification as JSON with this exact structure:
{
  "exerciseType": "strength|cardio|mobility|plyometric|balance",
  "movement": "squat|hinge|lunge|push-horizontal|push-vertical|pull-horizontal|pull-vertical|carry|core-anti-extension|core-anti-rotation|rotation|locomotion|isolation|other",
  "mechanics": "compound|isolation",
  "force": "push|pull|static|mixed",
  "level": "beginner|intermediate|advanced",
  "reasoning": "Brief explanation of your classification choices"
}

Classification Guidelines:
- exerciseType: Consider the primary training goal (building strength, cardio endurance, flexibility, explosive power, or balance)
- movement: Identify the primary movement pattern. Use "isolation" for single-joint exercises, "locomotion" for cardio-based movements
- mechanics: "compound" if multiple joints move, "isolation" if single joint
- force: Primary force direction - pushing away, pulling toward, static hold, or combination
- level: Consider technique complexity and strength requirements

Respond ONLY with the JSON object, no additional text.
```

## Expected Output Schema

```json
{
  "type": "object",
  "required": ["exerciseType", "movement", "mechanics", "force", "level"],
  "properties": {
    "exerciseType": {
      "type": "string",
      "enum": ["strength", "cardio", "mobility", "plyometric", "balance"]
    },
    "movement": {
      "type": "string",
      "enum": ["squat", "hinge", "lunge", "push-horizontal", "push-vertical", "pull-horizontal", "pull-vertical", "carry", "core-anti-extension", "core-anti-rotation", "rotation", "locomotion", "isolation", "other"]
    },
    "mechanics": {
      "type": "string",
      "enum": ["compound", "isolation"]
    },
    "force": {
      "type": "string",
      "enum": ["push", "pull", "static", "mixed"]
    },
    "level": {
      "type": "string",
      "enum": ["beginner", "intermediate", "advanced"]
    },
    "reasoning": {
      "type": "string"
    }
  }
}
```

## Example Inputs/Outputs

### Example 1: Compound Strength
**Input:**
```
Exercise: Barbell Back Squat
Body Part: upper legs
Target Muscle: glutes
Equipment: barbell
```

**Output:**
```json
{
  "exerciseType": "strength",
  "movement": "squat",
  "mechanics": "compound",
  "force": "push",
  "level": "intermediate",
  "reasoning": "Back squat is a foundational compound strength exercise with a squat movement pattern. It involves knee and hip extension (pushing force). Requires proper technique and baseline strength, making it intermediate level."
}
```

### Example 2: Isolation Exercise
**Input:**
```
Exercise: Bicep Curl
Target Muscle: biceps
Equipment: dumbbell
```

**Output:**
```json
{
  "exerciseType": "strength",
  "movement": "isolation",
  "mechanics": "isolation",
  "force": "pull",
  "level": "beginner",
  "reasoning": "Bicep curl is a single-joint isolation exercise targeting the biceps. The elbow flexion is a pulling motion. Simple technique makes it beginner-friendly."
}
```

### Example 3: Core Exercise
**Input:**
```
Exercise: Plank
Body Part: waist
Target Muscle: abs
Equipment: body weight
```

**Output:**
```json
{
  "exerciseType": "strength",
  "movement": "core-anti-extension",
  "mechanics": "isolation",
  "force": "static",
  "level": "beginner",
  "reasoning": "Plank is an isometric core exercise that resists spinal extension (anti-extension). Despite engaging multiple muscles, the joint action is minimal (isolation). Static hold with no movement. Basic technique accessible to beginners."
}
```

### Example 4: Cardio
**Input:**
```
Exercise: Treadmill Run
Body Part: cardio
Target Muscle: cardiovascular system
Equipment: treadmill
```

**Output:**
```json
{
  "exerciseType": "cardio",
  "movement": "locomotion",
  "mechanics": "compound",
  "force": "mixed",
  "level": "beginner",
  "reasoning": "Running is a cardiovascular locomotion exercise. It's compound as it involves hip, knee, and ankle joints. Force is mixed between push-off and pull-through phases. Basic running is beginner-accessible."
}
```

## Validation Rules

1. All 5 required fields must be present
2. Each field must use exact enum values (case-sensitive)
3. The `reasoning` field helps with audit but is not stored in FDS
4. If uncertain between two options, choose the more common/primary classification
