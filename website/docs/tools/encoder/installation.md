---
title: Installation
description: Install the FDS Encoder from npm
sidebar_position: 2
---

# Installation

The FDS Encoder is the npm package `@vitness/fds-encoder`. It gives you the `fds-encoder` command and a library.

## Requirements

- **Node.js:** 20.0.0 or higher
- **npm**, **pnpm** or **yarn**

Check your Node.js version:

```bash
node --version
```

## Install the command

Install the package globally to put `fds-encoder` on your path:

<PackageManagerTabs packages="@vitness/fds-encoder" global />

Check that it runs:

```bash
fds-encoder --version
```

```text
0.1.0
```

The other pages in this section write `fds-encoder`.

### Run it without installing

<PackageManagerTabs
  command={{
    pnpm: "pnpm dlx @vitness/fds-encoder --version",
    npm: "npx @vitness/fds-encoder --version",
    yarn: "yarn dlx @vitness/fds-encoder --version",
  }}
/>

### Remove it

```bash
npm uninstall -g @vitness/fds-encoder
```

## Use the library in a project

Add the package to your project:

<PackageManagerTabs packages="@vitness/fds-encoder" />

Then import it:

```typescript
import { checkKey } from '@vitness/fds-encoder';

console.log(checkKey('FXM=1.0/biceps-brachii.long').ok); // true
```

The package is an ES module and ships its TypeScript types.

## Work on the Encoder itself

The package lives in `packages/fds-encoder` of the [specification repository](https://github.com/vitness-me/fds-spec-website). Build it from a checkout to change it, or to run the conformance cases against your build. The commands below run from the root of the checkout.

```bash
git clone https://github.com/vitness-me/fds-spec-website.git
cd fds-spec-website
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
```

The build writes the library to `packages/fds-encoder/dist/index.js` and the command to `packages/fds-encoder/dist/bin/fds-encoder.js`. Run the built command with `node packages/fds-encoder/dist/bin/fds-encoder.js`.

Run the package's own checks:

```bash
npm --prefix packages/fds-encoder run typecheck
npm --prefix packages/fds-encoder run test:run
```

## Troubleshooting

**`fds-encoder: command not found`.** The command isn't on your path. Install it globally, then check that npm's global folder is on your path: `npm prefix -g` prints it, and the command lives in its `bin` folder. Or run it without installing, with `npx @vitness/fds-encoder`.

**The conformance script says `dist/index.js does not exist`.** `node scripts/check-conformance.mjs` and `npm run check:keys` read the built package in a checkout, `packages/fds-encoder/dist`, and stop with exit code 2 when it isn't there:

```text
…/packages/fds-encoder/dist/index.js does not exist. Build the encoder first:
  npm --prefix packages/fds-encoder ci && npm --prefix packages/fds-encoder run build
```

Build it first:

```bash
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
```

Build again after you change the package or pull new commits: a `dist` from an earlier build checks the earlier code.

## Next steps

- [CLI Reference](./cli-reference.md): every command and flag.
- [Library API](./library-api.md): the exported functions.
- [Examples](./examples.md): end-to-end walkthroughs.
