// Match protocol: auto-match only on a unique identical FXI with owner provenance, outside import mode, and no gap marker
// on either side; otherwise a ranked list of up to three to confirm (FXI candidates, then near-compatible, then by
// name); "absent" only when the library is empty.
import { FXI_STANDARD_LAYERS } from './alphabet.js';
import type { FxiLayer } from './alphabet.js';
import { compare } from './compare.js';
import type { CompareResult, Relation } from './compare.js';
import { OWNER_PROVENANCES, PROVENANCES } from './rows.js';
import type { Provenance } from './rows.js';

/**
 * A row on either side of a match: its FXI, who answered it and in which mode, the gap marker when the owner said the
 * notation misses something, and optionally its name (the query's in the library's language) and its standard FXE.
 */
export interface MatchRow {
  readonly id: string;
  readonly fxi: string;
  readonly fxiProvenance?: string | undefined;
  /** `import` rows never auto-match, whatever their provenance says. */
  readonly mode?: string | undefined;
  /** Any value other than absent, `null`, `false` or `""` is a gap marker and blocks auto-match. */
  readonly fxiGap?: string | boolean | null | undefined;
  readonly name?: string | null | undefined;
  readonly fxe?: string | null | undefined;
}

/** A confirm-list entry and how it entered: by FXI relation, as near-compatible with its one differing layer, or by name. */
export type Candidate =
  | { readonly id: string; readonly via: 'fxi'; readonly relation: Relation }
  | { readonly id: string; readonly via: 'near'; readonly layer: FxiLayer }
  | { readonly id: string; readonly via: 'name' };

export type MatchResult =
  | { readonly kind: 'auto'; readonly id: string }
  | { readonly kind: 'confirm'; readonly candidates: readonly Candidate[]; readonly why: string }
  | { readonly kind: 'absent' };

export interface MatchOptions {
  /** Length of the confirm list. Default 3. */
  readonly top?: number;
}

/** Fails closed: every gap value but the four that mean "no gap" blocks auto-match. */
const hasGap = (r: MatchRow): boolean => r.fxiGap !== undefined && r.fxiGap !== null && r.fxiGap !== false && r.fxiGap !== '';
const ownerMade = (r: MatchRow): boolean => OWNER_PROVENANCES.includes(r.fxiProvenance as Provenance);

/** Why two rows with identical FXIs may not be matched automatically, or undefined when they may. */
export function autoMatchRefusal(query: MatchRow, candidate: MatchRow): string | undefined {
  if (hasGap(query)) return 'the query carries a gap marker';
  if (hasGap(candidate)) return 'the library entry carries a gap marker';
  if (query.mode === 'import') return 'the query is an import-mode row';
  if (candidate.mode === 'import') return 'the library entry is an import-mode row';
  if (!ownerMade(query)) return 'the query has no owner provenance';
  if (!ownerMade(candidate)) return 'the library entry has no owner provenance';
  return undefined;
}

/**
 * Problems that make a row unfit for matching: no id, an FXI that is not a string, an unknown mode or provenance, a
 * provenance that contradicts the mode (import mode has provenance `import`, and only import mode has it), or a gap
 * marker that is not a string, a boolean or null. Empty when the row is fit.
 */
export function checkMatchRow(row: unknown): string[] {
  if (typeof row !== 'object' || row === null || Array.isArray(row)) return ['not a row {id, fxi, …}'];
  const r = row as Record<string, unknown>;
  const problems: string[] = [];
  if (typeof r.id !== 'string' && typeof r.id !== 'number') problems.push('id is missing');
  if (typeof r.fxi !== 'string') problems.push('fxi must be a string');
  if (r.mode !== undefined && r.mode !== 'owner' && r.mode !== 'import') problems.push('mode must be owner or import');
  if (r.fxiProvenance !== undefined && !PROVENANCES.includes(r.fxiProvenance as Provenance)) problems.push(`fxiProvenance must be one of ${PROVENANCES.join(', ')}`);
  if (r.mode !== undefined && r.fxiProvenance !== undefined && (r.mode === 'import') !== (r.fxiProvenance === 'import')) {
    problems.push(`fxiProvenance "${String(r.fxiProvenance)}" contradicts mode "${String(r.mode)}": import mode has provenance import, and only import mode has it`);
  }
  if (r.fxiGap !== undefined && r.fxiGap !== null && typeof r.fxiGap !== 'string' && typeof r.fxiGap !== 'boolean') problems.push('fxiGap must be a string, a boolean or null');
  return problems;
}

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

