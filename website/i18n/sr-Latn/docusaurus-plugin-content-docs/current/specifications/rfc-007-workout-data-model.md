---
title: 'RFC-007: Model podataka treninga'
description: Propisani treninzi — blokovi, režimi izvršavanja, grupisanje i preskripcija po seriji
sidebar_position: 7
keywords: [workout, session, superset, circuit, emom, amrap, tabata, data model, json schema, rfc]
---

# RFC-007: Specifikacija modela podataka treninga

**Status**: Nacrt
**Verzija**: 0.2.0
**Datum**: 2026-08-10
**Autori**: VITNESS tim
**Kategorija**: Standards Track

## Sažetak

Ova specifikacija definiše standardizovani model za jednu propisanu trenažnu celinu — trening. Pokriva kako se vežbe uređuju i grupišu, kako se svaka propisuje i kako je predviđeno da se trening izvrši.

Centralna tvrdnja je strukturna: **trening su blokovi stavki, a način na koji se blok izvršava jeste svojstvo bloka, a ne druga vrsta dokumenta.** Klasičan rad na snazi, superserije, kružni treninzi, EMOM, AMRAP, Tabata i intervalni trening svi su izraženi istom šemom i razlikuju se samo u `blocks[].mode`. Nijedan stil treninga ne dobija sopstvenu šemu.

Sama preskripcija — koliko opterećenja, koliko ponavljanja, kojim tempom, koliko odmora — nije definisana ovde. Ona dolazi iz RFC-006, tako da serija u samostalnom treningu i ista serija unutar dvanaestonedeljnog programa znače potpuno isto.

## 1. Uvod

### 1.1. Pozadina

Formati razmene za treninge istorijski su modelovali jednu metodologiju dobro, a ostale loše. Format izgrađen oko serija i ponavljanja ne može da izrazi AMRAP; format izgrađen oko krugova i vremenskih ograničenja ne može da izrazi top seriju sa back-off serijama. Aplikacije to zaobilaze poljima po stilu — `isCircuit`, `emomInterval`, `tabataRounds` — dok model ne postane unija posebnih slučajeva u kojoj se nijedne dve implementacije ne slažu koji od njih važe zajedno.

Opažanje na kome je ovaj RFC izgrađen jeste da se ovi stilovi razlikuju u tome **kako se grupa vežbi izvršava**, a ne u tome šta je vežba ili serija. Kružni trening i klasične serije sadrže iste stavke sa istim preskripcijama; razlikuju se u redosledu prolaska i završetku. Kada izvršavanje postane svojstvo bloka, posebni slučajevi se urušavaju.

### 1.2. Ciljevi

1. Izraziti svaku strukturu grupisanja iz §4.2 matrice scenarija, i svaku šemu serija i ponavljanja iz §4.1, bez polja po stilu.
2. Komponovati primitive preskripcije iz RFC-006 umesto njihovog ponovnog iskazivanja.
3. Zadržati trening preskriptivnim: trening opisuje nameravani rad, nikada izvedeni rad.
4. Ostati unapred kompatibilan — režim definisan posle ove verzije NE SME da učini dokument nevažećim.
5. Ne sadržati nijedan lični podatak.

### 1.3. Obuhvat

**U obuhvatu:** struktura treninga, režimi izvršavanja blokova, grupisanje, preskripcija po stavci i po seriji, unapred odobrene zamene, savetodavni zbirni prikazi.

**Van obuhvata:**

- Sami primitivi preskripcije (RFC-006)
- Struktura kroz više treninga: ciklusi, nedelje, raspoređivanje, periodizacija (RFC-008)
- Podaci o izvedenom — šta je zaista urađeno, i ko je to uradio (RFC-009, odloženo)
- Identitet sportiste, telesna masa, maksimumi za jedno ponavljanje. Pogledajte RFC-006 §5.

## 2. Terminologija

Ključne reči MUST, MUST NOT, SHOULD, SHOULD NOT i MAY tumače se kako je opisano u RFC 2119.

- **Trening** — jedna propisana trenažna celina.
- **Blok** — neprekidan odsek treninga koji se izvršava pod jednim režimom.
- **Stavka** — jedna vežba unutar bloka, sa svojom preskripcijom.
- **Režim** — kako se blok izvršava: redosled prolaska kroz njegove stavke i šta okončava blok.
- **Grupa** — stavke unutar bloka koje se izvode zajedno, identifikovane zajedničkim `groupLabel`.

