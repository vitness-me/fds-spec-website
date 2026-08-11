---
title: 'RFC-007: Workout Data Model'
description: Prescribed training sessions — blocks, execution modes, grouping and per-set prescription
sidebar_position: 7
keywords: [workout, session, superset, circuit, emom, amrap, tabata, data model, json schema, rfc]
---

# RFC-007: Workout Data Model Specification

**Status**: Draft
**Version**: 0.2.0
**Date**: 2026-08-10
**Authors**: VITNESS Team
**Category**: Standards Track

## Abstract

This specification defines a standardized model for a single prescribed training session — a workout. It covers how exercises are ordered and grouped, how each is prescribed, and how the session is meant to be executed.

The central claim is structural: **a workout is blocks of items, and how a block is executed is a property of the block, not a different kind of document.** Straight strength work, supersets, circuits, EMOM, AMRAP, Tabata and interval training are all expressed by the same schema, differing only in `blocks[].mode`. No training style gets a schema of its own.

Prescription itself — how much load, how many reps, what tempo, how much rest — is not defined here. It comes from RFC-006, so that a set in a standalone workout and the same set inside a twelve-week program mean exactly the same thing.

## 1. Introduction

### 1.1. Background

Interchange formats for training sessions have historically modelled one methodology well and the rest badly. A format built around sets and reps cannot express an AMRAP; a format built around rounds and time caps cannot express a top set with back-offs. Applications work around this with per-style fields — `isCircuit`, `emomInterval`, `tabataRounds` — until the model is a union of special cases and no two implementations agree on which apply together.

The observation this RFC is built on is that these styles differ in **how a group of exercises is executed**, not in what an exercise or a set is. A circuit and a set of straight sets contain the same items with the same prescriptions; they differ in traversal order and termination. Once execution is a property of a block, the special cases collapse.

### 1.2. Goals

1. Express every grouping structure in §4.2 of the scenario matrix, and every set and rep scheme in §4.1, without per-style fields.
2. Compose RFC-006 prescription primitives rather than restating them.
3. Keep the session prescriptive: a workout describes intended work, never performed work.
4. Remain forward-compatible — a mode defined after this version MUST NOT invalidate the document.
5. Contain no personal data.

### 1.3. Scope

**In Scope:** session structure, block execution modes, grouping, per-item and per-set prescription, sanctioned substitutions, advisory rollups.

**Out of Scope:**

- Prescription primitives themselves (RFC-006)
- Multi-session structure: cycles, weeks, scheduling, periodization (RFC-008)
- Performed data — what was actually done, and by whom (RFC-009, deferred)
- Athlete identity, bodyweight, one-rep maxes. See RFC-006 §5.

## 2. Terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are to be interpreted as described in RFC 2119.

- **Workout** — one prescribed session.
- **Block** — a contiguous section of a session executed under one mode.
- **Item** — one exercise within a block, with its prescription.
- **Mode** — how a block is executed: the traversal order of its items and what ends the block.
- **Group** — items within a block performed together, identified by a shared `groupLabel`.

## 3. Core Structural Requirements

### 3.1. Required fields

`schemaVersion`, `workoutId`, `canonical`, `classification`, `structure` and `metadata`. The envelope — `canonical`, `metadata`, `attributes`, `extensions`, closed `additionalProperties` at the top level — is inherited unchanged from RFC-001.

`structure.blocks` MUST contain at least one block, and every block MUST contain at least one item. An empty session is not a workout; it is a mistake that validates.

### 3.2. Blocks and modes

A block carries `mode`, and `mode` decides three things a consumer cannot infer otherwise:

1. **Traversal** — whether all sets of item one precede item two (`sequential`), or one set of each is taken per pass (`circuit`, `superset`).
2. **Termination** — whether the block ends when the prescribed work is done (`sequential`, `forTime`) or when a clock expires (`amrap`, `emom`, `tabata`).
3. **Which `modeParams` are meaningful.**

`mode` is therefore a **structural discriminator**, not a classifier, and follows RFC-006 §3.2: a closed set of known values plus a catch-all branch kept disjoint with `not`/`enum`. A mode a consumer does not recognise MUST NOT be executed by guessing — see §3.5.

By contrast `classification.workoutType` and `blocks[].role` carry no structural consequence, so per D8 they remain open strings with recommended registries, and an unrecognised value is safely ignorable.

#### Mode and `modeParams`

