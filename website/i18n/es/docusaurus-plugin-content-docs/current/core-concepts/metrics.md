---
title: Métricas
sidebar_position: 1
---

# Guía de emparejamiento de métricas

Esta guía especifica los pares válidos y recomendados de tipo/unidad de métrica y las expectativas por tipo de ejercicio, para promover la consistencia entre implementaciones.

El esquema de ejercicio restringe la *estructura* de `metrics` y la pertenencia de `type` y `unit` a sus enumeraciones. **No** restringe qué unidad acompaña a qué tipo — `{"type": "reps", "unit": "kg"}` es válido según el esquema y carece de sentido. Ese emparejamiento es lo que esta guía fija.

## Pares tipo/unidad válidos

### Medición

| Tipo        | Unidades permitidas                              | Notas                              |
|-------------|--------------------------------------------------|------------------------------------|
| `reps`      | `count`                                          | Números enteros                    |
| `weight`    | `kg`, `lb`                                       | Preferir un solo sistema por conjunto de datos |
| `duration`  | `s`, `min`, `ms`                                 | Segundos para precisión; `ms` para trabajo por debajo del segundo (tiempos por repetición o por fase en el entrenamiento basado en velocidad) |
| `distance`  | `m`, `km`, `mi`                                  |                                    |
| `speed`     | `m_s`, `km_h`                                    | Desplazamiento del cuerpo completo sobre el terreno |
| `pace`      | `min_per_km`, `min_per_mi`                       |                                    |
| `power`     | `W`                                              |                                    |
| `heartRate` | `bpm`                                            |                                    |
| `steps`     | `count`                                          |                                    |
| `calories`  | `kcal`                                           | Estimadas                          |
| `height`    | `cm`, `in`                                       | Para saltos/altura de cajón        |
| `velocity`  | `m_s`                                            | Velocidad de la barra o del implemento, no la del atleta. Distinta de `speed` |

### Esfuerzo e intensidad

| Tipo                | Unidades permitidas | Notas                                                  |
|---------------------|---------------|--------------------------------------------------------------|
| `rpe`               | `count`       | Escala de 1–10                                                |
| `rir`               | `count`       | Repeticiones en reserva, 0–10. Inversa de `rpe`; no mezclar las dos en un mismo conjunto de datos sin registrar cuál se usó |
| `percent1RM`        | `percent`     | Relativo a una repetición máxima (1RM), que PUEDE ser de un levantamiento distinto del prescrito |
| `percentBodyweight` | `percent`     | Requiere un peso corporal que el estándar no transporta — ver más abajo |
| `oneRepMax`         | `kg`, `lb`    | Un valor de referencia, no una métrica registrada — ver más abajo |
| `tempo`             | `count`       | Convención, p. ej. 3‑1‑1 como conteos. Para tiempos reales por debajo del segundo, usar `duration` con `ms` |

### Estructura de prescripción

| Tipo              | Unidades permitidas | Notas                                               |
|-------------------|---------------|-----------------------------------------------------------|
| `sets`            | `count`       | Solo cuando las series son en sí la cantidad prescrita (trabajo de densidad: "tantas series como sea posible en 10 minutos"). Los conteos ordinarios de series son estructura, no una métrica |
| `rounds`          | `count`       | Circuitos y AMRAP                                         |
| `rest`            | `s`, `min`    | Descanso prescrito, no observado                          |

### Ajustes de máquina

| Tipo              | Unidades permitidas | Notas                                               |
|-------------------|---------------|-----------------------------------------------------------|
| `cadence`         | `rpm`, `spm`  | `rpm` para ciclismo; `spm` para carrera, remo y natación  |
| `incline`         | `percent`     | Pendiente de la caminadora                                |
| `resistanceLevel` | `level`       | Posición del pasador o de la torre de placas de la máquina — opaca, ver más abajo |

### Tipos que requieren cuidado

**`percentBodyweight`** describe la carga como una fracción del peso corporal del atleta. FDS no transporta ningún atleta, por diseño (no existe una entidad User ni Profile), así que este tipo solo puede resolverse contra un peso corporal que el *consumidor* proporciona. Un productor que lo emite DEBE aceptar que los consumidores sin un peso corporal no pueden presentar una carga absoluta.

