---
title: JSON Schemas
description: Interactive JSON Schema viewers for all FDS entities
sidebar_position: 1
---

# FDS JSON Schemas

All FDS entities are defined using JSON Schema (Draft 2020-12). Each schema includes examples and validation rules.

## Available Schemas (v1.0.0)

### [Exercise Schema](/docs/schemas/exercise)
The core exercise data model with classification, targets, equipment, and media.

**Schema:** `/schemas/exercises/v1.0.0/exercise.schema.json`

### [Equipment Schema](/docs/schemas/equipment)
Fitness equipment definitions with classification and metadata.

**Schema:** `/schemas/equipment/v1.0.0/equipment.schema.json`

### [Muscle Schema](/docs/schemas/muscle)
Anatomical muscle definitions with heatmap visualization support.

**Schema:** `/schemas/muscle/v1.0.0/muscle.schema.json`

### [Muscle Category Schema](/docs/schemas/muscle-category)
Muscle grouping and categorization structure.

**Schema:** `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`

### [Body Atlas Schema](/docs/schemas/body-atlas)
Body visualization structure with views and areas.

**Schema:** `/schemas/atlas/v1.0.0/body-atlas.schema.json`

## Validation

See the [Quick Validation Guide](/docs/getting-started/quick-validation) for instructions on validating your data against these schemas.

## Schema Locations

All schemas are served from: `https://spec.vitness.me/schemas/`
