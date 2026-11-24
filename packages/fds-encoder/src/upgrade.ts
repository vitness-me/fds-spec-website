// `upgrade`: rebuild each stored string from its answers record under the rules revision this encoder implements, and
// report every string that changes. A record with no answers record stays valid as written: a later rules revision of
// the same major only refines, so it is checked, never rewritten.
import { FXI_RULES } from './alphabet.js';
import { AnswerError, build } from './build.js';
import type { Entry } from './build.js';
import type { Flow } from './flow.js';
import { parseFxe, parseFxi } from './syntax.js';

/** A record as `build` writes it: the strings, the rules revision they were built under, and the answers record. */
export interface UpgradeInput {
  readonly id?: unknown;
  readonly fxi?: unknown;
  readonly fxe?: unknown;
  readonly fxeFull?: unknown;
  readonly rules?: unknown;
  readonly record?: unknown;
  readonly [field: string]: unknown;
}

export interface StringChange {
  readonly id: string;
  readonly field: 'fxi' | 'fxe' | 'fxeFull';
  readonly before: string | null;
  readonly after: string | null;
  /** The rules revision the stored string was built under, when the record says. */
  readonly fromRules: string | null;
}

export interface UpgradeResult {
  /** Every input record, in order: rebuilt where its answers build, otherwise unchanged. */
  readonly records: readonly Record<string, unknown>[];
  readonly changes: readonly StringChange[];
  /** Records with no answers record, kept as written. */
  readonly kept: readonly { readonly id: string; readonly reason: string }[];
  /** Records that could not be rebuilt, and why. They are kept unchanged. */
  readonly failed: readonly { readonly id: string; readonly problems: readonly string[] }[];
  readonly warnings: readonly string[];
}

const FIELDS = ['fxi', 'fxe', 'fxeFull'] as const;
const text = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Problems with the strings of a record that has no answers to rebuild them from. */
function stringProblems(r: UpgradeInput): string[] {
  const out: string[] = [];
  for (const field of FIELDS) {
    const v = r[field];
    if (typeof v !== 'string') continue;
    const p = field === 'fxi' ? parseFxi(v) : parseFxe(v);
    if (!p.ok) out.push(`${field}: ${p.issues.map((i) => i.message).join('; ')}`);
  }
  return out;
}

/** Rebuilds every record from its answers with `flow`, the flow of the movement-word dataset the answers cite. */
export function upgrade(input: readonly UpgradeInput[], flow: Flow): UpgradeResult {
  const records: Record<string, unknown>[] = [];
  const changes: StringChange[] = [];
  const kept: { id: string; reason: string }[] = [];
  const failed: { id: string; problems: string[] }[] = [];
  const warnings: string[] = [];

  for (const [n, r] of input.entries()) {
    if (!isObject(r) || (typeof r.id !== 'string' && typeof r.id !== 'number')) {
      failed.push({ id: `#${n}`, problems: ['not a built record {id, fxi, fxe, record}'] });
      records.push(r as Record<string, unknown>);
      continue;
    }
    const id = String(r.id);
    if (!isObject(r.record)) {
      const problems = stringProblems(r);
      if (problems.length > 0) failed.push({ id, problems });
      else kept.push({ id, reason: 'no answers record: kept as written' });
      records.push(r);
      continue;
    }
    const entry = r.record as unknown as Entry;
    const cited = entry.words;
    if (cited !== undefined && cited.name !== flow.words.name) {
      failed.push({ id, problems: [`its movement word comes from "${cited.name}" version ${cited.version}; give that dataset with --words`] });
      records.push(r);
      continue;
    }
    if (cited !== undefined && cited.version !== flow.words.version) {
      warnings.push(`${id}: built with ${cited.name} version ${cited.version}, rebuilt with version ${flow.words.version}`);
    }
    try {
      const b = build({ ...entry, id }, flow);
      const after: Record<(typeof FIELDS)[number], string | null> = { fxi: b.fxi, fxe: b.fxe, fxeFull: b.fxeFull ?? null };
      for (const field of FIELDS) {
        const before = text(r[field]);
        if (before !== after[field]) changes.push({ id, field, before, after: after[field], fromRules: text(r.rules) });
      }
      const { fxeFull: _dropped, ...rest } = r;
      records.push({ ...rest, fxi: b.fxi, fxe: b.fxe, ...(b.fxeFull === undefined ? {} : { fxeFull: b.fxeFull }), rules: FXI_RULES });
    } catch (e) {
      if (!(e instanceof AnswerError)) throw e;
      failed.push({ id, problems: [...e.problems] });
      records.push(r);
    }
  }
  return { records, changes, kept, failed, warnings };
}
