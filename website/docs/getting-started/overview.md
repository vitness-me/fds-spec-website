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

**In scope:**
- Exercise data model (RFC-001)
- Registry entities: Equipment (RFC-002), Muscles (RFC-003), Muscle Categories (RFC-004), Body Atlas (RFC-005)

**Out of scope (for now):**
- Workout/programming models
- User progress tracking
- Authentication/Authorization

These will be covered by future RFCs.

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
