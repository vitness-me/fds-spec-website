---
title: Razvoj dodataka
description: Pravljenje prilagođenih dodataka za transformacije u FDS Transformer alatu
sidebar_position: 7
---

# Razvoj dodataka

Proširite FDS Transformer prilagođenim transformacijama koristeći sistem dodataka. Ovaj vodič pokriva pravljenje, registrovanje i korišćenje prilagođenih dodataka za transformacije.

## Struktura dodatka

Dodatak je JavaScript/TypeScript modul koji izvozi objekat `TransformPlugin`:

```typescript
import type { TransformPlugin } from '@vitness/fds-transformer';

const myPlugin: TransformPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  transforms: {
    // Custom transform functions
  },
  enrichers: {
    // Optional: Custom enrichment functions
  },
};

export default myPlugin;
```

### Interfejs dodatka

```typescript
interface TransformPlugin {
  /** Unique plugin name */
  name: string;
  
  /** Plugin version (semver) */
  version: string;
  
  /** Custom transform functions */
  transforms: Record<string, TransformFunction>;
  
  /** Optional: Custom enrichment functions */
  enrichers?: Record<string, EnrichmentFunction>;
}
```

## Pravljenje transformacija

### Osnovna transformacija

Funkcija transformacije prima vrednost, opcije i kontekst:

```typescript
import type { TransformFunction } from '@vitness/fds-transformer';

const customSlug: TransformFunction = (value, options, context) => {
  const str = String(value);
  const prefix = options.prefix || '';
  return `${prefix}${str.toLowerCase().replace(/\s+/g, '-')}`;
};
```

### Potpis funkcije transformacije

```typescript
type TransformFunction = (
  value: unknown,
  options: Record<string, unknown>,
  context: TransformContext
) => unknown | Promise<unknown>;
```

**Parametri:**

| Parametar | Tip | Opis |
|-----------|------|-------------|
| `value` | `unknown` | Ulazna vrednost koja se transformiše |
| `options` | `Record<string, unknown>` | Opcije iz konfiguracije mapiranja |
| `context` | `TransformContext` | Kontekst transformacije |

### Kontekst transformacije

Kontekst pruža pristup celokupnom stanju transformacije:

```typescript
interface TransformContext {
  /** Original source data */
  source: Record<string, unknown>;
  
  /** Current FDS object being built */
  target: Record<string, unknown>;
  
  /** Current field path (e.g., "canonical.name") */
  field: string;
  
  /** Loaded registries */
  registries: {
    muscles: RegistryEntry[];
    equipment: RegistryEntry[];
    muscleCategories: RegistryEntry[];
  };
  
  /** Full mapping configuration */
  config: MappingConfig;
}
```

## Primeri dodataka

### Jednostavan dodatak sa transformacijama

```typescript
// plugins/string-transforms.ts
import type { TransformPlugin, TransformFunction } from '@vitness/fds-transformer';

const capitalize: TransformFunction = (value) => {
  const str = String(value);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const truncate: TransformFunction = (value, options) => {
  const str = String(value);
  const maxLength = (options.maxLength as number) || 100;
  const suffix = (options.suffix as string) || '...';
  
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
};

const removeHtml: TransformFunction = (value) => {
  return String(value).replace(/<[^>]*>/g, '');
};

const plugin: TransformPlugin = {
  name: 'string-transforms',
  version: '1.0.0',
  transforms: {
    capitalize,
    truncate,
    removeHtml,
  },
};

export default plugin;
```

### Dodatak svestan konteksta

