---
title: 'RFC-004: Model podataka kategorije mišića'
description: Standardizovani model podataka za sisteme kategorizacije i grupisanja mišića
sidebar_position: 4
keywords: [muscle category, grouping, data model, json schema, interoperability, rfc]
---

# RFC-004: Specifikacija modela podataka kategorije mišića

**Status**: Nacrt
**Verzija**: 0.1.0
**Datum**: 2025-09-09
**Autori**: VITNESS tim
**Kategorija**: Standards Track

## Sažetak

Ova specifikacija definiše standardizovani model podataka za informacije o kategorijama mišića kako bi se omogućile interoperabilnost i prenosivost podataka između fitnes aplikacija i platformi. Ovaj RFC uspostavlja strukturne zahteve za podatke o kategorijama mišića, a pritom dozvoljava platformama da zadrže sopstvene sisteme grupisanja i hijerarhije kategorizacije.

## 1. Uvod

### 1.1. Pozadina

Fitnes aplikacije zahtevaju dosledne definicije kategorija mišića za organizaciju treninga, strukturu trenažnih programa i vizuelizaciju praćenja napretka. Trenutno svaka platforma održava zasebne sisteme grupisanja mišića i hijerarhije kategorizacije, što stvara fragmentaciju podataka i ograničava interoperabilnost.

### 1.2. Ciljevi

Ova specifikacija ima za cilj da:
1. Definiše strukturne zahteve za razmenu podataka o kategorijama mišića
2. Omogući neometanu migraciju podataka o kategorijama mišića između fitnes aplikacija
3. Podrži atribute kategorizacije specifične za platformu kroz mehanizme ekstenzija
4. Uspostavi dosledne obrasce identifikacije i klasifikacije kategorija mišića
5. Obezbedi referentnu implementaciju JSON šeme za validaciju

### 1.3. Obuhvat

**U obuhvatu:**
- Osnovna struktura podataka kategorije mišića i obavezna polja
- Mehanizmi ekstenzija za trenažne podatke specifične za platformu
- Definicije JSON šeme i pravila validacije
- Reference na medije i dokumentaciju kategorija mišića
- Podrška za internacionalizaciju imena kategorija

**Van obuhvata:**
- Konkretne trenažne metodologije ili sistemi programiranja
- Biomehanička analiza i obrasci pokreta (budući RFC)
- Individualno programiranje treninga i periodizacija
- Praćenje trenažnog opterećenja i oporavka u realnom vremenu

## 2. Terminologija

- **Kategorija mišića**: Logičko grupisanje povezanih mišića u trenažne i organizacione svrhe
- **Kanonski podaci**: Standardizovane identifikacione informacije (naziv, slug, alijasi)
- **Klasifikacija**: Fleksibilna kategorizacija pomoću oznaka
- **Ekstenzija**: Podaci specifični za platformu koji ne narušavaju interoperabilnost
- **Verzija šeme**: Semantička verzija koja označava kompatibilnost modela podataka

## 3. Osnovni strukturni zahtevi

### 3.1. Obavezna polja

:::danger MORA
Svi usaglašeni podaci o kategorijama mišića **MORAJU** da uključuju sledeća polja:
:::

```json fds:document entity=muscle-category
{
  "schemaVersion": "1.0.0",
  "id": "cat.legs",
  "canonical": {
    "name": "Legs",
    "slug": "legs"
  },
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-09-03T00:00:00Z",
    "source": "vitness.registry",
    "status": "active"
  }
}
```

### 3.2. Opciona standardna polja

Uobičajeno podržana opciona polja koja unapređuju interoperabilnost:

```json fds:fragment entity=muscle-category partial
{
  "canonical": {
    "localized": [
      { "lang": "sr", "name": "Noge" }
    ]
  },
  "classification": {
    "tags": ["major-group", "compound-movements"]
  },
  "media": [],
  "attributes": {
    "complexity": "high",
    "trainingPriority": "essential"
  }
}
```

### 3.3. Mehanizmi ekstenzija

Dve tačke ekstenzija za podatke specifične za platformu:

#### 3.3.1. Atributi (strukturirane ekstenzije)
Za uobičajene ekstenzije koje mogu postati standardizovane:
```json fds:fragment entity=muscle-category
{
  "attributes": {
    "complexity": "high",
    "trainingPriority": "essential"
  }
}
```

#### 3.3.2. Ekstenzije (specifične za platformu)
Za složene strukture podataka jedinstvene za platformu:
```json fds:fragment entity=muscle-category
{
  "extensions": {
    "x:programming": {
      "weeklyVolume": "high",
      "recoveryTime": "48-72hrs"
    }
  }
}
```

## 4. Referentni tipovi i strukture

### 4.1. Kanonske informacije

