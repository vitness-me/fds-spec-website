# Trainerize — RFC gap report

## Headline: the delivery/assignment layer has no FDS home

**Severity: high (a genuine boundary, arguably correct — but undocumented).**

Trainerize separates a **relative** Program Schedule (day-of-phase) from a client's **dated**
calendar, joined by a **Start-Date subscription**. FDS models the relative plan well —
`schedule.model: relative` with `offsetDays` (RFC-008 §3.3) is an exact fit — but it deliberately
models **no client, no subscription, and no dated instance**. A resolved, dated program is personal
data by RFC-008 §8.2 and is explicitly excluded.

So the plan round-trips and the *delivery* does not. This is very likely the correct boundary — the
same reasoning that keeps training-max **values** out (RFC-008 §8.1) keeps the athlete-dated calendar
out — but it means "port my Trainerize business to FDS" is only ever half a port: the libraries move,
the client assignments do not, and that belongs to the deferred RFC-009 (performed/personal data).
The gap is that this is nowhere stated for the coaching-platform case. **Recommendation:** RFC-008 or
RFC-009 should name the assignment/subscription boundary explicitly, so an implementer knows the
dated calendar is out of scope by design rather than by omission.

## Real gaps

- **Cardio / habit / reminder days.** A Trainerize phase schedules cardio activities, habits,
  body-stat and progress-photo reminders and auto-messages alongside workouts. An FDS program day is a
  workout **or** a rest day (RFC-008 §3.5) — there is no cardio-activity day, habit, or reminder. In
  `program.trainerize-phased` these are carried as `rest: true` with an explanatory note, which is
  lossy: a Zone-2 cardio prescription becomes "rest + prose". **Severity: medium.** A structured
  cardio session is arguably a *workout* (`workoutType: conditioning`) and could be modelled as one;
  habits and reminders are outside any current RFC's scope and may belong to RFC-009. Worth an
  RFC-008 §4.9 note on how non-lifting scheduled items are meant to be represented.
- **"Video" workout type.** A Trainerize Video workout is a full-length video with no exercise
  structure. FDS `workout` requires `structure.blocks` with items (RFC-007 §3.1), so a pure-video
  session has no valid FDS shape short of a synthetic single-item block. **Severity: low-medium.** A
  video-only session is closer to `media` on an otherwise-empty structure than to a prescribed
  session; RFC-007 could say whether a structureless media workout is in scope at all.

## Clean — and a place FDS is richer

- **Supersets, circuits, intervals** all map exactly onto RFC-007 block modes; `groupLabel` captures
  the superset linking Trainerize does by adjacency.
- **Tempo.** Trainerize stores tempo as a "3-1-1" string; FDS `tempo` phases (RFC-006 §4.3) carry it
  structurally, so the import *gains* resolution.
- **RPE/RIR — FDS is richer, not blocked.** Trainerize has no structured RPE or RIR; coaches type
  them into notes. FDS `loadTarget.method: rpe`/`rir` (RFC-006 §4.1) can hold them as first-class, so
  a Trainerize→FDS import can only recover them from free text, but FDS itself has no gap here — the
  limitation is upstream. This is the mirror image of the TrainHeroic finding.

## Confidence caveat

Because Trainerize publishes no field-level schema, the *structural* findings above are robust
(they follow from documented behaviour) but any claim about exact serialization would need validation
against a live Studio/Enterprise API response.
