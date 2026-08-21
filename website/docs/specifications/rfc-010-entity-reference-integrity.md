---
title: 'RFC-010: Entity Reference Integrity'
description: The shared entity references, and the rule that a denormalised copy accepts exactly what the field it copies accepts
sidebar_position: 10
keywords: [reference, denormalised, muscle reference, equipment reference, slug, conformance, data model, json schema, rfc]
---

# RFC-010: Entity Reference Integrity Specification

**Status**: Draft
**Version**: 0.1.0
**Date**: 2026-08-21
**Authors**: VITNESS Team
**Category**: Standards Track

## Abstract

FDS entities point at one another through denormalised references: a muscle reference, an equipment reference, an exercise reference, a workout reference, a program reference. Five definitions, shared by four published schemas, and specified in no RFC. This document is their normative home.

Its substantive rule is one sentence. **A denormalised copy of a field accepts exactly the values that field accepts.**

Today it does not. An entity's own `canonical.name` must be non-empty and its `canonical.slug` must match `^[a-z0-9-]{2,}$`; the same two fields on a *reference* to that entity accept the empty string, and a document in which every reference is blank validates against the published schema. RFC-007 §3.1 named this failure mode for a different field and named it well: an empty session is not a workout, it is a mistake that validates. A reference with no name is the same mistake, and it is currently legal in every schema that has references.

## 1. Introduction

### 1.1. Background

A reference in FDS is not a pointer. It is a pointer plus a copy of just enough of the target to be useful without following it. RFC-001 §4.3 says why for muscles — the reference is "denormalised so a consumer can render the exercise without resolving the muscle catalog" — and RFC-008 §3.2 states the same bargain for workouts in its sharpest form:

> The denormalised `name` on the reference exists precisely so that a program remains *listable* without resolution, even though it is not *executable* without it.

That is the whole justification for carrying redundant data in an interchange format. FDS accepts a resolvable dependency and pays for it with a copy, and the copy earns its place by making the document listable. A copy that is the empty string collects the cost and delivers none of the benefit: the document is still not executable, and now it is not listable either.

The gap is not confined to `name`. Slug rules in this specification are stated once, without exception, for slugs across FDS entities — lowercase ASCII `[a-z0-9-]`, at least two characters, no leading or trailing hyphen. An entity's own slug is checked against them. A reference's slug is checked against nothing, so `"slug": "Back Squat!!"` and `"slug": ""` both validate. The specification already requires what the schema does not enforce.

### 1.2. How five references came to be unconstrained

This is worth stating plainly, because it decides whether the fix is a correction or a change of mind.

Two references, muscle and equipment, were published in the first release with unconstrained `id`, `slug`, `name` and `aliases`, in the same schema document whose `canonical` block applied `minLength`, `pattern` and `uniqueItems` ten times over. The constraints stop at the boundary of `canonical` and do not resume.

Three more references — exercise, workout, program — were added later, and one of them carries its own provenance in its `description`:

> Denormalised snapshot of an exercise, mirroring muscleRef/equipmentRef.

They mirror the shape, and the shape's laxity came with it. That is how two unconstrained definitions became five.

No RFC, no guide and no release note has ever claimed the looseness as a decision. Where FDS leaves a field deliberately open it says so: the registries guide records that `exerciseType` and its siblings are "deliberately open strings rather than enums (D8)", because an unrecognised type produces a mislabelled exercise rather than an unreadable one. That reasoning does not transfer. An unrecognised muscle name is a muscle name; an empty one is nothing at all.

The reference documentation shipped with the standard showed the same gap from the other side. It told implementers that the body-atlas area slug was *the one exception* to the slug pattern. The five reference slugs were a sixth exception and a far broader one, because they are unconstrained rather than differently constrained. A gate already holds that documentation to naming only fields the standard has, and it passed: naming a real field was never the question, and what a document says *about* a field is a claim of a kind no vocabulary check can see.

### 1.3. Goals

1. Give the shared entity references a normative specification, so a sixth one cannot be added by copying a fifth.
2. State the rule that decides every field on a reference, rather than deciding each field on its merits and arriving somewhere different next time.
3. Close the gap between what this specification already requires of slugs and names and what its schemas enforce.
4. Leave identifier *shape* exactly as open as it is today.
5. Say honestly what encoding the rule costs, and what can be relied on before it is encoded.

