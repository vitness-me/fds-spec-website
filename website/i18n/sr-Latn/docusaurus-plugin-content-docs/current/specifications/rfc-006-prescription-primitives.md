---
title: 'RFC-006: Primitivi preskripcije'
description: Biblioteka definicija za ciljna opterećenja, ciljne brojeve ponavljanja, tempo, odmor, zone intenziteta, šeme serija i pravila progresije
sidebar_position: 6
keywords: [prescription, load target, rpe, percent 1rm, tempo, rest, progression, data model, json schema, rfc]
---

# RFC-006: Specifikacija primitiva preskripcije

**Status**: Nacrt
**Verzija**: 0.1.0
**Datum**: 2026-08-07
**Autori**: VITNESS tim
**Kategorija**: Standards Track

## Sažetak

Ova specifikacija definiše primitivne strukture koje se koriste za propisivanje treninga: koliko opterećenja, koliko ponavljanja, kojim tempom, sa koliko odmora, u kojoj zoni intenziteta, raspoređeno po kom obrascu serija i progresirano po kom pravilu.

Za razliku od RFC-001 do RFC-005, ovaj RFC **ne** definiše entitet. Ništa nikada nije „dokument preskripcije“. On objavljuje biblioteku definicija koju RFC-007 Workout i RFC-008 Program komponuju. Izdvajanje ovih struktura je ono što sprečava da semantika propisivanja opterećenja odluta između pojedinačnog treninga i višenedeljnog programa — dva mesta gde bi isti pojam inače bio modelovan dvaput.

## 1. Uvod

### 1.1. Pozadina

RFC-001 definiše vežbu kao stavku kataloga. Njen blok `metrics` deklariše *oblike bez vrednosti* — „ovaj pokret se meri u ponavljanjima i težini“ — nikada „osam ponavljanja sa sto kilograma“. To je namerno, i to je šav na kome ovaj RFC gradi: preskripcija pridružuje vrednosti oblicima koje vežba deklariše.

Teškoća je u tome što „koliko opterećenja“ nema jedinstvenu reprezentaciju. Pauerlifting program kaže 82,5% trenažnog maksimuma. Hipertrofijski blok kaže RPE 8. Kružni trening na mašinama kaže nivo 7. Kalistenička progresija kaže telesna masa sa 20 kg asistencije. Trening zasnovan na brzini kaže stani kada brzina šipke padne 20%. To nisu varijacije jednog broja; to su različite *vrste* instrukcija, razrešive samo u odnosu na različit kontekst.

Modelovati ih kao jedno nullable polje `weight` gubi tu razliku. Modelovati ih odvojeno u treningu i ponovo u programu garantuje da će se to dvoje razići.

### 1.2. Ciljevi

1. Predstaviti svaku metodu propisivanja opterećenja iz §4.3 matrice scenarija bez gubitka.
2. Zadržati reprezentaciju proverljivom validacijom — diskriminisana unija koju validator JSON šeme zaista može da proveri.
3. Ostati unapred kompatibilan: dokument koji koristi metodu definisanu posle ove verzije NE SME biti odbačen u celini.
4. Učiniti zahteve razrešavanja eksplicitnim, tako da konzument zna šta mora da obezbedi pre nego što relativna preskripcija postane apsolutna.
5. Definisati ove strukture jednom, za upotrebu i u RFC-007 i u RFC-008.

### 1.3. Obuhvat

**U obuhvatu:**

- Ciljna opterećenja, ciljni brojevi ponavljanja, tempo, specifikacije odmora, zone intenziteta, šeme serija i pravila progresije
- Pravila diskriminacije i unapredne kompatibilnosti koja njima upravljaju
- Kontekst koji konzument mora da obezbedi da bi razrešio relativnu preskripciju

**Van obuhvata:**

- Struktura treninga — blokovi, grupisanje, superserije, kružni treninzi (RFC-007)
- Struktura programa — ciklusi, nedelje, raspoređivanje (RFC-008)
- Podaci o izvedenom — šta je sportista zaista uradio (RFC-009, odloženo)
- Identitet sportiste, telesna masa, trenažni maksimumi ili granice srčanog ritma. FDS ne modeluje nijednu osobu; pogledajte §5.

