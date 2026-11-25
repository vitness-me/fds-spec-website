---
title: 'Poređenje, podudaranje i verzionisanje'
sidebar_label: 'Poređenje, podudaranje, verzionisanje'
description: 'Nacrt relacija poređenja, protokola podudaranja, porekla, markera nedostatka i verzionisanja pravila za strukturne deskriptore'
sidebar_position: 6
---

# Poređenje, podudaranje i verzionisanje

:::caution Nacrt
Nije normativno dok se ne prihvati [RFC-010](/docs/specifications/rfc-010-structural-descriptors), koji usvaja strukturne deskriptore. RFC-010 je nacrt. Pogledajte [pregled](./overview.md).
:::

## Poređenje {#compare}

Poređenje uzima dva FXI, ili dva FXE, i kaže u kakvom su odnosu vežbe (ili oprema) koje oni opisuju. Čita samo stringove: nikada naziv, nikada reč pokreta.

**Svaka vrednost označava skup.** Poznat kod označava sam sebe. `?` i `*` označavaju svaku vrednost. Roditeljski kod pokriva svoju decu: FXE oblik pokriva svoje podoblike (`band` pokriva `band.loop`), token opreme pokriva svoje podtokene (`dome` pokriva `dome.up` i `dome.down`, `erg` pokriva svaki `erg.<cycle>`), kod obima pokreta pokriva svoje dete (`from-top` pokriva `from-top.knee`), a zglobna akcija pokriva svoje dete (`sh.ext` pokriva `sh.ext.oh`) uz bilo koji prefiks, pored drugih akcija i u zadržanom delu.

**Odsutni standardni slojevi su vrednosti.** Standardni sloj izostavljen iz stringa dobija svoju objavljenu podrazumevanu vrednost, koja protivreči svakoj drugoj poznatoj vrednosti. Samo `?` i `*` su otvoreni. **Prošireni** sloj (FXI `a`, FXE detalji konstrukcije) poredi se samo kada ga nose oba stringa; kada ga nosi samo jedan, ta strana je specifičnija.

**Po sloju**, strana A je `equal`, `narrower` (A imenuje podskup onoga što imenuje B), `broader`, `open` (obe su nepotpune i kompatibilne) ili `contradicts`. Vrednosti sa više stavki podudaraju se stavku po stavku: svaka stavka na jednoj strani mora imati par na drugoj. U `l`, broj koji string izostavi jeste njegov uobičajeni broj prema simetriji, mestu držanja i pokretu tog istog stringa ([brojevi](./fxi.md#load-l)), a brojevi se porede kao brojevi; tamo gde uobičajeni broj jedne strane nije poznat, njen broj je otvoren. Tako `l:db*2@hands/x:?` precizira pregib sa dve bučice `l:db@hands`, a ne protivreči mu.

**Ukupno**, rezultat je jedno od sledećeg:

| Relacija | Značenje |
|---|---|
| `identical` | Kanonski stringovi su jednaki bajt po bajt i ne sadrže ni `?` ni `*`. Ništa drugo nikada nije identično. |
| `refines` | A je specifičniji opis od B: svaki sloj je `equal` ili je A `narrower`, bar jedan je uži (poznata vrednost naspram `?` ili `*`, kod deteta naspram roditelja), ili A nosi prošireni sloj koji B nema. |
| `refined-by` | Obrnuto: B je specifičniji. |
| `compatible` | Nijedan sloj ne protivreči; neki su otvoreni, ili sužavanje ide u oba smera. |
| `contradicting` | Neki sloj ne može da se podudari. |
| `invalid` | Jedan od stringova je nevažeći, ili su dva stringa različitih vrsta. |

Generički sloj (`*`) naspram poznate vrednosti zato je `refines` na strani poznate vrednosti: čučanj napisan za bilo koju orijentaciju precizira se čučnjem iz stojećeg stava.

Poređenje nije tranzitivno. Deduplikujte samo na osnovu `identical`.

**FXE kombinacije.** Dve pojedinačne konfiguracije porede se sloj po sloj kao gore, pri čemu različite vrste protivreče. Kombinovana sprava je `identical` istoj kombinaciji kada nijedna ne sadrži `?`, `compatible` sa svakom konfiguracijom koja odgovara nekoj od njenih, a inače `contradicting`.

### Primeri {#examples}

| A | B | Relacija |
|---|---|---|
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `identical` |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:*/l:bb@back` | `refines` (orijentacija uža) |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:?@back` | `refines` (opterećenje uže) |
| `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:?` | `refines` (hvat uži) |
| `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands` | `contradicting` (`ne` naspram podrazumevanog nathvata) |
| `FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mach@hands/g:ne` | `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` | `refines` (pokret uži: povlačenje iznad glave naspram bilo koje ekstenzije ramena) |

## Poreklo, podudaranje i verzionisanje {#provenance-match-and-versioning}

[RFC-010](/docs/specifications/rfc-010-structural-descriptors) je normativni dom svega što putuje uz deskriptor ili deluje na osnovu poređenja, i ova stranica to ne iskazuje ponovo:

- ko je odgovorio za FXI, `fxiProvenance`, i marker nedostatka, `fxiGap`: [§5.3](/docs/specifications/rfc-010-structural-descriptors#53-fxiprovenance-and-fxigap);
- sačuvane veze između kataloga, `xrefs`, i koliko se veruje primljenoj vezi: [§5.4](/docs/specifications/rfc-010-structural-descriptors#54-xrefs);
- protokol podudaranja, automatsko podudaranje, lista za potvrdu i njeno rangiranje, i režim uvoza: [§7](/docs/specifications/rfc-010-structural-descriptors#7-match-protocol);
- kako se verzionišu deskriptori i njihove revizije pravila, i kako sačuvani odgovori ponovo grade string: [§8](/docs/specifications/rfc-010-structural-descriptors#8-versioning).

Testovi koje izvršava svaka implementacija, i šta njihovo prolaženje pokazuje, nalaze se na [stranici o usaglašenosti](./conformance.md).
