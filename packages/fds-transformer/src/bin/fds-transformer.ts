#!/usr/bin/env node

/**
 * FDS Transformer CLI
 *
 * Transform source data to FDS format with optional AI enrichment.
 * Supports tiered enrichment with checkpoint/resume, cost estimation,
 * and progress tracking.
 */

import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { Transformer, type BatchTransformOptions } from '../core/transformer.js';
import { BatchProcessor } from '../core/batch-processor.js';
import { ConfigLoader } from '../config/config-loader.js';
import { SchemaManager } from '../schemas/schema-manager.js';
import { CheckpointManager, CHECKPOINT_FILENAME } from '../ai/checkpoint-manager.js';
import type { CostEstimate, EnrichmentProgress, TierName } from '../core/types.js';

const program = new Command();

/**
 * Log levels for controlling output verbosity
 */
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

let currentLogLevel: LogLevel = 'info';

/**
 * Log a message at the specified level
 */
function log(level: LogLevel, message: string): void {
  if (LOG_LEVELS[level] <= LOG_LEVELS[currentLogLevel]) {
    switch (level) {
      case 'error':
        p.log.error(message);
        break;
      case 'warn':
        p.log.warn(message);
        break;
      case 'info':
        p.log.info(message);
        break;
      case 'debug':
        p.log.message(pc.dim(`[debug] ${message}`));
        break;
    }
  }
}

/**
 * Format number with thousand separators
 */
function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format cost as USD
 */
function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

/**
 * Display cost estimation table
 */
function displayCostEstimate(estimate: CostEstimate, exerciseCount: number): void {
  const { tiers, total, estimatedTime, disclaimer } = estimate;

  // Count fields per tier from config (simplified count)
  const simpleFields = 6;
  const mediumFields = 5;
  const complexFields = 7;

  console.log('');
  console.log(
    pc.cyan(
      '┌───────────────────────────────────────────────────────────────────────┐'
    )
  );
  console.log(
    pc.cyan(
      '│                         Cost Estimation                               │'
    )
  );
  console.log(
    pc.cyan(
      '├───────────────────────────────────────────────────────────────────────┤'
    )
  );
  console.log(
    pc.cyan('│') +
      ` Input: ${formatNumber(exerciseCount)} exercises`.padEnd(71) +
      pc.cyan('│')
  );
  console.log(
    pc.cyan('│') +
      ` Enrichment fields: 18 (${simpleFields} simple, ${mediumFields} medium, ${complexFields} complex)`.padEnd(
        71
      ) +
      pc.cyan('│')
  );
  console.log(
    pc.cyan('│') +
      ''.padEnd(71) +
      pc.cyan('│')
  );

  // Table header
  console.log(
    pc.cyan('│') +
      ' Tier       │ Model              │ Batch │ Calls  │ Tokens   │ Cost   ' +
      pc.cyan('│')
  );
  console.log(
    pc.cyan('│') +
      ' ───────────┼────────────────────┼───────┼────────┼──────────┼────────' +
      pc.cyan('│')
  );

  // Tier rows
  for (const tierName of ['simple', 'medium', 'complex'] as TierName[]) {
    const tier = tiers[tierName];
    const modelShort = tier.model.replace('anthropic/', '');
    const tokens = `~${(tier.inputTokens / 1000).toFixed(0)}K`;
    const row =
      ` ${tierName.charAt(0).toUpperCase() + tierName.slice(1).padEnd(9)} │ ${modelShort.padEnd(18)} │ ${String(tier.batchSize).padStart(5)} │ ${formatNumber(tier.apiCalls).padStart(6)} │ ${tokens.padStart(8)} │ ${formatCost(tier.cost).padStart(6)} `;
    console.log(pc.cyan('│') + row + pc.cyan('│'));
  }

  // Total row
  console.log(
    pc.cyan('│') +
      ' ───────────┴────────────────────┴───────┴────────┴──────────┴────────' +
      pc.cyan('│')
  );
  const totalTokens = `~${((total.inputTokens + total.outputTokens) / 1000000).toFixed(2)}M`;
  const totalRow = ` TOTAL                                   │ ${formatNumber(total.apiCalls).padStart(6)} │ ${totalTokens.padStart(8)} │ ${formatCost(total.cost).padStart(6)} `;
  console.log(pc.cyan('│') + pc.bold(totalRow) + pc.cyan('│'));
  console.log(
    pc.cyan('│') +
      ''.padEnd(71) +
      pc.cyan('│')
  );
  console.log(
    pc.cyan('│') +
      ` Estimated time: ${estimatedTime.formatted} (at 50 requests/min)`.padEnd(71) +
      pc.cyan('│')
  );
  console.log(
    pc.cyan('│') +
      ''.padEnd(71) +
      pc.cyan('│')
  );
  console.log(
    pc.cyan('│') +
      pc.dim(` * ${disclaimer}`).padEnd(71) +
      pc.cyan('│')
  );
  console.log(
    pc.cyan(
      '└───────────────────────────────────────────────────────────────────────┘'
    )
  );
  console.log('');
}