`canonical` nosi identitet kategorije — prikazni naziv, slug, kao i opcione alijase i lokalizovane nazive. Imena kategorija su ona koja se najčešće pojavljuju u korisničkom interfejsu, što lokalizaciju ovde čini vidljivijom nego bilo gde drugde u katalogu.

```json fds:fragment entity=muscle-category
{
  "canonical": {
    "name": "Legs",
    "slug": "legs",
    "localized": [
      { "lang": "sr", "name": "Noge" }
    ]
  }
}
```

### 4.2. Struktura klasifikacije

`classification` nosi `tags` za filtriranje — na primer, `major-group` razlikuje šačicu grupisanja najvišeg nivoa od finijih. Oznake nemaju strukturnu posledicu: konzument koji neku ne prepoznaje ignoriše je.

```json fds:fragment entity=muscle-category
{
  "classification": {
    "tags": ["major-group", "compound-movements"]
  }
}
```

### 4.3. Reference na medije

`media` prati zajedničku definiciju iz RFC-001 — tipično ikonica ili ilustracija koja predstavlja grupu.

```json fds:fragment entity=muscle-category
{
  "media": [
    {
      "type": "image",
      "uri": "https://cdn.example.com/categories/legs-overview.jpg"
    }
  ]
}
```

## 5. Verzionisanje i kompatibilnost

### 5.1. Verzionisanje šeme

Prati semantičko verzionisanje:
- **Glavna**: Nekompatibilne izmene obaveznih polja
- **Sporedna**: Nova opciona polja ili vrednosti enuma
- **Zakrpa**: Ažuriranja dokumentacije i validacije

### 5.2. Pravila kompatibilnosti

- Svi podaci važeći u verziji X.Y.Z moraju ostati važeći u X.Y+1.0
- Nova obavezna polja moraju obezbediti razumne podrazumevane vrednosti
- Zastarela polja ostaju funkcionalna tokom cele glavne verzije
- Putanje migracije moraju biti dokumentovane za izmene glavne verzije

### 5.3. Primer evolucije šeme

Verzija 1.0.0 → 1.1.0 (dodavanje opcionog polja hierarchy):
```json fds:ignore a hypothetical next version illustrating how an optional field arrives; no published muscle-category schema has hierarchy
{
  "schemaVersion": "1.1.0",
  "id": "cat.legs",
  "canonical": { "name": "Legs", "slug": "legs" },
  "hierarchy": {
    "parentId": "cat.lower-body",
    "level": 2,
    "order": 1
  }
}
```

## 6. Smernice za implementaciju

### 6.1. Integracija platforme

Platforme koje implementiraju ovaj standard trebalo bi da:

1. **Održavaju interne modele**: zadrže postojeće sisteme grupisanja i kategorizacije mišića
2. **Izvoze usaglašeno**: obezbede podatke o kategorijama mišića u RFC-004 formatu radi prenosivosti
3. **Prevode pri uvozu**: mapiraju dolazne RFC-004 podatke na interne strukture
4. **Upotrebljavaju ekstenzije**: koriste imenski prostor `extensions` za podatke specifične za platformu

### 6.2. Tok rada migracije podataka

```mermaid
graph LR
    A[Platform A] --> B[RFC-004 Export]
    B --> C[Validation]
    C --> D[Platform B Import]
    D --> E[Internal Mapping]
```

1. Izvorna platforma izvozi kategorije mišića u RFC-004 formatu
2. Validacija podataka prema JSON šemi
3. Ciljna platforma uvozi i mapira na interni model
4. Prilagođene ekstenzije se obrađuju prema mogućnostima platforme

## 7. Razmatranja bezbednosti i privatnosti

- Ova specifikacija definiše samo format podataka
- Implementacije moraju validirati prema JSON šemi
- Sadržaj u ekstenzijama koji generišu korisnici trebalo bi sanitizovati
- Pratite standardne bezbednosne prakse za prenos podataka

## 8. Referenca JSON šeme

Kompletna JSON šema dostupna je na:
- **Kategorija mišića**: `/specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`

## Agregacija toplotnih mapa (informativno)

Vizuelizacije kategorija mišića TREBALO BI da se izvode agregacijom toplotnih mapa mišića koji su njihovi članovi. Kombinujte regione po `areaId` unutar istog `atlasId` (pogledajte RFC-003, toplotna mapa preko atlasa tela). Preporučene strategije:
- Maksimalna agregacija po regionu: `weight = max(weights)`.
- Ili normalizovan zbir sa gornjom granicom 1.0: `weight = min(1.0, sum(weights))`.

Proizvođači podataka TREBALO BI da izbegavaju objavljivanje zasebnih toplotnih mapa kategorija u jezgru; po potrebi, nadjačavanja specifična za platformu MOGU se obezbediti pod `extensions`.

## 8.1. Validacija

