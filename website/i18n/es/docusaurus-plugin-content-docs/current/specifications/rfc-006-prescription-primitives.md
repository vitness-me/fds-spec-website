---
title: 'RFC-006: Primitivas de prescripción'
description: Biblioteca de definiciones para objetivos de carga, objetivos de repeticiones, tempo, descanso, zonas de intensidad, esquemas de series y reglas de progresión
sidebar_position: 6
keywords: [prescription, load target, rpe, percent 1rm, tempo, rest, progression, data model, json schema, rfc]
---

# RFC-006: Especificación de las primitivas de prescripción

**Estado**: Borrador
**Versión**: 0.1.0
**Fecha**: 2026-08-07
**Autores**: Equipo VITNESS
**Categoría**: Standards Track

## Resumen

Esta especificación define las estructuras primitivas usadas para prescribir el entrenamiento: cuánta carga, cuántas repeticiones, a qué tempo, con cuánto descanso, en qué zona de intensidad, dispuestas en qué patrón de series y progresadas por qué regla.

A diferencia de los RFC-001 a RFC-005, este RFC **no** define una entidad. Nada es jamás "un documento de prescripción". Publica una biblioteca de definiciones que RFC-007 Workout y RFC-008 Program componen. Factorizar estas estructuras es lo que impide que la semántica de la prescripción de carga se desvíe entre una sesión individual y un programa de varias semanas — los dos lugares donde, de otro modo, el mismo concepto se modelaría dos veces.

## 1. Introducción

### 1.1. Antecedentes

El RFC-001 define un ejercicio como una entrada de catálogo. Su bloque `metrics` declara *formas sin valores* — "este movimiento se mide en repeticiones y peso" — nunca "ocho repeticiones con cien kilogramos". Eso es deliberado, y es la costura sobre la que este RFC construye: la prescripción adjunta valores a las formas que un ejercicio declara.

La dificultad es que "cuánta carga" no tiene una representación única. Un programa de powerlifting dice 82.5% de un máximo de entrenamiento. Un bloque de hipertrofia dice RPE 8. Un circuito de máquinas dice nivel 7. Una progresión de calistenia dice peso corporal con 20 kg de asistencia. Una sesión basada en velocidad dice detenerse cuando la velocidad de la barra cae un 20%. No son variaciones de un número; son *clases* distintas de instrucción, resolubles solo contra contextos distintos.

Modelarlas como un único campo `weight` anulable pierde la distinción. Modelarlas por separado en Workout y de nuevo en Program garantiza que las dos se desvíen.

### 1.2. Objetivos

1. Representar sin pérdida cada método de prescripción de carga del §4.3 de la matriz de escenarios.
2. Mantener la representación validable — una unión discriminada que un validador de JSON Schema pueda comprobar de verdad.
3. Seguir siendo compatible hacia adelante: un documento que use un método definido después de esta versión NO DEBE ser rechazado en bloque.
4. Hacer explícitos los requisitos de resolución, de modo que un consumidor sepa qué debe aportar antes de que una prescripción relativa se convierta en una absoluta.
5. Definir estas estructuras una sola vez, para uso tanto del RFC-007 como del RFC-008.

### 1.3. Alcance

**Dentro del alcance:**

- Objetivos de carga, objetivos de repeticiones, tempo, especificaciones de descanso, zonas de intensidad, esquemas de series y reglas de progresión
- Las reglas de discriminación y de compatibilidad hacia adelante que los gobiernan
- El contexto que un consumidor debe aportar para resolver una prescripción relativa

**Fuera del alcance:**

- La estructura de la sesión de entrenamiento — bloques, agrupación, superseries, circuitos (RFC-007)
- La estructura del programa — ciclos, semanas, cronogramas (RFC-008)
- Los datos ejecutados — lo que un atleta hizo realmente (RFC-009, diferido)
- La identidad del atleta, el peso corporal, los máximos de entrenamiento o los límites de frecuencia cardíaca. FDS no modela a ninguna persona; véase §5.

## 2. Terminología

Las palabras clave MUST, MUST NOT, SHOULD, SHOULD NOT y MAY deben interpretarse como se describe en RFC 2119.

- **Prescripción** — una instrucción sobre cómo realizar el trabajo, independiente de cualquier atleta.
- **Objetivo de carga** — la instrucción que determina cuánta resistencia usa una serie.
- **Objetivo de repeticiones** — la instrucción que determina qué termina una serie.
- **Contexto de resolución** — los valores que un consumidor debe aportar para convertir una prescripción relativa en una absoluta.
- **Biblioteca de definiciones** — un esquema publicado cuyo propósito es ser referenciado, no instanciado.

