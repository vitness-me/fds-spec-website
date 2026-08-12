---
title: Configuración
description: Referencia completa de la configuración de mapeo del FDS Transformer
sidebar_position: 4
---

# Configuración

El FDS Transformer usa un archivo de configuración JSON para definir cómo los campos de origen se mapean al formato FDS. Esta guía cubre el esquema completo de configuración de mapeo.

## Archivo de configuración

Crear un archivo `mapping.json` en el proyecto:

```json
{
  "$schema": "https://spec.vitness.me/schemas/transformer/v1.1.0/mapping.schema.json",
  "version": "1.0.0",
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise"
  },
  "registries": { },
  "mappings": { },
  "enrichment": { },
  "validation": { },
  "output": { }
}
```

## Referencia del esquema

### Propiedades raíz

| Propiedad | Tipo | Obligatoria | Descripción |
|----------|------|----------|-------------|
| `$schema` | string | No | URL del JSON Schema para validación en el IDE |
| `description` | string | No | Una nota para quien lea el archivo; el transformador nunca la lee |
| `version` | string | Sí | Versión de la configuración (p. ej., "1.0.0") |
| `targetSchema` | object | Sí | Configuración del esquema FDS de destino |
| `registries` | object | No | Fuentes de registros para búsquedas |
| `mappings` | object | Sí | Definiciones de mapeo de campos |
| `allowUnsafeEval` | boolean | No | Evalúa las expresiones `condition` de los mapeos (por defecto `false`) |
| `enrichment` | object | No | Configuración del enriquecimiento con IA |
| `validation` | object | No | Ajustes de validación |
| `output` | object | No | Ajustes del formato de salida |
| `plugins` | array | No | Plugins de transformación personalizados |

El esquema de mapeo cierra `additionalProperties` en todos los niveles. Una clave que no figura en él es una clave que el transformador no lee, de modo que un editor apuntado a `$schema` señalará un error de escritura en lugar de dejarlo pasar en silencio hacia una ejecución que lo ignora.

---

### `targetSchema`

Especifica a qué esquema FDS apuntar:

```json fds:fragment entity=mapping
{
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise",
    "url": "https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json"
  }
}
```

| Propiedad | Tipo | Obligatoria | Descripción |
|----------|------|----------|-------------|
| `version` | string | Sí | Versión del esquema FDS |
| `entity` | string | No | Tipo de entidad: `exercise`, `equipment`, `muscle`, `muscle-category`, `body-atlas` |
| `url` | string | No | URL de esquema personalizada (reemplaza la predeterminada) |

---

### `registries`

Configura las fuentes de registros para búsquedas. Los registros proporcionan datos de músculos, equipamiento y categorías para la transformación `registryLookup`.

```json fds:fragment entity=mapping
{
  "registries": {
    "muscles": {
      "source": "local",
      "local": "./registries/muscles.registry.json"
    },
    "equipment": {
      "source": "local",
      "local": "./registries/equipment.registry.json"
    },
    "muscleCategories": {
      "source": "local",
      "local": "./registries/muscle-categories.registry.json"
    }
  }
}
```

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `source` | string | Tipo de fuente: `local`, `remote`, `inline` |
| `local` | string | Ruta al archivo de registro local |
| `url` | string | URL del registro remoto; obligatoria con `remote` |
| `inline` | array | Entradas de registro en línea |
| `cache` | boolean | Guarda en caché localmente los registros remotos |
| `fallback` | string | Fuente de respaldo si la principal falla |

> **Nota:** Se deben proporcionar archivos de registro propios. El transformador no incluye registros preconstruidos.

> **`remote` necesita una `url`.** FDS publica músculos, equipamiento y categorías de músculos solo como *catálogos ilustrativos*: muestran la forma que sirve un proveedor, y nada en FDS exige sus entradas. Sus ids no pertenecen a ningún proveedor, y una búsqueda en registro escribe un id directamente en la salida, así que no hay una fuente remota predeterminada a la que recurrir. `source: "remote"` sin `url` falla al cargar en lugar de descargar. Se debe nombrar el catálogo deseado.

---

### `mappings`

Define cómo los campos de origen se mapean a campos FDS:

```json fds:fragment entity=mapping
{
  "mappings": {
    "canonical.name": {
      "from": "name",
      "transform": "titleCase"
    },
    "canonical.slug": {
      "from": "name",
      "transform": "slugify"
    },
    "exerciseId": {
      "from": null,
      "transform": "uuid"
    },
    "targets.primary": {
      "from": "target",
      "transform": "registryLookup",
      "options": {
        "registry": "muscles",
        "fuzzyMatch": true,
        "threshold": 0.8
      }
    }
  }
}
```

#### Tipos de mapeo

**Mapeo simple de cadena:**
```json fds:fragment entity=mapping
{
  "canonical.name": "name"
}
```

**Mapeo de objeto:**
```json fds:fragment entity=mapping
{
  "canonical.name": {
    "from": "name",
    "transform": "titleCase",
    "default": "Unknown Exercise",
    "required": true
  }
}
```

#### Propiedades de mapeo

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `from` | string \| string[] \| null | Ruta(s) del campo de origen, o `null` para valores generados |
| `transform` | string \| string[] | Función(es) de transformación a aplicar |
| `options` | object | Opciones pasadas a la función de transformación |
| `default` | any | Valor por defecto si falta el origen |
| `required` | boolean | Si el campo es obligatorio |
| `condition` | string | Expresión de condición para mapeo condicional; se evalúa solo cuando el `allowUnsafeEval` raíz es `true`, y en caso contrario se omite con una advertencia |
| `enrichment` | object | Configuración de enriquecimiento con IA a nivel de campo |

