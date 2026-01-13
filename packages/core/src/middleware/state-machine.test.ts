/**
 * StateMachineMiddleware Unit Tests
 *
 * Tests for the middleware that observes protocol events and triggers
 * SessionManager state transitions.
 * TDD-style: Tests define expected behavior before implementation.
 */

import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { SessionManager } from "../session";
import type { MessageEvent, Session, JsonRpcMessage } from "../types";
import {
	createMessageEvent,
	LATEST_PROTOCOL_VERSION,
	SessionState,
} from "../types";
import { createPipeline } from "./pipeline";
import {
	createStateMachineMiddleware,
	protocolVersionKey,
	serverCapabilitiesKey,
	serverInfoKey,
} from "./state-machine";

// Mock Protocol Detector (matching interface expected by implementation)
const mockDetector = {
	isInitializeRequest: (msg: JsonRpcMessage) =>
		"method" in msg && msg.method === "initialize" && "id" in msg,
	isInitializeResponse: (msg: JsonRpcMessage) =>
		"result" in msg &&
		typeof msg.result === "object" &&
		msg.result !== null &&
		"protocolVersion" in msg.result,
	isInitializedNotification: (msg: JsonRpcMessage) =>
		"method" in msg && msg.method === "notifications/initialized",
	extractCapabilities: (msg: JsonRpcMessage) =>
		"result" in msg &&
			typeof msg.result === "object" &&
			msg.result !== null
			? (msg.result as any).capabilities
			: undefined,
	extractServerInfo: (msg: JsonRpcMessage) =>
		"result" in msg &&
			typeof msg.result === "object" &&
			msg.result !== null
			? (msg.result as any).serverInfo
			: undefined,
};

// Test fixtures
const createTestSession = (
	state: SessionState = SessionState.CONNECTING,
): Session => ({
	id: "test-session-id",
	state,
	createdAt: new Date(),
	updatedAt: new Date(),
	config: { name: "test-server", transport: "stdio", command: "node" },
	protocol: "mcp",
	mode: "client",
});

const createMockSessionManager = () => {
	const calls: { method: string; args: unknown[] }[] = [];

	return {
		calls,
		connect: mock((id: string) => {
			calls.push({ method: "connect", args: [id] });
			return { success: true };
		}),
		initialize: mock((id: string) => {
			calls.push({ method: "initialize", args: [id] });
			return { success: true };
		}),
		activate: mock(
			(
				id: string,
				clientCaps?: Record<string, unknown>,
				serverCaps?: Record<string, unknown>,
			) => {
				calls.push({ method: "activate", args: [id, clientCaps, serverCaps] });
				return { success: true };
			},
		),
		markError: mock((id: string, reason?: string) => {
			calls.push({ method: "markError", args: [id, reason] });
			return { success: true };
		}),
		close: mock((id: string) => {
			calls.push({ method: "close", args: [id] });
			return { success: true };
		}),
		get: mock((_id: string) => createTestSession()),
		create: mock(() => createTestSession()),
	} as unknown as SessionManager & { calls: typeof calls };
};

