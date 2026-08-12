# Release runbook

Four things get shipped from this repository, and they ship differently:

1. a schema or specification change merged to `main`;
2. a new FDS **spec release**;
3. the npm package `@vitness/fds-transformer`;
4. the npm package `@vitness/fds-skill`.

Each flow below says what is automatic, what needs a human, what proves the step
worked, and what cannot be undone.

**This document states no version numbers.** Not the current release, not how
many schemas exist, not what any package is at. Every one of those would be a
second copy of a fact that already lives in a generated file, and a stale copy in
a runbook is worse than no runbook. Where you need a number, the flow tells you
which file to read or which command to run.

---

## Where the facts live

| Question | Read |
|---|---|
| What is published, at what version, current / superseded / withdrawn | `specification/releases.json` (generated) |
| What each release *names* | `specification/releases.json` → `releases` |
| Which schema bytes are frozen, with hashes | `specification/schemas/.integrity.json` (generated) |
| How versioning works, in prose, normatively | `specification/discovery.md` |
| What each gate guards and why | the doc comment at the top of each `scripts/check-*.mjs` |
| What is generated, and from what | `scripts/build-schemas.mjs` |
| Which pages are byte-mirrors of a source | `DOC_PAIRS` in `scripts/check-doc-mirrors.mjs` |
| Author-facing rules for schemas and markers | `specification/governance/CONTRIBUTING.md` |

Anything under `specification/schemas/**` is **generated**. Authoring happens in
`specification/schema-sources/`. The `*.example.json` fixtures and the `README.md`
beside a generated schema are the exceptions — those are hand-written.

---

## Before you start anything

### Match CI's Node major

`npm run verify` runs everything CI runs, locally. Its promise — green here means
green there — is void when your Node major differs from CI's, because some checks
compare recorded output byte for byte and V8 rewords its own error messages
between majors. That has already produced a green local run and a red CI run.

`verify` warns about it. Take the warning seriously rather than reasoning past it.

```bash
node -v
grep -m1 'node-version:' .github/workflows/ci.yml
```

Switch to CI's major before you trust a local run.

### Work from a clean checkout

```bash
git fetch origin
git checkout -b <descriptive-branch-name> origin/main
```

No ticket numbers in the branch name. Nothing in this repository — code,
comments, commit messages, branch names, pull request text — refers to internal
tracking of any kind. It is public.

### Know what `main` requires

`main` is governed by a repository ruleset, not classic branch protection. Read
it rather than trusting this table:

```bash
gh api repos/vitness-me/fds-spec-website/rules/branches/main
```

At the time of writing it enforces:

- **pull request required** — no direct pushes;
- **0 required approvals**, but **all review threads must be resolved**;
- **merge methods: rebase and squash only** — no merge commits;
- **linear history**, no force-push, no branch deletion;
- **three required status checks, strict** (your branch must be up to date with
  `main` before merging):
  - `Transformer — typecheck, test, build`
  - `Schemas — validate examples`
  - `Website — build`

Two consequences worth internalising. First, **nobody has to approve your pull
request** — the gates are the reviewer, which is why breaking a gate on purpose
before trusting it is the house rule. Second, `Published URLs` is deliberately
**not** a required check: it verifies deployment, not the change in hand, and a
CDN hiccup must not block a documentation edit.

---

## The four irreversible acts

Everything else in this document can be undone with another commit.

1. **Freezing a schema's bytes.** Once `frozen: true` is recorded for a published
   version in `specification/schemas/.integrity.json` and that commit reaches
   `main`, those bytes are the permanent answer at that URL. Changing them means
   publishing a *new version directory* beside it.
2. **A released URL that consumers have begun to resolve.** Deployment is the
   moment a `$id` becomes a promise someone else is relying on. You cannot know
   who fetched it.
3. **Publishing to npm.** A version number, once published, can never be reused
   for different bytes. Unpublishing is narrow, time-boxed and not a plan.
