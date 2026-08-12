---
title: AI obogaćivanje
description: Višestepeno AI obogaćivanje za inteligentno generisanje polja
sidebar_position: 5
---

# AI obogaćivanje

FDS Transformer podržava **višestepeno AI obogaćivanje** - sistem sa više nivoa koji koristi različite AI modele u zavisnosti od složenosti polja. To omogućava isplativo, inteligentno generisanje polja uz očuvanje kvaliteta tamo gde je najvažniji.

## Pregled

Višestepeno obogaćivanje grupiše polja po složenosti:

| Nivo | Model | Slučaj upotrebe | Trošak | Brzina |
|------|-------|----------|------|-------|
| **Simple** | Claude Haiku 4.5 | Brzo, jednostavno obogaćivanje | Nizak | Brza |
| **Medium** | Claude Sonnet 4.5 | Uravnotežen odnos tačnosti i brzine | Srednji | Srednja |
| **Complex** | Claude Sonnet 4.5 | Duboka biomehanička analiza | Viši | Sporija |

Ovaj pristup:
- **Smanjuje troškove** korišćenjem jeftinijih modela za jednostavne zadatke
- **Poboljšava tačnost** posvećivanjem moćnijih modela složenoj analizi
- **Omogućava paketnu obradu** radi smanjenja broja API poziva

## Preduslovi

- **OpenRouter API ključ** - nabavite ga na [openrouter.ai](https://openrouter.ai/)
- Postavite promenljivu okruženja:

```bash
export OPENROUTER_API_KEY=your-api-key-here
```

## Konfiguracija

### Osnovno podešavanje

Dodajte sekciju `enrichment` u svoj `mapping.json`:

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
      "classification.exerciseType": { "tier": "simple", "prompt": "classification-simple" },
      "classification.level": { "tier": "simple", "prompt": "classification-simple" },
      "metrics.primary": { "tier": "simple", "prompt": "metrics" },
      "equipment.optional": { "tier": "simple", "prompt": "equipment" },
      
      "constraints.contraindications": { "tier": "medium", "prompt": "constraints" },
      "constraints.prerequisites": { "tier": "medium", "prompt": "constraints" },
      "constraints.progressions": { "tier": "medium", "prompt": "progressions" },
      "constraints.regressions": { "tier": "medium", "prompt": "progressions" },
      "relations": { "tier": "medium", "prompt": "relations" },
      
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" },
      "classification.mechanics": { "tier": "complex", "prompt": "biomechanics" },
      "classification.force": { "tier": "complex", "prompt": "biomechanics" },
      "classification.kineticChain": { "tier": "complex", "prompt": "biomechanics" },
      "targets.secondary": { "tier": "complex", "prompt": "biomechanics" }
    }
  }
}
```

### Konfiguracija nivoa

Svaki nivo ima sledeća podešavanja:

| Svojstvo | Tip | Opis |
|----------|------|-------------|
| `model` | string | Identifikator OpenRouter modela |
| `temperature` | number | Temperatura generisanja (0-1). Niža = determinističnije |
| `maxTokens` | number | Maksimalan broj tokena za odgovor |
| `batchSize` | number | Broj vežbi koje se obrađuju zajedno |
| `priority` | string | Nagoveštaj optimizacije: `speed`, `balanced` ili `accuracy` |

### Konfiguracija polja

Svako polje u objektu `fields`:

| Svojstvo | Tip | Opis |
|----------|------|-------------|
| `tier` | string | Koji nivo se koristi: `simple`, `medium`, `complex` |
| `prompt` | string | Ključ šablona prompta |
| `enum` | string[] | Dozvoljene vrednosti (za ograničena polja) |
| `required` | boolean | Da li polje mora biti popunjeno |

## Mapiranje polja na nivoe

### Polja nivoa Simple

Brzo obogaćivanje za jednostavne podatke:

| Polje | Prompt | Opis |
|-------|--------|-------------|
| `canonical.aliases` | `aliases` | Alternativni nazivi vežbe |
| `classification.exerciseType` | `classification-simple` | Tip vežbe (strength, cardio itd.) |
| `classification.level` | `classification-simple` | Nivo težine |
| `metrics.primary` | `metrics` | Primarni tip merenja |
| `equipment.optional` | `equipment` | Predlozi opcione opreme |

### Polja nivoa Medium

Uravnoteženo obogaćivanje za relacione podatke:

| Polje | Prompt | Opis |
|-------|--------|-------------|
| `constraints.contraindications` | `constraints` | Kontraindikacije usled zdravstvenog stanja ili povreda |
| `constraints.prerequisites` | `constraints` | Potrebne sposobnosti |
| `constraints.progressions` | `progressions` | Teže varijacije |
| `constraints.regressions` | `progressions` | Lakše varijacije |
| `relations` | `relations` | Reference na povezane vežbe |

### Polja nivoa Complex

Duboka analiza za biomehaničke podatke:

| Polje | Prompt | Opis |
|-------|--------|-------------|
| `classification.movement` | `biomechanics` | Klasifikacija obrasca pokreta |
| `classification.mechanics` | `biomechanics` | Složena (`compound`) ili izolaciona (`isolation`) vežba |
| `classification.force` | `biomechanics` | Smer sile (push/pull/static) |
| `classification.kineticChain` | `biomechanics` | Otvoreni ili zatvoreni kinetički lanac |
| `targets.secondary` | `biomechanics` | Sekundarno angažovani mišići |

## Pokretanje obogaćivanja

### Puno obogaćivanje (svi nivoi)

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --output ./fds-output/
```

