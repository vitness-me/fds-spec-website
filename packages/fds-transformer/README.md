# @vitness/fds-transformer

Transform any source schema to FDS (Fitness Data Standard) format with optional AI enrichment.

## Features

- **Interactive CLI** - Beautiful wizard-style interface for guided transformation
- **Non-Interactive Mode** - Batch processing for CI/CD pipelines
- **Tiered AI Enrichment** - Multi-tier AI-powered field generation via OpenRouter with configurable models per complexity level
- **Registry Management** - Muscle, equipment, and category lookups with fuzzy matching
- **Multi-Version Support** - Target different FDS schema versions
- **Plugin System** - Extend with custom transforms
- **TDD** - Comprehensive test coverage with Vitest

## Installation

```bash
npm install @vitness/fds-transformer
# or
pnpm add @vitness/fds-transformer
```

## Quick Start

### CLI Usage

```bash
# Interactive mode
npx fds-transformer

# Transform with config
npx fds-transformer transform --input ./data.json --config ./mapping.json --output ./fds/

# Validate FDS data
npx fds-transformer validate --input ./exercise.json

# Create mapping config
npx fds-transformer init --sample ./sample.json
```

### Programmatic Usage

```typescript
import { Transformer } from '@vitness/fds-transformer';

const transformer = new Transformer({
  config: './mapping.json',
  ai: {
    provider: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
  },
});

// Transform single item
const result = await transformer.transform({
  id: '0001',
  name: 'Barbell Bench Press',
  equipment: 'barbell',
  target: 'pectorals',
});

console.log(result.data);

// Batch transform with streaming
for await (const result of transformer.transformStream(items)) {
  console.log(result);
}
```

## Mapping Configuration

Create a `mapping.json` file to define how source fields map to FDS:

```json
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
    "canonical.name": { "from": "name", "transform": "titleCase" },
    "canonical.slug": { "from": "name", "transform": "slugify" },
    "targets.primary": {
      "from": "target",
      "transform": "registryLookup",
      "options": { "registry": "muscles", "fuzzyMatch": true }
    },
    "classification": {
      "enrichment": {
        "enabled": true,
        "prompt": "exercise_classification",
        "context": ["name", "equipment", "target"]
      }
    }
  },
  "enrichment": {
    "provider": "openrouter",
    "model": "anthropic/claude-3.5-sonnet"
  }
}
```

## Built-in Transforms

| Transform | Description |
|-----------|-------------|
| `slugify` | Convert to URL-safe slug |
| `titleCase` | Convert to Title Case |
| `uuid` | Generate UUIDv4 |
| `toArray` | Ensure value is array |
| `toMediaArray` | Convert URLs to FDS media format |
| `registryLookup` | Find in registry with fuzzy matching |
| `timestamp` | Generate ISO timestamp |
| `autoGenerate` | Auto-generate metadata fields |
| `template` | Apply template strings |
| `urlTransform` | Transform URLs |

## AI Enrichment

The transformer supports **tiered AI enrichment** - a multi-tier system that uses different AI models based on field complexity:

### Tiered Enrichment Configuration

```json
{
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
      "metrics.primary": { "tier": "simple", "prompt": "metrics" },
      "equipment.optional": { "tier": "simple", "prompt": "equipment" },
      
      "constraints.contraindications": { "tier": "medium", "prompt": "constraints" },
      "constraints.prerequisites": { "tier": "medium", "prompt": "constraints" },
      "constraints.progressions": { "tier": "medium", "prompt": "constraints" },
      "relations": { "tier": "medium", "prompt": "relations" },
      
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" },
      "classification.mechanics": { "tier": "complex", "prompt": "biomechanics" },
      "classification.force": { "tier": "complex", "prompt": "biomechanics" },
      "targets.secondary": { "tier": "complex", "prompt": "biomechanics" }
    },
    
    "fallback": {
      "retries": 2,
      "degradeModel": true,
      "degradeChain": {
        "complex": "medium",
        "medium": "simple",
        "simple": null
      }
    }
  }
}
```

### Tier Descriptions

| Tier | Model | Use Case | Fields |
|------|-------|----------|--------|
| **simple** | Claude Haiku 4.5 | Fast, straightforward enrichment | aliases, exerciseType, level, metrics, optional equipment |
| **medium** | Claude Sonnet 4.5 | Balanced accuracy/speed | constraints, progressions/regressions, relations |
| **complex** | Claude Sonnet 4.5 | Deep biomechanical analysis | movement patterns, mechanics, force vectors, secondary muscles |

