---
title: 'Flujo de preguntas: cómo se construyen FXI y FXE'
sidebar_label: 'Flujo de preguntas'
description: 'El flujo completo de preguntas al propietario, en borrador, y cómo las respuestas construyen las cadenas FXI y FXE'
sidebar_position: 3
---

# Flujo de preguntas: cómo se construyen FXI y FXE

:::caution Borrador
No es normativo hasta que se acepte el [RFC-010](/docs/specifications/rfc-010-structural-descriptors), que adopta los descriptores estructurales. El RFC-010 es un borrador. Véase [la visión general](./overview.md).
:::

Nadie necesita escribir la notación FXI. Un propietario responde preguntas cerradas sobre un ejercicio, o sobre una pieza de equipamiento, y las respuestas construyen las cadenas. Esta página es el flujo completo, escrito de modo que una persona pueda recorrerlo a mano y que dos implementaciones construyan cadenas idénticas byte a byte a partir de las mismas respuestas.

Las preguntas, sus condiciones y el código que escribe cada opción se generan a partir de [`specification/descriptors/question-flow.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/question-flow.json). Los códigos se definen en [FXI](./fxi.md) y [FXE](./fxe.md).

## Cómo recorrer el flujo {#walking-the-flow}

1. Recorrer [las preguntas](#the-questions) en el orden en que aparecen. Hacer una pregunta solo cuando su condición **Se pregunta cuando** se cumple para las respuestas dadas hasta el momento; en caso contrario, omitirla.
2. Responder cada pregunta que se hace, y ninguna otra. **Elegir: una** admite una opción; **Elegir: una o varias** admite una lista, hasta el máximo indicado. Una opción marcada *Exclusiva* no puede combinarse con otra. Una opción con *Solo cuando* se aplica solo cuando se cumple su condición.
3. `usual` conserva el valor predeterminado publicado: la lectura de la palabra de movimiento cuando se eligió una palabra; en otro caso, el valor predeterminado de la capa en [FXI](./fxi.md#defaults) o el valor predeterminado de la máquina en [FXE](./fxe.md#procedure). Donde no hay valor predeterminado, `usual` no se ofrece.
4. `unknown` escribe `?`. Se responde solo cuando realmente no se sabe: `?` coincide con cualquier cosa, así que el ejercicio se distingue peor de sus vecinos.
5. Cada opción elegida en `changes` debe abrir una pregunta que luego se hace (véase [qué abre cada cambio](#what-each-change-opens)). Una elección que no abre nada no se aplica a este ejercicio; se elimina.
6. Ensamblar las cadenas con [las reglas de construcción](#from-answers-to-strings) y llevarlas a forma canónica.

**Responder lo que es cierto.** Describir el ejercicio tal como se realiza de verdad, no solo lo que dice su nombre. Una elevación lateral hecha sentado e inclinado hacia adelante se responde como sentado e inclinado hacia adelante. Si los clientes alternan los brazos repetición a repetición, se indica, aunque el nombre no lo diga. La forma habitual sigue siendo un valor: donde el ejercicio se hace de la forma habitual, se responde `usual`.

**Dejar fuera la prescripción.** El tempo, las pausas, la cantidad de carga, las series, las repeticiones, la altura del cajón y los pequeños cambios de ángulo no son preguntas aquí. No cambian el ejercicio.

## La palabra de movimiento {#the-movement-word}

La segunda pregunta pide la palabra de movimiento: "squat", "row". Una palabra fija a la vez la lectura habitual de todas las capas, así que la mayoría de los ejercicios necesita solo unas pocas respuestas después de ella. **Las palabras de movimiento no forman parte de este estándar.** Son datos de catálogo que un codificador carga desde un conjunto de datos de palabras de movimiento; una palabra cambia qué respuestas son las habituales, nunca lo que significa un código.

Sin un conjunto de datos, se responde `other` y se describe el movimiento articulación por articulación. Todo ejercicio puede codificarse así. La posición del cuerpo, la carga y los lados se preguntan entonces siempre.

Un conjunto de datos de palabras de movimiento da, para cada palabra:

- un identificador y una etiqueta y, opcionalmente, una nota "elegir esta, no aquella" para los casi sinónimos;
- las capas FXI que fija la palabra, como pares `layer:value`;
- el punto de sujeción habitual para cada token de implemento, con un respaldo para cualquier otro token, y el punto de sujeción de una barra cuando la carga pasa por detrás de la cabeza;
- la máquina que nombra la palabra, si la hay: su movimiento guiado, su interfaz de carga y si tiene una almohadilla de pecho;
- el tipo de máquina de cardio que nombra la palabra, si lo hay;
- si el ancho de agarre de la palabra se aplica solo a una barra a dos manos;
- las preguntas cerradas propias de la palabra, si las hay. Cada opción modifica las capas que fija la palabra (`layer:value`; `layer:-` elimina la capa). Son las preguntas `word.*`, que se hacen justo después de la del movimiento.

La palabra que eligió un propietario se conserva en el registro de respuestas. Nunca viaja en el FXI. Un resolvedor puede usarla como indicio para ordenar.

## Las preguntas de fase {#the-phase-questions}

Cuando el movimiento se describe articulación por articulación, `motion.phases` pregunta cuántos movimientos separados tiene una repetición, de uno a cinco. Las preguntas marcadas **Se repite** se hacen entonces para cada fase por turno: se lee `p1` como `p2`, `p3`, … y "fase 1" como el número de la fase, y la condición `motion.phases` es al menos 1 como al menos ese número. Las preguntas `p1b.*` describen una segunda parte de la misma fase, y se hacen solo cuando `p1.also` es `yes`.

Dentro de una fase, `p1.joints` elige las articulaciones que se mueven; a continuación se hace una pregunta de dirección por cada articulación elegida, en el orden fijo de articulaciones: cuello, tronco, escápulas, hombro, codo, antebrazo, muñeca, cadera, rodilla, tobillo.

## De las respuestas a las cadenas {#from-answers-to-strings}

Cada capa se construye a partir de sus respuestas como sigue, y luego toda la cadena se lleva a [forma canónica](./fxi.md#canonical-form). El valor de una palabra, más abajo, es el valor que fija la palabra de movimiento una vez aplicadas sus propias preguntas.

**`m`, movimiento.**

- Movimiento `unknown`: `m:?`.
- Descrito articulación por articulación: `motion.phases` `unknown` da `m:?`. En otro caso, cada fase es su primera parte y, cuando `p<n>.also` es `yes`, `|` y su segunda parte. Las fases se unen con `>`.
- Una parte cuyo tipo es `unknown` es `?`; `balance` es `=0`. En otro caso, es el prefijo del tipo (ninguno para una repetición normal) y luego sus acciones unidas con `+`: por cada articulación elegida, en el orden de articulaciones, el código que escribe cada dirección elegida (una dirección puede escribir dos acciones, como `sh.flex+sh.hadd`). Una dirección `unknown` escribe `<joint>.?`. Articulaciones `unknown` hacen que la parte sea `?`, o el prefijo y `?` para una parte de tipo conocido. Una articulación elegida en `p<n>.short` agrega `-` después de cada una de sus acciones; eso exige una dirección con nombre. Dos acciones opuestas en una misma parte son un error: se dividen en dos fases.
- A partir de una palabra: el movimiento de la palabra. Una respuesta a `motion.kind` sustituye el prefijo de una palabra de una sola fase.
- Una palabra cuyo movimiento tira hacia abajo desde arriba de la cabeza (`el.flex+sh.add`) escribe en su lugar `el.flex+sh.ext.oh` cuando el agarre, en su primera fase, es supino, neutro, estrecho o con las manos juntas (`su`, `ne`, `w-n`, `w-t`).

**`o`, orientación.** La respuesta a `orientation`, o la de la palabra. Un `orientation.end` distinto de `usual` hace que el valor sea `start>end`; el final debe diferir del inicio, y un inicio `*` no puede tener final.

**`k`, `f`.** Las respuestas a `end` y `footwork`, o las de la palabra.

**`s`, apoyo.** `usual` conserva el apoyo de la palabra, salvo que el apoyo de una palabra se descarta cuando la carga es una máquina que la palabra no nombra. `none` no escribe apoyo; `unknown` escribe `s:?`. En otro caso, cada apoyo (`sup1`, y `sup2` cuando `sup.more` es `yes`) es su token de superficie y luego `@` y sus puntos unidos con `,` cuando se eligió alguno. Los dos deben diferir. `floor@feet` junto a otro apoyo se descarta con el cuerpo sentado, o boca arriba sobre un apoyo que soporta su tronco.

**`l`, carga.** La primera carga es la respuesta a `load` (`implement` toma el token de `imp1`); la segunda, cuando `changes` incluye `extra`, es `imp2`. Luego, para cada una:

- peso corporal: `bw`; `unknown`: `?`;
- una máquina de fuerza: `mach@<point>`, donde el punto es `assist` para una máquina asistida y, en otro caso, el punto del cuerpo de la interfaz de carga de la máquina (`hand` es `hands`, `foot` `feet`, `ankle` `ankles`, `thigh` `thighs`, `knee` `knees`, `arm` `arms`, `shoulder` `shoulders`, `hip` `hips`; `chest`, `back`, `head` y `seat` son ellos mismos), o `?`;
- una máquina de cardio: `erg.<cycle>@<hold>` a partir del tipo de máquina de cardio, o `erg@?` cuando el tipo es desconocido;
- un implemento, un cable, una máquina Smith o un landmine: el token, un recuento opcional, `@` y la respuesta a `hold1` o `hold2`.

El recuento se aplica al primer implemento. Se escribe `*n` a partir de `count1` solo cuando `n` difiere del recuento habitual: uno para un implemento a dos manos, para cualquier cosa sostenida en el pecho, la espalda, las caderas o la cintura, y para cualquier cosa que no sea un implemento a una mano; para un implemento a una mano (`db`, `kb`, `plate`, `club`), uno cuando los brazos trabajan un lado cada vez y dos en otro caso. El segundo implemento debe diferir del primero, y necesita una primera carga conocida.

**La máquina.** Para un ejercicio cuya carga es una máquina de fuerza: la máquina de la palabra, o las respuestas `mac.*`. Su movimiento guiado es un código monoarticular, o el verbo (`push`, `pull`, `assist`) seguido de `.` y la respuesta a `mac.direction`. Su interfaz de carga es `mac.contact`, o el valor predeterminado para el movimiento guiado ([paso 3 de FXE](./fxe.md#procedure)). `mac.chest` indica si una almohadilla apoya el pecho.

**`x`, simetría.** `usual` conserva la de la palabra; `unknown` escribe `?`; `b` no escribe nada. `split` escribe `<code>@arms` y `<code>@legs` a partir de `symmetry.arms` y `symmetry.legs`, y omite una extremidad respondida como ambos lados a la vez. En otro caso, el código, con `@<scope>` cuando `symmetry.scope` nombra uno.

**`g`, agarre y postura de pies.** La orientación de las manos es `grip.hand`, o la de la palabra; `turn` crea dos fases a partir de `grip.start` y `grip.end`, que deben diferir. El ancho (`grip.width`) y la postura de pies (`stance`) provienen de sus respuestas o de la palabra. Un agarre ancho de la palabra que se aplica solo a una barra a dos manos se descarta cuando la primera carga no lo es, o cuando los brazos trabajan de uno en uno. Una respuesta de postura de pies solo se admite con un inicio de pie, cualquiera de los dos o desconocido, o con los pies en la plataforma de una máquina. Cada fase es su orientación de las manos, su ancho y su postura de pies unidos con `+`; con dos fases, una fase que de otro modo quedaría vacía es `w-m`.

**`r`, rango.** Las respuestas de profundidad (`range.depth`) y de inicio (`range.start`), cada una de las cuales sustituye el código de la palabra del mismo grupo; `full` no escribe nada.

**`h`, `p`, `a`.** Los códigos elegidos unidos con `+`, o los de la palabra. Dos posturas sostenidas marcadas como "nunca con" son un error; una línea admite como máximo uno de `hi`, `lo`, `side`.

**El FXE del registro** es el [equipamiento principal](./fxe.md#the-main-equipment-of-an-exercise) del FXI. Cuando es una máquina de fuerza, es `FXE=1.0S/k:mac/l:<interface>/s:<posture>/m:<motion>`, con la postura leída de la orientación inicial del FXI: sentado `seat` (`seat.chest` con almohadilla de pecho), de pie o de pie inclinado `stand` (`stand.chest`), cualquier inicio boca abajo `prone`, `supine` o `supine.decline` `supine`, `supine.incline` `recline`, de rodillas `kneel`, suspendido `hang`, de lado `side`, y en otro caso `?`. Una máquina de cardio escribe las cuatro capas de su tipo. Una banda escribe `band.<type>` a partir de `band.type`, o `band`.

**El equipamiento por sí solo.** `eq.kind` `none` es `k:none`; `unknown` es `k:?`. `imp`, `sup`, `acc` y `stn` escriben `k:<kind>/f:<form>`. Una máquina de cardio escribe las capas de su tipo. Una máquina de fuerza escribe `k:mac/l:<contact>/s:<posture>/m:<motion>`: los contactos unidos con `+`; un contacto y una postura `usual` toman los [valores predeterminados de FXE](./fxe.md#procedure). `eq.details` agrega las capas extendidas `r`, `c`, `g`, `a`, y `eq.more` una segunda configuración, unida con `;`. El `fxe` del registro es la forma estándar; la forma completa, con los detalles de construcción, es el registro de equipamiento.

## El registro de respuestas {#the-answers-record}

Un productor conserva, para cada ejercicio o pieza de equipamiento, las respuestas que construyeron sus cadenas, de modo que puedan [reconstruirse](./compare-and-match.md#provenance-match-and-versioning) bajo una revisión de reglas posterior:

```json fds:ignore an answers record in the working shape this page describes, which RFC-010 leaves open; it is not an FDS entity document
{
  "id": "barbell-back-squat",
  "answers": {
    "subject": "usual",
    "movement": "other",
    "changes": ["usual"],
    "motion.phases": "1",
    "p1.kind": "usual",
    "p1.joints": ["hip", "kn"],
    "p1.hip": ["ext"],
    "p1.kn": ["ext"],
    "p1.short": ["usual"],
    "p1.also": "usual",
    "orientation": "standing",
    "load": "implement",
    "imp1": "bb",
    "hold1": "back",
    "symmetry": "b"
  },
  "provenance": "owner",
  "gap": null
}
```

`answers` asigna a cada pregunta hecha la opción elegida, o una lista para una pregunta que admite varias. Un registro también puede llevar `notes`, el conjunto de datos de palabras de movimiento del que provino su palabra y, a partir de una comprobación dentro de la propia biblioteca del propietario, `sameAs` o `differs` (abajo).

**Dentro de una biblioteca.** Dos ejercicios distintos de una misma biblioteca no deben construir el mismo FXI. Cuando eso ocurre, el propietario lo resuelve: son el mismo ejercicio (`sameAs` nombra el otro registro); o una respuesta recoge la diferencia, lo que cambia la cadena; o la notación no puede expresarlo (`differs` nombra lo que difiere, y se convierte en el marcador de laguna del registro).

## Ejemplos resueltos {#worked-examples}

### Sentadilla trasera con barra {#barbell-back-squat}

Una barra apoyada sobre la parte alta de la espalda; de pie; las caderas y las rodillas se extienden a la vez. No se usa ninguna palabra de movimiento: el movimiento se describe articulación por articulación.

| Pregunta | Respuesta | Escribe |
|---|---|---|
| `subject` | `usual` | Un ejercicio. |
| `movement` | `other` | El movimiento se describe a continuación. |
| `changes` | `usual` | Nada más difiere de los valores predeterminados. |
| `motion.phases` | `1` | Un movimiento por repetición. |
| `p1.kind` | `usual` | Una repetición normal en movimiento: sin prefijo. |
| `p1.joints` | `hip`, `kn` | El tobillo solo acompaña; no cuenta. |
| `p1.hip` | `ext` | `hip.ext` |
| `p1.kn` | `ext` | `kn.ext` |
| `p1.short` | `usual` | Rango completo. |
| `p1.also` | `usual` | Una sola parte. |
| `orientation` | `standing` | `o:standing` |
| `load` | `implement` | |
| `imp1` | `bb` | `bb` |
| `hold1` | `back` | `@back` |
| `symmetry` | `b` | Nada: ambos lados a la vez es el valor predeterminado. |

Resultado: `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` y, como su equipamiento principal, `FXE=1.0S/k:imp/f:bar.straight`.

### Remo sentado en polea {#seated-cable-row}

En una máquina de remo sentado en polea con su propio asiento y su plataforma para los pies, tirando de una empuñadura en V hacia el tronco con las palmas enfrentadas.

| Pregunta | Respuesta | Escribe |
|---|---|---|
| `subject` | `usual` | Un ejercicio. |
| `movement` | `other` | |
| `changes` | `hand` | La orientación de las manos difiere del valor predeterminado. |
| `motion.phases` | `1` | |
| `p1.kind` | `usual` | |
| `p1.joints` | `el`, `sh` | |
| `p1.el` | `flex` | `el.flex` |
| `p1.sh` | `row-close` | `sh.ext` |
| `p1.short` | `usual` | |
| `p1.also` | `usual` | |
| `orientation` | `seated` | `o:seated` |
| `load` | `machine` | Una máquina dedicada: `mach`. |
| `mac.motion` | `pull` | |
| `mac.direction` | `back` | Movimiento guiado `pull.back`. |
| `mac.contact` | `hand` | Interfaz de carga `hand`, así que `mach@hands`. |
| `mac.chest` | `no` | Postura `seat`, a partir del inicio sentado. |
| `symmetry` | `b` | |
| `grip.hand` | `ne` | `g:ne`; el valor predeterminado para un remo sería prono. |

Resultado: `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` y `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back`.

El mismo remo con el agarre prono predeterminado es `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands`, y los dos se [contradicen](./compare-and-match.md#compare): el agarre forma parte del ejercicio.

### La máquina de remo sentado en polea {#the-seated-cable-row-machine}

La máquina por sí sola, como registro de equipamiento.

| Pregunta | Respuesta | Escribe |
|---|---|---|
| `subject` | `equipment` | |
| `eq.kind` | `mac` | `k:mac` |
| `eq.mac.motion` | `pull` | |
| `eq.mac.direction` | `back` | `m:pull.back` |
| `eq.mac.contact` | `hand` | `l:hand` |
| `eq.mac.posture` | `seat` | `s:seat`. Un remo sentado en polea con plataforma para los pies es `seat`, no `seat.chest`. |
| `eq.details` | `yes` | |
| `eq.drive` | `stack` | `r:stack` |
| `eq.constraint` | `cable` | `c:cable` |
| `eq.angle` | `usual` | No indicado. |
| `eq.attrs` | `usual` | Ninguno indicado. |
| `eq.more` | `usual` | Una sola configuración. |

Resultado: el estándar `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back`, que lleva cada registro de ejercicio sobre esta máquina, y el registro completo `FXE=1.0N/k:mac/l:hand/s:seat/m:pull.back/r:stack/c:cable`.

## Hechos que usan las condiciones {#facts-the-conditions-use}

Algunas condiciones nombran un hecho en lugar de una respuesta. Cada hecho se deduce de las respuestas dadas hasta el momento.

<!-- fds:generated flow#facts -->
| Hecho | Se cumple cuando |
|---|---|
| `exercise` | Se describe un ejercicio (la respuesta habitual a "subject"). |
| `equipment` | Se describe una pieza de equipamiento por sí sola. |
| `template` | El movimiento es una de las palabras de movimiento publicadas. |
| `motion-from-scratch` | El movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento. |
| `posture-has-usual` | La palabra de movimiento fija una postura. |
| `load-has-usual` | La palabra de movimiento fija la carga (peso corporal, un cable, una máquina, un implemento con nombre). |
| `load-holdable` | La primera carga es un implemento libre, un cable, una máquina Smith o un landmine. |
| `hold-has-usual` | Las reglas dan un punto de sujeción habitual para ese implemento en este movimiento. |
| `load-band` | Una banda es una de las cargas. |
| `load-machine` | La carga es una máquina de fuerza. |
| `load-cardio` | La carga es una máquina de cardio. |
| `machine-has-usual` | La palabra de movimiento fija qué máquina se usa. |
| `cardio-has-usual` | La palabra de movimiento fija qué máquina de cardio se usa. |
| `hold2-has-usual` | Las reglas dan un punto de sujeción habitual para el segundo implemento en este movimiento. |
| `machine-direction-has-usual` | La palabra de movimiento nombra una máquina multiarticular, así que se conoce su dirección. |
| `contact-has-usual` | La palabra de movimiento nombra la máquina, o las reglas dan un contacto predeterminado para el movimiento guiado. |
| `eq-contact-has-usual` | Las reglas dan un contacto predeterminado para el movimiento guiado del equipamiento. |
| `eq2-contact-has-usual` | Las reglas dan un contacto predeterminado para el movimiento guiado de la segunda configuración. |
| `single-phase-template` | La palabra de movimiento tiene una fase con acciones articulares, así que su tipo puede cambiar por sí solo. |
| `stance-recorded` | La posición del cuerpo al inicio es de pie, de pie inclinado hacia adelante, cualquiera de las dos o desconocida; o los pies empujan la plataforma de una máquina (prensa de piernas). |
| `word-asks` | La palabra de movimiento elegida lleva preguntas cerradas propias en el conjunto de datos de palabras de movimiento. |
<!-- /fds:generated -->

## Qué abre cada cambio {#what-each-change-opens}

<!-- fds:generated flow#changeOpens -->
| Opción de `changes` | Abre |
|---|---|
| `motion` | `motion.phases` |
| `kind` | `motion.kind` |
| `posture` | `orientation` |
| `end-posture` | `orientation.end` |
| `moving-end` | `end` |
| `footwork` | `footwork` |
| `support` | `support` |
| `equipment` | `load` |
| `hold` | `hold1` |
| `count` | `count1` |
| `extra` | `imp2` |
| `machine` | `mac.motion`, `erg.type` |
| `sides` | `symmetry` |
| `hand` | `grip.hand` |
| `width` | `grip.width` |
| `stance` | `stance` |
| `depth` | `range.depth` |
| `start` | `range.start` |
| `held` | `held` |
| `line` | `line` |
| `accessory` | `accessory` |
<!-- /fds:generated -->

## Las preguntas {#the-questions}

<!-- fds:generated flow#questions -->
#### `subject`: ¿Se describe un ejercicio o una pieza de equipamiento por sí sola? {#subject-are-you-describing-an-exercise-or-a-piece-of-equipment-on-its-own}

- **Completa:** FXI o FXE.
- **Elegir:** una.
- **Se pregunta cuando:** siempre.
- **Habitual:** Un ejercicio.

Un ejercicio recibe un FXI y el FXE de su equipamiento principal. El equipamiento por sí solo recibe un FXE de registro.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Un ejercicio (el caso habitual) | el valor predeterminado | Exclusiva. |
| `equipment` | Una pieza de equipamiento por sí sola |  |  |

#### `movement`: ¿Qué movimiento es? {#movement-which-movement-is-it}

- **Completa:** FXI m, y los valores predeterminados de todas las demás capas.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject").
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Opciones tomadas de:** el conjunto de datos de palabras de movimiento (no forma parte de la notación).

Elegir la palabra de movimiento que corresponde al ejercicio tal como se nombraría sin añadir nada. Las variaciones vienen después. Elegir "other" solo cuando ninguna palabra encaja. Las palabras de movimiento en sí no forman parte de la notación: el codificador las carga desde un conjunto de datos de palabras de movimiento.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `other` | Otra cosa: describir el movimiento articular paso a paso |  |  |
| `unknown` | No se sabe cómo se hace | `?` | Exclusiva. |

#### `word.*`: Las preguntas cerradas propias de la palabra de movimiento, si las tiene. {#word-the-movement-words-own-closed-questions-if-it-has-any}

- **Completa:** Las capas FXI que fija la palabra de movimiento.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y la palabra de movimiento elegida lleva preguntas cerradas propias en el conjunto de datos de palabras de movimiento.
- **Habitual:** La opción que significa la palabra de movimiento cuando no se dice nada más, donde el conjunto de datos da una.
- **Opciones tomadas de:** el conjunto de datos de palabras de movimiento (no forma parte de la notación).

Algunas palabras de movimiento llevan una o dos preguntas cerradas propias (si la rodilla está extendida o flexionada; qué extremidades se elevan). Cada opción modifica las capas que fija la palabra. Las preguntas, sus opciones y sus modificaciones vienen con el conjunto de datos de palabras de movimiento.

#### `changes`: ¿Qué difiere, si algo difiere, de la forma habitual de hacer este movimiento? {#changes-what-if-anything-is-different-from-the-usual-way-of-doing-this-movement}

- **Completa:** selecciona qué capas difieren de sus valores predeterminados.
- **Elegir:** una o varias.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject").
- **Habitual:** Nada difiere.

La forma habitual es lo que significa la palabra de movimiento sin añadir nada: "squat" es con ambos pies, sin postura sostenida y con rango completo. Elegir cada aspecto en el que el ejercicio, tal como se realiza de verdad, difiere, lo diga o no su nombre. Cada elección abre una pregunta. Para los movimientos "other" o "unknown", la posición del cuerpo, el equipamiento y los lados se preguntan de todos modos.

*Modo de importación:* las diferencias del cuerpo (movimiento, posición, trabajo de pies, apoyo, equipamiento) pueden provenir de la descripción; los lados, el agarre, la postura de pies, el rango, la postura sostenida y la línea de tracción provienen solo del nombre, del nombre alternativo y de los campos (la regla de la fuente).

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Nada: se hace de la forma habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `motion` | El propio movimiento articular (reconstruirlo articulación por articulación) |  |  |
| `kind` | El tipo de movimiento: explosivo con vuelo, continuo, una isometría, un estiramiento estático o dinámico |  |  |
| `posture` | La posición del cuerpo (de pie, sentado, tumbado, de rodillas, suspendido) |  |  |
| `end-posture` | La repetición termina en una posición del cuerpo distinta de la inicial (get-up) |  |  |
| `moving-end` | Qué extremo del cuerpo se mueve (el tronco o ambos extremos, como en un sit-up o un V-up) |  |  |
| `footwork` | El trabajo de pies: pasos, postura dividida, desplazamiento |  |  |
| `support` | Sobre qué se apoya el cuerpo, más allá del suelo |  |  |
| `equipment` | El equipamiento que carga los músculos |  |  |
| `hold` | Dónde se sostiene el implemento |  |  |
| `count` | Cuántos implementos |  |  |
| `extra` | Un segundo implemento |  |  |
| `machine` | Qué máquina (de fuerza o de cardio) |  |  |
| `sides` | Cómo trabajan los lados: un lado y luego el otro, alternos, recíprocos |  |  |
| `hand` | Orientación de las manos: prono, supino, neutro, mixto o un giro durante la repetición |  |  |
| `width` | Ancho de agarre |  |  |
| `stance` | Ancho de la postura de pies |  |  |
| `depth` | Rango: parcial, más profundo de lo habitual o desde un déficit |  |  |
| `start` | Dónde empieza cada repetición: el suelo, colgado, soportes o bloques |  |  |
| `held` | Una postura sostenida de extremidades que no trabajan: manos detrás de la cabeza, brazos cruzados, pierna libre al frente |  |  |
| `line` | La línea de tracción: cable o banda anclados alto o bajo, desde el costado, o la carga que pasa por detrás de la cabeza |  |  |
| `accessory` | Un accesorio que ayuda sin cargar: una correa, una toalla o una cuerda que tira de una extremidad, o un compañero |  |  |

#### `motion.kind`: ¿Qué tipo de movimiento es? {#motionkind-what-kind-of-motion-is-it}

- **Completa:** FXI m (prefijo).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y el movimiento es una de las palabras de movimiento publicadas; y no (el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento); y `changes` incluye `kind`.
- **Habitual:** El tipo que da la palabra de movimiento.

Solo para palabras de movimiento de una sola fase. Cambiar el tipo conserva las articulaciones que da la palabra de movimiento.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Como dice la palabra de movimiento (la forma habitual) | el valor predeterminado | Exclusiva. |
| `normal` | Una repetición normal en movimiento: las articulaciones recorren su rango contra la carga | (sin prefijo) | Solo cuando la palabra de movimiento tiene una fase con acciones articulares, así que su tipo puede cambiar por sí solo. |
| `ballistic` | Termina en vuelo o lanzamiento: el cuerpo deja el suelo o el implemento sale de las manos (salto, salto a una pierna, lanzamiento, slam, palmada) | `^` | Solo cuando la palabra de movimiento tiene una fase con acciones articulares, así que su tipo puede cambiar por sí solo. |
| `cyclic` | Ciclos continuos sin límite entre repeticiones, contados por tiempo o distancia (correr, remar, círculos) | `~` | Solo cuando la palabra de movimiento tiene una fase con acciones articulares, así que su tipo puede cambiar por sí solo. |
| `hold` | Inmóvil bajo esfuerzo durante toda la serie (plancha, sentadilla isométrica en pared); la respuesta de articulaciones es hacia dónde empujan los músculos | `=` | Solo cuando la palabra de movimiento tiene una fase con acciones articulares, así que su tipo puede cambiar por sí solo. |
| `static-stretch` | Un estiramiento estático: las articulaciones se llevan al final del rango y se mantienen | `%` | Solo cuando la palabra de movimiento tiene una fase con acciones articulares, así que su tipo puede cambiar por sí solo. |
| `dynamic-stretch` | Un estiramiento dinámico: se lleva al final del rango y se suelta, una y otra vez (balanceos de pierna, pass-throughs) | `&` | Solo cuando la palabra de movimiento tiene una fase con acciones articulares, así que su tipo puede cambiar por sí solo. |

#### `motion.phases`: ¿Cuántos movimientos separados tiene una repetición? {#motionphases-how-many-separate-movements-does-one-rep-have}

- **Completa:** FXI m (fases ">").
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Hacer una pregunta cerrada por cada par de movimientos: ¿empieza el segundo antes de que termine el primero? Sí: una fase (un thruster: el press empieza mientras todavía se sube). No: dos fases (sentadilla, ponerse de pie y luego press; una flexión de brazos y luego un empuje de escápulas). No contar nunca el descenso ni el retorno.

*Modo de importación:* Modo de importación, texto sin indicación: dos palabras de movimiento en un mismo nombre son dos fases en el orden del nombre, salvo que el nombre sea una palabra de una sola fase (thruster).

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `1` | Uno |  |  |
| `2` | Dos |  |  |
| `3` | Tres |  |  |
| `4` | Cuatro |  |  |
| `5` | Cinco |  |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `p1.kind`: ¿Qué tipo de movimiento es la fase 1? {#p1kind-what-kind-of-movement-is-phase-1}

- **Completa:** FXI m (prefijo).
- **Elegir:** una.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1.
- **Habitual:** Una repetición normal en movimiento.
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Elegir cómo se mueven las articulaciones. "Explosivo" o "rápido" por sí solos son una repetición normal: lo balístico exige vuelo o lanzamiento. Un slam es balístico solo cuando el implemento sale de las manos: un slam con cuerda de batalla es una repetición normal.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Una repetición normal en movimiento (la forma habitual) | el valor predeterminado | Exclusiva. |
| `ballistic` | Termina en vuelo o lanzamiento: el cuerpo deja el suelo o el implemento sale de las manos (salto, salto a una pierna, lanzamiento, slam, palmada) | `^` |  |
| `cyclic` | Ciclos continuos sin límite entre repeticiones, contados por tiempo o distancia (correr, remar, círculos) | `~` |  |
| `hold` | Inmóvil bajo esfuerzo durante toda la serie (plancha, sentadilla isométrica en pared); la respuesta de articulaciones es hacia dónde empujan los músculos | `=` |  |
| `balance` | Un mantenimiento de equilibrio sin dirección (apoyo sobre una pierna) | `=0` |  |
| `static-stretch` | Un estiramiento estático: las articulaciones se llevan al final del rango y se mantienen | `%` |  |
| `dynamic-stretch` | Un estiramiento dinámico: se lleva al final del rango y se suelta, una y otra vez (balanceos de pierna, pass-throughs) | `&` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `p1.joints`: ¿Qué articulaciones se mueven en la fase 1? {#p1joints-which-joints-move-in-phase-1}

- **Completa:** FXI m (articulaciones).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`).
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Contar una articulación solo cuando los músculos que trabajan la mueven a lo largo de un rango claro (unos 30° o más) como parte de lo que entrena el ejercicio. No contar nunca una articulación que se mantiene quieta a propósito: la rodilla en un peso muerto rumano o un hip thrust, el codo en una apertura o una elevación lateral, la columna salvo que flexionar o girar el tronco sea el ejercicio, el tobillo salvo que el ejercicio suba a las puntas de los pies o se impulse.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `nk` | Cuello |  |  |
| `sp` | Tronco (columna) |  |  |
| `sc` | Escápulas, que se mueven por sí solas |  |  |
| `sh` | Hombro (se juzga por la trayectoria de las manos respecto al tronco) |  |  |
| `el` | Codo |  |  |
| `fa` | Antebrazo que gira contra resistencia |  |  |
| `wr` | Muñeca |  |  |
| `hip` | Cadera |  |  |
| `kn` | Rodilla |  |  |
| `ank` | Tobillo |  |  |
| `unknown` | Se mueven algunas articulaciones, no se sabe cuáles | `?` | Exclusiva. |

