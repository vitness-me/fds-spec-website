// The versions of the four structural keys and the code lists of the exercise key (FXI) and the equipment key (FXE).
// Every code an encoder may write is listed here, and the published code registries are generated from this file.

export type Glossary = Readonly<Record<string, string>>;

export const UNKNOWN = '?';
export const GENERIC = '*';

export const FXI_MAJOR = 1;
/** Revision written in the header (`FXI=1.0`). */
export const FXI_REV = 0;
export const FXE_MAJOR = 1;
export const FXE_REV = 0;

// ───────────────────────────── FXI layers ─────────────────────────────

/** FXI layers in their fixed order. `std` layers form the standard FXI; the others are extended and compared only when both keys carry them. */
export const FXI_LAYERS = {
  m: { name: 'Motion', std: true, gloss: 'Motion: the joint actions of each phase, in rep order. Required.' },
  o: { name: 'Orientation', std: true, gloss: 'Orientation: the body to gravity at the start of the rep. Always written; `?` if unknown.' },
  k: { name: 'Moving end', std: true, gloss: 'Moving end, for trunk work on the floor or a bench. Default: the limb end moves.' },
  f: { name: 'Footwork', std: true, gloss: 'Footwork: stepping, split stance or travel. Default: feet planted level.' },
  s: { name: 'Support', std: true, gloss: 'Support: surfaces beyond what the orientation implies, and the body points on them. Default: the floor as the orientation implies.' },
  l: { name: 'Load', std: true, gloss: 'Load: each implement and where it is held, or `none`. Always written; `?` if unknown.' },
  x: { name: 'Sides', std: true, gloss: 'Sides: whether the limbs work together, one side at a time, in turns or in opposite directions. Default: `b`, both together.' },
  g: { name: 'Grip and stance', std: true, gloss: 'Grip and stance: hand orientation, width, stance. Default: the usual grip, medium width, medium stance.' },
  r: { name: 'Range and start', std: true, gloss: 'Range and start: partial or deep range, deficit, start position. Default: full range from the usual start.' },
  h: { name: 'Held posture', std: true, gloss: 'Held posture of limbs that do not work. Default: no held posture.' },
  p: { name: 'Line of pull', std: true, gloss: 'Line of pull or path past the body. Default: the line the movement implies.' },
  a: { name: 'Accessory', std: false, gloss: 'Accessory: a strap or a partner that helps the exercise without loading it. Extended: compared only when both keys carry it.' },
} as const;
export type FxiLayer = keyof typeof FXI_LAYERS;
export const FXI_LAYER_ORDER = Object.keys(FXI_LAYERS) as FxiLayer[];
export const FXI_STANDARD_LAYERS = FXI_LAYER_ORDER.filter((l) => FXI_LAYERS[l].std);
export const FXI_EXTENDED_LAYERS = FXI_LAYER_ORDER.filter((l) => !FXI_LAYERS[l].std);

export const JOINTS: Glossary = {
  nk: 'Neck.',
  sp: 'Spine: the trunk, thoracic and lumbar together.',
  sc: 'Scapula: the shoulder blade on the rib cage.',
  sh: 'Shoulder joint.',
  el: 'Elbow.',
  fa: 'Forearm: the turn that rotates the palm.',
  wr: 'Wrist.',
  hip: 'Hip.',
  kn: 'Knee.',
  ank: 'Ankle and foot.',
};
export const ARM_JOINTS = ['sc', 'sh', 'el', 'fa', 'wr'];
export const LEG_JOINTS = ['hip', 'kn', 'ank'];

