# Changelog

All notable changes to `@vitness/fds-skill` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-11

Two things were wrong with 0.1.0 and they are worth stating plainly, because
this is a knowledge pack and the second kind of defect is the one that does
damage. It could not be resolved as a package: it named a markdown file as its
module entry point, so importing it threw from inside the importer's loader.
And parts of what it taught were not true — eight pointers that led nowhere,
three catalogue sizes that described catalogues nobody has published, and two
enumeration counts that had been wrong since the release that changed them.

A wrong name in a knowledge pack does not produce an error. It produces
confident, specific, invalid output, and the person who asked has no way to tell.
Everything under Fixed is that failure mode.

### Added

- **The three models this package predated:** the prescribed training session,
  the training program, and the definition library the two of them compose.
  0.1.0 documented exercises, equipment, muscles and their categories, and an
  assistant reading it could not answer a question about a session at all.

- **A method document, shipped beside the knowledge and exported like it.**
  Resolve a release to its entity versions before constructing a URL. Take a
  value from a registry rather than reasoning one out. Validate, and paste what
  the validator said. Treat superseded and withdrawn as opposite answers. Say
  out loud which claim you could not check. It states no version, no count and
  no entity name, so no release can date it — which is checked, from the other
  direction to everything else here.

- **Every name in the knowledge is now proved to exist**, and every name the
  current release publishes is proved to be taught: each property, each `enum`
  member and each `const` of every released schema, matched on whole tokens.
  Both directions are derived from the published schemas, so a schema that gains
  a field makes this stricter with no edit.

- The MIT licence text. The manifest declared MIT from the first release and the
  package never carried the file; the field is metadata, the grant is the file.

- A lockfile. Publishing installs with `npm ci`, which fails without one, so the
  package could not be released at all.

### Changed

- **Importing the package now fails at resolution instead of inside your
  loader.** There is nothing here to import — it is markdown and JSON — and the
  module entry point it used to declare pointed at a markdown file, which threw
  an unknown-extension type error from inside whatever did the importing, naming
  their code and not this package. Every file is addressed by subpath instead,
  and the package root is deliberately not exported.

- **The contributor-facing document no longer ships.** It addressed someone
  standing in the repository and pointed at paths that exist only there:
  correct document, wrong package. What a consumer needs from it is in the
  README.

- **The entry-point document carries knowledge only.** The persona that opened
  it changed no outcome, and the procedure buried in it could not be lifted into
  a harness without dragging a release's worth of version numbers along. That
  procedure is now the method document; what is left is what is true.

- Every schema URL and every version claim in the package is checked against the
  release manifest on each release, and this one names the current release
  throughout.

### Fixed

- **Eight pointers led nowhere.** Five RFCs were listed under filenames they had
  been renamed away from, and three registries under a directory that was never
  published. Nothing read them, so they had been wrong for as long as they had
  existed.

- **Three catalogue sizes described catalogues that do not exist.** The registry
  entries claimed 41 muscles, 31 equipment items and 10 categories. The
  published registry files are illustrative examples with three entries each. A
  reader was told a vocabulary exists that they could go and fetch, and it does
  not.

- **Two enumeration counts had been wrong since the release that changed them.**
  The knowledge quoted 13 members for `metricType` and 16 for `metricUnit`; both
  vocabularies had grown well past that. The counts now come from the published
  schema, and a gate compares them to it — a number written into a document by
  hand is the thing this whole standard keeps deleting, and a changelog is the
  worst place to keep one, because it is never revisited.

- **A muscle heat map was described with a field that does not exist** — an
  array of area identifiers hanging off the map — where the schema carries
  `regions`, each with an `areaId` and a `weight`. It survived every green run
  before this, because the gate read only fenced TypeScript and this was prose.

- **The worked examples were not valid documents.** The transformed exercise
  claimed a `schemaVersion` that has since been withdrawn and no longer
  resolves, and the mapping beside it named keys the published mapping schema
  rejected. Every JSON file the package ships is now either validated against a
  published schema or says in itself that it is not FDS.

## [0.1.0] - 2026-01-28

### Added

- The knowledge pack as first published: entity shapes for exercise, equipment,
  muscle and muscle category, a mapping guide, an enrichment guide, three
  enrichment prompts, and one worked example of each of a source schema, a
  mapping configuration and a transformed result.

[Unreleased]: https://github.com/vitness-me/fds-spec-website/compare/fds-skill@0.2.0...HEAD
[0.2.0]: https://github.com/vitness-me/fds-spec-website/compare/fds-skill@0.1.0...fds-skill@0.2.0
[0.1.0]: https://github.com/vitness-me/fds-spec-website/releases/tag/fds-skill@0.1.0
