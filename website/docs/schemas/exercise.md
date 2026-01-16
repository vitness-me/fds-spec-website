---
title: Exercise Schema
description: JSON Schema for exercise data model
sidebar_position: 2
---

# Exercise Schema (v1.0.0)

The Exercise schema defines the core data model for fitness exercises. It includes classification, muscle targets, equipment requirements, and media assets.

## Schema Location

**URL:** `https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json`

**Download:** [exercise.schema.json](https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json)

## Examples

View the exercise examples:
- [Basic Exercise](https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.example.json)
- [Cardio Exercise](https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.example.cardio.json)
- [Mobility Exercise](https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.example.mobility.json)
- [Machine Exercise](https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.example.machine.json)
- [Unilateral Exercise](https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.example.unilateral.json)

## Specification

For detailed information about the exercise data model, see [RFC-001: Exercise Data Model](../specifications/rfc-001-exercise-data-model).

## Key Fields

- `id`: UUID identifier
- `schemaVersion`: Version string (e.g., "1.0.0")
- `canonical`: Standardized naming with slug and aliases
- `classification`: Exercise type, mechanics, force, level, kinetic chain
- `targets`: Primary and secondary muscle targets with activation levels
- `equipment`: Required, optional, and alternative equipment
- `media`: Images, videos, and diagrams
- `metadata`: Status, timestamps, authorship
