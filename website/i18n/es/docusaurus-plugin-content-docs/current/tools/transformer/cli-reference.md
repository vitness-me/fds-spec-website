---
title: Referencia de la CLI
description: Referencia completa de los comandos y opciones de la CLI del FDS Transformer
sidebar_position: 3
---

# Referencia de la CLI

Referencia completa de todos los comandos y opciones de la CLI del FDS Transformer.

## Sinopsis

```bash
fds-transformer [command] [options]
```

Ejecutar sin ningún comando inicia el modo interactivo.

## Comandos

### `transform`

Transforma los datos de origen al formato FDS.

```bash
fds-transformer transform [options]
```

**Opciones:**

| Opción | Descripción | Valor predeterminado |
|--------|-------------|---------|
| `-i, --input <path>` | Ruta del archivo de entrada (JSON) | Obligatoria |
| `-c, --config <path>` | Archivo de configuración de mapeo | - |
| `-o, --output <path>` | Directorio de salida | Directorio actual |
| `--version <version>` | Versión de destino del esquema FDS | `1.0.0` |
| `--dry-run` | Vista previa sin escribir archivos | `false` |
| `--no-ai` | Deshabilita el enriquecimiento con IA (heredada) | `false` |
| `--no-enrichment` | Omite por completo el enriquecimiento con IA | `false` |
| `--api-key <key>` | Clave de API para el proveedor de enriquecimiento | `$OPENROUTER_API_KEY` |
| `--model <model>` | Modelo de IA (modo heredado de modelo único) | - |
| `--tier <tier>` | Ejecuta solo el nivel indicado (`simple`\|`medium`\|`complex`) | Todos los niveles |
| `--estimate-cost` | Muestra la estimación de costos sin ejecutar | `false` |
| `--resume` | Reanuda desde el punto de control | `false` |
| `--clear-checkpoint` | Elimina el punto de control existente antes de ejecutar | `false` |
| `--no-checkpoint` | Deshabilita el guardado de puntos de control | `false` |
| `--log-level <level>` | Nivel de detalle del registro (`error`\|`warn`\|`info`\|`debug`) | `info` |

**Ejemplos:**

```bash
# Basic transformation
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --output ./fds-output/

# Preview without writing
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --dry-run

# Transform without AI enrichment
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --no-enrichment

# Run only simple tier enrichment
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier simple

# Estimate costs before running
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --estimate-cost

# Resume interrupted transformation
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --resume

# Debug mode
DEBUG_ENRICHMENT=true fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --log-level debug
```

---

### `validate`

Valida los datos FDS contra el esquema.

```bash
fds-transformer validate [options]
```

**Opciones:**

| Opción | Descripción | Valor predeterminado |
|--------|-------------|---------|
| `-i, --input <path>` | Archivo de entrada a validar | Obligatoria |
| `-e, --entity <type>` | Tipo de entidad (`exercise`\|`equipment`\|`muscle`) | `exercise` |
| `--version <version>` | Versión del esquema FDS | `1.0.0` |

**Ejemplos:**

```bash
# Validate an exercise
fds-transformer validate --input ./bench-press.json

# Validate equipment
fds-transformer validate \
  --input ./barbell.json \
  --entity equipment

# Validate against specific version
fds-transformer validate \
  --input ./exercise.json \
  --version 1.0.0
```

**Códigos de salida:**

- `0` - Validación superada
- `1` - Validación fallida o error

---

### `init`

Crea una nueva configuración de mapeo de forma interactiva.

```bash
fds-transformer init [options]
```

**Opciones:**

| Opción | Descripción | Valor predeterminado |
|--------|-------------|---------|
| `-s, --sample <path>` | Archivo de origen de muestra para analizar | - |
| `-o, --output <path>` | Ruta de salida de la configuración | `./mapping.json` |

**Ejemplo:**

```bash
# Generate config from sample data
fds-transformer init \
  --sample ./sample-exercise.json \
  --output ./mapping.json
```

> **Nota:** El asistente interactivo está en desarrollo. Por ahora, consultar la guía de configuración para la configuración manual.

---

### `schemas`

Gestiona los esquemas FDS.

```bash
fds-transformer schemas <action>
```

**Acciones:**

| Acción | Descripción |
|--------|-------------|
| `list` | Lista las versiones de esquema disponibles |
| `update` | Actualiza la caché local de esquemas |

**Ejemplos:**

```bash
# List available schemas
fds-transformer schemas list

# Update schema cache
fds-transformer schemas update
```

---

## Modo interactivo

Ejecutar `fds-transformer` sin argumentos inicia el asistente interactivo:

```bash
fds-transformer
```

```
┌  FDS Transformer
│
◆  What would you like to do?
│  ○ Transform data to FDS format
│  ○ Validate existing FDS data
│  ○ Create new mapping configuration
│  ○ Manage FDS schemas
└
```

---

## Formatos de salida

### Archivos individuales (predeterminado)

Cada elemento transformado se escribe en un archivo separado nombrado por su slug:

```
output/
├── barbell-bench-press.json
├── back-squat.json
├── deadlift.json
└── ...
```

### Archivo único

Configurar en `mapping.json` para escribir todos los elementos en un solo archivo:

```json fds:fragment entity=mapping
{
  "output": {
    "singleFile": true,
    "singleFileName": "exercises.json",
    "pretty": true
  }
}
```

---

## Indicador de progreso

Durante la transformación, la CLI muestra el progreso en tiempo real:

```
┌  FDS Transformer
│
◇  Loaded 1,323 items from ./exercises.json
◇  Loaded config from ./mapping.json
◇  Tiered enrichment configuration detected
│
●  Processing 45/1323: Barbell Bench Press ● │████████░░░░░░░░░░░░│ 12.3%
```

---

## Estimación de costos

Usar `--estimate-cost` para obtener una vista previa de los costos de enriquecimiento con IA:

```bash
fds-transformer transform \
  --config ./mapping.json \
  --input ./exercises.json \
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
│                                                                       │
│ * Estimates based on average token usage. Actual costs may vary.      │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Puntos de control y reanudación

Las transformaciones de larga duración guardan puntos de control automáticamente:

```bash
# Start transformation (checkpoint saved automatically)
fds-transformer transform --input ./exercises.json --config ./mapping.json

# If interrupted, resume from checkpoint
fds-transformer transform --input ./exercises.json --config ./mapping.json --resume

# Clear checkpoint and start fresh
fds-transformer transform --input ./exercises.json --config ./mapping.json --clear-checkpoint

# Disable checkpointing
fds-transformer transform --input ./exercises.json --config ./mapping.json --no-checkpoint
```

Los puntos de control se guardan en `.fds-checkpoint.json` dentro del directorio de salida.

---

## Códigos de salida

| Código | Significado |
|------|---------|
| `0` | Éxito |
| `1` | Error (validación fallida, archivo no encontrado, etc.) |

---

## Véase también

- [Configuración](/docs/tools/transformer/configuration) - Referencia de la configuración de mapeo
- [Enriquecimiento con IA](/docs/tools/transformer/ai-enrichment) - Guía de enriquecimiento por niveles
- [Ejemplos](/docs/tools/transformer/examples) - Flujos de trabajo completos
