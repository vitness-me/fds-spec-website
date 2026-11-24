/**
 * Descriptor steps: propose an FXI and FXE for each record from answers its source carries, and resolve each record's
 * FXI against a library by the match protocol. Both are off unless `TransformerOptions.descriptors` names them.
 *
 * The fields are written where RFC-010 defines them: `fxi`, `fxe`, `fxiProvenance`, `fxiGap` and `xrefs` at the top
 * level of the record. Release 1.6.0 and later publish them; an older release's schemas reject a record carrying them.
 */

import { AnswerError, build, builtFrom, checkMatchRow, createFlow, DEFAULT_FLOW, FXI_RULES, match, OWNER_PROVENANCES, rowMeta } from '@vitness/fds-encoder';
import type { Answers, Entry, Flow, MatchResult, MatchRow, WordSet } from '@vitness/fds-encoder';
import type { RecordProvenance } from '../core/types.js';
import { getMappingPathValue } from '../core/paths.js';

/** Who answered a proposal. An owner answers through the encoder, never through a conversion. */
export type ProposalProvenance = 'import' | 'agent';

export interface DescriptorProposeOptions {
  /** Source path of an answers record (`{answers, gap?, notes?, words?}`) or of a bare answers object */
  answersFrom: string;
  /**
   * Who answered: `import` (read from another catalogue's row; the default) or `agent` (proposed by software or by
   * someone other than the owner). Import proposals are for candidate search only.
   */
  provenance?: ProposalProvenance;
  /** The movement-word dataset the answers' movement words come from */
  words?: WordSet;
}

export interface DescriptorResolveOptions {
  /**
   * The library to match against: rows `{id, fxi, fxiProvenance?, mode?, fxiGap?, name?, fxe?}`. A row unfit for
   * matching, such as one whose provenance contradicts its mode, is refused when the steps are created.
   */
  library: readonly MatchRow[];
  /** The library's name, written as the `system` of each link */
  system: string;
  /** Length of the confirm list (default 3) */
  top?: number;
}

export interface DescriptorOptions {
  propose?: DescriptorProposeOptions;
  resolve?: DescriptorResolveOptions;
}

/** What the descriptor steps did for one record. */
export interface DescriptorOutcome {
  /** The record's id: its `exerciseId`, else its slug */
  id: string;
  /** A proposal was written, with this provenance */
  proposed?: ProposalProvenance;
  /**
   * The answers record the proposal was built from, the rules revision it was built under, and the full equipment
   * record when it has build details. None of these has a field on the record; keep them beside it so
   * `fds-encoder upgrade` can rebuild the strings.
   */
  built?: { rules: string; record: Entry; fxeFull?: string };
  /** The proposal's answers did not build; nothing was written */
  problems?: string[];
  /** The match against the library. Only `auto` writes a link; `confirm` is for a person to settle. */
  match?: MatchResult;
  /** What a step changed on the record that the mapping did not ask for, and why */
  warnings?: string[];
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Runs the descriptor steps a transformer was given, on each mapped record. */
export class DescriptorSteps {
  private readonly flow: Flow;

  constructor(private readonly options: DescriptorOptions) {
    const provenance: unknown = options.propose?.provenance ?? 'import';
    if (provenance !== 'import' && provenance !== 'agent') {
      throw new Error(
        `descriptors.propose.provenance is "${String(provenance)}": a conversion proposes as "import" or "agent". ` +
          'Owner provenance comes only from the owner answering, through fds-encoder.'
      );
    }
    if (options.resolve !== undefined && options.resolve.system.trim() === '') {
      throw new Error('descriptors.resolve.system names the library each link points into; it is empty.');
    }
    const unfit = (options.resolve?.library ?? []).flatMap((row, n) => {
      const problems = checkMatchRow(row);
      return problems.length === 0 ? [] : [`row ${n} (${String((row as { id?: unknown }).id)}): ${problems.join(' | ')}`];
    });
    if (unfit.length > 0) throw new Error(`descriptors.resolve.library has rows unfit for matching:\n  ${unfit.join('\n  ')}`);
    const words = options.propose?.words;
    this.flow = words === undefined ? DEFAULT_FLOW : createFlow(words);
  }

  /**
   * Proposes, then resolves, for one record. Writes into `mapped` and records where each written path came from.
   * Returns undefined when neither step had anything to act on.
   */
  apply(
    source: Record<string, unknown>,
    mapped: Record<string, unknown>,
    provenance: RecordProvenance
  ): DescriptorOutcome | undefined {
    const id = stableId(mapped);
    const outcome: DescriptorOutcome = { id };
    let acted = false;

    if (this.options.propose) acted = this.propose(this.options.propose, id, source, mapped, provenance, outcome) || acted;
    if (this.options.resolve) acted = this.resolve(this.options.resolve, id, mapped, provenance, outcome) || acted;
    return acted ? outcome : undefined;
  }

