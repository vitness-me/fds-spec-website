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
const exampleFiles = files.filter((f) => f.endsWith('.example.json'));
const exemplified = new Set(exampleFiles.map((f) => basename(f).split('.')[0]));
for (const name of owned) {
  if (!exemplified.has(name)) {
    problems.push(`#/$defs/${name} has no worked example (expected ${name}.<variant>.example.json)`);
  }
}

/**
 * Per-variant coverage for the discriminated definitions.
 *
 * One example per *definition* is not enough: `loadTarget` has thirteen methods,
 * and an example of `absolute` says nothing about whether `bandResistance`
 * works. The epic this schema belongs to promises that no scenario ships without
 * a worked example — this is what makes that checkable instead of aspirational.
 *
 * Only the dimension is named here. The values are read out of the schema, so
 * adding a method without adding an example fails, rather than needing someone
 * to remember to extend a list in this file.
 */
const COVERAGE = [
  { def: 'loadTarget', discriminator: 'method' },
  { def: 'repTarget', discriminator: 'kind' },
  { def: 'restSpec', discriminator: 'method' },
  { def: 'setScheme', discriminator: 'pattern' },
];

/** Discriminator values a definition names: `const` per oneOf branch, or a plain enum. */
function variantsOf(definition, discriminator) {
  if (Array.isArray(definition.oneOf)) {
    return definition.oneOf
      // The forward-compatibility branch constrains the discriminator with
      // `not`, not `const`. It is unbounded by design and cannot be exemplified
      // exhaustively — one example of *some* unrecognized value is enough, and
      // the per-definition rule above already requires that.
      .map((branch) => branch.properties?.[discriminator]?.const)
      .filter((value) => value !== undefined);
  }
  return definition.properties?.[discriminator]?.enum ?? [];
}

for (const { def, discriminator } of COVERAGE) {
  const definition = library.$defs?.[def];
  if (!definition) {
    problems.push(`coverage is configured for #/$defs/${def}, which no longer exists`);
    continue;
  }

  const variants = variantsOf(definition, discriminator);
  if (!variants.length) {
    problems.push(
      `#/$defs/${def} has no "${discriminator}" values to cover — the discriminator was probably renamed`
    );
    continue;
  }

  const covered = new Set();
  for (const file of exampleFiles) {
    if (basename(file).split('.')[0] !== def) continue;
    const data = JSON.parse(await readFile(join(DIR, file), 'utf8'));
    if (data && typeof data === 'object') covered.add(data[discriminator]);
  }

  const missing = variants.filter((value) => !covered.has(value));
  if (missing.length) {
    problems.push(
      `#/$defs/${def} has no worked example for ${discriminator}: ${missing.join(', ')}\n` +
        `    Add ${def}.<variant>.example.json for each.`
    );
  } else {
    console.log(`  ok    cover   ${def}.${discriminator} — all ${variants.length} variants`);
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
