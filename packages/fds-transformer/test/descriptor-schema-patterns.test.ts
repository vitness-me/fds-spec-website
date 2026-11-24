/**
 * The descriptor patterns in the release 1.6.0 schemas agree with the descriptor syntax. The schemas check the
 * envelope of an FXI or FXE (header and one-token body) and the whole of an FXM key; the conformance syntax vectors
 * say which strings are valid. Every canonical string a vector expects must match, and every string a vector rejects
 * for its envelope must not.
 */

import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

interface SyntaxVector {
  id: string;
  kind: 'fxi' | 'fxe' | 'fxm';
  input: string;
  expect: { valid: true; canonical: string } | { valid: false; issues: string[] };
}

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const exercise = read('../src/schemas/bundled/v1.6.0/exercise.schema.json');
const equipment = read('../src/schemas/bundled/v1.6.0/equipment.schema.json');
const vectors: SyntaxVector[] = read('../../../specification/descriptors/conformance/syntax.json').vectors;

const PATTERNS: Record<SyntaxVector['kind'], RegExp> = {
  fxi: new RegExp(exercise.$defs.fxi.pattern, 'u'),
  fxe: new RegExp(equipment.$defs.fxe.pattern, 'u'),
  fxm: new RegExp(exercise.$defs.fxm.pattern, 'u'),
};

/** Vectors whose only fault is the envelope the schema checks: header, revision, or an FXM token. */
const envelopeFault = (v: SyntaxVector): boolean => {
  if (v.expect.valid) return false;
  const [only, ...more] = v.expect.issues;
  if (more.length > 0) return false;
  if (only === 'prefix' || only === 'no-rev' || only === 'major' || (only === 'token' && v.kind === 'fxm')) return true;
  // `rev` is also reported for a revision newer than the checker knows, which the schema accepts: only a leading zero is malformed.
  return only === 'rev' && /^FX[IEM]=1\.0\d/.test(v.input);
};

describe('descriptor patterns in the release 1.6.0 schemas', () => {
  const valid = vectors.filter((v) => v.expect.valid);
  const malformed = vectors.filter(envelopeFault);

  it('has vectors to check against', () => {
    expect(valid.length).toBeGreaterThan(50);
    expect(malformed.map((v) => v.id)).toEqual(expect.arrayContaining(['fxi-revision-leading-zero', 'fxm-uppercase-token', 'fxm-three-levels']));
  });

  it.each(valid.map((v) => [v.id, v] as const))('accepts the canonical string of %s', (_, v) => {
    expect(v.expect.valid && PATTERNS[v.kind].test(v.expect.canonical)).toBe(true);
  });

  it.each(malformed.map((v) => [v.id, v] as const))('rejects %s', (_, v) => {
    expect(PATTERNS[v.kind].test(v.input.trim())).toBe(false);
  });

  it('rejects a leading zero in every descriptor header, and accepts a later revision', () => {
    for (const s of ['FXI=1.00S/m:?/o:?/l:?', 'FXI=1.01S/m:?/o:?/l:?']) expect(PATTERNS.fxi.test(s)).toBe(false);
    for (const s of ['FXE=1.00S/k:none', 'FXE=1.00N/k:none']) expect(PATTERNS.fxe.test(s)).toBe(false);
    expect(new RegExp(exercise.$defs.fxeStandard.pattern, 'u').test('FXE=1.00S/k:none')).toBe(false);
    expect(PATTERNS.fxm.test('FXM=1.00/deltoid')).toBe(false);
    expect(PATTERNS.fxi.test('FXI=1.10S/m:?/o:?/l:?')).toBe(true);
    expect(PATTERNS.fxm.test('FXM=1.10/deltoid')).toBe(true);
  });

  it('takes an FXM group without a part, and a part on a muscle', () => {
    expect(PATTERNS.fxm.test('FXM=1.0/g:hamstrings')).toBe(true);
    expect(PATTERNS.fxm.test('FXM=1.0/g:hamstrings.long')).toBe(false);
    expect(PATTERNS.fxm.test('FXM=1.0/deltoid.acromial')).toBe(true);
  });
});
