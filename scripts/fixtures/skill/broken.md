# A knowledge base with four defects in it

Every claim below is wrong on purpose. Do not fix them; `expected-failures.txt`
records the errors they produce, and repairing one here breaks the self-test.

## A name no schema defines

An item's prescribed load lives in `loadTargets`, and an AMRAP target's ceiling
is `max`.

Both are wrong — the field is `loadTarget` and the ceiling is `cap` — and both
are the exact shape of mistake this check exists for: plausible, specific, and
invisible to a reader who does not already know the answer.

## A schema URL at a withdrawn version

Validate an exercise against
https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json

Release 1.0.0 named that version and it is no longer served. It 404s.

## A path that does not exist

See `/specification/rfc/rfc-009-performed-data-model.md` for the log format.

RFC-009 is deferred pending a consent and privacy model. There is no such file.
