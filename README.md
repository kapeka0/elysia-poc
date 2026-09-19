# Elysia header-leak

A poc demonstrating that Elysia leaks request headers
in the `found` field of a `422` validation error. See the full write-up in
[REPORT.md](REPORT.md).

Reverse proxies / API gateways often enrich upstream requests with internal
headers, and these sometimes carry internal credentials (service tokens, cache
credentials...). Because Elysia echoes the full header set in `found`, those
internal credentials — which the external client never sent and must never see —
leak back in the error response.

```
[ attacker ]  --GET /account-->  [ PROXY :8080 ]  --injects internal headers-->  [ VICTIM :3737 (Elysia) ]
  exploit.ts                     proxy.ts                                        victim.ts
      ^                                                                                |
      |------------------ 422 error with internal headers -------|
```

## Setup

```bash
git clone https://github.com/kapeka0/elysia-poc
cd elysia-poc
bun install
```

## Run (3 terminals)

Terminal 1 — victim (production):

```bash
bun run victim.ts
```

Terminal 2 — proxy:

```bash
bun run proxy.ts
```

Terminal 3 — exploit:

```bash
bun run exploit.ts
```

## Expected result

The attacker sent no `x-api-key` and no internal headers, yet the `422` body echoes
the proxy-injected internal headers:

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

## Temporary mitigation

Set `normalize: true` in `victim.ts` (Elysia's default) and re-run. `.Clean()` now
strips headers not declared in the schema, so `found` shrinks to `{}`:

```json
{ "type": "validation", "on": "headers", "found": {} }
```
