# FDS Schema Reference

## Exercise Schema (v1.1.0)

### Top-Level Structure

```typescript
interface FDSExercise {
  schemaVersion: string;           // Required: "1.1.0"
  exerciseId: string;              // Required: UUIDv4
  canonical: Canonical;            // Required
  classification: Classification;  // Required
  targets: Targets;                // Required
  equipment?: Equipment;           // Optional
  loading?: ExerciseLoading;       // Optional: 1.1.0
  constraints?: Constraints;       // Optional
  relations?: Relation[];          // Optional
  metrics: Metrics;                // Required
  media?: Media[];                 // Optional
  attributes?: Record<string, any>;// Optional: x: namespaced
  extensions?: Record<string, any>;// Optional: x: namespaced
  metadata: Metadata;              // Required
}
```

### Canonical

```typescript
interface Canonical {
  name: string;          // Required: Display name
  slug: string;          // Required: URL-safe identifier, pattern: ^[a-z0-9-]{2,}$
  description?: string;  // Optional: Detailed description
  aliases?: string[];    // Optional: Alternative names
  localized?: Localized[]; // Optional: Translations
}

interface Localized {
  lang: string;          // Required: ISO 639-1 code
  name: string;          // Required
  description?: string;
  aliases?: string[];
}
```

### Classification

```typescript
interface Classification {
  exerciseType: string;    // Required: strength, cardio, mobility, plyometric, balance
  movement: Movement;      // Required: See enum
  mechanics: Mechanics;    // Required: compound, isolation
  force: Force;            // Required: push, pull, static, mixed
  level: Level;            // Required: beginner, intermediate, advanced
  unilateral?: boolean;    // Optional: default false
  kineticChain?: KineticChain; // Optional: open, closed, mixed
  tags?: string[];         // Optional: free-form tags
  taxonomyRefs?: TaxonomyRef[]; // Optional: external taxonomy references
}
```

### Targets

```typescript
interface Targets {
  primary: MuscleRef[];    // Required: at least 1
  secondary?: MuscleRef[]; // Optional
}

interface MuscleRef {
  id: string;              // Required: UUIDv4
  slug?: string;           // Optional
  name: string;            // Required
  categoryId: string;      // Required: muscle category UUID
  aliases?: string[];      // Optional
}
```

### Equipment

```typescript
interface Equipment {
  required?: EquipmentRef[];
  optional?: EquipmentRef[];
}

interface EquipmentRef {
  id: string;              // Required: UUIDv4
  slug?: string;           // Optional
  name: string;            // Required
  abbreviation?: string;   // Optional
  categories?: string[];   // Optional
  aliases?: string[];      // Optional
}
```

### Loading (1.1.0)

How the *movement* accepts external load. Increments belong to the implement, so
they live on equipment rather than here.

```typescript
interface ExerciseLoading {
  externalLoad?: 'none' | 'optional' | 'required';
  assisted?: boolean;      // load may be negative (assisted pull-up, band-assisted dip)
  asymmetric?: boolean;    // left and right can be loaded independently
}
```

### Constraints and relations

```typescript
interface Constraints {
  contraindications?: string[]; // conditions under which not to prescribe it
  prerequisites?: string[];     // what an athlete needs before attempting it
  progressions?: string[];      // harder variants
  regressions?: string[];       // easier variants
  environment?: string[];       // gym, home, outdoor — open strings
}

interface Relation {
  type: RelationType;      // Required
  targetId: string;        // Required: the other exercise's exerciseId
  confidence?: number;     // 0..1 — how sure the link is, not how strong it is
  notes?: string;
}

type RelationType =
  | 'alternate' | 'variation' | 'substitute' | 'progression' | 'regression'
  | 'equipmentVariant' | 'accessory' | 'mobilityPrep' | 'similarPattern'
  | 'unilateralPair' | 'contralateralPair';
```

`constraints.progressions` and a `relations[]` entry of type `progression` say
different things: the first is free text an author wrote, the second points at an
exercise that exists. Prefer the relation when the target is in the catalog.

