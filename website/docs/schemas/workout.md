---
title: Workout Schema
description: JSON Schema for a single prescribed training session — blocks, execution modes, grouping and per-set prescription
sidebar_position: 8
---

# Workout Schema (v1.1.0)

A workout is **one prescribed session**: what is done, in what order, grouped how, and how each item is prescribed.

## Schema Location

**URL:** `https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json`

**Download:** [workout.schema.json](https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json)

`v1.0.0` remains published and frozen at its own URL. 1.1.0 is purely additive, so every 1.0.0 document validates against it unchanged.

## Blocks of items, and a mode

The central claim is structural: **a workout is blocks of items, and how a block is executed is a property of the block, not a different kind of document.**

Straight sets, supersets, circuits, EMOM, AMRAP, Tabata and interval work are all the same schema, differing only in `blocks[].mode`. No training style gets a schema of its own, and there are no per-style fields — no `isCircuit`, no `emomInterval`, no `tabataRounds`.

`mode` decides three things a consumer cannot infer otherwise:

1. **Traversal** — all sets of item one before item two (`sequential`), or one set of each per pass (`circuit`, `superset`)
2. **Termination** — the block ends when the work is done (`sequential`, `forTime`) or when a clock expires (`amrap`, `emom`, `tabata`)
3. Which `modeParams` are meaningful

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

A mode you do not recognise **must not be executed by falling back to `sequential`**. Surface the items and their prescriptions, and say the structure is not understood. Running an unrecognised interval structure as straight sets does not produce a slightly different session — it produces a different physiological stimulus, and in a conditioning block, possibly one the athlete is not prepared for.

## Grouping is a label, not a nesting

Items sharing a `groupLabel` within a block are alternated. `A1`, `A2` is a superset; `A1`, `A2`, `A3` a triset. The letter orders groups, the digit orders members. This is the convention coaches already write on paper, made parseable.

**Superset, compound set and antagonist pairing are not distinguished structurally.** All three are two items alternated with rest deferred to the end of the group; they differ only in whether the exercises share a muscle group or oppose one — which is derivable from the referenced exercises' `targets`. Encoding it again here would create a second source of truth that can disagree with the first.

## Sets: explicit or scheme, never both

An item states its sets one of two ways: `sets[]`, an explicit array where each set carries its own load, reps, tempo and rest; or `scheme`, a named pattern from RFC-006 with its parameters.

These are mutually exclusive and the schema enforces it. An item carrying both states the same work twice with nothing to say which wins, and a consumer choosing wrongly changes the training.

Item-level `load`, `reps`, `tempo` and `rest` apply to every set. A set-level value overrides it for that set only.

## Machine settings

Some prescriptions are none of load, repetitions, tempo or rest. A treadmill at five percent incline, a bike held at ninety revolutions per minute — the athlete dials these in before starting, and nothing else in the model reaches them.

`settings` is an array of metric shapes with a value attached: a `type` and `unit` from the shared RFC-001 vocabulary, a `value`, optionally a `range` and `notes`. It sits on an item or on a single set, so an incline that climbs every five minutes is three sets rather than three items.

It is deliberately not a new definition per setting. Load and rest earned their own because each carries semantics a consumer must act on — a resolution method, a scope. An incline carries none: it is a number in a unit that the athlete sets.

**Resistance is a load, not a setting.** It changes how hard the work is, so it stays a `loadTarget` with `method: "level"` and a named `scale`. Incline and cadence change what the movement is rather than how heavy it is.

From 1.1.0 a set also carries `zone`. Load, reps, tempo and rest were always statable per set and intensity was not, so a session whose intensity climbed set by set had to be split into one item per step. That was an asymmetry, not a decision.

## Rollups are advisory

`targets` and `equipment` summarise what the session trains and needs. Both are optional and **must not** be treated as authoritative over walking the items — they can be absent, stale, or computed under assumptions you do not share. A rollup produced before an item was substituted no longer describes the session. Recompute when correctness matters.

## Worked examples

Forty-six sessions are published alongside the schema — one for every set and rep scheme in the coverage matrix, one for every grouping structure from a single exercise to a chipper, and one for every cardio and endurance scenario. Each is indexed in [the fixture README](https://spec.vitness.me/schemas/workout/v1.1.0/README.md).

The grouping set is the real test of the claim above: if any structure had needed a field the schema lacked, the abstraction would be cut in the wrong place.

## Key Fields

- `workoutId`, `schemaVersion`, `canonical`, `metadata` — the shared envelope from RFC-001
- `classification.workoutType` — an open classifier, values recommended in the [workout-type registry](https://spec.vitness.me/registries/workout-type.registry.json)
- `structure.blocks[]` — at least one block, each with at least one item
- `blocks[].role` — what a block is for, recommended in the [block-role registry](https://spec.vitness.me/registries/block-role.registry.json)
- `items[].alternatives[]` — substitutions the author sanctions in advance, distinct from one an athlete makes mid-session
- `items[].repStyle` — range of motion and rep composition, for partials and one-and-a-half reps

## Specification

[RFC-007: Workout Data Model](../specifications/rfc-007-workout-data-model). Prescription itself comes from [RFC-006](../specifications/rfc-006-prescription-primitives).
