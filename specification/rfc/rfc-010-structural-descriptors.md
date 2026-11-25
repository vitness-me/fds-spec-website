# RFC-010: Structural Descriptors — FXI, FXE and FXM

**Status**: Draft
**Version**: 0.1.0
**Date**: 2026-11-24
**Authors**: VITNESS Team
**Category**: Standards Track

## Abstract

This specification adds three structural descriptors to the Fitness Data Standard: **FXI** for an exercise, **FXE** for a piece of equipment and **FXM** for a muscle. A descriptor is a short string, built from closed vocabularies, that says how an exercise is done, what a piece of equipment is, or which tissue a muscle key means, without using a name in any language. Two catalogues that describe the same exercise in different words can compare their descriptors and find each other.

It defines where the descriptors sit on the exercise, equipment and muscle entities, the fields that travel beside them (who answered, what the notation misses, and the links a person or a resolver confirmed), the match protocol a resolver follows, and how the descriptors are versioned. It publishes the measurements the descriptors have been tested against so far, and states which of them do not yet meet the bar this RFC sets for its own acceptance.

This RFC follows the same Draft to Accepted path as every other RFC; §12 lists the conditions for accepting it, among them the release gate of §9.5. Every field this RFC adds is optional, no existing field changes meaning, and the schema change is a minor version.

## 1. Introduction

### 1.1. Background

RFC-001 to RFC-005 let a provider export its catalogue in a shape any other provider can read. They do not let the reader tell which of its own exercises an imported one is. Each provider identifies its records by its own registry id, and the only thing two catalogues reliably share is that they describe the same movements. Names do not carry that across: the same exercise is written differently in every language, in every gym's jargon, and in every catalogue that renamed it, and two exercises with nearly the same name can differ in the one detail that matters.

A structural descriptor describes the movement itself. FXI writes down the joint actions, the body position, the support, the load and where it is held, the sides, the grip, the range, any held posture and the line of pull, each from a closed vocabulary. Software compares two such strings without reading either catalogue's names.

### 1.2. Goals

1. Let a catalogue owner describe each exercise, piece of equipment and muscle in a form another catalogue can compare without a shared name.
2. Let a resolver link an imported record to the right local record automatically when that is safe, and offer a short list to confirm when it is not.
3. Keep every confirmed link, so a match is made once.
4. Say plainly how far the descriptors can be relied on, from measurements rather than from a certification.

### 1.3. Scope

**In scope:**

- the three descriptors: their syntax, canonical form and compare, by reference to the descriptor pages (§4);
- the record fields that carry them and the fields that travel beside them (§5);
- the match protocol (§7);
- versioning of the descriptors and of the schemas (§8);
- the measured evidence and the release gate (§9).

**Out of scope:**

- **Identity.** A descriptor is not an identifier. Identity stays each provider's own registry id (§3).
- **Prescription.** Tempo, load, repetitions and named set schemes are not part of a descriptor. Two sessions that prescribe the same exercise differently describe one exercise. RFC-006 owns prescription.
- **Provider data.** FDS is a standard, not a catalogue. It publishes the code registries and the rules. It does not publish muscle lists, equipment catalogues, movement words, or named-exercise templates: those are each provider's data (§4.4).
- **Two questions deliberately left open, and not decided here:** where an open, published encoder ends and a provider's own matching service begins; and whether `classification.mechanics`, `classification.force` or the movement pattern should be derived from an FXI rather than stated beside it.

## 2. Terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are to be interpreted as described in RFC 2119.

- **Descriptor**: an FXI, FXE or FXM string in canonical form.
- **Owner**: whoever maintains the catalogue a record belongs to. In this RFC the owner is a catalogue, not a person who trains.
- **Question flow**: the closed questions whose answers build an FXI and an FXE, published as data.
- **Answers record**: the answers one owner gave for one record, kept beside the string it built.
- **Rules revision**: the revision of the descriptor vocabularies and layer rules, named by the `rules` field of each descriptor registry. It is not written in the string.
- **Library**: the set of records a resolver matches against, usually the resolver's own catalogue.
- **Import mode**: building a descriptor from another catalogue's row without its owner.
- **Gap marker**: the owner's note that the notation misses something about this record.
- **Link**: a stored statement that a record and a record in another catalogue describe the same thing.

## 3. The Claim

This standard claims exactly this for FXI:

> **a deterministic descriptor and compare; auto-match on unique identical keys; one-click confirm otherwise; the confirmed link is stored.**

- *Deterministic descriptor*: the same answers always build the same string.
- *Deterministic compare*: the same two strings always compare the same way, and compare never reports two different strings as `identical`.
- *Auto-match on unique identical keys*: under the conditions of §7.1, and only those.
- *One-click confirm otherwise*: a short ranked list a person picks from or rejects.
- *The confirmed link is stored*: in `xrefs` (§5.4), so the question is never asked again.

FXI does not identify an exercise. Two owners who describe the same exercise do not always write the same string: they state optional details differently, and the vocabulary cannot say everything. A descriptor narrows a search and, in the narrow case of §7.1, settles it. An implementation MUST NOT present an FXI as an identifier, and MUST NOT describe the descriptors as identification.

## 4. The Descriptors

The descriptor pages are the normative text for the syntax, the canonical form, the layer rules, the codes and compare. This RFC adopts them as they stand at rules revision 1.4, the `rules` value of the descriptor registries and the question flow, and does not restate them.

| Descriptor | Page | Example |
|---|---|---|
| FXI | [FXI](/docs/core-concepts/descriptors/fxi), [Question flow](/docs/core-concepts/descriptors/question-flow) | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` |
| FXE | [FXE](/docs/core-concepts/descriptors/fxe) | `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back` |
| FXM | [FXM](/docs/core-concepts/descriptors/fxm) | `FXM=1.0/latissimus-dorsi` |

Compare is on [Compare, match and versioning](/docs/core-concepts/descriptors/compare-and-match#compare), and the test vectors on [Conformance](/docs/core-concepts/descriptors/conformance). This RFC is the normative home of the record fields (§5), among them provenance and the gap marker (§5.3), of the match protocol (§7) and of versioning (§8); the pages link here for them. The vocabularies are the registries in `specification/registries/descriptors/`.

### 4.1. Rules this RFC fixes

These are stated here because each is a decision a reader could otherwise expect to go the other way.

1. **No hashed key.** Version 1 defines no hash, checksum or short key derived from a descriptor. Strings are compared as strings.
2. **The movement word does not travel in the string.** A movement word ("squat", "row") is a shortcut through the question flow. It is kept in the answers record, where a resolver MAY use it as a ranking hint, and never written into the FXI.
3. **A generic layer against a known value is `refines`.** `*` means every value. A string with a known value where the other has `*` is the more specific description of the same exercise, not a different one.
4. **Absent standard layers are values.** A standard layer left out of a string takes its published default. The default is a value: it contradicts every other known value. This includes the name layers, held posture `h` and line of pull `p`, whose defaults are values like any other. Only `?` and `*` are open.
5. **Equipment in an exercise record is standard only.** An exercise record's FXE carries the standard layers; extended build-detail layers appear only on an equipment record.

### 4.2. FXI

FXI describes how an exercise is done: its motion (`m`), body orientation (`o`), moving end, footwork, support, load and where the load is held (`l`), symmetry, grip and stance, range, held posture and line of pull, with an extended accessory layer. `m`, `o` and `l` are always written; every other layer is written only when it differs from its default. The header carries the major version and the syntax revision, and a flag: `S` when every layer written is standard, `N` when the extended layer is written.

### 4.3. FXE

FXE describes a piece of equipment by its structure: its kind first, then the standard layers that kind takes, then, on an equipment record only, the extended build-detail layers. A combination machine joins the standard FXE of each configuration with `;`. An exercise that uses no equipment writes `FXE=1.0S/k:none`.

### 4.4. FXM

FXM is a key for a muscle (`FXM=1.0/<muscle>`), a part of one (`FXM=1.0/<muscle>.<part>`), or a group (`FXM=1.0/g:<group>`).

- **Anchoring.** Every muscle and part is anchored to the Foundational Model of Anatomy (FMA), which is primary. Where UBERON has a term for the same structure it is carried as a cross-reference. Where an ontology has no term, the entry records the gap in words; an anchor is never borrowed from a broader or narrower structure.
- **Tokens derive from FMA.** A muscle token is the preferred label of its FMA term, lowercased, with the words "muscle group", or else the word "muscle", removed, and its words joined by single hyphens; a part token is the qualifier in the FMA label of the part or head, the word before "part of" or "head of". The [FXM page](/docs/core-concepts/descriptors/fxm#anchoring) gives the rule with examples. A provider MUST derive its muscle and part tokens this way. Two providers that anchor a structure to the same FMA term therefore write the same key, and a reader resolves a muscle or part key from FMA without the provider's vocabulary. The schema cannot check the derivation: it checks a key's format, never that a token is the one its FMA label gives, and no conformance vector can either. A provider that derives a token wrongly therefore passes every check, and two providers can quietly write different keys for the same muscle, which compare then reads as different muscles.
- **Groups are member sets.** A group is defined by the FXM keys of its members, never by its name. Two keys that cover the same anatomical leaves mean the same tissue, whatever they are called. A group token is the provider's own and is not derived: a `g:` key is resolved only through the vocabulary that defines it, and nothing in the key says whose that is (§12).
- **No muscle list.** FDS publishes the key format, the anchoring rules and what a group means. Which muscles, parts and groups exist is a provider's vocabulary.

### 4.5. What a provider supplies

A provider that encodes its own catalogue supplies: its records, their descriptors and answers records; optionally a movement-word dataset, which an encoder loads and the question flow says where to use; and, for FXM, its muscle vocabulary with anchors and group members. Without a movement-word dataset every exercise can still be encoded, joint by joint.

## 5. Record Fields

This section is normative. Every field is optional. A record that carries none of them is exactly as valid, and means exactly what it meant, under the schema versions this RFC publishes.

| Field | On | Holds |
|---|---|---|
| `fxi` | exercise | The exercise's canonical FXI. |
| `fxe` | exercise | The canonical **standard** FXE of the exercise's main equipment. |
| `fxiProvenance` | exercise | Who answered for the FXI. |
| `fxiGap` | exercise | The owner's note of what the FXI misses, or `null`. |
| `xrefs` | exercise | Links to the same exercise in other catalogues. |
| `fxe` | equipment | The equipment record's canonical FXE, standard or with extended layers. |
| `fxm` | muscle | The muscle record's canonical FXM key. |
| `fxe` | each `equipmentRef` in an exercise | The standard FXE of that piece of equipment. |
| `fxm` | each `muscleRef` in an exercise | The FXM key of that muscle. |

The record-level fields sit at the top level of the record, beside `classification`, and the reference fields on the reference itself; never under `extensions` or `attributes`. They are part of the standard, and a consumer reads them without knowing any vendor's namespace.

### 5.1. Descriptor strings

A producer MUST write each descriptor in canonical form. The schema checks the envelope only: the header (`FXI=`, `FXE=` or `FXM=`, major version 1, then the syntax revision without leading zeros), the flag where the descriptor has one, and a body without whitespace; for FXM, whose grammar is a key, the whole key. It does not check the FXI and FXE grammar or any code; those are the registries', and the conformance vectors' syntax tier tests them. A consumer MUST validate a descriptor against the registries before comparing it, and MUST treat an invalid one as absent.

The schema accepts major version 1 only. A new major of a descriptor is a new major of its grammar, and would need a new schema version to be carried.

An exercise's `fxe` and the `fxe` on its equipment references are always standard (flag `S`). An equipment record's `fxe` MAY carry extended layers (flag `N`).

### 5.2. `fxe` on the exercise, and on its equipment references

They answer different questions. The record-level `fxe` names the exercise's **main equipment**, chosen by the main-equipment rule on the FXE page; it is what the match protocol compares (§7.2). The `fxe` on an `equipmentRef` describes that one listed item. A consumer MUST NOT infer which item is the main one from the order of `equipment.required`.

### 5.3. `fxiProvenance` and `fxiGap`

`fxiProvenance` is one of:

| Value | Meaning |
|---|---|
| `owner` | The owner answered the question flow. |
| `owner-assisted` | Someone else, or software, proposed the answers, and the owner confirmed them. |
| `agent` | Someone else, or software, answered, and the owner did not confirm. |
| `import` | Built from another catalogue's row in import mode. Import mode always writes `import`, and only import mode does. |

An absent `fxiProvenance` is unknown, and is treated like `agent`: it never qualifies a record for auto-match.

`fxiGap` is the owner's plain-text note that the notation misses something that separates this exercise from others. `null`, or no `fxiGap` at all, states that there is none; the schema does not accept an empty string, so write `null`. Any note present is a gap marker, a note of only whitespace included: it blocks auto-match (§7.1), and it is the evidence a later rules revision draws on. A resolver treats every `fxiGap` other than absent or `null` as a gap marker, an empty string included, so an unexpected value never enables an auto-match. A record never carries `false`, which the schema does not accept; a resolver that also takes rows that are not FDS records, as the conformance vectors do, reads `false` there as no gap marker and `true` as one. Prescription is never a gap: a pause, a tempo or a load belongs to RFC-006, not to the exercise.

Neither field means anything without an FXI, and the schema rejects either one on a record that has no `fxi`.

### 5.4. `xrefs`

`xrefs` holds the links between this exercise and the records that describe the same exercise in other catalogues. Each entry is an object with three required members:

| Member | Holds |
|---|---|
| `system` | The catalogue the linked record belongs to. Use the same naming as `metadata.externalRefs[].system`. |
| `id` | The linked record's identifier in that catalogue. |
| `link` | How the link was made: `auto`, by a resolver under §7.1; or `confirmed`, by a person choosing it from a confirm list or stating it directly. |

A record SHOULD carry at most one entry per `system` and `id`.

**Received links are hints, not authority.** The `xrefs` on a record that arrives from another catalogue are its sender's claims: an `auto` entry was made by the sender's resolver, and a `confirmed` one by a person the receiver does not know. A consumer MAY use such an entry as a hint, for example to put the record it names first on a confirm list. It MUST NOT store a received entry as a link of its own, or auto-match on it, without running the match protocol (§7) itself.

**Why not `metadata.externalRefs`.** The two look alike and were kept apart on purpose.

- `externalRefs` lists this record's own identifiers in other systems: where it was imported from, where it is mirrored. It records identity, and says nothing about how it was established.
- `xrefs` records a **decision** that two different catalogues' records describe the same exercise, and how that decision was made. A consumer must be able to tell a link a resolver made from one a person confirmed, and `externalRefs` has no place to say so.
- `externalRefs` is part of `metadata`, which every entity shares and which closes `additionalProperties`. Giving it a `link` member would have been a new version of every entity in the standard, for a distinction only the exercise entity needs today.

`xrefs` therefore reuses the `{system, id}` shape, so a reader learns one pair, and adds `link`.

### 5.5. What this release does not yet carry

In this release `equipmentRef` gains `fxe` and `muscleRef` gains `fxm`, and they carry them only inside the exercise, equipment and muscle entities this release moves. `exerciseRef` does not gain `fxi` now: it occurs only in workout and program, whose published versions are frozen and were not moved here. Workout and program embed `equipmentRef` and `muscleRef` too, and the prescription library embeds `equipmentRef`, so their references cannot yet carry a descriptor either. `fxi` on `exerciseRef`, and `fxe` and `fxm` on the references inside workout, program and the prescription library, are staged for the next version of each of those schemas (§12).

## 6. Compare

Compare takes two FXIs, or two FXEs, and returns `identical`, `refines`, `refined-by`, `compatible`, `contradicting` or `invalid`, overall and per layer. FXM keys compare as `identical`, `contains`, `overlaps` or `disjoint`, by the anatomical leaves each covers. The rules are on [Compare, match and versioning](/docs/core-concepts/descriptors/compare-and-match#compare). An FXM `g:` key compares only with both providers' vocabularies in hand, since its leaves come from the vocabulary that defines it. Compare reads only the strings: never a name, never a movement word. It is not transitive, and a consumer MUST deduplicate only on `identical`.

## 7. Match Protocol

This section is normative. A resolver matches one record, the **query**, against a library.

### 7.1. Auto-match

A resolver MAY link the query to a library record without asking a person only when all of these hold:

1. exactly one library record has an FXI that compares `identical` to the query's;
2. neither the query nor that record carries a gap marker (§5.3);
3. both have `fxiProvenance` `owner` or `owner-assisted`;
4. neither was built in import mode (§7.4). Where a row says the mode it was built in, as an answers record or an encoder's output row does, an import-mode row never auto-matches, whatever its `fxiProvenance` says;
5. when both carry an FXE (§5.2), the two FXEs compare `identical` (§6). An FXE that only refines the other, or holds `?`, is not identical. A record without an FXE leaves this condition to the FXI. Two machines that differ only where the FXI does not look, such as a seated cable row with a foot plate and a chest-supported row machine, can give the same FXI; they never auto-match on it.

The link is stored in the query's `xrefs` with `link: "auto"`. In every other case a resolver MUST NOT link without a person. Where a row says its mode, a resolver MUST refuse a row whose `fxiProvenance` contradicts it (an import-mode row with any provenance but `import`, or `import` outside import mode) rather than match it.

### 7.2. Confirm

Otherwise the resolver offers a confirm list: at most three library records, each at most once, with the reason auto-match was refused. The list is filled in three steps, each record taking the first place it qualifies for:

1. **FXI candidates**, by relation: `identical`, then `refines` or `refined-by`, then `compatible`. Within one relation: more standard layers `equal` first; then, when both records carry an FXE, an identical FXE before a refining one before any other; then name similarity; then library order.
2. **Near-compatible**: records that contradict the query in exactly one standard layer, which the list names. By name similarity, then library order.
3. **Name candidates**: the rest, by name similarity, then library order.

A link a person picks is stored in the query's `xrefs` with `link: "confirmed"`. How name similarity is scored is an implementation's choice; the conformance vectors rank by name only where any reasonable score agrees.

### 7.3. Absent

The result is absent only when the library is empty. A library with records always offers a list.

### 7.4. Import mode

A descriptor built in import mode is for candidate search only. It MAY place records on a confirm list. It MUST NOT take part in an auto-match on either side, and this standard makes no accuracy claim for it.

## 8. Versioning

### 8.1. The descriptors

- **Two numbers, kept apart.** The string header carries the major version and the syntax revision; the syntax revision moves only when the grammar does. The rules revision is the revision of the vocabularies and layer rules, and is not written in the string.
- **Refinement only, within a major.** A rules revision may add a code, split a code into children that its old code then covers, add a layer that older strings read as `?`, add a table entry where the old reading was `?`, or give a published default to a layer whose absence was open. It never removes a code, never changes what a code means, and never changes an existing default. Every string valid under one rules revision stays valid under the next, and two strings that were `identical` stay `identical`.
- **Defaults are forever.** A string that leaves a layer at its default means the same thing under every later rules revision of its major.
- **One rules revision per release.** A release of the standard carries at most one new rules revision, and each new ruling in it rests on at least two failing cases from at least two catalogues.
- **Answers are stored.** A producer SHOULD keep each record's answers record: the question ids and the options chosen, the movement word and the movement-word dataset it came from, if any, the provenance and the gap marker. When a rules revision refines a reading, an upgrade rebuilds every string from its stored answers rather than asking anyone again. A string with no stored answers stays valid as written.

### 8.2. The schemas

Release **1.6.0** carries the fields of §5. It moves exercise and equipment to 1.2.0 and muscle to 1.1.0; every other entity, and the prescription library, stays where release 1.5.0 named it. Every change is an optional addition, so every document valid under the previous versions is valid under the new ones, and the superseded versions stay published and frozen.

Release 1.6.0 is proposed with this RFC and is not published while the RFC is a draft. The change that accepts this RFC freezes exercise 1.2.0, equipment 1.2.0 and muscle 1.1.0 and dates the release's changelog entry, in one merge. Until then the site and the packages are not published from a tree whose current release is unfrozen or undated.

## 9. Evidence

The conformance vectors say whether an implementation computes what this specification says. They cannot say whether people and programs describe exercises well enough for the match protocol to be useful. That is measured, and published here as measurements, not as a pass or a fail.

### 9.1. Method

- **Encoders.** Two encoders, both software agents, encoded the library and the queries independently, without seeing each other's output. They worked in owner mode as stand-ins for the catalogues' owners, so their rows carried owner provenance and could auto-match: the auto-match figures below simulate owners encoding their own catalogues. A calibration with people encoding is pending (§9.4).
- **Queries.** 624 scored queries in six parts, none sharing a name with the library it was matched against: rows authored in French, in Italian and in Portuguese; real non-English rows from third-party catalogues; gym jargon; and renamed exercises. 496 have their exercise in the library and 128 do not. The **real parts** are the last three, 174 queries: 136 in the library and 38 absent.
- **When.** The test ran on 2026-11-24, under rules revision 1.3.
- **Runs.** Cross-encoder: the queries one encoder built were matched against the library the other built, and the other way round. Each figure is the mean of the two runs.
- **Resolver.** The match protocol of §7, as the reference encoder implements it, fixed before the queries were encoded.
- **Measures.** *Top-3 recall* is the share of in-library queries whose right record is linked automatically or listed in the top three of the confirm list; its denominator is the in-library queries. *Wrong auto-matches* is the share of all scored queries, in the library or not, that were linked automatically to a wrong record; an absent query linked to anything is wrong.
- **Intervals.** Brackets give 95% Wilson score intervals. For the mean of the two runs, the interval uses the pooled rate and the denominator of one run.
- **Data.** The queries, the libraries and the encoded rows stay with the provider that ran the test, because they contain third-party catalogue text. The method and the scorer are described here so the test can be repeated on another set.

### 9.2. Name-disjoint re-test

| Measure | All parts (624) | Real parts only (174) |
|---|---|---|
| Top-3 recall: the right record is linked or on the confirm list | 98.4% [96.8–99.2] | 96.3% [91.7–98.4] |
| Wrong auto-matches | 2.1% [1.2–3.5] | 3.4% [1.6–7.3] |

On the same set, matching by name with translation reached a top-3 recall of 88.3% when it answered absent below a fixed similarity cut-off, and 93.3% when it always offered a list, with 1.1% wrong auto-matches.

### 9.3. Separation and agreement

- **Separation of close variants**: on 98 authored pairs of exercises that differ in one detail, the descriptors kept 98.0% of pairs apart.
- **Encoder agreement**: two encoders encoding the same real row wrote the same whole string in about 78% to 95% of rows, depending on the set.

### 9.4. Pending

- **Person-encoded calibration**: owners against encoders, on the same rows. *Pending — not yet measured.*

### 9.5. The release gate

RFC-010 is accepted only when a test run as §9.1 describes, on a fresh name-disjoint set of queries none of the earlier tests used, with cross-encoder runs, meets both, on all parts and on the real parts:

- wrong auto-matches **at most 2%**;
- top-3 recall **at least 98%**.

The gate is read on the point estimate. The intervals are reported beside it, so a reader can see how far the result could move.

**The gate is not yet met.** Wrong auto-matches are above it on all parts (2.1%), and both measures miss it on the real parts (3.4% and 96.3%). Top-3 recall on all parts (98.4%) meets it. These figures were measured under rules revision 1.3, before §7.1 required identical FXEs; the test that decides the gate runs under rules revision 1.4.

## 10. Implementation Guidance

### 10.1. Producers

- Encode through the question flow, and store the answers record beside each string.
- Write `fxiProvenance` truthfully. Software that proposes answers writes `agent` until the owner confirms, and then `owner-assisted`. Never write `owner` for answers the owner did not give.
- Write `fxiGap` whenever the vocabulary cannot say a difference that matters. It costs an auto-match and buys a better rules revision.
- On an exercise, write the record-level `fxe` for the main equipment even when the equipment references also carry one.

### 10.2. Consumers

- Validate every descriptor against the registries before use. Treat an invalid one as absent.
- Treat the `xrefs` a received record carries as the sender's hints (§5.4). Run the match protocol yourself before storing a link of your own.
- Do not treat two `compatible` or `refines` FXIs as the same exercise; only a person confirms that.

### 10.3. Resolvers

- Follow §7 exactly. An auto-match outside §7.1 is non-conforming, however confident the resolver is.
- Show the reason auto-match was refused beside the confirm list.
- Store every confirmed link.

## 11. Security and Privacy Considerations

A descriptor describes an exercise, a piece of equipment or a muscle. It describes no person, and none of the fields this RFC adds can hold a personal value: the owner in `fxiProvenance` is a catalogue, and `xrefs` links catalogue records to catalogue records. A document carrying these fields can be published, cached, mirrored and diffed exactly as before.

`fxiGap` is free text written by a catalogue owner. Consumers SHOULD treat it as untrusted text, as they treat any description.

An `xrefs` entry on a received record is the sender's claim, whether `auto` or `confirmed`: a wrong link, made by mistake or on purpose, would otherwise spread from one catalogue to every catalogue that copies it. §5.4 therefore makes received links hints, and only a link the receiver's own resolver or person makes is stored as the receiver's.

## 12. Open Items

**Conditions for acceptance.** RFC-010 stays a draft until each of these holds:

1. **Auto-match also requires the equipment to match.** When both records carry an FXE, auto-match requires them to be `identical`. Met: §7.1, condition 5. The figures of §9 were measured without it.
2. **One rules revision closes the recorded notation gaps.** The gap markers and contradictions recorded so far are resolved in a single rules revision, under the refinement rules of §8.1. Met: rules revision 1.4 (§4).
3. **A fresh name-disjoint test passes the release gate** of §9.5, on queries none of the earlier tests used, under rules revision 1.4. Not yet met.

**Staged.** `exerciseRef` carries `fxi`, and the references inside workout, program and the prescription library carry `fxe` and `fxm`, from the next version of each of those schemas (§5.5).

**Open.**

1. **Whose group an FXM key names.** A muscle or part key derives from FMA and means the same in every vocabulary (§4.4). A `g:` key does not: it is resolved only through the vocabulary of the provider that defined it, and neither the key nor the record names that vocabulary. How a record or a document says which vocabulary its group keys come from is not decided.
2. **Exchange shapes.** Where a provider publishes its FXM vocabulary, with the shape of a vocabulary entry; and the answers record. The reference encoder's `--muscles` input and the answers record on the question flow page are the working shapes.

**Deliberately undecided.** The boundary between an open encoder and a provider's matching service, and whether mechanics, force or pattern are derived from the key (§1.3).

## 13. JSON Schema Reference

- **Exercise**: `https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.schema.json`
- **Equipment**: `https://spec.vitness.me/schemas/equipment/v1.2.0/equipment.schema.json`
- **Muscle**: `https://spec.vitness.me/schemas/muscle/v1.1.0/muscle.schema.json`
- **Shared definitions**: the common schema, version 1.1.0, defines `fxi`, `fxe`, `fxeStandard` (the standard-only FXE an exercise and an equipment reference carry), `fxm`, `fxiProvenance` and `xref`; the build copies them into each entity schema.
- **Registries**: `specification/registries/descriptors/fxi.registry.json` and `fxe.registry.json`
- **Conformance vectors**: `specification/descriptors/conformance/`

