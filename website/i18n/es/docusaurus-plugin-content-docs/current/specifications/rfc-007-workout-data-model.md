---
title: 'RFC-007: Modelo de datos de sesiones de entrenamiento'
description: Sesiones de entrenamiento prescritas — bloques, modos de ejecución, agrupación y prescripción por serie
sidebar_position: 7
keywords: [workout, session, superset, circuit, emom, amrap, tabata, data model, json schema, rfc]
---

# RFC-007: Especificación del modelo de datos de sesiones de entrenamiento

**Estado**: Borrador
**Versión**: 0.2.0
**Fecha**: 2026-08-10
**Autores**: Equipo VITNESS
**Categoría**: Standards Track

## Resumen

Esta especificación define un modelo estandarizado para una sola sesión de entrenamiento prescrita — una sesión de entrenamiento (*workout*). Cubre cómo se ordenan y agrupan los ejercicios, cómo se prescribe cada uno y cómo se pretende que se ejecute la sesión.

La afirmación central es estructural: **una sesión de entrenamiento son bloques de elementos, y cómo se ejecuta un bloque es una propiedad del bloque, no una clase distinta de documento.** El trabajo de fuerza con series simples, las superseries, los circuitos, EMOM, AMRAP, Tabata y el entrenamiento por intervalos se expresan todos con el mismo esquema, y difieren solo en `blocks[].mode`. Ningún estilo de entrenamiento recibe un esquema propio.

La prescripción en sí — cuánta carga, cuántas repeticiones, qué tempo, cuánto descanso — no se define aquí. Proviene del RFC-006, de modo que una serie en una sesión de entrenamiento independiente y la misma serie dentro de un programa de doce semanas significan exactamente lo mismo.

## 1. Introducción

### 1.1. Antecedentes

Los formatos de intercambio para sesiones de entrenamiento han modelado históricamente una metodología bien y el resto mal. Un formato construido en torno a series y repeticiones no puede expresar un AMRAP; un formato construido en torno a rondas y topes de tiempo no puede expresar una serie tope con series de descenso. Las aplicaciones lo sortean con campos por estilo — `isCircuit`, `emomInterval`, `tabataRounds` — hasta que el modelo es una unión de casos especiales y no hay dos implementaciones que coincidan en cuáles aplican juntos.

La observación sobre la que se construye este RFC es que estos estilos difieren en **cómo se ejecuta un grupo de ejercicios**, no en lo que es un ejercicio o una serie. Un circuito y un conjunto de series simples contienen los mismos elementos con las mismas prescripciones; difieren en el orden de recorrido y en la terminación. Una vez que la ejecución es una propiedad de un bloque, los casos especiales colapsan.

### 1.2. Objetivos

1. Expresar cada estructura de agrupación del §4.2 de la matriz de escenarios, y cada esquema de series y repeticiones del §4.1, sin campos por estilo.
2. Componer las primitivas de prescripción del RFC-006 en lugar de reformularlas.
3. Mantener la sesión prescriptiva: una sesión de entrenamiento describe el trabajo previsto, nunca el trabajo realizado.
4. Seguir siendo compatible hacia adelante — un modo definido después de esta versión NO DEBE invalidar el documento.
5. No contener datos personales.

### 1.3. Alcance

**Dentro del alcance:** la estructura de la sesión, los modos de ejecución de bloques, la agrupación, la prescripción por elemento y por serie, las sustituciones autorizadas, los resúmenes agregados orientativos.

**Fuera del alcance:**

- Las primitivas de prescripción en sí (RFC-006)
- La estructura multisesión: ciclos, semanas, cronogramas, periodización (RFC-008)
- Los datos ejecutados — lo que realmente se hizo, y por quién (RFC-009, diferido)
- La identidad del atleta, el peso corporal, las repeticiones máximas (1RM). Véase RFC-006 §5.

## 2. Terminología

Las palabras clave MUST, MUST NOT, SHOULD, SHOULD NOT y MAY deben interpretarse como se describe en RFC 2119.

