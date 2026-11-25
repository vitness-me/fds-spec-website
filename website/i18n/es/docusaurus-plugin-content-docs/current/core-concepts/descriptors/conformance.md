---
title: 'Conformidad'
sidebar_label: 'Conformidad'
description: 'Borrador de los vectores de conformidad de FXI, FXE y FXM en cuatro niveles, y de los informes de mediciones que los acompañan'
sidebar_position: 7
---

# Conformidad

:::caution Borrador
No es normativo hasta que se acepte el [RFC-010](/docs/specifications/rfc-010-structural-descriptors), que adopta los descriptores estructurales. El RFC-010 es un borrador. Véase [la visión general](./overview.md).
:::

Una implementación de FXI, FXE y FXM es conforme cuando supera, al 100%, todos los vectores de prueba publicados de cada nivel que usa su rol. Los vectores son datos: cada uno es una entrada y una salida esperada, de modo que cualquier implementación, en cualquier lenguaje, ejecuta los mismos archivos a través de un pequeño adaptador propio.

Qué niveles debe superar una implementación lo fija [la sección de conformidad del RFC-010](/docs/specifications/rfc-010-structural-descriptors#conformance):

| Una implementación que | Supera los niveles |
|---|---|
| lee, valida y canonicaliza cadenas | `syntax` |
| construye cadenas a partir de registros de respuestas | `syntax`, `builder` |
| compara cadenas y busca coincidencias (un resolvedor) | `syntax`, `compare`, `resolver` |

Un resolvedor no construye cadenas, así que no se le exige superar el nivel `builder`.

**Lo que demuestra superarlos.** Cada salida esperada es lo que el codificador de referencia calcula para esa entrada. Superar los vectores demuestra que una implementación concuerda con la referencia; no demuestra que la referencia sea correcta. Una regla que la referencia aplica mal, los vectores la aplican mal con ella, y se corrige en ambos bajo una nueva revisión de reglas. Hasta ahora, la referencia es la única implementación que los ha ejecutado.

La conformidad dice que una implementación calcula lo que dice la especificación. No dice que las personas, o los programas, que responden el flujo de preguntas describan los ejercicios con precisión. Eso no puede certificarse. En su lugar se mide, y se publica como [informes](#measured-not-certified).

## Los niveles {#the-tiers}

<!-- fds:generated conformance#tiers -->
| Nivel | Vectores | Archivo | Datos que lee |
|---|---|---|---|
| `syntax` | 143 | [`syntax.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/syntax.json) | [`fxm-vocabulary.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/fxm-vocabulary.json) |
| `builder` | 29 | [`builder.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/builder.json) | [`words.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/words.json) |
| `compare` | 64 | [`compare.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/compare.json) | [`fxm-vocabulary.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/fxm-vocabulary.json) |
| `resolver` | 43 | [`resolver.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/resolver.json) | (ninguno) |
<!-- /fds:generated -->

Cada archivo de nivel nombra, en `rules`, la revisión de reglas para la que se escribieron sus vectores. Un conjunto de vectores es válido solo para esa revisión de reglas: cuando los registros pasan a una nueva, los vectores se revisan contra ella antes de que cambie `rules`.

Cada vector tiene un `id`, único dentro de su nivel, y una `note` que dice qué prueba. La nota es para las personas; un adaptador la ignora.

### Sintaxis {#syntax}

Cada vector da un `kind` (`fxi`, `fxe` o `fxm`) y una cadena `input`.

- Un vector **válido** espera `{"valid": true, "canonical": …}`: la entrada es válida y esta es su [forma canónica](./fxi.md#canonical-form). Donde también da `standard`, esa es la proyección estándar: la misma cadena sin ninguna capa extendida y con la bandera `S`.
- Un vector **inválido** espera `{"valid": false, "issues": […]}`: exactamente este conjunto de códigos de problema, ordenado. Cada vector rompe una regla, y enumera un segundo código solo donde romper esa regla rompe necesariamente otra. Un comprobador informa todos los problemas que encuentra, así que debe informarlos todos y ningún otro.
- Un vector `fxm` comprueba solo el formato de la clave, salvo que esté marcado `"vocabulary": true`. Entonces la clave también se comprueba contra [`fxm-vocabulary.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/fxm-vocabulary.json), un vocabulario inventado cuyos tokens no nombran ningún músculo real. FDS no publica ninguna lista de músculos; ese archivo existe solo para probar la gramática de la clave.

Los códigos de problema:

<!-- fds:generated conformance#codes -->
| Código | Se informa cuando |
|---|---|
| `prefix` | La cadena no empieza con la cabecera del descriptor (`FXI=`, `FXE=` o `FXM=`, y luego la versión). |
| `no-rev` | La cabecera tiene versión mayor pero no revisión de sintaxis (`FXI=1/`): un borrador previo al lanzamiento. |
| `major` | Una versión mayor distinta de `1`. |
| `rev` | Una revisión de sintaxis más reciente de las que conoce el comprobador, o escrita con un cero a la izquierda. |
| `unknown-layer` | Una letra de capa que el descriptor no tiene o, en FXE, una que el tipo no admite. |
| `duplicate-layer` | Una capa escrita dos veces. |
| `empty` | Una capa, o un elemento de apoyo, sin valor. |
| `missing-motion` | Un FXI sin la capa de movimiento `m`. |
| `generic-motion` | `m:*`: el movimiento no puede ser genérico. |
| `part-unknown` | Una fase de movimiento con varias partes `\|`, una de ellas `?`. |
| `empty-phase` | Una fase de movimiento sin acción articular. |
| `two-prefixes` | Una parte de movimiento con más de un prefijo de fase. |
| `zero` | `0` en cualquier lugar que no sea `=0` o `~0`. |
| `open-hedge` | El `+?` abierto en una fase de movimiento. |
| `unknown-action` | Un elemento de movimiento que no es una acción articular, una articulación con `?` o una articulación que hace círculos con `.circ`. |
| `short-suffix` | El sufijo de impulso corto `-` en algo que no sea una acción articular con nombre. |
| `opposite-actions` | Dos acciones opuestas en una misma parte de una fase. |
| `unknown-code` | Un código que no está en su vocabulario: una orientación, un extremo móvil, un trabajo de pies, una postura sostenida, una línea o un accesorio, o un valor de FXE. |
| `unknown-surface` | Una superficie de apoyo que no es un token de apoyo. |
| `unknown-point` | Un punto corporal que no está en el vocabulario de puntos corporales. |
| `unknown-implement` | Un token de carga que no es un token de equipamiento. |
| `support-as-load` | Un token de apoyo escrito como carga. |
| `count` | Una cantidad de implementos distinta de `1` a `4`. |
| `unknown-hold` | Un punto de sujeción que no es ni un punto corporal ni un punto solo de sujeción. |
| `bw-hold` | `bw` con un punto de sujeción o una cantidad. |
| `missing-hold` | Un implemento sin punto de sujeción. |
| `unknown-symmetry` | Un código de simetría que no está en el vocabulario. |
| `unknown-scope` | Un alcance de simetría distinto de `arms` o `legs`. |
| `symmetry-conflict` | Más de un código de simetría sin alcances, o dos para un mismo alcance. |
| `st-sp` | `st-sp` en `g`: la postura dividida es trabajo de pies, `f:split`. |
| `unknown-grip` | Un elemento de agarre que no es una orientación de manos, una anchura ni una postura de pies. |
| `grip-conflict` | Más de una orientación de manos, anchura o postura de pies en una misma fase de agarre. |
| `unknown-range` | Un código de rango que no está en el vocabulario. |
| `range-conflict` | Dos posiciones de inicio, o `partial` con `deep`. |
| `unknown-alone` | `?` combinado con otros códigos en `h`, `p` o `a`. |
| `conflict` | Un código predeterminado combinado con otros, o dos códigos marcados "nunca con". |
| `missing-kind` | Una configuración de FXE que no empieza con `k`. |
| `kind-unknown` | `k:?` con otras capas. |
| `unknown-kind` | Un tipo de FXE que no está en el vocabulario. |
| `form-kind` | Una forma de FXE escrita bajo un tipo al que no pertenece. |
| `combo` | Una combinación que une `k:none` o `k:?`. |
| `token` | Un cuerpo de FXM que no es `<muscle>`, `<muscle>.<part>` ni `g:<group>` en kebab-case en minúsculas. |
| `unknown-muscle` | Un músculo de FXM que el vocabulario no define. |
| `unknown-part` | Una parte de FXM que el músculo no tiene en el vocabulario. |
| `unknown-group` | Un grupo de FXM que el vocabulario no define. |
<!-- /fds:generated -->

### Constructor {#builder}

Cada vector da un registro de respuestas, `entry`, tal como lo define [el flujo de preguntas](./question-flow.md#the-answers-record), y opcionalmente un `mode` (`owner` cuando está ausente). La implementación lo construye según el flujo de preguntas publicado, con [`words.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/words.json) como conjunto de datos de palabras de movimiento.

Ese conjunto de datos está escrito para estos vectores y para nada más. Las palabras de movimiento son datos de catálogo y FDS no publica ninguna; estas pocas permiten a los vectores llegar a la ruta por palabra, a los puntos de sujeción de una palabra, a una máquina de una palabra y a una pregunta de una palabra. Varios vectores codifican el mismo ejercicio de las dos formas, mediante una palabra y articulación por articulación, y esperan la misma cadena.

Un vector espera:

- `fxi`, el FXI canónico, o `null` para un equipamiento por sí solo;
- `fxe`, el FXE estándar del equipamiento principal, o del propio equipamiento;
- `fxeFull`, el FXE completo con sus detalles de construcción, solo cuando las respuestas los dieron;
- junto a un FXI, `fxiProvenance` y `fxiGap`, que lleva el registro y que nunca cambian las cadenas;

o `{"error": true}`, para respuestas que el flujo no acepta. El mensaje es propio de la implementación; solo se prueba el rechazo. Un vector de error también da `fix`, el único cambio (en `answers`, o en la propia entrada) que hace que la entrada se construya: todas las demás preguntas están respondidas, así que el vector falla por el motivo que declara y por ningún otro. Un adaptador puede ignorar `fix`; la ejecución de referencia comprueba que cada uno haga, efectivamente, que su entrada se construya.

Las cadenas deben coincidir byte a byte. Los tres [ejemplos resueltos](./question-flow.md#worked-examples) son vectores aquí, tal como se publican.

### Comparación {#compare}

Un vector `fxi` o `fxe` da dos cadenas, `a` y `b`, y espera la `relation` de conjunto y la relación de cada capa en `layers`, cada una leída como "a es … que b". Las capas son todas las capas estándar, más una capa extendida cuando ambas cadenas la llevan. Un par de FXE combinados, un par con una cadena inválida y un par de tipos mezclados no esperan capas.

Cada uno de estos vectores también se ejecuta con `a` y `b` intercambiados, esperando la inversa: `refines` y `refined-by` intercambian sus lugares, y lo mismo hacen `narrower` y `broader`. Una implementación no puede superar un par en un solo sentido.

Un vector `fxm` espera el [grado](./fxm.md#compare) sobre las hojas anatómicas de `fxm-vocabulary.json`, las hojas que comparten las dos claves, ordenadas y, para `contains`, qué lado es el `container`.

### Resolvedor {#resolver}

Cada vector da una fila `query`, una `library` de filas y opcionalmente `top`, la longitud de la lista de confirmación (3 cuando está ausente). Una fila es `{id, fxi, fxiProvenance?, mode?, fxiGap?, name?, fxe?}`. El vector espera uno de:

- `{"kind": "auto", "id": …}`, la entrada de la biblioteca enlazada sin preguntar;
- `{"kind": "confirm", "reason": …, "candidates": […]}`, el motivo por el que se rechazó la coincidencia automática y la lista ordenada. Cada candidato dice cómo entró en la lista: `{"via": "fxi", "relation": …}`, `{"via": "near", "layer": …}` con la única capa estándar que difiere, o `{"via": "name"}`;
- `{"kind": "absent"}`, solo cuando la biblioteca está vacía.

El orden es el de [el protocolo de coincidencia](./compare-and-match.md#provenance-match-and-versioning). Ningún vector tiene dos motivos de rechazo a la vez, así que no se prueba el orden en que una implementación los comprueba. Los motivos:

<!-- fds:generated conformance#reasons -->
| Motivo | Significa |
|---|---|
| `no-identical` | Ninguna entrada de la biblioteca es idéntica a la consulta. |
| `several-identical` | Más de una entrada de la biblioteca es idéntica a la consulta. |
| `query-gap` | La consulta lleva un marcador de laguna. |
| `entry-gap` | La entrada idéntica de la biblioteca lleva un marcador de laguna. |
| `query-import` | La consulta es una fila en modo de importación. |
| `entry-import` | La entrada idéntica de la biblioteca es una fila en modo de importación. |
| `query-not-owner` | La consulta no tiene procedencia owner ni owner-assisted. |
| `entry-not-owner` | La entrada idéntica de la biblioteca no tiene procedencia owner ni owner-assisted. |
| `fxe-differs` | Tanto la consulta como la entrada idéntica de la biblioteca llevan un FXE, y los dos no se comparan como idénticos. |
<!-- /fds:generated -->

## Ejecutar los vectores {#running-the-vectors}

Los archivos son JSON plano. Para probar una implementación, escribir un adaptador que lea cada archivo de nivel, ejecute cada vector a través de la implementación y compare el resultado con `expect` como valores JSON: el orden de las claves de un objeto no importa, el orden de una lista sí.

El codificador de referencia, [`@vitness/fds-encoder`](https://github.com/vitness-me/fds-spec-website/tree/main/packages/fds-encoder), se ejecuta contra todos los vectores en cada cambio de este repositorio, y debe superar cada nivel al 100%. La misma ejecución comprueba la propia suite: que cada archivo de nivel nombre la revisión de reglas actual, que cada código de problema y cada motivo que define lo espere algún vector, que sus motivos sean exactamente los que puede devolver la referencia, y que el `fix` de cada vector de error del constructor haga que su entrada se construya.

## Medido, no certificado {#measured-not-certified}

Los niveles anteriores tienen una única respuesta correcta por vector. Dos cosas que importan igual no la tienen, y FDS las publica como mediciones, con su método, en lugar de como un aprobado o un suspenso:

- **Concordancia entre codificadores.** Cuando distintas personas, o distintos programas, responden el flujo de preguntas para el mismo ejercicio sin ver las respuestas de los demás, con qué frecuencia sus cadenas son `identical`, y cómo se reparten los pares restantes entre `refines`, `compatible` y `contradicting`, por capa.
- **Resultados de los adoptantes.** Cuando un catálogo que ha codificado sus propios ejercicios se compara con otro, cuántas de sus filas se enlazan automáticamente, cuántas listas de confirmación contienen la entrada correcta y en qué posición, cuántas no contienen ninguna, y cuántos enlaces automáticos rechaza después una persona.

Ninguna de las dos es un umbral que deba alcanzar una implementación o un catálogo. Dicen hasta qué punto se puede confiar en los descriptores, para que un adoptante pueda decidir cuánto del paso de confirmación conservar.

:::note
Las primeras mediciones se tomaron con la revisión de reglas 1.3, en la nueva prueba con nombres disjuntos, y se publican en el [RFC-010 §9](/docs/specifications/rfc-010-structural-descriptors#9-evidence) con su método. Los datos con los que se midieron no se publican. La calibración con codificación por personas y los resultados de los adoptantes siguen pendientes.
:::

| Informe | Resultado |
|---|---|
| Concordancia entre codificadores | Medida: [RFC-010 §9.3](/docs/specifications/rfc-010-structural-descriptors#93-separation-and-agreement). |
| Nueva prueba con nombres disjuntos | Medida: [RFC-010 §9.2](/docs/specifications/rfc-010-structural-descriptors#92-name-disjoint-re-test), con el método del §9.1. |
| Calibración con codificación por personas | Pendiente: propietarios frente a codificadores, aún no medida. |
| Resultados de los adoptantes | Pendiente: aún no medidos para esta revisión de reglas. |
