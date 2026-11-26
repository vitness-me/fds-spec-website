---
title: JSON šeme
description: Svaka objavljena FDS šema, u verziji pod kojom je objavljena
sidebar_position: 1
---

# FDS JSON šeme

FDS je definisan u formatu JSON Schema (Draft 2020-12). Svaka šema ispod objavljena je na zamrznutom URL-u: bajtovi na URL-u verzije nikada se ne menjaju, a izmena se isporučuje na novom.

<!-- fds:count schemas=23 entities=7 libraries=1 tooling=2 superseded=13 -->
Objavljene su 23 šeme. Od toga je 7 entiteta, 1 je biblioteka definicija, 2 pripadaju alatu, a 13 su zamenjene verzije koje se i dalje služe.

## Verzije entiteta nisu ujednačene

Izdanje imenuje *skup* verzija entiteta, a ne jednu verziju koju svi dele. Aktuelno izdanje je **1.6.0** i ono objavljuje:

| Entitet | Verzija | URL šeme |
|---|---|---|
| [Vežba](/docs/schemas/exercise) | 1.2.0 | `/schemas/exercises/v1.2.0/exercise.schema.json` |
| [Oprema](/docs/schemas/equipment) | 1.2.0 | `/schemas/equipment/v1.2.0/equipment.schema.json` |
| [Mišić](/docs/schemas/muscle) | 1.1.0 | `/schemas/muscle/v1.1.0/muscle.schema.json` |
| [Kategorija mišića](/docs/schemas/muscle-category) | 1.1.0 | `/schemas/muscle/muscle-category/v1.1.0/muscle-category.schema.json` |
| [Atlas tela](/docs/schemas/body-atlas) | 1.1.0 | `/schemas/atlas/v1.1.0/body-atlas.schema.json` |
| [Trening](/docs/schemas/workout) | 1.2.0 | `/schemas/workout/v1.2.0/workout.schema.json` |
| [Program](/docs/schemas/program) | 1.1.0 | `/schemas/program/v1.1.0/program.schema.json` |

Ne postoji `muscle/v1.6.0/` i neće postojati osim ako se sam muscle ne promeni. URL-ove šema gradite iz verzije entiteta, nikada iz izdanja — pogledajte [krajnju tačku za otkrivanje](/docs/core-concepts/discovery) za to kako provajder oglašava koju verziju entiteta služi.

## Entiteti

### [Šema vežbe](/docs/schemas/exercise) — v1.2.0
Osnovni model podataka vežbe sa klasifikacijom, ciljanim mišićima, opremom, metrikama i medijskim sadržajima. 1.2.0 je dodala opcione [strukturne ključeve](/docs/core-concepts/structural-keys): `fxi` na vežbi, `fxm` i `fxmg` na njenim referencama na mišiće, `fxe` na njenim referencama na opremu.

**Šema:** `/schemas/exercises/v1.2.0/exercise.schema.json`

### [Šema opreme](/docs/schemas/equipment) — v1.2.0
Definicije fitnes opreme sa klasifikacijom, karakteristikama opterećivanja i metapodacima. 1.2.0 je dodala opcioni strukturni ključ `fxe`.

**Šema:** `/schemas/equipment/v1.2.0/equipment.schema.json`

### [Šema mišića](/docs/schemas/muscle) — v1.1.0
Definicije anatomskih mišića sa podrškom za vizualizaciju toplotnom mapom. 1.1.0 je dodala opcioni strukturni ključ `fxm`.

**Šema:** `/schemas/muscle/v1.1.0/muscle.schema.json`

### [Šema kategorije mišića](/docs/schemas/muscle-category) — v1.1.0
Struktura grupisanja i kategorizacije mišića. 1.1.0 je dodala opcioni strukturni ključ `fxmg`.

**Šema:** `/schemas/muscle/muscle-category/v1.1.0/muscle-category.schema.json`

### [Šema atlasa tela](/docs/schemas/body-atlas) — v1.1.0
Struktura vizualizacije tela sa prikazima i oblastima. 1.1.0 je dodala opcionu licencu i atribuciju na resursu svakog prikaza (RFC-005 §5).

**Šema:** `/schemas/atlas/v1.1.0/body-atlas.schema.json`

### [Šema treninga](/docs/schemas/workout) — v1.2.0
Jedan propisan trening: blokovi stavki, režim izvršavanja po bloku i preskripcija po seriji. 1.1.0 je dodala zone intenziteta po seriji i podešavanja mašina (RFC-007 §6). 1.2.0 omogućava da njene reference na vežbe, mišiće i opremu nose svoje strukturne ključeve.

**Šema:** `/schemas/workout/v1.2.0/workout.schema.json`

### [Šema programa](/docs/schemas/program) — v1.1.0
Raspored referenci na treninge kroz vreme: ciklusi, nedelje, raspoređivanje dana, progresija i grananje. 1.1.0 omogućava da referenca na vežbu u slotu trenažnog maksimuma nosi svoj `fxi`.

