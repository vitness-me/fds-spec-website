#!/usr/bin/env node
/**
 * The structural descriptor registries, the question flow and the pages that
 * render them agree with each other.
 *
 * The descriptor vocabularies live in `specification/registries/descriptors/`
 * and the owner question flow in `specification/descriptors/question-flow.json`.
 * The pages in `specification/descriptors/` render their code tables and the
 * whole written flow from those files, and also quote FXI, FXE and FXM strings
 * in prose and worked examples. That is the same content asserted in three
 * places, so this compares them:
 *
 *   1. Every registry is sound: each vocabulary has entries, every value is
 *      unique within it and has a description, and every cross-reference
 *      resolves — a parent, an opposite action, a "never with" code, an
 *      implied body point, an equipment token's FXE alias, a form's kind, a
 *      cardio type's layers. A registry file this check does not know how to
 *      read fails rather than ships unchecked.
 *   2. The question flow is sound: question ids are unique, every condition
 *      names a fact the flow defines or a question asked earlier, every fact is
 *      used, every `changes` option opens real questions, and every code an
 *      option writes is in a registry.
 *   3. Every generated region on a page is what the registries render today.
 *      A stale region names the command that refreshes it.
 *   4. Every FXI, FXE and FXM string quoted on a descriptor page — in prose,
 *      tables or code — has the current header, its layers in canonical order,
 *      and only codes the registries define. A worked example cannot quote a
 *      code the vocabulary dropped.
 *
 * What it does not prove: that a quoted string is *canonical* in every respect,
 * or that a worked example's answers build its result. Those need the full
 * builder, which FDS does not ship; the reference encoder is what checks them.
 *
 *   node scripts/check-descriptors.mjs              check
 *   node scripts/check-descriptors.mjs --self-test  prove it fails on the fixtures
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGE_DIR, REGISTRY_DIR, changedRegions, loadDescriptors, refreshRegions, regionRenderers, regionsIn } from './lib/descriptors.mjs';
import { assertRecordedFailures } from './lib/self-test.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SELF_TEST = process.argv.includes('--self-test');
const FIXTURES = join(REPO, 'scripts/fixtures/descriptors');
const ROOT = SELF_TEST ? FIXTURES : REPO;

const UNKNOWN = '?';
const GENERIC = '*';

const problems = [];
const fail = (key, message) => problems.push({ key, message });

const data = await loadDescriptors(ROOT);
const { registries, files, flow } = data;

// ── 1. registries ────────────────────────────────────────────────────────────

/** How each known registry is read. A registry without an entry here fails. */
const KNOWN = { fxi: checkFxi, fxe: checkFxe };

/** The values a vocabulary lists, built once per registry and vocabulary. Callers must not mutate the set. */
const valueSets = new WeakMap();
function valuesOf(registry, name) {
  if (!registry) return new Set();
  if (!valueSets.has(registry)) valueSets.set(registry, new Map());
  const sets = valueSets.get(registry);
  if (!sets.has(name)) sets.set(name, new Set((registry.vocabularies?.[name]?.entries ?? []).map((e) => e.value)));
  return sets.get(name);
}

