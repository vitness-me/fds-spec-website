/**
 * OpenRouter AI Provider
 *
 * Supports rate limiting with automatic backoff on 429 responses.
 */

import type { AIProvider, AIProviderOptions, AIResponse } from '../../core/types.js';
import type { RateLimiter } from '../rate-limiter.js';
import { readReply } from '../response-schema.js';

/**
 * OpenRouter provider configuration
 */
export interface OpenRouterConfig {
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

/**
 * Error thrown when rate limit is hit (429 response)
 */
export class RateLimitError extends Error {
  readonly statusCode = 429;
  readonly retryAfter: number | null;

  constructor(message: string, retryAfter: number | null = null) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown for API errors
 */
export class OpenRouterAPIError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'OpenRouterAPIError';
    this.statusCode = statusCode;
  }
}

/**
 * The parts of a Chat Completions reply this provider reads.
 * https://openrouter.ai/docs/api-reference/overview
 */
interface ChatCompletion {
  model?: string;
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string | null; refusal?: string | null };
    error?: OpenRouterErrorBody;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };
  error?: OpenRouterErrorBody;
}

interface OpenRouterErrorBody {
  code?: number;
  message?: string;
  metadata?: { error_type?: string };
}

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';

  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private defaultTemperature: number;
  private defaultMaxTokens: number;
  private maxRetries: number;
  private retryDelay: number;
  private rateLimiter: RateLimiter | null;

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'anthropic/claude-3.5-sonnet';
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.defaultTemperature = config.temperature ?? 0.3;
    this.defaultMaxTokens = config.maxTokens ?? 1024;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.rateLimiter = config.rateLimiter ?? null;
  }

  /**
   * Set or update the rate limiter
   */
  setRateLimiter(rateLimiter: RateLimiter | null): void {
    this.rateLimiter = rateLimiter;
  }

  /**
   * Get the current rate limiter (for testing/monitoring)
   */
  getRateLimiter(): RateLimiter | null {
    return this.rateLimiter;
  }

  /**
   * Get the current model
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Set the model for subsequent requests
   * @deprecated Pass `model` per call instead. The provider is shared, so
   * setting its model changes every later call.
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Send a completion request with rate limiting and 429 handling
   */
  async complete(prompt: string, options: AIProviderOptions = {}): Promise<AIResponse> {
    const messages = [
      ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
      { role: 'user', content: prompt },
    ];

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Acquire rate limit permission before making request
        if (this.rateLimiter) {
          await this.rateLimiter.acquire();
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://spec.vitness.me',
            'X-Title': 'FDS Transformer',
          },
          body: JSON.stringify(this.requestBody(messages, options)),
        });

        // A refusal the provider reports as an error is still the model's
        // answer. Retrying the same prompt would not change it.
        if (response.status === 403) {
          const errorBody = await response.text();
          const refusal = this.parsePolicyBlock(errorBody);
          if (refusal !== null) {
            return {
              content: '',
              tokensUsed: 0,
              model: options.model ?? this.model,
              finishReason: 'content_filter',
              refusal,
            };
          }
          throw new OpenRouterAPIError(`OpenRouter API error: 403 ${errorBody}`, 403);
        }

        // Handle 429 rate limit response
        if (response.status === 429) {
          const retryAfter = this.parseRetryAfter(response.headers.get('Retry-After'));

          if (this.rateLimiter) {
            this.rateLimiter.recordRateLimitHit();
          }

          const errorBody = await response.text();
          throw new RateLimitError(
            `Rate limited by OpenRouter: ${errorBody}`,
            retryAfter
          );
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new OpenRouterAPIError(
            `OpenRouter API error: ${response.status} ${errorBody}`,
            response.status
          );
        }

        const data = await response.json() as ChatCompletion;

        // OpenRouter can answer 200 with an error in the body, either alone or
        // on the choice.
        const bodyError = data.error ?? data.choices?.[0]?.error;
        if (bodyError) {
          throw new OpenRouterAPIError(
            `OpenRouter API error: ${bodyError.code ?? ''} ${bodyError.message ?? ''}`.trim(),
            bodyError.code ?? response.status
          );
        }

        const choice = data.choices?.[0];
        const usage = data.usage
          ? {
              promptTokens: data.usage.prompt_tokens ?? 0,
              completionTokens: data.usage.completion_tokens ?? 0,
              totalTokens: data.usage.total_tokens ?? 0,
              cost: data.usage.cost,
            }
          : undefined;

        // Record successful request
        if (this.rateLimiter) {
          this.rateLimiter.recordSuccess();
        }

        return {
          content: choice?.message?.content || '',
          tokensUsed: usage?.totalTokens ?? 0,
          model: data.model || options.model || this.model,
          finishReason: choice?.finish_reason ?? null,
          refusal: choice?.message?.refusal ?? undefined,
          usage,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if this is a rate limit error
        const isRateLimitError = error instanceof RateLimitError;

        // Check if we should retry
        if (attempt < this.maxRetries - 1) {
          let delay: number;

          if (isRateLimitError && error.retryAfter) {
            // Use server-provided retry-after if available
            delay = error.retryAfter * 1000;
          } else if (isRateLimitError && this.rateLimiter) {
            // Use rate limiter's backoff
            delay = this.rateLimiter.getBackoffRemaining();
            if (delay === 0) {
              delay = this.retryDelay * Math.pow(2, attempt);
            }
          } else {
            // Standard exponential backoff for other errors
            delay = this.retryDelay * Math.pow(2, attempt);
          }

          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Failed to complete request after retries');
  }

  private requestBody(
    messages: Array<{ role: string; content: string }>,
    options: AIProviderOptions
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: options.model ?? this.model,
      messages,
      temperature: options.temperature ?? this.defaultTemperature,
      max_tokens: options.maxTokens ?? this.defaultMaxTokens,
    };
    if (options.responseSchema) {
      const { name, schema, strict } = options.responseSchema;
      body.response_format = { type: 'json_schema', json_schema: { name, strict, schema } };
      // Route only to endpoints that honour response_format, rather than to
      // ones that would ignore it.
      body.provider = { require_parameters: true };
    }
    return body;
  }

  /**
   * The refusal message of a 403 that reports a model refusal or a content
   * policy block, or null for any other 403.
   */
  private parsePolicyBlock(body: string): string | null {
    try {
      const error = (JSON.parse(body) as ChatCompletion).error;
      const type = error?.metadata?.error_type;
      if (type === 'refusal' || type === 'content_policy_violation') {
        return error?.message || type;
      }
    } catch {
      // not JSON: not a policy block we can recognise
    }
    return null;
  }

  /**
   * Parse the Retry-After header value
   * Can be either seconds or HTTP-date format
   */
  private parseRetryAfter(value: string | null): number | null {
    if (!value) return null;

    // Try parsing as seconds
    const seconds = parseInt(value, 10);
    if (!isNaN(seconds)) {
      return seconds;
    }

    // Try parsing as HTTP-date
    const date = Date.parse(value);
    if (!isNaN(date)) {
      return Math.max(0, Math.ceil((date - Date.now()) / 1000));
    }

    return null;
  }

  /**
   * Send a completion request expecting JSON response
   */
  async completeJSON<T>(
    prompt: string,
    schema?: object,
    options: AIProviderOptions = {}
  ): Promise<T> {
    const systemPrompt = options.systemPrompt || 
      'You are a helpful assistant that responds only with valid JSON. Do not include any text outside the JSON object.';

    const response = await this.complete(prompt, {
      ...options,
      systemPrompt,
    });

    // A refusal or a reply cut off at the token limit is never parsed.
    const reply = readReply(response, schema as Record<string, unknown> | undefined);
    if (!reply.ok) {
      throw new Error(
        reply.reason === 'invalid'
          ? `Failed to parse JSON response: ${response.content.trim().slice(0, 200)}`
          : `No usable JSON reply (${reply.reason}): ${reply.detail}`
      );
    }
    return reply.value as T;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
