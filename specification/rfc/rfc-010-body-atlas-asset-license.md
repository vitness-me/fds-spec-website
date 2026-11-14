# RFC-010: Licence and Attribution on Body Atlas View Assets

**Status**: Draft
**Version**: 0.1.0
**Date**: 2026-11-14
**Authors**: VITNESS Team
**Category**: Standards Track
**Updates**: RFC-005
**Target**: FDS 1.5.0, naming body-atlas 1.1.0

## Abstract

This RFC adds two optional string fields, `license` and `attribution`, to the asset of a Body Atlas view (`views[].asset`). They have the same schema constraint as the fields of the same names on every FDS media item, and `license` has the meaning RFC-008 §4.8 gives a program's `authorship.license`. The change is additive. Every body-atlas 1.0.0 document validates unchanged against the proposed 1.1.0 schema.

The atlas is the one place in FDS where a document points at third-party artwork and has no way to say on what terms. This RFC closes that gap without inventing a new licence model.

## 1. Introduction

### 1.1. Background

A Body Atlas (RFC-005) is a set of drawings of a body and a set of named areas bound to shapes in those drawings. Each view carries an `asset` of `type` and `uri`. In body-atlas 1.0.0 that object closes `additionalProperties`, so it can hold nothing else.

Every other place FDS points at a picture can say who made it and under what licence. An exercise, a piece of equipment, a muscle, a muscle category, a workout and a program all carry `media[]`. Each media item has optional `license` and `attribution` fields. A program carries `authorship.license` as well. The atlas is the exception, and it is the one entity whose whole purpose is to point at artwork.

The gap is not hypothetical. The VITNESS body atlas artwork at `https://assets.vitness.me/body-atlas/v1.1.0/` is licensed Apache-2.0, and its geometry derives from the open-source vulovix/body-muscles project. Apache-2.0 §4 requires a redistributor to pass the licence on and keep the attribution notices. An implementer that catalogues media licences records the terms for every exercise image it serves. It cannot record them for the atlas, because there is nowhere in the document to put them. Today the terms go missing as soon as the atlas document leaves the system that produced it.

A recipient who gets an atlas without its terms can't tell redistributable artwork from artwork it has no right to use. RFC-008 §4.8 gives this reason for recording authorship on programs, and it applies to drawings too.

This document is numbered RFC-010, not RFC-009. RFC-009 is reserved for performed data: RFC-006, RFC-007 and RFC-008 refer to it by number, and so do the frozen bytes of both published workout schemas, so the number cannot be reused. The `Updates` and `Target` header fields are new to this RFC. They are there because this is the first RFC that changes an existing entity, not one that defines a new one.

### 1.2. Goals

1. Let an atlas state the licence and the required attribution for each view's artwork, inside the document.
2. Use the licence vocabulary FDS already has, unchanged. Introduce no new licence model.
3. Stay additive. No body-atlas 1.0.0 document becomes invalid, and no consumer that ignores the new fields loses anything it had before.

### 1.3. Scope

**In Scope:** the two fields on `views[].asset`, their meaning, their vocabulary, and the version and release that would carry them.

**Out of Scope:**

- Licensing the atlas *document* itself (its area names, ids and bindings). Section 5.1 explains why that is a different question.
- Verifying a licence claim. FDS records what a producer states. It does not check it.
- Any change to `media[]`, `authorship`, or the licence vocabulary of other entities.
- Rendering or displaying attribution. That is a consumer's concern, as it is for media.

## 2. Terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are used as described in RFC 2119.

- **Asset**: the artwork a view points at, through `views[].asset.uri`.
- **Licence statement**: the value of `license`. It names the terms under which the asset may be used.
- **Attribution statement**: the value of `attribution`. It is the credit text a recipient is asked or required to show.
- **SPDX identifier**: a short licence identifier or licence expression from the SPDX License List, such as `Apache-2.0`, `CC-BY-4.0` or `Apache-2.0 OR MIT`.

## 3. Proposed Change

### 3.1. Schema delta

A new authoring source for body-atlas version 1.1.0 is created beside 1.0.0, identical except for the `$id`, the `title` and the asset object. The asset gains two optional properties. Nothing else in the schema changes: `required` stays `type` and `uri`, `additionalProperties` stays `false`, and the `type` enum is untouched.

