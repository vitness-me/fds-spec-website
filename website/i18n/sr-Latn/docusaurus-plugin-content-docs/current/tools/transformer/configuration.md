---
title: Konfiguracija
description: Kompletna referenca konfiguracije mapiranja za FDS Transformer
sidebar_position: 4
---

# Konfiguracija

FDS Transformer koristi JSON konfiguracionu datoteku da definiše kako se izvorna polja mapiraju u FDS format. Ovaj vodič pokriva kompletnu šemu konfiguracije mapiranja.

## Konfiguraciona datoteka

Napravite datoteku `mapping.json` u svom projektu:

```json
{
  "$schema": "https://spec.vitness.me/schemas/transformer/v1.1.0/mapping.schema.json",
  "version": "1.0.0",
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise"
  },
  "registries": { },
  "mappings": { },
  "enrichment": { },
  "validation": { },
  "output": { }
}
```

## Referenca šeme

### Korenska svojstva

| Svojstvo | Tip | Obavezno | Opis |
|----------|------|----------|-------------|
| `$schema` | string | Ne | URL JSON šeme za validaciju u IDE-u |
| `description` | string | Ne | Napomena za onoga ko čita datoteku; transformator je nikada ne čita |
| `version` | string | Da | Verzija konfiguracije (npr. "1.0.0") |
| `targetSchema` | object | Da | Konfiguracija ciljne FDS šeme |
| `registries` | object | Ne | Izvori registara za pretrage |
| `mappings` | object | Da | Definicije mapiranja polja |
| `allowUnsafeEval` | boolean | Ne | Izvršava `condition` izraze u mapiranjima (podrazumevano `false`) |
| `enrichment` | object | Ne | Konfiguracija AI obogaćivanja |
| `validation` | object | Ne | Podešavanja validacije |
| `output` | object | Ne | Podešavanja izlaznog formata |
| `plugins` | array | Ne | Prilagođeni dodaci za transformacije |

Šema mapiranja zatvara `additionalProperties` na svakom nivou. Ključ koga u njoj nema je ključ koji transformator ne čita, pa će editor usmeren na `$schema` označiti grešku u kucanju umesto da je tiho propusti u izvršavanje koje je ignoriše.

---

### `targetSchema`

Određuje koja se FDS šema cilja:

```json fds:fragment entity=mapping
{
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise",
    "url": "https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json"
  }
}
```

| Svojstvo | Tip | Obavezno | Opis |
|----------|------|----------|-------------|
| `version` | string | Da | Verzija FDS šeme |
| `entity` | string | Ne | Tip entiteta: `exercise`, `equipment`, `muscle`, `muscle-category`, `body-atlas` |
| `url` | string | Ne | Prilagođeni URL šeme (zamenjuje podrazumevani) |

---

### `registries`

Konfigurišite izvore registara za pretrage. Registri obezbeđuju podatke o mišićima, opremi i kategorijama za transformaciju `registryLookup`.

```json fds:fragment entity=mapping
{
  "registries": {
    "muscles": {
      "source": "local",
      "local": "./registries/muscles.registry.json"
    },
    "equipment": {
      "source": "local",
      "local": "./registries/equipment.registry.json"
    },
    "muscleCategories": {
      "source": "local",
      "local": "./registries/muscle-categories.registry.json"
    }
  }
}
```

| Svojstvo | Tip | Opis |
|----------|------|-------------|
| `source` | string | Tip izvora: `local`, `remote`, `inline` |
| `local` | string | Putanja do lokalne datoteke registra |
| `url` | string | URL udaljenog registra; obavezan uz `remote` |
| `inline` | array | Unosi registra zadati direktno u konfiguraciji |
| `cache` | boolean | Lokalno keširanje udaljenih registara |
| `fallback` | string | Rezervni izvor ako primarni zakaže |

> **Napomena:** Morate obezbediti sopstvene datoteke registara. Transformator se ne isporučuje sa unapred pripremljenim registrima.

> **`remote` zahteva `url`.** FDS objavljuje mišiće, opremu i kategorije mišića samo kao *ilustrativne kataloge* — oni pokazuju oblik koji proizvođač podataka služi, i ništa u FDS-u ne zahteva njihove unose. Njihovi id-jevi ne pripadaju nijednom proizvođaču podataka, a pretraga registra upisuje id direktno u vaš izlaz, pa ne postoji podrazumevani udaljeni izvor na koji bi se moglo osloniti. `source: "remote"` bez `url` polja ne uspeva pri učitavanju umesto da preuzima. Imenujte katalog na koji mislite.

---

### `mappings`

