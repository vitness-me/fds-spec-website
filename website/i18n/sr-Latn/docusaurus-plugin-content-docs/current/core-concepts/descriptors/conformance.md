---
title: 'Usaglašenost'
sidebar_label: 'Usaglašenost'
description: 'Nacrt vektora usaglašenosti za FXI, FXE i FXM u četiri nivoa, i izmereni izveštaji koji stoje uz njih'
sidebar_position: 7
---

# Usaglašenost

:::caution Nacrt
Nije normativno dok se ne prihvati [RFC-010](/docs/specifications/rfc-010-structural-descriptors), koji usvaja strukturne deskriptore. RFC-010 je nacrt. Pogledajte [pregled](./overview.md).
:::

Implementacija FXI, FXE i FXM je usaglašena kada sa 100% prođe svaki objavljeni vektor testova u svakom nivou koji njena uloga koristi. Vektori su podaci: svaki je ulaz i očekivani izlaz, pa svaka implementacija, na bilo kom jeziku, pušta iste datoteke kroz sopstveni mali adapter.

Koje nivoe implementacija mora da prođe određuje [odeljak o usaglašenosti u RFC-010](/docs/specifications/rfc-010-structural-descriptors#conformance):

| Implementacija koja | Prolazi nivoe |
|---|---|
| čita, validira i svodi stringove na kanonski oblik | `syntax` |
| gradi stringove iz zapisa odgovora | `syntax`, `builder` |
| poredi i podudara stringove (razrešivač) | `syntax`, `compare`, `resolver` |

Razrešivač ne gradi stringove, pa se od njega ne zahteva da prođe nivo `builder`.

**Šta prolaženje pokazuje.** Svaki očekivani izlaz je ono što referentni enkoder izračuna za taj ulaz. Prolaženje vektora pokazuje da se implementacija slaže sa referencom; ne pokazuje da je referenca ispravna. Pravilo koje referenca primenjuje pogrešno, vektori primenjuju pogrešno zajedno sa njom, i ono se ispravlja u oba, u novoj reviziji pravila. Referenca je do sada jedina implementacija koja ih je izvršila.

Usaglašenost kaže da implementacija izračunava ono što specifikacija kaže. Ne kaže da ljudi, ili programi, koji odgovaraju na tok pitanja tačno opisuju vežbe. To ne može da se sertifikuje. Umesto toga se meri, i objavljuje kao [izveštaji](#measured-not-certified).

## Nivoi {#the-tiers}

<!-- fds:generated conformance#tiers -->
| Nivo | Vektori | Datoteka | Podaci koje čita |
|---|---|---|---|
| `syntax` | 143 | [`syntax.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/syntax.json) | [`fxm-vocabulary.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/fxm-vocabulary.json) |
| `builder` | 29 | [`builder.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/builder.json) | [`words.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/words.json) |
| `compare` | 64 | [`compare.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/compare.json) | [`fxm-vocabulary.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/fxm-vocabulary.json) |
| `resolver` | 43 | [`resolver.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/resolver.json) | (nijedni) |
<!-- /fds:generated -->

Svaka datoteka nivoa imenuje, u `rules`, reviziju pravila za koju su njeni vektori napisani. Skup vektora važi samo za tu reviziju pravila: kada registri pređu na novu, vektori se pregledaju prema njoj pre nego što se `rules` promeni.

Svaki vektor ima `id`, jedinstven unutar svog nivoa, i `note` koji kaže šta testira. Napomena je namenjena ljudima; adapter je zanemaruje.

### Sintaksa {#syntax}

Svaki vektor daje `kind` (`fxi`, `fxe` ili `fxm`) i string `input`.

- **Važeći** vektor očekuje `{"valid": true, "canonical": …}`: ulaz je važeći i ovo je njegov [kanonski oblik](./fxi.md#canonical-form). Tamo gde daje i `standard`, to je standardna projekcija: isti string sa izostavljenim svakim proširenim slojem i oznakom `S`.
- **Nevažeći** vektor očekuje `{"valid": false, "issues": […]}`: tačno ovaj skup kodova problema, sortiran. Svaki vektor krši jedno pravilo, a drugi kod navodi samo tamo gde kršenje tog pravila nužno krši i drugo. Proverivač prijavljuje svaki problem koji pronađe, pa mora da prijavi sve njih i nijedan drugi.
- Vektor `fxm` proverava samo format ključa, osim ako je označen sa `"vocabulary": true`. Tada se ključ proverava i prema [`fxm-vocabulary.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/fxm-vocabulary.json), izmišljenom vokabularu čiji tokeni ne imenuju nijedan stvarni mišić. FDS ne objavljuje listu mišića; ta datoteka postoji samo da bi testirala gramatiku ključa.

Kodovi problema:

<!-- fds:generated conformance#codes -->
| Kod | Prijavljuje se za |
|---|---|
| `prefix` | String ne počinje zaglavljem deskriptora (`FXI=`, `FXE=` ili `FXM=`, zatim verzija). |
| `no-rev` | Zaglavlje ima glavnu verziju, ali ne i reviziju sintakse (`FXI=1/`): nacrt pre izdanja. |
| `major` | Glavna verzija različita od `1`. |
| `rev` | Revizija sintakse novija od one koju proverivač poznaje, ili napisana sa vodećom nulom. |
| `unknown-layer` | Slovo sloja koje deskriptor nema, ili, u FXE, ono koje vrsta ne uzima. |
| `duplicate-layer` | Sloj napisan dvaput. |
| `empty` | Sloj, ili stavka oslonca, bez vrednosti. |
| `missing-motion` | FXI bez sloja pokreta `m`. |
| `generic-motion` | `m:*`: pokret ne može biti generički. |
| `part-unknown` | Faza pokreta sa nekoliko delova `\|`, od kojih je jedan `?`. |
| `empty-phase` | Faza pokreta bez zglobne akcije. |
| `two-prefixes` | Deo pokreta sa više od jednog prefiksa faze. |
| `zero` | `0` bilo gde osim u `=0` ili `~0`. |
| `open-hedge` | Otvoreni završetak `+?` u fazi pokreta. |
| `unknown-action` | Stavka pokreta koja nije zglobna akcija, zglob sa `?` ili zglob koji kruži sa `.circ`. |
| `short-suffix` | Sufiks kratkog impulsa `-` na bilo čemu osim na imenovanoj zglobnoj akciji. |
| `opposite-actions` | Dve suprotne akcije u jednom delu faze. |
| `unknown-code` | Kod koji nije u svom vokabularu: orijentacija, pokretni kraj, rad nogu, zadržani položaj, linija ili pomagalo, ili FXE vrednost. |
| `unknown-surface` | Površina oslonca koja nije token oslonca. |
| `unknown-point` | Tačka tela koja nije u vokabularu tačaka tela. |
| `unknown-implement` | Token opterećenja koji nije token opreme. |
| `support-as-load` | Token oslonca napisan kao opterećenje. |
| `count` | Broj rekvizita različit od `1` do `4`. |
| `unknown-hold` | Mesto držanja koje nije ni tačka tela ni tačka samo za držanje. |
| `bw-hold` | `bw` sa mestom držanja ili brojem. |
| `missing-hold` | Rekvizit bez mesta držanja. |
| `unknown-symmetry` | Kod simetrije koji nije u vokabularu. |
| `unknown-scope` | Obuhvat simetrije različit od `arms` ili `legs`. |
| `symmetry-conflict` | Više od jednog koda simetrije bez obuhvata, ili dva za jedan obuhvat. |
| `st-sp` | `st-sp` u `g`: raskoračni stav je rad nogu, `f:split`. |
| `unknown-grip` | Element hvata koji nije orijentacija šake, širina ni stav. |
| `grip-conflict` | Više od jedne orijentacije šake, širine ili stava u jednoj fazi hvata. |
| `unknown-range` | Kod obima pokreta koji nije u vokabularu. |
| `range-conflict` | Dva početna položaja, ili `partial` uz `deep`. |
| `unknown-alone` | `?` kombinovan sa drugim kodovima u `h`, `p` ili `a`. |
| `conflict` | Podrazumevani kod kombinovan sa drugima, ili dva koda označena sa „nikada uz“. |
| `missing-kind` | FXE konfiguracija koja ne počinje sa `k`. |
| `kind-unknown` | `k:?` sa drugim slojevima. |
| `unknown-kind` | FXE vrsta koja nije u vokabularu. |
| `form-kind` | FXE oblik napisan pod vrstom kojoj ne pripada. |
| `combo` | Kombinacija koja spaja `k:none` ili `k:?`. |
| `token` | FXM telo koje nije `<muscle>`, `<muscle>.<part>` ili `g:<group>` u malim slovima, u kebab-case obliku. |
| `unknown-muscle` | FXM mišić koji vokabular ne definiše. |
| `unknown-part` | FXM deo koji mišić u vokabularu nema. |
| `unknown-group` | FXM grupa koju vokabular ne definiše. |
<!-- /fds:generated -->

### Graditelj {#builder}

Svaki vektor daje zapis odgovora, `entry`, onako kako ga definiše [tok pitanja](./question-flow.md#the-answers-record), i opciono `mode` (`owner` kada je odsutan). Implementacija ga gradi prema objavljenom toku pitanja, sa [`words.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/words.json) kao skupom podataka reči pokreta.

Taj skup podataka napisan je za ove vektore i ni za šta drugo. Reči pokreta su podaci kataloga i FDS ne objavljuje nijednu; ovih nekoliko omogućava vektorima da dosegnu put preko reči, mesta držanja iz reči, spravu iz reči i pitanje iz reči. Nekoliko vektora kodira istu vežbu na oba načina, preko reči i zglob po zglob, i očekuje isti string.

Vektor očekuje:

- `fxi`, kanonski FXI, ili `null` za opremu samu po sebi;
- `fxe`, standardni FXE glavne opreme, ili same opreme;
- `fxeFull`, puni FXE sa detaljima konstrukcije, samo kada su ih odgovori dali;
- uz FXI, `fxiProvenance` i `fxiGap`, koje zapis nosi i koji nikada ne menjaju stringove;

ili `{"error": true}`, za odgovore koje tok ne prihvata. Poruka je implementacijina sopstvena; testira se samo odbijanje. Vektor greške daje i `fix`, jedinu izmenu (u `answers` ili u samom unosu) posle koje se unos gradi: na svako drugo pitanje je odgovoreno, pa vektor pada iz razloga koji navodi i ni iz kog drugog. Adapter može da zanemari `fix`; referentno izvršavanje proverava da svaki od njih zaista omogućava izgradnju svog unosa.

Stringovi moraju da se poklope bajt po bajt. Tri [razrađena primera](./question-flow.md#worked-examples) su ovde vektori, onakvi kakvi su objavljeni.

### Poređenje {#compare}

Vektor `fxi` ili `fxe` daje dva stringa, `a` i `b`, i očekuje ukupnu relaciju `relation` i relaciju svakog sloja u `layers`, pri čemu se svaka čita kao „a je … od b“. Slojevi su svi standardni slojevi, plus prošireni sloj kada ga nose oba stringa. Par kombinovanih FXE, par sa nevažećim stringom i par mešovitih vrsta ne očekuju slojeve.

Svaki od ovih vektora izvršava se i sa zamenjenim `a` i `b`, uz očekivanje obrnutog rezultata: `refines` i `refined-by` menjaju mesta, kao i `narrower` i `broader`. Implementacija ne može da prođe par samo u jednom smeru.

Vektor `fxm` očekuje [stepen](./fxm.md#compare) nad anatomskim listovima iz `fxm-vocabulary.json`, listove koje dva ključa dele, sortirane, a za `contains` i koja je strana `container`.

### Razrešivač {#resolver}

Svaki vektor daje red upita `query`, biblioteku redova `library` i opciono `top`, dužinu liste za potvrdu (3 kada je odsutan). Red je `{id, fxi, fxiProvenance?, mode?, fxiGap?, name?, fxe?}`. Vektor očekuje jedno od sledećeg:

- `{"kind": "auto", "id": …}`, unos iz biblioteke povezan bez pitanja;
- `{"kind": "confirm", "reason": …, "candidates": […]}`, razlog zbog kog je automatsko podudaranje odbijeno i rangiranu listu. Svaki kandidat kaže kako je ušao na listu: `{"via": "fxi", "relation": …}`, `{"via": "near", "layer": …}` sa jednim standardnim slojem koji se razlikuje, ili `{"via": "name"}`;
- `{"kind": "absent"}`, samo kada je biblioteka prazna.

Rangiranje je ono iz [protokola podudaranja](./compare-and-match.md#provenance-match-and-versioning). Nijedan vektor nema dva razloga odbijanja istovremeno, pa se redosled kojim ih implementacija proverava ne testira. Razlozi:

<!-- fds:generated conformance#reasons -->
| Razlog | Znači |
|---|---|
| `no-identical` | Nijedan unos iz biblioteke nije identičan upitu. |
| `several-identical` | Više od jednog unosa iz biblioteke je identično upitu. |
| `query-gap` | Upit nosi marker nedostatka. |
| `entry-gap` | Identičan unos iz biblioteke nosi marker nedostatka. |
| `query-import` | Upit je red iz režima uvoza. |
| `entry-import` | Identičan unos iz biblioteke je red iz režima uvoza. |
| `query-not-owner` | Upit nema ni vlasničko ni vlasnički potvrđeno poreklo. |
| `entry-not-owner` | Identičan unos iz biblioteke nema ni vlasničko ni vlasnički potvrđeno poreklo. |
| `fxe-differs` | I upit i identičan unos iz biblioteke nose FXE, a ta dva se ne porede kao identična. |
<!-- /fds:generated -->

## Izvršavanje vektora {#running-the-vectors}

Datoteke su običan JSON. Da biste testirali implementaciju, napišite adapter koji čita svaku datoteku nivoa, pušta svaki vektor kroz implementaciju i poredi rezultat sa `expect` kao JSON vrednosti: redosled ključeva objekta nije bitan, redosled niza jeste.

Referentni enkoder, [`@vitness/fds-encoder`](https://github.com/vitness-me/fds-spec-website/tree/main/packages/fds-encoder), izvršava se nad svakim vektorom pri svakoj izmeni ovog repozitorijuma i mora da prođe svaki nivo sa 100%. Isto izvršavanje proverava i sam skup testova: da svaka datoteka nivoa imenuje tekuću reviziju pravila, da svaki kod problema i razlog koji definiše očekuje neki vektor, da su njeni razlozi tačno oni koje referenca može da vrati, i da `fix` svakog vektora greške graditelja omogućava izgradnju njegovog unosa.

## Izmereno, a ne sertifikovano {#measured-not-certified}

Gornji nivoi imaju jedan tačan odgovor po vektoru. Dve stvari koje su jednako bitne nemaju, i FDS ih objavljuje kao merenja, sa metodom, a ne kao prolaz ili pad:

- **Slaganje enkodera.** Kada različiti ljudi, ili različiti programi, odgovaraju na tok pitanja za istu vežbu bez uvida u tuđe odgovore, koliko su često njihovi stringovi `identical`, i kako se preostali parovi raspoređuju između `refines`, `compatible` i `contradicting`, po sloju.
- **Ishodi usvajača.** Kada se katalog koji je kodirao sopstvene vežbe podudara sa drugim, koliko se njegovih redova poveže automatski, koliko lista za potvrdu sadrži pravi unos i na kom mestu, koliko ga ne sadrži, i koliko automatskih veza osoba kasnije odbaci.

Nijedno od ovoga nije prag koji implementacija ili katalog mora da dostigne. Oni govore koliko se na deskriptore može osloniti, kako bi usvajač mogao da odluči koliko koraka potvrde da zadrži.

:::note
Prva merenja izvršena su po reviziji pravila 1.3, u ponovljenom testu sa disjunktnim nazivima, i objavljena su u [RFC-010 §9](/docs/specifications/rfc-010-structural-descriptors#9-evidence) sa svojim metodom. Podaci na kojima su izmerena nisu objavljeni. Kalibracija u kojoj kodiraju ljudi i ishodi usvajača još su na čekanju.
:::

| Izveštaj | Rezultat |
|---|---|
| Slaganje enkodera | Izmereno: [RFC-010 §9.3](/docs/specifications/rfc-010-structural-descriptors#93-separation-and-agreement). |
| Ponovljeni test sa disjunktnim nazivima | Izmereno: [RFC-010 §9.2](/docs/specifications/rfc-010-structural-descriptors#92-name-disjoint-re-test), metodom iz §9.1. |
| Kalibracija u kojoj kodiraju ljudi | Na čekanju: vlasnici naspram enkodera, još nije izmereno. |
| Ishodi usvajača | Na čekanju: još nije izmereno za ovu reviziju pravila. |
