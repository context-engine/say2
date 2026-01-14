/**
 * Mock MCP Server
 *
 * A spawnable mock MCP server for E2E testing.
 * Responds to standard MCP protocol messages.
 */

import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

// =============================================================================
// Tool Behavior Configuration (Phase 2a)
// =============================================================================

/** Content item returned by a tool */
export interface ToolContentConfig {
	type: "text" | "image" | "audio" | "resource_link" | "resource";
	text?: string;
	data?: string; // base64 for image/audio
	mimeType?: string;
	uri?: string;
	name?: string;
	resource?: {
		uri: string;
		text?: string;
		blob?: string;
		mimeType?: string;
	};
	annotations?: {
		audience?: ("user" | "assistant")[];
		priority?: number;
	};
}

/** Tool behavior configuration for testing different scenarios */
export interface ToolBehavior {
	/** Content items to return */
	content?: ToolContentConfig[];
	/** Set isError: true for user-actionable errors */
	isError?: boolean;
	/** Structured content to return */
	structuredContent?: unknown;
	/** Delay in ms before responding (for timeout/cancel tests) */
	delayMs?: number;
	/** Send progress notifications during delay */
	progressSteps?: number;
	/** Return specific error code (e.g., -32602 for unknown tool) */
	errorCode?: number;
	/** Error message */
	errorMessage?: string;
}

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
	tools?: Array<{
		name: string;
		description: string;
		inputSchema?: object;
		outputSchema?: object;
	}>;
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
	/** Tool-specific behaviors for tools/call (keyed by tool name) */
	toolBehaviors?: Record<string, ToolBehavior>;
	/** Return -32602 for unknown tools */
	strictToolValidation?: boolean;
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
	strictToolValidation: true, // Default to strict for Phase 2a
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
				return createToolCallResponse(id, message.params, mergedConfig);
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
	config: MockServerConfig,
): JSONRPCMessage {
	const p = params as {
		name?: string;
		arguments?: Record<string, unknown>;
		_meta?: { progressToken?: string | number };
	};
	const toolName = p?.name ?? "unknown";
	const args = p?.arguments ?? {};

	// Check if tool exists (strict validation for -32602 error)
	if (config.strictToolValidation) {
		const toolExists = config.tools?.some((t) => t.name === toolName);
		if (!toolExists) {
			return {
				jsonrpc: "2.0",
				id,
				error: {
					code: -32602,
					message: `Unknown tool: ${toolName}`,
				},
			};
		}
	}

	// Check for custom tool behavior
	const behavior = config.toolBehaviors?.[toolName];

	// If behavior specifies an error, return it
	if (behavior?.errorCode) {
		return {
			jsonrpc: "2.0",
			id,
			error: {
				code: behavior.errorCode,
				message: behavior.errorMessage ?? `Error calling tool: ${toolName}`,
			},
		};
	}

	// Build content array
	let content: ToolContentConfig[];
	if (behavior?.content) {
		content = behavior.content;
	} else {
		// Default echo behavior
		content = [
			{
				type: "text",
				text: `Tool ${toolName} called with: ${JSON.stringify(args)}`,
			},
		];
	}

	// Build result
	const result: {
		content: ToolContentConfig[];
		isError?: boolean;
		structuredContent?: unknown;
	} = {
		content,
	};

	if (behavior?.isError) {
		result.isError = true;
	}

	if (behavior?.structuredContent !== undefined) {
		result.structuredContent = behavior.structuredContent;
	}

	return {
		jsonrpc: "2.0",
		id,
		result,
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

	// Track cancelled requests (for race condition testing)
	const cancelledRequests = new Set<string | number>();

	// Helper to send progress notifications
	const sendProgressNotifications = async (
		progressToken: string | number,
		steps: number,
		delayMs: number,
	) => {
		const stepDelay = delayMs / (steps + 1);
		for (let i = 1; i <= steps; i++) {
			if (isClosed) break;
			await new Promise((resolve) => setTimeout(resolve, stepDelay));
			if (isClosed) break;

			const notification: JSONRPCMessage = {
				jsonrpc: "2.0",
				method: "notifications/progress",
				params: {
					progressToken,
					progress: i,
					total: steps,
					message: `Step ${i} of ${steps}`,
				},
			};
			onmessageHandler?.(notification);
		}
	};

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

			// Handle cancellation notifications
			if (
				"method" in message &&
				message.method === "notifications/cancelled" &&
				!("id" in message)
			) {
				const params = message.params as { requestId?: string | number };
				if (params?.requestId) {
					cancelledRequests.add(params.requestId);
				}
				return; // No response for notifications
			}

			// Check if this request was already cancelled
			if ("id" in message && cancelledRequests.has(message.id!)) {
				// Ignore cancelled requests
				return;
			}

			// Handle tools/call with special delay and progress
			if (
				"method" in message &&
				message.method === "tools/call" &&
				"id" in message
			) {
				const params = message.params as {
					name?: string;
					_meta?: { progressToken?: string | number };
				};
				const toolName = params?.name ?? "";
				const behavior = mergedConfig.toolBehaviors?.[toolName];

				// If tool has custom delay, handle it with optional progress
				if (behavior?.delayMs && behavior.delayMs > 0) {
					const progressToken = params?._meta?.progressToken;

					// Send progress notifications if configured
					if (progressToken && behavior.progressSteps) {
						await sendProgressNotifications(
							progressToken,
							behavior.progressSteps,
							behavior.delayMs,
						);
					} else {
						// Just delay without progress
						await new Promise((resolve) =>
							setTimeout(resolve, behavior.delayMs),
						);
					}

					// Check if cancelled during delay
					if (cancelledRequests.has(message.id!)) {
						return; // Don't send response if cancelled
					}
				}
			}

			// Simulate global response delay
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
		/** Manually send a notification from server (for testing) */
		simulateNotification: (notification: JSONRPCMessage) => {
			onmessageHandler?.(notification);
		},
		/** Check if a request was cancelled */
		isRequestCancelled: (requestId: string | number) => {
			return cancelledRequests.has(requestId);
		},
		/** Get all cancelled request IDs */
		getCancelledRequests: () => {
			return Array.from(cancelledRequests);
		},
	};
}

export type MockServerTransport = ReturnType<typeof createMockServerTransport>;

