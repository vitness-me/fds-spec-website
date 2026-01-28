/**
 * Auto-generate transforms - create metadata and timestamps
 */

import type { TransformFunction, TransformContext } from '../../core/types.js';

/**
 * Generate a timestamp
 */
export const timestamp: TransformFunction = (
  value: unknown,
  options: Record<string, unknown> = {}
): string => {
  const format = String(options.format || 'iso8601');
  const date = value ? new Date(String(value)) : new Date();

  switch (format) {
    case 'iso8601':
    case 'iso':
      return date.toISOString();
    case 'unix':
      return String(Math.floor(date.getTime() / 1000));
    case 'unixms':
      return String(date.getTime());
    case 'date':
      return date.toISOString().split('T')[0];
    default:
      return date.toISOString();
  }
};

/**
 * Auto-generate metadata fields
 */
export const autoGenerate: TransformFunction = (
  _value: unknown,
  options: Record<string, unknown> = {},
  context: TransformContext
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  // Handle each option
  for (const [key, val] of Object.entries(options)) {
    if (val === 'now') {
      result[key] = new Date().toISOString();
    } else if (val === 'source') {
      // Get from source
      result[key] = getNestedValue(context.source, key);
    } else if (typeof val === 'string' && val.startsWith('source.')) {
      // Get specific field from source
      result[key] = getNestedValue(context.source, val.slice(7));
    } else {
      result[key] = val;
    }
  }

  return result;
};

/**
 * Get nested value helper
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export default autoGenerate;
