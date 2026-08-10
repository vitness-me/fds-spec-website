# RFC-008: Training Program Data Model Specification

**Status**: Draft
**Version**: 0.1.0
**Date**: 2026-08-10
**Authors**: VITNESS Team
**Category**: Standards Track

## Abstract

This specification defines a standardized model for a training program — a plan that places sessions in time. It covers how a plan is divided into cycles, weeks and days, how a day is positioned, how the prescription changes as the plan advances, and who owns the plan.

The central claim is structural: **a program is a schedule of workout references, not a container of workouts.** A session used on Monday of every week for twelve weeks is authored once and pointed at twelve times. A session shared by four programs is fixed once, and all four are fixed.

Prescription itself comes from RFC-006 and session structure from RFC-007. Neither is restated here. What this document adds is *time*: placement, repetition, progression, and the conditions under which a plan changes course.

## 1. Introduction

### 1.1. Background

Interchange formats for training plans typically inline their sessions. Each day carries a full copy of the workout it prescribes, so a twelve-week plan with three sessions a week contains thirty-six workout documents, most of them identical. The duplication is not merely wasteful — it is a correctness problem. When the prescribed exercise turns out to be wrong, there is no single place to correct it, and a plan repaired in eight of its thirty-six copies is worse than one repaired in none, because it now disagrees with itself.

The second recurring failure is subtler. Plans that *are* personalised tend to bake the personalisation in: the document that says "70% of your squat max" is exported as one that says "142.5 kg". At that point the plan has stopped being a plan. It cannot be shared, cannot be re-run by the same athlete six months later, and has quietly acquired personal data that the format was never designed to protect.

This RFC takes the opposite position on both. Days point at workouts. Values that depend on a person are declared as slots and never filled.

### 1.2. Goals

1. Express every periodization model in §4.6 of the scenario matrix and every scheduling structure in §4.7, without per-methodology fields.
2. Reference workouts (RFC-007) and compose prescription primitives (RFC-006) rather than restating either.
3. Keep the plan prescriptive: a program describes intended training, never performed training.
4. Remain forward-compatible — a schedule model defined after this version MUST NOT invalidate the document.
5. Contain no personal data, including the values a personalised plan would be computed from.

### 1.3. Scope

**In Scope:** cycle and week structure, day placement, rest and optional days, per-occurrence adjustment, progression rules, conditional routing, declared computation inputs, authorship and licensing.

**Out of Scope:**

- Prescription primitives themselves (RFC-006)
- Session structure — blocks, modes, grouping, sets (RFC-007)
- Performed data: what was actually done, by whom, and when (RFC-009, deferred)
- Athlete identity, bodyweight, and the numeric value of any one-rep max or training max. See §8 and RFC-006 §5.

## 2. Terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are to be interpreted as described in RFC 2119.

- **Program** — a plan that places sessions in time.
- **Cycle** — a block of training with one intent. Macro, meso and micro cycles are all cycles.
- **Week** — a group of days within a cycle.
- **Day** — one scheduled slot: either a reference to a workout, or a prescribed rest.
- **Schedule model** — how a day is placed in time.
- **Slot** — a declaration that the program is computed from a value, without the value.

## 3. Core Structural Requirements

### 3.1. Required fields

`schemaVersion`, `programId`, `canonical`, `classification`, `schedule` and `metadata`. The envelope — `canonical`, `metadata`, `attributes`, `extensions`, closed `additionalProperties` at the top level — is inherited unchanged from RFC-001.

`schedule.cycles` MUST contain at least one cycle, every cycle at least one week, and every week at least one day. A plan with no days is not a program; it is a title.

### 3.2. A program references workouts; it does not contain them

A day carries a `workout` reference — the shared `workoutRef` from RFC-001, an identifier plus a denormalised name for display — and never an embedded workout document.

This is the single most consequential decision in this RFC, and it is worth stating what it buys and what it costs.

It buys **a single point of correction**. A session referenced by forty days is authored once. When it changes, every day that references it changes, which is almost always what the author meant. It also buys **sharing across programs**: a beginner and an advanced program that both prescribe the same technique session point at the same document rather than forking it.

