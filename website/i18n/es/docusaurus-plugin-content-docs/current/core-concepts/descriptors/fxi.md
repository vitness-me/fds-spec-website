---
title: 'FXI: descriptor de ejercicio'
sidebar_label: 'FXI (ejercicios)'
description: 'Borrador de la sintaxis de FXI, sus valores predeterminados, la forma canónica, las reglas de capa y todos los códigos'
sidebar_position: 2
---

# FXI: descriptor de ejercicio

:::caution Borrador
No es normativo hasta que se acepte el [RFC-010](/docs/specifications/rfc-010-structural-descriptors), que adopta los descriptores estructurales. El RFC-010 es un borrador. Véase [la visión general](./overview.md).
:::

Un FXI describe la estructura de un ejercicio: qué articulaciones se mueven y cómo, la posición del cuerpo, sobre qué se apoya, qué lo carga y el puñado de elecciones que hacen de una variante un ejercicio distinto de otro. Esta página define la cadena. [El flujo de preguntas](./question-flow.md) es la forma de construir una sin escribir notación.

Todos los códigos que puede contener un FXI se enumeran en esta página. Las tablas se generan a partir de [`specification/registries/descriptors/fxi.registry.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/registries/descriptors/fxi.registry.json), que es la fuente; la prosa que las rodea es la regla para usarlas.

## Qué hace que dos ejercicios sean el mismo {#what-makes-two-exercises-the-same}

Dos ejercicios son el mismo ejercicio cuando comparten todas estas dimensiones:

| Dimensión | Capa |
|---|---|
| Qué articulaciones se mueven, en qué orden, si es balístico o no, y qué extremo del cuerpo se mueve | `m`, `k` |
| La posición del cuerpo al inicio: de pie, sentado, de rodillas, acostado, y qué lado mira hacia abajo | `o` |
| Sobre qué se apoya el cuerpo, más allá del suelo que implica su posición, y dónde toca | `s` |
| Cada implemento, cuántos y dónde se sostiene; la asistencia | `l` |
| Qué extremidades trabajan y en qué orden | `x` |
| La orientación de las manos, la clase de anchura del agarre y la clase de postura de pies | `g` |
| La clase de rango y la posición de inicio | `r` |
| Pasos, postura dividida o desplazamiento | `f` |
| Dinámico, cíclico, sostenido, estiramiento estático o estiramiento dinámico | prefijos de `m` |
| La postura sostenida de las extremidades que no trabajan | `h` |
| La línea de tracción, o una carga que pasa por detrás de la cabeza | `p` |
| Un accesorio que ayuda sin cargar (extendida) | `a` |

**Una articulación sostenida que cambia el objetivo forma parte del ejercicio.** Un estiramiento de pantorrillas con la rodilla recta y uno con la rodilla flexionada estiran músculos distintos; la rodilla va en el movimiento.

**La prescripción nunca cambia el ejercicio** y nunca va en un FXI: la cantidad de carga, el tempo, las pausas, las series, las repeticiones, el descanso, el ritmo, la duración, la distancia, la tensión de la banda, los ajustes de la máquina, la altura del cajón y los cambios pequeños de ángulo dentro de una misma clase (un banco inclinado a 30° y uno a 45° son la misma orientación).

**Un lado cada vez no es alternado.** Hacer todas las repeticiones con un lado y luego cambiar (`x:u`) es un ejercicio distinto de turnarse repetición a repetición (`x:a`).

**Un valor predeterminado es un valor. Solo `?` significa no declarado.** Todas las capas salvo `m`, `o` y `l` tienen un valor predeterminado publicado. Una sentadilla simple tiene los brazos libres, ambas piernas trabajando a la vez y el rango completo: esos valores predeterminados son valores, y contradicen cualquier otro valor. Una sentadilla con las manos detrás de la cabeza (`h:hands.head`) contradice una sentadilla simple. Cuando nada indica el valor, se escribe `?`; `?` nunca contradice nada.

## Sintaxis {#syntax}

### Forma {#form}

```text
FXI=1.0S/m:<motion>/o:<orientation>/k:<end>/f:<footwork>/s:<support>/l:<load>/x:<symmetry>/g:<grip>/r:<range>/h:<held>/p:<line>
FXI=1.0N/…/p:<line>/a:<accessory>
```

- `1` es la versión mayor y `0` la revisión de sintaxis; ambas se escriben siempre. Una cadena que empieza por `FXI=1/` es un borrador previo al lanzamiento y es inválida.
- La letra que sigue a la revisión es la bandera. `S`: todas las capas escritas son estándar. `N`: la cadena también lleva una capa extendida. La única capa extendida es el accesorio `a`.
- `m`, `o` y `l` se escriben siempre. Cualquier otra capa se escribe solo cuando difiere de su valor predeterminado.
- La revisión de reglas (véase [versionado](./compare-and-match.md#provenance-match-and-versioning)) no se escribe en la cadena. Una cadena se lee bajo la revisión de reglas más reciente de su versión mayor, lo cual es seguro porque una revisión de reglas solo puede precisar.

<!-- fds:generated fxi#layers -->
| Capa | Clase | Se lee de | Significado |
|---|---|---|---|
| `m` | estándar | capa corporal | Movimiento: las acciones articulares de cada fase, en el orden de la repetición. Obligatoria. |
| `o` | estándar | capa corporal | Orientación: el cuerpo respecto a la gravedad al inicio de la repetición. Se escribe siempre; `?` si se desconoce. |
| `k` | estándar | capa corporal | Extremo móvil, para el trabajo de tronco en el suelo o en un banco. Predeterminado: se mueve el extremo de las extremidades. |
| `f` | estándar | capa corporal | Trabajo de pies: pasos, postura dividida o desplazamiento. Predeterminado: pies plantados a la par. |
| `s` | estándar | capa corporal | Apoyo: las superficies más allá de lo que implica la orientación, y los puntos corporales sobre ellas. Predeterminado: el suelo tal como lo implica la orientación. |
| `l` | estándar | capa corporal | Carga: cada implemento y dónde se sostiene, o `bw`. Se escribe siempre; `?` si se desconoce. |
| `x` | estándar | capa de nombre | Simetría: qué extremidades trabajan y en qué orden. Predeterminado: `b`, ambas a la vez. |
| `g` | estándar | capa de nombre | Agarre y postura de pies: orientación de las manos, anchura, postura de pies. Predeterminado: el agarre habitual, anchura media, postura de pies media. |
| `r` | estándar | capa de nombre | Rango e inicio: rango parcial o profundo, déficit, posición de inicio. Predeterminado: rango completo desde el inicio habitual. |
| `h` | estándar | capa de nombre | Postura sostenida de las extremidades que no trabajan. Predeterminado: sin postura sostenida. |
| `p` | estándar | capa de nombre | Línea de tracción o trayectoria respecto al cuerpo. Predeterminado: la línea que implica la palabra de movimiento. |
| `a` | extendida | capa corporal | Accesorio: una correa o un compañero que ayuda en el ejercicio sin cargarlo. Extendida: se compara solo cuando ambas cadenas la llevan. |
<!-- /fds:generated -->

Una **capa corporal** describe lo que hace el cuerpo y se lee de todo lo que se sabe del ejercicio. Una **capa de nombre** es una elección que los catálogos codifican habitualmente en el nombre del ejercicio; en modo de importación se lee solo del nombre y de los campos del registro (véase [la regla de fuentes](#the-source-rule)).

### Símbolos {#symbols}

| Símbolo | Dónde | Significado |
|---|---|---|
| `/` | entre capas | Separa las capas. |
| `:` | en cada capa | La letra de la capa y luego el valor. |
| `+` | dentro de un valor | Une elementos: acciones en una parte de una fase, elementos de apoyo, implementos, elementos de agarre, códigos de rango, elementos de simetría, códigos de postura sostenida, líneas. |
| `>` | `m`, `o`, `f`, `g` | Una secuencia en el orden de la repetición: fases de movimiento, orientación inicial y luego final, cambios de trabajo de pies, cambios de agarre. |
| `\|` | `m` | Dos partes de una misma fase a la vez. |
| `@` | `s`, `l`, `x` | Los puntos corporales sobre un apoyo; el punto de sujeción de un implemento; el alcance de un código de simetría. |
| `,` | `s` | Varios puntos corporales sobre un mismo apoyo: `floor@feet,hands`. |
| `*n` | `l` | Cantidad de implementos, de `1` a `4`, solo cuando difiere de la cantidad habitual. |
| `^ ~ = % &` | inicio de una parte de movimiento | Los prefijos de fase que se describen abajo. Sin prefijo es una fase dinámica normal. |
| `-` | tras una acción articular | Un impulso de recorrido corto a propósito. |
| `?` | cualquier valor | Desconocido: una capa completa (`o:?`), un implemento (`?@chest`), un punto de sujeción (`kb@?`), un apoyo (`?@feet`), un punto corporal (`floor@feet,?`), la dirección de una articulación (`sh.?`), una fase completa (`hip.ext>?`). |
| `*` | una capa completa | Genérico a propósito: el ejercicio puede hacerse de cualquiera de las dos formas ("sentado o de pie"). No se permite en `m`. |

El `+?` abierto ("y posiblemente más") no se permite. Se escriben las acciones que se conocen, o `?` para la fase completa.

### Valores predeterminados {#defaults}

| Capa | Si se omite, significa |
|---|---|
| `m` | Obligatoria; `m:?` cuando se desconoce. |
| `o` | Se escribe siempre; `o:?` cuando se desconoce. |
| `k` | Se mueve el extremo de las extremidades. |
| `f` | Pies plantados a la par. |
| `s` | El suelo, tal como lo implica la orientación. El asiento y los acolchados propios de una máquina nunca se escriben. |
| `l` | Se escribe siempre; `l:?` cuando se desconoce. |
| `x` | `b`: ambos lados a la vez, o el movimiento no tiene lados. |
| `g` | La orientación de manos habitual (`su` cuando todas las acciones son `el.flex`, `pr` en otro caso), anchura media, postura de pies media. |
| `r` | Rango completo desde el inicio habitual del movimiento. |
| `h` | Sin postura sostenida: las extremidades que no trabajan hacen lo que implica el movimiento. |
| `p` | La línea de tracción habitual, con la carga pasando por delante del cuerpo. |
| `a` | Extendida: no declarada, lo cual es abierto. Se compara solo cuando ambas cadenas la llevan. |

Un código predeterminado puede escribirse (`x:b`, `f:level`, `k:limbs`, `h:none`, `p:usual`, `g:w-m`); la canonicalización lo descarta.

### Forma canónica {#canonical-form}

Cada FXI tiene exactamente una grafía canónica, y solo se intercambia la grafía canónica. Para canonicalizar:

1. Escribir la cabecera `FXI=1.0` y la bandera (paso 9).
2. Escribir las capas en el orden `m o k f s l x g r h p a`, cada una una vez.
3. Descartar toda capa que esté en su valor predeterminado: `k:limbs`, `f:level`, `x:b`, `h:none`, `p:usual`, `a:none`, y un apoyo que sea solo `floor`.
4. Dentro de un valor, ordenar los elementos unidos con `+`, las partes unidas con `|` y los puntos corporales unidos con `,` por orden de unidades de código, con `?` y `*` después de cualquier letra. En `m`, descartar una acción escrita junto a su hija en la misma parte: `el.flex+sh.ext+sh.ext.oh` es `el.flex+sh.ext.oh`. Mantener las secuencias `>` en el orden de la repetición; en `o`, `f` y `g`, colapsar un código repetido de forma consecutiva (`standing>standing` es `standing`).
5. En `s`, descartar los puntos corporales que implica la orientación inicial (la tabla de orientaciones los enumera), un `floor` sin más, y un `bench`, `box`, `chair` o `floor` sin más bajo un cuerpo sentado.
6. En `l`, descartar `bw` cuando también se escribe un implemento, y descartar toda cantidad igual a la cantidad habitual ([cantidades](#load-l)): `l:db*1@hands/x:u` es `l:db@hands/x:u`.
7. En `x`, descartar un alcance que el movimiento ya implica (el `u@legs` de una zancada es `u`), y descartar `x` por completo en un movimiento que sea solo rotación o inclinación lateral del tronco o del cuello.
8. En `g`, con una sola fase de agarre, descartar la orientación de manos habitual, `w-m` y `st-m`, y descartar `ne` con una barra hexagonal, que lo impone. Cualquier otro agarre que imponga un implemento se sigue escribiendo: los manerales paralelos y una cuerda de polea son `ne`. Con varias fases, descartar `w-m` y `st-m` de una fase salvo que eso la deje vacía. Descartar la postura de pies salvo que el inicio sea `standing`, `standing.bent` o `?`, o que los pies empujen la plataforma de una máquina (`mach@feet`).
9. Fijar la bandera: `N` cuando se escribe `a`; si no, `S`.

Todo implemento lleva un punto de sujeción (`@?` cuando se desconoce); una capa sin valor, una capa escrita dos veces, un código desconocido, dos acciones opuestas en una misma parte, dos códigos de inicio, `partial` con `deep`, o dos códigos que una tabla marca "nunca con" hacen inválida la cadena. Una cadena que incumple una regla de esta página no es un FXI. Un comprobador informa todos los problemas que encuentra en lugar de adivinar.

## La regla de fuentes {#the-source-rule}

**Modo propietario.** El propietario de un ejercicio responde lo que es cierto de él tal como lo ejecuta, en todas las capas, lo diga o no su nombre. Un valor predeterminado publicado se aplica siempre que el ejercicio se haga de la forma habitual.

**Modo de importación.** Al leer la fila de otro catálogo sin su propietario, las fuentes son la descripción, el nombre (y el nombre alternativo) y los campos del registro.

- Las **capas corporales** `m o k f s l` se leen de la descripción, luego del nombre, luego de los campos del registro, luego de los valores predeterminados de la palabra de movimiento y, si no, `?`. La fuente anterior prevalece. Las opciones ("brazos a los costados o cruzados") y las indicaciones técnicas ("mantener el pecho arriba") no fijan nada.
- Las **capas de nombre** `x g r h p` se leen solo del nombre, a través del léxico de importación, luego de los campos del registro, luego de los valores predeterminados de la palabra de movimiento y, si no, del valor predeterminado de la capa. **En modo de importación, la descripción nunca fija una capa de nombre.**
- `k` se escribe solo para las palabras de movimiento que se enumeran en [extremo móvil](#moving-end-k).
- **Peso corporal.** Se escribe `l:bw` cuando el registro o el nombre dicen peso corporal, cuando el nombre no nombra ningún implemento y la palabra de movimiento es una palabra de peso corporal, o cuando solo se nombra equipamiento de apoyo. En otro caso, cuando nada nombra un implemento, se escribe `l:?`.

Leer las capas de nombre solo del nombre es lo que hace que dos catálogos concuerden: una variante que importa está casi siempre en el nombre, porque el nombre es la forma en que un catálogo distingue sus propias variantes. Las cadenas en modo de importación sirven solo para buscar candidatos (véase [el protocolo de coincidencia](./compare-and-match.md#provenance-match-and-versioning)).

El léxico de importación, que asigna palabras del nombre a códigos, es dato de catálogo igual que las palabras de movimiento, y no forma parte de esta página.

## Reglas de capa {#layer-rules}

### Movimiento (`m`) {#motion-m}

Se escriben las acciones articulares de la fase de trabajo. En un ejercicio dinámico se escribe la dirección **concéntrica**: el sentido en que se mueven las articulaciones mientras los músculos que trabajan se acortan contra la carga. Nunca se escribe el descenso, el retorno, el aterrizaje ni una pausa.

**Qué articulaciones cuentan.** Una articulación cuenta cuando los músculos que trabajan la mueven a lo largo de un rango claro (unos 30° o más) como parte de lo que entrena el ejercicio. Una articulación mantenida quieta a propósito nunca cuenta en una parte dinámica; una base sostenida, o un empuje sostenido sobre el que se construye el ejercicio, es una parte `=` propia (véanse las partes simultáneas más abajo):

- la columna solo cuando flexionar, extender, inclinar lateralmente o girar el tronco es el movimiento;
- la escápula solo cuando el omóplato se mueve por sí mismo (un encogimiento de hombros, una flexión de brazos escapular);
- la muñeca solo en ejercicios de muñeca, el cuello solo en ejercicios de cuello;
- el tobillo solo cuando el ejercicio sube sobre las puntas de los pies o se impulsa desde el suelo;
- la rodilla no cuando mantiene una flexión fija (un peso muerto rumano, un hip thrust);
- el codo no cuando mantiene una flexión fija (una apertura, una elevación lateral);
- la rotación del antebrazo solo cuando girar contra resistencia es el trabajo; un giro de la palma durante un curl o un press es agarre (`g`);
- la rotación del hombro solo en ejercicios de rotación.

**La dirección del hombro** se juzga por la trayectoria de las manos respecto al tronco:

| Las manos se mueven | Código |
|---|---|
| Alejándose del pecho, perpendiculares al tronco, o juntándose por delante a la altura del pecho | `sh.hadd` |
| Alejándose del pecho hacia el lado de la cabeza (press inclinado) | `sh.flex+sh.hadd` |
| Hacia adelante y arriba, o hacia arriba por encima de la cabeza (elevación frontal, press por encima de la cabeza) | `sh.flex` |
| Alejándose del pecho hacia el lado de los pies (press declinado) | `sh.ext+sh.hadd` |
| Hacia abajo a lo largo del tronco, hacia los pies (fondo, press hacia abajo con brazos rectos) | `sh.ext` |
| Hacia el tronco desde delante, con los codos pegados (remo) | `sh.ext` |
| Hacia el tronco desde delante, con los codos abiertos a la altura de los hombros (face pull) | `sh.habd` |
| Separándose lateralmente a la altura del pecho, con los brazos casi rectos (apertura invertida) | `sh.habd` |
| Hacia abajo desde arriba de la cabeza, por delante de la cara (dominada supina; una dominada o un jalón con agarre supino, neutro o estrecho; un jalón con brazos rectos, un pullover, un slam) | `sh.ext.oh` |
| Hacia abajo desde arriba de la cabeza, por los costados (una dominada o un jalón con agarre prono de anchura media o abierta) | `sh.add` |
| Hacia arriba por el costado (elevación lateral; remo al mentón con `el.flex`) | `sh.abd` |

`sh.ext.oh` es hija de `sh.ext`: se escribe siempre que las manos empiezan por encima de la cabeza y bajan por delante. Así, un jalón y un remo nunca comparten movimiento, sea cual sea el agarre. `sh.ext` sola no es incorrecta para un tirón desde arriba de la cabeza, solo menos específica: la comparación la lee como si cubriera ambas trayectorias. Escrita junto a su hija en una misma parte, la acción padre no agrega nada, y la forma canónica la descarta. En una dominada o un jalón, el agarre decide entre las dos filas que empiezan por encima de la cabeza: un agarre supino, neutro o estrecho (`su`, `ne`, `w-n`, `w-t`) tira por delante de la cara, `sh.ext.oh`.

**Fases (`>`).** Una fase por cada movimiento diferenciado, en el orden de la repetición. Para cada par de movimientos se pregunta: ¿empieza el segundo antes de que termine el primero? Sí: una fase (un thruster, en el que el press empieza mientras el cuerpo aún sube). No: dos fases (una sentadilla y luego un press). Una articulación puede moverse en sentidos opuestos en fases distintas, nunca en una misma parte. Una fase que no puede determinarse es `?`.

**Prefijos.** Uno por parte, escrito antes de sus acciones:

<!-- fds:generated fxi#phasePrefixes -->
| Código | Significado |
|---|---|
| (ninguno) | Dinámico: las articulaciones se mueven a lo largo del rango; se escribe la dirección concéntrica. |
| `^` | Balístico: la fase termina en vuelo (el cuerpo deja el suelo) o en suelta (el implemento deja las manos). Una fase posterior ocurre en el aire. |
| `~` | Cíclico: ciclos continuos sin límite entre repeticiones; se escribe la mitad motriz de un ciclo. |
| `=` | Isométrico: un sostenimiento con esfuerzo durante toda la serie; se escribe hacia dónde empujan los músculos. `=0` es un sostenimiento sin dirección (equilibrio). |
| `%` | Estiramiento estático: las direcciones a las que se llevan las articulaciones, mantenidas al final del rango. |
| `&` | Estiramiento dinámico: las mismas direcciones, llevadas al final del rango y soltadas repetidamente (balanceos, pases de bastón). |
<!-- /fds:generated -->

"Explosivo" o "rápido" por sí solos no son vuelo: `^` exige que el cuerpo deje el suelo o que el implemento deje las manos. Un slam es balístico solo cuando el implemento deja las manos; un slam con cuerda de batalla, en el que la cuerda nunca las deja, no lleva `^`. Una acción hecha en el aire es la fase siguiente. Las fases cíclicas y los levantamientos olímpicos nunca llevan `^`. `~0` es rodar sobre un rodillo o una pelota sin dirección articular; `=0` es un sostenimiento de equilibrio o de presión.

**Impulso corto (`-`).** Tras una acción que recorre un rango corto a propósito: la flexión e impulso de un push press (`hip.ext-+kn.ext-`), la extensión corta tras una recepción en power.

**Partes simultáneas (`|`).** Dos partes a la vez en una misma fase: partes de clases distintas (un sostenimiento isométrico de brazos mientras las piernas caminan, `=sh.hadd|~hip.ext+kn.ext`; una plancha sostenida bajo una elevación de pierna, `=sp.flex|hip.ext`), o dos extremidades llevadas en sentidos opuestos en un mismo estiramiento (`%hip.ext|%hip.flex`). **Un empuje sostenido de extremidades que no se mueven, cuando el ejercicio se basa en él, también es una parte `=`**: un sit-up que empuja los talones contra el suelo durante toda la repetición es `=kn.flex|hip.flex+sp.flex`. Una indicación de apretar o contraer no es un empuje sostenido. Una fase con varias partes no puede contener una parte `?`.

**Articulaciones sostenidas en un estiramiento.** Se escribe una articulación sostenida cuando decide qué músculo se estira: la rodilla en un estiramiento de pantorrillas o de isquiotibiales (`kn.ext` recta, `kn.flex` flexionada).

**Automasaje.** Rodar una parte del cuerpo sobre un rodillo o una pelota es `~0`; apoyarla quieta sobre uno es `=0`. Se escribe el rodillo en `s` con el punto que descansa sobre él (`s:roller@thighs`), y ningún otro contacto.

**Círculos.** Los círculos de brazos, cadera o tobillo y los halos son `~<joint>.circ`. Una articulación en una dirección desconocida es `<joint>.?`.

<!-- fds:generated fxi#joints -->
| Código | Significado | Notas |
|---|---|---|
| `nk` | Cuello. | Admite `.circ`. |
| `sp` | Columna: el tronco, torácico y lumbar juntos. | Admite `.circ`. |
| `sc` | Escápula: el omóplato sobre la caja torácica. | Articulación del brazo. |
| `sh` | Articulación del hombro. | Articulación del brazo. Admite `.circ`. |
| `el` | Codo. | Articulación del brazo. |
| `fa` | Antebrazo: el giro que rota la palma. | Articulación del brazo. |
| `wr` | Muñeca. | Articulación del brazo. Admite `.circ`. |
| `hip` | Cadera. | Articulación de la pierna. Admite `.circ`. |
| `kn` | Rodilla. | Articulación de la pierna. |
| `ank` | Tobillo y pie. | Articulación de la pierna. Admite `.circ`. |
<!-- /fds:generated -->

<!-- fds:generated fxi#jointActions -->
| Código | Significado | Notas |
|---|---|---|
| `nk.flex` | Flexión del cuello: el mentón hacia el pecho. | Opuesta de `nk.ext`. |
| `nk.ext` | Extensión del cuello: la cabeza se inclina hacia atrás. | Opuesta de `nk.flex`. |
| `nk.lflex` | Inclinación lateral del cuello: la oreja hacia el hombro. |  |
| `nk.rot` | Rotación del cuello: girar la cabeza. |  |
| `sp.flex` | Flexión del tronco: las costillas hacia la pelvis, como en un crunch. | Opuesta de `sp.ext`. |
| `sp.ext` | Extensión del tronco: enderezar o arquear la espalda desde una posición flexionada. | Opuesta de `sp.flex`. |
| `sp.lflex` | Inclinación lateral del tronco. |  |
| `sp.rot` | Rotación del tronco: los hombros giran respecto a las caderas. |  |
| `sc.elev` | Elevación escapular: encogimiento hacia arriba. | Opuesta de `sc.dep`. |
| `sc.dep` | Depresión escapular: los hombros tirados hacia abajo. | Opuesta de `sc.elev`. |
| `sc.pro` | Protracción escapular: los omóplatos se separan alrededor de las costillas. | Opuesta de `sc.ret`. |
| `sc.ret` | Retracción escapular: los omóplatos se juntan. | Opuesta de `sc.pro`. |
| `sh.flex` | Flexión de hombro: el brazo hacia adelante y arriba, como en una elevación frontal o un press por encima de la cabeza. | Opuesta de `sh.ext`. |
| `sh.ext` | Extensión de hombro: el brazo hacia abajo y atrás desde delante, como en un remo o un fondo. Cubre `sh.ext.oh`. | Opuesta de `sh.flex`. |
| `sh.ext.oh` | Extensión de hombro desde arriba de la cabeza: los brazos bajan por delante de la cara desde encima de la cabeza, como en una dominada supina, un jalón estrecho o neutro, un jalón con brazos rectos, un pullover o un slam. | Hija de `sh.ext`; `sh.ext` la cubre en la comparación. |
| `sh.abd` | Abducción de hombro: el brazo hacia el lado y arriba, como en una elevación lateral. | Opuesta de `sh.add`. |
| `sh.add` | Aducción de hombro: el brazo hacia abajo, al costado, desde el lado, como en una dominada abierta. | Opuesta de `sh.abd`. |
| `sh.hadd` | Aducción horizontal: el brazo cruza por delante a la altura del pecho, como en un press o una apertura. | Opuesta de `sh.habd`. |
| `sh.habd` | Abducción horizontal: el brazo hacia atrás y afuera a la altura del pecho, como en una apertura invertida. | Opuesta de `sh.hadd`. |
| `sh.ir` | Rotación interna de hombro: el antebrazo gira hacia dentro, hacia el abdomen, con el codo flexionado. | Opuesta de `sh.er`. |
| `sh.er` | Rotación externa de hombro: el antebrazo gira hacia fuera, con el codo flexionado. | Opuesta de `sh.ir`. |
| `el.flex` | Flexión de codo, como en un curl. | Opuesta de `el.ext`. |
| `el.ext` | Extensión de codo, como en un press o una extensión de tríceps. | Opuesta de `el.flex`. |
| `fa.pron` | Pronación del antebrazo: la palma gira hacia abajo. | Opuesta de `fa.sup`. |
| `fa.sup` | Supinación del antebrazo: la palma gira hacia arriba. | Opuesta de `fa.pron`. |
| `wr.flex` | Flexión de muñeca: la palma hacia el antebrazo. | Opuesta de `wr.ext`. |
| `wr.ext` | Extensión de muñeca: el dorso de la mano hacia el antebrazo. | Opuesta de `wr.flex`. |
| `wr.rdev` | Desviación radial de la muñeca: el lado del pulgar hacia el antebrazo. | Opuesta de `wr.udev`. |
| `wr.udev` | Desviación cubital de la muñeca: el lado del meñique hacia el antebrazo. | Opuesta de `wr.rdev`. |
| `hip.flex` | Flexión de cadera: el muslo hacia el tronco, o el tronco hacia el muslo. | Opuesta de `hip.ext`. |
| `hip.ext` | Extensión de cadera: el muslo se aleja del tronco, como al levantarse de una sentadilla. | Opuesta de `hip.flex`. |
| `hip.abd` | Abducción de cadera: la pierna hacia el lado. | Opuesta de `hip.add`. |
| `hip.add` | Aducción de cadera: la pierna hacia la otra pierna. | Opuesta de `hip.abd`. |
| `hip.ir` | Rotación interna de cadera: la rodilla gira hacia dentro. | Opuesta de `hip.er`. |
| `hip.er` | Rotación externa de cadera: la rodilla gira hacia fuera. | Opuesta de `hip.ir`. |
| `kn.flex` | Flexión de rodilla contra resistencia, como en un curl femoral. | Opuesta de `kn.ext`. |
| `kn.ext` | Extensión de rodilla, como al levantarse de una sentadilla. | Opuesta de `kn.flex`. |
| `ank.df` | Dorsiflexión del tobillo: los dedos de los pies hacia la espinilla. | Opuesta de `ank.pf`. |
| `ank.pf` | Flexión plantar del tobillo: subir sobre las puntas de los pies, impulsarse. | Opuesta de `ank.df`. |
| `ank.inv` | Inversión del tobillo: la planta gira hacia dentro. | Opuesta de `ank.ev`. |
| `ank.ev` | Eversión del tobillo: la planta gira hacia fuera. | Opuesta de `ank.inv`. |
<!-- /fds:generated -->

### Orientación (`o`) {#orientation-o}

La orientación del cuerpo **al inicio de la primera fase escrita**. Los ángulos del tronco se miden desde la horizontal: plano dentro de 15°, inclinado o declinado entre 15 y 60°, y más de 60° con la cabeza arriba es sentado o de pie.

- Inclinado hacia adelante más de unos 30° desde la cadera y **sostenido** así durante la serie es `standing.bent`. Una bisagra en la que el tronco se mueve (un peso muerto, un swing) empieza en `standing`.
- En cuadrupedia, en plancha o en flexión de brazos, acostado boca abajo: `prone` y sus franjas de inclinación. La orientación sigue al tronco, no a las rodillas: de rodillas con el tronco plegado hacia adelante sobre los muslos (postura del niño) es `prone`; `kneeling` lleva el tronco erguido. Con las caderas en el punto más alto, en V invertida: `prone.pike`.
- Sentado en el suelo, inclinado hacia atrás entre 30 y 60°: `supine.incline`.
- Sostenido por las manos, incluido apoyado en barras paralelas: `hanging`.
- En una máquina, se escribe la posición del cuerpo: una extensión de cuádriceps sentado es `seated`, un curl femoral acostado `prone`, una prensa de piernas reclinada `supine.incline`.
- Cuando la repetición termina en una orientación distinta (levantarse del suelo), se escribe `start>end`. Una repetición que baja y vuelve a subir termina donde empezó y escribe solo el inicio.
- `*` cuando el ejercicio está pensado para hacerse de cualquiera de las dos formas; `?` cuando nada lo indica.

<!-- fds:generated fxi#orientations -->
| Código | Significado | Notas |
|---|---|---|
| `standing` | De pie, con el tronco a menos de unos 30° de la vertical. | Implica `feet` sobre el apoyo. |
| `standing.bent` | De pie, con el tronco inclinado hacia adelante desde la cadera más de unos 30° y sostenido así (remo inclinado). | Implica `feet` sobre el apoyo. |
| `seated` | Sentado, con el tronco a más de 60° de la horizontal. | Implica `seat` sobre el apoyo. |
| `seated.bent` | Sentado, con el tronco inclinado hacia adelante sobre los muslos y sostenido así (elevación sentado e inclinado). | Implica `seat` sobre el apoyo. |
| `kneeling` | Sobre ambas rodillas, con el tronco erguido. En cuadrupedia es `prone`. | Implica `knees`, `shins` sobre el apoyo. |
| `kneeling.half` | Sobre una rodilla, con el otro pie adelantado. | Implica `knees`, `feet` sobre el apoyo. |
| `supine` | Boca arriba, con el tronco a menos de 15° de la horizontal. | Implica `back` sobre el apoyo. |
| `supine.incline` | Boca arriba, con la cabeza más alta que las caderas y el tronco entre 15 y 60° de la horizontal. | Implica `back` sobre el apoyo. |
| `supine.decline` | Boca arriba, con la cabeza más baja que las caderas y el tronco entre 15 y 60° de la horizontal. | Implica `back` sobre el apoyo. |
| `prone` | Boca abajo, con el tronco a menos de 15° de la horizontal: acostado, en plancha, en flexión de brazos, en cuadrupedia. | Implica `chest` sobre el apoyo. |
| `prone.incline` | Boca abajo, con la cabeza más alta que las caderas, entre 15 y 60° (manos elevadas). | Implica `chest` sobre el apoyo. |
| `prone.decline` | Boca abajo, con la cabeza más baja que las caderas, entre 15 y 60° (pies elevados). | Implica `chest` sobre el apoyo. |
| `prone.pike` | Boca abajo, con las caderas en el punto más alto, manos y pies en el suelo y el tronco a más de 60° con la cabeza abajo (pica). | Implica `feet`, `hands` sobre el apoyo. |
| `side-lying` | De lado: acostado, o en plancha lateral. | No implica ningún punto. |
| `hanging` | Sostenido por las manos o los brazos, con los pies sin tocar el suelo: colgado de una barra, apoyado en barras paralelas. | Implica `hands` sobre el apoyo. |
| `inverted` | Cabeza abajo, con el tronco a menos de 30° de la vertical y la cabeza en el punto más bajo: parada de manos, parada de cabeza. | Implica `hands` sobre el apoyo. |
<!-- /fds:generated -->

### Extremo móvil (`k`) {#moving-end-k}

`k:trunk` cuando el tronco se mueve y las piernas se quedan quietas: un sit-up, un crunch (no un crunch invertido), una extensión de espalda, un puente o un hip thrust, un glute-ham raise, un curl nórdico, un crunch en polea o de rodillas, una máquina de crunch abdominal. `k:both` cuando ambos extremos se mueven el uno hacia el otro: un V-up, una navaja, un tuck-up. En modo de importación, `k` se escribe solo para esas palabras.

<!-- fds:generated fxi#movingEnds -->
| Código | Significado | Notas |
|---|---|---|
| `limbs` | Se mueve el extremo de las extremidades (predeterminado, nunca se escribe). | Predeterminado, nunca se escribe. |
| `trunk` | Se mueve el extremo del tronco; las piernas se quedan quietas: sit-up, crunch, puente, hip thrust, extensión de espalda, glute-ham raise, curl nórdico. |  |
| `both` | Ambos extremos se mueven el uno hacia el otro: V-up, navaja, tuck-up. |  |
<!-- /fds:generated -->

### Trabajo de pies (`f`) {#footwork-f}

Un paso vuelve en cada repetición; un desplazamiento continúa. Una zancada sin dirección da un paso hacia adelante; una zancada inversa da un paso hacia atrás; una zancada lateral da un paso hacia el lado; una zancada cruzada (curtsy) da un paso hacia atrás y cruzado. Una sentadilla dividida o una zancada en el lugar es `split`; una zancada caminando, un acarreo, un empuje de trineo, un gateo y un salto horizontal se desplazan hacia adelante. Un split jerk es `level>split`. "En el lugar" y el trabajo en una máquina de cardio omiten `f`.

<!-- fds:generated fxi#footwork -->
| Código | Significado | Notas |
|---|---|---|
| `level` | Pies plantados a la par (predeterminado). Se escribe solo dentro de una secuencia. | Predeterminado, nunca se escribe. |
| `split` | Pies plantados en postura dividida, uno delante del otro. |  |
| `step.fwd` | Cada repetición da un paso hacia adelante y vuelve. |  |
| `step.back` | Cada repetición da un paso hacia atrás y vuelve. |  |
| `step.side` | Cada repetición da un paso hacia el lado y vuelve. |  |
| `step.cross` | Cada repetición da un paso hacia atrás y cruzado por detrás de la otra pierna (curtsy) y vuelve. |  |
| `travel.fwd` | El cuerpo se desplaza hacia adelante y no vuelve en cada repetición. |  |
| `travel.back` | Se desplaza hacia atrás. |  |
| `travel.side` | Se desplaza lateralmente. |  |
<!-- /fds:generated -->

### Apoyo (`s`) {#support-s}

Se escribe cada superficie que soporta el peso del cuerpo, o sobre la que se apoya una extremidad, más allá de lo que implica la orientación. Se usa cualquier token de equipamiento salvo `bw`, luego `@` y los puntos corporales sobre ella, omitiendo los puntos que implica la orientación inicial.

Nunca se escribe el suelo solo; el asiento de un ejercicio sentado (salvo que sea inestable: una pelota, un BOSU, una tabla, un rodillo); el asiento, los acolchados o los manerales propios de una máquina; una colchoneta; el equipamiento que solo carga el cuerpo; ni un apoyo de la mano usado solo para mantener el equilibrio. Una mano que se agarra a una jaula o a un poste para sostener el cuerpo sí soporta peso: `s:rack@hands`.

Cuando el tronco no descansa sobre nada (una plancha, una flexión de brazos), se enumeran todos los puntos que soportan peso: `s:floor@feet,hands`. Superficies distintas bajo puntos distintos son elementos separados: `s:ball@feet+floor@hands`. No se escribe `floor@feet` junto a otro apoyo cuando el cuerpo está sentado, o acostado boca arriba sobre un apoyo que soporta su tronco; se reserva para un cuerpo boca arriba colgado de las manos (un remo invertido, `s:bar@hands+floor@feet`). Un cajón, escalón, banco o plataforma bajo las manos o los pies elevados es `box` salvo que se nombre la superficie. Sentarse sobre un cajón es `s:box@seat`. Una superficie a la que se sube o se salta cuenta (`s:box`).

<!-- fds:generated fxi#bodyPoints -->
| Código | Significado |
|---|---|
| `hands` | Las manos, o una mano. |
| `forearms` | Los antebrazos, con los codos flexionados (plancha sobre los codos). |
| `elbows` | El pliegue de los codos (Zercher). |
| `arms` | La parte superior de los brazos (acolchado de banco predicador). |
| `shoulders` | Sobre la parte delantera de los hombros y las clavículas (rack frontal), o sobre un hombro. |
| `chest` | Contra el pecho (goblet, abrazo de oso). |
| `back` | Sobre la parte alta de la espalda (sentadilla trasera). |
| `hips` | Sobre la parte delantera de las caderas (hip thrust). |
| `waist` | Colgado de un cinturón a la cintura. |
| `seat` | Los glúteos (al sentarse sobre un cajón o un banco). |
| `thighs` | Sobre los muslos o alrededor de ellos. |
| `knees` | En las rodillas o alrededor de ellas. |
| `shins` | Las espinillas. |
| `calves` | Las pantorrillas (la parte posterior de la pierna). |
| `ankles` | En los tobillos o justo por encima (correa, tobillera, acolchado de máquina en la parte inferior de la pierna). |
| `feet` | Los pies, o un pie. |
| `head` | La cabeza o la frente. |
<!-- /fds:generated -->

### Carga (`l`) {#load-l}

Se enumeran todos los implementos que cargan los músculos que trabajan, cada uno con `@` y el lugar donde se sostiene.

- `bw` significa sin implemento. Va solo y no lleva punto de sujeción; un fondo lastrado es `l:plate@waist`, no `bw+plate`.
- **Las máquinas y las estaciones provienen del FXE.** Primero se decide el equipamiento ([FXE](./fxe.md)). Una máquina dedicada se escribe `mach`, una máquina de cardio `erg` (o su hijo de ciclo, `erg.row`), una columna de poleas `cable`, una máquina Smith `smith`, un landmine `landmine`.
- Una máquina de cardio va siempre en `l`, sostenida donde su parte móvil se encuentra con el cuerpo, nunca en `s`.
- Una banda es `band`, sostenida donde presiona o tira del cuerpo; donde está anclada no se escribe. Su tipo va solo en el FXE. En un trabajo que solo mueve las piernas, una banda es `@feet` salvo que se indique lo contrario.
- La asistencia se sostiene `@assist`. Una máquina de dominadas o fondos asistidos es siempre `mach@assist`; el FXE registra dónde se encuentra su acolchado con el cuerpo.

**Puntos de sujeción.** En las manos, a los costados, con los brazos extendidos o balanceado: `@hands`, y también lo son las mancuernas sostenidas a la altura de los hombros, una banda cuyos extremos se sostienen con las manos a la altura de los hombros y una barra empujada sin apoyarla en los hombros. Con los brazos rectos por encima de la cabeza durante toda la repetición: `@overhead`. Apoyado en la parte delantera de los hombros, o el extremo de un landmine sostenido a la altura del hombro: `@shoulders`. Abrazado contra el pecho: `@chest`. Sobre la parte alta de la espalda, incluida una barra por detrás del cuello: `@back`. Sobre las caderas: `@hips`. Colgado de un cinturón: `@waist`. En el pliegue de los codos: `@elbows`. Un peso sobre el regazo en una elevación de talones sentado: `@thighs`.

<!-- fds:generated fxi#holdOnlyPoints -->
| Código | Significado |
|---|---|
| `overhead` | Sostenido con las manos, con los brazos rectos por encima de la cabeza durante toda la repetición. |
| `assist` | El implemento soporta parte del peso corporal (banda de asistencia, máquina asistida). |
<!-- /fds:generated -->

**Cantidades.** La cantidad se omite cuando es la habitual; la canonicalización descarta una cantidad escrita igual a ella. Un implemento de una mano (`db`, `kb`, `plate`, `club`) es uno por cada mano que trabaja: uno cuando los brazos trabajan de uno en uno (`x` es `u@arms`, o `u` con un movimiento solo de articulaciones del brazo), dos en otro caso. Un `x:u` sin alcance en un movimiento de articulaciones de la pierna, o de articulaciones del brazo y de la pierna (una zancada con un press a una mano), deja ambas manos cargadas: una sola mancuerna ahí es `db*1@hands`. Así, `db@hands` es una mancuerna en un remo a una mano (`x:u`) y dos en una sentadilla, un curl alternado (`x:a`) o una sentadilla dividida (`x:u`, las piernas). Cualquier otro implemento es uno, y también lo es cualquier implemento sostenido en un punto del tronco (`chest`, `back`, `hips`, `waist`). Se escribe `*n` solo cuando la cantidad difiere: una pesa rusa sostenida con ambas manos es `kb*1@hands`. Cuando el implemento, el punto de sujeción de un implemento de una mano, la simetría o el movimiento bajo un `x:u` sin alcance son `?`, la cantidad habitual es desconocida, y una cantidad escrita se mantiene.

**Desconocidos.** Un implemento de tipo desconocido: `?@chest`. Un punto de sujeción desconocido: `kb@?`. Un implemento de tipo desconocido en un punto desconocido ("con lastre", sin más): `?@?`. Nada conocido, ni siquiera si hay un implemento: `l:?`.

**Tokens de equipamiento.** Cada token es un alias de un FXE estándar. Un token hijo precisa a su padre: `dome` cubre `dome.up` y `dome.down`; `erg` cubre cada `erg.<cycle>`.

<!-- fds:generated fxi#equipmentTokens -->
| Token | En | FXE estándar que representa | Significado |
|---|---|---|---|
| `bw` | `l` | `FXE=1.0S/k:none` | Sin implemento: solo peso corporal. Va solo, sin punto de sujeción. |
| `bb` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.straight` | Barra. |
| `ez` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.ez` | Barra EZ. |
| `tb` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.trap` | Barra hexagonal (trap bar). |
| `axle` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.axle` | Barra gruesa (axle). |
| `camber` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.camber` | Barra curvada (cambered). |
| `db` | `l`, `s` | `FXE=1.0S/k:imp/f:bell.dumb` | Mancuerna. |
| `kb` | `l`, `s` | `FXE=1.0S/k:imp/f:bell.kettle` | Pesa rusa. |
| `circus` | `l`, `s` | `FXE=1.0S/k:imp/f:bell.circus` | Mancuerna de circo. |
| `mb` | `l`, `s` | `FXE=1.0S/k:imp/f:ball.med` | Balón medicinal. |
| `slam` | `l`, `s` | `FXE=1.0S/k:imp/f:ball.slam` | Slam ball. |
| `bag` | `l`, `s` | `FXE=1.0S/k:imp/f:bag.sand` | Saco de arena. |
| `hbag` | `l`, `s` | `FXE=1.0S/k:imp/f:bag.heavy` | Saco de boxeo. |
| `plate` | `l`, `s` | `FXE=1.0S/k:imp/f:plate` | Disco. |
| `chain` | `l`, `s` | `FXE=1.0S/k:imp/f:chain` | Cadena. |
| `rope` | `l`, `s` | `FXE=1.0S/k:imp/f:rope.battle` | Cuerda de batalla. |
| `jrope` | `l`, `s` | `FXE=1.0S/k:imp/f:rope.jump` | Cuerda para saltar. |
| `band` | `l`, `s` | `FXE=1.0S/k:imp/f:band` | Cualquier banda de resistencia, tubo, superband o miniband. |
| `sled` | `l`, `s` | `FXE=1.0S/k:imp/f:sled` | Trineo de arrastre o prowler. |
| `tire` | `l`, `s` | `FXE=1.0S/k:imp/f:tire` | Neumático. |
| `hammer` | `l`, `s` | `FXE=1.0S/k:imp/f:hammer` | Mazo. |
| `stone` | `l`, `s` | `FXE=1.0S/k:imp/f:stone` | Piedra Atlas. |
| `log` | `l`, `s` | `FXE=1.0S/k:imp/f:log` | Tronco. |
| `keg` | `l`, `s` | `FXE=1.0S/k:imp/f:keg` | Barril. |
| `yoke` | `l`, `s` | `FXE=1.0S/k:imp/f:yoke` | Yugo. |
| `frame` | `l`, `s` | `FXE=1.0S/k:imp/f:frame.carry` | Asas de granjero o estructura de acarreo (rickshaw). |
| `car` | `l`, `s` | `FXE=1.0S/k:imp/f:car` | Automóvil. |
| `vest` | `l`, `s` | `FXE=1.0S/k:imp/f:wear.vest` | Chaleco lastrado. |
| `ankwt` | `l`, `s` | `FXE=1.0S/k:imp/f:wear.ankle` | Tobillera lastrada. |
| `club` | `l`, `s` | `FXE=1.0S/k:imp/f:club` | Clava o maza. |
| `dowel` | `l`, `s` | `FXE=1.0S/k:imp/f:stick` | Bastón, palo de escoba o tubo de PVC: coloca las manos, no agrega carga. |
| `wheel` | `l`, `s` | `FXE=1.0S/k:imp/f:wheel` | Rueda abdominal. |
| `wroller` | `l`, `s` | `FXE=1.0S/k:imp/f:roller.wrist` | Rodillo de muñeca. |
| `harness` | `l`, `s` | `FXE=1.0S/k:imp/f:harness.head` | Arnés de cabeza. |
| `cable` | `l`, `s` | `FXE=1.0S/k:stn/f:cable` | Columna de poleas o estación de cruce de poleas (no una máquina de jalón ni de remo sentado). |
| `smith` | `l`, `s` | `FXE=1.0S/k:stn/f:smith` | Máquina Smith. |
| `landmine` | `l`, `s` | `FXE=1.0S/k:stn/f:landmine` | Landmine, o el extremo de una barra encajado en una esquina. |
| `erg.gait` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:gait` | Máquina de cardio para caminar o correr sobre una banda (caminadora). Hijo de `erg`. |
| `erg.step` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:step` | Máquina de cardio para subir escalones (escaladora de pedales, stepmill). Hijo de `erg`. |
| `erg.cycle` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:cycle` | Máquina de cardio para pedalear o girar manivelas con las manos (bicicleta, air bike, ergómetro de brazos). Hijo de `erg`. |
| `erg.row` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:row` | Máquina de remo. Hijo de `erg`. |
| `erg.pole` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:pole` | Ski erg. Hijo de `erg`. |
| `erg.glide` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:glide` | Elíptica. Hijo de `erg`. |
| `erg.climb` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:climb` | Máquina de escalada (escalador vertical o de escalera). Hijo de `erg`. |
| `mach` | `l`, `s` | `FXE=1.0S/k:mac/l:?/s:?/m:?` | Cualquier máquina de fuerza dedicada (incluidas las máquinas de jalón y de remo sentado en polea). El FXE de la fila indica cuál. |
| `erg` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?` | Cualquier máquina de cardio: caminadora, bicicleta, máquina de remo, elíptica, máquina de escaleras, ski erg. El FXE de la fila indica cuál. |
| `floor` | `s` | `FXE=1.0S/k:sup/f:floor` | El suelo o una colchoneta. |
| `wall` | `s` | `FXE=1.0S/k:sup/f:wall` | Una pared. |
| `bench` | `s` | `FXE=1.0S/k:sup/f:bench` | Un banco. |
| `box` | `s` | `FXE=1.0S/k:sup/f:box` | Un cajón, escalón o plataforma. |
| `chair` | `s` | `FXE=1.0S/k:sup/f:chair` | Una silla. |
| `block` | `s` | `FXE=1.0S/k:sup/f:block` | Bloques de levantamiento. |
| `rack` | `s` | `FXE=1.0S/k:sup/f:rack` | Jaula de potencia o soporte de sentadilla. |
| `ball` | `s` | `FXE=1.0S/k:sup/f:ball.stab` | Pelota de estabilidad. |
| `dome` | `s` | `FXE=1.0S/k:sup/f:dome` | BOSU, sin indicar qué lado va arriba. |
| `dome.up` | `s` | `FXE=1.0S/k:sup/f:dome` | BOSU con la cúpula hacia arriba. Hijo de `dome`. |
| `dome.down` | `s` | `FXE=1.0S/k:sup/f:dome` | BOSU con el lado plano hacia arriba (cúpula en el suelo). Hijo de `dome`. |
| `board` | `s` | `FXE=1.0S/k:sup/f:board.bal` | Tabla de equilibrio. |
| `roller` | `s` | `FXE=1.0S/k:sup/f:roller.foam` | Rodillo de espuma. |
| `slider` | `s` | `FXE=1.0S/k:sup/f:slider` | Disco deslizante. |
| `strap` | `s` | `FXE=1.0S/k:sup/f:strap.susp` | Correas de suspensión. |
| `ring` | `s` | `FXE=1.0S/k:sup/f:ring` | Anillas de gimnasia. |
| `crope` | `s` | `FXE=1.0S/k:sup/f:rope.climb` | Cuerda de trepa. |
| `bar` | `s` | `FXE=1.0S/k:sup/f:bar.fixed` | Barra fija: barra de dominadas, o una barra colocada en el soporte que se usa como asidero. |
| `bars` | `s` | `FXE=1.0S/k:sup/f:bar.parallel` | Barras paralelas para fondos. |
| `pbars` | `s` | `FXE=1.0S/k:sup/f:bar.parallette` | Paralelas bajas (parallettes). |
| `preacher` | `s` | `FXE=1.0S/k:sup/f:pad.preacher` | Acolchado de banco predicador. |
| `hyper` | `s` | `FXE=1.0S/k:sup/f:pad.hyper` | Banco de extensiones de espalda (silla romana para elevaciones de espalda o laterales). |
| `ghd` | `s` | `FXE=1.0S/k:sup/f:pad.ghd` | Glute-ham developer (GHD). |
| `vkr` | `s` | `FXE=1.0S/k:sup/f:station.vkr` | Silla del capitán / estación de elevación de rodillas. |
| `pole` | `s` | `FXE=1.0S/k:sup/f:pole` | Un poste o pilar vertical agarrado con las manos (bandera humana). |
| `mball` | `s` | `FXE=1.0S/k:sup/f:ball.massage` | Pelota de masaje o de lacrosse. |
<!-- /fds:generated -->

### Simetría (`x`) {#symmetry-x}

Se agrega un alcance cuando solo los brazos o solo las piernas siguen el patrón: `u@arms`, `u@legs`. Cuando los brazos y las piernas siguen patrones distintos, se escribe un elemento por alcance: un acarreo de maleta es `x:rc@legs+u@arms`. Se escribe un código, o uno por alcance. Un estiramiento, un rodamiento o un sostenimiento que trabaja una extremidad y luego la otra es `x:u`.

<!-- fds:generated fxi#symmetry -->
| Código | Significado | Notas |
|---|---|---|
| `b` | Bilateral: ambas extremidades trabajan a la vez, o el movimiento no tiene lados (predeterminado, nunca se escribe). | Predeterminado, nunca se escribe. |
| `u` | Unilateral: un lado hace todas las repeticiones de la serie y luego el otro lado. |  |
| `a` | Alternado: los lados se turnan repetición a repetición; un lado trabaja mientras el otro espera. |  |
| `rc` | Recíproco: ambos lados se mueven a la vez en sentidos opuestos (marcha, patadas de tijera, press en balancín). |  |
<!-- /fds:generated -->

<!-- fds:generated fxi#symmetryScopes -->
| Código | Significado |
|---|---|
| `arms` | El patrón se aplica a los brazos. |
| `legs` | El patrón se aplica a las piernas. |
<!-- /fds:generated -->

### Agarre y postura de pies (`g`) {#grip-and-stance-g}

Una orientación de manos, una anchura y una postura de pies por fase, unidas con `+`: `g:ne+w-n`. La anchura se aplica a las manos sobre un implemento y sobre un apoyo (una flexión diamante es `w-t`). Cuando el agarre cambia dentro de la repetición, se escribe una fase por posición: un curl que gira de agarre supino a prono es `g:su>pr`.

<!-- fds:generated fxi#handOrientations -->
| Código | Significado |
|---|---|
| `pr` | Prono: palmas hacia abajo o hacia fuera (agarre prono). |
| `su` | Supino: palmas hacia arriba o hacia uno mismo (agarre supino). |
| `ne` | Neutro: las palmas se miran entre sí (martillo). |
| `mx` | Mixto: una mano en prono y otra en supino. |
<!-- /fds:generated -->

<!-- fds:generated fxi#gripWidths -->
| Código | Significado | Notas |
|---|---|---|
| `w-t` | Manos que se tocan o se superponen (diamante). |  |
| `w-n` | Estrecho: manos por dentro de la anchura de los hombros. |  |
| `w-m` | Medio: aproximadamente a la anchura de los hombros (predeterminado, nunca se escribe). | Predeterminado, nunca se escribe. |
| `w-w` | Abierto: manos bastante por fuera de la anchura de los hombros. |  |
<!-- /fds:generated -->

<!-- fds:generated fxi#stances -->
| Código | Significado | Notas |
|---|---|---|
| `st-n` | Postura estrecha: pies juntos o a menos de la anchura de las caderas. |  |
| `st-m` | Postura media: aproximadamente a la anchura de las caderas (predeterminado, nunca se escribe). | Predeterminado, nunca se escribe. |
| `st-w` | Postura abierta (sumo). |  |
<!-- /fds:generated -->

### Rango e inicio (`r`) {#range-and-start-r}

Como máximo un código de inicio, y solo donde no es el inicio habitual del movimiento. Nunca se escribe `r` para el rango completo. El cajón desde el que se deja caer un salto en profundidad es el inicio (`from-drop`), no un apoyo; un cajón al que se salta después sí lo es (`s:box`).

<!-- fds:generated fxi#ranges -->
| Código | Significado | Notas |
|---|---|---|
| `partial` | Parte del rango habitual a propósito: medio, cuarto, pulsos, mitad superior o inferior. |  |
| `deep` | Más profundo que el rango habitual: profundidad completa, hasta abajo, profundidad de pistol. |  |
| `deficit` | De pie sobre algo para bajar más de lo habitual. |  |
| `from-floor` | Cada repetición empieza con la carga apoyada en el suelo, donde el inicio habitual no es el suelo. | Código de inicio. |
| `from-top` | Empieza de pie con la carga sostenida, que se baja sin dejarla apoyada (colgado), donde ese no es el inicio habitual. Sin hijo, el colgado habitual: por encima de la rodilla. | Código de inicio. |
| `from-top.knee` | Un colgado que empieza a la altura de la rodilla o por debajo. Hijo de `from-top`. | Código de inicio. Hijo de `from-top`; `from-top` lo cubre en la comparación. |
| `from-pins` | Cada repetición empieza desde topes, bloques o un soporte por encima del suelo. | Código de inicio. |
| `from-drop` | Cada repetición empieza con una caída: el cuerpo baja de un cajón o una plataforma y aterriza antes de la fase de trabajo (salto en profundidad). El cajón desde el que se cae no se escribe en `s`. | Código de inicio. |
<!-- /fds:generated -->

### Postura sostenida (`h`) y línea de tracción (`p`) {#held-posture-h-and-line-of-pull-p}

Ambas son capas de nombre estándar con un valor predeterminado. Un propietario escribe la postura sostenida y la línea que el ejercicio usa realmente. `h:?` o `p:?` es para una fuente que dice que la postura o la línea difieren sin decir cómo.

Un anclaje en el suelo (un trineo en el suelo, una banda bajo los pies) es `lo`. `p:neck` separa un press que se baja al cuello o a la garganta del press de banca con el mismo agarre; `p:double` separa una cuerda que pasa dos veces en cada salto del salto de cuerda simple.

<!-- fds:generated fxi#heldPostures -->
| Código | Significado | Notas |
|---|---|---|
| `none` | Sin postura sostenida: las extremidades que no trabajan hacen lo que implica la palabra de movimiento (predeterminado, nunca se escribe). | Predeterminado, nunca se escribe. |
| `arms.oh` | Brazos sostenidos rectos por encima de la cabeza, sin nada en las manos. |  |
| `arms.fwd` | Brazos sostenidos rectos y extendidos hacia adelante desde los hombros, sin nada en las manos ("brazos extendidos", "brazo recto"). |  |
| `arms.side` | Brazos sostenidos extendidos hacia los lados. |  |
| `arms.cross` | Brazos cruzados sobre el pecho. |  |
| `hands.head` | Manos detrás de la cabeza o sobre ella (prisionero). |  |
| `el.bent` | Codos que trabajan sostenidos flexionados a unos 90° ("brazo flexionado", "90 grados"). |  |
| `ua.oh` | Brazos sostenidos en alto junto a la cabeza mientras trabajan los codos (extensión de tríceps por encima de la cabeza). | Nunca con `ua.side`. |
| `ua.side` | Brazos sostenidos separados de los costados, con los codos abiertos, mientras trabajan los codos (curl de bíceps interno, Tate press). | Nunca con `ua.oh`. |
| `leg.fwd` | Pierna libre sostenida recta por delante. |  |
| `leg.back` | Pierna libre sostenida por detrás. |  |
| `legs.l` | Piernas sostenidas rectas a unos 90° de flexión de cadera. | Nunca con `kn.bent`. |
| `kn.bent` | Rodillas sostenidas flexionadas mientras trabajan las caderas o los brazos (elevación de rodillas colgado; remo invertido con los pies planos en el suelo). | Nunca con `legs.l`. |
| `trunk.fwd` | Tronco sostenido inclinado hacia adelante donde la orientación no lo indica ya (fondo de pecho). |  |
<!-- /fds:generated -->

<!-- fds:generated fxi#lines -->
| Código | Significado | Notas |
|---|---|---|
| `usual` | La línea de tracción que implica la palabra de movimiento (predeterminado, nunca se escribe). | Predeterminado, nunca se escribe. |
| `hi` | Polea o banda anclada más alta de lo habitual para la palabra de movimiento. | Nunca con `lo`, `side`. |
| `lo` | Anclada más baja de lo habitual para la palabra de movimiento. | Nunca con `hi`, `side`. |
| `behind` | La carga o el cuerpo pasan por detrás de la cabeza o del tronco en lugar de por delante (press tras nuca, dominada tras nuca). |  |
| `side` | La carga tira desde un lado: el cuerpo está de costado respecto al anclaje (un press en polea hecho de costado). | Nunca con `hi`, `lo`. |
| `neck` | La carga baja al cuello, la garganta o el mentón en lugar de al pecho (JM press, press guillotina). |  |
| `double` | Una cuerda pasa dos veces bajo los pies en cada salto (double under). |  |
<!-- /fds:generated -->

### Accesorio (`a`, extendida) {#accessory-a-extended}

Un accesorio nunca carga los músculos que trabajan (eso es `l`) ni soporta peso (eso es `s`). Una cadena que lleva `a` lleva la bandera `N`, y la comparación considera `a` solo cuando ambas cadenas la llevan. Se omite cuando no se declara ningún accesorio.

<!-- fds:generated fxi#accessories -->
| Código | Significado | Notas |
|---|---|---|
| `none` | Sin accesorio (predeterminado, nunca se escribe). | Predeterminado, nunca se escribe. |
| `strap` | Una correa, un cinturón, una toalla o una cuerda que se usa para tirar de una extremidad o sostenerla (correa de estiramiento). |  |
| `partner` | Un compañero que sostiene, resiste o asiste. |  |
<!-- /fds:generated -->

## Cómo se reparten los hechos FXI y FXE {#how-fxi-and-fxe-divide-the-facts}

| Corresponde a FXE | Corresponde a FXI |
|---|---|
| Qué es el equipamiento | El movimiento articular y sus fases |
| La geometría fija: interfaz de carga, la postura que impone una máquina, el movimiento que guía | La orientación |
| El accionamiento, la restricción y los atributos de diseño | El agarre, la simetría, el rango, el trabajo de pies |
| | Los ajustes de cada uso: altura de la polea, ángulo del banco, anclaje de la banda |
| | El punto de sujeción y la cantidad |

Los hechos compartidos se comprueban entre sí, nunca se cuentan dos veces. La comparación de FXI nunca considera la clase de máquina; la comparación de FXE nunca considera una elección de cada uso. [FXE](./fxe.md#checks-between-fxi-and-fxe) enumera las comprobaciones cruzadas.
