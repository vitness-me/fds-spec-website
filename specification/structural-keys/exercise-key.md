# Exercise Key

The exercise key is the structural key of an exercise. It sits in the `fxi` field and records how the body moves, the position it starts in, what it is supported on and what it moves with. This page shows how a key is put together, what every layer and code means, and how two keys compare.

The header `FXI=1.0` is the key's version, and the code lists come with the FDS release that publishes them. A later release may add codes or split a code into more specific children, but it never changes what a code means, so a key written today stays valid.

The code lists are published as registries: the layers and codes of this key in [`exercise-key.registry.json`](https://spec.vitness.me/registries/exercise-key.registry.json), the equipment codes in [`equipment-key.registry.json`](https://spec.vitness.me/registries/equipment-key.registry.json), and the [body points](https://spec.vitness.me/registries/body-points.registry.json) and [body positions](https://spec.vitness.me/registries/body-positions.registry.json) it shares with the equipment key.

## Anatomy of the key

A walking lunge with a dumbbell in each hand has this key:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXI</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
      <span className="key-anatomy__label">header</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-code">hip</span><span className="ka-sym">.</span><span className="ka-code">ext</span><span className="ka-sym">+</span><span className="ka-code">kn</span><span className="ka-sym">.</span><span className="ka-code">ext</span></code>
      <span className="key-anatomy__label">motion</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">o</span><span className="ka-sym">:</span><span className="ka-code">standing</span></code>
      <span className="key-anatomy__label">orientation</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">f</span><span className="ka-sym">:</span><span className="ka-code">travel</span><span className="ka-sym">.</span><span className="ka-code">fwd</span></code>
      <span className="key-anatomy__label">footwork</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-code">bell</span><span className="ka-sym">.</span><span className="ka-code">dumb</span><span className="ka-sym">@</span><span className="ka-code">hands</span></code>
      <span className="key-anatomy__label">load</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">x</span><span className="ka-sym">:</span><span className="ka-code">a</span></code>
      <span className="key-anatomy__label">sides</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-letter">Layer letter</span> · <span className="ka-code">code</span> · <span className="ka-sym">symbol</span> · <span className="ka-flag">flag</span>
  </figcaption>
</figure>

`FXI=1.0S/m:hip.ext+kn.ext/o:standing/f:travel.fwd/l:bell.dumb@hands/x:a`

| Part | Text | What it says |
|---|---|---|
| Key type | `FXI` | This is an exercise key. |
| Version | `1.0` | Major version 1, revision 0. |
| Flag | `S` | Every layer in the key is standard. |
| Motion | `m:hip.ext+kn.ext` | The hips and the knees extend together. |
| Orientation | `o:standing` | The rep starts standing. |
| Footwork | `f:travel.fwd` | Each step travels forward and does not come back. |
| Load | `l:bell.dumb@hands` | Dumbbells, held in the hands. |
| Sides | `x:a` | The legs take turns, rep by rep. |
| Layers left out | `k s g r h p a` | Each is at its default: the limb end moves, the floor supports the feet, the usual grip and stance, full range, no held posture, the usual line of pull, no accessory stated. |

Layers are separated by `/`. Each layer is its letter, a `:` and a value made of codes and symbols.

## Dimensions and layers

Each layer records one dimension of the exercise.

| Letter | Layer | Dimension it records | Required | When left out |
|---|---|---|---|---|
| `m` | Motion | Which joints move, in which direction, in which phases, and whether the movement is held, cyclic, ballistic or a stretch | Yes | — |
| `o` | Orientation | The body's position at the start of the rep | Yes | — |
| `k` | Moving end | Which end of the body moves in trunk work | No | The limb end moves |
| `f` | Footwork | Stepping, a split stance or travelling | No | Feet planted level |
| `s` | Support | Surfaces that bear the body's weight, and the body points on them | No | The floor, as the orientation implies |
| `l` | Load | The equipment that loads the working muscles, and where it is held; or body weight | Yes | — |
| `x` | Sides | Whether the limbs work together, one side at a time, in turns or in opposite directions | No | Both together |
| `g` | Grip and stance | Hand orientation, grip width and stance width | No | The usual hand orientation, medium width, medium stance |
| `r` | Range and start | Partial or extra range, and a start position other than the usual one | No | Full range from the usual start |
| `h` | Held posture | What the limbs that don't do the work are held in | No | No held posture |
| `p` | Line of pull | Where a cable or band pulls from, or the path of the load past the body | No | The line the movement implies |
| `a` | Accessory | An accessory or a partner that helps without loading or supporting the body | No | Not stated |

Rules for every key:

- A key must carry `m`, `o` and `l`. When the motion, the orientation or the load isn't known, write `?` as its value: `o:?`.
- Layers must appear in the order of the table: `m o k f s l x g r h p a`.
- A layer at its default is left out. Writing a default code (`x:b`, `f:level`, `h:none`) says nothing more, and the written form drops it.
- **A default is a value**, except the accessory layer, which, left out, is not stated. A key without `x` says both sides work together. That is a different exercise from one with `x:u`, not a less specific one. Only `?` leaves a dimension open.
- Items joined by `+`, and points after `@`, are written in sorted order (`floor@feet,hands`), and in the motion a joint action written beside its own child is dropped. So one exercise always has one written form.
- The accessory layer `a` is the one extended layer. A key that carries it has the flag `N` (`FXI=1.0N/…`); every other key has the flag `S`.

The layers below are listed in key order. For each one: its codes, then its rules.

### Motion (`m`)

The motion is built from joint actions, written `joint.action`.

| Joint | Meaning |
|---|---|
| `nk` | Neck |
| `sp` | Spine: the trunk, thoracic and lumbar together |
| `sc` | Scapula: the shoulder blade on the rib cage |
| `sh` | Shoulder joint |
| `el` | Elbow |
| `fa` | Forearm: the turn that rotates the palm |
| `wr` | Wrist |
| `hip` | Hip |
| `kn` | Knee |
| `ank` | Ankle and foot |

| Joint action | Meaning |
|---|---|
| `nk.flex` `nk.ext` | Chin toward the chest; head tipped back |
| `nk.lflex` `nk.rot` | Ear toward the shoulder; turning the head |
| `sp.flex` `sp.ext` | Ribs toward the pelvis, as in a crunch; straightening or arching the back |
| `sp.lflex` `sp.rot` | Side bend; shoulders twisting against the hips |
| `sc.elev` `sc.dep` | Shoulder blades up (shrug); pulled down |
| `sc.pro` `sc.ret` | Shoulder blades spread around the ribs; squeezed together |
| `sh.flex` | Arm forward and up: front raise, overhead press |
| `sh.ext` | Arm down and back from in front: row, dip |
| `sh.ext.oh` | Arms down in front of the face from overhead: chin-up, close-grip pulldown, pullover. A child of `sh.ext`: `el.flex+sh.ext+sh.ext.oh` is written `el.flex+sh.ext.oh` |
| `sh.abd` `sh.add` | Arm out to the side and up (lateral raise); down to the side from out wide (wide pull-up) |
| `sh.hadd` `sh.habd` | Arm across the front at chest height (press, fly); back and out at chest height (reverse fly) |
| `sh.ir` `sh.er` | Forearm turning in toward the belly, elbow bent; turning out |
| `el.flex` `el.ext` | Elbow bending (curl); straightening (press, triceps extension) |
| `fa.pron` `fa.sup` | Palm turning down; palm turning up |
| `wr.flex` `wr.ext` | Palm toward the forearm; back of the hand toward the forearm |
| `wr.rdev` `wr.udev` | Thumb side toward the forearm; little-finger side toward the forearm |
| `hip.flex` `hip.ext` | Thigh toward the trunk, or the trunk toward the thigh (sit-up); thigh away from the trunk, as in standing up |
| `hip.abd` `hip.add` | Leg out to the side; leg in toward the other leg |
| `hip.ir` `hip.er` | Knee turning in; knee turning out |
| `kn.flex` `kn.ext` | Knee bending against resistance (leg curl); straightening (standing up from a squat) |
| `ank.df` `ank.pf` | Toes toward the shin; rising onto the toes or pushing off |
| `ank.inv` `ank.ev` | Sole turning in; sole turning out |
| `<joint>.circ` | Circling the joint: `nk`, `sp`, `sh`, `wr`, `hip` or `ank` |
| `<joint>.?` | The joint moves, direction unknown |

Rules:

- Write the direction the joints move while the working muscles shorten against the load: the lift, never the lowering, the return or a pause.
- Count a joint when the working muscles move it through a clear range, about 30° or more, as part of what the exercise trains. A joint held still on purpose is left out: the knee in a Romanian deadlift or a swing, the elbow in a fly or a lateral raise.
- Write the spine only when the trunk movement is the exercise (crunch, back extension, twist), the scapula only when the shoulder blade moves on its own (shrug), the wrist and the neck only in wrist and neck exercises, shoulder rotation only in rotation exercises, and the ankle only when the body rises onto the toes or pushes off the ground (calf raise, jump, run).
- A palm turn during a curl or press is grip (`g`), not `fa.pron` or `fa.sup`. Forearm rotation is written only when turning against resistance is the work.
- The shoulder action follows the path of the hands relative to the trunk:

  | The hands move | Action |
  |---|---|
  | Away from the chest, square to the trunk: bench press, push-up, fly | `sh.hadd` |
  | Away from the chest toward the head end: incline press | `sh.flex+sh.hadd` |
  | Away from the chest toward the feet end: decline press | `sh.ext+sh.hadd` |
  | Up along the trunk past the head: overhead press | `sh.flex` |
  | Down along the trunk toward the feet: dip | `sh.ext` |
  | Toward the trunk from in front, elbows close: row | `sh.ext` |
  | Toward the trunk from in front, elbows wide at shoulder height: face pull | `sh.habd` |
  | Down from overhead in front of the face: chin-up, any pull-up or pulldown with an underhand, neutral or close grip; straight-arm pulldown, pullover, slam | `sh.ext.oh` |
  | Down from overhead out at the sides: pull-up or pulldown with an overhand grip at medium or wide width | `sh.add` |
  | Up out to the side: lateral raise | `sh.abd` |

- One phase per distinct movement, in rep order, joined by `>`. If the second movement starts before the first ends, the two are one phase (a thruster). If not, they are two (a squat, then a press).
- Two opposite actions, such as `el.flex` and `el.ext`, never share one part. One joint may move in opposite directions in different phases.
- A prefix before a part sets its kind: held, cyclic, ballistic, static stretch or dynamic stretch. No prefix is a normal moving phase. The prefixes are listed under [Symbols](#symbols).
- A held part under moving limbs is a part of its own, joined to them with `|`: a plank with a leg raise is `=sp.flex|hip.ext`. So is a held push of a limb that doesn't move, when the exercise is built on it: a Janda sit-up pulls the heels down through the whole rep, `=kn.flex|hip.flex+sp.flex`.
- In a stretch, `|` also joins two limbs taken in opposite directions: a runner's stretch is `%hip.ext|%hip.flex`.
- In a stretch, write a held joint when it decides which muscle is stretched: the knee in a calf stretch, `kn.ext` straight or `kn.flex` bent.

### Orientation (`o`)

These codes are the body positions of both keys: an [equipment key](./equipment-key.md#posture-s) writes a machine's posture with them.

| Code | Meaning | Points it implies |
|---|---|---|
| `standing` | On the feet, trunk within about 30° of vertical | `feet` |
| `standing.bent` | On the feet, trunk hinged forward more than about 30° and held there (bent-over row) | `feet` |
| `standing.chest` | On the feet, trunk resting on a pad, upright or bent over (donkey calf raise machine) | `feet`, `chest` |
| `seated` | Sitting, trunk more than 60° from horizontal | `seat` |
| `seated.bent` | Sitting, trunk hinged forward over the thighs and held there | `seat` |
| `seated.chest` | Sitting, chest against a pad that holds the trunk (row machine, rear-delt machine) | `seat`, `chest` |
| `kneeling` | On both knees, trunk upright | `knees`, `shins` |
| `kneeling.half` | On one knee, the other foot forward | `knees`, `feet` |
| `supine` | Face up, trunk within 15° of horizontal | `back` |
| `supine.incline` | Face up, head higher than hips, trunk 15–60° from horizontal | `back` |
| `supine.decline` | Face up, head lower than hips, trunk 15–60° from horizontal | `back` |
| `prone` | Face down, trunk within 15° of horizontal: lying, plank, push-up, hands and knees | `chest` |
| `prone.incline` | Face down, head higher than hips, 15–60° (hands raised) | `chest` |
| `prone.decline` | Face down, head lower than hips, 15–60° (feet raised) | `chest` |
| `prone.pike` | Face down, hips highest, hands and feet down | `feet`, `hands` |
| `side-lying` | On one side: lying, or a side plank | — |
| `hanging` | Held up by the hands or arms, feet off the floor | `hands` |
| `inverted` | Upside down, head lowest: handstand, headstand | `hands` |

Rules:

- Write the orientation at the start of the first phase.
- A forward hinge held for the whole set is `standing.bent`. A hinge where the trunk moves, as in a deadlift or a swing, starts `standing`.
- Orientation follows the trunk: on hands and knees is `prone`, and `kneeling` means the trunk is upright.
- Sitting on the floor leaning back 30–60° (V-sit, Russian twist) is `supine.incline`.
- On a machine, write the body's position: a seated leg extension is `seated`, a lying leg curl `prone`, a leg press `supine.incline`, a row machine with a chest pad `seated.chest`. It is the same code as the machine's posture in its equipment key.
- When the rep ends in a different orientation from its start, write both: a get-up from lying is `o:supine>standing`. A rep that goes down and comes back, like a burpee, is just its start.

### Moving end (`k`)

| Code | Meaning |
|---|---|
| `limbs` | The limb end moves (the default) |
| `trunk` | The trunk end moves and the legs stay put: sit-up, crunch, bridge, hip thrust, back extension, Nordic curl |
| `both` | Both ends move toward each other: V-up, jackknife, tuck-up |

Rules:

- Write `k` only for trunk work where the trunk end or both ends move. Every other exercise leaves it out.

### Footwork (`f`)

| Code | Meaning |
|---|---|
| `level` | Feet planted level (the default) |
| `split` | Feet planted in a split stance, one in front of the other |
| `step.fwd` `step.back` `step.side` | Each rep steps forward, back or to the side, and returns |
| `step.cross` | Each rep steps back and across behind the other leg (curtsy), and returns |
| `travel.fwd` `travel.back` `travel.side` | The body travels forward, backward or sideways and doesn't return each rep |

Rules:

- A lunge with no direction word steps forward; a split squat stays in `split`; a walking lunge travels.
- Work in place, or on a treadmill or other cardio machine, leaves `f` out.
- `level` is written only inside a sequence: a split jerk is `f:level>split`.

### Support (`s`)

Support names each surface with its [equipment code](#equipment-in-an-exercise-key): a support from the equipment key's [form tables](./equipment-key.md#form-f), such as `floor`, `bench`, `box` or `bar.fixed`, or any load code except `none`. After the surface come the [body points](#body-points) listed under load.

Rules:

- Write each surface that bears the body's weight, or that a limb is braced on, beyond what the orientation implies. After the surface, write `@` and the points on it, leaving out the points the orientation implies.
- Never write a bare floor, a mat, the seat or bench under a seated body, or a machine's own seat and pads. An unstable seat (`ball.stab`, `dome`, `board.bal`, `roller.foam`) is written.
- When the trunk rests on nothing, as in a plank or a push-up, list every point that bears weight: `s:floor@feet,forearms`. A face-up body hanging from its hands keeps `floor@feet` too: an inverted row is `s:bar.fixed@hands+floor@feet`.
- Feet on the floor are never written under a seated body, or under a face-up body lying on a bench, ball or roller. Feet on anything else are written: a seated exercise with the feet on a ball keeps `ball.stab@feet`.
- Surfaces under different points are separate items: feet on a ball and hands on the floor is `s:ball.stab@feet+floor@hands`.
- A box, step, bench or platform under raised hands or feet is `box`, unless the exercise names the surface.
- `dome` is a BOSU with the side not stated. Write `dome.up` or `dome.down` when the side is known.
- Equipment that only loads the body goes in `l`, never in `s`.

### Load (`l`)

Load names the equipment that loads the working muscles by its [equipment code](#equipment-in-an-exercise-key), or writes `none` for body weight. After each code come `@` and a hold point.

#### Body points

A hold point is one of the body points. The same body points follow `@` in support, and an [equipment key](./equipment-key.md#load-interface-l) writes a machine's load interface with them.

| Body point | Meaning |
|---|---|
| `hands` | The hands, or one hand: at the sides, at arm's length, by a handle; a machine's handles or bar |
| `forearms` | The forearms, elbows bent: an elbow plank, or a machine's forearm pads |
| `elbows` | The crook of the elbows (Zercher) |
| `arms` | The upper arms: a preacher pad, or a machine's arm pad on the upper arm or elbow |
| `shoulders` | The shoulders: the front rack or one shoulder, or a machine's shoulder pads |
| `chest` | The chest: a load held against it (goblet), or a chest pad |
| `back` | The back: a bar across the upper back (back squat), or a back pad |
| `hips` | The front of the hips: a load across them (hip thrust), or a machine's hip pad or belt |
| `waist` | Hung from a belt at the waist |
| `seat` | The buttocks: sitting down onto a box or bench, or a machine's moving seat |
| `thighs` | On or around the thighs, or a machine's thigh pad |
| `knees` | At or around the knees, or a machine's knee pad or platform |
| `shins` | The shins |
| `calves` | The calves, the back of the lower leg |
| `ankles` | At or just above the ankles: a strap, a cuff, or a machine's pad on the lower leg |
| `feet` | The feet, or one foot: on the floor, a foot plate or pedals |
| `head` | The head or forehead, or a machine's head pad |

Two hold points are not body points, and are written only in load:

| Hold point | Meaning |
|---|---|
| `overhead` | Held in straight arms overhead for the whole rep |
| `assist` | The implement takes part of the body weight: an assist band or an assisted machine |

Rules:

- List every piece of equipment that loads the working muscles, each with `@` and where it is held: `l:bar.straight@back`.
- `none` means no equipment. It stands alone and takes no hold point: a weighted dip is `l:plate@waist`, not `none` beside a plate.
- A strength machine is `mac`. It has no more specific code, because the exercise's own motion already says what the machine guides. A cardio machine is `erg`, or `erg.` and its motion when that is known: `erg.row`. The record's [equipment key](./equipment-key.md#keys-in-records) says which machine.
- A support code is never written in `l`.
- A band whose type isn't named is `band`. A named type takes its child code: a long loop band is `band.loop`. A band is held where it presses or pulls on the body. Where it is anchored is not written.
- Leave the count out when it is the usual one, and write `*n` only when it differs. A one-hand implement (`bell.dumb`, `bell.kettle`, `plate`, `club`) is one per working hand; every other code is one. At the chest, back, hips or waist any implement is one: a goblet squat with one dumbbell is `l:bell.dumb@chest`. One kettlebell held in both hands is `bell.kettle*1@hands`.
- Write `?` for the part you don't know: `?@chest` when the implement isn't known, `bell.kettle@?` when the hold point isn't, `l:?` when not even that much is.

### Sides (`x`)

| Code | Meaning |
|---|---|
| `b` | Both limbs work together, or the movement has no sides (the default) |
| `u` | One side does every rep of the set, then the other side |
| `a` | The sides take turns rep by rep |
| `rc` | Both sides move at once in opposite directions: walking, flutter kicks, mountain climbers |
| `@arms` `@legs` | Scope: the pattern applies to the arms or to the legs |

Rules:

- One side then the other (`u`) and turns rep by rep (`a`) are different exercises.
- Add a scope only when the motion doesn't already imply it. A lunge's legs are implied, so it is `x:u`, not `x:u@legs`.
- When the arms and the legs follow different patterns, write one item per scope: a one-arm carry is `x:rc@legs+u@arms`.
- Movements that only rotate or side-bend the trunk or neck don't take `x`.
- A stretch, roll or hold done on one limb, then the other, is `x:u`.

### Grip and stance (`g`)

| Code | Meaning |
|---|---|
| `pr` | Pronated: palms down or away (overhand) |
| `su` | Supinated: palms up or toward you (underhand) |
| `ne` | Neutral: palms facing each other (hammer) |
| `mx` | Mixed: one hand over, one under |
| `w-t` `w-n` `w-m` `w-w` | Grip width: hands touching, narrow, medium (the default), wide |
| `st-n` `st-m` `st-w` | Stance: narrow, medium (the default), wide |

Rules:

- The usual hand orientation is `su` when every action in the motion is `el.flex` (a curl), and `pr` otherwise. Write a hand code only when it differs.
- Join one position's elements with `+`: `g:ne+w-n`. A grip that changes within the rep is a sequence: `g:su>pr`.
- Width applies to hands on an implement and on a support: a diamond push-up is `w-t`.
- Stance is written only for a standing start, or when the feet push a machine's foot plate.
- A grip the implement forces is still the grip: a rope attachment is `ne`. The trap bar's `ne` is the one exception and is never written.

### Range and start (`r`)

| Code | Meaning |
|---|---|
| `partial` | Part of the usual range on purpose: half reps, pulses |
| `deep` | Deeper than the usual range |
| `deficit` | Standing on something to go deeper than usual |
| `from-floor` | Each rep starts with the load at rest on the floor |
| `from-top` | Starts standing with the load held, lowered without being set down (a hang, above the knee) |
| `from-top.knee` | A hang that starts at or below the knee. A child of `from-top` |
| `from-pins` | Each rep starts from pins, blocks or a rack above the floor |
| `from-drop` | Each rep starts by stepping off a box and landing (depth jump) |

Rules:

- `partial` and `deep` contradict each other. A key carries at most one start code.
- Write a start code only where it isn't the movement's usual start: a deadlift starts from the floor, so `from-floor` is never written for it.
- Full range is never written.

### Held posture (`h`)

| Code | Meaning |
|---|---|
| `none` | The limbs that don't work do what the movement implies (the default) |
| `arms.oh` | Arms held straight overhead, hands empty |
| `arms.fwd` | Arms held straight forward from the shoulders, hands empty |
| `arms.side` | Arms held out to the sides |
| `arms.cross` | Arms crossed on the chest |
| `hands.head` | Hands behind or on the head (prisoner) |
| `el.bent` | Working elbows held bent at about 90° |
| `ua.oh` | Upper arms held up beside the head while the elbows work (overhead triceps extension) |
| `ua.side` | Upper arms held out from the sides, elbows flared, while the elbows work |
| `leg.fwd` | Free leg held straight in front |
| `leg.back` | Free leg held behind |
| `legs.l` | Legs held straight at about 90° to the trunk |
| `kn.bent` | Knees held bent while the hips or arms work (hanging knee raise) |
| `trunk.fwd` | Trunk held leaning forward where the orientation doesn't already say so (chest dip) |

Rules:

- Write the posture of limbs that hold still while others work, when it differs from what the movement implies. A squat with the hands behind the head is `h:hands.head`; a plain squat leaves `h` out.

### Line of pull (`p`)

| Code | Meaning |
|---|---|
| `usual` | The line the movement implies (the default) |
| `hi` | A cable or band anchored higher than usual for the movement |
| `lo` | Anchored lower than usual |
| `behind` | The load or the body passes behind the head or trunk (behind-the-neck press) |
| `side` | The load pulls from one side, the body side-on to the anchor |
| `neck` | The load comes down to the neck or chin instead of the chest |
| `double` | A rope passes under the feet twice in each jump (double under) |

Rules:

- Write `p` only when the line differs from the movement's usual one. A high-to-low cable fly is `p:hi`; a low-to-high fly is `p:lo`.
- The usual anchor is low for a curl, raise, upright row, shrug, kickback, pull-through or hip exercise; high for a pushdown, pulldown, straight-arm pulldown, face pull, kneeling crunch or woodchop; in the middle for a row, fly, crossover, chest press, rotation or overhead extension; and from the side for a Pallof press.

### Accessory (`a`)

The accessory codes are the accessory codes of the equipment key, listed in its [form tables](./equipment-key.md#form-f), and `partner`.

| Code | Meaning |
|---|---|
| `none` | No accessory |
| `strap.stretch` | A strap, belt, towel, rope or loop band used to pull or hold a limb in a stretch |
| `partner` | A partner who holds, resists or assists |
| Any other accessory code | `belt.lift`, `strap.lift`, `mat` and the rest |

Rules:

- An accessory never loads the working muscles and never bears weight. Load goes in `l`, support in `s`.
- An accessory code names the same equipment as its equipment key: `a:strap.stretch` is `FXE=1.0S/k:acc/f:strap.stretch`. A partner is a person, not equipment, and has no equipment key.
- A handle or bar on a cable is part of the station, not an accessory.
- `a` is the extended layer: a key that carries it has the flag `N`. It is compared only when both keys carry it; when only one does, that key is more specific.

## Symbols

Everything in a key that isn't a code is a symbol.

| Symbol | Meaning | Example |
|---|---|---|
| `/` | Separates layers | `o:standing/l:none` |
| `:` | Separates a layer letter from its value | `o:standing` |
| `.` | Joins a joint to its action, or a code to a more specific child | `el.flex`, `standing.bent`, `erg.row` |
| `+` | Joins items that go together: actions in one phase, surfaces, implements, grip elements, range codes, sides items, held codes | `m:hip.ext+kn.ext` |
| `>` | A sequence in rep order: phases, start and end orientation, footwork or grip changes | `g:su>pr` |
| `\|` | Two parts of one phase at the same time: parts of different kinds, or two limbs taken in opposite directions in a stretch | `m:=sp.flex\|hip.ext`, `m:%hip.ext\|%hip.flex` |
| `@` | Where: the points on a surface, the hold point of the equipment, the scope of a sides code | `l:bell.dumb@hands` |
| `,` | Several body points on one surface | `s:floor@feet,hands` |
| `*n` | Equipment count, written only when it differs from the usual count | `l:bell.kettle*1@hands` |
| `*` | A whole layer generic on purpose: the exercise may be done either way | `o:*` |
| `?` | Unknown. Matches anything and never contradicts | `o:?`, `bell.kettle@?`, `sh.?` |
| `-` | After an action: a short-range drive on purpose | `m:el.ext+hip.ext-+kn.ext-+sh.flex` |

The motion prefixes go before a part of `m` and set its kind.

| Prefix | Kind | Example |
|---|---|---|
| none | A normal moving phase | `m:el.flex` |
| `^` | Ballistic: the phase ends with the body in flight or the implement released. Only real flight or release: Olympic lifts and cyclic phases never take it. An action done in the air is the next phase | `m:^ank.pf+hip.ext+kn.ext`, a jump squat; `m:^el.ext+sh.hadd>sh.hadd`, a clap push-up |
| `~` | Cyclic: continuous cycles with no rep boundary; write the driving half of one cycle. `~0` is rolling on a foam roller, with no direction | `m:~hip.flex`, mountain climbers |
| `=` | Held under effort for the whole set; write what the muscles push toward. `=0` is a balance hold with no direction | `m:=sp.flex`, a plank |
| `%` | Static stretch: the directions the joints are taken to, held at end range | `m:%ank.df+kn.ext`, a calf stretch |
| `&` | Dynamic stretch: taken to end range and released, again and again | `m:&hip.flex`, a forward leg swing |

`?` may stand for a whole layer, a piece of equipment, a hold point, a surface, a body point, a joint's direction or a whole phase. An open-ended "and possibly more" (`+?`) is not allowed: write the actions you know, or `?` for the whole phase.

## Equipment in an exercise key

An exercise key and an [equipment key](./equipment-key.md#equipment-keys-in-exercise-keys) share three lists of codes, so an exercise key leads straight to the key of its equipment, and a machine's key says how the body sits on it in the words an exercise key uses.

| List | In an exercise key | In an equipment key | Listed under |
|---|---|---|---|
| Equipment codes | The equipment in load (`l`) and support (`s`), and the accessory (`a`) | Kind (`k`) and form (`f`) | The equipment key's [form tables](./equipment-key.md#form-f) |
| Body points | After `@` in load and support | A machine's load interface (`l`) | [Body points](#body-points) |
| Body positions | Orientation (`o`) | A machine's posture (`s`) | [Orientation](#orientation-o) |

The rowing machine below shows all three: the rowing machine is held `@hands` and starts `seated`, and its equipment key writes `l:hands` and `s:seated`.

<figure className="key-anatomy">
  <div className="key-pair">
    <div>
      <div className="key-pair__title">Standing dumbbell curl</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXI</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">header</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-code">el</span><span className="ka-sym">.</span><span className="ka-code">flex</span></code>
          <span className="key-anatomy__label">motion</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">o</span><span className="ka-sym">:</span><span className="ka-code">standing</span></code>
          <span className="key-anatomy__label">orientation</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">bell</span><span className="ka-sym">.</span><span className="ka-code">dumb</span></span><span className="ka-sym">@</span><span className="ka-code">hands</span></code>
          <span className="key-anatomy__label">load</span>
        </span>
      </div>
    </div>
    <div>
      <div className="key-pair__title">Dumbbell</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXE</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">header</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">k</span><span className="ka-sym">:</span><span className="ka-code">imp</span></code>
          <span className="key-anatomy__label">kind</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">f</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">bell</span><span className="ka-sym">.</span><span className="ka-code">dumb</span></span></code>
          <span className="key-anatomy__label">form</span>
        </span>
      </div>
    </div>
  </div>
  <div className="key-pair">
    <div>
      <div className="key-pair__title">Rowing</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXI</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">header</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">m</span><span className="ka-sym">:~</span><span className="ka-code">el</span><span className="ka-sym">.</span><span className="ka-code">flex</span><span className="ka-sym">+</span><span className="ka-code">hip</span><span className="ka-sym">.</span><span className="ka-code">ext</span><span className="ka-sym">+</span><span className="ka-code">kn</span><span className="ka-sym">.</span><span className="ka-code">ext</span><span className="ka-sym">+</span><span className="ka-code">sh</span><span className="ka-sym">.</span><span className="ka-code">ext</span></code>
          <span className="key-anatomy__label">motion</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">o</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">seated</span></span></code>
          <span className="key-anatomy__label">orientation</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">erg</span></span><span className="ka-sym">.</span><span className="ka-shared"><span className="ka-code">row</span></span><span className="ka-sym">@</span><span className="ka-shared"><span className="ka-code">hands</span></span></code>
          <span className="key-anatomy__label">load</span>
        </span>
      </div>
    </div>
    <div>
      <div className="key-pair__title">Rowing machine</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXE</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">header</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">k</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">erg</span></span></code>
          <span className="key-anatomy__label">kind</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">c</span><span className="ka-sym">:</span><span className="ka-code">rail</span></code>
          <span className="key-anatomy__label">track</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">hands</span></span></code>
          <span className="key-anatomy__label">load interface</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">s</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">seated</span></span></code>
          <span className="key-anatomy__label">posture</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">row</span></span></code>
          <span className="key-anatomy__label">motion</span>
        </span>
      </div>
    </div>
  </div>
  <figcaption>
    Each exercise key on the left, the key of its equipment on the right. <span className="ka-shared">Outlined</span>: the codes the two share.
  </figcaption>
</figure>

| Kind | The exercise code is | An exercise key, and the key of its equipment |
|---|---|---|
| No equipment (`none`) | The kind: `none` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none`<br />`FXE=1.0S/k:none` |
| Implement (`imp`) | The form `f`: `bar.straight` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back`<br />`FXE=1.0S/k:imp/f:bar.straight` |
| Support (`sup`) | The form `f`: `bench` | `FXI=1.0S/m:el.ext+sh.ext/o:seated/s:bench@hands/l:none`<br />`FXE=1.0S/k:sup/f:bench` |
| Station (`stn`) | The form `f`: `cable` | `FXI=1.0S/m:el.ext/o:standing/l:cable@hands`<br />`FXE=1.0S/k:stn/f:cable` |
| Accessory (`acc`) | The form `f`, in the accessory layer `a` only: `strap.stretch`. An accessory is never the main equipment | `a:strap.stretch` ↔ `FXE=1.0S/k:acc/f:strap.stretch` |
| Strength machine (`mac`) | The kind `k`: `mac` | `FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands`<br />`FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down` |
| Cardio machine (`erg`) | The kind `k`: `erg`; or the kind, `.` and the motion `m`: `erg.row` | `FXI=1.0S/m:~el.flex+hip.ext+kn.ext+sh.ext/o:seated/l:erg.row@hands`<br />`FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row` |

A form code stands for one equipment key: `bar.straight` is `FXE=1.0S/k:imp/f:bar.straight`. The form codes are listed in the equipment key's [form tables](./equipment-key.md#form-f). A kind code stands for every key of that kind, with the other layers open: `mac` is `FXE=1.0S/k:mac/l:?/s:?/m:?`. `erg.row` is `FXE=1.0S/k:erg/c:?/l:?/s:?/m:row`: any cardio machine whose motion is `row`. The cardio motions are listed under the equipment key's [motion](./equipment-key.md#motion-m).

Every form code may be written in an exercise key, children included: `band.loop` is a long loop band, and `band` covers it. The record's `fxe` names the exact equipment, and is the code's key or more specific than it. The rowing machine above is more specific than `erg.row`.

An accessory is never the exercise's [main equipment](./equipment-key.md#checking-an-exercise-against-its-equipment). The accessory code in the exercise key's `a` layer is the equipment key's accessory code: `a:strap.stretch` is `FXE=1.0S/k:acc/f:strap.stretch`. A strap stretch, `FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:none/x:u/a:strap.stretch`, has `l:none`, so its main equipment is `FXE=1.0S/k:none`.

A support code is written only in `s`, and an accessory code only in `a`. Every other code except `none` may be written in `l` or in `s`. The exercise key adds where the equipment is held or touched (`@`) and, in `l`, how many there are (`*n`): see [Load](#load-l).

On a machine, the two keys agree: the machine's posture is the exercise's start orientation, and its load interface includes the point where the exercise holds `mac` or `erg` (`@overhead` is in the hands). The `@assist` hold point isn't checked.

The keys differ in three ways, on purpose:

- **A strength machine has no specific code.** A cardio machine can be `erg.row`, because the cycle is the movement. A strength machine is only `mac`, because the exercise's own motion carries what the machine guides.
- **A layer left out reads differently.** In an exercise key it is at its default, which is a value, except the accessory layer, which, left out, is not stated. In an equipment key it is unknown, `?`.
- **Each key's layer letters are its own.** Only `m` is motion in both. In an exercise key `l` is load and `s` support; in an equipment key `l` is the load interface and `s` the posture.

The two keys never record the same fact twice. Grip, sides, range, footwork, pulley height, bench angle, the hold point and the count belong to the exercise key. What the equipment is, its fixed geometry and how it is built belong to the equipment key.

[Checking an exercise against its equipment](./equipment-key.md#checking-an-exercise-against-its-equipment) shows how the two keys are checked against each other.

## Worked examples

Each example starts from a plain description and decides one layer at a time. A layer that isn't listed is at its default.

### Standing dumbbell curl

Standing, a dumbbell in each hand, both elbows bend together, palms up.

| Layer | Decision | Written |
|---|---|---|
| `m` | The elbows bend against the load; the shoulders hold still | `m:el.flex` |
| `o` | Standing | `o:standing` |
| `l` | Dumbbells in the hands. Two is the usual count for both arms working, so no count | `l:bell.dumb@hands` |
| `x` | Both arms together: the default | — |
| `g` | Palms up is the usual grip when every action is `el.flex` | — |

`FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`

Its equipment is the [dumbbell](./equipment-key.md#dumbbell), `FXE=1.0S/k:imp/f:bell.dumb`.

### Barbell back squat

Standing, a barbell across the upper back, hips and knees bend and straighten through a full squat.

| Layer | Decision | Written |
|---|---|---|
| `m` | Standing up extends the hips and the knees together. The ankles don't rise onto the toes, so they aren't written | `m:hip.ext+kn.ext` |
| `o` | Standing | `o:standing` |
| `l` | A barbell across the upper back | `l:bar.straight@back` |
| `g` `r` | Medium stance and full range: the defaults | — |

`FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back`

### Lat pulldown

Seated at a pulldown machine, an overhand grip at about shoulder width, the bar pulled from overhead down to the chest.

| Layer | Decision | Written |
|---|---|---|
| `m` | The elbows bend, and with an overhand grip the arms come down from overhead out at the sides | `m:el.flex+sh.add` |
| `o` | Seated | `o:seated` |
| `s` | The machine's seat and thigh pad are never written | — |
| `l` | A pulldown machine, held in the hands | `l:mac@hands` |
| `g` | Overhand at medium width is the usual grip for this motion | — |

`FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands`

Its equipment is the [lat pulldown machine](./equipment-key.md#lat-pulldown-machine), `FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down`.

A close neutral-grip pulldown brings the hands down in front of the face instead, so the shoulder action and the grip both change:

`FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mac@hands/g:ne+w-n`

### Plank

Face down on the forearms and toes, body straight, held for time.

| Layer | Decision | Written |
|---|---|---|
| `m` | A hold. The trunk muscles push against the hips sagging, which is the direction of trunk flexion | `m:=sp.flex` |
| `o` | Face down, trunk horizontal | `o:prone` |
| `s` | The trunk rests on nothing, so every point that bears weight is listed | `s:floor@feet,forearms` |
| `l` | No equipment | `l:none` |

`FXI=1.0S/m:=sp.flex/o:prone/s:floor@feet,forearms/l:none`

### Walking lunge

Standing, a dumbbell in each hand, stepping forward into a lunge with one leg, then the other, moving down the room.

| Layer | Decision | Written |
|---|---|---|
| `m` | Rising out of the lunge extends the front hip and knee | `m:hip.ext+kn.ext` |
| `o` | Standing | `o:standing` |
| `f` | Each step travels forward and doesn't come back | `f:travel.fwd` |
| `l` | Dumbbells in the hands. The sides pattern is on the legs, so both hands stay loaded: two, the usual count | `l:bell.dumb@hands` |
| `x` | The legs take turns rep by rep. The motion is legs only, so no scope | `x:a` |

`FXI=1.0S/m:hip.ext+kn.ext/o:standing/f:travel.fwd/l:bell.dumb@hands/x:a`

### Kettlebell swing

Standing, one kettlebell held in both hands, swung from between the legs to chest height by a snap of the hips.

| Layer | Decision | Written |
|---|---|---|
| `m` | The hips extend. The knees keep a fixed bend and the arms only swing, so neither is written. The bell never leaves the hands, so there is no `^` | `m:hip.ext` |
| `o` | The trunk moves through the hinge, so the rep starts `standing`, not `standing.bent` | `o:standing` |
| `l` | A kettlebell is one per working hand as usual; here one bell is shared by both hands | `l:bell.kettle*1@hands` |

`FXI=1.0S/m:hip.ext/o:standing/l:bell.kettle*1@hands`

## Keys in records

An exercise record carries its key in `fxi`. Each muscle reference carries the muscle's `fxm` and its category's `fxmg`, beside its `id`, `name` and `categoryId`. Each equipment reference carries the same `fxe` value as the [equipment record](./equipment-key.md#keys-in-records), beside its `id` and `name`:

```json fds:ignore exercise record excerpt showing the fxi, fxm, fxmg and fxe fields
{
  "exerciseId": "ex.dumbbellCurl",
  "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands",
  "canonical": { "name": "Dumbbell Curl", "slug": "dumbbell-curl" },
  "targets": {
    "primary": [
      { "id": "mus.bicepsBrachii", "name": "Biceps Brachii", "categoryId": "cat.upperArmFront", "fxm": "FXM=1.0/biceps-brachii", "fxmg": "FXMG=1.0/arm.anterior" }
    ],
    "secondary": [
      { "id": "mus.brachialis", "name": "Brachialis", "categoryId": "cat.upperArmFront", "fxm": "FXM=1.0/brachialis", "fxmg": "FXMG=1.0/arm.anterior" }
    ]
  },
  "equipment": {
    "required": [
      { "id": "eq.dumbbell", "name": "Dumbbell", "fxe": "FXE=1.0S/k:imp/f:bell.dumb" }
    ]
  }
}
```

A workout item refers to the exercise the same way, with `fxi` beside its `id` and `name`:

```json fds:ignore workout item excerpt showing the fxi field
{
  "id": "i1",
  "exercise": {
    "id": "ex.dumbbellCurl",
    "name": "Dumbbell Curl",
    "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands"
  },
  "scheme": { "pattern": "straight", "sets": 3 },
  "reps": { "kind": "fixed", "value": 10 }
}
```

## Comparing two exercise keys

Comparison goes layer by layer. A layer left out takes its default, which is a value; `?` and `*` match any value, and a parent code covers its children.

- **Same**: the two keys are written identically and contain no `?` or `*`.
- **More specific**: no layer contradicts, and one key states something the other leaves open, or names a child where the other names its parent.
- **Different**: at least one layer can't match.

| Key A | Key B | Result |
|---|---|---|
| `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands` | `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands` | Same |
| `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands` | `FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands` | A is more specific: it states the orientation B leaves open |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none/h:hands.head` | Different: A's held posture is the default, B's is hands behind the head |

When each key leaves open something the other states, neither is more specific, and the two may still describe the same exercise.

An identical key is a strong match, and anything else gives a short list for a person to confirm. See [Using keys](../structural-keys.md#using-keys) for how to keep confirmed links.

## Finding related items

Keys that share codes form families, and nobody has to declare them. Search for a value in one layer and you find every exercise that shares it, in any catalog that writes keys.

| Search | Finds |
|---|---|
| `m` is `hip.ext+kn.ext` | The same motion: squats, lunges, step-ups and leg presses, whatever the load |
| `l` holds a `bell.*` code | The same equipment family: exercises loaded with dumbbells, kettlebells or circus dumbbells |
| `l` holds `mac` | Every exercise done on a strength machine |
| `o` is `hanging` | The same orientation: pull-ups, hanging leg raises, dead hangs |
| `m` holds `sh.ext` | Rows and dips, and through its child `sh.ext.oh`, chin-ups, pullovers and close-grip pulldowns. A parent code finds its children |
| `l` holds `erg` | Every cardio machine exercise, through the children `erg.row`, `erg.gait` and the rest |
| `m` holds `hip.flex` | The category `FXMG=1.0/a:hip.flex`, and through it the muscles that flex the hip: psoas major, iliacus and rectus femoris |

`bell.*` means any code that starts with `bell.`. Layers combine: `m` is `hip.ext+kn.ext` and `l` holds `bar.straight@back` finds back squats and lunges with a barbell on the back. Equipment keys form families the same way (see [Finding related items](./equipment-key.md#finding-related-items) on the equipment key page).

An "is" search is the same operation as comparing for "more specific": write it as a key, with `?` in every layer it leaves open. A "holds" search looks for a code, or a child of it, anywhere in the layer, and isn't a compare. For example:

`FXI=1.0S/m:hip.ext+kn.ext/o:?/k:?/f:?/s:?/l:?/x:?/g:?/r:?/h:?/p:?`

Every exercise the first search finds is more specific than this key. The barbell back squat and the walking lunge above both are.

## Building keys

You can write a key by hand by following this page, or generate one with the [FDS Encoder](../../tools/encoder/index.md).
