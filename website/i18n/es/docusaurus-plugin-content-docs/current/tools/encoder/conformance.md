---
title: Conformidad
description: Ejecutar los casos de conformidad de las claves estructurales contra el FDS Encoder u otra implementación
sidebar_position: 6
---

# Conformidad

El repositorio de la especificación publica casos de prueba para las cuatro claves estructurales, en [`specification/conformance/structural-keys/`](https://github.com/vitness-me/fds-spec-website/tree/main/specification/conformance/structural-keys). Comprueban que una implementación lee, escribe y compara claves de la manera que describen las páginas de [Claves estructurales](../../core-concepts/structural-keys.md). El FDS Encoder los pasa todos. Si escribe claves con su propio código, ejecute los casos contra él.

## Los archivos {#the-files}

| Archivo | Cubre |
|------|--------|
| `syntax.json` | Cada capa, símbolo y regla de las cuatro claves. Un caso válido da la forma escrita de la clave; un caso no válido da la razón por la que falla |
| `compare.json` | Dos claves de un mismo tipo y cómo se comparan: `same`, `more-specific`, `overlap` o `different` |
| `build.json` | Respuestas a las preguntas del Encoder y las claves que construyen |
| `cross-check.json` | Una clave de ejercicio contra la clave de su equipamiento, y una clave de músculo situada en una clave de categoría |

Cada caso tiene un `id` y un `about`, una frase que dice qué comprueba. Los archivos son JSON simple, así que una suite de pruebas en cualquier lenguaje puede leerlos. El [README](https://github.com/vitness-me/fds-spec-website/blob/main/specification/conformance/structural-keys/README.md) que los acompaña describe cada campo.

## Ejecutarlos contra el FDS Encoder {#run-them-against-the-fds-encoder}

Desde la raíz de una copia local, construya el Encoder y ejecute los casos:

```bash
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
node scripts/check-conformance.mjs
```

```text
conformance cases against @vitness/fds-encoder
  syntax             848/848 passed
  compare            67/67 passed
  build              73/73 passed
  exerciseEquipment  32/32 passed
  muscleInCategory   14/14 passed
```

## Ejecutarlos contra otra implementación {#run-them-against-another-implementation}

Escriba un adaptador: un módulo de JavaScript cuya exportación predeterminada envuelve su implementación en estas funciones.

| Función | Devuelve |
|----------|---------|
| `check(key)` | `{ ok, written }`: si la clave es válida, y su forma escrita |
| `compare(a, b)` | `{ result, specific }`: `same`, `more-specific`, `overlap` o `different` y, con `more-specific`, qué clave es la más específica, `'a'` o `'b'` |
| `crossCheck(fxi, fxe)` | Los códigos de aviso para una clave de ejercicio y la clave de su equipamiento: `[]` cuando coinciden |
| `muscleInCategory(fxm, fxmg)` | `'in'`, `'partly-in'` o `'not-in'` |
| `build(answers)` | Opcional. `{ fxi, fxe }` para un conjunto de respuestas a las preguntas del Encoder, o `null` cuando las respuestas se rechazan |

`name` etiqueta el informe. Una función que lanza una excepción hace fallar su caso.

Aquí `my-keys.mjs` representa su propio código:

```js title="my-adapter.mjs"
import * as keys from './my-keys.mjs';

export default {
  name: 'my implementation',
  check(key) {
    const c = keys.checkKey(key);
    return { ok: c.ok, written: c.written };
  },
  compare(a, b) {
    const c = keys.compareKeys(a, b);
    return { result: c.result, specific: c.specific };
  },
  crossCheck: (fxi, fxe) => keys.crossCheck(fxi, fxe).map((w) => w.code),
  muscleInCategory: (fxm, fxmg) => keys.fxmInFxmg(fxm, fxmg).relation,
};
```

Pase su ruta con `--adapter`:

```bash
node scripts/check-conformance.mjs --adapter ./my-adapter.mjs
```

```text
conformance cases against my implementation
  syntax             848/848 passed
  compare            67/67 passed
  build              0/73 passed, 73 skipped
  exerciseEquipment  32/32 passed
  muscleInCategory   14/14 passed
```

Este adaptador no tiene `build`, así que los casos de construcción se omiten. Son respuestas a las propias preguntas del Encoder, que imprime `fds-encoder questions --json`; una implementación con su propia manera de construir claves omite `build`.

Cuando un caso falla, el comando lo lista con lo que el caso espera y lo que devolvió el adaptador, y sale con 1. Un adaptador cuyo `muscleInCategory` siempre devuelve `'in'` da:

```text
conformance cases against my implementation
  syntax             848/848 passed
  compare            67/67 passed
  build              0/73 passed, 73 skipped
  exerciseEquipment  32/32 passed
  muscleInCategory   9/14 passed

5 case(s) failed:

  muscleInCategory partly-in-union: {"want":"partly-in","got":"in"}
  muscleInCategory partly-in-action: {"want":"partly-in","got":"in"}
  muscleInCategory partly-in-part-term: {"want":"partly-in","got":"in"}
  muscleInCategory not-in: {"want":"not-in","got":"in"}
  muscleInCategory not-in-helper: {"want":"not-in","got":"in"}
```

Busque un caso por su `id` en el archivo de casos para leer qué comprueba.

## Comprobar el propio ejecutor {#check-the-runner-itself}

`--self-test` da al ejecutor una respuesta errónea en cada grupo por turno y comprueba que el grupo falla, y solo ese grupo. Demuestra que el ejecutor detecta un resultado erróneo antes de confiar en un informe en verde:

```bash
node scripts/check-conformance.mjs --self-test
```

```text
  ok    self-test — every group fails on a wrong answer, and only that group
```

`npm run check:conformance` ejecuta la autoprueba y luego los casos contra el FDS Encoder.

## Razones de las claves no válidas {#reasons-for-invalid-keys}

Un caso no válido también nombra el código de problema que el FDS Encoder informa para la clave. Su implementación puede nombrar sus razones de otra manera: pasa un caso no válido rechazando la clave. Si su `check` devuelve los códigos del Encoder, establezca `issueCodes: true` en el adaptador y devuélvalos como `issues`, una lista de códigos. Cada caso no válido queda entonces sujeto también a su razón.

## Véase también {#see-also}

- [Claves estructurales](../../core-concepts/structural-keys.md): las reglas que comprueban los casos.
- [API de la biblioteca](./library-api.md): las funciones a las que llama el adaptador propio del Encoder.
