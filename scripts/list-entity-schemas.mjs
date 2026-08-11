#!/usr/bin/env node
/**
 * Every entity schema examples must be validated against, one path per line.
 *
 * CI and `scripts/ci-local.sh` both run Ajv over the published examples, and
 * both used to carry the same seven hard-coded schema paths. A hand-kept list of
 * what to check is a list that answers "nothing to do" for anything nobody
 * remembered to add: publishing an eighth entity would have left its examples
 * unvalidated in both places, silently, because a loop over a shorter list still
 * exits zero.
 *
 * `specification/releases.json` is generated from one traversal of the published
 * tree, so it already knows the answer. Printing it here means the two shell
 * loops consume the same list, from the same source, and gaining an entity
 * changes what CI validates with no edit to a workflow.
 *
 * What is printed, and what is not:
 *
 *   - `kind: entity` only. A *library* root validates nothing by construction —
 *     `prescription` has no document to validate against it, which is why its
 *     fixtures go through `check:prescription` against named definitions
 *     instead. `kind: tooling` describes a `mapping.json`, not FDS data.
 *   - Every served version, not only the current one. `workout/v1.0.0` is
 *     superseded and still published; it ships no examples today, so the loop
 *     finds none, but an example added beside it would be checked rather than
 *     ignored for being at an old version.
 *   - Withdrawn versions are absent. They have no bytes.
 *
 * Paths are printed relative to the repository root, so a caller can take the
 * schema and its directory from one string.
 *
 *   node scripts/list-entity-schemas.mjs
 */

import { PUBLISHED_DIRS, loadManifest, manifestProblems } from './lib/releases.mjs';

const loaded = await loadManifest();

// A malformed manifest must not be read as "there is nothing to validate".
const problems = manifestProblems(loaded);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

const paths = [];
for (const [, entry] of Object.entries(loaded.manifest.schemas ?? {})) {
  if (entry.kind !== 'entity') continue;
  for (const version of Object.values(entry.versions ?? {})) {
    if (version.status === 'withdrawn' || !version.path) continue;
    paths.push(`${PUBLISHED_DIRS.schemas}/${version.path}`);
  }
}

// An empty list is the failure this file exists to prevent, arriving by a
// different route. A caller looping over nothing cannot tell it apart from a
// caller looping over everything and finding it all correct.
if (!paths.length) {
  console.error(
    'No entity schemas found in specification/releases.json.\n' +
      '  Run `npm run build:schemas` — a manifest that publishes no entity describes a tree ' +
      'nobody has.'
  );
  process.exit(1);
}

console.log(paths.sort().join('\n'));
