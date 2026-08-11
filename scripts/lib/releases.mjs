/**
 * The release manifest, and the reference parsing that reads against it.
 *
 * `specification/releases.json` is written by `scripts/build-schemas.mjs` from
 * one traversal of the published tree. It is the only document that knows which
 * schemas exist, which versions of each are served, which of those is current,
 * and what each release names — so anything asking a version question should ask
 * it here rather than restating an answer.
 *
 * Two checks already need this and a third will: `check:versions` reads every
 * rule out of it, and the URL existence test `check:skill` performs by hand is
 * the same test stated more weakly. Kept here so the manifest is loaded, shaped
 * and interrogated in exactly one place.
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

export const MANIFEST_PATH = 'specification/releases.json';
export const SCHEMA_BASE = 'https://spec.vitness.me/';

/** The published tree, and the registry directory, relative to the repo root. */
export const PUBLISHED_DIRS = {
  schemas: 'specification/schemas',
  registries: 'specification/registries',
};

/**
 * The manifest as written, plus the indexes every caller ends up building.
 *
 * `byPath` answers "is this published, and as what" without walking the schemas
 * block again; `currentOf` answers "which version should documentation name".
 */
export async function loadManifest() {
  const manifest = JSON.parse(await readFile(join(ROOT, MANIFEST_PATH), 'utf8'));

  const byPath = new Map(); // published path -> { name, version, status, kind, $id }
  const currentOf = new Map(); // schema name -> current version
  const versionsOf = new Map(); // schema name -> Map(version -> entry)

  for (const [name, entry] of Object.entries(manifest.schemas ?? {})) {
    currentOf.set(name, entry.current);
    const versions = new Map();
    for (const [version, record] of Object.entries(entry.versions ?? {})) {
      versions.set(version, { ...record, name, version, kind: entry.kind });
      if (record.path) {
        byPath.set(record.path, { ...record, name, version, kind: entry.kind });
      }
    }
    versionsOf.set(name, versions);
  }

  return { manifest, byPath, currentOf, versionsOf };
}

/**
 * Structural checks a reader of the manifest is entitled to assume.
 *
 * `check:schemas` proves the file matches what the build would write, which is
 * the stronger statement — it would catch every one of these. This exists so
 * that a gate reading the manifest fails with "the manifest is malformed"
 * rather than with a confusing cascade of downstream errors, and so the
 * assumptions are written down where the reader can see them.
 */
export function manifestProblems({ manifest, versionsOf }) {
  const problems = [];
  const releases = manifest.releases ?? {};

  if (!manifest.currentRelease) {
    problems.push(`${MANIFEST_PATH}: no currentRelease.`);
  } else if (!releases[manifest.currentRelease]) {
    problems.push(
      `${MANIFEST_PATH}: currentRelease is ${manifest.currentRelease}, which is not one of ` +
        `the releases it lists (${Object.keys(releases).join(', ') || 'none'}).\n` +
        '    Run `npm run build:schemas` and commit the result.'
    );
  }

  for (const [release, named] of Object.entries(releases)) {
    for (const kind of ['entities', 'libraries']) {
      for (const [name, version] of Object.entries(named[kind] ?? {})) {
        if (!versionsOf.get(name)?.has(version)) {
          problems.push(
            `${MANIFEST_PATH}: release ${release} names ${name} ${version}, which the ` +
              'schemas block does not describe.\n' +
              '    Run `npm run build:schemas` and commit the result.'
          );
        }
      }
    }
  }

  for (const [name, versions] of versionsOf) {
    const current = [...versions.values()].filter((v) => v.status === 'current');
    if (current.length !== 1) {
      problems.push(
        `${MANIFEST_PATH}: ${name} has ${current.length} versions marked current; exactly one may be.`
      );
    }
  }

  return problems;
}

