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

		test("indexes messages with requestId for fast lookup", () => {
			const event = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 555,
				method: "test",
			} as JsonRpcRequest);

			store.store(event);

			// Should be retrievable by requestId
			const retrieved = store.getByRequestId(sessionId, 555);
			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(event.id);
		});

		test("does not create byRequestId index for messages without requestId", () => {
			// Notifications don't have id
			const notification = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				method: "notifications/message",
			} as JsonRpcRequest);

			store.store(notification);

			// Message should exist in session list
			expect(store.countBySession(sessionId)).toBe(1);

			// But not be retrievable by any requestId
			expect(
				store.getByRequestId(sessionId, undefined as unknown as number),
			).toBeUndefined();
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

		test("filters by startTime", async () => {
			// Store message BEFORE the startTime boundary
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 99,
					method: "before-start",
				} as JsonRpcRequest),
			);

			await new Promise((r) => setTimeout(r, 10));
			const startBoundary = new Date();
			await new Promise((r) => setTimeout(r, 10));

			// Store message AFTER the startTime boundary
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 100,
					method: "after-start",
				} as JsonRpcRequest),
			);

			// Query for messages after startBoundary (should exclude beforeEach messages too)
			const results = store.query({ startTime: startBoundary });

			// Should only include the message after startTime
			expect(results.length).toBe(1);
			expect(results[0]?.method).toBe("after-start");

			// The "before-start" message should be excluded
			expect(results.find((m) => m.method === "before-start")).toBeUndefined();
		});

		test("filters by endTime", async () => {
			// Store a message now
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 101,
					method: "before-end",
				} as JsonRpcRequest),
			);

			const afterFirstMessage = new Date();

			await new Promise((r) => setTimeout(r, 10));

			// Store another message later
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 102,
					method: "after-end",
				} as JsonRpcRequest),
			);

			// Query for messages before afterFirstMessage (should get the beforeEach messages + first)
			const results = store.query({ endTime: afterFirstMessage });

			// All results should be <= endTime
			for (const msg of results) {
				expect(msg.timestamp.getTime()).toBeLessThanOrEqual(
					afterFirstMessage.getTime(),
				);
			}
			// Should not include the "after-end" message
			expect(results.find((m) => m.method === "after-end")).toBeUndefined();
		});

		test("filters by startTime and endTime range", async () => {
			// Clear existing messages for clean test
			store.clear();

			await new Promise((r) => setTimeout(r, 5));
			const rangeStart = new Date();
			await new Promise((r) => setTimeout(r, 5));

			// Store message within range
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 103,
					method: "in-range",
				} as JsonRpcRequest),
			);

			await new Promise((r) => setTimeout(r, 5));
			const rangeEnd = new Date();
			await new Promise((r) => setTimeout(r, 5));

			// Store message after range
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 104,
					method: "out-of-range",
				} as JsonRpcRequest),
			);

			const results = store.query({ startTime: rangeStart, endTime: rangeEnd });

			expect(results.length).toBe(1);
			expect(results[0]?.method).toBe("in-range");
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

		test("request must be outbound direction", () => {
			// Store an INBOUND message with requestId (should NOT be found as request)
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: 50,
					result: "fake-response",
				} as JsonRpcResponse),
			);

			const pair = store.correlate(sessionId, 50);

			// Should not find a request (only inbound exists)
			expect(pair).toBeUndefined();
		});

		test("response must be inbound direction", () => {
			// Store outbound request
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 60,
					method: "test",
				} as JsonRpcRequest),
			);
			// Store OUTBOUND with same id (should NOT be found as response)
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 60,
					method: "duplicate",
				} as JsonRpcRequest),
			);

			const pair = store.correlate(sessionId, 60);

			// Should find request but NOT response (no inbound exists)
			expect(pair).toBeDefined();
			expect(pair?.request).toBeDefined();
			expect(pair?.response).toBeUndefined();
		});

		test("correlates correct messages when multiple exist with same requestId pattern", () => {
			// This catches the OR mutation (m.direction === "outbound" || m.requestId === requestId)
			const requestId = 70;

			// Store: outbound id=70, inbound id=71, inbound id=70
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: requestId,
					method: "correct-request",
				} as JsonRpcRequest),
			);
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: 71, // Different ID
					result: "wrong-response",
				} as JsonRpcResponse),
			);
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: requestId, // Correct ID
					result: "correct-response",
				} as JsonRpcResponse),
			);

			const pair = store.correlate(sessionId, requestId);

			expect(pair?.request.method).toBe("correct-request");
			expect((pair?.response?.payload as { result: string }).result).toBe(
				"correct-response",
			);
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

		test("calculates latency correctly", async () => {
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

			// Store request
			const requestEvent = createMessageEvent(
				sessionId,
				"outbound",
				requestPayload,
			);
			store.store(requestEvent);

			// Wait to create measurable latency
			await new Promise((r) => setTimeout(r, 10));

			// Store response
			const responseEvent = createMessageEvent(
				sessionId,
				"inbound",
				responsePayload,
			);
			store.store(responseEvent);

			const pair = store.correlate(sessionId, 1);

			// Verify latency is calculated correctly (response - request, not + )
			expect(pair?.latencyMs).toBeDefined();
			expect(pair?.latencyMs).toBeGreaterThanOrEqual(10); // At least 10ms
			expect(pair?.latencyMs).toBeLessThan(5000); // But not absurdly large (catches + bug)

			// Verify the calculation is response - request (not request - response)
			const expectedLatency =
				responseEvent.timestamp.getTime() - requestEvent.timestamp.getTime();
			expect(pair?.latencyMs).toBe(expectedLatency);
		});
	});

	describe("clear", () => {
		test("clearSession removes session messages and requestId index", () => {
			const requestId = 999;
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: requestId,
					method: "test",
				} as JsonRpcRequest),
			);

			// Verify it exists in both indices before clearing
			expect(store.getBySession(sessionId).length).toBe(1);
			expect(store.getByRequestId(sessionId, requestId)).toBeDefined();

			store.clearSession(sessionId);

			// Verify both indices are cleared
			expect(store.getBySession(sessionId)).toEqual([]);
			expect(store.getByRequestId(sessionId, requestId)).toBeUndefined();
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

		test("hasError: false returns only success messages", () => {
			// Store success
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: 1,
					result: "success",
				} as JsonRpcResponse),
			);
			// Store error
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: 2,
					error: { code: -32601, message: "Method not found" },
				} as unknown as JsonRpcResponse),
			);

			const results = store.query({ hasError: false });

			expect(results.length).toBe(1);
			expect((results[0]?.payload as { result: string }).result).toBe(
				"success",
			);
		});

		test("without hasError filter returns all messages", () => {
			// Store success
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: 1,
					result: "success",
				} as JsonRpcResponse),
			);
			// Store error
			store.store(
				createMessageEvent(sessionId, "inbound", {
					jsonrpc: "2.0",
					id: 2,
					error: { code: -32601, message: "Method not found" },
				} as unknown as JsonRpcResponse),
			);

			// Query without hasError filter
			const results = store.query({ sessionId });

			expect(results.length).toBe(2);
		});
	});

	describe("clearSession with notifications", () => {
		test("clearSession handles messages without requestId", () => {
			// Store a notification (no requestId)
			const notification = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				method: "notifications/message",
			} as JsonRpcRequest);
			store.store(notification);

			// Store a message with requestId
			store.store(
				createMessageEvent(sessionId, "outbound", {
					jsonrpc: "2.0",
					id: 123,
					method: "test",
				} as JsonRpcRequest),
			);

			// Should have 2 messages
			expect(store.countBySession(sessionId)).toBe(2);

			// Clear should work without errors
			store.clearSession(sessionId);

			// Both should be gone
			expect(store.getBySession(sessionId)).toEqual([]);
		});
	});

	describe("boundary conditions", () => {
		test("startTime boundary includes exact timestamp match", async () => {
			store.clear();

			// Create event
			const event = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "test",
			} as JsonRpcRequest);
			store.store(event);

			// Query with exact timestamp as startTime
			const results = store.query({ startTime: event.timestamp });

			// Should include the event (>= boundary)
			expect(results.length).toBe(1);
			expect(results[0]?.id).toBe(event.id);
		});

		test("endTime boundary includes exact timestamp match", async () => {
			store.clear();

			// Create event
			const event = createMessageEvent(sessionId, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "test",
			} as JsonRpcRequest);
			store.store(event);

			// Query with exact timestamp as endTime
			const results = store.query({ endTime: event.timestamp });

			// Should include the event (<= boundary)
			expect(results.length).toBe(1);
			expect(results[0]?.id).toBe(event.id);
		});
	});
});
