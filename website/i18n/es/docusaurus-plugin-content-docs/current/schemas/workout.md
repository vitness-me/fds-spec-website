---
title: Esquema de sesión de entrenamiento
description: JSON Schema de una sola sesión de entrenamiento prescrita — bloques, modos de ejecución, agrupación y prescripción por serie
sidebar_position: 8
---

# Esquema de sesión de entrenamiento (v1.1.0)

Una sesión de entrenamiento es **una sesión prescrita**: qué se hace, en qué orden, agrupado cómo, y cómo se prescribe cada elemento.

## Ubicación del esquema

**URL:** `https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json`

**Descarga:** [workout.schema.json](https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json)

`v1.0.0` permanece publicada y congelada en su propia URL. La 1.1.0 es puramente aditiva, de modo que todo documento 1.0.0 valida contra ella sin cambios.

## Bloques de elementos, y un modo

La afirmación central es estructural: **una sesión de entrenamiento son bloques de elementos, y cómo se ejecuta un bloque es una propiedad del bloque, no un tipo distinto de documento.**

Las series simples, las superseries, los circuitos, EMOM, AMRAP, Tabata y el trabajo por intervalos son todos el mismo esquema, y difieren solo en `blocks[].mode`. Ningún estilo de entrenamiento recibe un esquema propio, y no hay campos por estilo — ni `isCircuit`, ni `emomInterval`, ni `tabataRounds`.

`mode` decide tres cosas que un consumidor no puede inferir de otra manera:

1. **Recorrido** — todas las series del elemento uno antes del elemento dos (`sequential`), o una serie de cada uno por pasada (`circuit`, `superset`)
2. **Terminación** — el bloque termina cuando el trabajo se completa (`sequential`, `forTime`) o cuando expira un reloj (`amrap`, `emom`, `tabata`)
3. Qué `modeParams` son significativos

| `mode` | `modeParams` significativos | Termina cuando |
|---|---|---|
| `sequential` | — | Todos los elementos se completan |
| `superset` | `rounds` | Todas las series de cada grupo se completan |
| `circuit` | `rounds`, `rest` | Se completan los `rounds` |
| `emom` | `rounds`, `interval` | Transcurren `rounds` intervalos |
| `amrap` | `timeCap` | Expira el `timeCap` |
| `forTime` | `rounds`, `timeCap` | El trabajo se completa, o expira el `timeCap` |
| `tabata` | `rounds`, `work`, `rest` | Se completan los `rounds` |
| `interval` | `rounds`, `work`, `rest` | Se completan los `rounds` |

Un modo que no se reconoce **no debe ejecutarse recurriendo a `sequential`**. Mostrar los elementos y sus prescripciones, y decir que la estructura no se entiende. Ejecutar una estructura de intervalos no reconocida como series simples no produce una sesión ligeramente distinta — produce un estímulo fisiológico diferente y, en un bloque de acondicionamiento, posiblemente uno para el que el atleta no está preparado.

## La agrupación es una etiqueta, no un anidamiento

Los elementos que comparten un `groupLabel` dentro de un bloque se alternan. `A1`, `A2` es una superserie; `A1`, `A2`, `A3`, una triserie. La letra ordena los grupos, el dígito ordena los miembros. Es la convención que los entrenadores ya escriben en papel, hecha procesable.

**La superserie, la serie compuesta y el emparejamiento antagonista no se distinguen estructuralmente.** Los tres son dos elementos alternados con el descanso diferido al final del grupo; difieren solo en si los ejercicios comparten un grupo muscular o se oponen — lo cual es derivable de los `targets` de los ejercicios referenciados. Codificarlo de nuevo aquí crearía una segunda fuente de verdad que puede discrepar de la primera.

## Series: explícitas o mediante esquema, nunca ambas cosas

Un elemento declara sus series de una de dos maneras: `sets[]`, un arreglo explícito donde cada serie lleva su propia carga, repeticiones, tempo y descanso; o `scheme`, un patrón con nombre de RFC-006 con sus parámetros.