```typescript
// plugins/fitness-transforms.ts
import type { TransformPlugin, TransformFunction } from '@vitness/fds-transformer';

/**
 * Infer difficulty level from other fields
 */
const inferLevel: TransformFunction = (value, options, context) => {
  // If already set, return as-is
  if (value) return value;
  
  const { source } = context;
  
  // Infer from equipment complexity
  const equipment = source.equipment as string;
  if (equipment?.includes('barbell') || equipment?.includes('cable')) {
    return 'intermediate';
  }
  
  // Infer from target muscle
  const target = source.target as string;
  if (target?.includes('core') || target?.includes('abs')) {
    return 'beginner';
  }
  
  return 'intermediate';
};

/**
 * Generate tags from classification
 */
const generateTags: TransformFunction = (value, options, context) => {
  const { target } = context;
  const tags = new Set<string>();
  
  // Add movement-based tags
  const movement = target.classification?.movement as string;
  if (movement) {
    if (movement.includes('push')) tags.add('pushing');
    if (movement.includes('pull')) tags.add('pulling');
    if (movement.includes('squat')) tags.add('legs');
  }
  
  // Add mechanics-based tags
  const mechanics = target.classification?.mechanics as string;
  if (mechanics === 'compound') tags.add('compound');
  if (mechanics === 'isolation') tags.add('isolation');
  
  return Array.from(tags);
};

const plugin: TransformPlugin = {
  name: 'fitness-transforms',
  version: '1.0.0',
  transforms: {
    inferLevel,
    generateTags,
  },
};

export default plugin;
```

### Asinhroni dodatak sa transformacijama

```typescript
// plugins/external-lookup.ts
import type { TransformPlugin, TransformFunction } from '@vitness/fds-transformer';

/**
 * Look up exercise data from external API
 */
const externalLookup: TransformFunction = async (value, options, context) => {
  const apiUrl = options.apiUrl as string;
  const field = options.field as string || 'id';
  
  try {
    const response = await fetch(`${apiUrl}?${field}=${encodeURIComponent(String(value))}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`External lookup failed for ${value}:`, error);
    return null;
  }
};

const plugin: TransformPlugin = {
  name: 'external-lookup',
  version: '1.0.0',
  transforms: {
    externalLookup,
  },
};

export default plugin;
```

## Registrovanje dodataka

### U konfiguraciji

Dodajte dodatke u svoj `mapping.json`:

```json fds:fragment entity=mapping
{
  "plugins": [
    "./plugins/string-transforms.js",
    "./plugins/fitness-transforms.js"
  ],
  "mappings": {
    "canonical.name": {
      "from": "name",
      "transform": "string-transforms:capitalize"
    },
    "classification.level": {
      "from": "difficulty",
      "transform": "fitness-transforms:inferLevel"
    }
  }
}
```

### Sa opcijama

Prosledite opcije pri inicijalizaciji dodatka:

```json fds:fragment entity=mapping
{
  "plugins": [
    {
      "name": "./plugins/external-lookup.js",
      "options": {
        "apiUrl": "https://api.example.com/exercises"
      }
    }
  ]
}
```

## Korišćenje transformacija iz dodataka

Pozivajte transformacije iz dodataka sintaksom `plugin:transform`:

```json fds:fragment entity=mapping
{
  "mappings": {
    "canonical.description": {
      "from": "description",
      "transform": ["string-transforms:removeHtml", "string-transforms:truncate"],
      "options": {
        "maxLength": 200
      }
    }
  }
}
```

## Prilagođeni obogaćivači

Dodaci mogu da obezbede i prilagođene funkcije obogaćivanja:

```typescript
import type { TransformPlugin, EnrichmentFunction } from '@vitness/fds-transformer';

const customEnricher: EnrichmentFunction = async (context, options) => {
  const { source, target } = context;
  
  // Perform custom enrichment logic
  const enrichedData = {
    customField: 'enriched value',
    derivedField: `Based on ${source.name}`,
  };
  
  return enrichedData;
};

const plugin: TransformPlugin = {
  name: 'custom-enricher',
  version: '1.0.0',
  transforms: {},
  enrichers: {
    customEnricher,
  },
};

