---
title: Primitivi preskripcije
description: Koliko opterećenja, koliko ponavljanja, kojim tempom, koliko odmora — zajedničke definicije koje treninzi i programi kombinuju
sidebar_position: 7
---

# Primitivi preskripcije (v1.0.0)

Preskripcija odgovara na četiri pitanja o seriji: **koliko opterećenja, koliko ponavljanja, kojim tempom i koliko odmora.** Sve u FDS-u što propisuje rad kombinuje ove definicije, pa serija unutar samostalnog treninga i ista serija unutar dvanaestonedeljnog programa znače potpuno isto.

## Ovo je biblioteka, a ne entitet

Svaka druga šema ovde opisuje dokument koji možete držati u ruci: vežbu, trening, program. Ova ne.

`prescription.schema.json` objavljuje `$defs` biblioteku i **koren njene šeme ne validira ništa** — on je bukvalno `{"not": {}}`. Ne postoji nešto što bi bilo dokument preskripcije. Ne možete ga izvesti, a validator uperen u koren odbaciće sve što mu date — i to ispravno.

Ono prema čemu validirate jeste *definicija unutar nje*. Svaka objavljena datoteka primera imenuje definiciju koju ilustruje, i CI ih validira upravo tako, a ne prema korenu.

Transformator ne nosi ovu šemu iz istog razloga. On validira entitete, a biblioteka definicija to nije.

**URL:** `https://spec.vitness.me/schemas/prescription/v1.0.0/prescription.schema.json`

## Definicije

| Definicija | Odgovara na |
|---|---|
| `loadTarget` | Koliko opterećenja — 13 metoda, od apsolutnog kilograma do RPE vrednosti koju sportista razrešava pod šipkom |
| `loadRange` | Opterećenje izraženo kao raspon umesto kao tačka |
| `repTarget` | Koliko ponavljanja — ili koliko dugo, koliko daleko, koliko kalorija |
| `tempo` | Kojom brzinom se izvodi svaka faza ponavljanja |
| `tempoPhase` | Jedna faza toga, kada pauzi treba sopstveno trajanje |
| `restSpec` | Koliko odmora, i na kojoj granici se primenjuje |
| `restScope` | Da li je ta granica serija, grupa ili blok |
| `intensityZone` | Zona u imenovanom sistemu — srčani ritam, snaga, tempo kretanja, doživljeni napor |
| `setScheme` | Imenovani obrazac preko serija, sa svojim parametrima |
| `progressionRule` | Kada se preskripcija menja, i kako |

## Dva pravila koja vredi pročitati pre implementacije

### Nepoznata metoda se ignoriše, nikada ne pogađa

Konzument koji naiđe na `loadTarget.method` koji ne razume **MORA** da ignoriše taj cilj i **TREBALO BI** da upozori. Ne sme da podmetne podrazumevanu vrednost, prenese opterećenje prethodne serije niti ga izvede iz konteksta.

Ovo je strože od pravila „upozori i nastavi“ koje važi za klasifikatore drugde u FDS-u, i to namerno. Neprepoznat `exerciseType` proizvodi pogrešno označenu vežbu. Pogođeno opterećenje proizvodi šipku koju neko pokušava da podigne.

Isto pravilo važi za `setScheme.pattern` koji ne prepoznajete: nemojte ga proširivati. Proširivanje obrasca zahteva poznavanje njegove semantike, a pogrešno proširenje menja trening umesto da samo ne uspe da ga prikaže.

### Većina opterećenja nije razrešiva iz samog dokumenta

`70% 1RM` je instrukcija, a ne težina. Postaje težina tek u kombinaciji sa maksimumom za jedno ponavljanje — brojem koji FDS namerno ne nosi, jer FDS ne modeluje nijednu osobu.

Isto važi za `percentBodyweight`, za `relative` ciljeve koji referenciraju prethodni trening, za `autoregulated` ciljeve koji referenciraju stanje izvođenja, i za svaku `intensityZone`, čije su oznake besmislene bez ličnih granica.

Konzument koji namerava da prikaže apsolutna opterećenja mora biti u stanju da obezbedi taj kontekst za metode na koje nailazi, i **ne sme da izmišlja ono što mu nedostaje**. Prikazati preskripciju onako kako je napisana — „70% 1RM“ — jeste pošteno i upotrebljivo. Izmišljen broj nije nijedno od toga.

RFC-006 §5 navodi, metodu po metodu, tačno šta je svakoj potrebno i odakle to dolazi.

## Zašto diskriminisana unija sa sabirnom granom

`loadTarget`, `repTarget` i `restSpec` biraju sadržaj prema polju `method` ili `kind`. Ta polja ne mogu biti otvoreni stringovi: otvoren diskriminator ne bira nijednu granu, pa ili svaka grana odgovara ili nijedna, i dokument uopšte ne može da se validira.

Svaka unija zato navodi svoje poznate članove i dodaje jednu poslednju, sabirnu (catch-all) granu za vrednosti koje ova verzija ne definiše — pri čemu ta grana izričito isključuje poznate vrednosti. To isključenje je nosivo u oba smera. Bez njega bi ispravan `{"method": "absolute", …}` odgovarao dvema granama i bio odbačen; još gore, *neispravno oblikovana* poznata metoda propala bi u permisivnu granu i validirala se, a upravo je to tihi prolaz koji ovaj standard postoji da spreči.

Implementacije koje proširuju ove unije moraju očuvati tu disjunktnost.

## Razrađeni primeri

Uz šemu je objavljeno 69 datoteka primera, po jedna za svaku definiciju i po jedna za svaku vrednost diskriminatora, svaka imenovana prema onome što demonstrira i indeksirana u [README datoteka primera](https://spec.vitness.me/schemas/prescription/v1.0.0/README.md).

Uključeni su i negativni primeri — dokumenti koji **moraju** biti odbačeni. Šema koja prihvata sve prolazi svaki pozitivan test.

## Specifikacija

[RFC-006: Primitivi preskripcije](../specifications/rfc-006-prescription-primitives) je normativni dokument. Pogledajte i [RFC-007](../specifications/rfc-007-workout-data-model) za to kako ih trening kombinuje, i [RFC-008](../specifications/rfc-008-program-data-model) za to kako to čini program.