4. **Withdrawing a published version.** Removing bytes that a release still names
   turns every pinned client's fetch into a 404. `exercise` and `equipment`
   1.0.0 were withdrawn early, before anyone depended on them; that is the
   exception, and the rule is the opposite — see *A superseded version stays
   served*, below.

Pushing a tag is *not* on this list — a tag can be deleted. What the tag triggers
is on the list, and it happens within about a minute.

---

## What a release is

Read this before flow 2. Getting it wrong is the single most expensive mistake
made in this repository.

**A release names a set of entity versions.** It is not a version that every
entity shares. Entities version independently: an entity only gets a new version
directory when that entity itself changes. Gaining an entity is also a new
release, even when nothing existing moved, because a release names the *set*.

**A superseded version stays served.** If an older release names it, a client
pinned to that release must keep resolving. Superseded is not withdrawn:
withdrawn versions were removed rather than frozen, they 404, and nothing in the
repository may point at one.

You can see all of this rather than take it on faith. From a checkout, with
nothing installed:

```bash
node -e '
  const m = JSON.parse(require("fs").readFileSync("specification/releases.json", "utf8"));
  const release = process.argv[1] ?? m.currentRelease;
  const named = m.releases[release];
  if (!named) {
    console.error(`No release ${release}. Known: ${Object.keys(m.releases).join(", ")}`);
    process.exit(1);
  }
  console.log(`release ${release}${release === m.currentRelease ? "  (current)" : ""}`);
  for (const [name, version] of Object.entries({ ...named.entities, ...named.libraries })) {
    const v = m.schemas[name].versions[version];
    console.log(`  ${name.padEnd(16)} ${version.padEnd(7)} ${v.status.padEnd(11)} ${v.path ?? "(withdrawn — not served)"}`);
  }
' 1.2.0
```

Pass a release name, or none for the current one. Run it against an old release
and a current one and compare: most entity versions do not move, and at least one
older release names a version whose status is `superseded` and whose path is
still served.

**Prescription is a library, not an entity.** Its schema root validates nothing by
construction. It never appears in a provider's `supported_entities`, and a
prescription snippet is validated against a named `$defs` definition rather than
against the root. `scripts/list-entity-schemas.mjs` excludes it for that reason,
and so does the transformer's bundling.

**The transformer mapping schema is not part of any release.** It configures a
tool. It versions on its own and no FDS release names it.

---

## Flow 1 — a schema or specification change merged to `main`

Use this for: editing an RFC, changing an authoring source, adding an example,
editing a page that mirrors a specification source.

### 1. Edit the source, never the generated file

| If you are changing… | Edit… |
|---|---|
| a schema | `specification/schema-sources/<entity>/v<version>/…` |
| a shared definition | the `common` schema under `specification/schema-sources/common/` — authoring-only, never published |
| an RFC | `specification/rfc/rfc-XXX-….md` |
| a mirrored concept page | the source in `specification/`, per `DOC_PAIRS` |

`specification/schemas/**`, `specification/releases.json`,
`packages/fds-transformer/src/schemas/bundled/**` and
`packages/fds-transformer/src/schemas/releases.generated.ts` are **generated**.
Editing one by hand is caught, and the failure names the fix.

If a schema you touched is already frozen, **stop**: you are not making a change,
you are cutting a release. Go to flow 2.

### 2. Regenerate

```bash
npm run build:schemas
```

One run writes the published schemas, `.integrity.json`, `releases.json`, the
transformer's per-release offline bundles and its generated release map — from a
single traversal, so none of them can describe a tree the others do not. On an
unchanged tree it is byte-identical and `git status` stays empty.

### 3. Regenerate any mirrored page

A website page that mirrors a specification source **is** that source, verbatim,
after the Docusaurus frontmatter block. Every RFC under `specification/rfc/` is
mirrored to `website/docs/specifications/` automatically by filename; the
concept and governance pages are mirrored per `DOC_PAIRS`.

