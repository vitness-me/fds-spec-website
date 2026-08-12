# The research procedure — how a platform enters the corpus

This is the repeatable process behind every platform under `platforms/`. It is written so that anyone
— a maintainer or an agent — can research a real fitness product and turn it into a validated
conformance test, the same way each time. The goal is never "does our example validate" (we wrote the
example); it is **"does FDS survive contact with what this product actually ships."**

Follow it in order. Each step has an output that the next step depends on, and the last step is a gate
that fails if any of the earlier ones was skipped.

**The direction is one-way.** FDS is the standard; the platform conforms to FDS. You are not checking
whether the platform has what FDS wants — a required field the platform lacks is the platform's to
enrich on adoption. You are checking the reverse: **can FDS receive everything the platform emits, or
does the platform produce something in the wild that FDS has no first-class place to hold?** That
second case is the only kind of finding that counts as an FDS gap.

## 1. Scope the platform to an archetype

Every platform belongs to an archetype (see `landscape.md`), and the archetype decides what to test,
because each one breaks the standard differently:

- **exercise library** → RFC-001/002/003 (taxonomy, foreign-vocabulary crosswalk)
- **coaching / delivery** → RFC-007/008 seam (workout → program → assignment)
- **strength programming** → RFC-006 (percentage/RPE/velocity prescription, per-set load)
- **consumer logger** → RFC-007 + performed data (RFC-009, deferred)
- **wearable / device** → the FIT/HealthKit/Health-Connect crosswalk, performed data
- **clinical / rehab** → RFC-006 prescription as an HL7/FHIR bridge

One strong exemplar per archetype is worth more than ten near-duplicates. Add a new platform when it
stresses a seam no existing one does, not because it exists.

## 2. Research the data model from public sources — and cite everything

Build the platform's data model from **public** material only: API/developer docs, documented export
formats, help-centre articles describing how the product structures content, openly-licensed source
(for open platforms), and reverse-engineered clients (clearly marked as such). Never scrape a
platform's proprietary content, and never present an inferred field name as a documented one.

Record, per fact: the **source URL** and a **confidence** (high = read from a schema/serializer/API
doc; medium = documented behaviour without field names; low = single secondary summary). The output
is `profile.md`, which must include a **Sourcing** section stating what is documented vs.
reconstructed. If the platform publishes no schema, say so — the structural findings can still be
robust while the exact serialization is not.

## 3. Choose a test mode

- **transform** — if the platform's entity is flat and record-per-row (an exercise library), write a
  `mapping.<entity>.json` for the fds-transformer, a `source.<entity>.json` of real records, and any
  crosswalk `registries/`. The transformer runs it and the output must validate. This is the strongest
  proof: real data goes through the shipping tool and comes out valid FDS.
- **fidelity** — if the entity is deeply nested (workout, program), the transformer's dotted-path
  engine will not emit it. Model a real platform artifact by hand as `fixtures/<entity>.<name>.fds.json`
  and validate it against the published schema, with the field-by-field mapping documented in
  `profile.md`. Prefer transform where the shape allows it.

Register the choice in `corpus.json`. A `transform` row names its config, source and output; a
`fidelity` row just declares what it `produces` (fixtures are discovered by convention).

## 4. Map honestly — and watch for what has nowhere to land

Map every field the platform emits. Two things to watch, in opposite directions:

- **Platform emits X, FDS has no first-class field for X.** This is the finding. If the only place it
  fits is `attributes`/`extensions`, that *is* the gap — the escape hatch means "not interoperable,"
  because no consumer is obligated to read it. Record where it landed (the wger content-licence →
  `attributes` case is the worked example).
- **FDS requires Y, the platform lacks Y.** Not a gap — the platform's enrichment burden on adoption.
  Supply it as clearly-marked enrichment (the `fds_` prefix convention in the wger source) or annotate
  the fixture. Never quietly invent platform data to make a document validate.

## 5. Score against the RFCs — the gap report is the deliverable

Write `gaps.md` in these buckets, all judged in the one-way direction (can FDS receive what the
platform emits):

1. **Real coverage gaps** — a construct the platform emits that FDS cannot hold first-class (or holds
   only in an escape hatch), each pinned to the RFC section that would have to change (`RFC-00N §X.Y`),
   with a severity and a candidate resolution. This bucket is the payload.
2. **FDS covers these — not gaps** — what mapped without loss, including where FDS is *richer* than the
   platform (that is FDS being a good superset, not a gap).
3. **Not an FDS gap — the platform's to adapt** — required fields the platform lacks. Record once, so a
   reader sees it was considered and correctly excluded.
4. **Out of scope** — what FDS deliberately does not model (performed/personal data, RFC-009), so a
   reader does not mistake a boundary for a bug.

Every `RFC-00N §X.Y` citation must name a section that RFC actually has — the gate checks this, so a
gap can always be acted on.

## 6. Roll up and gate

Add the platform's findings to `gaps/RFC-GAPS.md`, grouped by RFC (the file must name every registered
platform). Then run the gate:

```bash
npm run check:conformance
```

It proves the corpus registry and the tree agree, that every transform output and every fidelity
fixture validates against the published schemas, that every gap cites a real RFC section, and that the
rollup covers every platform. A green run means the corpus is real; a red one names exactly what
drifted.

## What "done" looks like for one platform

```
platforms/<slug>/
  profile.md      # data model + sourcing + mapping table
  gaps.md         # clean / real gaps (RFC-cited) / out-of-scope
  # transform mode:
  mapping.<entity>.json
  source.<entity>.json
  registries/*.json
  # fidelity mode:
  fixtures/<entity>.<name>.fds.json   # one or more, all validating
```

plus a row in `corpus.json` and a section in `gaps/RFC-GAPS.md`.
