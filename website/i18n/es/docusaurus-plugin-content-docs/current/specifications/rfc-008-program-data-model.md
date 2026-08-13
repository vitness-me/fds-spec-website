---
title: 'RFC-008: Modelo de datos de programas de entrenamiento'
description: Planes de entrenamiento multisesión — ciclos, semanas, ubicación de días, progresión, ramificación y la frontera de privacidad del máximo de entrenamiento
sidebar_position: 8
keywords: [program, periodization, mesocycle, deload, schedule, progression, training max, data model, json schema, rfc]
---

# RFC-008: Especificación del modelo de datos de programas de entrenamiento

**Estado**: Borrador
**Versión**: 0.1.0
**Fecha**: 2026-08-10
**Autores**: Equipo VITNESS
**Categoría**: Standards Track

## Resumen

Esta especificación define un modelo estandarizado para un programa de entrenamiento — un plan que coloca sesiones en el tiempo. Cubre cómo un plan se divide en ciclos, semanas y días, cómo se posiciona un día, cómo cambia la prescripción a medida que el plan avanza, y quién es el dueño del plan.

La afirmación central es estructural: **un programa es un cronograma de referencias a sesiones de entrenamiento, no un contenedor de sesiones.** Una sesión usada el lunes de cada semana durante doce semanas se redacta una vez y se apunta a ella doce veces. Una sesión compartida por cuatro programas se corrige una vez, y los cuatro quedan corregidos.

La prescripción en sí proviene del RFC-006 y la estructura de la sesión del RFC-007. Ninguna se reformula aquí. Lo que este documento agrega es el *tiempo*: la ubicación, la repetición, la progresión y las condiciones bajo las cuales un plan cambia de rumbo.

## 1. Introducción

### 1.1. Antecedentes

Los formatos de intercambio para planes de entrenamiento típicamente incrustan sus sesiones. Cada día transporta una copia completa de la sesión que prescribe, de modo que un plan de doce semanas con tres sesiones por semana contiene treinta y seis documentos de sesión, la mayoría idénticos. La duplicación no es meramente derrochadora — es un problema de corrección. Cuando el ejercicio prescrito resulta estar equivocado, no hay un único lugar donde corregirlo, y un plan reparado en ocho de sus treinta y seis copias es peor que uno reparado en ninguna, porque ahora discrepa consigo mismo.

La segunda falla recurrente es más sutil. Los planes que *sí* están personalizados tienden a incorporar la personalización: el documento que dice "70% de tu máximo de sentadilla" se exporta como uno que dice "142.5 kg". En ese punto el plan ha dejado de ser un plan. No puede compartirse, no puede volver a ejecutarlo el mismo atleta seis meses después, y ha adquirido en silencio datos personales que el formato nunca fue diseñado para proteger.

Este RFC toma la posición opuesta en ambos casos. Los días apuntan a sesiones de entrenamiento. Los valores que dependen de una persona se declaran como *slots* y nunca se rellenan.

### 1.2. Objetivos

1. Expresar cada modelo de periodización del §4.6 de la matriz de escenarios y cada estructura de cronograma del §4.7, sin campos por metodología.
2. Referenciar sesiones de entrenamiento (RFC-007) y componer las primitivas de prescripción (RFC-006) en lugar de reformular cualquiera de las dos.
3. Mantener el plan prescriptivo: un programa describe el entrenamiento previsto, nunca el entrenamiento realizado.
4. Seguir siendo compatible hacia adelante — un modelo de cronograma definido después de esta versión NO DEBE invalidar el documento.
5. No contener datos personales, incluidos los valores a partir de los cuales se calcularía un plan personalizado.

### 1.3. Alcance

**Dentro del alcance:** la estructura de ciclos y semanas, la ubicación de días, los días de descanso y opcionales, el ajuste por ocurrencia, las reglas de progresión, el enrutamiento condicional, las entradas de cálculo declaradas, la autoría y las licencias.

**Fuera del alcance:**

- Las primitivas de prescripción en sí (RFC-006)
- La estructura de la sesión — bloques, modos, agrupación, series (RFC-007)
- Los datos ejecutados: qué se hizo realmente, por quién y cuándo (RFC-009, diferido)
- La identidad del atleta, el peso corporal y el valor numérico de cualquier repetición máxima (1RM) o máximo de entrenamiento. Véanse §8 y RFC-006 §5.

