// Turns owner answers into canonical FXI and FXE strings through the reference code.
// The same answers always give the same strings. Invalid or contradictory answers raise AnswerError.
import {
  ERG_TYPES, FXE_MAJOR, FXE_REV, FXI_MAJOR, FXI_REV, GRIP_WIDTHS, HAND_ORIENTATIONS, HELD_CONFLICTS, LEG_JOINTS,
  LINE_CONFLICTS, OPPOSITE_ACTIONS, RANGES, STANCES, START_RANGES, UNKNOWN,
} from './alphabet.js';
import { feetImplied, mainEquipment } from './crosscheck.js';
import { CHANGE_OPENS, DEFAULT_FLOW, JOINT_IDS, PHASE_KINDS } from './flow.js';
import type { Cond, FactId, Flow, FlowQuestion } from './flow.js';
import { PROVENANCES } from './rows.js';
import type { Provenance } from './rows.js';
import { issueText, motionJoints, parseFxe, parseFxi, PHASE_PREFIX, standardFxe, usualCount } from './syntax.js';
import { patchedLayers } from './words.js';
import type { MovementWord } from './words.js';

export type Answer = string | readonly string[];
export type Answers = Readonly<Record<string, Answer>>;
/** The movement-word dataset an answers record's word came from. */
export interface WordsCited { readonly name: string; readonly version: string }

/**
 * An answers record: one exercise or piece of equipment to encode. `sameAs` names one or more entries with the same
 * string that the owner confirms are the same exercise; `differs` says what differs when the notation cannot. `gap` says
 * what the notation misses about this exercise. `provenance` says who answered. `words` names the movement-word dataset
 * the movement word came from. None of them changes the strings.
 */
export interface Entry {
  readonly id: string;
  readonly answers: Answers;
  readonly mode?: 'owner' | 'import';
  readonly sameAs?: string | readonly string[];
  readonly differs?: string;
  readonly gap?: string | null;
  readonly provenance?: Provenance;
  readonly notes?: string | null;
  readonly words?: WordsCited;
}

/** The fields an output row carries beside its strings: the mode, the FXI provenance and the gap marker. */
export interface RowMeta { readonly mode: 'owner' | 'import'; readonly fxiProvenance: Provenance; readonly fxiGap: string | null }

/**
 * The mode, provenance and gap marker of an entry. Provenance defaults to the mode: `owner` in owner mode, `import` in
 * import mode. Import mode always has provenance `import`. The gap marker is `gap`, else the collision answer `differs`.
 */
export function rowMeta(e: Entry, defaultMode: 'owner' | 'import'): RowMeta {
  const mode = e.mode ?? defaultMode;
  const p = e.provenance ?? (mode === 'import' ? 'import' : 'owner');
  if (!PROVENANCES.includes(p)) throw AnswerError.of(e.id, [`provenance: "${String(p)}" is not one of ${PROVENANCES.join(', ')}.`]);
  if ((mode === 'import') !== (p === 'import')) throw AnswerError.of(e.id, [`provenance: import mode has provenance "import", and only import mode has it; this entry is ${mode} mode with "${p}".`]);
  const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
  return { mode, fxiProvenance: p, fxiGap: text(e.gap) ?? text(e.differs) };
}
/**
 * A built entry. `fxe` is always the standard FXE: the row's main equipment for an exercise, the registry record's standard
 * projection for equipment on its own. `fxeFull` is the full registry record, present only when build details were given.
 */
export interface Built { readonly id: string; readonly fxi: string | null; readonly fxe: string; readonly fxeFull?: string; readonly path: readonly string[] }

/** The owner's answers are incomplete, invalid or contradictory. `problems` says what to fix, one line each. */
export class AnswerError extends Error {
  constructor(readonly entryId: string, readonly problems: readonly string[]) {
    super(`${entryId}: ${problems.join(' | ')}`);
  }
  static of(entryId: string, problems: readonly string[]): AnswerError { return new AnswerError(entryId, [...new Set(problems)]); }
}
/** The builder produced a string the reference parser rejects. This is a bug in the builder, never the owner's fault. */
export class InternalError extends Error {}

const FXI_HEAD = `FXI=${FXI_MAJOR}.${FXI_REV}/`;
const FXE_HEAD = `FXE=${FXE_MAJOR}.${FXE_REV}/`;