export const JOINT_ACTIONS: Glossary = {
  'nk.flex': 'Neck flexion: chin toward the chest.',
  'nk.ext': 'Neck extension: head tips back.',
  'nk.lflex': 'Neck side bend: ear toward the shoulder.',
  'nk.rot': 'Neck rotation: turning the head.',
  'sp.flex': 'Trunk flexion: ribs toward the pelvis, as in a crunch.',
  'sp.ext': 'Trunk extension: straightening or arching the back from a bent position.',
  'sp.lflex': 'Trunk side bend.',
  'sp.rot': 'Trunk rotation: shoulders twist against the hips.',
  'sc.elev': 'Scapular elevation: shrug up.',
  'sc.dep': 'Scapular depression: shoulders pulled down.',
  'sc.pro': 'Scapular protraction: shoulder blades spread around the ribs.',
  'sc.ret': 'Scapular retraction: shoulder blades squeezed together.',
  'sh.flex': 'Shoulder flexion: arm forward and up, as in a front raise or overhead press.',
  'sh.ext': 'Shoulder extension: arm down and back from in front, as in a row or a dip. Covers `sh.ext.oh`.',
  'sh.ext.oh': 'Shoulder extension from overhead: the arms come down in front of the face from above the head, as in a chin-up, a close or neutral pulldown, a straight-arm pulldown, a pullover or a slam. Child of `sh.ext`.',
  'sh.abd': 'Shoulder abduction: arm out to the side and up, as in a lateral raise.',
  'sh.add': 'Shoulder adduction: arm down to the side from out to the side, as in a wide pull-up.',
  'sh.hadd': 'Horizontal adduction: arm across the front at chest height, as in a press or fly.',
  'sh.habd': 'Horizontal abduction: arm back and out at chest height, as in a reverse fly.',
  'sh.ir': 'Shoulder internal rotation: forearm turns in toward the belly, elbow bent.',
  'sh.er': 'Shoulder external rotation: forearm turns out, elbow bent.',
  'el.flex': 'Elbow flexion, as in a curl.',
  'el.ext': 'Elbow extension, as in a press or triceps extension.',
  'fa.pron': 'Forearm pronation: palm turns down.',
  'fa.sup': 'Forearm supination: palm turns up.',
  'wr.flex': 'Wrist flexion: palm toward the forearm.',
  'wr.ext': 'Wrist extension: back of the hand toward the forearm.',
  'wr.rdev': 'Wrist radial deviation: thumb side toward the forearm.',
  'wr.udev': 'Wrist ulnar deviation: little-finger side toward the forearm.',
  'hip.flex': 'Hip flexion: thigh toward the trunk, or trunk toward the thigh.',
  'hip.ext': 'Hip extension: thigh away from the trunk, as in standing up from a squat.',
  'hip.abd': 'Hip abduction: leg out to the side.',
  'hip.add': 'Hip adduction: leg in toward the other leg.',
  'hip.ir': 'Hip internal rotation: knee turns in.',
  'hip.er': 'Hip external rotation: knee turns out.',
  'kn.flex': 'Knee flexion against resistance, as in a leg curl.',
  'kn.ext': 'Knee extension, as in standing up from a squat.',
  'ank.df': 'Ankle dorsiflexion: toes toward the shin.',
  'ank.pf': 'Ankle plantar flexion: rising onto the toes, pushing off.',
  'ank.inv': 'Ankle inversion: sole turns in.',
  'ank.ev': 'Ankle eversion: sole turns out.',
};

/** Joint actions that refine a parent action. A parent covers its children in compare and shares their opposite. */
export const ACTION_PARENT: Readonly<Record<string, string>> = { 'sh.ext.oh': 'sh.ext' };

/** Joints that take the `.circ` action: circling the joint through all directions. */
export const CIRC_JOINTS = ['nk', 'sp', 'sh', 'wr', 'hip', 'ank'];

export const OPPOSITE_ACTIONS: readonly (readonly [string, string])[] = [
  ['nk.flex', 'nk.ext'], ['sp.flex', 'sp.ext'], ['sc.elev', 'sc.dep'], ['sc.pro', 'sc.ret'],
  ['sh.flex', 'sh.ext'], ['sh.abd', 'sh.add'], ['sh.hadd', 'sh.habd'], ['sh.ir', 'sh.er'],
  ['el.flex', 'el.ext'], ['fa.pron', 'fa.sup'], ['wr.flex', 'wr.ext'], ['wr.rdev', 'wr.udev'],
  ['hip.flex', 'hip.ext'], ['hip.abd', 'hip.add'], ['hip.ir', 'hip.er'], ['kn.flex', 'kn.ext'],
  ['ank.df', 'ank.pf'], ['ank.inv', 'ank.ev'],
];

/** Phase prefixes. The empty prefix is a normal moving phase. */
export const PHASE_PREFIXES: Glossary = {
  '': 'Dynamic: the joints move through range; write the concentric direction.',
  '^': 'Ballistic: the phase ends in flight (body leaves the ground) or release (implement leaves the hands). A phase after it happens in the air.',
  '~': 'Cyclic: continuous cycles with no rep boundary; write the driving half of one cycle.',
  '=': 'Isometric: a hold under effort for the whole set; write what the muscles push toward. `=0` is a hold with no direction (balance).',
  '%': 'Static stretch: the directions the joints are taken to, held at end range.',
  '&': 'Dynamic stretch: the same directions, taken to end range and released repeatedly (swings, pass-throughs).',
};

export const ACTION_SUFFIX_SHORT = '-';