## 3. Requisitos estructurales centrales

### 3.1. Esto es una biblioteca, no una entidad

El esquema publicado no transporta `schemaVersion`, ni identificador, ni bloque `metadata`, porque no describe ningún documento. Su raíz es deliberadamente insatisfacible:

```json fds:ignore a JSON Schema excerpt, not a document
{ "not": {} }
```

Validar cualquier documento contra la raíz de la biblioteca falla por construcción. Esto es una salvaguarda, no una molestia: una biblioteca cuya raíz aceptara todo aprobaría en silencio cualquier documento que se le entregara, y un consumidor lo tomaría como confirmación. En su lugar, referenciar una definición:

```json fds:ignore a JSON Schema excerpt, not a document
{ "$ref": "https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json#/$defs/loadTarget" }
```

Dado que los esquemas FDS publicados son autocontenidos (véase la guía de autoría), RFC-007 y RFC-008 transportarán copias aplanadas de las definiciones que usan. Los implementadores que validan un Workout nunca necesitan descargar este archivo.

### 3.2. La discriminación, y por qué la rama comodín tiene la forma que tiene

`loadTarget`, `repTarget` y `restSpec` son uniones discriminadas: un campo `method` o `kind` selecciona qué carga útil aplica. Según D8, los discriminadores estructurales no pueden ser cadenas abiertas — un discriminador abierto no puede validar, porque no se selecciona ninguna rama y, o bien todas coinciden, o ninguna lo hace.

Cada unión, por lo tanto, enumera sus miembros conocidos con cargas útiles tipadas, y agrega una rama final para los valores que esta versión no define. Esa rama DEBE excluir los valores conocidos:

```json fds:ignore a JSON Schema excerpt, not a document
{
  "type": "object",
  "required": ["method"],
  "properties": {
    "method": { "type": "string", "not": { "enum": ["absolute", "percent1RM", "…"] } }
  }
}
```

El `not`/`enum` cumple una función estructural. Sin él, `{ "method": "absolute", "value": 100, "unit": "kg" }` coincidiría tanto con la rama `absolute` como con la comodín, dos ramas coincidirían y `oneOf` fallaría — de modo que un documento correcto sería rechazado. Peor aún, un método conocido *malformado* caería en la rama permisiva y validaría, que es la falla de aprobación silenciosa que este estándar existe para evitar.

Las implementaciones que extiendan estas uniones DEBEN mantener ese carácter disjunto.

### 3.3. Los métodos desconocidos se ignoran, nunca se adivinan

Un consumidor que encuentra un `method` que no entiende DEBE ignorar ese objetivo de carga y DEBERÍA advertir. NO DEBE sustituirlo por un valor predeterminado, recurrir a la carga de una serie anterior ni inferir un valor a partir del contexto circundante.

Esto es más fuerte que la regla de advertir-y-continuar que gobierna los clasificadores en el resto de FDS, y lo es deliberadamente. Un `exerciseType` no reconocido produce un ejercicio mal etiquetado. Una carga adivinada produce una barra que alguien intenta levantar. Inventar en silencio un peso de trabajo es un problema de seguridad física, no de calidad de datos.

## 4. Estructuras de referencia

### 4.1. `loadTarget`

Trece métodos definidos más la rama de compatibilidad hacia adelante. Todos los métodos excepto `bodyweight`, `autoregulated` y `none` aceptan un `range` opcional — un `loadRange` de `min` y `max` — para prescripciones dadas como una banda en lugar de un punto. Un `loadRange` no transporta unidad propia: toma las unidades del método que lo contiene, de modo que una banda sobre `absolute` es kilogramos y una banda sobre `rpe` es puntos de RPE.