### Samo jedan nivo

Pokrenite pojedinačne nivoe radi kontrole troškova ili otklanjanja grešaka:

```bash
# Simple tier only (fastest, cheapest)
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier simple

# Medium tier only
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier medium

# Complex tier only (most detailed)
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier complex
```

### Preskakanje obogaćivanja

Transformacija bez ikakvog AI obogaćivanja:

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --no-enrichment
```

## Procena troškova

Pregledajte troškove pre pokretanja:

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --estimate-cost
```

Izlaz:
```
┌───────────────────────────────────────────────────────────────────────┐
│                         Cost Estimation                               │
├───────────────────────────────────────────────────────────────────────┤
│ Input: 1,323 exercises                                                │
│ Enrichment fields: 18 (6 simple, 5 medium, 7 complex)                 │
│                                                                       │
│ Tier       │ Model              │ Batch │ Calls  │ Tokens   │ Cost   │
│ ───────────┼────────────────────┼───────┼────────┼──────────┼────────│
│ Simple     │ claude-haiku-4.5   │     5 │    265 │     ~53K │  $0.42 │
│ Medium     │ claude-sonnet-4.5  │     3 │    441 │    ~132K │  $1.98 │
│ Complex    │ claude-sonnet-4.5  │     1 │  1,323 │    ~529K │  $7.94 │
│ ───────────┴────────────────────┴───────┴────────┴──────────┴────────│
│ TOTAL                                   │  2,029 │   ~0.71M │ $10.34 │
│                                                                       │
│ Estimated time: 40 minutes (at 50 requests/min)                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Rezervni mehanizmi i obrada grešaka

Konfigurišite postepenu degradaciju:

```json fds:fragment entity=mapping
{
  "enrichment": {
    "fallback": {
      "retries": 2,
      "degradeModel": true,
      "useDefaults": true,
      "degradeChain": {
        "complex": "medium",
        "medium": "simple",
        "simple": null
      }
    }
  }
}
```

| Svojstvo | Tip | Opis |
|----------|------|-------------|
| `retries` | number | Broj ponovnih pokušaja pre degradacije |
| `degradeModel` | boolean | Pokušava sa modelom nižeg nivoa pri neuspehu |
| `useDefaults` | boolean | Koristi podrazumevane vrednosti pri potpunom neuspehu |
| `degradeChain` | object | Rezervni lanac modela |

Sva četiri svojstva su obavezna zajedno. Transformator koristi ovaj objekat *umesto* svojih podrazumevanih vrednosti, a ne spaja ga sa njima, pa `fallback` bez `degradeChain` ostavlja putanju degradacije nedefinisanom u trenutku kada je potrebna — na putanji greške, gde se to najteže primećuje.

## Ograničenje broja zahteva

Kontrolišite učestalost API zahteva:

```json fds:fragment entity=mapping
{
  "enrichment": {
    "rateLimit": {
      "requestsPerMinute": 50,
      "backoffStrategy": "exponential",
      "initialBackoffMs": 1000,
      "maxBackoffMs": 60000
    }
  }
}
```

| Svojstvo | Tip | Podrazumevano | Opis |
|----------|------|---------|-------------|
| `requestsPerMinute` | number | 50 | Maksimalan broj zahteva u minuti |
| `backoffStrategy` | string | `exponential` | Tip odlaganja (backoff): `exponential`, `linear`, `fixed` |
| `initialBackoffMs` | number | 1000 | Početno odlaganje |
| `maxBackoffMs` | number | 60000 | Maksimalno odlaganje |

## Kontrolne tačke i nastavljanje

Uključite čuvanje kontrolnih tačaka za duga izvršavanja:

```json fds:fragment entity=mapping
{
  "enrichment": {
    "checkpoint": {
      "enabled": true,
      "saveInterval": 10
    }
  }
}
```

Nastavljanje od kontrolne tačke:

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --resume
```

