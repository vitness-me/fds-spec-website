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

import type {
  EnrichmentConfig,
  EnrichmentResult,
  FieldMapping,
  FieldMappingObject,
  TransformContext,
  AIProvider,
  TierName,
  TierConfig,
  TieredFieldEnrichmentConfig,
  FallbackConfig,
  CostEstimate,
  TierCostEstimate,
  ProgressCallback,
} from '../core/types.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { RateLimiter, DEFAULT_RATE_LIMIT_CONFIG } from './rate-limiter.js';
import { CheckpointManager } from './checkpoint-manager.js';
import {
  EXERCISE_SYSTEM_PROMPT,
  getExerciseEnrichmentPrompt,
  FIELD_PROMPTS,
  type ExerciseContext,
} from './prompts/exercise-prompts.js';
import {
  buildTierPrompt,
  SYSTEM_PROMPTS,
  type ExerciseContext as TierExerciseContext,
} from './prompts/tier-prompts.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Exercise input for batch enrichment
 */
export interface ExerciseInput {
  /** Unique identifier (exerciseId or slug) */
  id: string;
  /** Exercise slug */
  slug: string;
  /** Exercise name */
  name: string;
  /** Optional existing description */
  description?: string;
  /** Primary target muscles */
  primaryTargets?: Array<{ id: string; name: string }>;
  /** Required equipment */
  requiredEquipment?: Array<{ id: string; name: string }>;
  /** Any additional context */
  [key: string]: unknown;
}

/**
 * Result of batch enrichment
 */
export interface BatchEnrichmentResult {
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
  errors: Array<{ exerciseId: string; error: string; tier?: TierName }>;
}

/**
 * Options for batch enrichment
 */
export interface BatchEnrichmentOptions {
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

/**
 * Internal batch for processing
 */
interface ProcessingBatch {
  exercises: ExerciseInput[];
  batchNumber: number;
  totalBatches: number;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default tier configurations
 */
export const DEFAULT_TIER_CONFIGS: Record<TierName, TierConfig> = {
  simple: {
    model: 'anthropic/claude-haiku-4.5',
    temperature: 0.1,
    maxTokens: 800,
    batchSize: 10,
    priority: 'speed',
  },
  medium: {
    model: 'anthropic/claude-sonnet-4.5',
    temperature: 0.1,
    maxTokens: 1500,
    batchSize: 3,
    priority: 'balanced',
  },
  complex: {
    model: 'anthropic/claude-opus-4.5',
    temperature: 0.1,
    maxTokens: 2000,
    batchSize: 1,
    priority: 'accuracy',
  },
};

/**
 * Default fallback configuration
 */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  retries: 1,
  degradeModel: true,
  useDefaults: true,
  degradeChain: {
    complex: 'medium',
    medium: 'simple',
    simple: null,
  },
};

/**
 * Token estimates per tier for cost estimation
 */
const TOKEN_ESTIMATES = {
  simple: { inputPerExercise: 80, outputPerExercise: 40 },
  medium: { inputPerExercise: 333, outputPerExercise: 267 },
  complex: { inputPerExercise: 600, outputPerExercise: 400 },
};

/**
 * Model pricing (per 1M tokens) - OpenRouter as of 2026-01
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'anthropic/claude-haiku-4.5': { input: 0.25, output: 1.25 },
  'anthropic/claude-sonnet-4.5': { input: 3.0, output: 15.0 },
  'anthropic/claude-opus-4.5': { input: 15.0, output: 75.0 },
  // Fallback for unknown models
  default: { input: 3.0, output: 15.0 },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format duration in milliseconds to human readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}



// ============================================================================
// EnrichmentEngine Class
// ============================================================================

export class EnrichmentEngine {
  private provider: AIProvider | null = null;
  private config: EnrichmentConfig;
  private rateLimiter: RateLimiter | null = null;

  constructor(config: EnrichmentConfig = {}) {
    this.config = {
      enabled: true,
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet',
      ...config,
    };

    if (this.config.enabled) {
      this.initializeProvider();
    }
  }

  /**
   * Initialize the AI provider
   */
  private initializeProvider(): void {
    const apiKey = this.config.apiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.warn('No API key provided for AI enrichment. Enrichment will be skipped.');
      return;
    }

    // Initialize rate limiter if tiered enrichment is configured
    if (this.config.tiers || this.config.rateLimit) {
      const rateLimitConfig = this.config.rateLimit || DEFAULT_RATE_LIMIT_CONFIG;
      this.rateLimiter = new RateLimiter(rateLimitConfig);
    }

