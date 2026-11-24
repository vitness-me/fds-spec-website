---
title: Built-in Transforms
description: Reference for all built-in transform functions
sidebar_position: 6
---

# Built-in Transforms

The FDS Transformer includes a set of built-in transform functions for common data manipulation tasks. These can be used in the `transform` property of field mappings.

## Transform Reference

### `slugify`

Convert a string to a URL-safe slug.

**Input:** String  
**Output:** String

```json fds:fragment entity=mapping
{
  "canonical.slug": {
    "from": "name",
    "transform": "slugify"
  }
}
```

**Examples:**

| Input | Output |
|-------|--------|
| `"Barbell Bench Press"` | `"barbell-bench-press"` |
| `"Cable Fly (Low)"` | `"cable-fly-low"` |
| `"Push-Up"` | `"push-up"` |

**Behavior:**
- Converts to lowercase
- Replaces spaces with hyphens
- Removes special characters
- Collapses multiple hyphens

---

### `titleCase`

Convert a string to Title Case.

**Input:** String  
**Output:** String

```json fds:fragment entity=mapping
{
  "canonical.name": {
    "from": "name",
    "transform": "titleCase"
  }
}
```

**Examples:**

| Input | Output |
|-------|--------|
| `"barbell bench press"` | `"Barbell Bench Press"` |
| `"DEADLIFT"` | `"Deadlift"` |
| `"push-up"` | `"Push-Up"` |

---

### `uuid`

Generate a UUIDv4 string. FDS requires plain UUIDs for all identifiers.

**Input:** Any (ignored)  
**Output:** String

```json fds:fragment entity=mapping
{
  "exerciseId": {
    "from": null,
    "transform": "uuid"
  }
}
```

**Example Output:** `"550e8400-e29b-41d4-a716-446655440000"`

A rerun gives every record a new id. Use `uuidv5` when ids must survive a rerun.

---

### `uuidv5`

Derive a UUIDv5 from a namespace and a name. The same input always gives the same id.

**Input:** Any (used as `{{value}}`)  
**Output:** String

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `namespace` | string | (required) | Namespace UUID |
| `name` | string | `{{value}}` | Name template; `{{value}}` is the mapped value, any other placeholder a dotted path into the source record |

```json fds:fragment entity=mapping
{
  "exerciseId": {
    "from": null,
    "transform": "uuidv5",
    "options": {
      "namespace": "3a9a7a4e-5b1c-4f55-9a3e-6f2d1c0b8e71",
      "name": "example-catalog/exercises/{{code}}"
    }
  }
}
```

A placeholder the source does not fill throws, because it would give every such record the same id.

---

### `toArray`

Ensure a value is wrapped in an array.

**Input:** Any  
**Output:** Array

```json fds:fragment entity=mapping
{
  "targets.primary": {
    "from": "target",
    "transform": "toArray"
  }
}
```

**Examples:**

| Input | Output |
|-------|--------|
| `"chest"` | `["chest"]` |
| `["chest", "shoulders"]` | `["chest", "shoulders"]` |
| `null` | `[]` |

---

### `toMediaArray`

Convert URLs to FDS media format.

