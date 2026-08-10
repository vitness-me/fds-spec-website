# FDS Schema Reference

## Exercise Schema (v1.1.0)

### Top-Level Structure

```typescript
interface FDSExercise {
  schemaVersion: string;           // Required: "1.0.0"
  exerciseId: string;              // Required: UUIDv4
  canonical: Canonical;            // Required
  classification: Classification;  // Required
  targets: Targets;                // Required
  equipment?: Equipment;           // Optional
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
```

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
  media?: Media[];
  attributes?: Record<string, any>;
  extensions?: Record<string, any>;
  metadata: Metadata;      // Required
}
```

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
    atlasId: string;
    areaIds: string[];
  };
  media?: Media[];
  attributes?: Record<string, any>;
  extensions?: Record<string, any>;
  metadata: Metadata;      // Required
}
```

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
  | "rpe";
```

### MetricUnit
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
  | "in";
```

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
  | { method: 'velocity'; value: number; unit: string }
  | { method: 'level'; value: number | string }
  | { method: 'bandResistance'; /* see schema for payload */ }
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

interface Tempo {          // seconds per phase; the four phases, nothing else
  eccentric?: number; bottomPause?: number;
  concentric?: number; topPause?: number;
}

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
  constraints?: Constraints;
  relations?: Relation[];
  media?: Media[];
  attributes?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  metadata: Metadata;
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
  relations?: Relation[];
  media?: Media[];
  attributes?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  metadata: Metadata;
}

type ScheduleModel = 'calendar' | 'relative' | 'rolling' | 'sequence' | string;

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
