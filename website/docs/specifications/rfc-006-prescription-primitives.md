---
title: 'RFC-006: Prescription Primitives'
description: Definition library for load targets, rep targets, tempo, rest, intensity zones, set schemes and progression rules
sidebar_position: 6
keywords: [prescription, load target, rpe, percent 1rm, tempo, rest, progression, data model, json schema, rfc]
---

# RFC-006: Prescription Primitives Specification

**Status**: Draft
**Version**: 0.1.0
**Date**: 2026-08-07
**Authors**: VITNESS Team
**Category**: Standards Track

## Abstract

This specification defines the primitive structures used to prescribe training: how much load, how many repetitions, at what tempo, with how much rest, in what intensity zone, arranged in what set pattern, and progressed by what rule.

Unlike RFC-001 through RFC-005, this RFC does **not** define an entity. Nothing is ever "a prescription document". It publishes a definition library that RFC-007 Workout and RFC-008 Program compose. Factoring these structures out is what stops load-prescription semantics from drifting between a single session and a multi-week program — the two places where the same concept would otherwise be modelled twice.

## 1. Introduction

### 1.1. Background

RFC-001 defines an exercise as a catalog entry. Its `metrics` block declares *shapes with no values* — "this movement is measured in reps and weight" — never "eight reps at one hundred kilograms". That is deliberate, and it is the seam this RFC builds on: prescription attaches values to the shapes an exercise declares.

The difficulty is that "how much load" has no single representation. A powerlifting program says 82.5% of a training max. A hypertrophy block says RPE 8. A machine circuit says level 7. A calisthenics progression says bodyweight with 20 kg of assistance. A velocity-based session says stop when bar speed drops 20%. These are not variations of a number; they are different *kinds* of instruction, resolvable only against different context.

Modelling them as a single nullable `weight` field loses the distinction. Modelling them separately in Workout and again in Program guarantees the two drift.

### 1.2. Goals

1. Represent every load-prescription method in §4.3 of the scenario matrix without loss.
2. Keep the representation validatable — a discriminated union that a JSON Schema validator can actually check.
3. Remain forward-compatible: a document using a method defined after this version MUST NOT be rejected wholesale.
4. Make the resolution requirements explicit, so a consumer knows what it must supply before a relative prescription becomes an absolute one.
5. Define these structures once, for use by both RFC-007 and RFC-008.

### 1.3. Scope

**In Scope:**

- Load targets, repetition targets, tempo, rest specifications, intensity zones, set schemes and progression rules
- The discrimination and forward-compatibility rules that govern them
- The context a consumer must supply to resolve a relative prescription

**Out of Scope:**

- Workout structure — blocks, grouping, supersets, circuits (RFC-007)
- Program structure — cycles, weeks, scheduling (RFC-008)
- Performed data — what an athlete actually did (RFC-009, deferred)
- Athlete identity, bodyweight, training maxes or heart-rate boundaries. FDS models no person; see §5.

## 2. Terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are to be interpreted as described in RFC 2119.

- **Prescription** — an instruction about how to perform work, independent of any athlete.
- **Load target** — the instruction determining how much resistance a set uses.
- **Rep target** — the instruction determining what terminates a set.
- **Resolution context** — values a consumer must supply to convert a relative prescription into an absolute one.
- **Definition library** — a published schema whose purpose is to be referenced, not instantiated.

## 3. Core Structural Requirements

### 3.1. This is a library, not an entity

The published schema carries no `schemaVersion`, no identifier and no `metadata` block, because it describes no document. Its root is deliberately unsatisfiable:

```json
{ "not": {} }
```

Validating any document against the library root fails by construction. This is a guardrail, not an inconvenience: a library whose root accepted everything would silently pass any document handed to it, and a consumer would take that as confirmation. Reference a definition instead:

```json
{ "$ref": "https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json#/$defs/loadTarget" }
```

Because published FDS schemas are self-contained (see the authoring guide), RFC-007 and RFC-008 will carry flattened copies of the definitions they use. Implementers validating a Workout never need to fetch this file.

### 3.2. Discrimination, and why the catch-all branch is shaped as it is

`loadTarget`, `repTarget` and `restSpec` are discriminated unions: a `method` or `kind` field selects which payload applies. Per D8, structural discriminators cannot be open strings — an open discriminator cannot validate, because no branch is selected and either all of them match or none do.

Each union therefore enumerates its known members with typed payloads, and adds one final branch for values this version does not define. That branch MUST exclude the known values:

