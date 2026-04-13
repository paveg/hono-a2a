import type { Handler } from "hono";
import { HTTP_EXTENSION_HEADER } from "@a2a-js/sdk";
import {
  A2AError,
  JsonRpcTransportHandler,
  ServerCallContext,
} from "@a2a-js/sdk/server";
import { SSE_HEADERS, formatSSEEvent, formatSSEErrorEvent } from "./sse.js";
import { UserBuilder, type JsonRpcHandlerOptions } from "./types.js";

export function parseExtensionHeader(value: string | undefined): string[] {
  if (!value) return [];
  const unique = new Set(
    value
      .split(",")
      .map((ext) => ext.trim())
      .filter((ext) => ext.length > 0),
  );
  return Array.from(unique);
}

function extensionHeaderValue(
  context: ServerCallContext,
): string | undefined {
  if (!context.activatedExtensions) return undefined;
  return Array.from(context.activatedExtensions).join(",");
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    value != null &&
    typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] ===
      "function"
  );
}

function createSSEResponse(
  stream: AsyncIterable<unknown>,
  requestId: unknown,
  context: ServerCallContext,
): Response {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          controller.enqueue(encoder.encode(formatSSEEvent(event)));
        }
      } catch (streamError) {
        console.error("SSE streaming error:", streamError);
        const a2aError =
          streamError instanceof A2AError
            ? streamError
            : A2AError.internalError("Streaming error.");
        controller.enqueue(
          encoder.encode(
            formatSSEErrorEvent({
              jsonrpc: "2.0",
              id: requestId,
              error: a2aError.toJSONRPCError(),
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  const headers = new Headers(SSE_HEADERS);
  const extValue = extensionHeaderValue(context);
  if (extValue) {
    headers.set(HTTP_EXTENSION_HEADER, extValue);
  }

  return new Response(readable, { headers });
}

export function jsonRpcHandler(options: JsonRpcHandlerOptions): Handler {
  const transport = new JsonRpcTransportHandler(options.requestHandler);
  const userBuilder = options.userBuilder ?? UserBuilder.noAuthentication;

  return async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      const error = A2AError.parseError("Invalid JSON payload.");
      return c.json(
        { jsonrpc: "2.0", id: null, error: error.toJSONRPCError() },
        400,
      );
    }

    try {
      const user = await userBuilder(c);
      const extensions = parseExtensionHeader(
        c.req.header(HTTP_EXTENSION_HEADER),
      );
      const context = new ServerCallContext(extensions, user);
      const result = await transport.handle(body, context);

      if (isAsyncIterable(result)) {
        const requestId = (body as { id?: unknown })?.id ?? null;
        return createSSEResponse(result, requestId, context);
      }

      const extValue = extensionHeaderValue(context);
      if (extValue) {
        c.header(HTTP_EXTENSION_HEADER, extValue);
      }
      return c.json(result as object);
    } catch (error) {
      const a2aError =
        error instanceof A2AError
          ? error
          : A2AError.internalError("General processing error.");
      const requestId = (body as { id?: unknown })?.id ?? null;
      return c.json(
        { jsonrpc: "2.0", id: requestId, error: a2aError.toJSONRPCError() },
        500,
      );
    }
  };
}
