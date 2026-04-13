import type { Context } from "hono";
import type { AgentCard } from "@a2a-js/sdk";
import type { A2ARequestHandler, User } from "@a2a-js/sdk/server";
import { UnauthenticatedUser } from "@a2a-js/sdk/server";

export type UserBuilder = (c: Context) => Promise<User>;

export const UserBuilder = {
  noAuthentication: (): Promise<User> =>
    Promise.resolve(new UnauthenticatedUser()),
};

export type AgentCardProvider =
  | { getAgentCard: () => Promise<AgentCard> }
  | (() => Promise<AgentCard>);

export interface JsonRpcHandlerOptions {
  requestHandler: A2ARequestHandler;
  userBuilder?: UserBuilder;
}

export interface AgentCardHandlerOptions {
  agentCardProvider: AgentCardProvider;
}

export interface A2AAppOptions {
  requestHandler: A2ARequestHandler;
  userBuilder?: UserBuilder;
  agentCardPath?: string;
  agentCardProvider?: AgentCardProvider;
  maxBodySize?: number;
}
