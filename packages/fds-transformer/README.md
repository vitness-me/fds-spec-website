# @vitness/fds-transformer

Transform any source schema to FDS (Fitness Data Standard) format with optional AI enrichment.

## Features

- **Interactive CLI** - Beautiful wizard-style interface for guided transformation
- **Non-Interactive Mode** - Batch processing for CI/CD pipelines
- **Tiered AI Enrichment** - Multi-tier AI-powered field generation via OpenRouter with configurable models per complexity level
- **Registry Management** - Muscle, equipment, and category lookups with fuzzy matching
- **Multi-Version Support** - Target different FDS schema versions
- **Plugin System** - Extend with custom transforms
- **TDD** - Comprehensive test coverage with Vitest

## Installation

```bash
npm install @vitness/fds-transformer
# or
pnpm add @vitness/fds-transformer
```

## Quick Start

### CLI Usage

```bash
# Interactive mode
npx fds-transformer

# Transform with config
npx fds-transformer transform --input ./data.json --config ./mapping.json --output ./fds/

# Validate FDS data
npx fds-transformer validate --input ./exercise.json

# Create mapping config
npx fds-transformer init --sample ./sample.json
```

### Programmatic Usage

```typescript
import { Transformer } from '@vitness/fds-transformer';

const transformer = new Transformer({
  config: './mapping.json',
  ai: {
    provider: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
  },
});

// Transform single item
const result = await transformer.transform({
  id: 'gym-201',
  name: 'Barbell Bench Press',
  equipment: 'barbell',
  target: 'chest',
});

console.log(result.data);

// Batch transform with streaming
for await (const result of transformer.transformStream(items)) {
  console.log(result);
}
```

## Mapping Configuration

Create a `mapping.json` file to define how source fields map to FDS:

```json
{
  "$schema": "https://spec.vitness.me/schemas/transformer/v1.3.0/mapping.schema.json",
  "version": "1.0.0",
  "targetSchema": {
    "version": "1.0.0",
    "entity": "exercise"
  },
  "registries": {
    "muscles": { "source": "local", "local": "./registries/muscles.registry.json" },
    "equipment": { "source": "local", "local": "./registries/equipment.registry.json" }
  },
  "mappings": {
    "canonical.name": { "from": "name", "transform": "titleCase" },
    "canonical.slug": { "from": "name", "transform": "slugify" },
    "targets.primary": {
      "from": "target",
      "transform": "registryLookup",
      "options": { "registry": "muscles", "fuzzyMatch": true }
    },
    "classification": {
      "enrichment": {
        "enabled": true,
        "prompt": "exercise_classification",
        "context": ["name", "equipment", "target"]
      }
    }
  },
  "enrichment": {
    "provider": "openrouter",
    "model": "anthropic/claude-3.5-sonnet"
  }
}
```

## Built-in Transforms

| Transform | Description |
|-----------|-------------|
| `slugify` | Convert to URL-safe slug |
| `titleCase` | Convert to Title Case |
| `uuid` | Generate a random UUIDv4 (a rerun gives new ids) |
| `uuidv5` | Derive a UUIDv5 from `options.namespace` and an `options.name` template such as `example-catalog/exercises/{{code}}`; the same input always gives the same id |
| `toArray` | Ensure value is array |
| `toMediaArray` | Convert URLs to FDS media format |
| `registryLookup` | Find in registry with fuzzy matching |
| `timestamp` | Format the source instant, or `options.clock` (an ISO 8601 instant with a zone) when the source is empty. Without a clock it throws; `"clock": "now"` opts into the wall clock |
| `autoGenerate` | Auto-generate metadata fields |
| `template` | Apply template strings |
| `urlTransform` | Transform URLs |

### Repeatable runs

The same input and config give byte-identical output. Use `uuidv5` for ids and
take timestamps from the source or a fixed `clock`. Two records that produce the
same `canonical.slug` or id fail the run before anything is written. Enrichment
checkpoints are keyed by each record's slug plus a hash of what the model is
given, so `--resume` reuses a result only for a record that has not changed.

## AI Enrichment

The transformer supports **tiered AI enrichment** - a multi-tier system that uses different AI models based on field complexity:

Enrichment fills gaps only. A model's value lands only in a field path listed under `enrichment.fields` (or, on the single-model path, a mapping with `enrichment.enabled`), and only where the mapped value is a gap under that field's `when`. A value the mapping wrote is never replaced. In the tiered path, `when` is read from the field's mapping (`mappings.<path>.enrichment.when`) and defaults to `"missing"`; a record with no gap in a prompt's fields is not sent to the model.

### Tiered Enrichment Configuration

