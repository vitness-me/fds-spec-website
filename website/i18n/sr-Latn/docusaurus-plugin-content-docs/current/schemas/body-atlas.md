---
title: Šema atlasa tela
description: JSON šema za model podataka atlasa tela
sidebar_position: 6
---

# Šema atlasa tela (v1.1.0)

Šema atlasa tela definiše strukture interaktivne vizualizacije tela sa više prikaza, oblastima i vezama ka mišićima.

## Lokacija šeme

**URL:** `https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.schema.json`

**Preuzimanje:** [body-atlas.schema.json](https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.schema.json)

`v1.0.0` ostaje objavljena i zamrznuta na sopstvenom URL-u. 1.1.0 je čisto aditivna, pa se svaki 1.0.0 dokument validira prema njoj nepromenjen.

## Primeri

Pogledajte primere atlasa tela:
- [Osnovni atlas tela](https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.example.json)

## Specifikacija

Za detaljne informacije o modelu podataka atlasa tela pogledajte [RFC-005: Model podataka atlasa tela](../specifications/rfc-005-body-atlas-data-model).

## Ključna polja

- `id`: UUID identifikator
- `schemaVersion`: string verzije (npr. "1.1.0")
- `canonical`: standardizovano imenovanje sa slug vrednošću i alijasima
- `views`: različiti prikazi tela (spreda, otpozadi, sa strane) sa vizuelnim sadržajima
- `views[].asset.license` i `views[].asset.attribution`: opcioni uslovi i tekst zasluga za ilustraciju svakog prikaza (1.1.0). Odsustvo `license` znači da uslovi nisu navedeni, a ne da je ilustracija slobodna za upotrebu
- `areas`: interaktivne oblasti koje se mogu kliknuti, mapirane na mišiće
- `metadata`: status, vremenske oznake, autorstvo
