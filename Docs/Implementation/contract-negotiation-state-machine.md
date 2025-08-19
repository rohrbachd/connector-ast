# Contract Negotiation State Machine

The connector now includes a standalone state machine that models the lifecycle of a DSP contract negotiation.
It implements the progression from an initial request to a finalized or terminated agreement while guarding
against invalid transitions.

## Supported States

`REQUESTED → OFFERED → ACCEPTED → AGREED → VERIFIED → FINALIZED`

At any stage the negotiation may also transition to `TERMINATED`.

## Trying It Out

This feature is available via the `@connector/core` package and can be executed in a Node.js environment.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Run a demonstration script

Create a file named `demo.ts` with the following content:

```ts
import { ContractNegotiation, NegotiationState } from '@connector/core';

const negotiation = new ContractNegotiation();
console.log(negotiation.state); // REQUESTED

negotiation.transition(NegotiationState.OFFERED);
negotiation.transition(NegotiationState.ACCEPTED);
console.log(negotiation.state); // ACCEPTED
```

Execute the script with:

```bash
pnpm ts-node demo.ts
```

You should see:

```
REQUESTED
ACCEPTED
```

Invalid transitions throw an error:

```ts
negotiation.transition(NegotiationState.FINALIZED); // throws
```

This state machine will be used by upcoming negotiation endpoints to manage DSP contract lifecycles.
