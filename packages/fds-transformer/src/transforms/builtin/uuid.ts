/**
 * UUID transforms - generate UUIDs
 */

import { v4 as uuidv4, v5, validate } from 'uuid';
import type { TransformFunction } from '../../core/types.js';
import { getNestedValue } from './template.js';

/**
 * Generate a new UUIDv4
 *
 * FDS requires plain UUIDs for all identifiers.
 */
export const uuid: TransformFunction = (): string => {
  return uuidv4();
};

/**
 * Derive a UUIDv5 from a namespace and a name, so the same input always gets
 * the same id.
 *
 * Options:
 * - `namespace` (required): the namespace UUID.
 * - `name`: a template such as `exercises_v6/Exercises/{{v6Id}}`. `{{value}}`
 *   is the mapped value; any other placeholder is a dotted path into the
 *   source record. Without a template the mapped value is the name.
 *
 * An empty name or an unfilled placeholder throws: it would give every such
 * record the same id.
 */
export const uuidv5: TransformFunction = (value, options = {}, context): string => {
  const namespace = options.namespace;
  if (typeof namespace !== 'string' || !validate(namespace)) {
    throw new Error(
      `uuidv5 needs options.namespace to be a UUID, got ${JSON.stringify(namespace)}`
    );
  }

  const name =
    typeof options.name === 'string'
      ? fillTemplate(options.name, value, context.source)
      : String(value ?? '');

  if (name === '') {
    throw new Error('uuidv5 has no name: map a value or set options.name');
  }

  return v5(name, namespace);
};

function fillTemplate(template: string, value: unknown, source: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const filled = path === 'value' ? value : getNestedValue(source, path);
    if (filled === undefined || filled === null || filled === '') {
      throw new Error(`uuidv5 name ${template} has no value for {{${path}}}`);
    }
    return String(filled);
  });
}

export default uuid;
