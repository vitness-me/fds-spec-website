---
title: Plan razvoja
description: Šta standard Fitness Data Standard pokriva danas, a šta namerno ne
sidebar_position: 4
---

# Plan razvoja

Šta FDS pokriva danas, šta je sledeće i — deo koji većina planova razvoja izostavlja — šta je namerno isključeno i zašto.

## Objavljeno

**RFC-001 do RFC-005** — katalog. Vežbe i registri na koje one upućuju: oprema, mišići, kategorije mišića i atlas tela koji vezuje mišiće za vizuelnu anatomiju.

**RFC-006 Primitivi preskripcije** — biblioteka definicija, a ne entitet. Opterećenje, ponavljanja, tempo, odmor, zone intenziteta, šeme serija i pravila progresije, definisani jednom, tako da serija znači isto gde god da se pojavi.

**RFC-007 Model podataka treninga** — jedan propisan trening. Blokovi stavki, gde svaki blok nosi režim izvršavanja, pa su klasične serije, superserije, kružni trening, EMOM, AMRAP, Tabata i intervalni rad sve jedna ista šema.

**RFC-008 Model podataka trenažnog programa** — raspored referenci na treninge kroz vreme. Ciklusi, nedelje, raspoređivanje po danima, prilagođavanje po pojedinačnom pojavljivanju, progresija i uslovno grananje.

**RFC-010 Integritet referenci na entitete** — šta moraju da nose reference koje entiteti drže jedni na druge, da bi dokument mogao da se prikaže u listi i bez njihovog razrešavanja. Normativan od usvajanja; šeme ne mogu da ga kodiraju do većeg izdanja, jer šema koja počne da odbija prazan string odbija dokumente koji danas prolaze validaciju.

Sve objavljene šeme su zamrznute. Zamrznuti URL nikada ne menja svoje bajtove; izmena znači novu verziju.

## Sledeće

### RFC-009 — Izvedeni podaci

Sve iznad je **preskriptivno**: ono što je nameravano. Ništa u FDS-u ne beleži šta se zaista dogodilo.

Ta praznina je namerna i ona je razlog što RFC-009 nije isporučen. Izvedeni podaci imaju subjekt — osobu koju je moguće identifikovati, koja je podigla određenu težinu određenog dana — a onog trenutka kada dokument ima subjekt, on stiče obaveze saglasnosti, zadržavanja, prenosivosti i brisanja koje dosežu do svakog sistema kroz koji prođe. Katalog, treninzi i planovi mogu se slobodno objavljivati, keširati, preslikavati i upoređivati upravo zato što nijedan od njih ne opisuje osobu.

RFC-009 zato čeka na model saglasnosti i privatnosti, a ne na dizajn šeme. Šema je lakši deo.

Dve odluke su već utvrđene. Zapis će nositi **zamrznuti snimak preskripcije prema kojoj je izveden**, jer plan izmenjen naknadno ne sme prepisivati istoriju. A njegov subjekt biće **neprozirna opciona referenca**, a ne entitet User ili Profile — FDS ne modeluje nijednu osobu, a dodavanje osobe da bi se rešilo beleženje uvuklo bi identitet u svaki referentni dokument.

### Registri i usaglašenost

Registri preporučenih vrednosti objavljeni su i pod proverom. Skupovi testova usaglašenosti — korpus prema kome proizvođač podataka može da se validira da bi tvrdio podršku — prirodan su sledeći korak sada kada je matrica pokrivenosti potpuna.

## Namerno van obuhvata

Ovo nisu „još ne“. Ovo su odluke — [Vodeći principi](/docs/governance#guiding-principles) iskazuju ih kao obavezujuća ograničenja; ispod je šta ona isključuju i zašto.

**Identitet sportiste, telesna masa, maksimumi za jedno ponavljanje.** FDS ne nosi lične vrednosti, uključujući i one iz kojih se računa personalizovan program. Program deklariše da referencira trenažni maksimum za zadnji čučanj i kako se taj broj izvodi; nikada ne nosi sam broj. Prihvaćena posledica je da potpuno personalizovan program ne može da napravi *round-trip* kao jedan samostalan dokument — izvoz je plan plus zaseban kontekst razrešavanja.

**Autentifikacija i autorizacija.** Format podataka, a ne protokol. Provajderi dokumentuju sopstvene zahteve; krajnja tačka otkrivanja kaže šta servira, a ne ko sme da čita.

**Generisani izbor vežbi.** Dan u programu referencira trening, što zahteva trening koji postoji. Ne postoji neodređen dan, jer program čiji sadržaj proizvodi generator ne može da se pročita bez tog generatora — suprotno od formata za razmenu. Prilagođavanje opterećenja *jeste* izrazivo, kroz autoregulisane ciljeve i deklarisana pravila progresije.

## U razmatranju

Oblasti koje odgovaraju nadležnosti standarda, ali nemaju usvojen dizajn:

- **Ishrana i planiranje obroka** — velik domen sa sopstvenim problemima vokabulara; verovatno srodni standard, a ne ekstenzija ovog.
- **Oporavak, san i mapiranje podataka sa nosivih uređaja** — tesno vezano za ista pitanja ličnih podataka kao RFC-009.
- **Telesne mere i sastav tela** — lično po definiciji; blokirano istim modelom.

## Doprinos

Ideje za buduće RFC dokumente su dobrodošle:

1. **Otvorite issue** na [GitHub-u](https://github.com/vitness-me/fds-spec-website/issues) da predložite oblast.
2. **Podnesite nacrt RFC-a** prateći [smernice za doprinos](/docs/governance/contributing).
3. **Podelite povratne informacije iz implementacije** — najkorisniji doprinos je slučaj koji trenutne šeme ne mogu da izraze. Svaki takav do sada pronađen promenio je standard.
