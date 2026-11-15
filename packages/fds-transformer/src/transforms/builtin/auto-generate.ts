/**
 * Auto-generate transforms - create metadata and timestamps
 */

import type { TransformFunction, TransformContext } from '../../core/types.js';

/**
 * Format an instant taken from the source, or from a configured clock.
 *
 * A run must be repeatable, so an empty source value never falls back to the
 * wall clock on its own. `options.clock` is an ISO 8601 instant stamped on
 * every record that has no source value, or `"now"` to opt into the wall
 * clock. Without either, the transform throws.
 */
export const timestamp: TransformFunction = (
  value: unknown,
  options: Record<string, unknown> = {}
): string => {
  const format = String(options.format || 'iso8601');
  const date = instantOf(value, options.clock);

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

function instantOf(value: unknown, clock: unknown): Date {
  if (value !== undefined && value !== null && value !== '') {
    return parseInstant(value, `${JSON.stringify(value)} is not a date`);
  }

  if (clock === undefined) {
    throw new Error(
      'timestamp: the source has no value and no clock is configured. ' +
        'Map the field from the source, or set options.clock to an ISO 8601 instant ' +
        '("now" stamps the wall clock).'
    );
  }

  if (clock === 'now') return new Date();
  return parseInstant(clock, `options.clock ${JSON.stringify(clock)} is not an instant or "now"`);
}

function parseInstant(raw: unknown, problem: string): Date {
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`timestamp: ${problem}`);
  }
  return date;
}

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
