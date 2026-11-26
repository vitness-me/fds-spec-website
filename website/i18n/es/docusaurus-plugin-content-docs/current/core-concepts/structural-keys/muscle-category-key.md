---
title: Clave de categoría muscular
sidebar_label: Clave de categoría muscular
description: Cómo se compone la clave estructural de categoría muscular (fxmg) a partir de la anatomía estándar y de las acciones articulares.
---

# Clave de categoría muscular

La clave de categoría muscular es la clave estructural de una categoría muscular. Va en el campo `fxmg` y nombra un conjunto de músculos que se entrenan y de los que se habla juntos, como los isquiotibiales, los aductores, los flexores de cadera o la zona lumbar. Esta página muestra cómo se arma una clave, cuáles son sus miembros y cómo se comparan dos claves.

Una categoría se define por sus miembros, y sus miembros son siempre claves de músculo. La [clave de músculo](./muscle-key.md) nombra un músculo o una parte. La clave de categoría nombra un conjunto de ellos. Igual que la clave de músculo, no tiene listas de códigos propias: sus códigos vienen de una referencia anatómica y de las acciones articulares de la [clave de ejercicio](./exercise-key.md). Las categorías derivadas hasta ahora, con sus ids de FMA y de Uberon y sus miembros, están en [`muscle-category-key.registry.json`](https://spec.vitness.me/registries/muscle-category-key.registry.json), y los músculos que contienen, en [`muscle-key.registry.json`](https://spec.vitness.me/registries/muscle-key.registry.json). Todas las claves de esta página son ilustrativas.

Esta página describe la versión 1.0 de la clave de categoría muscular.

## Anatomía de la clave {#anatomy-of-the-key}

Los aductores tienen esta clave:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXMG</span><span className="ka-sym">=</span><span className="ka-code">1.0</span></code>
      <span className="key-anatomy__label">encabezado</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">thigh</span></code>
      <span className="key-anatomy__label">región</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">.</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">medial</span></code>
      <span className="key-anatomy__label">calificador</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-code">código</span> · <span className="ka-sym">símbolo</span>
  </figcaption>
</figure>

`FXMG=1.0/thigh.medial`

| Parte | Texto | Qué dice |
|---|---|---|
| Tipo de clave | `FXMG` | Esta es una clave de categoría muscular. |
| Versión | `1.0` | Versión mayor 1, revisión 0. |
| Región | `thigh` | El muslo, por su término anatómico. |
| Calificador | `medial` | Un compartimento o una capa de la región. Aquí, el compartimento medial del muslo, que contiene los aductores. |

El encabezado y el cuerpo se separan con `/`. La clave no tiene indicador `S` ni `N`, porque nada en ella es extendido. Un indicador escrito después de la versión se elimina de la forma escrita.

## Las cuatro formas {#the-four-forms}

Una clave nombra una de cuatro cosas.

| Forma | Nombra | Ejemplo |
|---|---|---|
| `FXMG=1.0/<set>` | Un conjunto o una región de músculos que nombra la anatomía | `FXMG=1.0/hamstring`, los isquiotibiales |
| `FXMG=1.0/<region>.<qualifier>` | Un compartimento o una capa de una región | `FXMG=1.0/thigh.medial`, los aductores |
| `FXMG=1.0/a:<joint>.<action>` | Los motores principales de una acción articular | `FXMG=1.0/a:hip.flex`, los flexores de cadera |
| `FXMG=1.0/<term>+<term>` | Todo lo que abarcan sus términos. Un término es una categoría, un músculo o una parte, y una unión puede tener un solo término | `FXMG=1.0/erector-spinae+quadratus-lumborum`, la zona lumbar; `FXMG=1.0/deltoid`, un músculo; `FXMG=1.0/trapezius.ascending`, una parte |

Reglas para toda clave:

- Una clave se escribe empezando por `FXMG=1.0/`, seguido de exactamente una de las cuatro formas.
- Todo código va en minúsculas: una letra, y luego letras y dígitos, en palabras unidas por guiones simples.
- Una clave no lleva lado, por la misma razón por la que no lo lleva una clave de músculo.
- Los miembros son siempre claves de músculo. Una categoría nunca inventa un código para un músculo.

## El anclaje anatómico {#the-anatomy-anchor}

Los códigos de categoría vienen de la misma referencia que los códigos de músculo: el Foundational Model of Anatomy (FMA), versión 5.1.0. FMA nombra conjuntos de músculos además de músculos sueltos, como "Set of hamstring muscles" y "Musculature of medial compartment of thigh", y lista sus miembros. Uberon ayuda a confirmar que se tiene la estructura correcta, y el código siempre viene del término de FMA. Véase [el anclaje anatómico](./muscle-key.md#the-anatomy-anchor) en la página de la clave de músculo.

Uberon tiene menos conjuntos que FMA. Tiene el cuádriceps femoral, el tríceps sural y el erector de la columna, pero ningún término para la mayoría de los compartimentos, para la musculatura glútea ni para los músculos del manguito rotador. Su "rotator cuff" es el manguito de tendones alrededor de la articulación del hombro, no el conjunto de cuatro músculos, así que no debe usarse para confirmar `rotator-cuff`.

Las palabras de la anatomía no son palabras de gimnasio, así que la categoría se busca en FMA en lugar de escribir la palabra de gimnasio:

| Palabra de gimnasio | Término de FMA | Código |
|---|---|---|
| Glúteos | Musculature of buttock | `buttock` |
| Pantorrillas | Triceps surae | `triceps-surae` |
| Pecho | Pectoral musculature | `pectoral` |
| Espinillas | Musculature of anterior compartment of leg | `leg.anterior` |

En FMA, "arm" es solo el brazo y "leg" es solo la pierna por debajo de la rodilla. Uberon usa ambas palabras para segmentos más largos, lo que es una razón más para que el código venga de FMA.

Algunas palabras de gimnasio tienen un término de FMA que no encaja. Los conjuntos de FMA para la espalda, el miembro inferior y el cuello alcanzan músculos que una categoría de gimnasio no incluye, así que la espalda, las piernas y el cuello de un gimnasio son uniones, no códigos de FMA. Véase [Cuando no existe un término](#when-no-term-exists).

El registro de categorías cita etiquetas e ids de FMA y de Uberon bajo sus licencias CC BY: [Fuentes y licencias](./muscle-key.md#sources-and-licences), en la página de la clave de músculo, da cada fuente, su versión y su licencia.

## El código de la categoría {#the-category-code}

Un código de categoría es el término de FMA del conjunto, reescrito con la regla de la clave de músculo:

1. Se busca el conjunto en FMA: un "Set of …", un "Musculature of …", o un grupo como Quadriceps femoris. Se toma su término sin su lado.
2. Se eliminan "Set of", "Musculature of" y "musculature", y las palabras "muscle", "muscles" y "muscle group".
3. Cuando lo que queda se lee `<qualifier> compartment of <region>` o `<qualifier> of <region>`, se escribe `<region>.<qualifier>`. Los calificadores van de la región hacia fuera: "superficial muscles of posterior compartment of forearm" es `forearm.posterior.superficial`.
4. Se escribe en minúsculas, con las palabras unidas por guiones simples.

| Término de FMA | Clave |
|---|---|
| Set of hamstring muscles (FMA:81022) | `FXMG=1.0/hamstring` |
| Quadriceps femoris (FMA:22428) | `FXMG=1.0/quadriceps-femoris` |
| Triceps surae (FMA:51062) | `FXMG=1.0/triceps-surae` |
| Set of rotator cuff muscles (FMA:82650) | `FXMG=1.0/rotator-cuff` |
| Musculature of buttock (FMA:50230) | `FXMG=1.0/buttock` |
| Musculature of thigh (FMA:50208) | `FXMG=1.0/thigh` |
| Musculature of medial compartment of thigh (FMA:74149) | `FXMG=1.0/thigh.medial` |
| Set of intrinsic muscles of shoulder (FMA:33522) | `FXMG=1.0/shoulder.intrinsic` |
| Pectoral musculature (FMA:50223) | `FXMG=1.0/pectoral` |
| Musculature of anterior abdominal wall (FMA:78435) | `FXMG=1.0/anterior-abdominal-wall` |
| Set of superficial muscles of posterior compartment of forearm (FMA:39104) | `FXMG=1.0/forearm.posterior.superficial` |

El `.` significa lo mismo en ambas claves: la parte con nombre de lo que va delante. En una clave de músculo es una parte de un músculo, como en `deltoid.acromial`. En una clave de categoría es un compartimento o una capa de una región, como en `thigh.medial`. El primer código indica cuál de los dos: `deltoid` es un músculo y `thigh` es una región.

## Miembros {#members}

Cada código tiene un conjunto de miembros, y la comparación trabaja sobre ellos. Los miembros de un código anatómico los fija la referencia anatómica, y los miembros de una categoría de acción son los motores principales que FDS publica para ella en el registro de categorías, así que todos los propietarios obtienen la misma lista.

- **Un conjunto o un compartimento** tiene los músculos que FMA lista para su término, escritos como claves de músculo sin el lado. `FXMG=1.0/hamstring` tiene `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus` y `FXM=1.0/semimembranosus`.
- **Un conjunto puede contener conjuntos.** El muslo contiene el cuádriceps femoral, que contiene cuatro músculos. Se siguen los miembros hacia abajo hasta llegar a claves de músculo.
- **Un conjunto para el que FMA no lista miembros** los toma de Uberon. FMA no lista ninguno para el erector de la columna, así que sus miembros son los tres músculos que Uberon lista como sus partes. La musculatura completa, `FXMG=1.0/entire`, contiene todos los músculos.
- **Una acción** tiene los motores principales de esa acción articular, tal como los lista [`muscle-category-key.registry.json`](https://spec.vitness.me/registries/muscle-category-key.registry.json). `FXMG=1.0/a:hip.flex` tiene `FXM=1.0/psoas-major`, `FXM=1.0/iliacus` y `FXM=1.0/rectus-femoris`. El sartorio y el tensor de la fascia lata ayudan a flexionar la cadera, pero no son motores principales, así que no son miembros. Hay 40 categorías de acción, una por cada acción articular de la clave de ejercicio excepto la eversión del tobillo, `ank.ev`, y la circunducción; por eso `FXMG=1.0/a:ank.ev` no es una clave.
- **Una unión** tiene todo lo que abarcan sus términos. Un término es un código de categoría o el código de una clave de músculo, con o sin parte.

Un propietario que se refiere a algo distinto del conjunto de FMA, o que entiende de otro modo los motores principales de una acción, escribe una unión. Nunca reutiliza el código con su propia lista de miembros. Un propietario cuyos flexores de cadera incluyen el sartorio y el tensor de la fascia lata escribe `FXMG=1.0/a:hip.flex+sartorius+tensor-fasciae-latae`.

Dos términos de FMA pueden tener los mismos miembros. `FXMG=1.0/hamstring` y `FXMG=1.0/thigh.posterior` (Musculature of posterior compartment of thigh, FMA:51036) contienen ambos los tres isquiotibiales. Las dos claves son válidas, y se comparan como iguales.

### Escribir una unión {#writing-a-union}

Una unión se escribe de una sola manera, para que dos propietarios que se refieren a los mismos músculos escriban el mismo texto:

- Sus términos se ordenan alfabéticamente, y cada uno aparece una vez.
- Un término que otro término de la clave ya abarca se elimina. `thigh+hamstring` se escribe `thigh`.
- De dos términos que abarcan los mismos músculos, se queda el que va primero en el orden. `thigh.posterior+hamstring` se escribe `hamstring`.
- Una unión de un solo término se escribe como ese término. Unos "hombros" de gimnasio que se refieren solo al deltoides son `FXMG=1.0/deltoid`.

Como una unión mezcla códigos de categoría y códigos de músculo, ningún código es nunca ambas cosas.

### Erector de la columna {#erector-spinae}

FMA clasifica el erector de la columna como un conjunto de músculos, el Erector spinae muscle group (FMA:71302), así que es una categoría: `FXMG=1.0/erector-spinae`. Sus tres miembros son músculos con claves propias: `FXM=1.0/iliocostalis` (FMA:77177), `FXM=1.0/longissimus` (FMA:77178) y `FXM=1.0/spinalis` (FMA:77179). FMA no lista miembros para el grupo, así que vienen de Uberon, que lista estos tres como sus partes.

## Cuando no existe un término {#when-no-term-exists}

- **Una categoría que FMA no nombra, y que no es una sola acción articular, es una unión.** La "espalda media" es `FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse`. El "core" no tiene un significado acordado, así que cada propietario escribe la unión a la que se refiere, por ejemplo `FXMG=1.0/anterior-abdominal-wall+erector-spinae+quadratus-lumborum`.
- **Una categoría cuyo conjunto de FMA llega demasiado lejos también es una unión.** Los conjuntos de FMA para la espalda, el miembro inferior y el cuello contienen músculos a los que un gimnasio no se refiere con esas palabras, como los músculos pequeños del pie en el miembro inferior. Se escriben los músculos a los que se refiere la categoría:

  | Palabra de gimnasio | Clave |
  |---|---|
  | Espalda | `FXMG=1.0/deltoid.spinal+erector-spinae+latissimus-dorsi+quadratus-lumborum+rhomboid-major+rhomboid-minor+trapezius` |
  | Piernas | `FXMG=1.0/a:hip.flex+buttock+hamstring+quadriceps-femoris+sartorius+tensor-fasciae-latae+thigh.medial+tibialis-anterior+triceps-surae` |
  | Cuello | `FXMG=1.0/semispinalis-capitis+splenius-capitis+sternocleidomastoid` |

- **Un nombre que no es anatomía no lleva clave.** Una lista de categorías a veces contiene entradas como "cardio" u "otro". Esos registros omiten `fxmg`.

Las claves son opcionales, así que un registro sin clave sigue siendo FDS válido.

## Lo que el esquema no puede comprobar {#what-the-schema-cant-check}

El esquema solo comprueba el encabezado, `FXMG=1.0/`. El Encoder comprueba el resto de la clave: una de las cuatro formas y códigos en minúsculas. El esquema no puede comprobar que un código se haya derivado correctamente de un término de FMA, ni cuáles son los miembros de un código.

Los miembros de un conjunto o de un compartimento vienen de FMA, así que todo propietario que sigue la regla obtiene la misma lista. Los miembros de una acción no vienen de la anatomía: son un criterio sobre qué músculos hacen la mayor parte del trabajo, y dos propietarios pueden juzgarlos de forma distinta. El código es compartido, y un desacuerdo aparece como un solapamiento al comparar las claves.

## Ejemplos resueltos {#worked-examples}

Cada ejemplo parte de una entrada de catálogo y decide la clave paso a paso.

### Isquiotibiales {#hamstrings}

| Paso | Decisión |
|---|---|
| Término | FMA tiene Set of hamstring muscles (FMA:81022) |
| Código | Se eliminan "Set of" y "muscles": `hamstring` |
| Miembros | `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus`, `FXM=1.0/semimembranosus` |

`FXMG=1.0/hamstring`

### Aductores {#adductors}

| Paso | Decisión |
|---|---|
| Término | FMA tiene Musculature of medial compartment of thigh (FMA:74149) |
| Código | "medial compartment of thigh" es un compartimento: `thigh.medial` |
| Miembros | Pectíneo, aductor largo, aductor corto, aductor mayor, aductor mínimo y grácil, cada uno como su clave de músculo |

`FXMG=1.0/thigh.medial`

### Glúteos {#glutes}

| Paso | Decisión |
|---|---|
| Término | FMA tiene Musculature of buttock (FMA:50230) |
| Código | `buttock`, nunca `glutes` |
| Miembros | `FXM=1.0/gluteus-maximus`, `FXM=1.0/gluteus-medius`, `FXM=1.0/gluteus-minimus` |

`FXMG=1.0/buttock`

### Flexores de cadera {#hip-flexors}

| Paso | Decisión |
|---|---|
| Término | FMA no tiene un conjunto para los flexores de cadera. Vienen del abdomen, la pelvis y el muslo |
| Código | Los músculos que flexionan la cadera: la acción articular `hip.flex` de la clave de ejercicio, escrita `a:hip.flex` |
| Miembros | Los motores principales: `FXM=1.0/psoas-major`, `FXM=1.0/iliacus`, `FXM=1.0/rectus-femoris` |

`FXMG=1.0/a:hip.flex`

### Zona lumbar {#lower-back}

| Paso | Decisión |
|---|---|
| Término | FMA no tiene un conjunto que corresponda al significado del gimnasio |
| Términos | El erector de la columna, una categoría, y el cuadrado lumbar, un músculo |
| Orden | Ordenados: `erector-spinae` y luego `quadratus-lumborum` |

`FXMG=1.0/erector-spinae+quadratus-lumborum`

## Claves en los registros {#keys-in-records}

Un registro de categoría muscular lleva su clave en `fxmg`. Un grupo como "Isquiotibiales" es un registro de categoría, no un registro de músculo:

```json fds:ignore muscle category record excerpt showing the fxmg field
{
  "schemaVersion": "1.1.0",
  "id": "cat.hamstrings",
  "fxmg": "FXMG=1.0/hamstring",
  "canonical": {
    "name": "Hamstrings",
    "slug": "hamstrings"
  },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "status": "active"
  }
}
```

Los objetivos de un ejercicio, primarios y secundarios, siempre se refieren a músculos individuales, nunca a una categoría. Cada referencia de músculo conserva el `id` y el `name` del músculo, y lleva el `categoryId` de su categoría, la clave del músculo en `fxm` y la clave de la categoría en `fxmg`. Un ejercicio que entrena los isquiotibiales lista los tres músculos isquiotibiales:

```json fds:ignore exercise record excerpt showing the fxm and fxmg fields
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

Un registro de músculo conserva su único `classification.categoryId`. Esa es la única categoría bajo la que el propietario muestra el músculo, y su `fxmg` es el que lleva una referencia. Toda otra categoría a la que pertenece un músculo se deduce de las claves y nunca se guarda: el recto femoral está tanto en el cuádriceps como en los flexores de cadera, y una referencia a él lleva solo la categoría que eligió su propietario.

## Comparar dos claves de categoría {#comparing-two-category-keys}

La comparación mira los músculos y las partes que abarca cada clave una vez que sus miembros se siguen hasta llegar a claves de músculo.

- **Igual**: las dos claves abarcan los mismos músculos y partes.
- **Más específica**: una clave abarca parte de lo que abarca la otra, y nada fuera de ello.
- **Solapamiento**: comparten algunos músculos, y cada una abarca uno que la otra no.
- **Distinta**: las dos claves no abarcan ningún músculo ni parte en común.

| Clave A | Clave B | Resultado |
|---|---|---|
| `FXMG=1.0/hamstring` | `FXMG=1.0/hamstring` | Igual |
| `FXMG=1.0/hamstring` | `FXMG=1.0/thigh.posterior` | Igual: dos términos de FMA con los mismos tres miembros |
| `FXMG=1.0/thigh.medial` | `FXMG=1.0/thigh` | A es más específica: un compartimento de B |
| `FXMG=1.0/external-oblique+internal-oblique` | `FXMG=1.0/anterior-abdominal-wall` | A es más específica |
| `FXMG=1.0/triceps-surae` | `FXMG=1.0/pectoral` | Distinta |
| `FXMG=1.0/quadriceps-femoris` | `FXMG=1.0/a:hip.flex` | Solapamiento: ambas contienen el recto femoral |

Tres comparaciones funcionan solo a partir del texto: las claves idénticas son iguales, un compartimento o una capa es más específico que su región, y una unión es más específica que una unión que contiene todos sus términos y más. Todo lo demás necesita los miembros de cada código.

### Un músculo en una categoría {#a-muscle-in-a-category}

Una clave de músculo y una clave de categoría se comparan con sus propias palabras:

- **Dentro**: todo lo que abarca la clave de músculo está en la categoría. `FXM=1.0/semitendinosus` está dentro de `FXMG=1.0/hamstring`.
- **Parcialmente dentro**: una parte lo está. `FXM=1.0/trapezius` está parcialmente dentro de la espalda media, `FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse`, que contiene solo dos partes del trapecio.
- **Fuera**: nada lo está.

Un músculo puede estar en varias categorías. `FXM=1.0/rectus-femoris` está dentro de `FXMG=1.0/quadriceps-femoris` y dentro de `FXMG=1.0/a:hip.flex`.

## Encontrar elementos relacionados {#finding-related-items}

Las categorías se definen por sus miembros, así que se encuentran entre sí, encuentran sus músculos y los ejercicios que los entrenan sin que haya que declarar ningún enlace.

| Búsqueda | Encuentra |
|---|---|
| Un músculo, `FXM=1.0/biceps-femoris` | Todas las categorías en las que está: `hamstring`, `thigh.posterior`, `thigh`, `entire`, `a:hip.ext` y `a:kn.flex` |
| Una categoría, `FXMG=1.0/hamstring` | Sus músculos: `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus` y `FXM=1.0/semimembranosus` |
| Una categoría que contiene solo algunas partes de un músculo, la espalda media | Esas partes: `FXM=1.0/trapezius.ascending` y `FXM=1.0/trapezius.transverse`, junto a los dos romboides |
| Una región, `thigh` y `thigh.*` | El muslo y sus compartimentos, igual que `biceps-brachii.*` encuentra las cabezas de un músculo |
| Un movimiento de ejercicio, `m:hip.ext+kn.ext` | `FXMG=1.0/a:hip.ext` y `FXMG=1.0/a:kn.ext` y, a través de ellas, el glúteo mayor, los isquiotibiales y el cuádriceps |
| Ejercicios cuyo `fxm` objetivo está dentro de `FXMG=1.0/hamstring` | Todos los ejercicios que entrenan los isquiotibiales, sea cual sea la categoría bajo la que los archive cada catálogo |

La acción articular de una clave de ejercicio y la acción de una categoría son el mismo código, así que un ejercicio lleva directamente a los músculos que entrena, igual que su código de carga lleva a su clave de equipamiento.

Para emparejar las categorías de dos catálogos, se comparan sus claves. La "Zona lumbar" de un catálogo es `FXMG=1.0/erector-spinae+quadratus-lumborum` y el "Erector de la columna" de otro es `FXMG=1.0/erector-spinae`. La segunda clave es más específica: la primera también contiene el cuadrado lumbar.

Para agrupar los músculos de un catálogo bajo sus propias categorías, se sitúa cada clave de músculo en cada clave de categoría. `FXM=1.0/longissimus` está dentro de `FXMG=1.0/erector-spinae`, y `FXM=1.0/trapezius` está parcialmente dentro de la espalda media.

## Construir claves {#building-keys}

Una clave puede escribirse a mano siguiendo esta página, o generarse con el [FDS Encoder](../../tools/encoder/index.md).
