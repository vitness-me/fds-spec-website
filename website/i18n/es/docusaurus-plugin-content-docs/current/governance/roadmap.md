---
title: Hoja de ruta
description: Lo que el Fitness Data Standard cubre hoy y lo que deliberadamente no cubre
sidebar_position: 4
---

# Hoja de ruta

Lo que FDS cubre hoy, lo que viene después y — la parte que la mayoría de las hojas de ruta omite — lo que está deliberadamente excluido y por qué.

## Publicado

**RFC-001 a RFC-005** — el catálogo. Los ejercicios, y los registros que estos referencian: el equipamiento, los músculos, las categorías de músculos y el atlas corporal que vincula los músculos a una anatomía visual.

**RFC-006 Primitivas de prescripción** — una biblioteca de definiciones en lugar de una entidad. Carga, repeticiones, tempo, descanso, zonas de intensidad, esquemas de series y reglas de progresión, definidos una sola vez para que una serie signifique lo mismo dondequiera que aparezca.

**RFC-007 Modelo de datos de sesión de entrenamiento** — una sesión prescrita. Bloques de elementos, cada bloque con un modo de ejecución, de modo que las series simples, las superseries, los circuitos, EMOM, AMRAP, Tabata y el trabajo por intervalos son todos el mismo esquema.

**RFC-008 Modelo de datos de programa de entrenamiento** — un cronograma de referencias a sesiones de entrenamiento a lo largo del tiempo. Ciclos, semanas, ubicación por día, ajuste por ocurrencia, progresión y ramificación condicional.

**RFC-010 Integridad de las referencias entre entidades** — qué deben contener las referencias que las entidades llevan unas a otras, para que un documento siga siendo enumerable sin resolverlas. Normativo desde su adopción; los esquemas no pueden codificarlo hasta un lanzamiento mayor, porque un esquema que empieza a rechazar la cadena vacía rechaza documentos que hoy validan.

Todos los esquemas publicados están congelados. Una URL congelada nunca cambia sus bytes; un cambio significa una nueva versión.

## Próximos pasos

### RFC-009 — Datos ejecutados

Todo lo anterior es **prescriptivo**: lo que se pretende. Nada en FDS registra lo que realmente ocurrió.

Ese vacío es deliberado y es la razón por la que RFC-009 no se ha publicado. Los datos ejecutados tienen un titular — una persona identificable que levantó un peso específico un día específico — y en el momento en que un documento tiene un titular adquiere obligaciones de consentimiento, retención, portabilidad y supresión que alcanzan a todo sistema por el que pasa. El catálogo, las sesiones y los planes pueden publicarse, almacenarse en caché, replicarse y diferenciarse libremente precisamente porque ninguno de ellos describe a una persona.

RFC-009, por lo tanto, espera a un modelo de consentimiento y privacidad, no al diseño de esquemas. El esquema es la parte fácil.

Dos decisiones ya están fijadas. Un registro de lo ejecutado llevará una **instantánea congelada de la prescripción contra la que se ejecutó**, porque un plan editado después no debe reescribir la historia. Y su titular será una **referencia opcional opaca**, no una entidad User ni Profile — FDS no modela a ninguna persona, y agregar una para resolver el registro de eventos arrastraría la identidad a cada documento de referencia.

### Registros y conformidad

Los registros de valores recomendados están publicados y verificados. Las suites de pruebas de conformidad — un corpus contra el cual un productor puede validar para declarar conformidad — son el siguiente paso natural ahora que la matriz de cobertura está completa.

## Deliberadamente fuera del alcance

Estos no son "todavía no". Son decisiones — los [principios rectores](/docs/governance#guiding-principles) los enuncian como restricciones vinculantes; abajo está lo que excluyen y por qué.

**La identidad del atleta, el peso corporal, las repeticiones máximas (1RM).** FDS no transporta valores personales, incluidos aquellos a partir de los cuales se calcula un programa personalizado. Un programa declara que referencia un máximo de entrenamiento de sentadilla trasera y cómo se deriva ese número; nunca transporta el número. La consecuencia aceptada es que un programa totalmente personalizado no puede hacer el *round-trip* como un único documento autocontenido — la exportación es el plan más un contexto de resolución separado.

**Autenticación y autorización.** Un formato de datos, no un protocolo. Los proveedores documentan sus propios requisitos; el endpoint de descubrimiento dice qué sirve, no quién puede leerlo.

**Selección generada de ejercicios.** Un día de un programa referencia una sesión de entrenamiento, lo cual requiere una sesión que exista. No hay días indeterminados, porque un programa cuyo contenido produce un generador no puede leerse sin ese generador — lo contrario de un formato de intercambio. La adaptación de la carga *sí* es expresable, mediante objetivos autorregulados y reglas de progresión declaradas.

## En consideración

Áreas que encajan en el ámbito del estándar pero no tienen un diseño comprometido:

- **Nutrición y planificación de comidas** — un dominio grande con sus propios problemas de vocabulario; probablemente un estándar hermano en lugar de una extensión de este.
- **Recuperación, sueño y mapeo de datos de dispositivos wearables** — estrechamente ligados a las mismas preguntas sobre datos personales que RFC-009.
- **Medidas y composición corporal** — personales por definición; bloqueadas por el mismo modelo.

## Contribuir

Las ideas para futuros RFC son bienvenidas:

1. **Abrir un issue** en [GitHub](https://github.com/vitness-me/fds-spec-website/issues) para proponer un área.
2. **Enviar un borrador de RFC** siguiendo las [guías de contribución](/docs/governance/contributing).
3. **Compartir retroalimentación de implementación** — la contribución más útil es un caso que los esquemas actuales no puedan expresar. Cada uno de los encontrados hasta ahora ha cambiado el estándar.
