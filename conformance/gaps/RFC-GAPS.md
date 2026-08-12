# Cross-platform RFC gap rollup

The corpus's payload. Each platform's `gaps.md` scores that platform against the RFCs; this file
rolls the findings up to the RFC level, so a maintainer reading it sees where the standard holds
across archetypes and where a real product broke it. It covers **wger** (open exercise library),
**trainerize** (coaching delivery) and **trainheroic** (strength programming).

The one-line verdict: **the prescription and workout primitives are in good shape — the percentage,
per-set-load and training-max machinery survived contact with TrainHeroic's real methodology. The
sharpest findings are at the edges: what a large open *library* is required to carry, and where the
*delivery* of a program stops being portable.**

## Findings by RFC

### RFC-001 — Exercise · required classification vs. real libraries

**Raised by:** wger. **Severity: high (adoption barrier).**

FDS requires `classification.{exerciseType, movement, mechanics, force, level}` and `metrics.primary`
(RFC-001 §3.1, §4.2, §4.5). wger — the largest openly-licensed exercise database — carries none of
them. A wger import therefore cannot produce valid FDS by mapping alone; it must enrich six values per
exercise. This is the corpus's clearest "the spec is stricter than the ecosystem" result. The open
question for RFC-001: relax these to recommended, keep them required but publish an official
enrichment profile, or keep the status quo and document the two-step import in RFC-001 §6.2. See
`platforms/wger/gaps.md`.

### RFC-006 — Prescription primitives · they hold

**Tested hardest by:** trainheroic. **Result: pass.**

TrainHeroic's percentage-of-working-max, per-set weight arrays, RPE, AMRAP and bodyweight all map to
RFC-006 §4.1 methods with no loss. FDS is in fact a *superset* on velocity-based training (RFC-006
§4.1 `velocity` + `lossThreshold`), which TrainHeroic lacks entirely. The only prescription-adjacent
gap is lifecycle state on a training max (below, RFC-008). No RFC-006 change is indicated by this
batch — a genuinely reassuring result for the newest and most intricate library.

### RFC-007 — Workout · modes and per-set load hold; two structural edges

**Raised by:** trainerize, trainheroic. **Result: mostly pass.**

Superset, circuit and interval modes and `groupLabel` grouping (RFC-007 §3.3) expressed every
Trainerize and TrainHeroic session tried, and per-set `setPrescription.load` (RFC-007 §4.4) carried
TrainHeroic's percentage waves. Two edges surfaced, both low-to-medium:

- A Trainerize **Video** workout has no exercise structure, but RFC-007 §3.1 requires
  `structure.blocks`. RFC-007 could state whether a structureless media session is in scope.
- Whether a scheduled **cardio activity** is a `conditioning` workout or something else is unstated;
  it bit the Trainerize program (below).

### RFC-008 — Program · relative schedule holds; delivery and max-state do not

**Raised by:** trainerize, trainheroic. **Severity: high (delivery), medium (max-state).**

- **Delivery/assignment has no home.** Trainerize's relative Program Schedule maps exactly onto
  `schedule.model: relative` (RFC-008 §3.3), but its **Start-Date subscription onto a dated client
  calendar** is deliberately out of scope — a dated program is personal data (RFC-008 §8.2). Very
  likely the correct boundary, but it is undocumented for the coaching case, so "port my business"
  silently drops every client assignment. Recommendation: name the boundary in RFC-008 (or the
  deferred RFC-009).
- **Training-max lifecycle state is unstatable.** RFC-008 §8.1's `trainingMaxSlot` records the
  derivation method but not TrainHeroic's tested/locked-vs-auto-updating state, which is what actually
  decides whether percentages move this cycle. Candidate: an optional state field, or an explicit note
  that lifecycle is resolution-context (RFC-006 §5).
- **Non-lifting scheduled items.** Cardio, habits and reminders on a Trainerize phase have no program
  day type (RFC-008 §3.5 — a day is a workout or a rest). Carried lossily as annotated rest. RFC-008
  §4.9 could say how these are meant to be represented.

## Severity roll-up

| Finding | RFC | Platforms | Severity | Nature |
|---|---|---|---|---|
| Required classification exceeds what libraries carry | RFC-001 §3.1 | wger | high | adoption barrier |
| Delivery/assignment (dated client calendar) unmodelled | RFC-008 §8.2 | trainerize | high | boundary, undocumented |
| Training-max lifecycle state unstatable | RFC-008 §8.1 | trainheroic | medium | missing field |
| Non-lifting scheduled days (cardio/habit/reminder) | RFC-008 §3.5 | trainerize | medium | scope gap |
| Structureless (Video) workout has no shape | RFC-007 §3.1 | trainerize | low-med | scope question |
| Prescription primitives (percentage/RPE/per-set) | RFC-006 §4.1 | trainheroic | — | **pass** |
| Workout modes & grouping | RFC-007 §3.3 | trainerize, trainheroic | — | **pass** |

## What this rollup is not

It is three archetypes, not the ecosystem. `landscape.md` lists the platforms not yet in the corpus
(consumer loggers, wearables/FIT, clinical/FHIR), each of which will stress different seams —
especially performed data (RFC-009, deferred) and the Garmin FIT `Set` crosswalk. Every platform
added is a row here; none should be left out of this picture.