Definišite kako se izvorna polja mapiraju u FDS polja:

```json fds:fragment entity=mapping
{
  "mappings": {
    "canonical.name": {
      "from": "name",
      "transform": "titleCase"
    },
    "canonical.slug": {
      "from": "name",
      "transform": "slugify"
    },
    "exerciseId": {
      "from": null,
      "transform": "uuid"
    },
    "targets.primary": {
      "from": "target",
      "transform": "registryLookup",
      "options": {
        "registry": "muscles",
        "fuzzyMatch": true,
        "threshold": 0.8
      }
    }
  }
}
```

#### Tipovi mapiranja

**Jednostavno mapiranje stringom:**
```json fds:fragment entity=mapping
{
  "canonical.name": "name"
}
```

**Mapiranje objektom:**
```json fds:fragment entity=mapping
{
  "canonical.name": {
    "from": "name",
    "transform": "titleCase",
    "default": "Unknown Exercise",
    "required": true
  }
}
```

#### Svojstva mapiranja

| Svojstvo | Tip | Opis |
|----------|------|-------------|
| `from` | string \| string[] \| null | Putanja(e) izvornog polja, ili `null` za generisana polja |
| `transform` | string \| string[] | Funkcija(e) transformacije koje se primenjuju |
| `options` | object | Opcije prosleđene funkciji transformacije |
| `default` | any | Podrazumevana vrednost ako izvor nedostaje |
| `required` | boolean | Da li je polje obavezno |
| `condition` | string | Uslovni izraz za uslovno mapiranje; izvršava se samo kada je korensko `allowUnsafeEval` postavljeno na `true`, a inače se preskače uz upozorenje |
| `enrichment` | object | Konfiguracija AI obogaćivanja na nivou polja |

#### Putanje ugnežđenih polja

Za ugnežđena polja koristite notaciju sa tačkom:

```json fds:fragment entity=mapping
{
  "canonical.name": "name",
  "canonical.slug": { "from": "name", "transform": "slugify" },
  "canonical.description": "description",
  "classification.exerciseType": "type",
  "classification.level": "difficulty"
}
```

#### Više izvornih polja

Kombinujte više izvornih polja:

```json fds:fragment entity=mapping
{
  "canonical.name": {
    "from": ["firstName", "lastName"],
    "transform": "template",
    "options": {
      "template": "{{firstName}} {{lastName}}"
    }
  }
}
```

#### Ulančane transformacije

Primenite više transformacija redom:

```json fds:fragment entity=mapping
{
  "canonical.slug": {
    "from": "name",
    "transform": ["titleCase", "slugify"]
  }
}
```

---

### `enrichment`

Konfigurišite AI obogaćivanje. Za detalje pogledajte [vodič za AI obogaćivanje](/docs/tools/transformer/ai-enrichment).

```json fds:fragment entity=mapping
{
  "enrichment": {
    "enabled": true,
    "provider": "openrouter",
    
    "tiers": {
      "simple": {
        "model": "anthropic/claude-haiku-4.5",
        "temperature": 0.1,
        "maxTokens": 1000,
        "batchSize": 5,
        "priority": "speed"
      },
      "medium": {
        "model": "anthropic/claude-sonnet-4.5",
        "temperature": 0.1,
        "maxTokens": 1500,
        "batchSize": 3,
        "priority": "balanced"
      },
      "complex": {
        "model": "anthropic/claude-sonnet-4.5",
        "temperature": 0.1,
        "maxTokens": 2000,
        "batchSize": 1,
        "priority": "accuracy"
      }
    },
    
    "fields": {
      "canonical.aliases": { "tier": "simple", "prompt": "aliases" },
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" }
    },
    
    "fallback": {
      "retries": 2,
      "degradeModel": true,
      "useDefaults": true,
      "degradeChain": {
        "complex": "medium",
        "medium": "simple",
        "simple": null
      }
    },
    
    "rateLimit": {
      "requestsPerMinute": 50,
      "backoffStrategy": "exponential"
    },
    
    "checkpoint": {
      "enabled": true,
      "saveInterval": 10
    }
  }
}
```

---

### `validation`

Konfigurišite validaciju izlaza:

```json fds:fragment entity=mapping
{
  "validation": {
    "enabled": true,
    "strict": false,
    "failOnError": false,
    "outputErrors": "./validation-errors.json"
  }
}
```

| Svojstvo | Tip | Podrazumevano | Opis |
|----------|------|---------|-------------|
| `enabled` | boolean | `true` | Uključuje validaciju prema šemi |
| `strict` | boolean | `false` | Neuspeh pri bilo kojoj grešci validacije |
| `failOnError` | boolean | `false` | Zaustavlja obradu na prvoj grešci |
| `outputErrors` | string | - | Putanja za upis grešaka validacije |

