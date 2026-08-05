import { describe, it, expect } from 'vitest';
import { Validator } from './validator.js';

/**
 * The validator previously reported `valid: true` whenever a schema failed to
 * compile or could not be found, which silently passed every record through.
 * These tests lock that failure open.
 */

const GOOD_SCHEMA = {
  $id: 'https://spec.vitness.me/test/good.schema.json',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1 },
  },
};

/** Unresolvable external `$ref` — the exact shape a naive fds-common split produces. */
const UNRESOLVABLE_REF_SCHEMA = {
  $id: 'https://spec.vitness.me/test/broken.schema.json',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    metadata: {
      $ref: 'https://spec.vitness.me/schemas/common/v1.0.0/common.schema.json#/$defs/metadata',
    },
  },
};

describe('Validator', () => {
  describe('schema compilation', () => {
    it('records a compilation error for an unresolvable external $ref', () => {
      const validator = new Validator({ silent: true });
      validator.addSchemas(new Map([['broken', UNRESOLVABLE_REF_SCHEMA]]));

      expect(validator.hasSchemaError('broken')).toBe(true);
      expect(validator.getSchemaError('broken')).toMatch(/can't resolve reference/i);
    });

    it('compiles a self-contained schema without error', () => {
      const validator = new Validator({ silent: true });
      validator.addSchemas(new Map([['good', GOOD_SCHEMA]]));

      expect(validator.hasSchemaError('good')).toBe(false);
    });
  });

  describe('validate() must never silently pass', () => {
    it('returns invalid when the schema failed to compile', () => {
      const validator = new Validator({ silent: true });
      validator.addSchemas(new Map([['broken', UNRESOLVABLE_REF_SCHEMA]]));

      const result = validator.validate({ literally: 'anything' }, 'broken');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].constraint).toBe('schemaUnavailable');
      expect(result.errors[0].field).toBe('_schema');
    });

    it('returns invalid when the schema is not registered', () => {
      const validator = new Validator({ silent: true });

      const result = validator.validate({ literally: 'anything' }, 'never-registered');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].constraint).toBe('schemaNotFound');
    });

    it('does not pass garbage when no schemas were ever added', () => {
      const validator = new Validator({ silent: true });
      validator.addSchemas(new Map());

      const result = validator.validate({ garbage: true }, 'exercise');

      expect(result.valid).toBe(false);
    });
  });

  describe('validate() normal operation is unchanged', () => {
    it('accepts conforming data', () => {
      const validator = new Validator({ silent: true });
      validator.addSchemas(new Map([['good', GOOD_SCHEMA]]));

      const result = validator.validate({ name: 'Back Squat' }, 'good');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects non-conforming data with field-level errors', () => {
      const validator = new Validator({ silent: true });
      validator.addSchemas(new Map([['good', GOOD_SCHEMA]]));

      const result = validator.validate({ wrong: 'field' }, 'good');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Real validation errors are distinguishable from schema-availability errors.
      expect(result.errors.every((e) => e.constraint !== 'schemaNotFound')).toBe(true);
    });

    it('still validates against an inline schema object', () => {
      const validator = new Validator({ silent: true });

      expect(validator.validate({ name: 'ok' }, GOOD_SCHEMA).valid).toBe(true);
      expect(validator.validate({}, GOOD_SCHEMA).valid).toBe(false);
    });
  });
});
