---
title: Especificaciones (RFC)
description: Todos los RFC de FDS — los documentos normativos que los esquemas publicados implementan
---

# Especificaciones de FDS

El estándar se especifica en RFC, uno por modelo de datos. Un RFC es el
documento normativo: dice qué significa la entidad, para qué sirven sus campos
y qué debe satisfacer un documento conforme — el JSON Schema publicado es esa
especificación hecha verificable por máquina.

Las páginas de esta sección son copias byte a byte de las fuentes del
directorio `specification/rfc/` del repositorio. La CI compara cada página con
su fuente en cada cambio, de modo que lo que se lee aquí es lo que dice el
estándar.

<!-- fds:count rfcs=8 -->
Se publican 8 RFC:

<!-- fds:covers rfcs -->
| RFC | Especifica |
|---|---|
| [RFC-001 — Modelo de datos de ejercicio](/docs/specifications/rfc-001-exercise-data-model) | La entidad de ejercicio: identidad, clasificación, músculos objetivo y métricas. |
| [RFC-002 — Modelo de datos de equipamiento](/docs/specifications/rfc-002-equipment-data-model) | La entidad de equipamiento: qué es una máquina o un implemento, en términos sobre los que otro sistema puede actuar. |
| [RFC-003 — Modelo de datos de músculo](/docs/specifications/rfc-003-muscle-data-model) | La entidad de músculo: el vocabulario de anatomía que los ejercicios toman como objetivo. |
| [RFC-004 — Modelo de datos de categoría muscular](/docs/specifications/rfc-004-muscle-category-data-model) | La entidad de categoría muscular: las agrupaciones en las que se consolidan los músculos. |
| [RFC-005 — Modelo de datos de atlas corporal](/docs/specifications/rfc-005-body-atlas-data-model) | La entidad de atlas corporal: regiones con nombre que cualquier renderizador puede dibujar a su manera. |
| [RFC-006 — Primitivas de prescripción](/docs/specifications/rfc-006-prescription-primitives) | La biblioteca de definiciones de prescripción: carga, repeticiones, descanso y tempo como piezas reutilizables. La raíz de su esquema no valida nada por diseño. |
| [RFC-007 — Modelo de datos de sesión de entrenamiento](/docs/specifications/rfc-007-workout-data-model) | La entidad de sesión de entrenamiento: cómo se estructura una sesión. |
| [RFC-008 — Modelo de datos de programa de entrenamiento](/docs/specifications/rfc-008-program-data-model) | La entidad de programa: planes de varias semanas que apuntan a las sesiones en lugar de reformularlas. |

Cada RFC nombra la versión del esquema que lo implementa. Para saber qué
versiones de entidades publica el lanzamiento actual, véase la
[visión general de los esquemas JSON](/docs/schemas/) — y téngase en cuenta que
las entidades se versionan de forma independiente: un lanzamiento nombra un
*conjunto* de versiones de entidades, no una versión que todas compartan.
