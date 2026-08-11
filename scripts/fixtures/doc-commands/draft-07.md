# The default dialect

Resolvable, and still wrong. ajv-cli defaults to draft-07; every FDS schema
declares 2020-12, so it fails on the `$schema` line before it reads a document.
This is the second half of what shipped — the failure the bare command was
hiding behind an unresolvable binary.

```bash
npx --package=ajv-cli --package=ajv-formats ajv \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```
