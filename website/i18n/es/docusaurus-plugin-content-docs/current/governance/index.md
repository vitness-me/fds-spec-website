---
title: Gobernanza
description: Cómo se evoluciona, revisa y lanza el Fitness Data Standard (FDS)
sidebar_position: 1
---

# Fitness Data Standard de VITNESS — Gobernanza

Este documento describe cómo se evoluciona, revisa y lanza el Fitness Data Standard (FDS).

## Principios rectores

Son restricciones sobre lo que FDS aceptará, no una descripción de lo que hoy contiene. Obligan a los contribuidores: una propuesta que viole uno de ellos se rechaza por principio, por bien diseñada que esté. Cada exclusión que sigue es deliberada — una decisión con una razón, no un vacío a la espera de llenarse.

1. **FDS describe el dominio, nunca a la persona.** La identidad del atleta, el peso corporal, las repeticiones máximas (1RM) y cualquier resultado ejecutado o registrado quedan intencionalmente fuera de la especificación central y no se agregarán a ella. Un contribuidor no puede introducir un campo que transporte un valor personal o que identifique a un titular de los datos. Esta es la restricción que permite compartir, almacenar en caché, replicar y diferenciar libremente un documento FDS: no transporta nada que requiera consentimiento, una revisión de privacidad ni un acuerdo de tratamiento de datos.

2. **Prescripción, no rendimiento.** FDS modela lo que se pretende — el plan, la sesión, la prescripción — y, por diseño, nunca lo que realmente ocurrió. Un contribuidor no puede agregar resultados registrados a una entidad central. Registrar el rendimiento tiene un titular de los datos, y por lo tanto hereda las obligaciones del principio 1; espera a un modelo de consentimiento, no a trabajo de esquemas.

3. **Un formato, no un protocolo.** FDS es un formato de datos. La autenticación, la autorización y el transporte se dejan intencionalmente a los proveedores que lo sirven; el endpoint de descubrimiento dice qué se sirve, no quién puede leerlo. Un contribuidor no puede agregar semántica de control de acceso o de transporte a un esquema.

4. **Congelado significa congelado.** Los bytes de un esquema publicado nunca cambian. Un contribuidor no puede editar un esquema lanzado; un cambio se publica como una nueva versión junto a él, y una versión que un lanzamiento anterior todavía nombra sigue sirviéndose incluso después de ser sustituida. Esto es deliberado: un consumidor que obtuvo una URL ayer debe recibir el mismo documento hoy.

5. **Aditivo por defecto; los cambios incompatibles son raros y notorios.** Dentro de una versión mayor, los cambios agregan y aclaran — no eliminan ni restringen. Un contribuidor que proponga un cambio incompatible carga con el costo de un lanzamiento mayor, con notas de migración. La retrocompatibilidad es una promesa deliberada, no una cortesía.

6. **Las características especulativas se rechazan.** Cada adición suma complejidad que luego carga todo implementador. Un contribuidor que proponga un campo debe mostrar un caso real de intercambio que este habilite; "alguien podría quererlo" no es suficiente, por diseño. Un núcleo pequeño es una característica, no una limitación.

Cuando una capacidad propuesta es real pero no pertenece al núcleo — incluida cualquiera que toque datos personales — vive como una extensión en el espacio de nombres `x:<vendor>`, permanentemente fuera del núcleo congelado. La [hoja de ruta](/docs/governance/roadmap) registra cómo estos principios deciden qué se publica y qué no.

## Neutralidad y custodia

*¿Será este estándar capturado por un solo proveedor?* Es la primera pregunta que debe hacerse a un estándar publicado por una empresa, y merece una respuesta directa antes que un silencio tranquilizador.

FDS está bajo la custodia de sus editores (ver Roles). Hoy eso es, en la práctica, un único mantenedor, con origen en VITNESS; no existe una fundación independiente ni un comité multiproveedor, y afirmar cualquiera de las dos cosas sería falso. Lo que limita la captura no es un órgano de gobernanza que aún no existe: es la estructura del propio estándar, y estas garantías operan ahora, bajo custodia única:

