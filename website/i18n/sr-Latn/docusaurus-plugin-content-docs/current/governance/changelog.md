---
title: Istorija izmena
description: Istorija verzija i izmena FDS-a
sidebar_position: 3
---

# Fitness Data Standard — istorija izmena

Sve značajne izmene FDS RFC dokumenata i šema dokumentovane su ovde.

Format je inspirisan pristupom Keep a Changelog, a projekat se pridržava semantičkog verzionisanja za izdanja specifikacije.

## [Neobjavljeno]
- Politika imenskog prostora ekstenzija (nacrt) i odeljci o usaglašenosti (planirano).
- **RFC-010 Integritet referenci na entitete (nacrt).** Pet deljenih referenci na
  entitete prihvata vrednosti koje entiteti koje kopiraju ne prihvataju: `name`
  na referenci sme da bude prazan string, a `slug` na referenci se ne proverava
  ni prema čemu, pa dokument čije su sve reference prazne prolazi validaciju i
  ne može da se prikaže. RFC-010 iznosi pravilo — denormalizovana kopija
  prihvata tačno ono što prihvata polje koje kopira — i objašnjava zašto
  njegovo kodiranje odbija dokumente koji danas prolaze validaciju i zato
  pripada većem izdanju. Nijedna šema nije promenjena i nijedno izdanje nije
  napravljeno. `check:refs` poredi svaku referencu sa njenim izvorom i beleži
  postojeća odstupanja, tako da šesta referenca ne može da se doda kopiranjem
  pete, a upravo tako su dve od njih postale pet.

## Alati — šema mapiranja je zamrznuta (2026-08-11)

Nijedna šema entiteta nije izmenjena, nijedno izdanje nije dodato, a trenutno
izdanje je tamo gde je i bilo. Zabeleženo je ovde jer jedna stavka menja ono što
standard obećava o objavljenom URL-u, a to je činjenica upravljanja, ne pakovanja.

### Izmenjeno
- **Šema mapiranja na 1.1.0 je zamrznuta.** Objavljena je namerno nezamrznuta,
  jer je zamrzavanje bajtova na trajnom URL-u jedini čin ovde koji se ne može
  povući, a sada je servirana dovoljno dugo da je imenuje `$schema` u
  konfiguracionim datotekama koje ovaj projekat ne poseduje. Njeni bajtovi se
  više neće menjati: izmena znači novi direktorijum verzije pored nje. Šema
  mapiranja 1.0.0 ostaje objavljena i ostaje zamrznuta, kao i od trenutka kada
  je zamenjena.

  Šema mapiranja je `kind: tooling` u manifestu izdanja — konfiguriše alat i
  nijedno izdanje je ne imenuje — pa je njeno zamrzavanje odluka isključivo o
  tom URL-u.

- Referentni alati objavljeni su kao **0.2.0**, oba paketa. Nijedan nije deo
  izdanja specifikacije, ali transformator je način na koji većina konzumenata
  prvi put sretne standard, pa tri njegove izmene vredi znati odavde: sada
  razrešava svako objavljeno izdanje i van mreže, a ne samo najstarije;
  podrazumevano koristi trenutno izdanje umesto 1.0.0; a `validate --version`
  sada validira, umesto da se poklopi sa istoimenom opcijom samog programa,
  ispiše verziju paketa i uspešno izađe ne pročitavši ulaz. Skill paket
  dokumentuje svaki entitet i svaku biblioteku koje trenutno izdanje imenuje,
  što se proverava pri svakom pokretanju.

## Izdanje šeme — workout 1.1.0 (2026-08-10)

### Dodato
- `settings[]` na stavci treninga i na pojedinačnoj seriji — podešavanja mašine
  i okruženja koja trening propisuje, kao oblik metrike iz RFC-001 sa priloženom
  vrednošću. Nagib trake i kadenca bicikla pre ovoga nisu imali dom; `incline`,
  `cadence` i `resistanceLevel` bili su u vokabularu metrika bez mesta gde bi im
  se prikačila vrednost.
- `zone` na seriji. Opterećenje, ponavljanja, tempo i odmor oduvek su se mogli
  iskazati po seriji, a intenzitet nije, pa je trening čiji se intenzitet penjao
  iz serije u seriju morao da se deli na po jednu stavku po koraku. To je bila
  asimetrija, a ne odluka.
