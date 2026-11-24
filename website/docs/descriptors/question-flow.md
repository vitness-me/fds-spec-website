---
title: 'Question Flow: Building FXI and FXE'
sidebar_label: 'Question flow'
description: 'The full draft owner question flow, and how answers build FXI and FXE strings'
sidebar_position: 3
---

# Question Flow: Building FXI and FXE

:::caution Draft / experimental
Not normative until the RFC that adopts the structural descriptors is accepted: RFC (pending). See [the overview](./overview.md).
:::

Nobody needs to write FXI notation. An owner answers closed questions about one exercise, or one piece of equipment, and the answers build the strings. This page is the whole flow, written out so that a person can walk it by hand and two implementations build byte-identical strings from the same answers.

The questions, their conditions and the code each option writes are generated from [`specification/descriptors/question-flow.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/question-flow.json). The codes are defined on [FXI](./fxi.md) and [FXE](./fxe.md).

## Walking the flow

1. Go through [the questions](#the-questions) in the order listed. Ask a question only when its **Asked when** condition holds for the answers given so far; skip it otherwise.
2. Answer every question you ask, and no other. **Pick one** takes one option; **pick one or more** takes a list, up to the stated maximum. An option marked *Alone* cannot be combined with another. An option with *Only when* applies only when its condition holds.
3. `usual` keeps the published default: the movement word's reading when a word was chosen, otherwise the layer default on [FXI](./fxi.md#defaults) or the machine default on [FXE](./fxe.md#procedure). Where there is no default, `usual` is not offered.
4. `unknown` writes `?`. Answer it only when you really do not know: `?` matches anything, so the exercise separates less well from its neighbours.
5. Every option picked in `changes` must open a question that is then asked (see [what each change opens](#what-each-change-opens)). A pick that opens nothing does not apply to this exercise; remove it.
6. Assemble the strings with [the build rules](#from-answers-to-strings), and canonicalise them.

**Answer what is true.** Describe the exercise as it is actually run, not only what its name says. A lateral raise done seated and bent over is answered seated and bent over. If clients alternate arms rep by rep, say so, even when the name does not. The usual way is still a value: where the exercise is done the usual way, answer `usual`.

**Leave out prescription.** Tempo, pauses, load amount, sets, reps, box height and small angle changes are not questions here. They do not change the exercise.

## The movement word

The second question asks for the movement word: "squat", "row". A word fixes the usual reading of every layer at once, so most exercises need only a few answers after it. **Movement words are not part of this standard.** They are catalogue data that an encoder loads from a movement-word dataset; a word changes which answers are usual, never what a code means.

Without a dataset, answer `other` and describe the motion joint by joint. Every exercise can be encoded that way. Body position, load and sides are then always asked.

A movement-word dataset gives, for each word:

- an identifier and a label, and optionally a "pick this, not that" note for near-synonyms;
- the FXI layers the word fixes, as `layer:value` pairs;
- the usual hold point for each implement token, with a fallback for any other token, and the hold point of a bar when the load passes behind the head;
- the machine the word names, if any: its guided motion, load interface and whether it has a chest pad;
- the cardio machine type the word names, if any;
- whether the word's grip width applies only to a two-hand bar;
- the word's own closed questions, if any. Each option patches the layers the word fixes (`layer:value`; `layer:-` removes the layer). These are the `word.*` questions, asked right after the movement.

The word an owner picked is kept in the answers record. It never travels in the FXI. A resolver may use it as a ranking hint.

## The phase questions

When the motion is described joint by joint, `motion.phases` asks how many separate movements one rep has, from one to five. The questions marked **Repeated** are then asked for each phase in turn: read `p1` as `p2`, `p3`, … and "phase 1" as the phase's number, and read the condition `motion.phases` is at least 1 as at least that number. The `p1b.*` questions describe a second part of the same phase, asked only when `p1.also` is `yes`.

Within a phase, `p1.joints` picks the joints that move; one direction question follows for each picked joint, in the fixed joint order neck, trunk, shoulder blades, shoulder, elbow, forearm, wrist, hip, knee, ankle.

## From answers to strings

Each layer is built from its answers as follows, then the whole string is [canonicalised](./fxi.md#canonical-form). A word's value, below, is the value the movement word fixes after its own questions are applied.

**`m`, motion.**

- Movement `unknown`: `m:?`.
- Described joint by joint: `motion.phases` `unknown` gives `m:?`. Otherwise each phase is its first part, and when `p<n>.also` is `yes`, `|` and its second part. Phases are joined with `>`.
- A part whose kind is `unknown` is `?`; `balance` is `=0`. Otherwise it is the kind's prefix (none for a normal rep), then its actions joined with `+`: for each picked joint, in joint order, the code each picked direction writes (a direction may write two actions, such as `sh.flex+sh.hadd`). A direction `unknown` writes `<joint>.?`. Joints `unknown` make the part `?`, or the prefix and `?` for a part of a known kind. A joint picked in `p<n>.short` adds `-` after each of its actions; that needs a named direction. Two opposite actions in one part are an error: split them into two phases.
- From a word: the word's motion. A `motion.kind` answer replaces the prefix of a word with one phase.
- A word whose motion pulls down from overhead (`el.flex+sh.add`) writes `el.flex+sh.ext.oh` instead when the grip, in its first phase, is underhand, neutral, narrow or touching (`su`, `ne`, `w-n`, `w-t`).

**`o`, orientation.** The `orientation` answer, or the word's. An `orientation.end` other than `usual` makes the value `start>end`; the end must differ from the start, and a start of `*` cannot have an end.

**`k`, `f`.** The `end` and `footwork` answers, or the word's.

**`s`, support.** `usual` keeps the word's support, except that a word's support is dropped when the load is a machine the word does not name. `none` writes no support; `unknown` writes `s:?`. Otherwise each support (`sup1`, and `sup2` when `sup.more` is `yes`) is its surface token, then `@` and its points joined with `,` when any were picked. The two must differ. `floor@feet` beside another support is dropped under a seated body, or a face-up body lying on a support that bears its trunk.

**`l`, load.** The first load is the `load` answer (`implement` takes the token from `imp1`); the second, when `changes` includes `extra`, is `imp2`. Then, for each:

- body weight: `bw`; `unknown`: `?`;
- a strength machine: `mach@<point>`, where the point is `assist` for an assisting machine, else the body point of the machine's load interface (`hand` is `hands`, `foot` `feet`, `ankle` `ankles`, `thigh` `thighs`, `knee` `knees`, `arm` `arms`, `shoulder` `shoulders`, `hip` `hips`; `chest`, `back`, `head` and `seat` are themselves), or `?`;
- a cardio machine: `erg.<cycle>@<hold>` from the cardio machine type, or `erg@?` when the type is unknown;
- an implement, a cable, a Smith machine or a landmine: the token, an optional count, `@` and the `hold1` or `hold2` answer.

The count applies to the first implement. Write `*n` from `count1` only when `n` differs from the usual count: one for a two-hand implement, for anything held at the chest, back, hips or waist, and for anything that is not a one-hand implement; for a one-hand implement (`db`, `kb`, `plate`, `club`), one when the arms work one side at a time and two otherwise. The second implement must differ from the first, and needs a known first load.

**The machine.** For an exercise whose load is a strength machine: the word's machine, or the `mac.*` answers. Its guided motion is a single-joint code, or the verb (`push`, `pull`, `assist`) then `.` and the `mac.direction`. Its load interface is `mac.contact`, or the default for the guided motion ([FXE step 3](./fxe.md#procedure)). `mac.chest` says whether a pad supports the chest.

**`x`, symmetry.** `usual` keeps the word's; `unknown` writes `?`; `b` writes nothing. `split` writes `<code>@arms` and `<code>@legs` from `symmetry.arms` and `symmetry.legs`, leaving out a limb answered both-together. Otherwise the code, with `@<scope>` when `symmetry.scope` names one.

**`g`, grip and stance.** The hand orientation is `grip.hand`, or the word's; `turn` makes two phases from `grip.start` and `grip.end`, which must differ. Width (`grip.width`) and stance (`stance`) come from their answers or the word's. A word's wide grip that applies only to a two-hand bar is dropped when the first load is not one, or when the arms work one at a time. A stance answer is allowed only for a standing start, either or unknown, or feet on a machine foot plate. Each phase is its hand orientation, width and stance joined with `+`; with two phases, an otherwise empty phase is `w-m`.

**`r`, range.** The depth (`range.depth`) and start (`range.start`) answers, each replacing the word's code of the same group; `full` writes nothing.

**`h`, `p`, `a`.** The picked codes joined with `+`, or the word's. Two held postures marked "never with" are an error; a line takes at most one of `hi`, `lo`, `side`.

**The record's FXE** is the [main equipment](./fxe.md#the-main-equipment-of-an-exercise) of the FXI. When that is a strength machine, it is `FXE=1.0S/k:mac/l:<interface>/s:<posture>/m:<motion>`, with the posture read from the FXI start orientation: seated `seat` (`seat.chest` with a chest pad), standing or standing bent `stand` (`stand.chest`), any prone start `prone`, `supine` or `supine.decline` `supine`, `supine.incline` `recline`, kneeling `kneel`, hanging `hang`, side-lying `side`, else `?`. A cardio machine writes its type's four layers. A band writes `band.<type>` from `band.type`, or `band`.

**Equipment on its own.** `eq.kind` `none` is `k:none`; `unknown` is `k:?`. `imp`, `sup`, `acc` and `stn` write `k:<kind>/f:<form>`. A cardio machine writes its type's layers. A strength machine writes `k:mac/l:<contact>/s:<posture>/m:<motion>`: contacts joined with `+`; `usual` contact and posture take the [FXE defaults](./fxe.md#procedure). `eq.details` adds the extended layers `r`, `c`, `g`, `a`, and `eq.more` a second configuration, joined with `;`. The record's `fxe` is the standard form; the full form, with build details, is the equipment registry record.

## The answers record

A producer keeps, for each exercise or piece of equipment, the answers that built its strings, so they can be [rebuilt](./compare-and-match.md#versioning) under a later rules revision:

```json fds:ignore an answers record, whose exchange format the descriptor RFC (pending) defines; it is not an FDS entity document
{
  "id": "barbell-back-squat",
  "answers": {
    "subject": "usual",
    "movement": "other",
    "changes": ["usual"],
    "motion.phases": "1",
    "p1.kind": "usual",
    "p1.joints": ["hip", "kn"],
    "p1.hip": ["ext"],
    "p1.kn": ["ext"],
    "p1.short": ["usual"],
    "p1.also": "usual",
    "orientation": "standing",
    "load": "implement",
    "imp1": "bb",
    "hold1": "back",
    "symmetry": "b"
  },
  "provenance": "owner",
  "gap": null
}
```

`answers` maps each asked question to the option picked, or a list for a question that takes several. A record may also carry `notes`, the movement-word dataset its word came from, and, from a check within the owner's own library, `sameAs` or `differs` (below).

**Within one library.** Two different exercises in one library must not build the same FXI. When two do, the owner settles it: they are the same exercise (`sameAs` names the other record); or an answer captures the difference, which changes the string; or the notation cannot say it (`differs` names what differs, and becomes the record's gap marker).

## Worked examples

### Barbell back squat

A barbell resting across the upper back; standing; hips and knees extend together. No movement word is used: the motion is described joint by joint.

| Question | Answer | Writes |
|---|---|---|
| `subject` | `usual` | An exercise. |
| `movement` | `other` | The motion is described below. |
| `changes` | `usual` | Nothing else differs from the defaults. |
| `motion.phases` | `1` | One movement per rep. |
| `p1.kind` | `usual` | A normal moving rep: no prefix. |
| `p1.joints` | `hip`, `kn` | The ankle only follows; it does not count. |
| `p1.hip` | `ext` | `hip.ext` |
| `p1.kn` | `ext` | `kn.ext` |
| `p1.short` | `usual` | Full range. |
| `p1.also` | `usual` | One part. |
| `orientation` | `standing` | `o:standing` |
| `load` | `implement` | |
| `imp1` | `bb` | `bb` |
| `hold1` | `back` | `@back` |
| `symmetry` | `b` | Nothing: both sides together is the default. |

Result: `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` and, as its main equipment, `FXE=1.0S/k:imp/f:bar.straight`.

### Seated cable row

On a seated cable row machine with its own seat and foot plate, pulling a V-handle to the trunk with the palms facing each other.

| Question | Answer | Writes |
|---|---|---|
| `subject` | `usual` | An exercise. |
| `movement` | `other` | |
| `changes` | `hand` | The hand orientation differs from the default. |
| `motion.phases` | `1` | |
| `p1.kind` | `usual` | |
| `p1.joints` | `el`, `sh` | |
| `p1.el` | `flex` | `el.flex` |
| `p1.sh` | `row-close` | `sh.ext` |
| `p1.short` | `usual` | |
| `p1.also` | `usual` | |
| `orientation` | `seated` | `o:seated` |
| `load` | `machine` | A dedicated machine: `mach`. |
| `mac.motion` | `pull` | |
| `mac.direction` | `back` | Guided motion `pull.back`. |
| `mac.contact` | `hand` | Load interface `hand`, so `mach@hands`. |
| `mac.chest` | `no` | Posture `seat`, from the seated start. |
| `symmetry` | `b` | |
| `grip.hand` | `ne` | `g:ne`; the default for a row would be overhand. |

Result: `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` and `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back`.

The same row with the default overhand grip is `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands`, and the two [contradict](./compare-and-match.md#compare): the grip is part of the exercise.

### The seated cable row machine

The machine on its own, as an equipment registry record.

| Question | Answer | Writes |
|---|---|---|
| `subject` | `equipment` | |
| `eq.kind` | `mac` | `k:mac` |
| `eq.mac.motion` | `pull` | |
| `eq.mac.direction` | `back` | `m:pull.back` |
| `eq.mac.contact` | `hand` | `l:hand` |
| `eq.mac.posture` | `seat` | `s:seat`. A seated cable row with a foot plate is `seat`, not `seat.chest`. |
| `eq.details` | `yes` | |
| `eq.drive` | `stack` | `r:stack` |
| `eq.constraint` | `cable` | `c:cable` |
| `eq.angle` | `usual` | Not stated. |
| `eq.attrs` | `usual` | None stated. |
| `eq.more` | `usual` | One configuration. |

Result: the standard `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back`, which every exercise record on this machine carries, and the full registry record `FXE=1.0N/k:mac/l:hand/s:seat/m:pull.back/r:stack/c:cable`.

## Facts the conditions use

Some conditions name a fact rather than an answer. Each fact is worked out from the answers given so far.

<!-- fds:generated flow#facts -->
| Fact | Holds when |
|---|---|
| `exercise` | The subject is an exercise (the usual answer to "subject"). |
| `equipment` | The subject is a piece of equipment on its own. |
| `template` | The movement is one of the published movement words. |
| `motion-from-scratch` | The movement is "other", or the owner said the joint movement differs from the movement word. |
| `posture-has-usual` | The movement word fixes a posture. |
| `load-has-usual` | The movement word fixes the load (body weight, a cable, a machine, a named implement). |
| `load-holdable` | The first load is a free implement, a cable, a Smith machine or a landmine. |
| `hold-has-usual` | The rules give a usual hold point for that implement in this movement. |
| `load-band` | A band is one of the loads. |
| `load-machine` | The load is a strength machine. |
| `load-cardio` | The load is a cardio machine. |
| `machine-has-usual` | The movement word fixes which machine is used. |
| `cardio-has-usual` | The movement word fixes which cardio machine is used. |
| `hold2-has-usual` | The rules give a usual hold point for the second implement in this movement. |
| `machine-direction-has-usual` | The movement word names a multi-joint machine, so its direction is known. |
| `contact-has-usual` | The movement word names the machine, or the rules give a default contact for the guided motion. |
| `eq-contact-has-usual` | The rules give a default contact for the guided motion of the equipment. |
| `eq2-contact-has-usual` | The rules give a default contact for the guided motion of the second setup. |
| `single-phase-template` | The movement word has one phase with joint actions, so its kind can change on its own. |
| `stance-recorded` | The body position at the start is standing, standing bent over, either or unknown; or the feet push a machine's foot plate (leg press). |
| `word-asks` | The chosen movement word carries closed questions of its own in the movement-word dataset. |
<!-- /fds:generated -->

## What each change opens

<!-- fds:generated flow#changeOpens -->
| `changes` option | Opens |
|---|---|
| `motion` | `motion.phases` |
| `kind` | `motion.kind` |
| `posture` | `orientation` |
| `end-posture` | `orientation.end` |
| `moving-end` | `end` |
| `footwork` | `footwork` |
| `support` | `support` |
| `equipment` | `load` |
| `hold` | `hold1` |
| `count` | `count1` |
| `extra` | `imp2` |
| `machine` | `mac.motion`, `erg.type` |
| `sides` | `symmetry` |
| `hand` | `grip.hand` |
| `width` | `grip.width` |
| `stance` | `stance` |
| `depth` | `range.depth` |
| `start` | `range.start` |
| `held` | `held` |
| `line` | `line` |
| `accessory` | `accessory` |
<!-- /fds:generated -->

## The questions

<!-- fds:generated flow#questions -->
#### `subject`: Are you describing an exercise, or a piece of equipment on its own?

- **Fills:** FXI or FXE.
- **Pick:** one.
- **Asked when:** always.
- **Usual:** An exercise.

An exercise gets an FXI and the FXE of its main equipment. Equipment on its own gets a registry FXE.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | An exercise (the usual case) | the default | Alone. |
| `equipment` | A piece of equipment on its own |  |  |

#### `movement`: Which movement is it?

- **Fills:** FXI m, and the defaults of every other layer.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject").
- **Usual:** no published default; the answer defines the value
- **Options from:** the movement-words dataset (not part of the notation).

Pick the movement word that matches the exercise as you would name it with nothing added. Variations come next. Pick "other" only when no word fits. The movement words themselves are not part of the notation: the encoder loads them from a movement-word dataset.

| Option | Means | Writes | Note |
|---|---|---|---|
| `other` | Something else: describe the joint movement step by step |  |  |
| `unknown` | I do not know how it is done | `?` | Alone. |

#### `word.*`: The movement word's own closed questions, if it has any.

- **Fills:** FXI layers the movement word fixes.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and the chosen movement word carries closed questions of its own in the movement-word dataset.
- **Usual:** The option the movement word means when nothing else is said, where the dataset gives one.
- **Options from:** the movement-words dataset (not part of the notation).

Some movement words carry one or two closed questions of their own (is the knee straight or bent; which limbs lift). Each option patches the layers the word fixes. The questions, their options and their patches come with the movement-word dataset.

#### `changes`: What, if anything, is different from the usual way of doing this movement?

- **Fills:** selects which layers differ from their defaults.
- **Pick:** one or more.
- **Asked when:** the subject is an exercise (the usual answer to "subject").
- **Usual:** Nothing differs.

The usual way is what the movement word means with nothing added: "squat" is both feet, no held posture, full range. Pick every way your exercise, as you actually run it, differs, whether or not its name says so. Each pick opens one question. For "other" or "unknown" movements, body position, equipment and sides are asked anyway.

*Import mode:* body differences (motion, position, footwork, support, equipment) may come from the description; sides, grip, stance, range, held posture and line of pull come only from the name, the alternate name and the fields (the source rule).

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Nothing: it is done the usual way for this movement | the default | Alone. |
| `motion` | The joint movement itself (rebuild it joint by joint) |  |  |
| `kind` | The kind of motion: explosive with flight, continuous, a hold, a static or dynamic stretch |  |  |
| `posture` | The body position (standing, seated, lying, kneeling, hanging) |  |  |
| `end-posture` | The rep ends in a different body position from its start (get-up) |  |  |
| `moving-end` | Which end of the body moves (trunk or both ends, as in a sit-up or V-up) |  |  |
| `footwork` | The footwork: stepping, split stance, travelling |  |  |
| `support` | What the body rests on, beyond the floor |  |  |
| `equipment` | The equipment that loads the muscles |  |  |
| `hold` | Where the implement is held |  |  |
| `count` | How many implements |  |  |
| `extra` | A second implement |  |  |
| `machine` | Which machine (strength or cardio) |  |  |
| `sides` | How the sides work: one side then the other, alternating, reciprocal |  |  |
| `hand` | Hand orientation: overhand, underhand, neutral, mixed, or a turn during the rep |  |  |
| `width` | Grip width |  |  |
| `stance` | Stance width |  |  |
| `depth` | Range: partial, deeper than usual, or from a deficit |  |  |
| `start` | Where each rep starts: the floor, the hang, pins or blocks |  |  |
| `held` | A held posture of limbs that do not work: hands behind the head, arms crossed, free leg forward |  |  |
| `line` | The line of pull: cable or band anchored high or low, from the side, or the load passing behind the head |  |  |
| `accessory` | An accessory that helps without loading: a strap, towel or rope pulling a limb, or a partner |  |  |

#### `motion.kind`: What kind of motion is it?

- **Fills:** FXI m (prefix).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and the movement is one of the published movement words; and not (the movement is "other", or the owner said the joint movement differs from the movement word); and `changes` includes `kind`.
- **Usual:** The kind the movement word gives.

Only for movement words with one phase. Changing the kind keeps the joints the movement word gives.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | As the movement word says (the usual way) | the default | Alone. |
| `normal` | A normal moving rep: the joints move through range against the load | (no prefix) | Only when the movement word has one phase with joint actions, so its kind can change on its own. |
| `ballistic` | Ends in flight or release: the body leaves the ground or the implement leaves the hands (jump, hop, throw, slam, clap) | `^` | Only when the movement word has one phase with joint actions, so its kind can change on its own. |
| `cyclic` | Continuous cycles with no rep boundary, counted by time or distance (running, rowing, circles) | `~` | Only when the movement word has one phase with joint actions, so its kind can change on its own. |
| `hold` | Held still under effort for the whole set (plank, wall sit); the joints answer is what the muscles push toward | `=` | Only when the movement word has one phase with joint actions, so its kind can change on its own. |
| `static-stretch` | A static stretch: joints taken to end range and held | `%` | Only when the movement word has one phase with joint actions, so its kind can change on its own. |
| `dynamic-stretch` | A dynamic stretch: taken to end range and released, again and again (leg swings, pass-throughs) | `&` | Only when the movement word has one phase with joint actions, so its kind can change on its own. |

#### `motion.phases`: How many separate movements does one rep have?

- **Fills:** FXI m (phases ">").
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and the movement is "other", or the owner said the joint movement differs from the movement word.
- **Usual:** no published default; the answer defines the value

Ask one closed question for each pair of movements: does the second start before the first ends? Yes: one phase (a thruster: the press starts while you still rise). No: two phases (squat, stand, then press; a push-up then a shoulder-blade push). Never count the lowering or return.

*Import mode:* Import mode, text silent: two movement words in one name are two phases in name order, unless the name is a one-phase word (thruster).

| Option | Means | Writes | Note |
|---|---|---|---|
| `1` | One |  |  |
| `2` | Two |  |  |
| `3` | Three |  |  |
| `4` | Four |  |  |
| `5` | Five |  |  |
| `unknown` | I don't know | `?` | Alone. |

#### `p1.kind`: What kind of movement is phase 1?

- **Fills:** FXI m (prefix).
- **Pick:** one.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1.
- **Usual:** A normal moving rep.
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

Pick how the joints move. "Explosive" or "fast" alone is a normal rep: ballistic needs flight or release. A slam is ballistic even when the implement stays in the hands (a battle rope slam).

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | A normal moving rep (the usual way) | the default | Alone. |
| `ballistic` | Ends in flight or release: the body leaves the ground or the implement leaves the hands (jump, hop, throw, slam, clap) | `^` |  |
| `cyclic` | Continuous cycles with no rep boundary, counted by time or distance (running, rowing, circles) | `~` |  |
| `hold` | Held still under effort for the whole set (plank, wall sit); the joints answer is what the muscles push toward | `=` |  |
| `balance` | A balance hold with no direction (single-leg stand) | `=0` |  |
| `static-stretch` | A static stretch: joints taken to end range and held | `%` |  |
| `dynamic-stretch` | A dynamic stretch: taken to end range and released, again and again (leg swings, pass-throughs) | `&` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `p1.joints`: Which joints move in phase 1?

- **Fills:** FXI m (joints).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`).
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

