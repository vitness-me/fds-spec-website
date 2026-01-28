# FDS AI Enrichment Guide

## Overview

AI enrichment fills gaps when source data lacks fields required by FDS. This guide covers when, how, and what to enrich.

---

## Enrichment Decision Matrix

| Source Has | FDS Requires | Action |
|------------|--------------|--------|
| `name` | `canonical.name` | Direct map (titleCase) |
| `name` | `canonical.slug` | Transform (slugify) |
| - | `canonical.description` | **AI Enrich** |
| - | `canonical.aliases` | **AI Enrich** |
| `bodyPart` + `target` | `classification.*` | **AI Enrich** (5 fields) |
| `target` | `targets.primary` | Registry lookup + AI fallback |
| `equipment` | `equipment.required` | Registry lookup + AI fallback |
| - | `metrics.primary` | **AI Enrich** |
| `gifUrl` | `media` | Transform (toMediaArray) |
| - | `metadata.*` | Auto-generate |

---

## Field-Specific Enrichment

### 1. canonical.description

**When to enrich:** Always when missing

**Context needed:**
- `name` (required)
- `bodyPart` or `target` (helpful)
- `equipment` (helpful)
- `classification` if already determined (helpful)

**Output format:**
```json
{
  "description": "1-3 sentence description of the exercise"
}
```

**Quality criteria:**
- 50-150 words
- Mentions target muscles
- Explains movement or purpose
- Suitable for general audience
- No form instructions (those go in separate field)

### 2. canonical.aliases

**When to enrich:** When missing and name has common variations

**Context needed:**
- `name` (required)

**Output format:**
```json
{
  "aliases": ["variation 1", "variation 2"]
}
```

**Guidelines:**
- Include common abbreviations (DB, BB, KB)
- Include regional variations (push-up vs press-up)
- Include equipment-less name if applicable
- Max 5 aliases
- Don't include the main name

### 3. classification (All 5 Required Fields)

**When to enrich:** Always when any field missing

**Context needed:**
- `name` (required)
- `bodyPart` (very helpful)
- `target` muscle (very helpful)
- `equipment` (helpful)

**Output format:**
```json
{
  "exerciseType": "strength",
  "movement": "push-horizontal",
  "mechanics": "compound",
  "force": "push",
  "level": "intermediate"
}
```

**Decision logic:**

#### exerciseType
```
Is it primarily for building strength/muscle? → "strength"
Is it for cardiovascular endurance? → "cardio"
Is it for flexibility/range of motion? → "mobility"
Is it explosive/jumping? → "plyometric"
Is it for stability/proprioception? → "balance"
```

#### movement (See SKILL.md for full decision tree)
Key patterns:
- Squats, leg press → `squat`
- Deadlifts, hip hinges → `hinge`
- Lunges, split squats → `lunge`
- Bench press, push-ups → `push-horizontal`
- Overhead press → `push-vertical`
- Rows → `pull-horizontal`
- Pull-ups, pulldowns → `pull-vertical`
- Farmer walks → `carry`
- Planks, dead bugs → `core-anti-extension`
- Pallof press → `core-anti-rotation`
- Russian twists → `rotation`
- Running, cycling → `locomotion`
- Curls, extensions → `isolation`

#### mechanics
```
Multiple joints moving? → "compound"
Single joint moving? → "isolation"
```

#### force
```
Pushing away from body? → "push"
Pulling toward body? → "pull"
Holding position? → "static"
Both/alternating? → "mixed"
```

#### level
```
Simple technique, low strength needed? → "beginner"
Moderate technique or strength? → "intermediate"
Complex technique or high strength? → "advanced"
```

### 4. metrics.primary (and secondary)

**When to enrich:** Always when missing

**Context needed:**
- `name` (required)
- `classification.exerciseType` (very helpful)
- `classification.movement` (helpful)

**Output format:**
```json
{
  "primary": { "type": "reps", "unit": "count" },
  "secondary": [
    { "type": "weight", "unit": "kg" }
  ]
}
```

**Decision logic:**
```
Strength exercise (rep-based)?
  → primary: reps/count
  → secondary: weight/kg (if weighted)

Timed hold (plank, wall sit)?
  → primary: duration/s

Distance cardio (run, row)?
  → primary: distance/km
  → secondary: duration/min, pace/min_per_km

Time-based cardio (bike, elliptical)?
  → primary: duration/min
  → secondary: heartRate/bpm, calories/kcal

Plyometric?
  → primary: reps/count
  → secondary: height/cm (if jumping)
```

### 5. targets.primary (Registry Lookup Fallback)

**When to enrich:** When registry lookup fails

**Context needed:**
- `name` (required)
- `bodyPart` (helpful)
- Source `target` value (required - this is what failed lookup)

**Task:** Map the source muscle name to the closest FDS muscle

