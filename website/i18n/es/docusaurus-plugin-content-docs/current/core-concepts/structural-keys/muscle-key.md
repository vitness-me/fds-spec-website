---
title: Clave de músculo
sidebar_label: Clave de músculo
description: Cómo se compone la clave estructural de músculo (fxm) a partir de la anatomía estándar.
---

# Clave de músculo

La clave de músculo es la clave estructural de un músculo. Va en el campo `fxm` y nombra un músculo o una parte de un músculo, con palabras tomadas de la anatomía estándar. Esta página muestra cómo se arma una clave, de dónde vienen sus códigos y cómo se comparan dos claves.

La clave de músculo es más sencilla que la clave de ejercicio. No tiene capas ni listas de códigos propias. Sus códigos vienen de una referencia anatómica, así que FDS publica la regla para derivarlos. Los códigos derivados hasta ahora, cada uno con su id de FMA, están en [`muscle-key.registry.json`](https://spec.vitness.me/registries/muscle-key.registry.json). Todas las claves de esta página son ilustrativas.

Un conjunto de músculos, como los isquiotibiales o los flexores de cadera, es una categoría muscular y tiene una clave propia: véase la [clave de categoría muscular](./muscle-category-key.md).

Esta página describe la versión 1.0 de la clave de músculo.

## Anatomía de la clave {#anatomy-of-the-key}

La cabeza larga del bíceps braquial tiene esta clave:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXM</span><span className="ka-sym">=</span><span className="ka-code">1.0</span></code>
      <span className="key-anatomy__label">encabezado</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">biceps-brachii</span></code>
      <span className="key-anatomy__label">músculo</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">.</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">long</span></code>
      <span className="key-anatomy__label">parte</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-code">código</span> · <span className="ka-sym">símbolo</span>
  </figcaption>
</figure>

`FXM=1.0/biceps-brachii.long`

| Parte | Texto | Qué dice |
|---|---|---|
| Tipo de clave | `FXM` | Esta es una clave de músculo. |
| Versión | `1.0` | Versión mayor 1, revisión 0. |
| Músculo | `biceps-brachii` | El músculo, por su término anatómico. |
| Parte | `long` | La cabeza larga de ese músculo. |

El encabezado y el cuerpo se separan con `/`. La clave de músculo no tiene indicador `S` ni `N`, porque nada en ella es extendido. Un indicador escrito después de la versión se elimina de la forma escrita, así que `FXM=1.0S/biceps-brachii` se escribe `FXM=1.0/biceps-brachii`.

## Las dos formas {#the-two-forms}

Una clave nombra una de dos cosas.

| Forma | Nombra | Ejemplo |
|---|---|---|
| `FXM=1.0/<muscle>` | Un músculo entero | `FXM=1.0/biceps-brachii`, el bíceps braquial |
| `FXM=1.0/<muscle>.<part>` | Una parte o cabeza de un músculo | `FXM=1.0/deltoid.acromial`, la parte acromial del deltoides, que en el gimnasio se llama deltoides lateral |

Reglas para toda clave:

- Una clave se escribe empezando por `FXM=1.0/`, seguido de exactamente una de las dos formas.
- Todo código va en minúsculas: una letra, y luego letras y dígitos, en palabras unidas por guiones simples.
- Una clave no lleva lado. Izquierda y derecha pertenecen al ejercicio, en su capa de lados `x`. Un registro del bíceps izquierdo y otro del derecho llevan ambos `FXM=1.0/biceps-brachii`.

## El anclaje anatómico {#the-anatomy-anchor}

La anatomía ya tiene nombres estándar. El Foundational Model of Anatomy (FMA) da a cada músculo, y a las partes y cabezas con nombre de los músculos, un término fijo y un identificador. Una clave de músculo se ancla a ese término. Los códigos de esta página se derivan de la versión 5.1.0 de FMA. Un propietario no inventa el código del músculo: busca el músculo en FMA y deriva el código del término que encuentra. Dos propietarios que buscan el mismo músculo obtienen el mismo término, así que escriben el mismo código, sin importar cómo llamen sus catálogos al músculo ni en qué idioma.

Uberon es una segunda referencia anatómica que cubre los mismos músculos con sus propios identificadores. Ayuda a confirmar que se tiene la estructura correcta. A menudo tiene el músculo entero pero no sus cabezas o partes, y el código siempre viene del término de FMA.

Ambas referencias pueden consultarse en el EBI Ontology Lookup Service: [FMA](https://www.ebi.ac.uk/ols4/ontologies/fma) y [Uberon](https://www.ebi.ac.uk/ols4/ontologies/uberon). El [proyecto Uberon](https://obophenotype.github.io/uberon/) tiene su propia documentación. Estos enlaces son una indicación informativa: una clave sigue siendo válida aunque un sitio cambie de dirección.

### Fuentes y licencias {#sources-and-licences}

El registro de músculos, [`muscle-key.registry.json`](https://spec.vitness.me/registries/muscle-key.registry.json), y el registro de categorías, [`muscle-category-key.registry.json`](https://spec.vitness.me/registries/muscle-category-key.registry.json), citan etiquetas e identificadores de dos referencias, sin cambios. Cada registro nombra sus fuentes en `sources` y `attribution`.

| Fuente | Versión | Licencia |
|---|---|---|
| [Foundational Model of Anatomy Ontology (FMA)](http://si.washington.edu/projects/fma), Structural Informatics Group, University of Washington | 5.1.0 | [CC BY 3.0 Unported](https://creativecommons.org/licenses/by/3.0/) |
| [Uberon](http://uberon.org), the Uber-anatomy ontology, OBO Foundry | release 2026-11-05 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |

Los códigos son propios de FDS, escritos a partir de las etiquetas de FMA. Quien vuelva a publicar las etiquetas o los ids de los registros conserva este crédito y el enlace a la licencia.

## El código del músculo {#the-muscle-code}

El código del músculo es el término de FMA, reescrito:

1. Se busca el músculo en FMA y se toma su término preferido, por ejemplo `Latissimus dorsi`.
2. Se toma el término sin su lado. FMA también tiene términos como "Right deltoid", y ese músculo es `deltoid`.
3. Se escribe en minúsculas.
4. Se elimina la palabra "muscle" cuando el término la tiene.
5. Se unen las palabras restantes con guiones simples: `latissimus-dorsi`.

| Término de FMA | Código del músculo |
|---|---|
| Biceps brachii | `biceps-brachii` |
| Latissimus dorsi | `latissimus-dorsi` |
| Pectoralis major | `pectoralis-major` |
| Gluteus maximus | `gluteus-maximus` |
| Semitendinosus | `semitendinosus` |
| Longissimus | `longissimus` |

El nombre cotidiano de un músculo no cambia su código. "Lats" es `latissimus-dorsi`, y también lo es "dorsal ancho" en un catálogo en español.

Un término de FMA para un conjunto de músculos no es un músculo. El Erector spinae muscle group es una categoría, `FXMG=1.0/erector-spinae`, y sus miembros son músculos: `FXM=1.0/iliocostalis`, `FXM=1.0/longissimus` y `FXM=1.0/spinalis`.

## Partes {#parts}

Un código de parte es la palabra que FMA usa para distinguir la parte o cabeza del resto del músculo: la palabra antes de "part of" o "head of" en su término.

| Término de FMA | Clave |
|---|---|
| Long head of biceps brachii | `FXM=1.0/biceps-brachii.long` |
| Short head of biceps brachii | `FXM=1.0/biceps-brachii.short` |
| Acromial part of deltoid | `FXM=1.0/deltoid.acromial` |
| Clavicular part of pectoralis major | `FXM=1.0/pectoralis-major.clavicular` |
| Medial head of gastrocnemius | `FXM=1.0/gastrocnemius.medial` |

Reglas:

- Una parte se escribe después de su músculo, unida por `.`. Una parte nunca va sola, porque `long` es una cabeza del bíceps braquial y también del tríceps braquial.
- Una parte se escribe solo donde se entrena de forma distinta del resto del músculo. La parte superior del pecho es la parte clavicular del pectoral mayor, y merece su propio registro. Un músculo que se entrena como una sola pieza recibe un registro y ninguna parte.
- Las partes de un músculo juntas forman el músculo entero. `FXM=1.0/biceps-brachii` abarca la cabeza larga y la cabeza corta.

## Cuando no existe un término {#when-no-term-exists}

La regla nunca pide adivinar.

- **Una parte sin término toma la estructura más pequeña que la contiene.** FMA nombra la cabeza larga del bíceps braquial, pero no un "bíceps superior" ni un "pecho inferior". Se usa la estructura más pequeña que FMA nombra y que contiene la que se quiere decir. El pecho inferior es `FXM=1.0/pectoralis-major.abdominal`. Un bíceps superior abarca ambas cabezas, así que es `FXM=1.0/biceps-brachii`. Cada clave es verdadera, aunque menos específica. Nunca se usa una estructura más estrecha de lo que la evidencia sostiene.
- **Un conjunto de músculos no es un músculo.** "Isquiotibiales", "core" o "cuerpo completo" abarca varios músculos. Un nombre así es una categoría muscular y lleva una [clave de categoría muscular](./muscle-category-key.md) en `fxmg`, no un `fxm`.
- **Un nombre que no es anatomía no lleva clave.** Una lista de músculos a veces contiene entradas como "cardio", "levantamientos olímpicos" u "otro". Esos registros omiten `fxm`.

Las claves son opcionales, así que un registro sin clave sigue siendo FDS válido.

## Lo que el esquema no puede comprobar {#what-the-schema-cant-check}

El esquema comprueba que una clave esté bien formada: el encabezado, una de las dos formas y códigos en minúsculas unidos por guiones. No puede comprobar que un código de músculo se haya derivado correctamente del término de FMA, ni que un código de parte nombre una parte que FMA tiene.

Ese es el precio de publicar una regla en lugar de una lista. Dos propietarios pueden escribir claves distintas para un músculo y ambas pasan el esquema. Un propietario consulta FMA y escribe `FXM=1.0/deltoid.acromial` para el deltoides lateral. Otro se guía por el nombre del gimnasio y escribe `FXM=1.0/deltoid.lateral`. Ambas claves están bien formadas, la comparación dice que son distintas, y solo una persona que compruebe el término de FMA puede saber cuál sigue la regla. Seguir la derivación es lo que hace que las claves de propietarios distintos coincidan.

## Ejemplos resueltos {#worked-examples}

Cada ejemplo parte de una entrada de catálogo y decide la clave paso a paso.

### Bíceps {#biceps}

Un catálogo lista "Biceps".

| Paso | Decisión |
|---|---|
| Término | El término de FMA es Biceps brachii |
| Código | Minúsculas, guiones: `biceps-brachii` |
| Parte | La entrada se refiere al músculo entero, así que no hay parte |

`FXM=1.0/biceps-brachii`

### Cabeza larga del bíceps {#long-head-of-the-biceps}

Un catálogo lista "Biceps, long head" como entrada propia.

| Paso | Decisión |
|---|---|
| Músculo | Biceps brachii: `biceps-brachii` |
| Parte | El término de FMA es Long head of biceps brachii, así que el código de parte es `long` |

`FXM=1.0/biceps-brachii.long`

### Deltoides lateral {#side-delts}

Un catálogo lista "Side delts".

| Paso | Decisión |
|---|---|
| Término | El lateral del hombro es en FMA la parte acromial del deltoides |
| Músculo | Deltoid: `deltoid` |
| Parte | Acromial part of deltoid: `acromial`, no la palabra de gimnasio "lateral" |

`FXM=1.0/deltoid.acromial`

### Erector de la columna {#erector-spinae}

Un catálogo lista "Erector spinae" y "Longissimus" como dos entradas.

| Paso | Decisión |
|---|---|
| Término | FMA tiene Erector spinae muscle group, un conjunto de músculos, y Longissimus, un músculo |
| Erector spinae | Un conjunto es una categoría: la entrada pasa a ser un registro de categoría con `FXMG=1.0/erector-spinae` en su `fxmg`. Un registro de músculo nunca lleva `fxmg` |
| Longissimus | Un músculo: `longissimus` |

`FXM=1.0/longissimus`

### Dorsales {#lats}

Un catálogo lista "Lats".

| Paso | Decisión |
|---|---|
| Término | El nombre cotidiano corresponde al músculo cuyo término de FMA es Latissimus dorsi |
| Código | `latissimus-dorsi`, nunca `lats` |

`FXM=1.0/latissimus-dorsi`

## Claves en los registros {#keys-in-records}

Un registro de músculo lleva su clave en `fxm`, igual que toda referencia de músculo, como los músculos objetivo de un ejercicio:

```json fds:ignore muscle record excerpt showing the fxm field
{
  "schemaVersion": "1.1.0",
  "id": "mus.bicepsBrachiiLongHead",
  "fxm": "FXM=1.0/biceps-brachii.long",
  "canonical": {
    "name": "Biceps Brachii, Long Head",
    "slug": "biceps-brachii-long-head",
    "aliases": ["Outer Biceps"]
  },
  "classification": {
    "categoryId": "cat.upperArmFront",
    "region": "upper-front",
    "laterality": "bilateral"
  },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "status": "active"
  }
}
```

Los objetivos de un ejercicio, primarios y secundarios, siempre se refieren a músculos individuales, nunca a una categoría. Cada referencia de músculo conserva el `id` y el `name` del músculo, y lleva el `categoryId` de su categoría, la clave del músculo en `fxm` y la clave de la categoría en `fxmg`. Un ejercicio que entrena los isquiotibiales lista los tres músculos isquiotibiales:

```json fds:ignore exercise record excerpt showing the fxi, fxm and fxmg fields
{
  "exerciseId": "ex.romanianDeadlift",
  "fxi": "FXI=1.0S/m:hip.ext/o:standing/l:bar.straight@hands",
  "canonical": { "name": "Romanian Deadlift", "slug": "romanian-deadlift" },
  "targets": {
    "primary": [
      { "id": "mus.bicepsFemoris", "name": "Biceps Femoris", "categoryId": "cat.hamstrings", "fxm": "FXM=1.0/biceps-femoris", "fxmg": "FXMG=1.0/hamstring" },
      { "id": "mus.semitendinosus", "name": "Semitendinosus", "categoryId": "cat.hamstrings", "fxm": "FXM=1.0/semitendinosus", "fxmg": "FXMG=1.0/hamstring" },
      { "id": "mus.semimembranosus", "name": "Semimembranosus", "categoryId": "cat.hamstrings", "fxm": "FXM=1.0/semimembranosus", "fxmg": "FXMG=1.0/hamstring" }
    ],
    "secondary": [
      { "id": "mus.gluteusMaximus", "name": "Gluteus Maximus", "categoryId": "cat.glutes", "fxm": "FXM=1.0/gluteus-maximus", "fxmg": "FXMG=1.0/buttock" }
    ]
  }
}
```

## Comparar dos claves de músculo {#comparing-two-muscle-keys}

La comparación mira los músculos y las partes que abarca cada clave. Una parte se abarca a sí misma, y un músculo abarca todas sus partes.

- **Igual**: las dos claves se escriben de forma idéntica.
- **Más específica**: una clave es una parte del músculo que nombra la otra.
- **Distinta**: las dos claves no abarcan ningún músculo ni parte en común.

| Clave A | Clave B | Resultado |
|---|---|---|
| `FXM=1.0/biceps-brachii` | `FXM=1.0/biceps-brachii` | Igual |
| `FXM=1.0/biceps-brachii.long` | `FXM=1.0/biceps-brachii` | A es más específica: la cabeza larga es una parte del músculo |
| `FXM=1.0/biceps-brachii.long` | `FXM=1.0/biceps-brachii.short` | Distinta: dos cabezas de un músculo |
| `FXM=1.0/biceps-brachii` | `FXM=1.0/brachialis` | Distinta: dos músculos |

Las claves de músculo se comparan solo a partir del texto. Para comparar un músculo con una categoría, véase [Un músculo en una categoría](./muscle-category-key.md#a-muscle-in-a-category).

Las claves iguales son una coincidencia fuerte, y cualquier otro resultado da una lista corta para que una persona la confirme. Véase [Usar las claves](../structural-keys.md#using-keys) para saber cómo guardar los enlaces confirmados.

## Encontrar elementos relacionados {#finding-related-items}

Una clave de músculo lleva a sus partes, a las categorías a las que pertenece y a los ejercicios que lo entrenan. No hay que declarar ningún enlace en ningún lugar.

| Búsqueda | Encuentra |
|---|---|
| `FXM=1.0/deltoid` y `FXM=1.0/deltoid.*` | El deltoides y sus tres partes: `clavicular`, `acromial` y `spinal` |
| `FXM=1.0/biceps-brachii.*` | Las cabezas larga y corta del bíceps braquial |
| Un músculo, `FXM=1.0/rectus-femoris`, en el índice de categorías | Todas las categorías en las que está: `quadriceps-femoris`, `thigh.anterior`, `thigh`, `entire`, `a:hip.flex` y `a:kn.ext` |
| Una parte, `FXM=1.0/deltoid.acromial`, en el índice de categorías | `shoulder.intrinsic`, `entire` y `a:sh.abd`, los motores principales de la abducción del hombro |
| Un movimiento de ejercicio, `m:hip.flex` | `FXMG=1.0/a:hip.flex`, cuyos miembros son `FXM=1.0/psoas-major`, `FXM=1.0/iliacus` y `FXM=1.0/rectus-femoris` |
| Objetivos de ejercicio cuyo `fxm` es `FXM=1.0/gluteus-maximus` | Todos los ejercicios que entrenan el glúteo mayor, en cualquier catálogo |

`deltoid.*` significa cualquier clave que añada una parte a `deltoid`. El índice de categorías lista, para cada músculo y cada parte, todas las categorías cuyos miembros lo contienen. Se construye a partir de los miembros de las categorías, así que el registro del músculo no guarda nada de ello. Véase [Encontrar elementos relacionados](./muscle-category-key.md#finding-related-items) en la página de la clave de categoría muscular. La acción articular de una clave de ejercicio es el código de una categoría de acción, de modo que el movimiento de un ejercicio lleva a los músculos que lo mueven.

## Construir claves {#building-keys}

Una clave puede escribirse a mano siguiendo esta página, o generarse con el [FDS Encoder](../../tools/encoder/index.md).
