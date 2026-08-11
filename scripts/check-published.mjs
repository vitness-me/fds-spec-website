#!/usr/bin/env node
/**
 * The published URLs resolve, serve JSON, and serve exactly what was frozen.
 *
 * A `$id` is a promise that the document can be fetched from that address. For
 * most of this repository's life that promise was false — spec.vitness.me sat
 * behind an access proxy answering every schema URL with 200 and an HTML
 * sign-in page, and nothing noticed, because the only consumer fell back to its
 * bundled copies without saying so.
 *
 * Three things are checked, and each catches a different failure:
 *
 *   - The URL answers 200 with a JSON content type. An interstitial fails here.
 *   - The document's own `$id` matches the URL it was served from. A file copied
 *     to a new version directory without its `$id` being updated fails here, and
 *     that is the mistake a version bump invites.
 *   - The bytes hash to what the integrity manifest recorded. A frozen URL that
 *     serves different bytes than the repository froze fails here — the whole
 *     point of freezing.
 *
 * The release manifest at `/releases.json` is checked too, on weaker terms and
 * for a reason given where it is done: it is generated rather than frozen, so
 * what matters is that a deployment has one, not that its bytes never move.
 *
 * Every published registry is checked on weaker terms again — reachable, JSON,
 * and the shape its filename promises — because a registry is meant to gain
 * entries between deployments. That set is read off disk rather than listed
 * here. This is where a consumer's URL is proved to exist: a unit test with a
 * mocked fetch proves a URL is *built*, and this project has now shipped three
 * defects that a mock called well-formed and reality called absent.
 *
 * This is NOT part of `npm run verify` and does not gate a pull request. It
 * needs the network and it checks *deployment* rather than the change in hand,
 * so a CDN hiccup must not block a documentation edit. It runs on a schedule and
 * on demand.
 *
 *   npm run check:published
 */

import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://spec.vitness.me';
const TIMEOUT_MS = 20_000;

const isJson = (contentType) => {
  const essence = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  return essence === 'application/json' || essence.endsWith('+json');
};

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  const body = Buffer.from(await response.arrayBuffer());
  return { response, body };
}

const problems = [];
let checked = 0;

// ── the release manifest ─────────────────────────────────────────────────────
//
// `/releases.json` is what turns a release name into the entity versions it
// names. `specification/discovery.md` warns that `spec_version` is not a path
// segment and that guessing produces URLs nobody published — and until this was
// served there was nothing a client could read instead, so the only way to
// follow that advice was to hard-code the answer.
//
// Deliberately not hashed and deliberately absent from `.integrity.json`. The
// manifest is generated and changes every release by design; freezing it would
// mean a release could not be published without breaking its own freeze. What
// is checked is that a deployment carries it at all, and that what answers is a
// manifest rather than a 404 page — nothing on the site links to it, so its
// absence is silent in a way a schema's would not be.
//
// It is also not compared against the repository's copy. This runs on a
// schedule against production, so between a merge and a deploy the two
// legitimately differ, and a check that cries stale during every deploy window
// teaches its reader to ignore it.
{
  const url = `${BASE}/releases.json`;
  try {
    const { response, body } = await get(url);
    if (!response.ok) {
      problems.push(
        `releases.json: answered ${response.status} ${response.statusText}.\n` +
          '      A consumer resolving a release name to entity versions has nothing to read.'
      );
    } else if (!isJson(response.headers.get('content-type') ?? '')) {
      problems.push(
        `releases.json: answered 200 with content-type ` +
          `"${response.headers.get('content-type') || 'none'}", not JSON.`
      );
    } else {
      const manifest = JSON.parse(body.toString('utf8'));
      const current = manifest.currentRelease;
      // Self-consistency only. Whether it agrees with this checkout is a
      // question about deploy timing, not about the deployment being sound.
      if (typeof current !== 'string') {
        problems.push('releases.json: no currentRelease — that is not a release manifest.');
      } else if (!manifest.releases?.[current]) {
        problems.push(
          `releases.json: currentRelease is ${current}, which it does not itself describe.`
        );
      } else if (!Object.keys(manifest.schemas ?? {}).length) {
        problems.push('releases.json: describes no schemas.');
      }
      checked += 1;
    }
  } catch (cause) {
    problems.push(
      `releases.json: unreachable — ${cause instanceof Error ? cause.message : cause}`
    );
  }
}

// ── published schemas ────────────────────────────────────────────────────────
//
// The integrity manifest is the list of what is published, so this cannot miss
// a schema the way a hand-kept list can.
const { schemas } = JSON.parse(
  await readFile(join(ROOT, 'specification/schemas/.integrity.json'), 'utf8')
);

