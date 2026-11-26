---
title: Installation
description: Run the FDS Encoder from a checkout of the specification repository
sidebar_position: 2
---

# Installation

The FDS Encoder isn't on npm. You run it from a checkout of the [specification repository](https://github.com/vitness-me/fds-spec-website), where it lives in `packages/fds-encoder`.

## Requirements

- **Node.js:** 20.0.0 or higher
- **npm**
- **git**

Check your Node.js version:

```bash
node --version
```

## Build the package

Clone the repository and build the package. The commands on this page run from the root of the checkout.

```bash
git clone https://github.com/vitness-me/fds-spec-website.git
cd fds-spec-website
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
```

The build writes the library to `packages/fds-encoder/dist/index.js` and the command to `packages/fds-encoder/dist/bin/fds-encoder.js`.

## Run the command

### Without installing

Run the built file with Node.js:

```bash
node packages/fds-encoder/dist/bin/fds-encoder.js --version
```

```text
0.1.0
```

### As `fds-encoder`

Install the package from its folder to put `fds-encoder` on your path:

```bash
npm install -g ./packages/fds-encoder
fds-encoder --version
```

```text
0.1.0
```

npm links the global command to the folder, so a later build updates it. The other pages in this section write `fds-encoder`. If you didn't install it, write `node packages/fds-encoder/dist/bin/fds-encoder.js` instead.

To remove the command:

```bash
npm uninstall -g @vitness/fds-encoder
```

## Use the library in a project

Install the package from the checkout into your project, by its path:

```bash
npm install /path/to/fds-spec-website/packages/fds-encoder
```

Then import it:

```typescript
import { checkKey } from '@vitness/fds-encoder';

console.log(checkKey('FXM=1.0/biceps-brachii.long').ok); // true
```

The package is an ES module and ships its TypeScript types. npm links your project to the folder, so build the package before you import it. A later build updates your project too.

## Run the package's own checks

```bash
npm --prefix packages/fds-encoder run typecheck
npm --prefix packages/fds-encoder run test:run
```

## Troubleshooting

**`fds-encoder: command not found`.** The command isn't on your path. Run `npm install -g ./packages/fds-encoder` from the root of the checkout, and check that npm's global folder is on your path: `npm prefix -g` prints it, and the command lives in its `bin` folder. Or run the built file directly: `node packages/fds-encoder/dist/bin/fds-encoder.js`.

**The conformance script says `dist/index.js does not exist`.** `node scripts/check-conformance.mjs` and `npm run check:keys` read the built package, `packages/fds-encoder/dist`, and stop with exit code 2 when it isn't there:

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