### Running Specific Tiers

```bash
# Run only simple tier (fastest)
fds-transformer transform --config ./mapping.json --input ./data.json --tier simple

# Run only medium tier
fds-transformer transform --config ./mapping.json --input ./data.json --tier medium

# Run only complex tier (most detailed)
fds-transformer transform --config ./mapping.json --input ./data.json --tier complex

# Run all tiers (default)
fds-transformer transform --config ./mapping.json --input ./data.json
```

### Debug Mode

Enable verbose logging to troubleshoot enrichment:

```bash
DEBUG_ENRICHMENT=true fds-transformer transform --config ./mapping.json --input ./data.json
```

### Legacy Single-Field Enrichment

For simpler use cases, you can still use field-level enrichment:

```json
{
  "canonical.description": {
    "enrichment": {
      "enabled": true,
      "prompt": "exercise_description",
      "context": ["name", "target", "equipment"],
      "when": "missing"
    }
  }
}
```

### Enrichment Options

- `when`: `"always"` | `"missing"` | `"empty"` | `"notFound"`
- `prompt`: Built-in prompt name or custom prompt
- `context`: Source fields to include as AI context
- `fields`: Specific sub-fields to enrich
- `fallback`: Value to use if enrichment fails

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | API key for OpenRouter |
| `FDS_TRANSFORMER_MODEL` | Override AI model |
| `DEBUG_ENRICHMENT` | Set to `true` for verbose enrichment logging |

## Plugin Development

Create custom transforms:

```typescript
import type { TransformPlugin } from '@vitness/fds-transformer';

const myPlugin: TransformPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  transforms: {
    customSlug: (value, options, context) => {
      return `custom-${String(value).toLowerCase()}`;
    },
  },
};

export default myPlugin;
```

Use in config:

```json
{
  "plugins": ["./my-plugin.js"],
  "mappings": {
    "canonical.slug": {
      "from": "name",
      "transform": "my-plugin:customSlug"
    }
  }
}
```

## Example: Full Enrichment Workflow

Here's a complete example transforming exercise data with all enrichment tiers:

### 1. Source Data (`exercises.json`)

```json
[
  {
    "id": "0001",
    "name": "Barbell Bench Press",
    "target": "pectorals",
    "equipment": "barbell"
  }
]
```

### 2. Mapping Config (`mapping.config.json`)

See the tiered enrichment configuration section above for a complete example.

### 3. Run Transformation

```bash
OPENROUTER_API_KEY=your-key fds-transformer transform \
  --config ./mapping.config.json \
  --input ./exercises.json \
  --output ./fds-output
```

### 4. Output

The transformer produces FDS-compliant JSON with all enriched fields:

```json
{
  "exerciseId": "caf217a9-3880-4f12-bc2e-71ce44d42665",
  "schemaVersion": "1.0.0",
  "canonical": {
    "name": "Barbell Bench Press",
    "slug": "barbell-bench-press",
    "aliases": ["bench press", "flat bench press", "BB bench"]
  },
  "targets": {
    "primary": [{ "id": "...", "name": "Chest", "slug": "chest" }],
    "secondary": [
      { "id": "anterior-deltoid", "name": "Anterior Deltoid" },
      { "id": "triceps-brachii", "name": "Triceps Brachii" }
    ]
  },
  "equipment": {
    "required": [{ "id": "...", "name": "Barbell", "slug": "barbell" }],
    "optional": [{ "id": "bench", "name": "Bench" }]
  },
  "classification": {
    "movement": "push-horizontal",
    "mechanics": "compound",
    "force": "push",
    "kineticChain": "open",
    "tags": ["upper-body", "strength", "power", "pressing"]
  },
  "metrics": {
    "primary": { "type": "weight", "unit": "kg" },
    "secondary": [{ "type": "reps", "unit": "count" }]
  },
  "constraints": {
    "contraindications": ["Acute shoulder pain", "..."],
    "prerequisites": ["Pain-free shoulder ROM", "..."],
    "progressions": ["Incline bench press", "..."],
    "regressions": ["Push-up", "Dumbbell bench press", "..."]
  },
  "relations": [
    { "type": "equipmentVariant", "targetId": "dumbbell-bench-press" },
    { "type": "regression", "targetId": "push-up" }
  ]
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Run CLI in dev mode
pnpm dev
```

## Related Packages

- `@vitness/fds-skill` - AI skill and knowledge base for FDS

## License

MIT