- `workout.machine-settings.example.json`, i deset kardio treninga i treninga
  izdržljivosti koji upotpunjuju §4.4 matrice pokrivenosti.

### Izmenjeno
- Transformator uključuje u paket izdanje **1.4.0**, koje servira workout na
  1.1.0. Izdanja 1.0.0 do 1.3.0 ostaju uključena.
- `check:scenarios` sada nameće svih sedam odgovorivih odeljaka matrice
  pokrivenosti — **87 redova**, umesto ranijih 54.

### Kompatibilnost
- Čisto aditivno. Svaki workout dokument verzije 1.0.0 validira se prema 1.1.0
  neizmenjen; dokument 1.1.0 koji koristi bilo koji od dva dodatka šema 1.0.0
  odbija — upravo to ovo čini verzijom, a ne izmenom.
- **`workout/v1.0.0/` ostaje objavljen i zamrznut.** Izdanja transformatora
  1.2.0 i 1.3.0 deklarišu workout na 1.0.0, a zamrznuti URL koji nestane gori je
  od onog koji se promeni.

## Izdanje šeme — program 1.0.0 (2026-08-10)

### Dodato
- `program/v1.0.0` — trenažni program iz RFC-008. Raspored referenci na treninge
  kroz vreme: ciklusi, nedelje, raspoređivanje po danima, izmene po pojedinačnom
  pojavljivanju, pravila progresije i uslovno grananje. Program ne sadrži
  treninge; on pokazuje na njih, pa se trening koji dele četiri programa piše
  jednom i ispravlja jednom.
- `references.trainingMaxes[]` — deklariše iz kojih se dizanja program računa i
  kako pozivalac izvodi svaki broj. Nikada ne nosi sam broj, a RFC-008 §8.1
  normativnim tekstom kaže da implementacija NE SME da ga doda.
- 18 razrađenih primera programa, po jedan za svaki red §4.6 (periodizacija) i
  §4.7 (raspoređivanje) matrice pokrivenosti.
- Četiri registra pod `specification/registries/`: tip vežbe, tip treninga,
  uloga bloka i zona intenziteta. `exerciseType` ne nosi ni `enum` ni
  `examples`, pa je njegov registar jedino mesto gde je taj vokabular zapisan.
- Stranice sajta za šeme treninga, programa i preskripcije. Sve tri su bile
  objavljene na zamrznutim URL-ovima koje dokumentacija nikada nije pominjala.

### Izmenjeno
- Transformator uključuje u paket izdanje **1.3.0**, koje dodaje program.
  Izdanja 1.0.0 do 1.2.0 ostaju uključena za konzumente pinovane na njih.
- `discovery.md` pokriva svih sedam entiteta i dodaje `entity_versions`.
  Izdanje imenuje *skup* verzija entiteta, pa klijent koji izdanje razvije u
  segment putanje traži URL-ove koji nikada nisu objavljeni.
- Udaljeno preuzimanje šeme koje odgovori sa 200 i nečim što nije šema sada pada
  sa porukom koja imenuje tip sadržaja i URL. Ranije je greška parsiranja bila
  progutana i transformator se tiho vraćao na šeme iz paketa, što se ne
  razlikuje od rada van mreže.

### Ispravljeno
- Objavljena stranica vodiča za metrike nije bila ponovo izgrađena nakon
  proširenja vokabulara metrika, pa je sajt dokumentovao tipove koje je standard
  prevazišao.
- Slot trenažnog maksimuma poklapa se po svom polju `exercise`, a ne po `id`.
  Šema je opisivala pogrešan ključ.

### Kompatibilnost
- Čisto aditivno. Nijedna postojeća šema nije izmenjena; svaki objavljeni primer
  validira se neizmenjen. Svaka objavljena šema sada je zamrznuta.

## Izdanje šema — prescription 1.0.0, workout 1.0.0 (2026-08-09)

### Dodato
- `prescription/v1.0.0` — biblioteka definicija iz RFC-006: `loadTarget` (13
  metoda), `repTarget`, `tempo`, `restSpec`, `intensityZone`, `setScheme`,
  `progressionRule`. Nije entitet; njen koren ne validira ništa, a RFC-007 i
  RFC-008 komponuju njene definicije.
