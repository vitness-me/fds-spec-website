---
title: Structural Keys
sidebar_position: 1
---

# Structural Keys

A structural key is a short string that describes an exercise, a piece of equipment or a muscle by what it is. It uses fixed codes and no words from any language. Two catalogs that call the same exercise by different names can compare keys and see that they mean the same thing.

## The problem with names

Catalogs find each other's records by name today, and names travel badly.

- One exercise has many names. "Dumbbell curl", "standing DB curl" and "bicep curl" are the same movement, and a gym may use a house name for it as well.
- Names change with language. "Curl con mancuerna" is the same exercise, and an English catalog has no way to tell.
- One name can mean several things. "Row" might be a cable row, a barbell row or a session on a rowing machine.

Matching by name comes down to string similarity, translation and guesswork, and every pair of catalogs repeats that work. When someone moves to another app, their training history arrives tied to names the new app may not recognize.

## What a structural key is

A key describes the thing itself. It is made of layers, and each layer records one dimension of the thing in codes from lists the standard publishes. The standing dumbbell curl has this key in every catalog, whatever the catalog calls it:

`FXI=1.0S/m:el.flex/o:standing/l:db@hands`

It reads as elbow flexion, standing, with a dumbbell in the hands. A Spanish catalog and an English one write the same key, because the key contains no names.

FDS publishes how keys are built and the code lists they draw on. It does not publish keys for any exercise, muscle or piece of equipment, because FDS is a standard and not a catalog. Each owner writes the keys for its own records.

## What keys make possible

- **Matching across catalogs.** You compare keys instead of names. Comparing two keys tells you they are the same, that one is more specific than the other, or that they are different.
- **Interoperability.** Two platforms can link their catalogs without first agreeing on names or adopting a shared list.
- **History that survives a move.** When someone changes apps, the new app can find each logged exercise in its own catalog by key, so their history stays usable.

## What keys don't do

- **A key is not an identifier.** A record's identity is its owner's `id`, as before. Two owners describing the same exercise don't always write the same key: one may record more detail, or read the movement differently. A key finds candidates. It doesn't prove two records are the same.
- **A key says nothing about prescription.** Tempo, load, sets and reps belong to the [prescription primitives](../specifications/rfc-006-prescription-primitives) and to workouts.
- **A key doesn't replace names.** Names, aliases and translations stay in the record. The key sits beside them.

Keys are optional. A record without one is still valid FDS.

## The three keys

| Model     | Field | What it describes                                        | Example                                    |
|-----------|-------|----------------------------------------------------------|--------------------------------------------|
| Exercise  | `fxi` | How the body moves, its position, and what it moves with | `FXI=1.0S/m:el.flex/o:standing/l:db@hands`, a standing dumbbell curl |
| Equipment | `fxe` | What kind of equipment it is and its form                | `FXE=1.0S/k:imp/f:bar.ez`, an EZ bar        |
| Muscle    | `fxm` | The muscle and, where it has them, its parts             | `FXM=1.0/biceps-brachii.long`, the long head of biceps brachii |

The same fields also appear wherever a record refers to an exercise, a muscle or a piece of equipment by id and name, so references can be matched the same way.

## Using keys

To link two catalogs, compare the keys of their records and collect the candidates. An identical key is a strong match. Otherwise a person picks the right record from a short list. Keep each confirmed link in your own data, in `attributes` or `extensions`, so nobody has to find it again. You can write keys by hand by following each key's composition pattern, or generate them with the FDS Encoder.

## Where to go next

<!-- TODO: turn these into links once the pages exist: ./structural-keys/exercise-key, ./structural-keys/equipment-key, ./structural-keys/muscle-key, and the Encoder page under Tools. -->

- Exercise key: how `fxi` is built, its dimensions and codes.
- Equipment key: how `fxe` is built.
- Muscle key: how `fxm` is built.
- Tools → Encoder: generate keys for your own records.
