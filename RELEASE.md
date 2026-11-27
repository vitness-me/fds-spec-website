# Release runbook

Three things get shipped from this repository, and they ship differently:

1. a schema or specification change merged to `main`;
2. a new FDS **spec release**;
3. the npm packages `@vitness/fds-transformer`, `@vitness/fds-skill` and
   `@vitness/fds-encoder`.

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

Merging a version bump is how act 3 happens: the publish workflow runs on the
push to `main` and publishes within minutes, with no further step.

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

Read what the rebuild produced before freezing anything: see
[Reviewing a schema change](#reviewing-a-schema-change).

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

## Flow 3 — publishing an npm package

`@vitness/fds-transformer`, `@vitness/fds-skill` and `@vitness/fds-encoder` are
published by `.github/workflows/publish.yml`, automatically, on every push to
`main`. A package is published when the version in its `package.json` is not on
npm yet. Bumping the version is the release; there is no tag to push.

### Order matters

If this release of the transformer is meant to target a new FDS release, **cut
the spec release first and let it merge to `main`** (flow 2). The package's
bundled schemas, its release map and its default target release are all
generated from `specification/releases.json`, and the publish gate opens the
tarball and asks the packed build to resolve *every* release the manifest names
with `fetch` disabled. A package built from a commit whose manifest and bundles
disagree fails there. The skill documents a release, so it follows the same
order.

### 1. Bump the version — the human gate

In one pull request, for each package being released:

- bump `version` in `packages/<dir>/package.json`, and the two copies of it at
  the top of `packages/<dir>/package-lock.json`;
- move the `## [Unreleased]` entries of `packages/<dir>/CHANGELOG.md` under a new
  `## [<version>] - <date>` heading. That section becomes the GitHub release
  notes;
- update any document that quotes the package's version.

A new FDS release moves the transformer's default target release, which is a
behaviour change and deserves at least a minor bump. Land it through flow 1.
**Merging is the publish.** Nothing asks again.

### 2. Dry run — optional, and safe by default

```bash
gh workflow run publish.yml --ref <branch>
```

`dry_run` defaults to **true** for a dispatch, so this publishes nothing. From a
branch it runs the plan and every build gate below. The publish job, with the
credential check, runs from `main` only, because it runs in the `npm`
environment and that environment admits `main` alone. A dry run from `main`
also performs the real OIDC token exchange and stops before the write, so it
proves the credential as well as the contents. A dispatch with `dry_run`
unticked publishes, and only from `main`; from any other ref the plan job
stops it.

### What the workflow does on its own

Four jobs. Each package has its own leg in each, and one package failing stops
only that package.

1. **Plan** runs `check:versions` once, then `scripts/publish-plan.mjs`, which
   decides each package on its own. For every package under `packages/` that
   is not `private`, it asks npm once whether the version in its
   `package.json` exists. A version that is not on npm must be releasable: a
   release rather than a pre-release (the workflow publishes to `latest` only),
   higher than npm's `latest`, a `## [<version>]` section in its CHANGELOG, and
   no existing tag `<dir>@<version>`. An unreleasable package is refused, and
   so is one npm gave an error other than a 404 for. The plan job then fails,
   and every other package still goes ahead. From `main` the plan also checks
   that the `npm` environment exists and admits `main` only, and refuses every
   package if it does not, saying how to set it.
2. **Build**, one leg per package, on CI's Node: `npm ci` from the lockfile,
   typecheck and tests where the package has them, `check:skill` for the skill,
   and `scripts/check-packages.mjs` (licence text, every `files` entry and the
   README in the tarball, entry points that resolve and load, no checkout-only
   paths, no source map naming a build-machine path, the transformer resolving
   every release offline). Then `npm pack`, once. The tarball is kept as an
   artifact.
3. **Publish**, one leg per package, on a **GitHub-hosted** runner in the
   `npm` environment, holding only `id-token: write` and `contents: read`. A
   leg whose package has no tarball stops: its build leg failed. It upgrades
   npm to a pinned version and asks npm again whether the version is there; if
   it is, it skips the publish. Otherwise it runs
   `scripts/check-publish-auth.mjs` (the runner is GitHub-hosted, no
   configured credential exists, and the OIDC exchange returns one) and
   publishes **the tarball the build job checked**. Trusted publishing adds
   the provenance attestation itself.
4. **Release**, one leg per package its publish leg published, holding
   `contents: write`: the tag `<dir>@<version>` on the commit it published from,
   and a GitHub release with the CHANGELOG section as its notes. A release that
   already exists is left alone.

Note what it does **not** run: the schema, mirror and document gates from CI.
`main` only takes a commit whose required checks passed, so a push to `main`
has them.

A dispatch never cancels or replaces a pending push run: pushes and dispatches
queue in separate concurrency groups, and neither cancels a run in progress.

**Proof:**

```bash
npm view @vitness/<package> version
npm view @vitness/<package> dist.attestations
gh release view <dir>@<version>
```

The second should show a `provenance` predicate. A published version with no
attestation did not come from this workflow.

**Irreversible:** immediately. That version number is spent.

### If a publish fails

Re-run the run, from its page on GitHub: **Re-run failed jobs** or **Re-run all
jobs**. A re-run heals itself. A version already on npm is not published
again, and still gets its missing tag and release, on the same commit.

A version that never reached npm is also retried by the next push to `main`,
or by a dispatch from `main` with `dry_run` unticked. A credential failure says
which of the cases below it is; fix it on npmjs.com and re-run. A later push
does not complete another commit's missing release; it warns, and the fix is
to re-run the run that published.

### Credentials on npmjs.com

The workflow references no secret. Every package authenticates by **trusted
publishing**: npm exchanges the run's GitHub OIDC token for a short-lived
publish credential, if the package names this workflow as its trusted
publisher. That setting lives on npmjs.com, not in this repository, and only a
package owner can change it. npm sets it up from an existing package's
settings, so a package's **first** version is published by hand. See *First
publish of a new package*.

What npm matches, case-sensitive, exactly:

| Field | Value |
|---|---|
| Publisher | GitHub Actions |
| Organization or user | `vitness-me` |
| Repository | `fds-spec-website` |
| Workflow filename | `publish.yml` (the filename only) |
| Environment | `npm` |

The run must also be on a GitHub-hosted runner. GitHub marks every runner it
does not host, Blacksmith's included, `self-hosted` in the OIDC token, and npm
refuses those whatever the settings say.

**The `npm` environment.** The publish job runs in the GitHub environment
`npm`, and npm's trusted publisher names it, so only a job in that environment
can publish. An owner sets it in the repository settings, **Settings** →
**Environments** → `npm` (**New environment** if it does not exist) →
**Deployment branches and tags** → **Selected branches and tags** → one branch
rule, `main`. Or:

```bash
gh api -X PUT repos/vitness-me/fds-spec-website/environments/npm \
  -F 'deployment_branch_policy[protected_branches]=false' \
  -F 'deployment_branch_policy[custom_branch_policies]=true'
gh api -X POST repos/vitness-me/fds-spec-website/environments/npm/deployment-branch-policies \
  -f name=main -f type=branch
GITHUB_REPOSITORY=vitness-me/fds-spec-website node scripts/publish-plan.mjs --environment npm
```

The last line is the plan's own check, and should print `ok`. The plan job
keeps its own "only `main` publishes" guard as well.

**A new trusted publisher expires.** npm drops a new trusted-publisher
configuration that has not completed a publish within **two days**, and an
expired one can be neither used nor edited. Add it just before the merge that
publishes, not earlier.

When the credential is missing, the publish leg fails before the write, naming
the case: a self-hosted runner; a package that is not on npm yet; or an exchange
that returned nothing, with the four values this run presented to compare
against the table. It never reaches the registry's 404.

### First publish of a new package

Trusted publishing cannot create a package. An owner publishes a placeholder
`0.0.1` by hand so the package exists, and the merge publishes the real first
release through the workflow, with provenance, together with any other package
whose version it bumps. The commands below are for `@vitness/fds-encoder`
(directory `fds-encoder`); for another package, substitute its name and
directory.

**Owner checklist, in this order.**

1. **Limit the `npm` environment to `main`.** Any time before the merge, as in
   *The `npm` environment* above.

2. **Publish the placeholder `@vitness/fds-encoder@0.0.1`.** From a clean
   checkout of the commit you are about to merge (the pull request's head),
   signed in to npm as an owner (`npm login`; `npm publish` asks for the
   two-factor code):

   ```bash
   git fetch origin
   git worktree add --detach /tmp/fds-encoder-placeholder <pull request head SHA>
   cd /tmp/fds-encoder-placeholder/packages/fds-encoder
   npm ci
   npm run typecheck && npm run test:run
   npm version 0.0.1 --no-git-tag-version
   (cd ../.. && node scripts/check-packages.mjs fds-encoder)
   npm pack
   npm publish vitness-fds-encoder-0.0.1.tgz --access public
   npm view @vitness/fds-encoder versions
   ```

   `npm pack` runs the same `prepack` build the workflow does, and
   `check-packages.mjs` runs the same tarball gates. Only the version differs.
   This version has no provenance attestation, which only a CI publish adds.
   Then remove the checkout: `git worktree remove --force /tmp/fds-encoder-placeholder`.

3. **Add the trusted publisher to all three packages, right before merging.**
   On npmjs.com, open each package → **Settings** → **Trusted Publisher**,
   remove any entry that names another workflow file, and add one with the
   values in the table, environment `npm`. Or:

   ```bash
   for pkg in @vitness/fds-transformer @vitness/fds-skill @vitness/fds-encoder; do
     npx npm@11 trust list "$pkg"
     npx npm@11 trust github "$pkg" --repo vitness-me/fds-spec-website --file publish.yml --env npm --allow-publish
   done
   ```

   Remove an old entry with `npx npm@11 trust revoke <package> --id=<id from trust list>`.

4. **Merge the pull request.** The push run publishes the encoder's first
   release and every other package whose version is not on npm, tags each and
   creates its release. Check each with the **Proof** commands above.

5. **Deprecate the placeholder**, once the first release is on npm:

   ```bash
   npm deprecate @vitness/fds-encoder@0.0.1 "Placeholder that created the package. Install a later version."
   ```

6. **Optional, once a publish has gone through:** on each package,
   **Settings** → **Publishing access** → *Require two-factor authentication
   and disallow tokens*. Trusted publishing keeps working, and a leaked token
   cannot publish.

A later new package follows the same steps with its own name.

---

## Reviewing a schema change

`npm run schema-review` writes a static review site for the schema changes a
checkout makes against a base ref. It is a maintainer tool: the output is
gitignored and is not part of the published site.

```bash
npm run schema-review
node scripts/schema-review.mjs --repo ../other-checkout --base origin/main
```

The index lists each published schema the branch adds, edits or removes, with
its old and new version and its added, removed and changed properties, then the
`releases.json` change, other changed specification files, and the unchanged
schemas. Each changed schema gets a page with:

- the new, changed and removed fields and definitions, with type, pattern and
  description, read through local `$ref`s;
- every change by JSON path, a side-by-side diff, and both full sources;
- every example of that schema and every docs JSON block that declares it,
  validated with Ajv against both versions, searchable, with the structural key
  fields (`fxi`, `fxe`, `fxm`, `fxmg`) marked, and diffed against the base copy
  where one exists.

A new version directory is compared with the newest base version of the same
schema; an unfrozen schema edited in place is compared with its own base bytes.
The new side is the working tree, uncommitted edits included; `--head <ref>`
reads a commit instead and `--out <dir>` moves the output from `.schema-review/`.
The base ref is not fetched. Serve the output with any static server.

`node scripts/schema-review.mjs --self-test` checks the change summary against
a recorded schema pair.

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

- **npm authentication.** The publish workflow references no secret; it
  depends on trusted publishing being configured for each package on
  npmjs.com — settings that live outside this repository and cannot be read from
  it. *Credentials on npmjs.com*, in flow 3, says what they must be. What the
  repository can do, and does, is check before the write: the credential check
  fails with the case it found and the four values the run presented.
- **Who may merge to `main`.** Repository collaborator permissions are not
  visible in the tree, and merging a version bump publishes.
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
