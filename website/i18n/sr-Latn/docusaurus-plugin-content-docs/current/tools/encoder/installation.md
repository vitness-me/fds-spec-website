---
title: Instalacija
description: Pokretanje alata FDS Encoder iz klona repozitorijuma specifikacije
sidebar_position: 2
---

# Instalacija

FDS Encoder nije na npm-u. Pokrećete ga iz klona [repozitorijuma specifikacije](https://github.com/vitness-me/fds-spec-website), gde se nalazi u `packages/fds-encoder`.

## Zahtevi {#requirements}

- **Node.js:** 20.0.0 ili noviji
- **npm**
- **git**

Proverite svoju verziju Node.js-a:

```bash
node --version
```

## Izgradnja paketa {#build-the-package}

Klonirajte repozitorijum i izgradite paket. Komande na ovoj stranici pokreću se iz korena klona.

```bash
git clone https://github.com/vitness-me/fds-spec-website.git
cd fds-spec-website
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
```

Build upisuje biblioteku u `packages/fds-encoder/dist/index.js`, a komandu u `packages/fds-encoder/dist/bin/fds-encoder.js`.

## Pokretanje komande {#run-the-command}

### Bez instaliranja {#without-installing}

Pokrenite izgrađenu datoteku pomoću Node.js-a:

```bash
node packages/fds-encoder/dist/bin/fds-encoder.js --version
```

```text
0.1.0
```

### Kao `fds-encoder` {#as-fds-encoder}

Instalirajte paket iz njegove fascikle da biste `fds-encoder` stavili na putanju:

```bash
npm install -g ./packages/fds-encoder
fds-encoder --version
```

```text
0.1.0
```

npm povezuje globalnu komandu sa fasciklom, pa je kasniji build ažurira. Ostale stranice u ovom odeljku pišu `fds-encoder`. Ako ga niste instalirali, umesto toga pišite `node packages/fds-encoder/dist/bin/fds-encoder.js`.

Da biste uklonili komandu:

```bash
npm uninstall -g @vitness/fds-encoder
```

## Korišćenje biblioteke u projektu {#use-the-library-in-a-project}

Instalirajte paket iz klona u svoj projekat, po njegovoj putanji:

```bash
npm install /path/to/fds-spec-website/packages/fds-encoder
```

Zatim ga uvezite:

```typescript
import { checkKey } from '@vitness/fds-encoder';

console.log(checkKey('FXM=1.0/biceps-brachii.long').ok); // true
```

Paket je ES modul i isporučuje svoje TypeScript tipove. npm povezuje vaš projekat sa fasciklom, pa izgradite paket pre nego što ga uvezete. Kasniji build ažurira i vaš projekat.

## Pokretanje sopstvenih provera paketa {#run-the-packages-own-checks}

```bash
npm --prefix packages/fds-encoder run typecheck
npm --prefix packages/fds-encoder run test:run
```

## Rešavanje problema {#troubleshooting}

**`fds-encoder: command not found`.** Komanda nije na vašoj putanji. Pokrenite `npm install -g ./packages/fds-encoder` iz korena klona i proverite da je globalna fascikla npm-a na vašoj putanji: `npm prefix -g` je ispisuje, a komanda se nalazi u njenoj fascikli `bin`. Ili pokrenite izgrađenu datoteku direktno: `node packages/fds-encoder/dist/bin/fds-encoder.js`.

**Skripta za usaglašenost kaže `dist/index.js does not exist`.** `node scripts/check-conformance.mjs` i `npm run check:keys` čitaju izgrađeni paket, `packages/fds-encoder/dist`, i zaustavljaju se sa izlaznim kodom 2 kada ga nema:

```text
…/packages/fds-encoder/dist/index.js does not exist. Build the encoder first:
  npm --prefix packages/fds-encoder ci && npm --prefix packages/fds-encoder run build
```

Prvo ga izgradite:

```bash
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
```

Izgradite ga ponovo kada izmenite paket ili preuzmete nove komitove: `dist` iz ranijeg builda proverava raniji kod.

## Sledeći koraci {#next-steps}

- [CLI referenca](./cli-reference.md): svaka komanda i opcija.
- [API biblioteke](./library-api.md): izvezene funkcije.
- [Primeri](./examples.md): celoviti prikazi od početka do kraja.
