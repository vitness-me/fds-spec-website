# wger — RFC gap report

**The test direction is one-way.** FDS is the standard; wger conforms *to* it. So a field FDS
requires that wger does not carry is wger's to enrich on import — not an FDS defect. The only findings
that count here are the reverse: **things wger produces that FDS has no first-class place to hold.**
Those are the candidate RFC amendments.

## Real gap: wger emits a per-exercise licence FDS cannot hold first-class

**Severity: high for the open-data archetype.**

Every wger exercise carries `license` and `license_author` (plus the full TASL attribution fields on
its images and videos). FDS holds the **media** licence — `media[].license` and `media[].attribution`
exist (RFC-001 §3.2) — but there is **no exercise-level licence or attribution field.** The exercise
text itself is CC-BY-SA content with a required attribution, and FDS has nowhere first-class to put
it.

This was demonstrated, not asserted: the mapping can only route wger's `license`/`license_author`
into the `attributes` escape hatch (RFC-001 §3.3), where they land as `attributes.contentLicense` and
`attributes.licenseAuthor`. That validates, but `attributes` is open free-form — a consumer is under
no obligation to read it, understand it, or preserve it through a transformation. For CC-BY-SA content
that is exactly the failure that matters: the attribution the licence legally requires can be silently
dropped on the next hop, because nothing in the standard says it is there.

FDS already solved this one layer up. RFC-008 §4.8 gave **programs** an `authorship` block —
`author`, `organization`, `license`, `attribution`, `uri` — for precisely this reason ("an
interchange format that drops attribution makes redistribution indistinguishable from theft"). The
argument applies verbatim to an exercise from an open library. **Candidate:** an exercise-level
`authorship`/licence block mirroring RFC-008 §4.8, so the largest open exercise database on earth can
be mirrored into FDS without its licence falling into an escape hatch. Until then, an open library
cannot fully adopt FDS without losing the one field that makes its content legally redistributable.

## Minor coverage gaps

- **Provenance.** wger emits `author_history` / `total_authors_history` (who edited an exercise). FDS
  has no authorship-history field on an exercise; it fits only in `attributes`. Low severity, but it
  is real emitted data with no first-class home.
- **`category`.** wger's body-part category (Abs, Legs, Chest…) has no FDS exercise field — FDS
  classifies by movement/mechanics/force, not body-part bucket — so it too can only ride in
  `attributes`. Low severity; it is coarse and largely redundant with `targets`.

## FDS covers these — not gaps

- **Identity.** wger's `uuid` satisfies `exerciseId`; its integer `id` rides in
  `metadata.externalRefs`. Round-trips both ways.
- **Multilingual names.** wger's per-language `Translation` rows map onto `canonical.localized`
  (`{lang, name, description, aliases}`) — FDS models multilingual content first-class.
- **Variations.** wger's `variation_group` maps onto `relations` with type `variation` (RFC-001
  relations vocabulary). Covered.
- **Media licences.** wger image/video licences map onto `media[].license` / `media[].attribution`.
  Covered — it is only the *exercise-level* licence that has no home.
- **Muscles and equipment.** Resolve onto FDS refs through a crosswalk registry.

## Not an FDS gap — wger's to adapt

FDS requires `classification.{movement, mechanics, force, level}` and `metrics.primary` (RFC-001 §4.2,
§4.5), and wger carries none of them on an exercise. Under the one-way rule this is **wger's
enrichment burden on import**, represented here by the `fds_` source fields — not an FDS deficiency.
It is worth one note only: because these are *required*, a wger record cannot become valid FDS by
mapping alone, so wger adoption is inherently a map-plus-enrich pipeline. If that friction is judged
too high for the library archetype, the lever is RFC-001 §4.2 (make some of them recommended), but
that is a strictness question, not a coverage gap, and the corpus does not push for it.

## Out of scope (correctly)

wger's Routine/Day/Slot/SlotEntry model and its per-iteration `*Config` progression tables are a
workout/program concern (RFC-007/RFC-008), not an exercise-library one. Noted in the rollup as the
structural surface to test if wger's *routines* are ever mapped.
