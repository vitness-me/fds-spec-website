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
```json
{
  "spec_version": "1.0.0",
  "provider": "Acme Fitness Platform",
  "supported_entities": ["exercise", "equipment", "muscle", "muscle-category"],
  "supported_extensions": ["x:vitness", "x:gym-management"],
  "export_endpoints": {
    "exercise": "/api/exercises/export/rfc001",
    "equipment": "/api/equipment/export/rfc002",
    "muscle": "/api/muscles/export/rfc003",
    "muscle-category": "/api/muscle-categories/export/rfc004"
  }
}
```

## Notes
- `spec_version` MUST indicate the FDS major/minor version supported by the provider.
- `supported_extensions` SHOULD list vendor namespaces advertised by the provider; omission implies none.
- `export_endpoints` are illustrative; providers MAY use any path structure. Endpoints SHOULD return NDJSON or JSON arrays with a `schemaVersion` per record.
- Authentication and rate limits are out of scope; providers SHOULD document any requirements.

