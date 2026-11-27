# Changelog

All notable changes to `@vitness/fds-encoder` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-26

The first release. The 0.0.1 on npm before it is a deprecated placeholder
that created the package name.

### Added

- **The four structural keys.** Check, write in standard form and compare
  exercise (`FXI=1.0`), equipment (`FXE=1.0`), muscle (`FXM=1.0`) and muscle
  category (`FXMG=1.0`) keys. A comparison is `same`, `more-specific`,
  `overlap` or `different`, and a muscle key placed in a category key is `in`,
  `partly-in` or `not-in`.
- **Cross-checks.** An exercise key against the key of its main equipment, and
  a muscle reference against its category.
- **Building keys from questions.** The question flow as data, `build` from
  answers, and an interactive `ask` session.
- **Matching.** A record against a library of keyed records: an identical key
  first, then a short ranked list.
- **Records.** Reads and writes only a record's own key field and the key
  fields of its exercise, equipment and muscle references. `check --records
  --write` changes only the rewritten key strings in the file.
- **Code registries.** `buildRegistries()` generates the six registries
  published under `specification/registries/`.
- **CLI** `fds-encoder`: `check`, `compare`, `questions`, `ask`, `build` and
  `match`.