```json
{
  "enrichment": {
    "enabled": true,
    "provider": "openrouter",
    
    "tiers": {
      "simple": {
        "model": "anthropic/claude-haiku-4.5",
        "temperature": 0.1,
        "maxTokens": 1000,
        "batchSize": 5,
        "priority": "speed"
      },
      "medium": {
        "model": "anthropic/claude-sonnet-4.5",
        "temperature": 0.1,
        "maxTokens": 1500,
        "batchSize": 3,
        "priority": "balanced"
      },
      "complex": {
        "model": "anthropic/claude-sonnet-4.5",
        "temperature": 0.1,
        "maxTokens": 2000,
        "batchSize": 1,
        "priority": "accuracy"
      }
    },
    
    "fields": {
      "canonical.aliases": { "tier": "simple", "prompt": "aliases" },
      "classification.exerciseType": { "tier": "simple", "prompt": "classification-simple" },
      "metrics.primary": { "tier": "simple", "prompt": "metrics" },
      "equipment.optional": { "tier": "simple", "prompt": "equipment" },
      
      "constraints.contraindications": { "tier": "medium", "prompt": "constraints" },
      "constraints.prerequisites": { "tier": "medium", "prompt": "constraints" },
      "constraints.progressions": { "tier": "medium", "prompt": "constraints" },
      "relations": { "tier": "medium", "prompt": "relations" },
      
      "classification.movement": { "tier": "complex", "prompt": "biomechanics" },
      "classification.mechanics": { "tier": "complex", "prompt": "biomechanics" },
      "classification.force": { "tier": "complex", "prompt": "biomechanics" },
      "targets.secondary": { "tier": "complex", "prompt": "biomechanics" }
    },
    
    "fallback": {
      "retries": 2,
      "degradeModel": true,
      "degradeChain": {
        "complex": "medium",
        "medium": "simple",
        "simple": null
      }
    }
  }
}
```

### Tier Descriptions

| Tier | Model | Use Case | Fields |
|------|-------|----------|--------|
| **simple** | Claude Haiku 4.5 | Fast, straightforward enrichment | aliases, exerciseType, level, metrics, optional equipment |
| **medium** | Claude Sonnet 4.5 | Balanced accuracy/speed | constraints, progressions/regressions, relations |
| **complex** | Claude Sonnet 4.5 | Deep biomechanical analysis | movement patterns, mechanics, force vectors, secondary muscles |

### Running Specific Tiers

```bash
# Run only simple tier (fastest)
fds-transformer transform --config ./mapping.json --input ./data.json --tier simple

# Run only medium tier
fds-transformer transform --config ./mapping.json --input ./data.json --tier medium

# Run only complex tier (most detailed)
fds-transformer transform --config ./mapping.json --input ./data.json --tier complex

# Run all tiers (default)
fds-transformer transform --config ./mapping.json --input ./data.json
```

### Claude Code provider (subscription)

`"provider": "claude-code"` enriches through the local `claude` CLI, signed in with a Claude subscription. It gives the same guarantees as `openrouter`: the same request schema (passed as `--json-schema`), gap-only scoping, values constrained to the schema and the registries, provenance, and abstention on a refusal, a reply cut off at the token limit, or a reply that fails its schema.

```json
{
  "enrichment": {
    "enabled": true,
    "provider": "claude-code",
    "claudeCode": {
      "writerModel": "claude-opus-5-5",
      "checkerModel": "claude-sonnet-5-5"
    }
  }
}
```

- **Auth.** The CLI's own sign-in is the only auth: run `claude` once and log in with a Claude subscription, or set `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`. No key is read, written or logged. `ANTHROPIC_*`, other `CLAUDE_CODE_*`, `AWS_*`, `GOOGLE_*`, `VERTEX_*` and `OPENROUTER_*` variables are removed from the CLI's environment and user, project and local settings are not loaded, so an API key, a different API endpoint or a cloud provider set there is never used. The provider cannot tell what kind of account the CLI itself is signed in with: a CLI logged in with an Anthropic Console account, or given an `apiKeyHelper` by managed policy settings, bills that account.
- **Isolation.** The CLI runs in print mode with no tools, no MCP servers, no settings, CLAUDE.md or skills, and no saved session, from the system temp directory.
- **Models.** Every enrichment call, in every tier, is written by `writerModel` (default `claude-opus-5-5`); the tiers' own `model`s are not used. `checkerModel` (default `claude-sonnet-5-5`) is exposed on the provider for a caller's check pass. `temperature` and `maxTokens` have no CLI flag and are not applied.
- **Failures.** A CLI that cannot answer (not signed in, an API error, a timeout after `timeoutMs`, default 10 minutes) fails the call, like an OpenRouter API error: nothing is written. A degrade retries with the same writer model. `command` names the executable if `claude` is not on `PATH`.
- **Smoke test.** `node scripts/smoke-claude-code.mjs [writer-model]`, after `npm run build`, enriches two exercises through the real CLI and prints what was written and its provenance. It is never run in CI, where a stub stands in for the CLI, so it is also the check that the flags the provider passes still exist in the installed CLI.

