---
title: 'RFC-010: Descriptores estructurales'
description: Descriptores estructurales FXI, FXE y FXM, los campos de registro que los llevan y el protocolo de coincidencia
sidebar_position: 10
keywords: [fxi, fxe, fxm, structural descriptor, match protocol, xrefs, provenance, rfc]
---

# RFC-010: Descriptores estructurales — FXI, FXE y FXM

**Estado**: Borrador
**Versión**: 0.1.0
**Fecha**: 2026-11-24
**Autores**: Equipo VITNESS
**Categoría**: Standards Track

## Resumen

Esta especificación agrega tres descriptores estructurales al Fitness Data Standard: **FXI** para un ejercicio, **FXE** para una pieza de equipamiento y **FXM** para un músculo. Un descriptor es una cadena corta, construida a partir de vocabularios cerrados, que dice cómo se hace un ejercicio, qué es una pieza de equipamiento o a qué tejido se refiere una clave de músculo, sin usar un nombre en ningún idioma. Dos catálogos que describen el mismo ejercicio con palabras distintas pueden comparar sus descriptores y encontrarse.

Define dónde se ubican los descriptores en las entidades de ejercicio, equipamiento y músculo, los campos que viajan junto a ellos (quién respondió, qué no recoge la notación y los enlaces que confirmó una persona o un resolvedor), el protocolo de coincidencia que sigue un resolvedor y cómo se versionan los descriptores. Publica las mediciones con las que se han probado los descriptores hasta ahora, e indica cuáles de ellas todavía no alcanzan el umbral que este RFC fija para salir del estado experimental.

Los descriptores son experimentales (el §2 dice qué permite eso cambiar y qué no). Todo campo que agrega este RFC es opcional, ningún campo existente cambia de significado y el cambio de esquema es una versión menor.

## 1. Introducción

### 1.1. Antecedentes

Los RFC-001 a RFC-005 permiten a un proveedor exportar su catálogo en una forma que cualquier otro proveedor puede leer. No permiten al lector saber a cuál de sus propios ejercicios corresponde uno importado. Cada proveedor identifica sus registros por su propio identificador de registro, y lo único que dos catálogos comparten de forma fiable es que describen los mismos movimientos. Los nombres no lo transmiten: el mismo ejercicio se escribe de forma distinta en cada idioma, en la jerga de cada gimnasio y en cada catálogo que lo renombró, y dos ejercicios con casi el mismo nombre pueden diferir en el único detalle que importa.

Un descriptor estructural describe el movimiento en sí. FXI anota las acciones articulares, la posición del cuerpo, el apoyo, la carga y dónde se sostiene, los lados, el agarre, el rango, cualquier postura sostenida y la línea de tracción, cada una a partir de un vocabulario cerrado. El software compara dos de esas cadenas sin leer los nombres de ninguno de los dos catálogos.

### 1.2. Objetivos

1. Permitir al propietario de un catálogo describir cada ejercicio, pieza de equipamiento y músculo en una forma que otro catálogo pueda comparar sin un nombre compartido.
2. Permitir a un resolvedor enlazar un registro importado con el registro local correcto de forma automática cuando es seguro, y ofrecer una lista corta para confirmar cuando no lo es.
3. Conservar cada enlace confirmado, de modo que una coincidencia se haga una sola vez.
4. Decir con claridad hasta qué punto se puede confiar en los descriptores, a partir de mediciones y no de una certificación.

### 1.3. Alcance

**Dentro del alcance:**

- los tres descriptores: su sintaxis, su forma canónica y su comparación, por referencia a las páginas de descriptores (§4);
- los campos de registro que los llevan y los campos que viajan junto a ellos (§5);
- el protocolo de coincidencia (§7);
- el versionado de los descriptores y de los esquemas (§8);
- la evidencia medida y el umbral de lanzamiento (§9).

**Fuera del alcance:**

- **Identidad.** Un descriptor no es un identificador. La identidad sigue siendo el identificador de registro propio de cada proveedor (§3).
- **Prescripción.** El tempo, la carga, las repeticiones y los esquemas de series con nombre no forman parte de un descriptor. Dos sesiones que prescriben el mismo ejercicio de forma distinta describen un único ejercicio. La prescripción es competencia del RFC-006.
- **Datos del proveedor.** FDS es un estándar, no un catálogo. Publica los registros de códigos y las reglas. No publica listas de músculos, catálogos de equipamiento, palabras de movimiento ni plantillas de ejercicios con nombre: esos son datos de cada proveedor (§4.4).
- **Dos preguntas que se dejan abiertas deliberadamente y que no se deciden aquí:** dónde termina un codificador abierto y publicado y dónde empieza el servicio de coincidencia propio de un proveedor; y si `classification.mechanics`, `classification.force` o el patrón de movimiento deberían derivarse de un FXI en lugar de declararse junto a él.

## 2. Terminología {#2-terminology}

Las palabras clave DEBE, NO DEBE, DEBERÍA, NO DEBERÍA y PUEDE (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY — cuyo texto inglés es el normativo) deben interpretarse como se describe en RFC 2119.

