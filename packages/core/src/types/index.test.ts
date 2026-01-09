/**
 * Core Types Tests
 */

import { describe, expect, test } from "bun:test";
import {
	createContextKey,
	createMessageEvent,
	createSession,
	Direction,
	type JsonRpcRequest,
	MessageEventSchema,
	ServerConfigSchema,
	SessionSchema,
	SessionState,
	TransportType,
} from "./index";

describe("Core Types", () => {
	describe("Enums", () => {
		test("SessionState has correct values", () => {
			expect(SessionState.CREATED).toBe("CREATED");
			expect(SessionState.INITIALIZING).toBe("INITIALIZING");
			expect(SessionState.ACTIVE).toBe("ACTIVE");
			expect(SessionState.CLOSED).toBe("CLOSED");
			expect(SessionState.ERROR).toBe("ERROR");
		});

		test("Direction has correct values", () => {
			expect(Direction.INBOUND).toBe("inbound");
			expect(Direction.OUTBOUND).toBe("outbound");
		});

		test("TransportType has correct values", () => {
			expect(TransportType.STDIO).toBe("stdio");
			expect(TransportType.HTTP).toBe("http");
		});
	});

	describe("ServerConfigSchema", () => {
		test("validates STDIO config", () => {
			const config = {
				name: "test-server",
				transport: "stdio",
				command: "node",
				args: ["server.js"],
			};
			const result = ServerConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		test("validates HTTP config", () => {
			const config = {
				name: "test-server",
				transport: "http",
				url: "http://localhost:3000",
			};
			const result = ServerConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
			// Also verify the parsed data matches input
			if (result.success) {
				expect(result.data.name).toBe("test-server");
				expect(result.data.transport).toBe("http");
				expect(result.data.url).toBe("http://localhost:3000");
			}
		});

		test("rejects empty name", () => {
			const config = {
				name: "",
				transport: "stdio",
			};
			const result = ServerConfigSchema.safeParse(config);
			expect(result.success).toBe(false);
		});

		test("rejects invalid transport", () => {
			const config = {
				name: "test",
				transport: "websocket",
			};
			const result = ServerConfigSchema.safeParse(config);
			expect(result.success).toBe(false);
		});
	});

	describe("SessionSchema", () => {
		test("validates complete session", () => {
			const session = {
				id: crypto.randomUUID(),
				state: "ACTIVE",
				createdAt: new Date(),
				updatedAt: new Date(),
				config: {
					name: "test",
					transport: "stdio",
					command: "node",
				},
				protocol: "mcp",
			};
			const result = SessionSchema.safeParse(session);
			expect(result.success).toBe(true);
		});

		test("tracks lifecycle state", () => {
			const states = ["CREATED", "INITIALIZING", "ACTIVE", "CLOSED", "ERROR"];
			for (const state of states) {
				const session = {
					id: crypto.randomUUID(),
					state,
					createdAt: new Date(),
					updatedAt: new Date(),
					config: { name: "test", transport: "stdio" },
				};
				const result = SessionSchema.safeParse(session);
				expect(result.success).toBe(true);
			}
		});
	});

	describe("MessageEventSchema", () => {
		test("validates message event with required fields", () => {
			const event = {
				id: crypto.randomUUID(),
				sessionId: crypto.randomUUID(),
				timestamp: new Date(),
				direction: "outbound",
				protocol: "mcp",
				payload: {
					jsonrpc: "2.0",
					id: 1,
					method: "tools/list",
				},
				method: "tools/list",
				requestId: 1,
				size: 50,
			};
			const result = MessageEventSchema.safeParse(event);
			expect(result.success).toBe(true);
		});

		test("contains required fields with correct values", () => {
			const inputSessionId = crypto.randomUUID();
			const inputPayload: JsonRpcRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "test",
			};
			const event = createMessageEvent(
				inputSessionId,
				"outbound",
				inputPayload,
			);

			// Verify id is a valid UUID format (not just defined)
			expect(event.id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			);
			// Verify sessionId matches input (not just defined)
			expect(event.sessionId).toBe(inputSessionId);
			expect(event.timestamp).toBeInstanceOf(Date);
			// Verify timestamp is recent (within last second)
			expect(Date.now() - event.timestamp.getTime()).toBeLessThan(1000);
			expect(event.direction).toBe("outbound");
			// Verify payload matches input (not just defined)
			expect(event.payload).toEqual(inputPayload);
		});
	});

	describe("createSession", () => {
		test("creates session with unique ID", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session1 = createSession(config);
			const session2 = createSession(config);

			expect(session1.id).not.toBe(session2.id);
		});

		test("creates session in CREATED state", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = createSession(config);

			expect(session.state).toBe(SessionState.CREATED);
		});

		test("stores config reference", () => {
			const config = {
				name: "my-server",
				transport: "stdio" as const,
				command: "node",
			};
			const session = createSession(config);

			expect(session.config).toEqual(config);
		});
	});

	describe("createMessageEvent", () => {
		test("extracts method from request payload", () => {
			const payload: JsonRpcRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "tools/call",
			};
			const event = createMessageEvent(
				crypto.randomUUID(),
				"outbound",
				payload,
			);

			expect(event.method).toBe("tools/call");
		});

		test("extracts requestId from payload", () => {
			const payload: JsonRpcRequest = {
				jsonrpc: "2.0",
				id: 42,
				method: "test",
			};
			const event = createMessageEvent(
				crypto.randomUUID(),
				"outbound",
				payload,
			);

			expect(event.requestId).toBe(42);
		});

		test("calculates size in bytes", () => {
			const payload: JsonRpcRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "test",
			};
			const event = createMessageEvent(
				crypto.randomUUID(),
				"outbound",
				payload,
			);

			expect(event.size).toBe(JSON.stringify(payload).length);
		});
	});

	describe("createContextKey", () => {
		test("creates unique keys", () => {
			const key1 = createContextKey<string>("test1");
			const key2 = createContextKey<string>("test2");

			expect(key1.id).not.toBe(key2.id);
		});

		test("stores default value", () => {
			const key = createContextKey<number>("counter", 0);

			expect(key.defaultValue).toBe(0);
		});
	});
});
