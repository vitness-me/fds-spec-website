---
title: Enriquecimiento con IA
description: Enriquecimiento con IA por niveles para la generación inteligente de campos
sidebar_position: 5
---

# Enriquecimiento con IA

El FDS Transformer admite el **enriquecimiento con IA por niveles**: un sistema multinivel que usa distintos modelos de IA según la complejidad del campo. Esto permite una generación de campos inteligente y con costos controlados, manteniendo la calidad donde más importa.

## Visión general

El enriquecimiento por niveles agrupa los campos por complejidad:

| Nivel | Modelo | Caso de uso | Costo | Velocidad |
|------|-------|----------|------|-------|
| **Simple** | Claude Haiku 4.5 | Enriquecimiento rápido y directo | Bajo | Rápida |
| **Medium** | Claude Sonnet 4.5 | Equilibrio entre precisión y velocidad | Medio | Media |
| **Complex** | Claude Sonnet 4.5 | Análisis biomecánico profundo | Más alto | Más lenta |

Este enfoque:
- **Reduce costos** al usar modelos más baratos para tareas simples
- **Mejora la precisión** al dedicar modelos potentes al análisis complejo
- **Permite el procesamiento por lotes** para reducir las llamadas a la API

## Requisitos

- **Clave de API de OpenRouter** - Se obtiene en [openrouter.ai](https://openrouter.ai/)
- Definir la variable de entorno:

```bash
export OPENROUTER_API_KEY=your-api-key-here
```

## Configuración

### Configuración básica

Agregar la sección `enrichment` al archivo `mapping.json`:

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
      "classification.exerciseType": { "tier": "simple", "prompt": "classification-simple" },
      "classification.level": { "tier": "simple", "prompt": "classification-simple" },
      "metrics.primary": { "tier": "simple", "prompt": "metrics" },
      "equipment.optional": { "tier": "simple", "prompt": "equipment" },
      
      "constraints.contraindications": { "tier": "medium", "prompt": "constraints" },
      "constraints.prerequisites": { "tier": "medium", "prompt": "constraints" },
      "constraints.progressions": { "tier": "medium", "prompt": "progressions" },
      "constraints.regressions": { "tier": "medium", "prompt": "progressions" },
      "relations": { "tier": "medium", "prompt": "relations" },
      
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" },
      "classification.mechanics": { "tier": "complex", "prompt": "biomechanics" },
      "classification.force": { "tier": "complex", "prompt": "biomechanics" },
      "classification.kineticChain": { "tier": "complex", "prompt": "biomechanics" },
      "targets.secondary": { "tier": "complex", "prompt": "biomechanics" }
    }
  }
}
```

### Configuración de niveles

Cada nivel tiene estos ajustes:

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `model` | string | Identificador del modelo en OpenRouter |
| `temperature` | number | Temperatura de generación (0-1). Más baja = más determinista |
| `maxTokens` | number | Máximo de tokens para la respuesta |
| `batchSize` | number | Número de ejercicios que se procesan juntos |
| `priority` | string | Sugerencia de optimización: `speed`, `balanced` o `accuracy` |

### Configuración de campos

Cada campo del objeto `fields`:

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `tier` | string | Qué nivel usar: `simple`, `medium`, `complex` |
| `prompt` | string | Clave de la plantilla de prompt |
| `enum` | string[] | Valores válidos (para campos restringidos) |
| `required` | boolean | Si el campo debe completarse |

## Mapeo de campos a niveles

### Campos del nivel simple

Enriquecimiento rápido para datos directos:

| Campo | Prompt | Descripción |
|-------|--------|-------------|
| `canonical.aliases` | `aliases` | Nombres alternativos del ejercicio |
| `classification.exerciseType` | `classification-simple` | Tipo de ejercicio (fuerza, cardio, etc.) |
| `classification.level` | `classification-simple` | Nivel de dificultad |
| `metrics.primary` | `metrics` | Tipo de medición principal |
| `equipment.optional` | `equipment` | Sugerencias de equipamiento opcional |

### Campos del nivel medio

Enriquecimiento equilibrado para datos relacionales:

| Campo | Prompt | Descripción |
|-------|--------|-------------|
| `constraints.contraindications` | `constraints` | Contraindicaciones médicas o por lesión |
| `constraints.prerequisites` | `constraints` | Capacidades requeridas |
| `constraints.progressions` | `progressions` | Variantes más difíciles |
| `constraints.regressions` | `progressions` | Variantes más fáciles |
| `relations` | `relations` | Referencias a ejercicios relacionados |

### Campos del nivel complejo

Análisis profundo para datos biomecánicos:

| Campo | Prompt | Descripción |
|-------|--------|-------------|
| `classification.movement` | `biomechanics` | Clasificación del patrón de movimiento |
| `classification.mechanics` | `biomechanics` | Compuesto frente a aislamiento |
| `classification.force` | `biomechanics` | Dirección de la fuerza (empuje/tracción/estática) |
| `classification.kineticChain` | `biomechanics` | Cadena abierta frente a cerrada |
| `targets.secondary` | `biomechanics` | Músculos secundarios implicados |

## Ejecutar el enriquecimiento

### Enriquecimiento completo (todos los niveles)

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --output ./fds-output/
```

