# Changelog

All notable changes to `@vitness/fds-encoder` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **Records.** Reads and writes only `fxi`, `fxe`, `fxm` and `fxmg` on FDS
  records and their references.
- **Code registries.** `buildRegistries()` generates the six registries
  published under `specification/registries/`.
- **CLI** `fds-encoder`: `check`, `compare`, `questions`, `ask`, `build` and
  `match`.
