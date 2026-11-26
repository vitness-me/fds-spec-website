---
title: Clave de ejercicio
sidebar_label: Clave de ejercicio
description: Cómo se compone la clave estructural de ejercicio (fxi), capa por capa.
---

# Clave de ejercicio

La clave de ejercicio es la clave estructural de un ejercicio. Va en el campo `fxi` y registra cómo se mueve el cuerpo, la posición en la que empieza, sobre qué se apoya y con qué se mueve. Esta página muestra cómo se arma una clave, qué significa cada capa y cada código, y cómo se comparan dos claves.

El encabezado `FXI=1.0` es la versión de la clave, y las listas de códigos llegan con el lanzamiento de FDS que las publica. Un lanzamiento posterior puede agregar códigos o dividir un código en hijos más específicos, pero nunca cambia lo que significa un código, de modo que una clave escrita hoy sigue siendo válida.

Las listas de códigos se publican como registros: las capas y los códigos de esta clave en [`exercise-key.registry.json`](https://spec.vitness.me/registries/exercise-key.registry.json), los códigos de equipamiento en [`equipment-key.registry.json`](https://spec.vitness.me/registries/equipment-key.registry.json), y los [puntos corporales](https://spec.vitness.me/registries/body-points.registry.json) y las [posiciones corporales](https://spec.vitness.me/registries/body-positions.registry.json) que comparte con la clave de equipamiento.

## Anatomía de la clave {#anatomy-of-the-key}

Una zancada caminando con una mancuerna en cada mano tiene esta clave:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXI</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
      <span className="key-anatomy__label">encabezado</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-code">hip</span><span className="ka-sym">.</span><span className="ka-code">ext</span><span className="ka-sym">+</span><span className="ka-code">kn</span><span className="ka-sym">.</span><span className="ka-code">ext</span></code>
      <span className="key-anatomy__label">movimiento</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">o</span><span className="ka-sym">:</span><span className="ka-code">standing</span></code>
      <span className="key-anatomy__label">orientación</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">f</span><span className="ka-sym">:</span><span className="ka-code">travel</span><span className="ka-sym">.</span><span className="ka-code">fwd</span></code>
      <span className="key-anatomy__label">juego de pies</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-code">bell</span><span className="ka-sym">.</span><span className="ka-code">dumb</span><span className="ka-sym">@</span><span className="ka-code">hands</span></code>
      <span className="key-anatomy__label">carga</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">x</span><span className="ka-sym">:</span><span className="ka-code">a</span></code>
      <span className="key-anatomy__label">lados</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-letter">Letra de capa</span> · <span className="ka-code">código</span> · <span className="ka-sym">símbolo</span> · <span className="ka-flag">indicador</span>
  </figcaption>
</figure>

`FXI=1.0S/m:hip.ext+kn.ext/o:standing/f:travel.fwd/l:bell.dumb@hands/x:a`

| Parte | Texto | Qué dice |
|---|---|---|
| Tipo de clave | `FXI` | Esta es una clave de ejercicio. |
| Versión | `1.0` | Versión mayor 1, revisión 0. |
| Indicador | `S` | Todas las capas de la clave son estándar. |
| Movimiento | `m:hip.ext+kn.ext` | La cadera y las rodillas se extienden a la vez. |
| Orientación | `o:standing` | La repetición empieza de pie. |
| Juego de pies | `f:travel.fwd` | Cada paso avanza y no vuelve. |
| Carga | `l:bell.dumb@hands` | Mancuernas, sujetas en las manos. |
| Lados | `x:a` | Las piernas se turnan, repetición a repetición. |
| Capas omitidas | `k s g r h p a` | Cada una está en su valor predeterminado: se mueve el extremo de la extremidad, el suelo sostiene los pies, el agarre y la base habituales, recorrido completo, sin postura sostenida, la línea de tracción habitual, sin accesorio declarado. |

Las capas se separan con `/`. Cada capa es su letra, un `:` y un valor hecho de códigos y símbolos.

## Dimensiones y capas {#dimensions-and-layers}

Cada capa registra una dimensión del ejercicio.

| Letra | Capa | Dimensión que registra | Obligatoria | Cuando se omite |
|---|---|---|---|---|
| `m` | Movimiento | Qué articulaciones se mueven, en qué dirección, en qué fases, y si el movimiento es sostenido, cíclico, balístico o un estiramiento | Sí | — |
| `o` | Orientación | La posición del cuerpo al empezar la repetición | Sí | — |
| `k` | Extremo móvil | Qué extremo del cuerpo se mueve en el trabajo de tronco | No | Se mueve el extremo de la extremidad |
| `f` | Juego de pies | Pasos, una base dividida o desplazamiento | No | Pies apoyados a la par |
| `s` | Apoyo | Las superficies que soportan el peso del cuerpo, y los puntos corporales sobre ellas | No | El suelo, según implica la orientación |
| `l` | Carga | El equipamiento que carga los músculos que trabajan, y dónde se sujeta; o el peso corporal | Sí | — |
| `x` | Lados | Si las extremidades trabajan juntas, un lado cada vez, por turnos o en direcciones opuestas | No | Ambas juntas |
| `g` | Agarre y base | Orientación de la mano, anchura del agarre y anchura de la base | No | La orientación de mano habitual, anchura media, base media |
| `r` | Recorrido e inicio | Recorrido parcial o ampliado, y una posición de inicio distinta de la habitual | No | Recorrido completo desde el inicio habitual |
| `h` | Postura sostenida | En qué posición se mantienen las extremidades que no hacen el trabajo | No | Sin postura sostenida |
| `p` | Línea de tracción | Desde dónde tira un cable o una banda, o la trayectoria de la carga respecto al cuerpo | No | La línea que implica el movimiento |
| `a` | Accesorio | Un accesorio o un compañero que ayuda sin cargar ni sostener el cuerpo | No | No declarado |

Reglas para toda clave:

- Una clave debe llevar `m`, `o` y `l`. Cuando no se conoce el movimiento, la orientación o la carga, se escribe `?` como valor: `o:?`.
- Las capas deben aparecer en el orden de la tabla: `m o k f s l x g r h p a`.
- Una capa en su valor predeterminado se omite. Escribir un código predeterminado (`x:b`, `f:level`, `h:none`) no dice nada más, y la forma escrita lo elimina.
- **Un valor predeterminado es un valor**, salvo en la capa de accesorio, que, omitida, queda sin declarar. Una clave sin `x` dice que ambos lados trabajan juntos. Ese es un ejercicio distinto de uno con `x:u`, no uno menos específico. Solo `?` deja una dimensión abierta.
- Los elementos unidos por `+`, y los puntos después de `@`, se escriben ordenados (`floor@feet,hands`), y en el movimiento se elimina una acción articular escrita junto a su propio hijo. Así, un ejercicio siempre tiene una sola forma escrita.
- La capa de accesorio `a` es la única capa extendida. Una clave que la lleva tiene el indicador `N` (`FXI=1.0N/…`); toda otra clave tiene el indicador `S`.

Las capas siguientes se listan en el orden de la clave. Para cada una: sus códigos y luego sus reglas.

### Movimiento (`m`) {#motion-m}

El movimiento se construye con acciones articulares, escritas `joint.action`.

| Articulación | Significado |
|---|---|
| `nk` | Cuello |
| `sp` | Columna: el tronco, segmentos torácico y lumbar juntos |
| `sc` | Escápula: el omóplato sobre la caja torácica |
| `sh` | Articulación del hombro |
| `el` | Codo |
| `fa` | Antebrazo: el giro que rota la palma |
| `wr` | Muñeca |
| `hip` | Cadera |
| `kn` | Rodilla |
| `ank` | Tobillo y pie |

| Acción articular | Significado |
|---|---|
| `nk.flex` `nk.ext` | El mentón hacia el pecho; la cabeza inclinada hacia atrás |
| `nk.lflex` `nk.rot` | La oreja hacia el hombro; girar la cabeza |
| `sp.flex` `sp.ext` | Las costillas hacia la pelvis, como en un crunch; enderezar o arquear la espalda |
| `sp.lflex` `sp.rot` | Inclinación lateral; los hombros girando respecto a la cadera |
| `sc.elev` `sc.dep` | Omóplatos hacia arriba (encogimiento); hacia abajo |
| `sc.pro` `sc.ret` | Omóplatos separados alrededor de las costillas; juntos |
| `sh.flex` | El brazo hacia delante y arriba: elevación frontal, press por encima de la cabeza |
| `sh.ext` | El brazo hacia abajo y atrás desde delante: remo, fondo |
| `sh.ext.oh` | Los brazos bajan por delante de la cara desde arriba de la cabeza: dominada supina, jalón con agarre cerrado, pullover. Hijo de `sh.ext`: `el.flex+sh.ext+sh.ext.oh` se escribe `el.flex+sh.ext.oh` |
| `sh.abd` `sh.add` | El brazo hacia el costado y arriba (elevación lateral); hacia abajo al costado desde abierto (dominada abierta) |
| `sh.hadd` `sh.habd` | El brazo cruza por delante a la altura del pecho (press, aperturas); hacia atrás y afuera a la altura del pecho (aperturas invertidas) |
| `sh.ir` `sh.er` | El antebrazo gira hacia el vientre, con el codo doblado; gira hacia afuera |
| `el.flex` `el.ext` | El codo se dobla (curl); se estira (press, extensión de tríceps) |
| `fa.pron` `fa.sup` | La palma gira hacia abajo; la palma gira hacia arriba |
| `wr.flex` `wr.ext` | La palma hacia el antebrazo; el dorso de la mano hacia el antebrazo |
| `wr.rdev` `wr.udev` | El lado del pulgar hacia el antebrazo; el lado del meñique hacia el antebrazo |
| `hip.flex` `hip.ext` | El muslo hacia el tronco, o el tronco hacia el muslo (abdominal completo); el muslo se aleja del tronco, como al ponerse de pie |
| `hip.abd` `hip.add` | La pierna hacia el costado; la pierna hacia la otra pierna |
| `hip.ir` `hip.er` | La rodilla gira hacia dentro; la rodilla gira hacia fuera |
| `kn.flex` `kn.ext` | La rodilla se dobla contra resistencia (curl femoral); se estira (ponerse de pie desde una sentadilla) |
| `ank.df` `ank.pf` | Los dedos del pie hacia la espinilla; subir a las puntas o impulsarse |
| `ank.inv` `ank.ev` | La planta gira hacia dentro; la planta gira hacia fuera |
| `<joint>.circ` | Circunducción de la articulación: `nk`, `sp`, `sh`, `wr`, `hip` o `ank` |
| `<joint>.?` | La articulación se mueve, dirección desconocida |

Reglas:

- Se escribe la dirección en que se mueven las articulaciones mientras los músculos que trabajan se acortan contra la carga: el levantamiento, nunca el descenso, el regreso ni una pausa.
- Una articulación cuenta cuando los músculos que trabajan la mueven en un recorrido claro, de unos 30° o más, como parte de lo que el ejercicio entrena. Una articulación que se mantiene quieta a propósito se omite: la rodilla en un peso muerto rumano o en un swing, el codo en unas aperturas o en una elevación lateral.
- La columna se escribe solo cuando el movimiento del tronco es el ejercicio (crunch, extensión de espalda, giro); la escápula, solo cuando el omóplato se mueve por sí solo (encogimiento); la muñeca y el cuello, solo en ejercicios de muñeca y de cuello; la rotación del hombro, solo en ejercicios de rotación; y el tobillo, solo cuando el cuerpo sube a las puntas o se impulsa desde el suelo (elevación de talones, salto, carrera).
- Un giro de la palma durante un curl o un press es agarre (`g`), no `fa.pron` ni `fa.sup`. La rotación del antebrazo se escribe solo cuando girar contra resistencia es el trabajo.
- La acción del hombro sigue la trayectoria de las manos respecto al tronco:

  | Las manos se mueven | Acción |
  |---|---|
  | Alejándose del pecho, perpendiculares al tronco: press de banca, flexión de brazos, aperturas | `sh.hadd` |
  | Alejándose del pecho hacia el lado de la cabeza: press inclinado | `sh.flex+sh.hadd` |
  | Alejándose del pecho hacia el lado de los pies: press declinado | `sh.ext+sh.hadd` |
  | Hacia arriba a lo largo del tronco, por encima de la cabeza: press por encima de la cabeza | `sh.flex` |
  | Hacia abajo a lo largo del tronco, hacia los pies: fondo | `sh.ext` |
  | Hacia el tronco desde delante, con los codos cerca: remo | `sh.ext` |
  | Hacia el tronco desde delante, con los codos abiertos a la altura del hombro: face pull | `sh.habd` |
  | Hacia abajo desde arriba de la cabeza, por delante de la cara: dominada supina, cualquier dominada o jalón con agarre supino, neutro o cerrado; jalón con brazos rectos, pullover, slam | `sh.ext.oh` |
  | Hacia abajo desde arriba de la cabeza, por los costados: dominada o jalón con agarre prono de anchura media o abierta | `sh.add` |
  | Hacia arriba por el costado: elevación lateral | `sh.abd` |

- Una fase por cada movimiento distinto, en el orden de la repetición, unidas por `>`. Si el segundo movimiento empieza antes de que termine el primero, los dos son una sola fase (un thruster). Si no, son dos (una sentadilla y luego un press).
- Dos acciones opuestas, como `el.flex` y `el.ext`, nunca comparten una parte. Una misma articulación puede moverse en direcciones opuestas en fases distintas.
- Un prefijo delante de una parte fija su clase: sostenida, cíclica, balística, estiramiento estático o estiramiento dinámico. Sin prefijo es una fase de movimiento normal. Los prefijos se listan en [Símbolos](#symbols).
- Una parte sostenida bajo extremidades en movimiento es una parte propia, unida a ellas con `|`: una plancha con elevación de pierna es `=sp.flex|hip.ext`. También lo es un empuje sostenido de una extremidad que no se mueve, cuando el ejercicio se construye sobre él: un abdominal Janda tira de los talones hacia abajo durante toda la repetición, `=kn.flex|hip.flex+sp.flex`.
- En un estiramiento, `|` también une dos extremidades llevadas en direcciones opuestas: un estiramiento del corredor es `%hip.ext|%hip.flex`.
- En un estiramiento, se escribe una articulación sostenida cuando decide qué músculo se estira: la rodilla en un estiramiento de gemelos, `kn.ext` recta o `kn.flex` doblada.

### Orientación (`o`) {#orientation-o}

Estos códigos son las posiciones corporales de ambas claves: una [clave de equipamiento](./equipment-key.md#posture-s) escribe con ellos la postura de una máquina.

| Código | Significado | Puntos que implica |
|---|---|---|
| `standing` | Sobre los pies, el tronco a menos de unos 30° de la vertical | `feet` |
| `standing.bent` | Sobre los pies, el tronco inclinado hacia delante más de unos 30° y mantenido así (remo inclinado) | `feet` |
| `standing.chest` | Sobre los pies, el tronco apoyado en una almohadilla, erguido o inclinado (máquina de elevación de talones tipo burro) | `feet`, `chest` |
| `seated` | Sentado, el tronco a más de 60° de la horizontal | `seat` |
| `seated.bent` | Sentado, el tronco inclinado hacia delante sobre los muslos y mantenido así | `seat` |
| `seated.chest` | Sentado, el pecho contra una almohadilla que sostiene el tronco (máquina de remo, máquina de deltoides posterior) | `seat`, `chest` |
| `kneeling` | Sobre ambas rodillas, el tronco erguido | `knees`, `shins` |
| `kneeling.half` | Sobre una rodilla, el otro pie adelante | `knees`, `feet` |
| `supine` | Boca arriba, el tronco a menos de 15° de la horizontal | `back` |
| `supine.incline` | Boca arriba, la cabeza más alta que la cadera, el tronco a 15–60° de la horizontal | `back` |
| `supine.decline` | Boca arriba, la cabeza más baja que la cadera, el tronco a 15–60° de la horizontal | `back` |
| `prone` | Boca abajo, el tronco a menos de 15° de la horizontal: tumbado, plancha, flexión de brazos, en cuadrupedia | `chest` |
| `prone.incline` | Boca abajo, la cabeza más alta que la cadera, 15–60° (manos elevadas) | `chest` |
| `prone.decline` | Boca abajo, la cabeza más baja que la cadera, 15–60° (pies elevados) | `chest` |
| `prone.pike` | Boca abajo, la cadera en lo más alto, manos y pies en el suelo | `feet`, `hands` |
| `side-lying` | De costado: tumbado, o una plancha lateral | — |
| `hanging` | Sostenido por las manos o los brazos, los pies sin tocar el suelo | `hands` |
| `inverted` | Cabeza abajo, la cabeza en lo más bajo: parada de manos, parada de cabeza | `hands` |

Reglas:

- Se escribe la orientación al inicio de la primera fase.
- Una bisagra hacia delante mantenida durante toda la serie es `standing.bent`. Una bisagra en la que el tronco se mueve, como en un peso muerto o un swing, empieza `standing`.
- La orientación sigue al tronco: en cuadrupedia es `prone`, y `kneeling` significa que el tronco está erguido.
- Sentado en el suelo inclinado hacia atrás 30–60° (V-sit, giro ruso) es `supine.incline`.
- En una máquina, se escribe la posición del cuerpo: una extensión de piernas sentado es `seated`, un curl femoral tumbado `prone`, una prensa de piernas `supine.incline`, una máquina de remo con almohadilla de pecho `seated.chest`. Es el mismo código que la postura de la máquina en su clave de equipamiento.
- Cuando la repetición termina en una orientación distinta de la de inicio, se escriben ambas: levantarse desde tumbado es `o:supine>standing`. Una repetición que baja y vuelve, como un burpee, es solo su inicio.

### Extremo móvil (`k`) {#moving-end-k}

| Código | Significado |
|---|---|
| `limbs` | Se mueve el extremo de la extremidad (el predeterminado) |
| `trunk` | Se mueve el extremo del tronco y las piernas se quedan quietas: abdominal completo, crunch, puente, hip thrust, extensión de espalda, curl nórdico |
| `both` | Ambos extremos se mueven el uno hacia el otro: V-up, navaja, tuck-up |

Reglas:

- `k` se escribe solo en el trabajo de tronco en el que se mueve el extremo del tronco o ambos extremos. Todos los demás ejercicios la omiten.

### Juego de pies (`f`) {#footwork-f}

| Código | Significado |
|---|---|
| `level` | Pies apoyados a la par (el predeterminado) |
| `split` | Pies apoyados en una base dividida, uno delante del otro |
| `step.fwd` `step.back` `step.side` | Cada repetición da un paso hacia delante, hacia atrás o hacia el costado, y vuelve |
| `step.cross` | Cada repetición da un paso hacia atrás cruzando por detrás de la otra pierna (curtsy), y vuelve |
| `travel.fwd` `travel.back` `travel.side` | El cuerpo se desplaza hacia delante, hacia atrás o de lado y no vuelve en cada repetición |

Reglas:

- Una zancada sin palabra de dirección da el paso hacia delante; una sentadilla dividida se queda en `split`; una zancada caminando se desplaza.
- El trabajo en el sitio, o en una caminadora u otra máquina de cardio, omite `f`.
- `level` se escribe solo dentro de una secuencia: un split jerk es `f:level>split`.

### Apoyo (`s`) {#support-s}

El apoyo nombra cada superficie con su [código de equipamiento](#equipment-in-an-exercise-key): un apoyo de las [tablas de formas](./equipment-key.md#form-f) de la clave de equipamiento, como `floor`, `bench`, `box` o `bar.fixed`, o cualquier código de carga excepto `none`. Después de la superficie van los [puntos corporales](#body-points) listados en la carga.

Reglas:

- Se escribe cada superficie que soporta el peso del cuerpo, o en la que se apoya una extremidad, más allá de lo que implica la orientación. Después de la superficie se escribe `@` y los puntos sobre ella, omitiendo los puntos que implica la orientación.
- Nunca se escribe un suelo sin más, una colchoneta, el asiento o el banco bajo un cuerpo sentado, ni el asiento y las almohadillas propios de una máquina. Un asiento inestable (`ball.stab`, `dome`, `board.bal`, `roller.foam`) sí se escribe.
- Cuando el tronco no descansa sobre nada, como en una plancha o una flexión de brazos, se listan todos los puntos que soportan peso: `s:floor@feet,forearms`. Un cuerpo boca arriba colgado de las manos también conserva `floor@feet`: un remo invertido es `s:bar.fixed@hands+floor@feet`.
- Los pies en el suelo nunca se escriben bajo un cuerpo sentado, ni bajo un cuerpo boca arriba tumbado sobre un banco, un balón o un rodillo. Los pies sobre cualquier otra cosa sí se escriben: un ejercicio sentado con los pies sobre un balón conserva `ball.stab@feet`.
- Las superficies bajo puntos distintos son elementos separados: los pies sobre un balón y las manos en el suelo es `s:ball.stab@feet+floor@hands`.
- Un cajón, step, banco o plataforma bajo manos o pies elevados es `box`, salvo que el ejercicio nombre la superficie.
- `dome` es un BOSU con el lado no declarado. Se escribe `dome.up` o `dome.down` cuando se conoce el lado.
- El equipamiento que solo carga el cuerpo va en `l`, nunca en `s`.

### Carga (`l`) {#load-l}

La carga nombra el equipamiento que carga los músculos que trabajan por su [código de equipamiento](#equipment-in-an-exercise-key), o escribe `none` para el peso corporal. Después de cada código van `@` y un punto de sujeción.

#### Puntos corporales {#body-points}

Un punto de sujeción es uno de los puntos corporales. Los mismos puntos corporales siguen a `@` en el apoyo, y una [clave de equipamiento](./equipment-key.md#load-interface-l) escribe con ellos la interfaz de carga de una máquina.

| Punto corporal | Significado |
|---|---|
| `hands` | Las manos, o una mano: a los costados, con el brazo extendido, por un asa; las asas o la barra de una máquina |
| `forearms` | Los antebrazos, con los codos doblados: una plancha sobre los codos, o las almohadillas de antebrazo de una máquina |
| `elbows` | El pliegue de los codos (Zercher) |
| `arms` | La parte superior de los brazos: un banco Scott, o la almohadilla de brazo de una máquina sobre el brazo o el codo |
| `shoulders` | Los hombros: el rack frontal o un hombro, o las hombreras de una máquina |
| `chest` | El pecho: una carga sujeta contra él (goblet), o una almohadilla de pecho |
| `back` | La espalda: una barra sobre la parte alta de la espalda (sentadilla trasera), o una almohadilla de espalda |
| `hips` | La parte delantera de la cadera: una carga sobre ella (hip thrust), o la almohadilla o el cinturón de cadera de una máquina |
| `waist` | Colgado de un cinturón a la cintura |
| `seat` | Los glúteos: sentarse sobre un cajón o un banco, o el asiento móvil de una máquina |
| `thighs` | Sobre los muslos o alrededor de ellos, o el rodillo de muslo de una máquina |
| `knees` | En las rodillas o alrededor de ellas, o la almohadilla de rodilla o la plataforma de una máquina |
| `shins` | Las espinillas |
| `calves` | Las pantorrillas, la parte posterior de la pierna |
| `ankles` | En los tobillos o justo encima: una correa, una tobillera, o el rodillo de una máquina sobre la parte baja de la pierna |
| `feet` | Los pies, o un pie: en el suelo, una plataforma o pedales |
| `head` | La cabeza o la frente, o la almohadilla de cabeza de una máquina |

Dos puntos de sujeción no son puntos corporales, y se escriben solo en la carga:

| Punto de sujeción | Significado |
|---|---|
| `overhead` | Sujeto con los brazos extendidos por encima de la cabeza durante toda la repetición |
| `assist` | El implemento soporta parte del peso corporal: una banda de asistencia o una máquina asistida |

Reglas:

- Se lista cada equipamiento que carga los músculos que trabajan, cada uno con `@` y el lugar donde se sujeta: `l:bar.straight@back`.
- `none` significa sin equipamiento. Va solo y no lleva punto de sujeción: un fondo lastrado es `l:plate@waist`, no `none` junto a un disco.
- Una máquina de fuerza es `mac`. No tiene un código más específico, porque el propio movimiento del ejercicio ya dice lo que la máquina guía. Una máquina de cardio es `erg`, o `erg.` y su movimiento cuando se conoce: `erg.row`. La [clave de equipamiento](./equipment-key.md#keys-in-records) del registro dice qué máquina es.
- Un código de apoyo nunca se escribe en `l`.
- Una banda cuyo tipo no se nombra es `band`. Un tipo nombrado lleva su código hijo: una banda de bucle larga es `band.loop`. Una banda se sujeta donde presiona o tira del cuerpo. Dónde está anclada no se escribe.
- La cantidad se omite cuando es la habitual, y `*n` se escribe solo cuando difiere. Un implemento de una mano (`bell.dumb`, `bell.kettle`, `plate`, `club`) es uno por cada mano que trabaja; todo otro código es uno. En el pecho, la espalda, la cadera o la cintura, cualquier implemento es uno: una sentadilla goblet con una mancuerna es `l:bell.dumb@chest`. Una pesa rusa sujeta con ambas manos es `bell.kettle*1@hands`.
- Se escribe `?` en la parte que no se conoce: `?@chest` cuando no se conoce el implemento, `bell.kettle@?` cuando no se conoce el punto de sujeción, `l:?` cuando no se sabe ni eso.

### Lados (`x`) {#sides-x}

| Código | Significado |
|---|---|
| `b` | Ambas extremidades trabajan juntas, o el movimiento no tiene lados (el predeterminado) |
| `u` | Un lado hace todas las repeticiones de la serie, y luego el otro lado |
| `a` | Los lados se turnan repetición a repetición |
| `rc` | Ambos lados se mueven a la vez en direcciones opuestas: caminar, patadas de tijera, escaladores |
| `@arms` `@legs` | Alcance: el patrón se aplica a los brazos o a las piernas |

Reglas:

- Un lado y luego el otro (`u`) y turnos repetición a repetición (`a`) son ejercicios distintos.
- Se agrega un alcance solo cuando el movimiento no lo implica ya. Las piernas de una zancada están implícitas, así que es `x:u`, no `x:u@legs`.
- Cuando los brazos y las piernas siguen patrones distintos, se escribe un elemento por alcance: un acarreo con un brazo es `x:rc@legs+u@arms`.
- Los movimientos que solo rotan o inclinan lateralmente el tronco o el cuello no llevan `x`.
- Un estiramiento, un rodamiento o una isometría hecha con una extremidad y luego con la otra es `x:u`.

### Agarre y base (`g`) {#grip-and-stance-g}

| Código | Significado |
|---|---|
| `pr` | Prono: palmas hacia abajo o hacia fuera (agarre por encima) |
| `su` | Supino: palmas hacia arriba o hacia uno mismo (agarre por debajo) |
| `ne` | Neutro: palmas enfrentadas (martillo) |
| `mx` | Mixto: una mano por encima y otra por debajo |
| `w-t` `w-n` `w-m` `w-w` | Anchura del agarre: manos juntas, estrecho, medio (el predeterminado), abierto |
| `st-n` `st-m` `st-w` | Base: estrecha, media (la predeterminada), ancha |

Reglas:

- La orientación de mano habitual es `su` cuando todas las acciones del movimiento son `el.flex` (un curl), y `pr` en los demás casos. Un código de mano se escribe solo cuando difiere.
- Los elementos de una posición se unen con `+`: `g:ne+w-n`. Un agarre que cambia dentro de la repetición es una secuencia: `g:su>pr`.
- La anchura se aplica a las manos sobre un implemento y sobre un apoyo: una flexión diamante es `w-t`.
- La base se escribe solo para un inicio de pie, o cuando los pies empujan la plataforma de una máquina.
- Un agarre que el implemento impone sigue siendo el agarre: una cuerda en la polea es `ne`. El `ne` de la barra hexagonal es la única excepción y nunca se escribe.

### Recorrido e inicio (`r`) {#range-and-start-r}

| Código | Significado |
|---|---|
| `partial` | Parte del recorrido habitual a propósito: medias repeticiones, pulsos |
| `deep` | Más profundo que el recorrido habitual |
| `deficit` | De pie sobre algo para bajar más de lo habitual |
| `from-floor` | Cada repetición empieza con la carga apoyada en el suelo |
| `from-top` | Empieza de pie con la carga sujeta, bajada sin apoyarla (desde colgado (hang), por encima de la rodilla) |
| `from-top.knee` | Un colgado que empieza a la altura de la rodilla o por debajo. Hijo de `from-top` |
| `from-pins` | Cada repetición empieza desde los pasadores, bloques o un rack por encima del suelo |
| `from-drop` | Cada repetición empieza bajando de un cajón y aterrizando (salto en profundidad) |

Reglas:

- `partial` y `deep` se contradicen. Una clave lleva como mucho un código de inicio.
- Un código de inicio se escribe solo donde no es el inicio habitual del movimiento: un peso muerto empieza desde el suelo, así que para él nunca se escribe `from-floor`.
- El recorrido completo nunca se escribe.

### Postura sostenida (`h`) {#held-posture-h}

| Código | Significado |
|---|---|
| `none` | Las extremidades que no trabajan hacen lo que implica el movimiento (el predeterminado) |
| `arms.oh` | Brazos estirados por encima de la cabeza, manos vacías |
| `arms.fwd` | Brazos estirados hacia delante desde los hombros, manos vacías |
| `arms.side` | Brazos extendidos hacia los costados |
| `arms.cross` | Brazos cruzados sobre el pecho |
| `hands.head` | Manos detrás de la cabeza o sobre ella (prisionero) |
| `el.bent` | Codos que trabajan mantenidos doblados a unos 90° |
| `ua.oh` | Brazos mantenidos arriba junto a la cabeza mientras trabajan los codos (extensión de tríceps por encima de la cabeza) |
| `ua.side` | Brazos separados de los costados, codos abiertos, mientras trabajan los codos |
| `leg.fwd` | Pierna libre estirada hacia delante |
| `leg.back` | Pierna libre mantenida atrás |
| `legs.l` | Piernas estiradas a unos 90° del tronco |
| `kn.bent` | Rodillas mantenidas dobladas mientras trabajan la cadera o los brazos (elevación de rodillas colgado) |
| `trunk.fwd` | Tronco inclinado hacia delante donde la orientación no lo dice ya (fondo de pecho) |

Reglas:

- Se escribe la postura de las extremidades que se mantienen quietas mientras otras trabajan, cuando difiere de lo que implica el movimiento. Una sentadilla con las manos detrás de la cabeza es `h:hands.head`; una sentadilla simple omite `h`.

### Línea de tracción (`p`) {#line-of-pull-p}

| Código | Significado |
|---|---|
| `usual` | La línea que implica el movimiento (el predeterminado) |
| `hi` | Un cable o una banda anclados más alto de lo habitual para el movimiento |
| `lo` | Anclados más bajo de lo habitual |
| `behind` | La carga o el cuerpo pasan por detrás de la cabeza o del tronco (press tras nuca) |
| `side` | La carga tira desde un lado, con el cuerpo de costado respecto al anclaje |
| `neck` | La carga baja hasta el cuello o el mentón en lugar del pecho |
| `double` | Una cuerda pasa dos veces bajo los pies en cada salto (doble salto) |

Reglas:

- `p` se escribe solo cuando la línea difiere de la habitual del movimiento. Unas aperturas en polea de arriba abajo son `p:hi`; unas de abajo arriba son `p:lo`.
- El anclaje habitual es bajo para un curl, una elevación, un remo al mentón, un encogimiento, una patada de tríceps, un pull-through o un ejercicio de cadera; alto para un jalón de tríceps, un jalón, un jalón con brazos rectos, un face pull, un crunch de rodillas o un leñador; a media altura para un remo, unas aperturas, un cruce de poleas, un press de pecho, una rotación o una extensión por encima de la cabeza; y desde el costado para un press Pallof.

### Accesorio (`a`) {#accessory-a}

Los códigos de accesorio son los códigos de accesorio de la clave de equipamiento, listados en sus [tablas de formas](./equipment-key.md#form-f), y `partner`.

| Código | Significado |
|---|---|
| `none` | Sin accesorio |
| `strap.stretch` | Una correa, cinturón, toalla, cuerda o banda de bucle usada para tirar de una extremidad o mantenerla en un estiramiento |
| `partner` | Un compañero que sujeta, resiste o asiste |
| Cualquier otro código de accesorio | `belt.lift`, `strap.lift`, `mat` y los demás |

Reglas:

- Un accesorio nunca carga los músculos que trabajan ni soporta peso. La carga va en `l`; el apoyo, en `s`.
- Un código de accesorio nombra el mismo equipamiento que su clave de equipamiento: `a:strap.stretch` es `FXE=1.0S/k:acc/f:strap.stretch`. Un compañero es una persona, no equipamiento, y no tiene clave de equipamiento.
- Un asa o una barra en un cable forma parte de la estación, no es un accesorio.
- `a` es la capa extendida: una clave que la lleva tiene el indicador `N`. Se compara solo cuando ambas claves la llevan; cuando solo una la lleva, esa clave es más específica.

## Símbolos {#symbols}

Todo lo que en una clave no es un código es un símbolo.

| Símbolo | Significado | Ejemplo |
|---|---|---|
| `/` | Separa capas | `o:standing/l:none` |
| `:` | Separa la letra de una capa de su valor | `o:standing` |
| `.` | Une una articulación a su acción, o un código a un hijo más específico | `el.flex`, `standing.bent`, `erg.row` |
| `+` | Une elementos que van juntos: acciones de una fase, superficies, implementos, elementos de agarre, códigos de recorrido, elementos de lados, códigos de postura sostenida | `m:hip.ext+kn.ext` |
| `>` | Una secuencia en el orden de la repetición: fases, orientación de inicio y de final, cambios de juego de pies o de agarre | `g:su>pr` |
| `\|` | Dos partes de una fase al mismo tiempo: partes de clases distintas, o dos extremidades llevadas en direcciones opuestas en un estiramiento | `m:=sp.flex\|hip.ext`, `m:%hip.ext\|%hip.flex` |
| `@` | Dónde: los puntos sobre una superficie, el punto de sujeción del equipamiento, el alcance de un código de lados | `l:bell.dumb@hands` |
| `,` | Varios puntos corporales sobre una superficie | `s:floor@feet,hands` |
| `*n` | Cantidad de equipamiento, escrita solo cuando difiere de la cantidad habitual | `l:bell.kettle*1@hands` |
| `*` | Una capa entera genérica a propósito: el ejercicio puede hacerse de cualquier manera | `o:*` |
| `?` | Desconocido. Coincide con cualquier cosa y nunca contradice | `o:?`, `bell.kettle@?`, `sh.?` |
| `-` | Después de una acción: un impulso de recorrido corto a propósito | `m:el.ext+hip.ext-+kn.ext-+sh.flex` |

Los prefijos de movimiento van delante de una parte de `m` y fijan su clase.

| Prefijo | Clase | Ejemplo |
|---|---|---|
| ninguno | Una fase de movimiento normal | `m:el.flex` |
| `^` | Balístico: la fase termina con el cuerpo en el aire o con el implemento soltado. Solo vuelo o suelta reales: los levantamientos olímpicos y las fases cíclicas nunca lo llevan. Una acción hecha en el aire es la fase siguiente | `m:^ank.pf+hip.ext+kn.ext`, una sentadilla con salto; `m:^el.ext+sh.hadd>sh.hadd`, una flexión con palmada |
| `~` | Cíclico: ciclos continuos sin límite entre repeticiones; se escribe la mitad impulsora de un ciclo. `~0` es rodar sobre un rodillo de espuma, sin dirección | `m:~hip.flex`, escaladores |
| `=` | Sostenido con esfuerzo durante toda la serie; se escribe hacia dónde empujan los músculos. `=0` es una isometría de equilibrio sin dirección | `m:=sp.flex`, una plancha |
| `%` | Estiramiento estático: las direcciones hacia las que se llevan las articulaciones, mantenidas al final del recorrido | `m:%ank.df+kn.ext`, un estiramiento de gemelos |
| `&` | Estiramiento dinámico: llevado al final del recorrido y soltado, una y otra vez | `m:&hip.flex`, un balanceo de pierna hacia delante |

`?` puede sustituir a una capa entera, un equipamiento, un punto de sujeción, una superficie, un punto corporal, la dirección de una articulación o una fase entera. No se admite un "y quizá más" abierto (`+?`): se escriben las acciones conocidas, o `?` para la fase entera.

## Equipamiento en una clave de ejercicio {#equipment-in-an-exercise-key}

Una clave de ejercicio y una [clave de equipamiento](./equipment-key.md#equipment-keys-in-exercise-keys) comparten tres listas de códigos, de modo que una clave de ejercicio lleva directamente a la clave de su equipamiento, y la clave de una máquina dice cómo se sitúa el cuerpo en ella con las palabras que usa una clave de ejercicio.

| Lista | En una clave de ejercicio | En una clave de equipamiento | Se lista en |
|---|---|---|---|
| Códigos de equipamiento | El equipamiento en la carga (`l`) y el apoyo (`s`), y el accesorio (`a`) | Clase (`k`) y forma (`f`) | Las [tablas de formas](./equipment-key.md#form-f) de la clave de equipamiento |
| Puntos corporales | Después de `@` en la carga y el apoyo | La interfaz de carga de una máquina (`l`) | [Puntos corporales](#body-points) |
| Posiciones corporales | Orientación (`o`) | La postura de una máquina (`s`) | [Orientación](#orientation-o) |

La máquina de remo de abajo muestra las tres: remar en ella se sujeta `@hands` y empieza `seated`, y su clave de equipamiento escribe `l:hands` y `s:seated`.

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

Un código de forma representa una clave de equipamiento: `bar.straight` es `FXE=1.0S/k:imp/f:bar.straight`. Los códigos de forma se listan en las [tablas de formas](./equipment-key.md#form-f) de la clave de equipamiento. Un código de clase representa todas las claves de esa clase, con las demás capas abiertas: `mac` es `FXE=1.0S/k:mac/l:?/s:?/m:?`. `erg.row` es `FXE=1.0S/k:erg/c:?/l:?/s:?/m:row`: cualquier máquina de cardio cuyo movimiento es `row`. Los movimientos de cardio se listan en el [movimiento](./equipment-key.md#motion-m) de la clave de equipamiento.

Todo código de forma puede escribirse en una clave de ejercicio, hijos incluidos: `band.loop` es una banda de bucle larga, y `band` la abarca. El `fxe` del registro nombra el equipamiento exacto, y es la clave del código o más específico que ella. La máquina de remo de arriba es más específica que `erg.row`.

Un accesorio nunca es el [equipamiento principal](./equipment-key.md#checking-an-exercise-against-its-equipment) del ejercicio. El código de accesorio en la capa `a` de la clave de ejercicio es el código de accesorio de la clave de equipamiento: `a:strap.stretch` es `FXE=1.0S/k:acc/f:strap.stretch`. Un estiramiento con correa, `FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:none/x:u/a:strap.stretch`, tiene `l:none`, así que su equipamiento principal es `FXE=1.0S/k:none`.

Un código de apoyo se escribe solo en `s`, y un código de accesorio solo en `a`. Todo otro código excepto `none` puede escribirse en `l` o en `s`. La clave de ejercicio añade dónde se sujeta o se toca el equipamiento (`@`) y, en `l`, cuántos hay (`*n`): véase [Carga](#load-l).

En una máquina, las dos claves coinciden: la postura de la máquina es la orientación de inicio del ejercicio, y su interfaz de carga incluye el punto donde el ejercicio sujeta `mac` o `erg` (`@overhead` está en las manos). El punto de sujeción `@assist` no se comprueba.

Las claves difieren en tres aspectos, a propósito:

- **Una máquina de fuerza no tiene un código específico.** Una máquina de cardio puede ser `erg.row`, porque el ciclo es el movimiento. Una máquina de fuerza es solo `mac`, porque el propio movimiento del ejercicio lleva lo que la máquina guía.
- **Una capa omitida se lee de otra manera.** En una clave de ejercicio está en su valor predeterminado, que es un valor, salvo en la capa de accesorio, que, omitida, queda sin declarar. En una clave de equipamiento es desconocida, `?`.
- **Las letras de capa de cada clave son propias.** Solo `m` es movimiento en ambas. En una clave de ejercicio `l` es la carga y `s` el apoyo; en una clave de equipamiento `l` es la interfaz de carga y `s` la postura.

Las dos claves nunca registran el mismo hecho dos veces. El agarre, los lados, el recorrido, el juego de pies, la altura de la polea, el ángulo del banco, el punto de sujeción y la cantidad pertenecen a la clave de ejercicio. Qué es el equipamiento, su geometría fija y cómo está construido pertenecen a la clave de equipamiento.

[Comprobar un ejercicio contra su equipamiento](./equipment-key.md#checking-an-exercise-against-its-equipment) muestra cómo se comprueban las dos claves entre sí.

## Ejemplos resueltos {#worked-examples}

Cada ejemplo parte de una descripción sencilla y decide una capa cada vez. Una capa que no aparece está en su valor predeterminado.

### Curl de pie con mancuerna {#standing-dumbbell-curl}

De pie, una mancuerna en cada mano, ambos codos se doblan a la vez, palmas hacia arriba.

| Capa | Decisión | Se escribe |
|---|---|---|
| `m` | Los codos se doblan contra la carga; los hombros se mantienen quietos | `m:el.flex` |
| `o` | De pie | `o:standing` |
| `l` | Mancuernas en las manos. Dos es la cantidad habitual con ambos brazos trabajando, así que no hay cantidad | `l:bell.dumb@hands` |
| `x` | Ambos brazos juntos: el predeterminado | — |
| `g` | Palmas hacia arriba es el agarre habitual cuando todas las acciones son `el.flex` | — |

`FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`

Su equipamiento es la [mancuerna](./equipment-key.md#dumbbell), `FXE=1.0S/k:imp/f:bell.dumb`.

### Sentadilla trasera con barra {#barbell-back-squat}

De pie, una barra sobre la parte alta de la espalda, la cadera y las rodillas se doblan y se estiran en una sentadilla completa.

| Capa | Decisión | Se escribe |
|---|---|---|
| `m` | Ponerse de pie extiende la cadera y las rodillas a la vez. Los tobillos no suben a las puntas, así que no se escriben | `m:hip.ext+kn.ext` |
| `o` | De pie | `o:standing` |
| `l` | Una barra sobre la parte alta de la espalda | `l:bar.straight@back` |
| `g` `r` | Base media y recorrido completo: los predeterminados | — |

`FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back`

### Jalón al pecho {#lat-pulldown}

Sentado en una máquina de jalón, agarre prono a la anchura aproximada de los hombros, la barra se tira desde arriba de la cabeza hasta el pecho.

| Capa | Decisión | Se escribe |
|---|---|---|
| `m` | Los codos se doblan y, con agarre prono, los brazos bajan desde arriba de la cabeza por los costados | `m:el.flex+sh.add` |
| `o` | Sentado | `o:seated` |
| `s` | El asiento y el rodillo de muslos de la máquina nunca se escriben | — |
| `l` | Una máquina de jalón, sujeta con las manos | `l:mac@hands` |
| `g` | Prono a anchura media es el agarre habitual para este movimiento | — |

`FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands`

Su equipamiento es la [máquina de jalón al pecho](./equipment-key.md#lat-pulldown-machine), `FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down`.

Un jalón con agarre neutro cerrado baja las manos por delante de la cara, así que cambian tanto la acción del hombro como el agarre:

`FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mac@hands/g:ne+w-n`

### Plancha {#plank}

Boca abajo sobre los antebrazos y las puntas de los pies, el cuerpo recto, mantenida por tiempo.

| Capa | Decisión | Se escribe |
|---|---|---|
| `m` | Una isometría. Los músculos del tronco empujan contra el hundimiento de la cadera, que es la dirección de la flexión del tronco | `m:=sp.flex` |
| `o` | Boca abajo, el tronco horizontal | `o:prone` |
| `s` | El tronco no descansa sobre nada, así que se listan todos los puntos que soportan peso | `s:floor@feet,forearms` |
| `l` | Sin equipamiento | `l:none` |

`FXI=1.0S/m:=sp.flex/o:prone/s:floor@feet,forearms/l:none`

### Zancada caminando {#walking-lunge}

De pie, una mancuerna en cada mano, dando un paso adelante hacia una zancada con una pierna y luego con la otra, avanzando por la sala.

| Capa | Decisión | Se escribe |
|---|---|---|
| `m` | Salir de la zancada extiende la cadera y la rodilla de delante | `m:hip.ext+kn.ext` |
| `o` | De pie | `o:standing` |
| `f` | Cada paso avanza y no vuelve | `f:travel.fwd` |
| `l` | Mancuernas en las manos. El patrón de lados está en las piernas, así que ambas manos siguen cargadas: dos, la cantidad habitual | `l:bell.dumb@hands` |
| `x` | Las piernas se turnan repetición a repetición. El movimiento es solo de piernas, así que no hay alcance | `x:a` |

`FXI=1.0S/m:hip.ext+kn.ext/o:standing/f:travel.fwd/l:bell.dumb@hands/x:a`

### Swing con pesa rusa {#kettlebell-swing}

De pie, una pesa rusa sujeta con ambas manos, balanceada desde entre las piernas hasta la altura del pecho con un golpe de cadera.

| Capa | Decisión | Se escribe |
|---|---|---|
| `m` | La cadera se extiende. Las rodillas mantienen una flexión fija y los brazos solo se balancean, así que ninguno se escribe. La pesa nunca sale de las manos, así que no hay `^` | `m:hip.ext` |
| `o` | El tronco se mueve en la bisagra, así que la repetición empieza `standing`, no `standing.bent` | `o:standing` |
| `l` | Una pesa rusa es una por cada mano que trabaja, como de costumbre; aquí ambas manos comparten una sola pesa | `l:bell.kettle*1@hands` |

`FXI=1.0S/m:hip.ext/o:standing/l:bell.kettle*1@hands`

## Claves en los registros {#keys-in-records}

Un registro de ejercicio lleva su clave en `fxi`. Cada referencia de músculo lleva el `fxm` del músculo y el `fxmg` de su categoría, junto a su `id`, su `name` y su `categoryId`. Cada referencia de equipamiento lleva el mismo valor `fxe` que el [registro del equipamiento](./equipment-key.md#keys-in-records), junto a su `id` y su `name`:

```json fds:ignore exercise record excerpt showing the fxi, fxm, fxmg and fxe fields
{
  "exerciseId": "ex.dumbbellCurl",
  "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands",
  "canonical": { "name": "Dumbbell Curl", "slug": "dumbbell-curl" },
  "targets": {
    "primary": [
      { "id": "mus.bicepsBrachii", "name": "Biceps Brachii", "categoryId": "cat.upperArmFront", "fxm": "FXM=1.0/biceps-brachii", "fxmg": "FXMG=1.0/arm.anterior" }
    ],
    "secondary": [
      { "id": "mus.brachialis", "name": "Brachialis", "categoryId": "cat.upperArmFront", "fxm": "FXM=1.0/brachialis", "fxmg": "FXMG=1.0/arm.anterior" }
    ]
  },
  "equipment": {
    "required": [
      { "id": "eq.dumbbell", "name": "Dumbbell", "fxe": "FXE=1.0S/k:imp/f:bell.dumb" }
    ]
  }
}
```

Un elemento de una sesión de entrenamiento se refiere al ejercicio de la misma manera, con `fxi` junto a su `id` y su `name`:

```json fds:ignore workout item excerpt showing the fxi field
{
  "id": "i1",
  "exercise": {
    "id": "ex.dumbbellCurl",
    "name": "Dumbbell Curl",
    "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands"
  },
  "scheme": { "pattern": "straight", "sets": 3 },
  "reps": { "kind": "fixed", "value": 10 }
}
```

## Comparar dos claves de ejercicio {#comparing-two-exercise-keys}

La comparación va capa por capa. Una capa omitida toma su valor predeterminado, que es un valor; `?` y `*` coinciden con cualquier valor, y un código padre abarca a sus hijos.

- **Igual**: las dos claves se escriben de forma idéntica y no contienen `?` ni `*`.
- **Más específica**: ninguna capa se contradice, y una clave declara algo que la otra deja abierto, o nombra un hijo donde la otra nombra a su padre.
- **Solapamiento**: ninguna capa se contradice, y ninguna clave es más específica. Las dos aún pueden describir lo mismo.
- **Distinta**: al menos una capa no puede coincidir.

| Clave A | Clave B | Resultado |
|---|---|---|
| `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands` | `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands` | Igual |
| `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands` | `FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands` | A es más específica: declara la orientación que B deja abierta |
| `FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands` | `FXI=1.0S/m:el.flex/o:standing/l:?` | Solapamiento: cada clave deja abierto algo que la otra declara |
| `FXI=1.0S/m:el.flex/o:?/l:?` | `FXI=1.0S/m:el.flex/o:?/l:?` | Solapamiento: las claves son idénticas, pero contienen `?` |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none/h:hands.head` | Distinta: la postura sostenida de A es la predeterminada, la de B es con las manos detrás de la cabeza |

Una clave idéntica es una coincidencia fuerte, y cualquier otro resultado da una lista corta para que una persona la confirme. Véase [Usar las claves](../structural-keys.md#using-keys) para saber cómo guardar los enlaces confirmados.

## Encontrar elementos relacionados {#finding-related-items}

Las claves que comparten códigos forman familias, y nadie tiene que declararlas. Al buscar un valor en una capa se encuentran todos los ejercicios que lo comparten, en cualquier catálogo que escriba claves.

| Búsqueda | Encuentra |
|---|---|
| `m` es `hip.ext+kn.ext` | El mismo movimiento: sentadillas, zancadas, subidas al cajón y prensas de piernas, sea cual sea la carga |
| `l` contiene un código `bell.*` | La misma familia de equipamiento: ejercicios cargados con mancuernas, pesas rusas o mancuernas de circo |
| `l` contiene `mac` | Todos los ejercicios hechos en una máquina de fuerza |
| `o` es `hanging` | La misma orientación: dominadas, elevaciones de piernas colgado, suspensiones |
| `m` contiene `sh.ext` | Remos y fondos y, a través de su hijo `sh.ext.oh`, dominadas supinas, pullovers y jalones con agarre cerrado. Un código padre encuentra a sus hijos |
| `l` contiene `erg` | Todos los ejercicios en máquinas de cardio, a través de los hijos `erg.row`, `erg.gait` y los demás |
| `m` contiene `hip.flex` | La categoría `FXMG=1.0/a:hip.flex` y, a través de ella, los músculos que flexionan la cadera: psoas mayor, ilíaco y recto femoral |

`bell.*` significa cualquier código que empiece por `bell.`. Las capas se combinan: `m` es `hip.ext+kn.ext` y `l` contiene `bar.straight@back` encuentra sentadillas traseras y zancadas con una barra sobre la espalda. Las claves de equipamiento forman familias de la misma manera (véase [Encontrar elementos relacionados](./equipment-key.md#finding-related-items) en la página de la clave de equipamiento).

Una búsqueda "es" es la misma operación que comparar para "más específica": se escribe como una clave, con `?` en cada capa que deja abierta. Una búsqueda "contiene" busca un código, o un hijo suyo, en cualquier lugar de la capa, y no es una comparación. Por ejemplo:

`FXI=1.0S/m:hip.ext+kn.ext/o:?/k:?/f:?/s:?/l:?/x:?/g:?/r:?/h:?/p:?`

Todo ejercicio que encuentra la primera búsqueda es más específico que esta clave. La sentadilla trasera con barra y la zancada caminando de arriba lo son.

## Construir claves {#building-keys}

Una clave puede escribirse a mano siguiendo esta página, o generarse con el [FDS Encoder](../../tools/encoder/index.md).