### 1.4. Scope

**In scope:** the `name`, `slug` and `aliases` fields of the five shared entity references; the parity between a body-atlas area's canonical and an entity's canonical; the compatibility consequences of encoding either.

**Out of scope:**

- **Identifier shape.** What an `id` may contain is settled elsewhere and is not reopened here. See §3.5.
- **Whitespace-only values.** A name of `" "` is as useless as one of `""`, but rejecting it is a constraint on `canonical` first and on references only in consequence. It is a separate proposal, noted in §7.3.
- **Required strings that are neither names nor slugs.** Discriminators in forward-compatibility branches, `lang` tags, and the identifiers a document uses to reference its own parts are unconstrained too. They are a real class and a different one; §7.2 records the finding without proposing a rule for it.
- Performed data, and anything with a subject (RFC-009, deferred).

## 2. Terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are to be interpreted as described in RFC 2119.

- **Entity reference** — an object that identifies another FDS entity and carries a denormalised copy of part of it. The five are `muscleRef`, `equipmentRef`, `exerciseRef`, `workoutRef` and `programRef`.
- **Denormalised field** — a field on a reference that copies a field of the entity referenced.
- **Source field** — the field on the referenced entity that a denormalised field copies.
- **Resolution** — replacing a reference with the entity it names, by fetching that entity.
- **Listable** — renderable enough to appear in a list of its kind without resolution.

## 3. Normative Requirements

### 3.1. A denormalised field carries the constraints of its source field

**A denormalised field MUST accept exactly the values its source field accepts, and MUST NOT accept more.**

This is the rule the rest of this section applies. It is worth preferring over a list of per-field decisions for three reasons.

It is **self-limiting**. The rule constrains a reference field only where the entity constrains the field it copies. Where the entity is open, the reference stays open — no argument required, and no opportunity to tighten something on the way past.

It **stays true as the standard moves**. If the identifier policy is ever encoded, or a canonical field is loosened, references follow without a second edit and without a second decision. The alternative is two copies of one constraint, which is the defect this rule exists to close, one level up.

It is **mechanically checkable**. A source field and its copy are both in the schemas; comparing them needs no list of what ought to be where.

Applying it to the five references:

| Reference field | Source field | Source constraint | Required on the reference |
|---|---|---|---|
| `name` | entity `canonical.name` | non-empty | non-empty |
| `slug` | entity `canonical.slug` | lowercase ASCII, at least two characters | the same pattern |
| `aliases` | entity `canonical.aliases` | non-empty entries, no duplicates | the same |
| `id` | entity identifier | none | **none — unchanged** |
| `muscleRef.categoryId` | muscle category identifier | none | **none — unchanged** |
| `equipmentRef.abbreviation` | equipment `canonical.abbreviation` | none | **none — unchanged** |

Four of the seven rows change nothing. That is the rule working, not the rule failing.

### 3.2. A reference name is what makes a document listable

**A producer MUST NOT emit a reference whose `name` is the empty string.**

The name on a reference has exactly one job, stated twice in this specification and quoted in §1.1: it lets a consumer show the document without resolving what it points at. A reference that omits it is not permitted — `name` is required on all five. A reference that supplies nothing while satisfying the requirement is worse than one that omits it, because a consumer has no way to tell "no name was carried" from "the name is blank", and will render the blank.

A producer whose catalog does not have the name **MUST NOT** substitute an empty string. It has three honest options: resolve the name before export, omit the reference, or omit the document. Emitting a reference that claims a name and carries none reports a complete document that no consumer can use.

### 3.3. A reference slug is a slug

**A `slug` on a reference MUST satisfy the slug rules this specification already states for slugs.**

The slug rules are written once, for FDS entities, and nothing in them is scoped to `canonical`. A reference slug that ignores them is not a differently-scoped slug; it is an unenforced one. Encoding the existing rule against reference slugs changes what the schema checks and does not change what the standard requires.

