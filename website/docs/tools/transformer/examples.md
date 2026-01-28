---
title: Examples
description: End-to-end examples and workflows for the FDS Transformer
sidebar_position: 8
---

# Examples

This guide provides complete, end-to-end examples of using the FDS Transformer for common workflows.

## Example 1: Basic Transformation

Transform a simple exercise dataset without AI enrichment.

### Source Data

```json title="exercises.json"
[
  {
    "id": "0001",
    "name": "barbell bench press",
    "target": "pectorals",
    "equipment": "barbell",
    "difficulty": "intermediate"
  },
  {
    "id": "0002", 
    "name": "back squat",
    "target": "quadriceps",
    "equipment": "barbell",
    "difficulty": "intermediate"
  }
]
```

### Mapping Configuration

```json title="mapping.json"
{
  "$schema": "https://spec.vitness.me/schemas/transformer/v1.0.0/mapping.schema.json",
  "version": "1.0.0",
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise"
  },
  "registries": {
    "muscles": {
      "source": "local",
      "local": "./registries/muscles.registry.json"
    },
    "equipment": {
      "source": "local", 
      "local": "./registries/equipment.registry.json"
    }
  },
  "mappings": {
    "exerciseId": {
      "from": null,
      "transform": "uuid"
    },
    "schemaVersion": {
      "from": null,
      "default": "1.0.0"
    },
    "canonical.name": {
      "from": "name",
      "transform": "titleCase"
    },
    "canonical.slug": {
      "from": "name",
      "transform": "slugify"
    },
    "classification.exerciseType": {
      "from": null,
      "default": "strength"
    },
    "classification.level": {
      "from": "difficulty"
    },
    "targets.primary": {
      "from": "target",
      "transform": "registryLookup",
      "options": {
        "registry": "muscles",
        "fuzzyMatch": true,
        "returnFormat": "array"
      }
    },
    "equipment.required": {
      "from": "equipment",
      "transform": ["toArray", "registryLookup"],
      "options": {
        "registry": "equipment",
        "fuzzyMatch": true
      }
    },
    "metrics.primary": {
      "from": null,
      "default": { "type": "reps", "unit": "count" }
    },
    "metadata": {
      "from": null,
      "transform": "autoGenerate",
      "options": {
        "fields": ["createdAt", "updatedAt", "status"]
      }
    }
  },
  "output": {
    "format": "json",
    "pretty": true,
    "directory": "./fds-output"
  }
}
```

### Run Transformation

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --output ./fds-output \
  --no-enrichment
```

### Output

```json title="fds-output/barbell-bench-press.json"
{
  "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
  "schemaVersion": "1.0.0",
  "canonical": {
    "name": "Barbell Bench Press",
    "slug": "barbell-bench-press"
  },
  "classification": {
    "exerciseType": "strength",
    "level": "intermediate"
  },
  "targets": {
    "primary": [
      {
        "id": "mus.pectoralis-major",
        "name": "Pectoralis Major",
        "slug": "pectoralis-major",
        "categoryId": "cat.chest"
      }
    ]
  },
  "equipment": {
    "required": [
      {
        "id": "eq.barbell",
        "name": "Barbell",
        "slug": "barbell"
      }
    ]
  },
  "metrics": {
    "primary": { "type": "reps", "unit": "count" }
  },
  "metadata": {
    "createdAt": "2025-01-27T15:30:00.000Z",
    "updatedAt": "2025-01-27T15:30:00.000Z",
    "status": "active"
  }
}
```

> **Note:** The IDs shown (e.g., `mus.pectoralis-major`, `eq.barbell`, `cat.chest`) are for illustrative purposes. In production, registry lookups return UUIDs as required by the FDS specification.

---

## Example 2: Full AI Enrichment

Transform with tiered AI enrichment for complete exercise data.

### Mapping Configuration

```json title="mapping-enriched.json"
{
  "$schema": "https://spec.vitness.me/schemas/transformer/v1.0.0/mapping.schema.json",
  "version": "1.0.0",
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise"
  },
  "registries": {
    "muscles": { "source": "local", "local": "./registries/muscles.registry.json" },
    "equipment": { "source": "local", "local": "./registries/equipment.registry.json" }
  },
  "mappings": {
    "exerciseId": { "from": null, "transform": "uuid" },
    "schemaVersion": { "from": null, "default": "1.0.0" },
    "canonical.name": { "from": "name", "transform": "titleCase" },
    "canonical.slug": { "from": "name", "transform": "slugify" },
    "targets.primary": {
      "from": "target",
      "transform": "registryLookup",
      "options": { "registry": "muscles", "fuzzyMatch": true, "returnFormat": "array" }
    },
    "equipment.required": {
      "from": "equipment",
      "transform": ["toArray", "registryLookup"],
      "options": { "registry": "equipment", "fuzzyMatch": true }
    },
    "metadata": {
      "from": null,
      "transform": "autoGenerate",
      "options": { "fields": ["createdAt", "updatedAt", "status"] }
    }
  },
  "enrichment": {
    "enabled": true,
    "provider": "openrouter",
    "tiers": {
      "simple": {
        "model": "anthropic/claude-haiku-4.5",
        "temperature": 0.1,
        "maxTokens": 1000,
        "batchSize": 5,
        "priority": "speed"
      },
      "medium": {
        "model": "anthropic/claude-sonnet-4.5",
        "temperature": 0.1,
        "maxTokens": 1500,
        "batchSize": 3,
        "priority": "balanced"
      },
      "complex": {
        "model": "anthropic/claude-sonnet-4.5",
        "temperature": 0.1,
        "maxTokens": 2000,
        "batchSize": 1,
        "priority": "accuracy"
      }
    },
    "fields": {
      "canonical.aliases": { "tier": "simple", "prompt": "aliases" },
      "classification.exerciseType": { "tier": "simple", "prompt": "classification-simple" },
      "classification.level": { "tier": "simple", "prompt": "classification-simple" },
      "metrics.primary": { "tier": "simple", "prompt": "metrics" },
      "equipment.optional": { "tier": "simple", "prompt": "equipment" },
      "constraints.contraindications": { "tier": "medium", "prompt": "constraints" },
      "constraints.prerequisites": { "tier": "medium", "prompt": "constraints" },
      "constraints.progressions": { "tier": "medium", "prompt": "progressions" },
      "constraints.regressions": { "tier": "medium", "prompt": "progressions" },
      "relations": { "tier": "medium", "prompt": "relations" },
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" },
      "classification.mechanics": { "tier": "complex", "prompt": "biomechanics" },
      "classification.force": { "tier": "complex", "prompt": "biomechanics" },
      "classification.kineticChain": { "tier": "complex", "prompt": "biomechanics" },
      "targets.secondary": { "tier": "complex", "prompt": "biomechanics" }
    },
    "fallback": {
      "retries": 2,
      "degradeModel": true,
      "useDefaults": true
    },
    "checkpoint": {
      "enabled": true,
      "saveInterval": 10
    }
  },
  "output": {
    "format": "json",
    "pretty": true,
    "directory": "./fds-output"
  }
}
```

### Run with Cost Estimation

```bash
# First, estimate costs
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping-enriched.json \
  --estimate-cost