### Metrics

```typescript
interface Metrics {
  primary: MetricRef;      // Required
  secondary?: MetricRef[]; // Optional
}

interface MetricRef {
  type: MetricType;        // Required: See enum
  unit: MetricUnit;        // Required: See enum
}
```

### Metadata

```typescript
interface Metadata {
  createdAt: string;       // Required: ISO 8601 datetime
  updatedAt: string;       // Required: ISO 8601 datetime
  source?: string;         // Optional: data source identifier
  version?: string;        // Optional: record version
  status: Status;          // Required: See enum
  deprecated?: {
    since?: string;        // Schema version when deprecated
    replacedBy?: string;   // ID of replacement exercise
  };
  externalRefs?: ExternalRef[];
  history?: HistoryEntry[];
}

interface ExternalRef {
  system: string;          // Required: external system name
  id: string;              // Required: ID in that system
}

interface HistoryEntry {   // an editorial trail, not performed data
  at?: string;             // ISO 8601 datetime
  actor?: string;          // who or what made the change — free text, not a person record
  change?: string;
}
```

`metadata.history[].actor` is the only place FDS names anyone at all, and it
names an *editor* of the catalog rather than an athlete. It is free text; there
is no User entity behind it, and there is not going to be (D6).

### Media

```typescript
interface MediaItem {
  type: "image" | "video" | "doc" | "3d";  // Required
  uri: string;             // Required: URI format
  caption?: string;
  license?: string;
  attribution?: string;
}
```

---

## Equipment Schema (v1.1.0)

```typescript
interface FDSEquipment {
  schemaVersion: string;   // Required
  id: string;              // Required: UUIDv4
  canonical: {
    name: string;          // Required
    slug: string;          // Required
    abbreviation?: string;
    description?: string;
    aliases?: string[];
    localized?: Localized[];
  };
  classification?: {
    tags?: string[];
  };
  loading?: EquipmentLoading;  // 1.1.0
  media?: Media[];
  attributes?: Record<string, any>;
  extensions?: Record<string, any>;
  metadata: Metadata;      // Required
}

interface EquipmentLoading {   // 1.1.0 — loading characteristics of an implement
  increment?: { value: number; unit: MetricUnit };
  stackBased?: boolean;        // load comes from discrete stack positions
}
```

`loading.increment` is the smallest usable step — a 2.5 kg plate pair, a 5 lb
dumbbell jump, one pin on a stack — and it is authoritative for plate math. A
consumer rounding a computed load MUST round to it rather than to a guess.

`stackBased: true` says the implement has no continuous range, so "add 1 kg" is
not an instruction it can carry out.

---

## Muscle Schema (v1.0.0)

```typescript
interface FDSMuscle {
  schemaVersion: string;   // Required
  id: string;              // Required: UUIDv4
  canonical: {
    name: string;          // Required
    slug: string;          // Required
    description?: string;
    aliases?: string[];
    localized?: Localized[];
  };
  classification: {
    categoryId: string;    // Required: muscle category UUID
    region: RegionGroup;   // Required: See enum
    laterality?: Laterality;
  };
  heatmap?: {
    atlasId: string;                 // Required within heatmap
    regions: HeatmapRegion[];        // Required within heatmap, >= 1
  };
  media?: Media[];
  attributes?: Record<string, any>;
  extensions?: Record<string, any>;
  metadata: Metadata;      // Required
}

interface HeatmapRegion {
  areaId: string;          // Required: an `areas[].id` in the referenced atlas
  weight?: number;         // 0..1, default 1 — how strongly this muscle shades that area
}
```

A muscle binds to an atlas by naming **areas**, not by carrying geometry. There
is no `areaIds: string[]`: a region is an object, because the weight has to live
somewhere and a bare list of ids has nowhere to put it.

---

## Muscle Category Schema (v1.0.0)