/** Orientations: the body's position. FXI writes the start (and end) of the rep in `o`; FXE writes a machine's posture in `s`. */
export const ORIENTATIONS: Glossary = {
  standing: 'On the feet, trunk within about 30° of vertical.',
  'standing.bent': 'On the feet, trunk hinged forward more than about 30° and held there (bent-over row).',
  'standing.chest': 'On the feet, trunk resting on a pad, upright or bent over (donkey calf raise machine).',
  seated: 'Sitting, trunk more than 60° from horizontal.',
  'seated.bent': 'Sitting, trunk hinged forward over the thighs and held there (seated bent-over raise).',
  'seated.chest': 'Sitting, chest against a pad that holds the trunk (row machine, rear-delt machine).',
  kneeling: 'On both knees, trunk upright. On hands and knees is `prone`.',
  'kneeling.half': 'On one knee, the other foot forward.',
  supine: 'Face up, trunk within 15° of horizontal.',
  'supine.incline': 'Face up, head higher than hips, trunk 15–60° from horizontal.',
  'supine.decline': 'Face up, head lower than hips, trunk 15–60° from horizontal.',
  prone: 'Face down, trunk within 15° of horizontal: lying, plank, push-up, on hands and knees.',
  'prone.incline': 'Face down, head higher than hips, 15–60° (hands raised).',
  'prone.decline': 'Face down, head lower than hips, 15–60° (feet raised).',
  'prone.pike': 'Face down, hips highest, hands and feet down, trunk more than 60° head-down (pike).',
  'side-lying': 'On one side: lying, or a side plank.',
  hanging: 'Held up by the hands or arms, feet off the floor: hanging from a bar, propped on dip bars.',
  inverted: 'Upside down, trunk within 30° of vertical, head lowest: handstand, headstand.',
};

/** Body points each start orientation implies on its support. Never written. */
export const IMPLIED_POINTS: Readonly<Record<string, readonly string[]>> = {
  standing: ['feet'],
  'standing.bent': ['feet'],
  'standing.chest': ['feet', 'chest'],
  seated: ['seat'],
  'seated.bent': ['seat'],
  'seated.chest': ['seat', 'chest'],
  kneeling: ['knees', 'shins'],
  'kneeling.half': ['knees', 'feet'],
  supine: ['back'],
  'supine.incline': ['back'],
  'supine.decline': ['back'],
  prone: ['chest'],
  'prone.incline': ['chest'],
  'prone.decline': ['chest'],
  'prone.pike': ['feet', 'hands'],
  'side-lying': [],
  hanging: ['hands'],
  inverted: ['hands'],
};

export const MOVING_END: Glossary = {
  limbs: 'The limb end moves (default, never written).',
  trunk: 'The trunk end moves; the legs stay put: sit-up, crunch, bridge, hip thrust, back extension, glute-ham raise, Nordic curl.',
  both: 'Both ends move toward each other: V-up, jackknife, tuck-up.',
};

export const FOOTWORK: Glossary = {
  level: 'Feet planted level (default). Written only inside a sequence.',
  split: 'Feet planted in a split stance, one in front of the other.',
  'step.fwd': 'Each rep steps forward and returns.',
  'step.back': 'Each rep steps back and returns.',
  'step.side': 'Each rep steps to the side and returns.',
  'step.cross': 'Each rep steps back and across behind the other leg (curtsy) and returns.',
  'travel.fwd': 'The body travels forward and does not return each rep.',
  'travel.back': 'Travels backward.',
  'travel.side': 'Travels sideways.',
};

/**
 * Body points: where the body meets the equipment. FXI writes them as hold points (`l`) and as the points that bear
 * weight on a support (`s`); FXE writes them as a machine's load interfaces (`l`). A point names a body part, not a count.
 */
export const BODY_POINTS: Glossary = {
  hands: 'The hands, or one hand: a held implement, handles or a bar.',
  forearms: 'The forearms, elbows bent: an elbow plank, or a machine’s forearm pads.',
  elbows: 'The crook of the elbows (Zercher).',
  arms: 'The upper arms: a preacher pad, or a machine’s arm pad on the upper arm or elbow.',
  shoulders: 'The shoulders: the front rack or one shoulder, or a machine’s shoulder pads.',
  chest: 'The chest: a load held against it (goblet, bear hug), or a chest pad.',
  back: 'The back: a bar across the upper back (back squat), or a back pad.',
  hips: 'The front of the hips: a load across them (hip thrust), or a machine’s hip pad or belt.',
  waist: 'Hung from a belt at the waist.',
  seat: 'The buttocks: sitting down onto a box or bench, or a machine’s moving seat.',
  thighs: 'On or around the thighs, or a machine’s thigh pad.',
  knees: 'At or around the knees, or a machine’s knee pad or platform.',
  shins: 'The shins.',
  calves: 'The calves (the back of the lower leg).',
  ankles: 'At or just above the ankles: a strap, a cuff, or a machine pad on the lower leg.',
  feet: 'The feet, or one foot: on the floor, or on a foot plate or pedals.',
  head: 'The head or forehead, or a machine’s head pad.',
};

