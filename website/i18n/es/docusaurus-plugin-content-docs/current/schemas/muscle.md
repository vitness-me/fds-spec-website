---
title: Esquema de músculo
description: JSON Schema del modelo de datos de músculo
sidebar_position: 4
---

# Esquema de músculo (v1.0.0)

El esquema de músculo define entidades anatómicas de músculos con clasificación, datos de visualización de mapa de calor y metadatos.

## Ubicación del esquema

**URL:** `https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.schema.json`

**Descarga:** [muscle.schema.json](https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.schema.json)

## Ejemplos

Ver los ejemplos de músculo:
- [Músculo básico](https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.example.json)
- [Músculo dorsal ancho](https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.example.lats.json)

## Especificación

Para información detallada sobre el modelo de datos de músculo, véase [RFC-003: Modelo de datos de músculo](../specifications/rfc-003-muscle-data-model).

## Campos clave

- `id`: identificador UUID
- `schemaVersion`: cadena de versión (p. ej., "1.0.0")
- `canonical`: nomenclatura estandarizada con slug y alias
- `classification`: categoría del músculo, región, lateralidad
- `heatmap`: datos de visualización con regiones y valores de intensidad
- `metadata`: estado, marcas de tiempo, autoría