The asset object in body-atlas 1.0.0:

```json fds:ignore JSON Schema fragment of the frozen body-atlas 1.0.0 asset object, not an FDS document
{
  "type": "object",
  "required": ["type", "uri"],
  "additionalProperties": false,
  "properties": {
    "type": { "type": "string", "enum": ["svg", "image", "3d"] },
    "uri": { "type": "string", "format": "uri" }
  }
}
```

The asset object in the proposed body-atlas 1.1.0:

```json fds:ignore JSON Schema fragment of the proposed body-atlas 1.1.0 asset object, not an FDS document
{
  "type": "object",
  "required": ["type", "uri"],
  "additionalProperties": false,
  "properties": {
    "type": { "type": "string", "enum": ["svg", "image", "3d"] },
    "uri": { "type": "string", "format": "uri" },
    "license": {
      "description": "SPDX identifier where one applies, or a free-text term. Applies to the asset at uri, not to this atlas document. Absence means unstated, not public domain.",
      "type": "string"
    },
    "attribution": {
      "description": "Credit text the asset's terms ask a recipient to show.",
      "type": "string"
    }
  }
}
```

The two property definitions are the shared media item's `license` and `attribution`, with a `description` added. The `license` description follows the one RFC-008 gives `authorship.license`. The constraint is the same: a string, with no `minLength`, `pattern` or `enum`. Section 4 explains why.

The delta stays inside the asset object. It doesn't reference the shared `media` definition from `common.schema.json`, because an asset is not a media item (Section 6, alternative C).

### 3.2. `license`

`license` states the terms under which the asset at `uri` may be used.

- A producer SHOULD use an SPDX identifier or SPDX licence expression when one applies.
- When no SPDX identifier applies, a producer MAY use free text, such as `All rights reserved` or the name of a proprietary licence.
- **Absence means unstated, not public domain.** A consumer MUST NOT treat a missing `license` as permission to use, modify or redistribute the asset. This is the rule RFC-008 §4.8 sets for `authorship.license`, applied to atlas artwork.
- `license` describes the asset, not the atlas document. A view whose drawing is Apache-2.0 says nothing about the terms of the area names and bindings around it (Section 5.1).
- Each view states its own terms. An atlas whose anterior and posterior drawings come from different sources records a different `license` on each.

### 3.3. `attribution`

`attribution` is the credit text that the asset's terms ask a recipient to show, for example `Body Muscles, Copyright 2024 Ivan Vulović`.

`attribution` does not replace a licence's own notice requirements. Apache-2.0 §4(d), for example, requires a redistributor to carry the contents of the work's `NOTICE` file. A one-line credit in the document helps a recipient find that duty. It does not fulfil it.

- A producer SHOULD set `attribution` when the asset's licence requires attribution, as Apache-2.0 and every `CC-BY` licence do.
- A consumer that displays or redistributes the asset SHOULD show or pass on `attribution` when it is present.
- `attribution` is plain text. A consumer MUST NOT interpret it as markup (Section 9).

### 3.4. Conformance additions to RFC-005

On acceptance, RFC-005 gains these requirements. The first two consumer rules are the rules RFC-008 Conformance item 7 applies to `authorship`. The producer rules and the attribution rules are new: RFC-008 states no producer rules for `authorship`.

**Conforming Producers:**

- **SHOULD** state `license` on every view whose asset terms are known.
- **MUST NOT** state a `license` they have not established. No validator or consumer can detect a violation of this rule. It is stated anyway, because a guessed licence is worse than an absent one: absence is safe, and a guess is not.

**Conforming Consumers:**

- **MUST NOT** treat an absent `license` as permission.
- **SHOULD** preserve `license` and `attribution` unchanged through any transformation that carries the view forward, including conversion to another format.
- **SHOULD** show or pass on `attribution`, when present, wherever they display or redistribute the asset.
- **MUST** treat `attribution` as plain text, and escape it when rendering it. It MUST NOT be interpreted as markup (Section 9).

## 4. Licence Vocabulary

FDS already has one licence vocabulary, and this RFC adopts it unchanged.

