---
title: Visión general
description: Construir, comprobar, comparar y emparejar las claves estructurales de ejercicios, equipamiento, músculos y categorías musculares
sidebar_position: 1
---

# FDS Encoder

Construir, comprobar, comparar y emparejar claves estructurales.

**Paquete:** `@vitness/fds-encoder`  
**Versión:** 0.1.0  
**Licencia:** MIT

## Visión general {#overview}

El FDS Encoder es una herramienta de línea de comandos y una biblioteca de TypeScript para las cuatro [claves estructurales](../../core-concepts/structural-keys.md): la clave de ejercicio (`fxi`), la clave de equipamiento (`fxe`), la clave de músculo (`fxm`) y la clave de categoría muscular (`fxmg`). Las páginas de Conceptos fundamentales dicen cómo se construye cada clave. El Encoder aplica esas reglas por usted.

| Clave | Campo | Ejemplo |
|-----|-------|---------|
| Ejercicio | `fxi` | `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`, un curl de pie con mancuerna |
| Equipamiento | `fxe` | `FXE=1.0S/k:imp/f:bar.ez`, una barra EZ |
| Músculo | `fxm` | `FXM=1.0/biceps-brachii.long`, la cabeza larga del bíceps braquial |
| Categoría muscular | `fxmg` | `FXMG=1.0/hamstring`, los isquiotibiales |

## Qué hace {#what-it-does}

| Tarea | Comando | Biblioteca |
|------|---------|---------|
| Comprobar una clave e imprimir su forma escrita | `check <key>…` | `checkKey`, `writeKey` |
| Comprobar todas las claves de un archivo de catálogo | `check --records <file>` | `checkRecord` |
| Comparar dos claves | `compare <a> <b>` | `compareKeys` |
| Situar un músculo en una categoría | `compare <fxm> <fxmg>` | `fxmInFxmg`, `fxmgCategoriesOf` |
| Construir claves respondiendo preguntas | `ask`, `build`, `questions` | `build`, `startAsk`, `stepAsk`, `QUESTIONS` |
| Emparejar registros con una biblioteca | `match <records> --library <records>` | `match`, `matchEntryOf` |

## Cómo encaja con el resto de FDS {#how-it-fits-with-the-rest-of-fds}

- **Conceptos fundamentales.** Las páginas de [Claves estructurales](../../core-concepts/structural-keys.md) son las reglas. El Encoder las sigue e informa, con palabras sencillas, dónde una clave incumple alguna.
- **El Transformer.** El [FDS Transformer](/docs/tools/transformer) convierte los datos de origen en registros FDS. No rellena los campos de clave. Ejecute el Encoder sobre su salida para agregarlos o comprobarlos.
- **Sus registros.** El Encoder lee y escribe solo el campo de clave propio de un registro y los campos de clave de las referencias que contiene. Todo lo demás del registro queda como estaba, hasta los espacios y los literales numéricos. Un enlace que usted confirme entre dos registros pertenece a sus propios datos, en `attributes` o `extensions`. El Encoder no lo lee ni lo escribe.

## Inicio rápido {#quick-start}

Instale el comando desde npm:

```bash
npm install -g @vitness/fds-encoder
```

Compruebe una clave:

```bash
fds-encoder check 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands'
```

```text
ok   FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands
```

La clave pasa la comprobación, y el Encoder la imprime con sus capas en el orden estándar.

## Uso programático {#programmatic-usage}

Las mismas operaciones forman una biblioteca de TypeScript. Instale el paquete [en su proyecto](./installation.md#use-the-library-in-a-project) y luego:

```typescript
import { checkKey, compareKeys } from '@vitness/fds-encoder';

checkKey('FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands').written;
// 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands'

compareKeys('FXM=1.0/biceps-brachii.long', 'FXM=1.0/biceps-brachii').result; // 'more-specific'
```

La [API de la biblioteca](./library-api.md) lista todas las exportaciones.

## ¿Qué sigue? {#whats-next}

- [Instalación](./installation.md): ejecutar el Encoder desde el repositorio.
- [Referencia de la CLI](./cli-reference.md): todos los comandos y opciones.
- [API de la biblioteca](./library-api.md): las funciones exportadas.
- [Ejemplos](./examples.md): recorridos de extremo a extremo.
- [Conformidad](./conformance.md): probar otra implementación con los casos publicados.

## Requisitos {#requirements}

- **Node.js:** 20.0.0 o superior