```typescript
interface FDSMuscleCategory {
  schemaVersion: string;   // Required
  id: string;              // Required: UUIDv4
  canonical: {
    name: string;          // Required
    slug: string;          // Required
    description?: string;
    aliases?: string[];
    localized?: Localized[];
  };
  classification?: {
    tags?: string[];
  };
  media?: Media[];
  attributes?: Record<string, any>;
  extensions?: Record<string, any>;
  metadata: Metadata;      // Required
}
```

---

## Body Atlas Schema (v1.0.0)

An atlas is a set of drawings of a body and a set of named areas on them. It is
what makes a heatmap renderable: a muscle names `areaId`s, and the atlas is what
turns each of those into something on screen.

```typescript
interface FDSBodyAtlas {
  schemaVersion: string;   // Required
  id: string;              // Required: UUIDv4
  canonical: {
    name: string;          // Required
    slug: string;          // Required
    description?: string;
    localized?: Localized[];
  };
  views: AtlasView[];      // REQUIRED, >= 1
  areas: AtlasArea[];      // REQUIRED, >= 1
  attributes?: Record<string, any>;
  extensions?: Record<string, any>;
  metadata: Metadata;      // Required
}

interface AtlasView {      // one drawing
  id: string;              // Required
  kind: ViewKind;          // Required
  asset: {                 // Required
    type: 'svg' | 'image' | '3d';
    uri: string;           // URI format
  };
}

type ViewKind = 'anterior' | 'posterior' | 'left-lateral' | 'right-lateral'
              | 'superior' | 'inferior';

interface AtlasArea {      // one nameable region, across every view it appears in
  id: string;              // Required — this is what a muscle's areaId points at
  canonical: { name: string; slug: string; localized?: Localized[] };  // Required
  bindings: AreaBinding[]; // Required, >= 1
}

interface AreaBinding {
  viewId: string;          // Required — an `views[].id` in this same atlas
  selector: string;        // Required — how to find the shape inside that asset
}
```

Two things are easy to get backwards. `views` and `areas` are both **required**
and both **non-empty** — an atlas with no drawing or no named area describes
nothing. And an area is not per-view: one `areas[]` entry carries a `bindings[]`
entry for *each* view it is visible in, which is why "left quadriceps" is one
area with an anterior binding rather than one area per drawing.

`selector` is opaque to FDS. For an `svg` asset it is conventionally a CSS
selector or element id; the standard does not constrain it, because the atlas
author and the renderer are the two parties that have to agree, and FDS is
neither.

The atlas's area slugs use a looser pattern than the rest of FDS —
`^[a-z0-9-.]+$`, dots allowed — so `quad.left` is a legal area slug where it
would not be a legal exercise slug.

<!-- fds:not-a-field quad — half of an illustrative area slug, not a field -->


---

## Enumerations

### Movement
```typescript
type Movement = 
  | "squat"
  | "hinge"
  | "lunge"
  | "push-horizontal"
  | "push-vertical"
  | "pull-horizontal"
  | "pull-vertical"
  | "carry"
  | "core-anti-extension"
  | "core-anti-rotation"
  | "rotation"
  | "locomotion"
  | "isolation"
  | "other";
```

### MetricType

24 members. RFC-001 defined the first thirteen; release 1.1.0 added the rest so
that a prescription and an exercise's tracking metrics draw on one vocabulary
instead of two.

```typescript
type MetricType =
  | "reps"
  | "weight"
  | "duration"
  | "distance"
  | "speed"
  | "pace"
  | "power"
  | "heartRate"
  | "steps"
  | "calories"
  | "height"
  | "tempo"
  | "rpe"
  // 1.1.0
  | "rir"
  | "percent1RM"
  | "percentBodyweight"
  | "velocity"
  | "cadence"
  | "rounds"
  | "sets"
  | "rest"
  | "incline"
  | "resistanceLevel"
  | "oneRepMax";
```

### MetricUnit

22 members.

```typescript
type MetricUnit =
  | "count"
  | "kg"
  | "lb"
  | "s"
  | "min"
  | "m"
  | "km"
  | "mi"
  | "m_s"
  | "km_h"
  | "min_per_km"
  | "min_per_mi"
  | "W"
  | "bpm"
  | "kcal"
  | "cm"
  | "in"
  // 1.1.0
  | "percent"
  | "rpm"      // revolutions per minute — bike cadence
  | "spm"      // strokes or steps per minute — rowing, running
  | "level"    // a machine's own scale, meaningless without the machine
  | "ms";      // milliseconds, for timings a second cannot express
```

