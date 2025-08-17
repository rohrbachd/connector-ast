# DSP Message Validation Usage

This guide demonstrates how to validate a Dataspace Protocol (DSP) message using the shared validation utility.

## Build the project

```bash
pnpm build
```

## Run a validation example

```bash
node -e "import { validateDspMessage } from './packages/core/dist/dsp/validator.js';
const msg = { id: '123e4567-e89b-12d3-a456-426614174000', type: 'catalog:query', timestamp: new Date().toISOString(), issuer: 'did:web:example', data: {} };
console.log(validateDspMessage(msg));"
```

**Expected output**

```
{ valid: true, errors: [] }
```

The validator returns `valid: false` with a list of error messages when the message does not conform to the schema.
