# Changelog

All notable changes to `@vitness/fds-transformer` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-11

Everything below shipped between 0.1.0 and this release. Two entries deserve
reading before you upgrade: `validate --version` used to validate nothing, and
the default release moved from 1.0.0 to 1.4.0.

### Added

- **Every published FDS release resolves offline.** 1.1.0, 1.2.0, 1.3.0 and
  1.4.0 join the bundled 1.0.0, so a consumer with no network gets a schema for
  whichever release they name rather than a fallback that only knows the oldest
  one. Each bundle is generated from the published bytes of the exact entity
  version its release names, so a release that keeps an older entity keeps that
  entity's bytes.

- **Entities version independently within a release.** `RELEASE_ENTITY_VERSIONS`
  and `entityVersionFor(entity, release)` map a release to the set of entity
  versions it publishes, generated from the release manifest. 0.1.0 used the
  release name as the path segment for every entity, which requests URLs that
  were never published the moment one entity moves ahead of another — and every
  one of those 404s dropped the loader to bundled copies permanently and
  silently. A release this package has never heard of still falls back to using
  its own name for every entity, so an older build can fetch a newer release.

- **Two entities and a definition library the loader could not reach before:**
  workout, program, and the prescription definitions that workouts and programs
  compose.

- `SchemaLoadResult.failures` — why each remote load failed, distinguishing the
  two ordinary cases where falling back is right (unreachable, HTTP error) from
  the two that mean a URL is misconfigured (answered with something that is not
  JSON, answered with JSON that is not a schema).

- `fixtures/roundtrip/` — a mapping whose every required field comes from the
  source, so a valid FDS document falls out of the transform alone: no API key,
  no network, no model. It runs in CI.

- The MIT licence text. The manifest declared MIT from the first release and the
  package never carried the file; the field is metadata, the grant is the file.

### Fixed

- **`validate --version <version>` validated nothing and exited 0.** Both
  `transform` and `validate` document `--version` as the FDS release to work
  against. Commander parses the program's own options across the whole argument
  list before dispatching to a subcommand, so the value matched the program's
  `--version` flag, printed the package version, and exited — before the file
  was read. A script running

      fds-transformer validate --input out.json --version 1.1.0

  was told its data was valid when nothing had been validated. `--version=1.1.0`
  happened to work, because the program's flag takes no value and so declined
  the `--flag=value` form; two spellings of one option, one of which silently did
  nothing.

  Subcommand options are now parsed by the subcommand. `fds-transformer
  --version` still prints the package version, because no subcommand precedes
  it.

  **If you have a script calling `validate --version <release>` and treating a
  zero exit as a pass, that script has never validated anything.** It will start
  reporting real failures on this release. That is the fix working.

- **Validation could pass without validating.** `validate()` returned
  `valid: true` when a schema failed to compile or was not registered;
  `loadExternalSchema()` substituted a permissive schema on a fetch failure,
  which passes any field under an unresolved `$ref`; and `loadVersion()` cached
  an empty schema set when both remote and bundled loading failed. All three
  now fail loudly.

- **A remote fetch that answered 200 with something other than a schema fell
  back silently.** Anything that intercepts a request — a sign-in page, a
  captive portal, a CDN error page — answers 200 with HTML, the parse threw, and
  the loader served bundled schemas instead. "Remote first, so you get the
  latest" became "always bundled", indistinguishable from being offline. The
  content type is checked before parsing, a gateway's JSON error body is
  rejected as not-a-schema rather than compiled as one that accepts everything,
  and the reason is surfaced on `SchemaLoadResult.failures`.

- **A transform that dropped every record printed a count, said "Done!" and
  exited 0.** Both processing paths computed the errors sitting on each result
  and threw them away, at every log level. Failures now name the field and the
  rule that rejected them, and a run that produced no output exits non-zero.

- **`validate` accepted only a single document**, so validating the transform's
  own output reported `_root: must be object` — a statement about the file's
  shape that reads as a statement about the data. It now validates each document
  in an array and names the one that failed.

- **The shipped example configurations wrote a media type no FDS schema
  allows.** Both the tiered-enrichment example and the proof-of-concept mapping
  set `"type": "gif"` on media, where every published exercise schema allows
  image, video, doc and 3d — so anyone starting from either wrote invalid
  documents, unnoticed because their validation ran non-strict and the CLI
  never said what had failed. Both now write `image`, which is what the
  published exercise example uses for a `.gif` URI.

  Both also targeted release 1.0.0 and stamped an entity version of 1.0.0.
  `targetSchema.version` names a release and `schemaVersion` names the entity
  version that release publishes; those are different numbers, and reading them
  as one is what produced the pair.

- **`source: "remote"` never worked for muscles, equipment or muscle categories.**
  `RegistryManager` built `https://spec.vitness.me/registries/<name>.registry.json`
  for all three. No such file has ever been published — FDS serves these as
  `<name>.registry.example.json` — so every consumer of the remote path got a
  hard throw from the first release onwards. The unit test asserted the broken
  URL against a mocked fetch, which proves a URL is *constructed* and cannot
  prove it resolves, so the defect shipped green.

### Changed