- **Sesión de entrenamiento** — una sesión prescrita.
- **Bloque** — una sección contigua de una sesión ejecutada bajo un solo modo.
- **Elemento** — un ejercicio dentro de un bloque, con su prescripción.
- **Modo** — cómo se ejecuta un bloque: el orden de recorrido de sus elementos y qué termina el bloque.
- **Grupo** — elementos dentro de un bloque realizados juntos, identificados por un `groupLabel` compartido.

## 3. Requisitos estructurales centrales

### 3.1. Campos obligatorios

`schemaVersion`, `workoutId`, `canonical`, `classification`, `structure` y `metadata`. La envoltura — `canonical`, `metadata`, `attributes`, `extensions`, `additionalProperties` cerrado en el nivel superior — se hereda sin cambios del RFC-001.

`structure.blocks` DEBE contener al menos un bloque, y cada bloque DEBE contener al menos un elemento. Una sesión vacía no es una sesión de entrenamiento; es un error que valida.

### 3.2. Bloques y modos

Un bloque transporta `mode`, y `mode` decide tres cosas que un consumidor no puede inferir de otro modo:

1. **Recorrido** — si todas las series del elemento uno preceden al elemento dos (`sequential`), o si se toma una serie de cada uno por pasada (`circuit`, `superset`).
2. **Terminación** — si el bloque termina cuando el trabajo prescrito está hecho (`sequential`, `forTime`) o cuando expira un reloj (`amrap`, `emom`, `tabata`).
3. **Qué `modeParams` son significativos.**

`mode` es por lo tanto un **discriminador estructural**, no un clasificador, y sigue el RFC-006 §3.2: un conjunto cerrado de valores conocidos más una rama comodín mantenida disjunta con `not`/`enum`. Un modo que un consumidor no reconoce NO DEBE ejecutarse adivinando — véase §3.5.

En cambio, `classification.workoutType` y `blocks[].role` no transportan consecuencia estructural alguna, así que según D8 siguen siendo cadenas abiertas con registros recomendados, y un valor no reconocido puede ignorarse sin riesgo.

#### Modo y `modeParams`

| `mode` | `modeParams` significativos | Termina cuando |
|---|---|---|
| `sequential` | — | Todos los elementos se completan |
| `superset` | `rounds` | Todas las series de todos los grupos se completan |
| `circuit` | `rounds`, `rest` | Se completan las `rounds` |
| `emom` | `rounds`, `interval` | Transcurren `rounds` intervalos |
| `amrap` | `timeCap` | Expira el `timeCap` |
| `forTime` | `rounds`, `timeCap` | El trabajo se completa, o expira el `timeCap` |
| `tabata` | `rounds`, `work`, `rest` | Se completan las `rounds` |
| `interval` | `rounds`, `work`, `rest` | Se completan las `rounds` |

`modeParams` es un objeto abierto. Restringirlo por modo se consideró y se rechazó: un consumidor que no reconoce el modo tampoco puede usar sus parámetros, de modo que el modo ya es la puerta de control. Tipar los parámetros agregaría una segunda puerta que solo se dispara cuando la primera ya detuvo la ejecución.

Un productor DEBERÍA aportar los parámetros que su modo necesita. Un bloque con `mode: "amrap"` y sin `timeCap` está subespecificado, y los consumidores DEBERÍAN advertir.

### 3.3. Agrupación

Los elementos que comparten un `groupLabel` dentro de un bloque se realizan juntos, alternándose: `A1`, `A2` es una superserie; `A1`, `A2`, `A3`, una triserie. La letra ordena los grupos dentro del bloque; el dígito ordena los miembros dentro del grupo. Esta convención es de uso extendido en la práctica del entrenamiento, y este RFC la hace normativa para que pueda analizarse en lugar de solo leerse.

Un bloque cuyo `mode` es `superset` y cuyos elementos no llevan `groupLabel` es ambiguo; los consumidores DEBERÍAN advertir y PUEDEN tratar el bloque entero como un solo grupo.

