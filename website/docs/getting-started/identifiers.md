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

### External Reference Mapping (`externalRefs`)

All FDS entities support an optional `externalRefs` array within the `metadata` object. This enables mapping identifiers across different systems and platforms.

**Schema structure:**
```json
"externalRefs": [
  { "system": "string", "id": "string" }
]
```

**Field requirements:**
- `system` (required): A stable identifier for the external platform or system
- `id` (required): The entity's identifier within that external system

**Use cases:**
- **Data migration**: Map legacy IDs to new FDS UUIDs during import
- **Multi-platform sync**: Track the same entity across different fitness apps
- **Third-party integrations**: Reference entities in external APIs or databases
- **Audit trails**: Maintain links to source systems for data provenance

**Best practices for `system` naming:**
- Use stable, well-documented identifiers
- Consider reverse-DNS notation for uniqueness (e.g., `com.example.app`)
- Keep system names consistent across your dataset
- Document your system identifiers for consumers

**Example:**
```json
{
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-09-03T00:00:00Z",
    "status": "active",
    "externalRefs": [
      { "system": "platform-a", "id": "ex-back-squat-001" },
      { "system": "legacy-system", "id": "squat_barbell_back" }
    ]
  }
}
```

This structure is available on all FDS entities: Exercise, Equipment, Muscle, Muscle Category, and Body Atlas
