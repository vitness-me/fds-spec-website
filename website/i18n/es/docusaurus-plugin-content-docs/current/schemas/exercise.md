---
title: Esquema de ejercicio
description: JSON Schema del modelo de datos de ejercicio
sidebar_position: 2
---

# Esquema de ejercicio (v1.1.0)

El esquema de ejercicio define el modelo de datos central para ejercicios de fitness. Incluye clasificación, músculos objetivo, requisitos de equipamiento y recursos de medios.

## Ubicación del esquema

**URL:** `https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json`

**Descarga:** [exercise.schema.json](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.schema.json)

## Ejemplos

Ver los ejemplos de ejercicio:
- [Ejercicio básico](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.json)
- [Ejercicio de cardio](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.cardio.json)
- [Ejercicio de movilidad](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.mobility.json)
- [Ejercicio en máquina](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.machine.json)
- [Ejercicio unilateral](https://spec.vitness.me/schemas/exercises/v1.1.0/exercise.example.unilateral.json)

## Especificación

Para información detallada sobre el modelo de datos de ejercicio, véase [RFC-001: Modelo de datos de ejercicio](../specifications/rfc-001-exercise-data-model).

## Campos clave

- `id`: identificador UUID
- `schemaVersion`: cadena de versión (p. ej., "1.0.0")
- `canonical`: nomenclatura estandarizada con slug y alias
- `classification`: tipo de ejercicio, mecánica, fuerza, nivel, cadena cinética
- `targets`: músculos objetivo primarios y secundarios con niveles de activación
- `equipment`: equipamiento obligatorio, opcional y alternativo
- `media`: imágenes, videos y diagramas
- `metadata`: estado, marcas de tiempo, autoría