## 3. Osnovni strukturni zahtevi

### 3.1. Obavezna polja

`schemaVersion`, `workoutId`, `canonical`, `classification`, `structure` i `metadata`. Omotač — `canonical`, `metadata`, `attributes`, `extensions`, zatvoren `additionalProperties` na najvišem nivou — nasleđen je nepromenjen iz RFC-001.

`structure.blocks` MORA da sadrži najmanje jedan blok, a svaki blok MORA da sadrži najmanje jednu stavku. Prazna celina nije trening; ona je greška koja se validira.

### 3.2. Blokovi i režimi

Blok nosi `mode`, a `mode` odlučuje tri stvari koje konzument ne može drugačije izvesti:

1. **Prolazak** — da li sve serije prve stavke prethode drugoj stavci (`sequential`), ili se po jedna serija svake uzima po prolazu (`circuit`, `superset`).
2. **Završetak** — da li se blok završava kada je propisani rad obavljen (`sequential`, `forTime`) ili kada istekne sat (`amrap`, `emom`, `tabata`).
3. **Koji su `modeParams` smisleni.**

`mode` je zato **strukturni diskriminator**, a ne klasifikator, i prati RFC-006 §3.2: zatvoren skup poznatih vrednosti plus sabirna grana držana disjunktnom pomoću `not`/`enum`. Režim koji konzument ne prepoznaje NE SME da se izvrši pogađanjem — pogledajte §3.5.

Nasuprot tome, `classification.workoutType` i `blocks[].role` ne nose strukturnu posledicu, pa po D8 ostaju otvoreni stringovi sa preporučenim registrima, a neprepoznata vrednost se bezbedno ignoriše.

#### Režim i `modeParams`

| `mode` | Smisleni `modeParams` | Završava se kada |
|---|---|---|
| `sequential` | — | Sve stavke završene |
| `superset` | `rounds` | Sve serije svake grupe završene |
| `circuit` | `rounds`, `rest` | Završeno `rounds` krugova |
| `emom` | `rounds`, `interval` | Istekne `rounds` intervala |
| `amrap` | `timeCap` | Istekne `timeCap` |
| `forTime` | `rounds`, `timeCap` | Rad se završi, ili istekne `timeCap` |
| `tabata` | `rounds`, `work`, `rest` | Završeno `rounds` krugova |
| `interval` | `rounds`, `work`, `rest` | Završeno `rounds` krugova |

`modeParams` je otvoren objekat. Njegovo ograničavanje po režimu je razmatrano i odbačeno: konzument koji ne prepoznaje režim ne može da koristi ni njegove parametre, pa je režim već kapija. Tipiziranje parametara dodalo bi drugu kapiju koja se aktivira samo kada je prva već zaustavila izvršavanje.

Proizvođač podataka TREBALO BI da navede parametre koje njegov režim zahteva. Blok sa `mode: "amrap"` i bez `timeCap` je nedovoljno specifikovan, i konzumenti TREBALO BI da upozore.

### 3.3. Grupisanje

Stavke koje dele `groupLabel` unutar bloka izvode se zajedno, naizmenično: `A1`, `A2` je superserija; `A1`, `A2`, `A3` triserija. Slovo uređuje grupe unutar bloka, cifra uređuje članove unutar grupe. Ova konvencija je široko korišćena u trenerskoj praksi, a ovaj RFC je čini normativnom da bi mogla da se parsira, a ne samo čita.

Blok čiji je `mode` `superset`, a čije stavke ne nose `groupLabel`, dvosmislen je; konzumenti TREBALO BI da upozore i MOGU da tretiraju ceo blok kao jednu grupu.

**Superserija, kombinovana serija i antagonističko uparivanje strukturno se ne razlikuju**, i to namerno. Sve tri su dve stavke koje se smenjuju sa odmorom odloženim do kraja grupe; razlikuju se samo po tome da li vežbe dele mišićnu grupu ili su joj suprotstavljene. To je izvodivo iz `targets` referenciranih vežbi, pa bi ponovno kodiranje toga u treningu stvorilo drugi izvor istine koji može da se ne slaže sa prvim. Proizvođači podataka koji žele da zabeleže nameru TREBALO BI da koriste `blocks[].role` ili oznaku.

