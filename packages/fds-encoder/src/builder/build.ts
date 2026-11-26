// Turns answers to the question flow into the written exercise key and equipment key, through the package's own parser.
// The same answers always give the same keys. Invalid or contradictory answers raise AnswerError.
import { FORMS, GENERIC, HELD_CONFLICTS, MAC_VERBS, UNKNOWN } from '../alphabet';
import { mainEquipment } from '../crosscheck';
import { FXE_HEADER, FXI_HEADER } from '../headers';
import { oppositePair, parseFxe, parseFxi } from '../syntax';
import { ERG_TYPES } from './cardio';
import { CHANGE_OPENS, JOINT_IDS, PHASE_KINDS, QUESTIONS, QUESTION_BY_ID } from './flow';
import type { Cond, FactId, FlowQuestion } from './flow';

export type Answer = string | readonly string[];
export type Answers = Readonly<Record<string, Answer>>;

/** One exercise or piece of equipment to describe: an id of the caller's choosing and the answers, by question id. */
export interface Entry {
  readonly id: string;
  readonly answers: Answers;
}

/**
 * A built entry. For an exercise, `fxi` is its exercise key and `fxe` the equipment key of its main equipment. For
 * equipment on its own, `fxi` is null and `fxe` is its whole equipment key, extended layers included when build details
 * were given. `path` lists the questions asked, in order.
 */
export interface Built { readonly id: string; readonly fxi: string | null; readonly fxe: string; readonly path: readonly string[] }

/** The answers are incomplete, invalid or contradictory. `problems` says what to fix, one line each. */
export class AnswerError extends Error {
  constructor(readonly entryId: string, readonly problems: readonly string[]) {
    super(`${entryId}: ${problems.join(' | ')}`);
    this.name = 'AnswerError';
  }
  static of(entryId: string, problems: readonly string[]): AnswerError { return new AnswerError(entryId, [...new Set(problems)]); }
}
/** The builder wrote a key its own parser rejects. This is a defect in the builder, never in the answers. */
export class InternalError extends Error {}

const FXI_HEAD = `${FXI_HEADER}/`;
const FXE_HEAD = `${FXE_HEADER}/`;

/** The station form atoms (`cable`, `smith`, `landmine`). */
const STATIONS = Object.keys(FORMS).filter((code) => FORMS[code]!.k === 'stn');
/** Start orientations under which a stance is recorded: the body stands, or it is not known. */
const STANCE_ORIENTATIONS = ['standing', 'standing.bent', 'standing.chest', '*', UNKNOWN];

/** The load interface, a body point, that a machine's guided motion implies when nothing says otherwise. */
function defaultInterface(m: string): string | undefined {
  if (/^(push|pull)\./.test(m) || m.startsWith('el.') || m === 'sc.elev' || m === 'sh.habd') return 'hands';
  if (m === 'kn.flex' || m === 'kn.ext' || m === 'hip.flex') return 'ankles';
  if (['sh.hadd', 'sh.abd', 'sh.flex', 'sh.ext'].includes(m)) return 'arms';
  if (m === 'hip.add' || m === 'hip.abd') return 'thighs';
  if (m === 'sp.flex' || m === 'sp.rot') return 'chest';
  if (m === 'sp.ext') return 'back';
  if (m === 'assist.up') return 'knees';
  return undefined;
}

/** The posture, an orientation, that a machine's guided motion and load interface imply when nothing says otherwise. */
function defaultPosture(m: string, iface: string): string {
  if (m.startsWith('assist.')) return 'hanging';
  if (m === 'sh.habd') return 'seated.chest';
  if (m === 'push.fwd' && iface === 'feet') return 'supine.incline';
  if (m === 'push.up' && (iface === 'shoulders' || iface === 'hips')) return 'standing';
  if (m === 'kn.ext' || m.startsWith('el.') || m.startsWith('sh.') || ['sp.flex', 'sp.rot', 'hip.add', 'hip.abd', 'hip.flex', 'pull.down', 'pull.backdown'].includes(m)) return 'seated';
  if (m.startsWith('push.') && iface === 'hands') return 'seated';
  if (m === 'sc.elev' || m === 'hip.ext' || m === 'pull.up') return 'standing';
  return UNKNOWN;
}

