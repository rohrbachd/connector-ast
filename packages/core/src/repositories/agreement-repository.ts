import type { ContractAgreement } from '../domain/agreement';
import type { Repository } from './base';

/** Repository interface for ContractAgreement entities. */
export type AgreementRepository = Repository<ContractAgreement>;
