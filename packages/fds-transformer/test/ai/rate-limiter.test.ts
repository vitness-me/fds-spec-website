/**
 * Rate Limiter Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter, DEFAULT_RATE_LIMIT_CONFIG } from '../../src/ai/rate-limiter.js';
import type { RateLimitConfig } from '../../src/core/types.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should use default config when none provided', () => {
      const limiter = new RateLimiter();
      expect(limiter.getRequestsPerMinute()).toBe(DEFAULT_RATE_LIMIT_CONFIG.requestsPerMinute);
    });

    it('should merge provided config with defaults', () => {
      const limiter = new RateLimiter({ requestsPerMinute: 100 });
      expect(limiter.getRequestsPerMinute()).toBe(100);
    });

    it('should accept full config', () => {
      const config: RateLimitConfig = {
        requestsPerMinute: 30,
        backoffStrategy: 'linear',
        initialBackoffMs: 2000,
        maxBackoffMs: 30000,
      };
      const limiter = new RateLimiter(config);
      expect(limiter.getRequestsPerMinute()).toBe(30);
    });
  });

  describe('acquire()', () => {
    it('should resolve immediately when under rate limit', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 10 });
      
      const start = Date.now();
      await limiter.acquire();
      const elapsed = Date.now() - start;
      
      // Should be nearly instant (allowing for small timing variance)
      expect(elapsed).toBeLessThan(10);
    });

    it('should track requests in window', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 5 });
      
      // Make 3 requests
      await limiter.acquire();
      await limiter.acquire();
      await limiter.acquire();
      
      const state = limiter.getState();
      expect(state.requestsInWindow).toBe(3);
    });

    it('should wait when at rate limit', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 2 });
      
      // Make 2 requests (at the limit)
      await limiter.acquire();
      await limiter.acquire();
      
      // Third request should wait
      const acquirePromise = limiter.acquire();
      
      // Advance time by 30 seconds - not enough
      vi.advanceTimersByTime(30000);
      
      // Still waiting - need to advance more
      vi.advanceTimersByTime(31000); // Total 61s, oldest request should expire
      
      await acquirePromise;
      
      const state = limiter.getState();
      expect(state.requestsInWindow).toBe(1); // Only the new request remains in window
    });

    it('should respect backoff state', async () => {
      const limiter = new RateLimiter({ 
        requestsPerMinute: 100,
        backoffStrategy: 'fixed',
        initialBackoffMs: 5000,
      });
      
      // Record a rate limit hit
      limiter.recordRateLimitHit();
      
      // Try to acquire - should wait
      const acquirePromise = limiter.acquire();
      
      // Advance time by 3 seconds - not enough
      vi.advanceTimersByTime(3000);
      
      // Advance remaining time
      vi.advanceTimersByTime(2000);
      
      await acquirePromise;
      
      // Should be after backoff now
      expect(limiter.isInBackoff()).toBe(false);
    });
  });

  describe('recordRateLimitHit()', () => {
    it('should track consecutive hits', () => {
      const limiter = new RateLimiter();
      
      limiter.recordRateLimitHit();
      expect(limiter.getState().consecutiveHits).toBe(1);
      
      limiter.recordRateLimitHit();
      expect(limiter.getState().consecutiveHits).toBe(2);
      
      limiter.recordRateLimitHit();
      expect(limiter.getState().consecutiveHits).toBe(3);
    });

    it('should put limiter in backoff state', () => {
      const limiter = new RateLimiter();
      
      limiter.recordRateLimitHit();
      
      expect(limiter.isInBackoff()).toBe(true);
    });

    describe('exponential backoff', () => {
      it('should calculate exponential backoff correctly', () => {
        const limiter = new RateLimiter({
          backoffStrategy: 'exponential',
          initialBackoffMs: 1000,
          maxBackoffMs: 60000,
        });
        
        // First hit: 1000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(1000);
        
        // Second hit: 2000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(2000);
        
        // Third hit: 4000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(4000);
        
        // Fourth hit: 8000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(8000);
      });

      it('should cap at maxBackoffMs', () => {
        const limiter = new RateLimiter({
          backoffStrategy: 'exponential',
          initialBackoffMs: 10000,
          maxBackoffMs: 30000,
        });
        
        // First hit: 10000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(10000);
        
        // Second hit: 20000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(20000);
        
        // Third hit: would be 40000ms but capped at 30000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(30000);
        
        // Fourth hit: still capped
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(30000);
      });
    });

    describe('linear backoff', () => {
      it('should calculate linear backoff correctly', () => {
        const limiter = new RateLimiter({
          backoffStrategy: 'linear',
          initialBackoffMs: 1000,
          maxBackoffMs: 60000,
        });
        
        // First hit: 1000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(1000);
        
        // Second hit: 2000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(2000);
        
        // Third hit: 3000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(3000);
        
        // Fourth hit: 4000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(4000);
      });

      it('should cap at maxBackoffMs', () => {
        const limiter = new RateLimiter({
          backoffStrategy: 'linear',
          initialBackoffMs: 5000,
          maxBackoffMs: 15000,
        });
        
        // First hit: 5000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(5000);
        
        // Second hit: 10000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(10000);
        
        // Third hit: 15000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(15000);
        
        // Fourth hit: would be 20000ms but capped
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(15000);
      });
    });

    describe('fixed backoff', () => {
      it('should always use initial backoff', () => {
        const limiter = new RateLimiter({
          backoffStrategy: 'fixed',
          initialBackoffMs: 5000,
          maxBackoffMs: 60000,
        });
        
        // First hit: 5000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(5000);
        
        // Second hit: still 5000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(5000);
        
        // Third hit: still 5000ms
        limiter.recordRateLimitHit();
        expect(limiter.getState().currentBackoffMs).toBe(5000);
      });
    });
  });

  describe('recordSuccess()', () => {
    it('should reset consecutive hits', () => {
      const limiter = new RateLimiter();
      
      limiter.recordRateLimitHit();
      limiter.recordRateLimitHit();
      expect(limiter.getState().consecutiveHits).toBe(2);
      
      limiter.recordSuccess();
      expect(limiter.getState().consecutiveHits).toBe(0);
    });

    it('should reset backoff state', () => {
      const limiter = new RateLimiter();
      
      limiter.recordRateLimitHit();
      expect(limiter.isInBackoff()).toBe(true);
      
      limiter.recordSuccess();
      expect(limiter.isInBackoff()).toBe(false);
      expect(limiter.getState().currentBackoffMs).toBe(0);
    });
  });

  describe('getState()', () => {
    it('should return complete state', () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60 });
      
      const state = limiter.getState();
      
      expect(state).toHaveProperty('requestsInWindow');
      expect(state).toHaveProperty('requestsPerMinute');
      expect(state).toHaveProperty('currentBackoffMs');
      expect(state).toHaveProperty('consecutiveHits');
      expect(state).toHaveProperty('isBackingOff');
      expect(state).toHaveProperty('lastRequestTime');
      expect(state).toHaveProperty('waitTimeMs');
    });

    it('should show correct initial state', () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60 });
      
      const state = limiter.getState();
      
      expect(state.requestsInWindow).toBe(0);
      expect(state.requestsPerMinute).toBe(60);
      expect(state.currentBackoffMs).toBe(0);
      expect(state.consecutiveHits).toBe(0);
      expect(state.isBackingOff).toBe(false);
      expect(state.lastRequestTime).toBeNull();
      expect(state.waitTimeMs).toBe(0);
    });

    it('should show wait time when in backoff', () => {
      const limiter = new RateLimiter({
        backoffStrategy: 'fixed',
        initialBackoffMs: 10000,
      });
      
      limiter.recordRateLimitHit();
      
      const state = limiter.getState();
      expect(state.isBackingOff).toBe(true);
      expect(state.waitTimeMs).toBeGreaterThan(0);
      expect(state.waitTimeMs).toBeLessThanOrEqual(10000);
    });

    it('should show wait time when at rate limit', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 2 });
      
      await limiter.acquire();
      await limiter.acquire();
      
      const state = limiter.getState();
      expect(state.requestsInWindow).toBe(2);
      expect(state.waitTimeMs).toBeGreaterThan(0);
    });

    it('should update lastRequestTime after acquire', async () => {
      const limiter = new RateLimiter();
      
      expect(limiter.getState().lastRequestTime).toBeNull();
      
      await limiter.acquire();
      
      expect(limiter.getState().lastRequestTime).not.toBeNull();
    });
  });

  describe('isInBackoff()', () => {
    it('should return false initially', () => {
      const limiter = new RateLimiter();
      expect(limiter.isInBackoff()).toBe(false);
    });

    it('should return true after rate limit hit', () => {
      const limiter = new RateLimiter();
      limiter.recordRateLimitHit();
      expect(limiter.isInBackoff()).toBe(true);
    });

    it('should return false after backoff expires', () => {
      const limiter = new RateLimiter({
        backoffStrategy: 'fixed',
        initialBackoffMs: 1000,
      });
      
      limiter.recordRateLimitHit();
      expect(limiter.isInBackoff()).toBe(true);
      
      vi.advanceTimersByTime(1001);
      expect(limiter.isInBackoff()).toBe(false);
    });
  });

  describe('getBackoffRemaining()', () => {
    it('should return 0 when not in backoff', () => {
      const limiter = new RateLimiter();
      expect(limiter.getBackoffRemaining()).toBe(0);
    });

    it('should return remaining time when in backoff', () => {
      const limiter = new RateLimiter({
        backoffStrategy: 'fixed',
        initialBackoffMs: 5000,
      });
      
      limiter.recordRateLimitHit();
      
      // Initially should be close to 5000ms
      expect(limiter.getBackoffRemaining()).toBeLessThanOrEqual(5000);
      expect(limiter.getBackoffRemaining()).toBeGreaterThan(4900);
      
      // After 2 seconds, should be about 3000ms
      vi.advanceTimersByTime(2000);
      expect(limiter.getBackoffRemaining()).toBeLessThanOrEqual(3000);
      expect(limiter.getBackoffRemaining()).toBeGreaterThan(2900);
    });
  });

  describe('reset()', () => {
    it('should reset all state', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 5 });
      
      // Build up some state
      await limiter.acquire();
      await limiter.acquire();
      limiter.recordRateLimitHit();
      limiter.recordRateLimitHit();
      
      // Verify state is set
      expect(limiter.getState().requestsInWindow).toBe(2);
      expect(limiter.getState().consecutiveHits).toBe(2);
      expect(limiter.isInBackoff()).toBe(true);
      
      // Reset
      limiter.reset();
      
      // Verify clean state
      const state = limiter.getState();
      expect(state.requestsInWindow).toBe(0);
      expect(state.consecutiveHits).toBe(0);
      expect(state.currentBackoffMs).toBe(0);
      expect(state.isBackingOff).toBe(false);
      expect(state.lastRequestTime).toBeNull();
    });
  });

  describe('timestamp cleanup', () => {
    it('should remove requests older than 1 minute', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 100 });
      
      // Make requests at time 0
      await limiter.acquire();
      await limiter.acquire();
      await limiter.acquire();
      
      expect(limiter.getState().requestsInWindow).toBe(3);
      
      // Advance 30 seconds
      vi.advanceTimersByTime(30000);
      
      // Make more requests
      await limiter.acquire();
      expect(limiter.getState().requestsInWindow).toBe(4);
      
      // Advance another 31 seconds (total 61s)
      vi.advanceTimersByTime(31000);
      
      // Original 3 requests should be cleaned
      // Need to trigger cleanup by getting state or acquiring
      const state = limiter.getState();
      expect(state.requestsInWindow).toBe(1); // Only the 4th request remains
    });
  });

  describe('concurrent acquire calls', () => {
    it('should handle multiple concurrent acquires', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 10 });
      
      // Start 5 concurrent acquires
      const promises = [
        limiter.acquire(),
        limiter.acquire(),
        limiter.acquire(),
        limiter.acquire(),
        limiter.acquire(),
      ];
      
      await Promise.all(promises);
      
      expect(limiter.getState().requestsInWindow).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('should handle requestsPerMinute of 1', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 1 });
      
      await limiter.acquire();
      expect(limiter.getState().requestsInWindow).toBe(1);
      
      // Second acquire should wait
      const acquirePromise = limiter.acquire();
      
      // Advance past the window
      vi.advanceTimersByTime(60001);
      
      await acquirePromise;
      expect(limiter.getState().requestsInWindow).toBe(1);
    });

    it('should handle very small initialBackoffMs', () => {
      const limiter = new RateLimiter({
        backoffStrategy: 'exponential',
        initialBackoffMs: 10,
        maxBackoffMs: 1000,
      });
      
      limiter.recordRateLimitHit();
      expect(limiter.getState().currentBackoffMs).toBe(10);
      
      limiter.recordRateLimitHit();
      expect(limiter.getState().currentBackoffMs).toBe(20);
    });

    it('should handle initialBackoffMs larger than maxBackoffMs', () => {
      const limiter = new RateLimiter({
        backoffStrategy: 'fixed',
        initialBackoffMs: 10000,
        maxBackoffMs: 5000,
      });
      
      limiter.recordRateLimitHit();
      expect(limiter.getState().currentBackoffMs).toBe(5000); // Capped at max
    });
  });
});
