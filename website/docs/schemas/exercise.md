---
title: Exercise Schema
description: JSON Schema for exercise data model
sidebar_position: 2
---

# Exercise Schema (v1.2.0)

The Exercise schema defines the core data model for fitness exercises. It includes classification, muscle targets, equipment requirements, and media assets.

## Schema Location

**URL:** `https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.schema.json`

**Download:** [exercise.schema.json](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.schema.json)

## Examples

View the exercise examples:
- [Basic Exercise](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.json)
- [Cardio Exercise](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.cardio.json)
- [Mobility Exercise](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.mobility.json)
- [Machine Exercise](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.machine.json)
- [Unilateral Exercise](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.unilateral.json)
- [Exercise with structural descriptors (draft, RFC-010)](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.descriptors.json)

## Specification

For detailed information about the exercise data model, see [RFC-001: Exercise Data Model](../specifications/rfc-001-exercise-data-model).

## Key Fields

- `id`: UUID identifier
- `schemaVersion`: Version string (e.g., "1.0.0")
- `canonical`: Standardized naming with slug and aliases
- `classification`: Exercise type, mechanics, force, level, kinetic chain
- `targets`: Primary and secondary muscle targets with activation levels; each muscle reference may carry its `fxm` key
- `equipment`: Required, optional, and alternative equipment; each equipment reference may carry its standard `fxe`
- `media`: Images, videos, and diagrams
- `metadata`: Status, timestamps, authorship
- `fxi`, `fxe`: Optional structural descriptors (RFC-010): the exercise's canonical FXI, and the standard FXE of its main equipment
- `fxiProvenance`, `fxiGap`: Who answered for the FXI, and the owner's note of what it misses, or `null`
- `xrefs`: Links to the same exercise in other catalogues, each made `auto` or `confirmed`
