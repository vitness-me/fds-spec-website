/**
 * Checkpoint Manager - Progress saving and resumption for enrichment
 *
 * Handles:
 * - Saving partial enrichment progress to disk
 * - Resuming from checkpoint on restart
 * - Detecting config changes via hash
 * - Managing log file paths
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type { CheckpointConfig, CheckpointData, TierName } from '../core/types.js';

/**
 * Checkpoint file name
 */
export const CHECKPOINT_FILENAME = '.fds-checkpoint.json';

/**
 * Enrichment log file name
 */
export const ENRICHMENT_LOG_FILENAME = 'enrichment.log';

/**
 * Current checkpoint format version
 */
export const CHECKPOINT_VERSION = '1.0.0';

/**
 * Default checkpoint configuration
 */
export const DEFAULT_CHECKPOINT_CONFIG: CheckpointConfig = {
  enabled: true,
  saveInterval: 10,
};

/**
 * Options for initializing a new checkpoint
 */
export interface CheckpointInitOptions {
  /** Path to input file being processed */
  inputFile: string;
  /** Total number of exercises to process */
  totalExercises: number;
  /** Configuration object to hash for change detection */
  config: unknown;
}

/**
 * Options for updating a checkpoint
 */
export interface CheckpointUpdateOptions {
  /** Exercise ID that was completed */
  exerciseId: string;
  /** Whether the exercise succeeded or failed */
  success: boolean;
  /** Current tier being processed */
  currentTier: TierName;
  /** Partial results for this exercise (tier -> field -> value) */
  results?: Record<string, Record<string, unknown>>;
}

/**
 * Validation result for checkpoint
 */
export interface CheckpointValidationResult {
  /** Whether checkpoint is valid */
  valid: boolean;
  /** Reason for invalidity (if any) */
  reason?: string;
  /** Whether config hash matches */
  configMatches?: boolean;
  /** Expected config hash */
  expectedHash?: string;
  /** Actual config hash in checkpoint */
  actualHash?: string;
}

/**
 * Checkpoint Manager for resumable enrichment
 */
export class CheckpointManager {
  private config: CheckpointConfig;
  private checkpointPath: string;
  private logFilePath: string;
  private data: CheckpointData | null = null;
  private updatesSinceLastSave: number = 0;

  constructor(outputDirectory: string, config: Partial<CheckpointConfig> = {}) {
    this.config = { ...DEFAULT_CHECKPOINT_CONFIG, ...config };
    this.checkpointPath = join(outputDirectory, CHECKPOINT_FILENAME);
    this.logFilePath = join(outputDirectory, ENRICHMENT_LOG_FILENAME);
  }

  /**
   * Check if a checkpoint file exists
   */
  exists(): boolean {
    return existsSync(this.checkpointPath);
  }

  /**
   * Load existing checkpoint from file
   * @returns Checkpoint data if found and valid, null otherwise
   */
  load(): CheckpointData | null {
    if (!this.exists()) {
      return null;
    }

    try {
      const content = readFileSync(this.checkpointPath, 'utf-8');
      const data = JSON.parse(content) as CheckpointData;

      // Basic structure validation
      if (!data.version || !data.configHash || !data.completedIds) {
        return null;
      }

      this.data = data;
      return data;
    } catch {
      // File is corrupted or invalid JSON
      return null;
    }
  }

  /**
   * Initialize a new checkpoint
   * @param options - Initialization options
   * @returns The new checkpoint data
   */
  initialize(options: CheckpointInitOptions): CheckpointData {
    const now = new Date().toISOString();
    const configHash = this.hashConfig(options.config);

    this.data = {
      version: CHECKPOINT_VERSION,
      configHash,
      startedAt: now,
      lastUpdatedAt: now,
      inputFile: options.inputFile,
      totalExercises: options.totalExercises,
      completedExercises: 0,
      completedIds: [],
      failedIds: [],
      currentTier: 'simple',
      results: {},
    };

    // Ensure output directory exists
    this.ensureDirectory();

    // Save immediately
    this.forceSave();

    return this.data;
  }

  /**
   * Validate checkpoint against current config
   * @param currentConfig - Current configuration to compare hash
   * @returns Validation result
   */
  validate(currentConfig: unknown): CheckpointValidationResult {
    if (!this.data) {
      return { valid: false, reason: 'No checkpoint loaded' };
    }

    // Check version compatibility
    if (this.data.version !== CHECKPOINT_VERSION) {
      return {
        valid: false,
        reason: `Checkpoint version mismatch: expected ${CHECKPOINT_VERSION}, got ${this.data.version}`,
      };
    }

    // Check config hash
    const currentHash = this.hashConfig(currentConfig);
    const configMatches = this.data.configHash === currentHash;

    if (!configMatches) {
      return {
        valid: false,
        reason: 'Configuration has changed since checkpoint was created',
        configMatches: false,
        expectedHash: currentHash,
        actualHash: this.data.configHash,
      };
    }

    return { valid: true, configMatches: true };
  }