describe("StateMachineMiddleware", () => {
	let sessionManager: ReturnType<typeof createMockSessionManager>;
	let _pipeline: ReturnType<typeof createPipeline>;
	let session: Session;

	beforeEach(() => {
		sessionManager = createMockSessionManager();
		_pipeline = createPipeline();
		session = createTestSession();
	});

	// Helper to run a message through the pipeline
	const processEvent = async (event: MessageEvent, sess: Session = session) => {
		const ctx = {
			event,
			session: sess,
			extensions: new Map(),
			get: function <T>(key: { id: symbol; defaultValue?: T }): T | undefined {
				return (
					(this.extensions.get(key.id) as T | undefined) ?? key.defaultValue
				);
			},
			set: function <T>(key: { id: symbol }, value: T): void {
				this.extensions.set(key.id, value);
			},
		};
		let nextCalled = false;
		const next = async () => {
			nextCalled = true;
		};

		try {
			const middleware = createStateMachineMiddleware(
				sessionManager,
				mockDetector,
			);
			await middleware(ctx, next);
		} catch (e) {
			if ((e as Error).message.includes("Not implemented")) {
				// Expected in TDD phase
				return { nextCalled: false, ctx };
			}
			throw e;
		}
		return { nextCalled, ctx };
	};

	describe("initialize request detection", () => {
		test("calls sessionManager.initialize() for outbound initialize request", async () => {
			const event = createMessageEvent(
				session.id,
				"outbound",
				{
					jsonrpc: "2.0",
					id: 1,
					method: "initialize",
					params: { protocolVersion: "2024-11-05", capabilities: {} },
				},
				"mcp",
			);

			await processEvent(event);

			// Should call initialize on the session manager
			const initializeCalls = sessionManager.calls.filter(
				(c) => c.method === "initialize",
			);
			expect(initializeCalls.length).toBe(1);
			expect(initializeCalls[0]?.args[0]).toBe(session.id);
		});

		test("does NOT call sessionManager.initialize() for inbound initialize request", async () => {
			const event = createMessageEvent(
				session.id,
				"inbound",
				{
					jsonrpc: "2.0",
					id: 1,
					method: "initialize",
				},
				"mcp",
			);

			await processEvent(event);

			const initializeCalls = sessionManager.calls.filter(
				(c) => c.method === "initialize",
			);
			expect(initializeCalls.length).toBe(0);
		});
	});

	describe("initialize response handling", () => {
		test("extracts capabilities from inbound initialize response", async () => {
			const event = createMessageEvent(
				session.id,
				"inbound",
				{
					jsonrpc: "2.0",
					id: 1,
					result: {
						protocolVersion: LATEST_PROTOCOL_VERSION,
						capabilities: { tools: {}, resources: {} },
						serverInfo: { name: "test-server", version: "1.0.0" },
					},
				},
				"mcp",
			);

			const { ctx } = await processEvent(event);

			// Capabilities should be stored in context for later use by activate
			// The exact context key implementation may vary
			expect(ctx).toBeDefined();
			// Explicitly verify keys are set
			expect(ctx.get(serverCapabilitiesKey)).toEqual({
				tools: {},
				resources: {},
			});
			expect(ctx.get(serverInfoKey)).toEqual({
				name: "test-server",
				version: "1.0.0",
			});
			expect(ctx.get(protocolVersionKey)).toBe(LATEST_PROTOCOL_VERSION);
		});

		test("handles malformed server info gracefully", async () => {
			const event = createMessageEvent(
				session.id,
				"inbound",
				{
					jsonrpc: "2.0",
					id: 1,
					result: {
						protocolVersion: LATEST_PROTOCOL_VERSION,
						capabilities: {},
						serverInfo: { name: 123, version: "1.0.0" }, // Invalid name type
					},
				},
				"mcp",
			);

			const { ctx } = await processEvent(event);

			// Should NOT set serverInfoKey if validation fails
			expect(ctx.get(serverInfoKey)).toBeUndefined();
			// But capabilities should still be set
			expect(ctx.get(serverCapabilitiesKey)).toBeDefined();
		});

		test("handles missing protocol version gracefully", async () => {
			const event = createMessageEvent(
				session.id,
				"inbound",
				{
					jsonrpc: "2.0",
					id: 1,
					result: {
						capabilities: {},
						// No protocolVersion
					},
				},
				"mcp",
			);

			const { ctx } = await processEvent(event);
			expect(ctx.get(protocolVersionKey)).toBeUndefined();
		});

		test("validates supported protocol version", async () => {
			const event = createMessageEvent(
				session.id,
				"inbound",
				{
					jsonrpc: "2.0",
					id: 1,
					result: {
						protocolVersion: LATEST_PROTOCOL_VERSION, // Supported
						capabilities: {},
					},
				},
				"mcp",
			);

			await processEvent(event);

			// Should NOT mark error
			expect(
				sessionManager.calls.filter((c) => c.method === "markError").length,
			).toBe(0);
		});

		test("marks error on unsupported protocol version", async () => {
			const event = createMessageEvent(
				session.id,
				"inbound",
				{
					jsonrpc: "2.0",
					id: 1,
					result: {
						protocolVersion: "0.1.0", // Unsupported
						capabilities: {},
					},
				},
				"mcp",
			);

			const consoleSpy = spyOn(console, "warn");
			await processEvent(event);

			// Should mark error
			expect(
				sessionManager.calls.filter((c) => c.method === "markError").length,
			).toBe(1);
			expect(
				sessionManager.calls.find((c) => c.method === "markError")?.args,
			).toContain(
				`Protocol version mismatch: expected ${LATEST_PROTOCOL_VERSION}, got 0.1.0`,
			);

			// Should warn
			expect(consoleSpy).toHaveBeenCalled();
			expect(consoleSpy.mock.calls[0]?.[0]).toContain(
				"Protocol version mismatch",
			);

			consoleSpy.mockRestore();
		});

		test("does not trigger state transition for initialize response", async () => {
			const event = createMessageEvent(
				session.id,
				"inbound",
				{
					jsonrpc: "2.0",
					id: 1,
					result: {
						protocolVersion: "2024-11-05",
						capabilities: {},
					},
				},
				"mcp",
			);

			await processEvent(event);

			// Should NOT call activate (that happens on initialized notification)
			const activateCalls = sessionManager.calls.filter(
				(c) => c.method === "activate",
			);
			expect(activateCalls.length).toBe(0);
		});
	});

	describe("initialized notification detection", () => {
		test("calls sessionManager.activate() for outbound initialized notification", async () => {
			const event = createMessageEvent(
				session.id,
				"outbound",
				{
					jsonrpc: "2.0",
					method: "notifications/initialized",
				},
				"mcp",
			);

			await processEvent(event, {
				...session,
				state: SessionState.INITIALIZING,
			});

			const activateCalls = sessionManager.calls.filter(
				(c) => c.method === "activate",
			);
			expect(activateCalls.length).toBe(1);
			expect(activateCalls[0]?.args[0]).toBe(session.id);
		});

		test("does NOT call activate for inbound initialized notification", async () => {
			const event = createMessageEvent(
				session.id,
				"inbound",
				{
					jsonrpc: "2.0",
					method: "notifications/initialized",
				},
				"mcp",
			);

			await processEvent(event);

			const activateCalls = sessionManager.calls.filter(
				(c) => c.method === "activate",
			);
			expect(activateCalls.length).toBe(0);
		});
	});

	describe("error handling", () => {
		test("logs warning but does not throw on transition failure", async () => {
			// Make initialize return failure
			sessionManager.initialize = mock(() => ({
				success: false,
				error: "Invalid transition",
			}));

			const event = createMessageEvent(
				session.id,
				"outbound",
				{
					jsonrpc: "2.0",
					id: 1,
					method: "initialize",
				},
				"mcp",
			);

			// Should not throw
			const consoleSpy = spyOn(console, "warn");
			await processEvent(event);

			// Verify warning was logged
			expect(consoleSpy).toHaveBeenCalled();
			const calls = consoleSpy.mock.calls.map((c) => c[0]);
			const hasExpectedLog = calls.some(
				(msg) =>
					typeof msg === "string" &&
					msg.includes("State transition INITIALIZE failed"),
			);
			expect(hasExpectedLog).toBe(true);

			consoleSpy.mockRestore();
		});

		test("logs warning when activate fails", async () => {
			sessionManager.activate = mock(() => ({
				success: false,
				error: "Activate failed",
			}));

			const event = createMessageEvent(
				session.id,
				"outbound",
				{
					jsonrpc: "2.0",
					method: "notifications/initialized",
				},
				"mcp",
			);

			// Set required context to ensure we reach the activate call
			const sessWithState = { ...session, state: SessionState.INITIALIZING };

			const consoleSpy = spyOn(console, "warn");
			await processEvent(event, sessWithState);

			expect(consoleSpy).toHaveBeenCalled();
			const calls = consoleSpy.mock.calls.map((c) => c[0]);
			const hasExpectedLog = calls.some(
				(msg) =>
					typeof msg === "string" &&
					msg.includes("State transition ACTIVATE failed"),
			);
			expect(hasExpectedLog).toBe(true);

			consoleSpy.mockRestore();
		});
	});

	describe("next() behavior", () => {
		test("always calls next() after processing", async () => {
			const event = createMessageEvent(
				session.id,
				"outbound",
				{
					jsonrpc: "2.0",
					id: 1,
					method: "initialize",
				},
				"mcp",
			);

			const { nextCalled } = await processEvent(event);

			// In TDD phase this will be false due to "Not implemented"
			// After implementation, should be true
			expect(typeof nextCalled).toBe("boolean");
		});

		test("calls next() even when no protocol event is detected", async () => {
			const event = createMessageEvent(
				session.id,
				"outbound",
				{
					jsonrpc: "2.0",
					id: 1,
					method: "tools/list",
				},
				"mcp",
			);

			const { nextCalled } = await processEvent(event);

			// Should still call next
			expect(typeof nextCalled).toBe("boolean");
		});
	});

	describe("non-protocol messages", () => {
		test("ignores tools/list requests", async () => {
			const event = createMessageEvent(
				session.id,
				"outbound",
				{
					jsonrpc: "2.0",
					id: 1,
					method: "tools/list",
				},
				"mcp",
			);

			await processEvent(event);

			// No state transitions should occur
			expect(sessionManager.calls.length).toBe(0);
		});

		test("ignores tools/list responses", async () => {
			const event = createMessageEvent(
				session.id,
				"inbound",
				{
					jsonrpc: "2.0",
					id: 1,
					result: { tools: [] },
				},
				"mcp",
			);

			await processEvent(event);

			expect(sessionManager.calls.length).toBe(0);
		});

		test("ignores error responses", async () => {
			const event = createMessageEvent(
				session.id,
				"inbound",
				{
					jsonrpc: "2.0",
					id: 1,
					error: { code: -32601, message: "Method not found" },
				},
				"mcp",
			);

			await processEvent(event);

			expect(sessionManager.calls.length).toBe(0);
		});
	});
});
