---
title: 'RFC-004: Muscle Category Data Model'
description: Standardized data model for muscle categorization and grouping systems
sidebar_position: 4
keywords: [muscle category, grouping, data model, json schema, interoperability, rfc]
---

# RFC-004: Muscle Category Data Model Specification

**Status**: Draft
**Version**: 0.1.0
**Date**: 2025-09-09
**Authors**: VITNESS Team
**Category**: Standards Track

## Abstract

This specification defines a standardized data model for muscle category information to enable interoperability and data portability across fitness applications and platforms. This RFC establishes the structural requirements for muscle category data while allowing platforms to maintain their own grouping systems and categorization hierarchies.

## 1. Introduction

### 1.1. Background

Fitness applications require consistent muscle category definitions for workout organization, training program structure, and progress tracking visualization. Currently, each platform maintains separate muscle grouping systems and categorization hierarchies, creating data fragmentation and limiting interoperability.

### 1.2. Goals

This specification aims to:
1. Define structural requirements for muscle category data interchange
2. Enable seamless muscle category data migration between fitness applications
3. Support platform-specific categorization attributes through extension mechanisms
4. Establish consistent muscle category identification and classification patterns
5. Provide reference JSON Schema implementation for validation

### 1.3. Scope

**In Scope:**
- Core muscle category data structure and required fields
- Extension mechanisms for platform-specific training data
- JSON Schema definitions and validation rules
- Muscle category media and documentation references
- Internationalization support for category names

**Out of Scope:**
- Specific training methodologies or programming systems
- Biomechanical analysis and movement patterns (future RFC)
- Individual workout programming and periodization
- Real-time training load and recovery monitoring

## 2. Terminology

- **Muscle Category**: Logical grouping of related muscles for training and organizational purposes
- **Canonical Data**: Standardized identifying information (name, slug, aliases)
- **Classification**: Flexible categorization using tags
- **Extension**: Platform-specific data that doesn't break interoperability
- **Schema Version**: Semantic version indicating data model compatibility

## 3. Core Structural Requirements

### 3.1. Required Fields

:::danger MUST
All compliant muscle category data **MUST** include these fields:
:::

```json
{
  "schemaVersion": "1.0.0",
  "id": "cat.legs",
  "canonical": {
    "name": "Legs",
    "slug": "legs"
  },
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-09-03T00:00:00Z",
    "source": "vitness.registry",
    "status": "active"
  }
}
```

### 3.2. Optional Standard Fields

Commonly supported optional fields that enhance interoperability:

```json
{
  "canonical": {
    "localized": [
      { "lang": "sr", "name": "Noge" }
    ]
  },
  "classification": {
    "tags": ["major-group", "compound-movements"]
  },
  "media": [],
  "attributes": {
    "complexity": "high",
    "trainingPriority": "essential"
  }
}
```

### 3.3. Extension Mechanisms

Two extension points for platform-specific data:

#### 3.3.1. Attributes (Structured Extensions)
For common extensions that may become standardized:
```json
{
  "attributes": {
    "complexity": "high",
    "trainingPriority": "essential"
  }
}
```

#### 3.3.2. Extensions (Platform-Specific)
For complex platform-unique data structures:
```json
{
  "extensions": {
    "x:programming": {
      "weeklyVolume": "high",
      "recoveryTime": "48-72hrs"
    }
  }
}
```

## 4. Reference Types and Structures

### 4.1. Canonical Information
```json
{
  "canonical": {
    "name": "Legs",
    "slug": "legs",
    "localized": [
      { "lang": "sr", "name": "Noge" }
    ]
  }
}
```

### 4.2. Classification Structure
```json
{
  "classification": {
    "tags": ["major-group", "compound-movements"]
  }
}
```

### 4.3. Media References
```json
{
  "media": [
    {
      "type": "image",
      "uri": "https://cdn.example.com/categories/legs-overview.jpg"
    }
  ]
}
```

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

Version 1.0.0 → 1.1.0 (Adding optional hierarchy field):
```json
{
  "schemaVersion": "1.1.0",
  "id": "cat.legs",
  "canonical": { "name": "Legs", "slug": "legs" },
  "hierarchy": {
    "parentId": "cat.lower-body",
    "level": 2,
    "order": 1
  }
}
```

## 6. Implementation Guidance

### 6.1. Platform Integration

Platforms implementing this standard should:

1. **Maintain Internal Models**: Keep existing muscle grouping systems and categorizations
2. **Export Compliance**: Provide muscle category data in RFC-004 format for portability
3. **Import Translation**: Map incoming RFC-004 data to internal structures
4. **Extension Usage**: Use `extensions` namespace for platform-specific data

### 6.2. Data Migration Workflow

