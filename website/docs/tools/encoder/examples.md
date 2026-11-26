---
title: Examples
description: End-to-end walkthroughs with the FDS Encoder
sidebar_position: 5
---

# Examples

These walkthroughs use the `fds-encoder` command from the [installation page](./installation.md). Each output is what the command prints for the files shown.

## Example 1: Key an exercise

Write the records you want to key in a rows file. `name` and `text` are shown above the questions, so the person answering sees what the record is.

```json title="rows.json" fds:ignore an ask rows file, not an FDS document
[
  { "id": "ex-101", "name": "Dumbbell Curl", "text": "Stand holding a dumbbell in each hand and curl them up." },
  { "id": "ex-102", "name": "Back Squat", "text": "Squat with a barbell across the upper back." }
]
```

### Answer the questions

```bash
fds-encoder ask rows.json --out answers.json
```

Each answer follows `>`. This session keys the curl, keeps it, then stops at the squat. The option lists after the first question are left out here.

```text
2 rows, 0 already answered.
Keys: a number or option id answers, ? help, b back one question, s skip this row, q save and stop, Enter shows the question again.

════ Row 1 of 2 · ex-101 ════
Dumbbell Curl

Stand holding a dumbbell in each hand and curl them up.

[subject] Are you describing an exercise, or a piece of equipment on its own?
Pick one.
   1  usual          An exercise (the usual case)
   2  equipment      A piece of equipment on its own
> 1

[changes] Which of these does the exercise state, beyond its motion, body position, load and sides?
Pick one or more, separated by spaces or commas.
> usual

[motion.phases] How many separate movements does one rep have?
Pick one.
> 1

[p1.kind] What kind of movement is phase 1?
Pick one.
> usual

[p1.joints] Which joints move in phase 1?
Pick one or more, separated by spaces or commas.
> el

[p1.el] Phase 1: which way does the elbow move?
Pick one or more, separated by spaces or commas.
> flex

[p1.short] In phase 1, does any joint move through only a short range on purpose?
Pick one or more, separated by spaces or commas.
> usual

[p1.also] In phase 1, does another part of the body do something of a different kind at the same time, or move the opposite way?
Pick one.
> usual

[orientation] What is the body position at the start of the rep?
Pick one.
> standing

[load] What loads the working muscles?
Pick one.
> implement

[imp1] Which implement?
Pick one.
> bell.dumb

[hold1] Where is it held?
Pick one.
> hands

[symmetry] How do the two sides work?
Pick one.
Type 2 to pick "b"; the letter b is a command.
> usual

Answers: subject=usual  changes=usual  motion.phases=1  p1.kind=usual  p1.joints=el  p1.el=flex  p1.short=usual  p1.also=usual  orientation=standing  load=implement  imp1=bell.dumb  hold1=hands  symmetry=usual
  FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands
  FXE=1.0S/k:imp/f:bell.dumb
Enter keeps this row and moves on. r redoes the row, b goes back one question, q stops without keeping this row.
> 
Kept ex-101.

════ Row 2 of 2 · ex-102 ════
Back Squat

Squat with a barbell across the upper back.

[subject] Are you describing an exercise, or a piece of equipment on its own?
Pick one.
> q
Saved. The row in progress is asked again next time.
ex-101: FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands  FXE=1.0S/k:imp/f:bell.dumb
Answers file: answers.json
```

The curl gets an exercise key and the key of its main equipment, the dumbbell. Run the same command again and it starts at the squat:

```text
2 rows, 1 already answered.
```

### Build from the answers file

The answers file is plain JSON, so you can review it, keep it with your data, or write one yourself. `build` turns it into keys again:

```bash
fds-encoder build answers.json
```

```text
[
  {
    "id": "ex-101",
    "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands",
    "fxe": "FXE=1.0S/k:imp/f:bell.dumb"
  }
]
```

