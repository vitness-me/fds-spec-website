/**
 * FDS release versioning.
 *
 * Kept apart from `schema-manager.ts` so that asking "which version?" does not
 * drag Ajv and the whole validator into modules that only need a default — the
 * config loader and the CLI both do.
 */

/**
 * Entity schema versions per FDS release.
 *
 * Entities version independently: 1.1.0 extended the exercise and equipment
 * models, while muscle, muscle-category and body-atlas did not change and keep
 * their 1.0.0 URLs. A release therefore names a *set* of entity versions rather
 * than one path segment shared by all five.
 *
 * A release absent from this map falls back to using its own version for every
 * entity. That keeps an older transformer able to fetch a newer published
 * release it has never heard of — the case the remote-first strategy exists for.
 */
export const RELEASE_ENTITY_VERSIONS: Record<string, Record<string, string>> = {
  '1.0.0': {
    exercise: '1.0.0',
    equipment: '1.0.0',
    muscle: '1.0.0',
    'muscle-category': '1.0.0',
    'body-atlas': '1.0.0',
  },
  '1.1.0': {
    exercise: '1.1.0',
    equipment: '1.1.0',
    muscle: '1.0.0',
    'muscle-category': '1.0.0',
    'body-atlas': '1.0.0',
  },
  // 1.2.0 adds workout. No existing entity changed — a release is the set of
  // entity versions it publishes, so gaining an entity is a new set even when
  // every prior member kept its version.
  '1.2.0': {
    exercise: '1.1.0',
    equipment: '1.1.0',
    muscle: '1.0.0',
    'muscle-category': '1.0.0',
    'body-atlas': '1.0.0',
    workout: '1.0.0',
  },
  // 1.3.0 adds program. Again no existing entity moved.
  '1.3.0': {
    exercise: '1.1.0',
    equipment: '1.1.0',
    muscle: '1.0.0',
    'muscle-category': '1.0.0',
    'body-atlas': '1.0.0',
    workout: '1.0.0',
    program: '1.0.0',
  },
  // 1.4.0 moves workout to 1.1.0 — per-set intensity zones and machine settings.
  // The first release where an entity this batch introduced has itself moved, so
  // it is also the first proof that the version map is doing real work: a client
  // pinned to 1.3.0 keeps fetching workout/v1.0.0/, which is still published.
  '1.4.0': {
    exercise: '1.1.0',
    equipment: '1.1.0',
    muscle: '1.0.0',
    'muscle-category': '1.0.0',
    'body-atlas': '1.0.0',
    workout: '1.1.0',
    program: '1.0.0',
  },
};

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
export const DEFAULT_SCHEMA_VERSION = '1.4.0';