---

### `output`

Konfigurišite izlazni format:

```json fds:fragment entity=mapping
{
  "output": {
    "format": "json",
    "pretty": true,
    "directory": "./fds-output",
    "naming": "{{canonical.slug}}",
    "singleFile": false,
    "singleFileName": "exercises.json"
  }
}
```

| Svojstvo | Tip | Podrazumevano | Opis |
|----------|------|---------|-------------|
| `format` | string | `json` | Izlazni format: `json`, `jsonl`, `ndjson` |
| `pretty` | boolean | `true` | Formatiran (pretty-print) JSON ispis |
| `directory` | string | `./` | Izlazni direktorijum |
| `naming` | string | `{{canonical.slug}}` | Šablon imena datoteke |
| `singleFile` | boolean | `false` | Sav izlaz u jednu datoteku |
| `singleFileName` | string | `output.json` | Ime datoteke za izlaz u jednu datoteku |

---

### `plugins`

Učitajte prilagođene dodatke za transformacije:

```json fds:fragment entity=mapping
{
  "plugins": [
    "./plugins/my-transforms.js",
    {
      "name": "./plugins/custom.js",
      "options": {
        "apiKey": "..."
      }
    }
  ]
}
```

Za detalje pogledajte [razvoj dodataka](/docs/tools/transformer/plugins).

---

## Kompletan primer

```json
{
  "$schema": "https://spec.vitness.me/schemas/transformer/v1.1.0/mapping.schema.json",
  "version": "1.0.0",
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise"
  },
  "registries": {
    "muscles": {
      "source": "local",
      "local": "./registries/muscles.registry.json"
    },
    "equipment": {
      "source": "local",
      "local": "./registries/equipment.registry.json"
    }
  },
  "mappings": {
    "exerciseId": {
      "from": null,
      "transform": "uuid"
    },
    "schemaVersion": {
      "from": null,
      "default": "1.0.0"
    },
    "canonical.name": {
      "from": "name",
      "transform": "titleCase",
      "required": true
    },
    "canonical.slug": {
      "from": "name",
      "transform": "slugify"
    },
    "classification.exerciseType": {
      "from": "type",
      "default": "strength"
    },
    "targets.primary": {
      "from": "target",
      "transform": "registryLookup",
      "options": {
        "registry": "muscles",
        "fuzzyMatch": true,
        "returnFormat": "array"
      }
    },
    "equipment.required": {
      "from": "equipment",
      "transform": ["toArray", "registryLookup"],
      "options": {
        "registry": "equipment",
        "fuzzyMatch": true
      }
    },
    "metrics.primary": {
      "from": null,
      "default": { "type": "reps", "unit": "count" }
    },
    "metadata": {
      "from": null,
      "transform": "autoGenerate",
      "options": {
        "fields": ["createdAt", "updatedAt", "status"]
      }
    }
  },
  "enrichment": {
    "enabled": true,
    "provider": "openrouter",
    "tiers": {
      "simple": {
        "model": "anthropic/claude-haiku-4.5",
        "temperature": 0.1,
        "maxTokens": 1000,
        "batchSize": 5,
        "priority": "speed"
      },
      "medium": {
        "model": "anthropic/claude-sonnet-4.5",
        "temperature": 0.1,
        "maxTokens": 1500,
        "batchSize": 3,
        "priority": "balanced"
      },
      "complex": {
        "model": "anthropic/claude-sonnet-4.5",
        "temperature": 0.1,
        "maxTokens": 2000,
        "batchSize": 1,
        "priority": "accuracy"
      }
    },
    "fields": {
      "canonical.aliases": { "tier": "simple", "prompt": "aliases" },
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" },
      "targets.secondary": { "tier": "complex", "prompt": "biomechanics" }
    }
  },
  "validation": {
    "enabled": true,
    "strict": false
  },
  "output": {
    "format": "json",
    "pretty": true,
    "directory": "./fds-output"
  }
}
```

---

## Pogledajte i

- [Ugrađene transformacije](/docs/tools/transformer/transforms) - dostupne funkcije transformacija
- [AI obogaćivanje](/docs/tools/transformer/ai-enrichment) - konfiguracija višestepenog obogaćivanja
- [Razvoj dodataka](/docs/tools/transformer/plugins) - pravljenje prilagođenih transformacija
- [Primeri](/docs/tools/transformer/examples) - kompletni primeri tokova rada
