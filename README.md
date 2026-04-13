# hono-a2a

[![npm version](https://img.shields.io/npm/v/hono-a2a)](https://www.npmjs.com/package/hono-a2a)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[Hono](https://hono.dev/) adapter for the [A2A (Agent-to-Agent) protocol](https://a2a-protocol.org/).

Serve A2A agents on **Cloudflare Workers, Deno, Bun, and Node.js** with zero production dependencies.

## Install

```bash
# npm
npm install hono-a2a hono @a2a-js/sdk

# pnpm
pnpm add hono-a2a hono @a2a-js/sdk
```

## Quick Start

```typescript
import { Hono } from "hono";
import { DefaultRequestHandler, InMemoryTaskStore } from "@a2a-js/sdk/server";
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

- **`POST /`** — JSON-RPC 2.0 endpoint (`message/send`, `message/stream`, `tasks/get`, `tasks/cancel`, etc.)
- **`GET /.well-known/agent-card.json`** — Agent card discovery

## Individual Handlers

For more control, use the handlers directly:

```typescript
import { Hono } from "hono";
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

> **Note:** When using individual handlers instead of `a2aApp()`, you are responsible for applying body size limits yourself. See [Security](#security).

## Custom Authentication

The `userBuilder` receives Hono's `Context`, giving access to headers and middleware-set variables:

```typescript
import { Hono } from "hono";
import { jsonRpcHandler } from "hono-a2a";
import type { UserBuilder } from "hono-a2a";

const userBuilder: UserBuilder = async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  const user = await verifyToken(token);
  return { isAuthenticated: true, userName: user.id };
};

const app = new Hono();
app.post("/a2a", jsonRpcHandler({ requestHandler, userBuilder }));
```

## Mounting as a Sub-App

`a2aApp()` returns a standard `Hono` instance, so you can mount it at any path:

```typescript
const main = new Hono();
main.get("/health", (c) => c.text("ok"));
main.route("/agent", a2aApp({ requestHandler }));
// Agent card: GET /agent/.well-known/agent-card.json
// JSON-RPC:   POST /agent/
```

## API

### `a2aApp(options)`

Returns a `Hono` sub-app with JSON-RPC and agent card routes.

| Option | Type | Default | Description |
|---|---|---|---|
| `requestHandler` | `A2ARequestHandler` | **required** | The A2A request handler |
| `userBuilder` | `UserBuilder` | `noAuthentication` | Authentication builder |
| `agentCardPath` | `string` | `".well-known/agent-card.json"` | Agent card endpoint path |
| `agentCardProvider` | `AgentCardProvider` | `requestHandler` | Agent card data source |
| `maxBodySize` | `number` | `102400` (100KB) | Max request body size in bytes |

### `jsonRpcHandler(options)`

Hono handler for A2A JSON-RPC 2.0 requests. Supports streaming via Server-Sent Events (SSE).

| Option | Type | Default | Description |
|---|---|---|---|
| `requestHandler` | `A2ARequestHandler` | **required** | The A2A request handler |
| `userBuilder` | `UserBuilder` | `noAuthentication` | Authentication builder |

### `agentCardHandler(options)`

Hono handler that serves the agent card as JSON.

| Option | Type | Description |
|---|---|---|
| `agentCardProvider` | `AgentCardProvider` | Function or object with `getAgentCard()` |

### `UserBuilder.noAuthentication`

Default user builder that returns an unauthenticated user. Equivalent to the Express adapter's `UserBuilder.noAuthentication`.

## Security

### Body Size Limit

`a2aApp()` applies a **100KB body size limit** by default (matching Express's `express.json()` default). Oversized requests receive a `413` response with a JSON-RPC parse error.

To customize:

```typescript
a2aApp({
  requestHandler,
  maxBodySize: 1024 * 1024, // 1MB
});
```

When using `jsonRpcHandler()` directly, apply [`bodyLimit`](https://hono.dev/docs/middleware/builtin/body-limit) yourself:

```typescript
import { bodyLimit } from "hono/body-limit";

app.post(
  "/a2a",
  bodyLimit({ maxSize: 102400 }),
  jsonRpcHandler({ requestHandler }),
);
```

### Error Handling

Internal error details are never leaked to clients. When non-`A2AError` exceptions occur, the handler returns a generic error message and logs the original error server-side.

## Supported A2A Methods

All methods supported by `@a2a-js/sdk`'s `JsonRpcTransportHandler`:

| Method | Description |
|---|---|
| `message/send` | Send a message to the agent |
| `message/stream` | Send a message with SSE streaming response |
| `tasks/get` | Get task by ID |
| `tasks/cancel` | Cancel a running task |
| `tasks/resubscribe` | Resubscribe to task updates (SSE) |
| `tasks/pushNotificationConfig/set` | Set push notification config |
| `tasks/pushNotificationConfig/get` | Get push notification config |
| `tasks/pushNotificationConfig/list` | List push notification configs |
| `tasks/pushNotificationConfig/delete` | Delete push notification config |
| `agent/getAuthenticatedExtendedCard` | Get extended agent card (authenticated) |

## Compatibility

- **Hono** >= 4.0.0
- **@a2a-js/sdk** >= 0.3.0
- **Runtimes:** Cloudflare Workers, Deno, Bun, Node.js (>= 22)

## License

[Apache-2.0](./LICENSE)