### 3.4. Serije: eksplicitno ili šemom, nikada oboje

Stavka navodi svoje serije na jedan od dva načina:

- `sets[]` — eksplicitan niz `setPrescription` objekata, svaki sa sopstvenim opterećenjem, ponavljanjima, tempom i odmorom.
- `scheme` — `setScheme` iz RFC-006, koji imenuje obrazac i njegove parametre.

Oni su međusobno isključivi, što sprovodi `not: { required: ["sets", "scheme"] }`. Stavka koja nosi oba navodi isti rad dvaput bez ičega što bi reklo koji važi, a konzument koji pogrešno izabere menja trening.

Proizvođači podataka TREBALO BI da preferiraju `sets[]` kada se serije međusobno razlikuju, a `scheme` kada je obrazac namera. Konzument koji ne prepoznaje obrazac šeme NE SME da pokuša da ga proširi (RFC-006 §4.6).

`load`, `reps`, `tempo` i `rest` na nivou stavke primenjuju se na svaku seriju stavke. Vrednost na nivou serije nadjačava vrednost na nivou stavke samo za tu seriju.

### 3.5. Nepoznati režimi se ne izvršavaju

Konzument koji naiđe na `mode` koji ne razume NE SME da izvrši blok vraćanjem na `sequential` ili bilo koju drugu podrazumevanu vrednost. TREBALO BI da prikaže stavke bloka i njihove preskripcije, i naznači da struktura izvršavanja nije shvaćena.

Ovo preslikava RFC-006 §3.3 i iz istog razloga. Tiho izvršavanje neprepoznate intervalne strukture kao klasičnih serija ne proizvodi malo drugačiji trening; proizvodi drugačiji fiziološki stimulus, a u kondicionom bloku može da proizvede onaj za koji sportista nije spreman.

## 4. Referentne strukture

### 4.1. `classification`

`workoutType` je obavezan; `level`, `focus[]`, `estimatedDuration`, `environment[]` i `tags[]` su opcioni.

`estimatedDuration` je objekat koji nosi `value` i `unit`, a ne go broj. Go broj neke implementacije čitaju kao minute, a druge kao sekunde, i ništa u dokumentu ne otkriva šta je bilo mišljeno.

### 4.2. `block`

`id`, `mode` i `items` su obavezni. `mode` je `blockMode`; `role` je običan klasifikator čije se preporučene vrednosti — `warmup`, `primary`, `accessory`, `conditioning`, `cooldown`, `finisher` — nose u šemi kao `examples`, a ne kao ograničenje. Blok MOŽE da nosi i prikazno `name` i slobodan tekst `notes`.

`rest` je `restSpec` iz RFC-006 i primenjuje se na granici koju imenuje njegov sopstveni `appliesTo`. Trajanja unutar `modeParams` — `timeCap`, `work`, `rest`, `interval` — svako je `duration`: `value` sa sopstvenim `unit`, iz istog razloga iz kog je to i `estimatedDuration`.

### 4.3. `blockItem`

`id` i `exercise` su obavezni; sve ostalo je preskripcija.

`alternatives[]` navodi zamene **koje autor unapred odobrava** — oprema nedostupna, pokret kontraindikovan, regresija za manje iskusnog sportistu. To je deo preskripcije i putuje sa treningom.

Ovo je različito od zamene koju sportista napravi tokom treninga, što su podaci o izvedenom i pripadaju RFC-009. Razlika je bitna jer to dvoje odgovara na različita pitanja: `alternatives[]` kaže šta autor smatra ekvivalentnim; zabeležena zamena kaže šta se dogodilo. Njihovo sažimanje učinilo bi nameru programa nepovratnom iz istorije njegovog izvršavanja.

### 4.4. `setPrescription`

`index` je obavezan i počinje od 1. Eksplicitan je umesto impliciran pozicijom u nizu da bi serija mogla stabilno da se referencira — RFC-009 će pokazivati na propisane serije iz izvedenih, a pozicije u nizu se pomeraju kada se dokument menja.

