# Muscle Key

The muscle key is the structural key of a muscle. It sits in the `fxm` field and names a muscle, a part of a muscle, or a group of muscles, in words taken from standard anatomy. This page shows how a key is put together, where its codes come from, and how two keys compare.

The muscle key is simpler than the exercise key. It has no layers and no code lists of its own. Its codes come from an anatomy reference, so FDS publishes the rule for deriving them and never a list of muscles. Every key on this page is an illustration.

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
| Version | `1.0` | Major version 1, syntax revision 0. |
| Muscle | `biceps-brachii` | The muscle, by its anatomical term. |
| Part | `long` | The long head of that muscle. |

The header and the body are separated by `/`. The muscle key has no `S` or `N` flag, because nothing in it is extended. A flag written after the version is dropped from the written form, so `FXM=1.0S/biceps-brachii` is written `FXM=1.0/biceps-brachii`.

## The three forms

A key names one of three things.

| Form | Names | Example |
|---|---|---|
| `FXM=1.0/<muscle>` | A whole muscle | `FXM=1.0/biceps-brachii`, biceps brachii |
| `FXM=1.0/<muscle>.<part>` | A part or head of a muscle | `FXM=1.0/deltoid.acromial`, the acromial part of the deltoid, which gyms call the side delt |
| `FXM=1.0/g:<group>` | A group, defined by its members | `FXM=1.0/g:hamstrings`, the hamstrings |

Rules for every key:

- A key is written starting with `FXM=1.0/`, followed by exactly one of the three forms.
- Every code is lowercase: a letter, then letters and digits, in words joined by single hyphens.
- A key carries no side. Left and right belong to the exercise, in its sides layer `x`. A record for the left biceps and one for the right both carry `FXM=1.0/biceps-brachii`.

## The anatomy anchor

Anatomy already has standard names. The Foundational Model of Anatomy (FMA) gives every muscle, and the named parts and heads of muscles, one fixed term and an identifier. A muscle key is anchored to that term. The codes on this page are derived from FMA version 5.1.0. An owner doesn't invent the muscle code: it looks up the muscle in FMA and derives the code from the term it finds. Two owners that look up the same muscle get the same term, so they write the same code, whatever their catalogs call the muscle and in whatever language.

Uberon is a second anatomy reference that covers the same muscles under its own identifiers. It helps you confirm you have the right structure. It often has a whole muscle but not its heads or parts, and the code always comes from the FMA term.