There is no exemption list. Editing the page instead of the source, or editing
the source and forgetting the page, both fail:

```
website/docs/core-concepts/discovery.md has drifted from specification/discovery.md.
    A page is its frontmatter followed by the source, verbatim. Rebuild it from the source.
```

Rebuild the page by copying the source under the page's existing frontmatter.

### 4. Prove it locally

```bash
npm run verify
```

That is the whole of CI. To iterate faster, run one job:

```bash
npm run verify schemas      # or: transformer | website
```

To validate a single document against the current version of an entity — the
form that resolves from a checkout with **no `node_modules`**, which is the
reader's situation:

```bash
entity=workout   # any name under "schemas" in specification/releases.json

# The published path of that entity's CURRENT version, read from the manifest.
# Never build this path by hand out of a release name — see Traps.
schema=specification/schemas/$(node -e '
  const m = JSON.parse(require("fs").readFileSync("specification/releases.json", "utf8"));
  const e = m.schemas[process.argv[1]];
  if (!e) { console.error(`no schema named ${process.argv[1]}`); process.exit(1); }
  process.stdout.write(e.versions[e.current].path);
' "$entity")

# Your document goes after -d. Defaulted here to one the repository publishes,
# so the block runs as written.
document=$(ls "$(dirname "$schema")"/*.example*.json | head -1)

npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s "$schema" -d "$document"
```

`npx ajv …` on its own does **not** work: `ajv` is the validator library and
publishes no executable, so from a cold cache npx cannot resolve it. Both
packages must be named with `--package`, including the one `-c` loads. This is
enforced — `check:commands` executes every fenced ajv command in the repository,
including the one above, from a scratch directory with no `node_modules`.

### 5. Open the pull request — the human gate

Commit split by concern, each commit verifiable on its own; the project
rebase-merges. Push the branch and open the pull request.

CI runs on **any** pull request, not only those targeting `main`, and on pushes
to `main`, and on manual dispatch.

**Proof:** the three required checks are green, and the branch is up to date with
`main` (the status-check policy is strict).

### 6. Merge — and what happens on its own

Merging is the human gate. Everything after it is automatic:

1. **CI runs on `main`.**
2. **Deploy** starts when that CI run *completes* — `workflow_run`, not a push.
   It does not deploy the commit that triggered it. It resolves, from the API at
   deploy time, **the newest commit on `main` that has a successful CI run**, and
   builds that. So a red `main` stops deploying entirely, and the deployed commit
   can legitimately lag the tip by a burst of merges. There is no override.
3. **Published URLs** runs about a minute after a successful deploy, and again
   every Monday morning. It fetches the deployed `releases.json`, then every
   schema in `.integrity.json`, and asserts each serves JSON, carries a `$id`
   equal to the URL it came from, and hashes to the frozen value. A failure files
   or comments on a GitHub issue labelled `published-urls`.

**Proof:** the deploy job's `gate` step logs `deploying <sha> <subject>` — check
that it is your commit. Then the `Published URLs` run is green. You can run that
last check yourself at any time, and it needs no local install:

```bash
npm run check:published
```

**Irreversible from here:** the bytes are being served. If the change touched a
frozen schema you should not have got this far; if it published a *new* version,
that URL is now a promise.

---

## Flow 2 — cutting a new spec release

A release is cut in **one pull request** that changes `scripts/build-schemas.mjs`,
the generated artefacts it produces, the changelog and any document whose version
claims move. There is no release branch and no tag: an FDS release is a name in a
generated manifest, not a git object.

### 1. Decide what the release names

Write down, before touching anything: which entities move, which stay, whether an
entity is being added. If nothing existing moves and one entity is added, that is
still a new release.

### 2. Author the new schema version

Create a **new version directory** under `specification/schema-sources/`. Never
edit a frozen version in place. Keep the superseded version's authoring source
where it is — it costs nothing and it is the record of what those bytes were.

