#!/usr/bin/env node
/**
 * Renders the generated regions of the structural descriptor pages from the
 * descriptor registries and the question flow, then refreshes each page's
 * website mirror.
 *
 * Edit a registry under `specification/registries/descriptors/` or
 * `specification/descriptors/question-flow.json`, run this, and commit what it
 * writes. The prose between regions is hand-written and left alone.
 *
 * A mirror is `website/docs/descriptors/<name>.md`: its own frontmatter, then
 * the source verbatim. This rewrites the body of a mirror that exists and
 * creates none; `check:mirrors` names a source without a page.
 *
 *   node scripts/build-descriptor-docs.mjs
 *
 * `npm run check:descriptors` fails when a region is stale.
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGE_DIR, SITE_DIR, loadDescriptors, refreshRegions, regionRenderers } from './lib/descriptors.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const renderers = regionRenderers(await loadDescriptors(ROOT));

let failed = false;
for (const file of (await readdir(join(ROOT, PAGE_DIR))).filter((f) => f.endsWith('.md')).sort()) {
  const source = join(ROOT, PAGE_DIR, file);
  const before = await readFile(source, 'utf8');
  const { text, unknown } = refreshRegions(before, renderers);
  if (unknown.length) {
    failed = true;
    console.error(`${PAGE_DIR}/${file}: unknown region(s) ${unknown.join(', ')}. Known: ${Object.keys(renderers).join(', ')}`);
  }
  if (text !== before) await writeFile(source, text);

  const mirror = join(ROOT, SITE_DIR, file);
  const page = await readFile(mirror, 'utf8').catch(() => null);
  const frontmatter = page?.match(/^---\n[\s\S]*?\n---\n\n?/)?.[0];
  const mirrorStale = frontmatter !== undefined && page !== frontmatter + text;
  if (mirrorStale) await writeFile(mirror, frontmatter + text);
  console.log(
    `  ${text === before ? 'same ' : 'wrote'} ${PAGE_DIR}/${file}` +
      (frontmatter ? `  ${mirrorStale ? 'wrote' : 'same '} ${SITE_DIR}/${file}` : '  (no page)')
  );
}
if (failed) process.exit(1);