const BAR_LIKE = ['bb', 'ez', 'tb', 'axle', 'camber', 'smith'];
const NATURAL_HOLD: Readonly<Record<string, string>> = { yoke: 'back', ankwt: 'ankles', harness: 'head' };
const NOT_IN_HANDS = ['vest', UNKNOWN];
const IFACE_TO_POINT: Readonly<Record<string, string>> = {
  hand: 'hands', foot: 'feet', ankle: 'ankles', thigh: 'thighs', knee: 'knees', arm: 'arms', chest: 'chest', back: 'back',
  shoulder: 'shoulders', hip: 'hips', head: 'head', seat: 'seat',
};
const STATIONS = ['cable', 'smith', 'landmine'];
/** Two-hand bars: the only loads a template's bar-only grip width applies to. */
const BARS = ['bb', 'ez', 'axle', 'camber', 'smith'];
const DEPTHS = Object.keys(RANGES).filter((r) => !START_RANGES.includes(r));
/** A motion with no joint direction: a balance or pressure hold (`=0`) or rolling (`~0`). */
const NO_JOINTS = /^[~=]0$/;

/** FXE machine defaults: the load interface a guided motion implies when nothing says otherwise. */
export function defaultInterface(m: string): string | undefined {
  if (/^(push|pull)\./.test(m) || m.startsWith('el.') || m === 'sc.elev' || m === 'sh.habd') return 'hand';
  if (m === 'kn.flex' || m === 'kn.ext' || m === 'hip.flex') return 'ankle';
  if (['sh.hadd', 'sh.abd', 'sh.flex', 'sh.ext'].includes(m)) return 'arm';
  if (m === 'hip.add' || m === 'hip.abd') return 'thigh';
  if (m === 'sp.flex' || m === 'sp.rot') return 'chest';
  if (m === 'sp.ext') return 'back';
  if (m === 'assist.up') return 'knee';
  return undefined;
}

/** FXE machine defaults: the posture a guided motion implies when nothing says otherwise, including the fixed rules. */
export function defaultPosture(m: string, iface: string): string {
  if (m.startsWith('assist.')) return 'hang';
  if (m === 'sh.habd') return 'seat.chest';
  if (m === 'push.fwd' && iface === 'foot') return 'recline';
  if (m === 'push.up' && (iface === 'shoulder' || iface === 'hip')) return 'stand';
  if (m === 'kn.ext' || m.startsWith('el.') || m.startsWith('sh.') || ['sp.flex', 'sp.rot', 'hip.add', 'hip.abd', 'hip.flex', 'pull.down', 'pull.backdown'].includes(m)) return 'seat';
  if (m.startsWith('push.') && iface === 'hand') return 'seat';
  if (m === 'sc.elev' || m === 'hip.ext' || m === 'pull.up') return 'stand';
  return UNKNOWN;
}

/** The FXE posture of a machine, read from the FXI start orientation and whether a pad supports the chest. */
function machinePosture(start: string, chest: boolean): string {
  if (start === 'seated') return chest ? 'seat.chest' : 'seat';
  if (start === 'standing' || start === 'standing.bent') return chest ? 'stand.chest' : 'stand';
  if (['prone', 'prone.incline', 'prone.decline'].includes(start)) return 'prone';
  if (start === 'supine' || start === 'supine.decline') return 'supine';
  if (start === 'supine.incline') return 'recline';
  if (start === 'kneeling' || start === 'kneeling.half') return 'kneel';
  if (start === 'hanging') return 'hang';
  if (start === 'side-lying') return 'side';
  return UNKNOWN;
}


interface LoadItem { kind: 'bw' | 'imp' | 'stn' | 'mach' | 'erg' | 'unknown'; token: string }

/** Reads answers against the flow. Holds the normalised answers and computes facts and layer values from them. */
class Reading {
  readonly problems: string[] = [];
  readonly given = new Map<string, string[]>();
  constructor(readonly entryId: string, readonly flow: Flow) {}

  one(q: string): string | undefined { return this.given.get(q)?.[0]; }
  many(q: string): string[] { return this.given.get(q) ?? []; }
  asked(q: string): boolean { return this.given.has(q); }
  value(q: string, option: string): string {
    return this.flow.byId.get(q)?.options.find((o) => o.id === option)?.value ?? option;
  }
  fail(msg: string): undefined { this.problems.push(msg); return undefined; }

