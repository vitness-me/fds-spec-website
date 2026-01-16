# RFC-005: Body Atlas Data Model Specification

**Status**: Draft  
**Version**: 0.1.0  
**Date**: 2025-09-09  
**Authors**: VITNESS Team  
**Category**: Standards Track  

## Abstract

This specification defines a standardized Body Atlas model used to visualize muscle activation and related overlays across fitness applications. A Body Atlas provides view assets (e.g., anterior/posterior SVGs) and a stable set of named areas bound to shapes within those assets. Other entities (e.g., muscles) reference atlas areas to render interoperable heatmaps.

## 1. Introduction

### 1.1. Background

Many fitness apps visualize muscle activation using human‑body diagrams. Historically, these were tightly coupled to proprietary images and coordinates, limiting interoperability. The Body Atlas decouples visuals from data by providing a stable naming system for areas and a mechanism to bind those areas to concrete assets.

### 1.2. Goals

- Define a reusable atlas model with views, assets, and named areas.  
- Enable muscles, exercises, and reports to reference atlas areas in a portable way.  
- Support asset evolution without breaking references (new atlas versions).  
- Keep rendering geometry out of core entity records.

### 1.3. Scope

**In Scope:**
- Atlas views and assets (e.g., SVGs)
- Named areas with per‑view bindings (selectors)
- Versioning and compatibility rules
- JSON Schema and reference examples

**Out of Scope:**
- Rendering pipelines, color scales, or UI themes
- 3D model specifications beyond referencing an asset
- Per‑muscle or per‑exercise polygons inside core entity schemas

## 2. Terminology

- **Atlas**: A collection of views and named areas bound to assets (e.g., SVGs) for visualization.
- **View**: A perspective of the body (anterior, posterior, lateral, etc.).
- **Area**: A named region with bindings to shapes/selectors in one or more views.
- **Binding**: A mapping between an area and a view’s shape (e.g., CSS/SVG selector).

## 3. Core Structural Requirements

### 3.1. Required Fields

All compliant atlas records MUST include:

```json
{
  "schemaVersion": "1.0.0",
  "id": "atlas.body.v1",
  "canonical": {
    "name": "FDS Body Atlas v1",
    "slug": "body-atlas-v1",
    "aliases": ["Standard Body Atlas"],
    "localized": [ { "lang": "sr", "name": "Atlas tela v1" } ]
  },
  "views": [
    { "id": "anterior", "kind": "anterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/anterior.svg" } }
  ],
  "areas": [
    {
      "id": "thigh.left.anterior",
      "canonical": { "name": "Left Anterior Thigh", "slug": "thigh-left-anterior" },
      "bindings": [ { "viewId": "anterior", "selector": "#area-thigh-left" } ]
    }
  ],
  "metadata": {
    "createdAt": "2025-09-03T12:00:00Z",
    "updatedAt": "2025-09-03T12:00:00Z",
    "source": "vitness.atlas",
    "status": "active"
  }
}
```

### 3.2. Views
- `views[*].id` is a stable identifier used by `areas[*].bindings[*].viewId`.
- `views[*].kind` is one of `anterior`, `posterior`, `left-lateral`, `right-lateral`, `superior`, `inferior`.
- `views[*].asset` SHOULD be an SVG for best portability (other types allowed).

### 3.3. Areas and Bindings
- `areas[*].id` is a stable, global area identifier (dot‑notation recommended, e.g., `thigh.left.anterior`).
- `areas[*].bindings[*].selector` is a string suitable for selecting shapes in the linked asset (e.g., `#area-thigh-left`).
- An area MAY bind to multiple views.

## 4. Reference Structures

### 4.1. Canonical
```json
{
  "canonical": {
    "name": "FDS Body Atlas v1",
    "slug": "body-atlas-v1",
    "aliases": ["Standard Body Atlas"],
    "localized": [ { "lang": "sr", "name": "Atlas tela v1" } ]
  }
}
```

### 4.2. Views
```json
{
  "views": [
    { "id": "anterior", "kind": "anterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/anterior.svg" } },
    { "id": "posterior", "kind": "posterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/posterior.svg" } }
  ]
}
```

### 4.3. Areas
```json
{
  "areas": [
    {
      "id": "thigh.left.anterior",
      "canonical": { "name": "Left Anterior Thigh", "slug": "thigh-left-anterior" },
      "bindings": [ { "viewId": "anterior", "selector": "#area-thigh-left" } ]
    },
    {
      "id": "back.lower.posterior",
      "canonical": { "name": "Lower Back", "slug": "lower-back", "localized": [ { "lang": "sr", "name": "Donja leđa" } ] },
      "bindings": [ { "viewId": "posterior", "selector": "#area-lower-back" } ]
    }
  ]
}
```

## 5. Versioning and Compatibility

- Atlas records follow SemVer in `schemaVersion`.
- Introducing new views or areas is a Minor update if it does not invalidate existing references.
- Renaming or removing existing areas is a Major update and MUST NOT occur in Minor releases.
- Multiple atlas versions may coexist; referencing entities SHOULD specify the intended `atlasId`.

## 6. Implementation Guidance

### 6.1. Referencing from Muscles

Muscles MAY reference atlas areas to express heatmaps (see RFC‑003):
```json
{
  "heatmap": {
    "atlasId": "atlas.body.v1",
    "regions": [
      { "areaId": "thigh.left.anterior", "weight": 1.0 },
      { "areaId": "thigh.right.anterior", "weight": 1.0 }
    ]
  }
}
```

### 6.2. Aggregation

Consumers MAY combine multiple heatmaps by `areaId` within the same `atlasId` using `max(weight)` or a capped sum `min(1.0, sum(weights))`.

### 6.3. Asset Delivery
- Prefer SVGs with distinct, stable IDs for selectable shapes.
- Use HTTPS URIs; consider cache headers and ETags.

## 7. Security and Privacy Considerations
- Atlas records contain no PII; treat asset hosting securely.
- Validate selectors and URIs; avoid code injection via untrusted SVG content.

## 8. JSON Schema Reference
- **Body Atlas**: `/specification/schemas/atlas/v1.0.0/body-atlas.schema.json`

## 8.1. Validation

Validate with Ajv (Draft 2020‑12):
```
npx ajv -s specification/schemas/atlas/v1.0.0/body-atlas.schema.json \
  -d specification/schemas/atlas/v1.0.0/body-atlas.example.json
```

## 9. Example

See `/specification/schemas/atlas/v1.0.0/body-atlas.example.json`.

## Conformance

Conforming Producers:
- MUST emit JSON that validates against the Body Atlas schema for the declared `schemaVersion`.
- MUST provide stable `views[*].id` and `areas[*].id`.
- SHOULD prefer SVG assets and stable selectors.

Conforming Consumers:
- MUST validate incoming atlas data.
- MUST resolve `viewId` and `selector` pairs per area binding.
- SHOULD ignore unknown optional fields under `attributes` and `extensions`.

Compatibility:
- Optional additions (new areas/views) MUST NOT break consumers.
- Removing/renaming areas is breaking and requires a Major version.

## 10. References
- [RFC‑003: Muscle Data Model Specification](./rfc-003-muscle-data-model.md)

---

Copyright Notice  
Copyright (c) 2025 VITNESS.
This document is subject to the rights, licenses and restrictions contained in the VITNESS Open Standards License Agreement. See `/specification/VITNESS Open Standards License Agreement.md`.