## 2. Terminologija

Ključne reči MUST, MUST NOT, SHOULD, SHOULD NOT i MAY tumače se kako je opisano u RFC 2119.

- **Preskripcija** — instrukcija o tome kako izvesti rad, nezavisna od bilo kog sportiste.
- **Ciljno opterećenje** — instrukcija koja određuje koliko otpora serija koristi.
- **Ciljni broj ponavljanja** — instrukcija koja određuje šta okončava seriju.
- **Kontekst razrešavanja** — vrednosti koje konzument mora da obezbedi da bi pretvorio relativnu preskripciju u apsolutnu.
- **Biblioteka definicija** — objavljena šema čija je svrha da bude referencirana, a ne instancirana.

## 3. Osnovni strukturni zahtevi

### 3.1. Ovo je biblioteka, a ne entitet

Objavljena šema ne nosi `schemaVersion`, identifikator ni blok `metadata`, jer ne opisuje nijedan dokument. Njen koren je namerno nezadovoljiv:

```json fds:ignore a JSON Schema excerpt, not a document
{ "not": {} }
```

Validacija bilo kog dokumenta prema korenu biblioteke ne uspeva po konstrukciji. Ovo je zaštitna ograda, a ne neprijatnost: biblioteka čiji bi koren prihvatao sve tiho bi propustila svaki dokument koji joj se preda, a konzument bi to shvatio kao potvrdu. Umesto toga referencirajte definiciju:

```json fds:ignore a JSON Schema excerpt, not a document
{ "$ref": "https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json#/$defs/loadTarget" }
```

Pošto su objavljene FDS šeme samosadržane (pogledajte vodič za pisanje šema), RFC-007 i RFC-008 će nositi spljoštene kopije definicija koje koriste. Implementatori koji validiraju trening nikada ne moraju da preuzmu ovu datoteku.

### 3.2. Diskriminacija, i zašto je sabirna grana oblikovana tako kako jeste

`loadTarget`, `repTarget` i `restSpec` su diskriminisane unije: polje `method` ili `kind` bira koji sadržaj važi. Po D8, strukturni diskriminatori ne mogu biti otvoreni stringovi — otvoren diskriminator ne može da se validira, jer nijedna grana nije izabrana pa se ili sve poklapaju ili nijedna.

Svaka unija zato nabraja svoje poznate članove sa tipiziranim sadržajima, i dodaje jednu završnu granu za vrednosti koje ova verzija ne definiše. Ta grana MORA da isključi poznate vrednosti:

```json fds:ignore a JSON Schema excerpt, not a document
{
  "type": "object",
  "required": ["method"],
  "properties": {
    "method": { "type": "string", "not": { "enum": ["absolute", "percent1RM", "…"] } }
  }
}
```

Kombinacija `not`/`enum` je noseća. Bez nje, `{ "method": "absolute", "value": 100, "unit": "kg" }` poklapa i granu `absolute` i sabirnu granu, dve grane se poklapaju, i `oneOf` ne uspeva — pa bi ispravan dokument bio odbačen. Još gore, *deformisana* poznata metoda propala bi do popustljive grane i validirala se, a to je upravo onaj tihi prolazak radi čijeg izbegavanja ovaj standard postoji.

Implementacije koje proširuju ove unije MORAJU da održe tu disjunktnost.

### 3.3. Nepoznate metode se ignorišu, nikada ne pogađaju

Konzument koji naiđe na `method` koji ne razume MORA da ignoriše to ciljno opterećenje i TREBALO BI da upozori. NE SME da podmetne podrazumevanu vrednost, da se vrati na opterećenje prethodne serije, niti da izvede vrednost iz okolnog konteksta.

