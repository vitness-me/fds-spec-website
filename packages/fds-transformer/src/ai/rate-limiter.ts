/**
 * Rate Limiter - Intelligent rate limiting with automatic backoff
 *
 * Handles API rate limits by:
 * - Tracking requests per minute
 * - Waiting when approaching limits
 * - Implementing exponential/linear/fixed backoff on 429 responses
 * - Resetting backoff on successful requests
 */

import type { RateLimitConfig } from '../core/types.js';

/**
 * Rate limiter state for external monitoring
 */
export interface RateLimiterState {
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
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  requestsPerMinute: 50,
  backoffStrategy: 'exponential',
  initialBackoffMs: 1000,
  maxBackoffMs: 60000,
};

/**
 * Rate limiter for API calls with automatic backoff
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private requestTimestamps: number[] = [];
  private consecutiveHits: number = 0;
  private currentBackoffMs: number = 0;
  private backoffUntil: number = 0;
  private lastRequestTime: number | null = null;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
  }

  /**
   * Acquire permission to make a request
   * Waits if necessary to stay within rate limits
   * @returns Promise that resolves when it's safe to make a request
   */
  async acquire(): Promise<void> {
    const now = Date.now();

    // Check if we're in backoff state
    if (this.backoffUntil > now) {
      const waitTime = this.backoffUntil - now;
      await this.sleep(waitTime);
    }

    // Clean old timestamps (older than 1 minute)
    this.cleanOldTimestamps();

    // Check if we're at the rate limit
    if (this.requestTimestamps.length >= this.config.requestsPerMinute) {
      // Calculate wait time until oldest request falls out of window
      const oldestTimestamp = this.requestTimestamps[0];
      const windowEnd = oldestTimestamp + 60000; // 1 minute window
      const waitTime = Math.max(0, windowEnd - Date.now());

      if (waitTime > 0) {
        await this.sleep(waitTime);
        // Clean again after waiting
        this.cleanOldTimestamps();
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
    this.lastRequestTime = Date.now();
  }

  /**
   * Record a rate limit hit (429 response)
   * Increases backoff according to strategy
   */
  recordRateLimitHit(): void {
    this.consecutiveHits++;

    // Calculate new backoff based on strategy
    this.currentBackoffMs = this.calculateBackoff();

    // Set backoff deadline
    this.backoffUntil = Date.now() + this.currentBackoffMs;
  }

  /**
   * Record a successful request
   * Resets backoff counter
   */
  recordSuccess(): void {
    this.consecutiveHits = 0;
    this.currentBackoffMs = 0;
    this.backoffUntil = 0;
  }

  /**
   * Get current rate limiter state for logging/monitoring
   */
  getState(): RateLimiterState {
    const now = Date.now();
    this.cleanOldTimestamps();

    // Calculate wait time
    let waitTimeMs = 0;

    // Check backoff wait time
    if (this.backoffUntil > now) {
      waitTimeMs = this.backoffUntil - now;
    }
    // Check rate limit wait time
    else if (this.requestTimestamps.length >= this.config.requestsPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      const windowEnd = oldestTimestamp + 60000;
      waitTimeMs = Math.max(0, windowEnd - now);
    }

    return {
      requestsInWindow: this.requestTimestamps.length,
      requestsPerMinute: this.config.requestsPerMinute,
      currentBackoffMs: this.currentBackoffMs,
      consecutiveHits: this.consecutiveHits,
      isBackingOff: this.backoffUntil > now,
      lastRequestTime: this.lastRequestTime,
      waitTimeMs,
    };
  }

  /**
   * Get the configured requests per minute
   */
  getRequestsPerMinute(): number {
    return this.config.requestsPerMinute;
  }

  /**
   * Check if currently in backoff state
   */
  isInBackoff(): boolean {
    return this.backoffUntil > Date.now();
  }

  /**
   * Get time remaining in backoff (0 if not in backoff)
   */
  getBackoffRemaining(): number {
    return Math.max(0, this.backoffUntil - Date.now());
  }

  /**
   * Reset the rate limiter state
   */
  reset(): void {
    this.requestTimestamps = [];
    this.consecutiveHits = 0;
    this.currentBackoffMs = 0;
    this.backoffUntil = 0;
    this.lastRequestTime = null;
  }

  /**
   * Calculate backoff based on strategy
   */
  private calculateBackoff(): number {
    const { backoffStrategy, initialBackoffMs, maxBackoffMs } = this.config;

    let backoff: number;

    switch (backoffStrategy) {
      case 'exponential':
        // Exponential backoff: initial * 2^(hits-1)
        backoff = initialBackoffMs * Math.pow(2, this.consecutiveHits - 1);
        break;

      case 'linear':
        // Linear backoff: initial * hits
        backoff = initialBackoffMs * this.consecutiveHits;
        break;

      case 'fixed':
        // Fixed backoff: always use initial
        backoff = initialBackoffMs;
        break;

      default:
        backoff = initialBackoffMs;
    }

    // Cap at maximum
    return Math.min(backoff, maxBackoffMs);
  }

  /**
   * Remove timestamps older than 1 minute
   */
  private cleanOldTimestamps(): void {
    const cutoff = Date.now() - 60000; // 1 minute ago
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > cutoff);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
