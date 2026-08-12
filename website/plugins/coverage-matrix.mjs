/**
 * Serves the scenario coverage matrix to the site, joined with the fixture
 * READMEs, as Docusaurus global data.
 *
 * The rows come from scripts/lib/coverage-matrix.mjs — the same module
 * check:scenarios walks to prove every scenario has a validating example,
 * and check:versions counts for every "scenarios" number the documentation
 * quotes. Reading the same module means the website cannot show a row the
 * gates do not enforce, and a row added to the matrix appears on the site
 * with no page edit.
 *
 * Each row's one-line description is read from the README shipped in its
 * fixture directory (the file scripts/lib/fixture-readme.mjs holds to
 * "explains every fixture, names none that do not exist"), resolved by the
 * entity and version the matrix declares — no version is written here to go
 * stale.
 *
 * This runs in Node at load time rather than importing the READMEs through
 * webpack, because the MDX loader also matches `.md` files and compiles them
 * to JSX before an asset rule can serve their source — the "raw" import
 * arrives as compiled code, not markdown. Reading with fs sidesteps the
 * loader pipeline entirely, and it puts the failure where it belongs: a
 * matrix row with no README description, or a matrix version directory with
 * no README, fails `docusaurus build` (and `start`) with a message naming
 * the row and the file.
 */

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SUITES} from '../../scripts/lib/coverage-matrix.mjs';

const SCHEMAS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'specification',
  'schemas',
);

/** The `| \`file.json\` | description |` rows of a fixture README. */
function descriptions(readme) {
  const map = new Map();
  for (const match of readme.matchAll(/^\|\s*`([\w.\-]+\.json)`\s*\|\s*(.+?)\s*\|\s*$/gm)) {
    map.set(match[1], match[2]);
  }
  return map;
}

async function buildSections() {
  const sections = [];
  let total = 0;

  for (const suite of SUITES) {
    const readmePath = path.join(SCHEMAS_DIR, suite.entity, suite.version, 'README.md');
    const readme = await readFile(readmePath, 'utf8').catch(() => {
      throw new Error(
        `Coverage matrix names ${suite.entity}/${suite.version}, but ` +
          `specification/schemas/${suite.entity}/${suite.version}/README.md does not exist.`,
      );
    });
    const byFile = descriptions(readme);

    for (const [title, rows] of suite.sections) {
      const built = rows.map((row) => {
        const file =
          suite.prefixed === false ? `${row}.example.json` : `${suite.entity}.${row}.example.json`;
        const description = byFile.get(file);
        if (!description) {
          throw new Error(
            `Coverage matrix row "${row}" has no description in ` +
              `specification/schemas/${suite.entity}/${suite.version}/README.md ` +
              `(looked for \`${file}\`). Every scenario the site shows needs the ` +
              `explanation that ships beside its fixture.`,
          );
        }
        return {name: row, description};
      });
      total += built.length;
      sections.push({title, entity: suite.entity, rows: built});
    }
  }

  // Matrix order groups rows by suite; readers get the sections in § order.
  sections.sort((a, b) => a.title.localeCompare(b.title, 'en', {numeric: true, sensitivity: 'base'}));

  return {sections, total};
}

export default function coverageMatrixPlugin() {
  return {
    name: 'coverage-matrix',
    loadContent: buildSections,
    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },
  };
}
