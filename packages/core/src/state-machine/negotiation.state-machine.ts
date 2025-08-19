import { BaseEntity } from '../domain/base-entity';
import type { BaseEntityProps } from '../types';

/**
 * All possible states for a DSP contract negotiation.
 */
export enum NegotiationState {
  REQUESTED = 'REQUESTED',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  AGREED = 'AGREED',
  VERIFIED = 'VERIFIED',
  FINALIZED = 'FINALIZED',
  TERMINATED = 'TERMINATED',
}

/**
 * Allowed state transitions for contract negotiations as defined by DSP.
 */
const ALLOWED_TRANSITIONS: Record<NegotiationState, NegotiationState[]> = {
  [NegotiationState.REQUESTED]: [NegotiationState.OFFERED, NegotiationState.TERMINATED],
  [NegotiationState.OFFERED]: [NegotiationState.ACCEPTED, NegotiationState.TERMINATED],
  [NegotiationState.ACCEPTED]: [
    NegotiationState.AGREED,
    NegotiationState.OFFERED,
    NegotiationState.TERMINATED,
  ],
  [NegotiationState.AGREED]: [NegotiationState.VERIFIED, NegotiationState.TERMINATED],
  [NegotiationState.VERIFIED]: [NegotiationState.FINALIZED, NegotiationState.TERMINATED],
  [NegotiationState.FINALIZED]: [],
  [NegotiationState.TERMINATED]: [],
};

export interface NegotiationProps extends BaseEntityProps {
  state?: NegotiationState;
}

/**
 * Simple state machine representing the lifecycle of a contract negotiation.
 *
 * The machine starts in the `REQUESTED` state and only allows transitions
 * defined by the DSP specification. Invalid transitions throw an error.
 */
export class ContractNegotiation extends BaseEntity {
  private _state: NegotiationState;

  constructor(props: NegotiationProps = {}) {
    super(props);
    this._state = props.state ?? NegotiationState.REQUESTED;
  }

  /** Returns the current negotiation state. */
  get state(): NegotiationState {
    return this._state;
  }

  /**
   * Attempts to transition the negotiation to a new state.
   * @param newState desired target state
   * @throws Error when the transition is not allowed
   */
  transition(newState: NegotiationState): void {
    const allowed = ALLOWED_TRANSITIONS[this._state];
    if (!allowed.includes(newState)) {
      throw new Error(`Invalid transition from ${this._state} to ${newState}`);
    }
    this._state = newState;
  }
}

/**
 * Utility function to verify if a transition between two states is allowed.
 */
export function canTransition(from: NegotiationState, to: NegotiationState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
