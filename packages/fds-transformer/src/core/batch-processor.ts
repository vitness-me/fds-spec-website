/**
 * Batch Processor - handles streaming and parallel processing
 */

import type { TransformResult } from './types.js';
import { Transformer } from './transformer.js';

export interface BatchOptions {
  concurrency?: number;
  chunkSize?: number;
  onProgress?: (progress: BatchProgress) => void;
  onError?: (error: Error, item: Record<string, unknown>, index: number) => void;
}

export interface BatchProgress {
  processed: number;
  total: number;
  successful: number;
  failed: number;
  percentage: number;
}

export interface BatchResult {
  results: TransformResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}

export class BatchProcessor {
  private transformer: Transformer;
  private options: Required<BatchOptions>;

  constructor(transformer: Transformer, options: BatchOptions = {}) {
    this.transformer = transformer;
    this.options = {
      concurrency: options.concurrency ?? 5,
      chunkSize: options.chunkSize ?? 10,
      onProgress: options.onProgress ?? (() => {}),
      onError: options.onError ?? (() => {}),
    };
  }

  /**
   * Process items in parallel batches
   */
  async process(items: Record<string, unknown>[]): Promise<BatchResult> {
    const startTime = Date.now();
    const results: TransformResult[] = [];
    let successful = 0;
    let failed = 0;

    // Process in chunks to manage memory
    for (let i = 0; i < items.length; i += this.options.chunkSize) {
      const chunk = items.slice(i, i + this.options.chunkSize);
      const chunkResults = await this.processChunk(chunk, i);

      for (const result of chunkResults) {
        results.push(result);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      }

      // Report progress
      this.options.onProgress({
        processed: Math.min(i + this.options.chunkSize, items.length),
        total: items.length,
        successful,
        failed,
        percentage: Math.round(
          (Math.min(i + this.options.chunkSize, items.length) / items.length) * 100
        ),
      });
    }

    return {
      results,
      summary: {
        total: items.length,
        successful,
        failed,
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * Process a chunk of items with concurrency control
   */
  private async processChunk(
    chunk: Record<string, unknown>[],
    startIndex: number
  ): Promise<TransformResult[]> {
    const results: TransformResult[] = new Array(chunk.length);

    // Process with concurrency limit using a semaphore pattern
    const executing = new Set<Promise<void>>();

    for (let i = 0; i < chunk.length; i++) {
      const item = chunk[i];
      const globalIndex = startIndex + i;

      const task = (async () => {
        try {
          const result = await this.transformer.transform(item);
          results[i] = result;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          this.options.onError(err, item, globalIndex);
          results[i] = {
            success: false,
            errors: [{ field: '_batch', message: err.message }],
          };
        }
      })();

      // Wrap task to remove itself from executing set when done
      const wrappedTask = task.finally(() => {
        executing.delete(wrappedTask);
      });

      executing.add(wrappedTask);

      // Limit concurrency - wait for one to complete if at limit
      if (executing.size >= this.options.concurrency) {
        await Promise.race(executing);
      }
    }

    // Wait for remaining tasks
    await Promise.all(executing);

    return results;
  }

  /**
   * Process items as an async stream
   */
  async *processStream(
    items: AsyncIterable<Record<string, unknown>> | Iterable<Record<string, unknown>>
  ): AsyncGenerator<TransformResult> {
    let index = 0;

    for await (const item of items) {
      try {
        const result = await this.transformer.transform(item);
        yield result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.options.onError(err, item, index);
        yield {
          success: false,
          errors: [{ field: '_batch', message: err.message }],
        };
      }
      index++;
    }
  }
}