It costs **self-containment**. A program document alone is not renderable; a consumer needs the referenced workouts too. FDS accepts this because the alternative — a self-contained document that duplicates its content — trades a resolvable dependency for an unresolvable inconsistency. The denormalised `name` on the reference exists precisely so that a program remains *listable* without resolution, even though it is not *executable* without it.

A consumer that cannot resolve a workout reference MUST report the day as unresolved. It MUST NOT skip the day silently and MUST NOT treat it as a rest day; an unresolvable session and a prescribed rest are different instructions, and conflating them removes training from the plan without saying so.

### 3.3. Schedule models

`schedule.model` — a `scheduleModel` — decides **which of a day's placement fields is authoritative**. It is therefore a structural discriminator, not a classifier, and follows RFC-006 §3.2: a closed set of known values plus a catch-all branch kept disjoint with `not`/`enum`.

| `model` | Authoritative placement | Meaning |
|---|---|---|
| `calendar` | `dayOfWeek` | Days fall on named weekdays. Week two's Monday is a Monday. |
| `relative` | `offsetDays` | Days fall at a fixed offset from the program start, whatever weekday that is. |
| `rolling` | `offsetDays` | Days repeat on a fixed cadence — three on, one off — which drifts against the calendar by design. |
| `sequence` | neither | Days are performed in order at the athlete's pace. `index` is the only ordering. |

Reading a document under the wrong model does not produce a slightly different plan. A `rolling` five-day cadence read as `calendar` reorders the training and collapses the rest pattern it was built around. This is why the model is required and why an unrecognised one is not executed — see §3.6.

`dayOfWeek` and `offsetDays` MAY both be present. Under each model exactly one is authoritative and the other is advisory; producers emitting both SHOULD keep them consistent, and consumers MUST NOT resolve a disagreement by preferring the field the model does not name.

### 3.4. Cycles, weeks and days

The nesting of macro, meso and micro is expressed by a cycle's `type` and `order`, not by embedding cycles inside cycles.

```
schedule → cycles[] → weeks[] → days[]
```

A macro cycle and the meso cycles inside it therefore appear as siblings in one flat `cycles` array, distinguished by `type` and sequenced by `order`. Two reasons: a flat list stays readable at the depth real programs reach, and a cycle can be referenced directly rather than by a path through its ancestors.

`week.index` and `day.index` are 1-based and explicit rather than implied by array position, so that a week or a day can be referenced stably. Array positions shift when a document is edited; an `index` does not.

### 3.5. A day is a workout or a rest day

Exactly one of the two. A day carrying `workout` is a training day; a day carrying `rest` set to `true` is a rest day; a day carrying both is a contradiction, and a day carrying neither says nothing at all.

The schema enforces this with `anyOf` for the at-least-one half and `not`/`allOf` for the at-most-one half. The reason for enforcing rather than advising is that a consumer rendering a calendar has to put *something* in the slot, and any repair it invents — treat an empty day as rest, prefer the workout over the rest flag — is a guess about the author's intent that the author could have stated.

Rest is modelled explicitly rather than left as a gap in the sequence for the same reason. An absent day is unplanned; a prescribed rest day is part of the programme, and the distinction is exactly what a deload week is made of.

A day MAY additionally be marked `optional`, which says the author considers it discretionary — accessory or conditioning work that can be dropped without breaking the plan. `optional` is orthogonal to the workout/rest distinction: it qualifies a training day, it does not replace one.

### 3.6. Unknown models and unevaluable conditions are never guessed

A consumer encountering a `schedule.model` it does not understand MUST NOT place days by falling back to `calendar`, `sequence`, or any other default. It SHOULD present the plan's structure — its cycles, weeks and days in document order — and indicate that the placement is not understood.

A consumer encountering a branch `condition` whose `kind` it cannot evaluate MUST follow the unconditional schedule and SHOULD warn. It MUST NOT guess the branch.

Both mirror RFC-006 §3.3 and RFC-007 §3.5, and for the same reason. Guessing a branch on a plan built around `failedPrescribedReps` can route an athlete into an intensification week they have just demonstrated they are not ready for.

## 4. Reference Structures

### 4.1. `classification`

`periodization` is required; `goal`, `level`, `durationWeeks` and `tags` are optional.