/** The chest-supported orientation of each position a chest pad can support, and back. */
const CHEST_PAD: Readonly<Record<string, string>> = { seated: 'seated.chest', 'seated.bent': 'seated.chest', standing: 'standing.chest', 'standing.bent': 'standing.chest' };
const NO_CHEST_PAD: Readonly<Record<string, string>> = { 'seated.chest': 'seated', 'standing.chest': 'standing' };

/** The orientation with the start position changed by the machine's chest-pad answer: `yes` adds the pad, `no` removes it. */
function withChestPad(r: Reading, o: string): string {
  const a = r.one('mac.chest');
  if (a === undefined || a === 'usual') return o;
  const [start = '', ...rest] = o.split('>');
  return [(a === 'yes' ? CHEST_PAD : NO_CHEST_PAD)[start] ?? start, ...rest].join('>');
}

interface LoadItem { kind: 'none' | 'imp' | 'stn' | 'mac' | 'erg' | 'unknown'; token: string }

/** Reads answers against the flow. Holds the normalised answers and computes facts and layer values from them. */
class Reading {
  readonly problems: string[] = [];
  readonly given = new Map<string, string[]>();
  constructor(readonly entryId: string) {}

  one(q: string): string | undefined { return this.given.get(q)?.[0]; }
  many(q: string): string[] { return this.given.get(q) ?? []; }
  asked(q: string): boolean { return this.given.has(q); }
  value(q: string, option: string): string {
    return QUESTION_BY_ID.get(q)?.options.find((o) => o.id === option)?.value ?? option;
  }
  fail(msg: string): undefined { this.problems.push(msg); return undefined; }
  changed(id: string): boolean { return this.many('changes').includes(id); }

  fact(id: FactId): boolean {
    switch (id) {
      case 'exercise': return this.one('subject') !== 'equipment';
      case 'equipment': return this.one('subject') === 'equipment';
      case 'load-holdable': { const f = this.firstLoad(); return f !== undefined && (f.kind === 'imp' || f.kind === 'stn'); }
      case 'load-band': return this.loadItems().some((i) => i.token === 'band');
      case 'load-machine': return this.firstLoad()?.kind === 'mac';
      case 'load-cardio': return this.firstLoad()?.kind === 'erg';
      case 'contact-has-usual': return this.hasUsualContact('mac');
      case 'eq-contact-has-usual': return this.hasUsualContact('eq.mac');
      case 'eq2-contact-has-usual': return this.hasUsualContact('eq2.mac');
      case 'stance-recorded': return STANCE_ORIENTATIONS.includes(this.startOrientation()) || this.footPlate();
    }
  }

  /** True when the machine block's guided motion implies a load interface. */
  private hasUsualContact(prefix: string): boolean {
    const m = this.macMotion(prefix);
    return m !== undefined && defaultInterface(m) !== undefined;
  }

  /** The start orientation as answered so far, `?` when not answered. */
  startOrientation(): string {
    const a = this.one('orientation');
    return (a === undefined ? UNKNOWN : this.value('orientation', a)).split('>')[0]!;
  }

  /** True when the load is a strength machine whose moving part meets the feet (leg press). */
  footPlate(): boolean {
    if (this.firstLoad()?.kind !== 'mac') return false;
    const c = this.one('mac.contact');
    if (c !== undefined && c !== 'usual') return c === 'feet';
    const m = this.macMotion('mac');
    return (m === undefined ? undefined : defaultInterface(m)) === 'feet';
  }

  /** The guided motion of a machine block as answered so far; undefined when it can't be resolved. */
  macMotion(prefix: string): string | undefined {
    const mv = this.one(`${prefix}.motion`);
    if (mv === undefined) return undefined;
    if (mv === 'unknown') return UNKNOWN;
    if (!MAC_VERBS.includes(mv)) return mv;
    const d = this.one(`${prefix}.direction`);
    if (d === undefined) return undefined;
    if (d === 'unknown') return UNKNOWN;
    return `${mv}.${d}`;
  }

  // ── load ──

