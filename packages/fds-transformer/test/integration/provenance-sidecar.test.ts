/**
 * The provenance sidecar: one record per written document, validated by the
 * published schema, and byte-identical for the same input.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { Transformer } from '../../src/core/transformer.js';
import {
  PROVENANCE_SCHEMA_URL,
  buildProvenanceSidecar,
  serializeProvenanceSidecar,
} from '../../src/core/provenance.js';
import type { MappingConfig, TransformResult } from '../../src/core/types.js';

const SCHEMA_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../specification/schemas/transformer/provenance/v1.0.0/provenance.schema.json'
);

function publishedValidator() {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  return { schema, validate: ajv.compile(schema) };
}

const CONFIG: MappingConfig = {
  version: '1.0.0',
  targetSchema: { version: '1.4.0', entity: 'exercise' },
  mappings: {
    exerciseId: { from: 'id' },
    'canonical.name': { from: 'name', transform: 'titleCase' },
    'canonical.slug': { from: 'name', transform: 'slugify' },
    'classification.level': { from: 'level', default: 'intermediate' },
    'metadata.createdAt': { from: 'createdAt', transform: 'timestamp' },
  },
  validation: { enabled: false, rejectDefaults: ['classification.level'] },
  enrichment: { enabled: false },
};

const SOURCES = [
  { id: 'a1', name: 'back squat', level: 'advanced', createdAt: '2020-05-17T21:03:21+00:00' },
  { id: 'b2', name: 'push up', createdAt: '2020-05-17T21:03:21+00:00' },
  { id: 'c3', name: 'plank', level: 'beginner', createdAt: '2020-05-17T21:03:21+00:00' },
];

async function run(): Promise<TransformResult[]> {
  return new Transformer({ config: structuredClone(CONFIG) }).transformAll(SOURCES);
}

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Provenance sidecar', () => {
  it('names the published schema it is validated by', () => {
    const { schema } = publishedValidator();
    expect(schema.$id).toBe(PROVENANCE_SCHEMA_URL);
  });

  it('holds one record per written document, in output order, and validates', async () => {
    const results = await run();
    const sidecar = buildProvenanceSidecar(results);
    const { validate } = publishedValidator();

    // b2 took the rejected default, so it is not written and has no record.
    expect(results.map((r) => r.success)).toEqual([true, false, true]);
    expect(sidecar.records.map((r) => [r.id, r.slug])).toEqual([
      ['a1', 'back-squat'],
      ['c3', 'plank'],
    ]);
    expect(sidecar.records[0].fields).toEqual({
      exerciseId: { origin: 'source', from: 'id' },
      'canonical.name': { origin: 'source', from: 'name', transform: ['titleCase'] },
      'canonical.slug': { origin: 'source', from: 'name', transform: ['slugify'] },
      'classification.level': { origin: 'source', from: 'level' },
      'metadata.createdAt': { origin: 'source', from: 'createdAt', transform: ['timestamp'] },
    });
    expect(validate(sidecar), JSON.stringify(validate.errors)).toBe(true);
  });

  it('is byte-identical for the same input', async () => {
    const first = serializeProvenanceSidecar(buildProvenanceSidecar(await run()));
    const second = serializeProvenanceSidecar(buildProvenanceSidecar(await run()));
    expect(second).toBe(first);
  });

  it('serializes with sorted keys, whatever order the fields were recorded in', () => {
    const sidecar = (fields: Record<string, unknown>) =>
      buildProvenanceSidecar([
        { success: true, data: { exerciseId: 'x', canonical: { slug: 'x' } } as any, provenance: fields as any },
      ]);
    const a = sidecar({
      'canonical.slug': { transform: ['slugify'], from: 'name', origin: 'source' },
      exerciseId: { origin: 'default' },
    });
    const b = sidecar({
      exerciseId: { origin: 'default' },
      'canonical.slug': { origin: 'source', from: 'name', transform: ['slugify'] },
    });
    expect(serializeProvenanceSidecar(a)).toBe(serializeProvenanceSidecar(b));
    expect(serializeProvenanceSidecar(a)).toMatch(/"canonical\.slug"[\s\S]*"exerciseId"/);
  });

  it('is rejected by the schema when a model entry lacks what it must carry', () => {
    const { validate } = publishedValidator();
    const sidecar = {
      $schema: PROVENANCE_SCHEMA_URL,
      records: [
        {
          id: 'x',
          slug: 'x',
          fields: { 'canonical.description': { origin: 'model', model: 'm', prompt: 'description' } },
        },
      ],
    };
    expect(validate(sidecar)).toBe(false);
  });
});