`type` razlikuje `warmup`, `working`, `backoff`, `drop`, `cluster` i `amrap` serije. Konzumenti koji izračunavaju trenažni obim TREBALO BI da isključe `warmup` serije; njihovo tretiranje kao radnih serija naduvava obim na način koji se nagomilava kroz ceo program.

`schemeParams` nosi parametre za šemu u kojoj serija učestvuje — procente pada, klaster odmor. Otvoren je iz istog razloga iz kog je i `setScheme.params`: svaki obrazac uzima drugačiji oblik.

`side` je smislen samo tamo gde je `classification.unilateral` referencirane vežbe istinit. Serija MOŽE da nosi slobodan tekst `notes`.

Od verzije šeme 1.1.0 serija nosi i `zone`. Opterećenje, ponavljanja, tempo i odmor oduvek su se mogli navesti po seriji, a intenzitet nije, pa je trening čiji se intenzitet penje iz serije u seriju morao da se deli na po jednu stavku po koraku da bi to rekao. To je bila asimetrija, a ne odluka, i ispravljena je.

### 4.5. `repStyle`

Dve preskripcije u širokoj upotrebi nisu izrazive ničim drugim u modelu: **parcijalna ponavljanja** (namerno smanjen obim pokreta) i **ponavljanja „jedan i po“** (puno ponavljanje praćeno polovinom, računato kao jedno). `tempo` upravlja time koliko brzo se ponavljanje izvodi, a ne njegovim obimom niti sastavom, a do njih ne dopire ni bilo koja metrika ni šema serija.

```json fds:fragment entity=workout
{ "repStyle": { "rangeOfMotion": "partial", "segment": "top" } }
```

| Polje | Vrednosti | Značenje |
|---|---|---|
| `rangeOfMotion` | `full` \| `partial` \| `extended` | `extended` je namerno povećan obim, kao kod mrtvog dizanja iz deficita |
| `segment` | `top` \| `bottom` \| `mid` | Koji deo pokreta parcijalno ponavljanje pokriva. Smisleno samo kada je `rangeOfMotion` `partial` |
| `pattern` | `standard` \| `oneAndAHalf` \| `pulse` | `pulse` su ponovljena kratka ponavljanja u jednoj tački obima |

`repStyle` stoji na stavci ili na pojedinačnoj seriji, pa preskripcija može da traži puna ponavljanja praćena parcijalnim do otkaza bez deljenja stavke na dve.

Definisan je ovde, a ne u biblioteci RFC-006, jer je trening trenutno njegov jedini konzument. Definicija postaje zajednička kada je zatreba drugi konzument; ako zatreba RFC-008, biće u tom trenutku unapređena u novu verziju preskripcije. Njeno unapređivanje sada značilo bi objavljivanje nove verzije zamrznutog URL-a da bi se opslužio korisnik koji još ne postoji.

### 4.6. `settings`

Neke preskripcije nisu ni opterećenje, ni ponavljanja, ni tempo, ni odmor. Traka za trčanje na nagibu od pet procenata, bicikl držan na devedeset obrtaja u minuti — sportista mora da ih podesi pre početka, i ništa drugo u modelu ne dopire do njih.

Dodat u verziji šeme 1.1.0, `settings` je niz metričkih oblika sa priloženom vrednošću:

```json fds:fragment entity=workout
{ "settings": [ { "type": "incline", "unit": "percent", "value": 5 } ] }
```

| Polje | Značenje |
|---|---|
| `type` | Metrički tip iz zajedničkog rečnika RFC-001 — `incline`, `cadence`, `resistanceLevel` i tako dalje |
| `unit` | Njegova jedinica, iz istog rečnika |
| `value` | Broj koji treba podesiti |
| `range` | Pojas umesto tačke, kao `min` i `max` — „kadenca 85 do 95“ |
| `notes` | Slobodan tekst za ovo podešavanje |

Stoji na stavci ili na pojedinačnoj seriji, pa je nagib koji se penje na svakih pet minuta tri serije, a ne tri stavke.

Ovo namerno **nije** nova definicija po podešavanju. Opterećenje, ponavljanja, tempo i odmor zaslužili su po jednu jer svako nosi semantiku prema kojoj konzument mora da postupi — opterećenje ima metodu razrešavanja, odmor ima obuhvat. Nagib ne nosi ništa od toga: to je broj u jedinici koji sportista podesi, a rečnik metrika ga već imenuje. Davanje sopstvene definicije svakom podešavanju značilo bi novu definiciju svaki put kada mašina dobije dugme.

