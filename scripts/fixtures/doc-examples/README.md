# Fixtures for `check:doc-examples`

Documentation that must fail, so the gate is never trusted on the strength of
having passed. `npm run check:doc-examples -- --self-test` runs the check over
this directory and requires the failures recorded in `expected-failures.txt`,
word for word. Re-record with `--self-test --record` and read the diff.

Nothing here is published. The Docusaurus build does not reach `scripts/`, and
the check's ordinary run reads `website/docs`, `specification`, the root
markdown and `website/src` — never this directory.

| Fixture | What it proves |
|---|---|
| `comparison-data.ts` | The landing-page comparison, recovered from the commit that deleted it. Its `fdsFormat` export is the exercise the site actually shipped: no `metrics`, no `classification.force`, no `categoryId` on any of the three muscle references. Every gate in CI was green while it was live. |
| `failing-examples.md` | One block per failure mode the check claims to catch. |
| `passing-examples.md` | The same partial snippet, marked. A rule that only ever rejects is not a rule about anything. |

`comparison-data.ts` is kept verbatim, including the four competitor formats it
compares against. Those carry no `schemaVersion` and are correctly left alone —
which is itself part of what the fixture demonstrates, because a check that
flagged them would be unusable on a page whose whole subject is other people's
formats.
