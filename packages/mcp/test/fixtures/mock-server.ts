/**
 * Mock MCP Server
 *
 * A spawnable mock MCP server for E2E testing.
 * Responds to standard MCP protocol messages.
 */

import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

interface MockServerConfig {
	name?: string;
	version?: string;
	/** Custom protocol version for version mismatch testing */
	protocolVersion?: string;
	capabilities?: {
		tools?: boolean;
		resources?: boolean;
		prompts?: boolean;
	};
	tools?: Array<{ name: string; description: string }>;
	resources?: Array<{ uri: string; name: string }>;
	/** Resource templates for resources/templates/list */
	resourceTemplates?: Array<{
		uriTemplate: string;
		name: string;
		description?: string;
	}>;
	prompts?: Array<{ name: string; description: string }>;
	/** Simulate delay in ms before responding */
	responseDelay?: number;
	/** Simulate failure on specific methods */
	failOnMethods?: string[];
	/** Enable pagination for tools/list with this page size */
	toolsPageSize?: number;
	/** Enable pagination for resources/list with this page size */
	resourcesPageSize?: number;
}

const defaultConfig: MockServerConfig = {
	name: "mock-mcp-server",
	version: "1.0.0",
	protocolVersion: "2024-11-05",
	capabilities: {
		tools: true,
		resources: false,
		prompts: false,
	},
	tools: [
		{ name: "echo", description: "Echo tool for testing" },
		{ name: "greet", description: "Greeting tool" },
	],
	resources: [],
	prompts: [],
	responseDelay: 0,
	failOnMethods: [],
};

/**
 * Process a JSON-RPC message and return the response.
 */
export function handleMessage(
	message: JSONRPCMessage,
	config: MockServerConfig = defaultConfig,
): JSONRPCMessage | null {
	const mergedConfig = { ...defaultConfig, ...config };

	// Handle requests
	if ("method" in message && "id" in message) {
		const method = message.method;
		const id = message.id;

		// Check if we should fail
		if (mergedConfig.failOnMethods?.includes(method)) {
			return {
				jsonrpc: "2.0",
				id,
				error: {
					code: -32603,
					message: `Simulated failure for method: ${method}`,
				},
			};
		}

		switch (method) {
			case "initialize":
				return createInitializeResponse(id, mergedConfig);
			case "tools/list":
				return createToolsListResponse(id, mergedConfig, message.params);
			case "resources/list":
				return createResourcesListResponse(id, mergedConfig, message.params);
			case "resources/templates/list":
				return createResourceTemplatesListResponse(id, mergedConfig);
			case "prompts/list":
				return createPromptsListResponse(id, mergedConfig);
			case "tools/call":
				return createToolCallResponse(id, message.params);
			default:
				return {
					jsonrpc: "2.0",
					id,
					error: {
						code: -32601,
						message: `Method not found: ${method}`,
					},
				};
		}
	}

	// Handle notifications (no response needed)
	if ("method" in message && !("id" in message)) {
		// Notifications like "notifications/initialized" don't get responses
		return null;
	}

	// Invalid message
	return {
		jsonrpc: "2.0",
		id: 0, // Use 0 for invalid messages
		error: {
			code: -32600,
			message: "Invalid Request",
		},
	};
}

function createInitializeResponse(
	id: string | number,
	config: MockServerConfig,
): JSONRPCMessage {
	return {
		jsonrpc: "2.0",
		id,
		result: {
			protocolVersion: config.protocolVersion ?? "2024-11-05",
			capabilities: {
				...(config.capabilities?.tools ? { tools: {} } : {}),
				...(config.capabilities?.resources ? { resources: {} } : {}),
				...(config.capabilities?.prompts ? { prompts: {} } : {}),
			},
			serverInfo: {
				name: config.name ?? "mock-mcp-server",
				version: config.version ?? "1.0.0",
			},
		},
	};
}

function createToolsListResponse(
	id: string | number,
	config: MockServerConfig,
	params?: any,
): JSONRPCMessage {
	const allTools = (config.tools ?? []).map((t) => ({
		name: t.name,
		description: t.description,
		inputSchema: {
			type: "object",
			properties: {},
		},
	}));

	// If pagination is configured, implement cursor-based pagination
	if (config.toolsPageSize && config.toolsPageSize > 0) {
		const pageSize = config.toolsPageSize;
		const cursor =
			params && typeof params === "object" && "cursor" in params
				? params.cursor
				: undefined;
		const startIndex = cursor ? parseInt(String(cursor), 10) : 0;
		const endIndex = startIndex + pageSize;
		const tools = allTools.slice(startIndex, endIndex);
		const hasMore = endIndex < allTools.length;

		return {
			jsonrpc: "2.0",
			id,
			result: {
				tools,
				...(hasMore ? { nextCursor: endIndex.toString() } : {}),
			},
		};
	}

	// No pagination - return all tools
	return {
		jsonrpc: "2.0",
		id,
		result: {
			tools: allTools,
		},
	};
}

