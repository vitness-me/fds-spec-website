---
title: CLI Reference
description: Every FDS Encoder command and flag, with real input and output
sidebar_position: 3
---

# CLI Reference

Every command and flag of the `fds-encoder` command. The outputs on this page are what the command prints. Quote each key in single quotes: `*` and `?` mean something to your shell.

## Synopsis

```bash
fds-encoder <command> [arguments] [flags]
```

```text
fds-encoder 0.1.0: structural keys of the Fitness Data Standard

  fds-encoder check <key>...                     check keys and print each in its written form
  fds-encoder check --records <file.json> [--write <out.json>]
                                                 check every key in FDS records; --write saves them in written form
  fds-encoder compare <a> <b>                    compare two keys, or place a muscle key in a category key
  fds-encoder build <answers.json>               build keys from answers: [{ "id", "answers": { question: option } }]
  fds-encoder ask [rows.json] [--out <answers.json>]
                                                 answer the questions in the terminal and build the keys
  fds-encoder questions [--json | --text]        print the question flow
  fds-encoder match <records.json> --library <records.json> [--top <n>]
                                                 suggest library records for each record, by key
  fds-encoder --version | --help
```

Running without a command prints this text and exits with 1. `--help`, `-h` and `help` print it and exit with 0.

## Commands

### `check`

Checks each key and prints it in its standard written form.

```bash
fds-encoder check <key>...
```

A key that checks prints `ok` and its written form. A key that doesn't prints `bad`, the key as given and each reason on its own line. The written form puts layers in the standard order, drops a layer at its default and sorts codes where the order carries no meaning.

```bash
fds-encoder check 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands' 'FXMG=1.0/thigh.posterior+hamstring' 'FXE=1.0S/k:robot'
```

```text
ok   FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands
ok   FXMG=1.0/hamstring
bad  FXE=1.0S/k:robot
     "robot" is not an FXE kind.
```

The second key is written shorter: `thigh.posterior` and `hamstring` hold the same three muscles, and of two terms that cover the same muscles the one that sorts first stays. The command exits with 1 because one key doesn't check.

### `check --records`

Checks every key field in one FDS record or a list of them.

```bash
fds-encoder check --records <file.json> [--write <out.json>]
```

| Flag | Description |
|------|-------------|
| `--records <file.json>` | A file holding one FDS record, or a list of records |
| `--write <out.json>` | Saves the records with every key that checks in its written form. Only those key strings change: numbers, spacing and every other value stay exactly as the input file wrote them. The file is written whole, through a temporary file renamed into place |

The command reads each record's own key field, and the key fields of the references it holds: `fxi` on an exercise reference, `fxe` on an equipment reference such as `equipment.required[0].fxe`, and `fxm` and `fxmg` on a muscle reference such as `targets.primary[0].fxm`. A field with one of those names anywhere else, under `metadata`, `attributes` or `extensions` among them, isn't a key and is left as it is. For each record it reports:

- **written form**: a key that checks but isn't in its written form, with the written form below it.
- **warning**: two keys that check but disagree. An exercise key is checked against the key of its main equipment among `equipment.required`. A muscle reference's `fxm` is checked to be in its `fxmg`.
- **problem**: a key that doesn't check, or a field that holds the wrong type of key.

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

The command exits with 1 when a record has a problem. Warnings alone don't change the exit code. [Example 2](./examples.md#example-2-check-a-catalog-files-keys) shows the file behind this output.

### `compare`

Compares two keys of one type, or places a muscle key in a category key.

```bash
fds-encoder compare <a> <b>
```

Two keys of one type give one of four results:

| Result | Meaning |
|--------|---------|
| `same` | Same written form, with nothing left at `?` |
| `more-specific` | One describes part of what the other does, and nothing outside it. The output says which, `A` or `B` |
| `overlap` | Neither is more specific, and they may describe the same thing |
| `different` | They can't describe the same thing |

