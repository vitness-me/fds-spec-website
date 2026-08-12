#!/usr/bin/env node
/**
 * The licence a reader is told about is the licence the repository ships.
 *
 * The footer of every page said "Licensed under the VITNESS Open Standards
 * License Agreement" — as dead text, naming a document it did not link. The
 * agreement itself existed twice, byte-identical, at
 * `specification/VITNESS Open Standards License Agreement.md` and
 * `website/docs/license.md`, with nothing comparing them. And the repository
 * root carried no `LICENSE` at all, so a clone delivered the Materials with no
 * licence in the tree. Asserted in one place, implemented in another, nothing
 * comparing them — the shape this repository keeps hitting.
 *
 * One file is the source: the agreement under `specification/`, which is where
 * every other published document lives and where the README already points.
 * Everything else is derived and checked here:
 *
 *   - The root `LICENSE` is the source, byte for byte. GitHub, package
 *     tooling, and anyone listing the tree find the licence where every
 *     repository puts it.
 *   - The footer names the agreement by its real title — read from the
 *     source's `# ` heading, not from a string kept here — and links it, so
 *     the name can never drift from the document and the claim is one click
 *     from its proof.
 *
 * The website page is the third copy, and it is not checked here:
 * `check:mirrors` owns page-matches-source, and the agreement is listed in its
 * DOC_PAIRS like every other specification document with a page.
 *
 *   node scripts/check-license.mjs
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SOURCE = 'specification/VITNESS Open Standards License Agreement.md';
const LICENSE = 'LICENSE';
const CONFIG = 'website/docusaurus.config.ts';
const PAGE_ROUTE = '/docs/license';

const problems = [];

const source = await readFile(join(ROOT, SOURCE), 'utf8').catch(() => null);
if (source === null) {
  console.error(`\n${SOURCE} is missing — nothing else here can be checked without it.`);
  process.exit(1);
}

// The agreement's name is whatever its heading says. Nothing here keeps a copy.
const heading = source.match(/^# (.+)$/m)?.[1]?.trim();
if (!heading) {
  problems.push(`${SOURCE}: no \`# \` heading.\n    The licence's name is read from it.`);
}

// ── the root LICENSE ─────────────────────────────────────────────────────────

const license = await readFile(join(ROOT, LICENSE), 'utf8').catch(() => null);
if (license === null) {
  problems.push(
    `no ${LICENSE} file at the repository root.\n` +
      `    A clone ships the Materials with no licence in the tree. Create it:\n` +
      `    cp '${SOURCE}' ${LICENSE}`
  );
} else if (license !== source) {
  problems.push(
    `${LICENSE} differs from ${SOURCE}.\n` +
      `    The root LICENSE is the agreement, byte for byte. Rebuild it:\n` +
      `    cp '${SOURCE}' ${LICENSE}`
  );
}

// ── the footer claim ─────────────────────────────────────────────────────────

const config = await readFile(join(ROOT, CONFIG), 'utf8');
const copyright = config.match(/copyright:\s*`([^`]*)`/)?.[1];

if (copyright === undefined) {
  problems.push(
    `${CONFIG}: no \`copyright:\` template literal found.\n` +
      '    The footer is where the site names its licence; this check reads it there.'
  );
} else if (heading) {
  const link = `<a href="${PAGE_ROUTE}">${heading}</a>`;
  if (!copyright.includes(link)) {
    problems.push(
      `${CONFIG}: the footer does not link the licence it names.\n` +
        `    The copyright line must contain, verbatim:\n` +
        `      ${link}\n` +
        `    — the agreement's own heading, linked to its page, so the name cannot\n` +
        `    drift from the document and the claim carries its proof.\n` +
        `    Footer currently reads: ${JSON.stringify(copyright)}`
    );
  }
}

// ── result ───────────────────────────────────────────────────────────────────

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `  ok    ${LICENSE} carries "${heading}" byte for byte, and the footer links it.`
);
