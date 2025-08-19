# Negotiation Endpoints Usage

This guide shows how to start the Control Plane and interact with the basic contract negotiation endpoints.

## Start Control Plane

```bash
pnpm build
node packages/control-plane/dist/index.js
```

The server listens on port `3000` by default.

## Create Negotiation

```bash
curl -X POST http://localhost:3000/dsp/negotiations | jq
```

### Example Response

```json
{
  "@id": "<negotiation-id>",
  "state": "REQUESTED"
}
```

## Retrieve Negotiation

```bash
curl http://localhost:3000/dsp/negotiations/<negotiation-id> | jq
```

### Example Response

```json
{
  "@id": "<negotiation-id>",
  "state": "REQUESTED"
}
```