| `mode` | Meaningful `modeParams` | Ends when |
|---|---|---|
| `sequential` | — | All items complete |
| `superset` | `rounds` | All sets of every group complete |
| `circuit` | `rounds`, `rest` | `rounds` completed |
| `emom` | `rounds`, `interval` | `rounds` intervals elapse |
| `amrap` | `timeCap` | `timeCap` expires |
| `forTime` | `rounds`, `timeCap` | Work completes, or `timeCap` expires |
| `tabata` | `rounds`, `work`, `rest` | `rounds` completed |
| `interval` | `rounds`, `work`, `rest` | `rounds` completed |

`modeParams` is an open object. Constraining it per mode was considered and rejected: a consumer that does not recognise the mode cannot use its parameters either, so the mode is already the gate. Typing the parameters would add a second gate that only ever fires when the first has already stopped execution.

A producer SHOULD supply the parameters its mode needs. A block with `mode: "amrap"` and no `timeCap` is under-specified, and consumers SHOULD warn.

### 3.3. Grouping

Items sharing a `groupLabel` within a block are performed together, alternating: `A1`, `A2` is a superset; `A1`, `A2`, `A3` a triset. The letter orders groups within the block, the digit orders members within the group. This convention is widely used in coaching practice, and this RFC makes it normative so it can be parsed rather than merely read.

A block whose `mode` is `superset` and whose items carry no `groupLabel` is ambiguous; consumers SHOULD warn and MAY treat the whole block as one group.

**Superset, compound set and antagonist pairing are not distinguished structurally**, and deliberately so. All three are two items alternated with rest deferred to the end of the group; they differ only in whether the exercises share a muscle group or oppose one. That is derivable from the referenced exercises' `targets`, so encoding it again in the workout would create a second source of truth that can disagree with the first. Producers wanting to record the intent SHOULD use `blocks[].role` or a tag.

### 3.4. Sets: explicit or scheme, never both

An item states its sets one of two ways:

- `sets[]` — an explicit array of `setPrescription`, each with its own load, reps, tempo and rest.
- `scheme` — an RFC-006 `setScheme`, naming a pattern and its parameters.

These are mutually exclusive, enforced by `not: { required: ["sets", "scheme"] }`. An item carrying both states the same work twice with nothing to say which wins, and a consumer choosing wrongly changes the training.

Producers SHOULD prefer `sets[]` when the sets differ from each other and `scheme` when the pattern is the intent. A consumer that does not recognise a scheme's pattern MUST NOT attempt to expand it (RFC-006 §4.6).

Item-level `load`, `reps`, `tempo` and `rest` apply to every set of the item. A set-level value overrides the item-level one for that set only.

### 3.5. Unknown modes are not executed

A consumer encountering a `mode` it does not understand MUST NOT execute the block by falling back to `sequential` or any other default. It SHOULD surface the block's items and prescriptions, and indicate that the execution structure is not understood.

This mirrors RFC-006 §3.3 and for the same reason. Silently running an unrecognised interval structure as straight sets does not produce a slightly different session; it produces a different physiological stimulus, and in a conditioning block it can produce one the athlete is not prepared for.

## 4. Reference Structures

### 4.1. `classification`

`workoutType` is required; `level`, `focus[]`, `estimatedDuration`, `environment[]` and `tags[]` are optional.

`estimatedDuration` is an object carrying `value` and `unit` rather than a bare number. A bare number is read as minutes by some implementations and seconds by others, and nothing in the document reveals which was meant.

### 4.2. `block`

`id`, `mode` and `items` are required. `mode` is a `blockMode`; `role` is a plain classifier whose recommended values — `warmup`, `primary`, `accessory`, `conditioning`, `cooldown`, `finisher` — are carried in the schema as `examples` rather than constrained. A block MAY also carry a display `name` and free-text `notes`.

`rest` is an RFC-006 `restSpec` and applies at the boundary its own `appliesTo` names. The durations inside `modeParams` — `timeCap`, `work`, `rest`, `interval` — are each a `duration`: a `value` with its own `unit`, for the same reason `estimatedDuration` is.

### 4.3. `blockItem`

`id` and `exercise` are required; everything else is prescription.

`alternatives[]` lists substitutions **the author sanctions in advance** — equipment unavailable, movement contraindicated, a regression for a less experienced athlete. It is part of the prescription and travels with the workout.

This is distinct from a substitution an athlete makes during a session, which is performed data and belongs to RFC-009. The distinction matters because the two answer different questions: `alternatives[]` says what the author considers equivalent; a logged substitution says what happened. Collapsing them would make a program's intent unrecoverable from its execution history.

