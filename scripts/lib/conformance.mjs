/**
 * The structural-key conformance cases, and a runner that checks one
 * implementation against them.
 *
 * An implementation is reached through an adapter: an object with the five
 * functions below. `adapterFor(encoder)` builds one for the FDS Encoder's API;
 * anyone else writes their own and passes it to scripts/check-conformance.mjs.
 *
 *   check(key)                 → { ok, written, issues? }
 *   compare(a, b)              → { result, specific? }
 *   crossCheck(fxi, fxe)       → warning codes, [] when the keys agree
 *   muscleInCategory(fxm, fxmg) → 'in' | 'partly-in' | 'not-in'
 *   build(answers)             → { fxi, fxe }, or null when the answers are refused
 *
 * `build` is optional: the build cases are answers to the FDS Encoder's question
 * flow, and an implementation without that flow skips them. `issueCodes: true`
 * says the adapter's `issues` are the FDS Encoder's codes, so an invalid case
 * also checks that the key fails for the stated reason.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CASES_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../specification/conformance/structural-keys');

/** The case files, keyed by the group each runs as. */
export function loadCases(dir = CASES_DIR) {
  const read = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const cross = read('cross-check.json');
  return {
    syntax: read('syntax.json').cases,
    compare: read('compare.json').cases,
    build: read('build.json').cases,
    exerciseEquipment: cross.exerciseEquipment,
    muscleInCategory: cross.muscleInCategory,
  };
}

/** An adapter for the FDS Encoder's API: the package, its built `dist`, or its source. */
export function adapterFor(encoder, name = '@vitness/fds-encoder') {
  return {
    name,
    issueCodes: true,
    check(key) {
      const c = encoder.checkKey(key);
      return { ok: c.ok, written: c.written, issues: c.issues.map((i) => i.code) };
    },
    compare(a, b) {
      const c = encoder.compareKeys(a, b);
      return c.specific === undefined ? { result: c.result } : { result: c.result, specific: c.specific };
    },
    crossCheck: (fxi, fxe) => encoder.crossCheck(fxi, fxe).map((w) => w.code),
    muscleInCategory: (fxm, fxmg) => encoder.fxmInFxmg(fxm, fxmg).relation,
    build(answers) {
      try {
        const b = encoder.build({ id: 'case', answers });
        return { fxi: b.fxi, fxe: b.fxe };
      } catch (e) {
        if (e instanceof encoder.AnswerError) return null;
        throw e;
      }
    },
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** What a case expects, and what the adapter gave, in the same shape. */
const GROUPS = {
  syntax: (ad, c) => {
    const r = ad.check(c.input);
    if (!c.valid) {
      const reason = ad.issueCodes ? r.issues ?? [] : [];
      return { want: { valid: false, ...(ad.issueCodes ? { issue: true } : {}) }, got: { valid: r.ok, ...(ad.issueCodes ? { issue: reason.includes(c.issue) } : {}) }, detail: r.ok ? r.written : reason.join(',') };
    }
    return { want: { valid: true, written: c.written }, got: { valid: r.ok, written: r.written }, detail: r.ok ? r.written : (r.issues ?? []).join(',') };
  },
  compare: (ad, c) => ({ want: { result: c.result, specific: c.specific }, got: (({ result, specific }) => ({ result, specific }))(ad.compare(c.a, c.b)) }),
  build: (ad, c) => {
    const r = ad.build(c.answers);
    return { want: c.rejected ? null : { fxi: c.fxi, fxe: c.fxe }, got: r === null ? null : { fxi: r.fxi, fxe: r.fxe } };
  },
  exerciseEquipment: (ad, c) => ({ want: [...c.warnings].sort(), got: [...ad.crossCheck(c.fxi, c.fxe)].sort() }),
  muscleInCategory: (ad, c) => ({ want: c.relation, got: ad.muscleInCategory(c.fxm, c.fxmg) }),
};

/**
 * Runs every case through the adapter. For each group: how many passed, the
 * failures with what was expected and what came back, and how many were skipped
 * because the adapter has no `build`.
 */
export function runCases(adapter, cases) {
  const report = {};
  for (const [group, run] of Object.entries(GROUPS)) {
    const list = cases[group] ?? [];
    const entry = { total: list.length, passed: 0, skipped: 0, failures: [] };
    report[group] = entry;
    if (group === 'build' && typeof adapter.build !== 'function') { entry.skipped = list.length; continue; }
    for (const c of list) {
      try {
        const { want, got, detail } = run(adapter, c);
        if (same(want, got)) entry.passed++;
        else entry.failures.push({ id: c.id, want, got, ...(detail === undefined ? {} : { detail }) });
      } catch (e) {
        entry.failures.push({ id: c.id, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }
  return report;
}

/** Every failure in a report, each named by its group and case id. */
export const failuresOf = (report) => Object.entries(report).flatMap(([group, r]) => r.failures.map((f) => ({ group, ...f })));
