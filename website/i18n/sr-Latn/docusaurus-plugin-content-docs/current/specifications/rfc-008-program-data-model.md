---
title: 'RFC-008: Model podataka trenažnog programa'
description: Trenažni planovi kroz više treninga — ciklusi, nedelje, smeštanje dana, progresija, grananje i granica privatnosti trenažnih maksimuma
sidebar_position: 8
keywords: [program, periodization, mesocycle, deload, schedule, progression, training max, data model, json schema, rfc]
---

# RFC-008: Specifikacija modela podataka trenažnog programa

**Status**: Nacrt
**Verzija**: 0.1.0
**Datum**: 2026-08-10
**Autori**: VITNESS tim
**Kategorija**: Standards Track

## Sažetak

Ova specifikacija definiše standardizovani model trenažnog programa — plana koji smešta treninge u vreme. Pokriva kako se plan deli na cikluse, nedelje i dane, kako se dan pozicionira, kako se preskripcija menja kako plan napreduje, i ko poseduje plan.

Centralna tvrdnja je strukturna: **program je raspored referenci na treninge, a ne kontejner treninga.** Trening korišćen ponedeljkom svake nedelje tokom dvanaest nedelja napisan je jednom, a pokazuje se na njega dvanaest puta. Trening koji dele četiri programa popravlja se jednom, i sva četiri su popravljena.

Sama preskripcija dolazi iz RFC-006, a struktura treninga iz RFC-007. Nijedno nije ovde ponovo iskazano. Ono što ovaj dokument dodaje jeste *vreme*: smeštanje, ponavljanje, progresija i uslovi pod kojima plan menja kurs.

## 1. Uvod

### 1.1. Pozadina

Formati razmene za trenažne planove tipično umeću svoje treninge. Svaki dan nosi punu kopiju treninga koji propisuje, pa dvanaestonedeljni plan sa tri treninga nedeljno sadrži trideset šest dokumenata treninga, većinom identičnih. Dupliranje nije samo rasipno — to je problem ispravnosti. Kada se ispostavi da je propisana vežba pogrešna, ne postoji jedno mesto na kome se to ispravlja, a plan popravljen u osam od svojih trideset šest kopija gori je od plana popravljenog ni u jednoj, jer se sada ne slaže sam sa sobom.

Drugi ponavljajući neuspeh je suptilniji. Planovi koji *jesu* personalizovani obično ugrade personalizaciju: dokument koji kaže „70% vašeg maksimuma u čučnju“ izvozi se kao dokument koji kaže „142,5 kg“. U tom trenutku plan je prestao da bude plan. Ne može da se deli, isti sportista ne može ponovo da ga izvede šest meseci kasnije, i tiho je stekao lične podatke koje format nikada nije bio projektovan da štiti.

Ovaj RFC zauzima suprotan stav po oba pitanja. Dani pokazuju na treninge. Vrednosti koje zavise od osobe deklarišu se kao slotovi i nikada se ne popunjavaju.

### 1.2. Ciljevi

1. Izraziti svaki model periodizacije iz §4.6 matrice scenarija i svaku strukturu raspoređivanja iz §4.7, bez polja po metodologiji.
2. Referencirati treninge (RFC-007) i komponovati primitive preskripcije (RFC-006) umesto ponovnog iskazivanja bilo kog od njih.
3. Zadržati plan preskriptivnim: program opisuje nameravano treniranje, nikada izvedeno treniranje.
4. Ostati unapred kompatibilan — model rasporeda definisan posle ove verzije NE SME da učini dokument nevažećim.
5. Ne sadržati nijedan lični podatak, uključujući vrednosti iz kojih bi personalizovan plan bio izračunat.

### 1.3. Obuhvat

**U obuhvatu:** struktura ciklusa i nedelja, smeštanje dana, dani odmora i opcioni dani, prilagođavanje po pojavljivanju, pravila progresije, uslovno usmeravanje, deklarisani ulazi izračunavanja, autorstvo i licenciranje.

**Van obuhvata:**

- Sami primitivi preskripcije (RFC-006)
- Struktura treninga — blokovi, režimi, grupisanje, serije (RFC-007)
- Podaci o izvedenom: šta je zaista urađeno, ko je uradio i kada (RFC-009, odloženo)
- Identitet sportiste, telesna masa i brojčana vrednost bilo kog maksimuma za jedno ponavljanje ili trenažnog maksimuma. Pogledajte §8 i RFC-006 §5.

