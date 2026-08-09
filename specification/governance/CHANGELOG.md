# Fitness Data Standard — Changelog

All notable changes to the FDS RFCs and schemas are documented here.

The format is inspired by Keep a Changelog, and the project adheres to Semantic Versioning for spec releases.

## [Unreleased]
- Governance, contribution guide, and repository README improvements.
- Extension namespace policy (draft) and conformance sections (planned).

## Schema release — prescription 1.0.0, workout 1.0.0 (2026-08-09)

### Added
- `prescription/v1.0.0` — RFC-006 definition library: `loadTarget` (13 methods),
  `repTarget`, `tempo`, `restSpec`, `intensityZone`, `setScheme`,
  `progressionRule`. Not an entity; its root validates nothing, and RFC-007 and
  RFC-008 compose its definitions.
- `workout/v1.0.0` — RFC-007 prescribed training session. Blocks of items with an
  execution `mode`, so circuits, EMOM, AMRAP, Tabata and interval work need no
  schema of their own.
- `repStyle` on workout items and sets, covering partials and one-and-a-half
  reps — the two scenario-matrix rows nothing else could express.
- 36 worked workout examples, one per row of §4.1 and §4.2 of the coverage
  matrix, and 69 prescription fixtures covering every discriminator value.

### Changed
- The transformer bundles release **1.2.0**, which adds workout. 1.1.0 and 1.0.0
  remain bundled for consumers pinned to them. A release names a *set* of entity
  versions, so gaining an entity is a new set even though no existing entity
  changed.
- CI gained four checks: the metrics guide covers the metric vocabulary, RFCs and
  their schemas agree in both directions, prescription fixtures match the
  definitions they exemplify, and every scenario-matrix row has a worked example.

### Compatibility
- Purely additive. No existing schema changed; every published example validates
  unchanged.

## Schema release — exercise 1.1.0, equipment 1.1.0 (2026-08-06)

Entities version independently. This release moves exercise and equipment
forward; muscle, muscle-category and body-atlas are unchanged and keep their
`v1.0.0` URLs.

### Added
- `exercises/v1.1.0` — optional `loading` block describing how a movement accepts
  external load (`externalLoad`, `assisted`, `asymmetric`).
- `equipment/v1.1.0` — optional `loading` block carrying the implement's smallest
  usable load step (`increment`) and whether load is stack-selected (`stackBased`).
  Increments live on equipment, not exercise: the smallest step is a property of
  the implement.
- Metric vocabulary: `rir`, `percent1RM`, `percentBodyweight`, `velocity`,
  `cadence`, `rounds`, `sets`, `rest`, `incline`, `resistanceLevel`, `oneRepMax`.
- Metric units: `percent`, `rpm`, `spm`, `level`, `ms`.
- Examples: `exercise.example.assisted`, `exercise.example.conditioning`,
  `exercise.example.velocity`, `equipment.example.stack`.

### Changed
- `specification/schemas/.integrity.json` records a sha256 per published schema.
  A frozen entry can no longer change content — publishing a new version is the
  only way to change a released URL.
- The transformer bundles 1.1.0 alongside 1.0.0 and defaults to 1.1.0. Pin
  `--version 1.0.0` to stay on the previous release.

### Compatibility
- Additive only. Every document valid under the previous schemas remains valid;
  all existing examples validate unchanged.
- `exercises/v1.0.0` and `equipment/v1.0.0` are superseded rather than frozen in
  place — they had no external consumers at the time of release.

## [0.1.0] — 2025-09-09 (Draft)
### Added
- RFC‑001 Exercise Data Model (Draft) with schema `exercises/v1.0.0` and example.
- RFC‑002 Equipment Data Model (Draft) with schema `equipment/v1.0.0` and example.
- RFC‑003 Muscle Data Model (Draft) with schema `muscle/v1.0.0` and example.
- RFC‑004 Muscle Category Data Model (Draft) with schema `muscle/muscle-category/v1.0.0` and example.

### Notes
- Identifier policy clarified: UUIDv4 is required in production; examples may use illustrative IDs for readability.
- Versioning and compatibility rules established for producers/consumers.
