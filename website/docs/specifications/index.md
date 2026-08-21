---
title: Specifications (RFCs)
description: Every FDS RFC — the normative documents the published schemas implement
---

# FDS Specifications

The standard is specified in RFCs, one per data model. An RFC is the normative
document: it says what the entity means, what its fields are for, and what a
conforming document must satisfy — the published JSON Schema is that
specification made machine-checkable.

The pages in this section are byte-for-byte copies of the sources in the
repository's `specification/rfc/` directory. CI compares every page against
its source on every change, so what you read here is what the standard says.

<!-- fds:count rfcs=9 -->
Nine RFCs are published:

<!-- fds:covers rfcs -->
| RFC | Specifies |
|---|---|
| [RFC-001 — Exercise data model](/docs/specifications/rfc-001-exercise-data-model) | The exercise entity: identity, classification, muscle targets and metrics. |
| [RFC-002 — Equipment data model](/docs/specifications/rfc-002-equipment-data-model) | The equipment entity: what a machine or implement is, in terms another system can act on. |
| [RFC-003 — Muscle data model](/docs/specifications/rfc-003-muscle-data-model) | The muscle entity: the anatomy vocabulary exercises target. |
| [RFC-004 — Muscle category data model](/docs/specifications/rfc-004-muscle-category-data-model) | The muscle category entity: the groupings muscles roll up into. |
| [RFC-005 — Body atlas data model](/docs/specifications/rfc-005-body-atlas-data-model) | The body atlas entity: named regions any renderer can draw its own way. |
| [RFC-006 — Prescription primitives](/docs/specifications/rfc-006-prescription-primitives) | The prescription definition library: load, reps, rest and tempo as reusable pieces. Its schema root validates nothing by design. |
| [RFC-007 — Workout data model](/docs/specifications/rfc-007-workout-data-model) | The workout entity: how a training session is structured. |
| [RFC-008 — Training program data model](/docs/specifications/rfc-008-program-data-model) | The program entity: multi-week plans that point at sessions rather than restating them. |
| [RFC-010 — Entity reference integrity](/docs/specifications/rfc-010-entity-reference-integrity) | The references entities carry to one another, and the rule that a denormalised copy accepts exactly what the field it copies accepts. |

Each RFC names the schema version that implements it. For which entity
versions the current release publishes, see the
[JSON Schemas overview](/docs/schemas/) — and note that entities version
independently: a release names a *set* of entity versions, not one version
they all share.
