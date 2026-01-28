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

export interface SchemaVersion {
  version: string;
  url: string;
  bundled: boolean;
}

export interface SchemaLoadResult {
  source: 'remote' | 'bundled';
  entities: string[];
  errors: string[];
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
    const entities = ['exercise', 'equipment', 'muscle', 'muscle-category', 'body-atlas'];
    const errors: string[] = [];
    let source: 'remote' | 'bundled' = 'remote';

    // Try remote first
    let remoteSuccess = true;
    for (const entity of entities) {
      try {
        const schema = await this.fetchSchema(entity, version);
        entitySchemas.set(entity, schema);
      } catch (error) {
        remoteSuccess = false;
        errors.push(`Remote fetch failed for ${entity}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        errors.push(`Bundled fallback failed: ${bundledError instanceof Error ? bundledError.message : 'Unknown error'}`);
        // Log errors but don't throw - validator will handle missing schemas gracefully
        for (const err of errors) {
          console.warn(err);
        }
      }
    }

    this.lastLoadResult = {
      source,
      entities: Array.from(entitySchemas.keys()),
      errors,
    };

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
   * Load bundled schemas (fallback for offline/network errors)
   */
  private async loadBundled(version: string): Promise<Record<string, object>> {
    // Use statically imported bundled schemas for v1.0.0
    if (version === '1.0.0') {
      try {
        const bundled = await import('./bundled/v1.0.0/index.js');
        return bundled.default || bundled;
      } catch {
        throw new Error(`Failed to load bundled schemas for version ${version}`);
      }
    }
    throw new Error(`No bundled schemas for version ${version}`);
  }

  /**
   * Fetch schema from remote URL
   */
  private async fetchSchema(entity: string, version: string): Promise<object> {
    const baseUrl = 'https://spec.vitness.me/schemas';
    let url: string;

    switch (entity) {
      case 'exercise':
        url = `${baseUrl}/exercises/v${version}/exercise.schema.json`;
        break;
      case 'equipment':
        url = `${baseUrl}/equipment/v${version}/equipment.schema.json`;
        break;
      case 'muscle':
        url = `${baseUrl}/muscle/v${version}/muscle.schema.json`;
        break;
      case 'muscle-category':
        url = `${baseUrl}/muscle/muscle-category/v${version}/muscle-category.schema.json`;
        break;
      case 'body-atlas':
        url = `${baseUrl}/atlas/v${version}/body-atlas.schema.json`;
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }

    const schema = await response.json() as object;

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
    // For now, return known versions
    return [
      {
        version: '1.0.0',
        url: 'https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json',
        bundled: true,
      },
    ];
  }

  /**
   * Get a specific schema
   */
  getSchema(entity: string, version = '1.0.0'): object | null {
    return this.schemas.get(version)?.get(entity) ?? null;
  }

  /**
   * Validate data against a schema
   */
  async validate(
    data: unknown,
    entity: string,
    version = '1.0.0'
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
      };
    } catch (error) {
      this.lastLoadResult = {
        source: 'bundled',
        entities: [],
        errors: [`Failed to load bundled schemas: ${error instanceof Error ? error.message : 'Unknown error'}`],
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
