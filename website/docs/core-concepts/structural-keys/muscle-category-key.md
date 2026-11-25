---
title: Muscle Category Key
sidebar_label: Muscle Category Key
description: How the muscle category structural key (fxmg) is composed from standard anatomy and joint actions.
---

# Muscle Category Key

The muscle category key is the structural key of a muscle category. It sits in the `fxmg` field and names a set of muscles that people train and talk about together, such as the hamstrings, the adductors, the hip flexors or the lower back. This page shows how a key is put together, what its members are, and how two keys compare.

A category is defined by its members, and its members are always muscle keys. The [muscle key](./muscle-key.md) names one muscle or one part. The category key names a set of them. Like the muscle key, it has no code lists of its own: its codes come from an anatomy reference and from the joint actions of the [exercise key](./exercise-key.md). Every key on this page is an illustration.

This page describes version 1.0 of the muscle category key.

## Anatomy of the key

The adductors have this key:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXMG</span><span className="ka-sym">=</span><span className="ka-code">1.0</span></code>
      <span className="key-anatomy__label">header</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">thigh</span></code>
      <span className="key-anatomy__label">region</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">.</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">medial</span></code>
      <span className="key-anatomy__label">compartment</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-code">code</span> · <span className="ka-sym">symbol</span>
  </figcaption>
</figure>

`FXMG=1.0/thigh.medial`

| Part | Text | What it says |
|---|---|---|
| Key type | `FXMG` | This is a muscle category key. |
| Version | `1.0` | Major version 1, revision 0. |
| Region | `thigh` | The thigh, by its anatomical term. |
| Compartment | `medial` | The medial compartment of the thigh, which holds the adductors. |

The header and the body are separated by `/`. The key has no `S` or `N` flag, because nothing in it is extended. A flag written after the version is dropped from the written form.

## The four forms

A key names one of four things.

| Form | Names | Example |
|---|---|---|
| `FXMG=1.0/<set>` | A set or region of muscles that anatomy names | `FXMG=1.0/hamstring`, the hamstrings |
| `FXMG=1.0/<region>.<qualifier>` | A compartment of a region | `FXMG=1.0/thigh.medial`, the adductors |
| `FXMG=1.0/a:<joint>.<action>` | The prime movers of one joint action | `FXMG=1.0/a:hip.flex`, the hip flexors |
| `FXMG=1.0/<term>+<term>` | Everything its terms cover | `FXMG=1.0/erector-spinae+quadratus-lumborum`, the lower back |

Rules for every key:

- A key is written starting with `FXMG=1.0/`, followed by exactly one of the four forms.
- Every code is lowercase: a letter, then letters and digits, in words joined by single hyphens.
- A key carries no side, for the same reason a muscle key carries none.
- Members are always muscle keys. A category never invents a code for a muscle.

## The anatomy anchor