## 2. Terminología

Las palabras clave DEBE, NO DEBE, DEBERÍA, NO DEBERÍA y PUEDE (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY — cuyo texto inglés es el normativo) deben interpretarse como se describe en RFC 2119.

- **Programa** — un plan que coloca sesiones en el tiempo.
- **Ciclo** — un bloque de entrenamiento con una sola intención. Los macrociclos, mesociclos y microciclos son todos ciclos.
- **Semana** — un grupo de días dentro de un ciclo.
- **Día** — un espacio programado: o bien una referencia a una sesión de entrenamiento, o bien un descanso prescrito.
- **Modelo de cronograma** — cómo se coloca un día en el tiempo.
- ***Slot*** — una declaración de que el programa se calcula a partir de un valor, sin el valor.

## 3. Requisitos estructurales centrales

### 3.1. Campos obligatorios

`schemaVersion`, `programId`, `canonical`, `classification`, `schedule` y `metadata`. La envoltura — `canonical`, `metadata`, `attributes`, `extensions`, `additionalProperties` cerrado en el nivel superior — se hereda sin cambios del RFC-001.

`schedule.cycles` DEBE contener al menos un ciclo, cada ciclo al menos una semana, y cada semana al menos un día. Un plan sin días no es un programa; es un título.

### 3.2. Un programa referencia sesiones de entrenamiento; no las contiene

Un día transporta una referencia `workout` — el `workoutRef` compartido del RFC-001, un identificador más un nombre desnormalizado para mostrar — y nunca un documento de sesión incrustado.

Esta es la decisión de mayor consecuencia de este RFC, y vale la pena declarar qué compra y qué cuesta.

Compra **un único punto de corrección**. Una sesión referenciada por cuarenta días se redacta una vez. Cuando cambia, cambia cada día que la referencia, que es casi siempre lo que el autor quiso. También compra **el compartir entre programas**: un programa de principiantes y uno avanzado que prescriben la misma sesión de técnica apuntan al mismo documento en lugar de bifurcarlo.

Cuesta **autocontención**. Un documento de programa por sí solo no es renderizable; un consumidor necesita también las sesiones referenciadas. FDS lo acepta porque la alternativa — un documento autocontenido que duplica su contenido — cambia una dependencia resoluble por una inconsistencia irresoluble. El `name` desnormalizado en la referencia existe precisamente para que un programa siga siendo *listable* sin resolución, aunque no sea *ejecutable* sin ella.

Un consumidor que no puede resolver una referencia a una sesión DEBE informar el día como no resuelto. NO DEBE omitir el día en silencio y NO DEBE tratarlo como un día de descanso; una sesión irresoluble y un descanso prescrito son instrucciones distintas, y confundirlas quita entrenamiento del plan sin decirlo.

### 3.3. Modelos de cronograma

`schedule.model` — un `scheduleModel` — decide **cuál de los campos de ubicación de un día es autoritativo**. Es por lo tanto un discriminador estructural, no un clasificador, y sigue el RFC-006 §3.2: un conjunto cerrado de valores conocidos más una rama comodín mantenida disjunta con `not`/`enum`.

| `model` | Ubicación autoritativa | Significado |
|---|---|---|
| `calendar` | `dayOfWeek` | Los días caen en días de la semana con nombre. El lunes de la semana dos es un lunes. |
| `relative` | `offsetDays` | Los días caen a un desplazamiento fijo desde el inicio del programa, sea cual sea el día de la semana. |
| `rolling` | `offsetDays` | Los días se repiten con una cadencia fija — tres de trabajo, uno libre — que se desfasa del calendario por diseño. |
| `sequence` | ninguna | Los días se realizan en orden al ritmo del atleta. `index` es el único orden. |

Leer un documento bajo el modelo equivocado no produce un plan ligeramente distinto. Una cadencia `rolling` de cinco días leída como `calendar` reordena el entrenamiento y colapsa el patrón de descanso en torno al cual se construyó. Por eso el modelo es obligatorio y por eso uno no reconocido no se ejecuta — véase §3.6.