## Režim otklanjanja grešaka

Uključite detaljno beleženje:

```bash
DEBUG_ENRICHMENT=true fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --log-level debug
```

Ovo ispisuje:
- Promptove poslate AI modelu
- Sirove odgovore
- Potrošnju tokena po zahtevu
- Informacije o vremenu izvršavanja

## Obogaćivanje po polju

Za jednostavnije slučajeve upotrebe ili kada vam treba precizna kontrola, konfigurišite obogaćivanje po polju u mapiranjima:

```json fds:fragment entity=mapping
{
  "mappings": {
    "canonical.description": {
      "from": "description",
      "enrichment": {
        "enabled": true,
        "prompt": "exercise_description",
        "context": ["name", "target", "equipment"],
        "when": "missing",
        "fallback": "No description available"
      }
    }
  }
}
```

| Svojstvo | Tip | Opis |
|----------|------|-------------|
| `enabled` | boolean | Uključuje obogaćivanje za ovo polje |
| `prompt` | string | Ključ šablona prompta ili prilagođeni prompt |
| `context` | string[] | Izvorna polja koja se uključuju kao kontekst |
| `when` | string | Kada se obogaćuje: `always`, `missing`, `empty`, `notFound` |
| `fallback` | any | Vrednost koja se koristi ako obogaćivanje ne uspe |
| `validate` | boolean | Validira obogaćenu vrednost prema šemi |

## Promenljive okruženja

| Promenljiva | Opis |
|----------|-------------|
| `OPENROUTER_API_KEY` | API ključ za OpenRouter (obavezan) |
| `FDS_TRANSFORMER_MODEL` | Zamenjuje podrazumevani model za sve nivoe |
| `DEBUG_ENRICHMENT` | Postavite na `true` za detaljno beleženje |

## Najbolje prakse

1. **Počnite procenom troškova** - uvek prvo pokrenite `--estimate-cost`
2. **Testirajte na malim paketima** - isprobajte 10-20 stavki pre punih izvršavanja
3. **Koristite filtriranje po nivou** - otklanjajte greške nivo po nivo pomoću `--tier`
4. **Uključite kontrolne tačke** - uvek ih uključite za velike skupove podataka
5. **Pratite potrošnju tokena** - proverite debug izlaz radi prilika za optimizaciju
6. **Koristite odgovarajuće veličine paketa** - veći paketi smanjuju troškove, ali mogu povećati broj neuspeha

## Pogledajte i

- [Konfiguracija](/docs/tools/transformer/configuration) - kompletna referenca konfiguracije
- [CLI referenca](/docs/tools/transformer/cli-reference) - opcije komandi
- [Primeri](/docs/tools/transformer/examples) - kompletni tokovi rada
