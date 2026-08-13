---
title: Esquema de equipamiento
description: JSON Schema del modelo de datos de equipamiento
sidebar_position: 3
---

# Esquema de equipamiento (v1.1.0)

El esquema de equipamiento define entidades de equipamiento de fitness con clasificación, metadatos y atributos extensibles.

## Ubicación del esquema

**URL:** `https://spec.vitness.me/schemas/equipment/v1.1.0/equipment.schema.json`

**Descarga:** [equipment.schema.json](https://spec.vitness.me/schemas/equipment/v1.1.0/equipment.schema.json)

## Ejemplos

Ver los ejemplos de equipamiento:
- [Equipamiento básico](https://spec.vitness.me/schemas/equipment/v1.1.0/equipment.example.json)

## Especificación

Para información detallada sobre el modelo de datos de equipamiento, véase [RFC-002: Modelo de datos de equipamiento](../specifications/rfc-002-equipment-data-model).

## Campos clave

- `id`: identificador UUID
- `schemaVersion`: cadena de versión (p. ej., "1.0.0")
- `canonical`: nomenclatura estandarizada con slug y alias
- `classification`: tipo y categoría del equipamiento
- `attributes`: almacenamiento flexible de pares clave-valor para propiedades específicas del equipamiento
- `metadata`: estado, marcas de tiempo, autoría
