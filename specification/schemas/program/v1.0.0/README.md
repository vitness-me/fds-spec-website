# Program — Scenario Examples

Worked examples for `program.schema.json` (RFC-008). Each is a complete, validating program, and each demonstrates one row of the scenario coverage matrix.

They are whole documents, so the ordinary CI job validates them against the schema directly. `scripts/check-scenarios.mjs` additionally checks that **every** row of §4.6 and §4.7 has one, and that every example here is explained below.

Read them alongside the workout examples. The division of labour is the whole argument of RFC-008: **not one of these files contains a set, a rep or a load.** Every program below is a schedule of `workoutRef`s, and the prescription lives in the sessions they point at. If a periodization model appeared to need a prescription field here, the model would be wrong or the schema would be.

## §4.6 — Periodization models

| Example | Demonstrates |
|---|---|
| `program.linear.example.json` | The whole methodology in one `progressionRule`: add load whenever every rep is completed. Both weeks are identical — the load moves, the plan does not. |
| `program.daily-undulating.example.json` | Three rep ranges across one week, expressed by scheduling three different sessions. The undulation is in the workouts; the program says only which falls on which day. |
| `program.weekly-undulating.example.json` | The same two sessions for three weeks, undulated entirely by `overrides.loadScaling` — medium, heavy, light. The workouts stay reusable because nothing was edited into them. |
| `program.block.example.json` | Three `meso` cycles sequenced by `order`, with `intent` `accumulation` → `intensification` → `realization`. |
| `program.conjugate.example.json` | Rotating max-effort lifts. Rotation is a different `workout` reference each week, which is why no field for it exists. |
| `program.percentage-waves.example.json` | 5/3/1-style waves. Two `trainingMaxes` slots declare which lifts the plan is computed from and how; `overrides.progressionState` carries the wave number. **No training-max value appears** — see RFC-008 §8.1. |
| `program.deload-weeks.example.json` | `week.deload` on week four while the cycle `intent` stays `accumulation`. That combination is the reason `deload` is a week flag and not an intent value. |
| `program.double-progression.example.json` | Reps first, then load: one rule whose trigger is `topOfRepRange`, with `progressionState` tracking where in the rep range each occurrence sits. |
| `program.test-weeks.example.json` | A test week is an ordinary cycle whose `intent` is `test`. The `retest` action updates a training-max *slot*, not a number in the document. |
| `program.conditional-branching.example.json` | Two branches off one day: repeat lighter on `failedPrescribedReps`, skip ahead on `amrapAboveThreshold`. A consumer that cannot evaluate either follows the unconditional schedule. |
| `program.adaptive.example.json` | Autoregulated adaptation: a fixed skeleton whose loads are decided at execution time against two declared rules. The limit of what FDS expresses — see the note below. |

### What `program.adaptive.example.json` does not claim

Adaptive programming covers two different things, and only one of them is portable data.

**Load adaptation is expressible**, and that is what this example shows. The sessions and their placement are fixed; the loads resolve at execution time through `loadTarget.method: "autoregulated"` pointing at a `progressionRule` this program declares. That is what most autoregulated and "AI-driven" systems actually vary.

**Exercise selection generated per session is not expressible**, and no fixture here pretends otherwise. A day carries a `workoutRef`, which requires a workout that exists. There is no "to be determined" day, and adding one would mean a program document that cannot be read without running the generator that produced it — the opposite of an interchange format.

The engine configuration in this example sits under `extensions` for exactly that reason: it is a vendor concern, and the portable part of the plan is the rules beside it.

## §4.7 — Scheduling structures

| Example | Demonstrates |
|---|---|
| `program.fixed-weekday.example.json` | `model: "calendar"` — `dayOfWeek` is authoritative. |
| `program.relative-offsets.example.json` | `model: "relative"` — `offsetDays` counted from the program start, week two continuing at 7, 9, 11. |
| `program.rolling.example.json` | `model: "rolling"` — three on, one off, drifting against the calendar by design. Reading this as `calendar` would collapse the rest pattern the plan is built around. |
| `program.sequence.example.json` | `model: "sequence"` — neither placement field present, which is the point: `index` is the only ordering and the athlete sets the pace. |
| `program.optional-days.example.json` | `optional: true` on a conditioning day. An optional day is still a training day; the flag does not turn it into rest. |
| `program.accessory-days.example.json` | Accessory work as its own optional session rather than extra blocks on a main day, so it can be dropped whole. |
| `program.rest-days.example.json` | All seven days stated, three of them `rest`. A prescribed rest day and an absent day are different instructions. |
