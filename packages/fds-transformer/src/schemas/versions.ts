/**
 * FDS release versioning.
 *
 * Kept apart from `schema-manager.ts` so that asking "which version?" does not
 * drag Ajv and the whole validator into modules that only need a default — the
 * config loader and the CLI both do.
 *
 * The facts themselves live in `releases.generated.ts`, written by
 * `scripts/build-schemas.mjs` from the same traversal that publishes the schemas
 * and hashes them. They used to be restated here by hand, next to the schemas
 * they described but with nothing checking one against the other — and a version
 * map that disagrees with the published tree fails silently: every URL 404s, the
 * loader falls back to bundled copies, and the transformer runs offline forever
 * without saying so.
 */

import { CURRENT_RELEASE, RELEASE_ENTITY_VERSIONS } from './releases.generated.js';

/**
 * Entity schema versions per FDS release.
 *
 * Entities version independently: 1.1.0 extended the exercise and equipment
 * models, while muscle, muscle-category and body-atlas did not change and keep
 * their 1.0.0 URLs. A release therefore names a *set* of entity versions rather
 * than one path segment shared by all of them.
 *
 * A release absent from this map falls back to using its own version for every
 * entity. That keeps an older transformer able to fetch a newer published
 * release it has never heard of — the case the remote-first strategy exists for.
 */
export { RELEASE_ENTITY_VERSIONS };

/** The entity version a release publishes, or the release itself if unknown. */
export function entityVersionFor(entity: string, release: string): string {
  return RELEASE_ENTITY_VERSIONS[release]?.[entity] ?? release;
}

/**
 * The release used when a caller does not name one.
 *
 * Tracks the newest published release. FDS minor versions are additive — data
 * valid under 1.0.0 stays valid under 1.1.0 — so moving the default forward
 * cannot reject anything it previously accepted, while leaving it behind would
 * reject the fields the new release just introduced. Pin explicitly to stay on
 * an older release.
 */
export const DEFAULT_SCHEMA_VERSION = CURRENT_RELEASE;
