/**
 * Core type definitions for FDS Transformer
 */

// ============================================================================
// Mapping Configuration Types
// ============================================================================

export interface MappingConfig {
  $schema?: string;
  version: string;
  targetSchema: TargetSchemaConfig;
  registries?: RegistriesConfig;
  mappings: Record<string, FieldMapping>;
  allowUnsafeEval?: boolean;
  enrichment?: EnrichmentConfig;
  validation?: ValidationConfig;
  output?: OutputConfig;
  plugins?: PluginConfig[];
}

export interface TargetSchemaConfig {
  version: string;
  url?: string;
  entity?: 'exercise' | 'equipment' | 'muscle' | 'muscle-category' | 'body-atlas';
}

export interface RegistriesConfig {
  muscles?: RegistryConfig;
  equipment?: RegistryConfig;
  muscleCategories?: RegistryConfig;
}

export interface RegistryConfig {
  source?: 'remote' | 'local' | 'inline' | string;
  url?: string;
  local?: string;
  inline?: RegistryEntry[];
  fallback?: 'remote' | 'local' | 'inline';
  cache?: boolean;
}

export type FieldMapping = string | FieldMappingObject;

export interface FieldMappingObject {
  from?: string | string[] | null;
  transform?: string | string[];
  options?: Record<string, unknown>;
  enrichment?: FieldEnrichmentConfig;
  default?: unknown;
  required?: boolean;
  condition?: string;
}

export interface FieldEnrichmentConfig {
  enabled?: boolean;
  prompt?: string;
  context?: string[];
  fields?: string[];
  when?: 'always' | 'missing' | 'empty' | 'notFound';
  validate?: boolean;
  fallback?: unknown;
}

// ============================================================================
// Enrichment Types
// ============================================================================

export interface EnrichmentConfig {
  enabled?: boolean;
  provider?: 'openrouter' | 'openai' | 'anthropic' | 'ollama';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  options?: EnrichmentOptions;
  batch?: BatchConfig;
  defaultFields?: 'all' | 'none' | string[];
  skipFields?: string[];
  // Tiered enrichment configuration
  tiers?: TieredEnrichmentTiers;
  fields?: Record<string, TieredFieldEnrichmentConfig>;
  fallback?: FallbackConfig;
  rateLimit?: RateLimitConfig;
  checkpoint?: CheckpointConfig;
}

// ============================================================================
// Tiered Enrichment Types
// ============================================================================

/** Tier name for field complexity grouping */
export type TierName = 'simple' | 'medium' | 'complex';

/** Configuration for a single enrichment tier */
export interface TierConfig {
  /** Model identifier (e.g., "anthropic/claude-haiku-4.5") */
  model: string;
  /** Temperature for generation (0-1) */
  temperature: number;
  /** Maximum tokens for response */
  maxTokens: number;
  /** Number of exercises to batch together */
  batchSize: number;
  /** Processing priority hint */
  priority: 'speed' | 'balanced' | 'accuracy';
}

/** Map of all tier configurations */
export interface TieredEnrichmentTiers {
  simple: TierConfig;
  medium: TierConfig;
  complex: TierConfig;
}

/** Configuration for a field's enrichment within the tiered system */
export interface TieredFieldEnrichmentConfig {
  /** Which tier this field belongs to */
  tier: TierName;
  /** Prompt template key to use */
  prompt: string;
  /** Valid enum values (if field is constrained) */
  enum?: string[];
  /** Whether the field is required */
  required?: boolean;
}

/** Fallback configuration for handling failures */
export interface FallbackConfig {
  /** Number of retries before degrading */
  retries: number;
  /** Whether to try a lower-tier model on failure */
  degradeModel: boolean;
  /** Whether to use default values on complete failure */
  useDefaults: boolean;
  /** Model degradation chain */
  degradeChain: {
    complex: TierName | null;
    medium: TierName | null;
    simple: null;
  };
}

