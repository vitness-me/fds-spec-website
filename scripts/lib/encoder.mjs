/**
 * The built FDS Encoder, for the scripts that check the specification against it.
 * Exits with status 2 and the build commands when `dist` is missing.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ENCODER = join(dirname(fileURLToPath(import.meta.url)), '../../packages/fds-encoder/dist/index.js');

export async function loadEncoder() {
  if (!existsSync(ENCODER)) {
    console.error(`${ENCODER} does not exist. Build the encoder first:\n  npm --prefix packages/fds-encoder ci && npm --prefix packages/fds-encoder run build`);
    process.exit(2);
  }
  return import(pathToFileURL(ENCODER).href);
}