#### `p1.nk`: Fase 1: ¿hacia dónde se mueve el cuello? {#p1nk-phase-1-which-way-does-the-neck-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`); y `p1.joints` incluye `nk`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Barbilla hacia el pecho | `nk.flex` |  |
| `ext` | La cabeza se inclina hacia atrás | `nk.ext` |  |
| `lflex` | Oreja hacia el hombro | `nk.lflex` |  |
| `rot` | La cabeza gira | `nk.rot` |  |
| `circ` | Círculos | `nk.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1.sp`: Fase 1: ¿hacia dónde se mueve el tronco? {#p1sp-phase-1-which-way-does-the-trunk-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`); y `p1.joints` incluye `sp`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Se flexiona hacia adelante, costillas hacia la pelvis (crunch) | `sp.flex` |  |
| `ext` | Se extiende o se arquea hacia atrás (extensión de espalda) | `sp.ext` |  |
| `lflex` | Se flexiona lateralmente (flexión lateral) | `sp.lflex` |  |
| `rot` | Gira, los hombros contra las caderas (leñador) | `sp.rot` |  |
| `circ` | Círculos | `sp.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1.sc`: Fase 1: ¿hacia dónde se mueven las escápulas? {#p1sc-phase-1-which-way-do-the-shoulder-blades-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`); y `p1.joints` incluye `sc`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `elev` | Se elevan (encogimiento) | `sc.elev` |  |
| `dep` | Descienden | `sc.dep` |  |
| `pro` | Se separan alrededor de las costillas (flexión escapular) | `sc.pro` |  |
| `ret` | Se juntan | `sc.ret` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1.sh`: Fase 1: ¿hacia dónde se mueve el hombro? {#p1sh-phase-1-which-way-does-the-shoulder-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`); y `p1.joints` incluye `sh`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `away-square` | Lejos del pecho, perpendicular al tronco; o juntándose por delante a la altura del pecho (press de banca, flexión de brazos, press de pecho, apertura) | `sh.hadd` |  |
| `away-headward` | Lejos del pecho hacia el lado de la cabeza (press inclinado, flexión de brazos con pies elevados, apertura inclinada) | `sh.flex+sh.hadd` |  |
| `up-overhead` | Hacia adelante y arriba, o hacia arriba por encima de la cabeza (elevación frontal, press por encima de la cabeza, flexión de brazos en pica) | `sh.flex` |  |
| `away-footward` | Lejos del pecho hacia el lado de los pies (press declinado, flexión de brazos con manos elevadas, apertura de alto a bajo) | `sh.ext+sh.hadd` |  |
| `down-along` | Hacia abajo a lo largo del tronco hacia los pies (fondo, empuje hacia abajo con brazos extendidos) | `sh.ext` |  |
| `row-close` | Hacia el tronco desde el frente, codos pegados (remo) | `sh.ext` |  |
| `row-wide` | Hacia el tronco desde el frente, codos abiertos a la altura de los hombros (remo para deltoides posterior, face pull) | `sh.habd` |  |
| `apart` | Separándose lateralmente a la altura del pecho, brazos casi extendidos (apertura invertida, pull-apart) | `sh.habd` |  |
| `pull-front` | Hacia abajo desde arriba de la cabeza por delante de la cara (dominada supina; cualquier dominada o jalón con agarre supino, neutro o estrecho; jalón con brazos extendidos, pullover, slam) | `sh.ext.oh` |  |
| `pull-side` | Hacia abajo desde arriba de la cabeza por los costados (dominada o jalón con agarre prono de ancho medio o amplio) | `sh.add` |  |
| `up-side` | Hacia arriba por el costado (elevación lateral, remo al mentón) | `sh.abd` |  |
| `rot-in` | Rota hacia adentro: el antebrazo gira hacia el vientre, codo flexionado | `sh.ir` |  |
| `rot-out` | Rota hacia afuera: el antebrazo gira alejándose, codo flexionado | `sh.er` |  |
| `circ` | Círculos | `sh.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1.el`: Fase 1: ¿hacia dónde se mueve el codo? {#p1el-phase-1-which-way-does-the-elbow-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`); y `p1.joints` incluye `el`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Se flexiona (curl) | `el.flex` |  |
| `ext` | Se extiende (press, extensión de tríceps) | `el.ext` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1.fa`: Fase 1: ¿hacia dónde gira el antebrazo contra resistencia? {#p1fa-phase-1-which-way-does-the-forearm-turning-against-resistance-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`); y `p1.joints` incluye `fa`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `pron` | La palma gira hacia abajo | `fa.pron` |  |
| `sup` | La palma gira hacia arriba | `fa.sup` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1.wr`: Fase 1: ¿hacia dónde se mueve la muñeca? {#p1wr-phase-1-which-way-does-the-wrist-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`); y `p1.joints` incluye `wr`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Palma hacia el antebrazo (curl de muñeca) | `wr.flex` |  |
| `ext` | Dorso de la mano hacia el antebrazo | `wr.ext` |  |
| `rdev` | Lado del pulgar hacia el antebrazo | `wr.rdev` |  |
| `udev` | Lado del meñique hacia el antebrazo | `wr.udev` |  |
| `circ` | Círculos | `wr.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1.hip`: Fase 1: ¿hacia dónde se mueve la cadera? {#p1hip-phase-1-which-way-does-the-hip-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`); y `p1.joints` incluye `hip`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Muslo hacia el tronco, o tronco hacia el muslo | `hip.flex` |  |
| `ext` | Muslo alejándose del tronco (al ponerse de pie desde una sentadilla) | `hip.ext` |  |
| `abd` | Pierna hacia el costado | `hip.abd` |  |
| `add` | Pierna hacia la otra pierna | `hip.add` |  |
| `ir` | La rodilla gira hacia adentro | `hip.ir` |  |
| `er` | La rodilla gira hacia afuera | `hip.er` |  |
| `circ` | Círculos | `hip.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1.kn`: Fase 1: ¿hacia dónde se mueve la rodilla? {#p1kn-phase-1-which-way-does-the-knee-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`); y `p1.joints` incluye `kn`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Se flexiona contra resistencia (curl de piernas) | `kn.flex` |  |
| `ext` | Se extiende (al ponerse de pie desde una sentadilla) | `kn.ext` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1.ank`: Fase 1: ¿hacia dónde se mueve el tobillo? {#p1ank-phase-1-which-way-does-the-ankle-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `balance` o `unknown`); y `p1.joints` incluye `ank`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `pf` | Sube a las puntas de los pies o se impulsa | `ank.pf` |  |
| `df` | Punta del pie hacia la espinilla | `ank.df` |  |
| `inv` | La planta gira hacia adentro | `ank.inv` |  |
| `ev` | La planta gira hacia afuera | `ank.ev` |  |
| `circ` | Círculos | `ank.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1.short`: En la fase 1, ¿alguna articulación recorre a propósito solo un rango corto? {#p1short-in-phase-1-does-any-joint-move-through-only-a-short-range-on-purpose}

- **Completa:** FXI m (impulso corto "-").
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.kind` es `usual`.
- **Habitual:** No: cada articulación recorre su rango completo.
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Solo el dip-and-drive de un push press o un jerk, o la breve subida tras una recepción en power. El rango parcial durante todo el ejercicio es una pregunta aparte.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No (la forma habitual) | el valor predeterminado | Exclusiva. |
| `nk` | Cuello |  | Solo cuando `p1.joints` incluye `nk`. |
| `sp` | Tronco (columna) |  | Solo cuando `p1.joints` incluye `sp`. |
| `sc` | Escápulas, que se mueven por sí solas |  | Solo cuando `p1.joints` incluye `sc`. |
| `sh` | Hombro (se juzga por la trayectoria de las manos respecto al tronco) |  | Solo cuando `p1.joints` incluye `sh`. |
| `el` | Codo |  | Solo cuando `p1.joints` incluye `el`. |
| `fa` | Antebrazo que gira contra resistencia |  | Solo cuando `p1.joints` incluye `fa`. |
| `wr` | Muñeca |  | Solo cuando `p1.joints` incluye `wr`. |
| `hip` | Cadera |  | Solo cuando `p1.joints` incluye `hip`. |
| `kn` | Rodilla |  | Solo cuando `p1.joints` incluye `kn`. |
| `ank` | Tobillo |  | Solo cuando `p1.joints` incluye `ank`. |

#### `p1.also`: En la fase 1, ¿otra parte del cuerpo hace al mismo tiempo algo de otro tipo, o se mueve en sentido opuesto? {#p1also-in-phase-1-does-another-part-of-the-body-do-something-of-a-different-kind-at-the-same-time-or-move-the-opposite-way}

- **Completa:** FXI m (partes simultáneas "\|").
- **Elegir:** una.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y no (`p1.kind` es `unknown`).
- **Habitual:** No.
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Ejemplo: los brazos mantienen quietas las empuñaduras del trineo mientras las piernas caminan, o el tronco mantiene una plancha mientras una pierna se eleva. Responder también sí cuando dos extremidades se llevan a la vez en direcciones opuestas (estiramiento del corredor: la cadera de atrás en extensión, la de adelante en flexión). Dos extremidades que hacen lo mismo son una sola parte.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No (la forma habitual) | el valor predeterminado | Exclusiva. |
| `yes` | Sí |  |  |

#### `p1b.kind`: ¿Qué tipo de movimiento es la segunda parte de la fase 1? {#p1bkind-what-kind-of-movement-is-the-second-part-of-phase-1}

- **Completa:** FXI m (prefijo).
- **Elegir:** una.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`.
- **Habitual:** Una repetición normal en movimiento.
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Elegir cómo se mueven las articulaciones. "Explosivo" o "rápido" por sí solos son una repetición normal: lo balístico exige vuelo o lanzamiento. Un slam es balístico solo cuando el implemento sale de las manos: un slam con cuerda de batalla es una repetición normal.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Una repetición normal en movimiento (la forma habitual) | el valor predeterminado | Exclusiva. |
| `ballistic` | Termina en vuelo o lanzamiento: el cuerpo deja el suelo o el implemento sale de las manos (salto, salto a una pierna, lanzamiento, slam, palmada) | `^` |  |
| `cyclic` | Ciclos continuos sin límite entre repeticiones, contados por tiempo o distancia (correr, remar, círculos) | `~` |  |
| `hold` | Inmóvil bajo esfuerzo durante toda la serie (plancha, sentadilla isométrica en pared); la respuesta de articulaciones es hacia dónde empujan los músculos | `=` |  |
| `balance` | Un mantenimiento de equilibrio sin dirección (apoyo sobre una pierna) | `=0` |  |
| `static-stretch` | Un estiramiento estático: las articulaciones se llevan al final del rango y se mantienen | `%` |  |
| `dynamic-stretch` | Un estiramiento dinámico: se lleva al final del rango y se suelta, una y otra vez (balanceos de pierna, pass-throughs) | `&` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `p1b.joints`: ¿Qué articulaciones se mueven en la segunda parte de la fase 1? {#p1bjoints-which-joints-move-in-the-second-part-of-phase-1}

- **Completa:** FXI m (articulaciones).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`).
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Contar una articulación solo cuando los músculos que trabajan la mueven a lo largo de un rango claro (unos 30° o más) como parte de lo que entrena el ejercicio. No contar nunca una articulación que se mantiene quieta a propósito: la rodilla en un peso muerto rumano o un hip thrust, el codo en una apertura o una elevación lateral, la columna salvo que flexionar o girar el tronco sea el ejercicio, el tobillo salvo que el ejercicio suba a las puntas de los pies o se impulse.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `nk` | Cuello |  |  |
| `sp` | Tronco (columna) |  |  |
| `sc` | Escápulas, que se mueven por sí solas |  |  |
| `sh` | Hombro (se juzga por la trayectoria de las manos respecto al tronco) |  |  |
| `el` | Codo |  |  |
| `fa` | Antebrazo que gira contra resistencia |  |  |
| `wr` | Muñeca |  |  |
| `hip` | Cadera |  |  |
| `kn` | Rodilla |  |  |
| `ank` | Tobillo |  |  |
| `unknown` | Se mueven algunas articulaciones, no se sabe cuáles | `?` | Exclusiva. |

#### `p1b.nk`: Segunda parte de la fase 1: ¿hacia dónde se mueve el cuello? {#p1bnk-the-second-part-of-phase-1-which-way-does-the-neck-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`); y `p1b.joints` incluye `nk`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Barbilla hacia el pecho | `nk.flex` |  |
| `ext` | La cabeza se inclina hacia atrás | `nk.ext` |  |
| `lflex` | Oreja hacia el hombro | `nk.lflex` |  |
| `rot` | La cabeza gira | `nk.rot` |  |
| `circ` | Círculos | `nk.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1b.sp`: Segunda parte de la fase 1: ¿hacia dónde se mueve el tronco? {#p1bsp-the-second-part-of-phase-1-which-way-does-the-trunk-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`); y `p1b.joints` incluye `sp`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Se flexiona hacia adelante, costillas hacia la pelvis (crunch) | `sp.flex` |  |
| `ext` | Se extiende o se arquea hacia atrás (extensión de espalda) | `sp.ext` |  |
| `lflex` | Se flexiona lateralmente (flexión lateral) | `sp.lflex` |  |
| `rot` | Gira, los hombros contra las caderas (leñador) | `sp.rot` |  |
| `circ` | Círculos | `sp.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1b.sc`: Segunda parte de la fase 1: ¿hacia dónde se mueven las escápulas? {#p1bsc-the-second-part-of-phase-1-which-way-do-the-shoulder-blades-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`); y `p1b.joints` incluye `sc`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `elev` | Se elevan (encogimiento) | `sc.elev` |  |
| `dep` | Descienden | `sc.dep` |  |
| `pro` | Se separan alrededor de las costillas (flexión escapular) | `sc.pro` |  |
| `ret` | Se juntan | `sc.ret` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1b.sh`: Segunda parte de la fase 1: ¿hacia dónde se mueve el hombro? {#p1bsh-the-second-part-of-phase-1-which-way-does-the-shoulder-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`); y `p1b.joints` incluye `sh`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `away-square` | Lejos del pecho, perpendicular al tronco; o juntándose por delante a la altura del pecho (press de banca, flexión de brazos, press de pecho, apertura) | `sh.hadd` |  |
| `away-headward` | Lejos del pecho hacia el lado de la cabeza (press inclinado, flexión de brazos con pies elevados, apertura inclinada) | `sh.flex+sh.hadd` |  |
| `up-overhead` | Hacia adelante y arriba, o hacia arriba por encima de la cabeza (elevación frontal, press por encima de la cabeza, flexión de brazos en pica) | `sh.flex` |  |
| `away-footward` | Lejos del pecho hacia el lado de los pies (press declinado, flexión de brazos con manos elevadas, apertura de alto a bajo) | `sh.ext+sh.hadd` |  |
| `down-along` | Hacia abajo a lo largo del tronco hacia los pies (fondo, empuje hacia abajo con brazos extendidos) | `sh.ext` |  |
| `row-close` | Hacia el tronco desde el frente, codos pegados (remo) | `sh.ext` |  |
| `row-wide` | Hacia el tronco desde el frente, codos abiertos a la altura de los hombros (remo para deltoides posterior, face pull) | `sh.habd` |  |
| `apart` | Separándose lateralmente a la altura del pecho, brazos casi extendidos (apertura invertida, pull-apart) | `sh.habd` |  |
| `pull-front` | Hacia abajo desde arriba de la cabeza por delante de la cara (dominada supina; cualquier dominada o jalón con agarre supino, neutro o estrecho; jalón con brazos extendidos, pullover, slam) | `sh.ext.oh` |  |
| `pull-side` | Hacia abajo desde arriba de la cabeza por los costados (dominada o jalón con agarre prono de ancho medio o amplio) | `sh.add` |  |
| `up-side` | Hacia arriba por el costado (elevación lateral, remo al mentón) | `sh.abd` |  |
| `rot-in` | Rota hacia adentro: el antebrazo gira hacia el vientre, codo flexionado | `sh.ir` |  |
| `rot-out` | Rota hacia afuera: el antebrazo gira alejándose, codo flexionado | `sh.er` |  |
| `circ` | Círculos | `sh.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1b.el`: Segunda parte de la fase 1: ¿hacia dónde se mueve el codo? {#p1bel-the-second-part-of-phase-1-which-way-does-the-elbow-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`); y `p1b.joints` incluye `el`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Se flexiona (curl) | `el.flex` |  |
| `ext` | Se extiende (press, extensión de tríceps) | `el.ext` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1b.fa`: Segunda parte de la fase 1: ¿hacia dónde gira el antebrazo contra resistencia? {#p1bfa-the-second-part-of-phase-1-which-way-does-the-forearm-turning-against-resistance-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`); y `p1b.joints` incluye `fa`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `pron` | La palma gira hacia abajo | `fa.pron` |  |
| `sup` | La palma gira hacia arriba | `fa.sup` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1b.wr`: Segunda parte de la fase 1: ¿hacia dónde se mueve la muñeca? {#p1bwr-the-second-part-of-phase-1-which-way-does-the-wrist-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`); y `p1b.joints` incluye `wr`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Palma hacia el antebrazo (curl de muñeca) | `wr.flex` |  |
| `ext` | Dorso de la mano hacia el antebrazo | `wr.ext` |  |
| `rdev` | Lado del pulgar hacia el antebrazo | `wr.rdev` |  |
| `udev` | Lado del meñique hacia el antebrazo | `wr.udev` |  |
| `circ` | Círculos | `wr.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1b.hip`: Segunda parte de la fase 1: ¿hacia dónde se mueve la cadera? {#p1bhip-the-second-part-of-phase-1-which-way-does-the-hip-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`); y `p1b.joints` incluye `hip`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Muslo hacia el tronco, o tronco hacia el muslo | `hip.flex` |  |
| `ext` | Muslo alejándose del tronco (al ponerse de pie desde una sentadilla) | `hip.ext` |  |
| `abd` | Pierna hacia el costado | `hip.abd` |  |
| `add` | Pierna hacia la otra pierna | `hip.add` |  |
| `ir` | La rodilla gira hacia adentro | `hip.ir` |  |
| `er` | La rodilla gira hacia afuera | `hip.er` |  |
| `circ` | Círculos | `hip.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1b.kn`: Segunda parte de la fase 1: ¿hacia dónde se mueve la rodilla? {#p1bkn-the-second-part-of-phase-1-which-way-does-the-knee-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`); y `p1b.joints` incluye `kn`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `flex` | Se flexiona contra resistencia (curl de piernas) | `kn.flex` |  |
| `ext` | Se extiende (al ponerse de pie desde una sentadilla) | `kn.ext` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1b.ank`: Segunda parte de la fase 1: ¿hacia dónde se mueve el tobillo? {#p1bank-the-second-part-of-phase-1-which-way-does-the-ankle-move}

- **Completa:** FXI m (acciones articulares).
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y no (`p1b.kind` es `balance` o `unknown`); y `p1b.joints` incluye `ank`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Para una repetición en movimiento, responder según la dirección de trabajo: hacia dónde se mueve la articulación mientras los músculos que trabajan se acortan contra la carga. Nunca el descenso ni el retorno. Para una isometría, responder hacia dónde empujan los músculos. Para un estiramiento, la dirección hacia la que se lleva la articulación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `pf` | Sube a las puntas de los pies o se impulsa | `ank.pf` |  |
| `df` | Punta del pie hacia la espinilla | `ank.df` |  |
| `inv` | La planta gira hacia adentro | `ank.inv` |  |
| `ev` | La planta gira hacia afuera | `ank.ev` |  |
| `circ` | Círculos | `ank.circ` |  |
| `unknown` | Se mueve, dirección desconocida | `?` | Exclusiva. |

#### `p1b.short`: En la segunda parte de la fase 1, ¿alguna articulación recorre a propósito solo un rango corto? {#p1bshort-in-the-second-part-of-phase-1-does-any-joint-move-through-only-a-short-range-on-purpose}

- **Completa:** FXI m (impulso corto "-").
- **Elegir:** una o varias.
- **Se pregunta cuando:** el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento; y `motion.phases` es al menos 1; y `p1.also` es `yes`; y `p1b.kind` es `usual`.
- **Habitual:** No: cada articulación recorre su rango completo.
- **Se repite** en cada fase: véase [las preguntas de fase](#the-phase-questions).

Solo el dip-and-drive de un push press o un jerk, o la breve subida tras una recepción en power. El rango parcial durante todo el ejercicio es una pregunta aparte.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No (la forma habitual) | el valor predeterminado | Exclusiva. |
| `nk` | Cuello |  | Solo cuando `p1b.joints` incluye `nk`. |
| `sp` | Tronco (columna) |  | Solo cuando `p1b.joints` incluye `sp`. |
| `sc` | Escápulas, que se mueven por sí solas |  | Solo cuando `p1b.joints` incluye `sc`. |
| `sh` | Hombro (se juzga por la trayectoria de las manos respecto al tronco) |  | Solo cuando `p1b.joints` incluye `sh`. |
| `el` | Codo |  | Solo cuando `p1b.joints` incluye `el`. |
| `fa` | Antebrazo que gira contra resistencia |  | Solo cuando `p1b.joints` incluye `fa`. |
| `wr` | Muñeca |  | Solo cuando `p1b.joints` incluye `wr`. |
| `hip` | Cadera |  | Solo cuando `p1b.joints` incluye `hip`. |
| `kn` | Rodilla |  | Solo cuando `p1b.joints` incluye `kn`. |
| `ank` | Tobillo |  | Solo cuando `p1b.joints` incluye `ank`. |

#### `orientation`: ¿Cuál es la posición del cuerpo al inicio de la repetición? {#orientation-what-is-the-body-position-at-the-start-of-the-rep}

- **Completa:** FXI o.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y o bien no (la palabra de movimiento fija una postura), o bien `changes` incluye `posture`.
- **Habitual:** La posición que fija la palabra de movimiento.

Plano significa a unos 15° o menos de la horizontal; inclinado y declinado, entre 15 y 60°. Inclinado hacia adelante desde la cadera y mantenido así (remo inclinado) es "de pie, inclinado". En cuatro apoyos, en plancha o en flexión de brazos es "boca abajo". Decide el tronco: de rodillas con el tronco plegado hacia adelante sobre los muslos (postura del niño) es "boca abajo"; "de rodillas" tiene el tronco erguido. En una máquina, se usa la posición del cuerpo.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La posición habitual para este movimiento | el valor predeterminado | Exclusiva. Solo cuando la palabra de movimiento fija una postura. |
| `standing` | De pie, tronco a unos 30° o menos de la vertical. | `standing` |  |
| `standing.bent` | De pie, tronco inclinado hacia adelante más de unos 30° y mantenido así (remo inclinado). | `standing.bent` |  |
| `seated` | Sentado, tronco a más de 60° de la horizontal. | `seated` |  |
| `seated.bent` | Sentado, tronco inclinado hacia adelante sobre los muslos y mantenido así (elevación inclinada sentado). | `seated.bent` |  |
| `kneeling` | Sobre ambas rodillas, tronco erguido. En cuatro apoyos es `prone`. | `kneeling` |  |
| `kneeling.half` | Sobre una rodilla, el otro pie adelante. | `kneeling.half` |  |
| `supine` | Boca arriba, tronco a 15° o menos de la horizontal. | `supine` |  |
| `supine.incline` | Boca arriba, cabeza más alta que las caderas, tronco a 15–60° de la horizontal. | `supine.incline` |  |
| `supine.decline` | Boca arriba, cabeza más baja que las caderas, tronco a 15–60° de la horizontal. | `supine.decline` |  |
| `prone` | Boca abajo, tronco a 15° o menos de la horizontal: tumbado, plancha, flexión de brazos, en cuatro apoyos. | `prone` |  |
| `prone.incline` | Boca abajo, cabeza más alta que las caderas, 15–60° (manos elevadas). | `prone.incline` |  |
| `prone.decline` | Boca abajo, cabeza más baja que las caderas, 15–60° (pies elevados). | `prone.decline` |  |
| `prone.pike` | Boca abajo, caderas en el punto más alto, manos y pies abajo, tronco a más de 60° con la cabeza hacia abajo (pica). | `prone.pike` |  |
| `side-lying` | De lado: tumbado, o en plancha lateral. | `side-lying` |  |
| `hanging` | Sostenido por las manos o los brazos, pies sin tocar el suelo: colgado de una barra, apoyado en barras de fondos. | `hanging` |  |
| `inverted` | Invertido, tronco a 30° o menos de la vertical, cabeza en el punto más bajo: parada de manos, parada de cabeza. | `inverted` |  |
| `either` | De cualquiera de las dos formas, a propósito ("sentado o de pie") | `*` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `orientation.end`: ¿En qué posición termina la repetición? {#orientationend-in-what-position-does-the-rep-end}

- **Completa:** FXI o (inicio>final).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `end-posture`.
- **Habitual:** Donde empezó.

Solo cuando la repetición termina en otro sitio, como un get-up. Una repetición que baja y vuelve (burpee) termina donde empezó.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Donde empezó (la forma habitual) | el valor predeterminado | Exclusiva. |
| `standing` | De pie, tronco a unos 30° o menos de la vertical. | `standing` |  |
| `standing.bent` | De pie, tronco inclinado hacia adelante más de unos 30° y mantenido así (remo inclinado). | `standing.bent` |  |
| `seated` | Sentado, tronco a más de 60° de la horizontal. | `seated` |  |
| `seated.bent` | Sentado, tronco inclinado hacia adelante sobre los muslos y mantenido así (elevación inclinada sentado). | `seated.bent` |  |
| `kneeling` | Sobre ambas rodillas, tronco erguido. En cuatro apoyos es `prone`. | `kneeling` |  |
| `kneeling.half` | Sobre una rodilla, el otro pie adelante. | `kneeling.half` |  |
| `supine` | Boca arriba, tronco a 15° o menos de la horizontal. | `supine` |  |
| `supine.incline` | Boca arriba, cabeza más alta que las caderas, tronco a 15–60° de la horizontal. | `supine.incline` |  |
| `supine.decline` | Boca arriba, cabeza más baja que las caderas, tronco a 15–60° de la horizontal. | `supine.decline` |  |
| `prone` | Boca abajo, tronco a 15° o menos de la horizontal: tumbado, plancha, flexión de brazos, en cuatro apoyos. | `prone` |  |
| `prone.incline` | Boca abajo, cabeza más alta que las caderas, 15–60° (manos elevadas). | `prone.incline` |  |
| `prone.decline` | Boca abajo, cabeza más baja que las caderas, 15–60° (pies elevados). | `prone.decline` |  |
| `prone.pike` | Boca abajo, caderas en el punto más alto, manos y pies abajo, tronco a más de 60° con la cabeza hacia abajo (pica). | `prone.pike` |  |
| `side-lying` | De lado: tumbado, o en plancha lateral. | `side-lying` |  |
| `hanging` | Sostenido por las manos o los brazos, pies sin tocar el suelo: colgado de una barra, apoyado en barras de fondos. | `hanging` |  |
| `inverted` | Invertido, tronco a 30° o menos de la vertical, cabeza en el punto más bajo: parada de manos, parada de cabeza. | `inverted` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `end`: ¿Qué extremo del cuerpo se mueve? {#end-which-end-of-the-body-moves}

- **Completa:** FXI k.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `moving-end`.
- **Habitual:** Lo que dice la palabra de movimiento; si no, las extremidades.

Normalmente se mueven las extremidades. En un sit-up, un crunch, un puente o una extensión de espalda se mueve el tronco y las piernas se quedan quietas. En un V-up ambos extremos se mueven el uno hacia el otro.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El extremo habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `limbs` | Se mueven las extremidades | `limbs` |  |
| `trunk` | Se mueve el tronco; las piernas se quedan quietas | `trunk` |  |
| `both` | Ambos extremos se mueven el uno hacia el otro | `both` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `footwork`: ¿Qué hacen los pies? {#footwork-what-do-the-feet-do}

- **Completa:** FXI f.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `footwork`.
- **Habitual:** Lo que dice la palabra de movimiento; si no, los pies plantados a la par.

Un paso vuelve en cada repetición; un desplazamiento continúa. "En el sitio" o en una máquina de cardio es plantado.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El trabajo de pies habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `level` | Plantados a la par, uno junto al otro | `level` |  |
| `split` | Plantados en postura dividida, un pie adelante | `split` |  |
| `step.fwd` | Cada repetición da un paso hacia adelante y vuelve | `step.fwd` |  |
| `step.back` | Cada repetición da un paso hacia atrás y vuelve | `step.back` |  |
| `step.side` | Cada repetición da un paso hacia el costado y vuelve | `step.side` |  |
| `step.cross` | Cada repetición da un paso hacia atrás y cruzado (reverencia) y vuelve | `step.cross` |  |
| `travel.fwd` | Se desplaza hacia adelante | `travel.fwd` |  |
| `travel.back` | Se desplaza hacia atrás | `travel.back` |  |
| `travel.side` | Se desplaza lateralmente | `travel.side` |  |
| `level>split` | Empieza a la par y aterriza en postura dividida (split jerk) | `level>split` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `support`: ¿Sobre qué se apoya el cuerpo, de qué cuelga o contra qué se afianza? {#support-what-does-the-body-rest-on-hang-from-or-brace-against}

- **Completa:** FXI s.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `support`.
- **Habitual:** Lo que dice la palabra de movimiento.

Solo lo que soporta peso o afianza una extremidad, más allá del suelo que implica la posición. No una colchoneta, no el asiento sobre el que se está sentado, no el asiento ni las almohadillas propios de una máquina, no un pasamanos que se usa solo para mantener el equilibrio.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El apoyo habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `none` | Solo el suelo, como implica la posición del cuerpo |  |  |
| `custom` | Otra cosa: se nombrará |  |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `sup1.surface`: ¿Cuál es el apoyo? {#sup1surface-what-is-the-support}

- **Completa:** FXI s (superficie).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `support` es `custom`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Superficies distintas bajo puntos del cuerpo distintos son apoyos separados: los pies sobre un balón, las manos en el suelo.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `bb` | Barra. | `bb` |  |
| `ez` | Barra Z. | `ez` |  |
| `tb` | Barra hexagonal (trap bar). | `tb` |  |
| `axle` | Barra axle. | `axle` |  |
| `camber` | Barra curvada. | `camber` |  |
| `db` | Mancuerna. | `db` |  |
| `kb` | Pesa rusa. | `kb` |  |
| `circus` | Mancuerna de circo. | `circus` |  |
| `mb` | Balón medicinal. | `mb` |  |
| `slam` | Balón de lanzamiento (slam ball). | `slam` |  |
| `bag` | Saco de arena. | `bag` |  |
| `hbag` | Saco de boxeo. | `hbag` |  |
| `plate` | Disco. | `plate` |  |
| `chain` | Cadena. | `chain` |  |
| `rope` | Cuerda de batalla. | `rope` |  |
| `jrope` | Cuerda para saltar. | `jrope` |  |
| `band` | Cualquier banda de resistencia, tubo, superband o miniband. | `band` |  |
| `sled` | Trineo de arrastre o prowler. | `sled` |  |
| `tire` | Neumático. | `tire` |  |
| `hammer` | Mazo. | `hammer` |  |
| `stone` | Piedra atlas. | `stone` |  |
| `log` | Tronco de strongman. | `log` |  |
| `keg` | Barril. | `keg` |  |
| `yoke` | Yugo. | `yoke` |  |
| `frame` | Empuñaduras de granjero o marco de acarreo (rickshaw). | `frame` |  |
| `car` | Automóvil. | `car` |  |
| `vest` | Chaleco lastrado. | `vest` |  |
| `ankwt` | Tobillera lastrada. | `ankwt` |  |
| `club` | Clava o maza. | `club` |  |
| `dowel` | Bastón, palo de escoba o tubo de PVC: sitúa las manos, no agrega carga. | `dowel` |  |
| `wheel` | Rueda abdominal. | `wheel` |  |
| `wroller` | Rodillo de muñeca. | `wroller` |  |
| `harness` | Arnés de cabeza. | `harness` |  |
| `cable` | Columna de poleas o estación de cruce de poleas (no una máquina de jalón al pecho ni de remo sentado). | `cable` |  |
| `smith` | Máquina Smith. | `smith` |  |
| `landmine` | Landmine, o el extremo de una barra encajado en una esquina. | `landmine` |  |
| `mach` | Cualquier máquina de fuerza dedicada (incluidas las máquinas de jalón al pecho y de remo sentado en polea). El FXE de la fila indica cuál. | `mach` |  |
| `erg` | Cualquier máquina de cardio: caminadora, bicicleta, remo, elíptica, máquina de escaleras, ski erg. El FXE de la fila indica cuál. | `erg` |  |
| `floor` | El suelo o una colchoneta. | `floor` |  |
| `wall` | Una pared. | `wall` |  |
| `bench` | Un banco. | `bench` |  |
| `box` | Un cajón, un step o una plataforma. | `box` |  |
| `chair` | Una silla. | `chair` |  |
| `block` | Bloques de levantamiento. | `block` |  |
| `rack` | Jaula de potencia o soporte de sentadilla. | `rack` |  |
| `ball` | Balón de estabilidad. | `ball` |  |
| `dome` | BOSU, lado hacia arriba no indicado. | `dome` |  |
| `dome.up` | BOSU con la cúpula hacia arriba. | `dome.up` |  |
| `dome.down` | BOSU con el lado plano hacia arriba (cúpula en el suelo). | `dome.down` |  |
| `board` | Tabla de equilibrio. | `board` |  |
| `roller` | Rodillo de espuma. | `roller` |  |
| `slider` | Disco deslizante. | `slider` |  |
| `strap` | Correas de suspensión. | `strap` |  |
| `ring` | Anillas de gimnasia. | `ring` |  |
| `crope` | Cuerda para trepar. | `crope` |  |
| `bar` | Barra fija: barra de dominadas, o una barra en el rack usada como asidero. | `bar` |  |
| `bars` | Barras paralelas de fondos. | `bars` |  |
| `pbars` | Paralelas bajas (parallettes). | `pbars` |  |
| `preacher` | Almohadilla de banco Scott. | `preacher` |  |
| `hyper` | Banco de extensiones de espalda (silla romana para elevaciones de espalda o laterales). | `hyper` |  |
| `ghd` | Glute-ham developer (GHD). | `ghd` |  |
| `vkr` | Silla del capitán / estación de elevación de rodillas. | `vkr` |  |
| `pole` | Un poste o una columna vertical agarrados con las manos (bandera humana). | `pole` |  |
| `mball` | Pelota de masaje o de lacrosse. | `mball` |  |
| `unknown` | Algo sin nombre | `?` | Exclusiva. |

#### `sup1.points`: ¿Qué puntos del cuerpo cargan peso sobre él? {#sup1points-which-body-points-bear-weight-on-it}

- **Completa:** FXI s (puntos).
- **Elegir:** una o varias.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `support` es `custom`.
- **Habitual:** Solo los puntos que implica la posición del cuerpo.

Omitir los puntos que la posición del cuerpo ya implica (de pie implica los pies; tumbado boca arriba, la espalda). Cuando el tronco no se apoya en nada (plancha, flexión de brazos), enumerar todos los puntos.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Solo los puntos que implica la posición (la forma habitual) | el valor predeterminado | Exclusiva. |
| `hands` | Las manos, o una mano. | `hands` |  |
| `forearms` | Los antebrazos, codos flexionados (plancha sobre codos). | `forearms` |  |
| `elbows` | El pliegue de los codos (Zercher). | `elbows` |  |
| `arms` | La parte superior de los brazos (almohadilla de banco Scott). | `arms` |  |
| `shoulders` | En la parte delantera de los hombros y las clavículas (front rack), o sobre un hombro. | `shoulders` |  |
| `chest` | Contra el pecho (goblet, abrazo de oso). | `chest` |  |
| `back` | Sobre la parte alta de la espalda (sentadilla trasera). | `back` |  |
| `hips` | Sobre la parte delantera de las caderas (hip thrust). | `hips` |  |
| `waist` | Colgado de un cinturón en la cintura. | `waist` |  |
| `seat` | Los glúteos (al sentarse sobre un cajón o un banco). | `seat` |  |
| `thighs` | Sobre los muslos o alrededor de ellos. | `thighs` |  |
| `knees` | En las rodillas o alrededor de ellas. | `knees` |  |
| `shins` | Las espinillas. | `shins` |  |
| `calves` | Las pantorrillas (la parte posterior de la pierna). | `calves` |  |
| `ankles` | En los tobillos o justo por encima (correa, tobillera, almohadilla de máquina en la parte inferior de la pierna). | `ankles` |  |
| `feet` | Los pies, o un pie. | `feet` |  |
| `head` | La cabeza o la frente. | `head` |  |
| `unknown` | Un punto que no se conoce | `?` |  |

#### `sup.more`: ¿Hay un segundo apoyo? {#supmore-is-there-a-second-support}

- **Completa:** FXI s (elementos).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `support` es `custom`.
- **Habitual:** No.

Ejemplo: los pies sobre un balón y las manos en el suelo.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No (la forma habitual) | el valor predeterminado | Exclusiva. |
| `yes` | Sí |  |  |

#### `sup2.surface`: ¿Cuál es el segundo apoyo? {#sup2surface-what-is-the-second-support}

- **Completa:** FXI s (superficie).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `support` es `custom`; y `sup.more` es `yes`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Superficies distintas bajo puntos del cuerpo distintos son apoyos separados: los pies sobre un balón, las manos en el suelo.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `bb` | Barra. | `bb` |  |
| `ez` | Barra Z. | `ez` |  |
| `tb` | Barra hexagonal (trap bar). | `tb` |  |
| `axle` | Barra axle. | `axle` |  |
| `camber` | Barra curvada. | `camber` |  |
| `db` | Mancuerna. | `db` |  |
| `kb` | Pesa rusa. | `kb` |  |
| `circus` | Mancuerna de circo. | `circus` |  |
| `mb` | Balón medicinal. | `mb` |  |
| `slam` | Balón de lanzamiento (slam ball). | `slam` |  |
| `bag` | Saco de arena. | `bag` |  |
| `hbag` | Saco de boxeo. | `hbag` |  |
| `plate` | Disco. | `plate` |  |
| `chain` | Cadena. | `chain` |  |
| `rope` | Cuerda de batalla. | `rope` |  |
| `jrope` | Cuerda para saltar. | `jrope` |  |
| `band` | Cualquier banda de resistencia, tubo, superband o miniband. | `band` |  |
| `sled` | Trineo de arrastre o prowler. | `sled` |  |
| `tire` | Neumático. | `tire` |  |
| `hammer` | Mazo. | `hammer` |  |
| `stone` | Piedra atlas. | `stone` |  |
| `log` | Tronco de strongman. | `log` |  |
| `keg` | Barril. | `keg` |  |
| `yoke` | Yugo. | `yoke` |  |
| `frame` | Empuñaduras de granjero o marco de acarreo (rickshaw). | `frame` |  |
| `car` | Automóvil. | `car` |  |
| `vest` | Chaleco lastrado. | `vest` |  |
| `ankwt` | Tobillera lastrada. | `ankwt` |  |
| `club` | Clava o maza. | `club` |  |
| `dowel` | Bastón, palo de escoba o tubo de PVC: sitúa las manos, no agrega carga. | `dowel` |  |
| `wheel` | Rueda abdominal. | `wheel` |  |
| `wroller` | Rodillo de muñeca. | `wroller` |  |
| `harness` | Arnés de cabeza. | `harness` |  |
| `cable` | Columna de poleas o estación de cruce de poleas (no una máquina de jalón al pecho ni de remo sentado). | `cable` |  |
| `smith` | Máquina Smith. | `smith` |  |
| `landmine` | Landmine, o el extremo de una barra encajado en una esquina. | `landmine` |  |
| `mach` | Cualquier máquina de fuerza dedicada (incluidas las máquinas de jalón al pecho y de remo sentado en polea). El FXE de la fila indica cuál. | `mach` |  |
| `erg` | Cualquier máquina de cardio: caminadora, bicicleta, remo, elíptica, máquina de escaleras, ski erg. El FXE de la fila indica cuál. | `erg` |  |
| `floor` | El suelo o una colchoneta. | `floor` |  |
| `wall` | Una pared. | `wall` |  |
| `bench` | Un banco. | `bench` |  |
| `box` | Un cajón, un step o una plataforma. | `box` |  |
| `chair` | Una silla. | `chair` |  |
| `block` | Bloques de levantamiento. | `block` |  |
| `rack` | Jaula de potencia o soporte de sentadilla. | `rack` |  |
| `ball` | Balón de estabilidad. | `ball` |  |
| `dome` | BOSU, lado hacia arriba no indicado. | `dome` |  |
| `dome.up` | BOSU con la cúpula hacia arriba. | `dome.up` |  |
| `dome.down` | BOSU con el lado plano hacia arriba (cúpula en el suelo). | `dome.down` |  |
| `board` | Tabla de equilibrio. | `board` |  |
| `roller` | Rodillo de espuma. | `roller` |  |
| `slider` | Disco deslizante. | `slider` |  |
| `strap` | Correas de suspensión. | `strap` |  |
| `ring` | Anillas de gimnasia. | `ring` |  |
| `crope` | Cuerda para trepar. | `crope` |  |
| `bar` | Barra fija: barra de dominadas, o una barra en el rack usada como asidero. | `bar` |  |
| `bars` | Barras paralelas de fondos. | `bars` |  |
| `pbars` | Paralelas bajas (parallettes). | `pbars` |  |
| `preacher` | Almohadilla de banco Scott. | `preacher` |  |
| `hyper` | Banco de extensiones de espalda (silla romana para elevaciones de espalda o laterales). | `hyper` |  |
| `ghd` | Glute-ham developer (GHD). | `ghd` |  |
| `vkr` | Silla del capitán / estación de elevación de rodillas. | `vkr` |  |
| `pole` | Un poste o una columna vertical agarrados con las manos (bandera humana). | `pole` |  |
| `mball` | Pelota de masaje o de lacrosse. | `mball` |  |
| `unknown` | Algo sin nombre | `?` | Exclusiva. |

#### `sup2.points`: ¿Qué puntos del cuerpo cargan peso sobre él? {#sup2points-which-body-points-bear-weight-on-it}

- **Completa:** FXI s (puntos).
- **Elegir:** una o varias.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `support` es `custom`; y `sup.more` es `yes`.
- **Habitual:** Solo los puntos que implica la posición del cuerpo.

Omitir los puntos que la posición del cuerpo ya implica (de pie implica los pies; tumbado boca arriba, la espalda). Cuando el tronco no se apoya en nada (plancha, flexión de brazos), enumerar todos los puntos.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Solo los puntos que implica la posición (la forma habitual) | el valor predeterminado | Exclusiva. |
| `hands` | Las manos, o una mano. | `hands` |  |
| `forearms` | Los antebrazos, codos flexionados (plancha sobre codos). | `forearms` |  |
| `elbows` | El pliegue de los codos (Zercher). | `elbows` |  |
| `arms` | La parte superior de los brazos (almohadilla de banco Scott). | `arms` |  |
| `shoulders` | En la parte delantera de los hombros y las clavículas (front rack), o sobre un hombro. | `shoulders` |  |
| `chest` | Contra el pecho (goblet, abrazo de oso). | `chest` |  |
| `back` | Sobre la parte alta de la espalda (sentadilla trasera). | `back` |  |
| `hips` | Sobre la parte delantera de las caderas (hip thrust). | `hips` |  |
| `waist` | Colgado de un cinturón en la cintura. | `waist` |  |
| `seat` | Los glúteos (al sentarse sobre un cajón o un banco). | `seat` |  |
| `thighs` | Sobre los muslos o alrededor de ellos. | `thighs` |  |
| `knees` | En las rodillas o alrededor de ellas. | `knees` |  |
| `shins` | Las espinillas. | `shins` |  |
| `calves` | Las pantorrillas (la parte posterior de la pierna). | `calves` |  |
| `ankles` | En los tobillos o justo por encima (correa, tobillera, almohadilla de máquina en la parte inferior de la pierna). | `ankles` |  |
| `feet` | Los pies, o un pie. | `feet` |  |
| `head` | La cabeza o la frente. | `head` |  |
| `unknown` | Un punto que no se conoce | `?` |  |

#### `load`: ¿Qué carga los músculos que trabajan? {#load-what-loads-the-working-muscles}

- **Completa:** FXI l, y el FXE de la fila.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y o bien no (la palabra de movimiento fija la carga (peso corporal, un cable, una máquina, un implemento con nombre)), o bien `changes` incluye `equipment`.
- **Habitual:** La carga que nombra la palabra de movimiento.

No son apoyos: un banco, un cajón o una barra de la que se cuelga van en el apoyo. Un chaleco lastrado o un cinturón es un implemento. Un jalón al pecho y un remo sentado en polea con su propio asiento son máquinas de fuerza.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La carga habitual para este movimiento | el valor predeterminado | Exclusiva. Solo cuando la palabra de movimiento fija la carga (peso corporal, un cable, una máquina, un implemento con nombre). |
| `bodyweight` | Solo el peso corporal | `bw` |  |
| `implement` | Un implemento libre: barra, mancuerna, pesa rusa, banda, balón, disco… |  |  |
| `cable` | Una columna de poleas o un cruce de poleas | `cable` |  |
| `smith` | Una máquina Smith | `smith` |  |
| `landmine` | Un landmine | `landmine` |  |
| `machine` | Una máquina de fuerza construida para un solo movimiento | `mach` |  |
| `cardio` | Una máquina de cardio | `erg` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `imp1`: ¿Qué implemento? {#imp1-which-implement}

- **Completa:** FXI l (token) y el FXE de la fila.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `load` es `implement`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

El tipo de objeto, no su peso. Cualquier banda de resistencia, tubo, superband o miniband es "banda".

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `bb` | Barra. | `bb` |  |
| `ez` | Barra Z. | `ez` |  |
| `tb` | Barra hexagonal (trap bar). | `tb` |  |
| `axle` | Barra axle. | `axle` |  |
| `camber` | Barra curvada. | `camber` |  |
| `db` | Mancuerna. | `db` |  |
| `kb` | Pesa rusa. | `kb` |  |
| `circus` | Mancuerna de circo. | `circus` |  |
| `mb` | Balón medicinal. | `mb` |  |
| `slam` | Balón de lanzamiento (slam ball). | `slam` |  |
| `bag` | Saco de arena. | `bag` |  |
| `hbag` | Saco de boxeo. | `hbag` |  |
| `plate` | Disco. | `plate` |  |
| `chain` | Cadena. | `chain` |  |
| `rope` | Cuerda de batalla. | `rope` |  |
| `jrope` | Cuerda para saltar. | `jrope` |  |
| `band` | Cualquier banda de resistencia, tubo, superband o miniband. | `band` |  |
| `sled` | Trineo de arrastre o prowler. | `sled` |  |
| `tire` | Neumático. | `tire` |  |
| `hammer` | Mazo. | `hammer` |  |
| `stone` | Piedra atlas. | `stone` |  |
| `log` | Tronco de strongman. | `log` |  |
| `keg` | Barril. | `keg` |  |
| `yoke` | Yugo. | `yoke` |  |
| `frame` | Empuñaduras de granjero o marco de acarreo (rickshaw). | `frame` |  |
| `car` | Automóvil. | `car` |  |
| `vest` | Chaleco lastrado. | `vest` |  |
| `ankwt` | Tobillera lastrada. | `ankwt` |  |
| `club` | Clava o maza. | `club` |  |
| `dowel` | Bastón, palo de escoba o tubo de PVC: sitúa las manos, no agrega carga. | `dowel` |  |
| `wheel` | Rueda abdominal. | `wheel` |  |
| `wroller` | Rodillo de muñeca. | `wroller` |  |
| `harness` | Arnés de cabeza. | `harness` |  |
| `unknown` | Un peso libre de un tipo que no se conoce | `?` | Exclusiva. |

#### `hold1`: ¿Dónde se sostiene? {#hold1-where-is-it-held}

- **Completa:** FXI l (punto de sujeción).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y la primera carga es un implemento libre, un cable, una máquina Smith o un landmine; y o bien no (las reglas dan un punto de sujeción habitual para ese implemento en este movimiento), o bien `changes` incluye `hold`, o bien `load` es `implement` o `cable` o `smith` o `landmine`.
- **Habitual:** La sujeción que da la palabra de movimiento para este implemento; si no, las manos para un implemento que se sostiene con las manos.

En las manos, a los costados, balanceado o por una empuñadura es "manos", y también lo son las mancuernas sostenidas a la altura de los hombros y una barra que se empuja sin apoyarla en los hombros. Apoyado en la parte delantera de los hombros (front rack), o el extremo de un landmine sostenido en el hombro, es "hombros". Una barra detrás del cuello se apoya en la "espalda". Con los brazos extendidos por encima de la cabeza durante toda la repetición es "por encima de la cabeza". Una carga sobre el regazo en una elevación de talones sentado es "muslos". Una banda va donde presiona o tira del cuerpo; en el trabajo solo de piernas, suelen ser los pies o los tobillos. Una banda cuyos extremos se sostienen a la altura de los hombros (un thruster con banda) es "manos": "hombros" es una carga apoyada en ellos.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El lugar habitual para este movimiento | el valor predeterminado | Exclusiva. Solo cuando las reglas dan un punto de sujeción habitual para ese implemento en este movimiento. |
| `hands` | Las manos, o una mano. | `hands` |  |
| `forearms` | Los antebrazos, codos flexionados (plancha sobre codos). | `forearms` |  |
| `elbows` | El pliegue de los codos (Zercher). | `elbows` |  |
| `arms` | La parte superior de los brazos (almohadilla de banco Scott). | `arms` |  |
| `shoulders` | En la parte delantera de los hombros y las clavículas (front rack), o sobre un hombro. | `shoulders` |  |
| `chest` | Contra el pecho (goblet, abrazo de oso). | `chest` |  |
| `back` | Sobre la parte alta de la espalda (sentadilla trasera). | `back` |  |
| `hips` | Sobre la parte delantera de las caderas (hip thrust). | `hips` |  |
| `waist` | Colgado de un cinturón en la cintura. | `waist` |  |
| `seat` | Los glúteos (al sentarse sobre un cajón o un banco). | `seat` |  |
| `thighs` | Sobre los muslos o alrededor de ellos. | `thighs` |  |
| `knees` | En las rodillas o alrededor de ellas. | `knees` |  |
| `shins` | Las espinillas. | `shins` |  |
| `calves` | Las pantorrillas (la parte posterior de la pierna). | `calves` |  |
| `ankles` | En los tobillos o justo por encima (correa, tobillera, almohadilla de máquina en la parte inferior de la pierna). | `ankles` |  |
| `feet` | Los pies, o un pie. | `feet` |  |
| `head` | La cabeza o la frente. | `head` |  |
| `overhead` | Sostenido en las manos con los brazos extendidos por encima de la cabeza durante toda la repetición. | `overhead` |  |
| `assist` | El implemento soporta parte del peso corporal (banda de asistencia, máquina asistida). | `assist` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `count1`: ¿Cuántos hay, en total? {#count1-how-many-of-them-in-total}

- **Completa:** FXI l (recuento "*n").
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y la primera carga es un implemento libre, un cable, una máquina Smith o un landmine; y `changes` incluye `count`.
- **Habitual:** El recuento habitual.

El recuento habitual es uno por cada mano que trabaja para un implemento a una mano (dos mancuernas en un curl a dos brazos, una en un curl a un brazo) y uno para un implemento a dos manos o cualquier cosa sostenida sobre el tronco. Cuando las piernas también trabajan un lado cada vez (una zancada con press a un brazo), el recuento habitual es dos: se responde 1 si se sostiene una sola mancuerna. Si el total es el habitual, la respuesta no cambia nada.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El recuento habitual | el valor predeterminado | Exclusiva. |
| `1` | 1 | `1` |  |
| `2` | 2 | `2` |  |
| `3` | 3 | `3` |  |
| `4` | 4 | `4` |  |

#### `imp2`: ¿Cuál es el segundo implemento? {#imp2-what-is-the-second-implement}

- **Completa:** FXI l (segundo elemento).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `extra`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Ejemplo: un chaleco lastrado además de mancuernas, o un disco en un cinturón de fondos con el peso corporal.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `bb` | Barra. | `bb` |  |
| `ez` | Barra Z. | `ez` |  |
| `tb` | Barra hexagonal (trap bar). | `tb` |  |
| `axle` | Barra axle. | `axle` |  |
| `camber` | Barra curvada. | `camber` |  |
| `db` | Mancuerna. | `db` |  |
| `kb` | Pesa rusa. | `kb` |  |
| `circus` | Mancuerna de circo. | `circus` |  |
| `mb` | Balón medicinal. | `mb` |  |
| `slam` | Balón de lanzamiento (slam ball). | `slam` |  |
| `bag` | Saco de arena. | `bag` |  |
| `hbag` | Saco de boxeo. | `hbag` |  |
| `plate` | Disco. | `plate` |  |
| `chain` | Cadena. | `chain` |  |
| `rope` | Cuerda de batalla. | `rope` |  |
| `jrope` | Cuerda para saltar. | `jrope` |  |
| `band` | Cualquier banda de resistencia, tubo, superband o miniband. | `band` |  |
| `sled` | Trineo de arrastre o prowler. | `sled` |  |
| `tire` | Neumático. | `tire` |  |
| `hammer` | Mazo. | `hammer` |  |
| `stone` | Piedra atlas. | `stone` |  |
| `log` | Tronco de strongman. | `log` |  |
| `keg` | Barril. | `keg` |  |
| `yoke` | Yugo. | `yoke` |  |
| `frame` | Empuñaduras de granjero o marco de acarreo (rickshaw). | `frame` |  |
| `car` | Automóvil. | `car` |  |
| `vest` | Chaleco lastrado. | `vest` |  |
| `ankwt` | Tobillera lastrada. | `ankwt` |  |
| `club` | Clava o maza. | `club` |  |
| `dowel` | Bastón, palo de escoba o tubo de PVC: sitúa las manos, no agrega carga. | `dowel` |  |
| `wheel` | Rueda abdominal. | `wheel` |  |
| `wroller` | Rodillo de muñeca. | `wroller` |  |
| `harness` | Arnés de cabeza. | `harness` |  |
| `cable` | Cable | `cable` |  |
| `unknown` | Un peso libre de un tipo que no se conoce | `?` | Exclusiva. |

#### `hold2`: ¿Dónde se sostiene el segundo implemento? {#hold2-where-is-the-second-implement-held}

- **Completa:** FXI l (punto de sujeción).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `extra`.
- **Habitual:** El lugar habitual para ese implemento en este movimiento.

Las mismas reglas que para el primer implemento.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El lugar habitual para este movimiento | el valor predeterminado | Exclusiva. Solo cuando las reglas dan un punto de sujeción habitual para el segundo implemento en este movimiento. |
| `hands` | Las manos, o una mano. | `hands` |  |
| `forearms` | Los antebrazos, codos flexionados (plancha sobre codos). | `forearms` |  |
| `elbows` | El pliegue de los codos (Zercher). | `elbows` |  |
| `arms` | La parte superior de los brazos (almohadilla de banco Scott). | `arms` |  |
| `shoulders` | En la parte delantera de los hombros y las clavículas (front rack), o sobre un hombro. | `shoulders` |  |
| `chest` | Contra el pecho (goblet, abrazo de oso). | `chest` |  |
| `back` | Sobre la parte alta de la espalda (sentadilla trasera). | `back` |  |
| `hips` | Sobre la parte delantera de las caderas (hip thrust). | `hips` |  |
| `waist` | Colgado de un cinturón en la cintura. | `waist` |  |
| `seat` | Los glúteos (al sentarse sobre un cajón o un banco). | `seat` |  |
| `thighs` | Sobre los muslos o alrededor de ellos. | `thighs` |  |
| `knees` | En las rodillas o alrededor de ellas. | `knees` |  |
| `shins` | Las espinillas. | `shins` |  |
| `calves` | Las pantorrillas (la parte posterior de la pierna). | `calves` |  |
| `ankles` | En los tobillos o justo por encima (correa, tobillera, almohadilla de máquina en la parte inferior de la pierna). | `ankles` |  |
| `feet` | Los pies, o un pie. | `feet` |  |
| `head` | La cabeza o la frente. | `head` |  |
| `overhead` | Sostenido en las manos con los brazos extendidos por encima de la cabeza durante toda la repetición. | `overhead` |  |
| `assist` | El implemento soporta parte del peso corporal (banda de asistencia, máquina asistida). | `assist` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `band.type`: ¿Qué tipo de banda? {#bandtype-which-kind-of-band}

- **Completa:** FXE f (subtipo de banda).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y una banda es una de las cargas.
- **Habitual:** Una banda de tipo no indicado.

Nombrar el tipo solo cuando se conoce. El FXI es el mismo para cualquier banda; solo cambia el FXE de la fila.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `loop` | Banda de lazo largo: superband, power band | `band.loop` |  |
| `mini` | Banda de lazo corto alrededor de las piernas: miniband | `band.mini` |  |
| `tube` | Tubo con empuñaduras | `band.tube` |  |

#### `mac.motion`: ¿Qué guía la máquina? {#macmotion-what-does-the-machine-guide}

- **Completa:** FXE m (mac).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y la carga es una máquina de fuerza; y o bien no (la palabra de movimiento fija qué máquina se usa), o bien `changes` incluye `machine`.
- **Habitual:** La máquina que nombra la palabra de movimiento.

Responder según la máquina tal como está construida, no según el ejercicio que se hace en ella. Una elevación de talones hecha en una prensa de piernas usa una prensa de piernas: se responde "empuja hacia afuera". Un pivote alineado con una articulación es una máquina monoarticular.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La máquina construida para este movimiento (la forma habitual) | el valor predeterminado | Exclusiva. Solo cuando la palabra de movimiento fija qué máquina se usa. |
| `push` | *Multiarticular:* Empuja hacia afuera: una máquina multiarticular de press o de sentadilla |  |  |
| `pull` | Tira hacia el cuerpo: una máquina multiarticular de remo, de jalón o de peso muerto |  |  |
| `assist` | Ayuda a elevar el cuerpo: una máquina de dominadas o fondos asistidos |  |  |
| `kn.flex` | *Pivota en una articulación:* La rodilla se flexiona (curl de piernas) | `kn.flex` |  |
| `kn.ext` | La rodilla se extiende (extensión de piernas) | `kn.ext` |  |
| `el.flex` | El codo se flexiona (máquina de curl) | `el.flex` |  |
| `el.ext` | El codo se extiende (máquina de tríceps) | `el.ext` |  |
| `sh.hadd` | Los brazos se juntan por delante (pec deck) | `sh.hadd` |  |
| `sh.habd` | Los brazos se separan (máquina de deltoides posterior) | `sh.habd` |  |
| `sh.abd` | Los brazos se elevan hacia los costados (máquina de elevaciones laterales) | `sh.abd` |  |
| `sh.ext` | Los brazos tiran hacia abajo desde el frente (máquina de pullover) | `sh.ext` |  |
| `sh.flex` | Los brazos se elevan hacia adelante | `sh.flex` |  |
| `sh.add` | Los brazos tiran hacia abajo desde los costados | `sh.add` |  |
| `sh.ir` | El hombro rota hacia adentro | `sh.ir` |  |
| `sh.er` | El hombro rota hacia afuera | `sh.er` |  |
| `sc.elev` | Encogimiento de hombros | `sc.elev` |  |
| `hip.flex` | La cadera se flexiona (máquina de elevación de piernas o de rodillas) | `hip.flex` |  |
| `hip.ext` | La cadera se extiende (patada de glúteo, hip thrust, reverse hyper) | `hip.ext` |  |
| `hip.abd` | Las piernas se separan empujando (abductor) | `hip.abd` |  |
| `hip.add` | Las piernas se juntan apretando (aductor) | `hip.add` |  |
| `sp.flex` | El tronco se flexiona (máquina de crunch abdominal) | `sp.flex` |  |
| `sp.ext` | El tronco se extiende (máquina de extensión de espalda) | `sp.ext` |  |
| `sp.rot` | El tronco gira (rotary torso) | `sp.rot` |  |
| `sp.lflex` | El tronco se flexiona lateralmente | `sp.lflex` |  |
| `ank.pf` | Subir a las puntas de los pies (máquina de elevación de talones) | `ank.pf` |  |
| `ank.df` | La punta del pie sube (máquina de tibial) | `ank.df` |  |
| `nk.flex` | El cuello se flexiona | `nk.flex` |  |
| `nk.ext` | El cuello se extiende | `nk.ext` |  |
| `nk.lflex` | El cuello se flexiona lateralmente | `nk.lflex` |  |
| `wr.flex` | La muñeca se flexiona | `wr.flex` |  |
| `wr.ext` | La muñeca se extiende | `wr.ext` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `mac.direction`: ¿Hacia dónde se mueve la empuñadura, la almohadilla o la plataforma, respecto al tronco, durante el trabajo? {#macdirection-which-way-does-the-handle-pad-or-plate-move-relative-to-your-trunk-while-you-work}

- **Completa:** FXE m (dirección de mac).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y la carga es una máquina de fuerza; y o bien no (la palabra de movimiento fija qué máquina se usa), o bien `changes` incluye `machine`; y `mac.motion` es `push` o `pull` o `assist`.
- **Habitual:** La dirección de la máquina que nombra la palabra de movimiento.

Arriba es hacia la cabeza, abajo hacia los pies, adelante es alejándose de la parte delantera del tronco.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La dirección habitual para este movimiento | el valor predeterminado | Exclusiva. Solo cuando la palabra de movimiento nombra una máquina multiarticular, así que se conoce su dirección. |
| `up` | Hacia la cabeza: press de hombros, sentadilla hack, sentadilla con cinturón, máquina de peso muerto. | `up` |  |
| `down` | Hacia los pies: jalón, fondo sentado. | `down` |  |
| `fwd` | Alejándose de la parte delantera del tronco: press de pecho, prensa de piernas. | `fwd` |  |
| `back` | Hacia la parte delantera del tronco: remo. | `back` |  |
| `fwdup` | Hacia adelante y arriba: press inclinado. | `fwdup` |  |
| `fwddown` | Hacia adelante y abajo: press declinado. | `fwddown` |  |
| `backdown` | Hacia atrás y abajo: remo alto. | `backdown` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `mac.contact`: ¿Dónde toca el cuerpo la parte móvil de la máquina? {#maccontact-where-does-the-moving-part-of-the-machine-meet-your-body}

- **Completa:** FXE l (mac) y el punto de sujeción FXI de mach.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y la carga es una máquina de fuerza; y o bien no (la palabra de movimiento fija qué máquina se usa), o bien `changes` incluye `machine`.
- **Habitual:** El valor predeterminado de FXE para ese movimiento guiado (valores predeterminados de máquina de FXE), o la máquina que nombra la palabra de movimiento.

La parte que se empuja o de la que se tira: empuñaduras, una plataforma para los pies, una almohadilla en la parte inferior de la pierna. En una máquina de dominadas o fondos asistidos, se responde dónde toca el cuerpo la almohadilla o la plataforma de asistencia (rodilla o pie): eso va en el FXE. El FXI siempre escribe una máquina asistida como mach@assist.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El lugar habitual para este movimiento guiado | el valor predeterminado | Exclusiva. Solo cuando la palabra de movimiento nombra la máquina, o las reglas dan un contacto predeterminado para el movimiento guiado. |
| `hand` | Empuñaduras o una barra en las manos. | `hand` |  |
| `foot` | Una plataforma para los pies o pedales. | `foot` |  |
| `ankle` | Una almohadilla en la parte inferior de la pierna. | `ankle` |  |
| `thigh` | Una almohadilla en el muslo. | `thigh` |  |
| `knee` | Una almohadilla o una plataforma en las rodillas. | `knee` |  |
| `arm` | Una almohadilla en la parte superior del brazo o en el codo. | `arm` |  |
| `chest` | Una almohadilla en el pecho. | `chest` |  |
| `back` | Una almohadilla en la espalda. | `back` |  |
| `shoulder` | Almohadillas en los hombros. | `shoulder` |  |
| `hip` | Una almohadilla o un cinturón en las caderas. | `hip` |  |
| `head` | Una almohadilla en la cabeza. | `head` |  |
| `seat` | Un asiento móvil. | `seat` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `mac.chest`: ¿Una almohadilla apoya el pecho durante el trabajo? {#macchest-does-a-pad-support-your-chest-while-you-work}

- **Completa:** FXE s (postura de mac).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y la carga es una máquina de fuerza; y o bien no (la palabra de movimiento fija qué máquina se usa), o bien `changes` incluye `machine`.
- **Habitual:** Sin almohadilla de pecho, salvo que la palabra de movimiento nombre una máquina que la tenga (máquina de remo).

Una almohadilla de pecho en una máquina de remo o en una elevación de talones tipo burro. El resto de la postura de la máquina se lee de la posición del cuerpo.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La forma habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `yes` | Sí |  |  |
| `no` | No |  |  |

#### `erg.type`: ¿Qué máquina de cardio? {#ergtype-which-cardio-machine}

- **Completa:** Capas FXE de k:erg, y el punto de sujeción FXI de erg.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y la carga es una máquina de cardio; y o bien no (la palabra de movimiento fija qué máquina de cardio se usa), o bien `changes` incluye `machine`.
- **Habitual:** La máquina que nombra la palabra de movimiento.

Elegir el tipo. Si solo se sabe que es una bicicleta estática o una máquina de escaleras, elegir la entrada "no se conoce".

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La máquina habitual para este movimiento | el valor predeterminado | Exclusiva. Solo cuando la palabra de movimiento fija qué máquina de cardio se usa. |
| `treadmill` | Caminadora | `treadmill` |  |
| `stepmill` | Stepmill (escaleras giratorias) | `stepmill` |  |
| `stepper` | Stepper (pedales) | `stepper` |  |
| `stair` | Máquina de escaleras, stepper o stepmill, no se conoce | `stair` |  |
| `bike-upright` | Bicicleta vertical o de spinning | `bike-upright` |  |
| `bike-recumbent` | Bicicleta reclinada | `bike-recumbent` |  |
| `bike` | Bicicleta estática, vertical o reclinada, no se conoce | `bike` |  |
| `air-bike` | Air bike (brazos móviles) | `air-bike` |  |
| `elliptical` | Elíptica | `elliptical` |  |
| `rower` | Remo | `rower` |  |
| `ski` | Ski erg | `ski` |  |
| `ube` | Ergómetro de tren superior (manivelas, sentado) | `ube` |  |
| `vertical-climber` | Escalador vertical | `vertical-climber` |  |
| `ladder-climber` | Escalador de escalera | `ladder-climber` |  |
| `unknown` | Una máquina de cardio de un tipo que no se conoce | `?` | Exclusiva. |

#### `symmetry`: ¿Cómo trabajan los dos lados? {#symmetry-how-do-the-two-sides-work}

- **Completa:** FXI x.
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y o bien `changes` incluye `sides`, o bien el movimiento es "other", o el propietario indicó que el movimiento articular difiere de la palabra de movimiento.
- **Habitual:** Lo que dice la palabra de movimiento; si no, ambos lados a la vez.

Hacer todas las repeticiones de un lado y luego cambiar es distinto de alternar los lados repetición a repetición. Recíproco significa que ambos lados se mueven a la vez en direcciones opuestas: caminar, patadas de tijera, ondas alternas con cuerda. Un estiramiento o un rodamiento que trabaja una extremidad y luego la otra es "un lado y luego el otro". Las piernas que pedalean son recíprocas aunque el tronco gire hacia cada lado por turnos (crunch bicicleta); un giro del tronco por sí solo no tiene lados.

*Modo de importación:* solo a partir del nombre y de los campos. "Alternating" significa que los lados se turnan solo cuando nada más en el nombre se alterna ("alternating front and lateral raise" alterna dos elevaciones).

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La forma habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `b` | Ambos lados a la vez, o el movimiento no tiene lados | `b` |  |
| `u` | Un lado hace todas las repeticiones y luego el otro lado | `u` |  |
| `a` | Los lados se turnan repetición a repetición | `a` |  |
| `rc` | Ambos lados se mueven a la vez en direcciones opuestas | `rc` |  |
| `split` | Los brazos y las piernas siguen patrones distintos (suitcase carry) |  |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `symmetry.scope`: ¿Ese patrón se aplica solo a los brazos, solo a las piernas o a todas las extremidades que trabajan? {#symmetryscope-does-that-pattern-apply-to-the-arms-only-the-legs-only-or-every-working-limb}

- **Completa:** FXI x (alcance).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `symmetry` es `u` o `a` o `rc`.
- **Habitual:** Todas las extremidades que trabajan.

Un swing con pesa rusa a un brazo es solo los brazos: las piernas siguen trabajando a la vez.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Todas las extremidades que trabajan (la forma habitual) | el valor predeterminado | Exclusiva. |
| `arms` | Solo los brazos | `arms` |  |
| `legs` | Solo las piernas | `legs` |  |

#### `symmetry.arms`: ¿Cómo trabajan los brazos? {#symmetryarms-how-do-the-arms-work}

- **Completa:** FXI x (elemento con alcance).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `symmetry` es `split`.
- **Habitual:** Ambos lados a la vez.

Un suitcase carry: las piernas son recíprocas, los brazos un lado y luego el otro.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Ambos a la vez (la forma habitual) | el valor predeterminado | Exclusiva. |
| `b` | Ambos a la vez | `b` |  |
| `u` | Un lado y luego el otro | `u` |  |
| `a` | Por turnos, repetición a repetición | `a` |  |
| `rc` | A la vez, en direcciones opuestas | `rc` |  |

#### `symmetry.legs`: ¿Cómo trabajan las piernas? {#symmetrylegs-how-do-the-legs-work}

- **Completa:** FXI x (elemento con alcance).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `symmetry` es `split`.
- **Habitual:** Ambos lados a la vez.

Un suitcase carry: las piernas son recíprocas, los brazos un lado y luego el otro.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Ambos a la vez (la forma habitual) | el valor predeterminado | Exclusiva. |
| `b` | Ambos a la vez | `b` |  |
| `u` | Un lado y luego el otro | `u` |  |
| `a` | Por turnos, repetición a repetición | `a` |  |
| `rc` | A la vez, en direcciones opuestas | `rc` |  |

#### `grip.hand`: ¿Hacia dónde miran las palmas? {#griphand-which-way-do-the-palms-face}

- **Completa:** FXI g (mano).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `hand`.
- **Habitual:** Lo que dice la palabra de movimiento; si no, supino para un curl y prono para todo lo demás.

Prono es con las palmas hacia abajo o hacia afuera; supino, con las palmas hacia arriba o hacia el cuerpo; neutro, con las palmas enfrentadas. Un giro durante la repetición (Zottman, press Arnold) es "gira". Un agarre que impone el implemento sigue contando: las empuñaduras paralelas (empuñaduras de granjero o de rickshaw) o un accesorio de cuerda son "neutro". Solo el agarre neutro de una barra hexagonal se omite, y lo hace el codificador.

*Modo de importación:* "reverse grip" en un nombre significa el agarre opuesto al habitual de la palabra de movimiento: prono en un curl, supino en los demás casos.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La forma habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `pr` | Prono | `pr` |  |
| `su` | Supino | `su` |  |
| `ne` | Neutro | `ne` |  |
| `mx` | Mixto: una mano en prono, otra en supino | `mx` |  |
| `turn` | Las palmas giran durante la repetición |  |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `grip.start`: ¿Hacia dónde miran las palmas al inicio? {#gripstart-which-way-do-the-palms-face-at-the-start}

- **Completa:** FXI g (mano, por fase).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `hand`; y `grip.hand` es `turn`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Un curl Zottman empieza en supino y termina en prono.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `pr` | Prono | `pr` |  |
| `su` | Supino | `su` |  |
| `ne` | Neutro | `ne` |  |
| `mx` | Mixto | `mx` |  |

#### `grip.end`: ¿Hacia dónde miran al final del movimiento de trabajo? {#gripend-which-way-do-they-face-at-the-end-of-the-working-movement}

- **Completa:** FXI g (mano, por fase).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `hand`; y `grip.hand` es `turn`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Un curl Zottman empieza en supino y termina en prono.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `pr` | Prono | `pr` |  |
| `su` | Supino | `su` |  |
| `ne` | Neutro | `ne` |  |
| `mx` | Mixto | `mx` |  |

#### `grip.width`: ¿Qué separación hay entre las manos? {#gripwidth-how-far-apart-are-the-hands}

- **Completa:** FXI g (ancho).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `width`.
- **Habitual:** Lo que dice la palabra de movimiento; si no, aproximadamente al ancho de los hombros.

Sobre un implemento o sobre un apoyo: una flexión de brazos en diamante tiene las manos juntas.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El ancho habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `touching` | Juntas o superpuestas | `w-t` |  |
| `narrow` | Más estrecho que el ancho de los hombros | `w-n` |  |
| `medium` | Aproximadamente al ancho de los hombros | `w-m` |  |
| `wide` | Bastante más ancho que los hombros | `w-w` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `stance`: ¿Qué separación hay entre los pies? {#stance-how-far-apart-are-the-feet}

- **Completa:** FXI g (postura de pies).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `stance`.
- **Habitual:** Lo que dice la palabra de movimiento; si no, aproximadamente al ancho de las caderas.

Solo para ejercicios de pie, y para los pies sobre la plataforma de una máquina (prensa de piernas). Una postura dividida es trabajo de pies, no postura de pies.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La postura de pies habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `narrow` | Pies juntos o más cerca que el ancho de las caderas | `st-n` | Solo cuando la posición del cuerpo al inicio es de pie, de pie inclinado hacia adelante, cualquiera de las dos o desconocida; o los pies empujan la plataforma de una máquina (prensa de piernas). |
| `medium` | Aproximadamente al ancho de las caderas | `st-m` | Solo cuando la posición del cuerpo al inicio es de pie, de pie inclinado hacia adelante, cualquiera de las dos o desconocida; o los pies empujan la plataforma de una máquina (prensa de piernas). |
| `wide` | Amplia (sumo) | `st-w` | Solo cuando la posición del cuerpo al inicio es de pie, de pie inclinado hacia adelante, cualquiera de las dos o desconocida; o los pies empujan la plataforma de una máquina (prensa de piernas). |
| `unknown` | No se sabe | `?` | Exclusiva. Solo cuando la posición del cuerpo al inicio es de pie, de pie inclinado hacia adelante, cualquiera de las dos o desconocida; o los pies empujan la plataforma de una máquina (prensa de piernas). |

#### `range.depth`: ¿Qué parte del rango usa cada repetición? {#rangedepth-how-much-of-the-range-does-each-rep-use}

- **Completa:** FXI r (rango).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `depth`.
- **Habitual:** Lo que dice la palabra de movimiento; si no, el rango habitual completo.

La altura del cajón o del step, y los pequeños cambios de ángulo, son prescripción y nunca cuentan. Un cajón sobre el que se sienta es un apoyo.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El rango habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `full` | El rango habitual completo | (sin prefijo) |  |
| `partial` | Parte del rango a propósito: medio, cuarto, pulsos | `partial` |  |
| `deep` | Más profundo de lo habitual: profundidad completa, ass to grass | `deep` |  |
| `deficit` | Más profundo de lo habitual subiéndose a algo (déficit) | `deficit` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `range.start`: ¿Dónde empieza cada repetición? {#rangestart-where-does-each-rep-start}

- **Completa:** FXI r (inicio).
- **Elegir:** una.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `start`.
- **Habitual:** El inicio habitual del movimiento.

Solo cuando no es el inicio habitual del movimiento. Un peso muerto suele empezar desde el suelo; un peso muerto rumano y un remo, desde arriba; un clean o un snatch con pesa, desde un balanceo (un dead clean empieza desde el suelo).

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El inicio habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `from-floor` | Desde el suelo, con la carga en reposo en cada repetición | `from-floor` |  |
| `from-top` | Colgado por encima de la rodilla: de pie con la carga sostenida, bajada sin apoyarla | `from-top` |  |
| `from-top.knee` | Colgado a la altura de la rodilla o por debajo | `from-top.knee` |  |
| `from-pins` | Desde soportes, bloques o un rack por encima del suelo | `from-pins` |  |
| `from-drop` | Desde una caída: bajar de un cajón y aterrizar primero (salto en profundidad) | `from-drop` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `held`: ¿Qué postura mantienen las extremidades que no trabajan? {#held-what-do-the-limbs-that-do-not-work-hold}

- **Completa:** FXI h.
- **Elegir:** una o varias.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `held`.
- **Habitual:** Lo que dice la palabra de movimiento; si no, sin postura sostenida.

Elegir cada postura sostenida con la que se hace el ejercicio, lo diga o no su nombre. Una indicación técnica ("pecho arriba") no es una postura sostenida. Las manos detrás de la cabeza sin nada cargado allí es "manos detrás de la cabeza", no la línea de tracción.

*Modo de importación:* solo a partir del nombre, mediante el léxico de importación: prisoner, pistol, arms crossed, "arms extended" o "straight arm" (brazos hacia adelante), "bent arm" o 90 degree (codos flexionados), "behind head" sin nada cargado detrás de la cabeza.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La forma habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `none` | Sin postura sostenida: las extremidades que no trabajan hacen lo que implica la palabra de movimiento (valor predeterminado, nunca se escribe). | `none` | Exclusiva. |
| `arms.oh` | Brazos extendidos por encima de la cabeza, nada en las manos. | `arms.oh` |  |
| `arms.fwd` | Brazos extendidos y dirigidos hacia adelante desde los hombros, nada en las manos ("arms extended", "straight arm"). | `arms.fwd` |  |
| `arms.side` | Brazos extendidos hacia los costados. | `arms.side` |  |
| `arms.cross` | Brazos cruzados sobre el pecho. | `arms.cross` |  |
| `hands.head` | Manos detrás de la cabeza o sobre ella (prisionero). | `hands.head` |  |
| `el.bent` | Codos que trabajan mantenidos flexionados a unos 90° ("bent arm", "90 degree"). | `el.bent` |  |
| `ua.oh` | Parte superior de los brazos elevada junto a la cabeza mientras trabajan los codos (extensión de tríceps por encima de la cabeza). | `ua.oh` |  |
| `ua.side` | Parte superior de los brazos separada de los costados, codos abiertos, mientras trabajan los codos (curl de bíceps interno, press Tate). | `ua.side` |  |
| `leg.fwd` | Pierna libre extendida al frente. | `leg.fwd` |  |
| `leg.back` | Pierna libre mantenida atrás. | `leg.back` |  |
| `legs.l` | Piernas extendidas a unos 90° de flexión de cadera. | `legs.l` |  |
| `kn.bent` | Rodillas mantenidas flexionadas mientras trabajan las caderas o los brazos (elevación de rodillas colgado; remo invertido con los pies apoyados en el suelo). | `kn.bent` |  |
| `trunk.fwd` | Tronco mantenido inclinado hacia adelante donde la orientación no lo dice ya (fondo para pecho). | `trunk.fwd` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `line`: ¿Desde dónde tira la carga, en comparación con la forma habitual? {#line-where-does-the-load-pull-from-compared-with-the-usual-way}

- **Completa:** FXI p.
- **Elegir:** una o varias.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `line`.
- **Habitual:** La línea que implica la palabra de movimiento.

Anclajes habituales: bajo para curls, elevaciones, remos al mentón, encogimientos de hombros, patadas de glúteo o tríceps (kickbacks) y trabajo de cadera; alto para extensiones de tríceps en polea (pushdowns), jalones, face pulls, crunches de rodillas y leñadores (woodchops); medio para remos, aperturas, cruces de poleas, rotaciones y presses de pecho; lateral para un press Pallof. Se responde "alto" o "bajo" solo cuando el anclaje propio difiere; un anclaje en el suelo (un trineo sobre el suelo, una banda bajo los pies) es bajo. "Low row" o "low pulley" en un nombre es una máquina, no una línea. Una barra que baja hasta el cuello o la garganta (press JM, press guillotina) y una cuerda que pasa dos veces en cada salto (double under) también son líneas.

*Modo de importación:* solo a partir del nombre, mediante el léxico de importación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La línea habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `hi` | Anclado más alto de lo habitual (de alto a bajo) | `hi` |  |
| `lo` | Anclado más bajo de lo habitual (de bajo a alto) | `lo` |  |
| `side` | Tira desde un costado: se está de lado respecto al anclaje | `side` |  |
| `behind` | La carga o el cuerpo pasan por detrás de la cabeza o del tronco (press tras nuca, dominada tras nuca) | `behind` |  |
| `neck` | La carga baja hasta el cuello, la garganta o la barbilla en lugar del pecho (press JM, press guillotina) | `neck` |  |
| `double` | Una cuerda pasa bajo los pies dos veces en cada salto (double under) | `double` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `accessory`: ¿Qué ayuda al ejercicio sin cargarlo? {#accessory-what-helps-the-exercise-without-loading-it}

- **Completa:** FXI a (extendida).
- **Elegir:** una o varias.
- **Se pregunta cuando:** se describe un ejercicio (la respuesta habitual a "subject"); y `changes` incluye `accessory`.
- **Habitual:** Lo que dice la palabra de movimiento; si no, sin accesorio.

Una correa, un cinturón, una toalla o una cuerda que se usa para tirar de una extremidad o sostenerla (una correa de estiramiento), o un compañero que sostiene, opone resistencia o asiste. Una empuñadura en un cable no es un accesorio.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La forma habitual para este movimiento | el valor predeterminado | Exclusiva. |
| `none` | Sin accesorio (valor predeterminado, nunca se escribe). | `none` | Exclusiva. |
| `strap` | Una correa, un cinturón, una toalla o una cuerda que se usa para tirar de una extremidad o sostenerla (correa de estiramiento). | `strap` |  |
| `partner` | Un compañero que sostiene, opone resistencia o asiste. | `partner` |  |

#### `eq.kind`: ¿Qué tipo de equipamiento es? {#eqkind-what-kind-of-equipment-is-it}

- **Completa:** FXE k.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Una máquina construida para un solo movimiento es una máquina de fuerza. Una columna de poleas, una máquina Smith o un landmine sirven para muchos movimientos: una estación.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `none` | Sin equipamiento: peso corporal | `none` |  |
| `imp` | Un objeto que se mueve, se sostiene o se lleva puesto | `imp` |  |
| `sup` | Una superficie o una estructura sobre la que el cuerpo se apoya, de la que cuelga o contra la que empuja | `sup` |  |
| `acc` | Una empuñadura, una correa, un cinturón, una colchoneta, una toalla o un marcador | `acc` |  |
| `stn` | Una columna de poleas, una máquina Smith o un landmine | `stn` |  |
| `mac` | Una máquina de fuerza construida para un solo movimiento | `mac` |  |
| `erg` | Una máquina de cardio | `erg` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq.form.imp`: ¿Cuál es? {#eqformimp-which-one-is-it}

- **Completa:** FXE f.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `imp`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Elegir un subtipo (superband, miniband) solo cuando se conoce. En otro caso, elegir la entrada general.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `bar.straight` | Barra, olímpica o estándar. | `bar.straight` |  |
| `bar.ez` | Barra Z. | `bar.ez` |  |
| `bar.trap` | Barra hexagonal (trap bar). | `bar.trap` |  |
| `bar.axle` | Barra axle gruesa. | `bar.axle` |  |
| `bar.camber` | Barra curvada. | `bar.camber` |  |
| `bell.dumb` | Mancuerna. | `bell.dumb` |  |
| `bell.kettle` | Pesa rusa. | `bell.kettle` |  |
| `bell.circus` | Mancuerna de circo. | `bell.circus` |  |
| `ball.med` | Balón medicinal. | `ball.med` |  |
| `ball.slam` | Balón de lanzamiento (slam ball). | `ball.slam` |  |
| `bag.sand` | Saco de arena. | `bag.sand` |  |
| `bag.heavy` | Saco de boxeo colgante. | `bag.heavy` |  |
| `plate` | Un disco sostenido o llevado por sí solo. | `plate` |  |
| `chain` | Cadena de levantamiento. | `chain` |  |
| `rope.battle` | Cuerda de batalla. | `rope.battle` |  |
| `rope.jump` | Cuerda para saltar. | `rope.jump` |  |
| `band` | Banda o tubo elástico, tipo no indicado. | `band` |  |
| `band.loop` | Banda de lazo largo: superband, power band. | `band.loop` |  |
| `band.mini` | Banda de lazo corto alrededor de las piernas: miniband. | `band.mini` |  |
| `band.tube` | Banda tubular con empuñaduras. | `band.tube` |  |
| `sled` | Trineo de arrastre o prowler, empujado o arrastrado. | `sled` |  |
| `tire` | Neumático grande. | `tire` |  |
| `hammer` | Mazo. | `hammer` |  |
| `stone` | Piedra atlas. | `stone` |  |
| `log` | Tronco de strongman. | `log` |  |
| `keg` | Barril. | `keg` |  |
| `yoke` | Yugo de strongman. | `yoke` |  |
| `frame.carry` | Empuñaduras de granjero o un marco de acarreo (rickshaw). | `frame.carry` |  |
| `car` | Un automóvil, levantado o empujado. | `car` |  |
| `wear.vest` | Chaleco lastrado. | `wear.vest` |  |
| `wear.ankle` | Tobillera lastrada. | `wear.ankle` |  |
| `club` | Clava india o maza. | `club` |  |
| `stick` | Bastón, palo de escoba o tubo de PVC. | `stick` |  |
| `wheel` | Rueda abdominal. | `wheel` |  |
| `roller.wrist` | Rodillo de muñeca. | `roller.wrist` |  |
| `harness.head` | Arnés de cabeza con una carga colgante. | `harness.head` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq.form.sup`: ¿Cuál es? {#eqformsup-which-one-is-it}

- **Completa:** FXE f.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `sup`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Elegir un subtipo (superband, miniband) solo cuando se conoce. En otro caso, elegir la entrada general.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `floor` | El suelo, o una colchoneta sobre él. | `floor` |  |
| `wall` | Una pared. | `wall` |  |
| `bench` | Un banco, plano o ajustable. | `bench` |  |
| `box` | Un cajón, un step o una plataforma. | `box` |  |
| `chair` | Una silla. | `chair` |  |
| `block` | Bloques de levantamiento desde los que parte una barra. | `block` |  |
| `rack` | Jaula de potencia o soporte de sentadilla, con sus soportes de seguridad. | `rack` |  |
| `ball.stab` | Balón de estabilidad, suizo o de ejercicio. | `ball.stab` |  |
| `dome` | BOSU, con cualquiera de los dos lados hacia arriba. | `dome` |  |
| `board.bal` | Tabla de equilibrio o de balanceo. | `board.bal` |  |
| `roller.foam` | Rodillo de espuma. | `roller.foam` |  |
| `slider` | Disco deslizante. | `slider` |  |
| `strap.susp` | Entrenador de suspensión. | `strap.susp` |  |
| `ring` | Anillas de gimnasia. | `ring` |  |
| `rope.climb` | Cuerda para trepar. | `rope.climb` |  |
| `bar.fixed` | Barra fija por encima de la cabeza: barra de dominadas. | `bar.fixed` |  |
| `bar.parallel` | Barras paralelas de fondos. | `bar.parallel` |  |
| `bar.parallette` | Paralelas bajas de suelo (parallettes). | `bar.parallette` |  |
| `pad.preacher` | Banco Scott. | `pad.preacher` |  |
| `pad.hyper` | Banco de extensiones de espalda, a 45° o 90° (también llamado silla romana para elevaciones de espalda o laterales). | `pad.hyper` |  |
| `pad.ghd` | Glute-ham developer (GHD). | `pad.ghd` |  |
| `station.vkr` | Estación vertical de elevación de rodillas (silla del capitán). | `station.vkr` |  |
| `pole` | Un poste, una columna o un montante de rack vertical agarrados con las manos. | `pole` |  |
| `ball.massage` | Pelota de masaje o de lacrosse que se hace rodar bajo el cuerpo. | `ball.massage` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq.form.acc`: ¿Cuál es? {#eqformacc-which-one-is-it}

- **Completa:** FXE f.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `acc`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Elegir un subtipo (superband, miniband) solo cuando se conoce. En otro caso, elegir la entrada general.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `handle` | Empuñadura en D individual. | `handle` |  |
| `handle.bar` | Barra de polea recta o curvada. | `handle.bar` |  |
| `handle.v` | Barra en V o empuñadura de agarre estrecho. | `handle.v` |  |
| `handle.rope` | Cuerda de tríceps. | `handle.rope` |  |
| `strap.ankle` | Tobillera para polea. | `strap.ankle` |  |
| `belt.dip` | Cinturón de fondos. | `belt.dip` |  |
| `belt.lift` | Cinturón de levantamiento. | `belt.lift` |  |
| `strap.lift` | Correas de levantamiento. | `strap.lift` |  |
| `strap.stretch` | Correa de estiramiento: una correa, un cinturón o una banda de lazo que se usa para tirar de una extremidad en un estiramiento. | `strap.stretch` |  |
| `towel` | Una toalla que se usa como empuñadura. | `towel` |  |
| `marker` | Cono, valla o marcador de suelo. | `marker` |  |
| `board.press` | Tabla apoyada en el pecho para presses parciales. | `board.press` |  |
| `mat` | Colchoneta de suelo. | `mat` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq.form.stn`: ¿Cuál es? {#eqformstn-which-one-is-it}

- **Completa:** FXE f.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `stn`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Elegir un subtipo (superband, miniband) solo cuando se conoce. En otro caso, elegir la entrada general.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `cable` | Columna de poleas, cruce de poleas o entrenador funcional: una polea que se ajusta para cada ejercicio. | `cable` |  |
| `smith` | Máquina Smith: una barra sobre guías fijas. | `smith` |  |
| `landmine` | Landmine: un extremo de una barra en un pivote de suelo (también un remo en T en una esquina). | `landmine` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq.mac.motion`: ¿Qué guía la máquina? {#eqmacmotion-what-does-the-machine-guide}

- **Completa:** FXE m (mac).
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Responder según la máquina tal como está construida, no según el ejercicio que se hace en ella. Una elevación de talones hecha en una prensa de piernas usa una prensa de piernas: se responde "empuja hacia afuera". Un pivote alineado con una articulación es una máquina monoarticular.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `push` | *Multiarticular:* Empuja hacia afuera: una máquina multiarticular de press o de sentadilla |  |  |
| `pull` | Tira hacia el cuerpo: una máquina multiarticular de remo, de jalón o de peso muerto |  |  |
| `assist` | Ayuda a elevar el cuerpo: una máquina de dominadas o fondos asistidos |  |  |
| `kn.flex` | *Pivota en una articulación:* La rodilla se flexiona (curl de piernas) | `kn.flex` |  |
| `kn.ext` | La rodilla se extiende (extensión de piernas) | `kn.ext` |  |
| `el.flex` | El codo se flexiona (máquina de curl) | `el.flex` |  |
| `el.ext` | El codo se extiende (máquina de tríceps) | `el.ext` |  |
| `sh.hadd` | Los brazos se juntan por delante (pec deck) | `sh.hadd` |  |
| `sh.habd` | Los brazos se separan (máquina de deltoides posterior) | `sh.habd` |  |
| `sh.abd` | Los brazos se elevan hacia los costados (máquina de elevaciones laterales) | `sh.abd` |  |
| `sh.ext` | Los brazos tiran hacia abajo desde el frente (máquina de pullover) | `sh.ext` |  |
| `sh.flex` | Los brazos se elevan hacia adelante | `sh.flex` |  |
| `sh.add` | Los brazos tiran hacia abajo desde los costados | `sh.add` |  |
| `sh.ir` | El hombro rota hacia adentro | `sh.ir` |  |
| `sh.er` | El hombro rota hacia afuera | `sh.er` |  |
| `sc.elev` | Encogimiento de hombros | `sc.elev` |  |
| `hip.flex` | La cadera se flexiona (máquina de elevación de piernas o de rodillas) | `hip.flex` |  |
| `hip.ext` | La cadera se extiende (patada de glúteo, hip thrust, reverse hyper) | `hip.ext` |  |
| `hip.abd` | Las piernas se separan empujando (abductor) | `hip.abd` |  |
| `hip.add` | Las piernas se juntan apretando (aductor) | `hip.add` |  |
| `sp.flex` | El tronco se flexiona (máquina de crunch abdominal) | `sp.flex` |  |
| `sp.ext` | El tronco se extiende (máquina de extensión de espalda) | `sp.ext` |  |
| `sp.rot` | El tronco gira (rotary torso) | `sp.rot` |  |
| `sp.lflex` | El tronco se flexiona lateralmente | `sp.lflex` |  |
| `ank.pf` | Subir a las puntas de los pies (máquina de elevación de talones) | `ank.pf` |  |
| `ank.df` | La punta del pie sube (máquina de tibial) | `ank.df` |  |
| `nk.flex` | El cuello se flexiona | `nk.flex` |  |
| `nk.ext` | El cuello se extiende | `nk.ext` |  |
| `nk.lflex` | El cuello se flexiona lateralmente | `nk.lflex` |  |
| `wr.flex` | La muñeca se flexiona | `wr.flex` |  |
| `wr.ext` | La muñeca se extiende | `wr.ext` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq.mac.direction`: ¿Hacia dónde se mueve la empuñadura, la almohadilla o la plataforma, respecto al tronco, durante el trabajo? {#eqmacdirection-which-way-does-the-handle-pad-or-plate-move-relative-to-your-trunk-while-you-work}

- **Completa:** FXE m (dirección de mac).
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.mac.motion` es `push` o `pull` o `assist`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Arriba es hacia la cabeza, abajo hacia los pies, adelante es alejándose de la parte delantera del tronco.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `up` | Hacia la cabeza: press de hombros, sentadilla hack, sentadilla con cinturón, máquina de peso muerto. | `up` |  |
| `down` | Hacia los pies: jalón, fondo sentado. | `down` |  |
| `fwd` | Alejándose de la parte delantera del tronco: press de pecho, prensa de piernas. | `fwd` |  |
| `back` | Hacia la parte delantera del tronco: remo. | `back` |  |
| `fwdup` | Hacia adelante y arriba: press inclinado. | `fwdup` |  |
| `fwddown` | Hacia adelante y abajo: press declinado. | `fwddown` |  |
| `backdown` | Hacia atrás y abajo: remo alto. | `backdown` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq.mac.contact`: ¿Dónde toca el cuerpo la parte móvil de la máquina? {#eqmaccontact-where-does-the-moving-part-of-the-machine-meet-your-body}

- **Completa:** FXE l (mac).
- **Elegir:** una o varias (como máximo 2).
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`.
- **Habitual:** El valor predeterminado de FXE para ese movimiento guiado (valores predeterminados de máquina de FXE), o la máquina que nombra la palabra de movimiento.

Elegir dos solo cuando ambos mueven la carga (una air bike se mueve con las manos y con los pies).

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El lugar habitual para este movimiento guiado | el valor predeterminado | Exclusiva. Solo cuando las reglas dan un contacto predeterminado para el movimiento guiado del equipamiento. |
| `hand` | Empuñaduras o una barra en las manos. | `hand` |  |
| `foot` | Una plataforma para los pies o pedales. | `foot` |  |
| `ankle` | Una almohadilla en la parte inferior de la pierna. | `ankle` |  |
| `thigh` | Una almohadilla en el muslo. | `thigh` |  |
| `knee` | Una almohadilla o una plataforma en las rodillas. | `knee` |  |
| `arm` | Una almohadilla en la parte superior del brazo o en el codo. | `arm` |  |
| `chest` | Una almohadilla en el pecho. | `chest` |  |
| `back` | Una almohadilla en la espalda. | `back` |  |
| `shoulder` | Almohadillas en los hombros. | `shoulder` |  |
| `hip` | Una almohadilla o un cinturón en las caderas. | `hip` |  |
| `head` | Una almohadilla en la cabeza. | `head` |  |
| `seat` | Un asiento móvil. | `seat` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq.mac.posture`: ¿En qué posición coloca la máquina al usuario? {#eqmacposture-what-position-does-the-machine-put-the-user-in}

- **Completa:** FXE s (mac).
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`.
- **Habitual:** El valor predeterminado de FXE para ese movimiento guiado (valores predeterminados de máquina de FXE).

Toda prensa de piernas es "recline"; las sentadillas hack, péndulo y con cinturón son "stand"; una máquina de remo dedicada es "seat.chest".

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La posición habitual para este movimiento guiado | el valor predeterminado | Exclusiva. |
| `seat` | Sentado. | `seat` |  |
| `seat.chest` | Sentado, con el pecho contra una almohadilla. | `seat.chest` |  |
| `stand` | De pie. | `stand` |  |
| `stand.chest` | De pie o inclinado hacia adelante, con el tronco sobre una almohadilla. | `stand.chest` |  |
| `prone` | Tumbado boca abajo, plano o inclinado. | `prone` |  |
| `supine` | Tumbado boca arriba. | `supine` |  |
| `recline` | Recostado sobre un respaldo inclinado (prensa de piernas). | `recline` |  |
| `kneel` | De rodillas. | `kneel` |  |
| `hang` | Sostenido por las manos o los antebrazos. | `hang` |  |
| `side` | Tumbado de lado. | `side` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq.erg.type`: ¿Qué máquina de cardio? {#eqergtype-which-cardio-machine}

- **Completa:** Capas FXE de k:erg.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `erg`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Si solo se sabe que es una bicicleta estática o una máquina de escaleras, elegir la entrada "no se conoce".

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `treadmill` | Caminadora | `treadmill` |  |
| `stepmill` | Stepmill (escaleras giratorias) | `stepmill` |  |
| `stepper` | Stepper (pedales) | `stepper` |  |
| `stair` | Máquina de escaleras, stepper o stepmill, no se conoce | `stair` |  |
| `bike-upright` | Bicicleta vertical o de spinning | `bike-upright` |  |
| `bike-recumbent` | Bicicleta reclinada | `bike-recumbent` |  |
| `bike` | Bicicleta estática, vertical o reclinada, no se conoce | `bike` |  |
| `air-bike` | Air bike (brazos móviles) | `air-bike` |  |
| `elliptical` | Elíptica | `elliptical` |  |
| `rower` | Remo | `rower` |  |
| `ski` | Ski erg | `ski` |  |
| `ube` | Ergómetro de tren superior (manivelas, sentado) | `ube` |  |
| `vertical-climber` | Escalador vertical | `vertical-climber` |  |
| `ladder-climber` | Escalador de escalera | `ladder-climber` |  |
| `unknown` | Una máquina de cardio de un tipo que no se conoce | `?` | Exclusiva. |

#### `eq.details`: ¿Se registra cómo está construido (resistencia, guiado, ángulo, diseño)? {#eqdetails-do-you-want-to-record-how-it-is-built-drive-track-angle-design}

- **Completa:** Capas extendidas de FXE.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `imp` o `sup` o `stn` o `mac` o `erg`.
- **Habitual:** Sin detalles de construcción.

Estos detalles van solo en el registro de equipamiento. Las filas de ejercicio nunca los llevan.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No (la forma habitual) | el valor predeterminado | Exclusiva. |
| `yes` | Sí |  |  |

#### `eq.drive`: ¿Qué opone resistencia al movimiento? {#eqdrive-what-resists-the-movement}

- **Completa:** FXE r.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.details` es `yes`; y `eq.kind` es `imp` o `stn` o `mac` o `erg`.
- **Habitual:** No indicado.

Dejarlo en lo habitual si no se está seguro. Una forma que implica su resistencia (una mancuerna es peso libre) nunca lo necesita.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `grav` | Peso libre bajo la gravedad. | `grav` |  |
| `stack` | Torre de placas con selector. | `stack` |  |
| `plate` | Carga con discos. | `plate` |  |
| `elastic` | Elástica. | `elastic` |  |
| `air` | Ventilador de aire. | `air` |  |
| `mag` | Freno magnético. | `mag` |  |
| `water` | Tanque de agua. | `water` |  |
| `motor` | Motor. | `motor` |  |
| `friction` | Fricción. | `friction` |  |
| `hydraulic` | Hidráulica. | `hydraulic` |  |
| `flywheel` | Volante de inercia (isoinercial). | `flywheel` |  |
| `none` | Sin resistencia propia. | `none` |  |

#### `eq.constraint`: ¿Cómo se guía la parte móvil? {#eqconstraint-how-is-the-moving-part-guided}

- **Completa:** FXE c (mac, stn).
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.details` es `yes`; y `eq.kind` es `stn` o `mac`.
- **Habitual:** No indicado.

"Lever" o "leverage" en el nombre de una máquina significa una palanca sobre un pivote. "Sled" significa una guía recta.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `line` | Una guía recta (carro, rieles). | `line` |  |
| `arc` | Una palanca sobre un pivote. | `arc` |  |
| `link` | Un mecanismo articulado de varios pivotes. | `link` |  |
| `cable` | Un cable sobre poleas. | `cable` |  |
| `pivot` | Un extremo en un pivote de suelo. | `pivot` |  |

#### `eq.compliance`: ¿Se mueve bajo el cuerpo? {#eqcompliance-does-it-move-under-the-body}

- **Completa:** FXE c (imp, sup).
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.details` es `yes`; y `eq.kind` es `imp` o `sup`.
- **Habitual:** No indicado.

Un balón de estabilidad se inclina, una rueda abdominal rueda. Una forma que lo implica nunca lo necesita.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `tilt` | Se inclina bajo el cuerpo. | `tilt` |  |
| `roll` | Rueda. | `roll` |  |
| `slide` | Se desliza. | `slide` |  |
| `swing` | Cuelga y se balancea. | `swing` |  |

#### `eq.angle`: ¿Con qué ángulo está colocada la guía o la palanca? {#eqangle-at-what-angle-is-the-track-or-lever-set}

- **Completa:** FXE g.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.details` es `yes`; y `eq.kind` es `mac`.
- **Habitual:** No indicado.

Solo la geometría fija: una prensa de piernas a 45° es inclinada.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `incl` | Inclinada (prensa de piernas a 45°). | `incl` |  |
| `horiz` | Horizontal. | `horiz` |  |
| `vert` | Vertical. | `vert` |  |

#### `eq.attrs`: ¿Qué características de diseño tiene? {#eqattrs-which-design-features-does-it-have}

- **Completa:** FXE a.
- **Elegir:** una o varias.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.details` es `yes`; y `eq.kind` es `stn` o `mac`.
- **Habitual:** Ninguno indicado.

Elegir todas las que correspondan.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Ninguno indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `iso` | Brazos independientes (isolateral). | `iso` |  |
| `conv` | Trayectoria convergente. | `conv` |  |
| `cb` | Contrapesada (Smith). | `cb` |  |
| `dual` | Dos torres de placas. | `dual` |  |

#### `eq.more`: ¿Puede configurarse la máquina como una segunda máquina (multicadera, pec deck con brazos para deltoides posterior, jalón con remo bajo)? {#eqmore-can-the-machine-be-set-up-as-a-second-machine-multi-hip-pec-deck-with-rear-delt-arms-pulldown-with-low-row}

- **Completa:** Combinación FXE (";").
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`.
- **Habitual:** No.

Responder las preguntas de la máquina una vez más para la segunda configuración.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No (la forma habitual) | el valor predeterminado | Exclusiva. |
| `yes` | Sí |  |  |

#### `eq2.mac.motion`: ¿Qué guía la máquina? {#eq2macmotion-what-does-the-machine-guide}

- **Completa:** FXE m (mac).
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.more` es `yes`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Responder según la máquina tal como está construida, no según el ejercicio que se hace en ella. Una elevación de talones hecha en una prensa de piernas usa una prensa de piernas: se responde "empuja hacia afuera". Un pivote alineado con una articulación es una máquina monoarticular.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `push` | *Multiarticular:* Empuja hacia afuera: una máquina multiarticular de press o de sentadilla |  |  |
| `pull` | Tira hacia el cuerpo: una máquina multiarticular de remo, de jalón o de peso muerto |  |  |
| `assist` | Ayuda a elevar el cuerpo: una máquina de dominadas o fondos asistidos |  |  |
| `kn.flex` | *Pivota en una articulación:* La rodilla se flexiona (curl de piernas) | `kn.flex` |  |
| `kn.ext` | La rodilla se extiende (extensión de piernas) | `kn.ext` |  |
| `el.flex` | El codo se flexiona (máquina de curl) | `el.flex` |  |
| `el.ext` | El codo se extiende (máquina de tríceps) | `el.ext` |  |
| `sh.hadd` | Los brazos se juntan por delante (pec deck) | `sh.hadd` |  |
| `sh.habd` | Los brazos se separan (máquina de deltoides posterior) | `sh.habd` |  |
| `sh.abd` | Los brazos se elevan hacia los costados (máquina de elevaciones laterales) | `sh.abd` |  |
| `sh.ext` | Los brazos tiran hacia abajo desde el frente (máquina de pullover) | `sh.ext` |  |
| `sh.flex` | Los brazos se elevan hacia adelante | `sh.flex` |  |
| `sh.add` | Los brazos tiran hacia abajo desde los costados | `sh.add` |  |
| `sh.ir` | El hombro rota hacia adentro | `sh.ir` |  |
| `sh.er` | El hombro rota hacia afuera | `sh.er` |  |
| `sc.elev` | Encogimiento de hombros | `sc.elev` |  |
| `hip.flex` | La cadera se flexiona (máquina de elevación de piernas o de rodillas) | `hip.flex` |  |
| `hip.ext` | La cadera se extiende (patada de glúteo, hip thrust, reverse hyper) | `hip.ext` |  |
| `hip.abd` | Las piernas se separan empujando (abductor) | `hip.abd` |  |
| `hip.add` | Las piernas se juntan apretando (aductor) | `hip.add` |  |
| `sp.flex` | El tronco se flexiona (máquina de crunch abdominal) | `sp.flex` |  |
| `sp.ext` | El tronco se extiende (máquina de extensión de espalda) | `sp.ext` |  |
| `sp.rot` | El tronco gira (rotary torso) | `sp.rot` |  |
| `sp.lflex` | El tronco se flexiona lateralmente | `sp.lflex` |  |
| `ank.pf` | Subir a las puntas de los pies (máquina de elevación de talones) | `ank.pf` |  |
| `ank.df` | La punta del pie sube (máquina de tibial) | `ank.df` |  |
| `nk.flex` | El cuello se flexiona | `nk.flex` |  |
| `nk.ext` | El cuello se extiende | `nk.ext` |  |
| `nk.lflex` | El cuello se flexiona lateralmente | `nk.lflex` |  |
| `wr.flex` | La muñeca se flexiona | `wr.flex` |  |
| `wr.ext` | La muñeca se extiende | `wr.ext` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq2.mac.direction`: ¿Hacia dónde se mueve la empuñadura, la almohadilla o la plataforma, respecto al tronco, durante el trabajo? {#eq2macdirection-which-way-does-the-handle-pad-or-plate-move-relative-to-your-trunk-while-you-work}

- **Completa:** FXE m (dirección de mac).
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.more` es `yes`; y `eq2.mac.motion` es `push` o `pull` o `assist`.
- **Habitual:** sin valor predeterminado publicado; la respuesta define el valor

Arriba es hacia la cabeza, abajo hacia los pies, adelante es alejándose de la parte delantera del tronco.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `up` | Hacia la cabeza: press de hombros, sentadilla hack, sentadilla con cinturón, máquina de peso muerto. | `up` |  |
| `down` | Hacia los pies: jalón, fondo sentado. | `down` |  |
| `fwd` | Alejándose de la parte delantera del tronco: press de pecho, prensa de piernas. | `fwd` |  |
| `back` | Hacia la parte delantera del tronco: remo. | `back` |  |
| `fwdup` | Hacia adelante y arriba: press inclinado. | `fwdup` |  |
| `fwddown` | Hacia adelante y abajo: press declinado. | `fwddown` |  |
| `backdown` | Hacia atrás y abajo: remo alto. | `backdown` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq2.mac.contact`: ¿Dónde toca el cuerpo la parte móvil de la máquina? {#eq2maccontact-where-does-the-moving-part-of-the-machine-meet-your-body}

- **Completa:** FXE l (mac).
- **Elegir:** una o varias (como máximo 2).
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.more` es `yes`.
- **Habitual:** El valor predeterminado de FXE para ese movimiento guiado (valores predeterminados de máquina de FXE), o la máquina que nombra la palabra de movimiento.

Elegir dos solo cuando ambos mueven la carga (una air bike se mueve con las manos y con los pies).

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | El lugar habitual para este movimiento guiado | el valor predeterminado | Exclusiva. Solo cuando las reglas dan un contacto predeterminado para el movimiento guiado de la segunda configuración. |
| `hand` | Empuñaduras o una barra en las manos. | `hand` |  |
| `foot` | Una plataforma para los pies o pedales. | `foot` |  |
| `ankle` | Una almohadilla en la parte inferior de la pierna. | `ankle` |  |
| `thigh` | Una almohadilla en el muslo. | `thigh` |  |
| `knee` | Una almohadilla o una plataforma en las rodillas. | `knee` |  |
| `arm` | Una almohadilla en la parte superior del brazo o en el codo. | `arm` |  |
| `chest` | Una almohadilla en el pecho. | `chest` |  |
| `back` | Una almohadilla en la espalda. | `back` |  |
| `shoulder` | Almohadillas en los hombros. | `shoulder` |  |
| `hip` | Una almohadilla o un cinturón en las caderas. | `hip` |  |
| `head` | Una almohadilla en la cabeza. | `head` |  |
| `seat` | Un asiento móvil. | `seat` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq2.mac.posture`: ¿En qué posición coloca la máquina al usuario? {#eq2macposture-what-position-does-the-machine-put-the-user-in}

- **Completa:** FXE s (mac).
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.more` es `yes`.
- **Habitual:** El valor predeterminado de FXE para ese movimiento guiado (valores predeterminados de máquina de FXE).

Toda prensa de piernas es "recline"; las sentadillas hack, péndulo y con cinturón son "stand"; una máquina de remo dedicada es "seat.chest".

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | La posición habitual para este movimiento guiado | el valor predeterminado | Exclusiva. |
| `seat` | Sentado. | `seat` |  |
| `seat.chest` | Sentado, con el pecho contra una almohadilla. | `seat.chest` |  |
| `stand` | De pie. | `stand` |  |
| `stand.chest` | De pie o inclinado hacia adelante, con el tronco sobre una almohadilla. | `stand.chest` |  |
| `prone` | Tumbado boca abajo, plano o inclinado. | `prone` |  |
| `supine` | Tumbado boca arriba. | `supine` |  |
| `recline` | Recostado sobre un respaldo inclinado (prensa de piernas). | `recline` |  |
| `kneel` | De rodillas. | `kneel` |  |
| `hang` | Sostenido por las manos o los antebrazos. | `hang` |  |
| `side` | Tumbado de lado. | `side` |  |
| `unknown` | No se sabe | `?` | Exclusiva. |

#### `eq2.details`: ¿Se registra cómo está construido (resistencia, guiado, ángulo, diseño)? {#eq2details-do-you-want-to-record-how-it-is-built-drive-track-angle-design}

- **Completa:** Capas extendidas de FXE.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.more` es `yes`; y `eq.kind` es `imp` o `sup` o `stn` o `mac` o `erg`.
- **Habitual:** Sin detalles de construcción.

Estos detalles van solo en el registro de equipamiento. Las filas de ejercicio nunca los llevan.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No (la forma habitual) | el valor predeterminado | Exclusiva. |
| `yes` | Sí |  |  |

#### `eq2.drive`: ¿Qué opone resistencia al movimiento? {#eq2drive-what-resists-the-movement}

- **Completa:** FXE r.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.more` es `yes`; y `eq2.details` es `yes`; y `eq.kind` es `imp` o `stn` o `mac` o `erg`.
- **Habitual:** No indicado.

Dejarlo en lo habitual si no se está seguro. Una forma que implica su resistencia (una mancuerna es peso libre) nunca lo necesita.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `grav` | Peso libre bajo la gravedad. | `grav` |  |
| `stack` | Torre de placas con selector. | `stack` |  |
| `plate` | Carga con discos. | `plate` |  |
| `elastic` | Elástica. | `elastic` |  |
| `air` | Ventilador de aire. | `air` |  |
| `mag` | Freno magnético. | `mag` |  |
| `water` | Tanque de agua. | `water` |  |
| `motor` | Motor. | `motor` |  |
| `friction` | Fricción. | `friction` |  |
| `hydraulic` | Hidráulica. | `hydraulic` |  |
| `flywheel` | Volante de inercia (isoinercial). | `flywheel` |  |
| `none` | Sin resistencia propia. | `none` |  |

#### `eq2.constraint`: ¿Cómo se guía la parte móvil? {#eq2constraint-how-is-the-moving-part-guided}

- **Completa:** FXE c (mac, stn).
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.more` es `yes`; y `eq2.details` es `yes`; y `eq.kind` es `stn` o `mac`.
- **Habitual:** No indicado.

"Lever" o "leverage" en el nombre de una máquina significa una palanca sobre un pivote. "Sled" significa una guía recta.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `line` | Una guía recta (carro, rieles). | `line` |  |
| `arc` | Una palanca sobre un pivote. | `arc` |  |
| `link` | Un mecanismo articulado de varios pivotes. | `link` |  |
| `cable` | Un cable sobre poleas. | `cable` |  |
| `pivot` | Un extremo en un pivote de suelo. | `pivot` |  |

#### `eq2.compliance`: ¿Se mueve bajo el cuerpo? {#eq2compliance-does-it-move-under-the-body}

- **Completa:** FXE c (imp, sup).
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.more` es `yes`; y `eq2.details` es `yes`; y `eq.kind` es `imp` o `sup`.
- **Habitual:** No indicado.

Un balón de estabilidad se inclina, una rueda abdominal rueda. Una forma que lo implica nunca lo necesita.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `tilt` | Se inclina bajo el cuerpo. | `tilt` |  |
| `roll` | Rueda. | `roll` |  |
| `slide` | Se desliza. | `slide` |  |
| `swing` | Cuelga y se balancea. | `swing` |  |

#### `eq2.angle`: ¿Con qué ángulo está colocada la guía o la palanca? {#eq2angle-at-what-angle-is-the-track-or-lever-set}

- **Completa:** FXE g.
- **Elegir:** una.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.more` es `yes`; y `eq2.details` es `yes`; y `eq.kind` es `mac`.
- **Habitual:** No indicado.

Solo la geometría fija: una prensa de piernas a 45° es inclinada.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | No indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `incl` | Inclinada (prensa de piernas a 45°). | `incl` |  |
| `horiz` | Horizontal. | `horiz` |  |
| `vert` | Vertical. | `vert` |  |

#### `eq2.attrs`: ¿Qué características de diseño tiene? {#eq2attrs-which-design-features-does-it-have}

- **Completa:** FXE a.
- **Elegir:** una o varias.
- **Se pregunta cuando:** se describe una pieza de equipamiento por sí sola; y `eq.kind` es `mac`; y `eq.more` es `yes`; y `eq2.details` es `yes`; y `eq.kind` es `stn` o `mac`.
- **Habitual:** Ninguno indicado.

Elegir todas las que correspondan.

| Opción | Significa | Escribe | Nota |
|---|---|---|---|
| `usual` | Ninguno indicado (la forma habitual) | el valor predeterminado | Exclusiva. |
| `iso` | Brazos independientes (isolateral). | `iso` |  |
| `conv` | Trayectoria convergente. | `conv` |  |
| `cb` | Contrapesada (Smith). | `cb` |  |
| `dual` | Dos torres de placas. | `dual` |  |
<!-- /fds:generated -->