/** Hold points that are not body points. */
export const HOLD_ONLY: Glossary = {
  overhead: 'Held in the hands with the arms straight overhead for the whole rep.',
  assist: 'The implement takes part of the body weight (assist band, assisted machine).',
};

export const SYMMETRY: Glossary = {
  b: 'Bilateral: both limbs work together, or the movement has no sides (default, never written).',
  u: 'Unilateral: one side does every rep of the set, then the other side.',
  a: 'Alternating: the sides take turns rep by rep; one side works while the other waits.',
  rc: 'Reciprocal: both sides move at once in opposite directions (gait, flutter kicks, see-saw press).',
};
export const SYMMETRY_SCOPES: Glossary = {
  arms: 'The pattern applies to the arms.',
  legs: 'The pattern applies to the legs.',
};

export const HAND_ORIENTATIONS: Glossary = {
  pr: 'Pronated: palms down or away (overhand).',
  su: 'Supinated: palms up or toward you (underhand).',
  ne: 'Neutral: palms face each other (hammer).',
  mx: 'Mixed: one hand over, one under.',
};
export const GRIP_WIDTHS: Glossary = {
  'w-t': 'Hands touching or overlapping (diamond).',
  'w-n': 'Narrow: hands inside shoulder width.',
  'w-m': 'Medium: about shoulder width (default, never written).',
  'w-w': 'Wide: hands well outside shoulder width.',
};
export const STANCES: Glossary = {
  'st-n': 'Narrow stance: feet together or closer than hip width.',
  'st-m': 'Medium stance: about hip width (default, never written).',
  'st-w': 'Wide stance (sumo).',
};
export const GRIP_ELEMENTS: Glossary = { ...HAND_ORIENTATIONS, ...GRIP_WIDTHS, ...STANCES };

export const RANGES: Glossary = {
  partial: 'Part of the usual range on purpose: half, quarter, pulses, top or bottom half.',
  deep: 'Deeper than the usual range: full depth, ass to grass, pistol depth.',
  deficit: 'Standing on something to go deeper than usual.',
  'from-floor': 'Each rep starts with the load at rest on the floor, where the usual start is not the floor.',
  'from-top': 'Starts standing with the load held, lowered without being set down (hang), where that is not the usual start. With no child, the usual hang: above the knee.',
  'from-top.knee': 'A hang that starts at or below the knee. Child of `from-top`.',
  'from-pins': 'Each rep starts from pins, blocks or a rack above the floor.',
  'from-drop': 'Each rep starts with a drop: the body steps off a box or platform and lands before the working phase (depth jump). The box dropped from is not written in `s`.',
};
export const START_RANGES = ['from-floor', 'from-top', 'from-top.knee', 'from-pins', 'from-drop'];
/** Range codes that refine a parent code. A parent covers its children in compare. */
export const RANGE_PARENT: Readonly<Record<string, string>> = { 'from-top.knee': 'from-top' };

export const HELD: Glossary = {
  none: 'No held posture: the non-working limbs do what the movement implies (default, never written).',
  'arms.oh': 'Arms held straight overhead, nothing in the hands.',
  'arms.fwd': 'Arms held straight and reaching forward from the shoulders, nothing in the hands ("arms extended", "straight arm").',
  'arms.side': 'Arms held out to the sides.',
  'arms.cross': 'Arms crossed on the chest.',
  'hands.head': 'Hands behind or on the head (prisoner).',
  'el.bent': 'Working elbows held bent at about 90° ("bent arm", "90 degree").',
  'ua.oh': 'Upper arms held up beside the head while the elbows work (overhead triceps extension).',
  'ua.side': 'Upper arms held out from the sides, elbows flared, while the elbows work (inner biceps curl, Tate press).',
  'leg.fwd': 'Free leg held straight in front.',
  'leg.back': 'Free leg held behind.',
  'legs.l': 'Legs held straight at about 90° hip flexion.',
  'kn.bent': 'Knees held bent while the hips or arms work (hanging knee raise; inverted row with the feet flat on the floor).',
  'trunk.fwd': 'Trunk held leaning forward where the orientation does not already say so (chest dip).',
};