**Otpor je opterećenje, a ne podešavanje.** Nivo otpora mašine menja koliko je rad težak i propisuje se sa `loadTarget.method: "level"`, koji nosi `scale` da se „nivo 8“ ne bi čitao prema numeraciji druge mašine. Nagib i kadenca menjaju šta pokret *jeste*, a ne koliko je težak. Proizvođači podataka TREBALO BI da zadrže tu podelu; konzumenti koji pročitaju `resistanceLevel` podešavanje TREBALO BI da ga prihvate i upozore.

Konzument koji ne može da primeni podešavanje — nema kontrole nagiba na opremi pri ruci — TREBALO BI da ga prikaže sportisti umesto da ga tiho odbaci. Za razliku od neprepoznate metode opterećenja, ovde nema bezbednosnog argumenta za odbijanje: broj je naveden u imenovanoj jedinici i znači isto osobi i mašini.

### 4.7. Izvedeni zbirni prikazi

`targets` i `equipment` sumiraju šta trening trenira i šta mu je potrebno. Oba su **opciona i savetodavna**.

Konzument NE SME da tretira nijedno od njih kao merodavno u odnosu na obilazak stavki. To su izvedeni podaci koji mogu biti odsutni, zastareli ili izračunati pod pretpostavkama koje konzument ne deli — zbirni prikaz proizveden pre nego što je stavka zamenjena više ne opisuje trening. Postoje za izlistavanje i filtriranje, gde je preračunavanje preko cele biblioteke skupo, a približni odgovori prihvatljivi.

### 4.8. Opciona opisna polja

`constraints` beleži šta trening zahteva od sportiste pre početka: `contraindications` (uslovi pod kojima ne bi trebalo da se izvodi), `prerequisites` (kompetencije koje pretpostavlja) i `environment` (gde može da se izvede). Ovo je savetodavna proza, a ne mašinski sprovodive kapije — FDS ne modeluje sportistu prema kome bi se proverile.

`relations` povezuje trening sa drugima preko `type` i `targetId`, sa opcionim `notes`. Preporučeni tipovi su `alternate`, `variation`, `progression`, `regression`, `deload` i `test`. Ovako se varijanta rasterećenja vezuje za trening koji rasterećuje, i ovako RFC-008 može da referencira lakšu alternativu bez dupliranja celog dokumenta.

`media` prati zajedničku definiciju iz RFC-001 — demonstracioni video ili dijagram strukture treninga.

I stavke i blokovi prihvataju `notes`, a blokovi i `name`. `equipment.required` i `equipment.optional` dele zbirni prikaz na ono bez čega trening ne može da se nastavi i ono što samo pomaže.

## 5. Kompozicija sa RFC-006

| Gde | Definicija iz RFC-006 |
|---|---|
| `blocks[].rest`, `items[].rest`, `sets[].rest` | `restSpec` |
| `items[].load`, `sets[].load` | `loadTarget` |
| `items[].reps`, `sets[].reps` | `repTarget` |
| `items[].tempo`, `sets[].tempo` | `tempo` |
| `items[].scheme` | `setScheme` |
| `items[].zone` | `intensityZone` |

Nijedna od njih nije ovde ponovo definisana. Objavljena šema treninga nosi spljoštene kopije, pa implementator koji validira trening nikada ne preuzima biblioteku preskripcije — ali definicije se generišu iz nje, pa to dvoje ne može da se raziđe.

### 5.1. Slaganje metrika sa referenciranom vežbom

Po sidru kompatibilnosti: preskripcija serije TREBALO BI da koristi samo metričke tipove koje referencirana vežba deklariše u svojim `metrics.primary` ili `metrics.secondary`. Propisivanje distance na vežbi koja se meri u ponavljanjima je greška proizvođača podataka.

Proizvođači podataka MOGU da prekorače deklarisane metrike. Konzumenti NE SMEJU da obore validaciju zbog viška, ali TREBALO BI da upozore. Pravilo je upozorenje, a ne ograničenje, jer katalog vežbi i trening mogu dolaziti iz različitih izvora na različitim verzijama, a zastareo katalog ne bi smeo da učini važeći trening nečitljivim.

