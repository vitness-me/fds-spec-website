---
title: Prescription Primitives
description: How much load, how many reps, what tempo, how much rest — the shared definitions workouts and programs compose
sidebar_position: 7
---

# Prescription Primitives (v1.0.0)

Prescription answers four questions about a set: **how much load, how many repetitions, at what tempo, and how much rest.** Everything in FDS that prescribes work composes these definitions, so a set inside a standalone workout and the same set inside a twelve-week program mean exactly the same thing.

## This is a library, not an entity

Every other schema here describes a document you can hold: an exercise, a workout, a program. This one does not.

`prescription.schema.json` publishes a `$defs` library and **its root validates nothing** — it is literally `{"not": {}}`. There is no such thing as a prescription document. You cannot export one, and a validator pointed at the root will reject anything you give it, correctly.

What you validate against is a *definition inside it*. The published fixtures each name the definition they exemplify, and CI validates them that way rather than against the root.

The transformer does not carry this schema for the same reason. It validates entities, and a definition library is not one.

**URL:** `https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json`

## The definitions

| Definition | Answers |
|---|---|
| `loadTarget` | How much load — 13 methods, from an absolute kilogram to an RPE the athlete resolves under the bar |
| `loadRange` | A load expressed as a band rather than a point |
| `repTarget` | How many repetitions — or how long, how far, how many calories |
| `tempo` | How fast each phase of a repetition is performed |
| `tempoPhase` | One phase of that, where a pause needs its own duration |
| `restSpec` | How much rest, and at which boundary it applies |
| `restScope` | Whether that boundary is a set, a group, or a block |
| `intensityZone` | A zone in a named system — heart rate, power, pace, perceived |
| `setScheme` | A named pattern across sets, with its parameters |
| `progressionRule` | When the prescription changes, and how |

## Two rules worth reading before you implement

### An unknown method is ignored, never guessed

A consumer that meets a `loadTarget.method` it does not understand **MUST** ignore that target and **SHOULD** warn. It must not substitute a default, carry forward the previous set's load, or infer one from context.

This is stronger than the warn-and-continue rule that governs classifiers elsewhere in FDS, and deliberately so. An unrecognised `exerciseType` produces a mislabelled exercise. A guessed load produces a barbell someone tries to lift.

The same rule governs a `setScheme.pattern` you do not recognise: do not expand it. Expanding a pattern requires knowing its semantics, and a wrong expansion changes the training rather than merely failing to display it.

### Most loads are not resolvable from the document alone

`70% 1RM` is an instruction, not a weight. It becomes a weight only when combined with a one-rep max — a number FDS deliberately does not carry, because FDS models no person.

The same is true of `percentBodyweight`, of `relative` targets that reference a previous session, of `autoregulated` targets that reference execution state, and of every `intensityZone`, whose labels are meaningless without personal boundaries.

A consumer intending to render absolute loads must be able to supply that context for the methods it meets, and **must not fabricate what it lacks**. Presenting the prescription as written — "70% 1RM" — is honest and actionable. A fabricated number is neither.

RFC-006 §5 lists, method by method, exactly what each one needs and where it comes from.

## Why a discriminated union with a catch-all

`loadTarget`, `repTarget` and `restSpec` each select a payload from a `method` or `kind` field. Those fields cannot be open strings: an open discriminator selects no branch, so either every branch matches or none does, and the document cannot validate at all.

Each union therefore lists its known members and adds one final branch for values this version does not define — with that branch explicitly excluding the known values. That exclusion is load-bearing in both directions. Without it a correct `{"method": "absolute", …}` would match two branches and be rejected; worse, a *malformed* known method would fall through to the permissive branch and validate, which is the silent pass this standard exists to prevent.

Implementations extending these unions must preserve that disjointness.

## Worked examples

Sixty-nine fixtures are published alongside the schema, one per definition and one per discriminator value, each named for what it demonstrates and indexed in [the fixture README](https://spec.vitness.me/schemas/prescription/v1.0.0/README.md).

Negative fixtures are included too — documents that **must** be rejected. A schema that accepts everything passes every positive test.

## Specification

[RFC-006: Prescription Primitives](../specifications/rfc-006-prescription-primitives) is the normative document. See also [RFC-007](../specifications/rfc-007-workout-data-model) for how a workout composes these, and [RFC-008](../specifications/rfc-008-program-data-model) for how a program does.