| Where | Field | Constraint | Documented meaning |
|---|---|---|---|
| Every media item (`media[]`, RFC-001) | `license` | string | none written down |
| Every media item (`media[]`, RFC-001) | `attribution` | string | none written down |
| Program `authorship` (RFC-008 §4.8) | `license` | string | SPDX identifier where one applies, or free text. Absence means unstated. |
| Program `authorship` (RFC-008 §4.8) | `attribution` | string | credit text |
| **Atlas view asset (this RFC)** | `license` | string | as RFC-008 §4.8 |
| **Atlas view asset (this RFC)** | `attribution` | string | credit text |

There is no licence registry under `specification/registries/` and no enum of licences in any schema. The vocabulary is the SPDX License List, recommended but not enforced, with free text as the fallback. This RFC keeps it that way, for three reasons.

1. **Consistency.** A consumer that already reads `media[].license` reads `views[].asset.license` with the same code. A stricter constraint on the atlas alone would make the same field accept different values in different places. The meaning this RFC writes down for the atlas, including "absence means unstated", is RFC-008's. Media `license` has never had its meaning written down. Extending RFC-008's rule to media is a separate editorial question, outside this RFC.
2. **Additive evolution.** The SPDX list grows. A closed enum would have to be widened in a schema release whenever a licence is added, and a `pattern` would reject legitimate free-text terms such as `All rights reserved`. Tightening the vocabulary later is a breaking change under the Breaking Changes Policy. Starting tight and loosening later is the costly direction.
3. **Licence expressions.** SPDX expressions such as `Apache-2.0 OR MIT` contain spaces and operators. A slug-shaped `pattern` would reject them.

The published examples are not consistent today. The exercise example writes `CC BY 4.0`, and the program example writes the SPDX identifier `CC-BY-4.0`. Both are valid under the schema. This RFC's examples use SPDX identifiers. Bringing the exercise example in line is an editorial change outside this RFC.

A consumer that keeps its own licence catalogue, keyed by SPDX identifier, maps `license` to that catalogue the same way it maps media licences. A value that matches no SPDX identifier is free text, and the consumer handles it as it handles a free-text media licence.

## 5. Compatibility

### 5.1. Why per view, and not on the atlas document

The atlas *document* and the *artwork* it points at are different works, and they can have different owners. Area ids, names, localisations and bindings are data authored by whoever wrote the atlas. The drawings can come from somewhere else entirely. The VITNESS atlas is an example: its area model is VITNESS's, and its geometry derives from a third-party project. A single atlas-level `license` would have to describe both and could describe neither correctly. Section 6 records this as alternative A.

### 5.2. Validity across versions

- **Every body-atlas 1.0.0 document validates against 1.1.0 unchanged.** The only change is two optional properties on an object that previously admitted only `type` and `uri`. No field became required, and no enum or pattern became stricter. Under the RFC Lifecycle notes and the Breaking Changes Policy in GOVERNANCE.md, this is a Minor change.
- **A 1.1.0 document that uses either field is rejected by the 1.0.0 schema**, because the 1.0.0 asset object closes `additionalProperties`. That is why this is a new schema version and not an edit to the published one. It is the same situation the workout 1.1.0 release recorded.
- **body-atlas 1.0.0 stays published and frozen**, with status `superseded`. Releases 1.0.0 through 1.4.0 name it, so a consumer pinned to any of them must keep resolving it (GOVERNANCE.md principle 4).
- A producer writing for a consumer pinned to body-atlas 1.0.0 omits `license` and `attribution`. Nothing else in the document changes. The recipient then sees the terms as unstated, which is the safe default under Section 3.2.

### 5.3. Effect on other entities

None. A muscle's `heatmap.atlasId` names an atlas by id, not by schema version, and `areaId` resolution doesn't involve the asset object. No other entity schema changes, and no other entity's version moves. Entities version independently.

## 6. Alternatives Considered

**A. `license` on the atlas root.** One field at the top level of the document. Rejected. It conflates the licence of the atlas data with the licence of the artwork (Section 5.1), and it cannot express an atlas whose views have different sources. It also departs from the media precedent, where the licence sits on the item it describes.

