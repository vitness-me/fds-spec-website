---
title: Descubrimiento
sidebar_position: 1
---

# Especificación del endpoint de descubrimiento

Este documento define un endpoint HTTP de descubrimiento opcional que permite a los clientes descubrir la compatibilidad con FDS y las capacidades de exportación.

## Endpoint
- Método: GET
- Ruta: `/.well-known/fitness-data-spec`
- Content-Type: `application/json`
- Caché: se recomienda `Cache-Control: max-age=3600`

## Esquema de respuesta (informal)
```json fds:ignore a discovery document, defined by specification/discovery.md rather than by a published schema
{
  "spec_version": "1.4.0",
  "provider": "Acme Fitness Platform",
  "supported_entities": [
    "exercise",
    "equipment",
    "muscle",
    "muscle-category",
    "body-atlas",
    "workout",
    "program"
  ],
  "entity_versions": {
    "exercise": "1.1.0",
    "equipment": "1.1.0",
    "muscle": "1.0.0",
    "muscle-category": "1.0.0",
    "body-atlas": "1.0.0",
    "workout": "1.1.0",
    "program": "1.0.0"
  },
  "supported_extensions": ["x:vitness", "x:gym-management"],
  "export_endpoints": {
    "exercise": "/api/exercises/export/rfc001",
    "equipment": "/api/equipment/export/rfc002",
    "muscle": "/api/muscles/export/rfc003",
    "muscle-category": "/api/muscle-categories/export/rfc004",
    "body-atlas": "/api/atlas/export/rfc005",
    "workout": "/api/workouts/export/rfc007",
    "program": "/api/programs/export/rfc008"
  }
}
```

## Notas
- `spec_version` DEBE indicar el lanzamiento de FDS que el proveedor admite.
- `supported_extensions` DEBERÍA listar los espacios de nombres de proveedor anunciados; su omisión implica que no hay ninguno.
- Los `export_endpoints` son ilustrativos; los proveedores PUEDEN usar cualquier estructura de rutas. Los endpoints DEBERÍAN devolver NDJSON o arreglos JSON con un `schemaVersion` por registro.
- La autenticación y los límites de tasa quedan fuera del alcance; los proveedores DEBERÍAN documentar cualquier requisito.

## Un lanzamiento es un conjunto de versiones de entidades

`spec_version` nombra un lanzamiento. **No** es una versión que todas las entidades compartan, y un cliente que asuma que lo es solicitará URLs que nunca se publicaron.

Las entidades se versionan de forma independiente. El lanzamiento 1.4.0 publica exercise, equipment y workout en 1.1.0, mientras que muscle, muscle-category, body-atlas y program permanecen en 1.0.0. No existe `muscle/v1.4.0/` y nunca existirá a menos que muscle mismo cambie.

Una versión de entidad sustituida se sigue sirviendo. `workout/v1.0.0/` sigue publicada y sigue congelada, porque los lanzamientos 1.2.0 y 1.3.0 declaran workout en 1.0.0, y un cliente fijado a cualquiera de los dos debe poder seguir resolviéndola.

Los proveedores DEBERÍAN, por lo tanto, emitir `entity_versions`, mapeando cada entidad admitida a la versión de entidad que sirven. Un cliente que lo tiene puede construir las URLs de esquemas directamente. Un cliente que no lo tiene debe resolver el lanzamiento a sus versiones de entidades de alguna otra manera, y adivinar es el fallo que este campo existe para prevenir.

Esa otra manera está publicada: **https://spec.vitness.me/releases.json** es el manifiesto de lanzamientos, y mapea cada lanzamiento a las versiones de entidades y de biblioteca que ese lanzamiento nombra, junto con el estado de cada versión de esquema publicada — `current`, `superseded` o `withdrawn`. Se genera a partir de los esquemas publicados, de modo que es el mismo documento contra el que se verifica esta especificación. Un cliente que recibe un `spec_version` y nada más puede resolverlo allí en lugar de asumir.

A diferencia de un esquema, el manifiesto no está congelado. Gana un lanzamiento cada vez que FDS publica uno, y precisamente por eso conviene obtenerlo en lugar de copiarlo.

<!-- fds:covers releases -->

| Lanzamiento | Agrega |
|---|---|
| 1.0.0 | exercise, equipment, muscle, muscle-category, body-atlas |
| 1.1.0 | exercise y equipment pasan a 1.1.0 — vocabulario de métricas extendido y características de carga |
| 1.2.0 | workout |
| 1.3.0 | program |
| 1.4.0 | workout pasa a 1.1.0 — zonas de intensidad por serie y ajustes de máquina |

Incorporar una entidad es un lanzamiento nuevo aun cuando nada de lo existente haya cambiado, porque un lanzamiento nombra el *conjunto* que publica.

## La prescripción es una biblioteca, no una entidad

`prescription` se publica en `prescription/v1.0.0/prescription.schema.json` y define las primitivas de carga, repetición, tempo, descanso, zona y esquema de series que las sesiones de entrenamiento y los programas componen (RFC-006).

**NO DEBE** aparecer en `supported_entities`. Su raíz de esquema no valida nada por construcción — no existe un documento de prescripción que exportar, y un endpoint que ofreciera uno estaría respondiendo una pregunta que nadie hizo. Un proveedor que admite sesiones de entrenamiento ya admite la prescripción; eso es lo que significa admitir sesiones de entrenamiento.

## Las sesiones de entrenamiento y los programas referencian; no contienen

Un cliente que obtiene programas no recibirá las sesiones de entrenamiento con ellos. Un programa es un cronograma de referencias a sesiones de entrenamiento (RFC-008 §3.2), de modo que un proveedor que exporta programas **DEBE** exponer también las sesiones de entrenamiento que esos programas referencian, y un cliente **DEBERÍA** resolverlas antes de presentar un plan.

Los proveedores DEBERÍAN mantener `workout` en `supported_entities` siempre que `program` esté presente. Un proveedor que anuncia programas pero no sesiones de entrenamiento está anunciando documentos que nadie puede ejecutar.

## Lo que un endpoint de descubrimiento no transporta

Ningún atleta, ningún peso corporal, ningún máximo de entrenamiento, ningún dato ejecutado. FDS no modela a ninguna persona (D6), y un documento de descubrimiento describe las *capacidades* de un proveedor, no a sus usuarios.

Un proveedor que exporta programas está exportando plantillas. Los valores contra los que se resuelve un programa personalizado son contexto del invocador y viajan por separado — ver RFC-006 §5 y RFC-008 §8.
