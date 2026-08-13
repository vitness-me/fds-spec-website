---
title: Šema kategorije mišića
description: JSON šema za model podataka kategorije mišića
sidebar_position: 5
---

# Šema kategorije mišića (v1.0.0)

Šema kategorije mišića definiše grupisanja i kategorizacije mišića sa fleksibilnim označavanjem i metapodacima.

## Lokacija šeme

**URL:** `https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`

**Preuzimanje:** [muscle-category.schema.json](https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json)

## Primeri

Pogledajte primere kategorija mišića:
- [Osnovna kategorija](https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.example.json)

## Specifikacija

Za detaljne informacije o modelu podataka kategorije mišića pogledajte [RFC-004: Model podataka kategorije mišića](../specifications/rfc-004-muscle-category-data-model).

## Ključna polja

- `id`: UUID identifikator
- `schemaVersion`: string verzije (npr. "1.0.0")
- `canonical`: standardizovano imenovanje sa slug vrednošću i alijasima
- `classification`: oznake kategorije i atributi
- `metadata`: status, vremenske oznake, autorstvo
