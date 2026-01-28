/**
 * Main Transformer class for FDS schema transformation
 *
 * Supports two modes of operation:
 * 1. Single-item transformation via transform() - Uses legacy enrichment
 * 2. Batch transformation via transformAllBatch() - Uses tiered enrichment
 */

import type {
  MappingConfig,
  TransformOptions,
  TransformResult,
  TransformContext,
  ProgressCallback,
  CostEstimate,
} from './types.js';
import { MappingEngine } from './mapping-engine.js';
import { RegistryManager } from '../registries/registry-manager.js';
import { SchemaManager } from '../schemas/schema-manager.js';
import { EnrichmentEngine, type ExerciseInput, type BatchEnrichmentOptions, type BatchEnrichmentResult } from '../ai/enrichment-engine.js';
import { ConfigLoader } from '../config/config-loader.js';

export interface TransformerOptions extends TransformOptions {
  config?: MappingConfig | string;
}

/**
 * Options for batch transformation with tiered enrichment
 */
export interface BatchTransformOptions {
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
export interface BatchTransformResult {
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
  errors: Array<{ index: number; exerciseId?: string; error: string }>;
}

export class Transformer {
  private config: MappingConfig;
  private mappingEngine: MappingEngine;
  private registryManager: RegistryManager;
  private schemaManager: SchemaManager;
  private enrichmentEngine: EnrichmentEngine | null = null;
  private initialized = false;

  constructor(options: TransformerOptions = {}) {
    // Config will be loaded during init
    this.config = options.config as MappingConfig || {} as MappingConfig;
    this.mappingEngine = new MappingEngine();
    this.registryManager = new RegistryManager();
    this.schemaManager = new SchemaManager();
    // EnrichmentEngine will be initialized in init() after config is loaded
  }

  /**
   * Get the enrichment engine (for testing or direct access)
   */
  getEnrichmentEngine(): EnrichmentEngine | null {
    return this.enrichmentEngine;
  }

  /**
   * Get the schema manager (for accessing schema $defs)
   */
  getSchemaManager(): SchemaManager {
    return this.schemaManager;
  }

  /**
   * Check if tiered enrichment is available
   */
  isTieredEnrichmentEnabled(): boolean {
    return this.enrichmentEngine?.isTieredEnabled() ?? false;
  }

  /**
   * Get cost estimate for batch enrichment
   */
  estimateCost(exerciseCount: number): CostEstimate | null {
    if (!this.enrichmentEngine) {
      return null;
    }
    return this.enrichmentEngine.estimateCost(exerciseCount);
  }

  /**
   * Initialize the transformer (load config, registries, schemas)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Load config if string path provided
    if (typeof this.config === 'string') {
      this.config = await ConfigLoader.load(this.config);
    }

    // Initialize enrichment engine with config settings
    if (this.config.enrichment?.enabled !== false) {
      this.enrichmentEngine = new EnrichmentEngine(this.config.enrichment);
    }

    // Load registries
    if (this.config.registries) {
      await this.registryManager.load(this.config.registries);
    }

    // Load target schema
    if (this.config.targetSchema) {
      await this.schemaManager.loadVersion(this.config.targetSchema.version);
    }

    this.initialized = true;
  }

  /**
   * Transform a single source item to FDS format
   */
  async transform(source: Record<string, unknown>): Promise<TransformResult> {
    await this.init();

    const context: TransformContext = {
      source,
      target: {},
      field: '',
      registries: {
        muscles: this.registryManager.getMuscles(),
        equipment: this.registryManager.getEquipment(),
        muscleCategories: this.registryManager.getMuscleCategories(),
      },
      config: this.config,
    };

    try {
      // Apply mappings
      const mapped = await this.mappingEngine.apply(
        source,
        this.config.mappings,
        context
      );

      // Apply AI enrichment if enabled
      let enriched: string[] = [];
      if (this.enrichmentEngine && this.config.enrichment?.enabled !== false) {
        const enrichmentResult = await this.enrichmentEngine.enrich(
          mapped,
          this.config.mappings,
          context
        );
        this.deepMerge(mapped, enrichmentResult.data || {});
        enriched = Object.keys(enrichmentResult.data || {});
      }

      // Validate output
      let validation = { valid: true, errors: [] as any[] };
      if (this.config.validation?.enabled !== false) {
        validation = await this.schemaManager.validate(
          mapped,
          this.config.targetSchema?.entity || 'exercise'
        );
      }

      return {
        success: validation.valid || !this.config.validation?.strict,
        data: mapped as any,
        errors: validation.errors,
        enriched,
        __validation: validation,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            field: '_transform',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      };
    }
  }

