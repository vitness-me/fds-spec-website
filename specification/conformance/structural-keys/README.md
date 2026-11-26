# Structural key conformance cases

These files are test cases for an implementation of the four FDS structural keys: the exercise key (`FXI`), the equipment key (`FXE`), the muscle key (`FXM`) and the muscle category key (`FXMG`), each at version 1.0. The key pages under Core Concepts say how each key is built. The cases check that an implementation reads, writes and compares keys the way those pages describe.

## The files

| File | Covers | Each case gives |
|---|---|---|
| `syntax.json` | Every layer, symbol and rule of the four keys, and one case for each code in the key registries | `input` and `valid`. A valid key has `written`, its standard written form. An invalid key has `issue`, the code the FDS Encoder reports for it, and `about` says why it fails |
| `compare.json` | Two keys of one type | `a`, `b` and `result`: `same`, `more-specific`, `overlap` or `different`. With `more-specific`, `specific` says which key is the more specific one, `a` or `b` |
| `build.json` | Answers to the FDS Encoder's questions, and the keys they build | `answers`, then `fxi` and `fxe`. Equipment on its own has `fxi` null. A case with `rejected` is a set of answers the questions refuse |
| `cross-check.json` | `exerciseEquipment`: an exercise key against the key of its equipment. `muscleInCategory`: a muscle key placed in a category key | `warnings`, an empty list when the two keys agree; or `relation`: `in`, `partly-in` or `not-in` |

Every case has an `id`, unique in its file, and `about`, a sentence saying what it checks. `key` names the key type.

A few things the cases rely on:

- **Lenient reading, one written form.** An input may write layers out of order, spell out a default or leave items unsorted. It still checks, and `written` is the one standard form. A key is invalid only when it breaks a rule a written form can't repair: a missing required layer, an unknown code, two codes that contradict each other.
- **Defaults and `?`.** In an exercise key, a layer left out is at its default, a value; only `?` leaves a dimension open. In an equipment key, a standard layer left out reads `?`. Several compare cases set the two side by side.
- **Same means no `?` and no `*`.** Two identical keys that contain `?` or `*` compare as `overlap`, not `same`.
- **Warning codes.** `main-equipment`: the equipment key contradicts the exercise's main equipment. `posture`: a machine's posture isn't the exercise's start orientation. `load-interface`: the machine's load interface doesn't include where the exercise holds it. `off-design`: a single-joint machine's motion isn't in the exercise's motion.
- **Issue codes are the FDS Encoder's.** Another implementation may name its reasons differently. It passes an invalid case by refusing the key.
- **Build cases need the question flow.** The answers are option ids of the FDS Encoder's questions, which `fds-encoder questions --json` prints. An implementation with its own way of building keys skips them.

## Running them

`scripts/check-conformance.mjs` runs every case against an implementation and lists each case that fails. Without arguments it runs them against the FDS Encoder in `packages/fds-encoder`, built first:

```bash
npm --prefix packages/fds-encoder ci && npm --prefix packages/fds-encoder run build
node scripts/check-conformance.mjs
```

To run them against another implementation, write an adapter module whose default export has these functions, and pass its path:

```js
// my-adapter.mjs
export default {
  name: 'my implementation',
  check: (key) => ({ ok: true, written: '…' }),       // is the key valid, and its standard written form
  compare: (a, b) => ({ result: 'more-specific', specific: 'a' }),
  crossCheck: (fxi, fxe) => [],                       // warning codes
  muscleInCategory: (fxm, fxmg) => 'in',
  // build: (answers) => ({ fxi, fxe }), or null when the answers are refused. Leave it out to skip the build cases.
};
```

```bash
node scripts/check-conformance.mjs --adapter ./my-adapter.mjs
```

An adapter that sets `issueCodes: true` and returns `issues`, a list of codes, from `check` is also held to the reason each invalid key fails.

The files are plain JSON, one case per line, so a test suite in any language can read them directly.
