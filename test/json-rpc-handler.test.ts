import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import { jsonRpcHandler } from "../src/index.js";
import {
  createMockRequestHandler,
  streamableCard,
  jsonRpcRequest,
} from "./helpers.js";

describe("jsonRpcHandler", () => {
  describe("JSON parsing", () => {
    it("returns parse error (-32700) for invalid JSON", async () => {
      const app = new Hono();
      app.post("/", jsonRpcHandler({ requestHandler: createMockRequestHandler() }));

      const res = await app.request("/", {
        method: "POST",
        body: "not json",
        headers: { "Content-Type": "application/json" },
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.jsonrpc).toBe("2.0");
      expect(body.id).toBeNull();
      expect(body.error.code).toBe(-32700);
    });

    it("returns parse error for empty body", async () => {
      const app = new Hono();
      app.post("/", jsonRpcHandler({ requestHandler: createMockRequestHandler() }));

      const res = await app.request("/", {
        method: "POST",
        body: "",
        headers: { "Content-Type": "application/json" },
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe(-32700);
    });
  });

  describe("JSON-RPC routing", () => {
    it("returns method-not-found for unknown method", async () => {
      const app = new Hono();
      app.post("/", jsonRpcHandler({ requestHandler: createMockRequestHandler() }));

      const res = await app.request(
        "/",
        jsonRpcRequest("nonexistent/method", {}),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.jsonrpc).toBe("2.0");
      expect(body.id).toBe("req-1");
      expect(body.error).toBeDefined();
    });

    it("handles non-streaming message/send", async () => {
      const expectedResult = {
        role: "agent",
        parts: [{ text: "Hello" }],
        messageId: "msg-1",
      };
      const handler = createMockRequestHandler(undefined, {
        sendMessage: vi.fn().mockResolvedValue(expectedResult),
      });

      const app = new Hono();
      app.post("/", jsonRpcHandler({ requestHandler: handler }));

      const res = await app.request(
        "/",
        jsonRpcRequest("message/send", {
          message: { role: "user", parts: [{ text: "Hi" }], messageId: "u1" },
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.jsonrpc).toBe("2.0");
      expect(body.result).toBeDefined();
    });
  });

  describe("SSE streaming", () => {
    it("returns text/event-stream for message/stream", async () => {
      const events = [
        { task: { id: "t1", status: { state: "working" } } },
        { task: { id: "t1", status: { state: "completed" } } },
      ];
      async function* mockStream() {
        for (const e of events) yield e;
      }

      const handler = createMockRequestHandler(streamableCard, {
        sendMessageStream: vi.fn().mockReturnValue(mockStream()),
      });

      const app = new Hono();
      app.post("/", jsonRpcHandler({ requestHandler: handler }));

      const res = await app.request(
        "/",
        jsonRpcRequest("message/stream", {
          message: { role: "user", parts: [{ text: "Hi" }], messageId: "u1" },
        }),
      );

      expect(res.headers.get("Content-Type")).toBe("text/event-stream");
      expect(res.headers.get("Cache-Control")).toBe("no-cache");

      const text = await res.text();
      const sseEvents = text.split("\n\n").filter(Boolean);
      expect(sseEvents.length).toBe(2);
      for (const line of sseEvents) {
        const parsed = JSON.parse(line.replace(/^data: /, ""));
        expect(parsed.jsonrpc).toBe("2.0");
        expect(parsed.result).toBeDefined();
      }
    });

    it("handles zero-event stream gracefully", async () => {
      async function* emptyStream() {
        // yields nothing
      }

      const handler = createMockRequestHandler(streamableCard, {
        sendMessageStream: vi.fn().mockReturnValue(emptyStream()),
      });

      const app = new Hono();
      app.post("/", jsonRpcHandler({ requestHandler: handler }));

      const res = await app.request(
        "/",
        jsonRpcRequest("message/stream", {
          message: { role: "user", parts: [{ text: "Hi" }], messageId: "u1" },
        }),
      );

      expect(res.headers.get("Content-Type")).toBe("text/event-stream");
      const text = await res.text();
      expect(text).toBe("");
    });

    it("emits SSE error event when stream throws mid-flight", async () => {
      async function* failingStream() {
        yield { task: { id: "t1", status: { state: "working" } } };
        throw new Error("stream exploded");
      }

      const handler = createMockRequestHandler(streamableCard, {
        sendMessageStream: vi.fn().mockReturnValue(failingStream()),
      });

      const app = new Hono();
      app.post("/", jsonRpcHandler({ requestHandler: handler }));

      const res = await app.request(
        "/",
        jsonRpcRequest("message/stream", {
          message: { role: "user", parts: [{ text: "Hi" }], messageId: "u1" },
        }),
      );

      expect(res.headers.get("Content-Type")).toBe("text/event-stream");
      const text = await res.text();
      const chunks = text.split("\n\n").filter(Boolean);

      // First chunk: normal data event
      expect(chunks[0]).toMatch(/^data: /);

      // Second chunk: error event
      expect(chunks[1]).toMatch(/^event: error/);
      const errorData = chunks[1].split("\n").find((l) => l.startsWith("data: "));
      const parsed = JSON.parse(errorData!.replace(/^data: /, ""));
      expect(parsed.error).toBeDefined();
      expect(parsed.error.message).toBe("Streaming error.");
    });

    it("does not leak internal error details in SSE error events", async () => {
      async function* leakingStream() {
        throw new Error("Connection to postgres://user:pass@host/db failed");
      }

      const handler = createMockRequestHandler(streamableCard, {
        sendMessageStream: vi.fn().mockReturnValue(leakingStream()),
      });

      const app = new Hono();
      app.post("/", jsonRpcHandler({ requestHandler: handler }));

      const res = await app.request(
        "/",
        jsonRpcRequest("message/stream", {
          message: { role: "user", parts: [{ text: "Hi" }], messageId: "u1" },
        }),
      );

      const text = await res.text();
      // Must NOT contain the internal connection string
      expect(text).not.toContain("postgres://");
      expect(text).not.toContain("user:pass");

      // Should contain the generic error message
      const errorChunk = text.split("\n\n").filter(Boolean).find(c => c.startsWith("event: error"));
      expect(errorChunk).toBeDefined();
      const errorData = errorChunk!.split("\n").find(l => l.startsWith("data: "));
      const parsed = JSON.parse(errorData!.replace(/^data: /, ""));
      expect(parsed.error.message).toBe("Streaming error.");
    });
  });

  describe("authentication", () => {
    it("uses custom userBuilder", async () => {
      const customUser = { isAuthenticated: true, userName: "test-user" };
      const userBuilder = vi.fn().mockResolvedValue(customUser);
      const handler = createMockRequestHandler(undefined, {
        sendMessage: vi.fn().mockResolvedValue({
          role: "agent",
          parts: [{ text: "ok" }],
          messageId: "m1",
        }),
      });

      const app = new Hono();
      app.post("/", jsonRpcHandler({ requestHandler: handler, userBuilder }));

      await app.request(
        "/",
        jsonRpcRequest("message/send", {
          message: { role: "user", parts: [{ text: "Hi" }], messageId: "u1" },
        }),
      );

      expect(userBuilder).toHaveBeenCalledOnce();
    });

    it("returns 500 when userBuilder throws", async () => {
      const userBuilder = vi.fn().mockRejectedValue(new Error("auth failed"));
      const app = new Hono();
      app.post(
        "/",
        jsonRpcHandler({ requestHandler: createMockRequestHandler(), userBuilder }),
      );

      const res = await app.request(
        "/",
        jsonRpcRequest("message/send", {
          message: { role: "user", parts: [{ text: "Hi" }], messageId: "u1" },
        }),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });
});
