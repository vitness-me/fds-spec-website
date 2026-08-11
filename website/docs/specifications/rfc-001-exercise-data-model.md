---
title: 'RFC-001: Exercise Data Model'
description: Standardized data model for exercise information enabling interoperability across fitness applications
sidebar_position: 1
keywords: [exercise, data model, json schema, fitness, interoperability, rfc]
---

# RFC-001: Exercise Data Model Specification

**Status**: Draft
**Version**: 0.1.0
**Date**: 2025-09-02
**Authors**: VITNESS Team
**Category**: Standards Track

## Abstract

This specification defines a standardized data model for exercise information to enable interoperability and data portability across fitness applications and platforms. This RFC focuses on **how** to structure exercise data rather than dictating specific taxonomies, allowing platforms to maintain their own naming conventions while ensuring compatibility.

## 1. Introduction

### 1.1. Background

The fitness industry suffers from severe data fragmentation where each platform maintains incompatible exercise definitions, muscle group mappings, and categorization systems. This creates user lock-in, developer inefficiency, and ecosystem fragmentation.

### 1.2. Goals

This specification aims to:
1. Define structural requirements for exercise data interchange
2. Enable seamless data migration between fitness applications  
3. Support platform-specific taxonomies through extension mechanisms
4. Establish versioning strategies for long-term ecosystem health
5. Provide reference JSON Schema implementation

### 1.3. Scope

**In Scope:**
- Core exercise data structure and required fields
- Extension mechanisms for platform-specific data
- JSON Schema definitions and validation rules
- Versioning and migration strategies
- Reference examples and implementation guidance

**Out of Scope:**
- Specific exercise taxonomies or naming conventions
- Workout programming (future RFC-006)
- User progress tracking (future RFC-007) 
- Authentication/authorization mechanisms

## 2. Terminology

- **Exercise**: A distinct movement or activity performed for fitness purposes
- **Canonical Data**: Standardized identifying information (name, slug, aliases)
- **Classification**: Structural categorization data (type, movement, mechanics, etc.)
- **Extension**: Platform-specific data that doesn't break interoperability
- **Schema Version**: Semantic version indicating data model compatibility

## 3. Core Structural Requirements

### 3.1. Required Fields

Six fields are required: `schemaVersion`, `exerciseId`, `canonical` (the name and slug this exercise is known by), `classification` (what kind of movement it is), `targets` (what it trains), `metrics` (how it is measured) and `metadata`.

An exercise missing any of them is not identifiable, not classifiable, or not measurable, and each of those makes it unusable to a consumer rather than merely incomplete.

:::danger MUST
All compliant exercise data **MUST** include these fields:
:::

```json
{
  "schemaVersion": "1.1.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
  "canonical": {
    "name": "Back Squat",
    "slug": "back-squat"
  },
  "classification": {
    "exerciseType": "strength",
    "movement": "squat",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate"
  },
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "name": "Quadriceps", "categoryId": "cat.legs" }
    ]
  },
  "metrics": {
    "primary": { "type": "reps", "unit": "count" }
  },
  "metadata": {
    "createdAt": "2025-09-02T15:00:00Z",
    "updatedAt": "2025-09-02T15:00:00Z",
    "status": "active"
  }
}
```

### 3.2. Optional Standard Fields

Four optional fields carry most of what an implementation actually renders.

`equipment` splits into what the movement cannot be performed without and what merely helps. `media` carries demonstration assets.

`constraints` records what the exercise demands before it is attempted: `contraindications` (conditions under which it should not be performed), `prerequisites` (competencies it assumes), `progressions` and `regressions` (harder and easier movements on the same pattern), and `environment` (where it can be done). These are advisory prose rather than machine-enforceable gates — FDS models no athlete to check a prerequisite against.

`relations` links this exercise to others. Each entry carries a `type` from `relationTypes` — `alternate`, `variation`, `substitute`, `progression`, `regression`, `equipmentVariant`, `accessory`, `mobilityPrep`, `similarPattern`, `unilateralPair`, `contralateralPair` — a `targetId`, an optional `confidence` between 0 and 1, and optional `notes`.

`confidence` exists because relations are frequently machine-derived. A consumer filtering a large catalog needs to know whether a link was asserted by an editor or inferred by a similarity pass, and without the field it cannot tell the two apart.

Note that `constraints.progressions` and `constraints.regressions` are free-text descriptions, while a `relations` entry of type `progression` is a link to another exercise. Both exist because an author often knows *that* a movement is harder before the harder movement is in the catalog.