- **Descriptor**: una cadena FXI, FXE o FXM en forma canónica.
- **Propietario**: quien mantiene el catálogo al que pertenece un registro. En este RFC el propietario es un catálogo, no una persona que entrena.
- **Flujo de preguntas**: las preguntas cerradas cuyas respuestas construyen un FXI y un FXE, publicadas como datos.
- **Registro de respuestas**: las respuestas que un propietario dio para un registro, conservadas junto a la cadena que construyeron.
- **Revisión de reglas**: la revisión de los vocabularios de descriptores y de las reglas de capa, nombrada por el campo `rules` de cada registro de descriptores. No se escribe en la cadena.
- **Biblioteca**: el conjunto de registros contra el que un resolvedor busca coincidencias, normalmente el catálogo propio del resolvedor.
- **Modo de importación**: construir un descriptor a partir de la fila de otro catálogo sin su propietario.
- **Marcador de laguna**: la nota del propietario de que la notación no recoge algo de este registro.
- **Enlace**: una afirmación almacenada de que un registro y un registro de otro catálogo describen lo mismo.
- **Experimental**: el estado de los descriptores desde la aceptación de este RFC hasta que una prueba nueva supere el umbral de lanzamiento del §9.5. Mientras son experimentales:
  - **puede todavía cambiar**: una revisión de reglas dentro de la versión mayor 1 puede agregar códigos y precisar lecturas, solo bajo el §8.1; el detalle de ordenación de la lista de confirmación (§7.2, el orden dentro de sus pasos y entre ellos) y los vectores de conformidad que lo fijan; las condiciones de coincidencia automática, que solo pueden endurecerse, nunca relajarse (§12); y los puntos abiertos del §12;
  - **congelado al aceptarse**: los nombres de los campos, sus tipos y dónde se ubican en cada entidad (§5); las cabeceras de las cadenas y el significado de cada código publicado; cada valor predeterminado publicado (§8.1); los valores de procedencia y lo que permite cada uno (§5.3, §7.1); y los bytes de las versiones de esquema que nombra el lanzamiento 1.6.0 (§8.2). Estos se mantienen tal como se publicaron, se alcance o no el umbral algún día; salir del estado experimental no cambia ningún campo ni ninguna cadena.

## 3. La afirmación

Este estándar afirma exactamente esto respecto a FXI:

> **un descriptor y una comparación deterministas; coincidencia automática ante claves idénticas y únicas; confirmación con un clic en otro caso; el enlace confirmado se almacena.**

- *Descriptor determinista*: las mismas respuestas siempre construyen la misma cadena.
- *Comparación determinista*: las mismas dos cadenas siempre se comparan de la misma forma, y la comparación nunca informa como `identical` dos cadenas distintas.
- *Coincidencia automática ante claves idénticas y únicas*: bajo las condiciones del §7.1, y solo bajo ellas.
- *Confirmación con un clic en otro caso*: una lista corta y ordenada de la que una persona elige o que rechaza.
- *El enlace confirmado se almacena*: en `xrefs` (§5.4), de modo que la pregunta nunca se vuelve a hacer.

FXI no identifica un ejercicio. Dos propietarios que describen el mismo ejercicio no siempre escriben la misma cadena: declaran los detalles opcionales de forma distinta, y el vocabulario no puede decirlo todo. Un descriptor acota una búsqueda y, en el caso acotado del §7.1, la resuelve. Una implementación NO DEBE presentar un FXI como un identificador, y NO DEBE describir los descriptores como identificación.

## 4. Los descriptores

Las páginas de descriptores son el texto normativo de la sintaxis, la forma canónica, las reglas de capa, los códigos y la comparación. Este RFC las adopta tal como están en la revisión de reglas que nombran los registros, y no las reformula.

