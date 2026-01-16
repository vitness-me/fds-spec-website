# VITNESS Fitness Data Standard — Governance

This document describes how the Fitness Data Standard (FDS) is evolved, reviewed, and released.

## Roles
- Editors: Stewards of the spec who maintain RFCs, schemas, and releases. Editors facilitate discussions and ensure process adherence.
- Contributors: Anyone proposing or improving RFCs, schemas, examples, and documentation via issues/PRs.
- Implementers: Vendors and developers building to the spec; their feedback is critical for practical interoperability.

## Decision Process
- Default: Lazy consensus (silence is consent) after a minimum 5 business day review window on substantive changes.
- Escalation: If consensus is unclear, Editors call for a lightweight vote among Editors; a simple majority decides.
- Input weighting: Real‑world implementer feedback is emphasized for changes affecting compatibility or semantics.

## RFC Lifecycle
1. Draft: Proposal authored and submitted as a PR under `specification/rfc/` using the RFC template.
2. Review: Open discussion; Editors request changes; examples and schemas must validate.
3. Accepted: Approved and merged; assigned a spec version target (e.g., 1.0.0) and tracked in CHANGELOG.
4. Deprecated: Superseded by a newer RFC; remains available throughout the major version.

Notes:
- Changes that alter required fields or break validation are Major.
- Optional additions and clarifications are Minor.
- Editorial fixes are Patch.

## Schema & Release Management
- Each RFC MUST link to corresponding JSON Schema and examples.
- Schemas MUST include `$id`, `$schema`, and a clear `title` with version context.
- Releases follow SemVer and are recorded in `specification/governance/CHANGELOG.md`.
- Deprecations include timelines and migration guidance within the relevant RFC.

## Extension Registry (Lightweight)
- Vendor extensions use the `x:<vendor>` namespace.
- Popular or converging patterns MAY be proposed for standardization via a new or amended RFC.
- Editors curate an optional extension registry document to catalog widely used keys and semantics.

## Breaking Changes Policy
- New required fields, enum restriction, or removal of previously valid structures require a Major release.
- Major changes include migration notes and, where feasible, automated mapping guidance.

## Security & Responsible Disclosure
- Report potential security issues privately to the Editors (security contact to be published).
- Do not open public issues for undisclosed vulnerabilities.

## Meetings
- Asynchronous by default (issues/PRs). Ad‑hoc working sessions may be scheduled for complex topics; summaries are posted publicly.

## Amendments
- Governance changes are proposed via PRs and require Editor approval.
