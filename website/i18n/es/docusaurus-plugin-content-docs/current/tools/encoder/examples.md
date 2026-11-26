---
title: Ejemplos
description: Recorridos de extremo a extremo con el FDS Encoder
sidebar_position: 5
---

# Ejemplos

Estos recorridos usan el comando `fds-encoder` de la [página de instalación](./installation.md). Cada salida es lo que imprime el comando para los archivos mostrados.

## Ejemplo 1: Poner clave a un ejercicio {#example-1-key-an-exercise}

Se escriben los registros a los que se quiere poner clave en un archivo de filas. `name` y `text` se muestran encima de las preguntas, para que la persona que responde vea qué es el registro.

```json title="rows.json" fds:ignore an ask rows file, not an FDS document
[
  { "id": "ex-101", "name": "Dumbbell Curl", "text": "Stand holding a dumbbell in each hand and curl them up." },
  { "id": "ex-102", "name": "Back Squat", "text": "Squat with a barbell across the upper back." }
]
```

### Responder las preguntas {#answer-the-questions}

```bash
fds-encoder ask rows.json --out answers.json
```

Cada respuesta va después de `>`. Esta sesión pone clave al curl, lo conserva y luego se detiene en la sentadilla. Aquí se omiten las listas de opciones posteriores a la primera pregunta.

```text
2 rows, 0 already answered.
Keys: a number or option id answers, ? help, b back one question, s skip this row, q save and stop, Enter shows the question again.

════ Row 1 of 2 · ex-101 ════
Dumbbell Curl

Stand holding a dumbbell in each hand and curl them up.

[subject] Are you describing an exercise, or a piece of equipment on its own?
Pick one.
   1  usual          An exercise (the usual case)
   2  equipment      A piece of equipment on its own
> 1

[changes] Which of these does the exercise state, beyond its motion, body position, load and sides?
Pick one or more, separated by spaces or commas.
> usual

[motion.phases] How many separate movements does one rep have?
Pick one.
> 1

[p1.kind] What kind of movement is phase 1?
Pick one.
> usual

[p1.joints] Which joints move in phase 1?
Pick one or more, separated by spaces or commas.
> el

[p1.el] Phase 1: which way does the elbow move?
Pick one or more, separated by spaces or commas.
> flex

[p1.short] In phase 1, does any joint move through only a short range on purpose?
Pick one or more, separated by spaces or commas.
> usual

[p1.also] In phase 1, does another part of the body do something of a different kind at the same time, or move the opposite way?
Pick one.
> usual

[orientation] What is the body position at the start of the rep?
Pick one.
> standing

[load] What loads the working muscles?
Pick one.
> implement

[imp1] Which implement?
Pick one.
> bell.dumb

[hold1] Where is it held?
Pick one.
> hands

[symmetry] How do the two sides work?
Pick one.
Type 2 to pick "b"; the letter b is a command.
> usual

Answers: subject=usual  changes=usual  motion.phases=1  p1.kind=usual  p1.joints=el  p1.el=flex  p1.short=usual  p1.also=usual  orientation=standing  load=implement  imp1=bell.dumb  hold1=hands  symmetry=usual
  FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands
  FXE=1.0S/k:imp/f:bell.dumb
Enter keeps this row and moves on. r redoes the row, b goes back one question, q stops without keeping this row.
> 
Kept ex-101.

════ Row 2 of 2 · ex-102 ════
Back Squat

Squat with a barbell across the upper back.

[subject] Are you describing an exercise, or a piece of equipment on its own?
Pick one.
> q
Saved. The row in progress is asked again next time.
ex-101: FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands  FXE=1.0S/k:imp/f:bell.dumb
Answers file: answers.json
```

El curl recibe una clave de ejercicio y la clave de su equipamiento principal, la mancuerna. Al ejecutar de nuevo el mismo comando, empieza en la sentadilla:

```text
2 rows, 1 already answered.
```

### Construir a partir del archivo de respuestas {#build-from-the-answers-file}

El archivo de respuestas es JSON simple, así que puede revisarse, guardarse junto con los datos o escribirse a mano. `build` lo vuelve a convertir en claves:

```bash
fds-encoder build answers.json
```

```text
[
  {
    "id": "ex-101",
    "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands",
    "fxe": "FXE=1.0S/k:imp/f:bell.dumb"
  }
]
```