**B. A vendor extension, with no schema change.** Body-atlas 1.0.0 already accepts root-level `extensions`, so a producer can write something like `"extensions": { "x:vitness": { "assetLicenses": { "anterior": "Apache-2.0" } } }` today, with no release. This is the cheapest option, and it is the route the Extension Registry Guide prescribes for patterns that have not yet been adopted widely. Rejected as the end state, for three reasons. Consumers MUST ignore unknown extension keys, so the terms are dropped by exactly the recipients who most need them. The licence ends up at the root and keyed by view id, away from the asset it describes. And the concept itself isn't new: FDS standardised it for media in 1.0.0. Extending an existing core field to the one object that lacks it is a consistency fix, and the promotion path exists for new concepts. This option remains available as an interim measure if the ruling defers the RFC.

**C. Reuse the shared `media` item definition for `asset`.** It already has `license` and `attribution`. Rejected. Its `type` enum is `image`, `video`, `doc`, `3d`, and the asset's is `svg`, `image`, `3d`. Adopting it would remove `svg`, which RFC-005 recommends, and admit `video` and `doc`, which make no sense for a drawing with selectable shapes. That is a breaking change. It would also bring in `caption`, which has no use on an atlas view.

**D. `license` only, without `attribution`.** This is the smallest possible change. Rejected in this draft. Apache-2.0, the licence that motivates this RFC, and every `CC-BY` licence require attribution. A licence statement without its credit text satisfies only half of those terms, and the credit text would end up in an extension (alternative B). Every media item carries the two fields together. This is the main open question for the ruling (Section 12).

**E. A structured licence object**, such as `{ "spdx": "...", "uri": "...", "holder": "..." }`. Rejected. It would be a second licence model beside the string FDS uses everywhere else, and Goal 2 rules that out. If FDS ever needs structured licence data, it should be introduced for media and authorship at the same time, in its own RFC.

**F. Make no change. Publish the terms beside the artwork**, for example as a `LICENSE` or `NOTICE` file at the asset host. This is the status quo. The terms don't travel with the document, so a recipient that gets the atlas through any channel other than that host never sees them. Rejected for the reason in Section 1.1.

## 7. Examples

A view in the proposed body-atlas 1.1.0, with the terms of the VITNESS atlas artwork. The `v1.1.0` in the artwork URL is the artwork's own release and has nothing to do with the schema version.

```json fds:ignore proposed body-atlas 1.1.0 fragment; no 1.1.0 schema is published until this RFC is accepted
{
  "views": [
    {
      "id": "anterior",
      "kind": "anterior",
      "asset": {
        "type": "svg",
        "uri": "https://assets.vitness.me/body-atlas/v1.1.0/anterior.svg",
        "license": "Apache-2.0",
        "attribution": "Body Muscles, Copyright 2024 Ivan Vulović"
      }
    }
  ]
}
```

A complete document in which the two views come from different sources. The anterior drawing is CC-BY-4.0 and needs credit, and the posterior drawing's terms are unknown, so they are left unstated.

```json fds:ignore proposed body-atlas 1.1.0 document; no 1.1.0 schema is published until this RFC is accepted
{
  "schemaVersion": "1.1.0",
  "id": "atlas.body.example",
  "canonical": { "name": "Example Body Atlas", "slug": "example-body-atlas" },
  "views": [
    {
      "id": "anterior",
      "kind": "anterior",
      "asset": {
        "type": "svg",
        "uri": "https://cdn.example.com/atlas/anterior.svg",
        "license": "CC-BY-4.0",
        "attribution": "Anterior illustration by Example Studio"
      }
    },
    {
      "id": "posterior",
      "kind": "posterior",
      "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/posterior.svg" }
    }
  ],
  "areas": [
    {
      "id": "thigh.left.anterior",
      "canonical": { "name": "Left Anterior Thigh", "slug": "thigh-left-anterior" },
      "bindings": [ { "viewId": "anterior", "selector": "#area-thigh-left" } ]
    },
    {
      "id": "back.lower.posterior",
      "canonical": { "name": "Lower Back", "slug": "lower-back" },
      "bindings": [ { "viewId": "posterior", "selector": "#area-lower-back" } ]
    }
  ],
  "metadata": {
    "createdAt": "2026-11-14T12:00:00Z",
    "updatedAt": "2026-11-14T12:00:00Z",
    "status": "active"
  }
}
```

A consumer reading the second document may redistribute the anterior drawing under CC-BY-4.0, showing the credit text. It MUST NOT assume it may redistribute the posterior drawing.

Every existing body-atlas 1.0.0 document, including the published example, is already a valid 1.1.0 document once its `schemaVersion` is updated. No other edit is needed.