**La superserie, la serie compuesta y el emparejamiento de antagonistas no se distinguen estructuralmente**, y de manera deliberada. Los tres son dos elementos alternados con el descanso diferido al final del grupo; difieren solo en si los ejercicios comparten un grupo muscular o se oponen. Eso es derivable de los `targets` de los ejercicios referenciados, de modo que codificarlo de nuevo en la sesión crearía una segunda fuente de verdad que puede discrepar de la primera. Los productores que quieran registrar la intención DEBERÍAN usar `blocks[].role` o una etiqueta.

### 3.4. Series: explícitas o esquema, nunca ambos

Un elemento declara sus series de una de dos maneras:

- `sets[]` — un arreglo explícito de `setPrescription`, cada una con su propia carga, repeticiones, tempo y descanso.
- `scheme` — un `setScheme` del RFC-006, que nombra un patrón y sus parámetros.

Son mutuamente excluyentes, lo que se hace cumplir con `not: { required: ["sets", "scheme"] }`. Un elemento que transporta ambos declara el mismo trabajo dos veces sin nada que diga cuál gana, y un consumidor que elige mal cambia el entrenamiento.

Los productores DEBERÍAN preferir `sets[]` cuando las series difieren entre sí y `scheme` cuando el patrón es la intención. Un consumidor que no reconoce el patrón de un esquema NO DEBE intentar expandirlo (RFC-006 §4.6).

`load`, `reps`, `tempo` y `rest` a nivel de elemento aplican a cada serie del elemento. Un valor a nivel de serie sobrescribe el del nivel de elemento solo para esa serie.

### 3.5. Los modos desconocidos no se ejecutan

Un consumidor que encuentra un `mode` que no entiende NO DEBE ejecutar el bloque recurriendo a `sequential` ni a ningún otro valor predeterminado. DEBERÍA mostrar los elementos y las prescripciones del bloque, e indicar que la estructura de ejecución no se entiende.

Esto refleja el RFC-006 §3.3 y por la misma razón. Ejecutar en silencio una estructura de intervalos no reconocida como series simples no produce una sesión ligeramente distinta; produce un estímulo fisiológico distinto, y en un bloque de acondicionamiento puede producir uno para el que el atleta no está preparado.

## 4. Estructuras de referencia

### 4.1. `classification`

`workoutType` es obligatorio; `level`, `focus[]`, `estimatedDuration`, `environment[]` y `tags[]` son opcionales.

`estimatedDuration` es un objeto que transporta `value` y `unit` en lugar de un número a secas. Un número a secas es leído como minutos por algunas implementaciones y como segundos por otras, y nada en el documento revela cuál se quiso decir.

### 4.2. `block`

`id`, `mode` e `items` son obligatorios. `mode` es un `blockMode`; `role` es un clasificador simple cuyos valores recomendados — `warmup`, `primary`, `accessory`, `conditioning`, `cooldown`, `finisher` — se transportan en el esquema como `examples` en lugar de restringirse. Un bloque PUEDE además transportar un `name` para mostrar y `notes` de texto libre.

`rest` es un `restSpec` del RFC-006 y aplica en el límite que su propio `appliesTo` nombra. Las duraciones dentro de `modeParams` — `timeCap`, `work`, `rest`, `interval` — son cada una un `duration`: un `value` con su propia `unit`, por la misma razón que `estimatedDuration`.

### 4.3. `blockItem`

`id` y `exercise` son obligatorios; todo lo demás es prescripción.

`alternatives[]` lista las sustituciones **que el autor autoriza por adelantado** — equipamiento no disponible, movimiento contraindicado, una regresión para un atleta menos experimentado. Es parte de la prescripción y viaja con la sesión de entrenamiento.

Esto es distinto de una sustitución que un atleta hace durante una sesión, que es dato ejecutado y pertenece al RFC-009. La distinción importa porque los dos responden preguntas distintas: `alternatives[]` dice qué considera equivalente el autor; una sustitución registrada dice qué ocurrió. Colapsarlas haría irrecuperable la intención de un programa a partir de su historial de ejecución.

### 4.4. `setPrescription`

`index` es obligatorio y comienza en 1. Es explícito en lugar de estar implícito en la posición del arreglo para que una serie pueda referenciarse de forma estable — el RFC-009 apuntará a series prescritas desde series ejecutadas, y las posiciones de un arreglo se desplazan cuando un documento se edita.

