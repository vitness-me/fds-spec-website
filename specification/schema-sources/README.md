# Schema Authoring Sources

**Edit these files. Do not edit `specification/schemas/` — it is generated.**

## Why there are two trees

`specification/schemas/` is served directly at `https://spec.vitness.me/schemas/…`
(`website/static/schemas` is a symlink to it), so whatever lives there *is* the
published contract.

Published schemas must be **self-contained**. Several JSON Schema toolchains cannot
resolve an external `$ref` at all — Ajv's synchronous `compile()` throws on one, and
consumers that catch the error may silently skip validation entirely. An implementer
must be able to validate a single entity without fetching anything else.

That conflicts with wanting each shared definition written once. So the two concerns
are separated:

| Tree | Role | `$ref`s |
|---|---|---|
| `specification/schema-sources/` | Authoring. Hand-edited. | Reference `common.schema.json` |
| `specification/schemas/` | Published. Generated. | Local `#/$defs/…` only |

The duplication in the published tree is **generated, never hand-maintained**, so it
cannot drift from the source.

One build run writes three things, so they cannot disagree:

1. `specification/schemas/` — the published schemas
2. `specification/schemas/.integrity.json` — hash and freeze state per schema
3. `packages/fds-transformer/src/schemas/bundled/v<release>/` — the transformer's
   offline copies, including a generated `index.ts`

The bundle is generated for the same reason the published tree is: a stale offline
copy rejects data the live schema accepts, which is worse than having no bundle.

## Workflow

```bash
npm run build:schemas    # regenerate all three
npm run check:schemas    # verify they match sources (CI runs this)
```

Change a shared definition once in `common/v1.0.0/common.schema.json`, rebuild, and
every entity that references it is updated.

CI fails if any generated artifact does not match what the sources produce — so a
hand-edit to `specification/schemas/`, a hand-edit to a bundled copy, or a source
change committed without rebuilding, is caught in the pull request.

## Versioning

Entities version independently. `exercises/v1.1.0` and `equipment/v1.1.0` sit
alongside `muscle/v1.0.0`, because the muscle model did not change. A release name
is therefore a *set* of entity versions, not a path segment shared by all of them —
the transformer's `RELEASE_ENTITY_VERSIONS` map records that set, and a test checks
it against the `$id` of each bundled schema.

### Frozen versions

A published URL is a contract: whoever fetched it yesterday must get the same bytes
today. `.integrity.json` records a sha256 per published schema plus a `frozen` flag.

- `frozen: true` — the build **refuses** to write a change. Publish a new version
  directory instead.
- `frozen: false` — still in development; the build updates the hash freely.

`--check` hashes the file on disk, so a hand-edit to a published schema fails even
if the render happens to agree with it. Unfreezing is possible, but only as a
deliberate one-line edit to `.integrity.json` that shows up in review.

Nothing is written until every artifact passes, so a frozen violation cannot leave
the published tree and the bundle half-updated.

### Nothing gets published untracked

The manifest is derived from **what is on disk**, not from the entity list. Every
`*.schema.json` under `specification/schemas/` must be one of:

- listed in `ENTITIES` — generated from an authoring source, or
- listed in `UNGENERATED` — served as-is, with no source to render from.

Anything else fails the build with `UNTRACKED`. A manifest built only from the
entity list could only ever describe what someone remembered to register, which is
how `transformer/v1.0.0/mapping.schema.json` stayed unhashed and unfreezable while
looking fine.

`UNGENERATED` schemas are still hashed and still freezable — they are exempt from
being *rendered*, not from being *tracked*. Adding a file there is a deliberate,
reviewable act.

**When adding a new entity version** (a workout schema, a new exercise version):
add it to `ENTITIES` and rebuild. If you forget, the build tells you.

## `common.schema.json`

Holds definitions shared by every entity: `canonical` and its parts (`slug`,
`aliases`, `localizedNames`), `metadata`, `status`, `media`, the metric vocabulary
(`metricType`, `metricUnit`, `metricRef`), and denormalised entity references
(`muscleRef`, `equipmentRef`, `exerciseRef`, `workoutRef`, `programRef`).

It is authoring-only and is not published — after flattening, nothing refers to it.

### Extending an entity beyond the shared shape

`equipment` adds `abbreviation` to its `canonical`, so it composes the shared parts
(`slug`, `aliases`, `localizedNames`) rather than referencing `#/$defs/canonical`.

Do **not** reach for `allOf` + `$ref` to extend a closed object: `additionalProperties`
only sees properties declared in the *same* schema object, so the referenced schema
rejects the added property. Compose from the parts instead.

### Rules

- Refs into another entity's `properties` are forbidden — that is an instance shape,
  not a stable contract. Reference `$defs` only. The build enforces this.
- Entity-specific definitions (`movement`, `regionGroup`, …) stay in their own schema.
