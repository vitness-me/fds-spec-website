# RFC-010: Official Muscle Registry

**Status**: Accepted
**Version**: 1.0.0
**Date**: 2026-11-16
**Authors**: VITNESS Team
**Category**: Standards Track
**Registry**: `specification/registries/muscle.registry.json`, version 1.0.0

## Abstract

FDS defines what a muscle record looks like (RFC-003) but not which muscles exist. Two applications that both conform to RFC-003 can still call the rear shoulder `rear-delts` and `posterior-deltoid`, and a user's training history then needs translating before it means anything in the other application. This RFC publishes one list of muscle and muscle-group names that every FDS application shares. It does not change any schema.

## 1. Introduction

### 1.1. Background

Before this RFC the muscle catalog was only an illustrative example: `specification/registries/muscles.registry.example.json` holds three muscles, and the registries README says nothing in FDS requires those entries. The only normative vocabularies were open classifiers such as `exerciseType`, `workoutType`, `blocks[].role` and `intensityZone.boundsRef`.

Muscles are where that gap costs most. Every exercise names its targets, and per-muscle volume is the figure users compare across applications. If the names differ, history doesn't carry over.

### 1.2. Goals

1. Publish one list of muscle names that every FDS application uses for the same anatomy.
2. Keep the broad names people actually train by (back, chest, legs) and say exactly which muscles each one rolls up.
3. Give each entry an informative hint naming the body-atlas area that draws it, so a heatmap can be built without a lookup table.
4. Change no published schema.

### 1.3. Scope

**In scope:**
- The list itself: slug, display name, kind (muscle or group), category, group membership and atlas-area hint for each entry
- How a document uses a slug from the list, and what a consumer does with one it doesn't know
- How the list is versioned and extended

**Out of scope:**
- The muscle record structure, which stays as RFC-003 defines it
- Record identifiers. Production `id` values remain UUIDv4 and remain each provider's own
- Muscle activation levels and biomechanics
- The artwork. The atlas-area hints name areas of an existing atlas and do not define one
- Muscles with no atlas area of their own. The rotator cuff, transverse abdominis, teres major and rhomboids are left out on purpose and can be proposed later (§6.2)

## 2. Terminology

- **Registry**: the file `specification/registries/muscle.registry.json`, served at `https://spec.vitness.me/registries/muscle.registry.json`.
- **Entry**: one item of the registry, identified by its slug (`value`).
- **Muscle**: an entry with `kind: "muscle"`. A muscle, or a named part of one that training distinguishes (`upper-pecs`, `triceps-long-head`).
- **Group**: an entry with `kind: "group"`. A name for a set of other entries (`back`, `glutes`), listed in its `members`.
- **Roll-up**: a group's members, followed transitively down to muscles.
- **Category**: the coarse body part an entry belongs to. One of eight values in the registry's `categories`.
- **Official slug**: a slug listed in the registry.

## 3. The registry

### 3.1. Entries

The registry has 51 entries: 33 muscles and 18 groups. It is VITNESS's 42-entry muscle catalog, plus 11 muscles that the production body atlas already draws an area for, minus `olympic` and `other`. Those two are not anatomy and are deprecated.

| Added muscle | Atlas area(s) |
|---|---|
| `lateral-deltoid` | `shoulder-side` |
| `gluteus-maximus` | `gluteus-maximus` |
| `gluteus-medius` | `gluteus-medius` |
| `gastrocnemius` | `calves-gastroc-medial`, `calves-gastroc-lateral` |
| `soleus` | `calves-soleus` |
| `wrist-flexors` | `forearm-flexors` |
| `wrist-extensors` | `forearm-extensors` |
| `upper-trapezius` | `traps-upper` |
| `middle-trapezius` | `traps-mid` |
| `lower-trapezius` | `traps-lower` |
| `quadratus-lumborum` | `lower-back-ql` |

Each entry carries:

