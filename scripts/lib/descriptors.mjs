/**
 * The structural descriptors (FXI, FXE, FXM) as data, and the tables the
 * descriptor pages render from it.
 *
 * The registries under `specification/registries/descriptors/` and the
 * question flow at `specification/descriptors/question-flow.json` are the
 * source. Every code table and the whole written question flow in
 * `specification/descriptors/*.md` is generated from them between a pair of
 * markers:
 *
 *   <!-- fds:generated fxi#jointActions -->
 *   …table…
 *   <!-- /fds:generated -->
 *
 * so a page cannot list a code the registry dropped, or miss one it added.
 * `scripts/build-descriptor-docs.mjs` writes the regions;
 * `scripts/check-descriptors.mjs` fails when one is stale.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const REGISTRY_DIR = 'specification/registries/descriptors';
export const FLOW_FILE = 'specification/descriptors/question-flow.json';
export const PAGE_DIR = 'specification/descriptors';
export const SITE_DIR = 'website/docs/core-concepts/descriptors';
export const CONFORMANCE_DIR = 'specification/descriptors/conformance';
/** The conformance tiers, in the order a reader meets them. */
export const CONFORMANCE_TIERS = ['syntax', 'builder', 'compare', 'resolver'];

/** Every registry file, keyed by its `registry` field, plus the flow. */
export async function loadDescriptors(root) {
  const registries = {};
  const files = {};
  for (const file of (await readdir(join(root, REGISTRY_DIR))).sort()) {
    const doc = JSON.parse(await readFile(join(root, REGISTRY_DIR, file), 'utf8'));
    const name = doc.registry ?? file;
    registries[name] = doc;
    files[name] = file;
  }
  const flow = JSON.parse(await readFile(join(root, FLOW_FILE), 'utf8'));
  const conformance = {};
  for (const file of (await readdir(join(root, CONFORMANCE_DIR)).catch(() => [])).filter((f) => f.endsWith('.json')).sort()) {
    conformance[file] = JSON.parse(await readFile(join(root, CONFORMANCE_DIR, file), 'utf8'));
  }
  return { registries, files, flow, conformance };
}

// ── rendering ────────────────────────────────────────────────────────────────

