---
title: 'RFC-004: Modelo de datos de categorías musculares'
description: Modelo de datos estandarizado para sistemas de categorización y agrupación muscular
sidebar_position: 4
keywords: [muscle category, grouping, data model, json schema, interoperability, rfc]
---

# RFC-004: Especificación del modelo de datos de categorías musculares

**Estado**: Borrador
**Versión**: 0.1.0
**Fecha**: 2025-09-09
**Autores**: Equipo VITNESS
**Categoría**: Standards Track

## Resumen

Esta especificación define un modelo de datos estandarizado para la información de categorías musculares, con el fin de habilitar la interoperabilidad y la portabilidad de datos entre aplicaciones y plataformas de fitness. Este RFC establece los requisitos estructurales para los datos de categorías musculares, a la vez que permite que las plataformas mantengan sus propios sistemas de agrupación y jerarquías de categorización.

## 1. Introducción

### 1.1. Antecedentes

Las aplicaciones de fitness requieren definiciones consistentes de categorías musculares para la organización de sesiones de entrenamiento, la estructura de programas de entrenamiento y la visualización del seguimiento del progreso. Actualmente, cada plataforma mantiene sistemas de agrupación muscular y jerarquías de categorización separados, lo que crea fragmentación de datos y limita la interoperabilidad.

### 1.2. Objetivos

Esta especificación busca:
1. Definir los requisitos estructurales para el intercambio de datos de categorías musculares
2. Habilitar la migración fluida de datos de categorías musculares entre aplicaciones de fitness
3. Admitir atributos de categorización específicos de cada plataforma mediante mecanismos de extensión
4. Establecer patrones consistentes de identificación y clasificación de categorías musculares
5. Proporcionar una implementación de referencia en JSON Schema para la validación

### 1.3. Alcance

**Dentro del alcance:**
- Estructura de datos central de la categoría muscular y campos obligatorios
- Mecanismos de extensión para datos de entrenamiento específicos de cada plataforma
- Definiciones de JSON Schema y reglas de validación
- Referencias de medios y documentación de la categoría muscular
- Soporte de internacionalización para los nombres de categorías

**Fuera del alcance:**
- Metodologías de entrenamiento o sistemas de programación específicos
- Análisis biomecánico y patrones de movimiento (RFC futuro)
- Programación de entrenamientos individuales y periodización
- Monitoreo en tiempo real de la carga de entrenamiento y la recuperación

## 2. Terminología

- **Categoría muscular**: Agrupación lógica de músculos relacionados con fines de entrenamiento y organización
- **Datos canónicos**: Información identificativa estandarizada (nombre, slug, alias)
- **Clasificación**: Categorización flexible mediante etiquetas
- **Extensión**: Datos específicos de una plataforma que no rompen la interoperabilidad
- **Versión del esquema**: Versión semántica que indica la compatibilidad del modelo de datos

## 3. Requisitos estructurales centrales

### 3.1. Campos obligatorios

:::danger DEBE
Todos los datos de categorías musculares conformes **DEBEN** incluir estos campos:
:::