/** Held codes that describe incompatible postures and never appear together. */
export const HELD_CONFLICTS: readonly (readonly [string, string])[] = [['legs.l', 'kn.bent'], ['ua.oh', 'ua.side']];

export const LINES: Glossary = {
  usual: 'The line of pull the movement implies (default, never written).',
  hi: 'Cable or band anchored higher than usual for the movement.',
  lo: 'Anchored lower than usual for the movement.',
  behind: 'The load or the body passes behind the head or trunk instead of in front (behind-the-neck press, rear pull-up).',
  side: 'The load pulls from one side: the body stands side-on to the anchor (a cable press done side-on).',
  neck: 'The load comes down to the neck, throat or chin instead of the chest (JM press, guillotine press).',
  double: 'A rope passes under the feet twice in each jump (double under).',
};

// ───────────────────────────── FXE alphabet ─────────────────────────────

export const FXE_KINDS: Glossary = {
  none: 'No equipment: the body is the whole load.',
  imp: 'Implement: a free object moved, held or worn.',
  sup: 'Support: a surface or frame the body rests on, hangs from or pushes against. It does not carry the load.',
  acc: 'Accessory: a handle, strap, belt, mat, towel or marker. It never defines the exercise.',
  stn: 'Station: a guide or anchor used for many movements: cable column, Smith machine, landmine.',
  mac: 'Strength machine: a guided mechanism with fixed body contacts, built for one movement.',
  erg: 'Cardio machine: repeats whole cycles.',
};
export type FxeKind = 'none' | 'imp' | 'sup' | 'acc' | 'stn' | 'mac' | 'erg';

export const FXE_STANDARD: Readonly<Record<FxeKind, readonly string[]>> = {
  none: [], imp: ['f'], sup: ['f'], acc: ['f'], stn: ['f'], mac: ['l', 's', 'm'], erg: ['c', 'l', 's', 'm'],
};
export const FXE_EXTENDED: Readonly<Record<FxeKind, readonly string[]>> = {
  none: [], imp: ['r', 'c'], sup: ['c'], acc: [], stn: ['r', 'c', 'a'], mac: ['r', 'c', 'g', 'a'], erg: ['r'],
};
/** Order of extended FXE layers after the standard ones. */
export const FXE_EXTENDED_ORDER = ['r', 'c', 'g', 'a'];

export interface FormAtom { k: FxeKind; r?: string; c?: string; parent?: string; gloss: string }

