---
title: Overview
description: Complete overview of the Fitness Data Standard (FDS)
sidebar_position: 1
---

# FDS Overview

The Fitness Data Standard (FDS) defines an open, interoperable format for exchanging fitness domain data across applications and platforms.

## Purpose & Scope

Enable data portability and interoperability across fitness applications by providing:

- Normative JSON Schemas for core fitness entities
- High-quality RFCs with examples and implementation guidance  
- Flexible platform taxonomies via well-defined extension points

### Current Scope

<!-- fds:count rfcs=9 -->
**In scope** — nine published RFCs:

- **Exercise data model** (RFC-001)
- **Catalog entities**: Equipment (RFC-002), Muscles (RFC-003), Muscle Categories (RFC-004), Body Atlas (RFC-005)
- **Prescription primitives** (RFC-006) — load, repetitions, tempo, rest, intensity zones, set schemes and progression rules, defined once so a set means the same thing wherever it appears
- **Workout data model** (RFC-007) — one prescribed session, as blocks of items with an execution mode per block
- **Training program data model** (RFC-008) — a schedule of workout references over time, with cycles, weeks, progression and conditional branching
- **Entity reference integrity** (RFC-010) — what the references entities carry to one another must contain, so a document stays readable without resolving them

**Out of scope** — by decision, not by omission:

- **Personal data**: athlete identity, bodyweight, one-rep maxes, and what was actually performed
- **Authentication and authorization**: FDS is a data format, not a protocol
- **Generated exercise selection**: a program day references a workout that exists, so a plan can be read without the generator that produced it

Carrying no personal values is what makes everything else portable. A catalog, a session or a plan can be published, cached, mirrored and diffed freely precisely because none of them describes a person — and that property is worth more than the convenience of putting a bodyweight in a document. Recording performed results therefore waits on a consent and privacy model rather than on schema design.

See the [roadmap](/docs/governance/roadmap) for what each exclusion costs and what is under consideration.

## Versioning & Compatibility

FDS follows Semantic Versioning for data model releases:

- **Major (X.0.0)**: Breaking changes to required fields or semantics
- **Minor (0.Y.0)**: Backward-compatible additions (optional fields, new enum values, documentation clarifications)
- **Patch (0.0.Z)**: Non-functional changes (typos, editorial, schema metadata)

### Compatibility Rules

- Data valid in X.Y.Z MUST remain valid in X.(Y+1).0
- Adding new required fields constitutes a MAJOR change
- Deprecated fields remain functional throughout the major version
- Producers and consumers SHOULD use `schemaVersion` to route validation and logic

## Conformance

### Conforming Producer

- MUST produce JSON that validates against the FDS JSON Schema for the declared `schemaVersion`
- MUST use UUIDv4 for all identifiers in production data
- MUST populate all required fields and adhere to enumerations and structural constraints
- SHOULD include `schemaVersion` and maintain accurate `metadata` timestamps (RFC 3339, UTC)

### Conforming Consumer

- MUST validate incoming data against the appropriate schema version
- MUST ignore unknown fields under `attributes`/`extensions`
- SHOULD tolerate additional optional fields added in newer minor versions
- SHOULD reject data with missing required fields or invalid enumerations

## Next Steps

- [Understand identifiers](/docs/getting-started/identifiers)
- [Quick validation guide](/docs/getting-started/quick-validation)
- [Browse specifications](/docs/specifications/rfc-001-exercise-data-model)
- [Explore schemas](/docs/schemas/exercise)