const TIER: Partial<Record<Relation, number>> = { identical: 0, refines: 1, 'refined-by': 1, compatible: 2 };
const FXE_TIER: Partial<Record<Relation, number>> = { identical: 0, refines: 1, 'refined-by': 1 };

interface Scored {
  readonly row: MatchRow;
  readonly i: number;
  readonly fxi: CompareResult;
  readonly near: FxiLayer | undefined;
  readonly name: number;
}

const byNameThenOrder = (a: Scored, b: Scored): number => b.name - a.name || a.i - b.i;
const equalLayers = (c: CompareResult): number => FXI_STANDARD_LAYERS.filter((l) => c.layers[l] === 'equal').length;
const hasFxe = (r: MatchRow): r is MatchRow & { fxe: string } => typeof r.fxe === 'string' && r.fxe.trim() !== '';

/** The one standard layer that contradicts, when exactly one does; otherwise undefined. */
function nearLayer(c: CompareResult): FxiLayer | undefined {
  const differs = FXI_STANDARD_LAYERS.filter((l) => c.layers[l] === 'contradicts');
  return differs.length === 1 ? differs[0] : undefined;
}

/**
 * Matches one row against a library. Auto only on a unique identical FXI that `autoMatchRefusal` accepts. Otherwise the
 * confirm list holds `top` entries, each listed once: FXI candidates (identical, refines or refined-by, compatible; then
 * more standard layers equal, FXE relation, name similarity, library order), then near-compatible entries (exactly one
 * standard layer contradicts; by name similarity, then library order), then the rest by name similarity. Absent only
 * when the library is empty. Rows are taken as given: check rows from outside with `checkMatchRow` first.
 */
export function match(query: MatchRow, library: readonly MatchRow[], options: MatchOptions | number = {}): MatchResult {
  const top = typeof options === 'number' ? options : options.top ?? 3;
  if (library.length === 0) return { kind: 'absent' };
  const queryName = nameTokens(query.name);
  const scored: Scored[] = library.map((row, i) => {
    const fxi = compare(query.fxi, row.fxi);
    return { row, i, fxi, near: nearLayer(fxi), name: similarity(queryName, nameTokens(row.name)) };
  });

  const fxeTier = (s: Scored): number =>
    hasFxe(query) && hasFxe(s.row) ? FXE_TIER[compare(query.fxe, s.row.fxe).relation] ?? 2 : 2;
  const fxiFound = scored
    .filter((s) => TIER[s.fxi.relation] !== undefined)
    .map((s) => ({ s, tier: TIER[s.fxi.relation]!, equal: equalLayers(s.fxi), fxe: fxeTier(s) }))
    .sort((a, b) => a.tier - b.tier || b.equal - a.equal || a.fxe - b.fxe || byNameThenOrder(a.s, b.s));
  const near = scored.filter((s) => s.near !== undefined).sort(byNameThenOrder);
  const ordered: Candidate[] = [
    ...fxiFound.map(({ s }): Candidate => ({ id: s.row.id, via: 'fxi', relation: s.fxi.relation })),
    ...near.map((s): Candidate => ({ id: s.row.id, via: 'near', layer: s.near! })),
    ...[...scored].sort(byNameThenOrder).map((s): Candidate => ({ id: s.row.id, via: 'name' })),
  ];
  const seen = new Set<string>();
  const list: Candidate[] = [];
  for (const c of ordered) {
    if (list.length === top) break;
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    list.push(c);
  }

  const identical = fxiFound.filter(({ s }) => s.fxi.relation === 'identical');
  if (identical.length > 1) return { kind: 'confirm', candidates: list, why: 'several library entries are identical' };
  if (identical.length === 0) return { kind: 'confirm', candidates: list, why: 'no identical entry' };
  const refusal = autoMatchRefusal(query, identical[0]!.s.row);
  return refusal === undefined ? { kind: 'auto', id: identical[0]!.s.row.id } : { kind: 'confirm', candidates: list, why: refusal };
}
