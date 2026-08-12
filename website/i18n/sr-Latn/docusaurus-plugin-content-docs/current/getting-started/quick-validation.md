---
title: Brza validacija
description: Validirajte svoje FDS podatke prema JSON šemama
sidebar_position: 2
---

# Vodič za brzu validaciju

Validirajte FDS dokumente prema objavljenim šemama pomoću Ajv-a (Draft 2020-12).

Komande ispod pokreću se iz preuzete kopije [repozitorijuma specifikacije](https://github.com/vitness-me/fds-spec-website) i ne zahtevaju ništa instalirano osim npm-a: `npx` preuzima validator (`ajv-cli`) i dodatak za formate (`ajv-formats`) koje imenuje. Svaka komanda validira primer isporučen uz šemu; da biste validirali sopstveni izvoz, zamenite putanju uz `-d` putanjom svoje datoteke.

## Validacija primera

### Šema vežbe

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```

### Šema opreme

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/equipment/v1.1.0/equipment.schema.json \
  -d specification/schemas/equipment/v1.1.0/equipment.example.json
```

## Lokacije šema

Svaka šema se služi i sa zamrznutog URL-a pod `https://spec.vitness.me/schemas/` — isti bajtovi kao kopije u repozitorijumu. Kompletan skup, u verzijama koje trenutno izdanje objavljuje, nalazi se u mašinski čitljivom manifestu izdanja na [https://spec.vitness.me/releases.json](https://spec.vitness.me/releases.json); [referenca šema](/docs/schemas) na ovom sajtu dokumentuje svaku od njih.

Ako radite bez preuzete kopije repozitorijuma, preuzmite šemu sa njenog URL-a i prosledite ime preuzete datoteke opciji `-s` — `ajv-cli` čita šeme sa diska, ne preuzima URL-ove.

## Sledeći koraci

- [Istražite šeme interaktivno](/docs/schemas/exercise)
- [Pregledajte specifikacije](/docs/specifications/rfc-001-exercise-data-model)