**Output format:**
```json
{
  "muscleId": "c3d4e5f6-3333-4000-8000-000000000022",
  "muscleName": "Rectus Abdominis",
  "muscleSlug": "rectus-abdominis",
  "categoryId": "a1b2c3d4-1111-4000-8000-000000000004"
}
```

---

## Enrichment Prompts

### System Prompt (All Enrichments)

```
You are an expert exercise physiologist and fitness data specialist with comprehensive knowledge of:
- Exercise biomechanics and movement patterns
- Muscle anatomy and function
- Exercise classification systems
- The FDS (Fitness Data Standard) specification

Your responses must be:
1. Accurate and evidence-based
2. Consistent with FDS schema requirements
3. Formatted as valid JSON
4. Concise but complete
```

### Classification Prompt

```
Classify this exercise according to FDS v1.0.0:

Exercise: {{name}}
Body Part: {{bodyPart}}
Target Muscle: {{target}}
Equipment: {{equipment}}

Required fields (use EXACT enum values):
- exerciseType: strength | cardio | mobility | plyometric | balance
- movement: squat | hinge | lunge | push-horizontal | push-vertical | pull-horizontal | pull-vertical | carry | core-anti-extension | core-anti-rotation | rotation | locomotion | isolation | other
- mechanics: compound | isolation
- force: push | pull | static | mixed
- level: beginner | intermediate | advanced

Respond with JSON only:
{
  "exerciseType": "...",
  "movement": "...",
  "mechanics": "...",
  "force": "...",
  "level": "..."
}
```

### Description Prompt

```
Write a concise description for this exercise:

Exercise: {{name}}
Target: {{target}}
Equipment: {{equipment}}
Type: {{exerciseType}}
Movement: {{movement}}

Requirements:
- 1-3 sentences (50-150 words)
- Mention primary muscles targeted
- Explain purpose/benefit
- No form instructions
- Suitable for general fitness audience

Respond with JSON only:
{
  "description": "..."
}
```

### Metrics Prompt

```
Determine appropriate tracking metrics for this exercise:

Exercise: {{name}}
Type: {{exerciseType}}
Movement: {{movement}}

Valid metric types: reps, weight, duration, distance, speed, pace, power, heartRate, steps, calories, height, tempo, rpe

Valid units:
- count (reps, tempo, rpe)
- kg, lb (weight)
- s, min (duration)
- m, km, mi (distance)
- m_s, km_h (speed)
- min_per_km, min_per_mi (pace)
- W (power)
- bpm (heartRate)
- kcal (calories)
- cm, in (height)

Respond with JSON only:
{
  "primary": { "type": "...", "unit": "..." },
  "secondary": [{ "type": "...", "unit": "..." }]
}
```

---

## Enrichment Configuration

### Full Enrichment (Default)

```json
{
  "enrichment": {
    "enabled": true,
    "defaultFields": "all"
  }
}
```

### Selective Enrichment

```json
{
  "enrichment": {
    "enabled": true,
    "defaultFields": ["classification", "metrics"],
    "skipFields": ["canonical.description"]
  }
}
```

### Field-Level Override

```json
{
  "mappings": {
    "canonical.description": {
      "enrichment": {
        "enabled": false
      }
    },
    "classification": {
      "enrichment": {
        "enabled": true,
        "when": "always"
      }
    }
  }
}
```

---

## Rate Limiting & Batching

### Recommended Settings

```json
{
  "enrichment": {
    "options": {
      "temperature": 0.3,
      "maxRetries": 3,
      "rateLimit": {
        "requestsPerMinute": 60
      }
    },
    "batch": {
      "enabled": true,
      "concurrency": 5,
      "chunkSize": 10
    }
  }
}
```

### Cost Optimization

1. **Batch similar fields together** - One AI call for classification (5 fields) vs 5 separate calls
2. **Use registry lookups first** - Only fall back to AI when lookup fails
3. **Cache enrichment results** - Same exercise name → same classification
4. **Use appropriate model** - Claude 3.5 Sonnet for quality, Claude 3 Haiku for speed/cost

---

## Validation

All AI-generated content should be validated against FDS schema:

```typescript
const result = await enrichmentEngine.enrich(data, mappings, context);

// Validate each enriched field
for (const [field, value] of Object.entries(result.data)) {
  const isValid = validator.validateField(field, value);
  if (!isValid) {
    console.warn(`AI generated invalid value for ${field}, using fallback`);
  }
}
```

### Common Validation Issues

| Field | Issue | Solution |
|-------|-------|----------|
| `movement` | Invalid enum value | Re-prompt with explicit enum list |
| `level` | Mixed case | Normalize to lowercase |
| `metrics.unit` | Wrong pairing | Validate type+unit combinations |
| `description` | Too long | Truncate or re-prompt |