### 13.1. Validation

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.2.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.2.0/exercise.example.descriptors.json
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/equipment/v1.2.0/equipment.schema.json \
  -d specification/schemas/equipment/v1.2.0/equipment.example.descriptors.json
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/muscle/v1.1.0/muscle.schema.json \
  -d specification/schemas/muscle/v1.1.0/muscle.example.descriptors.json
```

## 14. Examples

An exercise its owner encoded, with one link a resolver made and one a person confirmed. The barbell and the quadriceps carry their descriptors; the rack and the erector spinae do not, because every field is optional.

```json
{
  "schemaVersion": "1.2.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440010",
  "canonical": { "name": "Back Squat", "slug": "back-squat" },
  "classification": {
    "exerciseType": "strength",
    "movement": "squat",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate"
  },
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "name": "Quadriceps", "categoryId": "cat.legs", "fxm": "FXM=1.0/quadriceps-femoris" }
    ],
    "secondary": [
      { "id": "mus.erectorSpinae", "name": "Erector Spinae", "categoryId": "cat.back" }
    ]
  },
  "equipment": {
    "required": [
      { "id": "eq.barbell", "name": "Barbell", "fxe": "FXE=1.0S/k:imp/f:bar.straight" },
      { "id": "eq.rack", "name": "Power Rack" }
    ]
  },
  "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back",
  "fxe": "FXE=1.0S/k:imp/f:bar.straight",
  "fxiProvenance": "owner",
  "fxiGap": null,
  "xrefs": [
    { "system": "example-catalog", "id": "vx-0001", "link": "auto" },
    { "system": "partner-gym", "id": "squat-back-bb", "link": "confirmed" }
  ],
  "metrics": { "primary": { "type": "reps", "unit": "count" } },
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "active"
  }
}
```

An exercise built in import mode from another catalogue's row, before its owner has answered anything. It can put records on a confirm list and never auto-matches. It carries no gap marker, because only an owner writes one.

```json
{
  "schemaVersion": "1.2.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440011",
  "canonical": { "name": "Seated Cable Row", "slug": "seated-cable-row" },
  "classification": {
    "exerciseType": "strength",
    "movement": "pull-horizontal",
    "mechanics": "compound",
    "force": "pull",
    "level": "beginner"
  },
  "targets": {
    "primary": [
      { "id": "mus.lats", "name": "Latissimus Dorsi", "categoryId": "cat.back", "fxm": "FXM=1.0/latissimus-dorsi" }
    ]
  },
  "fxi": "FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne",
  "fxe": "FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back",
  "fxiProvenance": "import",
  "metrics": { "primary": { "type": "reps", "unit": "count" } },
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "draft"
  }
}
```

An equipment record, with the extended layers only an equipment record carries, and a muscle record:

```json fds:document entity=equipment
{
  "schemaVersion": "1.2.0",
  "id": "eq.seated-row-machine",
  "canonical": { "name": "Seated Row Machine", "slug": "seated-row-machine" },
  "fxe": "FXE=1.0N/k:mac/l:hand/s:seat/m:pull.back/r:stack/c:cable",
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "active"
  }
}
```

```json fds:document entity=muscle
{
  "schemaVersion": "1.1.0",
  "id": "mus.lats",
  "canonical": { "name": "Latissimus Dorsi", "slug": "latissimus-dorsi" },
  "classification": { "categoryId": "cat.back", "region": "upper-back", "laterality": "bilateral" },
  "fxm": "FXM=1.0/latissimus-dorsi",
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "active"
  }
}
```

Answers records and their exchange shape are shown on the [question flow](/docs/core-concepts/descriptors/question-flow) page.

## Conformance

**A conforming producer:**

:::danger MUST
- **MUST** write every descriptor in canonical form, in the field §5 defines for it: a record-level field at the top level of the record, a reference field on the reference.
- **MUST** write `fxiProvenance` as it happened, and `import` for every descriptor built in import mode.
- **MUST** derive FXM muscle and part tokens from their FMA labels (§4.4). Neither the schema nor the conformance vectors can check this, so a token derived wrongly shows only as two providers' keys that disagree for the same muscle.
- **MUST NOT** present a descriptor as an identifier, or describe the descriptors as identification (§3).
- A producer that builds descriptors from answers records **MUST** pass the `syntax` and `builder` tiers of the conformance vectors at 100%.
:::

**A conforming resolver:**

:::danger MUST
- **MUST** pass the `syntax`, `compare` and `resolver` tiers of the conformance vectors at 100%. The `builder` tier is not required of a resolver.
- **MUST** auto-match only under §7.1, and store every link it makes or a person confirms in `xrefs` with the right `link`.
- **MUST NOT** auto-match on a descriptor built in import mode, and **MUST** refuse a row whose provenance contradicts its mode (§7.1).
- **MUST** offer a confirm list for every query against a non-empty library that it does not auto-match.
:::

**A conforming consumer:**

:::danger MUST
- **MUST** accept a record that carries none of these fields, and a record that carries any of them.
- **MUST** validate a descriptor against the registries before comparing it, and treat an invalid one as absent (§5.1).
- **MUST NOT** infer which equipment is the main one from the order of `equipment.required` (§5.2).
- **MUST** deduplicate only on `identical` (§6).
- **MUST NOT** store a received `xrefs` entry as a link of its own, or auto-match on it, without running the match protocol itself (§5.4).
:::

The conformance vectors pin the behaviour of the reference encoder: each expected output is what it computes. Passing them shows that an implementation agrees with the reference, not that the reference is right; a rule the reference gets wrong is corrected in both, under a new rules revision.

## 15. References

### 15.1. Normative References

- RFC 2119 — Key words for use in RFCs
- RFC-001 — Exercise Data Model
- RFC-002 — Equipment Data Model
- RFC-003 — Muscle Data Model
- The descriptor pages: [Overview](/docs/core-concepts/descriptors/overview), [FXI](/docs/core-concepts/descriptors/fxi), [Question flow](/docs/core-concepts/descriptors/question-flow), [FXE](/docs/core-concepts/descriptors/fxe), [FXM](/docs/core-concepts/descriptors/fxm), [Compare, match and versioning](/docs/core-concepts/descriptors/compare-and-match), [Conformance](/docs/core-concepts/descriptors/conformance)
- JSON Schema Draft 2020-12
- Foundational Model of Anatomy (FMA), the ontology FXM anchors every muscle and part to, and whose labels its tokens derive from (§4.4)

### 15.2. Informative References

- UBERON, the anatomy ontology FXM carries as a cross-reference
- RFC-006 — Prescription Primitives, which owns everything a descriptor leaves out

### 15.3. Implementation

The reference implementation of this RFC is `@vitness/fds-encoder`, in `packages/fds-encoder/` of this repository. The transformer's optional descriptor steps are built from it.
