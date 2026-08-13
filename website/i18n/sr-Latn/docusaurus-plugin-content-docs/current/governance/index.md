---
title: Upravljanje
description: Kako se standard Fitness Data Standard (FDS) razvija, pregleda i objavljuje
sidebar_position: 1
---

# VITNESS Fitness Data Standard — Upravljanje

Ovaj dokument opisuje kako se standard Fitness Data Standard (FDS) razvija, pregleda i objavljuje.

## Vodeći principi {#guiding-principles}

Ovo su ograničenja onoga što će FDS prihvatiti, a ne opis onoga što danas slučajno sadrži. Ona obavezuju saradnike: predlog koji krši neki od njih odbija se iz principa, ma koliko dobro bio osmišljen. Svako isključenje ispod je namerno — odluka sa razlogom, a ne praznina koja čeka da bude popunjena.

1. **FDS opisuje domen, nikada osobu.** Identitet sportiste, telesna masa, maksimumi za jedno ponavljanje i svaki izvedeni ili zabeleženi rezultat namerno su izvan osnovne specifikacije i neće u nju biti dodati. Saradnik ne sme uvesti polje koje nosi ličnu vrednost ili identifikuje subjekt. Upravo to ograničenje omogućava da se FDS dokument slobodno deli, kešira, preslikava i upoređuje: on ne nosi ništa što zahteva saglasnost, proveru privatnosti ili ugovor o obradi podataka.

2. **Preskripcija, a ne izvedeni rezultati.** FDS modeluje ono što je nameravano — plan, trening, preskripciju — i po dizajnu nikada ono što se zaista dogodilo. Saradnik ne sme dodati zabeležene rezultate u osnovni entitet. Beleženje izvedenog ima subjekt, pa nasleđuje obaveze principa 1; ono čeka na model saglasnosti, a ne na rad na šemama.

3. **Format, a ne protokol.** FDS je format podataka. Autentifikacija, autorizacija i transport namerno su prepušteni provajderima koji ga serviraju; krajnja tačka otkrivanja kaže šta se servira, a ne ko sme da čita. Saradnik ne sme u šemu dodati semantiku kontrole pristupa ili transporta.

4. **Zamrznuto znači zamrznuto.** Bajtovi objavljene šeme nikada se ne menjaju. Saradnik ne sme menjati izdatu šemu; izmena se isporučuje kao nova verzija pored nje, a verzija koju starije izdanje i dalje imenuje ostaje servirana i nakon što je zamenjena. To je namerno — konzument koji je juče preuzeo URL mora danas dobiti isti dokument.

5. **Podrazumevano aditivno; nekompatibilne izmene su retke i glasne.** Unutar glavne verzije izmene dodaju i pojašnjavaju — ne uklanjaju i ne pooštravaju. Saradnik koji predlaže nekompatibilnu izmenu nosi teret glavnog izdanja, sa napomenama o migraciji. Unazad kompatibilnost je namerno obećanje, a ne ljubaznost.

6. **Spekulativne funkcionalnosti se odbijaju.** Svaki dodatak donosi složenost koju potom nosi svaki implementator. Saradnik koji predlaže polje mora pokazati stvaran slučaj razmene koji ono omogućava; „nekome bi moglo zatrebati“ po dizajnu nije dovoljno. Malo jezgro je funkcionalnost, a ne ograničenje.

Kada je predložena mogućnost stvarna, ali ne pripada jezgru — uključujući sve što bi dodirnulo lične podatke — ona živi kao ekstenzija u imenskom prostoru `x:<vendor>`, trajno izvan zamrznutog jezgra. [Plan razvoja](/docs/governance/roadmap) beleži kako ovi principi odlučuju šta jeste, a šta nije objavljeno.

## Neutralnost i staranje

*Da li će ovaj standard prisvojiti jedan proizvođač?* To je prvo pitanje koje treba postaviti standardu koji objavljuje kompanija, i ono zaslužuje direktan odgovor, a ne umirujuće ćutanje.

O FDS-u se staraju njegovi urednici (pogledajte Uloge). Danas je to praktično jedan održavalac, potekao iz VITNESS-a; ne postoji ni nezavisna fondacija ni komitet više proizvođača, i tvrditi bilo koje od toga bilo bi neistina. Prisvajanje ne ograničava upravljačko telo koje još ne postoji — ograničava ga struktura samog standarda, a ove garancije deluju već sada, pod staranjem jednog staraoca:

