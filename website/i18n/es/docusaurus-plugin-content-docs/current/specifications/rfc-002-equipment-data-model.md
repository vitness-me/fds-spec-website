---
title: 'RFC-002: Modelo de datos de equipamiento'
description: Modelo de datos estandarizado para el equipamiento de fitness que habilita la interoperabilidad entre plataformas
sidebar_position: 2
keywords: [equipment, data model, json schema, fitness, interoperability, rfc]
---

# RFC-002: Especificación del modelo de datos de equipamiento

**Estado**: Borrador
**Versión**: 0.1.0
**Fecha**: 2025-09-09
**Autores**: Equipo VITNESS
**Categoría**: Standards Track

## Resumen

Esta especificación define un modelo de datos estandarizado para la información de equipamiento de fitness, con el fin de habilitar la interoperabilidad y la portabilidad de datos entre aplicaciones y plataformas de fitness. Este RFC establece los requisitos estructurales para los datos de equipamiento y permite a la vez que las plataformas mantengan sus propios sistemas de categorización y taxonomías de equipamiento.

## 1. Introducción

### 1.1. Antecedentes

Las aplicaciones de fitness requieren definiciones de equipamiento consistentes para la categorización de ejercicios, la planificación de sesiones de entrenamiento y la gestión del inventario de gimnasios. Actualmente, cada plataforma mantiene taxonomías de equipamiento separadas, lo que crea fragmentación de datos y limita la interoperabilidad.

### 1.2. Objetivos

Esta especificación se propone:
1. Definir los requisitos estructurales para el intercambio de datos de equipamiento
2. Habilitar la migración fluida de datos de equipamiento entre aplicaciones de fitness
3. Admitir atributos de equipamiento específicos de cada plataforma mediante mecanismos de extensión
4. Establecer patrones consistentes de identificación y categorización del equipamiento
5. Proporcionar una implementación de referencia en JSON Schema para la validación

### 1.3. Alcance

**Dentro del alcance:**
- Estructura básica de los datos de equipamiento y campos obligatorios
- Mecanismos de extensión para datos de equipamiento específicos de plataforma
- Definiciones de JSON Schema y reglas de validación
- Referencias de medios y documentación del equipamiento
- Soporte de internacionalización para los nombres de equipamiento

**Fuera del alcance:**
- Taxonomías de equipamiento o catálogos de marcas específicos
- Mantenimiento del equipamiento y gestión de su ciclo de vida (RFC futuro)
- Datos de precios y de transacciones comerciales
- Disponibilidad del equipamiento en tiempo real o sistemas de reservas

## 2. Terminología

- **Equipamiento**: Herramientas, máquinas o accesorios físicos de fitness usados en la ejecución de ejercicios
- **Datos canónicos**: Información identificativa estandarizada (nombre, slug, alias, abreviaturas)
- **Clasificación**: Datos de categorización estructural mediante etiquetas flexibles
- **Extensión**: Datos específicos de plataforma que no rompen la interoperabilidad
- **Versión de esquema**: Versión semántica que indica la compatibilidad del modelo de datos
- **Atributos**: Almacenamiento flexible de clave-valor para propiedades específicas del equipamiento

## 3. Requisitos estructurales fundamentales

### 3.1. Campos obligatorios

:::danger DEBE
Todos los datos de equipamiento conformes **DEBEN** incluir estos campos:
:::

