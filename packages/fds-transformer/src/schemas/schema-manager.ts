/**
 * Schema Manager - handles FDS schema loading and versioning
 * 
 * Uses a hybrid approach:
 * 1. Try fetching from spec.vitness.me (gets latest schemas)
 * 2. Fall back to bundled schemas if remote fails (offline support)
 * 
 * This ensures the transformer works both online (with latest schemas)
 * and offline (with bundled fallback).
 */

import type { ValidationResult } from '../core/types.js';
import { Validator } from './validator.js';
import { DEFAULT_SCHEMA_VERSION, entityVersionFor, RELEASE_ENTITY_VERSIONS } from './versions.js';

export { DEFAULT_SCHEMA_VERSION, entityVersionFor, RELEASE_ENTITY_VERSIONS };

/**
 * Bundled schema loaders, keyed by schema version.
 *
 * Static import specifiers are required so the bundler can resolve them at build
 * time — a computed `import(\`./bundled/v${version}/index.js\`)` would not be
 * bundled and would fail at runtime in the published package.
 *
 * To add a version: create `./bundled/v<version>/` and add one entry here.
 */
const BUNDLED_SCHEMA_LOADERS: Record<string, () => Promise<Record<string, object>>> = {
  '1.0.0': async () => {
    const mod = await import('./bundled/v1.0.0/index.js');
    return (mod.default ?? mod) as unknown as Record<string, object>;
  },
  '1.1.0': async () => {
    const mod = await import('./bundled/v1.1.0/index.js');
    return (mod.default ?? mod) as unknown as Record<string, object>;
  },
  '1.2.0': async () => {
    const mod = await import('./bundled/v1.2.0/index.js');
    return (mod.default ?? mod) as unknown as Record<string, object>;
  },
  '1.3.0': async () => {
    const mod = await import('./bundled/v1.3.0/index.js');
    return (mod.default ?? mod) as unknown as Record<string, object>;
  },
  '1.4.0': async () => {
    const mod = await import('./bundled/v1.4.0/index.js');
    return (mod.default ?? mod) as unknown as Record<string, object>;
  },
};


export interface SchemaVersion {
  version: string;
  url: string;
  bundled: boolean;
}

/**
 * Why a remote schema could not be used.
 *
 * The distinction that matters is the last one. `unreachable` and `httpError`
 * are ordinary — no network, wrong URL — and the bundled fallback is the right
 * answer. `notJson` and `notASchema` mean the URL *answered*, successfully, with
 * something that is not a schema: a sign-in page, a captive portal, a CDN error
 * page, a Pages 404 rendered as HTML. That is a misconfiguration, and it reads
 * completely differently to whoever has to fix it.
 */
export type SchemaFetchFailureReason =
  | 'unreachable'
  | 'httpError'
  | 'notJson'
  | 'notASchema';

export interface SchemaFetchFailure {
  entity: string;
  url: string;
  reason: SchemaFetchFailureReason;
  message: string;
}

export interface SchemaLoadResult {
  source: 'remote' | 'bundled';
  entities: string[];
  errors: string[];
  /**
   * The same failures as `errors`, structured. Callers deciding whether to warn
   * loudly need the reason, not a string to match against.
   */
  failures: SchemaFetchFailure[];
}

/** A remote fetch that did not yield a usable schema, with the reason attached. */
export class SchemaFetchError extends Error {
  constructor(
    readonly reason: SchemaFetchFailureReason,
    readonly url: string,
    message: string
  ) {
    super(message);
    this.name = 'SchemaFetchError';
  }
}

/**
 * Whether a content type promises JSON.
 *
 * Accepts the `+json` structured-syntax suffix, so `application/schema+json`
 * counts. Parameters are ignored: `application/json; charset=utf-8` is JSON.
 */
function isJsonContentType(contentType: string): boolean {
  const essence = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  return essence === 'application/json' || essence.endsWith('+json');
}

export class SchemaManager {
  private schemas: Map<string, Map<string, object>> = new Map();
  private validator: Validator;
  private cacheDir: string | null = null;
  private lastLoadResult: SchemaLoadResult | null = null;

  constructor() {
    this.validator = new Validator();
  }

