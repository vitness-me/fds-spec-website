// The exercise key (FXI) and the equipment key (FXE): parser, checker and the standard written form.
// parseFxi and parseFxe return every issue found, and the written form with its layer values.
import {
  ACCESSORIES, ACTION_PARENT, ARM_JOINTS, BODY_POINTS, CIRC_JOINTS, COMPLIANCE, DESIGN_ATTRS, DRIVES, EQUIPMENT_TOKENS, ERG_CYCLES, ERG_TRACKS,
  FOOTWORK, FORMS, FXE_EXTENDED, FXE_KINDS, FXE_EXTENDED_ORDER, FXE_MAJOR, FXE_REV, FXE_STANDARD, FXI_LAYERS,
  FXI_LAYER_ORDER, FXI_MAJOR, FXI_REV, GENERIC, GRIP_ELEMENTS, GRIP_WIDTHS, GUIDE_ANGLES, HAND_ORIENTATIONS, HELD, HELD_CONFLICTS,
  HOLD_ONLY, IMPLIED_POINTS, JOINT_ACTIONS, JOINTS, LEG_JOINTS, LINES, MAC_CONSTRAINTS, MAC_DIRECTIONS,
  MAC_SINGLE_JOINT, MAC_VERBS, MOVING_END, OPPOSITE_ACTIONS, ORIENTATIONS, RANGES, START_RANGES, STANCES,
  SYMMETRY, SYMMETRY_SCOPES, UNKNOWN,
} from './alphabet';
import type { FxeKind, FxiLayer, Glossary } from './alphabet';

export interface Issue { readonly code: string; readonly message: string; readonly at?: string }

export interface ParsedFxi {
  readonly ok: boolean;
  readonly issues: readonly Issue[];
  /** The written form; empty when the input is not an exercise key at all. */
  readonly canonical: string;
  /** Canonical value of every written layer. Layers at their default are absent; `?` is written. */
  readonly layers: Partial<Record<FxiLayer, string>>;
  readonly flag: 'S' | 'N';
}

const has = (table: Glossary | Readonly<Record<string, unknown>>, code: string): boolean =>
  Object.prototype.hasOwnProperty.call(table, code);

/** Canonical order: code-unit order, with `?` and `*` after every letter. */
export function compareCodes(a: string, b: string): number {
  const ka = a.replaceAll(UNKNOWN, '\u{10FFFE}').replaceAll(GENERIC, '\u{10FFFF}');
  const kb = b.replaceAll(UNKNOWN, '\u{10FFFE}').replaceAll(GENERIC, '\u{10FFFF}');
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}
export const sortUnique = (xs: Iterable<string>): string[] => [...new Set(xs)].sort(compareCodes);

class Log {
  readonly issues: Issue[] = [];
  add(code: string, message: string, at?: string): void {
    this.issues.push(at === undefined ? { code, message } : { code, message, at });
  }
}

function splitOnce(text: string, sep: string): [string, string | undefined] {
  const i = text.indexOf(sep);
  return i < 0 ? [text, undefined] : [text.slice(0, i), text.slice(i + 1)];
}

const collapseRuns = (xs: string[]): string[] => xs.filter((v, i) => i === 0 || v !== xs[i - 1]);

// ───────────────────────────── FXI ─────────────────────────────

const FXI_HEAD = /^FXI=(\d+)\.(\d+)([SN]?)\/(.*)$/s;
const PREFIX_CHARS = '^~=%&';

