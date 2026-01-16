# Fitness Data Standard (FDS) Specification

This repository defines the Fitness Data Standard (FDS) for interoperable exchange of fitness domain data. The current scope covers core registry entities and the exercise model used by applications.

## Purpose & Scope
- Enable data portability and interoperability across fitness applications.
- Provide normative JSON Schemas and high‑quality RFCs with examples and implementation guidance.
- Keep platform taxonomies flexible via well‑defined extension points.

In scope (current):
- Exercise data model (RFC‑001)
- Registry entities: Equipment (RFC‑002), Muscles (RFC‑003), Muscle Categories (RFC‑004)

Out of scope (current):
- Workout/programming models, user progress tracking, authN/Z (to be covered by future RFCs)

## Versioning & Compatibility
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
- `externalRefs` SHOULD include a `system` string and an external `id` string; systems SHOULD be stable and documented by the producer.

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
npx ajv -s specification/schemas/exercises/v1.0.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.0.0/exercise.example.json

# Equipment
npx ajv -s specification/schemas/equipment/v1.0.0/equipment.schema.json \
  -d specification/schemas/equipment/v1.0.0/equipment.example.json

# Muscle
npx ajv -s specification/schemas/muscle/v1.0.0/muscle.schema.json \
  -d specification/schemas/muscle/v1.0.0/muscle.example.json

# Muscle Category
npx ajv -s specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json \
  -d specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.example.json
```

Notes:
- If using remote `$id` resolution, ensure schemas are accessible at their `$id` URLs or configure Ajv to resolve locally.
- The schemas intentionally restrict additional properties at the top level while allowing open extension areas under `attributes` and `extensions`.

## Repository Layout
- `specification/rfc/`
  - RFC‑001 Exercise Data Model
  - RFC‑002 Equipment Data Model
  - RFC‑003 Muscle Data Model
  - RFC‑004 Muscle Category Data Model
  - RFC‑005 Body Atlas Data Model
- `specification/schemas/`
  - `exercises/v1.0.0/` exercise schema + example
  - `atlas/v1.0.0/` body atlas schema + example
  - `equipment/v1.0.0/` equipment schema + example
  - `muscle/v1.0.0/` muscle schema + example
  - `muscle/muscle-category/v1.0.0/` muscle category schema + example
- `specification/governance/`
  - `GOVERNANCE.md`, `CONTRIBUTING.md`, `CHANGELOG.md` (to be populated)

## Security & Privacy
- Schemas define data formats; transport and storage security are implementation responsibilities.
- Validate all inputs against JSON Schema; sanitize user‑generated content within extensions.
- Use HTTPS for media/document URIs and secure storage for sensitive data.

## Licensing
The FDS RFCs, schemas, and examples are provided under the VITNESS Open Standards License Agreement. See `/specification/VITNESS Open Standards License Agreement.md`.
