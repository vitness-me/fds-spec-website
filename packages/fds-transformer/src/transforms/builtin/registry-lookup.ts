/**
 * Registry Lookup transform - find entries in FDS registries
 */

import type {
  TransformFunction,
  TransformContext,
  MuscleRef,
  EquipmentRef,
  MuscleCategoryRef,
} from '../../core/types.js';

export interface RegistryLookupOptions {
  registry: 'muscles' | 'equipment' | 'muscleCategories';
  matchField?: 'name' | 'slug' | 'id';
  fuzzyMatch?: boolean;
  toArray?: boolean;
  returnFields?: string[];
}

function getRegistryLookupOptions(options: Record<string, unknown>): RegistryLookupOptions {
  const registry = options.registry;
  const matchField = options.matchField;
  const fuzzyMatch = options.fuzzyMatch;
  const toArray = options.toArray;
  const returnFields = options.returnFields;

  return {
    registry:
      registry === 'muscles' || registry === 'equipment' || registry === 'muscleCategories'
        ? registry
        : 'muscles',
    matchField: matchField === 'name' || matchField === 'slug' || matchField === 'id' ? matchField : undefined,
    fuzzyMatch: typeof fuzzyMatch === 'boolean' ? fuzzyMatch : undefined,
    toArray: typeof toArray === 'boolean' ? toArray : undefined,
    returnFields: Array.isArray(returnFields)
      ? returnFields.filter((field): field is string => typeof field === 'string')
      : undefined,
  };
}

/**
 * Look up a value in a registry
 */
export const registryLookup: TransformFunction = (
  value: unknown,
  options: Record<string, unknown> = {},
  context: TransformContext
): unknown => {
  const lookupOptions = getRegistryLookupOptions(options);

  if (value === null || value === undefined || value === '') {
    return lookupOptions.toArray ? [] : null;
  }

  const registryName = lookupOptions.registry;
  const registry = context.registries[registryName];

  if (!registry || registry.length === 0) {
    console.warn(`Registry "${registryName}" is empty or not loaded`);
    return lookupOptions.toArray ? [] : null;
  }

  const queries = Array.isArray(value) ? value : [value];
  const results: Array<MuscleRef | EquipmentRef | MuscleCategoryRef | Record<string, unknown>> = [];

  for (const query of queries) {
    const normalizedQuery = String(query).toLowerCase().trim();

    let match: typeof registry[0] | undefined;

    if (lookupOptions.matchField === 'id') {
      match = registry.find((entry) => String(entry.id).toLowerCase() === normalizedQuery);
    } else if (lookupOptions.matchField === 'slug') {
      match = registry.find((entry) => entry.canonical.slug.toLowerCase() === normalizedQuery);
    } else if (lookupOptions.matchField === 'name') {
      match = registry.find(
        (entry) =>
          entry.canonical.name.toLowerCase() === normalizedQuery ||
          entry.canonical.aliases?.some((alias) => alias.toLowerCase() === normalizedQuery)
      );
    } else {
      match = registry.find(
        (entry) =>
          entry.canonical.name.toLowerCase() === normalizedQuery ||
          entry.canonical.slug.toLowerCase() === normalizedQuery
      );

      if (!match) {
        match = registry.find((entry) =>
          entry.canonical.aliases?.some((alias) => alias.toLowerCase() === normalizedQuery)
        );
      }
    }

    // Try fuzzy match
    if (!match && lookupOptions.fuzzyMatch && lookupOptions.matchField !== 'id') {
      match = findFuzzyMatch(registry, normalizedQuery) as typeof registry[0] | undefined;
    }

    if (match) {
      // Format the result based on registry type
      let result: MuscleRef | EquipmentRef | MuscleCategoryRef;

      if (registryName === 'muscles') {
        const muscleEntry = match as any;
        result = {
          id: match.id,
          name: match.canonical.name,
          slug: match.canonical.slug,
          categoryId: muscleEntry.classification?.categoryId || '',
        } as MuscleRef;
      } else if (registryName === 'equipment') {
        result = {
          id: match.id,
          name: match.canonical.name,
          slug: match.canonical.slug,
        } as EquipmentRef;
      } else {
        result = {
          id: match.id,
          name: match.canonical.name,
          slug: match.canonical.slug,
        } as MuscleCategoryRef;
      }

      if (lookupOptions.returnFields?.length) {
        const filtered: Record<string, unknown> = {};
        const resultRecord: Record<string, unknown> = { ...result };
        for (const field of lookupOptions.returnFields) {
          if (field in resultRecord) {
            filtered[field] = resultRecord[field];
          }
        }
        results.push(filtered);
      } else {
        results.push(result);
      }
    }
  }

  // Return based on toArray option
  if (lookupOptions.toArray) {
    return results;
  }

  return results.length > 0 ? results[0] : null;
};

/**
 * Find a fuzzy match using simple similarity
 */
function findFuzzyMatch(
  registry: Array<{ canonical: { name: string; slug: string; aliases?: string[] } }>,
  query: string
): typeof registry[0] | null {
  let bestMatch: typeof registry[0] | null = null;
  let bestScore = 0;
  const threshold = 0.6;

  for (const entry of registry) {
    // Check name similarity
    const nameScore = calculateSimilarity(query, entry.canonical.name.toLowerCase());
    if (nameScore > bestScore && nameScore >= threshold) {
      bestScore = nameScore;
      bestMatch = entry;
    }

    // Check slug similarity
    const slugScore = calculateSimilarity(query, entry.canonical.slug);
    if (slugScore > bestScore && slugScore >= threshold) {
      bestScore = slugScore;
      bestMatch = entry;
    }

    // Check aliases
    if (entry.canonical.aliases) {
      for (const alias of entry.canonical.aliases) {
        const aliasScore = calculateSimilarity(query, alias.toLowerCase());
        if (aliasScore > bestScore && aliasScore >= threshold) {
          bestScore = aliasScore;
          bestMatch = entry;
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Calculate string similarity (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  // Simple Levenshtein-based similarity
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / Math.max(len1, len2);
}

export default registryLookup;
