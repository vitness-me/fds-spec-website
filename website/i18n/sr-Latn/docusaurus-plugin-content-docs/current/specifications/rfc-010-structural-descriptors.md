---
title: 'RFC-010: Strukturni deskriptori'
description: Strukturni deskriptori FXI, FXE i FXM, polja zapisa koja ih nose i protokol podudaranja
sidebar_position: 10
keywords: [fxi, fxe, fxm, structural descriptor, match protocol, xrefs, provenance, rfc]
---

# RFC-010: Strukturni deskriptori — FXI, FXE i FXM

**Status**: Nacrt
**Verzija**: 0.1.0
**Datum**: 2026-11-24
**Autori**: VITNESS tim
**Kategorija**: Standards Track

## Sažetak

Ova specifikacija dodaje tri strukturna deskriptora u Fitness Data Standard: **FXI** za vežbu, **FXE** za komad opreme i **FXM** za mišić. Deskriptor je kratak string, sastavljen iz zatvorenih vokabulara, koji kaže kako se vežba izvodi, šta je komad opreme ili koje tkivo označava ključ mišića, bez upotrebe naziva na bilo kom jeziku. Dva kataloga koja istu vežbu opisuju različitim rečima mogu da uporede svoje deskriptore i pronađu jedan drugog.

Definiše gde deskriptori stoje na entitetima vežbe, opreme i mišića, polja koja putuju uz njih (ko je odgovorio, šta notacija propušta i veze koje je potvrdila osoba ili razrešivač), protokol podudaranja koji razrešivač prati i način na koji se deskriptori verzionišu. Objavljuje merenja na kojima su deskriptori do sada testirani i navodi kako se ona čitaju u odnosu na prag koji ovaj RFC postavlja za sopstveno prihvatanje.

Ovaj RFC prolazi isti put od nacrta do prihvatanja kao i svaki drugi RFC; §12 navodi uslove za njegovo prihvatanje, među njima i kapiju izdanja iz §9.5. Svako polje koje ovaj RFC dodaje je opciono, nijedno postojeće polje ne menja značenje, a izmena šeme je sporedna verzija.

## 1. Uvod

### 1.1. Pozadina

RFC-001 do RFC-005 omogućavaju provajderu da izveze svoj katalog u obliku koji svaki drugi provajder može da pročita. Ne omogućavaju čitaocu da utvrdi kojoj od njegovih sopstvenih vežbi odgovara uvezena vežba. Svaki provajder identifikuje svoje zapise sopstvenim ID-jem iz registra, a jedino što dva kataloga pouzdano dele jeste to da opisuju iste pokrete. Nazivi to ne prenose: ista vežba se piše drugačije na svakom jeziku, u žargonu svake teretane i u svakom katalogu koji ju je preimenovao, a dve vežbe gotovo istog naziva mogu da se razlikuju upravo u onom jednom detalju koji je bitan.

Strukturni deskriptor opisuje sam pokret. FXI beleži radnje u zglobovima, položaj tela, oslonac, opterećenje i mesto na kome se drži, strane, hvat, obim pokreta, svaki zadržani položaj i liniju vuče, svako iz zatvorenog vokabulara. Softver poredi dva takva stringa bez čitanja naziva iz bilo kog od dva kataloga.

### 1.2. Ciljevi

1. Omogućiti vlasniku kataloga da opiše svaku vežbu, komad opreme i mišić u obliku koji drugi katalog može da uporedi bez zajedničkog naziva.
2. Omogućiti razrešivaču da uvezeni zapis automatski poveže sa pravim lokalnim zapisom kada je to bezbedno, i da ponudi kratku listu za potvrdu kada nije.
3. Zadržati svaku potvrđenu vezu, tako da se podudaranje utvrđuje jednom.
4. Jasno reći koliko se na deskriptore može osloniti, na osnovu merenja, a ne sertifikata.

### 1.3. Obuhvat

**U obuhvatu:**

- tri deskriptora: njihova sintaksa, kanonski oblik i poređenje, uz upućivanje na stranice deskriptora (§4);
- polja zapisa koja ih nose i polja koja putuju uz njih (§5);
- protokol podudaranja (§7);
- verzionisanje deskriptora i šema (§8);
- izmereni dokazi i kapija izdanja (§9).

**Van obuhvata:**

- **Identitet.** Deskriptor nije identifikator. Identitet ostaje sopstveni ID svakog provajdera iz registra (§3).
- **Preskripcija.** Tempo, opterećenje, ponavljanja i imenovane šeme serija nisu deo deskriptora. Dva treninga koja istu vežbu propisuju različito opisuju jednu vežbu. Preskripcija pripada RFC-006.
- **Podaci provajdera.** FDS je standard, a ne katalog. Objavljuje registre kodova i pravila. Ne objavljuje liste mišića, kataloge opreme, reči pokreta ni šablone imenovanih vežbi: to su podaci svakog provajdera (§4.4).
- **Dva pitanja namerno ostavljena otvorenim, i ovde nerešena:** gde se završava otvoren, objavljen enkoder, a počinje provajderov sopstveni servis za podudaranje; i da li `classification.mechanics`, `classification.force` ili obrazac pokreta treba izvoditi iz FXI umesto da se navode uz njega.

## 2. Terminologija {#2-terminology}

Ključne reči MUST, MUST NOT, SHOULD, SHOULD NOT i MAY tumače se kako je opisano u RFC 2119.

- **Deskriptor**: FXI, FXE ili FXM string u kanonskom obliku.
- **Vlasnik**: onaj ko održava katalog kome zapis pripada. U ovom RFC-u vlasnik je katalog, a ne osoba koja trenira.
- **Tok pitanja**: zatvorena pitanja čiji odgovori grade FXI i FXE, objavljena kao podaci.
- **Zapis odgovora**: odgovori koje je jedan vlasnik dao za jedan zapis, čuvani uz string koji su izgradili.
- **Revizija pravila**: revizija vokabulara deskriptora i pravila slojeva, imenovana poljem `rules` svakog registra deskriptora. Ne upisuje se u string.
- **Biblioteka**: skup zapisa među kojima razrešivač traži podudaranje, obično sopstveni katalog razrešivača.
- **Režim uvoza**: građenje deskriptora iz reda drugog kataloga bez njegovog vlasnika.
- **Marker nedostatka**: vlasnikova beleška da notacija propušta nešto u vezi sa ovim zapisom.
- **Veza**: sačuvana tvrdnja da zapis i zapis u drugom katalogu opisuju istu stvar.

## 3. Tvrdnja

Ovaj standard za FXI tvrdi tačno ovo:

> **deterministički deskriptor i poređenje; automatsko podudaranje na jedinstvenim identičnim ključevima; inače potvrda jednim klikom; potvrđena veza se čuva.**

- *Deterministički deskriptor*: isti odgovori uvek grade isti string.
- *Determinističko poređenje*: ista dva stringa uvek se porede na isti način, a poređenje nikada ne prijavljuje dva različita stringa kao `identical`.
- *Automatsko podudaranje na jedinstvenim identičnim ključevima*: pod uslovima iz §7.1, i samo pod njima.
- *Inače potvrda jednim klikom*: kratka rangirana lista iz koje osoba bira ili koju odbacuje.
- *Potvrđena veza se čuva*: u `xrefs` (§5.4), tako da se pitanje nikada ne postavlja ponovo.