/** Rate limiting configuration */
export interface RateLimitConfig {
  /** Maximum requests per minute */
  requestsPerMinute: number;
  /** Backoff strategy on rate limit hit */
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  /** Initial backoff delay in milliseconds */
  initialBackoffMs: number;
  /** Maximum backoff delay in milliseconds */
  maxBackoffMs: number;
}

/** Checkpoint configuration */
export interface CheckpointConfig {
  /** Whether checkpointing is enabled */
  enabled: boolean;
  /** Save checkpoint every N exercises */
  saveInterval: number;
}

/** Checkpoint data for resumable enrichment */
export interface CheckpointData {
  /** Checkpoint format version */
  version: string;
  /** Hash of config to detect changes */
  configHash: string;
  /** ISO timestamp when enrichment started */
  startedAt: string;
  /** ISO timestamp of last checkpoint update */
  lastUpdatedAt: string;
  /** Path to input file */
  inputFile: string;
  /** Total number of exercises to process */
  totalExercises: number;
  /** Number of completed exercises */
  completedExercises: number;
  /** IDs of successfully completed exercises */
  completedIds: string[];
  /** IDs of failed exercises */
  failedIds: string[];
  /** Current tier being processed */
  currentTier: TierName;
  /** Partial results: exerciseId -> tier -> field -> value */
  results: Record<string, Record<string, Record<string, unknown>>>;
}

/** Cost estimate for a single tier */
export interface TierCostEstimate {
  /** Tier name */
  tier: TierName;
  /** Model being used */
  model: string;
  /** Batch size for this tier */
  batchSize: number;
  /** Number of API calls needed */
  apiCalls: number;
  /** Estimated input tokens */
  inputTokens: number;
  /** Estimated output tokens */
  outputTokens: number;
  /** Estimated cost in USD */
  cost: number;
}

/** Complete cost estimate for enrichment */
export interface CostEstimate {
  /** Per-tier cost breakdown */
  tiers: {
    simple: TierCostEstimate;
    medium: TierCostEstimate;
    complex: TierCostEstimate;
  };
  /** Total across all tiers */
  total: {
    apiCalls: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  /** Time estimate */
  estimatedTime: {
    minutes: number;
    formatted: string;
  };
  /** Disclaimer about estimate accuracy */
  disclaimer: string;
}

/** Progress information for enrichment callbacks */
export interface EnrichmentProgress {
  /** Current exercise being processed */
  exercise: {
    current: number;
    total: number;
    name: string;
    slug: string;
  };
  /** Current tier status */
  tier: {
    name: TierName;
    status: 'pending' | 'processing' | 'complete' | 'failed' | 'skipped';
    batchNumber: number;
    totalBatches: number;
    duration?: number;
  };
  /** Overall progress */
  overall: {
    percentage: number;
    elapsedMs: number;
    elapsedFormatted: string;
    remainingMs: number;
    remainingFormatted: string;
    apiCalls: number;
    errors: number;
  };
}

/** Callback function for progress reporting */
export type ProgressCallback = (progress: EnrichmentProgress) => void;

export interface EnrichmentOptions {
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  retryDelay?: number;
  rateLimit?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
}

export interface BatchConfig {
  enabled?: boolean;
  concurrency?: number;
  chunkSize?: number;
}

export interface EnrichmentResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  tokensUsed?: number;
}

// ============================================================================
// AI Provider Types
// ============================================================================

export interface AIProvider {
  name: string;
  complete(prompt: string, options?: AIProviderOptions): Promise<AIResponse>;
  completeJSON<T>(prompt: string, schema?: object, options?: AIProviderOptions): Promise<T>;
}

export interface AIProviderOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationConfig {
  enabled?: boolean;
  strict?: boolean;
  failOnError?: boolean;
  outputErrors?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  constraint?: string;
}

// ============================================================================
// Output Types
// ============================================================================

