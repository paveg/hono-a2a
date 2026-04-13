import { Hono } from "hono";
import { AGENT_CARD_PATH } from "@a2a-js/sdk";
import { jsonRpcHandler } from "./json-rpc-handler.js";
import { agentCardHandler } from "./agent-card-handler.js";
import { UserBuilder, type A2AAppOptions } from "./types.js";

export function a2aApp(options: A2AAppOptions): Hono {
  const app = new Hono();
  const userBuilder = options.userBuilder ?? UserBuilder.noAuthentication;
  const cardProvider = options.agentCardProvider ?? options.requestHandler;
  const cardPath = options.agentCardPath ?? AGENT_CARD_PATH;

  app.post(
    "/",
    jsonRpcHandler({ requestHandler: options.requestHandler, userBuilder }),
  );

  app.get(
    `/${cardPath}`,
    agentCardHandler({ agentCardProvider: cardProvider }),
  );

  return app;
}