/**
 * Create a progress callback for enrichment display
 */
function createProgressCallback(): (progress: EnrichmentProgress) => void {
  let lastUpdate = 0;
  const updateInterval = 500; // ms between updates

  return (progress: EnrichmentProgress) => {
    const now = Date.now();
    if (now - lastUpdate < updateInterval) {
      return;
    }
    lastUpdate = now;

    const { exercise, tier, overall } = progress;

    // Clear previous lines and write new progress
    process.stderr.write('\r\x1b[K'); // Clear line

    const tierStatus = getTierStatusDisplay(tier.status);
    const progressBar = createProgressBar(overall.percentage, 20);

    const line = `  ${pc.cyan('●')} Processing ${exercise.current}/${exercise.total}: ${pc.bold(exercise.name)} ${tierStatus} ${progressBar} ${overall.percentage.toFixed(1)}%`;

    process.stderr.write(line);
  };
}

/**
 * Get display string for tier status
 */
function getTierStatusDisplay(
  status: EnrichmentProgress['tier']['status']
): string {
  switch (status) {
    case 'processing':
      return pc.yellow('●');
    case 'complete':
      return pc.green('✓');
    case 'failed':
      return pc.red('✗');
    case 'skipped':
      return pc.dim('○');
    case 'pending':
    default:
      return pc.dim('○');
  }
}

/**
 * Create a simple progress bar
 */
function createProgressBar(percentage: number, width: number): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return pc.cyan('│') + pc.green('█'.repeat(filled)) + pc.dim('░'.repeat(empty)) + pc.cyan('│');
}

program
  .name('fds-transformer')
  .description('Transform source data to FDS (Fitness Data Standard) format')
  .version('0.1.0');

