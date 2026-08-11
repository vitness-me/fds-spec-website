#!/usr/bin/env node
/**
 * The use-case layer says only what the published corpus can back, and every
 * page it ships is reachable.
 *
 * `website/docs/use-cases/` is the capability layer — "what can you do with
 * FDS?" — that sits between the landing page and the reference documentation.
 * It is the first website content outside `website/docs/{rfc,schemas,...}` that
 * a gate reads. That gap is not academic: `website/src/` and these pages sat
 * outside every check until now, which is exactly how the landing page shipped a
 * fabricated exercise and four invented companies while CI stayed green. A
 * persuasion layer with no gate becomes the stalest content on the site.
 *
 * The defect this closes is fabrication. A use-case page is a sales pitch, and
 * the temptation on a sales pitch is to invent the evidence — a tidier JSON
 * example than the real one, a company whose export format proves the point, a
 * capability the schemas do not yet have. Every rule below removes one way to do
 * that, and the load-bearing one is structural rather than detective: a page may
 * not contain a literal ```json fence at all, so the only JSON a reader can see
 * is a value the page imported from a real file under specification/schemas/.
 * A fabricated example is not caught here — it is impossible to write.
 *
 * Eight rules:
 *
 *   1. No literal ```json fence on any page. Examples arrive by import, or not
 *      at all.
 *   2. Every page carries the frontmatter the pattern depends on: a promise
 *      (a testable claim, at most twenty words, unique across pages, and present
 *      verbatim in the body); a family from the shared registry; at least one
 *      known audience; and at least one backing source.
 *   3. The files a page declares, imports, and captions are the same set — so a
 *      caption cannot name one file while the code block shows another — and each
 *      is a real fixture published under specification/schemas/.
 *   4. Every page is reachable from `useCasesSidebar` in website/sidebars.ts.
 *   5. Every page is on the gallery index, by route and by promise, so a new page
 *      cannot ship invisible and the gallery cannot drift from the pages.
 *   6. Every entity and library the release manifest publishes is covered by at
 *      least one page. A new schema cannot ship without a use case that shows it.
 *   7. No invented vendor, product or company name appears anywhere in the
 *      section.
 *   8. The persona and family registries are the single source of truth for
 *      rules 2 and 5, read from the same module the pages render from.
 *
 * The frontmatter contract, flat so a check with no YAML library can read it and
 * a future author can copy it:
 *
 *   ---
 *   title: ...
 *   sidebar_label: ...
 *   description: ...
 *   usecase_promise: A testable claim, at most twenty words.
 *   usecase_family: composition
 *   usecase_audiences: [app-developer, oem-engineer]
 *   usecase_sources:
 *     - specification/schemas/workout/v1.1.0/workout.straight.example.json
 *   ---
 *
 * Offline, like its siblings: it proves a source names a file the build
 * published, not that the CDN serves it. Nothing here fetches anything.
 *
 *   node scripts/check-usecases.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifest } from './lib/releases.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const USECASES = 'website/docs/use-cases';
const SIDEBARS = 'website/sidebars.ts';
const REGISTRY = `${USECASES}/_shared/registry.ts`;
const INDEX_SLUG = 'index';

/**
 * Fabricated brand names that have appeared in this repository's persuasion
 * layer, kept as a regression guard.
 *
 * These are the four invented platforms the landing page's ComparisonDemo used
 * to argue — correctly — that real products are incompatible, with evidence that
 * was made up. They are listed here rather than derived from that component on
 * purpose: the component is slated for deletion, and a denylist that vanishes
 * with the thing it guards against guards nothing.
 *
 * This is a denylist, not a fabrication detector. It catches a known name coming
 * back; it cannot catch a newly invented one. The structural guarantee against
 * fabrication is rule 1 — no literal JSON — not this list.
 */
const FABRICATED_NAMES = ['FitApp Pro', 'GymTracker', 'WorkoutDB', 'IronLog'];

const MAX_PROMISE_WORDS = 20;

