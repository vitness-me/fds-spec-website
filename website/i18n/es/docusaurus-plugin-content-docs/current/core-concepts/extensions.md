---
title: Extensiones
sidebar_position: 1
---

# Guía de política de extensiones y registro

Esta guía define cómo los proveedores extienden el Fitness Data Standard (FDS) sin romper la interoperabilidad, y cómo las extensiones comunes pueden promoverse hacia la estandarización.

## Objetivos
- Evitar colisiones de claves entre proveedores.
- Mantener las extensiones autodescriptivas y descubribles.
- Ofrecer una vía para estandarizar patrones ampliamente adoptados.

## Dónde extender
- `attributes`: pares clave/valor simples para extensiones ligeras que podrían promoverse.
- `extensions`: objetos con ámbito de proveedor para datos de dominio complejos.

## Reglas de espacios de nombres
- Usar el prefijo `x:` para indicar claves no estándar.
- Atributos: `x:<vendor>.<feature>` (p. ej., `x:vitness.stanceWidth`).
- Extensiones: `x:<vendor>` o `x:<vendor>.<domain>` (p. ej., `x:vitness`, `x:gym-management`).
- Elegir un `<vendor>` estable (el nombre de la empresa o DNS inverso como `x:org.vitness`). Mantenerlo consistente.
- No usar `fds:` ni claves sin prefijo para extensiones.

## Versionado de extensiones
- Mantener las cargas útiles de las extensiones retrocompatibles cuando sea posible.
- Si hay una ruptura, incluir una versión explícita dentro del espacio de nombres de la extensión (p. ej., `extensions: { "x:vitness": { "version": "2" } }`).

## Ejemplo
```json fds:fragment entity=exercise
{
  "attributes": {
    "x:vitness.stanceWidth": "shoulder-width",
    "x:org.example.videoQuality": "1080p"
  },
  "extensions": {
    "x:vitness": {
      "tempo": { "eccentric": 3, "isometric": 1, "concentric": 1 },
      "rangeOfMotion": { "standard": "hip-crease below knee" }
    },
    "x:gym-management": {
      "inventory": { "count": 5, "location": "free-weight-area" },
      "maintenance": { "lastInspection": "2025-08-15", "nextDue": "2025-11-15" }
    }
  }
}
```

## Comportamiento del consumidor
- DEBE ignorar las claves desconocidas en `attributes` y `extensions`.
- DEBERÍA validar los valores de las extensiones contra contratos locales si los conoce (opcional).

## Vía de promoción
1. Adopción: una extensión gana adopción entre múltiples implementadores independientes.
2. Propuesta: enviar un RFC para promover el concepto al esquema central o a una especificación de extensión estandarizada.
3. Revisión: los editores evalúan la semántica, los nombres y la compatibilidad.
4. Estandarización: si se acepta, la funcionalidad pasa al núcleo (lanzamiento menor) o a una extensión estandarizada con nombre.

## Resolución de colisiones
- Preferir claves de proveedor al estilo DNS inverso para reducir el riesgo de colisión.
- Si se descubre una colisión, coordinar mediante un issue o PR; los editores pueden sugerir renombrar o acotar el ámbito.

## Seguridad y privacidad
- No incluir secretos ni información personal identificable (PII) en las extensiones, salvo que la aplicación lo exija y estén protegidos en consecuencia.
- Tratar las URI y los medios de las extensiones con los mismos controles de transporte y autorización que los datos centrales.