// Transform command
program
  .command('transform')
  .description('Transform source data to FDS format')
  .option('-i, --input <path>', 'Input file path (JSON)')
  .option('-c, --config <path>', 'Mapping configuration file')
  .option('-o, --output <path>', 'Output directory')
  .option('--no-ai', 'Disable AI enrichment (legacy)')
  .option('--api-key <key>', 'API key for enrichment provider')
  .option('--model <model>', 'AI model to use (legacy single-model mode)')
  .option('--version <version>', 'Target FDS schema version', '1.0.0')
  .option('--dry-run', 'Preview transformation without writing files')
  // New tiered enrichment options
  .option('--estimate-cost', 'Show cost estimate without running enrichment')
  .option('--resume', 'Resume from checkpoint')
  .option('--tier <tier>', 'Run only specific tier (simple|medium|complex)')
  .option('--clear-checkpoint', 'Clear existing checkpoint before running')
  .option('--no-checkpoint', 'Disable checkpoint saving')
  .option('--no-enrichment', 'Skip AI enrichment entirely')
  .option(
    '--log-level <level>',
    'Log verbosity (error|warn|info|debug)',
    'info'
  )
  .action(async (options) => {
    // Set log level
    if (
      options.logLevel &&
      ['error', 'warn', 'info', 'debug'].includes(options.logLevel)
    ) {
      currentLogLevel = options.logLevel as LogLevel;
    }

    p.intro(pc.bgCyan(pc.black(' FDS Transformer ')));

    try {
      // Load input
      if (!options.input) {
        p.cancel('Input file is required. Use --input <path>');
        process.exit(1);
      }

      const fs = await import('fs/promises');
      const inputContent = await fs.readFile(options.input, 'utf-8');
      const inputData = JSON.parse(inputContent);
      const items = Array.isArray(inputData) ? inputData : [inputData];

      log('info', `Loaded ${formatNumber(items.length)} items from ${options.input}`);

      // Load config
      let config: import('../core/types.js').MappingConfig;
      if (options.config) {
        config = await ConfigLoader.load(options.config);
        log('info', `Loaded config from ${options.config}`);

        // Check if tiered enrichment is configured
        if (config.enrichment?.tiers && config.enrichment?.fields) {
          log('info', 'Tiered enrichment configuration detected');
        }
      } else {
        log('warn', 'No config file specified. Using default mappings.');
        config = {
          version: '1.0.0',
          targetSchema: { version: options.version },
          mappings: {},
        };
      }

      // Apply CLI overrides for enrichment config
      if (options.apiKey) {
        config.enrichment = { ...config.enrichment, apiKey: options.apiKey };
      }
      if (options.model) {
        config.enrichment = { ...config.enrichment, model: options.model };
      }
      if (options.noAi || options.noEnrichment) {
        config.enrichment = { ...config.enrichment, enabled: false };
      }

      // Disable checkpoint if requested
      if (options.noCheckpoint && config.enrichment) {
        config.enrichment = {
          ...config.enrichment,
          checkpoint: { enabled: false, saveInterval: 0 },
        };
      }

      // Create transformer
      const transformer = new Transformer({ config });
      await transformer.init();

      // Handle --clear-checkpoint
      const outputDir = options.output || config.output?.directory || process.cwd();
      if (options.clearCheckpoint) {
        const checkpointPath = `${outputDir}/${CHECKPOINT_FILENAME}`;
        try {
          await fs.unlink(checkpointPath);
          log('info', 'Cleared existing checkpoint');
        } catch {
          // File may not exist, which is fine
          log('debug', 'No checkpoint file to clear');
        }
      }

      // Handle --estimate-cost
      if (options.estimateCost) {
        const estimate = transformer.estimateCost(items.length);
        if (estimate) {
          displayCostEstimate(estimate, items.length);
          p.outro(pc.cyan('Cost estimation complete'));
        } else {
          p.log.warn(
            'Cost estimation requires tiered enrichment configuration in mapping config.'
          );
          p.log.info(
            'Add "enrichment.tiers" and "enrichment.fields" to your config file.'
          );
        }
        return;
      }

      // Handle --resume - check for existing checkpoint
      if (options.resume) {
        const checkpointManager = new CheckpointManager(outputDir);
        if (checkpointManager.exists()) {
          const checkpoint = checkpointManager.load();
          if (checkpoint) {
            log(
              'info',
              `Found checkpoint: ${formatNumber(checkpoint.completedExercises)}/${formatNumber(checkpoint.totalExercises)} exercises completed`
            );
            log('info', `Resuming from exercise ${checkpoint.completedExercises + 1}...`);
          }
        } else {
          log('warn', 'No checkpoint found. Starting fresh.');
        }
      }

      // Validate --tier option
      const validTiers: TierName[] = ['simple', 'medium', 'complex'];
      if (options.tier && !validTiers.includes(options.tier)) {
        p.cancel(
          `Invalid tier: ${options.tier}. Must be one of: ${validTiers.join(', ')}`
        );
        process.exit(1);
      }

      // Check if we should use batch processing (tiered enrichment)
      const useBatchMode = transformer.isTieredEnrichmentEnabled();

      if (useBatchMode) {
        log('debug', 'Using batch mode with tiered enrichment');

        // Prepare batch options
        const batchOptions: BatchTransformOptions = {
          resume: options.resume,
          tierFilter: options.tier as TierName | undefined,
          outputDirectory: outputDir,
          skipEnrichment: options.noEnrichment || options.noAi,
          onProgress: createProgressCallback(),
        };

        const spinner = p.spinner();
        spinner.start('Processing with tiered enrichment...');

        const result = await transformer.transformAllBatch(items, batchOptions);

        // Clear the progress line
        process.stderr.write('\r\x1b[K');
        spinner.stop('Transformation complete');

        // Summary
        log(
          'info',
          `Processed ${formatNumber(result.stats.total)} items in ${result.stats.durationMs}ms`
        );
        log('info', `  Successful: ${formatNumber(result.stats.success)}`);
        log('info', `  Enriched: ${formatNumber(result.stats.enriched)}`);
        log('info', `  API Calls: ${formatNumber(result.stats.apiCalls)}`);
        if (result.stats.failed > 0) {
          log('warn', `  Failed: ${formatNumber(result.stats.failed)}`);
        }

        // Output
        if (!options.dryRun) {
          await writeOutput(fs, result.results, config, outputDir, options);
        }
      } else {
        log('debug', 'Using legacy single-item processing');

        // Process with progress (legacy mode)
        const spinner = p.spinner();
        spinner.start('Transforming data...');

        const batchProcessor = new BatchProcessor(transformer, {
          onProgress: (progress) => {
            spinner.message(
              `Transforming... ${progress.processed}/${progress.total} (${progress.percentage}%)`
            );
          },
        });

        const result = await batchProcessor.process(items);

        spinner.stop('Transformation complete');

        // Summary
        log(
          'info',
          `Processed ${formatNumber(result.summary.total)} items in ${result.summary.duration}ms`
        );
        log('info', `  Successful: ${formatNumber(result.summary.successful)}`);
        if (result.summary.failed > 0) {
          log('warn', `  Failed: ${formatNumber(result.summary.failed)}`);
        }

        // Output
        if (!options.dryRun) {
          await writeOutput(fs, result.results, config, outputDir, options);
        }
      }

      p.outro(pc.green('Done!'));
    } catch (error) {
      p.cancel(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1);
    }
  });

