#!/usr/bin/env node
/**
 * Validates prescription examples against the definition they exemplify.
 *
 * RFC-006 publishes a `$defs` library, not an entity — nothing is ever "a
 * prescription document". The ordinary CI loop, which validates every example in
 * a directory against that directory's schema, cannot check these: the library
 * root deliberately accepts nothing.
 *
 * So each example names its definition in its filename and is validated against
 * a wrapper schema — the library plus a root `$ref` at that definition:
 *
 *   loadTarget.absolute.example.json      -> must satisfy #/$defs/loadTarget
 *   loadTarget.absolute.invalid.json      -> must NOT satisfy it
 *
 * The `.invalid.` fixtures matter more than usual here. `loadTarget` and
 * `repTarget` use `oneOf` with a catch-all branch for methods a future version
 * may add, and a catch-all that is not disjoint from the named branches makes
 * the whole union collapse: either two branches match and `oneOf` fails, or the
 * catch-all swallows a malformed known method and everything passes. Only the
 * negative fixtures can tell those apart from correct behaviour.
 *
 *   node scripts/check-prescription.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'specification/schemas/prescription/v1.0.0');
const LIBRARY = join(DIR, 'prescription.schema.json');
const SOURCE = join(
  ROOT,
  'specification/schema-sources/prescription/v1.0.0/prescription.schema.json'
);

let Ajv;
let addFormats;
try {
  Ajv = (await import('ajv/dist/2020.js')).default;
  addFormats = (await import('ajv-formats')).default;
} catch {
  console.error(
    'ajv is not installed. Run `npm install --no-save ajv@8 ajv-formats@3`\n' +
      '(the schemas CI job installs it before this step).'
  );
  process.exit(1);
}

const library = JSON.parse(await readFile(LIBRARY, 'utf8'));
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

const definitions = Object.keys(library.$defs ?? {});
const compiled = new Map();

/**
 * Definitions this library actually authors.
 *
 * The published file also carries whatever the flattener copied in from
 * `common` — `equipmentRef` and friends. Those are exemplified by the entity
 * that owns them, and demanding a second worked example here would be asking
 * RFC-006 to document RFC-002's vocabulary.
 */
const owned = Object.keys(
  JSON.parse(await readFile(SOURCE, 'utf8')).$defs ?? {}
);

/**
 * A validator for one definition. `not` is dropped: it exists to stop anyone
 * validating a whole document against the library, which is exactly what this
 * wrapper is deliberately not doing.
 */
function validatorFor(name) {
  if (!compiled.has(name)) {
    const { not, ...rest } = library;
    compiled.set(
      name,
      ajv.compile({ ...rest, $id: `urn:fds:prescription:${name}`, $ref: `#/$defs/${name}` })
    );
  }
  return compiled.get(name);
}

const files = (await readdir(DIR)).filter(
  (f) => f.endsWith('.example.json') || f.endsWith('.invalid.json')
);

let checked = 0;
const problems = [];

for (const file of files.sort()) {
  const [defName] = basename(file).split('.');
  const shouldPass = file.endsWith('.example.json');

  if (!definitions.includes(defName)) {
    problems.push(
      `${file} — filename names "${defName}", which is not a definition in the library.\n` +
        `    Available: ${definitions.join(', ')}`
    );
    continue;
  }

  const data = JSON.parse(await readFile(join(DIR, file), 'utf8'));
  const validate = validatorFor(defName);
  const passed = validate(data);
  checked += 1;

  if (passed === shouldPass) {
    console.log(`  ok    ${shouldPass ? 'accept' : 'reject'}  ${file}`);
    continue;
  }

  if (shouldPass) {
    problems.push(
      `${file} — must satisfy #/$defs/${defName} but does not:\n` +
        validate.errors
          .map((e) => `    ${e.instancePath || '/'} ${e.message}`)
          .join('\n')
    );
  } else {
    problems.push(
      `${file} — must be REJECTED by #/$defs/${defName} but validated.\n` +
        '    A negative fixture that passes means the schema stopped catching what it names.'
    );
  }
}

// Every definition needs at least one worked example. A primitive nobody has
// exemplified is a primitive nobody has checked.
const exemplified = new Set(
  files.filter((f) => f.endsWith('.example.json')).map((f) => basename(f).split('.')[0])
);
for (const name of owned) {
  if (!exemplified.has(name)) {
    problems.push(`#/$defs/${name} has no worked example (expected ${name}.<variant>.example.json)`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `\n${checked} prescription fixtures checked; all ${owned.length} authored definitions have a worked example.`
);
