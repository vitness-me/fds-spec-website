# Extension Policy and Registry Guide

This guide defines how vendors extend the Fitness Data Standard (FDS) without breaking interoperability and how common extensions can be promoted toward standardization.

## Goals
- Avoid key collisions across vendors.
- Keep extensions self‑describing and discoverable.
- Provide a pathway to standardize widely adopted patterns.

## Where to Extend
- `attributes`: Simple key/values for lightweight extensions that may be promoted.
- `extensions`: Vendor‑scoped objects for complex domain data.

## Namespacing Rules
- Use the `x:` prefix to indicate non‑standard keys.
- Attributes: `x:<vendor>.<feature>` (e.g., `x:vitness.stanceWidth`).
- Extensions: `x:<vendor>` or `x:<vendor>.<domain>` (e.g., `x:vitness`, `x:gym-management`).
- Choose a stable `<vendor>` (company name or reverse‑DNS like `x:org.vitness`). Keep it consistent.
- Do not use `fds:` or unprefixed keys for extensions.

## Versioning Extensions
- Keep extension payloads backward compatible when possible.
- If breaking, include an explicit version inside your extension namespace (e.g., `extensions: { "x:vitness": { "version": "2" } }`).

## Example
```json
{
  "attributes": {
    "x:vitness.stanceWidth": "shoulder-width",
    "x:org.example.videoQuality": "1080p"
  },
  "extensions": {
    "x:vitness": {
      "tempo": { "eccentric": 3, "isometric": 1, "concentric": 1 },
      "rangeOfMotion": { "standard": "hip-crease below knee" }
    },
    "x:gym-management": {
      "inventory": { "count": 5, "location": "free-weight-area" },
      "maintenance": { "lastInspection": "2025-08-15", "nextDue": "2025-11-15" }
    }
  }
}
```

## Consumer Behavior
- MUST ignore unknown keys in `attributes` and `extensions`.
- SHOULD validate extension values against local contracts if known (optional).

## Promotion Path
1. Adoption: An extension gains adoption across multiple independent implementers.
2. Proposal: Submit an RFC to promote the concept into the core schema or to a standardized extension spec.
3. Review: Editors evaluate semantics, naming, and compatibility.
4. Standardize: If accepted, the feature moves into core (Minor release) or a named standardized extension.

## Collision Resolution
- Prefer reverse‑DNS style vendor keys to reduce collision risk.
- If a collision is discovered, coordinate via issue/PR; Editors may suggest renaming or scoping.

## Security & Privacy
- Do not include secrets or PII in extensions unless mandated by your application and protected accordingly.
- Treat extension URIs/media with the same transport and authorization controls as core data.