### Un solo nivel

Ejecutar niveles específicos para controlar costos o depurar:

```bash
# Simple tier only (fastest, cheapest)
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier simple

# Medium tier only
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier medium

# Complex tier only (most detailed)
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier complex
```

### Omitir el enriquecimiento

Transformar sin ningún enriquecimiento con IA:

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --no-enrichment
```

## Estimación de costos

Previsualizar los costos antes de ejecutar:

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --estimate-cost
```

Salida:
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
└───────────────────────────────────────────────────────────────────────┘
```

## Respaldo y manejo de errores

Configurar la degradación controlada:

```json fds:fragment entity=mapping
{
  "enrichment": {
    "fallback": {
      "retries": 2,
      "degradeModel": true,
      "useDefaults": true,
      "degradeChain": {
        "complex": "medium",
        "medium": "simple",
        "simple": null
      }
    }
  }
}
```

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `retries` | number | Número de reintentos antes de degradar |
| `degradeModel` | boolean | Intenta con el modelo del nivel inferior ante un fallo |
| `useDefaults` | boolean | Usa los valores predeterminados ante un error total |
| `degradeChain` | object | Cadena de respaldo de modelos |

Las cuatro son obligatorias en conjunto. El transformador usa este objeto *en lugar de* sus valores predeterminados, en vez de combinarlos, de modo que un `fallback` sin `degradeChain` deja la ruta de degradación sin definir en el momento en que se necesita: en la ruta de error, donde es más difícil notarlo.

## Límite de tasa

Controlar la tasa de solicitudes a la API:

```json fds:fragment entity=mapping
{
  "enrichment": {
    "rateLimit": {
      "requestsPerMinute": 50,
      "backoffStrategy": "exponential",
      "initialBackoffMs": 1000,
      "maxBackoffMs": 60000
    }
  }
}
```

| Propiedad | Tipo | Valor predeterminado | Descripción |
|----------|------|---------|-------------|
| `requestsPerMinute` | number | 50 | Máximo de solicitudes por minuto |
| `backoffStrategy` | string | `exponential` | Tipo de backoff: `exponential`, `linear`, `fixed` |
| `initialBackoffMs` | number | 1000 | Retardo inicial de backoff |
| `maxBackoffMs` | number | 60000 | Retardo máximo de backoff |

## Puntos de control y reanudación

Habilitar el guardado de puntos de control para ejecuciones largas:

```json fds:fragment entity=mapping
{
  "enrichment": {
    "checkpoint": {
      "enabled": true,
      "saveInterval": 10
    }
  }
}
```

Reanudar desde el punto de control:

```bash
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --resume
```

## Modo de depuración

Habilitar el registro detallado:

```bash
DEBUG_ENRICHMENT=true fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --log-level debug
```

Esto muestra:
- Los prompts enviados a la IA
- Las respuestas sin procesar
- El uso de tokens por solicitud
- Información de tiempos

## Enriquecimiento por campo

Para casos de uso más simples o cuando se necesita un control fino, configurar el enriquecimiento por campo en los mapeos:

```json fds:fragment entity=mapping
{
  "mappings": {
    "canonical.description": {
      "from": "description",
      "enrichment": {
        "enabled": true,
        "prompt": "exercise_description",
        "context": ["name", "target", "equipment"],
        "when": "missing",
        "fallback": "No description available"
      }
    }
  }
}
```

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `enabled` | boolean | Habilita el enriquecimiento para este campo |
| `prompt` | string | Clave de la plantilla de prompt o prompt personalizado |
| `context` | string[] | Campos de origen a incluir como contexto |
| `when` | string | Cuándo enriquecer: `always`, `missing`, `empty`, `notFound` |
| `fallback` | any | Valor a usar si el enriquecimiento falla |
| `validate` | boolean | Valida el valor enriquecido contra el esquema |

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `OPENROUTER_API_KEY` | Clave de API para OpenRouter (obligatoria) |
| `FDS_TRANSFORMER_MODEL` | Reemplaza el modelo de IA predeterminado en todos los niveles |
| `DEBUG_ENRICHMENT` | Establecer en `true` para registro detallado |

## Buenas prácticas

1. **Empezar con la estimación de costos** - Ejecutar siempre `--estimate-cost` primero
2. **Probar con lotes pequeños** - Probar con 10-20 elementos antes de las ejecuciones completas
3. **Usar el filtrado por niveles** - Depurar un nivel a la vez con `--tier`
4. **Habilitar los puntos de control** - Habilitarlos siempre con conjuntos de datos grandes
5. **Supervisar el uso de tokens** - Revisar la salida de depuración en busca de oportunidades de optimización
6. **Usar tamaños de lote adecuados** - Los lotes más grandes reducen costos pero pueden aumentar los fallos

## Véase también

- [Configuración](/docs/tools/transformer/configuration) - Referencia completa de configuración
- [Referencia de la CLI](/docs/tools/transformer/cli-reference) - Opciones de comandos
- [Ejemplos](/docs/tools/transformer/examples) - Flujos de trabajo completos
