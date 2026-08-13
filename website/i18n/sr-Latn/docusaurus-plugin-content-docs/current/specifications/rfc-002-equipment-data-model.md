---
title: 'RFC-002: Model podataka o opremi'
description: Standardizovani model podataka za fitnes opremu koji omogućava interoperabilnost među platformama
sidebar_position: 2
keywords: [equipment, data model, json schema, fitness, interoperability, rfc]
---

# RFC-002: Specifikacija modela podataka o opremi

**Status**: Nacrt
**Verzija**: 0.1.0
**Datum**: 2025-09-09
**Autori**: VITNESS tim
**Kategorija**: Standards Track

## Sažetak

Ova specifikacija definiše standardizovani model podataka za informacije o fitnes opremi radi omogućavanja interoperabilnosti i prenosivosti podataka među fitnes aplikacijama i platformama. Ovaj RFC uspostavlja strukturne zahteve za podatke o opremi, dozvoljavajući platformama da zadrže sopstvene sisteme kategorizacije i taksonomije opreme.

## 1. Uvod

### 1.1. Pozadina

Fitnes aplikacije zahtevaju dosledne definicije opreme za kategorizaciju vežbi, planiranje treninga i upravljanje inventarom teretane. Trenutno svaka platforma održava odvojene taksonomije opreme, što stvara fragmentaciju podataka i ograničava interoperabilnost.

### 1.2. Ciljevi

Ova specifikacija ima za cilj da:
1. Definiše strukturne zahteve za razmenu podataka o opremi
2. Omogući neometanu migraciju podataka o opremi između fitnes aplikacija
3. Podrži atribute opreme specifične za platformu kroz mehanizme ekstenzija
4. Uspostavi dosledne obrasce identifikacije i kategorizacije opreme
5. Obezbedi referentnu implementaciju JSON šeme za validaciju

### 1.3. Obuhvat

**U obuhvatu:**
- Osnovna struktura podataka o opremi i obavezna polja
- Mehanizmi ekstenzija za podatke o opremi specifične za platformu
- Definicije JSON šema i pravila validacije
- Reference na medije i dokumentaciju opreme
- Podrška za internacionalizaciju naziva opreme

**Van obuhvata:**
- Konkretne taksonomije opreme ili katalozi brendova
- Održavanje opreme i upravljanje životnim ciklusom (budući RFC)
- Podaci o cenama i komercijalnim transakcijama
- Dostupnost opreme u realnom vremenu ili sistemi rezervacija

## 2. Terminologija

- **Oprema**: Fizički fitnes alati, mašine ili pribor koji se koriste pri izvođenju vežbi
- **Kanonski podaci**: Standardizovane identifikujuće informacije (naziv, slug, alijasi, skraćenice)
- **Klasifikacija**: Strukturni podaci o kategorizaciji korišćenjem fleksibilnih oznaka
- **Ekstenzija**: Podaci specifični za platformu koji ne narušavaju interoperabilnost
- **Verzija šeme**: Semantička verzija koja označava kompatibilnost modela podataka
- **Atributi**: Fleksibilno skladište ključ–vrednost za svojstva specifična za opremu

## 3. Osnovni strukturni zahtevi

### 3.1. Obavezna polja

:::danger MORA
Svi usaglašeni podaci o opremi **MORAJU** da sadrže ova polja:
:::

