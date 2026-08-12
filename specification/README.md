# Fitness Data Standard (FDS) Specification

This repository defines the Fitness Data Standard (FDS) for interoperable exchange of fitness domain data. The current scope covers the exercise catalog and its registries, the prescription primitives, and the workout and programming models built on them.

## Purpose & Scope
- Enable data portability and interoperability across fitness applications.
- Provide normative JSON Schemas and high‑quality RFCs with examples and implementation guidance.
- Keep platform taxonomies flexible via well‑defined extension points.

In scope (current):
- Exercise data model (RFC‑001)
- Registry entities: Equipment (RFC‑002), Muscles (RFC‑003), Muscle Categories (RFC‑004), Body Atlas (RFC‑005)
- Prescription primitives (RFC‑006) — a definition library, not an entity
- Workout data model (RFC‑007) and training program data model (RFC‑008)

Out of scope (current):
- Performed data — what was actually done, and by whom (RFC‑009, deferred pending a consent and privacy model)
- Athlete identity, bodyweight, and the numeric value of any one‑rep max or training max. This is a decision, not a gap: FDS models no person, which is what lets catalogs, sessions and plans be published, cached and mirrored freely. A program declares *which* lifts it is computed from and *how* the caller derives them, never the numbers.
- Authentication and authorization

## Versioning & Compatibility

**Entities version independently, and a release names a set of entity versions.** Take release 1.3.0: it names exercise and equipment at 1.1.0 and everything else at 1.0.0. There is no `muscle/v1.3.0/`, and there will not be unless muscle itself changes — a client that expands a release name into a path segment requests URLs that were never published. Build schema URLs from the entity version.

The example is a past release on purpose. What 1.3.0 names is frozen, so it cannot go stale — but it is not a statement about what is current either, and reading it as one is how a client ends up requesting the version an entity has since moved off. Which set each release names, including the current one, is in `releases.json`.

Gaining an entity is a new release even when nothing existing changed, because a release names the *set* it publishes: 1.2.0 added workout, 1.3.0 added program.

**A published URL is frozen.** Once an entity version is released its bytes never change; a consumer that fetched it yesterday and again today gets the same document. The build refuses to alter a frozen schema, and every published schema is currently frozen. Changes ship at a new version URL.

FDS follows Semantic Versioning for data model releases:
- Major (X.0.0): Breaking changes to required fields or semantics.
- Minor (0.Y.0): Backward‑compatible additions (optional fields, new enum values where allowed, documentation clarifications).
- Patch (0.0.Z): Non‑functional changes (typos, editorial, schema metadata) that do not affect validation outcome.

Compatibility rules:
- Data valid in X.Y.Z MUST remain valid in X.(Y+1).0.
- Adding new required fields constitutes a MAJOR change.
- Deprecated fields remain functional throughout the major version; deprecation timelines are communicated in the RFC changelogs.
- Producers and consumers SHOULD use `schemaVersion` to route validation and logic.

## Identifiers (IDs)
Normative policy:
- All resource identifiers in production data MUST be UUIDv4 strings.
- This applies to identifiers such as `exerciseId`, equipment/muscle/category `id`, and any cross‑entity references.

Documentation policy:
- For readability, examples in RFCs may use illustrative IDs like `eq.barbell`, `mus.quadriceps`, `cat.legs`. These are NOT valid production IDs and are used only to demonstrate relationships and structure.

Conformance implications:
- Conforming Producers MUST emit UUIDv4 identifiers in real datasets.
- Conforming Consumers MUST validate identifiers according to the active schema version and SHOULD reject non‑UUID identifiers in production contexts.
- Slugs remain human‑readable canonical identifiers and are distinct from IDs.

URNs and external references:
- Relation examples MAY show URNs (e.g., `urn:slug:front-squat`) to illustrate non‑ID relationships. Producers SHOULD prefer UUID references where available; URNs MAY be used for cross‑system loose references when a UUID is unknown.

External reference mapping (`externalRefs`):
- All FDS entities support an optional `externalRefs` array within `metadata` to map identifiers across different systems.
- Each entry MUST include a `system` string (identifying the external platform) and an `id` string (the identifier in that system).
- Systems SHOULD be stable, well‑documented identifiers (e.g., `platform-a`, `legacy-system`, reverse‑DNS like `com.example.app`).
- Use cases include: data migration, multi‑platform synchronization, legacy system mapping, and third‑party integrations.

Example:
```json fds:fragment entity=exercise partial
{
  "metadata": {
    "externalRefs": [
      { "system": "platform-a", "id": "ex-back-squat-001" },
      { "system": "legacy-system", "id": "squat_barbell_back" }
    ]
  }
}
```

## Extensions
Two structured extension points enable platform‑specific data without breaking interoperability:
- `attributes`: Flat or simple structured key/values intended for common extensions that could become standardized.
- `extensions`: Nested, vendor‑scoped structures for complex or private data.

Namespace policy (summary):
- Use `x:<vendor>.<feature>` keys for `attributes` (e.g., `x:vitness.stanceWidth`).
- Use `x:<vendor>` objects for `extensions` (e.g., `extensions: { "x:vitness": { ... } }`) or `x:<vendor>.<domain>` (e.g., `x:gym-management`).
- Vendors SHOULD use a stable vendor key (e.g., company or reverse‑DNS form). Avoid collisions.
- Popular extensions MAY be proposed for promotion via the governance process (see GOVERNANCE.md). A detailed extension registry guide will be provided in a separate document.

Behavior:
- Producers MAY include any keys in `attributes`/`extensions`.
- Consumers MUST ignore unknown keys in `attributes`/`extensions` and MUST NOT fail validation due to unknown extension fields.