## 2. Terminologija

Ključne reči MUST, MUST NOT, SHOULD, SHOULD NOT i MAY tumače se kako je opisano u RFC 2119.

- **Program** — plan koji smešta treninge u vreme.
- **Ciklus** — blok treniranja sa jednom namerom. Makro, mezo i mikro ciklusi svi su ciklusi.
- **Nedelja** — grupa dana unutar ciklusa.
- **Dan** — jedno raspoređeno mesto: ili referenca na trening, ili propisan odmor.
- **Model rasporeda** — kako se dan smešta u vreme.
- **Slot** — deklaracija da se program izračunava iz neke vrednosti, bez te vrednosti.

## 3. Osnovni strukturni zahtevi

### 3.1. Obavezna polja

`schemaVersion`, `programId`, `canonical`, `classification`, `schedule` i `metadata`. Omotač — `canonical`, `metadata`, `attributes`, `extensions`, zatvoren `additionalProperties` na najvišem nivou — nasleđen je nepromenjen iz RFC-001.

`schedule.cycles` MORA da sadrži najmanje jedan ciklus, svaki ciklus najmanje jednu nedelju, a svaka nedelja najmanje jedan dan. Plan bez dana nije program; on je naslov.

### 3.2. Program referencira treninge; ne sadrži ih

Dan nosi referencu `workout` — zajednički `workoutRef` iz RFC-001, identifikator plus denormalizovano ime za prikaz — a nikada umetnut dokument treninga.

Ovo je pojedinačno najdalekosežnija odluka u ovom RFC-u, i vredi navesti šta ona kupuje, a šta košta.

Kupuje **jednu tačku ispravke**. Trening koji referencira četrdeset dana napisan je jednom. Kada se promeni, menja se svaki dan koji ga referencira, što je gotovo uvek ono što je autor mislio. Kupuje i **deljenje između programa**: početnički i napredni program koji oba propisuju isti tehnički trening pokazuju na isti dokument umesto da naprave njegov fork.

Košta **samosadržanost**. Sam dokument programa nije prikaziv; konzumentu su potrebni i referencirani treninzi. FDS to prihvata jer alternativa — samosadržan dokument koji duplira svoj sadržaj — menja razrešivu zavisnost za nerazrešivu nedoslednost. Denormalizovano `name` na referenci postoji upravo zato da program ostane *izlistiv* bez razrešavanja, iako bez njega nije *izvršiv*.

Konzument koji ne može da razreši referencu na trening MORA da prijavi taj dan kao nerazrešen. NE SME tiho da preskoči dan i NE SME da ga tretira kao dan odmora; nerazrešiv trening i propisan odmor su različite instrukcije, a njihovo poistovećivanje uklanja trening iz plana a da to ne kaže.

### 3.3. Modeli rasporeda

`schedule.model` — `scheduleModel` — odlučuje **koje je od polja za smeštanje dana merodavno**. On je zato strukturni diskriminator, a ne klasifikator, i prati RFC-006 §3.2: zatvoren skup poznatih vrednosti plus sabirna grana držana disjunktnom pomoću `not`/`enum`.

| `model` | Merodavno smeštanje | Značenje |
|---|---|---|
| `calendar` | `dayOfWeek` | Dani padaju na imenovane dane u nedelji. Ponedeljak druge nedelje je ponedeljak. |
| `relative` | `offsetDays` | Dani padaju na fiksni pomak od početka programa, koji god dan u nedelji to bio. |
| `rolling` | `offsetDays` | Dani se ponavljaju u fiksnom ritmu — tri dana rada, jedan odmora — koji po dizajnu klizi u odnosu na kalendar. |
| `sequence` | nijedno | Dani se izvode redom, tempom sportiste. `index` je jedino uređenje. |

Čitanje dokumenta pod pogrešnim modelom ne proizvodi malo drugačiji plan. `rolling` petodnevni ritam pročitan kao `calendar` preuređuje trening i urušava obrazac odmora oko kojeg je plan izgrađen. Zato je model obavezan i zato se neprepoznat model ne izvršava — pogledajte §3.6.

