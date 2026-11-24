# Compare, Match and Versioning

:::caution Draft
Not normative until [RFC-010](/docs/specifications/rfc-010-structural-descriptors), which adopts the structural descriptors, is accepted. RFC-010 is a draft. See [the overview](./overview.md).
:::

## Compare

Compare takes two FXIs, or two FXEs, and says how the exercises (or the equipment) they describe relate. It reads only the strings: never a name, never a movement word.

**Every value denotes a set.** A known code denotes itself. `?` and `*` denote every value. A parent code covers its children: an FXE form covers its child forms (`band` covers `band.loop`), an equipment token covers its child tokens (`dome` covers `dome.up` and `dome.down`, `erg` covers every `erg.<cycle>`), a range code covers its child (`from-top` covers `from-top.knee`), and a joint action covers its child (`sh.ext` covers `sh.ext.oh`) under any prefix, beside other actions and in a held part.

**Absent standard layers are values.** A standard layer left out of a string takes its published default, which contradicts every other known value. Only `?` and `*` are open. An **extended** layer (FXI `a`, the FXE build details) is compared only when both strings carry it; when only one does, that side is the more specific one.

**Per layer**, side A is `equal`, `narrower` (A names a subset of what B names), `broader`, `open` (both incomplete and compatible), or `contradicts`. Multi-item values match item by item: every item on one side must pair with an item on the other. In `l`, a count a string leaves out is its usual count under that string's own symmetry, hold point and motion ([counts](./fxi.md#load-l)), and counts compare as numbers; where a side's usual count is unknown, its count is open. So `l:db*2@hands/x:?` is refined by the two-dumbbell curl `l:db@hands`, not contradicted by it.

**Overall**, the result is one of:

| Relation | Meaning |
|---|---|
| `identical` | The canonical strings are byte-equal and hold no `?` and no `*`. Nothing else is ever identical. |
| `refines` | A is a more specific description of B: every layer is `equal` or A is `narrower`, at least one is narrower (a known value against `?` or `*`, a child code against its parent), or A carries an extended layer B lacks. |
| `refined-by` | The reverse: B is the more specific. |
| `compatible` | No layer contradicts; some are open, or the narrowing goes both ways. |
| `contradicting` | Some layer cannot match. |
| `invalid` | Either string is invalid, or the two are of different kinds. |

A generic layer (`*`) against a known value is therefore `refines` on the known side: a squat written for either orientation is refined by a standing squat.

Compare is not transitive. Deduplicate only on `identical`.

**FXE combinations.** Two single configurations compare layer by layer as above, with kinds that differ contradicting. A combination machine is `identical` to the same combination when neither holds a `?`, `compatible` with any configuration that fits one of its own, and `contradicting` otherwise.

### Examples

| A | B | Relation |
|---|---|---|
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `identical` |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:*/l:bb@back` | `refines` (orientation narrower) |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:?@back` | `refines` (load narrower) |
| `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:?` | `refines` (grip narrower) |
| `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands` | `contradicting` (`ne` against the default overhand) |
| `FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `refines` (motion narrower: a pull from overhead against any shoulder extension) |

## Provenance, match and versioning

[RFC-010](/docs/specifications/rfc-010-structural-descriptors) is the normative home of everything that travels beside a descriptor or acts on a comparison, and this page does not restate it:

- who answered for an FXI, `fxiProvenance`, and the gap marker, `fxiGap`: [§5.3](/docs/specifications/rfc-010-structural-descriptors#53-fxiprovenance-and-fxigap);
- stored links between catalogues, `xrefs`, and how far a received link is trusted: [§5.4](/docs/specifications/rfc-010-structural-descriptors#54-xrefs);
- the match protocol, auto-match, the confirm list and its ranking, and import mode: [§7](/docs/specifications/rfc-010-structural-descriptors#7-match-protocol);
- how the descriptors and their rules revisions are versioned, and how stored answers rebuild a string: [§8](/docs/specifications/rfc-010-structural-descriptors#8-versioning).

The tests every implementation runs, and what passing them shows, are on [the conformance page](./conformance.md).