### 3. Edit `scripts/build-schemas.mjs`

Four declarations, in this order of thought:

- **`ENTITIES`** — point the entity at its new path, or add a new entry. This
  list is keyed by entity name, so only one version of an entity can be
  *rendered*; that is the mechanical reason for the next step.
- **`UNGENERATED`** — add the *previous* version's published path if it stays
  served. Entries here are tracked, hashed and freezable, but never re-rendered.
  This is what keeps a superseded URL alive for clients pinned to an older
  release.
- **`RELEASES`** — add the new release, naming a version for **every** entity and
  library in it. This is history and is therefore declared, not derived: nothing
  on disk remembers what an old release contained. The newest entry is the
  exception that keeps the rest honest — the build fails unless it names exactly
  the current version of every entity in `ENTITIES`.
- **`CURRENT_RELEASE`** — bump to the new release. The build refuses a
  `currentRelease` that is not the newest release in `RELEASES`.

Touch **`WITHDRAWN`** only if you are actually unpublishing bytes. Read *The four
irreversible acts* again first. The build rejects a withdrawn entry whose file is
still on disk, and rejects a still-referenced version that has been deleted
without being recorded.

### 4. Rebuild

```bash
npm run build:schemas
```

This writes the new published schema, updates `releases.json` and
`.integrity.json`, and generates the transformer's bundles for the new release
plus its release map. The transformer's `DEFAULT_SCHEMA_VERSION` is derived from
that generated map — it is not hand-edited, and bumping the release moves it.

### 5. Freeze — the human gate, and the irreversible one

A newly published schema is recorded **unfrozen**, so it can be iterated on
before it ships. Freezing is a deliberate one-line edit to
`specification/schemas/.integrity.json`, flipping the new version's `frozen` to
`true`. It is meant to be visible in review; that visibility is the entire gate.

Do it last, once you are sure the bytes are final.

Afterwards, an edit to that version's source fails at build time:

```
FROZEN     <entity>/v<version>/<entity>.schema.json — content changed but this version is frozen.
           Publish a new version directory, or unfreeze deliberately in specification/schemas/.integrity.json.
```

and a hand-edit to the published file fails the check:

```
DRIFT      specification/schemas/<entity>/v<version>/<entity>.schema.json — published file does not match its authoring source
INTEGRITY  <entity>/v<version>/<entity>.schema.json — sha256 <actual>… does not match recorded <recorded>… (frozen)
```

(The paths in these transcripts are elided on purpose. This document is scanned
by `check:versions` exactly like every other, so quoting a real superseded or
withdrawn path here would need a pin or would simply be an error — which is the
rule the next section is about.)

Unfreezing is possible and is sometimes right — before the release is merged. It
is never right after deployment.

### 6. Make the documents catch up

Cutting a release deliberately breaks every document that states a version fact,
until it is updated. That is the design, not a defect.

- Any prose naming the current release must name the new one.
- A reference to a version that is now **superseded** needs a pin marker in the
  same file, naming the reference exactly as it resolves and saying why that
  version and not the current one. Without one:

  ```
  references <entity> <version>, which is superseded. The current version is <current>.
      Point at the current version, or say why this one:
          fds:pin <entity>/v<version>/<entity>.schema.json — the reason this version and not the current one
  ```

- A reference to a **withdrawn** version is an unconditional error. No pin
  excuses it:

  ```
  references <entity>/v<version>/<entity>.schema.json, a withdrawn version.
      <entity> <version> was named by a release and is no longer served; the URL 404s.
      Point at <entity> <current>. A pin cannot excuse this — there are no bytes behind it.
  ```

- Marked counts must still be true of the tree, and a document marked as covering
  a whole set must still list all of it — which now includes the thing you just
  added. `SCHEMAS.md` and the release table in `specification/discovery.md` are
  both such documents. Edit the **source**, then rebuild any mirrored page.
