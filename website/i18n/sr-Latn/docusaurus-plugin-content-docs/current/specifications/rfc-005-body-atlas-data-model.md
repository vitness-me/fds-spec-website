---
title: 'RFC-005: Model podataka atlasa tela'
description: Standardizovani model vizuelizacije tela za aktivaciju mišića i interaktivne anatomske prekrivne slojeve
sidebar_position: 5
keywords: [body atlas, visualization, anatomy, heatmap, data model, json schema, rfc]
---

# RFC-005: Specifikacija modela podataka atlasa tela

**Status**: Nacrt
**Verzija**: 0.2.0
**Datum**: 2026-11-14
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
  "schemaVersion": "1.1.0",
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
- `views[*].asset` MOŽE da navede uslove ilustracije u `license` i `attribution` (§4.2).

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

#### Licenca i atribucija

Od verzije šeme 1.1.0 resurs MOŽE da nosi dva opciona stringa, `license` i `attribution`. Oni navode uslove za ilustraciju na `uri`. Sva ostala mesta na kojima FDS pokazuje na sliku to već rade: medijske stavke nose ista dva polja. Bez njih atlas nije mogao da kaže pod kojim uslovima se njegovi sopstveni crteži smeju koristiti.

`license` imenuje uslove pod kojima se resurs sme koristiti.

- Proizvođač TREBALO BI da koristi SPDX identifikator ili SPDX izraz licence kada postoji odgovarajući, na primer `Apache-2.0`, `CC-BY-4.0` ili `Apache-2.0 OR MIT`. Kada ne postoji, proizvođač MOŽE da koristi slobodan tekst.
- **Odsustvo znači da uslovi nisu navedeni, a ne javno dobro.** Konzument NE SME da tretira nedostajuću `license` kao dozvolu da koristi, menja ili dalje distribuira resurs. To je značenje koje RFC-008 §4.8 daje polju `authorship.license`.
- `license` opisuje resurs, a ne dokument atlasa. Nazivi, id-jevi i vezivanja oblasti su drugo delo i mogu imati drugog vlasnika.
- Svaki prikaz navodi sopstvene uslove, jer prikazi mogu poticati iz različitih izvora.

`attribution` je tekst zasluga koji uslovi resursa traže da primalac prikaže. Proizvođač TREBALO BI da ga postavi kada licenca zahteva navođenje zasluga, kao što to rade Apache-2.0 i sve CC-BY licence. Ne zamenjuje obaveze obaveštenja same licence: Apache-2.0 §4(d), na primer, zahteva od onoga ko dalje distribuira da prenese sadržaj NOTICE datoteke dela. `attribution` pomaže primaocu da pronađe tu obavezu, ali je ne ispunjava.

Nijedno od dva polja nema enum ni obrazac. SPDX lista raste, obrazac bi odbacio izraze i legitimne uslove u slobodnom tekstu, a kasnije pooštravanje polja je nekompatibilna izmena.

```json fds:fragment entity=body-atlas
{
  "views": [
    {
      "id": "anterior",
      "kind": "anterior",
      "asset": {
        "type": "svg",
        "uri": "https://assets.vitness.me/body-atlas/v1.1.0/anterior.svg",
        "license": "Apache-2.0",
        "attribution": "Body Muscles, Copyright 2024 Ivan Vulović"
      }
    }
  ]
}
```

`v1.1.0` u tom URL-u je sopstveno izdanje ilustracije. Nema veze sa verzijom šeme.

U kompletnom dokumentu ispod, dva prikaza potiču iz različitih izvora. Konzument sme dalje da distribuira prednji crtež pod CC-BY-4.0 ako prikaže tekst zasluga. NE SME da pretpostavi da sme dalje da distribuira zadnji crtež, čiji uslovi nisu navedeni.

