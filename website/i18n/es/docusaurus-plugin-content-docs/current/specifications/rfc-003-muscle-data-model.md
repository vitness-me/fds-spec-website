---
title: 'RFC-003: Modelo de datos de músculo'
description: Modelo de datos estandarizado para la información anatómica de músculos con soporte de visualización de mapas de calor
sidebar_position: 3
keywords: [muscle, anatomy, data model, json schema, heatmap, interoperability, rfc]
---

# RFC-003: Especificación del modelo de datos de músculo

**Estado**: Borrador
**Versión**: 0.1.0
**Fecha**: 2025-09-09
**Autores**: Equipo VITNESS
**Categoría**: Standards Track

## Resumen

Esta especificación define un modelo de datos estandarizado para la información de músculos, con el fin de habilitar la interoperabilidad y la portabilidad de datos entre aplicaciones y plataformas de fitness. Este RFC establece los requisitos estructurales para los datos de músculos y permite a la vez que las plataformas mantengan sus propias clasificaciones anatómicas y taxonomías musculares.

## 1. Introducción

### 1.1. Antecedentes

Las aplicaciones de fitness requieren definiciones de músculos consistentes para la asignación de músculos objetivo a los ejercicios, la programación de sesiones de entrenamiento y el seguimiento del progreso. Actualmente, cada plataforma mantiene taxonomías musculares y clasificaciones anatómicas separadas, lo que crea fragmentación de datos y limita la interoperabilidad.

### 1.2. Objetivos

Esta especificación se propone:
1. Definir los requisitos estructurales para el intercambio de datos de músculos
2. Habilitar la migración fluida de datos de músculos entre aplicaciones de fitness
3. Admitir atributos anatómicos específicos de cada plataforma mediante mecanismos de extensión
4. Establecer patrones consistentes de identificación y clasificación de músculos
5. Proporcionar una implementación de referencia en JSON Schema para la validación

### 1.3. Alcance

**Dentro del alcance:**
- Estructura básica de los datos de músculo y campos obligatorios
- Clasificación de músculos, incluida la información regional y de lateralidad
- Mecanismos de extensión para datos anatómicos específicos de plataforma
- Definiciones de JSON Schema y reglas de validación
- Referencias de medios y documentación de los músculos
- Soporte de internacionalización para los nombres de músculos

**Fuera del alcance:**
- Taxonomías anatómicas o clasificaciones médicas específicas
- Análisis biomecánico y patrones de activación muscular (RFC futuro)
- Datos de lesiones y rehabilitación
- Medición de la activación muscular en tiempo real

## 2. Terminología

- **Músculo**: Tejido contráctil anatómico que genera fuerza y produce movimiento
- **Datos canónicos**: Información identificativa estandarizada (nombre, slug, alias)
- **Clasificación**: Datos de categorización anatómica (categoría, región, lateralidad)
- **Región**: Agrupación por ubicación anatómica (upper-front, lower-back, etc.)
- **Lateralidad**: Característica de simetría (bilateral, unilateral, left, right)
- **Extensión**: Datos específicos de plataforma que no rompen la interoperabilidad
- **Versión de esquema**: Versión semántica que indica la compatibilidad del modelo de datos

## 3. Requisitos estructurales fundamentales

### 3.1. Campos obligatorios

:::danger DEBE
Todos los datos de músculo conformes **DEBEN** incluir estos campos:
:::

```json fds:document entity=muscle
{
  "schemaVersion": "1.0.0",
  "id": "mus.quadriceps",
  "canonical": {
    "name": "Quadriceps",
    "slug": "quadriceps"
  },
  "classification": {
    "categoryId": "cat.legs",
    "region": "lower-front"
  },
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-09-03T00:00:00Z",
    "source": "vitness.registry",
    "status": "active"
  }
}
```

### 3.2. Campos estándar opcionales

Campos opcionales comúnmente admitidos que mejoran la interoperabilidad:

```json fds:fragment entity=muscle partial
{
  "canonical": {
    "aliases": ["Quads"],
    "localized": [
      { "lang": "sr", "name": "Kvadriceps" }
    ]
  },
  "classification": {
    "laterality": "bilateral",
    "tags": ["major-muscle", "lower-body"]
  },
  "heatmap": {
    "atlasId": "atlas.body.v1",
    "regions": [
      { "areaId": "thigh.left.anterior", "weight": 1.0 },
      { "areaId": "thigh.right.anterior", "weight": 1.0 }
    ]
  },
  "media": [],
  "attributes": {
    "fiberType": "mixed",
    "size": "large",
    "function": "knee-extension"
  }
}
```

