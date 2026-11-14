---
title: 'RFC-005: Modelo de datos del atlas corporal'
description: Modelo estandarizado de visualización corporal para la activación muscular y superposiciones anatómicas interactivas
sidebar_position: 5
keywords: [body atlas, visualization, anatomy, heatmap, data model, json schema, rfc]
---

# RFC-005: Especificación del modelo de datos del atlas corporal

**Estado**: Borrador
**Versión**: 0.2.0
**Fecha**: 2026-11-14
**Autores**: Equipo VITNESS
**Categoría**: Standards Track

## Resumen

Esta especificación define un modelo estandarizado de atlas corporal usado para visualizar la activación muscular y superposiciones relacionadas en aplicaciones de fitness. Un atlas corporal proporciona recursos de vista (p. ej., SVG anteriores/posteriores) y un conjunto estable de áreas con nombre vinculadas a formas dentro de esos recursos. Otras entidades (p. ej., los músculos) referencian las áreas del atlas para renderizar mapas de calor interoperables.

## 1. Introducción

### 1.1. Antecedentes

Muchas aplicaciones de fitness visualizan la activación muscular mediante diagramas del cuerpo humano. Históricamente, estos estaban fuertemente acoplados a imágenes y coordenadas propietarias, lo que limitaba la interoperabilidad. El atlas corporal desacopla lo visual de los datos al proporcionar un sistema de nombres estable para las áreas y un mecanismo para vincular esas áreas a recursos concretos.

### 1.2. Objetivos

- Definir un modelo de atlas reutilizable con vistas, recursos y áreas con nombre.  
- Permitir que músculos, ejercicios e informes referencien las áreas del atlas de manera portable.  
- Admitir la evolución de los recursos sin romper las referencias (nuevas versiones del atlas).  
- Mantener la geometría de renderizado fuera de los registros de entidades centrales.

### 1.3. Alcance

**Dentro del alcance:**
- Vistas y recursos del atlas (p. ej., SVG)
- Áreas con nombre con vinculaciones por vista (selectores)
- Reglas de versionado y compatibilidad
- JSON Schema y ejemplos de referencia

**Fuera del alcance:**
- Pipelines de renderizado, escalas de color o temas de interfaz
- Especificaciones de modelos 3D más allá de referenciar un recurso
- Polígonos por músculo o por ejercicio dentro de los esquemas de entidades centrales

## 2. Terminología

- **Atlas**: Una colección de vistas y áreas con nombre vinculadas a recursos (p. ej., SVG) para la visualización.
- **Vista**: Una perspectiva del cuerpo (anterior, posterior, lateral, etc.).
- **Área**: Una región con nombre con vinculaciones a formas/selectores en una o más vistas.
- **Vinculación**: Un mapeo entre un área y una forma de una vista (p. ej., un selector CSS/SVG).

## 3. Requisitos estructurales centrales

### 3.1. Campos obligatorios

:::danger DEBE
Todos los registros de atlas conformes **DEBEN** incluir:
:::

```json
{
  "schemaVersion": "1.1.0",
  "id": "atlas.body.v1",
  "canonical": {
    "name": "FDS Body Atlas v1",
    "slug": "body-atlas-v1",
    "aliases": ["Standard Body Atlas"],
    "localized": [ { "lang": "sr", "name": "Atlas tela v1" } ]
  },
  "views": [
    { "id": "anterior", "kind": "anterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/anterior.svg" } }
  ],
  "areas": [
    {
      "id": "thigh.left.anterior",
      "canonical": { "name": "Left Anterior Thigh", "slug": "thigh-left-anterior" },
      "bindings": [ { "viewId": "anterior", "selector": "#area-thigh-left" } ]
    }
  ],
  "metadata": {
    "createdAt": "2025-09-03T12:00:00Z",
    "updatedAt": "2025-09-03T12:00:00Z",
    "source": "vitness.atlas",
    "status": "active"
  }
}
```

### 3.2. Vistas
- `views[*].id` es un identificador estable usado por `areas[*].bindings[*].viewId`.
- `views[*].kind` es uno de `anterior`, `posterior`, `left-lateral`, `right-lateral`, `superior`, `inferior`.
- `views[*].asset` DEBERÍA ser un SVG para la mejor portabilidad (se permiten otros tipos).
- `views[*].asset` PUEDE declarar los términos de la ilustración en `license` y `attribution` (§4.2).

