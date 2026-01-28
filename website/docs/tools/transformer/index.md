---
title: Overview
description: Transform any source schema to FDS format with optional AI enrichment
sidebar_position: 1
---

# FDS Transformer

Transform any source schema to FDS (Fitness Data Standard) format with optional AI enrichment.

**Package:** `@vitness/fds-transformer`  
**Version:** 0.1.0  
**License:** MIT

## Overview

The FDS Transformer is a CLI tool and library that converts your existing fitness data into FDS-compliant JSON. It handles the complexity of mapping arbitrary source schemas to the standardized FDS format, with optional AI-powered enrichment for generating missing fields.

## Key Features

| Feature | Description |
|---------|-------------|
| **Interactive CLI** | Beautiful wizard-style interface for guided transformation |
| **Non-Interactive Mode** | Batch processing for CI/CD pipelines |
| **Tiered AI Enrichment** | Multi-tier AI-powered field generation via OpenRouter |
| **Registry Management** | Muscle, equipment, and category lookups with fuzzy matching |
| **Multi-Version Support** | Target different FDS schema versions |
| **Plugin System** | Extend with custom transforms |
| **Checkpoint/Resume** | Resume long-running transformations |
| **Cost Estimation** | Preview AI enrichment costs before running |

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Source Data    │────▶│  FDS Transformer │────▶│  FDS-Compliant  │
│  (any format)   │     │                  │     │     JSON        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                        ┌──────┴──────┐
                        ▼             ▼
               ┌─────────────┐ ┌─────────────┐
               │  Registries │ │ AI Provider │
               │  (muscles,  │ │ (optional)  │
               │  equipment) │ │             │
               └─────────────┘ └─────────────┘
```

1. **Load** your source data (JSON array or single object)
2. **Configure** field mappings in `mapping.json`
3. **Transform** using built-in transforms (slugify, titleCase, etc.)
4. **Enrich** missing fields with AI (optional)
5. **Validate** output against FDS JSON Schema
6. **Output** FDS-compliant JSON files

## Quick Start

### Installation

```bash
# Global install (recommended for frequent use)
npm install -g @vitness/fds-transformer

# Or use npx without installing
npx @vitness/fds-transformer --help
```

### Basic Usage

```bash
# Interactive mode - launches guided wizard
fds-transformer

# Transform with config file
fds-transformer transform \
  --input ./data.json \
  --config ./mapping.json \
  --output ./fds/

# Validate existing FDS data
fds-transformer validate --input ./exercise.json
```

> **Note:** If you didn't install globally, prefix commands with `npx @vitness/fds-transformer` instead of `fds-transformer`.

### Programmatic Usage

```typescript
import { Transformer } from '@vitness/fds-transformer';

const transformer = new Transformer({
  config: './mapping.json',
});

// Transform single item
const result = await transformer.transform({
  id: '0001',
  name: 'Barbell Bench Press',
  equipment: 'barbell',
  target: 'pectorals',
});

console.log(result.data);
```

## What's Next?

- [Installation Guide](/docs/tools/transformer/installation) - Detailed setup instructions
- [CLI Reference](/docs/tools/transformer/cli-reference) - All commands and options
- [Configuration](/docs/tools/transformer/configuration) - Mapping config reference
- [AI Enrichment](/docs/tools/transformer/ai-enrichment) - Tiered enrichment guide
- [Built-in Transforms](/docs/tools/transformer/transforms) - Transform function reference
- [Plugin Development](/docs/tools/transformer/plugins) - Create custom transforms
- [Examples](/docs/tools/transformer/examples) - End-to-end workflows

## Requirements

- **Node.js:** >=20.0.0
- **API Key:** Required only for AI enrichment (OpenRouter)
