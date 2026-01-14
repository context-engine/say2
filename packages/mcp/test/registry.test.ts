/**
 * McpClientRegistry Unit Tests
 *
 * Tests for the client registry that holds MCP SDK clients by sessionId.
 * TDD-style: Tests define expected behavior before implementation.
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { McpClientRegistry } from "../src/client/registry";

// Mock types for testing
const createMockClient = () =>
	({
		close: async () => {},
	}) as unknown as import("@modelcontextprotocol/sdk/client/index.js").Client;

const createMockTransport = () =>
	({
		close: async () => {},
	}) as unknown as import("../src/transport").LoggingTransport;

describe("McpClientRegistry", () => {
	let registry: McpClientRegistry;

	beforeEach(() => {
		registry = new McpClientRegistry();
	});

	describe("register", () => {
		test("registers a new client entry", () => {
			const sessionId = "session-1";
			const client = createMockClient();
			const transport = createMockTransport();

			// Should not throw
			registry.register(sessionId, client, transport);

			// Should be retrievable
			const entry = registry.get(sessionId);
			expect(entry).toBeDefined();
			expect(entry?.sessionId).toBe(sessionId);
			expect(entry?.client).toBe(client);
			expect(entry?.transport).toBe(transport);
		});

		test("sets connectedAt timestamp on registration", () => {
			const sessionId = "session-1";
			const before = new Date();

			registry.register(sessionId, createMockClient(), createMockTransport());

			const entry = registry.get(sessionId);
			expect(entry?.connectedAt).toBeInstanceOf(Date);
			expect(entry?.connectedAt.getTime()).toBeGreaterThanOrEqual(
				before.getTime(),
			);
			expect(entry?.connectedAt.getTime()).toBeLessThanOrEqual(Date.now());
		});

		test("throws error with exact message when registering duplicate sessionId", () => {
			const sessionId = "session-1";
			registry.register(sessionId, createMockClient(), createMockTransport());

			// Verify exact error message - mutation would change this
			expect(() => {
				registry.register(sessionId, createMockClient(), createMockTransport());
			}).toThrow(`Client already registered for session: ${sessionId}`);
		});

		test("allows registering multiple different sessions", () => {
			registry.register("session-1", createMockClient(), createMockTransport());
			registry.register("session-2", createMockClient(), createMockTransport());
			registry.register("session-3", createMockClient(), createMockTransport());

			expect(registry.list().length).toBe(3);
		});
	});

	describe("get", () => {
		test("returns undefined for non-existent sessionId", () => {
			const result = registry.get("non-existent");
			expect(result).toBeUndefined();
		});

		test("returns entry for registered sessionId", () => {
			const sessionId = "session-1";
			const client = createMockClient();
			registry.register(sessionId, client, createMockTransport());

			const entry = registry.get(sessionId);
			expect(entry).toBeDefined();
			expect(entry?.client).toBe(client);
		});

		test("returns same instance on multiple get calls", () => {
			const sessionId = "session-1";
			registry.register(sessionId, createMockClient(), createMockTransport());

			const entry1 = registry.get(sessionId);
			const entry2 = registry.get(sessionId);
			expect(entry1).toBe(entry2);
		});
	});

	describe("remove", () => {
		test("returns false for non-existent sessionId", () => {
			const result = registry.remove("non-existent");
			expect(result).toBe(false);
		});

		test("returns true and removes existing entry", () => {
			const sessionId = "session-1";
			registry.register(sessionId, createMockClient(), createMockTransport());

			const result = registry.remove(sessionId);

			expect(result).toBe(true);
			expect(registry.get(sessionId)).toBeUndefined();
		});

		test("does not affect other entries when removing", () => {
			registry.register("session-1", createMockClient(), createMockTransport());
			registry.register("session-2", createMockClient(), createMockTransport());

			registry.remove("session-1");

			expect(registry.get("session-1")).toBeUndefined();
			expect(registry.get("session-2")).toBeDefined();
		});

		test("returns false on second remove of same sessionId", () => {
			const sessionId = "session-1";
			registry.register(sessionId, createMockClient(), createMockTransport());

			expect(registry.remove(sessionId)).toBe(true);
			expect(registry.remove(sessionId)).toBe(false);
		});
	});

	describe("list", () => {
		test("returns empty array when no entries", () => {
			const result = registry.list();
			expect(result).toEqual([]);
		});

		test("returns all registered entries", () => {
			registry.register("session-1", createMockClient(), createMockTransport());
			registry.register("session-2", createMockClient(), createMockTransport());

			const result = registry.list();

			expect(result.length).toBe(2);
			expect(result.map((e) => e.sessionId)).toContain("session-1");
			expect(result.map((e) => e.sessionId)).toContain("session-2");
		});

		test("returns copy of entries (not internal reference)", () => {
			registry.register("session-1", createMockClient(), createMockTransport());

			const list1 = registry.list();
			const list2 = registry.list();

			// Should be different array instances
			expect(list1).not.toBe(list2);
			// But contain same data
			expect(list1).toEqual(list2);
		});

		test("updates reflect in subsequent list calls", () => {
			registry.register("session-1", createMockClient(), createMockTransport());
			expect(registry.list().length).toBe(1);

			registry.register("session-2", createMockClient(), createMockTransport());
			expect(registry.list().length).toBe(2);

			registry.remove("session-1");
			expect(registry.list().length).toBe(1);
		});
	});
});