### 3.3. Áreas y vinculaciones
- `areas[*].id` es un identificador de área estable y global (se recomienda la notación con puntos, p. ej., `thigh.left.anterior`).
- `areas[*].bindings[*].selector` es una cadena apta para seleccionar formas en el recurso enlazado (p. ej., `#area-thigh-left`).
- Un área PUEDE vincularse a múltiples vistas.

## 4. Estructuras de referencia

### 4.1. Canonical

`canonical` transporta la identidad del atlas: un `name` para mostrar, un `slug` estable, una `description` opcional, `aliases` opcionales y entradas `localized`. Cada entrada localizada es una etiqueta `lang` con el `name` en ese idioma y, opcionalmente, su propia `description` y sus propios `aliases`.

`metadata` sigue la definición compartida del RFC-001 — marcas de tiempo, estado y origen. Un atlas es un dato de referencia versionado como cualquier otra entidad, y un consumidor que lo haya almacenado en caché necesita saber cuándo cambió.

```json fds:fragment entity=body-atlas
{
  "canonical": {
    "name": "FDS Body Atlas v1",
    "slug": "body-atlas-v1",
    "aliases": ["Standard Body Atlas"],
    "localized": [ { "lang": "sr", "name": "Atlas tela v1" } ]
  }
}
```

### 4.2. Vistas

Cada vista transporta un `id`, un `kind` que nombra qué aspecto del cuerpo muestra, y un `asset` — un objeto de `type` y `uri` que apunta a la imagen. El tipo se declara en lugar de inferirse de la extensión del URI, porque un consumidor que no puede renderizar el formato necesita saberlo antes de descargarlo.

Las vistas son la razón por la que el atlas existe como entidad separada: el mismo músculo aparece en varias de ellas, en coordenadas distintas, y vincular un músculo a una sola imagen haría el atlas inutilizable para cualquier otra.

```json fds:fragment entity=body-atlas
{
  "views": [
    { "id": "anterior", "kind": "anterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/anterior.svg" } },
    { "id": "posterior", "kind": "posterior", "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/body-v1/posterior.svg" } }
  ]
}
```

#### Licencia y atribución

A partir de la versión 1.1.0 del esquema, un recurso PUEDE llevar dos cadenas opcionales, `license` y `attribution`. Declaran los términos de la ilustración en `uri`. Todos los demás lugares en los que FDS apunta a una imagen ya lo hacen: los elementos multimedia llevan los mismos dos campos. Sin ellos, un atlas no podía decir en qué términos pueden usarse sus propios dibujos.

`license` nombra los términos bajo los cuales puede usarse el recurso.

- Un productor DEBERÍA usar un identificador SPDX o una expresión de licencia SPDX cuando corresponda, como `Apache-2.0`, `CC-BY-4.0` o `Apache-2.0 OR MIT`. Cuando ninguno corresponda, un productor PUEDE usar texto libre.
- **La ausencia significa no declarada, no dominio público.** Un consumidor NO DEBE tratar la falta de `license` como permiso para usar, modificar o redistribuir el recurso. Es el significado que RFC-008 §4.8 da a `authorship.license`.
- `license` describe el recurso, no el documento del atlas. Los nombres, los ids y las vinculaciones de las áreas son otra obra y pueden tener otro titular.
- Cada vista declara sus propios términos, porque las vistas pueden provenir de fuentes distintas.

`attribution` es el texto de crédito que los términos del recurso piden mostrar a quien lo recibe. Un productor DEBERÍA definirlo cuando la licencia exige crédito, como lo hacen Apache-2.0 y todas las licencias CC-BY. No sustituye las obligaciones de aviso propias de una licencia: Apache-2.0 §4(d), por ejemplo, exige a quien redistribuye incluir el contenido del archivo NOTICE de la obra. `attribution` ayuda a quien recibe el recurso a encontrar esa obligación, pero no la cumple.

Ninguno de los dos campos tiene un enum ni un patrón. La lista SPDX crece, un patrón rechazaría expresiones y términos legítimos en texto libre, y endurecer un campo más adelante es un cambio incompatible.

