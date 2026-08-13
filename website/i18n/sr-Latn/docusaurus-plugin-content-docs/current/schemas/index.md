---
title: JSON šeme
description: Svaka objavljena FDS šema, u verziji pod kojom je objavljena
sidebar_position: 1
---

# FDS JSON šeme

FDS je definisan u formatu JSON Schema (Draft 2020-12). Svaka šema ispod objavljena je na zamrznutom URL-u: bajtovi na URL-u verzije nikada se ne menjaju, a izmena se isporučuje na novom.

<!-- fds:count schemas=11 entities=7 libraries=1 tooling=1 superseded=2 -->
Objavljeno je 11 šema. Od toga je 7 entiteta, 1 je biblioteka definicija, 1 konfiguriše alat, a 2 su zamenjene verzije koje se i dalje služe.

## Verzije entiteta nisu ujednačene

Izdanje imenuje *skup* verzija entiteta, a ne jednu verziju koju svi dele. Aktuelno izdanje je **1.4.0** i ono objavljuje:

| Entitet | Verzija | URL šeme |
|---|---|---|
| [Vežba](/docs/schemas/exercise) | 1.1.0 | `/schemas/exercises/v1.1.0/exercise.schema.json` |
| [Oprema](/docs/schemas/equipment) | 1.1.0 | `/schemas/equipment/v1.1.0/equipment.schema.json` |
| [Mišić](/docs/schemas/muscle) | 1.0.0 | `/schemas/muscle/v1.0.0/muscle.schema.json` |
| [Kategorija mišića](/docs/schemas/muscle-category) | 1.0.0 | `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json` |
| [Atlas tela](/docs/schemas/body-atlas) | 1.0.0 | `/schemas/atlas/v1.0.0/body-atlas.schema.json` |
| [Trening](/docs/schemas/workout) | 1.1.0 | `/schemas/workout/v1.1.0/workout.schema.json` |
| [Program](/docs/schemas/program) | 1.0.0 | `/schemas/program/v1.0.0/program.schema.json` |

Ne postoji `muscle/v1.4.0/` i neće postojati osim ako se sam muscle ne promeni. URL-ove šema gradite iz verzije entiteta, nikada iz izdanja — pogledajte [krajnju tačku za otkrivanje](/docs/core-concepts/discovery) za to kako provajder oglašava koju verziju entiteta služi.

## Entiteti

### [Šema vežbe](/docs/schemas/exercise) — v1.1.0
Osnovni model podataka vežbe sa klasifikacijom, ciljanim mišićima, opremom, metrikama i medijskim sadržajima.

**Šema:** `/schemas/exercises/v1.1.0/exercise.schema.json`

### [Šema opreme](/docs/schemas/equipment) — v1.1.0
Definicije fitnes opreme sa klasifikacijom, karakteristikama opterećivanja i metapodacima.

**Šema:** `/schemas/equipment/v1.1.0/equipment.schema.json`

### [Šema mišića](/docs/schemas/muscle) — v1.0.0
Definicije anatomskih mišića sa podrškom za vizualizaciju toplotnom mapom.

**Šema:** `/schemas/muscle/v1.0.0/muscle.schema.json`

### [Šema kategorije mišića](/docs/schemas/muscle-category) — v1.0.0
Struktura grupisanja i kategorizacije mišića.

**Šema:** `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`

### [Šema atlasa tela](/docs/schemas/body-atlas) — v1.0.0
Struktura vizualizacije tela sa prikazima i oblastima.

**Šema:** `/schemas/atlas/v1.0.0/body-atlas.schema.json`

### [Šema treninga](/docs/schemas/workout) — v1.1.0
Jedan propisan trening: blokovi stavki, režim izvršavanja po bloku i preskripcija po seriji. 1.1.0 je dodala zone intenziteta po seriji i podešavanja mašina (RFC-007 §6).

**Šema:** `/schemas/workout/v1.1.0/workout.schema.json`

### [Šema programa](/docs/schemas/program) — v1.0.0
Raspored referenci na treninge kroz vreme: ciklusi, nedelje, raspoređivanje dana, progresija i grananje.

**Šema:** `/schemas/program/v1.0.0/program.schema.json`

## Biblioteke definicija

### [Primitivi preskripcije](/docs/schemas/prescription) — v1.0.0
Opterećenje, ponavljanja, tempo, odmor, zone intenziteta, šeme serija i pravila progresije — definicije koje treninzi i programi kombinuju.

**Šema:** `/schemas/prescription/v1.0.0/prescription.schema.json`

Ova šema **nije entitet** i provajder je ne izvozi. Koren njene šeme po konstrukciji ne validira ništa: ne postoji dokument preskripcije koji bi se držao, samo definicije koje druge šeme koriste. Validirate prema definiciji unutar nje — `…/prescription.schema.json#/$defs/loadTarget` — nikada prema korenu. Provajder koji podržava treninge već podržava preskripciju; upravo to znači podržavati treninge.

## Šeme alata

### Mapiranje transformatora — v1.1.0
Konfiguracija za FDS Transformer: kako se izvorna polja mapiraju na FDS entitet. Opisuje ulaz alata, a ne entitet, pa je dokumentovana uz alat. Ne pripada nijednom izdanju — izdanje imenuje entitete i biblioteke koje oni kombinuju, a ovo konfiguriše alat.

**Šema:** `/schemas/transformer/v1.1.0/mapping.schema.json` — pogledajte [konfiguraciju transformatora](/docs/tools/transformer/configuration).

## Zamenjene, i dalje dostupne

<!-- fds:pin workout/v1.0.0/workout.schema.json — listed on purpose: releases 1.2.0 and 1.3.0 declare workout at 1.0.0, so a client pinned to either must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin transformer/v1.0.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.1.0 names, and an editor resolving it must keep getting a document. -->

### Mapiranje transformatora — v1.0.0

**Šema:** `/schemas/transformer/v1.0.0/mapping.schema.json`

Zamenjena mapiranjem 1.1.0, koje je dodalo ključeve za obogaćivanje i evaluaciju koje je transformator prerastao. Svaka 1.0.0 konfiguracija i dalje je validna pod 1.1.0 — dodaci su opcioni. I dalje se služi jer je upravo ona ono što konfiguracija napisana prema njoj imenuje u sopstvenom `$schema`, a nijedno FDS izdanje ne upravlja šemom alata, pa ništa drugo nikada ne bi reklo kada sme da ode.

### Trening — v1.0.0

**Šema:** `/schemas/workout/v1.0.0/workout.schema.json`

Zamenjena treningom 1.1.0. Ostaje objavljena i ostaje zamrznuta, jer izdanja 1.2.0 i 1.3.0 deklarišu workout na 1.0.0, a klijent fiksiran na bilo koje od njih mora i dalje moći da razrešava. Povlačenje bi slomilo te klijente, a upravo je to ono što zamrzavanje URL-a obećava da neće učiniti.

Ne gradite prema njoj. Nov rad treba da koristi workout 1.1.0; 1.0.0 dokumenti ostaju validni pod njom nepromenjeni, pošto je 1.1.0 samo dodala opciona polja.

Razrađeni primeri žive uz aktuelnu verziju, na `/schemas/workout/v1.1.0/`.

## Validacija

Pogledajte [Vodič za brzu validaciju](/docs/getting-started/quick-validation) za uputstva o validaciji vaših podataka prema ovim šemama.

## Lokacije šema

Sve šeme se služe sa: `https://spec.vitness.me/schemas/`
