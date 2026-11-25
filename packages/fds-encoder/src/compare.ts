// Set-based compare for FXI v1 and FXE v1.
// Every value denotes a set of fully specified exercises (or equipment). `?` and `*` denote every value.
// `identical` is returned only for byte-equal canonical strings with no `?` or `*`.
import { ACTION_PARENT, EQUIPMENT_TOKENS, FORMS, FXE_STANDARD, FXI_LAYERS, FXI_LAYER_ORDER, GENERIC, RANGE_PARENT, UNKNOWN } from './alphabet.js';
import type { FxeKind, FxiLayer } from './alphabet.js';
import { parseFxe, parseFxi, PHASE_PREFIX, sortUnique, usualCount } from './syntax.js';
import type { FxeConfig } from './syntax.js';

export type LayerRelation = 'equal' | 'narrower' | 'broader' | 'open' | 'contradicts';
export type Relation = 'identical' | 'refines' | 'refined-by' | 'compatible' | 'contradicting' | 'invalid';

export interface CompareResult {
  readonly relation: Relation;
  /** Per-layer relation, read as "a is … than b". */
  readonly layers: Readonly<Record<string, LayerRelation>>;
  readonly contradicting: readonly string[];
  readonly open: readonly string[];
}

const DEFAULT = '\u0000default';
const incomplete = (v: string): boolean => v === GENERIC || v.includes(UNKNOWN);

/** The parent of a child FXI code (an equipment token, a range code or a joint action), if it has one. */
const parentOf = (code: string): string | undefined => EQUIPMENT_TOKENS[code]?.parent ?? RANGE_PARENT[code] ?? ACTION_PARENT[code];
/** Equal codes, or one is the other's parent. */
const related = (x: string, y: string): boolean => x === y || parentOf(y) === x || parentOf(x) === y;
/** The codes of a value, with motion prefixes and the short-drive suffix stripped. */
const codes = (v: string): string[] => v.split(/[+@,*>|]/).map((c) => c.replace(PHASE_PREFIX, '').replace(/-$/, ''));
/** `a` names a parent code where `b` names one of its children: `a` is the broader description there. */
function coarser(a: string, b: string): boolean {
  const ca = codes(a);
  return codes(b).some((c) => { const p = parentOf(c); return p !== undefined && ca.includes(p) && !ca.includes(c); });
}

function relate(a: string, b: string, unify: (a: string, b: string) => boolean): LayerRelation {
  if (a === b) return incomplete(a) ? 'open' : 'equal';
  const wholeA = a === UNKNOWN || a === GENERIC;
  const wholeB = b === UNKNOWN || b === GENERIC;
  if (wholeA || wholeB) {
    if (wholeA && wholeB) return 'open';
    return wholeA ? (incomplete(b) ? 'open' : 'broader') : incomplete(a) ? 'open' : 'narrower';
  }
  if (a === DEFAULT || b === DEFAULT || !unify(a, b)) return 'contradicts';
  const ia = incomplete(a) || coarser(a, b);
  const ib = incomplete(b) || coarser(b, a);
  if (!ia && !ib) return 'contradicts';
  if (!ia) return 'narrower';
  if (!ib) return 'broader';
  return 'open';
}

/** True when some bijection between the two item lists makes every pair unify. Lists here hold at most a few items. */
function matchAll(a: string[], b: string[], unify: (x: string, y: string) => boolean): boolean {
  if (a.length !== b.length) return false;
  const used = new Array<boolean>(b.length).fill(false);
  const go = (i: number): boolean => {
    if (i === a.length) return true;
    for (let j = 0; j < b.length; j++) {
      if (used[j] || !unify(a[i]!, b[j]!)) continue;
      used[j] = true;
      if (go(i + 1)) return true;
      used[j] = false;
    }
    return false;
  };
  return go(0);
}

const eqOrUnknown = (x: string | undefined, y: string | undefined): boolean => x === y || x === UNKNOWN || y === UNKNOWN;
const relOrUnknown = (x: string, y: string): boolean => x === UNKNOWN || y === UNKNOWN || related(x, y);

/** Sets whose `?` element stands for "something more, unknown". */
function unifyOpenSet(a: string[], b: string[]): boolean {
  const ka = a.filter((x) => x !== UNKNOWN);
  const kb = b.filter((x) => x !== UNKNOWN);
  const okA = ka.every((x) => kb.some((y) => related(x, y)) || b.includes(UNKNOWN));
  const okB = kb.every((x) => ka.some((y) => related(x, y)) || a.includes(UNKNOWN));
  return okA && okB;
}

