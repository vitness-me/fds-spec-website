/**
 * Title Case transform - converts strings to Title Case
 */

import type { TransformFunction } from '../../core/types.js';

// Words that should remain lowercase (unless first word)
const LOWERCASE_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor',
  'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'with',
]);

// Words/acronyms that should remain uppercase
const UPPERCASE_WORDS = new Set([
  'db', 'bb', 'kb', 'ez', 'trx', 'hiit', 'amrap', 'emom', 'bw',
]);

export const titleCase: TransformFunction = (
  value: unknown,
  options: Record<string, unknown> = {}
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);
  const preserveAcronyms = options.preserveAcronyms !== false;

  const words = str.split(/(\s+|-)/); // Split but keep delimiters
  
  return words.map((word, index) => {
    // Skip delimiters
    if (/^\s+$/.test(word) || word === '-') {
      return word;
    }

    const lowerWord = word.toLowerCase();

    // Check if it's an acronym that should stay uppercase
    if (preserveAcronyms && UPPERCASE_WORDS.has(lowerWord)) {
      return word.toUpperCase();
    }

    // Check if it's a word that should stay lowercase (unless first)
    if (index > 0 && LOWERCASE_WORDS.has(lowerWord)) {
      return lowerWord;
    }

    // Capitalize first letter, keep rest as-is for words like "iPhone"
    // But lowercase if all caps
    if (word === word.toUpperCase() && word.length > 1) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join('');
};

export default titleCase;
