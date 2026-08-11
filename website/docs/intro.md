---
title: Welcome to FDS
description: The Fitness Data Standard (FDS) enables interoperable exchange of fitness domain data across applications
sidebar_position: 1
keywords: [fitness, data, standard, exercise, interoperability, json-schema]
---

# Fitness Data Standard (FDS)

Welcome to the **Fitness Data Standard (FDS)** documentation. FDS is an open, interoperable standard for exchanging fitness domain data across applications and platforms.

## Purpose

Enable **data portability** and **interoperability** across fitness applications by providing:

- Normative JSON Schemas for core fitness entities
- High-quality RFCs with examples and implementation guidance
- Flexible extension points for platform-specific needs
- Standardized metadata and lifecycle management

## Current Scope

<!-- fds:count rfcs=8 -->
**In Scope** — eight published RFCs:

- **Exercise data model** (RFC-001)
- **Catalog entities**: Equipment (RFC-002), Muscles (RFC-003), Muscle Categories (RFC-004), Body Atlas (RFC-005)
- **Prescription primitives** (RFC-006): load, repetitions, tempo, rest, intensity zones, set schemes and progression rules
- **Workout data model** (RFC-007): one prescribed session, as blocks of items with an execution mode per block
- **Training program data model** (RFC-008): a schedule of workout references over time

**Out of Scope** — by decision, not by omission:

- **Personal data**: athlete identity, bodyweight, one-rep maxes, and what was actually performed
- **Authentication and authorization**: a data format, not a protocol
- **Generated exercise selection**: a program day references a workout that exists

Carrying no personal values is what makes everything else portable — a catalog, a session or a plan can be published, cached, mirrored and diffed freely precisely because none of them describes a person. See the [roadmap](./governance/roadmap) for what each exclusion costs.

## Quick Start

### For Implementers

1. **Browse** the [Specifications](./specifications/rfc-001-exercise-data-model) to understand the data models
2. **Explore** the [JSON Schemas](./schemas/exercise) with interactive viewers
3. **Validate** your data against the schemas (see [validation guide](./getting-started/quick-validation))
4. **Extend** using the [extension registry](./core-concepts/extensions) for custom needs

### For Contributors

1. **Review** the [Governance](./governance) process
2. **Read** the [Contributing Guide](./governance/contributing)
3. **Propose** improvements via RFC process
4. **Join** the community on [GitHub](https://github.com/vitness-me/fds-spec-website)

## Documentation Structure

- **[Getting Started](./getting-started/overview)** - Overview, validation quickstart, identifier policy
- **[Core Concepts](./core-concepts/internationalization)** - i18n, metrics, extensions, discovery
- **[Specifications](./specifications/rfc-001-exercise-data-model)** - Detailed RFCs for each entity
- **[Schemas](./schemas/exercise)** - Interactive JSON schema viewers with examples
- **[Examples](./examples)** - Examples overview
- **[Governance](./governance)** - Decision process, contributing, changelog

## Key Features

### Semantic Versioning
FDS follows semantic versioning (X.Y.Z) with strict compatibility rules:
- **Major**: Breaking changes to required fields
- **Minor**: Backward-compatible additions
- **Patch**: Non-functional changes (typos, editorial)

### UUID Identifiers
All production identifiers **MUST** be UUIDv4 strings for:
- Exercise IDs
- Equipment, Muscle, Category IDs
- Cross-entity references

### Flexible Extensions
Two structured extension points:
- **`attributes`**: Flat key/values for common extensions
- **`extensions`**: Nested, vendor-scoped structures for complex data

### Status Lifecycle
Entities include `metadata.status` for lifecycle management:
- `draft` → `review` → `active` → `inactive` / `deprecated`

## Learn More

- [Read the full overview](./getting-started/overview)
- [Understand identifiers](./getting-started/identifiers)
- [Browse the Exercise RFC](./specifications/rfc-001-exercise-data-model)
- [Explore schemas interactively](./schemas/exercise)

## License

FDS is licensed under the [VITNESS Open Standards License Agreement](./license).

---

**Ready to get started?** Head to the [Getting Started Guide](./getting-started/overview) →
