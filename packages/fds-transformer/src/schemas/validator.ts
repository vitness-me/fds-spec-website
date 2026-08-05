/**
 * Validator - JSON Schema validation using Ajv
 * 
 * Uses Ajv 2020-12 draft support for FDS schemas which use:
 * "$schema": "https://json-schema.org/draft/2020-12/schema"
 */

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { ValidationResult, ValidationError } from '../core/types.js';

export interface ValidatorOptions {
  /** Suppress console warnings (useful for testing schema validity) */
  silent?: boolean;
}

export class Validator {
  private ajv: InstanceType<typeof Ajv2020>;
  private compiledSchemas: Map<string, ReturnType<InstanceType<typeof Ajv2020>['compile']>> = new Map();
  private schemaErrors: Map<string, string> = new Map();
  private silent: boolean;

  constructor(options: ValidatorOptions = {}) {
    this.silent = options.silent ?? false;
    this.ajv = new Ajv2020({
      allErrors: true,
      verbose: true,
      strict: false,
      loadSchema: this.loadExternalSchema.bind(this),
    });
    addFormats(this.ajv);
  }

  /**
   * Load external schema by URI (for $ref resolution).
   *
   * Only consulted by Ajv's async `compileAsync()` — the synchronous `compile()`
   * used in `addSchemas` throws `MissingRefError` on an unresolved external `$ref`
   * without ever calling this.
   *
   * An unresolvable `$ref` MUST propagate. Substituting a permissive
   * `{ additionalProperties: true }` schema would make every constrained field
   * under that `$ref` validate against nothing — silently passing invalid data.
   */
  private async loadExternalSchema(uri: string): Promise<object> {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch external schema ${uri}: ${response.status} ${response.statusText}`
      );
    }
    return await response.json() as object;
  }

  /**
   * Add schemas to the validator
   * First registers all schemas with their $id, then compiles them
   */
  addSchemas(schemas: Map<string, object>): void {
    // First pass: add all schemas to Ajv so $refs can be resolved
    for (const [, schema] of schemas) {
      try {
        const schemaObj = schema as { $id?: string };
        if (schemaObj.$id) {
          // Add schema by its $id so it can be referenced
          this.ajv.addSchema(schema, schemaObj.$id);
        }
      } catch {
        // Schema might already be added, ignore
      }
    }

    // Second pass: compile schemas
    for (const [name, schema] of schemas) {
      try {
        const schemaObj = schema as { $id?: string };
        // Try to get already-compiled schema or compile it
        let compiled = schemaObj.$id ? this.ajv.getSchema(schemaObj.$id) : undefined;
        if (!compiled) {
          compiled = this.ajv.compile(schema);
        }
        if (compiled) {
          this.compiledSchemas.set(name, compiled as ReturnType<InstanceType<typeof Ajv2020>['compile']>);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (!this.silent) {
          console.warn(`Failed to compile schema ${name}:`, message);
        }
        this.schemaErrors.set(name, message);
      }
    }
  }

  /**
   * Check if a schema had compilation errors
   */
  hasSchemaError(name: string): boolean {
    return this.schemaErrors.has(name);
  }

  /**
   * Get schema compilation error
   */
  getSchemaError(name: string): string | undefined {
    return this.schemaErrors.get(name);
  }

  /**
   * Validate data against a schema
   */
  validate(data: unknown, schema: object | string): ValidationResult {
    let validateFn: ReturnType<InstanceType<typeof Ajv2020>['compile']>;

    if (typeof schema === 'string') {
      // A schema that failed to compile cannot validate anything. Reporting
      // `valid: true` here would silently pass every record — treat it as invalid.
      const schemaError = this.schemaErrors.get(schema);
      if (schemaError) {
        return {
          valid: false,
          errors: [
            {
              field: '_schema',
              message: `Schema "${schema}" could not be compiled: ${schemaError}. Data cannot be validated.`,
              constraint: 'schemaUnavailable',
            },
          ],
        };
      }

      // Likewise, an absent schema means validation never ran. Never report success.
      const compiled = this.compiledSchemas.get(schema);
      if (!compiled) {
        return {
          valid: false,
          errors: [
            {
              field: '_schema',
              message: `Schema "${schema}" not found. Data cannot be validated.`,
              constraint: 'schemaNotFound',
            },
          ],
        };
      }
      validateFn = compiled;
    } else {
      // Compile schema on the fly
      try {
        validateFn = this.ajv.compile(schema);
      } catch (error) {
        return {
          valid: false,
          errors: [
            {
              field: '_schema',
              message: `Failed to compile schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }

    const valid = validateFn(data);

    if (valid) {
      return { valid: true, errors: [] };
    }

    const errors: ValidationError[] = (validateFn.errors || []).map((err) => ({
      field: err.instancePath ? err.instancePath.slice(1).replace(/\//g, '.') : err.params?.missingProperty || '_root',
      message: err.message || 'Validation failed',
      value: err.data,
      constraint: err.keyword,
    }));

    return { valid: false, errors };
  }

  /**
   * Validate and return typed result
   */
  validateTyped<T>(data: unknown, schema: object | string): { valid: true; data: T } | { valid: false; errors: ValidationError[] } {
    const result = this.validate(data, schema);

    if (result.valid) {
      return { valid: true, data: data as T };
    }

    return { valid: false, errors: result.errors };
  }

  /**
   * Check if a value matches a specific type
   */
  isValidType(value: unknown, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return typeof value === 'number' && Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'null':
        return value === null;
      default:
        return true;
    }
  }

  /**
   * Format validation errors for display
   */
  formatErrors(errors: ValidationError[]): string {
    return errors
      .map((err) => {
        let msg = `${err.field}: ${err.message}`;
        if (err.constraint) {
          msg += ` (${err.constraint})`;
        }
        return msg;
      })
      .join('\n');
  }
}
