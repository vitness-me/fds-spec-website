/**
 * The Claude Code provider against a stubbed `claude` executable. The real CLI
 * is never run here.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'node:os';
import { realpathSync } from 'node:fs';
import {
  ClaudeCodeProvider,
  ClaudeCodeError,
  DEFAULT_WRITER_MODEL,
  DEFAULT_CHECKER_MODEL,
} from '../../../src/ai/providers/claude-code.js';
import { EnrichmentEngine } from '../../../src/ai/enrichment-engine.js';
import { readReply } from '../../../src/ai/response-schema.js';
import { exerciseTarget } from '../../support/exercise-target.js';
import {
  ClaudeStub,
  cliResult,
  structured,
  refusal,
  maxTokens,
  structuredRetriesExhausted,
  apiError,
  flagValue,
} from '../../support/claude-stub.js';

let stub: ClaudeStub;

beforeEach(() => {
  stub = new ClaudeStub().start();
});

afterEach(() => {
  stub.stop();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const provider = (config: Partial<ConstructorParameters<typeof ClaudeCodeProvider>[0]> = {}) =>
  new ClaudeCodeProvider({ command: stub.command, ...config });

const schema = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'], additionalProperties: false };

describe('ClaudeCodeProvider', () => {
  it('writes with Opus 5.5 and checks with Sonnet 5.5 unless configured otherwise', () => {
    expect(DEFAULT_WRITER_MODEL).toBe('claude-opus-5-5');
    expect(DEFAULT_CHECKER_MODEL).toBe('claude-sonnet-5-5');
    const p = provider();
    expect(p.name).toBe('claude-code');
    expect([p.writerModel, p.checkerModel]).toEqual([DEFAULT_WRITER_MODEL, DEFAULT_CHECKER_MODEL]);

    const configured = provider({ writerModel: 'claude-opus-4-1', checkerModel: 'claude-haiku-5-5' });
    expect([configured.writerModel, configured.checkerModel]).toEqual(['claude-opus-4-1', 'claude-haiku-5-5']);
  });

  it('runs print mode with structured output, no tools and nothing loaded from settings, the prompt on stdin', async () => {
    stub.reply(structured({ a: 'x' }));

    await provider().complete('the prompt', {
      systemPrompt: 'the system prompt',
      model: 'claude-sonnet-5-5',
      responseSchema: { name: 'n', schema, strict: true },
    });

    const [call] = stub.calls;
    expect(call.stdin).toBe('the prompt');
    expect(call.args.slice(0, 3)).toEqual(['-p', '--output-format', 'json']);
    expect(flagValue(call, '--model')).toBe('claude-sonnet-5-5');
    expect(JSON.parse(flagValue(call, '--json-schema')!)).toEqual(schema);
    expect(flagValue(call, '--system-prompt')).toBe('the system prompt');
    expect(flagValue(call, '--tools')).toBe('');
    expect(flagValue(call, '--setting-sources')).toBe('');
    expect(call.args).toEqual(
      expect.arrayContaining(['--strict-mcp-config', '--no-session-persistence', '--safe-mode'])
    );
    // Not in a project: no CLAUDE.md, settings or session tied to the caller's checkout
    expect(realpathSync(call.cwd)).toBe(realpathSync(tmpdir()));
  });

  it('writes with the writer model when the call names none, and sends no schema when none is given', async () => {
    stub.reply(cliResult({ result: 'plain' }));
    await provider({ writerModel: 'claude-opus-4-1' }).complete('prompt');
    const [call] = stub.calls;
    expect(flagValue(call, '--model')).toBe('claude-opus-4-1');
    expect(call.args).not.toContain('--json-schema');
  });

  it('starts the CLI with no variable that could bill an API key, a proxy or a cloud provider', async () => {
    for (const name of [
      'ANTHROPIC_API_KEY',
      'ANTHROPIC_AUTH_TOKEN',
      'ANTHROPIC_BASE_URL',
      'CLAUDE_CODE_USE_BEDROCK',
      'CLAUDE_CODE_USE_VERTEX',
      'CLAUDECODE',
      'AWS_ACCESS_KEY_ID',
      'GOOGLE_APPLICATION_CREDENTIALS',
      'VERTEX_REGION_CLAUDE_HAIKU',
      'OPENROUTER_API_KEY',
    ]) {
      vi.stubEnv(name, 'set-by-test');
    }
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'set-by-test');
    vi.stubEnv('CLAUDE_CONFIG_DIR', '/tmp/claude-config');
    stub.reply(structured({ a: 'x' }));

    await provider().complete('prompt');

    const env = stub.calls[0].env;
    expect(env.filter((name) => /^(ANTHROPIC_|AWS_|GOOGLE_|VERTEX_|OPENROUTER_|CLAUDECODE$)/.test(name))).toEqual([]);
    expect(env.filter((name) => name.startsWith('CLAUDE_CODE_'))).toEqual(['CLAUDE_CODE_OAUTH_TOKEN']);
    // The subscription sign-in stays reachable
    expect(env).toContain('CLAUDE_CONFIG_DIR');
    expect(env).toContain('PATH');
  });

  it('returns the structured output as the content, with the model the CLI reports and its usage', async () => {
    stub.reply(cliResult({ structured: { a: 'x' }, model: 'claude-sonnet-5-5', inputTokens: 300, outputTokens: 40 }));

    const response = await provider().complete('prompt', { model: 'sonnet', responseSchema: { name: 'n', schema, strict: true } });

    expect(JSON.parse(response.content)).toEqual({ a: 'x' });
    expect(response.model).toBe('claude-sonnet-5-5');
    expect(response.finishReason).toBe('stop');
    // A subscription has no per-call cost
    expect(response.usage).toEqual({ promptTokens: 300, completionTokens: 40, totalTokens: 340 });
    expect(response.tokensUsed).toBe(340);
  });

  it('keeps a character the CLI output splits across two chunks whole', async () => {
    const reply = structured({ a: 'Hold — then press' });
    stub.reply({ ...reply, splitAtByte: Buffer.from(reply.stdout).lastIndexOf('—') + 1 });
    const response = await provider().complete('prompt');
    expect(JSON.parse(response.content)).toEqual({ a: 'Hold — then press' });
  });

  it('reports the model that wrote most of the reply when the CLI used more than one', async () => {
    const reply = JSON.parse(structured({ a: 'x' }, 'claude-opus-5-5').stdout);
    reply.modelUsage['claude-haiku-5-5'] = { inputTokens: 50, outputTokens: 5 };
    stub.reply({ stdout: JSON.stringify(reply) });
    expect((await provider().complete('prompt')).model).toBe('claude-opus-5-5');
  });

  it('falls back to the model it asked for when the CLI reports none', async () => {
    const reply = JSON.parse(structured({ a: 'x' }).stdout);
    delete reply.modelUsage;
    stub.reply({ stdout: JSON.stringify(reply) });
    expect((await provider().complete('prompt', { model: 'claude-sonnet-5-5' })).model).toBe('claude-sonnet-5-5');
  });

  it('returns a refusal as a refusal, which is never parsed', async () => {
    stub.reply(refusal());
    const response = await provider().complete('prompt');
    expect(response.finishReason).toBe('content_filter');
    expect(response.refusal).toBe("I can't help with that request.");
    expect(readReply(response)).toMatchObject({ ok: false, reason: 'refusal' });
  });

  it('returns a max_tokens stop as a length stop', async () => {
    stub.reply(maxTokens());
    const response = await provider().complete('prompt');
    expect(response.finishReason).toBe('length');
    expect(readReply(response)).toMatchObject({ ok: false, reason: 'length' });
  });

  it('returns structured-output retries exhausted as a reply that fails its schema', async () => {
    stub.reply(structuredRetriesExhausted());
    const response = await provider().complete('prompt', { responseSchema: { name: 'n', schema, strict: true } });
    expect(readReply(response, schema)).toMatchObject({ ok: false, reason: 'invalid' });
  });

  it('throws an API error the CLI reports, with its message', async () => {
    stub.reply(apiError('API Error: 529 Overloaded'));
    await expect(provider().complete('prompt')).rejects.toThrow(/API Error: 529 Overloaded/);
  });

  it('throws when the CLI exits without a result, with the start of its stderr', async () => {
    stub.reply({ stdout: '', stderr: 'Not logged in. Please run /login', exitCode: 1 });
    const error = await provider().complete('prompt').catch((e) => e);
    expect(error).toBeInstanceOf(ClaudeCodeError);
    expect(error.message).toMatch(/exited with 1: Not logged in/);
  });

  it('keeps a credential the CLI prints out of the error', async () => {
    stub.reply(
      { stdout: '', stderr: 'proxy https://user:hunter2@proxy.local failed; key sk-ant-api03-abcDEF_123', exitCode: 1 },
      apiError('API Error: 401 Authorization: Bearer abc.def.ghi rejected')
    );
    const first = await provider().complete('prompt').catch((e: Error) => e.message);
    const second = await provider().complete('prompt').catch((e: Error) => e.message);
    expect(first).toContain('https://[redacted]@proxy.local');
    expect(first).toContain('sk-ant-[redacted]');
    expect(second).toContain('Bearer [redacted]');
    for (const message of [first, second]) {
      expect(message).not.toMatch(/hunter2|abcDEF_123|abc\.def\.ghi/);
    }
  });

  it('throws when the command cannot be started', async () => {
    const p = new ClaudeCodeProvider({ command: `${stub.command}-missing` });
    await expect(p.complete('prompt')).rejects.toThrow(/Could not start/);
  });

  it('stops a call that runs past its timeout', async () => {
    stub.reply({ ...structured({ a: 'x' }), delayMs: 5_000 });
    await expect(provider({ timeoutMs: 200 }).complete('prompt')).rejects.toThrow(/timed out after 200 ms/);
  });

  it('kills a timed-out CLI that ignores SIGTERM', async () => {
    stub.reply({ ...structured({ a: 'x' }), delayMs: 30_000, ignoreSigterm: true });
    await expect(provider({ timeoutMs: 200 }).complete('prompt')).rejects.toThrow(/timed out/);
    const { pid } = stub.calls[0];
    const alive = () => {
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    };
    expect(alive()).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 6_000));
    expect(alive()).toBe(false);
  }, 10_000);

  it('completeJSON parses the reply, and never a refusal or a cut-off one', async () => {
    stub.reply(cliResult({ result: '```json\n{"a":"x"}\n```' }), refusal(), maxTokens());
    const p = provider();
    expect(await p.completeJSON('prompt')).toEqual({ a: 'x' });
    await expect(p.completeJSON('prompt')).rejects.toThrow(/No usable JSON reply \(refusal\)/);
    await expect(p.completeJSON('prompt')).rejects.toThrow(/No usable JSON reply \(length\)/);
  });
});

describe('EnrichmentEngine with provider claude-code', () => {
  it('records structured-output retries exhausted as an invalid abstention, not a failure', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    stub.reply(structuredRetriesExhausted());
    const tier = { model: 'unused', temperature: 0, maxTokens: 10, batchSize: 25, priority: 'balanced' as const };
    const engine = new EnrichmentEngine({
      provider: 'claude-code',
      claudeCode: { command: stub.command },
      tiers: { simple: tier, medium: tier, complex: { ...tier, batchSize: 1 } },
      fields: { 'canonical.description': { tier: 'simple', prompt: 'description' } },
      checkpoint: { enabled: false, saveInterval: 1 },
    });

    const result = await engine.enrichBatch([{ id: 'ex-1', slug: 'push-up', name: 'Push Up' }], { target: exerciseTarget });

    expect(result.results.size).toBe(0);
    expect(result.failedIds).toEqual([]);
    expect(result.abstentions.map((a) => a.reason)).toEqual(['invalid']);
  });

  it('needs no API key, and builds the provider from enrichment.claudeCode', () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const engine = new EnrichmentEngine({
      provider: 'claude-code',
      claudeCode: { command: stub.command, writerModel: 'w-model', checkerModel: 'c-model', timeoutMs: 1000 },
    });
    const p = engine.getProvider() as ClaudeCodeProvider;
    expect(p).toBeInstanceOf(ClaudeCodeProvider);
    expect([p.writerModel, p.checkerModel]).toEqual(['w-model', 'c-model']);
  });

  it('writes every tier with the writer model, whatever model the tier names', () => {
    const engine = new EnrichmentEngine({
      provider: 'claude-code',
      claudeCode: { command: stub.command, writerModel: 'w-model' },
      tiers: {
        simple: { model: 'anthropic/claude-haiku-4.5', temperature: 0, maxTokens: 10, batchSize: 25, priority: 'speed' },
        medium: { model: 'anthropic/claude-sonnet-4.5', temperature: 0, maxTokens: 10, batchSize: 25, priority: 'balanced' },
        complex: { model: 'anthropic/claude-opus-4.5', temperature: 0, maxTokens: 10, batchSize: 1, priority: 'accuracy' },
      },
    });
    expect((['simple', 'medium', 'complex'] as const).map((t) => engine.getTierConfig(t).model)).toEqual([
      'w-model',
      'w-model',
      'w-model',
    ]);
    expect(engine.getTierConfig('simple').batchSize).toBe(25);
  });
});
