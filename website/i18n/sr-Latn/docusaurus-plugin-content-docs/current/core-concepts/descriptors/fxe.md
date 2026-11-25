---
title: 'FXE: deskriptor opreme'
sidebar_label: 'FXE (oprema)'
description: 'Nacrt FXE sintakse, vrsta, postupka i svakog koda'
sidebar_position: 4
---

# FXE: deskriptor opreme

:::caution Nacrt
Nije normativno dok se ne prihvati [RFC-010](/docs/specifications/rfc-010-structural-descriptors), koji usvaja strukturne deskriptore. RFC-010 je nacrt. Pogledajte [pregled](./overview.md).
:::

FXE opisuje komad opreme po njegovoj strukturi. Dva komada opreme su isti kada se svaka vežba napisana za jedan može izvesti na drugom sa istim dodirima tela, istim vođenim pokretom u odnosu na telo i istom vrstom pokretnog dela, menjajući samo podešavanja koja vežba beleži.

FXE klasifikuje; ne katalogizuje. Nema kod za brend, model ni proizvod, a FDS ne objavljuje listu opreme. Unosi opreme jednog provajdera nose FXE stringove.

Svaki kod koji FXE može da sadrži naveden je na ovoj stranici. Tabele su generisane iz [`specification/registries/descriptors/fxe.registry.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/registries/descriptors/fxe.registry.json).

## Principi {#principles}

- **Fiksna geometrija je oprema; sve što se podešava pri svakoj upotrebi je vežba.** Visina koturače, ugao klupe, tačka sidrenja trake, nastavak, hvat, jedan ud ili dva i visina sedišta pripadaju FXI-ju.
- **Kodirajte opremu, a ne vežbu koja se na njoj izvodi.** Podizanje na prste izvedeno na spravi za nožni potisak koristi spravu za nožni potisak: kodirajte sopstveni vođeni pokret te sprave.
- **Imenovana sprava ima prednost.** Kada vežba imenuje spravu, ta sprava je oprema, šta god vežba na njoj radi.
- Kada izvor kaže samo „sprava“, sprava je ona napravljena za glavni pokret vežbe.

## Sintaksa {#syntax}

```text
FXE=1.0S/k:<kind>/<standard layers>                  standard: the form every exercise record and equipment record writes
FXE=1.0N/k:<kind>/<standard layers>/<extended>       full: an equipment registry record with build details
FXE=1.0S/<configuration>;<configuration>             a combination machine
```

- `1` je glavna verzija, `0` revizija sintakse, a `S` ili `N` oznaka, kao u FXI. `N` znači da je napisan prošireni sloj.
- `k` dolazi prvi. **Standardni** slojevi jedne vrste slede redosledom koji daje njena tabela i uvek se pišu, sa `?` kada nisu poznati. **Prošireni** slojevi slede samo kada su navedeni, i samo u zapisu opreme u registru; `fxe` zapisa vežbe uvek je standardni.
- `k:none` ne uzima nijedan drugi sloj. `k:?` ne uzima nijedan drugi sloj.
- Kombinovana sprava spaja standardni FXE svake konfiguracije znakom `;`, sortirano. Kombinacija spaja konfiguracije sprava ili stanica; `k:none` i `k:?` se nikada ne kombinuju. Zapis vežbe piše samo konfiguraciju koju vežba koristi.

**Kanonski oblik.** Prvo vrsta; standardni slojevi po redu; zatim prošireni slojevi redosledom `r c g a`, uz izostavljanje svake vrednosti koju oblik već podrazumeva (bučici ne treba `r:grav`); vrednosti spojene sa `+` sortirane; konfiguracije sortirane; oznaka postavljena na `N` tačno onda kada preostane prošireni sloj.

<!-- fds:generated fxe#kinds -->
| Kod | Značenje | Napomene |
|---|---|---|
| `none` | Bez opreme: telo je celo opterećenje. | Bez slojeva. |
| `imp` | Rekvizit: slobodan predmet koji se pomera, drži ili nosi na telu. | Standardni slojevi `f`. Prošireni slojevi `r`, `c`. |
| `sup` | Oslonac: površina ili okvir na kome telo leži, o koji visi ili na koji se upire. Ne nosi opterećenje. | Standardni slojevi `f`. Prošireni slojevi `c`. |
| `acc` | Pomagalo: drška, kaiš, pojas, prostirka, peškir ili marker. Nikada ne definiše vežbu. | Standardni slojevi `f`. |
| `stn` | Stanica: vodilica ili sidro sa opštim interfejsom koji se koristi za mnoge pokrete: stub sa sajlom, Smit sprava, landmine. | Standardni slojevi `f`. Prošireni slojevi `r`, `c`, `a`. |
| `mac` | Namenska sprava: vođeni mehanizam sa fiksnim interfejsima prema telu, napravljen za jedan pokret. | Standardni slojevi `l`, `s`, `m`. Prošireni slojevi `r`, `c`, `g`, `a`. |
| `erg` | Ciklična sprava: ponavlja cele cikluse (kardio). | Standardni slojevi `c`, `l`, `s`, `m`. Prošireni slojevi `r`. |
<!-- /fds:generated -->

## Postupak {#procedure}

**Korak 1. Vrsta `k`.** Uvek se piše. Obrazac opterećenja nije oprema: „sa tegom“ bez navedenog oblika je `FXE=1.0S/k:imp/f:?`. „Uz pomoć“ bez rekvizita, ili „drugo“, je `FXE=1.0S/k:?`.

**Korak 2. `imp`, `sup`, `acc`, `stn`: jedan standardni sloj, oblik `f`.** Izaberite atom. Generička reč uzima generički atom („traka“ je `band`); dete koristite samo kada je imenovano (duga kružna traka je `band.loop`). Kaiš za istezanje je `FXE=1.0S/k:acc/f:strap.stretch`; FXI istezanja izvedenog uz njega nosi `a:strap`. Sprava za veslanje na sajli u sedu sa sopstvenim sedištem i sprava za povlačenje naniže su namenske sprave (`mac`); sve ostalo na sajli je stanica `FXE=1.0S/k:stn/f:cable`.

**Korak 3. `mac`: tri standardna sloja, redosledom `l s m`.**

`m`, vođeni pokret: ono što pokretni deo sprave vodi, u odnosu na trup.

- Jednozglobna sprava, čija je osovina poravnata sa jednim zglobom, piše zglobnu akciju: pregib nogu `kn.flex`, opružanje nogu `kn.ext`, pec deck `sh.hadd`, sprava za zadnje rame `sh.habd`, sprava za odručenje `sh.abd`, pullover `sh.ext`, sleganje ramenima `sc.elev`, aduktor `hip.add`, abduktor `hip.abd`, sprava za ekstenziju kuka `hip.ext`, sprava za trbušnjake `sp.flex`, ekstenzija leđa `sp.ext`, rotacija trupa `sp.rot`, podizanje na prste `ank.pf`.
- Višezglobna sprava piše `push.`, `pull.` ili `assist.` i smer: potisak iznad glave, hack čučanj ili čučanj sa pojasom `push.up`; sprava za mrtvo dizanje `pull.up`; povlačenje naniže `pull.down`; propadanja u sedu `push.down`; potisak za grudi i nožni potisak `push.fwd`; veslanje `pull.back`; potisak na kosoj klupi `push.fwdup`; potisak na klupi sa negativnim nagibom `push.fwddown`; visoko veslanje `pull.backdown`; zgib ili propadanja uz pomoć `assist.up`.

`l`, interfejs opterećenja: mesto na kome pokretni deo dodiruje telo. Dva spojite sa `+` samo kada oba pomeraju opterećenje. Kada ništa ne kaže drugačije:

| `m` | podrazumevani `l` |
|---|---|
| `kn.flex`, `kn.ext`, `hip.flex` | `ankle` |
| `el.*`, `sc.elev`, `sh.habd`, i svaki `push.*` ili `pull.*` koji se radi rukama | `hand` |
| `sh.hadd`, `sh.abd`, `sh.flex`, `sh.ext` | `arm` |
| `hip.add`, `hip.abd` | `thigh` |
| `sp.flex`, `sp.rot` | `chest` |
| `sp.ext` | `back` |
| `assist.up` | `knee` (`foot` kada korisnik stoji na platformi) |

Poznate sprave: nožni potisak je `foot`; hack, klatno ili V-čučanj `shoulder`; čučanj sa pojasom `hip`; podizanje na prste `thigh` u sedu, `shoulder` u stojećem stavu, `hip` sa trupom na jastuku; zabacivanje noge za gluteus `foot`; sprava za potisak kukovima `hip` uz `supine`; reverse hyper `ankle` uz `prone`.

`s`, položaj u koji sprava stavlja korisnika. Svaki zavaljeni nožni potisak je `recline` (onaj sa uspravnim sedištem je `seat`); hack, klatno, V-čučanj i čučanj sa pojasom su `stand`; namenska sprava za veslanje je `seat.chest`, osim veslanja na sajli u sedu sa pločom za stopala, koje je `seat`; sprava za zadnje rame je `seat.chest`; T-bar veslanje sa osloncem za grudi je `prone`; sprava za zgib ili propadanja uz pomoć je `hang`. Kada ništa ne kaže: `seat.chest` za `sh.habd`; `seat` za `kn.ext`, `el.*`, ostale `sh.*`, `sp.flex`, `sp.rot`, `hip.add`, `hip.abd`, `hip.flex`, svaki `push.*` koji se radi rukama, `pull.down` i `pull.backdown`; `recline` za `push.fwd` uz `foot`; `stand` za `push.up` uz `shoulder` ili `hip`, i za `sc.elev`, `hip.ext` i `pull.up`; inače `?`.

**Korak 4. `erg`: četiri standardna sloja, redosledom `c l s m`.** Svaki tip kardio sprave piše sva četiri:

<!-- fds:generated fxe#cardioMachineTypes -->
| Tip | Sprava | `c` | `l` | `s` | `m` | FXI držanje |
|---|---|---|---|---|---|---|
| `treadmill` | Traka za trčanje | `belt` | `foot` | `stand` | `gait` | `@feet` |
| `stepmill` | Stepmill (pokretne stepenice) | `belt` | `foot` | `stand` | `step` | `@feet` |
| `stepper` | Steper (pedale) | `link` | `foot` | `stand` | `step` | `@feet` |
| `stair` | Sprava za penjanje uz stepenice, nije poznato da li steper ili stepmill | `?` | `foot` | `stand` | `step` | `@feet` |
| `bike-upright` | Uspravni ili spin bicikl | `loop` | `foot` | `seat` | `cycle` | `@feet` |
| `bike-recumbent` | Ležeći bicikl | `loop` | `foot` | `recline` | `cycle` | `@feet` |
| `bike` | Sobni bicikl, nije poznato da li uspravni ili ležeći | `loop` | `foot` | `?` | `cycle` | `@feet` |
| `air-bike` | Air bike (pokretne ručke) | `loop` | `foot+hand` | `seat` | `cycle` | `@feet` |
| `elliptical` | Eliptični trenažer | `loop` | `foot+hand` | `stand` | `glide` | `@feet` |
| `rower` | Sprava za veslanje | `rail` | `hand` | `seat` | `row` | `@hands` |
| `ski` | Ski erg | `cable` | `hand` | `stand` | `pole` | `@hands` |
| `ube` | Ergometar za gornji deo tela (ručne pedale, u sedu) | `loop` | `hand` | `seat` | `cycle` | `@hands` |
| `vertical-climber` | Vertikalni penjač | `line` | `foot+hand` | `stand` | `climb` | `@feet` |
| `ladder-climber` | Penjač po lestvama | `belt` | `foot+hand` | `stand` | `climb` | `@feet` |
<!-- /fds:generated -->

Kardio sprava nepoznatog tipa piše `?` za svaki sloj koji ne može da popuni: `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?`.

**Korak 5. Kombinovane sprave** (multi-hip, pec deck sa krakovima za zadnje rame, povlačenje naniže sa niskim veslanjem): standardni FXE konfiguracija spojeni znakom `;`.

**Korak 6. Prošireni slojevi**, samo u zapisu opreme u registru: `r` pogon, `c` ograničenje ili popustljivost, `g` ugao vođenja, `a` konstrukcijski atributi. „Poluga“ znači `c:arc` uz `r:plate`; „sanke“ znače `c:line` uz `r:plate`.

**Generičke vrednosti.**

| Izvor kaže | FXE |
|---|---|
| sprava za snagu, nepoznate vrste | `FXE=1.0S/k:mac/l:?/s:?/m:?` |
| kardio sprava, nepoznate vrste | `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?` |
| trake | `FXE=1.0S/k:imp/f:band` |
| telesna masa | `FXE=1.0S/k:none` |
| sa tegom, bez oblika | `FXE=1.0S/k:imp/f:?` |
| drugo; uz pomoć, bez rekvizita | `FXE=1.0S/k:?` |

## Glavna oprema vežbe {#the-main-equipment-of-an-exercise}

`fxe` zapisa vežbe je standardni FXE njene glavne opreme, pročitan iz njenog FXI ovim redosledom:

1. sprava ili kardio sprava u `l` (`mach`, `erg` ili dete `erg.<cycle>`), sa sopstvenim slojevima sprave;
2. inače stanica u `l` (`cable`, `smith`, `landmine`);
3. inače rekvizit za opterećenje u `l`; ako ih je više, prvi u [tabeli tokena opreme](./fxi.md#load-l). Rekvizit nepoznate vrste daje `FXE=1.0S/k:imp/f:?` kada nijedan drugi rekvizit nije poznat. Celo `l:?` nije rekvizit;
4. inače prvi oslonac u `s` osim poda, po redosledu tokena;
5. inače `FXE=1.0S/k:none` kada je `l:bw`;
6. inače `FXE=1.0S/k:?`.

Drugi rekvizit vežbe sa dva rekvizita ostaje u FXI; nikada ne pravi drugi FXE. Tip trake (`band.loop`, `band.mini`, `band.tube`) piše se u FXE kada je poznat; FXI kaže samo `band`.

## Provere između FXI i FXE {#checks-between-fxi-and-fxe}

FXI i FXE jednog zapisa proveravaju se jedan prema drugom. Proverivač upozorava kada bilo šta od sledećeg nije ispunjeno:

1. FXE zapisa ne protivreči FXE-u glavnog tokena iz FXI.
2. Položaj sprave odgovara početnoj orijentaciji iz FXI (tabela položaja navodi koji).
3. Interfejs opterećenja sprave odgovara FXI mestu držanja za `mach` ili `erg` (tabela interfejsa opterećenja navodi koji).
4. Pokret jednozglobne sprave pojavljuje se u FXI pokretu, ili se pojavljuje njegovo dete (`sh.ext` sprave za pullover i `sh.ext.oh` iz FXI), osim ako vežba imenuje spravu (podizanje na prste na spravi za nožni potisak).
5. `k:none` ide uz `l:bw`.
6. Kardio podtoken odgovara FXE ciklusu: `erg.gait` uz `m:gait`, i tako dalje.
7. `floor@feet` pored drugog oslonca podrazumeva se pod telom u sedu, i pod telom koje leži licem nagore na osloncu koji nosi njegov trup.

## Kodovi {#codes}

### Oblici (`f`) {#forms-f}

<!-- fds:generated fxe#forms -->
**`imp`**

| Oblik | Značenje | Napomene |
|---|---|---|
| `bar.straight` | Šipka, olimpijska ili standardna. | Podrazumeva `r:grav`. |
| `bar.ez` | EZ šipka. | Podrazumeva `r:grav`. |
| `bar.trap` | Trap ili heks šipka. | Podrazumeva `r:grav`. |
| `bar.axle` | Debela axle šipka. | Podrazumeva `r:grav`. |
| `bar.camber` | Zakrivljena šipka. | Podrazumeva `r:grav`. |
| `bell.dumb` | Bučica. | Podrazumeva `r:grav`. |
| `bell.kettle` | Girja. | Podrazumeva `r:grav`. |
| `bell.circus` | Cirkuska bučica. | Podrazumeva `r:grav`. |
| `ball.med` | Medicinka. | Podrazumeva `r:grav`. |
| `ball.slam` | Slam lopta. | Podrazumeva `r:grav`. |
| `bag.sand` | Vreća sa peskom. | Podrazumeva `r:grav`. |
| `bag.heavy` | Viseća teška vreća. | Podrazumeva `r:grav`, `c:swing`. |
| `plate` | Disk koji se drži ili nosi sam za sebe. | Podrazumeva `r:grav`. |
| `chain` | Lanac za dizanje. | Podrazumeva `r:grav`. |
| `rope.battle` | Battle rope konopac. | Podrazumeva `r:grav`. |
| `rope.jump` | Vijača. | Podrazumeva `r:none`. |
| `band` | Elastična traka ili cev, tip nije naveden. | Podrazumeva `r:elastic`. |
| `band.loop` | Duga kružna traka: superband, power band. | Dete od `band`. Podrazumeva `r:elastic`. |
| `band.mini` | Kratka kružna traka koja se nosi oko nogu: miniband. | Dete od `band`. Podrazumeva `r:elastic`. |
| `band.tube` | Elastična cev sa drškama. | Dete od `band`. Podrazumeva `r:elastic`. |
| `sled` | Sanke ili prowler, koji se guraju ili vuku po tlu. | Podrazumeva `r:friction`. |
| `tire` | Velika guma. | Podrazumeva `r:grav`. |
| `hammer` | Malj. | Podrazumeva `r:grav`. |
| `stone` | Atlas kamen. | Podrazumeva `r:grav`. |
| `log` | Strongman trupac. | Podrazumeva `r:grav`. |
| `keg` | Bure. | Podrazumeva `r:grav`. |
| `yoke` | Strongman jaram. | Podrazumeva `r:grav`. |
| `frame.carry` | Farmerske drške ili okvir za nošenje (rikša). | Podrazumeva `r:grav`. |
| `car` | Automobil, koji se podiže ili gura. | Podrazumeva `r:grav`. |
| `wear.vest` | Prsluk sa tegovima. | Podrazumeva `r:grav`. |
| `wear.ankle` | Teg za članak. | Podrazumeva `r:grav`. |
| `club` | Indijska palica ili buzdovan. | Podrazumeva `r:grav`. |
| `stick` | Štap, drška metle ili PVC cev. | Podrazumeva `r:none`. |
| `wheel` | Točak za trbušnjake. | Podrazumeva `r:none`, `c:roll`. |
| `roller.wrist` | Valjak za ručne zglobove. | Podrazumeva `r:grav`. |
| `harness.head` | Oprema za glavu sa visećim opterećenjem. | Podrazumeva `r:grav`. |

**`sup`**

| Oblik | Značenje | Napomene |
|---|---|---|
| `floor` | Pod, ili prostirka na njemu. |  |
| `wall` | Zid. |  |
| `bench` | Klupa, ravna ili podesiva. |  |
| `box` | Kutija, stepenik ili platforma. |  |
| `chair` | Stolica. |  |
| `block` | Blokovi sa kojih šipka kreće. |  |
| `rack` | Kavez ili stalak za čučanj, sa svojim osiguračima. |  |
| `ball.stab` | Lopta za stabilnost, pilates lopta. | Podrazumeva `c:tilt`. |
| `dome` | BOSU, bilo kojom stranom nagore. | Podrazumeva `c:tilt`. |
| `board.bal` | Daska za ravnotežu. | Podrazumeva `c:tilt`. |
| `roller.foam` | Penasti valjak. | Podrazumeva `c:roll`. |
| `slider` | Klizni disk. | Podrazumeva `c:slide`. |
| `strap.susp` | Trake za suspenzioni trening. | Podrazumeva `c:swing`. |
| `ring` | Gimnastički krugovi. | Podrazumeva `c:swing`. |
| `rope.climb` | Uže za penjanje. | Podrazumeva `c:swing`. |
| `bar.fixed` | Fiksna šipka iznad glave: vratilo za zgibove. |  |
| `bar.parallel` | Paralelne šipke za propadanja. |  |
| `bar.parallette` | Paralete na podu. |  |
| `pad.preacher` | Skotova klupa. |  |
| `pad.hyper` | Klupa za ekstenziju leđa, 45° ili 90° (zove se i rimska stolica za podizanje trupa ili bočno podizanje). |  |
| `pad.ghd` | Glute-ham developer. |  |
| `station.vkr` | Stanica za vertikalno podizanje kolena (kapetanska stolica). |  |
| `pole` | Vertikalni stub, direk ili uspravni nosač kaveza koji se hvata rukama. |  |
| `ball.massage` | Loptica za masažu ili lakros loptica koja se valja ispod tela. |  |

**`acc`**

| Oblik | Značenje | Napomene |
|---|---|---|
| `handle` | Pojedinačna D-drška. |  |
| `handle.bar` | Prava ili zakrivljena šipka za sajlu. |  |
| `handle.v` | V-drška ili drška za uski hvat. |  |
| `handle.rope` | Konopac za triceps. |  |
| `strap.ankle` | Manžetna za članak. |  |
| `belt.dip` | Pojas za propadanja. |  |
| `belt.lift` | Pojas za dizanje. |  |
| `strap.lift` | Trake za dizanje. |  |
| `strap.stretch` | Kaiš za istezanje: kaiš, pojas ili kružna traka koja se koristi za privlačenje uda u istezanju. |  |
| `towel` | Peškir koji se koristi kao drška. |  |
| `marker` | Čunj, prepona ili marker na podu. |  |
| `board.press` | Daska postavljena na grudi za delimične potiske. |  |
| `mat` | Prostirka za pod. |  |

**`stn`**

| Oblik | Značenje | Napomene |
|---|---|---|
| `cable` | Stub sa sajlom, krosover ili funkcionalni trenažer: koturača postavljena za svaku vežbu. | Podrazumeva `r:stack`, `c:cable`. |
| `smith` | Smit sprava: šipka na fiksnim šinama. | Podrazumeva `r:plate`, `c:line`. |
| `landmine` | Landmine: jedan kraj šipke u podnom zglobu (i T-bar veslanje iz ugla). | Podrazumeva `r:grav`, `c:pivot`. |
<!-- /fds:generated -->

### Interfejsi opterećenja (`l`, za `mac` i `erg`) {#load-interfaces-l-for-mac-and-erg}

<!-- fds:generated fxe#loadInterfaces -->
| Kod | Značenje | Napomene |
|---|---|---|
| `hand` | Drške ili šipka u rukama. | Odgovara FXI `@hands`, `@overhead`. |
| `foot` | Ploča za stopala ili pedale. | Odgovara FXI `@feet`. |
| `ankle` | Jastuk na potkolenici. | Odgovara FXI `@shins`, `@calves`, `@ankles`. |
| `thigh` | Jastuk na butini. | Odgovara FXI `@thighs`. |
| `knee` | Jastuk ili platforma kod kolena. | Odgovara FXI `@knees`. |
| `arm` | Jastuk na nadlaktici ili laktu. | Odgovara FXI `@forearms`, `@elbows`, `@arms`. |
| `chest` | Jastuk na grudima. | Odgovara FXI `@chest`. |
| `back` | Jastuk na leđima. | Odgovara FXI `@back`. |
| `shoulder` | Jastuci na ramenima. | Odgovara FXI `@shoulders`. |
| `hip` | Jastuk ili pojas kod kukova. | Odgovara FXI `@hips`, `@waist`. |
| `head` | Jastuk na glavi. | Odgovara FXI `@head`. |
| `seat` | Pokretno sedište. | Odgovara FXI `@seat`. |
<!-- /fds:generated -->

### Položaji (`s`, za `mac` i `erg`) {#postures-s-for-mac-and-erg}

<!-- fds:generated fxe#postures -->
| Kod | Značenje | Napomene |
|---|---|---|
| `seat` | U sedu. | Odgovara FXI `seated`, `seated.bent`. |
| `seat.chest` | U sedu, grudi uz jastuk. | Odgovara FXI `seated`, `seated.bent`. |
| `stand` | U stojećem stavu. | Odgovara FXI `standing`, `standing.bent`. |
| `stand.chest` | U stojećem stavu ili pretklonu, trup na jastuku. | Odgovara FXI `standing`, `standing.bent`, `prone.incline`. |
| `prone` | Ležeći licem nadole, ravno ili pod nagibom. | Odgovara FXI `prone`, `prone.incline`, `prone.decline`. |
| `supine` | Ležeći licem nagore. | Odgovara FXI `supine`, `supine.incline`, `supine.decline`. |
| `recline` | Zavaljen na kosom naslonu za leđa (nožni potisak). | Odgovara FXI `supine`, `supine.incline`, `seated`. |
| `kneel` | Klečeći. | Odgovara FXI `kneeling`, `kneeling.half`. |
| `hang` | Telo drže šake ili podlaktice. | Odgovara FXI `hanging`. |
| `side` | Ležeći na boku. | Odgovara FXI `side-lying`. |
<!-- /fds:generated -->

### Vođeni pokret (`m`, za `mac`) {#guided-motion-m-for-mac}

Višezglobni vođeni pokret je glagol, `.` i smer: `pull.back`. Jednozglobni vođeni pokret je zglobna akcija.

<!-- fds:generated fxe#guidedMotionVerbs -->
| Kod | Značenje |
|---|---|
| `push` | Pokretni deo se gura od korisnika. |
| `pull` | Pokretni deo se vuče ka korisniku. |
| `assist` | Pokretni deo pomaže podizanje tela. |
<!-- /fds:generated -->

<!-- fds:generated fxe#guidedMotionDirections -->
| Kod | Značenje |
|---|---|
| `up` | Ka glavi: potisak iznad glave, hack čučanj, čučanj sa pojasom, sprava za mrtvo dizanje. |
| `down` | Ka stopalima: povlačenje naniže, propadanja u sedu. |
| `fwd` | Od prednje strane trupa: potisak za grudi, nožni potisak. |
| `back` | Ka prednjoj strani trupa: veslanje. |
| `fwdup` | Napred i nagore: potisak na kosoj klupi. |
| `fwddown` | Napred i nadole: potisak sa negativnim nagibom. |
| `backdown` | Nazad i nadole: visoko veslanje. |
<!-- /fds:generated -->

<!-- fds:generated fxe#singleJointMotions -->
| Kod | Značenje |
|---|---|
| `kn.flex` | Fleksija kolena protiv otpora, kao u pregibu nogu. |
| `kn.ext` | Ekstenzija kolena, kao pri ustajanju iz čučnja. |
| `el.flex` | Fleksija lakta, kao u pregibu. |
| `el.ext` | Ekstenzija lakta, kao u potisku ili ekstenziji za triceps. |
| `sh.flex` | Fleksija ramena: ruka napred i nagore, kao u pretručenju ili potisku iznad glave. |
| `sh.ext` | Ekstenzija ramena: ruka nadole i unazad iz položaja ispred tela, kao u veslanju ili povlačenju naniže opruženim rukama. |
| `sh.abd` | Abdukcija ramena: ruka u stranu i nagore, kao u odručenju. |
| `sh.add` | Adukcija ramena: ruka nadole uz telo iz položaja u stranu, kao u zgibu širokim hvatom. |
| `sh.hadd` | Horizontalna adukcija: ruka preko prednje strane tela u visini grudi, kao u potisku ili razvlačenju. |
| `sh.habd` | Horizontalna abdukcija: ruka unazad i u stranu u visini grudi, kao u obrnutom razvlačenju. |
| `sh.ir` | Unutrašnja rotacija ramena: podlaktica se okreće ka stomaku, lakat savijen. |
| `sh.er` | Spoljašnja rotacija ramena: podlaktica se okreće ka spolja, lakat savijen. |
| `sc.elev` | Elevacija lopatica: sleganje nagore. |
| `hip.flex` | Fleksija kuka: butina ka trupu, ili trup ka butini. |
| `hip.ext` | Ekstenzija kuka: butina od trupa, kao pri ustajanju iz čučnja. |
| `hip.abd` | Abdukcija kuka: noga u stranu. |
| `hip.add` | Adukcija kuka: noga ka drugoj nozi. |
| `sp.flex` | Fleksija trupa: rebra ka karlici, kao u trbušnjaku. |
| `sp.ext` | Ekstenzija trupa: ispravljanje ili izvijanje leđa iz pognutog položaja. |
| `sp.rot` | Rotacija trupa: ramena se uvrću u odnosu na kukove. |
| `sp.lflex` | Bočni pregib trupa. |
| `ank.pf` | Plantarna fleksija skočnog zgloba: podizanje na prste, odraz. |
| `ank.df` | Dorzalna fleksija skočnog zgloba: prsti ka potkolenici. |
| `nk.flex` | Fleksija vrata: brada ka grudima. |
| `nk.ext` | Ekstenzija vrata: glava se zabacuje unazad. |
| `nk.lflex` | Bočni pregib vrata: uvo ka ramenu. |
| `wr.flex` | Fleksija ručnog zgloba: dlan ka podlaktici. |
| `wr.ext` | Ekstenzija ručnog zgloba: nadlanica ka podlaktici. |
<!-- /fds:generated -->

### Ciklusi (`m`, za `erg`) {#cycles-m-for-erg}

<!-- fds:generated fxe#cycles -->
| Kod | Značenje |
|---|---|
| `gait` | Hodanje ili trčanje po traci. |
| `cycle` | Okretanje pedala (ili ručnih pedala). |
| `step` | Stepovanje (steper ili stepmill). |
| `row` | Veslanje. |
| `pole` | Dvostruko povlačenje štapova (ski erg). |
| `glide` | Eliptično klizanje. |
| `climb` | Penjanje rukama i nogama. |
<!-- /fds:generated -->

### Putanje (`c`, standardne za `erg`) {#tracks-c-standard-for-erg}

<!-- fds:generated fxe#tracks -->
| Kod | Značenje |
|---|---|
| `belt` | Pokretna traka ili pokretne stepenice. |
| `link` | Povezane pedale (steper). |
| `loop` | Zatvorena petlja: pedale, eliptični trenažer. |
| `rail` | Sedište na šini (sprava za veslanje). |
| `cable` | Sajla koja se vuče odozgo (ski erg). |
| `line` | Prava putanja (vertikalni penjač). |
<!-- /fds:generated -->

### Prošireni slojevi {#extended-layers}

Pogon (`r`):

<!-- fds:generated fxe#drives -->
| Kod | Značenje |
|---|---|
| `grav` | Slobodni teg pod dejstvom gravitacije. |
| `stack` | Stek sa selektorom. |
| `plate` | Sa diskovima. |
| `elastic` | Elastični. |
| `air` | Vazdušni ventilator. |
| `mag` | Magnetna kočnica. |
| `water` | Rezervoar sa vodom. |
| `motor` | Motor. |
| `friction` | Trenje. |
| `hydraulic` | Hidraulični. |
| `flywheel` | Zamajac (izoinercijalni). |
| `none` | Bez sopstvenog otpora. |
<!-- /fds:generated -->

Ograničenje (`c`, za `mac` i `stn`):

<!-- fds:generated fxe#constraints -->
| Kod | Značenje |
|---|---|
| `line` | Prava putanja (sanke, šine). |
| `arc` | Poluga na jednoj osovini. |
| `link` | Polužni mehanizam sa više osovina. |
| `cable` | Sajla preko koturova. |
| `pivot` | Jedan kraj u podnom zglobu. |
<!-- /fds:generated -->

Popustljivost (`c`, za `imp` i `sup`):

<!-- fds:generated fxe#compliance -->
| Kod | Značenje |
|---|---|
| `tilt` | Naginje se pod telom. |
| `roll` | Kotrlja se. |
| `slide` | Klizi. |
| `swing` | Visi i njiše se. |
<!-- /fds:generated -->

Ugao vođenja (`g`, za `mac`):

<!-- fds:generated fxe#guideAngles -->
| Kod | Značenje |
|---|---|
| `incl` | Kosi (nožni potisak pod 45°). |
| `horiz` | Horizontalni. |
| `vert` | Vertikalni. |
<!-- /fds:generated -->

Konstrukcijski atributi (`a`, za `mac` i `stn`):

<!-- fds:generated fxe#designAttributes -->
| Kod | Značenje |
|---|---|
| `iso` | Nezavisni krakovi (izolateralno). |
| `conv` | Konvergentna putanja. |
| `cb` | Sa protivtegom (Smit). |
| `dual` | Dva steka. |
<!-- /fds:generated -->