Ovo je strože od pravila „upozori i nastavi“ koje upravlja klasifikatorima drugde u FDS-u, i to namerno. Neprepoznat `exerciseType` proizvodi pogrešno označenu vežbu. Pogođeno opterećenje proizvodi šipku koju neko pokušava da podigne. Tiho izmišljanje radne težine je problem fizičke bezbednosti, a ne kvaliteta podataka.

## 4. Referentne strukture

### 4.1. `loadTarget`

Trinaest definisanih metoda plus grana unapredne kompatibilnosti. Sve metode osim `bodyweight`, `autoregulated` i `none` prihvataju opcioni `range` — `loadRange` sa `min` i `max` — za preskripcije date kao pojas umesto kao tačka. `loadRange` ne nosi sopstvenu jedinicu: preuzima jedinice metode koja ga obuhvata, pa je pojas na `absolute` u kilogramima, a pojas na `rpe` u RPE poenima.

| `method` | Sadržaj | Razrešivo iz samog dokumenta? |
|---|---|---|
| `absolute` | `value`, `unit` (`kg`\|`lb`) | Da |
| `percent1RM` | `value`, opcioni `referenceExerciseId` | Ne — potreban je 1RM |
| `percentBodyweight` | `value` | Ne — potrebna je telesna masa |
| `rpe` | `value` 1–10, opcioni `allowHalf` | Da (sportista ga razrešava) |
| `rir` | `value` 0–10 | Da (sportista ga razrešava) |
| `velocity` | `value`, `unit` (`m_s`), opcioni `lossThreshold` | Da, uz instrumentaciju |
| `level` | `value`, opcioni `scale` | Da, samo na toj mašini |
| `bandResistance` | opcioni `equipment`, `colour`, `estimatedLoad` | Delimično |
| `assisted` | `value`, `unit` | Da |
| `relative` | `basis`, `delta`, `deltaUnit` | Ne — potrebna je istorija |
| `bodyweight` | — | Da |
| `autoregulated` | `progressionRuleRef` | Ne — potrebno je stanje pravila |
| `none` | — | Da |

Tri od njih nose semantiku koju konzument može pogrešno shvatiti na način koji validacija ne može da uhvati:

**`percent1RM` sa `referenceExerciseId`** izražava „70% vašeg maksimuma za jedno ponavljanje u zadnjem čučnju“ na vežbi koja nije zadnji čučanj — uobičajen slučaj u pomoćnom radu i u programima vođenim procentima, gde se svako dizanje skalira prema nekoliko referentnih dizanja. Kada je odsutan, referenca je sama propisana vežba.

**`assisted`** nosi veličinu asistencije kao pozitivan broj. Više asistencije je *manje* napora. Konzument koji iscrtava opterećenje kroz vreme MORA da obrne smisao za asistirane ciljeve, ili će prikazivati sportistu koji nazaduje dok postaje jači. Ova metoda je smislena samo na vežbi čiji je `loading.assisted` istinit (RFC-001 §4.6).

**`level`** je neproziran. Reprodukuje podešavanje na jednoj mašini i ne znači ništa bilo gde drugde. NE SME se pretvarati u opterećenje niti porediti između mašina ili objekata.

### 4.2. `repTarget`

Šta okončava seriju: `fixed`, `range`, `amrap`, `toFailure`, `time`, `distance`, `calories`, `maxHold`, plus grana unapredne kompatibilnosti.

`toFailure` nosi `technical`, razlikujući „stani kada se forma degradira“ od „stani kada ponavljanje ne može da se dovrši“ — razliku koju pravi svaki trener snage, a nijedan raniji format razmene je ne beleži.

`amrap` prihvata i donju granicu `min` i `cap`. Donja granica je ono što program očekuje; `cap` sprečava seriju koja bi inače trajala nekoliko minuta.

### 4.3. `tempo`

Vremena po fazi u sekundama, u uobičajenom redosledu: `eccentric`, `bottomPause`, `concentric`, `topPause`. Faza MOŽE biti string `"X"`, što znači eksplozivno — što je brže moguće umesto konkretnog trajanja.

