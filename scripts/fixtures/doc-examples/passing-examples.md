# Blocks that must pass

The counterpart to `failing-examples.md`. A check that rejected these too would
be rejecting documentation for being documentation.

## The same partial snippet, marked

Marking it does not silence it: `classification` is a whole top-level property,
so it is still validated against the exercise subschema that owns it. The
marker says which entity, not "stop looking".

```json fds:fragment entity=exercise
{
  "classification": {
    "exerciseType": "strength",
    "movement": "squat",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate"
  }
}
```

## A prescription fragment named as the right definition

```json fds:fragment entity=prescription def=loadTarget
{ "method": "percentOf1RM", "basis": "e1RM", "value": 80 }
```

## An ambiguous shape that says which entity it is

```json fds:document entity=muscle
{
  "schemaVersion": "1.0.0",
  "id": "mus.quadriceps",
  "canonical": { "name": "Quadriceps", "slug": "quadriceps" },
  "classification": { "categoryId": "cat.legs", "region": "lower-front" },
  "metadata": {
    "createdAt": "2025-09-02T15:00:00Z",
    "updatedAt": "2025-09-02T15:00:00Z",
    "status": "active"
  }
}
```

## JSON that is not FDS at all

```json fds:ignore an npm package.json excerpt
{ "scripts": { "build": "tsc" } }
```
