import type { Handler } from "hono";
import type { AgentCardHandlerOptions } from "./types.js";

export function agentCardHandler(options: AgentCardHandlerOptions): Handler {
  const provider =
    typeof options.agentCardProvider === "function"
      ? options.agentCardProvider
      : options.agentCardProvider.getAgentCard.bind(options.agentCardProvider);

  return async (c) => {
    try {
      const agentCard = await provider();
      return c.json(agentCard);
    } catch (error) {
      console.error("Error fetching agent card:", error);
      return c.json({ error: "Failed to retrieve agent card" }, 500);
    }
  };
}