function unifyActions(a: string, b: string): boolean {
  if (a === b) return true;
  const prefix = (t: string): string => (PHASE_PREFIX.test(t) ? t[0]! : '');
  if (prefix(a) !== prefix(b)) return false;
  const ba = a.slice(prefix(a).length);
  const bb = b.slice(prefix(b).length);
  if (ba === UNKNOWN || bb === UNKNOWN) return true;
  const xa = ba.split('+');
  const xb = bb.split('+');
  if (xa.length !== xb.length) return false;
  const covers = (wild: string[], act: string): boolean => wild.some((w) => act.startsWith(w.slice(0, -1)));
  const short = (x: string): boolean => x.endsWith('-');
  const sameAction = (x: string, y: string): boolean => short(x) === short(y) && related(x.replace(/-$/, ''), y.replace(/-$/, ''));
  const wa = xa.filter((x) => x.endsWith('.?'));
  const wb = xb.filter((x) => x.endsWith('.?'));
  return xa.filter((x) => !x.endsWith('.?')).every((x) => xb.some((y) => sameAction(x, y)) || covers(wb, x))
    && xb.filter((x) => !x.endsWith('.?')).every((x) => xa.some((y) => sameAction(x, y)) || covers(wa, x));
}

function unifyMotion(a: string, b: string): boolean {
  const pa = a.split('>');
  const pb = b.split('>');
  if (pa.length !== pb.length) return false;
  return pa.every((x, i) => {
    const y = pb[i]!;
    if (x === UNKNOWN || y === UNKNOWN) return true;
    return matchAll(x.split('|'), y.split('|'), unifyActions);
  });
}

function unifySequence(a: string, b: string): boolean {
  const pa = a.split('>');
  const pb = b.split('>');
  if (pa.length !== pb.length) return false;
  return pa.every((x, i) => x === pb[i] || x === UNKNOWN || pb[i] === UNKNOWN || unifyOpenSet(x.split('+'), pb[i]!.split('+')));
}

function unifySupport(a: string, b: string): boolean {
  const item = (x: string, y: string): boolean => {
    const [sx = '', px = ''] = x.split('@');
    const [sy = '', py = ''] = y.split('@');
    if (!relOrUnknown(sx, sy)) return false;
    return unifyOpenSet(px === '' ? [] : px.split(','), py === '' ? [] : py.split(','));
  };
  return matchAll(a.split('+'), b.split('+'), item);
}

function unifyLoad(a: string, b: string): boolean {
  const parts = (x: string): [string, string, string] => {
    const [head = '', hold = ''] = x.split('@');
    const [token = '', count = ''] = head.split('*');
    return [token, count, hold];
  };
  const item = (x: string, y: string): boolean => {
    const [tx, cx, hx] = parts(x);
    const [ty, cy, hy] = parts(y);
    return relOrUnknown(tx, ty) && eqOrUnknown(cx, cy) && eqOrUnknown(hx, hy);
  };
  return matchAll(a.split('+'), b.split('+'), item);
}

/**
 * A load value with every implement count written out. A count left out is the implement's usual count under the
 * string's own symmetry and motion, or `?` when an unknown part leaves that count open.
 */
function withCounts(l: string, x: string | undefined, m: string): string {
  if (l === UNKNOWN || l === GENERIC) return l;
  return sortUnique(l.split('+').map((item) => {
    if (item === 'bw') return item;
    const at = item.indexOf('@');
    const head = item.slice(0, at);
    const hold = item.slice(at + 1);
    if (head.includes('*')) return item;
    return `${head}*${usualCount(head, hold, x, m) ?? UNKNOWN}@${hold}`;
  })).join('+');
}

const UNIFIERS: Record<FxiLayer, (a: string, b: string) => boolean> = {
  m: unifyMotion, o: unifySequence, k: () => false, f: unifySequence, s: unifySupport, l: unifyLoad,
  x: () => false, g: unifySequence, r: (a, b) => unifyOpenSet(a.split('+'), b.split('+')), h: () => false, p: () => false,
  a: () => false,
};

function combine(layers: Record<string, LayerRelation>, extraA: boolean, extraB: boolean, byteEqualComplete: boolean): CompareResult {
  const rels = Object.values(layers);
  const contradicting = Object.keys(layers).filter((k) => layers[k] === 'contradicts');
  const open = Object.keys(layers).filter((k) => layers[k] === 'open');
  let relation: Relation;
  if (contradicting.length > 0) relation = 'contradicting';
  else if (byteEqualComplete) relation = 'identical';
  else {
    const aNarrow = rels.some((r) => r === 'narrower') || extraA;
    const bNarrow = rels.some((r) => r === 'broader') || extraB;
    const onlyEqualOr = (ok: LayerRelation): boolean => rels.every((r) => r === 'equal' || r === ok);
    if (aNarrow && !bNarrow && onlyEqualOr('narrower')) relation = 'refines';
    else if (bNarrow && !aNarrow && onlyEqualOr('broader')) relation = 'refined-by';
    else relation = 'compatible';
  }
  return { relation, layers, contradicting, open };
}

