---
title: Ejemplos
description: Datos de ejemplo y guías de implementación para FDS
sidebar_position: 1
---

# Ejemplos de FDS

Esta sección ofrece datos de ejemplo y guías de implementación para el Fitness Data Standard.

## Registros

Bajo `/registries/` se publican dos clases distintas de archivo, y distinguirlas importa.

### Registros de vocabulario — normativos

Estos definen los valores recomendados para un clasificador abierto. Varios campos de FDS son deliberadamente cadenas abiertas en lugar de enumeraciones, y estos registros son lo que impide que "abierto" signifique "indefinido".

- **Tipo de ejercicio**: [`exercise-type.registry.json`](https://spec.vitness.me/registries/exercise-type.registry.json)
- **Tipo de sesión de entrenamiento**: [`workout-type.registry.json`](https://spec.vitness.me/registries/workout-type.registry.json)
- **Rol del bloque**: [`block-role.registry.json`](https://spec.vitness.me/registries/block-role.registry.json)
- **Zona de intensidad**: [`intensity-zone.registry.json`](https://spec.vitness.me/registries/intensity-zone.registry.json)

Abierto significa abierto: un productor que emite un valor no listado sigue habiendo producido un documento válido, y un consumidor que encuentre uno **NO DEBE** rechazarlo.

### Ejemplos de catálogo de entidades — ilustrativos

Estos muestran la forma que sirve un proveedor: un arreglo de documentos de entidad, cada uno con su propio `schemaVersion`. No son normativos, y nada en FDS exige estas entradas en particular.

- **Equipamiento**: [`equipment.registry.example.json`](https://spec.vitness.me/registries/equipment.registry.example.json)
- **Músculos**: [`muscles.registry.example.json`](https://spec.vitness.me/registries/muscles.registry.example.json)
- **Categorías de músculos**: [`muscle-categories.registry.example.json`](https://spec.vitness.me/registries/muscle-categories.registry.example.json)

El `.example.` en el nombre del archivo es la distinción: un archivo llamado `*.registry.json` es el registro; un archivo llamado `*.registry.example.json` es un ejemplo de uno. Ver el [README de registros](https://spec.vitness.me/registries/README.md) para las reglas completas.

## Entidades de ejemplo

<!-- fds:count examples=136 -->
Se publican 136 documentos de ejemplo, cada uno servido desde la misma ruta versionada que el esquema que demuestra. Todos se validan en CI, de modo que un ejemplo que deja de coincidir con su esquema hace fallar la compilación.

<!-- fds:count examples:exercise=8 -->
### Ejemplos de ejercicio (8)
- Definición básica de ejercicio
- Ejercicio de cardio
- Ejercicio de acondicionamiento
- Ejercicio de movilidad/flexibilidad
- Ejercicio en máquina
- Ejercicio unilateral
- Ejercicio asistido
- Ejercicio basado en velocidad

<!-- fds:count examples:equipment=2 -->
### Ejemplos de equipamiento (2)
- Definición básica de equipamiento (una barra)
- Equipamiento con torre de placas, donde la carga se selecciona en incrementos fijos

<!-- fds:count examples:muscle=2 -->
### Ejemplos de músculo (2)
- Un músculo con regiones de mapa de calor y un nombre localizado
- Un segundo músculo que lleva alias localizados junto a sus regiones

<!-- fds:count examples:muscle-category=1 -->
### Ejemplos de categoría de músculo (1)
- Una categoría de nivel superior con descripciones localizadas y etiquetas de clasificación

<!-- fds:count examples:body-atlas=1 -->
### Ejemplos de atlas corporal (1)
- Un atlas con vistas anterior y posterior, y áreas con nombre vinculadas a selectores dentro de ellas

<!-- fds:count examples:prescription=58 invalid:prescription=15 -->
### Ejemplos de prescripción (58)
Fragmentos en lugar de documentos completos: uno por cada discriminador que define la biblioteca de definiciones de RFC-006 — objetivos de carga, objetivos de repeticiones, tempo, descanso, zonas de intensidad, esquemas de series y reglas de progresión. Otros 15 ejemplos negativos fijan lo que el esquema sigue rechazando. Indexados en [el README de archivos de ejemplo](https://spec.vitness.me/schemas/prescription/v1.0.0/README.md).

<!-- fds:count examples:workout=46 -->
### Ejemplos de sesión de entrenamiento (46)
Sesiones completas que validan: una por cada esquema de series y repeticiones de la matriz de cobertura, una por cada estructura de agrupación, desde un ejercicio único hasta un chipper, y una por cada escenario de cardio y resistencia. Indexadas en [el README de archivos de ejemplo](https://spec.vitness.me/schemas/workout/v1.1.0/README.md).

<!-- fds:count examples:program=18 -->
### Ejemplos de programa (18)
Programas completos que validan y cubren los modelos de periodización y de cronograma de RFC-008: lineal, ondulante, por bloques, conjugado, olas de porcentaje, descargas, ramificación condicional y más. Ninguno de ellos contiene una serie, una repetición ni una carga: un programa es un cronograma de referencias a sesiones de entrenamiento, y la prescripción vive en las sesiones a las que apunta. Indexados en [el README de archivos de ejemplo](https://spec.vitness.me/schemas/program/v1.0.0/README.md).

## Patrones de implementación

Para guías de implementación y flujos de migración de datos, ver:
- [Especificaciones](/docs/specifications/rfc-001-exercise-data-model) - Documentación completa de los RFC
- [Esquemas](/docs/schemas) - Visores interactivos de esquemas
- [Validación rápida](/docs/getting-started/quick-validation) - Guía de validación