```json fds:document entity=muscle-category
{
  "schemaVersion": "1.0.0",
  "id": "cat.legs",
  "canonical": {
    "name": "Legs",
    "slug": "legs"
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

```json fds:fragment entity=muscle-category partial
{
  "canonical": {
    "localized": [
      { "lang": "sr", "name": "Noge" }
    ]
  },
  "classification": {
    "tags": ["major-group", "compound-movements"]
  },
  "media": [],
  "attributes": {
    "complexity": "high",
    "trainingPriority": "essential"
  }
}
```

### 3.3. Mecanismos de extensión

Dos puntos de extensión para datos específicos de cada plataforma:

#### 3.3.1. Attributes (extensiones estructuradas)
Para extensiones comunes que podrían llegar a estandarizarse:
```json fds:fragment entity=muscle-category
{
  "attributes": {
    "complexity": "high",
    "trainingPriority": "essential"
  }
}
```

#### 3.3.2. Extensions (específicas de la plataforma)
Para estructuras de datos complejas únicas de una plataforma:
```json fds:fragment entity=muscle-category
{
  "extensions": {
    "x:programming": {
      "weeklyVolume": "high",
      "recoveryTime": "48-72hrs"
    }
  }
}
```

## 4. Tipos y estructuras de referencia

### 4.1. Información canónica

`canonical` transporta la identidad de la categoría — nombre para mostrar, slug, y alias y nombres localizados opcionales. Los nombres de categorías son los que aparecen con mayor frecuencia en una interfaz de usuario, lo que hace que la localización sea aquí más visible que en cualquier otra parte del catálogo.

```json fds:fragment entity=muscle-category
{
  "canonical": {
    "name": "Legs",
    "slug": "legs",
    "localized": [
      { "lang": "sr", "name": "Noge" }
    ]
  }
}
```

### 4.2. Estructura de clasificación

`classification` transporta `tags` para el filtrado — `major-group`, por ejemplo, distingue el puñado de agrupaciones de nivel superior de las más finas. Las etiquetas no tienen consecuencia estructural: un consumidor que no reconoce una la ignora.

```json fds:fragment entity=muscle-category
{
  "classification": {
    "tags": ["major-group", "compound-movements"]
  }
}
```

### 4.3. Referencias de medios

`media` sigue la definición compartida del RFC-001 — típicamente un ícono o una ilustración que representa el grupo.

```json fds:fragment entity=muscle-category
{
  "media": [
    {
      "type": "image",
      "uri": "https://cdn.example.com/categories/legs-overview.jpg"
    }
  ]
}
```

## 5. Versionado y compatibilidad

### 5.1. Versionado del esquema

Siguiendo el versionado semántico:
- **Major**: Cambios incompatibles en los campos obligatorios
- **Minor**: Nuevos campos opcionales o valores de enumeración
- **Patch**: Actualizaciones de documentación y validación

### 5.2. Reglas de compatibilidad

- Todos los datos válidos en la versión X.Y.Z deben seguir siendo válidos en X.Y+1.0
- Los nuevos campos obligatorios deben proporcionar valores predeterminados razonables
- Los campos obsoletos siguen siendo funcionales durante toda la versión major
- Las rutas de migración deben documentarse para los cambios de versión major

### 5.3. Ejemplo de evolución del esquema

Versión 1.0.0 → 1.1.0 (agregando el campo opcional hierarchy):
```json fds:ignore a hypothetical next version illustrating how an optional field arrives; no published muscle-category schema has hierarchy
{
  "schemaVersion": "1.1.0",
  "id": "cat.legs",
  "canonical": { "name": "Legs", "slug": "legs" },
  "hierarchy": {
    "parentId": "cat.lower-body",
    "level": 2,
    "order": 1
  }
}
```

## 6. Guía de implementación

### 6.1. Integración de plataformas

Las plataformas que implementen este estándar deberían:

1. **Mantener modelos internos**: Conservar los sistemas de agrupación muscular y las categorizaciones existentes
2. **Conformidad en la exportación**: Proporcionar los datos de categorías musculares en formato RFC-004 para la portabilidad
3. **Traducción en la importación**: Mapear los datos RFC-004 entrantes a las estructuras internas
4. **Uso de extensiones**: Usar el espacio de nombres `extensions` para datos específicos de la plataforma

### 6.2. Flujo de migración de datos

```mermaid
graph LR
    A[Platform A] --> B[RFC-004 Export]
    B --> C[Validation]
    C --> D[Platform B Import]
    D --> E[Internal Mapping]
```

1. La plataforma de origen exporta las categorías musculares en formato RFC-004
2. Validación de los datos contra el JSON Schema
3. La plataforma de destino importa y mapea a su modelo interno
4. Las extensiones personalizadas se manejan según las capacidades de la plataforma

## 7. Consideraciones de seguridad y privacidad

- Esta especificación define únicamente el formato de datos
- Las implementaciones deben validar contra el JSON Schema
- El contenido generado por usuarios en las extensiones debería sanearse
- Seguir las prácticas de seguridad estándar para la transmisión de datos

## 8. Referencia del JSON Schema

JSON Schema completo disponible en:
- **Muscle Category**: `/specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json`

## Agregación de mapas de calor (informativo)

Las visualizaciones de categorías musculares DEBERÍAN derivarse agregando los mapas de calor de los músculos que las componen. Combinar las regiones por `areaId` dentro del mismo `atlasId` (véase RFC-003, mapa de calor mediante el atlas corporal). Estrategias recomendadas:
- Agregación por máximo por región: `weight = max(weights)`.
- O suma normalizada con tope en 1.0: `weight = min(1.0, sum(weights))`.

Los productores DEBERÍAN evitar publicar mapas de calor de categoría separados en el núcleo; de ser necesario, PUEDEN proporcionarse sobrescrituras específicas de la plataforma bajo `extensions`.

## 8.1. Validación

Validar con Ajv (Draft 2020-12):

```
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json \
  -d specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.example.json
