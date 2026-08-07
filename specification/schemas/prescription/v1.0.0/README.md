# Prescription Primitives — Fixtures

Worked examples for `prescription.schema.json`, the RFC-006 definition library.

These are **fragments, not documents**. The library root accepts nothing, so none of them validates against `prescription.schema.json` itself. Each is validated against the definition its filename names — `loadTarget.absolute.example.json` against `#/$defs/loadTarget` — by `scripts/check-prescription.mjs`.

Two suffixes, two jobs:

- `*.example.json` — MUST validate. One exists for every discriminator value the schema defines, and the check fails if a new one is added without a fixture.
- `*.invalid.json` — MUST NOT validate. These pin down what the schema still refuses. A negative fixture that starts passing means the schema stopped catching something it names.

The explanations live here rather than inside the files: most branches are `additionalProperties: false`, so a `_comment` key would make a fixture fail its own validation. That is the right trade — a fixture carrying explanatory keys is no longer a faithful example of the shape.

Every fixture in this directory is listed below, and the check enforces that in both directions.

## `loadTarget`

How much load a set prescribes. See RFC-006 §4.1, and §5 for what each method needs before it becomes an absolute number.

| Fixture | Demonstrates |
|---|---|
| `loadTarget.absolute.example.json` | A fixed load. The only method that needs no resolution context. |
| `loadTarget.percent1RM.example.json` | 82.5% of the prescribed exercise's own one-rep max — the percentage-driven program case. |
| `loadTarget.percent1RM-of-another-lift.example.json` | 70% of a *different* lift's max. Accessory work is routinely scaled off a main lift, and without `referenceExerciseId` there is nowhere to say so. |
| `loadTarget.percent-bodyweight.example.json` | 60% of bodyweight. Unresolvable inside FDS by design — there is no athlete to read a bodyweight from. |
| `loadTarget.rpe.example.json` | RPE 8 with half-points allowed. The athlete picks the load. |
| `loadTarget.rpe-band.example.json` | The same prescription given as a band rather than a point, via `range`. |
| `loadTarget.rir.example.json` | Two reps in reserve. The inverse scale to RPE; a bare `count` cannot tell you which was meant, which is why they are separate methods. |
| `loadTarget.velocity-with-loss-threshold.example.json` | Velocity-based training: lift at 0.75 m/s, end the set when bar speed has dropped 20% from the fastest rep. The set length is decided by the bar, not the program. |
| `loadTarget.machine-level.example.json` | A machine setting, with `scale` naming whose numbering it is. Reproduces a session on *that* machine and means nothing on another. |
| `loadTarget.band-resistance.example.json` | A green band with an estimated equivalent load. Colour conventions are manufacturer-specific, so `equipment` says whose scale is meant and `estimatedLoad` is explicitly an approximation. |
| `loadTarget.assisted.example.json` | 20 kg of *assistance*. The value is positive and more of it is less effort — a consumer plotting this as resistance shows an athlete regressing as they get stronger. |
| `loadTarget.relative-last-session.example.json` | Last session plus 2.5 kg. Linear progression, resolvable only against training history. |
| `loadTarget.relative-e1rm.example.json` | Ten percent *below* an estimated 1RM for a named lift. A negative delta is normal here: e1RM is computed from a set taken near failure, so programming under it is the usual case, not an error. |
| `loadTarget.relative-training-max.example.json` | 90% of a training max — the 5/3/1-style basis, where the reference is deliberately below a true max. |
| `loadTarget.bodyweight.example.json` | Bodyweight, unscaled and unloaded. |
| `loadTarget.autoregulated.example.json` | Load deferred to a progression rule resolved at execution time (here, APRE). |
| `loadTarget.none.example.json` | Load deliberately unprescribed — a different claim from omitting `load`, which means unstated. |
| `loadTarget.forward-compatible.example.json` | A method this version has never heard of, still validating. This is the branch that lets a 1.1.0 document survive a 1.0.0 validator. |

### Negative cases

| Fixture | Must be rejected because |
|---|---|
| `loadTarget.missing-unit.invalid.json` | `absolute` without a unit is a number with no meaning. |
| `loadTarget.no-method.invalid.json` | Nothing selects a branch, so nothing can be resolved. |
| `loadTarget.unknown-field-on-known-method.invalid.json` | The catch-all branch must not swallow a malformed *known* method. If this ever passes, the union has stopped discriminating and every typo validates. |
| `loadTarget.rir-out-of-scale.invalid.json` | RIR 11 is off the end of a 0–10 scale. |
| `loadTarget.velocity-wrong-unit.invalid.json` | Bar speed is `m_s`; `km_h` is for whole-body travel. |
| `loadTarget.assisted-negative-value.invalid.json` | Assistance is expressed as a positive magnitude. A negative one is a double negative nobody can interpret. |
| `loadTarget.bodyweight-with-load.invalid.json` | `bodyweight` carrying a load is a contradiction. Rejected because that branch closes `additionalProperties` — if someone opens it for convenience, this fixture is what notices. |

## `loadRange`

| Fixture | Demonstrates |
|---|---|
| `loadRange.absolute-band.example.json` | A kilogram band, for a method whose units are absolute. |
| `loadRange.rpe-band.example.json` | The same structure in RPE points. `range` takes the units of the method that encloses it, which is why it carries none of its own. |
| `loadRange.missing-max.invalid.json` | A band with only one end is not a band. |

