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

type RegistryType = 'muscles' | 'equipment' | 'muscleCategories';

const REGISTRY_BASE_URL = 'https://spec.vitness.me/registries';

/**
 * What FDS publishes for these three entities — and why none of it is a default.
 *
 * `specification/registries/README.md` draws a line these filenames encode. A
 * `*.registry.json` is a **normative vocabulary**: the recommended values for an
 * open classifier, which FDS undertakes to keep meaning what it meant.
 * A `*.registry.example.json` is an **illustrative catalog**: it shows the shape
 * a provider serves, and "nothing in FDS requires these particular entries".
 *
 * Muscles, equipment and muscle categories exist only in the second form. This
 * class nevertheless built the first form's filename, so `source: "remote"` has
 * fetched a 404 in every published release and the remote path has never run.
 *
 * The repair is not to move the default onto the example catalog. What a
 * registry lookup yields is an id — `mus.quadriceps` — and that id is written
 * into the transformed document, and from there into the consumer's database.
 * The example ids are illustrative in exactly the way the entries are: they
 * belong to no provider, and the spec reserves the right to change them. A
 * default resolving there would turn a loud failure at load into plausible
 * output full of ids nothing can resolve, found much later and much further
 * from the cause. Silence is the more expensive failure.
 *
 * So these are the URLs the loader *names* when a caller asks for a remote
 * source it cannot supply, and nothing more. Naming the illustrative catalog is
 * a decision a caller should make in their own config, where it is visible.
 *
 * Keeping them here as constructed URLs is deliberate: `check:versions` rule 8
 * resolves them against the published tree offline, so if the spec ever renames
 * these files this file stops building — rather than the error message quietly
 * starting to hand out a dead URL.
 */
const EXAMPLE_CATALOG_URLS: Record<RegistryType, string> = {
  muscles: `${REGISTRY_BASE_URL}/muscles.registry.example.json`,
  equipment: `${REGISTRY_BASE_URL}/equipment.registry.example.json`,
  muscleCategories: `${REGISTRY_BASE_URL}/muscle-categories.registry.example.json`,
};

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
    type: RegistryType,
    config: RegistryConfig
  ): Promise<void> {
    // Resolved up front, and deliberately outside the try below. "This registry
    // has no remote source" is a statement about the configuration, not about
    // the network, and a fallback exists to survive a flaky endpoint rather than
    // to paper over a source that does not exist. Raising it here means the
    // caller is told what to change instead of quietly being served the
    // fallback's data under a config that can never do what it says.
    const remoteUrl = this.remoteUrl(type, config);

    let data: RegistryEntry[] = [];

    try {
      if (config.inline && config.inline.length > 0) {
        data = config.inline;
      } else if (config.local) {
        data = await this.loadFromFile(config.local);
      } else if (remoteUrl) {
        data = await this.loadFromUrl(remoteUrl);
      }
    } catch (error) {
      // Try fallback
      if (config.fallback) {
        console.warn(`Failed to load ${type} from primary source, trying fallback`);
        if (config.fallback === 'local' && config.local) {
          data = await this.loadFromFile(config.local);
        } else if (config.fallback === 'remote' && remoteUrl) {
          data = await this.loadFromUrl(remoteUrl);
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
    const body = await response.json();
    // A catalog is an array of entity documents. The normative vocabulary
    // registries published in the same directory are objects wrapping an
    // `entries` array — valid JSON, served with a JSON content type, and not a
    // catalog. Pointing `url` at one is the easiest mistake to make here, and
    // without this it surfaces as `registry.find is not a function` at the first
    // lookup, nowhere near the URL that caused it.
    if (!Array.isArray(body)) {
      throw new Error(
        `Registry at ${url} is not a catalog: expected an array of entity documents, ` +
          `received ${body === null ? 'null' : typeof body}.`
      );
    }
    return body as RegistryEntry[];
  }

  /**
   * The URL this registry is to be fetched from, or null if none is configured.
   *
   * An explicit `url` is always honoured — a caller naming a catalog is the
   * supported way to use the remote path, including naming the illustrative one.
   * Asking for a remote source *without* naming it is what fails, because for
   * these three entities there is nothing normative to point at; see
   * EXAMPLE_CATALOG_URLS above for the reasoning.
   */
  private remoteUrl(type: RegistryType, config: RegistryConfig): string | null {
    if (config.url) return config.url;
    if (config.source !== 'remote' && config.fallback !== 'remote') return null;

    throw new Error(
      `The ${type} registry has no default remote source.\n` +
        'FDS publishes muscles, equipment and muscle categories only as illustrative ' +
        `catalogs. ${EXAMPLE_CATALOG_URLS[type]} shows the shape a provider serves; ` +
        'nothing in FDS requires its entries, and its ids belong to no provider — so ' +
        'defaulting to it would write ids nothing can resolve into your output.\n' +
        'Name the source you mean: "url" for a catalog you or your provider publishes, ' +
        '"local" for a file, or "inline" for data. Pass the URL above as "url" if the ' +
        'illustrative catalog is genuinely what you want.'
    );
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
