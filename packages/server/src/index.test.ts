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
