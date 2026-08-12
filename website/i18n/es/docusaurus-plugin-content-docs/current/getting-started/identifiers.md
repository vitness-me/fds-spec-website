---
title: Identificadores
description: Política de UUID e identificadores para FDS
sidebar_position: 3
---

# Política de identificadores

## Identificadores de producción

**Política normativa:**
- Todos los identificadores de recursos en datos de producción **DEBEN** ser cadenas UUIDv4
- Esto aplica a identificadores como `exerciseId`, el `id` de equipamiento/músculo/categoría y cualquier referencia entre entidades

## Identificadores de documentación

**Política de documentación:**
- Por legibilidad, los ejemplos en los RFC pueden usar ID ilustrativos como `eq.barbell`, `mus.quadriceps`, `cat.legs`
- Estos **NO** son ID de producción válidos y se usan solo para demostrar relaciones y estructura

## Conformidad

**Productores conformes:**
- DEBEN emitir identificadores UUIDv4 en conjuntos de datos reales

**Consumidores conformes:**
- DEBEN validar los identificadores según la versión de esquema activa
- DEBERÍAN rechazar identificadores que no sean UUID en contextos de producción

## Slugs frente a ID

- Los **slugs** siguen siendo identificadores canónicos legibles por humanos y son distintos de los ID
- Los **UUID** se usan para referencias y relaciones a nivel de sistema

## Referencias externas

**URN y referencias externas:**
- Los ejemplos de relaciones PUEDEN mostrar URN (p. ej., `urn:slug:front-squat`) para ilustrar relaciones que no se basan en ID
- Los productores DEBERÍAN preferir referencias por UUID cuando estén disponibles
- Los URN PUEDEN usarse para referencias laxas entre sistemas cuando no se conoce el UUID

### Mapeo de referencias externas (`externalRefs`)

Todas las entidades de FDS admiten un arreglo opcional `externalRefs` dentro del objeto `metadata`. Esto permite mapear identificadores entre distintos sistemas y plataformas.

**Estructura del esquema:**
```json fds:fragment entity=exercise
{
  "externalRefs": [
    { "system": "string", "id": "string" }
  ]
}
```

**Requisitos de los campos:**
- `system` (requerido): un identificador estable de la plataforma o sistema externo
- `id` (requerido): el identificador de la entidad dentro de ese sistema externo

**Casos de uso:**
- **Migración de datos**: mapear ID heredados a los nuevos UUID de FDS durante la importación
- **Sincronización multiplataforma**: seguir la misma entidad entre distintas aplicaciones de fitness
- **Integraciones de terceros**: referenciar entidades en API o bases de datos externas
- **Pistas de auditoría**: mantener enlaces a los sistemas de origen para la procedencia de los datos

**Buenas prácticas para nombrar `system`:**
- Usar identificadores estables y bien documentados
- Considerar la notación de DNS inverso para garantizar unicidad (p. ej., `com.example.app`)
- Mantener los nombres de sistema consistentes en todo el conjunto de datos
- Documentar los identificadores de sistema para los consumidores

**Ejemplo:**
```json fds:fragment entity=exercise
{
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-09-03T00:00:00Z",
    "status": "active",
    "externalRefs": [
      { "system": "platform-a", "id": "ex-back-squat-001" },
      { "system": "legacy-system", "id": "squat_barbell_back" }
    ]
  }
}
```

Esta estructura está disponible en todas las entidades de FDS: ejercicio, equipamiento, músculo, categoría de músculo y atlas corporal
