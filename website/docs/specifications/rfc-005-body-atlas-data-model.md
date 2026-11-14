---
title: 'RFC-005: Body Atlas Data Model'
description: Standardized body visualization model for muscle activation and interactive anatomy overlays
sidebar_position: 5
keywords: [body atlas, visualization, anatomy, heatmap, data model, json schema, rfc]
---

# RFC-005: Body Atlas Data Model Specification

**Status**: Draft
**Version**: 0.2.0
**Date**: 2026-11-14
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

:::danger MUST
All compliant atlas records **MUST** include:
:::

```json
{
  "schemaVersion": "1.1.0",
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
- `views[*].asset` MAY state the artwork's terms in `license` and `attribution` (§4.2).

### 3.3. Areas and Bindings
- `areas[*].id` is a stable, global area identifier (dot‑notation recommended, e.g., `thigh.left.anterior`).
- `areas[*].bindings[*].selector` is a string suitable for selecting shapes in the linked asset (e.g., `#area-thigh-left`).
- An area MAY bind to multiple views.

## 4. Reference Structures

### 4.1. Canonical

`canonical` carries the atlas's identity: a display `name`, a stable `slug`, an optional `description`, optional `aliases`, and `localized` entries. Each localised entry is a `lang` tag with the `name` in that language, and optionally its own `description` and `aliases`.

`metadata` follows the shared definition from RFC-001 — timestamps, status and source. An atlas is versioned reference data like any other entity, and a consumer that has cached one needs to know when it changed.

```json fds:fragment entity=body-atlas
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

Each view carries an `id`, a `kind` naming which aspect of the body it shows, and an `asset` — an object of `type` and `uri` pointing at the image. The type is stated rather than inferred from the URI extension, because a consumer that cannot render the format needs to know before fetching it.

Views are the reason the atlas exists as a separate entity: the same muscle appears in several of them, at different coordinates, and binding a muscle to one image would make the atlas unusable for any other.

```json fds:fragment entity=body-atlas
{
  "views": [
    { "id": "anterior", "kind": "anterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/anterior.svg" } },
    { "id": "posterior", "kind": "posterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/posterior.svg" } }
  ]
}
```

#### Licence and attribution

From schema version 1.1.0 an asset MAY carry two optional strings, `license` and `attribution`. They state the terms of the artwork at `uri`. Every other place FDS points at a picture already does this: media items carry the same two fields. Without them, an atlas could not say on what terms its own drawings may be used.

`license` names the terms under which the asset may be used.

- A producer SHOULD use an SPDX identifier or SPDX licence expression where one applies, such as `Apache-2.0`, `CC-BY-4.0` or `Apache-2.0 OR MIT`. Where none applies, a producer MAY use free text.
- **Absence means unstated, not public domain.** A consumer MUST NOT treat a missing `license` as permission to use, modify or redistribute the asset. This is the meaning RFC-008 §4.8 gives `authorship.license`.
- `license` describes the asset, not the atlas document. The area names, ids and bindings are a different work and can have a different owner.
- Each view states its own terms, because views can come from different sources.

`attribution` is the credit text the asset's terms ask a recipient to show. A producer SHOULD set it when the licence requires credit, as Apache-2.0 and every CC-BY licence do. It does not replace a licence's own notice duties: Apache-2.0 §4(d), for example, requires a redistributor to carry the contents of the work's NOTICE file. `attribution` helps a recipient find that duty but does not fulfil it.

Neither field has an enum or a pattern. The SPDX list grows, a pattern would reject expressions and legitimate free-text terms, and tightening a field later is a breaking change.

```json fds:fragment entity=body-atlas
{
  "views": [
    {
      "id": "anterior",
      "kind": "anterior",
      "asset": {
        "type": "svg",
        "uri": "https://assets.vitness.me/body-atlas/v1.1.0/anterior.svg",
        "license": "Apache-2.0",
        "attribution": "Body Muscles, Copyright 2024 Ivan Vulović"
      }
    }
  ]
}
```

The `v1.1.0` in that URL is the artwork's own release. It is unrelated to the schema version.

In the complete document below, the two views come from different sources. A consumer may redistribute the anterior drawing under CC-BY-4.0 if it shows the credit text. It MUST NOT assume it may redistribute the posterior drawing, whose terms are unstated.

```json fds:document entity=body-atlas
{
  "schemaVersion": "1.1.0",
  "id": "atlas.body.example",
  "canonical": { "name": "Example Body Atlas", "slug": "example-body-atlas" },
  "views": [
    {
      "id": "anterior",
      "kind": "anterior",
      "asset": {
        "type": "svg",
        "uri": "https://cdn.example.com/atlas/anterior.svg",
        "license": "CC-BY-4.0",
        "attribution": "Anterior illustration by Example Studio"
      }
    },
    {
      "id": "posterior",
      "kind": "posterior",
      "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/posterior.svg" }
    }
  ],
  "areas": [
    {
      "id": "thigh.left.anterior",
      "canonical": { "name": "Left Anterior Thigh", "slug": "thigh-left-anterior" },
      "bindings": [ { "viewId": "anterior", "selector": "#area-thigh-left" } ]
    },
    {
      "id": "back.lower.posterior",
      "canonical": { "name": "Lower Back", "slug": "lower-back" },
      "bindings": [ { "viewId": "posterior", "selector": "#area-lower-back" } ]
    }
  ],
  "metadata": {
    "createdAt": "2026-11-14T12:00:00Z",
    "updatedAt": "2026-11-14T12:00:00Z",
    "status": "active"
  }
}
```

### 4.3. Areas

An area is a clickable region. It carries an `id`, its own `canonical` block — areas are named and localised exactly as entities are, because they are what a user sees and taps — and `bindings` that place it in one or more views.

Each binding pairs a `viewId` with a `selector` into that view's asset. An area may bind to several views, which is what lets a single highlight follow a muscle from the front illustration to the back one.

```json fds:fragment entity=body-atlas
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

