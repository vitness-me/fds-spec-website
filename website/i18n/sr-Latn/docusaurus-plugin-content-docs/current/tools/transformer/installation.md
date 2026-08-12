---
title: Instalacija
description: Instalirajte i konfigurišite FDS Transformer CLI
sidebar_position: 2
---

# Instalacija

Ovaj vodič pokriva instalaciju FDS Transformera i podešavanje okruženja.

## Zahtevi

- **Node.js:** 20.0.0 ili novija verzija
- **npm/pnpm/yarn:** Bilo koji savremeni menadžer paketa

Proverite verziju Node.js-a:

```bash
node --version
# Should output v20.0.0 or higher
```

## Načini instalacije

### Globalna instalacija (preporučeno za CLI)

Instalirajte globalno da biste koristili `fds-transformer` sa bilo kog mesta:

<PackageManagerTabs packages="@vitness/fds-transformer" global />

Proverite instalaciju:

```bash
fds-transformer --version
# 0.1.0
```

### Lokalna instalacija u projektu

Instalirajte kao zavisnost projekta:

<PackageManagerTabs packages="@vitness/fds-transformer" />

Pokrenite preko skripti menadžera paketa:

<PackageManagerTabs
  command={{
    pnpm: "pnpm exec fds-transformer --version",
    npm: "npx fds-transformer --version",
    yarn: "yarn fds-transformer --version",
  }}
/>

Ili dodajte u `package.json`:

```json fds:ignore an npm package.json excerpt
{
  "scripts": {
    "transform": "fds-transformer transform --config ./mapping.json",
    "validate": "fds-transformer validate"
  }
}
```

### Pokretanje bez instalacije

Pokrenite direktno bez instaliranja:

<PackageManagerTabs
  command={{
    pnpm: "pnpm dlx @vitness/fds-transformer --version",
    npm: "npx @vitness/fds-transformer --version",
    yarn: "yarn dlx @vitness/fds-transformer --version",
  }}
/>

## Podešavanje okruženja

### API ključ za AI obogaćivanje

Ako želite da koristite funkcionalnosti AI obogaćivanja, potreban vam je OpenRouter API ključ:

1. Nabavite API ključ na sajtu [OpenRouter](https://openrouter.ai/)
2. Podesite promenljivu okruženja:

```bash
# Unix/macOS
export OPENROUTER_API_KEY=your-api-key-here

# Windows (PowerShell)
$env:OPENROUTER_API_KEY = "your-api-key-here"

# Windows (CMD)
set OPENROUTER_API_KEY=your-api-key-here
```

Za trajnu konfiguraciju, dodajte u profil svoje ljuske (`~/.bashrc`, `~/.zshrc` itd.):

```bash
export OPENROUTER_API_KEY=your-api-key-here
```

### Korišćenje .env datoteke

Možete koristiti i `.env` datoteku u svom projektu:

```bash
# .env
OPENROUTER_API_KEY=your-api-key-here
FDS_TRANSFORMER_MODEL=anthropic/claude-sonnet-4.5
DEBUG_ENRICHMENT=false
```

Učitajte je alatom kao što je `dotenv-cli`:

```bash
npx dotenv-cli -- fds-transformer transform --config ./mapping.json
```

## Promenljive okruženja

| Promenljiva | Opis | Podrazumevana vrednost |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | API ključ za OpenRouter (obavezan za AI obogaćivanje) | - |
| `FDS_TRANSFORMER_MODEL` | Zamenjuje podrazumevani AI model | Podrazumevane vrednosti po nivou |
| `DEBUG_ENRICHMENT` | Uključuje detaljno logovanje obogaćivanja | `false` |

## Provera instalacije

Proverite da li sve radi:

```bash
# Check version
fds-transformer --version

# Run interactive mode
fds-transformer

# List available schemas
fds-transformer schemas list
```

Očekivani izlaz za `schemas list`:

```
┌  FDS Schemas
│
◇  Available schema versions:
│    1.0.0 (bundled)
│
└  Done
```

## Rešavanje problema

### Komanda nije pronađena

Ako `fds-transformer` nije pronađen nakon globalne instalacije:

1. Uverite se da je npm globalni bin direktorijum u vašoj PATH promenljivoj:
   ```bash
   npm config get prefix
   # Add {prefix}/bin to your PATH
   ```

2. Ili koristite npx:
   ```bash
   npx fds-transformer --version
   ```

### Greške sa dozvolama (Unix/macOS)

Ako dobijete greške sa dozvolama tokom globalne instalacije:

```bash
# Option 1: Use a Node version manager (recommended)
# Install nvm: https://github.com/nvm-sh/nvm

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Prestara verzija Node.js-a

Ako vidite greške kompatibilnosti, nadogradite Node.js:

```bash
# Using nvm
nvm install 20
nvm use 20

# Or download from https://nodejs.org/
```

## Sledeći koraci

- [CLI referenca](/docs/tools/transformer/cli-reference) - Upoznajte sve dostupne komande
- [Konfiguracija](/docs/tools/transformer/configuration) - Podesite konfiguraciju mapiranja
- [Primeri](/docs/tools/transformer/examples) - Pogledajte kompletne tokove rada
