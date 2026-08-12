---
title: Otkrivanje
sidebar_position: 1
---

# Specifikacija krajnje tačke za otkrivanje

Ovaj dokument definiše opcionu HTTP krajnju tačku za otkrivanje, koja klijentima omogućava da otkriju podršku za FDS i mogućnosti izvoza.

## Krajnja tačka
- Metoda: GET
- Putanja: `/.well-known/fitness-data-spec`
- Content-Type: `application/json`
- Keširanje: preporučuje se `Cache-Control: max-age=3600`

## Šema odgovora (neformalna)
```json fds:ignore a discovery document, defined by specification/discovery.md rather than by a published schema
{
  "spec_version": "1.4.0",
  "provider": "Acme Fitness Platform",
  "supported_entities": [
    "exercise",
    "equipment",
    "muscle",
    "muscle-category",
    "body-atlas",
    "workout",
    "program"
  ],
  "entity_versions": {
    "exercise": "1.1.0",
    "equipment": "1.1.0",
    "muscle": "1.0.0",
    "muscle-category": "1.0.0",
    "body-atlas": "1.0.0",
    "workout": "1.1.0",
    "program": "1.0.0"
  },
  "supported_extensions": ["x:vitness", "x:gym-management"],
  "export_endpoints": {
    "exercise": "/api/exercises/export/rfc001",
    "equipment": "/api/equipment/export/rfc002",
    "muscle": "/api/muscles/export/rfc003",
    "muscle-category": "/api/muscle-categories/export/rfc004",
    "body-atlas": "/api/atlas/export/rfc005",
    "workout": "/api/workouts/export/rfc007",
    "program": "/api/programs/export/rfc008"
  }
}
```

## Napomene
- `spec_version` MORA označavati FDS izdanje koje provajder podržava.
- `supported_extensions` TREBALO BI da navede imenske prostore proizvođača koje provajder oglašava; izostavljanje znači da ih nema.
- `export_endpoints` su ilustrativne; provajderi MOGU koristiti bilo koju strukturu putanja. Krajnje tačke TREBALO BI da vraćaju NDJSON ili JSON nizove sa `schemaVersion` po zapisu.
- Autentifikacija i ograničenja broja zahteva su van obuhvata; provajderi TREBALO BI da dokumentuju sve svoje zahteve.

## Izdanje je skup verzija entiteta

`spec_version` imenuje izdanje. To **nije** verzija koju deli svaki entitet, i klijent koji pretpostavi da jeste tražiće URL-ove koji nikada nisu objavljeni.

Entiteti se verzionišu nezavisno. Izdanje 1.4.0 objavljuje exercise, equipment i workout u verziji 1.1.0, dok muscle, muscle-category, body-atlas i program ostaju na 1.0.0. Ne postoji `muscle/v1.4.0/` i nikada neće postojati osim ako se sam muscle ne promeni.

Zamenjena verzija entiteta ostaje dostupna. `workout/v1.0.0/` je i dalje objavljen i i dalje zamrznut, jer izdanja 1.2.0 i 1.3.0 deklarišu workout na 1.0.0, a klijent fiksiran na bilo koje od njih mora i dalje moći da razrešava.

Provajderi stoga TREBALO BI da emituju `entity_versions`, mapirajući svaki podržani entitet na verziju entiteta koju služe. Klijent koji to polje ima može direktno konstruisati URL-ove šema. Klijent koji ga nema mora izdanje razrešiti u njegove verzije entiteta na neki drugi način, a nagađanje je upravo neuspeh koji ovo polje postoji da spreči.

Taj drugi način je objavljen: **https://spec.vitness.me/releases.json** je manifest izdanja i mapira svako izdanje na verzije entiteta i biblioteka koje to izdanje imenuje, uz status svake objavljene verzije šeme — `current`, `superseded` ili `withdrawn`. Generiše se iz objavljenih šema, pa je to isti dokument prema kojem se ova specifikacija proverava. Klijent koji dobije `spec_version` i ništa više može ga tamo razrešiti umesto da pretpostavlja.

Za razliku od šeme, manifest nije zamrznut. Dobija novo izdanje svaki put kada FDS neko objavi, što je i ceo razlog da se preuzima umesto da se kopira.

<!-- fds:covers releases -->

| Izdanje | Dodaje |
|---|---|
| 1.0.0 | exercise, equipment, muscle, muscle-category, body-atlas |
| 1.1.0 | exercise i equipment prelaze na 1.1.0 — prošireni rečnik metrika i karakteristike opterećivanja |
| 1.2.0 | workout |
| 1.3.0 | program |
| 1.4.0 | workout prelazi na 1.1.0 — zone intenziteta po seriji i podešavanja mašina |

Dobijanje novog entiteta jeste novo izdanje čak i kada se ništa postojeće nije promenilo, jer izdanje imenuje *skup* koji objavljuje.

## Preskripcija je biblioteka, a ne entitet

`prescription` je objavljena na `prescription/v1.0.0/prescription.schema.json` i definiše primitive opterećenja, ponavljanja, tempa, odmora, zona i šema serija koje treninzi i programi kombinuju (RFC-006).

**NE SME** se pojaviti u `supported_entities`. Koren njene šeme po konstrukciji ne validira ništa — ne postoji dokument preskripcije koji bi se izvozio, a krajnja tačka koja bi ga nudila odgovarala bi na pitanje koje niko nije postavio. Provajder koji podržava treninge već podržava preskripciju; upravo to znači podržavati treninge.

## Treninzi i programi referenciraju; ne sadrže

Klijent koji preuzima programe neće uz njih dobiti treninge. Program je raspored referenci na treninge (RFC-008 §3.2), pa provajder koji izvozi programe **MORA** izložiti i treninge koje ti programi referenciraju, a klijent **TREBALO BI** da ih razreši pre prikazivanja plana.

Provajderi TREBALO BI da zadrže `workout` u `supported_entities` kad god je `program` prisutan. Provajder koji oglašava programe, a ne i treninge, oglašava dokumente koje niko ne može izvesti.

## Šta krajnja tačka za otkrivanje ne nosi

Nema sportiste, nema telesne mase, nema trenažnih maksimuma, nema izvedenih podataka. FDS ne modeluje nijednu osobu (D6), a dokument otkrivanja opisuje *mogućnosti* provajdera, ne njegove korisnike.

Provajder koji izvozi programe izvozi šablone. Vrednosti prema kojima se personalizovan program razrešava jesu kontekst pozivaoca i putuju odvojeno — pogledajte RFC-006 §5 i RFC-008 §8.
