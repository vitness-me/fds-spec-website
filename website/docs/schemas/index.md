---
title: JSON Schemas
description: Every published FDS schema, at the version it is published under
sidebar_position: 1
---

# FDS JSON Schemas

FDS is defined in JSON Schema (Draft 2020-12). Every schema below is published at a frozen URL: the bytes at a version URL never change, and a change ships at a new one.

<!-- fds:count schemas=11 entities=7 libraries=1 tooling=1 superseded=2 -->
Eleven schemas are published. Seven are entities, one is a definition library, one configures a tool, and two are superseded versions that are still served.

## Entity versions are not uniform

A release names a *set* of entity versions rather than one version they all share. The current release is **1.4.0**, and it publishes:

| Entity | Version | Schema URL |
|---|---|---|
| [Exercise](/docs/schemas/exercise) | 1.1.0 | `/schemas/exercises/v1.1.0/exercise.schema.json` |
| [Equipment](/docs/schemas/equipment) | 1.1.0 | `/schemas/equipment/v1.1.0/equipment.schema.json` |
| [Muscle](/docs/schemas/muscle) | 1.0.0 | `/schemas/muscle/v1.0.0/muscle.schema.json` |
| [Muscle Category](/docs/schemas/muscle-category) | 1.0.0 | `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json` |
| [Body Atlas](/docs/schemas/body-atlas) | 1.0.0 | `/schemas/atlas/v1.0.0/body-atlas.schema.json` |
| [Workout](/docs/schemas/workout) | 1.1.0 | `/schemas/workout/v1.1.0/workout.schema.json` |
| [Program](/docs/schemas/program) | 1.0.0 | `/schemas/program/v1.0.0/program.schema.json` |

There is no `muscle/v1.4.0/`, and there will not be unless muscle itself changes. Build schema URLs from the entity version, never from the release — see the [discovery endpoint](/docs/core-concepts/discovery) for how a provider advertises which entity version it serves.

## The entities

### [Exercise Schema](/docs/schemas/exercise) — v1.1.0
The core exercise data model with classification, targets, equipment, metrics and media.

**Schema:** `/schemas/exercises/v1.1.0/exercise.schema.json`

### [Equipment Schema](/docs/schemas/equipment) — v1.1.0
Fitness equipment definitions with classification, loading characteristics and metadata.

**Schema:** `/schemas/equipment/v1.1.0/equipment.schema.json`

### [Muscle Schema](/docs/schemas/muscle) — v1.0.0
Anatomical muscle definitions with heatmap visualization support.

**Schema:** `/schemas/muscle/v1.0.0/muscle.schema.json`

### [Muscle Category Schema](/docs/schemas/muscle-category) — v1.0.0
Muscle grouping and categorization structure.

**Schema:** `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`

### [Body Atlas Schema](/docs/schemas/body-atlas) — v1.0.0
Body visualization structure with views and areas.

**Schema:** `/schemas/atlas/v1.0.0/body-atlas.schema.json`

### [Workout Schema](/docs/schemas/workout) — v1.1.0
One prescribed session: blocks of items, an execution mode per block, and a prescription per set. 1.1.0 added per-set intensity zones and machine settings (RFC-007 §6).

**Schema:** `/schemas/workout/v1.1.0/workout.schema.json`

### [Program Schema](/docs/schemas/program) — v1.0.0
A schedule of workout references over time: cycles, weeks, day placement, progression and branching.

**Schema:** `/schemas/program/v1.0.0/program.schema.json`

## Definition libraries

### [Prescription Primitives](/docs/schemas/prescription) — v1.0.0
Load, repetitions, tempo, rest, intensity zones, set schemes and progression rules — the definitions workouts and programs compose.

**Schema:** `/schemas/prescription/v1.0.0/prescription.schema.json`

This one is **not an entity**, and a provider does not export it. Its root validates nothing by construction: there is no prescription document to hold, only definitions that other schemas use. You validate against a definition inside it — `…/prescription.schema.json#/$defs/loadTarget` — never against the root. A provider that supports workouts already supports prescription; that is what supporting workouts means.

## Tooling schemas

### Transformer Mapping — v1.1.0
Configuration for the FDS Transformer: how source fields map onto an FDS entity. It describes a tool's input rather than an entity, so it is documented with the tool. It belongs to no release — a release names entities and the libraries they compose, and this configures a tool.

**Schema:** `/schemas/transformer/v1.1.0/mapping.schema.json` — see [Transformer configuration](/docs/tools/transformer/configuration).

## Superseded, still served

<!-- fds:pin workout/v1.0.0/workout.schema.json — listed on purpose: releases 1.2.0 and 1.3.0 declare workout at 1.0.0, so a client pinned to either must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin transformer/v1.0.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.1.0 names, and an editor resolving it must keep getting a document. -->

### Transformer Mapping — v1.0.0

**Schema:** `/schemas/transformer/v1.0.0/mapping.schema.json`

Superseded by mapping 1.1.0, which added the enrichment and evaluation keys the transformer had grown past it. Every 1.0.0 configuration is still valid under 1.1.0 — the additions are optional. It stays served because it is what a configuration written against it names in its own `$schema`, and no FDS release governs a tooling schema, so nothing else would ever say when it may go.

### Workout — v1.0.0

**Schema:** `/schemas/workout/v1.0.0/workout.schema.json`

Superseded by workout 1.1.0. It stays published and stays frozen, because releases 1.2.0 and 1.3.0 declare workout at 1.0.0 and a client pinned to either must keep resolving. Withdrawing it would break those clients, which is exactly what freezing a URL promises not to do.

Do not build against it. New work should use workout 1.1.0; 1.0.0 documents remain valid under it unchanged, since 1.1.0 only added optional fields.

Worked examples live alongside the current version, at `/schemas/workout/v1.1.0/`.

## Validation

See the [Quick Validation Guide](/docs/getting-started/quick-validation) for instructions on validating your data against these schemas.

## Schema Locations

All schemas are served from: `https://spec.vitness.me/schemas/`
