// Sites owns OAuth and supplies these trusted identity headers at its hosting boundary.
// The backend accepts only our signed assertion, never a caller-supplied email.
const encode = (value) =>
  btoa(String.fromCharCode(...new Uint8Array(value)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
const jsonPart = (value) =>
  encode(new TextEncoder().encode(JSON.stringify(value)));

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== "/mcp")
      return new Response("Not found", { status: 404 });
    if (request.method !== "POST")
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "POST" },
      });
    const email = request.headers.get("oai-authenticated-user-email");
    const userId = request.headers.get("oai-authenticated-user-id");
    if (!email || !userId) return new Response("Unauthorized", { status: 401 });
    if (!env.MCP_BRIDGE_SECRET)
      return new Response("Service not configured", { status: 503 });
    const backend = new URL(
      env.JD2RESUME_BACKEND_URL ||
        "https://api-jd2resume.theprojectphoenix.top",
    );
    if (backend.protocol !== "https:")
      return new Response("Service not configured", { status: 503 });
    backend.pathname = "/mcp";
    backend.search = "";
    backend.hash = "";
    const now = Math.floor(Date.now() / 1000);
    const input = `${jsonPart({ alg: "HS256", typ: "JWT" })}.${jsonPart({
      iss: "jd2resume-sites",
      aud: "jd2resume-mcp",
      sub: userId,
      email,
      iat: now,
      exp: now + 60,
    })}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.MCP_BRIDGE_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = encode(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input)),
    );
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "X-MCP-Bridge-Token": `${input}.${signature}`,
    });
    for (const name of ["MCP-Protocol-Version", "Mcp-Method", "Mcp-Name"]) {
      if (request.headers.has(name))
        headers.set(name, request.headers.get(name));
    }
    try {
      const response = await fetch(backend, {
        method: "POST",
        headers,
        body: request.body,
        redirect: "error",
        duplex: "half",
      });
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("Content-Type") || "application/json",
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      console.error("JD2Resume backend connection failed", error);
      return new Response("Backend unavailable. Please try again.", {
        status: 502,
      });
    }
  },
};
