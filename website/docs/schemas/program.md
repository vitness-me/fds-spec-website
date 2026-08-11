---
title: Program Schema
description: JSON Schema for a training program — cycles, weeks, day placement, progression and branching
sidebar_position: 9
---

# Program Schema (v1.0.0)

A program places sessions in time: cycles, weeks, days, and the rules by which the prescription changes as the plan advances.

## Schema Location

**URL:** `https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json`

**Download:** [program.schema.json](https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json)

## A schedule of references, not a container

**A program does not contain workouts. It points at them.**

A session used on Monday of every week for twelve weeks is authored once and referenced twelve times. A session shared by four programs is fixed once, and all four are fixed. The alternative — inlining a copy per day — means a twelve-week plan carries thirty-six near-identical documents, and a plan repaired in eight of them is worse than one repaired in none, because it now disagrees with itself.

This costs self-containment, and the specification says so rather than pretending otherwise. A program alone is not renderable; you need the referenced workouts too. The denormalised `name` on each reference is there so a program stays *listable* without resolution even though it is not *executable* without it.

A reference you cannot resolve **must be reported**, not skipped and not treated as a rest day. An unresolvable session and a prescribed rest are different instructions.

## Four schedule models

`schedule.model` decides **which of a day's placement fields is authoritative**. It is a structural discriminator, not a label.

| `model` | Authoritative | Meaning |
|---|---|---|
| `calendar` | `dayOfWeek` | Days fall on named weekdays |
| `relative` | `offsetDays` | Days fall at a fixed offset from the program start |
| `rolling` | `offsetDays` | A fixed cadence — three on, one off — drifting against the calendar by design |
| `sequence` | neither | Performed in order at the athlete's pace; `index` is the only ordering |

Reading a document under the wrong model does not produce a slightly different plan. A rolling five-day cadence read as a calendar reorders the training and collapses the rest pattern the plan was built around.

## A day is a workout or a rest day

Exactly one. Both is a contradiction; neither says nothing at all, and a consumer rendering a calendar would have to invent a meaning for the slot.

Rest is modelled explicitly rather than left as a gap, because an absent day is unplanned and a prescribed rest day is part of the programme — which is precisely what a deload week is made of. A day may additionally be `optional`, which qualifies a training day rather than replacing one.

## Overrides apply to the occurrence, not the workout

`overrides` adjusts the referenced session **for that day only**. The workout document is never modified — that is what keeps it shareable.

`loadScaling` is applied *after* the load target resolves, which is what lets it compose with any method: it multiplies an absolute load, multiplies the resolved result of a percentage, and multiplies nothing on an RPE target, because an RPE has no load until the athlete supplies one.

Where a referenced workout carries its own progression rule, **the rule resolves first and the overrides apply to its result.** The reverse order would make one shared rule progress differently in two plans that both claim to use it.

## Training maxes are slots, never values

`references.trainingMaxes[]` declares which lifts the plan is computed from and how the caller derives each number. **It never carries the number, and a conforming implementation must not add one.**

This is the single most likely thing for an implementer to "fix", because the slot reads as an object with a field missing and filling it appears to make programs self-contained at no cost. It is not free. A one-rep max is personal data about an identifiable person; a program carrying one acquires a subject, and with the subject come consent, retention, portability and erasure obligations that reach every system the document passes through. FDS is built so catalogs, sessions and plans can be published, cached, mirrored and diffed freely, and that is only defensible while none of them describes a person.

The accepted consequence: **a fully personalised program cannot round-trip as one self-contained document.** Export is the plan plus a separate resolution context. That trade-off is deliberate.

A slot is matched by its `exercise` — a `percent1RM` names the lift through `referenceExerciseId`, and the slot that applies is the one naming that exercise. The slot's own `id` is a local handle for citation from a rule or an override.

## Branching, and the limit of adaptive plans

`branching` routes between days conditionally — pass a test and continue, fail it and repeat the week. The condition is **declarative** rather than an expression, precisely so a consumer can recognise one it cannot evaluate and refuse it. A condition you cannot evaluate means following the unconditional schedule and warning, never guessing.

Adaptive programming splits in two, and only one half is portable. **Load adaptation is expressible** — a fixed skeleton whose loads resolve at execution time through `autoregulated` targets pointing at declared rules. **Exercise selection generated per session is not**, and the specification says so rather than leaving it implied: a day carries a workout reference, which requires a workout that exists, and an undetermined day would mean a program unreadable without the generator that produced it.

## Authorship

`authorship` is the first place FDS records a rights claim, and it is here rather than on an exercise because of what a program is. A movement is not authored in any meaningful sense; a twelve-week plan is. An absent `license` means **unstated, not public domain**, and a consumer should preserve `authorship` through any transformation.

## Worked examples

<!-- fds:count examples:program=18 scenarios:program=18 -->
Eighteen programs are published alongside the schema — one for every periodization model in the coverage matrix and one for every scheduling structure, indexed in [the fixture README](https://spec.vitness.me/schemas/program/v1.0.0/README.md).

Not one of them contains a set, a rep or a load. That is the claim above, demonstrated rather than asserted.

## Specification

[RFC-008: Training Program Data Model](../specifications/rfc-008-program-data-model). Sessions come from [RFC-007](../specifications/rfc-007-workout-data-model) and prescription from [RFC-006](../specifications/rfc-006-prescription-primitives).
