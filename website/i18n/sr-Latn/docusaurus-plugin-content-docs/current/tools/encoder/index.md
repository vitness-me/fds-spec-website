---
title: Pregled
description: Gradite, proveravajte, upoređujte i uparujte strukturne ključeve vežbi, opreme, mišića i kategorija mišića
sidebar_position: 1
---

# FDS Encoder

Gradite, proveravajte, upoređujte i uparujte strukturne ključeve.

**Paket:** `@vitness/fds-encoder`  
**Verzija:** 0.1.0  
**Licenca:** MIT

## Pregled {#overview}

FDS Encoder je alat za komandnu liniju i TypeScript biblioteka za četiri [strukturna ključa](../../core-concepts/structural-keys.md): ključ vežbe (`fxi`), ključ opreme (`fxe`), ključ mišića (`fxm`) i ključ kategorije mišića (`fxmg`). Stranice Osnovnih koncepata kažu kako se gradi svaki ključ. Enkoder umesto vas primenjuje ta pravila.

| Ključ | Polje | Primer |
|-----|-------|---------|
| Vežba | `fxi` | `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`, pregib sa bučicama u stojećem stavu |
| Oprema | `fxe` | `FXE=1.0S/k:imp/f:bar.ez`, EZ šipka |
| Mišić | `fxm` | `FXM=1.0/biceps-brachii.long`, duga glava mišića biceps brachii |
| Kategorija mišića | `fxmg` | `FXMG=1.0/hamstring`, mišići zadnje lože natkolenice |

## Šta radi {#what-it-does}

| Zadatak | Komanda | Biblioteka |
|------|---------|---------|
| Proverava ključ i ispisuje njegov zapisani oblik | `check <key>…` | `checkKey`, `writeKey` |
| Proverava svaki ključ u datoteci kataloga | `check --records <file>` | `checkRecord` |
| Upoređuje dva ključa | `compare <a> <b>` | `compareKeys` |
| Smešta mišić u kategoriju | `compare <fxm> <fxmg>` | `fxmInFxmg`, `fxmgCategoriesOf` |
| Gradi ključeve na osnovu odgovora na pitanja | `ask`, `build`, `questions` | `build`, `startAsk`, `stepAsk`, `QUESTIONS` |
| Uparuje zapise sa bibliotekom | `match <records> --library <records>` | `match`, `matchEntryOf` |

## Kako se uklapa u ostatak FDS-a {#how-it-fits-with-the-rest-of-fds}

- **Osnovni koncepti.** Stranice o [strukturnim ključevima](../../core-concepts/structural-keys.md) su pravila. Enkoder ih prati i jednostavnim rečima javlja gde ključ krši neko od njih.
- **Transformator.** [FDS Transformer](/docs/tools/transformer) pretvara vaše izvorne podatke u FDS zapise. On ne popunjava polja ključeva. Pokrenite enkoder nad njegovim izlazom da biste ih dodali ili proverili.
- **Vaši zapisi.** Enkoder čita i piše samo sopstveno polje ključa zapisa i polja ključeva referenci koje zapis sadrži. Sve ostalo u zapisu ostaje kakvo je bilo, do razmaka i zapisa brojeva. Veza koju potvrdite između dva zapisa pripada vašim podacima, u `attributes` ili `extensions`. Enkoder je ne čita i ne piše.

## Brzi početak {#quick-start}

Instalirajte komandu sa npm-a:

```bash
npm install -g @vitness/fds-encoder
```

Proverite ključ:

```bash
fds-encoder check 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands'
```

```text
ok   FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands
```

Ključ prolazi proveru, a enkoder ga ispisuje sa slojevima u standardnom redosledu.

## Programska upotreba {#programmatic-usage}

Iste operacije dostupne su kao TypeScript biblioteka. Instalirajte paket [u svoj projekat](./installation.md#use-the-library-in-a-project), pa:

```typescript
import { checkKey, compareKeys } from '@vitness/fds-encoder';

checkKey('FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands').written;
// 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands'

compareKeys('FXM=1.0/biceps-brachii.long', 'FXM=1.0/biceps-brachii').result; // 'more-specific'
```

[API biblioteke](./library-api.md) navodi svaki izvoz.

## Šta dalje? {#whats-next}

- [Instalacija](./installation.md): pokretanje enkodera iz repozitorijuma.
- [CLI referenca](./cli-reference.md): svaka komanda i opcija.
- [API biblioteke](./library-api.md): izvezene funkcije.
- [Primeri](./examples.md): celoviti prikazi od početka do kraja.
- [Usaglašenost](./conformance.md): testiranje druge implementacije prema objavljenim slučajevima.

## Zahtevi {#requirements}

- **Node.js:** 20.0.0 ili noviji