Svaka faza je `tempoPhase`: nenegativan broj sekundi, ili `"X"`. Ovo je ranije bilo izrazivo samo kao ekstenzija `x:vitness.tempo` u RFC-001. Ovde je unapređeno u osnovni primitiv jer je tempo pitanje preskripcije, a ne kataloga: ista vežba se propisuje različitim tempom u različitim blokovima.

Obratite pažnju na razliku u odnosu na metrički tip `tempo` u RFC-001, koji beleži konvenciju brojanja (3‑1‑1) kao zabeleženu vrednost. Vremena po fazi ispod sekunde su `duration` u `ms`.

### 4.4. `restSpec`

`method` je jedno od `fixed`, `range`, `toHeartRate`, `asNeeded`, `ratio`.

`appliesTo` je OBAVEZNO, i to je polje koje će implementator koji prenosi iz jednostavnijeg formata najverovatnije izostaviti. Odmor se vezuje za jednu od četiri granice — `set`, `group`, `round`, `block` — a isti blok rutinski nosi više njih: trideset sekundi između članova superserije, tri minuta između krugova. Golo trajanje je dvosmisleno, a ta dvosmislenost se ne može povratiti uvidom.

`ratio` izražava odnos rada i odmora kao `work` i `rest`, dva broja koja se razrešavaju u odnosu na trajanje radnog intervala, pa odnos 1:2 posle napora od 40 sekundi znači 80 sekundi.

`toHeartRate` uzima svoj prag u `bpm`, jedinoj jedinici koju prihvata.

`appliesTo` je `restScope`, jedno od `set`, `group`, `round` ili `block`.

### 4.5. `intensityZone`

`{ system, zone, boundsRef? }` gde je `system` jedno od `heartRate`, `power`, `pace` ili `perceived`.

`zone` je oznaka, a ne vrednost. „Z4“ ne znači ništa bez granica koje ga definišu, a te granice su lične. `boundsRef` identifikuje unos registra zona kome oznaka pripada; bez njega, oznaka zone je smislena samo unutar proizvođača podataka koji ju je napisao.

### 4.6. `setScheme`

Imenovani obrazac i njegovi parametri, za preskripcije koje opisuju oblik umesto da nabrajaju svaku seriju: `straight`, `ramping`, `reversePyramid`, `drop`, `restPause`, `cluster`, `myoReps`, `wave`, `ladder`, `density`, `topSetBackoff`.

Za razliku od unija opterećenja i ponavljanja, `pattern` je **zatvoren** enum bez sabirne grane. Proširivanje obrasca u konkretne serije zahteva poznavanje njegove semantike, pa konzument ne može uraditi ništa korisno sa obrascem za koji nikada nije čuo — prihvatanje bi samo odložilo neuspeh do tačke gde je bitan. Proizvođači podataka koji koriste obrazac koji ovde nije naveden MORAJU umesto toga da ga prošire u eksplicitne serije.

`params` je namerno otvoren: svaki obrazac uzima drugačiji oblik, a ograničavanje svih jedanaest ovde zamrzlo bi rečnik parametara jedanaest različitih metodologija u verziji 1.0.0. Konvencionalni ključevi su sledeći:

| Obrazac | Konvencionalni `params` | Značenje |
|---|---|---|
| `straight` | — | Svaka serija identična; `sets` je sam po sebi dovoljan |
| `ramping` | `startPercent`, `endPercent` | Rastuće opterećenje kroz propisane serije, koje se završava top serijom |
| `reversePyramid` | `dropPercent` | Najteža serija prva; svaka sledeća serija opada za ovoliko |
| `drop` | `drops`, `dropPercent` | Uzastopni padovi opterećenja bez odmora posle radne serije |
| `restPause` | `miniSets`, `intraSetRest`, `restUnit` | Jedna serija izvedena do blizu otkaza, zatim nastavljena posle kratkih odmora |
| `cluster` | `repsPerCluster`, `intraSetRest`, `restUnit` | Ponavljanja grupisana u klastere sa programiranim odmorom unutar serije |
| `myoReps` | `activationReps`, `miniSetReps`, `miniSets`, `intraSetRest` | Aktivaciona serija praćena kratkim mini-serijama |
| `wave` | `waves`, `repPattern` | Ponavljajuća lestvica ponavljanja, npr. `[3, 2, 1]`, izvedena kroz više talasa |
| `ladder` | `rungs`, `direction` | Eksplicitne prečke, rastuće, opadajuće ili gore-dole |
| `density` | `timeCap`, `timeUnit`, `target` | Maksimalan rad unutar vremenskog ograničenja |
| `topSetBackoff` | `backoffPercent`, `backoffSets` | Jedna top serija, zatim back-off serije sa smanjenim opterećenjem |

