# Fitness Data Standard (FDS)

An open, interoperable standard for fitness domain data — exercises, equipment,
anatomy, prescriptions, workouts and training programs — published as normative
RFCs with versioned JSON Schemas behind them.

This repository is the standard: the specification, the published schemas, the
packages built on them, and the [Docusaurus](https://docusaurus.io/) site that
serves all of it.

**Live site:** https://spec.vitness.me/ —
[why FDS exists](https://spec.vitness.me/why-fds) ·
[use cases](https://spec.vitness.me/docs/use-cases) ·
[JSON schemas](https://spec.vitness.me/docs/schemas) ·
[quickstart](https://spec.vitness.me/docs/getting-started/overview)

## What it is for

- **Data portability** — move fitness data between applications without a
  bespoke integration at each end.
- **Interoperability** — different platforms exchange the same structured
  documents and read them the same way.
- **Extensibility** — vendor-specific data rides along in `attributes` and
  `extensions` without breaking anyone else's parser.
- **Stable URLs** — a published schema is frozen. The bytes at a version URL
  never change, so a client that validated against one yesterday still does.

## What the standard covers

<!-- fds:count rfcs=8 -->
Eight RFCs, one per data model. The RFC is the normative document — what the
entity means, what its fields are for, what a conforming document must satisfy —
and the published JSON Schema is that document made machine-checkable.

<!-- fds:covers rfcs -->
| RFC | Specifies |
|---|---|
| [RFC-001 — Exercise data model](./specification/rfc/rfc-001-exercise-data-model.md) | The exercise entity: identity, classification, muscle targets and metrics. |
| [RFC-002 — Equipment data model](./specification/rfc/rfc-002-equipment-data-model.md) | The equipment entity: what a machine or implement is, in terms another system can act on. |
| [RFC-003 — Muscle data model](./specification/rfc/rfc-003-muscle-data-model.md) | The muscle entity: the anatomy vocabulary exercises target. |
| [RFC-004 — Muscle category data model](./specification/rfc/rfc-004-muscle-category-data-model.md) | The muscle category entity: the groupings muscles roll up into. |
| [RFC-005 — Body atlas data model](./specification/rfc/rfc-005-body-atlas-data-model.md) | The body atlas entity: named regions any renderer can draw its own way. |
| [RFC-006 — Prescription primitives](./specification/rfc/rfc-006-prescription-primitives.md) | The prescription definition library: load, reps, rest and tempo as reusable pieces. A definition library, not an entity — its schema root validates nothing by design. |
| [RFC-007 — Workout data model](./specification/rfc/rfc-007-workout-data-model.md) | The workout entity: how a training session is structured. |
| [RFC-008 — Training program data model](./specification/rfc/rfc-008-program-data-model.md) | The program entity: multi-week plans that point at sessions rather than restating them. |

The website pages under [`/docs/specifications`](https://spec.vitness.me/docs/specifications)
are byte-for-byte copies of these files, compared on every change.

### Deliberately out of scope

- **Performed data** — what was actually done, and by whom. Deferred (RFC-009)
  pending a consent and privacy model.
- **Athlete identity and bodyweight**, and the numeric value of any one-rep max
  or training max. A program declares *which* lifts it is computed from and
  *how* a caller derives them, never the numbers.
- **Authentication and authorization.**

FDS models no person. That is a decision rather than a gap, and it is what pays
for everything above: a document that describes nobody can be published, cached,
mirrored and diffed freely.

## Versioning

**Entities version independently, and a release names a *set* of entity
versions** — not a version they all share. Substituting a release name into a
schema URL path requests something that was never published; build the URL from
the entity's own version.

This README states no version numbers on purpose. What is published, at which
version, and which versions are current, superseded or withdrawn is in
[`specification/releases.json`](./specification/releases.json) — generated from
the published tree, and served at https://spec.vitness.me/releases.json for
anything that would otherwise transcribe it. [`SCHEMAS.md`](./SCHEMAS.md) writes
that manifest out for a reader; [`specification/discovery.md`](./specification/discovery.md)
is the normative prose on how resolution and compatibility work.

## Repository layout

```
fds-spec-website/
├── specification/          # the standard itself
│   ├── rfc/                # RFC documents — the normative text
│   ├── schema-sources/     # schema authoring; entity schemas share a common envelope here
│   ├── schemas/            # generated, published, frozen — schemas, examples, .integrity.json
│   ├── registries/         # recommended values for the open classifiers, plus illustrative catalogs
│   ├── governance/         # GOVERNANCE.md, CONTRIBUTING.md, CHANGELOG.md
│   ├── discovery.md        # versioning and URL resolution, normatively
│   └── releases.json       # generated release manifest — the single source of version truth
│
├── website/                # the Docusaurus site served at spec.vitness.me
│   ├── docs/               # documentation pages; the RFC and governance pages mirror their sources
│   ├── src/                # React components, landing page, /why-fds
│   ├── static/             # static assets; schemas, registries and releases.json are symlinks
│   └── docusaurus.config.ts
│
├── packages/               # the npm packages built on the standard
├── scripts/                # the schema build, and every check:* gate
├── .github/workflows/      # CI, deployment, published-URL verification, npm publishing
├── RELEASE.md              # the release runbook
├── SCHEMAS.md              # every published schema URL
└── LICENSE                 # a copy of the agreement under specification/
```

Anything under `specification/schemas/` is **generated** by
`scripts/build-schemas.mjs`; authoring happens in `specification/schema-sources/`.
The `*.example.json` fixtures and the `README.md` beside a generated schema are
the exceptions — those are hand-written.

## Packages

<!-- fds:covers packages -->
| Package | What it is |
|---|---|
| [`@vitness/fds-transformer`](./packages/fds-transformer) | CLI and library that maps a source catalog onto FDS, optionally enriches it, and validates the result against schemas it bundles — offline. [Docs](https://spec.vitness.me/docs/tools/transformer). |
| [`@vitness/fds-skill`](./packages/fds-skill) | The knowledge base an AI assistant loads to answer questions about FDS and produce documents that validate. |

Both are published from tags, by workflow, from `main` — see
[`RELEASE.md`](./RELEASE.md).

## Development

### Prerequisites

<!-- fds:count ci-node-major=20 -->
- **Node 20** — the major CI pins. `npm run verify` warns when your local major
  differs, and it means it: some checks compare recorded output byte for byte,
  and a green local run has already turned red in CI for that reason alone.
- **npm.** Every install here is `npm ci` against a committed
  `package-lock.json`.

### The website

```bash
cd website
npm ci
npm start     # dev server on http://localhost:3000/
npm run build # static output in website/build/
npm run serve # preview that build
```

### Verifying a change

```bash
npm run verify           # everything CI runs
npm run verify schemas   # one job: transformer | schemas | website
npm run check:published  # the deployed URLs, separately — needs the network
```

Every check `npm run verify` runs was demonstrated failing before it was
trusted — broken on purpose, its output read, then restored. What each one
guards, the defect that motivated it, and what it deliberately cannot see are
written at the top of its script under `scripts/`. That comment is the
explanation; this file keeps no second copy of the list, because a hand-kept
summary of the checks is the same drift the checks exist to catch.

## Releasing and deployment

**[`RELEASE.md`](./RELEASE.md) is the runbook** — merging a specification change,
cutting a spec release, and publishing either npm package, end to end, with what
is automatic, what needs a human, and what cannot be undone.

The short version: a push to `main` does **not** deploy. `.github/workflows/ci.yml`
runs first, and `.github/workflows/deploy.yml` starts when that run *completes* —
then builds and publishes the newest commit on `main` that has a successful CI
run, which is not necessarily the commit that triggered it. A red `main` stops
deploying. `.github/workflows/published.yml` then verifies that every frozen
schema URL is serving the bytes it froze.

## Contributing

- [Contributing Guide](./specification/governance/CONTRIBUTING.md) — how to
  propose a change, and the markers that keep documents honest.
- [Governance](./specification/governance/GOVERNANCE.md) — the RFC process and
  how decisions get made.
- [Release Runbook](./RELEASE.md) — how a change gets from a branch to a
  published, frozen URL.

Work from a branch off `main`, run `npm run verify` before opening a pull
request, and expect the gates rather than a reviewer to be what stands between
the change and `main`.

## License

The FDS specification, schemas, and documentation are provided under the
**VITNESS Open Standards License Agreement**.

See [the agreement](./specification/VITNESS%20Open%20Standards%20License%20Agreement.md),
or the copy at [`LICENSE`](./LICENSE) in this repository's root.

## Links

- **Live website:** https://spec.vitness.me/
- **Specifications:** https://spec.vitness.me/docs/specifications
- **Schemas:** https://spec.vitness.me/docs/schemas
- **Release manifest:** https://spec.vitness.me/releases.json
- **Issues:** https://github.com/vitness-me/fds-spec-website/issues

---

**Maintained by:** [VITNESS](https://github.com/vitness-me)
