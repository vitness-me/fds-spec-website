/**
 * Registry Manager - loads and manages FDS registries
 */

import type {
  RegistriesConfig,
  RegistryConfig,
  RegistryEntry,
  MuscleRegistryEntry,
  EquipmentRegistryEntry,
  MuscleCategoryRegistryEntry,
} from '../core/types.js';
import { FuzzyMatcher } from './fuzzy-matcher.js';

export class RegistryManager {
  private muscles: MuscleRegistryEntry[] = [];
  private equipment: EquipmentRegistryEntry[] = [];
  private muscleCategories: MuscleCategoryRegistryEntry[] = [];
  private fuzzyMatcher: FuzzyMatcher;

  constructor() {
    this.fuzzyMatcher = new FuzzyMatcher();
  }

  /**
   * Load all registries from config
   */
  async load(config: RegistriesConfig): Promise<void> {
    const loaders: Promise<void>[] = [];

    if (config.muscles) {
      loaders.push(this.loadRegistry('muscles', config.muscles));
    }
    if (config.equipment) {
      loaders.push(this.loadRegistry('equipment', config.equipment));
    }
    if (config.muscleCategories) {
      loaders.push(this.loadRegistry('muscleCategories', config.muscleCategories));
    }

    await Promise.all(loaders);
  }

  /**
   * Load a single registry
   */
  private async loadRegistry(
    type: 'muscles' | 'equipment' | 'muscleCategories',
    config: RegistryConfig
  ): Promise<void> {
    let data: RegistryEntry[] = [];

    try {
      if (config.inline && config.inline.length > 0) {
        data = config.inline;
      } else if (config.local) {
        data = await this.loadFromFile(config.local);
      } else if (config.source === 'remote' || config.url) {
        data = await this.loadFromUrl(
          config.url || this.getDefaultUrl(type)
        );
      }
    } catch (error) {
      // Try fallback
      if (config.fallback) {
        console.warn(`Failed to load ${type} from primary source, trying fallback`);
        if (config.fallback === 'local' && config.local) {
          data = await this.loadFromFile(config.local);
        } else if (config.fallback === 'remote') {
          data = await this.loadFromUrl(this.getDefaultUrl(type));
        }
      } else {
        throw error;
      }
    }

    switch (type) {
      case 'muscles':
        this.muscles = data as MuscleRegistryEntry[];
        break;
      case 'equipment':
        this.equipment = data as EquipmentRegistryEntry[];
        break;
      case 'muscleCategories':
        this.muscleCategories = data as MuscleCategoryRegistryEntry[];
        break;
    }
  }

  /**
   * Load registry from local file
   */
  private async loadFromFile(path: string): Promise<RegistryEntry[]> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Load registry from URL
   */
  private async loadFromUrl(url: string): Promise<RegistryEntry[]> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch registry from ${url}: ${response.statusText}`);
    }
    return response.json() as Promise<RegistryEntry[]>;
  }

  /**
   * Get default URL for a registry type
   */
  private getDefaultUrl(type: string): string {
    const baseUrl = 'https://spec.vitness.me/registries';
    switch (type) {
      case 'muscles':
        return `${baseUrl}/muscles.registry.json`;
      case 'equipment':
        return `${baseUrl}/equipment.registry.json`;
      case 'muscleCategories':
        return `${baseUrl}/muscle-categories.registry.json`;
      default:
        throw new Error(`Unknown registry type: ${type}`);
    }
  }

  // Getters
  getMuscles(): MuscleRegistryEntry[] {
    return this.muscles;
  }

  getEquipment(): EquipmentRegistryEntry[] {
    return this.equipment;
  }

  getMuscleCategories(): MuscleCategoryRegistryEntry[] {
    return this.muscleCategories;
  }

  // Lookup methods
  findMuscle(query: string, fuzzy = true): MuscleRegistryEntry | null {
    return this.findInRegistry(this.muscles, query, fuzzy) as MuscleRegistryEntry | null;
  }

  findEquipment(query: string, fuzzy = true): EquipmentRegistryEntry | null {
    return this.findInRegistry(this.equipment, query, fuzzy) as EquipmentRegistryEntry | null;
  }

  findMuscleCategory(query: string, fuzzy = true): MuscleCategoryRegistryEntry | null {
    return this.findInRegistry(this.muscleCategories, query, fuzzy) as MuscleCategoryRegistryEntry | null;
  }

  /**
   * Find an entry in a registry
   */
  private findInRegistry(
    registry: RegistryEntry[],
    query: string,
    fuzzy: boolean
  ): RegistryEntry | null {
    const normalizedQuery = query.toLowerCase().trim();

    // Exact match on name or slug
    let match = registry.find(
      (entry) =>
        entry.canonical.name.toLowerCase() === normalizedQuery ||
        entry.canonical.slug === normalizedQuery
    );

    if (match) return match;

    // Match on aliases
    match = registry.find((entry) =>
      entry.canonical.aliases?.some(
        (alias) => alias.toLowerCase() === normalizedQuery
      )
    );

    if (match) return match;

    // Fuzzy match if enabled
    if (fuzzy) {
      return this.fuzzyMatcher.findBestMatch(registry, query);
    }

    return null;
  }
}
