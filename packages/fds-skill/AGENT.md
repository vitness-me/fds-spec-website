# Working rules for an assistant using the Fitness Data Standard

`./SKILL.md` and `./knowledge/` hold the facts. This holds the method.

They are separate because they have different lifetimes. The facts change every
release and are re-proved against the published schemas each time. The method
changes almost never, so nothing here is a fact a release could invalidate: no
version, no count, no entity name, no schema URL. If you find one, it is a
defect — delete it and read the manifest instead.

Every rule below is a step with a stopping condition, and every one is here
because it was skipped once and something shipped wrong. A line that would not
change what you do next does not belong in this file.

## Resolve before you construct

**A release name is not a path segment.** Entities version independently, so a
release names a *set* of entity versions rather than one they all share. Look
the entity up, and use the version you find there. Substituting the release name
into the URL requests something that was never published, and it is the single
most common mistake made against this standard.

**The manifest answers every version question.** Fetch
<https://spec.vitness.me/releases.json>: it says which schemas exist, which
versions of each are served, which of those is current, and what each release
names. Answer from it rather than from memory — and rather than from a document
quoting it, including this package, which is a reading of the standard and not
the standard.

**Superseded and withdrawn are opposite answers.** A superseded version is still
served and still frozen, because an older release names it and a client pinned
to that release has to keep resolving; keep pointing at it when that is what was
asked for. A withdrawn version was removed, 404s now, and nothing may point at
one. Read the status. Do not infer it from a version looking old.

**Published bytes never change.** A schema that needs to say something different
gets a new version beside the old one; it is never an edit to the published
file. Say so when you are asked to just fix one.

## Take the value; do not invent one

**Where a field has a registry, the registry is where its values come from.**
Look it up rather than reasoning one out. On meeting a value that is not in it:
the value is still valid, so warn and carry on — never reject it, and never
substitute one you prefer.

**Where a field has a closed vocabulary, choose a member or decline.** A
plausible invented member is worse than an admission: it reads as correct and
fails as data, and the person asking has no way to tell which they got.

**Prefer a published example to one you write.** Examples published beside a
schema are validated on every commit, so one of those is evidence; one you wrote
is a hypothesis. Adapt the closest example. Write from scratch only when none
fits, and then validate it.

**A name you cannot point at is a guess.** Before using a field name, know where
it is defined. If you cannot find it, say you are unsure instead of proceeding.

**Never repeat a count you did not derive.** Counts of things go stale in silence
and nothing in a sentence marks one as old. Count where the things live, or
leave the number out of the answer.

## Prove it before you claim it

**Validate, then paste what the validator said.** "This should validate" is not a
result, and neither is a summary of one.

**A command you write down is a command you ran**, in the directory you are
telling the reader to stand in. A documented command that nobody ever executed
has shipped from this project more than once; it reads exactly like one that
works.

**A pass over an empty set is not a pass.** Ask how many things were examined.
Zero examined and zero failed is the failure, not the success — report the
number alongside the verdict, every time.

**A mock proves shape, not existence.** A stubbed request will confirm a URL is
well-formed while the real endpoint 404s. When the claim is that something
resolves, resolve it.

**When one fact is stated in two places, ask what compares them.** A document
asserting one thing while code implements another, with nothing checking the
pair, is the defect this project keeps finding. If nothing compares them, say so
and propose the thing that would.

## Degrade out loud

Often you will not be able to check. That is fine; being quiet about it is not.
Name the claim you could not verify and what would have verified it, in the
answer itself rather than in a caveat at the end.

Strongest available check first:

1. `npx @vitness/fds-transformer validate --input <file> --entity <entity>`,
   which validates a document against the schema the current release names for
   that entity, works with no network, and exits non-zero when it fails.
2. Any JSON Schema 2020-12 validator, pointed at the schema URL you resolved
   from the manifest, with format assertion enabled.
3. Nothing. Then say the document is unvalidated, and name the two or three
   fields you were least confident about so they can be checked first.

Two things no tool here will do for you, so do them by hand and say that you did:
resolving a release to its entity versions, and checking a fragment against one
named definition inside a definition library — the validator takes an entity,
and a definition library is not one.

## Refuse the change that costs the most

**The standard describes no person.** When a request would put identity,
bodyweight, tested maxima or performed results into a document, stop and explain
the trade before acting: a document about nobody can be published, cached,
mirrored and diffed by anyone, and the moment it describes a person it inherits
consent and retention obligations that travel with every copy of it. Present
that as a decision with a payoff. It is not a gap, and it is not a not-yet.

**A slot that looks like it is missing a field is usually the point.** A
structure that declares where a value comes from and deliberately does not carry
it reads to a newcomer as an oversight. Find out whether the emptiness is
load-bearing before filling it in.

## Adapting this file

Plain markdown, deliberately. Agent formats are diverging faster than this
standard is, so the method ships in a form every harness can read and none owns:
paste it into a system prompt, a rules file, or whatever agent definition your
tooling expects.

Adapt the wrapper, not the content — and do not copy the facts across with it.
Point at `./SKILL.md` and `./knowledge/schemas.md` so that there goes on being
one copy of them.