`dayOfWeek` y `offsetDays` PUEDEN estar ambos presentes. Bajo cada modelo exactamente uno es autoritativo y el otro es orientativo; los productores que emitan ambos DEBERÍAN mantenerlos consistentes, y los consumidores NO DEBEN resolver una discrepancia prefiriendo el campo que el modelo no nombra.

### 3.4. Ciclos, semanas y días

El anidamiento de macro, meso y micro se expresa mediante el `type` y el `order` de un ciclo, no incrustando ciclos dentro de ciclos.

```
schedule → cycles[] → weeks[] → days[]
```

Un macrociclo y los mesociclos en su interior aparecen por lo tanto como hermanos en un único arreglo plano `cycles`, distinguidos por `type` y secuenciados por `order`. Dos razones: una lista plana sigue siendo legible a la profundidad que los programas reales alcanzan, y un ciclo puede referenciarse directamente en lugar de mediante una ruta a través de sus ancestros.

`week.index` y `day.index` comienzan en 1 y son explícitos en lugar de estar implícitos en la posición del arreglo, para que una semana o un día puedan referenciarse de forma estable. Las posiciones de un arreglo se desplazan cuando un documento se edita; un `index` no.

### 3.5. Un día es una sesión de entrenamiento o un día de descanso

Exactamente uno de los dos. Un día que transporta `workout` es un día de entrenamiento; un día que transporta `rest` en `true` es un día de descanso; un día que transporta ambos es una contradicción, y un día que no transporta ninguno no dice nada en absoluto.

El esquema lo hace cumplir con `anyOf` para la mitad de al-menos-uno y con `not`/`allOf` para la mitad de como-máximo-uno. La razón para hacerlo cumplir en lugar de aconsejarlo es que un consumidor que renderiza un calendario tiene que poner *algo* en el espacio, y cualquier reparación que invente — tratar un día vacío como descanso, preferir la sesión sobre la bandera de descanso — es una conjetura sobre la intención del autor que el autor pudo haber declarado.

El descanso se modela explícitamente en lugar de dejarse como un hueco en la secuencia por la misma razón. Un día ausente es no planificado; un día de descanso prescrito es parte del programa, y la distinción es exactamente de lo que está hecha una semana de descarga.

Un día PUEDE además marcarse como `optional`, lo que dice que el autor lo considera discrecional — trabajo accesorio o de acondicionamiento que puede omitirse sin romper el plan. `optional` es ortogonal a la distinción sesión/descanso: califica un día de entrenamiento, no lo reemplaza.

### 3.6. Los modelos desconocidos y las condiciones inevaluables nunca se adivinan

Un consumidor que encuentra un `schedule.model` que no entiende NO DEBE colocar los días recurriendo a `calendar`, `sequence` ni ningún otro valor predeterminado. DEBERÍA presentar la estructura del plan — sus ciclos, semanas y días en el orden del documento — e indicar que la ubicación no se entiende.

Un consumidor que encuentra una `condition` de rama cuyo `kind` no puede evaluar DEBE seguir el cronograma incondicional y DEBERÍA advertir. NO DEBE adivinar la rama.

Ambos reflejan el RFC-006 §3.3 y el RFC-007 §3.5, y por la misma razón. Adivinar una rama en un plan construido en torno a `failedPrescribedReps` puede enrutar a un atleta hacia una semana de intensificación para la que acaba de demostrar que no está preparado.

## 4. Estructuras de referencia

### 4.1. `classification`

`periodization` es obligatorio; `goal`, `level`, `durationWeeks` y `tags` son opcionales.

`periodization` es un clasificador simple y, según D8, una cadena abierta con valores recomendados — `linear`, `undulating`, `block`, `conjugate`, `wave`, `none` — transportados como `examples` en lugar de restringirse. Nombra la forma del plan; no cambia cómo se lee el documento. `goal` es abierto en los mismos términos, con `strength`, `hypertrophy`, `peaking`, `conditioning`, `endurance` y `general` recomendados. `level` es un `enum` cerrado de `beginner`, `intermediate` y `advanced`, en concordancia con el RFC-007.

