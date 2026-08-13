---
title: Registro de cambios
description: Historial de versiones y cambios de FDS
sidebar_position: 3
---

# Fitness Data Standard — Registro de cambios

Todos los cambios notables en los RFC y esquemas de FDS se documentan aquí.

El formato se inspira en Keep a Changelog, y el proyecto se adhiere al Versionado Semántico para los lanzamientos de la especificación.

## [Sin publicar]
- Política de espacio de nombres de extensiones (borrador) y secciones de conformidad (planificadas).

## Herramientas — el esquema de mapeo queda congelado (2026-08-11)

Ningún esquema de entidad cambió, no se agregó ningún lanzamiento y el lanzamiento
actual sigue donde estaba. Se registra aquí porque una entrada cambia lo que el
estándar promete sobre una URL publicada, y eso es un hecho de gobernanza y no de
empaquetado.

### Cambiado
- **El esquema de mapeo en 1.1.0 está congelado.** Se publicó deliberadamente sin
  congelar, porque congelar bytes en una URL permanente es el único acto aquí que
  no puede revertirse, y ya se ha servido el tiempo suficiente para ser nombrado
  por `$schema` en archivos de configuración que este proyecto no posee. Sus
  bytes no volverán a cambiar: un cambio significa un nuevo directorio de versión
  junto a él. El esquema de mapeo 1.0.0 sigue publicado y sigue congelado, como
  lo ha estado desde que fue sustituido.

  Un esquema de mapeo es `kind: tooling` en el manifiesto de lanzamientos —
  configura una herramienta y ningún lanzamiento lo nombra — así que congelarlo
  es una decisión sobre esa URL únicamente.

- Las herramientas de referencia se lanzan como **0.2.0**, ambos paquetes.
  Ninguno forma parte de un lanzamiento de la especificación, pero el
  transformador es la primera vía por la que la mayoría de los consumidores
  conoce el estándar, así que vale la pena conocer desde aquí tres de sus
  cambios: ahora resuelve sin conexión todos los lanzamientos publicados en
  lugar de solo el más antiguo, usa por defecto el lanzamiento actual en lugar
  de 1.0.0, y `validate --version` ahora valida, en lugar de coincidir con la
  opción homónima del propio programa e imprimir una versión de paquete y salir
  con éxito sin leer la entrada. El paquete de conocimiento (skill) documenta
  cada entidad y cada biblioteca que el lanzamiento actual nombra, lo cual se
  verifica en cada ejecución.

## Lanzamiento de esquema — workout 1.1.0 (2026-08-10)

### Agregado
- `settings[]` en un elemento de sesión de entrenamiento y en una serie
  individual — configuraciones de máquina y de entorno que la sesión prescribe,
  como una forma de métrica de RFC-001 con un valor adjunto. Una inclinación de
  caminadora y una cadencia de bicicleta no tenían dónde vivir antes de esto;
  `incline`, `cadence` y `resistanceLevel` estaban en el vocabulario de métricas
  sin ningún lugar donde adjuntar un valor.
- `zone` en una serie. La carga, las repeticiones, el tempo y el descanso
  siempre pudieron declararse por serie y la intensidad no, de modo que una
  sesión cuya intensidad subía serie a serie tenía que dividirse en un elemento
  por paso. Eso era una asimetría, no una decisión.
- `workout.machine-settings.example.json`, y diez sesiones de cardio y
  resistencia que completan la §4.4 de la matriz de cobertura.

### Cambiado
- El transformador empaqueta el lanzamiento **1.4.0**, que sirve workout en
  1.1.0. Los lanzamientos 1.0.0 a 1.3.0 siguen empaquetados.
- `check:scenarios` ahora exige las siete secciones respondibles de la matriz de
  cobertura — **87 filas**, frente a 54.

### Compatibilidad
- Puramente aditivo. Todo documento de workout 1.0.0 valida contra 1.1.0 sin
  cambios; un documento 1.1.0 que use cualquiera de las dos adiciones es
  rechazado por el esquema 1.0.0, que es lo que hace de esto una versión y no
  una edición.
