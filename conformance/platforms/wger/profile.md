# wger — platform profile

**Archetype:** exercise library (open data) · **Mode:** transform · **Produces:** exercise

wger (`github.com/wger-project/wger`) is the de-facto free-and-open-source workout manager and
the largest openly-licensed exercise database. It is the natural first exercise-library exemplar
because its data is not only documented but redistributable — which means a wger→FDS crosswalk can
ship real content, not a reconstruction.

## Sourcing

Modelled from the `wger-project/wger` `master` source — the DRF serializers (`Meta.fields`) and the
Django models are the authoritative schema. The live `wger.de/api/v2/` instance was unreachable from
the research environment, so field **names** are verbatim from source (high confidence) and the
sample **values** here are illustrative. Confirm against a running `/api/v2/` before freezing a
production mapping; `master` can lead the deployed API.

Key naming note carried into the mapping: wger renamed its split-exercise models. The old
`ExerciseBase` is now **`Exercise`** (language-independent) and the old per-language `Exercise` is now
**`Translation`**. The aggregated read endpoint is `/api/v2/exerciseinfo/`, which is what a consumer
building an FDS import would read.

## The data model, and how it maps

`source.exercise.json` is shaped like an `exerciseinfo` record, with each nested reference
(`category`, `muscles`, `equipment`) reduced to the `name` the FDS registry matches on — the only
projection the transformer's registry lookup needs.

| FDS target | wger source | Source of truth | Notes |
|---|---|---|---|
| `exerciseId` | `uuid` | wger native | wger's `uuid` is a real UUIDv4 — it satisfies FDS's id directly, no minting |
| `canonical.name` | `Translation.name` | wger native | the English translation's name |
| `canonical.slug` | derived from name | transform | `slugify` |
| `targets.primary` | `muscles[].name` | wger native | latin names (`Rectus abdominis`), matched via the crosswalk registry |
| `targets.secondary` | `muscles_secondary[].name` | wger native | |
| `equipment.required` | `equipment[].name` | wger native | incl. `none (bodyweight exercise)` → `eq.bodyweight` |
| `metadata.externalRefs` | `id` | wger native | preserves the integer wger id as an external ref |
| `metadata.source` | — | constant | `wger.de` |
| `classification.exerciseType` | `fds_exerciseType` | **importer-enriched** | wger has no equivalent |
| `classification.movement` | `fds_movement` | **importer-enriched** | wger has no movement-pattern field |
| `classification.mechanics` | `fds_mechanics` | **importer-enriched** | wger has no compound/isolation field |
| `classification.force` | `fds_force` | **importer-enriched** | wger has no push/pull field |
| `classification.level` | `fds_level` | **importer-enriched** | wger has no difficulty field |
| `metrics.primary` | `fds_metricType` / `fds_metricUnit` | **importer-enriched** | wger measures at log time, not on the exercise |

The `fds_`-prefixed fields are **not wger data**. wger's `Exercise` model carries `category`,
`muscles`, `muscles_secondary`, `equipment`, `variation_group` and licence fields — and nothing that
names a movement pattern, mechanics, force vector, difficulty level, or a per-exercise metric. FDS
requires all of those (`exercise.schema.json` requires `classification` with five sub-fields and
`metrics.primary`). So a wger importer **must** supply them; they are shown pre-filled here only so
the transform is runnable end-to-end. That requirement is this platform's headline finding — see
`gaps.md`.

## Licence

- **Software:** AGPL-3.0-or-later.
- **Exercise database content:** Creative Commons, per entry. New content defaults to
  **CC-BY-SA-4.0** (confirmed: `AbstractLicenseModel.license` default); some entries are CC0. Each
  record ships `license` + `license_author` and the full TASL attribution fields precisely so the
  data can be mirrored in compliance.
- **Redistribution:** permitted with attribution; CC-BY-SA additionally requires share-alike on
  derived datasets. The mapping preserves `license` and `license_author` on every source record so
  the obligation is never dropped in transit.

## What this exercises in FDS

RFC-001 (exercise), RFC-002 (equipment) and RFC-003 (muscle) — specifically the registry-lookup path
that resolves a foreign vocabulary (wger's latin muscle names, wger equipment names) onto FDS refs
through a crosswalk registry, which is exactly what a real integration ships.
