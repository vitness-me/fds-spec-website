---
title: 'RFC-005: Model podataka atlasa tela'
description: Standardizovani model vizuelizacije tela za aktivaciju mišića i interaktivne anatomske prekrivne slojeve
sidebar_position: 5
keywords: [body atlas, visualization, anatomy, heatmap, data model, json schema, rfc]
---

# RFC-005: Specifikacija modela podataka atlasa tela

**Status**: Nacrt
**Verzija**: 0.1.0
**Datum**: 2025-09-09
**Autori**: VITNESS tim
**Kategorija**: Standards Track

## Sažetak

Ova specifikacija definiše standardizovani model atlasa tela koji se koristi za vizuelizaciju aktivacije mišića i srodnih prekrivnih slojeva u fitnes aplikacijama. Atlas tela obezbeđuje resurse prikaza (npr. SVG datoteke prednjeg/zadnjeg prikaza) i stabilan skup imenovanih oblasti vezanih za oblike unutar tih resursa. Drugi entiteti (npr. mišići) referenciraju oblasti atlasa da bi prikazali interoperabilne toplotne mape.

## 1. Uvod

### 1.1. Pozadina

Mnoge fitnes aplikacije vizuelizuju aktivaciju mišića pomoću dijagrama ljudskog tela. Istorijski, oni su bili čvrsto vezani za vlasničke slike i koordinate, što je ograničavalo interoperabilnost. Atlas tela razdvaja vizuelni sadržaj od podataka tako što obezbeđuje stabilan sistem imenovanja oblasti i mehanizam vezivanja tih oblasti za konkretne resurse.

### 1.2. Ciljevi

- Definisati model atlasa za višekratnu upotrebu, sa prikazima, resursima i imenovanim oblastima.  
- Omogućiti da mišići, vežbe i izveštaji referenciraju oblasti atlasa na prenosiv način.  
- Podržati evoluciju resursa bez narušavanja referenci (nove verzije atlasa).  
- Zadržati geometriju prikazivanja izvan osnovnih zapisa entiteta.

### 1.3. Obuhvat

**U obuhvatu:**
- Prikazi atlasa i resursi (npr. SVG datoteke)
- Imenovane oblasti sa vezivanjima po prikazu (selektorima)
- Pravila verzionisanja i kompatibilnosti
- JSON šema i referentni primeri

**Van obuhvata:**
- Pipeline-ovi prikazivanja, skale boja ili teme korisničkog interfejsa
- Specifikacije 3D modela izvan referenciranja resursa
- Poligoni po mišiću ili po vežbi unutar osnovnih šema entiteta

## 2. Terminologija

- **Atlas**: Kolekcija prikaza i imenovanih oblasti vezanih za resurse (npr. SVG datoteke) radi vizuelizacije.
- **Prikaz**: Perspektiva tela (prednja, zadnja, bočna itd.).
- **Oblast**: Imenovani region sa vezivanjima za oblike/selektore u jednom ili više prikaza.
- **Vezivanje**: Mapiranje između oblasti i oblika u prikazu (npr. CSS/SVG selektor).

## 3. Osnovni strukturni zahtevi

### 3.1. Obavezna polja

:::danger MORA
Svi usaglašeni zapisi atlasa **MORAJU** da uključuju:
:::

```json
{
  "schemaVersion": "1.0.0",
  "id": "atlas.body.v1",
  "canonical": {
    "name": "FDS Body Atlas v1",
    "slug": "body-atlas-v1",
    "aliases": ["Standard Body Atlas"],
    "localized": [ { "lang": "sr", "name": "Atlas tela v1" } ]
  },
  "views": [
    { "id": "anterior", "kind": "anterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/anterior.svg" } }
  ],
  "areas": [
    {
      "id": "thigh.left.anterior",
      "canonical": { "name": "Left Anterior Thigh", "slug": "thigh-left-anterior" },
      "bindings": [ { "viewId": "anterior", "selector": "#area-thigh-left" } ]
    }
  ],
  "metadata": {
    "createdAt": "2025-09-03T12:00:00Z",
    "updatedAt": "2025-09-03T12:00:00Z",
    "source": "vitness.atlas",
    "status": "active"
  }
}
```

