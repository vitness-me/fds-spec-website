# wger — RFC gap report

What mapped cleanly, what needed enrichment, and what FDS could not represent. The middle column is
the one that matters: it is a candidate RFC amendment, not a defect in the fixture.

## Headline: FDS requires classification wger does not carry

**Severity: high (friction, not a spec defect — but a real adoption barrier).**

`exercise.schema.json` makes `classification` required with five sub-fields — `exerciseType`,
`movement`, `mechanics`, `force`, `level` (RFC-001 §3.1, detailed in RFC-001 §4.2) — and requires
`metrics.primary` (RFC-001 §4.5). wger, the largest open exercise database, carries **none** of
these on its exercise model. Its `Exercise` has `category`, `muscles`, `muscles_secondary`,
`equipment` and licence fields, and that is all.

The consequence is concrete and was reproduced here: a wger record **cannot** become a valid FDS
exercise by mapping alone. Every wger import must run an enrichment pass (manual or model-driven) to
invent six required values per exercise. In this corpus that pass is represented by the `fds_`
source fields; the transform is only runnable because they are pre-filled.

This is the single biggest obstacle to automated adoption by the open-data layer, and it is a real
RFC-001 question, not just an integration cost: **should `movement`, `mechanics`, `force` and `level`
be required, when the reference implementations of an open exercise library do not record them?**
Options for the RFC to weigh:

- Relax `classification` so only `exerciseType` is required, the rest recommended. Lowers the bar for
  library adoption at the cost of weaker guarantees for consumers that filter on movement pattern.
- Keep them required but publish an official enrichment/inference profile, so every importer derives
  them the same way rather than each inventing its own.
- Status quo, and accept that library import is a two-step (map + enrich) pipeline. Defensible, but it
  should be stated in RFC-001 §6.2 (data migration workflow) rather than left implicit.

No recommendation is made here; the corpus's job is to surface the decision, with a real library as
the evidence.

## Clean

- **Identity.** wger's `uuid` is a UUIDv4 and satisfies FDS's `exerciseId` with no minting, while its
  integer `id` is preserved in `metadata.externalRefs`. Round-trippable in both directions.
- **Muscles and equipment.** Resolve onto FDS refs through a crosswalk registry (RFC-003, RFC-002).
  The foreign-vocabulary problem — wger's latin `Rectus abdominis` vs. FDS's own naming — is exactly
  what the registry lookup exists for, and it held.
- **Licence.** wger's per-record `license` + `license_author` carry through to `metadata`. FDS does
  not drop the attribution CC-BY-SA requires.

## Minor

- **wger `category` has no home.** wger's `category` (Abs, Legs, Chest…) is a coarse grouping with no
  FDS exercise field to receive it — FDS classifies by movement/mechanics/force, not body-part
  bucket. It is neither wrong nor lost (it can seed enrichment), but the mapping has nowhere to put it
  except `attributes`. Low severity; noted for completeness.
- **Description language.** wger `Translation` is inherently multilingual (one row per language). FDS
  exercise `canonical.name` is single-valued; multi-language names would live under i18n conventions
  rather than the core document. Not exercised here, flagged for a future multilingual fixture.

## Out of scope (correctly)

wger's Routine/Day/Slot/SlotEntry training model and its per-iteration `*Config` progression tables
are a workout/program concern, not an exercise-library one, and belong to RFC-007/RFC-008 rather than
here. They are noted in the cross-platform rollup as the structural mismatch to expect if wger's
*routines* (not just its exercises) are ever mapped.