```json fds:fragment entity=exercise
{
  "equipment": {
    "required": [
      { "id": "eq.barbell", "name": "Barbell" },
      { "id": "eq.rack", "name": "Power Rack" }
    ],
    "optional": [
      { "id": "eq.belt", "name": "Lifting Belt" }
    ]
  },
  "constraints": {
    "contraindications": ["Acute knee injury without professional clearance"],
    "prerequisites": ["Bodyweight squat competency"],
    "progressions": ["High-bar back squat", "Paused back squat"],
    "regressions": ["Goblet squat", "Box squat"]
  },
  "relations": [
    { "type": "alternate", "targetId": "urn:slug:front-squat" },
    { "type": "regression", "targetId": "urn:slug:goblet-squat" }
  ],
  "media": [
    {
      "type": "video",
      "uri": "https://cdn.example.com/exercises/back-squat.mp4",
      "caption": "Side view, full-depth demo"
    }
  ]
}
```

### 3.3. Extension Mechanisms

Two extension points for platform-specific data:

#### 3.3.1. Attributes (Structured Extensions)
For common extensions that may become standardized:
```json fds:fragment entity=exercise
{
  "attributes": {
    "x:vitness.barPathHint": "midfoot → midfoot",
    "x:vitness.stanceWidth": "shoulder-width"
  }
}
```

#### 3.3.2. Extensions (Platform-Specific)  
For complex platform-unique data structures:
```json fds:fragment entity=exercise
{
  "extensions": {
    "x:vitness.tempo": { "eccentric": 3, "isometric": 1, "concentric": 1 },
    "x:vitness.rangeOfMotion": { "standard": "hip-crease below knee" }
  }
}
```

## 4. Reference Types and Structures

### 4.1. Canonical Information

`canonical` carries the exercise's identity as a reader sees it: a display `name`, a stable `slug`, optional `aliases`, and `localized` entries giving the name in other languages. The slug is the human-readable identifier and is distinct from `exerciseId`; see §3 of the identifier policy.

```json fds:fragment entity=exercise
{
  "canonical": {
    "name": "Back Squat",
    "slug": "back-squat",
    "aliases": ["Barbell Back Squat", "BB Back Squat"],
    "localized": [
      { "lang": "sr", "name": "Сквот са шипком" },
      { "lang": "es", "name": "Sentadilla trasera", "aliases": ["Sentadilla con barra atrás"] }
    ]
  }
}
```

### 4.2. Classification Structure

`classification` answers what kind of movement this is. Five of its fields are required.

| Field | Meaning |
|---|---|
| `exerciseType` | The broad category — an **open string** per D8, with recommended values in the exercise-type registry. An unrecognised value is a mislabelled exercise, not an invalid one, so consumers warn rather than reject. |
| `movement` | The movement pattern: `squat`, `hinge`, `lunge`, the push and pull directions, `carry`, the core patterns, `rotation`, `locomotion`, `isolation`, `other`. |
| `mechanics` | `compound` or `isolation` — whether more than one joint is involved. |
| `force` | `push`, `pull`, `static` or `mixed`. |
| `level` | `beginner`, `intermediate` or `advanced`. |
| `unilateral` | Whether one side works at a time. Optional, defaulting to false. It is what makes a set's `side` meaningful. |
| `kineticChain` | `open`, `closed` or `mixed`. Optional. |
| `tags` | Free-form labels for filtering. Carries no structural consequence. |
| `taxonomyRefs` | References into an external taxonomy — each an object of `registry`, `id` and an optional human-readable `label`. This is how an implementation keeps its own classification alongside the FDS one without either overwriting the other. |

```json fds:fragment entity=exercise
{
  "classification": {
    "exerciseType": "strength",
    "movement": "squat",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate",
    "unilateral": false,
    "kineticChain": "closed",
    "tags": ["bilateral","hipDominant"]
  }
}
```

### 4.3. Target Muscles

`targets.primary` lists the muscles the exercise is chosen for and is required; `targets.secondary` lists those meaningfully involved but not the point of the movement. Each entry is a muscle reference — an `id`, a display `name`, and the `categoryId` of the group it belongs to — denormalised so a consumer can render the exercise without resolving the muscle catalog.

The split matters to anything computing training volume per muscle: counting secondary involvement as primary inflates volume in a way that compounds across a program.

