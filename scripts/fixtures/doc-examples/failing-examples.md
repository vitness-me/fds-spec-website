# Blocks that must fail

Each one is a way documentation goes wrong. See `README.md`; nothing here is
published.

## A required property removed

The exercise from RFC-001 §3.1, with `metrics` taken out. This is the shape of
the bug the gate exists for: everything else about the document is right.

```json
{
  "schemaVersion": "1.1.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
  "canonical": { "name": "Back Squat", "slug": "back-squat" },
  "classification": {
    "exerciseType": "strength",
    "movement": "squat",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate"
  },
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "name": "Quadriceps", "categoryId": "cat.legs" }
    ]
  },
  "metadata": {
    "createdAt": "2025-09-02T15:00:00Z",
    "updatedAt": "2025-09-02T15:00:00Z",
    "status": "active"
  }
}
```

## A version that is not published

`2.0.0` is a version no release names. A reader who fetches the URL this
document implies gets nothing back.

```json
{
  "schemaVersion": "2.0.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
  "canonical": { "name": "Back Squat", "slug": "back-squat" },
  "classification": {
    "exerciseType": "strength",
    "movement": "squat",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate"
  },
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "name": "Quadriceps", "categoryId": "cat.legs" }
    ]
  },
  "metrics": { "primary": { "type": "reps", "unit": "count" } },
  "metadata": {
    "createdAt": "2025-09-02T15:00:00Z",
    "updatedAt": "2025-09-02T15:00:00Z",
    "status": "active"
  }
}
```

## A prescription fragment named as the wrong definition

A `loadTarget`, declared to be a `repTarget`. The two are both `oneOf` unions
with a forward-compatibility branch, which is exactly the situation where a
mislabelled fragment could be expected to slip through.

```json fds:fragment entity=prescription def=repTarget
{ "method": "percentOf1RM", "basis": "e1RM", "value": 80 }
```

## A prescription fragment with no definition named

RFC-006 publishes a `$defs` library. Its root accepts nothing, so validating a
snippet against it would be meaningless rather than lenient.

```json fds:fragment entity=prescription
{ "kind": "range", "min": 3, "max": 5 }
```

## An unmarked partial snippet

The `classification` block on its own. Legitimate documentation, but it has to
say so — see `passing-examples.md` for the same block marked.

```json
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

## A shape more than one entity accepts

`{schemaVersion, id, canonical, metadata}` is a legal equipment document, a
legal muscle document and a legal muscle-category document. Picking one is
guessing.

```json
{
  "schemaVersion": "1.0.0",
  "id": "mus.quadriceps",
  "canonical": { "name": "Quadriceps", "slug": "quadriceps" },
  "metadata": {
    "createdAt": "2025-09-02T15:00:00Z",
    "updatedAt": "2025-09-02T15:00:00Z",
    "status": "active"
  }
}
```

## A `json` fence that is not JSON

```json
{ "schemaVersion": "1.1.0", ... }
```