Exercise and equipment keys print each layer's relation, read as "A is … than B": `equal`, `narrower`, `broader`, `open` (both leave it at `?`) or `contradicts`.

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands'
```

```text
more-specific: A is more specific  {"m":"equal","o":"narrower","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

Muscle and category keys print the muscles and parts both cover:

```bash
fds-encoder compare 'FXMG=1.0/erector-spinae+quadratus-lumborum' 'FXMG=1.0/erector-spinae'
```

```text
more-specific: B is more specific  {"shared":["iliocostalis","longissimus","spinalis"]}
```

A muscle key and a category key, in either order, give `in`, `partly-in` or `not-in`:

```bash
fds-encoder compare 'FXM=1.0/trapezius' 'FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse'
```

```text
partly-in  {"shared":["trapezius.ascending","trapezius.transverse"]}
```

Two keys of different types, or a key that doesn't check, print the reason and exit with 1:

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:none' 'FXE=1.0S/k:none'
```

```text
A FXI key and a FXE key do not compare.
```

### `questions`

Prints the question flow that builds exercise and equipment keys.

```bash
fds-encoder questions [--json | --text]
```

| Flag | Description |
|------|-------------|
| `--text` | Only the questions as text |
| `--json` | Only the flow as JSON, for a program or a form of your own |

Without a flag the command prints the text, then a `──────── JSON ────────` line, then the JSON. Each question has an id, the layer it fills, the condition it's asked under, a help text, its usual answer and its options. The text output begins:

```bash
fds-encoder questions --text
```

```text
Questions for FXI=1.0 / FXE=1.0. 201 questions; each is asked only when its condition holds.

1. [subject] Are you describing an exercise, or a piece of equipment on its own?
   fills: FXI or FXE; pick one
   help: An exercise gets an exercise key and the equipment key of its main equipment. Equipment on its own gets its equipment key.
   usual: An exercise.
     - usual: An exercise (the usual case)
     - equipment: A piece of equipment on its own
```

The answers in an answers file are question ids and option ids from this flow.

### `ask`

Asks the questions in the terminal, one row at a time, and prints the keys.

```bash
fds-encoder ask [rows.json] [--out <answers.json>]
```

| Argument or flag | Description |
|------------------|-------------|
| `rows.json` | The records to key. Without it, `ask` keys one record called `key-1` |
| `--out <answers.json>` | Saves the answers after each row. A rerun with the same file continues at the first row without an answer. Each save writes the whole file through a temporary file, so an interrupted save never leaves part of one |

A rows file is a list of rows. Each row has an `id` and a `name`, and may have `alsoCalled`, `text` and `media` (one link or a list of links). The command shows them above the questions. [Example 1](./examples.md#example-1-key-an-exercise) has a rows file.

At a question:

| Type | Does |
|------|------|
| A number or an option id | Answers. A question that takes several options takes them separated by spaces or commas |
| `?` | Shows the question's help, its usual answer and the layer it fills |
| `b` | Goes back one question |
| `s` | Skips this row |
| `q` | Saves and stops. The row in progress is asked again next time |
| Enter | Shows the question again |

When a row is complete, `ask` prints its answers and keys. Enter keeps the row and moves on, `r` redoes it, `b` goes back one question and `q` stops without keeping it. [Example 1](./examples.md#example-1-key-an-exercise) shows a whole session.

When the input ends before the session does, as when answers are piped from a file that runs out, `ask` says the row in progress was not saved and exits with 1:

```text
The input ended before row key-1 was finished: its answers were not saved. The rows finished before it are in answers.json.
```

### `build`

Builds the keys of each entry in an answers file.

```bash
fds-encoder build <answers.json>
```

An answers file is a list of entries, `{ "id", "answers": { "<question id>": "<option id>" } }`. A question that takes several options takes a list. `ask --out` writes this format.

```json title="answers.json" fds:ignore an answers file for the Encoder's questions, not an FDS document
[
  {
    "id": "ex-102",
    "answers": {
      "subject": "usual",
      "changes": ["usual"],
      "motion.phases": "1",
      "p1.kind": "usual",
      "p1.joints": ["hip", "kn"],
      "p1.hip": ["ext"],
      "p1.kn": ["ext"],
      "p1.short": ["usual"],
      "p1.also": "usual",
      "orientation": "standing",
      "load": "implement",
      "imp1": "bar.straight",
      "hold1": "back",
      "symmetry": "usual"
    }
  },
  {
    "id": "eq-7",
    "answers": { "subject": "equipment", "eq.kind": "imp", "eq.form.imp": "bar.ez", "eq.details": "usual" }
  }
]
```

```bash
fds-encoder build answers.json
```

```text
[
  {
    "id": "ex-102",
    "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back",
    "fxe": "FXE=1.0S/k:imp/f:bar.straight"
  },
  {
    "id": "eq-7",
    "fxi": null,
    "fxe": "FXE=1.0S/k:imp/f:bar.ez"
  }
]
```

For an exercise, `fxe` is the key of its main equipment. For equipment on its own, `fxi` is `null` and `fxe` is its whole key.

The keys go to standard output, as one JSON list of the entries that build. An entry whose answers are missing, invalid or contradictory is left out of that list: its id and what to fix go to standard error, and the command exits with 1. An entry that answers only `subject` prints this on standard error:

```text
ex-103:
  changes: no answer. Which of these does the exercise state, beyond its motion, body position, load and sides?
  motion.phases: no answer. How many separate movements does one rep have?
  orientation: no answer. What is the body position at the start of the rep?
  load: no answer. What loads the working muscles?
  symmetry: no answer. How do the two sides work?
```

### `match`

Suggests library records for each record, by key.

```bash
fds-encoder match <records.json> --library <records.json> [--top <n>]
```

| Argument or flag | Description | Default |
|------------------|-------------|---------|
| `<records.json>` | The records to match: one FDS record or a list | Required |
| `--library <records.json>` | The records to match them against | Required |
| `--top <n>` | How many candidates to list for each record | `3` |

Each record is read by its own key (`fxi`, `fxe`, `fxm` or `fxmg`, the first present), its id (`exerciseId` or `id`) and its name (`canonical.name`, else `name`). An exercise also brings the key of its main required equipment. A record with no key or no id is reported on standard error and skipped. A record whose key doesn't check is reported on standard error too, and matched by name only; its result carries `warnings`, which say so. A record is matched only against library records with the same type of key.

```bash
fds-encoder match imports.json --library library.json --top 1
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
        }
      ],
      "why": "no library entry has the same key"
    }
  }
]
```

`kind` is one of:

| Kind | Meaning |
|------|---------|
| `identical` | Exactly one library record has the same key, and the same equipment key when both carry one. `id` names it |
| `confirm` | A person picks from the candidates. `why` says why none is identical |
| `absent` | The library holds no record with this type of key |

Each candidate says how it entered the list:

| `via` | Meaning |
|-------|---------|
| `key` | Its key is the same, more specific, less specific, or overlaps. `result` and `specific` are as in `compare`, with the record as A and the candidate as B |
| `near` | An exercise whose key differs in one standard layer. `layer` names it |
| `name` | The rest, by name similarity |

[Example 4](./examples.md#example-4-match-imported-records-against-a-library) shows the files behind this output.

### `--version`

```bash
fds-encoder --version
```

```text
0.1.0
```

`-v` does the same.

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | A key, record or answer doesn't check, two keys don't compare, a file can't be read or written or isn't JSON, the input ends before `ask` finishes, or the command fails for any other reason. Each error is one line on standard error |
| `2` | A usage error: a missing argument, an unknown command or a bad flag value |

When the reader of standard output closes it early, as `fds-encoder questions | head` does, the command stops quietly with 0.

Results go to standard output: the written keys and record reports of `check`, the result of `compare`, the JSON of `build`, `questions` and `match`, and the session of `ask`. Errors, usage messages and the problems of entries that don't build go to standard error, with the warnings of `match`.

## See also

- [Examples](./examples.md): end-to-end walkthroughs.
- [Library API](./library-api.md): the same operations from TypeScript.
- [Structural Keys](../../core-concepts/structural-keys.md): how each key is built.
