---
title: Šema mišića
description: JSON šema za model podataka mišića
sidebar_position: 4
---

# Šema mišića (v1.0.0)

Šema mišića definiše entitete anatomskih mišića sa klasifikacijom, podacima za vizualizaciju toplotnom mapom i metapodacima.

## Lokacija šeme

**URL:** `https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.schema.json`

**Preuzimanje:** [muscle.schema.json](https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.schema.json)

## Primeri

Pogledajte primere mišića:
- [Osnovni mišić](https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.example.json)
- [Mišić lats](https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.example.lats.json)

## Specifikacija

Za detaljne informacije o modelu podataka mišića pogledajte [RFC-003: Model podataka mišića](../specifications/rfc-003-muscle-data-model).

## Ključna polja

- `id`: UUID identifikator
- `schemaVersion`: string verzije (npr. "1.0.0")
- `canonical`: standardizovano imenovanje sa slug vrednošću i alijasima
- `classification`: kategorija mišića, region, lateralnost
- `heatmap`: podaci za vizualizaciju sa regionima i vrednostima intenziteta
- `metadata`: status, vremenske oznake, autorstvo
