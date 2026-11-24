# @vitness/fds-encoder

Encode exercises and equipment as the FDS structural descriptors, and compare and match them:

- **FXI** describes an exercise: its motion, body position, support, load, sides, grip, range, held posture and line of pull. `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back`
- **FXE** describes a piece of equipment by its structure. `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back`
- **FXM** names a muscle, a part of one, or a group. `FXM=1.0/deltoid.acromial`

FXI is a descriptor, not an identity. The same answers always build the same string, and the same two strings always compare the same way. Two catalogues that describe the same exercise in different words can still write the same string; when they do not, the match protocol offers a short list for a person to confirm.

> **Draft.** The descriptors are a draft of the Fitness Data Standard, not yet adopted by an RFC. Codes, questions and field names may change. This package implements the rules revision of the descriptor registries it was built from: `fds-encoder questions` prints it.

The specification: [overview](https://spec.vitness.me/docs/descriptors/overview), [FXI](https://spec.vitness.me/docs/descriptors/fxi), [FXE](https://spec.vitness.me/docs/descriptors/fxe), [FXM](https://spec.vitness.me/docs/descriptors/fxm), [the question flow](https://spec.vitness.me/docs/descriptors/question-flow), and [compare, match and versioning](https://spec.vitness.me/docs/descriptors/compare-and-match).

## Install

```bash
npm install -g @vitness/fds-encoder
```

## Commands

| Command | Does |
|---|---|
| `ask <rows> --out <answers>` | Asks the question flow for each row in the terminal and saves the answers records. Rerunning continues at the first row without an answer. |
| `build <answers>` | Builds the FXI and FXE of each answers record. Each output record keeps the answers it was built from, and the rules revision. |
| `validate <strings…>` / `validate --rows <file>` | Validates FXI, FXE and FXM strings and prints their canonical forms, or checks a rows file. |
| `compare <a> <b>` | Compares two FXIs or two FXEs: `identical`, `refines`, `refined-by`, `compatible`, `contradicting` or `invalid`, with the relation of each layer. |
| `match <rows> --library <file>` | Matches each row against a library by the match protocol (below). |
| `review <answers> --library <file>` | The collision check: an entry whose FXI equals another's must be confirmed the same, answered apart, or marked as a vocabulary gap. |
| `upgrade <records>` | Rebuilds every string from its stored answers under the rules this encoder implements, and reports every string that changes. |
| `questions` | Prints the question flow: every question, when it is asked, and the code each answer writes. |

`ask`, `build`, `review`, `upgrade` and `questions` take `--words <file or URL>`, a movement-word dataset (below). `ask`, `build` and `review` take `--mode owner` (the default) or `--mode import`.

### Modes and provenance

In **owner** mode, the owner of the exercise answers: the record's `fxiProvenance` is `owner`, or `owner-assisted`/`agent` when the answers record says so. In **import** mode, someone reads another catalogue's row. Import mode is **candidate search only**: its strings carry `fxiProvenance: import`, never link without a person, and no accuracy is claimed for them.

### Match

A row is linked automatically only when exactly one library entry is `identical` to it, both sides have `owner` or `owner-assisted` provenance, and neither carries a gap marker. Otherwise `match` returns a ranked list to confirm, with the reason it did not link: first the entries whose FXI is identical, refines, is refined by or is compatible with the query; then the entries that differ in exactly one standard layer; then the rest by name. A match is `absent` only when the library is empty.

```bash
fds-encoder match queries.json --library library.json
```

Each row is `{id, fxi, fxiProvenance?, fxiGap?, name?, fxe?}`; the output is `{id, use?, match}` per row, where `use` is `candidate search only` for an import row.

### Build and upgrade

`build` reads answers records and writes one record per entry:

```json
{
  "id": "barbell-back-squat",
  "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back",
  "fxe": "FXE=1.0S/k:imp/f:bar.straight",
  "fxiProvenance": "owner",
  "fxiGap": null,
  "mode": "owner",
  "rules": "<the rules revision it was built under>",
  "record": { "id": "barbell-back-squat", "answers": { "subject": "usual", "movement": "other", "...": "..." } }
}
```

Keep `record` beside the strings. When a later rules revision refines a reading, `upgrade` rebuilds each string from it instead of asking anyone again, and reports each one that changes. `--check` exits 1 when any would; `--write` saves the rebuilt records. A record with no answers stays valid as written.

## Movement words

A movement word ("squat", "row") fixes the usual reading of every layer at once, so an owner picks the word and answers only what differs. Movement words are catalogue data, not part of the standard: this package ships none. Without a dataset, every exercise is still encoded by answering `other` for the movement and describing it joint by joint.

A dataset is a JSON file, read from a path or an `http(s)` URL with `--words`:

```json
{
  "name": "my-movement-words",
  "version": "1",
  "words": [
    { "id": "squat", "label": "Squat", "group": "Legs", "fxi": "m:hip.ext+kn.ext/o:standing", "hold": { "bb": "back" } },
    {
      "id": "calf-stretch", "label": "Calf stretch", "group": "Stretches", "fxi": "m:%ank.df+kn.ext/o:standing/l:bw/x:u",
      "asks": { "word.knee": { "usual": "straight", "options": { "straight": "m:%ank.df+kn.ext", "bent": "m:%ank.df+kn.flex" } } }
    }
  ],
  "questions": {
    "word.knee": { "text": "Is the knee of the stretched leg straight or bent?", "help": "", "labels": { "straight": "Straight", "bent": "Bent" } }
  }
}
```

| Field | Holds |
|---|---|
| `name`, `version` | Name the dataset. An answers record whose movement is one of its words cites both, and `upgrade` asks for the same dataset. |
| `words[].id` | Lowercase kebab-case, unique, and not `other`, `unknown` or `usual`. It is the answer to the `movement` question. |
| `words[].label`, `group`, `note` | What `ask` shows. |
| `words[].fxi` | The FXI layers the word fixes, as `layer:value` joined by `/`. They must parse as an FXI. |
| `words[].hold` | The usual hold point by implement token; `*` covers every other token. |
| `words[].holdBehind` | The hold point of a bar when the load passes behind the head. |
| `words[].mac` | The machine built for the movement: guided motion `m`, load interface `l`, and `chest: true` when it has a chest pad. |
| `words[].erg` | The cardio machine type the word names. |
| `words[].gBar` | `true` when the word's grip width holds only with a two-hand bar. |
| `words[].asks` | The word's own closed questions: each option's patch (`layer:value` joined by `/`; `layer:-` removes a layer) must leave the word a valid FXI. `usual` is the option meant when nothing else is said. |
| `questions` | Each word question: an id starting `word.`, its `text`, `help`, and `labels` by option id. |

A dataset that breaks any of these is refused with every fault listed.

## Muscles

FDS publishes no muscle list. `validate` checks an FXM's format alone; give a provider's vocabulary with `--muscles <file>` (`{muscles: [{token, name, anchors, parts?}], groups: [{token, name, members, anchors}]}`) to check that each muscle, part and group exists.

## Library

```ts
import { build, compare, createFlow, match, parseFxi, readWordSet } from '@vitness/fds-encoder';

const flow = createFlow(readWordSet(words));
const { fxi, fxe } = build({ id: 'back-squat', answers }, flow);
compare(fxi!, 'FXI=1.0S/m:hip.ext+kn.ext/o:*/l:bb@back').relation; // 'refines'
```

## License

MIT
