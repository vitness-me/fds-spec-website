---
title: Šema atlasa tela
description: JSON šema za model podataka atlasa tela
sidebar_position: 6
---

# Šema atlasa tela (v1.0.0)

Šema atlasa tela definiše strukture interaktivne vizualizacije tela sa više prikaza, oblastima i vezama ka mišićima.

## Lokacija šeme

**URL:** `https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.schema.json`

**Preuzimanje:** [body-atlas.schema.json](https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.schema.json)

## Primeri

Pogledajte primere atlasa tela:
- [Osnovni atlas tela](https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.example.json)

## Specifikacija

Za detaljne informacije o modelu podataka atlasa tela pogledajte [RFC-005: Model podataka atlasa tela](../specifications/rfc-005-body-atlas-data-model).

## Ključna polja

- `id`: UUID identifikator
- `schemaVersion`: string verzije (npr. "1.0.0")
- `canonical`: standardizovano imenovanje sa slug vrednošću i alijasima
- `views`: različiti prikazi tela (spreda, otpozadi, sa strane) sa vizuelnim sadržajima
- `areas`: interaktivne oblasti koje se mogu kliknuti, mapirane na mišiće
- `metadata`: status, vremenske oznake, autorstvo
