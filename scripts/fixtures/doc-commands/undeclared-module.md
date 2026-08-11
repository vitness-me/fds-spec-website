# A module npx was never asked to install

`ajv-cli` requires `-c` modules from wherever it was itself installed. npx puts
it in a sandbox holding only what `--package` named, so this resolves ajv-cli
and then fails to find `ajv-formats`.

```bash
npx --package=ajv-cli ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```