```json fds:fragment entity=exercise
{
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "name": "Quadriceps", "categoryId": "cat.legs" }
    ],
    "secondary": [
      { "id": "mus.hamstrings", "name": "Hamstrings", "categoryId": "cat.legs" },
      { "id": "mus.erectorSpinae", "name": "Erector Spinae", "categoryId": "cat.back" }
    ]
  }
}
```

### 4.4. Equipment References

`equipment.required` is what the movement cannot be performed without; `equipment.optional` is what changes the experience but not the exercise. Each entry denormalises an `id` and a `name` for the same reason target muscles do.

```json fds:fragment entity=exercise
{
  "equipment": {
    "required": [
      { "id": "eq.barbell", "name": "Barbell" },
      { "id": "eq.rack", "name": "Power Rack" }
    ],
    "optional": [
      { "id": "eq.belt", "name": "Lifting Belt" }
    ]
  }
}
```

### 4.5. Metrics and Measurements

`metrics.primary` is the measurement the exercise is fundamentally counted in, and is required. `metrics.secondary` lists further measurements that apply.

Each is a `{ type, unit }` pair and carries **no value** — this is a shape declaration, not a measurement. Attaching values to these shapes is what a workout prescription does (RFC-007), and a prescription SHOULD only use metric types the exercise declares here.

```json fds:fragment entity=exercise
{
  "metrics": {
    "primary": { "type": "reps", "unit": "count" },
    "secondary": [
      { "type": "weight", "unit": "lb" },
      { "type": "tempo", "unit": "count" },
      { "type": "rpe", "unit": "count" }
    ]
  }
}
```


### 4.6. Loading Characteristics

The optional `loading` object describes **how a movement accepts external load**. It answers what a consumer otherwise has to infer from the exercise name: whether the movement can be loaded at all, whether added load makes it harder or easier, and whether the two sides can be loaded independently.

```json fds:fragment entity=exercise
{
  "loading": {
    "externalLoad": "required",
    "assisted": false,
    "asymmetric": false
  }
}
```

| Field | Type | Default | Meaning |
|---|---|---|---|
| `externalLoad` | `"none"` \| `"optional"` \| `"required"` | — | Whether the movement can carry external load at all |
| `assisted` | boolean | `false` | Load may be negative — assistance reduces effective bodyweight |
| `asymmetric` | boolean | `false` | Left and right sides can be loaded independently |

`externalLoad` values:

- **`none`** — the movement cannot be externally loaded (a standing hamstring stretch). A `weight` metric on such an exercise is a producer error.
- **`optional`** — the movement works loaded or unloaded (a push-up, with or without a plate on the back).
- **`required`** — the movement is meaningless without load (a barbell bench press).

`assisted: true` inverts the sign of load. On an assisted pull-up machine, *more* selected weight makes the movement *easier*. Consumers that plot progress MUST NOT treat an increase in load on an assisted movement as an increase in effort.

`asymmetric: true` means a producer MAY report per-side load; it does not require it.

**Increments are deliberately not part of this object.** The smallest usable load step is a property of the implement, not the movement — a 2.5 kg plate pair, a 5 lb dumbbell jump, one pin on a stack. It lives on `equipment.loading.increment` (RFC-002 §4.4). The same movement performed with dumbbells and with a barbell has two different smallest steps, which a single field on the exercise could not express.

Consumers MUST NOT reject an exercise that omits `loading`. Absence means unstated, not `none`.

## 5. Versioning and Compatibility

### 5.1. Schema Versioning

Following semantic versioning:
- **Major**: Breaking changes to required fields
- **Minor**: New optional fields or enum values  
- **Patch**: Documentation, validation updates

### 5.2. Compatibility Rules

- All data valid in version X.Y.Z must remain valid in X.Y+1.0
- New required fields must provide sensible defaults
- Deprecated fields remain functional for entire major version
- Migration paths must be documented for major version changes

### 5.3. Schema Evolution Example

Version 1.0.0 → 1.1.0 (Adding optional field):
```json fds:ignore a hypothetical next version illustrating how an optional field arrives; no published exercise schema has newOptionalField
{
  "schemaVersion": "1.1.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
  "canonical": { "name": "Back Squat", "slug": "back-squat" },
  "classification": {
    "exerciseType": "strength",
    "movement": "squat", 
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate"
  },
  "newOptionalField": {
    "feature": "value"
  }
}
```

## 6. Implementation Guidance