```json fds:document entity=equipment
{
  "schemaVersion": "1.1.0",
  "id": "eq.barbell",
  "canonical": {
    "name": "Barbell",
    "slug": "barbell"
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

```json fds:fragment entity=equipment partial
{
  "canonical": {
    "abbreviation": "BB",
    "aliases": ["Olympic Bar"],
    "localized": [
      { "lang": "sr", "name": "Sipka" }
    ]
  },
  "classification": {
    "tags": ["free-weight"]
  },
  "media": [
    {
      "type": "image",
      "uri": "https://example.com/barbell.jpg"
    }
  ]
}
```

### 3.3. Mehanizmi ekstenzija

Dve tačke proširenja za podatke specifične za platformu:

#### 3.3.1. Atributi (strukturirane ekstenzije)
Za uobičajene ekstenzije koje mogu postati standardizovane:
```json fds:fragment entity=equipment
{
  "attributes": {
    "standardWeight": "20kg",
    "material": "steel",
    "length": "7ft"
  }
}
```

#### 3.3.2. Ekstenzije (specifične za platformu)
Za složene strukture podataka jedinstvene za platformu:
```json fds:fragment entity=equipment
{
  "extensions": {
    "x:gym-management": {
      "inventory": {"count": 5, "location": "free-weight-area"},
      "maintenance": {"lastInspection": "2025-08-15", "nextDue": "2025-11-15"}
    }
  }
}
```

## 4. Referentni tipovi i strukture

### 4.1. Kanonske informacije

`canonical` nosi identitet opreme: prikazni `name`, stabilan `slug`, opcioni `description`, opcionu `abbreviation`, opcione `aliases` i `localized` unose koji daju naziv na drugim jezicima. Nazivi opreme variraju po regionu više nego nazivi vežbi — isti rek je "power rack", "squat cage" i "Kraftkäfig" — pa su alijasi i lokalizacija ovde važniji nego što se na prvi pogled čini. `abbreviation` nosi kratki oblik koji se koristi u kompaktnim interfejsima — "DB" za bučicu, "KB" za girju — koji implementacije inače izvode nagađanjem.

```json fds:fragment entity=equipment
{
  "canonical": {
    "name": "Barbell",
    "slug": "barbell",
    "abbreviation": "BB",
    "aliases": ["Olympic Bar"],
    "localized": [
      { "lang": "sr", "name": "Sipka" }
    ]
  }
}
```

### 4.2. Struktura klasifikacije

`classification` opisuje kakva je ovo vrsta sprave i kako se ponaša. `tags` su slobodne oznake za filtriranje i ne nose nikakvu strukturnu posledicu.

```json fds:fragment entity=equipment
{
  "classification": {
    "tags": ["free-weight"]
  }
}
```

### 4.3. Reference na medije

`media` prati zajedničku definiciju iz RFC-001: lista resursa, svaki sa tipom i URI-jem, koji ilustruju spravu.

```json fds:fragment entity=equipment
{
  "media": [
    {
      "type": "image",
      "uri": "https://cdn.example.com/equipment/barbell.jpg"
    },
    {
      "type": "video",
      "uri": "https://cdn.example.com/equipment/barbell-overview.mp4"
    }
  ]
}
```


### 4.4. Karakteristike opterećivanja

Opcioni objekat `loading` opisuje kako sprava nosi opterećenje. On je merodavan izvor za računicu sa diskovima i zaokruživanje opterećenja.

```json fds:fragment entity=equipment
{
  "loading": {
    "increment": { "value": 2.5, "unit": "kg" },
    "stackBased": false
  }
}
```

| Polje | Tip | Podrazumevano | Značenje |
|---|---|---|---|
| `increment.value` | number, > 0 | — | Najmanji upotrebljiv korak opterećenja |
| `increment.unit` | metric unit | — | Jedinica u kojoj je taj korak izražen |
| `stackBased` | boolean | `false` | Opterećenje se bira iz diskretnih pozicija u steku, a ne sastavlja od slobodnih tegova |

`increment` je ono što izračunato opterećenje čini ostvarivim. Program koji propisuje 82,5% maksimuma za jedno ponavljanje od 100 kg traži 82,5 kg; da li je to ostvarivo zavisi od sprave. Šipka opterećena parovima diskova od 1,25 kg to dostiže; stalak sa bučicama u skokovima od 2,5 kg ne dostiže. Konzumenti TREBALO BI da zaokruže izračunato opterećenje na najbliži ostvariv umnožak `increment.value`, umesto da prikažu broj koji ne može da se natovari na spravu.

`stackBased: true` signalizuje da su pozicije diskretne i da nisu uporedive između objekata. „Klin 7“ u dve teretane nije isto opterećenje čak ni na nominalno identičnim stekovima, pa poziciju u steku NE BI TREBALO tretirati kao prenosivu; metrika `resistanceLevel` (jedinica `level`) postoji da je zabeleži kao neprozirno podešavanje. Tamo gde stek objavljuje stvarne korake, `increment` ostaje prenosiv odgovor.

Ovo je pandan objektu `exercise.loading` (RFC-001 §4.6): vežba iskazuje *da li* pokret prima opterećenje, a oprema *u kojim koracima*.

## 5. Verzionisanje i kompatibilnost

### 5.1. Verzionisanje šema

Prema semantičkom verzionisanju:
- **Glavna**: Nekompatibilne izmene obaveznih polja
- **Sporedna**: Nova opciona polja ili vrednosti enuma
- **Zakrpa**: Ažuriranja dokumentacije i validacije

### 5.2. Pravila kompatibilnosti

- Svi podaci važeći u verziji X.Y.Z moraju ostati važeći u X.Y+1.0
- Nova obavezna polja moraju da obezbede razumne podrazumevane vrednosti
- Zastarela polja ostaju funkcionalna tokom cele glavne verzije
- Putanje migracije moraju biti dokumentovane za promene glavne verzije

### 5.3. Primer evolucije šeme

Verzija 1.0.0 → 1.1.0 (dodavanje opcionog polja za sertifikaciju):
```json fds:ignore a hypothetical next version illustrating how an optional field arrives; no published equipment schema has certification
{
  "schemaVersion": "1.1.0",
  "id": "eq.barbell",
  "canonical": { "name": "Barbell", "slug": "barbell" },
  "certification": {
    "standard": "IWF",
    "validUntil": "2030-12-31",
    "certifiedBy": "International Weightlifting Federation"
  }
}
```

## 6. Smernice za implementaciju

### 6.1. Integracija platformi

Platforme koje implementiraju ovaj standard trebalo bi da:

1. **Održavaju interne modele**: Zadrže postojeće kataloge opreme i kategorizaciju
2. **Izvoze usaglašeno**: Obezbede podatke o opremi u RFC-002 formatu radi prenosivosti
3. **Prevode pri uvozu**: Mapiraju dolazne RFC-002 podatke na interne strukture
4. **Koriste ekstenzije**: Koriste imenski prostor `extensions` za podatke specifične za platformu

### 6.2. Tok rada migracije podataka

```mermaid
graph LR
    A[Platform A] --> B[RFC-002 Export]
    B --> C[Validation]
    C --> D[Platform B Import]
    D --> E[Internal Mapping]