export interface OutputConfig {
  format?: 'json' | 'jsonl' | 'ndjson';
  pretty?: boolean;
  directory?: string;
  naming?: string;
  singleFile?: boolean;
  singleFileName?: string;
}

// ============================================================================
// Plugin Types
// ============================================================================

export type PluginConfig = string | { name: string; options?: Record<string, unknown> };

export interface TransformPlugin {
  name: string;
  version: string;
  transforms: Record<string, TransformFunction>;
  enrichers?: Record<string, EnrichmentFunction>;
}

export type TransformFunction = (
  value: unknown,
  options: Record<string, unknown>,
  context: TransformContext
) => unknown | Promise<unknown>;

export type EnrichmentFunction = (
  context: TransformContext,
  options: Record<string, unknown>
) => Promise<Record<string, unknown>>;

// ============================================================================
// Transform Context
// ============================================================================

export interface TransformContext {
  source: Record<string, unknown>;
  target: Record<string, unknown>;
  field: string;
  registries: {
    muscles: RegistryEntry[];
    equipment: RegistryEntry[];
    muscleCategories: RegistryEntry[];
  };
  config: MappingConfig;
}

export interface TransformOptions {
  config?: MappingConfig | string;
  registries?: RegistriesConfig;
  ai?: EnrichmentConfig;
  validation?: ValidationConfig;
  output?: OutputConfig;
}

export interface TransformResult {
  success: boolean;
  data?: FDSExercise | FDSEquipment | FDSMuscle | FDSMuscleCategory;
  errors?: ValidationError[];
  warnings?: string[];
  enriched?: string[];
  __validation?: ValidationResult;
}

// ============================================================================
// Registry Entry Types
// ============================================================================

export interface RegistryEntry {
  schemaVersion: string;
  id: string;
  canonical: {
    name: string;
    slug: string;
    description?: string;
    aliases?: string[];
    abbreviation?: string;
  };
  classification?: Record<string, unknown>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    status: string;
    source?: string;
  };
}

export interface MuscleRegistryEntry extends RegistryEntry {
  classification: {
    categoryId: string;
    region: string;
    laterality?: string;
  };
}

export interface EquipmentRegistryEntry extends RegistryEntry {
  classification?: {
    tags?: string[];
  };
}

export interface MuscleCategoryRegistryEntry extends RegistryEntry {
  classification?: {
    tags?: string[];
  };
}

// ============================================================================
// FDS Schema Types
// ============================================================================

export interface FDSExercise {
  schemaVersion: string;
  exerciseId: string;
  canonical: {
    name: string;
    slug: string;
    description?: string;
    aliases?: string[];
    localized?: Array<{
      lang: string;
      name: string;
      description?: string;
      aliases?: string[];
    }>;
  };
  classification: {
    exerciseType: string;
    movement: Movement;
    mechanics: Mechanics;
    force: Force;
    level: Level;
    unilateral?: boolean;
    kineticChain?: KineticChain;
    tags?: string[];
    taxonomyRefs?: Array<{
      registry: string;
      id: string;
      label?: string;
    }>;
  };
  targets: {
    primary: MuscleRef[];
    secondary?: MuscleRef[];
  };
  equipment?: {
    required?: EquipmentRef[];
    optional?: EquipmentRef[];
  };
  constraints?: {
    contraindications?: string[];
    prerequisites?: string[];
    progressions?: string[];
    regressions?: string[];
    environment?: string[];
  };
  relations?: Array<{
    type: RelationType;
    targetId: string;
    confidence?: number;
    notes?: string;
  }>;
  metrics: {
    primary: MetricRef;
    secondary?: MetricRef[];
  };
  media?: MediaItem[];
  attributes?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  metadata: Metadata;
}

export interface FDSEquipment {
  schemaVersion: string;
  id: string;
  canonical: {
    name: string;
    slug: string;
    abbreviation?: string;
    description?: string;
    aliases?: string[];
  };
  classification?: {
    tags?: string[];
  };
  media?: MediaItem[];
  attributes?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  metadata: Metadata;
}

