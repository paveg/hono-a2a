// Type-compatibility consumer — compiled against multiple TS versions in CI.
// Never executed; exists purely to exercise every public .d.ts surface so a
// future API change that breaks downlevel TypeScript users is caught at PR time.
import type { AgentCard } from "@a2a-js/sdk";
import type { A2ARequestHandler, User } from "@a2a-js/sdk/server";
import type {
	A2AAppOptions,
	AgentCardHandlerOptions,
	AgentCardProvider,
	JsonRpcHandlerOptions,
} from "../../dist/index.js";
import { a2aApp, agentCardHandler, jsonRpcHandler, UserBuilder } from "../../dist/index.js";

// --- value exports ---

const _noAuth: () => Promise<User> = UserBuilder.noAuthentication;

// --- type fixtures ---

const _agentCard: AgentCard = {
	name: "type-compat-test",
	description: "type-compat test agent",
	url: "https://example.test",
	version: "0.0.0",
	capabilities: { streaming: false },
	defaultInputModes: ["text"],
	defaultOutputModes: ["text"],
	skills: [],
	protocolVersion: "0.3.0",
};

// AgentCardProvider — both callable and getAgentCard variants
const _providerCallable: AgentCardProvider = async () => _agentCard;
const _providerObject: AgentCardProvider = {
	getAgentCard: async () => _agentCard,
};

// AgentCardHandlerOptions — provider only
const _agentCardOpts: AgentCardHandlerOptions = {
	agentCardProvider: _providerCallable,
};

// requestHandler is opaque to the type-compat surface — we only need a
// stub object satisfying the type. Cast through `as` rather than `any` so
// the test still exercises the structural shape at the call sites below.
const _requestHandler = {} as A2ARequestHandler;

const _jsonRpcOpts: JsonRpcHandlerOptions = {
	requestHandler: _requestHandler,
	userBuilder: UserBuilder.noAuthentication,
};

const _appOpts: A2AAppOptions = {
	requestHandler: _requestHandler,
	userBuilder: UserBuilder.noAuthentication,
	agentCardPath: ".well-known/agent-card.json",
	agentCardProvider: _providerObject,
	maxBodySize: 102400,
};

// Exercise each function export
const _app = a2aApp(_appOpts);
const _agentCardHandler = agentCardHandler(_agentCardOpts);
const _jsonRpcHandlerInstance = jsonRpcHandler(_jsonRpcOpts);

void _noAuth;
void _app;
void _agentCardHandler;
void _jsonRpcHandlerInstance;
