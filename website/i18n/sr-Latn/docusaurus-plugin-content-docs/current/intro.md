---
title: Dobro došli u FDS
description: Fitness Data Standard (FDS) omogućava interoperabilnu razmenu podataka iz fitnes domena između aplikacija
sidebar_position: 1
keywords: [fitnes, podaci, standard, vežba, interoperabilnost, json-schema]
---

# Fitness Data Standard (FDS)

Dobro došli u dokumentaciju standarda **Fitness Data Standard (FDS)**. FDS je otvoren, interoperabilan standard za razmenu podataka iz fitnes domena između aplikacija i platformi.

## Svrha

Omogućiti **prenosivost podataka** i **interoperabilnost** među fitnes aplikacijama pružanjem:

- normativnih JSON šema za osnovne fitnes entitete
- kvalitetnih RFC dokumenata sa primerima i smernicama za implementaciju
- fleksibilnih tačaka proširenja za potrebe specifične za platformu
- standardizovanih metapodataka i upravljanja životnim ciklusom

## Trenutni obuhvat

<!-- fds:count rfcs=9 -->
**U obuhvatu** — 9 objavljenih RFC dokumenata:

- **Model podataka vežbe** (RFC-001)
- **Kataloški entiteti**: oprema (RFC-002), mišići (RFC-003), kategorije mišića (RFC-004), atlas tela (RFC-005)
- **Primitivi preskripcije** (RFC-006): opterećenje, ponavljanja, tempo, odmor, zone intenziteta, šeme serija i pravila progresije
- **Model podataka treninga** (RFC-007): jedan propisan trening, kao blokovi stavki sa režimom izvršavanja po bloku
- **Model podataka trenažnog programa** (RFC-008): raspored referenci na treninge kroz vreme
- **Integritet referenci na entitete** (RFC-010): šta mora da nosi referenca između entiteta

**Van obuhvata** — odlukom, ne propustom:

- **Lični podaci**: identitet sportiste, telesna masa, maksimumi za jedno ponavljanje i ono što je stvarno izvedeno
- **Autentifikacija i autorizacija**: format podataka, a ne protokol
- **Generisani izbor vežbi**: dan programa referencira trening koji postoji

Upravo to što ne nosi lične vrednosti čini sve ostalo prenosivim — katalog, trening ili plan mogu se slobodno objavljivati, keširati, preslikavati i upoređivati upravo zato što nijedan od njih ne opisuje osobu. Pogledajte [plan razvoja](./governance/roadmap) da vidite šta svako isključenje košta.

## Brzi početak

### Za implementatore

1. **Pregledajte** [specifikacije](./specifications/rfc-001-exercise-data-model) da biste razumeli modele podataka
2. **Istražite** [JSON šeme](./schemas/exercise) kroz interaktivne prikazivače
3. **Validirajte** svoje podatke prema šemama (pogledajte [vodič za validaciju](./getting-started/quick-validation))
4. **Proširite** standard kroz [registar ekstenzija](./core-concepts/extensions) za sopstvene potrebe

### Za saradnike

1. **Pregledajte** proces [upravljanja](./governance)
2. **Pročitajte** [vodič za doprinos](./governance/contributing)
3. **Predložite** poboljšanja kroz RFC proces
4. **Pridružite se** zajednici na [GitHub-u](https://github.com/vitness-me/fds-spec-website)

## Struktura dokumentacije

- **[Prvi koraci](./getting-started/overview)** - Pregled, brzi početak validacije, politika identifikatora
- **[Osnovni koncepti](./core-concepts/internationalization)** - Internacionalizacija, metrike, ekstenzije, otkrivanje
- **[Specifikacije](./specifications/rfc-001-exercise-data-model)** - Detaljni RFC dokumenti za svaki entitet
- **[Šeme](./schemas/exercise)** - Interaktivni prikazivači JSON šema sa primerima
- **[Primeri](./examples)** - Pregled primera
- **[Upravljanje](./governance)** - Proces odlučivanja, doprinos, istorija izmena

## Ključne funkcionalnosti

### Semantičko verzionisanje
FDS prati semantičko verzionisanje (X.Y.Z) sa strogim pravilima kompatibilnosti:
- **Glavna**: nekompatibilne izmene obaveznih polja
- **Sporedna**: unazad kompatibilna proširenja
- **Zakrpa**: nefunkcionalne izmene (slovne greške, redaktorske izmene)

### UUID identifikatori
Svi produkcioni identifikatori **MORAJU** biti UUIDv4 stringovi za:
- ID-jeve vežbi
- ID-jeve opreme, mišića i kategorija
- reference između entiteta

### Fleksibilne ekstenzije
Dve strukturirane tačke proširenja:
- **`attributes`**: ravni parovi ključ/vrednost za uobičajene ekstenzije
- **`extensions`**: ugnežđene strukture u imenskom prostoru proizvođača za složene podatke

### Životni ciklus statusa
Entiteti sadrže `metadata.status` za upravljanje životnim ciklusom:
- `draft` → `review` → `active` → `inactive` / `deprecated`

## Saznajte više

- [Pročitajte potpun pregled](./getting-started/overview)
- [Razumite identifikatore](./getting-started/identifiers)
- [Pregledajte RFC za vežbe](./specifications/rfc-001-exercise-data-model)
- [Istražite šeme interaktivno](./schemas/exercise)

## Licenca

FDS se objavljuje pod ugovorom [VITNESS Open Standards License Agreement](./license).

---

**Spremni za početak?** Krenite od [vodiča za prve korake](./getting-started/overview) →
