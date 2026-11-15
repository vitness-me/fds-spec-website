# FDS JSON Schema URLs

Every schema published by the Fitness Data Standard, at the version it is published under.

<!-- fds:covers schemas -->
<!-- fds:count schemas=16 entities=7 libraries=1 tooling=2 superseded=6 -->
The list here is `specification/schemas/.integrity.json`, which is what the build writes and what `npm run check:published` fetches. Sixteen schemas are published: seven entities, one definition library, two tooling schemas, and six superseded versions that are still served.

## A release is a set of entity versions

`spec_version` names a release; it is **not** a version every entity shares. The current release is **1.5.0**, and it publishes:

<!-- fds:covers entities -->

| Entity | Version |
|---|---|
| exercise | 1.1.0 |
| equipment | 1.1.0 |
| muscle | 1.0.0 |
| muscle-category | 1.0.0 |
| body-atlas | 1.1.0 |
| workout | 1.1.0 |
| program | 1.0.0 |

<!-- fds:covers releases -->

| Release | Adds |
|---|---|
| 1.0.0 | exercise, equipment, muscle, muscle-category, body-atlas |
| 1.1.0 | exercise and equipment move to 1.1.0 |
| 1.2.0 | workout |
| 1.3.0 | program |
| 1.4.0 | workout moves to 1.1.0 |
| 1.5.0 | body-atlas moves to 1.1.0 |

There is no `muscle/v1.5.0/`, and there will not be unless muscle itself changes. Build URLs from the entity version, not the release. See `specification/discovery.md`.

Both tables above are published, machine-readable, at **https://spec.vitness.me/releases.json** — the release manifest, generated from the schemas themselves. Read it rather than transcribing this page. It is not frozen: it gains a release every time one is published, which is exactly why it is worth fetching.

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

### Body Atlas Schema (v1.1.0)
- **Schema**: https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.schema.json
- 1.1.0 added an optional licence and attribution on each view's asset — RFC-005 §5
- **Examples**:
  - https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.example.json

### Workout Schema (v1.1.0)
- **Schema**: https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json
- 1.1.0 added per-set intensity zones and machine settings — RFC-007 §6
<!-- fds:count examples:workout=46 scenarios:workout=46 -->
- **Examples**: 46 worked sessions, one per row of the scenario coverage matrix —
  `workout.<scenario>.example.json` alongside the schema, indexed in its README

### Program Schema (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json
<!-- fds:count examples:program=18 -->
- **Examples**: 18 worked programs — `program.<scenario>.example.json` alongside the schema,
  covering linear, undulating, block, conjugate and adaptive structures

### Prescription Primitives (v1.0.0)
- **Library**: https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json
- A `$defs` library, **not an entity** — see RFC-006. Its root accepts nothing by design, there is no
  prescription document to export, and it never belongs in a provider's `supported_entities`.
  Reference a definition instead: `…/prescription.schema.json#/$defs/loadTarget`
- **Fixtures**: `<definition>.<variant>.example.json` alongside the library, plus `.invalid.json` negative cases

### Transformer Mapping (v1.3.0)
- **Schema**: https://spec.vitness.me/schemas/transformer/v1.3.0/mapping.schema.json
- Configures the FDS Transformer rather than describing an entity — it validates a `mapping.json`,
  not exported data. Documented with the tool, in `website/docs/tools/transformer/configuration.md`
- Belongs to no release, and is versioned on its own: a release names entities and the libraries
  they compose. It closes `additionalProperties` everywhere, which is a promise that it lists every
  key the transformer reads
- 1.3.0 added the `claude-code` enrichment provider and its `enrichment.claudeCode` settings

### Transformer Provenance Sidecar (v1.1.0)
- **Schema**: https://spec.vitness.me/schemas/transformer/provenance/v1.1.0/provenance.schema.json
- Describes `provenance.sidecar.json`, which the FDS Transformer writes beside its output: for each
  document, where every written field came from (the source path, a mapping default, a transform,
  or a model with its prompt version and confidence). Output of the tool, not exported data
- Tooling, like the mapping schema: it belongs to no release and is versioned on its own, in its
  own directory
- 1.1.0 requires `provider` on a model's entry: the enrichment provider that made the call

## Superseded, still served