  get template(): MovementWord | undefined { return this.flow.wordById.get(this.one('movement') ?? ''); }
  /** The template's layers with the word questions answered so far applied. */
  get tl(): Record<string, string> { const t = this.template; return t === undefined ? {} : patchedLayers(t, (q) => this.one(q)); }
  changed(id: string): boolean { return this.many('changes').includes(id); }

  fact(id: FactId): boolean {
    const t = this.template;
    switch (id) {
      case 'exercise': return this.one('subject') !== 'equipment';
      case 'equipment': return this.one('subject') === 'equipment';
      case 'template': return t !== undefined;
      case 'motion-from-scratch': return this.one('movement') === 'other' || (t !== undefined && this.changed('motion'));
      case 'posture-has-usual': return t !== undefined && this.tl.o !== undefined && this.tl.o !== UNKNOWN;
      case 'load-has-usual': return t !== undefined && this.tl.l !== undefined && this.tl.l !== UNKNOWN;
      case 'load-holdable': { const f = this.firstLoad(true); return f !== undefined && (f.kind === 'imp' || f.kind === 'stn'); }
      case 'hold-has-usual': { const f = this.firstLoad(true); return f !== undefined && this.usualHold(f.token) !== undefined; }
      case 'load-band': return this.loadItems(true).some((i) => i.token === 'band');
      case 'load-machine': return this.firstLoad(true)?.kind === 'mach';
      case 'load-cardio': return this.firstLoad(true)?.kind === 'erg';
      case 'machine-has-usual': return t?.mac !== undefined;
      case 'cardio-has-usual': return t?.erg !== undefined;
      case 'hold2-has-usual': { const t2 = this.one('imp2'); return t2 !== undefined && this.usualHold(t2 === 'unknown' ? UNKNOWN : t2) !== undefined; }
      case 'machine-direction-has-usual': return t?.mac !== undefined && /^(push|pull|assist)\./.test(t.mac.m);
      case 'contact-has-usual': { const m = this.macMotion('mac'); return t?.mac !== undefined || (m !== undefined && defaultInterface(m) !== undefined); }
      case 'eq-contact-has-usual': { const m = this.macMotion('eq.mac'); return m !== undefined && defaultInterface(m) !== undefined; }
      case 'eq2-contact-has-usual': { const m = this.macMotion('eq2.mac'); return m !== undefined && defaultInterface(m) !== undefined; }
      case 'single-phase-template': { const m = this.tl.m; return m !== undefined && !m.includes('>') && !m.includes('|') && !NO_JOINTS.test(m); }
      case 'stance-recorded': return ['standing', 'standing.bent', '*', UNKNOWN].includes(this.startOrientation()) || this.footPlate();
      case 'word-asks': return t?.asks !== undefined && Object.keys(t.asks).length > 0;
    }
  }

  /** The start orientation as answered so far (template value when not asked), `?` when unresolved. */
  startOrientation(): string {
    const a = this.one('orientation');
    const o = a === undefined || a === 'usual' ? this.tl.o : this.value('orientation', a);
    return (o ?? UNKNOWN).split('>')[0]!;
  }

  /** True when the load is a strength machine whose moving part meets the feet (leg press). */
  footPlate(): boolean {
    if (this.firstLoad(true)?.kind !== 'mach') return false;
    const c = this.one('mac.contact');
    if (c !== undefined && c !== 'usual') return c === 'foot';
    const m = this.macMotion('mac');
    return (this.template?.mac?.l ?? (m === undefined ? undefined : defaultInterface(m))) === 'foot';
  }

  /** The guided motion of a machine block as answered so far; undefined when it can't be resolved. */
  macMotion(prefix: string): string | undefined {
    const mv = this.one(`${prefix}.motion`);
    const tm = prefix === 'mac' ? this.template?.mac?.m : undefined;
    if (mv === undefined) return prefix === 'mac' ? tm : undefined;
    if (mv === 'usual') return tm;
    if (mv === 'unknown') return UNKNOWN;
    if (!['push', 'pull', 'assist'].includes(mv)) return mv;
    const d = this.one(`${prefix}.direction`);
    if (d === undefined) return undefined;
    if (d === 'unknown') return UNKNOWN;
    if (d === 'usual') return tm !== undefined && /^(push|pull|assist)\./.test(tm) ? `${mv}.${tm.split('.')[1]}` : undefined;
    return `${mv}.${d}`;
  }

