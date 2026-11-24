---
title: 'FXM: Muscle Key'
sidebar_label: 'FXM (muscles)'
description: 'Draft FXM key format, ontology anchoring and group semantics'
sidebar_position: 5
---

# FXM: Muscle Key

:::caution Draft
Not normative until the RFC that adopts the structural descriptors is accepted: RFC (pending). See [the overview](./overview.md).
:::

An FXM names a muscle, a part of one, or a group of muscles, so that two catalogues that call the same muscle different things, in different languages, can tell that they mean the same tissue.

FDS specifies the key's format, how a key is anchored to anatomy, and what a group means. **It does not publish a list of muscles or groups.** Which muscles a provider names, which parts it splits out and which groups it defines are that provider's vocabulary, published beside its muscle catalogue. The rules below are what make two providers' vocabularies comparable.

## Format

```text
FXM=1.0/<muscle>              a whole anatomical muscle
FXM=1.0/<muscle>.<part>       a part or head of a muscle
FXM=1.0/g:<group>             a group, defined by its members
```

- `1` is the major version and `0` the syntax revision; both are always written. FXM has no extended layers, so its canonical header carries no `S` or `N` flag; a written flag is accepted and dropped.
- Every token is lowercase kebab-case: a letter, then letters and digits, in words joined by single hyphens.
- A key carries no side. Left and right belong to the exercise (FXI `x`), not to the muscle.

Illustrative keys, from a provider's vocabulary rather than from this standard: `FXM=1.0/latissimus-dorsi`, `FXM=1.0/deltoid.acromial`, `FXM=1.0/g:hamstrings`.

## Anchoring

Every muscle and every part is anchored to an open anatomy ontology, so the key means a structure rather than a word.

1. **FMA is primary.** Each muscle and part carries the Foundational Model of Anatomy term for that structure (`FMA:<id>`, with the term's label as FMA writes it).
2. **UBERON is the cross-reference.** Where UBERON has a term for the same structure, it is carried too (`UBERON:<id>`).
3. **A missing term is a listed gap, never a guess.** Where an ontology has no term for the structure (UBERON often has a whole muscle but not its heads), the entry records that gap in words, naming what the ontology has instead. An anchor is never borrowed from a broader or narrower structure.

**Tokens follow the anchor.** A muscle token is derived from the preferred label of its FMA term: lowercase it, remove the words "muscle group", or else the word "muscle", and join the remaining words with single hyphens (`Latissimus dorsi` is `latissimus-dorsi`, `Erector spinae muscle group` is `erector-spinae`). A part token is the qualifier in the FMA label of the part or head, the word before "part of" or "head of" (`Clavicular part of deltoid` is `clavicular`, `Long head of biceps brachii` is `long`). Two providers that anchor a structure to the same FMA term therefore write the same key for it, and a reader can resolve a muscle or part key from FMA without the provider's vocabulary. A group token is not derived: it is the provider's own (see [groups](#groups-are-member-sets)).

**Parts exist only where they train differently.** A muscle with parts is exactly the union of its parts: there is no tissue in the whole muscle that no part covers.

Each vocabulary entry therefore carries: its token, a display name, its anchors (system, CURIE, label), and, where an ontology has no term, the gap.

## Groups are member sets

A group is defined by **the FXM keys of its members**, never by its name. Members may be muscles, parts or other groups.

- A group means the set of anatomical leaves its members cover: a part is itself; a muscle with parts is all its parts; a muscle without parts is itself; a group is the union of its members' leaves.
- Two keys with the same leaves mean the same tissue, whatever they are called. A group and a muscle can be identical.
- A group has at least one member, every member is a valid canonical key in the same vocabulary, and no group contains itself through other groups.
- A group may also carry an ontology anchor, where an ontology has a term for exactly that set.

Two providers can name a group differently and still agree on what it means, because the comparison is over leaves, not names. A `g:` key is resolved only through the vocabulary of the provider that defined it, and a key does not say which provider that is.

## Compare

Two FXM keys are compared by the anatomical leaves each covers:

| Grade | When |
|---|---|
| `identical` | The same leaves. |
| `contains` | One covers every leaf of the other, and more. The grade names which side is the container. |
| `overlaps` | Some leaves are shared, and neither contains the other. |
| `disjoint` | No leaf is shared. |

Comparing keys from two vocabularies requires both vocabularies, since a group's leaves come from its provider's member lists. Keys whose leaves are anchored to the same ontology terms describe the same tissue across vocabularies.

## Validation

An FXM is valid when its header is `FXM=1.0/`, its body is one of the three forms above, and the vocabulary it is checked against has that muscle, that part of that muscle, or that group. Validation is always against a named vocabulary: the format can be checked alone, the existence of a token cannot.

<!-- TODO (pending the RFC): where a provider publishes its FXM vocabulary, and the entry shape, are for the RFC to fix. -->
