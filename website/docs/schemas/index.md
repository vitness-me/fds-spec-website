---
title: JSON Schemas
description: Every published FDS schema, at the version it is published under
sidebar_position: 1
---

# FDS JSON Schemas

FDS is defined in JSON Schema (Draft 2020-12). Every schema below is published at a frozen URL: the bytes at a version URL never change, and a change ships at a new one.

<!-- fds:count schemas=23 entities=7 libraries=1 tooling=2 superseded=13 -->
Twenty-three schemas are published. Seven are entities, one is a definition library, two belong to a tool, and thirteen are superseded versions that are still served.

## Entity versions are not uniform

A release names a *set* of entity versions rather than one version they all share. The current release is **1.6.0**, and it publishes:

| Entity | Version | Schema URL |
|---|---|---|
| [Exercise](/docs/schemas/exercise) | 1.2.0 | `/schemas/exercises/v1.2.0/exercise.schema.json` |
| [Equipment](/docs/schemas/equipment) | 1.2.0 | `/schemas/equipment/v1.2.0/equipment.schema.json` |
| [Muscle](/docs/schemas/muscle) | 1.1.0 | `/schemas/muscle/v1.1.0/muscle.schema.json` |
| [Muscle Category](/docs/schemas/muscle-category) | 1.1.0 | `/schemas/muscle/muscle-category/v1.1.0/muscle-category.schema.json` |
| [Body Atlas](/docs/schemas/body-atlas) | 1.1.0 | `/schemas/atlas/v1.1.0/body-atlas.schema.json` |
| [Workout](/docs/schemas/workout) | 1.2.0 | `/schemas/workout/v1.2.0/workout.schema.json` |
| [Program](/docs/schemas/program) | 1.1.0 | `/schemas/program/v1.1.0/program.schema.json` |

There is no `muscle/v1.6.0/`, and there will not be unless muscle itself changes. Build schema URLs from the entity version, never from the release — see the [discovery endpoint](/docs/core-concepts/discovery) for how a provider advertises which entity version it serves.

## The entities

### [Exercise Schema](/docs/schemas/exercise) — v1.2.0
The core exercise data model with classification, targets, equipment, metrics and media. 1.2.0 added the optional [structural keys](/docs/core-concepts/structural-keys): `fxi` on the exercise, `fxm` and `fxmg` on its muscle references, `fxe` on its equipment references.

**Schema:** `/schemas/exercises/v1.2.0/exercise.schema.json`

### [Equipment Schema](/docs/schemas/equipment) — v1.2.0
Fitness equipment definitions with classification, loading characteristics and metadata. 1.2.0 added the optional structural key `fxe`.

**Schema:** `/schemas/equipment/v1.2.0/equipment.schema.json`

### [Muscle Schema](/docs/schemas/muscle) — v1.1.0
Anatomical muscle definitions with heatmap visualization support. 1.1.0 added the optional structural key `fxm`.

**Schema:** `/schemas/muscle/v1.1.0/muscle.schema.json`

### [Muscle Category Schema](/docs/schemas/muscle-category) — v1.1.0
Muscle grouping and categorization structure. 1.1.0 added the optional structural key `fxmg`.

**Schema:** `/schemas/muscle/muscle-category/v1.1.0/muscle-category.schema.json`

### [Body Atlas Schema](/docs/schemas/body-atlas) — v1.1.0
Body visualization structure with views and areas. 1.1.0 added an optional licence and attribution on each view's asset (RFC-005 §5).

**Schema:** `/schemas/atlas/v1.1.0/body-atlas.schema.json`

### [Workout Schema](/docs/schemas/workout) — v1.2.0
One prescribed session: blocks of items, an execution mode per block, and a prescription per set. 1.1.0 added per-set intensity zones and machine settings (RFC-007 §6). 1.2.0 lets its exercise, muscle and equipment references carry their structural keys.

**Schema:** `/schemas/workout/v1.2.0/workout.schema.json`