Category codes come from the same reference as muscle codes: the Foundational Model of Anatomy (FMA), version 5.1.0. FMA names sets of muscles as well as single muscles, such as "Set of hamstring muscles" and "Musculature of medial compartment of thigh", and it lists their members. Uberon helps you confirm you have the right structure, and the code always comes from the FMA term. See [the anatomy anchor](./muscle-key.md#the-anatomy-anchor) on the muscle key page.

Anatomy words aren't gym words, so look the category up in FMA rather than writing the gym word:

| Gym word | FMA term | Code |
|---|---|---|
| Glutes | Musculature of buttock | `buttock` |
| Calves | Triceps surae | `triceps-surae` |
| Chest | Pectoral musculature | `pectoral` |
| Legs | Musculature of lower limb | `lower-limb` |
| Shins | Musculature of anterior compartment of leg | `leg.anterior` |

In FMA, "arm" is the upper arm only and "leg" is the shank only. Uberon uses both words for longer segments, which is one more reason the code comes from FMA.

## The category code

A category code is the FMA term of the set, rewritten with the muscle key's rule:

1. Find the set in FMA: a "Set of …", a "Musculature of …", or a cluster such as Quadriceps femoris. Take its term without its side.
2. Drop "Set of", "Musculature of" and "musculature", and the words "muscle", "muscles" and "muscle group".
3. When what is left reads `<qualifier> compartment of <region>` or `<qualifier> of <region>`, write `<region>.<qualifier>`. A second qualifier goes after the first.
4. Write it in lowercase, with the words joined by single hyphens.

| FMA term | Key |
|---|---|
| Set of hamstring muscles (FMA:81022) | `FXMG=1.0/hamstring` |
| Quadriceps femoris (FMA:22428) | `FXMG=1.0/quadriceps-femoris` |
| Triceps surae (FMA:51062) | `FXMG=1.0/triceps-surae` |
| Set of rotator cuff muscles (FMA:82650) | `FXMG=1.0/rotator-cuff` |
| Musculature of buttock (FMA:50230) | `FXMG=1.0/buttock` |
| Musculature of thigh (FMA:50208) | `FXMG=1.0/thigh` |
| Musculature of medial compartment of thigh (FMA:74149) | `FXMG=1.0/thigh.medial` |
| Set of intrinsic muscles of shoulder (FMA:33522) | `FXMG=1.0/shoulder.intrinsic` |
| Pectoral musculature (FMA:50223) | `FXMG=1.0/pectoral` |
| Musculature of anterior abdominal wall (FMA:78435) | `FXMG=1.0/anterior-abdominal-wall` |
| Musculature of lower limb (FMA:71297) | `FXMG=1.0/lower-limb` |
| Set of superficial muscles of posterior compartment of forearm (FMA:39104) | `FXMG=1.0/forearm.posterior.superficial` |

The `.` means the same thing in both keys: the named part of the thing before it. In a muscle key it is a part of a muscle, as in `deltoid.acromial`. In a category key it is a compartment of a region, as in `thigh.medial`. The first code tells you which: `deltoid` is a muscle and `thigh` is a region.

## Members

Every form has a fixed set of members, and comparison works on them.

- **A set or compartment** has the members FMA lists for its term, written as muscle keys with the side dropped. `FXMG=1.0/hamstring` has `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus` and `FXM=1.0/semimembranosus`.
- **A set can hold sets.** The thigh holds the quadriceps femoris, which holds four muscles. Follow the members down until you reach muscle keys.
- **A set FMA lists no members for**, such as the lower limb, has the members of the sets FMA divides it into.
- **An action** has the prime movers of that joint action. `FXMG=1.0/a:hip.flex` has `FXM=1.0/psoas-major`, `FXM=1.0/iliacus` and `FXM=1.0/rectus-femoris`. Sartorius and tensor fasciae latae help flex the hip, but they aren't prime movers, so they aren't members.
- **A union** has everything its terms cover. A term is a category code or a muscle key's code, with or without a part.

An owner who means something other than the FMA set writes a union. It never reuses the FMA code with its own member list. The gym "back" includes the trapezius and the rhomboids, which FMA counts as shoulder muscles, so it is `FXMG=1.0/back+rhomboid-major+rhomboid-minor+trapezius`. An owner whose hip flexors include sartorius and tensor fasciae latae writes `FXMG=1.0/a:hip.flex+sartorius+tensor-fasciae-latae`.

Two FMA terms can have the same members. `FXMG=1.0/hamstring` and `FXMG=1.0/thigh.posterior` (Musculature of posterior compartment of thigh, FMA:51036) both hold the three hamstrings. Both keys are valid, and they compare as the same.

### Writing a union

A union is written one way only, so two owners who mean the same muscles write the same text:

- Its terms are sorted alphabetically, and each appears once.
- A term that another term in the key already covers is dropped. `thigh+hamstring` is written `thigh`.
- A union of one term is written as that term. A gym "shoulders" that means the deltoid alone is `FXMG=1.0/deltoid`.

Because a union mixes category codes and muscle codes, no code is ever both.

### Erector spinae

FMA classes the erector spinae as a set of muscles, the Erector spinae muscle group (FMA:71302), so it is a category: `FXMG=1.0/erector-spinae`. Its three parts are muscles with keys of their own: `FXM=1.0/iliocostalis` (FMA:77177), `FXM=1.0/longissimus` (FMA:77178) and `FXM=1.0/spinalis` (FMA:77179).

## When no term exists

- **A category FMA doesn't name, and that isn't one joint action, is a union.** "Middle back" is `FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse`. "Core" has no agreed meaning, so each owner writes the union it means, for example `FXMG=1.0/anterior-abdominal-wall+erector-spinae+quadratus-lumborum`.
- **A name that isn't anatomy carries no key.** A category list sometimes holds entries like "cardio" or "other". Leave `fxmg` out of those records.

Keys are optional, so a record without one is still valid FDS.

## What the schema can't check

The schema checks that a key is well formed: the header, one of the four forms, and lowercase codes. It can't check that a code was derived correctly from an FMA term, or what a code's members are.

Members of a set or compartment come from FMA, so every owner who follows the rule gets the same list. The members of an action don't come from anatomy: they are a judgement of which muscles do most of the work, and two owners can judge them differently. The code is shared, and a disagreement shows up as an overlap when the keys are compared.

## Worked examples

Each example starts from a catalog entry and decides the key one step at a time.

### Hamstrings

| Step | Decision |
|---|---|
| Term | FMA has Set of hamstring muscles (FMA:81022) |
| Code | Drop "Set of" and "muscles": `hamstring` |
| Members | `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus`, `FXM=1.0/semimembranosus` |

`FXMG=1.0/hamstring`

### Adductors

| Step | Decision |
|---|---|
| Term | FMA has Musculature of medial compartment of thigh (FMA:74149) |
| Code | "medial compartment of thigh" is a compartment: `thigh.medial` |
| Members | Pectineus, adductor longus, adductor brevis, adductor magnus, adductor minimus and gracilis, each as its muscle key |

`FXMG=1.0/thigh.medial`

### Glutes

| Step | Decision |
|---|---|
| Term | FMA has Musculature of buttock (FMA:50230) |
| Code | `buttock`, never `glutes` |
| Members | `FXM=1.0/gluteus-maximus`, `FXM=1.0/gluteus-medius`, `FXM=1.0/gluteus-minimus` |

`FXMG=1.0/buttock`

### Hip flexors

| Step | Decision |
|---|---|
| Term | FMA has no set for the hip flexors. They come from the abdomen, the pelvis and the thigh |
| Code | The muscles that flex the hip: the exercise key's joint action `hip.flex`, written `a:hip.flex` |
| Members | The prime movers: `FXM=1.0/iliacus`, `FXM=1.0/psoas-major`, `FXM=1.0/rectus-femoris` |

`FXMG=1.0/a:hip.flex`

### Lower back

| Step | Decision |
|---|---|
| Term | FMA has no set that matches the gym meaning |
| Terms | The erector spinae, a category, and quadratus lumborum, a muscle |
| Order | Sorted: `erector-spinae`, then `quadratus-lumborum` |

`FXMG=1.0/erector-spinae+quadratus-lumborum`

## Keys in records

A muscle category record carries its key in `fxmg`. A group such as "Hamstrings" is a category record, not a muscle record:

```json fds:ignore muscle category record excerpt showing the fxmg field
{
  "schemaVersion": "1.0.0",
  "id": "cat.hamstrings",
  "fxmg": "FXMG=1.0/hamstring",
  "canonical": {
    "name": "Hamstrings",
    "slug": "hamstrings"
  },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "status": "active"
  }
}
```

An exercise's targets may refer to a category beside its muscles. A category reference carries `fxmg` where a muscle reference carries `fxm`:

```json fds:ignore exercise record excerpt showing the fxmg and fxm fields
{
  "exerciseId": "ex.romanianDeadlift",
  "fxi": "FXI=1.0S/m:hip.ext/o:standing/l:bar.straight@hands",
  "canonical": { "name": "Romanian Deadlift", "slug": "romanian-deadlift" },
  "targets": {
    "primary": [
      { "id": "cat.hamstrings", "name": "Hamstrings", "fxmg": "FXMG=1.0/hamstring" }
    ],
    "secondary": [
      { "id": "mus.gluteusMaximus", "name": "Gluteus Maximus", "categoryId": "cat.legs", "fxm": "FXM=1.0/gluteus-maximus" }
    ]
  }
}
```

A muscle record keeps its single `classification.categoryId`. That is the one group the owner shows the muscle under. Which categories a muscle belongs to is worked out from the keys and never stored: rectus femoris is in both the quadriceps and the hip flexors, and its record names neither.

## Comparing two category keys

Comparison looks at the muscles and parts each key covers once its members are followed down to muscle keys.

- **Same**: the two keys cover the same muscles and parts.
- **More specific**: one key covers part of what the other covers, and nothing outside it.
- **Different**: the two keys cover no muscle or part in common.
- **Overlap**: they share some muscles, and each covers one the other doesn't.

| Key A | Key B | Result |
|---|---|---|
| `FXMG=1.0/hamstring` | `FXMG=1.0/hamstring` | Same |
| `FXMG=1.0/hamstring` | `FXMG=1.0/thigh.posterior` | Same: two FMA terms with the same three members |
| `FXMG=1.0/thigh.medial` | `FXMG=1.0/thigh` | A is more specific: a compartment of B |
| `FXMG=1.0/external-oblique+internal-oblique` | `FXMG=1.0/anterior-abdominal-wall` | A is more specific |
| `FXMG=1.0/triceps-surae` | `FXMG=1.0/pectoral` | Different |
| `FXMG=1.0/quadriceps-femoris` | `FXMG=1.0/a:hip.flex` | Overlap: both hold rectus femoris |

Three comparisons work from the text alone: identical keys are the same, a compartment is more specific than its region, and a union is more specific than a union that holds all of its terms and more. Everything else needs the members of each code.

### A muscle in a category

A muscle key and a category key compare with their own words:

- **In**: everything the muscle key covers is in the category. `FXM=1.0/semitendinosus` is in `FXMG=1.0/hamstring`.
- **Partly in**: some of it is. `FXM=1.0/trapezius` is partly in the middle back, `FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse`, which holds only two parts of the trapezius.
- **Not in**: none of it is.

A muscle can be in several categories. `FXM=1.0/rectus-femoris` is in `FXMG=1.0/quadriceps-femoris` and in `FXMG=1.0/a:hip.flex`.

## Finding related items

| Search | Finds |
|---|---|
| A muscle, `FXM=1.0/biceps-femoris` | Every category it is in: `hamstring`, `thigh.posterior`, `thigh`, `lower-limb`, `a:hip.ext` and `a:kn.flex` |
| A category, `FXMG=1.0/hamstring` | Every muscle key in it, and the parts of those muscles |
| A region, `thigh` and `thigh.*` | The thigh and its compartments, just as `biceps-brachii.*` finds the heads of a muscle |
| An exercise motion, `m:hip.flex` | `FXMG=1.0/a:hip.flex`, and through it the muscles that do the work |

An exercise key's joint action and a category's action are the same code, so an exercise leads straight to the muscles it trains, as its load code leads to its equipment key.

## Building keys

You can write a key by hand by following this page, or generate one with the FDS Encoder.

<!-- TODO: link the Encoder page under Tools once it exists. -->
