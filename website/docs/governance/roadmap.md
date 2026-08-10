---
title: Roadmap
description: What the Fitness Data Standard covers today, and what it deliberately does not
sidebar_position: 4
---

# Roadmap

What FDS covers today, what is next, and — the part most roadmaps leave out — what is deliberately excluded and why.

## Published

**RFC-001 to RFC-005** — the catalog. Exercises, and the registries they reference: equipment, muscles, muscle categories, and the body atlas that binds muscles to a visual anatomy.

**RFC-006 Prescription Primitives** — a definition library rather than an entity. Load, repetitions, tempo, rest, intensity zones, set schemes and progression rules, defined once so that a set means the same thing wherever it appears.

**RFC-007 Workout Data Model** — one prescribed session. Blocks of items, each block carrying an execution mode, so straight sets, supersets, circuits, EMOM, AMRAP, Tabata and interval work are all the same schema.

**RFC-008 Training Program Data Model** — a schedule of workout references over time. Cycles, weeks, day placement, per-occurrence adjustment, progression and conditional branching.

All published schemas are frozen. A frozen URL never changes its bytes; a change means a new version.

## Next

### RFC-009 — Performed Data

Everything above is **prescriptive**: what is intended. Nothing in FDS records what actually happened.

That gap is deliberate and it is the reason RFC-009 has not shipped. Performed data has a subject — an identifiable person who lifted a specific weight on a specific day — and the moment a document has a subject it acquires consent, retention, portability and erasure obligations that reach every system it passes through. The catalog, the sessions and the plans can be published, cached, mirrored and diffed freely precisely because none of them describes a person.

RFC-009 therefore waits on a consent and privacy model rather than on schema design. The schema is the easy part.

Two decisions are already fixed. A log will carry a **frozen snapshot of the prescription it was performed against**, because a plan edited afterwards must not rewrite history. And its subject will be an **opaque optional reference**, not a User or Profile entity — FDS models no person, and adding one to solve logging would drag identity into every reference document.

### Registries and conformance

The recommended-value registries are published and gated. Conformance test suites — a corpus a producer can validate against to claim support — are the natural next step now that the coverage matrix is complete.

## Deliberately out of scope

These are not "not yet". They are decisions.

**Athlete identity, bodyweight, one-rep maxes.** FDS carries no personal values, including the ones a personalised program is computed from. A program declares that it references a back-squat training max and how that number is derived; it never carries the number. The accepted consequence is that a fully personalised program cannot round-trip as one self-contained document — export is the plan plus a separate resolution context.

**Authentication and authorization.** A data format, not a protocol. Providers document their own requirements; the discovery endpoint says what it serves, not who may read it.

**Generated exercise selection.** A day in a program references a workout, which requires a workout that exists. There is no undetermined day, because a program whose content is produced by a generator cannot be read without that generator — the opposite of an interchange format. Load adaptation *is* expressible, through autoregulated targets and declared progression rules.

## Under consideration

Areas that fit the standard's remit but have no committed design:

- **Nutrition and meal planning** — a large domain with its own vocabulary problems; likely a sibling standard rather than an extension of this one.
- **Recovery, sleep and wearable data mapping** — closely tied to the same personal-data questions as RFC-009.
- **Body measurements and composition** — personal by definition; blocked on the same model.

## Contributing

Ideas for future RFCs are welcome:

1. **Open a discussion** on [GitHub](https://github.com/FDS-Spec/fds-spec) to propose an area.
2. **Submit an RFC draft** following the [contributing guidelines](/docs/governance/contributing).
3. **Share implementer feedback** — the most useful contribution is a case the current schemas cannot express. Every one of those found so far has changed the standard.
