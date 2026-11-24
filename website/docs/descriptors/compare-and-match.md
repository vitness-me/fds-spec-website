---
title: 'Compare, Match and Versioning'
sidebar_label: 'Compare, match, versioning'
description: 'Draft compare relations, match protocol, provenance, gap marker and rules versioning for the structural descriptors'
sidebar_position: 6
---

# Compare, Match and Versioning

:::caution Draft / experimental
Not normative until the RFC that adopts the structural descriptors is accepted: RFC (pending). See [the overview](./overview.md).
:::

## Compare

Compare takes two FXIs, or two FXEs, and says how the exercises (or the equipment) they describe relate. It reads only the strings: never a name, never a movement word.

**Every value denotes a set.** A known code denotes itself. `?` and `*` denote every value. A parent code covers its children: an FXE form covers its child forms (`band` covers `band.loop`), an equipment token covers its child tokens (`dome` covers `dome.up` and `dome.down`, `erg` covers every `erg.<cycle>`), and a range code covers its child (`from-top` covers `from-top.knee`).

**Absent standard layers are values.** A standard layer left out of a string takes its published default, which contradicts every other known value. Only `?` and `*` are open. An **extended** layer (FXI `a`, the FXE build details) is compared only when both strings carry it; when only one does, that side is the more specific one.

**Per layer**, side A is `equal`, `narrower` (A names a subset of what B names), `broader`, `open` (both incomplete and compatible), or `contradicts`. Multi-item values match item by item: every item on one side must pair with an item on the other. In `l`, a count a string leaves out is its usual count under that string's own symmetry, hold point and motion ([counts](./fxi.md#load-l)), and counts compare as numbers; where a side's usual count is unknown, its count is open. So `l:db*2@hands/x:?` is refined by the two-dumbbell curl `l:db@hands`, not contradicted by it.

**Overall**, the result is one of:

| Relation | Meaning |
|---|---|
| `identical` | The canonical strings are byte-equal and hold no `?` and no `*`. Nothing else is ever identical. |
| `refines` | A is a more specific description of B: every layer is `equal` or A is `narrower`, at least one is narrower (a known value against `?` or `*`, a child code against its parent), or A carries an extended layer B lacks. |
| `refined-by` | The reverse: B is the more specific. |
| `compatible` | No layer contradicts; some are open, or the narrowing goes both ways. |
| `contradicting` | Some layer cannot match. |
| `invalid` | Either string is invalid, or the two are of different kinds. |

A generic layer (`*`) against a known value is therefore `refines` on the known side: a squat written for either orientation is refined by a standing squat.

Compare is not transitive. Deduplicate only on `identical`.

**FXE combinations.** Two single configurations compare layer by layer as above, with kinds that differ contradicting. A combination machine is `identical` to the same combination when neither holds a `?`, `compatible` with any configuration that fits one of its own, and `contradicting` otherwise.

### Examples

| A | B | Relation |
|---|---|---|
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `identical` |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:*/l:bb@back` | `refines` (orientation narrower) |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:?@back` | `refines` (load narrower) |
| `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:?` | `refines` (grip narrower) |
| `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands` | `contradicting` (`ne` against the default overhand) |

## Provenance

Every FXI travels with `fxiProvenance`, which says who answered for it:

| Value | Meaning |
|---|---|
| `owner` | The owner of the exercise answered the question flow. |
| `owner-assisted` | Someone else, or software, proposed the answers and the owner confirmed them. |
| `agent` | Someone else, or software, answered, and the owner did not confirm. |
| `import` | Read from another catalogue's row in import mode. Import mode always writes `import`, and only import mode does. |

## The gap marker

`fxiGap` is the owner's plain-text note that the notation misses something that separates this exercise from others, or `null`. An owner writes it whenever the vocabulary cannot say a difference that matters. It blocks auto-match, and it is the evidence a later rules revision draws on.

## Match protocol

A resolver matches a record against a library:

1. **Auto-match** only when exactly one library record compares `identical` to the query, neither record carries a gap marker, and both have provenance `owner` or `owner-assisted`.
2. Otherwise, **confirm**: offer a ranked list of at most three library records, each once, with the reason auto-match was refused, for a person to pick from or reject.
3. A **confirmed link is stored** against the library's identifier, in the record's `xrefs`, so the match is never made again.

Import-mode FXIs are for candidate search only: the protocol never auto-matches them, and this standard makes no accuracy claim for them.

:::note Pending
The ranking of the confirm list is being revised and is left to the RFC (pending). It starts from the compare relations above (`identical`, then `refines` or `refined-by`, then `compatible`) and may add FXE and name evidence. The shape of `xrefs` is also the RFC's to define.
:::

## Versioning

**Two numbers, kept apart.** The string header carries the major version and the syntax revision (`FXI=1.0`, `FXE=1.0`, `FXM=1.0`). The syntax revision changes only when the grammar does. The **rules revision**, named by the `rules` field of each descriptor registry and of the question flow, is the revision of the vocabularies and layer rules. It is not written in the string.

**One rules revision per release.** A release of the standard carries at most one new rules revision, and each new ruling in it rests on at least two failing cases from at least two catalogues.

**Refinement only, within a major.** A rules revision of the same major may only refine:

- add a code;
- split a code into children, the old code becoming their parent, which covers them in compare;
- add a layer, which older strings read as `?`;
- add a table entry where the old reading was `?`;
- give a published default to a layer whose absence was open.

It never removes a code, never changes what a code means, and never changes an existing default. **Defaults are forever:** a string that leaves a layer at its default means the same thing under every later rules revision of its major. Every string valid under one rules revision stays valid, and two strings that were `identical` stay `identical`.

**Answers are kept, so strings can be rebuilt.** A producer stores the answers record beside each string: the question ids and the options chosen, the movement word and the movement-word dataset it came from, if any, the provenance and the gap marker. When a new rules revision refines a reading, `upgrade` rebuilds every string from its stored answers instead of re-asking anyone. A string with no stored answers stays valid as written.

**No hashed key.** Version 1 defines no hash or short key derived from a string. Strings are compared as strings.

## Conformance

Implementations are tested in four tiers, each at 100% on published test vectors: **syntax** (parse, canonicalise and validate), **builder** (answers to byte-identical strings), **compare** (the right relation for every pair, and never `identical` for two different strings), and **resolver** (the match protocol on a published suite). No tier certifies that a person or a program encodes accurately: that cannot be certified, and is reported as measured agreement instead.

<!-- TODO (pending the RFC): the test vectors and the resolver suite. -->
