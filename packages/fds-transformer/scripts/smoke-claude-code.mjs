#!/usr/bin/env node
/**
 * Manual smoke test: enrich two exercises through the real `claude` CLI.
 *
 * Not part of CI, and never run by the test suite. It needs the CLI installed
 * and signed in to a Claude subscription (run `claude` once and log in, or set
 * CLAUDE_CODE_OAUTH_TOKEN from `claude setup-token`). It reads no key: API
 * keys, proxies and cloud-provider variables are removed from the CLI's
 * environment, so a CLI that is signed in only through one of those reports
 * that it is not logged in.
 *
 *   npm run build
 *   node scripts/smoke-claude-code.mjs [writer-model]
 *
 * One call, with the writer model (default claude-opus-5-5), for a description
 * and an exercise type per exercise. It prints what was written and where each
 * value came from.
 */

import { Transformer } from '../dist/index.js';

const writerModel = process.argv[2];
const tier = { model: 'unused-under-claude-code', temperature: 0, maxTokens: 1024, batchSize: 25, priority: 'balanced' };

const transformer = new Transformer({
  config: {
    version: '1.0.0',
    targetSchema: { version: '1.4.0', entity: 'exercise' },
    mappings: {
      exerciseId: { from: 'id' },
      'canonical.name': { from: 'name' },
      'canonical.slug': { from: 'name', transform: 'slugify' },
    },
    enrichment: {
      enabled: true,
      provider: 'claude-code',
      claudeCode: writerModel ? { writerModel } : {},
      tiers: { simple: tier, medium: tier, complex: { ...tier, batchSize: 1 } },
      fields: {
        'canonical.description': { tier: 'simple', prompt: 'description' },
        'classification.exerciseType': { tier: 'simple', prompt: 'classification-simple' },
      },
      checkpoint: { enabled: false, saveInterval: 1 },
    },
    validation: { enabled: false },
  },
});

const sources = [
  { id: 'smoke-1', name: 'Barbell Back Squat' },
  { id: 'smoke-2', name: 'Push Up' },
];

const started = Date.now();
const { results, stats, errors } = await transformer.transformAllBatch(sources);

for (const result of results) {
  const { exerciseId, canonical, classification } = result.data ?? {};
  console.log(`\n${exerciseId} ${canonical?.slug}`);
  console.log(`  description:  ${canonical?.description ?? '(not written)'}`);
  console.log(`  exerciseType: ${classification?.exerciseType ?? '(not written)'}`);
  for (const [path, origin] of Object.entries(result.provenance ?? {})) {
    if (origin.origin === 'model') {
      const { provider, model, prompt, promptVersion, tier: answeredBy, confidence } = origin;
      console.log(`  ${path}: ${JSON.stringify({ provider, model, prompt, promptVersion, tier: answeredBy, confidence })}`);
    }
  }
}

console.log(`\nrecords ${stats.total}, enriched ${stats.enriched}, calls ${stats.apiCalls}, tokens ${stats.tokensUsed}, ${Date.now() - started} ms`);
for (const error of errors) console.log(`error: ${error.exerciseId ?? error.index}: ${error.error}`);
process.exitCode = stats.enriched === stats.total && errors.length === 0 ? 0 : 1;