  private itemFromToken(token: string): LoadItem {
    if (token === 'none') return { kind: 'none', token };
    if (token === 'mac') return { kind: 'mac', token };
    if (token === 'erg' || token.startsWith('erg.')) return { kind: 'erg', token };
    if (STATIONS.includes(token)) return { kind: 'stn', token };
    return { kind: 'imp', token };
  }
  firstLoad(): LoadItem | undefined {
    const a = this.one('load');
    if (a === undefined) return undefined;
    if (a === 'unknown') return { kind: 'unknown', token: UNKNOWN };
    if (a === 'implement') {
      const t = this.one('imp1');
      return t === undefined ? undefined : { kind: 'imp', token: t === 'unknown' ? UNKNOWN : t };
    }
    return this.itemFromToken(this.value('load', a));
  }
  loadItems(): LoadItem[] {
    const first = this.firstLoad();
    const out = first === undefined ? [] : [first];
    const t2 = this.one('imp2');
    if (t2 !== undefined) out.push(this.itemFromToken(t2 === 'unknown' ? UNKNOWN : t2));
    return out;
  }
}

// ───────────────────────────── conditions and the walk ─────────────────────────────

function holds(c: Cond, r: Reading): boolean {
  if ('fact' in c) return r.fact(c.fact);
  if ('not' in c) return !holds(c.not, r);
  if ('all' in c) return c.all.every((x) => holds(x, r));
  if ('any' in c) return c.any.some((x) => holds(x, r));
  if ('is' in c) { const v = r.one(c.q); return v !== undefined && (typeof c.is === 'string' ? v === c.is : c.is.includes(v)); }
  if ('has' in c) return r.many(c.q).includes(c.has);
  const v = Number(r.one(c.q));
  return Number.isFinite(v) && v >= c.atLeast;
}

/** The options of a question that apply, given the answers so far. A UI shows only these. */
export function openOptions(q: FlowQuestion, r: Reading): FlowQuestion['options'] {
  return q.options.filter((o) => o.when === undefined || holds(o.when, r));
}

/** Supplies an answer for a question on the path, or undefined when there is none. */
export type Provider = (q: FlowQuestion, reading: Reading) => Answer | undefined;

function walk(entryId: string, provide: Provider, extra: readonly string[]): { reading: Reading; path: string[] } {
  const r = new Reading(entryId);
  const path: string[] = [];
  for (const id of extra) if (!QUESTION_BY_ID.has(id)) r.fail(`"${id}" is not a question.`);
  for (const q of QUESTIONS) {
    if (q.when !== undefined && !holds(q.when, r)) continue;
    path.push(q.id);
    const a = provide(q, r);
    if (a === undefined) { r.fail(`${q.id}: no answer. ${q.text}`); continue; }
    const list = typeof a === 'string' ? [a] : [...a];
    if (q.select === 'one' && (typeof a !== 'string')) { r.fail(`${q.id}: give one option id as a string.`); continue; }
    if (q.select === 'many' && typeof a === 'string') { r.fail(`${q.id}: give a list of option ids, even for one choice.`); continue; }
    if (list.length === 0) { r.fail(`${q.id}: pick at least one option.`); continue; }
    const bad = list.filter((x) => !q.options.some((o) => o.id === x));
    if (bad.length > 0) { r.fail(`${q.id}: ${bad.map((b) => `"${b}"`).join(', ')} is not an option. Options: ${q.options.map((o) => o.id).join(', ')}.`); continue; }
    if (new Set(list).size !== list.length) { r.fail(`${q.id}: an option is repeated.`); continue; }
    if (q.max !== undefined && list.length > q.max) { r.fail(`${q.id}: pick at most ${q.max}.`); continue; }
    const excl = list.filter((x) => q.options.find((o) => o.id === x)!.exclusive);
    if (excl.length > 0 && list.length > 1) { r.fail(`${q.id}: "${excl[0]}" cannot be combined with other options.`); continue; }
    const closed = list.map((x) => q.options.find((o) => o.id === x)!).filter((o) => o.when !== undefined && !holds(o.when, r));
    if (closed.length > 0) { r.fail(`${q.id}: "${closed[0]!.id}" does not apply here: ${closed[0]!.whenNot ?? 'its condition does not hold'}.`); continue; }
    r.given.set(q.id, [...list].sort());
  }
  return { reading: r, path };
}

// ───────────────────────────── assembly ─────────────────────────────

const PREFIX: Readonly<Record<string, string>> = Object.fromEntries(PHASE_KINDS.map((k) => [k.id, k.value ?? '']));