<!-- fds:pin workout/v1.0.0/workout.schema.json — listed on purpose: releases 1.2.0 and 1.3.0 declare workout at 1.0.0, so a client pinned to either must keep resolving this URL. It is frozen, and this section says it is not for new work. -->
<!-- fds:pin atlas/v1.0.0/body-atlas.schema.json — listed on purpose: releases 1.0.0 through 1.4.0 declare body-atlas at 1.0.0, so a client pinned to any of them must keep resolving this URL. It is frozen, and this section says it is not for new work. -->
<!-- fds:pin transformer/v1.0.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.1.0 names, and an editor resolving it must keep getting a document. -->
<!-- fds:pin transformer/v1.1.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.2.0 names, and an editor resolving it must keep getting a document. -->
<!-- fds:pin transformer/v1.2.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.3.0 names, and an editor resolving it must keep getting a document. -->
<!-- fds:pin transformer/provenance/v1.0.0/provenance.schema.json — listed on purpose: it is the `$schema` every sidecar written before 1.1.0 names, and such a sidecar must keep validating against it. -->

### Transformer Mapping (v1.2.0)
- **Schema**: https://spec.vitness.me/schemas/transformer/v1.2.0/mapping.schema.json
- Superseded by mapping 1.3.0, which added the `claude-code` provider and `enrichment.claudeCode`.
  The additions are optional, so every 1.2.0 configuration is valid under 1.3.0
- Still served: it is what a configuration written against it names in its own `$schema`
- Not for new work. Point `$schema` at 1.3.0

### Transformer Provenance Sidecar (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/transformer/provenance/v1.0.0/provenance.schema.json
- Superseded by provenance 1.1.0, which requires `provider` on a model's entry, so a 1.0.0 sidecar
  with model entries does not validate under 1.1.0
- Still served: a sidecar written before 1.1.0 names it as its `$schema` and still validates against it

### Transformer Mapping (v1.1.0)
- **Schema**: https://spec.vitness.me/schemas/transformer/v1.1.0/mapping.schema.json
- Superseded by mapping 1.2.0, which added `validation.rejectDefaults`. The addition is optional,
  so every 1.1.0 configuration is valid under 1.2.0
- Still served: it is what a configuration written against it names in its own `$schema`
- Not for new work. Point `$schema` at 1.3.0

### Transformer Mapping (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/transformer/v1.0.0/mapping.schema.json
- Superseded by mapping 1.1.0, which published the enrichment and evaluation keys the transformer
  had grown past it. The additions are optional, so every 1.0.0 configuration is valid under 1.1.0
- Still served: it is what a configuration written against it names in its own `$schema`, and no
  FDS release governs a tooling schema, so nothing else would say when it may go
- Not for new work. Point `$schema` at 1.3.0

### Workout Schema (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/workout/v1.0.0/workout.schema.json
- Superseded by workout 1.1.0, and still published and still frozen: releases 1.2.0 and 1.3.0
  declare workout at 1.0.0, so a client pinned to either must keep resolving this URL
- Not for new work. 1.1.0 only added optional fields, so every 1.0.0 document remains valid under it
- Examples live with the current version, under `workout/v1.1.0/`

### Body Atlas Schema (v1.0.0)
- **Schema**: https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.schema.json
- Superseded by body-atlas 1.1.0, and still published and still frozen: releases 1.0.0 through 1.4.0
  declare body-atlas at 1.0.0, so a client pinned to any of them must keep resolving this URL
- Not for new work. 1.1.0 only added optional fields, so every 1.0.0 document remains valid under it
- The example lives with the current version, under `atlas/v1.1.0/`

## Schema $id Fields

All schema `$id` fields match their serving URLs:

```json fds:ignore a schema identifier, not a document
{
  "$id": "https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json"
}
```

`npm run check:published` fetches every URL above and checks three things: that it answers 200 with a JSON content type, that the served document's `$id` matches the URL it came from, and that the bytes hash to what `.integrity.json` froze.

## Validation

The URLs above serve the same bytes as `specification/schemas/` in this repository — that is what `npm run check:published` holds them to. So validate from a checkout, against the local copy of the schema. The command below needs nothing installed: `npx` fetches the validator (`ajv-cli`) and the formats plugin (`ajv-formats`) it names, and `ajv-cli` reads schemas from disk — it does not fetch URLs, which is why the command takes a path rather than an address.

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```

That validates the example shipped beside the schema. To validate your own document, replace the `-d` path with your file. Working without a checkout, download the schema from its URL above first and pass the downloaded filename to `-s`.

## File Structure

The schemas are served from the `website/static/schemas` directory, which is symlinked to `specification/schemas/`:

```
website/static/schemas -> ../../specification/schemas/
```

This ensures schemas are served as static files at clean URLs without webpack processing.