Copy `fxi` into the exercise record, and `fxe` into its reference to the dumbbell in `equipment.required`. The [CLI reference](./cli-reference.md#build) shows an answers file written by hand.

## Example 2: Check a catalog file's keys

A catalog file can hold one FDS record or a list of them. This excerpt has only the fields the Encoder reads.

```json title="catalog.json" fds:ignore a catalog excerpt with only the fields the Encoder reads
[
  {
    "exerciseId": "ex-201",
    "fxi": "FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands",
    "canonical": { "name": "Dumbbell Curl" },
    "equipment": { "required": [{ "id": "eq-1", "name": "Dumbbell", "fxe": "FXE=1.0S/k:imp/f:bell.dumb" }] }
  },
  {
    "exerciseId": "ex-202",
    "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back",
    "canonical": { "name": "Back Squat" },
    "equipment": { "required": [{ "id": "eq-1", "name": "Dumbbell", "fxe": "FXE=1.0S/k:imp/f:bell.dumb" }] },
    "targets": {
      "primary": [{ "id": "m-1", "name": "Biceps Femoris", "fxm": "FXM=1.0/biceps-femoris", "fxmg": "FXMG=1.0/quadriceps-femoris" }]
    }
  },
  {
    "exerciseId": "ex-203",
    "fxi": "FXI=1.0S/m:el.flexx/o:standing/l:bell.dumb@hands",
    "canonical": { "name": "Concentration Curl" }
  }
]
```

```bash
fds-encoder check --records catalog.json --write checked.json
```

```text
record 0 fxi: written form
  FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands
  FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands
record 1 equipment.required[0].fxe: warning: The exercise's main equipment ("bar.straight", FXE=1.0S/k:imp/f:bar.straight) contradicts the equipment key.
record 1 targets.primary[0].fxmg: warning: FXM=1.0/biceps-femoris is not in its category FXMG=1.0/quadriceps-femoris.
record 2 fxi: "el.flexx" is not a joint action.
3 records, 1 with problems
```

Read it record by record:

- **Record 0** checks. Its layers are out of order, so `checked.json` holds the written form. That is the only change in the file.
- **Record 1** checks, with two warnings. The squat is loaded with a barbell, but its required equipment is a dumbbell. Its muscle reference puts the biceps femoris in the quadriceps.
- **Record 2** has a problem: `el.flexx` isn't a code. The command exits with 1 until it's fixed.

The examples shipped with the schemas check clean:

```bash
fds-encoder check --records specification/schemas/exercises/v1.2.0/exercise.example.json
```

```text
1 records, 0 with problems
```

## Example 3: Compare two exercises from different catalogs

Catalog A calls an exercise "Standing DB Curl" and keys it `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`. Catalog B calls one "Curl con mancuerna" and doesn't say whether it is done standing or seated, so its key leaves the body position at `?`.

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands'
```

```text
more-specific: A is more specific  {"m":"equal","o":"narrower","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

A is more specific: every layer is equal except the body position, which A narrows. B's exercise may be A's, and a person confirms it.

Catalog B's "Seated Dumbbell Curl" is a different exercise:

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:seated/l:bell.dumb@hands'
```

```text
different  {"m":"equal","o":"contradicts","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

Keys that differ only in how they are written compare as `same`:

```bash
fds-encoder compare 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands'
```

```text
same  {"m":"equal","o":"equal","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

## Example 4: Match imported records against a library

Your library holds five exercises. You import two records from another app.

```json title="library.json" fds:ignore a catalog excerpt with only the fields the Encoder reads
[
  { "exerciseId": "lib-1", "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands", "canonical": { "name": "Dumbbell Biceps Curl" } },
  { "exerciseId": "lib-2", "fxi": "FXI=1.0S/m:el.flex/o:seated/l:bell.dumb@hands", "canonical": { "name": "Seated Dumbbell Curl" } },
  { "exerciseId": "lib-3", "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands/g:ne", "canonical": { "name": "Hammer Curl" } },
  { "exerciseId": "lib-4", "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bar.straight@hands", "canonical": { "name": "Barbell Curl" } },
  { "exerciseId": "lib-5", "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back", "canonical": { "name": "Back Squat" } }
]
```

```json title="imports.json" fds:ignore a catalog excerpt with only the fields the Encoder reads
[
  { "exerciseId": "imp-1", "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands", "canonical": { "name": "DB Curl" } },
  { "exerciseId": "imp-2", "fxi": "FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands", "canonical": { "name": "Dumbbell Curl" } }
]
```

```bash
fds-encoder match imports.json --library library.json
```

```text
[
  {
    "id": "imp-1",
    "key": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands",
    "match": {
      "kind": "identical",
      "id": "lib-1",
      "candidates": [
        {
          "id": "lib-1",
          "via": "key",
          "result": "same"
        },
        {
          "id": "lib-3",
          "via": "near",
          "layer": "g"
        },
        {
          "id": "lib-4",
          "via": "near",
          "layer": "l"
        }
      ]
    }
  },
  {
    "id": "imp-2",
    "key": "FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands",
    "match": {
      "kind": "confirm",
      "candidates": [
        {
          "id": "lib-1",
          "via": "key",
          "result": "more-specific",
          "specific": "b"
        },
        {
          "id": "lib-2",
          "via": "key",
          "result": "more-specific",
          "specific": "b"
        },
        {
          "id": "lib-3",
          "via": "near",
          "layer": "g"
        }
      ],
      "why": "no library entry has the same key"
    }
  }
]
```

- **imp-1** has the same key as `lib-1`, and no other library record does: `identical`. The hammer curl and the barbell curl follow, each differing from it in one layer, the grip `g` and the load `l`.
- **imp-2** leaves the body position open, so both the standing and the seated curl are more specific than it. A person picks one.

The names "DB Curl" and "Dumbbell Biceps Curl" share one word. The keys found the match anyway. Keep each link you confirm in your own data, in `attributes` or `extensions`, so nobody has to find it again.

## Example 5: Find a muscle's categories

From the command line, place a muscle key in a category key:

```bash
fds-encoder compare 'FXM=1.0/rectus-femoris' 'FXMG=1.0/a:hip.flex'
```

```text
in  {"shared":["rectus-femoris"]}
```

```bash
fds-encoder compare 'FXM=1.0/rectus-femoris' 'FXMG=1.0/hamstring'
```

```text
not-in  {"shared":[]}
```

From TypeScript, `fxmgCategoriesOf` lists every category the standard publishes that holds the muscle, and `fxmInFxmg` places it in your catalog's own categories:

```typescript title="categories.ts"
import { buildFxmgIndex, fxmgCategoriesOf, fxmInFxmg } from '@vitness/fds-encoder';

const index = buildFxmgIndex();
console.log(fxmgCategoriesOf('FXM=1.0/rectus-femoris', index));

// Your catalog's own categories, by key.
const categories = [
  { id: 'cat-quads', name: 'Quads', fxmg: 'FXMG=1.0/quadriceps-femoris' },
  { id: 'cat-hams', name: 'Hamstrings', fxmg: 'FXMG=1.0/hamstring' },
  { id: 'cat-hip-flexors', name: 'Hip flexors', fxmg: 'FXMG=1.0/a:hip.flex' },
];

for (const c of categories) {
  console.log(c.name, fxmInFxmg('FXM=1.0/rectus-femoris', c.fxmg).relation);
}
```

Compiled and run with Node.js, it prints:

```text
[
  'FXMG=1.0/a:hip.flex',
  'FXMG=1.0/a:kn.ext',
  'FXMG=1.0/entire',
  'FXMG=1.0/quadriceps-femoris',
  'FXMG=1.0/thigh',
  'FXMG=1.0/thigh.anterior'
]
Quads in
Hamstrings not-in
Hip flexors in
```

The rectus femoris is in the quadriceps and also flexes the hip, so it belongs under both of your categories. `a:hip.flex` and `a:kn.ext` are the action categories: the prime movers of hip flexion and of knee extension.

## See also

- [CLI Reference](./cli-reference.md): every command and flag.
- [Library API](./library-api.md): the exported functions.
- [Structural Keys](../../core-concepts/structural-keys.md): how each key is built.