### [Program Schema](/docs/schemas/program) — v1.1.0
A schedule of workout references over time: cycles, weeks, day placement, progression and branching. 1.1.0 lets a training-max slot's exercise reference carry its `fxi`.

**Schema:** `/schemas/program/v1.1.0/program.schema.json`

## Definition libraries

### [Prescription Primitives](/docs/schemas/prescription) — v1.1.0
Load, repetitions, tempo, rest, intensity zones, set schemes and progression rules — the definitions workouts and programs compose. 1.1.0 lets the equipment reference in a band-resistance load carry its `fxe`.

**Schema:** `/schemas/prescription/v1.1.0/prescription.schema.json`

This one is **not an entity**, and a provider does not export it. Its root validates nothing by construction: there is no prescription document to hold, only definitions that other schemas use. You validate against a definition inside it — `…/prescription.schema.json#/$defs/loadTarget` — never against the root. A provider that supports workouts already supports prescription; that is what supporting workouts means.

## Tooling schemas

### Transformer Mapping — v1.3.0
Configuration for the FDS Transformer: how source fields map onto an FDS entity. It describes a tool's input rather than an entity, so it is documented with the tool. It belongs to no release — a release names entities and the libraries they compose, and this configures a tool.

**Schema:** `/schemas/transformer/v1.3.0/mapping.schema.json` — see [Transformer configuration](/docs/tools/transformer/configuration).

1.3.0 added the `claude-code` enrichment provider and its `enrichment.claudeCode` settings.

### Transformer Provenance Sidecar — v1.1.0
Describes `provenance.sidecar.json`, the file the FDS Transformer writes beside its output: for each document, where every written field came from (the source path, a mapping default, a transform, or a model with its prompt version and confidence). It is a tool's output, not exported data, and like the mapping schema it belongs to no release.

**Schema:** `/schemas/transformer/provenance/v1.1.0/provenance.schema.json`

1.1.0 requires `provider` on a model's entry: the enrichment provider that made the call.

## Superseded, still served

<!-- fds:pin workout/v1.0.0/workout.schema.json — listed on purpose: releases 1.2.0 and 1.3.0 declare workout at 1.0.0, so a client pinned to either must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin atlas/v1.0.0/body-atlas.schema.json — listed on purpose: releases 1.0.0 through 1.4.0 declare body-atlas at 1.0.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin exercises/v1.1.0/exercise.schema.json — listed on purpose: releases 1.1.0 through 1.5.0 declare exercise at 1.1.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin equipment/v1.1.0/equipment.schema.json — listed on purpose: releases 1.1.0 through 1.5.0 declare equipment at 1.1.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin muscle/v1.0.0/muscle.schema.json — listed on purpose: releases 1.0.0 through 1.5.0 declare muscle at 1.0.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin muscle/muscle-category/v1.0.0/muscle-category.schema.json — listed on purpose: releases 1.0.0 through 1.5.0 declare muscle-category at 1.0.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin prescription/v1.0.0/prescription.schema.json — listed on purpose: releases 1.2.0 through 1.5.0 declare prescription at 1.0.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin workout/v1.1.0/workout.schema.json — listed on purpose: releases 1.4.0 and 1.5.0 declare workout at 1.1.0, so a client pinned to either must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin program/v1.0.0/program.schema.json — listed on purpose: releases 1.3.0 through 1.5.0 declare program at 1.0.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin transformer/v1.0.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.1.0 names, and an editor resolving it must keep getting a document. -->
<!-- fds:pin transformer/v1.1.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.2.0 names, and an editor resolving it must keep getting a document. -->
<!-- fds:pin transformer/v1.2.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.3.0 names, and an editor resolving it must keep getting a document. -->
<!-- fds:pin transformer/provenance/v1.0.0/provenance.schema.json — listed on purpose: it is the `$schema` every sidecar written before 1.1.0 names, and such a sidecar must keep validating against it. -->

### Before the structural keys

