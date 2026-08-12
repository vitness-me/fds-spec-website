# The fitness-software landscape — who could move to FDS

A map of the ecosystem by archetype, to decide which platforms to build conformance corpora against
next. Desk research from public sources; confidence marked **H/M/L** per claim. This is a planning
document, not a gate — the corpus itself is the three platforms under `platforms/`.

The single highest-leverage entity across the whole map is a **canonical exercise identity + muscle/
equipment taxonomy**: every migration tool, library and logger independently reinvents exercise-name
matching ("DB Bench Press" ↔ "Dumbbell Bench Press" ↔ an id). Second is a structured
**prescription/intensity** model (sets/reps/%1RM/RPE/tempo), which FIT partially has, FHIR lacks, and
coaching/S&C platforms all express in incompatible proprietary ways.

## 1. Online coaching / client-delivery — strongest beneficiaries

Coaches build proprietary program libraries inside these; switching means rebuilding by hand.
Migration friction is the acute pain.

| Platform | Produces | Access | In corpus |
|---|---|---|---|
| **Trainerize** | exercises, workouts, programs, logs, habits | Open API (Studio/Enterprise) + webhooks (H) | **yes** (coaching exemplar) |
| TrueCoach | workouts, exercise library, logs | lossy CSV export, Zapier-only key (H) | candidate |
| Everfit | library, workouts, programs, nutrition | Zapier; no documented open API (M) | — |
| My PT Hub / PT Distinction | exercises, workouts, programs, assessments | limited integrations (M) | — |
| CoachRx (OPEX) | programs, structured "RxD" prescriptions | client import; no public API (M) | strong prescription candidate |
| Kahunas | workouts, programs, check-ins | integrations-oriented (L) | — |

## 2. Strength & conditioning programming / marketplaces

Marketplaces **syndicate** program content — a portability standard is directly aligned with the
business.

| Platform | Produces | Access | In corpus |
|---|---|---|---|
| **TrainHeroic** | programs, workouts, logs, marketplace | closed API, CSV only (H) | **yes** (prescription exemplar) |
| TeamBuildr | programs, workouts, maxes, readiness | API + webhooks, exports (H) | **most open** — strong next pick |
| Juggernaut AI | auto-regulated programs, RPE/readiness | no export/API (H) | — |
| Boostcamp | 70+ named programs, logs, RPE/PRs | no documented export (M) | — |
| BridgeAthletic / Volt | team/AI programs, workouts, logs | AMS-oriented, no broad API (M) | — |

## 3. Exercise libraries / content databases — the reference layer

The open ones are the natural early adopters and canonical seeds.

| Source | Produces | Access | In corpus |
|---|---|---|---|
| **wger** | 845+ exercises, muscles, equipment, images; routines/logs | full REST API, self-hostable, AGPLv3, CC-BY-SA data (H) | **yes** (library exemplar) |
| Free Exercise DB (yuhonas) | 800+ exercises with a JSON Schema | public-domain, raw JSON on GitHub (H) | **de-facto baseline** — strong next pick |
| MuscleWiki | 1,900+ exercises, videos, 45 muscle groups | commercial API, attribution required (H) | taxonomy crosswalk |
| ExRx.net | large library, kinesiology reference | commercial JSON API (H) | taxonomy crosswalk |
| Everkinetic | open illustrated library | historically CC-licensed (M) | — |
| NASM / ACE / ACSM libraries | curated instruction, canonical naming | web reference, no API (M) | vocabulary anchor (§7) |

## 4. Consumer workout loggers / trackers — grassroots demand

Migration between these (Strong→Hevy, Fitbod→Hevy) is a live user need solved today by lossy CSVs.

| App | Produces | Access | In corpus |
|---|---|---|---|
| Hevy | logged workouts, routines, templates | **official REST API**, CSV import/export (H) | **strong next pick** (interop leader) |
| Strong | logged workouts, sets/reps/weight | CSV export only, no re-import (H) | adversarial lossy input |
| Fitbod | AI workouts, logs, recovery model | CSV export (M) | — |
| Jefit / FitNotes | library, routines, logs | export/backup (M) | — |

## 5. Institutional / clinical / rehab / EMR-adjacent — the FHIR bridge

A parallel standards world (HL7/FHIR) already exists; the opportunity is a bridge, because FHIR has no
native exercise-prescription resource.

| Platform | Produces | Access |
|---|---|---|
| Physitrack / PhysiApp | 17,000+ videos, home-exercise prescriptions, adherence, PROMs | deep PMS integrations; HL7/FHIR discussed (M) |
| Exercise.com | library, workouts, programs, assessments | integrations (M) |
| TrainerRoad | structured cycling workouts, plans, adaptive | Strava/Garmin sync, iCal (H) |
| HEP2go / MedBridge / Rehab My Patient | libraries, prescribed HEPs, adherence | mostly PDF + PMS (M) |

## 6. Wearables / device ecosystems

Key insight: **most wearables model strength poorly** — rich biometrics, coarse activity types.
Garmin FIT and Google Health Connect are the exceptions that already model sets.

| Ecosystem | Structured strength? | Access |
|---|---|---|
| **Garmin Connect / FIT SDK** | **yes** — FIT `Set` message = sets/reps/weight/exercise | documented binary spec + SDK (H) — **highest crosswalk value** |
| **Google Health Connect** | yes — `ExerciseSegment` + reps, Training Plans API | open Android API (H) — structurally nearest |
| Apple HealthKit | no — activity type only, no sets/reps | documented on-device API (H) |
| Whoop | in-app Strength Trainer, but **not** exposed via API | public API omits strength detail (H) |
| Peloton | strength activities exist but locked | no official API (H) |

## 7. Governing bodies / education — vocabulary anchors, not corpora

NSCA (Exercise Technique Manual — 70 canonical resistance exercises; Guide to Program Design), NASM
(OPT model), ACE, ACSM (FITT / intensity thresholds). No APIs, but the authority a standard cites for
canonical naming, muscle taxonomy and prescription variables.

## Existing standards to crosswalk (adjacency)

| Standard | Relationship to FDS |
|---|---|
| **FIT (Garmin)** `Set` message | closest competitor/complement for logged strength — map cleanly to/from it |
| **Free Exercise DB JSON Schema** | de-facto baseline for the `Exercise` entity; public domain — safe to converge |
| **HL7 / FHIR** | bridge target for rehab/EMR; FHIR has no native exercise-Rx resource |
| **Google Health Connect** | structurally nearest open API for workout + program |
| TCX / GPX / `.zwo` / TrainingPeaks | structured-cardio precedents; instructive, low strength overlap |

## Recommended next corpora, in priority order

1. **Free Exercise DB** (transform, exercise) — public-domain, has its own JSON Schema; the cleanest
   possible second library and a direct test of converging with an existing de-facto standard.
2. **Hevy** (fidelity/transform, workout + performed) — official API, interop leader; first real test
   toward RFC-009 performed data.
3. **Garmin FIT `Set` crosswalk** (fidelity, workout) — the highest-value device crosswalk and a
   competitor-alignment exercise.
4. **TeamBuildr** (fidelity, program) — the most open S&C platform; second prescription datapoint.
5. **Physitrack** (fidelity, prescription) — opens the clinical/FHIR-bridge archetype.

Confidence caveat: access claims for closed platforms (Everfit, PT Distinction, Kahunas, Volt,
BridgeAthletic, Exercise.com) are M/L and should be confirmed against vendor docs before committing
corpus effort.