`dayOfWeek` i `offsetDays` MOGU biti prisutni istovremeno. Pod svakim modelom tačno jedno od njih je merodavno, a drugo je savetodavno; proizvođači podataka koji emituju oba TREBALO BI da ih drže usklađenima, a konzumenti NE SMEJU da razreše neslaganje preferiranjem polja koje model ne imenuje.

### 3.4. Ciklusi, nedelje i dani

Ugnježdavanje makro, mezo i mikro ciklusa izražava se preko `type` i `order` ciklusa, a ne umetanjem ciklusa u cikluse.

```
schedule → cycles[] → weeks[] → days[]
```

Makro ciklus i mezo ciklusi unutar njega pojavljuju se zato kao braća u jednom ravnom nizu `cycles`, razlikovani po `type` i sekvencirani po `order`. Dva razloga: ravna lista ostaje čitljiva na dubini koju stvarni programi dostižu, a ciklus može da se referencira direktno umesto putanjom kroz svoje pretke.

`week.index` i `day.index` počinju od 1 i eksplicitni su umesto implicirani pozicijom u nizu, tako da nedelja ili dan mogu stabilno da se referenciraju. Pozicije u nizu se pomeraju kada se dokument menja; `index` se ne pomera.

### 3.5. Dan je trening ili dan odmora

Tačno jedno od to dvoje. Dan koji nosi `workout` je trenažni dan; dan čiji je `rest` postavljen na `true` je dan odmora; dan koji nosi oba je protivrečnost, a dan koji ne nosi nijedno ne kaže ništa.

Šema to sprovodi pomoću `anyOf` za polovinu „najmanje jedno“ i `not`/`allOf` za polovinu „najviše jedno“. Razlog za sprovođenje umesto savetovanja jeste to što konzument koji prikazuje kalendar mora da stavi *nešto* u to mesto, a svaka popravka koju izmisli — tretirati prazan dan kao odmor, preferirati trening nad oznakom odmora — jeste pogađanje autorove namere koju je autor mogao da navede.

Odmor je modelovan eksplicitno umesto da bude ostavljen kao praznina u sekvenci, iz istog razloga. Odsutan dan je neplaniran; propisan dan odmora je deo programa, a ta razlika je upravo ono od čega je sačinjena nedelja rasterećenja.

Dan MOŽE dodatno biti označen kao `optional`, što kaže da ga autor smatra diskrecionim — pomoćni ili kondicioni rad koji može da se izostavi bez narušavanja plana. `optional` je ortogonalan razlici trening/odmor: on kvalifikuje trenažni dan, ne zamenjuje ga.

### 3.6. Nepoznati modeli i neizračunljivi uslovi se nikada ne pogađaju

Konzument koji naiđe na `schedule.model` koji ne razume NE SME da smešta dane vraćanjem na `calendar`, `sequence` ili bilo koju drugu podrazumevanu vrednost. TREBALO BI da predstavi strukturu plana — njegove cikluse, nedelje i dane u redosledu dokumenta — i naznači da smeštanje nije shvaćeno.

Konzument koji naiđe na `condition` grane čiji `kind` ne može da izračuna MORA da prati bezuslovni raspored i TREBALO BI da upozori. NE SME da pogađa granu.

Oba preslikavaju RFC-006 §3.3 i RFC-007 §3.5, i iz istog razloga. Pogađanje grane na planu izgrađenom oko `failedPrescribedReps` može da usmeri sportistu u nedelju intenzifikacije za koju je upravo pokazao da nije spreman.

## 4. Referentne strukture

### 4.1. `classification`

`periodization` je obavezna; `goal`, `level`, `durationWeeks` i `tags` su opcioni.

`periodization` je običan klasifikator i po D8 otvoren string sa preporučenim vrednostima — `linear`, `undulating`, `block`, `conjugate`, `wave`, `none` — nošenim kao `examples`, a ne kao ograničenje. Imenuje oblik plana; ne menja način na koji se dokument čita. `goal` je otvoren pod istim uslovima, sa preporučenim `strength`, `hypertrophy`, `peaking`, `conditioning`, `endurance` i `general`. `level` je zatvoren `enum` od `beginner`, `intermediate` i `advanced`, u skladu sa RFC-007.

`durationWeeks` je **izveden i savetodavan**, pod istim uslovima kao zbirni prikazi u RFC-007. MORA biti jednak zbiru trajanja ciklusa, a konzument kome je potrebna izvesnost TREBALO BI da ga izračuna umesto da mu veruje. Postoji da bi biblioteka programa mogla da se izlista i filtrira bez razrešavanja svakog ciklusa.