function opposite(actions: string[]): string | undefined {
  const pair = oppositePair(actions);
  return pair === undefined ? undefined : `${pair[0]} and ${pair[1]}`;
}

function partFromAnswers(r: Reading, p: string, where: string): string | undefined {
  const kind = r.one(`${p}.kind`)!;
  if (kind === 'unknown') return UNKNOWN;
  if (kind === 'balance') return '=0';
  const prefix = kind === 'usual' ? '' : PREFIX[kind]!;
  const joints = r.many(`${p}.joints`);
  if (joints.includes('unknown')) return prefix === '' ? UNKNOWN : `${prefix}${UNKNOWN}`;
  const short = r.many(`${p}.short`).filter((x) => x !== 'usual');
  for (const j of short) if (!joints.includes(j)) r.fail(`${p}.short: "${j}" is not one of the joints that move in ${where}.`);
  const actions: string[] = [];
  for (const j of JOINT_IDS.filter((x) => joints.includes(x))) {
    const dirs = r.many(`${p}.${j}`).flatMap((d) => (d === 'unknown' ? [`${j}.?`] : r.value(`${p}.${j}`, d).split('+')));
    for (const a of [...new Set(dirs)]) {
      if (short.includes(j)) {
        if (a.endsWith('.?') || a.endsWith('.circ')) r.fail(`${p}.short: a short drive needs a named direction; "${j}" has ${a.endsWith('.?') ? 'an unknown direction' : 'circles'}.`);
        actions.push(`${a}-`);
      } else actions.push(a);
    }
  }
  const clash = opposite(actions.map((a) => a.replace(/-$/, '')));
  if (clash !== undefined) r.fail(`${where}: ${clash} cannot happen in one phase. Split them into two phases.`);
  return prefix + actions.join('+');
}

function motion(r: Reading): string | undefined {
  const n = r.one('motion.phases');
  if (n === undefined) return undefined;
  if (n === 'unknown') return UNKNOWN;
  const phases: string[] = [];
  for (let i = 1; i <= Number(n); i++) {
    const parts = [partFromAnswers(r, `p${i}`, `phase ${i}`)];
    if (r.one(`p${i}.also`) === 'yes') parts.push(partFromAnswers(r, `p${i}b`, `the second part of phase ${i}`));
    if (parts.length > 1 && parts.includes(UNKNOWN)) r.fail(`phase ${i}: a phase with two parts cannot have an unknown part. Answer "I don't know" for the whole phase instead.`);
    phases.push(parts.filter((x) => x !== undefined).join('|'));
  }
  return phases.join('>');
}

function orientation(r: Reading): string | undefined {
  const a = r.one('orientation');
  if (a === undefined) return undefined;
  let o = r.value('orientation', a);
  const end = r.one('orientation.end');
  if (end !== undefined && end !== 'usual') {
    const e = r.value('orientation.end', end);
    if (o === '*') return r.fail('orientation.end: a rep that may start either way cannot have a fixed end position.');
    if (e === o) return r.fail('orientation.end: the end position is the start position; answer "usual" instead.');
    o = `${o}>${e}`;
  }
  return withChestPad(r, o);
}

/** The code an answer writes, or undefined (the layer's default) when the question was not asked or `usual` was picked. */
function answered(r: Reading, q: string): string | undefined {
  const a = r.one(q);
  return a === undefined || a === 'usual' ? undefined : r.value(q, a);
}

function support(r: Reading): string | undefined {
  const a = r.one('support');
  if (a === undefined || a === 'usual' || a === 'none') return undefined;
  if (a === 'unknown') return UNKNOWN;
  const items: string[] = [];
  for (const n of r.one('sup.more') === 'yes' ? [1, 2] : [1]) {
    const surf = r.one(`sup${n}.surface`)!;
    const pts = r.many(`sup${n}.points`).filter((p) => p !== 'usual').map((p) => r.value(`sup${n}.points`, p));
    items.push(`${surf === 'unknown' ? UNKNOWN : surf}${pts.length > 0 ? `@${pts.join(',')}` : ''}`);
  }
  if (items.length === 2 && items[0] === items[1]) return r.fail('sup2: the second support is the same as the first.');
  return items.join('+');
}

