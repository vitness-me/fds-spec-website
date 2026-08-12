---
title: Internacionalizacija
sidebar_position: 1
---

# Internacionalizacija (i18n) i konvencije za slugove

Ovaj vodič precizira pravila za jezike i slugove koja se koriste u svim FDS entitetima (vežbe, oprema, mišići, kategorije mišića).

## Jezičke oznake
- Koristite BCP 47 jezičke oznake za `localized[*].lang` (npr. `en`, `en-GB`, `sr`).
- Oznake TREBALO BI da budu onoliko specifične koliko je potrebno, ali ne više od toga (preferirajte `en` u odnosu na `en-US` osim ako je zaista neophodno).
- Proizvođači podataka TREBALO BI da obezbede podrazumevani lokalitet (obično engleski) unutar `canonical`.

## Dobre prakse lokalizacije
- Obezbedite potpune prevode obaveznih `canonical` polja kada dodajete stavku za novi lokalitet.
- Izbegavajte delimične prevode koji narušavaju korisničko iskustvo.
- Držite alijase jezički prikladnim i izbegavajte dupliranje kanonskih imena na istom jeziku.

## Pravila za slugove
- Skup znakova: isključivo mala ASCII slova `[a-z0-9-]`.
- Dužina: najmanje 2 znaka.
- Bez razmaka, bez crtica na početku ili kraju; uzastopne crtice sažeti u jednu.
- Izvođenje: normalizovati u NFC, ukloniti dijakritike, prebaciti u mala slova, zameniti razmake/interpunkciju crticama, ukloniti suvišno sa krajeva.

## Stabilnost i jedinstvenost
- Slugovi TREBALO BI da budu stabilni nakon objavljivanja, radi očuvanja referenci i obeleživača.
- Slugovi MORAJU biti jedinstveni unutar svog tipa entiteta (npr. slugovi opreme jedinstveni među opremom).
- Ako dođe do kolizije slugova, preferirajte minimalni sufiks za razlikovanje (`-v2`, `-alt` ili domenski specifičnu oznaku poput `-barbell`).

## Primeri
| Ime                      | Slug            |
|--------------------------|-----------------|
| "Back Squat"              | `back-squat`    |
| "Sentadilla trasera"      | `sentadilla-trasera` |
| "Čučanj sa šipkom"        | `cucanj-sa-sipkom` |

## Preporučeni rezervni mehanizam
- Konzumenti TREBALO BI da implementiraju rezervni lokalitet: `lang-region` → `lang` → podrazumevani.
- Ako nijedna lokalizovana stavka nije dostupna, vratite se na kanonsko `name`.
