import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SCHEMA_VERSION,
  RELEASE_ENTITY_VERSIONS,
  entityVersionFor,
} from './versions.js';
import { SchemaManager } from './schema-manager.js';
import bundled100 from './bundled/v1.0.0/index.js';
import bundled110 from './bundled/v1.1.0/index.js';

/**
 * Entities version independently, so a release name is not a path segment.
 * Getting that wrong is silent: every entity 404s, the loader falls back to
 * bundled, and the transformer runs offline forever without saying so.
 *
 * The map is hand-maintained but the bundled schemas are generated, so these
 * tests check the map against the `$id` the generator wrote.
 */

const ENTITIES = ['exercise', 'equipment', 'muscle', 'muscle-category', 'body-atlas'];

const versionFromId = (schema: unknown): string => {
  const id = (schema as { $id?: string }).$id ?? '';
  const match = id.match(/\/v(\d+\.\d+\.\d+)\/[^/]+\.schema\.json$/);
  if (!match) throw new Error(`no version in $id: ${id || '(missing)'}`);
  return match[1];
};

describe('release versioning', () => {
  describe('entityVersionFor', () => {
    it('maps each entity of a known release to the version it published', () => {
      expect(entityVersionFor('exercise', '1.1.0')).toBe('1.1.0');
      expect(entityVersionFor('equipment', '1.1.0')).toBe('1.1.0');
      // unchanged in 1.1.0 — must keep their 1.0.0 URLs
      expect(entityVersionFor('muscle', '1.1.0')).toBe('1.0.0');
      expect(entityVersionFor('muscle-category', '1.1.0')).toBe('1.0.0');
      expect(entityVersionFor('body-atlas', '1.1.0')).toBe('1.0.0');
    });

    it('falls back to the release itself for a release it has never heard of', () => {
      // Keeps an older transformer able to fetch a newer published release.
      expect(entityVersionFor('exercise', '2.0.0')).toBe('2.0.0');
      expect(entityVersionFor('muscle', '2.0.0')).toBe('2.0.0');
    });

    it('falls back for an unknown entity within a known release', () => {
      expect(entityVersionFor('workout', '1.1.0')).toBe('1.1.0');
    });
  });

  describe('the map agrees with the bundled schemas it describes', () => {
    it.each([
      ['1.0.0', bundled100],
      ['1.1.0', bundled110],
    ])('release %s', (release, bundle) => {
      for (const entity of ENTITIES) {
        const schema = (bundle as unknown as Record<string, unknown>)[entity];
        expect(schema, `${release} bundle is missing ${entity}`).toBeDefined();
        expect(versionFromId(schema), `${release}/${entity} $id`).toBe(
          RELEASE_ENTITY_VERSIONS[release][entity]
        );
      }
    });
  });

  describe('DEFAULT_SCHEMA_VERSION', () => {
    it('names the newest release', () => {
      const newest = Object.keys(RELEASE_ENTITY_VERSIONS).sort().at(-1);
      expect(DEFAULT_SCHEMA_VERSION).toBe(newest);
    });

    it('is bundled, so the default path works offline', () => {
      expect(SchemaManager.hasBundledVersion(DEFAULT_SCHEMA_VERSION)).toBe(true);
    });
  });

  /**
   * Publishing a version without bundling it is the failure 34.1–34.3 closed:
   * the fetch 404s, the fallback throws, and (before the fix) validation passed
   * everything. Every release this package knows about must be bundled.
   */
  describe('every known release is bundled', () => {
    it('has no release without an offline copy', () => {
      expect(SchemaManager.getBundledVersions()).toEqual(
        Object.keys(RELEASE_ENTITY_VERSIONS).sort()
      );
    });
  });
});