Count a joint only when the working muscles move it through a clear range (about 30° or more) as part of what the exercise trains. Never count a joint held still on purpose: the knee in a Romanian deadlift or hip thrust, the elbow in a fly or lateral raise, the spine unless bending or twisting the trunk is the exercise, the ankle unless the exercise rises onto the toes or pushes off.

| Option | Means | Writes | Note |
|---|---|---|---|
| `nk` | Neck |  |  |
| `sp` | Trunk (spine) |  |  |
| `sc` | Shoulder blades, moving on their own |  |  |
| `sh` | Shoulder (judge by the path of the hands relative to the trunk) |  |  |
| `el` | Elbow |  |  |
| `fa` | Forearm turning against resistance |  |  |
| `wr` | Wrist |  |  |
| `hip` | Hip |  |  |
| `kn` | Knee |  |  |
| `ank` | Ankle |  |  |
| `unknown` | Some joints move, I don't know which | `?` | Alone. |

#### `p1.nk`: Phase 1: which way does the neck move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`); and `p1.joints` includes `nk`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Chin toward the chest | `nk.flex` |  |
| `ext` | Head tips back | `nk.ext` |  |
| `lflex` | Ear toward the shoulder | `nk.lflex` |  |
| `rot` | Head turns | `nk.rot` |  |
| `circ` | Circles | `nk.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1.sp`: Phase 1: which way does the trunk move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`); and `p1.joints` includes `sp`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Curls forward, ribs toward the pelvis (crunch) | `sp.flex` |  |
| `ext` | Straightens or arches back (back extension) | `sp.ext` |  |
| `lflex` | Bends sideways (side bend) | `sp.lflex` |  |
| `rot` | Twists, shoulders against the hips (woodchop) | `sp.rot` |  |
| `circ` | Circles | `sp.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1.sc`: Phase 1: which way do the shoulder blades move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`); and `p1.joints` includes `sc`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `elev` | Shrug up | `sc.elev` |  |
| `dep` | Pulled down | `sc.dep` |  |
| `pro` | Spread apart around the ribs (scapular push-up) | `sc.pro` |  |
| `ret` | Squeezed together | `sc.ret` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1.sh`: Phase 1: which way does the shoulder move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`); and `p1.joints` includes `sh`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `away-square` | Away from the chest, square to the trunk; or sweeping together in front at chest height (bench press, push-up, chest press, fly) | `sh.hadd` |  |
| `away-headward` | Away from the chest toward the head end (incline press, feet-up push-up, incline fly) | `sh.flex+sh.hadd` |  |
| `up-overhead` | Forward and up, or up past the head (front raise, overhead press, pike push-up) | `sh.flex` |  |
| `away-footward` | Away from the chest toward the feet end (decline press, hands-up push-up, high-to-low fly) | `sh.ext+sh.hadd` |  |
| `down-along` | Down along the trunk toward the feet (dip, straight-arm press-down) | `sh.ext` |  |
| `row-close` | Toward the trunk from in front, elbows close (row) | `sh.ext` |  |
| `row-wide` | Toward the trunk from in front, elbows wide at shoulder height (rear-delt row, face pull) | `sh.habd` |  |
| `apart` | Apart sideways at chest height, arms nearly straight (reverse fly, pull-apart) | `sh.habd` |  |
| `pull-front` | Down from overhead in front of the face (chin-up; any pull-up or pulldown with an underhand, neutral or close grip; straight-arm pulldown, pullover, slam) | `sh.ext.oh` |  |
| `pull-side` | Down from overhead out at the sides (pull-up or pulldown with an overhand grip at medium or wide width) | `sh.add` |  |
| `up-side` | Up out to the side (lateral raise, upright row) | `sh.abd` |  |
| `rot-in` | Rotates in: forearm turns toward the belly, elbow bent | `sh.ir` |  |
| `rot-out` | Rotates out: forearm turns away, elbow bent | `sh.er` |  |
| `circ` | Circles | `sh.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1.el`: Phase 1: which way does the elbow move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`); and `p1.joints` includes `el`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Bends (curl) | `el.flex` |  |
| `ext` | Straightens (press, triceps extension) | `el.ext` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1.fa`: Phase 1: which way does the forearm turning against resistance move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`); and `p1.joints` includes `fa`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `pron` | Palm turns down | `fa.pron` |  |
| `sup` | Palm turns up | `fa.sup` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1.wr`: Phase 1: which way does the wrist move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`); and `p1.joints` includes `wr`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Palm toward the forearm (wrist curl) | `wr.flex` |  |
| `ext` | Back of the hand toward the forearm | `wr.ext` |  |
| `rdev` | Thumb side toward the forearm | `wr.rdev` |  |
| `udev` | Little-finger side toward the forearm | `wr.udev` |  |
| `circ` | Circles | `wr.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1.hip`: Phase 1: which way does the hip move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`); and `p1.joints` includes `hip`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Thigh toward the trunk, or trunk toward the thigh | `hip.flex` |  |
| `ext` | Thigh away from the trunk (standing up from a squat) | `hip.ext` |  |
| `abd` | Leg out to the side | `hip.abd` |  |
| `add` | Leg in toward the other leg | `hip.add` |  |
| `ir` | Knee turns in | `hip.ir` |  |
| `er` | Knee turns out | `hip.er` |  |
| `circ` | Circles | `hip.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1.kn`: Phase 1: which way does the knee move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`); and `p1.joints` includes `kn`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Bends against resistance (leg curl) | `kn.flex` |  |
| `ext` | Straightens (standing up from a squat) | `kn.ext` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1.ank`: Phase 1: which way does the ankle move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `balance` or `unknown`); and `p1.joints` includes `ank`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `pf` | Rises onto the toes or pushes off | `ank.pf` |  |
| `df` | Toes pulled toward the shin | `ank.df` |  |
| `inv` | Sole turns in | `ank.inv` |  |
| `ev` | Sole turns out | `ank.ev` |  |
| `circ` | Circles | `ank.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1.short`: In phase 1, does any joint move through only a short range on purpose?

