---
title: Esquema de atlas corporal
description: JSON Schema del modelo de datos de atlas corporal
sidebar_position: 6
---

# Esquema de atlas corporal (v1.1.0)

El esquema de atlas corporal define estructuras interactivas de visualización del cuerpo con múltiples vistas, áreas y vinculaciones a músculos.

## Ubicación del esquema

**URL:** `https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.schema.json`

**Descarga:** [body-atlas.schema.json](https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.schema.json)

`v1.0.0` permanece publicada y congelada en su propia URL. La 1.1.0 es puramente aditiva, de modo que todo documento 1.0.0 valida contra ella sin cambios.

## Ejemplos

Ver los ejemplos de atlas corporal:
- [Atlas corporal básico](https://spec.vitness.me/schemas/atlas/v1.1.0/body-atlas.example.json)

## Especificación

Para información detallada sobre el modelo de datos de atlas corporal, véase [RFC-005: Modelo de datos de atlas corporal](../specifications/rfc-005-body-atlas-data-model).

## Campos clave

- `id`: identificador UUID
- `schemaVersion`: cadena de versión (p. ej., "1.1.0")
- `canonical`: nomenclatura estandarizada con slug y alias
- `views`: distintas vistas del cuerpo (frontal, posterior, lateral) con recursos visuales
- `views[].asset.license` y `views[].asset.attribution`: términos y texto de crédito opcionales para la ilustración de cada vista (1.1.0). La ausencia de `license` significa que los términos no están declarados, no que la ilustración sea de uso libre
- `areas`: regiones interactivas en las que se puede hacer clic, mapeadas a músculos
- `metadata`: estado, marcas de tiempo, autoría
