---
title: Changelog
description: FDS version history and changes
sidebar_position: 3
---

# Fitness Data Standard — Changelog

All notable changes to the FDS RFCs and schemas are documented here.

The format is inspired by Keep a Changelog, and the project adheres to Semantic Versioning for spec releases.

## [Unreleased]
- Extension namespace policy (draft) and conformance sections (planned).
- **RFC-010 Entity Reference Integrity (Draft).** The five shared entity
  references accept values the entities they copy do not: a reference `name`
  may be the empty string and a reference `slug` is checked against nothing,
  so a document whose every reference is blank validates and cannot be
  rendered. RFC-010 states the rule — a denormalised copy accepts exactly what
  the field it copies accepts — and says why encoding it rejects documents that
  validate today and therefore lands in a major release. No schema changed and
  no release was cut. `check:refs` compares each reference against its source
  and records the divergences that exist, so a sixth reference cannot be added
  by copying a fifth, which is how two of them became five.

## Tooling — the mapping schema is frozen (2026-08-11)

No entity schema changed, no release was added, and the current release is where
it was. Recorded here because one entry changes what the standard promises about
a published URL, and that is a governance fact rather than a packaging one.

### Changed
- **The mapping schema at 1.1.0 is frozen.** It was published deliberately
  unfrozen, because freezing bytes at a permanent URL is the one act here that
  cannot be taken back, and it has now been served long enough to be named by
  `$schema` in configuration files this project does not own. Its bytes will not
  change again: a change means a new version directory beside it. The 1.0.0
  mapping schema stays published and stays frozen, as it has since it was
  superseded.

  A mapping schema is `kind: tooling` in the release manifest — it configures a
  tool and no release names it — so freezing it is a decision about that URL
  alone.

- The reference tooling is released as **0.2.0**, both packages. Neither is part
  of a spec release, but the transformer is how most consumers first meet the
  standard, so three of its changes are worth knowing about from here: it now
  resolves every published release offline rather than only the oldest, it
  defaults to the current release rather than to 1.0.0, and `validate --version`
  validates instead of matching the program's own flag, printing a package
  version and exiting successfully without reading the input. The skill package
  documents every entity and library the current release names, which is gated
  on each run.

## Schema release — workout 1.1.0 (2026-08-10)

### Added
- `settings[]` on a workout item and on a single set — machine and environment
  settings the session prescribes, as a metric shape from RFC-001 with a value
  attached. A treadmill incline and a bike cadence had no home before this;
  `incline`, `cadence` and `resistanceLevel` were in the metric vocabulary with
  nowhere to attach a value.
- `zone` on a set. Load, repetitions, tempo and rest were always statable per
  set and intensity was not, so a session whose intensity climbed set by set had
  to be split into one item per step. That was an asymmetry, not a decision.
- `workout.machine-settings.example.json`, and ten cardio and endurance sessions
  completing §4.4 of the coverage matrix.

### Changed
- The transformer bundles release **1.4.0**, which serves workout at 1.1.0.
  1.0.0 through 1.3.0 remain bundled.
- `check:scenarios` now enforces all seven answerable sections of the coverage
  matrix — **87 rows**, up from 54.

### Compatibility
- Purely additive. Every 1.0.0 workout document validates against 1.1.0
  unchanged; a 1.1.0 document using either addition is rejected by the 1.0.0
  schema, which is what makes this a version rather than an edit.
- **`workout/v1.0.0/` stays published and frozen.** Transformer releases 1.2.0
  and 1.3.0 declare workout at 1.0.0, and a frozen URL that disappears is worse
  than one that changes.

## Schema release — program 1.0.0 (2026-08-10)

### Added
- `program/v1.0.0` — RFC-008 training program. A schedule of workout references
  over time: cycles, weeks, day placement, per-occurrence overrides, progression
  rules and conditional branching. A program does not contain workouts; it
  points at them, so a session shared by four programs is authored once and
  fixed once.
- `references.trainingMaxes[]` — declares which lifts a program is computed from
  and how the caller derives each number. It never carries the number, and
  RFC-008 §8.1 states as normative text that an implementation MUST NOT add one.
- 18 worked program examples, one per row of §4.6 periodization and §4.7
  scheduling in the coverage matrix.
- Four registries under `specification/registries/`: exercise type, workout
  type, block role and intensity zone. `exerciseType` carries no `enum` and no
  `examples`, so its registry is the only place that vocabulary is written down.
- Website pages for the workout, program and prescription schemas. All three had
  been published at frozen URLs the documentation never mentioned.

### Changed
- The transformer bundles release **1.3.0**, which adds program. 1.0.0 through
  1.2.0 remain bundled for consumers pinned to them.
- `discovery.md` covers all seven entities and adds `entity_versions`. A release
  names a *set* of entity versions, so a client that expands a release into a
  path segment requests URLs that were never published.
- A remote schema fetch that answers 200 with something other than a schema now
  fails with a message naming the content type and the URL. Previously the parse
  error was swallowed and the transformer fell back to bundled schemas silently,
  which is indistinguishable from being offline.

### Fixed
- The published metrics guide page had not been rebuilt after the metric
  vocabulary was extended, so the website documented types the standard had
  moved past.
- A training-max slot is matched by its `exercise`, not by its `id`. The schema
  had described the wrong key.

### Compatibility
- Purely additive. No existing schema changed; every published example validates
  unchanged. Every published schema is now frozen.

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
