// Matching a key against a library of keyed records. An identical key comes first; anything else is a short ranked
// list of candidates for a person to confirm. A key finds candidates; it never proves two records are the same.
import { FXI_STANDARD_LAYERS } from './alphabet';
import type { FxiLayer } from './alphabet';
import { checkKey, compareKeys, KeyError } from './keys';
import type { KeyComparison, KeyResult } from './keys';

/**
 * One side of a match: an id, its key (`FXI=`, `FXE=`, `FXM=` or `FXMG=`), and optionally a name in the library's
 * language and, for an exercise, the key of its main equipment.
 */
export interface MatchEntry {
  readonly id: string;
  readonly key: string;
  readonly name?: string | null | undefined;
  readonly fxe?: string | null | undefined;
}

/** A candidate and how it entered the list: by its key, as an exercise that differs in one layer, or by name. */
export type Candidate =
  | { readonly id: string; readonly via: 'key'; readonly result: Exclude<KeyResult, 'different'>; readonly specific?: 'a' | 'b' }
  | { readonly id: string; readonly via: 'near'; readonly layer: FxiLayer }
  | { readonly id: string; readonly via: 'name' };

/**
 * `identical`: exactly one library entry has the same key (and, when both carry one, the same equipment key); it is
 * also the first candidate. `confirm`: a person picks from the candidates; `why` says why none is identical.
 * `absent`: the library is empty. `warnings`, present only when there are some, says when the query's key or
 * equipment key does not check: such a key matches nothing, so the candidates come by name alone.
 */
export type MatchResult =
  | { readonly kind: 'identical'; readonly id: string; readonly candidates: readonly Candidate[]; readonly warnings?: readonly string[] }
  | { readonly kind: 'confirm'; readonly candidates: readonly Candidate[]; readonly why: string; readonly warnings?: readonly string[] }
  | { readonly kind: 'absent'; readonly warnings?: readonly string[] };

export interface MatchOptions {
  /** Length of the candidate list. Default 3. */
  readonly top?: number;
}

/** A comparison in which a key that does not check, or a key of another type, is different from everything. */
function compareOrDifferent(a: string, b: string): KeyComparison {
  try {
    return compareKeys(a, b);
  } catch (err) {
    if (err instanceof KeyError) return { type: 'FXI', result: 'different' };
    throw err;
  }
}

const hasFxe = (r: MatchEntry): r is MatchEntry & { fxe: string } => typeof r.fxe === 'string' && r.fxe.trim() !== '';

const FILLER = new Set(['a', 'an', 'the', 'and', 'of', 'with', 'on', 'in', 'to', 'for', 'de', 'del', 'la', 'el', 'los', 'las', 'con', 'en', 'y']);

function nameTokens(name: string | null | undefined): string[] {
  if (typeof name !== 'string') return [];
  const words = name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').split(/[^\p{L}\p{N}]+/u);
  return [...new Set(words.filter((w) => w !== '' && !FILLER.has(w)))];
}

const dice = (a: ReadonlySet<string>, b: ReadonlySet<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const x of a) if (b.has(x)) shared++;
  return (2 * shared) / (a.size + b.size);
};

function trigrams(tokens: readonly string[]): Set<string> {
  const s = ` ${tokens.join(' ')} `;
  const out = new Set<string>();
  for (let i = 0; i + 3 <= s.length; i++) out.add(s.slice(i, i + 3));
  return out;
}

function similarity(a: readonly string[], b: readonly string[]): number {
  const words = dice(new Set(a), new Set(b));
  return a.length === 1 || b.length === 1 ? Math.max(words, dice(trigrams(a), trigrams(b))) : words;
}

/**
 * Name similarity in [0, 1]: lower-cased, accents and punctuation stripped, filler words dropped, then Dice over the
 * word sets; when either name is one word, the larger of that and Dice over character trigrams. A missing name scores 0.
 */
export function nameSimilarity(a: string | null | undefined, b: string | null | undefined): number {
  return similarity(nameTokens(a), nameTokens(b));
}

const TIER: Readonly<Record<KeyResult, number | undefined>> = { same: 0, 'more-specific': 1, overlap: 2, different: undefined };
const FXE_TIER: Readonly<Record<KeyResult, number>> = { same: 0, 'more-specific': 1, overlap: 2, different: 2 };

interface Scored {
  readonly row: MatchEntry;
  readonly i: number;
  readonly cmp: KeyComparison;
  readonly near: FxiLayer | undefined;
  readonly name: number;
}