### Enriching chosen records

A batch run can be limited to chosen records, so enrichment can go in small batches reviewed one at a time:

```bash
# Only these records, by exerciseId or slug
fds-transformer transform --config ./mapping.json --input ./data.json --ids barbell-back-squat,push-up

# At most 25 records, the first in input order (after --ids, if given)
fds-transformer transform --config ./mapping.json --input ./data.json --max-records 25
```

Only the chosen records are mapped into the output, sent to a model and written. An id that names no record fails the run before any call. In code, pass `ids` and `maxRecords` to `transformAllBatch`. Both need tiered enrichment.

### Debug Mode

Enable verbose logging to troubleshoot enrichment:

```bash
DEBUG_ENRICHMENT=true fds-transformer transform --config ./mapping.json --input ./data.json
```

### Legacy Single-Field Enrichment

For simpler use cases, you can still use field-level enrichment:

```json
{
  "canonical.description": {
    "enrichment": {
      "enabled": true,
      "prompt": "exercise_description",
      "context": ["name", "target", "equipment"],
      "when": "missing"
    }
  }
}
```

### Enrichment Options

- `when`: when a field counts as a gap to fill. `"missing"` (default): the path is absent. `"notFound"`: absent or `null`. `"empty"`: absent, `null`, `""`, `[]` or `{}`. `"always"`: the same as `"empty"`, because a mapped value is never replaced.
- `prompt`: Built-in prompt name or custom prompt
- `context`: Source fields to include as AI context
- `fields`: Specific sub-fields to enrich
- `fallback`: Value to use if enrichment fails

## Provenance

