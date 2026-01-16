---
title: Identifiers
description: UUID and identifier policy for FDS
sidebar_position: 3
---

# Identifiers Policy

## Production Identifiers

**Normative policy:**
- All resource identifiers in production data **MUST** be UUIDv4 strings
- This applies to identifiers such as `exerciseId`, equipment/muscle/category `id`, and any cross-entity references

## Documentation Identifiers

**Documentation policy:**
- For readability, examples in RFCs may use illustrative IDs like `eq.barbell`, `mus.quadriceps`, `cat.legs`
- These are **NOT** valid production IDs and are used only to demonstrate relationships and structure

## Conformance

**Conforming Producers:**
- MUST emit UUIDv4 identifiers in real datasets

**Conforming Consumers:**
- MUST validate identifiers according to the active schema version
- SHOULD reject non-UUID identifiers in production contexts

## Slugs vs IDs

- **Slugs** remain human-readable canonical identifiers and are distinct from IDs
- **UUIDs** are used for system-level references and relationships

## External References

**URNs and external references:**
- Relation examples MAY show URNs (e.g., `urn:slug:front-squat`) to illustrate non-ID relationships
- Producers SHOULD prefer UUID references where available
- URNs MAY be used for cross-system loose references when a UUID is unknown
- `externalRefs` SHOULD include a `system` string and an external `id` string
- Systems SHOULD be stable and documented by the producer