### 5.2. Kontekst razrešavanja

Trening nasleđuje svaki zahtev razrešavanja ciljnih opterećenja koja sadrži. Utvrđivanje šta je treningu potrebno pre njegovog predstavljanja znači obilazak svakog `loadTarget` i `intensityZone` u dokumentu — pogledajte RFC-006 §5.2. Trening ne deklariše svoje zahteve na jednom mestu, jer su zahtevi svojstvo njegovog sadržaja.

## 6. Verzionisanje i kompatibilnost

Ovaj entitet prati pravila verzionisanja iz RFC-001 §5. Njegov objavljeni URL je zamrznut ugovor; dodaci se isporučuju na URL-u nove verzije.

Dodavanje `mode` vrednosti je SPOREDNA izmena: dokumenti važeći pod starom verzijom ostaju važeći, jer se novi režim ranije validirao kroz sabirnu granu.

<!-- fds:pin workout/v1.0.0/workout.schema.json — this document names the superseded version deliberately, in §6 and again in §9, because releases 1.2.0 and 1.3.0 declare workout at 1.0.0 and a client pinned to either must keep resolving it. New work uses 1.1.0. -->

**1.1.0** je dodala `settings` na stavkama i serijama, i `zone` na seriji. Oba su opciona dodavanja zatvorenim objektima, pa svaki 1.0.0 dokument ostaje važeći nepromenjen — ali 1.1.0 dokument koji koristi bilo koje od njih biva odbačen od strane 1.0.0 šeme, što je ono što ovo čini verzijom, a ne izmenom. `workout/v1.0.0/workout.schema.json` ostaje objavljena i zamrznuta; izdanja 1.2.0 i 1.3.0 deklarišu workout na 1.0.0 i nastavljaju da se razrešavaju. Izdanje 1.4.0 je prvo koje ga deklariše na 1.1.0.

Entiteti se verzionišu nezavisno. Nova verzija treninga ne obavezuje vežbu, opremu ni biblioteku preskripcije da se pomere, i nijedna od njihovih verzija ne obavezuje ovu.

## 7. Smernice za implementaciju

### 7.1. Proizvođači podataka

Koristite režim koji odgovara nameri, a ne onaj koji je najlakše prikazati. Kondicioni blok napisan kao `sequential` sa odmorom ugrađenim u preskripcije nije kružni trening, i konzument posle ne može da povrati nameru.

Emitujte `groupLabel` kad god se stavke smenjuju, uključujući i običnu superseriju od dve vežbe. Košta jedno polje i jedini je signal da stavke nije predviđeno izvoditi jednu za drugom.

### 7.2. Konzumenti

Obilazite `structure.blocks` redom; unutar bloka poštujte `mode`. Ne pretpostavljajte `sequential` kada je `mode` odsutan — on je obavezan, pa je dokument bez njega nevažeći i trebalo bi ga prijaviti, a ne popravljati.

Preračunajte `targets` i `equipment` iz stavki kada je ispravnost bitna.

## 8. Razmatranja bezbednosti i privatnosti

Trening je referentni podatak i po konstrukciji ne sadrži lične podatke. Ne nosi sportistu, telesnu masu, trenažne maksimume ni izvedene vrednosti — svaka relativna preskripcija referencira svoj kontekst umesto da ga ugrađuje (RFC-006 §5).

Implementacija koja razreši trening prema konkretnom sportisti i sačuva rezultat — upisivanje stvarnih kilograma na mesto procenta — proizvela je lične podatke i nasleđuje obaveze koje uz to idu. Taj razrešeni artefakt nije trening u smislu ovog RFC-a.

## 9. Referenca JSON šeme

`https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json`

Zamenjena verzija ostaje dostupna, i klijent fiksiran na izdanje koje deklariše workout na 1.0.0 nastavlja da je preuzima:

`https://spec.vitness.me/schemas/workout/v1.0.0/workout.schema.json`

Nijedan segment putanje nije broj izdanja. Izdanja 1.2.0 i 1.3.0 deklarišu workout na 1.0.0, a izdanje 1.4.0 ga deklariše na 1.1.0, pa je verzija koju treba preuzeti verzija entiteta koju izdanje imenuje — pogledajte §6 i `specification/discovery.md`.

