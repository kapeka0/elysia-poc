## Summary

Elysia echoes the full set of incoming request headers in the `found` field of a
422 validation error when a route validates the `headers` schema and the request
fails that validation. If the app runs behind a reverse proxy or API gateway that
injects internal headers, those headers (including internal credentials) are
reflected back to the external client, who never sent them.

Affected version: elysia <= 1.4.29.

## Where it happens

A route declares a `headers` schema. When validation fails, Elysia builds the
error body and copies the request headers into `found` so the caller can see what
was received. With `normalize: false` the header set is not cleaned, so headers
not declared in the schema are included too.

## Preconditions

- A route validates `headers`.
- `normalize: false` (default is `true`).
- The app sits behind a proxy/gateway that adds internal headers.

The external client only needs to trigger the validation failure (e.g. omit the
required header). No authentication is needed.

## Impact

Internal headers the client never sent are disclosed. In a typical edge setup
these carry service tokens, proxy credentials, and similar
internal data. This is an information disclosure that can expose credentials used for internal service-to-service auth.

## Reproduction

See README.md for the runnable 3-tier PoC (proxy + victim + exploit). The client
sends no `x-api-key` and no internal headers, yet the 422 body returns:

```json
{
  "type": "validation",
  "on": "headers",
  "found": {
    "x-real-ip": "203.0.113.77",
    "x-forwarded-for": "203.0.113.77",
    "x-internal-auth": "svc_token_9f83a1c0b7e24d55",
    "x-tenant-id": "acme-corp-internal",
    "host": "localhost:3737"
  }
}
```

## Mitigation

Set `normalize: true` (the default). `.Clean()` then strips headers not declared
in the schema, so `found` shrinks to `{}`. Avoid returning raw request headers in
error responses regardless of the normalize setting.
