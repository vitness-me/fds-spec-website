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

## Workflow

```bash
npm run build:schemas    # regenerate specification/schemas/
npm run check:schemas    # verify published output matches sources (CI runs this)
```

Change a shared definition once in `common/v1.0.0/common.schema.json`, rebuild, and
every entity that references it is updated.

CI fails if the published tree does not match what the sources produce — so a
hand-edit to `specification/schemas/`, or a source change committed without
rebuilding, is caught in the pull request.

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