```json
{
  "type": "object",
  "required": ["method"],
  "properties": {
    "method": { "type": "string", "not": { "enum": ["absolute", "percent1RM", "…"] } }
  }
}
```

The `not`/`enum` is load-bearing. Without it, `{ "method": "absolute", "value": 100, "unit": "kg" }` matches both the `absolute` branch and the catch-all, two branches match, and `oneOf` fails — so a correct document would be rejected. Worse, a *malformed* known method would fall through to the permissive branch and validate, which is the silent-pass failure this standard exists to avoid.

Implementations extending these unions MUST maintain that disjointness.

### 3.3. Unknown methods are ignored, never guessed

A consumer encountering a `method` it does not understand MUST ignore that load target and SHOULD warn. It MUST NOT substitute a default, fall back to a previous set's load, or infer a value from surrounding context.

This is stronger than the warn-don't-reject rule that governs classifiers elsewhere in FDS, and deliberately so. An unrecognised `exerciseType` produces a mislabelled exercise. A guessed load produces a barbell someone tries to lift. Silently inventing a working weight is a physical-safety problem, not a data-quality one.

## 4. Reference Structures

### 4.1. `loadTarget`

Thirteen defined methods plus the forward-compatibility branch. All methods except `bodyweight`, `autoregulated` and `none` accept an optional `range` for prescriptions given as a band rather than a point.

| `method` | Payload | Resolvable from the document alone? |
|---|---|---|
| `absolute` | `value`, `unit` (`kg`\|`lb`) | Yes |
| `percent1RM` | `value`, optional `referenceExerciseId` | No — needs a 1RM |
| `percentBodyweight` | `value` | No — needs a bodyweight |
| `rpe` | `value` 1–10, optional `allowHalf` | Yes (the athlete resolves it) |
| `rir` | `value` 0–10 | Yes (the athlete resolves it) |
| `velocity` | `value`, `unit` (`m_s`), optional `lossThreshold` | Yes, with instrumentation |
| `level` | `value`, optional `scale` | Yes, on that machine only |
| `bandResistance` | optional `equipment`, `colour`, `estimatedLoad` | Partially |
| `assisted` | `value`, `unit` | Yes |
| `relative` | `basis`, `delta`, `deltaUnit` | No — needs history |
| `bodyweight` | — | Yes |
| `autoregulated` | `progressionRuleRef` | No — needs rule state |
| `none` | — | Yes |

Three of these carry semantics a consumer can get wrong in a way validation cannot catch:

**`percent1RM` with `referenceExerciseId`** expresses "70% of your back squat one-rep max" on an exercise that is not the back squat — the common case in accessory work and in percentage-driven programs where every lift is scaled off a few reference lifts. Absent, the reference is the prescribed exercise itself.

**`assisted`** carries the magnitude of assistance as a positive number. More assistance is *less* effort. A consumer plotting load over time MUST invert the sense for assisted targets, or it will show an athlete regressing as they get stronger. This method is only meaningful on an exercise whose `loading.assisted` is true (RFC-001 §4.6).

**`level`** is opaque. It reproduces a setting on one machine and means nothing anywhere else. It MUST NOT be converted to load or compared across machines or facilities.

### 4.2. `repTarget`

What terminates a set: `fixed`, `range`, `amrap`, `toFailure`, `time`, `distance`, `calories`, `maxHold`, plus the forward-compatibility branch.

`toFailure` carries `technical`, distinguishing "stop when form degrades" from "stop when the rep cannot be completed" — a difference every strength coach makes and no prior interchange format records.

`amrap` accepts both a `min` floor and a `cap`. The floor is what the program expects; the cap prevents a set that would otherwise run for several minutes.

### 4.3. `tempo`

Per-phase timing in seconds, in the conventional order: `eccentric`, `bottomPause`, `concentric`, `topPause`. A phase MAY be the string `"X"`, meaning explosive — as fast as possible rather than a specific duration.

This was previously expressible only as the `x:vitness.tempo` extension in RFC-001. It is promoted to a core primitive here because tempo is a prescription concern, not a catalog one: the same exercise is prescribed at different tempos in different blocks.

Note the distinction from the `tempo` metric type in RFC-001, which records the count convention (3‑1‑1) as a logged value. Sub-second per-phase timing is `duration` in `ms`.

### 4.4. `restSpec`

`method` is one of `fixed`, `range`, `toHeartRate`, `asNeeded`, `ratio`.

`appliesTo` is REQUIRED, and is the field most likely to be omitted by an implementer porting from a simpler format. Rest binds to one of four boundaries — `set`, `group`, `round`, `block` — and the same block routinely carries several: thirty seconds between superset members, three minutes between rounds. A bare duration is ambiguous, and the ambiguity is not recoverable by inspection.

