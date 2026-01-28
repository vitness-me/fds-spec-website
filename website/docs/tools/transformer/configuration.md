---
title: Configuration
description: Complete reference for FDS Transformer mapping configuration
sidebar_position: 4
---

# Configuration

The FDS Transformer uses a JSON configuration file to define how source fields map to FDS format. This guide covers the complete mapping configuration schema.

## Configuration File

Create a `mapping.json` file in your project:

```json
{
  "$schema": "https://spec.vitness.me/schemas/transformer/v1.0.0/mapping.schema.json",
  "version": "1.0.0",
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise"
  },
  "registries": { },
  "mappings": { },
  "enrichment": { },
  "validation": { },
  "output": { }
}
```

## Schema Reference

### Root Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `$schema` | string | No | JSON Schema URL for IDE validation |
| `version` | string | Yes | Config version (e.g., "1.0.0") |
| `targetSchema` | object | Yes | Target FDS schema configuration |
| `registries` | object | No | Registry sources for lookups |
| `mappings` | object | Yes | Field mapping definitions |
| `enrichment` | object | No | AI enrichment configuration |
| `validation` | object | No | Validation settings |
| `output` | object | No | Output format settings |
| `plugins` | array | No | Custom transform plugins |

---

### `targetSchema`

Specifies which FDS schema to target:

```json
{
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise",
    "url": "https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json"
  }
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `version` | string | Yes | FDS schema version |
| `entity` | string | No | Entity type: `exercise`, `equipment`, `muscle`, `muscle-category`, `body-atlas` |
| `url` | string | No | Custom schema URL (overrides default) |

---

### `registries`

Configure registry sources for lookups. Registries provide muscle, equipment, and category data for the `registryLookup` transform.

```json
{
  "registries": {
    "muscles": {
      "source": "local",
      "local": "./registries/muscles.registry.json"
    },
    "equipment": {
      "source": "local",
      "local": "./registries/equipment.registry.json"
    },
    "muscleCategories": {
      "source": "local",
      "local": "./registries/muscle-categories.registry.json"
    }
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `source` | string | Source type: `local`, `remote`, `inline` |
| `local` | string | Path to local registry file |
| `url` | string | URL for remote registry |
| `inline` | array | Inline registry entries |
| `cache` | boolean | Cache remote registries locally |
| `fallback` | string | Fallback source if primary fails |

> **Note:** You must provide your own registry files. The transformer does not ship with pre-built registries.

---

### `mappings`

Define how source fields map to FDS fields:

```json
{
  "mappings": {
    "canonical.name": {
      "from": "name",
      "transform": "titleCase"
    },
    "canonical.slug": {
      "from": "name",
      "transform": "slugify"
    },
    "exerciseId": {
      "from": null,
      "transform": "uuid"
    },
    "targets.primary": {
      "from": "target",
      "transform": "registryLookup",
      "options": {
        "registry": "muscles",
        "fuzzyMatch": true,
        "threshold": 0.8
      }
    }
  }
}
```

#### Mapping Types

**Simple String Mapping:**
```json
{
  "canonical.name": "name"
}
```

**Object Mapping:**
```json
{
  "canonical.name": {
    "from": "name",
    "transform": "titleCase",
    "default": "Unknown Exercise",
    "required": true
  }
}
```

#### Mapping Properties

| Property | Type | Description |
|----------|------|-------------|
| `from` | string \| string[] \| null | Source field path(s), or `null` for generated |
| `transform` | string \| string[] | Transform function(s) to apply |
| `options` | object | Options passed to transform function |
| `default` | any | Default value if source is missing |
| `required` | boolean | Whether field is required |
| `condition` | string | Condition expression for conditional mapping |
| `enrichment` | object | Field-level AI enrichment config |

#### Nested Field Paths

Use dot notation for nested fields:

```json
{
  "canonical.name": "name",
  "canonical.slug": { "from": "name", "transform": "slugify" },
  "canonical.description": "description",
  "classification.exerciseType": "type",
  "classification.level": "difficulty"
}
```

#### Multiple Source Fields

Combine multiple source fields:

```json
{
  "canonical.name": {
    "from": ["firstName", "lastName"],
    "transform": "template",
    "options": {
      "template": "{{firstName}} {{lastName}}"
    }
  }
}
```

#### Chained Transforms

Apply multiple transforms in sequence:

```json
{
  "canonical.slug": {
    "from": "name",
    "transform": ["titleCase", "slugify"]
  }
}
```

---

### `enrichment`

Configure AI enrichment. See [AI Enrichment Guide](/docs/tools/transformer/ai-enrichment) for details.

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
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" }
    },
    
    "fallback": {
      "retries": 2,
      "degradeModel": true,
      "useDefaults": true
    },
    
    "rateLimit": {
      "requestsPerMinute": 50,
      "backoffStrategy": "exponential"
    },
    
    "checkpoint": {
      "enabled": true,
      "saveInterval": 10
    }
  }
}
```

---

### `validation`

Configure output validation:

```json
{
  "validation": {
    "enabled": true,
    "strict": false,
    "failOnError": false,
    "outputErrors": "./validation-errors.json"
  }
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable schema validation |
| `strict` | boolean | `false` | Fail on any validation error |
| `failOnError` | boolean | `false` | Stop processing on first error |
| `outputErrors` | string | - | Path to write validation errors |

---

### `output`

Configure output format:

```json
{
  "output": {
    "format": "json",
    "pretty": true,
    "directory": "./fds-output",
    "naming": "{{canonical.slug}}",
    "singleFile": false,
    "singleFileName": "exercises.json"
  }
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `format` | string | `json` | Output format: `json`, `jsonl`, `ndjson` |
| `pretty` | boolean | `true` | Pretty-print JSON |
| `directory` | string | `./` | Output directory |
| `naming` | string | `{{canonical.slug}}` | Filename template |
| `singleFile` | boolean | `false` | Output all to single file |
| `singleFileName` | string | `output.json` | Name for single file output |

---

### `plugins`

Load custom transform plugins:

```json
{
  "plugins": [
    "./plugins/my-transforms.js",
    {
      "name": "./plugins/custom.js",
      "options": {
        "apiKey": "..."
      }
    }
  ]
}
```

See [Plugin Development](/docs/tools/transformer/plugins) for details.

---

## Complete Example

```json
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
      "transform": "titleCase",
      "required": true
    },
    "canonical.slug": {
      "from": "name",
      "transform": "slugify"
    },
    "classification.exerciseType": {
      "from": "type",
      "default": "strength"
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
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" },
      "targets.secondary": { "tier": "complex", "prompt": "biomechanics" }
    }
  },
  "validation": {
    "enabled": true,
    "strict": false
  },
  "output": {
    "format": "json",
    "pretty": true,
    "directory": "./fds-output"
  }
}
```

---

## See Also

- [Built-in Transforms](/docs/tools/transformer/transforms) - Available transform functions
- [AI Enrichment](/docs/tools/transformer/ai-enrichment) - Tiered enrichment configuration
- [Plugin Development](/docs/tools/transformer/plugins) - Create custom transforms
- [Examples](/docs/tools/transformer/examples) - Complete workflow examples
