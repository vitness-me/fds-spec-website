// Reading JSON inputs — answers files, libraries, movement-word datasets, muscle vocabularies — from a path or a URL.
import { readFile } from 'node:fs/promises';
import { readWordSet } from './words.js';
import type { WordSet } from './words.js';

const isUrl = (where: string): boolean => /^https?:\/\//i.test(where);

/** Parses the JSON at a file path, or at an http(s) URL. The error names the input and what went wrong. */
export async function readJson(where: string): Promise<unknown> {
  let text: string;
  if (isUrl(where)) {
    const res = await fetch(where);
    if (!res.ok) throw new Error(`${where}: HTTP ${res.status} ${res.statusText}`);
    text = await res.text();
  } else {
    try { text = await readFile(where, 'utf8'); } catch (e) { throw new Error(`${where}: ${(e as NodeJS.ErrnoException).code === 'ENOENT' ? 'no such file' : String(e)}`); }
  }
  try { return JSON.parse(text) as unknown; } catch (e) { throw new Error(`${where}: not JSON: ${(e as Error).message}`); }
}

/** Loads and checks a movement-word dataset from a path or a URL. */
export async function loadWordSet(where: string): Promise<WordSet> {
  return readWordSet(await readJson(where), where);
}
