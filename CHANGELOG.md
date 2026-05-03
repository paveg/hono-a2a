# hono-a2a

## 0.1.0

### Minor Changes

- [#5](https://github.com/paveg/hono-a2a/pull/5) [`f06a695`](https://github.com/paveg/hono-a2a/commit/f06a6954af02d11508a64d1c0afbb858175e2807) Thanks [@paveg](https://github.com/paveg)! - Initial public release.

  Hono adapter for the A2A (Agent-to-Agent) protocol — serve A2A agents on Cloudflare Workers, Deno, Bun, and Node.js with zero production dependencies.

  **Public API**

  - `a2aApp(options)` — returns a Hono sub-app with JSON-RPC and agent card routes
  - `jsonRpcHandler(options)` — Hono handler for A2A JSON-RPC 2.0 (incl. SSE streaming)
  - `agentCardHandler(options)` — Hono handler that serves the agent card as JSON
  - `UserBuilder` — type and `noAuthentication` default value
  - Types: `A2AAppOptions`, `JsonRpcHandlerOptions`, `AgentCardHandlerOptions`, `AgentCardProvider`

  **Compatibility**

  - Targets the A2A protocol version supported by `@a2a-js/sdk@^0.3.x` (peer dep). Catch-up to A2A v1.0 (renamed methods, restructured agent card, JWS signatures, multi-tenancy) will land in a future release once `@a2a-js/sdk` adopts v1.0.
  - Hono `>=4.0.0`, Node `>=22`.
  - Runtimes: Cloudflare Workers, Deno, Bun, Node.js.

See https://github.com/paveg/hono-a2a/releases for release notes.
