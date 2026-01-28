/**
 * Transform Registry - manages transform functions and plugins
 */

import type { TransformFunction, TransformContext, TransformPlugin } from '../core/types.js';

// Import built-in transforms
import { slugify } from './builtin/slugify.js';
import { titleCase } from './builtin/title-case.js';
import { uuid } from './builtin/uuid.js';
import { toArray, toMediaArray } from './builtin/to-array.js';
import { timestamp, autoGenerate } from './builtin/auto-generate.js';
import { registryLookup } from './builtin/registry-lookup.js';
import { template } from './builtin/template.js';
import { urlTransform } from './builtin/url-transform.js';

export class TransformRegistry {
  private transforms: Map<string, TransformFunction> = new Map();
  private plugins: Map<string, TransformPlugin> = new Map();

  constructor() {
    this.registerBuiltins();
  }

  /**
   * Register built-in transforms
   */
  private registerBuiltins(): void {
    // String transforms
    this.register('slugify', slugify);
    this.register('titleCase', titleCase);
    this.register('lowerCase', (v) => String(v).toLowerCase());
    this.register('upperCase', (v) => String(v).toUpperCase());
    this.register('trim', (v) => String(v).trim());

    // ID transforms
    this.register('uuid', uuid);

    // Array transforms
    this.register('toArray', toArray);
    this.register('toMediaArray', toMediaArray);

    // Auto-generation transforms
    this.register('timestamp', timestamp);
    this.register('autoGenerate', autoGenerate);

    // Lookup transforms
    this.register('registryLookup', registryLookup);

    // Template transforms
    this.register('template', template);

    // URL transforms
    this.register('urlTransform', urlTransform);

    // Utility transforms
    this.register('coalesce', (values) => {
      if (Array.isArray(values)) {
        return values.find((v) => v !== undefined && v !== null && v !== '');
      }
      return values;
    });

    this.register('split', (value, options: { delimiter?: string } = {}) => {
      return String(value).split(options.delimiter || ',').map((s) => s.trim());
    });

    this.register('join', (value, options: { delimiter?: string } = {}) => {
      if (Array.isArray(value)) {
        return value.join(options.delimiter || ', ');
      }
      return value;
    });

    this.register('replace', (value, options: { pattern?: string; replacement?: string } = {}) => {
      if (!options.pattern) return value;
      return String(value).replace(new RegExp(options.pattern, 'g'), options.replacement || '');
    });

    this.register('jsonParse', (value) => {
      try {
        return JSON.parse(String(value));
      } catch {
        return value;
      }
    });

    this.register('jsonStringify', (value) => {
      return JSON.stringify(value);
    });
  }

  /**
   * Register a transform function
   */
  register(name: string, fn: TransformFunction): void {
    this.transforms.set(name, fn);
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: TransformPlugin): void {
    this.plugins.set(plugin.name, plugin);

    // Register plugin transforms with namespaced names
    for (const [name, fn] of Object.entries(plugin.transforms)) {
      this.transforms.set(`${plugin.name}:${name}`, fn);
    }
  }

  /**
   * Load a plugin from a module path
   */
  async loadPlugin(modulePath: string): Promise<void> {
    try {
      const module = await import(modulePath);
      const plugin = module.default || module;

      if (this.isValidPlugin(plugin)) {
        this.registerPlugin(plugin);
      } else {
        throw new Error('Invalid plugin structure');
      }
    } catch (error) {
      throw new Error(`Failed to load plugin from ${modulePath}: ${error}`);
    }
  }

  /**
   * Check if an object is a valid plugin
   */
  private isValidPlugin(obj: unknown): obj is TransformPlugin {
    if (typeof obj !== 'object' || obj === null) return false;
    const plugin = obj as Partial<TransformPlugin>;
    return (
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.transforms === 'object'
    );
  }

  /**
   * Get a transform function by name
   */
  get(name: string): TransformFunction | undefined {
    return this.transforms.get(name);
  }

  /**
   * Apply a transform
   */
  async apply(
    name: string,
    value: unknown,
    options: Record<string, unknown>,
    context: TransformContext
  ): Promise<unknown> {
    const transform = this.get(name);

    if (!transform) {
      throw new Error(`Unknown transform: ${name}`);
    }

    return transform(value, options, context);
  }

  /**
   * Check if a transform exists
   */
  has(name: string): boolean {
    return this.transforms.has(name);
  }

  /**
   * List all registered transforms
   */
  list(): string[] {
    return Array.from(this.transforms.keys());
  }

  /**
   * List registered plugins
   */
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}