A `level` value is not comparable across machines: level 8 on one manufacturer's
bike is not level 8 on another's. That is why a machine load is a `loadTarget`
with `method: "level"` and a named `scale` rather than a number on its own.

### RegionGroup
```typescript
type RegionGroup =
  | "upper-front"
  | "upper-back"
  | "lower-front"
  | "lower-back"
  | "core"
  | "full-body"
  | "n/a";
```

### Status
```typescript
type Status =
  | "draft"
  | "review"
  | "active"
  | "inactive"
  | "deprecated";
```


---

## Prescription Definitions (v1.0.0)

Not an entity. `prescription.schema.json` has a root of `{"not": {}}` — it validates nothing, by construction. Validate against a definition inside it.

```typescript
// loadTarget — a discriminated union on `method`, 13 known members plus a
// disjoint catch-all. The catch-all excludes every known value, which is
// load-bearing: without it a correct document matches two branches and is
// rejected, and a malformed known method falls through and silently validates.
type LoadTarget =
  | { method: 'absolute'; value: number; unit: 'kg' | 'lb'; range?: LoadRange }
  | { method: 'percent1RM'; value: number; referenceExerciseId?: string; range?: LoadRange }
  | { method: 'percentBodyweight'; value: number }
  | { method: 'rpe'; value: number; allowHalf?: boolean; range?: LoadRange }
  | { method: 'rir'; value: number; range?: LoadRange }
  | { method: 'velocity'; value: number; unit: 'm_s';
      lossThreshold?: number; range?: LoadRange }   // % bar-speed drop that ends the set
  | { method: 'level'; value: number | string; scale?: string; range?: LoadRange }
  | { method: 'bandResistance'; equipment?: EquipmentRef; colour?: string;
      estimatedLoad?: { value: number; unit: 'kg' | 'lb' }; range?: LoadRange }
  | { method: 'assisted'; value: number; unit: 'kg' | 'lb' }
  | { method: 'relative'; basis: 'lastSession' | 'e1RM' | 'trainingMax';
      delta: number; deltaUnit: 'kg' | 'lb' | 'percent'; referenceExerciseId?: string }
  | { method: 'bodyweight' }
  | { method: 'autoregulated'; progressionRuleRef: string }
  | { method: 'none' }
  | { method: string };   // unrecognised — ignore it, never guess

type RepTarget =
  | { kind: 'fixed'; value: number }
  | { kind: 'range'; min: number; max: number }
  | { kind: 'amrap'; min?: number; cap?: number }      // note: `cap`, not `max`
  | { kind: 'toFailure'; technical?: boolean }
  | { kind: 'time'; value: number; unit: string }
  | { kind: 'distance'; value: number; unit: string }
  | { kind: 'calories'; value: number }
  | { kind: 'maxHold'; min?: number; cap?: number; unit?: string }
  | { kind: string };     // unrecognised

interface Tempo {          // per-phase timing; the four phases, nothing else
  eccentric?: TempoPhase; bottomPause?: TempoPhase;
  concentric?: TempoPhase; topPause?: TempoPhase;
}

type TempoPhase = number | 'X';   // seconds, or "X" for explosive

type RestSpec =            // `appliesTo` is a restScope on every branch
  | { method: 'fixed'; appliesTo: RestScope; value: number; unit: string }
  | { method: 'range'; appliesTo: RestScope; min: number; max: number; unit: string }
  | { method: 'toHeartRate'; appliesTo: RestScope; value: number; unit: string }
  | { method: 'asNeeded'; appliesTo: RestScope }
  | { method: 'ratio'; appliesTo: RestScope; work: number; rest: number }
  | { method: string };

type RestScope = 'set' | 'group' | 'round' | 'block';

interface IntensityZone {
  system: 'heartRate' | 'power' | 'pace' | 'perceived';  // closed enum
  zone: string;            // "Z4" — meaningless without boundsRef
  boundsRef?: string;      // an entry in intensity-zone.registry.json
}

interface SetScheme {
  pattern: 'straight' | 'ramping' | 'reversePyramid' | 'drop' | 'restPause'
         | 'cluster' | 'myoReps' | 'wave' | 'ladder' | 'density'
         | 'topSetBackoff';   // CLOSED — no catch-all, deliberately
  sets?: number;
  params?: Record<string, unknown>;   // open; conventions in RFC-006 §4.6
}

interface ProgressionRule {
  id: string;
  name?: string;
  trigger: { kind: 'allRepsCompleted' | 'topOfRepRange' | 'rpeBelow' | 'rirAbove'
           | 'amrapThreshold' | 'sessionsCompleted' | 'failedAttempts' | 'always';
           [k: string]: unknown };
  action: { kind: 'increaseLoad' | 'decreaseLoad' | 'increaseReps' | 'increaseSets'
          | 'deload' | 'retest' | 'advanceStage' | 'hold';
          [k: string]: unknown };
  notes?: string;
}
```

