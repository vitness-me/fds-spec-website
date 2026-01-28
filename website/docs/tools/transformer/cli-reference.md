---
title: CLI Reference
description: Complete reference for FDS Transformer CLI commands and options
sidebar_position: 3
---

# CLI Reference

Complete reference for all FDS Transformer CLI commands and options.

## Synopsis

```bash
fds-transformer [command] [options]
```

Running without a command launches interactive mode.

## Commands

### `transform`

Transform source data to FDS format.

```bash
fds-transformer transform [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-i, --input <path>` | Input file path (JSON) | Required |
| `-c, --config <path>` | Mapping configuration file | - |
| `-o, --output <path>` | Output directory | Current directory |
| `--version <version>` | Target FDS schema version | `1.0.0` |
| `--dry-run` | Preview without writing files | `false` |
| `--no-ai` | Disable AI enrichment (legacy) | `false` |
| `--no-enrichment` | Skip AI enrichment entirely | `false` |
| `--api-key <key>` | API key for enrichment provider | `$OPENROUTER_API_KEY` |
| `--model <model>` | AI model (legacy single-model mode) | - |
| `--tier <tier>` | Run only specific tier (`simple`\|`medium`\|`complex`) | All tiers |
| `--estimate-cost` | Show cost estimate without running | `false` |
| `--resume` | Resume from checkpoint | `false` |
| `--clear-checkpoint` | Clear existing checkpoint before running | `false` |
| `--no-checkpoint` | Disable checkpoint saving | `false` |
| `--log-level <level>` | Log verbosity (`error`\|`warn`\|`info`\|`debug`) | `info` |

**Examples:**

```bash
# Basic transformation
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --output ./fds-output/

# Preview without writing
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --dry-run

# Transform without AI enrichment
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --no-enrichment

# Run only simple tier enrichment
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --tier simple

# Estimate costs before running
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --estimate-cost

# Resume interrupted transformation
fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --resume

# Debug mode
DEBUG_ENRICHMENT=true fds-transformer transform \
  --input ./exercises.json \
  --config ./mapping.json \
  --log-level debug
```

---

### `validate`

Validate FDS data against the schema.

```bash
fds-transformer validate [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-i, --input <path>` | Input file to validate | Required |
| `-e, --entity <type>` | Entity type (`exercise`\|`equipment`\|`muscle`) | `exercise` |
| `--version <version>` | FDS schema version | `1.0.0` |

**Examples:**

```bash
# Validate an exercise
fds-transformer validate --input ./bench-press.json

# Validate equipment
fds-transformer validate \
  --input ./barbell.json \
  --entity equipment

# Validate against specific version
fds-transformer validate \
  --input ./exercise.json \
  --version 1.0.0
```

**Exit Codes:**

- `0` - Validation passed
- `1` - Validation failed or error

---

### `init`

Create a new mapping configuration interactively.

```bash
fds-transformer init [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --sample <path>` | Sample source file to analyze | - |
| `-o, --output <path>` | Output path for config | `./mapping.json` |

**Example:**

```bash
# Generate config from sample data
fds-transformer init \
  --sample ./sample-exercise.json \
  --output ./mapping.json
```

> **Note:** The interactive wizard is under development. For now, see the configuration guide for manual setup.

---

### `schemas`

Manage FDS schemas.

```bash
fds-transformer schemas <action>
```

**Actions:**

| Action | Description |
|--------|-------------|
| `list` | List available schema versions |
| `update` | Update local schema cache |

**Examples:**

```bash
# List available schemas
fds-transformer schemas list

# Update schema cache
fds-transformer schemas update
```

---

## Interactive Mode

Running `fds-transformer` without arguments launches the interactive wizard:

```bash
fds-transformer
```

```
┌  FDS Transformer
│
◆  What would you like to do?
│  ○ Transform data to FDS format
│  ○ Validate existing FDS data
│  ○ Create new mapping configuration
│  ○ Manage FDS schemas
└
```

---

## Output Formats

### Individual Files (Default)

Each transformed item is written to a separate file named by slug:

```
output/
├── barbell-bench-press.json
├── back-squat.json
├── deadlift.json
└── ...
```

### Single File

Configure in `mapping.json` to output all items to one file:

```json
{
  "output": {
    "singleFile": true,
    "singleFileName": "exercises.json",
    "pretty": true
  }
}
```

---

## Progress Display

During transformation, the CLI shows real-time progress:

```
┌  FDS Transformer
│
◇  Loaded 1,323 items from ./exercises.json
◇  Loaded config from ./mapping.json
◇  Tiered enrichment configuration detected
│
●  Processing 45/1323: Barbell Bench Press ● │████████░░░░░░░░░░░░│ 12.3%
```

---

## Cost Estimation

Use `--estimate-cost` to preview AI enrichment costs:

```bash
fds-transformer transform \
  --config ./mapping.json \
  --input ./exercises.json \
  --estimate-cost
```

Output:

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Cost Estimation                               │
├───────────────────────────────────────────────────────────────────────┤
│ Input: 1,323 exercises                                                │
│ Enrichment fields: 18 (6 simple, 5 medium, 7 complex)                 │
│                                                                       │
│ Tier       │ Model              │ Batch │ Calls  │ Tokens   │ Cost   │
│ ───────────┼────────────────────┼───────┼────────┼──────────┼────────│
│ Simple     │ claude-haiku-4.5   │     5 │    265 │     ~53K │  $0.42 │
│ Medium     │ claude-sonnet-4.5  │     3 │    441 │    ~132K │  $1.98 │
│ Complex    │ claude-sonnet-4.5  │     1 │  1,323 │    ~529K │  $7.94 │
│ ───────────┴────────────────────┴───────┴────────┴──────────┴────────│
│ TOTAL                                   │  2,029 │   ~0.71M │ $10.34 │
│                                                                       │
│ Estimated time: 40 minutes (at 50 requests/min)                       │
│                                                                       │
│ * Estimates based on average token usage. Actual costs may vary.      │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Checkpoint & Resume

Long-running transformations automatically save checkpoints:

```bash
# Start transformation (checkpoint saved automatically)
fds-transformer transform --input ./exercises.json --config ./mapping.json

# If interrupted, resume from checkpoint
fds-transformer transform --input ./exercises.json --config ./mapping.json --resume

# Clear checkpoint and start fresh
fds-transformer transform --input ./exercises.json --config ./mapping.json --clear-checkpoint

# Disable checkpointing
fds-transformer transform --input ./exercises.json --config ./mapping.json --no-checkpoint
```

Checkpoints are saved to `.fds-checkpoint.json` in the output directory.

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (validation failed, file not found, etc.) |

---

## See Also

- [Configuration](/docs/tools/transformer/configuration) - Mapping config reference
- [AI Enrichment](/docs/tools/transformer/ai-enrichment) - Tiered enrichment guide
- [Examples](/docs/tools/transformer/examples) - Complete workflows
