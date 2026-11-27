---
title: Overview
description: Build, check, compare and match the structural keys of exercises, equipment, muscles and muscle categories
sidebar_position: 1
---

# FDS Encoder

Build, check, compare and match structural keys.

**Package:** `@vitness/fds-encoder`  
**Version:** 0.1.0  
**License:** MIT

## Overview

The FDS Encoder is a command line tool and a TypeScript library for the four [structural keys](../../core-concepts/structural-keys.md): the exercise key (`fxi`), the equipment key (`fxe`), the muscle key (`fxm`) and the muscle category key (`fxmg`). The Core Concepts pages say how each key is built. The Encoder applies those rules for you.

| Key | Field | Example |
|-----|-------|---------|
| Exercise | `fxi` | `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`, a standing dumbbell curl |
| Equipment | `fxe` | `FXE=1.0S/k:imp/f:bar.ez`, an EZ bar |
| Muscle | `fxm` | `FXM=1.0/biceps-brachii.long`, the long head of biceps brachii |
| Muscle category | `fxmg` | `FXMG=1.0/hamstring`, the hamstrings |

## What it does

| Task | Command | Library |
|------|---------|---------|
| Check a key and print its written form | `check <key>…` | `checkKey`, `writeKey` |
| Check every key in a catalog file | `check --records <file>` | `checkRecord` |
| Compare two keys | `compare <a> <b>` | `compareKeys` |
| Place a muscle in a category | `compare <fxm> <fxmg>` | `fxmInFxmg`, `fxmgCategoriesOf` |
| Build keys by answering questions | `ask`, `build`, `questions` | `build`, `startAsk`, `stepAsk`, `QUESTIONS` |
| Match records against a library | `match <records> --library <records>` | `match`, `matchEntryOf` |

## How it fits with the rest of FDS

- **Core Concepts.** The [Structural Keys](../../core-concepts/structural-keys.md) pages are the rules. The Encoder follows them and reports, in plain words, where a key breaks one.
- **The Transformer.** The [FDS Transformer](/docs/tools/transformer) turns your source data into FDS records. It doesn't fill the key fields. Run the Encoder on its output to add or check them.
- **Your records.** The Encoder reads and writes only a record's own key field and the key fields of the references it holds. Everything else in the record stays as it was, down to the spacing and the number literals. A link you confirm between two records belongs in your own data, in `attributes` or `extensions`. The Encoder doesn't read or write it.

## Quick start

Install the command from npm:

```bash
npm install -g @vitness/fds-encoder
```

Check a key:

```bash
fds-encoder check 'FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands'
```

```text
ok   FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands
```

The key checks, and the Encoder prints it with its layers in the standard order.

## Programmatic usage

The same operations are a TypeScript library. Install the package [in your project](./installation.md#use-the-library-in-a-project), then:

```typescript
import { checkKey, compareKeys } from '@vitness/fds-encoder';

checkKey('FXI=1.0S/o:standing/m:el.flex/l:bell.dumb@hands').written;
// 'FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands'

compareKeys('FXM=1.0/biceps-brachii.long', 'FXM=1.0/biceps-brachii').result; // 'more-specific'
```

The [Library API](./library-api.md) lists every export.

## What's next?

- [Installation](./installation.md): run the Encoder from the repository.
- [CLI Reference](./cli-reference.md): every command and flag.
- [Library API](./library-api.md): the exported functions.
- [Examples](./examples.md): end-to-end walkthroughs.
- [Conformance](./conformance.md): test another implementation against the published cases.

## Requirements

- **Node.js:** 20.0.0 or higher