function symmetry(r: Reading): string | undefined {
  const a = r.one('symmetry');
  if (a === undefined || a === 'usual' || a === 'b') return undefined;
  if (a === 'unknown') return UNKNOWN;
  if (a === 'split') {
    const items = (['arms', 'legs'] as const).map((limb) => [r.one(`symmetry.${limb}`) ?? 'usual', limb] as const)
      .filter(([v]) => v !== 'usual' && v !== 'b').map(([v, limb]) => `${v}@${limb}`);
    return items.length > 0 ? items.join('+') : undefined;
  }
  const scope = r.one('symmetry.scope');
  return scope === undefined || scope === 'usual' ? a : `${a}@${scope}`;
}

function grip(r: Reading, start: string): string | undefined {
  let hands: (string | undefined)[] = [undefined];
  const h = r.one('grip.hand');
  if (h !== undefined && h !== 'usual') {
    if (h === 'turn') {
      const s = r.one('grip.start')!;
      const e = r.one('grip.end')!;
      if (s === e) r.fail('grip.end: the palms end the way they start; that is not a turn. Pick one hand orientation instead.');
      hands = [s, e];
    } else hands = [h === 'unknown' ? UNKNOWN : h];
  }
  const width = answered(r, 'grip.width');
  const stance = answered(r, 'stance');
  const st = r.one('stance');
  if (st !== undefined && st !== 'usual' && !STANCE_ORIENTATIONS.includes(start) && !r.footPlate()) {
    r.fail(`stance: stance is recorded only for standing exercises and foot-plate machines, and this one starts ${start}. Answer "usual", or change the body position.`);
  }
  const out = hands.map((hand) => [hand, width, stance].filter((x): x is string => x !== undefined && x !== '').join('+'));
  const text = out.filter((x) => x !== '').length === 0 ? '' : out.map((x) => (x === '' ? 'w-m' : x)).join('>');
  return text === '' ? undefined : text;
}

function range(r: Reading): string | undefined {
  const out = [answered(r, 'range.depth'), answered(r, 'range.start')].filter((c): c is string => c !== undefined && c !== '');
  return out.length > 0 ? [...new Set(out)].join('+') : undefined;
}

function nameSet(r: Reading, q: string): string | undefined {
  const a = r.many(q);
  if (a.length === 0 || a.includes('usual')) return undefined;
  if (q === 'line' && ['hi', 'lo', 'side'].filter((x) => a.includes(x)).length > 1) return r.fail('line: pick one of higher, lower or from the side.');
  const values = a.map((x) => r.value(q, x));
  const clash = q === 'held' ? HELD_CONFLICTS.find(([x, y]) => values.includes(x) && values.includes(y)) : undefined;
  if (clash !== undefined) return r.fail(`held: "${clash[0]}" and "${clash[1]}" cannot both be held. Pick one.`);
  return values.join('+');
}

interface Machine { m: string; l: string }

function machine(r: Reading): Machine | undefined {
  if (!r.asked('mac.motion')) return undefined;
  const m = r.macMotion('mac') ?? r.fail('mac.motion: pick what the machine guides and its direction.');
  const c = r.one('mac.contact')!;
  let l: string | undefined;
  if (c === 'usual') l = (m === undefined ? undefined : defaultInterface(m)) ?? r.fail(`mac.contact: the machine motion "${m ?? '?'}" has no default contact. Pick where it meets the body.`);
  else l = c === 'unknown' ? UNKNOWN : c;
  return m === undefined || l === undefined ? undefined : { m, l };
}

function ergType(r: Reading): string | undefined {
  const a = r.one('erg.type');
  if (a === undefined) return undefined;
  return a === 'unknown' ? UNKNOWN : a;
}

function ergFxe(type: string | undefined): string {
  const e = type === undefined || type === UNKNOWN ? undefined : ERG_TYPES[type];
  return e === undefined ? `${FXE_HEAD}k:erg/c:?/l:?/s:?/m:?` : `${FXE_HEAD}k:erg/c:${e.c}/l:${e.l}/s:${e.s}/m:${e.m}`;
}

