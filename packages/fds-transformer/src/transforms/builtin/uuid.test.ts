/**
 * Tests for uuid transform
 */

import { describe, it, expect } from 'vitest';
import { uuid, uuidv5 } from './uuid.js';
import type { TransformContext } from '../../core/types.js';

// UUID v4 regex pattern
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('uuid', () => {
  describe('generation', () => {
    it('should generate a valid UUIDv4', () => {
      const result = uuid(null, {});
      expect(result).toMatch(UUID_V4_REGEX);
    });

    it('should generate unique UUIDs on each call', () => {
      const uuid1 = uuid(null, {});
      const uuid2 = uuid(null, {});
      const uuid3 = uuid(null, {});
      
      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);
    });

    it('should ignore input value', () => {
      const result = uuid('some-value', {});
      expect(result).toMatch(UUID_V4_REGEX);
    });

    it('should ignore options', () => {
      const result = uuid(null, { foo: 'bar' });
      expect(result).toMatch(UUID_V4_REGEX);
    });
  });

  describe('format', () => {
    it('should return lowercase UUID', () => {
      const result = uuid(null, {});
      expect(result).toBe(result.toLowerCase());
    });

    it('should have correct length (36 characters)', () => {
      const result = uuid(null, {});
      expect(result).toHaveLength(36);
    });

    it('should have hyphens at correct positions', () => {
      const result = uuid(null, {});
      expect(result[8]).toBe('-');
      expect(result[13]).toBe('-');
      expect(result[18]).toBe('-');
      expect(result[23]).toBe('-');
    });
  });
});

// RFC 4122 appendix C: the DNS namespace, and its well-known v5 vector.
const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const WWW_EXAMPLE_COM = '2ed6657d-e927-568b-95e1-2665a8aea6a2';

const contextFor = (source: Record<string, unknown>): TransformContext => ({
  source,
  target: {},
  field: 'exerciseId',
  registries: { muscles: [], equipment: [], muscleCategories: [] },
  config: { version: '1.0.0', targetSchema: { version: '1.4.0' }, mappings: {} },
});

describe('uuidv5', () => {
  it('derives the RFC 4122 vector from the mapped value', () => {
    const id = uuidv5('www.example.com', { namespace: DNS_NAMESPACE }, contextFor({}));
    expect(id).toBe(WWW_EXAMPLE_COM);
  });

  it('builds the name from a template over the source record', () => {
    const id = uuidv5(
      null,
      { namespace: DNS_NAMESPACE, name: 'www.{{host.domain}}' },
      contextFor({ host: { domain: 'example.com' } })
    );
    expect(id).toBe(WWW_EXAMPLE_COM);
  });

  it('substitutes {{value}} in the template with the mapped value', () => {
    const id = uuidv5(
      'example',
      { namespace: DNS_NAMESPACE, name: 'www.{{value}}.com' },
      contextFor({})
    );
    expect(id).toBe(WWW_EXAMPLE_COM);
  });

  it('gives the same id on every call for the same input', () => {
    const options = { namespace: DNS_NAMESPACE, name: 'exercises_v6/Exercises/{{v6Id}}' };
    const first = uuidv5(null, options, contextFor({ v6Id: 'abc' }));
    const second = uuidv5(null, options, contextFor({ v6Id: 'abc' }));
    const other = uuidv5(null, options, contextFor({ v6Id: 'abd' }));

    expect(first).toBe(second);
    expect(other).not.toBe(first);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('refuses a template placeholder the source does not fill', () => {
    // An empty placeholder would give every such record the same id.
    expect(() =>
      uuidv5(
        null,
        { namespace: DNS_NAMESPACE, name: 'exercises_v6/Exercises/{{v6Id}}' },
        contextFor({ v6Id: '' })
      )
    ).toThrow(/v6Id/);
  });

  it('refuses an empty name', () => {
    expect(() => uuidv5(undefined, { namespace: DNS_NAMESPACE }, contextFor({}))).toThrow(
      /no name/
    );
  });

  it('refuses a namespace that is not a UUID', () => {
    expect(() => uuidv5('x', { namespace: 'exercises' }, contextFor({}))).toThrow(/namespace/);
    expect(() => uuidv5('x', {}, contextFor({}))).toThrow(/namespace/);
  });
});
