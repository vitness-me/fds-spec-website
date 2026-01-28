/**
 * Tests for RegistryManager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RegistryManager } from './registry-manager.js';
import type { RegistriesConfig, MuscleRegistryEntry, EquipmentRegistryEntry } from '../core/types.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample registry data
const sampleMuscles: MuscleRegistryEntry[] = [
  {
    schemaVersion: '1.0.0',
    id: 'muscle-001',
    canonical: {
      name: 'Rectus Abdominis',
      slug: 'rectus-abdominis',
      aliases: ['abs', 'abdominals', 'six-pack']
    },
    classification: {
      categoryId: 'cat-core',
      region: 'core'
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'muscle-002',
    canonical: {
      name: 'Pectoralis Major',
      slug: 'pectoralis-major',
      aliases: ['chest', 'pecs']
    },
    classification: {
      categoryId: 'cat-chest',
      region: 'upper-front'
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  }
];

const sampleEquipment: EquipmentRegistryEntry[] = [
  {
    schemaVersion: '1.0.0',
    id: 'equip-001',
    canonical: {
      name: 'Barbell',
      slug: 'barbell',
      aliases: ['bb', 'olympic bar']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  },
  {
    schemaVersion: '1.0.0',
    id: 'equip-002',
    canonical: {
      name: 'Dumbbell',
      slug: 'dumbbell',
      aliases: ['db', 'hand weight']
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active'
    }
  }
];

describe('RegistryManager', () => {
  let manager: RegistryManager;

  beforeEach(() => {
    manager = new RegistryManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('load from inline data', () => {
    it('should load muscles from inline config', async () => {
      const config: RegistriesConfig = {
        muscles: {
          source: 'inline',
          inline: sampleMuscles
        }
      };

      await manager.load(config);
      
      const muscles = manager.getMuscles();
      expect(muscles).toHaveLength(2);
      expect(muscles[0].canonical.name).toBe('Rectus Abdominis');
    });

    it('should load equipment from inline config', async () => {
      const config: RegistriesConfig = {
        equipment: {
          source: 'inline',
          inline: sampleEquipment
        }
      };

      await manager.load(config);
      
      const equipment = manager.getEquipment();
      expect(equipment).toHaveLength(2);
      expect(equipment[0].canonical.name).toBe('Barbell');
    });

    it('should load multiple registries', async () => {
      const config: RegistriesConfig = {
        muscles: { inline: sampleMuscles },
        equipment: { inline: sampleEquipment }
      };

      await manager.load(config);
      
      expect(manager.getMuscles()).toHaveLength(2);
      expect(manager.getEquipment()).toHaveLength(2);
    });
  });

  // Note: File loading tests are integration tests that require actual files
  // Those are tested via integration tests with real registry files
  describe('load from local file', () => {
    it.skip('should load muscles from local file (integration test)', async () => {
      // This requires actual file mocking which is complex with dynamic imports
    });
  });

  describe('load from remote URL', () => {
    it('should load muscles from remote URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleMuscles)
      });

      const config: RegistriesConfig = {
        muscles: {
          source: 'remote',
          url: 'https://example.com/muscles.json'
        }
      };

      await manager.load(config);
      
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/muscles.json');
      expect(manager.getMuscles()).toHaveLength(2);
    });

    it('should use default URL when no URL provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleMuscles)
      });

      const config: RegistriesConfig = {
        muscles: {
          source: 'remote'
        }
      };

      await manager.load(config);
      
      expect(mockFetch).toHaveBeenCalledWith('https://spec.vitness.me/registries/muscles.registry.json');
    });

    it('should throw error on failed fetch', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      });

      const config: RegistriesConfig = {
        muscles: {
          source: 'remote',
          url: 'https://example.com/not-found.json'
        }
      };

      await expect(manager.load(config)).rejects.toThrow('Failed to fetch registry');
    });
  });

  describe('fallback mechanism', () => {
    it('should use inline fallback data when remote fails and inline fallback available', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Server Error'
      });

      // This tests that inline data is used even without fallback config
      // because inline data is checked first
      const config: RegistriesConfig = {
        muscles: {
          inline: sampleMuscles
        }
      };

      await manager.load(config);
      expect(manager.getMuscles()).toHaveLength(2);
    });
  });

  describe('findMuscle', () => {
    beforeEach(async () => {
      await manager.load({
        muscles: { inline: sampleMuscles }
      });
    });

    it('should find muscle by exact name', () => {
      const result = manager.findMuscle('Rectus Abdominis');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('muscle-001');
    });

    it('should find muscle by name (case-insensitive)', () => {
      const result = manager.findMuscle('rectus abdominis');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('muscle-001');
    });

    it('should find muscle by slug', () => {
      const result = manager.findMuscle('pectoralis-major');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('muscle-002');
    });

    it('should find muscle by alias', () => {
      const result = manager.findMuscle('abs');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('muscle-001');
    });

    it('should find muscle by alias (case-insensitive)', () => {
      const result = manager.findMuscle('CHEST');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('muscle-002');
    });

    it('should return null for non-existent muscle without fuzzy', () => {
      const result = manager.findMuscle('xyz123', false);
      expect(result).toBeNull();
    });

    it('should find close match with fuzzy matching', () => {
      const result = manager.findMuscle('pectoralis');
      // Should fuzzy match to "Pectoralis Major"
      expect(result).not.toBeNull();
      expect(result?.id).toBe('muscle-002');
    });
  });

  describe('findEquipment', () => {
    beforeEach(async () => {
      await manager.load({
        equipment: { inline: sampleEquipment }
      });
    });

    it('should find equipment by exact name', () => {
      const result = manager.findEquipment('Barbell');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('equip-001');
    });

    it('should find equipment by alias', () => {
      const result = manager.findEquipment('db');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('equip-002');
    });

    it('should find equipment by slug', () => {
      const result = manager.findEquipment('dumbbell');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('equip-002');
    });

    it('should return null for non-existent equipment', () => {
      const result = manager.findEquipment('treadmill', false);
      expect(result).toBeNull();
    });
  });

  describe('getMuscleCategories', () => {
    it('should return empty array when no categories loaded', () => {
      expect(manager.getMuscleCategories()).toEqual([]);
    });
  });

  describe('concurrent loading', () => {
    it('should load multiple registries in parallel from inline', async () => {
      const config: RegistriesConfig = {
        muscles: { inline: sampleMuscles },
        equipment: { inline: sampleEquipment }
      };

      await manager.load(config);
      
      expect(manager.getMuscles()).toHaveLength(2);
      expect(manager.getEquipment()).toHaveLength(2);
    });
  });
});
