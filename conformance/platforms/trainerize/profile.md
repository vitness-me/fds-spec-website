# Trainerize — platform profile

**Archetype:** online coaching / client-delivery · **Mode:** fidelity · **Produces:** workout, program

ABC Trainerize is one of the largest coaching-delivery platforms: coaches build proprietary exercise,
workout and program libraries inside it and deliver them to clients on a calendar. It is the
canonical coaching-platform exemplar, and the one named first for this corpus, because program →
workout → delivery all meet here and migration friction (a coach leaving means rebuilding everything
by hand) is the acute pain a portability standard addresses.

## Sourcing

Reconstructed from public Trainerize help-centre articles and blog posts (cited below), not from
exported data or a published schema. Trainerize exposes an Open API + webhooks on Studio/Enterprise
tiers but does **not** publish field-level JSON schemas, so the fixtures are original artifacts built
to match documented behaviour. Terminology and structure are high-confidence; literal field names are
not claimed. A production mapping must be validated against real API responses under a Studio account.

Primary sources: *What Type of Exercises Can I Create?*, *What Types of Workouts Can I Create?*, *How
to Create Superset and Circuit Workouts*, *How to Create Interval Workouts*, *What is a Phased Program*,
*How to Subscribe a Client to a Master Program*, *Using API and Webhooks With ABC Trainerize*
(help.trainerize.com).

## The data model

**Exercise.** A typed unit in an Exercise Library. Its **Exercise Type** (General/Display, Endurance
(Reps), Strength (Reps × Weight), Cardio, Timed) *determines which stats are trackable* — tracking is
derived from type, not stored as independent flags. Tags span muscle / equipment / force / mechanics
/ level.

**Workout.** Four types: **Regular** (ordered exercises, groupable into supersets/circuits),
**Circuit** (repeating rounds), **Interval** (continuous timed sequence with countdowns and voice
cues), and **Video** (a full-length video class, no exercise structure). Per-exercise attributes:
sets, reps (value or range), target weight, tempo, rest, notes. Grouping is supersets (one shared set
count, one inline rest) and circuit rounds.

**Program.** A Master Program of back-to-back **Training Phases**; each phase has a **relative**
Program Schedule (day-of-phase, not dated) onto which workouts, cardio, habits, body-stat reminders
and auto-messages are placed.

**Delivery.** Distinct layer: subscribing a client projects the phase's relative schedule onto their
**dated** Client Calendar from a **Start Date** (fixed or flexible; backdate/pause supported).

## Fixtures and how they map

| Fixture | Trainerize construct | FDS expression |
|---|---|---|
| `workout.trainerize-upper-superset` | Regular workout with a superset | block `mode: sequential` + block `mode: superset` with `groupLabel` A1/A2; `absolute` and `bandResistance` loads; `tempo` phases from "3-1-1" |
| `workout.trainerize-interval` | Interval workout | block `mode: interval` with `modeParams`; `reps.kind: time` per item |
| `program.trainerize-phased` | Master Program, two phases | `schedule.model: relative` with `offsetDays`; phases → cycles; `authorship` for the coach; cardio/habit days carried as annotated rest |

All three validate against the published workout/program schemas. What Trainerize could **not** carry
into FDS cleanly is in `gaps.md`.

## What this exercises in FDS

RFC-007 (workout: superset and interval modes, grouping, tempo), RFC-008 (program: the `relative`
schedule model, `authorship`), and RFC-006 (the `absolute`/`bodyweight`/`bandResistance` load
targets). It is the corpus's main test of the workout→program→delivery seam.