`type` distingue las series `warmup`, `working`, `backoff`, `drop`, `cluster` y `amrap`. Los consumidores que calculan el volumen de entrenamiento DEBERÍAN excluir las series `warmup`; tratarlas como series efectivas infla el volumen de una manera que se acumula a lo largo de un programa.

`schemeParams` transporta parámetros para el esquema en el que participa una serie — porcentajes de descenso, descanso de clúster. Es abierto por la misma razón que `setScheme.params`: cada patrón toma una forma distinta.

`side` solo es significativo cuando el `classification.unilateral` del ejercicio referenciado es true. Una serie PUEDE transportar `notes` de texto libre.

Desde la versión de esquema 1.1.0 una serie también transporta `zone`. La carga, las repeticiones, el tempo y el descanso siempre pudieron declararse por serie y la intensidad no, de modo que una sesión cuya intensidad sube serie a serie tenía que dividirse en un elemento por escalón para decirlo. Eso era una asimetría y no una decisión, y queda corregido.

### 4.5. `repStyle`

Dos prescripciones de amplio uso no son expresables por nada más en el modelo: las **parciales** (un rango de movimiento deliberadamente reducido) y las **repeticiones de una y media** (una repetición completa seguida de una media, contadas como una). `tempo` gobierna a qué velocidad se realiza una repetición, no su rango ni su composición, y ninguna métrica ni esquema de series los alcanza tampoco.

```json fds:fragment entity=workout
{ "repStyle": { "rangeOfMotion": "partial", "segment": "top" } }
```

| Campo | Valores | Significado |
|---|---|---|
| `rangeOfMotion` | `full` \| `partial` \| `extended` | `extended` es un rango deliberadamente aumentado, como en un peso muerto en déficit |
| `segment` | `top` \| `bottom` \| `mid` | Qué parte del movimiento cubre una parcial. Significativo solo cuando `rangeOfMotion` es `partial` |
| `pattern` | `standard` \| `oneAndAHalf` \| `pulse` | `pulse` son repeticiones cortas repetidas en un punto del rango |

`repStyle` se sitúa en un elemento o en una sola serie, de modo que una prescripción puede pedir repeticiones completas seguidas de parciales al fallo sin dividir el elemento en dos.

Se define aquí y no en la biblioteca del RFC-006 porque una sesión de entrenamiento es actualmente su único consumidor. Una definición se vuelve compartida cuando un segundo consumidor la necesita; si el RFC-008 lo hace, se promueve a una nueva versión de prescription en ese momento. Promoverla ahora significaría publicar una nueva versión de una URL congelada para servir a un usuario que aún no existe.

### 4.6. `settings`

Algunas prescripciones no son ni carga, ni repeticiones, ni tempo, ni descanso. Una caminadora con cinco por ciento de pendiente, una bicicleta mantenida a noventa revoluciones por minuto — el atleta tiene que ajustarlas antes de empezar, y nada más en el modelo las alcanza.

Agregado en la versión de esquema 1.1.0, `settings` es un arreglo de formas de métrica con un valor adjunto:

```json fds:fragment entity=workout
{ "settings": [ { "type": "incline", "unit": "percent", "value": 5 } ] }
```

| Campo | Significado |
|---|---|
| `type` | Un tipo de métrica del vocabulario compartido del RFC-001 — `incline`, `cadence`, `resistanceLevel`, etc. |
| `unit` | Su unidad, del mismo vocabulario |
| `value` | El número que hay que fijar |
| `range` | Una banda en lugar de un punto, como `min` y `max` — "cadencia de 85 a 95" |
| `notes` | Texto libre para este ajuste |

Se sitúa en un elemento o en una sola serie, de modo que una pendiente que sube cada cinco minutos son tres series en lugar de tres elementos.

Esto deliberadamente **no** es una definición nueva por ajuste. La carga, las repeticiones, el tempo y el descanso se ganaron cada uno la suya porque cada uno transporta una semántica sobre la que un consumidor debe actuar — una carga tiene un método de resolución, un descanso tiene un ámbito. Una pendiente no transporta ninguna: es un número en una unidad que el atleta fija, y el vocabulario de métricas ya la nombra. Dar a cada ajuste su propia definición habría significado una nueva cada vez que una máquina ganara un dial.