Se copia `fxi` en el registro del ejercicio, y `fxe` en su referencia a la mancuerna en `equipment.required`. La [referencia de la CLI](./cli-reference.md#build) muestra un archivo de respuestas escrito a mano.

## Ejemplo 2: Comprobar las claves de un archivo de catálogo {#example-2-check-a-catalog-files-keys}

Un archivo de catálogo puede contener un registro FDS o una lista de ellos. Este extracto tiene solo los campos que lee el Encoder.

```json title="catalog.json" fds:ignore a catalog excerpt with only the fields the Encoder reads
[
  {
    "exerciseId": "ex-201",
    "fxi": "FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands",
    "canonical": { "name": "Dumbbell Curl" },
    "equipment": { "required": [{ "id": "eq-1", "name": "Dumbbell", "fxe": "FXE=1.0S/k:imp/f:bell.dumb" }] }
  },
  {
    "exerciseId": "ex-202",
    "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back",
    "canonical": { "name": "Back Squat" },
    "equipment": { "required": [{ "id": "eq-1", "name": "Dumbbell", "fxe": "FXE=1.0S/k:imp/f:bell.dumb" }] },
    "targets": {
      "primary": [{ "id": "m-1", "name": "Biceps Femoris", "fxm": "FXM=1.0/biceps-femoris", "fxmg": "FXMG=1.0/quadriceps-femoris" }]
    }
  },
  {
    "exerciseId": "ex-203",
    "fxi": "FXI=1.0S/m:el.flexx/o:standing/l:bell.dumb@hands",
    "canonical": { "name": "Concentration Curl" }
  }
]
```

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

Se lee registro por registro:

- **El registro 0** pasa la comprobación. Sus capas están desordenadas, así que `checked.json` contiene la forma escrita. Ese es el único cambio en el archivo.
- **El registro 1** pasa la comprobación, con dos avisos. La sentadilla está cargada con una barra, pero su equipamiento obligatorio es una mancuerna. Su referencia de músculo sitúa el bíceps femoral en el cuádriceps.
- **El registro 2** tiene un problema: `el.flexx` no es un código. El comando sale con 1 hasta que se corrija.

Los ejemplos que acompañan a los esquemas pasan la comprobación sin problemas:

```bash
fds-encoder check --records specification/schemas/exercises/v1.2.0/exercise.example.json
```

```text
1 records, 0 with problems
```

## Ejemplo 3: Comparar dos ejercicios de catálogos distintos {#example-3-compare-two-exercises-from-different-catalogs}

El catálogo A llama a un ejercicio "Standing DB Curl" y le pone la clave `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`. El catálogo B llama a uno "Curl con mancuerna" y no dice si se hace de pie o sentado, así que su clave deja la posición del cuerpo en `?`.

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands'
```

```text
more-specific: A is more specific  {"m":"equal","o":"narrower","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

A es más específica: todas las capas son iguales salvo la posición del cuerpo, que A acota. El ejercicio de B puede ser el de A, y una persona lo confirma.

El "Seated Dumbbell Curl" del catálogo B es un ejercicio distinto:

```bash
fds-encoder compare 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:seated/l:bell.dumb@hands'
```

```text
different  {"m":"equal","o":"contradicts","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

Las claves que tienen la misma forma escrita se comparan como `same`:

```bash
fds-encoder compare 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands' 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands'
```

```text
same  {"m":"equal","o":"equal","k":"equal","f":"equal","s":"equal","l":"equal","x":"equal","g":"equal","r":"equal","h":"equal","p":"equal"}
```

## Ejemplo 4: Emparejar registros importados con una biblioteca {#example-4-match-imported-records-against-a-library}

Su biblioteca contiene cinco ejercicios. Importa dos registros desde otra aplicación.

```json title="library.json" fds:ignore a catalog excerpt with only the fields the Encoder reads
[
  { "exerciseId": "lib-1", "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands", "canonical": { "name": "Dumbbell Biceps Curl" } },
  { "exerciseId": "lib-2", "fxi": "FXI=1.0S/m:el.flex/o:seated/l:bell.dumb@hands", "canonical": { "name": "Seated Dumbbell Curl" } },
  { "exerciseId": "lib-3", "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands/g:ne", "canonical": { "name": "Hammer Curl" } },
  { "exerciseId": "lib-4", "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bar.straight@hands", "canonical": { "name": "Barbell Curl" } },
  { "exerciseId": "lib-5", "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back", "canonical": { "name": "Back Squat" } }
]
```

```json title="imports.json" fds:ignore a catalog excerpt with only the fields the Encoder reads
[
  { "exerciseId": "imp-1", "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands", "canonical": { "name": "DB Curl" } },
  { "exerciseId": "imp-2", "fxi": "FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands", "canonical": { "name": "Dumbbell Curl" } }
]
```

```bash
fds-encoder match imports.json --library library.json
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
        },
        {
          "id": "lib-3",
          "via": "near",
          "layer": "g"
        },
        {
          "id": "lib-4",
          "via": "near",
          "layer": "l"
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
        },
        {
          "id": "lib-2",
          "via": "key",
          "result": "more-specific",
          "specific": "b"
        },
        {
          "id": "lib-3",
          "via": "near",
          "layer": "g"
        }
      ],
      "why": "no library entry has the same key"
    }
  }
]
```

- **imp-1** tiene la misma clave que `lib-1`, y ningún otro registro de la biblioteca la tiene: `identical`. Le siguen el curl martillo y el curl con barra, cada uno distinto de él en una capa, el agarre `g` y la carga `l`.
- **imp-2** deja abierta la posición del cuerpo, así que tanto el curl de pie como el curl sentado son más específicos que él. Una persona elige uno.

Los nombres "DB Curl" y "Dumbbell Biceps Curl" comparten una palabra. Las claves encontraron la coincidencia de todos modos. Cada enlace que confirme se guarda en sus propios datos, en `attributes` o `extensions`, para que nadie tenga que volver a buscarlo.

## Ejemplo 5: Encontrar las categorías de un músculo {#example-5-find-a-muscles-categories}

Desde la línea de comandos, se sitúa una clave de músculo en una clave de categoría:

```bash
fds-encoder compare 'FXM=1.0/rectus-femoris' 'FXMG=1.0/a:hip.flex'
```

```text
in  {"shared":["rectus-femoris"]}
```

```bash
fds-encoder compare 'FXM=1.0/rectus-femoris' 'FXMG=1.0/hamstring'
```

```text
not-in  {"shared":[]}
```

Desde TypeScript, `fxmgCategoriesOf` lista todas las categorías que publica el estándar y que contienen el músculo, y `fxmInFxmg` lo sitúa en las categorías propias de su catálogo:

```typescript title="categories.ts"
import { buildFxmgIndex, fxmgCategoriesOf, fxmInFxmg } from '@vitness/fds-encoder';