`durationWeeks` es **derivado y orientativo**, en los mismos términos que los resúmenes agregados del RFC-007. DEBE ser igual a la suma de las duraciones de los ciclos, y un consumidor que necesite certeza DEBERÍA calcularlo en lugar de confiar en él. Existe para que una biblioteca de programas pueda listarse y filtrarse sin resolver cada ciclo.

### 4.2. `cycle`

`id`, `type`, `order` y `weeks` son obligatorios; `name`, `durationWeeks`, `intent` y `notes` son opcionales.

`type` es uno de `macro`, `meso` y `micro`. `order` comienza en 1 y secuencia los ciclos del mismo tipo.

`intent` es para qué *sirve* el ciclo — `accumulation`, `intensification`, `realization`, `deload`, `test` — y es una cadena abierta según D8. Explica el plan a un lector; no cambia cómo lo ejecuta un consumidor. Un consumidor que no reconoce una intención renderiza el ciclo exactamente como lo habría hecho de todos modos.

### 4.3. `week`

`index` y `days` son obligatorios; `name`, `deload` y `notes` son opcionales.

`deload` es una bandera booleana en la semana y no un valor del `intent` del ciclo, porque una semana de recuperación aparece rutinariamente dentro de un ciclo cuya intención es otra cosa — la cuarta semana de un bloque de acumulación sigue siendo la descarga de la acumulación. Hacerla una bandera permite que ambas afirmaciones sean verdaderas a la vez.

`deload` marca la semana; no ajusta el entrenamiento. El ajuste se expresa mediante los `overrides` de los días, o mediante que las sesiones referenciadas sean sesiones más ligeras. Un consumidor NO DEBE inferir una reducción de carga solo a partir de la bandera.

### 4.4. `day`

`index` es obligatorio. `id`, `dayOfWeek`, `offsetDays`, `rest`, `optional`, `workout`, `overrides` y `notes` son opcionales, sujetos al §3.5.

`id` es aquello hacia lo que `branching` enruta, de modo que cualquier día que sea destino de una rama DEBE transportar uno.

### 4.5. `overrides`

Los `overrides` de un día — un objeto `dayOverrides` — ajustan la sesión referenciada **solo para esta ocurrencia**. El documento de la sesión nunca se modifica — eso es precisamente lo que la hace compartible entre días y entre programas. Un override se lee como una transformación aplicada en el momento de renderizar, no como una edición.

`loadScaling` es un multiplicador aplicado a cada carga resuelta de la sesión. `0.9` es un descenso del diez por ciento. Se aplica **después** de que el objetivo de carga se resuelve, que es lo que le permite componerse con cualquier método del RFC-006 en lugar de reemplazarlo: escalar una carga `absolute` multiplica los kilogramos, escalar una carga `percent1RM` multiplica el resultado resuelto del porcentaje, y escalar un objetivo `rpe` no multiplica nada, porque un RPE no tiene carga que multiplicar hasta que el atleta aporta una. Los productores que quieran reducir la dificultad en un día autorregulado DEBERÍAN bajar el objetivo en una `progressionRule` en lugar de esperar que `loadScaling` lo alcance.

`volumeScaling` es un multiplicador aplicado a los conteos de series. El redondeo es del consumidor, y DEBERÍA redondear en beneficio del atleta en una descarga — tres series escaladas por `0.6` son una serie, no dos, cuando la semana está marcada para recuperación.

`progressionState` registra en qué punto de una regla de progresión se sitúa esta ocurrencia: el número de ola en un ciclo 5/3/1, la etapa de una progresión doble. Es opaco para el esquema y significativo solo para la regla que lo lee. Un consumidor que no entiende la regla NO DEBE interpretar su estado.

**Cuando un día aplica overrides a una sesión que a su vez transporta una regla de progresión**, el orden es: la regla propia de la sesión se resuelve primero, produciendo una prescripción; los `overrides` del día se aplican luego a ese resultado. La regla ve la sesión tal como fue redactada, no como fue escalada. Cualquier otro orden haría que el comportamiento de una regla de progresión dependiera de qué programa la está ejecutando, y la misma regla progresaría entonces de manera distinta en dos planes que ambos afirman usarla.

