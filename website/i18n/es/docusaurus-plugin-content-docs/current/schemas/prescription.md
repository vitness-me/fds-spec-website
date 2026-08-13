---
title: Primitivas de prescripción
description: Cuánta carga, cuántas repeticiones, a qué tempo, cuánto descanso — las definiciones compartidas que las sesiones de entrenamiento y los programas componen
sidebar_position: 7
---

# Primitivas de prescripción (v1.0.0)

La prescripción responde cuatro preguntas sobre una serie: **cuánta carga, cuántas repeticiones, a qué tempo y cuánto descanso.** Todo lo que en FDS prescribe trabajo compone estas definiciones, de modo que una serie dentro de una sesión de entrenamiento independiente y la misma serie dentro de un programa de doce semanas significan exactamente lo mismo.

## Esto es una biblioteca, no una entidad

Cada uno de los demás esquemas de esta sección describe un documento que se puede sostener: un ejercicio, una sesión de entrenamiento, un programa. Este no.

`prescription.schema.json` publica una biblioteca `$defs` y **su raíz no valida nada** — es literalmente `{"not": {}}`. No existe tal cosa como un documento de prescripción. No se puede exportar uno, y un validador apuntado a la raíz rechazará cualquier cosa que se le dé, correctamente.

Aquello contra lo que se valida es una *definición en su interior*. Cada archivo de ejemplo publicado nombra la definición que ejemplifica, y CI los valida de esa manera, no contra la raíz.

El transformador no incluye este esquema por la misma razón. Valida entidades, y una biblioteca de definiciones no lo es.

**URL:** `https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json`

## Las definiciones

| Definición | Responde |
|---|---|
| `loadTarget` | Cuánta carga — 13 métodos, desde un kilogramo absoluto hasta un RPE que el atleta resuelve bajo la barra |
| `loadRange` | Una carga expresada como una banda en lugar de un punto |
| `repTarget` | Cuántas repeticiones — o cuánto tiempo, qué distancia, cuántas calorías |
| `tempo` | A qué velocidad se ejecuta cada fase de una repetición |
| `tempoPhase` | Una fase de eso, cuando una pausa necesita su propia duración |
| `restSpec` | Cuánto descanso, y en qué límite se aplica |
| `restScope` | Si ese límite es una serie, un grupo o un bloque |
| `intensityZone` | Una zona en un sistema con nombre — frecuencia cardíaca, potencia, ritmo, percepción |
| `setScheme` | Un patrón con nombre a lo largo de las series, con sus parámetros |
| `progressionRule` | Cuándo cambia la prescripción, y cómo |

## Dos reglas que vale la pena leer antes de implementar

### Un método desconocido se ignora, nunca se adivina

Un consumidor que encuentra un `loadTarget.method` que no entiende **DEBE** ignorar ese objetivo y **DEBERÍA** advertir. No debe sustituirlo por un valor predeterminado, arrastrar la carga de la serie anterior ni inferir una a partir del contexto.

Esta regla es más fuerte que la de advertir-y-continuar que gobierna los clasificadores en el resto de FDS, y lo es deliberadamente. Un `exerciseType` no reconocido produce un ejercicio mal etiquetado. Una carga adivinada produce una barra que alguien intenta levantar.

La misma regla gobierna un `setScheme.pattern` que no se reconoce: no expandirlo. Expandir un patrón requiere conocer su semántica, y una expansión equivocada cambia el entrenamiento en lugar de simplemente no poder mostrarlo.

### La mayoría de las cargas no se pueden resolver solo con el documento

`70% 1RM` es una instrucción, no un peso. Se convierte en peso solo al combinarse con una repetición máxima (1RM) — un número que FDS deliberadamente no transporta, porque FDS no modela a ninguna persona.

Lo mismo vale para `percentBodyweight`, para los objetivos `relative` que referencian una sesión anterior, para los objetivos `autoregulated` que referencian el estado de ejecución, y para cada `intensityZone`, cuyas etiquetas carecen de significado sin límites personales.

Un consumidor que pretenda mostrar cargas absolutas debe poder aportar ese contexto para los métodos que encuentre, y **no debe fabricar lo que le falta**. Presentar la prescripción tal como está escrita — "70% 1RM" — es honesto y accionable. Un número fabricado no es ni lo uno ni lo otro.

RFC-006 §5 enumera, método por método, exactamente qué necesita cada uno y de dónde proviene.

## Por qué una unión discriminada con una rama comodín

`loadTarget`, `repTarget` y `restSpec` seleccionan cada uno una carga útil a partir de un campo `method` o `kind`. Esos campos no pueden ser cadenas abiertas: un discriminador abierto no selecciona ninguna rama, de modo que o todas las ramas coinciden o ninguna lo hace, y el documento no puede validar en absoluto.

Cada unión, por lo tanto, enumera sus miembros conocidos y agrega una rama final para los valores que esta versión no define — con esa rama excluyendo explícitamente los valores conocidos. Esa exclusión es estructural en ambas direcciones. Sin ella, un `{"method": "absolute", …}` correcto coincidiría con dos ramas y sería rechazado; peor aún, un método conocido *malformado* caería en la rama permisiva y validaría, que es la aprobación silenciosa que este estándar existe para prevenir.

Las implementaciones que extiendan estas uniones deben preservar ese carácter disjunto.

## Ejemplos resueltos

Se publican 69 archivos de ejemplo junto al esquema, uno por definición y uno por valor de discriminador, cada uno nombrado por lo que demuestra e indexado en [el README de los archivos de ejemplo](https://spec.vitness.me/schemas/prescription/v1.0.0/README.md).

También se incluyen ejemplos negativos — documentos que **deben** ser rechazados. Un esquema que acepta todo pasa todas las pruebas positivas.

## Especificación

[RFC-006: Primitivas de prescripción](../specifications/rfc-006-prescription-primitives) es el documento normativo. Véase también [RFC-007](../specifications/rfc-007-workout-data-model) para saber cómo una sesión de entrenamiento las compone, y [RFC-008](../specifications/rfc-008-program-data-model) para saber cómo lo hace un programa.
