---
title: CLI referenca
description: Svaka komanda i opcija alata FDS Encoder, sa stvarnim ulazom i izlazom
sidebar_position: 3
---

# CLI referenca

Svaka komanda i opcija komande `fds-encoder`. Izlazi na ovoj stranici su ono što komanda ispisuje. Svaki ključ stavite u jednostruke navodnike: `*` i `?` nešto znače vašem shell-u.

## Sinopsis {#synopsis}

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

Pokretanje bez komande ispisuje ovaj tekst i izlazi sa 1. `--help`, `-h` i `help` ga ispisuju i izlaze sa 0.

## Komande {#commands}

### `check`

Proverava svaki ključ i ispisuje ga u njegovom standardnom zapisanom obliku.

```bash
fds-encoder check <key>...
```

Ključ koji prolazi proveru ispisuje `ok` i svoj zapisani oblik. Ključ koji ne prolazi ispisuje `bad`, ključ onako kako je zadat i svaki razlog u zasebnom redu. Zapisani oblik stavlja slojeve u standardni redosled, izostavlja sloj na podrazumevanoj vrednosti i sortira kodove tamo gde redosled nema značenje.

```bash
fds-encoder check 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands' 'FXMG=1.0/thigh.posterior+hamstring' 'FXE=1.0S/k:robot'
```

```text
ok   FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands
ok   FXMG=1.0/hamstring
bad  FXE=1.0S/k:robot
     "robot" is not an FXE kind.
```

Drugi ključ je zapisan kraće: `thigh.posterior` i `hamstring` sadrže ista tri mišića, a od dva termina koja pokrivaju iste mišiće ostaje onaj koji se sortira prvi. Komanda izlazi sa 1 jer jedan ključ ne prolazi proveru.

### `check --records`

Proverava svako polje ključa u jednom FDS zapisu ili u listi zapisa.

```bash
fds-encoder check --records <file.json> [--write <out.json>]
```

| Opcija | Opis |
|------|-------------|
| `--records <file.json>` | Datoteka koja sadrži jedan FDS zapis ili listu zapisa |
| `--write <out.json>` | Čuva zapise sa svakim ključem koji prolazi proveru u njegovom zapisanom obliku. Menjaju se samo ti stringovi ključeva: brojevi, razmaci i svaka druga vrednost ostaju tačno onakvi kakvi su u ulaznoj datoteci. Datoteka se upisuje cela, preko privremene datoteke koja se preimenuje na svoje mesto |

Komanda čita sopstveno polje ključa svakog zapisa i polja ključeva referenci koje on sadrži: `fxi` na referenci na vežbu, `fxe` na referenci na opremu kao što je `equipment.required[0].fxe`, i `fxm` i `fxmg` na referenci na mišić kao što je `targets.primary[0].fxm`. Polje sa jednim od tih imena bilo gde drugde, između ostalog pod `metadata`, `attributes` ili `extensions`, nije ključ i ostaje kakvo jeste. Za svaki zapis javlja:

- **written form**: ključ koji prolazi proveru, ali nije u svom zapisanom obliku, sa zapisanim oblikom ispod.
- **warning**: dva ključa koja prolaze proveru, ali se ne slažu. Ključ vežbe proverava se prema ključu njene glavne opreme među `equipment.required`. Za `fxm` reference na mišić proverava se da je u njenom `fxmg`.
- **problem**: ključ koji ne prolazi proveru, ili polje koje sadrži pogrešan tip ključa.

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

