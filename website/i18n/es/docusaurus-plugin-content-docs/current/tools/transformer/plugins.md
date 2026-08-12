---
title: Desarrollo de plugins
description: Crear plugins de transformación personalizados para el FDS Transformer
sidebar_position: 7
---

# Desarrollo de plugins

Extender el FDS Transformer con transformaciones personalizadas mediante el sistema de plugins. Esta guía cubre cómo crear, registrar y usar plugins de transformación personalizados.

## Estructura de un plugin

Un plugin es un módulo de JavaScript/TypeScript que exporta un objeto `TransformPlugin`:

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

### Interfaz del plugin

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

## Crear transformaciones

### Transformación básica

Una función de transformación recibe un valor, opciones y un contexto:

```typescript
import type { TransformFunction } from '@vitness/fds-transformer';

const customSlug: TransformFunction = (value, options, context) => {
  const str = String(value);
  const prefix = options.prefix || '';
  return `${prefix}${str.toLowerCase().replace(/\s+/g, '-')}`;
};
```

### Firma de la función de transformación

```typescript
type TransformFunction = (
  value: unknown,
  options: Record<string, unknown>,
  context: TransformContext
) => unknown | Promise<unknown>;
```

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `value` | `unknown` | Valor de entrada a transformar |
| `options` | `Record<string, unknown>` | Opciones de la configuración de mapeo |
| `context` | `TransformContext` | Contexto de la transformación |

### Contexto de transformación

El contexto da acceso al estado completo de la transformación:

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

## Plugins de ejemplo

### Plugin de transformación simple

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

### Plugin con acceso al contexto

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

### Plugin de transformación asíncrona

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

## Registrar plugins

### En la configuración

Agregar los plugins al archivo `mapping.json`:

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

### Con opciones

Pasar opciones a la inicialización del plugin:

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

## Usar transformaciones de plugins

Referenciar las transformaciones de plugins con la sintaxis `plugin:transform`:

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

## Enriquecedores personalizados

Los plugins también pueden proporcionar funciones de enriquecimiento personalizadas:

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

**Ninguna clave de configuración selecciona uno.** `enrichers` forma parte del tipo `TransformPlugin`, pero el transformador registra solo las `transforms` de un plugin — bajo `<plugin>:<name>` — y nada lee `enrichers`. No hay ninguna clave de `mapping.json` que nombre un enriquecedor de plugin, y el esquema de mapeo tampoco la tiene, porque un esquema que acepta una clave que la herramienta ignora es peor que ningún esquema: indica que la configuración es correcta mientras el enriquecedor nunca se ejecuta.

Hasta que los enriquecedores sean accesibles desde la configuración, hacer el trabajo en una transformación. Una transformación recibe el mismo `TransformContext` — los datos de origen, el destino parcialmente construido y los registros cargados —, de modo que todo lo que un enriquecedor podría calcular, una transformación también puede:

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

## Compatibilidad con TypeScript

Para plugins en TypeScript, importar los tipos desde el paquete:

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

Compilar con:

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

## Buenas prácticas

### 1. Manejar los casos límite

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

### 2. Validar las opciones

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

### 3. Usar async con moderación

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

### 4. Documentar los plugins

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

## Probar plugins

Probar las transformaciones con Vitest:

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

## Ver también

- [Transformaciones integradas](/docs/tools/transformer/transforms) - Referencia de las transformaciones integradas
- [Configuración](/docs/tools/transformer/configuration) - Referencia de la configuración de mapeo
- [Ejemplos](/docs/tools/transformer/examples) - Flujos de trabajo completos
