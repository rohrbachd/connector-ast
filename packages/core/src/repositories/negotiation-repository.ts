import type { ContractNegotiation } from '../state-machine/negotiation.state-machine';
import type { Repository } from './base';

/** Repository interface for ContractNegotiation entities. */
export type NegotiationRepository = Repository<ContractNegotiation>;
