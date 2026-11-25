---
title: 'Descriptores estructurales: FXI, FXE y FXM'
sidebar_label: 'Visión general'
description: 'Borrador de los descriptores estructurales de ejercicios, equipamiento y músculos: qué son, qué publica FDS y por dónde empezar a codificar a mano'
sidebar_position: 1
---

# Descriptores estructurales: FXI, FXE y FXM

:::caution Borrador
Estas páginas describen un borrador. Nada de lo que contienen es normativo hasta que se acepte el [RFC-010](/docs/specifications/rfc-010-structural-descriptors), que adopta los descriptores estructurales. El RFC-010 es un borrador, y [su §12](/docs/specifications/rfc-010-structural-descriptors#12-open-items) enumera las condiciones para aceptarlo. Los vocabularios se versionan por revisión de reglas, por separado de los esquemas de entidades. El lanzamiento 1.6.0, propuesto con el RFC-010, lleva estos campos en exercise 1.2.0, equipment 1.2.0 y muscle 1.1.0; se publica cuando se acepte el RFC-010.
:::

Un descriptor estructural es una cadena corta que dice cómo se hace un ejercicio, qué es una pieza de equipamiento o a qué músculo se refiere, con un vocabulario cerrado en lugar de con palabras. Dos catálogos que describen el mismo ejercicio en idiomas distintos, con nombres distintos, pueden escribir de todos modos el mismo descriptor, y el software puede comparar las dos cadenas sin leer ninguno de los dos nombres.

| Descriptor | Describe | Aspecto |
|---|---|---|
| **FXI** | Un ejercicio: su movimiento, la posición del cuerpo, el apoyo, la carga, los lados, el agarre, el rango, la postura sostenida y la línea de tracción. | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` |
| **FXE** | Una pieza de equipamiento, por su estructura: tipo, forma y, en una máquina, su interfaz de carga, la postura y el movimiento guiado. | `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back` |
| **FXM** | Un músculo, una parte de uno o un grupo de músculos, anclado a una ontología anatómica abierta. | `FXM=1.0/latissimus-dorsi` |

El primer ejemplo es una sentadilla trasera con barra; el segundo, la máquina en la que se hace un remo sentado en polea.

## Qué es un descriptor y qué no es {#what-a-descriptor-is-and-what-it-is-not}

FXI es un **descriptor**, no una identidad. Es determinista en dos sentidos: las mismas respuestas siempre construyen la misma cadena, y las mismas dos cadenas siempre se comparan de la misma forma. No hace que dos personas que describen el mismo ejercicio escriban siempre la misma cadena. Las personas declaran los detalles opcionales de forma distinta, y el vocabulario no puede decirlo todo.

Por eso este estándar afirma exactamente esto: **un descriptor y una comparación deterministas; coincidencia automática ante claves idénticas y únicas; confirmación con un clic en otro caso; el enlace confirmado se almacena.**

- Dos cadenas que se comparan como `identical` describen la misma estructura. La comparación nunca informa como idénticas dos cadenas distintas.
- Cuando una biblioteca contiene exactamente una entrada idéntica a la consulta, ambos lados los respondieron sus propietarios y ninguno lleva un marcador de laguna, el software puede enlazarlos sin preguntar.
- En otro caso, ofrece una lista corta y ordenada para que una persona la confirme, y almacena el enlace confirmado.

Las filas leídas de otro catálogo sin su propietario (modo de importación) sirven solo para buscar candidatos. Este estándar no afirma nada sobre su precisión, y nunca se enlazan sin una persona.

## Qué publica FDS y qué no {#what-fds-publishes-and-what-it-does-not}

FDS es un estándar, no un catálogo. Publica:

- la **sintaxis** de cada cadena, su forma canónica y las reglas que deciden cada capa;
- los **vocabularios clasificadores**: acciones articulares, orientaciones, puntos corporales, simetría, agarre y postura de pies, rango, posturas sostenidas y líneas de tracción para FXI; tipos, formas, accionamientos, interfaces, posturas, direcciones, ciclos y recorridos para FXE. Están en [`specification/registries/descriptors/`](https://github.com/vitness-me/fds-spec-website/tree/main/specification/registries/descriptors);
- el **flujo de preguntas**: las preguntas cerradas cuyas respuestas construyen un FXI y un FXE, redactadas para que una persona pueda responderlas a mano;
- la **comparación**, el **protocolo de coincidencia** y el **versionado**.

No publica:

- **palabras de movimiento.** Una palabra de movimiento ("squat", "row") es un atajo que fija de una vez la lectura habitual de todas las capas. Las palabras son datos de catálogo: un codificador carga un conjunto de datos de palabras de movimiento, y el flujo de preguntas indica dónde se conecta. Sin uno, todo ejercicio puede codificarse igualmente, describiendo su movimiento articulación por articulación. La palabra que eligió un propietario nunca viaja en la cadena; se conserva en el registro de respuestas, donde un resolvedor puede usarla como indicio para ordenar;
- **una lista de músculos.** FXM especifica el formato de la clave, cómo se ancla una clave y qué significa un grupo. Qué músculos y grupos existen es vocabulario de un proveedor;
- **un catálogo de equipamiento.** FXE clasifica la estructura. Las entradas de equipamiento de un proveedor llevan cadenas FXE; FDS no enumera productos ni modelos.

## Los campos que lleva un registro {#the-fields-a-record-carries}

Un registro que lleva un FXI lleva junto a él estos campos:

| Campo | Contiene |
|---|---|
| `fxi` | El FXI canónico. |
| `fxe` | El FXE **estándar** canónico del equipamiento principal del registro (`FXE=1.0S/…`). Las capas extendidas de FXE aparecen solo en un registro de equipamiento. |
| `fxiProvenance` | Quién respondió por el FXI: `owner`, `owner-assisted`, `agent` o `import`. Véase [RFC-010 §5.3](/docs/specifications/rfc-010-structural-descriptors#53-fxiprovenance-and-fxigap). |
| `fxiGap` | La nota en texto plano del propietario sobre lo que la notación no recoge de este ejercicio, o `null`. Un marcador de laguna bloquea la coincidencia automática. |

Los enlaces confirmados entre catálogos se almacenan en un arreglo `xrefs`, en el que cada entrada nombra el otro catálogo (`system`), el registro en él (`id`) y cómo se hizo el enlace (`link`: `auto` o `confirmed`). Un registro de equipamiento lleva su propio `fxe`, y un registro de músculo su `fxm`. El §5 del [RFC-010](/docs/specifications/rfc-010-structural-descriptors) define dónde se ubica cada campo en las entidades de ejercicio, equipamiento y músculo, y por qué `xrefs` se mantiene separado de `metadata.externalRefs`.

## Codificar a mano: por dónde empezar {#encoding-by-hand-where-to-start}

1. Leer [FXI](./fxi.md) una vez, para conocer la forma de la cadena y lo que significa cada capa.
2. Recorrer [el flujo de preguntas](./question-flow.md) desde el principio. Cada pregunta dice cuándo se hace y qué código escribe cada respuesta. Sin un conjunto de datos de palabras de movimiento, responder `other` para el movimiento y describirlo articulación por articulación.
3. Montar la cadena con [las reglas de construcción](./question-flow.md#from-answers-to-strings) y luego llevarla a [la forma canónica](./fxi.md#canonical-form).
4. Para el equipamiento, seguir la rama de equipamiento del mismo flujo, o [el procedimiento de FXE](./fxe.md#procedure).
5. Para decidir si dos cadenas describen lo mismo, usar [la comparación](./compare-and-match.md#compare).

El flujo de preguntas termina con [ejemplos resueltos](./question-flow.md#worked-examples): una sentadilla trasera con barra, un remo sentado en polea y la máquina de remo sentado en polea.

## Páginas {#pages}

| Página | Cubre |
|---|---|
| [FXI](./fxi.md) | El descriptor de ejercicio: sintaxis, valores predeterminados, la regla de fuentes, las reglas de capa y todos los códigos. |
| [Flujo de preguntas](./question-flow.md) | Cada pregunta, cuándo se hace, qué escribe cada respuesta y cómo las respuestas se convierten en cadenas. |
| [FXE](./fxe.md) | El descriptor de equipamiento: tipos, capas, el procedimiento y todos los códigos. |
| [FXM](./fxm.md) | La clave de músculo: formato, anclaje y semántica de los grupos. |
| [Comparación, coincidencia y versionado](./compare-and-match.md) | Las relaciones entre cadenas, el protocolo de coincidencia, la procedencia, el marcador de laguna y cómo evolucionan las revisiones de reglas. |
| [Conformidad](./conformance.md) | Los vectores de prueba que supera toda implementación, en cuatro niveles, y los informes de mediciones que los acompañan. |
