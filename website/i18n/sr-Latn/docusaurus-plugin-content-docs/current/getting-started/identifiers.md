---
title: Identifikatori
description: Politika UUID-a i identifikatora u FDS-u
sidebar_position: 3
---

# Politika identifikatora

## Produkcioni identifikatori

**Normativna politika:**
- Svi identifikatori resursa u produkcionim podacima **MORAJU** biti UUIDv4 niske
- Ovo važi za identifikatore kao što su `exerciseId`, `id` opreme/mišića/kategorije i sve reference između entiteta

## Identifikatori u dokumentaciji

**Politika dokumentacije:**
- Radi čitljivosti, primeri u RFC dokumentima mogu koristiti ilustrativne ID-jeve poput `eq.barbell`, `mus.quadriceps`, `cat.legs`
- Oni **NISU** važeći produkcioni ID-jevi i služe samo za prikaz odnosa i strukture

## Usaglašenost

**Usaglašeni proizvođači podataka:**
- MORAJU emitovati UUIDv4 identifikatore u stvarnim skupovima podataka

**Usaglašeni konzumenti:**
- MORAJU validirati identifikatore prema aktivnoj verziji šeme
- TREBALO BI da odbace identifikatore koji nisu UUID u produkcionim kontekstima

## Slugovi naspram ID-jeva

- **Slugovi** ostaju čitljivi kanonski identifikatori i razlikuju se od ID-jeva
- **UUID-jevi** se koriste za sistemske reference i odnose

## Spoljne reference

**URN-ovi i spoljne reference:**
- Primeri relacija MOGU prikazivati URN-ove (npr. `urn:slug:front-squat`) radi ilustracije odnosa koji nisu zasnovani na ID-jevima
- Proizvođači podataka TREBALO BI da preferiraju UUID reference kada su dostupne
- URN-ovi se MOGU koristiti za labave reference između sistema kada UUID nije poznat

### Mapiranje spoljnih referenci (`externalRefs`)

Svi FDS entiteti podržavaju opcioni niz `externalRefs` unutar objekta `metadata`. To omogućava mapiranje identifikatora između različitih sistema i platformi.

**Struktura šeme:**
```json fds:fragment entity=exercise
{
  "externalRefs": [
    { "system": "string", "id": "string" }
  ]
}
```

**Zahtevi za polja:**
- `system` (obavezno): stabilan identifikator spoljne platforme ili sistema
- `id` (obavezno): identifikator entiteta unutar tog spoljnog sistema

**Slučajevi upotrebe:**
- **Migracija podataka**: mapiranje nasleđenih ID-jeva na nove FDS UUID-jeve tokom uvoza
- **Sinhronizacija između platformi**: praćenje istog entiteta u različitim fitnes aplikacijama
- **Integracije trećih strana**: referenciranje entiteta u spoljnim API-jima ili bazama podataka
- **Revizorski tragovi**: održavanje veza ka izvornim sistemima radi porekla podataka

**Dobre prakse za imenovanje `system` vrednosti:**
- Koristite stabilne, dobro dokumentovane identifikatore
- Razmotrite obrnutu DNS notaciju radi jedinstvenosti (npr. `com.example.app`)
- Održavajte imena sistema doslednim u celom skupu podataka
- Dokumentujte svoje identifikatore sistema za konzumente

**Primer:**
```json fds:fragment entity=exercise
{
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-09-03T00:00:00Z",
    "status": "active",
    "externalRefs": [
      { "system": "platform-a", "id": "ex-back-squat-001" },
      { "system": "legacy-system", "id": "squat_barbell_back" }
    ]
  }
}
```

Ova struktura je dostupna na svim FDS entitetima: Exercise, Equipment, Muscle, Muscle Category i Body Atlas
