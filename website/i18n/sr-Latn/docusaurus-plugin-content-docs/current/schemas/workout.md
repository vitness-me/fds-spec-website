---
title: Šema treninga
description: JSON šema za jedan propisan trening — blokovi, režimi izvršavanja, grupisanje i preskripcija po seriji
sidebar_position: 8
---

# Šema treninga (v1.1.0)

Trening je **jedna propisana celina rada**: šta se radi, kojim redosledom, kako je grupisano i kako je svaka stavka propisana.

## Lokacija šeme

**URL:** `https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json`

**Preuzimanje:** [workout.schema.json](https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json)

`v1.0.0` ostaje objavljena i zamrznuta na sopstvenom URL-u. 1.1.0 je čisto aditivna, pa se svaki 1.0.0 dokument validira prema njoj nepromenjen.

## Blokovi stavki, i režim

Centralna tvrdnja je strukturna: **trening su blokovi stavki, a način na koji se blok izvršava jeste svojstvo bloka, a ne druga vrsta dokumenta.**

Klasične serije, superserije, kružni trening, EMOM, AMRAP, Tabata i intervalni rad — sve je to ista šema, koja se razlikuje samo u `blocks[].mode`. Nijedan stil treninga ne dobija sopstvenu šemu i ne postoje polja po stilu — nema `isCircuit`, nema `emomInterval`, nema `tabataRounds`.

`mode` odlučuje tri stvari koje konzument ne može drugačije izvesti:

1. **Prolazak** — sve serije prve stavke pre druge stavke (`sequential`), ili po jedna serija svake stavke po prolazu (`circuit`, `superset`)
2. **Završetak** — blok se završava kada je rad obavljen (`sequential`, `forTime`) ili kada istekne sat (`amrap`, `emom`, `tabata`)
3. Koji su `modeParams` smisleni

| `mode` | Smisleni `modeParams` | Završava se kada |
|---|---|---|
| `sequential` | — | Sve stavke završene |
| `superset` | `rounds` | Sve serije svake grupe završene |
| `circuit` | `rounds`, `rest` | Završeno `rounds` krugova |
| `emom` | `rounds`, `interval` | Istekne `rounds` intervala |
| `amrap` | `timeCap` | Istekne `timeCap` |
| `forTime` | `rounds`, `timeCap` | Rad se završi, ili istekne `timeCap` |
| `tabata` | `rounds`, `work`, `rest` | Završeno `rounds` krugova |
| `interval` | `rounds`, `work`, `rest` | Završeno `rounds` krugova |

Režim koji ne prepoznajete **ne sme se izvršiti vraćanjem na `sequential`**. Prikažite stavke i njihove preskripcije, i recite da struktura nije shvaćena. Izvršavanje neprepoznate intervalne strukture kao klasičnih serija ne proizvodi malo drugačiji trening — proizvodi drugačiji fiziološki stimulus, a u kondicionom bloku možda i onaj za koji sportista nije spreman.

## Grupisanje je oznaka, a ne ugnježdavanje

Stavke koje dele `groupLabel` unutar bloka se smenjuju. `A1`, `A2` je superserija; `A1`, `A2`, `A3` triserija. Slovo uređuje grupe, cifra uređuje članove. Ovo je konvencija koju treneri već pišu na papiru, učinjena mašinski čitljivom.

**Superserija, kombinovana serija i antagonističko uparivanje se strukturno ne razlikuju.** Sve tri su dve stavke koje se smenjuju sa odmorom odloženim do kraja grupe; razlikuju se samo po tome da li vežbe dele mišićnu grupu ili su joj suprotstavljene — što je izvodivo iz `targets` referenciranih vežbi. Ponovno kodiranje toga ovde stvorilo bi drugi izvor istine koji može da se ne slaže sa prvim.

## Serije: eksplicitno ili šemom, nikada oboje

Stavka navodi svoje serije na jedan od dva načina: `sets[]`, eksplicitan niz gde svaka serija nosi sopstveno opterećenje, ponavljanja, tempo i odmor; ili `scheme`, imenovani obrazac iz RFC-006 sa svojim parametrima.

