import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { dspMessageSchema } from './messages';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(dspMessageSchema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a DSP message against the common envelope schema.
 * @param message unknown message input
 * @returns validation result with error details when invalid
 */
export function validateDspMessage(message: unknown): ValidationResult {
  const valid = validate(message) as boolean;
  const errors = (validate.errors || []).map(formatError);
  return { valid, errors };
}

function formatError(error: ErrorObject): string {
  return `${error.instancePath || '/'} ${error.message || ''}`.trim();
}
