// The conformance suite defines the issue codes a checker reports. Every code this parser can emit must be defined (and,
// through scripts/check-conformance.mjs, tested) there, and every code defined there must be one this parser emits.
// Without this, a new check in the parser would ship a code no other implementation knows to report.
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { REPO } from './support.js';

const SOURCES = ['syntax.ts', 'fxm.ts'];
const emitted = new Set(
  SOURCES.flatMap((f) => [...readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8').matchAll(/(?:log\.add\(|code: )'([a-z-]+)'/g)].map((m) => m[1]!)),
);
const defined = new Set(Object.keys(JSON.parse(readFileSync(`${REPO}specification/descriptors/conformance/syntax.json`, 'utf8')).codes as object));

describe('the syntax conformance vectors define exactly the issue codes this parser reports', () => {
  test('the scan finds codes at all', () => expect(emitted.size).toBeGreaterThan(20));
  test('every emitted code is defined', () => expect([...emitted].filter((c) => !defined.has(c)).sort()).toEqual([]));
  test('every defined code is emitted', () => expect([...defined].filter((c) => !emitted.has(c)).sort()).toEqual([]));
});
