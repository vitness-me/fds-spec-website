# Cross-platform RFC gap rollup

The corpus's payload, and its one question:

> **FDS is the standard. Platforms conform to FDS, not the other way round. So: is there anything a
> real platform produces, in the wild, that FDS cannot represent?**

A field FDS *requires* that a platform lacks is the platform's to enrich on adoption — not counted
here. What is counted is the reverse: **real emitted data with no first-class home in FDS.** This file
rolls those findings up to the RFC level across **wger** (open exercise library), **trainerize**
(coaching delivery) and **trainheroic** (strength programming).

The one-line verdict: **FDS is a near-complete superset of what these three archetypes emit.** The
prescription and workout primitives held — TrainHeroic's percentage-of-working-max, per-set loads and
training-max slots all expressed natively. Every genuine coverage gap found is listed below, and none
is a hole in the core prescription model; they cluster at the licensing, delivery, and non-lifting
edges.

## Coverage gaps — things a platform emits that FDS cannot hold first-class

### RFC-001 — Exercise has no licence/attribution field

**Raised by:** wger. **Severity: high for the open-data archetype.**

Every wger exercise emits `license` + `license_author`. FDS holds a **media** licence
(`media[].license`, RFC-001 §3.2) but has no **exercise-level** licence field, so the content licence
of the exercise itself can only ride in the `attributes` escape hatch (RFC-001 §3.3) — where no
consumer is obligated to preserve it. For CC-BY-SA content that is the attribution the licence legally
requires, silently droppable on the next hop. FDS already solved this for **programs** (RFC-008 §4.8
`authorship`); the same block is the candidate fix for exercises. Until then an open library cannot
fully adopt FDS without demoting its licence to free-form. See `platforms/wger/gaps.md`.

### RFC-008 — Program cannot hold non-lifting scheduled items, or the delivery layer

**Raised by:** trainerize. **Severity: medium (non-lifting items), high but likely deliberate (delivery).**

- **Non-lifting days.** A Trainerize phase schedules cardio activities, habits, body-stat/photo
  reminders and auto-messages. An FDS program day is a workout **or** a rest day (RFC-008 §3.5) —
  there is no cardio-target day, habit, or reminder. Carried lossily as annotated rest. A structured
  cardio session is arguably a `conditioning` workout; habits/reminders may be RFC-009 territory.
  RFC-008 §4.9 could state how non-lifting scheduled items are represented.
- **Delivery/assignment.** Trainerize's start-date subscription onto a **dated** client calendar has
  no FDS home. This is very likely the correct boundary — a dated program is personal data (RFC-008
  §8.2) — but it is undocumented for the coaching case, so "port my business" silently drops every
  client assignment. Recommendation: name the boundary explicitly (RFC-008, or the deferred RFC-009).

### RFC-008 — Training-max lifecycle state is unstatable

**Raised by:** trainheroic. **Severity: medium.**

`trainingMaxSlot` (RFC-008 §8.1) records how a max is derived but not TrainHeroic's tested/locked-vs-
auto-updating state — which is what decides whether this cycle's percentages move. Candidate: an
optional state field, or an explicit note that lifecycle is resolution-context (RFC-006 §5).

### RFC-007 — Two structural edges

**Raised by:** trainerize, trainheroic. **Severity: low–medium.**

- A Trainerize **Video** workout has no exercise structure, but RFC-007 §3.1 requires
  `structure.blocks`. RFC-007 could say whether a structureless media session is in scope.
- TrainHeroic **`leaderboard`** (competitive/benchmark) blocks have no counterpart on RFC-007 §4.2
  `block`; they ride in `extensions`.

### RFC-001 — Minor: display-only exercises and provenance

**Raised by:** trainerize (display-only), wger (provenance). **Severity: low.**

- A metric-less **display-only** exercise cannot satisfy the required `metrics.primary` (RFC-001
  §4.5) without inventing a metric.
- wger's `author_history` and its body-part `category` have no first-class home and ride in
  `attributes`.

## The core held — no gap found

- **RFC-006 prescription primitives.** TrainHeroic's percentage-of-working-max, per-set weight arrays,
  RPE, AMRAP and bodyweight all map to RFC-006 §4.1 with no loss; FDS is a *superset* on velocity
  training, which TrainHeroic lacks. No RFC-006 change indicated.
- **RFC-007 workout modes.** Superset, circuit and interval modes and `groupLabel` grouping (RFC-007
  §3.3) expressed every Trainerize and TrainHeroic session; per-set `setPrescription.load` (RFC-007
  §4.4) carried the percentage waves.
- **RFC-008 relative scheduling** (§3.3) and **authorship** (§4.8) carried the program structure.

## Severity roll-up

| Coverage gap (platform emits → FDS has no first-class home) | RFC | Platforms | Severity |
|---|---|---|---|
| Exercise-level licence / attribution | RFC-001 §3.2 | wger | high (open data) |
| Non-lifting scheduled days (cardio/habit/reminder) | RFC-008 §3.5 | trainerize | medium |
| Client assignment / dated delivery | RFC-008 §8.2 | trainerize | high, likely deliberate |
| Training-max lifecycle state | RFC-008 §8.1 | trainheroic | medium |
| Structureless (Video) workout | RFC-007 §3.1 | trainerize | low-med |
| Competitive `leaderboard` blocks | RFC-007 §4.2 | trainheroic | low |
| Display-only (metric-less) exercise | RFC-001 §4.5 | trainerize | low |
| Prescription primitives (percentage/RPE/per-set) | RFC-006 §4.1 | trainheroic | **no gap — held** |

## Deliberately out of scope (real, but planned)

Logged/performed results — which all three platforms produce and TrainHeroic separates cleanly from
prescription — are excluded on purpose (RFC-007 §1.3, deferred to RFC-009). Recorded so a reader does
not mistake the boundary for a hole.

## What this rollup is not

Three archetypes, not the ecosystem. `landscape.md` lists what is untested — consumer loggers,
wearables/FIT, clinical/FHIR — each of which stresses a different seam, especially performed data and
the Garmin FIT `Set` crosswalk. Every platform added is a row here; none should be left out of the
picture.