### 4.2. `cycle`

`id`, `type`, `order` i `weeks` su obavezni; `name`, `durationWeeks`, `intent` i `notes` su opcioni.

`type` je jedno od `macro`, `meso` i `micro`. `order` počinje od 1 i sekvencira cikluse istog tipa.

`intent` je ono *čemu* ciklus služi — `accumulation`, `intensification`, `realization`, `deload`, `test` — i otvoren je string po D8. On objašnjava plan čitaocu; ne menja način na koji ga konzument izvršava. Konzument koji ne prepoznaje nameru prikazuje ciklus tačno onako kako bi ga ionako prikazao.

### 4.3. `week`

`index` i `days` su obavezni; `name`, `deload` i `notes` su opcioni.

`deload` je logička oznaka na nedelji, a ne vrednost ciklusnog `intent`, jer se nedelja oporavka rutinski pojavljuje unutar ciklusa čija je namera nešto drugo — četvrta nedelja akumulacionog bloka i dalje je rasterećenje akumulacije. Oznaka omogućava da obe tvrdnje budu istinite istovremeno.

`deload` označava nedelju; ne prilagođava trening. Prilagođavanje se izražava kroz `overrides` dana, ili time što su referencirani treninzi lakši. Konzument NE SME da izvede smanjenje opterećenja iz same oznake.

### 4.4. `day`

`index` je obavezan. `id`, `dayOfWeek`, `offsetDays`, `rest`, `optional`, `workout`, `overrides` i `notes` su opcioni, u skladu sa §3.5.

`id` je ono na šta `branching` usmerava, pa svaki dan koji je meta grane MORA da ga nosi.

### 4.5. `overrides`

`overrides` dana — objekat `dayOverrides` — prilagođava referencirani trening **samo za ovo pojavljivanje**. Dokument treninga se nikada ne menja — upravo to ga čini deljivim između dana i između programa. Nadjačavanje se čita kao transformacija primenjena u vreme prikazivanja, a ne kao izmena.

`loadScaling` je množilac primenjen na svako razrešeno opterećenje u treningu. `0.9` je smanjenje od deset procenata. Primenjuje se **nakon** što se ciljno opterećenje razreši, što je ono što mu omogućava da se komponuje sa bilo kojom RFC-006 metodom umesto da je zamenjuje: skaliranje `absolute` opterećenja množi kilograme, skaliranje `percent1RM` opterećenja množi razrešeni rezultat procenta, a skaliranje `rpe` cilja ne množi ništa, jer RPE nema opterećenje koje bi se množilo dok ga sportista ne obezbedi. Proizvođači podataka koji žele da smanje težinu autoregulisanog dana TREBALO BI da spuste cilj u `progressionRule` umesto da očekuju da `loadScaling` dopre do njega.

`volumeScaling` je množilac primenjen na broj serija. Zaokruživanje pripada konzumentu, i on TREBALO BI da zaokruži u korist sportiste na rasterećenju — tri serije skalirane sa `0.6` jesu jedna serija, a ne dve, kada je nedelja označena za oporavak.

`progressionState` beleži gde se u pravilu progresije ovo pojavljivanje nalazi: broj talasa u 5/3/1 ciklusu, fazu dvostruke progresije. Neproziran je za šemu i smislen samo pravilu koje ga čita. Konzument koji ne razume pravilo NE SME da tumači njegovo stanje.

**Kada dan nadjačava trening koji sam nosi pravilo progresije**, redosled je: prvo se razrešava sopstveno pravilo treninga, proizvodeći preskripciju; `overrides` dana se zatim primenjuju na taj rezultat. Pravilo vidi trening onako kako je napisan, a ne skaliran. Svaki drugi redosled učinio bi da ponašanje pravila progresije zavisi od toga koji ga program izvršava, pa bi isto pravilo tada napredovalo različito u dva plana koja oba tvrde da ga koriste.

### 4.6. `progressions`

`progressions` je lista RFC-006 `progressionRule` objekata, referenciranih po `id` iz `progressionState` dana ili iz ciljnog opterećenja. Definicija nije ovde ponovo iskazana; pravilo znači isto unutar treninga i kroz program, i zato živi u zajedničkoj biblioteci, a ne u jednom od dva RFC-a.

