---
title: Equipment Schema
description: JSON Schema for equipment data model
sidebar_position: 3
---

# Equipment Schema (v1.0.0)

The Equipment schema defines fitness equipment entities with classification, metadata, and extensible attributes.

## Schema Location

**URL:** `https://spec.vitness.me/schemas/equipment/v1.0.0/equipment.schema.json`

**Download:** [equipment.schema.json](https://spec.vitness.me/schemas/equipment/v1.0.0/equipment.schema.json)

## Examples

View the equipment examples:
- [Basic Equipment](https://spec.vitness.me/schemas/equipment/v1.0.0/equipment.example.json)

## Specification

For detailed information about the equipment data model, see [RFC-002: Equipment Data Model](../specifications/rfc-002-equipment-data-model).

## Key Fields

- `id`: UUID identifier
- `schemaVersion`: Version string (e.g., "1.0.0")
- `canonical`: Standardized naming with slug and aliases
- `classification`: Equipment type and category
- `attributes`: Flexible key-value storage for equipment-specific properties
- `metadata`: Status, timestamps, authorship