Both examples above, and the published 1.0.0 example, were validated with Ajv (Draft 2020-12) against the 1.0.0 schema with the Section 3.1 delta applied. All three pass. The complete document fails against the published 1.0.0 schema on `additionalProperties`, as Section 5.2 says it should. They are marked `fds:ignore` only because the 1.1.0 schema is not published.

## 8. Test and CI Gate Impact

This section lists what acceptance would change. **None of it is part of this RFC's pull request.** The pull request adds this document and nothing else.

### 8.1. On acceptance: schemas and release

| Gate or artefact | Change |
|---|---|
| `specification/schema-sources/atlas/` | New `v1.1.0/` source carrying the delta in Section 3.1. The 1.0.0 source stays in the repository, as workout 1.0.0's did, but is no longer rendered. |
| `scripts/build-schemas.mjs` | `ENTITIES` points body-atlas at 1.1.0. `UNGENERATED` gains the 1.0.0 atlas schema, which stays served, hashed and frozen. `RELEASES` gains a 1.5.0 entry, and `CURRENT_RELEASE` moves to 1.5.0. |
| `scripts/check-rfc-fields.mjs`, `scripts/lib/vocabulary.mjs` | Both hard-code the atlas source path: `PAIRS` pairs RFC-005 with it, and `SCHEMA_SOURCES` lists it. Both move to the 1.1.0 source, or `check:rfc` and `check:skill` keep reading 1.0.0 and never see the new fields. |
| `check:schemas` | Regenerates `specification/schemas/`, `.integrity.json`, `releases.json` (FDS 1.5.0 naming body-atlas 1.1.0, other entities unchanged, atlas 1.0.0 `superseded`) and the transformer's bundled copies and release map. The gate passes once the generated files are committed. |
| Standalone Ajv validation | A new hand-written `body-atlas.example.json` beside the 1.1.0 schema, using both fields. `list-entity-schemas.mjs` picks it up from the manifest. |
| `check:doc-examples` | The two `fds:ignore` blocks in Section 7 of this document become `fds:fragment entity=body-atlas` and `fds:document entity=body-atlas`, and are validated. RFC-005 §4.2 gains a fragment showing the fields. `EXPECTED` in the script moves accordingly. |
| `check:rfc` | RFC-005 must document `license` and `attribution` under §4.2 Views, because the forward rule requires every authored field to appear in its RFC and the placement rule requires it in the section about `views`. |
| `check:versions` | References to the atlas 1.0.0 URL in RFC-005 §8, `SCHEMAS.md` and elsewhere either move to 1.1.0 or carry a pin marker. The tables marked as covering every schema and every release gain the new rows. |
| `check:skill` | `packages/fds-skill/knowledge/schemas.md` updates the `AtlasView` asset type with the two fields. |
| `check:mirrors`, `check:translations` | Website mirrors of the changed RFC-005 and of the schema listing are updated. Their existing `es` and `sr-Latn` translations are re-translated and re-recorded with `--update`. |
| `CHANGELOG.md` | A "Schema release — body-atlas 1.1.0" entry with Added, Changed and Compatibility sections, in the form of the workout 1.1.0 entry. |

No gate's logic changes. Two hard-coded path lists change (the `check-rfc-fields.mjs` and `vocabulary.mjs` row above). The other gates read the release manifest, so the new entity version reaches them without edits.

### 8.2. While this RFC is a draft

This document is a new file in `specification/rfc/`. Several gates enumerate that directory and expect a matching website page and table rows: `check:mirrors`, the RFC index tables marked as covering every RFC, the RFC counts on the landing page and overview pages, and `check:translations`. The examples in Section 7 cannot be validated against a schema that is not published, so they are marked `fds:ignore`, and that marker is counted against `EXPECTED` in `check:doc-examples`. Measured against this document alone, the open gates are:

- `check:mirrors`: no page at `website/docs/specifications/` for this RFC.
- `check:versions`: the four RFC index tables (the root README and the specifications index in English, Spanish and Serbian Latin) lack a row, and twelve RFC-count claims say eight.
- `check:doc-examples`: the four `fds:ignore` blocks above take the ignored count from 28 to 32, and `EXPECTED` in the script says 28.