Ovi ključevi su konvencionalni, a ne normativni — proizvođač podataka MOŽE da doda sopstvene. Konzument koji prepoznaje obrazac, ali ne i ključ, TREBALO BI da ignoriše ključ i upozori, a NE SME da proširi obrazac ako ključ koji mu je potreban nedostaje.

### 4.7. `progressionRule`

`{ id, trigger, action }`. Okidači pokrivaju završenost (`allRepsCompleted`, `topOfRepRange`), napor (`rpeBelow`, `rirAbove`, `amrapThreshold`), vreme (`sessionsCompleted`) i neuspeh (`failedAttempts`). Akcije pokrivaju opterećenje, ponavljanja, serije, `deload`, `retest`, `advanceStage` i `hold`.

Pravilo MOŽE da nosi i čitljivo `name` i slobodan tekst `notes`; nijedno ne utiče na razrešavanje.

Istu strukturu pravila konzumira RFC-007, gde se progresija primenjuje unutar treninga, i RFC-008, gde se primenjuje kroz ciklus. To je ceo razlog što je definisana ovde, a ne u jednom od njih.

## 5. Kontekst razrešavanja

Većina ciljnih opterećenja je *relativna*. Ona postaju apsolutna instrukcija tek u kombinaciji sa vrednostima koje FDS namerno ne nosi, jer FDS ne modeluje nijednu osobu (D6: ne postoji entitet User ni Profile, a njegovo dodavanje uvuklo bi saglasnost i zadržavanje u svaki referentni dokument).

Ovaj odeljak imenuje svaki takav ulaz. Konzument koji namerava da prikaže apsolutna opterećenja MORA biti u stanju da obezbedi kontekst za metode na koje nailazi, i NE SME da izmisli vrednost koja mu nedostaje.

### 5.1. Šta svaka metoda zahteva

| Metoda | Potreban kontekst | Odakle dolazi |
|---|---|---|
| `absolute` | ništa | — |
| `bodyweight`, `none` | ništa | — |
| `rpe`, `rir` | ništa u vreme prikazivanja | Sportista ga razrešava tokom serije |
| `percent1RM` | Maksimum za jedno ponavljanje za propisanu vežbu, ili za `referenceExerciseId` kada je prisutan | Pozivalac. RFC-008 `references.trainingMaxes[]` deklariše *koja* dizanja program zahteva i kojom metodom se izračunavaju — slotove, nikada vrednosti |
| `percentBodyweight` | Telesna masa sportiste | Samo pozivalac. **Uopšte nije predstavljivo u FDS-u** |
| `relative` | Ranija istorija treniranja: opterećenje sa prethodnog treninga, procenjen 1RM ili trenažni maksimum | Dnevnik treninga pozivaoca |
| `autoregulated` | Trenutno stanje referenciranog pravila progresije | Stanje izvršavanja kod pozivaoca |
| `velocity` | Merenje brzine šipke uživo | Instrumentacija u vreme izvođenja |
| `level` | Konkretna mašina | Fizički kontekst; nije prenosivo |
| `bandResistance` | Proizvođačeva skala boja | `equipment`, plus pozivaočevo poznavanje te skale |
| `intensityZone` | Lične granice zona | Pozivalac. Registar zona definiše *sistem*; brojevi su lični |

Dva unosa zaslužuju naglasak jer se najčešće prećutno pretpostavljaju rešenim:

