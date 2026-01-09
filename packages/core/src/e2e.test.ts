/**
 * End-to-End Integration Tests
 *
 * Tests the full flow of all core components working together.
 */

import { beforeEach, describe, expect, test } from "bun:test";
import {
	createContextKey,
	createMessageEvent,
	type JsonRpcRequest,
	type JsonRpcResponse,
	MessageStore,
	type Middleware,
	MiddlewarePipeline,
	SessionManager,
	SessionState,
} from "./index";

describe("Core E2E", () => {
	let sessionManager: SessionManager;
	let messageStore: MessageStore;
	let pipeline: MiddlewarePipeline;

	beforeEach(() => {
		sessionManager = new SessionManager();
		messageStore = new MessageStore();
		pipeline = new MiddlewarePipeline();
	});

	describe("Full Message Flow", () => {
		test("session creation → message processing → storage → query → close", async () => {
			// 1. Create session
			const session = sessionManager.create({
				name: "test-server",
				transport: "stdio",
				command: "node",
				args: ["server.js"],
			});
			expect(session.state).toBe(SessionState.CREATED);

			// 2. Transition to ACTIVE
			sessionManager.updateState(session.id, SessionState.ACTIVE);
			expect(sessionManager.get(session.id)?.state).toBe(SessionState.ACTIVE);

			// 3. Setup middleware pipeline
			const processedEvents: string[] = [];

			// Logging middleware
			const loggingMiddleware: Middleware = async (ctx, next) => {
				processedEvents.push(`before:${ctx.event.method}`);
				await next();
				processedEvents.push(`after:${ctx.event.method}`);
			};

			// Storage middleware
			const storageMiddleware: Middleware = async (ctx, next) => {
				messageStore.store(ctx.event);
				await next();
			};

			pipeline.use(loggingMiddleware);
			pipeline.use(storageMiddleware);

			// 4. Create and process outbound request
			const request: JsonRpcRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "tools/list",
			};
			const outboundEvent = createMessageEvent(session.id, "outbound", request);
			await pipeline.process(outboundEvent, session);

			// 5. Create and process inbound response
			const response: JsonRpcResponse = {
				jsonrpc: "2.0",
				id: 1,
				result: { tools: [{ name: "calculator" }] },
			};
			const inboundEvent = createMessageEvent(session.id, "inbound", response);
			await pipeline.process(inboundEvent, session);

			// 6. Verify middleware execution order
			expect(processedEvents).toEqual([
				"before:tools/list",
				"after:tools/list",
				"before:undefined", // response has no method
				"after:undefined",
			]);

			// 7. Verify messages stored
			const messages = messageStore.getBySession(session.id);
			expect(messages.length).toBe(2);

			// 8. Verify request-response correlation
			const pair = messageStore.correlate(session.id, 1);
			expect(pair).toBeDefined();
			expect(pair?.request.direction).toBe("outbound");
			expect(pair?.response?.direction).toBe("inbound");
			expect(pair?.latencyMs).toBeDefined();

			// 9. Query by direction
			const outbound = messageStore.query({
				sessionId: session.id,
				direction: "outbound",
			});
			expect(outbound.length).toBe(1);

			const inbound = messageStore.query({
				sessionId: session.id,
				direction: "inbound",
			});
			expect(inbound.length).toBe(1);

			// 10. Close session
			sessionManager.close(session.id);
			expect(sessionManager.get(session.id)?.state).toBe(SessionState.CLOSED);

			// 11. Verify closed session not in active list
			const activeSessions = sessionManager.list();
			expect(activeSessions.find((s) => s.id === session.id)).toBeUndefined();
		});
	});

	describe("Multiple Sessions", () => {
		test("handles multiple concurrent sessions independently", async () => {
			// Create two sessions
			const session1 = sessionManager.create({
				name: "server-1",
				transport: "stdio",
			});
			const session2 = sessionManager.create({
				name: "server-2",
				transport: "http",
				url: "http://localhost:3000",
			});

			// Setup storage middleware
			pipeline.use(async (ctx, next) => {
				messageStore.store(ctx.event);
				await next();
			});

			// Send messages to both sessions
			const msg1 = createMessageEvent(session1.id, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "session1/method",
			} as JsonRpcRequest);
			const msg2 = createMessageEvent(session2.id, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "session2/method",
			} as JsonRpcRequest);

			await pipeline.process(msg1, session1);
			await pipeline.process(msg2, session2);

			// Verify isolation
			const session1Messages = messageStore.getBySession(session1.id);
			const session2Messages = messageStore.getBySession(session2.id);

			expect(session1Messages.length).toBe(1);
			expect(session2Messages.length).toBe(1);
			expect(session1Messages[0]?.method).toBe("session1/method");
			expect(session2Messages[0]?.method).toBe("session2/method");

			// Both sessions in active list
			expect(sessionManager.list().length).toBe(2);
		});
	});

	describe("Middleware Context Extensions", () => {
		test("context extensions pass data between middlewares", async () => {
			const timingKey = createContextKey<number>("startTime");
			const results: { method: string; duration: number }[] = [];

			// Timing middleware (start)
			pipeline.use(async (ctx, next) => {
				ctx.set(timingKey, Date.now());
				await next();
			});

			// Simulate work
			pipeline.use(async (_ctx, next) => {
				await new Promise((r) => setTimeout(r, 10));
				await next();
			});

			// Timing middleware (end)
			pipeline.use(async (ctx, next) => {
				const startTime = ctx.get(timingKey);
				if (startTime) {
					const duration = Date.now() - startTime;
					results.push({
						method: ctx.event.method ?? "unknown",
						duration,
					});
				}
				await next();
			});

			const session = sessionManager.create({
				name: "test",
				transport: "stdio",
			});
			const event = createMessageEvent(session.id, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "test/method",
			} as JsonRpcRequest);

			await pipeline.process(event, session);

			expect(results.length).toBe(1);
			expect(results[0]?.method).toBe("test/method");
			expect(results[0]?.duration).toBeGreaterThanOrEqual(10);
		});
	});

	describe("Error Handling", () => {
		test("middleware errors propagate and don't affect store", async () => {
			pipeline.use(async (ctx, next) => {
				messageStore.store(ctx.event); // Store before error
				await next();
			});

			pipeline.use(async (_ctx, _next) => {
				throw new Error("Processing failed");
			});

			const session = sessionManager.create({
				name: "test",
				transport: "stdio",
			});
			const event = createMessageEvent(session.id, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "will/fail",
			} as JsonRpcRequest);

			// Error should propagate
			await expect(pipeline.process(event, session)).rejects.toThrow(
				"Processing failed",
			);

			// But message was stored before error
			expect(messageStore.getBySession(session.id).length).toBe(1);
		});
	});

	describe("Session Lifecycle", () => {
		test("transitions through all states", () => {
			const session = sessionManager.create({
				name: "test",
				transport: "stdio",
			});

			expect(session.state).toBe(SessionState.CREATED);

			sessionManager.updateState(session.id, SessionState.INITIALIZING);
			expect(sessionManager.get(session.id)?.state).toBe(
				SessionState.INITIALIZING,
			);

			sessionManager.updateState(session.id, SessionState.ACTIVE);
			expect(sessionManager.get(session.id)?.state).toBe(SessionState.ACTIVE);

			sessionManager.updateCapabilities(
				session.id,
				{ tools: true },
				{ resources: true },
			);
			const updated = sessionManager.get(session.id);
			expect(updated?.clientCapabilities).toEqual({ tools: true });
			expect(updated?.serverCapabilities).toEqual({ resources: true });

			sessionManager.close(session.id);
			expect(sessionManager.get(session.id)?.state).toBe(SessionState.CLOSED);
		});
	});
});