### 4.6. `progressions`

`progressions` es una lista de objetos `progressionRule` del RFC-006, referenciados por `id` desde el `progressionState` de un día o desde un objetivo de carga. La definición no se reformula aquí; una regla significa lo mismo dentro de una sesión y a lo largo de un programa, que es la razón por la que vive en la biblioteca compartida y no en cualquiera de los dos RFC.

Lo que un programa agrega es el *ámbito*: una regla declarada aquí aplica a lo largo de la línea temporal del plan, de modo que un disparador `sessionsCompleted` cuenta sesiones a través de los ciclos y no dentro de uno. Una regla declarada aquí es además aquello contra lo que se resuelve el objetivo de carga `autoregulated` de una sesión referenciada, a través de `progressionRuleRef` — la regla y la carga que la usa pueden por lo tanto vivir en documentos distintos, y un consumidor DEBE resolver la referencia contra el programa que programó la sesión.

#### El límite de la programación adaptativa

La programación adaptativa o dirigida por modelos cubre dos cosas distintas, y solo una de ellas es dato portable.

**La adaptación de carga es expresable.** Las sesiones y su ubicación son fijas, y las cargas se resuelven en el momento de la ejecución a través de objetivos `autoregulated` que apuntan a las reglas declaradas aquí. Eso es lo que los sistemas autorregulados realmente varían, y hace el *round-trip*: otra implementación que lee el documento obtiene el mismo plan y las mismas reglas.

**La selección de ejercicios generada por sesión no es expresable, y esta versión no lo intenta.** Un día transporta un `workoutRef`, que requiere una sesión que exista. Deliberadamente no hay día indeterminado, porque un programa cuyo contenido lo produce un generador no puede leerse sin ese generador — que es lo opuesto de aquello para lo que existe un formato de intercambio. Un sistema que genera sesiones DEBERÍA emitir el programa resultante una vez que las sesiones existen, y transportar la configuración de su motor bajo `extensions`, donde un consumidor puede ignorarla sin perder el plan.

Esto es una frontera declarada, no una omisión. Si surge una manera portable de expresar la selección diferida, se publica en una nueva versión.

### 4.7. `branching`

`branching` enruta entre días de forma condicional: superar una prueba y continuar, fallarla y repetir la semana. Cada `branch` transporta un `id`, una `condition`, un `thenDayRef` y, opcionalmente, un `elseDayRef` y `notes`.

La `condition` es declarativa en lugar de una expresión: transporta un `kind` de un conjunto cerrado — `failedPrescribedReps`, `metPrescribedReps`, `amrapBelowThreshold`, `amrapAboveThreshold`, `missedSession`, `athleteChoice` — y un `onDayRef` opcional que nombra el día contra el que se evalúa la condición. Es declarativa precisamente para que un consumidor pueda *reconocer* una condición que no puede evaluar y rechazarla, algo que un lenguaje de expresiones incrustado no permitiría.

El objeto de condición es por lo demás abierto, porque los umbrales difieren según el kind y congelar su forma en la 1.0.0 fijaría para siempre los parámetros de seis metodologías. El `kind` es la puerta de control: un consumidor que no lo reconoce tampoco puede usar sus parámetros.

Evaluar una condición requiere datos ejecutados, que FDS no modela (§8). Un consumidor por lo tanto evalúa las ramas contra su propio registro de entrenamiento, o no las evalúa en absoluto — y según §3.6, no evaluarlas significa seguir el cronograma incondicional, no adivinar.

### 4.8. `authorship`

`authorship` registra quién escribió el programa y en qué términos: `author`, `organization`, `license`, `attribution` y un `uri`. Todos son opcionales.

Este es **el primer lugar donde FDS registra una reivindicación de derechos**, y está aquí y no en un ejercicio o una pieza de equipamiento por lo que un programa es. Un movimiento no se redacta en ningún sentido significativo; un plan de doce semanas sí. Los programas de entrenamiento son rutinariamente redactados por entrenadores y licenciados comercialmente, y un formato de intercambio que pierde la atribución en tránsito hace la redistribución indistinguible del robo — no como asunto legal, sino como asunto práctico: el receptor no tiene manera de saberlo.