- **A newly published schema needs a page.** `check:mirrors` reads the published
  set out of `specification/schemas/.integrity.json` and requires
  `website/docs/schemas/<entity>.md` plus a `sidebars.ts` entry for each one:

  ```
  <path> is published with no page at website/docs/schemas/<entity>.md.
      A frozen URL the documentation never mentions is not discoverable.
  ```

- A new RFC is mirrored to `website/docs/specifications/` by filename, and the
  page must exist, carry frontmatter, and appear in `website/sidebars.ts`.
- The changelog gets an entry. See `specification/governance/CONTRIBUTING.md` for
  the marker rules; do not put count markers in the changelog.

Marker syntax and scope are documented for authors in
`specification/governance/CONTRIBUTING.md` — read it rather than copying a marker
you found somewhere.

### 7. Prove it, then merge

```bash
npm run verify
```

Then flow 1 from step 5: pull request, three green checks, merge, automatic
deploy, automatic `Published URLs`.

**Proof that the release is really out**, once the deploy has landed:

```bash
npm run check:published
```

It fetches the deployed `releases.json`, then every URL in `.integrity.json`, and
compares each against the hash the repository froze — so it proves both that the
new version is being served and that every superseded one still is. To eyeball a
single URL, resolve its path from the manifest first — never from a release name:

```bash
entity=workout

node -e '
  const m = JSON.parse(require("fs").readFileSync("specification/releases.json", "utf8"));
  const e = m.schemas[process.argv[1]];
  for (const [version, v] of Object.entries(e.versions)) {
    if (v.path) console.log(`https://spec.vitness.me/schemas/${v.path}`);
    else console.log(`# ${process.argv[1]} ${version} is ${v.status} — no URL`);
  }
' "$entity" | grep '^https' | xargs -n1 curl -s -o /dev/null -w '%{http_code}  %{url_effective}\n'
```

**Expect a window:** until the deploy lands, the repository and the site
legitimately disagree. `check:published` deliberately does not compare the
deployed manifest to your checkout for exactly that reason, and the automatic
post-deploy run waits before checking and retries twice before failing.

---

## Flow 3 — publishing `@vitness/fds-transformer`

### Order matters

If this release of the package is meant to target a new FDS release, **cut the
spec release first and let it merge to `main`** (flow 2). The package's bundled
schemas, its release map and its default target release are all generated from
`specification/releases.json`, and the publish gate opens the tarball and asks
the packed build to resolve *every* release the manifest names with `fetch`
disabled. A package built from a commit whose manifest and bundles disagree fails
there.

### 1. Bump the version on `main`

The package version lives in `packages/fds-transformer/package.json`. Bump it,
update `packages/fds-transformer/CHANGELOG.md`, and land it through a normal pull
request (flow 1). Note that a new FDS release moves the transformer's default
target release, which is a behaviour change and deserves at least a minor bump.

### 2. Dry run — the only rehearsal available

```bash
gh workflow run publish-transformer.yml -f dry_run=true
```

This runs the full workflow and skips only `npm publish`. Every gate below still
executes — including the credential check, which performs the same OIDC token
exchange the real publish would and fails if it comes back empty. That last part
is new, and it is the whole reason this rehearsal is worth running: `npm publish`
was the only step that authenticated, `dry_run: true` skipped it, and so a green
dry run said nothing whatever about whether a publish could. Five of them could
not.

> **`-f dry_run=true` is not optional.** The input defaults to `false`, so
> dispatching this workflow without it **publishes**. Worse, the step that checks
> the tag version against `package.json` only runs on a tag push, so a dispatch
> publishes whatever `package.json` currently says with nothing cross-checking
> it. Both existing releases of this package were published exactly that way.
> Type the flag.

### 3. Tag and push — the human gate

```bash
git fetch origin
git checkout main
git pull --ff-only
git tag fds-transformer@<version>          # must equal package.json exactly

