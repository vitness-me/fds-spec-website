---
title: Library API
description: The functions the FDS Encoder exports, with short TypeScript examples
sidebar_position: 4
---

# Library API

The command line runs on these functions. Import them from `@vitness/fds-encoder` once the package is [installed in your project](./installation.md#use-the-library-in-a-project). The values in the comments are what each call returns.

## Keys

`checkKey`, `writeKey`, `keyType` and `compareKeys` work on all four key types.

```typescript
import { checkKey, compareKeys, KeyError, keyType, writeKey } from '@vitness/fds-encoder';

checkKey('FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands');
// { ok: true, type: 'FXI', written: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', issues: [] }

checkKey('FXE=1.0S/k:robot').issues;
// [{ code: 'unknown-kind', message: '"robot" is not an FXE kind.', at: 'k:robot' }]

writeKey('FXMG=1.0/thigh.posterior+hamstring'); // 'FXMG=1.0/hamstring'
keyType('FXM=1.0/deltoid.anterior');           // 'FXM'

try {
  writeKey('FXE=1.0S/k:robot');
} catch (err) {
  if (err instanceof KeyError) console.log(err.issues[0].code); // 'unknown-kind'
}

compareKeys('FXM=1.0/biceps-brachii.long', 'FXM=1.0/biceps-brachii');
// { type: 'FXM', result: 'more-specific', specific: 'a', shared: ['biceps-brachii.long'] }

compareKeys('FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands').layers?.o;
// 'narrower'
```

| Function | Returns |
|----------|---------|
| `checkKey(text)` | `{ ok, type, written, issues }`. `written` is the standard written form. Each issue has a `code`, a `message` and, where it applies, `at` |
| `writeKey(text)` | The written form, or throws a `KeyError` that lists every issue |
| `keyType(text)` | `'FXI'`, `'FXE'`, `'FXM'`, `'FXMG'`, or `undefined` |
| `compareKeys(a, b)` | `{ type, result, specific?, layers?, shared? }`. `result` is `same`, `more-specific`, `overlap` or `different`. Exercise and equipment keys give `layers`; muscle and category keys give `shared`. Throws a `KeyError` when a key doesn't check or the types differ |

`parseFxi`, `parseFxe`, `parseFxm` and `parseFxmg` give the parsed layers and terms of one key type. `standardFxi` and `standardFxe` drop the extended layers and give the standard part of a key.

```typescript
import { parseFxi, standardFxe } from '@vitness/fds-encoder';

parseFxi('FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands').layers;
// { m: 'el.flex', o: 'standing', l: 'bell.dumb@hands' }

standardFxe('FXE=1.0S/k:imp/f:bar.ez'); // 'FXE=1.0S/k:imp/f:bar.ez'
```

## Exercise and equipment

`crossCheck(fxi, fxe)` checks an exercise key against the key of its equipment. An empty list means they agree. The warning codes are `invalid`, `main-equipment`, `feet-implied`, `posture`, `load-interface` and `off-design`. [Checking an exercise against its equipment](../../core-concepts/structural-keys/equipment-key.md#checking-an-exercise-against-its-equipment), on the equipment key page, says when each check fails.

```typescript
import { crossCheck, mainEquipment, parseFxi } from '@vitness/fds-encoder';

const squat = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back';

crossCheck(squat, 'FXE=1.0S/k:imp/f:bar.straight'); // []
crossCheck(squat, 'FXE=1.0S/k:imp/f:bell.dumb')[0].code; // 'main-equipment'

mainEquipment(parseFxi(squat).layers ?? {});
// { token: 'bar.straight', fxe: 'FXE=1.0S/k:imp/f:bar.straight' }
```

## Muscles and categories

```typescript
import { fxmgCategoriesOf, fxmgMembers, fxmInFxmg } from '@vitness/fds-encoder';

fxmInFxmg('FXM=1.0/rectus-femoris', 'FXMG=1.0/a:hip.flex');
// { relation: 'in', shared: ['rectus-femoris'] }

fxmgMembers('FXMG=1.0/hamstring');
// ['FXM=1.0/biceps-femoris', 'FXM=1.0/semimembranosus', 'FXM=1.0/semitendinosus']

fxmgCategoriesOf('FXM=1.0/semitendinosus');
// ['FXMG=1.0/a:hip.ext', 'FXMG=1.0/a:kn.flex', 'FXMG=1.0/entire', 'FXMG=1.0/hamstring', 'FXMG=1.0/thigh', 'FXMG=1.0/thigh.posterior']
```

| Function | Returns |
|----------|---------|
| `fxmInFxmg(fxm, fxmg)` | `{ relation, shared }`. `relation` is `in`, `partly-in` or `not-in` |
| `fxmgMembers(fxmg)` | A category's members as muscle keys |
| `fxmgCategoriesOf(fxm, index?)` | Every category the muscle is wholly in. Pass an index from `buildFxmgIndex()` when you call it many times |
| `buildFxmgIndex()` | A map from each muscle and part to every category that holds it |
| `expandFxm(fxm)`, `expandFxmg(fxmg)` | The muscles and parts a key covers, without the prefix: `expandFxm('FXM=1.0/biceps-brachii')` is `['biceps-brachii.long', 'biceps-brachii.short']` |

The data behind them is exported too: `FXM_MUSCLES` (the muscles and their parts, with their anatomy ontology terms), `FXMG_SETS` (the named sets), `FXMG_ACTIONS` (one category for each joint action) and `ACTION_PRIME_MOVERS` (each joint action's prime movers).

## Building keys

`QUESTIONS` and `FLOW` are the question flow that `fds-encoder questions` prints. `build` turns one entry of answers into keys.

```typescript
import { AnswerError, build, QUESTIONS } from '@vitness/fds-encoder';

QUESTIONS.length; // 201
QUESTIONS[0].id;  // 'subject'

build({ id: 'eq-7', answers: { subject: 'equipment', 'eq.kind': 'imp', 'eq.form.imp': 'bar.ez', 'eq.details': 'usual' } });
// { id: 'eq-7', fxi: null, fxe: 'FXE=1.0S/k:imp/f:bar.ez', path: ['subject', 'eq.kind', 'eq.form.imp', 'eq.details'] }

try {
  build({ id: 'ex-103', answers: { subject: 'usual' } });
} catch (err) {
  if (err instanceof AnswerError) console.log(err.problems[0]);
  // 'changes: no answer. Which of these does the exercise state, beyond its motion, body position, load and sides?'
}
```

| Export | Does |
|--------|------|
| `build(entry)` | Builds `{ id, fxi, fxe, path }`. `path` lists the questions asked, in order. Throws an `AnswerError` whose `problems` say what to fix |
| `buildWith(id, provide)` | Builds from any answer source: `provide(question, reading)` returns the answer to each question on the path |
| `openOptions(question, reading)` | The options of a question that apply, given the answers so far. A form shows only these |
| `QUESTIONS`, `QUESTION_BY_ID`, `FLOW`, `FACTS` | The questions, by order and by id, the whole flow as one JSON-ready object, and the facts its conditions use |
| `startAsk(rows, existing?)`, `stepAsk(state, line)` | The `ask` session as a pure stepper: each call returns the next state, the lines to print and whether to save |
| `askRows(data)`, `answersText(state)` | Read a rows file, and write the answers file for a state |

```typescript
import { startAsk, stepAsk } from '@vitness/fds-encoder';

const first = startAsk([{ id: 'ex-101', name: 'Dumbbell Curl' }]);
first.state.question; // 'subject'

const next = stepAsk(first.state, '1');
next.state.question; // 'changes'
next.state.answers;  // { subject: 'usual' }
```

## Records

These read and write only the key fields `fxi`, `fxe`, `fxm` and `fxmg`, on a record and on its references. Anything else a platform keeps about a key, such as who wrote it or a confirmed link, belongs in `attributes` or `extensions`.

```typescript
import { checkRecord, matchEntryOf, recordKeys } from '@vitness/fds-encoder';

const record = {
  exerciseId: 'ex-201',
  fxi: 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands',
  canonical: { name: 'Dumbbell Curl' },
  equipment: { required: [{ id: 'eq-1', name: 'Dumbbell', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' }] },
};

recordKeys(record).map((k) => k.path); // ['fxi', 'equipment.required[0].fxe']

const checked = checkRecord(record);
checked.problems;  // []
checked.warnings;  // []
checked.rewritten;
// [{ path: 'fxi', from: 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands', to: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' }]

matchEntryOf(record);
// { id: 'ex-201', key: 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands', name: 'Dumbbell Curl', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' }
```

| Function | Returns |
|----------|---------|
| `recordKeys(record)` | Every key in the record, as `{ path, field, key }`, in document order |
| `checkRecord(record)` | `{ problems, warnings, rewritten, record }`. `record` is a copy with every key that checks in its written form |
| `matchEntryOf(record)` | The record as a match entry, or `undefined` when it has no key of its own or no id |
| `KEY_FIELDS` | The four key fields and the key type each holds |

## Matching

`match(entry, library, options?)` suggests library entries for one entry. Give it library entries with the same type of key.

```typescript
import { match, nameSimilarity } from '@vitness/fds-encoder';

const library = [
  { id: 'lib-1', key: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', name: 'Dumbbell Biceps Curl' },
  { id: 'lib-2', key: 'FXI=1.0S/m:el.flex/o:seated/l:bell.dumb@hands', name: 'Seated Dumbbell Curl' },
];

match({ id: 'imp-2', key: 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands', name: 'Dumbbell Curl' }, library, { top: 2 });
// {
//   kind: 'confirm',
//   candidates: [
//     { id: 'lib-1', via: 'key', result: 'more-specific', specific: 'b' },
//     { id: 'lib-2', via: 'key', result: 'more-specific', specific: 'b' },
//   ],
//   why: 'no library entry has the same key',
// }

nameSimilarity('Dumbbell Curl', 'Dumbbell Biceps Curl'); // 0.8
```

The result's `kind` is `identical`, `confirm` or `absent`, as in [`fds-encoder match`](./cli-reference.md#match). `top` is the length of the candidate list, 3 by default. `nameSimilarity` scores two names from 0 to 1 and orders candidates that tie on their keys.

## Code lists and registries

`codes` holds every code list the keys draw on, with a short description of each code. `buildRegistries()` generates the code registries published under `specification/registries/`, by file name.

```typescript
import { buildRegistries, codes } from '@vitness/fds-encoder';

codes.FXE_KINDS.mac;
// 'Dedicated machine: a guided mechanism with fixed body interfaces, built for one movement.'

Object.keys(buildRegistries());
// ['exercise-key.registry.json', 'equipment-key.registry.json', 'body-points.registry.json',
//  'body-positions.registry.json', 'muscle-key.registry.json', 'muscle-category-key.registry.json']
```

## See also

- [CLI Reference](./cli-reference.md): the same operations from the command line.
- [Examples](./examples.md): end-to-end walkthroughs.