FXI ne identifikuje vežbu. Dva vlasnika koja opisuju istu vežbu ne pišu uvek isti string: opcione detalje navode različito, a vokabular ne može da kaže sve. Deskriptor sužava pretragu i, u uskom slučaju iz §7.1, okončava je. Implementacija NE SME da predstavi FXI kao identifikator, i NE SME da opiše deskriptore kao identifikaciju.

## 4. Deskriptori

Stranice deskriptora su normativni tekst za sintaksu, kanonski oblik, pravila slojeva, kodove i poređenje. Ovaj RFC ih usvaja onakve kakve su u reviziji pravila 1.4, vrednosti `rules` registara deskriptora i toka pitanja, i ne iskazuje ih ponovo.

| Deskriptor | Stranica | Primer |
|---|---|---|
| FXI | [FXI](/docs/core-concepts/descriptors/fxi), [Tok pitanja](/docs/core-concepts/descriptors/question-flow) | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` |
| FXE | [FXE](/docs/core-concepts/descriptors/fxe) | `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back` |
| FXM | [FXM](/docs/core-concepts/descriptors/fxm) | `FXM=1.0/latissimus-dorsi` |

Poređenje je opisano na stranici [Poređenje, podudaranje i verzionisanje](/docs/core-concepts/descriptors/compare-and-match#compare), a vektori testova na stranici [Usaglašenost](/docs/core-concepts/descriptors/conformance). Ovaj RFC je normativni dom polja zapisa (§5), među njima porekla i markera nedostatka (§5.3), protokola podudaranja (§7) i verzionisanja (§8); stranice za njih upućuju ovde. Vokabulari su registri u `specification/registries/descriptors/`.

### 4.1. Pravila koja ovaj RFC utvrđuje

Navedena su ovde jer je svako od njih odluka za koju bi čitalac inače mogao da očekuje da je doneta suprotno.

1. **Nema heširanog ključa.** Verzija 1 ne definiše heš, kontrolni zbir ni kratak ključ izveden iz deskriptora. Stringovi se porede kao stringovi.
2. **Reč pokreta ne putuje u stringu.** Reč pokreta („čučanj“, „veslanje“) je prečica kroz tok pitanja. Čuva se u zapisu odgovora, gde je razrešivač MOŽE koristiti kao nagoveštaj za rangiranje, i nikada se ne upisuje u FXI.
3. **Generički sloj naspram poznate vrednosti je `refines`.** `*` znači svaka vrednost. String sa poznatom vrednošću tamo gde drugi ima `*` je specifičniji opis iste vežbe, a ne druga vežba.
4. **Odsutni standardni slojevi su vrednosti.** Standardni sloj izostavljen iz stringa dobija svoju objavljenu podrazumevanu vrednost. Podrazumevana vrednost je vrednost: protivreči svakoj drugoj poznatoj vrednosti. To uključuje i imenovane slojeve, zadržani položaj `h` i liniju vuče `p`, čije su podrazumevane vrednosti vrednosti kao i sve druge. Samo `?` i `*` su otvoreni.
5. **Oprema u zapisu vežbe je samo standardna.** FXE zapisa vežbe nosi standardne slojeve; prošireni slojevi detalja konstrukcije pojavljuju se samo na zapisu opreme.

### 4.2. FXI

FXI opisuje kako se vežba izvodi: njen pokret (`m`), orijentaciju tela (`o`), pokretni kraj, rad nogu, oslonac, opterećenje i mesto na kome se opterećenje drži (`l`), simetriju, hvat i stav, obim pokreta, zadržani položaj i liniju vuče, uz prošireni sloj pomagala. `m`, `o` i `l` se uvek pišu; svaki drugi sloj piše se samo kada se razlikuje od svoje podrazumevane vrednosti. Zaglavlje nosi glavnu verziju i reviziju sintakse, i oznaku: `S` kada je svaki napisani sloj standardni, `N` kada je napisan prošireni sloj.

### 4.3. FXE

FXE opisuje komad opreme po njegovoj strukturi: najpre njegovu vrstu, zatim standardne slojeve koje ta vrsta uzima, pa, samo na zapisu opreme, proširene slojeve detalja konstrukcije. Kombinovana sprava spaja standardni FXE svake svoje konfiguracije znakom `;`. Vežba koja ne koristi opremu piše `FXE=1.0S/k:none`.

### 4.4. FXM

FXM je ključ za mišić (`FXM=1.0/<muscle>`), deo mišića (`FXM=1.0/<muscle>.<part>`) ili grupu (`FXM=1.0/g:<group>`).

- **Sidrenje.** Svaki mišić i deo usidren je u Foundational Model of Anatomy (FMA), koji je primaran. Tamo gde UBERON ima termin za istu strukturu, on se nosi kao unakrsna referenca. Tamo gde ontologija nema termin, unos beleži prazninu rečima; sidro se nikada ne pozajmljuje od šire ili uže strukture.
- **Tokeni se izvode iz FMA.** Token mišića je preferirana oznaka njegovog FMA termina, malim slovima, sa uklonjenim rečima „muscle group“, ili inače rečju „muscle“, i sa rečima spojenim pojedinačnim crticama; token dela je kvalifikator u FMA oznaci dela ili glave, reč ispred „part of“ ili „head of“. [Stranica FXM](/docs/core-concepts/descriptors/fxm#anchoring) daje pravilo sa primerima. Provajder MORA da izvede tokene svojih mišića i delova na ovaj način. Dva provajdera koja strukturu usidre u isti FMA termin zato pišu isti ključ, a čitalac razrešava ključ mišića ili dela iz FMA bez provajderovog vokabulara. Šema ne može da proveri izvođenje: proverava format ključa, nikada da je token onaj koji daje njegova FMA oznaka, a to ne može ni jedan vektor usaglašenosti. Provajder koji pogrešno izvede token zato prolazi svaku proveru, i dva provajdera mogu neprimetno da napišu različite ključeve za isti mišić, koje poređenje tada čita kao različite mišiće.
- **Grupe su skupovi članova.** Grupa je definisana FXM ključevima svojih članova, nikada svojim nazivom. Dva ključa koja pokrivaju iste anatomske listove znače isto tkivo, kako god da se zovu. Token grupe je provajderov sopstveni i ne izvodi se: ključ `g:` razrešava se samo kroz vokabular koji ga definiše, a ništa u ključu ne kaže čiji je to vokabular (§12).
- **Nema liste mišića.** FDS objavljuje format ključa, pravila sidrenja i šta grupa znači. Koji mišići, delovi i grupe postoje stvar je provajderovog vokabulara.

### 4.5. Šta provajder obezbeđuje

Provajder koji kodira sopstveni katalog obezbeđuje: svoje zapise, njihove deskriptore i zapise odgovora; opciono skup podataka reči pokreta, koji enkoder učitava, a tok pitanja kaže gde da se koristi; i, za FXM, svoj vokabular mišića sa sidrima i članovima grupa. Bez skupa podataka reči pokreta svaka vežba i dalje može da se kodira, zglob po zglob.

## 5. Polja zapisa

Ovaj odeljak je normativan. Svako polje je opciono. Zapis koji ne nosi nijedno od njih jednako je važeći, i znači tačno ono što je značio, pod verzijama šema koje ovaj RFC objavljuje.

| Polje | Na | Sadrži |
|---|---|---|
| `fxi` | vežba | Kanonski FXI vežbe. |
| `fxe` | vežba | Kanonski **standardni** FXE glavne opreme vežbe. |
| `fxiProvenance` | vežba | Ko je odgovorio za FXI. |
| `fxiGap` | vežba | Vlasnikova beleška o tome šta FXI propušta, ili `null`. |
| `xrefs` | vežba | Veze ka istoj vežbi u drugim katalozima. |
| `fxe` | oprema | Kanonski FXE zapisa opreme, standardni ili sa proširenim slojevima. |
| `fxm` | mišić | Kanonski FXM ključ zapisa mišića. |
| `fxe` | svaki `equipmentRef` u vežbi | Standardni FXE tog komada opreme. |
| `fxm` | svaki `muscleRef` u vežbi | FXM ključ tog mišića. |

Polja na nivou zapisa stoje na najvišem nivou zapisa, uz `classification`, a polja referenci na samoj referenci; nikada pod `extensions` ili `attributes`. Deo su standarda, i konzument ih čita bez poznavanja imenskog prostora bilo kog proizvođača.

### 5.1. Stringovi deskriptora

Proizvođač podataka MORA da napiše svaki deskriptor u kanonskom obliku. Šema proverava samo omotač: zaglavlje (`FXI=`, `FXE=` ili `FXM=`, glavna verzija 1, zatim revizija sintakse bez vodećih nula), oznaku tamo gde je deskriptor ima i telo bez belina; za FXM, čija je gramatika ključ, ceo ključ. Ne proverava gramatiku FXI i FXE ni bilo koji kod; to pripada registrima, a testira ih nivo sintakse vektora usaglašenosti. Konzument MORA da validira deskriptor prema registrima pre nego što ga uporedi, i MORA da tretira nevažeći kao odsutan.

Šema prihvata samo glavnu verziju 1. Nova glavna verzija deskriptora je nova glavna verzija njegove gramatike, i za njeno nošenje bila bi potrebna nova verzija šeme.

`fxe` vežbe i `fxe` na njenim referencama opreme uvek su standardni (oznaka `S`). `fxe` zapisa opreme MOŽE da nosi proširene slojeve (oznaka `N`).

### 5.2. `fxe` na vežbi i na njenim referencama opreme

Odgovaraju na različita pitanja. `fxe` na nivou zapisa imenuje **glavnu opremu** vežbe, izabranu pravilom glavne opreme sa stranice FXE; to je ono što protokol podudaranja poredi (§7.2). `fxe` na `equipmentRef` opisuje tu jednu navedenu stavku. Konzument NE SME da zaključuje koja je stavka glavna iz redosleda u `equipment.required`.

### 5.3. `fxiProvenance` i `fxiGap` {#53-fxiprovenance-and-fxigap}

`fxiProvenance` je jedno od:

| Vrednost | Značenje |
|---|---|
| `owner` | Vlasnik je odgovorio na tok pitanja. |
| `owner-assisted` | Neko drugi, ili softver, predložio je odgovore, a vlasnik ih je potvrdio. |
| `agent` | Neko drugi, ili softver, odgovorio je, a vlasnik nije potvrdio. |
| `import` | Izgrađeno iz reda drugog kataloga u režimu uvoza. Režim uvoza uvek piše `import`, i to čini samo režim uvoza. |

Odsutno `fxiProvenance` je nepoznato i tretira se kao `agent`: zapis nikada ne kvalifikuje za automatsko podudaranje.

`fxiGap` je vlasnikova beleška u običnom tekstu da notacija propušta nešto što ovu vežbu razlikuje od drugih. `null`, ili potpuno odsustvo `fxiGap`, iskazuje da takvog nedostatka nema; šema ne prihvata prazan string, pa pišite `null`. Svaka prisutna beleška je marker nedostatka, uključujući i belešku koja se sastoji samo od belina: blokira automatsko podudaranje (§7.1) i predstavlja dokaz na koji se oslanja kasnija revizija pravila. Razrešivač tretira kao marker nedostatka svaki `fxiGap` osim odsutnog i `null`, uključujući i prazan string, tako da neočekivana vrednost nikada ne omogućava automatsko podudaranje. Zapis nikada ne nosi `false`, koji šema ne prihvata; razrešivač koji prima i redove koji nisu FDS zapisi, kao što to čine vektori usaglašenosti, tamo čita `false` kao odsustvo markera nedostatka, a `true` kao marker. Preskripcija nikada nije nedostatak: pauza, tempo ili opterećenje pripadaju RFC-006, a ne vežbi.

Nijedno od ova dva polja ne znači ništa bez FXI, i šema odbacuje bilo koje od njih na zapisu koji nema `fxi`.

### 5.4. `xrefs`

`xrefs` sadrži veze između ove vežbe i zapisa koji opisuju istu vežbu u drugim katalozima. Svaki unos je objekat sa tri obavezna člana:

| Član | Sadrži |
|---|---|
| `system` | Katalog kome povezani zapis pripada. Koristite isto imenovanje kao u `metadata.externalRefs[].system`. |
| `id` | Identifikator povezanog zapisa u tom katalogu. |
| `link` | Kako je veza napravljena: `auto`, od strane razrešivača prema §7.1; ili `confirmed`, od strane osobe koja ju je izabrala sa liste za potvrdu ili je direktno navela. |

Zapis TREBALO BI da nosi najviše jedan unos po paru `system` i `id`.

**Primljene veze su nagoveštaji, a ne autoritet.** `xrefs` na zapisu koji stiže iz drugog kataloga su tvrdnje njegovog pošiljaoca: unos `auto` napravio je razrešivač pošiljaoca, a unos `confirmed` osoba koju primalac ne poznaje. Konzument MOŽE da koristi takav unos kao nagoveštaj, na primer da zapis koji on imenuje stavi prvi na listu za potvrdu. NE SME da sačuva primljeni unos kao sopstvenu vezu, niti da na osnovu njega sprovede automatsko podudaranje, a da sam ne izvrši protokol podudaranja (§7).

**Zašto ne `metadata.externalRefs`.** Ta dva izgledaju slično i namerno su držana odvojeno.

- `externalRefs` navodi sopstvene identifikatore ovog zapisa u drugim sistemima: odakle je uvezen, gde je preslikan. Beleži identitet i ne govori ništa o tome kako je on utvrđen.
- `xrefs` beleži **odluku** da zapisi dva različita kataloga opisuju istu vežbu, i kako je ta odluka doneta. Konzument mora da može da razlikuje vezu koju je napravio razrešivač od veze koju je potvrdila osoba, a `externalRefs` nema mesto na kome bi to rekao.
- `externalRefs` je deo `metadata`, koji dele svi entiteti i koji zatvara `additionalProperties`. Dodavanje člana `link` njemu značilo bi novu verziju svakog entiteta u standardu, zbog razlike koja je danas potrebna samo entitetu vežbe.

`xrefs` zato ponovo koristi oblik `{system, id}`, tako da čitalac uči jedan par, i dodaje `link`.

### 5.5. Šta ovo izdanje još ne nosi

U ovom izdanju `equipmentRef` dobija `fxe`, a `muscleRef` dobija `fxm`, i nose ih samo unutar entiteta vežbe, opreme i mišića koje ovo izdanje pomera. `exerciseRef` sada ne dobija `fxi`: pojavljuje se samo u treningu i programu, čije su objavljene verzije zamrznute i ovde nisu pomerene. Trening i program takođe ugrađuju `equipmentRef` i `muscleRef`, a biblioteka preskripcije ugrađuje `equipmentRef`, pa ni njihove reference još ne mogu da nose deskriptor. `fxi` na `exerciseRef`, kao i `fxe` i `fxm` na referencama unutar treninga, programa i biblioteke preskripcije, pripremljeni su za sledeću verziju svake od tih šema (§12).

## 6. Poređenje

Poređenje uzima dva FXI, ili dva FXE, i vraća `identical`, `refines`, `refined-by`, `compatible`, `contradicting` ili `invalid`, ukupno i po sloju. FXM ključevi se porede kao `identical`, `contains`, `overlaps` ili `disjoint`, prema anatomskim listovima koje svaki od njih pokriva. Pravila su na stranici [Poređenje, podudaranje i verzionisanje](/docs/core-concepts/descriptors/compare-and-match#compare). FXM ključ `g:` može da se poredi samo kada su pri ruci vokabulari oba provajdera, jer njegovi listovi dolaze iz vokabulara koji ga definiše. Poređenje čita samo stringove: nikada naziv, nikada reč pokreta. Nije tranzitivno, i konzument MORA da deduplikuje samo na osnovu `identical`.

## 7. Protokol podudaranja {#7-match-protocol}

Ovaj odeljak je normativan. Razrešivač traži podudaranje za jedan zapis, **upit**, u biblioteci.

### 7.1. Automatsko podudaranje

Razrešivač MOŽE da poveže upit sa zapisom iz biblioteke bez pitanja osobe samo kada važi sve od sledećeg:

1. tačno jedan zapis iz biblioteke ima FXI koji se sa FXI upita poredi kao `identical`;
2. ni upit ni taj zapis ne nose marker nedostatka (§5.3);
3. oba imaju `fxiProvenance` `owner` ili `owner-assisted`;
4. nijedan nije izgrađen u režimu uvoza (§7.4). Tamo gde red navodi režim u kome je izgrađen, kao što to čine zapis odgovora ili izlazni red enkodera, red iz režima uvoza nikada se ne podudara automatski, šta god da kaže njegov `fxiProvenance`;
5. kada oba nose FXE (§5.2), dva FXE se porede kao `identical` (§6). FXE koji samo precizira drugi, ili sadrži `?`, nije identičan. Zapis bez FXE prepušta ovaj uslov FXI-ju. Dve mašine koje se razlikuju samo tamo gde FXI ne gleda, kao što su veslanje u sedu na sajli sa osloncem za stopala i mašina za veslanje sa osloncem za grudi, mogu dati isti FXI; nikada se ne podudaraju automatski na osnovu njega.

Veza se čuva u `xrefs` upita sa `link: "auto"`. U svakom drugom slučaju razrešivač NE SME da poveže zapise bez osobe. Tamo gde red navodi svoj režim, razrešivač MORA da odbije red čiji mu `fxiProvenance` protivreči (red iz režima uvoza sa bilo kojim poreklom osim `import`, ili `import` van režima uvoza) umesto da za njega traži podudaranje.

### 7.2. Potvrda

Inače razrešivač nudi listu za potvrdu: najviše tri zapisa iz biblioteke, svaki najviše jednom, sa razlogom zbog kog je automatsko podudaranje odbijeno. Lista se popunjava u tri koraka, a svaki zapis zauzima prvo mesto za koje se kvalifikuje:

1. **FXI kandidati**, po relaciji: `identical`, zatim `refines` ili `refined-by`, zatim `compatible`. Unutar jedne relacije: prvo više standardnih slojeva koji su `equal`; zatim, kada oba zapisa nose FXE, identičan FXE pre precizirajućeg, a precizirajući pre bilo kog drugog; zatim sličnost naziva; zatim redosled u biblioteci.
2. **Skoro kompatibilni**: zapisi koji protivreče upitu u tačno jednom standardnom sloju, koji lista imenuje. Po sličnosti naziva, zatim po redosledu u biblioteci.
3. **Kandidati po nazivu**: ostali, po sličnosti naziva, zatim po redosledu u biblioteci.

Veza koju osoba izabere čuva se u `xrefs` upita sa `link: "confirmed"`. Način bodovanja sličnosti naziva je izbor implementacije; vektori usaglašenosti rangiraju po nazivu samo tamo gde se svako razumno bodovanje slaže.

### 7.3. Odsutno

Rezultat je odsutan samo kada je biblioteka prazna. Biblioteka sa zapisima uvek nudi listu.

### 7.4. Režim uvoza

Deskriptor izgrađen u režimu uvoza služi samo za pretragu kandidata. MOŽE da stavi zapise na listu za potvrdu. NE SME da učestvuje u automatskom podudaranju ni na jednoj strani, a ovaj standard ne iznosi nikakvu tvrdnju o njegovoj tačnosti.

## 8. Verzionisanje {#8-versioning}

### 8.1. Deskriptori

- **Dva broja, držana odvojeno.** Zaglavlje stringa nosi glavnu verziju i reviziju sintakse; revizija sintakse se pomera samo kada se pomeri gramatika. Revizija pravila je revizija vokabulara i pravila slojeva, i ne upisuje se u string.
- **Samo preciziranje, unutar glavne verzije.** Revizija pravila može da doda kod, da podeli kod na podkodove koje njegov stari kod tada pokriva, da doda sloj koji stariji stringovi čitaju kao `?`, da doda unos u tabelu tamo gde je staro tumačenje bilo `?`, ili da dodeli objavljenu podrazumevanu vrednost sloju čije je odsustvo bilo otvoreno. Nikada ne uklanja kod, nikada ne menja šta kod znači i nikada ne menja postojeću podrazumevanu vrednost. Svaki string važeći pod jednom revizijom pravila ostaje važeći pod sledećom, a dva stringa koja su bila `identical` ostaju `identical`.
- **Podrazumevane vrednosti su zauvek.** String koji sloj ostavlja na podrazumevanoj vrednosti znači isto pod svakom kasnijom revizijom pravila svoje glavne verzije.
- **Jedna revizija pravila po izdanju.** Izdanje standarda nosi najviše jednu novu reviziju pravila, a svaka nova odluka u njoj počiva na najmanje dva neuspešna slučaja iz najmanje dva kataloga.
- **Odgovori se čuvaju.** Proizvođač podataka TREBALO BI da čuva zapis odgovora za svaki zapis: ID-jeve pitanja i izabrane opcije, reč pokreta i skup podataka reči pokreta iz kog je došla, ako postoji, poreklo i marker nedostatka. Kada revizija pravila precizira tumačenje, nadogradnja ponovo gradi svaki string iz njegovih sačuvanih odgovora umesto da bilo koga ponovo pita. String bez sačuvanih odgovora ostaje važeći onako kako je napisan.

### 8.2. Šeme

Izdanje **1.6.0** nosi polja iz §5. Pomera vežbu i opremu na 1.2.0, a mišić na 1.1.0; svaki drugi entitet, kao i biblioteka preskripcije, ostaje tamo gde ga je imenovalo izdanje 1.5.0. Svaka izmena je opciono dodavanje, pa je svaki dokument važeći pod prethodnim verzijama važeći i pod novim, a zamenjene verzije ostaju objavljene i zamrznute.

Izdanje 1.6.0 predloženo je uz ovaj RFC i ne objavljuje se dok je RFC nacrt. Izmena koja prihvata ovaj RFC zamrzava vežbu 1.2.0, opremu 1.2.0 i mišić 1.1.0 i datira unos tog izdanja u istoriji izmena, u jednom spajanju. Do tada se sajt i paketi ne objavljuju iz stabla čije je tekuće izdanje nezamrznuto ili nedatirano.

## 9. Dokazi {#9-evidence}

Vektori usaglašenosti kažu da li implementacija izračunava ono što ova specifikacija kaže. Ne mogu da kažu da li ljudi i programi opisuju vežbe dovoljno dobro da bi protokol podudaranja bio koristan. To se meri, i ovde se objavljuje kao merenja, a ne kao prolaz ili pad.

### 9.1. Metod

- **Enkoderi.** Dva enkodera, oba softverski agenti, nezavisno su kodirala biblioteku i upite, bez uvida u izlaz onog drugog. Radila su u režimu vlasnika, kao zamene za vlasnike kataloga, pa su njihovi redovi nosili vlasničko poreklo i mogli su automatski da se podudare: brojke automatskog podudaranja u nastavku simuliraju vlasnike koji kodiraju sopstvene kataloge. Kalibracija u kojoj kodiraju ljudi je na čekanju (§9.4).
- **Upiti.** Upiti svakog testa podeljeni su u delove, nijedan sa nazivom zajedničkim sa bibliotekom sa kojom se upoređuje: redovi napisani na drugim jezicima, stvarni redovi koji nisu na engleskom iz kataloga trećih strana, teretanski žargon i preimenovane vežbe. **Stvarni delovi** su poslednja tri. Za većinu upita vežba postoji u biblioteci. Za odsutan upit svaki tačan odgovor uklanja se iz biblioteke samo za taj upit, a zadržava se bliska varijanta. Brojevi za svaki test navedeni su uz njega (§9.2).
- **Biblioteka.** Istih 774 reda u svakom testu.
- **Izvršavanja.** Unakrsno po enkoderima: upiti koje je izgradio jedan enkoder upoređivani su sa bibliotekom koju je izgradio drugi, i obrnuto. Svaka brojka je srednja vrednost dva izvršavanja.
- **Razrešivač.** Protokol podudaranja iz §7, onako kako ga implementira referentni enkoder, fiksiran pre nego što su upiti kodirani.
- **Mere.** *Odziv u prva 3* je udeo upita čija vežba postoji u biblioteci, a čiji je pravi zapis povezan automatski ili naveden među prva tri na listi za potvrdu; njegov imenilac su upiti čija vežba postoji u biblioteci. *Pogrešna automatska podudaranja* su udeo svih bodovanih upita, bez obzira na to da li im vežba postoji u biblioteci, koji su automatski povezani sa pogrešnim zapisom; odsutan upit povezan sa bilo čim je pogrešan.
- **Intervali.** Uglaste zagrade daju 95% Vilsonove intervale (Wilson score). Za srednju vrednost dva izvršavanja, interval koristi objedinjenu stopu i imenilac jednog izvršavanja.
- **Podaci.** Upiti, biblioteke i kodirani redovi ostaju kod provajdera koji je sproveo test, jer sadrže tekst kataloga trećih strana. Metod i program za bodovanje opisani su ovde kako bi test mogao da se ponovi na drugom skupu.

### 9.2. Testovi sa disjunktnim nazivima {#92-name-disjoint-tests}

#### Ponovljeni test po reviziji pravila 1.3 {#re-test-under-rules-revision-13}

624 bodovana upita u šest delova: redovi napisani na francuskom, na italijanskom i na portugalskom, stvarni redovi koji nisu na engleskom, teretanski žargon i preimenovane vežbe. Za 496 njihova vežba postoji u biblioteci, a za 128 ne postoji. Stvarni delovi sadrže 174 upita: 136 u biblioteci i 38 odsutnih. Test je izvršen 2026-11-24, po reviziji pravila 1.3, pre nego što je §7.1 zahtevao identične FXE.

| Mera | Svi delovi (624) | Samo stvarni delovi (174) |
|---|---|---|
| Odziv u prva 3: pravi zapis je povezan ili je na listi za potvrdu | 98,4% [96,8–99,2] | 96,3% [91,7–98,4] |
| Pogrešna automatska podudaranja | 2,1% [1,2–3,5] | 3,4% [1,6–7,3] |

Na istom skupu, podudaranje po nazivu uz prevođenje dostiglo je odziv u prva 3 od 88,3% kada je ispod fiksnog praga sličnosti odgovaralo da je rezultat odsutan, i 93,3% kada je uvek nudilo listu, uz 1,1% pogrešnih automatskih podudaranja.

#### Treći test po reviziji pravila 1.4 {#third-test-under-rules-revision-14}

Nov skup: nijedan upit niti nebodovani red za popunu iz ranijih testova nije ponovo upotrebljen. Izvršen je 2026-11-24, po reviziji pravila 1.4, sa zamrznutom kopijom alata za kodiranje i podudaranje i sa uslovom 5 iz §7.1 na snazi. Razrešivač i pravila bodovanja zapisani su pre nego što je izračunat ijedan rezultat. Referentna istina je sud jednog čitaoca o svakom upitu, prema pisanom testu o tome šta dva reda čini istom vežbom, a drugi, nezavisni čitalac naslepo je proverio uzorak. Oba čitaoca su softverski agenti; nijedna osoba nije proverila referentnu istinu.

| Deo | Bodovano | U biblioteci | Odsutno |
|---|---|---|---|
| Napisano na holandskom | 150 | 120 | 30 |
| Napisano na poljskom | 150 | 120 | 30 |
| Napisano na turskom | 150 | 120 | 30 |
| Stvarni redovi koji nisu na engleskom (nemački, španski, francuski, portugalski, turski, poljski, holandski) | 138 | 111 | 27 |
| Teretanski žargon | 2 | 2 | 0 |
| Preimenovane vežbe | 5 | 4 | 1 |
| **Svi** | **595** | **477** | **118** |

Stvarni delovi sadrže 145 upita: 117 u biblioteci i 28 odsutnih. Još 81 stvarni red umešan je u ulaz enkodera i nigde nije bodovan.

| Mera | Svi upiti (595) | Samo stvarni delovi (145) |
|---|---|---|
| Odziv u prva 3 | 98,8% [97,4–99,5] | 97,4% [92,7–99,1] |
| Pogrešna automatska podudaranja | 1,4% [0,7–2,7] | 1,7% [0,5–5,4] |

- **Upiti svakog enkodera prema njegovoj sopstvenoj biblioteci.** Na svim upitima: pogrešna automatska podudaranja 1,3% [0,7–2,6] i 1,8% [1,0–3,3], odziv u prva 3 98,7% [97,3–99,4] i 99,0% [97,6–99,6]. Na stvarnim delovima: pogrešna automatska podudaranja 1,4% [0,4–4,9] i 2,1% [0,7–5,9], odziv u prva 3 96,6% [91,5–98,7] i 98,3% [94,0–99,5].
- **Nazivi uz prevođenje.** Na svim upitima, odziv u prva 3 od 83,2% sa pragom sličnosti i 93,3% bez njega, uz 0,8% pogrešnih automatskih podudaranja. Na stvarnim delovima 66,7% i 82,1%, uz 1,4% pogrešnih automatskih podudaranja. Na poljskom delu, koji je preveo gotovo svaki naziv, deskriptori su dostigli odziv u prva 3 od 100% uz 0,7% pogrešnih automatskih podudaranja; nazivi uz prevođenje dostigli su 80,8% i 92,5%.
- **Drugo mišljenje.** Od 290 proverenih parova, 268 je bilo odlučeno; drugi čitalac se složio u 95,1% [91,9–97,1] njih.
- **Greške.** U dva unakrsna izvršavanja po enkoderima, 17 pogrešnih automatskih podudaranja i 8 promašaja prva 3, na 21 upitu, pročitanih jedan po jedan:

  | Uzrok | Pogrešno automatsko podudaranje | Promašaj prva 3 |
  |---|---|---|
  | Dva enkodera su istu informaciju kodirala različito | 7 | 1 |
  | Red biblioteke koji se sudara izgleda kao tačan odgovor koji je referentna istina propustila | 8 | 0 |
  | Tačan odgovor rangiran je četvrti ili niže na listi za potvrdu | 0 | 6 |
  | Notacija nema kod za razliku | 2 | 0 |
  | Detalj naveden samo na jednoj strani | 0 | 1 |

  14 od 17 pogrešnih automatskih podudaranja su odsutni upiti: test uklanja tačan odgovor, a drugi red biblioteke sa istim ključem preuzima vezu.

**Slabosti.**

- **Ponovna upotreba.** 128 od 145 stvarnih upita su red na drugom jeziku vežbe koju je raniji test koristio kao upit, uglavnom prevedeni sa istog izvornog teksta. Preostalih 17 dostižu odziv u prva 3 od 90,0% [66,0–97,7] bez ijednog pogrešnog automatskog podudaranja, što je premalo za čitanje.
- **Novi stvarni skup je iscrpljen.** Od još 81 vežbe trećih strana pročitane u celosti, 14 je dalo upit. Još jedan nov stvarni skup ove veličine nije dostupan.
- **Nazivi zadržani na engleskom.** Holandski autor zadržao je engleski teretanski naziv u otprilike polovini redova, a turski u otprilike trećini, pa su ta dva dela slabiji testovi disjunktnosti naziva od poljskog.
- **Udeo napisanih redova.** 450 od 595 upita su napisani redovi, a napisani redovi su čistiji od stvarnih. Prolaz na svim upitima oslanja se na njih.
- **Referentna istina.** 8 od 17 pogrešnih automatskih podudaranja povezuje odsutan upit sa redom biblioteke koji, kada se pročita, izgleda kao tačan odgovor koji je referentna istina propustila. To čitanje je izvršeno posle rezultata, pa ih ne menja: kada bi važilo, pogrešna automatska podudaranja bila bi 0,8% na svim upitima i 1,0% na stvarnim delovima.
- **Rangiranje liste za potvrdu.** Četiri od šest promašaja rangiranja su veslanja u sedu sa V-drškom, sva u istom unakrsnom izvršavanju. Veslanje piše `sh.ext`, koji pokriva povlačenje iznad glave `sh.ext.oh`, pa dva povlačenja naniže sa V-drškom preciziraju njegov pokret i ulaze na listu ispred tačnog odgovora, pored veslanja sa podignutog sedišta sa identičnim ključem. Tačan odgovor, čiji string u biblioteci izostavlja usku širinu hvata koju upit navodi, rangiran je četvrti. Još ništa ne razdvaja horizontalno povlačenje od povlačenja iznad glave kada jedna strana piše samo `sh.ext`.
- **Verzija alata.** Alat je zamrznut pre dve kasnije ispravke u 1.4: kanonskog oblika koji izostavlja roditelja napisanog pored svog deteta, i slama sa battle rope konopcem, koji ne dobija `^`. Nijedan string iz testa nije napisao roditelja pored deteta. Nekoliko je napisalo `^` za slam sa battle rope konopcem; nijedan od njih nije među greškama.

### 9.3. Razdvajanje i slaganje {#93-separation-and-agreement}

- **Razdvajanje bliskih varijanti**: na 98 sastavljenih parova vežbi koje se razlikuju u jednom detalju, deskriptori su razdvojili 98,0% parova.
- **Slaganje enkodera**: dva enkodera koja kodiraju isti stvarni red napisala su isti ceo string u otprilike 78% do 95% redova, u zavisnosti od skupa.

### 9.4. Na čekanju

- **Kalibracija u kojoj kodiraju ljudi**: vlasnici naspram enkodera, na istim redovima. *Na čekanju — još nije izmereno.*

### 9.5. Kapija izdanja

RFC-010 se prihvata tek kada test sproveden onako kako ga opisuje §9.1, na novom skupu upita sa disjunktnim nazivima koji nijedan raniji test nije koristio, sa unakrsnim izvršavanjima po enkoderima, ispuni oba uslova na svim bodovanim upitima:

- pogrešna automatska podudaranja **najviše 2%**;
- odziv u prva 3 **najmanje 98%**.

Kapija se očitava na tačkastoj proceni. Intervali se navode uz nju, kako bi čitalac video koliko bi rezultat mogao da se pomeri.

Stvarni delovi navode se sa svojim 95% Vilsonovim intervalima i ne podležu kapiji: oko 117 stvarnih upita u biblioteci ne može da očita prag od 98% ni u jednom smeru, a slobodno dostupni stvarni podaci koji bi bili potrebni za veći skup su iscrpljeni.

**Treći test dostiže kapiju** (§9.2): na svih 595 bodovanih upita, pogrešna automatska podudaranja su 1,4% [0,7–2,7], a odziv u prva 3 je 98,8% [97,4–99,5]. Oba intervala obuhvataju prag, pa test prolazi kapiju a da je ne potvrđuje. Na stvarnim delovima, koji se navode i ne podležu kapiji, pogrešna automatska podudaranja su 1,7% [0,5–5,4], a odziv u prva 3 je 97,4% [92,7–99,1]. Ponovljeni test po reviziji pravila 1.3 promašio je kapiju, sa 2,1% pogrešnih automatskih podudaranja na svim delovima.

## 10. Smernice za implementaciju

### 10.1. Proizvođači podataka

- Kodirajte kroz tok pitanja i čuvajte zapis odgovora uz svaki string.
- Pišite `fxiProvenance` istinito. Softver koji predlaže odgovore piše `agent` dok vlasnik ne potvrdi, a zatim `owner-assisted`. Nikada ne pišite `owner` za odgovore koje vlasnik nije dao.
- Pišite `fxiGap` kad god vokabular ne može da izrazi razliku koja je bitna. To košta jedno automatsko podudaranje, a donosi bolju reviziju pravila.
- Na vežbi pišite `fxe` na nivou zapisa za glavnu opremu čak i kada ga nose i reference opreme.

### 10.2. Konzumenti

- Validirajte svaki deskriptor prema registrima pre upotrebe. Nevažeći tretirajte kao odsutan.
- `xrefs` koje primljeni zapis nosi tretirajte kao nagoveštaje pošiljaoca (§5.4). Sami izvršite protokol podudaranja pre nego što sačuvate sopstvenu vezu.
- Ne tretirajte dva FXI koji su `compatible` ili `refines` kao istu vežbu; to potvrđuje samo osoba.

### 10.3. Razrešivači

- Pratite §7 tačno. Automatsko podudaranje van §7.1 je neusaglašeno, ma koliko razrešivač bio siguran.
- Prikažite razlog odbijanja automatskog podudaranja uz listu za potvrdu.
- Čuvajte svaku potvrđenu vezu.

## 11. Razmatranja bezbednosti i privatnosti

Deskriptor opisuje vežbu, komad opreme ili mišić. Ne opisuje nijednu osobu, i nijedno od polja koja ovaj RFC dodaje ne može da sadrži ličnu vrednost: vlasnik u `fxiProvenance` je katalog, a `xrefs` povezuje zapise kataloga sa zapisima kataloga. Dokument koji nosi ova polja može da se objavljuje, kešira, preslikava i poredi tačno kao ranije.

`fxiGap` je slobodan tekst koji piše vlasnik kataloga. Konzumenti TREBALO BI da ga tretiraju kao nepouzdan tekst, kao što tretiraju svaki opis.

Unos `xrefs` na primljenom zapisu je tvrdnja pošiljaoca, bilo da je `auto` ili `confirmed`: pogrešna veza, napravljena greškom ili namerno, inače bi se proširila iz jednog kataloga na svaki katalog koji je kopira. §5.4 zato primljene veze čini nagoveštajima, i samo se veza koju napravi primaočev sopstveni razrešivač ili osoba čuva kao primaočeva.

## 12. Otvorena pitanja {#12-open-items}

**Uslovi za prihvatanje.** RFC-010 ostaje nacrt dok svaki od ovih uslova ne bude ispunjen:

1. **Automatsko podudaranje zahteva i podudaranje opreme.** Kada oba zapisa nose FXE, automatsko podudaranje zahteva da budu `identical`. Ispunjeno: §7.1, uslov 5. Ponovljeni test iz §9.2 izmeren je bez toga, a treći test sa tim.
2. **Jedna revizija pravila zatvara zabeležene nedostatke notacije.** Markeri nedostatka i protivrečnosti zabeleženi do sada razrešavaju se u jednoj reviziji pravila, prema pravilima preciziranja iz §8.1. Ispunjeno: revizija pravila 1.4 (§4).
3. **Novi test sa disjunktnim nazivima prolazi kapiju izdanja** iz §9.5, na upitima koje nijedan raniji test nije koristio, po reviziji pravila 1.4. Ispunjeno: treći test iz §9.2.

Svi uslovi su ispunjeni. Prihvatanje sada čeka samo period razmatranja iz Procesa odlučivanja u Upravljanju i odluku urednika.

**Pripremljeno.** `exerciseRef` nosi `fxi`, a reference unutar treninga, programa i biblioteke preskripcije nose `fxe` i `fxm`, počev od sledeće verzije svake od tih šema (§5.5).

**Otvoreno.**

1. **Čiju grupu imenuje FXM ključ.** Ključ mišića ili dela izvodi se iz FMA i znači isto u svakom vokabularu (§4.4). Ključ `g:` ne: razrešava se samo kroz vokabular provajdera koji ga je definisao, a ni ključ ni zapis ne imenuju taj vokabular. Nije odlučeno kako zapis ili dokument kaže iz kog vokabulara potiču njegovi ključevi grupa.
2. **Oblici razmene.** Gde provajder objavljuje svoj FXM vokabular, sa oblikom unosa vokabulara; i zapis odgovora. Ulaz `--muscles` referentnog enkodera i zapis odgovora na stranici toka pitanja su radni oblici.

**Namerno neodlučeno.** Granica između otvorenog enkodera i provajderovog servisa za podudaranje, i da li se mehanika, sila ili obrazac izvode iz ključa (§1.3).

## 13. Referenca JSON šeme

- **Vežba**: `https://spec.vitness.me/schemas/exercises/v1.2.0/exercise.schema.json`
- **Oprema**: `https://spec.vitness.me/schemas/equipment/v1.2.0/equipment.schema.json`
- **Mišić**: `https://spec.vitness.me/schemas/muscle/v1.1.0/muscle.schema.json`
- **Zajedničke definicije**: zajednička šema, verzija 1.1.0, definiše `fxi`, `fxe`, `fxeStandard` (FXE samo sa standardnim slojevima, koji nose vežba i referenca opreme), `fxm`, `fxiProvenance` i `xref`; proces izgradnje ih kopira u šemu svakog entiteta.
- **Registri**: `specification/registries/descriptors/fxi.registry.json` i `fxe.registry.json`
- **Vektori usaglašenosti**: `specification/descriptors/conformance/`