  /**
   * Load a specific schema version using hybrid approach:
   * 1. Try remote first (gets latest)
   * 2. Validate that schemas compile correctly (catch broken $ref paths)
   * 3. Fall back to bundled if remote fails or has compilation errors
   */
  async loadVersion(version: string): Promise<void> {
    if (this.schemas.has(version)) {
      return;
    }

    const entitySchemas = new Map<string, object>();
    // Entities the release publishes. A release that predates an entity must not
    // try to fetch it — 1.1.0 has no workout URL, and asking for one would 404
    // and drop the whole release to the bundled fallback.
    const entities = Object.keys(RELEASE_ENTITY_VERSIONS[version] ?? {});
    if (entities.length === 0) {
      entities.push('exercise', 'equipment', 'muscle', 'muscle-category', 'body-atlas');
    }
    const errors: string[] = [];
    const failures: SchemaFetchFailure[] = [];
    let source: 'remote' | 'bundled' = 'remote';

    // Try remote first
    let remoteSuccess = true;
    for (const entity of entities) {
      try {
        const schema = await this.fetchSchema(entity, version);
        entitySchemas.set(entity, schema);
      } catch (error) {
        remoteSuccess = false;
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (error instanceof SchemaFetchError) {
          failures.push({ entity, url: error.url, reason: error.reason, message });
          errors.push(`Remote fetch failed for ${entity} [${error.reason}]: ${message}`);
        } else {
          errors.push(`Remote fetch failed for ${entity}: ${message}`);
        }
        break; // If one fails, switch to bundled for all
      }
    }

    // If remote fetch succeeded, validate schemas compile correctly
    if (remoteSuccess) {
      // Use silent mode to avoid duplicate warnings - we'll log our own if fallback is needed
      const testValidator = new Validator({ silent: true });
      testValidator.addSchemas(entitySchemas);
      
      // Check if any schema had compilation errors
      for (const entity of entities) {
        if (testValidator.hasSchemaError(entity)) {
          remoteSuccess = false;
          errors.push(`Remote schema compilation failed for ${entity}: ${testValidator.getSchemaError(entity)}`);
        }
      }
    }

    // If remote failed (fetch or compilation), fall back to bundled
    if (!remoteSuccess) {
      entitySchemas.clear();
      source = 'bundled';

      try {
        const bundled = await this.loadBundled(version);
        for (const [entity, schema] of Object.entries(bundled)) {
          entitySchemas.set(entity, schema);
        }
      } catch (bundledError) {
        errors.push(
          `Bundled fallback failed: ${bundledError instanceof Error ? bundledError.message : 'Unknown error'}`
        );
      }
    }

    this.lastLoadResult = {
      source,
      entities: Array.from(entitySchemas.keys()),
      errors,
      failures,
    };

    // Both paths exhausted. Caching an empty schema set here would leave every
    // subsequent validate() call with nothing to check against — fail loudly instead.
    if (entitySchemas.size === 0) {
      throw new Error(
        `Unable to load FDS schemas for version ${version}. ` +
          `Remote fetch and bundled fallback both failed:\n  - ${errors.join('\n  - ')}`
      );
    }

    this.schemas.set(version, entitySchemas);
    this.validator.addSchemas(entitySchemas);
  }

  /**
   * Get information about how schemas were loaded
   */
  getLoadResult(): SchemaLoadResult | null {
    return this.lastLoadResult;
  }

  /**
   * Versions with bundled schemas available for offline fallback.
   */
  static getBundledVersions(): string[] {
    return Object.keys(BUNDLED_SCHEMA_LOADERS).sort();
  }

  /**
   * Whether a version can be served from bundled schemas.
   */
  static hasBundledVersion(version: string): boolean {
    return version in BUNDLED_SCHEMA_LOADERS;
  }

