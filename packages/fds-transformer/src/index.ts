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
export {
  PROVENANCE_SCHEMA_URL,
  PROVENANCE_SIDECAR_FILENAME,
  buildProvenanceSidecar,
  serializeProvenanceSidecar,
} from './core/provenance.js';
export type { ProvenanceSidecar } from './core/provenance.js';

// Registry exports
export { RegistryManager } from './registries/registry-manager.js';
export { FuzzyMatcher } from './registries/fuzzy-matcher.js';

// Schema exports
export { SchemaManager, SchemaFetchError } from './schemas/schema-manager.js';
export type {
  SchemaLoadResult,
  SchemaFetchFailure,
  SchemaFetchFailureReason,
} from './schemas/schema-manager.js';
export { Validator } from './schemas/validator.js';

// AI exports
export { EnrichmentEngine } from './ai/enrichment-engine.js';
export { OpenRouterProvider } from './ai/providers/openrouter.js';
export {
  ClaudeCodeProvider,
  ClaudeCodeError,
  DEFAULT_WRITER_MODEL,
  DEFAULT_CHECKER_MODEL,
} from './ai/providers/claude-code.js';

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
  ClaudeCodeConfig,
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

  // Provenance types
  FieldProvenance,
  RecordProvenance,
  SourceProvenance,
  DefaultProvenance,
  TransformProvenance,
  ModelProvenance,

  // Plugin types
  TransformPlugin,
  TransformFunction,
} from './core/types.js';
