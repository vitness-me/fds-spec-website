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
- **A confirm result names its reason as a stable code.** `match` returns
  `reason` (`no-identical`, `several-identical`, `query-gap`, `entry-gap`,
  `query-import`, `entry-import`, `query-not-owner`, `entry-not-owner` or
  `fxe-differs`) beside the `why` text, so the
  resolver conformance vectors can check it across implementations.
- **Rules revision 1.4.** A joint action may have a parent: `sh.ext` covers
  its child `sh.ext.oh` in compare (under any prefix, beside other actions
  and in a held part), a child counts as its parent in the opposite-action
  check, a single-joint machine accepts a child of its motion, and the
  canonical form drops a parent written beside its child in one part. A grip
  switch on a pull-up or pulldown word writes `sh.ext.oh`. The line question
  offers `neck` and `double`.
- **Auto-match also requires identical FXEs when both rows carry one.**
  Otherwise the match goes to confirm with the reason `fxe-differs` ("the
  FXEs are not identical"). A row without an FXE leaves auto-match to the FXI, and the
  gap, import and provenance refusals keep their priority.