/** Reads an exercise key, checks it and returns its written form. */
export function parseFxi(input: string): ParsedFxi {
  const log = new Log();
  const text = input.trim();
  const head = FXI_HEAD.exec(text);
  if (head === null) {
    if (/^FXI=\d+\//.test(text)) log.add('no-rev', 'The header carries the major version and the revision: write "FXI=1.0S/…".');
    else log.add('prefix', 'An FXI starts with "FXI=1.0S/".');
    return { ok: false, issues: log.issues, canonical: '', layers: {}, flag: 'S' };
  }
  const [, majorText = '', revText = '', , body = ''] = head;
  if (Number(majorText) !== FXI_MAJOR) log.add('major', `Only FXI major version ${FXI_MAJOR} is defined.`);
  if (Number(revText) > FXI_REV) log.add('rev', `This checker knows revisions up to ${FXI_MAJOR}.${FXI_REV}.`);
  if (/^0\d/.test(revText)) log.add('rev', 'Write the revision without leading zeros.');

  const raw = new Map<FxiLayer, string>();
  for (const part of body.split('/')) {
    const [name, value] = splitOnce(part, ':');
    if (!has(FXI_LAYERS, name)) { log.add('unknown-layer', `"${name}" is not an FXI layer.`, part); continue; }
    const layer = name as FxiLayer;
    if (raw.has(layer)) { log.add('duplicate-layer', `Layer "${layer}" appears twice.`, part); continue; }
    if (value === undefined || value === '') { log.add('empty', `Layer "${layer}" has no value; write ? if it is unknown.`, part); continue; }
    raw.set(layer, value);
  }

  const L: Partial<Record<FxiLayer, string>> = {};
  if (!raw.has('m')) log.add('missing-motion', 'The motion layer (m) is required; write m:? if it is unknown.');
  if (!raw.has('o')) log.add('missing-orientation', 'The orientation layer (o) is required; write o:? if it is unknown.');
  if (!raw.has('l')) log.add('missing-load', 'The load layer (l) is required; write l:? if it is unknown.');
  L.m = readMotion(raw.get('m') ?? UNKNOWN, log);
  L.o = readSequence(raw.get('o') ?? UNKNOWN, ORIENTATIONS, 'an orientation', log);
  const start = L.o === UNKNOWN || L.o === GENERIC ? UNKNOWN : L.o.split('>')[0]!;
  setIf(L, 'k', readMovingEnd(raw.get('k'), log));
  setIf(L, 'f', readFootwork(raw.get('f'), log));
  setIf(L, 's', readSupport(raw.get('s'), start, log));
  L.l = readLoad(raw.get('l') ?? UNKNOWN, log);
  setIf(L, 'x', readSymmetry(raw.get('x'), L.m, log));
  L.l = dropUsualCounts(L.l, L.x, L.m);
  setIf(L, 'g', readGrip(raw.get('g'), L.m, L.l, start, log));
  setIf(L, 'r', readRange(raw.get('r'), log));
  setIf(L, 'h', readNameSet(raw.get('h'), HELD, 'none', 'a held posture', HELD_CONFLICTS.map((c) => [...c]), log));
  setIf(L, 'p', readNameSet(raw.get('p'), LINES, 'usual', 'a line of pull', [['hi', 'lo'], ['hi', 'side'], ['lo', 'side']], log));
  setIf(L, 'a', readNameSet(raw.get('a'), ACCESSORIES, 'none', 'an accessory', [], log));

  const flag: 'S' | 'N' = FXI_LAYER_ORDER.some((k) => !FXI_LAYERS[k].std && L[k] !== undefined) ? 'N' : 'S';
  const canonical = `FXI=${FXI_MAJOR}.${FXI_REV}${flag}/` + FXI_LAYER_ORDER.filter((k) => L[k] !== undefined).map((k) => `${k}:${L[k]}`).join('/');
  return { ok: log.issues.length === 0, issues: log.issues, canonical, layers: L, flag };
}

function setIf(L: Partial<Record<FxiLayer, string>>, k: FxiLayer, v: string | undefined): void {
  if (v !== undefined) L[k] = v;
}

/** The written form of an exercise key, or throws listing every issue. */
export function canonicalFxi(input: string): string {
  const p = parseFxi(input);
  if (!p.ok) throw new Error(`${input}: ${p.issues.map((i) => i.message).join('; ')}`);
  return p.canonical;
}

function readMotion(text: string, log: Log): string {
  if (text === UNKNOWN) return UNKNOWN;
  if (text === GENERIC) { log.add('generic-motion', 'Motion cannot be generic; write m:? if it is unknown.'); return UNKNOWN; }
  const phases = text.split('>').map((phase) => {
    if (phase === UNKNOWN) return UNKNOWN;
    const parts = phase.split('|').map((p) => readPart(p, log));
    if (parts.length > 1 && parts.includes(UNKNOWN)) log.add('part-unknown', 'A phase with several parts cannot hold a ? part.', phase);
    return sortUnique(parts).join('|');
  });
  return phases.length === 1 && phases[0] === UNKNOWN ? UNKNOWN : phases.join('>');
}

function readPart(text: string, log: Log): string {
  const prefix = text.length > 0 && PREFIX_CHARS.includes(text[0]!) ? text[0]! : '';
  const body = text.slice(prefix.length);
  if (body === '') { log.add('empty-phase', 'A motion phase needs at least one joint action.', text); return text; }
  if (PREFIX_CHARS.includes(body[0]!)) log.add('two-prefixes', 'A phase takes one prefix.', text);
  if (body === '0') {
    if (prefix !== '=' && prefix !== '~') log.add('zero', '"0" (no joint direction) is only valid as "=0" (a balance or pressure hold) or "~0" (rolling on a roller or ball).', text);
    return prefix + body;
  }
  if (body === UNKNOWN) {
    if (prefix === '') return UNKNOWN;
    return prefix + UNKNOWN; // e.g. %? : a static stretch of unknown joints
  }
  const actions = body.split('+');
  const bare: string[] = [];
  for (const a of actions) {
    const short = a.endsWith('-');
    const b = short ? a.slice(0, -1) : a;
    if (b === UNKNOWN) { log.add('open-hedge', 'The open-ended "+?" is not allowed: write the actions you know, or ? for the whole phase.', text); continue; }
    const [joint = '', act, ...rest] = b.split('.');
    const ok = has(JOINT_ACTIONS, b) || (rest.length === 0 && has(JOINTS, joint) && (act === UNKNOWN || (act === 'circ' && CIRC_JOINTS.includes(joint))));
    if (!ok) log.add('unknown-action', `"${b}" is not a joint action.`, a);
    if (short && !has(JOINT_ACTIONS, b)) log.add('short-suffix', 'The short-drive suffix "-" goes only on a named joint action.', a);
    bare.push(b);
  }
  const pair = oppositePair(bare);
  if (pair !== undefined) log.add('opposite-actions', `${pair[0]} and ${pair[1]} cannot be in one phase; split them with ">".`, text);
  const parents = new Set(bare.map((b) => ACTION_PARENT[b]).filter((p) => p !== undefined));
  return prefix + sortUnique(actions.filter((a) => a !== UNKNOWN && a !== `${UNKNOWN}-` && !parents.has(a.replace(/-$/, '')))).join('+');
}

/** Two written actions that move one joint in opposite directions, a child action counting as its parent; else undefined. */
export function oppositePair(actions: readonly string[]): readonly [string, string] | undefined {
  const find = (code: string): string | undefined => actions.find((a) => a === code || ACTION_PARENT[a] === code);
  for (const [x, y] of OPPOSITE_ACTIONS) {
    const ax = find(x);
    const ay = find(y);
    if (ax !== undefined && ay !== undefined) return [ax, ay];
  }
  return undefined;
}

function readSequence(text: string, table: Glossary, what: string, log: Log): string {
  if (text === UNKNOWN || text === GENERIC) return text;
  const codes = text.split('>').map((c) => {
    if (c !== UNKNOWN && !has(table, c)) log.add('unknown-code', `"${c}" is not ${what}.`, c);
    return c;
  });
  const out = collapseRuns(codes);
  return out.length === 1 && out[0] === UNKNOWN ? UNKNOWN : out.join('>');
}

function readMovingEnd(text: string | undefined, log: Log): string | undefined {
  if (text === undefined) return undefined;
  if (text === UNKNOWN || text === GENERIC) return text;
  if (!has(MOVING_END, text)) { log.add('unknown-code', `"${text}" is not a moving end.`, text); return undefined; }
  return text === 'limbs' ? undefined : text;
}

function readFootwork(text: string | undefined, log: Log): string | undefined {
  if (text === undefined) return undefined;
  const v = readSequence(text, FOOTWORK, 'a footwork code', log);
  return v === 'level' ? undefined : v;
}

const SEAT_SURFACES = ['floor', 'bench', 'box', 'chair'];
const SEATED = ['seated', 'seated.bent', 'seated.chest'];

function readSupport(text: string | undefined, start: string, log: Log): string | undefined {
  if (text === undefined) return undefined;
  if (text === UNKNOWN || text === GENERIC) return text;
  const implied = IMPLIED_POINTS[start] ?? [];
  const items = text.split('+').map((item) => {
    const [surface, pts] = splitOnce(item, '@');
    if (surface === '') log.add('empty', 'A support item needs a surface; write ? if it is unknown.', item);
    else if (surface !== UNKNOWN && (!has(EQUIPMENT_TOKENS, surface) || surface === 'none')) log.add('unknown-surface', `"${surface}" is not a support surface.`, item);
    const points = pts === undefined ? [] : sortUnique(pts.split(',').filter((p) => {
      if (p !== UNKNOWN && !has(BODY_POINTS, p)) log.add('unknown-point', `"${p}" is not a body point.`, item);
      return !implied.includes(p);
    }));
    return points.length > 0 ? `${surface}@${points.join(',')}` : surface;
  }).filter((item) => item !== 'floor' && !(SEATED.includes(start) && SEAT_SURFACES.includes(item)));
  const out = sortUnique(items);
  return out.length > 0 ? out.join('+') : undefined;
}

function readLoad(text: string, log: Log): string {
  if (text === UNKNOWN || text === GENERIC) return text;
  const items = text.split('+').map((item) => {
    const [head = '', hold] = splitOnce(item, '@');
    const [token = '', countText] = splitOnce(head, '*');
    if (token !== UNKNOWN) {
      const t = EQUIPMENT_TOKENS[token];
      if (t === undefined) log.add('unknown-implement', `"${token}" is not an equipment token.`, item);
      else if (!t.load) log.add('support-as-load', `"${token}" is a support, not a load: write it in s.`, item);
    }
    if (countText !== undefined && !/^[1-4]$/.test(countText)) log.add('count', 'A count is a whole number from 1 to 4.', item);
    if (hold !== undefined && hold !== UNKNOWN && !has(BODY_POINTS, hold) && !has(HOLD_ONLY, hold)) log.add('unknown-hold', `"${hold}" is not a hold point.`, item);
    if (token === 'none') {
      if (hold !== undefined || countText !== undefined) log.add('none-hold', 'none takes no hold point or count.', item);
      return 'none';
    }
    if (token !== UNKNOWN && hold === undefined) log.add('missing-hold', 'Every implement needs a hold point; write @? if it is unknown.', item);
    const count = countText === undefined ? '' : `*${countText}`;
    return `${token}${count}@${hold ?? UNKNOWN}`;
  });
  let out = sortUnique(items);
  if (out.length > 1) out = out.filter((i) => i !== 'none'); // an implement already implies the body moves
  return out.join('+');
}

/** One-hand implements: the usual count is one per working hand. Every other load token is usually one. */
const ONE_HAND = ['bell.dumb', 'bell.kettle', 'plate', 'club'];
/** Trunk hold points: any implement held there is usually one. */
const TRUNK_POINTS = ['chest', 'back', 'hips', 'waist'];

/**
 * The usual count of an implement, or undefined when an unknown part leaves it open. A one-hand implement
 * held away from the trunk is one per working hand: one when the arms work one side at a time (`u@arms`, or `u` on a
 * motion of arm joints only), two otherwise. Any other implement, and any implement at a trunk point, is one.
 * `x` is the symmetry value (absent is `b`); `m` is the motion value.
 */
export function usualCount(token: string, hold: string, x: string | undefined, m: string): number | undefined {
  if (token === UNKNOWN || token === GENERIC) return undefined;
  if (!ONE_HAND.includes(token)) return 1;
  if (hold === UNKNOWN || hold === GENERIC) return undefined;
  if (TRUNK_POINTS.includes(hold)) return 1;
  const items = (x ?? 'b').split('+');
  if (items.includes('u@arms')) return 1;
  if (items.includes(UNKNOWN) || items.includes(GENERIC)) return undefined;
  if (!items.includes('u')) return 2;
  if (m.includes(UNKNOWN)) return undefined;
  const joints = motionJoints(m);
  return joints.length > 0 && joints.every((j) => ARM_JOINTS.includes(j)) ? 1 : 2;
}

/** Drops every `*n` in a load value that equals the implement's usual count. */
function dropUsualCounts(l: string, x: string | undefined, m: string): string {
  if (l === UNKNOWN || l === GENERIC) return l;
  return sortUnique(l.split('+').map((item) => {
    const [head, hold = ''] = splitOnce(item, '@');
    const [token, count] = splitOnce(head, '*');
    return count !== undefined && Number(count) === usualCount(token, hold, x, m) ? `${token}@${hold}` : item;
  })).join('+');
}

/** Joint codes of a canonical motion value, without prefixes and suffixes; `=0` counts as the legs. */
export function motionJoints(m: string): string[] {
  if (m === UNKNOWN) return [];
  return m.split(/[>|+]/).map((a) => a.replace(/^[~=%&^]/, '').replace(/-$/, ''))
    .filter((a) => a !== UNKNOWN && a !== '')
    .map((a) => (a === '0' ? 'hip' : a.split('.')[0]!));
}
export function motionActions(m: string): string[] {
  if (m === UNKNOWN) return [];
  return m.split(/[>|+]/).map((a) => a.replace(/^[~=%&^]/, '').replace(/-$/, '')).filter((a) => a !== UNKNOWN && a !== '');
}
const TRUNK_TURN = ['sp.rot', 'sp.lflex', 'nk.rot', 'nk.lflex'];

function readSymmetry(text: string | undefined, m: string, log: Log): string | undefined {
  if (text === undefined) return undefined;
  if (text === UNKNOWN || text === GENERIC) return text;
  const items = text.split('+').map((item) => {
    const [code, scope] = splitOnce(item, '@');
    if (!has(SYMMETRY, code)) log.add('unknown-symmetry', `"${code}" is not a symmetry code (b, u, a, rc).`, item);
    if (scope !== undefined && !has(SYMMETRY_SCOPES, scope)) log.add('unknown-scope', `"${scope}" is not a symmetry scope (arms, legs).`, item);
    return { code, scope };
  }).filter((i) => i.code !== 'b');
  const acts = motionActions(m);
  if (acts.length > 0 && acts.every((a) => TRUNK_TURN.includes(a))) return undefined;
  if (items.length === 0) return undefined;
  const unscoped = items.filter((i) => i.scope === undefined).length;
  const scopes = items.map((i) => i.scope ?? '');
  if ((unscoped > 0 && items.length > 1) || new Set(scopes).size !== scopes.length) {
    log.add('symmetry-conflict', 'Write one symmetry code, or one per scope (@arms, @legs).', text);
  }
  if (items.length === 1) {
    const only = items[0]!;
    const joints = motionJoints(m);
    const group = only.scope === 'legs' ? LEG_JOINTS : only.scope === 'arms' ? ARM_JOINTS : undefined;
    if (group !== undefined && joints.length > 0 && !m.includes(UNKNOWN) && joints.every((j) => group.includes(j))) return only.code;
    return only.scope === undefined ? only.code : `${only.code}@${only.scope}`;
  }
  return sortUnique(items.map((i) => (i.scope === undefined ? i.code : `${i.code}@${i.scope}`))).join('+');
}

/** The usual hand orientation for a motion: `su` when every action is elbow flexion, `pr` otherwise. */
export function usualHand(m: string): string | undefined {
  const acts = motionActions(m);
  if (m === UNKNOWN || acts.length === 0 || m.includes(UNKNOWN) || acts.some((a) => a.endsWith('.circ'))) return undefined;
  return acts.every((a) => a === 'el.flex') ? 'su' : 'pr';
}

const STANDING = ['standing', 'standing.bent', 'standing.chest', UNKNOWN];

function readGrip(text: string | undefined, m: string, l: string, start: string, log: Log): string | undefined {
  if (text === undefined) return undefined;
  if (text === UNKNOWN || text === GENERIC) return text;
  const groups = [HAND_ORIENTATIONS, GRIP_WIDTHS, STANCES];
  // Stance is a dimension when the body stands, or when the feet push a machine's foot plate (leg press).
  const footPlate = l.split('+').includes('mac@feet');
  const phases = text.split('>').map((ph) => {
    const els = ph.split('+').filter((e) => {
      if (e === UNKNOWN || has(GRIP_ELEMENTS, e)) return true;
      if (e === 'st-sp') log.add('st-sp', 'Split stance is footwork in v1: write f:split.', e);
      else log.add('unknown-grip', `"${e}" is not a grip or stance code.`, e);
      return false;
    });
    for (const g of groups) if (els.filter((e) => has(g, e)).length > 1) log.add('grip-conflict', 'A grip phase holds at most one hand orientation, one width and one stance.', ph);
    return sortUnique(els.filter((e) => STANDING.includes(start) || footPlate || !has(STANCES, e)));
  });
  const kept = phases.filter((p) => p.length > 0);
  if (kept.length === 0) return undefined;
  const stripped = kept.map((p) => p.filter((e) => e !== 'w-m' && e !== 'st-m'));
  let seq = collapseRuns(stripped.map((p) => p.join('+')));
  if (seq.length > 1) {
    seq = collapseRuns(kept.map((p, i) => (stripped[i]!.length === 0 ? p : stripped[i]!).join('+')));
    if (seq.length > 1) return seq.join('>');
  }
  const usual = usualHand(m);
  const forced = l.split('+').some((i) => i.startsWith('bar.trap@') || i.startsWith('bar.trap*')) ? 'ne' : undefined;
  const only = (seq[0] ?? '').split('+').filter((e) => e !== '' && e !== usual && e !== forced);
  if (only.length === 1 && only[0] === UNKNOWN) return UNKNOWN;
  return only.length > 0 ? only.join('+') : undefined;
}

function readRange(text: string | undefined, log: Log): string | undefined {
  if (text === undefined) return undefined;
  if (text === UNKNOWN || text === GENERIC) return text;
  const codes = sortUnique(text.split('+'));
  for (const c of codes) if (c !== UNKNOWN && !has(RANGES, c)) log.add('unknown-range', `"${c}" is not a range code.`, c);
  if (codes.filter((c) => START_RANGES.includes(c)).length > 1) log.add('range-conflict', 'Write at most one start position.', text);
  if (codes.includes('partial') && codes.includes('deep')) log.add('range-conflict', 'partial and deep contradict.', text);
  return codes.join('+');
}

/** A defaulted set layer (`h`, `p`): the default code is dropped, `?` stays and stands alone. */
function readNameSet(text: string | undefined, table: Glossary, dflt: string, what: string, conflicts: string[][], log: Log): string | undefined {
  if (text === undefined) return undefined;
  if (text === UNKNOWN || text === GENERIC) return text;
  const codes = sortUnique(text.split('+'));
  for (const c of codes) {
    if (c === UNKNOWN) log.add('unknown-alone', `Write ? alone for ${what} you don't know.`, text);
    else if (!has(table, c)) log.add('unknown-code', `"${c}" is not ${what}.`, c);
  }
  if (codes.includes(dflt) && codes.length > 1) log.add('conflict', `"${dflt}" is the default and cannot be combined with other codes.`, text);
  for (const pair of conflicts) if (pair.every((c) => codes.includes(c))) log.add('conflict', `${pair.join(' and ')} contradict.`, text);
  const kept = codes.filter((c) => c !== dflt);
  return kept.length > 0 ? kept.join('+') : undefined;
}

/** F: complete; G: generic (`*`, no `?`); P: partial (has `?`). */
export function fxiCompleteness(p: ParsedFxi): 'F' | 'G' | 'P' {
  const values = Object.values(p.layers);
  if (values.some((v) => v !== undefined && v.includes(UNKNOWN))) return 'P';
  if (values.some((v) => v === GENERIC)) return 'G';
  return 'F';
}

/** The standard projection: extended layers dropped, flag S. */
export function standardFxi(input: string): string {
  const p = parseFxi(input);
  if (!p.ok) throw new Error(`${input}: ${p.issues.map((i) => i.message).join('; ')}`);
  const layers = FXI_LAYER_ORDER.filter((k) => FXI_LAYERS[k].std && p.layers[k] !== undefined);
  return `FXI=${FXI_MAJOR}.${FXI_REV}S/` + layers.map((k) => `${k}:${p.layers[k]}`).join('/');
}

// ───────────────────────────── FXE ─────────────────────────────

export interface FxeConfig { readonly k: FxeKind | '?'; readonly layers: Readonly<Record<string, string>> }
export interface ParsedFxe {
  readonly ok: boolean;
  readonly issues: readonly Issue[];
  readonly canonical: string;
  readonly configs: readonly FxeConfig[];
  readonly flag: 'S' | 'N';
}

const FXE_HEAD = /^FXE=(\d+)\.(\d+)([SN]?)\/(.*)$/s;

/** Reads an equipment key: one configuration, or a combination machine's configurations joined by `;`. */
export function parseFxe(input: string): ParsedFxe {
  const log = new Log();
  const text = input.trim();
  const head = FXE_HEAD.exec(text);
  if (head === null) {
    if (/^FXE=\d+S?\//.test(text)) log.add('no-rev', 'The header carries the major version and the revision: write "FXE=1.0S/…".');
    else log.add('prefix', 'An FXE starts with "FXE=1.0S/".');
    return { ok: false, issues: log.issues, canonical: '', configs: [], flag: 'S' };
  }
  const [, majorText = '', revText = '', , body = ''] = head;
  if (Number(majorText) !== FXE_MAJOR) log.add('major', `Only FXE major version ${FXE_MAJOR} is defined.`);
  if (Number(revText) > FXE_REV) log.add('rev', `This checker knows revisions up to ${FXE_MAJOR}.${FXE_REV}.`);
  const configs = body.split(';').map((c) => readConfig(c.trim(), log));
  const texts = sortUnique(configs.map(configText));
  const parsedBack = texts.map((t) => configs.find((c) => configText(c) === t)!);
  const flag: 'S' | 'N' = parsedBack.some((c) => Object.keys(c.layers).some((k) => c.k !== '?' && !FXE_STANDARD[c.k].includes(k))) ? 'N' : 'S';
  if (texts.length > 1 && parsedBack.some((c) => c.k === '?' || c.k === 'none')) log.add('combo', 'A combination joins machine or station configurations only.');
  return { ok: log.issues.length === 0, issues: log.issues, canonical: `FXE=${FXE_MAJOR}.${FXE_REV}${flag}/${texts.join(';')}`, configs: parsedBack, flag };
}

export function canonicalFxe(input: string): string {
  const p = parseFxe(input);
  if (!p.ok) throw new Error(`${input}: ${p.issues.map((i) => i.message).join('; ')}`);
  return p.canonical;
}

function configText(c: FxeConfig): string {
  if (c.k === '?') return 'k:?';
  const order = [...FXE_STANDARD[c.k], ...FXE_EXTENDED_ORDER.filter((k) => FXE_EXTENDED[c.k as FxeKind].includes(k) && !FXE_STANDARD[c.k as FxeKind].includes(k))];
  return [`k:${c.k}`, ...order.filter((k) => c.layers[k] !== undefined).map((k) => `${k}:${c.layers[k]}`)].join('/');
}

function readConfig(text: string, log: Log): FxeConfig {
  const raw = new Map<string, string>();
  for (const part of text.split('/')) {
    const [name, value] = splitOnce(part, ':');
    if (value === undefined || value === '') { log.add('empty', `FXE layer "${name}" has no value.`, part); continue; }
    if (raw.has(name)) { log.add('duplicate-layer', `FXE layer "${name}" appears twice.`, part); continue; }
    raw.set(name, value);
  }
  const kText = raw.get('k');
  if (kText === undefined) { log.add('missing-kind', 'Every FXE configuration starts with k:<kind>.', text); return { k: '?', layers: {} }; }
  raw.delete('k');
  if (kText === UNKNOWN) {
    if (raw.size > 0) log.add('kind-unknown', 'k:? takes no other layers.', text);
    return { k: '?', layers: {} };
  }
  if (!has(FXE_KINDS, kText)) { log.add('unknown-kind', `"${kText}" is not an FXE kind.`, text); return { k: '?', layers: {} }; }
  const k = kText as FxeKind;
  const std = FXE_STANDARD[k];
  const ext = FXE_EXTENDED[k];
  for (const name of raw.keys()) if (!std.includes(name) && !ext.includes(name)) log.add('unknown-layer', `Layer "${name}" does not apply to k:${k}.`, text);
  const layers: Record<string, string> = {};
  for (const name of std) layers[name] = readFxeValue(k, name, raw.get(name) ?? UNKNOWN, true, log);
  const form = layers.f !== undefined && layers.f !== UNKNOWN ? FORMS[layers.f] : undefined;
  for (const name of FXE_EXTENDED_ORDER.filter((n) => ext.includes(n) && !std.includes(n))) {
    const v = raw.get(name);
    if (v === undefined || v === UNKNOWN) continue;
    const value = readFxeValue(k, name, v, false, log);
    if (form !== undefined && ((name === 'r' && form.r === value) || (name === 'c' && form.c === value))) continue; // implied by the form atom
    layers[name] = value;
  }
  return { k, layers };
}

function readFxeValue(k: FxeKind, name: string, v: string, standard: boolean, log: Log): string {
  if (v === UNKNOWN) return UNKNOWN;
  const bad = (what: string): string => { log.add('unknown-code', `"${v}" is not ${what} for k:${k}.`, `${name}:${v}`); return v; };
  if (name === 'f') {
    const atom = FORMS[v];
    if (atom === undefined) return bad('a form atom');
    if (atom.k !== k) log.add('form-kind', `Form "${v}" belongs to k:${atom.k}, not k:${k}.`, `f:${v}`);
    return v;
  }
  if (name === 'l') {
    const parts = sortUnique(v.split('+'));
    for (const p of parts) if (!has(BODY_POINTS, p)) bad('a body point');
    return parts.join('+');
  }
  if (name === 's') return has(ORIENTATIONS, v) ? v : bad('an orientation');
  if (name === 'm') {
    if (k === 'erg') return has(ERG_CYCLES, v) ? v : bad('a cycle');
    if (MAC_SINGLE_JOINT.includes(v)) return v;
    const [verb = '', dir = ''] = v.split('.');
    return MAC_VERBS.includes(verb) && has(MAC_DIRECTIONS, dir) ? v : bad('a guided motion');
  }
  if (name === 'c') {
    if (standard) return has(ERG_TRACKS, v) ? v : bad('a cardio track');
    const table = k === 'imp' || k === 'sup' ? COMPLIANCE : MAC_CONSTRAINTS;
    return has(table, v) ? v : bad('a constraint');
  }
  if (name === 'r') return has(DRIVES, v) ? v : bad('a drive');
  if (name === 'g') return has(GUIDE_ANGLES, v) ? v : bad('a guide angle');
  if (name === 'a') {
    const parts = sortUnique(v.split('+'));
    for (const p of parts) if (!has(DESIGN_ATTRS, p)) bad('a design attribute');
    return parts.join('+');
  }
  return bad('a value');
}

/** The standard projection of an FXE: extended layers dropped, flag S. */
export function standardFxe(input: string): string {
  const p = parseFxe(input);
  if (!p.ok) throw new Error(`${input}: ${p.issues.map((i) => i.message).join('; ')}`);
  const texts = sortUnique(p.configs.map((c) => configText(c.k === '?' ? c : { k: c.k, layers: Object.fromEntries(Object.entries(c.layers).filter(([n]) => FXE_STANDARD[c.k as FxeKind].includes(n))) })));
  return `FXE=${FXE_MAJOR}.${FXE_REV}S/${texts.join(';')}`;
}
