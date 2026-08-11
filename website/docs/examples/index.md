---
title: Examples
description: Example data and implementation guides for FDS
sidebar_position: 1
---

# FDS Examples

This section provides example data and implementation guides for the Fitness Data Standard.

## Registries

Two different kinds of file are published under `/registries/`, and telling them apart matters.

### Vocabulary registries — normative

These define the recommended values for an open classifier. Several FDS fields are deliberately open strings rather than enums, and these registries are what stops "open" meaning "undefined".

- **Exercise type**: [`exercise-type.registry.json`](https://spec.vitness.me/registries/exercise-type.registry.json)
- **Workout type**: [`workout-type.registry.json`](https://spec.vitness.me/registries/workout-type.registry.json)
- **Block role**: [`block-role.registry.json`](https://spec.vitness.me/registries/block-role.registry.json)
- **Intensity zone**: [`intensity-zone.registry.json`](https://spec.vitness.me/registries/intensity-zone.registry.json)

Open means open: a producer emitting a value that is not listed has still produced a valid document, and a consumer encountering one **MUST NOT** reject it.

### Entity catalog examples — illustrative

These show the shape a provider serves — an array of entity documents, each carrying its own `schemaVersion`. They are not normative, and nothing in FDS requires these particular entries.

- **Equipment**: [`equipment.registry.example.json`](https://spec.vitness.me/registries/equipment.registry.example.json)
- **Muscles**: [`muscles.registry.example.json`](https://spec.vitness.me/registries/muscles.registry.example.json)
- **Muscle Categories**: [`muscle-categories.registry.example.json`](https://spec.vitness.me/registries/muscle-categories.registry.example.json)

The `.example.` in the filename is the distinction — a file named `*.registry.json` is the registry, a file named `*.registry.example.json` is an example of one. See the [registry README](https://spec.vitness.me/registries/README.md) for the full rules.

## Example Entities

136 example documents are published, each served from the same versioned path as the schema it demonstrates. Every one is validated in CI, so an example that stops matching its schema fails the build.

### Exercise Examples (8)
- Basic exercise definition
- Cardio exercise
- Conditioning exercise
- Mobility/flexibility exercise
- Machine-based exercise
- Unilateral exercise
- Assisted exercise
- Velocity-based exercise

### Equipment Examples (2)
- Basic equipment definition (a barbell)
- Stack-loaded equipment, where load is selected in fixed increments

### Muscle Examples (2)
- A muscle with heatmap regions and a localized name
- A second muscle carrying localized aliases alongside its regions

### Muscle Category Examples (1)
- A top-level category with localized descriptions and classification tags

### Body Atlas Examples (1)
- An atlas with anterior and posterior views, and named areas bound to selectors within them

### Prescription Examples (58)
Fragments rather than whole documents — one for every discriminator the RFC-006 definition library defines: load targets, rep targets, tempo, rest, intensity zones, set schemes and progression rules. A further 15 negative fixtures pin down what the schema still refuses. Indexed in [the fixture README](https://spec.vitness.me/schemas/prescription/v1.0.0/README.md).

### Workout Examples (46)
Complete, validating sessions — one for every set and rep scheme in the coverage matrix, one for every grouping structure from a single exercise to a chipper, and one for every cardio and endurance scenario. Indexed in [the fixture README](https://spec.vitness.me/schemas/workout/v1.1.0/README.md).

### Program Examples (18)
Complete, validating programs covering the periodization and scheduling models in RFC-008 — linear, undulating, block, conjugate, percentage waves, deloads, conditional branching and more. Not one of them contains a set, a rep or a load: a program is a schedule of workout references, and the prescription lives in the sessions it points at. Indexed in [the fixture README](https://spec.vitness.me/schemas/program/v1.0.0/README.md).

## Implementation Patterns

For implementation guidance and data migration workflows, see:
- [Specifications](/docs/specifications/rfc-001-exercise-data-model) - Full RFC documentation
- [Schemas](/docs/schemas) - Interactive schema viewers
- [Quick Validation](/docs/getting-started/quick-validation) - Validation guide
