/**
 * A stubbed `claude` executable for tests. Nothing here runs the real CLI.
 *
 * `start()` writes an executable into a fresh temp directory that runs
 * `claude-stub.mjs`. Replies are served one per call, in order, and every call
 * is recorded so a test can assert what the provider sent.
 */

import { mkdtempSync, writeFileSync, chmodSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ClaudeReply {
  stdout: string;
  stderr?: string;
  exitCode?: number;
  delayMs?: number;
  /** Send stdout as two writes, cut at this byte */
  splitAtByte?: number;
  /** Ignore SIGTERM, as a hung CLI might */
  ignoreSigterm?: boolean;
}

export interface ClaudeCall {
  args: string[];
  stdin: string;
  cwd: string;
  /** Environment variable names the CLI was started with; never values */
  env: string[];
  pid: number;
}

const STUB = join(dirname(fileURLToPath(import.meta.url)), 'claude-stub.mjs');

/** The CLI's `--output-format json` result, with the fields the provider reads. */
export function cliResult(
  fields: {
    structured?: unknown;
    result?: string;
    model?: string;
    stopReason?: string;
    subtype?: string;
    isError?: boolean;
    inputTokens?: number;
    outputTokens?: number;
  } = {}
): ClaudeReply {
  const model = fields.model ?? 'claude-opus-5-5';
  const body: Record<string, unknown> = {
    type: 'result',
    subtype: fields.subtype ?? 'success',
    is_error: fields.isError ?? false,
    stop_reason: fields.stopReason ?? 'tool_use',
    result: fields.result ?? (fields.structured === undefined ? '' : JSON.stringify(fields.structured)),
    modelUsage: {
      [model]: {
        inputTokens: fields.inputTokens ?? 300,
        outputTokens: fields.outputTokens ?? 40,
        cacheReadInputTokens: 100,
        cacheCreationInputTokens: 12,
      },
    },
    total_cost_usd: 0.01,
  };
  if (fields.structured !== undefined) body.structured_output = fields.structured;
  return { stdout: JSON.stringify(body), exitCode: body.is_error ? 1 : 0 };
}

/** A structured reply, as the CLI returns one that matched `--json-schema`. */
export const structured = (value: unknown, model?: string): ClaudeReply => cliResult({ structured: value, model });

/** The model declined: the API's `refusal` stop reason. */
export const refusal = (): ClaudeReply =>
  cliResult({ stopReason: 'refusal', result: "I can't help with that request." });

/** The reply reached the output token limit. */
export const maxTokens = (): ClaudeReply =>
  cliResult({ stopReason: 'max_tokens', result: '{"results":[{"slug":"barbell-bench-press","descr' });

/** The CLI gave up after the model's output failed `--json-schema` repeatedly. */
export const structuredRetriesExhausted = (): ClaudeReply =>
  cliResult({ subtype: 'error_max_structured_output_retries', isError: true, result: '' });

/** An API error the CLI reports, as it does for an unknown model. */
export const apiError = (message = 'API Error: 500 Internal server error'): ClaudeReply =>
  cliResult({ isError: true, stopReason: 'stop_sequence', result: message });

export class ClaudeStub {
  private dir = '';

  /** The executable to configure as `claudeCode.command`. */
  get command(): string {
    return join(this.dir, 'claude');
  }

  start(): this {
    this.dir = mkdtempSync(join(tmpdir(), 'claude-stub-'));
    writeFileSync(this.command, `#!/bin/sh\nexec "${process.execPath}" "${STUB}" "${this.dir}" "$@"\n`);
    chmodSync(this.command, 0o755);
    return this;
  }

  /** Queue replies, served one per call in order, after any already queued. */
  reply(...replies: ClaudeReply[]): this {
    const queued = readdirSync(this.dir).filter((name) => name.startsWith('reply-')).length;
    replies.forEach((reply, i) => writeFileSync(join(this.dir, `reply-${queued + i}.json`), JSON.stringify(reply)));
    return this;
  }

  /** Every call made so far, in order. */
  get calls(): ClaudeCall[] {
    const count = readdirSync(this.dir).filter((name) => name.startsWith('call-')).length;
    return Array.from({ length: count }, (_, i) =>
      JSON.parse(readFileSync(join(this.dir, `call-${i}.json`), 'utf-8')) as ClaudeCall
    );
  }

  stop(): void {
    rmSync(this.dir, { recursive: true, force: true });
  }
}

/** The value a call passed for `flag`, or undefined. */
export function flagValue(call: ClaudeCall, flag: string): string | undefined {
  const at = call.args.indexOf(flag);
  return at === -1 ? undefined : call.args[at + 1];
}