for (const [name, registry] of Object.entries(registries)) {
  const file = `${REGISTRY_DIR}/${files[name]}`;
  if (!KNOWN[name]) {
    fail(`unknown-registry:${files[name]}`, `${file}: a descriptor registry this check does not know how to read ("${name}").\n    Add a reader to KNOWN in scripts/check-descriptors.mjs, or it ships unchecked.`);
    continue;
  }
  for (const field of ['descriptor', 'syntax', 'rules', 'policy', 'description']) {
    if (!registry[field]) fail(`field:${name}:${field}`, `${file}: missing "${field}".`);
  }
  for (const [vname, vocabulary] of Object.entries(registry.vocabularies ?? {})) {
    const where = `${file} ${vname}`;
    if (!vocabulary.entries?.length) fail(`empty:${name}.${vname}`, `${where}: no entries.`);
    const seen = new Set();
    for (const entry of vocabulary.entries ?? []) {
      if (seen.has(entry.value)) fail(`duplicate:${name}.${vname}:${entry.value}`, `${where}: "${entry.value}" is listed twice.`);
      seen.add(entry.value);
      if (!entry.description) fail(`description:${name}.${vname}:${entry.value}`, `${where}: "${entry.value}" has no description.`);
    }
    for (const entry of vocabulary.entries ?? []) {
      const ref = (what, code) => {
        if (!seen.has(code)) fail(`reference:${name}.${vname}:${entry.value}:${what}`, `${where}: "${entry.value}" names ${what} "${code}", which ${vname} does not list.`);
      };
      if (entry.parent !== undefined) ref('parent', entry.parent);
      if (entry.opposite !== undefined) ref('opposite', entry.opposite);
      for (const other of entry.conflictsWith ?? []) ref('a conflicting code', other);
    }
  }
  KNOWN[name](registry, file);
}

function checkFxi(fxi, file) {
  const points = valuesOf(fxi, 'bodyPoints');
  for (const o of fxi.vocabularies.orientations?.entries ?? []) {
    for (const p of o.impliedPoints ?? []) {
      if (!points.has(p)) fail(`implied:${o.value}:${p}`, `${file} orientations: "${o.value}" implies body point "${p}", which bodyPoints does not list.`);
    }
  }
  const joints = valuesOf(fxi, 'joints');
  for (const a of fxi.vocabularies.jointActions?.entries ?? []) {
    if (!joints.has(a.value.split('.')[0])) fail(`joint:${a.value}`, `${file} jointActions: "${a.value}" names a joint that joints does not list.`);
  }
  const fxe = registries.fxe;
  for (const t of fxi.vocabularies.equipmentTokens?.entries ?? []) {
    const errors = parseFxe(t.fxe, fxe);
    if (errors.length) fail(`alias:${t.value}`, `${file} equipmentTokens: "${t.value}" aliases ${t.fxe}, which is not a valid standard FXE: ${errors.join('; ')}.`);
  }
  const layers = fxi.layers?.map((l) => l.layer) ?? [];
  for (const [vname, v] of Object.entries(fxi.vocabularies)) {
    for (const l of String(v.layer).split(' ')) {
      if (!layers.includes(l)) fail(`layer:${vname}`, `${file} ${vname}: claims layer "${l}", which the registry's layers do not list.`);
    }
  }
}

function checkFxe(fxe, file) {
  const kinds = new Map((fxe.vocabularies.kinds?.entries ?? []).map((k) => [k.value, k]));
  const compliance = new Set([...valuesOf(fxe, 'compliance'), ...valuesOf(fxe, 'constraints')]);
  for (const f of fxe.vocabularies.forms?.entries ?? []) {
    if (!kinds.has(f.kind)) fail(`form-kind:${f.value}`, `${file} forms: "${f.value}" claims kind "${f.kind}", which kinds does not list.`);
    if (f.implies?.r !== undefined && !valuesOf(fxe, 'drives').has(f.implies.r)) fail(`implies:${f.value}:r`, `${file} forms: "${f.value}" implies drive "${f.implies.r}", which drives does not list.`);
    if (f.implies?.c !== undefined && !compliance.has(f.implies.c)) fail(`implies:${f.value}:c`, `${file} forms: "${f.value}" implies "${f.implies.c}", which neither compliance nor constraints lists.`);
  }
  const fxiPoints = new Set([...valuesOf(registries.fxi, 'bodyPoints'), ...valuesOf(registries.fxi, 'holdOnlyPoints')]);
  for (const i of fxe.vocabularies.loadInterfaces?.entries ?? []) {
    for (const p of i.holdPoints ?? []) if (!fxiPoints.has(p)) fail(`hold:${i.value}:${p}`, `${file} loadInterfaces: "${i.value}" fits hold point "${p}", which the FXI registry does not list.`);
  }
  const orientations = valuesOf(registries.fxi, 'orientations');
  for (const p of fxe.vocabularies.postures?.entries ?? []) {
    for (const o of p.orientations ?? []) if (!orientations.has(o)) fail(`orient:${p.value}:${o}`, `${file} postures: "${p.value}" fits orientation "${o}", which the FXI registry does not list.`);
  }
  for (const t of fxe.vocabularies.cardioMachineTypes?.entries ?? []) {
    const errors = parseFxe(`FXE=${fxe.syntax}S/k:erg/c:${t.c}/l:${t.l}/s:${t.s}/m:${t.m}`, fxe);
    if (errors.length) fail(`cardio:${t.value}`, `${file} cardioMachineTypes: "${t.value}" writes an invalid FXE: ${errors.join('; ')}.`);
    if (!fxiPoints.has(t.hold)) fail(`cardio-hold:${t.value}`, `${file} cardioMachineTypes: "${t.value}" holds at "${t.hold}", which the FXI registry does not list.`);
  }
}