/** Every file under the section, relative to the repository root. */
async function sectionFiles() {
  const entries = await readdir(join(ROOT, USECASES), {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(ROOT, join(entry.parentPath ?? entry.path, entry.name)))
    .sort();
}

/** A path segment under the section starts with `_` — a shared module, not a page. */
const isShared = (relPath) =>
  relPath
    .slice(`${USECASES}/`.length)
    .split('/')
    .some((segment) => segment.startsWith('_'));

const isPage = (relPath) => /\.mdx?$/.test(relPath) && !isShared(relPath);

const slugOf = (relPath) => relPath.slice(`${USECASES}/`.length).replace(/\.mdx?$/, '');

/** The frontmatter block and the body that follows it. */
function split(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  return { frontmatter: match[1], body: raw.slice(match[0].length) };
}

/** The flat usecase_* frontmatter, as far as it parses. */
function parseFrontmatter(frontmatter) {
  const scalar = (key) => frontmatter.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'))?.[1] ?? null;
  const promise = scalar('usecase_promise');
  const family = scalar('usecase_family');

  const audiencesRaw = frontmatter.match(/^usecase_audiences:\s*\[(.*?)\]\s*$/m)?.[1] ?? null;
  const audiences =
    audiencesRaw === null
      ? null
      : audiencesRaw
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);

  const sourcesBlock = frontmatter.match(/^usecase_sources:\s*\n((?:[ \t]*-\s*.+\n?)+)/m)?.[1] ?? null;
  const sources =
    sourcesBlock === null
      ? null
      : [...sourcesBlock.matchAll(/^[ \t]*-\s*(.+?)\s*$/gm)].map((m) => m[1]);

  return { promise, family, audiences, sources };
}

/** `specification/schemas|registries/....json` references of a given shape in text. */
function specPaths(text, regex) {
  return [...text.matchAll(regex)].map((m) => m[1]);
}

/** Ids declared inside an `export const NAME = { ... }` object in the registry. */
function registryKeys(source, name) {
  const block = source.match(new RegExp(`export const ${name}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`));
  if (!block) return null;
  // Keys may be quoted ('app-developer') or bare (foundations); accept both.
  return [...block[1].matchAll(/^\s*'?([\w-]+)'?\s*:/gm)].map((m) => m[1]);
}

const setsEqual = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const wordCount = (text) => text.trim().split(/\s+/).length;

// ── read the inputs ──────────────────────────────────────────────────────────

const problems = [];
const note = (problem) => problems.push(problem);

const files = await sectionFiles();
const pages = files.filter(isPage);
const usecasePages = pages.filter((p) => slugOf(p) !== INDEX_SLUG);
const indexPage = pages.find((p) => slugOf(p) === INDEX_SLUG);

const sidebars = await readFile(join(ROOT, SIDEBARS), 'utf8');
const registrySource = await readFile(join(ROOT, REGISTRY), 'utf8').catch(() => null);

if (registrySource === null) {
  note(`${REGISTRY} is missing. Personas and families are defined there and read by both the pages and this check.`);
}
const personaIds = new Set(registrySource ? registryKeys(registrySource, 'PERSONAS') ?? [] : []);
const familyIds = new Set(registrySource ? registryKeys(registrySource, 'FAMILIES') ?? [] : []);

if (registrySource && personaIds.size === 0) {
  note(`${REGISTRY}: no PERSONAS entries parsed. Rule 2 cannot validate audiences without them.`);
}
if (registrySource && familyIds.size === 0) {
  note(`${REGISTRY}: no FAMILIES entries parsed. Rule 2 cannot validate families without them.`);
}

const { manifest } = await loadManifest();
const indexRaw = indexPage ? await readFile(join(ROOT, indexPage), 'utf8') : '';

// The union of every source any page declares, for the coverage rule.
const coveredDirs = new Set();
const promises = new Map(); // promise -> first page that used it