#### Rutas de campos anidados

Usar notación de punto para campos anidados:

```json fds:fragment entity=mapping
{
  "canonical.name": "name",
  "canonical.slug": { "from": "name", "transform": "slugify" },
  "canonical.description": "description",
  "classification.exerciseType": "type",
  "classification.level": "difficulty"
}
```

#### Múltiples campos de origen

Combinar varios campos de origen:

```json fds:fragment entity=mapping
{
  "canonical.name": {
    "from": ["firstName", "lastName"],
    "transform": "template",
    "options": {
      "template": "{{firstName}} {{lastName}}"
    }
  }
}
```

#### Transformaciones encadenadas

Aplicar varias transformaciones en secuencia:

```json fds:fragment entity=mapping
{
  "canonical.slug": {
    "from": "name",
    "transform": ["titleCase", "slugify"]
  }
}
```

---

### `enrichment`

Configura el enriquecimiento con IA. Ver la [guía de enriquecimiento con IA](/docs/tools/transformer/ai-enrichment) para más detalles.

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
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" }
    },
    
    "fallback": {
      "retries": 2,
      "degradeModel": true,
      "useDefaults": true,
      "degradeChain": {
        "complex": "medium",
        "medium": "simple",
        "simple": null
      }
    },
    
    "rateLimit": {
      "requestsPerMinute": 50,
      "backoffStrategy": "exponential"
    },
    
    "checkpoint": {
      "enabled": true,
      "saveInterval": 10
    }
  }
}
```

---

### `validation`

Configura la validación de la salida:

```json fds:fragment entity=mapping
{
  "validation": {
    "enabled": true,
    "strict": false,
    "failOnError": false,
    "outputErrors": "./validation-errors.json"
  }
}
```

| Propiedad | Tipo | Por defecto | Descripción |
|----------|------|---------|-------------|
| `enabled` | boolean | `true` | Habilita la validación de esquema |
| `strict` | boolean | `false` | Falla ante cualquier error de validación |
| `failOnError` | boolean | `false` | Detiene el procesamiento en el primer error |
| `outputErrors` | string | - | Ruta donde escribir los errores de validación |

---

### `output`

Configura el formato de salida:

```json fds:fragment entity=mapping
{
  "output": {
    "format": "json",
    "pretty": true,
    "directory": "./fds-output",
    "naming": "{{canonical.slug}}",
    "singleFile": false,
    "singleFileName": "exercises.json"
  }
}
```

| Propiedad | Tipo | Por defecto | Descripción |
|----------|------|---------|-------------|
| `format` | string | `json` | Formato de salida: `json`, `jsonl`, `ndjson` |
| `pretty` | boolean | `true` | Imprime el JSON con formato legible |
| `directory` | string | `./` | Directorio de salida |
| `naming` | string | `{{canonical.slug}}` | Plantilla del nombre de archivo |
| `singleFile` | boolean | `false` | Escribe toda la salida en un solo archivo |
| `singleFileName` | string | `output.json` | Nombre del archivo único de salida |

---

### `plugins`

Carga plugins de transformación personalizados:

```json fds:fragment entity=mapping
{
  "plugins": [
    "./plugins/my-transforms.js",
    {
      "name": "./plugins/custom.js",
      "options": {
        "apiKey": "..."
      }
    }
  ]
}
```

Ver [Desarrollo de plugins](/docs/tools/transformer/plugins) para más detalles.

---

## Ejemplo completo

```json
{
  "$schema": "https://spec.vitness.me/schemas/transformer/v1.1.0/mapping.schema.json",
  "version": "1.0.0",
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise"
  },
  "registries": {
    "muscles": {
      "source": "local",
      "local": "./registries/muscles.registry.json"
    },
    "equipment": {
      "source": "local",
      "local": "./registries/equipment.registry.json"
    }
  },
  "mappings": {
    "exerciseId": {
      "from": null,
      "transform": "uuid"
    },
    "schemaVersion": {
      "from": null,
      "default": "1.0.0"
    },
    "canonical.name": {
      "from": "name",
      "transform": "titleCase",
      "required": true
    },
    "canonical.slug": {
      "from": "name",
      "transform": "slugify"
    },
    "classification.exerciseType": {
      "from": "type",
      "default": "strength"
    },
    "targets.primary": {
      "from": "target",
      "transform": "registryLookup",
      "options": {
        "registry": "muscles",
        "fuzzyMatch": true,
        "returnFormat": "array"
      }
    },
    "equipment.required": {
      "from": "equipment",
      "transform": ["toArray", "registryLookup"],
      "options": {
        "registry": "equipment",
        "fuzzyMatch": true
      }
    },
    "metrics.primary": {
      "from": null,
      "default": { "type": "reps", "unit": "count" }
    },
    "metadata": {
      "from": null,
      "transform": "autoGenerate",
      "options": {
        "fields": ["createdAt", "updatedAt", "status"]
      }
    }
  },
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
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" },
      "targets.secondary": { "tier": "complex", "prompt": "biomechanics" }
    }
  },
  "validation": {
    "enabled": true,
    "strict": false
  },
  "output": {
    "format": "json",
    "pretty": true,
    "directory": "./fds-output"
  }
}
```

---

## Ver también

- [Transformaciones integradas](/docs/tools/transformer/transforms) - Funciones de transformación disponibles
- [Enriquecimiento con IA](/docs/tools/transformer/ai-enrichment) - Configuración del enriquecimiento por niveles
- [Desarrollo de plugins](/docs/tools/transformer/plugins) - Crear transformaciones personalizadas
- [Ejemplos](/docs/tools/transformer/examples) - Ejemplos de flujos de trabajo completos