`license` es un identificador SPDX donde uno aplica, o texto libre donde ninguno lo hace. **La ausencia significa no declarada, no dominio público.** Un consumidor NO DEBE tratar una `license` ausente como permiso, y DEBERÍA preservar `authorship` intacto a través de cualquier transformación que produzca un programa derivado.

### 4.9. Campos descriptivos opcionales

`relations` enlaza un programa con otros por `type` y `targetId`, con `notes` opcionales. Los tipos reconocidos son `successor`, `predecessor`, `variant`, `beginnerVariant` y `advancedVariant`. Así es como un programa declara qué lo sigue — la pregunta que todo atleta que termina se hace — y como una familia de variantes de dificultad se ata sin duplicar el plan.

`media` sigue la definición compartida del RFC-001. `attributes` y `extensions` son las válvulas de escape del RFC-001, sin cambios. Los ciclos, las semanas, los días y los overrides aceptan todos `notes`; los ciclos y las semanas aceptan además un `name` para mostrar.

## 5. Composición con RFC-006 y RFC-007

| Dónde | Proviene de |
|---|---|
| `days[].workout` | `workoutRef` del RFC-001 — la sesión en sí es RFC-007 |
| `progressions[]` | `progressionRule` del RFC-006 |
| `references.trainingMaxes[].exercise` | `exerciseRef` del RFC-001 |
| `canonical`, `metadata`, `media` | RFC-001 |

Un programa no contiene prescripción propia. Cada carga, objetivo de repeticiones, tempo e intervalo de descanso de un plan vive en las sesiones que referencia, que es lo que hace de la afirmación del §3.2 algo más que un argumento de eficiencia: no hay un segundo lugar donde una prescripción pueda estar, así que no hay un segundo lugar donde pueda estar equivocada.

### 5.1. Contexto de resolución

Un programa hereda cada requisito de resolución de cada sesión que referencia, y una sesión hereda cada requisito de los objetivos de carga que contiene — RFC-006 §5.2. Determinar qué necesita un plan antes de empezarlo significa, por lo tanto, resolver sus sesiones y recorrer sus prescripciones.

`references.trainingMaxes` existe para que esa respuesta esté disponible *sin* el recorrido. Es una declaración, en la cabecera del programa, de a partir de qué levantamientos se calcula el plan. Véase §8 para lo que deliberadamente no contiene.

## 6. Versionado y compatibilidad

Esta entidad sigue las reglas de versionado del RFC-001 §5. Su URL publicada es un contrato congelado; las adiciones se publican en una nueva URL de versión.

Agregar un `schedule.model`, un `intent` de ciclo, un `kind` de condición o un tipo de `relations` es un cambio MENOR. Los documentos válidos bajo la versión anterior siguen siendo válidos: los clasificadores abiertos ya aceptaban el valor, y un modelo nuevo antes validaba a través de la rama comodín.

Las entidades versionan de forma independiente. Una nueva versión de program no obliga a moverse a workout, a exercise ni a la biblioteca de prescripción, y ninguna de sus versiones obliga a esta.

## 7. Guía de implementación

### 7.1. Productores

Referenciar las sesiones de entrenamiento; no incrustarlas. Si una sesión difiere entre dos días, es una sesión distinta y merece su propio documento — o la diferencia es un `overrides`, que es para lo que `overrides` existe.

Declarar `rest` explícitamente para los días de descanso planificados en lugar de omitir el día. Un calendario con un hueco y un calendario con un día de descanso se ven idénticos para un lector y son instrucciones distintas para un consumidor.

Emitir `id` en cada día al que una rama pueda apuntar, y en cada ciclo que un lector pueda necesitar citar.

Mantener `durationWeeks` consistente con los ciclos, u omitirlo. Un resumen agregado equivocado es peor que uno ausente.

### 7.2. Consumidores

Leer primero `schedule.model` y luego colocar los días usando el campo que nombra. No inferir la ubicación a partir del campo que resulte estar presente.

Resolver cada sesión referenciada antes de presentar el plan, y reunir la unión de sus requisitos de resolución junto con `references.trainingMaxes`, de modo que el contexto faltante se informe cuando el programa se carga y no a mitad de la semana tres.