function loadLayer(r: Reading, mac: Machine | undefined, erg: string | undefined): string | undefined {
  const items = r.loadItems();
  if (items.length === 0) return undefined;
  const out: string[] = [];
  items.forEach((it, i) => {
    const slot = i + 1;
    if (it.kind === 'none') { out.push('none'); return; }
    if (it.kind === 'unknown') { out.push(UNKNOWN); return; }
    if (it.kind === 'mac') {
      const hold = mac === undefined ? UNKNOWN : mac.m.startsWith('assist.') ? 'assist' : mac.l;
      out.push(`mac@${hold}`);
      return;
    }
    if (it.kind === 'erg') {
      const known = erg === undefined || erg === UNKNOWN ? undefined : ERG_TYPES[erg];
      out.push(known === undefined ? `erg@${UNKNOWN}` : `erg.${known.m}@${known.hold}`);
      return;
    }
    const q = `hold${slot}`;
    const a = r.one(q);
    const hold = a === undefined ? r.fail(`${q}: pick where "${it.token}" is held.`) : r.value(q, a);
    if (hold === undefined) return;
    const c = slot === 1 ? r.one('count1') : undefined;
    // The parser drops a count equal to the usual one.
    const count = c === undefined || c === 'usual' ? '' : `*${c}`;
    const bandType = it.token === 'band' ? r.one('band.type') : undefined;
    const token = bandType === undefined || bandType === 'usual' ? it.token : r.value('band.type', bandType);
    out.push(`${token}${count}@${hold}`);
  });
  if (items.length === 2) {
    if (items[0]!.kind === 'unknown') r.fail('imp2: a second implement needs a known first load. Name the first load, or answer "unknown" for the whole load.');
    if (items[0]!.token === items[1]!.token) r.fail('imp2: the second implement is the same as the first. Use "How many implements" instead.');
  }
  // none stands alone: an implement added to a body-weight movement is the whole load.
  return (out.length > 1 ? out.filter((i) => i !== 'none') : out).join('+');
}

/** The equipment key of the exercise's main equipment, with the strength or cardio machine named. */
function mainFxe(fxiLayers: Partial<Record<string, string>>, mac: Machine | undefined, erg: string | undefined, start: string): string {
  const main = mainEquipment(fxiLayers);
  if (main.token === 'mac') {
    const m = mac ?? { m: UNKNOWN, l: UNKNOWN };
    // The machine's posture is the body's start orientation.
    return `${FXE_HEAD}k:mac/l:${m.l}/s:${start === GENERIC ? UNKNOWN : start}/m:${m.m}`;
  }
  if (main.token !== undefined && (main.token === 'erg' || main.token.startsWith('erg.'))) return ergFxe(erg);
  return main.fxe;
}

