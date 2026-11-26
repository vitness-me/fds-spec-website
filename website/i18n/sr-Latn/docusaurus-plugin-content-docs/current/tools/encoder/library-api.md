---
title: API biblioteke
description: Funkcije koje FDS Encoder izvozi, sa kratkim TypeScript primerima
sidebar_position: 4
---

# API biblioteke

Komandna linija radi nad ovim funkcijama. Uvezite ih iz `@vitness/fds-encoder` kada je paket [instaliran u vaš projekat](./installation.md#use-the-library-in-a-project). Vrednosti u komentarima su ono što svaki poziv vraća.

## Ključevi {#keys}

`checkKey`, `writeKey`, `keyType` i `compareKeys` rade sa sva četiri tipa ključeva.

```typescript
import { checkKey, compareKeys, KeyError, keyType, writeKey } from '@vitness/fds-encoder';

checkKey('FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands');
// { ok: true, type: 'FXI', written: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', issues: [] }

checkKey('FXE=1.0S/k:robot').issues;
// [{ code: 'unknown-kind', message: '"robot" is not an FXE kind.', at: 'k:robot' }]

writeKey('FXMG=1.0/thigh.posterior+hamstring'); // 'FXMG=1.0/hamstring'
keyType('FXM=1.0/deltoid.clavicular');         // 'FXM'

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

| Funkcija | Vraća |
|----------|---------|
| `checkKey(text)` | `{ ok, type, written, issues }`. `written` je standardni zapisani oblik. Svaki problem ima `code`, `message` i, gde je primenljivo, `at` |
| `writeKey(text)` | Zapisani oblik, ili baca `KeyError` koji navodi svaki problem |
| `keyType(text)` | `'FXI'`, `'FXE'`, `'FXM'`, `'FXMG'` ili `undefined` |
| `compareKeys(a, b)` | `{ type, result, specific?, layers?, shared? }`. `result` je `same`, `more-specific`, `overlap` ili `different`. Ključevi vežbi i opreme daju `layers`; ključevi mišića i kategorija daju `shared`. Baca `KeyError` kada ključ ne prolazi proveru ili se tipovi razlikuju |
| `KeyError` | Greška koju bacaju `writeKey` i `compareKeys`. Njeni `issues` navode šta nije u redu |

`parseFxi`, `parseFxe`, `parseFxm` i `parseFxmg` daju raščlanjene slojeve i termine jednog tipa ključa. `standardFxi` i `standardFxe` izostavljaju proširene slojeve i daju standardni deo ključa.

```typescript
import { parseFxi, parseFxm, standardFxe } from '@vitness/fds-encoder';

parseFxi('FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands').layers;
// { m: 'el.flex', o: 'standing', l: 'bell.dumb@hands' }

parseFxm('FXM=1.0S/biceps-brachii.long').key;
// { kind: 'part', muscle: 'biceps-brachii', part: 'long' }

standardFxe('FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc'); // 'FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex'
```

| Funkcija | Vraća |
|----------|---------|
| `parseFxi(text)` | `{ ok, issues, canonical, layers, flag }`. `canonical` je zapisani oblik, a `layers` sadrži vrednost svakog sloja |
| `parseFxe(text)` | `{ ok, issues, canonical, configs, flag }`. `configs` navodi vrstu `k` i slojeve svake konfiguracije; kombinovana sprava ih ima više |
| `parseFxm(text)` | `{ ok, issues, canonical, key }`. `key` je mišić, `{ kind: 'muscle', muscle }`, ili deo, `{ kind: 'part', muscle, part }` |
| `parseFxmg(text)` | `{ ok, issues, canonical, key }`. `key.terms` navodi kategorije i mišiće unije |
| `standardFxi(text)`, `standardFxe(text)` | Standardni deo ključa: zapisani oblik bez proširenih slojeva. Baca izuzetak za ključ koji ne prolazi proveru |
| `formatFxm(key)` | Tekst raščlanjenog ključa mišića: `formatFxm(parseFxm('FXM=1.0/deltoid.acromial').key)` je `'FXM=1.0/deltoid.acromial'` |
| `FXM_PREFIX`, `FXMG_PREFIX` | Zaglavlja kojima počinje svaki ključ mišića i kategorije: `'FXM=1.0/'` i `'FXMG=1.0/'` |

## Vežba i oprema {#exercise-and-equipment}

`crossCheck(fxi, fxe)` proverava ključ vežbe prema ključu njene opreme. Prazna lista znači da se slažu. Kodovi upozorenja su `invalid`, `main-equipment`, `posture`, `load-interface` i `off-design`. [Provera vežbe prema njenoj opremi](../../core-concepts/structural-keys/equipment-key.md#checking-an-exercise-against-its-equipment), na stranici o ključu opreme, kaže kada svaka provera ne prolazi.

```typescript
import { crossCheck, mainEquipment, parseFxi } from '@vitness/fds-encoder';

const squat = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back';

crossCheck(squat, 'FXE=1.0S/k:imp/f:bar.straight'); // []
crossCheck(squat, 'FXE=1.0S/k:imp/f:bell.dumb')[0].code; // 'main-equipment'

mainEquipment(parseFxi(squat).layers ?? {});
// { token: 'bar.straight', fxe: 'FXE=1.0S/k:imp/f:bar.straight' }
```

| Funkcija | Vraća |
|----------|---------|
| `crossCheck(fxi, fxe)` | Listu `{ code, message }`, praznu kada se dva ključa slažu |
| `mainEquipment(layers)` | Glavnu opremu vežbe iz njenih slojeva `l` i `s`: `{ token, fxe }`, kod ključa vežbe koji je imenuje, kada takav postoji, i ključ opreme koji on zamenjuje |

## Mišići i kategorije {#muscles-and-categories}

```typescript
import { fxmgCategoriesOf, fxmgMembers, fxmInFxmg } from '@vitness/fds-encoder';

fxmInFxmg('FXM=1.0/rectus-femoris', 'FXMG=1.0/a:hip.flex');
// { relation: 'in', shared: ['rectus-femoris'] }

fxmgMembers('FXMG=1.0/hamstring');
// ['FXM=1.0/biceps-femoris', 'FXM=1.0/semimembranosus', 'FXM=1.0/semitendinosus']

fxmgCategoriesOf('FXM=1.0/semitendinosus');
// ['FXMG=1.0/a:hip.ext', 'FXMG=1.0/a:kn.flex', 'FXMG=1.0/entire', 'FXMG=1.0/hamstring', 'FXMG=1.0/thigh', 'FXMG=1.0/thigh.posterior']
```

| Funkcija | Vraća |
|----------|---------|
| `fxmInFxmg(fxm, fxmg)` | `{ relation, shared }`. `relation` je `in`, `partly-in` ili `not-in` |
| `fxmgMembers(fxmg)` | Članove kategorije kao ključeve mišića |
| `fxmgCategoriesOf(fxm, index?)` | Svaku kategoriju u kojoj je mišić u celini. Prosledite indeks iz `buildFxmgIndex()` kada je pozivate mnogo puta |
| `buildFxmgIndex()` | Mapu od svakog mišića i dela do svake kategorije koja ga sadrži |
| `expandFxm(fxm)`, `expandFxmg(fxmg)` | Mišiće i delove koje ključ pokriva, bez prefiksa: `expandFxm('FXM=1.0/biceps-brachii')` je `['biceps-brachii.long', 'biceps-brachii.short']` |
| `expandMuscleKey(key)` | Isto, za ključ mišića ili ključ kategorije |
| `fxmTerm(fxm)` | Termin koji ključ mišića imenuje: `{ name, anchors, uberonNote? }`. `anchors` su njegovi FMA i Uberon termini; `uberonNote` kaže šta Uberon ima kada nema termin za tu strukturu |
| `fxmgTerm(fxmg)` | Termin koji imenuje ključ jedne kategorije: `{ name, anchors, members }` |
| `fxmgKeys()` | Svaki ključ kategorije, sortiran: njih 66, počev od `'FXMG=1.0/a:ank.df'` |

Izvezeni su i podaci iza njih: `FXM_MUSCLES` (mišići i njihovi delovi, sa terminima iz anatomskih ontologija), `FXMG_SETS` (imenovani skupovi), `FXMG_ACTIONS` (po jedna kategorija za svaki pokret u zglobu) i `ACTION_PRIME_MOVERS` (glavni pokretači svakog pokreta u zglobu). `FXM_VOCABULARY` i `FXMG_VOCABULARY` su isti podaci indeksirani za pretragu; svaka funkcija za mišiće i kategorije prima jedan od njih kao poslednji, opcioni argument. Anatomske oznake i ID-jevi potiču iz FMA i Uberona pod licencom CC BY: [Izvori i licence](../../core-concepts/structural-keys/muscle-key.md#sources-and-licences) navodi svaki izvor i njegovu licencu.

## Građenje ključeva {#building-keys}

`QUESTIONS` i `FLOW` su tok pitanja koji ispisuje `fds-encoder questions`. `build` pretvara jednu stavku odgovora u ključeve.

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

| Izvoz | Radi |
|--------|------|
| `build(entry)` | Gradi `{ id, fxi, fxe, path }`. `path` navodi postavljena pitanja, redom. Baca `AnswerError` čiji `problems` kažu šta treba ispraviti |
| `AnswerError` | Greška koju `build` baca za odgovore koji nedostaju, nisu validni ili su protivrečni. `entryId` i `problems` kažu o kojoj je stavci reč i šta treba ispraviti |
| `InternalError` | Greška koju `build` baca kada napiše ključ koji njegova sopstvena provera odbija. To je greška u enkoderu, nikada u odgovorima |
| `buildWith(id, provide)` | Gradi iz bilo kog izvora odgovora: `provide(question, reading)` vraća odgovor na svako pitanje na putanji |
| `openOptions(question, reading)` | Opcije pitanja koje važe, s obzirom na dosadašnje odgovore. Obrazac prikazuje samo njih |
| `QUESTIONS`, `QUESTION_BY_ID`, `FLOW`, `FACTS` | Pitanja, po redosledu i po ID-ju, ceo tok kao jedan objekat spreman za JSON, i činjenice koje koriste njegovi uslovi |
| `startAsk(rows, existing?)`, `stepAsk(state, line)` | Sesija `ask` kao čist korakač: svaki poziv vraća sledeće stanje, redove za ispis i da li treba sačuvati |
| `askRows(data)`, `answersText(state)` | Čita datoteku redova, i piše datoteku odgovora za stanje |

```typescript
import { startAsk, stepAsk } from '@vitness/fds-encoder';

const first = startAsk([{ id: 'ex-101', name: 'Dumbbell Curl' }]);
first.state.question; // 'subject'

const next = stepAsk(first.state, '1');
next.state.question; // 'changes'
next.state.answers;  // { subject: 'usual' }
```

## Zapisi {#records}

Ove funkcije čitaju i pišu samo sopstveno polje ključa zapisa i polja ključeva referenci koje on sadrži: `fxi` na referenci na vežbu (`exercise`, `alternatives[]`), `fxe` na referenci na opremu (`equipment`, `equipment.required[]`, `equipment.optional[]`), i `fxm` i `fxmg` na referenci na mišić (`targets.primary[]`, `targets.secondary[]`). Polje sa jednim od tih imena bilo gde drugde nije ključ i nikada se ne čita niti piše, kao ni bilo šta pod `metadata`, `attributes` ili `extensions`. Sve ostalo što platforma čuva o ključu, kao što je ko ga je napisao ili potvrđena veza, pripada `attributes` ili `extensions`.

```typescript
import { checkRecord, matchEntryOf, recordKeys } from '@vitness/fds-encoder';

const record = {
  exerciseId: 'ex-201',
  fxi: 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands',
  canonical: { name: 'Dumbbell Curl' },
  equipment: { required: [{ id: 'eq-1', name: 'Dumbbell', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' }] },
  metadata: { fxi: 'not a key' },
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

| Funkcija | Vraća |
|----------|---------|
| `recordKeys(record)` | Svaki ključ u zapisu, kao `{ path, field, key }`, redosledom u dokumentu. Ime svojstva koje nije obična reč stavlja se pod navodnike u putanji: `["a.b"]` |
| `checkRecord(record)` | `{ problems, warnings, rewritten, record }`. `record` je kopija sa svakim ključem koji prolazi proveru u njegovom zapisanom obliku |
| `matchEntryOf(record)` | Zapis kao stavku za uparivanje, ili `undefined` kada nema sopstveni ključ ili ID. Računaju se samo sopstvena svojstva zapisa |
| `KEY_FIELDS` | Četiri polja ključeva i tip ključa koji svako sadrži |

## Uparivanje {#matching}

`match(entry, library, options?)` predlaže stavke iz biblioteke za jednu stavku. Dajte mu stavke iz biblioteke sa istim tipom ključa.

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

Stavka čiji ključ ne prolazi proveru ne poklapa se ni sa čim po ključu, pa njeni kandidati dolaze samo po imenu. Rezultat tada nosi `warnings`, koja to kažu:

```typescript
match({ id: 'imp-3', key: 'FXI=1.0S/m:el.bend/o:standing/l:bell.dumb@hands', name: 'Dumbbell Curl' }, library, { top: 1 });
// {
//   kind: 'confirm',
//   candidates: [{ id: 'lib-1', via: 'name' }],
//   why: 'the key does not check',
//   warnings: ['The key FXI=1.0S/m:el.bend/o:standing/l:bell.dumb@hands does not check, so it matches by name only: "el.bend" is not a joint action.'],
// }
```

`kind` rezultata je `identical`, `confirm` ili `absent`, kao u [`fds-encoder match`](./cli-reference.md#match). `top` je dužina liste kandidata, podrazumevano 3. `nameSimilarity` ocenjuje dva imena od 0 do 1 i ređa kandidate koji su izjednačeni po ključevima.

## Liste kodova i registri {#code-lists-and-registries}

`codes` sadrži svaku listu kodova iz koje ključevi uzimaju, sa kratkim opisom svakog koda. `buildRegistries()` generiše registre kodova objavljene pod `specification/registries/`, po imenu datoteke.

```typescript
import { buildRegistries, codes } from '@vitness/fds-encoder';

codes.FXE_KINDS.mac;
// 'Strength machine: a guided mechanism with fixed body contacts, built for one movement.'

Object.keys(buildRegistries());
// ['exercise-key.registry.json', 'equipment-key.registry.json', 'body-points.registry.json',
//  'body-positions.registry.json', 'muscle-key.registry.json', 'muscle-category-key.registry.json']
```

## Tipovi {#types}

Paket isporučuje TypeScript tipove svega navedenog:

| Oblast | Tipovi |
|------|-------|
| Ključevi | `CheckedKey`, `KeyComparison`, `KeyResult`, `KeyType`, `Issue`, `LayerRelation` |
| Ključevi vežbi i opreme | `ParsedFxi`, `ParsedFxe`, `FxeConfig`, `MainEquipment` |
| Ključevi mišića i kategorija | `FxmKey`, `ParsedFxm`, `FxmVocabulary`, `FxmgKey`, `FxmgTerm`, `ParsedFxmg`, `FxmInFxmg`, `Anchor`, `FxmMuscle`, `FxmPart`, `FxmgSet`, `FxmgMember`, `FxmgAction` |
| Zapisi i uparivanje | `RecordKey`, `RecordCheck`, `RecordIssue`, `KeyField`, `MatchEntry`, `MatchOptions`, `MatchResult`, `Candidate` |
| Građenje ključeva | `Answer`, `Answers`, `Built`, `Entry`, `Provider`, `Cond`, `FactId`, `FlowOption`, `FlowQuestion`, `AskRow`, `AskState`, `AskStep` |
| Registri | `Registry` |

## Pogledajte i {#see-also}

- [CLI referenca](./cli-reference.md): iste operacije iz komandne linije.
- [Primeri](./examples.md): celoviti prikazi od početka do kraja.