/**
 * Every reference to a published file that appears in a document.
 *
 * Four spellings, all of them things a reader can follow to the standard:
 *
 *   https://spec.vitness.me/schemas/workout/v1.1.0/workout.schema.json
 *   /schemas/workout/v1.1.0/workout.schema.json          a site-relative link
 *   specification/schemas/workout/v1.1.0/workout.schema.json   a repo path
 *   workout/v1.1.0/workout.schema.json                   a backticked path
 *
 * The fourth is what makes this worth doing: RFC-007 §6 named a superseded
 * version that way, in backticks, and a check that only understood absolute URLs
 * would not have seen it.
 *
 * All four normalise to one path relative to the published directory, so a URL
 * and a repository path naming the same file are one version claim rather than
 * two. Authoring sources under `specification/schema-sources/` normalise the
 * same way on purpose: a registry saying it governs `workout/v1.0.0`'s source is
 * making the same claim as a document linking that version, and it goes stale
 * for the same reason.
 *
 * What is deliberately *not* a reference is a path relative to something other
 * than the repository or the site. `"local": "./registries/muscles.json"` in a
 * transformer config names a file on the operator's disk; it says nothing about
 * what FDS publishes, and reading it as a claim would flag every worked example
 * of a local registry.
 *
 * Returned as {kind, path, version, text, line} — `kind` is `schemas` or
 * `registries`, `path` is relative to that published directory.
 */
export function schemaReferences(text) {
  const found = [];
  const lineOf = (index) => text.slice(0, index).split('\n').length;
  const FILE = '(?:[\\w.-]+\\/)*[\\w.-]+\\.json';

  const push = (match, kind, path) => {
    const start = match.index;
    const end = start + match[0].length;
    if (found.some((ref) => start < ref.end && end > ref.start)) return;
    found.push({ kind, path, text: match[0], start, end, line: lineOf(start) });
  };

  // Rooted at the site or at the repository. The leading `/` is required, and
  // must not be the `/` of a relative `./` or `../` path.
  const rooted = new RegExp(
    `(?<![\\w.-])(?:https:\\/\\/spec\\.vitness\\.me)?\\/(?:specification\\/)?` +
      `(schemas|schema-sources|registries)\\/(${FILE})`,
    'g'
  );
  for (const match of text.matchAll(rooted)) {
    push(match, match[1] === 'registries' ? 'registries' : 'schemas', match[2]);
  }

  // The same, written without a leading slash, as a repository path is in prose
  // and on a command line.
  const relative = new RegExp(
    `(?<![\\w.\\-\\/])specification\\/(schemas|schema-sources|registries)\\/(${FILE})`,
    'g'
  );
  for (const match of text.matchAll(relative)) {
    push(match, match[1] === 'registries' ? 'registries' : 'schemas', match[2]);
  }

  // A bare `<entity>/vX.Y.Z/<file>.json` with no root in front of it — the
  // backticked form. The version segment is what marks it as a published path
  // rather than any other relative filename.
  const bare = /(?<![\w.\-/])(?:[\w-]+\/)*v\d+\.\d+\.\d+\/[\w.-]+\.json/g;
  for (const match of text.matchAll(bare)) push(match, 'schemas', match[0]);

  for (const ref of found) {
    ref.version = /\/v(\d+\.\d+\.\d+)\//.exec(`/${ref.path}`)?.[1] ?? null;
  }
  return (
    found
      // The transformer's offline copies sit under `src/schemas/bundled/`. That
      // is a directory name collision, not a reference to anything served.
      .filter((ref) => !ref.path.startsWith('bundled/'))
      .sort((a, b) => a.start - b.start)
  );
}

/** Every file under a directory, relative to it, recursively. */
export async function filesUnder(dir) {
  const entries = await readdir(join(ROOT, dir), {
    recursive: true,
    withFileTypes: true,
  }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      join(entry.parentPath ?? entry.path, entry.name).slice(join(ROOT, dir).length + 1)
    )
    .sort();
}

export { ROOT };