for (const [path, { sha256 }] of Object.entries(schemas)) {
  const url = `${BASE}/schemas/${path}`;
  let result;
  try {
    result = await get(url);
  } catch (cause) {
    problems.push(`${path}: unreachable — ${cause instanceof Error ? cause.message : cause}`);
    continue;
  }

  const { response, body } = result;
  if (!response.ok) {
    problems.push(`${path}: answered ${response.status} ${response.statusText}`);
    continue;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!isJson(contentType)) {
    problems.push(
      `${path}: answered 200 with content-type "${contentType || 'none'}", not JSON. ` +
        'Reachable but not serving a schema — an interstitial or error page answers this way.'
    );
    continue;
  }

  let doc;
  try {
    doc = JSON.parse(body.toString('utf8'));
  } catch {
    problems.push(`${path}: declared JSON but the body does not parse.`);
    continue;
  }

  if (doc.$id !== url) {
    problems.push(`${path}: served from ${url} but its $id says ${doc.$id ?? '(absent)'}.`);
  }

  const served = createHash('sha256').update(body).digest('hex');
  if (served !== sha256) {
    problems.push(
      `${path}: the served bytes are not the frozen bytes.\n` +
        `      manifest ${sha256}\n` +
        `      served   ${served}\n` +
        '      Either the deployment is stale, or a frozen URL has changed.'
    );
  }

  checked += 1;
}

// ── registries ───────────────────────────────────────────────────────────────
//
// Not hashed — a registry is allowed to gain entries between deployments, and
// freezing one would defeat the point of an open classifier. Reachability,
// identity and shape are still promises.
//
// The list is read off disk rather than written out here, for the reason the
// schema loop gives: a hand-kept list cannot fail to be wrong eventually, and
// this one was. It named the four normative vocabularies and nothing else, so
// the three illustrative catalogs beside them — muscles, equipment,
// muscle-categories — were published and never checked. `@vitness/fds-transformer`
// meanwhile built `<name>.registry.json` for those three, a name that has never
// existed, and shipped it in every release: its unit test asserted the URL
// against a mocked fetch, which proves construction and cannot prove existence.
//
// `specification/registries/` is symlinked to `website/static/registries/`, so
// every file here is served at `/registries/<name>` and this loop is exactly the
// published set.
//
// This is one half of a chain, and it is worth naming which half. `check:versions`
// rule 8 proves offline, on every pull request, that a URL the *code* builds
// resolves to a file in this directory; this proves on a schedule that every
// file in this directory is actually served, and served as the kind of document
// its name promises. Neither half needs the network on the PR path, and together
// they say the thing a mock never could.
const REGISTRY_DIR = 'specification/registries';
const registryFiles = (await readdir(join(ROOT, REGISTRY_DIR)))
  .filter((name) => name.endsWith('.json'))
  .sort();

// A loop over an empty list exits zero and reports success — the exact shape of
// failure this whole file exists to refuse.
if (!registryFiles.length) {
  problems.push(
    `${REGISTRY_DIR}: no registries found to check.\n` +
      '      Either the directory moved or this check has quietly stopped checking anything.'
  );
}

for (const file of registryFiles) {
  const url = `${BASE}/registries/${file}`;
  // The filename is the contract. `<name>.registry.json` is a normative
  // vocabulary: an object that names itself, so a consumer can tell which
  // classifier it governs. `<name>.registry.example.json` is an illustrative
  // catalog: an array of entity documents, which is what a registry loader
  // deserialises. Checking both against the same rule would check neither —
  // and the array shape is the one a consumer's code indexes into.
  const isCatalog = file.endsWith('.registry.example.json');
  const name = file.replace(/\.registry(\.example)?\.json$/, '');

  try {
    const { response, body } = await get(url);
    if (!response.ok) {
      problems.push(`registries/${file}: answered ${response.status} ${response.statusText}`);
      continue;
    }
    if (!isJson(response.headers.get('content-type') ?? '')) {
      problems.push(`registries/${file}: answered 200 with a non-JSON content type.`);
      continue;
    }

    let doc;
    try {
      doc = JSON.parse(body.toString('utf8'));
    } catch {
      problems.push(`registries/${file}: declared JSON but the body does not parse.`);
      continue;
    }

    if (isCatalog) {
      if (!Array.isArray(doc)) {
        problems.push(
          `registries/${file}: an entity catalog is an array of entity documents; this ` +
            `served ${doc === null ? 'null' : typeof doc}.\n` +
            '      A loader indexes into it. Serving an object here fails at the first lookup, ' +
            'far from the URL.'
        );
      } else if (!doc.length) {
        problems.push(`registries/${file}: served an empty catalog — it demonstrates nothing.`);
      } else if (doc.some((entry) => !entry?.id || !entry?.canonical?.name)) {
        problems.push(
          `registries/${file}: an entry is missing \`id\` or \`canonical.name\`.\n` +
            '      Those two are what a registry lookup reads; without them the catalog ' +
            'demonstrates the wrong shape.'
        );
      }
    } else if (doc.registry !== name) {
      problems.push(`registries/${file}: the document calls itself "${doc.registry}".`);
    }

    checked += 1;
  } catch (cause) {
    problems.push(
      `registries/${file}: unreachable — ${cause instanceof Error ? cause.message : cause}`
    );
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `  ok    ${checked} published URLs resolve and serve JSON; every frozen schema serves the ` +
    'bytes it froze, and the release manifest is deployed.'
);