<!-- fds:pin atlas/v1.0.0/body-atlas.schema.json — the 1.1.0 revision note names the superseded version deliberately, because releases 1.0.0 through 1.4.0 declare body-atlas at 1.0.0 and a client pinned to any of them must keep resolving it. New work uses 1.1.0. -->

**1.1.0** added optional `license` and `attribution` on a view's asset (§4.2), so an atlas can state the terms of its artwork the way media items already do. Both are optional additions to a closed object. Every 1.0.0 document remains valid unchanged, but a 1.1.0 document using either field is rejected by the 1.0.0 schema, which is what makes this a version rather than an edit. `atlas/v1.0.0/body-atlas.schema.json` stays published and frozen. Releases 1.0.0 through 1.4.0 declare body-atlas at 1.0.0 and continue to resolve, and release 1.5.0 is the first to declare it at 1.1.0.

## 6. Implementation Guidance

### 6.1. Referencing from Muscles

Muscles MAY reference atlas areas to express heatmaps (see RFC‑003):
```json fds:fragment entity=muscle
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
- `attribution` is untrusted text displayed next to the artwork. Render it as plain text and escape it; never interpret it as markup.
- A `license` is a claim by the producer, not a verified grant. FDS does not check it.

## 8. JSON Schema Reference
- **Body Atlas**: `/specification/schemas/atlas/v1.1.0/body-atlas.schema.json`

## 8.1. Validation

Validate with Ajv (Draft 2020‑12):
```
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/atlas/v1.1.0/body-atlas.schema.json \
  -d specification/schemas/atlas/v1.1.0/body-atlas.example.json
```

## 9. Example

See `/specification/schemas/atlas/v1.1.0/body-atlas.example.json`.

## Conformance

**Conforming Producers:**

:::danger MUST
- **MUST** emit JSON that validates against the Body Atlas schema for the declared `schemaVersion`.
- **MUST** provide stable `views[*].id` and `areas[*].id`.
:::

:::tip SHOULD
- **SHOULD** prefer SVG assets and stable selectors.
- **SHOULD** state `license` on every view whose asset terms are known, and `attribution` where those terms require credit.
:::

**Conforming Consumers:**

:::danger MUST
- **MUST** validate incoming atlas data.
- **MUST** resolve `viewId` and `selector` pairs per area binding.
- **MUST NOT** treat an absent `license` as permission to use, modify or redistribute the asset.
:::

:::tip SHOULD
- **SHOULD** ignore unknown optional fields under `attributes` and `extensions`.
- **SHOULD** preserve `license` and `attribution` unchanged through any transformation that carries a view forward, and show or pass on `attribution` wherever they display or redistribute the asset.
:::

**Compatibility:**

:::danger MUST
- Optional additions (new areas/views) **MUST NOT** break consumers.
- Removing/renaming areas is breaking and requires a **MAJOR** version.
:::

## 10. References
- [RFC‑003: Muscle Data Model Specification](./rfc-003-muscle-data-model.md)
- [RFC‑008: Training Program Data Model Specification](./rfc-008-program-data-model.md), §4.8 `authorship`
- SPDX License List — https://spdx.org/licenses/

---

Copyright Notice  
Copyright (c) 2025 VITNESS.
This document is subject to the rights, licenses and restrictions contained in the VITNESS Open Standards License Agreement. See `/specification/VITNESS Open Standards License Agreement.md`.
