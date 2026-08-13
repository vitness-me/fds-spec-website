/**
 * Serves the scenario coverage matrix to the site, joined with the fixture
 * READMEs, as Docusaurus global data — in the language of the locale being
 * built.
 *
 * The rows and their English descriptions come from
 * scripts/lib/coverage-descriptions.mjs — the same derivation
 * `check:translations` holds the translation overlays to, built on the same
 * matrix module check:scenarios walks and check:versions counts. Reading the
 * shared derivation means the website cannot show a row the gates do not
 * enforce, and a row added to the matrix appears on the site with no page
 * edit.
 *
 * Translated locales read `website/i18n/<locale>/coverage-descriptions.json`,
 * which carries a translation for every section title and row description,
 * keyed on `<entity>/<version>/<file>` so the key survives an edit to the
 * English text. A missing overlay or a missing entry falls back to the
 * English string rather than failing the build: the build stays shippable,
 * and `check:translations` is the thing that refuses to let the gap persist —
 * the same division of labour every translated docs page gets.
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
import {englishMatrix} from '../../scripts/lib/coverage-descriptions.mjs';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

async function buildSections(context) {
  const {sections, total} = await englishMatrix(REPO_ROOT);

  // Matrix order groups rows by suite; readers get the sections in § order.
  // Sorted on the English title in every locale, so a translation cannot
  // reorder the sections it labels.
  sections.sort((a, b) => a.title.localeCompare(b.title, 'en', {numeric: true, sensitivity: 'base'}));

  const {currentLocale, defaultLocale} = context.i18n;
  if (currentLocale === defaultLocale) {
    return {
      sections: sections.map(({title, entity, rows}) => ({
        title,
        entity,
        rows: rows.map(({name, description}) => ({name, description})),
      })),
      total,
    };
  }

  const overlayPath = path.join(context.siteDir, 'i18n', currentLocale, 'coverage-descriptions.json');
  const overlay = await readFile(overlayPath, 'utf8').then(JSON.parse).catch(() => ({}));
  const titles = overlay.sections ?? {};
  const rowEntries = overlay.rows ?? {};

  return {
    sections: sections.map(({title, entity, rows}) => ({
      title: titles[title] || title,
      entity,
      rows: rows.map(({name, key, description}) => ({
        name,
        description: rowEntries[key]?.translation || description,
      })),
    })),
    total,
  };
}

export default function coverageMatrixPlugin(context) {
  return {
    name: 'coverage-matrix',
    loadContent: () => buildSections(context),
    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },
  };
}
