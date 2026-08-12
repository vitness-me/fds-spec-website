---
title: Ugrađene transformacije
description: Referenca svih ugrađenih funkcija transformacija
sidebar_position: 6
---

# Ugrađene transformacije

FDS Transformer uključuje skup ugrađenih funkcija transformacija za uobičajene zadatke obrade podataka. Mogu se koristiti u svojstvu `transform` u mapiranjima polja.

## Referenca transformacija

### `slugify`

Konvertuje string u slug bezbedan za URL.

**Ulaz:** String  
**Izlaz:** String

```json fds:fragment entity=mapping
{
  "canonical.slug": {
    "from": "name",
    "transform": "slugify"
  }
}
```

**Primeri:**

| Ulaz | Izlaz |
|-------|--------|
| `"Barbell Bench Press"` | `"barbell-bench-press"` |
| `"Cable Fly (Low)"` | `"cable-fly-low"` |
| `"Push-Up"` | `"push-up"` |

**Ponašanje:**
- Pretvara u mala slova
- Zamenjuje razmake crticama
- Uklanja specijalne znakove
- Sažima višestruke crtice

---

### `titleCase`

Konvertuje string u zapis sa velikim početnim slovima (Title Case).

**Ulaz:** String  
**Izlaz:** String

```json fds:fragment entity=mapping
{
  "canonical.name": {
    "from": "name",
    "transform": "titleCase"
  }
}
```

**Primeri:**

| Ulaz | Izlaz |
|-------|--------|
| `"barbell bench press"` | `"Barbell Bench Press"` |
| `"DEADLIFT"` | `"Deadlift"` |
| `"push-up"` | `"Push-Up"` |

---

### `uuid`

Generiše UUIDv4 string. FDS zahteva obične UUID vrednosti za sve identifikatore.

**Ulaz:** Bilo šta (ignoriše se)  
**Izlaz:** String

```json fds:fragment entity=mapping
{
  "exerciseId": {
    "from": null,
    "transform": "uuid"
  }
}
```

**Primer izlaza:** `"550e8400-e29b-41d4-a716-446655440000"`

---

### `toArray`

Obezbeđuje da vrednost bude upakovana u niz.

**Ulaz:** Bilo šta  
**Izlaz:** Niz

```json fds:fragment entity=mapping
{
  "targets.primary": {
    "from": "target",
    "transform": "toArray"
  }
}
```

**Primeri:**

| Ulaz | Izlaz |
|-------|--------|
| `"chest"` | `["chest"]` |
| `["chest", "shoulders"]` | `["chest", "shoulders"]` |
| `null` | `[]` |

---

### `toMediaArray`

Konvertuje URL-ove u FDS format za medije.

**Ulaz:** String, niz stringova ili niz objekata  
**Izlaz:** Niz MediaItem objekata

**Opcije:**

| Opcija | Tip | Podrazumevana vrednost | Opis |
|--------|------|---------|-------------|
| `defaultType` | string | `"image"` | Podrazumevani tip medija |
| `inferType` | boolean | `true` | Izvodi tip iz ekstenzije datoteke |

```json fds:fragment entity=mapping
{
  "media": {
    "from": "images",
    "transform": "toMediaArray",
    "options": {
      "defaultType": "image",
      "inferType": true
    }
  }
}
```

**Ulaz:**
```json fds:ignore input data in a platform’s own format, before any transformation
["https://example.com/bench-press.jpg", "https://example.com/video.mp4"]
```

**Izlaz:**
```json fds:ignore input data in a platform’s own format, before any transformation
[
  { "type": "image", "uri": "https://example.com/bench-press.jpg" },
  { "type": "video", "uri": "https://example.com/video.mp4" }
]
```

**Izvođenje tipa:**

| Ekstenzija | Tip |
|-----------|------|
| `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg` | `image` |
| `.mp4`, `.webm`, `.mov`, `.avi` | `video` |
| `.pdf`, `.md`, `.txt` | `doc` |
| `.glb`, `.gltf`, `.obj` | `3d` |

---

### `registryLookup`

Traži vrednost u registru uz opciono približno poklapanje.

**Ulaz:** String ili niz  
**Izlaz:** Objekat ili niz objekata

**Opcije:**

| Opcija | Tip | Podrazumevana vrednost | Opis |
|--------|------|---------|-------------|
| `registry` | string | Obavezno | Naziv registra: `muscles`, `equipment`, `muscleCategories` |
| `fuzzyMatch` | boolean | `false` | Uključuje približno poklapanje |
| `threshold` | number | `0.8` | Prag približnog poklapanja (0-1) |
| `field` | string | `"canonical.name"` | Polje za poređenje |
| `returnFormat` | string | `"object"` | Format povratne vrednosti: `object`, `array`, `ref` |
| `includeAliases` | boolean | `true` | Uključuje alijase u poklapanje |

```json fds:fragment entity=mapping
{
  "targets.primary": {
    "from": "target",
    "transform": "registryLookup",
    "options": {
      "registry": "muscles",
      "fuzzyMatch": true,
      "threshold": 0.8,
      "returnFormat": "array"
    }
  }
}
```

**Ulaz:** `"pectorals"`

**Izlaz:**
```json fds:ignore input data in a platform’s own format, before any transformation
[
  {
    "id": "mus.pectoralis-major",
    "name": "Pectoralis Major",
    "slug": "pectoralis-major",
    "categoryId": "cat.chest"
  }
]
```

