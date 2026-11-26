# Structural Keys

A structural key is a short string that describes an exercise, a piece of equipment, a muscle or a muscle category by what it is. It is written in codes the standard publishes, not in any catalog's own names. Two catalogs that call the same exercise by different names can compare keys and find each other.

## The problem with names

Catalogs find each other's records by name today, and names travel badly.

- One exercise has many names. "Dumbbell curl", "standing DB curl" and "bicep curl" are the same movement, and a gym may use a house name for it as well.
- Names change with language. "Curl con mancuerna" is the same exercise, and an English catalog has no way to tell.
- One name can mean several things. "Row" might be a cable row, a barbell row or a session on a rowing machine.

Matching by name comes down to string similarity, translation and guesswork, and every pair of catalogs repeats that work. When someone moves to another app, their training history arrives tied to names the new app may not recognize.

## What a structural key is

A key describes the thing itself. It is made of layers, and each layer records one dimension of the thing in codes from lists the standard publishes. An owner describing a standing dumbbell curl writes this key, whatever its catalog calls the exercise:

`FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`

It reads as elbow flexion, standing, with a dumbbell in the hands. A Spanish catalog and an English one can write the same key, because the key doesn't depend on either catalog's names.

FDS publishes how keys are built and the code lists they draw on. It does not publish keys for any catalog's records, because FDS is a standard and not a catalog. For muscles and muscle categories, the code list is the anatomy itself. Each owner writes the keys for its own records.

## What keys make possible

- **Matching across catalogs.** You compare keys instead of names. Comparing two keys tells you they are the same, that one is more specific than the other, that they overlap (neither is more specific, and nothing contradicts), or that they are different. The key pages describe the finer cases.
- **Interoperability.** Two platforms can link their catalogs without first agreeing on names or adopting a shared list.
- **History that survives a move.** When someone changes apps, the new app can look up each logged exercise in its own catalog by key, so their history stays usable.

### Finding related items

Keys that share codes form families, and no relationship has to be declared anywhere. Search for a shared code and you find the whole family:

- **The same motion.** Exercises whose motion is `hip.ext+kn.ext`, the hips and knees extending together, are a family of squats and lunges, whatever each catalog calls them.
- **The same kind of equipment.** Exercises loaded with any `bell.*` code are dumbbell, kettlebell and circus dumbbell work.
- **All strength machines.** Equipment keys with `k:mac` are every strength machine. An exercise key names a strength machine `mac`, so the exercises done on them are found the same way.
- **All parts of one muscle.** `FXM=1.0/biceps-brachii` and the keys that add a part to it, such as `FXM=1.0/biceps-brachii.long`, are the muscle and its heads.
- **The muscles of a category.** `FXMG=1.0/hamstring` holds `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus` and `FXM=1.0/semimembranosus`, and an exercise whose motion is `hip.flex` leads to `FXMG=1.0/a:hip.flex`, the muscles that flex the hip.

Each key page shows how to search its layers.

## What keys don't do

- **A key is not an identifier.** A record's identity is its owner's `id`, as before. Two owners describing the same exercise don't always write the same key: one may record more detail, or read the movement differently. A key finds candidates. It doesn't prove two records are the same.
- **A key says nothing about prescription.** Tempo, load, sets and reps belong to the [prescription primitives](../specifications/rfc-006-prescription-primitives) and to workouts.
- **A key doesn't replace names.** Names, aliases and translations stay in the record. The key sits beside them.

Keys are optional. A record without one is still valid FDS.

## The four keys

| Model     | Field | What it describes                                        | Example                                    |
|-----------|-------|----------------------------------------------------------|--------------------------------------------|
| Exercise  | `fxi` | How the body moves, its position, and what it moves with | `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`, a standing dumbbell curl |
| Equipment | `fxe` | What kind of equipment it is and its form                | `FXE=1.0S/k:imp/f:bar.ez`, an EZ bar        |
| Muscle    | `fxm` | The muscle and, where it has them, its parts             | `FXM=1.0/biceps-brachii.long`, the long head of biceps brachii |
| Muscle category | `fxmg` | A set of muscles, by anatomy, joint action, or a union of these and single muscles or parts | `FXMG=1.0/hamstring`, the hamstrings |

The same fields also appear wherever a record refers to an exercise, a muscle or a piece of equipment by id and name, so references can be matched the same way. A muscle reference carries both: the muscle's `fxm` and its category's `fxmg`.

## Using keys

To link two catalogs, compare the keys of their records and collect the candidates. An identical key is a strong match. Otherwise a person picks the right record from a short list. Keep each confirmed link in your own data, in `attributes` or `extensions`, so nobody has to find it again. You can write keys by hand by following each key's composition pattern, or generate them with the [FDS Encoder](../tools/encoder/index.md).

## Where to go next

- [Exercise key](./structural-keys/exercise-key.md): how `fxi` is built, its dimensions and codes.
- [Equipment key](./structural-keys/equipment-key.md): how `fxe` is built.
- [Muscle key](./structural-keys/muscle-key.md): how `fxm` is built.
- [Muscle category key](./structural-keys/muscle-category-key.md): how `fxmg` is built.
- [FDS Encoder](../tools/encoder/index.md): build, check, compare and match keys for your own records.
