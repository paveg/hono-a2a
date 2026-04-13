# hono-a2a

Hono adapter for the [A2A (Agent-to-Agent) protocol](https://a2a-protocol.org/).

Brings A2A server support to [Hono](https://hono.dev/) — works on Cloudflare Workers, Deno, Bun, and Node.js.

## Install

```bash
npm install hono-a2a hono @a2a-js/sdk
```

## Quick Start

```typescript
import { Hono } from "hono";
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
} from "@a2a-js/sdk/server";
import { a2aApp } from "hono-a2a";

const agentCard = {
  name: "my-agent",
  url: "https://example.com",
  version: "1.0.0",
  capabilities: { streaming: true },
  skills: [{ id: "chat", name: "Chat" }],
};

const requestHandler = new DefaultRequestHandler(
  agentCard,
  new InMemoryTaskStore(),
  myAgentExecutor, // your AgentExecutor implementation
);

const app = new Hono();
app.route("/", a2aApp({ requestHandler }));

export default app;
```

This serves:
- `POST /` — JSON-RPC 2.0 endpoint (supports `message/send`, `message/stream`, `tasks/get`, `tasks/cancel`, etc.)
- `GET /.well-known/agent-card.json` — Agent card

## Individual Handlers

For more control, use the handlers directly:

```typescript
import { jsonRpcHandler, agentCardHandler, UserBuilder } from "hono-a2a";

const app = new Hono();

app.post(
  "/a2a",
  jsonRpcHandler({
    requestHandler,
    userBuilder: UserBuilder.noAuthentication,
  }),
);

app.get(
  "/.well-known/agent-card.json",
  agentCardHandler({ agentCardProvider: requestHandler }),
);
```

## Custom Authentication

```typescript
import { jsonRpcHandler } from "hono-a2a";
import type { UserBuilder } from "hono-a2a";

const userBuilder: UserBuilder = async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  // validate token...
  return { isAuthenticated: true, userName: "user-123" };
};

app.post("/a2a", jsonRpcHandler({ requestHandler, userBuilder }));
```

## API

### `a2aApp(options)`

Returns a `Hono` sub-app with JSON-RPC and agent card routes.

| Option | Type | Default | Description |
|---|---|---|---|
| `requestHandler` | `A2ARequestHandler` | required | The A2A request handler |
| `userBuilder` | `UserBuilder` | `noAuthentication` | Auth builder |
| `agentCardPath` | `string` | `.well-known/agent-card.json` | Agent card path |
| `agentCardProvider` | `AgentCardProvider` | `requestHandler` | Agent card provider |

### `jsonRpcHandler(options)`

Hono handler for A2A JSON-RPC 2.0 requests. Supports streaming via SSE.

### `agentCardHandler(options)`

Hono handler that serves the agent card JSON.

### `UserBuilder.noAuthentication`

Default user builder that returns an unauthenticated user.

## License

MIT