### 6.1. Platform Integration

Platforms implementing this standard should:

1. **Maintain Internal Models**: Keep existing taxonomies and domain models
2. **Export Compliance**: Provide data in RFC-001 format for portability
3. **Import Translation**: Map incoming RFC-001 data to internal structures
4. **Extension Usage**: Use `extensions` namespace for platform-specific data

### 6.2. Data Migration Workflow

```mermaid
graph LR
    A[Platform A] --> B[RFC-001 Export]
    B --> C[Validation]
    C --> D[Platform B Import]
    D --> E[Internal Mapping]
```

1. Source platform exports exercises in RFC-001 format
2. Data validation against JSON Schema
3. Target platform imports and maps to internal model
4. Custom extensions handled based on platform capabilities

### 6.3. Discovery Mechanism

**TODO**: Evaluate need for well-known discovery endpoint:
```
GET /.well-known/fitness-data-spec
```

Potential response structure:
```json fds:ignore a discovery document, defined by specification/discovery.md rather than by a published schema
{
  "spec_version": "1.0.0",
  "provider": "Platform Name", 
  "supported_extensions": ["namespace:field1", "namespace:field2"],
  "export_endpoint": "/api/exercises/export/rfc001"
}
```

## 7. Security and Privacy Considerations

- This specification defines data format only
- Implementations must validate against JSON Schema
- User-generated content in extensions should be sanitized
- Follow standard security practices for data transmission

## 8. JSON Schema Reference

Complete JSON Schema available at:
- **Exercise**: `/specification/schemas/exercises/v1.1.0/exercise.schema.json`
- **Equipment**: `/specification/schemas/equipment/v1.1.0/equipment.schema.json`  
- **Muscle**: `/specification/schemas/muscle/v1.0.0/muscle.schema.json`

## 8.1. Validation

Validate with Ajv (Draft 2020-12):

```
npx ajv -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json

# Additional examples (optional):
npx ajv -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.cardio.json
npx ajv -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.mobility.json
npx ajv -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.machine.json
npx ajv -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.unilateral.json
```

## 9. Example Implementation

### 9.1. Complete Back Squat Export

Based on reference implementation (`/specification/schemas/exercises/v1.1.0/exercise.example.json`):

```json
{
  "schemaVersion": "1.1.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
  "canonical": {
    "name": "Back Squat",
    "slug": "back-squat",
    "aliases": ["Barbell Back Squat", "BB Back Squat"],
    "localized": [
      { "lang": "sr", "name": "Сквот са шипком" },
      { "lang": "es", "name": "Sentadilla trasera", "aliases": ["Sentadilla con barra atrás"] }
    ]
  },
  "classification": {
    "exerciseType": "strength",
    "movement": "squat",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate",
    "unilateral": false,
    "kineticChain": "closed",
    "tags": ["bilateral","hipDominant"]
  },
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "name": "Quadriceps", "categoryId": "cat.legs" }
    ],
    "secondary": [
      { "id": "mus.hamstrings", "name": "Hamstrings", "categoryId": "cat.legs" },
      { "id": "mus.erectorSpinae", "name": "Erector Spinae", "categoryId": "cat.back" }
    ]
  },
  "equipment": {
    "required": [
      { "id": "eq.barbell", "name": "Barbell" },
      { "id": "eq.rack", "name": "Power Rack" }
    ],
    "optional": [
      { "id": "eq.belt", "name": "Lifting Belt" }
    ]
  },
  "constraints": {
    "contraindications": ["Acute knee injury without professional clearance"],
    "prerequisites": ["Bodyweight squat competency"],
    "progressions": ["High-bar back squat", "Paused back squat"],
    "regressions": ["Goblet squat", "Box squat"]
  },
  "relations": [
    { "type": "alternate", "targetId": "urn:slug:front-squat" },
    { "type": "regression", "targetId": "urn:slug:goblet-squat" }
  ],
  "metrics": {
    "primary": { "type": "reps", "unit": "count" },
    "secondary": [
      { "type": "weight", "unit": "lb" },
      { "type": "tempo", "unit": "count" },
      { "type": "rpe", "unit": "count" }
    ]
  },
  "media": [
    {
      "type": "video",
      "uri": "https://cdn.example.com/exercises/back-squat.mp4",
      "caption": "Side view, full-depth demo",
      "license": "CC BY 4.0",
      "attribution": "Vitness"
    }
  ],
  "attributes": {
    "x:vitness.barPathHint": "midfoot → midfoot",
    "x:vitness.stanceWidth": "shoulder-width"
  },
  "extensions": {
    "x:vitness.tempo": { "eccentric": 3, "isometric": 1, "concentric": 1 },
    "x:vitness.rangeOfMotion": { "standard": "hip-crease below knee" }
  },
  "metadata": {
    "createdAt": "2025-09-02T15:00:00Z",
    "updatedAt": "2025-09-02T15:00:00Z",
    "status": "active",
    "source": "vitness.core",
    "version": "1.0.0"
  }
}
```

