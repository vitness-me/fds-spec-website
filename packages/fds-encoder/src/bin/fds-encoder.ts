#!/usr/bin/env node
import { createRequire } from 'node:module';
import { createInterface } from 'node:readline';
import { run } from '../cli.js';

// The version this package was published as, read from the manifest npm ships beside dist/.
const { version } = createRequire(import.meta.url)('../../package.json') as { version: string };

const code = await run(process.argv.slice(2), {
  out: (text) => process.stdout.write(`${text}\n`),
  err: (text) => process.stderr.write(`${text}\n`),
  prompt: (text) => process.stdout.write(text),
  lines: () => createInterface({ input: process.stdin, terminal: false }),
}, version);
process.exitCode = code;
