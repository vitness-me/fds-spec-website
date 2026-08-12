---
title: Transformaciones integradas
description: Referencia de todas las funciones de transformación integradas
sidebar_position: 6
---

# Transformaciones integradas

El FDS Transformer incluye un conjunto de funciones de transformación integradas para tareas comunes de manipulación de datos. Se pueden usar en la propiedad `transform` de los mapeos de campos.

## Referencia de transformaciones

### `slugify`

Convierte una cadena en un slug seguro para URL.

**Entrada:** Cadena  
**Salida:** Cadena

```json fds:fragment entity=mapping
{
  "canonical.slug": {
    "from": "name",
    "transform": "slugify"
  }
}
```

**Ejemplos:**

| Entrada | Salida |
|-------|--------|
| `"Barbell Bench Press"` | `"barbell-bench-press"` |
| `"Cable Fly (Low)"` | `"cable-fly-low"` |
| `"Push-Up"` | `"push-up"` |

**Comportamiento:**
- Convierte a minúsculas
- Reemplaza los espacios por guiones
- Elimina los caracteres especiales
- Colapsa los guiones múltiples

---

### `titleCase`

Convierte una cadena al formato Title Case.

**Entrada:** Cadena  
**Salida:** Cadena

```json fds:fragment entity=mapping
{
  "canonical.name": {
    "from": "name",
    "transform": "titleCase"
  }
}
```

**Ejemplos:**

| Entrada | Salida |
|-------|--------|
| `"barbell bench press"` | `"Barbell Bench Press"` |
| `"DEADLIFT"` | `"Deadlift"` |
| `"push-up"` | `"Push-Up"` |

---

### `uuid`

Genera una cadena UUIDv4. FDS requiere UUID simples para todos los identificadores.

**Entrada:** Cualquiera (se ignora)  
**Salida:** Cadena

```json fds:fragment entity=mapping
{
  "exerciseId": {
    "from": null,
    "transform": "uuid"
  }
}
```

**Salida de ejemplo:** `"550e8400-e29b-41d4-a716-446655440000"`

---

### `toArray`

Garantiza que un valor esté envuelto en un arreglo.

**Entrada:** Cualquiera  
**Salida:** Arreglo

```json fds:fragment entity=mapping
{
  "targets.primary": {
    "from": "target",
    "transform": "toArray"
  }
}
```

**Ejemplos:**

| Entrada | Salida |
|-------|--------|
| `"chest"` | `["chest"]` |
| `["chest", "shoulders"]` | `["chest", "shoulders"]` |
| `null` | `[]` |

---

### `toMediaArray`

Convierte URL al formato de medios de FDS.

**Entrada:** Cadena, arreglo de cadenas o arreglo de objetos  
**Salida:** Arreglo de objetos MediaItem

**Opciones:**

| Opción | Tipo | Valor predeterminado | Descripción |
|--------|------|---------|-------------|
| `defaultType` | string | `"image"` | Tipo de medio predeterminado |
| `inferType` | boolean | `true` | Infiere el tipo a partir de la extensión del archivo |

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

**Entrada:**
```json fds:ignore input data in a platform’s own format, before any transformation
["https://example.com/bench-press.jpg", "https://example.com/video.mp4"]
```

**Salida:**
```json fds:ignore input data in a platform’s own format, before any transformation
[
  { "type": "image", "uri": "https://example.com/bench-press.jpg" },
  { "type": "video", "uri": "https://example.com/video.mp4" }
]
```

**Inferencia de tipo:**

| Extensión | Tipo |
|-----------|------|
| `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg` | `image` |
| `.mp4`, `.webm`, `.mov`, `.avi` | `video` |
| `.pdf`, `.md`, `.txt` | `doc` |
| `.glb`, `.gltf`, `.obj` | `3d` |

---

### `registryLookup`

Busca un valor en un registro, con coincidencia aproximada opcional.

**Entrada:** Cadena o arreglo  
**Salida:** Objeto o arreglo de objetos

**Opciones:**

| Opción | Tipo | Valor predeterminado | Descripción |
|--------|------|---------|-------------|
| `registry` | string | Obligatoria | Nombre del registro: `muscles`, `equipment`, `muscleCategories` |
| `fuzzyMatch` | boolean | `false` | Habilita la coincidencia aproximada |
| `threshold` | number | `0.8` | Umbral de coincidencia aproximada (0-1) |
| `field` | string | `"canonical.name"` | Campo contra el que se compara |
| `returnFormat` | string | `"object"` | Formato de retorno: `object`, `array`, `ref` |
| `includeAliases` | boolean | `true` | Incluye los alias en la comparación |

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