- **The default release is now 1.4.0, was 1.0.0.** FDS minor versions are
  additive — data valid under an older release stays valid — so moving the
  default forward cannot reject anything 0.1.0 accepted, while staying behind
  rejects the fields the newer releases added. Pass `--version 1.0.0`, or set
  `targetSchema.version`, to stay where you were.

  Note that the exercise and equipment schemas at 1.0.0 have since been
  withdrawn and no longer resolve over the network. Release 1.0.0 still loads,
  from the bundled copies this package ships for exactly that reason.

- **The mapping configuration schema is published at 1.1.0 and names every key
  the tool reads.** `allowUnsafeEval`, and `tiers`, `fields`, `fallback`,
  `rateLimit` and `checkpoint` under `enrichment`, were all documented, all used
  by the shipped examples, and all rejected by the 1.0.0 schema, which is closed
  at the root and inside `enrichment`. A configuration written by following the
  documentation did not validate. Point `$schema` at the 1.1.0 URL to have an
  editor accept them; 1.0.0 stays published and frozen for configurations that
  name it.

- **The mapping schema this package ships is generated from the published
  bytes.** It was hand-made and had drifted — it carried a key the published
  document lacked — so an editor resolving `$schema` against `node_modules` and
  an editor resolving it over the network disagreed about what a valid
  configuration is.

- `fds-transformer --version` reads the version from the manifest instead of a
  literal in the source, so it cannot report the release before the one you
  installed.

- The build no longer copies schema files into `dist/`. Nothing ever read them:
  each entry inlines the bundled schemas it imports, which is what makes the
  offline path work. The directory listing described one release out of five
  and read as the offline story, which is worse than being absent.

- `npm pack` now produces the bytes `npm publish` uploads, because the build
  hook moved from `prepublishOnly` to `prepack`. Inspecting the tarball is
  therefore a statement about the published package rather than about a build
  directory that resembles it.

- **There is no default remote source for these three registries.** Asking for
  one now fails immediately, naming the illustrative catalog and explaining the
  choice, instead of fetching a URL that 404s. This is deliberate rather than a
  rename: the [registries README][registries-readme] distinguishes a normative
  vocabulary (`*.registry.json`) from an illustrative catalog
  (`*.registry.example.json`), and only the second exists for these entities.
  A registry lookup yields an id that lands in your output and then in your
  database; the illustrative ids belong to no provider and the spec reserves the
  right to change them, so defaulting there would trade a loud failure at load
  for silently wrong ids found much later. Set `url`, `local` or `inline` —
  including `url` pointing at the illustrative catalog, which is now a visible
  decision in your own config.

  Nothing can have depended on the previous behaviour: it threw.

- A remote source that cannot be resolved is raised before the `fallback` path.
  A fallback exists to survive a flaky endpoint, not to mask a configuration
  naming a source that does not exist.

- A remote registry that does not deserialise to an array of entity documents is
  rejected at the URL. Pointing `url` at one of the normative vocabulary
  registries — objects wrapping `entries`, published in the same directory — used
  to surface as `registry.find is not a function` at the first lookup.

## [0.1.0] - 2026-01-27

### Added

- **CLI Tool** - Interactive and non-interactive modes for transforming exercise data
  - `fds-transformer transform` - Transform source data to FDS format
  - `fds-transformer validate` - Validate FDS-compliant JSON files
  - `fds-transformer init` - Generate mapping configuration from sample data
- **Tiered AI Enrichment** - Multi-tier AI-powered field generation via OpenRouter
  - **Simple tier** (Claude Haiku 4.5): aliases, exerciseType, level, metrics, optional equipment
  - **Medium tier** (Claude Sonnet 4.5): constraints, progressions, regressions, relations
  - **Complex tier** (Claude Sonnet 4.5): movement patterns, mechanics, force vectors, secondary muscles
  - Configurable fallback chain for model degradation on errors
- **Built-in Transforms** - 12 transformation functions
  - `slugify`, `titleCase`, `uuid`, `prefixUUID`
  - `toArray`, `toMediaArray`, `registryLookup`
  - `timestamp`, `autoGenerate`, `template`, `urlTransform`
- **Registry Management** - Muscle, equipment, and category lookups with fuzzy matching
  - Pre-built registries: 41 muscles, 31 equipment items, 10 categories
- **Schema Validation** - FDS v1.0.0 schema validation with AJV
  - Hybrid schema loading: remote-first with bundled fallback
  - Offline support via bundled schemas
- **Plugin System** - Extend with custom transform functions
- **Programmatic API** - Use as a library in Node.js applications

### Technical

- Built with TypeScript, targeting Node.js 20+
- ESM-only package with full type definitions
- Zero runtime dependencies on external schema fetching (bundled fallback)

[Unreleased]: https://github.com/vitness-me/fds-spec-website/compare/fds-transformer@0.2.0...HEAD
[0.2.0]: https://github.com/vitness-me/fds-spec-website/compare/fds-transformer@0.1.0...fds-transformer@0.2.0
[0.1.0]: https://github.com/vitness-me/fds-spec-website/releases/tag/fds-transformer@0.1.0
[registries-readme]: https://github.com/vitness-me/fds-spec-website/blob/main/specification/registries/README.md