`setScheme.pattern` is the one closed union with **no** catch-all. Expanding a pattern requires knowing its semantics, so accepting an unknown one would defer the failure to the point where it does damage.

## Workout Schema (v1.1.0)

```typescript
interface FDSWorkout {
  schemaVersion: string;
  workoutId: string;               // UUIDv4
  canonical: Canonical;
  classification: {
    workoutType: string;           // open — see workout-type.registry.json
    level?: 'beginner' | 'intermediate' | 'advanced';
    focus?: string[];
    estimatedDuration?: { value: number; unit: 's' | 'min' };
    environment?: string[];
    tags?: string[];
  };
  structure: { blocks: Block[] };  // >= 1 block
  targets?: Targets;               // ADVISORY rollup — recompute if it matters
  equipment?: { required?: EquipmentRef[]; optional?: EquipmentRef[] };
  metrics?: Metrics;
  constraints?: Constraints;       // contraindications, prerequisites, environment
  relations?: WorkoutRelation[];
  media?: Media[];
  attributes?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  metadata: Metadata;
}

interface WorkoutRelation {        // NOT the exercise relation vocabulary
  type: 'alternate' | 'variation' | 'progression' | 'regression'
      | 'deload' | 'test';
  targetId: string;                // another workoutId
  notes?: string;
}

interface Block {
  id: string;
  name?: string;
  role?: string;                   // open — see block-role.registry.json
  mode: BlockMode;                 // STRUCTURAL discriminator
  modeParams?: Record<string, unknown>;
  rest?: RestSpec;
  items: BlockItem[];              // >= 1
  notes?: string;
}

type BlockMode = 'sequential' | 'superset' | 'circuit' | 'emom'
               | 'amrap' | 'forTime' | 'tabata' | 'interval' | string;

interface BlockItem {
  id: string;
  groupLabel?: string;             // "A1"/"A2" — alternated
  exercise: ExerciseRef;
  alternatives?: ExerciseRef[];    // author-sanctioned substitutions
  sets?: SetPrescription[];        // XOR with `scheme`
  scheme?: SetScheme;              // XOR with `sets`
  load?: LoadTarget; reps?: RepTarget; tempo?: Tempo; rest?: RestSpec;
  zone?: IntensityZone;
  settings?: MachineSetting[];     // 1.1.0
  repStyle?: RepStyle;
  media?: Media[];
  notes?: string;
}

interface MachineSetting {         // 1.1.0 — incline, cadence, and the like
  type: MetricType;                // from the shared RFC-001 vocabulary
  unit: MetricUnit;
  value: number;
  range?: { min: number; max: number };
  notes?: string;
}

interface SetPrescription {
  index: number;                   // 1-based, explicit so it can be referenced
  type?: 'warmup' | 'working' | 'backoff' | 'drop' | 'cluster' | 'amrap';
  load?: LoadTarget; reps?: RepTarget; tempo?: Tempo; rest?: RestSpec;
  zone?: IntensityZone;            // 1.1.0 — was item-level only
  settings?: MachineSetting[];     // 1.1.0
  schemeParams?: Record<string, unknown>;
  repStyle?: RepStyle;
  side?: 'both' | 'left' | 'right';
  notes?: string;
}

interface RepStyle {
  rangeOfMotion?: 'full' | 'partial' | 'extended';
  segment?: 'top' | 'bottom' | 'mid';
  pattern?: 'standard' | 'oneAndAHalf' | 'pulse';
}
```