- **`workout/v1.0.0/` sigue publicado y congelado.** Los lanzamientos 1.2.0 y
  1.3.0 del transformador declaran workout en 1.0.0, y una URL congelada que
  desaparece es peor que una que cambia.

## Lanzamiento de esquema — program 1.0.0 (2026-08-10)

### Agregado
- `program/v1.0.0` — programa de entrenamiento de RFC-008. Un cronograma de
  referencias a sesiones de entrenamiento a lo largo del tiempo: ciclos,
  semanas, ubicación por día, ajustes por ocurrencia, reglas de progresión y
  ramificación condicional. Un programa no contiene sesiones de entrenamiento;
  apunta a ellas, de modo que una sesión compartida por cuatro programas se
  redacta una sola vez y se corrige una sola vez.
- `references.trainingMaxes[]` — declara de qué levantamientos se calcula un
  programa y cómo deriva cada número quien lo invoca. Nunca transporta el
  número, y RFC-008 §8.1 establece como texto normativo que una implementación
  NO DEBE agregar uno.
- 18 ejemplos resueltos de programa, uno por fila de las secciones §4.6 de
  periodización y §4.7 de cronograma de la matriz de cobertura.
- Cuatro registros bajo `specification/registries/`: tipo de ejercicio, tipo de
  sesión de entrenamiento, rol del bloque y zona de intensidad. `exerciseType`
  no lleva `enum` ni `examples`, así que su registro es el único lugar donde ese
  vocabulario está escrito.
- Páginas del sitio web para los esquemas workout, program y prescription. Los
  tres se habían publicado en URLs congeladas que la documentación nunca
  mencionaba.

### Cambiado
- El transformador empaqueta el lanzamiento **1.3.0**, que agrega program. Los
  lanzamientos 1.0.0 a 1.2.0 siguen empaquetados para los consumidores fijados a
  ellos.
- `discovery.md` cubre las siete entidades y agrega `entity_versions`. Un
  lanzamiento nombra un *conjunto* de versiones de entidades, de modo que un
  cliente que expande un lanzamiento en un segmento de ruta solicita URLs que
  nunca se publicaron.
- Una obtención remota de esquema que responde 200 con algo que no es un esquema
  ahora falla con un mensaje que nombra el tipo de contenido y la URL. Antes, el
  error de análisis se tragaba en silencio y el transformador recurría a los
  esquemas empaquetados, lo cual es indistinguible de estar sin conexión.

### Corregido
- La página publicada de la guía de métricas no se había reconstruido después de
  que se extendiera el vocabulario de métricas, así que el sitio web documentaba
  tipos que el estándar ya había dejado atrás.
- Un *slot* de máximo de entrenamiento se identifica por su `exercise`, no por
  su `id`. El esquema había descrito la clave equivocada.

### Compatibilidad
- Puramente aditivo. Ningún esquema existente cambió; todos los ejemplos
  publicados validan sin cambios. Todos los esquemas publicados están ahora
  congelados.

## Lanzamiento de esquema — prescription 1.0.0, workout 1.0.0 (2026-08-09)

### Agregado
- `prescription/v1.0.0` — biblioteca de definiciones de RFC-006: `loadTarget`
  (13 métodos), `repTarget`, `tempo`, `restSpec`, `intensityZone`, `setScheme`,
  `progressionRule`. No es una entidad; su raíz no valida nada, y RFC-007 y
  RFC-008 componen sus definiciones.
- `workout/v1.0.0` — sesión de entrenamiento prescrita de RFC-007. Bloques de
  elementos con un `mode` de ejecución, de modo que los circuitos, EMOM, AMRAP,
  Tabata y el trabajo por intervalos no necesitan un esquema propio.
- `repStyle` en los elementos y series de la sesión, que cubre las repeticiones
  parciales y las de una y media — las dos filas de la matriz de escenarios que
  nada más podía expresar.