| Field | Meaning |
|---|---|
| `value` | The slug. Lowercase ASCII `[a-z0-9-]`, the form `canonical.slug` already requires. |
| `label` | The English display name. |
| `kind` | `muscle` or `group`. |
| `category` | One of the registry's eight `categories`. |
| `members` | Groups only: the slugs this group rolls up. |
| `atlasAreas` | Informative. Areas of the VITNESS production body atlas (vulovix/body-muscles, Apache-2.0) that draw this entry. |
| `description` | One or two sentences saying what the entry covers. |

### 3.2. Groups

A group lists its direct members. A member may itself be a group: `legs` contains `glutes`, which contains `gluteus-maximus`. An entry may belong to more than one group: `gluteus-medius` is in both `glutes` and `abductors`, and `posterior-deltoid` is in both `deltoid` and `upper-back`. The relation is therefore a directed acyclic graph, not a tree.

`full-body` is the group whose members are every entry no other group contains, so its roll-up is every muscle in the registry.

Two groups currently roll up a single muscle: `biceps` (to `biceps-brachii`) and `abs` (to `rectus-abdominis`). Both names stay because applications use them, and the roll-up says what they mean.

### 3.3. Categories

`category` is a coarse partition with exactly one value per entry: `arms`, `back`, `chest`, `core`, `full-body`, `legs`, `neck`, `shoulders`. It is not a group and has no members. It exists so an application can sort a muscle picker without walking the group graph.

### 3.4. Atlas-area hints

`atlasAreas` is informative. It names the areas a renderer using the VITNESS production atlas would light for this entry. A document is never valid or invalid because of it, and a renderer using another atlas ignores it. Several entries share an area (`lats` and `upper-back` both touch the lats; `lower-pecs` overlaps `inner-pecs`), because the atlas draws regions and the registry names anatomy.

## 4. Using the registry

### 4.1. In a document

The portable key is the slug. A muscle reference carries it in `slug`, which `muscleRef` already allows:

```json fds:fragment entity=exercise
{
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "slug": "quadriceps", "name": "Quadriceps", "categoryId": "cat.legs" }
    ],
    "secondary": [
      { "id": "mus.glutes", "slug": "glutes", "name": "Glutes", "categoryId": "cat.legs" }
    ]
  }
}
```

`id` stays the provider's own identifier and is not portable. `slug` is what another application matches on.

A muscle record (RFC-003) describing an official muscle uses the official slug as its `canonical.slug`.

### 4.2. Conformance

:::danger MUST
- A producer **MUST NOT** use an official slug for anatomy other than what that entry describes.
- Where a producer gives a slug (`muscleRef.slug` or `canonical.slug`) for anatomy the registry covers, it **MUST** be the official slug for that anatomy.
- A consumer **MUST NOT** reject a document because a slug is not in the registry.
:::

:::tip SHOULD
- A producer **SHOULD** populate `muscleRef.slug` on every muscle reference. The schema keeps it optional, so this is a conformance requirement rather than a validation one.
- A producer adding anatomy the registry does not cover **SHOULD** prefix the slug with `x-<vendor>-` (for example `x-acme-rotator-cuff`), so it can never collide with a slug the registry adds later.
- A consumer **SHOULD** pass an unrecognised slug through unchanged and show it by `name`.
- A consumer aggregating by group **SHOULD** count each muscle once, however many paths lead to it from the group.
:::

The registry is open, as the other vocabulary registries are (see the registries README): an unknown slug is a muscle the registry hasn't caught up with, not an invalid document.

## 5. Versioning and compatibility

The registry carries its own semantic version, starting at 1.0.0, like the other vocabulary registries.

- **Minor**: an entry is added, or a description or atlas hint is clarified.
- **Major**: an official slug is removed, renamed, or changed to mean different anatomy. A slug is never reused for different anatomy, even across a major version.
- An entry being retired is marked deprecated, with the slug that replaces it, and stays listed for the rest of the major version.

No schema version changes, so no FDS release is required and the current release's schemas are unaffected. The registry is recorded in the changelog.

### 5.1. Migration

From the example catalogs this repository published:

| Example uses | Official slug | Note |
|---|---|---|
| `latissimus-dorsi` (`muscles.registry.example.json`, `muscle.example.lats.json`) | `lats` | `Latissimus Dorsi` stays usable as an alias in `canonical.aliases`. |
| `mus.deltoids` (exercise example) | `deltoid` | Singular. |
| `mus.gluteusMaximus` with `cat.glutes` (exercise example) | `gluteus-maximus` | Its category is `legs`; `glutes` is a group, not a category. |

From the VITNESS catalog, every camelCase key becomes kebab-case (`posteriorDeltoid` → `posterior-deltoid`), and `olympic` and `other` have no official slug. `biceps-femoris` moves from the `arms` category to `legs`.

`deltoid` changes meaning. It used to name the side of the shoulder and is now the group of all three heads. Data that used plain `deltoid` for the side of the shoulder **MUST** map to `lateral-deltoid`. Mapping it to `deltoid` would say the data covers all three heads, which it never did.

The example files in this repository carry official slugs, and `npm run check:registries` fails on any muscle slug in them that is neither official nor `x-<vendor>-` prefixed.

## 6. Extension

### 6.1. Private additions

A provider may name anatomy the registry does not cover, under the `x-<vendor>-` prefix (§4.2). It may not redefine an official slug.

### 6.2. Adding to the registry

A new entry is proposed by a PR that amends this RFC and the registry together and shows the interchange case it serves (governance principle 6). An entry that cannot be drawn on an existing atlas area may still be added, with an empty `atlasAreas`.

## 7. Security and privacy

The registry names anatomy only. It carries nothing about a person and creates no new field.

## 8. Decision record

Four questions were open while this RFC was in draft. Each was decided as follows, with the alternatives that were rejected.

### 8.1. Slug form, and what is normative

**Decided:** the kebab-case slug is the normative key; ids stay provider-owned. `canonical.slug` in the frozen common schema already requires `[a-z0-9-]`, and `muscleRef.slug` already exists.

Rejected: a camelCase key, which fails `canonical.slug` validation and could live only in a new field and so a new schema version; and a fixed id per entry, which conflicts with the UUIDv4 identifier policy and gives one muscle two portable keys.

### 8.2. Enforcement and extension

**Decided:** an open vocabulary registry checked in CI, as `exerciseType` is. Private additions use `x-<vendor>-`.

Rejected: a schema enum, because adding one where there was none tightens validation, which governance classes as a major release, and each new muscle would then need a schema version.

### 8.3. Groups and muscles

**Decided:** one list and one slug namespace, with `kind` and `members`, many-to-many.

Rejected: groups as RFC-004 muscle categories, because a category allows one per muscle and `gluteus-medius` belongs to two groups; and leaving groups out, which would stop the broad names users train by from being portable.

### 8.4. Version and compatibility

**Decided:** the registry is versioned on its own from 1.0.0 and recorded in the changelog, with no FDS release, matching the four existing vocabulary registries.

Rejected: cutting a release to name the registry, since the release manifest describes schema versions only; and waiting for the next major to ship it with an enum.

## 9. References

### 9.1. Normative references
- RFC-001: Exercise Data Model Specification: `/specification/rfc/rfc-001-exercise-data-model.md`
- RFC-003: Muscle Data Model Specification: `/specification/rfc/rfc-003-muscle-data-model.md`
- i18n and slug conventions: `/specification/i18n-and-slugs.md`

### 9.2. Informative references
- RFC-004: Muscle Category Data Model Specification: `/specification/rfc/rfc-004-muscle-category-data-model.md`
- RFC-005: Body Atlas Data Model Specification: `/specification/rfc/rfc-005-body-atlas-data-model.md`
- The VITNESS production body atlas, vulovix/body-muscles, Apache-2.0

---

Copyright Notice
Copyright (c) 2026 VITNESS.
This document is subject to the rights, licenses and restrictions contained in the VITNESS Open Standards License Agreement. See `/specification/VITNESS Open Standards License Agreement.md`.
