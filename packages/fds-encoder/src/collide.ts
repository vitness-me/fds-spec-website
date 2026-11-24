// Library collision check (`review`). A new FXI that is byte-equal to one already in the owner's library, or to another
// in the same answers file, is a collision until the owner confirms the two are the same exercise (`sameAs`) or answers
// what differs. Every entry with the same string is a twin, not only the first one. Equipment collides on its FXE.
import type { Built, Entry } from './build.js';
import { DEFAULT_FLOW } from './flow.js';
import type { Flow } from './flow.js';
import { parseFxe, parseFxi } from './syntax.js';

/**
 * An entry of the owner's existing library: an exercise (by FXI) or a piece of equipment (by FXE). `sameAs` lists
 * library entries the owner has already confirmed are the same.
 */
export interface LibraryEntry { readonly id: string; readonly fxi?: string; readonly fxe?: string; readonly sameAs?: readonly string[] }

export interface Collision {
  readonly id: string;
  readonly on: 'FXI' | 'FXE';
  readonly value: string;
  readonly with: { readonly kind: 'library' | 'file'; readonly id: string };
  /** Questions whose answer could tell the two apart, as `question id: what it asks`. */
  readonly separating: readonly string[];
}
export interface Gap extends Collision { readonly differs: string }

function canonical(where: string, text: string): string {
  const p = text.trim().startsWith('FXE=') ? parseFxe(text) : parseFxi(text);
  if (!p.ok) throw new Error(`${where}: ${text} is not a valid FXI or FXE: ${p.issues.map((i) => i.message).join('; ')}`);
  return p.canonical;
}

/**
 * Reads a library file: a list of records (`{id, fxi, fxe, sameAs?}`) or of bare FXI or FXE strings, or an object with
 * such a list under `rows`. Strings are made canonical, so a library written in any layer order compares.
 */
export function readLibrary(raw: unknown): LibraryEntry[] {
  const list = Array.isArray(raw) ? raw : (raw as { rows?: unknown } | null)?.rows;
  if (!Array.isArray(list)) throw new Error('A library file is a JSON list of {id, fxi, fxe} records or of FXI and FXE strings, or an object with that list under "rows".');
  return list.map((x: unknown, i): LibraryEntry => {
    if (typeof x === 'string') {
      const c = canonical(`library entry #${i}`, x);
      return c.startsWith('FXE=') ? { id: `#${i}`, fxe: c } : { id: `#${i}`, fxi: c };
    }
    const o = (x ?? {}) as { id?: unknown; fxi?: unknown; fxe?: unknown; sameAs?: unknown };
    const id = typeof o.id === 'string' || typeof o.id === 'number' ? String(o.id) : `#${i}`;
    const same = sameAsList(o.sameAs);
    const extra = same.length > 0 ? { sameAs: same } : {};
    if (typeof o.fxi === 'string') return { id, fxi: canonical(`library entry ${id}`, o.fxi), ...extra };
    if (typeof o.fxe === 'string') return { id, fxe: canonical(`library entry ${id}`, o.fxe), ...extra };
    throw new Error(`library entry ${id}: needs an fxi or an fxe string. FDS defines no hashed key; entries compare by their strings.`);
  });
}

/** The ids an entry's `sameAs` names: one id or a list. */
export function sameAsList(v: unknown): string[] {
  if (typeof v === 'string') return v.trim() === '' ? [] : [v];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];
}

/** The questions that could separate an entry from its twin: unpicked changes, and word questions left at their usual. */
function separating(e: Entry, b: Built, flow: Flow): string[] {
  const a = e.answers;
  const label = (q: string, o?: string): string => {
    const fq = flow.byId.get(q);
    return o === undefined ? `${q}: ${fq?.text ?? ''}` : `changes → ${o}: ${fq?.options.find((x) => x.id === o)?.label ?? ''}`;
  };
  // Build details (drive, track, angle, design) go only in the registry record, so they never separate standard FXEs.
  const detail = /\.(details|drive|constraint|compliance|angle|attrs)$/;
  if (b.fxi === null) return b.path.filter((q) => !detail.test(q) && (a[q] === 'usual' || a[q] === 'unknown')).map((q) => label(q));
  const picked = Array.isArray(a.changes) ? a.changes : [a.changes];
  const changes = (flow.byId.get('changes')?.options ?? []).map((o) => o.id).filter((o) => o !== 'usual' && !picked.includes(o));
  const words = b.path.filter((q) => flow.wordQuestionIds.includes(q) && (a[q] === 'usual' || a[q] === 'unknown'));
  return [...words.map((q) => label(q)), ...changes.map((o) => label('changes', o))];
}

/**
 * Checks every built entry against every library entry and every earlier entry in the same file that has its FXI (or,
 * for equipment, its FXE). A twin is settled when `sameAs` links the two, directly or through other confirmed entries;
 * otherwise `differs` records a vocabulary gap, and with neither the collision stays open.
 */
export function checkCollisions(
  built: readonly { entry: Entry; built: Built }[],
  library: readonly LibraryEntry[],
  flow: Flow = DEFAULT_FLOW,
): { open: Collision[]; gaps: Gap[]; confirmed: number } {
  const open: Collision[] = [];
  const gaps: Gap[] = [];
  let confirmed = 0;
  const parent = new Map<string, string>();
  const root = (id: string): string => {
    let r = id;
    while (parent.has(r) && parent.get(r) !== r) r = parent.get(r)!;
    parent.set(id, r);
    return r;
  };
  const link = (a: string, b: string): void => { const ra = root(a); const rb = root(b); if (ra !== rb) parent.set(ra, rb); };
  for (const l of library) for (const s of l.sameAs ?? []) link(l.id, s);
  for (const { entry } of built) for (const s of sameAsList(entry.sameAs)) link(entry.id, s);

  const byValue = new Map<string, { kind: 'library' | 'file'; id: string }[]>();
  const add = (k: string, twin: { kind: 'library' | 'file'; id: string }): void => { const list = byValue.get(k) ?? []; list.push(twin); byValue.set(k, list); };
  for (const l of library) {
    if (l.fxi !== undefined) add(`FXI:${l.fxi}`, { kind: 'library', id: l.id });
    else if (l.fxe !== undefined) add(`FXE:${l.fxe}`, { kind: 'library', id: l.id });
  }
  for (const { entry, built: b } of built) {
    const on: Collision['on'] = b.fxi === null ? 'FXE' : 'FXI';
    const value = b.fxi ?? b.fxe;
    const k = `${on}:${value}`;
    const twins = (byValue.get(k) ?? []).filter((w) => w.id !== entry.id);
    for (const w of twins) {
      if (root(entry.id) === root(w.id)) { confirmed++; continue; }
      const c: Collision = { id: entry.id, on, value, with: w, separating: separating(entry, b, flow) };
      if (entry.differs !== undefined && entry.differs.trim() !== '') gaps.push({ ...c, differs: entry.differs });
      else open.push(c);
    }
    add(k, { kind: 'file', id: entry.id });
  }
  return { open, gaps, confirmed };
}
