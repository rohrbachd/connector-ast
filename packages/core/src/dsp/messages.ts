import type { JSONSchema } from '../types';

/**
 * Basic DSP message envelope shared across all protocol messages.
 * @template T payload type carried by the message
 */
export interface DspMessage<T = unknown> {
  /** Unique message identifier */
  id: string;
  /** DSP message type, e.g. catalog:query */
  type: string;
  /** ISO-8601 timestamp when the message was created */
  timestamp: string;
  /** Identifier of the sending participant */
  issuer: string;
  /** Message payload */
  data: T;
}

/** JSON Schema for the basic DSP message envelope */
export const dspMessageSchema: JSONSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    type: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    issuer: { type: 'string' },
    data: { type: 'object', additionalProperties: true },
  },
  required: ['id', 'type', 'timestamp', 'issuer', 'data'],
  additionalProperties: false,
};