Ono što program dodaje jeste *obuhvat*: pravilo deklarisano ovde primenjuje se kroz vremensku liniju plana, pa okidač `sessionsCompleted` broji treninge kroz cikluse, a ne unutar jednog. Pravilo deklarisano ovde je i ono prema čemu se razrešava `autoregulated` ciljno opterećenje referenciranog treninga, kroz `progressionRuleRef` — pravilo i opterećenje koje ga koristi mogu dakle živeti u različitim dokumentima, a konzument MORA da razreši referencu prema programu koji je trening rasporedio.

#### Granica adaptivnog programiranja

Adaptivno programiranje ili programiranje vođeno modelom pokriva dve različite stvari, i samo je jedna od njih prenosivi podatak.

**Adaptacija opterećenja je izraziva.** Treninzi i njihovo smeštanje su fiksni, a opterećenja se razrešavaju u vreme izvođenja kroz `autoregulated` ciljeve koji pokazuju na pravila deklarisana ovde. To je ono što autoregulisani sistemi zaista variraju, i to pravi *round-trip*: druga implementacija koja pročita dokument dobija isti plan i ista pravila.

**Izbor vežbi generisan po treningu nije izraziv, i ova verzija to ne pokušava.** Dan nosi `workoutRef`, što zahteva trening koji postoji. Namerno ne postoji neodređen dan, jer program čiji sadržaj proizvodi generator ne može da se pročita bez tog generatora — što je suprotno od svrhe formata razmene. Sistem koji generiše treninge TREBALO BI da emituje rezultujući program kada treninzi postoje, i da nosi konfiguraciju svog motora pod `extensions`, gde konzument može da je ignoriše bez gubitka plana.

Ovo je iskazana granica, a ne propust. Ako se pojavi prenosiv način izražavanja odloženog izbora, isporučuje se u novoj verziji.

### 4.7. `branching`

`branching` uslovno usmerava između dana: položite test i nastavljate, padnete i ponavljate nedelju. Svaka `branch` nosi `id`, `condition`, `thenDayRef`, i opciono `elseDayRef` i `notes`.

`condition` je deklarativan, a ne izraz: nosi `kind` iz zatvorenog skupa — `failedPrescribedReps`, `metPrescribedReps`, `amrapBelowThreshold`, `amrapAboveThreshold`, `missedSession`, `athleteChoice` — i opcioni `onDayRef` koji imenuje dan prema kome se uslov izračunava. Deklarativan je upravo zato da bi konzument mogao da *prepozna* uslov koji ne ume da izračuna i da ga odbije, što ugrađeni jezik izraza ne bi dozvolio.

Objekat uslova je inače otvoren, jer se pragovi razlikuju po vrsti, a zamrzavanje njihovog oblika u 1.0.0 fiksiralo bi parametre šest metodologija zauvek. `kind` je kapija: konzument koji ga ne prepoznaje ne može da koristi ni njegove parametre.

Izračunavanje uslova zahteva podatke o izvedenom, koje FDS ne modeluje (§8). Konzument zato izračunava grane prema sopstvenom dnevniku treninga, ili ih uopšte ne izračunava — a po §3.6, ne izračunavati ih znači pratiti bezuslovni raspored, a ne pogađati.

### 4.8. `authorship`

`authorship` beleži ko je napisao program i pod kojim uslovima: `author`, `organization`, `license`, `attribution` i `uri`. Svi su opcioni.

Ovo je **prvo mesto gde FDS beleži polaganje prava**, i nalazi se ovde, a ne na vežbi ili komadu opreme, zbog toga šta program jeste. Pokret nije autorsko delo ni u kom smislenom značenju; dvanaestonedeljni plan jeste. Trenažne programe rutinski pišu treneri i komercijalno se licenciraju, a format razmene koji usput izgubi pripisivanje autorstva čini redistribuciju nerazlučivom od krađe — ne kao pravno pitanje, već kao praktično: primalac nema načina da razlikuje.

`license` je SPDX identifikator tamo gde postoji odgovarajući, ili slobodan tekst tamo gde ne postoji. **Odsustvo znači nenavedeno, a ne javno dobro.** Konzument NE SME da tretira nedostajuću `license` kao dozvolu, i TREBALO BI da očuva `authorship` netaknut kroz svaku transformaciju koja proizvodi izveden program.