**La resistencia es una carga, no un ajuste.** El nivel de resistencia de una máquina cambia cuán duro es el trabajo y se prescribe con `loadTarget.method: "level"`, que transporta una `scale` para que "nivel 8" no se lea contra la numeración de otra máquina. La pendiente y la cadencia cambian qué *es* el movimiento, no cuán pesado es. Los productores DEBERÍAN mantener esa división; los consumidores que lean un ajuste `resistanceLevel` DEBERÍAN aceptarlo y advertir.

Un consumidor que no puede aplicar un ajuste — sin control de pendiente en el equipamiento a mano — DEBERÍA mostrárselo al atleta en lugar de descartarlo en silencio. A diferencia de un método de carga no reconocido, no hay argumento de seguridad para negarse: el número está declarado en una unidad con nombre y significa lo mismo para una persona que para una máquina.

### 4.7. Resúmenes agregados derivados

`targets` y `equipment` resumen lo que la sesión entrena y necesita. Ambos son **opcionales y orientativos**.

Un consumidor NO DEBE tratar a ninguno de los dos como autoritativo por encima de recorrer los elementos. Son datos derivados que pueden estar ausentes, desactualizados o calculados bajo supuestos que el consumidor no comparte — un resumen agregado producido antes de que un elemento fuera sustituido ya no describe la sesión. Existen para los listados y el filtrado, donde recalcular a lo largo de una biblioteca es costoso y las respuestas aproximadas son aceptables.

### 4.8. Campos descriptivos opcionales

`constraints` registra lo que la sesión exige del atleta antes de empezar: `contraindications` (condiciones bajo las cuales no debería realizarse), `prerequisites` (competencias que asume) y `environment` (dónde puede hacerse). Son prosa orientativa, no puertas de control aplicables por máquina — FDS no modela ningún atleta contra el cual comprobarlas.

`relations` enlaza una sesión de entrenamiento con otras por `type` y `targetId`, con `notes` opcionales. Los tipos recomendados son `alternate`, `variation`, `progression`, `regression`, `deload` y `test`. Así es como una variante de descarga se ata a la sesión que descarga, y como el RFC-008 puede referenciar una alternativa más ligera sin duplicar el documento completo.

`media` sigue la definición compartida del RFC-001 — un video de demostración o un diagrama de la estructura de la sesión.

Tanto los elementos como los bloques aceptan `notes`, y los bloques un `name`. `equipment.required` y `equipment.optional` dividen el resumen agregado entre aquello sin lo cual la sesión no puede proceder y lo que simplemente ayuda.

## 5. Composición con RFC-006

| Dónde | Definición del RFC-006 |
|---|---|
| `blocks[].rest`, `items[].rest`, `sets[].rest` | `restSpec` |
| `items[].load`, `sets[].load` | `loadTarget` |
| `items[].reps`, `sets[].reps` | `repTarget` |
| `items[].tempo`, `sets[].tempo` | `tempo` |
| `items[].scheme` | `setScheme` |
| `items[].zone` | `intensityZone` |

Ninguna de estas se redefine aquí. El esquema de workout publicado transporta copias aplanadas, de modo que un implementador que valida una sesión de entrenamiento nunca descarga la biblioteca de prescripción — pero las definiciones se generan a partir de ella, así que las dos no pueden desviarse.

### 5.1. Concordancia de métricas con el ejercicio referenciado

Según el ancla de compatibilidad: una prescripción de serie DEBERÍA usar solo tipos de métrica que el ejercicio referenciado declara en sus `metrics.primary` o `metrics.secondary`. Prescribir distancia en un ejercicio medido en repeticiones es un error del productor.

Los productores PUEDEN exceder las métricas declaradas. Los consumidores NO DEBEN hacer fallar la validación por el exceso, pero DEBERÍAN advertir. La regla es una advertencia y no una restricción porque el catálogo de ejercicios y la sesión de entrenamiento pueden provenir de fuentes distintas en versiones distintas, y un catálogo desactualizado no debería volver ilegible una sesión válida.

