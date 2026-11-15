---
title: Provenance
description: Where every value the transformer writes came from
sidebar_position: 6
---

# Provenance

Every value the FDS Transformer writes carries its origin. When it writes output, the transformer also writes `provenance.sidecar.json` in the same directory. For each document written, the sidecar records where each field it wrote came from. A reviewer can then tell a value read from the source apart from a default, a generated id, or a model's answer.

The sidecar is validated by a published schema, `/schemas/transformer/provenance/v1.1.0/provenance.schema.json`.

## What it holds

The sidecar holds one record per document written, in output order. Each record has the document's `id` (its `exerciseId`, or `id` for other entities), its `slug`, and `fields`. `fields` maps each field path, named as the mapping configuration names it, to one of these origins. An entry covers the values beneath its path, except where a deeper path has an entry of its own:

| `origin` | Meaning | Also records |
|---|---|---|
| `source` | Read from the source record | `from`: the source path read; `transform`: the transforms applied, if any |
| `default` | A configured value standing in for missing data: the mapping's `default`, or an enrichment `fallback`. It is not data about the record | `transform`, if any |
| `transform` | Generated with no source value, such as an id or a timestamp | `transform` |
| `model` | Written by a model during enrichment | `provider`, `model`, `prompt`, `promptVersion`, `tier`, `confidence` |

For a model's value:

- `provider` is the enrichment provider that made the call: `openrouter`, or `claude-code` for the local Claude Code CLI.
- `model` is the model that answered, as the provider reports it.
- `promptVersion` is `sha256:` followed by the first 16 hex digits of the hash of the prompt's fixed text, so it changes when the prompt does.
- `confidence` is the model's own confidence in that field, from 0 to 1, or `null` when it reported none. Every enrichment prompt asks for it.

A value that enrichment filled over an empty mapped value is recorded as the model's. A value resumed from a checkpoint keeps the provenance it was written with.

## Deterministic

Keys are sorted, and nothing in the file depends on when the run happened. The same input and configuration give the same bytes, provided the documents' ids are stable.

## Rejecting defaults

A mapping `default` fills an empty source with a constant. That suits a schema version or a status, but not exercise data, where a default stands in for a fact nobody recorded. `validation.rejectDefaults` (mapping schema 1.2.0) lists field paths that may not hold a default:

- A record fails when a default supplies the value at one of those paths. That covers a default written at the path, a default object above it, and a default anywhere beneath it.
- Its error names the path.
- This applies whatever `validation.enabled` and `validation.strict` say.