// ── strings ──────────────────────────────────────────────────────────────────

/** Codes an FXE layer may hold, by kind. */
function fxeValues(fxe, kind, layer, standard) {
  const v = (name) => valuesOf(fxe, name);
  if (layer === 'f') return new Set((fxe.vocabularies.forms?.entries ?? []).filter((f) => f.kind === kind).map((f) => f.value));
  if (layer === 'l') return v('loadInterfaces');
  if (layer === 's') return v('postures');
  if (layer === 'm') {
    if (kind === 'erg') return v('cycles');
    const out = new Set(v('singleJointMotions'));
    for (const verb of v('guidedMotionVerbs')) for (const d of v('guidedMotionDirections')) out.add(`${verb}.${d}`);
    return out;
  }
  if (layer === 'c') return standard ? v('tracks') : kind === 'imp' || kind === 'sup' ? v('compliance') : v('constraints');
  if (layer === 'r') return v('drives');
  if (layer === 'g') return v('guideAngles');
  if (layer === 'a') return v('designAttributes');
  return new Set();
}

/** Header, layer membership and order, and codes of an FXE. Not full canonicalisation. */
function parseFxe(text, fxe) {
  if (!fxe) return ['no FXE registry'];
  const problems = [];
  const head = /^FXE=(\d+\.\d+)([SN])\/(.*)$/.exec(text);
  if (!head) return [`"${text}" does not start FXE=<major>.<revision><S|N>/`];
  if (head[1] !== fxe.syntax) problems.push(`header FXE=${head[1]}, the registry is FXE=${fxe.syntax}`);
  const kinds = new Map((fxe.vocabularies.kinds?.entries ?? []).map((k) => [k.value, k]));
  let extended = false;
  for (const config of head[3].split(';')) {
    const parts = config.split('/').map((p) => p.split(':'));
    const [k, kind] = parts[0] ?? [];
    if (k !== 'k') { problems.push(`a configuration starts with k:, not "${parts[0]?.join(':')}"`); continue; }
    if (kind === UNKNOWN) { if (parts.length > 1) problems.push('k:? takes no other layer'); continue; }
    const entry = kinds.get(kind);
    if (!entry) { problems.push(`"${kind}" is not a kind`); continue; }
    const order = [...entry.standard, ...entry.extended];
    const written = parts.slice(1).map(([l]) => l);
    for (const l of entry.standard) if (!written.includes(l)) problems.push(`k:${kind} always writes ${l}`);
    let last = -1;
    for (const [layer, value] of parts.slice(1)) {
      const at = order.indexOf(layer);
      if (at < 0) { problems.push(`layer ${layer} does not apply to k:${kind}`); continue; }
      if (at < last) problems.push(`layer ${layer} is out of order`);
      last = at;
      const standard = entry.standard.includes(layer);
      if (!standard) extended = true;
      const allowed = fxeValues(fxe, kind, layer, standard);
      for (const code of String(value).split('+')) {
        if (code !== UNKNOWN && !allowed.has(code)) problems.push(`"${code}" is not a ${layer} code for k:${kind}`);
      }
    }
  }
  if ((head[2] === 'N') !== extended) problems.push(`flag ${head[2]}, but ${extended ? 'an extended layer is' : 'no extended layer is'} written`);
  return problems;
}

