/**
 * OpenRouter Provider Tests
 *
 * Tests for rate limiting integration and 429 handling
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import {
  OpenRouterProvider,
  RateLimitError,
  OpenRouterAPIError,
  type OpenRouterConfig,
} from '../../../src/ai/providers/openrouter.js';
import { RateLimiter } from '../../../src/ai/rate-limiter.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

/**
 * Helper to create a mock Response
 */
function mockResponse(
  data: unknown,
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  const { status = 200, headers = {} } = options;

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

/**
 * Helper to create a successful API response
 */
function successResponse(content: string, tokensUsed = 100): Response {
  return mockResponse({
    choices: [{ message: { content } }],
    usage: { total_tokens: tokensUsed },
    model: 'anthropic/claude-3.5-sonnet',
  });
}

describe('OpenRouterProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create provider with required config', () => {
      const provider = new OpenRouterProvider({ apiKey: 'test-key' });
      expect(provider.name).toBe('openrouter');
      expect(provider.getModel()).toBe('anthropic/claude-3.5-sonnet');
    });

    it('should use custom model when provided', () => {
      const provider = new OpenRouterProvider({
        apiKey: 'test-key',
        model: 'anthropic/claude-haiku-4.5',
      });
      expect(provider.getModel()).toBe('anthropic/claude-haiku-4.5');
    });

    it('should accept rate limiter in config', () => {
      const rateLimiter = new RateLimiter({ requestsPerMinute: 10 });
      const provider = new OpenRouterProvider({
        apiKey: 'test-key',
        rateLimiter,
      });
      expect(provider.getRateLimiter()).toBe(rateLimiter);
    });

    it('should have null rate limiter when not provided', () => {
      const provider = new OpenRouterProvider({ apiKey: 'test-key' });
      expect(provider.getRateLimiter()).toBeNull();
    });
  });

  describe('setRateLimiter()', () => {
    it('should set rate limiter', () => {
      const provider = new OpenRouterProvider({ apiKey: 'test-key' });
      const rateLimiter = new RateLimiter();

      provider.setRateLimiter(rateLimiter);

      expect(provider.getRateLimiter()).toBe(rateLimiter);
    });

    it('should clear rate limiter when set to null', () => {
      const rateLimiter = new RateLimiter();
      const provider = new OpenRouterProvider({
        apiKey: 'test-key',
        rateLimiter,
      });

      provider.setRateLimiter(null);

      expect(provider.getRateLimiter()).toBeNull();
    });
  });

  describe('setModel()', () => {
    it('should update model', () => {
      const provider = new OpenRouterProvider({ apiKey: 'test-key' });

      provider.setModel('anthropic/claude-opus-4.5');

      expect(provider.getModel()).toBe('anthropic/claude-opus-4.5');
    });
  });

  describe('complete()', () => {
    describe('basic functionality', () => {
      it('should make successful request', async () => {
        mockFetch.mockResolvedValueOnce(successResponse('Hello, world!', 50));

        const provider = new OpenRouterProvider({ apiKey: 'test-key' });
        const result = await provider.complete('Say hello');

        expect(result.content).toBe('Hello, world!');
        expect(result.tokensUsed).toBe(50);
        expect(result.model).toBe('anthropic/claude-3.5-sonnet');
      });

      it('should include system prompt in messages', async () => {
        mockFetch.mockResolvedValueOnce(successResponse('response'));

        const provider = new OpenRouterProvider({ apiKey: 'test-key' });
        await provider.complete('prompt', { systemPrompt: 'You are helpful' });

        const call = mockFetch.mock.calls[0];
        const body = JSON.parse(call[1].body);
        expect(body.messages).toHaveLength(2);
        expect(body.messages[0]).toEqual({ role: 'system', content: 'You are helpful' });
        expect(body.messages[1]).toEqual({ role: 'user', content: 'prompt' });
      });

      it('should use custom temperature and maxTokens', async () => {
        mockFetch.mockResolvedValueOnce(successResponse('response'));

        const provider = new OpenRouterProvider({ apiKey: 'test-key' });
        await provider.complete('prompt', { temperature: 0.8, maxTokens: 500 });

        const call = mockFetch.mock.calls[0];
        const body = JSON.parse(call[1].body);
        expect(body.temperature).toBe(0.8);
        expect(body.max_tokens).toBe(500);
      });

      it('should set correct headers', async () => {
        mockFetch.mockResolvedValueOnce(successResponse('response'));

        const provider = new OpenRouterProvider({ apiKey: 'my-api-key' });
        await provider.complete('prompt');

        const call = mockFetch.mock.calls[0];
        const headers = call[1].headers;
        expect(headers['Authorization']).toBe('Bearer my-api-key');
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['HTTP-Referer']).toBe('https://spec.vitness.me');
        expect(headers['X-Title']).toBe('FDS Transformer');
      });
    });

    describe('rate limiter integration', () => {
      it('should call acquire() before request', async () => {
        mockFetch.mockResolvedValueOnce(successResponse('response'));

        const rateLimiter = new RateLimiter();
        const acquireSpy = vi.spyOn(rateLimiter, 'acquire');

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          rateLimiter,
        });

        await provider.complete('prompt');

        expect(acquireSpy).toHaveBeenCalledTimes(1);
      });

      it('should call recordSuccess() after successful request', async () => {
        mockFetch.mockResolvedValueOnce(successResponse('response'));

        const rateLimiter = new RateLimiter();
        const successSpy = vi.spyOn(rateLimiter, 'recordSuccess');

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          rateLimiter,
        });

        await provider.complete('prompt');

        expect(successSpy).toHaveBeenCalledTimes(1);
      });

      it('should work without rate limiter', async () => {
        mockFetch.mockResolvedValueOnce(successResponse('response'));

        const provider = new OpenRouterProvider({ apiKey: 'test-key' });
        const result = await provider.complete('prompt');

        expect(result.content).toBe('response');
      });
    });

    describe('429 rate limit handling', () => {
      it('should throw RateLimitError on 429 response', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ error: 'Rate limited' }, { status: 429 })
        );

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          maxRetries: 1,
        });

        await expect(provider.complete('prompt')).rejects.toThrow(RateLimitError);
      });

      it('should call recordRateLimitHit() on 429', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ error: 'Rate limited' }, { status: 429 })
        );

        const rateLimiter = new RateLimiter();
        const hitSpy = vi.spyOn(rateLimiter, 'recordRateLimitHit');

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          rateLimiter,
          maxRetries: 1,
        });

        await expect(provider.complete('prompt')).rejects.toThrow(RateLimitError);

        expect(hitSpy).toHaveBeenCalledTimes(1);
      });

      it('should parse Retry-After header in seconds', async () => {
        mockFetch.mockResolvedValue(
          mockResponse(
            { error: 'Rate limited' },
            { status: 429, headers: { 'Retry-After': '30' } }
          )
        );

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          maxRetries: 1,
        });

        try {
          await provider.complete('prompt');
        } catch (error) {
          expect(error).toBeInstanceOf(RateLimitError);
          expect((error as RateLimitError).retryAfter).toBe(30);
        }
      });

      it('should retry after 429 with server-provided delay', async () => {
        mockFetch
          .mockResolvedValueOnce(
            mockResponse(
              { error: 'Rate limited' },
              { status: 429, headers: { 'Retry-After': '2' } }
            )
          )
          .mockResolvedValueOnce(successResponse('success'));

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          maxRetries: 3,
        });

        const resultPromise = provider.complete('prompt');

        // Advance timer to allow retry
        await vi.advanceTimersByTimeAsync(2000);

        const result = await resultPromise;
        expect(result.content).toBe('success');
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('should use rate limiter backoff when no Retry-After header', async () => {
        mockFetch
          .mockResolvedValueOnce(mockResponse({ error: 'Rate limited' }, { status: 429 }))
          .mockResolvedValueOnce(successResponse('success'));

        const rateLimiter = new RateLimiter({
          backoffStrategy: 'fixed',
          initialBackoffMs: 3000,
        });

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          rateLimiter,
          maxRetries: 3,
        });

        const resultPromise = provider.complete('prompt');

        // Advance past backoff
        await vi.advanceTimersByTimeAsync(3000);

        const result = await resultPromise;
        expect(result.content).toBe('success');
      });

      it('should exhaust retries on persistent 429', async () => {
        // Use mockImplementation to return new response objects each time
        mockFetch.mockImplementation(() =>
          Promise.resolve(mockResponse({ error: 'Rate limited' }, { status: 429 }))
        );

        const rateLimiter = new RateLimiter({
          backoffStrategy: 'fixed',
          initialBackoffMs: 100,
        });

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          rateLimiter,
          maxRetries: 3,
          retryDelay: 100,
        });

        // Run timers automatically so all retries complete synchronously
        vi.useRealTimers();

        await expect(provider.complete('prompt')).rejects.toThrow(RateLimitError);
        expect(mockFetch).toHaveBeenCalledTimes(3);

        // Restore fake timers for other tests
        vi.useFakeTimers();
      });
    });

    describe('other API errors', () => {
      it('should throw OpenRouterAPIError on non-200 response', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ error: 'Bad request' }, { status: 400 })
        );

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          maxRetries: 1,
        });

        await expect(provider.complete('prompt')).rejects.toThrow(OpenRouterAPIError);
      });

      it('should include status code in OpenRouterAPIError', async () => {
        mockFetch.mockResolvedValue(
          mockResponse({ error: 'Server error' }, { status: 500 })
        );

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          maxRetries: 1,
        });

        try {
          await provider.complete('prompt');
        } catch (error) {
          expect(error).toBeInstanceOf(OpenRouterAPIError);
          expect((error as OpenRouterAPIError).statusCode).toBe(500);
        }
      });

      it('should retry on server errors with exponential backoff', async () => {
        mockFetch
          .mockResolvedValueOnce(mockResponse({ error: 'Server error' }, { status: 500 }))
          .mockResolvedValueOnce(mockResponse({ error: 'Server error' }, { status: 500 }))
          .mockResolvedValueOnce(successResponse('success'));

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          maxRetries: 3,
          retryDelay: 1000,
        });

        const resultPromise = provider.complete('prompt');

        // First retry after 1000ms (1000 * 2^0)
        await vi.advanceTimersByTimeAsync(1000);
        // Second retry after 2000ms (1000 * 2^1)
        await vi.advanceTimersByTimeAsync(2000);

        const result = await resultPromise;
        expect(result.content).toBe('success');
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });
    });

    describe('retry behavior', () => {
      it('should retry on network errors', async () => {
        mockFetch
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce(successResponse('success'));

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          maxRetries: 2,
          retryDelay: 100,
        });

        const resultPromise = provider.complete('prompt');

        await vi.advanceTimersByTimeAsync(100);

        const result = await resultPromise;
        expect(result.content).toBe('success');
      });

      it('should use exponential backoff for retries', async () => {
        mockFetch
          .mockRejectedValueOnce(new Error('Error 1'))
          .mockRejectedValueOnce(new Error('Error 2'))
          .mockResolvedValueOnce(successResponse('success'));

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          maxRetries: 3,
          retryDelay: 1000,
        });

        const resultPromise = provider.complete('prompt');

        // First retry: 1000ms
        await vi.advanceTimersByTimeAsync(1000);
        expect(mockFetch).toHaveBeenCalledTimes(2);

        // Second retry: 2000ms (1000 * 2^1)
        await vi.advanceTimersByTimeAsync(2000);

        const result = await resultPromise;
        expect(result.content).toBe('success');
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });

      it('should throw last error after max retries', async () => {
        // Use mockImplementation to create new error objects each time
        mockFetch.mockImplementation(() =>
          Promise.reject(new Error('Persistent error'))
        );

        const provider = new OpenRouterProvider({
          apiKey: 'test-key',
          maxRetries: 2,
          retryDelay: 100,
        });

        // Run timers automatically so all retries complete synchronously
        vi.useRealTimers();

        await expect(provider.complete('prompt')).rejects.toThrow('Persistent error');
        expect(mockFetch).toHaveBeenCalledTimes(2);

        // Restore fake timers for other tests
        vi.useFakeTimers();
      });
    });
  });

  describe('completeJSON()', () => {
    it('should parse JSON response', async () => {
      mockFetch.mockResolvedValueOnce(
        successResponse('{"name": "test", "value": 42}')
      );

      const provider = new OpenRouterProvider({ apiKey: 'test-key' });
      const result = await provider.completeJSON<{ name: string; value: number }>(
        'Return JSON'
      );

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should extract JSON from markdown code block', async () => {
      mockFetch.mockResolvedValueOnce(
        successResponse('```json\n{"key": "value"}\n```')
      );

      const provider = new OpenRouterProvider({ apiKey: 'test-key' });
      const result = await provider.completeJSON<{ key: string }>('Return JSON');

      expect(result).toEqual({ key: 'value' });
    });

    it('should use default system prompt for JSON', async () => {
      mockFetch.mockResolvedValueOnce(successResponse('{}'));

      const provider = new OpenRouterProvider({ apiKey: 'test-key' });
      await provider.completeJSON('Return JSON');

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.messages[0].content).toContain('valid JSON');
    });

    it('should use custom system prompt', async () => {
      mockFetch.mockResolvedValueOnce(successResponse('{}'));

      const provider = new OpenRouterProvider({ apiKey: 'test-key' });
      await provider.completeJSON('Return JSON', undefined, {
        systemPrompt: 'Custom prompt',
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.messages[0].content).toBe('Custom prompt');
    });

    it('should throw on invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce(successResponse('not valid json'));

      const provider = new OpenRouterProvider({ apiKey: 'test-key' });

      await expect(provider.completeJSON('Return JSON')).rejects.toThrow(
        'Failed to parse JSON response'
      );
    });

    it('should benefit from rate limiting', async () => {
      mockFetch.mockResolvedValueOnce(successResponse('{}'));

      const rateLimiter = new RateLimiter();
      const acquireSpy = vi.spyOn(rateLimiter, 'acquire');

      const provider = new OpenRouterProvider({
        apiKey: 'test-key',
        rateLimiter,
      });

      await provider.completeJSON('Return JSON');

      expect(acquireSpy).toHaveBeenCalled();
    });

    it('should handle 429 errors', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ error: 'Rate limited' }, { status: 429 })
      );

      const provider = new OpenRouterProvider({
        apiKey: 'test-key',
        maxRetries: 1,
      });

      await expect(provider.completeJSON('Return JSON')).rejects.toThrow(
        RateLimitError
      );
    });
  });

  describe('RateLimitError', () => {
    it('should have correct properties', () => {
      const error = new RateLimitError('Rate limited', 30);

      expect(error.name).toBe('RateLimitError');
      expect(error.message).toBe('Rate limited');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(30);
    });

    it('should handle null retryAfter', () => {
      const error = new RateLimitError('Rate limited');

      expect(error.retryAfter).toBeNull();
    });
  });

  describe('OpenRouterAPIError', () => {
    it('should have correct properties', () => {
      const error = new OpenRouterAPIError('Bad request', 400);

      expect(error.name).toBe('OpenRouterAPIError');
      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('parseRetryAfter', () => {
    it('should handle null header', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ error: 'Rate limited' }, { status: 429 })
      );

      const provider = new OpenRouterProvider({
        apiKey: 'test-key',
        maxRetries: 1,
      });

      try {
        await provider.complete('prompt');
      } catch (error) {
        expect((error as RateLimitError).retryAfter).toBeNull();
      }
    });
  });

  describe('integration with RateLimiter', () => {
    it('should respect rate limiter state across multiple requests', async () => {
      mockFetch.mockResolvedValue(successResponse('response'));

      const rateLimiter = new RateLimiter({ requestsPerMinute: 2 });
      const provider = new OpenRouterProvider({
        apiKey: 'test-key',
        rateLimiter,
      });

      // Make 2 requests (at limit)
      await provider.complete('prompt1');
      await provider.complete('prompt2');

      const state = rateLimiter.getState();
      expect(state.requestsInWindow).toBe(2);
    });

    it('should wait when rate limiter is at capacity', async () => {
      mockFetch.mockResolvedValue(successResponse('response'));

      const rateLimiter = new RateLimiter({ requestsPerMinute: 1 });
      const provider = new OpenRouterProvider({
        apiKey: 'test-key',
        rateLimiter,
      });

      // First request
      await provider.complete('prompt1');

      // Second request should wait
      const secondPromise = provider.complete('prompt2');

      // Advance time past window
      await vi.advanceTimersByTimeAsync(60001);

      await secondPromise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should reset backoff after successful request following 429', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ error: 'Rate limited' }, { status: 429 }))
        .mockResolvedValueOnce(successResponse('success'));

      const rateLimiter = new RateLimiter({
        backoffStrategy: 'exponential',
        initialBackoffMs: 1000,
      });

      const provider = new OpenRouterProvider({
        apiKey: 'test-key',
        rateLimiter,
        maxRetries: 2,
      });

      const resultPromise = provider.complete('prompt');

      // Wait for backoff
      await vi.advanceTimersByTimeAsync(1000);

      await resultPromise;

      // Backoff should be reset
      expect(rateLimiter.isInBackoff()).toBe(false);
      expect(rateLimiter.getState().consecutiveHits).toBe(0);
    });
  });
});
