---
title: Plugin Development
description: Create custom transform plugins for the FDS Transformer
sidebar_position: 7
---

# Plugin Development

Extend the FDS Transformer with custom transforms using the plugin system. This guide covers creating, registering, and using custom transform plugins.

## Plugin Structure

A plugin is a JavaScript/TypeScript module that exports a `TransformPlugin` object:

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

### Plugin Interface

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

## Creating Transforms

### Basic Transform

A transform function receives a value, options, and context:

```typescript
import type { TransformFunction } from '@vitness/fds-transformer';

const customSlug: TransformFunction = (value, options, context) => {
  const str = String(value);
  const prefix = options.prefix || '';
  return `${prefix}${str.toLowerCase().replace(/\s+/g, '-')}`;
};
```

### Transform Function Signature

```typescript
type TransformFunction = (
  value: unknown,
  options: Record<string, unknown>,
  context: TransformContext
) => unknown | Promise<unknown>;
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `unknown` | Input value to transform |
| `options` | `Record<string, unknown>` | Options from mapping config |
| `context` | `TransformContext` | Transformation context |

### Transform Context

The context provides access to the full transformation state:

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

## Example Plugins

### Simple Transform Plugin

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

### Context-Aware Plugin

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

### Async Transform Plugin

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

## Registering Plugins

### In Configuration

Add plugins to your `mapping.json`:

```json
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

### With Options

Pass options to plugin initialization:

```json
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

## Using Plugin Transforms

Reference plugin transforms with the `plugin:transform` syntax:

```json
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

## Custom Enrichers

Plugins can also provide custom enrichment functions:

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

Use in configuration:

```json
{
  "mappings": {
    "extensions.custom": {
      "enrichment": {
        "enabled": true,
        "enricher": "custom-enricher:customEnricher"
      }
    }
  }
}
```

## TypeScript Support

For TypeScript plugins, import types from the package:

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

Build with:

```json
// tsconfig.json
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

## Best Practices

### 1. Handle Edge Cases

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

### 2. Validate Options

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

### 3. Use Async Sparingly

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

### 4. Document Your Plugins

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

## Testing Plugins

Test your transforms with Vitest:

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

## See Also

- [Built-in Transforms](/docs/tools/transformer/transforms) - Reference for built-in transforms
- [Configuration](/docs/tools/transformer/configuration) - Mapping config reference
- [Examples](/docs/tools/transformer/examples) - Complete workflows