Son mutuamente excluyentes y el esquema lo hace cumplir. Un elemento que lleva ambos declara el mismo trabajo dos veces sin nada que diga cuál gana, y un consumidor que elige mal cambia el entrenamiento.

Los valores `load`, `reps`, `tempo` y `rest` a nivel de elemento se aplican a todas las series. Un valor a nivel de serie lo sobrescribe solo para esa serie.

## Ajustes de máquina

Algunas prescripciones no son ni carga, ni repeticiones, ni tempo, ni descanso. Una caminadora con cinco por ciento de inclinación, una bicicleta mantenida a noventa revoluciones por minuto — el atleta los configura antes de empezar, y nada más en el modelo los alcanza.

`settings` es un arreglo de formas de métrica con un valor adjunto: un `type` y una `unit` del vocabulario compartido de RFC-001, un `value`, opcionalmente un `range` y `notes`. Se coloca en un elemento o en una sola serie, de modo que una inclinación que sube cada cinco minutos son tres series en lugar de tres elementos.

Deliberadamente no es una definición nueva por cada ajuste. La carga y el descanso ganaron las suyas porque cada uno lleva una semántica sobre la que un consumidor debe actuar — un método de resolución, un ámbito. Una inclinación no lleva ninguna: es un número en una unidad que el atleta configura.

**La resistencia es una carga, no un ajuste.** Cambia cuán duro es el trabajo, así que sigue siendo un `loadTarget` con `method: "level"` y una `scale` con nombre. La inclinación y la cadencia cambian qué es el movimiento, no cuán pesado es.

Desde la 1.1.0 una serie también lleva `zone`. La carga, las repeticiones, el tempo y el descanso siempre pudieron declararse por serie y la intensidad no, de modo que una sesión cuya intensidad subía serie a serie tenía que dividirse en un elemento por escalón. Eso era una asimetría, no una decisión.

## Los resúmenes agregados son orientativos

`targets` y `equipment` resumen lo que la sesión entrena y necesita. Ambos son opcionales y **no deben** tratarse como autoritativos por encima de recorrer los elementos — pueden estar ausentes, desactualizados o calculados bajo supuestos que no se comparten. Un resumen agregado producido antes de que un elemento fuera sustituido ya no describe la sesión. Recalcular cuando la corrección importe.

## Ejemplos resueltos

<!-- fds:count examples:workout=46 scenarios:workout=46 -->
Se publican 46 sesiones junto al esquema — una por cada esquema de series y repeticiones de la matriz de cobertura, una por cada estructura de agrupación desde un ejercicio único hasta un *chipper*, y una por cada escenario de cardio y resistencia. Cada una está indexada en [el README de los archivos de ejemplo](https://spec.vitness.me/schemas/workout/v1.1.0/README.md).

El conjunto de agrupaciones es la verdadera prueba de la afirmación de arriba: si alguna estructura hubiera necesitado un campo que el esquema no tiene, la abstracción estaría cortada por el lugar equivocado.

## Campos clave

- `workoutId`, `schemaVersion`, `canonical`, `metadata` — la envoltura compartida de RFC-001
- `classification.workoutType` — un clasificador abierto, con valores recomendados en el [registro de tipos de sesión de entrenamiento](https://spec.vitness.me/registries/workout-type.registry.json)
- `structure.blocks[]` — al menos un bloque, cada uno con al menos un elemento
- `blocks[].role` — para qué sirve un bloque, con valores recomendados en el [registro de roles de bloque](https://spec.vitness.me/registries/block-role.registry.json)
- `items[].alternatives[]` — sustituciones que el autor sanciona de antemano, distintas de la que un atleta hace a mitad de sesión
- `items[].repStyle` — rango de movimiento y composición de la repetición, para repeticiones parciales y de una y media

## Especificación

[RFC-007: Modelo de datos de sesión de entrenamiento](../specifications/rfc-007-workout-data-model). La prescripción misma proviene de [RFC-006](../specifications/rfc-006-prescription-primitives).
