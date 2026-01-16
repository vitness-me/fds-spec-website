---
title: Muscle Schema
description: JSON Schema for muscle data model
sidebar_position: 4
---

# Muscle Schema (v1.0.0)

The Muscle schema defines anatomical muscle entities with classification, heatmap visualization data, and metadata.

## Schema Location

**URL:** `https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.schema.json`

**Download:** [muscle.schema.json](https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.schema.json)

## Examples

View the muscle examples:
- [Basic Muscle](https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.example.json)
- [Lats Muscle](https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.example.lats.json)

## Specification

For detailed information about the muscle data model, see [RFC-003: Muscle Data Model](../specifications/rfc-003-muscle-data-model).

## Key Fields

- `id`: UUID identifier
- `schemaVersion`: Version string (e.g., "1.0.0")
- `canonical`: Standardized naming with slug and aliases
- `classification`: Muscle category, region, laterality
- `heatmap`: Visualization data with regions and intensity values
- `metadata`: Status, timestamps, authorship
