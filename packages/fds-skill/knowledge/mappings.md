# FDS Mapping Strategies

## Common Source Formats

### Format 1: Simple Exercise Database
```json
{
  "id": "0001",
  "name": "3/4 sit-up",
  "bodyPart": "waist",
  "equipment": "body weight",
  "target": "abs",
  "gifUrl": "http://example.com/0001.gif"
}
```

**Mapping Strategy:**
| Source Field | FDS Field | Transform |
|--------------|-----------|-----------|
| `id` | `metadata.externalRefs[0].id` | Keep as external ref |
| - | `exerciseId` | Generate UUIDv4 |
| `name` | `canonical.name` | `titleCase` |
| `name` | `canonical.slug` | `slugify` |
| - | `canonical.description` | AI enrichment |
| `bodyPart` | Context for AI | Used in classification |
| `equipment` | `equipment.required[0]` | Registry lookup |
| `target` | `targets.primary[0]` | Registry lookup + AI |
| `gifUrl` | `media[0]` | `toMediaArray` |
| - | `classification.*` | AI enrichment |
| - | `metrics.primary` | AI enrichment |

### Format 2: Detailed Exercise with Categories
```json
{
  "exercise_id": "ex-123",
  "title": "Barbell Back Squat",
  "description": "A compound lower body exercise...",
  "category": "legs",
  "subcategory": "quadriceps",
  "difficulty": "intermediate",
  "equipment_needed": ["barbell", "squat rack"],
  "muscles_primary": ["quadriceps", "glutes"],
  "muscles_secondary": ["hamstrings", "core"],
  "video_url": "https://...",
  "instructions": ["Step 1...", "Step 2..."]
}
```

**Mapping Strategy:**
| Source Field | FDS Field | Transform |
|--------------|-----------|-----------|
| `exercise_id` | `metadata.externalRefs[0].id` | External ref |
| - | `exerciseId` | Generate UUIDv4 |
| `title` | `canonical.name` | Direct |
| `title` | `canonical.slug` | `slugify` |
| `description` | `canonical.description` | Direct |
| `difficulty` | `classification.level` | Map: intermediate→intermediate |
| `equipment_needed` | `equipment.required[]` | Registry lookup (array) |
| `muscles_primary` | `targets.primary[]` | Registry lookup (array) |
| `muscles_secondary` | `targets.secondary[]` | Registry lookup (array) |
| `video_url` | `media[0]` | `toMediaArray` type=video |
| `category` + `subcategory` | `classification.*` | AI enrichment with context |

---

## Transform Functions

### slugify
Converts a string to a URL-safe slug.

**Input:** `"Barbell Bench Press"`  
**Output:** `"barbell-bench-press"`

**Rules:**
1. Lowercase
2. Replace spaces with hyphens
3. Remove special characters (keep alphanumeric and hyphens)
4. Collapse multiple hyphens
5. Trim hyphens from start/end

**Edge Cases:**
- Numbers: `"21s Bicep Curl"` → `"21s-bicep-curl"`
- Special chars: `"Push-Up (Incline)"` → `"push-up-incline"`
- Fractions: `"3/4 Sit-Up"` → `"three-quarter-sit-up"` (needs special handling)

### titleCase
Converts to title case for display names.

**Input:** `"barbell bench press"`  
**Output:** `"Barbell Bench Press"`

**Rules:**
1. Capitalize first letter of each word
2. Keep acronyms: `"EZ Bar Curl"` stays `"EZ Bar Curl"`
3. Handle hyphenated: `"Push-Up"` stays `"Push-Up"`

### registryLookup
Finds matching registry entry with fuzzy matching.

**Options:**
```json
{
  "registry": "muscles",
  "matchField": "name",
  "fuzzyMatch": true,
  "threshold": 0.8,
  "caseSensitive": false
}
```

**Matching Priority:**
1. Exact match on `name` or `slug`
2. Exact match in `aliases`
3. Fuzzy match on `name` (Levenshtein distance)
4. AI fallback if not found

**Examples:**
- `"abs"` → Matches `"Abs"` (exact) or `"Rectus Abdominis"` (alias)
- `"body weight"` → Matches `"Body Weight"` (fuzzy, space handling)
- `"quads"` → Matches `"Quadriceps"` (alias)

### toMediaArray
Converts URL(s) to FDS media array format.

**Options:**
```json
{
  "type": "image",
  "baseUrl": "file:///path/to/local/",
  "urlTransform": {
    "pattern": "http://old.cdn.com/(\\d+)\\.gif",
    "replace": "https://new.cdn.com/$1.gif"
  }
}
```