const INVALID: CompareResult = { relation: 'invalid', layers: {}, contradicting: [], open: [] };

/**
 * Compares two FXIs. A standard layer left out of a string takes its published default, which is a value:
 * it contradicts every other known value. Only `?` (and `*`) is open. An implement count left out is compared as
 * its usual count under that string's own symmetry and motion; when that count is unknowable it is open.
 */
export function compareFxi(a: string, b: string): CompareResult {
  const A = parseFxi(a);
  const B = parseFxi(b);
  if (!A.ok || !B.ok) return INVALID;
  const layers: Record<string, LayerRelation> = {};
  let extraA = false;
  let extraB = false;
  for (const k of FXI_LAYER_ORDER) {
    const va = A.layers[k];
    const vb = B.layers[k];
    if (!FXI_LAYERS[k].std) {
      if (va !== undefined && vb !== undefined) layers[k] = relate(va, vb, UNIFIERS[k]);
      else if (va !== undefined) extraA = true;
      else if (vb !== undefined) extraB = true;
      continue;
    }
    if (k === 'l') layers[k] = relate(withCounts(va!, A.layers.x, A.layers.m!), withCounts(vb!, B.layers.x, B.layers.m!), UNIFIERS[k]);
    else layers[k] = relate(va ?? DEFAULT, vb ?? DEFAULT, UNIFIERS[k]);
  }
  const complete = !Object.values(A.layers).some((v) => v !== undefined && incomplete(v));
  return combine(layers, extraA, extraB, A.canonical === B.canonical && complete);
}

function relateFxeValue(layer: string, a: string | undefined, b: string | undefined): LayerRelation {
  if (a === undefined || b === undefined) return a === b ? 'equal' : 'open';
  if (a === b) return a === UNKNOWN ? 'open' : 'equal';
  if (a === UNKNOWN) return 'broader';
  if (b === UNKNOWN) return 'narrower';
  if (layer === 'f') {
    if (FORMS[a]?.parent === b) return 'narrower';
    if (FORMS[b]?.parent === a) return 'broader';
  }
  return 'contradicts';
}

function compareConfig(a: FxeConfig, b: FxeConfig): Record<string, LayerRelation> {
  if (a.k === UNKNOWN || b.k === UNKNOWN) return { k: a.k === b.k ? 'open' : a.k === UNKNOWN ? 'broader' : 'narrower' };
  if (a.k !== b.k) return { k: 'contradicts' };
  const out: Record<string, LayerRelation> = { k: 'equal' };
  for (const n of FXE_STANDARD[a.k as FxeKind]) out[n] = relateFxeValue(n, a.layers[n], b.layers[n]);
  for (const n of Object.keys(a.layers)) if (!(n in out) && b.layers[n] !== undefined) out[n] = relateFxeValue(n, a.layers[n], b.layers[n]);
  return out;
}

/** Compares two FXEs. A combination machine is compatible with any configuration it contains. */
export function compareFxe(a: string, b: string): CompareResult {
  const A = parseFxe(a);
  const B = parseFxe(b);
  if (!A.ok || !B.ok) return INVALID;
  const complete = !A.canonical.includes(UNKNOWN);
  if (A.configs.length === 1 && B.configs.length === 1) {
    const ca = A.configs[0]!;
    const cb = B.configs[0]!;
    const extraA = Object.keys(ca.layers).some((n) => cb.layers[n] === undefined && ca.k !== UNKNOWN && !FXE_STANDARD[ca.k as FxeKind].includes(n));
    const extraB = Object.keys(cb.layers).some((n) => ca.layers[n] === undefined && cb.k !== UNKNOWN && !FXE_STANDARD[cb.k as FxeKind].includes(n));
    return combine(compareConfig(ca, cb), extraA, extraB, A.canonical === B.canonical && complete);
  }
  if (A.canonical === B.canonical) return { relation: complete ? 'identical' : 'compatible', layers: {}, contradicting: [], open: [] };
  const anyFit = A.configs.some((x) => B.configs.some((y) => !Object.values(compareConfig(x, y)).includes('contradicts')));
  return anyFit
    ? { relation: 'compatible', layers: {}, contradicting: [], open: ['configurations'] }
    : { relation: 'contradicting', layers: {}, contradicting: ['configurations'], open: [] };
}

/** Compares two strings of the same kind (both FXI or both FXE). Mixed kinds are invalid. */
export function compare(a: string, b: string): CompareResult {
  const ta = a.trim();
  const tb = b.trim();
  if (ta.startsWith('FXI=') && tb.startsWith('FXI=')) return compareFxi(ta, tb);
  if (ta.startsWith('FXE=') && tb.startsWith('FXE=')) return compareFxe(ta, tb);
  return INVALID;
}