# Then run transformation
OPENROUTER_API_KEY=your-key fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping-enriched.json \
  --output ./fds-output
```

### Enriched Output

```json title="fds-output/barbell-bench-press.json"
{
  "exerciseId": "caf217a9-3880-4f12-bc2e-71ce44d42665",
  "schemaVersion": "1.0.0",
  "canonical": {
    "name": "Barbell Bench Press",
    "slug": "barbell-bench-press",
    "aliases": ["bench press", "flat bench press", "BB bench", "chest press"]
  },
  "classification": {
    "exerciseType": "strength",
    "movement": "push-horizontal",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate",
    "kineticChain": "open",
    "tags": ["upper-body", "strength", "power", "pressing"]
  },
  "targets": {
    "primary": [
      { "id": "mus.pectoralis-major", "name": "Pectoralis Major", "slug": "pectoralis-major", "categoryId": "cat.chest" }
    ],
    "secondary": [
      { "id": "mus.anterior-deltoid", "name": "Anterior Deltoid", "slug": "anterior-deltoid", "categoryId": "cat.shoulders" },
      { "id": "mus.triceps-brachii", "name": "Triceps Brachii", "slug": "triceps-brachii", "categoryId": "cat.arms" }
    ]
  },
  "equipment": {
    "required": [
      { "id": "eq.barbell", "name": "Barbell", "slug": "barbell" }
    ],
    "optional": [
      { "id": "eq.bench", "name": "Flat Bench", "slug": "flat-bench" },
      { "id": "eq.power-rack", "name": "Power Rack", "slug": "power-rack" }
    ]
  },
  "constraints": {
    "contraindications": [
      "Acute shoulder pain or injury",
      "Recent rotator cuff surgery",
      "Severe shoulder impingement"
    ],
    "prerequisites": [
      "Pain-free shoulder range of motion",
      "Basic pushing strength",
      "Core stability"
    ],
    "progressions": [
      "Incline barbell bench press",
      "Close-grip bench press",
      "Pause bench press"
    ],
    "regressions": [
      "Push-up",
      "Dumbbell bench press",
      "Machine chest press"
    ]
  },
  "relations": [
    { "type": "equipmentVariant", "targetId": "dumbbell-bench-press" },
    { "type": "regression", "targetId": "push-up" },
    { "type": "progression", "targetId": "incline-barbell-bench-press" },
    { "type": "variation", "targetId": "close-grip-bench-press" }
  ],
  "metrics": {
    "primary": { "type": "weight", "unit": "kg" },
    "secondary": [{ "type": "reps", "unit": "count" }]
  },
  "metadata": {
    "createdAt": "2025-01-27T15:30:00.000Z",
    "updatedAt": "2025-01-27T15:30:00.000Z",
    "status": "active"
  }
}
```

> **Note:** The IDs shown (e.g., `mus.pectoralis-major`, `eq.barbell`) are for illustrative purposes. In production, registry lookups return UUIDs as required by the FDS specification.

---

## Example 3: Batch Processing for CI/CD

Run transformation in a CI/CD pipeline with validation.

### GitHub Actions Workflow

```yaml title=".github/workflows/transform.yml"
name: Transform Exercise Data

