# VITNESS Fitness Data Standard — Governance

This document describes how the Fitness Data Standard (FDS) is evolved, reviewed, and released.

## Guiding Principles

These are constraints on what FDS will accept, not a description of what it happens to contain today. They bind contributors: a proposal that violates one is declined on principle, however well designed. Each exclusion below is deliberate — a decision with a reason, not a gap waiting to be filled.

1. **FDS describes the domain, never the person.** Athlete identity, bodyweight, one‑rep maxes, and any performed or logged result are intentionally outside the core specification and will not be added to it. A contributor may not introduce a field that carries a personal value or identifies a subject. This is the constraint that lets an FDS document be shared, cached, mirrored and diffed freely: it carries nothing that requires consent, a privacy review, or a data‑processing agreement.

2. **Prescription, not performance.** FDS models what is intended — the plan, the session, the prescription — and by design never what actually happened. A contributor may not add logged results to a core entity. Recording performance has a subject, and so inherits the obligations of principle 1; it waits on a consent model, not on schema work.

3. **A format, not a protocol.** FDS is a data format. Authentication, authorization, and transport are intentionally left to the providers that serve it; the discovery endpoint says what is served, not who may read it. A contributor may not add access‑control or transport semantics to a schema.

4. **Frozen means frozen.** A published schema's bytes never change. A contributor may not edit a released schema; a change ships as a new version beside it, and a version an older release still names stays served even after it is superseded. This is deliberate — a consumer that fetched a URL yesterday must get the same document today.

5. **Additive by default; breaking changes are rare and loud.** Within a major version, changes add and clarify — they do not remove or tighten. A contributor proposing a breaking change carries the burden of a major release, with migration notes. Backwards compatibility is a deliberate promise, not a courtesy.

6. **Speculative features are declined.** Each addition adds complexity that every implementer then carries. A contributor proposing a field must show a real interchange case it enables; "someone might want it" is, by design, not enough. A small core is a feature, not a limitation.

Where a proposed capability is real but does not belong in core — including anything that would touch personal data — it lives as an extension in the `x:<vendor>` namespace, permanently outside the frozen core. The [roadmap](/docs/governance/roadmap) records how these principles decide what is and is not published.

## Neutrality and Stewardship

*Will this standard be captured by one vendor?* It is the first question to ask of a standard published by a company, and it deserves a direct answer rather than a reassuring silence.

FDS is stewarded by its Editors (see Roles). Today that is effectively a single maintainer, originating at VITNESS; there is no independent foundation and no multi‑vendor committee, and claiming either would be false. What limits capture is not a governance body that does not yet exist — it is the structure of the standard itself, and these guarantees operate now, under single stewardship:

- **The published standard cannot be quietly revoked or altered.** Every schema is frozen at a stable URL (principle 4); its bytes cannot change under an implementer's feet, and a version an older release names stays served even once superseded. A steward cannot take back what a consumer already depends on.
- **Everything happens in the open.** The specification, its schemas, its history and its process are public and openly licensed. There is no private fork where the "real" standard lives; a contributor sees, and can fork, exactly what a steward sees.
- **Evolution is additive and reasoned.** Changes affecting compatibility or semantics weight real‑world implementer feedback most heavily (see Decision Process), and breaking changes carry the cost of a major release. A steward cannot cheaply reshape the standard around one product.

These checks are deliberately structural, so that neutrality does not rest on trusting the steward.

How decisions are made is expected to change as adopters arrive. The intended direction is to move real authority toward the implementers who depend on the standard — so that a change cannot be forced through over the objection of those who build to it. The specific mechanism — for example, requiring the explicit assent of independent implementers before a change lands — is **not yet decided**, and will not be settled unilaterally: it is itself a governance change, made in the open under the Amendments process below. Until then, this section states plainly where authority sits — with a single steward, checked by the structure above — rather than describing a committee that does not meet.

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
