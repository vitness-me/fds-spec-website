# FDS Schema Reference

## Exercise Schema (v1.0.0)

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

## Equipment Schema (v1.0.0)

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