`periodization` is a plain classifier and per D8 an open string with recommended values — `linear`, `undulating`, `block`, `conjugate`, `wave`, `none` — carried as `examples` rather than constrained. It names the shape of the plan; it does not change how the document is read. `goal` is open on the same terms, with `strength`, `hypertrophy`, `peaking`, `conditioning`, `endurance` and `general` recommended. `level` is a closed `enum` of `beginner`, `intermediate` and `advanced`, matching RFC-007.

`durationWeeks` is **derived and advisory**, on the same terms as RFC-007's rollups. It MUST equal the sum of the cycles' durations, and a consumer that needs certainty SHOULD compute it rather than trust it. It exists so a library of programs can be listed and filtered without resolving every cycle.

### 4.2. `cycle`

`id`, `type`, `order` and `weeks` are required; `name`, `durationWeeks`, `intent` and `notes` are optional.

`type` is one of `macro`, `meso` and `micro`. `order` is 1-based and sequences cycles of the same type.

`intent` is what the cycle is *for* — `accumulation`, `intensification`, `realization`, `deload`, `test` — and is an open string per D8. It explains the plan to a reader; it does not change how a consumer executes it. A consumer that does not recognise an intent renders the cycle exactly as it would have anyway.

### 4.3. `week`

`index` and `days` are required; `name`, `deload` and `notes` are optional.

`deload` is a boolean flag on the week rather than a value of the cycle's `intent`, because a recovery week routinely appears inside a cycle whose intent is something else — the fourth week of an accumulation block is still accumulation's deload. Making it a flag lets both statements be true at once.

`deload` marks the week; it does not adjust the training. The adjustment is expressed by the days' `overrides`, or by the referenced workouts being lighter sessions. A consumer MUST NOT infer a load reduction from the flag alone.

### 4.4. `day`

`index` is required. `id`, `dayOfWeek`, `offsetDays`, `rest`, `optional`, `workout`, `overrides` and `notes` are optional, subject to §3.5.

`id` is what `branching` routes to, so any day that is a branch target MUST carry one.

### 4.5. `overrides`

A day's `overrides` — a `dayOverrides` object — adjusts the referenced workout **for this occurrence only**. The workout document is never modified — that is precisely what makes it shareable across days and across programs. An override is read as a transformation applied at render time, not as an edit.

`loadScaling` is a multiplier applied to every resolved load in the workout. `0.9` is a ten-percent back-off. It is applied **after** the load target resolves, which is what lets it compose with any RFC-006 method rather than replacing it: scaling an `absolute` load multiplies the kilograms, scaling a `percent1RM` load multiplies the resolved result of the percentage, and scaling an `rpe` target multiplies nothing, because an RPE has no load to multiply until the athlete supplies one. Producers wanting to reduce difficulty on an autoregulated day SHOULD lower the target in a `progressionRule` rather than expect `loadScaling` to reach it.

`volumeScaling` is a multiplier applied to set counts. Rounding is the consumer's, and it SHOULD round toward the athlete's benefit on a deload — three sets scaled by `0.6` is one set, not two, when the week is marked for recovery.

`progressionState` records where in a progression rule this occurrence sits: the wave number in a 5/3/1 cycle, the stage of a double progression. It is opaque to the schema and meaningful only to the rule that reads it. A consumer that does not understand the rule MUST NOT interpret its state.

**When a day overrides a workout that itself carries a progression rule**, the order is: the workout's own rule resolves first, producing a prescription; the day's `overrides` are then applied to that result. The rule sees the workout as authored, not as scaled. Any other order would make a progression rule's behaviour depend on which program is running it, and the same rule would then progress differently in two plans that both claim to use it.

### 4.6. `progressions`

`progressions` is a list of RFC-006 `progressionRule` objects, referenced by `id` from a day's `progressionState` or from a load target. The definition is not restated here; a rule means the same thing inside a workout and across a program, which is why it lives in the shared library rather than in either RFC.

What a program adds is the *scope*: a rule declared here applies across the plan's timeline, so a `sessionsCompleted` trigger counts sessions across cycles rather than within one. A rule declared here is also what a referenced workout's `autoregulated` load target resolves against, through `progressionRuleRef` — the rule and the load that uses it may therefore live in different documents, and a consumer MUST resolve the reference against the program that scheduled the session.