### 4.9. Opciona opisna polja

`relations` povezuje program sa drugima preko `type` i `targetId`, sa opcionim `notes`. Prepoznati tipovi su `successor`, `predecessor`, `variant`, `beginnerVariant` i `advancedVariant`. Ovako program deklariše šta sledi posle njega — pitanje koje postavlja svaki sportista koji ga završava — i ovako se porodica varijanti po težini vezuje zajedno bez dupliranja plana.

`media` prati zajedničku definiciju iz RFC-001. `attributes` i `extensions` su izlazi za nuždu iz RFC-001, nepromenjeni. Ciklusi, nedelje, dani i nadjačavanja svi prihvataju `notes`; ciklusi i nedelje prihvataju i prikazno `name`.

## 5. Kompozicija sa RFC-006 i RFC-007

| Gde | Odakle dolazi |
|---|---|
| `days[].workout` | RFC-001 `workoutRef` — sam trening je RFC-007 |
| `progressions[]` | RFC-006 `progressionRule` |
| `references.trainingMaxes[].exercise` | RFC-001 `exerciseRef` |
| `canonical`, `metadata`, `media` | RFC-001 |

Program ne sadrži sopstvenu preskripciju. Svako opterećenje, ciljni broj ponavljanja, tempo i interval odmora u planu živi u treninzima koje plan referencira, što tvrdnju iz §3.2 čini nečim više od argumenta efikasnosti: ne postoji drugo mesto na kome bi preskripcija bila, pa ne postoji ni drugo mesto na kome bi bila pogrešna.

### 5.1. Kontekst razrešavanja

Program nasleđuje svaki zahtev razrešavanja svakog treninga koji referencira, a trening nasleđuje svaki zahtev ciljnih opterećenja koja sadrži — RFC-006 §5.2. Utvrđivanje šta je planu potrebno pre njegovog započinjanja znači dakle razrešavanje njegovih treninga i obilazak njihovih preskripcija.

`references.trainingMaxes` postoji da bi taj odgovor bio dostupan *bez* obilaska. To je deklaracija, na vrhu programa, iz kojih je dizanja plan izračunat. Pogledajte §8 za ono što namerno ne sadrži.

## 6. Verzionisanje i kompatibilnost

Ovaj entitet prati pravila verzionisanja iz RFC-001 §5. Njegov objavljeni URL je zamrznut ugovor; dodaci se isporučuju na URL-u nove verzije.

Dodavanje `schedule.model` vrednosti, namere ciklusa, `kind` vrednosti uslova ili tipa u `relations` je SPOREDNA izmena. Dokumenti važeći pod starom verzijom ostaju važeći: otvoreni klasifikatori su tu vrednost već prihvatali, a novi model se ranije validirao kroz sabirnu granu.

Entiteti se verzionišu nezavisno. Nova verzija programa ne obavezuje trening, vežbu ni biblioteku preskripcije da se pomere, i nijedna od njihovih verzija ne obavezuje ovu.

## 7. Smernice za implementaciju

### 7.1. Proizvođači podataka

Referencirajte treninge; nemojte ih umetati. Ako se trening razlikuje između dva dana, to je različit trening i zaslužuje sopstveni dokument — ili je razlika `overrides`, čemu `overrides` i služi.

Navedite `rest` eksplicitno za planirane dane odmora umesto da izostavite dan. Kalendar sa prazninom i kalendar sa danom odmora izgledaju identično čitaocu, a konzumentu su različite instrukcije.

Emitujte `id` na svakom danu koji grana može da cilja, i na svakom ciklusu koji bi čitalac mogao imati potrebu da citira.

Držite `durationWeeks` usklađenim sa ciklusima, ili ga izostavite. Pogrešan zbirni podatak gori je od odsutnog.

### 7.2. Konzumenti

Prvo pročitajte `schedule.model`, zatim smeštajte dane koristeći polje koje on imenuje. Ne izvodite smeštanje iz onog polja koje je slučajno prisutno.

Razrešite svaki referencirani trening pre predstavljanja plana, i prikupite uniju njihovih zahteva razrešavanja zajedno sa `references.trainingMaxes`, tako da se nedostajući kontekst prijavi pri učitavanju programa, a ne usred treće nedelje.

