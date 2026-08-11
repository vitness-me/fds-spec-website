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
 * This is NOT part of `npm run verify` and does not gate a pull request. It
 * needs the network and it checks *deployment* rather than the change in hand,
 * so a CDN hiccup must not block a documentation edit. It runs on a schedule and
 * on demand.
 *
 *   npm run check:published
 */

import { readFile } from 'node:fs/promises';
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
// freezing one would defeat the point of an open classifier. Reachability and
// identity are still promises.
const registryFiles = ['exercise-type', 'workout-type', 'block-role', 'intensity-zone'];
for (const name of registryFiles) {
  const url = `${BASE}/registries/${name}.registry.json`;
  try {
    const { response, body } = await get(url);
    if (!response.ok) {
      problems.push(`registries/${name}: answered ${response.status} ${response.statusText}`);
      continue;
    }
    if (!isJson(response.headers.get('content-type') ?? '')) {
      problems.push(`registries/${name}: answered 200 with a non-JSON content type.`);
      continue;
    }
    const doc = JSON.parse(body.toString('utf8'));
    if (doc.registry !== name) {
      problems.push(`registries/${name}: the document calls itself "${doc.registry}".`);
    }
    checked += 1;
  } catch (cause) {
    problems.push(
      `registries/${name}: unreachable — ${cause instanceof Error ? cause.message : cause}`
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