Every value the transformer writes carries its origin. Next to its output, the CLI writes `provenance.sidecar.json`, validated by [`transformer/provenance/v1.1.0`](https://spec.vitness.me/schemas/transformer/provenance/v1.1.0/provenance.schema.json). It holds one record per document written, and in each record one entry per field path:

```json
{
  "$schema": "https://spec.vitness.me/schemas/transformer/provenance/v1.1.0/provenance.schema.json",
  "records": [
    {
      "fields": {
        "canonical.description": {
          "confidence": 0.86,
          "model": "anthropic/claude-haiku-4.5",
          "origin": "model",
          "prompt": "description",
          "promptVersion": "sha256:4b1d0c3e9f2a7d65",
          "provider": "openrouter",
          "tier": "simple"
        },
        "canonical.name": { "from": "name", "origin": "source", "transform": ["titleCase"] },
        "exerciseId": { "origin": "transform", "transform": ["uuid"] },
        "metadata.status": { "origin": "default" }
      },
      "id": "0f8e3c52-7a4b-4d1e-9c0a-3b5f6e7d8a91",
      "slug": "barbell-squat"
    }
  ]
}
```

- `source`: read from the source at `from`, through `transform` if any.
- `default`: the mapping's `default` stood in for an empty source.
- `transform`: generated with no source value (an id, a timestamp).
- `model`: written by enrichment. Records the provider that made the call (`openrouter`, `claude-code`), the model that answered as the provider reports it, the prompt, a `promptVersion` that changes when the prompt's fixed text does, the tier, and the model's own `confidence` from 0 to 1 (`null` when it reported none).

Keys are sorted and nothing depends on when the run happened, so the same input gives the same bytes. In code, each `TransformResult` carries the same map as `provenance`, and `buildProvenanceSidecar` / `serializeProvenanceSidecar` produce the file.

`validation.rejectDefaults` lists field paths that may not hold a mapping default. A record whose value at one of them came from `default` fails, with an error naming the path, whatever `validation.enabled` and `strict` say:

```json
{
  "validation": { "strict": true, "rejectDefaults": ["classification.level", "classification.force"] }
}
```

## Structural descriptors (draft)

Two optional steps link a conversion to the draft FXI and FXE descriptors. Both are off unless asked for, and a run without them is unchanged. They write `fxi`, `fxe`, `fxiProvenance`, `fxiGap` and `xrefs` at the top level of each record, where RFC-010 defines them. Release 1.6.0 publishes those fields (exercise 1.2.0, equipment 1.2.0), so the output validates against the default release with either step on. Validating against an older release with a step on fails, because those schemas close the record to fields they do not have.

- **Propose.** `--fxi-answers <path>` reads an answers record (`{answers, gap?, notes?}`, or a bare answers object) at that path in each source record, builds its FXI and FXE with `@vitness/fds-encoder`, and writes `fxi`, `fxe`, `fxiProvenance` and `fxiGap` (an equipment answers record writes `fxe` only). The answers record and the rules revision it was built under have no field on the record: they go in the report below, so the strings can be rebuilt later with `fds-encoder upgrade`. Proposals are marked `import` (read from another catalogue: candidate search only), or `agent` with `--fxi-provenance agent`; never `owner`. An FXI the mapping already wrote is never replaced. `--words <file or URL>` gives the movement-word dataset the answers' words come from.
- **Resolve.** `--resolve-library <file>` matches each record's FXI against a library of `{id, fxi, fxiProvenance, mode?, fxiGap, name?, fxe?}` rows by the match protocol; a library row whose provenance contradicts its mode is refused before the run starts. Only a unique identical entry, with owner provenance on both sides, neither side in import mode and no gap marker on either, is linked: it is added to the record's `xrefs` as `{system, id, link: "auto"}`, where `system` is `--resolve-system` or the library's file name. An import or agent proposal therefore never links on its own. Owner provenance counts only when `fxiProvenance` is mapped from a field of the source record: a mapping `default` of `owner` is written as `import`, with a warning in the report.

Every record a step acted on is listed in `descriptors.report.json` beside the output: what was proposed and the answers record it was built from, answers that did not build, and each match to confirm, with its ranked candidates and the reason it was not linked. Those are for a person to settle.

```bash
fds-transformer transform -i exercises.json -c mapping.json -o ./out \
  --fxi-answers fxiAnswers --resolve-library gym-library.json
```

In code, pass `descriptors: { propose, resolve }` to `new Transformer(...)`; each `TransformResult` carries the outcome as `descriptors`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | API key for OpenRouter; the `claude-code` provider reads no key |
| `FDS_TRANSFORMER_MODEL` | Override AI model |
| `DEBUG_ENRICHMENT` | Set to `true` for verbose enrichment logging |

## Plugin Development

Create custom transforms:

```typescript
import type { TransformPlugin } from '@vitness/fds-transformer';

const myPlugin: TransformPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  transforms: {
    customSlug: (value, options, context) => {
      return `custom-${String(value).toLowerCase()}`;
    },
  },
};

export default myPlugin;
```

Use in config:

```json
{
  "plugins": ["./my-plugin.js"],
  "mappings": {
    "canonical.slug": {
      "from": "name",
      "transform": "my-plugin:customSlug"
    }
  }
}
```

A relative path resolves against the mapping file. A plugin is code: loading a
mapping file runs the plugins it names, so use mapping files you trust.

## Example: Full Enrichment Workflow

Here's a complete example transforming exercise data with all enrichment tiers:

### 1. Source Data (`exercises.json`)

```json
[
  {
    "id": "gym-201",
    "name": "Barbell Bench Press",
    "target": "chest",
    "equipment": "barbell"
  }
]
```

### 2. Mapping Config (`mapping.config.json`)

See the tiered enrichment configuration section above for a complete example.

### 3. Run Transformation

```bash
OPENROUTER_API_KEY=your-key fds-transformer transform \
  --config ./mapping.config.json \
  --input ./exercises.json \
  --output ./fds-output
```

### 4. Output

The transformer produces FDS-compliant JSON with all enriched fields:

```json
{
  "exerciseId": "caf217a9-3880-4f12-bc2e-71ce44d42665",
  "schemaVersion": "1.1.0",
  "canonical": {
    "name": "Barbell Bench Press",
    "slug": "barbell-bench-press",
    "aliases": ["bench press", "flat bench press", "BB bench"]
  },
  "targets": {
    "primary": [{ "id": "...", "name": "Chest", "slug": "chest" }],
    "secondary": [
      { "id": "anterior-deltoid", "name": "Anterior Deltoid" },
      { "id": "triceps-brachii", "name": "Triceps Brachii" }
    ]
  },
  "equipment": {
    "required": [{ "id": "...", "name": "Barbell", "slug": "barbell" }],
    "optional": [{ "id": "bench", "name": "Bench" }]
  },
  "classification": {
    "movement": "push-horizontal",
    "mechanics": "compound",
    "force": "push",
    "kineticChain": "open",
    "tags": ["upper-body", "strength", "power", "pressing"]
  },
  "metrics": {
    "primary": { "type": "weight", "unit": "kg" },
    "secondary": [{ "type": "reps", "unit": "count" }]
  },
  "constraints": {
    "contraindications": ["Acute shoulder pain", "..."],
    "prerequisites": ["Pain-free shoulder ROM", "..."],
    "progressions": ["Incline bench press", "..."],
    "regressions": ["Push-up", "Dumbbell bench press", "..."]
  },
  "relations": [
    { "type": "equipmentVariant", "targetId": "dumbbell-bench-press" },
    { "type": "regression", "targetId": "push-up" }
  ]
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Run CLI in dev mode
pnpm dev
```

## Related Packages

- `@vitness/fds-skill` - AI skill and knowledge base for FDS
- `@vitness/fds-encoder` - CLI and library for the draft FXI, FXE and FXM descriptors; the descriptor steps above are built from it

## License

MIT