### 3.3. Mecanismos de extensión

Dos puntos de extensión para datos específicos de plataforma:

#### 3.3.1. Atributos (extensiones estructuradas)
Para extensiones comunes que pueden llegar a estandarizarse:
```json fds:fragment entity=muscle
{
  "attributes": {
    "fiberType": "mixed",
    "size": "large",
    "function": "knee-extension"
  }
}
```

#### 3.3.2. Extensiones (específicas de plataforma)
Para estructuras de datos complejas y exclusivas de una plataforma:
```json fds:fragment entity=muscle
{
  "extensions": {
    "x:anatomy": {
      "origin": "Anterior superior iliac spine, femur",
      "insertion": "Patella, tibial tuberosity",
      "innervation": "Femoral nerve"
    }
  }
}
```

## 4. Tipos y estructuras de referencia

### 4.1. Información canónica

`canonical` transporta la identidad del músculo — nombre para mostrar, slug, alias y nombres localizados. La nomenclatura anatómica es donde los alias se ganan su lugar: el mismo músculo es un "latissimus dorsi" para un clínico y un "lat" para todos en el gimnasio, y un catálogo que reconoce solo uno de los dos falla la mitad de sus búsquedas.

```json fds:fragment entity=muscle
{
  "canonical": {
    "name": "Quadriceps",
    "slug": "quadriceps",
    "aliases": ["Quads"],
    "localized": [
      { "lang": "sr", "name": "Kvadriceps" }
    ]
  }
}
```

### 4.2. Estructura de clasificación

`classification` sitúa el músculo en el catálogo. `categoryId` es el grupo de categoría muscular al que pertenece (RFC-004) y es lo que hace posible la agregación de volumen por grupo sin una tabla de búsqueda. `tags` son etiquetas de forma libre que no conllevan ninguna consecuencia estructural.

```json fds:fragment entity=muscle
{
  "classification": {
    "categoryId": "cat.legs",
    "region": "lower-front",
    "laterality": "bilateral",
    "tags": ["major-muscle", "lower-body"]
  }
}
```

### 4.3. Clasificación regional

El campo `region` — de tipo `regionGroup` en el esquema — sigue regiones anatómicas estandarizadas:
- **upper-front**: Pecho, deltoides frontales, bíceps
- **upper-back**: Dorsales, deltoides posteriores, romboides, trapecios
- **lower-front**: Cuádriceps, flexores de cadera
- **lower-back**: Isquiotibiales, glúteos, erectores espinales
- **core**: Abdominales, oblicuos, transverso abdominal
- **full-body**: Músculos que abarcan varias regiones
- **n/a**: Clasificación regional no aplicable o sin definir

### 4.4. Clasificación de lateralidad

El campo `laterality` describe características de simetría:
- **bilateral**: El músculo existe simétricamente en ambos lados del cuerpo
- **unilateral**: El músculo existe en un solo lado
- **left**: Músculo específico del lado izquierdo
- **right**: Músculo específico del lado derecho
- **n/a**: No aplicable, o músculos de la línea media

### 4.5. Referencias de medios

`media` sigue la definición compartida de RFC-001 — típicamente una ilustración anatómica.

```json fds:fragment entity=muscle
{
  "media": [
    {
      "type": "image",
      "uri": "https://cdn.example.com/anatomy/quadriceps.jpg"
    }
  ]
}
```

### 4.6. Mapa de calor mediante el atlas corporal

Los registros de músculo PUEDEN incluir un objeto `heatmap` opcional que referencia un atlas corporal. Un atlas corporal define vistas (p. ej., anterior/posterior) y áreas con nombre vinculadas a formas dentro de un recurso (típicamente SVG). Los músculos referencian estas áreas con pesos de intensidad para habilitar una visualización interoperable.

Estructura:
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

Notas:
- `regions` enumera las áreas del atlas que este músculo cubre; cada entrada empareja un `areaId` con un `weight`.
- `atlasId` referencia un elemento de atlas (véase el esquema de atlas corporal) y DEBERÍA ser un UUID en conjuntos de datos de producción.
- `areaId` DEBE corresponder a un `areas[*].id` dentro del atlas referenciado.
- `weight` es `0..1` y representa la intensidad/cobertura relativa; el valor predeterminado es `1.0`.
- Los consumidores DEBERÍAN acotar los pesos a `[0,1]` y mapearlos a escalas de color/opacidad según corresponda.

## 5. Versionado y compatibilidad

### 5.1. Versionado de esquemas