- **Fills:** FXI m (short drive "-").
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.kind` is `usual`.
- **Usual:** No: every joint moves through its full range.
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

Only the dip-and-drive of a push press or jerk, or the short stand-up after a power receive. Partial range for the whole exercise is a separate question.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | No (the usual way) | the default | Alone. |
| `nk` | Neck |  | Only when `p1.joints` includes `nk`. |
| `sp` | Trunk (spine) |  | Only when `p1.joints` includes `sp`. |
| `sc` | Shoulder blades, moving on their own |  | Only when `p1.joints` includes `sc`. |
| `sh` | Shoulder (judge by the path of the hands relative to the trunk) |  | Only when `p1.joints` includes `sh`. |
| `el` | Elbow |  | Only when `p1.joints` includes `el`. |
| `fa` | Forearm turning against resistance |  | Only when `p1.joints` includes `fa`. |
| `wr` | Wrist |  | Only when `p1.joints` includes `wr`. |
| `hip` | Hip |  | Only when `p1.joints` includes `hip`. |
| `kn` | Knee |  | Only when `p1.joints` includes `kn`. |
| `ank` | Ankle |  | Only when `p1.joints` includes `ank`. |

#### `p1.also`: In phase 1, does another part of the body do something of a different kind at the same time, or move the opposite way?

- **Fills:** FXI m (simultaneous parts "\|").
- **Pick:** one.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and not (`p1.kind` is `unknown`).
- **Usual:** No.
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

Example: the arms hold the sled handles still while the legs walk, or the trunk holds a plank while a leg lifts. Also answer yes when two limbs are taken in opposite directions at once (runner's stretch: the back hip into extension, the front hip into flexion). Two limbs doing the same thing are one part.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | No (the usual way) | the default | Alone. |
| `yes` | Yes |  |  |

#### `p1b.kind`: What kind of movement is the second part of phase 1?

- **Fills:** FXI m (prefix).
- **Pick:** one.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`.
- **Usual:** A normal moving rep.
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

Pick how the joints move. "Explosive" or "fast" alone is a normal rep: ballistic needs flight or release. A slam is ballistic even when the implement stays in the hands (a battle rope slam).

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | A normal moving rep (the usual way) | the default | Alone. |
| `ballistic` | Ends in flight or release: the body leaves the ground or the implement leaves the hands (jump, hop, throw, slam, clap) | `^` |  |
| `cyclic` | Continuous cycles with no rep boundary, counted by time or distance (running, rowing, circles) | `~` |  |
| `hold` | Held still under effort for the whole set (plank, wall sit); the joints answer is what the muscles push toward | `=` |  |
| `balance` | A balance hold with no direction (single-leg stand) | `=0` |  |
| `static-stretch` | A static stretch: joints taken to end range and held | `%` |  |
| `dynamic-stretch` | A dynamic stretch: taken to end range and released, again and again (leg swings, pass-throughs) | `&` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `p1b.joints`: Which joints move in the second part of phase 1?

- **Fills:** FXI m (joints).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`).
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

Count a joint only when the working muscles move it through a clear range (about 30° or more) as part of what the exercise trains. Never count a joint held still on purpose: the knee in a Romanian deadlift or hip thrust, the elbow in a fly or lateral raise, the spine unless bending or twisting the trunk is the exercise, the ankle unless the exercise rises onto the toes or pushes off.

| Option | Means | Writes | Note |
|---|---|---|---|
| `nk` | Neck |  |  |
| `sp` | Trunk (spine) |  |  |
| `sc` | Shoulder blades, moving on their own |  |  |
| `sh` | Shoulder (judge by the path of the hands relative to the trunk) |  |  |
| `el` | Elbow |  |  |
| `fa` | Forearm turning against resistance |  |  |
| `wr` | Wrist |  |  |
| `hip` | Hip |  |  |
| `kn` | Knee |  |  |
| `ank` | Ankle |  |  |
| `unknown` | Some joints move, I don't know which | `?` | Alone. |

#### `p1b.nk`: The second part of phase 1: which way does the neck move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`); and `p1b.joints` includes `nk`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Chin toward the chest | `nk.flex` |  |
| `ext` | Head tips back | `nk.ext` |  |
| `lflex` | Ear toward the shoulder | `nk.lflex` |  |
| `rot` | Head turns | `nk.rot` |  |
| `circ` | Circles | `nk.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1b.sp`: The second part of phase 1: which way does the trunk move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`); and `p1b.joints` includes `sp`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Curls forward, ribs toward the pelvis (crunch) | `sp.flex` |  |
| `ext` | Straightens or arches back (back extension) | `sp.ext` |  |
| `lflex` | Bends sideways (side bend) | `sp.lflex` |  |
| `rot` | Twists, shoulders against the hips (woodchop) | `sp.rot` |  |
| `circ` | Circles | `sp.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1b.sc`: The second part of phase 1: which way do the shoulder blades move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`); and `p1b.joints` includes `sc`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `elev` | Shrug up | `sc.elev` |  |
| `dep` | Pulled down | `sc.dep` |  |
| `pro` | Spread apart around the ribs (scapular push-up) | `sc.pro` |  |
| `ret` | Squeezed together | `sc.ret` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1b.sh`: The second part of phase 1: which way does the shoulder move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`); and `p1b.joints` includes `sh`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `away-square` | Away from the chest, square to the trunk; or sweeping together in front at chest height (bench press, push-up, chest press, fly) | `sh.hadd` |  |
| `away-headward` | Away from the chest toward the head end (incline press, feet-up push-up, incline fly) | `sh.flex+sh.hadd` |  |
| `up-overhead` | Forward and up, or up past the head (front raise, overhead press, pike push-up) | `sh.flex` |  |
| `away-footward` | Away from the chest toward the feet end (decline press, hands-up push-up, high-to-low fly) | `sh.ext+sh.hadd` |  |
| `down-along` | Down along the trunk toward the feet (dip, straight-arm press-down) | `sh.ext` |  |
| `row-close` | Toward the trunk from in front, elbows close (row) | `sh.ext` |  |
| `row-wide` | Toward the trunk from in front, elbows wide at shoulder height (rear-delt row, face pull) | `sh.habd` |  |
| `apart` | Apart sideways at chest height, arms nearly straight (reverse fly, pull-apart) | `sh.habd` |  |
| `pull-front` | Down from overhead in front of the face (chin-up; any pull-up or pulldown with an underhand, neutral or close grip; straight-arm pulldown, pullover, slam) | `sh.ext.oh` |  |
| `pull-side` | Down from overhead out at the sides (pull-up or pulldown with an overhand grip at medium or wide width) | `sh.add` |  |
| `up-side` | Up out to the side (lateral raise, upright row) | `sh.abd` |  |
| `rot-in` | Rotates in: forearm turns toward the belly, elbow bent | `sh.ir` |  |
| `rot-out` | Rotates out: forearm turns away, elbow bent | `sh.er` |  |
| `circ` | Circles | `sh.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1b.el`: The second part of phase 1: which way does the elbow move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`); and `p1b.joints` includes `el`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Bends (curl) | `el.flex` |  |
| `ext` | Straightens (press, triceps extension) | `el.ext` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1b.fa`: The second part of phase 1: which way does the forearm turning against resistance move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`); and `p1b.joints` includes `fa`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `pron` | Palm turns down | `fa.pron` |  |
| `sup` | Palm turns up | `fa.sup` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1b.wr`: The second part of phase 1: which way does the wrist move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`); and `p1b.joints` includes `wr`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Palm toward the forearm (wrist curl) | `wr.flex` |  |
| `ext` | Back of the hand toward the forearm | `wr.ext` |  |
| `rdev` | Thumb side toward the forearm | `wr.rdev` |  |
| `udev` | Little-finger side toward the forearm | `wr.udev` |  |
| `circ` | Circles | `wr.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1b.hip`: The second part of phase 1: which way does the hip move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`); and `p1b.joints` includes `hip`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Thigh toward the trunk, or trunk toward the thigh | `hip.flex` |  |
| `ext` | Thigh away from the trunk (standing up from a squat) | `hip.ext` |  |
| `abd` | Leg out to the side | `hip.abd` |  |
| `add` | Leg in toward the other leg | `hip.add` |  |
| `ir` | Knee turns in | `hip.ir` |  |
| `er` | Knee turns out | `hip.er` |  |
| `circ` | Circles | `hip.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1b.kn`: The second part of phase 1: which way does the knee move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`); and `p1b.joints` includes `kn`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `flex` | Bends against resistance (leg curl) | `kn.flex` |  |
| `ext` | Straightens (standing up from a squat) | `kn.ext` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1b.ank`: The second part of phase 1: which way does the ankle move?

- **Fills:** FXI m (joint actions).
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and not (`p1b.kind` is `balance` or `unknown`); and `p1b.joints` includes `ank`.
- **Usual:** no published default; the answer defines the value
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

For a moving rep, answer for the working direction: the way the joint moves while the working muscles shorten against the load. Never the lowering or the return. For a hold, answer what the muscles push toward. For a stretch, the direction the joint is taken.

| Option | Means | Writes | Note |
|---|---|---|---|
| `pf` | Rises onto the toes or pushes off | `ank.pf` |  |
| `df` | Toes pulled toward the shin | `ank.df` |  |
| `inv` | Sole turns in | `ank.inv` |  |
| `ev` | Sole turns out | `ank.ev` |  |
| `circ` | Circles | `ank.circ` |  |
| `unknown` | It moves, direction not known | `?` | Alone. |

#### `p1b.short`: In the second part of phase 1, does any joint move through only a short range on purpose?

