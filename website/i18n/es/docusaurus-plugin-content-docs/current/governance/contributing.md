---
title: Contribuir
description: Cómo contribuir al Fitness Data Standard (FDS)
sidebar_position: 2
---
# Contribuir al Fitness Data Standard (FDS)

¡Gracias por ayudar a mejorar la interoperabilidad de los datos de fitness! Este documento explica cómo proponer cambios, agregar RFC y actualizar esquemas y ejemplos.

## Formas de contribuir
- Abrir un issue que describa un problema, una propuesta o retroalimentación de implementación.
- Enviar un PR que mejore la documentación, los ejemplos o los materiales de gobernanza.
- Proponer o enmendar un RFC con ejemplos concretos y un plan de validación.

## Cambios en los RFC
1. Hacer un fork del repositorio y crear una rama de característica.
2. Redactar o modificar un RFC bajo `specification/rfc/` usando un RFC existente como plantilla.
3. Incluir:
   - Planteamiento del problema, objetivos (dentro/fuera del alcance), terminología
   - Requisitos normativos y estructuras de referencia
   - Guía de extensiones y consideraciones de seguridad/privacidad
   - Referencias a JSON Schema y ejemplos completos
   - Guía de conformidad para productores/consumidores
4. Abrir un PR y solicitar la revisión de los editores.

## Cambios en esquemas y ejemplos
- Redactar el cambio en `specification/schema-sources/` y luego ejecutar `npm run build:schemas`. `specification/schemas/` se genera a partir de esas fuentes; nunca editar a mano un `*.schema.json` allí. `npm run check:schemas` reconstruye y compara, de modo que fallan tanto una edición manual como un cambio de fuente confirmado sin reconstruir.
- Un esquema publicado está congelado: sus bytes nunca cambian una vez lanzado, porque un consumidor que lo obtuvo ayer debe recibir el mismo documento hoy. Un cambio en uno se publica como un nuevo directorio de versión junto a él, y la compilación se niega a alterar un archivo congelado.
- Los archivos de ejemplo `*.example.json` y el `README.md` junto a un esquema generado se escriben a mano; esos sí se editan en su lugar.
- Proporcionar al menos un ejemplo completo por esquema que demuestre un uso real.
- Validar los ejemplos localmente (Ajv Draft 2020‑12):

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```

## Política de identificadores
- Los datos de producción DEBEN usar identificadores UUIDv4 para todos los IDs de entidades y referencias.
- Los ejemplos PUEDEN usar IDs ilustrativos (p. ej., `eq.barbell`) por legibilidad, claramente marcados como solo ilustrativos.

## Guías de estilo
- Mantener el JSON válido (sin comentarios ni comas finales) y mínimo cuando sea posible.
- Usar BCP 47 para las etiquetas de idioma y ASCII en minúsculas para los slugs (`[a-z0-9-]`).
- Preferir un lenguaje conciso y normativo (MUST/SHOULD/MAY) en los RFC.

## Versionado y cambios incompatibles
- Los nuevos campos requeridos o los cambios incompatibles requieren una versión mayor.
- Las adiciones opcionales (campos, valores de enumeración donde se permita) son menores.
- Las correcciones editoriales son parches.
- Actualizar `specification/governance/CHANGELOG.md` con un resumen de los cambios.

### Las afirmaciones de versión se verifican

`npm run check:versions` lee `specification/releases.json` — que se genera a partir de los esquemas publicados — y contrasta contra él cada afirmación de versión del repositorio. Una URL de esquema debe resolver a algo publicado; un número de lanzamiento debe nombrar un lanzamiento real; una afirmación sobre "el lanzamiento actual" debe nombrar el actual. Ejecutarlo antes de abrir un PR.

Tres anotaciones permiten decir algo que la verificación no puede deducir por sí sola. Todas son texto plano dentro de la sintaxis de comentario que el archivo ya use, de modo que sobreviven al reflejo byte a byte de las páginas.

<!-- fds:pin workout/v1.0.0/workout.schema.json — named by the worked example below, which shows how to pin the superseded workout version. A marker inside a fenced block is shown rather than made, so this page needs a real one. -->

**Fijar una versión anterior.** Una URL en una versión publicada pero que ya no es la actual es una referencia deliberada o una referencia obsoleta, y ambas se ven idénticas. Decir cuál es:

```markdown
<!-- fds:pin workout/v1.0.0/workout.schema.json — releases 1.2.0 and 1.3.0 declare
     workout at 1.0.0, so a client pinned to either must keep resolving this URL. -->
```

La referencia se escribe exactamente como resuelve — `<directory>/v<version>/<file>`, o un nombre de archivo de registro. Un pin cubre el archivo en el que aparece, necesita una razón real y es un error en cuanto nada en ese archivo lo referencia. Una versión *retirada* no puede fijarse: `exercise/v1.0.0` y `equipment/v1.0.0` no se sirven en absoluto, así que no hay nada a lo que apuntar.

**Afirmar un conteo.** Un número en una oración no es automáticamente una afirmación sobre este repositorio — "ocho repeticiones a cien kilogramos" no es un conteo de nada. Marcar los que sí lo son:

```markdown
<!-- fds:count schemas=10 entities=7 -->
Ten schemas are published. Seven are entities, …
```

El valor se verifica contra el repositorio en disco, y además debe aparecer en la oración circundante, en letras o en dígitos, para que el marcador no pueda dejar de describir en silencio el texto que anota. Ejecutar `npm run check:versions` con un nombre de métrica desconocido para ver la lista completa.

No marcar conteos en `CHANGELOG.md`. Una entrada del registro de cambios describe un lanzamiento pasado, y fijarla al árbol de hoy haría fallar un registro histórico exacto.

**Declarar que un documento es completo.** Todo lo anterior verifica algo que el documento *dice*. Un documento también puede estar equivocado por no decir nada en absoluto: `SCHEMAS.md` se publicó sin mención alguna de `program` y todas las verificaciones siguieron en verde, porque no había ninguna oración que pudiera estar equivocada. Cuando un documento enumera un conjunto completo, decirlo, y el conjunto se toma entonces del manifiesto:

```markdown
<!-- fds:covers schemas -->
<!-- fds:covers entities -->
<!-- fds:covers releases -->
<!-- fds:covers rfcs -->
<!-- fds:covers packages -->
```

`schemas` cubre el archivo completo: cada URL de esquema publicada debe aparecer en algún lugar de él. Los otros cuatro anotan la tabla inmediatamente debajo del marcador — la tabla de entidades y versiones que publica un lanzamiento, la tabla indexada por lanzamiento, la tabla con una fila por RFC en `specification/rfc/` y la tabla con una fila por paquete publicable bajo `packages/`. La prosa de las demás columnas sigue siendo del autor; qué filas existen, no. El orden no se verifica, así que ordenar cada tabla como mejor se lea.

Agregar una entidad o crear un lanzamiento hará fallar estas verificaciones hasta que los documentos se pongan al día. Ese es el punto: la alternativa es una página que deja de describir el estándar en silencio.

## Licencia
- Al contribuir, usted acepta que sus contribuciones se licencien bajo los términos del VITNESS Open Standards License Agreement.