Preračunajte `durationWeeks` kada je ispravnost bitna. Ne tumačite `deload`, `intent` ni `periodization` kao instrukcije za menjanje opterećenja.

## 8. Razmatranja bezbednosti i privatnosti

Program je referentni podatak i po konstrukciji ne sadrži lične podatke. Ne nosi sportistu, telesnu masu, izvedene vrednosti i — što je poenta ovog odeljka — **nijedan trenažni maksimum**.

### 8.1. Trenažni maksimumi su slotovi, a ne vrednosti

`references.trainingMaxes` deklariše da program referencira trenažni maksimum za dato dizanje, i kako se do tog broja dolazi. Nikada ne nosi broj.

Svaki `trainingMaxSlot` nosi `exercise`, `method` koji imenuje kako pozivalac izvodi vrednost — `testedOneRepMax`, `estimatedOneRepMax`, `percentOfOneRepMax`, `recentBest` ili `callerSupplied` — i opcioni `id`. `percent` prati `percentOfOneRepMax`: trenažni maksimum postavljen na 90% pravog maksimuma je konvencija 5/3/1. `notes` može da objasni kućno pravilo.

`id` je lokalna oznaka, da bi pravilo progresije ili nadjačavanje dana moglo da citira slot. Ciljna opterećenja ga ne koriste. `percent1RM` imenuje dizanje kroz `referenceExerciseId`, a važi onaj slot čiji ga `exercise` imenuje — poklapanje je po vežbi, a ne po sopstvenom identifikatoru slota. Proizvođač podataka koji emituje slot za dizanje koje nijedna preskripcija ne referencira deklarisao je zahtev koji plan nema, i konzumenti TREBALO BI da upozore umesto da zahtevaju vrednost.

**Usaglašena implementacija NE SME da proširi ovu strukturu samom vrednošću.** Ovo je iskazano normativno jer je to pojedinačno najverovatnija stvar koju će implementator „popraviti“. Slot izgleda kao objekat kome nedostaje polje, a njegovo dodavanje naizgled čini programe samosadržanim bez ikakve cene.

Nije besplatno. Maksimum za jedno ponavljanje je lični podatak o fizičkoj sposobnosti odredive osobe. Program koji ga nosi više nije referentni podatak: stiče subjekta, a sa subjektom dolaze obaveze saglasnosti, zadržavanja, prenosivosti i brisanja koje dosežu svaki sistem kroz koji dokument prođe. FDS je izgrađen tako da katalozi, treninzi i planovi mogu slobodno da se objavljuju, keširaju, preslikavaju i porede, a to je odbranjivo samo dok nijedan od njih ne opisuje osobu. Jedno brojčano polje, dodato radi pogodnosti, pomerilo bi ceo korpus programa preko te linije.

Prihvaćena posledica je da **potpuno personalizovan program ne može da napravi *round-trip* kao jedan samosadržan dokument.** Izvoz je plan plus odvojen kontekst razrešavanja. To je kompromis, nameran je, i on je ono što drži RFC-006 do RFC-008 slobodnima od ličnih podataka. RFC-009 će definisati gde žive izvedeni i lični podaci, sa obavezama koje uz to idu.

### 8.2. Izvedeni artefakti

Implementacija koja razreši program prema konkretnom sportisti i sačuva rezultat — upisujući kilograme na mesto procenata kroz dvanaest nedelja — proizvela je lične podatke i nasleđuje te obaveze. Taj artefakt nije program u smislu ovog RFC-a, i NE SME da se objavi u registar programa.

## 9. Referenca JSON šeme

`https://spec.vitness.me/schemas/program/v1.0.0/program.schema.json`

### 9.1. Validacija

```bash
npm run verify schemas
```

## 10. Primer

Četvoronedeljni linearni blok na kalendarskom rasporedu: tri trenažna dana nedeljno, rasterećenje u četvrtoj nedelji, jedan deklarisan slot trenažnog maksimuma i grana koja ponavlja nedelju posle neuspešnog treninga.

