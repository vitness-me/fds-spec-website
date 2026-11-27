---
title: Ključ opreme
sidebar_label: Ključ opreme
description: Kako se strukturni ključ opreme (fxe) sastavlja, sloj po sloj.
---

# Ključ opreme

Ključ opreme je strukturni ključ komada opreme. Nalazi se u polju `fxe` i beleži koja je vrsta opreme i njen oblik: za slobodan predmet ili površinu, o kom je predmetu reč; za spravu, gde dodiruje telo, u koji položaj stavlja telo i koji pokret vodi. Ova stranica pokazuje kako se ključ sastavlja, šta znače svaki sloj i svaki kod i kako se dva ključa upoređuju.

Zaglavlje `FXE=1.0` je verzija ključa, a liste kodova dolaze sa izdanjem FDS-a koje ih objavljuje. Kasnije izdanje može dodati kodove ili razdeliti kod na specifičnije potomke, ali nikada ne menja značenje koda, pa ključ napisan danas ostaje validan.

Liste kodova objavljene su kao registri: vrste, oblici i kodovi slojeva ovog ključa u [`equipment-key.registry.json`](https://spec.vitness.me/registries/equipment-key.registry.json), a [tačke tela](https://spec.vitness.me/registries/body-points.registry.json) i [položaji tela](https://spec.vitness.me/registries/body-positions.registry.json) koje deli sa ključem vežbe.

## Anatomija ključa {#anatomy-of-the-key}

Potisak nogama sa diskovima, sa sankama na stazi od 45°, ima ovaj ključ:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXE</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">N</span></code>
      <span className="key-anatomy__label">zaglavlje</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">k</span><span className="ka-sym">:</span><span className="ka-code">mac</span></code>
      <span className="key-anatomy__label">vrsta</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-code">feet</span></code>
      <span className="key-anatomy__label">interfejs opterećenja</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">s</span><span className="ka-sym">:</span><span className="ka-code">supine</span><span className="ka-sym">.</span><span className="ka-code">incline</span></code>
      <span className="key-anatomy__label">položaj</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-code">push</span><span className="ka-sym">.</span><span className="ka-code">fwd</span></code>
      <span className="key-anatomy__label">pokret</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">r</span><span className="ka-sym">:</span><span className="ka-code">plate</span></code>
      <span className="key-anatomy__label">pogon</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">c</span><span className="ka-sym">:</span><span className="ka-code">line</span></code>
      <span className="key-anatomy__label">vođenje</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">g</span><span className="ka-sym">:</span><span className="ka-code">incl</span></code>
      <span className="key-anatomy__label">ugao vođice</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-letter">Slovo sloja</span> · <span className="ka-code">kod</span> · <span className="ka-sym">simbol</span> · <span className="ka-flag">zastavica</span>
  </figcaption>
</figure>

`FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl`

| Deo | Tekst | Šta kaže |
|---|---|---|
| Tip ključa | `FXE` | Ovo je ključ opreme. |
| Verzija | `1.0` | Glavna verzija 1, revizija 0. |
| Zastavica | `N` | Ključ nosi bar jedan prošireni sloj. |
| Vrsta | `k:mac` | Sprava za snagu, napravljena za jedan pokret. |
| Interfejs opterećenja | `l:feet` | Pokretni deo dodiruje telo na stopalima, na ploči za stopala. |
| Položaj | `s:supine.incline` | Korisnik leži licem nagore na kosom jastuku za leđa, glava više od kukova. |
| Pokret | `m:push.fwd` | Ploča za stopala potiskuje se od prednje strane trupa. |
| Pogon | `r:plate` | Sa diskovima: otpor daju diskovi. |
| Vođenje | `c:line` | Sanke idu po pravoj stazi. |
| Ugao vođice | `g:incl` | Staza je nagnuta pod 45°. |

Prva četiri sloja su standardni deo ključa, `FXE=1.0S/k:mac/l:feet/s:supine.incline/m:push.fwd`. On kaže ono što kaže svaki potisak nogama pod 45°; potisak nogama u sedu, sa uspravnim sedištem, je `s:seated`. Poslednja tri su prošireni slojevi: detalji konstrukcije ove sprave od kojih vežba na njoj ne zavisi. Polje `fxe` sadrži ceo ključ (pogledajte [Ključevi u zapisima](#keys-in-records)).

Slojevi su razdvojeni znakom `/`. Svaki sloj je njegovo slovo, `:` i vrednost sastavljena od kodova i simbola.

## Dimenzije i slojevi {#dimensions-and-layers}

Vrsta određuje koje slojeve ključ ima. Svaki sloj beleži jednu dimenziju opreme.

| Slovo | Sloj | Dimenzija koju beleži | Vrste | Standardni ili prošireni |
|---|---|---|---|---|
| `k` | Vrsta | O kakvoj je opremi reč | Sve | Standardni, uvek prvi |
| `f` | Oblik | Koji je predmet, površina, pribor ili stanica | `imp` `sup` `acc` `stn` | Standardni |
| `c` | Staza | Putanja kojom idu pokretni delovi kardio sprave | `erg` | Standardni |
| `l` | Interfejs opterećenja | Gde pokretni deo dodiruje telo | `mac` `erg` | Standardni |
| `s` | Položaj | Položaj u koji sprava stavlja telo | `mac` `erg` | Standardni |
| `m` | Pokret | Pokret koji sprava vodi, ili ciklus koji kardio sprava ponavlja | `mac` `erg` | Standardni |
| `r` | Pogon | Šta stvara otpor | `imp` `stn` `mac` `erg` | Prošireni |
| `c` | Vođenje ili popustljivost | Kako je pokretni deo sprave vođen, ili kako predmet ili površina popušta pod telom | `imp` `sup` `stn` `mac` | Prošireni |
| `g` | Ugao vođice | Ugao staze sprave | `mac` | Prošireni |
| `a` | Konstrukcija | Konstrukcijske osobine sprave ili stanice | `stn` `mac` | Prošireni |

Slovo `c` ima dva značenja. Na kardio spravi to je staza, standardni sloj. Na svakoj drugoj vrsti to je prošireni sloj vođenja ili popustljivosti. Kardio sprava nema prošireni `c`.

Pravila za svaki ključ:

- Prvi sloj je uvek `k`. `k:none` i `k:?` ne uzimaju nijedan drugi sloj.
- Standardni slojevi vrste pišu se redosledom iz tabele: `f` za `imp`, `sup`, `acc` i `stn`; `l s m` za `mac`; `c l s m` za `erg`. Kada neki nije poznat, kao vrednost napišite `?`: `s:?`.
- Izostavljen sloj čita se kao `?`, nepoznato. Ključ vežbe izostavljen sloj umesto toga čita kao njegovu podrazumevanu vrednost. Pravila ispod kažu šta pisati kada opis ćuti.
- Prošireni slojevi slede posle standardnih, redosledom `r c g a`, i samo kada su navedeni. Ključ koji nosi neki od njih ima zastavicu `N` (`FXE=1.0N/…`); svaki drugi ključ ima zastavicu `S`.
- Vrednost koju oblik već podrazumeva izostavlja se: bučicu pokreće gravitacija, pa se `r:grav` za nju nikada ne piše. Tabele oblika navode šta svaki oblik podrazumeva.
- Stavke spojene znakom `+` pišu se sortirane, pa jedan komad opreme uvek ima jedan zapisani oblik.

Šta pripada ključu:

- **Fiksna geometrija je oprema. Sve što se podešava pri svakoj upotrebi pripada vežbi.** Visina koturače, ugao klupe, mesto gde je traka usidrena, hvat, jedan ud ili dva i visina sedišta nalaze se u [ključu vežbe](./exercise-key.md#dimensions-and-layers), kao i zakačena ručka, preko hvata koji daje.
- **Pišite opremu, a ne vežbu koja se na njoj izvodi.** Podizanje na prste izvedeno na spravi za potisak nogama koristi spravu za potisak nogama, i ključ je ključ te sprave.
- **Imenovana sprava ima prednost.** Kada vežba imenuje spravu na kojoj se izvodi, ta sprava je oprema, šta god vežba na njoj radila.
- **Sama reč „sprava“ znači spravu napravljenu za taj pokret.** Opis koji kaže samo „sprava“ označava spravu napravljenu za glavni pokret vežbe: pregib nogu na spravi izvodi se na spravi za pregib nogu. Bez vežbe na koju bi se oslonila, „sprava“ je `FXE=1.0S/k:mac/l:?/s:?/m:?`.

Slojevi ispod navedeni su redosledom ključa. Za svaki: njegovi kodovi, pa njegova pravila.

### Vrsta (`k`) {#kind-k}

| Kod | Značenje | Standardni slojevi | Prošireni slojevi |
|---|---|---|---|
| `none` | Bez opreme: telo je celo opterećenje | — | — |
| `imp` | Rekvizit: slobodan predmet koji se pomera, drži ili nosi | `f` | `r` `c` |
| `sup` | Oslonac: površina ili okvir na kom telo leži, o kom visi ili o koji se odupire. Ne nosi opterećenje | `f` | `c` |
| `acc` | Pribor: ručka, traka, pojas, prostirka, peškir ili marker. Nikada ne definiše vežbu | `f` | — |
| `stn` | Stanica: vođica ili sidrište za mnoge pokrete: sajla, Smit sprava, landmine | `f` | `r` `c` `a` |
| `mac` | Sprava za snagu: vođeni mehanizam sa fiksnim dodirima sa telom, napravljen za jedan pokret | `l` `s` `m` | `r` `c` `g` `a` |
| `erg` | Kardio sprava: ponavlja cele cikluse | `c` `l` `s` `m` | `r` |

Pravila:

- Način opterećivanja nije oprema. „Sa tegom“ bez navedenog oblika je `FXE=1.0S/k:imp/f:?`. „Sa asistencijom“ bez rekvizita, ili „ostalo“, je `FXE=1.0S/k:?`.
- Sajla je stanica. Veslanje na sajli u sedu sa sopstvenim sedištem i lat sprava za povlačenje su sprave za snagu.

### Oblik (`f`) {#form-f}

Oblik je kod sa liste za vrstu ključa. Ključ vežbe imenuje rekvizit, oslonac ili stanicu istim kodom, a pribor istim kodom u svom sloju pribora (pogledajte [Ključevi opreme u ključevima vežbi](#equipment-keys-in-exercise-keys)).

**Rekviziti (`imp`)**

| Kod | Značenje | Podrazumeva |
|---|---|---|
| `bar.straight` | Šipka, olimpijska ili standardna | `r:grav` |
| `bar.ez` | EZ šipka | `r:grav` |
| `bar.trap` | Trap ili heks šipka | `r:grav` |
| `bar.axle` | Debela šipka (axle) | `r:grav` |
| `bar.camber` | Zakrivljena šipka | `r:grav` |
| `bell.dumb` | Bučica | `r:grav` |
| `bell.kettle` | Girja | `r:grav` |
| `bell.circus` | Cirkuska bučica | `r:grav` |
| `ball.med` | Medicinka | `r:grav` |
| `ball.slam` | Slam lopta | `r:grav` |
| `bag.sand` | Vreća s peskom | `r:grav` |
| `bag.heavy` | Viseći džak | `r:grav` `c:swing` |
| `plate` | Disk koji se drži ili nosi samostalno | `r:grav` |
| `chain` | Lanac za dizanje | `r:grav` |
| `rope.battle` | Borbeno uže | `r:grav` |
| `rope.jump` | Vijača | `r:none` |
| `band` | Elastična traka ili cev, tip nije naveden | `r:elastic` |
| `band.loop` | Duga zatvorena traka. Potomak koda `band` | `r:elastic` |
| `band.mini` | Kratka zatvorena traka oko nogu. Potomak koda `band` | `r:elastic` |
| `band.tube` | Elastična cev sa ručkama. Potomak koda `band` | `r:elastic` |
| `sled` | Sanke ili prowler, koje se guraju ili vuku | `r:friction` |
| `tire` | Velika guma | `r:grav` |
| `hammer` | Malj | `r:grav` |
| `stone` | Atlas kamen | `r:grav` |
| `log` | Strongman balvan | `r:grav` |
| `keg` | Bure | `r:grav` |
| `yoke` | Strongman jaram | `r:grav` |
| `frame.carry` | Farmer ručke ili okvir za nošenje | `r:grav` |
| `car` | Automobil, koji se podiže ili gura | `r:grav` |
| `wear.vest` | Prsluk sa tegom | `r:grav` |
| `wear.ankle` | Teg za skočni zglob | `r:grav` |
| `club` | Batina ili buzdovan | `r:grav` |
| `stick` | Štap, drška metle ili PVC cev | `r:none` |
| `wheel` | Točak za trbušnjake | `r:none` `c:roll` |
| `roller.wrist` | Valjak za ručne zglobove | `r:grav` |
| `harness.head` | Oprema za glavu sa okačenim opterećenjem | `r:grav` |

**Oslonci (`sup`)**

| Kod | Značenje | Podrazumeva |
|---|---|---|
| `floor` | Pod, ili prostirka na njemu | — |
| `wall` | Zid | — |
| `bench` | Klupa, ravna ili podesiva | — |
| `box` | Kutija, stepenik ili platforma | — |
| `chair` | Stolica | — |
| `block` | Blokovi sa kojih šipka kreće | — |
| `rack` | Kavez ili stalak za čučanj, sa svojim klinovima | — |
| `ball.stab` | Pilates lopta | `c:tilt` |
| `dome` | BOSU, strana nagore nije navedena | `c:tilt` |
| `dome.up` | BOSU, kupola nagore. Potomak koda `dome` | `c:tilt` |
| `dome.down` | BOSU, ravna strana nagore: kupola na podu. Potomak koda `dome` | `c:tilt` |
| `board.bal` | Ravnotežna daska | `c:tilt` |
| `roller.foam` | Fom roler | `c:roll` |
| `slider` | Klizni disk | `c:slide` |
| `strap.susp` | Suspenzioni trener | `c:swing` |
| `ring` | Gimnastičke karike | `c:swing` |
| `rope.climb` | Uže za penjanje | `c:swing` |
| `bar.fixed` | Fiksna šipka iznad glave: vratilo | — |
| `bar.parallel` | Paralelne šipke za propadanje (razboj) | — |
| `bar.parallette` | Paralete na podu | — |
| `pad.preacher` | Scott klupa | — |
| `pad.hyper` | Klupa za hiperekstenziju, 45° ili 90°, koristi se i za bočne pregibe | — |
| `pad.ghd` | GHD sprava (glute-ham developer) | — |
| `station.vkr` | Stanica za podizanje kolena | — |
| `pole` | Vertikalni stub, direk ili uspravni nosač kaveza za koji se hvata šakama | — |
| `ball.massage` | Masažna ili lakros loptica koja se valja ispod tela | — |

**Pribor (`acc`)**

| Kod | Značenje |
|---|---|
| `handle` | Jednoručna D-ručka |
| `handle.bar` | Prava ili zakrivljena šipka za sajlu |
| `handle.v` | V-ručka ili ručka za uzak hvat |
| `handle.rope` | Uže za triceps |
| `strap.ankle` | Manžetna za skočni zglob |
| `belt.dip` | Pojas za opterećenje |
| `belt.lift` | Pojas za dizanje |
| `strap.lift` | Trake za dizanje |
| `strap.stretch` | Traka za istezanje: traka, pojas, peškir, uže ili zatvorena traka kojom se ud povlači ili drži u istezanju |
| `towel` | Peškir koji služi kao ručka |
| `marker` | Čunj, prepona ili oznaka na podu |
| `board.press` | Daska postavljena na grudi za delimične potiske |
| `mat` | Prostirka |

**Stanice (`stn`)**

| Kod | Značenje | Podrazumeva |
|---|---|---|
| `cable` | Sajla, krosover ili funkcionalni trener: koturača koja se podešava za svaku vežbu | `r:stack` `c:cable` |
| `smith` | Smit sprava: šipka na fiksnim šinama | `r:plate` `c:line` |
| `landmine` | Landmine: jedan kraj šipke u zglobu na podu | `r:grav` `c:pivot` |

Pravila:

- Opšta reč uzima opšti kod: „traka“ je `band`. Potomka pišite samo kada ga oprema imenuje: duga zatvorena traka je `band.loop`.
- Traka za istezanje je `FXE=1.0S/k:acc/f:strap.stretch`. Ključ vežbe za istezanje izvedeno sa njom nosi [`a:strap.stretch`](./exercise-key.md#accessory-a).
- BOSU čija strana nije navedena je `dome`. Napišite `dome.up` ili `dome.down` kada je strana imenovana.

### Staza (`c`) {#track-c}

Staza se piše samo za kardio spravu.

| Kod | Značenje |
|---|---|
| `belt` | Pokretna traka ili rotirajuće stepenice |
| `link` | Povezane pedale (stepper) |
| `loop` | Zatvorena putanja: pedale, eliptični trenažer |
| `rail` | Sedište na šini (veslački ergometar) |
| `cable` | Sajla koja se vuče odozgo (ski ergometar) |
| `line` | Prava staza (vertikalni penjač) |

Svaki tip kardio sprave piše svoja četiri standardna sloja ovako:

| Sprava | `c` | `l` | `s` | `m` |
|---|---|---|---|---|
| Traka za trčanje | `belt` | `feet` | `standing` | `gait` |
| Stepmil (rotirajuće stepenice) | `belt` | `feet` | `standing` | `step` |
| Stepper (pedale) | `link` | `feet` | `standing` | `step` |
| Sprava sa stepenicama, nije poznato da li je stepper ili stepmil | `?` | `feet` | `standing` | `step` |
| Uspravni ili spin bicikl | `loop` | `feet` | `seated` | `cycle` |
| Ležeći bicikl | `loop` | `feet` | `supine.incline` | `cycle` |
| Sobni bicikl, nije poznato da li je uspravni ili ležeći | `loop` | `feet` | `?` | `cycle` |
| Air bicikl, sa pokretnim ručkama | `loop` | `feet+hands` | `seated` | `cycle` |
| Eliptični trenažer | `loop` | `feet+hands` | `standing` | `glide` |
| Sprava za veslanje | `rail` | `hands` | `seated` | `row` |
| Ski ergometar | `cable` | `hands` | `standing` | `ski` |
| Ručni ergometar, u sedu | `loop` | `hands` | `seated` | `cycle` |
| Vertikalni penjač | `line` | `feet+hands` | `standing` | `climb` |
| Penjač sa lestvama | `belt` | `feet+hands` | `standing` | `climb` |

Pravila:

- Kardio sprava nepoznatog tipa je `FXE=1.0S/k:erg/c:?/l:?/s:?/m:?`.

### Interfejs opterećenja (`l`) {#load-interface-l}

Interfejs opterećenja piše se za spravu za snagu i kardio spravu. To je tačka tela u kojoj pokretni deo sprave dodiruje telo, zapisana [tačkama tela](./exercise-key.md#body-points) ključa vežbe: `hands` za ručke ili šipku, `feet` za ploču za stopala ili pedale, `ankles` za jastuk na potkolenici. Ključ vežbe na spravi drži `mac` ili `erg` u jednoj od ovih tačaka (`@overhead` je u šakama). Tačka držanja `@assist` se ne proverava.

Pravila:

- Dva interfejsa spojite znakom `+` samo kada oba pomeraju opterećenje: eliptični trenažer je `l:feet+hands`.
- Kada ništa ne kaže drugačije, pokret sprave određuje njen interfejs:

  | Pokret | Interfejs |
  |---|---|
  | `kn.flex`, `kn.ext`, `hip.flex` | `ankles` |
  | `el.*`, `sc.elev`, `sh.habd`, i svaki `push.*` ili `pull.*` koji se izvodi šakama | `hands` |
  | `sh.hadd`, `sh.abd`, `sh.flex`, `sh.ext` | `arms` |
  | `hip.add`, `hip.abd` | `thighs` |
  | `sp.flex`, `sp.rot` | `chest` |
  | `sp.ext` | `back` |
  | `assist.up` | `knees`, ili `feet` kada korisnik stoji na platformi |

- Neke sprave određuju sopstveni: potisak nogama je `feet`; hack čučanj, pendulum čučanj ili V-čučanj `shoulders`; čučanj sa pojasom `hips`; sprava za podizanje na prste `thighs` u sedu, `shoulders` u stojećem stavu i `hips` za magareće podizanje na prste, sa trupom na jastuku; glute kickback `feet`; sprava za hip thrust `hips`; reverse hyper `ankles`; sprava za podizanje prednjeg dela stopala `feet`.

### Položaj (`s`) {#posture-s}

Položaj se piše za spravu za snagu i kardio spravu. To je položaj u koji sprava stavlja telo, zapisan [kodovima orijentacije](./exercise-key.md#orientation-o) ključa vežbe: `seated`, `seated.chest`, `standing`, `supine.incline`, `prone`, `hanging` i ostali. Ključ vežbe na spravi počinje u istoj toj orijentaciji.

Pravila:

- Pišite položaj u koji sprava stavlja korisnika.
- Neke sprave ga fiksiraju. Svaki potisak nogama sa kosim jastukom za leđa je `supine.incline`, a onaj sa uspravnim sedištem je `seated`. Hack čučanj, pendulum čučanj, V-čučanj i čučanj sa pojasom su `standing`. Namenska sprava za veslanje je `seated.chest`, osim veslanja na sajli u sedu sa pločom za stopala, koje je `seated`. Sprava za obrnuto razvlačenje je `seated.chest`. T-veslanje sa osloncem za grudi je `prone.incline`. Sprava za zgibove ili propadanja sa asistencijom je `hanging`. Sprava za hip thrust je `supine`, a reverse hyper `prone`. Sprava za magareće podizanje na prste je `standing.chest`. Sprava za glute kickback je `standing`, ili `kneeling` kada opis kaže da korisnik kleči. Sprava za podizanje prednjeg dela stopala je `seated`.
- Kada ništa ne kaže drugačije: `seated.chest` za `sh.habd`; `seated` za `kn.ext`, `el.*`, ostale pokrete `sh.*`, `sp.flex`, `sp.rot`, `hip.add`, `hip.abd`, `hip.flex`, svaki `push.*` koji se izvodi šakama, `pull.down` i `pull.backdown`; `standing` za `sc.elev`, `hip.ext` i `pull.up`. U suprotnom napišite `s:?`: sprava za pregib nogu ili podizanje na prste bez navedenog položaja je `s:?`.

### Pokret (`m`) {#motion-m}

Na spravi za snagu, pokret je ono što pokretni deo sprave vodi, u odnosu na trup.

Sprava čija je osovina poravnata sa jednim zglobom piše taj pokret u zglobu, kodovima [sloja pokreta](./exercise-key.md#motion-m) ključa vežbe: `kn.flex`, `kn.ext`, `el.flex`, `el.ext`, `sh.flex`, `sh.ext`, `sh.abd`, `sh.add`, `sh.hadd`, `sh.habd`, `sh.ir`, `sh.er`, `sc.elev`, `hip.flex`, `hip.ext`, `hip.abd`, `hip.add`, `sp.flex`, `sp.ext`, `sp.rot`, `sp.lflex`, `ank.pf`, `ank.df`, `nk.flex`, `nk.ext`, `nk.lflex`, `wr.flex` ili `wr.ext`.

Sprava koja pokreće više zglobova piše glagol, `.` i smer u kom se kreće interfejs opterećenja.

| Glagol | Značenje |
|---|---|
| `push` | Pokretni deo se potiskuje od korisnika |
| `pull` | Pokretni deo se vuče ka korisniku |
| `assist` | Pokretni deo pomaže pri podizanju tela |

| Smer | Značenje |
|---|---|
| `up` | Ka glavi: potisak iznad glave, hack čučanj, čučanj sa pojasom, sprava za mrtvo dizanje |
| `down` | Ka stopalima: povlačenje, propadanje u sedu |
| `fwd` | Od prednje strane trupa: potisak za grudi, potisak nogama |
| `back` | Ka prednjoj strani trupa: veslanje |
| `fwdup` | Napred i gore: kosi potisak |
| `fwddown` | Napred i dole: potisak na negativnoj klupi |
| `backdown` | Nazad i dole: visoko veslanje |

Na kardio spravi, pokret je ciklus koji ona ponavlja. Ključ vežbe može kardio spravu imenovati po njemu: `erg.row` je kardio sprava čiji je `m` jednak `row` (pogledajte [Ključevi opreme u ključevima vežbi](#equipment-keys-in-exercise-keys)). Pokret sprave za snagu ne daje kod u ključu vežbe: sopstveni pokret vežbe već kaže šta sprava vodi.

| Kod | Značenje |
|---|---|
| `gait` | Hodanje ili trčanje na traci |
| `cycle` | Okretanje pedala ili ručnih poluga |
| `step` | Penjanje uz stepenike |
| `row` | Veslanje |
| `ski` | Povlačenje sa oba štapa (ski ergometar) |
| `glide` | Eliptično klizanje |
| `climb` | Penjanje šakama i stopalima |

Pravila:

- Sprave za jedan zglob: pregib nogu je `kn.flex`, ekstenzija nogu `kn.ext`, sprava za pregib za biceps ili Scott pregib `el.flex`, sprava za ekstenziju za triceps `el.ext`, pec deck `sh.hadd`, sprava za obrnuto razvlačenje `sh.habd`, sprava za bočno podizanje `sh.abd`, sprava za pulover `sh.ext`, sprava za sleganje ramenima `sc.elev`, aduktor `hip.add`, abduktor `hip.abd`, sprava za krančeve sa podizanjem nogu ili kolena `hip.flex`, glute kickback, hip thrust ili reverse hyper `hip.ext`, sprava za trbušnjake `sp.flex`, sprava za hiperekstenziju `sp.ext`, rotacioni trenažer za trup `sp.rot`, sprava za podizanje na prste `ank.pf`, sprava za podizanje prednjeg dela stopala `ank.df`, sprava za vrat `nk.flex`, `nk.ext` ili `nk.lflex` prema smeru u kom se glava kreće, i sprava za pregib ručnog zgloba `wr.flex`.
- Sprave za više zglobova: potisak iznad glave, hack čučanj ili čučanj sa pojasom je `push.up`; sprava za mrtvo dizanje `pull.up`; povlačenje `pull.down`; propadanje u sedu `push.down`; potisak za grudi i potisak nogama `push.fwd`; veslanje `pull.back`; kosi potisak `push.fwdup`; potisak na negativnoj klupi `push.fwddown`; visoko veslanje `pull.backdown`; zgib ili propadanje sa asistencijom `assist.up`.
- Potisak nogama i hack čučanj pokreću iste zglobove. Razlikuju ih interfejs, položaj i smer.
- Sprava za snagu nepoznatog tipa je `FXE=1.0S/k:mac/l:?/s:?/m:?`.

### Prošireni slojevi (`r`, `c`, `g`, `a`) {#extended-layers-r-c-g-a}

Prošireni slojevi beleže kako je komad opreme građen. Deo su njegovog ključa: `fxe` sadrži ceo ključ, uključujući proširene slojeve i zastavicu `N` (pogledajte [Ključevi u zapisima](#keys-in-records)).

Pogon (`r`):

| Kod | Značenje |
|---|---|
| `grav` | Slobodan teg pod dejstvom gravitacije |
| `stack` | Stek sa izborom tegova |
| `plate` | Opterećuje se diskovima |
| `elastic` | Elastični |
| `air` | Vazdušni ventilator |
| `mag` | Magnetna kočnica |
| `water` | Rezervoar sa vodom |
| `motor` | Motor |
| `friction` | Trenje |
| `hydraulic` | Hidraulični |
| `flywheel` | Zamajac |
| `none` | Bez sopstvenog otpora |

Vođenje (`c`, za `stn` i `mac`):

| Kod | Značenje |
|---|---|
| `line` | Prava staza: sanke ili šine |
| `arc` | Poluga na jednoj osovini |
| `link` | Mehanizam sa više osovina |
| `cable` | Sajla preko koturača |
| `pivot` | Jedan kraj u zglobu na podu |

Popustljivost (`c`, za `imp` i `sup`):

| Kod | Značenje |
|---|---|
| `tilt` | Naginje se pod telom |
| `roll` | Kotrlja se |
| `slide` | Klizi |
| `swing` | Visi i njiše se |

Ugao vođice (`g`, za `mac`):

| Kod | Značenje |
|---|---|
| `incl` | Nagnut |
| `horiz` | Horizontalan |
| `vert` | Vertikalan |

Konstrukcija (`a`, za `stn` i `mac`):

| Kod | Značenje |
|---|---|
| `iso` | Nezavisne poluge |
| `conv` | Konvergentna putanja |
| `cb` | Sa protivtegom |
| `dual` | Dva steka tegova |

Pravila:

- Prošireni sloj pišite samo kada ga opis navodi. Ništa što vežba beleži ne zavisi od njega.
- Potisak nogama sa [početka ove stranice](#anatomy-of-the-key) navodi sva tri svoja proširena sloja: sa diskovima je `r:plate`, sanke su `c:line`, a staza od 45° je `g:incl`.
- Sprava sa polugom je `c:arc` sa `r:plate`. Sprava sa sankama je `c:line` sa `r:plate`. Pendulum čučanj je `c:arc`.
- Kodovi konstrukcije spajaju se znakom `+`: `a:conv+iso`.

## Simboli {#symbols}

Sve u ključu što nije kod jeste simbol.

| Simbol | Značenje | Primer |
|---|---|---|
| `/` | Razdvaja slojeve | `k:imp/f:bell.dumb` |
| `:` | Razdvaja slovo sloja od njegove vrednosti | `k:imp` |
| `.` | Spaja kod sa specifičnijim potomkom, ili glagol sprave sa njegovim smerom | `band.loop`, `push.fwd` |
| `+` | Spaja stavke koje idu zajedno: dva interfejsa opterećenja, kodove konstrukcije | `l:feet+hands` |
| `;` | Spaja konfiguracije kombinovane sprave | `…/m:sh.hadd;k:mac/…` |
| `?` | Nepoznato. Poklapa se sa bilo čim i nikada ne protivreči | `k:?`, `f:?`, `s:?` |

Kombinovana sprava, jedan okvir sa više konfiguracija, spaja ključ svake konfiguracije znakom `;` posle jednog zaglavlja, sortirano. Sprava za kuk u više smerova, sprava za vrat u četiri smera, pec deck sa polugama za zadnje deltoide, sprava za zgibove i propadanja sa asistencijom i lat sprava za povlačenje sa niskim veslanjem su kombinovane sprave. Kombinacija može spajati konfiguracije sprave i stanice. Vežba izvedena na njoj upućuje na konfiguraciju koju koristi.

## Ključevi opreme u ključevima vežbi {#equipment-keys-in-exercise-keys}

Ključ opreme i [ključ vežbe](./exercise-key.md#equipment-in-an-exercise-key) dele tri liste kodova, pa ključ vežbe vodi pravo do ključa svoje opreme, a ključ sprave kaže kako se telo na njoj nalazi rečima koje koristi ključ vežbe.

| Lista | U ključu opreme | U ključu vežbe | Navedena pod |
|---|---|---|---|
| Kodovi opreme | Vrsta (`k`) i oblik (`f`) | Oprema u opterećenju (`l`) i osloncu (`s`), i pribor (`a`) | [Tabele oblika](#form-f) |
| Tačke tela | Interfejs opterećenja sprave (`l`) | Posle `@` u opterećenju i osloncu | [Tačke tela](./exercise-key.md#body-points) ključa vežbe |
| Položaji tela | Položaj sprave (`s`) | Orijentacija (`o`) | [Orijentacija](./exercise-key.md#orientation-o) ključa vežbe |

Sprava za veslanje ispod pokazuje sve tri: njen ključ piše `l:hands` i `s:seated`, a veslanje na njoj drži se `@hands` i počinje u `seated`.

<figure className="key-anatomy">
  <div className="key-pair">
    <div>
      <div className="key-pair__title">Pregib sa bučicama u stojećem stavu</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXI</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">zaglavlje</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-code">el</span><span className="ka-sym">.</span><span className="ka-code">flex</span></code>
          <span className="key-anatomy__label">pokret</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">o</span><span className="ka-sym">:</span><span className="ka-code">standing</span></code>
          <span className="key-anatomy__label">orijentacija</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">bell</span><span className="ka-sym">.</span><span className="ka-code">dumb</span></span><span className="ka-sym">@</span><span className="ka-code">hands</span></code>
          <span className="key-anatomy__label">opterećenje</span>
        </span>
      </div>
    </div>
    <div>
      <div className="key-pair__title">Bučica</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXE</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">zaglavlje</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">k</span><span className="ka-sym">:</span><span className="ka-code">imp</span></code>
          <span className="key-anatomy__label">vrsta</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">f</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">bell</span><span className="ka-sym">.</span><span className="ka-code">dumb</span></span></code>
          <span className="key-anatomy__label">oblik</span>
        </span>
      </div>
    </div>
  </div>
  <div className="key-pair">
    <div>
      <div className="key-pair__title">Veslanje</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXI</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">zaglavlje</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">m</span><span className="ka-sym">:~</span><span className="ka-code">el</span><span className="ka-sym">.</span><span className="ka-code">flex</span><span className="ka-sym">+</span><span className="ka-code">hip</span><span className="ka-sym">.</span><span className="ka-code">ext</span><span className="ka-sym">+</span><span className="ka-code">kn</span><span className="ka-sym">.</span><span className="ka-code">ext</span><span className="ka-sym">+</span><span className="ka-code">sh</span><span className="ka-sym">.</span><span className="ka-code">ext</span></code>
          <span className="key-anatomy__label">pokret</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">o</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">seated</span></span></code>
          <span className="key-anatomy__label">orijentacija</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">erg</span></span><span className="ka-sym">.</span><span className="ka-shared"><span className="ka-code">row</span></span><span className="ka-sym">@</span><span className="ka-shared"><span className="ka-code">hands</span></span></code>
          <span className="key-anatomy__label">opterećenje</span>
        </span>
      </div>
    </div>
    <div>
      <div className="key-pair__title">Sprava za veslanje</div>
      <div className="key-anatomy__key">
        <span className="key-anatomy__part">
          <code><span className="ka-code">FXE</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
          <span className="key-anatomy__label">zaglavlje</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">k</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">erg</span></span></code>
          <span className="key-anatomy__label">vrsta</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">c</span><span className="ka-sym">:</span><span className="ka-code">rail</span></code>
          <span className="key-anatomy__label">staza</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">hands</span></span></code>
          <span className="key-anatomy__label">interfejs opterećenja</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">s</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">seated</span></span></code>
          <span className="key-anatomy__label">položaj</span>
        </span>
        <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
        <span className="key-anatomy__part">
          <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-shared"><span className="ka-code">row</span></span></code>
          <span className="key-anatomy__label">pokret</span>
        </span>
      </div>
    </div>
  </div>
  <figcaption>
    Svaki ključ vežbe levo, ključ njegove opreme desno. <span className="ka-shared">Uokvireno</span>: kodovi koje dele.
  </figcaption>
</figure>

| Vrsta | Kod vežbe je | Ključ vežbe i ključ njene opreme |
|---|---|---|
| Bez opreme (`none`) | Vrsta: `none` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none`<br />`FXE=1.0S/k:none` |
| Rekvizit (`imp`) | Oblik `f`: `bar.straight` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back`<br />`FXE=1.0S/k:imp/f:bar.straight` |
| Oslonac (`sup`) | Oblik `f`: `bench` | `FXI=1.0S/m:el.ext+sh.ext/o:seated/s:bench@hands/l:none`<br />`FXE=1.0S/k:sup/f:bench` |
| Stanica (`stn`) | Oblik `f`: `cable` | `FXI=1.0S/m:el.ext/o:standing/l:cable@hands`<br />`FXE=1.0S/k:stn/f:cable` |
| Pribor (`acc`) | Oblik `f`, samo u sloju pribora `a`: `strap.stretch`. Pribor nikada nije glavna oprema | `a:strap.stretch` ↔ `FXE=1.0S/k:acc/f:strap.stretch` |
| Sprava za snagu (`mac`) | Vrsta `k`: `mac` | `FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands`<br />`FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down` |
| Kardio sprava (`erg`) | Vrsta `k`: `erg`; ili vrsta, `.` i pokret `m`: `erg.row` | `FXI=1.0S/m:~el.flex+hip.ext+kn.ext+sh.ext/o:seated/l:erg.row@hands`<br />`FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row` |

Kod oblika zamenjuje jedan ključ opreme: `bar.straight` je `FXE=1.0S/k:imp/f:bar.straight`. Kodovi oblika navedeni su u [tabelama oblika](#form-f). Kod vrste zamenjuje svaki ključ te vrste, sa ostalim slojevima otvorenim: `mac` je `FXE=1.0S/k:mac/l:?/s:?/m:?`. `erg.row` je `FXE=1.0S/k:erg/c:?/l:?/s:?/m:row`: bilo koja kardio sprava čiji je pokret `row`. Kardio pokreti navedeni su pod [Pokret](#motion-m).

Svaki kod oblika može se napisati u ključu vežbe, uključujući potomke: `band.loop` je duga zatvorena traka, a `band` je pokriva. `fxe` zapisa imenuje tačnu opremu i jeste ključ koda ili je specifičniji od njega. Sprava za veslanje iznad specifičnija je od `erg.row`.

Pribor nikada nije [glavna oprema](#checking-an-exercise-against-its-equipment) vežbe. Kod pribora u sloju `a` ključa vežbe je kod pribora ključa opreme: `a:strap.stretch` je `FXE=1.0S/k:acc/f:strap.stretch`. Istezanje sa trakom, `FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:none/x:u/a:strap.stretch`, ima `l:none`, pa je njegova glavna oprema `FXE=1.0S/k:none`.

Kod oslonca piše se samo u `s`, a kod pribora samo u `a`. Svaki drugi kod osim `none` može se napisati u `l` ili u `s`. Ključ vežbe dodaje gde se oprema drži ili dodiruje (`@`) i, u `l`, koliko je ima (`*n`): pogledajte [opterećenje](./exercise-key.md#load-l) ključa vežbe.

Na spravi se dva ključa slažu: položaj sprave je početna orijentacija vežbe, a njen interfejs opterećenja uključuje tačku u kojoj vežba drži `mac` ili `erg` (`@overhead` je u šakama). Tačka držanja `@assist` se ne proverava.

Ključevi se namerno razlikuju na tri načina:

- **Sprava za snagu nema specifičan kod.** Kardio sprava može biti `erg.row`, jer je ciklus sam pokret. Sprava za snagu je samo `mac`, jer sopstveni pokret vežbe nosi ono što sprava vodi.
- **Izostavljen sloj čita se drugačije.** U ključu vežbe on je na podrazumevanoj vrednosti, koja je vrednost, osim kod sloja pribora, koji, kada je izostavljen, nije naveden. U ključu opreme on je nepoznat, `?`.
- **Slova slojeva svakog ključa su samo njegova.** Samo je `m` pokret u oba. U ključu vežbe `l` je opterećenje, a `s` oslonac; u ključu opreme `l` je interfejs opterećenja, a `s` položaj.

Dva ključa nikada ne beleže istu činjenicu dvaput. Hvat, strane, obim, rad nogu, visina koturače, ugao klupe, tačka držanja i broj pripadaju ključu vežbe. Šta oprema jeste, njena fiksna geometrija i kako je građena pripadaju ključu opreme.

### Provera vežbe prema njenoj opremi {#checking-an-exercise-against-its-equipment}

Ključ vežbe i ključ njene glavne opreme mogu se proveriti jedan prema drugom. Glavna oprema je prvo od sledećeg što ključ vežbe ima:

1. sprava za snagu ili kardio sprava u `l`: `mac`, `erg` ili potomak koda `erg`;
2. stanica u `l`: `cable`, `smith` ili `landmine`;
3. rekvizit u `l`. Kada ih ima više, onaj koji je prvi naveden u [tabeli rekvizita](#form-f): `l:band@hands+bell.dumb@hands` daje `bell.dumb`;
4. rekvizit nepoznatog tipa, kao `?@chest`, koji daje `FXE=1.0S/k:imp/f:?`;
5. oslonac u `s` koji nije pod, onaj koji je prvi naveden u tabeli oslonaca;
6. `FXE=1.0S/k:none` za `l:none`;
7. kada ništa drugo ne važi, `FXE=1.0S/k:?`.

Provera upozorava kada:

- ključ opreme protivreči ključu koda glavne opreme vežbe: vežba opterećena sa `bell.dumb` i ključ opreme za girju;
- [položaj](#posture-s) sprave nije početna orijentacija vežbe: `s:supine.incline` i `o:standing`;
- [interfejs opterećenja](#load-interface-l) sprave ne uključuje tačku držanja koda `mac` ili `erg`: `l:feet` i `mac@hands`. Tačka držanja `@assist` se ne proverava;
- pokret sprave za jedan zglob, ili njegov potomak, nije u pokretu vežbe: sleganje ramenima izvedeno na spravi za podizanje na prste u stojećem stavu, čiji je pokret `m:ank.pf`. Provera uvek upozorava. Osoba prihvata takvu upotrebu kada vežba imenuje tu spravu;
- `k:none` se pojavljuje bez `l:none`;
- kardio kod ne odgovara pokretu sprave: `erg.row` sa ključem opreme čiji je pokret `m:gait`, traka za trčanje.

## Razrađeni primeri {#worked-examples}

Svaki primer polazi od običnog opisa i određuje jedan po jedan sloj.

### Bučica {#dumbbell}

Slobodan teg koji se drži u jednoj ruci.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `k` | Slobodan predmet koji telo pomera | `k:imp` |
| `f` | Bučica. Njen gravitacioni pogon se podrazumeva, pa se `r` ne piše | `f:bell.dumb` |

`FXE=1.0S/k:imp/f:bell.dumb`

[Pregib sa bučicama u stojećem stavu](./exercise-key.md#standing-dumbbell-curl) imenuje je kao `bell.dumb`: `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`.

### Duga zatvorena traka {#long-loop-band}

Duga elastična petlja, kakva se koristi za zgibove sa asistencijom i čučnjeve sa trakom.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `k` | Slobodan predmet | `k:imp` |
| `f` | Tip je imenovan, pa kod potomka. Traka čiji tip nije naveden je `band` | `f:band.loop` |

`FXE=1.0S/k:imp/f:band.loop`

### Sajla {#cable-column}

Stek tegova sa koturačom koja klizi gore-dole po stubu, koristi se sa ručkom izabranom za svaku vežbu.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `k` | Stanica koja se koristi za mnoge pokrete | `k:stn` |
| `f` | Sajla. Visina koturače i ručka podešavaju se pri svakoj upotrebi, pa ih beleži ključ vežbe | `f:cable` |

`FXE=1.0S/k:stn/f:cable`

### Lat sprava za povlačenje {#lat-pulldown-machine}

U sedu, butine ispod jastuka, šipka se povlači nadole iz položaja iznad glave.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `k` | Sprava napravljena za jedan pokret, a ne sajla | `k:mac` |
| `l` | Šipka je u šakama | `l:hands` |
| `s` | U sedu. Jastuk za butine drži telo dole; on nije položaj | `s:seated` |
| `m` | Pokreće se više zglobova, a šipka ide ka stopalima | `m:pull.down` |

`FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down`

[Povlačenje na lat spravi](./exercise-key.md#lat-pulldown) imenuje je kao `mac`: `FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands`.

### Sprava za pregib nogu u ležanju {#lying-leg-curl-machine}

Licem nadole na klupi, jastuk iza potkolenica, opterećuje se diskovima na poluzi.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `k` | Sprava za snagu | `k:mac` |
| `l` | Jastuk je na potkolenici | `l:ankles` |
| `s` | Ležanje licem nadole | `s:prone` |
| `m` | Osovina je poravnata sa kolenom, koje se savija | `m:kn.flex` |
| `r` `c` | Opterećuje se diskovima, na poluzi: prošireni slojevi | `r:plate/c:arc` |

`FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc`

To je ključ koji sadrži `fxe`. Njegov standardni deo je `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex`.

Sprava za pregib nogu u sedu je `FXE=1.0S/k:mac/l:ankles/s:seated/m:kn.flex`. Razlikuje se samo položaj, i to je dovoljno da bude različita oprema.

### Sprava za veslanje {#rowing-machine}

Sedište na šini, ručka na lancu koja se vuče ka trupu.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `k` | Kardio sprava | `k:erg` |
| `c` | Sedište klizi po šini | `c:rail` |
| `l` | Pokretni deo koji dodiruje telo je ručka, u šakama. Oslonac za stopala ostaje na mestu | `l:hands` |
| `s` | U sedu | `s:seated` |
| `m` | Veslanje | `m:row` |

`FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row`

### Pec deck sa polugama za zadnje deltoide {#pec-deck-with-rear-delt-arms}

Jedna sprava sa dve konfiguracije: jastuci za ruke se pritiskaju jedan ka drugom ispred tela, ili se ručke vuku unazad sa grudima uz jastuk.

| Konfiguracija | Odluka | Zapisano |
|---|---|---|
| Pec deck | Jastuci za ruke, u sedu, ruke se spajaju ispred tela | `k:mac/l:arms/s:seated/m:sh.hadd` |
| Obrnuto razvlačenje | Ručke, grudi na jastuku, ruke idu unazad i u stranu | `k:mac/l:hands/s:seated.chest/m:sh.habd` |

`FXE=1.0S/k:mac/l:arms/s:seated/m:sh.hadd;k:mac/l:hands/s:seated.chest/m:sh.habd`

## Ključevi u zapisima {#keys-in-records}

Zapis opreme nosi ceo svoj ključ u `fxe`, uključujući proširene slojeve i zastavicu `N`. Referenca na opremu, u [vežbi](./exercise-key.md#keys-in-records), treningu ili preskripciji, nosi istu vrednost `fxe` pored svojih `id` i `name`.

Prošireni sloj se računa u poređenju samo kada ga nose oba ključa (pogledajte [Poređenje dva ključa opreme](#comparing-two-equipment-keys)). U suprotnom poređenje čita standardni deo svakog ključa: ključ bez proširenih slojeva `r`, `c`, `g` i `a`, sa zastavicom `S`. Na kardio spravi `c` je staza, standardni sloj, pa ostaje.

| Ključ | Standardni deo |
|---|---|
| `FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl` | `FXE=1.0S/k:mac/l:feet/s:supine.incline/m:push.fwd` |
| `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc` | `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex` |
| `FXE=1.0N/k:erg/c:rail/l:hands/s:seated/m:row/r:air` | `FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row` |

Zapis opreme:

```json fds:ignore equipment record excerpt showing the fxe field
{
  "schemaVersion": "1.2.0",
  "id": "eq.legPress45",
  "fxe": "FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl",
  "canonical": { "name": "45° Leg Press", "slug": "45-leg-press" },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "status": "active"
  }
}
```

Vežba izvedena na njoj. Referenca na opremu nosi isti `fxe`, a sopstveni ključ vežbe imenuje spravu kodom [`mac`](#equipment-keys-in-exercise-keys), drži je stopalima:

```json fds:ignore exercise record excerpt showing the fxi and fxe fields
{
  "exerciseId": "ex.legPress",
  "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:supine.incline/l:mac@feet",
  "canonical": { "name": "Leg Press", "slug": "leg-press" },
  "equipment": {
    "required": [
      { "id": "eq.legPress45", "name": "45° Leg Press", "fxe": "FXE=1.0N/k:mac/l:feet/s:supine.incline/m:push.fwd/r:plate/c:line/g:incl" }
    ]
  }
}
```

## Poređenje dva ključa opreme {#comparing-two-equipment-keys}

Poređenje ide sloj po sloj. `?` se poklapa sa bilo kojom vrednošću, a roditeljski kod pokriva svoje potomke. Izostavljen standardni sloj čita se kao `?`. Prošireni sloj se uzima u obzir samo kada ga nose oba ključa; kada ga nosi samo jedan ključ, čini taj ključ specifičnijim.

- **Isti**: dva ključa su zapisana identično i ne sadrže `?`.
- **Specifičniji**: nijedan sloj ne protivreči, a jedan ključ navodi nešto što drugi ostavlja otvorenim, imenuje potomka tamo gde drugi imenuje njegovog roditelja, ili nosi prošireni sloj koji drugi izostavlja.
- **Preklapanje**: nijedan sloj ne protivreči, a nijedan ključ nije specifičniji. Oba ključa i dalje mogu da opisuju isto.
- **Različit**: bar jedan sloj ne može da se poklopi.

| Ključ A | Ključ B | Rezultat |
|---|---|---|
| `FXE=1.0S/k:imp/f:bell.dumb` | `FXE=1.0S/k:imp/f:bell.dumb` | Isti |
| `FXE=1.0S/k:imp/f:band.loop` | `FXE=1.0S/k:imp/f:band` | A je specifičniji: `band.loop` je potomak koda `band` |
| `FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down` | `FXE=1.0S/k:mac/l:?/s:?/m:?` | A je specifičniji: navodi slojeve koje B ostavlja otvorenim |
| `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc` | `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex` | A je specifičniji: nosi proširene slojeve koje B izostavlja |
| `FXE=1.0S/k:mac/l:hands/s:?/m:pull.back` | `FXE=1.0S/k:mac/l:?/s:seated.chest/m:pull.back` | Preklapanje: svaki ključ ostavlja otvorenim nešto što drugi navodi |
| `FXE=1.0S/k:mac/l:arms/s:seated/m:sh.hadd;k:mac/l:hands/s:seated.chest/m:sh.habd` | `FXE=1.0S/k:mac/l:arms/s:seated/m:sh.hadd` | Preklapanje: kombinovana sprava i jedna od njenih konfiguracija |
| `FXE=1.0S/k:mac/l:ankles/s:seated/m:kn.flex` | `FXE=1.0S/k:mac/l:ankles/s:prone/m:kn.flex` | Različit: položaji se razlikuju |
| `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:plate/c:arc` | `FXE=1.0N/k:mac/l:ankles/s:prone/m:kn.flex/r:stack` | Različit: oba nose pogon, a pogoni se razlikuju |
| `FXE=1.0S/k:stn/f:cable` | `FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down` | Različit: stanica i sprava za snagu |
| `FXE=1.0S/k:imp/f:band.mini` | `FXE=1.0S/k:imp/f:band.loop` | Različit: dva potomka koda `band` |

Identičan ključ je pouzdano poklapanje, a sve ostalo daje kratku listu koju osoba potvrđuje. Pogledajte [Korišćenje ključeva](../structural-keys.md#using-keys) za to kako se čuvaju potvrđene veze.

## Pronalaženje srodnih stavki {#finding-related-items}

Ključevi opreme koji dele kodove čine porodice, i niko ne mora da ih deklariše. Potražite vrednost u jednom sloju i naći ćete svaki komad opreme koji je deli.

| Pretraga | Pronalazi |
|---|---|
| `k` je `mac` | Svaku spravu za snagu |
| `k` je `imp` | Svaki rekvizit: šipke, bučice i girje, lopte, trake i ostalo |
| `k` je `erg` | Svaku kardio spravu |
| `f` je kod `bell.*` | Bučice, girje i cirkuske bučice |
| `k` je `imp` i `f` je kod `bar.*` | Svaku šipku za tegove: pravu, EZ, trap, axle i zakrivljenu. Bez vrste, `bar.*` pronalazi i fiksnu šipku, šipke za propadanje i paralete |
| `f` je `band` | Svaku traku, preko njenih potomaka `band.loop`, `band.mini` i `band.tube`. Roditeljski kod pronalazi svoje potomke |
| `m` je `pull.down` | Svaku spravu za povlačenje |
| `m` je `kn.flex` | Sprave za pregib nogu u ležanju, u sedu i u stojećem stavu |
| `k` je `mac` i `l` je `feet` | Sprave koje se potiskuju stopalima: potisak nogama, glute kickback, podizanje prednjeg dela stopala |

`bell.*` označava svaki kod koji počinje sa `bell.`. Pretraga „je“ je ista operacija kao poređenje na „specifičnije“: svaka jednonamenska sprava za povlačenje specifičnija je od `FXE=1.0S/k:mac/l:?/s:?/m:pull.down`. Kombinovana sprava koja služi i za veslanje nije ni specifičnija ni različita: ništa ne protivreči. Pretraga „sadrži“ traži kod, ili njegovog potomka, bilo gde u sloju.

Ključ vežbe koristi iste kodove, pa iste pretrage pronalaze vežbe: `l` sadrži `mac` pronalazi svaku vežbu izvedenu na spravi za snagu (pogledajte [Pronalaženje srodnih stavki](./exercise-key.md#finding-related-items) na stranici o ključu vežbe).

## Građenje ključeva {#building-keys}

Ključ možete napisati ručno prateći ovu stranicu ili ga generisati alatom [FDS Encoder](../../tools/encoder/index.md).