**Šema:** `/schemas/program/v1.1.0/program.schema.json`

## Biblioteke definicija

### [Primitivi preskripcije](/docs/schemas/prescription) — v1.1.0
Opterećenje, ponavljanja, tempo, odmor, zone intenziteta, šeme serija i pravila progresije — definicije koje treninzi i programi kombinuju. 1.1.0 omogućava da referenca na opremu u opterećenju elastičnom trakom nosi svoj `fxe`.

**Šema:** `/schemas/prescription/v1.1.0/prescription.schema.json`

Ova šema **nije entitet** i provajder je ne izvozi. Koren njene šeme po konstrukciji ne validira ništa: ne postoji dokument preskripcije koji bi se držao, samo definicije koje druge šeme koriste. Validirate prema definiciji unutar nje — `…/prescription.schema.json#/$defs/loadTarget` — nikada prema korenu. Provajder koji podržava treninge već podržava preskripciju; upravo to znači podržavati treninge.

## Šeme alata

### Mapiranje transformatora — v1.3.0
Konfiguracija za FDS Transformer: kako se izvorna polja mapiraju na FDS entitet. Opisuje ulaz alata, a ne entitet, pa je dokumentovana uz alat. Ne pripada nijednom izdanju — izdanje imenuje entitete i biblioteke koje oni kombinuju, a ovo konfiguriše alat.

**Šema:** `/schemas/transformer/v1.3.0/mapping.schema.json` — pogledajte [konfiguraciju transformatora](/docs/tools/transformer/configuration).

Verzija 1.3.0 dodala je provajdera obogaćivanja `claude-code` i njegova podešavanja `enrichment.claudeCode`.

### Poreklo podataka transformatora — v1.1.0
Opisuje `provenance.sidecar.json`, datoteku koju FDS Transformer upisuje pored svog izlaza: za svaki dokument, odakle potiče svako upisano polje (izvorna putanja, podrazumevana vrednost iz mapiranja, transformacija ili model, sa verzijom prompta i pouzdanošću). To je izlaz alata, a ne izvezeni podaci, i kao ni šema mapiranja ne pripada nijednom izdanju.

**Šema:** `/schemas/transformer/provenance/v1.1.0/provenance.schema.json`

Verzija 1.1.0 zahteva `provider` u unosu modela: provajdera obogaćivanja koji je uputio poziv.

## Zamenjene, i dalje dostupne

<!-- fds:pin workout/v1.0.0/workout.schema.json — listed on purpose: releases 1.2.0 and 1.3.0 declare workout at 1.0.0, so a client pinned to either must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin atlas/v1.0.0/body-atlas.schema.json — listed on purpose: releases 1.0.0 through 1.4.0 declare body-atlas at 1.0.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin exercises/v1.1.0/exercise.schema.json — listed on purpose: releases 1.1.0 through 1.5.0 declare exercise at 1.1.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin equipment/v1.1.0/equipment.schema.json — listed on purpose: releases 1.1.0 through 1.5.0 declare equipment at 1.1.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin muscle/v1.0.0/muscle.schema.json — listed on purpose: releases 1.0.0 through 1.5.0 declare muscle at 1.0.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin muscle/muscle-category/v1.0.0/muscle-category.schema.json — listed on purpose: releases 1.0.0 through 1.5.0 declare muscle-category at 1.0.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin prescription/v1.0.0/prescription.schema.json — listed on purpose: releases 1.2.0 through 1.5.0 declare prescription at 1.0.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin workout/v1.1.0/workout.schema.json — listed on purpose: releases 1.4.0 and 1.5.0 declare workout at 1.1.0, so a client pinned to either must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin program/v1.0.0/program.schema.json — listed on purpose: releases 1.3.0 through 1.5.0 declare program at 1.0.0, so a client pinned to any of them must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin transformer/v1.0.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.1.0 names, and an editor resolving it must keep getting a document. -->
<!-- fds:pin transformer/v1.1.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.2.0 names, and an editor resolving it must keep getting a document. -->
<!-- fds:pin transformer/v1.2.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.3.0 names, and an editor resolving it must keep getting a document. -->
<!-- fds:pin transformer/provenance/v1.0.0/provenance.schema.json — listed on purpose: it is the `$schema` every sidecar written before 1.1.0 names, and such a sidecar must keep validating against it. -->

### Pre strukturnih ključeva