const FENCE = /^\s*(?:```+|~~~+)\s*jsonc?\b/im;
const IMPORT_SPEC = /import\s+[\w{},\s*]+\s+from\s+['"][^'"]*?(specification\/(?:schemas|registries)\/[\w./-]+\.json)['"]/g;
const SOURCE_PROP = /source=["'](specification\/[^"']+)["']/g;

if (!indexPage) {
  note(`${USECASES}/index.mdx is missing. The gallery is the entry point and the completeness check reads it.`);
}

// ── per-page rules (1, 2, 3, 4) ──────────────────────────────────────────────

for (const page of usecasePages) {
  const raw = await readFile(join(ROOT, page), 'utf8');
  const parts = split(raw);
  if (!parts) {
    note(`${page}: no frontmatter block. Every use-case page needs the usecase_* frontmatter.`);
    continue;
  }
  const { frontmatter, body } = parts;

  // Rule 1 — no literal JSON fence.
  const fence = body.split('\n').findIndex((line) => FENCE.test(line));
  if (fence >= 0) {
    note(
      `${page}:${fence + 1 + frontmatter.split('\n').length + 2}: a literal \`\`\`json fence.\n` +
        '    Every example must be imported from a real file and rendered with <SpecExample>, so ' +
        'a fabricated one cannot be written.'
    );
  }

  // Rule 4 — reachable from the sidebar.
  const docId = `use-cases/${slugOf(page)}`;
  if (!sidebars.includes(`'${docId}'`)) {
    note(
      `${page}: no entry in ${SIDEBARS}.\n` +
        `    Add '${docId}' to useCasesSidebar, or the page builds and nothing navigates to it.`
    );
  }

  // Rule 2 — the frontmatter contract.
  const { promise, family, audiences, sources } = parseFrontmatter(frontmatter);

  if (!promise) {
    note(`${page}: no usecase_promise. State the one-sentence, testable claim the page makes.`);
  } else {
    if (wordCount(promise) > MAX_PROMISE_WORDS) {
      note(
        `${page}: usecase_promise is ${wordCount(promise)} words; the limit is ${MAX_PROMISE_WORDS}.\n` +
          `    A promise is a claim, not a paragraph: "${promise}"`
      );
    }
    if (promises.has(promise)) {
      note(
        `${page}: usecase_promise repeats ${promises.get(promise)}.\n` +
          '    Two pages with the same promise are one page. Make the claim specific to this capability.'
      );
    } else {
      promises.set(promise, page);
    }
    if (!body.includes(promise)) {
      note(
        `${page}: the promise does not appear in the body verbatim.\n` +
          '    It is the page deck — render it, so the frontmatter and the page cannot disagree.'
      );
    }
  }

  if (!family) {
    note(`${page}: no usecase_family. Name the capability family from ${REGISTRY}.`);
  } else if (familyIds.size && !familyIds.has(family)) {
    note(
      `${page}: usecase_family "${family}" is not in FAMILIES.\n` +
        `    Known: ${[...familyIds].join(', ')}. Add it to ${REGISTRY} or fix the page.`
    );
  }

  if (!audiences || audiences.length === 0) {
    note(`${page}: no usecase_audiences. Name at least one persona this page is for.`);
  } else {
    for (const id of audiences) {
      if (personaIds.size && !personaIds.has(id)) {
        note(
          `${page}: usecase_audiences names "${id}", which is not a persona in ${REGISTRY}.\n` +
            `    Known: ${[...personaIds].join(', ')}.`
        );
      }
    }
  }

  // Rule 3 — declared, imported and captioned sources are one set of real files.
  const declared = new Set(sources ?? []);
  const imported = new Set(specPaths(body, IMPORT_SPEC));
  const captioned = new Set(specPaths(body, SOURCE_PROP));

  if (!sources || sources.length === 0) {
    note(`${page}: no usecase_sources. A use case must name at least one real example file that backs it.`);
  }

  if (declared.size && !setsEqual(declared, imported)) {
    note(
      `${page}: usecase_sources and the files the page imports differ.\n` +
        diff('declared, not imported', declared, imported) +
        diff('imported, not declared', imported, declared) +
        '    Every declared source must be the file the page actually renders, and nothing else.'
    );
  }
  if (declared.size && !setsEqual(declared, captioned)) {
    note(
      `${page}: usecase_sources and the files <SpecExample source="..."> names differ.\n` +
        diff('declared, not captioned', declared, captioned) +
        diff('captioned, not declared', captioned, declared) +
        '    The caption names the file the reader is looking at; it must be the declared source.'
    );
  }

  for (const source of declared) {
    const exists = await readFile(join(ROOT, source), 'utf8').catch(() => null);
    if (exists === null) {
      note(
        `${page}: usecase_sources names ${source}, which is not on disk.\n` +
          '    Either the path is wrong or the file was renamed. A page may only cite a published file.'
      );
      continue;
    }
    if (!source.startsWith('specification/schemas/') && !source.startsWith('specification/registries/')) {
      note(`${page}: source ${source} is not under the published tree (specification/schemas or /registries).`);
      continue;
    }
    if (!/\.(example|invalid)\b/.test(source)) {
      note(
        `${page}: source ${source} is not a fixture.\n` +
          '    Cite a *.example.json or *.invalid.json, not a schema or other file.'
      );
      continue;
    }
    // For the coverage rule: which schema directory this fixture lives in.
    const schemasRel = source.slice('specification/schemas/'.length);
    if (source.startsWith('specification/schemas/')) coveredDirs.add(dirname(schemasRel));
  }
}