### 4.4. `setPrescription`

`index` is required and 1-based. It is explicit rather than implied by array position so that a set can be referenced stably — RFC-009 will point at prescribed sets from performed ones, and array positions shift when a document is edited.

`type` distinguishes `warmup`, `working`, `backoff`, `drop`, `cluster` and `amrap` sets. Consumers computing training volume SHOULD exclude `warmup` sets; treating them as working sets inflates volume in a way that compounds across a program.

`schemeParams` carries parameters for the scheme a set participates in — drop percentages, cluster rest. It is open for the same reason `setScheme.params` is: each pattern takes a different shape.

`side` is meaningful only where the referenced exercise's `classification.unilateral` is true. A set MAY carry free-text `notes`.

From schema version 1.1.0 a set also carries `zone`. Load, repetitions, tempo and rest were always statable per set and intensity was not, so a session whose intensity climbs set by set had to be split into one item per step to say so. That was an asymmetry rather than a decision, and it is corrected.

### 4.5. `repStyle`

Two prescriptions in wide use are expressible by nothing else in the model: **partials** (a deliberately reduced range of motion) and **one-and-a-half reps** (a full repetition followed by a half, counted as one). `tempo` governs how fast a repetition is performed, not its range or its composition, and no metric or set scheme reaches them either.

```json
{ "repStyle": { "rangeOfMotion": "partial", "segment": "top" } }
```

| Field | Values | Meaning |
|---|---|---|
| `rangeOfMotion` | `full` \| `partial` \| `extended` | `extended` is a deliberately increased range, as in a deficit deadlift |
| `segment` | `top` \| `bottom` \| `mid` | Which part of the movement a partial covers. Meaningful only when `rangeOfMotion` is `partial` |
| `pattern` | `standard` \| `oneAndAHalf` \| `pulse` | `pulse` is repeated short repetitions at one point in the range |

`repStyle` sits on an item or on a single set, so a prescription can call for full reps followed by partials to failure without splitting the item in two.

It is defined here rather than in the RFC-006 library because a workout is currently its only consumer. A definition becomes shared when a second consumer needs it; if RFC-008 does, it is promoted to a new prescription version at that point. Promoting it now would mean publishing a new version of a frozen URL to serve a user that does not yet exist.

### 4.6. `settings`

Some prescriptions are neither load, repetitions, tempo nor rest. A treadmill at five percent incline, a bike held at ninety revolutions per minute — the athlete has to dial these in before starting, and nothing else in the model reaches them.

Added at schema version 1.1.0, `settings` is an array of metric shapes with a value attached:

```json
{ "settings": [ { "type": "incline", "unit": "percent", "value": 5 } ] }
```

| Field | Meaning |
|---|---|
| `type` | A metric type from the shared RFC-001 vocabulary — `incline`, `cadence`, `resistanceLevel` and so on |
| `unit` | Its unit, from the same vocabulary |
| `value` | The number to set |
| `range` | A band rather than a point, as `min` and `max` — "cadence 85 to 95" |
| `notes` | Free text for this setting |

It sits on an item or on a single set, so an incline that climbs every five minutes is three sets rather than three items.

This is deliberately **not** a new definition per setting. Load, repetitions, tempo and rest each earned one because each carries semantics a consumer must act on — a load has a resolution method, a rest has a scope. An incline carries none: it is a number in a unit that the athlete sets, and the metric vocabulary already names it. Giving each setting its own definition would have meant a new one every time a machine gained a dial.

**Resistance is a load, not a setting.** A machine's resistance level changes how hard the work is and is prescribed with `loadTarget.method: "level"`, which carries a `scale` so that "level 8" is not read against a different machine's numbering. Incline and cadence change what the movement *is* rather than how heavy it is. Producers SHOULD keep that division; consumers reading a `resistanceLevel` setting SHOULD accept it and warn.

A consumer that cannot apply a setting — no incline control on the equipment at hand — SHOULD surface it to the athlete rather than discard it silently. Unlike an unrecognised load method, there is no safety argument for refusing: the number is stated in a named unit and means the same thing to a person as to a machine.

### 4.7. Derived rollups

`targets` and `equipment` summarise what the session trains and needs. Both are **optional and advisory**.

