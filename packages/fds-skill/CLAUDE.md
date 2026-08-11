# FDS Skill - Claude Code Integration

This directory contains the FDS (Fitness Data Standard) specification skill for AI-assisted development.

Every path below is checked by `npm run check:skill`. A pointer a reader cannot
follow is the same defect as a field name that does not exist, arriving by a
different route — this file shipped eight of them.

## Available Knowledge

When working in this codebase, you have access to comprehensive FDS knowledge:

### Schema Knowledge

Published schemas, at the versions release 1.4.0 names. Entities version
independently, so these paths do **not** share a version number.

- **Exercise Schema** - `/specification/schemas/exercises/v1.1.0/exercise.schema.json`
- **Equipment Schema** - `/specification/schemas/equipment/v1.1.0/equipment.schema.json`
- **Muscle Schema** - `/specification/schemas/muscle/v1.0.0/muscle.schema.json`
- **Muscle Category Schema** - `/specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`
- **Body Atlas Schema** - `/specification/schemas/atlas/v1.0.0/body-atlas.schema.json`
- **Workout Schema** - `/specification/schemas/workout/v1.1.0/workout.schema.json`
- **Program Schema** - `/specification/schemas/program/v1.0.0/program.schema.json`
- **Prescription definitions** - `/specification/schemas/prescription/v1.0.0/prescription.schema.json`
  (a `$defs` library, not an entity — its root validates nothing)

`/specification/releases.json` is the generated manifest: which schemas exist,
which versions are served, which of those is current, and what each release
names. Ask it rather than assuming.

### RFC Documents
- `/specification/rfc/rfc-001-exercise-data-model.md` - Exercise specification
- `/specification/rfc/rfc-002-equipment-data-model.md` - Equipment specification
- `/specification/rfc/rfc-003-muscle-data-model.md` - Muscle specification
- `/specification/rfc/rfc-004-muscle-category-data-model.md` - Muscle category specification
- `/specification/rfc/rfc-005-body-atlas-data-model.md` - Body Atlas specification
- `/specification/rfc/rfc-006-prescription-primitives.md` - Load, rep, tempo, rest, zone and scheme primitives
- `/specification/rfc/rfc-007-workout-data-model.md` - Workout specification
- `/specification/rfc/rfc-008-program-data-model.md` - Program specification

### Registries

Vocabulary registries are **normative**: they carry the recommended values for
the open classifiers. An unrecognised value is still valid and MUST NOT be
rejected.

- `/specification/registries/exercise-type.registry.json` - governs `classification.exerciseType`
- `/specification/registries/workout-type.registry.json` - governs `classification.workoutType`
- `/specification/registries/block-role.registry.json` - governs `blocks[].role`
- `/specification/registries/intensity-zone.registry.json` - governs `intensityZone.boundsRef`

Entity registries are **illustrative worked examples**, not a catalog to ship:

- `/specification/registries/equipment.registry.example.json`
- `/specification/registries/muscles.registry.example.json`
- `/specification/registries/muscle-categories.registry.example.json`

`/specification/registries/README.md` explains which is which, and why the
distinction matters.

## Skill Reference

For detailed FDS knowledge, classification decision trees, and transformation guidance, see:
- `./SKILL.md` - Comprehensive FDS expert skill definition
- `./knowledge/schemas.md` - Every entity's shape, field by field
- `./knowledge/mappings.md` - Source-to-FDS mapping strategies
- `./knowledge/enrichment.md` - When and how to fill gaps with AI

## Key Reminders

### ID Format
- **Production:** Always use UUIDv4 (e.g., `a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5`)
- **Examples only:** Short IDs like `eq.barbell` are illustrative, not for production

<!-- fds:not-a-field eq, barbell — an illustrative documentation-only ID, deliberately not a UUID and deliberately not a field -->

### Slug Pattern
- `^[a-z0-9-]{2,}$`
- Lowercase, hyphens, numbers only
- Minimum 2 characters
- Body-atlas *areas* are the one exception: `^[a-z0-9-.]+$`, dots allowed

### Required Exercise Fields
All exercises MUST have: `schemaVersion`, `exerciseId`, `canonical` (name, slug), `classification` (all 5 fields), `targets.primary`, `metrics.primary`, `metadata` (createdAt, updatedAt, status)

### Enumerations
Reference `./knowledge/schemas.md` for complete enumeration values for:
- `movement` (14 values)
- `mechanics` (2 values)
- `force` (4 values)
- `level` (3 values)
- `metricType` (24 values — 13 from RFC-001, 11 added in 1.1.0)
- `metricUnit` (22 values)
- `status` (5 values)
- `region` (7 values) and `laterality` (5 values)
- `kind` on a body-atlas view (6 values)
- `dayOfWeek` on a program day (7 values, lowercase)

A count here that disagrees with the schema is the same class of defect as a
wrong name. `metricType` said 13 and `metricUnit` said 16 for two releases.