```

## 9. Ejemplo de implementación

### 9.1. Registro completo de la categoría muscular Legs

Basado en la implementación de referencia (`/specification/schemas/muscle/muscle-category/v1.0.0/muscle-category.example.json`):

```json fds:document entity=muscle-category
{
  "schemaVersion": "1.0.0",
  "id": "cat.legs",
  "canonical": { 
    "name": "Legs", 
    "slug": "legs",
    "localized": [
      { "lang": "sr", "name": "Noge" }
    ]
  },
  "classification": {
    "tags": ["major-group", "compound-movements"]
  },
  "media": [],
  "attributes": {
    "complexity": "high",
    "trainingPriority": "essential"
  },
  "extensions": {
    "x:programming": {
      "weeklyVolume": "high",
      "recoveryTime": "48-72hrs"
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
interface RFC004MuscleCategory {
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
  classification?: {
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
function importMuscleCategory(rfc004Data: RFC004MuscleCategory) {
  const category = {
    id: rfc004Data.id,
    name: rfc004Data.canonical.name,
    slug: rfc004Data.canonical.slug,
    aliases: rfc004Data.canonical.aliases || [],
    tags: rfc004Data.classification?.tags || [],
    attributes: rfc004Data.attributes || {}
  };

  // Handle programming extensions
  if (rfc004Data.extensions?.['x:programming']) {
    category.programming = rfc004Data.extensions['x:programming'];
  }

  return category;
}
```

## 10. Referencias

## Conformidad

**Productores conformes:**

:::danger DEBE
- **DEBEN** emitir JSON que valide contra el esquema de Muscle Category para la `schemaVersion` declarada.
- **DEBEN** usar UUIDv4 para todos los identificadores en datos de producción (p. ej., el `id` de la categoría). Los IDs cortos de ejemplo en este RFC son solo ilustrativos.
- **DEBEN** poblar todos los campos obligatorios y respetar las enumeraciones y la estructura.
:::

:::tip DEBERÍA
- **DEBERÍAN** incluir marcas de tiempo RFC 3339 en UTC en `metadata`.
:::

**Consumidores conformes:**

:::danger DEBE
- **DEBEN** validar los datos de categoría entrantes contra la versión de esquema apropiada.
- **DEBEN** ignorar las claves desconocidas en `attributes` y `extensions`.
:::

:::tip DEBERÍA
- **DEBERÍAN** tolerar campos opcionales adicionales introducidos en versiones minor más recientes.
- **DEBERÍAN** rechazar datos con campos obligatorios ausentes o enumeraciones inválidas.
:::

**Compatibilidad:**

:::danger DEBE
- Los campos opcionales agregados en versiones minor **NO DEBEN** romper a los consumidores; los consumidores **DEBERÍAN** ignorar los campos opcionales desconocidos.
- Los nuevos campos obligatorios son un cambio **MAYOR** y requieren actualizaciones coordinadas.
:::

---

Recursos adicionales:
- Política de identificadores y UUID: `/specification/README.md#identifiers-ids`
- Convenciones de i18n y slugs: `/specification/i18n-and-slugs.md`
- Política de extensiones y guía del registro: `/specification/extension-registry.md`


### 10.1. Referencias normativas
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [RFC 3339: Date/Time](https://tools.ietf.org/html/rfc3339)
- [RFC-001: Especificación del modelo de datos de ejercicios](./rfc-001-exercise-data-model.md)
- [RFC-002: Especificación del modelo de datos de equipamiento](./rfc-002-equipment-data-model.md)
- [RFC-003: Especificación del modelo de datos de músculos](./rfc-003-muscle-data-model.md)

### 10.2. Referencias informativas
- Convenciones de agrupación muscular de las ciencias del ejercicio
- Metodologías de organización de programas de entrenamiento

---

**Aviso de copyright**  
Copyright (c) 2025 VITNESS.
Este documento está sujeto a los derechos, licencias y restricciones contenidos en el VITNESS Open Standards License Agreement. Véase `/specification/VITNESS Open Standards License Agreement.md`.
