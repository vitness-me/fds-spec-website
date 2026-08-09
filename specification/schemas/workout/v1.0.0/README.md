# Workout — Scenario Examples

Worked examples for `workout.schema.json` (RFC-007). Each is a complete, validating workout, and each demonstrates one row of the scenario coverage matrix.

Unlike the RFC-006 fixtures these are whole documents, so the ordinary CI job validates them against the schema directly. `scripts/check-scenarios.mjs` additionally checks that **every** row of §4.1 and §4.2 has one, and that every example here is explained below.

Together they answer the question RFC-007 exists to answer: can one schema express every way people actually structure training? The §4.2 set is the real test — if any row had needed a structure the schema lacked, the claim would not hold.

## §4.1 — Set and rep schemes

| Example | Demonstrates |
|---|---|
| `workout.straight.example.json` | Three identical sets. The baseline everything else departs from. |
| `workout.ramping.example.json` | Ascending load across five sets to a top set. |
| `workout.reverse-pyramid.example.json` | Heaviest set first, dropping 10% each set as fatigue accumulates. |
| `workout.drop-sets.example.json` | Three consecutive drops with no rest, taken to technical failure. |
| `workout.rest-pause.example.json` | One set to near-failure, resumed after 15-second rests. |
| `workout.cluster.example.json` | Reps in pairs with programmed rest *inside* the set, so heavy load stays fast. |
| `workout.myo-reps.example.json` | An activation set followed by four short mini-sets at RIR 1. |
| `workout.amrap-reps.example.json` | A single set of as many reps as possible, with a floor and a cap — AMRAP as a *rep target*, distinct from an AMRAP block. |
| `workout.top-set-backoff.example.json` | One heavy top set at RPE 8, then three back-offs 10% lighter. |
| `workout.wave-loading.example.json` | A 3‑2‑1 rep ladder run three times at the same load. |
| `workout.ladders.example.json` | Ascending rungs 1–5 with short rests. |
| `workout.density.example.json` | Maximum sets inside a ten-minute cap — the one scheme where set count is the outcome, not the input. |
| `workout.technical-failure.example.json` | Both failure kinds in one item: technical failure on set one, absolute failure on set two. |
| `workout.tempo-reps.example.json` | A four-second eccentric with an explosive concentric. |
| `workout.paused-reps.example.json` | A three-second pause at the bottom, which is `tempo.bottomPause` rather than a scheme. |
| `workout.partials.example.json` | Full-range reps followed by bottom-half partials. Uses `repStyle` — nothing else in the model reaches range of motion. |
| `workout.one-and-a-half-reps.example.json` | A full rep plus a half counted as one, via `repStyle.pattern`. |
| `workout.isometric-holds.example.json` | A hold with a floor and a cap, using `repTarget.maxHold`. |
| `workout.timed-sets.example.json` | 45-second efforts in a heart-rate zone — the clock terminates the set, not a rep count. |

## §4.2 — Grouping structures

| Example | Demonstrates |
|---|---|
| `workout.single.example.json` | One exercise, `sequential`. The degenerate case. |
| `workout.superset.example.json` | Two items alternated via `groupLabel` `A1`/`A2`, rest at the group boundary. |
| `workout.triset.example.json` | Three items in one group. |
| `workout.giant-set.example.json` | Four items in one group. Nothing in the schema caps group size. |
| `workout.compound-set.example.json` | Two items training the same muscle. **Structurally identical to the antagonist pairing below** — see RFC-007 §3.3 for why that is deliberate. |
| `workout.antagonist-pairing.example.json` | Two items training opposing muscles. The difference from a compound set is derivable from the exercises, not encoded here. |
| `workout.barbell-complex.example.json` | One barbell, one load, four movements, no rest until the round ends. |
| `workout.circuit.example.json` | One set of each item per round, four rounds, rest between rounds. |
| `workout.emom.example.json` | Every minute on the minute for twelve intervals. |
| `workout.amrap-block.example.json` | As many rounds as possible in twenty minutes — AMRAP as a *block mode*, distinct from the rep target above. |
| `workout.for-time.example.json` | Fixed work completed as fast as possible, under a cap. |
| `workout.chipper.example.json` | One descending pass through five movements, each finished before the next. |
| `workout.tabata.example.json` | Eight rounds of 20 seconds work, 10 seconds rest. |
| `workout.ladder-circuit.example.json` | A scheme and a mode composing: ladder rungs *inside* a circuit. |
| `workout.warmup-block.example.json` | A `warmup` block preceding the working block, in one session. |
| `workout.cooldown-block.example.json` | Zone-1 work followed by a `cooldown` block of holds. |
| `workout.finisher.example.json` | A working block plus a four-minute `finisher` taken to technical failure. |

## Notes for readers

**AMRAP appears twice on purpose.** `workout.amrap-reps` is a rep target — one set, as many reps as possible. `workout.amrap-block` is a block mode — as many *rounds* as possible in a time cap. They are different prescriptions that share a name, and conflating them is a common source of misimport.

**A scheme and a mode are orthogonal.** `workout.ladder-circuit` shows both at once: `setScheme.ladder` describes how one item's sets progress, `mode: circuit` describes how the block is traversed. Neither implies the other.
