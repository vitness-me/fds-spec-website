---
title: 'FXE: Equipment Descriptor'
sidebar_label: 'FXE (equipment)'
description: 'Draft FXE syntax, kinds, procedure and every code'
sidebar_position: 4
---

# FXE: Equipment Descriptor

:::caution Draft
Not normative until the RFC that adopts the structural descriptors is accepted: RFC (pending). See [the overview](./overview.md).
:::

An FXE describes a piece of equipment by its structure. Two pieces of equipment are the same when every exercise written for one can be done on the other with the same body contacts, the same guided motion relative to the body and the same kind of moving part, changing only settings the exercise records.

FXE classifies; it does not catalogue. It has no code for a brand, a model or a product, and FDS publishes no list of equipment. A provider's equipment entries carry FXE strings.

Every code an FXE may contain is listed on this page. The tables are generated from [`specification/registries/descriptors/fxe.registry.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/registries/descriptors/fxe.registry.json).

## Principles

- **Fixed geometry is equipment; anything set per use is exercise.** Pulley height, bench angle, band anchor point, attachment, grip, one limb or two and seat height belong to the FXI.
- **Encode the equipment, not the exercise done on it.** A calf raise done on a leg press uses a leg press: encode the leg press's own guided motion.
- **A named machine wins.** When an exercise names a machine, that machine is the equipment, whatever the exercise does on it.
- When a source says only "machine", the machine is the one built for the exercise's main movement.

## Syntax

```text
FXE=1.0S/k:<kind>/<standard layers>                  standard: the form every exercise record and equipment record writes
FXE=1.0N/k:<kind>/<standard layers>/<extended>       full: an equipment registry record with build details
FXE=1.0S/<configuration>;<configuration>             a combination machine
```

- `1` is the major version, `0` the syntax revision, and `S` or `N` the flag, as in FXI. `N` means an extended layer is written.
- `k` comes first. A kind's **standard** layers follow in the order its table gives, and are always written, with `?` when unknown. **Extended** layers follow only when stated, and only in an equipment registry record; an exercise record's `fxe` is always standard.
- `k:none` takes no other layer. `k:?` takes no other layer.
- A combination machine joins the standard FXE of each configuration with `;`, sorted. A combination joins machine or station configurations; `k:none` and `k:?` never combine. An exercise record writes only the configuration the exercise uses.

**Canonical form.** Kind first; standard layers in order; then extended layers in the order `r c g a`, dropping any value the form already implies (a dumbbell needs no `r:grav`); `+`-joined values sorted; configurations sorted; the flag set to `N` exactly when an extended layer remains.

<!-- fds:generated fxe#kinds -->
| Code | Meaning | Notes |
|---|---|---|
| `none` | No equipment: the body is the whole load. | No layers. |
| `imp` | Implement: a free object moved, held or worn. | Standard layers `f`. Extended layers `r`, `c`. |
| `sup` | Support: a surface or frame the body rests on, hangs from or pushes against. It does not carry the load. | Standard layers `f`. Extended layers `c`. |
| `acc` | Accessory: a handle, strap, belt, mat, towel or marker. It never defines the exercise. | Standard layers `f`. |
| `stn` | Station: a guide or anchor with a general interface used for many movements: cable column, Smith machine, landmine. | Standard layers `f`. Extended layers `r`, `c`, `a`. |
| `mac` | Dedicated machine: a guided mechanism with fixed body interfaces, built for one movement. | Standard layers `l`, `s`, `m`. Extended layers `r`, `c`, `g`, `a`. |
| `erg` | Cyclic machine: repeats whole cycles (cardio). | Standard layers `c`, `l`, `s`, `m`. Extended layers `r`. |
<!-- /fds:generated -->

## Procedure

**Step 1. The kind `k`.** Always written. A load pattern is not equipment: "weighted" with no form named is `FXE=1.0S/k:imp/f:?`. "Assisted" with no implement, or "other", is `FXE=1.0S/k:?`.

**Step 2. `imp`, `sup`, `acc`, `stn`: one standard layer, the form `f`.** Pick the atom. A generic word takes the generic atom ("band" is `band`); use a child only when it is named (a long loop band is `band.loop`). A stretching strap is `FXE=1.0S/k:acc/f:strap.stretch`; the FXI of a stretch done with it carries `a:strap`. A seated cable row machine with its own seat, and a lat pulldown machine, are dedicated machines (`mac`); anything else on a cable is the station `FXE=1.0S/k:stn/f:cable`.

**Step 3. `mac`: three standard layers, in the order `l s m`.**

`m`, the guided motion: what the machine's moving part guides, relative to the trunk.

- A single-joint machine, whose pivot lines up with one joint, writes the joint action: a leg curl `kn.flex`, a leg extension `kn.ext`, a pec deck `sh.hadd`, a rear-delt machine `sh.habd`, a lateral raise machine `sh.abd`, a pullover `sh.ext`, a shrug `sc.elev`, an adductor `hip.add`, an abductor `hip.abd`, a hip extension machine `hip.ext`, an ab crunch `sp.flex`, a back extension `sp.ext`, a rotary torso `sp.rot`, a calf raise `ank.pf`.
- A multi-joint machine writes `push.`, `pull.` or `assist.` and a direction: a shoulder press, hack squat or belt squat `push.up`; a deadlift machine `pull.up`; a pulldown `pull.down`; a seated dip `push.down`; a chest press and a leg press `push.fwd`; a row `pull.back`; an incline press `push.fwdup`; a decline press `push.fwddown`; a high row `pull.backdown`; an assisted pull-up or dip `assist.up`.

`l`, the load interface: where the moving part meets the body. Join two with `+` only when both move the load. When nothing says otherwise:

| `m` | default `l` |
|---|---|
| `kn.flex`, `kn.ext`, `hip.flex` | `ankle` |
| `el.*`, `sc.elev`, `sh.habd`, and every `push.*` or `pull.*` worked with the hands | `hand` |
| `sh.hadd`, `sh.abd`, `sh.flex`, `sh.ext` | `arm` |
| `hip.add`, `hip.abd` | `thigh` |
| `sp.flex`, `sp.rot` | `chest` |
| `sp.ext` | `back` |
| `assist.up` | `knee` (`foot` when the user stands on a platform) |

Known machines: a leg press is `foot`; a hack, pendulum or V-squat `shoulder`; a belt squat `hip`; a calf raise `thigh` seated, `shoulder` standing, `hip` with the trunk on a pad; a glute kickback `foot`; a hip thrust machine `hip` with `supine`; a reverse hyper `ankle` with `prone`.

`s`, the posture the machine puts the user in. Every reclined leg press is `recline` (one with an upright seat is `seat`); hack, pendulum, V-squat and belt squat are `stand`; a dedicated row machine is `seat.chest`, except a seated cable row with a foot plate, which is `seat`; a rear-delt machine is `seat.chest`; a chest-supported T-bar row is `prone`; an assisted pull-up or dip machine is `hang`. When nothing says: `seat.chest` for `sh.habd`; `seat` for `kn.ext`, `el.*`, the other `sh.*`, `sp.flex`, `sp.rot`, `hip.add`, `hip.abd`, `hip.flex`, every `push.*` worked with the hands, `pull.down` and `pull.backdown`; `recline` for `push.fwd` with `foot`; `stand` for `push.up` with `shoulder` or `hip`, and for `sc.elev`, `hip.ext` and `pull.up`; otherwise `?`.

**Step 4. `erg`: four standard layers, in the order `c l s m`.** Each cardio machine type writes all four:

<!-- fds:generated fxe#cardioMachineTypes -->
| Type | Machine | `c` | `l` | `s` | `m` | FXI hold |
|---|---|---|---|---|---|---|
| `treadmill` | Treadmill | `belt` | `foot` | `stand` | `gait` | `@feet` |
| `stepmill` | Stepmill (revolving stairs) | `belt` | `foot` | `stand` | `step` | `@feet` |
| `stepper` | Stair stepper (pedals) | `link` | `foot` | `stand` | `step` | `@feet` |
| `stair` | Stair machine, stepper or stepmill not known | `?` | `foot` | `stand` | `step` | `@feet` |
| `bike-upright` | Upright or spin bike | `loop` | `foot` | `seat` | `cycle` | `@feet` |
| `bike-recumbent` | Recumbent bike | `loop` | `foot` | `recline` | `cycle` | `@feet` |
| `bike` | Stationary bike, upright or recumbent not known | `loop` | `foot` | `?` | `cycle` | `@feet` |
| `air-bike` | Air bike (moving arms) | `loop` | `foot+hand` | `seat` | `cycle` | `@feet` |
| `elliptical` | Elliptical | `loop` | `foot+hand` | `stand` | `glide` | `@feet` |
| `rower` | Rower | `rail` | `hand` | `seat` | `row` | `@hands` |
| `ski` | Ski erg | `cable` | `hand` | `stand` | `pole` | `@hands` |
| `ube` | Upper-body ergometer (hand cranks, seated) | `loop` | `hand` | `seat` | `cycle` | `@hands` |
| `vertical-climber` | Vertical climber | `line` | `foot+hand` | `stand` | `climb` | `@feet` |
| `ladder-climber` | Ladder climber | `belt` | `foot+hand` | `stand` | `climb` | `@feet` |
<!-- /fds:generated -->

A cardio machine of unknown type writes `?` for every layer it cannot fill: `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?`.

**Step 5. Combination machines** (a multi-hip, a pec deck with rear-delt arms, a pulldown with a low row): the standard FXEs of the configurations joined by `;`.

**Step 6. Extended layers**, in an equipment registry record only: `r` drive, `c` constraint or compliance, `g` guide angle, `a` design attributes. "Lever" means `c:arc` with `r:plate`; "sled" means `c:line` with `r:plate`.

**Generic values.**

| Source says | FXE |
|---|---|
| a strength machine, of no known kind | `FXE=1.0S/k:mac/l:?/s:?/m:?` |
| a cardio machine, of no known kind | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?` |
| bands | `FXE=1.0S/k:imp/f:band` |
| body weight | `FXE=1.0S/k:none` |
| weighted, no form | `FXE=1.0S/k:imp/f:?` |
| other; assisted, no implement | `FXE=1.0S/k:?` |

## The main equipment of an exercise

An exercise record's `fxe` is the standard FXE of its main equipment, read from its FXI in this order:

1. a machine or cardio machine in `l` (`mach`, `erg` or an `erg.<cycle>` child), with the machine's own layers;
2. else a station in `l` (`cable`, `smith`, `landmine`);
3. else a load implement in `l`; with several, the first in the [equipment token table](./fxi.md#load-l). An implement of unknown kind gives `FXE=1.0S/k:imp/f:?` when no other implement is known. A whole `l:?` is not an implement;
4. else the first support in `s` other than the floor, by token order;
5. else `FXE=1.0S/k:none` when `l:bw`;
6. else `FXE=1.0S/k:?`.

The second implement of a two-implement exercise stays in the FXI; it never makes a second FXE. A band's type (`band.loop`, `band.mini`, `band.tube`) is written in the FXE when known; the FXI says only `band`.

## Checks between FXI and FXE

A record's FXI and FXE are checked against each other. A checker warns when any of these fails:

1. The record's FXE does not contradict the FXE of the FXI's main token.
2. A machine's posture fits the FXI start orientation (the postures table lists which).
3. A machine's load interface fits the FXI hold point of `mach` or `erg` (the load interface table lists which).
4. A single-joint machine's motion appears in the FXI motion, or a child of it does (a pullover machine's `sh.ext` and an FXI's `sh.ext.oh`), unless the exercise names the machine (a calf raise on a leg press).
5. `k:none` goes with `l:bw`.
6. A cardio child token fits the FXE cycle: `erg.gait` with `m:gait`, and so on.
7. `floor@feet` beside another support is implied under a seated body, and under a face-up body lying on a support that bears its trunk.

## Codes

### Forms (`f`)

<!-- fds:generated fxe#forms -->
**`imp`**

| Form | Meaning | Notes |
|---|---|---|
| `bar.straight` | Barbell, Olympic or standard. | Implies `r:grav`. |
| `bar.ez` | EZ curl bar. | Implies `r:grav`. |
| `bar.trap` | Trap or hex bar. | Implies `r:grav`. |
| `bar.axle` | Thick axle bar. | Implies `r:grav`. |
| `bar.camber` | Cambered bar. | Implies `r:grav`. |
| `bell.dumb` | Dumbbell. | Implies `r:grav`. |
| `bell.kettle` | Kettlebell. | Implies `r:grav`. |
| `bell.circus` | Circus dumbbell. | Implies `r:grav`. |
| `ball.med` | Medicine ball. | Implies `r:grav`. |
| `ball.slam` | Slam ball. | Implies `r:grav`. |
| `bag.sand` | Sandbag. | Implies `r:grav`. |
| `bag.heavy` | Hanging heavy bag. | Implies `r:grav`, `c:swing`. |
| `plate` | A weight plate held or worn on its own. | Implies `r:grav`. |
| `chain` | Lifting chain. | Implies `r:grav`. |
| `rope.battle` | Battle rope. | Implies `r:grav`. |
| `rope.jump` | Skipping rope. | Implies `r:none`. |
| `band` | Elastic band or tube, type not stated. | Implies `r:elastic`. |
| `band.loop` | Long loop band: superband, power band. | Child of `band`. Implies `r:elastic`. |
| `band.mini` | Short loop band worn around the legs: miniband. | Child of `band`. Implies `r:elastic`. |
| `band.tube` | Tube band with handles. | Child of `band`. Implies `r:elastic`. |
| `sled` | Ground sled or prowler, pushed or dragged. | Implies `r:friction`. |
| `tire` | Large tyre. | Implies `r:grav`. |
| `hammer` | Sledgehammer. | Implies `r:grav`. |
| `stone` | Atlas stone. | Implies `r:grav`. |
| `log` | Strongman log. | Implies `r:grav`. |
| `keg` | Keg. | Implies `r:grav`. |
| `yoke` | Strongman yoke. | Implies `r:grav`. |
| `frame.carry` | Farmer handles or a carry frame (rickshaw). | Implies `r:grav`. |
| `car` | A car, lifted or pushed. | Implies `r:grav`. |
| `wear.vest` | Weight vest. | Implies `r:grav`. |
| `wear.ankle` | Ankle weight. | Implies `r:grav`. |
| `club` | Indian club or mace. | Implies `r:grav`. |
| `stick` | Dowel, broomstick or PVC pipe. | Implies `r:none`. |
| `wheel` | Ab wheel. | Implies `r:none`, `c:roll`. |
| `roller.wrist` | Wrist roller. | Implies `r:grav`. |
| `harness.head` | Head harness with a hanging load. | Implies `r:grav`. |

**`sup`**

| Form | Meaning | Notes |
|---|---|---|
| `floor` | The floor, or a mat on it. |  |
| `wall` | A wall. |  |
| `bench` | A bench, flat or adjustable. |  |
| `box` | A box, step or platform. |  |
| `chair` | A chair. |  |
| `block` | Lifting blocks a bar starts from. |  |
| `rack` | Power rack or squat stand, with its pins. |  |
| `ball.stab` | Stability, Swiss or exercise ball. | Implies `c:tilt`. |
| `dome` | BOSU, either side up. | Implies `c:tilt`. |
| `board.bal` | Balance or wobble board. | Implies `c:tilt`. |
| `roller.foam` | Foam roller. | Implies `c:roll`. |
| `slider` | Slider disc. | Implies `c:slide`. |
| `strap.susp` | Suspension trainer. | Implies `c:swing`. |
| `ring` | Gymnastic rings. | Implies `c:swing`. |
| `rope.climb` | Climbing rope. | Implies `c:swing`. |
| `bar.fixed` | Fixed overhead bar: pull-up bar. |  |
| `bar.parallel` | Parallel dip bars. |  |
| `bar.parallette` | Floor parallettes. |  |
| `pad.preacher` | Preacher bench. |  |
| `pad.hyper` | Back-extension bench, 45° or 90° (also called a Roman chair for back or side raises). |  |
| `pad.ghd` | Glute-ham developer. |  |
| `station.vkr` | Vertical knee-raise station (captain’s chair). |  |
| `pole` | A vertical pole, post or rack upright gripped by the hands. |  |
| `ball.massage` | Massage or lacrosse ball rolled under the body. |  |

**`acc`**

| Form | Meaning | Notes |
|---|---|---|
| `handle` | Single D-handle. |  |
| `handle.bar` | Straight or cambered cable bar. |  |
| `handle.v` | V-bar or close-grip handle. |  |
| `handle.rope` | Triceps rope. |  |
| `strap.ankle` | Ankle cuff. |  |
| `belt.dip` | Dip belt. |  |
| `belt.lift` | Lifting belt. |  |
| `strap.lift` | Lifting straps. |  |
| `strap.stretch` | Stretching strap: a strap, belt or loop band used to pull a limb in a stretch. |  |
| `towel` | A towel used as a handle. |  |
| `marker` | Cone, hurdle or floor marker. |  |
| `board.press` | Board laid on the chest for partial presses. |  |
| `mat` | Floor mat. |  |

**`stn`**

| Form | Meaning | Notes |
|---|---|---|
| `cable` | Cable column, crossover or functional trainer: a pulley set per exercise. | Implies `r:stack`, `c:cable`. |
| `smith` | Smith machine: a bar on fixed rails. | Implies `r:plate`, `c:line`. |
| `landmine` | Landmine: one end of a barbell in a floor pivot (also a corner T-bar row). | Implies `r:grav`, `c:pivot`. |
<!-- /fds:generated -->

### Load interfaces (`l`, for `mac` and `erg`)

<!-- fds:generated fxe#loadInterfaces -->
| Code | Meaning | Notes |
|---|---|---|
| `hand` | Handles or a bar in the hands. | Fits FXI `@hands`, `@overhead`. |
| `foot` | A foot plate or pedals. | Fits FXI `@feet`. |
| `ankle` | A pad on the lower leg. | Fits FXI `@shins`, `@calves`, `@ankles`. |
| `thigh` | A pad on the thigh. | Fits FXI `@thighs`. |
| `knee` | A pad or platform at the knees. | Fits FXI `@knees`. |
| `arm` | A pad on the upper arm or elbow. | Fits FXI `@forearms`, `@elbows`, `@arms`. |
| `chest` | A pad on the chest. | Fits FXI `@chest`. |
| `back` | A pad on the back. | Fits FXI `@back`. |
| `shoulder` | Pads on the shoulders. | Fits FXI `@shoulders`. |
| `hip` | A pad or belt at the hips. | Fits FXI `@hips`, `@waist`. |
| `head` | A pad on the head. | Fits FXI `@head`. |
| `seat` | A moving seat. | Fits FXI `@seat`. |
<!-- /fds:generated -->

### Postures (`s`, for `mac` and `erg`)

<!-- fds:generated fxe#postures -->
| Code | Meaning | Notes |
|---|---|---|
| `seat` | Seated. | Fits FXI `seated`, `seated.bent`. |
| `seat.chest` | Seated, chest against a pad. | Fits FXI `seated`, `seated.bent`. |
| `stand` | Standing. | Fits FXI `standing`, `standing.bent`. |
| `stand.chest` | Standing or bent over, trunk on a pad. | Fits FXI `standing`, `standing.bent`, `prone.incline`. |
| `prone` | Lying face down, flat or inclined. | Fits FXI `prone`, `prone.incline`, `prone.decline`. |
| `supine` | Lying face up. | Fits FXI `supine`, `supine.incline`, `supine.decline`. |
| `recline` | Lying back on an inclined back pad (leg press). | Fits FXI `supine`, `supine.incline`, `seated`. |
| `kneel` | Kneeling. | Fits FXI `kneeling`, `kneeling.half`. |
| `hang` | Held up by the hands or forearms. | Fits FXI `hanging`. |
| `side` | Side-lying. | Fits FXI `side-lying`. |
<!-- /fds:generated -->

### Guided motion (`m`, for `mac`)

A multi-joint guided motion is a verb, `.`, and a direction: `pull.back`. A single-joint guided motion is the joint action.

<!-- fds:generated fxe#guidedMotionVerbs -->
| Code | Meaning |
|---|---|
| `push` | The moving part is pushed away. |
| `pull` | The moving part is pulled toward the user. |
| `assist` | The moving part helps lift the body. |
<!-- /fds:generated -->

<!-- fds:generated fxe#guidedMotionDirections -->
| Code | Meaning |
|---|---|
| `up` | Toward the head: shoulder press, hack squat, belt squat, deadlift machine. |
| `down` | Toward the feet: pulldown, seated dip. |
| `fwd` | Away from the front of the trunk: chest press, leg press. |
| `back` | Toward the front of the trunk: row. |
| `fwdup` | Forward and up: incline press. |
| `fwddown` | Forward and down: decline press. |
| `backdown` | Back and down: high row. |
<!-- /fds:generated -->

<!-- fds:generated fxe#singleJointMotions -->
| Code | Meaning |
|---|---|
| `kn.flex` | Knee flexion against resistance, as in a leg curl. |
| `kn.ext` | Knee extension, as in standing up from a squat. |
| `el.flex` | Elbow flexion, as in a curl. |
| `el.ext` | Elbow extension, as in a press or triceps extension. |
| `sh.flex` | Shoulder flexion: arm forward and up, as in a front raise or overhead press. |
| `sh.ext` | Shoulder extension: arm down and back from in front, as in a row or straight-arm pulldown. |
| `sh.abd` | Shoulder abduction: arm out to the side and up, as in a lateral raise. |
| `sh.add` | Shoulder adduction: arm down to the side from out to the side, as in a wide pull-up. |
| `sh.hadd` | Horizontal adduction: arm across the front at chest height, as in a press or fly. |
| `sh.habd` | Horizontal abduction: arm back and out at chest height, as in a reverse fly. |
| `sh.ir` | Shoulder internal rotation: forearm turns in toward the belly, elbow bent. |
| `sh.er` | Shoulder external rotation: forearm turns out, elbow bent. |
| `sc.elev` | Scapular elevation: shrug up. |
| `hip.flex` | Hip flexion: thigh toward the trunk, or trunk toward the thigh. |
| `hip.ext` | Hip extension: thigh away from the trunk, as in standing up from a squat. |
| `hip.abd` | Hip abduction: leg out to the side. |
| `hip.add` | Hip adduction: leg in toward the other leg. |
| `sp.flex` | Trunk flexion: ribs toward the pelvis, as in a crunch. |
| `sp.ext` | Trunk extension: straightening or arching the back from a bent position. |
| `sp.rot` | Trunk rotation: shoulders twist against the hips. |
| `sp.lflex` | Trunk side bend. |
| `ank.pf` | Ankle plantar flexion: rising onto the toes, pushing off. |
| `ank.df` | Ankle dorsiflexion: toes toward the shin. |
| `nk.flex` | Neck flexion: chin toward the chest. |
| `nk.ext` | Neck extension: head tips back. |
| `nk.lflex` | Neck side bend: ear toward the shoulder. |
| `wr.flex` | Wrist flexion: palm toward the forearm. |
| `wr.ext` | Wrist extension: back of the hand toward the forearm. |
<!-- /fds:generated -->

### Cycles (`m`, for `erg`)

<!-- fds:generated fxe#cycles -->
| Code | Meaning |
|---|---|
| `gait` | Walking or running on a belt. |
| `cycle` | Pedalling (or hand cranking). |
| `step` | Stepping (stepper or stepmill). |
| `row` | Rowing. |
| `pole` | Double-pole pull (ski erg). |
| `glide` | Elliptical glide. |
| `climb` | Climbing with hands and feet. |
<!-- /fds:generated -->

### Tracks (`c`, standard for `erg`)

<!-- fds:generated fxe#tracks -->
| Code | Meaning |
|---|---|
| `belt` | A moving belt or revolving stairs. |
| `link` | Linked pedals (stepper). |
| `loop` | A closed loop: cranks, elliptical. |
| `rail` | A seat on a rail (rower). |
| `cable` | A cable pulled from above (ski erg). |
| `line` | A straight track (vertical climber). |
<!-- /fds:generated -->

### Extended layers

Drive (`r`):

<!-- fds:generated fxe#drives -->
| Code | Meaning |
|---|---|
| `grav` | Free weight under gravity. |
| `stack` | Selectorised weight stack. |
| `plate` | Plate-loaded. |
| `elastic` | Elastic. |
| `air` | Air fan. |
| `mag` | Magnetic brake. |
| `water` | Water tank. |
| `motor` | Motor. |
| `friction` | Friction. |
| `hydraulic` | Hydraulic. |
| `flywheel` | Flywheel (isoinertial). |
| `none` | No resistance of its own. |
<!-- /fds:generated -->

Constraint (`c`, for `mac` and `stn`):

<!-- fds:generated fxe#constraints -->
| Code | Meaning |
|---|---|
| `line` | A straight track (sled, rails). |
| `arc` | A lever on one pivot. |
| `link` | A linkage of several pivots. |
| `cable` | A cable over pulleys. |
| `pivot` | One end in a floor pivot. |
<!-- /fds:generated -->

Compliance (`c`, for `imp` and `sup`):

<!-- fds:generated fxe#compliance -->
| Code | Meaning |
|---|---|
| `tilt` | Tilts under the body. |
| `roll` | Rolls. |
| `slide` | Slides. |
| `swing` | Hangs and swings. |
<!-- /fds:generated -->

Guide angle (`g`, for `mac`):

<!-- fds:generated fxe#guideAngles -->
| Code | Meaning |
|---|---|
| `incl` | Inclined (45° leg press). |
| `horiz` | Horizontal. |
| `vert` | Vertical. |
<!-- /fds:generated -->

Design attributes (`a`, for `mac` and `stn`):

<!-- fds:generated fxe#designAttributes -->
| Code | Meaning |
|---|---|
| `iso` | Independent arms (iso-lateral). |
| `conv` | Converging path. |
| `cb` | Counterbalanced (Smith). |
| `dual` | Two stacks. |
<!-- /fds:generated -->
