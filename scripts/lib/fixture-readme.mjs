/**
 * Shared rule: a fixture directory's README explains every fixture in it, and
 * names none that do not exist.
 *
 * Both directions matter. Without the first, a fixture ships unexplained.
 * Without the second, renaming one silently orphans its explanation and readers
 * are left with a description of a file that is gone.
 *
 * Used by the prescription and workout fixture checks, which have the same rule
 * and no reason to implement it twice.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * @param {string} dir absolute path to the fixture directory
 * @param {string[]} files fixture filenames that must be documented
 * @param {string[]} [alsoAllowed] filenames the README may name that are not fixtures
 * @returns {Promise<{problems: string[], count: number}>}
 */
export async function checkReadmeIndex(dir, files, alsoAllowed = []) {
  const problems = [];
  const readme = await readFile(join(dir, 'README.md'), 'utf8').catch(() => null);

  if (readme === null) {
    return { problems: ['README.md is missing from the fixture directory'], count: 0 };
  }

  const named = new Set(
    [...readme.matchAll(/`([A-Za-z0-9._-]+\.json)`/g)].map((m) => m[1])
  );

  const undocumented = files.filter((f) => !named.has(f));
  if (undocumented.length) {
    problems.push(
      `${undocumented.length} fixture(s) missing from README.md:\n` +
        undocumented.map((f) => `    ${f}`).join('\n') +
        '\n    Every fixture needs a line saying what it demonstrates.'
    );
  }

  const present = new Set([...files, ...alsoAllowed]);
  const stale = [...named].filter((f) => !present.has(f));
  if (stale.length) {
    problems.push(
      `README.md names ${stale.length} fixture(s) that do not exist:\n` +
        stale.map((f) => `    ${f}`).join('\n')
    );
  }

  return { problems, count: files.length };
}
