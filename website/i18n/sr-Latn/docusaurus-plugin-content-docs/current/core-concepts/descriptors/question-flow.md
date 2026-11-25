---
title: 'Tok pitanja: građenje FXI i FXE'
sidebar_label: 'Tok pitanja'
description: 'Ceo nacrt toka pitanja za vlasnika i način na koji odgovori grade FXI i FXE stringove'
sidebar_position: 3
---

# Tok pitanja: građenje FXI i FXE

:::caution Nacrt
Nije normativno dok ne bude prihvaćen [RFC-010](/docs/specifications/rfc-010-structural-descriptors), koji usvaja strukturne deskriptore. RFC-010 je nacrt. Pogledajte [pregled](./overview.md).
:::

Niko ne mora da piše FXI notaciju. Vlasnik odgovara na zatvorena pitanja o jednoj vežbi ili jednom komadu opreme, a odgovori grade stringove. Ova stranica je ceo tok, ispisan tako da osoba može ručno da ga prođe i da dve implementacije iz istih odgovora izgrade bajt po bajt identične stringove.

Pitanja, njihovi uslovi i kod koji svaka opcija upisuje generisani su iz [`specification/descriptors/question-flow.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/question-flow.json). Kodovi su definisani na stranicama [FXI](./fxi.md) i [FXE](./fxe.md).

## Prolazak kroz tok {#walking-the-flow}

1. Prođite kroz [pitanja](#the-questions) redom kojim su navedena. Postavite pitanje samo kada njegov uslov **Postavlja se kada** važi za do tada date odgovore; inače ga preskočite.
2. Odgovorite na svako pitanje koje postavite, i ni na jedno drugo. **Izbor: jedna** uzima jednu opciju; **izbor: jedna ili više** uzima listu, do navedenog maksimuma. Opcija označena kao *Samostalno* ne može da se kombinuje sa drugom. Opcija sa napomenom *Samo kada* važi samo kada njen uslov važi.
3. `usual` zadržava objavljenu podrazumevanu vrednost: tumačenje reči pokreta kada je reč izabrana, inače podrazumevanu vrednost sloja na stranici [FXI](./fxi.md#defaults) ili podrazumevanu vrednost sprave na stranici [FXE](./fxe.md#procedure). Tamo gde podrazumevane vrednosti nema, `usual` se ne nudi.
4. `unknown` upisuje `?`. Birajte ga samo kada zaista ne znate: `?` se poklapa sa svime, pa se vežba slabije razlikuje od susednih.
5. Svaka opcija izabrana u `changes` mora da otvori pitanje koje se zatim postavlja (pogledajte [šta otvara svaka promena](#what-each-change-opens)). Izbor koji ništa ne otvara ne odnosi se na ovu vežbu; uklonite ga.
6. Sastavite stringove prema [pravilima građenja](#from-answers-to-strings) i kanonizujte ih.

**Odgovarajte istinito.** Opišite vežbu onako kako se zaista izvodi, a ne samo onako kako kaže njen naziv. Odručenje koje se izvodi u sedu i u pretklonu odgovara se kao u sedu i u pretklonu. Ako klijenti smenjuju ruke iz ponavljanja u ponavljanje, recite to, čak i kada naziv to ne kaže. Uobičajeni način je takođe vrednost: tamo gde se vežba izvodi na uobičajeni način, odgovorite `usual`.

**Izostavite preskripciju.** Tempo, pauze, veličina opterećenja, serije, ponavljanja, visina kutije i male promene ugla ovde nisu pitanja. Oni ne menjaju vežbu.

## Reč pokreta {#the-movement-word}

Drugo pitanje traži reč pokreta: „čučanj“, „veslanje“. Reč odjednom utvrđuje uobičajeno tumačenje svakog sloja, pa je većini vežbi posle nje potrebno samo nekoliko odgovora. **Reči pokreta nisu deo ovog standarda.** One su podaci kataloga koje enkoder učitava iz skupa podataka reči pokreta; reč menja koji su odgovori uobičajeni, nikada ono što kod znači.

Bez skupa podataka odgovorite `other` i opišite pokret zglob po zglob. Svaka vežba može da se kodira na taj način. Položaj tela, opterećenje i strane se tada uvek postavljaju kao pitanja.

Skup podataka reči pokreta za svaku reč daje:

- identifikator i oznaku, i opciono napomenu „izaberite ovo, a ne ono“ za bliske sinonime;
- FXI slojeve koje reč utvrđuje, kao parove `layer:value`;
- uobičajeno mesto držanja za svaki token rekvizita, sa rezervnom vrednošću za svaki drugi token, i mesto držanja šipke kada opterećenje prolazi iza glave;
- spravu koju reč imenuje, ako je ima: njen vođeni pokret, interfejs opterećenja i da li ima jastuk za grudi;
- tip kardio sprave koji reč imenuje, ako ga ima;
- da li se širina hvata reči odnosi samo na dvoručnu šipku;
- sopstvena zatvorena pitanja reči, ako ih ima. Svaka opcija menja slojeve koje reč utvrđuje (`layer:value`; `layer:-` uklanja sloj). To su pitanja `word.*`, koja se postavljaju odmah posle pokreta.

Reč koju je vlasnik izabrao čuva se u zapisu odgovora. Nikada ne putuje u FXI. Razrešivač MOŽE da je koristi kao nagoveštaj za rangiranje.

## Pitanja po fazama {#the-phase-questions}

Kada se pokret opisuje zglob po zglob, `motion.phases` pita koliko zasebnih pokreta ima jedno ponavljanje, od jednog do pet. Pitanja označena sa **Ponavlja se** zatim se postavljaju za svaku fazu redom: čitajte `p1` kao `p2`, `p3`, … i „faza 1“ kao broj te faze, a uslov da je `motion.phases` najmanje 1 kao najmanje taj broj. Pitanja `p1b.*` opisuju drugi deo iste faze i postavljaju se samo kada je `p1.also` `yes`.

Unutar faze, `p1.joints` bira zglobove koji se pomeraju; za svaki izabrani zglob sledi po jedno pitanje o smeru, u fiksnom redosledu zglobova: vrat, trup, lopatice, rame, lakat, podlaktica, ručni zglob, kuk, koleno, skočni zglob.

## Od odgovora do stringova {#from-answers-to-strings}

Svaki sloj se gradi iz svojih odgovora na sledeći način, a zatim se ceo string [kanonizuje](./fxi.md#canonical-form). Vrednost reči je, u nastavku, vrednost koju reč pokreta utvrđuje pošto se primene njena sopstvena pitanja.

**`m`, pokret.**

- Pokret `unknown`: `m:?`.
- Opisan zglob po zglob: `motion.phases` `unknown` daje `m:?`. Inače je svaka faza njen prvi deo, a kada je `p<n>.also` `yes`, i `|` i njen drugi deo. Faze se spajaju znakom `>`.
- Deo čija je vrsta `unknown` je `?`; `balance` je `=0`. Inače je to prefiks vrste (nijedan za obično ponavljanje), zatim njene akcije spojene znakom `+`: za svaki izabrani zglob, redosledom zglobova, kod koji upisuje svaki izabrani smer (smer može da upiše dve akcije, kao `sh.flex+sh.hadd`). Smer `unknown` upisuje `<joint>.?`. Zglobovi `unknown` čine deo `?`, odnosno prefiks i `?` za deo poznate vrste. Zglob izabran u `p<n>.short` dodaje `-` posle svake svoje akcije; za to je potreban imenovan smer. Dve suprotne akcije u jednom delu su greška: podelite ih u dve faze.
- Iz reči: pokret reči. Odgovor na `motion.kind` zamenjuje prefiks reči sa jednom fazom.
- Reč čiji pokret vuče nadole iznad glave (`el.flex+sh.add`) umesto toga upisuje `el.flex+sh.ext.oh` kada je hvat, u njenoj prvoj fazi, pothvat, neutralni, uzak ili sa šakama koje se dodiruju (`su`, `ne`, `w-n`, `w-t`).

**`o`, orijentacija.** Odgovor na `orientation`, ili vrednost reči. `orientation.end` različit od `usual` čini vrednost `start>end`; kraj mora da se razlikuje od početka, a početak `*` ne može da ima kraj.

**`k`, `f`.** Odgovori na `end` i `footwork`, ili vrednosti reči.

**`s`, oslonac.** `usual` zadržava oslonac reči, osim što se oslonac reči odbacuje kada je opterećenje sprava koju reč ne imenuje. `none` ne upisuje oslonac; `unknown` upisuje `s:?`. Inače je svaki oslonac (`sup1`, i `sup2` kada je `sup.more` `yes`) njegov token površine, zatim `@` i njegove tačke spojene znakom `,`, kada je neka izabrana. Dva oslonca moraju da se razlikuju. `floor@feet` pored drugog oslonca se odbacuje kod tela u sedu, ili kod tela koje leži na leđima na osloncu koji nosi njegov trup.

**`l`, opterećenje.** Prvo opterećenje je odgovor na `load` (`implement` uzima token iz `imp1`); drugo, kada `changes` sadrži `extra`, je `imp2`. Zatim, za svako:

- telesna masa: `bw`; `unknown`: `?`;
- sprava za snagu: `mach@<point>`, gde je tačka `assist` za spravu za potpomognuto izvođenje, inače tačka tela interfejsa opterećenja sprave (`hand` je `hands`, `foot` `feet`, `ankle` `ankles`, `thigh` `thighs`, `knee` `knees`, `arm` `arms`, `shoulder` `shoulders`, `hip` `hips`; `chest`, `back`, `head` i `seat` ostaju isti), ili `?`;
- kardio sprava: `erg.<cycle>@<hold>` iz tipa kardio sprave, ili `erg@?` kada tip nije poznat;
- rekvizit, kabl, Smit sprava ili landmine: token, opcioni broj, `@` i odgovor na `hold1` ili `hold2`.

Broj se odnosi na prvi rekvizit. Upišite `*n` iz `count1` samo kada se `n` razlikuje od uobičajenog broja: jedan za dvoručni rekvizit, za sve što se drži na grudima, leđima, kukovima ili struku, i za sve što nije jednoručni rekvizit; za jednoručni rekvizit (`db`, `kb`, `plate`, `club`), jedan kada ruke rade jednu po jednu stranu, a inače dva. Drugi rekvizit mora da se razlikuje od prvog i zahteva poznato prvo opterećenje.

**Sprava.** Za vežbu čije je opterećenje sprava za snagu: sprava reči, ili odgovori na `mac.*`. Njen vođeni pokret je jednozglobni kod, ili glagol (`push`, `pull`, `assist`), zatim `.` i `mac.direction`. Njeno interfejs opterećenja je `mac.contact`, ili podrazumevana vrednost za vođeni pokret ([FXE korak 3](./fxe.md#procedure)). `mac.chest` kaže da li jastuk podupire grudi.

**`x`, simetrija.** `usual` zadržava vrednost reči; `unknown` upisuje `?`; `b` ne upisuje ništa. `split` upisuje `<code>@arms` i `<code>@legs` iz `symmetry.arms` i `symmetry.legs`, izostavljajući ekstremitet za koji je odgovoreno da obe strane rade zajedno. Inače kod, sa `@<scope>` kada `symmetry.scope` imenuje obuhvat.

**`g`, hvat i stav.** Orijentacija šaka je `grip.hand`, ili vrednost reči; `turn` pravi dve faze iz `grip.start` i `grip.end`, koje moraju da se razlikuju. Širina (`grip.width`) i stav (`stance`) dolaze iz svojih odgovora ili iz reči. Široki hvat reči koji se odnosi samo na dvoručnu šipku odbacuje se kada prvo opterećenje nije takva šipka, ili kada ruke rade jedna po jedna. Odgovor o stavu je dozvoljen samo za početak u stojećem stavu, bilo koji ili nepoznat, ili za stopala na platformi sprave. Svaka faza je njena orijentacija šaka, širina i stav spojeni znakom `+`; sa dve faze, inače prazna faza je `w-m`.

**`r`, obim pokreta.** Odgovori o dubini (`range.depth`) i početku (`range.start`), svaki zamenjuje kod reči iz iste grupe; `full` ne upisuje ništa.

**`h`, `p`, `a`.** Izabrani kodovi spojeni znakom `+`, ili vrednost reči. Dva zadržana položaja označena sa „nikada sa“ su greška; linija uzima najviše jedno od `hi`, `lo`, `side`.

**FXE zapisa** je [glavna oprema](./fxe.md#the-main-equipment-of-an-exercise) FXI-ja. Kada je to sprava za snagu, to je `FXE=1.0S/k:mac/l:<interface>/s:<posture>/m:<motion>`, sa položajem očitanim iz početne orijentacije u FXI: sedeći `seat` (`seat.chest` sa jastukom za grudi), stojeći ili stojeći u pretklonu `stand` (`stand.chest`), svaki početak licem nadole `prone`, `supine` ili `supine.decline` `supine`, `supine.incline` `recline`, klečeći `kneel`, u visu `hang`, na boku `side`, inače `?`. Kardio sprava upisuje četiri sloja svog tipa. Elastična traka upisuje `band.<type>` iz `band.type`, ili `band`.

**Samostalna oprema.** `eq.kind` `none` je `k:none`; `unknown` je `k:?`. `imp`, `sup`, `acc` i `stn` upisuju `k:<kind>/f:<form>`. Kardio sprava upisuje slojeve svog tipa. Sprava za snagu upisuje `k:mac/l:<contact>/s:<posture>/m:<motion>`: mesta dodira spojena znakom `+`; mesto dodira i položaj `usual` uzimaju [FXE podrazumevane vrednosti](./fxe.md#procedure). `eq.details` dodaje proširene slojeve `r`, `c`, `g`, `a`, a `eq.more` drugu konfiguraciju, spojenu znakom `;`. `fxe` zapisa je standardni oblik; pun oblik, sa detaljima konstrukcije, je zapis opreme u registru.

## Zapis odgovora {#the-answers-record}

Proizvođač podataka za svaku vežbu ili komad opreme čuva odgovore koji su izgradili njene stringove, kako bi mogli da se [ponovo izgrade](./compare-and-match.md#provenance-match-and-versioning) po kasnijoj reviziji pravila:

```json fds:ignore an answers record in the working shape this page describes, which RFC-010 leaves open; it is not an FDS entity document
{
  "id": "barbell-back-squat",
  "answers": {
    "subject": "usual",
    "movement": "other",
    "changes": ["usual"],
    "motion.phases": "1",
    "p1.kind": "usual",
    "p1.joints": ["hip", "kn"],
    "p1.hip": ["ext"],
    "p1.kn": ["ext"],
    "p1.short": ["usual"],
    "p1.also": "usual",
    "orientation": "standing",
    "load": "implement",
    "imp1": "bb",
    "hold1": "back",
    "symmetry": "b"
  },
  "provenance": "owner",
  "gap": null
}
```

`answers` preslikava svako postavljeno pitanje u izabranu opciju, ili u listu za pitanje koje uzima više opcija. Zapis može da nosi i `notes`, skup podataka reči pokreta iz kog je došla njegova reč, i, iz provere unutar vlasnikove sopstvene biblioteke, `sameAs` ili `differs` (u nastavku).

**Unutar jedne biblioteke.** Dve različite vežbe u jednoj biblioteci ne smeju da izgrade isti FXI. Kada se to dogodi, vlasnik to razrešava: to je ista vežba (`sameAs` imenuje drugi zapis); ili neki odgovor beleži razliku, što menja string; ili notacija to ne može da kaže (`differs` imenuje ono što se razlikuje i postaje marker nedostatka zapisa).

## Razrađeni primeri {#worked-examples}

### Zadnji čučanj sa šipkom {#barbell-back-squat}

Šipka položena preko gornjeg dela leđa; stojeći stav; kukovi i kolena se opružaju zajedno. Reč pokreta se ne koristi: pokret je opisan zglob po zglob.

| Pitanje | Odgovor | Upisuje |
|---|---|---|
| `subject` | `usual` | Vežba. |
| `movement` | `other` | Pokret je opisan u nastavku. |
| `changes` | `usual` | Ništa drugo se ne razlikuje od podrazumevanih vrednosti. |
| `motion.phases` | `1` | Jedan pokret po ponavljanju. |
| `p1.kind` | `usual` | Obično ponavljanje sa pokretom: bez prefiksa. |
| `p1.joints` | `hip`, `kn` | Skočni zglob samo prati; ne računa se. |
| `p1.hip` | `ext` | `hip.ext` |
| `p1.kn` | `ext` | `kn.ext` |
| `p1.short` | `usual` | Pun obim pokreta. |
| `p1.also` | `usual` | Jedan deo. |
| `orientation` | `standing` | `o:standing` |
| `load` | `implement` | |
| `imp1` | `bb` | `bb` |
| `hold1` | `back` | `@back` |
| `symmetry` | `b` | Ništa: obe strane zajedno je podrazumevana vrednost. |

Rezultat: `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` i, kao njegova glavna oprema, `FXE=1.0S/k:imp/f:bar.straight`.

### Veslanje na kablu u sedu {#seated-cable-row}

Na spravi za veslanje na kablu u sedu, sa sopstvenim sedištem i platformom za stopala, povlačenje V-ručke ka trupu sa dlanovima okrenutim jedan ka drugom.

| Pitanje | Odgovor | Upisuje |
|---|---|---|
| `subject` | `usual` | Vežba. |
| `movement` | `other` | |
| `changes` | `hand` | Orijentacija šaka se razlikuje od podrazumevane. |
| `motion.phases` | `1` | |
| `p1.kind` | `usual` | |
| `p1.joints` | `el`, `sh` | |
| `p1.el` | `flex` | `el.flex` |
| `p1.sh` | `row-close` | `sh.ext` |
| `p1.short` | `usual` | |
| `p1.also` | `usual` | |
| `orientation` | `seated` | `o:seated` |
| `load` | `machine` | Namenska sprava: `mach`. |
| `mac.motion` | `pull` | |
| `mac.direction` | `back` | Vođeni pokret `pull.back`. |
| `mac.contact` | `hand` | Interfejs opterećenja `hand`, dakle `mach@hands`. |
| `mac.chest` | `no` | Položaj `seat`, iz početka u sedu. |
| `symmetry` | `b` | |
| `grip.hand` | `ne` | `g:ne`; podrazumevana vrednost za veslanje bila bi nathvat. |

Rezultat: `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne` i `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back`.

Isto veslanje sa podrazumevanim nathvatom je `FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands`, i ta dva [protivreče](./compare-and-match.md#compare) jedan drugom: hvat je deo vežbe.

### Sprava za veslanje na kablu u sedu {#the-seated-cable-row-machine}

Sama sprava, kao zapis opreme u registru.

| Pitanje | Odgovor | Upisuje |
|---|---|---|
| `subject` | `equipment` | |
| `eq.kind` | `mac` | `k:mac` |
| `eq.mac.motion` | `pull` | |
| `eq.mac.direction` | `back` | `m:pull.back` |
| `eq.mac.contact` | `hand` | `l:hand` |
| `eq.mac.posture` | `seat` | `s:seat`. Veslanje na kablu u sedu sa platformom za stopala je `seat`, a ne `seat.chest`. |
| `eq.details` | `yes` | |
| `eq.drive` | `stack` | `r:stack` |
| `eq.constraint` | `cable` | `c:cable` |
| `eq.angle` | `usual` | Nije navedeno. |
| `eq.attrs` | `usual` | Ništa nije navedeno. |
| `eq.more` | `usual` | Jedna konfiguracija. |

Rezultat: standardni `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back`, koji nosi svaki zapis vežbe na ovoj spravi, i pun zapis u registru `FXE=1.0N/k:mac/l:hand/s:seat/m:pull.back/r:stack/c:cable`.

## Činjenice koje uslovi koriste {#facts-the-conditions-use}

Neki uslovi imenuju činjenicu umesto odgovora. Svaka činjenica se izvodi iz do tada datih odgovora.

<!-- fds:generated flow#facts -->
| Činjenica | Važi kada |
|---|---|
| `exercise` | Predmet opisa je vežba (uobičajeni odgovor na „subject“). |
| `equipment` | Predmet opisa je samostalni komad opreme. |
| `template` | Pokret je jedna od objavljenih reči pokreta. |
| `motion-from-scratch` | Pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta. |
| `posture-has-usual` | Reč pokreta utvrđuje položaj tela. |
| `load-has-usual` | Reč pokreta utvrđuje opterećenje (telesna masa, kabl, sprava, imenovani rekvizit). |
| `load-holdable` | Prvo opterećenje je slobodni rekvizit, kabl, Smit sprava ili landmine. |
| `hold-has-usual` | Pravila daju uobičajeno mesto držanja za taj rekvizit u ovom pokretu. |
| `load-band` | Jedno od opterećenja je elastična traka. |
| `load-machine` | Opterećenje je sprava za snagu. |
| `load-cardio` | Opterećenje je kardio sprava. |
| `machine-has-usual` | Reč pokreta utvrđuje koja se sprava koristi. |
| `cardio-has-usual` | Reč pokreta utvrđuje koja se kardio sprava koristi. |
| `hold2-has-usual` | Pravila daju uobičajeno mesto držanja za drugi rekvizit u ovom pokretu. |
| `machine-direction-has-usual` | Reč pokreta imenuje višezglobnu spravu, pa je njen smer poznat. |
| `contact-has-usual` | Reč pokreta imenuje spravu, ili pravila daju podrazumevano mesto dodira za vođeni pokret. |
| `eq-contact-has-usual` | Pravila daju podrazumevano mesto dodira za vođeni pokret opreme. |
| `eq2-contact-has-usual` | Pravila daju podrazumevano mesto dodira za vođeni pokret druge konfiguracije. |
| `single-phase-template` | Reč pokreta ima jednu fazu sa zglobnim akcijama, pa njena vrsta može da se promeni sama za sebe. |
| `stance-recorded` | Položaj tela na početku je stojeći, stojeći u pretklonu, bilo koji ili nepoznat; ili stopala potiskuju platformu sprave (nožna presa). |
| `word-asks` | Izabrana reč pokreta nosi sopstvena zatvorena pitanja u skupu podataka reči pokreta. |
<!-- /fds:generated -->

## Šta otvara svaka promena {#what-each-change-opens}

<!-- fds:generated flow#changeOpens -->
| Opcija `changes` | Otvara |
|---|---|
| `motion` | `motion.phases` |
| `kind` | `motion.kind` |
| `posture` | `orientation` |
| `end-posture` | `orientation.end` |
| `moving-end` | `end` |
| `footwork` | `footwork` |
| `support` | `support` |
| `equipment` | `load` |
| `hold` | `hold1` |
| `count` | `count1` |
| `extra` | `imp2` |
| `machine` | `mac.motion`, `erg.type` |
| `sides` | `symmetry` |
| `hand` | `grip.hand` |
| `width` | `grip.width` |
| `stance` | `stance` |
| `depth` | `range.depth` |
| `start` | `range.start` |
| `held` | `held` |
| `line` | `line` |
| `accessory` | `accessory` |
<!-- /fds:generated -->

## Pitanja {#the-questions}

<!-- fds:generated flow#questions -->
#### `subject`: Opisujete li vežbu ili samostalni komad opreme? {#subject-are-you-describing-an-exercise-or-a-piece-of-equipment-on-its-own}

- **Popunjava:** FXI ili FXE.
- **Izbor:** jedna.
- **Postavlja se kada:** uvek.
- **Uobičajeno:** Vežba.

Vežba dobija FXI i FXE svoje glavne opreme. Samostalna oprema dobija FXE iz registra.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Vežba (uobičajeni slučaj) | podrazumevana vrednost | Samostalno. |
| `equipment` | Samostalni komad opreme |  |  |

#### `movement`: Koji je to pokret? {#movement-which-movement-is-it}

- **Popunjava:** FXI m i podrazumevane vrednosti svakog drugog sloja.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“).
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Opcije iz:** skup podataka reči pokreta (nije deo notacije).

Izaberite reč pokreta koja odgovara vežbi onako kako biste je nazvali bez ikakvih dodataka. Varijacije dolaze posle. Izaberite „other“ samo kada nijedna reč ne odgovara. Same reči pokreta nisu deo notacije: enkoder ih učitava iz skupa podataka reči pokreta.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `other` | Nešto drugo: opišite pokret u zglobovima korak po korak |  |  |
| `unknown` | Ne znam kako se izvodi | `?` | Samostalno. |

#### `word.*`: Sopstvena zatvorena pitanja reči pokreta, ako ih ima. {#word-the-movement-words-own-closed-questions-if-it-has-any}

- **Popunjava:** FXI slojeve koje reč pokreta utvrđuje.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i izabrana reč pokreta nosi sopstvena zatvorena pitanja u skupu podataka reči pokreta.
- **Uobičajeno:** Opcija koju reč pokreta znači kada ništa drugo nije rečeno, tamo gde je skup podataka daje.
- **Opcije iz:** skup podataka reči pokreta (nije deo notacije).

Neke reči pokreta nose jedno ili dva sopstvena zatvorena pitanja (da li je koleno opruženo ili savijeno; koji se ekstremiteti podižu). Svaka opcija menja slojeve koje reč utvrđuje. Pitanja, njihove opcije i izmene dolaze sa skupom podataka reči pokreta.

#### `changes`: Šta se, ako išta, razlikuje od uobičajenog načina izvođenja ovog pokreta? {#changes-what-if-anything-is-different-from-the-usual-way-of-doing-this-movement}

- **Popunjava:** bira koji se slojevi razlikuju od svojih podrazumevanih vrednosti.
- **Izbor:** jedna ili više.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“).
- **Uobičajeno:** Ništa se ne razlikuje.

Uobičajeni način je ono što reč pokreta znači bez ikakvih dodataka: „čučanj“ je na oba stopala, bez zadržanog položaja, u punom obimu pokreta. Izaberite svaki način na koji se vaša vežba, onako kako je zaista izvodite, razlikuje, bez obzira na to da li to njen naziv kaže. Svaki izbor otvara jedno pitanje. Za pokrete „other“ ili „unknown“ položaj tela, oprema i strane se ionako postavljaju kao pitanja.

*Režim uvoza:* razlike u telu (pokret, položaj, rad nogu, oslonac, oprema) mogu doći iz opisa; strane, hvat, stav, obim pokreta, zadržani položaj i linija vuče dolaze samo iz naziva, alternativnog naziva i polja (pravilo izvora).

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Ništa: izvodi se na uobičajeni način za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `motion` | Sam pokret u zglobovima (ponovo ga izgradite zglob po zglob) |  |  |
| `kind` | Vrsta kretanja: eksplozivno sa letom, neprekidno, izdržaj, statičko ili dinamičko istezanje |  |  |
| `posture` | Položaj tela (stojeći, sedeći, ležeći, klečeći, u visu) |  |  |
| `end-posture` | Ponavljanje se završava u drugačijem položaju tela od početnog (turski ustanak) |  |  |
| `moving-end` | Koji se kraj tela pomera (trup ili oba kraja, kao u podizanju trupa ili V-podizanju) |  |  |
| `footwork` | Rad nogu: koraci, raskoračni stav, kretanje |  |  |
| `support` | Na čemu se telo oslanja, pored poda |  |  |
| `equipment` | Oprema koja opterećuje mišiće |  |  |
| `hold` | Gde se rekvizit drži |  |  |
| `count` | Koliko rekvizita |  |  |
| `extra` | Drugi rekvizit |  |  |
| `machine` | Koja sprava (za snagu ili kardio) |  |  |
| `sides` | Kako rade strane: jedna strana, pa druga, naizmenično, recipročno |  |  |
| `hand` | Orijentacija šaka: nathvat, pothvat, neutralni, mešoviti ili okret tokom ponavljanja |  |  |
| `width` | Širina hvata |  |  |
| `stance` | Širina stava |  |  |
| `depth` | Obim pokreta: delimičan, dublji nego obično ili iz deficita |  |  |
| `start` | Odakle počinje svako ponavljanje: sa poda, iz visa, sa graničnika ili blokova |  |  |
| `held` | Zadržani položaj ekstremiteta koji ne rade: šake iza glave, prekrštene ruke, slobodna noga napred |  |  |
| `line` | Linija vuče: kabl ili elastična traka usidreni visoko ili nisko, sa strane, ili opterećenje koje prolazi iza glave |  |  |
| `accessory` | Pomagalo koje pomaže bez opterećenja: kaiš, peškir ili uže koji vuku ekstremitet, ili partner |  |  |

#### `motion.kind`: Koja je vrsta kretanja? {#motionkind-what-kind-of-motion-is-it}

- **Popunjava:** FXI m (prefiks).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i pokret je jedna od objavljenih reči pokreta; i ne važi (pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta); i `changes` sadrži `kind`.
- **Uobičajeno:** Vrsta koju daje reč pokreta.

Samo za reči pokreta sa jednom fazom. Promena vrste zadržava zglobove koje daje reč pokreta.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Kako kaže reč pokreta (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `normal` | Obično ponavljanje sa pokretom: zglobovi se pomeraju kroz obim pokreta uz opterećenje | (bez prefiksa) | Samo kada reč pokreta ima jednu fazu sa zglobnim akcijama, pa njena vrsta može da se promeni sama za sebe. |
| `ballistic` | Završava se letom ili izbačajem: telo napušta tlo ili rekvizit napušta šake (skok, poskok, bacanje, udarac, pljesak) | `^` | Samo kada reč pokreta ima jednu fazu sa zglobnim akcijama, pa njena vrsta može da se promeni sama za sebe. |
| `cyclic` | Neprekidni ciklusi bez granice između ponavljanja, mereni vremenom ili razdaljinom (trčanje, veslanje, kruženja) | `~` | Samo kada reč pokreta ima jednu fazu sa zglobnim akcijama, pa njena vrsta može da se promeni sama za sebe. |
| `hold` | Mirno zadržano pod naporom tokom cele serije (plank, sedenje uz zid); odgovor o zglobovima je ono ka čemu mišići potiskuju | `=` | Samo kada reč pokreta ima jednu fazu sa zglobnim akcijama, pa njena vrsta može da se promeni sama za sebe. |
| `static-stretch` | Statičko istezanje: zglobovi dovedeni do kraja obima pokreta i zadržani | `%` | Samo kada reč pokreta ima jednu fazu sa zglobnim akcijama, pa njena vrsta može da se promeni sama za sebe. |
| `dynamic-stretch` | Dinamičko istezanje: dovođenje do kraja obima pokreta i otpuštanje, iznova i iznova (zamasi nogom, provlačenja štapa) | `&` | Samo kada reč pokreta ima jednu fazu sa zglobnim akcijama, pa njena vrsta može da se promeni sama za sebe. |

#### `motion.phases`: Koliko zasebnih pokreta ima jedno ponavljanje? {#motionphases-how-many-separate-movements-does-one-rep-have}

- **Popunjava:** FXI m (faze „>“).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Za svaki par pokreta postavite jedno zatvoreno pitanje: da li drugi počinje pre nego što se prvi završi? Da: jedna faza (thruster: potisak počinje dok se još podižete). Ne: dve faze (čučanj, ustajanje, pa potisak; sklek, pa potisak lopaticama). Nikada ne brojte spuštanje ili povratak.

*Režim uvoza:* Režim uvoza, kada tekst ćuti: dve reči pokreta u jednom nazivu su dve faze redom kojim stoje u nazivu, osim ako je naziv reč sa jednom fazom (thruster).

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `1` | Jedan |  |  |
| `2` | Dva |  |  |
| `3` | Tri |  |  |
| `4` | Četiri |  |  |
| `5` | Pet |  |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `p1.kind`: Koja je vrsta pokreta u fazi 1? {#p1kind-what-kind-of-movement-is-phase-1}

- **Popunjava:** FXI m (prefiks).
- **Izbor:** jedna.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1.
- **Uobičajeno:** Obično ponavljanje sa pokretom.
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Izaberite kako se zglobovi pomeraju. Samo „eksplozivno“ ili „brzo“ je obično ponavljanje: balističko zahteva let ili izbačaj. Udarac je balistički samo kada rekvizit napusti šake: udarac bojnim užetom je obično ponavljanje.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Obično ponavljanje sa pokretom (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `ballistic` | Završava se letom ili izbačajem: telo napušta tlo ili rekvizit napušta šake (skok, poskok, bacanje, udarac, pljesak) | `^` |  |
| `cyclic` | Neprekidni ciklusi bez granice između ponavljanja, mereni vremenom ili razdaljinom (trčanje, veslanje, kruženja) | `~` |  |
| `hold` | Mirno zadržano pod naporom tokom cele serije (plank, sedenje uz zid); odgovor o zglobovima je ono ka čemu mišići potiskuju | `=` |  |
| `balance` | Izdržaj ravnoteže bez smera (stajanje na jednoj nozi) | `=0` |  |
| `static-stretch` | Statičko istezanje: zglobovi dovedeni do kraja obima pokreta i zadržani | `%` |  |
| `dynamic-stretch` | Dinamičko istezanje: dovođenje do kraja obima pokreta i otpuštanje, iznova i iznova (zamasi nogom, provlačenja štapa) | `&` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `p1.joints`: Koji se zglobovi pomeraju u fazi 1? {#p1joints-which-joints-move-in-phase-1}

- **Popunjava:** FXI m (zglobovi).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`).
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Računajte zglob samo kada ga radni mišići pomeraju kroz jasan obim pokreta (oko 30° ili više) kao deo onoga što vežba trenira. Nikada ne računajte zglob koji se namerno drži mirno: koleno u rumunskom mrtvom dizanju ili potisku kukovima, lakat u razvlačenju ili odručenju, kičmu osim ako je savijanje ili uvijanje trupa sama vežba, skočni zglob osim ako se u vežbi podiže na prste ili odguruje.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `nk` | Vrat |  |  |
| `sp` | Trup (kičma) |  |  |
| `sc` | Lopatice, koje se pomeraju same za sebe |  |  |
| `sh` | Rame (procenite po putanji šaka u odnosu na trup) |  |  |
| `el` | Lakat |  |  |
| `fa` | Podlaktica koja se okreće uz otpor |  |  |
| `wr` | Ručni zglob |  |  |
| `hip` | Kuk |  |  |
| `kn` | Koleno |  |  |
| `ank` | Skočni zglob |  |  |
| `unknown` | Neki zglobovi se pomeraju, ne znam koji | `?` | Samostalno. |

