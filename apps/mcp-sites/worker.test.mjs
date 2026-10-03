import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import worker from "./worker.mjs";

test("requires authenticated Sites identity and configured bridge secret", async () => {
  assert.equal(
    (
      await worker.fetch(
        new Request("https://site.example/mcp", { method: "POST" }),
        {},
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://site.example/mcp", {
          method: "POST",
          headers: {
            "oai-authenticated-user-email": "owner@example.com",
            "oai-authenticated-user-id": "site-user",
          },
        }),
        {},
      )
    ).status,
    503,
  );
});

test("signs the verified identity and forwards only MCP headers to /mcp", async () => {
  const originalFetch = globalThis.fetch;
  const secret = "local-test-secret";
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "https://api.example/mcp");
    assert.equal(options.headers.has("Authorization"), false);
    assert.equal(options.headers.has("oai-authenticated-user-email"), false);
    const [header, payload, signature] = options.headers
      .get("X-MCP-Bridge-Token")
      .split(".");
    assert.equal(
      signature,
      createHmac("sha256", secret)
        .update(`${header}.${payload}`)
        .digest("base64url"),
    );
    const identity = JSON.parse(Buffer.from(payload, "base64url").toString());
    assert.equal(identity.email, "owner@example.com");
    assert.equal(identity.exp - identity.iat, 60);
    assert.equal(identity.aud, "jd2resume-mcp");
    return Response.json({ jsonrpc: "2.0", id: 1, result: {} });
  };
  try {
    const response = await worker.fetch(
      new Request("https://site.example/mcp", {
        method: "POST",
        body: "{}",
        headers: {
          "oai-authenticated-user-email": "owner@example.com",
          "oai-authenticated-user-id": "site-user",
          Authorization: "Bearer caller-token",
        },
      }),
      {
        MCP_BRIDGE_SECRET: secret,
        JD2RESUME_BACKEND_URL: "https://api.example/api/v1",
      },
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