#### The limit of adaptive programming

Adaptive or model-driven programming covers two different things, and only one of them is portable data.

**Load adaptation is expressible.** The sessions and their placement are fixed, and the loads resolve at execution time through `autoregulated` targets pointing at the rules declared here. That is what autoregulated systems actually vary, and it round-trips: another implementation reading the document gets the same plan and the same rules.

**Exercise selection generated per session is not expressible, and this version does not attempt it.** A day carries a `workoutRef`, which requires a workout that exists. There is deliberately no undetermined day, because a program whose content is produced by a generator cannot be read without that generator — which is the opposite of what an interchange format is for. A system that generates sessions SHOULD emit the resulting program once the sessions exist, and carry its engine configuration under `extensions`, where a consumer can ignore it without losing the plan.

This is a stated boundary rather than an omission. If a portable way to express deferred selection emerges, it ships at a new version.

### 4.7. `branching`

`branching` routes between days conditionally: pass a test and continue, fail it and repeat the week. Each `branch` carries an `id`, a `condition`, a `thenDayRef`, and optionally an `elseDayRef` and `notes`.

The `condition` is declarative rather than an expression: it carries a `kind` from a closed set — `failedPrescribedReps`, `metPrescribedReps`, `amrapBelowThreshold`, `amrapAboveThreshold`, `missedSession`, `athleteChoice` — and an optional `onDayRef` naming the day the condition is evaluated against. It is declarative precisely so that a consumer can *recognise* a condition it cannot evaluate and refuse it, which an embedded expression language would not allow.

The condition object is otherwise open, because thresholds differ by kind and freezing their shape at 1.0.0 would fix six methodologies' parameters forever. The `kind` is the gate: a consumer that does not recognise it cannot use its parameters either.

Evaluating a condition requires performed data, which FDS does not model (§8). A consumer therefore evaluates branches against its own training log, or does not evaluate them at all — and per §3.6, not evaluating them means following the unconditional schedule, not guessing.

### 4.8. `authorship`

`authorship` records who wrote the program and on what terms: `author`, `organization`, `license`, `attribution` and a `uri`. All are optional.

This is **the first place FDS records a rights claim**, and it is here rather than on an exercise or a piece of equipment because of what a program is. A movement is not authored in any meaningful sense; a twelve-week plan is. Training programs are routinely coach-authored and commercially licensed, and an interchange format that drops attribution in transit makes redistribution indistinguishable from theft — not as a legal matter, but as a practical one: the recipient has no way to tell.

`license` is an SPDX identifier where one applies, or free text where none does. **Absence means unstated, not public domain.** A consumer MUST NOT treat a missing `license` as permission, and SHOULD preserve `authorship` intact through any transformation that produces a derived program.

### 4.9. Optional descriptive fields

`relations` links a program to others by `type` and `targetId`, with optional `notes`. The recognised types are `successor`, `predecessor`, `variant`, `beginnerVariant` and `advancedVariant`. This is how a program declares what follows it — the question every finishing athlete asks — and how a family of difficulty variants is tied together without duplicating the plan.

`media` follows the shared definition from RFC-001. `attributes` and `extensions` are the RFC-001 escape hatches, unchanged. Cycles, weeks, days and overrides all accept `notes`; cycles and weeks also accept a display `name`.

## 5. Composition with RFC-006 and RFC-007

| Where | Comes from |
|---|---|
| `days[].workout` | RFC-001 `workoutRef` — the session itself is RFC-007 |
| `progressions[]` | RFC-006 `progressionRule` |
| `references.trainingMaxes[].exercise` | RFC-001 `exerciseRef` |
| `canonical`, `metadata`, `media` | RFC-001 |

A program contains no prescription of its own. Every load, rep target, tempo and rest interval in a plan lives in the workouts it references, which is what makes the claim in §3.2 more than an efficiency argument: there is no second place for a prescription to be, so there is no second place for it to be wrong.

### 5.1. Resolution context

A program inherits every resolution requirement of every workout it references, and a workout inherits every requirement of the load targets it contains — RFC-006 §5.2. Determining what a plan needs before starting it therefore means resolving its workouts and walking their prescriptions.