  private propose(
    options: DescriptorProposeOptions,
    id: string,
    source: Record<string, unknown>,
    mapped: Record<string, unknown>,
    provenance: RecordProvenance,
    outcome: DescriptorOutcome
  ): boolean {
    const raw = getMappingPathValue(source, options.answersFrom);
    if (!isObject(raw)) return false;
    // A string already mapped from the source — the owner's own, or an earlier run's — is never replaced.
    if (typeof mapped.fxi === 'string') return false;

    const answers = (isObject(raw.answers) ? raw.answers : raw) as Answers;
    const who: ProposalProvenance = options.provenance ?? 'import';
    // The source's own mode and provenance are not carried: who answered is what this run says.
    const { mode: _mode, provenance: _provenance, ...carried } = isObject(raw.answers) ? (raw as unknown as Entry) : ({} as Partial<Entry>);
    const record: Entry = { ...carried, id, answers, provenance: who, ...(who === 'import' ? { mode: 'import' as const } : {}) };
    try {
      const built = build(record, this.flow);
      const gap = rowMeta(record, 'owner').fxiGap;
      // Equipment answers build no FXI: the record gets its FXE only.
      const fields: Record<string, unknown> = built.fxi === null
        ? { fxe: built.fxe }
        : { fxi: built.fxi, fxe: built.fxe, fxiProvenance: record.provenance, fxiGap: gap };
      for (const [field, value] of Object.entries(fields)) {
        mapped[field] = value;
        provenance[field] = { origin: 'source', from: options.answersFrom, transform: ['fds-encoder:build'] };
      }
      outcome.proposed = who;
      outcome.built = {
        rules: FXI_RULES,
        record: builtFrom(record, this.flow),
        ...(built.fxeFull === undefined ? {} : { fxeFull: built.fxeFull }),
      };
    } catch (error) {
      if (!(error instanceof AnswerError)) throw error;
      outcome.problems = [...error.problems];
    }
    return true;
  }

  private resolve(
    options: DescriptorResolveOptions,
    id: string,
    mapped: Record<string, unknown>,
    provenance: RecordProvenance,
    outcome: DescriptorOutcome
  ): boolean {
    if (typeof mapped.fxi !== 'string') return false;
    // Owner provenance is the source's claim or nothing: a mapping default cannot make a record the owner's.
    if (OWNER_PROVENANCES.includes(mapped.fxiProvenance as never) && provenance.fxiProvenance?.origin !== 'source') {
      (outcome.warnings ??= []).push(
        `fxiProvenance "${String(mapped.fxiProvenance)}" did not come from the source record, so it is written as "import": ` +
          'owner provenance comes only from the owner, mapped from a source field.'
      );
      mapped.fxiProvenance = 'import';
      provenance.fxiProvenance = { origin: 'transform', transform: ['fds-encoder:resolve'] };
    }
    const canonical = mapped.canonical as Record<string, unknown> | undefined;
    const query: MatchRow = {
      id,
      fxi: mapped.fxi,
      fxiProvenance: typeof mapped.fxiProvenance === 'string' ? mapped.fxiProvenance : undefined,
      fxiGap: mapped.fxiGap as MatchRow['fxiGap'],
      name: typeof canonical?.name === 'string' ? canonical.name : null,
      fxe: typeof mapped.fxe === 'string' ? mapped.fxe : null,
    };
    const result = match(query, options.library, { top: options.top ?? 3 });
    outcome.match = result;
    if (result.kind === 'auto') {
      const xrefs = Array.isArray(mapped.xrefs) ? (mapped.xrefs as unknown[]) : [];
      const link = { system: options.system, id: result.id, link: 'auto' };
      if (!xrefs.some((x) => isObject(x) && x.system === link.system && x.id === link.id)) xrefs.push(link);
      mapped.xrefs = xrefs;
      provenance.xrefs = { origin: 'transform', transform: ['fds-encoder:match'] };
    }
    return true;
  }
}

/** The id a record keeps across runs: its exerciseId, else its slug */
function stableId(mapped: Record<string, unknown>): string {
  const canonical = mapped.canonical as Record<string, unknown> | undefined;
  const id = mapped.exerciseId ?? mapped.id ?? canonical?.slug;
  return typeof id === 'string' ? id : '(no id)';
}