# Nothing else will check this. Both lines must print something.
git branch --contains fds-transformer@<version> --list main
node -p "require('./packages/fds-transformer/package.json').version"

git push origin fds-transformer@<version>
```

**The tag push is the entire human gate.** The `npm` deployment environment has
no required reviewers and no branch policy, so nothing stands between the push
and the registry except the workflow's own checks. There is no tag ruleset
either: a tag on a commit that is *not* on `main` will publish just as happily,
and nothing in the workflow looks at ancestry — which is why the two lines above
are in this block.

### What the workflow does on its own

Two jobs. The first installs from the lockfile with `npm ci`, typechecks, tests
and builds. The second installs the same locked tree, rebuilds, then:

- runs `scripts/check-packages.mjs --self-test` followed by the real check, which
  opens the tarball and verifies the licence text is present, that every declared
  entry point resolves and *loads*, that no shipped document points at a path
  only this checkout has, and that the packed build resolves every release
  offline;
- lists the tarball and asserts the entry points and the mapping schema are in
  it;
- for a tag push, extracts the version from the tag and **fails if it does not
  match `package.json`**;
- proves it can authenticate before it writes: `scripts/check-publish-auth.mjs`
  runs `npm publish --dry-run` twice — once with the runner's id-token request
  variables removed, which must leave npm reporting itself logged out, and once
  as the job really is, which must not. The pair establishes that the only
  credential in play is the one this run mints, and it runs on the dry-run path
  as well;
- publishes with `--access public --provenance`.

Note what it does **not** run: the schema, mirror, version and document gates
from CI. Publish from a commit that is on `main` and green, and you get them; tag
something else and you do not.

**Proof:**

```bash
npm view @vitness/fds-transformer version
npm view @vitness/fds-transformer dist.attestations
```

The second should show a `provenance` predicate. A published version with no
attestation did not come from this workflow.

**Irreversible:** immediately. That version number is spent.

---

## Flow 4 — publishing `@vitness/fds-skill`

Same shape, different gates, and the difference is the point: the skill is a
knowledge base an assistant answers from, so a wrong field name in it does not
raise an error — it produces confident, specific, invalid output that the person
asking cannot distinguish from the truth. Publishing freezes that into a release.

### 1. Bump the version on `main`

`packages/fds-skill/package.json`, landed through a normal pull request.

The package **must** have a `packages/fds-skill/package-lock.json`. Publishing
installs with `npm ci` so the published tree is the checked tree. If it is ever
missing, the workflow stops before `setup-node` with the command that fixes it:

```bash
cd packages/fds-skill && npm install --package-lock-only
```

### 2. Dry run

```bash
gh workflow run publish-skill.yml -f dry_run=true
```

The same warning as flow 3: the input defaults to `false`, and a dispatch skips
the tag-versus-`package.json` check because that step only runs on a tag push.

### 3. Tag and push — the human gate

```bash
git fetch origin
git checkout main
git pull --ff-only
git tag fds-skill@<version>                # must equal package.json exactly

# Nothing else will check this. Both lines must print something.
git branch --contains fds-skill@<version> --list main
node -p "require('./packages/fds-skill/package.json').version"

