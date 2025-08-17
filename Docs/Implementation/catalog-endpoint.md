# Catalog Endpoint Usage

This guide demonstrates how to start the Control Plane and query the DSP catalog endpoint.

## Start Control Plane

```bash
pnpm build
node packages/control-plane/dist/index.js
```

The server listens on port `3000` by default.

## Query Catalog

```bash
curl http://localhost:3000/dsp/catalog | jq
```

### Example Response

```json
{
  "@context": "https://www.w3.org/ns/dcat2",
  "@type": "dcat:Catalog",
  "@id": "urn:connector:catalog",
  "dcat:dataset": [
    {
      "@type": "dcat:Dataset",
      "@id": "<dataset-id>",
      "dct:title": "Sample Dataset",
      "dct:description": "Example dataset asset"
    }
  ],
  "dcat:service": [
    {
      "@type": "dcat:DataService",
      "@id": "<service-id>",
      "dct:title": "Sample Service",
      "dct:description": "Example service asset",
      "dcat:endpointURL": "https://example.com/service/1"
    }
  ],
  "dct:conformsTo": "https://www.w3.org/TR/vocab-dcat-2/",
  "dct:title": "Connector Catalog",
  "dct:description": "Available assets and services"
}
```
