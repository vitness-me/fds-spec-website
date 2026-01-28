# FDS Skill - Claude Code Integration

This directory contains the FDS (Fitness Data Standard) specification skill for AI-assisted development.

## Available Knowledge

When working in this codebase, you have access to comprehensive FDS knowledge:

### Schema Knowledge
- **Exercise Schema** - Full structure at `/specification/schemas/exercises/v1.0.0/exercise.schema.json`
- **Equipment Schema** - Structure at `/specification/schemas/equipment/v1.0.0/equipment.schema.json`
- **Muscle Schema** - Structure at `/specification/schemas/muscle/v1.0.0/muscle.schema.json`
- **Muscle Category Schema** - Structure at `/specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`
- **Body Atlas Schema** - Structure at `/specification/schemas/atlas/v1.0.0/body-atlas.schema.json`

### RFC Documents
- `/specification/rfc/001-exercise-data-model.md` - Exercise specification
- `/specification/rfc/002-equipment-data-model.md` - Equipment specification
- `/specification/rfc/003-muscle-data-model.md` - Muscle specification
- `/specification/rfc/004-muscle-category-data-model.md` - Muscle category specification
- `/specification/rfc/005-body-atlas-data-model.md` - Body Atlas specification

### Registries (Generated)
- `/packages/fds-transformer/registries/equipment.registry.json` - 31 equipment items
- `/packages/fds-transformer/registries/muscles.registry.json` - 41 muscle definitions
- `/packages/fds-transformer/registries/muscle-categories.registry.json` - 10 categories

## Skill Reference

For detailed FDS knowledge, classification decision trees, and transformation guidance, see:
- `./SKILL.md` - Comprehensive FDS expert skill definition

## Key Reminders

### ID Format
- **Production:** Always use UUIDv4 (e.g., `a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5`)
- **Examples only:** Short IDs like `eq.barbell` are illustrative, not for production

### Slug Pattern
- `^[a-z0-9-]{2,}$`
- Lowercase, hyphens, numbers only
- Minimum 2 characters

### Required Exercise Fields
All exercises MUST have: `schemaVersion`, `exerciseId`, `canonical` (name, slug), `classification` (all 5 fields), `targets.primary`, `metrics.primary`, `metadata` (createdAt, updatedAt, status)

### Enumerations
Reference `./SKILL.md` for complete enumeration values for:
- `movement` (14 values)
- `mechanics` (2 values)
- `force` (4 values)
- `level` (3 values)
- `metricType` (13 values)
- `metricUnit` (16 values)
- `status` (5 values)