**`oneRepMax`** es una referencia *a partir de* la cual se calcula una intensidad, no una medición tomada durante una serie. Va junto a `percent1RM`, y un consumidor que lo grafique como métrica por serie producirá un sinsentido.

**`resistanceLevel`** es un ajuste opaco. El "nivel 7" de dos fabricantes no guarda ninguna relación, y tampoco las posiciones de pasador de dos gimnasios en torres de placas nominalmente idénticas. Registrarlo para reproducir una sesión en la misma máquina; **no** convertirlo a carga ni compararlo entre instalaciones. Cuando el implemento publica incrementos reales, `equipment.loading.increment` es la respuesta portable.

## Expectativas por tipo de ejercicio

`classification.exerciseType` es una cadena abierta (RFC-001 §4.2), así que esta tabla es una guía para valores comunes, no una lista cerrada.

| Tipo de ejercicio | Métrica principal              | Métricas secundarias comunes                                    |
|---------------|--------------------------------|-----------------------------------------------------------------|
| strength      | `reps`                         | `weight`, `tempo`, `rpe`, `rir`, `percent1RM`, `rest`           |
| power         | `reps` o `duration`            | `weight`, `power`, `height`, `velocity`, `percent1RM`, `rest`   |
| cardio        | `duration` o `distance`        | `pace` o `speed`, `heartRate`, `cadence`, `incline`, `resistanceLevel` |
| endurance     | `duration` o `distance`        | `pace`/`speed`, `heartRate`, `calories`, `cadence`, `rest`      |
| conditioning  | `duration` o `rounds`          | `rest`, `calories`, `heartRate`, `cadence`, `resistanceLevel`   |
| mobility      | `duration`                     | `tempo`                                                          |
| isometric     | `duration`                     | `rpe`, `rir`                                                     |
| plyometric    | `reps`                         | `height`, `duration`, `rest`                                     |

Notas:
- El registro de fuerza DEBERÍA admitir como mínimo `reps`; `weight` es muy recomendable cuando aplica.
- El registro de cardio DEBERÍA incluir `duration` y, además, `distance` o `pace` (derivar una de la otra cuando sea posible).
- Movilidad e isométricos DEBERÍAN usar `duration` como métrica principal; evitar `reps` salvo que el dominio lo requiera.
- El trabajo basado en velocidad empareja `velocity` con `percent1RM`, y a menudo `duration` en `ms` para el tiempo concéntrico. Ambas son secundarias respecto de `reps`.
- Prescribir el esfuerzo con `rpe` **o** `rir` de manera consistente dentro de un conjunto de datos. Son escalas inversas, y un consumidor no puede deducir de un `count` a secas cuál de las dos se quiso indicar.
- `rest` en un ejercicio registra un valor predeterminado que el movimiento sugiere. Una prescripción que varía el descanso entre series lo transporta a nivel de serie, no aquí.

## La carga, y dónde viven los incrementos

`exercise.loading` (RFC-001 §4.6) declara si un movimiento acepta carga externa, si esa carga es asistiva y si los lados se cargan de forma independiente.

Los **incrementos** de carga no están en el ejercicio. El paso más pequeño utilizable es una propiedad del implemento — un par de discos de 2.5 kg, un salto de 5 lb entre mancuernas, un pasador en una torre de placas — así que vive en `equipment.loading.increment` (RFC-002 §4.4). El mismo movimiento ejecutado con mancuernas y con barra tiene dos pasos mínimos distintos, algo que un campo en el ejercicio no podría expresar.

Un consumidor que calcula una carga absoluta a partir de `percent1RM` DEBERÍA redondear al múltiplo alcanzable más cercano del incremento del implemento, en lugar de presentar un número que no se puede cargar.

## Guía de validación
- El esquema de ejercicio restringe la estructura de `metrics` y la pertenencia a las enumeraciones; esta guía aclara las expectativas del dominio y los emparejamientos recomendados.
- Los productores DEBERÍAN seleccionar métricas consistentes con `classification.exerciseType`.
- Los consumidores PUEDEN validar los emparejamientos para ofrecer mejor experiencia de usuario y mejores mensajes de error.
- Un emparejamiento ausente de esta guía no es por ello inválido — la guía registra los emparejamientos que se sabe que son significativos, y los consumidores DEBERÍAN advertir en lugar de rechazar.
