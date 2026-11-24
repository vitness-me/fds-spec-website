// Cross-checks between a row's FXI and its FXE. Shared facts are checked, never counted twice in compare.
import { ACTION_PARENT, EQUIPMENT_TOKENS, FXE_MAJOR, FXE_REV, GENERIC, POINT_TO_IFACE, POSTURE_TO_ORIENT, UNKNOWN } from './alphabet.js';
import { compareFxe } from './compare.js';
import { motionActions, parseFxe, parseFxi } from './syntax.js';

const TOKEN_ORDER = Object.keys(EQUIPMENT_TOKENS);
const kindOf = (t: string): string => /k:(\w+)/.exec(EQUIPMENT_TOKENS[t]!.fxe)?.[1] ?? 'none';
const firstByOrder = (ts: string[]): string | undefined => [...ts].sort((a, b) => TOKEN_ORDER.indexOf(a) - TOKEN_ORDER.indexOf(b))[0];
/** Body points that rest the trunk on a surface. */
const TRUNK_POINTS = ['back', 'chest', 'hips', 'seat', 'shoulders', 'waist'];

/**
 * `floor@feet` beside another support is implied under a seated body, and under a body lying face up on a
 * surface that bears the trunk (an item with no points, or with a trunk point). A lean-back row keeps its feet.
 */
export function feetImplied(start: string, items: readonly string[]): boolean {
  if (items.length < 2 || !items.includes('floor@feet')) return false;
  if (start.startsWith('seated')) return true;
  if (!start.startsWith('supine')) return false;
  return items.some((i) => {
    if (i === 'floor@feet') return false;
    const points = i.split('@')[1];
    return points === undefined || points.split(',').some((p) => TRUNK_POINTS.includes(p));
  });
}

/** The row's main equipment: the FXI token that names it, when one does, and its standard FXE alias. */
export interface MainEquipment { readonly token: string | undefined; readonly fxe: string }

/**
 * The main-equipment rule, which the builder and the checker share. In order: a machine or cardio machine in `l`;
 * else a station; else a load implement (an implement of unknown kind, `?@point` or `?@?`, gives `k:imp/f:?` when no
 * implement is known); else the first support other than the floor; else `k:none` for `l:bw`; else `k:?`.
 * Ties go to the earlier token in the token table.
 */
export function mainEquipment(layers: { readonly l?: string; readonly s?: string }): MainEquipment {
  const S = `FXE=${FXE_MAJOR}.${FXE_REV}S/`;
  const l = layers.l ?? UNKNOWN;
  const items = l === UNKNOWN || l === GENERIC ? [] : l.split('+').map((i) => i.split(/[@*]/)[0]!);
  const known = items.filter((t) => t !== UNKNOWN && EQUIPMENT_TOKENS[t] !== undefined && t !== 'bw');
  const of = (t: string | undefined): MainEquipment | undefined => (t === undefined ? undefined : { token: t, fxe: EQUIPMENT_TOKENS[t]!.fxe });
  const byKind = (kinds: string[]): string | undefined => firstByOrder(known.filter((t) => kinds.includes(kindOf(t))));
  const found = of(byKind(['mac', 'erg'])) ?? of(byKind(['stn'])) ?? of(byKind(['imp']));
  if (found !== undefined) return found;
  if (items.includes(UNKNOWN)) return { token: undefined, fxe: `${S}k:imp/f:?` };
  const s = layers.s;
  if (s !== undefined && s !== UNKNOWN && s !== GENERIC) {
    const sup = firstByOrder(s.split('+').map((i) => i.split('@')[0]!).filter((t) => t !== UNKNOWN && t !== 'floor' && EQUIPMENT_TOKENS[t] !== undefined));
    if (sup !== undefined) return { token: sup, fxe: EQUIPMENT_TOKENS[sup]!.fxe };
  }
  if (items.includes('bw')) return { token: 'bw', fxe: `${S}k:none` };
  return { token: undefined, fxe: `${S}k:?` };
}

/**
 * Whether an FXE is the FXE an equipment token aliases, or refines it: it fills a `?` of the alias or names a child of
 * its form atom, and contradicts or leaves open nothing the alias knows. An unknown token fits nothing.
 */
export function fitsToken(token: string, fxe: string): boolean {
  const alias = EQUIPMENT_TOKENS[token];
  if (alias === undefined) return false;
  const c = compareFxe(fxe, alias.fxe);
  return c.relation !== 'invalid' && c.relation !== 'contradicting' && Object.values(c.layers).every((r) => r !== 'broader');
}

/** Warnings when the FXI and the FXE of one row disagree. An empty list means they are consistent. */
export function crossCheck(fxi: string, fxe: string): string[] {
  const out: string[] = [];
  const i = parseFxi(fxi);
  const e = parseFxe(fxe);
  if (!i.ok || !e.ok) return ['cannot cross-check an invalid string'];
  const main = mainEquipment(i.layers);
  if (compareFxe(main.fxe, fxe).relation === 'contradicting') {
    out.push(`the row's main equipment (${main.token === undefined ? 'no token' : `"${main.token}"`}, ${main.fxe}) contradicts the row FXE`);
  }
  const start0 = (i.layers.o ?? UNKNOWN).split('>')[0]!;
  if (feetImplied(start0, (i.layers.s ?? '').split('+'))) {
    out.push('floor@feet is implied when the body sits, or lies on a surface that bears the trunk; leave it out');
  }
  if (e.configs.length !== 1) return out;
  const c = e.configs[0]!;
  if (c.k !== 'mac' && c.k !== 'erg') return out;
  const start = (i.layers.o ?? UNKNOWN).split('>')[0]!;
  const posture = c.layers.s;
  if (posture !== undefined && posture !== UNKNOWN && start !== UNKNOWN && start !== '*' && !(POSTURE_TO_ORIENT[posture] ?? []).includes(start)) {
    out.push(`FXE posture s:${posture} does not fit FXI orientation o:${start}`);
  }
  const token = c.k === 'mac' ? 'mach' : 'erg';
  const item = (i.layers.l ?? '').split('+').find((x) => x.startsWith(`${token}@`) || x.startsWith(`${token}*`));
  const hold = item?.split('@')[1];
  const ifaces = c.layers.l;
  if (hold !== undefined && hold !== UNKNOWN && hold !== 'assist' && ifaces !== undefined && ifaces !== UNKNOWN && !ifaces.split('+').includes(POINT_TO_IFACE[hold] ?? '')) {
    out.push(`FXI hold @${hold} does not fit FXE load interface l:${ifaces}`);
  }
  const m = c.layers.m;
  if (c.k === 'mac' && m !== undefined && m.includes('.') && !/^(push|pull|assist)\./.test(m) && i.layers.m !== UNKNOWN && !motionActions(i.layers.m ?? '').some((x) => x === m || ACTION_PARENT[x] === m)) {
    out.push(`off-design use: the machine's motion ${m} is not in the FXI motion (allowed only when the name names the machine)`);
  }
  return out;
}
