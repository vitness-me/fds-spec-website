---
title: Esquema de programa
description: JSON Schema de un programa de entrenamiento — ciclos, semanas, ubicación de días, progresión y ramificación
sidebar_position: 9
---

# Esquema de programa (v1.0.0)

Un programa coloca sesiones en el tiempo: ciclos, semanas, días y las reglas por las que la prescripción cambia a medida que el plan avanza.

## Ubicación del esquema

**URL:** `https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json`

**Descarga:** [program.schema.json](https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json)

## Un cronograma de referencias, no un contenedor

**Un programa no contiene sesiones de entrenamiento. Apunta a ellas.**

Una sesión usada el lunes de cada semana durante doce semanas se redacta una vez y se referencia doce veces. Una sesión compartida por cuatro programas se corrige una vez, y los cuatro quedan corregidos. La alternativa — incrustar una copia por día — significa que un plan de doce semanas transporta treinta y seis documentos casi idénticos, y un plan reparado en ocho de ellos es peor que uno reparado en ninguno, porque ahora discrepa consigo mismo.

Esto cuesta autocontención, y la especificación lo dice en lugar de fingir lo contrario. Un programa por sí solo no es representable; se necesitan también las sesiones de entrenamiento referenciadas. El `name` desnormalizado en cada referencia existe para que un programa siga siendo *listable* sin resolución, aunque no sea *ejecutable* sin ella.

Una referencia que no se puede resolver **debe ser reportada**, no omitida y no tratada como un día de descanso. Una sesión irresoluble y un descanso prescrito son instrucciones diferentes.

## Cuatro modelos de cronograma

`schedule.model` decide **cuál de los campos de ubicación de un día es autoritativo**. Es un discriminador estructural, no una etiqueta.

| `model` | Autoritativo | Significado |
|---|---|---|
| `calendar` | `dayOfWeek` | Los días caen en días de la semana con nombre |
| `relative` | `offsetDays` | Los días caen a un desplazamiento fijo desde el inicio del programa |
| `rolling` | `offsetDays` | Una cadencia fija — tres días de trabajo, uno de descanso — que deriva contra el calendario por diseño |
| `sequence` | ninguno | Se ejecuta en orden al ritmo del atleta; `index` es el único ordenamiento |

Leer un documento bajo el modelo equivocado no produce un plan ligeramente distinto. Una cadencia rotativa de cinco días leída como calendario reordena el entrenamiento y colapsa el patrón de descanso alrededor del cual se construyó el plan.

## Un día es una sesión de entrenamiento o un día de descanso

Exactamente una de las dos cosas. Ambas es una contradicción; ninguna no dice nada en absoluto, y un consumidor que muestre un calendario tendría que inventar un significado para esa casilla.

El descanso se modela explícitamente en lugar de dejarse como un hueco, porque un día ausente es no planificado y un día de descanso prescrito es parte del programa — que es precisamente de lo que está hecha una semana de descarga. Un día puede además ser `optional`, lo cual califica un día de entrenamiento en lugar de reemplazarlo.

## Las anulaciones se aplican a la ocurrencia, no a la sesión

`overrides` ajusta la sesión referenciada **solo para ese día**. El documento de la sesión de entrenamiento nunca se modifica — eso es lo que lo mantiene compartible.

`loadScaling` se aplica *después* de que el objetivo de carga se resuelve, que es lo que le permite componerse con cualquier método: multiplica una carga absoluta, multiplica el resultado resuelto de un porcentaje y no multiplica nada en un objetivo RPE, porque un RPE no tiene carga hasta que el atleta aporta una.

Cuando una sesión referenciada lleva su propia regla de progresión, **la regla se resuelve primero y las anulaciones se aplican a su resultado.** El orden inverso haría que una misma regla compartida progresara de forma distinta en dos planes que afirman ambos usarla.

## Los máximos de entrenamiento son *slots*, nunca valores

`references.trainingMaxes[]` declara de qué levantamientos se calcula el plan y cómo el invocador deriva cada número. **Nunca transporta el número, y una implementación conforme no debe agregarlo.**

Esto es lo que un implementador tiene más probabilidades de intentar "arreglar", porque el *slot* se lee como un objeto al que le falta un campo, y llenarlo parece hacer los programas autocontenidos sin costo alguno. No es gratis. Una repetición máxima (1RM) es un dato personal sobre una persona identificable; un programa que la transporta adquiere un titular, y con el titular llegan obligaciones de consentimiento, retención, portabilidad y supresión que alcanzan a cada sistema por el que pasa el documento. FDS está construido para que los catálogos, las sesiones y los planes puedan publicarse, almacenarse en caché, replicarse y diferenciarse libremente, y eso solo es defendible mientras ninguno de ellos describa a una persona.

La consecuencia aceptada: **un programa completamente personalizado no puede hacer el *round-trip* como un solo documento autocontenido.** La exportación es el plan más un contexto de resolución separado. Esa contrapartida es deliberada.

Un *slot* se identifica por su `exercise` — un `percent1RM` nombra el levantamiento mediante `referenceExerciseId`, y el *slot* que aplica es el que nombra ese ejercicio. El `id` propio del *slot* es un identificador local para citarlo desde una regla o una anulación.

## La ramificación, y el límite de los planes adaptativos

`branching` enruta entre días de forma condicional — superar una prueba y continuar, fallarla y repetir la semana. La condición es **declarativa** en lugar de una expresión, precisamente para que un consumidor pueda reconocer una que no puede evaluar y rechazarla. Una condición que no se puede evaluar significa seguir el cronograma incondicional y advertir, nunca adivinar.

La programación adaptativa se divide en dos, y solo una mitad es portable. **La adaptación de carga es expresable** — un esqueleto fijo cuyas cargas se resuelven en el momento de la ejecución mediante objetivos `autoregulated` que apuntan a reglas declaradas. **La selección de ejercicios generada por sesión no lo es**, y la especificación lo dice en lugar de dejarlo implícito: un día lleva una referencia a una sesión de entrenamiento, lo que requiere una sesión que exista, y un día indeterminado significaría un programa ilegible sin el generador que lo produjo.

## Autoría

`authorship` es el primer lugar donde FDS registra una reivindicación de derechos, y está aquí y no en un ejercicio por lo que un programa es. Un movimiento no se redacta en ningún sentido significativo; un plan de doce semanas sí. Una `license` ausente significa **no declarada, no dominio público**, y un consumidor debería preservar `authorship` a través de cualquier transformación.

## Ejemplos resueltos

<!-- fds:count examples:program=18 scenarios:program=18 -->
Se publican 18 programas junto al esquema — uno por cada modelo de periodización de la matriz de cobertura y uno por cada estructura de cronograma, indexados en [el README de los archivos de ejemplo](https://spec.vitness.me/schemas/program/v1.0.0/README.md).

Ninguno de ellos contiene una serie, una repetición ni una carga. Esa es la afirmación de arriba, demostrada en lugar de afirmada.

## Especificación

[RFC-008: Modelo de datos de programa de entrenamiento](../specifications/rfc-008-program-data-model). Las sesiones provienen de [RFC-007](../specifications/rfc-007-workout-data-model) y la prescripción de [RFC-006](../specifications/rfc-006-prescription-primitives).
