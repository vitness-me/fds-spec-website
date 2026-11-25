---
title: Šema opreme
description: JSON šema za model podataka opreme
sidebar_position: 3
---

# Šema opreme (v1.2.0)

Šema opreme definiše entitete fitnes opreme sa klasifikacijom, metapodacima i proširivim atributima.

## Lokacija šeme

**URL:** `https://spec.vitness.me/schemas/equipment/v1.2.0/equipment.schema.json`

**Preuzimanje:** [equipment.schema.json](https://spec.vitness.me/schemas/equipment/v1.2.0/equipment.schema.json)

## Primeri

Pogledajte primere opreme:
- [Osnovna oprema](https://spec.vitness.me/schemas/equipment/v1.2.0/equipment.example.json)
- [Mašina sa svojim FXE deskriptorom (nacrt, RFC-010)](https://spec.vitness.me/schemas/equipment/v1.2.0/equipment.example.descriptors.json)

## Specifikacija

Za detaljne informacije o modelu podataka opreme pogledajte [RFC-002: Model podataka opreme](../specifications/rfc-002-equipment-data-model).

## Ključna polja

- `id`: UUID identifikator
- `schemaVersion`: string verzije (npr. "1.0.0")
- `canonical`: standardizovano imenovanje sa slug vrednošću i alijasima
- `classification`: tip i kategorija opreme
- `attributes`: fleksibilno skladište ključ–vrednost za svojstva specifična za opremu
- `metadata`: status, vremenske oznake, autorstvo
- `fxe`: opcioni FXE deskriptor opreme (RFC-010), standardni ili sa proširenim slojevima detalja konstrukcije
