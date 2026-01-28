/**
 * Config Loader - loads and validates mapping configurations
 */

import type { MappingConfig, RegistriesConfig } from '../core/types.js';
import { dirname, resolve, isAbsolute } from 'path';

export class ConfigLoader {
  /**
   * Load a mapping configuration from file
   */
  static async load(configPath: string): Promise<MappingConfig> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(configPath, 'utf-8');
    
    const config = JSON.parse(content) as MappingConfig;
    
    // Resolve relative paths in registries config
    if (config.registries) {
      const configDir = dirname(configPath);
      config.registries = this.resolveRegistryPaths(config.registries, configDir);
    }
    
    // Resolve relative path in output directory
    if (config.output?.directory && !isAbsolute(config.output.directory)) {
      const configDir = dirname(configPath);
      config.output.directory = resolve(configDir, config.output.directory);
    }
    
    return config;
  }

  /**
   * Resolve relative paths in registry config
   */
  private static resolveRegistryPaths(
    registries: RegistriesConfig,
    basePath: string
  ): RegistriesConfig {
    const resolved: RegistriesConfig = {};

    if (registries.muscles?.local) {
      resolved.muscles = {
        ...registries.muscles,
        local: isAbsolute(registries.muscles.local)
          ? registries.muscles.local
          : resolve(basePath, registries.muscles.local)
      };
    } else if (registries.muscles) {
      resolved.muscles = registries.muscles;
    }

    if (registries.equipment?.local) {
      resolved.equipment = {
        ...registries.equipment,
        local: isAbsolute(registries.equipment.local)
          ? registries.equipment.local
          : resolve(basePath, registries.equipment.local)
      };
    } else if (registries.equipment) {
      resolved.equipment = registries.equipment;
    }

    if (registries.muscleCategories?.local) {
      resolved.muscleCategories = {
        ...registries.muscleCategories,
        local: isAbsolute(registries.muscleCategories.local)
          ? registries.muscleCategories.local
          : resolve(basePath, registries.muscleCategories.local)
      };
    } else if (registries.muscleCategories) {
      resolved.muscleCategories = registries.muscleCategories;
    }

    return resolved;
  }

  /**
   * Load a mapping configuration from a URL
   */
  static async loadFromUrl(url: string): Promise<MappingConfig> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load config from ${url}: ${response.statusText}`);
    }
    
    return response.json() as Promise<MappingConfig>;
  }

  /**
   * Merge multiple configurations
   */
  static merge(...configs: Partial<MappingConfig>[]): MappingConfig {
    const merged: MappingConfig = {
      version: '1.0.0',
      targetSchema: { version: '1.0.0' },
      mappings: {},
    };

    for (const config of configs) {
      if (config.version) merged.version = config.version;
      if (config.targetSchema) {
        merged.targetSchema = { ...merged.targetSchema, ...config.targetSchema };
      }
      if (config.registries) {
        merged.registries = { ...merged.registries, ...config.registries };
      }
      if (config.mappings) {
        merged.mappings = { ...merged.mappings, ...config.mappings };
      }
      if (config.allowUnsafeEval !== undefined) {
        merged.allowUnsafeEval = config.allowUnsafeEval;
      }
      if (config.enrichment) {
        merged.enrichment = { ...merged.enrichment, ...config.enrichment };
      }
      if (config.validation) {
        merged.validation = { ...merged.validation, ...config.validation };
      }
      if (config.output) {
        merged.output = { ...merged.output, ...config.output };
      }
      if (config.plugins) {
        merged.plugins = [...(merged.plugins || []), ...config.plugins];
      }
    }

    return merged;
  }

  /**
   * Apply environment variable overrides
   */
  static applyEnvOverrides(config: MappingConfig): MappingConfig {
    const result = { ...config };

    // API key from environment
    if (!result.enrichment?.apiKey && process.env.OPENROUTER_API_KEY) {
      result.enrichment = {
        ...result.enrichment,
        apiKey: process.env.OPENROUTER_API_KEY,
      };
    }

    // Model override
    if (process.env.FDS_TRANSFORMER_MODEL) {
      result.enrichment = {
        ...result.enrichment,
        model: process.env.FDS_TRANSFORMER_MODEL,
      };
    }

    return result;
  }

  /**
   * Validate a configuration
   */
  static validate(config: MappingConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!config.version) {
      errors.push('Missing required field: version');
    }

    if (!config.targetSchema?.version) {
      errors.push('Missing required field: targetSchema.version');
    }

    if (!config.mappings || Object.keys(config.mappings).length === 0) {
      errors.push('Missing required field: mappings (must have at least one mapping)');
    }

    // Validate mappings reference valid transforms
    // (This would require access to the transform registry)

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default ConfigLoader;
