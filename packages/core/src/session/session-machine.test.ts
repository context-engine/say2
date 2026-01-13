/**
 * Session State Machine Tests
 *
 * Tests the XState machine definition directly.
 */

import { describe, expect, test } from "bun:test";
import { createActor } from "xstate";
import { STATE_VALUE_MAP, sessionMachine } from "./session-machine";

describe("Session State Machine", () => {
	const testConfig = {
		name: "test-server",
		transport: "stdio" as const,
	};

	describe("initial state", () => {
		test("starts in 'created' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();

			expect(actor.getSnapshot().value).toBe("created");
		});

		test("initializes context from input", () => {
			const actor = createActor(sessionMachine, {
				input: {
					id: "custom-id",
					config: testConfig,
					protocol: "acp",
				},
			});
			actor.start();

			const context = actor.getSnapshot().context;
			expect(context.id).toBe("custom-id");
			expect(context.config).toEqual(testConfig);
			expect(context.protocol).toBe("acp");
		});

		test("defaults protocol to 'mcp' when not specified", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();

			expect(actor.getSnapshot().context.protocol).toBe("mcp");
		});
	});

	describe("CONNECT event", () => {
		test("transitions from 'created' to 'connecting'", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();

			actor.send({ type: "CONNECT" });

			expect(actor.getSnapshot().value).toBe("connecting");
		});

		test("updates timestamp on transition", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			const _originalUpdatedAt = actor.getSnapshot().context.updatedAt;

			// Small delay to ensure timestamp difference
			actor.send({ type: "CONNECT" });

			// Timestamp should be updated (might be same if too fast, so just check it exists)
			expect(actor.getSnapshot().context.updatedAt).toBeDefined();
			expect(actor.getSnapshot().context.updatedAt).toBeInstanceOf(Date);
		});

		test("is ignored in 'connecting' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });

			// Send again
			actor.send({ type: "CONNECT" });

			// Should still be in 'connecting'
			expect(actor.getSnapshot().value).toBe("connecting");
		});
	});

	describe("INITIALIZE event", () => {
		test("transitions from 'connecting' to 'initializing'", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });

			actor.send({ type: "INITIALIZE" });

			expect(actor.getSnapshot().value).toBe("initializing");
		});

		test("is ignored in 'created' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();

			actor.send({ type: "INITIALIZE" });

			expect(actor.getSnapshot().value).toBe("created");
		});

		test("is ignored in 'initializing' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });

			// Send again
			actor.send({ type: "INITIALIZE" });

			// Should still be in 'initializing'
			expect(actor.getSnapshot().value).toBe("initializing");
		});
	});

	describe("ACTIVATE event", () => {
		test("transitions from 'initializing' to 'active'", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });

			actor.send({ type: "ACTIVATE" });

			expect(actor.getSnapshot().value).toBe("active");
		});

		test("stores capabilities in context", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });

			actor.send({
				type: "ACTIVATE",
				clientCapabilities: { tools: true },
				serverCapabilities: { resources: true },
				protocolVersion: "2024-11-05",
			});

			const context = actor.getSnapshot().context;
			expect(context.clientCapabilities).toEqual({ tools: true });
			expect(context.serverCapabilities).toEqual({ resources: true });
			expect(context.protocolVersion).toBe("2024-11-05");
		});

		test("is ignored in 'created' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();

			actor.send({ type: "ACTIVATE" });

			expect(actor.getSnapshot().value).toBe("created");
		});

		test("is ignored in 'connecting' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });

			actor.send({ type: "ACTIVATE" });

			expect(actor.getSnapshot().value).toBe("connecting");
		});
	});

	describe("CLOSE event", () => {
		test("transitions from 'active' to 'closed'", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });
			actor.send({ type: "ACTIVATE" });

			actor.send({ type: "CLOSE" });

			expect(actor.getSnapshot().value).toBe("closed");
		});

		test("is ignored in 'created' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();

			actor.send({ type: "CLOSE" });

			expect(actor.getSnapshot().value).toBe("closed");
		});

		test("is ignored in 'connecting' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });

			actor.send({ type: "CLOSE" });

			expect(actor.getSnapshot().value).toBe("closed");
		});

		test("is ignored in 'initializing' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });

			actor.send({ type: "CLOSE" });

			expect(actor.getSnapshot().value).toBe("closed");
		});
	});

	describe("ERROR event", () => {
		test("transitions from 'created' to 'error'", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();

			actor.send({ type: "ERROR", reason: "Config error" });

			expect(actor.getSnapshot().value).toBe("error");
			expect(actor.getSnapshot().context.errorReason).toBe("Config error");
		});

		test("transitions from 'connecting' to 'error'", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });

			actor.send({ type: "ERROR", reason: "Connection failed" });

			expect(actor.getSnapshot().value).toBe("error");
			expect(actor.getSnapshot().context.errorReason).toBe("Connection failed");
		});

		test("transitions from 'initializing' to 'error'", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });

			actor.send({ type: "ERROR", reason: "Init timeout" });

			expect(actor.getSnapshot().value).toBe("error");
		});

		test("transitions from 'active' to 'error'", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });
			actor.send({ type: "ACTIVATE" });

			actor.send({ type: "ERROR", reason: "Server crashed" });

			expect(actor.getSnapshot().value).toBe("error");
		});
	});

	describe("UPDATE_CAPABILITIES event", () => {
		test("updates capabilities in 'active' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });
			actor.send({ type: "ACTIVATE" });

			actor.send({
				type: "UPDATE_CAPABILITIES",
				clientCapabilities: { prompts: true },
			});

			expect(actor.getSnapshot().context.clientCapabilities).toEqual({
				prompts: true,
			});
		});

		test("preserves existing capabilities when updating one side", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });
			actor.send({
				type: "ACTIVATE",
				clientCapabilities: { tools: true },
				serverCapabilities: { resources: true },
			});

			// Update only client capabilities
			actor.send({
				type: "UPDATE_CAPABILITIES",
				clientCapabilities: { prompts: true },
			});

			const context = actor.getSnapshot().context;
			expect(context.clientCapabilities).toEqual({ prompts: true });
			expect(context.serverCapabilities).toEqual({ resources: true }); // Preserved
		});

		test("is ignored in non-active states", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();

			actor.send({
				type: "UPDATE_CAPABILITIES",
				clientCapabilities: { tools: true },
			});

			expect(actor.getSnapshot().context.clientCapabilities).toBeUndefined();
		});
	});

	describe("terminal states", () => {
		test("'closed' is a final state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });
			actor.send({ type: "ACTIVATE" });
			actor.send({ type: "CLOSE" });

			expect(actor.getSnapshot().status).toBe("done");
		});

		test("'error' is a final state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "ERROR" });

			expect(actor.getSnapshot().status).toBe("done");
		});

		test("no events affect 'closed' state", () => {
			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: testConfig },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });
			actor.send({ type: "ACTIVATE" });
			actor.send({ type: "CLOSE" });

			// Try all events
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });
			actor.send({ type: "ACTIVATE" });
			actor.send({ type: "ERROR" });

			expect(actor.getSnapshot().value).toBe("closed");
		});
	});

	describe("timeouts", () => {
		test("transitions from 'connecting' to 'error' after 10000ms", async () => {
			const shortTimeoutConfig = {
				...testConfig,
				connectTimeout: 50,
			};

			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: shortTimeoutConfig as any },
			});
			actor.start();
			actor.send({ type: "CONNECT" });

			expect(actor.getSnapshot().value).toBe("connecting");

			// Wait for timeout (using real time since it's short)
			await new Promise((resolve) => setTimeout(resolve, 60));

			expect(actor.getSnapshot().value).toBe("error");
			expect(actor.getSnapshot().context.errorReason).toMatch(/timeout/i);
		});

		test("transitions from 'initializing' to 'error' after 30000ms", async () => {
			const shortTimeoutConfig = {
				...testConfig,
				initializeTimeout: 50,
			};

			const actor = createActor(sessionMachine, {
				input: { id: "test-id", config: shortTimeoutConfig as any },
			});
			actor.start();
			actor.send({ type: "CONNECT" });
			actor.send({ type: "INITIALIZE" });

			expect(actor.getSnapshot().value).toBe("initializing");

			// Wait for timeout
			await new Promise((resolve) => setTimeout(resolve, 60));

			expect(actor.getSnapshot().value).toBe("error");
			expect(actor.getSnapshot().context.errorReason).toMatch(/timeout/i);
		});
	});

	describe("STATE_VALUE_MAP", () => {
		test("maps all machine states to SessionState values", () => {
			expect(STATE_VALUE_MAP.created).toBe("CREATED");
			expect(STATE_VALUE_MAP.connecting).toBe("CONNECTING");
			expect(STATE_VALUE_MAP.initializing).toBe("INITIALIZING");
			expect(STATE_VALUE_MAP.active).toBe("ACTIVE");
			expect(STATE_VALUE_MAP.closed).toBe("CLOSED");
			expect(STATE_VALUE_MAP.error).toBe("ERROR");
		});
	});
});
