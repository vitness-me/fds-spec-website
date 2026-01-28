---
title: Installation
description: Install and configure the FDS Transformer CLI
sidebar_position: 2
---

# Installation

This guide covers installing the FDS Transformer and setting up your environment.

## Requirements

- **Node.js:** 20.0.0 or higher
- **npm/pnpm/yarn:** Any modern package manager

Verify your Node.js version:

```bash
node --version
# Should output v20.0.0 or higher
```

## Installation Methods

### Global Installation (Recommended for CLI)

Install globally to use `fds-transformer` from anywhere:

<PackageManagerTabs packages="@vitness/fds-transformer" global />

Verify installation:

```bash
fds-transformer --version
# 0.1.0
```

### Local Project Installation

Install as a project dependency:

<PackageManagerTabs packages="@vitness/fds-transformer" />

Run via package manager scripts:

<PackageManagerTabs
  command={{
    pnpm: "pnpm exec fds-transformer --version",
    npm: "npx fds-transformer --version",
    yarn: "yarn fds-transformer --version",
  }}
/>

Or add to `package.json`:

```json
{
  "scripts": {
    "transform": "fds-transformer transform --config ./mapping.json",
    "validate": "fds-transformer validate"
  }
}
```

### Run Without Installing

Run directly without installing:

<PackageManagerTabs
  command={{
    pnpm: "pnpm dlx @vitness/fds-transformer --version",
    npm: "npx @vitness/fds-transformer --version",
    yarn: "yarn dlx @vitness/fds-transformer --version",
  }}
/>

## Environment Setup

### API Key for AI Enrichment

If you want to use AI enrichment features, you need an OpenRouter API key:

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Set the environment variable:

```bash
# Unix/macOS
export OPENROUTER_API_KEY=your-api-key-here

# Windows (PowerShell)
$env:OPENROUTER_API_KEY = "your-api-key-here"

# Windows (CMD)
set OPENROUTER_API_KEY=your-api-key-here
```

For persistent configuration, add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export OPENROUTER_API_KEY=your-api-key-here
```

### Using a .env File

You can also use a `.env` file in your project:

```bash
# .env
OPENROUTER_API_KEY=your-api-key-here
FDS_TRANSFORMER_MODEL=anthropic/claude-sonnet-4.5
DEBUG_ENRICHMENT=false
```

Load it with a tool like `dotenv-cli`:

```bash
npx dotenv-cli -- fds-transformer transform --config ./mapping.json
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | API key for OpenRouter (required for AI enrichment) | - |
| `FDS_TRANSFORMER_MODEL` | Override the default AI model | Per-tier defaults |
| `DEBUG_ENRICHMENT` | Enable verbose enrichment logging | `false` |

## Verifying Installation

Test that everything is working:

```bash
# Check version
fds-transformer --version

# Run interactive mode
fds-transformer

# List available schemas
fds-transformer schemas list
```

Expected output for `schemas list`:

```
┌  FDS Schemas
│
◇  Available schema versions:
│    1.0.0 (bundled)
│
└  Done
```

## Troubleshooting

### Command Not Found

If `fds-transformer` is not found after global installation:

1. Ensure npm global bin is in your PATH:
   ```bash
   npm config get prefix
   # Add {prefix}/bin to your PATH
   ```

2. Or use npx:
   ```bash
   npx fds-transformer --version
   ```

### Permission Errors (Unix/macOS)

If you get permission errors during global install:

```bash
# Option 1: Use a Node version manager (recommended)
# Install nvm: https://github.com/nvm-sh/nvm

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Node Version Too Old

If you see compatibility errors, upgrade Node.js:

```bash
# Using nvm
nvm install 20
nvm use 20

# Or download from https://nodejs.org/
```

## Next Steps

- [CLI Reference](/docs/tools/transformer/cli-reference) - Learn all available commands
- [Configuration](/docs/tools/transformer/configuration) - Set up your mapping config
- [Examples](/docs/tools/transformer/examples) - See complete workflows
