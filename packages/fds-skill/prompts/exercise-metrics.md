# Exercise Metrics Prompt

## System Prompt

```
You are an expert exercise physiologist familiar with the FDS (Fitness Data Standard) specification.

Your task is to determine the appropriate metrics for tracking exercise performance. You must select:
1. primary metric - The most important measurement for this exercise
2. secondary metrics - Additional useful measurements (optional)

Choose from the valid FDS metric types and units. Always respond with valid JSON.
```

## User Prompt Template

```
Determine the appropriate metrics for this exercise:

Exercise: {{name}}
{{#if classification}}
Classification:
- Exercise Type: {{classification.exerciseType}}
- Movement: {{classification.movement}}
- Mechanics: {{classification.mechanics}}
{{/if}}
{{#if equipment}}Equipment: {{equipment}}{{/if}}

Provide metrics as JSON:
{
  "primary": {
    "type": "<metric type>",
    "unit": "<metric unit>"
  },
  "secondary": [
    { "type": "<metric type>", "unit": "<metric unit>" }
  ],
  "reasoning": "Brief explanation of metric choices"
}

Valid metric types: reps, weight, duration, distance, speed, pace, power, heartRate, steps, calories, height, tempo, rpe

Valid metric units:
- count (for reps, tempo, rpe, steps)
- kg, lb (for weight)
- s, min (for duration)
- m, km, mi (for distance)
- m_s, km_h (for speed)
- min_per_km, min_per_mi (for pace)
- W (for power)
- bpm (for heartRate)
- kcal (for calories)
- cm, in (for height)

Common pairings:
- Strength: reps/count + weight/kg
- Cardio distance: distance/km + duration/min
- Cardio time: duration/min + heartRate/bpm
- Timed holds: duration/s
- Plyometrics: reps/count + height/cm

Respond ONLY with the JSON object, no additional text.
```

## Expected Output Schema

```json
{
  "type": "object",
  "required": ["primary"],
  "properties": {
    "primary": {
      "type": "object",
      "required": ["type", "unit"],
      "properties": {
        "type": {
          "type": "string",
          "enum": ["reps", "weight", "duration", "distance", "speed", "pace", "power", "heartRate", "steps", "calories", "height", "tempo", "rpe"]
        },
        "unit": {
          "type": "string",
          "enum": ["count", "kg", "lb", "s", "min", "m", "km", "mi", "m_s", "km_h", "min_per_km", "min_per_mi", "W", "bpm", "kcal", "cm", "in"]
        }
      }
    },
    "secondary": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "unit"],
        "properties": {
          "type": { "type": "string" },
          "unit": { "type": "string" }
        }
      }
    },
    "reasoning": {
      "type": "string"
    }
  }
}
```

## Example Inputs/Outputs

### Example 1: Weighted Strength Exercise
**Input:**
```
Exercise: Barbell Bench Press
Classification:
- Exercise Type: strength
- Movement: push-horizontal
- Mechanics: compound
Equipment: barbell
```

**Output:**
```json
{
  "primary": { "type": "reps", "unit": "count" },
  "secondary": [
    { "type": "weight", "unit": "kg" },
    { "type": "rpe", "unit": "count" }
  ],
  "reasoning": "Bench press is tracked primarily by reps completed, with weight being the key secondary metric for progressive overload. RPE helps gauge effort relative to capacity."
}
```

### Example 2: Bodyweight Exercise
**Input:**
```
Exercise: Push-Up
Classification:
- Exercise Type: strength
- Movement: push-horizontal
- Mechanics: compound
Equipment: body weight
```

**Output:**
```json
{
  "primary": { "type": "reps", "unit": "count" },
  "secondary": [
    { "type": "tempo", "unit": "count" }
  ],
  "reasoning": "Bodyweight push-ups are primarily tracked by rep count. Tempo (e.g., 3-1-2-0 for eccentric-pause-concentric-pause) can be used to increase difficulty and time under tension."
}
```

### Example 3: Timed Hold
**Input:**
```
Exercise: Plank
Classification:
- Exercise Type: strength
- Movement: core-anti-extension
- Mechanics: isolation
Equipment: body weight
```

**Output:**
```json
{
  "primary": { "type": "duration", "unit": "s" },
  "secondary": [],
  "reasoning": "Plank is an isometric hold measured by duration in seconds. No secondary metrics are typically needed as progression comes from extending hold time."
}
```

### Example 4: Distance Cardio
**Input:**
```
Exercise: Treadmill Run
Classification:
- Exercise Type: cardio
- Movement: locomotion
- Mechanics: compound
Equipment: treadmill
```

**Output:**
```json
{
  "primary": { "type": "distance", "unit": "km" },
  "secondary": [
    { "type": "duration", "unit": "min" },
    { "type": "pace", "unit": "min_per_km" },
    { "type": "heartRate", "unit": "bpm" },
    { "type": "calories", "unit": "kcal" }
  ],
  "reasoning": "Running is typically tracked by distance covered. Secondary metrics include time, pace for intensity, heart rate for training zone, and calories for energy expenditure."
}
```

### Example 5: Time-Based Cardio
**Input:**
```
Exercise: Stationary Bike
Classification:
- Exercise Type: cardio
- Movement: locomotion
- Mechanics: compound
Equipment: cardio machine
```

**Output:**
```json
{
  "primary": { "type": "duration", "unit": "min" },
  "secondary": [
    { "type": "distance", "unit": "km" },
    { "type": "power", "unit": "W" },
    { "type": "heartRate", "unit": "bpm" },
    { "type": "calories", "unit": "kcal" }
  ],
  "reasoning": "Stationary biking is often tracked by time spent. Power (watts) is valuable for consistent intensity measurement. Distance, heart rate, and calories provide additional context."
}
```

### Example 6: Plyometric Exercise
**Input:**
```
Exercise: Box Jump
Classification:
- Exercise Type: plyometric
- Movement: squat
- Mechanics: compound
Equipment: body weight
```

**Output:**
```json
{
  "primary": { "type": "reps", "unit": "count" },
  "secondary": [
    { "type": "height", "unit": "cm" }
  ],
  "reasoning": "Box jumps are tracked by rep count, with box height as a secondary metric indicating intensity and explosive power capability."
}
```

## Decision Guide

```
What type of exercise?
├─ Strength (weighted)
│  └─ Primary: reps/count
│     Secondary: weight/kg, rpe/count
│
├─ Strength (bodyweight)
│  └─ Primary: reps/count
│     Secondary: tempo/count (optional)
│
├─ Isometric Hold
│  └─ Primary: duration/s
│     Secondary: (none typically)
│
├─ Cardio (distance-based)
│  └─ Primary: distance/km
│     Secondary: duration/min, pace/min_per_km, heartRate/bpm
│
├─ Cardio (time-based)
│  └─ Primary: duration/min
│     Secondary: distance/km, heartRate/bpm, calories/kcal
│
├─ Cardio (power-based, e.g., rowing, cycling)
│  └─ Primary: duration/min OR distance/m
│     Secondary: power/W, heartRate/bpm
│
├─ Plyometric
│  └─ Primary: reps/count
│     Secondary: height/cm (for jumps)
│
└─ Mobility/Flexibility
   └─ Primary: duration/s (for holds)
      OR reps/count (for dynamic stretches)
```