  // ── load ──

  private itemFromTemplate(quiet: boolean): LoadItem | undefined {
    const l = this.tl.l;
    if (l === undefined || l === UNKNOWN) return quiet ? undefined : this.fail('load: "usual" was picked, but the movement word fixes no load. Pick the load.');
    const token = l.split('+')[0]!.split(/[@*]/)[0]!;
    return this.itemFromToken(token);
  }
  private itemFromToken(token: string): LoadItem {
    if (token === 'bw') return { kind: 'bw', token };
    if (token === 'mach') return { kind: 'mach', token };
    if (token === 'erg' || token.startsWith('erg.')) return { kind: 'erg', token };
    if (STATIONS.includes(token)) return { kind: 'stn', token };
    return { kind: 'imp', token };
  }
  firstLoad(quiet = false): LoadItem | undefined {
    const a = this.one('load');
    if (a === undefined || a === 'usual') return this.itemFromTemplate(quiet);
    if (a === 'unknown') return { kind: 'unknown', token: UNKNOWN };
    if (a === 'implement') {
      const t = this.one('imp1');
      return t === undefined ? undefined : { kind: 'imp', token: t === 'unknown' ? UNKNOWN : t };
    }
    return this.itemFromToken(this.value('load', a));
  }
  loadItems(quiet = false): LoadItem[] {
    const first = this.firstLoad(quiet);
    const out = first === undefined ? [] : [first];
    const t2 = this.one('imp2');
    if (t2 !== undefined) out.push(this.itemFromToken(t2 === 'unknown' ? UNKNOWN : t2));
    return out;
  }

