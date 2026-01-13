/**
 * LoggingTransport Unit Tests
 *
 * Tests for the transport decorator that intercepts messages for observation.
 * TDD-style: Tests define expected interception behavior before implementation.
 */

import { beforeEach, describe, expect, test } from "bun:test";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import {
	createPipeline,
	type MessageEvent,
	type Session,
	SessionState,
} from "@say2/core";
import { LoggingTransport } from "../src/transport/logging-transport";

// Test fixtures
const createTestSession = (): Session => ({
	id: "test-session-id",
	state: SessionState.CONNECTING,
	createdAt: new Date(),
	updatedAt: new Date(),
	config: { name: "test-server", transport: "stdio", command: "node" },
	protocol: "mcp",
	mode: "client",
});

const createMockWrappedTransport = (): Transport & {
	triggerOnMessage: (msg: JSONRPCMessage) => void;
	triggerOnClose: () => void;
	triggerOnError: (err: Error) => void;
	sentMessages: JSONRPCMessage[];
} => {
	const sentMessages: JSONRPCMessage[] = [];
	let onmessageHandler: ((msg: JSONRPCMessage) => void) | undefined;
	let oncloseHandler: (() => void) | undefined;
	let onerrorHandler: ((err: Error) => void) | undefined;

	return {
		sentMessages,
		send: async (message: JSONRPCMessage) => {
			sentMessages.push(message);
		},
		start: async () => { },
		close: async () => { },
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
		triggerOnMessage: (msg: JSONRPCMessage) => onmessageHandler?.(msg),
		triggerOnClose: () => oncloseHandler?.(),
		triggerOnError: (err: Error) => onerrorHandler?.(err),
	};
};

