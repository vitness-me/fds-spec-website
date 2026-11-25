---
title: 'Comparación, coincidencia y versionado'
sidebar_label: 'Comparación, coincidencia, versionado'
description: 'Borrador de las relaciones de comparación, el protocolo de coincidencia, la procedencia, el marcador de laguna y el versionado de reglas de los descriptores estructurales'
sidebar_position: 6
---

# Comparación, coincidencia y versionado

:::caution Borrador
No es normativo hasta que se acepte el [RFC-010](/docs/specifications/rfc-010-structural-descriptors), que adopta los descriptores estructurales. El RFC-010 es un borrador. Véase [la visión general](./overview.md).
:::

## Comparación {#compare}

La comparación toma dos FXI, o dos FXE, y dice cómo se relacionan los ejercicios (o el equipamiento) que describen. Lee solo las cadenas: nunca un nombre, nunca una palabra de movimiento.

**Cada valor denota un conjunto.** Un código conocido se denota a sí mismo. `?` y `*` denotan todos los valores. Un código padre cubre a sus hijos: una forma de FXE cubre sus formas hijas (`band` cubre `band.loop`), un token de equipamiento cubre sus tokens hijos (`dome` cubre `dome.up` y `dome.down`, `erg` cubre cada `erg.<cycle>`), un código de rango cubre a su hijo (`from-top` cubre `from-top.knee`), y una acción articular cubre a su hija (`sh.ext` cubre `sh.ext.oh`) bajo cualquier prefijo, junto a otras acciones y en una parte sostenida.

**Las capas estándar ausentes son valores.** Una capa estándar omitida de una cadena toma su valor predeterminado publicado, que contradice cualquier otro valor conocido. Solo `?` y `*` son abiertos. Una capa **extendida** (`a` de FXI, los detalles de construcción de FXE) se compara solo cuando ambas cadenas la llevan; cuando solo la lleva una, ese lado es el más específico.

**Por capa**, el lado A es `equal`, `narrower` (A nombra un subconjunto de lo que nombra B), `broader`, `open` (ambos incompletos y compatibles) o `contradicts`. Los valores con varios elementos se comparan elemento por elemento: cada elemento de un lado debe emparejarse con un elemento del otro. En `l`, una cantidad que una cadena omite es su cantidad habitual según la simetría, el punto de sujeción y el movimiento de esa misma cadena ([cantidades](./fxi.md#load-l)), y las cantidades se comparan como números; donde la cantidad habitual de un lado es desconocida, su cantidad es abierta. Así, `l:db*2@hands/x:?` queda precisado por el curl con dos mancuernas `l:db@hands`, no contradicho por él.

**En conjunto**, el resultado es uno de:

| Relación | Significado |
|---|---|
| `identical` | Las cadenas canónicas son iguales byte a byte y no contienen ningún `?` ni ningún `*`. Nada más es nunca idéntico. |
| `refines` | A es una descripción más específica de B: cada capa es `equal` o A es `narrower`, al menos una es más restringida (un valor conocido frente a `?` o `*`, un código hijo frente a su padre), o A lleva una capa extendida que B no tiene. |
| `refined-by` | A la inversa: B es la más específica. |
| `compatible` | Ninguna capa se contradice; algunas son abiertas, o la restricción va en ambos sentidos. |
| `contradicting` | Alguna capa no puede coincidir. |
| `invalid` | Alguna de las cadenas es inválida, o las dos son de tipos distintos. |

Por lo tanto, una capa genérica (`*`) frente a un valor conocido es `refines` en el lado conocido: una sentadilla escrita para cualquier orientación queda precisada por una sentadilla de pie.

La comparación no es transitiva. Deduplicar solo ante `identical`.

**Combinaciones de FXE.** Dos configuraciones simples se comparan capa por capa como se indica arriba, y los tipos distintos se contradicen. Una máquina combinada es `identical` a la misma combinación cuando ninguna contiene un `?`, `compatible` con cualquier configuración que encaje con una de las suyas, y `contradicting` en otro caso.

### Ejemplos {#examples}

| A | B | Relación |
|---|---|---|
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `identical` |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:*/l:bb@back` | `refines` (orientación más restringida) |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:?@back` | `refines` (carga más restringida) |
| `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:?` | `refines` (agarre más restringido) |
| `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands` | `contradicting` (`ne` frente al agarre prono predeterminado) |
| `FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `refines` (movimiento más restringido: un tirón desde arriba de la cabeza frente a cualquier extensión de hombro) |

## Procedencia, coincidencia y versionado {#provenance-match-and-versioning}

El [RFC-010](/docs/specifications/rfc-010-structural-descriptors) es la fuente normativa de todo lo que viaja junto a un descriptor o actúa sobre una comparación, y esta página no lo reformula:

- quién respondió por un FXI, `fxiProvenance`, y el marcador de laguna, `fxiGap`: [§5.3](/docs/specifications/rfc-010-structural-descriptors#53-fxiprovenance-and-fxigap);
- los enlaces almacenados entre catálogos, `xrefs`, y hasta qué punto se confía en un enlace recibido: [§5.4](/docs/specifications/rfc-010-structural-descriptors#54-xrefs);
- el protocolo de coincidencia, la coincidencia automática, la lista de confirmación y su orden, y el modo de importación: [§7](/docs/specifications/rfc-010-structural-descriptors#7-match-protocol);
- cómo se versionan los descriptores y sus revisiones de reglas, y cómo las respuestas almacenadas reconstruyen una cadena: [§8](/docs/specifications/rfc-010-structural-descriptors#8-versioning).

Las pruebas que ejecuta toda implementación, y lo que demuestra superarlas, están en [la página de conformidad](./conformance.md).
