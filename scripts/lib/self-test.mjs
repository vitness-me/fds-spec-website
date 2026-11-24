/**
 * The `--self-test` comparison shared by checks that record their expected
 * fixture failures by key: one key per line, `#` comments and blank lines
 * ignored.
 */

import { readFile } from 'node:fs/promises';

/**
 * Exits 0 when `keys` are exactly the keys recorded in `expectedFile`, and 1
 * with the missing and unexpected keys otherwise. Duplicate keys count once.
 */
export async function assertRecordedFailures(expectedFile, keys) {
  const expected = (await readFile(expectedFile, 'utf8'))
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .sort();
  const actual = [...new Set(keys)].sort();
  const missing = expected.filter((k) => !actual.includes(k));
  const extra = actual.filter((k) => !expected.includes(k));
  if (missing.length || extra.length) {
    console.error('self-test: the check did not fail in exactly the recorded way.');
    for (const k of missing) console.error(`  expected, not reported: ${k}`);
    for (const k of extra) console.error(`  reported, not expected: ${k}`);
    process.exit(1);
  }
  console.log(`  ok    self-test: ${actual.length} recorded failures reproduced`);
  process.exit(0);
}
