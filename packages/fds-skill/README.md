# @vitness/fds-skill

The Fitness Data Standard as a knowledge pack: the documents an assistant reads
in order to map a source catalogue onto FDS and to judge whether the result is
valid.

## This package has no JavaScript

There is nothing to import. It ships markdown and JSON, and every file is
addressed by subpath:

```js
// Node resolves the subpath; you read the file yourself.
const url = import.meta.resolve('@vitness/fds-skill/knowledge/schemas.md');
const text = await readFile(new URL(url), 'utf8');
```

The subpaths are `@vitness/fds-skill/SKILL.md`, everything under
`@vitness/fds-skill/knowledge/`, `@vitness/fds-skill/prompts/` and
`@vitness/fds-skill/examples/`.

Importing the package itself fails, deliberately and immediately, with
`ERR_PACKAGE_PATH_NOT_EXPORTED`. It used to name a markdown file as its module
entry point, so it failed later and less clearly — with a `TypeError` about an
unknown file extension, from inside whatever was doing the importing.

## What it is not

Not a validator and not a transformer — those are `@vitness/fds-transformer`,
which ships the schemas bundled for offline use. Not the specification either:
the normative documents are the RFCs and the published schemas at
<https://spec.vitness.me>, and this package is a reading of them.

Nothing here models a person. The standard describes exercises, equipment,
muscles, workouts and programs — never an athlete, a bodyweight, a one-rep max
or a performed result — which is what makes these documents safe to cache,
mirror and diff.

## Versions

None are quoted here on purpose. Ask the generated manifest at
<https://spec.vitness.me/releases.json> for which schemas exist, which version
of each is served, which is current, and what each release names. A release
names a *set* of entity versions rather than one they all share, so substituting
a release name into a schema URL requests something that was never published.

## Licence

MIT. See LICENSE.