    switch (this.config.provider) {
      case 'openrouter':
        this.provider = new OpenRouterProvider({
          apiKey,
          model: this.config.model,
          baseUrl: this.config.baseUrl,
          rateLimiter: this.rateLimiter ?? undefined,
          ...this.config.options,
        });
        break;
      default:
        console.warn(`Unknown AI provider: ${this.config.provider}`);
    }
  }

  // ==========================================================================
  // Tiered Batch Enrichment (New Primary API)
  // ==========================================================================

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
  async enrichBatch(
    exercises: ExerciseInput[],
    options: BatchEnrichmentOptions = {}
  ): Promise<BatchEnrichmentResult> {
    const startTime = Date.now();
    const results = new Map<string, Record<string, unknown>>();
    const failedIds: string[] = [];
    const errors: Array<{ exerciseId: string; error: string; tier?: TierName }> = [];
    let apiCalls = 0;
    let tokensUsed = 0;

    // Early return if enrichment is disabled or no provider
    const debug = process.env.DEBUG_ENRICHMENT === 'true';
    if (debug) {
      console.log(`[DEBUG enrichBatch] config.enabled: ${this.config.enabled}, provider: ${!!this.provider}`);
      console.log(`[DEBUG enrichBatch] exercises count: ${exercises.length}`);
    }
    if (!this.config.enabled || !this.provider) {
      if (debug) {
        console.log(`[DEBUG enrichBatch] EARLY RETURN - enrichment disabled or no provider`);
      }
      return {
        results,
        failedIds,
        apiCalls,
        tokensUsed,
        durationMs: Date.now() - startTime,
        errors,
      };
    }

    // Check if tiered enrichment is configured
    if (debug) {
      console.log(`[DEBUG enrichBatch] config.tiers: ${!!this.config.tiers}, config.fields: ${!!this.config.fields}`);
    }
    if (!this.config.tiers || !this.config.fields) {
      // Fall back to comprehensive enrichment for each exercise
      for (const exercise of exercises) {
        try {
          const result = await this.enrichComprehensive({
            source: exercise as Record<string, unknown>,
            target: {},
            field: '',
            registries: { muscles: [], equipment: [], muscleCategories: [] },
            config: {} as TransformContext['config'],
          });
          if (result.success && result.data) {
            results.set(exercise.id, result.data);
          } else {
            failedIds.push(exercise.id);
            errors.push({ exerciseId: exercise.id, error: result.error || 'Unknown error' });
          }
        } catch (error) {
          failedIds.push(exercise.id);
          errors.push({
            exerciseId: exercise.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        results,
        failedIds,
        apiCalls,
        tokensUsed,
        durationMs: Date.now() - startTime,
        errors,
      };
    }

    // Initialize checkpoint manager if configured
    let checkpointManager: CheckpointManager | null = null;
    const checkpointConfig = this.config.checkpoint;
    const outputDir = options.outputDirectory || process.cwd();

    if (checkpointConfig?.enabled) {
      checkpointManager = new CheckpointManager(outputDir, checkpointConfig);

      // Try to load existing checkpoint if resuming
      if (options.resume && checkpointManager.exists()) {
        const existingData = checkpointManager.load();
        if (existingData) {
          const validation = checkpointManager.validate(this.config);
          if (validation.valid) {
            // Pre-populate results from checkpoint
            const checkpointResults = checkpointManager.getAllResults();
            for (const [exerciseId, tierResults] of Object.entries(checkpointResults)) {
              const merged: Record<string, unknown> = {};
              for (const fields of Object.values(tierResults)) {
                Object.assign(merged, fields);
              }
              results.set(exerciseId, merged);
            }
          } else {
            console.warn(`Checkpoint invalid: ${validation.reason}. Starting fresh.`);
            checkpointManager.clear();
          }
        }
      }

      // Initialize checkpoint if not loaded
      if (!checkpointManager.getData()) {
        checkpointManager.initialize({
          inputFile: 'batch-enrichment',
          totalExercises: exercises.length,
          config: this.config,
        });
      }
    }

    // Get completed IDs from checkpoint
    const completedIds = new Set(checkpointManager?.getCompletedIds() ?? []);

    // Filter exercises to process
    const exercisesToProcess = exercises.filter((e) => !completedIds.has(e.id));

    if (exercisesToProcess.length === 0) {
      return {
        results,
        failedIds,
        apiCalls,
        tokensUsed,
        durationMs: Date.now() - startTime,
        errors,
      };
    }

    // Group fields by tier
    const fieldsByTier = this.groupFieldsByTier();

    // Determine tiers to process
    const tiersToProcess: TierName[] = options.tierFilter
      ? [options.tierFilter]
      : (['simple', 'medium', 'complex'] as TierName[]);

    // Process each tier
    if (debug) {
      console.log(`[DEBUG enrichBatch] tiersToProcess: ${tiersToProcess.join(', ')}`);
      console.log(`[DEBUG enrichBatch] fieldsByTier keys: ${[...fieldsByTier.keys()].join(', ')}`);
    }
    for (const tier of tiersToProcess) {
      const tierFields = fieldsByTier.get(tier);
      if (debug) {
        console.log(`[DEBUG enrichBatch] tier: ${tier}, fields: ${tierFields ? [...tierFields.keys()].join(', ') : 'none'}`);
      }
      if (!tierFields || tierFields.size === 0) {
        if (debug) {
          console.log(`[DEBUG enrichBatch] SKIPPING tier ${tier} - no fields`);
        }
        continue;
      }

      const tierConfig = this.getTierConfig(tier);
      const batches = this.createBatches(exercisesToProcess, tierConfig.batchSize);

      // Update checkpoint with current tier
      if (checkpointManager) {
        const data = checkpointManager.getData();
        if (data) {
          data.currentTier = tier;
        }
      }

      for (const batch of batches) {
        try {
          const batchResult = await this.processTierBatch(
            tier,
            tierConfig,
            batch,
            tierFields,
            options.onProgress,
            checkpointManager
          );

          // Merge batch results
          if (debug) {
            console.log(`[DEBUG enrichBatch] batchResult.results.size: ${batchResult.results.size}, apiCalls: ${batchResult.apiCalls}`);
          }
          for (const [exerciseId, fields] of batchResult.results) {
            const existing = results.get(exerciseId) || {};
            results.set(exerciseId, { ...existing, ...fields });
            if (debug) {
              console.log(`[DEBUG enrichBatch] Merged result for ${exerciseId}`);
            }

            // Update checkpoint
            if (checkpointManager) {
              checkpointManager.update({
                exerciseId,
                success: true,
                currentTier: tier,
                results: { [tier]: fields },
              });
            }
          }

          // Track failures
          for (const id of batchResult.failedIds) {
            if (!failedIds.includes(id)) {
              failedIds.push(id);
            }
          }

          // Track stats
          apiCalls += batchResult.apiCalls;
          tokensUsed += batchResult.tokensUsed;
          errors.push(...batchResult.errors);
          if (debug) {
            console.log(`[DEBUG enrichBatch] Updated totals - apiCalls: ${apiCalls}, tokensUsed: ${tokensUsed}`);
          }
        } catch (error) {
          // Batch-level error - mark all exercises in batch as failed
          for (const exercise of batch.exercises) {
            if (!failedIds.includes(exercise.id)) {
              failedIds.push(exercise.id);
              errors.push({
                exerciseId: exercise.id,
                error: error instanceof Error ? error.message : 'Unknown error',
                tier,
              });
            }
          }
        }
      }
    }

    // Clear checkpoint on successful completion
    if (checkpointManager && failedIds.length === 0) {
      checkpointManager.clear();
    } else if (checkpointManager) {
      checkpointManager.forceSave();
    }

    return {
      results,
      failedIds,
      apiCalls,
      tokensUsed,
      durationMs: Date.now() - startTime,
      errors,
    };
  }

  /**
   * Estimate cost for batch enrichment
   */
  estimateCost(exerciseCount: number): CostEstimate {
    const tiers = this.config.tiers || DEFAULT_TIER_CONFIGS;
    const fields = this.config.fields || {};

    // Count fields per tier
    const fieldCounts: Record<TierName, number> = { simple: 0, medium: 0, complex: 0 };
    for (const fieldConfig of Object.values(fields)) {
      fieldCounts[fieldConfig.tier]++;
    }

    const tierEstimates: Record<TierName, TierCostEstimate> = {} as Record<
      TierName,
      TierCostEstimate
    >;
    let totalApiCalls = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    for (const tierName of ['simple', 'medium', 'complex'] as TierName[]) {
      const tierConfig = tiers[tierName] || DEFAULT_TIER_CONFIGS[tierName];
      const tokenEstimate = TOKEN_ESTIMATES[tierName];
      const pricing = MODEL_PRICING[tierConfig.model] || MODEL_PRICING['default'];

      const apiCalls = Math.ceil(exerciseCount / tierConfig.batchSize);
      const inputTokens = exerciseCount * tokenEstimate.inputPerExercise;
      const outputTokens = exerciseCount * tokenEstimate.outputPerExercise;
      const cost =
        (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;

      tierEstimates[tierName] = {
        tier: tierName,
        model: tierConfig.model,
        batchSize: tierConfig.batchSize,
        apiCalls,
        inputTokens,
        outputTokens,
        cost: Math.round(cost * 100) / 100,
      };

      totalApiCalls += apiCalls;
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      totalCost += cost;
    }

    // Estimate time (assuming 50 requests/minute rate limit)
    const requestsPerMinute = this.config.rateLimit?.requestsPerMinute || 50;
    const estimatedMinutes = totalApiCalls / requestsPerMinute;

    return {
      tiers: tierEstimates,
      total: {
        apiCalls: totalApiCalls,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cost: Math.round(totalCost * 100) / 100,
      },
      estimatedTime: {
        minutes: Math.round(estimatedMinutes),
        formatted: formatDuration(estimatedMinutes * 60000),
      },
      disclaimer:
        'Costs are estimates based on average token usage. Actual costs may vary by ±20%.',
    };
  }

  /**
   * Group configured fields by their tier
   */
  groupFieldsByTier(): Map<TierName, Map<string, TieredFieldEnrichmentConfig>> {
    const result = new Map<TierName, Map<string, TieredFieldEnrichmentConfig>>();
    result.set('simple', new Map());
    result.set('medium', new Map());
    result.set('complex', new Map());

    if (!this.config.fields) {
      return result;
    }

    for (const [fieldPath, fieldConfig] of Object.entries(this.config.fields)) {
      const tierMap = result.get(fieldConfig.tier);
      if (tierMap) {
        tierMap.set(fieldPath, fieldConfig);
      }
    }

    return result;
  }

  /**
   * Get tier configuration, merging with defaults
   */
  getTierConfig(tier: TierName): TierConfig {
    const defaultConfig = DEFAULT_TIER_CONFIGS[tier];
    const customConfig = this.config.tiers?.[tier];

    if (!customConfig) {
      return defaultConfig;
    }

    return { ...defaultConfig, ...customConfig };
  }

  /**
   * Get fallback configuration
   */
  getFallbackConfig(): FallbackConfig {
    return this.config.fallback || DEFAULT_FALLBACK_CONFIG;
  }

  /**
   * Create batches of exercises for processing
   */
  private createBatches(exercises: ExerciseInput[], batchSize: number): ProcessingBatch[] {
    const batches: ProcessingBatch[] = [];
    const totalBatches = Math.ceil(exercises.length / batchSize);

    for (let i = 0; i < exercises.length; i += batchSize) {
      batches.push({
        exercises: exercises.slice(i, i + batchSize),
        batchNumber: batches.length + 1,
        totalBatches,
      });
    }

    return batches;
  }

  /**
   * Process a batch of exercises for a specific tier
   */
  private async processTierBatch(
    tier: TierName,
    tierConfig: TierConfig,
    batch: ProcessingBatch,
    fields: Map<string, TieredFieldEnrichmentConfig>,
    onProgress?: ProgressCallback,
    _checkpointManager?: CheckpointManager | null
  ): Promise<BatchEnrichmentResult> {
    const startTime = Date.now();
    const results = new Map<string, Record<string, unknown>>();
    const failedIds: string[] = [];
    const errors: Array<{ exerciseId: string; error: string; tier?: TierName }> = [];
    let apiCalls = 0;
    let tokensUsed = 0;

    if (!this.provider) {
      return {
        results,
        failedIds: batch.exercises.map((e) => e.id),
        apiCalls: 0,
        tokensUsed: 0,
        durationMs: 0,
        errors: [{ exerciseId: 'batch', error: 'No AI provider available', tier }],
      };
    }

    // Get unique prompt IDs for this tier's fields
    const promptIds = new Set<string>();
    for (const fieldConfig of fields.values()) {
      promptIds.add(fieldConfig.prompt);
    }

    // Convert exercises to tier prompt context format
    const exerciseContexts: TierExerciseContext[] = batch.exercises.map((e) => ({
      name: e.name,
      slug: e.slug,
      description: e.description,
      primaryTargets: e.primaryTargets,
      requiredEquipment: e.requiredEquipment,
      exerciseType: e.exerciseType as string | undefined,
    }));

    // Process each prompt for this tier
    const debug = process.env.DEBUG_ENRICHMENT === 'true';
    if (debug) {
      console.log(`[DEBUG processTierBatch] tier: ${tier}, promptIds: ${[...promptIds].join(', ')}`);
    }
    for (const promptId of promptIds) {
      const builtPrompt = buildTierPrompt(tier, promptId, exerciseContexts);
      if (!builtPrompt) {
        if (debug) {
          console.log(`[DEBUG processTierBatch] NO PROMPT BUILT for promptId: ${promptId}`);
        }
        continue;
      }
      if (debug) {
        console.log(`[DEBUG processTierBatch] Built prompt for promptId: ${promptId}`);
      }

      // Report progress
      if (onProgress) {
        const exercise = batch.exercises[0];
        onProgress({
          exercise: {
            current: batch.batchNumber,
            total: batch.totalBatches,
            name: exercise.name,
            slug: exercise.slug,
          },
          tier: {
            name: tier,
            status: 'processing',
            batchNumber: batch.batchNumber,
            totalBatches: batch.totalBatches,
          },
          overall: {
            percentage: (batch.batchNumber / batch.totalBatches) * 100,
            elapsedMs: Date.now() - startTime,
            elapsedFormatted: formatDuration(Date.now() - startTime),
            remainingMs: 0,
            remainingFormatted: 'calculating...',
            apiCalls,
            errors: errors.length,
          },
        });
      }

      try {
        // Switch model for this tier
        if (this.provider instanceof OpenRouterProvider) {
          (this.provider as OpenRouterProvider).setModel(tierConfig.model);
        }

        if (debug) {
          console.log(`[DEBUG processTierBatch] Calling API for promptId: ${promptId}, model: ${tierConfig.model}`);
        }

        // Make API call with retry/fallback handling
        const response = await this.callWithFallback(tier, builtPrompt, tierConfig);
        apiCalls++;
        tokensUsed += response.tokensUsed || 0;

        if (debug) {
          console.log(`[DEBUG processTierBatch] API response received, tokens: ${response.tokensUsed}`);
          console.log(`[DEBUG processTierBatch] Response content (first 300 chars): ${response.content.slice(0, 300)}`);
        }

        // Parse and distribute results
        const parsedResults = this.parseResponse(response.content, batch.exercises, promptId);

        if (debug) {
          console.log(`[DEBUG processTierBatch] Parsed results count: ${parsedResults.size}`);
        }

        for (const [exerciseId, fieldValues] of parsedResults) {
          const existing = results.get(exerciseId) || {};
          results.set(exerciseId, { ...existing, ...fieldValues });
          if (debug) {
            console.log(`[DEBUG processTierBatch] Set result for ${exerciseId}: ${JSON.stringify(fieldValues).slice(0, 200)}`);
          }
        }
      } catch (error) {
        if (debug) {
          console.error(`[DEBUG processTierBatch] ERROR for promptId ${promptId}:`, error);
        }
        // Mark batch as failed for this prompt
        for (const exercise of batch.exercises) {
          if (!failedIds.includes(exercise.id)) {
            failedIds.push(exercise.id);
          }
          errors.push({
            exerciseId: exercise.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            tier,
          });
        }
      }
    }

    return {
      results,
      failedIds,
      apiCalls,
      tokensUsed,
      durationMs: Date.now() - startTime,
      errors,
    };
  }

  /**
   * Call API with fallback on errors
   */
  private async callWithFallback(
    tier: TierName,
    prompt: { system: string; user: string },
    tierConfig: TierConfig,
    attemptNumber: number = 0
  ): Promise<{ content: string; tokensUsed?: number }> {
    const fallbackConfig = this.getFallbackConfig();

    if (!this.provider) {
      throw new Error('No AI provider available');
    }

    try {
      const response = await this.provider.complete(prompt.user, {
        systemPrompt: prompt.system,
        temperature: tierConfig.temperature,
        maxTokens: tierConfig.maxTokens,
      });

      return { content: response.content, tokensUsed: response.tokensUsed };
    } catch (error) {
      // Check if we should retry
      if (attemptNumber < fallbackConfig.retries) {
        return this.callWithFallback(tier, prompt, tierConfig, attemptNumber + 1);
      }

      // Check if we should degrade to a lower tier
      if (fallbackConfig.degradeModel) {
        const degradeTier = fallbackConfig.degradeChain[tier];
        if (degradeTier) {
          const degradeConfig = this.getTierConfig(degradeTier);

          // Switch model
          if (this.provider instanceof OpenRouterProvider) {
            (this.provider as OpenRouterProvider).setModel(degradeConfig.model);
          }

          // Use degraded tier's system prompt
          const degradedPrompt = {
            system: SYSTEM_PROMPTS[degradeTier],
            user: prompt.user,
          };

          return this.callWithFallback(degradeTier, degradedPrompt, degradeConfig, 0);
        }
      }

      // Re-throw if no fallback available
      throw error;
    }
  }

  /**
   * Parse API response and map to exercises
   */
  private parseResponse(
    content: string,
    exercises: ExerciseInput[],
    promptId: string
  ): Map<string, Record<string, unknown>> {
    const results = new Map<string, Record<string, unknown>>();

    // Debug logging
    const debug = process.env.DEBUG_ENRICHMENT === 'true';
    if (debug) {
      console.log(`\n[DEBUG parseResponse] promptId: ${promptId}`);
      console.log(`[DEBUG parseResponse] exercises: ${exercises.map(e => e.slug).join(', ')}`);
      console.log(`[DEBUG parseResponse] raw content (first 500 chars):\n${content.slice(0, 500)}`);
    }

    try {
      // Extract JSON from response
      let jsonStr = content.trim();
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
        if (debug) {
          console.log(`[DEBUG parseResponse] extracted from code block`);
        }
      }

      if (debug) {
        console.log(`[DEBUG parseResponse] jsonStr to parse (first 500 chars):\n${jsonStr.slice(0, 500)}`);
      }

      const parsed = JSON.parse(jsonStr);

      if (debug) {
        console.log(`[DEBUG parseResponse] parsed successfully, keys: ${Object.keys(parsed).join(', ')}`);
        if (parsed.results) {
          console.log(`[DEBUG parseResponse] results array length: ${parsed.results.length}`);
          console.log(`[DEBUG parseResponse] results slugs: ${parsed.results.map((r: Record<string, unknown>) => r.slug).join(', ')}`);
        }
      }

      // Handle batch response format
      if (parsed.results && Array.isArray(parsed.results)) {
        for (const result of parsed.results) {
          const slug = result.slug;
          const exercise = exercises.find((e) => e.slug === slug);
          if (debug) {
            console.log(`[DEBUG parseResponse] looking for slug "${slug}" -> found: ${!!exercise}`);
          }
          if (exercise) {
            // Remove slug from result and map fields
            const { slug: _slug, ...fields } = result;
            const mapped = this.mapFieldsFromPrompt(promptId, fields);
            if (debug) {
              console.log(`[DEBUG parseResponse] mapped fields for ${exercise.id}:`, JSON.stringify(mapped, null, 2));
            }
            results.set(exercise.id, mapped);
          }
        }
      } else {
        // Single exercise response (complex tier)
        const exercise = exercises[0];
        if (exercise) {
          const mapped = this.mapFieldsFromPrompt(promptId, parsed);
          if (debug) {
            console.log(`[DEBUG parseResponse] single exercise mapped:`, JSON.stringify(mapped, null, 2));
          }
          results.set(exercise.id, mapped);
        }
      }
    } catch (err) {
      // If parsing fails, return empty results
      console.warn('Failed to parse API response:', content.slice(0, 200));
      if (debug) {
        console.error(`[DEBUG parseResponse] parse error:`, err);
      }
    }

    if (debug) {
      console.log(`[DEBUG parseResponse] final results count: ${results.size}`);
    }

    return results;
  }

  /**
   * Map parsed fields to proper FDS paths based on prompt type
   */
  private mapFieldsFromPrompt(
    promptId: string,
    fields: Record<string, unknown>
  ): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};

    switch (promptId) {
      case 'description':
        if (fields.description) {
          this.setNestedValue(mapped, 'canonical.description', fields.description);
        }
        break;

      case 'aliases':
        if (fields.aliases) {
          this.setNestedValue(mapped, 'canonical.aliases', fields.aliases);
        }
        break;

      case 'classification-simple':
        if (fields.exerciseType) {
          this.setNestedValue(mapped, 'classification.exerciseType', fields.exerciseType);
        }
        if (fields.level) {
          this.setNestedValue(mapped, 'classification.level', fields.level);
        }
        if (fields.unilateral !== undefined) {
          this.setNestedValue(mapped, 'classification.unilateral', fields.unilateral);
        }
        break;

      case 'metrics':
        if (fields.primary) {
          this.setNestedValue(mapped, 'metrics.primary', fields.primary);
        }
        if (fields.secondary) {
          this.setNestedValue(mapped, 'metrics.secondary', fields.secondary);
        }
        break;

      case 'equipment':
        if (fields.optional) {
          this.setNestedValue(mapped, 'equipment.optional', fields.optional);
        }
        break;

      case 'constraints':
        if (fields.contraindications) {
          this.setNestedValue(mapped, 'constraints.contraindications', fields.contraindications);
        }
        if (fields.prerequisites) {
          this.setNestedValue(mapped, 'constraints.prerequisites', fields.prerequisites);
        }
        if (fields.progressions) {
          this.setNestedValue(mapped, 'constraints.progressions', fields.progressions);
        }
        if (fields.regressions) {
          this.setNestedValue(mapped, 'constraints.regressions', fields.regressions);
        }
        break;

      case 'relations':
        if (fields.relations) {
          this.setNestedValue(mapped, 'relations', fields.relations);
        }
        break;

      case 'biomechanics':
        if (fields.movement) {
          this.setNestedValue(mapped, 'classification.movement', fields.movement);
        }
        if (fields.mechanics) {
          this.setNestedValue(mapped, 'classification.mechanics', fields.mechanics);
        }
        if (fields.force) {
          this.setNestedValue(mapped, 'classification.force', fields.force);
        }
        if (fields.kineticChain) {
          this.setNestedValue(mapped, 'classification.kineticChain', fields.kineticChain);
        }
        if (fields.tags) {
          this.setNestedValue(mapped, 'classification.tags', fields.tags);
        }
        if (fields.secondary) {
          this.setNestedValue(mapped, 'targets.secondary', fields.secondary);
        }
        break;

      default:
        // Unknown prompt - copy fields as-is
        Object.assign(mapped, fields);
    }

    return mapped;
  }

  // ==========================================================================
  // Legacy API (Backwards Compatible)
  // ==========================================================================

  /**
   * Enrich mapped data with AI-generated content
   * Uses comprehensive single-call enrichment for efficiency
   * @deprecated Use enrichBatch for new code
   */
  async enrich(
    mapped: Record<string, unknown>,
    mappings: Record<string, FieldMapping>,
    context: TransformContext
  ): Promise<EnrichmentResult> {
    if (!this.provider || !this.config.enabled) {
      return { success: true, data: {} };
    }

    // Check if any fields need enrichment
    const fieldsNeedingEnrichment: string[] = [];
    for (const [field, mapping] of Object.entries(mappings)) {
      const mappingObj = this.normalizeMapping(mapping);
      if (mappingObj.enrichment?.enabled) {
        const shouldEnrich = this.shouldEnrich(mapped, field, mappingObj.enrichment);
        if (shouldEnrich && !this.config.skipFields?.includes(field)) {
          fieldsNeedingEnrichment.push(field);
        }
      }
    }

    if (fieldsNeedingEnrichment.length === 0) {
      return { success: true, data: {} };
    }

    // Use comprehensive single-call enrichment
    try {
      const result = await this.enrichComprehensive(context);
      if (result.success && result.data) {
        return result;
      }
    } catch (error) {
      console.warn('Comprehensive enrichment failed, falling back to per-field:', error);
    }

    // Fallback to per-field enrichment if comprehensive fails
    return this.enrichPerField(mapped, mappings, context);
  }

  /**
   * Comprehensive enrichment - single API call for all fields
   */
  private async enrichComprehensive(context: TransformContext): Promise<EnrichmentResult> {
    if (!this.provider) {
      return { success: false, error: 'No AI provider available' };
    }

    const exerciseContext: ExerciseContext = {
      name: String(context.source.name || 'Unknown Exercise'),
      target: context.source.target as string | undefined,
      equipment: context.source.equipment as string | undefined,
      bodyPart: context.source.bodyPart as string | undefined,
    };

    const prompt = getExerciseEnrichmentPrompt(exerciseContext);

    try {
      const result = await this.provider.completeJSON<Record<string, unknown>>(prompt, undefined, {
        systemPrompt: EXERCISE_SYSTEM_PROMPT,
        temperature: this.config.options?.temperature ?? 0.3,
        maxTokens: this.config.options?.maxTokens ?? 4000,
      });

      // Map the comprehensive result to the expected structure
      const enrichedData: Record<string, unknown> = {};

      // Map description and aliases
      if (result.description) {
        this.setNestedValue(enrichedData, 'canonical.description', result.description);
      }
      if (result.aliases) {
        this.setNestedValue(enrichedData, 'canonical.aliases', result.aliases);
      }
      if (result.localized) {
        this.setNestedValue(enrichedData, 'canonical.localized', result.localized);
      }

      // Map classification
      if (result.classification) {
        const classification = result.classification as Record<string, unknown>;
        for (const [key, value] of Object.entries(classification)) {
          this.setNestedValue(enrichedData, `classification.${key}`, value);
        }
      }

      // Map targets
      if (result.targets) {
        const targets = result.targets as Record<string, unknown>;
        if (targets.secondary) {
          this.setNestedValue(enrichedData, 'targets.secondary', targets.secondary);
        }
      }

      // Map equipment
      if (result.equipment) {
        const equipment = result.equipment as Record<string, unknown>;
        if (equipment.optional) {
          this.setNestedValue(enrichedData, 'equipment.optional', equipment.optional);
        }
      }

      // Map constraints
      if (result.constraints) {
        const constraints = result.constraints as Record<string, unknown>;
        for (const [key, value] of Object.entries(constraints)) {
          this.setNestedValue(enrichedData, `constraints.${key}`, value);
        }
      }

      // Map relations
      if (result.relations) {
        this.setNestedValue(enrichedData, 'relations', result.relations);
      }

      // Map metrics
      if (result.metrics) {
        const metrics = result.metrics as Record<string, unknown>;
        if (metrics.primary) {
          this.setNestedValue(enrichedData, 'metrics.primary', metrics.primary);
        }
        if (metrics.secondary) {
          this.setNestedValue(enrichedData, 'metrics.secondary', metrics.secondary);
        }
      }

      return {
        success: true,
        data: enrichedData,
        tokensUsed: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Per-field enrichment fallback
   */
  private async enrichPerField(
    mapped: Record<string, unknown>,
    mappings: Record<string, FieldMapping>,
    context: TransformContext
  ): Promise<EnrichmentResult> {
    const enrichedData: Record<string, unknown> = {};
    let totalTokens = 0;

    for (const [field, mapping] of Object.entries(mappings)) {
      const mappingObj = this.normalizeMapping(mapping);

      if (!mappingObj.enrichment?.enabled) {
        continue;
      }

      const shouldEnrich = this.shouldEnrich(mapped, field, mappingObj.enrichment);
      if (!shouldEnrich || this.config.skipFields?.includes(field)) {
        continue;
      }

      try {
        const result = await this.enrichField(field, mappingObj, context);

        if (result.success && result.data) {
          if (mappingObj.enrichment.fields) {
            for (const subField of mappingObj.enrichment.fields) {
              const fullPath = field.includes('.') ? field : `${field}.${subField}`;
              if (result.data[subField] !== undefined) {
                this.setNestedValue(enrichedData, fullPath, result.data[subField]);
              }
            }
          } else {
            this.setNestedValue(enrichedData, field, result.data);
          }
          totalTokens += result.tokensUsed || 0;
        }
      } catch (error) {
        console.warn(`Failed to enrich field ${field}:`, error);
        if (mappingObj.enrichment.fallback !== undefined) {
          this.setNestedValue(enrichedData, field, mappingObj.enrichment.fallback);
        }
      }
    }

    return {
      success: true,
      data: enrichedData,
      tokensUsed: totalTokens,
    };
  }

  /**
   * Check if a field should be enriched
   */
  private shouldEnrich(
    mapped: Record<string, unknown>,
    field: string,
    config: NonNullable<FieldMappingObject['enrichment']>
  ): boolean {
    const when = config.when || 'missing';
    const currentValue = this.getNestedValue(mapped, field);

    switch (when) {
      case 'always':
        return true;
      case 'missing':
        return currentValue === undefined;
      case 'empty':
        return currentValue === undefined || currentValue === null || currentValue === '';
      case 'notFound':
        return currentValue === undefined || currentValue === null;
      default:
        return false;
    }
  }

  /**
   * Enrich a single field
   */
  private async enrichField(
    field: string,
    mapping: FieldMappingObject,
    context: TransformContext
  ): Promise<EnrichmentResult> {
    if (!this.provider) {
      return { success: false, error: 'No AI provider available' };
    }

    const enrichmentConfig = mapping.enrichment!;

    // Build context for the prompt
    const promptContext: Record<string, unknown> = {};
    if (enrichmentConfig.context) {
      for (const contextField of enrichmentConfig.context) {
        promptContext[contextField] =
          this.getNestedValue(context.source, contextField) ??
          this.getNestedValue(context.target, contextField);
      }
    }

    // Get the prompt template
    const prompt = this.buildPrompt(field, enrichmentConfig.prompt, promptContext);

    try {
      const result = await this.provider.completeJSON(prompt, undefined, {
        systemPrompt: this.getSystemPrompt(),
        temperature: this.config.options?.temperature ?? 0.3,
        maxTokens: this.config.options?.maxTokens ?? 2000,
      });
      return {
        success: true,
        data: result as Record<string, unknown>,
        tokensUsed: 0, // Would be set by provider
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build the prompt for AI enrichment
   */
  private buildPrompt(
    _field: string,
    promptName: string | undefined,
    context: Record<string, unknown>
  ): string {
    // Build exercise context
    const exerciseContext: ExerciseContext = {
      name: String(context.name || context['canonical.name'] || 'Unknown Exercise'),
      target: context.target as string | undefined,
      equipment: context.equipment as string | undefined,
      bodyPart: context.bodyPart as string | undefined,
    };

    // Use specific prompt template if available
    if (promptName && FIELD_PROMPTS[promptName]) {
      return FIELD_PROMPTS[promptName](exerciseContext);
    }

    // Fall back to comprehensive enrichment prompt
    return getExerciseEnrichmentPrompt(exerciseContext);
  }

  /**
   * Get the system prompt for enrichment
   */
  getSystemPrompt(): string {
    return EXERCISE_SYSTEM_PROMPT;
  }

  /**
   * Check if engine is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled === true && this.provider !== null;
  }

  /**
   * Check if tiered enrichment is configured
   */
  isTieredEnabled(): boolean {
    return !!(this.config.tiers && this.config.fields);
  }

  /**
   * Get the provider (for testing)
   */
  getProvider(): AIProvider | null {
    return this.provider;
  }

  /**
   * Get the rate limiter (for testing)
   */
  getRateLimiter(): RateLimiter | null {
    return this.rateLimiter;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Normalize mapping to object form
   */
  private normalizeMapping(mapping: FieldMapping): FieldMappingObject {
    if (typeof mapping === 'string') {
      return { from: mapping };
    }
    return mapping;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }
}
