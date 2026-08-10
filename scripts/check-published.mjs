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
  `  ok    ${checked} published URLs resolve, serve JSON, and match what was frozen.`
);
