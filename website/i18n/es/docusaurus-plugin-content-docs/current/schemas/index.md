---
title: JSON Schemas
description: Cada esquema FDS publicado, en la versión bajo la que se publica
sidebar_position: 1
---

# JSON Schemas de FDS

FDS se define en JSON Schema (Draft 2020-12). Cada esquema listado abajo se publica en una URL congelada: los bytes en una URL de versión nunca cambian, y un cambio se publica en una URL nueva.

<!-- fds:count schemas=11 entities=7 libraries=1 tooling=1 superseded=2 -->
Se publican 11 esquemas: 7 son entidades, 1 es una biblioteca de definiciones, 1 configura una herramienta y 2 son versiones sustituidas que se siguen sirviendo.

## Las versiones de entidades no son uniformes

Un lanzamiento nombra un *conjunto* de versiones de entidades, no una versión que todas compartan. El lanzamiento actual es **1.4.0**, y publica:

| Entidad | Versión | URL del esquema |
|---|---|---|
| [Ejercicio](/docs/schemas/exercise) | 1.1.0 | `/schemas/exercises/v1.1.0/exercise.schema.json` |
| [Equipamiento](/docs/schemas/equipment) | 1.1.0 | `/schemas/equipment/v1.1.0/equipment.schema.json` |
| [Músculo](/docs/schemas/muscle) | 1.0.0 | `/schemas/muscle/v1.0.0/muscle.schema.json` |
| [Categoría de músculos](/docs/schemas/muscle-category) | 1.0.0 | `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json` |
| [Atlas corporal](/docs/schemas/body-atlas) | 1.0.0 | `/schemas/atlas/v1.0.0/body-atlas.schema.json` |
| [Sesión de entrenamiento](/docs/schemas/workout) | 1.1.0 | `/schemas/workout/v1.1.0/workout.schema.json` |
| [Programa](/docs/schemas/program) | 1.0.0 | `/schemas/program/v1.0.0/program.schema.json` |

No existe `muscle/v1.4.0/`, y no existirá a menos que muscle mismo cambie. Construir las URLs de esquemas a partir de la versión de la entidad, nunca a partir del lanzamiento — véase el [endpoint de descubrimiento](/docs/core-concepts/discovery) para saber cómo un proveedor anuncia qué versión de entidad sirve.

## Las entidades

### [Esquema de ejercicio](/docs/schemas/exercise) — v1.1.0
El modelo de datos central de ejercicios, con clasificación, objetivos, equipamiento, métricas y medios.

**Esquema:** `/schemas/exercises/v1.1.0/exercise.schema.json`

### [Esquema de equipamiento](/docs/schemas/equipment) — v1.1.0
Definiciones de equipamiento de fitness con clasificación, características de carga y metadatos.

**Esquema:** `/schemas/equipment/v1.1.0/equipment.schema.json`

### [Esquema de músculo](/docs/schemas/muscle) — v1.0.0
Definiciones anatómicas de músculos con visualización de mapa de calor.

**Esquema:** `/schemas/muscle/v1.0.0/muscle.schema.json`

### [Esquema de categoría de músculos](/docs/schemas/muscle-category) — v1.0.0
Estructura de agrupación y categorización de músculos.

**Esquema:** `/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`

### [Esquema de atlas corporal](/docs/schemas/body-atlas) — v1.0.0
Estructura de visualización del cuerpo con vistas y áreas.

**Esquema:** `/schemas/atlas/v1.0.0/body-atlas.schema.json`

### [Esquema de sesión de entrenamiento](/docs/schemas/workout) — v1.1.0
Una sesión prescrita: bloques de elementos, un modo de ejecución por bloque y una prescripción por serie. La 1.1.0 agregó zonas de intensidad por serie y ajustes de máquina (RFC-007 §6).

**Esquema:** `/schemas/workout/v1.1.0/workout.schema.json`

### [Esquema de programa](/docs/schemas/program) — v1.0.0
Un cronograma de referencias a sesiones de entrenamiento a lo largo del tiempo: ciclos, semanas, ubicación de días, progresión y ramificación.

**Esquema:** `/schemas/program/v1.0.0/program.schema.json`

## Bibliotecas de definiciones

### [Primitivas de prescripción](/docs/schemas/prescription) — v1.0.0
Carga, repeticiones, tempo, descanso, zonas de intensidad, esquemas de series y reglas de progresión — las definiciones que las sesiones de entrenamiento y los programas componen.

**Esquema:** `/schemas/prescription/v1.0.0/prescription.schema.json`

Este esquema **no es una entidad**, y un proveedor no lo exporta. Su raíz no valida nada por construcción: no existe un documento de prescripción que sostener, solo definiciones que otros esquemas usan. La validación se hace contra una definición en su interior — `…/prescription.schema.json#/$defs/loadTarget` — nunca contra la raíz. Un proveedor que admite sesiones de entrenamiento ya admite la prescripción; eso es lo que significa admitir sesiones de entrenamiento.

## Esquemas de herramientas

### Mapeo del Transformer — v1.1.0
Configuración del FDS Transformer: cómo los campos de origen se mapean a una entidad FDS. Describe la entrada de una herramienta, no una entidad, de modo que se documenta junto con la herramienta. No pertenece a ningún lanzamiento — un lanzamiento nombra entidades y las bibliotecas que estas componen, y esto configura una herramienta.

**Esquema:** `/schemas/transformer/v1.1.0/mapping.schema.json` — véase [la configuración del Transformer](/docs/tools/transformer/configuration).

## Sustituidos, todavía servidos

<!-- fds:pin workout/v1.0.0/workout.schema.json — listed on purpose: releases 1.2.0 and 1.3.0 declare workout at 1.0.0, so a client pinned to either must keep resolving this URL. The section says plainly not to build against it. -->
<!-- fds:pin transformer/v1.0.0/mapping.schema.json — listed on purpose: it is the `$schema` URL every configuration written before 1.1.0 names, and an editor resolving it must keep getting a document. -->

### Mapeo del Transformer — v1.0.0

**Esquema:** `/schemas/transformer/v1.0.0/mapping.schema.json`

Sustituido por mapping 1.1.0, que agregó las claves de enriquecimiento y evaluación con las que el transformador ya había dejado atrás esta versión. Toda configuración 1.0.0 sigue siendo válida bajo la 1.1.0 — las adiciones son opcionales. Se sigue sirviendo porque es lo que una configuración escrita contra ella nombra en su propio `$schema`, y ningún lanzamiento de FDS gobierna un esquema de herramienta, de modo que nada más diría jamás cuándo puede desaparecer.

### Sesión de entrenamiento — v1.0.0

**Esquema:** `/schemas/workout/v1.0.0/workout.schema.json`

Sustituida por workout 1.1.0. Sigue publicada y sigue congelada, porque los lanzamientos 1.2.0 y 1.3.0 declaran workout en 1.0.0 y un cliente fijado a cualquiera de los dos debe poder seguir resolviéndola. Retirarla rompería a esos clientes, que es exactamente lo que congelar una URL promete no hacer.

No construir contra ella. El trabajo nuevo debería usar workout 1.1.0; los documentos 1.0.0 siguen siendo válidos bajo ella sin cambios, ya que la 1.1.0 solo agregó campos opcionales.

Los ejemplos resueltos viven junto a la versión actual, en `/schemas/workout/v1.1.0/`.

## Validación

Véase la [guía rápida de validación](/docs/getting-started/quick-validation) para instrucciones sobre cómo validar sus datos contra estos esquemas.

## Ubicación de los esquemas

Todos los esquemas se sirven desde: `https://spec.vitness.me/schemas/`
