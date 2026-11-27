---
title: Instalacija
description: Instalacija alata FDS Encoder sa npm-a
sidebar_position: 2
---

# Instalacija

FDS Encoder je npm paket `@vitness/fds-encoder`. Daje vam komandu `fds-encoder` i biblioteku.

## Zahtevi {#requirements}

- **Node.js:** 20.0.0 ili noviji
- **npm**, **pnpm** ili **yarn**

Proverite svoju verziju Node.js-a:

```bash
node --version
```

## Instaliranje komande {#install-the-command}

Instalirajte paket globalno da biste `fds-encoder` stavili na putanju:

<PackageManagerTabs packages="@vitness/fds-encoder" global />

Proverite da se pokreće:

```bash
fds-encoder --version
```

```text
0.1.0
```

Ostale stranice u ovom odeljku pišu `fds-encoder`.

### Pokretanje bez instaliranja {#run-it-without-installing}

<PackageManagerTabs
  command={{
    pnpm: "pnpm dlx @vitness/fds-encoder --version",
    npm: "npx @vitness/fds-encoder --version",
    yarn: "yarn dlx @vitness/fds-encoder --version",
  }}
/>

### Uklanjanje {#remove-it}

```bash
npm uninstall -g @vitness/fds-encoder
```

## Korišćenje biblioteke u projektu {#use-the-library-in-a-project}

Dodajte paket u svoj projekat:

<PackageManagerTabs packages="@vitness/fds-encoder" />

Zatim ga uvezite:

```typescript
import { checkKey } from '@vitness/fds-encoder';

console.log(checkKey('FXM=1.0/biceps-brachii.long').ok); // true
```

Paket je ES modul i isporučuje svoje TypeScript tipove.

## Rad na samom enkoderu {#work-on-the-encoder-itself}

Paket se nalazi u `packages/fds-encoder` [repozitorijuma specifikacije](https://github.com/vitness-me/fds-spec-website). Izgradite ga iz klona da biste ga menjali ili da biste pokrenuli slučajeve usaglašenosti nad svojim buildom. Komande ispod pokreću se iz korena klona.

```bash
git clone https://github.com/vitness-me/fds-spec-website.git
cd fds-spec-website
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
```

Build upisuje biblioteku u `packages/fds-encoder/dist/index.js`, a komandu u `packages/fds-encoder/dist/bin/fds-encoder.js`. Izgrađenu komandu pokrenite sa `node packages/fds-encoder/dist/bin/fds-encoder.js`.

Pokrenite sopstvene provere paketa:

```bash
npm --prefix packages/fds-encoder run typecheck
npm --prefix packages/fds-encoder run test:run
```

## Rešavanje problema {#troubleshooting}

**`fds-encoder: command not found`.** Komanda nije na vašoj putanji. Instalirajte je globalno i proverite da je globalna fascikla npm-a na vašoj putanji: `npm prefix -g` je ispisuje, a komanda se nalazi u njenoj fascikli `bin`. Ili je pokrenite bez instaliranja, sa `npx @vitness/fds-encoder`.

**Skripta za usaglašenost kaže `dist/index.js does not exist`.** `node scripts/check-conformance.mjs` i `npm run check:keys` čitaju izgrađeni paket u klonu, `packages/fds-encoder/dist`, i zaustavljaju se sa izlaznim kodom 2 kada ga nema:

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