## Conformance
Conforming Producer:
- MUST produce JSON that validates against the corresponding FDS JSON Schema for the declared `schemaVersion`.
- MUST use UUIDv4 for all identifiers in production data.
- MUST populate all required fields and adhere to enumerations and structural constraints.
- SHOULD include `schemaVersion` and maintain accurate `metadata` timestamps (RFC 3339, UTC).

Conforming Consumer:
- MUST validate incoming data against the appropriate schema version.
- MUST ignore unknown fields under `attributes`/`extensions`.
- SHOULD tolerate additional optional fields added in newer minor versions.
- SHOULD reject data with missing required fields or invalid enumerations.

Forward/backward compatibility:
- Optional fields added in minor versions MUST NOT break consumers; consumers SHOULD ignore unknown optional fields.
- Changes that require new required fields are MAJOR and require coordinated upgrades.

## Entity Status Lifecycle
Entities carry a `metadata.status` that indicates lifecycle state. The following statuses are defined and MUST be treated consistently across entities that reuse the shared metadata definition:

- draft: Work in progress; not for public distribution. Producers SHOULD avoid exporting draft records; consumers SHOULD treat as non‑discoverable by default.
- review: Pending approval/review. Producers MAY export to staging/test; consumers SHOULD hide by default unless explicitly requested.
- active: Approved and available for general use. Producers SHOULD export; consumers SHOULD include by default in listings and lookups.
- inactive: No longer in active rotation but preserved for referential integrity. Consumers SHOULD hide by default but MUST allow resolving by ID for historical data.
- deprecated: Superseded by a newer record. Where possible, `metadata.deprecated.replacedBy` SHOULD indicate the new ID. Consumers SHOULD warn and prefer the replacement when available.

Notes:
- Status is orthogonal to data validity; inactive/deprecated records remain valid for the duration of the major version.
- Workflows that use richer internal states SHOULD map them to these public statuses at export time.

## Internationalization & Slugs
- Language tags in `localized[*].lang` MUST use BCP 47 (e.g., `en`, `en-GB`, `sr`).
- Slugs SHOULD be lowercase ASCII `[a-z0-9-]`, no spaces, 2+ chars, and SHOULD be stable once published.
- Producers SHOULD normalize diacritics when generating slugs; names retain full unicode.

## Validation Quickstart
Validate examples with Ajv (Draft 2020‑12):

```bash
# Exercise
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json

# Equipment
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/equipment/v1.1.0/equipment.schema.json \
  -d specification/schemas/equipment/v1.1.0/equipment.example.json

# Muscle
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/muscle/v1.0.0/muscle.schema.json \
  -d specification/schemas/muscle/v1.0.0/muscle.example.json

# Muscle Category
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json \
  -d specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.example.json
```

Notes:
- If using remote `$id` resolution, ensure schemas are accessible at their `$id` URLs or configure Ajv to resolve locally.
- The schemas intentionally restrict additional properties at the top level while allowing open extension areas under `attributes` and `extensions`.

## Repository Layout
- `specification/rfc/` — one file per RFC. Which RFCs exist is listed once, under **In scope** above, and in the gated table in the repository's root `README.md`; a second copy here would be one more list to keep by hand.
- `specification/schema-sources/` — **authoring**. Entity schemas `$ref` a shared `common` envelope here; hand‑edit these.
- `specification/schemas/` — **generated and published**. Each file is flattened to be self‑contained, so validating one entity never requires fetching another. Never hand‑edit a `*.schema.json`; the examples and READMEs beside them are hand‑written.
  - `exercises/v1.1.0/`, `equipment/v1.1.0/` schema + examples
  - `muscle/v1.0.0/`, `muscle/muscle-category/v1.0.0/`, `atlas/v1.0.0/` schema + examples
  <!-- fds:count fixtures:prescription=73 -->
  - `prescription/v1.0.0/` definition library + 73 fixtures
  <!-- fds:count examples:workout=46 -->
  - `workout/v1.1.0/` schema + 46 worked sessions; `workout/v1.0.0/` schema only, superseded but still served and frozen
  <!-- fds:count examples:program=18 -->
  - `program/v1.0.0/` schema + 18 worked programs
  - `.integrity.json` — sha256 and frozen flag per published schema
- `specification/registries/`
  - `*.registry.json` — normative recommended values for the open classifiers
  - `*.registry.example.json` — illustrative entity catalogs, not normative
- `specification/governance/`
  - `GOVERNANCE.md`, `CONTRIBUTING.md`, `CHANGELOG.md`

## Verifying a change

```bash
npm run verify           # everything CI runs
npm run verify schemas   # one job: transformer | schemas | website
npm run check:published  # the deployed URLs, separately — needs the network
```

Every check `npm run verify` runs was demonstrated failing before it was trusted — broken on purpose, its output read, then restored. What each one guards, the defect that motivated it, and what it deliberately cannot see are written at the top of its script under `scripts/`. That comment is the explanation; this file keeps no second copy of the list, because a hand‑kept summary of the checks is the same drift the checks exist to catch.

`check:published` is deliberately outside that set. It verifies *deployment* rather than the change in hand — that each `$id` resolves, serves JSON, carries an `$id` matching the URL it came from, and hashes to what was frozen. It needs the network, so it runs weekly and on demand rather than blocking a pull request.

## Security & Privacy
- Schemas define data formats; transport and storage security are implementation responsibilities.
- Validate all inputs against JSON Schema; sanitize user‑generated content within extensions.
- Use HTTPS for media/document URIs and secure storage for sensitive data.

## Licensing
The FDS RFCs, schemas, and examples are provided under the VITNESS Open Standards License Agreement. See `/specification/VITNESS Open Standards License Agreement.md`.
