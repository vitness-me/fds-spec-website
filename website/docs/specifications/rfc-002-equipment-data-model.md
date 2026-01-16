---
title: 'RFC-002: Equipment Data Model'
description: Standardized data model for fitness equipment enabling interoperability across platforms
sidebar_position: 2
keywords: [equipment, data model, json schema, fitness, interoperability, rfc]
---

# RFC-002: Equipment Data Model Specification

**Status**: Draft
**Version**: 0.1.0
**Date**: 2025-09-09
**Authors**: VITNESS Team
**Category**: Standards Track

## Abstract

This specification defines a standardized data model for fitness equipment information to enable interoperability and data portability across fitness applications and platforms. This RFC establishes the structural requirements for equipment data while allowing platforms to maintain their own categorization systems and equipment taxonomies.

## 1. Introduction

### 1.1. Background

Fitness applications require consistent equipment definitions for exercise categorization, workout planning, and gym inventory management. Currently, each platform maintains separate equipment taxonomies, creating data fragmentation and limiting interoperability.

### 1.2. Goals

This specification aims to:
1. Define structural requirements for equipment data interchange
2. Enable seamless equipment data migration between fitness applications
3. Support platform-specific equipment attributes through extension mechanisms
4. Establish consistent equipment identification and categorization patterns
5. Provide reference JSON Schema implementation for validation

### 1.3. Scope

**In Scope:**
- Core equipment data structure and required fields
- Extension mechanisms for platform-specific equipment data
- JSON Schema definitions and validation rules
- Equipment media and documentation references
- Internationalization support for equipment names

**Out of Scope:**
- Specific equipment taxonomies or brand catalogs
- Equipment maintenance and lifecycle management (future RFC)
- Pricing and commercial transaction data
- Real-time equipment availability or booking systems

## 2. Terminology

- **Equipment**: Physical fitness tools, machines, or accessories used in exercise performance
- **Canonical Data**: Standardized identifying information (name, slug, aliases, abbreviations)
- **Classification**: Structural categorization data using flexible tags
- **Extension**: Platform-specific data that doesn't break interoperability
- **Schema Version**: Semantic version indicating data model compatibility
- **Attributes**: Flexible key-value storage for equipment-specific properties

## 3. Core Structural Requirements

### 3.1. Required Fields

:::danger MUST
All compliant equipment data **MUST** include these fields:
:::

```json
{
  "schemaVersion": "1.0.0",
  "id": "eq.barbell",
  "canonical": {
    "name": "Barbell",
    "slug": "barbell"
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
    "abbreviation": "BB",
    "aliases": ["Olympic Bar"],
    "localized": [
      { "lang": "sr", "name": "Sipka" }
    ]
  },
  "classification": {
    "tags": ["free-weight"]
  },
  "media": [
    {
      "type": "image",
      "uri": "https://example.com/barbell.jpg"
    }
  ]
}
```

### 3.3. Extension Mechanisms

Two extension points for platform-specific data:

#### 3.3.1. Attributes (Structured Extensions)
For common extensions that may become standardized:
```json
{
  "attributes": {
    "standardWeight": "20kg",
    "material": "steel",
    "length": "7ft"
  }
}
```

#### 3.3.2. Extensions (Platform-Specific)
For complex platform-unique data structures:
```json
{
  "extensions": {
    "x:gym-management": {
      "inventory": {"count": 5, "location": "free-weight-area"},
      "maintenance": {"lastInspection": "2025-08-15", "nextDue": "2025-11-15"}
    }
  }
}
```

## 4. Reference Types and Structures

### 4.1. Canonical Information
```json
{
  "canonical": {
    "name": "Barbell",
    "slug": "barbell",
    "abbreviation": "BB",
    "aliases": ["Olympic Bar"],
    "localized": [
      { "lang": "sr", "name": "Sipka" }
    ]
  }
}
```

### 4.2. Classification Structure
```json
{
  "classification": {
    "tags": ["free-weight"]
  }
}
```

### 4.3. Media References
```json
{
  "media": [
    {
      "type": "image",
      "uri": "https://cdn.example.com/equipment/barbell.jpg"
    },
    {
      "type": "video",
      "uri": "https://cdn.example.com/equipment/barbell-overview.mp4"
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

Version 1.0.0 → 1.1.0 (Adding optional certification field):
```json
{
  "schemaVersion": "1.1.0",
  "id": "eq.barbell",
  "canonical": { "name": "Barbell", "slug": "barbell" },
  "certification": {
    "standard": "IWF",
    "validUntil": "2030-12-31",
    "certifiedBy": "International Weightlifting Federation"
  }
}
```

## 6. Implementation Guidance

### 6.1. Platform Integration

Platforms implementing this standard should:

1. **Maintain Internal Models**: Keep existing equipment catalogs and categorization
2. **Export Compliance**: Provide equipment data in RFC-002 format for portability
3. **Import Translation**: Map incoming RFC-002 data to internal structures
4. **Extension Usage**: Use `extensions` namespace for platform-specific data

### 6.2. Data Migration Workflow

```mermaid
graph LR
    A[Platform A] --> B[RFC-002 Export]
    B --> C[Validation]
    C --> D[Platform B Import]
    D --> E[Internal Mapping]