/** Text outside code spans, made safe for MDX and for a table cell. */
const prose = (text) =>
  String(text)
    .replaceAll('|', '\\|')
    .replace(/(^|[^`])<(?=[A-Za-z/!])/g, '$1&lt;')
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;');

/** Prose that may already hold backtick code spans: escape only outside them. */
const mixed = (text) =>
  String(text)
    .split(/(`[^`]*`)/)
    .map((part, i) => (i % 2 === 1 ? part.replaceAll('|', '\\|') : prose(part)))
    .join('');

const code = (value) => (value === '' ? '(none)' : `\`${String(value).replaceAll('|', '\\|')}\``);
const codes = (list) => list.map(code).join(', ');

function table(head, rows) {
  return [
    `| ${head.join(' | ')} |`,
    `|${head.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');
}

/** Extra columns a vocabulary carries beyond value and description. */
const NOTES = {
  default: (v) => (v ? 'Default, never written.' : ''),
  opposite: (v) => `Opposite of ${code(v)}.`,
  conflictsWith: (v) => `Never with ${codes(v)}.`,
  parent: (v) => `Child of ${code(v)}; ${code(v)} covers it in compare.`,
  start: (v) => (v ? 'Start code.' : ''),
  limb: (v) => `${v[0].toUpperCase()}${v.slice(1)} joint.`,
  circles: (v) => (v ? 'Takes `.circ`.' : ''),
  impliedPoints: (v) => (v.length ? `Implies ${codes(v)} on the support.` : 'Implies no point.'),
  kind: (v) => `Kind ${code(v)}.`,
  implies: (v) => `Implies ${Object.entries(v).map(([k, x]) => code(`${k}:${x}`)).join(', ')}.`,
  holdPoints: (v) => (v.length ? `Fits FXI ${codes(v.map((p) => `@${p}`))}.` : ''),
  orientations: (v) => (v.length ? `Fits FXI ${codes(v)}.` : ''),
  standard: (v) => (v.length ? `Standard layers ${codes(v)}.` : 'No layers.'),
  extended: (v) => (v.length ? `Extended layers ${codes(v)}.` : ''),
};

function vocabularyTable(vocabulary) {
  const extra = (entry) =>
    Object.entries(entry)
      .filter(([k]) => NOTES[k])
      .map(([k, v]) => NOTES[k](v))
      .filter(Boolean)
      .join(' ');
  const anyExtra = vocabulary.entries.some((e) => extra(e) !== '');
  return table(
    anyExtra ? ['Code', 'Meaning', 'Notes'] : ['Code', 'Meaning'],
    vocabulary.entries.map((e) => [code(e.value), mixed(e.description), ...(anyExtra ? [extra(e)] : [])])
  );
}

function equipmentTokenTable(vocabulary) {
  return table(
    ['Token', 'In', 'Standard FXE it stands for', 'Meaning'],
    vocabulary.entries.map((e) => [
      code(e.value),
      [e.load ? '`l`' : '', e.support ? '`s`' : ''].filter(Boolean).join(', '),
      code(e.fxe),
      mixed(e.description) + (e.parent ? ` Child of ${code(e.parent)}.` : ''),
    ])
  );
}

function layerTable(registry) {
  return table(
    ['Layer', 'Kind', 'Read from', 'Meaning'],
    registry.layers.map((l) => [
      code(l.layer),
      l.standard ? 'standard' : 'extended',
      l.source === 'body' ? 'body layer' : 'name layer',
      mixed(l.description),
    ])
  );
}

function cardioTable(vocabulary) {
  return table(
    ['Type', 'Machine', '`c`', '`l`', '`s`', '`m`', 'FXI hold'],
    vocabulary.entries.map((e) => [code(e.value), prose(e.description), code(e.c), code(e.l), code(e.s), code(e.m), code(`@${e.hold}`)])
  );
}

function formsTable(vocabulary, kinds) {
  return kinds.entries
    .filter((k) => vocabulary.entries.some((f) => f.kind === k.value))
    .map((k) => {
      const rows = vocabulary.entries
        .filter((f) => f.kind === k.value)
        .map((f) => [
          code(f.value),
          mixed(f.description),
          [f.parent ? `Child of ${code(f.parent)}.` : '', f.implies ? NOTES.implies(f.implies) : ''].filter(Boolean).join(' '),
        ]);
      return `**${code(k.value)}**\n\n${table(['Form', 'Meaning', 'Notes'], rows)}`;
    })
    .join('\n\n');
}

// ── the question flow ────────────────────────────────────────────────────────

/** A condition in plain English. Question ids and option ids stay in code. */
function describeCondition(c, facts) {
  if ('fact' in c) {
    const text = mixed(facts[c.fact] ?? c.fact).replace(/\.$/, '');
    return text[0].toLowerCase() + text.slice(1);
  }
  if ('not' in c) return `not (${describeCondition(c.not, facts)})`;
  if ('all' in c) return c.all.map((x) => describeCondition(x, facts)).join('; and ');
  if ('any' in c) return `either ${c.any.map((x) => describeCondition(x, facts)).join(', or ')}`;
  if ('is' in c) return `${code(c.q)} is ${(Array.isArray(c.is) ? c.is : [c.is]).map(code).join(' or ')}`;
  if ('has' in c) return `${code(c.q)} includes ${code(c.has)}`;
  return `${code(c.q)} is at least ${c.atLeast}`;
}

function writes(option) {
  if (option.value === undefined) return option.id === 'usual' ? 'the default' : '';
  if (option.value === '') return '(no prefix)';
  return code(option.value);
}

function questionSection(q, facts) {
  const lines = [`#### ${code(q.id)}: ${mixed(q.text)}`, ''];
  const meta = [
    `- **Fills:** ${mixed(q.layer)}.`,
    `- **Pick:** ${q.select === 'many' ? `one or more${q.max ? ` (at most ${q.max})` : ''}` : 'one'}.`,
    `- **Asked when:** ${q.when ? describeCondition(q.when, facts) : 'always'}.`,
    `- **Usual:** ${q.usual === null ? 'no published default; the answer defines the value' : mixed(q.usual)}`,
  ];
  if (q.repeatsPerPhase) meta.push('- **Repeated** for every phase: see [the phase questions](#the-phase-questions).');
  if (q.fromDataset) meta.push(`- **Options from:** the ${q.fromDataset} dataset (not part of the notation).`);
  lines.push(...meta, '', mixed(q.help));
  if (q.importHelp) lines.push('', `*Import mode:* ${mixed(q.importHelp.replace(/^Import mode:\s*/, ''))}`);
  if (q.options.length > 0) {
    let group;
    const rows = q.options.map((o) => {
      const label = o.group && o.group !== group ? ((group = o.group), `*${mixed(o.group)}:* ${mixed(o.label)}`) : mixed(o.label);
      const note = [o.exclusive ? 'Alone.' : '', o.when ? `Only when ${describeCondition(o.when, facts)}.` : '']
        .filter(Boolean)
        .join(' ');
      return [code(o.id), label, writes(o), note];
    });
    lines.push('', table(['Option', 'Means', 'Writes', 'Note'], rows));
  }
  return lines.join('\n');
}

function flowFacts(flow) {
  return table(['Fact', 'Holds when'], Object.entries(flow.facts).map(([id, text]) => [code(id), mixed(text)]));
}

function changeOpensTable(flow) {
  return table(
    ['`changes` option', 'Opens'],
    Object.entries(flow.changeOpens).map(([id, qs]) => [code(id), codes(qs)])
  );
}

const GITHUB = 'https://github.com/vitness-me/fds-spec-website/blob/main';

/** The conformance tier files, in the order a reader meets them, and the tables they define. */
function conformanceTables(conformance) {
  const tiers = Object.entries(conformance)
    .filter(([, doc]) => doc.tier !== undefined)
    .sort(([, a], [, b]) => CONFORMANCE_TIERS.indexOf(a.tier) - CONFORMANCE_TIERS.indexOf(b.tier));
  const out = {};
  if (tiers.length === 0) return out;
  out['conformance#tiers'] = () =>
    table(
      ['Tier', 'Vectors', 'File', 'Data it reads'],
      tiers.map(([file, doc]) => [
        code(doc.tier),
        String(doc.vectors.length),
        `[\`${file}\`](${GITHUB}/${CONFORMANCE_DIR}/${file})`,
        [doc.words, doc.vocabulary].filter(Boolean).map((f) => `[\`${f}\`](${GITHUB}/${CONFORMANCE_DIR}/${f})`).join(', ') || '(none)',
      ])
    );
  const syntax = tiers.find(([, doc]) => doc.tier === 'syntax')?.[1];
  if (syntax?.codes) out['conformance#codes'] = () => table(['Code', 'Reported for'], Object.entries(syntax.codes).map(([c, text]) => [code(c), mixed(text)]));
  const resolver = tiers.find(([, doc]) => doc.tier === 'resolver')?.[1];
  if (resolver?.reasons) out['conformance#reasons'] = () => table(['Reason', 'Means'], Object.entries(resolver.reasons).map(([c, text]) => [code(c), mixed(text)]));
  return out;
}

/** Every region a page may ask for, by `<source>#<what>`. */
export function regionRenderers({ registries, flow, conformance = {} }) {
  const out = {};
  for (const [name, registry] of Object.entries(registries)) {
    if (registry.layers) out[`${name}#layers`] = () => layerTable(registry);
    for (const [vname, vocabulary] of Object.entries(registry.vocabularies ?? {})) {
      out[`${name}#${vname}`] = () => vocabularyTable(vocabulary);
    }
  }
  if (registries.fxi) out['fxi#equipmentTokens'] = () => equipmentTokenTable(registries.fxi.vocabularies.equipmentTokens);
  if (registries.fxe) {
    out['fxe#forms'] = () => formsTable(registries.fxe.vocabularies.forms, registries.fxe.vocabularies.kinds);
    out['fxe#cardioMachineTypes'] = () => cardioTable(registries.fxe.vocabularies.cardioMachineTypes);
  }
  out['flow#facts'] = () => flowFacts(flow);
  out['flow#changeOpens'] = () => changeOpensTable(flow);
  out['flow#questions'] = () => flow.questions.map((q) => questionSection(q, flow.facts)).join('\n\n');
  Object.assign(out, conformanceTables(conformance));
  return out;
}

const REGION = /<!-- fds:generated ([\w#.-]+) -->\n[\s\S]*?<!-- \/fds:generated -->/g;

/** Region names a markdown text asks for, in order. */
export const regionsIn = (markdown) => [...markdown.matchAll(REGION)].map((m) => m[1]);

/** Names of the regions whose content differs between two renderings of one page. */
export function changedRegions(before, after) {
  const a = [...before.matchAll(REGION)];
  const b = [...after.matchAll(REGION)];
  return a.filter((m, i) => m[0] !== b[i]?.[0]).map((m) => m[1]);
}

/**
 * The markdown with every generated region re-rendered. Unknown region names
 * are returned in `unknown` and left as they are.
 */
export function refreshRegions(markdown, renderers) {
  const unknown = [];
  const text = markdown.replace(REGION, (whole, name) => {
    const render = renderers[name];
    if (!render) {
      unknown.push(name);
      return whole;
    }
    return `<!-- fds:generated ${name} -->\n${render()}\n<!-- /fds:generated -->`;
  });
  return { text, unknown };
}
