#!/usr/bin/env node
/**
 * A stand-in for the `claude` CLI in print mode.
 *
 * Usage: claude-stub.mjs <dir> [claude arguments...]
 *
 * Call n records its arguments, stdin, working directory and environment
 * variable *names* to `<dir>/call-<n>.json`, then answers with
 * `<dir>/reply-<n>.json`: `{ stdout, stderr?, exitCode?, delayMs? }`. With no
 * reply queued it fails the way the CLI does. It never reads a value from its
 * environment and never touches the network.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [dir, ...args] = process.argv.slice(2);

let stdin = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => (stdin += chunk));
process.stdin.on('end', () => {
  const n = readdirSync(dir).filter((name) => name.startsWith('call-')).length;
  writeFileSync(
    join(dir, `call-${n}.json`),
    JSON.stringify({ args, stdin, cwd: process.cwd(), env: Object.keys(process.env).sort() })
  );

  const replyPath = join(dir, `reply-${n}.json`);
  const reply = existsSync(replyPath)
    ? JSON.parse(readFileSync(replyPath, 'utf-8'))
    : {
        stdout: JSON.stringify({ type: 'result', subtype: 'success', is_error: true, result: 'stub: no reply queued' }),
        exitCode: 1,
      };

  setTimeout(() => {
    process.stdout.write(reply.stdout ?? '');
    process.stderr.write(reply.stderr ?? '');
    process.exitCode = reply.exitCode ?? 0;
  }, reply.delayMs ?? 0);
});