What a schema can encode is the character-set and length rule, which is the pattern an entity's own slug already carries. The derivation and hyphen-compression rules bind a producer without being expressible in JSON Schema — exactly as they do for an entity's own slug, and for the same reason.

### 3.4. Absent and empty are not the same thing

`slug` and `aliases` are optional on every reference, and that is correct: a producer that has no slug for a target should not be forced to invent one. But **absent and empty MUST NOT both be legal.** A consumer reading `{"slug": ""}` cannot distinguish "this catalog has no slug for that muscle" from "this catalog has a slug and lost it", and the two call for different behaviour — the first is normal, the second is a data fault worth reporting.

Requiring an optional field to satisfy its source's constraints *when present* preserves the distinction at no cost to a producer that genuinely has nothing to say.

### 3.5. Identifiers stay open, deliberately

**This document does not constrain `id`, and no part of §3.1 narrows it.**

The rule in §3.1 gives a reference identifier exactly the constraints the referenced entity's own identifier carries, and today that is none. An implementation may therefore key references by UUID, by slug, or by any opaque token its catalog uses, exactly as it may today.

That freedom is load-bearing and is recorded here so that a later reading of §3.1 does not mistake it for an oversight of the same kind this document corrects. An interchange format that dictated identifier shape would exclude every catalog whose identifiers predate it, which is most of them. The conformance text in RFC-001 states a UUIDv4 expectation for production data in prose; whether that expectation is current, and whether prose is where it belongs, is a live question and is **not** settled by this document. See §7.1.

### 3.6. A body-atlas area is named as an entity is named

RFC-005 §4.3 states that atlas areas "are named and localised exactly as entities are, because they are what a user sees and taps". An area's canonical is therefore an entity canonical, and **an area's `name` MUST NOT be the empty string.**

It presently may be, and the same object demonstrates that this is unintended: an area's *localised* names are required to be non-empty while the name they localise is not. An area can be nameless in English and must be named in Spanish.

The area slug is a separate matter and this document does not propose changing it. It uses a looser pattern than the rest of FDS, permitting dots and single characters, and implementers have been told in writing that dotted area slugs are legal. Whether that pattern was intended or inherited from the adjacent dot-notation convention for area *identifiers*, it has been published and relied on, and tightening it is a decision with an affected party. It is raised in §7.1 rather than decided here.

## 4. Reference Structures

### 4.1. The five references

Each reference identifies a target and denormalises part of it. `id` and `name` are required on all five; `muscleRef` additionally requires `categoryId`, because a muscle is not meaningful for volume accounting without the group it rolls up into.

```json fds:fragment entity=exercise
{
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "name": "Quadriceps", "categoryId": "cat.legs" }
    ],
    "secondary": []
  },
  "equipment": {
    "required": [
      { "id": "eq.barbell", "name": "Barbell", "slug": "barbell" }
    ]
  }
}
```

### 4.2. What a conforming reference may not look like

Every reference below satisfies the published schema today and none of them is a reference to anything. They are shown as the failures §3 exists to make impossible, not as fragments to copy.

```json fds:ignore documents that validate today and are what this RFC exists to reject
{
  "targets": {
    "primary": [
      { "id": "", "name": "", "slug": "", "categoryId": "", "aliases": ["", ""] }
    ]
  },
  "equipment": {
    "required": [
      { "id": "eq.barbell", "name": "", "slug": "Barbell!!" }
    ]
  }
}
```

The first entry names a muscle whose identity, name, slug and group are all blank, and duplicates a blank alias for good measure. The second identifies real equipment, then supplies a name a consumer will render as nothing and a slug that is not a slug.

### 4.3. `equipmentRef.categories` has no source field

The equipment reference carries a `categories` array. The equipment entity has no `categories` field; its classification carries `tags`.

A denormalised field that copies nothing is outside §3.1 — there is no source constraint to inherit, because there is no source. Either it is a stale name for `classification.tags`, in which case it should say so and inherit from it, or it is vestigial, in which case it should go. Both are decisions for the release that encodes this document, and both are noted in §7.1 rather than taken here.

## 5. Encoding

### 5.1. What changes