  /**
   * Transform multiple items with streaming support
   */
  async *transformStream(
    source: AsyncIterable<Record<string, unknown>> | Iterable<Record<string, unknown>>
  ): AsyncGenerator<TransformResult> {
    await this.init();

    for await (const item of source) {
      yield await this.transform(item);
    }
  }

  /**
   * Transform all items from an array
   */
  async transformAll(
    sources: Record<string, unknown>[]
  ): Promise<TransformResult[]> {
    const results: TransformResult[] = [];
    for await (const result of this.transformStream(sources)) {
      results.push(result);
    }
    return results;
  }

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
  async transformAllBatch(
    sources: Record<string, unknown>[],
    options: BatchTransformOptions = {}
  ): Promise<BatchTransformResult> {
    const startTime = Date.now();
    await this.init();

    const results: TransformResult[] = [];
    const errors: Array<{ index: number; exerciseId?: string; error: string }> = [];
    let enrichedCount = 0;
    let apiCalls = 0;
    let tokensUsed = 0;

    // Phase 1: Map all exercises (without enrichment)
    const mappedExercises: Array<{
      index: number;
      source: Record<string, unknown>;
      mapped: Record<string, unknown>;
      context: TransformContext;
    }> = [];

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const context: TransformContext = {
        source,
        target: {},
        field: '',
        registries: {
          muscles: this.registryManager.getMuscles(),
          equipment: this.registryManager.getEquipment(),
          muscleCategories: this.registryManager.getMuscleCategories(),
        },
        config: this.config,
      };

      try {
        const mapped = await this.mappingEngine.apply(
          source,
          this.config.mappings,
          context
        );
        mappedExercises.push({ index: i, source, mapped, context });
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Mapping failed',
        });
        results[i] = {
          success: false,
          errors: [
            {
              field: '_mapping',
              message: error instanceof Error ? error.message : 'Mapping failed',
            },
          ],
        };
      }
    }

    // Phase 2: Batch enrichment (if tiered enrichment is configured)
    let enrichmentResults: BatchEnrichmentResult | null = null;

    if (
      !options.skipEnrichment &&
      this.enrichmentEngine &&
      this.config.enrichment?.enabled !== false &&
      this.enrichmentEngine.isTieredEnabled()
    ) {
      // Prepare exercise inputs for batch enrichment
      const exerciseInputs: ExerciseInput[] = mappedExercises.map(({ mapped, index }) => {
        const canonical = mapped.canonical as Record<string, unknown> | undefined;
        const targets = mapped.targets as Record<string, unknown> | undefined;
        const equipment = mapped.equipment as Record<string, unknown> | undefined;

        return {
          id: (mapped.exerciseId as string) || `exercise-${index}`,
          slug: (canonical?.slug as string) || `exercise-${index}`,
          name: (canonical?.name as string) || `Exercise ${index}`,
          description: canonical?.description as string | undefined,
          primaryTargets: (targets?.primary as Array<{ id: string; name: string }>) || undefined,
          requiredEquipment:
            (equipment?.required as Array<{ id: string; name: string }>) || undefined,
        };
      });

      // Get schema $defs for validation context
      const schema = this.schemaManager.getSchema(
        this.config.targetSchema?.entity || 'exercise',
        this.config.targetSchema?.version || '1.0.0'
      );
      const schemaDefs = (schema as Record<string, unknown> | null)?.$defs as
        | Record<string, unknown>
        | undefined;

      // Prepare enrichment options
      const enrichmentOptions: BatchEnrichmentOptions = {
        resume: options.resume,
        tierFilter: options.tierFilter,
        onProgress: options.onProgress,
        outputDirectory: options.outputDirectory,
        schemaDefs,
      };

      // Run batch enrichment
      enrichmentResults = await this.enrichmentEngine.enrichBatch(
        exerciseInputs,
        enrichmentOptions
      );

      apiCalls = enrichmentResults.apiCalls;
      tokensUsed = enrichmentResults.tokensUsed;
    }

    // Phase 3: Merge enrichment results and validate
    for (const { index, mapped, source } of mappedExercises) {
      // Skip if already errored in mapping phase
      if (results[index]) {
        continue;
      }

      // Merge enrichment results if available
      let enriched: string[] = [];
      if (enrichmentResults) {
        const exerciseId =
          (mapped.exerciseId as string) ||
          ((mapped.canonical as Record<string, unknown> | undefined)?.slug as string) ||
          `exercise-${index}`;

        const enrichmentData = enrichmentResults.results.get(exerciseId);
        if (enrichmentData) {
          this.deepMerge(mapped, enrichmentData);
          enriched = Object.keys(enrichmentData);
          enrichedCount++;
        }

        // Check if this exercise failed enrichment
        if (enrichmentResults.failedIds.includes(exerciseId)) {
          const error = enrichmentResults.errors.find((e) => e.exerciseId === exerciseId);
          errors.push({
            index,
            exerciseId,
            error: error?.error || 'Enrichment failed',
          });
        }
      }

      // Apply legacy single-item enrichment if tiered is not enabled
      if (
        !options.skipEnrichment &&
        this.enrichmentEngine &&
        this.config.enrichment?.enabled !== false &&
        !this.enrichmentEngine.isTieredEnabled()
      ) {
        try {
          const context: TransformContext = {
            source,
            target: mapped,
            field: '',
            registries: {
              muscles: this.registryManager.getMuscles(),
              equipment: this.registryManager.getEquipment(),
              muscleCategories: this.registryManager.getMuscleCategories(),
            },
            config: this.config,
          };
          const enrichmentResult = await this.enrichmentEngine.enrich(
            mapped,
            this.config.mappings,
            context
          );
          if (enrichmentResult.data) {
            this.deepMerge(mapped, enrichmentResult.data);
            enriched = Object.keys(enrichmentResult.data);
            enrichedCount++;
          }
        } catch (error) {
          errors.push({
            index,
            error: error instanceof Error ? error.message : 'Enrichment failed',
          });
        }
      }

      // Validate output
      let validation = { valid: true, errors: [] as any[] };
      if (this.config.validation?.enabled !== false) {
        validation = await this.schemaManager.validate(
          mapped,
          this.config.targetSchema?.entity || 'exercise'
        );
      }

      results[index] = {
        success: validation.valid || !this.config.validation?.strict,
        data: mapped as any,
        errors: validation.errors,
        enriched,
        __validation: validation,
      };
    }

    // Calculate stats
    const successCount = results.filter((r) => r?.success).length;
    const failedCount = sources.length - successCount;

    return {
      results,
      stats: {
        total: sources.length,
        success: successCount,
        failed: failedCount,
        enriched: enrichedCount,
        apiCalls,
        tokensUsed,
        durationMs: Date.now() - startTime,
      },
      errors,
    };
  }

  /**
   * Deep merge source object into target
   */
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): void {
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge objects
        this.deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else if (sourceValue !== undefined) {
        // Overwrite with source value (including arrays)
        target[key] = sourceValue;
      }
    }
  }
}
