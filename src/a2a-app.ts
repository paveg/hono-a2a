import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { AGENT_CARD_PATH } from "@a2a-js/sdk";
import { jsonRpcHandler } from "./json-rpc-handler.js";
import { agentCardHandler } from "./agent-card-handler.js";
import { UserBuilder, type A2AAppOptions } from "./types.js";

const DEFAULT_MAX_BODY_SIZE = 102400; // 100KB, matching Express default

export function a2aApp(options: A2AAppOptions): Hono {
  const app = new Hono();
  const userBuilder = options.userBuilder ?? UserBuilder.noAuthentication;
  const cardProvider = options.agentCardProvider ?? options.requestHandler;
  const cardPath = options.agentCardPath ?? AGENT_CARD_PATH;
  const maxSize = options.maxBodySize ?? DEFAULT_MAX_BODY_SIZE;

  app.post(
    "/",
    bodyLimit({
      maxSize,
      onError: (c) =>
        c.json(
          {
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Payload too large" },
          },
          413,
        ),
    }),
    jsonRpcHandler({ requestHandler: options.requestHandler, userBuilder }),
  );

  app.get(
    `/${cardPath}`,
    agentCardHandler({ agentCardProvider: cardProvider }),
  );

  return app;
}
