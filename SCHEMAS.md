# FDS JSON Schema URLs

All schemas are available at the following URLs:

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

### Workout Schema (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/workout/v1.0.0/workout.schema.json
- **Examples**: 36 worked sessions, one per row of the scenario coverage matrix —
  `workout.<scenario>.example.json` alongside the schema, indexed in its README

### Prescription Primitives (v1.0.0)
- **Library**: https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json
- A `$defs` library, not an entity — see RFC-006. Its root accepts nothing by design; reference a definition:
  `…/prescription.schema.json#/$defs/loadTarget`
- **Fixtures**: `<definition>.<variant>.example.json` alongside the library, plus `.invalid.json` negative cases

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

## Schema $id Fields

All schema `$id` fields match their serving URLs:

```json
{
  "$id": "https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json"
}
```

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