function buildExercise(r: Reading): { fxi: string; fxe: string } | undefined {
  const m = motion(r);
  const o = orientation(r);
  if (m === undefined || o === undefined) return undefined;
  const start = o.split('>')[0]!;
  const mac = r.firstLoad()?.kind === 'mac' ? machine(r) : undefined;
  const erg = r.firstLoad()?.kind === 'erg' ? ergType(r) : undefined;
  const layers: Partial<Record<string, string>> = {
    m, o,
    k: answered(r, 'end'),
    f: answered(r, 'footwork'),
    s: support(r),
    l: loadLayer(r, mac, erg),
    x: symmetry(r),
    g: grip(r, start),
    r: range(r),
    h: nameSet(r, 'held'),
    p: nameSet(r, 'line'),
    a: nameSet(r, 'accessory'),
  };
  if (r.problems.length > 0) return undefined;
  const text = FXI_HEAD + Object.entries(layers).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}:${v}`).join('/');
  const p = parseFxi(text);
  if (!p.ok) throw new InternalError(`${r.entryId}: the builder wrote ${text}, which the parser rejects: ${p.issues.map((i) => i.message).join('; ')}`);
  return { fxi: p.canonical, fxe: writtenFxe(r.entryId, mainFxe(p.layers, mac, erg, start)) };
}

function writtenFxe(id: string, text: string): string {
  const p = parseFxe(text);
  if (!p.ok) throw new InternalError(`${id}: the builder wrote ${text}, which the parser rejects: ${p.issues.map((i) => i.message).join('; ')}`);
  return p.canonical;
}

function equipmentConfig(r: Reading, prefix: 'eq' | 'eq2', kind: string): string | undefined {
  const ext = (): string[] => {
    if (r.one(`${prefix}.details`) !== 'yes') return [];
    const out: string[] = [];
    const one = (q: string, layer: string): void => { const v = r.one(q); if (v !== undefined && v !== 'usual') out.push(`${layer}:${r.value(q, v)}`); };
    one(`${prefix}.drive`, 'r');
    one(`${prefix}.constraint`, 'c');
    one(`${prefix}.compliance`, 'c');
    one(`${prefix}.angle`, 'g');
    const attrs = r.many(`${prefix}.attrs`).filter((a) => a !== 'usual');
    if (attrs.length > 0) out.push(`a:${attrs.join('+')}`);
    return out;
  };
  if (kind === 'none') return 'k:none';
  if (kind === 'unknown') return 'k:?';
  if (['imp', 'sup', 'acc', 'stn'].includes(kind)) {
    const f = r.one(`eq.form.${kind}`)!;
    return [`k:${kind}`, `f:${f === 'unknown' ? UNKNOWN : f}`, ...ext()].join('/');
  }
  if (kind === 'erg') {
    const t = r.one('eq.erg.type')!;
    return [ergFxe(t === 'unknown' ? UNKNOWN : t).slice(FXE_HEAD.length), ...ext()].join('/');
  }
  const mq = `${prefix}.mac`;
  const m = r.macMotion(mq)!;
  const contact = r.many(`${mq}.contact`);
  let l: string | undefined;
  if (contact.includes('usual')) l = defaultInterface(m) ?? r.fail(`${mq}.contact: the machine motion "${m}" has no default contact. Pick where it meets the body.`);
  else l = contact.includes('unknown') ? UNKNOWN : contact.join('+');
  if (l === undefined) return undefined;
  const ps = r.one(`${mq}.posture`)!;
  const s = ps === 'usual' ? defaultPosture(m, l) : ps === 'unknown' ? UNKNOWN : ps;
  return [`k:mac/l:${l}/s:${s}/m:${m}`, ...ext()].join('/');
}

function buildEquipment(r: Reading): { fxe: string } | undefined {
  const kind = r.one('eq.kind')!;
  const configs = [equipmentConfig(r, 'eq', kind)];
  if (kind === 'mac' && r.one('eq.more') === 'yes') configs.push(equipmentConfig(r, 'eq2', 'mac'));
  if (r.problems.length > 0 || configs.includes(undefined)) return undefined;
  return { fxe: writtenFxe(r.entryId, FXE_HEAD + configs.join(';')) };
}

/** Builds from any answer source. Throws AnswerError for mistakes in the answers and InternalError for builder defects. */
export function buildWith(id: string, provide: Provider, extra: readonly string[] = []): Built {
  const { reading: r, path } = walk(id, provide, extra);
  for (const q of extra) if (QUESTION_BY_ID.has(q) && !path.includes(q)) r.fail(`${q}: answered, but this question is not asked for these answers. Remove it.`);
  for (const c of r.many('changes')) {
    const opens = CHANGE_OPENS[c];
    if (opens !== undefined && !opens.some((q) => path.includes(q))) r.fail(`changes: "${c}" does not apply to this exercise (${changeWhy(c)}). Remove it.`);
  }
  if (r.problems.length > 0) throw AnswerError.of(id, r.problems);
  if (r.fact('equipment')) {
    const eqOut = buildEquipment(r);
    if (eqOut === undefined) throw AnswerError.of(id, r.problems);
    return { id, fxi: null, ...eqOut, path };
  }
  const out = buildExercise(r);
  if (out === undefined) throw AnswerError.of(id, r.problems);
  return { id, ...out, path };
}

function changeWhy(c: string): string {
  if (c === 'count') return 'the load has no hold point: it is body weight, a machine or unknown';
  return 'its question is not asked for these answers';
}

/** Builds the exercise key and equipment key for one entry. */
export function build(entry: Entry): Built {
  if (typeof entry !== 'object' || entry === null || typeof entry.id !== 'string' || entry.id === '') throw new AnswerError(String((entry as { id?: unknown })?.id), ['Each entry needs a non-empty string "id".']);
  if (typeof entry.answers !== 'object' || entry.answers === null || Array.isArray(entry.answers)) throw new AnswerError(entry.id, ['"answers" must be an object of question id → option id(s).']);
  return buildWith(entry.id, (q) => entry.answers[q.id], Object.keys(entry.answers));
}

export type { Reading };
