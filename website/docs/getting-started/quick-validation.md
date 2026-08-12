---
title: Quick Validation
description: Validate your FDS data against JSON schemas
sidebar_position: 2
---

# Quick Validation Guide

Validate FDS documents against the published schemas using Ajv (Draft 2020-12).

The commands below run from a checkout of the [specification repository](https://github.com/vitness-me/fds-spec-website) and need nothing installed beyond npm: `npx` fetches the validator (`ajv-cli`) and the formats plugin (`ajv-formats`) it names. Each command validates the example shipped beside the schema; to validate your own export, replace the `-d` path with your file.

## Validate Examples

### Exercise Schema

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```

### Equipment Schema

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/equipment/v1.1.0/equipment.schema.json \
  -d specification/schemas/equipment/v1.1.0/equipment.example.json
```

## Schema Locations

Every schema is also served at a frozen URL under `https://spec.vitness.me/schemas/` — the same bytes as the repository copies. The full set, at the versions the current release publishes, is in the machine-readable release manifest at [https://spec.vitness.me/releases.json](https://spec.vitness.me/releases.json); the [schema reference](/docs/schemas) on this site documents each one.

Working without a checkout, download a schema from its URL and pass the downloaded filename to `-s` — `ajv-cli` reads schemas from disk, it does not fetch URLs.

## Next Steps

- [Explore schemas interactively](/docs/schemas/exercise)
- [Browse specifications](/docs/specifications/rfc-001-exercise-data-model)
