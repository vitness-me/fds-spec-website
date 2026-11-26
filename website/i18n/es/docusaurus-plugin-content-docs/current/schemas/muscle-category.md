---
title: Esquema de categoría muscular
description: JSON Schema del modelo de datos de categoría muscular
sidebar_position: 5
---

# Esquema de categoría muscular (v1.1.0)

El esquema de categoría muscular define agrupaciones y categorizaciones de músculos con etiquetado flexible y metadatos.

## Ubicación del esquema

**URL:** `https://spec.vitness.me/schemas/muscle/muscle-category/v1.1.0/muscle-category.schema.json`

**Descarga:** [muscle-category.schema.json](https://spec.vitness.me/schemas/muscle/muscle-category/v1.1.0/muscle-category.schema.json)

## Ejemplos

Ver los ejemplos de categoría muscular:
- [Categoría básica](https://spec.vitness.me/schemas/muscle/muscle-category/v1.1.0/muscle-category.example.json)
- [Categoría del cuádriceps](https://spec.vitness.me/schemas/muscle/muscle-category/v1.1.0/muscle-category.example.quadriceps.json)

## Especificación

Para información detallada sobre el modelo de datos de categoría muscular, véase [RFC-004: Modelo de datos de categoría muscular](../specifications/rfc-004-muscle-category-data-model).

## Campos clave

- `id`: identificador UUID
- `schemaVersion`: cadena de versión (p. ej., "1.0.0")
- `fxmg`: [clave de categoría muscular](/docs/core-concepts/structural-keys/muscle-category-key) opcional, la clave estructural de la categoría
- `canonical`: nomenclatura estandarizada con slug y alias
- `classification`: etiquetas y atributos de la categoría
- `metadata`: estado, marcas de tiempo, autoría
