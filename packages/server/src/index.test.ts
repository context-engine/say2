/**
 * @say2/server - HTTP Endpoint Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { messageStore, sessionManager } from "@say2/core";
import { app } from "./index";

describe("HTTP Server", () => {
	beforeEach(() => {
		// Clear state between tests
		for (const session of sessionManager.listAll()) {
			sessionManager.delete(session.id);
		}
		messageStore.clear();
	});

	describe("GET /health", () => {
		test("returns healthy status", async () => {
			const res = await app.request("/health");

			expect(res.status).toBe(200);
			const body = (await res.json()) as Record<string, unknown>;
			expect(body.status).toBe("healthy");
		});
	});

	describe("GET /", () => {
		test("returns server info", async () => {
			const res = await app.request("/");

			expect(res.status).toBe(200);
			const body = (await res.json()) as Record<string, unknown>;
			expect(body.name).toBe("Say2");
			expect(body.version).toBeDefined();
			expect(body.status).toBe("ok");
		});
	});

	describe("POST /sessions", () => {
		test("creates a new session and returns 201", async () => {
			const res = await app.request("/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "test-session",
					transport: "stdio",
					command: "echo",
					args: ["hello"],
				}),
			});

			expect(res.status).toBe(201);
			const body = (await res.json()) as Record<string, unknown>;
			expect(body.id).toBeDefined();
			expect(body.state).toBe("CREATED");

			// Verify persistence
			const session = sessionManager.get(body.id as string);
			expect(session).toBeDefined();
			expect(session?.config.name).toBe("test-session");
		});

		test("accepts timeout configuration", async () => {
			const res = await app.request("/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "timeout-test",
					transport: "stdio",
					command: "echo",
					connectTimeout: 5000,
					initializeTimeout: 15000,
				}),
			});

			expect(res.status).toBe(201);
			const body = (await res.json()) as Record<string, unknown>;
			const session = sessionManager.get(body.id as string);

			// These assertions verify that the config was passed through
			// Note: The session machine implementation needs to actually USE these
			// biome-ignore lint/suspicious/noExplicitAny: config is typed as ServerConfig which misses this field
			expect((session?.config as any).connectTimeout).toBe(5000);
			// biome-ignore lint/suspicious/noExplicitAny: config is typed as ServerConfig which misses this field
			expect((session?.config as any).initializeTimeout).toBe(15000);
		});
	});

	describe("DELETE /sessions/:id", () => {
		test("closes and removes session", async () => {
			const session = sessionManager.create({
				name: "to-delete",
				transport: "stdio",
			});

			const res = await app.request(`/sessions/${session.id}`, {
				method: "DELETE",
			});

			expect(res.status).toBe(204);

			// Verify removal
			expect(sessionManager.get(session.id)).toBeUndefined();
		});

		test("returns 404 for unknown session", async () => {
			const res = await app.request("/sessions/unknown-id", {
				method: "DELETE",
			});

			expect(res.status).toBe(404);
		});
	});

	describe("GET /sessions", () => {
		test("returns empty list when no sessions", async () => {
			const res = await app.request("/sessions");

			expect(res.status).toBe(200);
			const body = (await res.json()) as Record<string, unknown>;
			expect(body.sessions).toEqual([]);
		});

		test("returns list of active sessions", async () => {
			sessionManager.create({ name: "test1", transport: "stdio" });
			sessionManager.create({
				name: "test2",
				transport: "http",
				url: "http://localhost:3000",
			});

			const res = await app.request("/sessions");

			expect(res.status).toBe(200);
			const body = (await res.json()) as Record<string, unknown>;
			expect((body.sessions as unknown[]).length).toBe(2);
		});
	});

	describe("GET /sessions/:id", () => {
		test("returns session details", async () => {
			const session = sessionManager.create({
				name: "test",
				transport: "stdio",
			});

			const res = await app.request(`/sessions/${session.id}`);

			expect(res.status).toBe(200);
			const body = (await res.json()) as Record<string, unknown>;
			expect(body.id).toBe(session.id);
			expect(body.state).toBe("CREATED");
			expect(body.messageCount).toBe(0);
		});

		test("returns 404 for unknown session", async () => {
			const res = await app.request("/sessions/unknown-id");

			expect(res.status).toBe(404);
			const body = (await res.json()) as Record<string, unknown>;
			expect(body.error).toBe("Session not found");
		});
	});
});