### 3.2. Prikazi
- `views[*].id` je stabilan identifikator koji se koristi u `areas[*].bindings[*].viewId`.
- `views[*].kind` je jedno od `anterior`, `posterior`, `left-lateral`, `right-lateral`, `superior`, `inferior`.
- `views[*].asset` TREBALO BI da bude SVG radi najbolje prenosivosti (drugi tipovi su dozvoljeni).

### 3.3. Oblasti i vezivanja
- `areas[*].id` je stabilan, globalni identifikator oblasti (preporučuje se tačkasta notacija, npr. `thigh.left.anterior`).
- `areas[*].bindings[*].selector` je string pogodan za odabir oblika u povezanom resursu (npr. `#area-thigh-left`).
- Oblast MOŽE da se veže za više prikaza.

## 4. Referentne strukture

### 4.1. Kanonske informacije

`canonical` nosi identitet atlasa: prikazno `name`, stabilan `slug`, opcioni `description`, opcione `aliases` i `localized` unose. Svaki lokalizovani unos je `lang` oznaka sa `name` na tom jeziku, i opciono sopstvenim `description` i `aliases`.

`metadata` prati zajedničku definiciju iz RFC-001 — vremenske oznake, status i izvor. Atlas su verzionisani referentni podaci kao i svaki drugi entitet, a konzument koji ga je keširao mora da zna kada se promenio.

```json fds:fragment entity=body-atlas
{
  "canonical": {
    "name": "FDS Body Atlas v1",
    "slug": "body-atlas-v1",
    "aliases": ["Standard Body Atlas"],
    "localized": [ { "lang": "sr", "name": "Atlas tela v1" } ]
  }
}
```

### 4.2. Prikazi

Svaki prikaz nosi `id`, `kind` koji imenuje koji aspekt tela prikazuje, i `asset` — objekat sa `type` i `uri` koji pokazuje na sliku. Tip se navodi umesto da se izvodi iz ekstenzije URI-ja, jer konzument koji ne ume da prikaže format mora to da zna pre nego što ga preuzme.

Prikazi su razlog što atlas postoji kao zaseban entitet: isti mišić se pojavljuje u više njih, na različitim koordinatama, a vezivanje mišića za jednu sliku učinilo bi atlas neupotrebljivim za bilo koju drugu.

```json fds:fragment entity=body-atlas
{
  "views": [
    { "id": "anterior", "kind": "anterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/anterior.svg" } },
    { "id": "posterior", "kind": "posterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/posterior.svg" } }
  ]
}
```

### 4.3. Oblasti

Oblast je region koji se može kliknuti. Nosi `id`, sopstveni `canonical` blok — oblasti se imenuju i lokalizuju tačno kao entiteti, jer su ono što korisnik vidi i dodiruje — i `bindings` koja je smeštaju u jedan ili više prikaza.

Svako vezivanje uparuje `viewId` sa `selector`-om u resurs tog prikaza. Oblast može da se veže za više prikaza, što je upravo ono što omogućava da jedno isticanje prati mišić od prednje ilustracije do zadnje.

```json fds:fragment entity=body-atlas
{
  "areas": [
    {
      "id": "thigh.left.anterior",
      "canonical": { "name": "Left Anterior Thigh", "slug": "thigh-left-anterior" },
      "bindings": [ { "viewId": "anterior", "selector": "#area-thigh-left" } ]
    },
    {
      "id": "back.lower.posterior",
      "canonical": { "name": "Lower Back", "slug": "lower-back", "localized": [ { "lang": "sr", "name": "Donja leđa" } ] },
      "bindings": [ { "viewId": "posterior", "selector": "#area-lower-back" } ]
    }
  ]
}
```