```json fds:document entity=body-atlas
{
  "schemaVersion": "1.1.0",
  "id": "atlas.body.example",
  "canonical": { "name": "Example Body Atlas", "slug": "example-body-atlas" },
  "views": [
    {
      "id": "anterior",
      "kind": "anterior",
      "asset": {
        "type": "svg",
        "uri": "https://cdn.example.com/atlas/anterior.svg",
        "license": "CC-BY-4.0",
        "attribution": "Anterior illustration by Example Studio"
      }
    },
    {
      "id": "posterior",
      "kind": "posterior",
      "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/posterior.svg" }
    }
  ],
  "areas": [
    {
      "id": "thigh.left.anterior",
      "canonical": { "name": "Left Anterior Thigh", "slug": "thigh-left-anterior" },
      "bindings": [ { "viewId": "anterior", "selector": "#area-thigh-left" } ]
    },
    {
      "id": "back.lower.posterior",
      "canonical": { "name": "Lower Back", "slug": "lower-back" },
      "bindings": [ { "viewId": "posterior", "selector": "#area-lower-back" } ]
    }
  ],
  "metadata": {
    "createdAt": "2026-11-14T12:00:00Z",
    "updatedAt": "2026-11-14T12:00:00Z",
    "status": "active"
  }
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

<!-- fds:pin atlas/v1.0.0/body-atlas.schema.json — the 1.1.0 revision note names the superseded version deliberately, because releases 1.0.0 through 1.4.0 declare body-atlas at 1.0.0 and a client pinned to any of them must keep resolving it. New work uses 1.1.0. -->

**1.1.0** je dodala opcione `license` i `attribution` na resurs prikaza (§4.2), kako bi atlas mogao da navede uslove svoje ilustracije onako kako to medijske stavke već rade. Oba su opciona dodavanja zatvorenom objektu. Svaki 1.0.0 dokument ostaje validan nepromenjen, ali 1.1.0 dokument koji koristi bilo koje od ta dva polja šema 1.0.0 odbacuje, i upravo to ga čini verzijom, a ne izmenom. `atlas/v1.0.0/body-atlas.schema.json` ostaje objavljena i zamrznuta. Izdanja od 1.0.0 do 1.4.0 deklarišu body-atlas na 1.0.0 i i dalje se razrešavaju, a izdanje 1.5.0 je prvo koje ga deklariše na 1.1.0.

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
- `attribution` je nepouzdan tekst koji se prikazuje pored ilustracije. Prikažite ga kao običan tekst i escape-ujte ga; nikada ga ne tumačite kao markup.
- `license` je tvrdnja proizvođača, a ne proverena dozvola. FDS je ne proverava.

## 8. Referenca JSON šeme
- **Atlas tela**: `/specification/schemas/atlas/v1.1.0/body-atlas.schema.json`

## 8.1. Validacija

Validirajte pomoću Ajv (Draft 2020‑12):
```
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/atlas/v1.1.0/body-atlas.schema.json \
  -d specification/schemas/atlas/v1.1.0/body-atlas.example.json
```

## 9. Primer

Pogledajte `/specification/schemas/atlas/v1.1.0/body-atlas.example.json`.

## Usaglašenost

**Usaglašeni proizvođači podataka:**

:::danger MORA
- **MORAJU** da emituju JSON koji se validira prema šemi atlasa tela za deklarisani `schemaVersion`.
- **MORAJU** da obezbede stabilne `views[*].id` i `areas[*].id`.
:::

:::tip TREBALO BI
- **TREBALO BI** da preferiraju SVG resurse i stabilne selektore.
- **TREBALO BI** da navedu `license` na svakom prikazu čiji su uslovi resursa poznati, i `attribution` gde ti uslovi zahtevaju navođenje zasluga.
:::

**Usaglašeni konzumenti:**

:::danger MORA
- **MORAJU** da validiraju dolazne podatke atlasa.
- **MORAJU** da razreše parove `viewId` i `selector` po vezivanju oblasti.
- **NE SMEJU** da tretiraju odsustvo `license` kao dozvolu da koriste, menjaju ili dalje distribuiraju resurs.
:::

:::tip TREBALO BI
- **TREBALO BI** da ignorišu nepoznata opciona polja pod `attributes` i `extensions`.
- **TREBALO BI** da sačuvaju `license` i `attribution` nepromenjene kroz svaku transformaciju koja prenosi prikaz dalje, i da prikažu ili proslede `attribution` gde god prikazuju ili dalje distribuiraju resurs.
:::

**Kompatibilnost:**

:::danger MORA
- Opciona dodavanja (nove oblasti/prikazi) **NE SMEJU** da naruše rad konzumenata.
- Uklanjanje/preimenovanje oblasti je nekompatibilna izmena i zahteva **GLAVNU** verziju.
:::

## 10. Reference
- [RFC‑003: Specifikacija modela podataka mišića](./rfc-003-muscle-data-model.md)
- [RFC‑008: Specifikacija modela podataka trenažnog programa](./rfc-008-program-data-model.md), §4.8 `authorship`
- SPDX lista licenci — https://spdx.org/licenses/

---

Obaveštenje o autorskim pravima  
Copyright (c) 2025 VITNESS.
Ovaj dokument podleže pravima, licencama i ograničenjima sadržanim u VITNESS Open Standards License Agreement. Pogledajte `/specification/VITNESS Open Standards License Agreement.md`.
