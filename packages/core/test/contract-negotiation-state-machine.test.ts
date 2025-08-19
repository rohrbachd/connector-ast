import { describe, it, expect } from 'vitest';
import {
  ContractNegotiation,
  NegotiationState,
  canTransition,
} from '../src/state-machine/negotiation.state-machine.js';

describe('ContractNegotiation state machine', () => {
  it('starts in REQUESTED state by default', () => {
    const negotiation = new ContractNegotiation();
    expect(negotiation.state).toBe(NegotiationState.REQUESTED);
  });

  it('transitions through valid states', () => {
    const negotiation = new ContractNegotiation();
    negotiation.transition(NegotiationState.OFFERED);
    negotiation.transition(NegotiationState.ACCEPTED);
    negotiation.transition(NegotiationState.AGREED);
    negotiation.transition(NegotiationState.VERIFIED);
    negotiation.transition(NegotiationState.FINALIZED);
    expect(negotiation.state).toBe(NegotiationState.FINALIZED);
  });

  it('rejects invalid transitions', () => {
    const negotiation = new ContractNegotiation();
    expect(() => negotiation.transition(NegotiationState.ACCEPTED)).toThrow();
  });

  it('validates transitions with helper', () => {
    expect(canTransition(NegotiationState.REQUESTED, NegotiationState.OFFERED)).toBe(true);
    expect(canTransition(NegotiationState.REQUESTED, NegotiationState.ACCEPTED)).toBe(false);
  });
});