| Descriptor | Página | Ejemplo |
|---|---|---|
| FXI | [FXI](/docs/descriptors/fxi), [Flujo de preguntas](/docs/descriptors/question-flow) | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` |
| FXE | [FXE](/docs/descriptors/fxe) | `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back` |
| FXM | [FXM](/docs/descriptors/fxm) | `FXM=1.0/latissimus-dorsi` |

La comparación está en [Comparación, coincidencia y versionado](/docs/descriptors/compare-and-match#compare), y los vectores de prueba en [Conformidad](/docs/descriptors/conformance). Este RFC es la fuente normativa de los campos de registro (§5), entre ellos la procedencia y el marcador de laguna (§5.3), del protocolo de coincidencia (§7) y del versionado (§8); las páginas enlazan aquí para ellos. Los vocabularios son los registros en `specification/registries/descriptors/`.

### 4.1. Reglas que fija este RFC

Se declaran aquí porque cada una es una decisión que un lector podría esperar en sentido contrario.

1. **Sin clave hash.** La versión 1 no define ningún hash, suma de verificación ni clave corta derivada de un descriptor. Las cadenas se comparan como cadenas.
2. **La palabra de movimiento no viaja en la cadena.** Una palabra de movimiento ("squat", "row") es un atajo a través del flujo de preguntas. Se conserva en el registro de respuestas, donde un resolvedor PUEDE usarla como indicio para ordenar, y nunca se escribe en el FXI.
3. **Una capa genérica frente a un valor conocido es `refines`.** `*` significa todos los valores. Una cadena con un valor conocido donde la otra tiene `*` es la descripción más específica del mismo ejercicio, no de uno distinto.
4. **Las capas estándar ausentes son valores.** Una capa estándar omitida de una cadena toma su valor predeterminado publicado. El valor predeterminado es un valor: contradice cualquier otro valor conocido. Esto incluye las capas con nombre, postura sostenida `h` y línea de tracción `p`, cuyos valores predeterminados son valores como cualquier otro. Solo `?` y `*` son abiertos.
5. **El equipamiento en un registro de ejercicio es solo estándar.** El FXE de un registro de ejercicio lleva las capas estándar; las capas extendidas de detalle de construcción aparecen solo en un registro de equipamiento.

### 4.2. FXI

FXI describe cómo se hace un ejercicio: su movimiento (`m`), la orientación del cuerpo (`o`), el extremo que se mueve, el trabajo de pies, el apoyo, la carga y dónde se sostiene (`l`), la simetría, el agarre y la postura de pies, el rango, la postura sostenida y la línea de tracción, con una capa extendida de accesorios. `m`, `o` y `l` se escriben siempre; cualquier otra capa se escribe solo cuando difiere de su valor predeterminado. La cabecera lleva la versión mayor y la revisión de sintaxis, y una bandera: `S` cuando cada capa escrita es estándar, `N` cuando se escribe la capa extendida.

### 4.3. FXE

FXE describe una pieza de equipamiento por su estructura: primero su tipo, luego las capas estándar que admite ese tipo y luego, solo en un registro de equipamiento, las capas extendidas de detalle de construcción. Una máquina combinada une el FXE estándar de cada configuración con `;`. Un ejercicio que no usa equipamiento escribe `FXE=1.0S/k:none`.

### 4.4. FXM

FXM es una clave para un músculo (`FXM=1.0/<muscle>`), una parte de uno (`FXM=1.0/<muscle>.<part>`) o un grupo (`FXM=1.0/g:<group>`).

- **Anclaje.** Cada músculo y cada parte se anclan al Foundational Model of Anatomy (FMA), que es el principal. Donde UBERON tiene un término para la misma estructura, se lleva como referencia cruzada. Donde una ontología no tiene término, la entrada registra la laguna con palabras; nunca se toma prestado un ancla de una estructura más amplia o más restringida.
- **Los tokens derivan de FMA.** Un token de músculo es la etiqueta preferida de su término FMA, en minúsculas, sin las palabras "muscle group" o, en su defecto, sin la palabra "muscle", y con sus palabras unidas por guiones simples; un token de parte es el calificador en la etiqueta FMA de la parte o cabeza, la palabra anterior a "part of" o "head of". La [página de FXM](/docs/descriptors/fxm#anchoring) da la regla con ejemplos. Un proveedor DEBE derivar sus tokens de músculo y de parte de esta forma. Por lo tanto, dos proveedores que anclan una estructura al mismo término FMA escriben la misma clave, y un lector resuelve una clave de músculo o de parte a partir de FMA sin el vocabulario del proveedor.
- **Los grupos son conjuntos de miembros.** Un grupo se define por las claves FXM de sus miembros, nunca por su nombre. Dos claves que cubren las mismas hojas anatómicas significan el mismo tejido, se llamen como se llamen. Un token de grupo es propio del proveedor y no se deriva: una clave `g:` se resuelve solo a través del vocabulario que la define, y nada en la clave dice de quién es ese vocabulario (§12).
- **Sin lista de músculos.** FDS publica el formato de la clave, las reglas de anclaje y lo que significa un grupo. Qué músculos, partes y grupos existen es vocabulario de un proveedor.

### 4.5. Lo que aporta un proveedor

Un proveedor que codifica su propio catálogo aporta: sus registros, sus descriptores y sus registros de respuestas; opcionalmente, un conjunto de datos de palabras de movimiento, que carga un codificador y cuyo uso indica el flujo de preguntas; y, para FXM, su vocabulario de músculos con anclas y miembros de grupo. Sin un conjunto de datos de palabras de movimiento, todo ejercicio puede codificarse igualmente, articulación por articulación.

## 5. Campos de registro

Esta sección es normativa. Todo campo es opcional. Un registro que no lleva ninguno de ellos es exactamente igual de válido, y significa exactamente lo que significaba, bajo las versiones de esquema que publica este RFC.

| Campo | En | Contiene |
|---|---|---|
| `fxi` | ejercicio | El FXI canónico del ejercicio. |
| `fxe` | ejercicio | El FXE **estándar** canónico del equipamiento principal del ejercicio. |
| `fxiProvenance` | ejercicio | Quién respondió por el FXI. |
| `fxiGap` | ejercicio | La nota del propietario sobre lo que el FXI no recoge, o `null`. |
| `xrefs` | ejercicio | Enlaces al mismo ejercicio en otros catálogos. |
| `fxe` | equipamiento | El FXE canónico del registro de equipamiento, estándar o con capas extendidas. |
| `fxm` | músculo | La clave FXM canónica del registro de músculo. |
| `fxe` | cada `equipmentRef` de un ejercicio | El FXE estándar de esa pieza de equipamiento. |
| `fxm` | cada `muscleRef` de un ejercicio | La clave FXM de ese músculo. |

Los campos de nivel de registro se ubican en el nivel superior del registro, junto a `classification`, y los campos de referencia en la propia referencia; nunca bajo `extensions` ni `attributes`. Forman parte del estándar, y un consumidor los lee sin conocer el espacio de nombres de ningún proveedor.

### 5.1. Cadenas de descriptor

Un productor DEBE escribir cada descriptor en forma canónica. El esquema comprueba solo la envoltura: la cabecera (`FXI=`, `FXE=` o `FXM=`, la versión mayor 1 y luego la revisión de sintaxis sin ceros a la izquierda), la bandera donde el descriptor tiene una, y un cuerpo sin espacios en blanco; para FXM, cuya gramática es una clave, la clave completa. No comprueba la gramática de FXI y FXE ni ningún código; eso corresponde a los registros, y el nivel de sintaxis de los vectores de conformidad lo prueba. Un consumidor DEBE validar un descriptor contra los registros antes de compararlo, y DEBE tratar uno inválido como ausente.

El esquema acepta solo la versión mayor 1. Una nueva versión mayor de un descriptor es una nueva versión mayor de su gramática, y necesitaría una nueva versión de esquema para poder llevarse.

El `fxe` de un ejercicio y el `fxe` de sus referencias de equipamiento son siempre estándar (bandera `S`). El `fxe` de un registro de equipamiento PUEDE llevar capas extendidas (bandera `N`).

### 5.2. `fxe` en el ejercicio y en sus referencias de equipamiento

Responden a preguntas distintas. El `fxe` de nivel de registro nombra el **equipamiento principal** del ejercicio, elegido por la regla de equipamiento principal de la página de FXE; es lo que compara el protocolo de coincidencia (§7.2). El `fxe` de un `equipmentRef` describe ese único elemento listado. Un consumidor NO DEBE inferir cuál es el elemento principal a partir del orden de `equipment.required`.

### 5.3. `fxiProvenance` y `fxiGap` {#53-fxiprovenance-and-fxigap}

`fxiProvenance` es uno de:

| Valor | Significado |
|---|---|
| `owner` | El propietario respondió el flujo de preguntas. |
| `owner-assisted` | Otra persona, o un software, propuso las respuestas, y el propietario las confirmó. |
| `agent` | Otra persona, o un software, respondió, y el propietario no confirmó. |
| `import` | Construido a partir de la fila de otro catálogo en modo de importación. El modo de importación siempre escribe `import`, y solo el modo de importación lo hace. |

Un `fxiProvenance` ausente es desconocido, y se trata como `agent`: nunca habilita un registro para la coincidencia automática.

`fxiGap` es la nota en texto plano del propietario de que la notación no recoge algo que distingue este ejercicio de otros. `null`, o la ausencia de `fxiGap`, declara que no hay ninguna; el esquema no acepta una cadena vacía, así que se escribe `null`. Cualquier nota presente es un marcador de laguna, incluida una nota formada solo por espacios en blanco: bloquea la coincidencia automática (§7.1), y es la evidencia en la que se apoya una revisión de reglas posterior. Un resolvedor trata como marcador de laguna todo `fxiGap` que no sea ausente, `null` ni `false`, incluida una cadena vacía, de modo que un valor inesperado nunca habilita una coincidencia automática. La prescripción nunca es una laguna: una pausa, un tempo o una carga pertenecen al RFC-006, no al ejercicio.

Ninguno de los dos campos significa nada sin un FXI, y el esquema rechaza cualquiera de ellos en un registro que no tiene `fxi`.

### 5.4. `xrefs`

`xrefs` contiene los enlaces entre este ejercicio y los registros que describen el mismo ejercicio en otros catálogos. Cada entrada es un objeto con tres miembros obligatorios:

| Miembro | Contiene |
|---|---|
| `system` | El catálogo al que pertenece el registro enlazado. Se usa la misma nomenclatura que en `metadata.externalRefs[].system`. |
| `id` | El identificador del registro enlazado en ese catálogo. |
| `link` | Cómo se hizo el enlace: `auto`, por un resolvedor bajo el §7.1; o `confirmed`, por una persona que lo eligió de una lista de confirmación o lo declaró directamente. |

Un registro DEBERÍA llevar como máximo una entrada por cada `system` e `id`.

**Los enlaces recibidos son indicios, no autoridad.** Los `xrefs` de un registro que llega de otro catálogo son afirmaciones de su remitente: una entrada `auto` la hizo el resolvedor del remitente, y una `confirmed`, una persona que el receptor no conoce. Un consumidor PUEDE usar una entrada así como indicio, por ejemplo para poner primero en una lista de confirmación el registro que nombra. NO DEBE almacenar una entrada recibida como un enlace propio, ni basar en ella una coincidencia automática, sin ejecutar él mismo el protocolo de coincidencia (§7).

**Por qué no `metadata.externalRefs`.** Los dos se parecen y se mantuvieron separados a propósito.

- `externalRefs` enumera los identificadores propios de este registro en otros sistemas: de dónde se importó, dónde se replica. Registra identidad, y no dice nada sobre cómo se estableció.
- `xrefs` registra una **decisión** de que los registros de dos catálogos distintos describen el mismo ejercicio, y cómo se tomó esa decisión. Un consumidor debe poder distinguir un enlace que hizo un resolvedor de uno que confirmó una persona, y `externalRefs` no tiene dónde decirlo.
- `externalRefs` forma parte de `metadata`, que comparten todas las entidades y que cierra `additionalProperties`. Darle un miembro `link` habría supuesto una nueva versión de cada entidad del estándar, por una distinción que hoy solo necesita la entidad de ejercicio.

Por eso `xrefs` reutiliza la forma `{system, id}`, de modo que un lector aprende un solo par, y agrega `link`.

### 5.5. Lo que este lanzamiento todavía no lleva

En este lanzamiento `equipmentRef` gana `fxe` y `muscleRef` gana `fxm`, y los llevan solo dentro de las entidades de ejercicio, equipamiento y músculo que este lanzamiento actualiza. `exerciseRef` no gana `fxi` por ahora: aparece solo en workout y program, cuyas versiones publicadas están congeladas y no se actualizaron aquí. Workout y program también incrustan `equipmentRef` y `muscleRef`, y la biblioteca de prescripción incrusta `equipmentRef`, así que sus referencias tampoco pueden llevar todavía un descriptor. `fxi` en `exerciseRef`, y `fxe` y `fxm` en las referencias dentro de workout, program y la biblioteca de prescripción, están previstos para la próxima versión de cada uno de esos esquemas (§12).

## 6. Comparación

La comparación toma dos FXI, o dos FXE, y devuelve `identical`, `refines`, `refined-by`, `compatible`, `contradicting` o `invalid`, en conjunto y por capa. Las claves FXM se comparan como `identical`, `contains`, `overlaps` o `disjoint`, según las hojas anatómicas que cubre cada una. Las reglas están en [Comparación, coincidencia y versionado](/docs/descriptors/compare-and-match#compare). Una clave FXM `g:` solo se compara teniendo a mano los vocabularios de ambos proveedores, ya que sus hojas provienen del vocabulario que la define. La comparación lee solo las cadenas: nunca un nombre, nunca una palabra de movimiento. No es transitiva, y un consumidor DEBE deduplicar solo ante `identical`.

## 7. Protocolo de coincidencia {#7-match-protocol}

Esta sección es normativa. Un resolvedor busca la coincidencia de un registro, la **consulta**, contra una biblioteca.

### 7.1. Coincidencia automática

Un resolvedor PUEDE enlazar la consulta con un registro de la biblioteca sin preguntar a una persona solo cuando se cumple todo lo siguiente:

1. exactamente un registro de la biblioteca tiene un FXI que se compara como `identical` con el de la consulta;
2. ni la consulta ni ese registro llevan un marcador de laguna (§5.3);
3. ambos tienen `fxiProvenance` `owner` u `owner-assisted`;
4. ninguno se construyó en modo de importación (§7.4). Donde una fila indica el modo en que se construyó, como lo hace un registro de respuestas o una fila de salida de un codificador, una fila en modo de importación nunca coincide automáticamente, diga lo que diga su `fxiProvenance`.

El enlace se almacena en los `xrefs` de la consulta con `link: "auto"`. En cualquier otro caso, un resolvedor NO DEBE enlazar sin una persona. Donde una fila indica su modo, un resolvedor DEBE rechazar una fila cuyo `fxiProvenance` lo contradiga (una fila en modo de importación con cualquier procedencia distinta de `import`, o `import` fuera del modo de importación) en lugar de buscar su coincidencia.

### 7.2. Confirmación

En otro caso, el resolvedor ofrece una lista de confirmación: como máximo tres registros de la biblioteca, cada uno como máximo una vez, con el motivo por el que se rechazó la coincidencia automática. La lista se llena en tres pasos, y cada registro ocupa el primer lugar para el que califica:

1. **Candidatos FXI**, por relación: `identical`, luego `refines` o `refined-by`, luego `compatible`. Dentro de una misma relación: primero más capas estándar `equal`; luego, cuando ambos registros llevan un FXE, un FXE idéntico antes que uno que lo precisa, y este antes que cualquier otro; luego la similitud de nombre; luego el orden de la biblioteca.
2. **Casi compatibles**: registros que contradicen la consulta en exactamente una capa estándar, que la lista nombra. Por similitud de nombre y luego por orden de la biblioteca.
3. **Candidatos por nombre**: el resto, por similitud de nombre y luego por orden de la biblioteca.

Un enlace que elige una persona se almacena en los `xrefs` de la consulta con `link: "confirmed"`. Cómo se puntúa la similitud de nombre es decisión de cada implementación; los vectores de conformidad ordenan por nombre solo donde cualquier puntuación razonable coincide. El detalle de ordenación puede todavía cambiar mientras los descriptores son experimentales (§2); los tres pasos y la longitud de la lista no.

### 7.3. Ausente

El resultado es ausente solo cuando la biblioteca está vacía. Una biblioteca con registros siempre ofrece una lista.

### 7.4. Modo de importación

Un descriptor construido en modo de importación sirve solo para buscar candidatos. PUEDE colocar registros en una lista de confirmación. NO DEBE participar en una coincidencia automática en ninguno de los dos lados, y este estándar no afirma nada sobre su precisión.

## 8. Versionado {#8-versioning}

### 8.1. Los descriptores

- **Dos números, separados.** La cabecera de la cadena lleva la versión mayor y la revisión de sintaxis; la revisión de sintaxis cambia solo cuando cambia la gramática. La revisión de reglas es la revisión de los vocabularios y de las reglas de capa, y no se escribe en la cadena.
- **Solo precisión, dentro de una versión mayor.** Una revisión de reglas puede agregar un código, dividir un código en hijos que su código anterior pasa a cubrir, agregar una capa que las cadenas anteriores leen como `?`, agregar una entrada de tabla donde la lectura anterior era `?`, o dar un valor predeterminado publicado a una capa cuya ausencia era abierta. Nunca elimina un código, nunca cambia lo que significa un código y nunca cambia un valor predeterminado existente. Toda cadena válida bajo una revisión de reglas sigue siendo válida bajo la siguiente, y dos cadenas que eran `identical` siguen siendo `identical`.
- **Los valores predeterminados son para siempre.** Una cadena que deja una capa en su valor predeterminado significa lo mismo bajo cada revisión de reglas posterior de su versión mayor.
- **Una revisión de reglas por lanzamiento.** Un lanzamiento del estándar lleva como máximo una revisión de reglas nueva, y cada nueva resolución que contiene se apoya en al menos dos casos fallidos de al menos dos catálogos.
- **Las respuestas se almacenan.** Un productor DEBERÍA conservar el registro de respuestas de cada registro: los identificadores de las preguntas y las opciones elegidas, la palabra de movimiento y el conjunto de datos de palabras de movimiento del que provino, si lo hay, la procedencia y el marcador de laguna. Cuando una revisión de reglas precisa una lectura, una actualización reconstruye cada cadena a partir de sus respuestas almacenadas en lugar de volver a preguntar a nadie. Una cadena sin respuestas almacenadas sigue siendo válida tal como está escrita.

### 8.2. Los esquemas

El lanzamiento **1.6.0** lleva los campos del §5. Pasa exercise y equipment a 1.2.0 y muscle a 1.1.0; todas las demás entidades, y la biblioteca de prescripción, se quedan donde las nombró el lanzamiento 1.5.0. Todo cambio es una adición opcional, de modo que todo documento válido bajo las versiones anteriores es válido bajo las nuevas, y las versiones sustituidas siguen publicadas y congeladas.

El lanzamiento 1.6.0 se propone con este RFC y no se publica mientras el RFC sea un borrador. El cambio que acepta este RFC congela exercise 1.2.0, equipment 1.2.0 y muscle 1.1.0 y fecha la entrada del registro de cambios del lanzamiento, en una sola fusión. Hasta entonces, el sitio y los paquetes no se publican desde un árbol cuyo lanzamiento actual está sin congelar o sin fecha.

## 9. Evidencia {#9-evidence}

Los vectores de conformidad dicen si una implementación calcula lo que dice esta especificación. No pueden decir si las personas y los programas describen los ejercicios lo bastante bien como para que el protocolo de coincidencia sea útil. Eso se mide, y se publica aquí como mediciones, no como un aprobado o un suspenso.

### 9.1. Método

- **Codificadores.** Dos codificadores, ambos agentes de software, codificaron la biblioteca y las consultas de forma independiente, sin ver la salida del otro. Trabajaron en modo propietario en sustitución de los propietarios de los catálogos, así que sus filas llevaban procedencia de propietario y podían coincidir automáticamente: las cifras de coincidencia automática de abajo simulan a propietarios que codifican sus propios catálogos. Queda pendiente una calibración con personas que codifiquen (§9.4).
- **Consultas.** 624 consultas puntuadas en seis partes, ninguna de las cuales comparte un nombre con la biblioteca contra la que se buscó su coincidencia: filas redactadas en francés, en italiano y en portugués; filas reales no inglesas de catálogos de terceros; jerga de gimnasio; y ejercicios renombrados. 496 tienen su ejercicio en la biblioteca y 128 no. Las **partes reales** son las tres últimas, 174 consultas.
- **Ejecuciones.** Entre codificadores: las consultas que construyó un codificador se compararon contra la biblioteca que construyó el otro, y a la inversa. Cada cifra es la media de las dos ejecuciones.
- **Resolvedor.** El protocolo de coincidencia del §7, tal como lo implementa el codificador de referencia, fijado antes de codificar las consultas.
- **Medidas.** La *exhaustividad top-3* (recall) es la proporción de consultas de la biblioteca cuyo registro correcto se enlaza automáticamente o aparece entre los tres primeros de la lista de confirmación; su denominador son las consultas de la biblioteca. Las *coincidencias automáticas erróneas* son la proporción de todas las consultas puntuadas, estén o no en la biblioteca, que se enlazaron automáticamente con un registro equivocado; una consulta ausente enlazada con cualquier cosa es errónea.
- **Intervalos.** Los corchetes dan intervalos de puntuación de Wilson al 95%. Para la media de las dos ejecuciones, el intervalo usa la tasa combinada y el denominador de una sola ejecución.
- **Datos.** Las consultas, las bibliotecas y las filas codificadas se quedan con el proveedor que realizó la prueba, porque contienen texto de catálogos de terceros. El método y el puntuador se describen aquí para que la prueba pueda repetirse con otro conjunto.

### 9.2. Nueva prueba con nombres disjuntos {#92-name-disjoint-re-test}

| Medida | Todas las partes (624) | Solo partes reales (174) |
|---|---|---|
| Exhaustividad top-3: el registro correcto se enlaza o está en la lista de confirmación | 98.4% [96.8–99.2] | 96.3% [91.7–98.4] |
| Coincidencias automáticas erróneas | 2.1% [1.2–3.5] | 3.4% [1.6–7.3] |

Sobre el mismo conjunto, la coincidencia por nombre con traducción alcanzó una exhaustividad top-3 del 88.3% cuando respondía ausente por debajo de un umbral de similitud fijo, y del 93.3% cuando siempre ofrecía una lista, con un 1.1% de coincidencias automáticas erróneas.

### 9.3. Separación y concordancia {#93-separation-and-agreement}

- **Separación de variantes cercanas**: en 98 pares redactados de ejercicios que difieren en un detalle, los descriptores mantuvieron separados el 98.0% de los pares.
- **Concordancia entre codificadores**: dos codificadores que codificaron la misma fila real escribieron la misma cadena completa en aproximadamente el 78% al 95% de las filas, según el conjunto.

### 9.4. Pendiente

- **Calibración con codificación por personas**: propietarios frente a codificadores, sobre las mismas filas. *Pendiente — aún no medida.*

### 9.5. El umbral de lanzamiento

Los descriptores salen del estado experimental solo cuando una prueba realizada como describe el §9.1, sobre un conjunto nuevo de consultas con nombres disjuntos que ninguna de las pruebas anteriores usó, con ejecuciones entre codificadores, cumple ambas condiciones, en todas las partes y en las partes reales:

- coincidencias automáticas erróneas **como máximo del 2%**;
- exhaustividad top-3 **de al menos el 98%**.

El umbral se lee sobre la estimación puntual. Los intervalos se informan junto a ella, para que un lector pueda ver cuánto podría moverse el resultado.

**El umbral todavía no se cumple.** Las coincidencias automáticas erróneas lo superan en todas las partes (2.1%), y ambas medidas no lo alcanzan en las partes reales (3.4% y 96.3%). La exhaustividad top-3 en todas las partes (98.4%) lo cumple.

## 10. Guía de implementación

### 10.1. Productores

- Codificar a través del flujo de preguntas, y almacenar el registro de respuestas junto a cada cadena.
- Escribir `fxiProvenance` con veracidad. Un software que propone respuestas escribe `agent` hasta que el propietario confirma, y luego `owner-assisted`. Nunca escribir `owner` para respuestas que el propietario no dio.
- Escribir `fxiGap` siempre que el vocabulario no pueda expresar una diferencia que importa. Cuesta una coincidencia automática y aporta una mejor revisión de reglas.
- En un ejercicio, escribir el `fxe` de nivel de registro para el equipamiento principal incluso cuando las referencias de equipamiento también llevan uno.

### 10.2. Consumidores

- Validar cada descriptor contra los registros antes de usarlo. Tratar uno inválido como ausente.
- Tratar los `xrefs` que lleva un registro recibido como indicios del remitente (§5.4). Ejecutar el protocolo de coincidencia propio antes de almacenar un enlace propio.
- No tratar dos FXI `compatible` o `refines` como el mismo ejercicio; solo una persona confirma eso.

### 10.3. Resolvedores

- Seguir el §7 exactamente. Una coincidencia automática fuera del §7.1 no es conforme, por muy seguro que esté el resolvedor.
- Mostrar el motivo por el que se rechazó la coincidencia automática junto a la lista de confirmación.
- Almacenar cada enlace confirmado.

## 11. Consideraciones de seguridad y privacidad

Un descriptor describe un ejercicio, una pieza de equipamiento o un músculo. No describe a ninguna persona, y ninguno de los campos que agrega este RFC puede contener un valor personal: el propietario en `fxiProvenance` es un catálogo, y `xrefs` enlaza registros de catálogo con registros de catálogo. Un documento que lleva estos campos puede publicarse, almacenarse en caché, replicarse y diferenciarse exactamente igual que antes.

`fxiGap` es texto libre escrito por el propietario de un catálogo. Los consumidores DEBERÍAN tratarlo como texto no confiable, como tratan cualquier descripción.

Una entrada de `xrefs` en un registro recibido es una afirmación del remitente, sea `auto` o `confirmed`: un enlace erróneo, hecho por error o a propósito, se propagaría de otro modo desde un catálogo a todos los catálogos que lo copian. Por eso el §5.4 hace de los enlaces recibidos indicios, y solo un enlace que hace el resolvedor o una persona del propio receptor se almacena como del receptor.

## 12. Puntos abiertos

**Planificado antes del lanzamiento.** Cada uno de estos debe completarse antes de que los descriptores salgan del estado experimental:

1. **La coincidencia automática también exigirá que coincida el equipamiento.** Cuando ambos registros lleven un FXE, la coincidencia automática exigirá además que sean `identical`. El §7.1 todavía no lo exige. Las cifras del §9 se midieron sin ello.
2. **Una revisión de reglas cierra las lagunas de notación registradas.** Los marcadores de laguna y las contradicciones registrados hasta ahora se resuelven en una única revisión de reglas, bajo las reglas de precisión del §8.1.
3. **Una prueba nueva con nombres disjuntos supera el umbral de lanzamiento** del §9.5, sobre consultas que ninguna de las pruebas anteriores usó.

**Previsto.** `exerciseRef` lleva `fxi`, y las referencias dentro de workout, program y la biblioteca de prescripción llevan `fxe` y `fxm`, a partir de la próxima versión de cada uno de esos esquemas (§5.5).

**Abierto.**

1. **De quién es el grupo que nombra una clave FXM.** Una clave de músculo o de parte deriva de FMA y significa lo mismo en todo vocabulario (§4.4). Una clave `g:` no: se resuelve solo a través del vocabulario del proveedor que la definió, y ni la clave ni el registro nombran ese vocabulario. No está decidido cómo dice un registro o un documento de qué vocabulario provienen sus claves de grupo.
2. **Formas de intercambio.** Dónde publica un proveedor su vocabulario FXM, con la forma de una entrada de vocabulario; y el registro de respuestas. La entrada `--muscles` del codificador de referencia y el registro de respuestas de la página del flujo de preguntas son las formas de trabajo.

**Deliberadamente sin decidir.** El límite entre un codificador abierto y el servicio de coincidencia de un proveedor, y si la mecánica, la fuerza o el patrón se derivan de la clave (§1.3).

## 13. Referencia del JSON Schema

- **Exercise**: `https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.schema.json`
- **Equipment**: `https://spec.vitness.me/schemas/equipment/v1.2.0/equipment.schema.json`
- **Muscle**: `https://spec.vitness.me/schemas/muscle/v1.1.0/muscle.schema.json`
- **Definiciones compartidas**: el esquema común, versión 1.1.0, define `fxi`, `fxe`, `fxeStandard` (el FXE solo estándar que llevan un ejercicio y una referencia de equipamiento), `fxm`, `fxiProvenance` y `xref`; la compilación los copia en cada esquema de entidad.
- **Registros**: `specification/registries/descriptors/fxi.registry.json` y `fxe.registry.json`
- **Vectores de conformidad**: `specification/descriptors/conformance/`