## 5. Verzionisanje i kompatibilnost

- Zapisi atlasa prate SemVer u `schemaVersion`.
- Uvođenje novih prikaza ili oblasti je sporedna nadogradnja ako ne poništava postojeće reference.
- Preimenovanje ili uklanjanje postojećih oblasti je glavna nadogradnja i NE SME da se dogodi u sporednim izdanjima.
- Više verzija atlasa može postojati istovremeno; entiteti koji ga referenciraju TREBALO BI da navedu nameravani `atlasId`.

## 6. Smernice za implementaciju

### 6.1. Referenciranje iz mišića

Mišići MOGU da referenciraju oblasti atlasa da bi izrazili toplotne mape (pogledajte RFC‑003):
```json fds:fragment entity=muscle
{
  "heatmap": {
    "atlasId": "atlas.body.v1",
    "regions": [
      { "areaId": "thigh.left.anterior", "weight": 1.0 },
      { "areaId": "thigh.right.anterior", "weight": 1.0 }
    ]
  }
}
```

### 6.2. Agregacija

Konzumenti MOGU da kombinuju više toplotnih mapa po `areaId` unutar istog `atlasId` koristeći `max(weight)` ili ograničen zbir `min(1.0, sum(weights))`.

### 6.3. Isporuka resursa
- Preferirajte SVG datoteke sa različitim, stabilnim ID-jevima za oblike koji se mogu odabrati.
- Koristite HTTPS URI-je; razmotrite keš zaglavlja i ETag-ove.

## 7. Razmatranja bezbednosti i privatnosti
- Zapisi atlasa ne sadrže lične podatke (PII); hosting resursa tretirajte bezbedno.
- Validirajte selektore i URI-je; izbegavajte ubrizgavanje koda kroz nepouzdan SVG sadržaj.

## 8. Referenca JSON šeme
- **Atlas tela**: `/specification/schemas/atlas/v1.0.0/body-atlas.schema.json`

## 8.1. Validacija

Validirajte pomoću Ajv (Draft 2020‑12):
```
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/atlas/v1.0.0/body-atlas.schema.json \
  -d specification/schemas/atlas/v1.0.0/body-atlas.example.json
```

## 9. Primer

Pogledajte `/specification/schemas/atlas/v1.0.0/body-atlas.example.json`.

## Usaglašenost

**Usaglašeni proizvođači podataka:**

:::danger MORA
- **MORAJU** da emituju JSON koji se validira prema šemi atlasa tela za deklarisani `schemaVersion`.
- **MORAJU** da obezbede stabilne `views[*].id` i `areas[*].id`.
:::

:::tip TREBALO BI
- **TREBALO BI** da preferiraju SVG resurse i stabilne selektore.
:::

**Usaglašeni konzumenti:**

:::danger MORA
- **MORAJU** da validiraju dolazne podatke atlasa.
- **MORAJU** da razreše parove `viewId` i `selector` po vezivanju oblasti.
:::

:::tip TREBALO BI
- **TREBALO BI** da ignorišu nepoznata opciona polja pod `attributes` i `extensions`.
:::

**Kompatibilnost:**

:::danger MORA
- Opciona dodavanja (nove oblasti/prikazi) **NE SMEJU** da naruše rad konzumenata.
- Uklanjanje/preimenovanje oblasti je nekompatibilna izmena i zahteva **GLAVNU** verziju.
:::

## 10. Reference
- [RFC‑003: Specifikacija modela podataka mišića](./rfc-003-muscle-data-model.md)

---

Obaveštenje o autorskim pravima  
Copyright (c) 2025 VITNESS.
Ovaj dokument podleže pravima, licencama i ograničenjima sadržanim u VITNESS Open Standards License Agreement. Pogledajte `/specification/VITNESS Open Standards License Agreement.md`.
