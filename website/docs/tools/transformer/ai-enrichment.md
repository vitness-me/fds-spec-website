---
title: AI Enrichment
description: Tiered AI enrichment for intelligent field generation
sidebar_position: 5
---

# AI Enrichment

The FDS Transformer supports **tiered AI enrichment** - a multi-tier system that uses different AI models based on field complexity. This enables cost-effective, intelligent field generation while maintaining quality where it matters most.

## Overview

Tiered enrichment groups fields by complexity:

| Tier | Model | Use Case | Cost | Speed |
|------|-------|----------|------|-------|
| **Simple** | Claude Haiku 4.5 | Fast, straightforward enrichment | Low | Fast |
| **Medium** | Claude Sonnet 4.5 | Balanced accuracy/speed | Medium | Medium |
| **Complex** | Claude Sonnet 4.5 | Deep biomechanical analysis | Higher | Slower |

This approach:
- **Reduces costs** by using cheaper models for simple tasks
- **Improves accuracy** by dedicating powerful models to complex analysis
- **Enables batching** to reduce API calls

## Requirements

- **OpenRouter API Key** - Get one at [openrouter.ai](https://openrouter.ai/)
- Set the environment variable:

```bash
export OPENROUTER_API_KEY=your-api-key-here
```

## Configuration

### Basic Setup

Add the `enrichment` section to your `mapping.json`:

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
    }
  }
}
```

### Tier Configuration

Each tier has these settings:

| Property | Type | Description |
|----------|------|-------------|
| `model` | string | OpenRouter model identifier |
| `temperature` | number | Generation temperature (0-1). Lower = more deterministic |
| `maxTokens` | number | Maximum tokens for response |
| `batchSize` | number | Number of exercises to process together |
| `priority` | string | Optimization hint: `speed`, `balanced`, or `accuracy` |

### Field Configuration

Each field in the `fields` object:

| Property | Type | Description |
|----------|------|-------------|
| `tier` | string | Which tier to use: `simple`, `medium`, `complex` |
| `prompt` | string | Prompt template key |
| `enum` | string[] | Valid values (for constrained fields) |
| `required` | boolean | Whether field must be populated |

## Field-to-Tier Mapping

### Simple Tier Fields

Fast enrichment for straightforward data:

| Field | Prompt | Description |
|-------|--------|-------------|
| `canonical.aliases` | `aliases` | Alternative names for the exercise |
| `classification.exerciseType` | `classification-simple` | Exercise type (strength, cardio, etc.) |
| `classification.level` | `classification-simple` | Difficulty level |
| `metrics.primary` | `metrics` | Primary measurement type |
| `equipment.optional` | `equipment` | Optional equipment suggestions |

### Medium Tier Fields

Balanced enrichment for relational data:

| Field | Prompt | Description |
|-------|--------|-------------|
| `constraints.contraindications` | `constraints` | Medical/injury contraindications |
| `constraints.prerequisites` | `constraints` | Required abilities |
| `constraints.progressions` | `progressions` | Harder variations |
| `constraints.regressions` | `progressions` | Easier variations |
| `relations` | `relations` | Related exercise references |

### Complex Tier Fields

Deep analysis for biomechanical data:

| Field | Prompt | Description |
|-------|--------|-------------|
| `classification.movement` | `biomechanics` | Movement pattern classification |
| `classification.mechanics` | `biomechanics` | Compound vs isolation |
| `classification.force` | `biomechanics` | Force direction (push/pull/static) |
| `classification.kineticChain` | `biomechanics` | Open vs closed chain |
| `targets.secondary` | `biomechanics` | Secondary muscles engaged |

## Running Enrichment

### Full Enrichment (All Tiers)

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --output ./fds-output/
```

### Single Tier Only

Run specific tiers to control costs or debug:

```bash
# Simple tier only (fastest, cheapest)
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier simple

# Medium tier only
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier medium

# Complex tier only (most detailed)
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier complex
```

### Skip Enrichment

Transform without any AI enrichment:

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --no-enrichment
```

## Cost Estimation

Preview costs before running:

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --estimate-cost
```