git push origin fds-skill@<version>
```

The same caveats as flow 3: no environment reviewers, no tag ruleset, no check
that the tagged commit is on `main`.

### What the workflow does on its own

A `gates` job that runs, against the repository:

- `npm run check:skill` — every field name the knowledge base uses exists
  somewhere in the standard, and every schema URL it quotes resolves to a
  published file;
- `npm run check:versions` — every version fact in the tree matches the release
  manifest. Publishing is exactly when a stale version claim stops being fixable.

Then a `publish` job that requires the lockfile, installs with `npm ci`, runs the
tarball checks (`check-packages`, plus an explicit assertion that `SKILL.md`, the
`knowledge/` files and the `prompts/` files are in the tarball), matches the tag
against `package.json`, proves it can authenticate (`check-publish-auth`, as in
flow 3 — on the dry-run path too), and publishes with provenance.

**Proof:**

```bash
npm view @vitness/fds-skill version
npm view @vitness/fds-skill dist.attestations
```

**Irreversible:** immediately.

---

## Traps

Each of these has already cost someone here.

### Substituting a release name into a schema URL path

A release name is not a path segment. Building
`…/schemas/<entity>/v<release>/<entity>.schema.json` requests something that was
never published. Verified against the live site:

```
https://spec.vitness.me/schemas/workout/v<a release name>/workout.schema.json   404
https://spec.vitness.me/schemas/workout/v<its current version>/…               200
https://spec.vitness.me/schemas/workout/v<a superseded version>/…              200
https://spec.vitness.me/schemas/exercises/v<a withdrawn version>/…             404
```

Resolve the release to its entity versions first — from
`specification/releases.json` in the repository, or from
`https://spec.vitness.me/releases.json` at runtime, or from the provider's own
`entity_versions` in its discovery document. Never guess.

### Hand-editing a generated file

`specification/schemas/**`, `specification/releases.json`,
`specification/schemas/.integrity.json`,
`packages/fds-transformer/src/schemas/bundled/**` and
`packages/fds-transformer/src/schemas/releases.generated.ts` all come out of
`npm run build:schemas`. Edit the source and rebuild. The `frozen` flag in
`.integrity.json` is the one deliberate hand-edit, and it is a flag, not content.

### Editing a mirrored page instead of its source

The page is the source, verbatim, after the frontmatter. Edit
`specification/…`, then regenerate the page. `check:mirrors` compares byte for
byte and there are no exemptions. A normative rule changed on the page and not in
the source means the published copy is right and the specification is wrong — or
the reverse, and nobody can tell which.

### Trusting a local green run on the wrong Node

See *Before you start anything*. It has happened.

### Assuming a push deploys

It does not. Deployment is triggered by CI *completing*, and it deploys the
newest commit on `main` with a green CI run — which may not be yours yet, and
will be nothing at all while `main` is red.

---

## What this document cannot tell you

Stated rather than papered over.

- **npm authentication.** Neither publish workflow references a secret. There is
  a repository secret named `NPM_TOKEN` and nothing uses it. Publishing therefore
  depends on trusted publishing being configured for these packages on
  npmjs.org — settings that live outside this repository and cannot be read from
  it. If a publish ever fails with an authentication error, the fix is on
  npmjs.org, not here. What the repository can do, and now does, is say so before
  the write instead of after it: the credential check fails with the four fields
  — organization or user, repository, workflow filename, environment — read off
  the run itself, to be compared against the trusted publisher on npmjs.org.
- **Who may push a tag.** Repository collaborator permissions are not visible in
  the tree. No ruleset restricts tags.
- **How long a deploy takes to reach every edge.** `Published URLs` waits before
  checking for exactly this reason, and retries twice more before failing. If it
  is red once and green on a re-run, the deployment was slow; if it is red three
  times identically, something is actually wrong, and the run log says which of
  the three possibilities it is.
- **Whether an old release still has consumers.** Nothing here measures that.
  Treat every published URL as though it does.
- **Rolling back a release.** There is no procedure, because there is no
  mechanism. A published, frozen, deployed URL is not withdrawn casually — see
  *The four irreversible acts*. The forward fix is a new version and a new
  release.
- **Whether the prose below the commands is still true.** Two things here are
  gated: `check:commands` executes the ajv block from a checkout with nothing
  installed, and `check:versions` reads this file for version claims like any
  other. Nothing compares the *descriptions* of the workflows and the ruleset
  against the workflows and the ruleset. Both are quoted with the command that
  re-derives them — run those rather than trusting the paragraph. If you change a
  workflow, change this document in the same pull request; that is a convention,
  not a gate.
