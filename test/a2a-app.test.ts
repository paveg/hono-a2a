import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { a2aApp } from "../src/index.js";
import { createMockRequestHandler, sampleCard } from "./helpers.js";

describe("a2aApp", () => {
  it("serves agent card at default path", async () => {
    const app = new Hono();
    app.route("/", a2aApp({ requestHandler: createMockRequestHandler() }));

    const res = await app.request("/.well-known/agent-card.json");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(sampleCard);
  });

  it("serves agent card at custom path", async () => {
    const app = new Hono();
    app.route(
      "/",
      a2aApp({
        requestHandler: createMockRequestHandler(),
        agentCardPath: "custom/card.json",
      }),
    );

    const res = await app.request("/custom/card.json");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(sampleCard);
  });

  it("accepts JSON-RPC POST at root", async () => {
    const app = new Hono();
    app.route("/a2a", a2aApp({ requestHandler: createMockRequestHandler() }));

    const res = await app.request("/a2a", {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "message/send",
        params: {
          message: {
            role: "user",
            parts: [{ text: "Hello" }],
            messageId: "msg-1",
          },
        },
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).not.toBe(404);
  });

  it("can be mounted as sub-app", async () => {
    const main = new Hono();
    main.get("/health", (c) => c.text("ok"));
    main.route("/agent", a2aApp({ requestHandler: createMockRequestHandler() }));

    const healthRes = await main.request("/health");
    expect(healthRes.status).toBe(200);

    const cardRes = await main.request("/agent/.well-known/agent-card.json");
    expect(cardRes.status).toBe(200);
  });

  it("returns 404 for unregistered routes", async () => {
    const app = new Hono();
    app.route("/a2a", a2aApp({ requestHandler: createMockRequestHandler() }));

    const res = await app.request("/a2a/nonexistent");
    expect(res.status).toBe(404);
  });

  it("rejects GET on JSON-RPC endpoint", async () => {
    const app = new Hono();
    app.route("/", a2aApp({ requestHandler: createMockRequestHandler() }));

    const res = await app.request("/", { method: "GET" });
    expect(res.status).toBe(404);
  });
});