/**
 * Write output files
 */
async function writeOutput(
  fs: typeof import('fs/promises'),
  results: Array<{ success?: boolean; data?: unknown }>,
  config: import('../core/types.js').MappingConfig,
  outputDir: string,
  options: { output?: string }
): Promise<void> {
  const spinner = p.spinner();
  const dir = options.output || outputDir;

  if (dir) {
    spinner.start('Writing output files...');
    await fs.mkdir(dir, { recursive: true });

    // Check if we should write to a single file
    const singleFile = config.output?.singleFile;
    const singleFileName = config.output?.singleFileName || 'output.json';
    const prettyPrint = config.output?.pretty !== false;

    const successfulResults = results.filter(
      (item) => item.success && item.data
    );

    if (singleFile) {
      // Write all successful results to a single file
      const successfulData = successfulResults.map((item) => item.data);

      const outputPath = `${dir}/${singleFileName}`;
      const content = prettyPrint
        ? JSON.stringify(successfulData, null, 2)
        : JSON.stringify(successfulData);
      await fs.writeFile(outputPath, content);

      spinner.stop(
        `Wrote ${formatNumber(successfulResults.length)} exercises to ${outputPath}`
      );
    } else {
      // Write individual files
      for (const item of successfulResults) {
        if (item.data) {
          const slug =
            (item.data as Record<string, unknown>).canonical &&
            ((item.data as Record<string, unknown>).canonical as Record<string, unknown>)?.slug
              ? String(
                  ((item.data as Record<string, unknown>).canonical as Record<string, unknown>)
                    .slug
                )
              : 'unknown';
          const outputPath = `${dir}/${slug}.json`;
          const content = prettyPrint
            ? JSON.stringify(item.data, null, 2)
            : JSON.stringify(item.data);
          await fs.writeFile(outputPath, content);
        }
      }

      spinner.stop(`Wrote ${formatNumber(successfulResults.length)} files to ${dir}`);
    }
  } else {
    // No output directory - print summary to stdout
    log(
      'info',
      'No output directory specified. Use --output <path> or set output.directory in config.'
    );
  }
}