### 9.1. Validacija

```bash
npm run verify schemas
```

## 10. Primer

Trening za gornji deo tela: blok zagrevanja, primarni blok sa top serijom i back-off serijama, pomoćna superserija i kondicioni finišer.

```json
{
  "schemaVersion": "1.1.0",
  "workoutId": "00000000-0000-4000-8000-00000000a001",
  "canonical": { "name": "Upper A", "slug": "upper-a" },
  "classification": {
    "workoutType": "strength",
    "level": "intermediate",
    "estimatedDuration": { "value": 60, "unit": "min" }
  },
  "structure": {
    "blocks": [
      {
        "id": "b1",
        "role": "primary",
        "mode": "sequential",
        "items": [
          {
            "id": "i1",
            "exercise": { "id": "ex.benchPress", "name": "Barbell Bench Press" },
            "scheme": {
              "pattern": "topSetBackoff",
              "sets": 4,
              "params": { "backoffPercent": 10, "backoffSets": 3 }
            },
            "load": { "method": "rpe", "value": 8, "allowHalf": true },
            "reps": { "kind": "range", "min": 3, "max": 5 },
            "rest": { "method": "fixed", "appliesTo": "set", "value": 3, "unit": "min" }
          }
        ]
      },
      {
        "id": "b2",
        "role": "accessory",
        "mode": "superset",
        "modeParams": { "rounds": 3 },
        "rest": { "method": "fixed", "appliesTo": "group", "value": 90, "unit": "s" },
        "items": [
          {
            "id": "i2",
            "groupLabel": "A1",
            "exercise": { "id": "ex.dumbbellRow", "name": "Dumbbell Row" },
            "reps": { "kind": "range", "min": 8, "max": 12 },
            "load": { "method": "rir", "value": 2 }
          },
          {
            "id": "i3",
            "groupLabel": "A2",
            "exercise": { "id": "ex.inclineDbPress", "name": "Incline Dumbbell Press" },
            "reps": { "kind": "range", "min": 8, "max": 12 },
            "load": { "method": "rir", "value": 2 }
          }
        ]
      },
      {
        "id": "b3",
        "role": "finisher",
        "mode": "amrap",
        "modeParams": { "timeCap": { "value": 8, "unit": "min" } },
        "items": [
          {
            "id": "i4",
            "exercise": { "id": "ex.airBike", "name": "Air Bike" },
            "reps": { "kind": "calories", "value": 15 },
            "zone": { "system": "heartRate", "zone": "Z4", "boundsRef": "zone.fiveZoneHeartRate" }
          }
        ]
      }
    ]
  },
  "metadata": {
    "createdAt": "2026-08-09T00:00:00Z",
    "updatedAt": "2026-08-09T00:00:00Z",
    "status": "active",
    "source": "vitness.core"
  }
}
```

Razrađeni primeri za svaku šemu iz §4.1 i svaku strukturu grupisanja iz §4.2 matrice scenarija objavljeni su uz šemu.

## Usaglašenost

Implementacija je usaglašena sa ovom specifikacijom ako:

1. Poštuje `blocks[].mode` za prolazak i završetak, i ne izvršava režim koji ne prepoznaje.
2. Tretira stavke koje dele `groupLabel` kao stavke koje se smenjuju.
3. Odbacuje stavku koja nosi i `sets` i `scheme`.
4. Primenjuje preskripciju na nivou serije preko preskripcije na nivou stavke tamo gde su obe prisutne.
5. Preračunava umesto da veruje u `targets` i `equipment` kada je ispravnost bitna.
6. Isključuje `warmup` serije iz izračunavanja trenažnog obima.
7. Upozorava, umesto da ne uspe, kada serija koristi metrički tip koji referencirana vežba ne deklariše.

## 11. Reference

### 11.1. Normativne reference

- RFC 2119 — Ključne reči za upotrebu u RFC dokumentima
- RFC-001 — Model podataka vežbe
- RFC-006 — Primitivi preskripcije
- JSON Schema Draft 2020-12

### 11.2. Informativne reference

- RFC-002 — Model podataka opreme
- RFC-008 — Model podataka trenažnog programa
- `specification/metrics-guide.md`