function createResourcesListResponse(
	id: string | number,
	config: MockServerConfig,
	params?: any,
): JSONRPCMessage {
	const allResources = (config.resources ?? []).map((r) => ({
		uri: r.uri,
		name: r.name,
		mimeType: "text/plain",
	}));

	// If pagination is configured, implement cursor-based pagination
	if (config.resourcesPageSize && config.resourcesPageSize > 0) {
		const pageSize = config.resourcesPageSize;
		const cursor =
			params && typeof params === "object" && "cursor" in params
				? params.cursor
				: undefined;
		const startIndex = cursor ? parseInt(String(cursor), 10) : 0;
		const endIndex = startIndex + pageSize;
		const resources = allResources.slice(startIndex, endIndex);
		const hasMore = endIndex < allResources.length;

		return {
			jsonrpc: "2.0",
			id,
			result: {
				resources,
				...(hasMore ? { nextCursor: endIndex.toString() } : {}),
			},
		};
	}

	// No pagination - return all resources
	return {
		jsonrpc: "2.0",
		id,
		result: {
			resources: allResources,
		},
	};
}

function createPromptsListResponse(
	id: string | number,
	config: MockServerConfig,
): JSONRPCMessage {
	return {
		jsonrpc: "2.0",
		id,
		result: {
			prompts: (config.prompts ?? []).map((p) => ({
				name: p.name,
				description: p.description,
			})),
		},
	};
}

function createResourceTemplatesListResponse(
	id: string | number,
	config: MockServerConfig,
): JSONRPCMessage {
	return {
		jsonrpc: "2.0",
		id,
		result: {
			resourceTemplates: (config.resourceTemplates ?? []).map((t) => ({
				uriTemplate: t.uriTemplate,
				name: t.name,
				description: t.description,
			})),
		},
	};
}

function createToolCallResponse(
	id: string | number,
	params: unknown,
): JSONRPCMessage {
	const p = params as { name?: string; arguments?: Record<string, unknown> };
	const toolName = p?.name ?? "unknown";
	const args = p?.arguments ?? {};

	// Simple echo behavior for testing
	return {
		jsonrpc: "2.0",
		id,
		result: {
			content: [
				{
					type: "text",
					text: `Tool ${toolName} called with: ${JSON.stringify(args)}`,
				},
			],
		},
	};
}

/**
 * Create a mock transport that simulates MCP server behavior.
 * Use this in unit tests instead of spawning a real process.
 */
export function createMockServerTransport(config: MockServerConfig = {}) {
	const mergedConfig = { ...defaultConfig, ...config };
	let onmessageHandler: ((msg: JSONRPCMessage) => void) | undefined;
	let oncloseHandler: (() => void) | undefined;
	let onerrorHandler: ((err: Error) => void) | undefined;
	let isStarted = false;
	let isClosed = false;

	return {
		get isStarted() {
			return isStarted;
		},
		get isClosed() {
			return isClosed;
		},

		start: async () => {
			isStarted = true;
		},

		send: async (message: JSONRPCMessage) => {
			if (isClosed) {
				throw new Error("Transport is closed");
			}

			// Simulate response delay
			if (mergedConfig.responseDelay && mergedConfig.responseDelay > 0) {
				await new Promise((resolve) =>
					setTimeout(resolve, mergedConfig.responseDelay),
				);
			}

			// Process the message and get response
			const response = handleMessage(message, mergedConfig);

			// Send response back if there is one
			if (response && onmessageHandler) {
				// Simulate async response
				queueMicrotask(() => {
					onmessageHandler?.(response);
				});
			}
		},

		close: async () => {
			isClosed = true;
			oncloseHandler?.();
		},

		get onmessage() {
			return onmessageHandler;
		},
		set onmessage(handler: ((msg: JSONRPCMessage) => void) | undefined) {
			onmessageHandler = handler;
		},

		get onclose() {
			return oncloseHandler;
		},
		set onclose(handler: (() => void) | undefined) {
			oncloseHandler = handler;
		},

		get onerror() {
			return onerrorHandler;
		},
		set onerror(handler: ((err: Error) => void) | undefined) {
			onerrorHandler = handler;
		},

		// Test helpers
		simulateError: (error: Error) => {
			onerrorHandler?.(error);
		},
		simulateClose: () => {
			isClosed = true;
			oncloseHandler?.();
		},
	};
}

export type MockServerTransport = ReturnType<typeof createMockServerTransport>;