### 13.1. Validacija

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.2.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.2.0/exercise.example.descriptors.json
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/equipment/v1.2.0/equipment.schema.json \
  -d specification/schemas/equipment/v1.2.0/equipment.example.descriptors.json
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/muscle/v1.1.0/muscle.schema.json \
  -d specification/schemas/muscle/v1.1.0/muscle.example.descriptors.json
```

## 14. Primeri

Vežba koju je kodirao njen vlasnik, sa jednom vezom koju je napravio razrešivač i jednom koju je potvrdila osoba. Šipka i kvadriceps nose svoje deskriptore; stalak i opružač kičme ne nose, jer je svako polje opciono.

```json
{
  "schemaVersion": "1.2.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440010",
  "canonical": { "name": "Back Squat", "slug": "back-squat" },
  "classification": {
    "exerciseType": "strength",
    "movement": "squat",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate"
  },
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "name": "Quadriceps", "categoryId": "cat.legs", "fxm": "FXM=1.0/quadriceps-femoris" }
    ],
    "secondary": [
      { "id": "mus.erectorSpinae", "name": "Erector Spinae", "categoryId": "cat.back" }
    ]
  },
  "equipment": {
    "required": [
      { "id": "eq.barbell", "name": "Barbell", "fxe": "FXE=1.0S/k:imp/f:bar.straight" },
      { "id": "eq.rack", "name": "Power Rack" }
    ]
  },
  "fxi": "FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back",
  "fxe": "FXE=1.0S/k:imp/f:bar.straight",
  "fxiProvenance": "owner",
  "fxiGap": null,
  "xrefs": [
    { "system": "example-catalog", "id": "vx-0001", "link": "auto" },
    { "system": "partner-gym", "id": "squat-back-bb", "link": "confirmed" }
  ],
  "metrics": { "primary": { "type": "reps", "unit": "count" } },
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "active"
  }
}
```

Vežba izgrađena u režimu uvoza iz reda drugog kataloga, pre nego što je njen vlasnik bilo šta odgovorio. Može da stavi zapise na listu za potvrdu i nikada se ne podudara automatski. Ne nosi marker nedostatka, jer ga piše samo vlasnik.

```json
{
  "schemaVersion": "1.2.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440011",
  "canonical": { "name": "Seated Cable Row", "slug": "seated-cable-row" },
  "classification": {
    "exerciseType": "strength",
    "movement": "pull-horizontal",
    "mechanics": "compound",
    "force": "pull",
    "level": "beginner"
  },
  "targets": {
    "primary": [
      { "id": "mus.lats", "name": "Latissimus Dorsi", "categoryId": "cat.back", "fxm": "FXM=1.0/latissimus-dorsi" }
    ]
  },
  "fxi": "FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne",
  "fxe": "FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back",
  "fxiProvenance": "import",
  "metrics": { "primary": { "type": "reps", "unit": "count" } },
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "draft"
  }
}
```

Zapis opreme, sa proširenim slojevima koje nosi samo zapis opreme, i zapis mišića:

```json fds:document entity=equipment
{
  "schemaVersion": "1.2.0",
  "id": "eq.seated-row-machine",
  "canonical": { "name": "Seated Row Machine", "slug": "seated-row-machine" },
  "fxe": "FXE=1.0N/k:mac/l:hand/s:seat/m:pull.back/r:stack/c:cable",
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "active"
  }
}
```

```json fds:document entity=muscle
{
  "schemaVersion": "1.1.0",
  "id": "mus.lats",
  "canonical": { "name": "Latissimus Dorsi", "slug": "latissimus-dorsi" },
  "classification": { "categoryId": "cat.back", "region": "upper-back", "laterality": "bilateral" },
  "fxm": "FXM=1.0/latissimus-dorsi",
  "metadata": {
    "createdAt": "2026-11-24T00:00:00Z",
    "updatedAt": "2026-11-24T00:00:00Z",
    "status": "active"
  }
}
```

Zapisi odgovora i njihov oblik razmene prikazani su na stranici [toka pitanja](/docs/core-concepts/descriptors/question-flow).

## Usaglašenost {#conformance}

**Usaglašen proizvođač podataka:**

:::danger MORA
- **MORA** da napiše svaki deskriptor u kanonskom obliku, u polju koje mu §5 definiše: polje na nivou zapisa na najvišem nivou zapisa, polje reference na referenci.
- **MORA** da napiše `fxiProvenance` onako kako se dogodilo, i `import` za svaki deskriptor izgrađen u režimu uvoza.
- **MORA** da izvede tokene FXM mišića i delova iz njihovih FMA oznaka (§4.4). Ni šema ni vektori usaglašenosti to ne mogu da provere, pa se pogrešno izveden token vidi samo kao ključevi dva provajdera koji se ne slažu za isti mišić.
- **NE SME** da predstavi deskriptor kao identifikator, niti da opiše deskriptore kao identifikaciju (§3).
- Proizvođač podataka koji gradi deskriptore iz zapisa odgovora **MORA** da prođe nivoe `syntax` i `builder` vektora usaglašenosti sa 100%.
:::

**Usaglašen razrešivač:**

:::danger MORA
- **MORA** da prođe nivoe `syntax`, `compare` i `resolver` vektora usaglašenosti sa 100%. Nivo `builder` se od razrešivača ne zahteva.
- **MORA** da sprovodi automatsko podudaranje samo prema §7.1, i da svaku vezu koju napravi ili koju potvrdi osoba sačuva u `xrefs` sa ispravnim `link`.
- **NE SME** da sprovodi automatsko podudaranje na osnovu deskriptora izgrađenog u režimu uvoza, i **MORA** da odbije red čije poreklo protivreči njegovom režimu (§7.1).
- **MORA** da ponudi listu za potvrdu za svaki upit prema nepraznoj biblioteci koji ne poveže automatski.
:::

**Usaglašen konzument:**

:::danger MORA
- **MORA** da prihvati zapis koji ne nosi nijedno od ovih polja, kao i zapis koji nosi bilo koje od njih.
- **MORA** da validira deskriptor prema registrima pre nego što ga uporedi, i da nevažeći tretira kao odsutan (§5.1).
- **NE SME** da zaključuje koja je oprema glavna iz redosleda u `equipment.required` (§5.2).
- **MORA** da deduplikuje samo na osnovu `identical` (§6).
- **NE SME** da sačuva primljeni unos `xrefs` kao sopstvenu vezu, niti da na osnovu njega sprovede automatsko podudaranje, a da sam ne izvrši protokol podudaranja (§5.4).
:::

Vektori usaglašenosti fiksiraju ponašanje referentnog enkodera: svaki očekivani izlaz je ono što on izračuna. Njihovo prolaženje pokazuje da se implementacija slaže sa referencom, a ne da je referenca ispravna; pravilo koje referenca pogrešno primenjuje ispravlja se u oba, u novoj reviziji pravila.

## 15. Reference

### 15.1. Normativne reference

- RFC 2119 — Ključne reči za upotrebu u RFC dokumentima
- RFC-001 — Model podataka vežbe
- RFC-002 — Model podataka opreme
- RFC-003 — Model podataka mišića
- Stranice deskriptora: [Pregled](/docs/core-concepts/descriptors/overview), [FXI](/docs/core-concepts/descriptors/fxi), [Tok pitanja](/docs/core-concepts/descriptors/question-flow), [FXE](/docs/core-concepts/descriptors/fxe), [FXM](/docs/core-concepts/descriptors/fxm), [Poređenje, podudaranje i verzionisanje](/docs/core-concepts/descriptors/compare-and-match), [Usaglašenost](/docs/core-concepts/descriptors/conformance)
- JSON Schema Draft 2020-12
- Foundational Model of Anatomy (FMA), ontologija u koju FXM sidri svaki mišić i deo i iz čijih se oznaka izvode njegovi tokeni (§4.4)

### 15.2. Informativne reference

- UBERON, anatomska ontologija koju FXM nosi kao unakrsnu referencu
- RFC-006 — Primitivi preskripcije, kojima pripada sve što deskriptor izostavlja

### 15.3. Implementacija

Referentna implementacija ovog RFC-a je `@vitness/fds-encoder`, u `packages/fds-encoder/` ovog repozitorijuma. Opcioni koraci deskriptora u transformatoru izgrađeni su iz nje.