### 13.1. Validación

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.2.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.2.0/exercise.example.descriptors.json
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/equipment/v1.2.0/equipment.schema.json \
  -d specification/schemas/equipment/v1.2.0/equipment.example.descriptors.json
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/muscle/v1.1.0/muscle.schema.json \
  -d specification/schemas/muscle/v1.1.0/muscle.example.descriptors.json
```

## 14. Ejemplos

Un ejercicio codificado por su propietario, con un enlace que hizo un resolvedor y otro que confirmó una persona. La barra y el cuádriceps llevan sus descriptores; el rack y el erector de la columna no, porque todo campo es opcional.

```json
{
  "schemaVersion": "1.2.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440010",
  "canonical": { "name": "Back Squat", "slug": "back-squat" },
  "classification": {
    "exerciseType": "strength",
    "movement": "squat",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate"
  },
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "name": "Quadriceps", "categoryId": "cat.legs", "fxm": "FXM=1.0/quadriceps-femoris" }
    ],
    "secondary": [
      { "id": "mus.erectorSpinae", "name": "Erector Spinae", "categoryId": "cat.back" }
    ]
  },
  "equipment": {
    "required": [
      { "id": "eq.barbell", "name": "Barbell", "fxe": "FXE=1.0S/k:imp/f:bar.straight" },
      { "id": "eq.rack", "name": "Power Rack" }
    ]
  },
  "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back",
  "fxe": "FXE=1.0S/k:imp/f:bar.straight",
  "fxiProvenance": "owner",
  "fxiGap": null,
  "xrefs": [
    { "system": "example-catalog", "id": "vx-0001", "link": "auto" },
    { "system": "partner-gym", "id": "squat-back-bb", "link": "confirmed" }
  ],
  "metrics": { "primary": { "type": "reps", "unit": "count" } },
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "active"
  }
}
```

Un ejercicio construido en modo de importación a partir de la fila de otro catálogo, antes de que su propietario haya respondido nada. Puede colocar registros en una lista de confirmación y nunca coincide automáticamente. No lleva marcador de laguna, porque solo un propietario escribe uno.

```json
{
  "schemaVersion": "1.2.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440011",
  "canonical": { "name": "Seated Cable Row", "slug": "seated-cable-row" },
  "classification": {
    "exerciseType": "strength",
    "movement": "pull-horizontal",
    "mechanics": "compound",
    "force": "pull",
    "level": "beginner"
  },
  "targets": {
    "primary": [
      { "id": "mus.lats", "name": "Latissimus Dorsi", "categoryId": "cat.back", "fxm": "FXM=1.0/latissimus-dorsi" }
    ]
  },
  "fxi": "FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne",
  "fxe": "FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back",
  "fxiProvenance": "import",
  "metrics": { "primary": { "type": "reps", "unit": "count" } },
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "draft"
  }
}
```

Un registro de equipamiento, con las capas extendidas que solo lleva un registro de equipamiento, y un registro de músculo:

```json fds:document entity=equipment
{
  "schemaVersion": "1.2.0",
  "id": "eq.seated-row-machine",
  "canonical": { "name": "Seated Row Machine", "slug": "seated-row-machine" },
  "fxe": "FXE=1.0N/k:mac/l:hand/s:seat/m:pull.back/r:stack/c:cable",
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "active"
  }
}
```

```json fds:document entity=muscle
{
  "schemaVersion": "1.1.0",
  "id": "mus.lats",
  "canonical": { "name": "Latissimus Dorsi", "slug": "latissimus-dorsi" },
  "classification": { "categoryId": "cat.back", "region": "upper-back", "laterality": "bilateral" },
  "fxm": "FXM=1.0/latissimus-dorsi",
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "active"
  }
}
```

Los registros de respuestas y su forma de intercambio se muestran en la página del [flujo de preguntas](/docs/descriptors/question-flow).

## Conformidad {#conformance}

**Un productor conforme:**

:::danger DEBE
- **DEBE** escribir cada descriptor en forma canónica, en el campo que el §5 define para él: un campo de nivel de registro en el nivel superior del registro, un campo de referencia en la referencia.
- **DEBE** escribir `fxiProvenance` tal como ocurrió, e `import` para cada descriptor construido en modo de importación.
- **DEBE** derivar los tokens FXM de músculo y de parte de sus etiquetas FMA (§4.4).
- **NO DEBE** presentar un descriptor como un identificador, ni describir los descriptores como identificación (§3).
- Un productor que construye descriptores a partir de registros de respuestas **DEBE** superar al 100% los niveles `syntax` y `builder` de los vectores de conformidad.
:::

**Un resolvedor conforme:**

:::danger DEBE
- **DEBE** superar al 100% los niveles `syntax`, `compare` y `resolver` de los vectores de conformidad. El nivel `builder` no se exige a un resolvedor.
- **DEBE** coincidir automáticamente solo bajo el §7.1, y almacenar cada enlace que hace o que confirma una persona en `xrefs` con el `link` correcto.
- **NO DEBE** coincidir automáticamente con un descriptor construido en modo de importación, y **DEBE** rechazar una fila cuya procedencia contradiga su modo (§7.1).
- **DEBE** ofrecer una lista de confirmación para cada consulta contra una biblioteca no vacía cuya coincidencia no establece automáticamente.
:::

**Un consumidor conforme:**

:::danger DEBE
- **DEBE** aceptar un registro que no lleva ninguno de estos campos, y un registro que lleva cualquiera de ellos.
- **DEBE** validar un descriptor contra los registros antes de compararlo, y tratar uno inválido como ausente (§5.1).
- **NO DEBE** inferir cuál es el equipamiento principal a partir del orden de `equipment.required` (§5.2).
- **DEBE** deduplicar solo ante `identical` (§6).
- **NO DEBE** almacenar una entrada de `xrefs` recibida como un enlace propio, ni basar en ella una coincidencia automática, sin ejecutar él mismo el protocolo de coincidencia (§5.4).
:::

Los vectores de conformidad fijan el comportamiento del codificador de referencia: cada salida esperada es lo que este calcula. Superarlos demuestra que una implementación coincide con la referencia, no que la referencia sea correcta; una regla que la referencia aplica mal se corrige en ambas, bajo una nueva revisión de reglas.

## 15. Referencias

### 15.1. Referencias normativas

- RFC 2119 — Key words for use in RFCs
- RFC-001 — Modelo de datos de ejercicio
- RFC-002 — Modelo de datos de equipamiento
- RFC-003 — Modelo de datos de músculo
- Las páginas de descriptores: [Visión general](/docs/descriptors/overview), [FXI](/docs/descriptors/fxi), [Flujo de preguntas](/docs/descriptors/question-flow), [FXE](/docs/descriptors/fxe), [FXM](/docs/descriptors/fxm), [Comparación, coincidencia y versionado](/docs/descriptors/compare-and-match), [Conformidad](/docs/descriptors/conformance)
- JSON Schema Draft 2020-12
- Foundational Model of Anatomy (FMA), la ontología a la que FXM ancla cada músculo y cada parte, y de cuyas etiquetas derivan sus tokens (§4.4)

### 15.2. Referencias informativas

- UBERON, la ontología anatómica que FXM lleva como referencia cruzada
- RFC-006 — Primitivas de prescripción, al que corresponde todo lo que un descriptor deja fuera

### 15.3. Implementación

La implementación de referencia de este RFC es `@vitness/fds-encoder`, en `packages/fds-encoder/` de este repositorio. Los pasos opcionales de descriptores del transformador se construyen a partir de ella.
