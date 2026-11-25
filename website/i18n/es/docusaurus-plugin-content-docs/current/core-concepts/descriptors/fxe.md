---
title: 'FXE: descriptor de equipamiento'
sidebar_label: 'FXE (equipamiento)'
description: 'Borrador de la sintaxis de FXE, sus tipos, el procedimiento y todos los códigos'
sidebar_position: 4
---

# FXE: descriptor de equipamiento

:::caution Borrador
No es normativo hasta que se acepte el [RFC-010](/docs/specifications/rfc-010-structural-descriptors), que adopta los descriptores estructurales. El RFC-010 es un borrador. Véase [la visión general](./overview.md).
:::

Un FXE describe una pieza de equipamiento por su estructura. Dos piezas de equipamiento son la misma cuando todo ejercicio escrito para una puede hacerse en la otra con los mismos contactos corporales, el mismo movimiento guiado respecto al cuerpo y el mismo tipo de parte móvil, cambiando solo ajustes que el ejercicio registra.

FXE clasifica; no cataloga. No tiene códigos para una marca, un modelo o un producto, y FDS no publica ninguna lista de equipamiento. Las entradas de equipamiento de un proveedor llevan cadenas FXE.

Todos los códigos que puede contener un FXE se enumeran en esta página. Las tablas se generan a partir de [`specification/registries/descriptors/fxe.registry.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/registries/descriptors/fxe.registry.json).

## Principios {#principles}

- **La geometría fija es equipamiento; todo lo que se ajusta en cada uso es ejercicio.** La altura de la polea, el ángulo del banco, el punto de anclaje de la banda, el accesorio de agarre, el agarre, una extremidad o dos y la altura del asiento pertenecen al FXI.
- **Codificar el equipamiento, no el ejercicio que se hace en él.** Una elevación de talones hecha en una prensa de piernas usa una prensa de piernas: se codifica el propio movimiento guiado de la prensa de piernas.
- **Una máquina con nombre prevalece.** Cuando un ejercicio nombra una máquina, esa máquina es el equipamiento, haga lo que haga el ejercicio en ella.
- Cuando una fuente dice solo "máquina", la máquina es la construida para el movimiento principal del ejercicio.

## Sintaxis {#syntax}

```text
FXE=1.0S/k:<kind>/<standard layers>                  standard: the form every exercise record and equipment record writes
FXE=1.0N/k:<kind>/<standard layers>/<extended>       full: an equipment registry record with build details
FXE=1.0S/<configuration>;<configuration>             a combination machine
```

- `1` es la versión mayor, `0` la revisión de sintaxis y `S` o `N` la bandera, como en FXI. `N` significa que se escribe una capa extendida.
- `k` va primero. Las capas **estándar** de un tipo siguen en el orden que da su tabla, y se escriben siempre, con `?` cuando se desconocen. Las capas **extendidas** siguen solo cuando se declaran, y solo en un registro de equipamiento; el `fxe` de un registro de ejercicio es siempre estándar.
- `k:none` no admite ninguna otra capa. `k:?` no admite ninguna otra capa.
- Una máquina combinada une el FXE estándar de cada configuración con `;`, ordenados. Una combinación une configuraciones de máquina o de estación; `k:none` y `k:?` nunca se combinan. Un registro de ejercicio escribe solo la configuración que usa el ejercicio.

**Forma canónica.** El tipo primero; las capas estándar en orden; luego las capas extendidas en el orden `r c g a`, descartando cualquier valor que la forma ya implica (una mancuerna no necesita `r:grav`); los valores unidos con `+`, ordenados; las configuraciones, ordenadas; la bandera en `N` exactamente cuando queda una capa extendida.

<!-- fds:generated fxe#kinds -->
| Código | Significado | Notas |
|---|---|---|
| `none` | Sin equipamiento: el cuerpo es toda la carga. | Sin capas. |
| `imp` | Implemento: un objeto libre que se mueve, se sostiene o se lleva puesto. | Capas estándar `f`. Capas extendidas `r`, `c`. |
| `sup` | Apoyo: una superficie o estructura sobre la que el cuerpo descansa, de la que cuelga o contra la que empuja. No lleva la carga. | Capas estándar `f`. Capas extendidas `c`. |
| `acc` | Accesorio: un maneral, una correa, un cinturón, una colchoneta, una toalla o un marcador. Nunca define el ejercicio. | Capas estándar `f`. |
| `stn` | Estación: una guía o un anclaje con una interfaz general que se usa para muchos movimientos: columna de poleas, máquina Smith, landmine. | Capas estándar `f`. Capas extendidas `r`, `c`, `a`. |
| `mac` | Máquina dedicada: un mecanismo guiado con interfaces corporales fijas, construido para un único movimiento. | Capas estándar `l`, `s`, `m`. Capas extendidas `r`, `c`, `g`, `a`. |
| `erg` | Máquina cíclica: repite ciclos completos (cardio). | Capas estándar `c`, `l`, `s`, `m`. Capas extendidas `r`. |
<!-- /fds:generated -->

## Procedimiento {#procedure}

**Paso 1. El tipo `k`.** Se escribe siempre. Un patrón de carga no es equipamiento: "con lastre" sin ninguna forma nombrada es `FXE=1.0S/k:imp/f:?`. "Asistido" sin implemento, u "otro", es `FXE=1.0S/k:?`.

**Paso 2. `imp`, `sup`, `acc`, `stn`: una capa estándar, la forma `f`.** Se elige el átomo. Una palabra genérica toma el átomo genérico ("banda" es `band`); un hijo se usa solo cuando se nombra (una banda larga de lazo es `band.loop`). Una correa de estiramiento es `FXE=1.0S/k:acc/f:strap.stretch`; el FXI de un estiramiento hecho con ella lleva `a:strap`. Una máquina de remo sentado en polea con su propio asiento, y una máquina de jalón, son máquinas dedicadas (`mac`); cualquier otra cosa en una polea es la estación `FXE=1.0S/k:stn/f:cable`.

**Paso 3. `mac`: tres capas estándar, en el orden `l s m`.**

`m`, el movimiento guiado: lo que guía la parte móvil de la máquina, respecto al tronco.

- Una máquina monoarticular, cuyo pivote se alinea con una articulación, escribe la acción articular: un curl femoral `kn.flex`, una extensión de cuádriceps `kn.ext`, un pec deck `sh.hadd`, una máquina de deltoides posterior `sh.habd`, una máquina de elevaciones laterales `sh.abd`, un pullover `sh.ext`, un encogimiento de hombros `sc.elev`, un aductor `hip.add`, un abductor `hip.abd`, una máquina de extensión de cadera `hip.ext`, un crunch abdominal en máquina `sp.flex`, una extensión de espalda `sp.ext`, una máquina de rotación de torso `sp.rot`, una elevación de talones `ank.pf`.
- Una máquina multiarticular escribe `push.`, `pull.` o `assist.` y una dirección: un press de hombros, una sentadilla hack o una sentadilla con cinturón `push.up`; una máquina de peso muerto `pull.up`; un jalón `pull.down`; un fondo sentado `push.down`; un press de pecho y una prensa de piernas `push.fwd`; un remo `pull.back`; un press inclinado `push.fwdup`; un press declinado `push.fwddown`; un remo alto `pull.backdown`; una dominada o un fondo asistidos `assist.up`.

`l`, la interfaz de carga: donde la parte móvil se encuentra con el cuerpo. Se unen dos con `+` solo cuando ambas mueven la carga. Cuando nada indica lo contrario:

| `m` | `l` predeterminada |
|---|---|
| `kn.flex`, `kn.ext`, `hip.flex` | `ankle` |
| `el.*`, `sc.elev`, `sh.habd`, y todo `push.*` o `pull.*` trabajado con las manos | `hand` |
| `sh.hadd`, `sh.abd`, `sh.flex`, `sh.ext` | `arm` |
| `hip.add`, `hip.abd` | `thigh` |
| `sp.flex`, `sp.rot` | `chest` |
| `sp.ext` | `back` |
| `assist.up` | `knee` (`foot` cuando el usuario está de pie sobre una plataforma) |

Máquinas conocidas: una prensa de piernas es `foot`; una sentadilla hack, péndulo o en V, `shoulder`; una sentadilla con cinturón, `hip`; una elevación de talones, `thigh` sentado, `shoulder` de pie, `hip` con el tronco sobre un acolchado; una patada de glúteo, `foot`; una máquina de hip thrust, `hip` con `supine`; un reverse hyper, `ankle` con `prone`.

`s`, la postura en la que la máquina coloca al usuario. Toda prensa de piernas reclinada es `recline` (una con asiento vertical es `seat`); la sentadilla hack, la péndulo, la sentadilla en V y la sentadilla con cinturón son `stand`; una máquina de remo dedicada es `seat.chest`, salvo un remo sentado en polea con plataforma para los pies, que es `seat`; una máquina de deltoides posterior es `seat.chest`; un remo en barra T con apoyo de pecho es `prone`; una máquina de dominadas o fondos asistidos es `hang`. Cuando nada lo indica: `seat.chest` para `sh.habd`; `seat` para `kn.ext`, `el.*`, los demás `sh.*`, `sp.flex`, `sp.rot`, `hip.add`, `hip.abd`, `hip.flex`, todo `push.*` trabajado con las manos, `pull.down` y `pull.backdown`; `recline` para `push.fwd` con `foot`; `stand` para `push.up` con `shoulder` o `hip`, y para `sc.elev`, `hip.ext` y `pull.up`; en otro caso, `?`.

**Paso 4. `erg`: cuatro capas estándar, en el orden `c l s m`.** Cada tipo de máquina de cardio escribe las cuatro:

<!-- fds:generated fxe#cardioMachineTypes -->
| Tipo | Máquina | `c` | `l` | `s` | `m` | Sujeción en FXI |
|---|---|---|---|---|---|---|
| `treadmill` | Caminadora | `belt` | `foot` | `stand` | `gait` | `@feet` |
| `stepmill` | Stepmill (escalera giratoria) | `belt` | `foot` | `stand` | `step` | `@feet` |
| `stepper` | Escaladora de pedales | `link` | `foot` | `stand` | `step` | `@feet` |
| `stair` | Máquina de escaleras, sin saber si es escaladora de pedales o stepmill | `?` | `foot` | `stand` | `step` | `@feet` |
| `bike-upright` | Bicicleta vertical o de spinning | `loop` | `foot` | `seat` | `cycle` | `@feet` |
| `bike-recumbent` | Bicicleta reclinada | `loop` | `foot` | `recline` | `cycle` | `@feet` |
| `bike` | Bicicleta estática, sin saber si vertical o reclinada | `loop` | `foot` | `?` | `cycle` | `@feet` |
| `air-bike` | Air bike (con brazos móviles) | `loop` | `foot+hand` | `seat` | `cycle` | `@feet` |
| `elliptical` | Elíptica | `loop` | `foot+hand` | `stand` | `glide` | `@feet` |
| `rower` | Máquina de remo | `rail` | `hand` | `seat` | `row` | `@hands` |
| `ski` | Ski erg | `cable` | `hand` | `stand` | `pole` | `@hands` |
| `ube` | Ergómetro de tren superior (manivelas manuales, sentado) | `loop` | `hand` | `seat` | `cycle` | `@hands` |
| `vertical-climber` | Escalador vertical | `line` | `foot+hand` | `stand` | `climb` | `@feet` |
| `ladder-climber` | Escalador de escalera | `belt` | `foot+hand` | `stand` | `climb` | `@feet` |
<!-- /fds:generated -->

Una máquina de cardio de tipo desconocido escribe `?` en cada capa que no puede completar: `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?`.

**Paso 5. Máquinas combinadas** (una multicadera, un pec deck con brazos para deltoides posterior, un jalón con remo bajo): los FXE estándar de las configuraciones, unidos con `;`.

**Paso 6. Capas extendidas**, solo en un registro de equipamiento: `r` accionamiento, `c` restricción o movilidad, `g` ángulo de guía, `a` atributos de diseño. "Palanca" significa `c:arc` con `r:plate`; "trineo" significa `c:line` con `r:plate`.

**Valores genéricos.**

| La fuente dice | FXE |
|---|---|
| una máquina de fuerza, de tipo desconocido | `FXE=1.0S/k:mac/l:?/s:?/m:?` |
| una máquina de cardio, de tipo desconocido | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?` |
| bandas | `FXE=1.0S/k:imp/f:band` |
| peso corporal | `FXE=1.0S/k:none` |
| con lastre, sin forma | `FXE=1.0S/k:imp/f:?` |
| otro; asistido, sin implemento | `FXE=1.0S/k:?` |

## El equipamiento principal de un ejercicio {#the-main-equipment-of-an-exercise}

El `fxe` de un registro de ejercicio es el FXE estándar de su equipamiento principal, que se lee de su FXI en este orden:

1. una máquina o máquina de cardio en `l` (`mach`, `erg` o un hijo `erg.<cycle>`), con las capas propias de la máquina;
2. si no, una estación en `l` (`cable`, `smith`, `landmine`);
3. si no, un implemento de carga en `l`; si hay varios, el primero en la [tabla de tokens de equipamiento](./fxi.md#load-l). Un implemento de tipo desconocido da `FXE=1.0S/k:imp/f:?` cuando no se conoce ningún otro implemento. Un `l:?` completo no es un implemento;
4. si no, el primer apoyo en `s` distinto del suelo, por orden de tokens;
5. si no, `FXE=1.0S/k:none` cuando `l:bw`;
6. si no, `FXE=1.0S/k:?`.

El segundo implemento de un ejercicio con dos implementos se queda en el FXI; nunca da lugar a un segundo FXE. El tipo de una banda (`band.loop`, `band.mini`, `band.tube`) se escribe en el FXE cuando se conoce; el FXI dice solo `band`.

## Comprobaciones entre FXI y FXE {#checks-between-fxi-and-fxe}

El FXI y el FXE de un registro se comprueban entre sí. Un comprobador emite una advertencia cuando falla cualquiera de estas:

1. El FXE del registro no contradice el FXE del token principal del FXI.
2. La postura de una máquina encaja con la orientación inicial del FXI (la tabla de posturas indica cuáles).
3. La interfaz de carga de una máquina encaja con el punto de sujeción de `mach` o `erg` en el FXI (la tabla de interfaces de carga indica cuáles).
4. El movimiento de una máquina monoarticular aparece en el movimiento del FXI, o aparece un hijo suyo (el `sh.ext` de una máquina de pullover y el `sh.ext.oh` de un FXI), salvo que el ejercicio nombre la máquina (una elevación de talones en una prensa de piernas).
5. `k:none` va con `l:bw`.
6. Un token hijo de cardio encaja con el ciclo del FXE: `erg.gait` con `m:gait`, y así sucesivamente.
7. `floor@feet` junto a otro apoyo queda implícito bajo un cuerpo sentado, y bajo un cuerpo boca arriba acostado sobre un apoyo que soporta su tronco.

## Códigos {#codes}

### Formas (`f`) {#forms-f}

<!-- fds:generated fxe#forms -->
**`imp`**

| Forma | Significado | Notas |
|---|---|---|
| `bar.straight` | Barra, olímpica o estándar. | Implica `r:grav`. |
| `bar.ez` | Barra EZ. | Implica `r:grav`. |
| `bar.trap` | Barra hexagonal (trap bar). | Implica `r:grav`. |
| `bar.axle` | Barra gruesa (axle). | Implica `r:grav`. |
| `bar.camber` | Barra curvada (cambered). | Implica `r:grav`. |
| `bell.dumb` | Mancuerna. | Implica `r:grav`. |
| `bell.kettle` | Pesa rusa. | Implica `r:grav`. |
| `bell.circus` | Mancuerna de circo. | Implica `r:grav`. |
| `ball.med` | Balón medicinal. | Implica `r:grav`. |
| `ball.slam` | Slam ball. | Implica `r:grav`. |
| `bag.sand` | Saco de arena. | Implica `r:grav`. |
| `bag.heavy` | Saco de boxeo colgante. | Implica `r:grav`, `c:swing`. |
| `plate` | Un disco sostenido o llevado por sí solo. | Implica `r:grav`. |
| `chain` | Cadena de levantamiento. | Implica `r:grav`. |
| `rope.battle` | Cuerda de batalla. | Implica `r:grav`. |
| `rope.jump` | Cuerda para saltar. | Implica `r:none`. |
| `band` | Banda o tubo elástico, de tipo no declarado. | Implica `r:elastic`. |
| `band.loop` | Banda larga de lazo: superband, power band. | Hija de `band`. Implica `r:elastic`. |
| `band.mini` | Banda corta de lazo que se lleva alrededor de las piernas: miniband. | Hija de `band`. Implica `r:elastic`. |
| `band.tube` | Banda tubular con manerales. | Hija de `band`. Implica `r:elastic`. |
| `sled` | Trineo de arrastre o prowler, empujado o arrastrado. | Implica `r:friction`. |
| `tire` | Neumático grande. | Implica `r:grav`. |
| `hammer` | Mazo. | Implica `r:grav`. |
| `stone` | Piedra Atlas. | Implica `r:grav`. |
| `log` | Tronco de strongman. | Implica `r:grav`. |
| `keg` | Barril. | Implica `r:grav`. |
| `yoke` | Yugo de strongman. | Implica `r:grav`. |
| `frame.carry` | Asas de granjero o estructura de acarreo (rickshaw). | Implica `r:grav`. |
| `car` | Un automóvil, levantado o empujado. | Implica `r:grav`. |
| `wear.vest` | Chaleco lastrado. | Implica `r:grav`. |
| `wear.ankle` | Tobillera lastrada. | Implica `r:grav`. |
| `club` | Clava india o maza. | Implica `r:grav`. |
| `stick` | Bastón, palo de escoba o tubo de PVC. | Implica `r:none`. |
| `wheel` | Rueda abdominal. | Implica `r:none`, `c:roll`. |
| `roller.wrist` | Rodillo de muñeca. | Implica `r:grav`. |
| `harness.head` | Arnés de cabeza con una carga colgante. | Implica `r:grav`. |

**`sup`**

| Forma | Significado | Notas |
|---|---|---|
| `floor` | El suelo, o una colchoneta sobre él. |  |
| `wall` | Una pared. |  |
| `bench` | Un banco, plano o ajustable. |  |
| `box` | Un cajón, escalón o plataforma. |  |
| `chair` | Una silla. |  |
| `block` | Bloques de levantamiento desde los que arranca una barra. |  |
| `rack` | Jaula de potencia o soporte de sentadilla, con sus topes. |  |
| `ball.stab` | Pelota de estabilidad, suiza o de ejercicio. | Implica `c:tilt`. |
| `dome` | BOSU, con cualquiera de sus lados hacia arriba. | Implica `c:tilt`. |
| `board.bal` | Tabla de equilibrio o de balanceo. | Implica `c:tilt`. |
| `roller.foam` | Rodillo de espuma. | Implica `c:roll`. |
| `slider` | Disco deslizante. | Implica `c:slide`. |
| `strap.susp` | Entrenador de suspensión. | Implica `c:swing`. |
| `ring` | Anillas de gimnasia. | Implica `c:swing`. |
| `rope.climb` | Cuerda de trepa. | Implica `c:swing`. |
| `bar.fixed` | Barra fija elevada: barra de dominadas. |  |
| `bar.parallel` | Barras paralelas para fondos. |  |
| `bar.parallette` | Paralelas bajas de suelo (parallettes). |  |
| `pad.preacher` | Banco predicador. |  |
| `pad.hyper` | Banco de extensiones de espalda, de 45° o de 90° (también llamado silla romana para elevaciones de espalda o laterales). |  |
| `pad.ghd` | Glute-ham developer (GHD). |  |
| `station.vkr` | Estación de elevación vertical de rodillas (silla del capitán). |  |
| `pole` | Un poste, pilar o montante de jaula vertical agarrado con las manos. |  |
| `ball.massage` | Pelota de masaje o de lacrosse que se hace rodar bajo el cuerpo. |  |

**`acc`**

| Forma | Significado | Notas |
|---|---|---|
| `handle` | Maneral en D individual. |  |
| `handle.bar` | Barra de polea recta o curvada. |  |
| `handle.v` | Barra en V o maneral de agarre estrecho. |  |
| `handle.rope` | Cuerda de tríceps. |  |
| `strap.ankle` | Tobillera de polea. |  |
| `belt.dip` | Cinturón de fondos. |  |
| `belt.lift` | Cinturón de levantamiento. |  |
| `strap.lift` | Correas de levantamiento. |  |
| `strap.stretch` | Correa de estiramiento: una correa, un cinturón o una banda de lazo que se usa para tirar de una extremidad en un estiramiento. |  |
| `towel` | Una toalla usada como maneral. |  |
| `marker` | Cono, valla o marcador de suelo. |  |
| `board.press` | Tabla colocada sobre el pecho para presses parciales. |  |
| `mat` | Colchoneta. |  |

**`stn`**

| Forma | Significado | Notas |
|---|---|---|
| `cable` | Columna de poleas, cruce de poleas o entrenador funcional: una polea que se ajusta para cada ejercicio. | Implica `r:stack`, `c:cable`. |
| `smith` | Máquina Smith: una barra sobre rieles fijos. | Implica `r:plate`, `c:line`. |
| `landmine` | Landmine: un extremo de una barra en un pivote de suelo (también un remo en barra T en una esquina). | Implica `r:grav`, `c:pivot`. |
<!-- /fds:generated -->

### Interfaces de carga (`l`, para `mac` y `erg`) {#load-interfaces-l-for-mac-and-erg}

<!-- fds:generated fxe#loadInterfaces -->
| Código | Significado | Notas |
|---|---|---|
| `hand` | Manerales o una barra en las manos. | Encaja con `@hands`, `@overhead` de FXI. |
| `foot` | Una plataforma para los pies o pedales. | Encaja con `@feet` de FXI. |
| `ankle` | Un acolchado en la parte inferior de la pierna. | Encaja con `@shins`, `@calves`, `@ankles` de FXI. |
| `thigh` | Un acolchado en el muslo. | Encaja con `@thighs` de FXI. |
| `knee` | Un acolchado o una plataforma a la altura de las rodillas. | Encaja con `@knees` de FXI. |
| `arm` | Un acolchado en la parte superior del brazo o en el codo. | Encaja con `@forearms`, `@elbows`, `@arms` de FXI. |
| `chest` | Un acolchado en el pecho. | Encaja con `@chest` de FXI. |
| `back` | Un acolchado en la espalda. | Encaja con `@back` de FXI. |
| `shoulder` | Acolchados sobre los hombros. | Encaja con `@shoulders` de FXI. |
| `hip` | Un acolchado o un cinturón a la altura de las caderas. | Encaja con `@hips`, `@waist` de FXI. |
| `head` | Un acolchado en la cabeza. | Encaja con `@head` de FXI. |
| `seat` | Un asiento móvil. | Encaja con `@seat` de FXI. |
<!-- /fds:generated -->

### Posturas (`s`, para `mac` y `erg`) {#postures-s-for-mac-and-erg}

<!-- fds:generated fxe#postures -->
| Código | Significado | Notas |
|---|---|---|
| `seat` | Sentado. | Encaja con `seated`, `seated.bent` de FXI. |
| `seat.chest` | Sentado, con el pecho contra un acolchado. | Encaja con `seated`, `seated.bent` de FXI. |
| `stand` | De pie. | Encaja con `standing`, `standing.bent` de FXI. |
| `stand.chest` | De pie o inclinado hacia adelante, con el tronco sobre un acolchado. | Encaja con `standing`, `standing.bent`, `prone.incline` de FXI. |
| `prone` | Acostado boca abajo, plano o inclinado. | Encaja con `prone`, `prone.incline`, `prone.decline` de FXI. |
| `supine` | Acostado boca arriba. | Encaja con `supine`, `supine.incline`, `supine.decline` de FXI. |
| `recline` | Recostado sobre un respaldo inclinado (prensa de piernas). | Encaja con `supine`, `supine.incline`, `seated` de FXI. |
| `kneel` | De rodillas. | Encaja con `kneeling`, `kneeling.half` de FXI. |
| `hang` | Sostenido por las manos o los antebrazos. | Encaja con `hanging` de FXI. |
| `side` | Acostado de lado. | Encaja con `side-lying` de FXI. |
<!-- /fds:generated -->

### Movimiento guiado (`m`, para `mac`) {#guided-motion-m-for-mac}

Un movimiento guiado multiarticular es un verbo, `.` y una dirección: `pull.back`. Un movimiento guiado monoarticular es la acción articular.

<!-- fds:generated fxe#guidedMotionVerbs -->
| Código | Significado |
|---|---|
| `push` | La parte móvil se empuja alejándola. |
| `pull` | La parte móvil se tira hacia el usuario. |
| `assist` | La parte móvil ayuda a levantar el cuerpo. |
<!-- /fds:generated -->

<!-- fds:generated fxe#guidedMotionDirections -->
| Código | Significado |
|---|---|
| `up` | Hacia la cabeza: press de hombros, sentadilla hack, sentadilla con cinturón, máquina de peso muerto. |
| `down` | Hacia los pies: jalón, fondo sentado. |
| `fwd` | Alejándose de la parte delantera del tronco: press de pecho, prensa de piernas. |
| `back` | Hacia la parte delantera del tronco: remo. |
| `fwdup` | Hacia adelante y arriba: press inclinado. |
| `fwddown` | Hacia adelante y abajo: press declinado. |
| `backdown` | Hacia atrás y abajo: remo alto. |
<!-- /fds:generated -->

<!-- fds:generated fxe#singleJointMotions -->
| Código | Significado |
|---|---|
| `kn.flex` | Flexión de rodilla contra resistencia, como en un curl femoral. |
| `kn.ext` | Extensión de rodilla, como al levantarse de una sentadilla. |
| `el.flex` | Flexión de codo, como en un curl. |
| `el.ext` | Extensión de codo, como en un press o una extensión de tríceps. |
| `sh.flex` | Flexión de hombro: el brazo hacia adelante y arriba, como en una elevación frontal o un press por encima de la cabeza. |
| `sh.ext` | Extensión de hombro: el brazo hacia abajo y atrás desde delante, como en un remo o un jalón con brazos rectos. |
| `sh.abd` | Abducción de hombro: el brazo hacia el lado y arriba, como en una elevación lateral. |
| `sh.add` | Aducción de hombro: el brazo hacia abajo, al costado, desde el lado, como en una dominada abierta. |
| `sh.hadd` | Aducción horizontal: el brazo cruza por delante a la altura del pecho, como en un press o una apertura. |
| `sh.habd` | Abducción horizontal: el brazo hacia atrás y afuera a la altura del pecho, como en una apertura invertida. |
| `sh.ir` | Rotación interna de hombro: el antebrazo gira hacia dentro, hacia el abdomen, con el codo flexionado. |
| `sh.er` | Rotación externa de hombro: el antebrazo gira hacia fuera, con el codo flexionado. |
| `sc.elev` | Elevación escapular: encogimiento hacia arriba. |
| `hip.flex` | Flexión de cadera: el muslo hacia el tronco, o el tronco hacia el muslo. |
| `hip.ext` | Extensión de cadera: el muslo se aleja del tronco, como al levantarse de una sentadilla. |
| `hip.abd` | Abducción de cadera: la pierna hacia el lado. |
| `hip.add` | Aducción de cadera: la pierna hacia la otra pierna. |
| `sp.flex` | Flexión del tronco: las costillas hacia la pelvis, como en un crunch. |
| `sp.ext` | Extensión del tronco: enderezar o arquear la espalda desde una posición flexionada. |
| `sp.rot` | Rotación del tronco: los hombros giran respecto a las caderas. |
| `sp.lflex` | Inclinación lateral del tronco. |
| `ank.pf` | Flexión plantar del tobillo: subir sobre las puntas de los pies, impulsarse. |
| `ank.df` | Dorsiflexión del tobillo: los dedos de los pies hacia la espinilla. |
| `nk.flex` | Flexión del cuello: el mentón hacia el pecho. |
| `nk.ext` | Extensión del cuello: la cabeza se inclina hacia atrás. |
| `nk.lflex` | Inclinación lateral del cuello: la oreja hacia el hombro. |
| `wr.flex` | Flexión de muñeca: la palma hacia el antebrazo. |
| `wr.ext` | Extensión de muñeca: el dorso de la mano hacia el antebrazo. |
<!-- /fds:generated -->

### Ciclos (`m`, para `erg`) {#cycles-m-for-erg}

<!-- fds:generated fxe#cycles -->
| Código | Significado |
|---|---|
| `gait` | Caminar o correr sobre una banda. |
| `cycle` | Pedalear (o girar manivelas con las manos). |
| `step` | Subir escalones (escaladora de pedales o stepmill). |
| `row` | Remar. |
| `pole` | Tirón doble con bastones (ski erg). |
| `glide` | Deslizamiento elíptico. |
| `climb` | Trepar con manos y pies. |
<!-- /fds:generated -->

### Recorridos (`c`, estándar para `erg`) {#tracks-c-standard-for-erg}

<!-- fds:generated fxe#tracks -->
| Código | Significado |
|---|---|
| `belt` | Una banda móvil o una escalera giratoria. |
| `link` | Pedales enlazados (escaladora de pedales). |
| `loop` | Un circuito cerrado: manivelas, elíptica. |
| `rail` | Un asiento sobre un riel (máquina de remo). |
| `cable` | Un cable del que se tira desde arriba (ski erg). |
| `line` | Una guía recta (escalador vertical). |
<!-- /fds:generated -->

### Capas extendidas {#extended-layers}

Accionamiento (`r`):

<!-- fds:generated fxe#drives -->
| Código | Significado |
|---|---|
| `grav` | Peso libre bajo la gravedad. |
| `stack` | Torre de placas con selector. |
| `plate` | De carga con discos. |
| `elastic` | Elástico. |
| `air` | Ventilador de aire. |
| `mag` | Freno magnético. |
| `water` | Depósito de agua. |
| `motor` | Motor. |
| `friction` | Fricción. |
| `hydraulic` | Hidráulico. |
| `flywheel` | Volante de inercia (isoinercial). |
| `none` | Sin resistencia propia. |
<!-- /fds:generated -->

Restricción (`c`, para `mac` y `stn`):

<!-- fds:generated fxe#constraints -->
| Código | Significado |
|---|---|
| `line` | Una guía recta (trineo, rieles). |
| `arc` | Una palanca sobre un único pivote. |
| `link` | Un mecanismo articulado de varios pivotes. |
| `cable` | Un cable sobre poleas. |
| `pivot` | Un extremo en un pivote de suelo. |
<!-- /fds:generated -->

Movilidad (`c`, para `imp` y `sup`):

<!-- fds:generated fxe#compliance -->
| Código | Significado |
|---|---|
| `tilt` | Se inclina bajo el cuerpo. |
| `roll` | Rueda. |
| `slide` | Se desliza. |
| `swing` | Cuelga y se balancea. |
<!-- /fds:generated -->

Ángulo de guía (`g`, para `mac`):

<!-- fds:generated fxe#guideAngles -->
| Código | Significado |
|---|---|
| `incl` | Inclinado (prensa de piernas a 45°). |
| `horiz` | Horizontal. |
| `vert` | Vertical. |
<!-- /fds:generated -->

Atributos de diseño (`a`, para `mac` y `stn`):

<!-- fds:generated fxe#designAttributes -->
| Código | Significado |
|---|---|
| `iso` | Brazos independientes (isolateral). |
| `conv` | Trayectoria convergente. |
| `cb` | Contrapesado (Smith). |
| `dual` | Dos torres de placas. |
<!-- /fds:generated -->