  /**
   * Load bundled schemas (fallback for offline/network errors).
   *
   * Throws when the version has no bundled copy — the caller must surface that
   * rather than proceeding with an empty schema set.
   */
  private async loadBundled(version: string): Promise<Record<string, object>> {
    const loader = BUNDLED_SCHEMA_LOADERS[version];
    if (!loader) {
      const available = SchemaManager.getBundledVersions().join(', ') || 'none';
      throw new Error(
        `No bundled schemas for version ${version} (available: ${available})`
      );
    }

    try {
      return await loader();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to load bundled schemas for version ${version}: ${message}`
      );
    }
  }

  /**
   * Fetch schema from remote URL
   */
  private async fetchSchema(entity: string, version: string): Promise<object> {
    const baseUrl = 'https://spec.vitness.me/schemas';

    // The release name is not the path segment — see RELEASE_ENTITY_VERSIONS.
    // Using it directly would request muscle/v1.1.0/, a URL that was never
    // published, and send every entity down the bundled fallback.
    const v = entityVersionFor(entity, version);
    let url: string;

    switch (entity) {
      case 'exercise':
        url = `${baseUrl}/exercises/v${v}/exercise.schema.json`;
        break;
      case 'equipment':
        url = `${baseUrl}/equipment/v${v}/equipment.schema.json`;
        break;
      case 'muscle':
        url = `${baseUrl}/muscle/v${v}/muscle.schema.json`;
        break;
      case 'muscle-category':
        url = `${baseUrl}/muscle/muscle-category/v${v}/muscle-category.schema.json`;
        break;
      case 'body-atlas':
        url = `${baseUrl}/atlas/v${v}/body-atlas.schema.json`;
        break;
      case 'workout':
        url = `${baseUrl}/workout/v${v}/workout.schema.json`;
        break;
      case 'program':
        url = `${baseUrl}/program/v${v}/program.schema.json`;
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }

    let response: Response;
    try {
      response = await fetch(url);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unknown error';
      throw new SchemaFetchError('unreachable', url, `${url} could not be reached: ${message}`);
    }

    if (!response.ok) {
      throw new SchemaFetchError(
        'httpError',
        url,
        `${url} answered ${response.status} ${response.statusText}`
      );
    }

    // A 200 is not proof that a schema came back. Anything that intercepts the
    // request — a Cloudflare Access sign-in page, a captive portal, a CDN error
    // page — answers 200 with HTML, and calling .json() on it produces a parse
    // error that names neither the URL nor what actually arrived. Checking the
    // content type first is what turns "unexpected token <" into a sentence
    // someone can act on.
    const contentType = response.headers.get('content-type') ?? '';
    if (!isJsonContentType(contentType)) {
      throw new SchemaFetchError(
        'notJson',
        url,
        `${url} answered ${response.status} with content-type ` +
          `"${contentType || 'none'}", not JSON. The URL is reachable but is ` +
          'not serving a schema — an interstitial, sign-in page or error page ' +
          'usually answers this way.'
      );
    }

    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unknown error';
      throw new SchemaFetchError(
        'notJson',
        url,
        `${url} declared content-type "${contentType}" but the body is not valid JSON: ${message}`
      );
    }

    // A JSON body is still not necessarily a schema. An API gateway answering
    // {"error":"forbidden"} in JSON would otherwise be cached and compiled as
    // an empty schema, which validates everything.
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed) ||
      typeof (parsed as { $id?: unknown }).$id !== 'string'
    ) {
      throw new SchemaFetchError(
        'notASchema',
        url,
        `${url} returned JSON with no string $id, so it is not an FDS schema document.`
      );
    }

    const schema = parsed as object;

    // Cache locally if cacheDir is set
    if (this.cacheDir) {
      await this.cacheSchema(entity, version, schema);
    }

    return schema;
  }

  /**
   * Cache schema locally
   */
  private async cacheSchema(
    entity: string,
    version: string,
    schema: object
  ): Promise<void> {
    if (!this.cacheDir) return;

    const fs = await import('fs/promises');
    const path = await import('path');

    const dir = path.join(this.cacheDir, `v${version}`);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${entity}.schema.json`);
    await fs.writeFile(filePath, JSON.stringify(schema, null, 2));
  }

  /**
   * List available schema versions
   */
  async listVersions(): Promise<SchemaVersion[]> {
    return Object.keys(RELEASE_ENTITY_VERSIONS)
      .sort()
      .map((version) => ({
        version,
        url: `https://spec.vitness.me/schemas/exercises/v${entityVersionFor('exercise', version)}/exercise.schema.json`,
        bundled: SchemaManager.hasBundledVersion(version),
      }));
  }

  /**
   * Get a specific schema
   */
  getSchema(entity: string, version = DEFAULT_SCHEMA_VERSION): object | null {
    return this.schemas.get(version)?.get(entity) ?? null;
  }

  /**
   * Validate data against a schema
   */
  async validate(
    data: unknown,
    entity: string,
    version = DEFAULT_SCHEMA_VERSION
  ): Promise<ValidationResult> {
    // Ensure schema is loaded
    await this.loadVersion(version);

    // Use the entity name to validate (uses pre-compiled schema or handles errors gracefully)
    return this.validator.validate(data, entity);
  }

  /**
   * Set the cache directory
   */
  setCacheDir(dir: string): void {
    this.cacheDir = dir;
  }

  /**
   * Update cached schemas
   */
  async updateCache(): Promise<void> {
    const versions = await this.listVersions();
    for (const { version } of versions) {
      await this.loadVersion(version);
    }
  }

  /**
   * Force load bundled schemas only (skip remote fetch)
   * Useful for offline mode or when remote schemas are known to be broken
   */
  async loadBundledOnly(version: string): Promise<void> {
    if (this.schemas.has(version)) {
      return;
    }

    const entitySchemas = new Map<string, object>();

    try {
      const bundled = await this.loadBundled(version);
      for (const [entity, schema] of Object.entries(bundled)) {
        entitySchemas.set(entity, schema);
      }
      
      this.lastLoadResult = {
        source: 'bundled',
        entities: Array.from(entitySchemas.keys()),
        errors: [],
        failures: [],
      };
    } catch (error) {
      this.lastLoadResult = {
        source: 'bundled',
        entities: [],
        errors: [`Failed to load bundled schemas: ${error instanceof Error ? error.message : 'Unknown error'}`],
        failures: [],
      };
      throw error;
    }

    this.schemas.set(version, entitySchemas);
    this.validator.addSchemas(entitySchemas);
  }

  /**
   * Clear loaded schemas (useful for testing or reloading)
   */
  clearSchemas(): void {
    this.schemas.clear();
    this.lastLoadResult = null;
  }
}
