# Assuming a global install

A command that runs only for a reader who followed an install step somewhere
else. On a fresh clone there is no such executable on PATH.

```bash
ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```