Output:
```
┌───────────────────────────────────────────────────────────────────────┐
│                         Cost Estimation                               │
├───────────────────────────────────────────────────────────────────────┤
│ Input: 1,323 exercises                                                │
│ Enrichment fields: 18 (6 simple, 5 medium, 7 complex)                 │
│                                                                       │
│ Tier       │ Model              │ Batch │ Calls  │ Tokens   │ Cost   │
│ ───────────┼────────────────────┼───────┼────────┼──────────┼────────│
│ Simple     │ claude-haiku-4.5   │     5 │    265 │     ~53K │  $0.42 │
│ Medium     │ claude-sonnet-4.5  │     3 │    441 │    ~132K │  $1.98 │
│ Complex    │ claude-sonnet-4.5  │     1 │  1,323 │    ~529K │  $7.94 │
│ ───────────┴────────────────────┴───────┴────────┴──────────┴────────│
│ TOTAL                                   │  2,029 │   ~0.71M │ $10.34 │
│                                                                       │
│ Estimated time: 40 minutes (at 50 requests/min)                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Fallback & Error Handling

Configure graceful degradation:

```json
{
  "enrichment": {
    "fallback": {
      "retries": 2,
      "degradeModel": true,
      "useDefaults": true,
      "degradeChain": {
        "complex": "medium",
        "medium": "simple",
        "simple": null
      }
    }
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `retries` | number | Number of retries before degrading |
| `degradeModel` | boolean | Try lower-tier model on failure |
| `useDefaults` | boolean | Use defaults on complete failure |
| `degradeChain` | object | Model fallback chain |

## Rate Limiting

Control API request rate:

```json
{
  "enrichment": {
    "rateLimit": {
      "requestsPerMinute": 50,
      "backoffStrategy": "exponential",
      "initialBackoffMs": 1000,
      "maxBackoffMs": 60000
    }
  }
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `requestsPerMinute` | number | 50 | Max requests per minute |
| `backoffStrategy` | string | `exponential` | Backoff type: `exponential`, `linear`, `fixed` |
| `initialBackoffMs` | number | 1000 | Initial backoff delay |
| `maxBackoffMs` | number | 60000 | Maximum backoff delay |

## Checkpoints & Resume

Enable checkpoint saving for long runs:

```json
{
  "enrichment": {
    "checkpoint": {
      "enabled": true,
      "saveInterval": 10
    }
  }
}
```

Resume from checkpoint:

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --resume
```

## Debug Mode

Enable verbose logging:

```bash
DEBUG_ENRICHMENT=true fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --log-level debug
```

This outputs:
- Prompts sent to AI
- Raw responses
- Token usage per request
- Timing information

## Per-Field Enrichment

For simpler use cases or when you need fine-grained control, configure enrichment per-field in mappings:

```json
{
  "mappings": {
    "canonical.description": {
      "from": "description",
      "enrichment": {
        "enabled": true,
        "prompt": "exercise_description",
        "context": ["name", "target", "equipment"],
        "when": "missing",
        "fallback": "No description available"
      }
    }
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `enabled` | boolean | Enable enrichment for this field |
| `prompt` | string | Prompt template key or custom prompt |
| `context` | string[] | Source fields to include as context |
| `when` | string | When to enrich: `always`, `missing`, `empty`, `notFound` |
| `fallback` | any | Value to use if enrichment fails |
| `validate` | boolean | Validate enriched value against schema |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | API key for OpenRouter (required) |
| `FDS_TRANSFORMER_MODEL` | Override default model for all tiers |
| `DEBUG_ENRICHMENT` | Set to `true` for verbose logging |

## Best Practices

1. **Start with cost estimation** - Always run `--estimate-cost` first
2. **Test with small batches** - Try 10-20 items before full runs
3. **Use tier filtering** - Debug one tier at a time with `--tier`
4. **Enable checkpoints** - Always enable for large datasets
5. **Monitor token usage** - Check debug output for optimization opportunities
6. **Use appropriate batch sizes** - Larger batches reduce costs but may increase failures

## See Also

- [Configuration](/docs/tools/transformer/configuration) - Full config reference
- [CLI Reference](/docs/tools/transformer/cli-reference) - Command options
- [Examples](/docs/tools/transformer/examples) - Complete workflows
