#!/usr/bin/env node
/**
 * Every specification document has a website page, the page says what the
 * document says, and the site links to it.
 *
 * The specification lives twice: `specification/` is the source, and
 * `website/docs/` is what readers actually get. A page is the source with
 * Docusaurus frontmatter prepended. Nothing connected the two, so editing a
 * normative rule in the source left the published page saying the old thing —
 * the failure is silent, and it is the published copy that is wrong.
 *
 * That had already happened. The metrics guide gained an extended vocabulary
 * and its page did not, so the site documented metric types the standard had
 * moved past.
 *
 * Five ways it breaks, all checked here:
 *
 *   - The page drifts from its source.
 *   - The page exists but nothing links to it, so it ships unreachable.
 *   - A page outlives the source it came from.
 *   - A source has no page at all.
 *   - A *schema* is published with no page describing it. Workout, program and
 *     prescription all shipped before they had one, which is how a reader could
 *     reach a frozen URL the documentation never mentioned.
 *
 * One convention: a page is its frontmatter followed by the source, verbatim.
 * Documents keep their own `# Heading` — every RFC page already did, and a
 * second convention for the guides bought nothing except a second thing to get
 * wrong.
 *
 * There are no exemptions. RFC-001..005 once had one: their pages carried
 * Docusaurus admonitions the plain-text sources did not, so the two could not be
 * compared byte for byte. The admonitions were moved into the sources, which
 * kept the published styling and left one document to edit instead of two.
 *
 *   node scripts/check-doc-mirrors.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RFC_DIR = join(ROOT, 'specification/rfc');
const INTEGRITY = join(ROOT, 'specification/schemas/.integrity.json');
const RFC_PAGES = join(ROOT, 'website/docs/specifications');
const SIDEBARS = join(ROOT, 'website/sidebars.ts');

/**
 * Specification documents outside `specification/rfc/` that have a page.
 *
 * Listed rather than discovered: not every file under `specification/` is meant
 * to be published — `README.md` addresses someone reading the repository, not
 * someone reading the standard.
 */
const DOC_PAIRS = [
  ['specification/discovery.md', 'core-concepts/discovery'],
  ['specification/metrics-guide.md', 'core-concepts/metrics'],
  ['specification/i18n-and-slugs.md', 'core-concepts/internationalization'],
  ['specification/extension-registry.md', 'core-concepts/extensions'],
  ['specification/governance/CHANGELOG.md', 'governance/changelog'],
  ['specification/governance/CONTRIBUTING.md', 'governance/contributing'],
  ['specification/governance/GOVERNANCE.md', 'governance/index'],
  ['specification/VITNESS Open Standards License Agreement.md', 'license'],
];

/**
 * Published schemas with no reader-facing page, and why.
 *
 * The transformer mapping schema configures a tool rather than describing an
 * entity; it belongs in the transformer documentation, which it has.
 */
const NO_PAGE_NEEDED = new Set(['mapping']);

/**
 * Pages that may differ from their source.
 *
 * Deliberately empty. Every page is now its source verbatim; an entry here is a
 * document that has stopped being checked, so adding one needs a reason written
 * beside it.
 */
const DRIFT_EXEMPT = new Set();

const isRfc = (name) => name.startsWith('rfc-') && name.endsWith('.md');

const rfcSources = (await readdir(RFC_DIR)).filter(isRfc).sort();
const rfcPages = new Set((await readdir(RFC_PAGES)).filter(isRfc));

/** Everything this check compares, as {source, page, docId}. */
const PAIRS = [
  ...rfcSources.map((name) => ({
    source: `specification/rfc/${name}`,
    page: `website/docs/specifications/${name}`,
    docId: `specifications/${name.replace(/\.md$/, '')}`,
  })),
  ...DOC_PAIRS.map(([source, docId]) => ({
    source,
    page: `website/docs/${docId}.md`,
    docId,
  })),
];

const sidebars = await readFile(SIDEBARS, 'utf8');
const problems = [];
let compared = 0;
let exempt = 0;
let schemaPages = 0;

for (const { source, page, docId } of PAIRS) {
  const raw = await readFile(join(ROOT, page), 'utf8').catch(() => null);
  if (raw === null) {
    problems.push(
      `${source} has no page at ${page}.\n    A specification nobody can read is not published.`
    );
    continue;
  }

  const frontmatter = raw.match(/^---\n[\s\S]*?\n---\n/);
  if (!frontmatter) {
    problems.push(`${page}: no Docusaurus frontmatter block.`);
    continue;
  }

  if (!sidebars.includes(`'${docId}'`)) {
    problems.push(
      `${page}: no entry in website/sidebars.ts.\n` +
        `    Add '${docId}', or the page builds and nothing navigates to it.`
    );
  }

  if (DRIFT_EXEMPT.has(source)) {
    exempt += 1;
    continue;
  }

  const body = raw.slice(frontmatter[0].length).replace(/^\n+/, '');
  const expected = await readFile(join(ROOT, source), 'utf8');

  if (body !== expected) {
    problems.push(
      `${page} has drifted from ${source}.\n` +
        '    A page is its frontmatter followed by the source, verbatim. ' +
        'Rebuild it from the source.'
    );
  }
  compared += 1;
}

// Every published schema needs a page. The integrity manifest is the list of
// what is published, so this cannot miss a schema the way a hand-kept list can.
const published = JSON.parse(await readFile(INTEGRITY, 'utf8')).schemas ?? {};
for (const path of Object.keys(published)) {
  const entity = path.split('/').pop().replace(/\.schema\.json$/, '');
  if (NO_PAGE_NEEDED.has(entity)) continue;

  const page = `website/docs/schemas/${entity}.md`;
  if (!(await readFile(join(ROOT, page), 'utf8').catch(() => null))) {
    problems.push(
      `${path} is published with no page at ${page}.\n` +
        '    A frozen URL the documentation never mentions is not discoverable.'
    );
    continue;
  }
  if (!sidebars.includes(`'schemas/${entity}'`)) {
    problems.push(`${page}: no entry in website/sidebars.ts.`);
  }
  schemaPages += 1;
}

// A page that outlives its source leaves readers a document the standard no
// longer contains.
const knownRfcPages = new Set(rfcSources);
const orphans = [...rfcPages].filter((name) => !knownRfcPages.has(name)).sort();
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
  `  ok    ${PAIRS.length} documents published and linked, ` +
    `${compared} matching their source` +
    `${exempt ? ` (${exempt} exempt)` : ''}; ` +
    `${schemaPages} published schemas documented.`
);