Recalcular `durationWeeks` cuando la corrección importe. No interpretar `deload`, `intent` ni `periodization` como instrucciones de cambiar cargas.

## 8. Consideraciones de seguridad y privacidad

Un programa es dato de referencia y no contiene datos personales por construcción. No transporta ningún atleta, ningún peso corporal, ningún valor ejecutado y — el punto de esta sección — **ningún máximo de entrenamiento**.

### 8.1. Los máximos de entrenamiento son *slots*, no valores

`references.trainingMaxes` declara que el programa referencia un máximo de entrenamiento para un levantamiento dado, y cómo se llega a ese número. Nunca transporta el número.

Cada `trainingMaxSlot` transporta un `exercise`, un `method` que nombra cómo quien llama deriva el valor — `testedOneRepMax`, `estimatedOneRepMax`, `percentOfOneRepMax`, `recentBest` o `callerSupplied` — y un `id` opcional. Un `percent` acompaña a `percentOfOneRepMax`: un máximo de entrenamiento fijado en el 90% de un máximo real es la convención del 5/3/1. `notes` puede explicar una regla de la casa.

El `id` es un identificador local, para que una regla de progresión o un override de día puedan citar el *slot*. Los objetivos de carga no lo usan. Un `percent1RM` nombra el levantamiento a través de `referenceExerciseId`, y el *slot* que aplica es aquel cuyo `exercise` nombra — la coincidencia es por el ejercicio, no por el identificador propio del *slot*. Un productor que emite un *slot* para un levantamiento que ninguna prescripción referencia ha declarado un requisito que el plan no tiene, y los consumidores DEBERÍAN advertir en lugar de exigir el valor.

**Una implementación conforme NO DEBE extender esta estructura con el valor en sí.** Esto se declara de forma normativa porque es lo que un implementador tiene más probabilidades de intentar "arreglar". El *slot* se lee como un objeto al que le falta un campo, y agregarlo parece hacer los programas autocontenidos sin costo alguno.

Ese costo existe. Una repetición máxima (1RM) es un dato personal sobre la capacidad física de una persona identificable. Un programa que la transporta ya no es dato de referencia: adquiere un titular, y con el titular llegan obligaciones de consentimiento, retención, portabilidad y supresión que alcanzan a cada sistema por el que pasa el documento. FDS está construido para que los catálogos, las sesiones y los planes puedan publicarse, almacenarse en caché, replicarse y diferenciarse libremente, y eso solo es defendible mientras ninguno de ellos describa a una persona. Un solo campo numérico, agregado por conveniencia, movería el corpus entero de programas al otro lado de esa línea.

La consecuencia aceptada es que **un programa completamente personalizado no puede hacer el *round-trip* como un solo documento autocontenido.** La exportación es el plan más un contexto de resolución separado. Esa es la contrapartida, es deliberada, y es lo que mantiene los RFC-006 a RFC-008 libres de datos personales. El RFC-009 definirá dónde viven los datos ejecutados y personales, con las obligaciones que los acompañan.

### 8.2. Artefactos derivados

Una implementación que resuelve un programa contra un atleta específico y almacena el resultado — escribiendo kilogramos en lugar de porcentajes a lo largo de doce semanas — ha producido datos personales y hereda esas obligaciones. Ese artefacto no es un Program en el sentido de este RFC, y NO DEBE publicarse en un registro de programas.

## 9. Referencia del JSON Schema

`https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json`

### 9.1. Validación

```bash
npm run verify schemas
```

## 10. Ejemplo

Un bloque lineal de cuatro semanas en un cronograma de calendario: tres días de entrenamiento por semana, una descarga en la semana cuatro, un *slot* de máximo de entrenamiento declarado y una rama que repite la semana ante una sesión fallida.