const index = buildFxmgIndex();
console.log(fxmgCategoriesOf('FXM=1.0/rectus-femoris', index));

// Your catalog's own categories, by key.
const categories = [
  { id: 'cat-quads', name: 'Quads', fxmg: 'FXMG=1.0/quadriceps-femoris' },
  { id: 'cat-hams', name: 'Hamstrings', fxmg: 'FXMG=1.0/hamstring' },
  { id: 'cat-hip-flexors', name: 'Hip flexors', fxmg: 'FXMG=1.0/a:hip.flex' },
];

for (const c of categories) {
  console.log(c.name, fxmInFxmg('FXM=1.0/rectus-femoris', c.fxmg).relation);
}
```

Compilado y ejecutado con Node.js, imprime:

```text
[
  'FXMG=1.0/a:hip.flex',
  'FXMG=1.0/a:kn.ext',
  'FXMG=1.0/entire',
  'FXMG=1.0/quadriceps-femoris',
  'FXMG=1.0/thigh',
  'FXMG=1.0/thigh.anterior'
]
Quads in
Hamstrings not-in
Hip flexors in
```

El recto femoral está en el cuádriceps y además flexiona la cadera, así que pertenece a sus dos categorías. `a:hip.flex` y `a:kn.ext` son las categorías de acción: los motores principales de la flexión de cadera y de la extensión de rodilla.

## Véase también {#see-also}

- [Referencia de la CLI](./cli-reference.md): todos los comandos y opciones.
- [API de la biblioteca](./library-api.md): las funciones exportadas.
- [Claves estructurales](../../core-concepts/structural-keys.md): cómo se construye cada clave.