| Šema | Verzija | Zamenjena verzijom | Imenovana u izdanjima |
|---|---|---|---|
| `/schemas/exercises/v1.1.0/exercise.schema.json` | 1.1.0 | 1.2.0 | od 1.1.0 do 1.5.0 |
| `/schemas/equipment/v1.1.0/equipment.schema.json` | 1.1.0 | 1.2.0 | od 1.1.0 do 1.5.0 |
| `/schemas/muscle/v1.0.0/muscle.schema.json` | 1.0.0 | 1.1.0 | od 1.0.0 do 1.5.0 |
| `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json` | 1.0.0 | 1.1.0 | od 1.0.0 do 1.5.0 |
| `/schemas/prescription/v1.0.0/prescription.schema.json` | 1.0.0 | 1.1.0 | od 1.2.0 do 1.5.0 |
| `/schemas/workout/v1.1.0/workout.schema.json` | 1.1.0 | 1.2.0 | 1.4.0 i 1.5.0 |
| `/schemas/program/v1.0.0/program.schema.json` | 1.0.0 | 1.1.0 | od 1.3.0 do 1.5.0 |

Izdanje 1.6.0 zamenilo je ovih sedam verzija dodavanjem opcionih strukturnih ključeva. Svaka ostaje objavljena i zamrznuta, jer klijent fiksiran na izdanje koje je imenuje mora i dalje moći da je razrešava. Ne gradite prema njima: svaki dokument validan pod nekom od njih validan je i pod njenom naslednicom, pošto su ključevi opcioni. Primeri su uz aktuelne verzije.

### Mapiranje transformatora — v1.2.0

**Šema:** `/schemas/transformer/v1.2.0/mapping.schema.json`

Zamenjena mapiranjem 1.3.0, koje je dodalo provajdera `claude-code` i `enrichment.claudeCode`. Svaka 1.2.0 konfiguracija i dalje je validna pod 1.3.0 — dodaci su opcioni. I dalje se služi jer je upravo ona ono što konfiguracija napisana prema njoj imenuje u sopstvenom `$schema`.

### Poreklo podataka transformatora — v1.0.0

**Šema:** `/schemas/transformer/provenance/v1.0.0/provenance.schema.json`

Zamenjena verzijom provenance 1.1.0, koja zahteva `provider` u unosu modela, pa sidecar 1.0.0 sa unosima modela nije validan pod 1.1.0. I dalje se služi jer je sidecar napisan pre 1.1.0 navodi kao svoj `$schema` i i dalje je validan prema njoj.

### Mapiranje transformatora — v1.1.0

**Šema:** `/schemas/transformer/v1.1.0/mapping.schema.json`

Zamenjena mapiranjem 1.2.0, koje je dodalo `validation.rejectDefaults`. Svaka 1.1.0 konfiguracija i dalje je validna pod 1.2.0 — dodatak je opcion. I dalje se služi jer je upravo ona ono što konfiguracija napisana prema njoj imenuje u sopstvenom `$schema`.

### Mapiranje transformatora — v1.0.0

**Šema:** `/schemas/transformer/v1.0.0/mapping.schema.json`

Zamenjena mapiranjem 1.1.0, koje je dodalo ključeve za obogaćivanje i evaluaciju koje je transformator prerastao. Svaka 1.0.0 konfiguracija i dalje je validna pod 1.1.0 — dodaci su opcioni. I dalje se služi jer je upravo ona ono što konfiguracija napisana prema njoj imenuje u sopstvenom `$schema`, a nijedno FDS izdanje ne upravlja šemom alata, pa ništa drugo nikada ne bi reklo kada sme da ode.

### Trening — v1.0.0

**Šema:** `/schemas/workout/v1.0.0/workout.schema.json`

Zamenjena treningom 1.1.0. Ostaje objavljena i ostaje zamrznuta, jer izdanja 1.2.0 i 1.3.0 deklarišu workout na 1.0.0, a klijent fiksiran na bilo koje od njih mora i dalje moći da razrešava. Povlačenje bi slomilo te klijente, a upravo je to ono što zamrzavanje URL-a obećava da neće učiniti.

Ne gradite prema njoj. Nov rad treba da koristi workout 1.2.0; 1.0.0 dokumenti ostaju validni pod njom nepromenjeni, pošto su 1.1.0 i 1.2.0 samo dodale opciona polja.

Razrađeni primeri žive uz aktuelnu verziju, na `/schemas/workout/v1.2.0/`.

### Atlas tela — v1.0.0

**Šema:** `/schemas/atlas/v1.0.0/body-atlas.schema.json`

Zamenjena atlasom tela 1.1.0. Ostaje objavljena i ostaje zamrznuta, jer izdanja od 1.0.0 do 1.4.0 deklarišu body-atlas na 1.0.0, a klijent fiksiran na bilo koje od njih mora i dalje moći da razrešava.

Ne gradite prema njoj. Nov rad treba da koristi body-atlas 1.1.0; 1.0.0 dokumenti ostaju validni pod njom nepromenjeni, pošto je 1.1.0 samo dodala opciona polja.

Primer živi uz aktuelnu verziju, na `/schemas/atlas/v1.1.0/`.

## Validacija

Pogledajte [Vodič za brzu validaciju](/docs/getting-started/quick-validation) za uputstva o validaciji vaših podataka prema ovim šemama.

## Lokacije šema

Sve šeme se služe sa: `https://spec.vitness.me/schemas/`
