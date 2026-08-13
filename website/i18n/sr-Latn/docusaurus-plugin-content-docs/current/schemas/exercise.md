---
title: Šema vežbe
description: JSON šema za model podataka vežbe
sidebar_position: 2
---

# Šema vežbe (v1.1.0)

Šema vežbe definiše osnovni model podataka za fitnes vežbe. Uključuje klasifikaciju, ciljane mišiće, zahteve za opremom i medijske sadržaje.

## Lokacija šeme

**URL:** `https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json`

**Preuzimanje:** [exercise.schema.json](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json)

## Primeri

Pogledajte primere vežbi:
- [Osnovna vežba](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.json)
- [Kardio vežba](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.cardio.json)
- [Vežba mobilnosti](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.mobility.json)
- [Vežba na mašini](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.machine.json)
- [Unilateralna vežba](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.unilateral.json)

## Specifikacija

Za detaljne informacije o modelu podataka vežbe pogledajte [RFC-001: Model podataka vežbe](../specifications/rfc-001-exercise-data-model).

## Ključna polja

- `id`: UUID identifikator
- `schemaVersion`: string verzije (npr. "1.0.0")
- `canonical`: standardizovano imenovanje sa slug vrednošću i alijasima
- `classification`: tip vežbe, mehanika, sila, nivo, kinetički lanac
- `targets`: primarni i sekundarni ciljani mišići sa nivoima aktivacije
- `equipment`: obavezna, opciona i alternativna oprema
- `media`: slike, video-zapisi i dijagrami
- `metadata`: status, vremenske oznake, autorstvo
