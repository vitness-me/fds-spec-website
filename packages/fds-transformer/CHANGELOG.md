# Changelog

All notable changes to `@vitness/fds-transformer` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/vitness/fds-spec-website/compare/fds-transformer@0.1.0...HEAD
[0.1.0]: https://github.com/vitness/fds-spec-website/releases/tag/fds-transformer@0.1.0