describe("LoggingTransport", () => {
	let session: Session;
	let wrappedTransport: ReturnType<typeof createMockWrappedTransport>;
	let pipeline: ReturnType<typeof createPipeline>;
	let loggingTransport: LoggingTransport;

	beforeEach(() => {
		session = createTestSession();
		wrappedTransport = createMockWrappedTransport();
		pipeline = createPipeline();
		loggingTransport = new LoggingTransport(
			wrappedTransport,
			session,
			pipeline,
		);
	});

	describe("constructor", () => {
		test("creates transport with session reference", () => {
			expect(loggingTransport.sessionId).toBe(session.id);
		});
	});

	describe("outbound messages (send)", () => {
		test("forwards message to wrapped transport", async () => {
			const message: JSONRPCMessage = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
			};

			await loggingTransport.send(message);

			expect(wrappedTransport.sentMessages.length).toBe(1);
			expect(wrappedTransport.sentMessages[0]).toEqual(message);
		});

		test("runs pipeline before forwarding", async () => {
			const processedEvents: MessageEvent[] = [];
			pipeline.use(async (ctx, next) => {
				processedEvents.push(ctx.event);
				await next();
			});

			const message: JSONRPCMessage = {
				jsonrpc: "2.0",
				id: 1,
				method: "tools/list",
			};

			await loggingTransport.send(message);

			expect(processedEvents.length).toBe(1);
			expect(processedEvents[0]?.direction).toBe("outbound");
			expect(processedEvents[0]?.sessionId).toBe(session.id);
			expect(processedEvents[0]?.payload).toEqual(message);
		});

		test("creates MessageEvent with correct fields", async () => {
			let capturedEvent: MessageEvent | undefined;
			pipeline.use(async (ctx, next) => {
				capturedEvent = ctx.event;
				await next();
			});

			const message: JSONRPCMessage = {
				jsonrpc: "2.0",
				id: 42,
				method: "resources/list",
			};

			await loggingTransport.send(message);

			expect(capturedEvent).toBeDefined();
			expect(capturedEvent?.id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			);
			expect(capturedEvent?.sessionId).toBe(session.id);
			expect(capturedEvent?.direction).toBe("outbound");
			expect(capturedEvent?.protocol).toBe("mcp");
			expect(capturedEvent?.method).toBe("resources/list");
			expect(capturedEvent?.requestId).toBe(42);
			expect(capturedEvent?.timestamp).toBeInstanceOf(Date);
		});

		test("preserves message byte-for-byte (no modification)", async () => {
			const originalMessage: JSONRPCMessage = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: { protocolVersion: "2024-11-05", capabilities: {} },
			};
			const originalJson = JSON.stringify(originalMessage);

			await loggingTransport.send(originalMessage);

			const sentJson = JSON.stringify(wrappedTransport.sentMessages[0]);
			expect(sentJson).toBe(originalJson);
		});

		test("propagates pipeline errors", async () => {
			pipeline.use(async () => {
				throw new Error("Pipeline error");
			});

			const message: JSONRPCMessage = { jsonrpc: "2.0", id: 1, method: "test" };

			await expect(loggingTransport.send(message)).rejects.toThrow(
				"Pipeline error",
			);
		});

		test("does not forward if pipeline throws", async () => {
			pipeline.use(async () => {
				throw new Error("Stop");
			});

			const message: JSONRPCMessage = { jsonrpc: "2.0", id: 1, method: "test" };

			try {
				await loggingTransport.send(message);
			} catch {
				// Expected
			}

			expect(wrappedTransport.sentMessages.length).toBe(0);
		});
	});

	describe("inbound messages (onmessage)", () => {
		test("calls registered onmessage handler", async () => {
			const receivedMessages: JSONRPCMessage[] = [];

			// Use a promise to wait for async pipeline processing
			let resolveHandler: () => void;
			const handlerPromise = new Promise<void>((resolve) => {
				resolveHandler = resolve;
			});

			loggingTransport.onmessage = (msg) => {
				receivedMessages.push(msg);
				resolveHandler();
			};

			const message: JSONRPCMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: { tools: [] },
			};
			wrappedTransport.triggerOnMessage(message);

			await handlerPromise;

			expect(receivedMessages.length).toBe(1);
			expect(receivedMessages[0]).toEqual(message);
		});

		test("runs pipeline for inbound messages", async () => {
			const processedEvents: MessageEvent[] = [];

			// Use a promise to wait for async pipeline processing
			let pipelineResolve: () => void;
			const pipelinePromise = new Promise<void>((resolve) => {
				pipelineResolve = resolve;
			});

			pipeline.use(async (ctx, next) => {
				processedEvents.push(ctx.event);
				await next();
				pipelineResolve();
			});

			loggingTransport.onmessage = () => { };

			const message: JSONRPCMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: { protocolVersion: "2024-11-05" },
			};
			wrappedTransport.triggerOnMessage(message);

			await pipelinePromise;

			expect(processedEvents.length).toBe(1);
			expect(processedEvents[0]?.direction).toBe("inbound");
			expect(processedEvents[0]?.sessionId).toBe(session.id);
		});

		test("creates MessageEvent with correct fields for responses", async () => {
			let capturedEvent: MessageEvent | undefined;

			let pipelineResolve: () => void;
			const pipelinePromise = new Promise<void>((resolve) => {
				pipelineResolve = resolve;
			});

			pipeline.use(async (ctx, next) => {
				capturedEvent = ctx.event;
				await next();
				pipelineResolve();
			});

			loggingTransport.onmessage = () => { };

			const message: JSONRPCMessage = {
				jsonrpc: "2.0",
				id: 42,
				result: { data: "test" },
			};
			wrappedTransport.triggerOnMessage(message);

			await pipelinePromise;

			expect(capturedEvent).toBeDefined();
			expect(capturedEvent?.direction).toBe("inbound");
			expect(capturedEvent?.requestId).toBe(42);
		});

		test("preserves message to handler (no modification)", async () => {
			const received: JSONRPCMessage[] = [];

			// Use a promise to wait for async pipeline processing
			let resolveHandler: () => void;
			const handlerPromise = new Promise<void>((resolve) => {
				resolveHandler = resolve;
			});

			loggingTransport.onmessage = (msg) => {
				received.push(msg);
				resolveHandler();
			};

			const originalMessage: JSONRPCMessage = {
				jsonrpc: "2.0",
				id: 1,
				result: { protocolVersion: "2024-11-05", capabilities: {} },
			};
			const originalJson = JSON.stringify(originalMessage);

			wrappedTransport.triggerOnMessage(originalMessage);

			await handlerPromise;

			const receivedJson = JSON.stringify(received[0]);
			expect(receivedJson).toBe(originalJson);
		});
	});

	describe("close", () => {
		test("calls wrapped transport close", async () => {
			let closeCalled = false;
			(wrappedTransport as { close: () => Promise<void> }).close = async () => {
				closeCalled = true;
			};

			await loggingTransport.close();

			expect(closeCalled).toBe(true);
		});

		test("triggers onclose handler", async () => {
			let oncloseCalled = false;
			loggingTransport.onclose = () => {
				oncloseCalled = true;
			};

			wrappedTransport.triggerOnClose();

			expect(oncloseCalled).toBe(true);
		});
	});

	describe("error handling", () => {
		test("propagates errors from wrapped transport", () => {
			const receivedErrors: Error[] = [];
			loggingTransport.onerror = (err) => receivedErrors.push(err);

			const testError = new Error("Transport error");
			wrappedTransport.triggerOnError(testError);

			expect(receivedErrors.length).toBe(1);
			expect(receivedErrors[0]).toBe(testError);
		});

		test("does not throw when onerror handler is undefined", () => {
			// Ensure handler is undefined
			loggingTransport.onerror = undefined;

			// Should not throw - optional chaining must work
			expect(() => {
				wrappedTransport.triggerOnError(new Error("Test error"));
			}).not.toThrow();
		});

		test("does not throw when onclose handler is undefined", () => {
			// Ensure handler is undefined
			loggingTransport.onclose = undefined;

			// Should not throw - optional chaining must work
			expect(() => {
				wrappedTransport.triggerOnClose();
			}).not.toThrow();
		});
	});

	describe("start", () => {
		test("calls wrapped transport start", async () => {
			let startCalled = false;
			(wrappedTransport as { start: () => Promise<void> }).start = async () => {
				startCalled = true;
			};

			await loggingTransport.start();

			expect(startCalled).toBe(true);
		});
	});
});
