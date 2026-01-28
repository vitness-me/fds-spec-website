/**
 * Mapping Engine - applies field mappings from source to target
 */

import type {
  FieldMapping,
  FieldMappingObject,
  TransformContext,
} from './types.js';
import { TransformRegistry } from '../transforms/transform-registry.js';

export class MappingEngine {
  private transformRegistry: TransformRegistry;

  constructor() {
    this.transformRegistry = new TransformRegistry();
  }

  /**
   * Apply all mappings to transform source to target
   */
  async apply(
    source: Record<string, unknown>,
    mappings: Record<string, FieldMapping>,
    context: TransformContext
  ): Promise<Record<string, unknown>> {
    const target: Record<string, unknown> = {};

    for (const [targetPath, mapping] of Object.entries(mappings)) {
      const normalizedMapping = this.normalizeMapping(mapping);
      const value = await this.applyMapping(
        source,
        normalizedMapping,
        { ...context, field: targetPath, target }
      );

      if (value !== undefined) {
        this.setNestedValue(target, targetPath, value);
      }
    }

    return target;
  }

  /**
   * Normalize string shorthand to full mapping object
   */
  private normalizeMapping(mapping: FieldMapping): FieldMappingObject {
    if (typeof mapping === 'string') {
      return { from: mapping };
    }
    return mapping;
  }

  /**
   * Apply a single field mapping
   */
  private async applyMapping(
    source: Record<string, unknown>,
    mapping: FieldMappingObject,
    context: TransformContext
  ): Promise<unknown> {
    // Check condition if present
    if (mapping.condition) {
      const conditionMet = this.evaluateCondition(
        mapping.condition,
        source,
        context.config?.allowUnsafeEval === true
      );
      if (!conditionMet) {
        return undefined;
      }
    }

    // Get source value(s)
    let value: unknown;
    if (mapping.from === null || mapping.from === undefined) {
      value = undefined;
    } else if (Array.isArray(mapping.from)) {
      // Multiple source fields - try each until one has a value
      for (const path of mapping.from) {
        value = this.getNestedValue(source, path);
        if (value !== undefined && value !== null && value !== '') {
          break;
        }
      }
    } else {
      value = this.getNestedValue(source, mapping.from);
    }

    // Apply default if value is missing
    if ((value === undefined || value === null || value === '') && mapping.default !== undefined) {
      value = mapping.default;
    }

    // Apply transform(s)
    // Note: Transforms like 'uuid', 'timestamp' can generate values even without input
    if (mapping.transform) {
      const transforms = Array.isArray(mapping.transform)
        ? mapping.transform
        : [mapping.transform];

      for (const transformName of transforms) {
        value = await this.transformRegistry.apply(
          transformName,
          value,
          mapping.options || {},
          context
        );
      }
    }

    // Handle required fields
    if (mapping.required && (value === undefined || value === null)) {
      throw new Error(`Required field ${context.field} could not be populated`);
    }

    return value;
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array index notation: field[0]
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, fieldName, index] = arrayMatch;
        current = (current as Record<string, unknown>)[fieldName];
        if (Array.isArray(current)) {
          current = current[parseInt(index, 10)];
        } else {
          return undefined;
        }
      } else {
        current = (current as Record<string, unknown>)[part];
      }
    }

    return current;
  }

  /**
   * Set a nested value in an object using dot notation
   */
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): void {
    const parts = path.split('.');
    let current: unknown = obj;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);

      if (arrayMatch) {
        const [, fieldName, index] = arrayMatch;
        const targetIndex = parseInt(index, 10);

        if (current === null || current === undefined || typeof current !== 'object') {
          return;
        }

        const currentRecord = current as Record<string, unknown>;
        if (!Array.isArray(currentRecord[fieldName])) {
          currentRecord[fieldName] = [];
        }

        const arrayRef = currentRecord[fieldName] as unknown[];

        if (isLast) {
          arrayRef[targetIndex] = value;
          return;
        }

        if (arrayRef[targetIndex] === undefined) {
          const nextPart = parts[i + 1];
          arrayRef[targetIndex] = /^\w+\[\d+\]$/.test(nextPart) ? [] : {};
        }

        current = arrayRef[targetIndex];
        continue;
      }

      if (current === null || current === undefined || typeof current !== 'object') {
        return;
      }

      const currentRecord = current as Record<string, unknown>;
      if (isLast) {
        currentRecord[part] = value;
        return;
      }

      if (!(part in currentRecord)) {
        const nextPart = parts[i + 1];
        currentRecord[part] = /^\w+\[\d+\]$/.test(nextPart) ? [] : {};
      }

      current = currentRecord[part];
    }
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(
    condition: string,
    source: Record<string, unknown>,
    allowUnsafeEval: boolean
  ): boolean {
    if (!allowUnsafeEval) {
      console.warn('Conditional expressions are disabled. Set allowUnsafeEval to true to enable them.');
      return false;
    }
    try {
      // Create a safe evaluation context
      const fn = new Function('source', `return ${condition}`);
      return Boolean(fn(source));
    } catch {
      console.warn(`Failed to evaluate condition: ${condition}`);
      return true;
    }
  }
}
