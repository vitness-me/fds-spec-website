---
title: API de la biblioteca
description: Las funciones que exporta el FDS Encoder, con ejemplos breves de TypeScript
sidebar_position: 4
---

# API de la biblioteca

La línea de comandos funciona sobre estas funciones. Impórtelas desde `@vitness/fds-encoder` una vez que el paquete esté [instalado en su proyecto](./installation.md#use-the-library-in-a-project). Los valores de los comentarios son lo que devuelve cada llamada.

## Claves {#keys}

`checkKey`, `writeKey`, `keyType` y `compareKeys` funcionan con los cuatro tipos de clave.

```typescript
import { checkKey, compareKeys, KeyError, keyType, writeKey } from '@vitness/fds-encoder';

checkKey('FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands');
// { ok: true, type: 'FXI', written: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', issues: [] }

checkKey('FXE=1.0S/k:robot').issues;
// [{ code: 'unknown-kind', message: '"robot" is not an FXE kind.', at: 'k:robot' }]

writeKey('FXMG=1.0/thigh.posterior+hamstring'); // 'FXMG=1.0/hamstring'
keyType('FXM=1.0/deltoid.clavicular');         // 'FXM'

try {
  writeKey('FXE=1.0S/k:robot');
} catch (err) {
  if (err instanceof KeyError) console.log(err.issues[0].code); // 'unknown-kind'
}

compareKeys('FXM=1.0/biceps-brachii.long', 'FXM=1.0/biceps-brachii');
// { type: 'FXM', result: 'more-specific', specific: 'a', shared: ['biceps-brachii.long'] }

compareKeys('FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands').layers?.o;
// 'narrower'
```

| Función | Devuelve |
|----------|---------|
| `checkKey(text)` | `{ ok, type, written, issues }`. `written` es la forma escrita estándar. Cada problema tiene un `code`, un `message` y, donde corresponde, `at` |
| `writeKey(text)` | La forma escrita, o lanza un `KeyError` que lista cada problema |
| `keyType(text)` | `'FXI'`, `'FXE'`, `'FXM'`, `'FXMG'` o `undefined` |
| `compareKeys(a, b)` | `{ type, result, specific?, layers?, shared? }`. `result` es `same`, `more-specific`, `overlap` o `different`. Las claves de ejercicio y de equipamiento dan `layers`; las claves de músculo y de categoría dan `shared`. Lanza un `KeyError` cuando una clave no pasa la comprobación o los tipos difieren |
| `KeyError` | El error que lanzan `writeKey` y `compareKeys`. Sus `issues` listan lo que está mal |

`parseFxi`, `parseFxe`, `parseFxm` y `parseFxmg` dan las capas y los términos analizados de un tipo de clave. `standardFxi` y `standardFxe` eliminan las capas extendidas y dan la parte estándar de una clave.

```typescript
import { parseFxi, parseFxm, standardFxe } from '@vitness/fds-encoder';

parseFxi('FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands').layers;
// { m: 'el.flex', o: 'standing', l: 'bell.dumb@hands' }

parseFxm('FXM=1.0S/biceps-brachii.long').key;
// { kind: 'part', muscle: 'biceps-brachii', part: 'long' }

standardFxe('FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc'); // 'FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex'
```

| Función | Devuelve |
|----------|---------|
| `parseFxi(text)` | `{ ok, issues, canonical, layers, flag }`. `canonical` es la forma escrita y `layers` contiene el valor de cada capa |
| `parseFxe(text)` | `{ ok, issues, canonical, configs, flag }`. `configs` lista la clase `k` y las capas de cada configuración; una máquina combinada tiene varias |
| `parseFxm(text)` | `{ ok, issues, canonical, key }`. `key` es un músculo, `{ kind: 'muscle', muscle }`, o una parte, `{ kind: 'part', muscle, part }` |
| `parseFxmg(text)` | `{ ok, issues, canonical, key }`. `key.terms` lista las categorías y los músculos de la unión |
| `standardFxi(text)`, `standardFxe(text)` | La parte estándar de una clave: la forma escrita sin sus capas extendidas. Lanza una excepción con una clave que no pasa la comprobación |
| `formatFxm(key)` | El texto de una clave de músculo analizada: `formatFxm(parseFxm('FXM=1.0/deltoid.acromial').key)` es `'FXM=1.0/deltoid.acromial'` |
| `FXM_PREFIX`, `FXMG_PREFIX` | Los encabezados con los que empieza toda clave de músculo y de categoría: `'FXM=1.0/'` y `'FXMG=1.0/'` |

## Ejercicio y equipamiento {#exercise-and-equipment}

`crossCheck(fxi, fxe)` comprueba una clave de ejercicio contra la clave de su equipamiento. Una lista vacía significa que coinciden. Los códigos de aviso son `invalid`, `main-equipment`, `posture`, `load-interface` y `off-design`. [Comprobar un ejercicio contra su equipamiento](../../core-concepts/structural-keys/equipment-key.md#checking-an-exercise-against-its-equipment), en la página de la clave de equipamiento, dice cuándo falla cada comprobación.

```typescript
import { crossCheck, mainEquipment, parseFxi } from '@vitness/fds-encoder';

const squat = 'FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back';

crossCheck(squat, 'FXE=1.0S/k:imp/f:bar.straight'); // []
crossCheck(squat, 'FXE=1.0S/k:imp/f:bell.dumb')[0].code; // 'main-equipment'

mainEquipment(parseFxi(squat).layers ?? {});
// { token: 'bar.straight', fxe: 'FXE=1.0S/k:imp/f:bar.straight' }
```

| Función | Devuelve |
|----------|---------|
| `crossCheck(fxi, fxe)` | Una lista de `{ code, message }`, vacía cuando las dos claves coinciden |
| `mainEquipment(layers)` | El equipamiento principal de un ejercicio a partir de sus capas `l` y `s`: `{ token, fxe }`, el código de la clave de ejercicio que lo nombra, cuando alguno lo nombra, y la clave de equipamiento que representa |

## Músculos y categorías {#muscles-and-categories}

```typescript
import { fxmgCategoriesOf, fxmgMembers, fxmInFxmg } from '@vitness/fds-encoder';

fxmInFxmg('FXM=1.0/rectus-femoris', 'FXMG=1.0/a:hip.flex');
// { relation: 'in', shared: ['rectus-femoris'] }

fxmgMembers('FXMG=1.0/hamstring');
// ['FXM=1.0/biceps-femoris', 'FXM=1.0/semimembranosus', 'FXM=1.0/semitendinosus']

fxmgCategoriesOf('FXM=1.0/semitendinosus');
// ['FXMG=1.0/a:hip.ext', 'FXMG=1.0/a:kn.flex', 'FXMG=1.0/entire', 'FXMG=1.0/hamstring', 'FXMG=1.0/thigh', 'FXMG=1.0/thigh.posterior']
```

| Función | Devuelve |
|----------|---------|
| `fxmInFxmg(fxm, fxmg)` | `{ relation, shared }`. `relation` es `in`, `partly-in` o `not-in` |
| `fxmgMembers(fxmg)` | Los miembros de una categoría como claves de músculo |
| `fxmgCategoriesOf(fxm, index?)` | Todas las categorías en las que el músculo está por completo. Pase un índice de `buildFxmgIndex()` cuando la llame muchas veces |
| `buildFxmgIndex()` | Un mapa de cada músculo y cada parte a todas las categorías que lo contienen |
| `expandFxm(fxm)`, `expandFxmg(fxmg)` | Los músculos y las partes que abarca una clave, sin el prefijo: `expandFxm('FXM=1.0/biceps-brachii')` es `['biceps-brachii.long', 'biceps-brachii.short']` |
| `expandMuscleKey(key)` | Lo mismo para una clave de músculo o una clave de categoría |
| `fxmTerm(fxm)` | El término que nombra una clave de músculo: `{ name, anchors, uberonNote? }`. `anchors` son sus términos de FMA y de Uberon; `uberonNote` dice lo que tiene Uberon cuando no tiene un término para la estructura |
| `fxmgTerm(fxmg)` | El término que nombra la clave de una categoría: `{ name, anchors, members }` |
| `fxmgKeys()` | Todas las claves de categoría, ordenadas: 66, desde `'FXMG=1.0/a:ank.df'` |

También se exportan los datos que hay detrás: `FXM_MUSCLES` (los músculos y sus partes, con sus términos de ontologías anatómicas), `FXMG_SETS` (los conjuntos con nombre), `FXMG_ACTIONS` (una categoría por cada acción articular) y `ACTION_PRIME_MOVERS` (los motores principales de cada acción articular). `FXM_VOCABULARY` y `FXMG_VOCABULARY` son los mismos datos indexados para la búsqueda; toda función de músculos y categorías acepta uno como último argumento, opcional. Las etiquetas y los ids anatómicos vienen de FMA y de Uberon bajo CC BY: [Fuentes y licencias](../../core-concepts/structural-keys/muscle-key.md#sources-and-licences) da cada fuente y su licencia.

## Construir claves {#building-keys}

`QUESTIONS` y `FLOW` son el flujo de preguntas que imprime `fds-encoder questions`. `build` convierte una entrada de respuestas en claves.

```typescript
import { AnswerError, build, QUESTIONS } from '@vitness/fds-encoder';

QUESTIONS.length; // 201
QUESTIONS[0].id;  // 'subject'

build({ id: 'eq-7', answers: { subject: 'equipment', 'eq.kind': 'imp', 'eq.form.imp': 'bar.ez', 'eq.details': 'usual' } });
// { id: 'eq-7', fxi: null, fxe: 'FXE=1.0S/k:imp/f:bar.ez', path: ['subject', 'eq.kind', 'eq.form.imp', 'eq.details'] }

try {
  build({ id: 'ex-103', answers: { subject: 'usual' } });
} catch (err) {
  if (err instanceof AnswerError) console.log(err.problems[0]);
  // 'changes: no answer. Which of these does the exercise state, beyond its motion, body position, load and sides?'
}
```

| Exportación | Hace |
|--------|------|
| `build(entry)` | Construye `{ id, fxi, fxe, path }`. `path` lista las preguntas hechas, en orden. Lanza un `AnswerError` cuyos `problems` dicen qué corregir |
| `AnswerError` | El error que lanza `build` con respuestas que faltan, no son válidas o se contradicen. `entryId` y `problems` dicen qué entrada y qué corregir |
| `InternalError` | El error que lanza `build` cuando escribe una clave que su propia comprobación rechaza. Es un defecto del Encoder, nunca de las respuestas |
| `buildWith(id, provide)` | Construye a partir de cualquier fuente de respuestas: `provide(question, reading)` devuelve la respuesta a cada pregunta del camino |
| `openOptions(question, reading)` | Las opciones de una pregunta que aplican, dadas las respuestas hasta el momento. Un formulario muestra solo estas |
| `QUESTIONS`, `QUESTION_BY_ID`, `FLOW`, `FACTS` | Las preguntas, por orden y por id, el flujo completo como un objeto listo para JSON, y los hechos que usan sus condiciones |
| `startAsk(rows, existing?)`, `stepAsk(state, line)` | La sesión de `ask` como un ejecutor de pasos puro: cada llamada devuelve el estado siguiente, las líneas que imprimir y si hay que guardar |
| `askRows(data)`, `answersText(state)` | Leen un archivo de filas, y escriben el archivo de respuestas de un estado |

```typescript
import { startAsk, stepAsk } from '@vitness/fds-encoder';

const first = startAsk([{ id: 'ex-101', name: 'Dumbbell Curl' }]);
first.state.question; // 'subject'

const next = stepAsk(first.state, '1');
next.state.question; // 'changes'
next.state.answers;  // { subject: 'usual' }
```

## Registros {#records}

Estas funciones leen y escriben solo el campo de clave propio del registro y los campos de clave de las referencias que contiene: `fxi` en una referencia de ejercicio (`exercise`, `alternatives[]`), `fxe` en una referencia de equipamiento (`equipment`, `equipment.required[]`, `equipment.optional[]`), y `fxm` y `fxmg` en una referencia de músculo (`targets.primary[]`, `targets.secondary[]`). Un campo con uno de esos nombres en cualquier otro lugar no es una clave y nunca se lee ni se escribe, y tampoco nada bajo `metadata`, `attributes` o `extensions`. Cualquier otra cosa que una plataforma guarde sobre una clave, como quién la escribió o un enlace confirmado, pertenece a `attributes` o `extensions`.

```typescript
import { checkRecord, matchEntryOf, recordKeys } from '@vitness/fds-encoder';

const record = {
  exerciseId: 'ex-201',
  fxi: 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands',
  canonical: { name: 'Dumbbell Curl' },
  equipment: { required: [{ id: 'eq-1', name: 'Dumbbell', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' }] },
  metadata: { fxi: 'not a key' },
};

recordKeys(record).map((k) => k.path); // ['fxi', 'equipment.required[0].fxe']

const checked = checkRecord(record);
checked.problems;  // []
checked.warnings;  // []
checked.rewritten;
// [{ path: 'fxi', from: 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands', to: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands' }]

matchEntryOf(record);
// { id: 'ex-201', key: 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands', name: 'Dumbbell Curl', fxe: 'FXE=1.0S/k:imp/f:bell.dumb' }
```

| Función | Devuelve |
|----------|---------|
| `recordKeys(record)` | Todas las claves del registro, como `{ path, field, key }`, en el orden del documento. Un nombre de propiedad que no es una palabra simple va entre comillas en la ruta: `["a.b"]` |
| `checkRecord(record)` | `{ problems, warnings, rewritten, record }`. `record` es una copia con cada clave que pasa la comprobación en su forma escrita |
| `matchEntryOf(record)` | El registro como entrada de emparejamiento, o `undefined` cuando no tiene clave propia o no tiene id. Solo cuentan las propiedades propias del registro |
| `KEY_FIELDS` | Los cuatro campos de clave y el tipo de clave que contiene cada uno |

## Emparejamiento {#matching}

`match(entry, library, options?)` sugiere entradas de la biblioteca para una entrada. Hay que darle entradas de biblioteca con el mismo tipo de clave.

```typescript
import { match, nameSimilarity } from '@vitness/fds-encoder';

const library = [
  { id: 'lib-1', key: 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands', name: 'Dumbbell Biceps Curl' },
  { id: 'lib-2', key: 'FXI=1.0S/m:el.flex/o:seated/l:bell.dumb@hands', name: 'Seated Dumbbell Curl' },
];

match({ id: 'imp-2', key: 'FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands', name: 'Dumbbell Curl' }, library, { top: 2 });
// {
//   kind: 'confirm',
//   candidates: [
//     { id: 'lib-1', via: 'key', result: 'more-specific', specific: 'b' },
//     { id: 'lib-2', via: 'key', result: 'more-specific', specific: 'b' },
//   ],
//   why: 'no library entry has the same key',
// }

nameSimilarity('Dumbbell Curl', 'Dumbbell Biceps Curl'); // 0.8
```

Una entrada cuya clave no pasa la comprobación no coincide con nada por su clave, así que sus candidatos llegan solo por nombre. El resultado lleva entonces `warnings`, que lo indican:

```typescript
match({ id: 'imp-3', key: 'FXI=1.0S/m:el.bend/o:standing/l:bell.dumb@hands', name: 'Dumbbell Curl' }, library, { top: 1 });
// {
//   kind: 'confirm',
//   candidates: [{ id: 'lib-1', via: 'name' }],
//   why: 'the key does not check',
//   warnings: ['The key FXI=1.0S/m:el.bend/o:standing/l:bell.dumb@hands does not check, so it matches by name only: "el.bend" is not a joint action.'],
// }
```

El `kind` del resultado es `identical`, `confirm` o `absent`, como en [`fds-encoder match`](./cli-reference.md#match). `top` es la longitud de la lista de candidatos, 3 de forma predeterminada. `nameSimilarity` puntúa dos nombres de 0 a 1 y ordena los candidatos que empatan en sus claves.

## Listas de códigos y registros {#code-lists-and-registries}

`codes` contiene todas las listas de códigos de las que se nutren las claves, con una breve descripción de cada código. `buildRegistries()` genera los registros de códigos publicados en `specification/registries/`, por nombre de archivo.

```typescript
import { buildRegistries, codes } from '@vitness/fds-encoder';

codes.FXE_KINDS.mac;
// 'Strength machine: a guided mechanism with fixed body contacts, built for one movement.'

Object.keys(buildRegistries());
// ['exercise-key.registry.json', 'equipment-key.registry.json', 'body-points.registry.json',
//  'body-positions.registry.json', 'muscle-key.registry.json', 'muscle-category-key.registry.json']
```

## Tipos {#types}

El paquete incluye los tipos de TypeScript de todo lo anterior:

| Área | Tipos |
|------|-------|
| Claves | `CheckedKey`, `KeyComparison`, `KeyResult`, `KeyType`, `Issue`, `LayerRelation` |
| Claves de ejercicio y de equipamiento | `ParsedFxi`, `ParsedFxe`, `FxeConfig`, `MainEquipment` |
| Claves de músculo y de categoría | `FxmKey`, `ParsedFxm`, `FxmVocabulary`, `FxmgKey`, `FxmgTerm`, `ParsedFxmg`, `FxmInFxmg`, `Anchor`, `FxmMuscle`, `FxmPart`, `FxmgSet`, `FxmgMember`, `FxmgAction` |
| Registros y emparejamiento | `RecordKey`, `RecordCheck`, `RecordIssue`, `KeyField`, `MatchEntry`, `MatchOptions`, `MatchResult`, `Candidate` |
| Construir claves | `Answer`, `Answers`, `Built`, `Entry`, `Provider`, `Cond`, `FactId`, `FlowOption`, `FlowQuestion`, `AskRow`, `AskState`, `AskStep` |
| Registros de códigos | `Registry` |

## Véase también {#see-also}

- [Referencia de la CLI](./cli-reference.md): las mismas operaciones desde la línea de comandos.
- [Ejemplos](./examples.md): recorridos de extremo a extremo.
