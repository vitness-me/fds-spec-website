# FDS JSON Schema URLs

Every schema published by the Fitness Data Standard, at the version it is published under.

The list here is `specification/schemas/.integrity.json`, which is what the build writes and what `npm run check:published` fetches. Ten schemas are published: seven entities, one definition library, one tooling schema, and one superseded entity version that is still served.

## A release is a set of entity versions

`spec_version` names a release; it is **not** a version every entity shares. The current release is **1.4.0**, and it publishes:

| Entity | Version |
|---|---|
| exercise | 1.1.0 |
| equipment | 1.1.0 |
| muscle | 1.0.0 |
| muscle-category | 1.0.0 |
| body-atlas | 1.0.0 |
| workout | 1.1.0 |
| program | 1.0.0 |

| Release | Adds |
|---|---|
| 1.0.0 | exercise, equipment, muscle, muscle-category, body-atlas |
| 1.1.0 | exercise and equipment move to 1.1.0 |
| 1.2.0 | workout |
| 1.3.0 | program |
| 1.4.0 | workout moves to 1.1.0 |

There is no `muscle/v1.4.0/`, and there will not be unless muscle itself changes. Build URLs from the entity version, not the release. See `specification/discovery.md`.

## Production URLs (spec.vitness.me)

### Exercise Schema (v1.1.0)
- **Schema**: https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json
- **Examples**:
  - https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.json
  - https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.cardio.json
  - https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.mobility.json
  - https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.machine.json
  - https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.unilateral.json
  - https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.assisted.json
  - https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.conditioning.json
  - https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.velocity.json

### Equipment Schema (v1.1.0)
- **Schema**: https://spec.vitness.me/schemas/equipment/v1.1.0/equipment.schema.json
- **Examples**:
  - https://spec.vitness.me/schemas/equipment/v1.1.0/equipment.example.json
  - https://spec.vitness.me/schemas/equipment/v1.1.0/equipment.example.stack.json

### Muscle Schema (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.schema.json
- **Examples**:
  - https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.example.json
  - https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.example.lats.json

### Muscle Category Schema (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json
- **Examples**:
  - https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.example.json

### Body Atlas Schema (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.schema.json
- **Examples**:
  - https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.example.json

### Workout Schema (v1.1.0)
- **Schema**: https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json
- 1.1.0 added per-set intensity zones and machine settings — RFC-007 §6
- **Examples**: 46 worked sessions, one per row of the scenario coverage matrix —
  `workout.<scenario>.example.json` alongside the schema, indexed in its README

### Program Schema (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json
- **Examples**: 18 worked programs — `program.<scenario>.example.json` alongside the schema,
  covering linear, undulating, block, conjugate and adaptive structures

### Prescription Primitives (v1.0.0)
- **Library**: https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json
- A `$defs` library, **not an entity** — see RFC-006. Its root accepts nothing by design, there is no
  prescription document to export, and it never belongs in a provider's `supported_entities`.
  Reference a definition instead: `…/prescription.schema.json#/$defs/loadTarget`
- **Fixtures**: `<definition>.<variant>.example.json` alongside the library, plus `.invalid.json` negative cases

### Transformer Mapping (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/transformer/v1.0.0/mapping.schema.json
- Configures the FDS Transformer rather than describing an entity — it validates a `mapping.json`,
  not exported data. Documented with the tool, in `website/docs/tools/transformer/configuration.md`

## Superseded, still served

### Workout Schema (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/workout/v1.0.0/workout.schema.json
- Superseded by workout 1.1.0, and still published and still frozen: releases 1.2.0 and 1.3.0
  declare workout at 1.0.0, so a client pinned to either must keep resolving this URL
- Not for new work. 1.1.0 only added optional fields, so every 1.0.0 document remains valid under it
- Examples live with the current version, under `workout/v1.1.0/`

## Schema $id Fields

All schema `$id` fields match their serving URLs:

```json
{
  "$id": "https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json"
}
```

`npm run check:published` fetches every URL above and checks three things: that it answers 200 with a JSON content type, that the served document's `$id` matches the URL it came from, and that the bytes hash to what `.integrity.json` froze.

## Validation

Use these URLs directly with JSON Schema validators like Ajv:

```bash
ajv validate \
  -s https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json \
  -d your-exercise.json \
  --spec=draft2020 \
  -c ajv-formats
```

## File Structure

The schemas are served from the `website/static/schemas` directory, which is symlinked to `specification/schemas/`:

```
website/static/schemas -> ../../specification/schemas/
```

This ensures schemas are served as static files at clean URLs without webpack processing.
