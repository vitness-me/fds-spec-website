# The right dialect, no formats

The third failure in the sequence: with `--spec=draft2020` accepted, the first
`format` the schema uses has no implementation and ajv refuses the schema. Only
`-c ajv-formats` gets past this, which is why the two flags travel together.

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 \
  -s specification/schemas/atlas/v1.0.0/body-atlas.schema.json \
  -d specification/schemas/atlas/v1.0.0/body-atlas.example.json
```