**Telesna masa nije u FDS-u i neće biti.** Cilj `percentBodyweight` je nerazrešen bez vrednosti koju pozivalac obezbedi u vreme prikazivanja. Ne postoji polje u koje bi se stavila, po dizajnu — telesna masa je lični podatak, a njeno prihvatanje učinilo bi svaki dokument koji je nosi predmetom obaveza za čije rešavanje postoji RFC-009.

**Trenažni maksimumi su slotovi, a ne vrednosti.** RFC-008 dozvoljava programu da deklariše da referencira trenažni maksimum zadnjeg čučnja izračunat navedenom metodom. Nikada ne nosi broj. Potpuno personalizovan program zato ne može da napravi *round-trip* kao jedan samosadržan dokument: izvoz je šablon plus odvojen kontekst razrešavanja. Taj kompromis je prihvaćen namerno, i on je ono što drži RFC-006 do RFC-008 slobodnima od ličnih podataka.

### 5.2. Utvrđivanje šta je dokumentu potrebno

Ni trening ni program ne deklarišu svoje zahteve razrešavanja na jednom mestu. Konzument ih utvrđuje obilaskom svakog `loadTarget` i `intensityZone` u dokumentu i prikupljanjem unije gore navedenog konteksta.

Konzumenti TREBALO BI da izvedu taj obilazak **pre** predstavljanja treninga, tako da se nedostajući kontekst prijavi unapred umesto da se otkriva seriju po seriju. Program kome je potreban maksimum za jedno ponavljanje u potisku sa klupe trebalo bi to da kaže pri učitavanju, a ne usred treće vežbe.

### 5.3. Kada kontekst nedostaje

Konzument koji ne može da razreši cilj NE SME da podmetne podrazumevanu vrednost, prenese opterećenje prethodne serije, niti proceni iz srodnog dizanja. TREBALO BI da predstavi preskripciju onako kako je napisana — „70% 1RM“ je pošteno i upotrebljivo; izmišljen broj nije nijedno od toga.

Ovo ponavlja §3.3 za drugačiji neuspeh: §3.3 upravlja metodom koja nije *shvaćena*, ovo upravlja metodom koja je shvaćena, ali nije *razrešiva*. Oba se razrešavaju na isti način, i iz istog razloga — cenu pogrešnog opterećenja snosi osoba pod šipkom.

## 6. Verzionisanje i kompatibilnost

Ova biblioteka prati pravila verzionisanja iz RFC-001 §5. Njen objavljeni URL je zamrznut ugovor: bajtovi na `prescription/v1.0.0/prescription.schema.json` neće se menjati. Dodaci se isporučuju kao nova sporedna verzija na novom URL-u.

Dodavanje metode u diskriminisanu uniju je SPOREDNA izmena: dokumenti važeći pod starom verzijom ostaju važeći, jer se nova metoda ranije validirala kroz sabirnu granu. To je svojstvo kompatibilnosti radi kojeg sabirna grana postoji, i zato je ta grana specifikovana umesto da bude prepuštena implementacijama.

Uklanjanje metode, ili sužavanje postojećeg sadržaja, je GLAVNA izmena.

## 7. Smernice za implementaciju

### 7.1. Proizvođači podataka

Preferirajte najspecifičniju metodu koja izražava nameru. Program koji razmišlja u procentima TREBALO BI da emituje `percent1RM` umesto da unapred razrešava u `absolute`, jer je procenat instrukcija, a kilogrami su prikaz te instrukcije za jednog sportistu. Prevremeno razrešavanje odbacuje informaciju koja program čini prenosivim.

Emitujte `none` kada je opterećenje namerno nepropisano. Potpuno izostavljanje `load` znači nenavedeno, što je drugačija tvrdnja.

### 7.2. Konzumenti

Razrešavajte ovim redosledom: proverite da li je metoda shvaćena; ako nije, ignorišite i upozorite. Zatim prikupite kontekst koji §5 zahteva. Zatim zaokružite razrešenu vrednost na korak sprave (`equipment.loading.increment`, RFC-002 §4.4) umesto da predstavite opterećenje koje niko ne može da složi.

