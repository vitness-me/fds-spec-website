---
title: Changelog
description: FDS version history and changes
sidebar_position: 3
---

All notable changes to the FDS RFCs and schemas are documented here.

The format is inspired by Keep a Changelog, and the project adheres to Semantic Versioning for spec releases.

## [Unreleased]
- Governance, contribution guide, and repository README improvements.
- Extension namespace policy (draft) and conformance sections (planned).

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