- `workout/v1.0.0` — propisani trening iz RFC-007. Blokovi stavki sa režimom
  izvršavanja `mode`, pa kružni trening, EMOM, AMRAP, Tabata i intervalni rad ne
  traže sopstvenu šemu.
- `repStyle` na stavkama treninga i serijama, koji pokriva parcijalna i
  jedan-i-po ponavljanja — dva reda matrice scenarija koja ništa drugo nije
  moglo da izrazi.
- 36 razrađenih primera treninga, po jedan za svaki red §4.1 i §4.2 matrice
  pokrivenosti, i 69 datoteka primera preskripcije koje pokrivaju svaku vrednost
  diskriminatora.

### Izmenjeno
- Transformator uključuje u paket izdanje **1.2.0**, koje dodaje workout.
  Izdanja 1.1.0 i 1.0.0 ostaju uključena za konzumente pinovane na njih.
  Izdanje imenuje *skup* verzija entiteta, pa je dobijanje novog entiteta nov
  skup iako se nijedan postojeći entitet nije promenio.
- CI je dobio četiri provere: vodič za metrike pokriva vokabular metrika, RFC
  dokumenti i njihove šeme slažu se u oba smera, datoteke primera preskripcije
  odgovaraju definicijama koje ilustruju, i svaki red matrice scenarija ima
  razrađen primer.

### Kompatibilnost
- Čisto aditivno. Nijedna postojeća šema nije izmenjena; svaki objavljeni primer
  validira se neizmenjen.

## Izdanje šema — exercise 1.1.0, equipment 1.1.0 (2026-08-06)

Entiteti se verzionišu nezavisno. Ovo izdanje pomera exercise i equipment
napred; muscle, muscle-category i body-atlas su neizmenjeni i zadržavaju svoje
`v1.0.0` URL-ove.

### Dodato
- `exercises/v1.1.0` — opcioni blok `loading` koji opisuje kako pokret prima
  spoljašnje opterećenje (`externalLoad`, `assisted`, `asymmetric`).
- `equipment/v1.1.0` — opcioni blok `loading` koji nosi najmanji upotrebljivi
  korak opterećenja sprave (`increment`) i to da li se opterećenje bira na steku
  (`stackBased`). Koraci žive na opremi, a ne na vežbi: najmanji korak je
  svojstvo sprave.
- Vokabular metrika: `rir`, `percent1RM`, `percentBodyweight`, `velocity`,
  `cadence`, `rounds`, `sets`, `rest`, `incline`, `resistanceLevel`, `oneRepMax`.
- Jedinice metrika: `percent`, `rpm`, `spm`, `level`, `ms`.
- Primeri: `exercise.example.assisted`, `exercise.example.conditioning`,
  `exercise.example.velocity`, `equipment.example.stack`.

### Izmenjeno
- `specification/schemas/.integrity.json` beleži sha256 za svaku objavljenu
  šemu. Zamrznuta stavka više ne može promeniti sadržaj — objavljivanje nove
  verzije jedini je način da se promeni izdati URL.
- Transformator uključuje u paket 1.1.0 pored 1.0.0 i podrazumevano koristi
  1.1.0. Pinujte `--version 1.0.0` da ostanete na prethodnom izdanju.

### Kompatibilnost
- Samo aditivno. Svaki dokument važeći po prethodnim šemama ostaje važeći; svi
  postojeći primeri validiraju se neizmenjeni.
- `exercises/v1.0.0` i `equipment/v1.0.0` su zamenjeni, a ne zamrznuti na mestu
  — u trenutku izdavanja nisu imali spoljne konzumente.

## [0.1.0] — 2025-09-09 (Nacrt)
### Dodato
- RFC‑001 Model podataka vežbe (nacrt) sa šemom `exercises/v1.0.0` i primerom.
- RFC‑002 Model podataka opreme (nacrt) sa šemom `equipment/v1.0.0` i primerom.
- RFC‑003 Model podataka mišića (nacrt) sa šemom `muscle/v1.0.0` i primerom.
- RFC‑004 Model podataka kategorije mišića (nacrt) sa šemom `muscle/muscle-category/v1.0.0` i primerom.

### Napomene
- Pojašnjena politika identifikatora: UUIDv4 je obavezan u produkciji; primeri mogu koristiti ilustrativne ID-jeve radi čitljivosti.
- Ustanovljena pravila verzionisanja i kompatibilnosti za proizvođače podataka i konzumente.