Konzument koji ne može da razreši cilj TREBALO BI da prikaže preskripciju onako kako je napisana — „70% 1RM“ je sportisti korisnije od praznog polja ili izmišljenog broja.

### 7.3. Validacija

Pošto je koren biblioteke nezadovoljiv, validirajte fragmente prema definiciji za koju tvrde da jesu. Referentna implementacija sastavlja omotačku šemu — biblioteku plus koren sa `$ref` na imenovanu definiciju — što je upravo ono što `scripts/check-prescription.mjs` radi u ovom repozitorijumu.

## 8. Razmatranja bezbednosti i privatnosti

Ova biblioteka definiše referentne podatke i po konstrukciji ne sadrži lične podatke. To je svojstvo koje vredi namerno očuvati: svaka metoda koja *bi* zahtevala lične podatke — `percent1RM`, `percentBodyweight`, `relative`, `intensityZone` — referencira ih umesto da ih nosi. 1RM, telesna masa, istorija treniranja i granice zona svi žive u konzumentovom kontekstu razrešavanja.

Ovo drži RFC-006, RFC-007 i RFC-008 slobodnima od PII, i čini granicu RFC-009 oštrom: sve pre RFC-009 su referentni podaci; RFC-009 je mesto gde počinju lični podaci, sa obavezama saglasnosti i zadržavanja koje slede.

Implementacija koja ugrađuje razrešene lične vrednosti u preskripciju — upisivanje stvarnih kilograma sportiste u ono što je bio procenat — pomera taj dokument preko granice i nasleđuje te obaveze.

## 9. Referenca JSON šeme

`https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json`

### 9.1. Validacija

```bash
# Fragments, not documents — the library root accepts nothing.
npm run check:prescription
```

## 10. Primer

Top serija na RPE 8 praćena back-off serijama na procentu drugog dizanja, sa ekscentričnom fazom od četiri sekunde i tri minuta odmora između serija:

```json fds:fragment entity=prescription defs=load:loadTarget,reps:repTarget,tempo:tempo,rest:restSpec,scheme:setScheme
{
  "load": { "method": "rpe", "value": 8, "allowHalf": true },
  "reps": { "kind": "range", "min": 3, "max": 5 },
  "tempo": { "eccentric": 4, "bottomPause": 1, "concentric": "X", "topPause": 0 },
  "rest": { "method": "fixed", "appliesTo": "set", "value": 3, "unit": "min" },
  "scheme": {
    "pattern": "topSetBackoff",
    "sets": 4,
    "params": { "backoffPercent": 10, "backoffSets": 3 }
  }
}
```

Razrađeni primeri za svaku metodu iz §4.1 objavljeni su uz šemu.

## Usaglašenost

Implementacija je usaglašena sa ovom specifikacijom ako:

1. Prihvata svaku metodu i vrstu definisanu u §4, uključujući i kroz granu unapredne kompatibilnosti.
2. Ignoriše ciljna opterećenja čiju metodu ne razume, upozorava i ne podmeće vrednost.
3. Čuva razliku između odsutnog `load` i `{ "method": "none" }`.
4. Tretira `assisted` opterećenje kao asistenciju, a ne kao otpor, pri izračunavanju ili prikazivanju napora.
5. Ne poredi niti konvertuje `level` vrednosti između mašina.
6. Zahteva `appliesTo` na svakoj specifikaciji odmora koju emituje.

## 11. Reference

### 11.1. Normativne reference

- RFC 2119 — Ključne reči za upotrebu u RFC dokumentima
- RFC-001 — Model podataka vežbe (oblici metrika, karakteristike opterećivanja)
- RFC-002 — Model podataka opreme (koraci opterećenja)
- JSON Schema Draft 2020-12

### 11.2. Informativne reference

- RFC-007 — Model podataka treninga (konzument ove biblioteke)
- RFC-008 — Model podataka trenažnog programa (konzument ove biblioteke)
- `specification/metrics-guide.md` — uparivanja tipova i jedinica metrika