- 36 ejemplos resueltos de sesión de entrenamiento, uno por fila de las
  secciones §4.1 y §4.2 de la matriz de cobertura, y 69 archivos de ejemplo de
  prescripción que cubren cada valor de discriminador.

### Cambiado
- El transformador empaqueta el lanzamiento **1.2.0**, que agrega workout. Los
  lanzamientos 1.1.0 y 1.0.0 siguen empaquetados para los consumidores fijados a
  ellos. Un lanzamiento nombra un *conjunto* de versiones de entidades, de modo
  que ganar una entidad es un conjunto nuevo aunque ninguna entidad existente
  haya cambiado.
- CI ganó cuatro verificaciones: la guía de métricas cubre el vocabulario de
  métricas, los RFC y sus esquemas concuerdan en ambas direcciones, los archivos
  de ejemplo de prescripción coinciden con las definiciones que ejemplifican, y
  cada fila de la matriz de escenarios tiene un ejemplo resuelto.

### Compatibilidad
- Puramente aditivo. Ningún esquema existente cambió; todos los ejemplos
  publicados validan sin cambios.

## Lanzamiento de esquema — exercise 1.1.0, equipment 1.1.0 (2026-08-06)

Las entidades versionan de forma independiente. Este lanzamiento avanza exercise
y equipment; muscle, muscle-category y body-atlas no cambian y conservan sus
URLs `v1.0.0`.

### Agregado
- `exercises/v1.1.0` — bloque opcional `loading` que describe cómo un movimiento
  acepta carga externa (`externalLoad`, `assisted`, `asymmetric`).
- `equipment/v1.1.0` — bloque opcional `loading` que transporta el paso de carga
  utilizable más pequeño del implemento (`increment`) y si la carga se
  selecciona en una torre de placas (`stackBased`). Los incrementos viven en el
  equipamiento, no en el ejercicio: el paso más pequeño es una propiedad del
  implemento.
- Vocabulario de métricas: `rir`, `percent1RM`, `percentBodyweight`, `velocity`,
  `cadence`, `rounds`, `sets`, `rest`, `incline`, `resistanceLevel`, `oneRepMax`.
- Unidades de métricas: `percent`, `rpm`, `spm`, `level`, `ms`.
- Ejemplos: `exercise.example.assisted`, `exercise.example.conditioning`,
  `exercise.example.velocity`, `equipment.example.stack`.

### Cambiado
- `specification/schemas/.integrity.json` registra un sha256 por esquema
  publicado. Una entrada congelada ya no puede cambiar de contenido: publicar
  una nueva versión es la única forma de cambiar una URL lanzada.
- El transformador empaqueta 1.1.0 junto a 1.0.0 y usa 1.1.0 por defecto. Fijar
  `--version 1.0.0` para permanecer en el lanzamiento anterior.

### Compatibilidad
- Solo aditivo. Todo documento válido bajo los esquemas anteriores sigue siendo
  válido; todos los ejemplos existentes validan sin cambios.
- `exercises/v1.0.0` y `equipment/v1.0.0` quedan sustituidos en lugar de
  congelados en su sitio — no tenían consumidores externos en el momento del
  lanzamiento.

## [0.1.0] — 2025-09-09 (Borrador)
### Agregado
- RFC‑001 Modelo de datos de ejercicio (borrador) con el esquema `exercises/v1.0.0` y ejemplo.
- RFC‑002 Modelo de datos de equipamiento (borrador) con el esquema `equipment/v1.0.0` y ejemplo.
- RFC‑003 Modelo de datos de músculo (borrador) con el esquema `muscle/v1.0.0` y ejemplo.
- RFC‑004 Modelo de datos de categoría de músculo (borrador) con el esquema `muscle/muscle-category/v1.0.0` y ejemplo.

### Notas
- Política de identificadores aclarada: UUIDv4 es obligatorio en producción; los ejemplos pueden usar IDs ilustrativos por legibilidad.
- Reglas de versionado y compatibilidad establecidas para productores/consumidores.
