---
title: Pregled
description: Transformišite bilo koju izvornu šemu u FDS format uz opciono AI obogaćivanje
sidebar_position: 1
---

# FDS Transformer

Transformišite bilo koju izvornu šemu u FDS (Fitness Data Standard) format uz opciono AI obogaćivanje.

**Paket:** `@vitness/fds-transformer`  
**Verzija:** 0.1.0  
**Licenca:** MIT

## Pregled

FDS Transformer je CLI alat i biblioteka koja konvertuje vaše postojeće fitnes podatke u JSON usklađen sa FDS-om. Preuzima na sebe složenost mapiranja proizvoljnih izvornih šema u standardizovani FDS format, uz opciono AI obogaćivanje za generisanje polja koja nedostaju.

## Ključne funkcionalnosti

| Funkcionalnost | Opis |
|---------|-------------|
| **Interaktivni CLI** | Elegantan interfejs u stilu čarobnjaka za vođenu transformaciju |
| **Neinteraktivni režim** | Paketna obrada za CI/CD pipeline-ove |
| **Višestepeno AI obogaćivanje** | Generisanje polja pomoću AI u više nivoa preko OpenRoutera |
| **Upravljanje registrima** | Pretraga mišića, opreme i kategorija uz približno poklapanje |
| **Podrška za više verzija** | Ciljajte različite verzije FDS šema |
| **Sistem dodataka** | Proširite prilagođenim transformacijama |
| **Kontrolna tačka/nastavljanje** | Nastavite dugotrajne transformacije |
| **Procena troškova** | Pregledajte troškove AI obogaćivanja pre pokretanja |

## Kako radi

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Source Data    │────▶│  FDS Transformer │────▶│  FDS-Compliant  │
│  (any format)   │     │                  │     │     JSON        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                        ┌──────┴──────┐
                        ▼             ▼
               ┌─────────────┐ ┌─────────────┐
               │  Registries │ │ AI Provider │
               │  (muscles,  │ │ (optional)  │
               │  equipment) │ │             │
               └─────────────┘ └─────────────┘
```

1. **Učitajte** izvorne podatke (JSON niz ili pojedinačni objekat)
2. **Konfigurišite** mapiranja polja u `mapping.json`
3. **Transformišite** pomoću ugrađenih transformacija (slugify, titleCase itd.)
4. **Obogatite** polja koja nedostaju pomoću AI (opciono)
5. **Validirajte** izlaz prema FDS JSON šemi
6. **Sačuvajte** izlazne JSON datoteke usklađene sa FDS-om

## Brzi početak

### Instalacija

```bash
# Global install (recommended for frequent use)
npm install -g @vitness/fds-transformer

# Or use npx without installing
npx @vitness/fds-transformer --help
```

### Osnovna upotreba

```bash
# Interactive mode - launches guided wizard
fds-transformer

# Transform with config file
fds-transformer transform \
  --input ./data.json \
  --config ./mapping.json \
  --output ./fds/

# Validate existing FDS data
fds-transformer validate --input ./exercise.json
```

> **Napomena:** Ako niste instalirali globalno, komandama dodajte prefiks `npx @vitness/fds-transformer` umesto `fds-transformer`.

### Programska upotreba

```typescript
import { Transformer } from '@vitness/fds-transformer';

const transformer = new Transformer({
  config: './mapping.json',
});

// Transform single item
const result = await transformer.transform({
  id: '0001',
  name: 'Barbell Bench Press',
  equipment: 'barbell',
  target: 'pectorals',
});

console.log(result.data);
```

## Šta dalje?

- [Vodič za instalaciju](/docs/tools/transformer/installation) - Detaljna uputstva za podešavanje
- [CLI referenca](/docs/tools/transformer/cli-reference) - Sve komande i opcije
- [Konfiguracija](/docs/tools/transformer/configuration) - Referenca konfiguracije mapiranja
- [AI obogaćivanje](/docs/tools/transformer/ai-enrichment) - Vodič za višestepeno obogaćivanje
- [Ugrađene transformacije](/docs/tools/transformer/transforms) - Referenca funkcija transformacija
- [Razvoj dodataka](/docs/tools/transformer/plugins) - Kreirajte prilagođene transformacije
- [Primeri](/docs/tools/transformer/examples) - Kompletni tokovi rada

## Zahtevi

- **Node.js:** >=20.0.0
- **API ključ:** Potreban samo za AI obogaćivanje (OpenRouter)
