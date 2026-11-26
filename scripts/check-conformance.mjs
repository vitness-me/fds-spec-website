#!/usr/bin/env node
/**
 * Runs the structural-key conformance cases in
 * specification/conformance/structural-keys/ against an implementation.
 *
 * By default the implementation is the built FDS Encoder, so build it first:
 *
 *   npm --prefix packages/fds-encoder ci && npm --prefix packages/fds-encoder run build
 *   node scripts/check-conformance.mjs                         the FDS Encoder
 *   node scripts/check-conformance.mjs --adapter ./adapter.mjs  another implementation
 *   node scripts/check-conformance.mjs --self-test              prove each group fails on a wrong answer
 *
 * An adapter module's default export is an object with check, compare,
 * crossCheck, muscleInCategory and, optionally, build. scripts/lib/conformance.mjs
 * and the README beside the cases describe what each returns.
 */

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { adapterFor, failuresOf, loadCases, runCases } from './lib/conformance.mjs';
import { loadEncoder } from './lib/encoder.mjs';

const argAfter = (flag) => { const i = process.argv.indexOf(flag); return i < 0 ? undefined : process.argv[i + 1]; };

const encoderAdapter = async () => adapterFor(await loadEncoder());

const cases = loadCases();

if (process.argv.includes('--self-test')) {
  const good = await encoderAdapter();
  // Each broken adapter gets one function wrong; the group that uses it must fail and nothing else may.
  const broken = {
    syntax: { ...good, check: (k) => { const r = good.check(k); return { ...r, written: `${r.written}x` }; } },
    'syntax (reason)': { ...good, check: (k) => ({ ...good.check(k), issues: [] }) },
    compare: { ...good, compare: () => ({ result: 'same' }) },
    build: { ...good, build: () => null },
    exerciseEquipment: { ...good, crossCheck: () => [] },
    muscleInCategory: { ...good, muscleInCategory: () => 'in' },
  };
  const problems = [];
  const clean = failuresOf(runCases(good, cases));
  if (clean.length > 0) problems.push(`the FDS Encoder fails ${clean.length} case(s); run without --self-test to see them`);
  for (const [name, adapter] of Object.entries(broken)) {
    const group = name.split(' ')[0];
    const failed = new Set(failuresOf(runCases(adapter, cases)).map((f) => f.group));
    if (!failed.has(group)) problems.push(`${name}: a wrong answer passed`);
    for (const g of failed) if (g !== group) problems.push(`${name}: ${g} failed too`);
  }
  const { build: _omit, ...withoutBuild } = good;
  const skipped = runCases(withoutBuild, cases).build;
  if (skipped.skipped !== cases.build.length || skipped.failures.length > 0) problems.push('an adapter without build does not skip the build cases');
  if (problems.length > 0) { console.error(problems.join('\n')); process.exit(1); }
  console.log('  ok    self-test — every group fails on a wrong answer, and only that group');
  process.exit(0);
}

const adapterPath = argAfter('--adapter');
const adapter = adapterPath === undefined ? await encoderAdapter() : (await import(pathToFileURL(resolve(adapterPath)).href)).default;
const report = runCases(adapter, cases);

console.log(`conformance cases against ${adapter.name ?? adapterPath}`);
for (const [group, r] of Object.entries(report)) {
  const skipped = r.skipped > 0 ? `, ${r.skipped} skipped` : '';
  console.log(`  ${group.padEnd(18)} ${r.passed}/${r.total} passed${skipped}`);
}
const failures = failuresOf(report);
if (failures.length > 0) {
  console.error(`\n${failures.length} case(s) failed:\n`);
  for (const f of failures.slice(0, 50)) console.error(`  ${f.group} ${f.id}: ${JSON.stringify(f.error ?? { want: f.want, got: f.got, detail: f.detail })}`);
  if (failures.length > 50) console.error(`  … and ${failures.length - 50} more`);
  process.exit(1);
}