```json fds:document entity=equipment
{
  "schemaVersion": "1.1.0",
  "id": "eq.barbell",
  "canonical": {
    "name": "Barbell",
    "slug": "barbell"
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

```json fds:fragment entity=equipment partial
{
  "canonical": {
    "abbreviation": "BB",
    "aliases": ["Olympic Bar"],
    "localized": [
      { "lang": "sr", "name": "Sipka" }
    ]
  },
  "classification": {
    "tags": ["free-weight"]
  },
  "media": [
    {
      "type": "image",
      "uri": "https://example.com/barbell.jpg"
    }
  ]
}
```

### 3.3. Mecanismos de extensión

Dos puntos de extensión para datos específicos de plataforma:

#### 3.3.1. Atributos (extensiones estructuradas)
Para extensiones comunes que pueden llegar a estandarizarse:
```json fds:fragment entity=equipment
{
  "attributes": {
    "standardWeight": "20kg",
    "material": "steel",
    "length": "7ft"
  }
}
```

#### 3.3.2. Extensiones (específicas de plataforma)
Para estructuras de datos complejas y exclusivas de una plataforma:
```json fds:fragment entity=equipment
{
  "extensions": {
    "x:gym-management": {
      "inventory": {"count": 5, "location": "free-weight-area"},
      "maintenance": {"lastInspection": "2025-08-15", "nextDue": "2025-11-15"}
    }
  }
}
```

## 4. Tipos y estructuras de referencia

### 4.1. Información canónica

`canonical` transporta la identidad del equipamiento: un `name` para mostrar, un `slug` estable, una `description` opcional, una `abbreviation` opcional, `aliases` opcionales y entradas `localized` que dan el nombre en otros idiomas. Los nombres de equipamiento varían más por región que los nombres de ejercicios — el mismo rack es un "power rack", una "squat cage" y un "Kraftkäfig" —, así que los alias y la localización importan más aquí de lo que podría parecer. `abbreviation` transporta la forma corta usada en interfaces compactas — "DB" para una mancuerna, "KB" para una pesa rusa —, que de otro modo las implementaciones derivan adivinando.

```json fds:fragment entity=equipment
{
  "canonical": {
    "name": "Barbell",
    "slug": "barbell",
    "abbreviation": "BB",
    "aliases": ["Olympic Bar"],
    "localized": [
      { "lang": "sr", "name": "Sipka" }
    ]
  }
}
```

### 4.2. Estructura de clasificación

`classification` describe qué clase de implemento es este y cómo se comporta. `tags` son etiquetas de forma libre para filtrar y no conllevan ninguna consecuencia estructural.

```json fds:fragment entity=equipment
{
  "classification": {
    "tags": ["free-weight"]
  }
}
```

### 4.3. Referencias de medios

`media` sigue la definición compartida de RFC-001: una lista de recursos, cada uno con un tipo y un URI, que ilustran el implemento.

```json fds:fragment entity=equipment
{
  "media": [
    {
      "type": "image",
      "uri": "https://cdn.example.com/equipment/barbell.jpg"
    },
    {
      "type": "video",
      "uri": "https://cdn.example.com/equipment/barbell-overview.mp4"
    }
  ]
}
```


### 4.4. Características de carga

El objeto opcional `loading` describe cómo un implemento transporta la carga. Es la fuente autoritativa para el cálculo de discos y el redondeo de cargas.

```json fds:fragment entity=equipment
{
  "loading": {
    "increment": { "value": 2.5, "unit": "kg" },
    "stackBased": false
  }
}
```

| Campo | Tipo | Predeterminado | Significado |
|---|---|---|---|
| `increment.value` | number, > 0 | — | El paso de carga más pequeño utilizable |
| `increment.unit` | metric unit | — | La unidad en la que se expresa ese paso |
| `stackBased` | boolean | `false` | La carga se selecciona entre posiciones discretas de la torre en lugar de ensamblarse con peso libre |

`increment` es lo que hace realizable una carga calculada. Un programa que prescribe el 82.5% de una repetición máxima (1RM) de 100 kg pide 82.5 kg; que eso sea alcanzable depende del implemento. Una barra cargada con pares de discos de 1.25 kg lo alcanza; un rack de mancuernas con saltos de 2.5 kg no. Los consumidores DEBERÍAN redondear una carga calculada al múltiplo alcanzable más cercano de `increment.value` en lugar de presentar un número que no se puede cargar.

`stackBased: true` señala que las posiciones son discretas y no comparables entre instalaciones. El "pasador 7" de dos gimnasios no es la misma carga ni siquiera en torres nominalmente idénticas, así que una posición de la torre NO DEBERÍA tratarse como portable; la métrica `resistanceLevel` (unidad `level`) existe para registrarla como un ajuste opaco. Cuando una torre publica incrementos reales, `increment` sigue siendo la respuesta portable.

Esta es la contraparte de `exercise.loading` (RFC-001 §4.6): el ejercicio declara *si* un movimiento acepta carga; el equipamiento declara *en qué pasos*.

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

Versión 1.0.0 → 1.1.0 (adición de un campo opcional de certificación):
```json fds:ignore a hypothetical next version illustrating how an optional field arrives; no published equipment schema has certification
{
  "schemaVersion": "1.1.0",
  "id": "eq.barbell",
  "canonical": { "name": "Barbell", "slug": "barbell" },
  "certification": {
    "standard": "IWF",
    "validUntil": "2030-12-31",
    "certifiedBy": "International Weightlifting Federation"
  }
}
```

## 6. Guía de implementación

### 6.1. Integración de plataformas

Las plataformas que implementan este estándar deberían:

1. **Mantener modelos internos**: Conservar los catálogos de equipamiento y la categorización existentes
2. **Cumplimiento en la exportación**: Proporcionar los datos de equipamiento en formato RFC-002 para la portabilidad
3. **Traducción en la importación**: Mapear los datos RFC-002 entrantes a las estructuras internas
4. **Uso de extensiones**: Usar el espacio de nombres `extensions` para datos específicos de plataforma

### 6.2. Flujo de trabajo de migración de datos

```mermaid
graph LR
    A[Platform A] --> B[RFC-002 Export]
    B --> C[Validation]
    C --> D[Platform B Import]
    D --> E[Internal Mapping]
