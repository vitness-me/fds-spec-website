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
  FieldProvenance,
  RecordProvenance,
  ValidationError,
} from './types.js';
import { MappingEngine } from './mapping-engine.js';
import { RegistryManager } from '../registries/registry-manager.js';
import { SchemaManager } from '../schemas/schema-manager.js';
import { DEFAULT_SCHEMA_VERSION } from '../schemas/versions.js';
import {
  EnrichmentEngine,
  isEmptyValue,
  needsEnrichment,
  type ExerciseInput,
  type BatchEnrichmentOptions,
  type BatchEnrichmentResult,
} from '../ai/enrichment-engine.js';
import { ConfigLoader } from '../config/config-loader.js';
import { getMappingPathValue, isBeneath } from './paths.js';

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
      const { target: mapped, provenance } = await this.mappingEngine.applyWithProvenance(
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
        this.mergeEnrichment(mapped, provenance, enrichmentResult.data, enrichmentResult.provenance);
        enriched = Object.keys(enrichmentResult.data || {});
      }

      return await this.finishResult(mapped, provenance, enriched);
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
      provenance: RecordProvenance;
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
        const { target: mapped, provenance } = await this.mappingEngine.applyWithProvenance(
          source,
          this.config.mappings,
          context
        );
        mappedExercises.push({ index: i, source, mapped, provenance, context });
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
      // Each configured field with the `when` its mapping sets for enrichment
      const enrichedFields = Object.keys(this.config.enrichment?.fields ?? {}).map((path) => {
        const mapping = this.config.mappings?.[path];
        return { path, when: typeof mapping === 'object' ? mapping.enrichment?.when : undefined };
      });

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
          fieldsToEnrich: enrichedFields
            .filter(({ path, when }) => needsEnrichment(mapped, path, when))
            .map(({ path }) => path),
        };
      });

      // Get schema $defs for validation context
      const schema = this.schemaManager.getSchema(
        this.config.targetSchema?.entity || 'exercise',
        this.config.targetSchema?.version || DEFAULT_SCHEMA_VERSION
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
    for (const { index, mapped, provenance, source } of mappedExercises) {
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
          this.mergeEnrichment(
            mapped,
            provenance,
            enrichmentData,
            enrichmentResults.provenance.get(exerciseId)
          );
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
            this.mergeEnrichment(mapped, provenance, enrichmentResult.data, enrichmentResult.provenance);
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

      results[index] = await this.finishResult(mapped, provenance, enriched);
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
   * Validate a transformed record and assemble its result. A record whose
   * `validation.rejectDefaults` path holds a mapping default fails, whatever
   * `validation.enabled` and `strict` say.
   */
  private async finishResult(
    mapped: Record<string, unknown>,
    provenance: RecordProvenance,
    enriched: string[]
  ): Promise<TransformResult> {
    let validation = { valid: true, errors: [] as ValidationError[] };
    if (this.config.validation?.enabled !== false) {
      validation = await this.schemaManager.validate(
        mapped,
        this.config.targetSchema?.entity || 'exercise'
      );
    }

    const rejected: ValidationError[] = (this.config.validation?.rejectDefaults ?? [])
      .filter((path) => this.holdsDefault(mapped, provenance, path))
      .map((path) => ({
        field: path,
        message: `${path} holds the mapping default, which validation.rejectDefaults does not allow`,
        constraint: 'rejectDefaults',
      }));

    return {
      success: (validation.valid || !this.config.validation?.strict) && rejected.length === 0,
      data: mapped as any,
      provenance,
      errors: [...validation.errors, ...rejected],
      enriched,
      __validation: validation,
    };
  }

  /**
   * Whether a mapping default supplies the value at `path`: its own entry, the
   * nearest entry above it when it has none, or any entry beneath it
   */
  private holdsDefault(
    mapped: Record<string, unknown>,
    provenance: RecordProvenance,
    path: string
  ): boolean {
    const paths = Object.keys(provenance);
    if (paths.some((p) => isBeneath(p, path) && provenance[p].origin === 'default')) {
      return true;
    }
    const nearest = paths
      .filter((p) => p === path || isBeneath(path, p))
      .sort((a, b) => b.length - a.length)[0];
    return (
      nearest !== undefined &&
      provenance[nearest].origin === 'default' &&
      getMappingPathValue(mapped, path) !== undefined
    );
  }

  /**
   * Merge enrichment into the mapped record, and record the model as the
   * origin of each path where its value landed
   */
  private mergeEnrichment(
    mapped: Record<string, unknown>,
    provenance: RecordProvenance,
    data: Record<string, unknown> | undefined,
    enrichmentProvenance: Record<string, FieldProvenance> | undefined
  ): void {
    if (!data) return;
    const filled = this.deepMerge(mapped, data);
    for (const [path, origin] of Object.entries(enrichmentProvenance ?? {})) {
      if (filled.some((f) => path === f || isBeneath(path, f))) {
        provenance[path] = origin;
      }
    }
  }

  /**
   * Deep merge enrichment into the mapped target, filling gaps only: a value
   * lands only where the target holds nothing, so a mapped value is never
   * replaced. Returns the paths it filled.
   */
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
    prefix = ''
  ): string[] {
    const filled: string[] = [];
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      const path = `${prefix}${key}`;

      if (isEmptyValue(targetValue)) {
        if (sourceValue !== undefined) {
          target[key] = sourceValue;
          filled.push(path);
        }
      } else if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge objects
        filled.push(
          ...this.deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>,
            `${path}.`
          )
        );
      }
    }
    return filled;
  }
}
