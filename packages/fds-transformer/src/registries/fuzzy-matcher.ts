/**
 * Fuzzy Matcher - finds best matches using string similarity
 */

import type { RegistryEntry } from '../core/types.js';
import levenshtein from 'fast-levenshtein';

export interface FuzzyMatchOptions {
  threshold?: number;
  caseSensitive?: boolean;
}

export interface FuzzyMatchResult {
  entry: RegistryEntry;
  score: number;
  matchedField: string;
}

export class FuzzyMatcher {
  private defaultThreshold = 0.6;

  /**
   * Find the best matching entry in a registry
   */
  findBestMatch(
    registry: RegistryEntry[],
    query: string,
    options: FuzzyMatchOptions = {}
  ): RegistryEntry | null {
    const threshold = options.threshold ?? this.defaultThreshold;
    const normalizedQuery = options.caseSensitive
      ? query.trim()
      : query.toLowerCase().trim();

    let bestMatch: FuzzyMatchResult | null = null;

    for (const entry of registry) {
      // Check name
      const nameScore = this.calculateSimilarity(
        normalizedQuery,
        options.caseSensitive
          ? entry.canonical.name
          : entry.canonical.name.toLowerCase()
      );

      if (nameScore > (bestMatch?.score ?? threshold)) {
        bestMatch = { entry, score: nameScore, matchedField: 'name' };
      }

      // Check slug
      const slugScore = this.calculateSimilarity(
        normalizedQuery,
        entry.canonical.slug
      );

      if (slugScore > (bestMatch?.score ?? threshold)) {
        bestMatch = { entry, score: slugScore, matchedField: 'slug' };
      }

      // Check aliases
      if (entry.canonical.aliases) {
        for (const alias of entry.canonical.aliases) {
          const aliasScore = this.calculateSimilarity(
            normalizedQuery,
            options.caseSensitive ? alias : alias.toLowerCase()
          );

          if (aliasScore > (bestMatch?.score ?? threshold)) {
            bestMatch = { entry, score: aliasScore, matchedField: `alias:${alias}` };
          }
        }
      }
    }

    return bestMatch?.entry ?? null;
  }

  /**
   * Find all matches above threshold
   */
  findAllMatches(
    registry: RegistryEntry[],
    query: string,
    options: FuzzyMatchOptions = {}
  ): FuzzyMatchResult[] {
    const threshold = options.threshold ?? this.defaultThreshold;
    const normalizedQuery = options.caseSensitive
      ? query.trim()
      : query.toLowerCase().trim();

    const matches: FuzzyMatchResult[] = [];

    for (const entry of registry) {
      const scores: Array<{ score: number; field: string }> = [];

      // Check name
      scores.push({
        score: this.calculateSimilarity(
          normalizedQuery,
          options.caseSensitive
            ? entry.canonical.name
            : entry.canonical.name.toLowerCase()
        ),
        field: 'name',
      });

      // Check slug
      scores.push({
        score: this.calculateSimilarity(normalizedQuery, entry.canonical.slug),
        field: 'slug',
      });

      // Check aliases
      if (entry.canonical.aliases) {
        for (const alias of entry.canonical.aliases) {
          scores.push({
            score: this.calculateSimilarity(
              normalizedQuery,
              options.caseSensitive ? alias : alias.toLowerCase()
            ),
            field: `alias:${alias}`,
          });
        }
      }

      // Find best score for this entry
      const best = scores.reduce((a, b) => (a.score > b.score ? a : b));

      if (best.score >= threshold) {
        matches.push({
          entry,
          score: best.score,
          matchedField: best.field,
        });
      }
    }

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const distance = levenshtein.get(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    return 1 - distance / maxLength;
  }

  /**
   * Normalize a string for comparison
   */
  normalize(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[\s-_]+/g, ' ') // Normalize whitespace
      .replace(/[^a-z0-9 ]/g, ''); // Remove special chars
  }
}