**Input:** `"http://old.cdn.com/0001.gif"`  
**Output:**
```json
[{
  "type": "image",
  "uri": "https://new.cdn.com/0001.gif"
}]
```

### prefixUUID
Generates or formats UUIDs with optional prefix.

**Options:**
```json
{
  "prefix": "ex-",
  "generate": true
}
```

**If source has ID:**
- Input: `"0001"` → Output: `"ex-0001-{uuid}"` or preserve + add external ref

**If generate:**
- Output: `"ex-{generated-uuid-v4}"`

### autoGenerate
Auto-generates metadata fields.

**Options:**
```json
{
  "createdAt": "now",
  "updatedAt": "now",
  "status": "draft",
  "source": "import-job-123"
}
```

---

## Mapping Configuration Examples

### Basic Exercise Import
```json
{
  "$schema": "https://spec.vitness.me/schemas/transformer/v1.0.0/mapping.schema.json",
  "version": "1.0.0",
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise"
  },
  "registries": {
    "muscles": { "source": "local", "local": "./registries/muscles.registry.json" },
    "equipment": { "source": "local", "local": "./registries/equipment.registry.json" },
    "muscleCategories": { "source": "local", "local": "./registries/muscle-categories.registry.json" }
  },
  "mappings": {
    "schemaVersion": { "default": "1.0.0" },
    "exerciseId": { "from": null, "transform": "uuid" },
    "canonical.name": { "from": "name", "transform": "titleCase" },
    "canonical.slug": { "from": "name", "transform": "slugify" },
    "canonical.description": {
      "from": null,
      "enrichment": {
        "enabled": true,
        "prompt": "exercise_description",
        "context": ["name", "bodyPart", "target", "equipment"]
      }
    },
    "classification": {
      "from": null,
      "enrichment": {
        "enabled": true,
        "prompt": "exercise_classification",
        "context": ["name", "bodyPart", "target", "equipment"]
      }
    },
    "targets.primary": {
      "from": "target",
      "transform": "registryLookup",
      "options": { "registry": "muscles", "fuzzyMatch": true }
    },
    "equipment.required": {
      "from": "equipment",
      "transform": "registryLookup",
      "options": { "registry": "equipment", "fuzzyMatch": true }
    },
    "metrics.primary": {
      "from": null,
      "enrichment": {
        "enabled": true,
        "prompt": "exercise_metrics",
        "context": ["name", "classification.exerciseType"]
      }
    },
    "media": {
      "from": "gifUrl",
      "transform": "toMediaArray",
      "options": { "type": "image" }
    },
    "metadata": {
      "transform": "autoGenerate",
      "options": {
        "createdAt": "now",
        "updatedAt": "now",
        "status": "draft",
        "source": "exercises-import"
      }
    },
    "metadata.externalRefs": {
      "from": "id",
      "transform": "template",
      "options": {
        "template": [{ "system": "source-db", "id": "{{value}}" }]
      }
    }
  },
  "output": {
    "format": "json",
    "pretty": true,
    "directory": "./output/exercises/",
    "naming": "{{slug}}.json"
  }
}
```

---

## Nested Path Mapping

FDS uses nested structures. Use dot notation:

- `canonical.name` → `{ canonical: { name: value } }`
- `targets.primary` → `{ targets: { primary: value } }`
- `metadata.externalRefs[0].id` → First item in array

### Array Handling

**Single value to array:**
```json
{
  "targets.primary": {
    "from": "target",
    "transform": ["registryLookup", "toArray"]
  }
}
```

**Multiple source to array:**
```json
{
  "targets.primary": {
    "from": ["primary_muscle", "secondary_muscle"],
    "transform": "registryLookup",
    "options": { "registry": "muscles" }
  }
}
```

---

## Conditional Mapping

```json
{
  "classification.unilateral": {
    "from": "name",
    "transform": "template",
    "options": {
      "template": "{{value.toLowerCase().includes('single') || value.toLowerCase().includes('one arm') || value.toLowerCase().includes('one leg')}}"
    },
    "condition": "source.name != null"
  }
}
```

---

## Default Values

```json
{
  "classification.kineticChain": {
    "from": null,
    "default": "mixed"
  }
}
```

---

## Error Handling

### Required Fields
Mark critical fields as required to fail early:
```json
{
  "canonical.name": {
    "from": "name",
    "required": true
  }
}
```

### Fallback Chain
```json
{
  "canonical.description": {
    "from": ["description", "summary", "notes"],
    "transform": "coalesce",
    "enrichment": {
      "enabled": true,
      "when": "empty"
    }
  }
}
```