```json
{
  "schemaVersion": "1.0.0",
  "programId": "00000000-0000-4000-8000-00000000b001",
  "canonical": { "name": "Foundation Strength", "slug": "foundation-strength" },
  "classification": {
    "periodization": "linear",
    "goal": "strength",
    "level": "intermediate",
    "durationWeeks": 4
  },
  "authorship": {
    "author": "VITNESS Team",
    "license": "CC-BY-4.0",
    "attribution": "Foundation Strength by the VITNESS Team"
  },
  "references": {
    "trainingMaxes": [
      {
        "id": "tm.backSquat",
        "exercise": { "id": "ex.backSquat", "name": "Barbell Back Squat" },
        "method": "percentOfOneRepMax",
        "percent": 90
      }
    ]
  },
  "progressions": [
    {
      "id": "prog.linear",
      "name": "Add 2.5 kg on a clean session",
      "trigger": { "kind": "allRepsCompleted" },
      "action": { "kind": "increaseLoad", "amount": 2.5, "unit": "kg" }
    }
  ],
  "schedule": {
    "model": "calendar",
    "cycles": [
      {
        "id": "c1",
        "name": "Base",
        "type": "meso",
        "order": 1,
        "durationWeeks": 4,
        "intent": "accumulation",
        "weeks": [
          {
            "index": 1,
            "days": [
              {
                "id": "d1",
                "index": 1,
                "dayOfWeek": "monday",
                "workout": { "id": "wo.lowerA", "name": "Lower A" }
              },
              { "id": "d2", "index": 2, "dayOfWeek": "tuesday", "rest": true },
              {
                "id": "d3",
                "index": 3,
                "dayOfWeek": "wednesday",
                "workout": { "id": "wo.upperA", "name": "Upper A" }
              },
              {
                "id": "d4",
                "index": 4,
                "dayOfWeek": "friday",
                "optional": true,
                "workout": { "id": "wo.conditioning", "name": "Conditioning" }
              }
            ]
          },
          {
            "index": 4,
            "name": "Deload",
            "deload": true,
            "days": [
              {
                "id": "d13",
                "index": 1,
                "dayOfWeek": "monday",
                "workout": { "id": "wo.lowerA", "name": "Lower A" },
                "overrides": {
                  "loadScaling": 0.85,
                  "volumeScaling": 0.6,
                  "notes": "Back off; keep the movement, drop the stress."
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "branching": [
    {
      "id": "b1",
      "condition": { "kind": "failedPrescribedReps", "onDayRef": "d1" },
      "thenDayRef": "d1",
      "notes": "Repeat the session at the same load rather than advancing."
    }
  ],
  "relations": [
    { "type": "successor", "targetId": "00000000-0000-4000-8000-00000000b002" }
  ],
  "metadata": {
    "createdAt": "2026-08-10T00:00:00Z",
    "updatedAt": "2026-08-10T00:00:00Z",
    "status": "active",
    "source": "vitness.core"
  }
}
```

Junto al esquema se publican ejemplos resueltos para cada modelo de periodización del §4.6 y cada estructura de cronograma del §4.7 de la matriz de escenarios.

## Conformidad

Una implementación es conforme con esta especificación si:

1. Resuelve las referencias `days[].workout` en lugar de esperar sesiones incrustadas, e informa un día cuya referencia no puede resolverse en lugar de omitirlo.
2. Coloca los días usando el campo nombrado por `schedule.model`, y no ejecuta un modelo que no reconoce.
3. Rechaza un día que transporta tanto `workout` como `rest`, y un día que no transporta ninguno.
4. Aplica los `overrides` a la sesión resuelta solo para esa ocurrencia, después de que la regla de progresión propia de la sesión se haya resuelto.
5. Sigue el cronograma incondicional cuando una condición de rama no puede evaluarse, y advierte en lugar de adivinar.
6. Recalcula `durationWeeks` en lugar de confiar en él cuando la corrección importa.
7. Preserva `authorship` a través de las transformaciones, y no trata una `license` ausente como permiso.
8. No transporta ningún valor de máximo de entrenamiento en un documento de programa, y no publica un programa resuelto como un Program.

## 11. Referencias

### 11.1. Referencias normativas

- RFC 2119 — Key words for use in RFCs
- RFC-001 — Modelo de datos de ejercicios
- RFC-006 — Primitivas de prescripción
- RFC-007 — Modelo de datos de sesiones de entrenamiento
- JSON Schema Draft 2020-12

### 11.2. Referencias informativas

- RFC-002 — Modelo de datos de equipamiento
- `specification/metrics-guide.md`
