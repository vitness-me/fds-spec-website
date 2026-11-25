---
title: 'FXI: deskriptor vežbe'
sidebar_label: 'FXI (vežbe)'
description: 'Nacrt FXI sintakse, podrazumevanih vrednosti, kanonskog oblika, pravila slojeva i svakog koda'
sidebar_position: 2
---

# FXI: deskriptor vežbe

:::caution Nacrt
Nije normativno dok se ne prihvati [RFC-010](/docs/specifications/rfc-010-structural-descriptors), koji usvaja strukturne deskriptore. RFC-010 je nacrt. Pogledajte [pregled](./overview.md).
:::

FXI opisuje strukturu jedne vežbe: koji se zglobovi pokreću i kako, položaj tela, na čemu se telo oslanja, šta ga opterećuje i nekoliko izbora zbog kojih je jedna varijanta druga vežba u odnosu na drugu. Ova stranica definiše string. [Tok pitanja](./question-flow.md) je način da se on izgradi bez pisanja notacije.

Svaki kod koji FXI može da sadrži naveden je na ovoj stranici. Tabele su generisane iz [`specification/registries/descriptors/fxi.registry.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/registries/descriptors/fxi.registry.json), koji je izvor; tekst oko njih je pravilo za njihovu upotrebu.

## Šta dve vežbe čini istom {#what-makes-two-exercises-the-same}

Dve vežbe su ista vežba kada dele svaku od sledećih stavki:

| Dimenzija | Sloj |
|---|---|
| Koji se zglobovi pokreću, kojim redom, da li balistički ili ne, i koji se kraj tela pomera | `m`, `k` |
| Položaj tela na početku: stojeći, sedeći, klečeći, ležeći, i koja je strana okrenuta nadole | `o` |
| Na čemu telo počiva, osim poda koji njegov položaj podrazumeva, i gde ga dodiruje | `s` |
| Svaki rekvizit, koliko ih je i gde se drži; pomoć | `l` |
| Koji udovi rade i kojim redom | `x` |
| Orijentacija šake, klasa širine hvata i klasa stava | `g` |
| Klasa obima pokreta i početni položaj | `r` |
| Iskorak, raskoračni stav ili kretanje | `f` |
| Pokret, ciklus, izdržaj, statičko ili dinamičko istezanje | prefiksi u `m` |
| Zadržani položaj udova koji ne rade | `h` |
| Linija vuče, ili opterećenje koje prolazi iza glave | `p` |
| Pomagalo koje pomaže bez opterećivanja (prošireni) | `a` |

**Zadržan zglob koji menja cilj deo je vežbe.** Istezanje lista sa opruženim kolenom i istezanje sa savijenim kolenom istežu različite mišiće; koleno ide u pokret.

**Preskripcija nikada ne menja vežbu** i nikada ne ide u FXI: iznos opterećenja, tempo, pauze, serije, ponavljanja, odmor, tempo kretanja, trajanje, rastojanje, zategnutost trake, podešavanja sprave, visina kutije i male promene ugla unutar jedne klase (klupa pod nagibom od 30° i od 45° imaju istu orijentaciju).

**Jedna strana pa druga nije naizmenično.** Izvođenje svih ponavljanja jednom stranom pa zatim promena strane (`x:u`) druga je vežba u odnosu na smenjivanje ponavljanje po ponavljanje (`x:a`).

**Podrazumevana vrednost je vrednost. Samo `?` znači nenavedeno.** Svaki sloj osim `m`, `o` i `l` ima objavljenu podrazumevanu vrednost. Običan čučanj ima slobodne ruke, obe noge koje rade zajedno i pun obim pokreta: te podrazumevane vrednosti su vrednosti, i protivreče svakoj drugoj vrednosti. Čučanj sa šakama iza glave (`h:hands.head`) protivreči običnom čučnju. Kada vam ništa ne govori vrednost, napišite `?`; `?` nikada ničemu ne protivreči.

## Sintaksa {#syntax}

### Oblik {#form}

```text
FXI=1.0S/m:<motion>/o:<orientation>/k:<end>/f:<footwork>/s:<support>/l:<load>/x:<symmetry>/g:<grip>/r:<range>/h:<held>/p:<line>
FXI=1.0N/…/p:<line>/a:<accessory>
```

- `1` je glavna verzija, a `0` revizija sintakse; obe se uvek pišu. String koji počinje sa `FXI=1/` je nacrt pre izdanja i nije važeći.
- Slovo posle revizije je oznaka. `S`: svaki napisani sloj je standardni. `N`: string nosi i prošireni sloj. Jedini prošireni sloj je pomagalo `a`.
- `m`, `o` i `l` se uvek pišu. Svaki drugi sloj piše se samo kada se razlikuje od svoje podrazumevane vrednosti.
- Revizija pravila (pogledajte [verzionisanje](./compare-and-match.md#provenance-match-and-versioning)) ne upisuje se u string. String se čita po najnovijoj reviziji pravila svoje glavne verzije, što je bezbedno jer revizija pravila sme samo da precizira.

<!-- fds:generated fxi#layers -->
| Sloj | Vrsta | Čita se iz | Značenje |
|---|---|---|---|
| `m` | standardni | sloj tela | Pokret: zglobne akcije svake faze, redosledom ponavljanja. Obavezan. |
| `o` | standardni | sloj tela | Orijentacija: telo u odnosu na gravitaciju na početku ponavljanja. Uvek se piše; `?` ako nije poznata. |
| `k` | standardni | sloj tela | Pokretni kraj, za rad trupa na podu ili klupi. Podrazumevano: pomera se kraj udova. |
| `f` | standardni | sloj tela | Rad nogu: iskorak, raskoračni stav ili kretanje. Podrazumevano: stopala ravno postavljena. |
| `s` | standardni | sloj tela | Oslonac: površine osim onih koje orijentacija podrazumeva, i tačke tela na njima. Podrazumevano: pod, onako kako orijentacija podrazumeva. |
| `l` | standardni | sloj tela | Opterećenje: svaki rekvizit i mesto gde se drži, ili `bw`. Uvek se piše; `?` ako nije poznato. |
| `x` | standardni | sloj naziva | Simetrija: koji udovi rade i kojim redom. Podrazumevano: `b`, oba zajedno. |
| `g` | standardni | sloj naziva | Hvat i stav: orijentacija šake, širina, stav. Podrazumevano: uobičajeni hvat, srednja širina, srednji stav. |
| `r` | standardni | sloj naziva | Obim pokreta i početak: delimičan ili dubok obim, deficit, početni položaj. Podrazumevano: pun obim od uobičajenog početka. |
| `h` | standardni | sloj naziva | Zadržani položaj udova koji ne rade. Podrazumevano: bez zadržanog položaja. |
| `p` | standardni | sloj naziva | Linija vuče ili putanja pored tela. Podrazumevano: linija koju podrazumeva reč pokreta. |
| `a` | prošireni | sloj tela | Pomagalo: kaiš ili partner koji pomaže vežbu bez opterećivanja. Prošireni: poredi se samo kada ga nose oba stringa. |
<!-- /fds:generated -->

**Sloj tela** opisuje šta telo radi i čita se iz svega što je poznato o vežbi. **Sloj naziva** je izbor koji katalozi rutinski kodiraju u nazivu vežbe; u režimu uvoza čita se samo iz naziva i polja zapisa (pogledajte [pravilo izvora](#the-source-rule)).

### Simboli {#symbols}

| Simbol | Gde | Značenje |
|---|---|---|
| `/` | između slojeva | Razdvaja slojeve. |
| `:` | svaki sloj | Slovo sloja, zatim vrednost. |
| `+` | unutar vrednosti | Spaja stavke: akcije u jednom delu faze, stavke oslonca, rekvizite, elemente hvata, kodove obima pokreta, stavke simetrije, kodove zadržanog položaja, linije. |
| `>` | `m`, `o`, `f`, `g` | Niz redosledom ponavljanja: faze pokreta, početna pa završna orijentacija, promene rada nogu, promene hvata. |
| `\|` | `m` | Dva dela jedne faze istovremeno. |
| `@` | `s`, `l`, `x` | Tačke tela na osloncu; mesto držanja rekvizita; obuhvat koda simetrije. |
| `,` | `s` | Nekoliko tačaka tela na jednom osloncu: `floor@feet,hands`. |
| `*n` | `l` | Broj rekvizita, od `1` do `4`, samo kada se razlikuje od uobičajenog broja. |
| `^ ~ = % &` | početak dela pokreta | Prefiksi faza u nastavku. Bez prefiksa je obična faza pokreta. |
| `-` | posle zglobne akcije | Namerni kratki impuls. |
| `?` | svaka vrednost | Nepoznato: ceo sloj (`o:?`), rekvizit (`?@chest`), mesto držanja (`kb@?`), oslonac (`?@feet`), tačka tela (`floor@feet,?`), smer zgloba (`sh.?`), cela faza (`hip.ext>?`). |
| `*` | ceo sloj | Namerno generički: vežba može da se izvede na bilo koji način („u sedu ili u stojećem stavu“). Nije dozvoljeno za `m`. |

Otvoreni završetak `+?` („i možda još nešto“) nije dozvoljen. Napišite akcije koje znate, ili `?` za celu fazu.

### Podrazumevane vrednosti {#defaults}

| Sloj | Kada je izostavljen, znači |
|---|---|
| `m` | Obavezan; `m:?` kada nije poznat. |
| `o` | Uvek se piše; `o:?` kada nije poznata. |
| `k` | Pomera se kraj udova. |
| `f` | Stopala ravno postavljena. |
| `s` | Pod, onako kako orijentacija podrazumeva. Sopstveno sedište i jastuci sprave nikada se ne pišu. |
| `l` | Uvek se piše; `l:?` kada nije poznato. |
| `x` | `b`: obe strane zajedno, ili pokret nema strane. |
| `g` | Uobičajena orijentacija šake (`su` kada je svaka akcija `el.flex`, inače `pr`), srednja širina, srednji stav. |
| `r` | Pun obim od uobičajenog početka pokreta. |
| `h` | Bez zadržanog položaja: udovi koji ne rade rade ono što pokret podrazumeva. |
| `p` | Uobičajena linija vuče, sa opterećenjem koje prolazi ispred tela. |
| `a` | Prošireni: nije naveden, što je otvoreno. Poredi se samo kada ga nose oba stringa. |

Podrazumevani kod može da se napiše (`x:b`, `f:level`, `k:limbs`, `h:none`, `p:usual`, `g:w-m`); svođenje na kanonski oblik ga izostavlja.

### Kanonski oblik {#canonical-form}

Svaki FXI ima tačno jedan kanonski zapis, i razmenjuje se samo kanonski zapis. Za svođenje na kanonski oblik:

1. Napišite zaglavlje `FXI=1.0` i oznaku (korak 9).
2. Napišite slojeve redosledom `m o k f s l x g r h p a`, svaki jednom.
3. Izostavite svaki sloj koji je na podrazumevanoj vrednosti: `k:limbs`, `f:level`, `x:b`, `h:none`, `p:usual`, `a:none` i oslonac koji je samo `floor`.
4. Unutar vrednosti sortirajte stavke spojene sa `+`, delove spojene sa `|` i tačke tela spojene sa `,` po redosledu kodnih jedinica, sa `?` i `*` posle svakog slova. U `m` izostavite akciju napisanu pored svog deteta u istom delu: `el.flex+sh.ext+sh.ext.oh` je `el.flex+sh.ext.oh`. Nizove `>` zadržite redosledom ponavljanja; u `o`, `f` i `g` sažmite kod ponovljen uzastopno (`standing>standing` je `standing`).
5. U `s` izostavite tačke tela koje početna orijentacija podrazumeva (tabela orijentacija ih navodi), sam `floor` i sam `bench`, `box`, `chair` ili `floor` ispod tela u sedu.
6. U `l` izostavite `bw` kada je napisan i rekvizit, i izostavite svaki broj jednak uobičajenom broju ([brojevi](#load-l)): `l:db*1@hands/x:u` je `l:db@hands/x:u`.
7. U `x` izostavite obuhvat koji pokret već podrazumeva (`u@legs` iskoraka je `u`), i izostavite `x` u potpunosti za pokret koji je samo rotacija ili bočni pregib trupa ili vrata.
8. U `g`, sa jednom fazom hvata, izostavite uobičajenu orijentaciju šake, `w-m` i `st-m`, i izostavite `ne` uz trap šipku, koja ga nameće. Svaki drugi hvat koji rekvizit nameće i dalje se piše: paralelne drške i nastavak sa konopcem su `ne`. Sa više faza izostavite `w-m` i `st-m` iz faze, osim ako bi je to ostavilo praznom. Izostavite stav, osim ako je početak `standing`, `standing.bent` ili `?`, ili stopala guraju ploču sprave za stopala (`mach@feet`).
9. Postavite oznaku: `N` kada je napisan `a`, inače `S`.

Svaki rekvizit nosi mesto držanja (`@?` kada nije poznato); sloj bez vrednosti, sloj napisan dvaput, nepoznat kod, dve suprotne akcije u jednom delu, dva početna koda, `partial` uz `deep` ili dva koda koje tabela označava sa „nikada uz“ čine string nevažećim. String koji krši pravilo sa ove stranice nije FXI. Proverivač prijavljuje svaki problem koji pronađe umesto da nagađa.

## Pravilo izvora {#the-source-rule}

**Režim vlasnika.** Vlasnik vežbe odgovara ono što je za nju tačno onako kako je on izvodi, za svaki sloj, bez obzira na to da li to njen naziv kaže. Objavljena podrazumevana vrednost važi gde god se vežba izvodi na uobičajen način.

**Režim uvoza.** Pri čitanju reda drugog kataloga, bez njegovog vlasnika, izvori su opis, naziv (i alternativni naziv) i polja zapisa.

- **Slojevi tela** `m o k f s l` čitaju se iz opisa, zatim iz naziva, zatim iz polja zapisa, zatim iz podrazumevanih vrednosti reči pokreta, inače `?`. Raniji izvor ima prednost. Opcije („ruke uz telo ili prekrštene“) i trenerski saveti („drži grudi gore“) ništa ne postavljaju.
- **Slojevi naziva** `x g r h p` čitaju se samo iz naziva, kroz uvozni leksikon, zatim iz polja zapisa, zatim iz podrazumevanih vrednosti reči pokreta, inače podrazumevana vrednost sloja. **Opis nikada ne postavlja sloj naziva u režimu uvoza.**
- `k` se piše samo za reči pokreta navedene pod [pokretnim krajem](#moving-end-k).
- **Telesna masa.** Napišite `l:bw` kada zapis ili naziv kaže telesna masa, kada naziv ne imenuje nijedan rekvizit, a reč pokreta je reč za vežbu sa telesnom masom, ili kada je imenovana samo oprema za oslonac. Inače, kada ništa ne imenuje rekvizit, napišite `l:?`.

Čitanje slojeva naziva samo iz naziva omogućava da se dva kataloga slože: varijanta koja je bitna gotovo je uvek u nazivu, jer naziv je način na koji katalog razlikuje sopstvene varijante. Stringovi iz režima uvoza služe samo za pretragu kandidata (pogledajte [protokol podudaranja](./compare-and-match.md#provenance-match-and-versioning)).

Uvozni leksikon, koji reči iz naziva preslikava u kodove, podaci su kataloga na isti način kao i reči pokreta, i nije deo ove stranice.

## Pravila slojeva {#layer-rules}

### Pokret (`m`) {#motion-m}

Napišite zglobne akcije radne faze. Za vežbu sa pokretom napišite **koncentrični** smer: način na koji se zglobovi pokreću dok se radni mišići skraćuju protiv opterećenja. Nikada ne pišite spuštanje, povratak, doskok ni pauzu.

**Koji se zglobovi računaju.** Zglob se računa kada ga radni mišići pokreću kroz jasan obim (oko 30° ili više) kao deo onoga što vežba trenira. Zglob koji se namerno drži nepokretnim nikada se ne računa u delu sa pokretom; zadržana osnova, ili zadržani pritisak na kome je vežba zasnovana, sopstveni je deo `=` (pogledajte istovremene delove u nastavku):

- kičma samo kada je savijanje, ispružanje, bočni pregib ili uvrtanje trupa sam pokret;
- lopatica samo kada se lopatica pomera sama (sleganje ramenima, sklek za lopatice);
- ručni zglob samo u vežbama za ručni zglob, vrat samo u vežbama za vrat;
- skočni zglob samo kada se u vežbi diže na prste ili odražava od tla;
- koleno ne kada drži fiksan pregib (rumunsko mrtvo dizanje, potisak kukovima);
- lakat ne kada drži fiksan pregib (razvlačenje, odručenje);
- rotacija podlaktice samo kada je okretanje protiv otpora sam rad; okretanje dlana tokom pregiba ili potiska je hvat (`g`);
- rotacija ramena samo u vežbama rotacije.

**Smer ramena** procenjuje se po putanji šaka u odnosu na trup:

| Šake se kreću | Kod |
|---|---|
| Od grudi, pod pravim uglom u odnosu na trup, ili se spajaju ispred tela u visini grudi | `sh.hadd` |
| Od grudi ka kraju glave (potisak na kosoj klupi) | `sh.flex+sh.hadd` |
| Napred i nagore, ili nagore pored glave (pretručenje, potisak iznad glave) | `sh.flex` |
| Od grudi ka kraju stopala (potisak sa negativnim nagibom) | `sh.ext+sh.hadd` |
| Nadole duž trupa ka stopalima (propadanja, potisak naniže opruženim rukama) | `sh.ext` |
| Ka trupu iz položaja ispred, laktovi blizu (veslanje) | `sh.ext` |
| Ka trupu iz položaja ispred, laktovi široko u visini ramena (face pull) | `sh.habd` |
| Razdvajaju se u stranu u visini grudi, ruke gotovo opružene (obrnuto razvlačenje) | `sh.habd` |
| Nadole iznad glave, ispred lica (zgib pothvatom; zgib ili povlačenje naniže pothvatom, neutralnim ili uskim hvatom; povlačenje naniže opruženim rukama, pullover, slam) | `sh.ext.oh` |
| Nadole iznad glave, sa strane (zgib ili povlačenje naniže nathvatom srednje ili široke širine) | `sh.add` |
| Nagore u stranu (odručenje; uspravno veslanje sa `el.flex`) | `sh.abd` |

`sh.ext.oh` je dete od `sh.ext`: napišite ga kad god šake počinju iznad glave i spuštaju se ispred. Povlačenje naniže i veslanje tada nikada ne dele pokret, kakav god da je hvat. Samo `sh.ext` nije pogrešno za povlačenje iznad glave, samo je manje specifično: poređenje ga čita kao da pokriva obe putanje. Napisan pored svog deteta u jednom delu, roditelj ne kaže ništa više, i kanonski oblik ga izostavlja. Kod zgiba ili povlačenja naniže hvat odlučuje između dva reda koja počinju iznad glave: pothvat, neutralni ili uski hvat (`su`, `ne`, `w-n`, `w-t`) vuče ispred lica, `sh.ext.oh`.

**Faze (`>`).** Jedna faza po zasebnom pokretu, redosledom ponavljanja. Za svaki par pokreta zapitajte se: da li drugi počinje pre nego što se prvi završi? Da: jedna faza (thruster, u kome potisak počinje dok se telo još diže). Ne: dve faze (čučanj, pa potisak). Jedan zglob može da se kreće u suprotnim smerovima u različitim fazama, nikada u jednom delu. Faza koju ne možete da utvrdite je `?`.

**Prefiksi.** Jedan po delu, napisan ispred njegovih akcija:

<!-- fds:generated fxi#phasePrefixes -->
| Kod | Značenje |
|---|---|
| (bez) | Dinamički: zglobovi se kreću kroz obim; napišite koncentrični smer. |
| `^` | Balistički: faza se završava letom (telo napušta tlo) ili otpuštanjem (rekvizit napušta šake). Faza posle nje odvija se u vazduhu. |
| `~` | Ciklični: neprekidni ciklusi bez granice ponavljanja; napišite pogonsku polovinu jednog ciklusa. |
| `=` | Izometrijski: izdržaj pod naporom tokom cele serije; napišite ono ka čemu mišići guraju. `=0` je izdržaj bez smera (ravnoteža). |
| `%` | Statičko istezanje: smerovi u koje se zglobovi dovode, zadržani na kraju obima. |
| `&` | Dinamičko istezanje: isti smerovi, dovedeni do kraja obima i ponovo otpuštani (zamasi, provlačenja). |
<!-- /fds:generated -->

Samo „eksplozivno“ ili „brzo“ nije let: `^` zahteva da telo napusti tlo ili da rekvizit napusti šake. Slam je balistički samo kada rekvizit napusti šake; slam sa battle rope konopcem, koji nikada ne napušta šake, ne dobija `^`. Akcija izvedena u vazduhu je sledeća faza. Ciklične faze i olimpijska dizanja nikada ne dobijaju `^`. `~0` je valjanje na valjku ili lopti bez smera zgloba; `=0` je izdržaj ravnoteže ili pritiska.

**Kratki impuls (`-`).** Posle akcije koja namerno prelazi kratak obim: spuštanje i odraz u push press-u (`hip.ext-+kn.ext-`), kratko ustajanje posle prihvata u power varijanti.

**Istovremeni delovi (`|`).** Dva dela odjednom u jednoj fazi: delovi različitih vrsta (izometrijsko držanje ruku dok noge hodaju, `=sh.hadd|~hip.ext+kn.ext`; zadržana plank pozicija ispod podizanja noge, `=sp.flex|hip.ext`), ili dva uda dovedena u suprotne smerove u jednom istezanju (`%hip.ext|%hip.flex`). **Zadržani pritisak udova koji se ne pomeraju, kada je vežba zasnovana na njemu, takođe je deo `=`**: trbušnjak koji kroz celo ponavljanje vuče pete nadole u pod je `=kn.flex|hip.flex+sp.flex`. Savet da se zategne ili stisne nije zadržani pritisak. Faza sa više delova ne može da sadrži deo `?`.

**Zadržani zglobovi u istezanju.** Napišite zadržani zglob kada on odlučuje koji se mišić isteže: koleno u istezanju lista ili zadnje lože (`kn.ext` opruženo, `kn.flex` savijeno).

**Samomasaža.** Valjanje dela tela na valjku ili lopti je `~0`; mirno oslanjanje na njih je `=0`. Valjak napišite u `s` sa tačkom na njemu (`s:roller@thighs`), i bez drugog dodira.

**Kruženja.** Kruženja rukama, kukovima ili skočnim zglobovima i haloi su `~<joint>.circ`. Zglob u nepoznatom smeru je `<joint>.?`.

<!-- fds:generated fxi#joints -->
| Kod | Značenje | Napomene |
|---|---|---|
| `nk` | Vrat. | Uzima `.circ`. |
| `sp` | Kičma: trup, grudni i slabinski deo zajedno. | Uzima `.circ`. |
| `sc` | Lopatica: lopatica na grudnom košu. | Zglob ruke. |
| `sh` | Rameni zglob. | Zglob ruke. Uzima `.circ`. |
| `el` | Lakat. | Zglob ruke. |
| `fa` | Podlaktica: okret koji rotira dlan. | Zglob ruke. |
| `wr` | Ručni zglob. | Zglob ruke. Uzima `.circ`. |
| `hip` | Kuk. | Zglob noge. Uzima `.circ`. |
| `kn` | Koleno. | Zglob noge. |
| `ank` | Skočni zglob i stopalo. | Zglob noge. Uzima `.circ`. |
<!-- /fds:generated -->

<!-- fds:generated fxi#jointActions -->
| Kod | Značenje | Napomene |
|---|---|---|
| `nk.flex` | Fleksija vrata: brada ka grudima. | Suprotno od `nk.ext`. |
| `nk.ext` | Ekstenzija vrata: glava se zabacuje unazad. | Suprotno od `nk.flex`. |
| `nk.lflex` | Bočni pregib vrata: uvo ka ramenu. |  |
| `nk.rot` | Rotacija vrata: okretanje glave. |  |
| `sp.flex` | Fleksija trupa: rebra ka karlici, kao u trbušnjaku. | Suprotno od `sp.ext`. |
| `sp.ext` | Ekstenzija trupa: ispravljanje ili izvijanje leđa iz pognutog položaja. | Suprotno od `sp.flex`. |
| `sp.lflex` | Bočni pregib trupa. |  |
| `sp.rot` | Rotacija trupa: ramena se uvrću u odnosu na kukove. |  |
| `sc.elev` | Elevacija lopatica: sleganje nagore. | Suprotno od `sc.dep`. |
| `sc.dep` | Depresija lopatica: ramena povučena nadole. | Suprotno od `sc.elev`. |
| `sc.pro` | Protrakcija lopatica: lopatice se razmiču oko rebara. | Suprotno od `sc.ret`. |
| `sc.ret` | Retrakcija lopatica: lopatice se skupljaju. | Suprotno od `sc.pro`. |
| `sh.flex` | Fleksija ramena: ruka napred i nagore, kao u pretručenju ili potisku iznad glave. | Suprotno od `sh.ext`. |
| `sh.ext` | Ekstenzija ramena: ruka nadole i unazad iz položaja ispred tela, kao u veslanju ili propadanjima. Pokriva `sh.ext.oh`. | Suprotno od `sh.flex`. |
| `sh.ext.oh` | Ekstenzija ramena iznad glave: ruke se spuštaju ispred lica iz položaja iznad glave, kao u zgibu pothvatom, povlačenju naniže uskim ili neutralnim hvatom, povlačenju naniže opruženim rukama, pulloveru ili slamu. | Dete od `sh.ext`; `sh.ext` ga pokriva pri poređenju. |
| `sh.abd` | Abdukcija ramena: ruka u stranu i nagore, kao u odručenju. | Suprotno od `sh.add`. |
| `sh.add` | Adukcija ramena: ruka nadole uz telo iz položaja u stranu, kao u zgibu širokim hvatom. | Suprotno od `sh.abd`. |
| `sh.hadd` | Horizontalna adukcija: ruka preko prednje strane tela u visini grudi, kao u potisku ili razvlačenju. | Suprotno od `sh.habd`. |
| `sh.habd` | Horizontalna abdukcija: ruka unazad i u stranu u visini grudi, kao u obrnutom razvlačenju. | Suprotno od `sh.hadd`. |
| `sh.ir` | Unutrašnja rotacija ramena: podlaktica se okreće ka stomaku, lakat savijen. | Suprotno od `sh.er`. |
| `sh.er` | Spoljašnja rotacija ramena: podlaktica se okreće ka spolja, lakat savijen. | Suprotno od `sh.ir`. |
| `el.flex` | Fleksija lakta, kao u pregibu. | Suprotno od `el.ext`. |
| `el.ext` | Ekstenzija lakta, kao u potisku ili ekstenziji za triceps. | Suprotno od `el.flex`. |
| `fa.pron` | Pronacija podlaktice: dlan se okreće nadole. | Suprotno od `fa.sup`. |
| `fa.sup` | Supinacija podlaktice: dlan se okreće nagore. | Suprotno od `fa.pron`. |
| `wr.flex` | Fleksija ručnog zgloba: dlan ka podlaktici. | Suprotno od `wr.ext`. |
| `wr.ext` | Ekstenzija ručnog zgloba: nadlanica ka podlaktici. | Suprotno od `wr.flex`. |
| `wr.rdev` | Radijalna devijacija ručnog zgloba: strana palca ka podlaktici. | Suprotno od `wr.udev`. |
| `wr.udev` | Ulnarna devijacija ručnog zgloba: strana malog prsta ka podlaktici. | Suprotno od `wr.rdev`. |
| `hip.flex` | Fleksija kuka: butina ka trupu, ili trup ka butini. | Suprotno od `hip.ext`. |
| `hip.ext` | Ekstenzija kuka: butina od trupa, kao pri ustajanju iz čučnja. | Suprotno od `hip.flex`. |
| `hip.abd` | Abdukcija kuka: noga u stranu. | Suprotno od `hip.add`. |
| `hip.add` | Adukcija kuka: noga ka drugoj nozi. | Suprotno od `hip.abd`. |
| `hip.ir` | Unutrašnja rotacija kuka: koleno se okreće ka unutra. | Suprotno od `hip.er`. |
| `hip.er` | Spoljašnja rotacija kuka: koleno se okreće ka spolja. | Suprotno od `hip.ir`. |
| `kn.flex` | Fleksija kolena protiv otpora, kao u pregibu nogu. | Suprotno od `kn.ext`. |
| `kn.ext` | Ekstenzija kolena, kao pri ustajanju iz čučnja. | Suprotno od `kn.flex`. |
| `ank.df` | Dorzalna fleksija skočnog zgloba: prsti ka potkolenici. | Suprotno od `ank.pf`. |
| `ank.pf` | Plantarna fleksija skočnog zgloba: podizanje na prste, odraz. | Suprotno od `ank.df`. |
| `ank.inv` | Inverzija skočnog zgloba: tabani se okreću ka unutra. | Suprotno od `ank.ev`. |
| `ank.ev` | Everzija skočnog zgloba: tabani se okreću ka spolja. | Suprotno od `ank.inv`. |
<!-- /fds:generated -->

### Orijentacija (`o`) {#orientation-o}

Orijentacija tela **na početku prve napisane faze**. Uglovi trupa mere se od horizontale: ravno unutar 15°, kosi ili negativan nagib 15–60°, više od 60° sa glavom nagore je u sedu ili u stojećem stavu.

- Pretklon veći od oko 30° koji se **zadržava** tokom serije je `standing.bent`. Pretklon u kome se trup pomera (mrtvo dizanje, zamah girjom) počinje kao `standing`.
- Na šakama i kolenima, u plank poziciji ili skleku, ležeći licem nadole: `prone` i njegove klase nagiba. Orijentacija prati trup, a ne kolena: klečanje sa trupom presavijenim napred preko butina (položaj deteta) je `prone`; `kneeling` ima uspravan trup. Kukovi najviši u obrnutom V: `prone.pike`.
- Sedenje na podu sa zaklonom od 30–60°: `supine.incline`.
- Telo drže šake, uključujući oslonac na šipkama za propadanja: `hanging`.
- Na spravi napišite položaj tela: opružanje nogu u sedu je `seated`, pregib nogu u ležećem položaju `prone`, zavaljeni nožni potisak `supine.incline`.
- Kada se ponavljanje završava u drugoj orijentaciji (ustajanje sa poda), napišite `start>end`. Ponavljanje koje ide nadole i vraća se završava se tamo gde je počelo i piše samo početak.
- `*` kada je vežba namenjena izvođenju na bilo koji način; `?` kada ništa ne kaže.

<!-- fds:generated fxi#orientations -->
| Kod | Značenje | Napomene |
|---|---|---|
| `standing` | Na nogama, trup unutar oko 30° od vertikale. | Podrazumeva `feet` na osloncu. |
| `standing.bent` | Na nogama, trup u pretklonu većem od oko 30° i zadržan tako (veslanje u pretklonu). | Podrazumeva `feet` na osloncu. |
| `seated` | U sedu, trup više od 60° od horizontale. | Podrazumeva `seat` na osloncu. |
| `seated.bent` | U sedu, trup u pretklonu preko butina i zadržan tako (podizanje u pretklonu u sedu). | Podrazumeva `seat` na osloncu. |
| `kneeling` | Na oba kolena, trup uspravan. Na šakama i kolenima je `prone`. | Podrazumeva `knees`, `shins` na osloncu. |
| `kneeling.half` | Na jednom kolenu, drugo stopalo napred. | Podrazumeva `knees`, `feet` na osloncu. |
| `supine` | Licem nagore, trup unutar 15° od horizontale. | Podrazumeva `back` na osloncu. |
| `supine.incline` | Licem nagore, glava viša od kukova, trup 15–60° od horizontale. | Podrazumeva `back` na osloncu. |
| `supine.decline` | Licem nagore, glava niža od kukova, trup 15–60° od horizontale. | Podrazumeva `back` na osloncu. |
| `prone` | Licem nadole, trup unutar 15° od horizontale: ležeći, plank, sklek, na šakama i kolenima. | Podrazumeva `chest` na osloncu. |
| `prone.incline` | Licem nadole, glava viša od kukova, 15–60° (šake podignute). | Podrazumeva `chest` na osloncu. |
| `prone.decline` | Licem nadole, glava niža od kukova, 15–60° (stopala podignuta). | Podrazumeva `chest` na osloncu. |
| `prone.pike` | Licem nadole, kukovi najviši, šake i stopala dole, trup više od 60° sa glavom nadole (pike). | Podrazumeva `feet`, `hands` na osloncu. |
| `side-lying` | Na jednom boku: ležeći, ili bočni plank. | Ne podrazumeva tačku. |
| `hanging` | Telo drže šake ili ruke, stopala odvojena od poda: visi na šipki, oslonjen na šipke za propadanja. | Podrazumeva `hands` na osloncu. |
| `inverted` | Naglavačke, trup unutar 30° od vertikale, glava najniža: stoj na šakama, stoj na glavi. | Podrazumeva `hands` na osloncu. |
<!-- /fds:generated -->

### Pokretni kraj (`k`) {#moving-end-k}

`k:trunk` kada se trup pomera, a noge miruju: podizanje trupa, trbušnjak (ne obrnuti trbušnjak), ekstenzija leđa, most ili potisak kukovima, glute-ham podizanje, nordijski pregib, trbušnjak na sajli ili klečeći trbušnjak, sprava za trbušnjake. `k:both` kada se oba kraja kreću jedan ka drugom: V-podizanje, nož (jackknife), tuck-up. U režimu uvoza `k` pišite samo za te reči.

<!-- fds:generated fxi#movingEnds -->
| Kod | Značenje | Napomene |
|---|---|---|
| `limbs` | Pomera se kraj udova (podrazumevano, nikada se ne piše). | Podrazumevano, nikada se ne piše. |
| `trunk` | Pomera se kraj trupa; noge miruju: podizanje trupa, trbušnjak, most, potisak kukovima, ekstenzija leđa, glute-ham podizanje, nordijski pregib. |  |
| `both` | Oba kraja se kreću jedan ka drugom: V-podizanje, nož (jackknife), tuck-up. |  |
<!-- /fds:generated -->

### Rad nogu (`f`) {#footwork-f}

Korak se vraća u svakom ponavljanju; kretanje se nastavlja. Iskorak bez smera ide napred; obrnuti iskorak ide nazad; bočni iskorak ide u stranu; curtsy iskorak ide nazad i ukoso. Split čučanj ili iskorak u mestu je `split`; hodajući iskorak, nošenje, guranje sanki, puzanje i skok udalj kreću se napred. Split izbačaj je `level>split`. „U mestu“ i rad na kardio spravi izostavljaju `f`.

<!-- fds:generated fxi#footwork -->
| Kod | Značenje | Napomene |
|---|---|---|
| `level` | Stopala ravno postavljena (podrazumevano). Piše se samo unutar niza. | Podrazumevano, nikada se ne piše. |
| `split` | Stopala postavljena u raskoračni stav, jedno ispred drugog. |  |
| `step.fwd` | Svako ponavljanje iskoračuje napred i vraća se. |  |
| `step.back` | Svako ponavljanje iskoračuje nazad i vraća se. |  |
| `step.side` | Svako ponavljanje iskoračuje u stranu i vraća se. |  |
| `step.cross` | Svako ponavljanje iskoračuje nazad i ukoso iza druge noge (curtsy) i vraća se. |  |
| `travel.fwd` | Telo se kreće napred i ne vraća se u svakom ponavljanju. |  |
| `travel.back` | Kreće se unazad. |  |
| `travel.side` | Kreće se bočno. |  |
<!-- /fds:generated -->

### Oslonac (`s`) {#support-s}

Napišite svaku površinu koja nosi težinu tela, ili na koju je ud oslonjen, osim onoga što orijentacija podrazumeva. Koristite bilo koji token opreme osim `bw`, zatim `@` i tačke tela na njemu, izostavljajući tačke koje početna orijentacija podrazumeva.

Nikada ne pišite: sam pod; sedište vežbe u sedu (osim ako je nestabilno: lopta, BOSU, daska, valjak); sopstveno sedište, jastuke ili drške sprave; prostirku; opremu koja samo opterećuje telo; ni oslonac za ruku koji služi samo za ravnotežu. Šaka koja drži kavez ili stub da bi držala telo zaista nosi težinu: `s:rack@hands`.

Kada trup ne počiva ni na čemu (plank, sklek), navedite svaku tačku koja nosi težinu: `s:floor@feet,hands`. Različite površine ispod različitih tačaka su zasebne stavke: `s:ball@feet+floor@hands`. Ne pišite `floor@feet` pored drugog oslonca kada je telo u sedu, ili leži licem nagore na osloncu koji nosi njegov trup; zadržite ga za telo licem nagore koje visi o šakama (obrnuto veslanje, `s:bar@hands+floor@feet`). Kutija, stepenik, klupa ili platforma ispod podignutih šaka ili stopala je `box`, osim ako je površina imenovana. Sedanje na kutiju je `s:box@seat`. Površina na koju se staje ili skače računa se (`s:box`).

<!-- fds:generated fxi#bodyPoints -->
| Kod | Značenje |
|---|---|
| `hands` | Šake, ili jedna šaka. |
| `forearms` | Podlaktice, laktovi savijeni (plank na laktovima). |
| `elbows` | Pregib laktova (Zercher). |
| `arms` | Nadlaktice (jastuk Skotove klupe). |
| `shoulders` | Na prednjoj strani ramena i ključnih kostiju (front rack), ili na jednom ramenu. |
| `chest` | Uz grudi (goblet, medveđi zagrljaj). |
| `back` | Preko gornjeg dela leđa (zadnji čučanj). |
| `hips` | Preko prednje strane kukova (potisak kukovima). |
| `waist` | Okačeno o pojas na struku. |
| `seat` | Zadnjica (sedanje na kutiju ili klupu). |
| `thighs` | Na butinama ili oko njih. |
| `knees` | Kod kolena ili oko njih. |
| `shins` | Cevanice. |
| `calves` | Listovi (zadnja strana potkolenice). |
| `ankles` | Kod članaka ili tik iznad njih (kaiš, manžetna, jastuk sprave na potkolenici). |
| `feet` | Stopala, ili jedno stopalo. |
| `head` | Glava ili čelo. |
<!-- /fds:generated -->

### Opterećenje (`l`) {#load-l}

Navedite svaki rekvizit koji opterećuje radne mišiće, svaki sa `@` i mestom na kome se drži.

- `bw` znači bez rekvizita. Stoji sam i ne uzima mesto držanja; propadanja sa tegom su `l:plate@waist`, a ne `bw+plate`.
- **Sprave i stanice dolaze iz FXE.** Najpre odredite opremu ([FXE](./fxe.md)). Namenska sprava piše se `mach`, kardio sprava `erg` (ili njeno dete po ciklusu, `erg.row`), stub sa sajlom `cable`, Smit sprava `smith`, landmine `landmine`.
- Kardio sprava je uvek u `l`, drži se tamo gde njen pokretni deo dodiruje telo, nikada u `s`.
- Traka je `band`, drži se tamo gde pritiska ili vuče telo; gde je usidrena ne piše se. Njen tip ide samo u FXE. U radu u kome se pomeraju samo noge, traka je `@feet`, osim ako nije drugačije navedeno.
- Pomoć se drži `@assist`. Sprava za zgib ili propadanja uz pomoć uvek je `mach@assist`; FXE beleži gde njen jastuk dodiruje telo.

**Mesta držanja.** U šakama, uz telo, na dohvat ruke ili u zamahu: `@hands`, kao i bučice koje se drže u visini ramena, traka čiji se krajevi drže u šakama kod ramena i šipka koja se potiskuje bez oslanjanja na ramena. Opruženim rukama iznad glave tokom celog ponavljanja: `@overhead`. Oslonjeno na prednju stranu ramena, ili kraj landmine-a koji se drži kod ramena: `@shoulders`. Privijeno uz grudi: `@chest`. Preko gornjeg dela leđa, uključujući šipku iza vrata: `@back`. Preko kukova: `@hips`. Sa pojasa: `@waist`. U pregibu laktova: `@elbows`. Teg na krilu pri podizanju na prste u sedu: `@thighs`.

<!-- fds:generated fxi#holdOnlyPoints -->
| Kod | Značenje |
|---|---|
| `overhead` | Drži se u šakama, sa rukama opruženim iznad glave tokom celog ponavljanja. |
| `assist` | Rekvizit preuzima deo telesne mase (traka za pomoć, sprava uz pomoć). |
<!-- /fds:generated -->

**Brojevi.** Izostavite broj kada je uobičajen; svođenje na kanonski oblik izostavlja napisani broj jednak njemu. Rekvizit za jednu ruku (`db`, `kb`, `plate`, `club`) je jedan po radnoj šaci: jedan kada ruke rade jedna po jedna (`x` je `u@arms`, ili `u` uz pokret samo zglobova ruku), inače dva. `x:u` bez obuhvata uz pokret zglobova nogu, ili zglobova ruku i nogu (iskorak sa potiskom jednom rukom), ostavlja obe šake opterećene: jedna bučica tu je `db*1@hands`. Tako je `db@hands` jedna bučica u veslanju jednom rukom (`x:u`) i dve u čučnju, naizmeničnom pregibu (`x:a`) ili split čučnju (`x:u`, noge). Svaki drugi rekvizit je jedan, kao i svaki rekvizit koji se drži na tački trupa (`chest`, `back`, `hips`, `waist`). `*n` pišite samo kada se broj razlikuje: jedna girja u obe šake je `kb*1@hands`. Kada je rekvizit, mesto držanja rekvizita za jednu ruku, simetrija ili pokret pod `x:u` bez obuhvata `?`, uobičajeni broj nije poznat, i napisani broj ostaje.

**Nepoznanice.** Rekvizit nepoznate vrste: `?@chest`. Nepoznato mesto držanja: `kb@?`. Rekvizit nepoznate vrste na nepoznatom mestu („sa tegom“, ništa više): `?@?`. Ništa nije poznato, čak ni da li postoji rekvizit: `l:?`.

**Tokeni opreme.** Svaki token je alias jednog standardnog FXE. Podtoken precizira svoj roditeljski token: `dome` pokriva `dome.up` i `dome.down`; `erg` pokriva svaki `erg.<cycle>`.

<!-- fds:generated fxi#equipmentTokens -->
| Token | U | Standardni FXE koji označava | Značenje |
|---|---|---|---|
| `bw` | `l` | `FXE=1.0S/k:none` | Bez rekvizita: samo telesna masa. Stoji sam, bez mesta držanja. |
| `bb` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.straight` | Šipka. |
| `ez` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.ez` | EZ šipka. |
| `tb` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.trap` | Trap ili heks šipka. |
| `axle` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.axle` | Axle šipka. |
| `camber` | `l`, `s` | `FXE=1.0S/k:imp/f:bar.camber` | Zakrivljena šipka. |
| `db` | `l`, `s` | `FXE=1.0S/k:imp/f:bell.dumb` | Bučica. |
| `kb` | `l`, `s` | `FXE=1.0S/k:imp/f:bell.kettle` | Girja. |
| `circus` | `l`, `s` | `FXE=1.0S/k:imp/f:bell.circus` | Cirkuska bučica. |
| `mb` | `l`, `s` | `FXE=1.0S/k:imp/f:ball.med` | Medicinka. |
| `slam` | `l`, `s` | `FXE=1.0S/k:imp/f:ball.slam` | Slam lopta. |
| `bag` | `l`, `s` | `FXE=1.0S/k:imp/f:bag.sand` | Vreća sa peskom. |
| `hbag` | `l`, `s` | `FXE=1.0S/k:imp/f:bag.heavy` | Teška vreća. |
| `plate` | `l`, `s` | `FXE=1.0S/k:imp/f:plate` | Disk. |
| `chain` | `l`, `s` | `FXE=1.0S/k:imp/f:chain` | Lanac. |
| `rope` | `l`, `s` | `FXE=1.0S/k:imp/f:rope.battle` | Battle rope konopac. |
| `jrope` | `l`, `s` | `FXE=1.0S/k:imp/f:rope.jump` | Vijača. |
| `band` | `l`, `s` | `FXE=1.0S/k:imp/f:band` | Bilo koja elastična traka, cev, superband ili miniband. |
| `sled` | `l`, `s` | `FXE=1.0S/k:imp/f:sled` | Sanke ili prowler. |
| `tire` | `l`, `s` | `FXE=1.0S/k:imp/f:tire` | Guma. |
| `hammer` | `l`, `s` | `FXE=1.0S/k:imp/f:hammer` | Malj. |
| `stone` | `l`, `s` | `FXE=1.0S/k:imp/f:stone` | Atlas kamen. |
| `log` | `l`, `s` | `FXE=1.0S/k:imp/f:log` | Trupac. |
| `keg` | `l`, `s` | `FXE=1.0S/k:imp/f:keg` | Bure. |
| `yoke` | `l`, `s` | `FXE=1.0S/k:imp/f:yoke` | Jaram. |
| `frame` | `l`, `s` | `FXE=1.0S/k:imp/f:frame.carry` | Farmerske drške ili okvir za nošenje (rikša). |
| `car` | `l`, `s` | `FXE=1.0S/k:imp/f:car` | Automobil. |
| `vest` | `l`, `s` | `FXE=1.0S/k:imp/f:wear.vest` | Prsluk sa tegovima. |
| `ankwt` | `l`, `s` | `FXE=1.0S/k:imp/f:wear.ankle` | Teg za članak. |
| `club` | `l`, `s` | `FXE=1.0S/k:imp/f:club` | Palica ili buzdovan. |
| `dowel` | `l`, `s` | `FXE=1.0S/k:imp/f:stick` | Štap, drška metle ili PVC cev: postavlja šake, ne dodaje opterećenje. |
| `wheel` | `l`, `s` | `FXE=1.0S/k:imp/f:wheel` | Točak za trbušnjake. |
| `wroller` | `l`, `s` | `FXE=1.0S/k:imp/f:roller.wrist` | Valjak za ručne zglobove. |
| `harness` | `l`, `s` | `FXE=1.0S/k:imp/f:harness.head` | Oprema za glavu. |
| `cable` | `l`, `s` | `FXE=1.0S/k:stn/f:cable` | Stub sa sajlom ili krosover stanica (ne sprava za povlačenje naniže ni za veslanje u sedu). |
| `smith` | `l`, `s` | `FXE=1.0S/k:stn/f:smith` | Smit sprava. |
| `landmine` | `l`, `s` | `FXE=1.0S/k:stn/f:landmine` | Landmine, ili kraj šipke zaglavljen u uglu. |
| `erg.gait` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:gait` | Kardio sprava za hodanje ili trčanje po traci (traka za trčanje). Dete od `erg`. |
| `erg.step` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:step` | Kardio sprava za stepovanje (steper, stepmill). Dete od `erg`. |
| `erg.cycle` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:cycle` | Kardio sprava za okretanje pedala nogama ili rukama (bicikl, air bike, ručni ergometar). Dete od `erg`. |
| `erg.row` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:row` | Sprava za veslanje. Dete od `erg`. |
| `erg.pole` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:pole` | Ski erg. Dete od `erg`. |
| `erg.glide` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:glide` | Eliptični trenažer. Dete od `erg`. |
| `erg.climb` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:climb` | Sprava za penjanje (vertikalni penjač ili penjač po lestvama). Dete od `erg`. |
| `mach` | `l`, `s` | `FXE=1.0S/k:mac/l:?/s:?/m:?` | Bilo koja namenska sprava za snagu (uključujući sprave za povlačenje naniže i za veslanje na sajli u sedu). FXE reda imenuje koja. |
| `erg` | `l`, `s` | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?` | Bilo koja kardio sprava: traka za trčanje, bicikl, sprava za veslanje, eliptični trenažer, sprava za penjanje uz stepenice, ski erg. FXE reda imenuje koja. |
| `floor` | `s` | `FXE=1.0S/k:sup/f:floor` | Pod ili prostirka. |
| `wall` | `s` | `FXE=1.0S/k:sup/f:wall` | Zid. |
| `bench` | `s` | `FXE=1.0S/k:sup/f:bench` | Klupa. |
| `box` | `s` | `FXE=1.0S/k:sup/f:box` | Kutija, stepenik ili platforma. |
| `chair` | `s` | `FXE=1.0S/k:sup/f:chair` | Stolica. |
| `block` | `s` | `FXE=1.0S/k:sup/f:block` | Blokovi za dizanje. |
| `rack` | `s` | `FXE=1.0S/k:sup/f:rack` | Kavez ili stalak za čučanj. |
| `ball` | `s` | `FXE=1.0S/k:sup/f:ball.stab` | Lopta za stabilnost. |
| `dome` | `s` | `FXE=1.0S/k:sup/f:dome` | BOSU, nije navedeno kojom stranom nagore. |
| `dome.up` | `s` | `FXE=1.0S/k:sup/f:dome` | BOSU kupolom nagore. Dete od `dome`. |
| `dome.down` | `s` | `FXE=1.0S/k:sup/f:dome` | BOSU ravnom stranom nagore (kupola na podu). Dete od `dome`. |
| `board` | `s` | `FXE=1.0S/k:sup/f:board.bal` | Daska za ravnotežu. |
| `roller` | `s` | `FXE=1.0S/k:sup/f:roller.foam` | Penasti valjak. |
| `slider` | `s` | `FXE=1.0S/k:sup/f:slider` | Klizač. |
| `strap` | `s` | `FXE=1.0S/k:sup/f:strap.susp` | Trake za suspenzioni trening. |
| `ring` | `s` | `FXE=1.0S/k:sup/f:ring` | Gimnastički krugovi. |
| `crope` | `s` | `FXE=1.0S/k:sup/f:rope.climb` | Uže za penjanje. |
| `bar` | `s` | `FXE=1.0S/k:sup/f:bar.fixed` | Fiksna šipka: vratilo za zgibove, ili šipka na stalku koja služi kao rukohvat. |
| `bars` | `s` | `FXE=1.0S/k:sup/f:bar.parallel` | Paralelne šipke za propadanja. |
| `pbars` | `s` | `FXE=1.0S/k:sup/f:bar.parallette` | Paralete. |
| `preacher` | `s` | `FXE=1.0S/k:sup/f:pad.preacher` | Jastuk Skotove klupe. |
| `hyper` | `s` | `FXE=1.0S/k:sup/f:pad.hyper` | Klupa za ekstenziju leđa (rimska stolica za podizanje trupa ili bočno podizanje). |
| `ghd` | `s` | `FXE=1.0S/k:sup/f:pad.ghd` | Glute-ham developer. |
| `vkr` | `s` | `FXE=1.0S/k:sup/f:station.vkr` | Kapetanska stolica / stanica za podizanje kolena. |
| `pole` | `s` | `FXE=1.0S/k:sup/f:pole` | Vertikalni stub ili direk koji se hvata šakama (ljudska zastava). |
| `mball` | `s` | `FXE=1.0S/k:sup/f:ball.massage` | Loptica za masažu ili lakros loptica. |
<!-- /fds:generated -->

### Simetrija (`x`) {#symmetry-x}

Dodajte obuhvat kada samo ruke ili samo noge prate obrazac: `u@arms`, `u@legs`. Kada ruke i noge prate različite obrasce, napišite jednu stavku po obuhvatu: nošenje kofera je `x:rc@legs+u@arms`. Napišite jedan kod, ili jedan po obuhvatu. Istezanje, valjanje ili izdržaj koji radi jedan ud pa drugi je `x:u`.

<!-- fds:generated fxi#symmetry -->
| Kod | Značenje | Napomene |
|---|---|---|
| `b` | Bilateralno: oba uda rade zajedno, ili pokret nema strane (podrazumevano, nikada se ne piše). | Podrazumevano, nikada se ne piše. |
| `u` | Unilateralno: jedna strana izvodi sva ponavljanja serije, pa druga strana. |  |
| `a` | Naizmenično: strane se smenjuju ponavljanje po ponavljanje; jedna strana radi dok druga čeka. |  |
| `rc` | Recipročno: obe strane se kreću istovremeno u suprotnim smerovima (hod, flutter udarci nogama, see-saw potisak). |  |
<!-- /fds:generated -->

<!-- fds:generated fxi#symmetryScopes -->
| Kod | Značenje |
|---|---|
| `arms` | Obrazac se odnosi na ruke. |
| `legs` | Obrazac se odnosi na noge. |
<!-- /fds:generated -->

### Hvat i stav (`g`) {#grip-and-stance-g}

Jedna orijentacija šake, jedna širina i jedan stav po fazi, spojeni sa `+`: `g:ne+w-n`. Širina se odnosi na šake na rekvizitu i na osloncu (dijamant sklek je `w-t`). Kada se hvat menja unutar ponavljanja, napišite jednu fazu po položaju: pregib koji se okreće iz pothvata u nathvat je `g:su>pr`.

<!-- fds:generated fxi#handOrientations -->
| Kod | Značenje |
|---|---|
| `pr` | Pronirani: dlanovi nadole ili od sebe (nathvat). |
| `su` | Supinirani: dlanovi nagore ili ka sebi (pothvat). |
| `ne` | Neutralni: dlanovi okrenuti jedan ka drugom (čekić). |
| `mx` | Mešoviti: jedna šaka nathvatom, druga pothvatom. |
<!-- /fds:generated -->

<!-- fds:generated fxi#gripWidths -->
| Kod | Značenje | Napomene |
|---|---|---|
| `w-t` | Šake se dodiruju ili preklapaju (dijamant). |  |
| `w-n` | Uski: šake unutar širine ramena. |  |
| `w-m` | Srednji: otprilike u širini ramena (podrazumevano, nikada se ne piše). | Podrazumevano, nikada se ne piše. |
| `w-w` | Široki: šake znatno izvan širine ramena. |  |
<!-- /fds:generated -->

<!-- fds:generated fxi#stances -->
| Kod | Značenje | Napomene |
|---|---|---|
| `st-n` | Uski stav: stopala spojena ili bliže od širine kukova. |  |
| `st-m` | Srednji stav: otprilike u širini kukova (podrazumevano, nikada se ne piše). | Podrazumevano, nikada se ne piše. |
| `st-w` | Široki stav (sumo). |  |
<!-- /fds:generated -->

### Obim pokreta i početak (`r`) {#range-and-start-r}

Najviše jedan početni kod, i samo tamo gde to nije uobičajeni početak pokreta. Nikada ne pišite `r` za pun obim. Kutija sa koje se skače u dubinskom skoku je početak (`from-drop`), a ne oslonac; kutija na koju se potom skače jeste (`s:box`).

<!-- fds:generated fxi#ranges -->
| Kod | Značenje | Napomene |
|---|---|---|
| `partial` | Namerno deo uobičajenog obima: polovina, četvrtina, pulsiranja, gornja ili donja polovina. |  |
| `deep` | Dublje od uobičajenog obima: puna dubina, „ass to grass“, dubina pištolj čučnja. |  |
| `deficit` | Stajanje na nečemu radi većeg obima od uobičajenog. |  |
| `from-floor` | Svako ponavljanje počinje sa opterećenjem koje miruje na podu, gde uobičajeni početak nije pod. | Početni kod. |
| `from-top` | Počinje u stojećem stavu sa opterećenjem u rukama, spušta se bez spuštanja na pod (visina), gde to nije uobičajeni početak. Bez deteta, uobičajena visina: iznad kolena. | Početni kod. |
| `from-top.knee` | Visina koja počinje u nivou kolena ili ispod njega. Dete od `from-top`. | Početni kod. Dete od `from-top`; `from-top` ga pokriva pri poređenju. |
| `from-pins` | Svako ponavljanje počinje sa osigurača, blokova ili stalka iznad poda. | Početni kod. |
| `from-drop` | Svako ponavljanje počinje padom: telo silazi sa kutije ili platforme i doskače pre radne faze (dubinski skok). Kutija sa koje se silazi ne piše se u `s`. | Početni kod. |
<!-- /fds:generated -->

### Zadržani položaj (`h`) i linija vuče (`p`) {#held-posture-h-and-line-of-pull-p}

Oba su standardni slojevi naziva sa podrazumevanom vrednošću. Vlasnik piše zadržani položaj i liniju koje vežba zaista koristi. `h:?` ili `p:?` služi za izvor koji kaže da se položaj ili linija razlikuju, a ne kaže kako.

Sidro na podu (sanke na tlu, traka ispod stopala) je `lo`. `p:neck` razdvaja potisak spušten do vrata ili grla od potiska na klupi sa istim hvatom; `p:double` razdvaja vijaču koja prolazi dvaput u svakom skoku od običnog preskakanja vijače.

<!-- fds:generated fxi#heldPostures -->
| Kod | Značenje | Napomene |
|---|---|---|
| `none` | Bez zadržanog položaja: udovi koji ne rade rade ono što reč pokreta podrazumeva (podrazumevano, nikada se ne piše). | Podrazumevano, nikada se ne piše. |
| `arms.oh` | Ruke opružene iznad glave, ništa u šakama. |  |
| `arms.fwd` | Ruke opružene i ispružene napred od ramena, ništa u šakama („ispružene ruke“, „opružena ruka“). |  |
| `arms.side` | Ruke ispružene u stranu. |  |
| `arms.cross` | Ruke prekrštene na grudima. |  |
| `hands.head` | Šake iza glave ili na glavi (zatvorenički položaj). |  |
| `el.bent` | Radni laktovi savijeni pod oko 90° („savijena ruka“, „90 stepeni“). |  |
| `ua.oh` | Nadlaktice podignute pored glave dok laktovi rade (ekstenzija za triceps iznad glave). | Nikada uz `ua.side`. |
| `ua.side` | Nadlaktice odmaknute od tela, laktovi rašireni, dok laktovi rade (pregib za unutrašnji biceps, Tate potisak). | Nikada uz `ua.oh`. |
| `leg.fwd` | Slobodna noga opružena ispred. |  |
| `leg.back` | Slobodna noga iza. |  |
| `legs.l` | Noge opružene pod oko 90° fleksije kuka. | Nikada uz `kn.bent`. |
| `kn.bent` | Kolena savijena dok kukovi ili ruke rade (podizanje kolena u visu; obrnuto veslanje sa stopalima ravno na podu). | Nikada uz `legs.l`. |
| `trunk.fwd` | Trup nagnut napred tamo gde orijentacija to već ne kaže (propadanja za grudi). |  |
<!-- /fds:generated -->

<!-- fds:generated fxi#lines -->
| Kod | Značenje | Napomene |
|---|---|---|
| `usual` | Linija vuče koju reč pokreta podrazumeva (podrazumevano, nikada se ne piše). | Podrazumevano, nikada se ne piše. |
| `hi` | Sajla ili traka usidrena više nego što je uobičajeno za reč pokreta. | Nikada uz `lo`, `side`. |
| `lo` | Usidreno niže nego što je uobičajeno za reč pokreta. | Nikada uz `hi`, `side`. |
| `behind` | Opterećenje ili telo prolazi iza glave ili trupa umesto ispred (potisak iza vrata, zgib iza glave). |  |
| `side` | Opterećenje vuče sa jedne strane: telo stoji bočno u odnosu na sidro (potisak na sajli izveden bočno). | Nikada uz `hi`, `lo`. |
| `neck` | Opterećenje se spušta do vrata, grla ili brade umesto do grudi (JM potisak, giljotina potisak). |  |
| `double` | Vijača prolazi ispod stopala dvaput u svakom skoku (double under). |  |
<!-- /fds:generated -->

### Pomagalo (`a`, prošireni) {#accessory-a-extended}

Pomagalo nikada ne opterećuje radne mišiće (to je `l`) i nikada ne nosi težinu (to je `s`). String koji nosi `a` označen je sa `N`, a poređenje uzima `a` u obzir samo kada ga nose oba stringa. Izostavite ga kada pomagalo nije navedeno.

<!-- fds:generated fxi#accessories -->
| Kod | Značenje | Napomene |
|---|---|---|
| `none` | Bez pomagala (podrazumevano, nikada se ne piše). | Podrazumevano, nikada se ne piše. |
| `strap` | Kaiš, pojas, peškir ili konopac kojim se vuče ili drži ud (kaiš za istezanje). |  |
| `partner` | Partner koji drži, pruža otpor ili pomaže. |  |
<!-- /fds:generated -->

## Kako FXI i FXE dele činjenice {#how-fxi-and-fxe-divide-the-facts}

| FXE poseduje | FXI poseduje |
|---|---|
| Šta je oprema | Zglobni pokret i njegove faze |
| Fiksnu geometriju: interfejs opterećenja, položaj koji sprava nameće, pokret koji vodi | Orijentaciju |
| Pogon, ograničenje i konstrukcijske atribute | Hvat, simetriju, obim pokreta, rad nogu |
| | Podešavanja pri svakoj upotrebi: visinu koturače, ugao klupe, sidro trake |
| | Mesto držanja i broj |

Zajedničke činjenice proveravaju se jedna prema drugoj, nikada se ne računaju dvaput. FXI poređenje nikada ne uzima u obzir klasu sprave; FXE poređenje nikada ne uzima u obzir izbor pri upotrebi. Stranica [FXE](./fxe.md#checks-between-fxi-and-fxe) navodi unakrsne provere.
