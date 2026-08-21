---
title: Visión general
description: Visión general completa del Fitness Data Standard (FDS)
sidebar_position: 1
---

# Visión general de FDS

El Fitness Data Standard (FDS) define un formato abierto e interoperable para intercambiar datos del dominio del fitness entre aplicaciones y plataformas.

## Propósito y alcance

Habilitar la portabilidad de datos y la interoperabilidad entre aplicaciones de fitness mediante:

- JSON Schemas normativos para las entidades centrales del fitness
- RFC de alta calidad con ejemplos y guías de implementación
- Taxonomías de plataforma flexibles a través de puntos de extensión bien definidos

### Alcance actual

<!-- fds:count rfcs=9 -->
**Dentro del alcance** — 9 RFC publicados:

- **Modelo de datos de ejercicio** (RFC-001)
- **Entidades de catálogo**: equipamiento (RFC-002), músculos (RFC-003), categorías de músculos (RFC-004), atlas corporal (RFC-005)
- **Primitivas de prescripción** (RFC-006) — carga, repeticiones, tempo, descanso, zonas de intensidad, esquemas de series y reglas de progresión, definidos una sola vez para que una serie signifique lo mismo dondequiera que aparezca
- **Modelo de datos de sesión de entrenamiento** (RFC-007) — una sesión prescrita, como bloques de elementos con un modo de ejecución por bloque
- **Modelo de datos de programa de entrenamiento** (RFC-008) — un cronograma de referencias a sesiones de entrenamiento a lo largo del tiempo, con ciclos, semanas, progresión y ramificación condicional
- **Integridad de las referencias entre entidades** (RFC-010) — qué deben contener las referencias que las entidades llevan unas a otras, para que un documento siga siendo legible sin resolverlas

**Fuera del alcance** — por decisión, no por omisión:

- **Datos personales**: la identidad del atleta, el peso corporal, las repeticiones máximas (1RM) y lo que realmente se ejecutó
- **Autenticación y autorización**: FDS es un formato de datos, no un protocolo
- **Selección generada de ejercicios**: un día de programa referencia una sesión de entrenamiento que existe, de modo que un plan puede leerse sin el generador que lo produjo

No transportar valores personales es lo que hace que todo lo demás sea portable. Un catálogo, una sesión o un plan pueden publicarse, almacenarse en caché, replicarse y diferenciarse libremente precisamente porque ninguno de ellos describe a una persona — y esa propiedad vale más que la comodidad de incluir un peso corporal en un documento. Registrar los resultados ejecutados, por lo tanto, espera a un modelo de consentimiento y privacidad, no a un diseño de esquema.

Véase la [hoja de ruta](/docs/governance/roadmap) para conocer lo que cuesta cada exclusión y lo que está en consideración.

## Versionado y compatibilidad

FDS sigue el Versionado Semántico para los lanzamientos de modelos de datos:

- **Mayor (X.0.0)**: cambios incompatibles en campos requeridos o en la semántica
- **Menor (0.Y.0)**: adiciones retrocompatibles (campos opcionales, nuevos valores de enumeración, aclaraciones de documentación)
- **Parche (0.0.Z)**: cambios no funcionales (erratas, ediciones, metadatos de esquema)

### Reglas de compatibilidad

- Los datos válidos en X.Y.Z DEBEN seguir siendo válidos en X.(Y+1).0
- Agregar nuevos campos requeridos constituye un cambio MAYOR
- Los campos obsoletos siguen siendo funcionales durante toda la versión mayor
- Los productores y consumidores DEBERÍAN usar `schemaVersion` para dirigir la validación y la lógica

## Conformidad

### Productor conforme

- DEBE producir JSON que valide contra el JSON Schema de FDS para el `schemaVersion` declarado
- DEBE usar UUIDv4 para todos los identificadores en datos de producción
- DEBE completar todos los campos requeridos y respetar las enumeraciones y las restricciones estructurales
- DEBERÍA incluir `schemaVersion` y mantener marcas de tiempo precisas en `metadata` (RFC 3339, UTC)

### Consumidor conforme

- DEBE validar los datos entrantes contra la versión de esquema apropiada
- DEBE ignorar los campos desconocidos bajo `attributes`/`extensions`
- DEBERÍA tolerar campos opcionales adicionales agregados en versiones menores más recientes
- DEBERÍA rechazar datos con campos requeridos faltantes o enumeraciones inválidas

## Próximos pasos

- [Entender los identificadores](/docs/getting-started/identifiers)
- [Guía de validación rápida](/docs/getting-started/quick-validation)
- [Consultar las especificaciones](/docs/specifications/rfc-001-exercise-data-model)
- [Explorar los esquemas](/docs/schemas/exercise)