A consumer MUST NOT treat either as authoritative over walking the items. They are derived data that can be absent, stale, or computed under assumptions the consumer does not share — a rollup produced before an item was substituted no longer describes the session. They exist for listing and filtering, where recomputing across a library is expensive and approximate answers are acceptable.

### 4.8. Optional descriptive fields

`constraints` records what the session demands of the athlete before they start: `contraindications` (conditions under which it should not be performed), `prerequisites` (competencies it assumes) and `environment` (where it can be done). These are advisory prose, not machine-enforceable gates — FDS models no athlete to check them against.

`relations` links a workout to others by `type` and `targetId`, with optional `notes`. Recommended types are `alternate`, `variation`, `progression`, `regression`, `deload` and `test`. This is how a deload variant is tied to the session it deloads, and how RFC-008 can reference a lighter alternative without duplicating the whole document.

`media` follows the shared definition from RFC-001 — demonstration video or a diagram of the session structure.

Items and blocks both accept `notes`, and blocks a `name`. `equipment.required` and `equipment.optional` split the rollup into what the session cannot proceed without and what merely helps.

## 5. Composition with RFC-006

| Where | RFC-006 definition |
|---|---|
| `blocks[].rest`, `items[].rest`, `sets[].rest` | `restSpec` |
| `items[].load`, `sets[].load` | `loadTarget` |
| `items[].reps`, `sets[].reps` | `repTarget` |
| `items[].tempo`, `sets[].tempo` | `tempo` |
| `items[].scheme` | `setScheme` |
| `items[].zone` | `intensityZone` |

None of these is redefined here. The published workout schema carries flattened copies, so an implementer validating a workout never fetches the prescription library — but the definitions are generated from it, so the two cannot drift.

### 5.1. Metric agreement with the referenced exercise

Per the compatibility anchor: a set prescription SHOULD only use metric types the referenced exercise declares in its `metrics.primary` or `metrics.secondary`. Prescribing distance on an exercise measured in reps is a producer error.

Producers MAY exceed the declared metrics. Consumers MUST NOT fail validation on the excess, but SHOULD warn. The rule is a warning rather than a constraint because the exercise catalog and the workout may come from different sources at different versions, and a stale catalog should not make a valid session unreadable.

### 5.2. Resolution context

A workout inherits every resolution requirement of the load targets it contains. Determining what a session needs before presenting it means walking every `loadTarget` and `intensityZone` in the document — see RFC-006 §5.2. A workout does not declare its requirements in one place, because the requirements are a property of its contents.

## 6. Versioning and Compatibility

This entity follows the versioning rules in RFC-001 §5. Its published URL is a frozen contract; additions ship at a new version URL.

Adding a `mode` is a MINOR change: documents valid under the old version remain valid, because the new mode previously validated through the catch-all branch.

<!-- fds:pin workout/v1.0.0/workout.schema.json — this document names the superseded version deliberately, in §6 and again in §9, because releases 1.2.0 and 1.3.0 declare workout at 1.0.0 and a client pinned to either must keep resolving it. New work uses 1.1.0. -->

**1.1.0** added `settings` on items and sets, and `zone` on a set. Both are optional additions to closed objects, so every 1.0.0 document remains valid unchanged — but a 1.1.0 document using either is rejected by the 1.0.0 schema, which is what makes this a version rather than an edit. `workout/v1.0.0/workout.schema.json` stays published and frozen; releases 1.2.0 and 1.3.0 declare workout at 1.0.0 and continue to resolve. Release 1.4.0 is the first to declare it at 1.1.0.

Entities version independently. A new workout version does not oblige exercise, equipment or the prescription library to move, and none of their versions oblige this one.

## 7. Implementation Guidance

### 7.1. Producers

Use the mode that matches the intent rather than the one that is easiest to render. A conditioning block written as `sequential` with rest baked into the prescriptions is not a circuit, and a consumer cannot recover the intent afterwards.

Emit `groupLabel` whenever items are alternated, including for a plain two-exercise superset. It costs one field and it is the only signal that the items are not meant to be performed one after the other.

### 7.2. Consumers

Walk `structure.blocks` in order; within a block, honour `mode`. Do not assume `sequential` when `mode` is absent — it is required, so a document without it is invalid and should be reported rather than repaired.

Recompute `targets` and `equipment` from the items when correctness matters.

## 8. Security and Privacy Considerations

A workout is reference data and contains no personal data by construction. It carries no athlete, no bodyweight, no training maxes, and no performed values — every relative prescription references its context rather than embedding it (RFC-006 §5).

