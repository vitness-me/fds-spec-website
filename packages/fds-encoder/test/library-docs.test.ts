// The Library API page documents every public export of the package.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import * as encoder from '../src/index';

const page = readFileSync(fileURLToPath(new URL('../../../website/docs/tools/encoder/library-api.md', import.meta.url)), 'utf8');
const index = readFileSync(fileURLToPath(new URL('../src/index.ts', import.meta.url)), 'utf8');
const typeNames = [...index.matchAll(/export type \{([^}]+)\}/g)].flatMap((m) => m[1]!.split(',').map((n) => n.trim()).filter((n) => n !== ''));
const documented = (name: string): boolean => new RegExp(`\`${name}[\`(]`).test(page);

test('every exported value is on the Library API page', () => {
  expect(Object.keys(encoder).filter((name) => !documented(name))).toEqual([]);
});

test('every exported type is on the Library API page', () => {
  expect(typeNames.length).toBeGreaterThan(40);
  expect(typeNames.filter((name) => !documented(name))).toEqual([]);
});

test('nothing removed from the package is still exported', () => {
  expect(Object.keys(encoder)).not.toContain('gradeFxmgText');
});