export default plugin;
```

**Nijedan konfiguracioni ključ ih ne bira.** `enrichers` je deo tipa `TransformPlugin`, ali transformator registruje samo `transforms` dodatka — pod `<plugin>:<name>` — i ništa ne čita `enrichers`. Ne postoji ključ u `mapping.json` koji imenuje obogaćivač iz dodatka, a nema ga ni šema mapiranja, jer je šema koja prihvata ključ koji alat ignoriše gora od nepostojanja šeme: govori vam da je konfiguracija ispravna dok se obogaćivač nikada ne izvršava.

Dok obogaćivači ne postanu dostupni iz konfiguracije, obavite posao u transformaciji. Transformacija prima isti `TransformContext` — izvorni zapis, delimično izgrađen cilj i učitane registre — pa sve što bi obogaćivač mogao da izračuna, može i transformacija:

```json fds:fragment entity=mapping
{
  "mappings": {
    "classification.tags": {
      "from": null,
      "transform": "fitness-transforms:generateTags"
    }
  }
}
```

## Podrška za TypeScript

Za TypeScript dodatke, uvezite tipove iz paketa:

```typescript
import type {
  TransformPlugin,
  TransformFunction,
  TransformContext,
  EnrichmentFunction,
  RegistryEntry,
  MappingConfig,
} from '@vitness/fds-transformer';
```

Izgradite pomoću:

```json title="tsconfig.json" fds:ignore a tsconfig.json excerpt
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "declaration": true,
    "outDir": "./dist"
  }
}
```

## Najbolje prakse

### 1. Obradite granične slučajeve

```typescript
const safeTransform: TransformFunction = (value, options, context) => {
  // Handle null/undefined
  if (value == null) return options.default ?? null;
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(v => processValue(v));
  }
  
  return processValue(value);
};
```

### 2. Validirajte opcije

```typescript
const validateOptions: TransformFunction = (value, options) => {
  if (!options.required) {
    throw new Error('Missing required option: "required"');
  }
  
  if (typeof options.threshold !== 'number' || options.threshold < 0 || options.threshold > 1) {
    throw new Error('Option "threshold" must be a number between 0 and 1');
  }
  
  // ... transform logic
};
```

### 3. Koristite asinhrone funkcije štedljivo

```typescript
// Prefer sync transforms when possible
const syncTransform: TransformFunction = (value) => {
  return value; // Fast, no async overhead
};

// Use async only when needed (API calls, file I/O)
const asyncTransform: TransformFunction = async (value) => {
  const result = await fetchExternalData(value);
  return result;
};
```

### 4. Dokumentujte svoje dodatke

```typescript
/**
 * Convert weight from pounds to kilograms
 * 
 * @param value - Weight in pounds
 * @param options.precision - Decimal places (default: 2)
 * @returns Weight in kilograms
 * 
 * @example
 * // In mapping.json:
 * {
 *   "weight": {
 *     "from": "weightLbs",
 *     "transform": "unit-converter:lbsToKg",
 *     "options": { "precision": 1 }
 *   }
 * }
 */
const lbsToKg: TransformFunction = (value, options) => {
  const lbs = Number(value);
  const precision = (options.precision as number) ?? 2;
  return Number((lbs * 0.453592).toFixed(precision));
};
```

## Testiranje dodataka

Testirajte svoje transformacije pomoću Vitest-a:

```typescript
// plugins/string-transforms.test.ts
import { describe, it, expect } from 'vitest';
import plugin from './string-transforms';

describe('string-transforms plugin', () => {
  const mockContext = {
    source: {},
    target: {},
    field: 'test',
    registries: { muscles: [], equipment: [], muscleCategories: [] },
    config: { version: '1.0.0', targetSchema: { version: '1.0.0' }, mappings: {} },
  };

  it('capitalizes strings', () => {
    const result = plugin.transforms.capitalize('hello world', {}, mockContext);
    expect(result).toBe('Hello world');
  });

  it('truncates long strings', () => {
    const result = plugin.transforms.truncate(
      'This is a very long string that should be truncated',
      { maxLength: 20 },
      mockContext
    );
    expect(result).toBe('This is a very lo...');
  });
});
```

## Pogledajte i

- [Ugrađene transformacije](/docs/tools/transformer/transforms) - referenca ugrađenih transformacija
- [Konfiguracija](/docs/tools/transformer/configuration) - referenca konfiguracije mapiranja
- [Primeri](/docs/tools/transformer/examples) - kompletni tokovi rada