### 5.2. Contexto de resolución

Una sesión de entrenamiento hereda cada requisito de resolución de los objetivos de carga que contiene. Determinar qué necesita una sesión antes de presentarla significa recorrer cada `loadTarget` y cada `intensityZone` del documento — véase RFC-006 §5.2. Una sesión de entrenamiento no declara sus requisitos en un solo lugar, porque los requisitos son una propiedad de su contenido.

## 6. Versionado y compatibilidad

Esta entidad sigue las reglas de versionado del RFC-001 §5. Su URL publicada es un contrato congelado; las adiciones se publican en una nueva URL de versión.

Agregar un `mode` es un cambio MINOR: los documentos válidos bajo la versión anterior siguen siendo válidos, porque el nuevo modo antes validaba a través de la rama comodín.

<!-- fds:pin workout/v1.0.0/workout.schema.json — this document names the superseded version deliberately, in §6 and again in §9, because releases 1.2.0 and 1.3.0 declare workout at 1.0.0 and a client pinned to either must keep resolving it. New work uses 1.1.0. -->

**1.1.0** agregó `settings` en elementos y series, y `zone` en una serie. Ambas son adiciones opcionales a objetos cerrados, de modo que todo documento 1.0.0 sigue siendo válido sin cambios — pero un documento 1.1.0 que use cualquiera de las dos es rechazado por el esquema 1.0.0, que es lo que hace de esto una versión y no una edición. `workout/v1.0.0/workout.schema.json` permanece publicado y congelado; los lanzamientos 1.2.0 y 1.3.0 declaran workout en 1.0.0 y siguen resolviendo. El lanzamiento 1.4.0 es el primero que lo declara en 1.1.0.

Las entidades versionan de forma independiente. Una nueva versión de workout no obliga a moverse a exercise, a equipment ni a la biblioteca de prescripción, y ninguna de sus versiones obliga a esta.

## 7. Guía de implementación

### 7.1. Productores

Usar el modo que coincide con la intención en lugar del más fácil de renderizar. Un bloque de acondicionamiento escrito como `sequential` con el descanso incrustado en las prescripciones no es un circuito, y un consumidor no puede recuperar la intención después.

Emitir `groupLabel` siempre que los elementos se alternen, incluso para una superserie simple de dos ejercicios. Cuesta un campo y es la única señal de que los elementos no están pensados para realizarse uno tras otro.

### 7.2. Consumidores

Recorrer `structure.blocks` en orden; dentro de un bloque, respetar `mode`. No asumir `sequential` cuando `mode` está ausente — es obligatorio, así que un documento sin él es inválido y debería informarse en lugar de repararse.

Recalcular `targets` y `equipment` a partir de los elementos cuando la corrección importe.

## 8. Consideraciones de seguridad y privacidad

Una sesión de entrenamiento es dato de referencia y no contiene datos personales por construcción. No transporta ningún atleta, ningún peso corporal, ningún máximo de entrenamiento y ningún valor ejecutado — cada prescripción relativa referencia su contexto en lugar de incrustarlo (RFC-006 §5).

Una implementación que resuelve una sesión de entrenamiento contra un atleta específico y almacena el resultado — escribiendo kilogramos reales en lugar de un porcentaje — ha producido datos personales y hereda las obligaciones que los acompañan. Ese artefacto resuelto no es un Workout en el sentido de este RFC.

## 9. Referencia del JSON Schema

`https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json`

La versión sustituida sigue sirviéndose, y un cliente fijado a un lanzamiento que declara workout en 1.0.0 sigue descargándola:

`https://spec.vitness.me/schemas/workout/v1.0.0/workout.schema.json`

Ningún segmento de la ruta es el número de lanzamiento. Los lanzamientos 1.2.0 y 1.3.0 declaran workout en 1.0.0 y el lanzamiento 1.4.0 lo declara en 1.1.0, de modo que la versión a descargar es la versión de entidad que el lanzamiento nombra — véanse §6 y `specification/discovery.md`.

### 9.1. Validación

