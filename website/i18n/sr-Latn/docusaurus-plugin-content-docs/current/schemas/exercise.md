---
title: Šema vežbe
description: JSON šema za model podataka vežbe
sidebar_position: 2
---

# Šema vežbe (v1.2.0)

Šema vežbe definiše osnovni model podataka za fitnes vežbe. Uključuje klasifikaciju, ciljane mišiće, zahteve za opremom i medijske sadržaje.

## Lokacija šeme

**URL:** `https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.schema.json`

**Preuzimanje:** [exercise.schema.json](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.schema.json)

## Primeri

Pogledajte primere vežbi:
- [Osnovna vežba](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.json)
- [Kardio vežba](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.cardio.json)
- [Vežba mobilnosti](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.mobility.json)
- [Vežba na mašini](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.machine.json)
- [Unilateralna vežba](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.unilateral.json)
- [Vežba sa strukturnim deskriptorima (nacrt, RFC-010)](https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.example.descriptors.json)

## Specifikacija

Za detaljne informacije o modelu podataka vežbe pogledajte [RFC-001: Model podataka vežbe](../specifications/rfc-001-exercise-data-model).

## Ključna polja

- `id`: UUID identifikator
- `schemaVersion`: string verzije (npr. "1.0.0")
- `canonical`: standardizovano imenovanje sa slug vrednošću i alijasima
- `classification`: tip vežbe, mehanika, sila, nivo, kinetički lanac
- `targets`: primarni i sekundarni ciljani mišići sa nivoima aktivacije; svaka referenca na mišić može da nosi svoj ključ `fxm`
- `equipment`: obavezna, opciona i alternativna oprema; svaka referenca na opremu može da nosi svoj standardni `fxe`
- `media`: slike, video-zapisi i dijagrami
- `metadata`: status, vremenske oznake, autorstvo
- `fxi`, `fxe`: opcioni strukturni deskriptori (RFC-010): kanonski FXI vežbe i standardni FXE njene glavne opreme
- `fxiProvenance`, `fxiGap`: ko je odgovorio za FXI, i vlasnikova beleška o tome šta propušta, ili `null`
- `xrefs`: veze ka istoj vežbi u drugim katalozima, svaka napravljena kao `auto` ili `confirmed`
