# TrainHeroic — platform profile

**Archetype:** strength & conditioning programming / marketplace · **Mode:** fidelity · **Produces:** workout, program

TrainHeroic is a strength-and-conditioning programming platform with a paid **marketplace** — a coach
authors a program once and sells it to many athletes. That business *is* content syndication, which
makes it the sharpest test of the prescription primitives (RFC-006): a percentage-based program has
to render identically for every buyer, resolved against each athlete's own maxes. It is the corpus's
prescription-intensity exemplar.

## Sourcing

Two tiers, both cited. **Tier A** — official TrainHeroic support articles and blog (high confidence
for terminology and behaviour; these never expose field names). **Tier B** — third-party
reverse-engineered clients of TrainHeroic's *undocumented* internal API
(`alandotcom/trainheroic-unofficial`, whose `packages/dto` is "the source of truth for API shapes",
and `hmemcpy/trainheroic-export`), which give real wire field names at medium confidence. TrainHeroic
has **no public API** and training plans are **not** exportable, so the fixtures are reconstructions.

Primary sources: *Programming with Linear Weight Progression or Percentages*, *Testing and Updating
Athletes' Maxes*, *How can I include RPE, tempo, rest…*, *Creating Supersets*, *For Coaches: Creating
Training Sessions* (support.trainheroic.com); reverse-engineered DTOs (github.com).

## The data model — typed parameter slots

The one fact that drives everything: TrainHeroic exercises do **not** have fixed weight/reps columns.
Each exercise row has **two configurable parameter slots** (`param_1_type`, `param_2_type`) and the
coach picks what each means — Reps, Weight, **Weight %**, Rep Range, Time, Distance, Reps-per-side. A
set target is a `(parameter_type, value)` pair, and **per-set variation is expressed as arrays**:
`weight: [70, 75, 80, 85]` is a four-set percentage wave in one exercise; a rep range is the string
`"8-12"`; AMRAP is a sentinel.

**Intensity resolves against a per-athlete, per-movement "working max."** A `Weight %` reads the
athlete's working max for the exercise's **Reference Max** (so accessories can scale off a main lift).
A working max is a tested 1RM or one **estimated from a submaximal set via the NSCA load chart**; once
tested it **locks**, otherwise it auto-updates as the athlete trains.

**Prescribed vs. actual are first-class and parallel** at set granularity (`Set = { prescribed,
actual, completed }`) — a clean alignment target for the future RFC-009.

## Fixtures and how they map

| Fixture | TrainHeroic construct | FDS expression |
|---|---|---|
| `workout.trainheroic-percentage-wave` | `param_2_type = weight_pct`, `weight:[70,75,80,85]` | four explicit `sets`, each a per-set `percent1RM` load with `referenceExerciseId` (RFC-007 §4.4, RFC-006 §4.1); an `rpe` load and an `amrap` set in a superset |
| `program.trainheroic-squat-wave` | wave loading against a working max | `references.trainingMaxes` slot with `method: estimatedOneRepMax` (RFC-008 §8.1); per-week `overrides.loadScaling`; deload week |

Both validate against the published schemas. The percentage wave is the key result: **FDS expresses
TrainHeroic's most distinctive construct** — per-set percentage-of-working-max — natively, and the
working-max reference maps onto RFC-008's training-max *slot* exactly as designed (the derivation
method travels, the personal value does not).

## What this exercises in FDS

RFC-006 (`percent1RM` with `referenceExerciseId`, `rpe`, `bodyweight`, `amrap`), RFC-007 (per-set
`setPrescription.load`, superset grouping) and RFC-008 §8.1 (training-max slots, `overrides`). It is
the corpus's deepest test of whether the prescription primitives survive a real percentage-based
methodology.