```bash
npm run verify schemas
```

## 10. Ejemplo

Una sesión de tren superior: un bloque de calentamiento, un bloque principal con una serie tope y series de descenso, una superserie de accesorios y un finisher de acondicionamiento.

```json
{
  "schemaVersion": "1.1.0",
  "workoutId": "00000000-0000-4000-8000-00000000a001",
  "canonical": { "name": "Upper A", "slug": "upper-a" },
  "classification": {
    "workoutType": "strength",
    "level": "intermediate",
    "estimatedDuration": { "value": 60, "unit": "min" }
  },
  "structure": {
    "blocks": [
      {
        "id": "b1",
        "role": "primary",
        "mode": "sequential",
        "items": [
          {
            "id": "i1",
            "exercise": { "id": "ex.benchPress", "name": "Barbell Bench Press" },
            "scheme": {
              "pattern": "topSetBackoff",
              "sets": 4,
              "params": { "backoffPercent": 10, "backoffSets": 3 }
            },
            "load": { "method": "rpe", "value": 8, "allowHalf": true },
            "reps": { "kind": "range", "min": 3, "max": 5 },
            "rest": { "method": "fixed", "appliesTo": "set", "value": 3, "unit": "min" }
          }
        ]
      },
      {
        "id": "b2",
        "role": "accessory",
        "mode": "superset",
        "modeParams": { "rounds": 3 },
        "rest": { "method": "fixed", "appliesTo": "group", "value": 90, "unit": "s" },
        "items": [
          {
            "id": "i2",
            "groupLabel": "A1",
            "exercise": { "id": "ex.dumbbellRow", "name": "Dumbbell Row" },
            "reps": { "kind": "range", "min": 8, "max": 12 },
            "load": { "method": "rir", "value": 2 }
          },
          {
            "id": "i3",
            "groupLabel": "A2",
            "exercise": { "id": "ex.inclineDbPress", "name": "Incline Dumbbell Press" },
            "reps": { "kind": "range", "min": 8, "max": 12 },
            "load": { "method": "rir", "value": 2 }
          }
        ]
      },
      {
        "id": "b3",
        "role": "finisher",
        "mode": "amrap",
        "modeParams": { "timeCap": { "value": 8, "unit": "min" } },
        "items": [
          {
            "id": "i4",
            "exercise": { "id": "ex.airBike", "name": "Air Bike" },
            "reps": { "kind": "calories", "value": 15 },
            "zone": { "system": "heartRate", "zone": "Z4", "boundsRef": "zone.fiveZoneHeartRate" }
          }
        ]
      }
    ]
  },
  "metadata": {
    "createdAt": "2026-08-09T00:00:00Z",
    "updatedAt": "2026-08-09T00:00:00Z",
    "status": "active",
    "source": "vitness.core"
  }
}
```

Junto al esquema se publican ejemplos resueltos para cada esquema de series del §4.1 y cada estructura de agrupación del §4.2 de la matriz de escenarios.

## Conformidad

Una implementación conforma con esta especificación si:

1. Respeta `blocks[].mode` para el recorrido y la terminación, y no ejecuta un modo que no reconoce.
2. Trata como alternados los elementos que comparten un `groupLabel`.
3. Rechaza un elemento que transporta tanto `sets` como `scheme`.
4. Aplica la prescripción a nivel de serie por encima de la prescripción a nivel de elemento donde ambas están presentes.
5. Recalcula `targets` y `equipment` en lugar de confiar en ellos cuando la corrección importa.
6. Excluye las series `warmup` de los cálculos de volumen de entrenamiento.
7. Advierte, en lugar de fallar, cuando una serie usa un tipo de métrica que el ejercicio referenciado no declara.

## 11. Referencias

### 11.1. Referencias normativas

- RFC 2119 — Key words for use in RFCs
- RFC-001 — Modelo de datos de ejercicios
- RFC-006 — Primitivas de prescripción
- JSON Schema Draft 2020-12

### 11.2. Referencias informativas

- RFC-002 — Modelo de datos de equipamiento
- RFC-008 — Modelo de datos de programas de entrenamiento
- `specification/metrics-guide.md`
