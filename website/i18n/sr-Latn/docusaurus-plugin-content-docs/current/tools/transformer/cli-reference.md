---
title: CLI referenca
description: Kompletna referenca komandi i opcija FDS Transformer CLI-ja
sidebar_position: 3
---

# CLI referenca

Kompletna referenca svih komandi i opcija FDS Transformer CLI-ja.

## Sinopsis

```bash
fds-transformer [command] [options]
```

Pokretanje bez komande otvara interaktivni režim.

## Komande

### `transform`

Transformiše izvorne podatke u FDS format.

```bash
fds-transformer transform [options]
```

**Opcije:**

| Opcija | Opis | Podrazumevana vrednost |
|--------|-------------|---------|
| `-i, --input <path>` | Putanja ulazne datoteke (JSON) | Obavezno |
| `-c, --config <path>` | Datoteka konfiguracije mapiranja | - |
| `-o, --output <path>` | Izlazni direktorijum | Tekući direktorijum |
| `--version <version>` | Ciljna verzija FDS šeme | `1.0.0` |
| `--dry-run` | Pregled bez upisivanja datoteka | `false` |
| `--no-ai` | Isključuje AI obogaćivanje (nasleđeno) | `false` |
| `--no-enrichment` | Potpuno preskače AI obogaćivanje | `false` |
| `--api-key <key>` | API ključ za provajdera obogaćivanja | `$OPENROUTER_API_KEY` |
| `--model <model>` | AI model (nasleđeni režim jednog modela) | - |
| `--tier <tier>` | Pokreće samo određeni nivo (`simple`\|`medium`\|`complex`) | Svi nivoi |
| `--estimate-cost` | Prikazuje procenu troškova bez pokretanja | `false` |
| `--resume` | Nastavlja od kontrolne tačke | `false` |
| `--clear-checkpoint` | Briše postojeću kontrolnu tačku pre pokretanja | `false` |
| `--no-checkpoint` | Isključuje čuvanje kontrolnih tačaka | `false` |
| `--log-level <level>` | Nivo detaljnosti logova (`error`\|`warn`\|`info`\|`debug`) | `info` |

**Primeri:**

```bash
# Basic transformation
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --output ./fds-output/

# Preview without writing
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --dry-run

# Transform without AI enrichment
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --no-enrichment

# Run only simple tier enrichment
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier simple

# Estimate costs before running
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --estimate-cost

# Resume interrupted transformation
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --resume

# Debug mode
DEBUG_ENRICHMENT=true fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --log-level debug
```

---

### `validate`

Validira FDS podatke prema šemi.

```bash
fds-transformer validate [options]
```

**Opcije:**

| Opcija | Opis | Podrazumevana vrednost |
|--------|-------------|---------|
| `-i, --input <path>` | Ulazna datoteka za validaciju | Obavezno |
| `-e, --entity <type>` | Tip entiteta (`exercise`\|`equipment`\|`muscle`) | `exercise` |
| `--version <version>` | Verzija FDS šeme | `1.0.0` |

**Primeri:**

```bash
# Validate an exercise
fds-transformer validate --input ./bench-press.json

# Validate equipment
fds-transformer validate \
  --input ./barbell.json \
  --entity equipment

# Validate against specific version
fds-transformer validate \
  --input ./exercise.json \
  --version 1.0.0
```

**Izlazni kodovi:**

- `0` - Validacija uspešna
- `1` - Validacija neuspešna ili greška

---

### `init`

Interaktivno kreira novu konfiguraciju mapiranja.

```bash
fds-transformer init [options]
```

**Opcije:**

| Opcija | Opis | Podrazumevana vrednost |
|--------|-------------|---------|
| `-s, --sample <path>` | Uzorak izvorne datoteke za analizu | - |
| `-o, --output <path>` | Izlazna putanja za konfiguraciju | `./mapping.json` |

**Primer:**

```bash
# Generate config from sample data
fds-transformer init \
  --sample ./sample-exercise.json \
  --output ./mapping.json
```

> **Napomena:** Interaktivni čarobnjak je u razvoju. Za sada, pogledajte vodič za konfiguraciju radi ručnog podešavanja.

---

### `schemas`

Upravlja FDS šemama.

```bash
fds-transformer schemas <action>
```

**Akcije:**

| Akcija | Opis |
|--------|-------------|
| `list` | Prikazuje dostupne verzije šema |
| `update` | Ažurira lokalni keš šema |

**Primeri:**

```bash
# List available schemas
fds-transformer schemas list

# Update schema cache
fds-transformer schemas update
```

---

## Interaktivni režim

Pokretanje `fds-transformer` bez argumenata otvara interaktivni čarobnjak:

```bash
fds-transformer
```

```
┌  FDS Transformer
│
◆  What would you like to do?
│  ○ Transform data to FDS format
│  ○ Validate existing FDS data
│  ○ Create new mapping configuration
│  ○ Manage FDS schemas
└
```

---

## Izlazni formati

### Pojedinačne datoteke (podrazumevano)

Svaka transformisana stavka se upisuje u zasebnu datoteku imenovanu prema slugu:

```
output/
├── barbell-bench-press.json
├── back-squat.json
├── deadlift.json
└── ...
```

### Jedna datoteka

Podesite u `mapping.json` da se sve stavke upišu u jednu datoteku:

```json fds:fragment entity=mapping
{
  "output": {
    "singleFile": true,
    "singleFileName": "exercises.json",
    "pretty": true
  }
}
```

---

## Prikaz napretka

Tokom transformacije, CLI prikazuje napredak u realnom vremenu:

```
┌  FDS Transformer
│
◇  Loaded 1,323 items from ./exercises.json
◇  Loaded config from ./mapping.json
◇  Tiered enrichment configuration detected
│
●  Processing 45/1323: Barbell Bench Press ● │████████░░░░░░░░░░░░│ 12.3%
```

---

## Procena troškova

Koristite `--estimate-cost` da biste pregledali troškove AI obogaćivanja:

```bash
fds-transformer transform \
  --config ./mapping.json \
  --input ./exercises.json \
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
│                                                                       │
│ * Estimates based on average token usage. Actual costs may vary.      │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Kontrolna tačka i nastavljanje

Dugotrajne transformacije automatski čuvaju kontrolne tačke:

```bash
# Start transformation (checkpoint saved automatically)
fds-transformer transform --input ./exercises.json --config ./mapping.json

# If interrupted, resume from checkpoint
fds-transformer transform --input ./exercises.json --config ./mapping.json --resume

# Clear checkpoint and start fresh
fds-transformer transform --input ./exercises.json --config ./mapping.json --clear-checkpoint

# Disable checkpointing
fds-transformer transform --input ./exercises.json --config ./mapping.json --no-checkpoint
```

Kontrolne tačke se čuvaju u `.fds-checkpoint.json` u izlaznom direktorijumu.

---

## Izlazni kodovi

| Kod | Značenje |
|------|---------|
| `0` | Uspeh |
| `1` | Greška (neuspešna validacija, datoteka nije pronađena itd.) |

---

## Pogledajte i

- [Konfiguracija](/docs/tools/transformer/configuration) - Referenca konfiguracije mapiranja
- [AI obogaćivanje](/docs/tools/transformer/ai-enrichment) - Vodič za višestepeno obogaćivanje
- [Primeri](/docs/tools/transformer/examples) - Kompletni tokovi rada
