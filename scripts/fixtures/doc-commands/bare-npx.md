# Bare npx

The command four documents shipped, recovered verbatim from RFC-001 before it
was repaired. Every path in it is real and the example it names is valid, which
is why every path-reading check was green while it could not run.

```
npx ajv -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```
