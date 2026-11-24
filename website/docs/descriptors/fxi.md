---
title: 'FXI: Exercise Descriptor'
sidebar_label: 'FXI (exercises)'
description: 'Draft FXI syntax, defaults, canonical form, layer rules and every code'
sidebar_position: 2
---

# FXI: Exercise Descriptor

:::caution Draft / experimental
Not normative until the RFC that adopts the structural descriptors is accepted: RFC (pending). See [the overview](./overview.md).
:::

An FXI describes the structure of one exercise: which joints move and how, the body position, what it rests on, what loads it, and the handful of choices that make one variant a different exercise from another. This page defines the string. [The question flow](./question-flow.md) is the way to build one without writing notation.

Every code an FXI may contain is listed on this page. The tables are generated from [`specification/registries/descriptors/fxi.registry.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/registries/descriptors/fxi.registry.json), which is the source; the prose around them is the rule for using them.

## What makes two exercises the same

Two exercises are the same exercise when they share every one of these:

| Dimension | Layer |
|---|---|
| Which joints move, in which order, ballistic or not, and which end of the body moves | `m`, `k` |
| Body position at the start: standing, seated, kneeling, lying, and which side faces down | `o` |
| What the body rests on, beyond the floor its position implies, and where it touches | `s` |
| Each implement, how many, and where it is held; assistance | `l` |
| Which limbs work and in what order | `x` |
| Hand orientation, grip width class and stance class | `g` |
| Range class and start position | `r` |
| Stepping, split stance or travel | `f` |
| Moving, cyclic, held, static stretch or dynamic stretch | `m` prefixes |
| Held posture of the limbs that do not work | `h` |
| Line of pull, or a load passing behind the head | `p` |
| An accessory that helps without loading (extended) | `a` |

**A held joint that changes the target is part of the exercise.** A calf stretch with the knee straight and one with the knee bent stretch different muscles; the knee goes in the motion.

**Prescription never changes the exercise** and never goes in an FXI: load amount, tempo, pauses, sets, reps, rest, pace, duration, distance, band tension, machine settings, box height, and small angle changes within one class (a 30° and a 45° incline bench are the same orientation).

**One side at a time is not alternating.** Doing every rep on one side and then switching (`x:u`) is a different exercise from taking turns rep by rep (`x:a`).

**A default is a value. Only `?` means unstated.** Every layer except `m`, `o` and `l` has a published default. A plain squat has its arms free, both legs working together and full range: those defaults are values, and they contradict every other value. A squat with the hands behind the head (`h:hands.head`) contradicts a plain squat. When nothing tells you the value, write `?`; `?` never contradicts anything.

## Syntax

### Form

```text
FXI=1.0S/m:<motion>/o:<orientation>/k:<end>/f:<footwork>/s:<support>/l:<load>/x:<symmetry>/g:<grip>/r:<range>/h:<held>/p:<line>
FXI=1.0N/…/p:<line>/a:<accessory>
```

- `1` is the major version and `0` the syntax revision; both are always written. A string that starts `FXI=1/` is a pre-release draft and is invalid.
- The letter after the revision is the flag. `S`: every written layer is standard. `N`: the string also carries an extended layer. The only extended layer is the accessory `a`.
- `m`, `o` and `l` are always written. Every other layer is written only when it differs from its default.
- The rules revision (see [versioning](./compare-and-match.md#versioning)) is not written in the string. A string is read under the latest rules revision of its major, which is safe because a rules revision may only refine.

<!-- fds:generated fxi#layers -->
| Layer | Kind | Read from | Meaning |
|---|---|---|---|
| `m` | standard | body layer | Motion: the joint actions of each phase, in rep order. Required. |
| `o` | standard | body layer | Orientation: the body to gravity at the start of the rep. Always written; `?` if unknown. |
| `k` | standard | body layer | Moving end, for trunk work on the floor or a bench. Default: the limb end moves. |
| `f` | standard | body layer | Footwork: stepping, split stance or travel. Default: feet planted level. |
| `s` | standard | body layer | Support: surfaces beyond what the orientation implies, and the body points on them. Default: the floor as the orientation implies. |
| `l` | standard | body layer | Load: each implement and where it is held, or `bw`. Always written; `?` if unknown. |
| `x` | standard | name layer | Symmetry: which limbs work and in what order. Default: `b`, both together. |
| `g` | standard | name layer | Grip and stance: hand orientation, width, stance. Default: the usual grip, medium width, medium stance. |
| `r` | standard | name layer | Range and start: partial or deep range, deficit, start position. Default: full range from the usual start. |
| `h` | standard | name layer | Held posture of limbs that do not work. Default: no held posture. |
| `p` | standard | name layer | Line of pull or path past the body. Default: the line the movement word implies. |
| `a` | extended | body layer | Accessory: a strap or a partner that helps the exercise without loading it. Extended: compared only when both strings carry it. |
<!-- /fds:generated -->

A **body layer** describes what the body does and is read from everything known about the exercise. A **name layer** is a choice that catalogues routinely encode in the exercise's name; in import mode it is read from the name and record fields only (see [the source rule](#the-source-rule)).

### Symbols

| Symbol | Where | Meaning |
|---|---|---|
| `/` | between layers | Separates layers. |
| `:` | every layer | Layer letter, then value. |
| `+` | inside a value | Joins items: actions in one part of a phase, support items, implements, grip elements, range codes, symmetry items, held codes, lines. |
| `>` | `m`, `o`, `f`, `g` | A sequence in rep order: motion phases, start then end orientation, footwork changes, grip changes. |
| `\|` | `m` | Two parts of one phase at the same time. |
| `@` | `s`, `l`, `x` | The body points on a support; the hold point of an implement; the scope of a symmetry code. |
| `,` | `s` | Several body points on one support: `floor@feet,hands`. |
| `*n` | `l` | Implement count, `1` to `4`, only when it differs from the usual count. |
| `^ ~ = % &` | start of a motion part | The phase prefixes below. No prefix is a normal moving phase. |
| `-` | after a joint action | A short-range drive on purpose. |
| `?` | any value | Unknown: a whole layer (`o:?`), an implement (`?@chest`), a hold point (`kb@?`), a support (`?@feet`), a body point (`floor@feet,?`), a joint's direction (`sh.?`), a whole phase (`hip.ext>?`). |
| `*` | a whole layer | Generic on purpose: the exercise may be done either way ("seated or standing"). Not allowed for `m`. |

The open-ended `+?` ("and possibly more") is not allowed. Write the actions you know, or `?` for the whole phase.

### Defaults

| Layer | Left out, it means |
|---|---|
| `m` | Required; `m:?` when unknown. |
| `o` | Always written; `o:?` when unknown. |
| `k` | The limb end moves. |
| `f` | Feet planted level. |
| `s` | The floor, the way the orientation implies. A machine's own seat and pads are never written. |
| `l` | Always written; `l:?` when unknown. |
| `x` | `b`: both sides together, or the movement has no sides. |
| `g` | The usual hand orientation (`su` when every action is `el.flex`, `pr` otherwise), medium width, medium stance. |
| `r` | Full range from the movement's usual start. |
| `h` | No held posture: the non-working limbs do what the movement implies. |
| `p` | The usual line of pull, with the load passing in front of the body. |
| `a` | Extended: not stated, which is open. Compared only when both strings carry it. |

A default code may be written (`x:b`, `f:level`, `k:limbs`, `h:none`, `p:usual`, `g:w-m`); canonicalisation drops it.

### Canonical form

Every FXI has exactly one canonical spelling, and only the canonical spelling is exchanged. To canonicalise:

1. Write the header `FXI=1.0` and the flag (step 9).
2. Write the layers in the order `m o k f s l x g r h p a`, each once.
3. Drop every layer at its default: `k:limbs`, `f:level`, `x:b`, `h:none`, `p:usual`, `a:none`, and a support that is only `floor`.
4. Inside a value, sort the items joined by `+`, the parts joined by `|` and the body points joined by `,` in code-unit order, with `?` and `*` after every letter. Keep `>` sequences in rep order; in `o`, `f` and `g`, collapse a code repeated in a row (`standing>standing` is `standing`).
5. In `s`, drop the body points the start orientation implies (the orientation table lists them), a bare `floor`, and a bare `bench`, `box`, `chair` or `floor` under a seated body.
6. In `l`, drop `bw` when an implement is also written, and drop every count equal to the usual count ([counts](#load-l)): `l:db*1@hands/x:u` is `l:db@hands/x:u`.
7. In `x`, drop a scope the motion already implies (a lunge's `u@legs` is `u`), and drop `x` entirely for a motion that is only trunk or neck rotation or side bend.
8. In `g`, with one grip phase, drop the usual hand orientation, `w-m` and `st-m`, and drop `ne` with a trap bar, which forces it. With several phases, drop `w-m` and `st-m` from a phase unless that leaves it empty. Drop a stance unless the start is `standing`, `standing.bent` or `?`, or the feet push a machine foot plate (`mach@feet`).
9. Set the flag: `N` when `a` is written, else `S`.

Every implement carries a hold point (`@?` when unknown); a layer with no value, a layer written twice, an unknown code, two opposite actions in one part, two start codes, `partial` with `deep`, or two codes a table marks "never with" make the string invalid. A string that breaks a rule on this page is not an FXI. A checker reports every problem it finds rather than guessing.

## The source rule

**Owner mode.** The owner of an exercise answers what is true of it as they run it, for every layer, whether or not its name says so. A published default applies wherever the exercise is done the usual way.

**Import mode.** Reading another catalogue's row, without its owner, the sources are the description, the name (and alternate name), and the record fields.

- **Body layers** `m o k f s l` are read from the description, then the name, then the record fields, then the movement word's defaults, else `?`. The earlier source wins. Options ("arms at your sides or crossed") and coaching cues ("keep your chest up") set nothing.
- **Name layers** `x g r h p` are read only from the name, through the import lexicon, then the record fields, then the movement word's defaults, else the layer default. **The description never sets a name layer in import mode.**
- `k` is written only for the movement words listed under [moving end](#moving-end-k).
- **Body weight.** Write `l:bw` when the record or name says body weight, when the name names no implement and the movement word is a bodyweight word, or when only support equipment is named. Otherwise, when nothing names an implement, write `l:?`.

Reading name layers from the name alone is what makes two catalogues agree: a variant that matters is almost always in the name, because the name is how a catalogue tells its own variants apart. Import-mode strings are for candidate search only (see [the match protocol](./compare-and-match.md#match-protocol)).

The import lexicon, which maps name words to codes, is catalogue data in the same way movement words are, and is not part of this page.

## Layer rules

### Motion (`m`)

Write the joint actions of the working phase. For a moving exercise write the **concentric** direction: the way the joints move while the working muscles shorten against the load. Never write the lowering, the return, the landing or a pause.

**Which joints count.** A joint counts when the working muscles move it through a clear range (about 30° or more) as part of what the exercise trains. A joint held still on purpose never counts:

- the spine only when bending, extending, side-bending or twisting the trunk is the movement;
- the scapula only when the shoulder blade moves on its own (a shrug, a scapular push-up);
- the wrist only in wrist exercises, the neck only in neck exercises;
- the ankle only when the exercise rises onto the toes or pushes off the ground;
- the knee not when it holds a fixed bend (a Romanian deadlift, a hip thrust);
- the elbow not when it holds a fixed bend (a fly, a lateral raise);
- forearm rotation only when turning against resistance is the work; a palm turn during a curl or press is grip (`g`);
- shoulder rotation only in rotation exercises.

**Shoulder direction** is judged by the path of the hands relative to the trunk:

| The hands move | Code |
|---|---|
| Away from the chest, square to the trunk, or sweeping together in front at chest height | `sh.hadd` |
| Away from the chest toward the head end (incline press) | `sh.flex+sh.hadd` |
| Forward and up, or up past the head (front raise, overhead press) | `sh.flex` |
| Away from the chest toward the feet end (decline press) | `sh.ext+sh.hadd` |
| Down along the trunk toward the feet (dip, straight-arm press-down) | `sh.ext` |
| Toward the trunk from in front, elbows close (row) | `sh.ext` |
| Toward the trunk from in front, elbows wide at shoulder height (face pull) | `sh.habd` |
| Apart sideways at chest height, arms nearly straight (reverse fly) | `sh.habd` |
| Down from overhead in front of the face (chin-up; a pull-up or pulldown with an underhand, neutral or close grip) | `sh.ext` |
| Down from overhead out at the sides (a pull-up or pulldown with an overhand grip at medium or wide width) | `sh.add` |
| Up out to the side (lateral raise; upright row with `el.flex`) | `sh.abd` |

**Phases (`>`).** One phase per distinct movement, in rep order. For each pair of movements ask: does the second start before the first ends? Yes: one phase (a thruster, where the press starts while the body still rises). No: two phases (a squat, then a press). One joint may move in opposite directions in different phases, never in one part. A phase you cannot work out is `?`.

**Prefixes.** One per part, written before its actions:

<!-- fds:generated fxi#phasePrefixes -->
| Code | Meaning |
|---|---|
| (none) | Dynamic: the joints move through range; write the concentric direction. |
| `^` | Ballistic: the phase ends in flight (body leaves the ground) or release (implement leaves the hands). A phase after it happens in the air. |
| `~` | Cyclic: continuous cycles with no rep boundary; write the driving half of one cycle. |
| `=` | Isometric: a hold under effort for the whole set; write what the muscles push toward. `=0` is a hold with no direction (balance). |
| `%` | Static stretch: the directions the joints are taken to, held at end range. |
| `&` | Dynamic stretch: the same directions, taken to end range and released repeatedly (swings, pass-throughs). |
<!-- /fds:generated -->

"Explosive" or "fast" alone is not flight: `^` needs the body to leave the ground or the implement to leave the hands. An action done in the air is the next phase. Cyclic phases and Olympic lifts never take `^`. `~0` is rolling on a roller or ball with no joint direction; `=0` is a balance or pressure hold.

**Short drive (`-`).** After an action that moves through a short range on purpose: the dip-and-drive of a push press (`hip.ext-+kn.ext-`), the short stand-up after a power receive.

**Simultaneous parts (`|`).** Two parts at once in one phase: parts of different kinds (an isometric arm hold while the legs walk, `=sh.hadd|~hip.ext+kn.ext`; a held plank under a leg lift, `=sp.flex|hip.ext`), or two limbs taken in opposite directions in one stretch (`%hip.ext|%hip.flex`). A phase with several parts cannot hold a `?` part.

**Held joints in a stretch.** Write a held joint when it decides which muscle is stretched: the knee in a calf or hamstring stretch (`kn.ext` straight, `kn.flex` bent).

**Self-massage.** Rolling a body part on a roller or ball is `~0`; resting it still on one is `=0`. Write the roller in `s` with the point on it (`s:roller@thighs`), and no other contact.

**Circles.** Arm, hip or ankle circles and halos are `~<joint>.circ`. A joint in an unknown direction is `<joint>.?`.

<!-- fds:generated fxi#joints -->
| Code | Meaning | Notes |
|---|---|---|
| `nk` | Neck. | Takes `.circ`. |
| `sp` | Spine: the trunk, thoracic and lumbar together. | Takes `.circ`. |
| `sc` | Scapula: the shoulder blade on the rib cage. | Arm joint. |
| `sh` | Shoulder joint. | Arm joint. Takes `.circ`. |
| `el` | Elbow. | Arm joint. |
| `fa` | Forearm: the turn that rotates the palm. | Arm joint. |
| `wr` | Wrist. | Arm joint. Takes `.circ`. |
| `hip` | Hip. | Leg joint. Takes `.circ`. |
| `kn` | Knee. | Leg joint. |
| `ank` | Ankle and foot. | Leg joint. Takes `.circ`. |
<!-- /fds:generated -->

<!-- fds:generated fxi#jointActions -->
| Code | Meaning | Notes |
|---|---|---|
| `nk.flex` | Neck flexion: chin toward the chest. | Opposite of `nk.ext`. |
| `nk.ext` | Neck extension: head tips back. | Opposite of `nk.flex`. |
| `nk.lflex` | Neck side bend: ear toward the shoulder. |  |
| `nk.rot` | Neck rotation: turning the head. |  |
| `sp.flex` | Trunk flexion: ribs toward the pelvis, as in a crunch. | Opposite of `sp.ext`. |
| `sp.ext` | Trunk extension: straightening or arching the back from a bent position. | Opposite of `sp.flex`. |
| `sp.lflex` | Trunk side bend. |  |
| `sp.rot` | Trunk rotation: shoulders twist against the hips. |  |
| `sc.elev` | Scapular elevation: shrug up. | Opposite of `sc.dep`. |
| `sc.dep` | Scapular depression: shoulders pulled down. | Opposite of `sc.elev`. |
| `sc.pro` | Scapular protraction: shoulder blades spread around the ribs. | Opposite of `sc.ret`. |
| `sc.ret` | Scapular retraction: shoulder blades squeezed together. | Opposite of `sc.pro`. |
| `sh.flex` | Shoulder flexion: arm forward and up, as in a front raise or overhead press. | Opposite of `sh.ext`. |
| `sh.ext` | Shoulder extension: arm down and back from in front, as in a row or straight-arm pulldown. | Opposite of `sh.flex`. |
| `sh.abd` | Shoulder abduction: arm out to the side and up, as in a lateral raise. | Opposite of `sh.add`. |
| `sh.add` | Shoulder adduction: arm down to the side from out to the side, as in a wide pull-up. | Opposite of `sh.abd`. |
| `sh.hadd` | Horizontal adduction: arm across the front at chest height, as in a press or fly. | Opposite of `sh.habd`. |
| `sh.habd` | Horizontal abduction: arm back and out at chest height, as in a reverse fly. | Opposite of `sh.hadd`. |
| `sh.ir` | Shoulder internal rotation: forearm turns in toward the belly, elbow bent. | Opposite of `sh.er`. |
| `sh.er` | Shoulder external rotation: forearm turns out, elbow bent. | Opposite of `sh.ir`. |
| `el.flex` | Elbow flexion, as in a curl. | Opposite of `el.ext`. |
| `el.ext` | Elbow extension, as in a press or triceps extension. | Opposite of `el.flex`. |
| `fa.pron` | Forearm pronation: palm turns down. | Opposite of `fa.sup`. |
| `fa.sup` | Forearm supination: palm turns up. | Opposite of `fa.pron`. |
| `wr.flex` | Wrist flexion: palm toward the forearm. | Opposite of `wr.ext`. |
| `wr.ext` | Wrist extension: back of the hand toward the forearm. | Opposite of `wr.flex`. |
| `wr.rdev` | Wrist radial deviation: thumb side toward the forearm. | Opposite of `wr.udev`. |
| `wr.udev` | Wrist ulnar deviation: little-finger side toward the forearm. | Opposite of `wr.rdev`. |
| `hip.flex` | Hip flexion: thigh toward the trunk, or trunk toward the thigh. | Opposite of `hip.ext`. |
| `hip.ext` | Hip extension: thigh away from the trunk, as in standing up from a squat. | Opposite of `hip.flex`. |
| `hip.abd` | Hip abduction: leg out to the side. | Opposite of `hip.add`. |
| `hip.add` | Hip adduction: leg in toward the other leg. | Opposite of `hip.abd`. |
| `hip.ir` | Hip internal rotation: knee turns in. | Opposite of `hip.er`. |
| `hip.er` | Hip external rotation: knee turns out. | Opposite of `hip.ir`. |
| `kn.flex` | Knee flexion against resistance, as in a leg curl. | Opposite of `kn.ext`. |
| `kn.ext` | Knee extension, as in standing up from a squat. | Opposite of `kn.flex`. |
| `ank.df` | Ankle dorsiflexion: toes toward the shin. | Opposite of `ank.pf`. |
| `ank.pf` | Ankle plantar flexion: rising onto the toes, pushing off. | Opposite of `ank.df`. |
| `ank.inv` | Ankle inversion: sole turns in. | Opposite of `ank.ev`. |
| `ank.ev` | Ankle eversion: sole turns out. | Opposite of `ank.inv`. |
<!-- /fds:generated -->

### Orientation (`o`)

The body's orientation **at the start of the first written phase**. Trunk angles are measured from horizontal: flat within 15°, incline or decline 15–60°, more than 60° head-up is seated or standing.

- Hinged forward more than about 30° and **held** there for the set is `standing.bent`. A hinge in which the trunk moves (a deadlift, a swing) starts `standing`.
- On hands and knees, in a plank or a push-up, lying face down: `prone` and its incline buckets. Hips highest in an upside-down V: `prone.pike`.
- Sitting on the floor leaning back 30–60°: `supine.incline`.
- Held up by the hands, including propped on dip bars: `hanging`.
- On a machine, write the body's position: a seated leg extension is `seated`, a lying leg curl `prone`, a reclined leg press `supine.incline`.
- When the rep ends in a different orientation (getting up from the floor), write `start>end`. A rep that goes down and comes back ends where it started and writes only the start.
- `*` when the exercise is meant to be done either way; `?` when nothing says.

<!-- fds:generated fxi#orientations -->
| Code | Meaning | Notes |
|---|---|---|
| `standing` | On the feet, trunk within about 30° of vertical. | Implies `feet` on the support. |
| `standing.bent` | On the feet, trunk hinged forward more than about 30° and held there (bent-over row). | Implies `feet` on the support. |
| `seated` | Sitting, trunk more than 60° from horizontal. | Implies `seat` on the support. |
| `seated.bent` | Sitting, trunk hinged forward over the thighs and held there (seated bent-over raise). | Implies `seat` on the support. |
| `kneeling` | On both knees, trunk upright. On hands and knees is `prone`. | Implies `knees`, `shins` on the support. |
| `kneeling.half` | On one knee, the other foot forward. | Implies `knees`, `feet` on the support. |
| `supine` | Face up, trunk within 15° of horizontal. | Implies `back` on the support. |
| `supine.incline` | Face up, head higher than hips, trunk 15–60° from horizontal. | Implies `back` on the support. |
| `supine.decline` | Face up, head lower than hips, trunk 15–60° from horizontal. | Implies `back` on the support. |
| `prone` | Face down, trunk within 15° of horizontal: lying, plank, push-up, on hands and knees. | Implies `chest` on the support. |
| `prone.incline` | Face down, head higher than hips, 15–60° (hands raised). | Implies `chest` on the support. |
| `prone.decline` | Face down, head lower than hips, 15–60° (feet raised). | Implies `chest` on the support. |
| `prone.pike` | Face down, hips highest, hands and feet down, trunk more than 60° head-down (pike). | Implies `feet`, `hands` on the support. |
| `side-lying` | On one side: lying, or a side plank. | Implies no point. |
| `hanging` | Held up by the hands or arms, feet off the floor: hanging from a bar, propped on dip bars. | Implies `hands` on the support. |
| `inverted` | Upside down, trunk within 30° of vertical, head lowest: handstand, headstand. | Implies `hands` on the support. |
<!-- /fds:generated -->

### Moving end (`k`)

`k:trunk` when the trunk moves and the legs stay put: a sit-up, a crunch (not a reverse crunch), a back extension, a bridge or hip thrust, a glute-ham raise, a Nordic curl, a cable or kneeling crunch, an ab crunch machine. `k:both` when both ends move toward each other: a V-up, a jackknife, a tuck-up. In import mode, write `k` only for those words.

<!-- fds:generated fxi#movingEnds -->
| Code | Meaning | Notes |
|---|---|---|
| `limbs` | The limb end moves (default, never written). | Default, never written. |
| `trunk` | The trunk end moves; the legs stay put: sit-up, crunch, bridge, hip thrust, back extension, glute-ham raise, Nordic curl. |  |
| `both` | Both ends move toward each other: V-up, jackknife, tuck-up. |  |
<!-- /fds:generated -->

### Footwork (`f`)

A step returns each rep; travel keeps going. A lunge with no direction steps forward; a reverse lunge steps back; a lateral lunge steps to the side; a curtsy lunge steps back and across. A split squat or a lunge in place is `split`; a walking lunge, a carry, a sled push, a crawl and a broad jump travel forward. A split jerk is `level>split`. "In place" and work on a cardio machine leave `f` out.

<!-- fds:generated fxi#footwork -->
| Code | Meaning | Notes |
|---|---|---|
| `level` | Feet planted level (default). Written only inside a sequence. | Default, never written. |
| `split` | Feet planted in a split stance, one in front of the other. |  |
| `step.fwd` | Each rep steps forward and returns. |  |
| `step.back` | Each rep steps back and returns. |  |
| `step.side` | Each rep steps to the side and returns. |  |
| `step.cross` | Each rep steps back and across behind the other leg (curtsy) and returns. |  |
| `travel.fwd` | The body travels forward and does not return each rep. |  |
| `travel.back` | Travels backward. |  |
| `travel.side` | Travels sideways. |  |
<!-- /fds:generated -->

### Support (`s`)

Write each surface that bears the body's weight, or that a limb is braced on, beyond what the orientation implies. Use any equipment token except `bw`, then `@` and the body points on it, leaving out the points the start orientation implies.

Never write the floor alone; the seat of a seated exercise (unless it is unstable: a ball, a dome, a board, a roller); a machine's own seat, pads or handles; a mat; equipment that only loads the body; or a hand support used only for balance. A hand that holds a rack or post to hold the body up does bear weight: `s:rack@hands`.

When the trunk rests on nothing (a plank, a push-up), list every point that bears weight: `s:floor@feet,hands`. Different surfaces under different points are separate items: `s:ball@feet+floor@hands`. Do not write `floor@feet` beside another support when the body is seated, or lies face up on a support that bears its trunk; keep it for a face-up body hanging from its hands (an inverted row, `s:bar@hands+floor@feet`). A box, step, bench or platform under raised hands or feet is `box` unless the surface is named. Sitting down to a box is `s:box@seat`. A surface stepped or jumped onto counts (`s:box`).

<!-- fds:generated fxi#bodyPoints -->
| Code | Meaning |
|---|---|
| `hands` | The hands, or one hand. |
| `forearms` | The forearms, elbows bent (elbow plank). |
| `elbows` | The crook of the elbows (Zercher). |
| `arms` | The upper arms (preacher pad). |
| `shoulders` | On the front of the shoulders and collarbones (front rack), or on one shoulder. |
| `chest` | Against the chest (goblet, bear hug). |
| `back` | Across the upper back (back squat). |
| `hips` | Across the front of the hips (hip thrust). |
| `waist` | Hung from a belt at the waist. |
| `seat` | The buttocks (sitting down onto a box or bench). |
| `thighs` | On or around the thighs. |
| `knees` | At or around the knees. |
| `shins` | The shins. |
| `calves` | The calves (the back of the lower leg). |
| `ankles` | At or just above the ankles (strap, cuff, machine pad on the lower leg). |
| `feet` | The feet, or one foot. |
| `head` | The head or forehead. |
<!-- /fds:generated -->

### Load (`l`)

List every implement that loads the working muscles, each with `@` and where it is held.

- `bw` means no implement. It stands alone and takes no hold point; a weighted dip is `l:plate@waist`, not `bw+plate`.
- **Machines and stations come from the FXE.** Decide the equipment first ([FXE](./fxe.md)). A dedicated machine is written `mach`, a cardio machine `erg` (or its cycle child, `erg.row`), a cable column `cable`, a Smith machine `smith`, a landmine `landmine`.
- A cardio machine is always in `l`, held where its moving part meets the body, never in `s`.
- A band is `band`, held where it presses or pulls on the body; where it is anchored is not written. Its type goes only in the FXE. In work that moves only the legs, a band is `@feet` unless stated otherwise.
- Assistance is held `@assist`. An assisted pull-up or dip machine is always `mach@assist`; the FXE records where its pad meets the body.

**Hold points.** In the hands, at the sides, at arm's length or swung: `@hands`, and so are dumbbells held at shoulder height and a bar pressed without resting on the shoulders. Straight-armed overhead for the whole rep: `@overhead`. Resting on the front of the shoulders, or a landmine end held at the shoulder: `@shoulders`. Hugged to the chest: `@chest`. Across the upper back, including a bar behind the neck: `@back`. Across the hips: `@hips`. From a belt: `@waist`. In the crook of the elbows: `@elbows`. A weight on the lap in a seated calf raise: `@thighs`.

<!-- fds:generated fxi#holdOnlyPoints -->
| Code | Meaning |
|---|---|
| `overhead` | Held in the hands with the arms straight overhead for the whole rep. |
| `assist` | The implement takes part of the body weight (assist band, assisted machine). |
<!-- /fds:generated -->

**Counts.** Leave the count out when it is the usual one; canonicalisation drops a written count equal to it. A one-hand implement (`db`, `kb`, `plate`, `club`) is one per working hand: one when the arms work one at a time (`x` is `u@arms`, or `u` with a motion of arm joints only), two otherwise. So `db@hands` is one dumbbell in a one-arm row (`x:u`) and two in a squat, an alternating curl (`x:a`) or a split squat (`x:u`, the legs). Every other implement is one, and so is any implement held at a trunk point (`chest`, `back`, `hips`, `waist`). Write `*n` only when the count differs: one kettlebell in both hands is `kb*1@hands`. An implement of unknown kind (`?`) has no usual count, so a count written on it stays.

**Unknowns.** An implement of unknown kind: `?@chest`. A hold point unknown: `kb@?`. An implement of unknown kind at an unknown point ("weighted", nothing more): `?@?`. Nothing known, not even whether there is an implement: `l:?`.

**Equipment tokens.** Every token is an alias of one standard FXE. A child token refines its parent: `dome` covers `dome.up` and `dome.down`; `erg` covers every `erg.<cycle>`.

<!-- fds:generated fxi#equipmentTokens -->
| Token | In | Standard FXE it stands for | Meaning |
|---|---|---|---|
| `bw` | `l` | `FXE=1.0S/k:none` | No implement: body weight only. Stands alone, no hold point. |
| `bb` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.straight` | Barbell. |
| `ez` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.ez` | EZ curl bar. |
| `tb` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.trap` | Trap or hex bar. |
| `axle` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.axle` | Axle bar. |
| `camber` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.camber` | Cambered bar. |
| `db` | `l`, `s` | `FXE=1.0S/k:imp/f:bell.dumb` | Dumbbell. |
| `kb` | `l`, `s` | `FXE=1.0S/k:imp/f:bell.kettle` | Kettlebell. |
| `circus` | `l`, `s` | `FXE=1.0S/k:imp/f:bell.circus` | Circus dumbbell. |
| `mb` | `l`, `s` | `FXE=1.0S/k:imp/f:ball.med` | Medicine ball. |
| `slam` | `l`, `s` | `FXE=1.0S/k:imp/f:ball.slam` | Slam ball. |
| `bag` | `l`, `s` | `FXE=1.0S/k:imp/f:bag.sand` | Sandbag. |
| `hbag` | `l`, `s` | `FXE=1.0S/k:imp/f:bag.heavy` | Heavy bag. |
| `plate` | `l`, `s` | `FXE=1.0S/k:imp/f:plate` | Weight plate. |
| `chain` | `l`, `s` | `FXE=1.0S/k:imp/f:chain` | Chain. |
| `rope` | `l`, `s` | `FXE=1.0S/k:imp/f:rope.battle` | Battle rope. |
| `jrope` | `l`, `s` | `FXE=1.0S/k:imp/f:rope.jump` | Jump rope. |
| `band` | `l`, `s` | `FXE=1.0S/k:imp/f:band` | Any resistance band, tube, superband or miniband. |
| `sled` | `l`, `s` | `FXE=1.0S/k:imp/f:sled` | Ground sled or prowler. |
| `tire` | `l`, `s` | `FXE=1.0S/k:imp/f:tire` | Tyre. |
| `hammer` | `l`, `s` | `FXE=1.0S/k:imp/f:hammer` | Sledgehammer. |
| `stone` | `l`, `s` | `FXE=1.0S/k:imp/f:stone` | Atlas stone. |
| `log` | `l`, `s` | `FXE=1.0S/k:imp/f:log` | Log. |
| `keg` | `l`, `s` | `FXE=1.0S/k:imp/f:keg` | Keg. |
| `yoke` | `l`, `s` | `FXE=1.0S/k:imp/f:yoke` | Yoke. |
| `frame` | `l`, `s` | `FXE=1.0S/k:imp/f:frame.carry` | Farmer handles or carry frame (rickshaw). |
| `car` | `l`, `s` | `FXE=1.0S/k:imp/f:car` | Car. |
| `vest` | `l`, `s` | `FXE=1.0S/k:imp/f:wear.vest` | Weight vest. |
| `ankwt` | `l`, `s` | `FXE=1.0S/k:imp/f:wear.ankle` | Ankle weight. |
| `club` | `l`, `s` | `FXE=1.0S/k:imp/f:club` | Club or mace. |
| `dowel` | `l`, `s` | `FXE=1.0S/k:imp/f:stick` | Dowel, broomstick or PVC pipe: sets the hands, adds no load. |
| `wheel` | `l`, `s` | `FXE=1.0S/k:imp/f:wheel` | Ab wheel. |
| `wroller` | `l`, `s` | `FXE=1.0S/k:imp/f:roller.wrist` | Wrist roller. |
| `harness` | `l`, `s` | `FXE=1.0S/k:imp/f:harness.head` | Head harness. |
| `cable` | `l`, `s` | `FXE=1.0S/k:stn/f:cable` | Cable column or crossover station (not a lat pulldown or seated row machine). |
| `smith` | `l`, `s` | `FXE=1.0S/k:stn/f:smith` | Smith machine. |
| `landmine` | `l`, `s` | `FXE=1.0S/k:stn/f:landmine` | Landmine, or a barbell end wedged in a corner. |
| `erg.gait` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:gait` | Cardio machine for walking or running on a belt (treadmill). Child of `erg`. |
| `erg.step` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:step` | Cardio machine for stepping (stair stepper, stepmill). Child of `erg`. |
| `erg.cycle` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:cycle` | Cardio machine for pedalling or hand cranking (bike, air bike, arm crank). Child of `erg`. |
| `erg.row` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:row` | Rowing machine. Child of `erg`. |
| `erg.pole` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:pole` | Ski erg. Child of `erg`. |
| `erg.glide` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:glide` | Elliptical. Child of `erg`. |
| `erg.climb` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:climb` | Climbing machine (vertical or ladder climber). Child of `erg`. |
| `mach` | `l`, `s` | `FXE=1.0S/k:mac/l:?/s:?/m:?` | Any dedicated strength machine (including lat pulldown and seated cable row machines). The row’s FXE names which. |
| `erg` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?` | Any cardio machine: treadmill, bike, rower, elliptical, stair machine, ski erg. The row’s FXE names which. |
| `floor` | `s` | `FXE=1.0S/k:sup/f:floor` | The floor or a mat. |
| `wall` | `s` | `FXE=1.0S/k:sup/f:wall` | A wall. |
| `bench` | `s` | `FXE=1.0S/k:sup/f:bench` | A bench. |
| `box` | `s` | `FXE=1.0S/k:sup/f:box` | A box, step or platform. |
| `chair` | `s` | `FXE=1.0S/k:sup/f:chair` | A chair. |
| `block` | `s` | `FXE=1.0S/k:sup/f:block` | Lifting blocks. |
| `rack` | `s` | `FXE=1.0S/k:sup/f:rack` | Power rack or squat stand. |
| `ball` | `s` | `FXE=1.0S/k:sup/f:ball.stab` | Stability ball. |
| `dome` | `s` | `FXE=1.0S/k:sup/f:dome` | BOSU, side up not stated. |
| `dome.up` | `s` | `FXE=1.0S/k:sup/f:dome` | BOSU dome side up. Child of `dome`. |
| `dome.down` | `s` | `FXE=1.0S/k:sup/f:dome` | BOSU flat side up (dome on the floor). Child of `dome`. |
| `board` | `s` | `FXE=1.0S/k:sup/f:board.bal` | Balance board. |
| `roller` | `s` | `FXE=1.0S/k:sup/f:roller.foam` | Foam roller. |
| `slider` | `s` | `FXE=1.0S/k:sup/f:slider` | Slider. |
| `strap` | `s` | `FXE=1.0S/k:sup/f:strap.susp` | Suspension straps. |
| `ring` | `s` | `FXE=1.0S/k:sup/f:ring` | Gymnastic rings. |
| `crope` | `s` | `FXE=1.0S/k:sup/f:rope.climb` | Climbing rope. |
| `bar` | `s` | `FXE=1.0S/k:sup/f:bar.fixed` | Fixed bar: pull-up bar, or a racked bar used as a handhold. |
| `bars` | `s` | `FXE=1.0S/k:sup/f:bar.parallel` | Parallel dip bars. |
| `pbars` | `s` | `FXE=1.0S/k:sup/f:bar.parallette` | Parallettes. |
| `preacher` | `s` | `FXE=1.0S/k:sup/f:pad.preacher` | Preacher bench pad. |
| `hyper` | `s` | `FXE=1.0S/k:sup/f:pad.hyper` | Back-extension bench (Roman chair for back or side raises). |
| `ghd` | `s` | `FXE=1.0S/k:sup/f:pad.ghd` | Glute-ham developer. |
| `vkr` | `s` | `FXE=1.0S/k:sup/f:station.vkr` | Captain’s chair / knee-raise station. |
| `pole` | `s` | `FXE=1.0S/k:sup/f:pole` | A vertical pole or post gripped by the hands (human flag). |
| `mball` | `s` | `FXE=1.0S/k:sup/f:ball.massage` | Massage or lacrosse ball. |
<!-- /fds:generated -->

### Symmetry (`x`)

Add a scope when only the arms or only the legs follow the pattern: `u@arms`, `u@legs`. When arms and legs follow different patterns, write one item per scope: a suitcase carry is `x:rc@legs+u@arms`. Write one code, or one per scope. A stretch, roll or hold that works one limb and then the other is `x:u`.

<!-- fds:generated fxi#symmetry -->
| Code | Meaning | Notes |
|---|---|---|
| `b` | Bilateral: both limbs work together, or the movement has no sides (default, never written). | Default, never written. |
| `u` | Unilateral: one side does every rep of the set, then the other side. |  |
| `a` | Alternating: the sides take turns rep by rep; one side works while the other waits. |  |
| `rc` | Reciprocal: both sides move at once in opposite directions (gait, flutter kicks, see-saw press). |  |
<!-- /fds:generated -->

<!-- fds:generated fxi#symmetryScopes -->
| Code | Meaning |
|---|---|
| `arms` | The pattern applies to the arms. |
| `legs` | The pattern applies to the legs. |
<!-- /fds:generated -->

### Grip and stance (`g`)

One hand orientation, one width and one stance per phase, joined with `+`: `g:ne+w-n`. Width applies to hands on an implement and on a support (a diamond push-up is `w-t`). When the grip changes within the rep, write one phase per position: a curl that turns from underhand to overhand is `g:su>pr`.

<!-- fds:generated fxi#handOrientations -->
| Code | Meaning |
|---|---|
| `pr` | Pronated: palms down or away (overhand). |
| `su` | Supinated: palms up or toward you (underhand). |
| `ne` | Neutral: palms face each other (hammer). |
| `mx` | Mixed: one hand over, one under. |
<!-- /fds:generated -->

<!-- fds:generated fxi#gripWidths -->
| Code | Meaning | Notes |
|---|---|---|
| `w-t` | Hands touching or overlapping (diamond). |  |
| `w-n` | Narrow: hands inside shoulder width. |  |
| `w-m` | Medium: about shoulder width (default, never written). | Default, never written. |
| `w-w` | Wide: hands well outside shoulder width. |  |
<!-- /fds:generated -->

<!-- fds:generated fxi#stances -->
| Code | Meaning | Notes |
|---|---|---|
| `st-n` | Narrow stance: feet together or closer than hip width. |  |
| `st-m` | Medium stance: about hip width (default, never written). | Default, never written. |
| `st-w` | Wide stance (sumo). |  |
<!-- /fds:generated -->

### Range and start (`r`)

At most one start code, and only where it is not the movement's usual start. Never write `r` for full range. The box a depth jump drops from is the start (`from-drop`), not a support; a box jumped onto afterwards is (`s:box`).

<!-- fds:generated fxi#ranges -->
| Code | Meaning | Notes |
|---|---|---|
| `partial` | Part of the usual range on purpose: half, quarter, pulses, top or bottom half. |  |
| `deep` | Deeper than the usual range: full depth, ass to grass, pistol depth. |  |
| `deficit` | Standing on something to go deeper than usual. |  |
| `from-floor` | Each rep starts with the load at rest on the floor, where the usual start is not the floor. | Start code. |
| `from-top` | Starts standing with the load held, lowered without being set down (hang), where that is not the usual start. With no child, the usual hang: above the knee. | Start code. |
| `from-top.knee` | A hang that starts at or below the knee. Child of `from-top`. | Start code. Child of `from-top`; `from-top` covers it in compare. |
| `from-pins` | Each rep starts from pins, blocks or a rack above the floor. | Start code. |
| `from-drop` | Each rep starts with a drop: the body steps off a box or platform and lands before the working phase (depth jump). The box dropped from is not written in `s`. | Start code. |
<!-- /fds:generated -->

### Held posture (`h`) and line of pull (`p`)

Both are standard name layers with a default. An owner writes the held posture and line the exercise really uses. `h:?` or `p:?` is for a source that says the posture or line differs without saying how.

<!-- fds:generated fxi#heldPostures -->
| Code | Meaning | Notes |
|---|---|---|
| `none` | No held posture: the non-working limbs do what the movement word implies (default, never written). | Default, never written. |
| `arms.oh` | Arms held straight overhead, nothing in the hands. |  |
| `arms.fwd` | Arms held straight and reaching forward from the shoulders, nothing in the hands ("arms extended", "straight arm"). |  |
| `arms.side` | Arms held out to the sides. |  |
| `arms.cross` | Arms crossed on the chest. |  |
| `hands.head` | Hands behind or on the head (prisoner). |  |
| `el.bent` | Working elbows held bent at about 90° ("bent arm", "90 degree"). |  |
| `ua.oh` | Upper arms held up beside the head while the elbows work (overhead triceps extension). | Never with `ua.side`. |
| `ua.side` | Upper arms held out from the sides, elbows flared, while the elbows work (inner biceps curl, Tate press). | Never with `ua.oh`. |
| `leg.fwd` | Free leg held straight in front. |  |
| `leg.back` | Free leg held behind. |  |
| `legs.l` | Legs held straight at about 90° hip flexion. | Never with `kn.bent`. |
| `kn.bent` | Knees held bent while the hips or arms work (hanging knee raise; inverted row with the feet flat on the floor). | Never with `legs.l`. |
| `trunk.fwd` | Trunk held leaning forward where the orientation does not already say so (chest dip). |  |
<!-- /fds:generated -->

<!-- fds:generated fxi#lines -->
| Code | Meaning | Notes |
|---|---|---|
| `usual` | The line of pull the movement word implies (default, never written). | Default, never written. |
| `hi` | Cable or band anchored higher than usual for the movement word. | Never with `lo`, `side`. |
| `lo` | Anchored lower than usual for the movement word. | Never with `hi`, `side`. |
| `behind` | The load or the body passes behind the head or trunk instead of in front (behind-the-neck press, rear pull-up). |  |
| `side` | The load pulls from one side: the body stands side-on to the anchor (a cable press done side-on). | Never with `hi`, `lo`. |
<!-- /fds:generated -->

### Accessory (`a`, extended)

An accessory never loads the working muscles (that is `l`) and never bears weight (that is `s`). A string that carries `a` is flagged `N`, and compare weighs `a` only when both strings carry it. Leave it out when no accessory is stated.

<!-- fds:generated fxi#accessories -->
| Code | Meaning | Notes |
|---|---|---|
| `none` | No accessory (default, never written). | Default, never written. |
| `strap` | A strap, belt, towel or rope used to pull or hold a limb (stretching strap). |  |
| `partner` | A partner who holds, resists or assists. |  |
<!-- /fds:generated -->

## How FXI and FXE divide the facts

| FXE owns | FXI owns |
|---|---|
| What the equipment is | Joint motion and its phases |
| Fixed geometry: load interface, the posture a machine imposes, the motion it guides | Orientation |
| Drive, constraint and design attributes | Grip, symmetry, range, footwork |
| | Per-use settings: pulley height, bench angle, band anchor |
| | Hold point and count |

Shared facts are checked against each other, never counted twice. FXI compare never weighs the machine class; FXE compare never weighs a per-use choice. [FXE](./fxe.md#checks-between-fxi-and-fxe) lists the cross-checks.
