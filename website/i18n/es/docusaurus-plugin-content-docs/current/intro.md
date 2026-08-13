---
title: Bienvenida a FDS
description: El Fitness Data Standard (FDS) habilita el intercambio interoperable de datos del dominio del fitness entre aplicaciones
sidebar_position: 1
keywords: [fitness, datos, estándar, ejercicio, interoperabilidad, json-schema]
---

# Fitness Data Standard (FDS)

Le damos la bienvenida a la documentación del **Fitness Data Standard (FDS)**. FDS es un estándar abierto e interoperable para intercambiar datos del dominio del fitness entre aplicaciones y plataformas.

## Propósito

Habilitar la **portabilidad de datos** y la **interoperabilidad** entre aplicaciones de fitness proporcionando:

- JSON Schemas normativos para las entidades centrales del fitness
- RFC de alta calidad con ejemplos y guías de implementación
- Puntos de extensión flexibles para necesidades específicas de cada plataforma
- Gestión estandarizada de metadatos y del ciclo de vida

## Alcance actual

<!-- fds:count rfcs=8 -->
**Dentro del alcance** — 8 RFC publicados:

- **Modelo de datos de ejercicio** (RFC-001)
- **Entidades de catálogo**: equipamiento (RFC-002), músculos (RFC-003), categorías de músculos (RFC-004), atlas corporal (RFC-005)
- **Primitivas de prescripción** (RFC-006): carga, repeticiones, tempo, descanso, zonas de intensidad, esquemas de series y reglas de progresión
- **Modelo de datos de sesión de entrenamiento** (RFC-007): una sesión prescrita, como bloques de elementos con un modo de ejecución por bloque
- **Modelo de datos de programa de entrenamiento** (RFC-008): un cronograma de referencias a sesiones de entrenamiento a lo largo del tiempo

**Fuera del alcance** — por decisión, no por omisión:

- **Datos personales**: la identidad del atleta, el peso corporal, las repeticiones máximas (1RM) y lo que realmente se ejecutó
- **Autenticación y autorización**: un formato de datos, no un protocolo
- **Selección generada de ejercicios**: un día de programa referencia una sesión de entrenamiento que existe

No transportar valores personales es lo que hace que todo lo demás sea portable: un catálogo, una sesión o un plan pueden publicarse, almacenarse en caché, replicarse y diferenciarse libremente precisamente porque ninguno de ellos describe a una persona. Véase la [hoja de ruta](./governance/roadmap) para conocer lo que cuesta cada exclusión.

## Inicio rápido

### Para implementadores

1. **Consultar** las [especificaciones](./specifications/rfc-001-exercise-data-model) para entender los modelos de datos
2. **Explorar** los [JSON Schemas](./schemas/exercise) con visores interactivos
3. **Validar** los datos contra los esquemas (ver la [guía de validación](./getting-started/quick-validation))
4. **Extender** mediante el [registro de extensiones](./core-concepts/extensions) para necesidades personalizadas

### Para contribuidores

1. **Revisar** el proceso de [gobernanza](./governance)
2. **Leer** la [guía de contribución](./governance/contributing)
3. **Proponer** mejoras mediante el proceso de RFC
4. **Unirse** a la comunidad en [GitHub](https://github.com/vitness-me/fds-spec-website)

## Estructura de la documentación

- **[Primeros pasos](./getting-started/overview)** - Visión general, inicio rápido de validación, política de identificadores
- **[Conceptos centrales](./core-concepts/internationalization)** - i18n, métricas, extensiones, descubrimiento
- **[Especificaciones](./specifications/rfc-001-exercise-data-model)** - RFC detallados para cada entidad
- **[Esquemas](./schemas/exercise)** - Visores interactivos de JSON Schema con ejemplos
- **[Ejemplos](./examples)** - Visión general de los ejemplos
- **[Gobernanza](./governance)** - Proceso de decisión, contribución, registro de cambios

## Características principales

### Versionado semántico
FDS sigue el versionado semántico (X.Y.Z) con reglas estrictas de compatibilidad:
- **Mayor**: cambios incompatibles en campos requeridos
- **Menor**: adiciones retrocompatibles
- **Parche**: cambios no funcionales (erratas, ediciones)

### Identificadores UUID
Todos los identificadores de producción **DEBEN** ser cadenas UUIDv4 para:
- IDs de ejercicio
- IDs de equipamiento, músculo y categoría
- Referencias entre entidades

### Extensiones flexibles
Dos puntos de extensión estructurados:
- **`attributes`**: pares clave/valor planos para extensiones comunes
- **`extensions`**: estructuras anidadas, con ámbito por proveedor, para datos complejos

### Ciclo de vida de estados
Las entidades incluyen `metadata.status` para la gestión del ciclo de vida:
- `draft` → `review` → `active` → `inactive` / `deprecated`

## Más información

- [Leer la visión general completa](./getting-started/overview)
- [Entender los identificadores](./getting-started/identifiers)
- [Consultar el RFC de ejercicio](./specifications/rfc-001-exercise-data-model)
- [Explorar los esquemas de forma interactiva](./schemas/exercise)

## Licencia

FDS se publica bajo el [VITNESS Open Standards License Agreement](./license).

---

**¿Todo listo para comenzar?** Ir a la [guía de primeros pasos](./getting-started/overview) →
