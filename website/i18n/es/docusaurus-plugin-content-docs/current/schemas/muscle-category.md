---
title: Esquema de categoría de músculos
description: JSON Schema del modelo de datos de categoría de músculos
sidebar_position: 5
---

# Esquema de categoría de músculos (v1.0.0)

El esquema de categoría de músculos define agrupaciones y categorizaciones de músculos con etiquetado flexible y metadatos.

## Ubicación del esquema

**URL:** `https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`

**Descarga:** [muscle-category.schema.json](https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json)

## Ejemplos

Ver los ejemplos de categoría de músculos:
- [Categoría básica](https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.example.json)

## Especificación

Para información detallada sobre el modelo de datos de categoría de músculos, véase [RFC-004: Modelo de datos de categoría de músculos](../specifications/rfc-004-muscle-category-data-model).

## Campos clave

- `id`: identificador UUID
- `schemaVersion`: cadena de versión (p. ej., "1.0.0")
- `canonical`: nomenclatura estandarizada con slug y alias
- `classification`: etiquetas y atributos de la categoría
- `metadata`: estado, marcas de tiempo, autoría
