---
title: Visión general
description: Transformar cualquier esquema de origen al formato FDS con enriquecimiento con IA opcional
sidebar_position: 1
---

# FDS Transformer

Transformar cualquier esquema de origen al formato FDS (Fitness Data Standard), con enriquecimiento con IA opcional.

**Paquete:** `@vitness/fds-transformer`  
**Versión:** 0.1.0  
**Licencia:** MIT

## Visión general

El FDS Transformer es una herramienta de CLI y una biblioteca que convierte los datos de fitness existentes en JSON conforme a FDS. Se encarga de la complejidad de mapear esquemas de origen arbitrarios al formato FDS estandarizado, con enriquecimiento con IA opcional para generar los campos faltantes.

## Características principales

| Característica | Descripción |
|---------|-------------|
| **CLI interactiva** | Interfaz elegante estilo asistente para una transformación guiada |
| **Modo no interactivo** | Procesamiento por lotes para pipelines de CI/CD |
| **Enriquecimiento con IA por niveles** | Generación de campos con IA en varios niveles a través de OpenRouter |
| **Gestión de registros** | Búsquedas de músculos, equipamiento y categorías con coincidencia aproximada |
| **Compatibilidad con varias versiones** | Permite apuntar a distintas versiones del esquema FDS |
| **Sistema de plugins** | Extensible con transformaciones personalizadas |
| **Punto de control y reanudación** | Reanudación de transformaciones de larga duración |
| **Estimación de costos** | Vista previa de los costos de enriquecimiento con IA antes de ejecutar |

## Cómo funciona

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Source Data    │────▶│  FDS Transformer │────▶│  FDS-Compliant  │
│  (any format)   │     │                  │     │     JSON        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                        ┌──────┴──────┐
                        ▼             ▼
               ┌─────────────┐ ┌─────────────┐
               │  Registries │ │ AI Provider │
               │  (muscles,  │ │ (optional)  │
               │  equipment) │ │             │
               └─────────────┘ └─────────────┘
```

1. **Cargar** los datos de origen (arreglo JSON u objeto único)
2. **Configurar** los mapeos de campos en `mapping.json`
3. **Transformar** con las transformaciones integradas (slugify, titleCase, etc.)
4. **Enriquecer** los campos faltantes con IA (opcional)
5. **Validar** la salida contra el JSON Schema de FDS
6. **Generar** archivos JSON conformes a FDS

## Inicio rápido

### Instalación

```bash
# Global install (recommended for frequent use)
npm install -g @vitness/fds-transformer

# Or use npx without installing
npx @vitness/fds-transformer --help
```

### Uso básico

```bash
# Interactive mode - launches guided wizard
fds-transformer

# Transform with config file
fds-transformer transform \
  --input ./data.json \
  --config ./mapping.json \
  --output ./fds/

# Validate existing FDS data
fds-transformer validate --input ./exercise.json
```

> **Nota:** Si la instalación no fue global, anteponer `npx @vitness/fds-transformer` a los comandos en lugar de `fds-transformer`.

### Uso programático

```typescript
import { Transformer } from '@vitness/fds-transformer';

const transformer = new Transformer({
  config: './mapping.json',
});

// Transform single item
const result = await transformer.transform({
  id: '0001',
  name: 'Barbell Bench Press',
  equipment: 'barbell',
  target: 'pectorals',
});

console.log(result.data);
```

## ¿Qué sigue?

- [Guía de instalación](/docs/tools/transformer/installation) - Instrucciones detalladas de instalación y configuración
- [Referencia de la CLI](/docs/tools/transformer/cli-reference) - Todos los comandos y opciones
- [Configuración](/docs/tools/transformer/configuration) - Referencia de la configuración de mapeo
- [Enriquecimiento con IA](/docs/tools/transformer/ai-enrichment) - Guía de enriquecimiento por niveles
- [Transformaciones integradas](/docs/tools/transformer/transforms) - Referencia de las funciones de transformación
- [Desarrollo de plugins](/docs/tools/transformer/plugins) - Creación de transformaciones personalizadas
- [Ejemplos](/docs/tools/transformer/examples) - Flujos de trabajo de extremo a extremo

## Requisitos

- **Node.js:** >=20.0.0
- **Clave de API:** Requerida solo para el enriquecimiento con IA (OpenRouter)
