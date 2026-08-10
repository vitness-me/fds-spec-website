#!/usr/bin/env node
/**
 * Every RFC has a website page, the page says what the RFC says, and the site
 * links to it.
 *
 * The specification lives twice: `specification/rfc/` is the source, and
 * `website/docs/specifications/` is what readers actually get. A mirror is the
 * source verbatim with Docusaurus frontmatter prepended. Nothing connected the
 * two, so editing a normative rule in the source left the published page saying
 * the old thing — the failure is silent, and it is the published copy that is
 * wrong.
 *
 * Three ways that breaks, all checked here:
 *
 *   - The mirror drifts from its source.
 *   - The mirror exists but nothing links to it, so it ships unreachable.
 *   - A mirror outlives the source it came from.
 *
 * RFC-001..005 are exempt from the drift rule only. Their pages were written
 * with Docusaurus admonitions (`:::danger MUST`) and hard line breaks that the
 * plain-text sources do not carry, so they are not byte-identical by intent
 * rather than by neglect. Reconciling them belongs with the work that enrols
 * those same five RFCs in `check:rfc` — until then the exemption is named here
 * so it is visible rather than implied by the check passing.
 *
 *   node scripts/check-rfc-mirrors.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = join(ROOT, 'specification/rfc');
const MIRROR_DIR = join(ROOT, 'website/docs/specifications');
const SIDEBARS = join(ROOT, 'website/sidebars.ts');

/**
 * Mirrors that legitimately differ from their source. Drift only — an exempt
 * RFC still needs a page, and the page still needs to be linked.
 *
 * Remove an entry here when its page is reconciled with its source. The list
 * shrinking to nothing is the intended end state.
 */
const DRIFT_EXEMPT = new Set([
  'rfc-001-exercise-data-model.md',
  'rfc-002-equipment-data-model.md',
  'rfc-003-muscle-data-model.md',
  'rfc-004-muscle-category-data-model.md',
  'rfc-005-body-atlas-data-model.md',
]);

const isRfc = (name) => name.startsWith('rfc-') && name.endsWith('.md');

const sources = (await readdir(SOURCE_DIR)).filter(isRfc).sort();
const mirrors = new Set((await readdir(MIRROR_DIR)).filter(isRfc));
const sidebars = await readFile(SIDEBARS, 'utf8');

const problems = [];
let checked = 0;
let exempt = 0;

for (const name of sources) {
  const slug = name.replace(/\.md$/, '');

  if (!mirrors.has(name)) {
    problems.push(
      `${name} has no page in website/docs/specifications/.\n` +
        '    An RFC nobody can read is not published.'
    );
    continue;
  }

  const raw = await readFile(join(MIRROR_DIR, name), 'utf8');
  const frontmatter = raw.match(/^---\n[\s\S]*?\n---\n/);
  if (!frontmatter) {
    problems.push(`${name}: the page has no Docusaurus frontmatter block.`);
    continue;
  }

  if (!sidebars.includes(`'specifications/${slug}'`)) {
    problems.push(
      `${name}: no entry in website/sidebars.ts.\n` +
        `    Add 'specifications/${slug}' to the Specifications (RFCs) category, ` +
        'or the page builds and nothing navigates to it.'
    );
  }

  if (DRIFT_EXEMPT.has(name)) {
    exempt += 1;
    continue;
  }

  const body = raw.slice(frontmatter[0].length).replace(/^\n+/, '');
  const source = await readFile(join(SOURCE_DIR, name), 'utf8');
  if (body !== source) {
    problems.push(
      `${name}: the page has drifted from its source.\n` +
        '    The mirror is the source verbatim, with frontmatter prepended. Rebuild it:\n' +
        `      { head -n <frontmatter lines> website/docs/specifications/${name}; ` +
        `cat specification/rfc/${name}; } > /tmp/${name} && ` +
        `mv /tmp/${name} website/docs/specifications/${name}`
    );
  }
  checked += 1;
}

const orphans = [...mirrors].filter((name) => !sources.includes(name)).sort();
if (orphans.length) {
  problems.push(
    `${orphans.length} page(s) in website/docs/specifications/ with no source RFC:\n` +
      orphans.map((name) => `    ${name}`).join('\n') +
      '\n    Either the source was deleted or renamed, or the page never had one.'
  );
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `  ok    ${sources.length} RFCs published and linked; ` +
    `${checked} match their source byte for byte, ${exempt} exempt from the drift rule.`
);
