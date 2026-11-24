// One output row: {id, fxi, fxe, confidence, notes, fxiProvenance?, fxiGap?}. Validates it and writes its canonical form.
import { crossCheck } from './crosscheck.js';
import { issueText, parseFxe, parseFxi } from './syntax.js';

/** Who answered for an FXI. Only `owner` and `owner-assisted` allow auto-match. */
export type Provenance = 'owner' | 'owner-assisted' | 'agent' | 'import';
export const PROVENANCES: readonly Provenance[] = ['owner', 'owner-assisted', 'agent', 'import'];
export const OWNER_PROVENANCES: readonly Provenance[] = ['owner', 'owner-assisted'];

const CONFIDENCE = ['high', 'medium', 'low'];

export interface Row {
  readonly id?: unknown;
  readonly fxi?: unknown;
  readonly fxe?: unknown;
  readonly confidence?: unknown;
  readonly notes?: unknown;
  readonly fxiProvenance?: unknown;
  readonly fxiGap?: unknown;
}

export interface RowCheck {
  /** Errors: the row is not an answer until they are fixed. */
  readonly problems: readonly string[];
  /** Cross-check warnings between the row's FXI and FXE. */
  readonly warnings: readonly string[];
  /** Fields whose string the checker canonicalised. */
  readonly changed: readonly string[];
  /** The canonical row. An equipment row writes `fxi: null`; a row without notes writes `notes: null`. */
  readonly row: Readonly<Record<string, unknown>>;
}

/** The rows of a rows file: a JSON array of rows, or an object whose `entries` array holds them. Undefined otherwise. */
export function rowsOf(data: unknown): Row[] | undefined {
  if (Array.isArray(data)) return data as Row[];
  const entries = typeof data === 'object' && data !== null ? (data as { entries?: unknown }).entries : undefined;
  return Array.isArray(entries) ? (entries as Row[]) : undefined;
}

/**
 * Checks one output row. An equipment row may leave `fxi` out or write `null`; both read as "no FXI". `notes` may be
 * left out, `null` or a string. `fxiProvenance` and `fxiGap` belong to rows that carry an FXI.
 */
export function checkRow(row: Row): RowCheck {
  const problems: string[] = [];
  const changed: string[] = [];
  const out: Record<string, unknown> = { ...row };
  if (typeof row.id !== 'string' && typeof row.id !== 'number') problems.push('id is missing');
  if (!CONFIDENCE.includes(String(row.confidence))) problems.push('confidence must be high, medium or low');
  if (row.notes !== undefined && row.notes !== null && typeof row.notes !== 'string') problems.push('notes must be a string or null');
  for (const field of ['fxi', 'fxe'] as const) {
    const v = row[field];
    if (v === undefined || v === null) continue;
    if (typeof v !== 'string') { problems.push(`${field} must be a string`); continue; }
    const p = field === 'fxi' ? parseFxi(v) : parseFxe(v);
    if (!v.trim().startsWith(field === 'fxi' ? 'FXI=' : 'FXE=')) problems.push(`${field} holds the wrong kind of string`);
    if (!p.ok) problems.push(`${field}: ${issueText(p.issues)}`);
    else if (p.canonical !== v) { changed.push(field); out[field] = p.canonical; }
  }
  const hasFxi = typeof row.fxi === 'string';
  if (!hasFxi && typeof row.fxe !== 'string') problems.push('fxi is missing: an exercise row needs an fxi, an equipment row an fxe (its fxi is null or left out)');
  if (row.fxiProvenance !== undefined && !PROVENANCES.includes(row.fxiProvenance as Provenance)) problems.push(`fxiProvenance must be one of ${PROVENANCES.join(', ')}`);
  if (row.fxiGap !== undefined && row.fxiGap !== null && typeof row.fxiGap !== 'string') problems.push('fxiGap must be a string or null');
  if (!hasFxi && (row.fxiProvenance !== undefined || (row.fxiGap !== undefined && row.fxiGap !== null))) problems.push('fxiProvenance and fxiGap belong to a row with an fxi');
  const warnings = problems.length === 0 && hasFxi && typeof out.fxe === 'string' ? crossCheck(out.fxi as string, out.fxe) : [];
  const canonical: Record<string, unknown> = { id: out.id, fxi: hasFxi ? out.fxi : null, ...(out.fxe === undefined ? {} : { fxe: out.fxe }), confidence: out.confidence, notes: out.notes ?? null };
  if (out.fxiProvenance !== undefined) canonical.fxiProvenance = out.fxiProvenance;
  if (out.fxiGap !== undefined) canonical.fxiGap = out.fxiGap === '' ? null : out.fxiGap;
  for (const [k, v] of Object.entries(out)) if (!(k in canonical)) canonical[k] = v;
  return { problems, warnings, changed, row: canonical };
}
