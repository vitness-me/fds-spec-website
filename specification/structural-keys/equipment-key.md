# Equipment Key

The equipment key is the structural key of a piece of equipment. It sits in the `fxe` field and records what kind of equipment it is and its form: for a free object or a surface, which one it is; for a machine, where it meets the body, the position it puts the body in and the motion it guides. This page shows how a key is put together, what every layer and code means, and how two keys compare.

The header `FXE=1.0` is the key's version, and the code lists come with the FDS release that publishes them. A later release may add codes or split a code into more specific children, but it never changes what a code means, so a key written today stays valid.

The code lists are published as registries: the kinds, forms and layer codes of this key in [`equipment-key.registry.json`](https://spec.vitness.me/registries/equipment-key.registry.json), and the [body points](https://spec.vitness.me/registries/body-points.registry.json) and [body positions](https://spec.vitness.me/registries/body-positions.registry.json) it shares with the exercise key.

## Anatomy of the key

A plate-loaded leg press, with the sled on a 45° track, has this key:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXE</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">N</span></code>
      <span className="key-anatomy__label">header</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">k</span><span className="ka-sym">:</span><span className="ka-code">mac</span></code>
      <span className="key-anatomy__label">kind</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-code">feet</span></code>
      <span className="key-anatomy__label">load interface</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">s</span><span className="ka-sym">:</span><span className="ka-code">supine</span><span className="ka-sym">.</span><span className="ka-code">incline</span></code>
      <span className="key-anatomy__label">posture</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-code">push</span><span className="ka-sym">.</span><span className="ka-code">fwd</span></code>
      <span className="key-anatomy__label">motion</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">r</span><span className="ka-sym">:</span><span className="ka-code">plate</span></code>
      <span className="key-anatomy__label">drive</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">c</span><span className="ka-sym">:</span><span className="ka-code">line</span></code>
      <span className="key-anatomy__label">constraint</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">g</span><span className="ka-sym">:</span><span className="ka-code">incl</span></code>
      <span className="key-anatomy__label">guide angle</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-letter">Layer letter</span> · <span className="ka-code">code</span> · <span className="ka-sym">symbol</span> · <span className="ka-flag">flag</span>
  </figcaption>
</figure>

`FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl`

| Part | Text | What it says |
|---|---|---|
| Key type | `FXE` | This is an equipment key. |
| Version | `1.0` | Major version 1, revision 0. |
| Flag | `N` | The key carries at least one extended layer. |
| Kind | `k:mac` | A strength machine, built for one movement. |
| Load interface | `l:feet` | The moving part meets the body at the feet, on a foot plate. |
| Posture | `s:supine.incline` | The user lies face up on an inclined back pad, head higher than hips. |
| Motion | `m:push.fwd` | The foot plate is pushed away from the front of the trunk. |
| Drive | `r:plate` | The resistance is loaded plates. |
| Constraint | `c:line` | The moving part runs on a straight track. |
| Guide angle | `g:incl` | The track is inclined. |

The first four layers are the standard part of the key, `FXE=1.0S/k:mac/l:feet/s:supine.incline/m:push.fwd`. It says what any 45° leg press says; a seated leg press, with an upright seat, is `s:seated`. The last three are extended layers: build details of this machine that an exercise done on it doesn't depend on. The `fxe` field holds the whole key (see [Keys in records](#keys-in-records)).

Layers are separated by `/`. Each layer is its letter, a `:` and a value made of codes and symbols.

## Dimensions and layers

The kind decides which layers a key has. Each layer records one dimension of the equipment.

| Letter | Layer | Dimension it records | Kinds | Standard or extended |
|---|---|---|---|---|
| `k` | Kind | What sort of equipment it is | All | Standard, always first |
| `f` | Form | Which object, surface, accessory or station it is | `imp` `sup` `acc` `stn` | Standard |
| `c` | Track | The path a cardio machine's moving parts follow | `erg` | Standard |
| `l` | Load interface | Where the moving part meets the body | `mac` `erg` | Standard |
| `s` | Posture | The position the machine puts the body in | `mac` `erg` | Standard |
| `m` | Motion | The motion a machine guides, or the cycle a cardio machine repeats | `mac` `erg` | Standard |
| `r` | Drive | What makes the resistance | `imp` `stn` `mac` `erg` | Extended |
| `c` | Constraint or compliance | How a machine's moving part is guided, or how an object or surface gives under the body | `imp` `sup` `stn` `mac` | Extended |
| `g` | Guide angle | The angle of a machine's track | `mac` | Extended |
| `a` | Design | Design features of a machine or station | `stn` `mac` | Extended |

The letter `c` has two meanings. On a cardio machine it is the track, a standard layer. On every other kind it is the extended constraint or compliance layer. A cardio machine has no extended `c`.

Rules for every key:

- The first layer is always `k`. `k:none` and `k:?` take no other layer.
- A kind's standard layers are written in the order of the table: `f` for `imp`, `sup`, `acc` and `stn`; `l s m` for `mac`; `c l s m` for `erg`. When one isn't known, write `?` as its value: `s:?`.
- A layer left out reads `?`, unknown. An exercise key reads a layer left out as its default instead. The rules below say what to write when the description is silent.
- Extended layers follow the standard ones, in the order `r c g a`, and only when stated. A key that carries one has the flag `N` (`FXE=1.0N/…`); every other key has the flag `S`.
- A value the form already implies is dropped: a dumbbell is driven by gravity, so `r:grav` is never written for it. The form tables list what each form implies.
- Items joined by `+` are written in sorted order, so one piece of equipment always has one written form.

What belongs in the key:

- **Fixed geometry is equipment. Anything set per use belongs to the exercise.** Pulley height, bench angle, where a band is anchored, the grip, one limb or two, and seat height are all in the [exercise key](./exercise-key.md#dimensions-and-layers), and so is the handle attached, through the grip it gives.
- **Write the equipment, not the exercise done on it.** A calf raise done on a leg press uses a leg press, and the key is the leg press's.
- **A named machine wins.** When an exercise names the machine it is done on, that machine is the equipment, whatever the exercise does on it.
- **"Machine" alone means the machine built for the movement.** A description that says only "machine" means the machine built for the exercise's main movement: a machine leg curl is done on a leg curl machine. With no exercise to go by, "machine" is `FXE=1.0S/k:mac/l:?/s:?/m:?`.

The layers below are listed in key order. For each one: its codes, then its rules.

### Kind (`k`)

| Code | Meaning | Standard layers | Extended layers |
|---|---|---|---|
| `none` | No equipment: the body is the whole load | — | — |
| `imp` | Implement: a free object moved, held or worn | `f` | `r` `c` |
| `sup` | Support: a surface or frame the body rests on, hangs from or pushes against. It doesn't carry the load | `f` | `c` |
| `acc` | Accessory: a handle, strap, belt, mat, towel or marker. It never defines the exercise | `f` | — |
| `stn` | Station: a guide or anchor used for many movements: cable column, Smith machine, landmine | `f` | `r` `c` `a` |
| `mac` | Strength machine: a guided mechanism with fixed body contacts, built for one movement | `l` `s` `m` | `r` `c` `g` `a` |
| `erg` | Cardio machine: repeats whole cycles | `c` `l` `s` `m` | `r` |

Rules:

- A way of loading is not equipment. "Weighted" with no form named is `FXE=1.0S/k:imp/f:?`. "Assisted" with no implement, or "other", is `FXE=1.0S/k:?`.
- A cable column is a station. A seated cable row with its own seat, and a lat pulldown machine, are strength machines.

### Form (`f`)

The form is a code from the list for the key's kind. An exercise key names an implement, a support or a station with the same code, and an accessory with the same code in its accessory layer (see [Equipment keys in exercise keys](#equipment-keys-in-exercise-keys)).

**Implements (`imp`)**

| Code | Meaning | Implies |
|---|---|---|
| `bar.straight` | Barbell, Olympic or standard | `r:grav` |
| `bar.ez` | EZ curl bar | `r:grav` |
| `bar.trap` | Trap or hex bar | `r:grav` |
| `bar.axle` | Thick axle bar | `r:grav` |
| `bar.camber` | Cambered bar | `r:grav` |
| `bell.dumb` | Dumbbell | `r:grav` |
| `bell.kettle` | Kettlebell | `r:grav` |
| `bell.circus` | Circus dumbbell | `r:grav` |
| `ball.med` | Medicine ball | `r:grav` |
| `ball.slam` | Slam ball | `r:grav` |
| `bag.sand` | Sandbag | `r:grav` |
| `bag.heavy` | Hanging heavy bag | `r:grav` `c:swing` |
| `plate` | A weight plate held or worn on its own | `r:grav` |
| `chain` | Lifting chain | `r:grav` |
| `rope.battle` | Battle rope | `r:grav` |
| `rope.jump` | Jump rope | `r:none` |
| `band` | Elastic band or tube, type not stated | `r:elastic` |
| `band.loop` | Long loop band. A child of `band` | `r:elastic` |
| `band.mini` | Short loop band worn around the legs. A child of `band` | `r:elastic` |
| `band.tube` | Tube band with handles. A child of `band` | `r:elastic` |
| `sled` | Ground sled or prowler, pushed or dragged | `r:friction` |
| `tire` | Large tyre | `r:grav` |
| `hammer` | Sledgehammer | `r:grav` |
| `stone` | Atlas stone | `r:grav` |
| `log` | Strongman log | `r:grav` |
| `keg` | Keg | `r:grav` |
| `yoke` | Strongman yoke | `r:grav` |
| `frame.carry` | Farmer handles or a carry frame | `r:grav` |
| `car` | A car, lifted or pushed | `r:grav` |
| `wear.vest` | Weight vest | `r:grav` |
| `wear.ankle` | Ankle weight | `r:grav` |
| `club` | Club or mace | `r:grav` |
| `stick` | Dowel, broomstick or PVC pipe | `r:none` |
| `wheel` | Ab wheel | `r:none` `c:roll` |
| `roller.wrist` | Wrist roller | `r:grav` |
| `harness.head` | Head harness with a hanging load | `r:grav` |

**Supports (`sup`)**

| Code | Meaning | Implies |
|---|---|---|
| `floor` | The floor, or a mat on it | — |
| `wall` | A wall | — |
| `bench` | A bench, flat or adjustable | — |
| `box` | A box, step or platform | — |
| `chair` | A chair | — |
| `block` | Lifting blocks a bar starts from | — |
| `rack` | Power rack or squat stand, with its pins | — |
| `ball.stab` | Stability ball | `c:tilt` |
| `dome` | BOSU, side up not stated | `c:tilt` |
| `dome.up` | BOSU, dome side up. A child of `dome` | `c:tilt` |
| `dome.down` | BOSU, flat side up: the dome on the floor. A child of `dome` | `c:tilt` |
| `board.bal` | Balance or wobble board | `c:tilt` |
| `roller.foam` | Foam roller | `c:roll` |
| `slider` | Slider disc | `c:slide` |
| `strap.susp` | Suspension trainer | `c:swing` |
| `ring` | Gymnastic rings | `c:swing` |
| `rope.climb` | Climbing rope | `c:swing` |
| `bar.fixed` | Fixed overhead bar: pull-up bar | — |
| `bar.parallel` | Parallel dip bars | — |
| `bar.parallette` | Floor parallettes | — |
| `pad.preacher` | Preacher bench | — |
| `pad.hyper` | Back-extension bench, 45° or 90°, also used for side raises | — |
| `pad.ghd` | Glute-ham developer | — |
| `station.vkr` | Knee-raise station | — |
| `pole` | A vertical pole, post or rack upright gripped by the hands | — |
| `ball.massage` | Massage or lacrosse ball rolled under the body | — |

**Accessories (`acc`)**

| Code | Meaning |
|---|---|
| `handle` | Single D-handle |
| `handle.bar` | Straight or cambered cable bar |
| `handle.v` | V-bar or close-grip handle |
| `handle.rope` | Triceps rope |
| `strap.ankle` | Ankle cuff |
| `belt.dip` | Dip belt |
| `belt.lift` | Lifting belt |
| `strap.lift` | Lifting straps |
| `strap.stretch` | Stretching strap: a strap, belt, towel, rope or loop band used to pull or hold a limb in a stretch |
| `towel` | A towel used as a handle |
| `marker` | Cone, hurdle or floor marker |
| `board.press` | Board laid on the chest for partial presses |
| `mat` | Floor mat |

**Stations (`stn`)**

| Code | Meaning | Implies |
|---|---|---|
| `cable` | Cable column, crossover or functional trainer: a pulley set per exercise | `r:stack` `c:cable` |
| `smith` | Smith machine: a bar on fixed rails | `r:plate` `c:line` |
| `landmine` | Landmine: one end of a barbell in a floor pivot | `r:grav` `c:pivot` |

Rules:

- A general word takes the general code: "band" is `band`. Write a child only when the equipment names it: a long loop band is `band.loop`.
- A stretching strap is `FXE=1.0S/k:acc/f:strap.stretch`. An exercise key for a stretch done with it carries [`a:strap.stretch`](./exercise-key.md#accessory-a).
- A BOSU whose side isn't stated is `dome`. Write `dome.up` or `dome.down` when the side is named.

### Track (`c`)

The track is written only for a cardio machine.

| Code | Meaning |
|---|---|
| `belt` | A moving belt or revolving stairs |
| `link` | Linked pedals (stepper) |
| `loop` | A closed loop: cranks, elliptical |
| `rail` | A seat on a rail (rower) |
| `cable` | A cable pulled from above (ski machine) |
| `line` | A straight track (vertical climber) |

Each type of cardio machine writes its four standard layers like this:

| Machine | `c` | `l` | `s` | `m` |
|---|---|---|---|---|
| Treadmill | `belt` | `feet` | `standing` | `gait` |
| Stepmill (revolving stairs) | `belt` | `feet` | `standing` | `step` |
| Stair stepper (pedals) | `link` | `feet` | `standing` | `step` |
| Stair machine, stepper or stepmill not known | `?` | `feet` | `standing` | `step` |
| Upright or spin bike | `loop` | `feet` | `seated` | `cycle` |
| Recumbent bike | `loop` | `feet` | `supine.incline` | `cycle` |
| Stationary bike, upright or recumbent not known | `loop` | `feet` | `?` | `cycle` |
| Air bike, with moving arms | `loop` | `feet+hands` | `seated` | `cycle` |
| Elliptical | `loop` | `feet+hands` | `standing` | `glide` |
| Rowing machine | `rail` | `hands` | `seated` | `row` |
| Ski machine | `cable` | `hands` | `standing` | `ski` |
| Arm crank, seated | `loop` | `hands` | `seated` | `cycle` |
| Vertical climber | `line` | `feet+hands` | `standing` | `climb` |
| Ladder climber | `belt` | `feet+hands` | `standing` | `climb` |

Rules:

- A cardio machine of unknown type is `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?`.

### Load interface (`l`)

The load interface is written for a strength machine and a cardio machine. It is the body point where the machine's moving part meets the body, written with the [body points](./exercise-key.md#body-points) of the exercise key: `hands` for handles or a bar, `feet` for a foot plate or pedals, `ankles` for a pad on the lower leg. An exercise key on the machine holds `mac` or `erg` at one of these points (`@overhead` is in the hands). The `@assist` hold point isn't checked.

Rules:

- Join two interfaces with `+` only when both move the load: an elliptical is `l:feet+hands`.
- When nothing says otherwise, a machine's motion sets its interface:

  | Motion | Interface |
  |---|---|
  | `kn.flex`, `kn.ext`, `hip.flex` | `ankles` |
  | `el.*`, `sc.elev`, `sh.habd`, and every `push.*` or `pull.*` worked with the hands | `hands` |
  | `sh.hadd`, `sh.abd`, `sh.flex`, `sh.ext` | `arms` |
  | `hip.add`, `hip.abd` | `thighs` |
  | `sp.flex`, `sp.rot` | `chest` |
  | `sp.ext` | `back` |
  | `assist.up` | `knees`, or `feet` when the user stands on a platform |

- Some machines set their own: a leg press is `feet`; a hack squat, pendulum squat or V-squat `shoulders`; a belt squat `hips`; a calf raise machine `thighs` seated, `shoulders` standing and `hips` for a donkey calf raise, with the trunk on a pad; a glute kickback `feet`; a hip thrust machine `hips`; a reverse hyper `ankles`; a tibialis raise `feet`.

### Posture (`s`)

The posture is written for a strength machine and a cardio machine. It is the position the machine puts the body in, written with the [orientation codes](./exercise-key.md#orientation-o) of the exercise key: `seated`, `seated.chest`, `standing`, `supine.incline`, `prone`, `hanging` and the rest. An exercise key on the machine starts in that same orientation.

Rules:

- Write the position the machine puts the user in.
- Some machines fix it. Every leg press with an inclined back pad is `supine.incline`, and one with an upright seat is `seated`. A hack squat, pendulum squat, V-squat and belt squat are `standing`. A dedicated row machine is `seated.chest`, except a seated cable row with a foot plate, which is `seated`. A reverse-fly machine is `seated.chest`. A chest-supported T-bar row is `prone.incline`. An assisted pull-up or dip machine is `hanging`. A hip thrust machine is `supine` and a reverse hyper `prone`. A donkey calf raise machine is `standing.chest`. A glute kickback machine is `standing`, or `kneeling` when the description says the user kneels. A tibialis raise machine is `seated`.
- When nothing says otherwise: `seated.chest` for `sh.habd`; `seated` for `kn.ext`, `el.*`, the other `sh.*` motions, `sp.flex`, `sp.rot`, `hip.add`, `hip.abd`, `hip.flex`, every `push.*` worked with the hands, `pull.down` and `pull.backdown`; `standing` for `sc.elev`, `hip.ext` and `pull.up`. Otherwise write `s:?`: a leg curl or calf raise machine with no posture stated is `s:?`.

### Motion (`m`)

On a strength machine, the motion is what the machine's moving part guides, relative to the trunk.

A machine whose pivot lines up with one joint writes that joint action, in the codes of the exercise key's [motion layer](./exercise-key.md#motion-m): `kn.flex`, `kn.ext`, `el.flex`, `el.ext`, `sh.flex`, `sh.ext`, `sh.abd`, `sh.add`, `sh.hadd`, `sh.habd`, `sh.ir`, `sh.er`, `sc.elev`, `hip.flex`, `hip.ext`, `hip.abd`, `hip.add`, `sp.flex`, `sp.ext`, `sp.rot`, `sp.lflex`, `ank.pf`, `ank.df`, `nk.flex`, `nk.ext`, `nk.lflex`, `wr.flex` or `wr.ext`.

A machine that moves several joints writes a verb, `.` and the direction the load interface moves.

| Verb | Meaning |
|---|---|
| `push` | The moving part is pushed away |
| `pull` | The moving part is pulled toward the user |
| `assist` | The moving part helps lift the body |

| Direction | Meaning |
|---|---|
| `up` | Toward the head: shoulder press, hack squat, belt squat, deadlift machine |
| `down` | Toward the feet: pulldown, seated dip |
| `fwd` | Away from the front of the trunk: chest press, leg press |
| `back` | Toward the front of the trunk: row |
| `fwdup` | Forward and up: incline press |
| `fwddown` | Forward and down: decline press |
| `backdown` | Back and down: high row |

On a cardio machine, the motion is the cycle it repeats. An exercise key may name a cardio machine by it: `erg.row` is a cardio machine whose `m` is `row` (see [Equipment keys in exercise keys](#equipment-keys-in-exercise-keys)). A strength machine's motion gives no code in an exercise key: the exercise's own motion already says what the machine guides.

| Code | Meaning |
|---|---|
| `gait` | Walking or running on a belt |
| `cycle` | Pedalling or hand cranking |
| `step` | Stepping |
| `row` | Rowing |
| `ski` | A double-pole pull (ski machine) |
| `glide` | Elliptical glide |
| `climb` | Climbing with hands and feet |

Rules:

- Single-joint machines: a leg curl is `kn.flex`, a leg extension `kn.ext`, a biceps or preacher curl machine `el.flex`, a triceps extension machine `el.ext`, a pec deck `sh.hadd`, a reverse-fly machine `sh.habd`, a lateral raise machine `sh.abd`, a pullover machine `sh.ext`, a shrug machine `sc.elev`, an adductor `hip.add`, an abductor `hip.abd`, a leg or knee-raise crunch machine `hip.flex`, a glute kickback, hip thrust or reverse hyper `hip.ext`, an ab crunch machine `sp.flex`, a back extension machine `sp.ext`, a rotary torso `sp.rot`, a calf raise machine `ank.pf`, a tibialis raise `ank.df`, a neck machine `nk.flex`, `nk.ext` or `nk.lflex` by the direction the head moves, and a wrist curl machine `wr.flex`.
- Multi-joint machines: a shoulder press, hack squat or belt squat is `push.up`; a deadlift machine `pull.up`; a pulldown `pull.down`; a seated dip `push.down`; a chest press and a leg press `push.fwd`; a row `pull.back`; an incline press `push.fwdup`; a decline press `push.fwddown`; a high row `pull.backdown`; an assisted pull-up or dip `assist.up`.
- A leg press and a hack squat move the same joints. The interface, the posture and the direction tell them apart.
- A strength machine of unknown type is `FXE=1.0S/k:mac/l:?/s:?/m:?`.

### Extended layers (`r`, `c`, `g`, `a`)

Extended layers record how a piece of equipment is built. They are part of its key: `fxe` holds the whole key, extended layers and the flag `N` included (see [Keys in records](#keys-in-records)).

Drive (`r`):

| Code | Meaning |
|---|---|
| `grav` | Free weight under gravity |
| `stack` | Selectorised weight stack |
| `plate` | Plate-loaded |
| `elastic` | Elastic |
| `air` | Air fan |
| `mag` | Magnetic brake |
| `water` | Water tank |
| `motor` | Motor |
| `friction` | Friction |
| `hydraulic` | Hydraulic |
| `flywheel` | Flywheel |
| `none` | No resistance of its own |

Constraint (`c`, for `stn` and `mac`):

| Code | Meaning |
|---|---|
| `line` | A straight track: a sled or rails |
| `arc` | A lever on one pivot |
| `link` | A linkage of several pivots |
| `cable` | A cable over pulleys |
| `pivot` | One end in a floor pivot |

Compliance (`c`, for `imp` and `sup`):

| Code | Meaning |
|---|---|
| `tilt` | Tilts under the body |
| `roll` | Rolls |
| `slide` | Slides |
| `swing` | Hangs and swings |

Guide angle (`g`, for `mac`):

| Code | Meaning |
|---|---|
| `incl` | Inclined |
| `horiz` | Horizontal |
| `vert` | Vertical |

Design (`a`, for `stn` and `mac`):

| Code | Meaning |
|---|---|
| `iso` | Independent arms |
| `conv` | Converging path |
| `cb` | Counterbalanced |
| `dual` | Two weight stacks |

Rules:

- Write an extended layer only when it is stated. Nothing an exercise records depends on it.
- A lever machine is `c:arc` with `r:plate`. A sled machine is `c:line` with `r:plate`. A pendulum squat is `c:arc`.
- Design codes join with `+`: `a:conv+iso`.

## Symbols

Everything in a key that isn't a code is a symbol.

| Symbol | Meaning | Example |
|---|---|---|
| `/` | Separates layers | `k:imp/f:bell.dumb` |
| `:` | Separates a layer letter from its value | `k:imp` |
| `.` | Joins a code to a more specific child, or a machine verb to its direction | `band.loop`, `push.fwd` |
| `+` | Joins items that go together: two load interfaces, design codes | `l:feet+hands` |
| `;` | Joins the configurations of a combination machine | `…/m:sh.hadd;k:mac/…` |
| `?` | Unknown. Matches anything and never contradicts | `k:?`, `f:?`, `s:?` |

A combination machine, one frame with several configurations, joins the key of each configuration with `;` after a single header, in sorted order. A multi-hip machine, a 4-way neck machine, a pec deck with rear-delt arms, an assisted pull-up and dip machine, and a lat pulldown with a low row are combination machines. A combination may join machine and station configurations. An exercise done on it refers to the configuration it uses.

## Equipment keys in exercise keys

An equipment key and an [exercise key](./exercise-key.md#equipment-in-an-exercise-key) share three lists of codes, so an exercise key leads straight to the key of its equipment, and a machine's key says how the body sits on it in the words an exercise key uses.

| List | In an equipment key | In an exercise key | Listed under |
|---|---|---|---|
| Equipment codes | Kind (`k`) and form (`f`) | The equipment in load (`l`) and support (`s`), and the accessory (`a`) | The [form tables](#form-f) |
| Body points | A machine's load interface (`l`) | After `@` in load and support | The exercise key's [body points](./exercise-key.md#body-points) |
| Body positions | A machine's posture (`s`) | Orientation (`o`) | The exercise key's [orientation](./exercise-key.md#orientation-o) |

The rowing machine below shows all three: its key writes `l:hands` and `s:seated`, and rowing on it is held `@hands` and starts `seated`.

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

A form code stands for one equipment key: `bar.straight` is `FXE=1.0S/k:imp/f:bar.straight`. The form codes are listed in the [form tables](#form-f). A kind code stands for every key of that kind, with the other layers open: `mac` is `FXE=1.0S/k:mac/l:?/s:?/m:?`. `erg.row` is `FXE=1.0S/k:erg/c:?/l:?/s:?/m:row`: any cardio machine whose motion is `row`. The cardio motions are listed under [Motion](#motion-m).

Every form code may be written in an exercise key, children included: `band.loop` is a long loop band, and `band` covers it. The record's `fxe` names the exact equipment, and is the code's key or more specific than it. The rowing machine above is more specific than `erg.row`.

An accessory is never the exercise's [main equipment](#checking-an-exercise-against-its-equipment). The accessory code in the exercise key's `a` layer is the equipment key's accessory code: `a:strap.stretch` is `FXE=1.0S/k:acc/f:strap.stretch`. A strap stretch, `FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:none/x:u/a:strap.stretch`, has `l:none`, so its main equipment is `FXE=1.0S/k:none`.

A support code is written only in `s`, and an accessory code only in `a`. Every other code except `none` may be written in `l` or in `s`. The exercise key adds where the equipment is held or touched (`@`) and, in `l`, how many there are (`*n`): see the exercise key's [load](./exercise-key.md#load-l).

On a machine, the two keys agree: the machine's posture is the exercise's start orientation, and its load interface includes the point where the exercise holds `mac` or `erg` (`@overhead` is in the hands). The `@assist` hold point isn't checked.

The keys differ in three ways, on purpose:

- **A strength machine has no specific code.** A cardio machine can be `erg.row`, because the cycle is the movement. A strength machine is only `mac`, because the exercise's own motion carries what the machine guides.
- **A layer left out reads differently.** In an exercise key it is at its default, which is a value, except the accessory layer, which, left out, is not stated. In an equipment key it is unknown, `?`.
- **Each key's layer letters are its own.** Only `m` is motion in both. In an exercise key `l` is load and `s` support; in an equipment key `l` is the load interface and `s` the posture.

The two keys never record the same fact twice. Grip, sides, range, footwork, pulley height, bench angle, the hold point and the count belong to the exercise key. What the equipment is, its fixed geometry and how it is built belong to the equipment key.

### Checking an exercise against its equipment

An exercise key and the key of its main equipment can be checked against each other. The main equipment is the first of these the exercise key has:

1. a strength or cardio machine in `l`: `mac`, `erg` or a child of `erg`;
2. a station in `l`: `cable`, `smith` or `landmine`;
3. an implement in `l`. With several, the one listed first in the [implements table](#form-f): `l:band@hands+bell.dumb@hands` gives `bell.dumb`;
4. an implement of unknown type, such as `?@chest`, which gives `FXE=1.0S/k:imp/f:?`;
5. a support in `s` other than the floor, the one listed first in the supports table;
6. `FXE=1.0S/k:none` for `l:none`;
7. when nothing else applies, `FXE=1.0S/k:?`.

A checker warns when:

- the equipment key contradicts the key of the exercise's main equipment code: an exercise loaded with `bell.dumb` and an equipment key for a kettlebell;
- a machine's [posture](#posture-s) isn't the exercise's start orientation: `s:supine.incline` and `o:standing`;
- a machine's [load interface](#load-interface-l) doesn't include the hold point of `mac` or `erg`: `l:feet` and `mac@hands`. The `@assist` hold point isn't checked;
- a single-joint machine's motion, or a child of it, isn't in the exercise's motion: a shrug done on a standing calf raise machine, whose motion is `m:ank.pf`. The checker always warns. A person accepts the use when the exercise names that machine;
- `k:none` appears without `l:none`;
- a cardio code doesn't fit the machine's motion: `erg.row` with an equipment key whose motion is `m:gait`, a treadmill.

## Worked examples

Each example starts from a plain description and decides one layer at a time.

### Dumbbell

A free weight held in one hand.

| Layer | Decision | Written |
|---|---|---|
| `k` | A free object moved by the body | `k:imp` |
| `f` | A dumbbell. Its gravity drive is implied, so `r` isn't written | `f:bell.dumb` |

`FXE=1.0S/k:imp/f:bell.dumb`

A [standing dumbbell curl](./exercise-key.md#standing-dumbbell-curl) names it `bell.dumb`: `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`.

### Long loop band

A long elastic loop, as used for assisted pull-ups and banded squats.

| Layer | Decision | Written |
|---|---|---|
| `k` | A free object | `k:imp` |
| `f` | The type is named, so the child code. A band whose type isn't stated is `band` | `f:band.loop` |

`FXE=1.0S/k:imp/f:band.loop`

### Cable column

A weight stack with a pulley that slides up and down a post, used with a handle chosen per exercise.

| Layer | Decision | Written |
|---|---|---|
| `k` | A station used for many movements | `k:stn` |
| `f` | A cable column. Pulley height and the handle are set per use, so the exercise key records them | `f:cable` |

`FXE=1.0S/k:stn/f:cable`

### Lat pulldown machine

Seated, thighs under a pad, a bar pulled down from overhead.

| Layer | Decision | Written |
|---|---|---|
| `k` | A machine built for one movement, not the cable column | `k:mac` |
| `l` | The bar is in the hands | `l:hands` |
| `s` | Seated. The thigh pad holds the body down; it isn't the posture | `s:seated` |
| `m` | Several joints move, and the bar comes toward the feet | `m:pull.down` |

`FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down`

A [lat pulldown](./exercise-key.md#lat-pulldown) names it `mac`: `FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands`.

### Lying leg curl machine

Face down on a bench, a pad behind the lower legs, plate-loaded on a lever.

| Layer | Decision | Written |
|---|---|---|
| `k` | A strength machine | `k:mac` |
| `l` | The pad is on the lower leg | `l:ankles` |
| `s` | Lying face down | `s:prone` |
| `m` | The pivot lines up with the knee, which bends | `m:kn.flex` |
| `r` `c` | Plate-loaded, on a lever: extended layers | `r:plate/c:arc` |

`FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc`

That is the key `fxe` holds. Its standard part is `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex`.

A seated leg curl machine is `FXE=1.0S/k:mac/l:ankles/s:seated/m:kn.flex`. Only the posture differs, and that is enough to make it different equipment.

### Rowing machine

A seat on a rail, a handle on a chain pulled toward the trunk.

| Layer | Decision | Written |
|---|---|---|
| `k` | A cardio machine | `k:erg` |
| `c` | The seat slides on a rail | `c:rail` |
| `l` | The moving part that meets the body is the handle, in the hands. The foot stretcher stays put | `l:hands` |
| `s` | Seated | `s:seated` |
| `m` | Rowing | `m:row` |

`FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row`

### Pec deck with rear-delt arms

One machine with two configurations: arm pads pressed together in front, or handles pulled back with the chest against the pad.

| Configuration | Decision | Written |
|---|---|---|
| Pec deck | Arm pads, seated, the arms come together in front | `k:mac/l:arms/s:seated/m:sh.hadd` |
| Reverse fly | Handles, chest on the pad, the arms move back and out | `k:mac/l:hands/s:seated.chest/m:sh.habd` |

`FXE=1.0S/k:mac/l:arms/s:seated/m:sh.hadd;k:mac/l:hands/s:seated.chest/m:sh.habd`

## Keys in records

An equipment record carries its whole key in `fxe`, extended layers and the flag `N` included. A reference to the equipment, in an [exercise](./exercise-key.md#keys-in-records), a workout or a prescription, carries the same `fxe` value beside its `id` and `name`.

An extended layer counts in a comparison only when both keys carry it (see [Comparing two equipment keys](#comparing-two-equipment-keys)). Otherwise comparing reads the standard part of each key: the key without the extended layers `r`, `c`, `g` and `a`, with the flag `S`. On a cardio machine `c` is the track, a standard layer, so it stays.

| Key | Standard part |
|---|---|
| `FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl` | `FXE=1.0S/k:mac/l:feet/s:supine.incline/m:push.fwd` |
| `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc` | `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex` |
| `FXE=1.0N/k:erg/c:rail/l:hands/s:seated/m:row/r:air` | `FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row` |

An equipment record:

```json fds:ignore equipment record excerpt showing the fxe field
{
  "schemaVersion": "1.2.0",
  "id": "eq.legPress45",
  "fxe": "FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl",
  "canonical": { "name": "45° Leg Press", "slug": "45-leg-press" },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "status": "active"
  }
}
```

An exercise done on it. The equipment reference carries the same `fxe`, and the exercise's own key names the machine with [`mac`](#equipment-keys-in-exercise-keys), held at the feet:

```json fds:ignore exercise record excerpt showing the fxi and fxe fields
{
  "exerciseId": "ex.legPress",
  "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:supine.incline/l:mac@feet",
  "canonical": { "name": "Leg Press", "slug": "leg-press" },
  "equipment": {
    "required": [
      { "id": "eq.legPress45", "name": "45° Leg Press", "fxe": "FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl" }
    ]
  }
}
```

## Comparing two equipment keys

Comparison goes layer by layer. `?` matches any value, and a parent code covers its children. A standard layer left out reads `?`. An extended layer is weighed only when both keys carry it; when only one key does, it makes that key more specific.

- **Same**: the two keys are written identically and contain no `?`.
- **More specific**: no layer contradicts, and one key states something the other leaves open, names a child where the other names its parent, or carries an extended layer the other leaves out.
- **Different**: at least one layer can't match.

| Key A | Key B | Result |
|---|---|---|
| `FXE=1.0S/k:imp/f:bell.dumb` | `FXE=1.0S/k:imp/f:bell.dumb` | Same |
| `FXE=1.0S/k:imp/f:band.loop` | `FXE=1.0S/k:imp/f:band` | A is more specific: `band.loop` is a child of `band` |
| `FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down` | `FXE=1.0S/k:mac/l:?/s:?/m:?` | A is more specific: it states the layers B leaves open |
| `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc` | `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex` | A is more specific: it carries extended layers B leaves out |
| `FXE=1.0S/k:mac/l:ankles/s:seated/m:kn.flex` | `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex` | Different: the postures differ |
| `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc` | `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:stack` | Different: both carry a drive, and the drives differ |
| `FXE=1.0S/k:stn/f:cable` | `FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down` | Different: a station and a strength machine |
| `FXE=1.0S/k:imp/f:band.mini` | `FXE=1.0S/k:imp/f:band.loop` | Different: two children of `band` |

When each key leaves open something the other states, neither is more specific, and the two may still describe the same equipment: `FXE=1.0S/k:mac/l:hands/s:?/m:pull.back` and `FXE=1.0S/k:mac/l:?/s:seated.chest/m:pull.back`. A combination machine and one of its configurations compare the same way: neither is more specific, and nothing contradicts.

An identical key is a strong match, and anything else gives a short list for a person to confirm. See [Using keys](../structural-keys.md#using-keys) for how to keep confirmed links.

## Finding related items

Equipment keys that share codes form families, and nobody has to declare them. Search for a value in one layer and you find every piece of equipment that shares it.

| Search | Finds |
|---|---|
| `k` is `mac` | Every strength machine |
| `k` is `imp` | Every implement: bars, bells, balls, bands and the rest |
| `k` is `erg` | Every cardio machine |
| `f` is a `bell.*` code | Dumbbells, kettlebells and circus dumbbells |
| `k` is `imp` and `f` is a `bar.*` code | Every barbell: straight, EZ, trap, axle and cambered. Without the kind, `bar.*` also finds the fixed bar, dip bars and parallettes |
| `f` is `band` | Every band, through its children `band.loop`, `band.mini` and `band.tube`. A parent code finds its children |
| `m` is `pull.down` | Every pulldown machine |
| `m` is `kn.flex` | Lying, seated and standing leg curl machines |
| `k` is `mac` and `l` is `feet` | Machines pushed with the feet: leg presses, glute kickbacks, tibialis raises |

`bell.*` means any code that starts with `bell.`. An "is" search is the same operation as comparing for "more specific": every single-purpose pulldown machine is more specific than `FXE=1.0S/k:mac/l:?/s:?/m:pull.down`. A combination machine that also rows is neither more specific nor different: nothing contradicts. A "holds" search looks for a code, or a child of it, anywhere in the layer.

An exercise key uses the same codes, so the same searches find exercises: `l` holds `mac` finds every exercise done on a strength machine (see [Finding related items](./exercise-key.md#finding-related-items) on the exercise key page).

## Building keys

You can write a key by hand by following this page, or generate one with the FDS Encoder.

<!-- TODO: link the Encoder page under Tools once it exists. -->
