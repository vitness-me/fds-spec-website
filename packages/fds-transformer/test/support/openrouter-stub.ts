/**
 * A local stand-in for OpenRouter's chat completions endpoint.
 *
 * It serves recorded replies in order and keeps every request body, so a test
 * can assert what was sent. It listens on 127.0.0.1 only; nothing leaves the
 * machine.
 */

import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';

export interface StubReply {
  status: number;
  body: unknown;
}

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'openrouter');

/** Load a recorded reply from `test/fixtures/openrouter/<name>.json`. */
export function fixture(name: string): StubReply {
  return JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), 'utf-8')) as StubReply;
}

/** A 200 chat completion whose message content is `content`. */
export function completion(
  content: unknown,
  options: { model?: string; finishReason?: string; promptTokens?: number; completionTokens?: number; cost?: number } = {}
): StubReply {
  const promptTokens = options.promptTokens ?? 100;
  const completionTokens = options.completionTokens ?? 20;
  return {
    status: 200,
    body: {
      id: 'gen-stub',
      object: 'chat.completion',
      model: options.model ?? 'stub/model',
      choices: [
        {
          finish_reason: options.finishReason ?? 'stop',
          message: { role: 'assistant', content: typeof content === 'string' ? content : JSON.stringify(content) },
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
        ...(options.cost !== undefined ? { cost: options.cost } : {}),
      },
    },
  };
}

export class OpenRouterStub {
  readonly requests: Array<Record<string, any>> = [];
  readonly headers: Array<Record<string, string | string[] | undefined>> = [];
  private readonly queue: Array<StubReply | ((body: Record<string, any>) => StubReply)> = [];
  private server: Server | null = null;
  private port = 0;

  /** Queue replies, served one per request in order. */
  reply(...replies: Array<StubReply | ((body: Record<string, any>) => StubReply)>): this {
    this.queue.push(...replies);
    return this;
  }

  get baseUrl(): string {
    return `http://127.0.0.1:${this.port}/api/v1`;
  }

  async start(): Promise<this> {
    this.server = createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk) => (raw += chunk));
      req.on('end', () => {
        const body = raw ? (JSON.parse(raw) as Record<string, any>) : {};
        this.requests.push(body);
        this.headers.push(req.headers);
        const next = this.queue.shift();
        const reply = typeof next === 'function' ? next(body) : next;
        if (!reply) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { code: 500, message: 'stub: no reply queued' } }));
          return;
        }
        res.writeHead(reply.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reply.body));
      });
    });
    await new Promise<void>((resolve) => this.server!.listen(0, '127.0.0.1', resolve));
    this.port = (this.server.address() as AddressInfo).port;
    return this;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve()));
  }
}
