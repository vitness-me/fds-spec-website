# Muscle Key

The muscle key is the structural key of a muscle. It sits in the `fxm` field and names one muscle or one part of a muscle, in words taken from standard anatomy. This page shows how a key is put together, where its codes come from, and how two keys compare.

The muscle key is simpler than the exercise key. It has no layers and no code lists of its own. Its codes come from an anatomy reference, so FDS publishes the rule for deriving them. The codes derived so far, each with its FMA id, are in [`muscle-key.registry.json`](https://spec.vitness.me/registries/muscle-key.registry.json). Every key on this page is an illustration.

A set of muscles, such as the hamstrings or the hip flexors, is a muscle category and has a key of its own: see the [muscle category key](./muscle-category-key.md).

This page describes version 1.0 of the muscle key.

## Anatomy of the key

The long head of biceps brachii has this key:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXM</span><span className="ka-sym">=</span><span className="ka-code">1.0</span></code>
      <span className="key-anatomy__label">header</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">biceps-brachii</span></code>
      <span className="key-anatomy__label">muscle</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">.</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">long</span></code>
      <span className="key-anatomy__label">part</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-code">code</span> · <span className="ka-sym">symbol</span>
  </figcaption>
</figure>

`FXM=1.0/biceps-brachii.long`

| Part | Text | What it says |
|---|---|---|
| Key type | `FXM` | This is a muscle key. |
| Version | `1.0` | Major version 1, revision 0. |
| Muscle | `biceps-brachii` | The muscle, by its anatomical term. |
| Part | `long` | The long head of that muscle. |

The header and the body are separated by `/`. The muscle key has no `S` or `N` flag, because nothing in it is extended. A flag written after the version is dropped from the written form, so `FXM=1.0S/biceps-brachii` is written `FXM=1.0/biceps-brachii`.

## The two forms

A key names one of two things.

| Form | Names | Example |
|---|---|---|
| `FXM=1.0/<muscle>` | A whole muscle | `FXM=1.0/biceps-brachii`, biceps brachii |
| `FXM=1.0/<muscle>.<part>` | A part or head of a muscle | `FXM=1.0/deltoid.acromial`, the acromial part of the deltoid, which gyms call the side delt |

Rules for every key:

- A key is written starting with `FXM=1.0/`, followed by exactly one of the two forms.
- Every code is lowercase: a letter, then letters and digits, in words joined by single hyphens.
- A key carries no side. Left and right belong to the exercise, in its sides layer `x`. A record for the left biceps and one for the right both carry `FXM=1.0/biceps-brachii`.

## The anatomy anchor

Anatomy already has standard names. The Foundational Model of Anatomy (FMA) gives every muscle, and the named parts and heads of muscles, one fixed term and an identifier. A muscle key is anchored to that term. The codes on this page are derived from FMA version 5.1.0. An owner doesn't invent the muscle code: it looks up the muscle in FMA and derives the code from the term it finds. Two owners that look up the same muscle get the same term, so they write the same code, whatever their catalogs call the muscle and in whatever language.

Uberon is a second anatomy reference that covers the same muscles under its own identifiers. It helps you confirm you have the right structure. It often has a whole muscle but not its heads or parts, and the code always comes from the FMA term.

You can search both references in the EBI Ontology Lookup Service: [FMA](https://www.ebi.ac.uk/ols4/ontologies/fma) and [Uberon](https://www.ebi.ac.uk/ols4/ontologies/uberon). The [Uberon project](https://obophenotype.github.io/uberon/) has its own documentation. These links are an informative pointer: a key stays valid if a site moves.

### Sources and licences

The muscle registry, [`muscle-key.registry.json`](https://spec.vitness.me/registries/muscle-key.registry.json), and the category registry, [`muscle-category-key.registry.json`](https://spec.vitness.me/registries/muscle-category-key.registry.json), quote labels and identifiers from two references, unchanged. Each registry names its sources in `sources` and `attribution`.

| Source | Version | Licence |
|---|---|---|
| [Foundational Model of Anatomy Ontology (FMA)](http://si.washington.edu/projects/fma), Structural Informatics Group, University of Washington | 5.1.0 | [CC BY 3.0 Unported](https://creativecommons.org/licenses/by/3.0/) |
| [Uberon](http://uberon.org), the Uber-anatomy ontology, OBO Foundry | release 2026-11-05 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |

The codes are FDS's own, written from the FMA labels. Anyone who republishes the registries' labels or ids keeps this credit and the licence link.

## The muscle code

The muscle code is the FMA term, rewritten:

1. Find the muscle in FMA and take its preferred term, for example `Latissimus dorsi`.
2. Take the term without its side. FMA also has terms such as "Right deltoid", and that muscle is `deltoid`.
3. Write it in lowercase.
4. Drop the word "muscle" where the term has it.
5. Join the remaining words with single hyphens: `latissimus-dorsi`.

| FMA term | Muscle code |
|---|---|
| Biceps brachii | `biceps-brachii` |
| Latissimus dorsi | `latissimus-dorsi` |
| Pectoralis major | `pectoralis-major` |
| Gluteus maximus | `gluteus-maximus` |
| Semitendinosus | `semitendinosus` |
| Longissimus | `longissimus` |

A muscle's everyday name doesn't change its code. "Lats" is `latissimus-dorsi`, and so is "dorsal ancho" in a Spanish catalog.

An FMA term for a set of muscles isn't a muscle. The Erector spinae muscle group is a category, `FXMG=1.0/erector-spinae`, and its members are muscles: `FXM=1.0/iliocostalis`, `FXM=1.0/longissimus` and `FXM=1.0/spinalis`.

## Parts

A part code is the word FMA uses to tell the part or head apart from the rest of the muscle: the word before "part of" or "head of" in its term.

| FMA term | Key |
|---|---|
| Long head of biceps brachii | `FXM=1.0/biceps-brachii.long` |
| Short head of biceps brachii | `FXM=1.0/biceps-brachii.short` |
| Acromial part of deltoid | `FXM=1.0/deltoid.acromial` |
| Clavicular part of pectoralis major | `FXM=1.0/pectoralis-major.clavicular` |
| Medial head of gastrocnemius | `FXM=1.0/gastrocnemius.medial` |

Rules:

- A part is written after its muscle, joined by `.`. A part never stands alone, because `long` is a head of biceps brachii and also of triceps brachii.
- Write a part only where it trains differently from the rest of the muscle. The upper chest is the clavicular part of pectoralis major, and it is worth its own record. A muscle that trains as one piece gets one record and no parts.
- The parts of a muscle together make up the whole muscle. `FXM=1.0/biceps-brachii` covers the long head and the short head.

## When no term exists

The rule never asks you to guess.

- **A part with no term takes the smallest structure that contains it.** FMA names the long head of biceps brachii but not an "upper biceps" or a "lower chest". Use the smallest structure FMA names that contains the one you mean. The lower chest is `FXM=1.0/pectoralis-major.abdominal`. An upper biceps spans both heads, so it is `FXM=1.0/biceps-brachii`. Each key is true, if less specific. Never use a narrower structure than the evidence supports.
- **A set of muscles is not a muscle.** "Hamstrings", "core" or "full body" spans several muscles. Such a name is a muscle category and carries a [muscle category key](./muscle-category-key.md) in `fxmg`, not an `fxm`.
- **A name that isn't anatomy carries no key.** A muscle list sometimes holds entries like "cardio", "Olympic lifts" or "other". Leave `fxm` out of those records.

Keys are optional, so a record without one is still valid FDS.

## What the schema can't check

The schema checks that a key is well formed: the header, one of the two forms, and lowercase codes joined by hyphens. It can't check that a muscle code was derived correctly from the FMA term, or that a part code names a part FMA has.

That is the price of publishing a rule instead of a list. Two owners can write different keys for one muscle and both pass the schema. One owner reads FMA and writes `FXM=1.0/deltoid.acromial` for the side delt. Another goes by the gym name and writes `FXM=1.0/deltoid.lateral`. Both keys are well formed, the comparison says they are different, and only a person who checks the FMA term can tell which one follows the rule. Following the derivation is what makes keys from different owners meet.

## Worked examples

Each example starts from a catalog entry and decides the key one step at a time.

### Biceps

A catalog lists "Biceps".

| Step | Decision |
|---|---|
| Term | The FMA term is Biceps brachii |
| Code | Lowercase, hyphens: `biceps-brachii` |
| Part | The entry means the whole muscle, so no part |

`FXM=1.0/biceps-brachii`

### Long head of the biceps

A catalog lists "Biceps, long head" as its own entry.

| Step | Decision |
|---|---|
| Muscle | Biceps brachii: `biceps-brachii` |
| Part | The FMA term is Long head of biceps brachii, so the part code is `long` |

`FXM=1.0/biceps-brachii.long`

### Side delts

A catalog lists "Side delts".

| Step | Decision |
|---|---|
| Term | The side of the shoulder is the acromial part of the deltoid in FMA |
| Muscle | Deltoid: `deltoid` |
| Part | Acromial part of deltoid: `acromial`, not the gym word "lateral" |

`FXM=1.0/deltoid.acromial`

### Erector spinae

A catalog lists "Erector spinae" and "Longissimus" as two entries.

| Step | Decision |
|---|---|
| Term | FMA has Erector spinae muscle group, a set of muscles, and Longissimus, a muscle |
| Erector spinae | A set is a category: the entry becomes a category record with `FXMG=1.0/erector-spinae` in its `fxmg`. A muscle record never carries `fxmg` |
| Longissimus | A muscle: `longissimus` |

`FXM=1.0/longissimus`

### Lats

A catalog lists "Lats".

| Step | Decision |
|---|---|
| Term | The everyday name is for the muscle whose FMA term is Latissimus dorsi |
| Code | `latissimus-dorsi`, never `lats` |

`FXM=1.0/latissimus-dorsi`

## Keys in records

A muscle record carries its key in `fxm`, and so does every muscle reference, such as the target muscles of an exercise:

```json fds:ignore muscle record excerpt showing the fxm field
{
  "schemaVersion": "1.1.0",
  "id": "mus.bicepsBrachiiLongHead",
  "fxm": "FXM=1.0/biceps-brachii.long",
  "canonical": {
    "name": "Biceps Brachii, Long Head",
    "slug": "biceps-brachii-long-head",
    "aliases": ["Outer Biceps"]
  },
  "classification": {
    "categoryId": "cat.upperArmFront",
    "region": "upper-front",
    "laterality": "bilateral"
  },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "status": "active"
  }
}
```

An exercise's targets, primary and secondary, always refer to individual muscles, never to a category. Each muscle reference keeps the muscle's `id` and `name`, and carries its category's `categoryId`, the muscle's key in `fxm`, and the category's key in `fxmg`. An exercise that trains the hamstrings lists the three hamstring muscles:

```json fds:ignore exercise record excerpt showing the fxi, fxm and fxmg fields
{
  "exerciseId": "ex.romanianDeadlift",
  "fxi": "FXI=1.0S/m:hip.ext/o:standing/l:bar.straight@hands",
  "canonical": { "name": "Romanian Deadlift", "slug": "romanian-deadlift" },
  "targets": {
    "primary": [
      { "id": "mus.bicepsFemoris", "name": "Biceps Femoris", "categoryId": "cat.hamstrings", "fxm": "FXM=1.0/biceps-femoris", "fxmg": "FXMG=1.0/hamstring" },
      { "id": "mus.semitendinosus", "name": "Semitendinosus", "categoryId": "cat.hamstrings", "fxm": "FXM=1.0/semitendinosus", "fxmg": "FXMG=1.0/hamstring" },
      { "id": "mus.semimembranosus", "name": "Semimembranosus", "categoryId": "cat.hamstrings", "fxm": "FXM=1.0/semimembranosus", "fxmg": "FXMG=1.0/hamstring" }
    ],
    "secondary": [
      { "id": "mus.gluteusMaximus", "name": "Gluteus Maximus", "categoryId": "cat.glutes", "fxm": "FXM=1.0/gluteus-maximus", "fxmg": "FXMG=1.0/buttock" }
    ]
  }
}
```

## Comparing two muscle keys

Comparison looks at the muscles and parts each key covers. A part covers itself, and a muscle covers all of its parts.

- **Same**: the two keys are written identically.
- **More specific**: one key is a part of the muscle the other names.
- **Different**: the two keys cover no muscle or part in common.

| Key A | Key B | Result |
|---|---|---|
| `FXM=1.0/biceps-brachii` | `FXM=1.0/biceps-brachii` | Same |
| `FXM=1.0/biceps-brachii.long` | `FXM=1.0/biceps-brachii` | A is more specific: the long head is one part of the muscle |
| `FXM=1.0/biceps-brachii.long` | `FXM=1.0/biceps-brachii.short` | Different: two heads of one muscle |
| `FXM=1.0/biceps-brachii` | `FXM=1.0/brachialis` | Different: two muscles |

Muscle keys compare from the text alone. To compare a muscle with a category, see [A muscle in a category](./muscle-category-key.md#a-muscle-in-a-category).

Keys that are the same are a strong match, and anything else gives a short list for a person to confirm. See [Using keys](../structural-keys.md#using-keys) for how to keep confirmed links.

## Finding related items

A muscle key leads to its parts, to the categories it belongs to, and to the exercises that train it. No link has to be declared anywhere.

| Search | Finds |
|---|---|
| `FXM=1.0/deltoid` and `FXM=1.0/deltoid.*` | The deltoid and its three parts: `clavicular`, `acromial` and `spinal` |
| `FXM=1.0/biceps-brachii.*` | The long and short heads of biceps brachii |
| A muscle, `FXM=1.0/rectus-femoris`, in the category index | Every category it is in: `quadriceps-femoris`, `thigh.anterior`, `thigh`, `entire`, `a:hip.flex` and `a:kn.ext` |
| A part, `FXM=1.0/deltoid.acromial`, in the category index | `shoulder.intrinsic`, `entire`, and `a:sh.abd`, the prime movers of shoulder abduction |
| An exercise motion, `m:hip.flex` | `FXMG=1.0/a:hip.flex`, whose members are `FXM=1.0/psoas-major`, `FXM=1.0/iliacus` and `FXM=1.0/rectus-femoris` |
| Exercise targets whose `fxm` is `FXM=1.0/gluteus-maximus` | Every exercise that trains the gluteus maximus, in any catalog |

`deltoid.*` means any key that adds a part to `deltoid`. The category index lists, for each muscle and part, every category whose members hold it. It is built from the categories' members, so the muscle record stores none of it. See [Finding related items](./muscle-category-key.md#finding-related-items) on the muscle category key page. An exercise key's joint action is the code of an action category, so the motion of an exercise leads to the muscles that move it.

## Building keys

You can write a key by hand by following this page, or generate one with the [FDS Encoder](../../tools/encoder/index.md).
