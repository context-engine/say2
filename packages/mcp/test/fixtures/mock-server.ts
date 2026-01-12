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
    capabilities?: {
        tools?: boolean;
        resources?: boolean;
        prompts?: boolean;
    };
    tools?: Array<{ name: string; description: string }>;
    resources?: Array<{ uri: string; name: string }>;
    prompts?: Array<{ name: string; description: string }>;
    /** Simulate delay in ms before responding */
    responseDelay?: number;
    /** Simulate failure on specific methods */
    failOnMethods?: string[];
}

const defaultConfig: MockServerConfig = {
    name: "mock-mcp-server",
    version: "1.0.0",
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
                return createToolsListResponse(id, mergedConfig);
            case "resources/list":
                return createResourcesListResponse(id, mergedConfig);
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
            protocolVersion: "2024-11-05",
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
): JSONRPCMessage {
    return {
        jsonrpc: "2.0",
        id,
        result: {
            tools: (config.tools ?? []).map((t) => ({
                name: t.name,
                description: t.description,
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            })),
        },
    };
}

function createResourcesListResponse(
    id: string | number,
    config: MockServerConfig,
): JSONRPCMessage {
    return {
        jsonrpc: "2.0",
        id,
        result: {
            resources: (config.resources ?? []).map((r) => ({
                uri: r.uri,
                name: r.name,
                mimeType: "text/plain",
            })),
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
