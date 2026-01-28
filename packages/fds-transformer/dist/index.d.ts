/**
 * Core type definitions for FDS Transformer
 */
interface MappingConfig {
    $schema?: string;
    version: string;
    targetSchema: TargetSchemaConfig;
    registries?: RegistriesConfig;
    mappings: Record<string, FieldMapping>;
    enrichment?: EnrichmentConfig;
    validation?: ValidationConfig;
    output?: OutputConfig;
    plugins?: PluginConfig[];
}
interface TargetSchemaConfig {
    version: string;
    url?: string;
    entity?: 'exercise' | 'equipment' | 'muscle' | 'muscle-category' | 'body-atlas';
}
interface RegistriesConfig {
    muscles?: RegistryConfig;
    equipment?: RegistryConfig;
    muscleCategories?: RegistryConfig;
}
interface RegistryConfig {
    source?: 'remote' | 'local' | 'inline' | string;
    url?: string;
    local?: string;
    inline?: RegistryEntry[];
    fallback?: 'remote' | 'local' | 'inline';
    cache?: boolean;
}
type FieldMapping = string | FieldMappingObject;
interface FieldMappingObject {
    from?: string | string[] | null;
    transform?: string | string[];
    options?: Record<string, unknown>;
    enrichment?: FieldEnrichmentConfig;
    default?: unknown;
    required?: boolean;
    condition?: string;
}
interface FieldEnrichmentConfig {
    enabled?: boolean;
    prompt?: string;
    context?: string[];
    fields?: string[];
    when?: 'always' | 'missing' | 'empty' | 'notFound';
    validate?: boolean;
    fallback?: unknown;
}
interface EnrichmentConfig {
    enabled?: boolean;
    provider?: 'openrouter' | 'openai' | 'anthropic' | 'ollama';
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    options?: EnrichmentOptions;
    batch?: BatchConfig;
    defaultFields?: 'all' | 'none' | string[];
    skipFields?: string[];
    tiers?: TieredEnrichmentTiers;
    fields?: Record<string, TieredFieldEnrichmentConfig>;
    fallback?: FallbackConfig;
    rateLimit?: RateLimitConfig;
    checkpoint?: CheckpointConfig;
}
/** Tier name for field complexity grouping */
type TierName = 'simple' | 'medium' | 'complex';
/** Configuration for a single enrichment tier */
interface TierConfig {
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
interface TieredEnrichmentTiers {
    simple: TierConfig;
    medium: TierConfig;
    complex: TierConfig;
}
/** Configuration for a field's enrichment within the tiered system */
interface TieredFieldEnrichmentConfig {
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
interface FallbackConfig {
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
interface RateLimitConfig {
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
interface CheckpointConfig {
    /** Whether checkpointing is enabled */
    enabled: boolean;
    /** Save checkpoint every N exercises */
    saveInterval: number;
}
/** Cost estimate for a single tier */
interface TierCostEstimate {
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
interface CostEstimate {
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
interface EnrichmentProgress {
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
type ProgressCallback = (progress: EnrichmentProgress) => void;
interface EnrichmentOptions {
    temperature?: number;
    maxTokens?: number;
    maxRetries?: number;
    retryDelay?: number;
    rateLimit?: {
        requestsPerMinute?: number;
        tokensPerMinute?: number;
    };
}
interface BatchConfig {
    enabled?: boolean;
    concurrency?: number;
    chunkSize?: number;
}
interface EnrichmentResult {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
    tokensUsed?: number;
}
interface AIProvider {
    name: string;
    complete(prompt: string, options?: AIProviderOptions): Promise<AIResponse>;
    completeJSON<T>(prompt: string, schema?: object, options?: AIProviderOptions): Promise<T>;
}
interface AIProviderOptions {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}
interface AIResponse {
    content: string;
    tokensUsed: number;
    model: string;
}
interface ValidationConfig {
    enabled?: boolean;
    strict?: boolean;
    failOnError?: boolean;
    outputErrors?: string;
}
interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings?: ValidationError[];
}
interface ValidationError {
    field: string;
    message: string;
    value?: unknown;
    constraint?: string;
}
interface OutputConfig {
    format?: 'json' | 'jsonl' | 'ndjson';
    pretty?: boolean;
    directory?: string;
    naming?: string;
    singleFile?: boolean;
    singleFileName?: string;
}
type PluginConfig = string | {
    name: string;
    options?: Record<string, unknown>;
};
interface TransformPlugin {
    name: string;
    version: string;
    transforms: Record<string, TransformFunction>;
    enrichers?: Record<string, EnrichmentFunction>;
}
type TransformFunction = (value: unknown, options: Record<string, unknown>, context: TransformContext) => unknown | Promise<unknown>;
type EnrichmentFunction = (context: TransformContext, options: Record<string, unknown>) => Promise<Record<string, unknown>>;
interface TransformContext {
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
interface TransformOptions {
    config?: MappingConfig | string;
    registries?: RegistriesConfig;
    ai?: EnrichmentConfig;
    validation?: ValidationConfig;
    output?: OutputConfig;
}
interface TransformResult {
    success: boolean;
    data?: FDSExercise | FDSEquipment | FDSMuscle | FDSMuscleCategory;
    errors?: ValidationError[];
    warnings?: string[];
    enriched?: string[];
    __validation?: ValidationResult;
}
interface RegistryEntry {
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
interface MuscleRegistryEntry extends RegistryEntry {
    classification: {
        categoryId: string;
        region: string;
        laterality?: string;
    };
}
interface EquipmentRegistryEntry extends RegistryEntry {
    classification?: {
        tags?: string[];
    };
}
interface MuscleCategoryRegistryEntry extends RegistryEntry {
    classification?: {
        tags?: string[];
    };
}
interface FDSExercise {
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
interface FDSEquipment {
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
interface FDSMuscle {
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
interface FDSMuscleCategory {
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
interface MuscleRef {
    id: string;
    slug?: string;
    name: string;
    categoryId: string;
    aliases?: string[];
}
interface EquipmentRef {
    id: string;
    slug?: string;
    name: string;
    abbreviation?: string;
    categories?: string[];
    aliases?: string[];
}
interface MetricRef {
    type: MetricType;
    unit: MetricUnit;
}
interface MediaItem {
    type: 'image' | 'video' | 'doc' | '3d';
    uri: string;
    caption?: string;
    license?: string;
    attribution?: string;
}
interface Metadata {
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
type Movement = 'squat' | 'hinge' | 'lunge' | 'push-horizontal' | 'push-vertical' | 'pull-horizontal' | 'pull-vertical' | 'carry' | 'core-anti-extension' | 'core-anti-rotation' | 'rotation' | 'locomotion' | 'isolation' | 'other';
type Mechanics = 'compound' | 'isolation';
type Force = 'push' | 'pull' | 'static' | 'mixed';
type Level = 'beginner' | 'intermediate' | 'advanced';
type KineticChain = 'open' | 'closed' | 'mixed';
type RelationType = 'alternate' | 'variation' | 'substitute' | 'progression' | 'regression' | 'equipmentVariant' | 'accessory' | 'mobilityPrep' | 'similarPattern' | 'unilateralPair' | 'contralateralPair';
type MetricType = 'reps' | 'weight' | 'duration' | 'distance' | 'speed' | 'pace' | 'power' | 'heartRate' | 'steps' | 'calories' | 'height' | 'tempo' | 'rpe';
type MetricUnit = 'count' | 'kg' | 'lb' | 's' | 'min' | 'm' | 'km' | 'mi' | 'm_s' | 'km_h' | 'min_per_km' | 'min_per_mi' | 'W' | 'bpm' | 'kcal' | 'cm' | 'in';
type RegionGroup = 'upper-front' | 'upper-back' | 'lower-front' | 'lower-back' | 'core' | 'full-body' | 'n/a';
type Laterality = 'left' | 'right' | 'bilateral' | 'unilateral' | 'n/a';
type Status = 'draft' | 'review' | 'active' | 'inactive' | 'deprecated';

/**
 * Schema Manager - handles FDS schema loading and versioning
 *
 * Uses a hybrid approach:
 * 1. Try fetching from spec.vitness.me (gets latest schemas)
 * 2. Fall back to bundled schemas if remote fails (offline support)
 *
 * This ensures the transformer works both online (with latest schemas)
 * and offline (with bundled fallback).
 */

interface SchemaVersion {
    version: string;
    url: string;
    bundled: boolean;
}
interface SchemaLoadResult {
    source: 'remote' | 'bundled';
    entities: string[];
    errors: string[];
}
declare class SchemaManager {
    private schemas;
    private validator;
    private cacheDir;
    private lastLoadResult;
    constructor();
    /**
     * Load a specific schema version using hybrid approach:
     * 1. Try remote first (gets latest)
     * 2. Validate that schemas compile correctly (catch broken $ref paths)
     * 3. Fall back to bundled if remote fails or has compilation errors
     */
    loadVersion(version: string): Promise<void>;
    /**
     * Get information about how schemas were loaded
     */
    getLoadResult(): SchemaLoadResult | null;
    /**
     * Load bundled schemas (fallback for offline/network errors)
     */
    private loadBundled;
    /**
     * Fetch schema from remote URL
     */
    private fetchSchema;
    /**
     * Cache schema locally
     */
    private cacheSchema;
    /**
     * List available schema versions
     */
    listVersions(): Promise<SchemaVersion[]>;
    /**
     * Get a specific schema
     */
    getSchema(entity: string, version?: string): object | null;
    /**
     * Validate data against a schema
     */
    validate(data: unknown, entity: string, version?: string): Promise<ValidationResult>;
    /**
     * Set the cache directory
     */
    setCacheDir(dir: string): void;
    /**
     * Update cached schemas
     */
    updateCache(): Promise<void>;
    /**
     * Force load bundled schemas only (skip remote fetch)
     * Useful for offline mode or when remote schemas are known to be broken
     */
    loadBundledOnly(version: string): Promise<void>;
    /**
     * Clear loaded schemas (useful for testing or reloading)
     */
    clearSchemas(): void;
}

/**
 * Rate Limiter - Intelligent rate limiting with automatic backoff
 *
 * Handles API rate limits by:
 * - Tracking requests per minute
 * - Waiting when approaching limits
 * - Implementing exponential/linear/fixed backoff on 429 responses
 * - Resetting backoff on successful requests
 */

/**
 * Rate limiter state for external monitoring
 */
interface RateLimiterState {
    /** Requests made in current window */
    requestsInWindow: number;
    /** Maximum requests per minute */
    requestsPerMinute: number;
    /** Current backoff delay in ms (0 if not in backoff) */
    currentBackoffMs: number;
    /** Number of consecutive rate limit hits */
    consecutiveHits: number;
    /** Whether currently in backoff state */
    isBackingOff: boolean;
    /** Timestamp of last request */
    lastRequestTime: number | null;
    /** Time until next request can be made (0 if ready) */
    waitTimeMs: number;
}
/**
 * Rate limiter for API calls with automatic backoff
 */
declare class RateLimiter {
    private config;
    private requestTimestamps;
    private consecutiveHits;
    private currentBackoffMs;
    private backoffUntil;
    private lastRequestTime;
    constructor(config?: Partial<RateLimitConfig>);
    /**
     * Acquire permission to make a request
     * Waits if necessary to stay within rate limits
     * @returns Promise that resolves when it's safe to make a request
     */
    acquire(): Promise<void>;
    /**
     * Record a rate limit hit (429 response)
     * Increases backoff according to strategy
     */
    recordRateLimitHit(): void;
    /**
     * Record a successful request
     * Resets backoff counter
     */
    recordSuccess(): void;
    /**
     * Get current rate limiter state for logging/monitoring
     */
    getState(): RateLimiterState;
    /**
     * Get the configured requests per minute
     */
    getRequestsPerMinute(): number;
    /**
     * Check if currently in backoff state
     */
    isInBackoff(): boolean;
    /**
     * Get time remaining in backoff (0 if not in backoff)
     */
    getBackoffRemaining(): number;
    /**
     * Reset the rate limiter state
     */
    reset(): void;
    /**
     * Calculate backoff based on strategy
     */
    private calculateBackoff;
    /**
     * Remove timestamps older than 1 minute
     */
    private cleanOldTimestamps;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
}

/**
 * Enrichment Engine - Tiered AI-powered field enrichment
 *
 * Supports three processing modes:
 * 1. Tiered enrichment (new) - Groups fields by complexity tier (simple/medium/complex)
 *    and uses appropriate models (Haiku/Sonnet/Opus) for cost-effective processing
 * 2. Comprehensive enrichment - Single API call for all fields (legacy)
 * 3. Per-field enrichment - Individual API calls per field (legacy fallback)
 *
 * Features:
 * - Configurable tier-to-model mapping
 * - Batch processing per tier with configurable batch sizes
 * - Checkpoint support for resumable enrichment
 * - Rate limiting with automatic backoff
 * - Fallback chain on errors (complex -> medium -> simple)
 * - Cost estimation before running
 * - Progress reporting via callback
 */

/**
 * Exercise input for batch enrichment
 */
interface ExerciseInput {
    /** Unique identifier (exerciseId or slug) */
    id: string;
    /** Exercise slug */
    slug: string;
    /** Exercise name */
    name: string;
    /** Optional existing description */
    description?: string;
    /** Primary target muscles */
    primaryTargets?: Array<{
        id: string;
        name: string;
    }>;
    /** Required equipment */
    requiredEquipment?: Array<{
        id: string;
        name: string;
    }>;
    /** Any additional context */
    [key: string]: unknown;
}
/**
 * Result of batch enrichment
 */
interface BatchEnrichmentResult {
    /** Successfully enriched exercises */
    results: Map<string, Record<string, unknown>>;
    /** IDs of exercises that failed */
    failedIds: string[];
    /** Total API calls made */
    apiCalls: number;
    /** Total tokens used */
    tokensUsed: number;
    /** Total duration in ms */
    durationMs: number;
    /** Errors encountered */
    errors: Array<{
        exerciseId: string;
        error: string;
        tier?: TierName;
    }>;
}
/**
 * Options for batch enrichment
 */
interface BatchEnrichmentOptions {
    /** Resume from checkpoint if available */
    resume?: boolean;
    /** Run only specific tier */
    tierFilter?: TierName;
    /** Progress callback */
    onProgress?: ProgressCallback;
    /** Output directory for checkpoints */
    outputDirectory?: string;
    /** Schema $defs for validation context */
    schemaDefs?: Record<string, unknown>;
}
declare class EnrichmentEngine {
    private provider;
    private config;
    private rateLimiter;
    constructor(config?: EnrichmentConfig);
    /**
     * Initialize the AI provider
     */
    private initializeProvider;
    /**
     * Enrich multiple exercises using tiered processing
     *
     * This is the main entry point for batch enrichment. It:
     * 1. Groups fields by tier based on configuration
     * 2. Processes each tier in order (simple -> medium -> complex)
     * 3. Batches exercises per tier's batchSize
     * 4. Handles errors with fallback chain
     * 5. Saves progress to checkpoint for resumability
     *
     * @param exercises - Array of exercises to enrich
     * @param options - Enrichment options
     * @returns Batch enrichment result
     */
    enrichBatch(exercises: ExerciseInput[], options?: BatchEnrichmentOptions): Promise<BatchEnrichmentResult>;
    /**
     * Estimate cost for batch enrichment
     */
    estimateCost(exerciseCount: number): CostEstimate;
    /**
     * Group configured fields by their tier
     */
    groupFieldsByTier(): Map<TierName, Map<string, TieredFieldEnrichmentConfig>>;
    /**
     * Get tier configuration, merging with defaults
     */
    getTierConfig(tier: TierName): TierConfig;
    /**
     * Get fallback configuration
     */
    getFallbackConfig(): FallbackConfig;
    /**
     * Create batches of exercises for processing
     */
    private createBatches;
    /**
     * Process a batch of exercises for a specific tier
     */
    private processTierBatch;
    /**
     * Call API with fallback on errors
     */
    private callWithFallback;
    /**
     * Parse API response and map to exercises
     */
    private parseResponse;
    /**
     * Map parsed fields to proper FDS paths based on prompt type
     */
    private mapFieldsFromPrompt;
    /**
     * Enrich mapped data with AI-generated content
     * Uses comprehensive single-call enrichment for efficiency
     * @deprecated Use enrichBatch for new code
     */
    enrich(mapped: Record<string, unknown>, mappings: Record<string, FieldMapping>, context: TransformContext): Promise<EnrichmentResult>;
    /**
     * Comprehensive enrichment - single API call for all fields
     */
    private enrichComprehensive;
    /**
     * Per-field enrichment fallback
     */
    private enrichPerField;
    /**
     * Check if a field should be enriched
     */
    private shouldEnrich;
    /**
     * Enrich a single field
     */
    private enrichField;
    /**
     * Build the prompt for AI enrichment
     */
    private buildPrompt;
    /**
     * Get the system prompt for enrichment
     */
    getSystemPrompt(): string;
    /**
     * Check if engine is enabled
     */
    isEnabled(): boolean;
    /**
     * Check if tiered enrichment is configured
     */
    isTieredEnabled(): boolean;
    /**
     * Get the provider (for testing)
     */
    getProvider(): AIProvider | null;
    /**
     * Get the rate limiter (for testing)
     */
    getRateLimiter(): RateLimiter | null;
    /**
     * Normalize mapping to object form
     */
    private normalizeMapping;
    /**
     * Get nested value from object
     */
    private getNestedValue;
    /**
     * Set nested value in object
     */
    private setNestedValue;
}

/**
 * Main Transformer class for FDS schema transformation
 *
 * Supports two modes of operation:
 * 1. Single-item transformation via transform() - Uses legacy enrichment
 * 2. Batch transformation via transformAllBatch() - Uses tiered enrichment
 */

interface TransformerOptions extends TransformOptions {
    config?: MappingConfig | string;
}
/**
 * Options for batch transformation with tiered enrichment
 */
interface BatchTransformOptions {
    /** Resume from checkpoint if available */
    resume?: boolean;
    /** Run only specific tier (simple|medium|complex) */
    tierFilter?: 'simple' | 'medium' | 'complex';
    /** Progress callback for tracking */
    onProgress?: ProgressCallback;
    /** Output directory for checkpoints and results */
    outputDirectory?: string;
    /** Skip AI enrichment entirely */
    skipEnrichment?: boolean;
}
/**
 * Result of batch transformation
 */
interface BatchTransformResult {
    /** Successfully transformed exercises */
    results: TransformResult[];
    /** Statistics about the transformation */
    stats: {
        total: number;
        success: number;
        failed: number;
        enriched: number;
        apiCalls: number;
        tokensUsed: number;
        durationMs: number;
    };
    /** Errors encountered during transformation */
    errors: Array<{
        index: number;
        exerciseId?: string;
        error: string;
    }>;
}
declare class Transformer {
    private config;
    private mappingEngine;
    private registryManager;
    private schemaManager;
    private enrichmentEngine;
    private initialized;
    constructor(options?: TransformerOptions);
    /**
     * Get the enrichment engine (for testing or direct access)
     */
    getEnrichmentEngine(): EnrichmentEngine | null;
    /**
     * Get the schema manager (for accessing schema $defs)
     */
    getSchemaManager(): SchemaManager;
    /**
     * Check if tiered enrichment is available
     */
    isTieredEnrichmentEnabled(): boolean;
    /**
     * Get cost estimate for batch enrichment
     */
    estimateCost(exerciseCount: number): CostEstimate | null;
    /**
     * Initialize the transformer (load config, registries, schemas)
     */
    init(): Promise<void>;
    /**
     * Transform a single source item to FDS format
     */
    transform(source: Record<string, unknown>): Promise<TransformResult>;
    /**
     * Transform multiple items with streaming support
     */
    transformStream(source: AsyncIterable<Record<string, unknown>> | Iterable<Record<string, unknown>>): AsyncGenerator<TransformResult>;
    /**
     * Transform all items from an array
     */
    transformAll(sources: Record<string, unknown>[]): Promise<TransformResult[]>;
    /**
     * Transform all items using batch enrichment with tiered processing
     *
     * This method is more efficient than transformAll() for large datasets as it:
     * 1. Maps all exercises first (without enrichment)
     * 2. Batches exercises by tier for enrichment (using appropriate models)
     * 3. Supports checkpoint/resume for long-running operations
     * 4. Reports progress via callback
     *
     * @param sources - Array of source items to transform
     * @param options - Batch transformation options
     * @returns Batch transformation result with stats
     */
    transformAllBatch(sources: Record<string, unknown>[], options?: BatchTransformOptions): Promise<BatchTransformResult>;
    /**
     * Deep merge source object into target
     */
    private deepMerge;
}

/**
 * Mapping Engine - applies field mappings from source to target
 */

declare class MappingEngine {
    private transformRegistry;
    constructor();
    /**
     * Apply all mappings to transform source to target
     */
    apply(source: Record<string, unknown>, mappings: Record<string, FieldMapping>, context: TransformContext): Promise<Record<string, unknown>>;
    /**
     * Normalize string shorthand to full mapping object
     */
    private normalizeMapping;
    /**
     * Apply a single field mapping
     */
    private applyMapping;
    /**
     * Get a nested value from an object using dot notation
     */
    private getNestedValue;
    /**
     * Set a nested value in an object using dot notation
     */
    private setNestedValue;
    /**
     * Evaluate a condition expression
     */
    private evaluateCondition;
}

/**
 * Batch Processor - handles streaming and parallel processing
 */

interface BatchOptions {
    concurrency?: number;
    chunkSize?: number;
    onProgress?: (progress: BatchProgress) => void;
    onError?: (error: Error, item: Record<string, unknown>, index: number) => void;
}
interface BatchProgress {
    processed: number;
    total: number;
    successful: number;
    failed: number;
    percentage: number;
}
interface BatchResult {
    results: TransformResult[];
    summary: {
        total: number;
        successful: number;
        failed: number;
        duration: number;
    };
}
declare class BatchProcessor {
    private transformer;
    private options;
    constructor(transformer: Transformer, options?: BatchOptions);
    /**
     * Process items in parallel batches
     */
    process(items: Record<string, unknown>[]): Promise<BatchResult>;
    /**
     * Process a chunk of items with concurrency control
     */
    private processChunk;
    /**
     * Process items as an async stream
     */
    processStream(items: AsyncIterable<Record<string, unknown>> | Iterable<Record<string, unknown>>): AsyncGenerator<TransformResult>;
}

/**
 * Registry Manager - loads and manages FDS registries
 */

declare class RegistryManager {
    private muscles;
    private equipment;
    private muscleCategories;
    private fuzzyMatcher;
    constructor();
    /**
     * Load all registries from config
     */
    load(config: RegistriesConfig): Promise<void>;
    /**
     * Load a single registry
     */
    private loadRegistry;
    /**
     * Load registry from local file
     */
    private loadFromFile;
    /**
     * Load registry from URL
     */
    private loadFromUrl;
    /**
     * Get default URL for a registry type
     */
    private getDefaultUrl;
    getMuscles(): MuscleRegistryEntry[];
    getEquipment(): EquipmentRegistryEntry[];
    getMuscleCategories(): MuscleCategoryRegistryEntry[];
    findMuscle(query: string, fuzzy?: boolean): MuscleRegistryEntry | null;
    findEquipment(query: string, fuzzy?: boolean): EquipmentRegistryEntry | null;
    findMuscleCategory(query: string, fuzzy?: boolean): MuscleCategoryRegistryEntry | null;
    /**
     * Find an entry in a registry
     */
    private findInRegistry;
}

/**
 * Fuzzy Matcher - finds best matches using string similarity
 */

interface FuzzyMatchOptions {
    threshold?: number;
    caseSensitive?: boolean;
}
interface FuzzyMatchResult {
    entry: RegistryEntry;
    score: number;
    matchedField: string;
}
declare class FuzzyMatcher {
    private defaultThreshold;
    /**
     * Find the best matching entry in a registry
     */
    findBestMatch(registry: RegistryEntry[], query: string, options?: FuzzyMatchOptions): RegistryEntry | null;
    /**
     * Find all matches above threshold
     */
    findAllMatches(registry: RegistryEntry[], query: string, options?: FuzzyMatchOptions): FuzzyMatchResult[];
    /**
     * Calculate similarity between two strings (0-1)
     */
    calculateSimilarity(str1: string, str2: string): number;
    /**
     * Normalize a string for comparison
     */
    normalize(str: string): string;
}

/**
 * Validator - JSON Schema validation using Ajv
 *
 * Uses Ajv 2020-12 draft support for FDS schemas which use:
 * "$schema": "https://json-schema.org/draft/2020-12/schema"
 */

interface ValidatorOptions {
    /** Suppress console warnings (useful for testing schema validity) */
    silent?: boolean;
}
declare class Validator {
    private ajv;
    private compiledSchemas;
    private schemaErrors;
    private silent;
    constructor(options?: ValidatorOptions);
    /**
     * Load external schema by URI (for $ref resolution)
     * This is called by Ajv when it encounters an external $ref
     */
    private loadExternalSchema;
    /**
     * Add schemas to the validator
     * First registers all schemas with their $id, then compiles them
     */
    addSchemas(schemas: Map<string, object>): void;
    /**
     * Check if a schema had compilation errors
     */
    hasSchemaError(name: string): boolean;
    /**
     * Get schema compilation error
     */
    getSchemaError(name: string): string | undefined;
    /**
     * Validate data against a schema
     */
    validate(data: unknown, schema: object | string): ValidationResult;
    /**
     * Validate and return typed result
     */
    validateTyped<T>(data: unknown, schema: object | string): {
        valid: true;
        data: T;
    } | {
        valid: false;
        errors: ValidationError[];
    };
    /**
     * Check if a value matches a specific type
     */
    isValidType(value: unknown, type: string): boolean;
    /**
     * Format validation errors for display
     */
    formatErrors(errors: ValidationError[]): string;
}

/**
 * OpenRouter AI Provider
 *
 * Supports rate limiting with automatic backoff on 429 responses.
 */

/**
 * OpenRouter provider configuration
 */
interface OpenRouterConfig {
    /** API key for OpenRouter */
    apiKey: string;
    /** Model to use (default: anthropic/claude-3.5-sonnet) */
    model?: string;
    /** Base URL for API (default: https://openrouter.ai/api/v1) */
    baseUrl?: string;
    /** Default temperature (default: 0.3) */
    temperature?: number;
    /** Default max tokens (default: 1024) */
    maxTokens?: number;
    /** Max retries on failure (default: 3) */
    maxRetries?: number;
    /** Base retry delay in ms (default: 1000) */
    retryDelay?: number;
    /** Optional rate limiter for request throttling */
    rateLimiter?: RateLimiter;
}
declare class OpenRouterProvider implements AIProvider {
    name: string;
    private apiKey;
    private model;
    private baseUrl;
    private defaultTemperature;
    private defaultMaxTokens;
    private maxRetries;
    private retryDelay;
    private rateLimiter;
    constructor(config: OpenRouterConfig);
    /**
     * Set or update the rate limiter
     */
    setRateLimiter(rateLimiter: RateLimiter | null): void;
    /**
     * Get the current rate limiter (for testing/monitoring)
     */
    getRateLimiter(): RateLimiter | null;
    /**
     * Get the current model
     */
    getModel(): string;
    /**
     * Set the model for subsequent requests
     */
    setModel(model: string): void;
    /**
     * Send a completion request with rate limiting and 429 handling
     */
    complete(prompt: string, options?: AIProviderOptions): Promise<AIResponse>;
    /**
     * Parse the Retry-After header value
     * Can be either seconds or HTTP-date format
     */
    private parseRetryAfter;
    /**
     * Send a completion request expecting JSON response
     */
    completeJSON<T>(prompt: string, _schema?: object, options?: AIProviderOptions): Promise<T>;
    /**
     * Sleep helper
     */
    private sleep;
}

/**
 * Transform Registry - manages transform functions and plugins
 */

declare class TransformRegistry {
    private transforms;
    private plugins;
    constructor();
    /**
     * Register built-in transforms
     */
    private registerBuiltins;
    /**
     * Register a transform function
     */
    register(name: string, fn: TransformFunction): void;
    /**
     * Register a plugin
     */
    registerPlugin(plugin: TransformPlugin): void;
    /**
     * Load a plugin from a module path
     */
    loadPlugin(modulePath: string): Promise<void>;
    /**
     * Check if an object is a valid plugin
     */
    private isValidPlugin;
    /**
     * Get a transform function by name
     */
    get(name: string): TransformFunction | undefined;
    /**
     * Apply a transform
     */
    apply(name: string, value: unknown, options: Record<string, unknown>, context: TransformContext): Promise<unknown>;
    /**
     * Check if a transform exists
     */
    has(name: string): boolean;
    /**
     * List all registered transforms
     */
    list(): string[];
    /**
     * List registered plugins
     */
    listPlugins(): string[];
}

/**
 * Slugify transform - converts strings to URL-safe slugs
 */

declare const slugify: TransformFunction;

/**
 * Title Case transform - converts strings to Title Case
 */

declare const titleCase: TransformFunction;

/**
 * UUID transforms - generate UUIDs
 */

/**
 * Generate a new UUIDv4
 *
 * FDS requires plain UUIDs for all identifiers.
 */
declare const uuid: TransformFunction;

/**
 * Array transforms - convert values to arrays
 */

/**
 * Ensure value is an array
 */
declare const toArray: TransformFunction;
/**
 * Convert URL(s) to FDS media array format
 */
declare const toMediaArray: TransformFunction;

/**
 * Auto-generate transforms - create metadata and timestamps
 */

/**
 * Generate a timestamp
 */
declare const timestamp: TransformFunction;
/**
 * Auto-generate metadata fields
 */
declare const autoGenerate: TransformFunction;

/**
 * Registry Lookup transform - find entries in FDS registries
 */

/**
 * Look up a value in a registry
 */
declare const registryLookup: TransformFunction;

/**
 * Template transform - apply simple templates
 */

/**
 * Apply a template to the value
 */
declare const template: TransformFunction;

/**
 * URL Transform - manipulate URLs
 */

/**
 * Transform a URL
 */
declare const urlTransform: TransformFunction;

/**
 * Config Loader - loads and validates mapping configurations
 */

declare class ConfigLoader {
    /**
     * Load a mapping configuration from file
     */
    static load(configPath: string): Promise<MappingConfig>;
    /**
     * Resolve relative paths in registry config
     */
    private static resolveRegistryPaths;
    /**
     * Load a mapping configuration from a URL
     */
    static loadFromUrl(url: string): Promise<MappingConfig>;
    /**
     * Merge multiple configurations
     */
    static merge(...configs: Partial<MappingConfig>[]): MappingConfig;
    /**
     * Apply environment variable overrides
     */
    static applyEnvOverrides(config: MappingConfig): MappingConfig;
    /**
     * Validate a configuration
     */
    static validate(config: MappingConfig): {
        valid: boolean;
        errors: string[];
    };
}

export { type AIProvider, type AIProviderOptions, BatchProcessor, ConfigLoader, type EnrichmentConfig, EnrichmentEngine, type EnrichmentResult, type EquipmentRegistryEntry, type FDSEquipment, type FDSExercise, type FDSMuscle, type FDSMuscleCategory, type FieldMapping, FuzzyMatcher, type MappingConfig, MappingEngine, type MuscleCategoryRegistryEntry, type MuscleRegistryEntry, OpenRouterProvider, type RegistryConfig, type RegistryEntry, RegistryManager, SchemaManager, type TransformContext, type TransformFunction, type TransformOptions, type TransformPlugin, TransformRegistry, type TransformResult, Transformer, type ValidationError, type ValidationResult, Validator, autoGenerate, registryLookup, slugify, template, timestamp, titleCase, toArray, toMediaArray, urlTransform, uuid };