- **El estándar publicado no puede revocarse ni alterarse en silencio.** Cada esquema está congelado en una URL estable (principio 4); sus bytes no pueden cambiar bajo los pies de un implementador, y una versión que un lanzamiento anterior nombra sigue sirviéndose incluso una vez sustituida. Un custodio no puede quitar aquello de lo que un consumidor ya depende.
- **Todo ocurre a la vista.** La especificación, sus esquemas, su historia y su proceso son públicos y están abiertamente licenciados. No hay un fork privado donde viva el estándar "real"; un contribuidor ve, y puede hacer un fork de, exactamente lo mismo que ve un custodio.
- **La evolución es aditiva y razonada.** Los cambios que afectan la compatibilidad o la semántica ponderan con mayor peso la retroalimentación de implementadores del mundo real (ver Proceso de decisión), y los cambios incompatibles cargan con el costo de un lanzamiento mayor. Un custodio no puede remodelar a bajo costo el estándar alrededor de un producto.

Estas verificaciones son deliberadamente estructurales, para que la neutralidad no dependa de confiar en el custodio.

Se espera que la forma de tomar decisiones cambie a medida que lleguen los adoptantes. La dirección prevista es mover la autoridad real hacia los implementadores que dependen del estándar — de modo que un cambio no pueda imponerse sobre la objeción de quienes construyen conforme a él. El mecanismo específico — por ejemplo, requerir el asentimiento explícito de implementadores independientes antes de que un cambio se incorpore — **aún no está decidido**, y no se resolverá unilateralmente: es en sí mismo un cambio de gobernanza, hecho a la vista bajo el proceso de Enmiendas descrito más abajo. Hasta entonces, esta sección declara con claridad dónde reside la autoridad — en un custodio único, limitado por la estructura anterior — en lugar de describir un comité que no se reúne.

## Roles
- Editores: custodios de la especificación que mantienen los RFC, los esquemas y los lanzamientos. Los editores facilitan las discusiones y aseguran el cumplimiento del proceso.
- Contribuidores: cualquier persona que proponga o mejore RFC, esquemas, ejemplos y documentación mediante issues/PR.
- Implementadores: proveedores y desarrolladores que construyen conforme a la especificación; su retroalimentación es crítica para la interoperabilidad práctica.

## Proceso de decisión
- Por defecto: consenso tácito (lazy consensus) — el silencio es consentimiento — tras una ventana de revisión mínima de 5 días hábiles para los cambios sustantivos.
- Escalamiento: si el consenso no es claro, los editores convocan una votación ligera entre editores; decide la mayoría simple.
- Ponderación de aportes: la retroalimentación de implementadores del mundo real se enfatiza para los cambios que afectan la compatibilidad o la semántica.

## Ciclo de vida de los RFC
1. Borrador: la propuesta se redacta y se envía como PR bajo `specification/rfc/` usando la plantilla de RFC.
2. En revisión: discusión abierta; los editores solicitan cambios; los ejemplos y los esquemas deben validar.
3. Aceptado: aprobado y fusionado; se le asigna una versión objetivo de la especificación (p. ej., 1.0.0) y se le da seguimiento en el CHANGELOG.
4. Obsoleto: sustituido por un RFC más reciente; permanece disponible durante toda la versión mayor.

Notas:
- Los cambios que alteran campos requeridos o rompen la validación son Mayores.
- Las adiciones opcionales y las aclaraciones son Menores.
- Las correcciones editoriales son Parche.

## Gestión de esquemas y lanzamientos
- Cada RFC DEBE enlazar a su JSON Schema y a sus ejemplos correspondientes.
- Los esquemas DEBEN incluir `$id`, `$schema` y un `title` claro con contexto de versión.
- Los lanzamientos siguen SemVer y se registran en `specification/governance/CHANGELOG.md`.
- Las declaraciones de obsolescencia incluyen plazos y guías de migración dentro del RFC correspondiente.

## Registro de extensiones (ligero)
- Las extensiones de proveedor usan el espacio de nombres `x:<vendor>`.
- Los patrones populares o convergentes PUEDEN proponerse para estandarización mediante un RFC nuevo o enmendado.
- Los editores curan un documento opcional de registro de extensiones para catalogar claves y semánticas de uso extendido.

## Política de cambios incompatibles
- Los nuevos campos requeridos, la restricción de enumeraciones o la eliminación de estructuras previamente válidas requieren un lanzamiento mayor.
- Los cambios mayores incluyen notas de migración y, cuando es factible, guías de mapeo automatizado.

## Seguridad y divulgación responsable
- Reportar los posibles problemas de seguridad de forma privada a los editores (el contacto de seguridad está por publicarse).
- No abrir issues públicos para vulnerabilidades no divulgadas.

## Reuniones
- Asíncronas por defecto (issues/PR). Pueden programarse sesiones de trabajo ad hoc para temas complejos; los resúmenes se publican de forma pública.

## Enmiendas
- Los cambios de gobernanza se proponen mediante PR y requieren la aprobación de los editores.