### 9.2. Platform Import Mapping (TypeScript Example)

Generic TypeScript example showing how a platform might import RFC-001 data:

```typescript
interface RFC001Exercise {
  schemaVersion: string;
  exerciseId: string;
  canonical: {
    name: string;
    slug: string;
    aliases?: string[];
    localized?: Array<{
      lang: string;
      name: string;
      aliases?: string[];
    }>;
  };
  classification: {
    exerciseType: string;
    movement: string;
    mechanics: string;
    force: string;
    level: string;
    unilateral?: boolean;
    kineticChain?: string;
    tags?: string[];
  };
  // ... other fields
  attributes?: Record<string, any>;
  extensions?: Record<string, any>;
}

// Platform-specific import mapping
function importExercise(rfc001Data: RFC001Exercise) {
  // Map required fields to internal structure
  const exercise = {
    id: rfc001Data.exerciseId,
    name: rfc001Data.canonical.name,
    slug: rfc001Data.canonical.slug,
    type: rfc001Data.classification.exerciseType,
    movement: rfc001Data.classification.movement,
    mechanics: rfc001Data.classification.mechanics,
    primaryMuscles: rfc001Data.targets?.primary?.map(m => ({
      id: m.id,
      name: m.name
    })) || []
  };

  // Handle platform-specific extensions
  if (rfc001Data.extensions?.['x:vitness.tempo']) {
    exercise.tempo = rfc001Data.extensions['x:vitness.tempo'];
  }

  // Handle common attributes
  if (rfc001Data.attributes?.['x:vitness.stanceWidth']) {
    exercise.stanceWidth = rfc001Data.attributes['x:vitness.stanceWidth'];
  }

  return exercise;
}

// Example usage with Back Squat data
const backSquatRFC001 = { /* RFC-001 data from example above */ };
const internalExercise = importExercise(backSquatRFC001);
```

## 10. References

## Conformance

**Conforming Producers:**

:::danger MUST
- **MUST** emit JSON that validates against the Exercise schema for the declared `schemaVersion`.
- **MUST** use UUIDv4 for all identifiers in production data (e.g., `exerciseId` and any referenced IDs). Example short IDs shown in this RFC are illustrative only.
- **MUST** populate all required fields and respect enumerations and structure.
:::

:::tip SHOULD
- **SHOULD** include RFC 3339 UTC timestamps in `metadata` and maintain accurate lifecycle fields.
:::

**Conforming Consumers:**

:::danger MUST
- **MUST** validate incoming exercise data against the appropriate schema version.
- **MUST** ignore unknown keys in `attributes` and `extensions`.
:::

:::tip SHOULD
- **SHOULD** tolerate additional optional fields introduced in newer minor versions.
- **SHOULD** reject data with missing required fields or invalid enumerations.
:::

**Compatibility:**

:::danger MUST
- Optional fields added in minor versions **MUST NOT** break consumers; consumers **SHOULD** ignore unknown optional fields.
- New required fields are a **MAJOR** change and require coordinated upgrades.
:::

---

Additional resources:
- Identifier and UUID policy: `/specification/README.md#identifiers-ids`
- i18n and slug conventions: `/specification/i18n-and-slugs.md`
- Metrics pairing guidance: `/specification/metrics-guide.md`
- Extension policy and registry guide: `/specification/extension-registry.md`
- Discovery endpoint: `/specification/discovery.md`

### 10.1. Normative References
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [RFC 4122: UUID](https://tools.ietf.org/html/rfc4122) 
- [RFC 3339: Date/Time](https://tools.ietf.org/html/rfc3339)
---

Copyright Notice  
Copyright (c) 2025 VITNESS.
This document is subject to the rights, licenses and restrictions contained in the VITNESS Open Standards License Agreement. See `/specification/VITNESS Open Standards License Agreement.md`.
