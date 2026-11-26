// The published conformance cases, run against the package's source and, when FDS_ENCODER_REFERENCE names it, against
// the reference tool. scripts/check-conformance.mjs runs the same cases against the built package.
import { describe, expect, test } from 'vitest';
import { adapterFor, failuresOf, loadCases, runCases } from '../../../scripts/lib/conformance.mjs';
import type { ConformanceAdapter } from '../../../scripts/lib/conformance.mjs';
import * as encoder from '../src/index';
import { loadReference, present, referenceAnswers, skipReason, warningCode } from './reference';
import type { Mod, Reference } from './reference';

const cases = loadCases();

describe('conformance cases', () => {
  test('every case file has cases in every group', () => {
    for (const [group, list] of Object.entries(cases)) expect(list.length, group).toBeGreaterThan(0);
  });

  test('pass against the package', () => {
    const report = runCases(adapterFor(encoder, 'package source'), cases);
    expect(failuresOf(report).slice(0, 10)).toEqual([]);
    for (const r of Object.values(report)) expect(r.passed).toBe(r.total);
  });
});

/** The reference tool's API, as a conformance adapter: its comparisons and warnings are named differently. */
function referenceAdapter(R: Reference): ConformanceAdapter {
  const parse = (key: string): Mod | undefined => {
    const t = key.trim();
    return t.startsWith('FXMG=') ? R.fxmg.parseFxmg(t) : t.startsWith('FXM=') ? R.fxm.parseFxm(t)
      : t.startsWith('FXE=') ? R.syntax.parseFxe(t) : t.startsWith('FXI=') ? R.syntax.parseFxi(t) : undefined;
  };
  const RELATION: Record<string, { result: string; specific?: 'a' | 'b' }> = {
    identical: { result: 'same' }, refines: { result: 'more-specific', specific: 'a' }, 'refined-by': { result: 'more-specific', specific: 'b' },
    compatible: { result: 'overlap' }, contradicting: { result: 'different' },
  };
  return {
    name: 'reference tool',
    issueCodes: true,
    check(key) {
      const p = parse(key);
      if (p === undefined) return { ok: false, written: '', issues: ['prefix'] };
      return { ok: p.ok, written: p.canonical, issues: p.issues.map((i: { code: string }) => i.code) };
    },
    compare(a, b) {
      if (a.startsWith('FXI=') || a.startsWith('FXE=')) {
        const r = (a.startsWith('FXI=') ? R.compare.compareFxi(a, b) : R.compare.compareFxe(a, b)) as { relation: string };
        const out = RELATION[r.relation];
        if (out === undefined) throw new Error(`${a} and ${b} don't compare: ${r.relation}`);
        return out;
      }
      if (a.startsWith('FXMG=')) {
        const g = R.fxmg.gradeFxmg(a, b) as { grade: string; specific?: 'a' | 'b' };
        return g.grade === 'more-specific' ? { result: g.grade, specific: g.specific! } : { result: g.grade };
      }
      const g = R.fxm.gradeFxm(a, b) as { grade: string; container?: 'a' | 'b' };
      if (g.grade === 'contains') return { result: 'more-specific', specific: g.container === 'a' ? 'b' : 'a' };
      return { result: g.grade === 'identical' ? 'same' : g.grade === 'overlaps' ? 'overlap' : 'different' };
    },
    crossCheck: (fxi, fxe) => (R.crosscheck.crossCheck(fxi, fxe) as string[]).map(warningCode),
    muscleInCategory: (fxm, fxmg) => R.fxmg.fxmInFxmg(fxm, fxmg).relation as string,
    build(answers) {
      try {
        const b = R.build.build({ id: 'case', answers: referenceAnswers(answers) }) as { fxi: string | null; fxe: string };
        return { fxi: b.fxi, fxe: b.fxe };
      } catch (e) {
        if (e instanceof R.build.AnswerError) return null;
        throw e;
      }
    },
  };
}

describe.skipIf(!present)('conformance cases against the reference tool', async () => {
  if (!present) { test.skip(skipReason, () => {}); return; }
  const R = await loadReference();

  test('pass against the reference tool', () => {
    const report = runCases(referenceAdapter(R), cases);
    console.log(`reference tool: ${Object.entries(report).map(([g, r]) => `${g} ${r.passed}/${r.total}`).join(', ')}`);
    expect(failuresOf(report).slice(0, 10)).toEqual([]);
    for (const r of Object.values(report)) expect(r.passed).toBe(r.total);
  });
});
