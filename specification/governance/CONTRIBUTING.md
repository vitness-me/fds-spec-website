# Contributing to the Fitness Data Standard (FDS)

Thanks for helping improve fitness data interoperability! This document explains how to propose changes, add RFCs, and update schemas/examples.

## Ways to Contribute
- File an issue describing a problem, proposal, or implementation feedback.
- Submit a PR improving documentation, examples, or governance materials.
- Propose or amend an RFC with concrete examples and a validation plan.

## RFC Changes
1. Fork the repo and create a feature branch.
2. Author or modify an RFC under `specification/rfc/` using an existing RFC as a template.
3. Include:
   - Problem statement, goals (in/out of scope), terminology
   - Normative requirements and reference structures
   - Extension guidance and security/privacy considerations
   - JSON Schema references and complete examples
   - Conformance guidance for producers/consumers
4. Open a PR and request review from Editors.

## Schema & Example Changes
- Author the change in `specification/schema-sources/`, then run `npm run build:schemas`. `specification/schemas/` is generated from those sources; never hand‑edit a `*.schema.json` there. `npm run check:schemas` rebuilds and diffs, so a hand‑edit and a source change committed without rebuilding both fail.
- A published schema is frozen — its bytes never change once released, because a consumer that fetched it yesterday must get the same document today. A change to one ships as a new version directory beside it, and the build refuses to alter a frozen file.
- The `*.example.json` fixtures and `README.md` beside a generated schema are hand‑written; those you do edit in place.
- Provide at least one complete example per schema demonstrating real‑world usage.
- Validate examples locally (Ajv Draft 2020‑12):

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```

## Identifier Policy
- Production data MUST use UUIDv4 identifiers for all entity IDs and references.
- Examples MAY use illustrative IDs (e.g., `eq.barbell`) for readability; clearly marked as illustrative only.

## Style Guidelines
- Keep JSON valid (no comments/trailing commas) and minimal where possible.
- Use BCP 47 for language tags and lowercase ASCII for slugs (`[a-z0-9-]`).
- Prefer concise, normative language (MUST/SHOULD/MAY) in RFCs.

## Versioning & Breaking Changes
- New required fields or incompatible changes require a Major version.
- Optional additions (fields, enum values where permissible) are Minor.
- Editorial fixes are Patch.
- Update `specification/governance/CHANGELOG.md` with a summary of changes.

### Version claims are checked

`npm run check:versions` reads `specification/releases.json` — which is generated from the published schemas — and holds every version claim in the repository against it. A schema URL must resolve to something published; a release number must name a real release; a claim about "the current release" must name the current one. Run it before opening a PR.

Three annotations let you say something the check cannot work out on its own. All are plain text inside whatever comment syntax the file already uses, so they survive the byte-for-byte page mirroring.

<!-- fds:pin workout/v1.0.0/workout.schema.json — named by the worked example below, which shows how to pin the superseded workout version. A marker inside a fenced block is shown rather than made, so this page needs a real one. -->

**Pinning an older version.** A URL at a version that is published but no longer current is either a deliberate reference or a stale one, and the two look identical. Say which:

```markdown
<!-- fds:pin workout/v1.0.0/workout.schema.json — releases 1.2.0 and 1.3.0 declare
     workout at 1.0.0, so a client pinned to either must keep resolving this URL. -->
```

The reference is written exactly as it resolves — `<directory>/v<version>/<file>`, or a registry filename. A pin covers the file it appears in, needs a real reason, and is an error once nothing in that file references it. A *withdrawn* version cannot be pinned: `exercise/v1.0.0` and `equipment/v1.0.0` are not served at all, so there is nothing to point at.

**Asserting a count.** A number in a sentence is not automatically a claim about this repository — "eight reps at one hundred kilograms" is not a count of anything. Mark the ones that are:

```markdown
<!-- fds:count schemas=10 entities=7 -->
Ten schemas are published. Seven are entities, …
```

The value is checked against the repository on disk, and it must also appear in the surrounding sentence, spelled or in digits, so the marker cannot quietly stop describing the text it annotates. Run `npm run check:versions` with an unknown metric name to see the full list.

Do not mark counts in `CHANGELOG.md`. A changelog entry describes a past release, and pinning it to today's tree would make an accurate historical record fail.

**Claiming a document is complete.** Everything above checks something the document *says*. A document can also be wrong by saying nothing at all: `SCHEMAS.md` shipped with no mention of `program` and every check stayed green, because there was no sentence to be wrong. Where a document enumerates a whole set, say so and the set is taken from the manifest instead:

```markdown
<!-- fds:covers schemas -->
<!-- fds:covers entities -->
<!-- fds:covers releases -->
<!-- fds:covers rfcs -->
<!-- fds:covers packages -->
```

`schemas` covers the whole file: every published schema URL must appear somewhere in it. The other four annotate the table directly below the marker — the entity-and-version table a release publishes, the table keyed on release, the table with one row per RFC in `specification/rfc/`, and the table with one row per publishable package under `packages/`. Prose in the other columns stays yours; which rows exist does not. Order is not checked, so sort a table however reads best.

Adding an entity or cutting a release will fail these until the documents catch up. That is the point: the alternative is a page that quietly stops describing the standard.

## License
- By contributing, you agree your contributions are licensed under the VITNESS Open Standards License Agreement.