Siguiendo el versionado semántico:
- **Mayor**: Cambios incompatibles en los campos obligatorios
- **Menor**: Nuevos campos opcionales o valores de enumeración
- **Parche**: Actualizaciones de documentación y validación

### 5.2. Reglas de compatibilidad

- Todos los datos válidos en la versión X.Y.Z deben seguir siendo válidos en X.Y+1.0
- Los nuevos campos obligatorios deben proporcionar valores predeterminados razonables
- Los campos obsoletos permanecen funcionales durante toda la versión mayor
- Las rutas de migración deben documentarse para los cambios de versión mayor

### 5.3. Ejemplo de evolución del esquema

Versión 1.0.0 → 1.1.0 (adición de un campo opcional biomecánico):
```json fds:ignore a hypothetical next version illustrating how an optional field arrives; no published muscle schema has biomechanics
{
  "schemaVersion": "1.1.0",
  "id": "mus.quadriceps",
  "canonical": { "name": "Quadriceps", "slug": "quadriceps" },
  "biomechanics": {
    "primaryActions": ["knee-extension", "hip-flexion"],
    "forceDirection": "linear"
  }
}
```

## 6. Guía de implementación

### 6.1. Integración de plataformas

Las plataformas que implementan este estándar deberían:

1. **Mantener modelos internos**: Conservar los catálogos de músculos y las clasificaciones anatómicas existentes
2. **Cumplimiento en la exportación**: Proporcionar los datos de músculos en formato RFC-003 para la portabilidad
3. **Traducción en la importación**: Mapear los datos RFC-003 entrantes a las estructuras internas
4. **Uso de extensiones**: Usar el espacio de nombres `extensions` para datos específicos de plataforma

### 6.2. Flujo de trabajo de migración de datos

```mermaid
graph LR
    A[Platform A] --> B[RFC-003 Export]
    B --> C[Validation]
    C --> D[Platform B Import]
    D --> E[Internal Mapping]
```

1. La plataforma de origen exporta los músculos en formato RFC-003
2. Validación de los datos contra el JSON Schema
3. La plataforma de destino importa y mapea al modelo interno
4. Las extensiones personalizadas se gestionan según las capacidades de la plataforma

## 7. Consideraciones de seguridad y privacidad

- Esta especificación define únicamente el formato de los datos
- Las implementaciones deben validar contra el JSON Schema
- El contenido generado por usuarios en las extensiones debería sanitizarse
- Seguir las prácticas de seguridad estándar para la transmisión de datos

## 8. Referencia de JSON Schema

El JSON Schema completo está disponible en:
- **Músculo**: `/specification/schemas/muscle/v1.0.0/muscle.schema.json`
- **Atlas corporal**: `/specification/schemas/atlas/v1.0.0/body-atlas.schema.json`

## 8.1. Validación

Validar con Ajv (Draft 2020-12):

```
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/muscle/v1.0.0/muscle.schema.json \
  -d specification/schemas/muscle/v1.0.0/muscle.example.json
```

## 9. Ejemplo de implementación

### 9.1. Registro completo del músculo cuádriceps

Basado en la implementación de referencia (`/specification/schemas/muscle/v1.0.0/muscle.example.json`):

```json
{
  "schemaVersion": "1.0.0",
  "id": "mus.quadriceps",
  "canonical": { 
    "name": "Quadriceps", 
    "slug": "quadriceps",
    "aliases": ["Quads"],
    "localized": [
      { "lang": "sr", "name": "Kvadriceps" }
    ]
  },
  "classification": { 
    "categoryId": "cat.legs", 
    "region": "lower-front", 
    "laterality": "bilateral"
  },
  "heatmap": {
    "atlasId": "atlas.body.v1",
    "regions": [
      { "areaId": "thigh.left.anterior", "weight": 1.0 },
      { "areaId": "thigh.right.anterior", "weight": 1.0 }
    ]
  },
  "media": [],
  "attributes": {
    "fiberType": "mixed",
    "size": "large",
    "function": "knee-extension"
  },
  "extensions": {
    "x:anatomy": {
      "origin": "Anterior superior iliac spine, femur",
      "insertion": "Patella, tibial tuberosity",
      "innervation": "Femoral nerve"
    }
  },
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-09-03T00:00:00Z",
    "source": "vitness.registry",
    "status": "active"
  }
}
```

### 9.2. Mapeo de importación de plataforma (ejemplo en TypeScript)