Exclude `type: 'warmup'` sets from training-volume calculations; counting them inflates volume in a way that compounds across a program.

## Program Schema (v1.0.0)

```typescript
interface FDSProgram {
  schemaVersion: string;
  programId: string;               // UUIDv4
  canonical: Canonical;
  classification: {
    periodization: string;         // open classifier
    goal?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    durationWeeks?: number;        // ADVISORY — must equal the sum of cycles
    tags?: string[];
  };
  authorship?: {                   // first rights claim in FDS
    author?: string; organization?: string;
    license?: string;              // absent means UNSTATED, not public domain
    attribution?: string; uri?: string;
  };
  schedule: { model: ScheduleModel; cycles: Cycle[] };
  progressions?: ProgressionRule[];
  references?: { trainingMaxes?: TrainingMaxSlot[] };
  branching?: Branch[];
  relations?: ProgramRelation[];
  media?: Media[];
  attributes?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  metadata: Metadata;
}

type ScheduleModel = 'calendar' | 'relative' | 'rolling' | 'sequence' | string;

interface ProgramRelation {        // a third, separate relation vocabulary
  type: 'successor' | 'predecessor' | 'variant'
      | 'beginnerVariant' | 'advancedVariant';
  targetId: string;                // another programId
  notes?: string;
}

type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday'
             | 'friday' | 'saturday' | 'sunday';   // lowercase, closed

interface Cycle {
  id: string; name?: string;
  type: 'macro' | 'meso' | 'micro';
  order: number;                   // nesting is by type+order, not embedding
  durationWeeks?: number;
  intent?: string;                 // open classifier
  weeks: Week[];                   // >= 1
  notes?: string;
}

interface Week {
  index: number;                   // 1-based
  name?: string;
  deload?: boolean;                // a flag, not an intent value
  days: Day[];                     // >= 1
  notes?: string;
}

interface Day {
  id?: string;                     // required if a branch targets it
  index: number;
  dayOfWeek?: Weekday;             // authoritative under `calendar`
  offsetDays?: number;             // authoritative under `relative`/`rolling`
  rest?: boolean;                  // EXACTLY ONE of `rest: true` or `workout`
  optional?: boolean;
  workout?: WorkoutRef;
  overrides?: DayOverrides;
  notes?: string;
}

interface DayOverrides {
  loadScaling?: number;            // applied AFTER the load target resolves
  volumeScaling?: number;
  progressionState?: Record<string, unknown>;
  notes?: string;
}

interface TrainingMaxSlot {
  id?: string;                     // a local handle; NOT what percent1RM matches
  exercise: ExerciseRef;           // this is what a percent1RM matches on
  method: 'testedOneRepMax' | 'estimatedOneRepMax' | 'percentOfOneRepMax'
        | 'recentBest' | 'callerSupplied';
  percent?: number;
  notes?: string;
  // NO VALUE FIELD. Adding one makes the program personal data. RFC-008 §8.1.
}

interface Branch {
  id: string;
  condition: { kind: 'failedPrescribedReps' | 'metPrescribedReps'
             | 'amrapBelowThreshold' | 'amrapAboveThreshold'
             | 'missedSession' | 'athleteChoice';
             onDayRef?: string; [k: string]: unknown };
  thenDayRef: string;
  elseDayRef?: string;
  notes?: string;
}
```

A condition you cannot evaluate means following the unconditional schedule and warning — never guessing the branch.