Validirajte pomoću Ajv (Draft 2020-12):

```
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json \
  -d specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.example.json
```

## 9. Primer implementacije

### 9.1. Kompletan zapis kategorije mišića „Legs“

Na osnovu referentne implementacije (`/specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.example.json`):

```json fds:document entity=muscle-category
{
  "schemaVersion": "1.0.0",
  "id": "cat.legs",
  "canonical": { 
    "name": "Legs", 
    "slug": "legs",
    "localized": [
      { "lang": "sr", "name": "Noge" }
    ]
  },
  "classification": {
    "tags": ["major-group", "compound-movements"]
  },
  "media": [],
  "attributes": {
    "complexity": "high",
    "trainingPriority": "essential"
  },
  "extensions": {
    "x:programming": {
      "weeklyVolume": "high",
      "recoveryTime": "48-72hrs"
    }
  },
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-09-03T00:00:00Z",
    "source": "vitness.registry",
    "status": "active"
  }
}
```

### 9.2. Mapiranje pri uvozu na platformu (primer u TypeScript-u)

```typescript
interface RFC004MuscleCategory {
  schemaVersion: string;
  id: string;
  canonical: {
    name: string;
    slug: string;
    aliases?: string[];
    localized?: Array<{
      lang: string;
      name: string;
      aliases?: string[];
    }>;
  };
  classification?: {
    tags?: string[];
  };
  attributes?: Record<string, any>;
  extensions?: Record<string, any>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    source: string;
    status: string;
  };
}

// Platform-specific import mapping
function importMuscleCategory(rfc004Data: RFC004MuscleCategory) {
  const category = {
    id: rfc004Data.id,
    name: rfc004Data.canonical.name,
    slug: rfc004Data.canonical.slug,
    aliases: rfc004Data.canonical.aliases || [],
    tags: rfc004Data.classification?.tags || [],
    attributes: rfc004Data.attributes || {}
  };

  // Handle programming extensions
  if (rfc004Data.extensions?.['x:programming']) {
    category.programming = rfc004Data.extensions['x:programming'];
  }

  return category;
}
```

## 10. Reference

## Usaglašenost

**Usaglašeni proizvođači podataka:**

:::danger MORA
- **MORAJU** da emituju JSON koji se validira prema šemi kategorije mišića za deklarisani `schemaVersion`.
- **MORAJU** da koriste UUIDv4 za sve identifikatore u produkcionim podacima (npr. `id` kategorije). Kratki identifikatori korišćeni kao primeri u ovom RFC-u služe samo kao ilustracija.
- **MORAJU** da popune sva obavezna polja i poštuju enumeracije i strukturu.
:::

:::tip TREBALO BI
- **TREBALO BI** da uključe RFC 3339 UTC vremenske oznake u `metadata`.
:::

**Usaglašeni konzumenti:**

:::danger MORA
- **MORAJU** da validiraju dolazne podatke o kategorijama prema odgovarajućoj verziji šeme.
- **MORAJU** da ignorišu nepoznate ključeve u `attributes` i `extensions`.
:::

:::tip TREBALO BI
- **TREBALO BI** da tolerišu dodatna opciona polja uvedena u novijim sporednim verzijama.
- **TREBALO BI** da odbace podatke kojima nedostaju obavezna polja ili koji imaju nevažeće enumeracije.
:::

**Kompatibilnost:**

:::danger MORA
- Opciona polja dodata u sporednim verzijama **NE SMEJU** da naruše rad konzumenata; konzumenti **TREBALO BI** da ignorišu nepoznata opciona polja.
- Nova obavezna polja su **GLAVNA** izmena i zahtevaju koordinisane nadogradnje.
:::

---

Dodatni resursi:
- Politika identifikatora i UUID-a: `/specification/README.md#identifiers-ids`
- Konvencije za i18n i slug: `/specification/i18n-and-slugs.md`
- Politika ekstenzija i vodič kroz registar: `/specification/extension-registry.md`


### 10.1. Normativne reference
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [RFC 3339: Datum/vreme](https://tools.ietf.org/html/rfc3339)
- [RFC-001: Specifikacija modela podataka vežbe](./rfc-001-exercise-data-model.md)
- [RFC-002: Specifikacija modela podataka opreme](./rfc-002-equipment-data-model.md)
- [RFC-003: Specifikacija modela podataka mišića](./rfc-003-muscle-data-model.md)

### 10.2. Informativne reference
- Konvencije grupisanja mišića u nauci o vežbanju
- Metodologije organizacije trenažnih programa

---

**Obaveštenje o autorskim pravima**  
Copyright (c) 2025 VITNESS.
Ovaj dokument podleže pravima, licencama i ograničenjima sadržanim u VITNESS Open Standards License Agreement. Pogledajte `/specification/VITNESS Open Standards License Agreement.md`.
