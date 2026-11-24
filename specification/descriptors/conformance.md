# Conformance

:::caution Draft / experimental
Not normative until the RFC that adopts the structural descriptors is accepted: RFC (pending). See [the overview](./overview.md).
:::

An implementation of FXI, FXE and FXM conforms when it passes every published test vector, in each of four tiers, at 100%. The vectors are data: each one is an input and the output this specification requires, so any implementation, in any language, runs the same files through a small adapter of its own.

Conformance says that an implementation computes what the specification says. It does not say that the people, or the programs, who answer the question flow describe exercises accurately. That cannot be certified. It is measured instead, and published as [reports](#measured-not-certified).

## The tiers

<!-- fds:generated conformance#tiers -->
| Tier | Vectors | File | Data it reads |
|---|---|---|---|
| `syntax` | 133 | [`syntax.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/syntax.json) | [`fxm-vocabulary.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/fxm-vocabulary.json) |
| `builder` | 24 | [`builder.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/builder.json) | [`words.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/words.json) |
| `compare` | 53 | [`compare.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/compare.json) | [`fxm-vocabulary.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/fxm-vocabulary.json) |
| `resolver` | 31 | [`resolver.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/resolver.json) | (none) |
<!-- /fds:generated -->

Every tier file names the rules revision its vectors were written for, in `rules`. A vector set is valid for that rules revision only: when the registries move to a new one, the vectors are reviewed against it before `rules` changes.

Every vector has an `id`, unique within its tier, and a `note` saying what it tests. The note is for people; an adapter ignores it.

### Syntax

Each vector gives a `kind` (`fxi`, `fxe` or `fxm`) and an `input` string.

- A **valid** vector expects `{"valid": true, "canonical": …}`: the input is valid and this is its [canonical form](./fxi.md#canonical-form). Where it also gives `standard`, that is the standard projection: the same string with every extended layer dropped and the flag `S`.
- An **invalid** vector expects `{"valid": false, "issues": […]}`: exactly this set of issue codes, sorted. Each vector breaks one rule, and lists a second code only where breaking that rule necessarily breaks another. A checker reports every problem it finds, so it must report all of them and no others.
- An `fxm` vector checks the key's format alone, unless it is marked `"vocabulary": true`. Then the key is also checked against [`fxm-vocabulary.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/fxm-vocabulary.json), a made-up vocabulary whose tokens name no real muscle. FDS publishes no muscle list; that file exists only to test the key grammar.

The issue codes:

<!-- fds:generated conformance#codes -->
| Code | Reported for |
|---|---|
| `prefix` | The string does not start with the descriptor header (`FXI=`, `FXE=` or `FXM=`, then the version). |
| `no-rev` | The header has a major version but no syntax revision (`FXI=1/`): a pre-release draft. |
| `major` | A major version other than `1`. |
| `rev` | A syntax revision newer than the checker knows, or one written with a leading zero. |
| `unknown-layer` | A layer letter the descriptor does not have, or, in FXE, one the kind does not take. |
| `duplicate-layer` | A layer written twice. |
| `empty` | A layer, or a support item, with no value. |
| `missing-motion` | An FXI without the motion layer `m`. |
| `generic-motion` | `m:*`: the motion cannot be generic. |
| `part-unknown` | A motion phase with several `\|` parts, one of them `?`. |
| `empty-phase` | A motion phase with no joint action. |
| `two-prefixes` | A motion part with more than one phase prefix. |
| `zero` | `0` anywhere but `=0` or `~0`. |
| `open-hedge` | The open-ended `+?` in a motion phase. |
| `unknown-action` | A motion item that is not a joint action, a joint with `?`, or a joint that circles with `.circ`. |
| `short-suffix` | The short-drive suffix `-` on anything but a named joint action. |
| `opposite-actions` | Two opposite actions in one part of a phase. |
| `unknown-code` | A code not in its vocabulary: an orientation, moving end, footwork, held posture, line or accessory, or an FXE value. |
| `unknown-surface` | A support surface that is not a support token. |
| `unknown-point` | A body point not in the body-point vocabulary. |
| `unknown-implement` | A load token that is not an equipment token. |
| `support-as-load` | A support token written as a load. |
| `count` | An implement count other than `1` to `4`. |
| `unknown-hold` | A hold point that is neither a body point nor a hold-only point. |
| `bw-hold` | `bw` with a hold point or a count. |
| `missing-hold` | An implement without a hold point. |
| `unknown-symmetry` | A symmetry code not in the vocabulary. |
| `unknown-scope` | A symmetry scope other than `arms` or `legs`. |
| `symmetry-conflict` | More than one symmetry code without scopes, or two for one scope. |
| `st-sp` | `st-sp` in `g`: split stance is footwork, `f:split`. |
| `unknown-grip` | A grip element that is not a hand orientation, width or stance. |
| `grip-conflict` | More than one hand orientation, width or stance in one grip phase. |
| `unknown-range` | A range code not in the vocabulary. |
| `range-conflict` | Two start positions, or `partial` with `deep`. |
| `unknown-alone` | `?` combined with other codes in `h`, `p` or `a`. |
| `conflict` | A default code combined with others, or two codes marked "never with". |
| `missing-kind` | An FXE configuration that does not start with `k`. |
| `kind-unknown` | `k:?` with other layers. |
| `unknown-kind` | An FXE kind not in the vocabulary. |
| `form-kind` | An FXE form written under a kind it does not belong to. |
| `combo` | A combination that joins `k:none` or `k:?`. |
| `token` | An FXM body that is not `<muscle>`, `<muscle>.<part>` or `g:<group>` in lowercase kebab-case. |
| `unknown-muscle` | An FXM muscle the vocabulary does not define. |
| `unknown-part` | An FXM part the muscle does not have in the vocabulary. |
| `unknown-group` | An FXM group the vocabulary does not define. |
<!-- /fds:generated -->

### Builder

Each vector gives an answers record, `entry`, as [the question flow](./question-flow.md#the-answers-record) defines it, and optionally a `mode` (`owner` when absent). The implementation builds it under the published question flow, with [`words.json`](https://github.com/vitness-me/fds-spec-website/blob/main/specification/descriptors/conformance/words.json) as the movement-word dataset.

That dataset is written for these vectors and nothing else. Movement words are catalogue data and FDS publishes none; these few let the vectors reach the word route, word hold points, a word machine and a word question. Several vectors encode the same exercise both ways, through a word and joint by joint, and expect the same string.

A vector expects:

- `fxi`, the canonical FXI, or `null` for equipment on its own;
- `fxe`, the standard FXE of the main equipment, or of the equipment itself;
- `fxeFull`, the full FXE with its build details, only when the answers gave them;
- beside an FXI, `fxiProvenance` and `fxiGap`, which the record carries and which never change the strings;

or `{"error": true}`, for answers the flow does not accept. The message is the implementation's own; only the refusal is tested. An error vector also gives `fix`, the one change (to `answers`, or to the entry itself) that makes the entry build: every other question is answered, so the vector fails for the reason it states and no other. An adapter may ignore `fix`; the reference run checks that each one does make its entry build.

The strings must match byte for byte. The three [worked examples](./question-flow.md#worked-examples) are vectors here, as published.

### Compare

An `fxi` or `fxe` vector gives two strings, `a` and `b`, and expects the overall `relation` and the relation of every layer in `layers`, each read as "a is … than b". The layers are every standard layer, plus an extended layer when both strings carry it. A pair of combination FXEs, a pair with an invalid string and a pair of mixed kinds expect no layers.

Every one of these vectors is also run with `a` and `b` swapped, expecting the inverse: `refines` and `refined-by` trade places, and so do `narrower` and `broader`. An implementation cannot pass a pair one way round only.

An `fxm` vector expects the [grade](./fxm.md#compare) over the anatomical leaves of `fxm-vocabulary.json`, the leaves the two keys share, sorted, and, for `contains`, which side is the `container`.

### Resolver

Each vector gives a `query` row, a `library` of rows, and optionally `top`, the length of the confirm list (3 when absent). A row is `{id, fxi, fxiProvenance?, fxiGap?, name?, fxe?}`. The vector expects one of:

- `{"kind": "auto", "id": …}`, the library entry linked without asking;
- `{"kind": "confirm", "reason": …, "candidates": […]}`, the reason auto-match was refused and the ranked list. Each candidate says how it entered the list: `{"via": "fxi", "relation": …}`, `{"via": "near", "layer": …}` with the one standard layer that differs, or `{"via": "name"}`;
- `{"kind": "absent"}`, only when the library is empty.

The ranking is the one in [the match protocol](./compare-and-match.md#match-protocol). No vector has two refusal reasons at once, so the order in which an implementation checks them is not tested. The reasons:

<!-- fds:generated conformance#reasons -->
| Reason | Means |
|---|---|
| `no-identical` | No library entry is identical to the query. |
| `several-identical` | More than one library entry is identical to the query. |
| `query-gap` | The query carries a gap marker. |
| `entry-gap` | The identical library entry carries a gap marker. |
| `query-not-owner` | The query has neither owner nor owner-assisted provenance. |
| `entry-not-owner` | The identical library entry has neither owner nor owner-assisted provenance. |
<!-- /fds:generated -->

## Running the vectors

The files are plain JSON. To test an implementation, write an adapter that reads each tier file, runs every vector through the implementation, and compares the result with `expect` as JSON values: the order of an object's keys does not matter, the order of a list does.

The reference encoder, [`@vitness/fds-encoder`](https://github.com/vitness-me/fds-spec-website/tree/main/packages/fds-encoder), is run against every vector on each change to this repository, and must pass every tier at 100%. The same run checks the suite itself: that each tier file names the current rules revision, that every issue code and reason it defines is expected by some vector, that its reasons are exactly the ones the reference can return, and that every builder error vector's `fix` makes its entry build.

## Measured, not certified

The tiers above have one right answer per vector. Two things that matter as much do not, and FDS publishes them as measurements, with their method and sample, rather than as a pass or a fail:

- **Encoder agreement.** When different people, or different programs, answer the question flow for the same exercise without seeing each other's answers, how often their strings are `identical`, and how the remaining pairs divide between `refines`, `compatible` and `contradicting`, per layer.
- **Adopter outcomes.** When a catalogue that has encoded its own exercises is matched against another, how many of its rows link automatically, how many confirm lists hold the right entry and at what rank, how many hold none, and how many automatic links a person later rejects.

Neither is a threshold an implementation or a catalogue must reach. They say how far the descriptors can be relied on, so that an adopter can decide how much of the confirm step to keep.

:::note Pending
The first reports are not yet published. They follow the re-test of the current rules revision.
:::

<!-- TODO (pending the re-test): the encoder agreement and adopter outcome reports, each with its method, sample and date. -->

| Report | Result |
|---|---|
| Encoder agreement | Pending: not yet measured for this rules revision. |
| Adopter outcomes | Pending: not yet measured for this rules revision. |