/** Form atoms. `r` and `c` are the drive and constraint the atom implies; they are never written. */
export const FORMS: Readonly<Record<string, FormAtom>> = {
  'bar.straight': { k: 'imp', r: 'grav', gloss: 'Barbell, Olympic or standard.' },
  'bar.ez': { k: 'imp', r: 'grav', gloss: 'EZ curl bar.' },
  'bar.trap': { k: 'imp', r: 'grav', gloss: 'Trap or hex bar.' },
  'bar.axle': { k: 'imp', r: 'grav', gloss: 'Thick axle bar.' },
  'bar.camber': { k: 'imp', r: 'grav', gloss: 'Cambered bar.' },
  'bell.dumb': { k: 'imp', r: 'grav', gloss: 'Dumbbell.' },
  'bell.kettle': { k: 'imp', r: 'grav', gloss: 'Kettlebell.' },
  'bell.circus': { k: 'imp', r: 'grav', gloss: 'Circus dumbbell.' },
  'ball.med': { k: 'imp', r: 'grav', gloss: 'Medicine ball.' },
  'ball.slam': { k: 'imp', r: 'grav', gloss: 'Slam ball.' },
  'bag.sand': { k: 'imp', r: 'grav', gloss: 'Sandbag.' },
  'bag.heavy': { k: 'imp', r: 'grav', c: 'swing', gloss: 'Hanging heavy bag.' },
  plate: { k: 'imp', r: 'grav', gloss: 'A weight plate held or worn on its own.' },
  chain: { k: 'imp', r: 'grav', gloss: 'Lifting chain.' },
  'rope.battle': { k: 'imp', r: 'grav', gloss: 'Battle rope.' },
  'rope.jump': { k: 'imp', r: 'none', gloss: 'Skipping rope.' },
  band: { k: 'imp', r: 'elastic', gloss: 'Elastic band or tube, type not stated.' },
  'band.loop': { k: 'imp', r: 'elastic', parent: 'band', gloss: 'Long loop band: superband, power band.' },
  'band.mini': { k: 'imp', r: 'elastic', parent: 'band', gloss: 'Short loop band worn around the legs: miniband.' },
  'band.tube': { k: 'imp', r: 'elastic', parent: 'band', gloss: 'Tube band with handles.' },
  sled: { k: 'imp', r: 'friction', gloss: 'Ground sled or prowler, pushed or dragged.' },
  tire: { k: 'imp', r: 'grav', gloss: 'Large tyre.' },
  hammer: { k: 'imp', r: 'grav', gloss: 'Sledgehammer.' },
  stone: { k: 'imp', r: 'grav', gloss: 'Atlas stone.' },
  log: { k: 'imp', r: 'grav', gloss: 'Strongman log.' },
  keg: { k: 'imp', r: 'grav', gloss: 'Keg.' },
  yoke: { k: 'imp', r: 'grav', gloss: 'Strongman yoke.' },
  'frame.carry': { k: 'imp', r: 'grav', gloss: 'Farmer handles or a carry frame (rickshaw).' },
  car: { k: 'imp', r: 'grav', gloss: 'A car, lifted or pushed.' },
  'wear.vest': { k: 'imp', r: 'grav', gloss: 'Weight vest.' },
  'wear.ankle': { k: 'imp', r: 'grav', gloss: 'Ankle weight.' },
  club: { k: 'imp', r: 'grav', gloss: 'Indian club or mace.' },
  stick: { k: 'imp', r: 'none', gloss: 'Dowel, broomstick or PVC pipe: sets the hands, adds no load.' },
  wheel: { k: 'imp', r: 'none', c: 'roll', gloss: 'Ab wheel.' },
  'roller.wrist': { k: 'imp', r: 'grav', gloss: 'Wrist roller.' },
  'harness.head': { k: 'imp', r: 'grav', gloss: 'Head harness with a hanging load.' },
  floor: { k: 'sup', gloss: 'The floor, or a mat on it.' },
  wall: { k: 'sup', gloss: 'A wall.' },
  bench: { k: 'sup', gloss: 'A bench, flat or adjustable.' },
  box: { k: 'sup', gloss: 'A box, step or platform.' },
  chair: { k: 'sup', gloss: 'A chair.' },
  block: { k: 'sup', gloss: 'Lifting blocks a bar starts from.' },
  rack: { k: 'sup', gloss: 'Power rack or squat stand, with its pins.' },
  'ball.stab': { k: 'sup', c: 'tilt', gloss: 'Stability, Swiss or exercise ball.' },
  dome: { k: 'sup', c: 'tilt', gloss: 'BOSU, either side up.' },
  'dome.up': { k: 'sup', c: 'tilt', parent: 'dome', gloss: 'BOSU, dome side up.' },
  'dome.down': { k: 'sup', c: 'tilt', parent: 'dome', gloss: 'BOSU, flat side up: the dome on the floor.' },
  'board.bal': { k: 'sup', c: 'tilt', gloss: 'Balance or wobble board.' },
  'roller.foam': { k: 'sup', c: 'roll', gloss: 'Foam roller.' },
  slider: { k: 'sup', c: 'slide', gloss: 'Slider disc.' },
  'strap.susp': { k: 'sup', c: 'swing', gloss: 'Suspension trainer.' },
  ring: { k: 'sup', c: 'swing', gloss: 'Gymnastic rings.' },
  'rope.climb': { k: 'sup', c: 'swing', gloss: 'Climbing rope.' },
  'bar.fixed': { k: 'sup', gloss: 'Fixed overhead bar: pull-up bar, or a racked bar used as a handhold.' },
  'bar.parallel': { k: 'sup', gloss: 'Parallel dip bars.' },
  'bar.parallette': { k: 'sup', gloss: 'Floor parallettes.' },
  'pad.preacher': { k: 'sup', gloss: 'Preacher bench.' },
  'pad.hyper': { k: 'sup', gloss: 'Back-extension bench, 45° or 90° (also called a Roman chair for back or side raises).' },
  'pad.ghd': { k: 'sup', gloss: 'Glute-ham developer.' },
  'station.vkr': { k: 'sup', gloss: 'Vertical knee-raise station (captain’s chair).' },
  pole: { k: 'sup', gloss: 'A vertical pole, post or rack upright gripped by the hands (human flag).' },
  'ball.massage': { k: 'sup', gloss: 'Massage or lacrosse ball rolled under the body.' },
  handle: { k: 'acc', gloss: 'Single D-handle.' },
  'handle.bar': { k: 'acc', gloss: 'Straight or cambered cable bar.' },
  'handle.v': { k: 'acc', gloss: 'V-bar or close-grip handle.' },
  'handle.rope': { k: 'acc', gloss: 'Triceps rope.' },
  'strap.ankle': { k: 'acc', gloss: 'Ankle cuff.' },
  'belt.dip': { k: 'acc', gloss: 'Dip belt.' },
  'belt.lift': { k: 'acc', gloss: 'Lifting belt.' },
  'strap.lift': { k: 'acc', gloss: 'Lifting straps.' },
  'strap.stretch': { k: 'acc', gloss: 'Stretching strap: a strap, belt, towel, rope or loop band used to pull or hold a limb in a stretch.' },
  towel: { k: 'acc', gloss: 'A towel used as a handle.' },
  marker: { k: 'acc', gloss: 'Cone, hurdle or floor marker.' },
  'board.press': { k: 'acc', gloss: 'Board laid on the chest for partial presses.' },
  mat: { k: 'acc', gloss: 'Floor mat.' },
  cable: { k: 'stn', r: 'stack', c: 'cable', gloss: 'Cable column, crossover or functional trainer: a pulley set per exercise. A lat pulldown or seated cable row machine is `mac`.' },
  smith: { k: 'stn', r: 'plate', c: 'line', gloss: 'Smith machine: a bar on fixed rails.' },
  landmine: { k: 'stn', r: 'grav', c: 'pivot', gloss: 'Landmine: one end of a barbell in a floor pivot (also a corner T-bar row).' },
};

