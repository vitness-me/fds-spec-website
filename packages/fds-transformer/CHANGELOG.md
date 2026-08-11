# Changelog

All notable changes to `@vitness/fds-transformer` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **`source: "remote"` never worked for muscles, equipment or muscle categories.**
  `RegistryManager` built `https://spec.vitness.me/registries/<name>.registry.json`
  for all three. No such file has ever been published — FDS serves these as
  `<name>.registry.example.json` — so every consumer of the remote path got a
  hard throw from the first release onwards. The unit test asserted the broken
  URL against a mocked fetch, which proves a URL is *constructed* and cannot
  prove it resolves, so the defect shipped green.

### Changed

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

[Unreleased]: https://github.com/vitness-me/fds-spec-website/compare/fds-transformer@0.1.0...HEAD
[0.1.0]: https://github.com/vitness-me/fds-spec-website/releases/tag/fds-transformer@0.1.0
[registries-readme]: https://github.com/vitness-me/fds-spec-website/blob/main/specification/registries/README.md
