---
title: Kako doprineti
description: Kako doprineti standardu Fitness Data Standard (FDS)
sidebar_position: 2
---
# Kako doprineti standardu Fitness Data Standard (FDS)

Hvala što pomažete da interoperabilnost fitnes podataka bude bolja! Ovaj dokument objašnjava kako predložiti izmene, dodati RFC dokumente i ažurirati šeme i primere.

## Načini doprinosa
- Otvorite issue koji opisuje problem, predlog ili povratne informacije iz implementacije.
- Podnesite PR koji unapređuje dokumentaciju, primere ili materijale upravljanja.
- Predložite ili izmenite RFC, sa konkretnim primerima i planom validacije.

## Izmene RFC dokumenata
1. Napravite fork repozitorijuma i otvorite zasebnu granu.
2. Napišite ili izmenite RFC pod `specification/rfc/`, koristeći postojeći RFC kao šablon.
3. Uključite:
   - Iskaz problema, ciljeve (u obuhvatu / van obuhvata), terminologiju
   - Normativne zahteve i referentne strukture
   - Smernice za ekstenzije i razmatranja bezbednosti/privatnosti
   - Reference na JSON šeme i kompletne primere
   - Smernice o usaglašenosti za proizvođače podataka i konzumente
4. Otvorite PR i zatražite pregled od urednika.

## Izmene šema i primera
- Izmenu napišite u `specification/schema-sources/`, a zatim pokrenite `npm run build:schemas`. `specification/schemas/` se generiše iz tih izvora; nikada tamo ručno ne menjajte `*.schema.json` datoteku. `npm run check:schemas` ponovo gradi i poredi, pa padaju i ručna izmena i izmena izvora komitovana bez ponovne izgradnje.
- Objavljena šema je zamrznuta — njeni bajtovi se ne menjaju nakon izdavanja, jer konzument koji ju je juče preuzeo mora danas dobiti isti dokument. Izmena jedne šeme isporučuje se kao novi direktorijum verzije pored nje, a izgradnja odbija da izmeni zamrznutu datoteku.
- Datoteke `*.example.json` i `README.md` pored generisane šeme pišu se ručno; njih menjate na licu mesta.
- Obezbedite bar jedan kompletan primer po šemi koji demonstrira upotrebu iz stvarnog sveta.
- Validirajte primere lokalno (Ajv Draft 2020‑12):

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```

## Politika identifikatora
- Produkcioni podaci MORAJU koristiti UUIDv4 identifikatore za sve ID-jeve entiteta i sve reference.
- Primeri MOGU koristiti ilustrativne ID-jeve (npr. `eq.barbell`) radi čitljivosti; jasno označene kao isključivo ilustrativne.

## Smernice stila
- Neka JSON ostane važeći (bez komentara i pratećih zareza) i minimalan gde je moguće.
- Koristite BCP 47 za jezičke oznake i mala ASCII slova za slugove (`[a-z0-9-]`).
- U RFC dokumentima koristite sažet, normativan jezik (MUST/SHOULD/MAY).

## Verzionisanje i nekompatibilne izmene
- Nova obavezna polja ili nekompatibilne izmene zahtevaju glavnu verziju.
- Opciona proširenja (polja, enum vrednosti gde je dozvoljeno) su sporedna.
- Redaktorske ispravke su zakrpa.
- Ažurirajte `specification/governance/CHANGELOG.md` sažetkom izmena.

### Tvrdnje o verzijama se proveravaju

`npm run check:versions` čita `specification/releases.json` — koji se generiše iz objavljenih šema — i prema njemu drži svaku tvrdnju o verziji u repozitorijumu. URL šeme mora da se razreši u nešto što je objavljeno; broj izdanja mora imenovati stvarno izdanje; tvrdnja o „trenutnom izdanju“ mora imenovati ono trenutno. Pokrenite ga pre otvaranja PR-a.

Tri anotacije omogućavaju da kažete nešto što provera ne može sama da izvede. Sve tri su običan tekst unutar sintakse komentara koju datoteka već koristi, pa preživljavaju bajt-za-bajt preslikavanje stranica.

<!-- fds:pin workout/v1.0.0/workout.schema.json — named by the worked example below, which shows how to pin the superseded workout version. A marker inside a fenced block is shown rather than made, so this page needs a real one. -->

**Pinovanje starije verzije.** URL na verziji koja je objavljena, ali više nije trenutna, ili je namerna referenca ili zaostala — a te dve izgledaju identično. Recite koja je:

```markdown
<!-- fds:pin workout/v1.0.0/workout.schema.json — releases 1.2.0 and 1.3.0 declare
     workout at 1.0.0, so a client pinned to either must keep resolving this URL. -->
```

Referenca se piše tačno onako kako se razrešava — `<directory>/v<version>/<file>`, ili ime datoteke registra. Pin pokriva datoteku u kojoj se pojavljuje, zahteva stvaran razlog i postaje greška čim ništa u toj datoteci više ne referencira tu verziju. *Povučena* verzija ne može se pinovati: `exercise/v1.0.0` i `equipment/v1.0.0` uopšte se ne serviraju, pa nema na šta pokazati.

**Tvrđenje broja.** Broj u rečenici nije automatski tvrdnja o ovom repozitorijumu — „osam ponavljanja sa sto kilograma“ nije prebrojavanje bilo čega. Označite one koji jesu:

```markdown
<!-- fds:count schemas=10 entities=7 -->
Ten schemas are published. Seven are entities, …
```

Vrednost se proverava prema repozitorijumu na disku, a mora se pojaviti i u okolnoj rečenici, slovima ili ciframa, da marker ne bi tiho prestao da opisuje tekst koji anotira. Pokrenite `npm run check:versions` sa nepoznatim imenom metrike da vidite pun spisak.

Ne označavajte brojeve u `CHANGELOG.md`. Stavka istorije izmena opisuje prošlo izdanje, a njeno vezivanje za današnje stablo učinilo bi da tačan istorijski zapis pada.

**Tvrđenje da je dokument potpun.** Sve iznad proverava nešto što dokument *kaže*. Dokument može biti pogrešan i tako što ne kaže ništa: `SCHEMAS.md` je isporučen bez ijednog pominjanja `program` entiteta i svaka provera je ostala zelena, jer nije postojala rečenica koja bi bila pogrešna. Tamo gde dokument nabraja ceo skup, recite to, i skup se umesto toga uzima iz manifesta:

```markdown
<!-- fds:covers schemas -->
<!-- fds:covers entities -->
<!-- fds:covers releases -->
<!-- fds:covers rfcs -->
<!-- fds:covers packages -->
```

`schemas` pokriva celu datoteku: svaki objavljeni URL šeme mora se negde u njoj pojaviti. Ostala četiri markera anotiraju tabelu neposredno ispod sebe — tabelu entiteta i verzija koju izdanje objavljuje, tabelu sa po jednim redom po izdanju, tabelu sa po jednim redom za svaki RFC u `specification/rfc/` i tabelu sa po jednim redom za svaki paket koji se objavljuje pod `packages/`. Proza u ostalim kolonama ostaje vaša; to koji redovi postoje — ne.

Dodavanje entiteta ili objavljivanje novog izdanja obaraće ove provere dok ih dokumenti ne sustignu. To i jeste poenta: alternativa je stranica koja tiho prestane da opisuje standard.

## Licenca
- Doprinošenjem prihvatate da se vaši doprinosi licenciraju pod ugovorom VITNESS Open Standards License Agreement.
