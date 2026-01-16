---
title: Changelog
description: FDS version history and changes
sidebar_position: 3
---

All notable changes to the FDS RFCs and schemas are documented here.

The format is inspired by Keep a Changelog, and the project adheres to Semantic Versioning for spec releases.

## [Unreleased]
- Governance, contribution guide, and repository README improvements.
- Extension namespace policy (draft) and conformance sections (planned).

## [0.1.0] — 2025-09-09 (Draft)
### Added
- RFC‑001 Exercise Data Model (Draft) with schema `exercises/v1.0.0` and example.
- RFC‑002 Equipment Data Model (Draft) with schema `equipment/v1.0.0` and example.
- RFC‑003 Muscle Data Model (Draft) with schema `muscle/v1.0.0` and example.
- RFC‑004 Muscle Category Data Model (Draft) with schema `muscle/muscle-category/v1.0.0` and example.

### Notes
- Identifier policy clarified: UUIDv4 is required in production; examples may use illustrative IDs for readability.
- Versioning and compatibility rules established for producers/consumers.
