---
title: Body Atlas Schema
description: JSON Schema for body atlas data model
sidebar_position: 6
---

# Body Atlas Schema (v1.0.0)

The Body Atlas schema defines interactive body visualization structures with multiple views, areas, and muscle bindings.

## Schema Location

**URL:** `https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.schema.json`

**Download:** [body-atlas.schema.json](https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.schema.json)

## Examples

View the body atlas examples:
- [Basic Body Atlas](https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.example.json)

## Specification

For detailed information about the body atlas data model, see [RFC-005: Body Atlas Data Model](../specifications/rfc-005-body-atlas-data-model).

## Key Fields

- `id`: UUID identifier
- `schemaVersion`: Version string (e.g., "1.0.0")
- `canonical`: Standardized naming with slug and aliases
- `views`: Different body views (front, back, side) with visual assets
- `areas`: Interactive clickable regions mapped to muscles
- `metadata`: Status, timestamps, authorship