**Input:** String, Array of strings, or Array of objects  
**Output:** Array of MediaItem objects

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultType` | string | `"image"` | Default media type |
| `inferType` | boolean | `true` | Infer type from file extension |

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

**Input:**
```json fds:ignore input data in a platform’s own format, before any transformation
["https://example.com/bench-press.jpg", "https://example.com/video.mp4"]
```

**Output:**
```json fds:ignore input data in a platform’s own format, before any transformation
[
  { "type": "image", "uri": "https://example.com/bench-press.jpg" },
  { "type": "video", "uri": "https://example.com/video.mp4" }
]
```

**Type Inference:**

| Extension | Type |
|-----------|------|
| `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg` | `image` |
| `.mp4`, `.webm`, `.mov`, `.avi` | `video` |
| `.pdf`, `.md`, `.txt` | `doc` |
| `.glb`, `.gltf`, `.obj` | `3d` |

---

### `registryLookup`

Look up a value in a registry with optional fuzzy matching.

**Input:** String or Array  
**Output:** Object or Array of objects

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `registry` | string | Required | Registry name: `muscles`, `equipment`, `muscleCategories` |
| `fuzzyMatch` | boolean | `false` | Enable fuzzy matching |
| `threshold` | number | `0.8` | Fuzzy match threshold (0-1) |
| `field` | string | `"canonical.name"` | Field to match against |
| `returnFormat` | string | `"object"` | Return format: `object`, `array`, `ref` |
| `includeAliases` | boolean | `true` | Include aliases in matching |

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

**Input:** `"pectorals"`

**Output:**
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

**Return Formats:**

- `object` - Full registry entry
- `array` - Wrapped in array
- `ref` - FDS reference format (`{ id, name, slug, categoryId }`)

---

### `timestamp`

Format an instant as an ISO 8601 timestamp. The instant comes from the source or from a configured clock, never from the wall clock by default, so a rerun gives the same output.

**Input:** A date string, or empty  
**Output:** String

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `clock` | string | (none) | ISO 8601 instant with a zone (`Z` or an offset) used when the source is empty, or `"now"` for the wall clock |
| `format` | string | `iso8601` | `iso8601`, `unix`, `unixms` or `date` |

```json fds:fragment entity=mapping
{
  "metadata.createdAt": {
    "from": "createdAt",
    "transform": "timestamp",
    "options": { "clock": "2026-01-01T00:00:00.000Z" }
  }
}
```

**Example Output:** `"2025-01-27T15:30:00.000Z"`

With an empty source and no `clock`, the transform throws.

---

### `autoGenerate`

Auto-generate metadata fields.

**Input:** Any (ignored)  
**Output:** Object

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fields` | string[] | All fields | Fields to generate |

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

**Output:**
```json fds:fragment entity=exercise
{
  "createdAt": "2025-01-27T15:30:00.000Z",
  "updatedAt": "2025-01-27T15:30:00.000Z",
  "status": "active"
}
```

**Available Fields:**

| Field | Generated Value |
|-------|-----------------|
| `createdAt` | Current ISO timestamp |
| `updatedAt` | Current ISO timestamp |
| `status` | `"active"` |
| `version` | `"1.0.0"` |
| `source` | `"fds-transformer"` |

---

### `template`

Apply a template string with variable substitution.

**Input:** Object (context)  
**Output:** String

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `template` | string | Yes | Template string with `{{field}}` placeholders |
| `defaultValue` | string | No | Default for missing fields |

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

**Context:**
```json fds:ignore input data in a platform’s own format, before any transformation
{
  "name": "Barbell Bench Press",
  "target": "chest",
  "equipment": "barbell"
}
```

**Output:** `"Barbell Bench Press is an exercise targeting the chest using barbell."`

---

### `urlTransform`

Transform URLs with pattern matching.

**Input:** String (URL)  
**Output:** String

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `pattern` | string | Regex pattern to match |
| `replacement` | string | Replacement string |
| `prefix` | string | Prefix to add |
| `suffix` | string | Suffix to add |

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

**Input:** `"http://example.com/image.jpg"`  
**Output:** `"https://example.com/image.jpg"`

---

## Chaining Transforms

Apply multiple transforms in sequence:

```json fds:fragment entity=mapping
{
  "canonical.slug": {
    "from": "name",
    "transform": ["titleCase", "slugify"]
  }
}
```

Transforms are applied left to right. The output of each transform becomes the input of the next.

**Example:**

1. Input: `"barbell BENCH press"`
2. After `titleCase`: `"Barbell Bench Press"`
3. After `slugify`: `"barbell-bench-press"`

---

## Using with Registry Lookup

Common pattern for muscle/equipment mapping:

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

This:
1. Wraps the value in an array if needed
2. Looks up each value in the muscles registry
3. Returns FDS reference format

---

## Transform Context

All transforms receive a context object with:

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

This enables transforms to access other fields and configuration.

---

## See Also

- [Plugin Development](/docs/tools/transformer/plugins) - Create custom transforms
- [Configuration](/docs/tools/transformer/configuration) - Mapping config reference
- [Examples](/docs/tools/transformer/examples) - Complete workflows
