---
title: Esquema de atlas corporal
description: JSON Schema del modelo de datos de atlas corporal
sidebar_position: 6
---

# Esquema de atlas corporal (v1.0.0)

El esquema de atlas corporal define estructuras interactivas de visualización del cuerpo con múltiples vistas, áreas y vinculaciones a músculos.

## Ubicación del esquema

**URL:** `https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.schema.json`

**Descarga:** [body-atlas.schema.json](https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.schema.json)

## Ejemplos

Ver los ejemplos de atlas corporal:
- [Atlas corporal básico](https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.example.json)

## Especificación

Para información detallada sobre el modelo de datos de atlas corporal, véase [RFC-005: Modelo de datos de atlas corporal](../specifications/rfc-005-body-atlas-data-model).

## Campos clave

- `id`: identificador UUID
- `schemaVersion`: cadena de versión (p. ej., "1.0.0")
- `canonical`: nomenclatura estandarizada con slug y alias
- `views`: distintas vistas del cuerpo (frontal, posterior, lateral) con recursos visuales
- `areas`: regiones interactivas en las que se puede hacer clic, mapeadas a músculos
- `metadata`: estado, marcas de tiempo, autoría
