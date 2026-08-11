# Documented-command fixtures

Six documents, each carrying one way a published validation command fails.
`node scripts/check-doc-commands.mjs --self-test` runs every rule over this
directory and requires it to fail in exactly the ways recorded in
`expected-failures.txt`, plus `passing.md`, which must not fail at all.

It exists because the defect it guards survived ten green checks. The paths in
the broken commands were correct, the schemas were correct, the examples were
valid — `check:versions` reads all of that and had no opinion on the command
wrapped around it. Nothing ran them.

| Rule | What trips it |
|---|---|
| Invoked through npx | `global-install.md` — an executable only a global install provides |
| Packages named | `bare-npx.md` — the command as it shipped, naming no package |
| `-c` modules named | `undeclared-module.md` — a module the sandbox will not contain |
| It runs | `draft-07.md` — resolves, then rejects every 2020-12 schema |
| It runs | `unknown-format.md` — right dialect, no `format` implementations |
| Fenced | `outside-fence.md` — a command written into a sentence |

The three fixtures under "it runs" and "packages named" are the same command at
three stages of repair, in the order a maintainer meets them: fix the binary and
you find the dialect, fix the dialect and you find the formats. Reading the
command tells you none of that.

`passing.md` is the control. A check that has stopped executing anything still
reports every failure above, because five of the six rules are static; only the
two executions distinguish a working gate from a plausible one.
