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
 * - `name`: a template such as `example-catalog/exercises/{{code}}`. `{{value}}`
 *   is the mapped value; any other placeholder is a dotted path into the
 *   source record. Without a template the mapped value is the name.
 *
 * An empty name, an unfilled or unreadable placeholder, a template with no
 * placeholder, or an object for a name throws: each would give many records
 * one id.
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
      : nameText(value, 'the mapped value');

  if (name === '') {
    throw new Error('uuidv5 has no name: map a value or set options.name');
  }

  return v5(name, namespace);
};

const PLACEHOLDER = /\{\{(\w+(?:\.\w+)*)\}\}/g;

function fillTemplate(template: string, value: unknown, source: Record<string, unknown>): string {
  const outside = template.replace(PLACEHOLDER, '');
  if (outside.includes('{{') || outside.includes('}}')) {
    throw new Error(
      `uuidv5 name ${template} has a placeholder that is not {{value}} or a dotted source path`
    );
  }
  if (!template.match(PLACEHOLDER)) {
    throw new Error(`uuidv5 name ${template} has no placeholder, so every record would get the same id`);
  }

  return template.replace(PLACEHOLDER, (_match, path: string) => {
    const filled = path === 'value' ? value : getNestedValue(source, path);
    if (filled === undefined || filled === null || filled === '') {
      throw new Error(`uuidv5 name ${template} has no value for {{${path}}}`);
    }
    return nameText(filled, `{{${path}}}`);
  });
}

/** A name part as text; an object or array would read the same for every record */
function nameText(part: unknown, what: string): string {
  if (part === undefined || part === null) return '';
  if (typeof part !== 'string' && typeof part !== 'number' && typeof part !== 'bigint') {
    throw new Error(`uuidv5: ${what} is not a string or number`);
  }
  return String(part);
}

export default uuid;
