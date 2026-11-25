---
title: 'FXM: clave de músculo'
sidebar_label: 'FXM (músculos)'
description: 'Borrador del formato de la clave FXM, su anclaje en ontologías y la semántica de los grupos'
sidebar_position: 5
---

# FXM: clave de músculo

:::caution Borrador
No es normativo hasta que se acepte el [RFC-010](/docs/specifications/rfc-010-structural-descriptors), que adopta los descriptores estructurales. El RFC-010 es un borrador. Véase [la visión general](./overview.md).
:::

Un FXM nombra un músculo, una parte de uno o un grupo de músculos, de modo que dos catálogos que llaman de forma distinta al mismo músculo, en idiomas distintos, puedan saber que se refieren al mismo tejido.

FDS especifica el formato de la clave, cómo se ancla una clave a la anatomía y qué significa un grupo. **No publica una lista de músculos ni de grupos.** Qué músculos nombra un proveedor, qué partes separa y qué grupos define es vocabulario de ese proveedor, publicado junto a su catálogo de músculos. Las reglas siguientes son las que hacen comparables los vocabularios de dos proveedores.

## Formato {#format}

```text
FXM=1.0/<muscle>              a whole anatomical muscle
FXM=1.0/<muscle>.<part>       a part or head of a muscle
FXM=1.0/g:<group>             a group, defined by its members
```

- `1` es la versión mayor y `0` la revisión de sintaxis; ambas se escriben siempre. FXM no tiene capas extendidas, así que su cabecera canónica no lleva bandera `S` ni `N`; una bandera escrita se acepta y se descarta.
- Cada token está en kebab-case en minúsculas: una letra, luego letras y dígitos, en palabras unidas por guiones simples.
- Una clave no lleva lado. La izquierda y la derecha pertenecen al ejercicio (`x` de FXI), no al músculo.

Claves ilustrativas, tomadas del vocabulario de un proveedor y no de este estándar: `FXM=1.0/latissimus-dorsi`, `FXM=1.0/deltoid.acromial`, `FXM=1.0/g:hamstrings`.

## Anclaje {#anchoring}

Cada músculo y cada parte se anclan a una ontología anatómica abierta, de modo que la clave significa una estructura y no una palabra.

1. **FMA es la principal.** Cada músculo y cada parte llevan el término del Foundational Model of Anatomy para esa estructura (`FMA:<id>`, con la etiqueta del término tal como la escribe FMA).
2. **UBERON es la referencia cruzada.** Donde UBERON tiene un término para la misma estructura, también se lleva (`UBERON:<id>`).
3. **Un término ausente es una laguna registrada, nunca una suposición.** Donde una ontología no tiene término para la estructura (UBERON a menudo tiene un músculo completo pero no sus cabezas), la entrada registra esa laguna con palabras, nombrando lo que la ontología tiene en su lugar. Nunca se toma prestado un ancla de una estructura más amplia o más restringida.

**Los tokens siguen al ancla.** Un token de músculo se deriva de la etiqueta preferida de su término FMA: se pasa a minúsculas, se quitan las palabras "muscle group" o, en su defecto, la palabra "muscle", y las palabras restantes se unen con guiones simples (`Latissimus dorsi` es `latissimus-dorsi`, `Erector spinae muscle group` es `erector-spinae`). Un token de parte es el calificador en la etiqueta FMA de la parte o cabeza, la palabra anterior a "part of" o "head of" (`Clavicular part of deltoid` es `clavicular`, `Long head of biceps brachii` es `long`). Por lo tanto, dos proveedores que anclan una estructura al mismo término FMA escriben la misma clave para ella, y un lector puede resolver una clave de músculo o de parte a partir de FMA sin el vocabulario del proveedor. Un token de grupo no se deriva: es propio del proveedor (véase [grupos](#groups-are-member-sets)).

**Las partes existen solo donde se entrenan de forma distinta.** Un músculo con partes es exactamente la unión de sus partes: no hay tejido en el músculo completo que no cubra ninguna parte.

Por lo tanto, cada entrada de vocabulario lleva: su token, un nombre visible, sus anclas (sistema, CURIE, etiqueta) y, donde una ontología no tiene término, la laguna.

## Los grupos son conjuntos de miembros {#groups-are-member-sets}

Un grupo se define por **las claves FXM de sus miembros**, nunca por su nombre. Los miembros pueden ser músculos, partes u otros grupos.

- Un grupo significa el conjunto de hojas anatómicas que cubren sus miembros: una parte es ella misma; un músculo con partes es todas sus partes; un músculo sin partes es él mismo; un grupo es la unión de las hojas de sus miembros.
- Dos claves con las mismas hojas significan el mismo tejido, se llamen como se llamen. Un grupo y un músculo pueden ser idénticos.
- Un grupo tiene al menos un miembro, cada miembro es una clave canónica válida del mismo vocabulario, y ningún grupo se contiene a sí mismo a través de otros grupos.
- Un grupo también puede llevar un ancla de ontología, donde una ontología tiene un término para exactamente ese conjunto.

Dos proveedores pueden nombrar un grupo de forma distinta y aun así coincidir en lo que significa, porque la comparación se hace sobre hojas, no sobre nombres. Una clave `g:` se resuelve solo a través del vocabulario del proveedor que la definió, y una clave no dice qué proveedor es ese.

## Comparación {#compare}

Dos claves FXM se comparan por las hojas anatómicas que cubre cada una:

| Grado | Cuándo |
|---|---|
| `identical` | Las mismas hojas. |
| `contains` | Una cubre todas las hojas de la otra, y más. El grado nombra qué lado es el contenedor. |
| `overlaps` | Se comparten algunas hojas, y ninguna contiene a la otra. |
| `disjoint` | No se comparte ninguna hoja. |

Comparar claves de dos vocabularios requiere ambos vocabularios, ya que las hojas de un grupo provienen de las listas de miembros de su proveedor. Las claves cuyas hojas están ancladas a los mismos términos de ontología describen el mismo tejido entre vocabularios.

## Validación {#validation}

Un FXM es válido cuando su cabecera es `FXM=1.0/`, su cuerpo tiene una de las tres formas anteriores y el vocabulario contra el que se comprueba tiene ese músculo, esa parte de ese músculo o ese grupo. La validación siempre se hace contra un vocabulario con nombre: el formato puede comprobarse por sí solo, la existencia de un token no.

<!-- Open in RFC-010 §12: where a provider publishes its FXM vocabulary, and the entry shape. The reference encoder's `--muscles` input is the working shape. -->
