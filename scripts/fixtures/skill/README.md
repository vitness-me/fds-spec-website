# Skill check fixtures

A deliberately broken knowledge base. `node scripts/check-skill.mjs --self-test`
runs every rule over this directory and requires it to fail in exactly the ways
recorded in `expected-failures.txt`.

It exists because the check it guards had only ever passed. The version it
replaced read two of twelve files and only fenced TypeScript inside those two,
so the entry-point document contributed nothing at all: a planted wrong field
name passed, and deleting whole entities passed. A gate with that much silence
in it looks identical, from the outside, to a gate that works.

So each rule has a fixture that trips it:

| Rule | What trips it, and where |
|---|---|
| Names | a field name that no schema defines, in prose, in `broken.md` |
| References | a schema URL at a withdrawn version, in `broken.md` |
| Paths | a repository path that does not exist, in `broken.md` |
| Coverage | every released entity, because this directory documents none of them |
| Examples | `broken-example.json`, an exercise missing a required property |
| Method | `AGENT.md`, which states a version, names a field and quotes a published path |

The method fixture is the only one whose lines are all *true*. That is what
makes rule 6 worth having: a procedure drifts into a knowledge document one
correct sentence at a time, and every one of them is correct on the day it is
written.

A bare version is normalised out of the recorded failures, so a release that
moves an entity does not churn all eight coverage lines at once. A version
inside a published path is left alone, because that one is worth looking at.

`broken.md` also states a second wrong name — `max` where an AMRAP target uses
`cap` — and the check does **not** catch it. `max` is a real property elsewhere
in the standard, on a load range, and the name test is global rather than
contextual. It is left in the fixture as a standing note of what this gate
cannot see.