An implementation that resolves a workout against a specific athlete and stores the result — writing actual kilograms in place of a percentage — has produced personal data and inherits the obligations that come with it. That resolved artifact is not a Workout in the sense of this RFC.

## 9. JSON Schema Reference

`https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json`

The superseded version stays served, and a client pinned to a release that declares workout at 1.0.0 keeps fetching it:

`https://spec.vitness.me/schemas/workout/v1.0.0/workout.schema.json`

Neither path segment is the release number. Releases 1.2.0 and 1.3.0 declare workout at 1.0.0 and release 1.4.0 declares it at 1.1.0, so the version to fetch is the entity version the release names — see §6 and `specification/discovery.md`.

### 9.1. Validation

```bash
npm run verify schemas
```

## 10. Example

An upper-body session: a warmup block, a primary block with a top set and back-offs, an accessory superset, and a conditioning finisher.

```json
{
  "schemaVersion": "1.1.0",
  "workoutId": "00000000-0000-4000-8000-00000000a001",
  "canonical": { "name": "Upper A", "slug": "upper-a" },
  "classification": {
    "workoutType": "strength",
    "level": "intermediate",
    "estimatedDuration": { "value": 60, "unit": "min" }
  },
  "structure": {
    "blocks": [
      {
        "id": "b1",
        "role": "primary",
        "mode": "sequential",
        "items": [
          {
            "id": "i1",
            "exercise": { "id": "ex.benchPress", "name": "Barbell Bench Press" },
            "scheme": {
              "pattern": "topSetBackoff",
              "sets": 4,
              "params": { "backoffPercent": 10, "backoffSets": 3 }
            },
            "load": { "method": "rpe", "value": 8, "allowHalf": true },
            "reps": { "kind": "range", "min": 3, "max": 5 },
            "rest": { "method": "fixed", "appliesTo": "set", "value": 3, "unit": "min" }
          }
        ]
      },
      {
        "id": "b2",
        "role": "accessory",
        "mode": "superset",
        "modeParams": { "rounds": 3 },
        "rest": { "method": "fixed", "appliesTo": "group", "value": 90, "unit": "s" },
        "items": [
          {
            "id": "i2",
            "groupLabel": "A1",
            "exercise": { "id": "ex.dumbbellRow", "name": "Dumbbell Row" },
            "reps": { "kind": "range", "min": 8, "max": 12 },
            "load": { "method": "rir", "value": 2 }
          },
          {
            "id": "i3",
            "groupLabel": "A2",
            "exercise": { "id": "ex.inclineDbPress", "name": "Incline Dumbbell Press" },
            "reps": { "kind": "range", "min": 8, "max": 12 },
            "load": { "method": "rir", "value": 2 }
          }
        ]
      },
      {
        "id": "b3",
        "role": "finisher",
        "mode": "amrap",
        "modeParams": { "timeCap": { "value": 8, "unit": "min" } },
        "items": [
          {
            "id": "i4",
            "exercise": { "id": "ex.airBike", "name": "Air Bike" },
            "reps": { "kind": "calories", "value": 15 },
            "zone": { "system": "heartRate", "zone": "Z4", "boundsRef": "zone.fiveZoneHeartRate" }
          }
        ]
      }
    ]
  },
  "metadata": {
    "createdAt": "2026-08-09T00:00:00Z",
    "updatedAt": "2026-08-09T00:00:00Z",
    "status": "active",
    "source": "vitness.core"
  }
}
```

Worked examples for every scheme in §4.1 and every grouping structure in §4.2 of the scenario matrix are published alongside the schema.

## Conformance

An implementation conforms to this specification if it:

1. Honours `blocks[].mode` for traversal and termination, and does not execute a mode it does not recognise.
2. Treats items sharing a `groupLabel` as alternated.
3. Rejects an item carrying both `sets` and `scheme`.
4. Applies set-level prescription over item-level prescription where both are present.
5. Recomputes rather than trusts `targets` and `equipment` when correctness matters.
6. Excludes `warmup` sets from training-volume calculations.
7. Warns, rather than fails, when a set uses a metric type the referenced exercise does not declare.

## 11. References

### 11.1. Normative References

- RFC 2119 — Key words for use in RFCs
- RFC-001 — Exercise Data Model
- RFC-006 — Prescription Primitives
- JSON Schema Draft 2020-12

### 11.2. Informative References

- RFC-002 — Equipment Data Model
- RFC-008 — Training Program Data Model
- `specification/metrics-guide.md`