- **Objavljeni standard ne može biti tiho povučen niti izmenjen.** Svaka šema zamrznuta je na stabilnom URL-u (princip 4); njeni bajtovi ne mogu da se promene implementatoru pod nogama, a verzija koju starije izdanje imenuje ostaje servirana i kada bude zamenjena. Staralac ne može uzeti nazad ono od čega konzument već zavisi.
- **Sve se dešava javno.** Specifikacija, njene šeme, njena istorija i njen proces javni su i otvoreno licencirani. Ne postoji privatni fork u kome živi „pravi“ standard; saradnik vidi tačno ono što vidi staralac — i od toga može napraviti fork.
- **Evolucija je aditivna i obrazložena.** Kod izmena koje utiču na kompatibilnost ili semantiku najveću težinu imaju povratne informacije implementatora iz stvarnog sveta (pogledajte Proces odlučivanja), a nekompatibilne izmene nose cenu glavnog izdanja. Staralac ne može jeftino preoblikovati standard oko jednog proizvoda.

Ove provere su namerno strukturne, tako da neutralnost ne počiva na poverenju u staraoca.

Očekuje se da će se način donošenja odluka menjati kako usvajači budu pristizali. Namera je da se stvarna vlast pomera ka implementatorima koji zavise od standarda — tako da se izmena ne može progurati preko prigovora onih koji grade po njemu. Konkretan mehanizam — na primer, zahtevanje izričite saglasnosti nezavisnih implementatora pre nego što izmena bude usvojena — **još nije odlučen** i neće biti utvrđen jednostrano: to je i samo po sebi izmena upravljanja, koja se donosi javno, po procesu iz odeljka Amandmani ispod. Do tada, ovaj odeljak otvoreno kaže gde vlast sedi — kod jednog staraoca, ograničenog gorenavedenom strukturom — umesto da opisuje komitet koji se ne sastaje.

## Uloge
- Urednici: staraoci specifikacije koji održavaju RFC dokumente, šeme i izdanja. Urednici olakšavaju diskusije i obezbeđuju poštovanje procesa.
- Saradnici: svako ko predlaže ili unapređuje RFC dokumente, šeme, primere i dokumentaciju putem issue-a i PR-ova.
- Implementatori: proizvođači i programeri koji grade po specifikaciji; njihove povratne informacije ključne su za praktičnu interoperabilnost.

## Proces odlučivanja
- Podrazumevano: prećutni konsenzus (lazy consensus — ćutanje je saglasnost) posle perioda za pregled od najmanje 5 radnih dana za suštinske izmene.
- Eskalacija: ako konsenzus nije jasan, urednici pozivaju na lako glasanje među urednicima; odlučuje prosta većina.
- Vrednovanje mišljenja: kod izmena koje utiču na kompatibilnost ili semantiku naglasak je na povratnim informacijama implementatora iz stvarnog sveta.

## Životni ciklus RFC-a
1. Nacrt: predlog se piše i podnosi kao PR pod `specification/rfc/`, koristeći RFC šablon.
2. Pregled: otvorena diskusija; urednici traže izmene; primeri i šeme moraju prolaziti validaciju.
3. Prihvaćen: odobren i spojen; dodeljuje mu se ciljna verzija specifikacije (npr. 1.0.0) i prati se u CHANGELOG-u.
4. Zastareo: zamenjen novijim RFC-om; ostaje dostupan tokom cele glavne verzije.

Napomene:
- Izmene koje menjaju obavezna polja ili narušavaju validaciju su glavne.
- Opciona proširenja i pojašnjenja su sporedna.
- Redaktorske ispravke su zakrpa.

## Upravljanje šemama i izdanjima
- Svaki RFC MORA upućivati na odgovarajuću JSON šemu i primere.
- Šeme MORAJU sadržati `$id`, `$schema` i jasan `title` sa kontekstom verzije.
- Izdanja prate SemVer i beleže se u `specification/governance/CHANGELOG.md`.
- Zastarevanja uključuju rokove i smernice za migraciju u okviru odgovarajućeg RFC-a.

## Registar ekstenzija (lagani)
- Ekstenzije proizvođača koriste imenski prostor `x:<vendor>`.
- Popularni obrasci, ili oni koji konvergiraju, MOGU biti predloženi za standardizaciju kroz nov ili izmenjen RFC.
- Urednici održavaju opcioni dokument registra ekstenzija koji katalogizuje široko korišćene ključeve i njihovu semantiku.

## Politika nekompatibilnih izmena
- Nova obavezna polja, sužavanje enumeracija ili uklanjanje ranije važećih struktura zahtevaju glavno izdanje.
- Glavne izmene uključuju napomene o migraciji i, gde je izvodljivo, smernice za automatsko mapiranje.

## Bezbednost i odgovorno obelodanjivanje
- Potencijalne bezbednosne probleme prijavite privatno urednicima (bezbednosni kontakt će biti objavljen).
- Ne otvarajte javne issue-e za neobelodanjene ranjivosti.

## Sastanci
- Podrazumevano asinhrono (issue-i/PR-ovi). Za složene teme mogu se zakazati ad hoc radni sastanci; sažeci se objavljuju javno.

## Amandmani
- Izmene upravljanja predlažu se putem PR-ova i zahtevaju odobrenje urednika.
