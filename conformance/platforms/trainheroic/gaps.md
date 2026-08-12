# TrainHeroic — RFC gap report

The headline result here is a **pass**: FDS expresses TrainHeroic's defining construct — per-set
percentage-of-working-max — without strain. The gaps are narrow and specific.

## Clean — the prescription primitives hold

- **Per-set percentage waves.** `weight: [70, 75, 80, 85]` against a working max becomes four explicit
  `setPrescription` entries, each a `percent1RM` load with `referenceExerciseId` (RFC-007 §4.4 for
  per-set load, RFC-006 §4.1 for the method). The per-set-load capability added at workout 1.1.0 is
  exactly what this needs; before it, a wave was inexpressible without splitting one exercise into
  four items.
- **Reference Max → training-max slot.** TrainHeroic's working max — the value the whole percentage
  system hangs on — maps onto RFC-008 §8.1's `trainingMaxSlot`: the derivation `method`
  (`estimatedOneRepMax`, the NSCA-load-chart estimate) travels, the personal number does not. This is
  the design working as intended: a marketplace program is publishable *because* it carries the slot,
  not the athlete's max.
- **RPE, AMRAP, bodyweight** all map to their RFC-006 §4.1 load/rep methods directly.

## Real gaps

- **Working-max state (tested/locked vs. auto-updating) has no field.** RFC-008 §8.1's
  `trainingMaxSlot` records *how* a max is derived (`method`, `percent`) but not TrainHeroic's
  **lifecycle state** — whether the max is locked from a test or still auto-updating from recent
  training. That state is what determines, in TrainHeroic, whether this cycle's percentages move.
  **Severity: medium.** It is arguably resolution-context (RFC-006 §5) rather than program data, but a
  consumer resolving the program needs it, and it is currently unstatable. Candidate: an optional
  `state`/`locked` field on `trainingMaxSlot`, or an explicit note in RFC-008 §8.1 that lifecycle is
  the caller's concern.
- **Typed dual-parameter slots are an import-direction modelling difference.** TrainHeroic's
  "two slots, coach picks the meaning" model is more general than FDS's typed `load`/`reps`/`settings`
  fields. Everything documented (reps, weight, weight%, rep-range, time, distance, reps-per-side) maps
  to a specific FDS field, so there is no data loss **today** — but a coach who repurposes a slot in a
  way TrainHeroic allows and FDS has no field for would have nowhere to land. **Severity: low.** Noted
  as a structural watch-item, not a present defect.

## FDS is richer — the loss is on import, not in the spec

TrainHeroic keeps **tempo, per-set rest, and often RPE** in free-text notes or the exercise name, not
structured fields. FDS carries all three as primitives (`tempo` RFC-006 §4.3, `restSpec` RFC-006
§4.4, `rpe` RFC-006 §4.1). So a TrainHeroic→FDS import can only recover them by parsing notes — a
source limitation — while FDS→TrainHeroic would have to *flatten* them back into notes. The fixture
states them structurally to show FDS has the room; the asymmetry is upstream, and FDS has no gap here.

## Not a gap (worth recording)

- **Velocity-based training.** TrainHeroic has **no** native velocity target or velocity-loss field;
  FDS does (`loadTarget.method: velocity` with `lossThreshold`, RFC-006 §4.1). So FDS is a *superset*
  of TrainHeroic on VBT — the reverse of a gap. Recorded because the research specifically probed it.
- **Prescribed vs. actual.** TrainHeroic separates them cleanly at set level; FDS deliberately does
  not model performed data yet (RFC-007 §1.3, deferred to RFC-009). Correct out-of-scope, and a strong
  alignment target for when RFC-009 lands.
