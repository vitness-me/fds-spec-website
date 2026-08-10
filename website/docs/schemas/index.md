---
title: JSON Schemas
description: Interactive JSON Schema viewers for all FDS entities
sidebar_position: 1
---

# FDS JSON Schemas

All FDS entities are defined using JSON Schema (Draft 2020-12). Each schema includes examples and validation rules.

## Available Schemas

### [Exercise Schema](/docs/schemas/exercise)
The core exercise data model with classification, targets, equipment, and media.

**Schema:** `/schemas/exercises/v1.1.0/exercise.schema.json`

### [Equipment Schema](/docs/schemas/equipment)
Fitness equipment definitions with classification and metadata.

**Schema:** `/schemas/equipment/v1.1.0/equipment.schema.json`

### [Muscle Schema](/docs/schemas/muscle)
Anatomical muscle definitions with heatmap visualization support.

**Schema:** `/schemas/muscle/v1.0.0/muscle.schema.json`

### [Muscle Category Schema](/docs/schemas/muscle-category)
Muscle grouping and categorization structure.

**Schema:** `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`

### [Body Atlas Schema](/docs/schemas/body-atlas)
Body visualization structure with views and areas.

**Schema:** `/schemas/atlas/v1.0.0/body-atlas.schema.json`

### [Workout Schema](/docs/schemas/workout)
One prescribed session: blocks of items, an execution mode per block, and a prescription per set.

**Schema:** `/schemas/workout/v1.0.0/workout.schema.json`

### [Program Schema](/docs/schemas/program)
A schedule of workout references over time: cycles, weeks, day placement, progression and branching.

**Schema:** `/schemas/program/v1.0.0/program.schema.json`

## Definition libraries

### [Prescription Primitives](/docs/schemas/prescription)
Load, repetitions, tempo, rest, intensity zones, set schemes and progression rules — the definitions workouts and programs compose.

**Schema:** `/schemas/prescription/v1.0.0/prescription.schema.json`

This one is **not an entity**. Its root validates nothing by construction: there is no prescription document to hold, only definitions that other schemas use. You validate against a definition inside it, never against the root.

## Entity versions are not uniform

A release names a *set* of entity versions rather than one version they all share. Release 1.3.0 serves exercise and equipment at 1.1.0 and everything else at 1.0.0 — there is no `muscle/v1.3.0/`, and there will not be unless muscle itself changes. Build schema URLs from the entity version, not the release.

## Validation

See the [Quick Validation Guide](/docs/getting-started/quick-validation) for instructions on validating your data against these schemas.

## Schema Locations

All schemas are served from: `https://spec.vitness.me/schemas/`