```json fds:fragment entity=body-atlas
{
  "views": [
    {
      "id": "anterior",
      "kind": "anterior",
      "asset": {
        "type": "svg",
        "uri": "https://assets.vitness.me/body-atlas/v1.1.0/anterior.svg",
        "license": "Apache-2.0",
        "attribution": "Body Muscles, Copyright 2024 Ivan Vulović"
      }
    }
  ]
}
```

El `v1.1.0` de esa URL es la versión propia de la ilustración. No tiene relación con la versión del esquema.

En el documento completo siguiente, las dos vistas provienen de fuentes distintas. Un consumidor puede redistribuir el dibujo de la vista anterior bajo CC-BY-4.0 si muestra el texto de crédito. NO DEBE suponer que puede redistribuir el de la vista posterior, cuyos términos no están declarados.

```json fds:document entity=body-atlas
{
  "schemaVersion": "1.1.0",
  "id": "atlas.body.example",
  "canonical": { "name": "Example Body Atlas", "slug": "example-body-atlas" },
  "views": [
    {
      "id": "anterior",
      "kind": "anterior",
      "asset": {
        "type": "svg",
        "uri": "https://cdn.example.com/atlas/anterior.svg",
        "license": "CC-BY-4.0",
        "attribution": "Anterior illustration by Example Studio"
      }
    },
    {
      "id": "posterior",
      "kind": "posterior",
      "asset": { "type": "svg", "uri": "https://cdn.example.com/atlas/posterior.svg" }
    }
  ],
  "areas": [
    {
      "id": "thigh.left.anterior",
      "canonical": { "name": "Left Anterior Thigh", "slug": "thigh-left-anterior" },
      "bindings": [ { "viewId": "anterior", "selector": "#area-thigh-left" } ]
    },
    {
      "id": "back.lower.posterior",
      "canonical": { "name": "Lower Back", "slug": "lower-back" },
      "bindings": [ { "viewId": "posterior", "selector": "#area-lower-back" } ]
    }
  ],
  "metadata": {
    "createdAt": "2026-11-14T12:00:00Z",
    "updatedAt": "2026-11-14T12:00:00Z",
    "status": "active"
  }
}
```

### 4.3. Áreas

Un área es una región en la que se puede hacer clic. Transporta un `id`, su propio bloque `canonical` — las áreas se nombran y localizan exactamente igual que las entidades, porque son lo que un usuario ve y toca — y `bindings` que la sitúan en una o más vistas.

Cada vinculación empareja un `viewId` con un `selector` dentro del recurso de esa vista. Un área puede vincularse a varias vistas, que es lo que permite que un mismo resaltado siga a un músculo de la ilustración frontal a la posterior.

```json fds:fragment entity=body-atlas
{
  "areas": [
    {
      "id": "thigh.left.anterior",
      "canonical": { "name": "Left Anterior Thigh", "slug": "thigh-left-anterior" },
      "bindings": [ { "viewId": "anterior", "selector": "#area-thigh-left" } ]
    },
    {
      "id": "back.lower.posterior",
      "canonical": { "name": "Lower Back", "slug": "lower-back", "localized": [ { "lang": "sr", "name": "Donja leđa" } ] },
      "bindings": [ { "viewId": "posterior", "selector": "#area-lower-back" } ]
    }
  ]
}
```

## 5. Versionado y compatibilidad

- Los registros de atlas siguen SemVer en `schemaVersion`.
- Introducir nuevas vistas o áreas es una actualización Minor si no invalida las referencias existentes.
- Renombrar o eliminar áreas existentes es una actualización Major y NO DEBE ocurrir en lanzamientos Minor.
- Pueden coexistir múltiples versiones del atlas; las entidades que las referencian DEBERÍAN especificar el `atlasId` previsto.

<!-- fds:pin atlas/v1.0.0/body-atlas.schema.json — the 1.1.0 revision note names the superseded version deliberately, because releases 1.0.0 through 1.4.0 declare body-atlas at 1.0.0 and a client pinned to any of them must keep resolving it. New work uses 1.1.0. -->