  /**
   * Update checkpoint with exercise completion
   * @param options - Update options
   */
  update(options: CheckpointUpdateOptions): void {
    if (!this.data) {
      throw new Error('Checkpoint not initialized. Call initialize() or load() first.');
    }

    const { exerciseId, success, currentTier, results } = options;

    // Update tier
    this.data.currentTier = currentTier;
    this.data.lastUpdatedAt = new Date().toISOString();

    // Track completion/failure
    if (success) {
      if (!this.data.completedIds.includes(exerciseId)) {
        this.data.completedIds.push(exerciseId);
        this.data.completedExercises = this.data.completedIds.length;
      }
      // Remove from failed if it was there (retry succeeded)
      const failedIndex = this.data.failedIds.indexOf(exerciseId);
      if (failedIndex > -1) {
        this.data.failedIds.splice(failedIndex, 1);
      }
    } else {
      if (!this.data.failedIds.includes(exerciseId)) {
        this.data.failedIds.push(exerciseId);
      }
    }

    // Store partial results
    if (results) {
      if (!this.data.results[exerciseId]) {
        this.data.results[exerciseId] = {};
      }
      // Merge tier results
      for (const [tier, fields] of Object.entries(results)) {
        if (!this.data.results[exerciseId][tier]) {
          this.data.results[exerciseId][tier] = {};
        }
        Object.assign(this.data.results[exerciseId][tier], fields);
      }
    }

    this.updatesSinceLastSave++;

    // Auto-save based on interval
    if (this.updatesSinceLastSave >= this.config.saveInterval) {
      this.save();
    }
  }

  /**
   * Save checkpoint to file
   * Only saves if there are pending updates
   * @returns Whether a save was performed
   */
  save(): boolean {
    if (!this.data || this.updatesSinceLastSave === 0) {
      return false;
    }

    this.forceSave();
    return true;
  }

  /**
   * Force save checkpoint to file regardless of pending updates
   */
  forceSave(): void {
    if (!this.data) {
      return;
    }

    this.ensureDirectory();

    // Update timestamp
    this.data.lastUpdatedAt = new Date().toISOString();

    // Write atomically (write to temp, then rename)
    const content = JSON.stringify(this.data, null, 2);
    const tempPath = `${this.checkpointPath}.tmp.${process.pid}.${Date.now()}`;
    writeFileSync(tempPath, content, 'utf-8');
    renameSync(tempPath, this.checkpointPath);

    this.updatesSinceLastSave = 0;
  }

  /**
   * Clear checkpoint file (call on successful completion)
   */
  clear(): void {
    if (existsSync(this.checkpointPath)) {
      unlinkSync(this.checkpointPath);
    }
    this.data = null;
    this.updatesSinceLastSave = 0;
  }

  /**
   * Get list of completed exercise IDs (for skipping on resume)
   */
  getCompletedIds(): string[] {
    return this.data?.completedIds ?? [];
  }

  /**
   * Get list of failed exercise IDs
   */
  getFailedIds(): string[] {
    return this.data?.failedIds ?? [];
  }

  /**
   * Get partial results for an exercise
   */
  getResults(exerciseId: string): Record<string, Record<string, unknown>> | undefined {
    return this.data?.results[exerciseId];
  }

  /**
   * Get all partial results
   */
  getAllResults(): Record<string, Record<string, Record<string, unknown>>> {
    return this.data?.results ?? {};
  }

  /**
   * Get path for enrichment log file
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }

  /**
   * Get path to checkpoint file
   */
  getCheckpointPath(): string {
    return this.checkpointPath;
  }

  /**
   * Get current checkpoint data (readonly copy)
   */
  getData(): CheckpointData | null {
    if (!this.data) {
      return null;
    }
    return { ...this.data };
  }

  /**
   * Get current tier being processed
   */
  getCurrentTier(): TierName | null {
    return this.data?.currentTier ?? null;
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    if (!this.data || this.data.totalExercises === 0) {
      return 0;
    }
    return (this.data.completedExercises / this.data.totalExercises) * 100;
  }

  /**
   * Check if checkpointing is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get save interval
   */
  getSaveInterval(): number {
    return this.config.saveInterval;
  }

  /**
   * Hash configuration for change detection
   */
  private hashConfig(config: unknown): string {
    const json = this.stableStringify(config);
    return createHash('sha256').update(json).digest('hex').substring(0, 16);
  }

  private stableStringify(value: unknown): string {
    const seen = new WeakSet<object>();

    const stringify = (input: unknown): string | undefined => {
      if (input === null) {
        return 'null';
      }

      const inputType = typeof input;

      if (inputType === 'number') {
        return Number.isFinite(input) ? String(input) : 'null';
      }

      if (inputType === 'string') {
        return JSON.stringify(input);
      }

      if (inputType === 'boolean') {
        return input ? 'true' : 'false';
      }

      if (inputType === 'bigint') {
        return JSON.stringify(String(input));
      }

      if (inputType === 'undefined' || inputType === 'function' || inputType === 'symbol') {
        return undefined;
      }

      if (inputType !== 'object') {
        return JSON.stringify(input);
      }

      const objectValue = input as Record<string, unknown>;

      if (typeof objectValue.toJSON === 'function') {
        return stringify(objectValue.toJSON());
      }

      if (Array.isArray(objectValue)) {
        const items = objectValue.map((item) => stringify(item) ?? 'null');
        return `[${items.join(',')} ]`.replace(', ]', ']');
      }

      if (seen.has(objectValue)) {
        throw new TypeError('Cannot stringify circular structure');
      }

      seen.add(objectValue);

      const keys = Object.keys(objectValue).sort();
      const entries: string[] = [];

      for (const key of keys) {
        const valueString = stringify(objectValue[key]);
        if (valueString !== undefined) {
          entries.push(`${JSON.stringify(key)}:${valueString}`);
        }
      }

      seen.delete(objectValue);

      return `{${entries.join(',')}}`;
    };

    return stringify(value) ?? 'null';
  }

  /**
   * Ensure output directory exists
   */
  private ensureDirectory(): void {
    const dir = dirname(this.checkpointPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}