`ratio` expresses work-to-rest as two numbers resolved against the duration of the work interval, so a 1:2 ratio after a 40-second effort means 80 seconds.

### 4.5. `intensityZone`

`{ system, zone, boundsRef? }` where `system` is `heartRate`, `power`, `pace` or `perceived`.

`zone` is a label, not a value. "Z4" means nothing without the boundaries that define it, and those boundaries are personal. `boundsRef` identifies the zone-registry entry the label belongs to; without it, a zone label is only meaningful inside the producer that wrote it.

### 4.6. `setScheme`

A named pattern and its parameters, for prescriptions that describe a shape rather than enumerating every set: `straight`, `ramping`, `reversePyramid`, `drop`, `restPause`, `cluster`, `myoReps`, `wave`, `ladder`, `density`, `topSetBackoff`.

Unlike the load and rep unions, `pattern` is a **closed** enum with no catch-all. Expanding a pattern into concrete sets requires knowing its semantics, so a consumer cannot do anything useful with a pattern it has never heard of — accepting one would only defer the failure to the point where it matters. Producers using a pattern not listed here MUST expand it into explicit sets instead.

`params` is deliberately open: each pattern takes a different shape, and constraining them all here would freeze the parameter vocabulary of eleven distinct methodologies in a version 1.0.0.

### 4.7. `progressionRule`

`{ id, trigger, action }`. Triggers cover completion (`allRepsCompleted`, `topOfRepRange`), effort (`rpeBelow`, `rirAbove`, `amrapThreshold`), time (`sessionsCompleted`) and failure (`failedAttempts`). Actions cover load, reps, sets, `deload`, `retest`, `advanceStage` and `hold`.

The same rule structure is consumed by RFC-007, where progression applies within a session, and RFC-008, where it applies across a cycle. That is the whole reason it is defined here rather than in either.

## 5. Resolution Context

Most load targets are *relative*. They become an absolute instruction only when combined with values FDS deliberately does not carry, because FDS models no person (D6: there is no User or Profile entity, and adding one would drag consent and retention into every reference document).

This section names every such input. A consumer that intends to render absolute loads MUST be able to supply the context for the methods it encounters, and MUST NOT fabricate a value it lacks.

### 5.1. What each method requires

| Method | Required context | Where it comes from |
|---|---|---|
| `absolute` | none | — |
| `bodyweight`, `none` | none | — |
| `rpe`, `rir` | none at render time | The athlete resolves it during the set |
| `percent1RM` | A one-rep max for the prescribed exercise, or for `referenceExerciseId` when present | Caller. RFC-008 `references.trainingMaxes[]` declares *which* lifts a program needs and by what method they are computed — the slots, never the values |
| `percentBodyweight` | The athlete's bodyweight | Caller only. **Not representable in FDS at all** |
| `relative` | Prior training history: last session's load, an estimated 1RM, or a training max | Caller's training log |
| `autoregulated` | The current state of the referenced progression rule | Caller's execution state |
| `velocity` | Live bar-speed measurement | Instrumentation at execution time |
| `level` | The specific machine | Physical context; not portable |
| `bandResistance` | The manufacturer's colour scale | `equipment`, plus caller knowledge of that scale |
| `intensityZone` | Personal zone boundaries | Caller. The zone registry defines the *system*; the numbers are personal |

Two entries deserve emphasis because they are the ones most often assumed away:

**Bodyweight is not in FDS and will not be.** A `percentBodyweight` target is unresolved without a value the caller supplies at render time. There is no field to put it in, by design — a bodyweight is personal data, and admitting one would make every document carrying it subject to the obligations RFC-009 exists to handle.

**Training maxes are slots, not values.** RFC-008 lets a program declare that it references a back-squat training max computed by a stated method. It never carries the number. A fully personalised program therefore cannot round-trip as one self-contained document: export is the template plus a separate resolution context. That trade-off is accepted deliberately, and it is what keeps RFC-006 through RFC-008 free of personal data.

### 5.2. Determining what a document needs

Neither a Workout nor a Program declares its resolution requirements in a single place. A consumer determines them by walking every `loadTarget` and `intensityZone` in the document and collecting the union of the context above.

Consumers SHOULD perform that walk **before** presenting a session, so that missing context is reported up front rather than discovered set by set. A program that needs a bench-press one-rep max should say so when it is loaded, not in the middle of the third exercise.

### 5.3. When context is missing

