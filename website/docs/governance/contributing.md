---
title: Contributing
description: How to contribute to the Fitness Data Standard (FDS)
sidebar_position: 2
---

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
- Update the relevant schema under `specification/schemas/...` and keep `$id`/`title`/version consistent.
- Provide at least one complete example per schema demonstrating real‑world usage.
- Validate examples locally (Ajv Draft 2020‑12):

```bash
npx ajv -s specification/schemas/exercises/v1.0.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.0.0/exercise.example.json
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

## License
- By contributing, you agree your contributions are licensed under the VITNESS Open Standards License Agreement.