`references.trainingMaxes` exists to make that answer available *without* the walk. It is a declaration, at the top of the program, of which lifts the plan is computed from. See §8 for what it deliberately does not contain.

## 6. Versioning and Compatibility

This entity follows the versioning rules in RFC-001 §5. Its published URL is a frozen contract; additions ship at a new version URL.

Adding a `schedule.model`, a `cycle` intent, a condition `kind` or a `relations` type is a MINOR change. Documents valid under the old version remain valid: the open classifiers accepted the value already, and a new model previously validated through the catch-all branch.

Entities version independently. A new program version does not oblige workout, exercise or the prescription library to move, and none of their versions oblige this one.

## 7. Implementation Guidance

### 7.1. Producers

Reference workouts; do not inline them. If a session differs between two days, it is a different session and deserves its own document — or the difference is an `overrides`, which is what `overrides` is for.

State `rest` explicitly for planned rest days rather than omitting the day. A calendar with a gap and a calendar with a rest day look identical to a reader and are different instructions to a consumer.

Emit `id` on every day that a branch can target, and on every cycle a reader may need to cite.

Keep `durationWeeks` consistent with the cycles, or omit it. A wrong rollup is worse than an absent one.

### 7.2. Consumers

Read `schedule.model` first, then place days using the field it names. Do not infer placement from whichever field happens to be present.

Resolve every referenced workout before presenting the plan, and collect the union of their resolution requirements together with `references.trainingMaxes`, so that missing context is reported when the program is loaded rather than in the middle of week three.

Recompute `durationWeeks` when correctness matters. Do not interpret `deload`, `intent`, or `periodization` as instructions to change loads.

## 8. Security and Privacy Considerations

A program is reference data and contains no personal data by construction. It carries no athlete, no bodyweight, no performed values, and — the point of this section — **no training maxes**.

### 8.1. Training maxes are slots, not values

`references.trainingMaxes` declares that the program references a training max for a given lift, and how that number is to be arrived at. It never carries the number.

Each `trainingMaxSlot` carries an `exercise`, a `method` naming how the caller derives the value — `testedOneRepMax`, `estimatedOneRepMax`, `percentOfOneRepMax`, `recentBest`, or `callerSupplied` — and an optional `id`. A `percent` accompanies `percentOfOneRepMax`: a training max set at 90% of a true max is the 5/3/1 convention. `notes` may explain a house rule.

The `id` is a local handle, so that a progression rule or a day override can cite the slot. Load targets do not use it. A `percent1RM` names the lift through `referenceExerciseId`, and the slot that applies is the one whose `exercise` it names — the match is on the exercise, not on the slot's own identifier. A producer emitting a slot for a lift no prescription references has declared a requirement the plan does not have, and consumers SHOULD warn rather than demand the value.

**A conforming implementation MUST NOT extend this structure with the value itself.** This is stated normatively because it is the single most likely thing for an implementer to "fix". The slot looks like an object with a field missing, and adding one appears to make programs self-contained at the cost of nothing.

It is not nothing. A one-rep max is personal data about an identifiable person's physical capability. A program carrying one is no longer reference data: it acquires a subject, and with the subject come consent, retention, portability and erasure obligations that reach every system the document passes through. FDS is built so that catalogs, sessions and plans can be published, cached, mirrored and diffed freely, and that is only defensible while none of them describes a person. One numeric field, added for convenience, would move the entire program corpus across that line.

The accepted consequence is that **a fully personalised program cannot round-trip as one self-contained document.** Export is the plan plus a separate resolution context. That is the trade-off, it is deliberate, and it is what keeps RFC-006 through RFC-008 free of personal data. RFC-009 will define where performed and personal data lives, with the obligations that come with it.

### 8.2. Derived artifacts

An implementation that resolves a program against a specific athlete and stores the result — writing kilograms in place of percentages across twelve weeks — has produced personal data and inherits those obligations. That artifact is not a Program in the sense of this RFC, and MUST NOT be published to a program registry.

## 9. JSON Schema Reference

`https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json`

### 9.1. Validation

```bash
npm run verify schemas
```

## 10. Example

A four-week linear block on a calendar schedule: three training days a week, a deload in week four, one declared training-max slot, and a branch that repeats the week on a failed session.