**Entrada:** `"pectorals"`

**Salida:**
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

**Formatos de retorno:**

- `object` - Entrada completa del registro
- `array` - Envuelta en un arreglo
- `ref` - Formato de referencia FDS (`{ id, name, slug, categoryId }`)

---

### `timestamp`

Genera una marca de tiempo ISO 8601.

**Entrada:** Cualquiera (se ignora)  
**Salida:** Cadena

```json fds:fragment entity=mapping
{
  "metadata.createdAt": {
    "from": null,
    "transform": "timestamp"
  }
}
```

**Salida de ejemplo:** `"2025-01-27T15:30:00.000Z"`

---

### `autoGenerate`

Genera automáticamente campos de metadatos.

**Entrada:** Cualquiera (se ignora)  
**Salida:** Objeto

**Opciones:**

| Opción | Tipo | Valor predeterminado | Descripción |
|--------|------|---------|-------------|
| `fields` | string[] | Todos los campos | Campos a generar |

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

**Salida:**
```json fds:fragment entity=exercise
{
  "createdAt": "2025-01-27T15:30:00.000Z",
  "updatedAt": "2025-01-27T15:30:00.000Z",
  "status": "active"
}
```

**Campos disponibles:**

| Campo | Valor generado |
|-------|-----------------|
| `createdAt` | Marca de tiempo ISO actual |
| `updatedAt` | Marca de tiempo ISO actual |
| `status` | `"active"` |
| `version` | `"1.0.0"` |
| `source` | `"fds-transformer"` |

---

### `template`

Aplica una cadena de plantilla con sustitución de variables.

**Entrada:** Objeto (contexto)  
**Salida:** Cadena

**Opciones:**

| Opción | Tipo | Obligatoria | Descripción |
|--------|------|----------|-------------|
| `template` | string | Sí | Cadena de plantilla con marcadores `{{field}}` |
| `defaultValue` | string | No | Valor predeterminado para los campos faltantes |

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

**Contexto:**
```json fds:ignore input data in a platform’s own format, before any transformation
{
  "name": "Barbell Bench Press",
  "target": "chest",
  "equipment": "barbell"
}
```

**Salida:** `"Barbell Bench Press is an exercise targeting the chest using barbell."`

---

### `urlTransform`

Transforma URL mediante coincidencia de patrones.

**Entrada:** Cadena (URL)  
**Salida:** Cadena

**Opciones:**

| Opción | Tipo | Descripción |
|--------|------|-------------|
| `pattern` | string | Patrón de expresión regular a buscar |
| `replacement` | string | Cadena de reemplazo |
| `prefix` | string | Prefijo a agregar |
| `suffix` | string | Sufijo a agregar |

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

**Entrada:** `"http://example.com/image.jpg"`  
**Salida:** `"https://example.com/image.jpg"`

---

## Encadenamiento de transformaciones

Aplicar varias transformaciones en secuencia:

```json fds:fragment entity=mapping
{
  "canonical.slug": {
    "from": "name",
    "transform": ["titleCase", "slugify"]
  }
}
```

Las transformaciones se aplican de izquierda a derecha. La salida de cada transformación se convierte en la entrada de la siguiente.

**Ejemplo:**

1. Entrada: `"barbell BENCH press"`
2. Después de `titleCase`: `"Barbell Bench Press"`
3. Después de `slugify`: `"barbell-bench-press"`

---

## Uso con búsqueda en registros

Patrón común para el mapeo de músculos y equipamiento:

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

Esto:
1. Envuelve el valor en un arreglo si es necesario
2. Busca cada valor en el registro de músculos
3. Devuelve el formato de referencia FDS

---

## Contexto de transformación

Todas las transformaciones reciben un objeto de contexto con:

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

Esto permite que las transformaciones accedan a otros campos y a la configuración.

---

## Véase también

- [Desarrollo de plugins](/docs/tools/transformer/plugins) - Creación de transformaciones personalizadas
- [Configuración](/docs/tools/transformer/configuration) - Referencia de la configuración de mapeo
- [Ejemplos](/docs/tools/transformer/examples) - Flujos de trabajo completos
