---
title: Primeri
description: Celoviti prikazi rada sa alatom FDS Encoder, od početka do kraja
sidebar_position: 5
---

# Primeri

Ovi prikazi koriste komandu `fds-encoder` sa [stranice o instalaciji](./installation.md). Svaki izlaz je ono što komanda ispisuje za prikazane datoteke.

## Primer 1: Ključ za vežbu {#example-1-key-an-exercise}

Upišite zapise za koje želite ključeve u datoteku redova. `name` i `text` prikazuju se iznad pitanja, pa osoba koja odgovara vidi o kom je zapisu reč.

```json title="rows.json" fds:ignore an ask rows file, not an FDS document
[
  { "id": "ex-101", "name": "Dumbbell Curl", "text": "Stand holding a dumbbell in each hand and curl them up." },
  { "id": "ex-102", "name": "Back Squat", "text": "Squat with a barbell across the upper back." }
]
```

### Odgovaranje na pitanja {#answer-the-questions}

```bash
fds-encoder ask rows.json --out answers.json
```

Svaki odgovor sledi posle `>`. Ova sesija gradi ključ za pregib, zadržava ga, pa se zaustavlja kod čučnja. Liste opcija posle prvog pitanja ovde su izostavljene.

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

Pregib dobija ključ vežbe i ključ svoje glavne opreme, bučice. Pokrenite istu komandu ponovo i ona počinje od čučnja:

```text
2 rows, 1 already answered.
```

### Građenje iz datoteke odgovora {#build-from-the-answers-file}

Datoteka odgovora je običan JSON, pa je možete pregledati, čuvati uz svoje podatke ili je sami napisati. `build` je ponovo pretvara u ključeve:

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

Kopirajte `fxi` u zapis vežbe, a `fxe` u njegovu referencu na bučicu u `equipment.required`. [CLI referenca](./cli-reference.md#build) prikazuje ručno napisanu datoteku odgovora.

## Primer 2: Provera ključeva u datoteci kataloga {#example-2-check-a-catalog-files-keys}

Datoteka kataloga može sadržati jedan FDS zapis ili listu zapisa. Ovaj izvod ima samo polja koja enkoder čita.

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

Čitajte izlaz zapis po zapis:

- **Zapis 0** prolazi proveru. Njegovi slojevi nisu u redosledu, pa `checked.json` sadrži zapisani oblik. To je jedina izmena u datoteci.
- **Zapis 1** prolazi proveru, uz dva upozorenja. Čučanj je opterećen šipkom, ali je njegova obavezna oprema bučica. Njegova referenca na mišić smešta biceps femoris u kvadriceps.
- **Zapis 2** ima problem: `el.flexx` nije kod. Komanda izlazi sa 1 dok se to ne ispravi.

Primeri koji se isporučuju uz šeme prolaze proveru bez ijedne primedbe:

```bash
fds-encoder check --records specification/schemas/exercises/v1.2.0/exercise.example.json
```

```text
1 records, 0 with problems
```

## Primer 3: Poređenje dve vežbe iz različitih kataloga {#example-3-compare-two-exercises-from-different-catalogs}

Katalog A zove jednu vežbu „Standing DB Curl“ i daje joj ključ `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`. Katalog B zove jednu „Curl con mancuerna“ i ne kaže da li se izvodi u stojećem stavu ili u sedu, pa njen ključ ostavlja položaj tela na `?`.

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands'
```

```text
more-specific: A is more specific  {"m":"equal","o":"narrower","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

A je specifičniji: svaki sloj je jednak osim položaja tela, koji A sužava. Vežba iz B može biti vežba iz A, a to potvrđuje osoba.

„Seated Dumbbell Curl“ iz kataloga B je druga vežba:

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:seated/l:bell.dumb@hands'
```

```text
different  {"m":"equal","o":"contradicts","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

Ključevi koji imaju isti zapisani oblik porede se kao `same`:

```bash
fds-encoder compare 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands'
```

```text
same  {"m":"equal","o":"equal","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

## Primer 4: Uparivanje uvezenih zapisa sa bibliotekom {#example-4-match-imported-records-against-a-library}

Vaša biblioteka sadrži pet vežbi. Uvozite dva zapisa iz druge aplikacije.

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

- **imp-1** ima isti ključ kao `lib-1`, a nijedan drugi zapis iz biblioteke ga nema: `identical`. Slede čekić pregib i pregib sa šipkom, od kojih se svaki razlikuje od njega u jednom sloju, hvatu `g` odnosno opterećenju `l`.
- **imp-2** ostavlja položaj tela otvorenim, pa su i pregib u stojećem stavu i pregib u sedu specifičniji od njega. Osoba bira jedan.

Imena „DB Curl“ i „Dumbbell Biceps Curl“ dele jednu reč. Ključevi su ipak pronašli poklapanje. Svaku vezu koju potvrdite čuvajte u sopstvenim podacima, u `attributes` ili `extensions`, da niko ne bi morao ponovo da je traži.

## Primer 5: Pronalaženje kategorija mišića {#example-5-find-a-muscles-categories}

Iz komandne linije smestite ključ mišića u ključ kategorije:

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

Iz TypeScript-a, `fxmgCategoriesOf` navodi svaku kategoriju koju standard objavljuje, a koja sadrži taj mišić, dok ga `fxmInFxmg` smešta u sopstvene kategorije vašeg kataloga:

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

Preveden i pokrenut pomoću Node.js-a, ispisuje:

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

Rectus femoris je u kvadricepsu i takođe savija kuk, pa pripada pod obe vaše kategorije. `a:hip.flex` i `a:kn.ext` su kategorije pokreta: glavni pokretači fleksije kuka i ekstenzije kolena.

## Pogledajte i {#see-also}

- [CLI referenca](./cli-reference.md): svaka komanda i opcija.
- [API biblioteke](./library-api.md): izvezene funkcije.
- [Strukturni ključevi](../../core-concepts/structural-keys.md): kako se gradi svaki ključ.
