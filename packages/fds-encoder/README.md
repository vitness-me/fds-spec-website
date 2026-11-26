# @vitness/fds-encoder

Check, write, compare and build the structural keys of the Fitness Data Standard (FDS), and match keyed records across catalogs.

| Key | Field | Describes |
|---|---|---|
| Exercise key | `fxi` | How the body moves, its position, and what it moves with: `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands` |
| Equipment key | `fxe` | What kind of equipment it is and its form: `FXE=1.0S/k:imp/f:bar.ez` |
| Muscle key | `fxm` | One muscle or one part of a muscle: `FXM=1.0/biceps-brachii.long` |
| Muscle category key | `fxmg` | A set of muscles: `FXMG=1.0/hamstring` |

The key pages of the specification say how each key is built. The code lists the encoder checks against are published as registries under `specification/registries/`, generated from this package.

## Command line

```bash
fds-encoder check 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb*2@hands'
# ok   FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands

fds-encoder check --records exercises.json [--write checked.json]
fds-encoder compare 'FXMG=1.0/thigh.medial' 'FXMG=1.0/thigh'
# more-specific: A is more specific  {"shared":[…]}
fds-encoder compare 'FXM=1.0/semitendinosus' 'FXMG=1.0/hamstring'
# in  {"shared":["semitendinosus"]}

fds-encoder questions [--json | --text]
fds-encoder ask [rows.json] [--out answers.json]
fds-encoder build answers.json
fds-encoder match records.json --library library.json [--top 3]
```

| Command | Does |
|---|---|
| `check <key>…` | Checks each key and prints it in its standard written form. Exit 1 when one doesn't check. |
| `check --records <file>` | Checks every key field in one FDS record or a list of them, and cross-checks an exercise against its required equipment and each muscle reference against its category. `--write` saves the records with every key in its written form. |
| `compare <a> <b>` | Compares two keys of one type: `same`, `more-specific`, `overlap` or `different`. A muscle key and a category key give `in`, `partly-in` or `not-in`. |
| `questions` | Prints the question flow that builds a key, as text and as JSON. |
| `ask` | Asks the questions in the terminal, one row at a time, and prints the keys. A rows file is a list of `{ "id", "name", "text"?, "media"? }`; `--out` saves the answers, and a rerun continues at the first row without an answer. |
| `build <answers.json>` | Builds the keys of each entry, `[{ "id", "answers": { "<question id>": "<option id>" } }]`, and prints `[{ "id", "fxi", "fxe" }]`. For equipment on its own `fxi` is `null` and `fxe` is its whole key. |
| `match <records> --library <records>` | For each record, suggests library records of the same key type: an identical key first, then a short ranked list to confirm. |

## Library

```ts
import { checkKey, compareKeys, writeKey, fxmInFxmg, build, match, checkRecord } from '@vitness/fds-encoder';

writeKey('FXMG=1.0/thigh.posterior+hamstring');   // 'FXMG=1.0/hamstring'
compareKeys('FXM=1.0/biceps-brachii.long', 'FXM=1.0/biceps-brachii');
// { type: 'FXM', result: 'more-specific', specific: 'a', shared: ['biceps-brachii.long'] }
fxmInFxmg('FXM=1.0/rectus-femoris', 'FXMG=1.0/a:hip.flex').relation;   // 'in'
```

- **Keys:** `checkKey`, `writeKey`, `keyType` and `compareKeys` for all four types; `parseFxi`, `parseFxe`, `parseFxm` and `parseFxmg` for the parsed layers and terms; `standardFxi` and `standardFxe` for the standard part of a key.
- **Exercise and equipment:** `crossCheck(fxi, fxe)` and `mainEquipment(layers)`.
- **Muscles and categories:** `fxmInFxmg`, `fxmgMembers`, `expandFxm`, `expandFxmg`, `buildFxmgIndex` and `fxmgCategoriesOf` (the categories a muscle is in), with the data in `FXM_MUSCLES`, `FXMG_SETS`, `FXMG_ACTIONS` and `ACTION_PRIME_MOVERS`.
- **Building:** `QUESTIONS` and `FLOW` are the question flow; `build`, `buildWith` and `openOptions` turn answers into keys; `startAsk` and `stepAsk` are the interactive session as a pure stepper.
- **Records:** `recordKeys`, `checkRecord` and `matchEntryOf` read and write only the key fields `fxi`, `fxe`, `fxm` and `fxmg`, on a record and on its references. Anything else a platform keeps about a key, such as who wrote it or a confirmed link, belongs in `attributes` or `extensions`; the encoder doesn't read or write it.
- **Matching:** `match(entry, library)` and `nameSimilarity`.
- **Registries:** `buildRegistries()` generates the published code registries; `codes` holds the code lists.

## Development

```bash
npm ci
npm run typecheck
npm run test:run
npm run build
```

`test/parity.test.ts` runs a large set of keys, comparisons, cross-checks, builds and matches through this package and through the VITNESS reference tool and requires identical results. It imports the reference tool from its path (`FDS_ENCODER_REFERENCE` overrides it) and is skipped where the path doesn't exist.

## Licence

MIT. See [LICENSE](./LICENSE).
