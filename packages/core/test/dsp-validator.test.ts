import { describe, it, expect } from 'vitest';
import { validateDspMessage } from '../src/dsp/validator.js';
import { randomUUID } from 'node:crypto';

/**
 * Creates a minimal valid DSP message for reuse in tests.
 */
function createValidMessage() {
  return {
    id: randomUUID(),
    type: 'catalog:query',
    timestamp: new Date().toISOString(),
    issuer: 'test-issuer',
    data: {},
  };
}

describe('validateDspMessage', () => {
  it('accepts a valid DSP message', () => {
    const result = validateDspMessage(createValidMessage());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for an invalid DSP message', () => {
    const invalid = { ...createValidMessage() };
    // Remove required property
    delete invalid.issuer;

    const result = validateDspMessage(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('issuer'))).toBe(true);
  });
});