const byNameThenOrder = (a: Scored, b: Scored): number => b.name - a.name || a.i - b.i;
const equalLayers = (c: KeyComparison): number => FXI_STANDARD_LAYERS.filter((l) => c.layers?.[l] === 'equal').length;

/** The one standard exercise-key layer that contradicts, when exactly one does; otherwise undefined. */
function nearLayer(c: KeyComparison): FxiLayer | undefined {
  if (c.layers === undefined) return undefined;
  const differs = FXI_STANDARD_LAYERS.filter((l) => c.layers?.[l] === 'contradicts');
  return differs.length === 1 ? differs[0] : undefined;
}

/**
 * Matches one entry against a library of entries with keys of the same type. The candidate list holds `top`
 * entries, each listed once: entries whose key is the same, more specific or less specific, or overlaps (in that
 * order; then, for exercise keys, more standard layers equal and the closer equipment key; then name similarity,
 * then library order); then exercises whose key differs in exactly one standard layer (by name similarity, then
 * library order); then the rest by name similarity. The result is `identical` only when exactly one entry has the
 * same key and, when both entries carry an equipment key, the equipment keys are the same too.
 */
export function match(query: MatchEntry, library: readonly MatchEntry[], options: MatchOptions | number = {}): MatchResult {
  const top = typeof options === 'number' ? options : options.top ?? 3;
  const warnings: string[] = [];
  const own = checkKey(query.key);
  if (!own.ok) warnings.push(`The key ${query.key} does not check, so it matches by name only: ${own.issues.map((i) => i.message).join(' ')}`);
  if (hasFxe(query) && !checkKey(query.fxe).ok) warnings.push(`The equipment key ${query.fxe} does not check, so it ranks nothing.`);
  const warned = <T extends MatchResult>(r: T): T => (warnings.length === 0 ? r : { ...r, warnings });
  if (library.length === 0) return warned({ kind: 'absent' });
  const queryName = nameTokens(query.name);
  const scored: Scored[] = library.map((row, i) => {
    const cmp = compareOrDifferent(query.key, row.key);
    return { row, i, cmp, near: nearLayer(cmp), name: similarity(queryName, nameTokens(row.name)) };
  });

  const fxeTier = (s: Scored): number => (hasFxe(query) && hasFxe(s.row) ? FXE_TIER[compareOrDifferent(query.fxe, s.row.fxe).result] : 2);
  const found = scored
    .filter((s) => TIER[s.cmp.result] !== undefined)
    .map((s) => ({ s, tier: TIER[s.cmp.result]!, equal: equalLayers(s.cmp), fxe: fxeTier(s) }))
    .sort((a, b) => a.tier - b.tier || b.equal - a.equal || a.fxe - b.fxe || byNameThenOrder(a.s, b.s));
  const near = scored.filter((s) => s.near !== undefined).sort(byNameThenOrder);
  const ordered: Candidate[] = [
    ...found.map(({ s }): Candidate => ({ id: s.row.id, via: 'key', result: s.cmp.result as Exclude<KeyResult, 'different'>, ...(s.cmp.specific === undefined ? {} : { specific: s.cmp.specific }) })),
    ...near.map((s): Candidate => ({ id: s.row.id, via: 'near', layer: s.near! })),
    ...[...scored].sort(byNameThenOrder).map((s): Candidate => ({ id: s.row.id, via: 'name' })),
  ];
  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  for (const c of ordered) {
    if (candidates.length === top) break;
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    candidates.push(c);
  }

  const same = found.filter(({ s }) => s.cmp.result === 'same');
  if (new Set(same.map(({ s }) => s.row.id)).size > 1) return warned({ kind: 'confirm', candidates, why: 'several library entries have the same key' });
  if (same.length > 1) return warned({ kind: 'confirm', candidates, why: 'the library lists the entry with the same key more than once' });
  if (same.length === 0) return warned({ kind: 'confirm', candidates, why: own.ok ? 'no library entry has the same key' : 'the key does not check' });
  const only = same[0]!.s.row;
  if (hasFxe(query) && hasFxe(only) && compareOrDifferent(query.fxe, only.fxe).result !== 'same') {
    return warned({ kind: 'confirm', candidates, why: 'the equipment keys are not the same' });
  }
  return warned({ kind: 'identical', id: only.id, candidates });
}