| `method` | Carga útil | ¿Resoluble solo con el documento? |
|---|---|---|
| `absolute` | `value`, `unit` (`kg`\|`lb`) | Sí |
| `percent1RM` | `value`, `referenceExerciseId` opcional | No — necesita una 1RM |
| `percentBodyweight` | `value` | No — necesita un peso corporal |
| `rpe` | `value` 1–10, `allowHalf` opcional | Sí (el atleta lo resuelve) |
| `rir` | `value` 0–10 | Sí (el atleta lo resuelve) |
| `velocity` | `value`, `unit` (`m_s`), `lossThreshold` opcional | Sí, con instrumentación |
| `level` | `value`, `scale` opcional | Sí, solo en esa máquina |
| `bandResistance` | `equipment`, `colour`, `estimatedLoad` opcionales | Parcialmente |
| `assisted` | `value`, `unit` | Sí |
| `relative` | `basis`, `delta`, `deltaUnit` | No — necesita historial |
| `bodyweight` | — | Sí |
| `autoregulated` | `progressionRuleRef` | No — necesita el estado de la regla |
| `none` | — | Sí |

Tres de estos transportan una semántica que un consumidor puede malinterpretar de un modo que la validación no puede detectar:

**`percent1RM` con `referenceExerciseId`** expresa "70% de tu repetición máxima (1RM) de sentadilla trasera" en un ejercicio que no es la sentadilla trasera — el caso común en el trabajo accesorio y en los programas dirigidos por porcentajes donde cada levantamiento se escala a partir de unos pocos levantamientos de referencia. Ausente, la referencia es el propio ejercicio prescrito.

**`assisted`** transporta la magnitud de la asistencia como un número positivo. Más asistencia es *menos* esfuerzo. Un consumidor que grafique la carga a lo largo del tiempo DEBE invertir el sentido para los objetivos asistidos, o mostrará a un atleta retrocediendo a medida que se hace más fuerte. Este método solo es significativo en un ejercicio cuyo `loading.assisted` es true (RFC-001 §4.6).

**`level`** es opaco. Reproduce un ajuste en una máquina y no significa nada en ninguna otra parte. NO DEBE convertirse a carga ni compararse entre máquinas o instalaciones.

### 4.2. `repTarget`

Lo que termina una serie: `fixed`, `range`, `amrap`, `toFailure`, `time`, `distance`, `calories`, `maxHold`, más la rama de compatibilidad hacia adelante.

`toFailure` transporta `technical`, que distingue "detenerse cuando la técnica se degrada" de "detenerse cuando la repetición no puede completarse" — una diferencia que todo entrenador de fuerza hace y que ningún formato de intercambio anterior registra.

`amrap` acepta tanto un piso `min` como un `cap`. El piso es lo que el programa espera; el tope evita una serie que de otro modo se extendería durante varios minutos.

### 4.3. `tempo`

Tiempos por fase en segundos, en el orden convencional: `eccentric`, `bottomPause`, `concentric`, `topPause`. Una fase PUEDE ser la cadena `"X"`, que significa explosiva — tan rápido como sea posible en lugar de una duración específica.

Cada fase es un `tempoPhase`: un número no negativo de segundos, o `"X"`. Esto antes solo era expresable como la extensión `x:vitness.tempo` del RFC-001. Aquí se promueve a primitiva central porque el tempo es un asunto de prescripción, no de catálogo: el mismo ejercicio se prescribe a tempos distintos en bloques distintos.

Nótese la distinción con el tipo de métrica `tempo` del RFC-001, que registra la convención de conteos (3‑1‑1) como un valor anotado. Los tiempos por fase por debajo del segundo son `duration` en `ms`.

### 4.4. `restSpec`

`method` es uno de `fixed`, `range`, `toHeartRate`, `asNeeded`, `ratio`.

`appliesTo` es OBLIGATORIO, y es el campo que con mayor probabilidad omitirá un implementador que porta desde un formato más simple. El descanso se ata a uno de cuatro límites — `set`, `group`, `round`, `block` — y el mismo bloque transporta rutinariamente varios: treinta segundos entre los miembros de una superserie, tres minutos entre rondas. Una duración a secas es ambigua, y la ambigüedad no es recuperable por inspección.

`ratio` expresa la proporción trabajo-descanso como `work` y `rest`, dos números que se resuelven contra la duración del intervalo de trabajo, de modo que una proporción 1:2 después de un esfuerzo de 40 segundos significa 80 segundos.

`toHeartRate` toma su umbral en `bpm`, la única unidad que acepta.

`appliesTo` es un `restScope`, uno de `set`, `group`, `round` o `block`.

### 4.5. `intensityZone`

`{ system, zone, boundsRef? }` donde `system` es `heartRate`, `power`, `pace` o `perceived`.