```json
{
  "schemaVersion": "1.0.0",
  "programId": "00000000-0000-4000-8000-00000000b001",
  "canonical": { "name": "Foundation Strength", "slug": "foundation-strength" },
  "classification": {
    "periodization": "linear",
    "goal": "strength",
    "level": "intermediate",
    "durationWeeks": 4
  },
  "authorship": {
    "author": "VITNESS Team",
    "license": "CC-BY-4.0",
    "attribution": "Foundation Strength by the VITNESS Team"
  },
  "references": {
    "trainingMaxes": [
      {
        "id": "tm.backSquat",
        "exercise": { "id": "ex.backSquat", "name": "Barbell Back Squat" },
        "method": "percentOfOneRepMax",
        "percent": 90
      }
    ]
  },
  "progressions": [
    {
      "id": "prog.linear",
      "name": "Add 2.5 kg on a clean session",
      "trigger": { "kind": "allRepsCompleted" },
      "action": { "kind": "increaseLoad", "amount": 2.5, "unit": "kg" }
    }
  ],
  "schedule": {
    "model": "calendar",
    "cycles": [
      {
        "id": "c1",
        "name": "Base",
        "type": "meso",
        "order": 1,
        "durationWeeks": 4,
        "intent": "accumulation",
        "weeks": [
          {
            "index": 1,
            "days": [
              {
                "id": "d1",
                "index": 1,
                "dayOfWeek": "monday",
                "workout": { "id": "wo.lowerA", "name": "Lower A" }
              },
              { "id": "d2", "index": 2, "dayOfWeek": "tuesday", "rest": true },
              {
                "id": "d3",
                "index": 3,
                "dayOfWeek": "wednesday",
                "workout": { "id": "wo.upperA", "name": "Upper A" }
              },
              {
                "id": "d4",
                "index": 4,
                "dayOfWeek": "friday",
                "optional": true,
                "workout": { "id": "wo.conditioning", "name": "Conditioning" }
              }
            ]
          },
          {
            "index": 4,
            "name": "Deload",
            "deload": true,
            "days": [
              {
                "id": "d13",
                "index": 1,
                "dayOfWeek": "monday",
                "workout": { "id": "wo.lowerA", "name": "Lower A" },
                "overrides": {
                  "loadScaling": 0.85,
                  "volumeScaling": 0.6,
                  "notes": "Back off; keep the movement, drop the stress."
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "branching": [
    {
      "id": "b1",
      "condition": { "kind": "failedPrescribedReps", "onDayRef": "d1" },
      "thenDayRef": "d1",
      "notes": "Repeat the session at the same load rather than advancing."
    }
  ],
  "relations": [
    { "type": "successor", "targetId": "00000000-0000-4000-8000-00000000b002" }
  ],
  "metadata": {
    "createdAt": "2026-08-10T00:00:00Z",
    "updatedAt": "2026-08-10T00:00:00Z",
    "status": "active",
    "source": "vitness.core"
  }
}
```

Worked examples for every periodization model in §4.6 and every scheduling structure in §4.7 of the scenario matrix are published alongside the schema.

## Conformance

An implementation conforms to this specification if it:

1. Resolves `days[].workout` references rather than expecting embedded sessions, and reports a day whose reference cannot be resolved instead of skipping it.
2. Places days using the field named by `schedule.model`, and does not execute a model it does not recognise.
3. Rejects a day carrying both `workout` and `rest`, and a day carrying neither.
4. Applies `overrides` to the resolved workout for that occurrence only, after the workout's own progression rule has resolved.
5. Follows the unconditional schedule when a branch condition cannot be evaluated, and warns rather than guessing.
6. Recomputes `durationWeeks` rather than trusting it when correctness matters.
7. Preserves `authorship` through transformations, and does not treat an absent `license` as permission.
8. Carries no training-max value in a program document, and does not publish a resolved program as a Program.

## 11. References

### 11.1. Normative References

- RFC 2119 — Key words for use in RFCs
- RFC-001 — Exercise Data Model
- RFC-006 — Prescription Primitives
- RFC-007 — Workout Data Model
- JSON Schema Draft 2020-12

### 11.2. Informative References

- RFC-002 — Equipment Data Model
- `specification/metrics-guide.md`
