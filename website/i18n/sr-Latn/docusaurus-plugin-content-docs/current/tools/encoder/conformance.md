---
title: Usaglašenost
description: Pokretanje slučajeva usaglašenosti strukturnih ključeva nad alatom FDS Encoder ili drugom implementacijom
sidebar_position: 6
---

# Usaglašenost

Repozitorijum specifikacije objavljuje test slučajeve za četiri strukturna ključa, u [`specification/conformance/structural-keys/`](https://github.com/vitness-me/fds-spec-website/tree/main/specification/conformance/structural-keys). Oni proveravaju da implementacija čita, piše i upoređuje ključeve onako kako to opisuju stranice o [strukturnim ključevima](../../core-concepts/structural-keys.md). FDS Encoder prolazi sve njih. Ako ključeve pišete sopstvenim kodom, pokrenite slučajeve nad njim.

## Datoteke {#the-files}

| Datoteka | Pokriva |
|------|--------|
| `syntax.json` | Svaki sloj, simbol i pravilo četiri ključa. Validan slučaj daje zapisani oblik ključa; nevalidan slučaj daje razlog zbog kog ne prolazi |
| `compare.json` | Dva ključa istog tipa i kako se porede: `same`, `more-specific`, `overlap` ili `different` |
| `build.json` | Odgovori na pitanja enkodera i ključevi koje oni grade |
| `cross-check.json` | Ključ vežbe prema ključu njene opreme, i ključ mišića smešten u ključ kategorije |

Svaki slučaj ima `id` i `about`, rečenicu koja kaže šta proverava. Datoteke su običan JSON, pa skup testova na bilo kom jeziku može da ih čita. [README](https://github.com/vitness-me/fds-spec-website/blob/main/specification/conformance/structural-keys/README.md) pored njih opisuje svako polje.

## Pokretanje nad alatom FDS Encoder {#run-them-against-the-fds-encoder}

Iz korena klona izgradite enkoder i pokrenite slučajeve:

```bash
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
node scripts/check-conformance.mjs
```

```text
conformance cases against @vitness/fds-encoder
  syntax             848/848 passed
  compare            67/67 passed
  build              73/73 passed
  exerciseEquipment  32/32 passed
  muscleInCategory   14/14 passed
```

## Pokretanje nad drugom implementacijom {#run-them-against-another-implementation}

Napišite adapter: JavaScript modul čiji podrazumevani izvoz obavija vašu implementaciju u ove funkcije.

| Funkcija | Vraća |
|----------|---------|
| `check(key)` | `{ ok, written }`: da li je ključ validan, i njegov zapisani oblik |
| `compare(a, b)` | `{ result, specific }`: `same`, `more-specific`, `overlap` ili `different`, a uz `more-specific` i koji je ključ specifičniji, `'a'` ili `'b'` |
| `crossCheck(fxi, fxe)` | Kodove upozorenja za ključ vežbe i ključ njene opreme: `[]` kada se slažu |
| `muscleInCategory(fxm, fxmg)` | `'in'`, `'partly-in'` ili `'not-in'` |
| `build(answers)` | Opciono. `{ fxi, fxe }` za skup odgovora na pitanja enkodera, ili `null` kada su odgovori odbijeni |

`name` imenuje izveštaj. Funkcija koja baci izuzetak obara svoj slučaj.

Ovde `my-keys.mjs` predstavlja vaš sopstveni kod:

```js title="my-adapter.mjs"
import * as keys from './my-keys.mjs';

export default {
  name: 'my implementation',
  check(key) {
    const c = keys.checkKey(key);
    return { ok: c.ok, written: c.written };
  },
  compare(a, b) {
    const c = keys.compareKeys(a, b);
    return { result: c.result, specific: c.specific };
  },
  crossCheck: (fxi, fxe) => keys.crossCheck(fxi, fxe).map((w) => w.code),
  muscleInCategory: (fxm, fxmg) => keys.fxmInFxmg(fxm, fxmg).relation,
};
```

Prosledite njegovu putanju opcijom `--adapter`:

```bash
node scripts/check-conformance.mjs --adapter ./my-adapter.mjs
```

```text
conformance cases against my implementation
  syntax             848/848 passed
  compare            67/67 passed
  build              0/73 passed, 73 skipped
  exerciseEquipment  32/32 passed
  muscleInCategory   14/14 passed
```

Ovaj adapter nema `build`, pa se slučajevi gradnje preskaču. To su odgovori na sopstvena pitanja enkodera, koja ispisuje `fds-encoder questions --json`; implementacija sa sopstvenim načinom građenja ključeva izostavlja `build`.

Kada slučaj ne prođe, komanda ga navodi sa onim što slučaj očekuje i onim što je adapter vratio, i izlazi sa 1. Adapter čiji `muscleInCategory` uvek vraća `'in'` daje:

```text
conformance cases against my implementation
  syntax             848/848 passed
  compare            67/67 passed
  build              0/73 passed, 73 skipped
  exerciseEquipment  32/32 passed
  muscleInCategory   9/14 passed

5 case(s) failed:

  muscleInCategory partly-in-union: {"want":"partly-in","got":"in"}
  muscleInCategory partly-in-action: {"want":"partly-in","got":"in"}
  muscleInCategory partly-in-part-term: {"want":"partly-in","got":"in"}
  muscleInCategory not-in: {"want":"not-in","got":"in"}
  muscleInCategory not-in-helper: {"want":"not-in","got":"in"}
```

Potražite slučaj po njegovom `id` u datoteci slučajeva da biste pročitali šta proverava.

## Provera samog pokretača {#check-the-runner-itself}

`--self-test` daje pokretaču pogrešan odgovor u svakoj grupi redom i proverava da ta grupa ne prolazi, i to samo ta grupa. Dokazuje da pokretač hvata pogrešan rezultat pre nego što poverujete zelenom izveštaju:

```bash
node scripts/check-conformance.mjs --self-test
```

```text
  ok    self-test — every group fails on a wrong answer, and only that group
```

`npm run check:conformance` pokreće samoproveru, pa slučajeve nad alatom FDS Encoder.

## Razlozi za nevalidne ključeve {#reasons-for-invalid-keys}

Nevalidan slučaj imenuje i kod problema koji FDS Encoder prijavljuje za taj ključ. Vaša implementacija može svoje razloge imenovati drugačije: nevalidan slučaj prolazi tako što odbije ključ. Ako vaš `check` vraća kodove enkodera, postavite `issueCodes: true` na adapter i vratite ih kao `issues`, listu kodova. Svaki nevalidan slučaj se tada proverava i prema svom razlogu.

## Pogledajte i {#see-also}

- [Strukturni ključevi](../../core-concepts/structural-keys.md): pravila koja slučajevi proveravaju.
- [API biblioteke](./library-api.md): funkcije koje poziva sopstveni adapter enkodera.
