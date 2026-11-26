---
title: Clave de equipamiento
sidebar_label: Clave de equipamiento
description: Cómo se compone la clave estructural de equipamiento (fxe), capa por capa.
---

# Clave de equipamiento

La clave de equipamiento es la clave estructural de un equipamiento. Va en el campo `fxe` y registra qué clase de equipamiento es y su forma: para un objeto libre o una superficie, cuál es; para una máquina, dónde se encuentra con el cuerpo, la posición en la que pone el cuerpo y el movimiento que guía. Esta página muestra cómo se arma una clave, qué significa cada capa y cada código, y cómo se comparan dos claves.

El encabezado `FXE=1.0` es la versión de la clave, y las listas de códigos llegan con el lanzamiento de FDS que las publica. Un lanzamiento posterior puede agregar códigos o dividir un código en hijos más específicos, pero nunca cambia lo que significa un código, de modo que una clave escrita hoy sigue siendo válida.

Las listas de códigos se publican como registros: las clases, las formas y los códigos de capa de esta clave en [`equipment-key.registry.json`](https://spec.vitness.me/registries/equipment-key.registry.json), y los [puntos corporales](https://spec.vitness.me/registries/body-points.registry.json) y las [posiciones corporales](https://spec.vitness.me/registries/body-positions.registry.json) que comparte con la clave de ejercicio.

## Anatomía de la clave {#anatomy-of-the-key}

Una prensa de piernas de discos, con el carro sobre una guía a 45°, tiene esta clave:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXE</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">N</span></code>
      <span className="key-anatomy__label">encabezado</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">k</span><span className="ka-sym">:</span><span className="ka-code">mac</span></code>
      <span className="key-anatomy__label">clase</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-code">feet</span></code>
      <span className="key-anatomy__label">interfaz de carga</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">s</span><span className="ka-sym">:</span><span className="ka-code">supine</span><span className="ka-sym">.</span><span className="ka-code">incline</span></code>
      <span className="key-anatomy__label">postura</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-code">push</span><span className="ka-sym">.</span><span className="ka-code">fwd</span></code>
      <span className="key-anatomy__label">movimiento</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">r</span><span className="ka-sym">:</span><span className="ka-code">plate</span></code>
      <span className="key-anatomy__label">fuente de resistencia</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">c</span><span className="ka-sym">:</span><span className="ka-code">line</span></code>
      <span className="key-anatomy__label">restricción</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">g</span><span className="ka-sym">:</span><span className="ka-code">incl</span></code>
      <span className="key-anatomy__label">ángulo de guía</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-letter">Letra de capa</span> · <span className="ka-code">código</span> · <span className="ka-sym">símbolo</span> · <span className="ka-flag">indicador</span>
  </figcaption>
</figure>

`FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl`

| Parte | Texto | Qué dice |
|---|---|---|
| Tipo de clave | `FXE` | Esta es una clave de equipamiento. |
| Versión | `1.0` | Versión mayor 1, revisión 0. |
| Indicador | `N` | La clave lleva al menos una capa extendida. |
| Clase | `k:mac` | Una máquina de fuerza, construida para un solo movimiento. |
| Interfaz de carga | `l:feet` | La parte móvil se encuentra con el cuerpo en los pies, sobre una plataforma. |
| Postura | `s:supine.incline` | El usuario se tumba boca arriba sobre una almohadilla de espalda inclinada, con la cabeza más alta que la cadera. |
| Movimiento | `m:push.fwd` | La plataforma se empuja alejándola de la parte delantera del tronco. |
| Fuente de resistencia | `r:plate` | La resistencia son discos cargados. |
| Restricción | `c:line` | La parte móvil corre sobre una guía recta. |
| Ángulo de guía | `g:incl` | La guía está inclinada. |

Las cuatro primeras capas son la parte estándar de la clave, `FXE=1.0S/k:mac/l:feet/s:supine.incline/m:push.fwd`. Dice lo que dice cualquier prensa de piernas a 45°; una prensa de piernas sentada, con el asiento erguido, es `s:seated`. Las tres últimas son capas extendidas: detalles de construcción de esta máquina de los que no depende un ejercicio hecho en ella. El campo `fxe` contiene la clave completa (véase [Claves en los registros](#keys-in-records)).

Las capas se separan con `/`. Cada capa es su letra, un `:` y un valor hecho de códigos y símbolos.

## Dimensiones y capas {#dimensions-and-layers}

La clase decide qué capas tiene una clave. Cada capa registra una dimensión del equipamiento.

| Letra | Capa | Dimensión que registra | Clases | Estándar o extendida |
|---|---|---|---|---|
| `k` | Clase | Qué tipo de equipamiento es | Todas | Estándar, siempre la primera |
| `f` | Forma | Qué objeto, superficie, accesorio o estación es | `imp` `sup` `acc` `stn` | Estándar |
| `c` | Guía | La trayectoria que siguen las partes móviles de una máquina de cardio | `erg` | Estándar |
| `l` | Interfaz de carga | Dónde se encuentra la parte móvil con el cuerpo | `mac` `erg` | Estándar |
| `s` | Postura | La posición en la que la máquina pone el cuerpo | `mac` `erg` | Estándar |
| `m` | Movimiento | El movimiento que guía una máquina, o el ciclo que repite una máquina de cardio | `mac` `erg` | Estándar |
| `r` | Fuente de resistencia | Qué genera la resistencia | `imp` `stn` `mac` `erg` | Extendida |
| `c` | Restricción o cesión | Cómo se guía la parte móvil de una máquina, o cómo cede un objeto o una superficie bajo el cuerpo | `imp` `sup` `stn` `mac` | Extendida |
| `g` | Ángulo de guía | El ángulo de la guía de una máquina | `mac` | Extendida |
| `a` | Diseño | Características de diseño de una máquina o una estación | `stn` `mac` | Extendida |

La letra `c` tiene dos significados. En una máquina de cardio es la guía, una capa estándar. En todas las demás clases es la capa extendida de restricción o cesión. Una máquina de cardio no tiene `c` extendida.

Reglas para toda clave:

- La primera capa es siempre `k`. `k:none` y `k:?` no llevan ninguna otra capa.
- Las capas estándar de una clase se escriben en el orden de la tabla: `f` para `imp`, `sup`, `acc` y `stn`; `l s m` para `mac`; `c l s m` para `erg`. Cuando una no se conoce, se escribe `?` como valor: `s:?`.
- Una capa omitida se lee `?`, desconocida. Una clave de ejercicio, en cambio, lee una capa omitida como su valor predeterminado. Las reglas de abajo dicen qué escribir cuando la descripción no dice nada.
- Las capas extendidas siguen a las estándar, en el orden `r c g a`, y solo cuando se declaran. Una clave que lleva alguna tiene el indicador `N` (`FXE=1.0N/…`); toda otra clave tiene el indicador `S`.
- Un valor que la forma ya implica se elimina: una mancuerna funciona por gravedad, así que para ella nunca se escribe `r:grav`. Las tablas de formas listan lo que implica cada forma.
- Los elementos unidos por `+` se escriben ordenados, de modo que un equipamiento siempre tiene una sola forma escrita.

Qué va en la clave:

- **La geometría fija es equipamiento. Todo lo que se ajusta en cada uso pertenece al ejercicio.** La altura de la polea, el ángulo del banco, dónde se ancla una banda, el agarre, una extremidad o dos y la altura del asiento están todos en la [clave de ejercicio](./exercise-key.md#dimensions-and-layers), y también el asa enganchada, a través del agarre que da.
- **Se escribe el equipamiento, no el ejercicio hecho en él.** Una elevación de talones hecha en una prensa de piernas usa una prensa de piernas, y la clave es la de la prensa.
- **Una máquina nombrada manda.** Cuando un ejercicio nombra la máquina en la que se hace, esa máquina es el equipamiento, haga lo que haga el ejercicio en ella.
- **"Máquina" a secas significa la máquina construida para el movimiento.** Una descripción que dice solo "máquina" se refiere a la máquina construida para el movimiento principal del ejercicio: un curl femoral en máquina se hace en una máquina de curl femoral. Sin un ejercicio de referencia, "máquina" es `FXE=1.0S/k:mac/l:?/s:?/m:?`.

Las capas siguientes se listan en el orden de la clave. Para cada una: sus códigos y luego sus reglas.

### Clase (`k`) {#kind-k}

| Código | Significado | Capas estándar | Capas extendidas |
|---|---|---|---|
| `none` | Sin equipamiento: el cuerpo es toda la carga | — | — |
| `imp` | Implemento: un objeto libre que se mueve, se sujeta o se lleva puesto | `f` | `r` `c` |
| `sup` | Apoyo: una superficie o estructura sobre la que el cuerpo descansa, de la que cuelga o contra la que empuja. No lleva la carga | `f` | `c` |
| `acc` | Accesorio: un asa, correa, cinturón, colchoneta, toalla o marcador. Nunca define el ejercicio | `f` | — |
| `stn` | Estación: una guía o un anclaje que se usa para muchos movimientos: torre de poleas, máquina Smith, landmine | `f` | `r` `c` `a` |
| `mac` | Máquina de fuerza: un mecanismo guiado con contactos fijos con el cuerpo, construido para un solo movimiento | `l` `s` `m` | `r` `c` `g` `a` |
| `erg` | Máquina de cardio: repite ciclos completos | `c` `l` `s` `m` | `r` |

Reglas:

- Una forma de cargar no es equipamiento. "Lastrado" sin forma nombrada es `FXE=1.0S/k:imp/f:?`. "Asistido" sin implemento, u "otro", es `FXE=1.0S/k:?`.
- Una torre de poleas es una estación. Un remo en polea sentado con asiento propio, y una máquina de jalón al pecho, son máquinas de fuerza.

### Forma (`f`) {#form-f}

La forma es un código de la lista de la clase de la clave. Una clave de ejercicio nombra un implemento, un apoyo o una estación con el mismo código, y un accesorio con el mismo código en su capa de accesorio (véase [Claves de equipamiento en las claves de ejercicio](#equipment-keys-in-exercise-keys)).

**Implementos (`imp`)**

| Código | Significado | Implica |
|---|---|---|
| `bar.straight` | Barra, olímpica o estándar | `r:grav` |
| `bar.ez` | Barra EZ | `r:grav` |
| `bar.trap` | Barra hexagonal o trap | `r:grav` |
| `bar.axle` | Barra gruesa (axle) | `r:grav` |
| `bar.camber` | Barra curvada (cambered) | `r:grav` |
| `bell.dumb` | Mancuerna | `r:grav` |
| `bell.kettle` | Pesa rusa | `r:grav` |
| `bell.circus` | Mancuerna de circo | `r:grav` |
| `ball.med` | Balón medicinal | `r:grav` |
| `ball.slam` | Balón de lanzamiento (slam ball) | `r:grav` |
| `bag.sand` | Saco de arena | `r:grav` |
| `bag.heavy` | Saco de boxeo colgante | `r:grav` `c:swing` |
| `plate` | Un disco de peso sujeto o llevado por sí solo | `r:grav` |
| `chain` | Cadena de levantamiento | `r:grav` |
| `rope.battle` | Cuerda de batalla | `r:grav` |
| `rope.jump` | Cuerda para saltar | `r:none` |
| `band` | Banda o tubo elástico, tipo no declarado | `r:elastic` |
| `band.loop` | Banda de bucle larga. Hijo de `band` | `r:elastic` |
| `band.mini` | Banda de bucle corta que se lleva alrededor de las piernas. Hijo de `band` | `r:elastic` |
| `band.tube` | Banda tubular con asas. Hijo de `band` | `r:elastic` |
| `sled` | Trineo o prowler, empujado o arrastrado | `r:friction` |
| `tire` | Neumático grande | `r:grav` |
| `hammer` | Mazo | `r:grav` |
| `stone` | Piedra Atlas | `r:grav` |
| `log` | Tronco de strongman | `r:grav` |
| `keg` | Barril | `r:grav` |
| `yoke` | Yugo de strongman | `r:grav` |
| `frame.carry` | Asas de granjero o un marco de acarreo | `r:grav` |
| `car` | Un coche, levantado o empujado | `r:grav` |
| `wear.vest` | Chaleco lastrado | `r:grav` |
| `wear.ankle` | Tobillera lastrada | `r:grav` |
| `club` | Maza o clava | `r:grav` |
| `stick` | Varilla, palo de escoba o tubo de PVC | `r:none` |
| `wheel` | Rueda abdominal | `r:none` `c:roll` |
| `roller.wrist` | Rodillo de muñeca | `r:grav` |
| `harness.head` | Arnés de cabeza con una carga colgante | `r:grav` |

**Apoyos (`sup`)**

| Código | Significado | Implica |
|---|---|---|
| `floor` | El suelo, o una colchoneta sobre él | — |
| `wall` | Una pared | — |
| `bench` | Un banco, plano o ajustable | — |
| `box` | Un cajón, step o plataforma | — |
| `chair` | Una silla | — |
| `block` | Bloques de levantamiento desde los que arranca una barra | — |
| `rack` | Jaula de potencia o soporte de sentadilla, con sus pasadores | — |
| `ball.stab` | Balón de estabilidad | `c:tilt` |
| `dome` | BOSU, lado hacia arriba no declarado | `c:tilt` |
| `dome.up` | BOSU, con la cúpula hacia arriba. Hijo de `dome` | `c:tilt` |
| `dome.down` | BOSU, con la cara plana hacia arriba: la cúpula en el suelo. Hijo de `dome` | `c:tilt` |
| `board.bal` | Tabla de equilibrio o balancín | `c:tilt` |
| `roller.foam` | Rodillo de espuma | `c:roll` |
| `slider` | Disco deslizante | `c:slide` |
| `strap.susp` | Entrenador de suspensión | `c:swing` |
| `ring` | Anillas de gimnasia | `c:swing` |
| `rope.climb` | Cuerda de trepa | `c:swing` |
| `bar.fixed` | Barra fija por encima de la cabeza: barra de dominadas | — |
| `bar.parallel` | Barras paralelas de fondos | — |
| `bar.parallette` | Paralelas de suelo | — |
| `pad.preacher` | Banco Scott | — |
| `pad.hyper` | Banco de extensión de espalda, de 45° o 90°, también usado para inclinaciones laterales | — |
| `pad.ghd` | Glute-ham developer (GHD) | — |
| `station.vkr` | Estación de elevación de rodillas | — |
| `pole` | Un poste vertical, pilar o montante de rack agarrado con las manos | — |
| `ball.massage` | Pelota de masaje o de lacrosse que se rueda bajo el cuerpo | — |

**Accesorios (`acc`)**

| Código | Significado |
|---|---|
| `handle` | Asa en D individual |
| `handle.bar` | Barra de polea recta o curvada |
| `handle.v` | Barra en V o asa de agarre cerrado |
| `handle.rope` | Cuerda de tríceps |
| `strap.ankle` | Tobillera de polea |
| `belt.dip` | Cinturón de lastre |
| `belt.lift` | Cinturón de levantamiento |
| `strap.lift` | Correas de levantamiento |
| `strap.stretch` | Correa de estiramiento: una correa, cinturón, toalla, cuerda o banda de bucle usada para tirar de una extremidad o mantenerla en un estiramiento |
| `towel` | Una toalla usada como asa |
| `marker` | Cono, valla o marcador de suelo |
| `board.press` | Tabla colocada sobre el pecho para presses parciales |
| `mat` | Colchoneta |

**Estaciones (`stn`)**

| Código | Significado | Implica |
|---|---|---|
| `cable` | Torre de poleas, cruce de poleas o entrenador funcional: una polea que se ajusta en cada ejercicio | `r:stack` `c:cable` |
| `smith` | Máquina Smith: una barra sobre guías fijas | `r:plate` `c:line` |
| `landmine` | Landmine: un extremo de una barra en un pivote de suelo | `r:grav` `c:pivot` |

Reglas:

- Una palabra general lleva el código general: "banda" es `band`. Un hijo se escribe solo cuando el equipamiento lo nombra: una banda de bucle larga es `band.loop`.
- Una correa de estiramiento es `FXE=1.0S/k:acc/f:strap.stretch`. Una clave de ejercicio para un estiramiento hecho con ella lleva [`a:strap.stretch`](./exercise-key.md#accessory-a).
- Un BOSU cuyo lado no se declara es `dome`. Se escribe `dome.up` o `dome.down` cuando se nombra el lado.

### Guía (`c`) {#track-c}

La guía se escribe solo para una máquina de cardio.

| Código | Significado |
|---|---|
| `belt` | Una banda móvil o escaleras giratorias |
| `link` | Pedales enlazados (stepper) |
| `loop` | Un bucle cerrado: bielas, elíptica |
| `rail` | Un asiento sobre un riel (remo) |
| `cable` | Un cable del que se tira desde arriba (máquina de esquí) |
| `line` | Una guía recta (escalador vertical) |

Cada tipo de máquina de cardio escribe sus cuatro capas estándar así:

| Máquina | `c` | `l` | `s` | `m` |
|---|---|---|---|---|
| Caminadora | `belt` | `feet` | `standing` | `gait` |
| Stepmill (escaleras giratorias) | `belt` | `feet` | `standing` | `step` |
| Escaladora de pedales (stepper) | `link` | `feet` | `standing` | `step` |
| Máquina de escaleras, stepper o stepmill no conocido | `?` | `feet` | `standing` | `step` |
| Bicicleta vertical o de spinning | `loop` | `feet` | `seated` | `cycle` |
| Bicicleta reclinada | `loop` | `feet` | `supine.incline` | `cycle` |
| Bicicleta estática, vertical o reclinada no conocida | `loop` | `feet` | `?` | `cycle` |
| Bicicleta de aire, con brazos móviles | `loop` | `feet+hands` | `seated` | `cycle` |
| Elíptica | `loop` | `feet+hands` | `standing` | `glide` |
| Máquina de remo | `rail` | `hands` | `seated` | `row` |
| Máquina de esquí | `cable` | `hands` | `standing` | `ski` |
| Ergómetro de brazos, sentado | `loop` | `hands` | `seated` | `cycle` |
| Escalador vertical | `line` | `feet+hands` | `standing` | `climb` |
| Escalador de escalera | `belt` | `feet+hands` | `standing` | `climb` |

Reglas:

- Una máquina de cardio de tipo desconocido es `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?`.

### Interfaz de carga (`l`) {#load-interface-l}

La interfaz de carga se escribe para una máquina de fuerza y para una máquina de cardio. Es el punto corporal donde la parte móvil de la máquina se encuentra con el cuerpo, escrito con los [puntos corporales](./exercise-key.md#body-points) de la clave de ejercicio: `hands` para asas o una barra, `feet` para una plataforma o pedales, `ankles` para un rodillo sobre la parte baja de la pierna. Una clave de ejercicio en la máquina sujeta `mac` o `erg` en uno de estos puntos (`@overhead` está en las manos). El punto de sujeción `@assist` no se comprueba.

Reglas:

- Dos interfaces se unen con `+` solo cuando ambas mueven la carga: una elíptica es `l:feet+hands`.
- Cuando nada dice lo contrario, el movimiento de una máquina fija su interfaz:

  | Movimiento | Interfaz |
  |---|---|
  | `kn.flex`, `kn.ext`, `hip.flex` | `ankles` |
  | `el.*`, `sc.elev`, `sh.habd`, y todo `push.*` o `pull.*` trabajado con las manos | `hands` |
  | `sh.hadd`, `sh.abd`, `sh.flex`, `sh.ext` | `arms` |
  | `hip.add`, `hip.abd` | `thighs` |
  | `sp.flex`, `sp.rot` | `chest` |
  | `sp.ext` | `back` |
  | `assist.up` | `knees`, o `feet` cuando el usuario está de pie sobre una plataforma |

- Algunas máquinas fijan la suya: una prensa de piernas es `feet`; una sentadilla hack, una sentadilla péndulo o una V-squat, `shoulders`; una sentadilla con cinturón, `hips`; una máquina de elevación de talones, `thighs` sentado, `shoulders` de pie y `hips` en la elevación tipo burro, con el tronco sobre una almohadilla; una patada de glúteo, `feet`; una máquina de hip thrust, `hips`; una reverse hyper, `ankles`; una elevación de tibial, `feet`.

### Postura (`s`) {#posture-s}

La postura se escribe para una máquina de fuerza y para una máquina de cardio. Es la posición en la que la máquina pone el cuerpo, escrita con los [códigos de orientación](./exercise-key.md#orientation-o) de la clave de ejercicio: `seated`, `seated.chest`, `standing`, `supine.incline`, `prone`, `hanging` y los demás. Una clave de ejercicio en la máquina empieza en esa misma orientación.

Reglas:

- Se escribe la posición en la que la máquina pone al usuario.
- Algunas máquinas la fijan. Toda prensa de piernas con almohadilla de espalda inclinada es `supine.incline`, y una con asiento erguido es `seated`. Una sentadilla hack, una sentadilla péndulo, una V-squat y una sentadilla con cinturón son `standing`. Una máquina de remo dedicada es `seated.chest`, salvo un remo en polea sentado con plataforma para los pies, que es `seated`. Una máquina de aperturas invertidas es `seated.chest`. Un remo en T con apoyo de pecho es `prone.incline`. Una máquina asistida de dominadas o de fondos es `hanging`. Una máquina de hip thrust es `supine` y una reverse hyper, `prone`. Una máquina de elevación de talones tipo burro es `standing.chest`. Una máquina de patada de glúteo es `standing`, o `kneeling` cuando la descripción dice que el usuario se arrodilla. Una máquina de elevación de tibial es `seated`.
- Cuando nada dice lo contrario: `seated.chest` para `sh.habd`; `seated` para `kn.ext`, `el.*`, los demás movimientos `sh.*`, `sp.flex`, `sp.rot`, `hip.add`, `hip.abd`, `hip.flex`, todo `push.*` trabajado con las manos, `pull.down` y `pull.backdown`; `standing` para `sc.elev`, `hip.ext` y `pull.up`. En los demás casos se escribe `s:?`: una máquina de curl femoral o de elevación de talones sin postura declarada es `s:?`.

### Movimiento (`m`) {#motion-m}

En una máquina de fuerza, el movimiento es lo que guía la parte móvil de la máquina, respecto al tronco.

Una máquina cuyo pivote está alineado con una articulación escribe esa acción articular, con los códigos de la [capa de movimiento](./exercise-key.md#motion-m) de la clave de ejercicio: `kn.flex`, `kn.ext`, `el.flex`, `el.ext`, `sh.flex`, `sh.ext`, `sh.abd`, `sh.add`, `sh.hadd`, `sh.habd`, `sh.ir`, `sh.er`, `sc.elev`, `hip.flex`, `hip.ext`, `hip.abd`, `hip.add`, `sp.flex`, `sp.ext`, `sp.rot`, `sp.lflex`, `ank.pf`, `ank.df`, `nk.flex`, `nk.ext`, `nk.lflex`, `wr.flex` o `wr.ext`.

Una máquina que mueve varias articulaciones escribe un verbo, `.` y la dirección en que se mueve la interfaz de carga.

| Verbo | Significado |
|---|---|
| `push` | La parte móvil se empuja alejándola |
| `pull` | La parte móvil se tira hacia el usuario |
| `assist` | La parte móvil ayuda a levantar el cuerpo |

| Dirección | Significado |
|---|---|
| `up` | Hacia la cabeza: press de hombros, sentadilla hack, sentadilla con cinturón, máquina de peso muerto |
| `down` | Hacia los pies: jalón, fondo sentado |
| `fwd` | Alejándose de la parte delantera del tronco: press de pecho, prensa de piernas |
| `back` | Hacia la parte delantera del tronco: remo |
| `fwdup` | Hacia delante y arriba: press inclinado |
| `fwddown` | Hacia delante y abajo: press declinado |
| `backdown` | Hacia atrás y abajo: remo alto |

En una máquina de cardio, el movimiento es el ciclo que repite. Una clave de ejercicio puede nombrar una máquina de cardio por él: `erg.row` es una máquina de cardio cuyo `m` es `row` (véase [Claves de equipamiento en las claves de ejercicio](#equipment-keys-in-exercise-keys)). El movimiento de una máquina de fuerza no da ningún código en una clave de ejercicio: el propio movimiento del ejercicio ya dice lo que la máquina guía.

| Código | Significado |
|---|---|
| `gait` | Caminar o correr sobre una banda |
| `cycle` | Pedalear o girar una manivela con las manos |
| `step` | Subir escalones |
| `row` | Remar |
| `ski` | Un tirón con dos bastones (máquina de esquí) |
| `glide` | Deslizamiento elíptico |
| `climb` | Trepar con manos y pies |

Reglas:

- Máquinas monoarticulares: un curl femoral es `kn.flex`, una extensión de piernas `kn.ext`, una máquina de curl de bíceps o de curl Scott `el.flex`, una máquina de extensión de tríceps `el.ext`, un pec deck `sh.hadd`, una máquina de aperturas invertidas `sh.habd`, una máquina de elevación lateral `sh.abd`, una máquina de pullover `sh.ext`, una máquina de encogimientos `sc.elev`, una de aductores `hip.add`, una de abductores `hip.abd`, una máquina de crunch de piernas o de elevación de rodillas `hip.flex`, una patada de glúteo, un hip thrust o una reverse hyper `hip.ext`, una máquina de crunch abdominal `sp.flex`, una máquina de extensión de espalda `sp.ext`, una máquina de rotación de torso `sp.rot`, una máquina de elevación de talones `ank.pf`, una elevación de tibial `ank.df`, una máquina de cuello `nk.flex`, `nk.ext` o `nk.lflex` según la dirección en que se mueve la cabeza, y una máquina de curl de muñeca `wr.flex`.
- Máquinas multiarticulares: un press de hombros, una sentadilla hack o una sentadilla con cinturón es `push.up`; una máquina de peso muerto `pull.up`; un jalón `pull.down`; un fondo sentado `push.down`; un press de pecho y una prensa de piernas `push.fwd`; un remo `pull.back`; un press inclinado `push.fwdup`; un press declinado `push.fwddown`; un remo alto `pull.backdown`; una dominada o un fondo asistidos `assist.up`.
- Una prensa de piernas y una sentadilla hack mueven las mismas articulaciones. La interfaz, la postura y la dirección las distinguen.
- Una máquina de fuerza de tipo desconocido es `FXE=1.0S/k:mac/l:?/s:?/m:?`.

### Capas extendidas (`r`, `c`, `g`, `a`) {#extended-layers-r-c-g-a}

Las capas extendidas registran cómo está construido un equipamiento. Forman parte de su clave: `fxe` contiene la clave completa, con las capas extendidas y el indicador `N` incluidos (véase [Claves en los registros](#keys-in-records)).

Fuente de resistencia (`r`):

| Código | Significado |
|---|---|
| `grav` | Peso libre bajo la gravedad |
| `stack` | Torre de placas con selector |
| `plate` | Carga con discos |
| `elastic` | Elástica |
| `air` | Ventilador de aire |
| `mag` | Freno magnético |
| `water` | Depósito de agua |
| `motor` | Motor |
| `friction` | Fricción |
| `hydraulic` | Hidráulica |
| `flywheel` | Volante de inercia |
| `none` | Sin resistencia propia |

Restricción (`c`, para `stn` y `mac`):

| Código | Significado |
|---|---|
| `line` | Una guía recta: un carro o rieles |
| `arc` | Una palanca sobre un pivote |
| `link` | Un mecanismo de varios pivotes |
| `cable` | Un cable sobre poleas |
| `pivot` | Un extremo en un pivote de suelo |

Cesión (`c`, para `imp` y `sup`):

| Código | Significado |
|---|---|
| `tilt` | Se inclina bajo el cuerpo |
| `roll` | Rueda |
| `slide` | Se desliza |
| `swing` | Cuelga y se balancea |

Ángulo de guía (`g`, para `mac`):

| Código | Significado |
|---|---|
| `incl` | Inclinada |
| `horiz` | Horizontal |
| `vert` | Vertical |

Diseño (`a`, para `stn` y `mac`):

| Código | Significado |
|---|---|
| `iso` | Brazos independientes |
| `conv` | Trayectoria convergente |
| `cb` | Contrapesada |
| `dual` | Dos torres de placas |

Reglas:

- Una capa extendida se escribe solo cuando se declara. Nada de lo que registra un ejercicio depende de ella.
- Una máquina de palanca es `c:arc` con `r:plate`. Una máquina de carro es `c:line` con `r:plate`. Una sentadilla péndulo es `c:arc`.
- Los códigos de diseño se unen con `+`: `a:conv+iso`.

## Símbolos {#symbols}

Todo lo que en una clave no es un código es un símbolo.

| Símbolo | Significado | Ejemplo |
|---|---|---|
| `/` | Separa capas | `k:imp/f:bell.dumb` |
| `:` | Separa la letra de una capa de su valor | `k:imp` |
| `.` | Une un código a un hijo más específico, o el verbo de una máquina a su dirección | `band.loop`, `push.fwd` |
| `+` | Une elementos que van juntos: dos interfaces de carga, códigos de diseño | `l:feet+hands` |
| `;` | Une las configuraciones de una máquina combinada | `…/m:sh.hadd;k:mac/…` |
| `?` | Desconocido. Coincide con cualquier cosa y nunca contradice | `k:?`, `f:?`, `s:?` |

Una máquina combinada, una estructura con varias configuraciones, une la clave de cada configuración con `;` tras un único encabezado, en orden. Una máquina multicadera, una máquina de cuello de 4 direcciones, un pec deck con brazos de deltoides posterior, una máquina asistida de dominadas y fondos, y un jalón con remo bajo son máquinas combinadas. Una combinada puede unir configuraciones de máquina y de estación. Un ejercicio hecho en ella se refiere a la configuración que usa.

## Claves de equipamiento en las claves de ejercicio {#equipment-keys-in-exercise-keys}

Una clave de equipamiento y una [clave de ejercicio](./exercise-key.md#equipment-in-an-exercise-key) comparten tres listas de códigos, de modo que una clave de ejercicio lleva directamente a la clave de su equipamiento, y la clave de una máquina dice cómo se sitúa el cuerpo en ella con las palabras que usa una clave de ejercicio.

| Lista | En una clave de equipamiento | En una clave de ejercicio | Se lista en |
|---|---|---|---|
| Códigos de equipamiento | Clase (`k`) y forma (`f`) | El equipamiento en la carga (`l`) y el apoyo (`s`), y el accesorio (`a`) | Las [tablas de formas](#form-f) |
| Puntos corporales | La interfaz de carga de una máquina (`l`) | Después de `@` en la carga y el apoyo | Los [puntos corporales](./exercise-key.md#body-points) de la clave de ejercicio |
| Posiciones corporales | La postura de una máquina (`s`) | Orientación (`o`) | La [orientación](./exercise-key.md#orientation-o) de la clave de ejercicio |

La máquina de remo de abajo muestra las tres: su clave escribe `l:hands` y `s:seated`, y remar en ella se sujeta `@hands` y empieza `seated`.

<figure className="key-anatomy">
  <div className="key-pair">
    <div>
      <div className="key-pair__title">Curl de pie con mancuerna</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXI</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">encabezado</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-code">el</span><span className="ka-sym">.</span><span className="ka-code">flex</span></code>
          <span className="key-anatomy__label">movimiento</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">o</span><span className="ka-sym">:</span><span className="ka-code">standing</span></code>
          <span className="key-anatomy__label">orientación</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">bell</span><span className="ka-sym">.</span><span className="ka-code">dumb</span></span><span className="ka-sym">@</span><span className="ka-code">hands</span></code>
          <span className="key-anatomy__label">carga</span>
        </span>
      </div>
    </div>
    <div>
      <div className="key-pair__title">Mancuerna</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXE</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">encabezado</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">k</span><span className="ka-sym">:</span><span className="ka-code">imp</span></code>
          <span className="key-anatomy__label">clase</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">f</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">bell</span><span className="ka-sym">.</span><span className="ka-code">dumb</span></span></code>
          <span className="key-anatomy__label">forma</span>
        </span>
      </div>
    </div>
  </div>
  <div className="key-pair">
    <div>
      <div className="key-pair__title">Remo</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXI</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">encabezado</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">m</span><span className="ka-sym">:~</span><span className="ka-code">el</span><span className="ka-sym">.</span><span className="ka-code">flex</span><span className="ka-sym">+</span><span className="ka-code">hip</span><span className="ka-sym">.</span><span className="ka-code">ext</span><span className="ka-sym">+</span><span className="ka-code">kn</span><span className="ka-sym">.</span><span className="ka-code">ext</span><span className="ka-sym">+</span><span className="ka-code">sh</span><span className="ka-sym">.</span><span className="ka-code">ext</span></code>
          <span className="key-anatomy__label">movimiento</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">o</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">seated</span></span></code>
          <span className="key-anatomy__label">orientación</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">erg</span></span><span className="ka-sym">.</span><span className="ka-shared"><span className="ka-code">row</span></span><span className="ka-sym">@</span><span className="ka-shared"><span className="ka-code">hands</span></span></code>
          <span className="key-anatomy__label">carga</span>
        </span>
      </div>
    </div>
    <div>
      <div className="key-pair__title">Máquina de remo</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXE</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">encabezado</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">k</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">erg</span></span></code>
          <span className="key-anatomy__label">clase</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">c</span><span className="ka-sym">:</span><span className="ka-code">rail</span></code>
          <span className="key-anatomy__label">guía</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">hands</span></span></code>
          <span className="key-anatomy__label">interfaz de carga</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">s</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">seated</span></span></code>
          <span className="key-anatomy__label">postura</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">row</span></span></code>
          <span className="key-anatomy__label">movimiento</span>
        </span>
      </div>
    </div>
  </div>
  <figcaption>
    Cada clave de ejercicio a la izquierda, la clave de su equipamiento a la derecha. <span className="ka-shared">Recuadrados</span>: los códigos que ambas comparten.
  </figcaption>
</figure>

| Clase | El código del ejercicio es | Una clave de ejercicio y la clave de su equipamiento |
|---|---|---|
| Sin equipamiento (`none`) | La clase: `none` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none`<br />`FXE=1.0S/k:none` |
| Implemento (`imp`) | La forma `f`: `bar.straight` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back`<br />`FXE=1.0S/k:imp/f:bar.straight` |
| Apoyo (`sup`) | La forma `f`: `bench` | `FXI=1.0S/m:el.ext+sh.ext/o:seated/s:bench@hands/l:none`<br />`FXE=1.0S/k:sup/f:bench` |
| Estación (`stn`) | La forma `f`: `cable` | `FXI=1.0S/m:el.ext/o:standing/l:cable@hands`<br />`FXE=1.0S/k:stn/f:cable` |
| Accesorio (`acc`) | La forma `f`, solo en la capa de accesorio `a`: `strap.stretch`. Un accesorio nunca es el equipamiento principal | `a:strap.stretch` ↔ `FXE=1.0S/k:acc/f:strap.stretch` |
| Máquina de fuerza (`mac`) | La clase `k`: `mac` | `FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands`<br />`FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down` |
| Máquina de cardio (`erg`) | La clase `k`: `erg`; o la clase, `.` y el movimiento `m`: `erg.row` | `FXI=1.0S/m:~el.flex+hip.ext+kn.ext+sh.ext/o:seated/l:erg.row@hands`<br />`FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row` |

Un código de forma representa una clave de equipamiento: `bar.straight` es `FXE=1.0S/k:imp/f:bar.straight`. Los códigos de forma se listan en las [tablas de formas](#form-f). Un código de clase representa todas las claves de esa clase, con las demás capas abiertas: `mac` es `FXE=1.0S/k:mac/l:?/s:?/m:?`. `erg.row` es `FXE=1.0S/k:erg/c:?/l:?/s:?/m:row`: cualquier máquina de cardio cuyo movimiento es `row`. Los movimientos de cardio se listan en [Movimiento](#motion-m).

Todo código de forma puede escribirse en una clave de ejercicio, hijos incluidos: `band.loop` es una banda de bucle larga, y `band` la abarca. El `fxe` del registro nombra el equipamiento exacto, y es la clave del código o más específico que ella. La máquina de remo de arriba es más específica que `erg.row`.

Un accesorio nunca es el [equipamiento principal](#checking-an-exercise-against-its-equipment) del ejercicio. El código de accesorio en la capa `a` de la clave de ejercicio es el código de accesorio de la clave de equipamiento: `a:strap.stretch` es `FXE=1.0S/k:acc/f:strap.stretch`. Un estiramiento con correa, `FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:none/x:u/a:strap.stretch`, tiene `l:none`, así que su equipamiento principal es `FXE=1.0S/k:none`.

Un código de apoyo se escribe solo en `s`, y un código de accesorio solo en `a`. Todo otro código excepto `none` puede escribirse en `l` o en `s`. La clave de ejercicio añade dónde se sujeta o se toca el equipamiento (`@`) y, en `l`, cuántos hay (`*n`): véase la [carga](./exercise-key.md#load-l) de la clave de ejercicio.

En una máquina, las dos claves coinciden: la postura de la máquina es la orientación de inicio del ejercicio, y su interfaz de carga incluye el punto donde el ejercicio sujeta `mac` o `erg` (`@overhead` está en las manos). El punto de sujeción `@assist` no se comprueba.

Las claves difieren en tres aspectos, a propósito:

- **Una máquina de fuerza no tiene un código específico.** Una máquina de cardio puede ser `erg.row`, porque el ciclo es el movimiento. Una máquina de fuerza es solo `mac`, porque el propio movimiento del ejercicio lleva lo que la máquina guía.
- **Una capa omitida se lee de otra manera.** En una clave de ejercicio está en su valor predeterminado, que es un valor, salvo en la capa de accesorio, que, omitida, queda sin declarar. En una clave de equipamiento es desconocida, `?`.
- **Las letras de capa de cada clave son propias.** Solo `m` es movimiento en ambas. En una clave de ejercicio `l` es la carga y `s` el apoyo; en una clave de equipamiento `l` es la interfaz de carga y `s` la postura.

Las dos claves nunca registran el mismo hecho dos veces. El agarre, los lados, el recorrido, el juego de pies, la altura de la polea, el ángulo del banco, el punto de sujeción y la cantidad pertenecen a la clave de ejercicio. Qué es el equipamiento, su geometría fija y cómo está construido pertenecen a la clave de equipamiento.

### Comprobar un ejercicio contra su equipamiento {#checking-an-exercise-against-its-equipment}

Una clave de ejercicio y la clave de su equipamiento principal pueden comprobarse entre sí. El equipamiento principal es el primero de estos que tenga la clave de ejercicio:

1. una máquina de fuerza o de cardio en `l`: `mac`, `erg` o un hijo de `erg`;
2. una estación en `l`: `cable`, `smith` o `landmine`;
3. un implemento en `l`. Si hay varios, el que aparece primero en la [tabla de implementos](#form-f): `l:band@hands+bell.dumb@hands` da `bell.dumb`;
4. un implemento de tipo desconocido, como `?@chest`, que da `FXE=1.0S/k:imp/f:?`;
5. un apoyo en `s` distinto del suelo, el que aparece primero en la tabla de apoyos;
6. `FXE=1.0S/k:none` para `l:none`;
7. cuando no se aplica nada más, `FXE=1.0S/k:?`.

Un comprobador avisa cuando:

- la clave de equipamiento contradice la clave del código de equipamiento principal del ejercicio: un ejercicio cargado con `bell.dumb` y una clave de equipamiento de una pesa rusa;
- la [postura](#posture-s) de una máquina no es la orientación de inicio del ejercicio: `s:supine.incline` y `o:standing`;
- la [interfaz de carga](#load-interface-l) de una máquina no incluye el punto de sujeción de `mac` o `erg`: `l:feet` y `mac@hands`. El punto de sujeción `@assist` no se comprueba;
- el movimiento de una máquina monoarticular, o un hijo suyo, no está en el movimiento del ejercicio: un encogimiento hecho en una máquina de elevación de talones de pie, cuyo movimiento es `m:ank.pf`. El comprobador siempre avisa. Una persona acepta el uso cuando el ejercicio nombra esa máquina;
- aparece `k:none` sin `l:none`;
- un código de cardio no encaja con el movimiento de la máquina: `erg.row` con una clave de equipamiento cuyo movimiento es `m:gait`, una caminadora.

## Ejemplos resueltos {#worked-examples}

Cada ejemplo parte de una descripción sencilla y decide una capa cada vez.

### Mancuerna {#dumbbell}

Un peso libre sujeto con una mano.

| Capa | Decisión | Se escribe |
|---|---|---|
| `k` | Un objeto libre movido por el cuerpo | `k:imp` |
| `f` | Una mancuerna. Su resistencia por gravedad está implícita, así que `r` no se escribe | `f:bell.dumb` |

`FXE=1.0S/k:imp/f:bell.dumb`

Un [curl de pie con mancuerna](./exercise-key.md#standing-dumbbell-curl) la nombra `bell.dumb`: `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`.

### Banda de bucle larga {#long-loop-band}

Un bucle elástico largo, como el que se usa para dominadas asistidas y sentadillas con banda.

| Capa | Decisión | Se escribe |
|---|---|---|
| `k` | Un objeto libre | `k:imp` |
| `f` | El tipo está nombrado, así que el código hijo. Una banda cuyo tipo no se declara es `band` | `f:band.loop` |

`FXE=1.0S/k:imp/f:band.loop`

### Torre de poleas {#cable-column}

Una torre de placas con una polea que sube y baja por un poste, usada con un asa elegida en cada ejercicio.

| Capa | Decisión | Se escribe |
|---|---|---|
| `k` | Una estación que se usa para muchos movimientos | `k:stn` |
| `f` | Una torre de poleas. La altura de la polea y el asa se ajustan en cada uso, así que los registra la clave de ejercicio | `f:cable` |

`FXE=1.0S/k:stn/f:cable`

### Máquina de jalón al pecho {#lat-pulldown-machine}

Sentado, con los muslos bajo un rodillo, una barra que se tira hacia abajo desde arriba de la cabeza.

| Capa | Decisión | Se escribe |
|---|---|---|
| `k` | Una máquina construida para un solo movimiento, no la torre de poleas | `k:mac` |
| `l` | La barra está en las manos | `l:hands` |
| `s` | Sentado. El rodillo de muslos sujeta el cuerpo; no es la postura | `s:seated` |
| `m` | Se mueven varias articulaciones, y la barra viene hacia los pies | `m:pull.down` |

`FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down`

Un [jalón al pecho](./exercise-key.md#lat-pulldown) la nombra `mac`: `FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands`.

### Máquina de curl femoral tumbado {#lying-leg-curl-machine}

Boca abajo sobre un banco, un rodillo detrás de la parte baja de las piernas, carga con discos sobre una palanca.

| Capa | Decisión | Se escribe |
|---|---|---|
| `k` | Una máquina de fuerza | `k:mac` |
| `l` | El rodillo está sobre la parte baja de la pierna | `l:ankles` |
| `s` | Tumbado boca abajo | `s:prone` |
| `m` | El pivote está alineado con la rodilla, que se dobla | `m:kn.flex` |
| `r` `c` | Carga con discos, sobre una palanca: capas extendidas | `r:plate/c:arc` |

`FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc`

Esa es la clave que contiene `fxe`. Su parte estándar es `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex`.

Una máquina de curl femoral sentado es `FXE=1.0S/k:mac/l:ankles/s:seated/m:kn.flex`. Solo difiere la postura, y eso basta para que sea un equipamiento distinto.

### Máquina de remo {#rowing-machine}

Un asiento sobre un riel, un asa en una cadena que se tira hacia el tronco.

| Capa | Decisión | Se escribe |
|---|---|---|
| `k` | Una máquina de cardio | `k:erg` |
| `c` | El asiento se desliza sobre un riel | `c:rail` |
| `l` | La parte móvil que se encuentra con el cuerpo es el asa, en las manos. El apoyo de los pies se queda quieto | `l:hands` |
| `s` | Sentado | `s:seated` |
| `m` | Remar | `m:row` |

`FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row`

### Pec deck con brazos de deltoides posterior {#pec-deck-with-rear-delt-arms}

Una máquina con dos configuraciones: almohadillas de brazo que se juntan por delante, o asas que se tiran hacia atrás con el pecho contra la almohadilla.

| Configuración | Decisión | Se escribe |
|---|---|---|
| Pec deck | Almohadillas de brazo, sentado, los brazos se juntan por delante | `k:mac/l:arms/s:seated/m:sh.hadd` |
| Aperturas invertidas | Asas, el pecho sobre la almohadilla, los brazos se mueven hacia atrás y afuera | `k:mac/l:hands/s:seated.chest/m:sh.habd` |

`FXE=1.0S/k:mac/l:arms/s:seated/m:sh.hadd;k:mac/l:hands/s:seated.chest/m:sh.habd`

## Claves en los registros {#keys-in-records}

Un registro de equipamiento lleva su clave completa en `fxe`, con las capas extendidas y el indicador `N` incluidos. Una referencia al equipamiento, en un [ejercicio](./exercise-key.md#keys-in-records), una sesión de entrenamiento o una prescripción, lleva el mismo valor `fxe` junto a su `id` y su `name`.

Una capa extendida cuenta en una comparación solo cuando ambas claves la llevan (véase [Comparar dos claves de equipamiento](#comparing-two-equipment-keys)). En los demás casos, la comparación lee la parte estándar de cada clave: la clave sin las capas extendidas `r`, `c`, `g` y `a`, con el indicador `S`. En una máquina de cardio `c` es la guía, una capa estándar, así que se queda.

| Clave | Parte estándar |
|---|---|
| `FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl` | `FXE=1.0S/k:mac/l:feet/s:supine.incline/m:push.fwd` |
| `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc` | `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex` |
| `FXE=1.0N/k:erg/c:rail/l:hands/s:seated/m:row/r:air` | `FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row` |

Un registro de equipamiento:

```json fds:ignore equipment record excerpt showing the fxe field
{
  "schemaVersion": "1.2.0",
  "id": "eq.legPress45",
  "fxe": "FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl",
  "canonical": { "name": "45° Leg Press", "slug": "45-leg-press" },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "status": "active"
  }
}
```

Un ejercicio hecho en él. La referencia de equipamiento lleva el mismo `fxe`, y la propia clave del ejercicio nombra la máquina con [`mac`](#equipment-keys-in-exercise-keys), sujeta con los pies:

```json fds:ignore exercise record excerpt showing the fxi and fxe fields
{
  "exerciseId": "ex.legPress",
  "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:supine.incline/l:mac@feet",
  "canonical": { "name": "Leg Press", "slug": "leg-press" },
  "equipment": {
    "required": [
      { "id": "eq.legPress45", "name": "45° Leg Press", "fxe": "FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl" }
    ]
  }
}
```

## Comparar dos claves de equipamiento {#comparing-two-equipment-keys}

La comparación va capa por capa. `?` coincide con cualquier valor, y un código padre abarca a sus hijos. Una capa estándar omitida se lee `?`. Una capa extendida se tiene en cuenta solo cuando ambas claves la llevan; cuando solo una la lleva, hace que esa clave sea más específica.

- **Igual**: las dos claves se escriben de forma idéntica y no contienen `?`.
- **Más específica**: ninguna capa se contradice, y una clave declara algo que la otra deja abierto, nombra un hijo donde la otra nombra a su padre, o lleva una capa extendida que la otra omite.
- **Distinta**: al menos una capa no puede coincidir.

| Clave A | Clave B | Resultado |
|---|---|---|
| `FXE=1.0S/k:imp/f:bell.dumb` | `FXE=1.0S/k:imp/f:bell.dumb` | Igual |
| `FXE=1.0S/k:imp/f:band.loop` | `FXE=1.0S/k:imp/f:band` | A es más específica: `band.loop` es hijo de `band` |
| `FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down` | `FXE=1.0S/k:mac/l:?/s:?/m:?` | A es más específica: declara las capas que B deja abiertas |
| `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc` | `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex` | A es más específica: lleva capas extendidas que B omite |
| `FXE=1.0S/k:mac/l:ankles/s:seated/m:kn.flex` | `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex` | Distinta: las posturas difieren |
| `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc` | `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:stack` | Distinta: ambas llevan una fuente de resistencia, y difieren |
| `FXE=1.0S/k:stn/f:cable` | `FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down` | Distinta: una estación y una máquina de fuerza |
| `FXE=1.0S/k:imp/f:band.mini` | `FXE=1.0S/k:imp/f:band.loop` | Distinta: dos hijos de `band` |

Cuando cada clave deja abierto algo que la otra declara, ninguna es más específica, y las dos pueden seguir describiendo el mismo equipamiento: `FXE=1.0S/k:mac/l:hands/s:?/m:pull.back` y `FXE=1.0S/k:mac/l:?/s:seated.chest/m:pull.back`. Una máquina combinada y una de sus configuraciones se comparan de la misma manera: ninguna es más específica, y nada se contradice.

Una clave idéntica es una coincidencia fuerte, y cualquier otro resultado da una lista corta para que una persona la confirme. Véase [Usar las claves](../structural-keys.md#using-keys) para saber cómo guardar los enlaces confirmados.

## Encontrar elementos relacionados {#finding-related-items}

Las claves de equipamiento que comparten códigos forman familias, y nadie tiene que declararlas. Al buscar un valor en una capa se encuentran todos los equipamientos que lo comparten.

| Búsqueda | Encuentra |
|---|---|
| `k` es `mac` | Todas las máquinas de fuerza |
| `k` es `imp` | Todos los implementos: barras, mancuernas y pesas, balones, bandas y los demás |
| `k` es `erg` | Todas las máquinas de cardio |
| `f` es un código `bell.*` | Mancuernas, pesas rusas y mancuernas de circo |
| `k` es `imp` y `f` es un código `bar.*` | Todas las barras: recta, EZ, hexagonal, gruesa y curvada. Sin la clase, `bar.*` también encuentra la barra fija, las barras de fondos y las paralelas de suelo |
| `f` es `band` | Todas las bandas, a través de sus hijos `band.loop`, `band.mini` y `band.tube`. Un código padre encuentra a sus hijos |
| `m` es `pull.down` | Todas las máquinas de jalón |
| `m` es `kn.flex` | Máquinas de curl femoral tumbado, sentado y de pie |
| `k` es `mac` y `l` es `feet` | Máquinas que se empujan con los pies: prensas de piernas, patadas de glúteo, elevaciones de tibial |

`bell.*` significa cualquier código que empiece por `bell.`. Una búsqueda "es" es la misma operación que comparar para "más específica": toda máquina de jalón de un solo uso es más específica que `FXE=1.0S/k:mac/l:?/s:?/m:pull.down`. Una máquina combinada que además rema no es ni más específica ni distinta: nada se contradice. Una búsqueda "contiene" busca un código, o un hijo suyo, en cualquier lugar de la capa.

Una clave de ejercicio usa los mismos códigos, así que las mismas búsquedas encuentran ejercicios: `l` contiene `mac` encuentra todos los ejercicios hechos en una máquina de fuerza (véase [Encontrar elementos relacionados](./exercise-key.md#finding-related-items) en la página de la clave de ejercicio).

## Construir claves {#building-keys}

Una clave puede escribirse a mano siguiendo esta página, o generarse con el [FDS Encoder](../../tools/encoder/index.md).
