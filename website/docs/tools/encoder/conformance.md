---
title: Conformance
description: Run the structural key conformance cases against the FDS Encoder or another implementation
sidebar_position: 6
---

# Conformance

The specification repository publishes test cases for the four structural keys, in [`specification/conformance/structural-keys/`](https://github.com/vitness-me/fds-spec-website/tree/main/specification/conformance/structural-keys). They check that an implementation reads, writes and compares keys the way the [Structural Keys](../../core-concepts/structural-keys.md) pages describe. The FDS Encoder passes all of them. If you write keys with your own code, run the cases against it.

## The files

| File | Covers |
|------|--------|
| `syntax.json` | Every layer, symbol and rule of the four keys. A valid case gives the key's written form; an invalid case gives the reason it fails |
| `compare.json` | Two keys of one type and how they compare: `same`, `more-specific`, `overlap` or `different` |
| `build.json` | Answers to the Encoder's questions and the keys they build |
| `cross-check.json` | An exercise key against the key of its equipment, and a muscle key placed in a category key |

Every case has an `id` and `about`, a sentence saying what it checks. The files are plain JSON, so a test suite in any language can read them. The [README](https://github.com/vitness-me/fds-spec-website/blob/main/specification/conformance/structural-keys/README.md) beside them describes each field.

## Run them against the FDS Encoder

From the root of a checkout, build the Encoder and run the cases:

```bash
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
node scripts/check-conformance.mjs
```

```text
conformance cases against @vitness/fds-encoder
  syntax             831/831 passed
  compare            67/67 passed
  build              73/73 passed
  exerciseEquipment  32/32 passed
  muscleInCategory   14/14 passed
```

## Run them against another implementation

Write an adapter: a JavaScript module whose default export wraps your implementation in these functions.

| Function | Returns |
|----------|---------|
| `check(key)` | `{ ok, written }`: whether the key is valid, and its written form |
| `compare(a, b)` | `{ result, specific }`: `same`, `more-specific`, `overlap` or `different`, and with `more-specific`, which key is the more specific one, `'a'` or `'b'` |
| `crossCheck(fxi, fxe)` | The warning codes for an exercise key and the key of its equipment: `[]` when they agree |
| `muscleInCategory(fxm, fxmg)` | `'in'`, `'partly-in'` or `'not-in'` |
| `build(answers)` | Optional. `{ fxi, fxe }` for a set of answers to the Encoder's questions, or `null` when the answers are refused |

`name` labels the report. A function that throws fails its case.

Here `my-keys.mjs` stands for your own code:

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

Pass its path with `--adapter`:

```bash
node scripts/check-conformance.mjs --adapter ./my-adapter.mjs
```

```text
conformance cases against my implementation
  syntax             831/831 passed
  compare            67/67 passed
  build              0/73 passed, 73 skipped
  exerciseEquipment  32/32 passed
  muscleInCategory   14/14 passed
```

This adapter has no `build`, so the build cases are skipped. They are answers to the Encoder's own questions, which `fds-encoder questions --json` prints; an implementation with its own way of building keys leaves `build` out.

When a case fails, the command lists it with what the case expects and what the adapter returned, and exits with 1. An adapter whose `muscleInCategory` always returns `'in'` gives:

```text
conformance cases against my implementation
  syntax             831/831 passed
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

Look a case up by its `id` in the case file to read what it checks.

## Reasons for invalid keys

An invalid case also names the issue code the FDS Encoder reports for the key. Your implementation may name its reasons differently: it passes an invalid case by refusing the key. If your `check` returns the Encoder's codes, set `issueCodes: true` on the adapter and return them as `issues`, a list of codes. Each invalid case is then also held to its reason.

## See also

- [Structural Keys](../../core-concepts/structural-keys.md): the rules the cases check.
- [Library API](./library-api.md): the functions the Encoder's own adapter calls.