on:
  push:
    paths:
      - 'data/exercises/*.json'
  workflow_dispatch:

jobs:
  transform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install FDS Transformer
        run: npm install -g @vitness/fds-transformer
        
      - name: Transform exercises
        run: |
          fds-transformer transform \
            --input ./data/exercises/source.json \
            --config ./data/mapping.json \
            --output ./data/fds-output \
            --no-enrichment
            
      - name: Validate output
        run: |
          for file in ./data/fds-output/*.json; do
            fds-transformer validate --input "$file" || exit 1
          done
          
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: fds-exercises
          path: ./data/fds-output/
```

---

## Example 4: Programmatic Usage

Use the transformer as a library in your Node.js application.

### TypeScript Example

```typescript title="transform-exercises.ts"
import { Transformer } from '@vitness/fds-transformer';
import { readFile, writeFile, mkdir } from 'fs/promises';

async function main() {
  // Load source data
  const sourceData = JSON.parse(
    await readFile('./exercises.json', 'utf-8')
  );
  
  // Create transformer with config
  const transformer = new Transformer({
    config: './mapping.json',
  });
  
  // Initialize (loads registries, schemas)
  await transformer.init();
  
  // Transform single item
  const singleResult = await transformer.transform(sourceData[0]);
  console.log('Single result:', singleResult);
  
  // Batch transform with streaming
  const results = [];
  for await (const result of transformer.transformStream(sourceData)) {
    if (result.success) {
      results.push(result.data);
    } else {
      console.error('Failed:', result.errors);
    }
  }
  
  // Write output
  await mkdir('./output', { recursive: true });
  await writeFile(
    './output/exercises.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log(`Transformed ${results.length} exercises`);
}

main().catch(console.error);
```

### With AI Enrichment

```typescript title="transform-with-ai.ts"
import { Transformer } from '@vitness/fds-transformer';

async function transformWithAI() {
  const transformer = new Transformer({
    config: './mapping-enriched.json',
  });
  
  await transformer.init();
  
  // Check if tiered enrichment is enabled
  if (transformer.isTieredEnrichmentEnabled()) {
    // Get cost estimate
    const estimate = transformer.estimateCost(100);
    console.log(`Estimated cost: $${estimate.total.cost.toFixed(2)}`);
    console.log(`Estimated time: ${estimate.estimatedTime.formatted}`);
  }
  
  // Transform with progress callback
  const result = await transformer.transformAllBatch(sourceData, {
    outputDirectory: './output',
    onProgress: (progress) => {
      console.log(
        `${progress.exercise.current}/${progress.exercise.total}: ${progress.exercise.name}`
      );
    },
  });
  
  console.log(`Stats:`, result.stats);
}
```

---

## Example 5: Incremental Updates

Resume a large transformation after interruption.

### Start Transformation

```bash
# Start processing 10,000 exercises
fds-transformer transform \
  --input ./large-dataset.json \
  --config ./mapping.json \
  --output ./fds-output

# Process is interrupted at exercise 3,500...
```

### Resume from Checkpoint

```bash
# Resume from where we left off
fds-transformer transform \
  --input ./large-dataset.json \
  --config ./mapping.json \
  --output ./fds-output \
  --resume
```

The transformer will:
1. Load the checkpoint file (`.fds-checkpoint.json`)
2. Skip already-processed exercises
3. Continue from exercise 3,501

---

## Example 6: Single-Tier Enrichment

Run only specific tiers for testing or cost management.

```bash
# Run only simple tier (fast, cheap)
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier simple

# Later, run medium tier
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier medium \
  --resume

# Finally, run complex tier
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier complex \
  --resume
```

---

## Example 7: Output to Single File

Combine all exercises into one JSON file.

### Configuration

```json title="mapping.json"
{
  "output": {
    "singleFile": true,
    "singleFileName": "all-exercises.json",
    "pretty": true,
    "directory": "./fds-output"
  }
}
```

### Run

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json
```

### Output

```json title="fds-output/all-exercises.json"
[
  { "exerciseId": "...", "canonical": { "name": "Barbell Bench Press", ... } },
  { "exerciseId": "...", "canonical": { "name": "Back Squat", ... } },
  { "exerciseId": "...", "canonical": { "name": "Deadlift", ... } }
]
```

---

## See Also

- [CLI Reference](/docs/tools/transformer/cli-reference) - All commands and options
- [Configuration](/docs/tools/transformer/configuration) - Mapping config reference
- [AI Enrichment](/docs/tools/transformer/ai-enrichment) - Tiered enrichment guide
- [Built-in Transforms](/docs/tools/transformer/transforms) - Transform function reference
