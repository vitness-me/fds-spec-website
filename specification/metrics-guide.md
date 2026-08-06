# Metrics Pairing Guide

This guide specifies valid and recommended metric type/unit pairs and per‑exercise‑type expectations to promote consistency across implementations.

The Exercise schema constrains the *structure* of `metrics` and the membership of `type` and `unit` in their enums. It does **not** constrain which unit goes with which type — `{"type": "reps", "unit": "kg"}` is schema-valid and meaningless. That pairing is what this guide fixes.

## Valid Type/Unit Pairs

### Measurement

| Type        | Allowed Units                                   | Notes                              |
|-------------|--------------------------------------------------|------------------------------------|
| `reps`      | `count`                                          | Whole numbers                      |
| `weight`    | `kg`, `lb`                                       | Prefer one system per dataset      |
| `duration`  | `s`, `min`, `ms`                                 | Seconds for precision; `ms` for sub-second work (per-rep or per-phase timing in velocity-based training) |
| `distance`  | `m`, `km`, `mi`                                  |                                    |
| `speed`     | `m_s`, `km_h`                                    | Whole-body travel over ground      |
| `pace`      | `min_per_km`, `min_per_mi`                       |                                    |
| `power`     | `W`                                              |                                    |
| `heartRate` | `bpm`                                            |                                    |
| `steps`     | `count`                                          |                                    |
| `calories`  | `kcal`                                           | Estimated                          |
| `height`    | `cm`, `in`                                       | For jumps/box height               |
| `velocity`  | `m_s`                                            | Bar or implement speed, not the athlete's. Distinct from `speed` |

### Effort and intensity

| Type                | Allowed Units | Notes                                                        |
|---------------------|---------------|--------------------------------------------------------------|
| `rpe`               | `count`       | 1–10 scale                                                    |
| `rir`               | `count`       | Reps in reserve, 0–10. Inverse of `rpe`; do not mix the two in one dataset without recording which |
| `percent1RM`        | `percent`     | Relative to a one-rep max, which MAY be a different lift than the one prescribed |
| `percentBodyweight` | `percent`     | Requires a bodyweight the standard does not carry — see below |
| `oneRepMax`         | `kg`, `lb`    | A reference value, not a logged metric — see below            |
| `tempo`             | `count`       | Convention, e.g. 3‑1‑1 as counts. For real sub-second timing use `duration` with `ms` |

### Prescription structure

| Type              | Allowed Units | Notes                                                     |
|-------------------|---------------|-----------------------------------------------------------|
| `sets`            | `count`       | Only when sets are themselves the prescribed quantity (density work: "as many sets as possible in 10 minutes"). Ordinary set counts are structure, not a metric |
| `rounds`          | `count`       | Circuits and AMRAP                                        |
| `rest`            | `s`, `min`    | Prescribed rest, not observed                             |

### Machine settings

| Type              | Allowed Units | Notes                                                     |
|-------------------|---------------|-----------------------------------------------------------|
| `cadence`         | `rpm`, `spm`  | `rpm` for cycling; `spm` for running, rowing and swimming |
| `incline`         | `percent`     | Treadmill grade                                           |
| `resistanceLevel` | `level`       | Machine pin or stack position — opaque, see below         |

### Types that need care

**`percentBodyweight`** describes load as a fraction of the athlete's bodyweight. FDS carries no athlete, by design (there is no User or Profile entity), so this type is only resolvable against a bodyweight the *consumer* supplies. A producer emitting it MUST accept that consumers without a bodyweight cannot render an absolute load.

**`oneRepMax`** is a reference an intensity is computed *from*, not a measurement taken during a set. It belongs alongside `percent1RM`, and a consumer that plots it as a per-set metric will produce nonsense.

**`resistanceLevel`** is an opaque setting. Two manufacturers' "level 7" are unrelated, and so are two gyms' pin positions on nominally identical stacks. Record it to reproduce a session on the same machine; do **not** convert it to load or compare it across facilities. Where the implement publishes real increments, `equipment.loading.increment` is the portable answer.

## Exercise Type Expectations

`classification.exerciseType` is an open string (RFC-001 §4.2), so this table is guidance for common values rather than a closed list.

| Exercise Type | Primary Metric                 | Common Secondary Metrics                                       |
|---------------|--------------------------------|-----------------------------------------------------------------|
| strength      | `reps`                         | `weight`, `tempo`, `rpe`, `rir`, `percent1RM`, `rest`           |
| power         | `reps` or `duration`           | `weight`, `power`, `height`, `velocity`, `percent1RM`, `rest`   |
| cardio        | `duration` or `distance`       | `pace` or `speed`, `heartRate`, `cadence`, `incline`, `resistanceLevel` |
| endurance     | `duration` or `distance`       | `pace`/`speed`, `heartRate`, `calories`, `cadence`, `rest`      |
| conditioning  | `duration` or `rounds`         | `rest`, `calories`, `heartRate`, `cadence`, `resistanceLevel`   |
| mobility      | `duration`                     | `tempo`                                                          |
| isometric     | `duration`                     | `rpe`, `rir`                                                     |
| plyometric    | `reps`                         | `height`, `duration`, `rest`                                     |

Notes:
- Strength logging SHOULD at minimum support `reps`; `weight` is strongly recommended when applicable.
- Cardio logging SHOULD include `duration` and either `distance` or `pace` (derive one from the other when possible).
- Mobility/isometric SHOULD use `duration` as primary; avoid `reps` unless domain‑specific.
- Velocity-based work pairs `velocity` with `percent1RM`, and often `duration` in `ms` for concentric timing. Both are secondary to `reps`.
- Prescribe effort with `rpe` **or** `rir` consistently within a dataset. They are inverses, and a consumer cannot tell from a bare `count` which scale was meant.
- `rest` on an exercise records a default the movement suggests. A prescription that varies rest between sets carries it at the set level, not here.

## Loading, and where increments live

`exercise.loading` (RFC-001 §4.6) states whether a movement accepts external load, whether that load is assistive, and whether the sides load independently.

Load **increments** are not on the exercise. The smallest usable step is a property of the implement — a 2.5 kg plate pair, a 5 lb dumbbell jump, one pin on a stack — so it lives on `equipment.loading.increment` (RFC-002 §4.4). The same movement performed with dumbbells and with a barbell has two different smallest steps, which a field on the exercise could not express.

A consumer computing an absolute load from `percent1RM` SHOULD round to the nearest achievable multiple of the implement's increment rather than presenting an unloadable number.

## Validation Guidance
- The Exercise schema constrains `metrics` structure and enum membership; this guide clarifies domain expectations and recommended pairings.
- Producers SHOULD select metrics consistent with `classification.exerciseType`.
- Consumers MAY validate pairings to provide better UX and error messaging.
- A pairing absent from this guide is not thereby invalid — the guide records the pairings that are known to be meaningful, and consumers SHOULD warn rather than reject.
