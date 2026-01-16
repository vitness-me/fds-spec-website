---
title: Quick Validation
description: Validate your FDS data against JSON schemas
sidebar_position: 2
---

# Quick Validation Guide

Validate your FDS data using Ajv (Draft 2020-12).

## Installation

```bash
npm install -g ajv-cli ajv-formats
```

## Validate Examples

### Exercise Schema

```bash
ajv validate \
  -s https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json \
  -d your-exercise.json \
  --spec=draft2020 \
  -c ajv-formats
```

### Equipment Schema

```bash
ajv validate \
  -s https://spec.vitness.me/schemas/equipment/v1.0.0/equipment.schema.json \
  -d your-equipment.json \
  --spec=draft2020 \
  -c ajv-formats
```

## Schema Locations

All schemas are available at: `https://spec.vitness.me/schemas/`

- Exercise: `/schemas/exercises/v1.0.0/exercise.schema.json`
- Equipment: `/schemas/equipment/v1.0.0/equipment.schema.json`
- Muscle: `/schemas/muscle/v1.0.0/muscle.schema.json`
- Muscle Category: `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`
- Body Atlas: `/schemas/atlas/v1.0.0/body-atlas.schema.json`

## Next Steps

- [Explore schemas interactively](/docs/schemas/exercise)
- [Browse specifications](/docs/specifications/rfc-001-exercise-data-model)
