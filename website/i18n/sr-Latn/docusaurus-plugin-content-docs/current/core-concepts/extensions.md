---
title: Ekstenzije
sidebar_position: 1
---

# Politika ekstenzija i vodič za registar

Ovaj vodič definiše kako proizvođači proširuju Fitness Data Standard (FDS) bez narušavanja interoperabilnosti i kako se rasprostranjene ekstenzije mogu promovisati ka standardizaciji.

## Ciljevi
- Izbeći kolizije ključeva među proizvođačima.
- Održati ekstenzije samoopisujućim i pogodnim za otkrivanje.
- Obezbediti put ka standardizaciji široko usvojenih obrazaca.

## Gde proširivati
- `attributes`: jednostavni parovi ključ/vrednost za lagane ekstenzije koje mogu biti promovisane.
- `extensions`: objekti u opsegu proizvođača za složene domenske podatke.

## Pravila imenskih prostora
- Koristite prefiks `x:` da označite nestandardne ključeve.
- Atributi: `x:<vendor>.<feature>` (npr. `x:vitness.stanceWidth`).
- Ekstenzije: `x:<vendor>` ili `x:<vendor>.<domain>` (npr. `x:vitness`, `x:gym-management`).
- Izaberite stabilan `<vendor>` (ime firme ili obrnuti DNS poput `x:org.vitness`). Držite ga doslednim.
- Ne koristite `fds:` niti ključeve bez prefiksa za ekstenzije.

## Verzionisanje ekstenzija
- Održavajte sadržaj ekstenzija unazad kompatibilnim kada je to moguće.
- Ako je izmena nekompatibilna, uključite eksplicitnu verziju unutar svog imenskog prostora ekstenzije (npr. `extensions: { "x:vitness": { "version": "2" } }`).

## Primer
```json fds:fragment entity=exercise
{
  "attributes": {
    "x:vitness.stanceWidth": "shoulder-width",
    "x:org.example.videoQuality": "1080p"
  },
  "extensions": {
    "x:vitness": {
      "tempo": { "eccentric": 3, "isometric": 1, "concentric": 1 },
      "rangeOfMotion": { "standard": "hip-crease below knee" }
    },
    "x:gym-management": {
      "inventory": { "count": 5, "location": "free-weight-area" },
      "maintenance": { "lastInspection": "2025-08-15", "nextDue": "2025-11-15" }
    }
  }
}
```

## Ponašanje konzumenata
- MORAJU ignorisati nepoznate ključeve u `attributes` i `extensions`.
- TREBALO BI da validiraju vrednosti ekstenzija prema lokalnim ugovorima ako su poznati (opciono).

## Put promocije
1. Usvajanje: ekstenzija stekne usvojenost kod više nezavisnih implementatora.
2. Predlog: podnosi se RFC za promociju koncepta u osnovnu šemu ili u standardizovanu specifikaciju ekstenzije.
3. Pregled: urednici procenjuju semantiku, imenovanje i kompatibilnost.
4. Standardizacija: ako bude prihvaćena, funkcionalnost prelazi u jezgro (sporedno izdanje) ili u imenovanu standardizovanu ekstenziju.

## Razrešavanje kolizija
- Preferirajte ključeve proizvođača u stilu obrnutog DNS-a da smanjite rizik od kolizija.
- Ako se kolizija otkrije, koordinišite kroz issue/PR; urednici mogu predložiti preimenovanje ili sužavanje opsega.

## Bezbednost i privatnost
- Ne uključujte tajne niti lične podatke (PII) u ekstenzije, osim ako to vaša aplikacija zahteva i ako su odgovarajuće zaštićeni.
- Tretirajte URI-je/medije ekstenzija sa istim kontrolama transporta i autorizacije kao osnovne podatke.