/** Header, layer order and codes of an FXI. Not full canonicalisation. */
function parseFxi(text, fxi) {
  const problems = [];
  const head = /^FXI=(\d+\.\d+)([SN])\/(.*)$/.exec(text);
  if (!head) return [`"${text}" does not start FXI=<major>.<revision><S|N>/`];
  if (head[1] !== fxi.syntax) problems.push(`header FXI=${head[1]}, the registry is FXI=${fxi.syntax}`);
  const order = fxi.layers.map((l) => l.layer);
  const v = (name) => valuesOf(fxi, name);
  const tokens = v('equipmentTokens');
  const points = new Set([...v('bodyPoints'), ...v('holdOnlyPoints')]);
  const joints = new Map((fxi.vocabularies.joints?.entries ?? []).map((j) => [j.value, j]));
  const prefixes = [...v('phasePrefixes')].filter(Boolean);
  const grips = new Set([...v('handOrientations'), ...v('gripWidths'), ...v('stances')]);
  const known = (set, code, what) => { if (code !== UNKNOWN && !set.has(code)) problems.push(`"${code}" is not ${what}`); };
  const CODES = {
    o: (x) => x.split('>').forEach((c) => c !== GENERIC && known(v('orientations'), c, 'an orientation')),
    k: (x) => x !== GENERIC && known(v('movingEnds'), x, 'a moving end'),
    f: (x) => x.split('>').forEach((c) => known(v('footwork'), c, 'a footwork code')),
    s: (x) => x !== GENERIC && x.split('+').forEach((item) => {
      const [surface, pts] = item.split('@');
      known(tokens, surface, 'an equipment token');
      (pts ?? '').split(',').filter(Boolean).forEach((p) => known(v('bodyPoints'), p, 'a body point'));
    }),
    l: (x) => x !== GENERIC && x.split('+').forEach((item) => {
      const [head, hold] = item.split('@');
      known(tokens, head.split('*')[0], 'an equipment token');
      if (hold !== undefined) known(points, hold, 'a hold point');
    }),
    x: (x) => x !== GENERIC && x.split('+').forEach((item) => {
      const [c, scope] = item.split('@');
      known(v('symmetry'), c, 'a symmetry code');
      if (scope !== undefined) known(v('symmetryScopes'), scope, 'a symmetry scope');
    }),
    g: (x) => x !== GENERIC && x.split('>').forEach((ph) => ph.split('+').forEach((c) => known(grips, c, 'a grip or stance code'))),
    r: (x) => x !== GENERIC && x.split('+').forEach((c) => known(v('ranges'), c, 'a range code')),
    h: (x) => x !== GENERIC && x.split('+').forEach((c) => known(v('heldPostures'), c, 'a held posture')),
    p: (x) => x !== GENERIC && x.split('+').forEach((c) => known(v('lines'), c, 'a line of pull')),
    a: (x) => x !== GENERIC && x.split('+').forEach((c) => known(v('accessories'), c, 'an accessory')),
    m: (x) => x.split('>').forEach((phase) => phase.split('|').forEach((part) => {
      const body = prefixes.includes(part[0]) ? part.slice(1) : part;
      if (body === UNKNOWN || body === '0') return;
      body.split('+').forEach((action) => {
        const a = action.replace(/-$/, '');
        const [joint, act] = a.split('.');
        if (act === UNKNOWN || act === 'circ') {
          if (!joints.has(joint)) problems.push(`"${a}" names no joint`);
          else if (act === 'circ' && !joints.get(joint).circles) problems.push(`"${joint}" does not take .circ`);
        } else known(v('jointActions'), a, 'a joint action');
      });
    })),
  };
  let last = -1;
  let extended = false;
  for (const part of head[3].split('/')) {
    const i = part.indexOf(':');
    const layer = part.slice(0, i);
    const at = order.indexOf(layer);
    if (at < 0) { problems.push(`"${layer}" is not a layer`); continue; }
    if (at <= last) problems.push(`layer ${layer} is out of order or repeated`);
    last = at;
    if (!fxi.layers[at].standard) extended = true;
    CODES[layer](part.slice(i + 1));
  }
  for (const required of ['m', 'o', 'l']) if (!head[3].split('/').some((p) => p.startsWith(`${required}:`))) problems.push(`layer ${required} is always written`);
  if ((head[2] === 'N') !== extended) problems.push(`flag ${head[2]}, but ${extended ? 'an extended layer is' : 'no extended layer is'} written`);
  return problems;
}