export const MAC_DIRECTIONS: Glossary = {
  up: 'Toward the head: shoulder press, hack squat, belt squat, deadlift machine.',
  down: 'Toward the feet: pulldown, seated dip.',
  fwd: 'Away from the front of the trunk: chest press, leg press.',
  back: 'Toward the front of the trunk: row.',
  fwdup: 'Forward and up: incline press.',
  fwddown: 'Forward and down: decline press.',
  backdown: 'Back and down: high row.',
};
/** The verbs of a multi-joint machine's motion, written `<verb>.<direction>`. */
export const MAC_VERB_GLOSSES: Glossary = {
  push: 'The moving part is pushed away.',
  pull: 'The moving part is pulled toward the user.',
  assist: 'The moving part helps lift the body.',
};
export const MAC_VERBS = Object.keys(MAC_VERB_GLOSSES);
export const MAC_SINGLE_JOINT = [
  'kn.flex', 'kn.ext', 'el.flex', 'el.ext', 'sh.flex', 'sh.ext', 'sh.abd', 'sh.add', 'sh.hadd', 'sh.habd', 'sh.ir', 'sh.er',
  'sc.elev', 'hip.flex', 'hip.ext', 'hip.abd', 'hip.add', 'sp.flex', 'sp.ext', 'sp.rot', 'sp.lflex', 'ank.pf', 'ank.df',
  'nk.flex', 'nk.ext', 'nk.lflex', 'wr.flex', 'wr.ext',
];
export const ERG_CYCLES = {
  gait: 'Walking or running on a belt.',
  cycle: 'Pedalling (or hand cranking).',
  step: 'Stepping (stepper or stepmill).',
  row: 'Rowing.',
  ski: 'Double-pole pull (ski erg).',
  glide: 'Elliptical glide.',
  climb: 'Climbing with hands and feet.',
} as const satisfies Glossary;
export const ERG_TRACKS: Glossary = {
  belt: 'A moving belt or revolving stairs.',
  link: 'Linked pedals (stepper).',
  loop: 'A closed loop: cranks, elliptical.',
  rail: 'A seat on a rail (rower).',
  cable: 'A cable pulled from above (ski erg).',
  line: 'A straight track (vertical climber).',
};
export const DRIVES: Glossary = {
  grav: 'Free weight under gravity.', stack: 'Selectorised weight stack.', plate: 'Plate-loaded.',
  elastic: 'Elastic.', air: 'Air fan.', mag: 'Magnetic brake.', water: 'Water tank.', motor: 'Motor.',
  friction: 'Friction.', hydraulic: 'Hydraulic.', flywheel: 'Flywheel (isoinertial).', none: 'No resistance of its own.',
};
export const MAC_CONSTRAINTS: Glossary = {
  line: 'A straight track (sled, rails).', arc: 'A lever on one pivot.', link: 'A linkage of several pivots.',
  cable: 'A cable over pulleys.', pivot: 'One end in a floor pivot.',
};
export const COMPLIANCE: Glossary = {
  tilt: 'Tilts under the body.', roll: 'Rolls.', slide: 'Slides.', swing: 'Hangs and swings.',
};
export const GUIDE_ANGLES: Glossary = { incl: 'Inclined (45° leg press).', horiz: 'Horizontal.', vert: 'Vertical.' };
export const DESIGN_ATTRS: Glossary = {
  iso: 'Independent arms (iso-lateral).', conv: 'Converging path.', cb: 'Counterbalanced (Smith).', dual: 'Two stacks.',
};