`zone` es una etiqueta, no un valor. "Z4" no significa nada sin los límites que la definen, y esos límites son personales. `boundsRef` identifica la entrada del registro de zonas a la que pertenece la etiqueta; sin él, una etiqueta de zona solo es significativa dentro del productor que la escribió.

### 4.6. `setScheme`

Un patrón con nombre y sus parámetros, para prescripciones que describen una forma en lugar de enumerar cada serie: `straight`, `ramping`, `reversePyramid`, `drop`, `restPause`, `cluster`, `myoReps`, `wave`, `ladder`, `density`, `topSetBackoff`.

A diferencia de las uniones de carga y repeticiones, `pattern` es un enum **cerrado** sin comodín. Expandir un patrón en series concretas requiere conocer su semántica, así que un consumidor no puede hacer nada útil con un patrón del que nunca ha oído hablar — aceptar uno solo aplazaría la falla hasta el punto donde importa. Los productores que usen un patrón no listado aquí DEBEN expandirlo en series explícitas.

`params` es deliberadamente abierto: cada patrón toma una forma distinta, y restringir aquí los once congelaría el vocabulario de parámetros de once metodologías distintas en una versión 1.0.0. Las claves convencionales son estas:

| Patrón | `params` convencionales | Significado |
|---|---|---|
| `straight` | — | Todas las series idénticas; `sets` por sí solo es suficiente |
| `ramping` | `startPercent`, `endPercent` | Carga ascendente a lo largo de las series prescritas, terminando en la serie tope |
| `reversePyramid` | `dropPercent` | La serie más pesada primero; cada serie siguiente baja esta cantidad |
| `drop` | `drops`, `dropPercent` | Descensos consecutivos realizados sin descanso tras la serie efectiva |
| `restPause` | `miniSets`, `intraSetRest`, `restUnit` | Una serie llevada cerca del fallo, luego reanudada tras descansos breves |
| `cluster` | `repsPerCluster`, `intraSetRest`, `restUnit` | Repeticiones agrupadas en clústeres con descanso programado dentro de la serie |
| `myoReps` | `activationReps`, `miniSetReps`, `miniSets`, `intraSetRest` | Una serie de activación seguida de miniseries cortas |
| `wave` | `waves`, `repPattern` | Una escalera de repeticiones que se repite, p. ej. `[3, 2, 1]`, ejecutada durante varias olas |
| `ladder` | `rungs`, `direction` | Peldaños explícitos, ascendentes, descendentes o de ida y vuelta |
| `density` | `timeCap`, `timeUnit`, `target` | El máximo trabajo dentro de un tope de tiempo |
| `topSetBackoff` | `backoffPercent`, `backoffSets` | Una serie tope, luego series de descenso a una carga reducida |

Estas claves son convencionales, no normativas — un productor PUEDE agregar las suyas. Un consumidor que reconoce el patrón pero no una clave DEBERÍA ignorar la clave y advertir, y NO DEBE expandir el patrón si le falta una clave que necesita.

### 4.7. `progressionRule`

`{ id, trigger, action }`. Los disparadores cubren la compleción (`allRepsCompleted`, `topOfRepRange`), el esfuerzo (`rpeBelow`, `rirAbove`, `amrapThreshold`), el tiempo (`sessionsCompleted`) y el fallo (`failedAttempts`). Las acciones cubren la carga, las repeticiones, las series, `deload`, `retest`, `advanceStage` y `hold`.

Una regla PUEDE transportar además un `name` legible por humanos y `notes` de texto libre; ninguno de los dos afecta la resolución.

La misma estructura de regla la consumen el RFC-007, donde la progresión aplica dentro de una sesión, y el RFC-008, donde aplica a lo largo de un ciclo. Esa es toda la razón por la que se define aquí y no en cualquiera de los dos.

## 5. Contexto de resolución

La mayoría de los objetivos de carga son *relativos*. Se convierten en una instrucción absoluta solo al combinarse con valores que FDS deliberadamente no transporta, porque FDS no modela a ninguna persona (D6: no existe entidad User ni Profile, y agregar una arrastraría el consentimiento y la retención a cada documento de referencia).

Esta sección nombra cada una de esas entradas. Un consumidor que pretenda renderizar cargas absolutas DEBE poder aportar el contexto para los métodos que encuentre, y NO DEBE fabricar un valor que le falta.

### 5.1. Qué requiere cada método