Komanda izlazi sa 1 kada zapis ima problem. Sama upozorenja ne menjaju izlazni kod. [Primer 2](./examples.md#example-2-check-a-catalog-files-keys) prikazuje datoteku iza ovog izlaza.

### `compare`

Upoređuje dva ključa istog tipa, ili smešta ključ mišića u ključ kategorije.

```bash
fds-encoder compare <a> <b>
```

Dva ključa istog tipa daju jedan od četiri rezultata:

| Rezultat | Značenje |
|--------|---------|
| `same` | Isti zapisani oblik, bez ičega ostavljenog na `?` |
| `more-specific` | Jedan opisuje deo onoga što opisuje drugi, i ništa van toga. Izlaz kaže koji, `A` ili `B` |
| `overlap` | Nijedan nije specifičniji, a mogu opisivati istu stvar |
| `different` | Ne mogu opisivati istu stvar |

Ključevi vežbi i opreme takođe ispisuju odnos za svaki sloj:

- `equal`: A i B kažu isto.
- `narrower`: A kaže više od B.
- `broader`: A kaže manje od B.
- `open`: oba ga ostavljaju na `?`.
- `contradicts`: A i B ne mogu oba da važe.

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands'
```

```text
more-specific: A is more specific  {"m":"equal","o":"narrower","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

Ključevi mišića i kategorija ispisuju mišiće i delove koje oba pokrivaju:

```bash
fds-encoder compare 'FXMG=1.0/erector-spinae+quadratus-lumborum' 'FXMG=1.0/erector-spinae'
```

```text
more-specific: B is more specific  {"shared":["iliocostalis","longissimus","spinalis"]}
```

Ključ mišića i ključ kategorije, bilo kojim redom, daju `in`, `partly-in` ili `not-in`:

```bash
fds-encoder compare 'FXM=1.0/trapezius' 'FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse'
```

```text
partly-in  {"shared":["trapezius.ascending","trapezius.transverse"]}
```

Dva ključa različitih tipova, ili ključ koji ne prolazi proveru, ispisuju razlog i izlaze sa 1:

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:none' 'FXE=1.0S/k:none'
```

```text
A FXI key and a FXE key do not compare.
```

### `questions`

Ispisuje tok pitanja koji gradi ključeve vežbi i opreme.

```bash
fds-encoder questions [--json | --text]
```

| Opcija | Opis |
|------|-------------|
| `--text` | Samo pitanja kao tekst |
| `--json` | Samo tok kao JSON, za program ili sopstveni obrazac |

Bez opcije komanda ispisuje tekst, pa red `──────── JSON ────────`, pa JSON. Svako pitanje ima ID, sloj koji popunjava, uslov pod kojim se postavlja, tekst pomoći, uobičajeni odgovor i opcije. Tekstualni izlaz počinje ovako:

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

Odgovori u datoteci odgovora su ID-jevi pitanja i ID-jevi opcija iz ovog toka.

### `ask`

Postavlja pitanja u terminalu, red po red, i ispisuje ključeve.

```bash
fds-encoder ask [rows.json] [--out <answers.json>]
```

| Argument ili opcija | Opis |
|------------------|-------------|
| `rows.json` | Zapisi za koje se grade ključevi. Bez nje, `ask` gradi ključ za jedan zapis nazvan `key-1` |
| `--out <answers.json>` | Čuva odgovore posle svakog reda. Ponovno pokretanje sa istom datotekom nastavlja od prvog reda bez odgovora. Svako čuvanje upisuje celu datoteku preko privremene datoteke, pa prekinuto čuvanje nikada ne ostavlja njen deo |

Datoteka redova je lista redova. Svaki red ima `id` i `name`, a može imati `alsoCalled`, `text` i `media` (jednu vezu ili listu veza). Komanda ih prikazuje iznad pitanja. [Primer 1](./examples.md#example-1-key-an-exercise) ima datoteku redova.

Kod pitanja:

| Unesite | Radi |
|------|------|
| Broj ili ID opcije | Odgovara. Pitanje koje prima više opcija prima ih razdvojene razmacima ili zarezima |
| `?` | Prikazuje pomoć za pitanje, njegov uobičajeni odgovor i sloj koji popunjava |
| `b` | Vraća se jedno pitanje unazad |
| `s` | Preskače ovaj red |
| `q` | Čuva i zaustavlja. Red u toku postavlja se ponovo sledeći put |
| Enter | Ponovo prikazuje pitanje |

Kada je red završen, `ask` ispisuje njegove odgovore i ključeve. Enter zadržava red i prelazi dalje, `r` ga ponavlja, `b` se vraća jedno pitanje unazad, a `q` zaustavlja bez zadržavanja. [Primer 1](./examples.md#example-1-key-an-exercise) prikazuje celu sesiju.

Kada se ulaz završi pre sesije, kao kada se odgovori prosleđuju iz datoteke koja se istroši, `ask` kaže da red u toku nije sačuvan i izlazi sa 1. Imenuje datoteku odgovora kada je u nju sačuvan neki raniji red:

```text
The input ended before row key-2 was finished: its answers were not saved. The rows finished before it are in answers.json.
```

i to kaže kada se ulaz završio na prvom redu, pre nego što je išta sačuvano:

```text
The input ended before row key-1 was finished: its answers were not saved. Nothing was saved to answers.json.
```

### `build`

Gradi ključeve svake stavke u datoteci odgovora.

```bash
fds-encoder build <answers.json>
```

Datoteka odgovora je lista stavki, `{ "id", "answers": { "<question id>": "<option id>" } }`. Pitanje koje prima više opcija prima listu. `ask --out` upisuje ovaj format.

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

Za vežbu, `fxe` je ključ njene glavne opreme. Za samostalnu opremu, `fxi` je `null`, a `fxe` je njen ceo ključ.

Ključevi idu na standardni izlaz, kao jedna JSON lista stavki koje se izgrade. Stavka čiji odgovori nedostaju, nisu validni ili su protivrečni izostavlja se iz te liste: njen ID i ono što treba ispraviti idu na standardni izlaz za greške, a komanda izlazi sa 1. Stavka koja odgovara samo na `subject` ispisuje ovo na standardni izlaz za greške:

```text
ex-103:
  changes: no answer. Which of these does the exercise state, beyond its motion, body position, load and sides?
  motion.phases: no answer. How many separate movements does one rep have?
  orientation: no answer. What is the body position at the start of the rep?
  load: no answer. What loads the working muscles?
  symmetry: no answer. How do the two sides work?
```

### `match`

Predlaže zapise iz biblioteke za svaki zapis, po ključu.

```bash
fds-encoder match <records.json> --library <records.json> [--top <n>]
```

| Argument ili opcija | Opis | Podrazumevana vrednost |
|------------------|-------------|---------|
| `<records.json>` | Zapisi za uparivanje: jedan FDS zapis ili lista | Obavezno |
| `--library <records.json>` | Zapisi sa kojima se uparuju | Obavezno |
| `--top <n>` | Koliko kandidata navesti za svaki zapis | `3` |

Svaki zapis čita se po sopstvenom ključu (`fxi`, `fxe`, `fxm` ili `fxmg`, prvom koji postoji), svom ID-ju (`exerciseId` ili `id`) i svom imenu (`canonical.name`, inače `name`). Vežba donosi i ključ svoje glavne obavezne opreme. Zapis bez ključa ili bez ID-ja prijavljuje se na standardni izlaz za greške i preskače. Zapis čiji ključ ne prolazi proveru takođe se prijavljuje na standardni izlaz za greške i uparuje samo po imenu; njegov rezultat nosi `warnings`, koja to kažu. Zapis se uparuje samo sa zapisima iz biblioteke koji imaju isti tip ključa.

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

`kind` je jedno od:

| Vrsta | Značenje |
|------|---------|
| `identical` | Tačno jedan zapis iz biblioteke ima isti ključ, i isti ključ opreme kada ga oba nose. `id` ga imenuje |
| `confirm` | Osoba bira među kandidatima. `why` kaže zašto nijedan nije identičan |
| `absent` | Biblioteka nema nijedan zapis sa ovim tipom ključa |

Svaki kandidat kaže kako je ušao na listu:

| `via` | Značenje |
|-------|---------|
| `key` | Njegov ključ je isti, specifičniji, manje specifičan ili se preklapa. `result` i `specific` su kao u `compare`, sa zapisom kao A i kandidatom kao B |
| `near` | Vežba čiji se ključ razlikuje u jednom standardnom sloju. `layer` ga imenuje |
| `name` | Ostali, po sličnosti imena |

[Primer 4](./examples.md#example-4-match-imported-records-against-a-library) prikazuje datoteke iza ovog izlaza.

### `--version`

```bash
fds-encoder --version
```

```text
0.1.0
```

`-v` radi isto.

## Izlazni kodovi {#exit-codes}

| Kod | Značenje |
|------|---------|
| `0` | Uspeh |
| `1` | Ključ, zapis ili odgovor ne prolazi proveru, dva ključa se ne mogu uporediti, datoteka ne može da se pročita ili upiše ili nije JSON, ulaz se završava pre nego što `ask` završi, ili komanda ne uspe iz bilo kog drugog razloga. Svaka greška je jedan red na standardnom izlazu za greške |
| `2` | Greška u upotrebi: argument koji nedostaje, nepoznata komanda ili loša vrednost opcije |

Kada čitač standardnog izlaza zatvori izlaz ranije, kao što to radi `fds-encoder questions | head`, komanda se tiho zaustavlja sa 0.

Rezultati idu na standardni izlaz: zapisani ključevi i izveštaji o zapisima komande `check`, rezultat komande `compare`, JSON komandi `build`, `questions` i `match`, i sesija komande `ask`. Greške, poruke o upotrebi i problemi stavki koje se ne izgrade idu na standardni izlaz za greške, zajedno sa upozorenjima komande `match`.

## Pogledajte i {#see-also}

- [Primeri](./examples.md): celoviti prikazi od početka do kraja.
- [API biblioteke](./library-api.md): iste operacije iz TypeScript-a.
- [Strukturni ključevi](../../core-concepts/structural-keys.md): kako se gradi svaki ključ.