function diff(label, a, b) {
  const only = [...a].filter((x) => !b.has(x));
  return only.length ? `        ${label}: ${only.join(', ')}\n` : '';
}

// ── rule 5 — the gallery lists every page, by route and by promise ───────────

if (indexPage) {
  if (FENCE.test(indexRaw)) {
    note(`${indexPage}: a literal \`\`\`json fence. The gallery follows the same no-fabrication rule as every page.`);
  }
  for (const page of usecasePages) {
    const route = `/docs/use-cases/${slugOf(page)}`;
    if (!indexRaw.includes(route)) {
      note(
        `${indexPage}: no link to ${route}.\n` +
          '    Every use-case page must appear on the gallery, or it ships where no reader will find it.'
      );
    }
    const promise = promises.size ? [...promises].find(([, p]) => p === page)?.[0] : null;
    if (promise && !indexRaw.includes(promise)) {
      note(
        `${indexPage}: the card for ${slugOf(page)} does not carry its promise verbatim.\n` +
          `    Expected: "${promise}". The gallery restates each page's promise; keep it in step.`
      );
    }
  }
}

// ── rule 6 — every published entity and library is covered ───────────────────

for (const [name, entry] of Object.entries(manifest.schemas ?? {})) {
  if (entry.kind !== 'entity' && entry.kind !== 'library') continue;
  const path = entry.versions?.[entry.current]?.path;
  if (!path) continue; // withdrawn current cannot happen, but be defensive
  const dir = dirname(path);
  if (!coveredDirs.has(dir)) {
    note(
      `no use-case page covers ${name} (${entry.kind}), published at ${dir}/.\n` +
        `    Add a page whose usecase_sources cites a fixture under ${dir}/, or a new schema ships invisible.`
    );
  }
}

// ── rule 7 — no invented names ───────────────────────────────────────────────

for (const file of files) {
  const raw = await readFile(join(ROOT, file), 'utf8');
  for (const name of FABRICATED_NAMES) {
    if (raw.includes(name)) {
      const line = raw.slice(0, raw.indexOf(name)).split('\n').length;
      note(
        `${file}:${line}: names "${name}", an invented product.\n` +
          '    The standard models no vendor. Make the point with a real, published file, not a fabricated company.'
      );
    }
  }
}

// ── result ───────────────────────────────────────────────────────────────────

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `  ok    ${usecasePages.length} use-case pages, ` +
    `${coveredDirs.size} schema directories cited, ` +
    `${personaIds.size} personas, ${familyIds.size} families; ` +
    'every page reachable, on the gallery, and backed by a published file.'
);
