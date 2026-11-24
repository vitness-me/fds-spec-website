/**
 * Descriptor steps: propose an FXI and FXE for each record from answers its source carries, and resolve each record's
 * FXI against a library by the match protocol. Both are off unless `TransformerOptions.descriptors` names them.
 *
 * The descriptors are a draft of the standard, and no published entity schema has fields for them yet, so they are
 * written under an open object (`extensions.descriptors` unless `target` says otherwise).
 */

import { AnswerError, build, createFlow, FXI_RULES, match } from '@vitness/fds-encoder';
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
  /** The library to match against: rows `{id, fxi, fxiProvenance?, fxiGap?, name?, fxe?}` */
  library: readonly MatchRow[];
  /** The library's name, written as the `system` of each link */
  system: string;
  /** Length of the confirm list (default 3) */
  top?: number;
}

export interface DescriptorOptions {
  propose?: DescriptorProposeOptions;
  resolve?: DescriptorResolveOptions;
  /** Where the descriptor fields are written in each document (default `extensions.descriptors`) */
  target?: string;
}

/** What the descriptor steps did for one record. */
export interface DescriptorOutcome {
  /** The record's id: its `exerciseId`, else its slug */
  id: string;
  /** A proposal was written, with this provenance */
  proposed?: ProposalProvenance;
  /** The proposal's answers did not build; nothing was written */
  problems?: string[];
  /** The match against the library. Only `auto` writes a link; `confirm` is for a person to settle. */
  match?: MatchResult;
}

export const DEFAULT_DESCRIPTOR_TARGET = 'extensions.descriptors';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Runs the descriptor steps a transformer was given, on each mapped record. */
export class DescriptorSteps {
  private readonly target: string;
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
    this.target = options.target ?? DEFAULT_DESCRIPTOR_TARGET;
    this.flow = createFlow(options.propose?.words);
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
    if (typeof getMappingPathValue(mapped, `${this.target}.fxi`) === 'string') return false;

    const answers = (isObject(raw.answers) ? raw.answers : raw) as Answers;
    const who: ProposalProvenance = options.provenance ?? 'import';
    // The source's own mode and provenance are not carried: who answered is what this run says.
    const { mode: _mode, provenance: _provenance, ...carried } = isObject(raw.answers) ? (raw as unknown as Entry) : ({} as Partial<Entry>);
    const record: Entry = { ...carried, id, answers, provenance: who, ...(who === 'import' ? { mode: 'import' as const } : {}) };
    try {
      const built = build(record, this.flow);
      const { name, version } = this.flow.words;
      const cites = typeof answers.movement === 'string' && this.flow.wordById.has(answers.movement);
      const gap = typeof record.gap === 'string' && record.gap.trim() !== '' ? record.gap : null;
      const fields: Record<string, unknown> = {
        fxi: built.fxi,
        fxe: built.fxe,
        ...(built.fxeFull === undefined ? {} : { fxeFull: built.fxeFull }),
        ...(built.fxi === null ? {} : { fxiProvenance: record.provenance, fxiGap: gap }),
        rules: FXI_RULES,
        record: { ...record, ...(cites && record.words === undefined ? { words: { name, version } } : {}) },
      };
      const at = ensureObject(mapped, this.target);
      for (const [field, value] of Object.entries(fields)) {
        at[field] = value;
        provenance[`${this.target}.${field}`] = { origin: 'source', from: options.answersFrom, transform: ['fds-encoder:build'] };
      }
      outcome.proposed = who;
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
    const at = getMappingPathValue(mapped, this.target);
    if (!isObject(at) || typeof at.fxi !== 'string') return false;
    const canonical = mapped.canonical as Record<string, unknown> | undefined;
    const query: MatchRow = {
      id,
      fxi: at.fxi,
      fxiProvenance: typeof at.fxiProvenance === 'string' ? at.fxiProvenance : undefined,
      fxiGap: typeof at.fxiGap === 'string' ? at.fxiGap : null,
      name: typeof canonical?.name === 'string' ? canonical.name : null,
      fxe: typeof at.fxe === 'string' ? at.fxe : null,
    };
    const result = match(query, options.library, { top: options.top ?? 3 });
    outcome.match = result;
    if (result.kind === 'auto') {
      const xrefs = Array.isArray(at.xrefs) ? (at.xrefs as unknown[]) : [];
      const link = { system: options.system, id: result.id, link: 'auto' };
      if (!xrefs.some((x) => isObject(x) && x.system === link.system && x.id === link.id)) xrefs.push(link);
      at.xrefs = xrefs;
      provenance[`${this.target}.xrefs`] = { origin: 'transform', transform: ['fds-encoder:match'] };
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

/** The object at a dot path, created where missing */
function ensureObject(root: Record<string, unknown>, path: string): Record<string, unknown> {
  let current = root;
  for (const part of path.split('.')) {
    if (!isObject(current[part])) current[part] = {};
    current = current[part] as Record<string, unknown>;
  }
  return current;
}