export interface FDSMuscle {
  schemaVersion: string;
  id: string;
  canonical: {
    name: string;
    slug: string;
    description?: string;
    aliases?: string[];
  };
  classification: {
    categoryId: string;
    region: RegionGroup;
    laterality?: Laterality;
  };
  heatmap?: {
    atlasId: string;
    areaIds: string[];
  };
  media?: MediaItem[];
  attributes?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  metadata: Metadata;
}

export interface FDSMuscleCategory {
  schemaVersion: string;
  id: string;
  canonical: {
    name: string;
    slug: string;
    description?: string;
    aliases?: string[];
  };
  classification?: {
    tags?: string[];
  };
  media?: MediaItem[];
  attributes?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  metadata: Metadata;
}

// ============================================================================
// FDS Sub-Types
// ============================================================================

export interface MuscleRef {
  id: string;
  slug?: string;
  name: string;
  categoryId: string;
  aliases?: string[];
}

export interface EquipmentRef {
  id: string;
  slug?: string;
  name: string;
  abbreviation?: string;
  categories?: string[];
  aliases?: string[];
}

export interface MuscleCategoryRef {
  id: string;
  slug?: string;
  name: string;
  aliases?: string[];
}

export interface MetricRef {
  type: MetricType;
  unit: MetricUnit;
}

export interface MediaItem {
  type: 'image' | 'video' | 'doc' | '3d';
  uri: string;
  caption?: string;
  license?: string;
  attribution?: string;
}

export interface Metadata {
  createdAt: string;
  updatedAt: string;
  source?: string;
  version?: string;
  status: Status;
  deprecated?: {
    since?: string;
    replacedBy?: string;
  };
  externalRefs?: Array<{
    system: string;
    id: string;
  }>;
  history?: Array<{
    at?: string;
    actor?: string;
    change?: string;
  }>;
}

// ============================================================================
// Enumerations
// ============================================================================

export type Movement =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'push-horizontal'
  | 'push-vertical'
  | 'pull-horizontal'
  | 'pull-vertical'
  | 'carry'
  | 'core-anti-extension'
  | 'core-anti-rotation'
  | 'rotation'
  | 'locomotion'
  | 'isolation'
  | 'other';

export type Mechanics = 'compound' | 'isolation';

export type Force = 'push' | 'pull' | 'static' | 'mixed';

export type Level = 'beginner' | 'intermediate' | 'advanced';

export type KineticChain = 'open' | 'closed' | 'mixed';

export type RelationType =
  | 'alternate'
  | 'variation'
  | 'substitute'
  | 'progression'
  | 'regression'
  | 'equipmentVariant'
  | 'accessory'
  | 'mobilityPrep'
  | 'similarPattern'
  | 'unilateralPair'
  | 'contralateralPair';

export type MetricType =
  | 'reps'
  | 'weight'
  | 'duration'
  | 'distance'
  | 'speed'
  | 'pace'
  | 'power'
  | 'heartRate'
  | 'steps'
  | 'calories'
  | 'height'
  | 'tempo'
  | 'rpe';

export type MetricUnit =
  | 'count'
  | 'kg'
  | 'lb'
  | 's'
  | 'min'
  | 'm'
  | 'km'
  | 'mi'
  | 'm_s'
  | 'km_h'
  | 'min_per_km'
  | 'min_per_mi'
  | 'W'
  | 'bpm'
  | 'kcal'
  | 'cm'
  | 'in';

export type RegionGroup =
  | 'upper-front'
  | 'upper-back'
  | 'lower-front'
  | 'lower-back'
  | 'core'
  | 'full-body'
  | 'n/a';

export type Laterality = 'left' | 'right' | 'bilateral' | 'unilateral' | 'n/a';

export type Status = 'draft' | 'review' | 'active' | 'inactive' | 'deprecated';
