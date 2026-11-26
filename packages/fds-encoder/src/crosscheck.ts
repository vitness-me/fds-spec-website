// Checks an exercise key against the key of its main equipment. The facts both keys record are checked here, and are
// never counted twice in a comparison.
import { ACTION_PARENT, EQUIPMENT_TOKENS, FXE_MAJOR, FXE_REV, GENERIC, UNKNOWN } from './alphabet';
import { compareFxe } from './compare';
import { motionActions, parseFxe, parseFxi } from './syntax';
import type { Issue } from './syntax';

const TOKEN_ORDER = Object.keys(EQUIPMENT_TOKENS);
const kindOf = (t: string): string => /k:(\w+)/.exec(EQUIPMENT_TOKENS[t]!.fxe)?.[1] ?? 'none';
const firstByOrder = (ts: string[]): string | undefined => [...ts].sort((a, b) => TOKEN_ORDER.indexOf(a) - TOKEN_ORDER.indexOf(b))[0];
/** An exercise's main equipment: the exercise-key code that names it, when one does, and the equipment key that code stands for. */
export interface MainEquipment { readonly token: string | undefined; readonly fxe: string }

/**
 * The main equipment of an exercise key, the rule the builder and the checker share. In order: a machine or cardio
 * machine in `l`;
 * else a station; else a load implement (an implement of unknown kind, `?@point` or `?@?`, gives `k:imp/f:?` when no
 * implement is known); else the first support other than the floor; else `k:none` for `l:none`; else `k:?`.
 * Ties go to the earlier token in the token table.
 */
export function mainEquipment(layers: { readonly l?: string; readonly s?: string }): MainEquipment {
  const S = `FXE=${FXE_MAJOR}.${FXE_REV}S/`;
  const l = layers.l ?? UNKNOWN;
  const items = l === UNKNOWN || l === GENERIC ? [] : l.split('+').map((i) => i.split(/[@*]/)[0]!);
  const known = items.filter((t) => t !== UNKNOWN && EQUIPMENT_TOKENS[t] !== undefined && t !== 'none');
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
  if (items.includes('none')) return { token: 'none', fxe: `${S}k:none` };
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

/** The exercise-key code that names an exercise's main equipment, if one does. */
export function mainToken(fxi: string): string | undefined {
  const p = parseFxi(fxi);
  return p.ok ? mainEquipment(p.layers).token : undefined;
}

/**
 * Warnings when an exercise key and the key of its equipment disagree. An empty list means they are consistent.
 * Codes: `invalid` (a key does not parse), `main-equipment` (the equipment key contradicts the main equipment code),
 * `posture` (a machine's posture is not the start orientation), `load-interface` (the hold point of `mac` or `erg` is
 * not a load interface of the machine) and `off-design` (a single-joint machine's motion is not in the exercise's motion).
 */
export function crossCheck(fxi: string, fxe: string): Issue[] {
  const out: Issue[] = [];
  const i = parseFxi(fxi);
  const e = parseFxe(fxe);
  if (!i.ok || !e.ok) return [{ code: 'invalid', message: 'An invalid key cannot be cross-checked.' }];
  const main = mainEquipment(i.layers);
  if (compareFxe(main.fxe, fxe).relation === 'contradicting') {
    const named = main.token === undefined ? 'no code' : `"${main.token}"`;
    out.push({ code: 'main-equipment', message: `The exercise's main equipment (${named}, ${main.fxe}) contradicts the equipment key.` });
  }
  if (e.configs.length !== 1) return out;
  const c = e.configs[0]!;
  if (c.k !== 'mac' && c.k !== 'erg') return out;
  const start = (i.layers.o ?? UNKNOWN).split('>')[0]!;
  const posture = c.layers.s;
  if (posture !== undefined && posture !== UNKNOWN && start !== UNKNOWN && start !== GENERIC && posture !== start) {
    out.push({ code: 'posture', message: `The machine's posture s:${posture} is not the exercise's start orientation o:${start}.` });
  }
  // The machine's item is its kind code or a child of it (`erg.row`).
  const item = (i.layers.l ?? '').split('+').find((x) => {
    const token = x.split(/[@*]/)[0]!;
    return token === c.k || token.startsWith(`${c.k}.`);
  });
  const hold = item?.split('@')[1];
  // An implement held overhead is in the hands.
  const point = hold === 'overhead' ? 'hands' : hold;
  const ifaces = c.layers.l;
  if (point !== undefined && point !== UNKNOWN && point !== 'assist' && ifaces !== undefined && ifaces !== UNKNOWN && !ifaces.split('+').includes(point)) {
    out.push({ code: 'load-interface', message: `The hold point @${hold} is not one of the machine's load interfaces l:${ifaces}.` });
  }
  const m = c.layers.m;
  if (c.k === 'mac' && m !== undefined && m.includes('.') && !/^(push|pull|assist)\./.test(m) && i.layers.m !== UNKNOWN && !motionActions(i.layers.m ?? '').some((x) => x === m || ACTION_PARENT[x] === m)) {
    out.push({ code: 'off-design', message: `The machine's motion ${m} is not in the exercise's motion. Accept it only when the exercise names that machine.` });
  }
  return out;
}
