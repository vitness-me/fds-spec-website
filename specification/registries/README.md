# Registries

Two different kinds of file live here, and telling them apart matters.

## Vocabulary registries — normative

These define the **recommended values for an open classifier**. Several FDS fields are deliberately open strings rather than enums (D8): an unrecognised `exerciseType` produces a mislabelled exercise, not an unreadable one, so rejecting the document would cost more than accepting it. The registry is what stops "open" meaning "undefined".

| File | Governs | Policy |
|---|---|---|
| `exercise-type.registry.json` | `classification.exerciseType` on an exercise | open |
| `workout-type.registry.json` | `classification.workoutType` on a workout | open |
| `block-role.registry.json` | `blocks[].role` on a workout | open |
| `intensity-zone.registry.json` | `intensityZone.boundsRef` in a prescription | open |

`exerciseType` is the one that matters most, because its schema carries no `enum` and no `examples` — **this registry is the only place its vocabulary is written down.**

`npm run check:registries` keeps them honest in both directions: a value a schema recommends must be listed here, a value a published example uses must be listed here, and a registry may not claim to govern a field that no longer exists. The registry is allowed to be a superset — recommending a value nothing has needed yet is the point.

### Open means open

A producer emitting a value that is not listed here has produced a valid document. A consumer encountering one **MUST NOT** reject it and **SHOULD** ignore or pass through the value it does not recognise. That is the warn-don't-reject rule from RFC-001, and it is why these are registries rather than enums.

The contrast is `blocks[].mode` and `schedule.model`, which are **not** here. Those are structural discriminators: they decide how a document is read, so they are closed enums with an explicit catch-all branch, and an unrecognised value is not executed (RFC-006 §3.2, RFC-007 §3.5, RFC-008 §3.6).

### Zone systems carry no numbers

`intensity-zone.registry.json` defines the systems and their zone labels — that "Z4" in the Coggan seven-zone model means the same thing in two applications. It carries `boundsBasis` (what the boundaries are a percentage *of*) and never the boundary values themselves, because those are personal. See RFC-006 §5.1.

## Entity registry examples — illustrative

| File | Shows |
|---|---|
| `muscles.registry.example.json` | A muscle catalog as an array of RFC-003 records |
| `muscle-categories.registry.example.json` | A category catalog as an array of RFC-004 records |
| `equipment.registry.example.json` | An equipment catalog as an array of RFC-002 records |

These are **examples of a published catalog**, not vocabulary. They exist to show the shape a provider serves — an array of entity documents, each carrying its own `schemaVersion`. They are not normative and nothing in FDS requires these particular entries.

The `.example.` in the filename is the distinction. A file named `*.registry.json` is the registry; a file named `*.registry.example.json` is an example of one.
