/**
 * Provenance: where each written value came from, and the sidecar file that
 * carries it next to the transformer's output.
 */

import { createHash } from 'crypto';
import type { RecordProvenance } from './types.js';

/** The published schema a provenance sidecar is validated by */
export const PROVENANCE_SCHEMA_URL =
  'https://spec.vitness.me/schemas/transformer/provenance/v1.0.0/provenance.schema.json';

/** The sidecar's file name; the dot keeps it clear of any `<slug>.json` output file */
export const PROVENANCE_SIDECAR_FILENAME = 'provenance.sidecar.json';

export interface ProvenanceSidecar {
  $schema: string;
  records: Array<{
    /** The document's id (`exerciseId`, or `id` for other entities), if it has one */
    id: string | null;
    /** The document's `canonical.slug`, if it has one */
    slug: string | null;
    /** Field path -> where its value came from */
    fields: RecordProvenance;
  }>;
}

/** `sha256:` and the first 16 hex digits of the hash of a prompt's fixed text */
export function promptVersion(...texts: string[]): string {
  return `sha256:${createHash('sha256').update(texts.join('\n')).digest('hex').slice(0, 16)}`;
}

/** A model's reported confidence, if it is a number from 0 to 1; otherwise null */
export function readConfidence(value: unknown): number | null {
  return typeof value === 'number' && value >= 0 && value <= 1 ? value : null;
}

/**
 * The sidecar for a run: one record per document written, in output order
 */
export function buildProvenanceSidecar(
  results: Array<{ success?: boolean; data?: unknown; provenance?: RecordProvenance }>
): ProvenanceSidecar {
  return {
    $schema: PROVENANCE_SCHEMA_URL,
    records: results
      .filter((result) => result.success && result.data)
      .map((result) => {
        const data = result.data as Record<string, unknown>;
        const canonical = data.canonical as Record<string, unknown> | undefined;
        const id = data.exerciseId ?? data.id;
        return {
          id: typeof id === 'string' ? id : null,
          slug: typeof canonical?.slug === 'string' ? canonical.slug : null,
          fields: result.provenance ?? {},
        };
      }),
  };
}

/**
 * The sidecar as JSON with every object's keys sorted, so the same run gives
 * the same bytes whatever order fields were recorded in
 */
export function serializeProvenanceSidecar(sidecar: ProvenanceSidecar, pretty = true): string {
  return `${JSON.stringify(sortKeys(sidecar), null, pretty ? 2 : undefined)}\n`;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])])
    );
  }
  return value;
}