  /** The usual hold point of an implement in this movement; `m` is the motion, when known. */
  usualHold(token: string, m?: string): string | undefined {
    const t = this.template;
    const legOnly = m !== undefined && m !== UNKNOWN && motionJoints(m).length > 0 && motionJoints(m).every((j) => LEG_JOINTS.includes(j));
    const tlItem = t === undefined ? undefined : this.tl.l?.split('+')[0];
    if (tlItem !== undefined && tlItem.split(/[@*]/)[0] === token && tlItem.includes('@')) return tlItem.split('@')[1];
    if (token === 'band' && legOnly && t?.hold?.band === undefined) return 'feet';
    if (t === undefined) return undefined;
    if (t.holdBehind !== undefined && (BAR_LIKE.includes(token) && token !== 'smith') && this.many('line').includes('behind')) return t.holdBehind;
    const map = t.hold ?? {};
    return map[token] ?? (BAR_LIKE.includes(token) ? map.bb : undefined) ?? map['*'] ?? NATURAL_HOLD[token] ?? (NOT_IN_HANDS.includes(token) ? undefined : 'hands');
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

function walk(entryId: string, provide: Provider, extra: readonly string[], flow: Flow): { reading: Reading; path: string[] } {
  const r = new Reading(entryId, flow);
  const path: string[] = [];
  for (const id of extra) if (!flow.byId.has(id)) r.fail(`"${id}" is not a question.`);
  for (const q of flow.questions) {
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
  for (const [a, b] of OPPOSITE_ACTIONS) if (actions.includes(a) && actions.includes(b)) return `${a} and ${b}`;
  return undefined;
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
  const mv = r.one('movement');
  if (mv === 'unknown') return UNKNOWN;
  if (r.fact('motion-from-scratch')) {
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
  const m = r.tl.m!;
  const kind = r.one('motion.kind');
  if (kind === undefined || kind === 'usual') return m;
  if (m.includes('>') || m.includes('|') || NO_JOINTS.test(m)) {
    return r.fail(`motion.kind: "${r.template!.label}" has ${NO_JOINTS.test(m) ? 'no joint actions to change' : 'several phases or parts'}; pick "The joint movement itself" in changes and describe it instead.`);
  }
  const prefix = kind === 'normal' ? '' : PREFIX[kind]!;
  return prefix + m.replace(PHASE_PREFIX, '');
}

function orientation(r: Reading): string | undefined {
  let o: string | undefined;
  const a = r.one('orientation');
  if (a === undefined || a === 'usual') {
    const t = r.tl.o;
    if (r.template === undefined) return r.fail('orientation: "usual" was picked, but no movement word was chosen, so there is no usual position. Pick the position.');
    if (t === undefined || t === UNKNOWN) return r.fail(`orientation: "usual" was picked, but "${r.template.label}" fixes no position. Pick the position.`);
    o = t;
  } else o = r.value('orientation', a);
  const end = r.one('orientation.end');
  if (end !== undefined && end !== 'usual') {
    const e = r.value('orientation.end', end);
    if (o === '*') return r.fail('orientation.end: a rep that may start either way cannot have a fixed end position.');
    if (e === o) return r.fail('orientation.end: the end position is the start position; answer "usual" instead.');
    o = `${o}>${e}`;
  }
  return o;
}

function fromTemplateOr(r: Reading, q: string, layer: string): string | undefined {
  const a = r.one(q);
  if (a === undefined || a === 'usual') return r.tl[layer];
  return r.value(q, a);
}

function support(r: Reading): string | undefined {
  const a = r.one('support');
  // A machine's own handles, pads and seat are never written, so a template support goes when the load is a machine.
  if ((a === undefined || a === 'usual') && r.firstLoad(true)?.kind === 'mach' && r.template?.mac === undefined) return undefined;
  if (a === undefined || a === 'usual') return r.tl.s;
  if (a === 'none') return undefined;
  if (a === 'unknown') return UNKNOWN;
  const items: string[] = [];
  for (const n of r.one('sup.more') === 'yes' ? [1, 2] : [1]) {
    const surf = r.one(`sup${n}.surface`)!;
    const pts = r.many(`sup${n}.points`).filter((p) => p !== 'usual').map((p) => r.value(`sup${n}.points`, p));
    items.push(`${surf === 'unknown' ? UNKNOWN : surf}${pts.length > 0 ? `@${pts.join(',')}` : ''}`);
  }
  if (items.length === 2 && items[0] === items[1]) return r.fail('sup2: the second support is the same as the first.');
  if (feetImplied(r.startOrientation(), items)) return items.filter((i) => i !== 'floor@feet').join('+');
  return items.join('+');
}

function symmetry(r: Reading): string | undefined {
  const a = r.one('symmetry');
  if (a === undefined || a === 'usual') return r.tl.x;
  if (a === 'unknown') return UNKNOWN;
  if (a === 'b') return undefined;
  if (a === 'split') {
    const items = (['arms', 'legs'] as const).map((limb) => [r.one(`symmetry.${limb}`) ?? 'usual', limb] as const)
      .filter(([v]) => v !== 'usual' && v !== 'b').map(([v, limb]) => `${v}@${limb}`);
    return items.length > 0 ? items.join('+') : undefined;
  }
  const scope = r.one('symmetry.scope');
  return scope === undefined || scope === 'usual' ? a : `${a}@${scope}`;
}

const HANDS = Object.keys(HAND_ORIENTATIONS);
const WIDTHS = Object.keys(GRIP_WIDTHS);
const STANCE_CODES = Object.keys(STANCES);

/** True when the arms work one side at a time, so one hand holds the implement. */
const oneHand = (x: string | undefined): boolean => (x ?? '').split('+').some((i) => i === 'u@arms' || i === 'a@arms');

function grip(r: Reading, start: string, x: string | undefined): string | undefined {
  const first = r.firstLoad(true);
  // A template's bar-only width (a snatch grip) needs a two-hand bar held in both hands.
  const barOnly = r.template?.gBar === true && (!(first !== undefined && BARS.includes(first.token)) || oneHand(x));
  const phases = (r.tl.g ?? '').split('>').map((p) => p.split('+').filter((e) => e !== '' && !(barOnly && e === 'w-w')));
  const pick = (els: string[], group: string[]): string | undefined => els.find((e) => group.includes(e));
  let hands: (string | undefined)[] = phases.map((p) => pick(p, HANDS));
  const h = r.one('grip.hand');
  if (h !== undefined && h !== 'usual') {
    if (h === 'turn') {
      const s = r.one('grip.start')!;
      const e = r.one('grip.end')!;
      if (s === e) r.fail('grip.end: the palms end the way they start; that is not a turn. Pick one hand orientation instead.');
      hands = [s, e];
    } else hands = [h === 'unknown' ? UNKNOWN : h];
  }
  const groupAnswer = (q: string, group: string[]): string | undefined => {
    const v = r.one(q);
    if (v === undefined || v === 'usual') return phases.map((p) => pick(p, group)).find((x) => x !== undefined);
    return r.value(q, v);
  };
  const width = groupAnswer('grip.width', WIDTHS);
  const stance = groupAnswer('stance', STANCE_CODES);
  const st = r.one('stance');
  if (st !== undefined && st !== 'usual' && !['standing', 'standing.bent', '*', UNKNOWN].includes(start) && !r.footPlate()) {
    r.fail(`stance: stance is recorded only for standing exercises and foot-plate machines, and this one starts ${start}. Answer "usual", or change the body position.`);
  }
  const out = hands.map((hand) => [hand, width, stance].filter((x): x is string => x !== undefined && x !== '').join('+'));
  const text = out.filter((x) => x !== '').length === 0 ? '' : out.map((x) => (x === '' ? 'w-m' : x)).join('>');
  return text === '' ? undefined : text;
}

/**
 * A pull-up or pulldown word pulls down out at the sides (`sh.add`) only with an overhand grip at medium or
 * wide width. An underhand, neutral or close grip pulls down in front of the face (`sh.ext`).
 */
function verticalPull(r: Reading, m: string, g: string | undefined): string {
  if (r.fact('motion-from-scratch') || !m.includes('el.flex+sh.add')) return m;
  const elements = (g ?? '').split('>')[0]!.split('+');
  return elements.some((e) => ['su', 'ne', 'w-n', 'w-t'].includes(e)) ? m.replaceAll('el.flex+sh.add', 'el.flex+sh.ext') : m;
}

function range(r: Reading): string | undefined {
  const codes = (r.tl.r ?? '').split('+').filter((c) => c !== '');
  const group = (q: string, members: readonly string[]): string[] => {
    const v = r.one(q);
    if (v === undefined || v === 'usual') return codes.filter((c) => members.includes(c));
    const code = r.value(q, v);
    return code === '' ? [] : [code];
  };
  const out = [...new Set([...group('range.depth', DEPTHS), ...group('range.start', START_RANGES)])];
  return out.length > 0 ? out.join('+') : undefined;
}

function nameSet(r: Reading, q: string, layer: string): string | undefined {
  const a = r.many(q);
  if (a.length === 0 || a.includes('usual')) return r.tl[layer];
  if (q === 'line' && LINE_CONFLICTS.some(([x, y]) => a.includes(x) && a.includes(y))) return r.fail('line: pick one of higher, lower or from the side.');
  const values = a.map((x) => r.value(q, x));
  const clash = q === 'held' ? HELD_CONFLICTS.find(([x, y]) => values.includes(x) && values.includes(y)) : undefined;
  if (clash !== undefined) return r.fail(`held: "${clash[0]}" and "${clash[1]}" cannot both be held. Pick one.`);
  return values.join('+');
}

interface Machine { m: string; l: string; chest: boolean }

function machine(r: Reading): Machine | undefined {
  const t = r.template;
  if (!r.asked('mac.motion')) {
    if (t?.mac === undefined) return undefined;
    return { m: t.mac.m, l: t.mac.l, chest: t.mac.chest ?? false };
  }
  const m = r.macMotion('mac') ?? r.fail('mac.motion: the machine motion has no usual answer here. Pick what the machine guides and its direction.');
  const c = r.one('mac.contact')!;
  let l: string | undefined;
  if (c === 'usual') l = t?.mac?.l ?? (m === undefined ? undefined : defaultInterface(m)) ?? r.fail(`mac.contact: there is no usual contact for the machine motion "${m ?? '?'}". Pick where it meets the body.`);
  else l = c === 'unknown' ? UNKNOWN : c;
  const ch = r.one('mac.chest')!;
  const chest = ch === 'usual' ? (t?.mac?.chest ?? false) : ch === 'yes';
  return m === undefined || l === undefined ? undefined : { m, l, chest };
}

function ergType(r: Reading): string | undefined {
  const a = r.one('erg.type');
  if (a === undefined || a === 'usual') return r.template?.erg ?? (a === 'usual' ? r.fail('erg.type: "usual" was picked, but the movement word names no cardio machine. Pick the machine.') : undefined);
  return a === 'unknown' ? UNKNOWN : a;
}

function ergFxe(type: string | undefined): string {
  const e = type === undefined || type === UNKNOWN ? undefined : ERG_TYPES[type];
  return e === undefined ? `${FXE_HEAD}k:erg/c:?/l:?/s:?/m:?` : `${FXE_HEAD}k:erg/c:${e.c}/l:${e.l}/s:${e.s}/m:${e.m}`;
}

function loadLayer(r: Reading, x: string, m: string, mac: Machine | undefined, erg: string | undefined): string | undefined {
  const items = r.loadItems();
  if (items.length === 0) return undefined;
  const out: string[] = [];
  items.forEach((it, i) => {
    const slot = i + 1;
    if (it.kind === 'bw') { out.push('bw'); return; }
    if (it.kind === 'unknown') { out.push(UNKNOWN); return; }
    if (it.kind === 'mach') {
      const hold = mac === undefined ? UNKNOWN : mac.m.startsWith('assist.') ? 'assist' : mac.l === UNKNOWN ? UNKNOWN : IFACE_TO_POINT[mac.l] ?? UNKNOWN;
      out.push(`mach@${hold}`);
      return;
    }
    if (it.kind === 'erg') {
      const known = erg === undefined || erg === UNKNOWN ? undefined : ERG_TYPES[erg];
      out.push(known === undefined ? `erg@${UNKNOWN}` : `erg.${known.m}@${known.hold}`);
      return;
    }
    const q = `hold${slot}`;
    const a = r.one(q);
    let hold: string | undefined;
    if (a === undefined || a === 'usual') {
      hold = r.usualHold(it.token, m) ?? r.fail(`${q}: there is no usual place to hold "${it.token}" in this movement. Pick where it is held.`);
    } else hold = r.value(q, a);
    if (hold === undefined) return;
    let count = '';
    if (slot === 1) {
      const tlItem = r.tl.l?.split('+')[0] ?? '';
      const tCount = tlItem.startsWith(`${it.token}*`) ? tlItem.split('@')[0]!.split('*')[1]! : undefined;
      const c = r.one('count1');
      if (c === undefined || c === 'usual') count = tCount === undefined ? '' : `*${tCount}`;
      else if (Number(c) !== usualCount(it.token, hold, x, m)) count = `*${c}`;
    }
    out.push(`${it.token}${count}@${hold}`);
  });
  if (items.length === 2) {
    if (items[0]!.kind === 'unknown') r.fail('imp2: a second implement needs a known first load. Name the first load, or answer "unknown" for the whole load.');
    if (items[0]!.token === items[1]!.token) r.fail('imp2: the second implement is the same as the first. Use "How many implements" instead.');
  }
  return out.join('+');
}

/** The row's FXE: the main equipment by the shared rule, with the machine, cardio machine or band type named. */
function rowFxe(r: Reading, fxiLayers: Partial<Record<string, string>>, mac: Machine | undefined, erg: string | undefined, start: string): string {
  const main = mainEquipment(fxiLayers);
  if (main.token === 'mach') {
    const m = mac ?? { m: UNKNOWN, l: UNKNOWN, chest: false };
    return `${FXE_HEAD}k:mac/l:${m.l}/s:${machinePosture(start, m.chest)}/m:${m.m}`;
  }
  if (main.token !== undefined && (main.token === 'erg' || main.token.startsWith('erg.'))) return ergFxe(erg);
  if (main.token === 'band') {
    const bt = r.one('band.type');
    return `${FXE_HEAD}k:imp/f:${bt === undefined || bt === 'usual' ? 'band' : r.value('band.type', bt)}`;
  }
  return main.fxe;
}

function buildExercise(r: Reading): { fxi: string; fxe: string } | undefined {
  const m = motion(r);
  const o = orientation(r);
  if (m === undefined || o === undefined) return undefined;
  const start = o.split('>')[0]!;
  const x = symmetry(r);
  const loadKind = r.firstLoad()?.kind;
  const mac = loadKind === 'mach' ? machine(r) : undefined;
  const erg = loadKind === 'erg' ? ergType(r) : undefined;
  const g = grip(r, start, x);
  const layers: Partial<Record<string, string>> = {
    m: verticalPull(r, m, g), o,
    k: fromTemplateOr(r, 'end', 'k'),
    f: fromTemplateOr(r, 'footwork', 'f'),
    s: support(r),
    l: loadLayer(r, x ?? 'b', m, mac, erg),
    x,
    g,
    r: range(r),
    h: nameSet(r, 'held', 'h'),
    p: nameSet(r, 'line', 'p'),
    a: nameSet(r, 'accessory', 'a'),
  };
  if (r.problems.length > 0) return undefined;
  const text = FXI_HEAD + Object.entries(layers).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}:${v}`).join('/');
  const p = parseFxi(text);
  if (!p.ok) throw new InternalError(`${r.entryId}: the builder wrote ${text}, which the parser rejects: ${issueText(p.issues)}`);
  const fxe = rowFxe(r, p.layers, mac, erg, start);
  return { fxi: p.canonical, fxe: canonicalFxeOrThrow(r.entryId, fxe) };
}

function canonicalFxeOrThrow(id: string, text: string): string {
  const p = parseFxe(text);
  if (!p.ok) throw new InternalError(`${id}: the builder wrote ${text}, which the parser rejects: ${issueText(p.issues)}`);
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
  if (contact.includes('usual')) l = defaultInterface(m) ?? r.fail(`${mq}.contact: there is no usual contact for the machine motion "${m}". Pick where it meets the body.`);
  else l = contact.includes('unknown') ? UNKNOWN : contact.join('+');
  if (l === undefined) return undefined;
  const ps = r.one(`${mq}.posture`)!;
  const s = ps === 'usual' ? defaultPosture(m, l) : ps === 'unknown' ? UNKNOWN : ps;
  return [`k:mac/l:${l}/s:${s}/m:${m}`, ...ext()].join('/');
}

function buildEquipment(r: Reading): { fxe: string; fxeFull?: string } | undefined {
  const kind = r.one('eq.kind')!;
  const configs = [equipmentConfig(r, 'eq', kind)];
  if (kind === 'mac' && r.one('eq.more') === 'yes') configs.push(equipmentConfig(r, 'eq2', 'mac'));
  if (r.problems.length > 0 || configs.includes(undefined)) return undefined;
  const full = canonicalFxeOrThrow(r.entryId, FXE_HEAD + configs.join(';'));
  const std = standardFxe(full);
  return std === full ? { fxe: std } : { fxe: std, fxeFull: full };
}

/** Builds from any answer source. Throws AnswerError for the owner's mistakes and InternalError for builder bugs. */
export function buildWith(id: string, provide: Provider, extra: readonly string[] = [], flow: Flow = DEFAULT_FLOW): Built {
  const { reading: r, path } = walk(id, provide, extra, flow);
  for (const q of extra) if (flow.byId.has(q) && !path.includes(q)) r.fail(`${q}: answered, but this question is not asked for these answers. Remove it.`);
  for (const c of r.many('changes')) {
    const opens = CHANGE_OPENS[c];
    if (opens !== undefined && !opens.some((q) => path.includes(q))) r.fail(`changes: "${c}" does not apply to this exercise (${changeWhy(r, c)}). Remove it.`);
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

function changeWhy(r: Reading, c: string): string {
  if (c === 'motion' || c === 'kind') {
    if (r.one('movement') === 'unknown') return 'the movement is unknown';
    if (r.one('movement') === 'other') return 'the motion is described step by step already';
    return 'pick either the kind or the whole joint movement, not both';
  }
  if (c === 'hold' || c === 'count') return 'the load has no hold point: it is body weight, a machine or unknown';
  if (c === 'machine') return 'the load is not a machine';
  return 'its question is not asked for these answers';
}

/**
 * Builds the canonical FXI and FXE for one answers record, against the flow of the movement-word dataset its word came
 * from. The same answers and the same flow always give the same strings.
 */
export function build(entry: Entry, flow: Flow = DEFAULT_FLOW): Built {
  if (typeof entry !== 'object' || entry === null || typeof entry.id !== 'string' || entry.id === '') throw new AnswerError(String((entry as { id?: unknown })?.id), ['Each entry needs a non-empty string "id".']);
  if (typeof entry.answers !== 'object' || entry.answers === null || Array.isArray(entry.answers)) throw new AnswerError(entry.id, ['"answers" must be an object of question id → option id(s).']);
  return buildWith(entry.id, (q) => entry.answers[q.id], Object.keys(entry.answers), flow);
}

export type { Reading };
