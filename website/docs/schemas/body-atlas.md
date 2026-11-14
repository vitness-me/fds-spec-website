---
title: Body Atlas Schema
description: JSON Schema for body atlas data model
sidebar_position: 6
---

# Body Atlas Schema (v1.1.0)

The Body Atlas schema defines interactive body visualization structures with multiple views, areas, and muscle bindings.

## Schema Location

**URL:** `https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.schema.json`

**Download:** [body-atlas.schema.json](https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.schema.json)

`v1.0.0` remains published and frozen at its own URL. 1.1.0 is purely additive, so every 1.0.0 document validates against it unchanged.

## Examples

View the body atlas examples:
- [Basic Body Atlas](https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.example.json)

## Specification

For detailed information about the body atlas data model, see [RFC-005: Body Atlas Data Model](../specifications/rfc-005-body-atlas-data-model).

## Key Fields

- `id`: UUID identifier
- `schemaVersion`: Version string (e.g., "1.1.0")
- `canonical`: Standardized naming with slug and aliases
- `views`: Different body views (front, back, side) with visual assets
- `views[].asset.license` and `views[].asset.attribution`: optional terms and credit text for each view's artwork (1.1.0). A missing `license` means the terms are unstated, not that the artwork is free to use
- `areas`: Interactive clickable regions mapped to muscles
- `metadata`: Status, timestamps, authorship
