/**
 * The `transform` command's descriptor flags, read into `DescriptorOptions`, and the report a run writes beside its
 * output: every record a descriptor step acted on, and what it did.
 */

import { basename } from 'path';
import { loadWordSet, readJson, rowsOf } from '@vitness/fds-encoder';
import type { MatchRow } from '@vitness/fds-encoder';
import type { DescriptorOptions, DescriptorOutcome } from './descriptor-steps.js';

export const DESCRIPTOR_REPORT_FILENAME = 'descriptors.report.json';

export interface DescriptorFlags {
  fxiAnswers?: string;
  fxiProvenance?: string;
  words?: string;
  resolveLibrary?: string;
  resolveSystem?: string;
}

/** The descriptor options the flags ask for, or undefined when they ask for none. */
export async function descriptorOptionsFrom(flags: DescriptorFlags): Promise<DescriptorOptions | undefined> {
  if (flags.fxiAnswers === undefined && flags.resolveLibrary === undefined) {
    if (flags.words !== undefined || flags.fxiProvenance !== undefined || flags.resolveSystem !== undefined) {
      throw new Error('--words, --fxi-provenance and --resolve-system apply to --fxi-answers or --resolve-library; neither was given.');
    }
    return undefined;
  }
  const provenance = flags.fxiProvenance ?? 'import';
  if (provenance !== 'import' && provenance !== 'agent') {
    throw new Error(`--fxi-provenance is import or agent, not "${provenance}": owner provenance comes only from the owner, through fds-encoder.`);
  }
  const options: DescriptorOptions = {};
  if (flags.fxiAnswers !== undefined) {
    options.propose = {
      answersFrom: flags.fxiAnswers,
      provenance,
      ...(flags.words === undefined ? {} : { words: await loadWordSet(flags.words) }),
    };
  } else if (flags.words !== undefined) {
    throw new Error('--words applies to --fxi-answers, which was not given.');
  }
  if (flags.resolveLibrary !== undefined) {
    const rows = rowsOf(await readJson(flags.resolveLibrary));
    if (rows === undefined) throw new Error(`${flags.resolveLibrary}: a library is a JSON list of {id, fxi, fxiProvenance, fxiGap, name?, fxe?}, or an object with that list under "entries".`);
    options.resolve = {
      library: (rows as unknown as MatchRow[]).filter((r) => typeof r.fxi === 'string'),
      system: flags.resolveSystem ?? basename(flags.resolveLibrary).replace(/\.json$/i, ''),
    };
  }
  return options;
}

export interface DescriptorReport {
  /** How many records each step acted on, and how they came out */
  summary: { proposed: number; notBuilt: number; auto: number; confirm: number; absent: number };
  /** Every record a step acted on. A `confirm` match is for a person to settle; import proposals are candidate search only. */
  records: DescriptorOutcome[];
}

/** The report for a run's results. */
export function descriptorReport(results: ReadonlyArray<{ descriptors?: DescriptorOutcome }>): DescriptorReport {
  const records = results.flatMap((r) => (r.descriptors ? [r.descriptors] : []));
  const kind = (k: string) => records.filter((r) => r.match?.kind === k).length;
  return {
    summary: {
      proposed: records.filter((r) => r.proposed !== undefined).length,
      notBuilt: records.filter((r) => r.problems !== undefined).length,
      auto: kind('auto'),
      confirm: kind('confirm'),
      absent: kind('absent'),
    },
    records,
  };
}
