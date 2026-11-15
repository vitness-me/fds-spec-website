/**
 * Slug collisions fail the run.
 *
 * A slug names a document: per-document output is written to `<slug>.json`
 * and enrichment results are matched back to records by slug. Two records
 * with one slug would overwrite each other's file or swap enrichment, so the
 * run stops before anything is written.
 */

/**
 * Throw if two documents share `canonical.slug`. Entries are in source order;
 * an entry with no document or no slug is skipped.
 */
export function assertUniqueSlugs(documents: ReadonlyArray<unknown>): void {
  const recordsBySlug = new Map<string, number[]>();

  documents.forEach((document, index) => {
    const slug = (document as { canonical?: { slug?: unknown } } | undefined)?.canonical?.slug;
    if (typeof slug !== 'string') return;
    recordsBySlug.set(slug, [...(recordsBySlug.get(slug) ?? []), index + 1]);
  });

  const collisions = [...recordsBySlug].filter(([, records]) => records.length > 1);
  if (collisions.length === 0) return;

  throw new Error(
    'Slug collision: ' +
      collisions
        .map(([slug, records]) => `"${slug}" from source records ${records.map((r) => `#${r}`).join(', ')}`)
        .join('; ') +
      '. Every document needs its own slug, so the run stopped.'
  );
}
