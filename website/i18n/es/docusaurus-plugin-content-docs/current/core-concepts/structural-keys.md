---
title: Claves estructurales
sidebar_position: 1
---

# Claves estructurales

Una clave estructural es una cadena corta que describe un ejercicio, un equipamiento, un músculo o una categoría muscular por lo que es. Se escribe con códigos que el estándar publica, no con los nombres propios de ningún catálogo. Dos catálogos que llaman al mismo ejercicio por nombres distintos pueden comparar claves y encontrarse.

## El problema de los nombres {#the-problem-with-names}

Hoy los catálogos encuentran los registros de otros catálogos por el nombre, y los nombres viajan mal.

- Un ejercicio tiene muchos nombres. "Dumbbell curl", "standing DB curl" y "bicep curl" son el mismo movimiento, y un gimnasio puede usar además un nombre propio de la casa.
- Los nombres cambian con el idioma. "Curl con mancuerna" es el mismo ejercicio, y un catálogo en inglés no tiene forma de saberlo.
- Un nombre puede significar varias cosas. "Row" puede ser un remo en polea, un remo con barra o una sesión en una máquina de remo.

Emparejar por nombre se reduce a similitud de cadenas, traducción y conjeturas, y cada par de catálogos repite ese trabajo. Cuando alguien se cambia a otra aplicación, su historial de entrenamiento llega atado a nombres que la nueva aplicación quizá no reconozca.

## Qué es una clave estructural {#what-a-structural-key-is}

Una clave describe la cosa en sí. Está hecha de capas, y cada capa registra una dimensión de la cosa con códigos de listas que el estándar publica. Un propietario que describe un curl de pie con mancuerna escribe esta clave, sin importar cómo llame su catálogo al ejercicio:

`FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`

Se lee como flexión de codo, de pie, con una mancuerna en las manos. Un catálogo en español y uno en inglés pueden escribir la misma clave, porque la clave no depende de los nombres de ninguno de los dos.

FDS publica cómo se construyen las claves y las listas de códigos de las que se nutren. No publica claves para ningún ejercicio, músculo o equipamiento, porque FDS es un estándar y no un catálogo. Cada propietario escribe las claves de sus propios registros.

## Qué hacen posible las claves {#what-keys-make-possible}

- **Emparejar entre catálogos.** Se comparan claves en lugar de nombres. Comparar dos claves indica que son iguales, que una es más específica que la otra o que son distintas. Las páginas de cada clave describen los casos más finos.
- **Interoperabilidad.** Dos plataformas pueden enlazar sus catálogos sin acordar antes los nombres ni adoptar una lista compartida.
- **Un historial que sobrevive a un cambio.** Cuando alguien cambia de aplicación, la nueva aplicación puede buscar por clave cada ejercicio registrado en su propio catálogo, de modo que el historial sigue siendo útil.

### Encontrar elementos relacionados {#finding-related-items}

Las claves que comparten códigos forman familias, y no hay que declarar ninguna relación en ningún lugar. Al buscar un código compartido se encuentra la familia entera:

- **El mismo movimiento.** Los ejercicios cuyo movimiento es `hip.ext+kn.ext`, la cadera y las rodillas extendiéndose a la vez, son una familia de sentadillas y zancadas, sin importar cómo los llame cada catálogo.
- **La misma clase de equipamiento.** Los ejercicios cargados con cualquier código `bell.*` son trabajo con mancuerna, pesa rusa y mancuerna de circo.
- **Todas las máquinas de fuerza.** Las claves de equipamiento con `k:mac` son todas las máquinas de fuerza. Una clave de ejercicio nombra una máquina de fuerza como `mac`, así que los ejercicios hechos en ellas se encuentran de la misma manera.
- **Todas las partes de un músculo.** `FXM=1.0/biceps-brachii` y las claves que le añaden una parte, como `FXM=1.0/biceps-brachii.long`, son el músculo y sus cabezas.
- **Los músculos de una categoría.** `FXMG=1.0/hamstring` contiene `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus` y `FXM=1.0/semimembranosus`, y un ejercicio cuyo movimiento es `hip.flex` lleva a `FXMG=1.0/a:hip.flex`, los músculos que flexionan la cadera.

La página de cada clave muestra cómo buscar en sus capas.

## Qué no hacen las claves {#what-keys-dont-do}

- **Una clave no es un identificador.** La identidad de un registro es el `id` de su propietario, como siempre. Dos propietarios que describen el mismo ejercicio no siempre escriben la misma clave: uno puede registrar más detalle, o leer el movimiento de otra manera. Una clave encuentra candidatos. No prueba que dos registros sean el mismo.
- **Una clave no dice nada de la prescripción.** El tempo, la carga, las series y las repeticiones pertenecen a las [primitivas de prescripción](../specifications/rfc-006-prescription-primitives) y a las sesiones de entrenamiento.
- **Una clave no sustituye a los nombres.** Los nombres, los alias y las traducciones se quedan en el registro. La clave va junto a ellos.

Las claves son opcionales. Un registro sin clave sigue siendo FDS válido.

## Las cuatro claves {#the-four-keys}

| Modelo    | Campo | Qué describe                                             | Ejemplo                                    |
|-----------|-------|----------------------------------------------------------|--------------------------------------------|
| Ejercicio | `fxi` | Cómo se mueve el cuerpo, su posición y con qué se mueve   | `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`, un curl de pie con mancuerna |
| Equipamiento | `fxe` | Qué clase de equipamiento es y su forma              | `FXE=1.0S/k:imp/f:bar.ez`, una barra EZ    |
| Músculo   | `fxm` | El músculo y, cuando las tiene, sus partes               | `FXM=1.0/biceps-brachii.long`, la cabeza larga del bíceps braquial |
| Categoría muscular | `fxmg` | Un conjunto de músculos, por anatomía, por acción articular o como unión de estos y de músculos o partes sueltos | `FXMG=1.0/hamstring`, los isquiotibiales |

Los mismos campos aparecen también allí donde un registro se refiere a un ejercicio, un músculo o un equipamiento por id y nombre, de modo que las referencias pueden emparejarse de la misma manera. Una referencia de músculo lleva las dos: el `fxm` del músculo y el `fxmg` de su categoría.

## Usar las claves {#using-keys}

Para enlazar dos catálogos, se comparan las claves de sus registros y se reúnen los candidatos. Una clave idéntica es una coincidencia fuerte. En los demás casos, una persona elige el registro correcto de una lista corta. Cada enlace confirmado se guarda en los datos propios, en `attributes` o `extensions`, para que nadie tenga que volver a buscarlo. Las claves pueden escribirse a mano siguiendo el patrón de composición de cada clave, o generarse con el [FDS Encoder](../tools/encoder/index.md).

## Adónde ir después {#where-to-go-next}

- [Clave de ejercicio](./structural-keys/exercise-key.md): cómo se construye `fxi`, sus dimensiones y sus códigos.
- [Clave de equipamiento](./structural-keys/equipment-key.md): cómo se construye `fxe`.
- [Clave de músculo](./structural-keys/muscle-key.md): cómo se construye `fxm`.
- [Clave de categoría muscular](./structural-keys/muscle-category-key.md): cómo se construye `fxmg`.
- [FDS Encoder](../tools/encoder/index.md): construir, comprobar, comparar y emparejar claves para los registros propios.
