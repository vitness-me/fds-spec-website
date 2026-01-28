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
   * Load external schema by URI (for $ref resolution)
   * This is called by Ajv when it encounters an external $ref
   */
  private async loadExternalSchema(uri: string): Promise<object> {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.statusText}`);
      }
      return await response.json() as object;
    } catch (error) {
      // Return a permissive schema if we can't load the external reference
      if (!this.silent) {
        console.warn(`Could not load external schema ${uri}:`, error);
      }
      return { type: 'object', additionalProperties: true };
    }
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
      // Check if there was a compilation error for this schema
      const schemaError = this.schemaErrors.get(schema);
      if (schemaError) {
        // Return a warning but consider valid (schema couldn't be compiled)
        return {
          valid: true,
          errors: [],
          warnings: [
            {
              field: '_schema',
              message: `Schema "${schema}" could not be compiled: ${schemaError}. Validation skipped.`,
            },
          ],
        };
      }

      // Use pre-compiled schema by name
      const compiled = this.compiledSchemas.get(schema);
      if (!compiled) {
        // Schema not found - consider valid but warn
        return {
          valid: true,
          errors: [],
          warnings: [
            {
              field: '_schema',
              message: `Schema "${schema}" not found. Validation skipped.`,
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