| Schema | Version | Superseded by | Named by releases |
|---|---|---|---|
| `/schemas/exercises/v1.1.0/exercise.schema.json` | 1.1.0 | 1.2.0 | 1.1.0 through 1.5.0 |
| `/schemas/equipment/v1.1.0/equipment.schema.json` | 1.1.0 | 1.2.0 | 1.1.0 through 1.5.0 |
| `/schemas/muscle/v1.0.0/muscle.schema.json` | 1.0.0 | 1.1.0 | 1.0.0 through 1.5.0 |
| `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json` | 1.0.0 | 1.1.0 | 1.0.0 through 1.5.0 |
| `/schemas/prescription/v1.0.0/prescription.schema.json` | 1.0.0 | 1.1.0 | 1.2.0 through 1.5.0 |
| `/schemas/workout/v1.1.0/workout.schema.json` | 1.1.0 | 1.2.0 | 1.4.0 and 1.5.0 |
| `/schemas/program/v1.0.0/program.schema.json` | 1.0.0 | 1.1.0 | 1.3.0 through 1.5.0 |

Release 1.6.0 superseded these seven by adding the optional structural keys. Each stays published and frozen, because a client pinned to a release that names it must keep resolving. Do not build against them: every document valid under one of them is valid under its successor, since the keys are optional. Worked examples live beside the current versions.

### Transformer Mapping — v1.2.0

**Schema:** `/schemas/transformer/v1.2.0/mapping.schema.json`

Superseded by mapping 1.3.0, which added the `claude-code` provider and `enrichment.claudeCode`. Every 1.2.0 configuration is still valid under 1.3.0 — the additions are optional. It stays served because it is what a configuration written against it names in its own `$schema`.

### Transformer Provenance Sidecar — v1.0.0

**Schema:** `/schemas/transformer/provenance/v1.0.0/provenance.schema.json`

Superseded by provenance 1.1.0, which requires `provider` on a model's entry, so a 1.0.0 sidecar with model entries does not validate under 1.1.0. It stays served because a sidecar written before 1.1.0 names it as its `$schema` and still validates against it.

### Transformer Mapping — v1.1.0

**Schema:** `/schemas/transformer/v1.1.0/mapping.schema.json`

Superseded by mapping 1.2.0, which added `validation.rejectDefaults`. Every 1.1.0 configuration is still valid under 1.2.0 — the addition is optional. It stays served because it is what a configuration written against it names in its own `$schema`.

### Transformer Mapping — v1.0.0

**Schema:** `/schemas/transformer/v1.0.0/mapping.schema.json`

Superseded by mapping 1.1.0, which added the enrichment and evaluation keys the transformer had grown past it. Every 1.0.0 configuration is still valid under 1.1.0 — the additions are optional. It stays served because it is what a configuration written against it names in its own `$schema`, and no FDS release governs a tooling schema, so nothing else would ever say when it may go.

### Workout — v1.0.0

**Schema:** `/schemas/workout/v1.0.0/workout.schema.json`

Superseded by workout 1.1.0. It stays published and stays frozen, because releases 1.2.0 and 1.3.0 declare workout at 1.0.0 and a client pinned to either must keep resolving. Withdrawing it would break those clients, which is exactly what freezing a URL promises not to do.

Do not build against it. New work should use workout 1.2.0; 1.0.0 documents remain valid under it unchanged, since 1.1.0 and 1.2.0 only added optional fields.

Worked examples live alongside the current version, at `/schemas/workout/v1.2.0/`.

### Body Atlas — v1.0.0

**Schema:** `/schemas/atlas/v1.0.0/body-atlas.schema.json`

Superseded by body-atlas 1.1.0. It stays published and stays frozen, because releases 1.0.0 through 1.4.0 declare body-atlas at 1.0.0 and a client pinned to any of them must keep resolving.

Do not build against it. New work should use body-atlas 1.1.0; 1.0.0 documents remain valid under it unchanged, since 1.1.0 only added optional fields.

The example lives alongside the current version, at `/schemas/atlas/v1.1.0/`.

## Validation

See the [Quick Validation Guide](/docs/getting-started/quick-validation) for instructions on validating your data against these schemas.

## Schema Locations

All schemas are served from: `https://spec.vitness.me/schemas/`