```json
{
  "schemaVersion": "1.0.0",
  "programId": "00000000-0000-4000-8000-00000000b001",
  "canonical": { "name": "Foundation Strength", "slug": "foundation-strength" },
  "classification": {
    "periodization": "linear",
    "goal": "strength",
    "level": "intermediate",
    "durationWeeks": 4
  },
  "authorship": {
    "author": "VITNESS Team",
    "license": "CC-BY-4.0",
    "attribution": "Foundation Strength by the VITNESS Team"
  },
  "references": {
    "trainingMaxes": [
      {
        "id": "tm.backSquat",
        "exercise": { "id": "ex.backSquat", "name": "Barbell Back Squat" },
        "method": "percentOfOneRepMax",
        "percent": 90
      }
    ]
  },
  "progressions": [
    {
      "id": "prog.linear",
      "name": "Add 2.5 kg on a clean session",
      "trigger": { "kind": "allRepsCompleted" },
      "action": { "kind": "increaseLoad", "amount": 2.5, "unit": "kg" }
    }
  ],
  "schedule": {
    "model": "calendar",
    "cycles": [
      {
        "id": "c1",
        "name": "Base",
        "type": "meso",
        "order": 1,
        "durationWeeks": 4,
        "intent": "accumulation",
        "weeks": [
          {
            "index": 1,
            "days": [
              {
                "id": "d1",
                "index": 1,
                "dayOfWeek": "monday",
                "workout": { "id": "wo.lowerA", "name": "Lower A" }
              },
              { "id": "d2", "index": 2, "dayOfWeek": "tuesday", "rest": true },
              {
                "id": "d3",
                "index": 3,
                "dayOfWeek": "wednesday",
                "workout": { "id": "wo.upperA", "name": "Upper A" }
              },
              {
                "id": "d4",
                "index": 4,
                "dayOfWeek": "friday",
                "optional": true,
                "workout": { "id": "wo.conditioning", "name": "Conditioning" }
              }
            ]
          },
          {
            "index": 4,
            "name": "Deload",
            "deload": true,
            "days": [
              {
                "id": "d13",
                "index": 1,
                "dayOfWeek": "monday",
                "workout": { "id": "wo.lowerA", "name": "Lower A" },
                "overrides": {
                  "loadScaling": 0.85,
                  "volumeScaling": 0.6,
                  "notes": "Back off; keep the movement, drop the stress."
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "branching": [
    {
      "id": "b1",
      "condition": { "kind": "failedPrescribedReps", "onDayRef": "d1" },
      "thenDayRef": "d1",
      "notes": "Repeat the session at the same load rather than advancing."
    }
  ],
  "relations": [
    { "type": "successor", "targetId": "00000000-0000-4000-8000-00000000b002" }
  ],
  "metadata": {
    "createdAt": "2026-08-10T00:00:00Z",
    "updatedAt": "2026-08-10T00:00:00Z",
    "status": "active",
    "source": "vitness.core"
  }
}
```

Razrađeni primeri za svaki model periodizacije iz §4.6 i svaku strukturu raspoređivanja iz §4.7 matrice scenarija objavljeni su uz šemu.

## Usaglašenost

Implementacija je usaglašena sa ovom specifikacijom ako:

1. Razrešava `days[].workout` reference umesto da očekuje umetnute treninge, i prijavljuje dan čija referenca ne može da se razreši umesto da ga preskoči.
2. Smešta dane koristeći polje koje imenuje `schedule.model`, i ne izvršava model koji ne prepoznaje.
3. Odbacuje dan koji nosi i `workout` i `rest`, kao i dan koji ne nosi nijedno.
4. Primenjuje `overrides` na razrešeni trening samo za to pojavljivanje, nakon što se razreši sopstveno pravilo progresije treninga.
5. Prati bezuslovni raspored kada uslov grane ne može da se izračuna, i upozorava umesto da pogađa.
6. Preračunava `durationWeeks` umesto da mu veruje kada je ispravnost bitna.
7. Očuvava `authorship` kroz transformacije, i ne tretira odsutnu `license` kao dozvolu.
8. Ne nosi nijednu vrednost trenažnog maksimuma u dokumentu programa, i ne objavljuje razrešen program kao Program.

## 11. Reference

### 11.1. Normativne reference

- RFC 2119 — Ključne reči za upotrebu u RFC dokumentima
- RFC-001 — Model podataka vežbe
- RFC-006 — Primitivi preskripcije
- RFC-007 — Model podataka treninga
- JSON Schema Draft 2020-12

### 11.2. Informativne reference

- RFC-002 — Model podataka opreme
- `specification/metrics-guide.md`