// Validate command
program
  .command('validate')
  .description('Validate FDS data against schema')
  .option('-i, --input <path>', 'Input file to validate')
  .option(
    '-e, --entity <type>',
    'Entity type (exercise, equipment, muscle)',
    'exercise'
  )
  .option('--version <version>', 'FDS schema version', '1.0.0')
  .action(async (options) => {
    p.intro(pc.bgCyan(pc.black(' FDS Validator ')));

    try {
      if (!options.input) {
        p.cancel('Input file is required. Use --input <path>');
        process.exit(1);
      }

      const fs = await import('fs/promises');
      const content = await fs.readFile(options.input, 'utf-8');
      const data = JSON.parse(content);

      const schemaManager = new SchemaManager();
      await schemaManager.loadVersion(options.version);

      const result = await schemaManager.validate(
        data,
        options.entity,
        options.version
      );

      if (result.valid) {
        p.log.success('Validation passed!');
      } else {
        p.log.error('Validation failed:');
        for (const error of result.errors) {
          p.log.warn(`  ${error.field}: ${error.message}`);
        }
      }

      p.outro(result.valid ? pc.green('Valid!') : pc.red('Invalid'));
      process.exit(result.valid ? 0 : 1);
    } catch (error) {
      p.cancel(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1);
    }
  });

// Init command (wizard)
program
  .command('init')
  .description('Create a new mapping configuration interactively')
  .option('-s, --sample <path>', 'Sample source file to analyze')
  .option('-o, --output <path>', 'Output path for config', './mapping.json')
  .action(async (options) => {
    p.intro(pc.bgCyan(pc.black(' FDS Transformer Setup ')));

    // TODO(init-wizard): Implement interactive mapping configuration wizard
    // Features to implement:
    // 1. Analyze sample source file (--sample option) to detect field structure
    // 2. Present detected fields and suggest mappings to FDS schema
    // 3. Allow user to select which fields to map
    // 4. Configure registry sources (muscles, equipment, etc.)
    // 5. Configure AI enrichment tiers
    // 6. Generate mapping.json output file
    // See: docs/tools/transformer/cli-reference.md - "Note: The interactive wizard is under development"
    
    p.log.info('Interactive setup wizard is under development.');
    
    if (options.sample) {
      p.log.info(`Sample file provided: ${options.sample}`);
      p.log.info('Future version will analyze this file to suggest mappings.');
    }
    
    p.log.info('');
    p.log.info('For now, create your mapping.json manually using these resources:');
    p.log.message('  - Documentation: https://spec.vitness.me/docs/tools/transformer/configuration');
    p.log.message(`  - Output location: ${options.output}`);

    p.outro('See documentation for manual configuration');
  });

// Schemas command
program
  .command('schemas')
  .description('Manage FDS schemas')
  .argument('<action>', 'Action: list, update')
  .action(async (action) => {
    p.intro(pc.bgCyan(pc.black(' FDS Schemas ')));

    const schemaManager = new SchemaManager();

    switch (action) {
      case 'list':
        const versions = await schemaManager.listVersions();
        p.log.info('Available schema versions:');
        for (const v of versions) {
          p.log.message(`  ${v.version} ${v.bundled ? '(bundled)' : ''}`);
        }
        break;

      case 'update':
        p.log.info('Updating schema cache...');
        await schemaManager.updateCache();
        p.log.success('Cache updated');
        break;

      default:
        p.log.error(`Unknown action: ${action}`);
    }

    p.outro('Done');
  });

// Interactive mode (no command)
program.action(async () => {
  p.intro(pc.bgCyan(pc.black(' FDS Transformer ')));

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'transform', label: 'Transform data to FDS format' },
      { value: 'validate', label: 'Validate existing FDS data' },
      { value: 'init', label: 'Create new mapping configuration' },
      { value: 'schemas', label: 'Manage FDS schemas' },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel('Cancelled');
    process.exit(0);
  }

  // Re-run with the selected command
  const args = [process.argv[0], process.argv[1], action as string];
  process.argv = args;
  await program.parseAsync(args);
});

program.parse();
