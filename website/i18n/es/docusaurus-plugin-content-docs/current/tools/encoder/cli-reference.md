---
title: Referencia de la CLI
description: Todos los comandos y opciones del FDS Encoder, con entradas y salidas reales
sidebar_position: 3
---

# Referencia de la CLI

Todos los comandos y opciones del comando `fds-encoder`. Las salidas de esta página son lo que imprime el comando. Escriba cada clave entre comillas simples: `*` y `?` significan algo para su shell.

## Sinopsis {#synopsis}

```bash
fds-encoder <command> [arguments] [flags]
```

```text
fds-encoder 0.1.0: structural keys of the Fitness Data Standard

  fds-encoder check <key>...                     check keys and print each in its written form
  fds-encoder check --records <file.json> [--write <out.json>]
                                                 check every key in FDS records; --write saves them in written form
  fds-encoder compare <a> <b>                    compare two keys, or place a muscle key in a category key
  fds-encoder build <answers.json>               build keys from answers: [{ "id", "answers": { question: option } }]
  fds-encoder ask [rows.json] [--out <answers.json>]
                                                 answer the questions in the terminal and build the keys
  fds-encoder questions [--json | --text]        print the question flow
  fds-encoder match <records.json> --library <records.json> [--top <n>]
                                                 suggest library records for each record, by key
  fds-encoder --version | --help
```

Ejecutarlo sin comando imprime este texto y sale con 1. `--help`, `-h` y `help` lo imprimen y salen con 0.

## Comandos {#commands}

### `check` {#check}

Comprueba cada clave y la imprime en su forma escrita estándar.

```bash
fds-encoder check <key>...
```

Una clave que pasa la comprobación imprime `ok` y su forma escrita. Una que no la pasa imprime `bad`, la clave tal como se dio y cada razón en su propia línea. La forma escrita pone las capas en el orden estándar, elimina una capa en su valor predeterminado y ordena los códigos donde el orden no tiene significado.

```bash
fds-encoder check 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands' 'FXMG=1.0/thigh.posterior+hamstring' 'FXE=1.0S/k:robot'
```

```text
ok   FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands
ok   FXMG=1.0/hamstring
bad  FXE=1.0S/k:robot
     "robot" is not an FXE kind.
```

La segunda clave se escribe más corta: `thigh.posterior` y `hamstring` contienen los mismos tres músculos, y de dos términos que abarcan los mismos músculos se queda el que va primero en el orden. El comando sale con 1 porque una clave no pasa la comprobación.

### `check --records` {#check---records}

Comprueba todos los campos de clave de un registro FDS o de una lista de ellos.

```bash
fds-encoder check --records <file.json> [--write <out.json>]
```

| Opción | Descripción |
|------|-------------|
| `--records <file.json>` | Un archivo que contiene un registro FDS, o una lista de registros |
| `--write <out.json>` | Guarda los registros con cada clave que pasa la comprobación en su forma escrita. Solo cambian esas cadenas de clave: los números, los espacios y todos los demás valores quedan exactamente como los escribió el archivo de entrada. El archivo se escribe entero, a través de un archivo temporal que se renombra en su lugar |

El comando lee el campo de clave propio de cada registro y los campos de clave de las referencias que contiene: `fxi` en una referencia de ejercicio, `fxe` en una referencia de equipamiento como `equipment.required[0].fxe`, y `fxm` y `fxmg` en una referencia de músculo como `targets.primary[0].fxm`. Un campo con uno de esos nombres en cualquier otro lugar, por ejemplo bajo `metadata`, `attributes` o `extensions`, no es una clave y se deja como está. Para cada registro informa:

- **forma escrita**: una clave que pasa la comprobación pero no está en su forma escrita, con la forma escrita debajo.
- **aviso**: dos claves que pasan la comprobación pero no coinciden. Una clave de ejercicio se comprueba contra la clave de su equipamiento principal en `equipment.required`. Se comprueba que el `fxm` de una referencia de músculo esté dentro de su `fxmg`.
- **problema**: una clave que no pasa la comprobación, o un campo que contiene un tipo de clave equivocado.

```bash
fds-encoder check --records catalog.json --write checked.json
```

