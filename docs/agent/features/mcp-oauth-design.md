# MCP Google authentication

Implemented for the MCP endpoint only. See [the MCP feature guide](mcp.md) for
configuration, routes, client support and security behavior. The website's existing
Google login, callback and account creation remain independent.

The flow uses browser consent, the existing Google credentials with an additional
MCP callback, and the installed MCP SDK's authorization-code/PKCE validation.
MCP identifies an existing account by Google subject and lists its resumes without
an email argument. Opaque access/refresh credentials and one-use authorization
codes are backed by the existing MongoDB database.

The optional Sites adapter retains Sites-managed authentication at its hosting
boundary. Direct endpoint clients use the MCP OAuth flow.

References:

- [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [Google OpenID Connect identity](https://developers.google.com/identity/openid-connect/openid-connect)
- [OpenAI MCP authentication](https://developers.openai.com/plugins/build/auth)