For each of the five references: `name` gains a non-empty constraint, `slug` gains the slug pattern, and `aliases` gains non-empty unique entries. For body-atlas areas: the area canonical's `name` gains a non-empty constraint. Nothing else changes, and no field is added or removed.

### 5.2. Why it cannot ship as an edit

A published schema's bytes never change. Every schema carrying a reference is frozen, so the change appears as new version directories beside the existing ones, and the versions that exist today stay served for as long as any release names them.

### 5.3. Why it cannot ship as a minor

A schema that newly rejects the empty string rejects documents that validate against its predecessor. Under this project's own policy that is a removal of previously valid structures, and it lands in a **major**.

This is stated as the rule requires it, not as the author would prefer it. The counter-argument deserves recording because a reviewer will reach for it: the standard is not changing here, only its encoding is — the slug rules were already written, and the purpose of a reference name was already stated twice. On that reading this is a defect fix in the encoding of an unchanged specification.

Both are true, and they do not resolve each other. What a consumer experiences is a schema that used to accept their document and now does not, whatever the fix is called. Whether correcting an encoding defect earns relief from the additive-by-default principle is a governance decision, it is irreversible once a major is published, and it belongs to the Editors.

## 6. Versioning and Compatibility

### 6.1. Which documents this rejects

Precisely: a document containing a reference whose denormalised `name`, `slug` or `aliases` could not have come from a valid entity of the type referenced.

That characterisation is worth more than "documents with empty strings", because it bounds the damage. A reference is a copy of a catalog entry. If the catalog entry is valid FDS, its name is non-empty and its slug is a slug, so the copy already satisfies §3 and nothing changes for that document. **No document whose references are consistent with the entities they point at is rejected by this change.** What is rejected is a document whose reference could not be a copy of anything.

That characterisation is testable rather than reassuring, and it has been tested: every example published with the standard today was validated against both the current schemas and schemas carrying the constraint, and not one is newly rejected. The check is a dozen lines and is worth re-running against a producer's own corpus before the encoding lands.

This does not make the change safe. A producer that has not resolved its reference data emits exactly the rejected shape, and at least one does today. It makes the change *diagnosable*: every rejection names a specific reference that was never a copy of a valid entity, which is a defect the producer can act on rather than a compatibility complaint they can only work around.

### 6.2. Before it is encoded

The encoding waits on a major release. The requirement does not.

§3.2 and §3.3 are normative on adoption of this document. A schema is not the whole of conformance in FDS and never has been — every RFC carries a Conformance section whose requirements no schema encodes, from resolving workout references rather than skipping them to never publishing a resolved program as a program. A producer emitting blank reference names is non-conformant from the moment this document is accepted, and a conformance suite is entitled to say so while the published schema still passes it.

An implementer building a conformance gate today SHOULD validate against the published schema **and** check reference integrity separately, and SHOULD report the two distinctly: the first is what the standard can currently prove, the second is what it currently requires.

### 6.3. What lands with this document

A gate that compares each reference's constraints against the constraints of the field it copies, and records the divergences that exist today. The five known divergences are recorded, so the gate passes on the tree as it stands; a sixth reference added with the same shape fails immediately.

This does not fix anything and is not meant to. Copying the shape of the last reference is the demonstrated mechanism by which two divergences became five, and stopping the mechanism is available now, whereas fixing the divergences is not.

## 7. Open Questions and Adjacent Findings

### 7.1. For the Editors

1. Whether correcting an encoding defect justifies the major release §5.3 requires, or whether it waits for one that is happening anyway.
2. Whether the UUIDv4 expectation in RFC-001's conformance text still reflects the project's intent, given that no schema encodes it and implementations are being designed around the freedom the schemas grant. Either the prose or the intent has moved; §3.5 does not decide which.
3. Whether the body-atlas area slug pattern was intended to be looser, given that no published area slug uses the looseness and the recommendation it appears to derive from is about area identifiers.
4. Whether `equipmentRef.categories` (§4.3) becomes a copy of `classification.tags` or is removed.

### 7.2. A wider class, recorded and not proposed

Required strings that may be empty are not limited to reference names. Across the published schemas the same shape appears on identifiers a document uses to reference its own parts, on the discriminators of forward-compatibility branches, and on language tags. An empty identifier for a document-internal part is arguably worse than an empty name, because two parts identified as `""` are indistinguishable and a pointer to `""` is ambiguous.

