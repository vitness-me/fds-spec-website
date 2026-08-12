---
title: Internacionalización
sidebar_position: 1
---

# Internacionalización (i18n) y convenciones de slugs

Esta guía especifica las reglas de idioma y de slugs usadas en las entidades de FDS (ejercicios, equipamiento, músculos, categorías de músculos).

## Etiquetas de idioma
- Usar etiquetas de idioma BCP 47 para `localized[*].lang` (p. ej., `en`, `en-GB`, `sr`).
- Las etiquetas DEBERÍAN ser tan específicas como haga falta, pero no más (preferir `en` sobre `en-US` salvo que sea realmente necesario).
- Los productores DEBERÍAN proporcionar un locale predeterminado (típicamente inglés) dentro de `canonical`.

## Buenas prácticas de localización
- Proporcionar traducciones completas de los campos requeridos de `canonical` al agregar una entrada de locale.
- Evitar traducciones parciales que degraden la experiencia de usuario.
- Mantener los alias apropiados para cada idioma y evitar duplicar los nombres canónicos en el mismo idioma.

## Reglas de slugs
- Conjunto de caracteres: solo ASCII en minúsculas `[a-z0-9-]`.
- Longitud: al menos 2 caracteres.
- Sin espacios, sin guiones al inicio ni al final; comprimir los guiones consecutivos en uno solo.
- Derivación: normalizar a NFC, eliminar los diacríticos, pasar a minúsculas, reemplazar espacios y puntuación por guiones, recortar.

## Estabilidad y unicidad
- Los slugs DEBERÍAN ser estables una vez publicados, para preservar referencias y marcadores.
- Los slugs DEBEN ser únicos dentro de su tipo de entidad (p. ej., los slugs de equipamiento son únicos entre el equipamiento).
- Si ocurre una colisión de slugs, preferir un sufijo desambiguador mínimo (`-v2`, `-alt`, o una etiqueta específica del dominio como `-barbell`).

## Ejemplos
| Nombre                    | Slug            |
|--------------------------|-----------------|
| "Back Squat"              | `back-squat`    |
| "Sentadilla trasera"      | `sentadilla-trasera` |
| "Čučanj sa šipkom"        | `cucanj-sa-sipkom` |

## Respaldo recomendado
- Los consumidores DEBERÍAN implementar un respaldo de locale: `lang-region` → `lang` → predeterminado.
- Si no hay ninguna entrada localizada disponible, recurrir al `name` canónico.
