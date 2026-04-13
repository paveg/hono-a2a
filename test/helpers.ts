import { vi } from "vitest";
import type { AgentCard } from "@a2a-js/sdk";
import type { A2ARequestHandler } from "@a2a-js/sdk/server";

export const sampleCard: AgentCard = {
  name: "test-agent",
  url: "https://example.com",
  version: "1.0.0",
  capabilities: {},
  skills: [],
};

export const streamableCard: AgentCard = {
  ...sampleCard,
  capabilities: { streaming: true },
};

export function createMockRequestHandler(
  card: AgentCard = sampleCard,
  overrides: Partial<Record<keyof A2ARequestHandler, unknown>> = {},
): A2ARequestHandler {
  return {
    getAgentCard: vi.fn().mockResolvedValue(card),
    getAuthenticatedExtendedAgentCard: vi.fn(),
    sendMessage: vi.fn(),
    sendMessageStream: vi.fn(),
    getTask: vi.fn(),
    cancelTask: vi.fn(),
    setTaskPushNotificationConfig: vi.fn(),
    getTaskPushNotificationConfig: vi.fn(),
    listTaskPushNotificationConfigs: vi.fn(),
    deleteTaskPushNotificationConfig: vi.fn(),
    resubscribe: vi.fn(),
    ...overrides,
  } satisfies Record<keyof A2ARequestHandler, unknown> as A2ARequestHandler;
}

export function jsonRpcRequest(
  method: string,
  params: Record<string, unknown>,
  id: string | number = "req-1",
) {
  return {
    method: "POST" as const,
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    headers: { "Content-Type": "application/json" },
  };
}