**Formati povratne vrednosti:**

- `object` - Kompletan unos iz registra
- `array` - Upakovano u niz
- `ref` - FDS referentni format (`{ id, name, slug, categoryId }`)

---

### `timestamp`

Generiše ISO 8601 vremensku oznaku.

**Ulaz:** Bilo šta (ignoriše se)  
**Izlaz:** String

```json fds:fragment entity=mapping
{
  "metadata.createdAt": {
    "from": null,
    "transform": "timestamp"
  }
}
```

**Primer izlaza:** `"2025-01-27T15:30:00.000Z"`

---

### `autoGenerate`

Automatski generiše polja metapodataka.

**Ulaz:** Bilo šta (ignoriše se)  
**Izlaz:** Objekat

**Opcije:**

| Opcija | Tip | Podrazumevana vrednost | Opis |
|--------|------|---------|-------------|
| `fields` | string[] | Sva polja | Polja koja se generišu |

```json fds:fragment entity=mapping
{
  "metadata": {
    "from": null,
    "transform": "autoGenerate",
    "options": {
      "fields": ["createdAt", "updatedAt", "status"]
    }
  }
}
```

**Izlaz:**
```json fds:fragment entity=exercise
{
  "createdAt": "2025-01-27T15:30:00.000Z",
  "updatedAt": "2025-01-27T15:30:00.000Z",
  "status": "active"
}
```

**Dostupna polja:**

| Polje | Generisana vrednost |
|-------|-----------------|
| `createdAt` | Trenutna ISO vremenska oznaka |
| `updatedAt` | Trenutna ISO vremenska oznaka |
| `status` | `"active"` |
| `version` | `"1.0.0"` |
| `source` | `"fds-transformer"` |

---

### `template`

Primenjuje šablonski string sa zamenom promenljivih.

**Ulaz:** Objekat (kontekst)  
**Izlaz:** String

**Opcije:**

| Opcija | Tip | Obavezno | Opis |
|--------|------|----------|-------------|
| `template` | string | Da | Šablonski string sa čuvarima mesta `{{field}}` |
| `defaultValue` | string | Ne | Podrazumevana vrednost za polja koja nedostaju |

```json fds:fragment entity=mapping
{
  "canonical.description": {
    "from": ["name", "target", "equipment"],
    "transform": "template",
    "options": {
      "template": "{{name}} is an exercise targeting the {{target}} using {{equipment}}."
    }
  }
}
```

**Kontekst:**
```json fds:ignore input data in a platform’s own format, before any transformation
{
  "name": "Barbell Bench Press",
  "target": "chest",
  "equipment": "barbell"
}
```

**Izlaz:** `"Barbell Bench Press is an exercise targeting the chest using barbell."`

---

### `urlTransform`

Transformiše URL-ove pomoću poklapanja obrazaca.

**Ulaz:** String (URL)  
**Izlaz:** String

**Opcije:**

| Opcija | Tip | Opis |
|--------|------|-------------|
| `pattern` | string | Regex obrazac za poklapanje |
| `replacement` | string | String zamene |
| `prefix` | string | Prefiks koji se dodaje |
| `suffix` | string | Sufiks koji se dodaje |

```json fds:fragment entity=mapping
{
  "media[0].uri": {
    "from": "imageUrl",
    "transform": "urlTransform",
    "options": {
      "pattern": "http://",
      "replacement": "https://"
    }
  }
}
```

**Ulaz:** `"http://example.com/image.jpg"`  
**Izlaz:** `"https://example.com/image.jpg"`

---

## Ulančavanje transformacija

Primenite više transformacija uzastopno:

```json fds:fragment entity=mapping
{
  "canonical.slug": {
    "from": "name",
    "transform": ["titleCase", "slugify"]
  }
}
```

Transformacije se primenjuju sleva nadesno. Izlaz svake transformacije postaje ulaz sledeće.

**Primer:**

1. Ulaz: `"barbell BENCH press"`
2. Nakon `titleCase`: `"Barbell Bench Press"`
3. Nakon `slugify`: `"barbell-bench-press"`

---

## Upotreba sa pretragom registra

Uobičajen obrazac za mapiranje mišića/opreme:

```json fds:fragment entity=mapping
{
  "targets.primary": {
    "from": "target",
    "transform": ["toArray", "registryLookup"],
    "options": {
      "registry": "muscles",
      "fuzzyMatch": true,
      "returnFormat": "ref"
    }
  }
}
```

Ovo:
1. Upakuje vrednost u niz ako je potrebno
2. Traži svaku vrednost u registru mišića
3. Vraća FDS referentni format

---

## Kontekst transformacije

Sve transformacije dobijaju kontekstni objekat sa:

```typescript
interface TransformContext {
  source: Record<string, unknown>;    // Original source data
  target: Record<string, unknown>;    // Current FDS object being built
  field: string;                      // Current field path
  registries: {
    muscles: RegistryEntry[];
    equipment: RegistryEntry[];
    muscleCategories: RegistryEntry[];
  };
  config: MappingConfig;              // Full mapping configuration
}
```

Ovo omogućava transformacijama pristup drugim poljima i konfiguraciji.

---

## Pogledajte i

- [Razvoj dodataka](/docs/tools/transformer/plugins) - Kreirajte prilagođene transformacije
- [Konfiguracija](/docs/tools/transformer/configuration) - Referenca konfiguracije mapiranja
- [Primeri](/docs/tools/transformer/examples) - Kompletni tokovi rada
