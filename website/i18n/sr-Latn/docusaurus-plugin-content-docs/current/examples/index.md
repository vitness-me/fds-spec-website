---
title: Primeri
description: Primeri podataka i vodiči za implementaciju FDS-a
sidebar_position: 1
---

# FDS primeri

Ovaj odeljak donosi primere podataka i vodiče za implementaciju standarda Fitness Data Standard.

## Registri

Pod `/registries/` objavljuju se dve različite vrste datoteka, a razlikovati ih je važno.

### Registri vokabulara — normativni

Oni definišu preporučene vrednosti za otvoreni klasifikator. Nekoliko FDS polja namerno su otvoreni stringovi, a ne enumeracije, i ovi registri su ono što sprečava da „otvoreno“ znači „nedefinisano“.

- **Tip vežbe**: [`exercise-type.registry.json`](https://spec.vitness.me/registries/exercise-type.registry.json)
- **Tip treninga**: [`workout-type.registry.json`](https://spec.vitness.me/registries/workout-type.registry.json)
- **Uloga bloka**: [`block-role.registry.json`](https://spec.vitness.me/registries/block-role.registry.json)
- **Zona intenziteta**: [`intensity-zone.registry.json`](https://spec.vitness.me/registries/intensity-zone.registry.json)

Otvoreno znači otvoreno: proizvođač podataka koji emituje vrednost koje nema na spisku i dalje je proizveo važeći dokument, a konzument koji na takvu vrednost naiđe **NE SME** da je odbaci.

### Primeri kataloga entiteta — ilustrativni

Oni pokazuju oblik koji provajder servira — niz dokumenata entiteta, od kojih svaki nosi sopstveni `schemaVersion`. Nisu normativni i ništa u FDS-u ne zahteva baš ove unose.

- **Oprema**: [`equipment.registry.example.json`](https://spec.vitness.me/registries/equipment.registry.example.json)
- **Mišići**: [`muscles.registry.example.json`](https://spec.vitness.me/registries/muscles.registry.example.json)
- **Kategorije mišića**: [`muscle-categories.registry.example.json`](https://spec.vitness.me/registries/muscle-categories.registry.example.json)

`.example.` u imenu datoteke je ono što ih razlikuje — datoteka po imenu `*.registry.json` jeste registar, a datoteka po imenu `*.registry.example.json` je primer registra. Potpuna pravila su u [README-ju registara](https://spec.vitness.me/registries/README.md).

## Primeri entiteta

<!-- fds:count examples=136 -->
Objavljeno je 136 primera dokumenata, od kojih se svaki servira sa iste verzionisane putanje kao i šema koju demonstrira. Svaki od njih validira se u CI-ju, pa primer koji prestane da odgovara svojoj šemi obara build.

<!-- fds:count examples:exercise=8 -->
### Primeri vežbi (8)
- Osnovna definicija vežbe
- Kardio vežba
- Kondiciona vežba
- Vežba mobilnosti/fleksibilnosti
- Vežba na mašini
- Unilateralna vežba
- Vežba sa asistencijom
- Vežba zasnovana na brzini

<!-- fds:count examples:equipment=2 -->
### Primeri opreme (2)
- Osnovna definicija opreme (šipka)
- Oprema sa opterećenjem na steku, kod koje se opterećenje bira u fiksnim koracima

<!-- fds:count examples:muscle=2 -->
### Primeri mišića (2)
- Mišić sa regionima toplotne mape i lokalizovanim nazivom
- Drugi mišić koji uz svoje regione nosi lokalizovane alijase

<!-- fds:count examples:muscle-category=1 -->
### Primeri kategorija mišića (1)
- Kategorija najvišeg nivoa sa lokalizovanim opisima i klasifikacionim oznakama

<!-- fds:count examples:body-atlas=1 -->
### Primeri atlasa tela (1)
- Atlas sa prednjim i zadnjim prikazom i imenovanim oblastima vezanim za selektore unutar njih

<!-- fds:count examples:prescription=58 invalid:prescription=15 -->
### Primeri preskripcije (58)
Fragmenti, a ne celi dokumenti — po jedan za svaki diskriminator koji definiše biblioteka definicija RFC-006: ciljna opterećenja, ciljni brojevi ponavljanja, tempo, odmor, zone intenziteta, šeme serija i pravila progresije. Dodatnih 15 negativnih primera utvrđuje šta šema i dalje odbija. Popisani su u [README-ju uz datoteke primera](https://spec.vitness.me/schemas/prescription/v1.0.0/README.md).

<!-- fds:count examples:workout=46 -->
### Primeri treninga (46)
Kompletni treninzi koji prolaze validaciju — po jedan za svaku šemu serija i ponavljanja iz matrice pokrivenosti, po jedan za svaku strukturu grupisanja od pojedinačne vežbe do chipper treninga i po jedan za svaki kardio scenario i scenario izdržljivosti. Popisani su u [README-ju uz datoteke primera](https://spec.vitness.me/schemas/workout/v1.1.0/README.md).

<!-- fds:count examples:program=18 -->
### Primeri programa (18)
Kompletni programi koji prolaze validaciju, a pokrivaju modele periodizacije i raspoređivanja iz RFC-008 — linearnu, talasastu, blok i konjugovanu periodizaciju, procentualne talase, rasterećenja, uslovno grananje i još ponešto. Nijedan od njih ne sadrži ni seriju, ni ponavljanje, ni opterećenje: program je raspored referenci na treninge, a preskripcija živi u treninzima na koje on pokazuje. Popisani su u [README-ju uz datoteke primera](https://spec.vitness.me/schemas/program/v1.0.0/README.md).

## Obrasci implementacije

Za smernice za implementaciju i tokove rada migracije podataka pogledajte:
- [Specifikacije](/docs/specifications/rfc-001-exercise-data-model) - potpuna RFC dokumentacija
- [Šeme](/docs/schemas) - interaktivni prikazivači šema
- [Brza validacija](/docs/getting-started/quick-validation) - vodič za validaciju
