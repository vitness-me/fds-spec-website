---
title: Šema programa
description: JSON šema za trenažni program — ciklusi, nedelje, raspoređivanje dana, progresija i grananje
sidebar_position: 9
---

# Šema programa (v1.0.0)

Program smešta treninge u vreme: ciklusi, nedelje, dani i pravila po kojima se preskripcija menja kako plan napreduje.

## Lokacija šeme

**URL:** `https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json`

**Preuzimanje:** [program.schema.json](https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json)

## Raspored referenci, a ne kontejner

**Program ne sadrži treninge. On pokazuje na njih.**

Trening korišćen ponedeljkom svake nedelje tokom dvanaest nedelja napisan je jednom i referenciran dvanaest puta. Trening koji dele četiri programa popravlja se jednom, i sva četiri su popravljena. Alternativa — umetanje kopije po danu — znači da dvanaestonedeljni plan nosi trideset šest gotovo identičnih dokumenata, a plan popravljen u osam od njih gori je od plana popravljenog ni u jednom, jer se sada ne slaže sam sa sobom.

Cena ovoga je samosadržanost, i specifikacija to kaže umesto da se pravi da nije tako. Program sam po sebi nije prikaziv; potrebni su vam i referencirani treninzi. Denormalizovano `name` na svakoj referenci postoji da bi program ostao *izlistiv* bez razrešavanja, iako bez njega nije *izvršiv*.

Referenca koju ne možete razrešiti **mora biti prijavljena**, ne preskočena i ne tretirana kao dan odmora. Nerazrešiv trening i propisan odmor su različite instrukcije.

## Četiri modela rasporeda

`schedule.model` odlučuje **koje je od polja za smeštanje dana merodavno**. To je strukturni diskriminator, a ne oznaka.

| `model` | Merodavno | Značenje |
|---|---|---|
| `calendar` | `dayOfWeek` | Dani padaju na imenovane dane u nedelji |
| `relative` | `offsetDays` | Dani padaju na fiksni pomak od početka programa |
| `rolling` | `offsetDays` | Fiksni ritam — tri dana rada, jedan odmora — koji po dizajnu klizi u odnosu na kalendar |
| `sequence` | nijedno | Izvodi se redom, tempom sportiste; `index` je jedino uređenje |

Čitanje dokumenta pod pogrešnim modelom ne proizvodi malo drugačiji plan. Klizni petodnevni ritam pročitan kao kalendar preuređuje trening i urušava obrazac odmora oko kojeg je plan izgrađen.

## Dan je trening ili dan odmora

Tačno jedno od toga. Oboje je protivrečnost; nijedno ne kaže ništa, a konzument koji prikazuje kalendar morao bi da izmisli značenje za to mesto.

Odmor je modelovan eksplicitno umesto da bude ostavljen kao praznina, jer je odsutan dan neplaniran, a propisan dan odmora je deo programa — od čega je upravo sačinjena nedelja rasterećenja. Dan dodatno može biti `optional`, što kvalifikuje trenažni dan umesto da ga zameni.

## `overrides` se primenjuje na pojavljivanje, a ne na trening

`overrides` prilagođava referencirani trening **samo za taj dan**. Dokument treninga se nikada ne menja — to je ono što ga drži deljivim.

`loadScaling` se primenjuje *nakon* što se ciljno opterećenje razreši, i upravo mu to omogućava da se kombinuje sa bilo kojom metodom: množi apsolutno opterećenje, množi razrešeni rezultat procenta, a ne množi ništa na RPE cilju, jer RPE nema opterećenje dok ga sportista ne obezbedi.

Tamo gde referencirani trening nosi sopstveno pravilo progresije, **pravilo se razrešava prvo, a nadjačavanja se primenjuju na njegov rezultat.** Obrnut redosled učinio bi da jedno deljeno pravilo napreduje različito u dva plana koja oba tvrde da ga koriste.

## Trenažni maksimumi su slotovi, nikada vrednosti

`references.trainingMaxes[]` deklariše iz kojih je dizanja plan izračunat i kako pozivalac izvodi svaki broj. **Nikada ne nosi broj, a usaglašena implementacija ne sme da ga doda.**

Ovo je stvar koju će implementator najverovatnije „popraviti“, jer se slot čita kao objekat kome nedostaje polje, a njegovo popunjavanje naizgled čini programe samosadržanim bez ikakve cene. Nije besplatno. Maksimum za jedno ponavljanje je lični podatak o odredivoj osobi; program koji ga nosi stiče subjekta, a sa subjektom dolaze obaveze saglasnosti, zadržavanja, prenosivosti i brisanja koje dosežu svaki sistem kroz koji dokument prođe. FDS je izgrađen tako da se katalozi, treninzi i planovi mogu slobodno objavljivati, keširati, preslikavati i porediti, a to je odbranjivo samo dok nijedan od njih ne opisuje osobu.

Prihvaćena posledica: **potpuno personalizovan program ne može da napravi *round-trip* kao jedan samosadržan dokument.** Izvoz je plan plus odvojen kontekst razrešavanja. Taj kompromis je nameran.

Slot se poklapa po svom polju `exercise` — `percent1RM` imenuje vežbu kroz `referenceExerciseId`, a važi onaj slot koji imenuje tu vežbu. Sopstveni `id` slota je lokalna oznaka za citiranje iz pravila ili iz nadjačavanja.

## Grananje, i granica adaptivnih planova

`branching` uslovno usmerava između dana — položite test i nastavljate, padnete i ponavljate nedelju. Uslov je **deklarativan**, a ne izraz, upravo zato da bi konzument mogao da prepozna onaj koji ne ume da izračuna i da ga odbije. Uslov koji ne možete izračunati znači praćenje bezuslovnog rasporeda i upozorenje, nikada pogađanje.

Adaptivno programiranje deli se na dvoje, i samo je jedna polovina prenosiva. **Adaptacija opterećenja je izraziva** — fiksni kostur čija se opterećenja razrešavaju u vreme izvođenja kroz `autoregulated` ciljeve koji pokazuju na deklarisana pravila. **Izbor vežbi generisan po treningu nije**, i specifikacija to kaže umesto da ostavi implicirano: dan nosi referencu na trening, što zahteva trening koji postoji, a neodređen dan značio bi program nečitljiv bez generatora koji ga je proizveo.

## Autorstvo

`authorship` je prvo mesto gde FDS beleži polaganje prava, i nalazi se ovde, a ne na vežbi, zbog toga šta program jeste. Pokret nije autorsko delo ni u kom smislenom značenju; dvanaestonedeljni plan jeste. Odsutna `license` znači **nenavedeno, a ne javno dobro**, i konzument bi trebalo da očuva `authorship` kroz svaku transformaciju.

## Razrađeni primeri

<!-- fds:count examples:program=18 scenarios:program=18 -->
Uz šemu je objavljeno 18 programa — po jedan za svaki model periodizacije iz matrice pokrivenosti i po jedan za svaku strukturu rasporeda, indeksirani u [README datoteka primera](https://spec.vitness.me/schemas/program/v1.0.0/README.md).

Nijedan od njih ne sadrži seriju, ponavljanje ni opterećenje. To je gornja tvrdnja, demonstrirana umesto samo iznesena.

## Specifikacija

[RFC-008: Model podataka trenažnog programa](../specifications/rfc-008-program-data-model). Treninzi dolaze iz [RFC-007](../specifications/rfc-007-workout-data-model), a preskripcija iz [RFC-006](../specifications/rfc-006-prescription-primitives).