function parseFxm(text, syntax) {
  const m = /^FXM=(\d+\.\d+)\/(g:)?([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?:\.([a-z][a-z0-9]*(?:-[a-z0-9]+)*))?$/.exec(text);
  if (!m) return [`"${text}" is not FXM=<major>.<revision>/<muscle>[.<part>] or FXM=<major>.<revision>/g:<group>`];
  if (m[2] && m[4]) return [`"${text}": a group has no part`];
  if (m[1] !== syntax) return [`header FXM=${m[1]}, the descriptors are at ${syntax}`];
  return [];
}

// ── 2. the question flow ─────────────────────────────────────────────────────

{
  const where = 'specification/descriptors/question-flow.json';
  const facts = new Set(Object.keys(flow.facts ?? {}));
  const usedFacts = new Set();
  const asked = new Set();
  const allCodes = new Set();
  for (const r of Object.values(registries)) for (const v of Object.values(r.vocabularies ?? {})) for (const e of v.entries ?? []) allCodes.add(e.value);
  for (const j of registries.fxi?.vocabularies?.joints?.entries ?? []) if (j.circles) allCodes.add(`${j.value}.circ`);

  const checkCond = (c, qid) => {
    if (!c) return;
    if ('fact' in c) {
      usedFacts.add(c.fact);
      if (!facts.has(c.fact)) fail(`fact:${qid}:${c.fact}`, `${where}: ${qid} depends on fact "${c.fact}", which facts does not define.`);
    } else if ('not' in c) checkCond(c.not, qid);
    else if ('all' in c || 'any' in c) (c.all ?? c.any).forEach((x) => checkCond(x, qid));
    else if (!asked.has(c.q)) fail(`order:${qid}:${c.q}`, `${where}: ${qid} depends on "${c.q}", which is not a question asked before it.`);
  };

  const ids = flow.questions.map((q) => q.id);
  for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) fail(`duplicate-question:${id}`, `${where}: question "${id}" appears twice.`);

  for (const q of flow.questions) {
    checkCond(q.when, q.id);
    const optionIds = q.options.map((o) => o.id);
    for (const id of optionIds.filter((id, i) => optionIds.indexOf(id) !== i)) fail(`duplicate-option:${q.id}:${id}`, `${where}: ${q.id} lists option "${id}" twice.`);
    for (const o of q.options) {
      checkCond(o.when, `${q.id}/${o.id}`);
      // Phase questions write joint actions and prefixes; the shoulder options write `+`-joined actions.
      if (o.value === undefined || o.value === '' || o.value === UNKNOWN || o.value === GENERIC || /^[1-4]$/.test(o.value)) continue;
      for (const atom of o.value.split(/[+>]/)) {
        const bare = atom.replace(/^[\^~=%&]/, '');
        if (bare === '' || bare === '0' || allCodes.has(bare) || allCodes.has(atom)) continue;
        fail(`option-code:${q.id}:${o.id}`, `${where}: ${q.id} option "${o.id}" writes "${atom}", which no descriptor registry lists.`);
      }
    }
    asked.add(q.id);
    // A repeated phase question stands for every phase, so later phases' ids are asked too.
    if (q.repeatsPerPhase) for (let n = 2; n <= (flow.maxPhases ?? 1); n++) asked.add(q.id.replace(/^p1/, `p${n}`));
  }
  for (const f of facts) if (!usedFacts.has(f)) fail(`unused-fact:${f}`, `${where}: fact "${f}" is defined and no condition uses it.`);
  const changes = flow.questions.find((q) => q.id === 'changes');
  for (const [option, opens] of Object.entries(flow.changeOpens ?? {})) {
    if (!changes?.options.some((o) => o.id === option)) fail(`opens-option:${option}`, `${where}: changeOpens names "${option}", which is not a changes option.`);
    for (const id of opens) if (!asked.has(id)) fail(`opens:${option}:${id}`, `${where}: changes option "${option}" opens "${id}", which is not a question.`);
  }
}

