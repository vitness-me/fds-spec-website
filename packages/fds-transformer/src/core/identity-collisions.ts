/**
 * Identity collisions fail the run.
 *
 * A document's id and slug name it. Per-document output is written to
 * `<slug>.json`, enrichment results are matched back to records by slug, and
 * consumers key on the id. With deterministic ids (uuidv5), two records whose
 * names match get one id. Two records sharing either would overwrite each
 * other or swap data, so the run stops before anything is written.
 */

/** Where each entity keeps its identity: `exerciseId` on exercises, `id` elsewhere */
const IDENTITY_PATHS = ['canonical.slug', 'exerciseId', 'id'] as const;

/**
 * Throw if two documents share a slug or an id. Entries are in source order;
 * an entry with no document, or a document without that field, is skipped.
 */
export function assertUniqueIdentities(documents: ReadonlyArray<unknown>): void {
  const collisions: string[] = [];

  for (const path of IDENTITY_PATHS) {
    const recordsByValue = new Map<string, number[]>();
    documents.forEach((document, index) => {
      const value = path
        .split('.')
        .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], document);
      if (typeof value !== 'string') return;
      recordsByValue.set(value, [...(recordsByValue.get(value) ?? []), index + 1]);
    });
    for (const [value, records] of recordsByValue) {
      if (records.length > 1) {
        collisions.push(`${path} "${value}" from source records ${records.map((r) => `#${r}`).join(', ')}`);
      }
    }
  }

  if (collisions.length === 0) return;
  throw new Error(
    `Identity collision: ${collisions.join('; ')}. Every document needs its own slug and id, so the run stopped.`
  );
}