| Método | Contexto requerido | De dónde proviene |
|---|---|---|
| `absolute` | ninguno | — |
| `bodyweight`, `none` | ninguno | — |
| `rpe`, `rir` | ninguno en el momento de renderizar | El atleta lo resuelve durante la serie |
| `percent1RM` | Una repetición máxima (1RM) para el ejercicio prescrito, o para `referenceExerciseId` cuando está presente | Quien llama. `references.trainingMaxes[]` del RFC-008 declara *qué* levantamientos necesita un programa y por qué método se calculan — los *slots*, nunca los valores |
| `percentBodyweight` | El peso corporal del atleta | Solo quien llama. **No representable en FDS en absoluto** |
| `relative` | Historial de entrenamiento previo: la carga de la última sesión, una 1RM estimada o un máximo de entrenamiento | El registro de entrenamiento de quien llama |
| `autoregulated` | El estado actual de la regla de progresión referenciada | El estado de ejecución de quien llama |
| `velocity` | Medición en vivo de la velocidad de la barra | Instrumentación en el momento de la ejecución |
| `level` | La máquina específica | Contexto físico; no portable |
| `bandResistance` | La escala de colores del fabricante | `equipment`, más el conocimiento de esa escala por quien llama |
| `intensityZone` | Los límites personales de zona | Quien llama. El registro de zonas define el *sistema*; los números son personales |

Dos entradas merecen énfasis porque son las que más a menudo se dan por resueltas:

**El peso corporal no está en FDS y no lo estará.** Un objetivo `percentBodyweight` queda sin resolver sin un valor que quien llama aporta en el momento de renderizar. No hay campo donde ponerlo, por diseño — un peso corporal es un dato personal, y admitir uno haría que cada documento que lo transporte quede sujeto a las obligaciones que RFC-009 existe para manejar.

**Los máximos de entrenamiento son *slots*, no valores.** El RFC-008 permite que un programa declare que referencia un máximo de entrenamiento de sentadilla trasera calculado por un método declarado. Nunca transporta el número. Un programa completamente personalizado, por lo tanto, no puede hacer el *round-trip* como un solo documento autocontenido: la exportación es la plantilla más un contexto de resolución separado. Esa contrapartida se acepta deliberadamente, y es lo que mantiene los RFC-006 a RFC-008 libres de datos personales.

### 5.2. Determinar qué necesita un documento

Ni un Workout ni un Program declaran sus requisitos de resolución en un solo lugar. Un consumidor los determina recorriendo cada `loadTarget` y cada `intensityZone` del documento y reuniendo la unión del contexto anterior.

Los consumidores DEBERÍAN realizar ese recorrido **antes** de presentar una sesión, de modo que el contexto faltante se informe por adelantado en lugar de descubrirse serie a serie. Un programa que necesita una repetición máxima (1RM) de press de banca debería decirlo cuando se carga, no a mitad del tercer ejercicio.

### 5.3. Cuando falta contexto

Un consumidor que no puede resolver un objetivo NO DEBE sustituir un valor predeterminado, arrastrar la carga de una serie anterior ni estimar a partir de un levantamiento relacionado. DEBERÍA presentar la prescripción tal como está escrita — "70% 1RM" es honesto y accionable; un número fabricado no es ni lo uno ni lo otro.

Esto reformula el §3.3 para una falla distinta: el §3.3 gobierna un método que no se *entiende*; esto gobierna un método que se entiende pero no es *resoluble*. Ambos se resuelven de la misma manera, y por la misma razón — el costo de una carga equivocada lo asume una persona bajo una barra.

## 6. Versionado y compatibilidad

Esta biblioteca sigue las reglas de versionado del RFC-001 §5. Su URL publicada es un contrato congelado: los bytes en `prescription/v1.0.0/prescription.schema.json` no cambiarán. Las adiciones se publican como una nueva versión minor en una nueva URL.

Agregar un método a una unión discriminada es un cambio MINOR: los documentos válidos bajo la versión anterior siguen siendo válidos, porque el nuevo método antes validaba a través de la rama comodín. Esa es la propiedad de compatibilidad que la rama comodín existe para proporcionar, y es la razón por la que la rama se especifica en lugar de dejarse a las implementaciones.

Eliminar un método, o estrechar una carga útil existente, es un cambio MAJOR.

## 7. Guía de implementación

### 7.1. Productores

Preferir el método más específico que exprese la intención. Un programa que piensa en porcentajes DEBERÍA emitir `percent1RM` en lugar de pre-resolver a `absolute`, porque el porcentaje es la instrucción y los kilogramos son el renderizado de un atleta concreto. La pre-resolución descarta la información que hace portable a un programa.

