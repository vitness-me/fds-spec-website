---
title: Muscle Category Schema
description: JSON Schema for muscle category data model
sidebar_position: 5
---

# Muscle Category Schema (v1.0.0)

The Muscle Category schema defines groupings and categorizations of muscles with flexible tagging and metadata.

## Schema Location

**URL:** `https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`

**Download:** [muscle-category.schema.json](https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json)

## Examples

View the muscle category examples:
- [Basic Category](https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.example.json)

## Specification

For detailed information about the muscle category data model, see [RFC-004: Muscle Category Data Model](../specifications/rfc-004-muscle-category-data-model).

## Key Fields

- `id`: UUID identifier
- `schemaVersion`: Version string (e.g., "1.0.0")
- `canonical`: Standardized naming with slug and aliases
- `classification`: Category tags and attributes
- `metadata`: Status, timestamps, authorship
