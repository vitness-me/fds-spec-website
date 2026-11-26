---
title: Ključ vežbe
sidebar_label: Ključ vežbe
description: Kako se strukturni ključ vežbe (fxi) sastavlja, sloj po sloj.
---

# Ključ vežbe

Ključ vežbe je strukturni ključ vežbe. Nalazi se u polju `fxi` i beleži kako se telo kreće, položaj iz kog polazi, na čemu se oslanja i čime se kreće. Ova stranica pokazuje kako se ključ sastavlja, šta znače svaki sloj i svaki kod i kako se dva ključa upoređuju.

Zaglavlje `FXI=1.0` je verzija ključa, a liste kodova dolaze sa izdanjem FDS-a koje ih objavljuje. Kasnije izdanje može dodati kodove ili razdeliti kod na specifičnije potomke, ali nikada ne menja značenje koda, pa ključ napisan danas ostaje validan.

Liste kodova objavljene su kao registri: slojevi i kodovi ovog ključa u [`exercise-key.registry.json`](https://spec.vitness.me/registries/exercise-key.registry.json), kodovi opreme u [`equipment-key.registry.json`](https://spec.vitness.me/registries/equipment-key.registry.json), a [tačke tela](https://spec.vitness.me/registries/body-points.registry.json) i [položaji tela](https://spec.vitness.me/registries/body-positions.registry.json) koje deli sa ključem opreme.

## Anatomija ključa {#anatomy-of-the-key}

Iskoraci u hodu sa bučicom u svakoj ruci imaju ovaj ključ:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXI</span><span className="ka-sym">=</span><span className="ka-code">1.0</span><span className="ka-flag">S</span></code>
      <span className="key-anatomy__label">zaglavlje</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">m</span><span className="ka-sym">:</span><span className="ka-code">hip</span><span className="ka-sym">.</span><span className="ka-code">ext</span><span className="ka-sym">+</span><span className="ka-code">kn</span><span className="ka-sym">.</span><span className="ka-code">ext</span></code>
      <span className="key-anatomy__label">pokret</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">o</span><span className="ka-sym">:</span><span className="ka-code">standing</span></code>
      <span className="key-anatomy__label">orijentacija</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">f</span><span className="ka-sym">:</span><span className="ka-code">travel</span><span className="ka-sym">.</span><span className="ka-code">fwd</span></code>
      <span className="key-anatomy__label">rad nogu</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">l</span><span className="ka-sym">:</span><span className="ka-code">bell</span><span className="ka-sym">.</span><span className="ka-code">dumb</span><span className="ka-sym">@</span><span className="ka-code">hands</span></code>
      <span className="key-anatomy__label">opterećenje</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-letter">x</span><span className="ka-sym">:</span><span className="ka-code">a</span></code>
      <span className="key-anatomy__label">strane</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-letter">Slovo sloja</span> · <span className="ka-code">kod</span> · <span className="ka-sym">simbol</span> · <span className="ka-flag">zastavica</span>
  </figcaption>
</figure>

`FXI=1.0S/m:hip.ext+kn.ext/o:standing/f:travel.fwd/l:bell.dumb@hands/x:a`

| Deo | Tekst | Šta kaže |
|---|---|---|
| Tip ključa | `FXI` | Ovo je ključ vežbe. |
| Verzija | `1.0` | Glavna verzija 1, revizija 0. |
| Zastavica | `S` | Svaki sloj u ključu je standardni. |
| Pokret | `m:hip.ext+kn.ext` | Kukovi i kolena se zajedno opružaju. |
| Orijentacija | `o:standing` | Ponavljanje počinje u stojećem stavu. |
| Rad nogu | `f:travel.fwd` | Svaki korak ide napred i ne vraća se. |
| Opterećenje | `l:bell.dumb@hands` | Bučice, u rukama. |
| Strane | `x:a` | Noge se smenjuju, ponavljanje po ponavljanje. |
| Izostavljeni slojevi | `k s g r h p a` | Svaki je na podrazumevanoj vrednosti: pomera se kraj udova, pod nosi stopala, uobičajeni hvat i stav, pun obim, bez zadržanog držanja, uobičajeni pravac vuče, pribor nije naveden. |

Slojevi su razdvojeni znakom `/`. Svaki sloj je njegovo slovo, `:` i vrednost sastavljena od kodova i simbola.

## Dimenzije i slojevi {#dimensions-and-layers}

Svaki sloj beleži jednu dimenziju vežbe.

| Slovo | Sloj | Dimenzija koju beleži | Obavezan | Kada je izostavljen |
|---|---|---|---|---|
| `m` | Pokret | Koji se zglobovi pokreću, u kom smeru, u kojim fazama, i da li je pokret zadržan, cikličan, balistički ili istezanje | Da | — |
| `o` | Orijentacija | Položaj tela na početku ponavljanja | Da | — |
| `k` | Pokretni kraj | Koji se kraj tela pomera u radu na trupu | Ne | Pomera se kraj udova |
| `f` | Rad nogu | Iskoraci, raskorak ili kretanje kroz prostor | Ne | Stopala postavljena u ravni |
| `s` | Oslonac | Površine koje nose težinu tela i tačke tela na njima | Ne | Pod, kako orijentacija podrazumeva |
| `l` | Opterećenje | Oprema koja opterećuje radne mišiće i gde se drži; ili telesna masa | Da | — |
| `x` | Strane | Da li udovi rade zajedno, jedna strana pa druga, naizmenično ili u suprotnim smerovima | Ne | Obe zajedno |
| `g` | Hvat i stav | Orijentacija šaka, širina hvata i širina stava | Ne | Uobičajena orijentacija šaka, srednja širina, srednji stav |
| `r` | Obim i početak | Delimičan ili produžen obim, i početni položaj različit od uobičajenog | Ne | Pun obim iz uobičajenog početka |
| `h` | Držanje | U čemu se drže udovi koji ne obavljaju rad | Ne | Bez zadržanog držanja |
| `p` | Pravac vuče | Odakle vuče sajla ili traka, ili putanja opterećenja pored tela | Ne | Pravac koji pokret podrazumeva |
| `a` | Pribor | Pribor ili partner koji pomaže bez opterećivanja ili oslanjanja tela | Ne | Nije naveden |

Pravila za svaki ključ:

- Ključ mora nositi `m`, `o` i `l`. Kada pokret, orijentacija ili opterećenje nisu poznati, kao vrednost napišite `?`: `o:?`.
- Slojevi moraju biti u redosledu iz tabele: `m o k f s l x g r h p a`.
- Sloj na podrazumevanoj vrednosti se izostavlja. Pisanje podrazumevanog koda (`x:b`, `f:level`, `h:none`) ne kaže ništa više, a zapisani oblik ga izostavlja.
- **Podrazumevana vrednost je vrednost**, osim kod sloja pribora, koji, kada je izostavljen, nije naveden. Ključ bez `x` kaže da obe strane rade zajedno. To je druga vežba u odnosu na onu sa `x:u`, a ne manje specifična. Samo `?` ostavlja dimenziju otvorenom.
- Stavke spojene znakom `+` i tačke posle `@` pišu se sortirane (`floor@feet,hands`), a u pokretu se izostavlja pokret u zglobu napisan pored sopstvenog potomka. Tako jedna vežba uvek ima jedan zapisani oblik.
- Sloj pribora `a` je jedini prošireni sloj. Ključ koji ga nosi ima zastavicu `N` (`FXI=1.0N/…`); svaki drugi ključ ima zastavicu `S`.

Slojevi ispod navedeni su redosledom ključa. Za svaki: njegovi kodovi, pa njegova pravila.

### Pokret (`m`) {#motion-m}

Pokret se gradi od pokreta u zglobovima, zapisanih kao `joint.action`.

| Zglob | Značenje |
|---|---|
| `nk` | Vrat |
| `sp` | Kičma: trup, grudni i slabinski deo zajedno |
| `sc` | Lopatica: lopatica na grudnom košu |
| `sh` | Rameni zglob |
| `el` | Lakat |
| `fa` | Podlaktica: okret koji rotira dlan |
| `wr` | Ručni zglob |
| `hip` | Kuk |
| `kn` | Koleno |
| `ank` | Skočni zglob i stopalo |

| Pokret u zglobu | Značenje |
|---|---|
| `nk.flex` `nk.ext` | Brada ka grudima; glava zabačena unazad |
| `nk.lflex` `nk.rot` | Uvo ka ramenu; okretanje glave |
| `sp.flex` `sp.ext` | Rebra ka karlici, kao u krančevima; ispravljanje ili izvijanje leđa |
| `sp.lflex` `sp.rot` | Bočni pregib; ramena se uvrću u odnosu na kukove |
| `sc.elev` `sc.dep` | Lopatice gore (sleganje ramenima); povučene nadole |
| `sc.pro` `sc.ret` | Lopatice razmaknute oko rebara; skupljene |
| `sh.flex` | Ruka napred i gore: prednje podizanje, potisak iznad glave |
| `sh.ext` | Ruka nadole i unazad iz položaja ispred tela: veslanje, propadanje na razboju |
| `sh.ext.oh` | Ruke nadole ispred lica iz položaja iznad glave: zgib pothvatom, povlačenje uskim hvatom, pulover. Potomak koda `sh.ext`: `el.flex+sh.ext+sh.ext.oh` se zapisuje kao `el.flex+sh.ext.oh` |
| `sh.abd` `sh.add` | Ruka u stranu i gore (bočno podizanje); nadole uz telo iz širokog položaja (zgib širokim hvatom) |
| `sh.hadd` `sh.habd` | Ruka preko prednje strane u visini grudi (potisak, razvlačenje); unazad i u stranu u visini grudi (obrnuto razvlačenje) |
| `sh.ir` `sh.er` | Podlaktica se okreće ka stomaku, lakat savijen; okreće se ka spolja |
| `el.flex` `el.ext` | Savijanje lakta (pregib); opružanje (potisak, ekstenzija za triceps) |
| `fa.pron` `fa.sup` | Dlan se okreće nadole; dlan se okreće nagore |
| `wr.flex` `wr.ext` | Dlan ka podlaktici; nadlanica ka podlaktici |
| `wr.rdev` `wr.udev` | Strana palca ka podlaktici; strana malog prsta ka podlaktici |
| `hip.flex` `hip.ext` | Butina ka trupu, ili trup ka butini (trbušnjak); butina od trupa, kao pri ustajanju |
| `hip.abd` `hip.add` | Noga u stranu; noga ka drugoj nozi |
| `hip.ir` `hip.er` | Koleno se okreće ka unutra; koleno se okreće ka spolja |
| `kn.flex` `kn.ext` | Savijanje kolena protiv otpora (pregib nogu); opružanje (ustajanje iz čučnja) |
| `ank.df` `ank.pf` | Prsti ka cevanici; podizanje na prste ili odraz |
| `ank.inv` `ank.ev` | Taban se okreće ka unutra; taban se okreće ka spolja |
| `<joint>.circ` | Kruženje zglobom: `nk`, `sp`, `sh`, `wr`, `hip` ili `ank` |
| `<joint>.?` | Zglob se pokreće, smer nepoznat |

Pravila:

- Pišite smer u kom se zglobovi kreću dok se radni mišići skraćuju protiv opterećenja: dizanje, nikada spuštanje, povratak ili pauzu.
- Zglob računajte kada ga radni mišići pomeraju kroz jasan obim, oko 30° ili više, kao deo onoga što vežba trenira. Zglob koji se namerno drži mirno izostavlja se: koleno u rumunskom mrtvom dizanju ili zamahu, lakat u razvlačenju ili bočnom podizanju.
- Kičmu pišite samo kada je pokret trupa sama vežba (krančevi, hiperekstenzija, uvrtanje), lopaticu samo kada se lopatica kreće sama (sleganje ramenima), ručni zglob i vrat samo u vežbama za ručni zglob i vrat, rotaciju ramena samo u vežbama rotacije, a skočni zglob samo kada se telo podiže na prste ili se odražava od tla (podizanje na prste, skok, trčanje).
- Okretanje dlana tokom pregiba ili potiska je hvat (`g`), a ne `fa.pron` ili `fa.sup`. Rotacija podlaktice piše se samo kada je okretanje protiv otpora sam rad.
- Pokret ramena prati putanju šaka u odnosu na trup:

  | Šake se kreću | Pokret |
  |---|---|
  | Od grudi, pod pravim uglom u odnosu na trup: potisak na klupi, sklek, razvlačenje | `sh.hadd` |
  | Od grudi ka strani glave: kosi potisak | `sh.flex+sh.hadd` |
  | Od grudi ka strani stopala: potisak na negativnoj klupi | `sh.ext+sh.hadd` |
  | Nagore duž trupa, pored glave: potisak iznad glave | `sh.flex` |
  | Nadole duž trupa ka stopalima: propadanje na razboju | `sh.ext` |
  | Ka trupu iz položaja ispred tela, laktovi uz telo: veslanje | `sh.ext` |
  | Ka trupu iz položaja ispred tela, laktovi široko u visini ramena: face pull | `sh.habd` |
  | Nadole iz položaja iznad glave, ispred lica: zgib pothvatom, svaki zgib ili povlačenje pothvatom, neutralnim ili uskim hvatom; povlačenje opruženim rukama, pulover, bacanje lopte o pod | `sh.ext.oh` |
  | Nadole iz položaja iznad glave, sa strane: zgib ili povlačenje nathvatom srednje ili široke širine | `sh.add` |
  | Nagore u stranu: bočno podizanje | `sh.abd` |

- Jedna faza po zasebnom pokretu, redosledom ponavljanja, spojene znakom `>`. Ako drugi pokret počne pre nego što se prvi završi, to je jedna faza (thruster). Ako ne, to su dve (čučanj, pa potisak).
- Dva suprotna pokreta, kao `el.flex` i `el.ext`, nikada ne dele jedan deo. Jedan zglob može se kretati u suprotnim smerovima u različitim fazama.
- Prefiks ispred dela određuje njegovu vrstu: zadržan, cikličan, balistički, statičko istezanje ili dinamičko istezanje. Bez prefiksa je obična faza kretanja. Prefiksi su navedeni pod [Simboli](#symbols).
- Zadržan deo ispod udova koji se kreću je zaseban deo, spojen sa njima znakom `|`: plank sa podizanjem noge je `=sp.flex|hip.ext`. Isto važi i za zadržan potisak uda koji se ne kreće, kada je vežba zasnovana na njemu: Janda trbušnjak povlači pete nadole kroz celo ponavljanje, `=kn.flex|hip.flex+sp.flex`.
- U istezanju, `|` spaja i dva uda dovedena u suprotnim smerovima: istezanje trkača je `%hip.ext|%hip.flex`.
- U istezanju, zadržan zglob pišite kada on određuje koji se mišić isteže: koleno u istezanju lista, `kn.ext` opruženo ili `kn.flex` savijeno.

### Orijentacija (`o`) {#orientation-o}

Ovi kodovi su položaji tela oba ključa: [ključ opreme](./equipment-key.md#posture-s) njima zapisuje položaj sprave.

| Kod | Značenje | Tačke koje podrazumeva |
|---|---|---|
| `standing` | Na nogama, trup unutar oko 30° od vertikale | `feet` |
| `standing.bent` | Na nogama, trup nagnut napred više od oko 30° i zadržan tako (veslanje u pretklonu) | `feet` |
| `standing.chest` | Na nogama, trup oslonjen na jastuk, uspravan ili u pretklonu (sprava za magareće podizanje na prste) | `feet`, `chest` |
| `seated` | U sedu, trup više od 60° od horizontale | `seat` |
| `seated.bent` | U sedu, trup nagnut napred preko butina i zadržan tako | `seat` |
| `seated.chest` | U sedu, grudi uz jastuk koji drži trup (sprava za veslanje, sprava za zadnje deltoide) | `seat`, `chest` |
| `kneeling` | Na oba kolena, trup uspravan | `knees`, `shins` |
| `kneeling.half` | Na jednom kolenu, drugo stopalo napred | `knees`, `feet` |
| `supine` | Licem nagore, trup unutar 15° od horizontale | `back` |
| `supine.incline` | Licem nagore, glava više od kukova, trup 15–60° od horizontale | `back` |
| `supine.decline` | Licem nagore, glava niže od kukova, trup 15–60° od horizontale | `back` |
| `prone` | Licem nadole, trup unutar 15° od horizontale: ležanje, plank, sklek, upor na šakama i kolenima | `chest` |
| `prone.incline` | Licem nadole, glava više od kukova, 15–60° (šake podignute) | `chest` |
| `prone.decline` | Licem nadole, glava niže od kukova, 15–60° (stopala podignuta) | `chest` |
| `prone.pike` | Licem nadole, kukovi najviši, šake i stopala na podlozi | `feet`, `hands` |
| `side-lying` | Na jednom boku: ležanje ili bočni plank | — |
| `hanging` | Telo drže šake ili ruke, stopala odvojena od poda | `hands` |
| `inverted` | Naglavačke, glava najniža: stoj na rukama, stoj na glavi | `hands` |

Pravila:

- Pišite orijentaciju na početku prve faze.
- Pretklon zadržan tokom cele serije je `standing.bent`. Pretklon u kom se trup kreće, kao u mrtvom dizanju ili zamahu, počinje kao `standing`.
- Orijentacija prati trup: upor na šakama i kolenima je `prone`, a `kneeling` znači da je trup uspravan.
- Sed na podu sa zaklonom od 30–60° (V-sed, ruski uvrtaj) je `supine.incline`.
- Na spravi pišite položaj tela: ekstenzija nogu u sedu je `seated`, pregib nogu u ležanju `prone`, potisak nogama `supine.incline`, sprava za veslanje sa jastukom za grudi `seated.chest`. To je isti kod kao položaj sprave u njenom ključu opreme.
- Kada se ponavljanje završi u orijentaciji različitoj od početne, napišite obe: ustajanje iz ležanja je `o:supine>standing`. Ponavljanje koje ide nadole i vraća se, kao burpi, zapisuje se samo svojim početkom.

### Pokretni kraj (`k`) {#moving-end-k}

| Kod | Značenje |
|---|---|
| `limbs` | Pomera se kraj udova (podrazumevano) |
| `trunk` | Pomera se kraj trupa, a noge ostaju na mestu: trbušnjak, krančevi, most, hip thrust, hiperekstenzija, nordijski pregib |
| `both` | Oba kraja se kreću jedan ka drugom: V-pregib, „nož“, savijanje u klupko |

Pravila:

- `k` pišite samo za rad na trupu u kom se pomera kraj trupa ili oba kraja. Svaka druga vežba ga izostavlja.

### Rad nogu (`f`) {#footwork-f}

| Kod | Značenje |
|---|---|
| `level` | Stopala postavljena u ravni (podrazumevano) |
| `split` | Stopala postavljena u raskorak, jedno ispred drugog |
| `step.fwd` `step.back` `step.side` | Svako ponavljanje iskoračuje napred, nazad ili u stranu i vraća se |
| `step.cross` | Svako ponavljanje iskoračuje nazad i ukršteno iza druge noge (kniks iskorak) i vraća se |
| `travel.fwd` `travel.back` `travel.side` | Telo se kreće napred, nazad ili bočno i ne vraća se posle svakog ponavljanja |

Pravila:

- Iskorak bez reči o smeru ide napred; split čučanj ostaje u `split`; iskoraci u hodu se kreću kroz prostor.
- Rad u mestu, ili na traci za trčanje ili drugoj kardio spravi, izostavlja `f`.
- `level` se piše samo unutar niza: izbačaj iz raskoraka je `f:level>split`.

### Oslonac (`s`) {#support-s}

Oslonac imenuje svaku površinu njenim [kodom opreme](#equipment-in-an-exercise-key): oslonac iz [tabela oblika](./equipment-key.md#form-f) ključa opreme, kao što su `floor`, `bench`, `box` ili `bar.fixed`, ili bilo koji kod opterećenja osim `none`. Posle površine dolaze [tačke tela](#body-points) navedene pod opterećenjem.

Pravila:

- Pišite svaku površinu koja nosi težinu tela, ili na koju je ud oslonjen, preko onoga što orijentacija podrazumeva. Posle površine napišite `@` i tačke na njoj, izostavljajući tačke koje orijentacija podrazumeva.
- Nikada ne pišite goli pod, prostirku, sedište ili klupu ispod tela u sedu, niti sopstveno sedište i jastuke sprave. Nestabilno sedište (`ball.stab`, `dome`, `board.bal`, `roller.foam`) se piše.
- Kada trup ne leži ni na čemu, kao u planku ili skleku, navedite svaku tačku koja nosi težinu: `s:floor@feet,forearms`. Telo licem nagore koje visi o šakama takođe zadržava `floor@feet`: obrnuto veslanje je `s:bar.fixed@hands+floor@feet`.
- Stopala na podu nikada se ne pišu ispod tela u sedu, niti ispod tela licem nagore koje leži na klupi, lopti ili valjku. Stopala na bilo čemu drugom se pišu: vežba u sedu sa stopalima na lopti zadržava `ball.stab@feet`.
- Površine ispod različitih tačaka su zasebne stavke: stopala na lopti i šake na podu je `s:ball.stab@feet+floor@hands`.
- Kutija, stepenik, klupa ili platforma ispod podignutih šaka ili stopala je `box`, osim ako vežba imenuje površinu.
- `dome` je BOSU kod kog strana nije navedena. Napišite `dome.up` ili `dome.down` kada je strana poznata.
- Oprema koja samo opterećuje telo ide u `l`, nikada u `s`.

### Opterećenje (`l`) {#load-l}

Opterećenje imenuje opremu koja opterećuje radne mišiće njenim [kodom opreme](#equipment-in-an-exercise-key), ili piše `none` za telesnu masu. Posle svakog koda dolaze `@` i tačka držanja.

#### Tačke tela {#body-points}

Tačka držanja je jedna od tačaka tela. Iste tačke tela slede posle `@` u osloncu, a [ključ opreme](./equipment-key.md#load-interface-l) njima zapisuje interfejs opterećenja sprave.

| Tačka tela | Značenje |
|---|---|
| `hands` | Šake, ili jedna šaka: uz telo, na dužini ruku, za ručku; ručke ili šipka sprave |
| `forearms` | Podlaktice, laktovi savijeni: plank na laktovima, ili jastuci sprave za podlaktice |
| `elbows` | Pregib laktova (Zercher) |
| `arms` | Nadlaktice: jastuk Scott klupe, ili jastuk sprave na nadlaktici ili laktu |
| `shoulders` | Ramena: prednji položaj na ramenima ili jedno rame, ili jastuci sprave za ramena |
| `chest` | Grudi: opterećenje držano uz njih (goblet), ili jastuk za grudi |
| `back` | Leđa: šipka preko gornjeg dela leđa (zadnji čučanj), ili jastuk za leđa |
| `hips` | Prednja strana kukova: opterećenje preko njih (hip thrust), ili jastuk ili pojas sprave za kukove |
| `waist` | Okačeno o pojas oko struka |
| `seat` | Zadnjica: sedanje na kutiju ili klupu, ili pokretno sedište sprave |
| `thighs` | Na butinama ili oko njih, ili jastuk sprave za butine |
| `knees` | Na kolenima ili oko njih, ili jastuk ili platforma sprave za kolena |
| `shins` | Cevanice |
| `calves` | Listovi, zadnja strana potkolenice |
| `ankles` | Na skočnim zglobovima ili neposredno iznad njih: traka, manžetna ili jastuk sprave na potkolenici |
| `feet` | Stopala, ili jedno stopalo: na podu, na ploči za stopala ili na pedalama |
| `head` | Glava ili čelo, ili jastuk sprave za glavu |

Dve tačke držanja nisu tačke tela i pišu se samo u opterećenju:

| Tačka držanja | Značenje |
|---|---|
| `overhead` | Drži se opruženim rukama iznad glave tokom celog ponavljanja |
| `assist` | Rekvizit preuzima deo telesne mase: traka za pomoć ili sprava sa asistencijom |

Pravila:

- Navedite svaki komad opreme koji opterećuje radne mišiće, svaki sa `@` i mestom gde se drži: `l:bar.straight@back`.
- `none` znači bez opreme. Stoji samo i ne uzima tačku držanja: propadanje sa tegom je `l:plate@waist`, a ne `none` pored diska.
- Sprava za snagu je `mac`. Nema specifičniji kod, jer sopstveni pokret vežbe već kaže šta sprava vodi. Kardio sprava je `erg`, ili `erg.` i njen pokret kada je poznat: `erg.row`. [Ključ opreme](./equipment-key.md#keys-in-records) zapisa kaže o kojoj je spravi reč.
- Kod oslonca nikada se ne piše u `l`.
- Traka čiji tip nije naveden je `band`. Naveden tip uzima svoj kod potomka: duga zatvorena traka je `band.loop`. Traka se drži tamo gde pritiska ili vuče telo. Mesto gde je usidrena ne piše se.
- Izostavite broj kada je uobičajen, a `*n` pišite samo kada se razlikuje. Rekvizit za jednu ruku (`bell.dumb`, `bell.kettle`, `plate`, `club`) ide po jedan na svaku radnu šaku; svaki drugi kod je jedan. Na grudima, leđima, kukovima ili struku svaki rekvizit je jedan: goblet čučanj sa jednom bučicom je `l:bell.dumb@chest`. Jedna girja u obe ruke je `bell.kettle*1@hands`.
- Napišite `?` za deo koji ne znate: `?@chest` kada rekvizit nije poznat, `bell.kettle@?` kada tačka držanja nije, `l:?` kada nije poznato ni toliko.

### Strane (`x`) {#sides-x}

| Kod | Značenje |
|---|---|
| `b` | Oba uda rade zajedno, ili pokret nema strane (podrazumevano) |
| `u` | Jedna strana radi svako ponavljanje serije, pa druga strana |
| `a` | Strane se smenjuju, ponavljanje po ponavljanje |
| `rc` | Obe strane se kreću istovremeno u suprotnim smerovima: hodanje, makaze, penjači |
| `@arms` `@legs` | Obuhvat: obrazac važi za ruke ili za noge |

Pravila:

- Jedna strana pa druga (`u`) i smenjivanje ponavljanje po ponavljanje (`a`) su različite vežbe.
- Obuhvat dodajte samo kada ga pokret već ne podrazumeva. Kod iskoraka noge se podrazumevaju, pa je to `x:u`, a ne `x:u@legs`.
- Kada ruke i noge prate različite obrasce, napišite po jednu stavku za svaki obuhvat: nošenje jednom rukom je `x:rc@legs+u@arms`.
- Pokreti koji samo rotiraju ili bočno savijaju trup ili vrat ne uzimaju `x`.
- Istezanje, valjanje ili izdržaj na jednom udu, pa na drugom, jeste `x:u`.

### Hvat i stav (`g`) {#grip-and-stance-g}

| Kod | Značenje |
|---|---|
| `pr` | Pronirani: dlanovi nadole ili od vas (nathvat) |
| `su` | Supinirani: dlanovi nagore ili ka vama (pothvat) |
| `ne` | Neutralni: dlanovi okrenuti jedan ka drugom (čekić) |
| `mx` | Mešoviti: jedna šaka nathvatom, druga pothvatom |
| `w-t` `w-n` `w-m` `w-w` | Širina hvata: šake se dodiruju, usko, srednje (podrazumevano), široko |
| `st-n` `st-m` `st-w` | Stav: uzak, srednji (podrazumevano), širok |

Pravila:

- Uobičajena orijentacija šaka je `su` kada je svaki pokret u zglobu `el.flex` (pregib), a inače `pr`. Kod šaka pišite samo kada se razlikuje.
- Elemente jednog položaja spojite znakom `+`: `g:ne+w-n`. Hvat koji se menja unutar ponavljanja je niz: `g:su>pr`.
- Širina važi za šake na rekvizitu i na osloncu: dijamant sklek je `w-t`.
- Stav se piše samo za početak u stojećem stavu, ili kada stopala potiskuju ploču za stopala sprave.
- Hvat koji rekvizit nameće i dalje je hvat: nastavak sa užetom je `ne`. `ne` trap šipke je jedini izuzetak i nikada se ne piše.

### Obim i početak (`r`) {#range-and-start-r}

| Kod | Značenje |
|---|---|
| `partial` | Namerno deo uobičajenog obima: polovična ponavljanja, pulsiranja |
| `deep` | Dublje od uobičajenog obima |
| `deficit` | Stajanje na nečemu da bi se išlo dublje nego obično |
| `from-floor` | Svako ponavljanje počinje sa opterećenjem koje miruje na podu |
| `from-top` | Počinje u stojećem stavu sa opterećenjem u rukama, spušta se bez odlaganja (iz visa, iznad kolena) |
| `from-top.knee` | Iz visa koji počinje u visini kolena ili ispod. Potomak koda `from-top` |
| `from-pins` | Svako ponavljanje počinje sa klinova, blokova ili kaveza iznad poda |
| `from-drop` | Svako ponavljanje počinje silaskom sa kutije i doskokom (dubinski skok) |

Pravila:

- `partial` i `deep` protivreče jedan drugom. Ključ nosi najviše jedan kod početka.
- Kod početka pišite samo tamo gde nije uobičajeni početak pokreta: mrtvo dizanje počinje sa poda, pa se za njega `from-floor` nikada ne piše.
- Pun obim se nikada ne piše.

### Držanje (`h`) {#held-posture-h}

| Kod | Značenje |
|---|---|
| `none` | Udovi koji ne rade čine ono što pokret podrazumeva (podrazumevano) |
| `arms.oh` | Ruke opružene iznad glave, prazne šake |
| `arms.fwd` | Ruke opružene napred iz ramena, prazne šake |
| `arms.side` | Ruke ispružene u stranu |
| `arms.cross` | Ruke prekrštene na grudima |
| `hands.head` | Šake iza glave ili na glavi (zatvorenički položaj) |
| `el.bent` | Radni laktovi zadržani savijeni pod oko 90° |
| `ua.oh` | Nadlaktice podignute pored glave dok laktovi rade (ekstenzija za triceps iznad glave) |
| `ua.side` | Nadlaktice odmaknute od tela, laktovi rašireni, dok laktovi rade |
| `leg.fwd` | Slobodna noga opružena ispred |
| `leg.back` | Slobodna noga zadržana iza |
| `legs.l` | Noge opružene pod oko 90° u odnosu na trup |
| `kn.bent` | Kolena zadržana savijena dok rade kukovi ili ruke (podizanje kolena u visu) |
| `trunk.fwd` | Trup zadržan u nagibu napred tamo gde orijentacija to već ne kaže (propadanje za grudi) |

Pravila:

- Pišite držanje udova koji miruju dok drugi rade, kada se razlikuje od onoga što pokret podrazumeva. Čučanj sa šakama iza glave je `h:hands.head`; običan čučanj izostavlja `h`.

### Pravac vuče (`p`) {#line-of-pull-p}

| Kod | Značenje |
|---|---|
| `usual` | Pravac koji pokret podrazumeva (podrazumevano) |
| `hi` | Sajla ili traka usidrena više nego što je za taj pokret uobičajeno |
| `lo` | Usidrena niže nego obično |
| `behind` | Opterećenje ili telo prolazi iza glave ili trupa (potisak iza vrata) |
| `side` | Opterećenje vuče sa jedne strane, telo je bočno okrenuto sidrištu |
| `neck` | Opterećenje se spušta do vrata ili brade umesto do grudi |
| `double` | Vijača prolazi ispod stopala dva puta u svakom skoku (double under) |

Pravila:

- `p` pišite samo kada se pravac razlikuje od uobičajenog za taj pokret. Razvlačenje na sajli odozgo nadole je `p:hi`; razvlačenje odozdo nagore je `p:lo`.
- Uobičajeno sidrište je nisko za pregib, podizanje, uspravno veslanje, sleganje ramenima, kickback, pull-through ili vežbu za kuk; visoko za potisak nadole, povlačenje, povlačenje opruženim rukama, face pull, krančeve u klečanju ili drvoseču; u sredini za veslanje, razvlačenje, krosover, potisak za grudi, rotaciju ili ekstenziju iznad glave; i sa strane za Palof potisak.

### Pribor (`a`) {#accessory-a}

Kodovi pribora su kodovi pribora ključa opreme, navedeni u njegovim [tabelama oblika](./equipment-key.md#form-f), i `partner`.

| Kod | Značenje |
|---|---|
| `none` | Bez pribora |
| `strap.stretch` | Traka, pojas, peškir, uže ili zatvorena traka kojom se ud povlači ili drži u istezanju |
| `partner` | Partner koji drži, pruža otpor ili pomaže |
| Bilo koji drugi kod pribora | `belt.lift`, `strap.lift`, `mat` i ostali |

Pravila:

- Pribor nikada ne opterećuje radne mišiće i nikada ne nosi težinu. Opterećenje ide u `l`, oslonac u `s`.
- Kod pribora imenuje istu opremu kao njen ključ opreme: `a:strap.stretch` je `FXE=1.0S/k:acc/f:strap.stretch`. Partner je osoba, a ne oprema, i nema ključ opreme.
- Ručka ili šipka na sajli deo je stanice, a ne pribor.
- `a` je prošireni sloj: ključ koji ga nosi ima zastavicu `N`. Poredi se samo kada ga nose oba ključa; kada ga nosi samo jedan, taj ključ je specifičniji.

## Simboli {#symbols}

Sve u ključu što nije kod jeste simbol.

| Simbol | Značenje | Primer |
|---|---|---|
| `/` | Razdvaja slojeve | `o:standing/l:none` |
| `:` | Razdvaja slovo sloja od njegove vrednosti | `o:standing` |
| `.` | Spaja zglob sa njegovim pokretom, ili kod sa specifičnijim potomkom | `el.flex`, `standing.bent`, `erg.row` |
| `+` | Spaja stavke koje idu zajedno: pokrete u jednoj fazi, površine, rekvizite, elemente hvata, kodove obima, stavke strana, kodove držanja | `m:hip.ext+kn.ext` |
| `>` | Niz redosledom ponavljanja: faze, početna i završna orijentacija, promene rada nogu ili hvata | `g:su>pr` |
| `\|` | Dva dela jedne faze u isto vreme: delovi različitih vrsta, ili dva uda dovedena u suprotnim smerovima u istezanju | `m:=sp.flex\|hip.ext`, `m:%hip.ext\|%hip.flex` |
| `@` | Gde: tačke na površini, tačka držanja opreme, obuhvat koda strana | `l:bell.dumb@hands` |
| `,` | Više tačaka tela na jednoj površini | `s:floor@feet,hands` |
| `*n` | Broj komada opreme, piše se samo kada se razlikuje od uobičajenog | `l:bell.kettle*1@hands` |
| `*` | Ceo sloj namerno uopšten: vežba se može izvesti na oba načina | `o:*` |
| `?` | Nepoznato. Poklapa se sa bilo čim i nikada ne protivreči | `o:?`, `bell.kettle@?`, `sh.?` |
| `-` | Posle pokreta: namerno pokretanje kratkog obima | `m:el.ext+hip.ext-+kn.ext-+sh.flex` |

Prefiksi pokreta stoje ispred dela sloja `m` i određuju njegovu vrstu.

| Prefiks | Vrsta | Primer |
|---|---|---|
| bez | Obična faza kretanja | `m:el.flex` |
| `^` | Balistička: faza se završava telom u letu ili otpuštenim rekvizitom. Samo pravi let ili otpuštanje: olimpijska dizanja i ciklične faze ga nikada ne uzimaju. Pokret izveden u vazduhu je sledeća faza | `m:^ank.pf+hip.ext+kn.ext`, čučanj sa skokom; `m:^el.ext+sh.hadd>sh.hadd`, sklek sa pljeskom |
| `~` | Ciklična: neprekidni ciklusi bez granice ponavljanja; pišite pokretačku polovinu jednog ciklusa. `~0` je valjanje na fom roleru, bez smera | `m:~hip.flex`, penjači |
| `=` | Zadržana pod naporom tokom cele serije; pišite ono ka čemu mišići potiskuju. `=0` je izdržaj ravnoteže bez smera | `m:=sp.flex`, plank |
| `%` | Statičko istezanje: smerovi u koje su zglobovi dovedeni, zadržani na kraju obima | `m:%ank.df+kn.ext`, istezanje lista |
| `&` | Dinamičko istezanje: dovedeno do kraja obima i otpušteno, iznova i iznova | `m:&hip.flex`, zamah nogom napred |

`?` može stajati umesto celog sloja, komada opreme, tačke držanja, površine, tačke tela, smera zgloba ili cele faze. Otvoreno „i možda još“ (`+?`) nije dozvoljeno: napišite pokrete koje znate, ili `?` za celu fazu.

## Oprema u ključu vežbe {#equipment-in-an-exercise-key}

Ključ vežbe i [ključ opreme](./equipment-key.md#equipment-keys-in-exercise-keys) dele tri liste kodova, pa ključ vežbe vodi pravo do ključa svoje opreme, a ključ sprave kaže kako se telo na njoj nalazi rečima koje koristi ključ vežbe.

| Lista | U ključu vežbe | U ključu opreme | Navedena pod |
|---|---|---|---|
| Kodovi opreme | Oprema u opterećenju (`l`) i osloncu (`s`), i pribor (`a`) | Vrsta (`k`) i oblik (`f`) | [Tabele oblika](./equipment-key.md#form-f) ključa opreme |
| Tačke tela | Posle `@` u opterećenju i osloncu | Interfejs opterećenja sprave (`l`) | [Tačke tela](#body-points) |
| Položaji tela | Orijentacija (`o`) | Položaj sprave (`s`) | [Orijentacija](#orientation-o) |

Sprava za veslanje ispod pokazuje sve tri: veslanje na njoj drži se `@hands` i počinje u `seated`, a njen ključ opreme piše `l:hands` i `s:seated`.

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

Kod oblika zamenjuje jedan ključ opreme: `bar.straight` je `FXE=1.0S/k:imp/f:bar.straight`. Kodovi oblika navedeni su u [tabelama oblika](./equipment-key.md#form-f) ključa opreme. Kod vrste zamenjuje svaki ključ te vrste, sa ostalim slojevima otvorenim: `mac` je `FXE=1.0S/k:mac/l:?/s:?/m:?`. `erg.row` je `FXE=1.0S/k:erg/c:?/l:?/s:?/m:row`: bilo koja kardio sprava čiji je pokret `row`. Kardio pokreti navedeni su pod [pokretom](./equipment-key.md#motion-m) ključa opreme.

Svaki kod oblika može se napisati u ključu vežbe, uključujući potomke: `band.loop` je duga zatvorena traka, a `band` je pokriva. `fxe` zapisa imenuje tačnu opremu i jeste ključ koda ili je specifičniji od njega. Sprava za veslanje iznad specifičnija je od `erg.row`.

Pribor nikada nije [glavna oprema](./equipment-key.md#checking-an-exercise-against-its-equipment) vežbe. Kod pribora u sloju `a` ključa vežbe je kod pribora ključa opreme: `a:strap.stretch` je `FXE=1.0S/k:acc/f:strap.stretch`. Istezanje sa trakom, `FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:none/x:u/a:strap.stretch`, ima `l:none`, pa je njegova glavna oprema `FXE=1.0S/k:none`.

Kod oslonca piše se samo u `s`, a kod pribora samo u `a`. Svaki drugi kod osim `none` može se napisati u `l` ili u `s`. Ključ vežbe dodaje gde se oprema drži ili dodiruje (`@`) i, u `l`, koliko je ima (`*n`): pogledajte [Opterećenje](#load-l).

Na spravi se dva ključa slažu: položaj sprave je početna orijentacija vežbe, a njen interfejs opterećenja uključuje tačku u kojoj vežba drži `mac` ili `erg` (`@overhead` je u šakama). Tačka držanja `@assist` se ne proverava.

Ključevi se namerno razlikuju na tri načina:

- **Sprava za snagu nema specifičan kod.** Kardio sprava može biti `erg.row`, jer je ciklus sam pokret. Sprava za snagu je samo `mac`, jer sopstveni pokret vežbe nosi ono što sprava vodi.
- **Izostavljen sloj čita se drugačije.** U ključu vežbe on je na podrazumevanoj vrednosti, koja je vrednost, osim kod sloja pribora, koji, kada je izostavljen, nije naveden. U ključu opreme on je nepoznat, `?`.
- **Slova slojeva svakog ključa su samo njegova.** Samo je `m` pokret u oba. U ključu vežbe `l` je opterećenje, a `s` oslonac; u ključu opreme `l` je interfejs opterećenja, a `s` položaj.

Dva ključa nikada ne beleže istu činjenicu dvaput. Hvat, strane, obim, rad nogu, visina koturače, ugao klupe, tačka držanja i broj pripadaju ključu vežbe. Šta oprema jeste, njena fiksna geometrija i kako je građena pripadaju ključu opreme.

[Provera vežbe prema njenoj opremi](./equipment-key.md#checking-an-exercise-against-its-equipment) pokazuje kako se dva ključa proveravaju jedan prema drugom.

## Razrađeni primeri {#worked-examples}

Svaki primer polazi od običnog opisa i određuje jedan po jedan sloj. Sloj koji nije naveden je na podrazumevanoj vrednosti.

### Pregib sa bučicama u stojećem stavu {#standing-dumbbell-curl}

U stojećem stavu, bučica u svakoj ruci, oba lakta se savijaju zajedno, dlanovi nagore.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `m` | Laktovi se savijaju protiv opterećenja; ramena miruju | `m:el.flex` |
| `o` | U stojećem stavu | `o:standing` |
| `l` | Bučice u rukama. Dve su uobičajen broj kada rade obe ruke, pa nema broja | `l:bell.dumb@hands` |
| `x` | Obe ruke zajedno: podrazumevano | — |
| `g` | Dlanovi nagore su uobičajen hvat kada je svaki pokret `el.flex` | — |

`FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`

Njegova oprema je [bučica](./equipment-key.md#dumbbell), `FXE=1.0S/k:imp/f:bell.dumb`.

### Zadnji čučanj sa šipkom {#barbell-back-squat}

U stojećem stavu, šipka preko gornjeg dela leđa, kukovi i kolena se savijaju i opružaju kroz pun čučanj.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `m` | Ustajanje zajedno opruža kukove i kolena. Skočni zglobovi se ne podižu na prste, pa se ne pišu | `m:hip.ext+kn.ext` |
| `o` | U stojećem stavu | `o:standing` |
| `l` | Šipka preko gornjeg dela leđa | `l:bar.straight@back` |
| `g` `r` | Srednji stav i pun obim: podrazumevano | — |

`FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bar.straight@back`

### Povlačenje na lat spravi {#lat-pulldown}

U sedu na spravi za povlačenje, nathvat u širini ramena, šipka se povlači iznad glave nadole do grudi.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `m` | Laktovi se savijaju, a sa nathvatom ruke se spuštaju iz položaja iznad glave sa strane | `m:el.flex+sh.add` |
| `o` | U sedu | `o:seated` |
| `s` | Sedište sprave i jastuk za butine nikada se ne pišu | — |
| `l` | Sprava za povlačenje, u rukama | `l:mac@hands` |
| `g` | Nathvat srednje širine je uobičajen hvat za ovaj pokret | — |

`FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands`

Njegova oprema je [lat sprava za povlačenje](./equipment-key.md#lat-pulldown-machine), `FXE=1.0S/k:mac/l:hands/s:seated/m:pull.down`.

Povlačenje uskim neutralnim hvatom umesto toga spušta šake ispred lica, pa se menjaju i pokret ramena i hvat:

`FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mac@hands/g:ne+w-n`

### Plank

Licem nadole na podlakticama i prstima, telo pravo, zadržano na vreme.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `m` | Izdržaj. Mišići trupa se odupiru propadanju kukova, što je smer fleksije trupa | `m:=sp.flex` |
| `o` | Licem nadole, trup horizontalan | `o:prone` |
| `s` | Trup ne leži ni na čemu, pa se navodi svaka tačka koja nosi težinu | `s:floor@feet,forearms` |
| `l` | Bez opreme | `l:none` |

`FXI=1.0S/m:=sp.flex/o:prone/s:floor@feet,forearms/l:none`

### Iskoraci u hodu {#walking-lunge}

U stojećem stavu, bučica u svakoj ruci, iskorak napred jednom nogom, pa drugom, uz kretanje kroz prostoriju.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `m` | Izlazak iz iskoraka opruža prednji kuk i koleno | `m:hip.ext+kn.ext` |
| `o` | U stojećem stavu | `o:standing` |
| `f` | Svaki korak ide napred i ne vraća se | `f:travel.fwd` |
| `l` | Bučice u rukama. Obrazac strana je na nogama, pa obe ruke ostaju opterećene: dve, uobičajen broj | `l:bell.dumb@hands` |
| `x` | Noge se smenjuju ponavljanje po ponavljanje. Pokret je samo nogama, pa nema obuhvata | `x:a` |

`FXI=1.0S/m:hip.ext+kn.ext/o:standing/f:travel.fwd/l:bell.dumb@hands/x:a`

### Zamah girjom {#kettlebell-swing}

U stojećem stavu, jedna girja u obe ruke, zamahnuta iz položaja između nogu do visine grudi trzajem kukova.

| Sloj | Odluka | Zapisano |
|---|---|---|
| `m` | Kukovi se opružaju. Kolena zadržavaju fiksno savijanje, a ruke samo njišu, pa se ni jedno ni drugo ne piše. Girja nikada ne napušta šake, pa nema `^` | `m:hip.ext` |
| `o` | Trup se kreće kroz pretklon, pa ponavljanje počinje kao `standing`, a ne `standing.bent` | `o:standing` |
| `l` | Girja je, kao i obično, po jedna na svaku radnu šaku; ovde jednu girju dele obe šake | `l:bell.kettle*1@hands` |

`FXI=1.0S/m:hip.ext/o:standing/l:bell.kettle*1@hands`

## Ključevi u zapisima {#keys-in-records}

Zapis vežbe nosi svoj ključ u `fxi`. Svaka referenca na mišić nosi `fxm` mišića i `fxmg` njegove kategorije, pored svojih `id`, `name` i `categoryId`. Svaka referenca na opremu nosi istu vrednost `fxe` kao [zapis opreme](./equipment-key.md#keys-in-records), pored svojih `id` i `name`:

```json fds:ignore exercise record excerpt showing the fxi, fxm, fxmg and fxe fields
{
  "exerciseId": "ex.dumbbellCurl",
  "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands",
  "canonical": { "name": "Dumbbell Curl", "slug": "dumbbell-curl" },
  "targets": {
    "primary": [
      { "id": "mus.bicepsBrachii", "name": "Biceps Brachii", "categoryId": "cat.upperArmFront", "fxm": "FXM=1.0/biceps-brachii", "fxmg": "FXMG=1.0/arm.anterior" }
    ],
    "secondary": [
      { "id": "mus.brachialis", "name": "Brachialis", "categoryId": "cat.upperArmFront", "fxm": "FXM=1.0/brachialis", "fxmg": "FXMG=1.0/arm.anterior" }
    ]
  },
  "equipment": {
    "required": [
      { "id": "eq.dumbbell", "name": "Dumbbell", "fxe": "FXE=1.0S/k:imp/f:bell.dumb" }
    ]
  }
}
```

Stavka treninga upućuje na vežbu na isti način, sa `fxi` pored svojih `id` i `name`:

```json fds:ignore workout item excerpt showing the fxi field
{
  "id": "i1",
  "exercise": {
    "id": "ex.dumbbellCurl",
    "name": "Dumbbell Curl",
    "fxi": "FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands"
  },
  "scheme": { "pattern": "straight", "sets": 3 },
  "reps": { "kind": "fixed", "value": 10 }
}
```

## Poređenje dva ključa vežbe {#comparing-two-exercise-keys}

Poređenje ide sloj po sloj. Izostavljen sloj uzima svoju podrazumevanu vrednost, koja je vrednost; `?` i `*` se poklapaju sa bilo kojom vrednošću, a roditeljski kod pokriva svoje potomke.

- **Isti**: dva ključa su zapisana identično i ne sadrže `?` ni `*`.
- **Specifičniji**: nijedan sloj ne protivreči, a jedan ključ navodi nešto što drugi ostavlja otvorenim, ili imenuje potomka tamo gde drugi imenuje njegovog roditelja.
- **Različit**: bar jedan sloj ne može da se poklopi.

| Ključ A | Ključ B | Rezultat |
|---|---|---|
| `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands` | `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands` | Isti |
| `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands` | `FXI=1.0S/m:el.flex/o:?/l:bell.dumb@hands` | A je specifičniji: navodi orijentaciju koju B ostavlja otvorenom |
| `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none` | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:none/h:hands.head` | Različit: držanje kod A je podrazumevano, kod B su šake iza glave |

Kada svaki ključ ostavlja otvorenim nešto što drugi navodi, nijedan nije specifičniji, a njih dva i dalje mogu opisivati istu vežbu.

Identičan ključ je pouzdano poklapanje, a sve ostalo daje kratku listu koju osoba potvrđuje. Pogledajte [Korišćenje ključeva](../structural-keys.md#using-keys) za to kako se čuvaju potvrđene veze.

## Pronalaženje srodnih stavki {#finding-related-items}

Ključevi koji dele kodove čine porodice, i niko ne mora da ih deklariše. Potražite vrednost u jednom sloju i naći ćete svaku vežbu koja je deli, u svakom katalogu koji piše ključeve.

| Pretraga | Pronalazi |
|---|---|
| `m` je `hip.ext+kn.ext` | Isti pokret: čučnjeve, iskorake, penjanja na klupu i potiske nogama, bez obzira na opterećenje |
| `l` sadrži kod `bell.*` | Istu porodicu opreme: vežbe opterećene bučicama, girjama ili cirkuskim bučicama |
| `l` sadrži `mac` | Svaku vežbu izvedenu na spravi za snagu |
| `o` je `hanging` | Istu orijentaciju: zgibove, podizanja nogu u visu, slobodne vise |
| `m` sadrži `sh.ext` | Veslanja i propadanja, a preko potomka `sh.ext.oh` i zgibove pothvatom, pulovere i povlačenja uskim hvatom. Roditeljski kod pronalazi svoje potomke |
| `l` sadrži `erg` | Svaku vežbu na kardio spravi, preko potomaka `erg.row`, `erg.gait` i ostalih |
| `m` sadrži `hip.flex` | Kategoriju `FXMG=1.0/a:hip.flex`, a preko nje mišiće koji savijaju kuk: psoas major, iliacus i rectus femoris |

`bell.*` označava svaki kod koji počinje sa `bell.`. Slojevi se kombinuju: `m` je `hip.ext+kn.ext` i `l` sadrži `bar.straight@back` pronalazi zadnje čučnjeve i iskorake sa šipkom na leđima. Ključevi opreme čine porodice na isti način (pogledajte [Pronalaženje srodnih stavki](./equipment-key.md#finding-related-items) na stranici o ključu opreme).

Pretraga „je“ je ista operacija kao poređenje na „specifičnije“: zapišite je kao ključ, sa `?` u svakom sloju koji ostavlja otvorenim. Pretraga „sadrži“ traži kod, ili njegovog potomka, bilo gde u sloju, i nije poređenje. Na primer:

`FXI=1.0S/m:hip.ext+kn.ext/o:?/k:?/f:?/s:?/l:?/x:?/g:?/r:?/h:?/p:?`

Svaka vežba koju prva pretraga pronađe specifičnija je od ovog ključa. Zadnji čučanj sa šipkom i iskoraci u hodu iznad oba su specifičniji.

## Građenje ključeva {#building-keys}

Ključ možete napisati ručno prateći ovu stranicu ili ga generisati alatom [FDS Encoder](../../tools/encoder/index.md).