You can search both references in the EBI Ontology Lookup Service: [FMA](https://www.ebi.ac.uk/ols4/ontologies/fma) and [Uberon](https://www.ebi.ac.uk/ols4/ontologies/uberon). The [Uberon project](https://obophenotype.github.io/uberon/) has its own documentation. These links are an informative pointer. FDS doesn't copy either reference, and a key stays valid if a site moves.

## The muscle code

The muscle code is the FMA term, rewritten:

1. Find the muscle in FMA and take its preferred term, for example `Latissimus dorsi`.
2. Take the term without its side. FMA also has terms such as "Right deltoid", and that muscle is `deltoid`.
3. Write it in lowercase.
4. Drop the word "muscle", or the words "muscle group", where the term has them.
5. Join the remaining words with single hyphens: `latissimus-dorsi`.

| FMA term | Muscle code |
|---|---|
| Biceps brachii | `biceps-brachii` |
| Latissimus dorsi | `latissimus-dorsi` |
| Pectoralis major | `pectoralis-major` |
| Gluteus maximus | `gluteus-maximus` |
| Semitendinosus | `semitendinosus` |
| Erector spinae muscle group | `erector-spinae` |

A muscle's everyday name doesn't change its code. "Lats" is `latissimus-dorsi`, and so is "dorsal ancho" in a Spanish catalog.

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

## Groups

A group is a set of muscles that fitness treats as one, such as the hamstrings, the calves or the hip flexors. It is written `g:` and the group code: `FXM=1.0/g:hamstrings`.

A key for a single structure covers only that structure and its parts. So a structure whose members the owner also keys separately is written as a group of them:

- The quadriceps is a group, `FXM=1.0/g:quadriceps`, because its four muscles have keys of their own: `FXM=1.0/rectus-femoris`, `FXM=1.0/vastus-lateralis`, `FXM=1.0/vastus-medialis` and `FXM=1.0/vastus-intermedius`.
- The erector spinae, when its parts aren't keyed separately, is one muscle: `FXM=1.0/erector-spinae`.

Two owners who split a structure differently write different keys for it. One that keys the parts of the erector spinae separately writes the erector spinae as a group, and that group doesn't compare as `FXM=1.0/erector-spinae`.

Rules:

- A group is defined by its members, the keys of the muscles, parts and other groups it contains. Its name means nothing to a comparison. An owner's hamstrings could have these members:

  `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus`, `FXM=1.0/semimembranosus`

- The group code is the owner's own word, under the same spelling rules as any other code. It isn't derived from anatomy.
- A group may cite an anatomy term where one exists: FMA has "Set of hamstring muscles" for the hamstrings and "Triceps surae" for the calves. The code stays the owner's word, and the members still define the group.
- A group has at least one member, and it never contains itself, directly or through another group.
- FDS has no field for a group's member list. The owner supplies it with its own catalog data: in the muscle record's `attributes` or `extensions`, or in its own documentation.

Because the group code is the owner's word, two owners can use one group code for different sets of muscles. A `g:` key means only what its owner's member list says, and the key doesn't say who the owner is. To compare a group key, you need the member list from the owner that wrote it.

## When no term exists

The rule never asks you to guess.

- **A part with no term takes the smallest structure that contains it.** FMA names the long head of biceps brachii but not an "upper biceps" or a "lower chest". Use the smallest structure FMA names that contains the one you mean. The lower chest is `FXM=1.0/pectoralis-major.abdominal`. An upper biceps spans both heads, so it is `FXM=1.0/biceps-brachii`. Each key is true, if less specific. Never use a narrower structure than the evidence supports.
- **A body area is not a muscle.** "Core", "arms" or "full body" spans muscles with different jobs. Such a name is a category for grouping records, not a muscle, and it carries no key. When you do mean a set of muscles that work together, define a group and list its members.
- **A name that isn't anatomy carries no key.** A muscle list sometimes holds entries like "cardio", "Olympic lifts" or "other". Leave `fxm` out of those records.

Keys are optional, so a record without one is still valid FDS.

## What the schema can't check

The schema checks that a key is well formed: the header, one of the three forms, and lowercase codes joined by hyphens. It can't check that a muscle code was derived correctly from the FMA term, that a part code names a part FMA has, or what a group contains.

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

### Hamstrings

A catalog lists "Hamstrings" as one entry.

| Step | Decision |
|---|---|
| Form | The hamstrings are three muscles that train together, so the entry is a group |
| Code | The owner's own word: `hamstrings` |
| Members | `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus`, `FXM=1.0/semimembranosus` |

`FXM=1.0/g:hamstrings`

### Lats

A catalog lists "Lats".

| Step | Decision |
|---|---|
| Term | The everyday name is for the muscle whose FMA term is Latissimus dorsi |
| Code | `latissimus-dorsi`, never `lats` |

`FXM=1.0/latissimus-dorsi`

## Keys in records

These excerpts show the shape planned for the next release; a future schema version adds these fields.

A muscle record carries its key in `fxm`, and so does every muscle reference, such as the target muscles of an exercise:

```json fds:ignore planned record shape; fxm is not in a published schema yet
{
  "schemaVersion": "1.0.0",
  "id": "mus.bicepsBrachiiLongHead",
  "fxm": "FXM=1.0/biceps-brachii.long",
  "canonical": {
    "name": "Biceps Brachii, Long Head",
    "slug": "biceps-brachii-long-head",
    "aliases": ["Outer Biceps"]
  },
  "classification": {
    "categoryId": "cat.arms",
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

An exercise refers to its target muscles by `id` and `name`, and each reference carries the muscle's key in `fxm` beside them:

```json fds:ignore planned record shape; fxi and fxm are not in a published schema yet
{
  "exerciseId": "ex.romanianDeadlift",
  "fxi": "FXI=1.0S/m:hip.ext/o:standing/l:bb@hands",
  "canonical": { "name": "Romanian Deadlift", "slug": "romanian-deadlift" },
  "targets": {
    "primary": [
      { "id": "mus.hamstrings", "name": "Hamstrings", "categoryId": "cat.legs", "fxm": "FXM=1.0/g:hamstrings" }
    ],
    "secondary": [
      { "id": "mus.gluteusMaximus", "name": "Gluteus Maximus", "categoryId": "cat.legs", "fxm": "FXM=1.0/gluteus-maximus" }
    ]
  }
}
```

## Comparing two muscle keys

Comparison looks at the muscles and parts each key covers. A part covers itself. A muscle covers all of its parts. A group covers everything its members cover.

- **Same**: two muscle or part keys written identically are the same. Group keys are the same only when their member lists cover the same muscles and parts. A group and a muscle can be the same: a group "shoulders" whose only member is the deltoid is the same as `FXM=1.0/deltoid`.
- **More specific**: one key covers part of what the other covers, and nothing outside it.
- **Different**: the two keys cover no muscle or part in common.

| Key A | Key B | Result |
|---|---|---|
| `FXM=1.0/biceps-brachii` | `FXM=1.0/biceps-brachii` | Same |
| `FXM=1.0/biceps-brachii.long` | `FXM=1.0/biceps-brachii` | A is more specific: the long head is one part of the muscle |
| `FXM=1.0/semitendinosus` | `FXM=1.0/g:hamstrings` | A is more specific, when B's owner lists semitendinosus as a member |
| `FXM=1.0/biceps-brachii.long` | `FXM=1.0/biceps-brachii.short` | Different: two heads of one muscle |
| `FXM=1.0/biceps-brachii` | `FXM=1.0/brachialis` | Different: two muscles |
| `FXM=1.0/g:quadriceps` | `FXM=1.0/g:hip-flexors` | Overlap, when both owners list rectus femoris as a member |

When two keys share some muscles and each covers one the other doesn't, they overlap: neither is more specific, and they aren't different either. Quadriceps and hip flexors groups usually share rectus femoris.

A comparison that involves a group needs that group's member list from its owner. Keys of muscles and parts compare from the text alone.

Keys that are the same are a strong match, and anything else gives a short list for a person to confirm. See [Using keys](../structural-keys.md#using-keys) for how to keep confirmed links.

## Building keys

You can write a key by hand by following this page, or generate one with the FDS Encoder (under Tools, to come).

<!-- TODO: link the Encoder page under Tools once it exists. -->
