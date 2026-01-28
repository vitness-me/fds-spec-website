/**
 * Slugify transform - converts strings to URL-safe slugs
 */

import type { TransformFunction } from '../../core/types.js';

// Special word replacements
const WORD_REPLACEMENTS: Record<string, string> = {
  '3/4': 'three-quarter',
  '1/4': 'quarter',
  '1/2': 'half',
  '&': 'and',
  '+': 'plus',
  '@': 'at',
};

export const slugify: TransformFunction = (
  value: unknown,
  _options: Record<string, unknown> = {}
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Apply word replacements
  for (const [pattern, replacement] of Object.entries(WORD_REPLACEMENTS)) {
    str = str.replace(new RegExp(escapeRegex(pattern), 'gi'), replacement);
  }

  // Convert to lowercase
  str = str.toLowerCase();

  // Replace spaces and underscores with hyphens
  str = str.replace(/[\s_]+/g, '-');

  // Remove special characters (keep alphanumeric and hyphens)
  str = str.replace(/[^a-z0-9-]/g, '');

  // Collapse multiple hyphens
  str = str.replace(/-+/g, '-');

  // Trim hyphens from start and end
  str = str.replace(/^-+|-+$/g, '');

  // Ensure minimum length
  if (str.length < 2) {
    str = str.padEnd(2, '0');
  }

  return str;
};

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default slugify;