Oni su međusobno isključivi i šema to sprovodi. Stavka koja nosi oba navodi isti rad dvaput bez ičega što bi reklo koji važi, a konzument koji pogrešno izabere menja trening.

`load`, `reps`, `tempo` i `rest` na nivou stavke primenjuju se na svaku seriju. Vrednost na nivou serije ih nadjačava samo za tu seriju.

## Podešavanja mašina

Neke preskripcije nisu ni opterećenje, ni ponavljanja, ni tempo, ni odmor. Traka za trčanje na nagibu od pet procenata, bicikl držan na devedeset obrtaja u minuti — sportista ih podešava pre početka, i ništa drugo u modelu do njih ne dopire.

`settings` je niz metričkih oblika sa priloženom vrednošću: `type` i `unit` iz zajedničkog rečnika RFC-001, `value`, opciono `range` i `notes`. Stoji na stavci ili na pojedinačnoj seriji, pa je nagib koji raste na svakih pet minuta tri serije, a ne tri stavke.

Namerno to nije nova definicija po podešavanju. Opterećenje i odmor zaslužili su sopstvene jer svako od njih nosi semantiku prema kojoj konzument mora da postupi — metodu razrešavanja, obuhvat. Nagib ne nosi ništa od toga: to je broj u jedinici koji sportista podesi.

**Otpor je opterećenje, a ne podešavanje.** On menja koliko je rad težak, pa ostaje `loadTarget` sa `method: "level"` i imenovanom `scale`. Nagib i kadenca menjaju šta je pokret, a ne koliko je težak.

Od 1.1.0 serija nosi i `zone`. Opterećenje, ponavljanja, tempo i odmor oduvek su se mogli navesti po seriji, a intenzitet nije, pa je trening čiji intenzitet raste iz serije u seriju morao da se deli na po jednu stavku po koraku. To je bila asimetrija, a ne odluka.

## Zbirni prikazi su savetodavni

`targets` i `equipment` sumiraju šta trening trenira i šta mu je potrebno. Oba su opciona i **ne smeju** se tretirati kao merodavna u odnosu na obilazak stavki — mogu biti odsutni, zastareli ili izračunati pod pretpostavkama koje ne delite. Zbirni prikaz proizveden pre nego što je stavka zamenjena više ne opisuje trening. Preračunajte kada je ispravnost bitna.

## Razrađeni primeri

<!-- fds:count examples:workout=46 scenarios:workout=46 -->
Uz šemu je objavljeno 46 treninga — po jedan za svaku šemu serija i ponavljanja iz matrice pokrivenosti, po jedan za svaku strukturu grupisanja od jedne vežbe do „chipper“ formata, i po jedan za svaki kardio scenario i scenario izdržljivosti. Svaki je indeksiran u [README datoteka primera](https://spec.vitness.me/schemas/workout/v1.1.0/README.md).

Skup grupisanja je pravi test gornje tvrdnje: da je ijednoj strukturi zatrebalo polje koje šema nema, apstrakcija bi bila presečena na pogrešnom mestu.

## Ključna polja

- `workoutId`, `schemaVersion`, `canonical`, `metadata` — zajednički omotač iz RFC-001
- `classification.workoutType` — otvoren klasifikator, vrednosti preporučene u [registru tipova treninga](https://spec.vitness.me/registries/workout-type.registry.json)
- `structure.blocks[]` — najmanje jedan blok, svaki sa najmanje jednom stavkom
- `blocks[].role` — čemu blok služi, preporuke u [registru uloga blokova](https://spec.vitness.me/registries/block-role.registry.json)
- `items[].alternatives[]` — zamene koje autor unapred odobrava, različite od one koju sportista napravi usred treninga
- `items[].repStyle` — obim pokreta i sastav ponavljanja, za parcijalna ponavljanja i ponavljanja „jedan i po“

## Specifikacija

[RFC-007: Model podataka treninga](../specifications/rfc-007-workout-data-model). Sama preskripcija dolazi iz [RFC-006](../specifications/rfc-006-prescription-primitives).