Publishing this RFC on the site would also need an entry in `website/sidebars.ts` and a roadmap line. `check:translations` checks only translations that already exist. It would fail once the English index pages change, until their translations are re-recorded. Spanish and Serbian Latin versions of a new page are a review item, not a gate.

The companion edits are mechanical. They belong to the change that accepts this RFC, or to a decision to publish it as a draft before the ruling.

## 9. Security and Privacy Considerations

- **No personal data.** `license` and `attribution` describe artwork and its rights holder, not a person who uses the atlas. An attribution names an author or organisation, as media attribution already does. GOVERNANCE.md principle 1 is unaffected.
- **A licence statement is a claim, not a grant.** FDS does not verify it. A consumer that relies on it for redistribution relies on the producer. Consumers SHOULD record which source a licence statement came from.
- **Attribution is untrusted text.** A consumer that renders `attribution` MUST treat it as plain text and escape it. It is displayed next to artwork, often in HTML, which makes it an injection vector if it is rendered as markup. This adds to the SVG guidance in RFC-005 §7.

## 10. JSON Schema Reference

- **Amends:** `/specification/schemas/atlas/v1.0.0/body-atlas.schema.json`, the body-atlas schema every published release names.
- **Proposed:** body-atlas 1.1.0, defined by the Section 3.1 delta against that schema. It is not written or published until this RFC is accepted (Section 8.1).
- **Examples:** Section 7.

## 11. Release Target

- **Spec release:** FDS 1.5.0, naming body-atlas 1.1.0. Every other entity and library stays at the version 1.4.0 names. This is a Minor release, because the change is an optional addition.
- **Process:** Draft, then Review, under GOVERNANCE.md: lazy consensus after a review window of at least five business days, with implementer feedback weighted. GOVERNANCE.md requires examples and schemas to validate in Review. Here the schema is deliberately unwritten, and the examples were validated against the Section 3.1 delta (Section 7). Whether that is enough to enter Review is for the Editors to decide.
- **Folding in:** On acceptance, the normative text moves into RFC-005 §4.2, Conformance and §6. That keeps one source for the atlas rules. There is precedent for the edit but not for a separate RFC: workout 1.1.0 was written straight into RFC-007, which moved to version 0.2.0, and no separate RFC was written. This document then becomes Accepted and **is no longer normative**. It stays as the record of the decision, and RFC-005 governs. Section 12 asks whether this document should stay at all.
- **Order:** The schema, release and documentation changes in Section 8.1 ship together in one change, after the ruling. Nothing is published before then.

## 12. Open Questions for the Ruling

1. **`attribution` alongside `license`, or `license` alone?** This draft proposes both (Section 6, alternative D). Choosing `license` alone is a smaller change, and attribution can be added in a later minor version.
2. **SPDX: SHOULD or MUST?** This draft keeps the existing rule, which recommends SPDX and permits free text. Requiring SPDX on the atlas alone would make the same field stricter here than on media (Section 4).
3. **A standalone RFC, or an in-place amendment?** (a) Keep RFC-010 as a non-normative historical record once its text is folded into RFC-005, as Section 11 proposes. That costs a permanent RFC number in every RFC index and count. (b) Follow the workout precedent: amend RFC-005 in place and withdraw this document before it is published.
4. **Principle 6.** The motivating case is the steward's own artwork. This RFC argues that the change is a consistency fix, since it extends an existing core field to the one object that lacks it, and not a new concept that needs adoption by several implementers first (Section 6, alternative B).

## 13. References

### 13.1. Normative References

- RFC 2119 — Key words for use in RFCs
- RFC-005 — Body Atlas Data Model
- RFC-008 — Training Program Data Model, §4.8 `authorship`
- JSON Schema Draft 2020-12
- SPDX License List — `https://spdx.org/licenses/`

### 13.2. Informative References

- RFC-001 — Exercise Data Model, shared `media` definition
- `specification/extension-registry.md` — Extension Policy and Registry Guide
- Apache License 2.0, §4 Redistribution — `https://www.apache.org/licenses/LICENSE-2.0`
- vulovix/body-muscles — `https://github.com/vulovix/body-muscles`

---

Copyright Notice
Copyright (c) 2026 VITNESS.
This document is subject to the rights, licenses and restrictions contained in the VITNESS Open Standards License Agreement. See `/specification/VITNESS Open Standards License Agreement.md`.