**1.1.0** agregó `license` y `attribution` opcionales en el recurso de una vista (§4.2), para que un atlas pueda declarar los términos de su ilustración como ya lo hacen los elementos multimedia. Ambos son adiciones opcionales a un objeto cerrado. Todo documento 1.0.0 sigue siendo válido sin cambios, pero un documento 1.1.0 que use cualquiera de los dos campos es rechazado por el esquema 1.0.0, y eso es lo que lo convierte en una versión y no en una edición. `atlas/v1.0.0/body-atlas.schema.json` sigue publicado y congelado. Los lanzamientos 1.0.0 a 1.4.0 declaran body-atlas en 1.0.0 y siguen resolviéndose, y el lanzamiento 1.5.0 es el primero que lo declara en 1.1.0.

## 6. Guía de implementación

### 6.1. Referencias desde los músculos

Los músculos PUEDEN referenciar áreas del atlas para expresar mapas de calor (véase RFC‑003):
```json fds:fragment entity=muscle
{
  "heatmap": {
    "atlasId": "atlas.body.v1",
    "regions": [
      { "areaId": "thigh.left.anterior", "weight": 1.0 },
      { "areaId": "thigh.right.anterior", "weight": 1.0 }
    ]
  }
}
```

### 6.2. Agregación

Los consumidores PUEDEN combinar múltiples mapas de calor por `areaId` dentro del mismo `atlasId` usando `max(weight)` o una suma con tope `min(1.0, sum(weights))`.

### 6.3. Entrega de recursos
- Preferir SVG con IDs distintos y estables para las formas seleccionables.
- Usar URIs HTTPS; considerar cabeceras de caché y ETags.

## 7. Consideraciones de seguridad y privacidad
- Los registros de atlas no contienen PII; alojar los recursos de forma segura.
- Validar los selectores y los URIs; evitar la inyección de código a través de contenido SVG no confiable.
- `attribution` es texto no confiable que se muestra junto a la ilustración. Renderizarlo como texto plano y escaparlo; nunca interpretarlo como marcado.
- Una `license` es una afirmación del productor, no una concesión verificada. FDS no la comprueba.

## 8. Referencia del JSON Schema
- **Body Atlas**: `/specification/schemas/atlas/v1.1.0/body-atlas.schema.json`

## 8.1. Validación

Validar con Ajv (Draft 2020‑12):
```
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/atlas/v1.1.0/body-atlas.schema.json \
  -d specification/schemas/atlas/v1.1.0/body-atlas.example.json
```

## 9. Ejemplo

Véase `/specification/schemas/atlas/v1.1.0/body-atlas.example.json`.

## Conformidad

**Productores conformes:**

:::danger DEBE
- **DEBEN** emitir JSON que valide contra el esquema de Body Atlas para la `schemaVersion` declarada.
- **DEBEN** proporcionar `views[*].id` y `areas[*].id` estables.
:::

:::tip DEBERÍA
- **DEBERÍAN** preferir recursos SVG y selectores estables.
- **DEBERÍAN** declarar `license` en cada vista cuyos términos de recurso se conozcan, y `attribution` donde esos términos exijan crédito.
:::

**Consumidores conformes:**

:::danger DEBE
- **DEBEN** validar los datos de atlas entrantes.
- **DEBEN** resolver los pares de `viewId` y `selector` según cada vinculación de área.
- **NO DEBEN** tratar la ausencia de `license` como permiso para usar, modificar o redistribuir el recurso.
:::

:::tip DEBERÍA
- **DEBERÍAN** ignorar los campos opcionales desconocidos bajo `attributes` y `extensions`.
- **DEBERÍAN** conservar `license` y `attribution` sin cambios en cualquier transformación que traslade una vista, y mostrar o transmitir `attribution` dondequiera que muestren o redistribuyan el recurso.
:::

**Compatibilidad:**

:::danger DEBE
- Las adiciones opcionales (nuevas áreas/vistas) **NO DEBEN** romper a los consumidores.
- Eliminar o renombrar áreas es un cambio incompatible y requiere una versión **MAJOR**.
:::

## 10. Referencias
- [RFC‑003: Especificación del modelo de datos de músculos](./rfc-003-muscle-data-model.md)
- [RFC‑008: Especificación del modelo de datos de programas de entrenamiento](./rfc-008-program-data-model.md), §4.8 `authorship`
- Lista de licencias SPDX — https://spdx.org/licenses/

---

Aviso de copyright  
Copyright (c) 2025 VITNESS.
Este documento está sujeto a los derechos, licencias y restricciones contenidos en el VITNESS Open Standards License Agreement. Véase `/specification/VITNESS Open Standards License Agreement.md`.
