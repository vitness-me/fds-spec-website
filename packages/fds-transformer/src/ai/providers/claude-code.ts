/**
 * Claude Code provider: answers through the local `claude` CLI in print mode,
 * signed in with a Claude subscription.
 *
 * The CLI runs with no tools, no MCP servers, no settings, CLAUDE.md or
 * skills, no saved session, and outside any project, so the session does
 * nothing but answer the prompt. A request schema is passed as
 * `--json-schema`. Variables that would route the CLI to API billing, a proxy,
 * a cloud provider or a parent session are removed from its environment; the
 * provider itself reads no credential.
 */

import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import type { AIProvider, AIProviderOptions, AIResponse, AIUsage, ClaudeCodeConfig } from '../../core/types.js';
import { JSON_SYSTEM_PROMPT, jsonReply } from '../response-schema.js';

export const DEFAULT_WRITER_MODEL = 'claude-opus-5-5';
export const DEFAULT_CHECKER_MODEL = 'claude-sonnet-5-5';
const DEFAULT_TIMEOUT_MS = 600_000;

/**
 * Variables that route the CLI to an API key, a proxy, a cloud provider or a
 * parent Claude Code session. CLAUDE_CODE_OAUTH_TOKEN, the sign-in
 * `claude setup-token` makes, is a subscription sign-in and is kept, as is
 * CLAUDE_CONFIG_DIR.
 */
const NOT_THE_SUBSCRIPTION = /^(ANTHROPIC_|CLAUDE_CODE_|CLAUDECODE$|AWS_|GOOGLE_|VERTEX_|OPENROUTER_)/;
const SUBSCRIPTION_SIGN_IN = 'CLAUDE_CODE_OAUTH_TOKEN';

/** The environment the CLI starts with: the caller's, less every billing route but the subscription */
function subscriptionEnv(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(([name]) => name === SUBSCRIPTION_SIGN_IN || !NOT_THE_SUBSCRIPTION.test(name))
  );
}

/** Error thrown when the CLI cannot answer: not started, not signed in, an API error, a timeout */
export class ClaudeCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeCodeError';
  }
}

/** The parts of the CLI's `--output-format json` result this provider reads */
interface CliResult {
  subtype?: string;
  is_error?: boolean;
  result?: string;
  structured_output?: unknown;
  stop_reason?: string | null;
  modelUsage?: Record<string, { inputTokens?: number; outputTokens?: number }>;
}

export class ClaudeCodeProvider implements AIProvider {
  name = 'claude-code';

  readonly writerModel: string;
  readonly checkerModel: string;
  private readonly command: string;
  private readonly timeoutMs: number;

  constructor(config: ClaudeCodeConfig = {}) {
    this.writerModel = config.writerModel || DEFAULT_WRITER_MODEL;
    this.checkerModel = config.checkerModel || DEFAULT_CHECKER_MODEL;
    this.command = config.command || 'claude';
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * One prompt through the CLI. A refusal, a reply cut off at the token limit
   * and one that never matched its schema are returned as such, for the
   * caller to abstain on; a CLI that cannot answer throws. Temperature and
   * max tokens have no CLI flag and are not applied.
   */
  async complete(prompt: string, options: AIProviderOptions = {}): Promise<AIResponse> {
    const model = options.model ?? this.writerModel;
    const args = [
      '-p', '--output-format', 'json',
      '--model', model,
      '--tools', '',
      '--setting-sources', '',
      '--safe-mode',
      '--strict-mcp-config',
      '--no-session-persistence',
    ];
    if (options.systemPrompt) args.push('--system-prompt', options.systemPrompt);
    if (options.responseSchema) args.push('--json-schema', JSON.stringify(options.responseSchema.schema));

    const { stdout, stderr, code } = await this.run(args, prompt);
    let output: CliResult;
    try {
      output = JSON.parse(stdout) as CliResult;
    } catch {
      throw new ClaudeCodeError(`${this.command} exited with ${code}: ${stderr.trim().slice(0, 300)}`);
    }

    const usage = usageOf(output);
    const reply = { tokensUsed: usage.totalTokens, model: servedModel(output) ?? model, usage };
    if (output.stop_reason === 'refusal') {
      return { ...reply, content: '', finishReason: 'content_filter', refusal: output.result || 'refusal' };
    }
    if (output.stop_reason === 'max_tokens') {
      return { ...reply, content: output.result ?? '', finishReason: 'length' };
    }
    if (output.subtype === 'error_max_structured_output_retries') {
      // The model never produced output matching the schema: nothing usable
      return { ...reply, content: '', finishReason: 'stop' };
    }
    if (output.is_error || code !== 0) {
      throw new ClaudeCodeError(output.result || `${this.command} exited with ${code}`);
    }
    const content =
      output.structured_output !== undefined ? JSON.stringify(output.structured_output) : output.result ?? '';
    return { ...reply, content, finishReason: 'stop' };
  }

  async completeJSON<T>(prompt: string, _schema?: object, options: AIProviderOptions = {}): Promise<T> {
    const response = await this.complete(prompt, {
      ...options,
      systemPrompt: options.systemPrompt || JSON_SYSTEM_PROMPT,
    });
    return jsonReply<T>(response);
  }

  private run(args: string[], input: string): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.command, args, { cwd: tmpdir(), env: subscriptionEnv(), stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new ClaudeCodeError(`${this.command} timed out after ${this.timeoutMs} ms`));
      }, this.timeoutMs);
      child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
      child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
      child.on('error', (error) => {
        clearTimeout(timer);
        reject(new ClaudeCodeError(`Could not start ${this.command}: ${error.message}`));
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, code });
      });
      // A CLI that exits before reading its prompt is reported by its exit, not by the pipe
      child.stdin.on('error', () => {});
      child.stdin.end(input);
    });
  }
}

/** The model that wrote most of the reply, as the CLI reports it */
function servedModel(output: CliResult): string | undefined {
  const entries = Object.entries(output.modelUsage ?? {});
  entries.sort(([, a], [, b]) => (b.outputTokens ?? 0) - (a.outputTokens ?? 0));
  return entries[0]?.[0];
}

/** Tokens across every model the CLI used. Its input count already includes cached input. */
function usageOf(output: CliResult): AIUsage {
  let promptTokens = 0;
  let completionTokens = 0;
  for (const usage of Object.values(output.modelUsage ?? {})) {
    promptTokens += usage.inputTokens ?? 0;
    completionTokens += usage.outputTokens ?? 0;
  }
  return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
}