## `repTarget`

What terminates a set. RFC-006 §4.2.

| Fixture | Demonstrates |
|---|---|
| `repTarget.fixed.example.json` | A fixed count. |
| `repTarget.hypertrophy-range.example.json` | 8–12, the range that double progression operates on. |
| `repTarget.amrap.example.json` | As many as possible, with a floor the set should clear and a cap that stops it running long. |
| `repTarget.technical-failure.example.json` | Stop when form degrades, not when the rep cannot be completed. Every coach makes this distinction and no prior interchange format recorded it. |
| `repTarget.timed-set.example.json` | A 45-second set — the terminator is the clock, not a rep count. |
| `repTarget.distance.example.json` | 400 m. |
| `repTarget.calories.example.json` | 15 calories, the usual terminator on air bikes and rowers. |
| `repTarget.max-hold.example.json` | Hold as long as possible, with a floor and a cap. |
| `repTarget.forward-compatible.example.json` | An unrecognized kind, still validating. |
| `repTarget.zero-reps.invalid.json` | A set of zero reps is not a prescription. |

## `tempo` and `tempoPhase`

Per-phase timing. RFC-006 §4.3.

| Fixture | Demonstrates |
|---|---|
| `tempo.eccentric-focus.example.json` | A four-second lowering, one-second pause, explosive drive, no pause at the top. |
| `tempoPhase.seconds.example.json` | A phase as a plain number of seconds. |
| `tempoPhase.explosive.example.json` | `"X"` — as fast as possible, which is an instruction rather than a duration. |
| `tempo.non-numeric-phase.invalid.json` | Prose in a phase. `"slow"` is not a tempo. |
| `tempoPhase.negative.invalid.json` | Negative time. |

## `restSpec` and `restScope`

Prescribed rest, and the boundary it binds to. RFC-006 §4.4.

| Fixture | Demonstrates |
|---|---|
| `restSpec.between-rounds.example.json` | Three minutes, explicitly between *rounds*. |
| `restSpec.range.example.json` | 90–120 seconds between sets. |
| `restSpec.to-heart-rate.example.json` | Rest until heart rate falls to 120 bpm — needs live data at execution time. |
| `restSpec.as-needed.example.json` | Athlete's discretion, stated rather than omitted. |
| `restSpec.work-to-rest-ratio.example.json` | 1:2, resolved against the work interval's duration. |
| `restSpec.forward-compatible.example.json` | An unrecognized rest method, still validating. |
| `restScope.round.example.json` | The scope value on its own. |
| `restSpec.missing-scope.invalid.json` | A duration with no `appliesTo`. The field most likely to be dropped when porting from a simpler format, and the ambiguity is not recoverable afterwards — 30 seconds between superset members and 3 minutes between rounds are both "rest". |
| `restScope.invalid.json` | A scope outside the four the schema defines. |

## `intensityZone`

RFC-006 §4.5.

| Fixture | Demonstrates |
|---|---|
| `intensityZone.heart-rate.example.json` | Z4 in a named five-zone system. `boundsRef` is what makes the label mean the same thing to two producers. |
| `intensityZone.power.example.json` | Z3 against a published power-zone model. |
| `intensityZone.perceived-no-bounds.example.json` | A perceived-effort zone with no bounds reference — legal, and only meaningful inside the producer that wrote it. |
| `intensityZone.unknown-system.invalid.json` | `watts` is a unit, not a zone system. |

## `setScheme`

Named set patterns. RFC-006 §4.6 documents the conventional `params` keys.

| Fixture | Demonstrates |
|---|---|
| `setScheme.straight.example.json` | Three identical sets — `sets` alone is enough. |
| `setScheme.ramping.example.json` | Ascending 60% to 90% across five sets. |
| `setScheme.reverse-pyramid.example.json` | Heaviest first, dropping 10% per set. |
| `setScheme.drop.example.json` | Three consecutive drops of 20% with no rest between. |
| `setScheme.rest-pause.example.json` | One set to near-failure, resumed after 15-second rests. |
| `setScheme.cluster.example.json` | Reps grouped in twos with programmed rest *inside* the set. |
| `setScheme.myo-reps.example.json` | An activation set followed by four short mini-sets. |
| `setScheme.wave.example.json` | A 3‑2‑1 ladder run three times. |
| `setScheme.ladder.example.json` | Explicit ascending rungs. |
| `setScheme.density.example.json` | Maximum sets inside a ten-minute cap — the one pattern where `sets` is the outcome rather than the input. |
| `setScheme.top-set-backoff.example.json` | One top set, then three back-offs 10% lighter. |
| `setScheme.unknown-pattern.invalid.json` | `pattern` is a **closed** enum, unlike the other unions. A consumer cannot expand a pattern it does not know, so accepting one would only defer the failure to where it does damage. |

## `progressionRule`

RFC-006 §4.7.

| Fixture | Demonstrates |
|---|---|
| `progressionRule.double-progression.example.json` | Reach the top of the rep range on every working set, then add 2.5 kg. Trigger and action are separate objects so the same trigger can drive different actions in RFC-007 and RFC-008. |