```mermaid
graph LR
    A[Platform A] --> B[RFC-004 Export]
    B --> C[Validation]
    C --> D[Platform B Import]
    D --> E[Internal Mapping]
```

1. Source platform exports muscle categories in RFC-004 format
2. Data validation against JSON Schema
3. Target platform imports and maps to internal model
4. Custom extensions handled based on platform capabilities

## 7. Security and Privacy Considerations

- This specification defines data format only
- Implementations must validate against JSON Schema
- User-generated content in extensions should be sanitized
- Follow standard security practices for data transmission

## 8. JSON Schema Reference

Complete JSON Schema available at:
- **Muscle Category**: `/specification/schemas/muscle/muscle-category/v.1.0.0/muscle-category.schema.json`

## Heatmap Aggregation (Informative)

Muscle category visualizations SHOULD be derived by aggregating the heatmaps of their member muscles. Combine regions by `areaId` within the same `atlasId` (see RFC-003 Heatmap via Body Atlas). Recommended strategies:
- Max aggregation per region: `weight = max(weights)`.
- Or normalized sum with cap at 1.0: `weight = min(1.0, sum(weights))`.

Producers SHOULD avoid publishing separate category heatmaps in core; if needed, platform-specific overrides MAY be provided under `extensions`.

## 8.1. Validation

Validate with Ajv (Draft 2020-12):

```
npx ajv -s specification/schemas/muscle/muscle-category/v.1.0.0/muscle-category.schema.json \
  -d specification/schemas/muscle/muscle-category/v.1.0.0/muscle-category.example.json
```

## 9. Example Implementation

### 9.1. Complete Legs Muscle Category Record

Based on reference implementation (`/specification/schemas/muscle/muscle-category/v.1.0.0/muscle-category.example.json`):

```json
{
  "schemaVersion": "1.0.0",
  "id": "cat.legs",
  "canonical": { 
    "name": "Legs", 
    "slug": "legs",
    "localized": [
      { "lang": "sr", "name": "Noge" }
    ]
  },
  "classification": {
    "tags": ["major-group", "compound-movements"]
  },
  "media": [],
  "attributes": {
    "complexity": "high",
    "trainingPriority": "essential"
  },
  "extensions": {
    "x:programming": {
      "weeklyVolume": "high",
      "recoveryTime": "48-72hrs"
    }
  },
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-09-03T00:00:00Z",
    "source": "vitness.registry",
    "status": "active"
  }
}
```

### 9.2. Platform Import Mapping (TypeScript Example)

```typescript
interface RFC004MuscleCategory {
  schemaVersion: string;
  id: string;
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
  classification?: {
    tags?: string[];
  };
  attributes?: Record<string, any>;
  extensions?: Record<string, any>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    source: string;
    status: string;
  };
}

// Platform-specific import mapping
function importMuscleCategory(rfc004Data: RFC004MuscleCategory) {
  const category = {
    id: rfc004Data.id,
    name: rfc004Data.canonical.name,
    slug: rfc004Data.canonical.slug,
    aliases: rfc004Data.canonical.aliases || [],
    tags: rfc004Data.classification?.tags || [],
    attributes: rfc004Data.attributes || {}
  };

  // Handle programming extensions
  if (rfc004Data.extensions?.['x:programming']) {
    category.programming = rfc004Data.extensions['x:programming'];
  }

  return category;
}
```

## 10. References

## Conformance

**Conforming Producers:**

:::danger MUST
- **MUST** emit JSON that validates against the Muscle Category schema for the declared `schemaVersion`.
- **MUST** use UUIDv4 for all identifiers in production data (e.g., category `id`). Example short IDs in this RFC are illustrative only.
- **MUST** populate all required fields and respect enumerations and structure.
:::

:::tip SHOULD
- **SHOULD** include RFC 3339 UTC timestamps in `metadata`.
:::

**Conforming Consumers:**

:::danger MUST
- **MUST** validate incoming category data against the appropriate schema version.
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
- Extension policy and registry guide: `/specification/extension-registry.md`


### 10.1. Normative References
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [RFC 3339: Date/Time](https://tools.ietf.org/html/rfc3339)
- [RFC-001: Exercise Data Model Specification](./rfc-001-exercise-data-model.md)
- [RFC-002: Equipment Data Model Specification](./rfc-002-equipment-data-model.md)
- [RFC-003: Muscle Data Model Specification](./rfc-003-muscle-data-model.md)

### 10.2. Informative References
- Exercise science muscle grouping conventions
- Training program organization methodologies

---

**Copyright Notice**  
Copyright (c) 2025 VITNESS.
This document is subject to the rights, licenses and restrictions contained in the VITNESS Open Standards License Agreement. See `/specification/VITNESS Open Standards License Agreement.md`.