```typescript
interface RFC003Muscle {
  schemaVersion: string;
  id: string;
  canonical: {
    name: string;
    slug: string;
    aliases?: string[];
    localized?: Array<{
      lang: string;
      name: string;
      aliases?: string[];
    }>;
  };
  classification: {
    categoryId: string;
    region: "upper-front" | "upper-back" | "lower-front" | "lower-back" | "core" | "full-body" | "n/a";
    laterality?: "left" | "right" | "bilateral" | "unilateral" | "n/a";
    tags?: string[];
  };
  attributes?: Record<string, any>;
  extensions?: Record<string, any>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    source: string;
    status: string;
  };
}

// Platform-specific import mapping
function importMuscle(rfc003Data: RFC003Muscle) {
  const muscle = {
    id: rfc003Data.id,
    name: rfc003Data.canonical.name,
    slug: rfc003Data.canonical.slug,
    aliases: rfc003Data.canonical.aliases || [],
    categoryId: rfc003Data.classification.categoryId,
    region: rfc003Data.classification.region,
    laterality: rfc003Data.classification.laterality,
    tags: rfc003Data.classification.tags || [],
    attributes: rfc003Data.attributes || {}
  };

  // Handle anatomical extensions
  if (rfc003Data.extensions?.['x:anatomy']) {
    muscle.anatomy = rfc003Data.extensions['x:anatomy'];
  }

  return muscle;
}
```

## 10. Referencias

## Conformidad

**Productores conformes:**

:::danger DEBE
- **DEBEN** emitir JSON que valide contra el esquema de músculo para la `schemaVersion` declarada.
- **DEBEN** usar UUIDv4 para todos los identificadores en datos de producción (p. ej., el `id` del músculo). Los ID cortos de ejemplo en este RFC son solo ilustrativos.
- **DEBEN** poblar todos los campos obligatorios y respetar las enumeraciones y la estructura.
:::

:::tip DEBERÍA
- **DEBERÍAN** incluir marcas de tiempo UTC RFC 3339 en `metadata`.
:::

**Consumidores conformes:**

:::danger DEBE
- **DEBEN** validar los datos de músculo entrantes contra la versión de esquema apropiada.
- **DEBEN** ignorar las claves desconocidas en `attributes` y `extensions`.
:::

:::tip DEBERÍA
- **DEBERÍAN** tolerar campos opcionales adicionales introducidos en versiones menores más recientes.
- **DEBERÍAN** rechazar datos con campos obligatorios ausentes o enumeraciones inválidas.
:::

**Compatibilidad:**

:::danger DEBE
- Los campos opcionales añadidos en versiones menores **NO DEBEN** romper a los consumidores; los consumidores **DEBERÍAN** ignorar los campos opcionales desconocidos.
- Los nuevos campos obligatorios son un cambio **MAYOR** y requieren actualizaciones coordinadas.
:::

---

Recursos adicionales:
- Política de identificadores y UUID: `/specification/README.md#identifiers-ids`
- Convenciones de i18n y slugs: `/specification/i18n-and-slugs.md`
- Política de extensiones y guía del registro: `/specification/extension-registry.md`


### 10.1. Referencias normativas
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [RFC 3339: Fecha/hora](https://tools.ietf.org/html/rfc3339)
- [RFC-001: Especificación del modelo de datos de ejercicio](./rfc-001-exercise-data-model.md)
- [RFC-002: Especificación del modelo de datos de equipamiento](./rfc-002-equipment-data-model.md)
 - [RFC-005: Especificación del modelo de datos de atlas corporal](./rfc-005-body-atlas-data-model.md)

### 10.2. Referencias informativas
- Estándares de terminología anatómica
- Sistemas de clasificación muscular en las ciencias del ejercicio
- Bases de datos de función muscular biomecánica

---

Aviso de copyright  
Copyright (c) 2025 VITNESS.
Este documento está sujeto a los derechos, licencias y restricciones contenidos en el VITNESS Open Standards License Agreement. Véase `/specification/VITNESS Open Standards License Agreement.md`.

## Guía para consumidores (agregación de mapas de calor)

Los consumidores PUEDEN agregar los mapas de calor de varios músculos para su visualización (p. ej., para mostrar un ejercicio o una sesión de entrenamiento). Combinar las regiones por `areaId` dentro del mismo `atlasId` usando una de estas dos opciones:
- Agregación por máximo: `weight = max(weights)` (simple y estable), o
- Suma normalizada con tope: `weight = min(1.0, sum(weights))` (enfatiza el solapamiento).

Cuando los datos referencian atlas distintos, agregar por separado por `atlasId`. Los sistemas de renderizado DEBERÍAN proporcionar valores predeterminados razonables para las escalas de color y el mapeo de opacidad.