```

1. Izvorna platforma izvozi opremu u RFC-002 formatu
2. Validacija podataka prema JSON šemi
3. Odredišna platforma uvozi i mapira na interni model
4. Prilagođene ekstenzije se obrađuju u skladu sa mogućnostima platforme

## 7. Razmatranja bezbednosti i privatnosti

- Ova specifikacija definiše samo format podataka
- Implementacije moraju da validiraju prema JSON šemi
- Sadržaj u ekstenzijama koji generišu korisnici trebalo bi sanitizovati
- Pratite standardne bezbednosne prakse za prenos podataka

## 8. Referenca JSON šeme

Kompletna JSON šema je dostupna na:
- **Equipment**: `/specification/schemas/equipment/v1.1.0/equipment.schema.json`

## 8.1. Validacija

Validirajte pomoću Ajv (Draft 2020-12):

```
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/equipment/v1.1.0/equipment.schema.json \
  -d specification/schemas/equipment/v1.1.0/equipment.example.json
```

## 9. Primer implementacije

### 9.1. Kompletan zapis opreme za šipku

Na osnovu referentne implementacije (`/specification/schemas/equipment/v1.1.0/equipment.example.json`):

```json fds:document entity=equipment
{
  "schemaVersion": "1.1.0",
  "id": "eq.barbell",
  "canonical": { 
    "name": "Barbell", 
    "slug": "barbell", 
    "aliases": ["Olympic Bar"],
    "abbreviation" : "BB",
    "localized": [
      { "lang": "sr", "name": "Sipka" }
    ]
  },
  "classification": { 
    "tags": ["free-weight"]
  },
  "media": [
    {
      "type": "image",
      "uri": "https://example.com/barbell.jpg"
    }
  ],
  "attributes": {
    "standardWeight": "20kg",
    "material": "steel",
    "length": "7ft"
  },
  "extensions": {
    "x:gym-management": {
      "inventory": {"count": 5, "location": "free-weight-area"},
      "maintenance": {"lastInspection": "2025-08-15", "nextDue": "2025-11-15"}
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

### 9.2. Mapiranje uvoza na platformi (TypeScript primer)

```typescript
interface RFC002Equipment {
  schemaVersion: string;
  id: string;
  canonical: {
    name: string;
    slug: string;
    abbreviation?: string;
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
function importEquipment(rfc002Data: RFC002Equipment) {
  const equipment = {
    id: rfc002Data.id,
    name: rfc002Data.canonical.name,
    slug: rfc002Data.canonical.slug,
    abbreviation: rfc002Data.canonical.abbreviation,
    aliases: rfc002Data.canonical.aliases || [],
    tags: rfc002Data.classification?.tags || [],
    attributes: rfc002Data.attributes || {}
  };

  // Handle gym management extensions
  if (rfc002Data.extensions?.['x:gym-management']) {
    equipment.inventory = rfc002Data.extensions['x:gym-management'].inventory;
    equipment.maintenance = rfc002Data.extensions['x:gym-management'].maintenance;
  }

  return equipment;
}
```

## 10. Reference

## Usaglašenost

**Usaglašeni proizvođači podataka:**

:::danger MORA
- **MORAJU** da emituju JSON koji se validira prema šemi Equipment za deklarisani `schemaVersion`.
- **MORAJU** da koriste UUIDv4 za sve identifikatore u produkcionim podacima (npr. `id` opreme). Kratki primeri ID-jeva u ovom RFC-u su samo ilustrativni.
- **MORAJU** da popune sva obavezna polja i poštuju enumeracije i strukturu.
:::

:::tip TREBALO BI
- **TREBALO BI** da uključe RFC 3339 UTC vremenske oznake u `metadata`.
:::

**Usaglašeni konzumenti:**

:::danger MORA
- **MORAJU** da validiraju dolazne podatke o opremi prema odgovarajućoj verziji šeme.
- **MORAJU** da ignorišu nepoznate ključeve u `attributes` i `extensions`.
:::

:::tip TREBALO BI
- **TREBALO BI** da tolerišu dodatna opciona polja uvedena u novijim sporednim verzijama.
- **TREBALO BI** da odbace podatke kojima nedostaju obavezna polja ili imaju nevažeće enumeracije.
:::

**Kompatibilnost:**

:::danger MORA
- Opciona polja dodata u sporednim verzijama **NE SMEJU** da naruše konzumente; konzumenti **TREBALO BI** da ignorišu nepoznata opciona polja.
- Nova obavezna polja su izmena **GLAVNE** verzije i zahtevaju koordinisane nadogradnje.
:::

---

Obaveštenje o autorskim pravima  
Copyright (c) 2025 VITNESS.
Ovaj dokument podleže pravima, licencama i ograničenjima sadržanim u dokumentu VITNESS Open Standards License Agreement. Pogledajte `/specification/VITNESS Open Standards License Agreement.md`.

---

Dodatni resursi:
- Politika identifikatora i UUID-a: `/specification/README.md#identifiers-ids`
- Konvencije za i18n i slugove: `/specification/i18n-and-slugs.md`
- Vodič za uparivanje metrika: `/specification/metrics-guide.md`
- Politika ekstenzija i vodič za registar: `/specification/extension-registry.md`
- Krajnja tačka za otkrivanje: `/specification/discovery.md`

### 10.1. Normativne reference
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [RFC 3339: Date/Time](https://tools.ietf.org/html/rfc3339)
- [RFC-001: Specifikacija modela podataka o vežbi](./rfc-001-exercise-data-model.md)

### 10.2. Informativne reference
- ISO 20957 (Stationary training equipment)
- Standardi bezbednosti opreme i sertifikacije

---

**Obaveštenje o autorskim pravima**  
Copyright (c) 2025 VITNESS. Ovaj dokument podleže pravima, licencama i ograničenjima sadržanim u dokumentu VITNESS Open Standards License Agreement.