#### `p1.nk`: Faza 1: u kom smeru se pomera vrat? {#p1nk-phase-1-which-way-does-the-neck-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`); i `p1.joints` sadrži `nk`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Brada ka grudima | `nk.flex` |  |
| `ext` | Glava se zabacuje unazad | `nk.ext` |  |
| `lflex` | Uho ka ramenu | `nk.lflex` |  |
| `rot` | Glava se okreće | `nk.rot` |  |
| `circ` | Kruženje | `nk.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1.sp`: Faza 1: u kom smeru se pomera trup? {#p1sp-phase-1-which-way-does-the-trunk-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`); i `p1.joints` sadrži `sp`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Savija se napred, rebra ka karlici (kranč) | `sp.flex` |  |
| `ext` | Opruža se ili izvija unazad (hiperekstenzija) | `sp.ext` |  |
| `lflex` | Savija se u stranu (bočni pregib) | `sp.lflex` |  |
| `rot` | Uvija se, ramena naspram kukova (sečenje drva) | `sp.rot` |  |
| `circ` | Kruženje | `sp.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1.sc`: Faza 1: u kom smeru se pomeraju lopatice? {#p1sc-phase-1-which-way-do-the-shoulder-blades-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`); i `p1.joints` sadrži `sc`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `elev` | Podignute (sleganje ramenima) | `sc.elev` |  |
| `dep` | Povučene nadole | `sc.dep` |  |
| `pro` | Razmaknute oko rebara (sklek lopaticama) | `sc.pro` |  |
| `ret` | Stisnute jedna ka drugoj | `sc.ret` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1.sh`: Faza 1: u kom smeru se pomera rame? {#p1sh-phase-1-which-way-does-the-shoulder-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`); i `p1.joints` sadrži `sh`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `away-square` | Od grudi, pod pravim uglom u odnosu na trup; ili spajanje ispred u visini grudi (potisak na klupi, sklek, potisak za grudi, razvlačenje) | `sh.hadd` |  |
| `away-headward` | Od grudi ka glavi (kosi potisak, sklek sa podignutim nogama, koso razvlačenje) | `sh.flex+sh.hadd` |  |
| `up-overhead` | Napred i gore, ili gore iznad glave (predručenje, potisak iznad glave, pike sklek) | `sh.flex` |  |
| `away-footward` | Od grudi ka stopalima (potisak na negativnoj kosini, sklek sa podignutim rukama, razvlačenje odozgo nadole) | `sh.ext+sh.hadd` |  |
| `down-along` | Nadole duž trupa ka stopalima (propadanje, potisak nadole opruženim rukama) | `sh.ext` |  |
| `row-close` | Ka trupu sa prednje strane, laktovi uz telo (veslanje) | `sh.ext` |  |
| `row-wide` | Ka trupu sa prednje strane, laktovi široko u visini ramena (veslanje za zadnje rame, povlačenje ka licu) | `sh.habd` |  |
| `apart` | Razdvajanje u stranu u visini grudi, ruke skoro opružene (obrnuto razvlačenje, razvlačenje trake) | `sh.habd` |  |
| `pull-front` | Nadole iznad glave, ispred lica (zgib pothvatom; svaki zgib ili povlačenje naniže pothvatom, neutralnim ili uskim hvatom; povlačenje naniže opruženim rukama, pulover, udarac) | `sh.ext.oh` |  |
| `pull-side` | Nadole iznad glave, sa strane (zgib ili povlačenje naniže nathvatom srednje ili široke širine) | `sh.add` |  |
| `up-side` | Gore u stranu (odručenje, veslanje uspravno) | `sh.abd` |  |
| `rot-in` | Rotira unutra: podlaktica se okreće ka stomaku, lakat savijen | `sh.ir` |  |
| `rot-out` | Rotira spolja: podlaktica se okreće od tela, lakat savijen | `sh.er` |  |
| `circ` | Kruženje | `sh.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1.el`: Faza 1: u kom smeru se pomera lakat? {#p1el-phase-1-which-way-does-the-elbow-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`); i `p1.joints` sadrži `el`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Savija se (pregib) | `el.flex` |  |
| `ext` | Opruža se (potisak, opružanje za triceps) | `el.ext` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1.fa`: Faza 1: u kom smeru se pomera podlaktica koja se okreće uz otpor? {#p1fa-phase-1-which-way-does-the-forearm-turning-against-resistance-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`); i `p1.joints` sadrži `fa`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `pron` | Dlan se okreće nadole | `fa.pron` |  |
| `sup` | Dlan se okreće nagore | `fa.sup` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1.wr`: Faza 1: u kom smeru se pomera ručni zglob? {#p1wr-phase-1-which-way-does-the-wrist-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`); i `p1.joints` sadrži `wr`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Dlan ka podlaktici (pregib ručnog zgloba) | `wr.flex` |  |
| `ext` | Nadlanica ka podlaktici | `wr.ext` |  |
| `rdev` | Strana palca ka podlaktici | `wr.rdev` |  |
| `udev` | Strana malog prsta ka podlaktici | `wr.udev` |  |
| `circ` | Kruženje | `wr.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1.hip`: Faza 1: u kom smeru se pomera kuk? {#p1hip-phase-1-which-way-does-the-hip-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`); i `p1.joints` sadrži `hip`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Butina ka trupu, ili trup ka butini | `hip.flex` |  |
| `ext` | Butina od trupa (ustajanje iz čučnja) | `hip.ext` |  |
| `abd` | Noga u stranu | `hip.abd` |  |
| `add` | Noga ka drugoj nozi | `hip.add` |  |
| `ir` | Koleno se okreće unutra | `hip.ir` |  |
| `er` | Koleno se okreće spolja | `hip.er` |  |
| `circ` | Kruženje | `hip.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1.kn`: Faza 1: u kom smeru se pomera koleno? {#p1kn-phase-1-which-way-does-the-knee-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`); i `p1.joints` sadrži `kn`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Savija se uz otpor (pregib nogu) | `kn.flex` |  |
| `ext` | Opruža se (ustajanje iz čučnja) | `kn.ext` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1.ank`: Faza 1: u kom smeru se pomera skočni zglob? {#p1ank-phase-1-which-way-does-the-ankle-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `balance` ili `unknown`); i `p1.joints` sadrži `ank`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `pf` | Podizanje na prste ili odraz | `ank.pf` |  |
| `df` | Prsti povučeni ka potkolenici | `ank.df` |  |
| `inv` | Taban se okreće unutra | `ank.inv` |  |
| `ev` | Taban se okreće spolja | `ank.ev` |  |
| `circ` | Kruženje | `ank.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1.short`: Da li se u fazi 1 neki zglob namerno pomera samo kroz kratak obim pokreta? {#p1short-in-phase-1-does-any-joint-move-through-only-a-short-range-on-purpose}

- **Popunjava:** FXI m (kratak pokret „-“).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.kind` je `usual`.
- **Uobičajeno:** Ne: svaki zglob se pomera kroz svoj pun obim pokreta.
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Samo propadanje i odraz u push pressu ili izbačaju, ili kratko ustajanje posle prihvata u polučučnju. Delimičan obim pokreta za celu vežbu je posebno pitanje.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Ne (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `nk` | Vrat |  | Samo kada `p1.joints` sadrži `nk`. |
| `sp` | Trup (kičma) |  | Samo kada `p1.joints` sadrži `sp`. |
| `sc` | Lopatice, koje se pomeraju same za sebe |  | Samo kada `p1.joints` sadrži `sc`. |
| `sh` | Rame (procenite po putanji šaka u odnosu na trup) |  | Samo kada `p1.joints` sadrži `sh`. |
| `el` | Lakat |  | Samo kada `p1.joints` sadrži `el`. |
| `fa` | Podlaktica koja se okreće uz otpor |  | Samo kada `p1.joints` sadrži `fa`. |
| `wr` | Ručni zglob |  | Samo kada `p1.joints` sadrži `wr`. |
| `hip` | Kuk |  | Samo kada `p1.joints` sadrži `hip`. |
| `kn` | Koleno |  | Samo kada `p1.joints` sadrži `kn`. |
| `ank` | Skočni zglob |  | Samo kada `p1.joints` sadrži `ank`. |

#### `p1.also`: Da li u fazi 1 drugi deo tela istovremeno radi nešto druge vrste ili se pomera u suprotnom smeru? {#p1also-in-phase-1-does-another-part-of-the-body-do-something-of-a-different-kind-at-the-same-time-or-move-the-opposite-way}

- **Popunjava:** FXI m (istovremeni delovi „\|“).
- **Izbor:** jedna.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i ne važi (`p1.kind` je `unknown`).
- **Uobičajeno:** Ne.
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Primer: ruke mirno drže ručke sanki dok noge hodaju, ili trup drži plank dok se noga podiže. Odgovorite sa da i kada se dva ekstremiteta istovremeno vode u suprotnim smerovima (trkačko istezanje: zadnji kuk u ekstenziju, prednji kuk u fleksiju). Dva ekstremiteta koja rade isto su jedan deo.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Ne (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `yes` | Da |  |  |

#### `p1b.kind`: Koja je vrsta pokreta u drugom delu faze 1? {#p1bkind-what-kind-of-movement-is-the-second-part-of-phase-1}

- **Popunjava:** FXI m (prefiks).
- **Izbor:** jedna.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`.
- **Uobičajeno:** Obično ponavljanje sa pokretom.
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Izaberite kako se zglobovi pomeraju. Samo „eksplozivno“ ili „brzo“ je obično ponavljanje: balističko zahteva let ili izbačaj. Udarac je balistički samo kada rekvizit napusti šake: udarac bojnim užetom je obično ponavljanje.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Obično ponavljanje sa pokretom (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `ballistic` | Završava se letom ili izbačajem: telo napušta tlo ili rekvizit napušta šake (skok, poskok, bacanje, udarac, pljesak) | `^` |  |
| `cyclic` | Neprekidni ciklusi bez granice između ponavljanja, mereni vremenom ili razdaljinom (trčanje, veslanje, kruženja) | `~` |  |
| `hold` | Mirno zadržano pod naporom tokom cele serije (plank, sedenje uz zid); odgovor o zglobovima je ono ka čemu mišići potiskuju | `=` |  |
| `balance` | Izdržaj ravnoteže bez smera (stajanje na jednoj nozi) | `=0` |  |
| `static-stretch` | Statičko istezanje: zglobovi dovedeni do kraja obima pokreta i zadržani | `%` |  |
| `dynamic-stretch` | Dinamičko istezanje: dovođenje do kraja obima pokreta i otpuštanje, iznova i iznova (zamasi nogom, provlačenja štapa) | `&` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `p1b.joints`: Koji se zglobovi pomeraju u drugom delu faze 1? {#p1bjoints-which-joints-move-in-the-second-part-of-phase-1}

- **Popunjava:** FXI m (zglobovi).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`).
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Računajte zglob samo kada ga radni mišići pomeraju kroz jasan obim pokreta (oko 30° ili više) kao deo onoga što vežba trenira. Nikada ne računajte zglob koji se namerno drži mirno: koleno u rumunskom mrtvom dizanju ili potisku kukovima, lakat u razvlačenju ili odručenju, kičmu osim ako je savijanje ili uvijanje trupa sama vežba, skočni zglob osim ako se u vežbi podiže na prste ili odguruje.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `nk` | Vrat |  |  |
| `sp` | Trup (kičma) |  |  |
| `sc` | Lopatice, koje se pomeraju same za sebe |  |  |
| `sh` | Rame (procenite po putanji šaka u odnosu na trup) |  |  |
| `el` | Lakat |  |  |
| `fa` | Podlaktica koja se okreće uz otpor |  |  |
| `wr` | Ručni zglob |  |  |
| `hip` | Kuk |  |  |
| `kn` | Koleno |  |  |
| `ank` | Skočni zglob |  |  |
| `unknown` | Neki zglobovi se pomeraju, ne znam koji | `?` | Samostalno. |

#### `p1b.nk`: Drugi deo faze 1: u kom smeru se pomera vrat? {#p1bnk-the-second-part-of-phase-1-which-way-does-the-neck-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`); i `p1b.joints` sadrži `nk`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Brada ka grudima | `nk.flex` |  |
| `ext` | Glava se zabacuje unazad | `nk.ext` |  |
| `lflex` | Uho ka ramenu | `nk.lflex` |  |
| `rot` | Glava se okreće | `nk.rot` |  |
| `circ` | Kruženje | `nk.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1b.sp`: Drugi deo faze 1: u kom smeru se pomera trup? {#p1bsp-the-second-part-of-phase-1-which-way-does-the-trunk-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`); i `p1b.joints` sadrži `sp`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Savija se napred, rebra ka karlici (kranč) | `sp.flex` |  |
| `ext` | Opruža se ili izvija unazad (hiperekstenzija) | `sp.ext` |  |
| `lflex` | Savija se u stranu (bočni pregib) | `sp.lflex` |  |
| `rot` | Uvija se, ramena naspram kukova (sečenje drva) | `sp.rot` |  |
| `circ` | Kruženje | `sp.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1b.sc`: Drugi deo faze 1: u kom smeru se pomeraju lopatice? {#p1bsc-the-second-part-of-phase-1-which-way-do-the-shoulder-blades-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`); i `p1b.joints` sadrži `sc`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `elev` | Podignute (sleganje ramenima) | `sc.elev` |  |
| `dep` | Povučene nadole | `sc.dep` |  |
| `pro` | Razmaknute oko rebara (sklek lopaticama) | `sc.pro` |  |
| `ret` | Stisnute jedna ka drugoj | `sc.ret` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1b.sh`: Drugi deo faze 1: u kom smeru se pomera rame? {#p1bsh-the-second-part-of-phase-1-which-way-does-the-shoulder-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`); i `p1b.joints` sadrži `sh`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `away-square` | Od grudi, pod pravim uglom u odnosu na trup; ili spajanje ispred u visini grudi (potisak na klupi, sklek, potisak za grudi, razvlačenje) | `sh.hadd` |  |
| `away-headward` | Od grudi ka glavi (kosi potisak, sklek sa podignutim nogama, koso razvlačenje) | `sh.flex+sh.hadd` |  |
| `up-overhead` | Napred i gore, ili gore iznad glave (predručenje, potisak iznad glave, pike sklek) | `sh.flex` |  |
| `away-footward` | Od grudi ka stopalima (potisak na negativnoj kosini, sklek sa podignutim rukama, razvlačenje odozgo nadole) | `sh.ext+sh.hadd` |  |
| `down-along` | Nadole duž trupa ka stopalima (propadanje, potisak nadole opruženim rukama) | `sh.ext` |  |
| `row-close` | Ka trupu sa prednje strane, laktovi uz telo (veslanje) | `sh.ext` |  |
| `row-wide` | Ka trupu sa prednje strane, laktovi široko u visini ramena (veslanje za zadnje rame, povlačenje ka licu) | `sh.habd` |  |
| `apart` | Razdvajanje u stranu u visini grudi, ruke skoro opružene (obrnuto razvlačenje, razvlačenje trake) | `sh.habd` |  |
| `pull-front` | Nadole iznad glave, ispred lica (zgib pothvatom; svaki zgib ili povlačenje naniže pothvatom, neutralnim ili uskim hvatom; povlačenje naniže opruženim rukama, pulover, udarac) | `sh.ext.oh` |  |
| `pull-side` | Nadole iznad glave, sa strane (zgib ili povlačenje naniže nathvatom srednje ili široke širine) | `sh.add` |  |
| `up-side` | Gore u stranu (odručenje, veslanje uspravno) | `sh.abd` |  |
| `rot-in` | Rotira unutra: podlaktica se okreće ka stomaku, lakat savijen | `sh.ir` |  |
| `rot-out` | Rotira spolja: podlaktica se okreće od tela, lakat savijen | `sh.er` |  |
| `circ` | Kruženje | `sh.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1b.el`: Drugi deo faze 1: u kom smeru se pomera lakat? {#p1bel-the-second-part-of-phase-1-which-way-does-the-elbow-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`); i `p1b.joints` sadrži `el`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Savija se (pregib) | `el.flex` |  |
| `ext` | Opruža se (potisak, opružanje za triceps) | `el.ext` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1b.fa`: Drugi deo faze 1: u kom smeru se pomera podlaktica koja se okreće uz otpor? {#p1bfa-the-second-part-of-phase-1-which-way-does-the-forearm-turning-against-resistance-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`); i `p1b.joints` sadrži `fa`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `pron` | Dlan se okreće nadole | `fa.pron` |  |
| `sup` | Dlan se okreće nagore | `fa.sup` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1b.wr`: Drugi deo faze 1: u kom smeru se pomera ručni zglob? {#p1bwr-the-second-part-of-phase-1-which-way-does-the-wrist-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`); i `p1b.joints` sadrži `wr`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Dlan ka podlaktici (pregib ručnog zgloba) | `wr.flex` |  |
| `ext` | Nadlanica ka podlaktici | `wr.ext` |  |
| `rdev` | Strana palca ka podlaktici | `wr.rdev` |  |
| `udev` | Strana malog prsta ka podlaktici | `wr.udev` |  |
| `circ` | Kruženje | `wr.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1b.hip`: Drugi deo faze 1: u kom smeru se pomera kuk? {#p1bhip-the-second-part-of-phase-1-which-way-does-the-hip-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`); i `p1b.joints` sadrži `hip`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Butina ka trupu, ili trup ka butini | `hip.flex` |  |
| `ext` | Butina od trupa (ustajanje iz čučnja) | `hip.ext` |  |
| `abd` | Noga u stranu | `hip.abd` |  |
| `add` | Noga ka drugoj nozi | `hip.add` |  |
| `ir` | Koleno se okreće unutra | `hip.ir` |  |
| `er` | Koleno se okreće spolja | `hip.er` |  |
| `circ` | Kruženje | `hip.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1b.kn`: Drugi deo faze 1: u kom smeru se pomera koleno? {#p1bkn-the-second-part-of-phase-1-which-way-does-the-knee-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`); i `p1b.joints` sadrži `kn`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `flex` | Savija se uz otpor (pregib nogu) | `kn.flex` |  |
| `ext` | Opruža se (ustajanje iz čučnja) | `kn.ext` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1b.ank`: Drugi deo faze 1: u kom smeru se pomera skočni zglob? {#p1bank-the-second-part-of-phase-1-which-way-does-the-ankle-move}

- **Popunjava:** FXI m (zglobne akcije).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i ne važi (`p1b.kind` je `balance` ili `unknown`); i `p1b.joints` sadrži `ank`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Za ponavljanje sa pokretom odgovorite za radni smer: smer u kome se zglob pomera dok se radni mišići skraćuju uz opterećenje. Nikada za spuštanje ili povratak. Za izdržaj odgovorite ka čemu mišići potiskuju. Za istezanje, smer u kome se zglob vodi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `pf` | Podizanje na prste ili odraz | `ank.pf` |  |
| `df` | Prsti povučeni ka potkolenici | `ank.df` |  |
| `inv` | Taban se okreće unutra | `ank.inv` |  |
| `ev` | Taban se okreće spolja | `ank.ev` |  |
| `circ` | Kruženje | `ank.circ` |  |
| `unknown` | Pomera se, smer nije poznat | `?` | Samostalno. |

#### `p1b.short`: Da li se u drugom delu faze 1 neki zglob namerno pomera samo kroz kratak obim pokreta? {#p1bshort-in-the-second-part-of-phase-1-does-any-joint-move-through-only-a-short-range-on-purpose}

- **Popunjava:** FXI m (kratak pokret „-“).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** pokret je „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta; i `motion.phases` je najmanje 1; i `p1.also` je `yes`; i `p1b.kind` je `usual`.
- **Uobičajeno:** Ne: svaki zglob se pomera kroz svoj pun obim pokreta.
- **Ponavlja se** za svaku fazu: pogledajte [pitanja po fazama](#the-phase-questions).

Samo propadanje i odraz u push pressu ili izbačaju, ili kratko ustajanje posle prihvata u polučučnju. Delimičan obim pokreta za celu vežbu je posebno pitanje.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Ne (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `nk` | Vrat |  | Samo kada `p1b.joints` sadrži `nk`. |
| `sp` | Trup (kičma) |  | Samo kada `p1b.joints` sadrži `sp`. |
| `sc` | Lopatice, koje se pomeraju same za sebe |  | Samo kada `p1b.joints` sadrži `sc`. |
| `sh` | Rame (procenite po putanji šaka u odnosu na trup) |  | Samo kada `p1b.joints` sadrži `sh`. |
| `el` | Lakat |  | Samo kada `p1b.joints` sadrži `el`. |
| `fa` | Podlaktica koja se okreće uz otpor |  | Samo kada `p1b.joints` sadrži `fa`. |
| `wr` | Ručni zglob |  | Samo kada `p1b.joints` sadrži `wr`. |
| `hip` | Kuk |  | Samo kada `p1b.joints` sadrži `hip`. |
| `kn` | Koleno |  | Samo kada `p1b.joints` sadrži `kn`. |
| `ank` | Skočni zglob |  | Samo kada `p1b.joints` sadrži `ank`. |

#### `orientation`: Koji je položaj tela na početku ponavljanja? {#orientation-what-is-the-body-position-at-the-start-of-the-rep}

- **Popunjava:** FXI o.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i ili ne važi (reč pokreta utvrđuje položaj tela), ili `changes` sadrži `posture`.
- **Uobičajeno:** Položaj koji utvrđuje reč pokreta.

Ravno znači unutar oko 15° od horizontale; kosa i negativna kosina 15–60°. Trup nagnut napred i zadržan tako (veslanje u pretklonu) je „standing.bent“. Na šakama i kolenima, u planku ili skleku je „prone“. Odlučuje trup: klečanje sa trupom presavijenim napred preko butina (položaj deteta) je „prone“; „kneeling“ ima uspravan trup. Na spravi koristite položaj svog tela.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni položaj za ovaj pokret | podrazumevana vrednost | Samostalno. Samo kada reč pokreta utvrđuje položaj tela. |
| `standing` | Na nogama, trup unutar oko 30° od vertikale. | `standing` |  |
| `standing.bent` | Na nogama, trup nagnut napred više od oko 30° i zadržan tako (veslanje u pretklonu). | `standing.bent` |  |
| `seated` | Sedeći, trup više od 60° od horizontale. | `seated` |  |
| `seated.bent` | Sedeći, trup nagnut napred preko butina i zadržan tako (odručenje u pretklonu u sedu). | `seated.bent` |  |
| `kneeling` | Na oba kolena, trup uspravan. Na šakama i kolenima je `prone`. | `kneeling` |  |
| `kneeling.half` | Na jednom kolenu, drugo stopalo napred. | `kneeling.half` |  |
| `supine` | Na leđima, trup unutar 15° od horizontale. | `supine` |  |
| `supine.incline` | Na leđima, glava više od kukova, trup 15–60° od horizontale. | `supine.incline` |  |
| `supine.decline` | Na leđima, glava niže od kukova, trup 15–60° od horizontale. | `supine.decline` |  |
| `prone` | Licem nadole, trup unutar 15° od horizontale: ležanje, plank, sklek, na šakama i kolenima. | `prone` |  |
| `prone.incline` | Licem nadole, glava više od kukova, 15–60° (podignute ruke). | `prone.incline` |  |
| `prone.decline` | Licem nadole, glava niže od kukova, 15–60° (podignuta stopala). | `prone.decline` |  |
| `prone.pike` | Licem nadole, kukovi najviši, šake i stopala dole, trup više od 60° glavom nadole (pike). | `prone.pike` |  |
| `side-lying` | Na boku: ležanje ili bočni plank. | `side-lying` |  |
| `hanging` | Telo drže šake ili ruke, stopala odvojena od poda: vis na šipki, oslonac na razboju. | `hanging` |  |
| `inverted` | Naglavačke, trup unutar 30° od vertikale, glava najniža: stoj na šakama, stoj na glavi. | `inverted` |  |
| `either` | Namerno bilo kako („sedeći ili stojeći“) | `*` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `orientation.end`: U kom položaju se ponavljanje završava? {#orientationend-in-what-position-does-the-rep-end}

- **Popunjava:** FXI o (početak>kraj).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `end-posture`.
- **Uobičajeno:** Tamo gde je počelo.

Samo kada se ponavljanje završava negde drugde, kao turski ustanak. Ponavljanje koje ide dole i vraća se (berpi) završava se tamo gde je počelo.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Tamo gde je počelo (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `standing` | Na nogama, trup unutar oko 30° od vertikale. | `standing` |  |
| `standing.bent` | Na nogama, trup nagnut napred više od oko 30° i zadržan tako (veslanje u pretklonu). | `standing.bent` |  |
| `seated` | Sedeći, trup više od 60° od horizontale. | `seated` |  |
| `seated.bent` | Sedeći, trup nagnut napred preko butina i zadržan tako (odručenje u pretklonu u sedu). | `seated.bent` |  |
| `kneeling` | Na oba kolena, trup uspravan. Na šakama i kolenima je `prone`. | `kneeling` |  |
| `kneeling.half` | Na jednom kolenu, drugo stopalo napred. | `kneeling.half` |  |
| `supine` | Na leđima, trup unutar 15° od horizontale. | `supine` |  |
| `supine.incline` | Na leđima, glava više od kukova, trup 15–60° od horizontale. | `supine.incline` |  |
| `supine.decline` | Na leđima, glava niže od kukova, trup 15–60° od horizontale. | `supine.decline` |  |
| `prone` | Licem nadole, trup unutar 15° od horizontale: ležanje, plank, sklek, na šakama i kolenima. | `prone` |  |
| `prone.incline` | Licem nadole, glava više od kukova, 15–60° (podignute ruke). | `prone.incline` |  |
| `prone.decline` | Licem nadole, glava niže od kukova, 15–60° (podignuta stopala). | `prone.decline` |  |
| `prone.pike` | Licem nadole, kukovi najviši, šake i stopala dole, trup više od 60° glavom nadole (pike). | `prone.pike` |  |
| `side-lying` | Na boku: ležanje ili bočni plank. | `side-lying` |  |
| `hanging` | Telo drže šake ili ruke, stopala odvojena od poda: vis na šipki, oslonac na razboju. | `hanging` |  |
| `inverted` | Naglavačke, trup unutar 30° od vertikale, glava najniža: stoj na šakama, stoj na glavi. | `inverted` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `end`: Koji se kraj tela pomera? {#end-which-end-of-the-body-moves}

- **Popunjava:** FXI k.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `moving-end`.
- **Uobičajeno:** Ono što kaže reč pokreta, inače ekstremiteti.

Obično se pomeraju ekstremiteti. U podizanju trupa, kranču, mostu ili hiperekstenziji pomera se trup, a noge ostaju na mestu. U V-podizanju oba kraja se kreću jedan ka drugom.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni kraj za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `limbs` | Pomeraju se ekstremiteti | `limbs` |  |
| `trunk` | Pomera se trup; noge ostaju na mestu | `trunk` |  |
| `both` | Oba kraja se kreću jedan ka drugom | `both` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `footwork`: Šta rade stopala? {#footwork-what-do-the-feet-do}

- **Popunjava:** FXI f.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `footwork`.
- **Uobičajeno:** Ono što kaže reč pokreta, inače stopala na mestu, u istoj ravni.

Korak se vraća u svakom ponavljanju; kretanje se nastavlja. „U mestu“ ili na kardio spravi znači da su stopala na mestu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni rad nogu za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `level` | Na mestu, u istoj ravni, jedno pored drugog | `level` |  |
| `split` | Na mestu u raskoračnom stavu, jedno stopalo napred | `split` |  |
| `step.fwd` | Svako ponavljanje je korak napred i povratak | `step.fwd` |  |
| `step.back` | Svako ponavljanje je korak nazad i povratak | `step.back` |  |
| `step.side` | Svako ponavljanje je korak u stranu i povratak | `step.side` |  |
| `step.cross` | Svako ponavljanje je ukršteni korak nazad (curtsy) i povratak | `step.cross` |  |
| `travel.fwd` | Kretanje napred | `travel.fwd` |  |
| `travel.back` | Kretanje nazad | `travel.back` |  |
| `travel.side` | Kretanje u stranu | `travel.side` |  |
| `level>split` | Počinje u istoj ravni i doskače u raskorak (izbačaj u raskorak) | `level>split` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `support`: Na čemu se telo oslanja, o čemu visi ili o šta se upire? {#support-what-does-the-body-rest-on-hang-from-or-brace-against}

- **Popunjava:** FXI s.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `support`.
- **Uobičajeno:** Ono što kaže reč pokreta.

Samo ono što nosi težinu ili podupire ekstremitet, pored poda koji vaš položaj podrazumeva. Ne prostirka, ne sedište na kome sedite, ne sopstveno sedište ili jastuci sprave, ne rukohvat koji služi samo za ravnotežu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni oslonac za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `none` | Samo pod, onako kako podrazumeva položaj tela |  |  |
| `custom` | Nešto drugo: imenovaću ga |  |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `sup1.surface`: Šta je oslonac? {#sup1surface-what-is-the-support}

- **Popunjava:** FXI s (površina).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `support` je `custom`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Različite površine pod različitim tačkama tela su zasebni oslonci: stopala na lopti, šake na podu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `bb` | Šipka. | `bb` |  |
| `ez` | EZ šipka. | `ez` |  |
| `tb` | Trap ili heksagonalna šipka. | `tb` |  |
| `axle` | Debela šipka (axle). | `axle` |  |
| `camber` | Zakrivljena šipka. | `camber` |  |
| `db` | Bučica. | `db` |  |
| `kb` | Girja. | `kb` |  |
| `circus` | Cirkuska bučica. | `circus` |  |
| `mb` | Medicinka. | `mb` |  |
| `slam` | Slam lopta. | `slam` |  |
| `bag` | Vreća sa peskom. | `bag` |  |
| `hbag` | Džak. | `hbag` |  |
| `plate` | Disk. | `plate` |  |
| `chain` | Lanac. | `chain` |  |
| `rope` | Bojno uže. | `rope` |  |
| `jrope` | Vijača. | `jrope` |  |
| `band` | Svaka elastična traka, cev, superband ili miniband. | `band` |  |
| `sled` | Sanke ili prowler. | `sled` |  |
| `tire` | Guma. | `tire` |  |
| `hammer` | Malj. | `hammer` |  |
| `stone` | Atlas kamen. | `stone` |  |
| `log` | Balvan (log). | `log` |  |
| `keg` | Bure. | `keg` |  |
| `yoke` | Jaram. | `yoke` |  |
| `frame` | Farmerske ručke ili ram za nošenje (rikša). | `frame` |  |
| `car` | Automobil. | `car` |  |
| `vest` | Prsluk sa tegom. | `vest` |  |
| `ankwt` | Teg za skočni zglob. | `ankwt` |  |
| `club` | Palica ili buzdovan. | `club` |  |
| `dowel` | Štap, drška metle ili PVC cev: postavlja šake, ne dodaje opterećenje. | `dowel` |  |
| `wheel` | Točak za trbušnjake. | `wheel` |  |
| `wroller` | Valjak za ručne zglobove. | `wroller` |  |
| `harness` | Remenje za glavu. | `harness` |  |
| `cable` | Stub sa sajlom ili crossover stanica (ne sprava za povlačenje naniže ili za veslanje u sedu). | `cable` |  |
| `smith` | Smit sprava. | `smith` |  |
| `landmine` | Landmine, ili kraj šipke zaglavljen u uglu. | `landmine` |  |
| `mach` | Svaka namenska sprava za snagu (uključujući sprave za povlačenje naniže i za veslanje u sedu). FXE reda imenuje koja. | `mach` |  |
| `erg` | Svaka kardio sprava: traka za trčanje, bicikl, veslački ergometar, eliptični trenažer, sprava za stepenice, ski ergometar. FXE reda imenuje koja. | `erg` |  |
| `floor` | Pod ili prostirka. | `floor` |  |
| `wall` | Zid. | `wall` |  |
| `bench` | Klupa. | `bench` |  |
| `box` | Kutija, stepenik ili platforma. | `box` |  |
| `chair` | Stolica. | `chair` |  |
| `block` | Blokovi za dizanje. | `block` |  |
| `rack` | Kavez (power rack) ili stalak za čučanj. | `rack` |  |
| `ball` | Pilates lopta. | `ball` |  |
| `dome` | BOSU, gornja strana nije navedena. | `dome` |  |
| `dome.up` | BOSU, kupola nagore. | `dome.up` |  |
| `dome.down` | BOSU, ravna strana nagore (kupola na podu). | `dome.down` |  |
| `board` | Balans daska. | `board` |  |
| `roller` | Penasti valjak. | `roller` |  |
| `slider` | Klizač. | `slider` |  |
| `strap` | Trake za suspenzioni trening. | `strap` |  |
| `ring` | Gimnastički krugovi. | `ring` |  |
| `crope` | Uže za penjanje. | `crope` |  |
| `bar` | Fiksna šipka: vratilo, ili šipka na stalku koja služi kao rukohvat. | `bar` |  |
| `bars` | Razboj za propadanja. | `bars` |  |
| `pbars` | Paralete. | `pbars` |  |
| `preacher` | Jastuk Skotove klupe. | `preacher` |  |
| `hyper` | Klupa za hiperekstenzije (rimska stolica za podizanja leđima ili bočno). | `hyper` |  |
| `ghd` | GHD sprava (glute-ham developer). | `ghd` |  |
| `vkr` | Kapetanska stolica / stanica za podizanje kolena. | `vkr` |  |
| `pole` | Uspravni stub ili šipka koju drže šake (ljudska zastava). | `pole` |  |
| `mball` | Loptica za masažu ili lakros loptica. | `mball` |  |
| `unknown` | Nešto što nije imenovano | `?` | Samostalno. |

#### `sup1.points`: Koje tačke tela nose težinu na njemu? {#sup1points-which-body-points-bear-weight-on-it}

- **Popunjava:** FXI s (tačke).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `support` je `custom`.
- **Uobičajeno:** Samo tačke koje podrazumeva položaj tela.

Izostavite tačke koje položaj vašeg tela već podrazumeva (stojeći stav podrazumeva stopala; ležanje na leđima, leđa). Kada se trup ni na šta ne oslanja (plank, sklek), navedite svaku tačku.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Samo tačke koje položaj podrazumeva (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `hands` | Šake, ili jedna šaka. | `hands` |  |
| `forearms` | Podlaktice, laktovi savijeni (plank na laktovima). | `forearms` |  |
| `elbows` | Pregib laktova (Zercher). | `elbows` |  |
| `arms` | Nadlaktice (jastuk Skotove klupe). | `arms` |  |
| `shoulders` | Na prednjoj strani ramena i ključnih kostiju (front rack), ili na jednom ramenu. | `shoulders` |  |
| `chest` | Uz grudi (goblet, medveđi zagrljaj). | `chest` |  |
| `back` | Preko gornjeg dela leđa (zadnji čučanj). | `back` |  |
| `hips` | Preko prednje strane kukova (potisak kukovima). | `hips` |  |
| `waist` | Okačeno o pojas oko struka. | `waist` |  |
| `seat` | Zadnjica (sedanje na kutiju ili klupu). | `seat` |  |
| `thighs` | Na butinama ili oko njih. | `thighs` |  |
| `knees` | Na kolenima ili oko njih. | `knees` |  |
| `shins` | Potkolenice (prednja strana). | `shins` |  |
| `calves` | Listovi (zadnja strana potkolenice). | `calves` |  |
| `ankles` | Na skočnim zglobovima ili tik iznad njih (kaiš, manžetna, jastuk sprave na potkolenici). | `ankles` |  |
| `feet` | Stopala, ili jedno stopalo. | `feet` |  |
| `head` | Glava ili čelo. | `head` |  |
| `unknown` | Tačka koju ne znam | `?` |  |

#### `sup.more`: Postoji li drugi oslonac? {#supmore-is-there-a-second-support}

- **Popunjava:** FXI s (stavke).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `support` je `custom`.
- **Uobičajeno:** Ne.

Primer: stopala na lopti i šake na podu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Ne (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `yes` | Da |  |  |

#### `sup2.surface`: Šta je drugi oslonac? {#sup2surface-what-is-the-second-support}

- **Popunjava:** FXI s (površina).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `support` je `custom`; i `sup.more` je `yes`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Različite površine pod različitim tačkama tela su zasebni oslonci: stopala na lopti, šake na podu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `bb` | Šipka. | `bb` |  |
| `ez` | EZ šipka. | `ez` |  |
| `tb` | Trap ili heksagonalna šipka. | `tb` |  |
| `axle` | Debela šipka (axle). | `axle` |  |
| `camber` | Zakrivljena šipka. | `camber` |  |
| `db` | Bučica. | `db` |  |
| `kb` | Girja. | `kb` |  |
| `circus` | Cirkuska bučica. | `circus` |  |
| `mb` | Medicinka. | `mb` |  |
| `slam` | Slam lopta. | `slam` |  |
| `bag` | Vreća sa peskom. | `bag` |  |
| `hbag` | Džak. | `hbag` |  |
| `plate` | Disk. | `plate` |  |
| `chain` | Lanac. | `chain` |  |
| `rope` | Bojno uže. | `rope` |  |
| `jrope` | Vijača. | `jrope` |  |
| `band` | Svaka elastična traka, cev, superband ili miniband. | `band` |  |
| `sled` | Sanke ili prowler. | `sled` |  |
| `tire` | Guma. | `tire` |  |
| `hammer` | Malj. | `hammer` |  |
| `stone` | Atlas kamen. | `stone` |  |
| `log` | Balvan (log). | `log` |  |
| `keg` | Bure. | `keg` |  |
| `yoke` | Jaram. | `yoke` |  |
| `frame` | Farmerske ručke ili ram za nošenje (rikša). | `frame` |  |
| `car` | Automobil. | `car` |  |
| `vest` | Prsluk sa tegom. | `vest` |  |
| `ankwt` | Teg za skočni zglob. | `ankwt` |  |
| `club` | Palica ili buzdovan. | `club` |  |
| `dowel` | Štap, drška metle ili PVC cev: postavlja šake, ne dodaje opterećenje. | `dowel` |  |
| `wheel` | Točak za trbušnjake. | `wheel` |  |
| `wroller` | Valjak za ručne zglobove. | `wroller` |  |
| `harness` | Remenje za glavu. | `harness` |  |
| `cable` | Stub sa sajlom ili crossover stanica (ne sprava za povlačenje naniže ili za veslanje u sedu). | `cable` |  |
| `smith` | Smit sprava. | `smith` |  |
| `landmine` | Landmine, ili kraj šipke zaglavljen u uglu. | `landmine` |  |
| `mach` | Svaka namenska sprava za snagu (uključujući sprave za povlačenje naniže i za veslanje u sedu). FXE reda imenuje koja. | `mach` |  |
| `erg` | Svaka kardio sprava: traka za trčanje, bicikl, veslački ergometar, eliptični trenažer, sprava za stepenice, ski ergometar. FXE reda imenuje koja. | `erg` |  |
| `floor` | Pod ili prostirka. | `floor` |  |
| `wall` | Zid. | `wall` |  |
| `bench` | Klupa. | `bench` |  |
| `box` | Kutija, stepenik ili platforma. | `box` |  |
| `chair` | Stolica. | `chair` |  |
| `block` | Blokovi za dizanje. | `block` |  |
| `rack` | Kavez (power rack) ili stalak za čučanj. | `rack` |  |
| `ball` | Pilates lopta. | `ball` |  |
| `dome` | BOSU, gornja strana nije navedena. | `dome` |  |
| `dome.up` | BOSU, kupola nagore. | `dome.up` |  |
| `dome.down` | BOSU, ravna strana nagore (kupola na podu). | `dome.down` |  |
| `board` | Balans daska. | `board` |  |
| `roller` | Penasti valjak. | `roller` |  |
| `slider` | Klizač. | `slider` |  |
| `strap` | Trake za suspenzioni trening. | `strap` |  |
| `ring` | Gimnastički krugovi. | `ring` |  |
| `crope` | Uže za penjanje. | `crope` |  |
| `bar` | Fiksna šipka: vratilo, ili šipka na stalku koja služi kao rukohvat. | `bar` |  |
| `bars` | Razboj za propadanja. | `bars` |  |
| `pbars` | Paralete. | `pbars` |  |
| `preacher` | Jastuk Skotove klupe. | `preacher` |  |
| `hyper` | Klupa za hiperekstenzije (rimska stolica za podizanja leđima ili bočno). | `hyper` |  |
| `ghd` | GHD sprava (glute-ham developer). | `ghd` |  |
| `vkr` | Kapetanska stolica / stanica za podizanje kolena. | `vkr` |  |
| `pole` | Uspravni stub ili šipka koju drže šake (ljudska zastava). | `pole` |  |
| `mball` | Loptica za masažu ili lakros loptica. | `mball` |  |
| `unknown` | Nešto što nije imenovano | `?` | Samostalno. |

#### `sup2.points`: Koje tačke tela nose težinu na njemu? {#sup2points-which-body-points-bear-weight-on-it}

- **Popunjava:** FXI s (tačke).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `support` je `custom`; i `sup.more` je `yes`.
- **Uobičajeno:** Samo tačke koje podrazumeva položaj tela.

Izostavite tačke koje položaj vašeg tela već podrazumeva (stojeći stav podrazumeva stopala; ležanje na leđima, leđa). Kada se trup ni na šta ne oslanja (plank, sklek), navedite svaku tačku.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Samo tačke koje položaj podrazumeva (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `hands` | Šake, ili jedna šaka. | `hands` |  |
| `forearms` | Podlaktice, laktovi savijeni (plank na laktovima). | `forearms` |  |
| `elbows` | Pregib laktova (Zercher). | `elbows` |  |
| `arms` | Nadlaktice (jastuk Skotove klupe). | `arms` |  |
| `shoulders` | Na prednjoj strani ramena i ključnih kostiju (front rack), ili na jednom ramenu. | `shoulders` |  |
| `chest` | Uz grudi (goblet, medveđi zagrljaj). | `chest` |  |
| `back` | Preko gornjeg dela leđa (zadnji čučanj). | `back` |  |
| `hips` | Preko prednje strane kukova (potisak kukovima). | `hips` |  |
| `waist` | Okačeno o pojas oko struka. | `waist` |  |
| `seat` | Zadnjica (sedanje na kutiju ili klupu). | `seat` |  |
| `thighs` | Na butinama ili oko njih. | `thighs` |  |
| `knees` | Na kolenima ili oko njih. | `knees` |  |
| `shins` | Potkolenice (prednja strana). | `shins` |  |
| `calves` | Listovi (zadnja strana potkolenice). | `calves` |  |
| `ankles` | Na skočnim zglobovima ili tik iznad njih (kaiš, manžetna, jastuk sprave na potkolenici). | `ankles` |  |
| `feet` | Stopala, ili jedno stopalo. | `feet` |  |
| `head` | Glava ili čelo. | `head` |  |
| `unknown` | Tačka koju ne znam | `?` |  |

#### `load`: Šta opterećuje radne mišiće? {#load-what-loads-the-working-muscles}

- **Popunjava:** FXI l i FXE reda.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i ili ne važi (reč pokreta utvrđuje opterećenje (telesna masa, kabl, sprava, imenovani rekvizit)), ili `changes` sadrži `equipment`.
- **Uobičajeno:** Opterećenje koje imenuje reč pokreta.

Nisu oslonci: klupa, kutija ili šipka o koju visite spadaju pod oslonac. Prsluk ili pojas sa tegom je rekvizit. Sprava za povlačenje naniže i sprava za veslanje u sedu sa sopstvenim sedištem su sprave za snagu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeno opterećenje za ovaj pokret | podrazumevana vrednost | Samostalno. Samo kada reč pokreta utvrđuje opterećenje (telesna masa, kabl, sprava, imenovani rekvizit). |
| `bodyweight` | Samo telesna masa | `bw` |  |
| `implement` | Slobodni rekvizit: šipka, bučica, girja, elastična traka, lopta, disk… |  |  |
| `cable` | Stub sa sajlom ili crossover | `cable` |  |
| `smith` | Smit sprava | `smith` |  |
| `landmine` | Landmine | `landmine` |  |
| `machine` | Sprava za snagu izgrađena za jedan pokret | `mach` |  |
| `cardio` | Kardio sprava | `erg` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `imp1`: Koji rekvizit? {#imp1-which-implement}

- **Popunjava:** FXI l (token) i FXE reda.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `load` je `implement`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Vrsta predmeta, ne njegova težina. Svaka elastična traka, cev, superband ili miniband je „band“.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `bb` | Šipka. | `bb` |  |
| `ez` | EZ šipka. | `ez` |  |
| `tb` | Trap ili heksagonalna šipka. | `tb` |  |
| `axle` | Debela šipka (axle). | `axle` |  |
| `camber` | Zakrivljena šipka. | `camber` |  |
| `db` | Bučica. | `db` |  |
| `kb` | Girja. | `kb` |  |
| `circus` | Cirkuska bučica. | `circus` |  |
| `mb` | Medicinka. | `mb` |  |
| `slam` | Slam lopta. | `slam` |  |
| `bag` | Vreća sa peskom. | `bag` |  |
| `hbag` | Džak. | `hbag` |  |
| `plate` | Disk. | `plate` |  |
| `chain` | Lanac. | `chain` |  |
| `rope` | Bojno uže. | `rope` |  |
| `jrope` | Vijača. | `jrope` |  |
| `band` | Svaka elastična traka, cev, superband ili miniband. | `band` |  |
| `sled` | Sanke ili prowler. | `sled` |  |
| `tire` | Guma. | `tire` |  |
| `hammer` | Malj. | `hammer` |  |
| `stone` | Atlas kamen. | `stone` |  |
| `log` | Balvan (log). | `log` |  |
| `keg` | Bure. | `keg` |  |
| `yoke` | Jaram. | `yoke` |  |
| `frame` | Farmerske ručke ili ram za nošenje (rikša). | `frame` |  |
| `car` | Automobil. | `car` |  |
| `vest` | Prsluk sa tegom. | `vest` |  |
| `ankwt` | Teg za skočni zglob. | `ankwt` |  |
| `club` | Palica ili buzdovan. | `club` |  |
| `dowel` | Štap, drška metle ili PVC cev: postavlja šake, ne dodaje opterećenje. | `dowel` |  |
| `wheel` | Točak za trbušnjake. | `wheel` |  |
| `wroller` | Valjak za ručne zglobove. | `wroller` |  |
| `harness` | Remenje za glavu. | `harness` |  |
| `unknown` | Slobodni teg čiju vrstu ne znam | `?` | Samostalno. |

#### `hold1`: Gde se drži? {#hold1-where-is-it-held}

- **Popunjava:** FXI l (mesto držanja).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i prvo opterećenje je slobodni rekvizit, kabl, Smit sprava ili landmine; i ili ne važi (pravila daju uobičajeno mesto držanja za taj rekvizit u ovom pokretu), ili `changes` sadrži `hold`, ili je `load` `implement` ili `cable` ili `smith` ili `landmine`.
- **Uobičajeno:** Mesto držanja koje reč pokreta daje za ovaj rekvizit, inače šake za rekvizit koji se drži u šakama.

U šakama, uz bokove, u zamahu ili za ručku je „hands“, kao i bučice držane u visini ramena i šipka koja se potiskuje bez oslanjanja na ramena. Oslonjeno na prednju stranu ramena (front rack), ili kraj landmine šipke držan uz rame, je „shoulders“. Šipka iza vrata leži na „back“. Držanje opruženim rukama iznad glave tokom celog ponavljanja je „overhead“. Opterećenje na krilu pri podizanju na prste u sedu je „thighs“. Elastična traka ide tamo gde pritiska ili vuče telo; u radu samo nogama to su obično stopala ili skočni zglobovi. Elastična traka čije krajeve držite uz ramena (thruster sa trakom) je „hands“: „shoulders“ je opterećenje koje leži na njima.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeno mesto za ovaj pokret | podrazumevana vrednost | Samostalno. Samo kada pravila daju uobičajeno mesto držanja za taj rekvizit u ovom pokretu. |
| `hands` | Šake, ili jedna šaka. | `hands` |  |
| `forearms` | Podlaktice, laktovi savijeni (plank na laktovima). | `forearms` |  |
| `elbows` | Pregib laktova (Zercher). | `elbows` |  |
| `arms` | Nadlaktice (jastuk Skotove klupe). | `arms` |  |
| `shoulders` | Na prednjoj strani ramena i ključnih kostiju (front rack), ili na jednom ramenu. | `shoulders` |  |
| `chest` | Uz grudi (goblet, medveđi zagrljaj). | `chest` |  |
| `back` | Preko gornjeg dela leđa (zadnji čučanj). | `back` |  |
| `hips` | Preko prednje strane kukova (potisak kukovima). | `hips` |  |
| `waist` | Okačeno o pojas oko struka. | `waist` |  |
| `seat` | Zadnjica (sedanje na kutiju ili klupu). | `seat` |  |
| `thighs` | Na butinama ili oko njih. | `thighs` |  |
| `knees` | Na kolenima ili oko njih. | `knees` |  |
| `shins` | Potkolenice (prednja strana). | `shins` |  |
| `calves` | Listovi (zadnja strana potkolenice). | `calves` |  |
| `ankles` | Na skočnim zglobovima ili tik iznad njih (kaiš, manžetna, jastuk sprave na potkolenici). | `ankles` |  |
| `feet` | Stopala, ili jedno stopalo. | `feet` |  |
| `head` | Glava ili čelo. | `head` |  |
| `overhead` | Drži se u šakama opruženim rukama iznad glave tokom celog ponavljanja. | `overhead` |  |
| `assist` | Rekvizit preuzima deo telesne mase (elastična traka za pomoć, sprava za potpomognuto izvođenje). | `assist` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `count1`: Koliko ih ima ukupno? {#count1-how-many-of-them-in-total}

- **Popunjava:** FXI l (broj „*n“).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i prvo opterećenje je slobodni rekvizit, kabl, Smit sprava ili landmine; i `changes` sadrži `count`.
- **Uobičajeno:** Uobičajeni broj.

Uobičajeni broj je jedan po radnoj šaci za jednoručni rekvizit (dve bučice u pregibu sa obe ruke, jedna u pregibu jednom rukom) i jedan za dvoručni rekvizit ili bilo šta što se drži na trupu. Kada i noge rade jednu po jednu stranu (iskorak sa potiskom jednom rukom), uobičajeni broj je dva: odgovorite 1 ako držite jednu bučicu. Ako je vaš ukupan broj uobičajen, odgovor ništa ne menja.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni broj | podrazumevana vrednost | Samostalno. |
| `1` | 1 | `1` |  |
| `2` | 2 | `2` |  |
| `3` | 3 | `3` |  |
| `4` | 4 | `4` |  |

#### `imp2`: Koji je drugi rekvizit? {#imp2-what-is-the-second-implement}

- **Popunjava:** FXI l (druga stavka).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `extra`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Primer: prsluk sa tegom uz bučice, ili disk na pojasu za propadanja uz telesnu masu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `bb` | Šipka. | `bb` |  |
| `ez` | EZ šipka. | `ez` |  |
| `tb` | Trap ili heksagonalna šipka. | `tb` |  |
| `axle` | Debela šipka (axle). | `axle` |  |
| `camber` | Zakrivljena šipka. | `camber` |  |
| `db` | Bučica. | `db` |  |
| `kb` | Girja. | `kb` |  |
| `circus` | Cirkuska bučica. | `circus` |  |
| `mb` | Medicinka. | `mb` |  |
| `slam` | Slam lopta. | `slam` |  |
| `bag` | Vreća sa peskom. | `bag` |  |
| `hbag` | Džak. | `hbag` |  |
| `plate` | Disk. | `plate` |  |
| `chain` | Lanac. | `chain` |  |
| `rope` | Bojno uže. | `rope` |  |
| `jrope` | Vijača. | `jrope` |  |
| `band` | Svaka elastična traka, cev, superband ili miniband. | `band` |  |
| `sled` | Sanke ili prowler. | `sled` |  |
| `tire` | Guma. | `tire` |  |
| `hammer` | Malj. | `hammer` |  |
| `stone` | Atlas kamen. | `stone` |  |
| `log` | Balvan (log). | `log` |  |
| `keg` | Bure. | `keg` |  |
| `yoke` | Jaram. | `yoke` |  |
| `frame` | Farmerske ručke ili ram za nošenje (rikša). | `frame` |  |
| `car` | Automobil. | `car` |  |
| `vest` | Prsluk sa tegom. | `vest` |  |
| `ankwt` | Teg za skočni zglob. | `ankwt` |  |
| `club` | Palica ili buzdovan. | `club` |  |
| `dowel` | Štap, drška metle ili PVC cev: postavlja šake, ne dodaje opterećenje. | `dowel` |  |
| `wheel` | Točak za trbušnjake. | `wheel` |  |
| `wroller` | Valjak za ručne zglobove. | `wroller` |  |
| `harness` | Remenje za glavu. | `harness` |  |
| `cable` | Kabl | `cable` |  |
| `unknown` | Slobodni teg čiju vrstu ne znam | `?` | Samostalno. |

#### `hold2`: Gde se drži drugi rekvizit? {#hold2-where-is-the-second-implement-held}

- **Popunjava:** FXI l (mesto držanja).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `extra`.
- **Uobičajeno:** Uobičajeno mesto za taj rekvizit u ovom pokretu.

Ista pravila kao za prvi rekvizit.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeno mesto za ovaj pokret | podrazumevana vrednost | Samostalno. Samo kada pravila daju uobičajeno mesto držanja za drugi rekvizit u ovom pokretu. |
| `hands` | Šake, ili jedna šaka. | `hands` |  |
| `forearms` | Podlaktice, laktovi savijeni (plank na laktovima). | `forearms` |  |
| `elbows` | Pregib laktova (Zercher). | `elbows` |  |
| `arms` | Nadlaktice (jastuk Skotove klupe). | `arms` |  |
| `shoulders` | Na prednjoj strani ramena i ključnih kostiju (front rack), ili na jednom ramenu. | `shoulders` |  |
| `chest` | Uz grudi (goblet, medveđi zagrljaj). | `chest` |  |
| `back` | Preko gornjeg dela leđa (zadnji čučanj). | `back` |  |
| `hips` | Preko prednje strane kukova (potisak kukovima). | `hips` |  |
| `waist` | Okačeno o pojas oko struka. | `waist` |  |
| `seat` | Zadnjica (sedanje na kutiju ili klupu). | `seat` |  |
| `thighs` | Na butinama ili oko njih. | `thighs` |  |
| `knees` | Na kolenima ili oko njih. | `knees` |  |
| `shins` | Potkolenice (prednja strana). | `shins` |  |
| `calves` | Listovi (zadnja strana potkolenice). | `calves` |  |
| `ankles` | Na skočnim zglobovima ili tik iznad njih (kaiš, manžetna, jastuk sprave na potkolenici). | `ankles` |  |
| `feet` | Stopala, ili jedno stopalo. | `feet` |  |
| `head` | Glava ili čelo. | `head` |  |
| `overhead` | Drži se u šakama opruženim rukama iznad glave tokom celog ponavljanja. | `overhead` |  |
| `assist` | Rekvizit preuzima deo telesne mase (elastična traka za pomoć, sprava za potpomognuto izvođenje). | `assist` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `band.type`: Koja vrsta elastične trake? {#bandtype-which-kind-of-band}

- **Popunjava:** FXE f (podvrsta elastične trake).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i jedno od opterećenja je elastična traka.
- **Uobičajeno:** Elastična traka nenavedenog tipa.

Navedite vrstu samo kada je znate. FXI je isti za svaku elastičnu traku; menja se samo FXE reda.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `loop` | Duga zatvorena traka: superband, power band | `band.loop` |  |
| `mini` | Kratka zatvorena traka oko nogu: miniband | `band.mini` |  |
| `tube` | Cev sa ručkama | `band.tube` |  |

#### `mac.motion`: Koji pokret sprava vodi? {#macmotion-what-does-the-machine-guide}

- **Popunjava:** FXE m (mac).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i opterećenje je sprava za snagu; i ili ne važi (reč pokreta utvrđuje koja se sprava koristi), ili `changes` sadrži `machine`.
- **Uobičajeno:** Sprava koju imenuje reč pokreta.

Odgovorite za spravu onakvu kakva je izgrađena, a ne za vežbu koja se na njoj izvodi. Podizanje na prste na nožnoj presi koristi nožnu presu: odgovorite „gura od vas“. Osovina poravnata sa jednim zglobom znači jednozglobnu spravu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Sprava izgrađena za ovaj pokret (uobičajeni način) | podrazumevana vrednost | Samostalno. Samo kada reč pokreta utvrđuje koja se sprava koristi. |
| `push` | *Višezglobna:* Gura od vas: višezglobna sprava za potisak ili čučanj |  |  |
| `pull` | Vuče ka vama: višezglobna sprava za veslanje, povlačenje naniže ili mrtvo dizanje |  |  |
| `assist` | Pomaže da se telo podigne: sprava za potpomognute zgibove ili propadanja |  |  |
| `kn.flex` | *Osovina u jednom zglobu:* Koleno se savija (pregib nogu) | `kn.flex` |  |
| `kn.ext` | Koleno se opruža (opružanje nogu) | `kn.ext` |  |
| `el.flex` | Lakat se savija (sprava za pregib) | `el.flex` |  |
| `el.ext` | Lakat se opruža (sprava za triceps) | `el.ext` |  |
| `sh.hadd` | Ruke se spajaju ispred (pec deck) | `sh.hadd` |  |
| `sh.habd` | Ruke se razdvajaju (sprava za zadnje rame) | `sh.habd` |  |
| `sh.abd` | Ruke se podižu u stranu (sprava za odručenje) | `sh.abd` |  |
| `sh.ext` | Ruke vuku nadole ispred tela (sprava za pulover) | `sh.ext` |  |
| `sh.flex` | Ruke se podižu napred | `sh.flex` |  |
| `sh.add` | Ruke vuku nadole sa strane | `sh.add` |  |
| `sh.ir` | Rame rotira unutra | `sh.ir` |  |
| `sh.er` | Rame rotira spolja | `sh.er` |  |
| `sc.elev` | Sleganje ramenima | `sc.elev` |  |
| `hip.flex` | Kuk se savija (sprava za podizanje nogu ili kolena) | `hip.flex` |  |
| `hip.ext` | Kuk se opruža (opružanje kuka unazad, potisak kukovima, obrnuta hiperekstenzija) | `hip.ext` |  |
| `hip.abd` | Noge se razmiču (abduktor) | `hip.abd` |  |
| `hip.add` | Noge se skupljaju (aduktor) | `hip.add` |  |
| `sp.flex` | Trup se savija (sprava za trbušnjake) | `sp.flex` |  |
| `sp.ext` | Trup se opruža (sprava za hiperekstenziju) | `sp.ext` |  |
| `sp.rot` | Trup se uvija (rotary torso) | `sp.rot` |  |
| `sp.lflex` | Trup se savija u stranu | `sp.lflex` |  |
| `ank.pf` | Podizanje na prste (sprava za listove) | `ank.pf` |  |
| `ank.df` | Prsti se povlače nagore (sprava za tibijalis) | `ank.df` |  |
| `nk.flex` | Vrat se savija | `nk.flex` |  |
| `nk.ext` | Vrat se opruža | `nk.ext` |  |
| `nk.lflex` | Vrat se savija u stranu | `nk.lflex` |  |
| `wr.flex` | Ručni zglob se savija | `wr.flex` |  |
| `wr.ext` | Ručni zglob se opruža | `wr.ext` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `mac.direction`: U kom smeru se, u odnosu na vaš trup, pomera ručka, jastuk ili platforma dok radite? {#macdirection-which-way-does-the-handle-pad-or-plate-move-relative-to-your-trunk-while-you-work}

- **Popunjava:** FXE m (smer za mac).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i opterećenje je sprava za snagu; i ili ne važi (reč pokreta utvrđuje koja se sprava koristi), ili `changes` sadrži `machine`; i `mac.motion` je `push` ili `pull` ili `assist`.
- **Uobičajeno:** Smer sprave koju imenuje reč pokreta.

Gore je ka glavi, dole ka stopalima, napred je od prednje strane trupa.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni smer za ovaj pokret | podrazumevana vrednost | Samostalno. Samo kada reč pokreta imenuje višezglobnu spravu, pa je njen smer poznat. |
| `up` | Ka glavi: potisak za ramena, hack čučanj, belt čučanj, sprava za mrtvo dizanje. | `up` |  |
| `down` | Ka stopalima: povlačenje naniže, propadanje u sedu. | `down` |  |
| `fwd` | Od prednje strane trupa: potisak za grudi, nožna presa. | `fwd` |  |
| `back` | Ka prednjoj strani trupa: veslanje. | `back` |  |
| `fwdup` | Napred i gore: kosi potisak. | `fwdup` |  |
| `fwddown` | Napred i dole: potisak na negativnoj kosini. | `fwddown` |  |
| `backdown` | Nazad i dole: visoko veslanje. | `backdown` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `mac.contact`: Gde pokretni deo sprave dodiruje vaše telo? {#maccontact-where-does-the-moving-part-of-the-machine-meet-your-body}

- **Popunjava:** FXE l (mac) i FXI mesto držanja za mach.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i opterećenje je sprava za snagu; i ili ne važi (reč pokreta utvrđuje koja se sprava koristi), ili `changes` sadrži `machine`.
- **Uobičajeno:** FXE podrazumevana vrednost za taj vođeni pokret (podrazumevane vrednosti sprava u FXE), ili sprava koju imenuje reč pokreta.

Deo koji gurate ili vučete: ručke, platforma za stopala, jastuk na potkolenici. Na spravi za potpomognute zgibove ili propadanja odgovorite gde vas jastuk ili platforma za pomoć dodiruje (koleno ili stopalo): to ide u FXE. FXI potpomognutu spravu uvek piše kao mach@assist.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeno mesto za ovo kretanje | podrazumevana vrednost | Samostalno. Samo kada reč pokreta imenuje spravu, ili pravila daju podrazumevano mesto dodira za vođeni pokret. |
| `hand` | Ručke ili šipka u šakama. | `hand` |  |
| `foot` | Platforma za stopala ili pedale. | `foot` |  |
| `ankle` | Jastuk na potkolenici. | `ankle` |  |
| `thigh` | Jastuk na butini. | `thigh` |  |
| `knee` | Jastuk ili platforma kod kolena. | `knee` |  |
| `arm` | Jastuk na nadlaktici ili laktu. | `arm` |  |
| `chest` | Jastuk na grudima. | `chest` |  |
| `back` | Jastuk na leđima. | `back` |  |
| `shoulder` | Jastuci na ramenima. | `shoulder` |  |
| `hip` | Jastuk ili pojas kod kukova. | `hip` |  |
| `head` | Jastuk na glavi. | `head` |  |
| `seat` | Pokretno sedište. | `seat` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `mac.chest`: Da li vam jastuk podupire grudi dok radite? {#macchest-does-a-pad-support-your-chest-while-you-work}

- **Popunjava:** FXE s (položaj za mac).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i opterećenje je sprava za snagu; i ili ne važi (reč pokreta utvrđuje koja se sprava koristi), ili `changes` sadrži `machine`.
- **Uobičajeno:** Bez jastuka za grudi, osim ako reč pokreta imenuje spravu koja ga ima (sprava za veslanje).

Jastuk za grudi na spravi za veslanje ili na spravi za podizanje na prste u pretklonu (donkey). Ostatak položaja na spravi očitava se iz položaja vašeg tela.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni način za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `yes` | Da |  |  |
| `no` | Ne |  |  |

#### `erg.type`: Koja kardio sprava? {#ergtype-which-cardio-machine}

- **Popunjava:** FXE slojeve za k:erg i FXI mesto držanja za erg.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i opterećenje je kardio sprava; i ili ne važi (reč pokreta utvrđuje koja se kardio sprava koristi), ili `changes` sadrži `machine`.
- **Uobičajeno:** Sprava koju imenuje reč pokreta.

Izaberite tip. Ako znate samo da je to sobni bicikl ili sprava za stepenice, izaberite unos „nije poznato“.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajena sprava za ovaj pokret | podrazumevana vrednost | Samostalno. Samo kada reč pokreta utvrđuje koja se kardio sprava koristi. |
| `treadmill` | Traka za trčanje | `treadmill` |  |
| `stepmill` | Stepmill (pokretne stepenice) | `stepmill` |  |
| `stepper` | Stepper (pedale) | `stepper` |  |
| `stair` | Sprava za stepenice, stepper ili stepmill, nije poznato | `stair` |  |
| `bike-upright` | Uspravni ili spin bicikl | `bike-upright` |  |
| `bike-recumbent` | Ležeći bicikl | `bike-recumbent` |  |
| `bike` | Sobni bicikl, uspravni ili ležeći, nije poznato | `bike` |  |
| `air-bike` | Air bike (pokretne ručke) | `air-bike` |  |
| `elliptical` | Eliptični trenažer | `elliptical` |  |
| `rower` | Veslački ergometar | `rower` |  |
| `ski` | Ski ergometar | `ski` |  |
| `ube` | Ergometar za gornji deo tela (ručne pedale, u sedu) | `ube` |  |
| `vertical-climber` | Vertikalni penjač | `vertical-climber` |  |
| `ladder-climber` | Penjač po lestvama | `ladder-climber` |  |
| `unknown` | Kardio sprava čiji tip ne znam | `?` | Samostalno. |

#### `symmetry`: Kako rade dve strane? {#symmetry-how-do-the-two-sides-work}

- **Popunjava:** FXI x.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i ili `changes` sadrži `sides`, ili je pokret „other“, ili je vlasnik rekao da se pokret u zglobovima razlikuje od reči pokreta.
- **Uobičajeno:** Ono što kaže reč pokreta, inače obe strane zajedno.

Izvođenje svih ponavljanja na jednoj strani, pa zamena, razlikuje se od smenjivanja strana iz ponavljanja u ponavljanje. Recipročno znači da se obe strane istovremeno kreću u suprotnim smerovima: hodanje, makazice, naizmenični talasi užetom. Istezanje ili valjanje koje radi jedan ekstremitet, pa drugi, je „jedna strana, pa druga“. Noge koje okreću pedale su recipročne čak i kada se trup naizmenično okreće na svaku stranu (bicikl kranč); samo okretanje trupa nema strane.

*Režim uvoza:* samo iz naziva i polja. „Alternating“ znači da se strane smenjuju samo kada se ništa drugo u nazivu ne smenjuje („alternating front and lateral raise“ smenjuje dva podizanja).

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni način za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `b` | Obe strane zajedno, ili pokret nema strane | `b` |  |
| `u` | Jedna strana radi sva ponavljanja, pa druga strana | `u` |  |
| `a` | Strane se smenjuju iz ponavljanja u ponavljanje | `a` |  |
| `rc` | Obe strane se istovremeno kreću u suprotnim smerovima | `rc` |  |
| `split` | Ruke i noge prate različite obrasce (jednoručno nošenje) |  |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `symmetry.scope`: Da li se taj obrazac odnosi samo na ruke, samo na noge ili na svaki radni ekstremitet? {#symmetryscope-does-that-pattern-apply-to-the-arms-only-the-legs-only-or-every-working-limb}

- **Popunjava:** FXI x (obuhvat).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `symmetry` je `u` ili `a` ili `rc`.
- **Uobičajeno:** Svaki radni ekstremitet.

Zamah girjom jednom rukom odnosi se samo na ruke: noge i dalje rade zajedno.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Svaki radni ekstremitet (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `arms` | Samo ruke | `arms` |  |
| `legs` | Samo noge | `legs` |  |

#### `symmetry.arms`: Kako rade ruke? {#symmetryarms-how-do-the-arms-work}

- **Popunjava:** FXI x (stavka sa obuhvatom).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `symmetry` je `split`.
- **Uobičajeno:** Obe strane zajedno.

Jednoručno nošenje (suitcase carry): noge su recipročne, ruke jedna strana, pa druga.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Obe zajedno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `b` | Obe zajedno | `b` |  |
| `u` | Jedna strana, pa druga | `u` |  |
| `a` | Smenjivanje iz ponavljanja u ponavljanje | `a` |  |
| `rc` | Istovremeno, u suprotnim smerovima | `rc` |  |

#### `symmetry.legs`: Kako rade noge? {#symmetrylegs-how-do-the-legs-work}

- **Popunjava:** FXI x (stavka sa obuhvatom).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `symmetry` je `split`.
- **Uobičajeno:** Obe strane zajedno.

Jednoručno nošenje (suitcase carry): noge su recipročne, ruke jedna strana, pa druga.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Obe zajedno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `b` | Obe zajedno | `b` |  |
| `u` | Jedna strana, pa druga | `u` |  |
| `a` | Smenjivanje iz ponavljanja u ponavljanje | `a` |  |
| `rc` | Istovremeno, u suprotnim smerovima | `rc` |  |

#### `grip.hand`: Kuda su okrenuti dlanovi? {#griphand-which-way-do-the-palms-face}

- **Popunjava:** FXI g (šaka).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `hand`.
- **Uobičajeno:** Ono što kaže reč pokreta, inače pothvat za pregib i nathvat za sve ostalo.

Nathvat znači dlanove nadole ili od vas; pothvat dlanove nagore ili ka vama; neutralni hvat dlanove okrenute jedan ka drugom. Okret tokom ponavljanja (Zotmanov pregib, Arnoldov potisak) je „okreću se“. Hvat koji nameće rekvizit i dalje se računa: paralelne ručke (farmerske ručke ili ručke rikše) ili uže su „neutralni“. Samo neutralni hvat trap šipke izostavlja enkoder.

*Režim uvoza:* „reverse grip“ u nazivu znači hvat suprotan uobičajenom hvatu reči pokreta: nathvat kod pregiba, pothvat drugde.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni način za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `pr` | Nathvat | `pr` |  |
| `su` | Pothvat | `su` |  |
| `ne` | Neutralni | `ne` |  |
| `mx` | Mešoviti: jedna nathvatom, jedna pothvatom | `mx` |  |
| `turn` | Dlanovi se okreću tokom ponavljanja |  |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `grip.start`: Kuda su okrenuti dlanovi na početku? {#gripstart-which-way-do-the-palms-face-at-the-start}

- **Popunjava:** FXI g (šaka, po fazama).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `hand`; i `grip.hand` je `turn`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Zotmanov pregib počinje pothvatom i završava se nathvatom.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `pr` | Nathvat | `pr` |  |
| `su` | Pothvat | `su` |  |
| `ne` | Neutralni | `ne` |  |
| `mx` | Mešoviti | `mx` |  |

#### `grip.end`: Kuda su okrenuti na kraju radnog pokreta? {#gripend-which-way-do-they-face-at-the-end-of-the-working-movement}

- **Popunjava:** FXI g (šaka, po fazama).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `hand`; i `grip.hand` je `turn`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Zotmanov pregib počinje pothvatom i završava se nathvatom.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `pr` | Nathvat | `pr` |  |
| `su` | Pothvat | `su` |  |
| `ne` | Neutralni | `ne` |  |
| `mx` | Mešoviti | `mx` |  |

#### `grip.width`: Koliko su šake razmaknute? {#gripwidth-how-far-apart-are-the-hands}

- **Popunjava:** FXI g (širina).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `width`.
- **Uobičajeno:** Ono što kaže reč pokreta, inače otprilike u širini ramena.

Na rekvizitu ili na osloncu: u dijamantskom skleku šake se dodiruju.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajena širina za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `touching` | Dodiruju se ili preklapaju | `w-t` |  |
| `narrow` | Uže od širine ramena | `w-n` |  |
| `medium` | Otprilike u širini ramena | `w-m` |  |
| `wide` | Znatno šire od ramena | `w-w` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `stance`: Koliko su stopala razmaknuta? {#stance-how-far-apart-are-the-feet}

- **Popunjava:** FXI g (stav).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `stance`.
- **Uobičajeno:** Ono što kaže reč pokreta, inače otprilike u širini kukova.

Samo za vežbe u stojećem stavu i za stopala na platformi sprave (nožna presa). Raskoračni stav je rad nogu, a ne stav.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni stav za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `narrow` | Stopala skupljena ili bliža od širine kukova | `st-n` | Samo kada je položaj tela na početku stojeći, stojeći u pretklonu, bilo koji ili nepoznat; ili kada stopala potiskuju platformu sprave (nožna presa). |
| `medium` | Otprilike u širini kukova | `st-m` | Samo kada je položaj tela na početku stojeći, stojeći u pretklonu, bilo koji ili nepoznat; ili kada stopala potiskuju platformu sprave (nožna presa). |
| `wide` | Širok (sumo) | `st-w` | Samo kada je položaj tela na početku stojeći, stojeći u pretklonu, bilo koji ili nepoznat; ili kada stopala potiskuju platformu sprave (nožna presa). |
| `unknown` | Ne znam | `?` | Samostalno. Samo kada je položaj tela na početku stojeći, stojeći u pretklonu, bilo koji ili nepoznat; ili kada stopala potiskuju platformu sprave (nožna presa). |

#### `range.depth`: Koliki deo obima pokreta koristi svako ponavljanje? {#rangedepth-how-much-of-the-range-does-each-rep-use}

- **Popunjava:** FXI r (obim).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `depth`.
- **Uobičajeno:** Ono što kaže reč pokreta, inače pun uobičajeni obim pokreta.

Visina kutije ili stepenika i male promene ugla su preskripcija i nikada se ne računaju. Kutija na koju sedate je oslonac.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni obim pokreta za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `full` | Pun uobičajeni obim pokreta | (bez prefiksa) |  |
| `partial` | Namerno deo obima pokreta: polovina, četvrtina, pulsiranja | `partial` |  |
| `deep` | Dublje nego obično: puna dubina, ass to grass | `deep` |  |
| `deficit` | Dublje nego obično, stajanjem na nečemu (deficit) | `deficit` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `range.start`: Odakle počinje svako ponavljanje? {#rangestart-where-does-each-rep-start}

- **Popunjava:** FXI r (početak).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `start`.
- **Uobičajeno:** Uobičajeni početak pokreta.

Samo kada to nije uobičajeni početak pokreta. Mrtvo dizanje obično počinje sa poda; rumunsko mrtvo dizanje i veslanje odozgo; nabačaj ili trzaj girjom iz zamaha (nabačaj iz mrtvog položaja počinje sa poda).

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni početak za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `from-floor` | Sa poda, opterećenje miruje u svakom ponavljanju | `from-floor` |  |
| `from-top` | Iz visa iznad kolena: stojeći sa opterećenjem u rukama, spušteno bez odlaganja | `from-top` |  |
| `from-top.knee` | Iz visa u visini kolena ili ispod | `from-top.knee` |  |
| `from-pins` | Sa graničnika, blokova ili stalka iznad poda | `from-pins` |  |
| `from-drop` | Iz pada: silazak sa kutije i najpre doskok (dubinski skok) | `from-drop` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `held`: Koji položaj drže ekstremiteti koji ne rade? {#held-what-do-the-limbs-that-do-not-work-hold}

- **Popunjava:** FXI h.
- **Izbor:** jedna ili više.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `held`.
- **Uobičajeno:** Ono što kaže reč pokreta, inače bez zadržanog položaja.

Izaberite svaki zadržani položaj sa kojim se vaša vežba izvodi, bez obzira na to da li to njen naziv kaže. Trenerska uputa („drži grudi gore“) nije zadržani položaj. Šake iza glave bez ikakvog opterećenja tamo su „šake iza glave“, a ne linija vuče.

*Režim uvoza:* samo iz naziva, kroz leksikon uvoza: prisoner, pistol, arms crossed, „arms extended“ ili „straight arm“ (ruke napred), „bent arm“ ili 90 degree (savijeni laktovi), „behind head“ bez ikakvog opterećenja iza glave.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni način za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `none` | Bez zadržanog položaja: ekstremiteti koji ne rade čine ono što podrazumeva reč pokreta (podrazumevano, nikada se ne piše). | `none` | Samostalno. |
| `arms.oh` | Ruke opružene iznad glave, ništa u šakama. | `arms.oh` |  |
| `arms.fwd` | Ruke opružene i ispružene napred iz ramena, ništa u šakama („arms extended“, „straight arm“). | `arms.fwd` |  |
| `arms.side` | Ruke ispružene u stranu. | `arms.side` |  |
| `arms.cross` | Ruke prekrštene na grudima. | `arms.cross` |  |
| `hands.head` | Šake iza glave ili na glavi (prisoner). | `hands.head` |  |
| `el.bent` | Radni laktovi savijeni pod oko 90° („bent arm“, „90 degree“). | `el.bent` |  |
| `ua.oh` | Nadlaktice podignute uz glavu dok laktovi rade (opružanje za triceps iznad glave). | `ua.oh` |  |
| `ua.side` | Nadlaktice odmaknute od tela, laktovi rašireni, dok laktovi rade (pregib za unutrašnji biceps, Tejt potisak). | `ua.side` |  |
| `leg.fwd` | Slobodna noga opružena napred. | `leg.fwd` |  |
| `leg.back` | Slobodna noga iza. | `leg.back` |  |
| `legs.l` | Noge opružene, pri fleksiji kuka od oko 90°. | `legs.l` |  |
| `kn.bent` | Kolena savijena dok rade kukovi ili ruke (podizanje kolena u visu; obrnuto veslanje sa stopalima ravno na podu). | `kn.bent` |  |
| `trunk.fwd` | Trup nagnut napred tamo gde to orijentacija već ne kaže (propadanje za grudi). | `trunk.fwd` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `line`: Odakle opterećenje vuče, u poređenju sa uobičajenim načinom? {#line-where-does-the-load-pull-from-compared-with-the-usual-way}

- **Popunjava:** FXI p.
- **Izbor:** jedna ili više.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `line`.
- **Uobičajeno:** Linija koju podrazumeva reč pokreta.

Uobičajena sidrišta: nisko za pregibe, podizanja, veslanje uspravno, sleganje ramenima, opružanja unazad i rad kukovima; visoko za potiske naniže, povlačenja naniže, povlačenja ka licu, kranč u klečanju i sečenje drva; u sredini za veslanja, razvlačenja, ukrštanja na kablu, rotacije i potiske za grudi; sa strane za Palof potisak. Odgovorite „visoko“ ili „nisko“ samo kada se vaše razlikuje; sidrište na podu (sanke na tlu, elastična traka pod stopalima) je nisko. „Low row“ ili „low pulley“ u nazivu je sprava, a ne linija. Šipka spuštena do vrata ili grla (JM potisak, giljotina potisak) i uže koje u svakom skoku prolazi dvaput (dupli preskok) takođe su linije.

*Režim uvoza:* samo iz naziva, kroz leksikon uvoza.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajena linija za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `hi` | Sidrište više nego obično (odozgo nadole) | `hi` |  |
| `lo` | Sidrište niže nego obično (odozdo nagore) | `lo` |  |
| `side` | Vuče sa jedne strane: stojite bočno u odnosu na sidrište | `side` |  |
| `behind` | Opterećenje ili telo prolazi iza glave ili trupa (potisak iza vrata, zgib iza glave) | `behind` |  |
| `neck` | Opterećenje se spušta do vrata, grla ili brade umesto do grudi (JM potisak, giljotina potisak) | `neck` |  |
| `double` | Uže prolazi ispod stopala dvaput u svakom skoku (dupli preskok) | `double` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `accessory`: Šta pomaže vežbi a da je ne opterećuje? {#accessory-what-helps-the-exercise-without-loading-it}

- **Popunjava:** FXI a (prošireni).
- **Izbor:** jedna ili više.
- **Postavlja se kada:** predmet opisa je vežba (uobičajeni odgovor na „subject“); i `changes` sadrži `accessory`.
- **Uobičajeno:** Ono što kaže reč pokreta, inače bez pomagala.

Kaiš, pojas, peškir ili uže kojim se vuče ili drži ekstremitet (kaiš za istezanje), ili partner koji drži, pruža otpor ili pomaže. Ručka na kablu nije pomagalo.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni način za ovaj pokret | podrazumevana vrednost | Samostalno. |
| `none` | Bez pomagala (podrazumevano, nikada se ne piše). | `none` | Samostalno. |
| `strap` | Kaiš, pojas, peškir ili uže kojim se vuče ili drži ekstremitet (kaiš za istezanje). | `strap` |  |
| `partner` | Partner koji drži, pruža otpor ili pomaže. | `partner` |  |

#### `eq.kind`: Koja je vrsta opreme? {#eqkind-what-kind-of-equipment-is-it}

- **Popunjava:** FXE k.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Sprava izgrađena za jedan pokret je sprava za snagu. Stub sa sajlom, Smit sprava ili landmine služe za mnogo pokreta: to je stanica.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `none` | Bez opreme: telesna masa | `none` |  |
| `imp` | Predmet koji se pomera, drži ili nosi na telu | `imp` |  |
| `sup` | Površina ili konstrukcija na koju se telo oslanja, o koju visi ili od koje se odguruje | `sup` |  |
| `acc` | Ručka, kaiš, pojas, prostirka, peškir ili oznaka | `acc` |  |
| `stn` | Stub sa sajlom, Smit sprava ili landmine | `stn` |  |
| `mac` | Sprava za snagu izgrađena za jedan pokret | `mac` |  |
| `erg` | Kardio sprava | `erg` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq.form.imp`: Šta je to tačno? {#eqformimp-which-one-is-it}

- **Popunjava:** FXE f.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `imp`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Izaberite podvrstu (superband, miniband) samo kada je znate. Inače izaberite opšti unos.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `bar.straight` | Šipka, olimpijska ili standardna. | `bar.straight` |  |
| `bar.ez` | EZ šipka. | `bar.ez` |  |
| `bar.trap` | Trap ili heksagonalna šipka. | `bar.trap` |  |
| `bar.axle` | Debela šipka (axle). | `bar.axle` |  |
| `bar.camber` | Zakrivljena šipka. | `bar.camber` |  |
| `bell.dumb` | Bučica. | `bell.dumb` |  |
| `bell.kettle` | Girja. | `bell.kettle` |  |
| `bell.circus` | Cirkuska bučica. | `bell.circus` |  |
| `ball.med` | Medicinka. | `ball.med` |  |
| `ball.slam` | Slam lopta. | `ball.slam` |  |
| `bag.sand` | Vreća sa peskom. | `bag.sand` |  |
| `bag.heavy` | Viseći džak. | `bag.heavy` |  |
| `plate` | Disk koji se samostalno drži ili nosi. | `plate` |  |
| `chain` | Lanac za dizanje. | `chain` |  |
| `rope.battle` | Bojno uže. | `rope.battle` |  |
| `rope.jump` | Vijača. | `rope.jump` |  |
| `band` | Elastična traka ili cev, tip nije naveden. | `band` |  |
| `band.loop` | Duga zatvorena traka: superband, power band. | `band.loop` |  |
| `band.mini` | Kratka zatvorena traka oko nogu: miniband. | `band.mini` |  |
| `band.tube` | Elastična cev sa ručkama. | `band.tube` |  |
| `sled` | Sanke ili prowler, koji se guraju ili vuku. | `sled` |  |
| `tire` | Velika guma. | `tire` |  |
| `hammer` | Malj. | `hammer` |  |
| `stone` | Atlas kamen. | `stone` |  |
| `log` | Strongman balvan (log). | `log` |  |
| `keg` | Bure. | `keg` |  |
| `yoke` | Strongman jaram. | `yoke` |  |
| `frame.carry` | Farmerske ručke ili ram za nošenje (rikša). | `frame.carry` |  |
| `car` | Automobil, koji se podiže ili gura. | `car` |  |
| `wear.vest` | Prsluk sa tegom. | `wear.vest` |  |
| `wear.ankle` | Teg za skočni zglob. | `wear.ankle` |  |
| `club` | Indijska palica ili buzdovan. | `club` |  |
| `stick` | Štap, drška metle ili PVC cev. | `stick` |  |
| `wheel` | Točak za trbušnjake. | `wheel` |  |
| `roller.wrist` | Valjak za ručne zglobove. | `roller.wrist` |  |
| `harness.head` | Remenje za glavu sa visećim opterećenjem. | `harness.head` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq.form.sup`: Šta je to tačno? {#eqformsup-which-one-is-it}

- **Popunjava:** FXE f.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `sup`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Izaberite podvrstu (superband, miniband) samo kada je znate. Inače izaberite opšti unos.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `floor` | Pod, ili prostirka na njemu. | `floor` |  |
| `wall` | Zid. | `wall` |  |
| `bench` | Klupa, ravna ili podesiva. | `bench` |  |
| `box` | Kutija, stepenik ili platforma. | `box` |  |
| `chair` | Stolica. | `chair` |  |
| `block` | Blokovi za dizanje sa kojih šipka kreće. | `block` |  |
| `rack` | Kavez (power rack) ili stalak za čučanj, sa graničnicima. | `rack` |  |
| `ball.stab` | Pilates lopta, švajcarska lopta ili lopta za vežbanje. | `ball.stab` |  |
| `dome` | BOSU, bilo koja strana nagore. | `dome` |  |
| `board.bal` | Balans daska ili ljuljajuća daska. | `board.bal` |  |
| `roller.foam` | Penasti valjak. | `roller.foam` |  |
| `slider` | Disk klizač. | `slider` |  |
| `strap.susp` | Suspenzioni trenažer. | `strap.susp` |  |
| `ring` | Gimnastički krugovi. | `ring` |  |
| `rope.climb` | Uže za penjanje. | `rope.climb` |  |
| `bar.fixed` | Fiksna šipka iznad glave: vratilo. | `bar.fixed` |  |
| `bar.parallel` | Razboj za propadanja. | `bar.parallel` |  |
| `bar.parallette` | Paralete za pod. | `bar.parallette` |  |
| `pad.preacher` | Skotova klupa. | `pad.preacher` |  |
| `pad.hyper` | Klupa za hiperekstenzije, 45° ili 90° (zove se i rimska stolica za podizanja leđima ili bočno). | `pad.hyper` |  |
| `pad.ghd` | GHD sprava (glute-ham developer). | `pad.ghd` |  |
| `station.vkr` | Vertikalna stanica za podizanje kolena (kapetanska stolica). | `station.vkr` |  |
| `pole` | Uspravni stub, šipka ili uspravni nosač stalka koji drže šake. | `pole` |  |
| `ball.massage` | Loptica za masažu ili lakros loptica koja se valja pod telom. | `ball.massage` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq.form.acc`: Šta je to tačno? {#eqformacc-which-one-is-it}

- **Popunjava:** FXE f.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `acc`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Izaberite podvrstu (superband, miniband) samo kada je znate. Inače izaberite opšti unos.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `handle` | Pojedinačna D-ručka. | `handle` |  |
| `handle.bar` | Prava ili zakrivljena šipka za kabl. | `handle.bar` |  |
| `handle.v` | V-ručka ili ručka za uski hvat. | `handle.v` |  |
| `handle.rope` | Uže za triceps. | `handle.rope` |  |
| `strap.ankle` | Manžetna za skočni zglob. | `strap.ankle` |  |
| `belt.dip` | Pojas za propadanja. | `belt.dip` |  |
| `belt.lift` | Pojas za dizanje. | `belt.lift` |  |
| `strap.lift` | Trake za dizanje. | `strap.lift` |  |
| `strap.stretch` | Kaiš za istezanje: kaiš, pojas ili zatvorena traka kojom se vuče ekstremitet pri istezanju. | `strap.stretch` |  |
| `towel` | Peškir koji služi kao ručka. | `towel` |  |
| `marker` | Čunj, prepona ili oznaka na podu. | `marker` |  |
| `board.press` | Daska položena na grudi za delimične potiske. | `board.press` |  |
| `mat` | Prostirka za pod. | `mat` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq.form.stn`: Šta je to tačno? {#eqformstn-which-one-is-it}

- **Popunjava:** FXE f.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `stn`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Izaberite podvrstu (superband, miniband) samo kada je znate. Inače izaberite opšti unos.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `cable` | Stub sa sajlom, crossover ili funkcionalni trenažer: kotur koji se podešava za svaku vežbu. | `cable` |  |
| `smith` | Smit sprava: šipka na fiksnim šinama. | `smith` |  |
| `landmine` | Landmine: jedan kraj šipke u podnoj osovini (i T-bar veslanje iz ugla). | `landmine` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq.mac.motion`: Koji pokret sprava vodi? {#eqmacmotion-what-does-the-machine-guide}

- **Popunjava:** FXE m (mac).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Odgovorite za spravu onakvu kakva je izgrađena, a ne za vežbu koja se na njoj izvodi. Podizanje na prste na nožnoj presi koristi nožnu presu: odgovorite „gura od vas“. Osovina poravnata sa jednim zglobom znači jednozglobnu spravu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `push` | *Višezglobna:* Gura od vas: višezglobna sprava za potisak ili čučanj |  |  |
| `pull` | Vuče ka vama: višezglobna sprava za veslanje, povlačenje naniže ili mrtvo dizanje |  |  |
| `assist` | Pomaže da se telo podigne: sprava za potpomognute zgibove ili propadanja |  |  |
| `kn.flex` | *Osovina u jednom zglobu:* Koleno se savija (pregib nogu) | `kn.flex` |  |
| `kn.ext` | Koleno se opruža (opružanje nogu) | `kn.ext` |  |
| `el.flex` | Lakat se savija (sprava za pregib) | `el.flex` |  |
| `el.ext` | Lakat se opruža (sprava za triceps) | `el.ext` |  |
| `sh.hadd` | Ruke se spajaju ispred (pec deck) | `sh.hadd` |  |
| `sh.habd` | Ruke se razdvajaju (sprava za zadnje rame) | `sh.habd` |  |
| `sh.abd` | Ruke se podižu u stranu (sprava za odručenje) | `sh.abd` |  |
| `sh.ext` | Ruke vuku nadole ispred tela (sprava za pulover) | `sh.ext` |  |
| `sh.flex` | Ruke se podižu napred | `sh.flex` |  |
| `sh.add` | Ruke vuku nadole sa strane | `sh.add` |  |
| `sh.ir` | Rame rotira unutra | `sh.ir` |  |
| `sh.er` | Rame rotira spolja | `sh.er` |  |
| `sc.elev` | Sleganje ramenima | `sc.elev` |  |
| `hip.flex` | Kuk se savija (sprava za podizanje nogu ili kolena) | `hip.flex` |  |
| `hip.ext` | Kuk se opruža (opružanje kuka unazad, potisak kukovima, obrnuta hiperekstenzija) | `hip.ext` |  |
| `hip.abd` | Noge se razmiču (abduktor) | `hip.abd` |  |
| `hip.add` | Noge se skupljaju (aduktor) | `hip.add` |  |
| `sp.flex` | Trup se savija (sprava za trbušnjake) | `sp.flex` |  |
| `sp.ext` | Trup se opruža (sprava za hiperekstenziju) | `sp.ext` |  |
| `sp.rot` | Trup se uvija (rotary torso) | `sp.rot` |  |
| `sp.lflex` | Trup se savija u stranu | `sp.lflex` |  |
| `ank.pf` | Podizanje na prste (sprava za listove) | `ank.pf` |  |
| `ank.df` | Prsti se povlače nagore (sprava za tibijalis) | `ank.df` |  |
| `nk.flex` | Vrat se savija | `nk.flex` |  |
| `nk.ext` | Vrat se opruža | `nk.ext` |  |
| `nk.lflex` | Vrat se savija u stranu | `nk.lflex` |  |
| `wr.flex` | Ručni zglob se savija | `wr.flex` |  |
| `wr.ext` | Ručni zglob se opruža | `wr.ext` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq.mac.direction`: U kom smeru se, u odnosu na vaš trup, pomera ručka, jastuk ili platforma dok radite? {#eqmacdirection-which-way-does-the-handle-pad-or-plate-move-relative-to-your-trunk-while-you-work}

- **Popunjava:** FXE m (smer za mac).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.mac.motion` je `push` ili `pull` ili `assist`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Gore je ka glavi, dole ka stopalima, napred je od prednje strane trupa.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `up` | Ka glavi: potisak za ramena, hack čučanj, belt čučanj, sprava za mrtvo dizanje. | `up` |  |
| `down` | Ka stopalima: povlačenje naniže, propadanje u sedu. | `down` |  |
| `fwd` | Od prednje strane trupa: potisak za grudi, nožna presa. | `fwd` |  |
| `back` | Ka prednjoj strani trupa: veslanje. | `back` |  |
| `fwdup` | Napred i gore: kosi potisak. | `fwdup` |  |
| `fwddown` | Napred i dole: potisak na negativnoj kosini. | `fwddown` |  |
| `backdown` | Nazad i dole: visoko veslanje. | `backdown` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq.mac.contact`: Gde pokretni deo sprave dodiruje vaše telo? {#eqmaccontact-where-does-the-moving-part-of-the-machine-meet-your-body}

- **Popunjava:** FXE l (mac).
- **Izbor:** jedna ili više (najviše 2).
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`.
- **Uobičajeno:** FXE podrazumevana vrednost za taj vođeni pokret (podrazumevane vrednosti sprava u FXE), ili sprava koju imenuje reč pokreta.

Izaberite dva samo kada oba pomeraju opterećenje (air bike se pokreće i šakama i stopalima).

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeno mesto za ovo kretanje | podrazumevana vrednost | Samostalno. Samo kada pravila daju podrazumevano mesto dodira za vođeni pokret opreme. |
| `hand` | Ručke ili šipka u šakama. | `hand` |  |
| `foot` | Platforma za stopala ili pedale. | `foot` |  |
| `ankle` | Jastuk na potkolenici. | `ankle` |  |
| `thigh` | Jastuk na butini. | `thigh` |  |
| `knee` | Jastuk ili platforma kod kolena. | `knee` |  |
| `arm` | Jastuk na nadlaktici ili laktu. | `arm` |  |
| `chest` | Jastuk na grudima. | `chest` |  |
| `back` | Jastuk na leđima. | `back` |  |
| `shoulder` | Jastuci na ramenima. | `shoulder` |  |
| `hip` | Jastuk ili pojas kod kukova. | `hip` |  |
| `head` | Jastuk na glavi. | `head` |  |
| `seat` | Pokretno sedište. | `seat` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq.mac.posture`: U koji položaj sprava postavlja korisnika? {#eqmacposture-what-position-does-the-machine-put-the-user-in}

- **Popunjava:** FXE s (mac).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`.
- **Uobičajeno:** FXE podrazumevana vrednost za taj vođeni pokret (podrazumevane vrednosti sprava u FXE).

Svaka nožna presa je „recline“; hack, pendulum i belt čučnjevi su „stand“; namenska sprava za veslanje je „seat.chest“.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni položaj za ovo kretanje | podrazumevana vrednost | Samostalno. |
| `seat` | Sedeći. | `seat` |  |
| `seat.chest` | Sedeći, grudima uz jastuk. | `seat.chest` |  |
| `stand` | Stojeći. | `stand` |  |
| `stand.chest` | Stojeći ili u pretklonu, trup na jastuku. | `stand.chest` |  |
| `prone` | Ležeći licem nadole, ravno ili koso. | `prone` |  |
| `supine` | Ležeći na leđima. | `supine` |  |
| `recline` | Zavaljeno na kosom naslonu za leđa (nožna presa). | `recline` |  |
| `kneel` | Klečeći. | `kneel` |  |
| `hang` | Telo drže šake ili podlaktice. | `hang` |  |
| `side` | Ležeći na boku. | `side` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq.erg.type`: Koja kardio sprava? {#eqergtype-which-cardio-machine}

- **Popunjava:** FXE slojeve za k:erg.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `erg`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Ako znate samo da je to sobni bicikl ili sprava za stepenice, izaberite unos „nije poznato“.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `treadmill` | Traka za trčanje | `treadmill` |  |
| `stepmill` | Stepmill (pokretne stepenice) | `stepmill` |  |
| `stepper` | Stepper (pedale) | `stepper` |  |
| `stair` | Sprava za stepenice, stepper ili stepmill, nije poznato | `stair` |  |
| `bike-upright` | Uspravni ili spin bicikl | `bike-upright` |  |
| `bike-recumbent` | Ležeći bicikl | `bike-recumbent` |  |
| `bike` | Sobni bicikl, uspravni ili ležeći, nije poznato | `bike` |  |
| `air-bike` | Air bike (pokretne ručke) | `air-bike` |  |
| `elliptical` | Eliptični trenažer | `elliptical` |  |
| `rower` | Veslački ergometar | `rower` |  |
| `ski` | Ski ergometar | `ski` |  |
| `ube` | Ergometar za gornji deo tela (ručne pedale, u sedu) | `ube` |  |
| `vertical-climber` | Vertikalni penjač | `vertical-climber` |  |
| `ladder-climber` | Penjač po lestvama | `ladder-climber` |  |
| `unknown` | Kardio sprava čiji tip ne znam | `?` | Samostalno. |

#### `eq.details`: Želite li da zabeležite kako je izgrađena (izvor otpora, vođenje, ugao, dizajn)? {#eqdetails-do-you-want-to-record-how-it-is-built-drive-track-angle-design}

- **Popunjava:** FXE proširene slojeve.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `imp` ili `sup` ili `stn` ili `mac` ili `erg`.
- **Uobičajeno:** Bez detalja konstrukcije.

Ovi detalji idu samo u zapis opreme u registru. Redovi vežbi ih nikada ne nose.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Ne (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `yes` | Da |  |  |

#### `eq.drive`: Šta pruža otpor pokretu? {#eqdrive-what-resists-the-movement}

- **Popunjava:** FXE r.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.details` je `yes`; i `eq.kind` je `imp` ili `stn` ili `mac` ili `erg`.
- **Uobičajeno:** Nije navedeno.

Ostavite uobičajeno ako niste sigurni. Oblik koji podrazumeva svoj izvor otpora (bučica je slobodni teg) nikada ga ne zahteva.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `grav` | Slobodni teg pod dejstvom gravitacije. | `grav` |  |
| `stack` | Stek tegova sa selektorom. | `stack` |  |
| `plate` | Opterećenje diskovima. | `plate` |  |
| `elastic` | Elastični otpor. | `elastic` |  |
| `air` | Vazdušni ventilator. | `air` |  |
| `mag` | Magnetna kočnica. | `mag` |  |
| `water` | Rezervoar sa vodom. | `water` |  |
| `motor` | Motor. | `motor` |  |
| `friction` | Trenje. | `friction` |  |
| `hydraulic` | Hidraulični otpor. | `hydraulic` |  |
| `flywheel` | Zamajac (izoinercijski). | `flywheel` |  |
| `none` | Bez sopstvenog otpora. | `none` |  |

#### `eq.constraint`: Kako je vođen pokretni deo? {#eqconstraint-how-is-the-moving-part-guided}

- **Popunjava:** FXE c (mac, stn).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.details` je `yes`; i `eq.kind` je `stn` ili `mac`.
- **Uobičajeno:** Nije navedeno.

„Lever“ ili „leverage“ u nazivu sprave znači polugu na jednoj osovini. „Sled“ znači pravu stazu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `line` | Prava staza (sanke, šine). | `line` |  |
| `arc` | Poluga na jednoj osovini. | `arc` |  |
| `link` | Mehanizam sa više osovina. | `link` |  |
| `cable` | Kabl preko koturova. | `cable` |  |
| `pivot` | Jedan kraj u podnoj osovini. | `pivot` |  |

#### `eq.compliance`: Da li se pomera pod telom? {#eqcompliance-does-it-move-under-the-body}

- **Popunjava:** FXE c (imp, sup).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.details` je `yes`; i `eq.kind` je `imp` ili `sup`.
- **Uobičajeno:** Nije navedeno.

Pilates lopta se naginje, točak za trbušnjake se kotrlja. Oblik koji to podrazumeva nikada to ne zahteva.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `tilt` | Naginje se pod telom. | `tilt` |  |
| `roll` | Kotrlja se. | `roll` |  |
| `slide` | Klizi. | `slide` |  |
| `swing` | Visi i njiše se. | `swing` |  |

#### `eq.angle`: Pod kojim uglom je postavljena staza ili poluga? {#eqangle-at-what-angle-is-the-track-or-lever-set}

- **Popunjava:** FXE g.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.details` je `yes`; i `eq.kind` je `mac`.
- **Uobičajeno:** Nije navedeno.

Samo fiksna geometrija: nožna presa pod 45° je nagnuta.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `incl` | Nagnuto (nožna presa pod 45°). | `incl` |  |
| `horiz` | Horizontalno. | `horiz` |  |
| `vert` | Vertikalno. | `vert` |  |

#### `eq.attrs`: Koje konstrukcione karakteristike ima? {#eqattrs-which-design-features-does-it-have}

- **Popunjava:** FXE a.
- **Izbor:** jedna ili više.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.details` je `yes`; i `eq.kind` je `stn` ili `mac`.
- **Uobičajeno:** Ništa nije navedeno.

Izaberite svaku koja važi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Ništa nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `iso` | Nezavisni krakovi (izolateralno). | `iso` |  |
| `conv` | Konvergentna putanja. | `conv` |  |
| `cb` | Sa protivtegom (Smit). | `cb` |  |
| `dual` | Dva steka. | `dual` |  |

#### `eq.more`: Može li se sprava podesiti kao druga sprava (multi-hip, pec deck sa krakovima za zadnje rame, povlačenje naniže sa niskim veslanjem)? {#eqmore-can-the-machine-be-set-up-as-a-second-machine-multi-hip-pec-deck-with-rear-delt-arms-pulldown-with-low-row}

- **Popunjava:** FXE kombinaciju („;“).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`.
- **Uobičajeno:** Ne.

Odgovorite na pitanja o spravi još jednom, za drugu konfiguraciju.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Ne (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `yes` | Da |  |  |

#### `eq2.mac.motion`: Koji pokret sprava vodi? {#eq2macmotion-what-does-the-machine-guide}

- **Popunjava:** FXE m (mac).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.more` je `yes`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Odgovorite za spravu onakvu kakva je izgrađena, a ne za vežbu koja se na njoj izvodi. Podizanje na prste na nožnoj presi koristi nožnu presu: odgovorite „gura od vas“. Osovina poravnata sa jednim zglobom znači jednozglobnu spravu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `push` | *Višezglobna:* Gura od vas: višezglobna sprava za potisak ili čučanj |  |  |
| `pull` | Vuče ka vama: višezglobna sprava za veslanje, povlačenje naniže ili mrtvo dizanje |  |  |
| `assist` | Pomaže da se telo podigne: sprava za potpomognute zgibove ili propadanja |  |  |
| `kn.flex` | *Osovina u jednom zglobu:* Koleno se savija (pregib nogu) | `kn.flex` |  |
| `kn.ext` | Koleno se opruža (opružanje nogu) | `kn.ext` |  |
| `el.flex` | Lakat se savija (sprava za pregib) | `el.flex` |  |
| `el.ext` | Lakat se opruža (sprava za triceps) | `el.ext` |  |
| `sh.hadd` | Ruke se spajaju ispred (pec deck) | `sh.hadd` |  |
| `sh.habd` | Ruke se razdvajaju (sprava za zadnje rame) | `sh.habd` |  |
| `sh.abd` | Ruke se podižu u stranu (sprava za odručenje) | `sh.abd` |  |
| `sh.ext` | Ruke vuku nadole ispred tela (sprava za pulover) | `sh.ext` |  |
| `sh.flex` | Ruke se podižu napred | `sh.flex` |  |
| `sh.add` | Ruke vuku nadole sa strane | `sh.add` |  |
| `sh.ir` | Rame rotira unutra | `sh.ir` |  |
| `sh.er` | Rame rotira spolja | `sh.er` |  |
| `sc.elev` | Sleganje ramenima | `sc.elev` |  |
| `hip.flex` | Kuk se savija (sprava za podizanje nogu ili kolena) | `hip.flex` |  |
| `hip.ext` | Kuk se opruža (opružanje kuka unazad, potisak kukovima, obrnuta hiperekstenzija) | `hip.ext` |  |
| `hip.abd` | Noge se razmiču (abduktor) | `hip.abd` |  |
| `hip.add` | Noge se skupljaju (aduktor) | `hip.add` |  |
| `sp.flex` | Trup se savija (sprava za trbušnjake) | `sp.flex` |  |
| `sp.ext` | Trup se opruža (sprava za hiperekstenziju) | `sp.ext` |  |
| `sp.rot` | Trup se uvija (rotary torso) | `sp.rot` |  |
| `sp.lflex` | Trup se savija u stranu | `sp.lflex` |  |
| `ank.pf` | Podizanje na prste (sprava za listove) | `ank.pf` |  |
| `ank.df` | Prsti se povlače nagore (sprava za tibijalis) | `ank.df` |  |
| `nk.flex` | Vrat se savija | `nk.flex` |  |
| `nk.ext` | Vrat se opruža | `nk.ext` |  |
| `nk.lflex` | Vrat se savija u stranu | `nk.lflex` |  |
| `wr.flex` | Ručni zglob se savija | `wr.flex` |  |
| `wr.ext` | Ručni zglob se opruža | `wr.ext` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq2.mac.direction`: U kom smeru se, u odnosu na vaš trup, pomera ručka, jastuk ili platforma dok radite? {#eq2macdirection-which-way-does-the-handle-pad-or-plate-move-relative-to-your-trunk-while-you-work}

- **Popunjava:** FXE m (smer za mac).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.more` je `yes`; i `eq2.mac.motion` je `push` ili `pull` ili `assist`.
- **Uobičajeno:** nema objavljene podrazumevane vrednosti; odgovor određuje vrednost

Gore je ka glavi, dole ka stopalima, napred je od prednje strane trupa.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `up` | Ka glavi: potisak za ramena, hack čučanj, belt čučanj, sprava za mrtvo dizanje. | `up` |  |
| `down` | Ka stopalima: povlačenje naniže, propadanje u sedu. | `down` |  |
| `fwd` | Od prednje strane trupa: potisak za grudi, nožna presa. | `fwd` |  |
| `back` | Ka prednjoj strani trupa: veslanje. | `back` |  |
| `fwdup` | Napred i gore: kosi potisak. | `fwdup` |  |
| `fwddown` | Napred i dole: potisak na negativnoj kosini. | `fwddown` |  |
| `backdown` | Nazad i dole: visoko veslanje. | `backdown` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq2.mac.contact`: Gde pokretni deo sprave dodiruje vaše telo? {#eq2maccontact-where-does-the-moving-part-of-the-machine-meet-your-body}

- **Popunjava:** FXE l (mac).
- **Izbor:** jedna ili više (najviše 2).
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.more` je `yes`.
- **Uobičajeno:** FXE podrazumevana vrednost za taj vođeni pokret (podrazumevane vrednosti sprava u FXE), ili sprava koju imenuje reč pokreta.

Izaberite dva samo kada oba pomeraju opterećenje (air bike se pokreće i šakama i stopalima).

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeno mesto za ovo kretanje | podrazumevana vrednost | Samostalno. Samo kada pravila daju podrazumevano mesto dodira za vođeni pokret druge konfiguracije. |
| `hand` | Ručke ili šipka u šakama. | `hand` |  |
| `foot` | Platforma za stopala ili pedale. | `foot` |  |
| `ankle` | Jastuk na potkolenici. | `ankle` |  |
| `thigh` | Jastuk na butini. | `thigh` |  |
| `knee` | Jastuk ili platforma kod kolena. | `knee` |  |
| `arm` | Jastuk na nadlaktici ili laktu. | `arm` |  |
| `chest` | Jastuk na grudima. | `chest` |  |
| `back` | Jastuk na leđima. | `back` |  |
| `shoulder` | Jastuci na ramenima. | `shoulder` |  |
| `hip` | Jastuk ili pojas kod kukova. | `hip` |  |
| `head` | Jastuk na glavi. | `head` |  |
| `seat` | Pokretno sedište. | `seat` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq2.mac.posture`: U koji položaj sprava postavlja korisnika? {#eq2macposture-what-position-does-the-machine-put-the-user-in}

- **Popunjava:** FXE s (mac).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.more` je `yes`.
- **Uobičajeno:** FXE podrazumevana vrednost za taj vođeni pokret (podrazumevane vrednosti sprava u FXE).

Svaka nožna presa je „recline“; hack, pendulum i belt čučnjevi su „stand“; namenska sprava za veslanje je „seat.chest“.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Uobičajeni položaj za ovo kretanje | podrazumevana vrednost | Samostalno. |
| `seat` | Sedeći. | `seat` |  |
| `seat.chest` | Sedeći, grudima uz jastuk. | `seat.chest` |  |
| `stand` | Stojeći. | `stand` |  |
| `stand.chest` | Stojeći ili u pretklonu, trup na jastuku. | `stand.chest` |  |
| `prone` | Ležeći licem nadole, ravno ili koso. | `prone` |  |
| `supine` | Ležeći na leđima. | `supine` |  |
| `recline` | Zavaljeno na kosom naslonu za leđa (nožna presa). | `recline` |  |
| `kneel` | Klečeći. | `kneel` |  |
| `hang` | Telo drže šake ili podlaktice. | `hang` |  |
| `side` | Ležeći na boku. | `side` |  |
| `unknown` | Ne znam | `?` | Samostalno. |

#### `eq2.details`: Želite li da zabeležite kako je izgrađena (izvor otpora, vođenje, ugao, dizajn)? {#eq2details-do-you-want-to-record-how-it-is-built-drive-track-angle-design}

- **Popunjava:** FXE proširene slojeve.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.more` je `yes`; i `eq.kind` je `imp` ili `sup` ili `stn` ili `mac` ili `erg`.
- **Uobičajeno:** Bez detalja konstrukcije.

Ovi detalji idu samo u zapis opreme u registru. Redovi vežbi ih nikada ne nose.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Ne (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `yes` | Da |  |  |

#### `eq2.drive`: Šta pruža otpor pokretu? {#eq2drive-what-resists-the-movement}

- **Popunjava:** FXE r.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.more` je `yes`; i `eq2.details` je `yes`; i `eq.kind` je `imp` ili `stn` ili `mac` ili `erg`.
- **Uobičajeno:** Nije navedeno.

Ostavite uobičajeno ako niste sigurni. Oblik koji podrazumeva svoj izvor otpora (bučica je slobodni teg) nikada ga ne zahteva.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `grav` | Slobodni teg pod dejstvom gravitacije. | `grav` |  |
| `stack` | Stek tegova sa selektorom. | `stack` |  |
| `plate` | Opterećenje diskovima. | `plate` |  |
| `elastic` | Elastični otpor. | `elastic` |  |
| `air` | Vazdušni ventilator. | `air` |  |
| `mag` | Magnetna kočnica. | `mag` |  |
| `water` | Rezervoar sa vodom. | `water` |  |
| `motor` | Motor. | `motor` |  |
| `friction` | Trenje. | `friction` |  |
| `hydraulic` | Hidraulični otpor. | `hydraulic` |  |
| `flywheel` | Zamajac (izoinercijski). | `flywheel` |  |
| `none` | Bez sopstvenog otpora. | `none` |  |

#### `eq2.constraint`: Kako je vođen pokretni deo? {#eq2constraint-how-is-the-moving-part-guided}

- **Popunjava:** FXE c (mac, stn).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.more` je `yes`; i `eq2.details` je `yes`; i `eq.kind` je `stn` ili `mac`.
- **Uobičajeno:** Nije navedeno.

„Lever“ ili „leverage“ u nazivu sprave znači polugu na jednoj osovini. „Sled“ znači pravu stazu.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `line` | Prava staza (sanke, šine). | `line` |  |
| `arc` | Poluga na jednoj osovini. | `arc` |  |
| `link` | Mehanizam sa više osovina. | `link` |  |
| `cable` | Kabl preko koturova. | `cable` |  |
| `pivot` | Jedan kraj u podnoj osovini. | `pivot` |  |

#### `eq2.compliance`: Da li se pomera pod telom? {#eq2compliance-does-it-move-under-the-body}

- **Popunjava:** FXE c (imp, sup).
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.more` je `yes`; i `eq2.details` je `yes`; i `eq.kind` je `imp` ili `sup`.
- **Uobičajeno:** Nije navedeno.

Pilates lopta se naginje, točak za trbušnjake se kotrlja. Oblik koji to podrazumeva nikada to ne zahteva.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `tilt` | Naginje se pod telom. | `tilt` |  |
| `roll` | Kotrlja se. | `roll` |  |
| `slide` | Klizi. | `slide` |  |
| `swing` | Visi i njiše se. | `swing` |  |

#### `eq2.angle`: Pod kojim uglom je postavljena staza ili poluga? {#eq2angle-at-what-angle-is-the-track-or-lever-set}

- **Popunjava:** FXE g.
- **Izbor:** jedna.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.more` je `yes`; i `eq2.details` je `yes`; i `eq.kind` je `mac`.
- **Uobičajeno:** Nije navedeno.

Samo fiksna geometrija: nožna presa pod 45° je nagnuta.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `incl` | Nagnuto (nožna presa pod 45°). | `incl` |  |
| `horiz` | Horizontalno. | `horiz` |  |
| `vert` | Vertikalno. | `vert` |  |

#### `eq2.attrs`: Koje konstrukcione karakteristike ima? {#eq2attrs-which-design-features-does-it-have}

- **Popunjava:** FXE a.
- **Izbor:** jedna ili više.
- **Postavlja se kada:** predmet opisa je samostalni komad opreme; i `eq.kind` je `mac`; i `eq.more` je `yes`; i `eq2.details` je `yes`; i `eq.kind` je `stn` ili `mac`.
- **Uobičajeno:** Ništa nije navedeno.

Izaberite svaku koja važi.

| Opcija | Značenje | Upisuje | Napomena |
|---|---|---|---|
| `usual` | Ništa nije navedeno (uobičajeni način) | podrazumevana vrednost | Samostalno. |
| `iso` | Nezavisni krakovi (izolateralno). | `iso` |  |
| `conv` | Konvergentna putanja. | `conv` |  |
| `cb` | Sa protivtegom (Smit). | `cb` |  |
| `dual` | Dva steka. | `dual` |  |
<!-- /fds:generated -->
