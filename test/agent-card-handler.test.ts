import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import type { AgentCard } from "@a2a-js/sdk";
import { agentCardHandler } from "../src/index.js";
import { sampleCard } from "./helpers.js";

describe("agentCardHandler", () => {
  it("returns agent card from function provider", async () => {
    const app = new Hono();
    app.get(
      "/card",
      agentCardHandler({ agentCardProvider: async () => sampleCard }),
    );

    const res = await app.request("/card");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(sampleCard);
  });

  it("returns agent card from object provider", async () => {
    const app = new Hono();
    app.get(
      "/card",
      agentCardHandler({
        agentCardProvider: { getAgentCard: async () => sampleCard },
      }),
    );

    const res = await app.request("/card");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(sampleCard);
  });

  it("returns 500 on provider error", async () => {
    const app = new Hono();
    app.get(
      "/card",
      agentCardHandler({
        agentCardProvider: async (): Promise<AgentCard> => {
          throw new Error("provider failure");
        },
      }),
    );

    const res = await app.request("/card");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to retrieve agent card");
  });

  it("returns correct Content-Type", async () => {
    const app = new Hono();
    app.get(
      "/card",
      agentCardHandler({ agentCardProvider: async () => sampleCard }),
    );

    const res = await app.request("/card");
    expect(res.headers.get("Content-Type")).toMatch(/application\/json/);
  });
});
