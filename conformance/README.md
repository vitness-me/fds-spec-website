# FDS conformance corpus

Every other check in this repository reads what FDS says about itself — the schemas, the RFCs, the
scenario matrix we authored — and asks *is the standard internally consistent?* The answer is a
confident yes. None of them asks the other question: **does FDS survive contact with what the fitness
industry already ships?**

This directory is the corpus that asks. Each platform under `platforms/` is a real product —
[Trainerize](platforms/trainerize/), [TrainHeroic](platforms/trainheroic/),
[wger](platforms/wger/) — whose data model was researched from public sources and then expressed as
FDS. The expression either validates against the published schemas or it does not, and where it
cannot be expressed at all, the gap is written down against the RFC section that would have to change.
That gap picture, rolled up in [`gaps/RFC-GAPS.md`](gaps/RFC-GAPS.md), is the point: it turns "we
think RFC-007 is complete" into "RFC-007 round-trips three archetypes; here is the field that does
not fit."

## Layout

```
conformance/
  README.md            you are here
  METHODOLOGY.md       the repeatable research → map → gap procedure (how a platform is added)
  landscape.md         the ecosystem map by archetype — who could move to FDS, and what to test next
  corpus.json          the registry: one row per platform (the single source of truth)
  platforms/<slug>/    profile.md, gaps.md, and either a transformer mapping or fidelity fixtures
  gaps/RFC-GAPS.md     the cross-platform rollup, grouped by RFC
```

## The two test modes

- **transform** — real source records run through the built `fds-transformer` CLI; the output must
  validate. Used for flat, record-per-row entities (exercise libraries). wger is the worked example.
- **fidelity** — a real platform artifact modelled by hand as FDS and validated against the published
  schema, with the mapping documented in the profile. Used for the deeply nested entities (workouts,
  programs) the transformer's dotted-path engine does not emit. Trainerize and TrainHeroic use it.

Both modes end in a **gap report** scored against the RFCs. See `METHODOLOGY.md` for the full
procedure and `landscape.md` for what to add next.

## Running it

```bash
# build the transformer once (needed for transform-mode platforms), then:
npm run check:conformance
```

The gate proves the registry and the tree agree, that every transform output and every fidelity
fixture validates against the published schemas, that every `RFC-00N §X.Y` citation names a section
that RFC actually has, and that the rollup covers every platform. It carries a `--self-test` that runs
each rule against an input built to break it, so a green run is evidence and not just the absence of
one.

## The result so far

Three archetypes, six validating artifacts. The prescription and workout primitives held — TrainHeroic's
percentage-of-working-max, per-set loads and training-max slots all expressed natively. The sharpest
findings are at the edges: wger shows FDS **requires classification a large open library does not
carry** (RFC-001), and Trainerize shows the **delivery/assignment layer of a coaching business is out
of scope by design but undocumented** (RFC-008). Read `gaps/RFC-GAPS.md` for the whole picture.