- **Fills:** FXI m (short drive "-").
- **Pick:** one or more.
- **Asked when:** the movement is "other", or the owner said the joint movement differs from the movement word; and `motion.phases` is at least 1; and `p1.also` is `yes`; and `p1b.kind` is `usual`.
- **Usual:** No: every joint moves through its full range.
- **Repeated** for every phase: see [the phase questions](#the-phase-questions).

Only the dip-and-drive of a push press or jerk, or the short stand-up after a power receive. Partial range for the whole exercise is a separate question.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | No (the usual way) | the default | Alone. |
| `nk` | Neck |  | Only when `p1b.joints` includes `nk`. |
| `sp` | Trunk (spine) |  | Only when `p1b.joints` includes `sp`. |
| `sc` | Shoulder blades, moving on their own |  | Only when `p1b.joints` includes `sc`. |
| `sh` | Shoulder (judge by the path of the hands relative to the trunk) |  | Only when `p1b.joints` includes `sh`. |
| `el` | Elbow |  | Only when `p1b.joints` includes `el`. |
| `fa` | Forearm turning against resistance |  | Only when `p1b.joints` includes `fa`. |
| `wr` | Wrist |  | Only when `p1b.joints` includes `wr`. |
| `hip` | Hip |  | Only when `p1b.joints` includes `hip`. |
| `kn` | Knee |  | Only when `p1b.joints` includes `kn`. |
| `ank` | Ankle |  | Only when `p1b.joints` includes `ank`. |

#### `orientation`: What is the body position at the start of the rep?

- **Fills:** FXI o.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and either not (the movement word fixes a posture), or `changes` includes `posture`.
- **Usual:** The position the movement word fixes.

Flat means within about 15° of horizontal; incline and decline 15–60°. Hinged forward and held there (bent-over row) is "standing, bent". On hands and knees, in a plank or a push-up is "prone". The trunk decides: kneeling with the trunk folded forward over the thighs (child's pose) is "prone"; "kneeling" has the trunk upright. On a machine, use your body position.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual position for this movement | the default | Alone. Only when the movement word fixes a posture. |
| `standing` | On the feet, trunk within about 30° of vertical. | `standing` |  |
| `standing.bent` | On the feet, trunk hinged forward more than about 30° and held there (bent-over row). | `standing.bent` |  |
| `seated` | Sitting, trunk more than 60° from horizontal. | `seated` |  |
| `seated.bent` | Sitting, trunk hinged forward over the thighs and held there (seated bent-over raise). | `seated.bent` |  |
| `kneeling` | On both knees, trunk upright. On hands and knees is `prone`. | `kneeling` |  |
| `kneeling.half` | On one knee, the other foot forward. | `kneeling.half` |  |
| `supine` | Face up, trunk within 15° of horizontal. | `supine` |  |
| `supine.incline` | Face up, head higher than hips, trunk 15–60° from horizontal. | `supine.incline` |  |
| `supine.decline` | Face up, head lower than hips, trunk 15–60° from horizontal. | `supine.decline` |  |
| `prone` | Face down, trunk within 15° of horizontal: lying, plank, push-up, on hands and knees. | `prone` |  |
| `prone.incline` | Face down, head higher than hips, 15–60° (hands raised). | `prone.incline` |  |
| `prone.decline` | Face down, head lower than hips, 15–60° (feet raised). | `prone.decline` |  |
| `prone.pike` | Face down, hips highest, hands and feet down, trunk more than 60° head-down (pike). | `prone.pike` |  |
| `side-lying` | On one side: lying, or a side plank. | `side-lying` |  |
| `hanging` | Held up by the hands or arms, feet off the floor: hanging from a bar, propped on dip bars. | `hanging` |  |
| `inverted` | Upside down, trunk within 30° of vertical, head lowest: handstand, headstand. | `inverted` |  |
| `either` | Either way on purpose ("seated or standing") | `*` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `orientation.end`: In what position does the rep end?

- **Fills:** FXI o (start>end).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `end-posture`.
- **Usual:** Where it started.

Only when the rep ends somewhere else, like a get-up. A rep that goes down and comes back (burpee) ends where it started.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Where it started (the usual way) | the default | Alone. |
| `standing` | On the feet, trunk within about 30° of vertical. | `standing` |  |
| `standing.bent` | On the feet, trunk hinged forward more than about 30° and held there (bent-over row). | `standing.bent` |  |
| `seated` | Sitting, trunk more than 60° from horizontal. | `seated` |  |
| `seated.bent` | Sitting, trunk hinged forward over the thighs and held there (seated bent-over raise). | `seated.bent` |  |
| `kneeling` | On both knees, trunk upright. On hands and knees is `prone`. | `kneeling` |  |
| `kneeling.half` | On one knee, the other foot forward. | `kneeling.half` |  |
| `supine` | Face up, trunk within 15° of horizontal. | `supine` |  |
| `supine.incline` | Face up, head higher than hips, trunk 15–60° from horizontal. | `supine.incline` |  |
| `supine.decline` | Face up, head lower than hips, trunk 15–60° from horizontal. | `supine.decline` |  |
| `prone` | Face down, trunk within 15° of horizontal: lying, plank, push-up, on hands and knees. | `prone` |  |
| `prone.incline` | Face down, head higher than hips, 15–60° (hands raised). | `prone.incline` |  |
| `prone.decline` | Face down, head lower than hips, 15–60° (feet raised). | `prone.decline` |  |
| `prone.pike` | Face down, hips highest, hands and feet down, trunk more than 60° head-down (pike). | `prone.pike` |  |
| `side-lying` | On one side: lying, or a side plank. | `side-lying` |  |
| `hanging` | Held up by the hands or arms, feet off the floor: hanging from a bar, propped on dip bars. | `hanging` |  |
| `inverted` | Upside down, trunk within 30° of vertical, head lowest: handstand, headstand. | `inverted` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `end`: Which end of the body moves?

- **Fills:** FXI k.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `moving-end`.
- **Usual:** What the movement word says, else the limbs.

Usually the limbs move. In a sit-up, crunch, bridge or back extension the trunk moves and the legs stay put. In a V-up both ends move toward each other.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual end for this movement | the default | Alone. |
| `limbs` | The limbs move | `limbs` |  |
| `trunk` | The trunk moves; the legs stay put | `trunk` |  |
| `both` | Both ends move toward each other | `both` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `footwork`: What do the feet do?

- **Fills:** FXI f.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `footwork`.
- **Usual:** What the movement word says, else feet planted level.

A step returns each rep; travel keeps going. "In place" or on a cardio machine is planted.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual footwork for this movement | the default | Alone. |
| `level` | Planted level, side by side | `level` |  |
| `split` | Planted in a split stance, one foot in front | `split` |  |
| `step.fwd` | Each rep steps forward and returns | `step.fwd` |  |
| `step.back` | Each rep steps back and returns | `step.back` |  |
| `step.side` | Each rep steps to the side and returns | `step.side` |  |
| `step.cross` | Each rep steps back and across (curtsy) and returns | `step.cross` |  |
| `travel.fwd` | Travels forward | `travel.fwd` |  |
| `travel.back` | Travels backward | `travel.back` |  |
| `travel.side` | Travels sideways | `travel.side` |  |
| `level>split` | Starts level and lands in a split (split jerk) | `level>split` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `support`: What does the body rest on, hang from or brace against?

- **Fills:** FXI s.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `support`.
- **Usual:** What the movement word says.

Only what bears weight or braces a limb, beyond the floor your position implies. Not a mat, not the seat you sit on, not a machine's own seat or pads, not a hand rail used only for balance.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual support for this movement | the default | Alone. |
| `none` | Only the floor, the way the body position implies |  |  |
| `custom` | Something else: I will name it |  |  |
| `unknown` | I don't know | `?` | Alone. |

#### `sup1.surface`: What is the support?

- **Fills:** FXI s (surface).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `support` is `custom`.
- **Usual:** no published default; the answer defines the value

Different surfaces under different body points are separate supports: feet on a ball, hands on the floor.

| Option | Means | Writes | Note |
|---|---|---|---|
| `bb` | Barbell. | `bb` |  |
| `ez` | EZ curl bar. | `ez` |  |
| `tb` | Trap or hex bar. | `tb` |  |
| `axle` | Axle bar. | `axle` |  |
| `camber` | Cambered bar. | `camber` |  |
| `db` | Dumbbell. | `db` |  |
| `kb` | Kettlebell. | `kb` |  |
| `circus` | Circus dumbbell. | `circus` |  |
| `mb` | Medicine ball. | `mb` |  |
| `slam` | Slam ball. | `slam` |  |
| `bag` | Sandbag. | `bag` |  |
| `hbag` | Heavy bag. | `hbag` |  |
| `plate` | Weight plate. | `plate` |  |
| `chain` | Chain. | `chain` |  |
| `rope` | Battle rope. | `rope` |  |
| `jrope` | Jump rope. | `jrope` |  |
| `band` | Any resistance band, tube, superband or miniband. | `band` |  |
| `sled` | Ground sled or prowler. | `sled` |  |
| `tire` | Tyre. | `tire` |  |
| `hammer` | Sledgehammer. | `hammer` |  |
| `stone` | Atlas stone. | `stone` |  |
| `log` | Log. | `log` |  |
| `keg` | Keg. | `keg` |  |
| `yoke` | Yoke. | `yoke` |  |
| `frame` | Farmer handles or carry frame (rickshaw). | `frame` |  |
| `car` | Car. | `car` |  |
| `vest` | Weight vest. | `vest` |  |
| `ankwt` | Ankle weight. | `ankwt` |  |
| `club` | Club or mace. | `club` |  |
| `dowel` | Dowel, broomstick or PVC pipe: sets the hands, adds no load. | `dowel` |  |
| `wheel` | Ab wheel. | `wheel` |  |
| `wroller` | Wrist roller. | `wroller` |  |
| `harness` | Head harness. | `harness` |  |
| `cable` | Cable column or crossover station (not a lat pulldown or seated row machine). | `cable` |  |
| `smith` | Smith machine. | `smith` |  |
| `landmine` | Landmine, or a barbell end wedged in a corner. | `landmine` |  |
| `mach` | Any dedicated strength machine (including lat pulldown and seated cable row machines). The row’s FXE names which. | `mach` |  |
| `erg` | Any cardio machine: treadmill, bike, rower, elliptical, stair machine, ski erg. The row’s FXE names which. | `erg` |  |
| `floor` | The floor or a mat. | `floor` |  |
| `wall` | A wall. | `wall` |  |
| `bench` | A bench. | `bench` |  |
| `box` | A box, step or platform. | `box` |  |
| `chair` | A chair. | `chair` |  |
| `block` | Lifting blocks. | `block` |  |
| `rack` | Power rack or squat stand. | `rack` |  |
| `ball` | Stability ball. | `ball` |  |
| `dome` | BOSU, side up not stated. | `dome` |  |
| `dome.up` | BOSU dome side up. | `dome.up` |  |
| `dome.down` | BOSU flat side up (dome on the floor). | `dome.down` |  |
| `board` | Balance board. | `board` |  |
| `roller` | Foam roller. | `roller` |  |
| `slider` | Slider. | `slider` |  |
| `strap` | Suspension straps. | `strap` |  |
| `ring` | Gymnastic rings. | `ring` |  |
| `crope` | Climbing rope. | `crope` |  |
| `bar` | Fixed bar: pull-up bar, or a racked bar used as a handhold. | `bar` |  |
| `bars` | Parallel dip bars. | `bars` |  |
| `pbars` | Parallettes. | `pbars` |  |
| `preacher` | Preacher bench pad. | `preacher` |  |
| `hyper` | Back-extension bench (Roman chair for back or side raises). | `hyper` |  |
| `ghd` | Glute-ham developer. | `ghd` |  |
| `vkr` | Captain’s chair / knee-raise station. | `vkr` |  |
| `pole` | A vertical pole or post gripped by the hands (human flag). | `pole` |  |
| `mball` | Massage or lacrosse ball. | `mball` |  |
| `unknown` | Something not named | `?` | Alone. |

#### `sup1.points`: Which body points bear weight on it?

- **Fills:** FXI s (points).
- **Pick:** one or more.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `support` is `custom`.
- **Usual:** Only the points the body position implies.

Leave out the points your body position already implies (standing implies the feet; lying face up, the back). When the trunk rests on nothing (plank, push-up), list every point.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Only the points the position implies (the usual way) | the default | Alone. |
| `hands` | The hands, or one hand. | `hands` |  |
| `forearms` | The forearms, elbows bent (elbow plank). | `forearms` |  |
| `elbows` | The crook of the elbows (Zercher). | `elbows` |  |
| `arms` | The upper arms (preacher pad). | `arms` |  |
| `shoulders` | On the front of the shoulders and collarbones (front rack), or on one shoulder. | `shoulders` |  |
| `chest` | Against the chest (goblet, bear hug). | `chest` |  |
| `back` | Across the upper back (back squat). | `back` |  |
| `hips` | Across the front of the hips (hip thrust). | `hips` |  |
| `waist` | Hung from a belt at the waist. | `waist` |  |
| `seat` | The buttocks (sitting down onto a box or bench). | `seat` |  |
| `thighs` | On or around the thighs. | `thighs` |  |
| `knees` | At or around the knees. | `knees` |  |
| `shins` | The shins. | `shins` |  |
| `calves` | The calves (the back of the lower leg). | `calves` |  |
| `ankles` | At or just above the ankles (strap, cuff, machine pad on the lower leg). | `ankles` |  |
| `feet` | The feet, or one foot. | `feet` |  |
| `head` | The head or forehead. | `head` |  |
| `unknown` | A point I don't know | `?` |  |

#### `sup.more`: Is there a second support?

- **Fills:** FXI s (items).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `support` is `custom`.
- **Usual:** No.

Example: feet on a ball and hands on the floor.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | No (the usual way) | the default | Alone. |
| `yes` | Yes |  |  |

#### `sup2.surface`: What is the second support?

- **Fills:** FXI s (surface).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `support` is `custom`; and `sup.more` is `yes`.
- **Usual:** no published default; the answer defines the value

Different surfaces under different body points are separate supports: feet on a ball, hands on the floor.

| Option | Means | Writes | Note |
|---|---|---|---|
| `bb` | Barbell. | `bb` |  |
| `ez` | EZ curl bar. | `ez` |  |
| `tb` | Trap or hex bar. | `tb` |  |
| `axle` | Axle bar. | `axle` |  |
| `camber` | Cambered bar. | `camber` |  |
| `db` | Dumbbell. | `db` |  |
| `kb` | Kettlebell. | `kb` |  |
| `circus` | Circus dumbbell. | `circus` |  |
| `mb` | Medicine ball. | `mb` |  |
| `slam` | Slam ball. | `slam` |  |
| `bag` | Sandbag. | `bag` |  |
| `hbag` | Heavy bag. | `hbag` |  |
| `plate` | Weight plate. | `plate` |  |
| `chain` | Chain. | `chain` |  |
| `rope` | Battle rope. | `rope` |  |
| `jrope` | Jump rope. | `jrope` |  |
| `band` | Any resistance band, tube, superband or miniband. | `band` |  |
| `sled` | Ground sled or prowler. | `sled` |  |
| `tire` | Tyre. | `tire` |  |
| `hammer` | Sledgehammer. | `hammer` |  |
| `stone` | Atlas stone. | `stone` |  |
| `log` | Log. | `log` |  |
| `keg` | Keg. | `keg` |  |
| `yoke` | Yoke. | `yoke` |  |
| `frame` | Farmer handles or carry frame (rickshaw). | `frame` |  |
| `car` | Car. | `car` |  |
| `vest` | Weight vest. | `vest` |  |
| `ankwt` | Ankle weight. | `ankwt` |  |
| `club` | Club or mace. | `club` |  |
| `dowel` | Dowel, broomstick or PVC pipe: sets the hands, adds no load. | `dowel` |  |
| `wheel` | Ab wheel. | `wheel` |  |
| `wroller` | Wrist roller. | `wroller` |  |
| `harness` | Head harness. | `harness` |  |
| `cable` | Cable column or crossover station (not a lat pulldown or seated row machine). | `cable` |  |
| `smith` | Smith machine. | `smith` |  |
| `landmine` | Landmine, or a barbell end wedged in a corner. | `landmine` |  |
| `mach` | Any dedicated strength machine (including lat pulldown and seated cable row machines). The row’s FXE names which. | `mach` |  |
| `erg` | Any cardio machine: treadmill, bike, rower, elliptical, stair machine, ski erg. The row’s FXE names which. | `erg` |  |
| `floor` | The floor or a mat. | `floor` |  |
| `wall` | A wall. | `wall` |  |
| `bench` | A bench. | `bench` |  |
| `box` | A box, step or platform. | `box` |  |
| `chair` | A chair. | `chair` |  |
| `block` | Lifting blocks. | `block` |  |
| `rack` | Power rack or squat stand. | `rack` |  |
| `ball` | Stability ball. | `ball` |  |
| `dome` | BOSU, side up not stated. | `dome` |  |
| `dome.up` | BOSU dome side up. | `dome.up` |  |
| `dome.down` | BOSU flat side up (dome on the floor). | `dome.down` |  |
| `board` | Balance board. | `board` |  |
| `roller` | Foam roller. | `roller` |  |
| `slider` | Slider. | `slider` |  |
| `strap` | Suspension straps. | `strap` |  |
| `ring` | Gymnastic rings. | `ring` |  |
| `crope` | Climbing rope. | `crope` |  |
| `bar` | Fixed bar: pull-up bar, or a racked bar used as a handhold. | `bar` |  |
| `bars` | Parallel dip bars. | `bars` |  |
| `pbars` | Parallettes. | `pbars` |  |
| `preacher` | Preacher bench pad. | `preacher` |  |
| `hyper` | Back-extension bench (Roman chair for back or side raises). | `hyper` |  |
| `ghd` | Glute-ham developer. | `ghd` |  |
| `vkr` | Captain’s chair / knee-raise station. | `vkr` |  |
| `pole` | A vertical pole or post gripped by the hands (human flag). | `pole` |  |
| `mball` | Massage or lacrosse ball. | `mball` |  |
| `unknown` | Something not named | `?` | Alone. |

#### `sup2.points`: Which body points bear weight on it?

- **Fills:** FXI s (points).
- **Pick:** one or more.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `support` is `custom`; and `sup.more` is `yes`.
- **Usual:** Only the points the body position implies.

Leave out the points your body position already implies (standing implies the feet; lying face up, the back). When the trunk rests on nothing (plank, push-up), list every point.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Only the points the position implies (the usual way) | the default | Alone. |
| `hands` | The hands, or one hand. | `hands` |  |
| `forearms` | The forearms, elbows bent (elbow plank). | `forearms` |  |
| `elbows` | The crook of the elbows (Zercher). | `elbows` |  |
| `arms` | The upper arms (preacher pad). | `arms` |  |
| `shoulders` | On the front of the shoulders and collarbones (front rack), or on one shoulder. | `shoulders` |  |
| `chest` | Against the chest (goblet, bear hug). | `chest` |  |
| `back` | Across the upper back (back squat). | `back` |  |
| `hips` | Across the front of the hips (hip thrust). | `hips` |  |
| `waist` | Hung from a belt at the waist. | `waist` |  |
| `seat` | The buttocks (sitting down onto a box or bench). | `seat` |  |
| `thighs` | On or around the thighs. | `thighs` |  |
| `knees` | At or around the knees. | `knees` |  |
| `shins` | The shins. | `shins` |  |
| `calves` | The calves (the back of the lower leg). | `calves` |  |
| `ankles` | At or just above the ankles (strap, cuff, machine pad on the lower leg). | `ankles` |  |
| `feet` | The feet, or one foot. | `feet` |  |
| `head` | The head or forehead. | `head` |  |
| `unknown` | A point I don't know | `?` |  |

#### `load`: What loads the working muscles?

- **Fills:** FXI l, and the row FXE.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and either not (the movement word fixes the load (body weight, a cable, a machine, a named implement)), or `changes` includes `equipment`.
- **Usual:** The load the movement word names.

Not supports: a bench, box or bar you hang from goes under support. A weighted vest or belt is an implement. A lat pulldown and a seated cable row with its own seat are strength machines.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual load for this movement | the default | Alone. Only when the movement word fixes the load (body weight, a cable, a machine, a named implement). |
| `bodyweight` | Body weight only | `bw` |  |
| `implement` | A free implement: barbell, dumbbell, kettlebell, band, ball, plate… |  |  |
| `cable` | A cable column or crossover | `cable` |  |
| `smith` | A Smith machine | `smith` |  |
| `landmine` | A landmine | `landmine` |  |
| `machine` | A strength machine built for one movement | `mach` |  |
| `cardio` | A cardio machine | `erg` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `imp1`: Which implement?

- **Fills:** FXI l (token) and the row FXE.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `load` is `implement`.
- **Usual:** no published default; the answer defines the value

The kind of object, not its weight. Any resistance band, tube, superband or miniband is "band".

| Option | Means | Writes | Note |
|---|---|---|---|
| `bb` | Barbell. | `bb` |  |
| `ez` | EZ curl bar. | `ez` |  |
| `tb` | Trap or hex bar. | `tb` |  |
| `axle` | Axle bar. | `axle` |  |
| `camber` | Cambered bar. | `camber` |  |
| `db` | Dumbbell. | `db` |  |
| `kb` | Kettlebell. | `kb` |  |
| `circus` | Circus dumbbell. | `circus` |  |
| `mb` | Medicine ball. | `mb` |  |
| `slam` | Slam ball. | `slam` |  |
| `bag` | Sandbag. | `bag` |  |
| `hbag` | Heavy bag. | `hbag` |  |
| `plate` | Weight plate. | `plate` |  |
| `chain` | Chain. | `chain` |  |
| `rope` | Battle rope. | `rope` |  |
| `jrope` | Jump rope. | `jrope` |  |
| `band` | Any resistance band, tube, superband or miniband. | `band` |  |
| `sled` | Ground sled or prowler. | `sled` |  |
| `tire` | Tyre. | `tire` |  |
| `hammer` | Sledgehammer. | `hammer` |  |
| `stone` | Atlas stone. | `stone` |  |
| `log` | Log. | `log` |  |
| `keg` | Keg. | `keg` |  |
| `yoke` | Yoke. | `yoke` |  |
| `frame` | Farmer handles or carry frame (rickshaw). | `frame` |  |
| `car` | Car. | `car` |  |
| `vest` | Weight vest. | `vest` |  |
| `ankwt` | Ankle weight. | `ankwt` |  |
| `club` | Club or mace. | `club` |  |
| `dowel` | Dowel, broomstick or PVC pipe: sets the hands, adds no load. | `dowel` |  |
| `wheel` | Ab wheel. | `wheel` |  |
| `wroller` | Wrist roller. | `wroller` |  |
| `harness` | Head harness. | `harness` |  |
| `unknown` | A free weight of a kind I don't know | `?` | Alone. |

#### `hold1`: Where is it held?

- **Fills:** FXI l (hold point).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and the first load is a free implement, a cable, a Smith machine or a landmine; and either not (the rules give a usual hold point for that implement in this movement), or `changes` includes `hold`, or `load` is `implement` or `cable` or `smith` or `landmine`.
- **Usual:** The hold the movement word gives for this implement, else the hands for an implement held in the hands.

In the hands, at the sides, swung or by a handle is "hands", and so are dumbbells held at shoulder height and a bar pressed without resting on the shoulders. Resting on the front of the shoulders (front rack), or a landmine end held at the shoulder, is "shoulders". A bar behind the neck rests on the "back". Straight-armed overhead for the whole rep is "overhead". A load on the lap in a seated calf raise is "thighs". A band goes where it presses or pulls on the body; in leg-only work that is usually the feet or ankles. A band whose ends you hold at the shoulders (a band thruster) is "hands": "shoulders" is a load resting on them.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual place for this movement | the default | Alone. Only when the rules give a usual hold point for that implement in this movement. |
| `hands` | The hands, or one hand. | `hands` |  |
| `forearms` | The forearms, elbows bent (elbow plank). | `forearms` |  |
| `elbows` | The crook of the elbows (Zercher). | `elbows` |  |
| `arms` | The upper arms (preacher pad). | `arms` |  |
| `shoulders` | On the front of the shoulders and collarbones (front rack), or on one shoulder. | `shoulders` |  |
| `chest` | Against the chest (goblet, bear hug). | `chest` |  |
| `back` | Across the upper back (back squat). | `back` |  |
| `hips` | Across the front of the hips (hip thrust). | `hips` |  |
| `waist` | Hung from a belt at the waist. | `waist` |  |
| `seat` | The buttocks (sitting down onto a box or bench). | `seat` |  |
| `thighs` | On or around the thighs. | `thighs` |  |
| `knees` | At or around the knees. | `knees` |  |
| `shins` | The shins. | `shins` |  |
| `calves` | The calves (the back of the lower leg). | `calves` |  |
| `ankles` | At or just above the ankles (strap, cuff, machine pad on the lower leg). | `ankles` |  |
| `feet` | The feet, or one foot. | `feet` |  |
| `head` | The head or forehead. | `head` |  |
| `overhead` | Held in the hands with the arms straight overhead for the whole rep. | `overhead` |  |
| `assist` | The implement takes part of the body weight (assist band, assisted machine). | `assist` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `count1`: How many of them, in total?

- **Fills:** FXI l (count "*n").
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and the first load is a free implement, a cable, a Smith machine or a landmine; and `changes` includes `count`.
- **Usual:** The usual count.

The usual count is one per working hand for a one-hand implement (two dumbbells in a two-arm curl, one in a one-arm curl) and one for a two-hand implement or anything held on the trunk. When the legs also work one side at a time (a lunge with a one-arm press), the usual count is two: answer 1 if you hold one dumbbell. If your total is the usual one, the answer changes nothing.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual count | the default | Alone. |
| `1` | 1 | `1` |  |
| `2` | 2 | `2` |  |
| `3` | 3 | `3` |  |
| `4` | 4 | `4` |  |

#### `imp2`: What is the second implement?

- **Fills:** FXI l (second item).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `extra`.
- **Usual:** no published default; the answer defines the value

Example: a weight vest on top of dumbbells, or a plate on a dip belt with body weight.

| Option | Means | Writes | Note |
|---|---|---|---|
| `bb` | Barbell. | `bb` |  |
| `ez` | EZ curl bar. | `ez` |  |
| `tb` | Trap or hex bar. | `tb` |  |
| `axle` | Axle bar. | `axle` |  |
| `camber` | Cambered bar. | `camber` |  |
| `db` | Dumbbell. | `db` |  |
| `kb` | Kettlebell. | `kb` |  |
| `circus` | Circus dumbbell. | `circus` |  |
| `mb` | Medicine ball. | `mb` |  |
| `slam` | Slam ball. | `slam` |  |
| `bag` | Sandbag. | `bag` |  |
| `hbag` | Heavy bag. | `hbag` |  |
| `plate` | Weight plate. | `plate` |  |
| `chain` | Chain. | `chain` |  |
| `rope` | Battle rope. | `rope` |  |
| `jrope` | Jump rope. | `jrope` |  |
| `band` | Any resistance band, tube, superband or miniband. | `band` |  |
| `sled` | Ground sled or prowler. | `sled` |  |
| `tire` | Tyre. | `tire` |  |
| `hammer` | Sledgehammer. | `hammer` |  |
| `stone` | Atlas stone. | `stone` |  |
| `log` | Log. | `log` |  |
| `keg` | Keg. | `keg` |  |
| `yoke` | Yoke. | `yoke` |  |
| `frame` | Farmer handles or carry frame (rickshaw). | `frame` |  |
| `car` | Car. | `car` |  |
| `vest` | Weight vest. | `vest` |  |
| `ankwt` | Ankle weight. | `ankwt` |  |
| `club` | Club or mace. | `club` |  |
| `dowel` | Dowel, broomstick or PVC pipe: sets the hands, adds no load. | `dowel` |  |
| `wheel` | Ab wheel. | `wheel` |  |
| `wroller` | Wrist roller. | `wroller` |  |
| `harness` | Head harness. | `harness` |  |
| `cable` | Cable | `cable` |  |
| `unknown` | A free weight of a kind I don't know | `?` | Alone. |

#### `hold2`: Where is the second implement held?

- **Fills:** FXI l (hold point).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `extra`.
- **Usual:** The usual place for that implement in this movement.

Same rules as the first implement.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual place for this movement | the default | Alone. Only when the rules give a usual hold point for the second implement in this movement. |
| `hands` | The hands, or one hand. | `hands` |  |
| `forearms` | The forearms, elbows bent (elbow plank). | `forearms` |  |
| `elbows` | The crook of the elbows (Zercher). | `elbows` |  |
| `arms` | The upper arms (preacher pad). | `arms` |  |
| `shoulders` | On the front of the shoulders and collarbones (front rack), or on one shoulder. | `shoulders` |  |
| `chest` | Against the chest (goblet, bear hug). | `chest` |  |
| `back` | Across the upper back (back squat). | `back` |  |
| `hips` | Across the front of the hips (hip thrust). | `hips` |  |
| `waist` | Hung from a belt at the waist. | `waist` |  |
| `seat` | The buttocks (sitting down onto a box or bench). | `seat` |  |
| `thighs` | On or around the thighs. | `thighs` |  |
| `knees` | At or around the knees. | `knees` |  |
| `shins` | The shins. | `shins` |  |
| `calves` | The calves (the back of the lower leg). | `calves` |  |
| `ankles` | At or just above the ankles (strap, cuff, machine pad on the lower leg). | `ankles` |  |
| `feet` | The feet, or one foot. | `feet` |  |
| `head` | The head or forehead. | `head` |  |
| `overhead` | Held in the hands with the arms straight overhead for the whole rep. | `overhead` |  |
| `assist` | The implement takes part of the body weight (assist band, assisted machine). | `assist` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `band.type`: Which kind of band?

- **Fills:** FXE f (band child).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and a band is one of the loads.
- **Usual:** A band of a type not stated.

Name the kind only when you know it. The FXI is the same for every band; only the row's FXE changes.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Not stated (the usual way) | the default | Alone. |
| `loop` | Long loop band: superband, power band | `band.loop` |  |
| `mini` | Short loop band around the legs: miniband | `band.mini` |  |
| `tube` | Tube with handles | `band.tube` |  |

#### `mac.motion`: What does the machine guide?

- **Fills:** FXE m (mac).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and the load is a strength machine; and either not (the movement word fixes which machine is used), or `changes` includes `machine`.
- **Usual:** The machine the movement word names.

Answer for the machine as it is built, not the exercise done on it. A calf raise done on a leg press uses a leg press: answer "pushes away". A pivot that lines up with one joint is a single-joint machine.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The machine built for this movement (the usual way) | the default | Alone. Only when the movement word fixes which machine is used. |
| `push` | *Multi-joint:* It pushes away: a multi-joint press or squat machine |  |  |
| `pull` | It pulls toward you: a multi-joint row, pulldown or deadlift machine |  |  |
| `assist` | It helps lift the body: an assisted pull-up or dip machine |  |  |
| `kn.flex` | *Pivots at one joint:* Knee bends (leg curl) | `kn.flex` |  |
| `kn.ext` | Knee straightens (leg extension) | `kn.ext` |  |
| `el.flex` | Elbow bends (curl machine) | `el.flex` |  |
| `el.ext` | Elbow straightens (triceps machine) | `el.ext` |  |
| `sh.hadd` | Arms sweep together in front (pec deck) | `sh.hadd` |  |
| `sh.habd` | Arms sweep apart (rear-delt machine) | `sh.habd` |  |
| `sh.abd` | Arms raise out to the sides (lateral raise machine) | `sh.abd` |  |
| `sh.ext` | Arms pull down from in front (pullover machine) | `sh.ext` |  |
| `sh.flex` | Arms raise forward | `sh.flex` |  |
| `sh.add` | Arms pull down from the sides | `sh.add` |  |
| `sh.ir` | Shoulder rotates in | `sh.ir` |  |
| `sh.er` | Shoulder rotates out | `sh.er` |  |
| `sc.elev` | Shrug | `sc.elev` |  |
| `hip.flex` | Hip bends (leg-raise or knee-raise machine) | `hip.flex` |  |
| `hip.ext` | Hip extends (glute kickback, hip thrust, reverse hyper) | `hip.ext` |  |
| `hip.abd` | Legs push apart (abductor) | `hip.abd` |  |
| `hip.add` | Legs squeeze together (adductor) | `hip.add` |  |
| `sp.flex` | Trunk curls (ab crunch machine) | `sp.flex` |  |
| `sp.ext` | Trunk extends (back extension machine) | `sp.ext` |  |
| `sp.rot` | Trunk twists (rotary torso) | `sp.rot` |  |
| `sp.lflex` | Trunk bends sideways | `sp.lflex` |  |
| `ank.pf` | Rise onto the toes (calf raise machine) | `ank.pf` |  |
| `ank.df` | Toes pull up (tibialis machine) | `ank.df` |  |
| `nk.flex` | Neck flexes | `nk.flex` |  |
| `nk.ext` | Neck extends | `nk.ext` |  |
| `nk.lflex` | Neck bends sideways | `nk.lflex` |  |
| `wr.flex` | Wrist curls | `wr.flex` |  |
| `wr.ext` | Wrist extends | `wr.ext` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `mac.direction`: Which way does the handle, pad or plate move, relative to your trunk, while you work?

- **Fills:** FXE m (mac direction).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and the load is a strength machine; and either not (the movement word fixes which machine is used), or `changes` includes `machine`; and `mac.motion` is `push` or `pull` or `assist`.
- **Usual:** The direction of the machine the movement word names.

Up is toward the head, down toward the feet, forward is away from the front of the trunk.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual direction for this movement | the default | Alone. Only when the movement word names a multi-joint machine, so its direction is known. |
| `up` | Toward the head: shoulder press, hack squat, belt squat, deadlift machine. | `up` |  |
| `down` | Toward the feet: pulldown, seated dip. | `down` |  |
| `fwd` | Away from the front of the trunk: chest press, leg press. | `fwd` |  |
| `back` | Toward the front of the trunk: row. | `back` |  |
| `fwdup` | Forward and up: incline press. | `fwdup` |  |
| `fwddown` | Forward and down: decline press. | `fwddown` |  |
| `backdown` | Back and down: high row. | `backdown` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `mac.contact`: Where does the moving part of the machine meet your body?

- **Fills:** FXE l (mac) and the FXI hold point of mach.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and the load is a strength machine; and either not (the movement word fixes which machine is used), or `changes` includes `machine`.
- **Usual:** The FXE default for that guided motion (FXE machine defaults), or the machine the movement word names.

The part you push or pull: handles, a foot plate, a pad on the lower leg. On an assisted pull-up or dip machine, answer where the assist pad or platform meets you (knee or foot): that goes in the FXE. The FXI always writes an assisted machine as mach@assist.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual place for this motion | the default | Alone. Only when the movement word names the machine, or the rules give a default contact for the guided motion. |
| `hand` | Handles or a bar in the hands. | `hand` |  |
| `foot` | A foot plate or pedals. | `foot` |  |
| `ankle` | A pad on the lower leg. | `ankle` |  |
| `thigh` | A pad on the thigh. | `thigh` |  |
| `knee` | A pad or platform at the knees. | `knee` |  |
| `arm` | A pad on the upper arm or elbow. | `arm` |  |
| `chest` | A pad on the chest. | `chest` |  |
| `back` | A pad on the back. | `back` |  |
| `shoulder` | Pads on the shoulders. | `shoulder` |  |
| `hip` | A pad or belt at the hips. | `hip` |  |
| `head` | A pad on the head. | `head` |  |
| `seat` | A moving seat. | `seat` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `mac.chest`: Does a pad support your chest while you work?

- **Fills:** FXE s (mac posture).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and the load is a strength machine; and either not (the movement word fixes which machine is used), or `changes` includes `machine`.
- **Usual:** No chest pad, unless the movement word names a machine that has one (row machine).

A chest pad on a row machine or a donkey calf raise. The rest of the machine posture is read from your body position.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual way for this movement | the default | Alone. |
| `yes` | Yes |  |  |
| `no` | No |  |  |

#### `erg.type`: Which cardio machine?

- **Fills:** FXE k:erg layers, and the FXI hold point of erg.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and the load is a cardio machine; and either not (the movement word fixes which cardio machine is used), or `changes` includes `machine`.
- **Usual:** The machine the movement word names.

Pick the type. If you only know it is a stationary bike or a stair machine, pick the "not known" entry.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual machine for this movement | the default | Alone. Only when the movement word fixes which cardio machine is used. |
| `treadmill` | Treadmill | `treadmill` |  |
| `stepmill` | Stepmill (revolving stairs) | `stepmill` |  |
| `stepper` | Stair stepper (pedals) | `stepper` |  |
| `stair` | Stair machine, stepper or stepmill not known | `stair` |  |
| `bike-upright` | Upright or spin bike | `bike-upright` |  |
| `bike-recumbent` | Recumbent bike | `bike-recumbent` |  |
| `bike` | Stationary bike, upright or recumbent not known | `bike` |  |
| `air-bike` | Air bike (moving arms) | `air-bike` |  |
| `elliptical` | Elliptical | `elliptical` |  |
| `rower` | Rower | `rower` |  |
| `ski` | Ski erg | `ski` |  |
| `ube` | Upper-body ergometer (hand cranks, seated) | `ube` |  |
| `vertical-climber` | Vertical climber | `vertical-climber` |  |
| `ladder-climber` | Ladder climber | `ladder-climber` |  |
| `unknown` | A cardio machine of a type I don't know | `?` | Alone. |

#### `symmetry`: How do the two sides work?

- **Fills:** FXI x.
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and either `changes` includes `sides`, or the movement is "other", or the owner said the joint movement differs from the movement word.
- **Usual:** What the movement word says, else both sides together.

Doing every rep on one side and then switching is different from alternating sides rep by rep. Reciprocal means both sides move at once in opposite directions: walking, flutter kicks, alternating rope waves. A stretch or roll that works one limb and then the other is "one side, then the other". Legs that pedal are reciprocal even when the trunk turns to each side in turn (bicycle crunch); a trunk turn alone has no sides.

*Import mode:* from the name and fields only. "Alternating" means the sides take turns only when nothing else in the name alternates ("alternating front and lateral raise" alternates two raises).

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual way for this movement | the default | Alone. |
| `b` | Both sides together, or the movement has no sides | `b` |  |
| `u` | One side does every rep, then the other side | `u` |  |
| `a` | The sides take turns rep by rep | `a` |  |
| `rc` | Both sides move at once in opposite directions | `rc` |  |
| `split` | The arms and the legs follow different patterns (suitcase carry) |  |  |
| `unknown` | I don't know | `?` | Alone. |

#### `symmetry.scope`: Does that pattern apply to the arms only, the legs only, or every working limb?

- **Fills:** FXI x (scope).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `symmetry` is `u` or `a` or `rc`.
- **Usual:** Every working limb.

A single-arm kettlebell swing is the arms only: the legs still work together.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Every working limb (the usual way) | the default | Alone. |
| `arms` | The arms only | `arms` |  |
| `legs` | The legs only | `legs` |  |

#### `symmetry.arms`: How do the arms work?

- **Fills:** FXI x (scoped item).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `symmetry` is `split`.
- **Usual:** Both sides together.

A suitcase carry: the legs are reciprocal, the arms one side then the other.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Both together (the usual way) | the default | Alone. |
| `b` | Both together | `b` |  |
| `u` | One side, then the other | `u` |  |
| `a` | Taking turns rep by rep | `a` |  |
| `rc` | At once, in opposite directions | `rc` |  |

#### `symmetry.legs`: How do the legs work?

- **Fills:** FXI x (scoped item).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `symmetry` is `split`.
- **Usual:** Both sides together.

A suitcase carry: the legs are reciprocal, the arms one side then the other.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Both together (the usual way) | the default | Alone. |
| `b` | Both together | `b` |  |
| `u` | One side, then the other | `u` |  |
| `a` | Taking turns rep by rep | `a` |  |
| `rc` | At once, in opposite directions | `rc` |  |

#### `grip.hand`: Which way do the palms face?

- **Fills:** FXI g (hand).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `hand`.
- **Usual:** What the movement word says, else underhand for a curl and overhand for everything else.

Overhand is palms down or away; underhand palms up or toward you; neutral palms facing each other. A turn during the rep (Zottman, Arnold press) is "turns". A grip the implement forces still counts: parallel handles (farmer or rickshaw handles) or a rope attachment are "neutral". Only a trap bar's neutral grip is left out, by the encoder.

*Import mode:* "reverse grip" in a name means the grip opposite the movement word's usual one: overhand on a curl, underhand elsewhere.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual way for this movement | the default | Alone. |
| `pr` | Overhand | `pr` |  |
| `su` | Underhand | `su` |  |
| `ne` | Neutral | `ne` |  |
| `mx` | Mixed: one over, one under | `mx` |  |
| `turn` | The palms turn during the rep |  |  |
| `unknown` | I don't know | `?` | Alone. |

#### `grip.start`: Which way do the palms face at the start?

- **Fills:** FXI g (hand, by phase).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `hand`; and `grip.hand` is `turn`.
- **Usual:** no published default; the answer defines the value

A Zottman curl starts underhand and ends overhand.

| Option | Means | Writes | Note |
|---|---|---|---|
| `pr` | Overhand | `pr` |  |
| `su` | Underhand | `su` |  |
| `ne` | Neutral | `ne` |  |
| `mx` | Mixed | `mx` |  |

#### `grip.end`: Which way do they face at the end of the working movement?

- **Fills:** FXI g (hand, by phase).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `hand`; and `grip.hand` is `turn`.
- **Usual:** no published default; the answer defines the value

A Zottman curl starts underhand and ends overhand.

| Option | Means | Writes | Note |
|---|---|---|---|
| `pr` | Overhand | `pr` |  |
| `su` | Underhand | `su` |  |
| `ne` | Neutral | `ne` |  |
| `mx` | Mixed | `mx` |  |

#### `grip.width`: How far apart are the hands?

- **Fills:** FXI g (width).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `width`.
- **Usual:** What the movement word says, else about shoulder width.

On an implement or on a support: a diamond push-up has the hands touching.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual width for this movement | the default | Alone. |
| `touching` | Touching or overlapping | `w-t` |  |
| `narrow` | Inside shoulder width | `w-n` |  |
| `medium` | About shoulder width | `w-m` |  |
| `wide` | Well outside shoulder width | `w-w` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `stance`: How far apart are the feet?

- **Fills:** FXI g (stance).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `stance`.
- **Usual:** What the movement word says, else about hip width.

Only for standing exercises, and for the feet on a machine's foot plate (leg press). A split stance is footwork, not stance.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual stance for this movement | the default | Alone. |
| `narrow` | Feet together or closer than hip width | `st-n` | Only when the body position at the start is standing, standing bent over, either or unknown; or the feet push a machine's foot plate (leg press). |
| `medium` | About hip width | `st-m` | Only when the body position at the start is standing, standing bent over, either or unknown; or the feet push a machine's foot plate (leg press). |
| `wide` | Wide (sumo) | `st-w` | Only when the body position at the start is standing, standing bent over, either or unknown; or the feet push a machine's foot plate (leg press). |
| `unknown` | I don't know | `?` | Alone. Only when the body position at the start is standing, standing bent over, either or unknown; or the feet push a machine's foot plate (leg press). |

#### `range.depth`: How much of the range does each rep use?

- **Fills:** FXI r (range).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `depth`.
- **Usual:** What the movement word says, else the full usual range.

Box or step height, and small angle changes, are prescription and never count. A box you sit down to is a support.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual range for this movement | the default | Alone. |
| `full` | The full usual range | (no prefix) |  |
| `partial` | Part of the range on purpose: half, quarter, pulses | `partial` |  |
| `deep` | Deeper than usual: full depth, ass to grass | `deep` |  |
| `deficit` | Deeper than usual by standing on something (deficit) | `deficit` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `range.start`: Where does each rep start?

- **Fills:** FXI r (start).
- **Pick:** one.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `start`.
- **Usual:** The movement's usual start.

Only when it is not the movement's usual start. A deadlift usually starts from the floor; a Romanian deadlift and a row from the top; a bell clean or snatch from a swing (a dead clean starts from the floor).

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual start for this movement | the default | Alone. |
| `from-floor` | From the floor, load at rest each rep | `from-floor` |  |
| `from-top` | From a hang above the knee: standing with the load held, lowered without setting it down | `from-top` |  |
| `from-top.knee` | From a hang at or below the knee | `from-top.knee` |  |
| `from-pins` | From pins, blocks or a rack above the floor | `from-pins` |  |
| `from-drop` | From a drop: step off a box and land first (depth jump) | `from-drop` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `held`: What do the limbs that do not work hold?

- **Fills:** FXI h.
- **Pick:** one or more.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `held`.
- **Usual:** What the movement word says, else no held posture.

Pick every held posture your exercise is done with, whether or not its name says so. A coaching cue ("keep your chest up") is not a held posture. Hands behind the head with nothing loaded there is "hands behind the head", not the line of pull.

*Import mode:* only from the name, through the import lexicon: prisoner, pistol, arms crossed, "arms extended" or "straight arm" (arms forward), "bent arm" or 90 degree (elbows bent), "behind head" with nothing loaded behind the head.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual way for this movement | the default | Alone. |
| `none` | No held posture: the non-working limbs do what the movement word implies (default, never written). | `none` | Alone. |
| `arms.oh` | Arms held straight overhead, nothing in the hands. | `arms.oh` |  |
| `arms.fwd` | Arms held straight and reaching forward from the shoulders, nothing in the hands ("arms extended", "straight arm"). | `arms.fwd` |  |
| `arms.side` | Arms held out to the sides. | `arms.side` |  |
| `arms.cross` | Arms crossed on the chest. | `arms.cross` |  |
| `hands.head` | Hands behind or on the head (prisoner). | `hands.head` |  |
| `el.bent` | Working elbows held bent at about 90° ("bent arm", "90 degree"). | `el.bent` |  |
| `ua.oh` | Upper arms held up beside the head while the elbows work (overhead triceps extension). | `ua.oh` |  |
| `ua.side` | Upper arms held out from the sides, elbows flared, while the elbows work (inner biceps curl, Tate press). | `ua.side` |  |
| `leg.fwd` | Free leg held straight in front. | `leg.fwd` |  |
| `leg.back` | Free leg held behind. | `leg.back` |  |
| `legs.l` | Legs held straight at about 90° hip flexion. | `legs.l` |  |
| `kn.bent` | Knees held bent while the hips or arms work (hanging knee raise; inverted row with the feet flat on the floor). | `kn.bent` |  |
| `trunk.fwd` | Trunk held leaning forward where the orientation does not already say so (chest dip). | `trunk.fwd` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `line`: Where does the load pull from, compared with the usual way?

- **Fills:** FXI p.
- **Pick:** one or more.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `line`.
- **Usual:** The line the movement word implies.

Usual anchors: low for curls, raises, upright rows, shrugs, kickbacks and hip work; high for pushdowns, pulldowns, face pulls, kneeling crunches and woodchops; middle for rows, flys, crossovers, rotations and chest presses; from the side for a Pallof press. Answer "high" or "low" only when yours differs; an anchor on the floor (a sled on the ground, a band under the feet) is low. "Low row" or "low pulley" in a name is a machine, not a line. A bar lowered to the neck or throat (JM press, guillotine press) and a rope that passes twice in each jump (double under) are lines too.

*Import mode:* only from the name, through the import lexicon.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual line for this movement | the default | Alone. |
| `hi` | Anchored higher than usual (high-to-low) | `hi` |  |
| `lo` | Anchored lower than usual (low-to-high) | `lo` |  |
| `side` | Pulls from one side: you stand side-on to the anchor | `side` |  |
| `behind` | The load or body passes behind the head or trunk (behind-the-neck press, rear pull-up) | `behind` |  |
| `neck` | The load comes down to the neck, throat or chin instead of the chest (JM press, guillotine press) | `neck` |  |
| `double` | A rope passes under the feet twice in each jump (double under) | `double` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `accessory`: What helps the exercise without loading it?

- **Fills:** FXI a (extended).
- **Pick:** one or more.
- **Asked when:** the subject is an exercise (the usual answer to "subject"); and `changes` includes `accessory`.
- **Usual:** What the movement word says, else no accessory.

A strap, belt, towel or rope used to pull or hold a limb (a stretching strap), or a partner who holds, resists or assists. A handle on a cable is not an accessory.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual way for this movement | the default | Alone. |
| `none` | No accessory (default, never written). | `none` | Alone. |
| `strap` | A strap, belt, towel or rope used to pull or hold a limb (stretching strap). | `strap` |  |
| `partner` | A partner who holds, resists or assists. | `partner` |  |

#### `eq.kind`: What kind of equipment is it?

- **Fills:** FXE k.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own.
- **Usual:** no published default; the answer defines the value

A machine built for one movement is a strength machine. A cable column, Smith machine or landmine serves many movements: a station.

| Option | Means | Writes | Note |
|---|---|---|---|
| `none` | No equipment: body weight | `none` |  |
| `imp` | An object moved, held or worn | `imp` |  |
| `sup` | A surface or frame the body rests on, hangs from or pushes against | `sup` |  |
| `acc` | A handle, strap, belt, mat, towel or marker | `acc` |  |
| `stn` | A cable column, Smith machine or landmine | `stn` |  |
| `mac` | A strength machine built for one movement | `mac` |  |
| `erg` | A cardio machine | `erg` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq.form.imp`: Which one is it?

- **Fills:** FXE f.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `imp`.
- **Usual:** no published default; the answer defines the value

Pick a child (superband, miniband) only when you know it. Otherwise pick the general entry.

| Option | Means | Writes | Note |
|---|---|---|---|
| `bar.straight` | Barbell, Olympic or standard. | `bar.straight` |  |
| `bar.ez` | EZ curl bar. | `bar.ez` |  |
| `bar.trap` | Trap or hex bar. | `bar.trap` |  |
| `bar.axle` | Thick axle bar. | `bar.axle` |  |
| `bar.camber` | Cambered bar. | `bar.camber` |  |
| `bell.dumb` | Dumbbell. | `bell.dumb` |  |
| `bell.kettle` | Kettlebell. | `bell.kettle` |  |
| `bell.circus` | Circus dumbbell. | `bell.circus` |  |
| `ball.med` | Medicine ball. | `ball.med` |  |
| `ball.slam` | Slam ball. | `ball.slam` |  |
| `bag.sand` | Sandbag. | `bag.sand` |  |
| `bag.heavy` | Hanging heavy bag. | `bag.heavy` |  |
| `plate` | A weight plate held or worn on its own. | `plate` |  |
| `chain` | Lifting chain. | `chain` |  |
| `rope.battle` | Battle rope. | `rope.battle` |  |
| `rope.jump` | Skipping rope. | `rope.jump` |  |
| `band` | Elastic band or tube, type not stated. | `band` |  |
| `band.loop` | Long loop band: superband, power band. | `band.loop` |  |
| `band.mini` | Short loop band worn around the legs: miniband. | `band.mini` |  |
| `band.tube` | Tube band with handles. | `band.tube` |  |
| `sled` | Ground sled or prowler, pushed or dragged. | `sled` |  |
| `tire` | Large tyre. | `tire` |  |
| `hammer` | Sledgehammer. | `hammer` |  |
| `stone` | Atlas stone. | `stone` |  |
| `log` | Strongman log. | `log` |  |
| `keg` | Keg. | `keg` |  |
| `yoke` | Strongman yoke. | `yoke` |  |
| `frame.carry` | Farmer handles or a carry frame (rickshaw). | `frame.carry` |  |
| `car` | A car, lifted or pushed. | `car` |  |
| `wear.vest` | Weight vest. | `wear.vest` |  |
| `wear.ankle` | Ankle weight. | `wear.ankle` |  |
| `club` | Indian club or mace. | `club` |  |
| `stick` | Dowel, broomstick or PVC pipe. | `stick` |  |
| `wheel` | Ab wheel. | `wheel` |  |
| `roller.wrist` | Wrist roller. | `roller.wrist` |  |
| `harness.head` | Head harness with a hanging load. | `harness.head` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq.form.sup`: Which one is it?

- **Fills:** FXE f.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `sup`.
- **Usual:** no published default; the answer defines the value

Pick a child (superband, miniband) only when you know it. Otherwise pick the general entry.

| Option | Means | Writes | Note |
|---|---|---|---|
| `floor` | The floor, or a mat on it. | `floor` |  |
| `wall` | A wall. | `wall` |  |
| `bench` | A bench, flat or adjustable. | `bench` |  |
| `box` | A box, step or platform. | `box` |  |
| `chair` | A chair. | `chair` |  |
| `block` | Lifting blocks a bar starts from. | `block` |  |
| `rack` | Power rack or squat stand, with its pins. | `rack` |  |
| `ball.stab` | Stability, Swiss or exercise ball. | `ball.stab` |  |
| `dome` | BOSU, either side up. | `dome` |  |
| `board.bal` | Balance or wobble board. | `board.bal` |  |
| `roller.foam` | Foam roller. | `roller.foam` |  |
| `slider` | Slider disc. | `slider` |  |
| `strap.susp` | Suspension trainer. | `strap.susp` |  |
| `ring` | Gymnastic rings. | `ring` |  |
| `rope.climb` | Climbing rope. | `rope.climb` |  |
| `bar.fixed` | Fixed overhead bar: pull-up bar. | `bar.fixed` |  |
| `bar.parallel` | Parallel dip bars. | `bar.parallel` |  |
| `bar.parallette` | Floor parallettes. | `bar.parallette` |  |
| `pad.preacher` | Preacher bench. | `pad.preacher` |  |
| `pad.hyper` | Back-extension bench, 45° or 90° (also called a Roman chair for back or side raises). | `pad.hyper` |  |
| `pad.ghd` | Glute-ham developer. | `pad.ghd` |  |
| `station.vkr` | Vertical knee-raise station (captain’s chair). | `station.vkr` |  |
| `pole` | A vertical pole, post or rack upright gripped by the hands. | `pole` |  |
| `ball.massage` | Massage or lacrosse ball rolled under the body. | `ball.massage` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq.form.acc`: Which one is it?

- **Fills:** FXE f.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `acc`.
- **Usual:** no published default; the answer defines the value

Pick a child (superband, miniband) only when you know it. Otherwise pick the general entry.

| Option | Means | Writes | Note |
|---|---|---|---|
| `handle` | Single D-handle. | `handle` |  |
| `handle.bar` | Straight or cambered cable bar. | `handle.bar` |  |
| `handle.v` | V-bar or close-grip handle. | `handle.v` |  |
| `handle.rope` | Triceps rope. | `handle.rope` |  |
| `strap.ankle` | Ankle cuff. | `strap.ankle` |  |
| `belt.dip` | Dip belt. | `belt.dip` |  |
| `belt.lift` | Lifting belt. | `belt.lift` |  |
| `strap.lift` | Lifting straps. | `strap.lift` |  |
| `strap.stretch` | Stretching strap: a strap, belt or loop band used to pull a limb in a stretch. | `strap.stretch` |  |
| `towel` | A towel used as a handle. | `towel` |  |
| `marker` | Cone, hurdle or floor marker. | `marker` |  |
| `board.press` | Board laid on the chest for partial presses. | `board.press` |  |
| `mat` | Floor mat. | `mat` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq.form.stn`: Which one is it?

- **Fills:** FXE f.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `stn`.
- **Usual:** no published default; the answer defines the value

Pick a child (superband, miniband) only when you know it. Otherwise pick the general entry.

| Option | Means | Writes | Note |
|---|---|---|---|
| `cable` | Cable column, crossover or functional trainer: a pulley set per exercise. | `cable` |  |
| `smith` | Smith machine: a bar on fixed rails. | `smith` |  |
| `landmine` | Landmine: one end of a barbell in a floor pivot (also a corner T-bar row). | `landmine` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq.mac.motion`: What does the machine guide?

- **Fills:** FXE m (mac).
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`.
- **Usual:** no published default; the answer defines the value

Answer for the machine as it is built, not the exercise done on it. A calf raise done on a leg press uses a leg press: answer "pushes away". A pivot that lines up with one joint is a single-joint machine.

| Option | Means | Writes | Note |
|---|---|---|---|
| `push` | *Multi-joint:* It pushes away: a multi-joint press or squat machine |  |  |
| `pull` | It pulls toward you: a multi-joint row, pulldown or deadlift machine |  |  |
| `assist` | It helps lift the body: an assisted pull-up or dip machine |  |  |
| `kn.flex` | *Pivots at one joint:* Knee bends (leg curl) | `kn.flex` |  |
| `kn.ext` | Knee straightens (leg extension) | `kn.ext` |  |
| `el.flex` | Elbow bends (curl machine) | `el.flex` |  |
| `el.ext` | Elbow straightens (triceps machine) | `el.ext` |  |
| `sh.hadd` | Arms sweep together in front (pec deck) | `sh.hadd` |  |
| `sh.habd` | Arms sweep apart (rear-delt machine) | `sh.habd` |  |
| `sh.abd` | Arms raise out to the sides (lateral raise machine) | `sh.abd` |  |
| `sh.ext` | Arms pull down from in front (pullover machine) | `sh.ext` |  |
| `sh.flex` | Arms raise forward | `sh.flex` |  |
| `sh.add` | Arms pull down from the sides | `sh.add` |  |
| `sh.ir` | Shoulder rotates in | `sh.ir` |  |
| `sh.er` | Shoulder rotates out | `sh.er` |  |
| `sc.elev` | Shrug | `sc.elev` |  |
| `hip.flex` | Hip bends (leg-raise or knee-raise machine) | `hip.flex` |  |
| `hip.ext` | Hip extends (glute kickback, hip thrust, reverse hyper) | `hip.ext` |  |
| `hip.abd` | Legs push apart (abductor) | `hip.abd` |  |
| `hip.add` | Legs squeeze together (adductor) | `hip.add` |  |
| `sp.flex` | Trunk curls (ab crunch machine) | `sp.flex` |  |
| `sp.ext` | Trunk extends (back extension machine) | `sp.ext` |  |
| `sp.rot` | Trunk twists (rotary torso) | `sp.rot` |  |
| `sp.lflex` | Trunk bends sideways | `sp.lflex` |  |
| `ank.pf` | Rise onto the toes (calf raise machine) | `ank.pf` |  |
| `ank.df` | Toes pull up (tibialis machine) | `ank.df` |  |
| `nk.flex` | Neck flexes | `nk.flex` |  |
| `nk.ext` | Neck extends | `nk.ext` |  |
| `nk.lflex` | Neck bends sideways | `nk.lflex` |  |
| `wr.flex` | Wrist curls | `wr.flex` |  |
| `wr.ext` | Wrist extends | `wr.ext` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq.mac.direction`: Which way does the handle, pad or plate move, relative to your trunk, while you work?

- **Fills:** FXE m (mac direction).
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.mac.motion` is `push` or `pull` or `assist`.
- **Usual:** no published default; the answer defines the value

Up is toward the head, down toward the feet, forward is away from the front of the trunk.

| Option | Means | Writes | Note |
|---|---|---|---|
| `up` | Toward the head: shoulder press, hack squat, belt squat, deadlift machine. | `up` |  |
| `down` | Toward the feet: pulldown, seated dip. | `down` |  |
| `fwd` | Away from the front of the trunk: chest press, leg press. | `fwd` |  |
| `back` | Toward the front of the trunk: row. | `back` |  |
| `fwdup` | Forward and up: incline press. | `fwdup` |  |
| `fwddown` | Forward and down: decline press. | `fwddown` |  |
| `backdown` | Back and down: high row. | `backdown` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq.mac.contact`: Where does the moving part of the machine meet your body?

- **Fills:** FXE l (mac).
- **Pick:** one or more (at most 2).
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`.
- **Usual:** The FXE default for that guided motion (FXE machine defaults), or the machine the movement word names.

Pick two only when both move the load (an air bike moves with the hands and the feet).

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual place for this motion | the default | Alone. Only when the rules give a default contact for the guided motion of the equipment. |
| `hand` | Handles or a bar in the hands. | `hand` |  |
| `foot` | A foot plate or pedals. | `foot` |  |
| `ankle` | A pad on the lower leg. | `ankle` |  |
| `thigh` | A pad on the thigh. | `thigh` |  |
| `knee` | A pad or platform at the knees. | `knee` |  |
| `arm` | A pad on the upper arm or elbow. | `arm` |  |
| `chest` | A pad on the chest. | `chest` |  |
| `back` | A pad on the back. | `back` |  |
| `shoulder` | Pads on the shoulders. | `shoulder` |  |
| `hip` | A pad or belt at the hips. | `hip` |  |
| `head` | A pad on the head. | `head` |  |
| `seat` | A moving seat. | `seat` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq.mac.posture`: What position does the machine put the user in?

- **Fills:** FXE s (mac).
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`.
- **Usual:** The FXE default for that guided motion (FXE machine defaults).

Every leg press is "recline"; hack, pendulum and belt squats are "stand"; a dedicated row machine is "seat.chest".

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual position for this motion | the default | Alone. |
| `seat` | Seated. | `seat` |  |
| `seat.chest` | Seated, chest against a pad. | `seat.chest` |  |
| `stand` | Standing. | `stand` |  |
| `stand.chest` | Standing or bent over, trunk on a pad. | `stand.chest` |  |
| `prone` | Lying face down, flat or inclined. | `prone` |  |
| `supine` | Lying face up. | `supine` |  |
| `recline` | Lying back on an inclined back pad (leg press). | `recline` |  |
| `kneel` | Kneeling. | `kneel` |  |
| `hang` | Held up by the hands or forearms. | `hang` |  |
| `side` | Side-lying. | `side` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq.erg.type`: Which cardio machine?

- **Fills:** FXE k:erg layers.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `erg`.
- **Usual:** no published default; the answer defines the value

If you only know it is a stationary bike or a stair machine, pick the "not known" entry.

| Option | Means | Writes | Note |
|---|---|---|---|
| `treadmill` | Treadmill | `treadmill` |  |
| `stepmill` | Stepmill (revolving stairs) | `stepmill` |  |
| `stepper` | Stair stepper (pedals) | `stepper` |  |
| `stair` | Stair machine, stepper or stepmill not known | `stair` |  |
| `bike-upright` | Upright or spin bike | `bike-upright` |  |
| `bike-recumbent` | Recumbent bike | `bike-recumbent` |  |
| `bike` | Stationary bike, upright or recumbent not known | `bike` |  |
| `air-bike` | Air bike (moving arms) | `air-bike` |  |
| `elliptical` | Elliptical | `elliptical` |  |
| `rower` | Rower | `rower` |  |
| `ski` | Ski erg | `ski` |  |
| `ube` | Upper-body ergometer (hand cranks, seated) | `ube` |  |
| `vertical-climber` | Vertical climber | `vertical-climber` |  |
| `ladder-climber` | Ladder climber | `ladder-climber` |  |
| `unknown` | A cardio machine of a type I don't know | `?` | Alone. |

#### `eq.details`: Do you want to record how it is built (drive, track, angle, design)?

- **Fills:** FXE extended layers.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `imp` or `sup` or `stn` or `mac` or `erg`.
- **Usual:** No build details.

These details go only in the equipment registry record. Exercise rows never carry them.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | No (the usual way) | the default | Alone. |
| `yes` | Yes |  |  |

#### `eq.drive`: What resists the movement?

- **Fills:** FXE r.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.details` is `yes`; and `eq.kind` is `imp` or `stn` or `mac` or `erg`.
- **Usual:** Not stated.

Leave it as usual if you are not sure. A form that implies its drive (a dumbbell is free weight) never needs it.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Not stated (the usual way) | the default | Alone. |
| `grav` | Free weight under gravity. | `grav` |  |
| `stack` | Selectorised weight stack. | `stack` |  |
| `plate` | Plate-loaded. | `plate` |  |
| `elastic` | Elastic. | `elastic` |  |
| `air` | Air fan. | `air` |  |
| `mag` | Magnetic brake. | `mag` |  |
| `water` | Water tank. | `water` |  |
| `motor` | Motor. | `motor` |  |
| `friction` | Friction. | `friction` |  |
| `hydraulic` | Hydraulic. | `hydraulic` |  |
| `flywheel` | Flywheel (isoinertial). | `flywheel` |  |
| `none` | No resistance of its own. | `none` |  |

#### `eq.constraint`: How is the moving part guided?

- **Fills:** FXE c (mac, stn).
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.details` is `yes`; and `eq.kind` is `stn` or `mac`.
- **Usual:** Not stated.

"Lever" or "leverage" in a machine name means a lever on one pivot. "Sled" means a straight track.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Not stated (the usual way) | the default | Alone. |
| `line` | A straight track (sled, rails). | `line` |  |
| `arc` | A lever on one pivot. | `arc` |  |
| `link` | A linkage of several pivots. | `link` |  |
| `cable` | A cable over pulleys. | `cable` |  |
| `pivot` | One end in a floor pivot. | `pivot` |  |

#### `eq.compliance`: Does it move under the body?

- **Fills:** FXE c (imp, sup).
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.details` is `yes`; and `eq.kind` is `imp` or `sup`.
- **Usual:** Not stated.

A stability ball tilts, an ab wheel rolls. A form that implies it never needs it.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Not stated (the usual way) | the default | Alone. |
| `tilt` | Tilts under the body. | `tilt` |  |
| `roll` | Rolls. | `roll` |  |
| `slide` | Slides. | `slide` |  |
| `swing` | Hangs and swings. | `swing` |  |

#### `eq.angle`: At what angle is the track or lever set?

- **Fills:** FXE g.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.details` is `yes`; and `eq.kind` is `mac`.
- **Usual:** Not stated.

Only fixed geometry: a 45° leg press is inclined.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Not stated (the usual way) | the default | Alone. |
| `incl` | Inclined (45° leg press). | `incl` |  |
| `horiz` | Horizontal. | `horiz` |  |
| `vert` | Vertical. | `vert` |  |

#### `eq.attrs`: Which design features does it have?

- **Fills:** FXE a.
- **Pick:** one or more.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.details` is `yes`; and `eq.kind` is `stn` or `mac`.
- **Usual:** None stated.

Pick every one that applies.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | None stated (the usual way) | the default | Alone. |
| `iso` | Independent arms (iso-lateral). | `iso` |  |
| `conv` | Converging path. | `conv` |  |
| `cb` | Counterbalanced (Smith). | `cb` |  |
| `dual` | Two stacks. | `dual` |  |

#### `eq.more`: Can the machine be set up as a second machine (multi-hip, pec deck with rear-delt arms, pulldown with low row)?

- **Fills:** FXE combination (";").
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`.
- **Usual:** No.

Answer the machine questions once more for the second setup.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | No (the usual way) | the default | Alone. |
| `yes` | Yes |  |  |

#### `eq2.mac.motion`: What does the machine guide?

- **Fills:** FXE m (mac).
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.more` is `yes`.
- **Usual:** no published default; the answer defines the value

Answer for the machine as it is built, not the exercise done on it. A calf raise done on a leg press uses a leg press: answer "pushes away". A pivot that lines up with one joint is a single-joint machine.

| Option | Means | Writes | Note |
|---|---|---|---|
| `push` | *Multi-joint:* It pushes away: a multi-joint press or squat machine |  |  |
| `pull` | It pulls toward you: a multi-joint row, pulldown or deadlift machine |  |  |
| `assist` | It helps lift the body: an assisted pull-up or dip machine |  |  |
| `kn.flex` | *Pivots at one joint:* Knee bends (leg curl) | `kn.flex` |  |
| `kn.ext` | Knee straightens (leg extension) | `kn.ext` |  |
| `el.flex` | Elbow bends (curl machine) | `el.flex` |  |
| `el.ext` | Elbow straightens (triceps machine) | `el.ext` |  |
| `sh.hadd` | Arms sweep together in front (pec deck) | `sh.hadd` |  |
| `sh.habd` | Arms sweep apart (rear-delt machine) | `sh.habd` |  |
| `sh.abd` | Arms raise out to the sides (lateral raise machine) | `sh.abd` |  |
| `sh.ext` | Arms pull down from in front (pullover machine) | `sh.ext` |  |
| `sh.flex` | Arms raise forward | `sh.flex` |  |
| `sh.add` | Arms pull down from the sides | `sh.add` |  |
| `sh.ir` | Shoulder rotates in | `sh.ir` |  |
| `sh.er` | Shoulder rotates out | `sh.er` |  |
| `sc.elev` | Shrug | `sc.elev` |  |
| `hip.flex` | Hip bends (leg-raise or knee-raise machine) | `hip.flex` |  |
| `hip.ext` | Hip extends (glute kickback, hip thrust, reverse hyper) | `hip.ext` |  |
| `hip.abd` | Legs push apart (abductor) | `hip.abd` |  |
| `hip.add` | Legs squeeze together (adductor) | `hip.add` |  |
| `sp.flex` | Trunk curls (ab crunch machine) | `sp.flex` |  |
| `sp.ext` | Trunk extends (back extension machine) | `sp.ext` |  |
| `sp.rot` | Trunk twists (rotary torso) | `sp.rot` |  |
| `sp.lflex` | Trunk bends sideways | `sp.lflex` |  |
| `ank.pf` | Rise onto the toes (calf raise machine) | `ank.pf` |  |
| `ank.df` | Toes pull up (tibialis machine) | `ank.df` |  |
| `nk.flex` | Neck flexes | `nk.flex` |  |
| `nk.ext` | Neck extends | `nk.ext` |  |
| `nk.lflex` | Neck bends sideways | `nk.lflex` |  |
| `wr.flex` | Wrist curls | `wr.flex` |  |
| `wr.ext` | Wrist extends | `wr.ext` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq2.mac.direction`: Which way does the handle, pad or plate move, relative to your trunk, while you work?

- **Fills:** FXE m (mac direction).
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.more` is `yes`; and `eq2.mac.motion` is `push` or `pull` or `assist`.
- **Usual:** no published default; the answer defines the value

Up is toward the head, down toward the feet, forward is away from the front of the trunk.

| Option | Means | Writes | Note |
|---|---|---|---|
| `up` | Toward the head: shoulder press, hack squat, belt squat, deadlift machine. | `up` |  |
| `down` | Toward the feet: pulldown, seated dip. | `down` |  |
| `fwd` | Away from the front of the trunk: chest press, leg press. | `fwd` |  |
| `back` | Toward the front of the trunk: row. | `back` |  |
| `fwdup` | Forward and up: incline press. | `fwdup` |  |
| `fwddown` | Forward and down: decline press. | `fwddown` |  |
| `backdown` | Back and down: high row. | `backdown` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq2.mac.contact`: Where does the moving part of the machine meet your body?

- **Fills:** FXE l (mac).
- **Pick:** one or more (at most 2).
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.more` is `yes`.
- **Usual:** The FXE default for that guided motion (FXE machine defaults), or the machine the movement word names.

Pick two only when both move the load (an air bike moves with the hands and the feet).

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual place for this motion | the default | Alone. Only when the rules give a default contact for the guided motion of the second setup. |
| `hand` | Handles or a bar in the hands. | `hand` |  |
| `foot` | A foot plate or pedals. | `foot` |  |
| `ankle` | A pad on the lower leg. | `ankle` |  |
| `thigh` | A pad on the thigh. | `thigh` |  |
| `knee` | A pad or platform at the knees. | `knee` |  |
| `arm` | A pad on the upper arm or elbow. | `arm` |  |
| `chest` | A pad on the chest. | `chest` |  |
| `back` | A pad on the back. | `back` |  |
| `shoulder` | Pads on the shoulders. | `shoulder` |  |
| `hip` | A pad or belt at the hips. | `hip` |  |
| `head` | A pad on the head. | `head` |  |
| `seat` | A moving seat. | `seat` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq2.mac.posture`: What position does the machine put the user in?

- **Fills:** FXE s (mac).
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.more` is `yes`.
- **Usual:** The FXE default for that guided motion (FXE machine defaults).

Every leg press is "recline"; hack, pendulum and belt squats are "stand"; a dedicated row machine is "seat.chest".

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | The usual position for this motion | the default | Alone. |
| `seat` | Seated. | `seat` |  |
| `seat.chest` | Seated, chest against a pad. | `seat.chest` |  |
| `stand` | Standing. | `stand` |  |
| `stand.chest` | Standing or bent over, trunk on a pad. | `stand.chest` |  |
| `prone` | Lying face down, flat or inclined. | `prone` |  |
| `supine` | Lying face up. | `supine` |  |
| `recline` | Lying back on an inclined back pad (leg press). | `recline` |  |
| `kneel` | Kneeling. | `kneel` |  |
| `hang` | Held up by the hands or forearms. | `hang` |  |
| `side` | Side-lying. | `side` |  |
| `unknown` | I don't know | `?` | Alone. |

#### `eq2.details`: Do you want to record how it is built (drive, track, angle, design)?

- **Fills:** FXE extended layers.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.more` is `yes`; and `eq.kind` is `imp` or `sup` or `stn` or `mac` or `erg`.
- **Usual:** No build details.

These details go only in the equipment registry record. Exercise rows never carry them.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | No (the usual way) | the default | Alone. |
| `yes` | Yes |  |  |

#### `eq2.drive`: What resists the movement?

- **Fills:** FXE r.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.more` is `yes`; and `eq2.details` is `yes`; and `eq.kind` is `imp` or `stn` or `mac` or `erg`.
- **Usual:** Not stated.

Leave it as usual if you are not sure. A form that implies its drive (a dumbbell is free weight) never needs it.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Not stated (the usual way) | the default | Alone. |
| `grav` | Free weight under gravity. | `grav` |  |
| `stack` | Selectorised weight stack. | `stack` |  |
| `plate` | Plate-loaded. | `plate` |  |
| `elastic` | Elastic. | `elastic` |  |
| `air` | Air fan. | `air` |  |
| `mag` | Magnetic brake. | `mag` |  |
| `water` | Water tank. | `water` |  |
| `motor` | Motor. | `motor` |  |
| `friction` | Friction. | `friction` |  |
| `hydraulic` | Hydraulic. | `hydraulic` |  |
| `flywheel` | Flywheel (isoinertial). | `flywheel` |  |
| `none` | No resistance of its own. | `none` |  |

#### `eq2.constraint`: How is the moving part guided?

- **Fills:** FXE c (mac, stn).
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.more` is `yes`; and `eq2.details` is `yes`; and `eq.kind` is `stn` or `mac`.
- **Usual:** Not stated.

"Lever" or "leverage" in a machine name means a lever on one pivot. "Sled" means a straight track.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Not stated (the usual way) | the default | Alone. |
| `line` | A straight track (sled, rails). | `line` |  |
| `arc` | A lever on one pivot. | `arc` |  |
| `link` | A linkage of several pivots. | `link` |  |
| `cable` | A cable over pulleys. | `cable` |  |
| `pivot` | One end in a floor pivot. | `pivot` |  |

#### `eq2.compliance`: Does it move under the body?

- **Fills:** FXE c (imp, sup).
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.more` is `yes`; and `eq2.details` is `yes`; and `eq.kind` is `imp` or `sup`.
- **Usual:** Not stated.

A stability ball tilts, an ab wheel rolls. A form that implies it never needs it.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Not stated (the usual way) | the default | Alone. |
| `tilt` | Tilts under the body. | `tilt` |  |
| `roll` | Rolls. | `roll` |  |
| `slide` | Slides. | `slide` |  |
| `swing` | Hangs and swings. | `swing` |  |

#### `eq2.angle`: At what angle is the track or lever set?

- **Fills:** FXE g.
- **Pick:** one.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.more` is `yes`; and `eq2.details` is `yes`; and `eq.kind` is `mac`.
- **Usual:** Not stated.

Only fixed geometry: a 45° leg press is inclined.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | Not stated (the usual way) | the default | Alone. |
| `incl` | Inclined (45° leg press). | `incl` |  |
| `horiz` | Horizontal. | `horiz` |  |
| `vert` | Vertical. | `vert` |  |

#### `eq2.attrs`: Which design features does it have?

- **Fills:** FXE a.
- **Pick:** one or more.
- **Asked when:** the subject is a piece of equipment on its own; and `eq.kind` is `mac`; and `eq.more` is `yes`; and `eq2.details` is `yes`; and `eq.kind` is `stn` or `mac`.
- **Usual:** None stated.

Pick every one that applies.

| Option | Means | Writes | Note |
|---|---|---|---|
| `usual` | None stated (the usual way) | the default | Alone. |
| `iso` | Independent arms (iso-lateral). | `iso` |  |
| `conv` | Converging path. | `conv` |  |
| `cb` | Counterbalanced (Smith). | `cb` |  |
| `dual` | Two stacks. | `dual` |  |
<!-- /fds:generated -->
