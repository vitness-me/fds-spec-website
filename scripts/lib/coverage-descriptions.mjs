/**
 * The coverage matrix joined with the fixture READMEs — one derivation,
 * shared by everything that needs the joined rows.
 *
 * Two consumers read this join: the website's coverage-matrix plugin, which
 * renders the matrix on /docs/use-cases/, and `check:translations`, which
 * holds every locale's translated row descriptions to the English text the
 * READMEs currently carry. Before this module existed the join lived inside
 * the plugin; giving the gate its own copy would have been the repository's
 * oldest defect shape — the same derivation asserted twice, with nothing
 * comparing the copies.
 *
 * The matrix rows come from scripts/lib/coverage-matrix.mjs — the module
 * check:scenarios walks — and each row's one-line description is read from
 * the README shipped in its fixture directory, resolved by the entity and
 * version the matrix declares. A row the READMEs cannot describe throws,
 * with a message naming the row and the file, so both consumers fail the
 * same way on the same defect.
 */

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {SUITES} from './coverage-matrix.mjs';

/** The fixture file a matrix row names, per the suite's naming convention. */
function rowFile(suite, row) {
  return suite.prefixed === false ? `${row}.example.json` : `${suite.entity}.${row}.example.json`;
}

/** The `| \`file.json\` | description |` rows of a fixture README. */
function descriptions(readme) {
  const map = new Map();
  for (const match of readme.matchAll(/^\|\s*`([\w.\-]+\.json)`\s*\|\s*(.+?)\s*\|\s*$/gm)) {
    map.set(match[1], match[2]);
  }
  return map;
}

/**
 * Every matrix section, with each row joined to its English description.
 *
 * Returns `{sections, total}` where a section is `{title, entity, rows}` and
 * a row is `{name, key, description}`. `key` is `<entity>/<version>/<file>` —
 * stable across description edits, which is what lets a translation overlay
 * key on it while the English text stays checkable per row. Sections come
 * back in matrix order; sorting for presentation is the caller's decision.
 */
export async function englishMatrix(repoRoot) {
  const schemasDir = path.join(repoRoot, 'specification', 'schemas');
  const sections = [];
  let total = 0;

  for (const suite of SUITES) {
    const readmePath = path.join(schemasDir, suite.entity, suite.version, 'README.md');
    const readme = await readFile(readmePath, 'utf8').catch(() => {
      throw new Error(
        `Coverage matrix names ${suite.entity}/${suite.version}, but ` +
          `specification/schemas/${suite.entity}/${suite.version}/README.md does not exist.`,
      );
    });
    const byFile = descriptions(readme);

    for (const [title, rows] of suite.sections) {
      const built = rows.map((row) => {
        const file = rowFile(suite, row);
        const description = byFile.get(file);
        if (!description) {
          throw new Error(
            `Coverage matrix row "${row}" has no description in ` +
              `specification/schemas/${suite.entity}/${suite.version}/README.md ` +
              `(looked for \`${file}\`). Every scenario the site shows needs the ` +
              `explanation that ships beside its fixture.`,
          );
        }
        return {name: row, key: `${suite.entity}/${suite.version}/${file}`, description};
      });
      total += built.length;
      sections.push({title, entity: suite.entity, rows: built});
    }
  }

  return {sections, total};
}
