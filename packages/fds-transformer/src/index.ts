/**
 * @vitness/fds-transformer
 *
 * Transform any source schema to FDS (Fitness Data Standard) format
 * with optional AI enrichment capabilities.
 *
 * @packageDocumentation
 */

// Core exports
export { Transformer } from './core/transformer.js';
export { MappingEngine } from './core/mapping-engine.js';
export { BatchProcessor } from './core/batch-processor.js';

// Registry exports
export { RegistryManager } from './registries/registry-manager.js';
export { FuzzyMatcher } from './registries/fuzzy-matcher.js';

// Schema exports
export { SchemaManager } from './schemas/schema-manager.js';
export { Validator } from './schemas/validator.js';

// AI exports
export { EnrichmentEngine } from './ai/enrichment-engine.js';
export { OpenRouterProvider } from './ai/providers/openrouter.js';

// Transform exports
export { TransformRegistry } from './transforms/transform-registry.js';
export * from './transforms/builtin/index.js';

// Config exports
export { ConfigLoader } from './config/config-loader.js';

// Type exports
export type {
  // Core types
  MappingConfig,
  FieldMapping,
  TransformOptions,
  TransformResult,
  TransformContext,

  // Registry types
  RegistryConfig,
  RegistryEntry,
  MuscleRegistryEntry,
  EquipmentRegistryEntry,
  MuscleCategoryRegistryEntry,

  // AI types
  EnrichmentConfig,
  EnrichmentResult,
  AIProvider,
  AIProviderOptions,

  // Schema types
  FDSExercise,
  FDSEquipment,
  FDSMuscle,
  FDSMuscleCategory,
  ValidationResult,
  ValidationError,

  // Plugin types
  TransformPlugin,
  TransformFunction,
} from './core/types.js';
