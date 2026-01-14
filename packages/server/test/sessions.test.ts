import { beforeEach, describe, expect, test } from "bun:test";
import { SessionState, sessionManager } from "@say2/core";
import { app } from "../src/index";

describe("Session API", () => {
	beforeEach(() => {
		// Clean up sessions (not strictly needed since in-memory but good practice)
		// We can't really "clean" the singleton easily without an exposed method
		// so tests should rely on unique IDs or assuming fresh state if possible.
		// For now we just test creation.
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
			const data = (await res.json()) as any;
			expect(data.id).toBeDefined();
			expect(data.state).toBe(SessionState.CREATED); // Or CONNECTING depending on race
			expect(data.createdAt).toBeDefined();

			// Verify it exists in manager
			const session = sessionManager.get(data.id);
			expect(session).toBeDefined();
			expect(session?.config.name).toBe("test-session");
		});

		test("rejects invalid config", async () => {
			const res = await app.request("/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "bad-session",
					transport: "stdio",
					// Missing command
				}),
			});

			expect(res.status).toBe(400); // Bad Request
		});
	});

	describe("DELETE /sessions/:id", () => {
		test("closes session and returns 200/204", async () => {
			// Setup: create a session manually first
			const session = sessionManager.create({
				name: "to-delete",
				transport: "stdio",
				command: "echo",
			});

			const res = await app.request(`/sessions/${session.id}`, {
				method: "DELETE",
			});

			expect([200, 204]).toContain(res.status);

			// Verify closed in manager
			const updated = sessionManager.get(session.id);
			// Either fully removed or marked closed depending on impl strategy
			// Spec says "close session", typically it stays in history as CLOSED
			if (updated) {
				expect(updated.state).toBe(SessionState.CLOSED);
			}
		});

		test("returns 404 for unknown session", async () => {
			const res = await app.request("/sessions/non-existent-id", {
				method: "DELETE",
			});

			expect(res.status).toBe(404);
		});
	});
});