A consumer that cannot resolve a target MUST NOT substitute a default, carry forward a previous set's load, or estimate from a related lift. It SHOULD present the prescription as written — "70% 1RM" is honest and actionable; a fabricated number is neither.

This restates §3.3 for a different failure: §3.3 governs a method that is not *understood*, this governs a method that is understood but not *resolvable*. Both resolve the same way, and for the same reason — the cost of a wrong load is borne by a person under a barbell.

## 6. Versioning and Compatibility

This library follows the versioning rules in RFC-001 §5. Its published URL is a frozen contract: the bytes at `prescription/v1.0.0/prescription.schema.json` will not change. Additions ship as a new minor version at a new URL.

Adding a method to a discriminated union is a MINOR change: documents valid under the old version remain valid, because the new method previously validated through the catch-all branch. That is the compatibility property the catch-all exists to provide, and it is why the branch is specified rather than left to implementations.

Removing a method, or narrowing an existing payload, is a MAJOR change.

## 7. Implementation Guidance

### 7.1. Producers

Prefer the most specific method that expresses the intent. A program that thinks in percentages SHOULD emit `percent1RM` rather than pre-resolving to `absolute`, because the percentage is the instruction and the kilograms are one athlete's rendering of it. Pre-resolution discards the information that makes a program portable.

Emit `none` when load is deliberately unprescribed. Omitting `load` entirely means unstated, which is a different claim.

### 7.2. Consumers

Resolve in this order: check the method is understood; if not, ignore and warn. Then gather the context §5 requires. Then round the resolved value to the implement's increment (`equipment.loading.increment`, RFC-002 §4.4) rather than presenting a load nobody can assemble.

A consumer that cannot resolve a target SHOULD surface the prescription as written — "70% 1RM" is more useful to an athlete than a blank field or a fabricated number.

### 7.3. Validation

Because the library root is unsatisfiable, validate fragments against the definition they claim to be. The reference implementation composes a wrapper schema — the library plus a root `$ref` at the named definition — which is what `scripts/check-prescription.mjs` does in this repository.

## 8. Security and Privacy Considerations

This library defines reference data and contains no personal data by construction. That is a property worth preserving deliberately: every method that *would* require personal data — `percent1RM`, `percentBodyweight`, `relative`, `intensityZone` — references it rather than carrying it. The 1RM, the bodyweight, the training history and the zone boundaries all live in the consumer's resolution context.

This keeps RFC-006, RFC-007 and RFC-008 free of PII, and makes the RFC-009 boundary crisp: everything before RFC-009 is reference data; RFC-009 is where personal data begins, with the consent and retention obligations that follow.

An implementation that embeds resolved personal values into a prescription — writing an athlete's actual kilograms into what was a percentage — moves that document across the boundary and inherits those obligations.

## 9. JSON Schema Reference

`https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json`

### 9.1. Validation

```bash
# Fragments, not documents — the library root accepts nothing.
npm run check:prescription
```

## 10. Example

A top set at RPE 8 followed by back-off sets at a percentage of a different lift, with a four-second eccentric and three minutes of rest between sets:

```json
{
  "load": { "method": "rpe", "value": 8, "allowHalf": true },
  "reps": { "kind": "range", "min": 3, "max": 5 },
  "tempo": { "eccentric": 4, "bottomPause": 1, "concentric": "X", "topPause": 0 },
  "rest": { "method": "fixed", "appliesTo": "set", "value": 3, "unit": "min" },
  "scheme": {
    "pattern": "topSetBackoff",
    "sets": 4,
    "params": { "backoffPercent": 10, "backoffSets": 3 }
  }
}
```

Worked examples for every method in §4.1 are published alongside the schema.

## Conformance

An implementation conforms to this specification if it:

1. Accepts every method and kind defined in §4, including through the forward-compatibility branch.
2. Ignores load targets whose method it does not understand, warns, and does not substitute a value.
3. Preserves the distinction between an absent `load` and `{ "method": "none" }`.
4. Treats `assisted` load as assistance rather than resistance when computing or displaying effort.
5. Does not compare or convert `level` values across machines.
6. Requires `appliesTo` on every rest specification it emits.

## 11. References

### 11.1. Normative References

- RFC 2119 — Key words for use in RFCs
- RFC-001 — Exercise Data Model (metric shapes, loading characteristics)
- RFC-002 — Equipment Data Model (load increments)
- JSON Schema Draft 2020-12

### 11.2. Informative References

- RFC-007 — Workout Data Model (consumer of this library)
- RFC-008 — Training Program Data Model (consumer of this library)
- `specification/metrics-guide.md` — metric type/unit pairings