Emitir `none` cuando la carga queda deliberadamente sin prescribir. Omitir `load` por completo significa no declarada, que es una afirmación distinta.

### 7.2. Consumidores

Resolver en este orden: comprobar que el método se entiende; si no, ignorar y advertir. Luego reunir el contexto que el §5 requiere. Luego redondear el valor resuelto al incremento del implemento (`equipment.loading.increment`, RFC-002 §4.4) en lugar de presentar una carga que nadie puede montar.

Un consumidor que no puede resolver un objetivo DEBERÍA mostrar la prescripción tal como está escrita — "70% 1RM" es más útil para un atleta que un campo vacío o un número fabricado.

### 7.3. Validación

Dado que la raíz de la biblioteca es insatisfacible, validar los fragmentos contra la definición que afirman ser. La implementación de referencia compone un esquema envolvente — la biblioteca más un `$ref` raíz a la definición nombrada — que es lo que hace `scripts/check-prescription.mjs` en este repositorio.

## 8. Consideraciones de seguridad y privacidad

Esta biblioteca define datos de referencia y no contiene datos personales por construcción. Esa es una propiedad que vale la pena preservar deliberadamente: cada método que *requeriría* datos personales — `percent1RM`, `percentBodyweight`, `relative`, `intensityZone` — los referencia en lugar de transportarlos. La 1RM, el peso corporal, el historial de entrenamiento y los límites de zona viven todos en el contexto de resolución del consumidor.

Esto mantiene los RFC-006, RFC-007 y RFC-008 libres de PII, y hace nítida la frontera del RFC-009: todo lo anterior al RFC-009 es dato de referencia; el RFC-009 es donde comienzan los datos personales, con las obligaciones de consentimiento y retención que los acompañan.

Una implementación que incruste valores personales resueltos en una prescripción — escribiendo los kilogramos reales de un atleta en lo que era un porcentaje — mueve ese documento a través de la frontera y hereda esas obligaciones.

## 9. Referencia del JSON Schema

`https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json`

### 9.1. Validación

```bash
# Fragments, not documents — the library root accepts nothing.
npm run check:prescription
```

## 10. Ejemplo

Una serie tope a RPE 8 seguida de series de descenso a un porcentaje de un levantamiento distinto, con una excéntrica de cuatro segundos y tres minutos de descanso entre series:

```json fds:fragment entity=prescription defs=load:loadTarget,reps:repTarget,tempo:tempo,rest:restSpec,scheme:setScheme
{
  "load": { "method": "rpe", "value": 8, "allowHalf": true },
  "reps": { "kind": "range", "min": 3, "max": 5 },
  "tempo": { "eccentric": 4, "bottomPause": 1, "concentric": "X", "topPause": 0 },
  "rest": { "method": "fixed", "appliesTo": "set", "value": 3, "unit": "min" },
  "scheme": {
    "pattern": "topSetBackoff",
    "sets": 4,
    "params": { "backoffPercent": 10, "backoffSets": 3 }
  }
}
```

Junto al esquema se publican ejemplos resueltos para cada método del §4.1.

## Conformidad

Una implementación conforma con esta especificación si:

1. Acepta cada método y cada kind definidos en §4, incluso a través de la rama de compatibilidad hacia adelante.
2. Ignora los objetivos de carga cuyo método no entiende, advierte, y no sustituye un valor.
3. Preserva la distinción entre un `load` ausente y `{ "method": "none" }`.
4. Trata la carga `assisted` como asistencia y no como resistencia al calcular o mostrar el esfuerzo.
5. No compara ni convierte valores de `level` entre máquinas.
6. Requiere `appliesTo` en cada especificación de descanso que emite.

## 11. Referencias

### 11.1. Referencias normativas

- RFC 2119 — Key words for use in RFCs
- RFC-001 — Modelo de datos de ejercicios (formas de métricas, características de carga)
- RFC-002 — Modelo de datos de equipamiento (incrementos de carga)
- JSON Schema Draft 2020-12

### 11.2. Referencias informativas

- RFC-007 — Modelo de datos de sesiones de entrenamiento (consumidor de esta biblioteca)
- RFC-008 — Modelo de datos de programas de entrenamiento (consumidor de esta biblioteca)
- `specification/metrics-guide.md` — emparejamientos de tipo/unidad de métrica