This document does not propose a rule for them. They are not denormalised copies, so §3.1 says nothing about them, and each raises a question of its own — a forward-compatibility discriminator is deliberately open, and narrowing it carelessly would defeat the branch. Recorded here so the next reader starts from the finding rather than rediscovering it.

### 7.3. Whitespace

A name of `" "` satisfies every constraint §3 proposes and renders as nothing. Rejecting it belongs on `canonical` first: a reference that were stricter than the entity it copies would violate §3.1 and would make a valid entity unreferenceable. The change is small and the argument is separate.

## 8. Security and Privacy Considerations

None of this changes what a reference carries. A reference names an exercise, a muscle, a piece of equipment, a session or a plan — none of which is a person, and none of which acquires a subject by being named more strictly. The guiding principle that FDS describes the domain and never the person is untouched.

One consequence is worth naming. A producer that cannot fill a reference name must now omit the reference or the document rather than emit a hollow one. That is the intended outcome: an absent document is a recoverable state, and a document that reports itself complete while carrying nothing renderable is not.

## 9. JSON Schema Reference

This document specifies definitions shared by the entity schemas rather than a schema of its own. The definitions it governs are published inside each entity schema that uses them, flattened, and are validated wherever those schemas are:

- Exercise — muscle and equipment references
- Workout — exercise, muscle and equipment references
- Program — exercise and workout references
- Prescription — equipment references

## 10. Example

A muscle reference and the muscle it copies, side by side. Every denormalised field on the reference carries a value the entity would itself accept, which is the whole of §3.1.

```json fds:fragment entity=muscle
{
  "canonical": {
    "name": "Quadriceps",
    "slug": "quadriceps",
    "aliases": ["Quads"]
  }
}
```

```json fds:fragment entity=exercise
{
  "targets": {
    "primary": [
      {
        "id": "mus.quadriceps",
        "name": "Quadriceps",
        "slug": "quadriceps",
        "categoryId": "cat.legs",
        "aliases": ["Quads"]
      }
    ],
    "secondary": []
  }
}
```

## Conformance

**Conforming Producers:**

:::danger MUST
- **MUST NOT** emit a reference whose `name` is the empty string.
- **MUST NOT** emit a reference `slug` that does not satisfy the slug rules.
- **MUST** omit a reference, or the document containing it, rather than emit a reference it cannot fill.
- **MUST NOT** emit a body-atlas area whose `name` is the empty string.
:::

:::tip SHOULD
- **SHOULD** resolve reference data before export, so that every reference is a copy of an entity that exists.
- **SHOULD** omit an optional `slug` or `aliases` it has no value for, rather than supplying an empty one.
:::

**Conforming Consumers:**

:::danger MUST
- **MUST** treat a reference with a blank denormalised field as a data fault rather than as a name, and **MUST NOT** render it as an empty label.
:::

:::tip SHOULD
- **SHOULD** report reference integrity separately from schema validation, so that a producer can tell what the standard requires from what its published schema can currently prove.
- **SHOULD** distinguish an absent optional field from an empty one, and report only the second.
:::

**Compatibility:**

:::danger MUST
- Encoding §3 in a schema rejects documents its predecessor accepted and **MUST** ship in a major release.
- A version that exists today **MUST** stay served for as long as any release names it.
:::

---

Additional resources:
- i18n and slug conventions: `/specification/i18n-and-slugs.md`
- Contribution and versioning policy: `/specification/governance/CONTRIBUTING.md`
- Guiding principles: `/specification/governance/GOVERNANCE.md`

## 11. References

### 11.1. Normative References

- RFC 2119 — Key words for use in RFCs
- RFC-001 — Exercise Data Model (muscle and equipment references, canonical)
- RFC-005 — Body Atlas Data Model (areas and their canonical)
- JSON Schema Draft 2020-12

### 11.2. Informative References

- RFC-006 — Prescription Primitives (consumer of the equipment reference)
- RFC-007 — Workout Data Model (consumer of three references)
- RFC-008 — Training Program Data Model (states what a denormalised name is for)
