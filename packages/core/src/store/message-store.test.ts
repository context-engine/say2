/**
 * Message Store Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import {
	createMessageEvent,
	type JsonRpcRequest,
	type JsonRpcResponse,
} from "../types";
import { MessageStore } from "./message-store";

describe("MessageStore", () => {
	let store: MessageStore;
	const sessionId = crypto.randomUUID();

	beforeEach(() => {
		store = new MessageStore();
	});

	describe("store", () => {
		test("stores message event", () => {
			const event = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "test",
			} as JsonRpcRequest);

			store.store(event);

			expect(store.count()).toBe(1);
		});

		test("stores multiple messages for same session", () => {
			const event1 = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "a",
			} as JsonRpcRequest);
			const event2 = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 2,
				method: "b",
			} as JsonRpcRequest);

			store.store(event1);
			store.store(event2);

			expect(store.countBySession(sessionId)).toBe(2);
		});
	});

	describe("getBySession", () => {
		test("retrieves messages by session ID", () => {
			const event = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "test",
			} as JsonRpcRequest);
			store.store(event);

			const messages = store.getBySession(sessionId);

			expect(messages.length).toBe(1);
			expect(messages[0]?.id).toBe(event.id);
		});

		test("returns empty array for unknown session", () => {
			const messages = store.getBySession("unknown");

			expect(messages).toEqual([]);
		});

		test("maintains insertion order", () => {
			const event1 = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "first",
			} as JsonRpcRequest);
			const event2 = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 2,
				method: "second",
			} as JsonRpcRequest);
			const event3 = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 3,
				method: "third",
			} as JsonRpcRequest);

			store.store(event1);
			store.store(event2);
			store.store(event3);

			const messages = store.getBySession(sessionId);

			expect(messages[0]?.method).toBe("first");
			expect(messages[1]?.method).toBe("second");
			expect(messages[2]?.method).toBe("third");
		});
	});

	describe("query", () => {
		beforeEach(() => {
			// Store test messages
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 1,
					method: "tools/list",
				} as JsonRpcRequest),
			);
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: 1,
					result: [],
				} as JsonRpcResponse),
			);
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 2,
					method: "resources/read",
				} as JsonRpcRequest),
			);
		});

		test("filters by direction", () => {
			const outbound = store.query({ direction: "outbound" });
			const inbound = store.query({ direction: "inbound" });

			expect(outbound.length).toBe(2);
			expect(inbound.length).toBe(1);
		});

		test("filters by method", () => {
			const results = store.query({ method: "tools/list" });

			expect(results.length).toBe(1);
			expect(results[0]?.method).toBe("tools/list");
		});

		test("filters by session", () => {
			const otherSessionId = crypto.randomUUID();
			store.store(
				createMessageEvent(otherSessionId, "outbound", {
					jsonrpc: "2.0",
					id: 1,
					method: "other",
				} as JsonRpcRequest),
			);

			const results = store.query({ sessionId });

			expect(results.length).toBe(3);
		});

		test("combines multiple filters", () => {
			const results = store.query({
				sessionId,
				direction: "outbound",
				method: "tools/list",
			});

			expect(results.length).toBe(1);
		});
	});

	describe("correlate", () => {
		test("correlates request and response by ID", () => {
			const requestPayload: JsonRpcRequest = {
				jsonrpc: "2.0",
				id: 42,
				method: "test",
			};
			const responsePayload: JsonRpcResponse = {
				jsonrpc: "2.0",
				id: 42,
				result: "ok",
			};

			const request = createMessageEvent(sessionId, "outbound", requestPayload);
			store.store(request);

			// Simulate delay
			const response = createMessageEvent(
				sessionId,
				"inbound",
				responsePayload,
			);
			store.store(response);

			const pair = store.correlate(sessionId, 42);

			expect(pair).toBeDefined();
			expect(pair?.request.id).toBe(request.id);
			expect(pair?.response?.id).toBe(response.id);
		});

		test("returns undefined for orphan request", () => {
			const requestPayload: JsonRpcRequest = {
				jsonrpc: "2.0",
				id: 99,
				method: "test",
			};
			store.store(createMessageEvent(sessionId, "outbound", requestPayload));

			const pair = store.correlate(sessionId, 99);

			expect(pair).toBeDefined();
			expect(pair?.request).toBeDefined();
			expect(pair?.response).toBeUndefined();
		});

		test("returns undefined for unknown request ID", () => {
			const pair = store.correlate(sessionId, "unknown");

			expect(pair).toBeUndefined();
		});

		test("calculates latency", () => {
			const requestPayload: JsonRpcRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "test",
			};
			const responsePayload: JsonRpcResponse = {
				jsonrpc: "2.0",
				id: 1,
				result: "ok",
			};

			store.store(createMessageEvent(sessionId, "outbound", requestPayload));
			store.store(createMessageEvent(sessionId, "inbound", responsePayload));

			const pair = store.correlate(sessionId, 1);

			expect(pair?.latencyMs).toBeDefined();
			expect(pair?.latencyMs).toBeGreaterThanOrEqual(0);
		});
	});

	describe("clear", () => {
		test("clearSession removes session messages", () => {
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 1,
					method: "test",
				} as JsonRpcRequest),
			);

			store.clearSession(sessionId);

			expect(store.getBySession(sessionId)).toEqual([]);
		});

		test("clear removes all messages", () => {
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 1,
					method: "test",
				} as JsonRpcRequest),
			);
			store.store(
				createMessageEvent(crypto.randomUUID(), "outbound", {
					jsonrpc: "2.0",
					id: 1,
					method: "other",
				} as JsonRpcRequest),
			);

			store.clear();

			expect(store.count()).toBe(0);
		});
	});

	describe("getByRequestId", () => {
		test("retrieves message by session and request ID", () => {
			const event = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 42,
				method: "test",
			} as JsonRpcRequest);
			store.store(event);

			const retrieved = store.getByRequestId(sessionId, 42);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(event.id);
			expect(retrieved?.requestId).toBe(42);
		});

		test("returns undefined for unknown request ID", () => {
			const result = store.getByRequestId(sessionId, "unknown-id");

			expect(result).toBeUndefined();
		});

		test("returns undefined for wrong session ID", () => {
			const event = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 123,
				method: "test",
			} as JsonRpcRequest);
			store.store(event);

			const result = store.getByRequestId("different-session", 123);

			expect(result).toBeUndefined();
		});
	});

	describe("query hasError filter", () => {
		test("filters messages with errors", () => {
			// Store a success response
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: 1,
					result: "ok",
				} as JsonRpcResponse),
			);

			// Store an error response
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: 2,
					error: { code: -32600, message: "Invalid request" },
				} as unknown as JsonRpcResponse),
			);

			const errors = store.query({ sessionId, hasError: true });
			const successes = store.query({ sessionId, hasError: false });

			expect(errors.length).toBe(1);
			expect(successes.length).toBe(1);
		});

		test("hasError: true returns only error messages", () => {
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: 1,
					error: { code: -32601, message: "Method not found" },
				} as unknown as JsonRpcResponse),
			);

			const results = store.query({ hasError: true });

			expect(results.length).toBe(1);
			expect(
				(results[0]?.payload as Record<string, unknown>).error,
			).toBeDefined();
		});
	});
});