```

1. La plataforma de origen exporta el equipamiento en formato RFC-002
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
- **Equipamiento**: `/specification/schemas/equipment/v1.1.0/equipment.schema.json`

## 8.1. Validación

Validar con Ajv (Draft 2020-12):

```
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/equipment/v1.1.0/equipment.schema.json \
  -d specification/schemas/equipment/v1.1.0/equipment.example.json
```

## 9. Ejemplo de implementación

### 9.1. Registro completo del equipamiento barra

Basado en la implementación de referencia (`/specification/schemas/equipment/v1.1.0/equipment.example.json`):

```json fds:document entity=equipment
{
  "schemaVersion": "1.1.0",
  "id": "eq.barbell",
  "canonical": { 
    "name": "Barbell", 
    "slug": "barbell", 
    "aliases": ["Olympic Bar"],
    "abbreviation" : "BB",
    "localized": [
      { "lang": "sr", "name": "Sipka" }
    ]
  },
  "classification": { 
    "tags": ["free-weight"]
  },
  "media": [
    {
      "type": "image",
      "uri": "https://example.com/barbell.jpg"
    }
  ],
  "attributes": {
    "standardWeight": "20kg",
    "material": "steel",
    "length": "7ft"
  },
  "extensions": {
    "x:gym-management": {
      "inventory": {"count": 5, "location": "free-weight-area"},
      "maintenance": {"lastInspection": "2025-08-15", "nextDue": "2025-11-15"}
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
interface RFC002Equipment {
  schemaVersion: string;
  id: string;
  canonical: {
    name: string;
    slug: string;
    abbreviation?: string;
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
function importEquipment(rfc002Data: RFC002Equipment) {
  const equipment = {
    id: rfc002Data.id,
    name: rfc002Data.canonical.name,
    slug: rfc002Data.canonical.slug,
    abbreviation: rfc002Data.canonical.abbreviation,
    aliases: rfc002Data.canonical.aliases || [],
    tags: rfc002Data.classification?.tags || [],
    attributes: rfc002Data.attributes || {}
  };

  // Handle gym management extensions
  if (rfc002Data.extensions?.['x:gym-management']) {
    equipment.inventory = rfc002Data.extensions['x:gym-management'].inventory;
    equipment.maintenance = rfc002Data.extensions['x:gym-management'].maintenance;
  }

  return equipment;
}
```

## 10. Referencias

## Conformidad

**Productores conformes:**

:::danger DEBE
- **DEBEN** emitir JSON que valide contra el esquema de equipamiento para la `schemaVersion` declarada.
- **DEBEN** usar UUIDv4 para todos los identificadores en datos de producción (p. ej., el `id` del equipamiento). Los ID cortos de ejemplo en este RFC son solo ilustrativos.
- **DEBEN** poblar todos los campos obligatorios y respetar las enumeraciones y la estructura.
:::

:::tip DEBERÍA
- **DEBERÍAN** incluir marcas de tiempo UTC RFC 3339 en `metadata`.
:::

**Consumidores conformes:**

:::danger DEBE
- **DEBEN** validar los datos de equipamiento entrantes contra la versión de esquema apropiada.
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

Aviso de copyright  
Copyright (c) 2025 VITNESS.
Este documento está sujeto a los derechos, licencias y restricciones contenidos en el VITNESS Open Standards License Agreement. Véase `/specification/VITNESS Open Standards License Agreement.md`.

---

Recursos adicionales:
- Política de identificadores y UUID: `/specification/README.md#identifiers-ids`
- Convenciones de i18n y slugs: `/specification/i18n-and-slugs.md`
- Guía de emparejamiento de métricas: `/specification/metrics-guide.md`
- Política de extensiones y guía del registro: `/specification/extension-registry.md`
- Endpoint de descubrimiento: `/specification/discovery.md`

### 10.1. Referencias normativas
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [RFC 3339: Fecha/hora](https://tools.ietf.org/html/rfc3339)
- [RFC-001: Especificación del modelo de datos de ejercicio](./rfc-001-exercise-data-model.md)

### 10.2. Referencias informativas
- ISO 20957 (equipamiento de entrenamiento estacionario)
- Estándares de seguridad y certificaciones de equipamiento

---

**Aviso de copyright**  
Copyright (c) 2025 VITNESS. Este documento está sujeto a los derechos, licencias y restricciones contenidos en el VITNESS Open Standards License Agreement.