// ── 3 and 4. the pages ───────────────────────────────────────────────────────

const renderers = regionRenderers(data);
const pages = (await readdir(join(ROOT, PAGE_DIR))).filter((f) => f.endsWith('.md')).sort();
let quoted = 0;
let regions = 0;
for (const file of pages) {
  const path = `${PAGE_DIR}/${file}`;
  const text = await readFile(join(ROOT, path), 'utf8');
  const { text: fresh, unknown } = refreshRegions(text, renderers);
  for (const name of unknown) fail(`unknown-region:${file}:${name}`, `${path}: region "${name}" is not one the registries can render.`);
  regions += regionsIn(text).length;
  if (fresh !== text) {
    fail(
      `stale:${file}`,
      `${path}: region ${changedRegions(text, fresh).join(', ')} differs from what the registries render today.\n` +
        '    Run `npm run build:descriptors` and commit what it writes.'
    );
  }
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    // A string ends at whitespace, a backtick, a quote or a table bar; trailing sentence punctuation is not part of it.
    for (const [, kind, raw] of line.matchAll(/(?<![\w-])(FXI|FXE|FXM)=([^\s`'"|]*)/g)) {
      const body = raw.replace(/[.,;:)\]]+$/, '');
      const s = `${kind}=${body}`;
      // A form written to explain the grammar, with placeholders or an ellipsis, is not a string.
      if (/[<…]/.test(s) || /^(FXI|FXE|FXM)=\d+\/$/.test(s) || body === '') continue;
      if (/^FX[IEM]=\d+\.\d+[SN]?\/?$/.test(s)) continue; // a bare header, named in prose
      const errors = kind === 'FXI' ? parseFxi(s, registries.fxi) : kind === 'FXE' ? parseFxe(s, registries.fxe) : parseFxm(s, registries.fxi.syntax);
      quoted += 1;
      if (errors.length) fail(`string:${file}:${s}`, `${path}:${i + 1}: ${s}\n    ${errors.join('\n    ')}`);
    }
  });
}

// ── result ───────────────────────────────────────────────────────────────────

if (SELF_TEST) await assertRecordedFailures(join(FIXTURES, 'expected-failures.txt'), problems.map((p) => p.key));

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ${p.message}\n`);
  process.exit(1);
}

const codeCount = Object.values(registries).reduce((n, r) => n + Object.values(r.vocabularies ?? {}).reduce((m, v) => m + v.entries.length, 0), 0);
console.log(
  `  ok    ${Object.keys(registries).length} descriptor registries (${codeCount} codes), ` +
    `${flow.questions.length} questions, ${regions} generated regions current, ${quoted} quoted strings valid.`
);
