---
title: Discovery
sidebar_position: 1
---

# Discovery Endpoint Specification

This document defines an optional HTTP discovery endpoint that allows clients to discover FDS support and export capabilities.

## Endpoint
- Method: GET
- Path: `/.well-known/fitness-data-spec`
- Content-Type: `application/json`
- Caching: `Cache-Control: max-age=3600` recommended

## Response Schema (informal)
```json fds:ignore a discovery document, defined by specification/discovery.md rather than by a published schema
{
  "spec_version": "1.4.0",
  "provider": "Acme Fitness Platform",
  "supported_entities": [
    "exercise",
    "equipment",
    "muscle",
    "muscle-category",
    "body-atlas",
    "workout",
    "program"
  ],
  "entity_versions": {
    "exercise": "1.1.0",
    "equipment": "1.1.0",
    "muscle": "1.0.0",
    "muscle-category": "1.0.0",
    "body-atlas": "1.0.0",
    "workout": "1.1.0",
    "program": "1.0.0"
  },
  "supported_extensions": ["x:vitness", "x:gym-management"],
  "export_endpoints": {
    "exercise": "/api/exercises/export/rfc001",
    "equipment": "/api/equipment/export/rfc002",
    "muscle": "/api/muscles/export/rfc003",
    "muscle-category": "/api/muscle-categories/export/rfc004",
    "body-atlas": "/api/atlas/export/rfc005",
    "workout": "/api/workouts/export/rfc007",
    "program": "/api/programs/export/rfc008"
  }
}
```

## Notes
- `spec_version` MUST indicate the FDS release the provider supports.
- `supported_extensions` SHOULD list vendor namespaces advertised by the provider; omission implies none.
- `export_endpoints` are illustrative; providers MAY use any path structure. Endpoints SHOULD return NDJSON or JSON arrays with a `schemaVersion` per record.
- Authentication and rate limits are out of scope; providers SHOULD document any requirements.

## A release is a set of entity versions

`spec_version` names a release. It is **not** a version that every entity shares, and a client that assumes it is will request URLs that were never published.

Entities version independently. Release 1.4.0 publishes exercise, equipment and workout at 1.1.0 while muscle, muscle-category, body-atlas and program remain at 1.0.0. There is no `muscle/v1.4.0/` and there never will be unless muscle itself changes.

A superseded entity version stays served. `workout/v1.0.0/` is still published and still frozen, because releases 1.2.0 and 1.3.0 declare workout at 1.0.0 and a client pinned to either must keep resolving.

Providers SHOULD therefore emit `entity_versions`, mapping each supported entity to the entity version they serve. A client that has it can construct schema URLs directly. A client that does not has to resolve the release to its entity versions some other way, and guessing is the failure this field exists to prevent.

| Release | Adds |
|---|---|
| 1.0.0 | exercise, equipment, muscle, muscle-category, body-atlas |
| 1.1.0 | exercise and equipment move to 1.1.0 — extended metric vocabulary and loading characteristics |
| 1.2.0 | workout |
| 1.3.0 | program |
| 1.4.0 | workout moves to 1.1.0 — per-set intensity zones and machine settings |

Gaining an entity is a new release even when nothing existing changed, because a release names the *set* it publishes.

## Prescription is a library, not an entity

`prescription` is published at `prescription/v1.0.0/prescription.schema.json` and defines the load, rep, tempo, rest, zone and scheme primitives that workouts and programs compose (RFC-006).

It **MUST NOT** appear in `supported_entities`. Its schema root validates nothing by construction — there is no such thing as a prescription document to export, and an endpoint offering one would be answering a question nobody asked. A provider supporting workouts already supports prescription; that is what supporting workouts means.

## Workouts and programs reference; they do not contain

A client fetching programs will not get workouts with them. A program is a schedule of workout references (RFC-008 §3.2), so a provider exporting programs **MUST** also expose the workouts those programs reference, and a client **SHOULD** resolve them before presenting a plan.

Providers SHOULD keep `workout` in `supported_entities` whenever `program` is present. A provider advertising programs but not workouts is advertising documents nobody can execute.

## What a discovery endpoint does not carry

No athlete, no bodyweight, no training maxes, no performed data. FDS models no person (D6), and a discovery document describes a provider's *capabilities*, not its users.

A provider exporting programs is exporting templates. The values a personalised program resolves against are caller context and travel separately — see RFC-006 §5 and RFC-008 §8.