// ───────────────────────────── FXI equipment and accessory codes ─────────────────────────────

export interface EquipmentToken { fxe: string; load: boolean; gloss: string; /** A child code refines its parent; the parent covers it in compare. */ parent?: string }
const S = `FXE=${FXE_MAJOR}.${FXE_REV}S/`;
const formsOf = (kinds: readonly FxeKind[]): [string, FormAtom][] => Object.entries(FORMS).filter(([, a]) => kinds.includes(a.k));
/** An FXE form atom used as an FXI code: its FXE is the atom, it loads unless it is a support, and its parent is the atom's. */
const form = ([code, atom]: [string, FormAtom]): [string, EquipmentToken] =>
  [code, { fxe: `${S}k:${atom.k}/f:${code}`, load: atom.k !== 'sup', gloss: atom.gloss, ...(atom.parent === undefined ? {} : { parent: atom.parent }) }];
/** `erg` children name the cycle the cardio machine guides: `erg.<cycle>` is the generic cardio FXE with that cycle. */
const ERG_CHILDREN: Readonly<Record<keyof typeof ERG_CYCLES, string>> = {
  gait: 'Cardio machine for walking or running on a belt (treadmill).', step: 'Cardio machine for stepping (stair stepper, stepmill).',
  cycle: 'Cardio machine for pedalling or hand cranking (bike, air bike, arm crank).', row: 'Rowing machine.', ski: 'Ski erg.',
  glide: 'Elliptical.', climb: 'Climbing machine (vertical or ladder climber).',
};
const ergChild = ([cycle, gloss]: [string, string]): [string, EquipmentToken] =>
  [`erg.${cycle}`, { fxe: `${S}k:erg/c:?/l:?/s:?/m:${cycle}`, load: true, gloss, parent: 'erg' }];

/**
 * FXI equipment codes, which are FXE codes: every implement, station and support form atom (children included), the
 * FXE kind where FXE names only the kind (`none`, `mac`, `erg`), and `erg.<cycle>` for a cardio machine of one cycle.
 * Each stands for one standard FXE. Load-capable codes may appear in `l`; every code except `none` may appear in `s`.
 * Accessory atoms are FXI accessory codes (`ACCESSORIES`).
 */
export const EQUIPMENT_TOKENS: Readonly<Record<string, EquipmentToken>> = Object.fromEntries([
  ['none', { fxe: `${S}k:none`, load: true, gloss: 'No implement: body weight only. Stands alone, no hold point.' }],
  ...formsOf(['imp', 'stn']).map(form),
  ...Object.entries(ERG_CHILDREN).map(ergChild),
  ['mac', { fxe: `${S}k:mac/l:?/s:?/m:?`, load: true, gloss: 'Any dedicated strength machine (including lat pulldown and seated cable row machines). The record’s fxe names which.' }],
  ['erg', { fxe: `${S}k:erg/c:?/l:?/s:?/m:?`, load: true, gloss: 'Any cardio machine: treadmill, bike, rower, elliptical, stair machine, ski erg. The record’s fxe names which.' }],
  ...formsOf(['sup']).map(form),
]);

/**
 * Accessories (`a`, extended): help the exercise without loading the working muscles or bearing weight. Every FXE
 * accessory atom is an accessory code; `partner` is a person, not equipment, so it has no FXE.
 */
export const ACCESSORIES: Glossary = {
  none: 'No accessory (default, never written).',
  partner: 'A partner who holds, resists or assists.',
  ...Object.fromEntries(formsOf(['acc']).map(([code, atom]) => [code, atom.gloss])),
};

// ───────────────────────────── FXM ─────────────────────────────

/** FXM major version. The muscle alphabet lives in fxm-alphabet.ts. */
export const FXM_MAJOR = 1;
/** Syntax revision written in the header (`FXM=1.0/`). FXM has no extended layers, so it carries no S/N flag. */
export const FXM_REV = 0;

// ───────────────────────────── FXMG ─────────────────────────────

/** FXMG major version. The category alphabet lives in fxmg-alphabet.ts. */
export const FXMG_MAJOR = 1;
/** Syntax revision written in the header (`FXMG=1.0/`). FXMG carries no S/N flag. */
export const FXMG_REV = 0;
