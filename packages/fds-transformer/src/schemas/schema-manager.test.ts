import { describe, it, expect, vi, afterEach } from 'vitest';
import { SchemaManager } from './schema-manager.js';

/**
 * `loadBundled()` used to hard-code `version === '1.0.0'`. Any other version
 * threw, `loadVersion()` swallowed it, and an empty schema map was cached —
 * which (combined with the old validator behaviour) silently passed all input.
 *
 * Publishing a new schema version is exactly what triggers that path, so these
 * tests gate any version bump.
 */

const unreachableRemote = () =>
  vi.fn().mockRejectedValue(new Error('network unreachable'));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SchemaManager', () => {
  describe('bundled version registry', () => {
    it('reports the versions it can serve offline', () => {
      expect(SchemaManager.getBundledVersions()).toEqual(['1.0.0', '1.1.0', '1.2.0']);
    });

    it('answers hasBundledVersion for known and unknown versions', () => {
      expect(SchemaManager.hasBundledVersion('1.0.0')).toBe(true);
      expect(SchemaManager.hasBundledVersion('1.1.0')).toBe(true);
      expect(SchemaManager.hasBundledVersion('1.2.0')).toBe(true);
      expect(SchemaManager.hasBundledVersion('9.9.9')).toBe(false);
    });
  });

  describe('loadVersion must fail loudly, not cache an empty schema set', () => {
    it('throws for an unknown version when the remote is unreachable', async () => {
      vi.stubGlobal('fetch', unreachableRemote());
      const manager = new SchemaManager();

      await expect(manager.loadVersion('9.9.9')).rejects.toThrow(
        /Unable to load FDS schemas for version 9\.9\.9/
      );
    });

    it('names the available bundled versions in the failure', async () => {
      vi.stubGlobal('fetch', unreachableRemote());
      const manager = new SchemaManager();

      await expect(manager.loadVersion('9.9.9')).rejects.toThrow(
        /available: 1\.0\.0, 1\.1\.0, 1\.2\.0/
      );
    });

    it('falls back to bundled schemas when the remote is unreachable', async () => {
      vi.stubGlobal('fetch', unreachableRemote());
      const manager = new SchemaManager();

      await manager.loadVersion('1.0.0');

      expect(manager.getLoadResult()?.source).toBe('bundled');
      expect(manager.getLoadResult()?.entities).toContain('exercise');
      expect(manager.getSchema('exercise', '1.0.0')).not.toBeNull();
    });
  });

  describe('validation after a failed load', () => {
    it('does not report unvalidated data as valid', async () => {
      vi.stubGlobal('fetch', unreachableRemote());
      const manager = new SchemaManager();

      // The load itself must throw...
      await expect(manager.loadVersion('9.9.9')).rejects.toThrow();

      // ...and validating against that version must not silently succeed.
      await expect(manager.validate({ anything: true }, 'exercise', '9.9.9')).rejects.toThrow();
    });
  });

  describe('loadBundledOnly', () => {
    it('loads bundled schemas without touching the network', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      const manager = new SchemaManager();

      await manager.loadBundledOnly('1.0.0');

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(manager.getLoadResult()?.source).toBe('bundled');
      expect(manager.getSchema('exercise', '1.0.0')).not.toBeNull();
    });

    it('throws for a version with no bundled copy', async () => {
      const manager = new SchemaManager();

      await expect(manager.loadBundledOnly('9.9.9')).rejects.toThrow(
        /No bundled schemas for version 9\.9\.9/
      );
    });
  });

  describe('bundled schemas are self-contained', () => {
    it.each(['1.0.0', '1.1.0', '1.2.0'])(
      'compiles every bundled entity schema of %s without unresolved $refs',
      async (version) => {
        vi.stubGlobal('fetch', unreachableRemote());
        const manager = new SchemaManager();

        await manager.loadVersion(version);

        // A deliberately broken schema would surface here as a compile error.
        for (const entity of manager.getLoadResult()?.entities ?? []) {
          const result = await manager.validate({}, entity, version);
          const schemaLevelFailure = result.errors.some(
            (e) => e.constraint === 'schemaUnavailable' || e.constraint === 'schemaNotFound'
          );
          expect(schemaLevelFailure).toBe(false);
        }
      }
    );
  });

  /**
   * 1.1.0 is only worth publishing if the bundled copy is actually the new
   * schema. Loading it offline and feeding it a document that only 1.1.0
   * accepts proves the bundle is not a stale duplicate of 1.0.0.
   */
  describe('the 1.1.0 bundle is the 1.1.0 schema', () => {
    const exerciseWithNewFields = {
      schemaVersion: '1.1.0',
      exerciseId: '00000000-0000-4000-8000-000000000005',
      canonical: { name: 'Assisted Pull-Up', slug: 'assisted-pull-up' },
      classification: {
        exerciseType: 'strength',
        movement: 'pull-vertical',
        mechanics: 'compound',
        force: 'pull',
        level: 'beginner',
      },
      targets: {
        primary: [{ id: 'mus.lats', name: 'Latissimus Dorsi', categoryId: 'cat.back' }],
      },
      loading: { externalLoad: 'optional', assisted: true },
      metrics: {
        primary: { type: 'reps', unit: 'count' },
        secondary: [
          { type: 'percentBodyweight', unit: 'percent' },
          { type: 'rir', unit: 'count' },
        ],
      },
      metadata: {
        createdAt: '2026-08-06T00:00:00Z',
        updatedAt: '2026-08-06T00:00:00Z',
        status: 'active',
        source: 'vitness.core',
      },
    };

    it('accepts loading and the new metric vocabulary offline', async () => {
      vi.stubGlobal('fetch', unreachableRemote());
      const manager = new SchemaManager();

      await manager.loadVersion('1.1.0');

      expect(manager.getLoadResult()?.source).toBe('bundled');
      const result = await manager.validate(exerciseWithNewFields, 'exercise', '1.1.0');
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it('rejects the same document under 1.0.0, so the two bundles differ', async () => {
      vi.stubGlobal('fetch', unreachableRemote());
      const manager = new SchemaManager();

      await manager.loadBundledOnly('1.0.0');

      const result = await manager.validate(exerciseWithNewFields, 'exercise', '1.0.0');
      expect(result.valid).toBe(false);
      // Specifically because 1.0.0 has no `loading` and is a closed object —
      // not because the fixture is malformed in some unrelated way.
      expect(JSON.stringify(result.errors)).toMatch(/loading/);
    });
  });
});
