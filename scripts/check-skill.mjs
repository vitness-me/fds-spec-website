#!/usr/bin/env node
/**
 * The skill's knowledge base describes fields that exist.
 *
 * `packages/fds-skill/` is a knowledge base an assistant answers from. Wrong
 * knowledge there is worse than none: it produces confident, specific, invalid
 * output, and the person asking has no way to tell.
 *
 * That is not hypothetical. Writing the workout and program sections by hand
 * produced six wrong names in one sitting — `dropSet` for `drop`, `waveLoading`
 * for `wave`, a rest method `none` that does not exist while omitting `ratio`,
 * `max` where an AMRAP target uses `cap`, a `notation` field on tempo, and a
 * rest scope `exercise` instead of `round`. Every one would have validated as
 * prose and failed as data.
 *
 * So the literals are checked against the schemas. Two rules:
 *
 *   - Every string literal the TypeScript blocks name must exist somewhere in
 *     the standard — as a property, a definition, a `const`, an `enum` member or
 *     a recommended value.
 *   - Every schema URL the skill quotes must resolve to a published file.
 *
 * This does not check that the descriptions are *right*, only that the names are
 * real. That is the failure mode worth automating; the rest is review.
 *
 *   node scripts/check-skill.mjs
 */

import { readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globalVocabulary } from './lib/vocabulary.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = 'packages/fds-skill';
const FILES = [`${SKILL}/SKILL.md`, `${SKILL}/knowledge/schemas.md`];

/**
 * Literals that are not FDS field names: TypeScript and JSON vocabulary, the
 * illustrative ID prefixes the docs use, and words the knowledge base uses to
 * describe the standard rather than to name part of it.
 */
const NOT_A_FIELD = new Set([
  // TypeScript / JSON Schema vocabulary appearing inside type blocks
  'string', 'number', 'boolean', 'object', 'array', 'unknown', 'any', 'null',
  'true', 'false', 'undefined', 'never', 'void',
  // Illustrative values the docs use to show shape, not vocabulary
  'uuid', 'v4', 'e', 'g',
]);

const globalNames = await globalVocabulary();
const problems = [];
let checked = 0;

for (const file of FILES) {
  const text = await readFile(join(ROOT, file), 'utf8');

  // Only fenced TypeScript blocks. Prose quotes English; type declarations
  // quote field names, which is the thing that can be wrong.
  const blocks = [...text.matchAll(/^```(?:typescript|ts)\n([\s\S]*?)^```/gm)].map((m) => m[1]);

  const invented = new Map(); // literal -> block index
  blocks.forEach((block, index) => {
    // Strip comments first: `// note: \`cap\`, not \`max\`` explains a mistake
    // rather than making one.
    const code = block.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, literal] of code.matchAll(/'([^']+)'/g)) {
      if (!/^[a-z][A-Za-z0-9]*$/.test(literal)) continue;
      if (NOT_A_FIELD.has(literal) || globalNames.has(literal)) continue;
      if (!invented.has(literal)) invented.set(literal, index + 1);
      checked += 1;
    }
  });

  if (invented.size) {
    problems.push(
      `${file}: ${invented.size} name(s) no schema defines:\n` +
        [...invented.entries()]
          .sort()
          .map(([literal, block]) => `    '${literal}' — typescript block ${block}`)
          .join('\n') +
        '\n    Wrong knowledge is worse than none. Check the name against the schema.'
    );
  }

  // Every schema URL quoted must be a file that exists.
  const urls = [...text.matchAll(/https:\/\/spec\.vitness\.me\/(schemas|registries)\/(\S+?\.json)/g)];
  for (const [, kind, path] of urls) {
    const local =
      kind === 'schemas'
        ? join(ROOT, 'specification/schemas', path)
        : join(ROOT, 'specification/registries', path);
    try {
      await access(local);
    } catch {
      problems.push(`${file}: quotes ${kind}/${path}, which is not published.`);
    }
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `  ok    skill knowledge — every name in ${FILES.length} files exists in the schemas`
);