```text
record 0 fxi: written form
  FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands
  FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands
record 1 equipment.required[0].fxe: warning: The exercise's main equipment ("bar.straight", FXE=1.0S/k:imp/f:bar.straight) contradicts the equipment key.
record 1 targets.primary[0].fxmg: warning: FXM=1.0/biceps-femoris is not in its category FXMG=1.0/quadriceps-femoris.
record 2 fxi: "el.flexx" is not a joint action.
3 records, 1 with problems
```

El comando sale con 1 cuando un registro tiene un problema. Los avisos por sí solos no cambian el código de salida. El [ejemplo 2](./examples.md#example-2-check-a-catalog-files-keys) muestra el archivo detrás de esta salida.

### `compare` {#compare}

Compara dos claves de un mismo tipo, o sitúa una clave de músculo en una clave de categoría.

```bash
fds-encoder compare <a> <b>
```

Dos claves de un mismo tipo dan uno de cuatro resultados:

| Resultado | Significado |
|--------|---------|
| `same` | La misma forma escrita, sin nada en `?` |
| `more-specific` | Una describe parte de lo que describe la otra, y nada fuera de ello. La salida dice cuál, `A` o `B` |
| `overlap` | Ninguna es más específica, y pueden describir lo mismo |
| `different` | No pueden describir lo mismo |

Las claves de ejercicio y de equipamiento también imprimen la relación de cada capa:

- `equal`: A y B dicen lo mismo.
- `narrower`: A dice más que B.
- `broader`: A dice menos que B.
- `open`: ambas la dejan en `?`.
- `contradicts`: A y B no pueden ser ciertas a la vez.

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands'
```

```text
more-specific: A is more specific  {"m":"equal","o":"narrower","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

Las claves de músculo y de categoría imprimen los músculos y las partes que abarcan ambas:

```bash
fds-encoder compare 'FXMG=1.0/erector-spinae+quadratus-lumborum' 'FXMG=1.0/erector-spinae'
```

```text
more-specific: B is more specific  {"shared":["iliocostalis","longissimus","spinalis"]}
```

Una clave de músculo y una clave de categoría, en cualquier orden, dan `in`, `partly-in` o `not-in`:

```bash
fds-encoder compare 'FXM=1.0/trapezius' 'FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse'
```

```text
partly-in  {"shared":["trapezius.ascending","trapezius.transverse"]}
```

Dos claves de tipos distintos, o una clave que no pasa la comprobación, imprimen la razón y salen con 1:

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:none' 'FXE=1.0S/k:none'
```

```text
A FXI key and a FXE key do not compare.
```

### `questions` {#questions}

Imprime el flujo de preguntas que construye las claves de ejercicio y de equipamiento.

```bash
fds-encoder questions [--json | --text]
```

| Opción | Descripción |
|------|-------------|
| `--text` | Solo las preguntas, como texto |
| `--json` | Solo el flujo, como JSON, para un programa o un formulario propio |

Sin opción, el comando imprime el texto, luego una línea `──────── JSON ────────` y luego el JSON. Cada pregunta tiene un id, la capa que rellena, la condición bajo la que se pregunta, un texto de ayuda, su respuesta habitual y sus opciones. La salida de texto empieza así:

```bash
fds-encoder questions --text
```

```text
Questions for FXI=1.0 / FXE=1.0. 201 questions; each is asked only when its condition holds.

1. [subject] Are you describing an exercise, or a piece of equipment on its own?
   fills: FXI or FXE; pick one
   help: An exercise gets an exercise key and the equipment key of its main equipment. Equipment on its own gets its equipment key.
   usual: An exercise.
     - usual: An exercise (the usual case)
     - equipment: A piece of equipment on its own
```

Las respuestas de un archivo de respuestas son ids de pregunta e ids de opción de este flujo.

### `ask` {#ask}

Hace las preguntas en la terminal, una fila cada vez, e imprime las claves.

```bash
fds-encoder ask [rows.json] [--out <answers.json>]
```

| Argumento u opción | Descripción |
|------------------|-------------|
| `rows.json` | Los registros a los que poner clave. Sin él, `ask` pone clave a un registro llamado `key-1` |
| `--out <answers.json>` | Guarda las respuestas después de cada fila. Una nueva ejecución con el mismo archivo continúa en la primera fila sin respuesta. Cada guardado escribe el archivo entero a través de un archivo temporal, así que un guardado interrumpido nunca deja un archivo a medias |

Un archivo de filas es una lista de filas. Cada fila tiene un `id` y un `name`, y puede tener `alsoCalled`, `text` y `media` (un enlace o una lista de enlaces). El comando los muestra encima de las preguntas. El [ejemplo 1](./examples.md#example-1-key-an-exercise) tiene un archivo de filas.

En una pregunta:

| Escriba | Hace |
|------|------|
| Un número o un id de opción | Responde. Una pregunta que admite varias opciones las admite separadas por espacios o comas |
| `?` | Muestra la ayuda de la pregunta, su respuesta habitual y la capa que rellena |
| `b` | Retrocede una pregunta |
| `s` | Omite esta fila |
| `q` | Guarda y se detiene. La fila en curso se vuelve a preguntar la próxima vez |
| Enter | Vuelve a mostrar la pregunta |

Cuando una fila está completa, `ask` imprime sus respuestas y sus claves. Enter conserva la fila y pasa a la siguiente, `r` la rehace, `b` retrocede una pregunta y `q` se detiene sin conservarla. El [ejemplo 1](./examples.md#example-1-key-an-exercise) muestra una sesión completa.

Cuando la entrada termina antes que la sesión, como cuando las respuestas llegan por una tubería desde un archivo que se agota, `ask` dice que la fila en curso no se guardó y sale con 1. Nombra el archivo de respuestas cuando se guardó en él una fila anterior:

```text
The input ended before row key-2 was finished: its answers were not saved. The rows finished before it are in answers.json.
```

y lo dice cuando la entrada terminó en la primera fila, antes de que se guardara nada:

```text
The input ended before row key-1 was finished: its answers were not saved. Nothing was saved to answers.json.
```

### `build` {#build}

Construye las claves de cada entrada de un archivo de respuestas.

```bash
fds-encoder build <answers.json>
```

Un archivo de respuestas es una lista de entradas, `{ "id", "answers": { "<question id>": "<option id>" } }`. Una pregunta que admite varias opciones admite una lista. `ask --out` escribe este formato.

```json title="answers.json" fds:ignore an answers file for the Encoder's questions, not an FDS document
[
  {
    "id": "ex-102",
    "answers": {
      "subject": "usual",
      "changes": ["usual"],
      "motion.phases": "1",
      "p1.kind": "usual",
      "p1.joints": ["hip", "kn"],
      "p1.hip": ["ext"],
      "p1.kn": ["ext"],
      "p1.short": ["usual"],
      "p1.also": "usual",
      "orientation": "standing",
      "load": "implement",
      "imp1": "bar.straight",
      "hold1": "back",
      "symmetry": "usual"
    }
  },
  {
    "id": "eq-7",
    "answers": { "subject": "equipment", "eq.kind": "imp", "eq.form.imp": "bar.ez", "eq.details": "usual" }
  }
]
```

```bash
fds-encoder build answers.json
```

```text
[
  {
    "id": "ex-102",
    "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back",
    "fxe": "FXE=1.0S/k:imp/f:bar.straight"
  },
  {
    "id": "eq-7",
    "fxi": null,
    "fxe": "FXE=1.0S/k:imp/f:bar.ez"
  }
]
```

Para un ejercicio, `fxe` es la clave de su equipamiento principal. Para un equipamiento por sí solo, `fxi` es `null` y `fxe` es su clave completa.

Las claves van a la salida estándar, como una lista JSON de las entradas que se construyen. Una entrada cuyas respuestas faltan, no son válidas o se contradicen queda fuera de esa lista: su id y lo que hay que corregir van a la salida de error estándar, y el comando sale con 1. Una entrada que solo responde `subject` imprime esto en la salida de error estándar:

```text
ex-103:
  changes: no answer. Which of these does the exercise state, beyond its motion, body position, load and sides?
  motion.phases: no answer. How many separate movements does one rep have?
  orientation: no answer. What is the body position at the start of the rep?
  load: no answer. What loads the working muscles?
  symmetry: no answer. How do the two sides work?
```

### `match` {#match}

Sugiere registros de la biblioteca para cada registro, por clave.

```bash
fds-encoder match <records.json> --library <records.json> [--top <n>]
```

| Argumento u opción | Descripción | Predeterminado |
|------------------|-------------|---------|
| `<records.json>` | Los registros a emparejar: un registro FDS o una lista | Obligatorio |
| `--library <records.json>` | Los registros con los que emparejarlos | Obligatorio |
| `--top <n>` | Cuántos candidatos listar para cada registro | `3` |

Cada registro se lee por su propia clave (`fxi`, `fxe`, `fxm` o `fxmg`, la primera presente), su id (`exerciseId` o `id`) y su nombre (`canonical.name`, o si no `name`). Un ejercicio aporta además la clave de su equipamiento principal obligatorio. Un registro sin clave o sin id se informa en la salida de error estándar y se omite. Un registro cuya clave no pasa la comprobación también se informa en la salida de error estándar, y se empareja solo por nombre; su resultado lleva `warnings`, que lo indican. Un registro solo se empareja con registros de la biblioteca que tengan el mismo tipo de clave.

```bash
fds-encoder match imports.json --library library.json --top 1
```

```text
[
  {
    "id": "imp-1",
    "key": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands",
    "match": {
      "kind": "identical",
      "id": "lib-1",
      "candidates": [
        {
          "id": "lib-1",
          "via": "key",
          "result": "same"
        }
      ]
    }
  },
  {
    "id": "imp-2",
    "key": "FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands",
    "match": {
      "kind": "confirm",
      "candidates": [
        {
          "id": "lib-1",
          "via": "key",
          "result": "more-specific",
          "specific": "b"
        }
      ],
      "why": "no library entry has the same key"
    }
  }
]
```

`kind` es uno de:

| Kind | Significado |
|------|---------|
| `identical` | Exactamente un registro de la biblioteca tiene la misma clave, y la misma clave de equipamiento cuando ambos llevan una. `id` lo nombra |
| `confirm` | Una persona elige entre los candidatos. `why` dice por qué ninguno es idéntico |
| `absent` | La biblioteca no contiene ningún registro con este tipo de clave |

Cada candidato dice cómo entró en la lista:

| `via` | Significado |
|-------|---------|
| `key` | Su clave es igual, más específica, menos específica o se solapa. `result` y `specific` son como en `compare`, con el registro como A y el candidato como B |
| `near` | Un ejercicio cuya clave difiere en una capa estándar. `layer` la nombra |
| `name` | El resto, por similitud de nombre |

El [ejemplo 4](./examples.md#example-4-match-imported-records-against-a-library) muestra los archivos detrás de esta salida.

### `--version` {#--version}

```bash
fds-encoder --version
```

```text
0.1.0
```

`-v` hace lo mismo.

## Códigos de salida {#exit-codes}

| Código | Significado |
|------|---------|
| `0` | Éxito |
| `1` | Una clave, un registro o una respuesta no pasa la comprobación, dos claves no se pueden comparar, un archivo no se puede leer o escribir o no es JSON, la entrada termina antes de que `ask` acabe, o el comando falla por cualquier otra razón. Cada error es una línea en la salida de error estándar |
| `2` | Un error de uso: un argumento que falta, un comando desconocido o un valor de opción incorrecto |

Cuando quien lee la salida estándar la cierra antes de tiempo, como hace `fds-encoder questions | head`, el comando se detiene en silencio con 0.

Los resultados van a la salida estándar: las claves escritas y los informes de registros de `check`, el resultado de `compare`, el JSON de `build`, `questions` y `match`, y la sesión de `ask`. Los errores, los mensajes de uso y los problemas de las entradas que no se construyen van a la salida de error estándar, junto con los avisos de `match`.

## Véase también {#see-also}

- [Ejemplos](./examples.md): recorridos de extremo a extremo.
- [API de la biblioteca](./library-api.md): las mismas operaciones desde TypeScript.
- [Claves estructurales](../../core-concepts/structural-keys.md): cómo se construye cada clave.
