---
title: 'Structural Descriptors: FXI, FXE and FXM'
sidebar_label: 'Overview'
description: 'Draft structural descriptors for exercises, equipment and muscles: what they are, what FDS publishes, and where to start encoding by hand'
sidebar_position: 1
---

# Structural Descriptors: FXI, FXE and FXM

:::caution Draft / experimental
These pages describe a draft. Nothing here is normative until the RFC that adopts the structural descriptors is accepted: RFC (pending). Codes, questions and field names may still change before then. The vocabularies are versioned by rules revision, separately from the entity schemas, and no published schema carries these fields yet.
:::

A structural descriptor is a short string that says how an exercise is done, what a piece of equipment is, or which muscle is meant, in a closed vocabulary rather than in words. Two catalogues that describe the same exercise in different languages, with different names, can still write the same descriptor, and software can compare the two strings without reading either name.

| Descriptor | Describes | Looks like |
|---|---|---|
| **FXI** | An exercise: its motion, body position, support, load, sides, grip, range, held posture and line of pull. | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` |
| **FXE** | A piece of equipment, by its structure: kind, form, and for a machine its load interface, posture and guided motion. | `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back` |
| **FXM** | A muscle, a part of one, or a group of muscles, anchored to an open anatomy ontology. | `FXM=1.0/latissimus-dorsi` |

The first example is a barbell back squat; the second is the machine a seated cable row is done on.

## What a descriptor is, and what it is not

FXI is a **descriptor**, not an identity. It is deterministic in two ways: the same answers always build the same string, and the same two strings always compare the same way. It does not make two people who describe the same exercise write the same string every time. People state optional details differently, and the vocabulary cannot say everything.

So the claim this standard makes is exactly this: **a deterministic descriptor and compare; auto-match on unique identical keys; one-click confirm otherwise; the confirmed link is stored.**

- Two strings that compare `identical` describe the same structure. Compare never reports two different strings as identical.
- When a library holds exactly one entry identical to the query, and both sides were answered by their owners and neither carries a gap marker, software may link them without asking.
- Otherwise it offers a short ranked list for a person to confirm, and stores the confirmed link.

Rows read out of another catalogue, without its owner (import mode), are for candidate search only. This standard makes no accuracy claim for them, and they never link without a person.

## What FDS publishes, and what it does not

FDS is a standard, not a catalogue. It publishes:

- the **syntax** of each string, its canonical form, and the rules that decide each layer;
- the **classifier vocabularies**: joint actions, orientations, body points, symmetry, grip and stance, range, held postures and lines of pull for FXI; kinds, forms, drives, interfaces, postures, directions, cycles and tracks for FXE. They live in [`specification/registries/descriptors/`](https://github.com/vitness-me/fds-spec-website/tree/main/specification/registries/descriptors);
- the **question flow**: the closed questions whose answers build an FXI and an FXE, written out so a person can answer them by hand;
- **compare**, the **match protocol** and **versioning**.

It does not publish:

- **movement words.** A movement word ("squat", "row") is a shortcut that fixes the usual reading of every layer at once. Words are catalogue data: an encoder loads a movement-word dataset, and the question flow says where it plugs in. Without one, every exercise can still be encoded, by describing its motion joint by joint. The word an owner picked never travels in the string; it is kept in the answers record, where a resolver may use it as a ranking hint;
- **a muscle list.** FXM specifies the key format, how a key is anchored and what a group means. Which muscles and groups exist is a provider's vocabulary;
- **an equipment catalogue.** FXE classifies structure. A provider's equipment entries carry FXE strings; FDS does not list products or models.

## The fields a record carries

A record that carries an FXI carries these beside it:

| Field | Holds |
|---|---|
| `fxi` | The canonical FXI. `null` on an equipment record. |
| `fxe` | The canonical **standard** FXE of the record's main equipment (`FXE=1.0S/…`). Extended FXE layers appear only in an equipment registry record. |
| `fxiProvenance` | Who answered for the FXI: `owner`, `owner-assisted`, `agent` or `import`. See [Compare, match and versioning](./compare-and-match.md#provenance). |
| `fxiGap` | The owner's plain-text note of what the notation misses about this exercise, or `null`. A gap marker blocks auto-match. |

Confirmed links between catalogues are stored in an `xrefs` array. Where these fields sit on the exercise and equipment entities, and the shape of `xrefs`, is for the RFC (pending) to define.

## Encoding by hand: where to start

1. Read [FXI](./fxi.md) once, for the shape of the string and what each layer means.
2. Walk [the question flow](./question-flow.md) from the top. Each question says when it is asked and which code each answer writes. Without a movement-word dataset, answer `other` for the movement and describe the motion joint by joint.
3. Assemble the string with [the build rules](./question-flow.md#from-answers-to-strings), then make it canonical with [the canonical form](./fxi.md#canonical-form).
4. For the equipment, follow the equipment branch of the same flow, or [the FXE procedure](./fxe.md#procedure).
5. To decide whether two strings describe the same thing, use [compare](./compare-and-match.md#compare).

The question flow ends with [worked examples](./question-flow.md#worked-examples): a barbell back squat, a seated cable row and the seated cable row machine.

## Pages

| Page | Covers |
|---|---|
| [FXI](./fxi.md) | The exercise descriptor: syntax, defaults, the source rule, layer rules and every code. |
| [Question flow](./question-flow.md) | Every question, when it is asked, what each answer writes, and how answers become strings. |
| [FXE](./fxe.md) | The equipment descriptor: kinds, layers, the procedure and every code. |
| [FXM](./fxm.md) | The muscle key: format, anchoring and group semantics. |
| [Compare, match and versioning](./compare-and-match.md) | Relations between strings, the match protocol, provenance, the gap marker and how rules revisions evolve. |
