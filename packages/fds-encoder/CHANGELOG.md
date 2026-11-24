# Changelog

All notable changes to `@vitness/fds-encoder` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **The `fds-encoder` CLI and library for the draft structural descriptors
  FXI, FXE and FXM.** `ask` walks the owner question flow in the terminal;
  `build` turns answers records into canonical strings and keeps each record
  beside its strings; `validate`, `compare` and `match` implement the
  syntax, compare and the match protocol; `review` is the collision check
  within an owner's library; `upgrade` rebuilds every string from its stored
  answers and reports each one that changes.
- **The vocabularies come from the FDS descriptor registries.** The build
  inlines the registries the package was built from; a registry the code
  cannot read fails at load rather than encoding with a stale table.
- **Movement words are an input.** `--words` loads a movement-word dataset
  from a file or a URL, checked against the documented format. Without one,
  every exercise is encoded joint by joint through `other`.
- **Import mode is candidate search only**, in the help text and the output.
- **FXM validates its format alone**, and a provider's muscle vocabulary
  with `--muscles`. No muscle list ships.
