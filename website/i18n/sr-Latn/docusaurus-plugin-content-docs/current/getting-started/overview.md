---
title: Pregled
description: Potpun pregled standarda Fitness Data Standard (FDS)
sidebar_position: 1
---

# Pregled FDS-a

Fitness Data Standard (FDS) definiše otvoren, interoperabilan format za razmenu podataka iz fitnes domena između aplikacija i platformi.

## Svrha i obuhvat

Omogućiti prenosivost podataka i interoperabilnost među fitnes aplikacijama pružanjem:

- normativnih JSON šema za osnovne fitnes entitete
- kvalitetnih RFC dokumenata sa primerima i smernicama za implementaciju
- fleksibilnih taksonomija platformi kroz jasno definisane tačke proširenja

### Trenutni obuhvat

<!-- fds:count rfcs=9 -->
**U obuhvatu** — 9 objavljenih RFC dokumenata:

- **Model podataka vežbe** (RFC-001)
- **Kataloški entiteti**: oprema (RFC-002), mišići (RFC-003), kategorije mišića (RFC-004), atlas tela (RFC-005)
- **Primitivi preskripcije** (RFC-006) — opterećenje, ponavljanja, tempo, odmor, zone intenziteta, šeme serija i pravila progresije, definisani jednom, tako da serija znači isto gde god da se pojavi
- **Model podataka treninga** (RFC-007) — jedan propisan trening, kao blokovi stavki sa režimom izvršavanja po bloku
- **Model podataka trenažnog programa** (RFC-008) — raspored referenci na treninge kroz vreme, sa ciklusima, nedeljama, progresijom i uslovnim grananjem
- **Integritet referenci na entitete** (RFC-010) — šta moraju da nose reference koje entiteti drže jedni na druge, da bi dokument ostao čitljiv i bez njihovog razrešavanja

**Van obuhvata** — odlukom, ne propustom:

- **Lični podaci**: identitet sportiste, telesna masa, maksimumi za jedno ponavljanje i ono što je stvarno izvedeno
- **Autentifikacija i autorizacija**: FDS je format podataka, a ne protokol
- **Generisani izbor vežbi**: dan programa referencira trening koji postoji, tako da se plan može pročitati bez generatora koji ga je proizveo

Upravo to što ne nosi lične vrednosti čini sve ostalo prenosivim. Katalog, trening ili plan mogu se slobodno objavljivati, keširati, preslikavati i upoređivati upravo zato što nijedan od njih ne opisuje osobu — a to svojstvo vredi više od pogodnosti upisivanja telesne mase u dokument. Beleženje izvedenih rezultata zato čeka na model saglasnosti i privatnosti, a ne na dizajn šeme.

Pogledajte [plan razvoja](/docs/governance/roadmap) da vidite šta svako isključenje košta i šta je u razmatranju.

## Verzionisanje i kompatibilnost

FDS prati semantičko verzionisanje za izdanja modela podataka:

- **Glavna (X.0.0)**: nekompatibilne izmene obaveznih polja ili semantike
- **Sporedna (0.Y.0)**: unazad kompatibilna proširenja (opciona polja, nove enum vrednosti, pojašnjenja dokumentacije)
- **Zakrpa (0.0.Z)**: nefunkcionalne izmene (slovne greške, redaktorske izmene, metapodaci šeme)

### Pravila kompatibilnosti

- Podaci važeći u X.Y.Z MORAJU ostati važeći u X.(Y+1).0
- Dodavanje novih obaveznih polja predstavlja GLAVNU izmenu
- Zastarela polja ostaju funkcionalna tokom cele glavne verzije
- Proizvođači podataka i konzumenti TREBALO BI da koriste `schemaVersion` za usmeravanje validacije i logike

## Usaglašenost

### Usaglašen proizvođač podataka

- MORA proizvoditi JSON koji se validira prema FDS JSON šemi za deklarisani `schemaVersion`
- MORA koristiti UUIDv4 za sve identifikatore u produkcionim podacima
- MORA popuniti sva obavezna polja i pridržavati se enumeracija i strukturnih ograničenja
- TREBALO BI da uključi `schemaVersion` i održava tačne vremenske oznake u `metadata` (RFC 3339, UTC)

### Usaglašen konzument

- MORA validirati dolazne podatke prema odgovarajućoj verziji šeme
- MORA ignorisati nepoznata polja unutar `attributes`/`extensions`
- TREBALO BI da toleriše dodatna opciona polja uvedena u novijim sporednim verzijama
- TREBALO BI da odbaci podatke sa nedostajućim obaveznim poljima ili nevažećim enumeracijama

## Sledeći koraci

- [Razumite identifikatore](/docs/getting-started/identifiers)
- [Vodič za brzu validaciju](/docs/getting-started/quick-validation)
- [Pregledajte specifikacije](/docs/specifications/rfc-001-exercise-data-model)
- [Istražite šeme](/docs/schemas/exercise)
