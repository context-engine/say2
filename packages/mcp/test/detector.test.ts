/**
 * EventDetector Unit Tests
 *
 * Tests for protocol event detection from JSON-RPC messages.
 * TDD-style: Tests define expected detection behavior before implementation.
 */

import { describe, expect, test } from "bun:test";
import type { JsonRpcMessage } from "@say2/core";
import { EventDetector } from "../src/events/detector";

describe("EventDetector", () => {
	describe("isInitializeRequest", () => {
		test("returns true for valid initialize request", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: { name: "test", version: "1.0.0" },
				},
			};

			expect(EventDetector.isInitializeRequest(msg)).toBe(true);
		});

		test("returns true for initialize request without params", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
			};

			expect(EventDetector.isInitializeRequest(msg)).toBe(true);
		});

		test("returns false for other methods", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				method: "tools/list",
			};

			expect(EventDetector.isInitializeRequest(msg)).toBe(false);
		});

		test("returns false for response (no method)", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: { protocolVersion: "2024-11-05" },
			};

			expect(EventDetector.isInitializeRequest(msg)).toBe(false);
		});

		test("returns false for notification (no id)", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				method: "notifications/initialized",
			};

			expect(EventDetector.isInitializeRequest(msg)).toBe(false);
		});
	});

	describe("isInitializeResponse", () => {
		test("returns true for valid initialize response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					protocolVersion: "2024-11-05",
					capabilities: { tools: {} },
					serverInfo: { name: "test-server", version: "1.0.0" },
				},
			};

			expect(EventDetector.isInitializeResponse(msg)).toBe(true);
		});

		test("returns true for minimal initialize response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					protocolVersion: "2024-11-05",
				},
			};

			expect(EventDetector.isInitializeResponse(msg)).toBe(true);
		});

		test("returns false for response without protocolVersion", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					tools: [],
				},
			};

			expect(EventDetector.isInitializeResponse(msg)).toBe(false);
		});

		test("returns false for error response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				error: { code: -32600, message: "Invalid request" },
			};

			expect(EventDetector.isInitializeResponse(msg)).toBe(false);
		});

		test("returns false for request message", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
			};

			expect(EventDetector.isInitializeResponse(msg)).toBe(false);
		});
	});

	describe("isInitializedNotification", () => {
		test("returns true for valid initialized notification", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				method: "notifications/initialized",
			};

			expect(EventDetector.isInitializedNotification(msg)).toBe(true);
		});

		test("returns true for initialized notification with empty params", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				method: "notifications/initialized",
				params: {},
			};

			expect(EventDetector.isInitializedNotification(msg)).toBe(true);
		});

		test("returns false for other notifications", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				method: "notifications/progress",
			};

			expect(EventDetector.isInitializedNotification(msg)).toBe(false);
		});

		test("returns false for request with id (not a notification)", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				method: "notifications/initialized",
			};

			// This is technically a request, not a notification
			expect(EventDetector.isInitializedNotification(msg)).toBe(false);
		});

		test("returns false for response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {},
			};

			expect(EventDetector.isInitializedNotification(msg)).toBe(false);
		});
	});

	describe("isToolsListResponse", () => {
		test("returns true for valid tools/list response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					tools: [{ name: "echo", description: "Echo tool", inputSchema: {} }],
				},
			};

			expect(EventDetector.isToolsListResponse(msg)).toBe(true);
		});

		test("returns true for empty tools list", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: { tools: [] },
			};

			expect(EventDetector.isToolsListResponse(msg)).toBe(true);
		});

		test("returns true for tools list with pagination cursor", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					tools: [],
					nextCursor: "abc123",
				},
			};

			expect(EventDetector.isToolsListResponse(msg)).toBe(true);
		});

		test("returns false for response without tools field", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: { resources: [] },
			};

			expect(EventDetector.isToolsListResponse(msg)).toBe(false);
		});

		test("returns false for error response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				error: { code: -32601, message: "Method not found" },
			};

			expect(EventDetector.isToolsListResponse(msg)).toBe(false);
		});
	});

	describe("extractCapabilities", () => {
		test("extracts capabilities from initialize response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					protocolVersion: "2024-11-05",
					capabilities: {
						tools: {},
						resources: { subscribe: true },
						prompts: {},
					},
					serverInfo: { name: "test", version: "1.0.0" },
				},
			};

			const caps = EventDetector.extractCapabilities(msg);

			expect(caps).toBeDefined();
			expect(caps).toEqual({
				tools: {},
				resources: { subscribe: true },
				prompts: {},
			});
		});

		test("returns undefined for non-initialize response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: { tools: [] },
			};

			expect(EventDetector.extractCapabilities(msg)).toBeUndefined();
		});

		test("returns undefined for initialize response without capabilities", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					protocolVersion: "2024-11-05",
				},
			};

			expect(EventDetector.extractCapabilities(msg)).toBeUndefined();
		});

		test("returns empty object for empty capabilities", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					protocolVersion: "2024-11-05",
					capabilities: {},
				},
			};

			const caps = EventDetector.extractCapabilities(msg);
			expect(caps).toEqual({});
		});

		test("returns undefined for request message", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
			};

			expect(EventDetector.extractCapabilities(msg)).toBeUndefined();
		});
	});

	describe("extractServerInfo", () => {
		test("extracts server info from initialize response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					serverInfo: { name: "test-server", version: "2.0.0" },
				},
			};

			const info = EventDetector.extractServerInfo(msg);

			expect(info).toBeDefined();
			expect(info?.name).toBe("test-server");
			expect(info?.version).toBe("2.0.0");
		});

		test("returns undefined for non-initialize response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: { tools: [] },
			};

			expect(EventDetector.extractServerInfo(msg)).toBeUndefined();
		});

		test("returns undefined for initialize response without serverInfo", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					protocolVersion: "2024-11-05",
					capabilities: {},
				},
			};

			expect(EventDetector.extractServerInfo(msg)).toBeUndefined();
		});

		test("returns undefined for error response", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				error: { code: -32600, message: "Bad request" },
			};

			expect(EventDetector.extractServerInfo(msg)).toBeUndefined();
		});
	});

	describe("edge cases", () => {
		test("handles null result gracefully", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: null as unknown,
			};

			expect(EventDetector.isInitializeResponse(msg)).toBe(false);
			expect(EventDetector.isToolsListResponse(msg)).toBe(false);
			expect(EventDetector.extractCapabilities(msg)).toBeUndefined();
			expect(EventDetector.extractServerInfo(msg)).toBeUndefined();
		});

		test("handles undefined result gracefully", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
			};

			expect(EventDetector.isInitializeResponse(msg)).toBe(false);
			expect(EventDetector.isToolsListResponse(msg)).toBe(false);
		});

		// Additional edge cases to kill mutations on guard conditions
		test("returns false for string result (typeof check)", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: "string result" as unknown,
			};

			expect(EventDetector.isInitializeResponse(msg)).toBe(false);
			expect(EventDetector.isToolsListResponse(msg)).toBe(false);
		});

		test("returns false for number result (typeof check)", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: 42 as unknown,
			};

			expect(EventDetector.isInitializeResponse(msg)).toBe(false);
			expect(EventDetector.isToolsListResponse(msg)).toBe(false);
		});

		test("returns false for boolean result (typeof check)", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: true as unknown,
			};

			expect(EventDetector.isInitializeResponse(msg)).toBe(false);
			expect(EventDetector.isToolsListResponse(msg)).toBe(false);
		});

		test("returns false for array result (not plain object)", () => {
			const msg: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: [1, 2, 3] as unknown,
			};

			// Arrays are objects but should fail - no protocolVersion/tools
			expect(EventDetector.isInitializeResponse(msg)).toBe(false);
			expect(EventDetector.isToolsListResponse(msg)).toBe(false);
		});

		test("extractServerInfo returns undefined when serverInfo has wrong types", () => {
			// Missing version
			const msgNoVersion: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					protocolVersion: "2024-11-05",
					serverInfo: { name: "test" },
				},
			};
			expect(EventDetector.extractServerInfo(msgNoVersion)).toBeUndefined();

			// Name is number
			const msgWrongName: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					protocolVersion: "2024-11-05",
					serverInfo: { name: 123, version: "1.0.0" },
				},
			};
			expect(EventDetector.extractServerInfo(msgWrongName)).toBeUndefined();

			// Version is number
			const msgWrongVersion: JsonRpcMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: {
					protocolVersion: "2024-11-05",
					serverInfo: { name: "test", version: 100 },
				},
			};
			expect(EventDetector.extractServerInfo(msgWrongVersion)).toBeUndefined();
		});
	});
});