```

1. Source platform exports equipment in RFC-002 format
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
- **Equipment**: `/specification/schemas/equipment/v.1.0.0/equipment.schema.json`

## 8.1. Validation

Validate with Ajv (Draft 2020-12):

```
npx ajv -s specification/schemas/equipment/v.1.0.0/equipment.schema.json \
  -d specification/schemas/equipment/v.1.0.0/equipment.example.json
```

## 9. Example Implementation

### 9.1. Complete Barbell Equipment Record

Based on reference implementation (`/specification/schemas/equipment/v.1.0.0/equipment.example.json`):

```json
{
  "schemaVersion": "1.0.0",
  "id": "eq.barbell",
  "canonical": { 
    "name": "Barbell", 
    "slug": "barbell", 
    "aliases": ["Olympic Bar"],
    "abbreviation" : "BB",
    "localized": [
      { "lang": "sr", "name": "Sipka" }
    ]
  },
  "classification": { 
    "tags": ["free-weight"]
  },
  "media": [
    {
      "type": "image",
      "uri": "https://example.com/barbell.jpg"
    }
  ],
  "attributes": {
    "standardWeight": "20kg",
    "material": "steel",
    "length": "7ft"
  },
  "extensions": {
    "x:gym-management": {
      "inventory": {"count": 5, "location": "free-weight-area"},
      "maintenance": {"lastInspection": "2025-08-15", "nextDue": "2025-11-15"}
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
interface RFC002Equipment {
  schemaVersion: string;
  id: string;
  canonical: {
    name: string;
    slug: string;
    abbreviation?: string;
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
function importEquipment(rfc002Data: RFC002Equipment) {
  const equipment = {
    id: rfc002Data.id,
    name: rfc002Data.canonical.name,
    slug: rfc002Data.canonical.slug,
    abbreviation: rfc002Data.canonical.abbreviation,
    aliases: rfc002Data.canonical.aliases || [],
    tags: rfc002Data.classification?.tags || [],
    attributes: rfc002Data.attributes || {}
  };

  // Handle gym management extensions
  if (rfc002Data.extensions?.['x:gym-management']) {
    equipment.inventory = rfc002Data.extensions['x:gym-management'].inventory;
    equipment.maintenance = rfc002Data.extensions['x:gym-management'].maintenance;
  }

  return equipment;
}
```

## 10. References

## Conformance

**Conforming Producers:**

:::danger MUST
- **MUST** emit JSON that validates against the Equipment schema for the declared `schemaVersion`.
- **MUST** use UUIDv4 for all identifiers in production data (e.g., equipment `id`). Example short IDs in this RFC are illustrative only.
- **MUST** populate all required fields and respect enumerations and structure.
:::

:::tip SHOULD
- **SHOULD** include RFC 3339 UTC timestamps in `metadata`.
:::

**Conforming Consumers:**

:::danger MUST
- **MUST** validate incoming equipment data against the appropriate schema version.
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

Copyright Notice  
Copyright (c) 2025 VITNESS.
This document is subject to the rights, licenses and restrictions contained in the VITNESS Open Standards License Agreement. See `/specification/VITNESS Open Standards License Agreement.md`.

---

Additional resources:
- Identifier and UUID policy: `/specification/README.md#identifiers-ids`
- i18n and slug conventions: `/specification/i18n-and-slugs.md`
- Metrics pairing guidance: `/specification/metrics-guide.md`
- Extension policy and registry guide: `/specification/extension-registry.md`
- Discovery endpoint: `/specification/discovery.md`

### 10.1. Normative References
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [RFC 3339: Date/Time](https://tools.ietf.org/html/rfc3339)
- [RFC-001: Exercise Data Model Specification](./rfc-001-exercise-data-model.md)

### 10.2. Informative References
- ISO 20957 (Stationary training equipment)
- Equipment safety standards and certifications

---

**Copyright Notice**  
Copyright (c) 2025 VITNESS. This document is subject to the rights, licenses and restrictions contained in the VITNESS Open Standards License Agreement.
