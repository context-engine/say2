/**
 * Session Manager Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { SessionState } from "../types";
import { SessionManager } from "./manager";

describe("SessionManager", () => {
	let manager: SessionManager;

	beforeEach(() => {
		manager = new SessionManager();
	});

	describe("create", () => {
		test("returns session with unique ID", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session1 = manager.create(config);
			const session2 = manager.create(config);

			expect(session1.id).toBeDefined();
			expect(session2.id).toBeDefined();
			expect(session1.id).not.toBe(session2.id);
		});

		test("creates session in CREATED state", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			expect(session.state).toBe(SessionState.CREATED);
		});

		test("stores config in session", () => {
			const config = {
				name: "my-server",
				transport: "http" as const,
				url: "http://localhost:3000",
			};
			const session = manager.create(config);

			expect(session.config).toEqual(config);
		});
	});

	describe("get", () => {
		test("returns session by ID", () => {
			const config = { name: "test", transport: "stdio" as const };
			const created = manager.create(config);
			const retrieved = manager.get(created.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(created.id);
		});

		test("returns undefined for unknown ID", () => {
			const result = manager.get("non-existent-id");

			expect(result).toBeUndefined();
		});
	});

	describe("list", () => {
		test("returns all active sessions", () => {
			const config = { name: "test", transport: "stdio" as const };
			const s1 = manager.create(config);
			const s2 = manager.create(config);
			const s3 = manager.create(config);

			const sessions = manager.list();

			expect(sessions.length).toBe(3);
			// Verify actual sessions are returned, not garbage
			const ids = sessions.map((s) => s.id);
			expect(ids).toContain(s1.id);
			expect(ids).toContain(s2.id);
			expect(ids).toContain(s3.id);
		});

		test("excludes closed sessions", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session1 = manager.create(config);
			manager.create(config);
			manager.close(session1.id);

			const sessions = manager.list();

			expect(sessions.length).toBe(1);
		});

		test("excludes error sessions", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session1 = manager.create(config);
			manager.create(config);
			manager.updateState(session1.id, SessionState.ERROR);

			const sessions = manager.list();

			expect(sessions.length).toBe(1);
		});
	});

	describe("close", () => {
		test("updates session state to CLOSED", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);
			manager.close(session.id);

			const updated = manager.get(session.id);

			expect(updated?.state).toBe(SessionState.CLOSED);
		});

		test("updates updatedAt timestamp", async () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);
			const originalUpdatedAt = session.updatedAt;

			// Actual delay to ensure timestamp differs
			await new Promise((r) => setTimeout(r, 5));
			manager.close(session.id);

			const updated = manager.get(session.id);
			// Use > not >= to ensure timestamp actually changed
			expect(updated?.updatedAt.getTime()).toBeGreaterThan(
				originalUpdatedAt.getTime(),
			);
		});
	});

	describe("updateState", () => {
		test("transitions through lifecycle states", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			expect(session.state).toBe(SessionState.CREATED);

			manager.updateState(session.id, SessionState.INITIALIZING);
			expect(manager.get(session.id)?.state).toBe(SessionState.INITIALIZING);

			manager.updateState(session.id, SessionState.ACTIVE);
			expect(manager.get(session.id)?.state).toBe(SessionState.ACTIVE);

			manager.updateState(session.id, SessionState.CLOSED);
			expect(manager.get(session.id)?.state).toBe(SessionState.CLOSED);
		});
	});

	describe("updateCapabilities", () => {
		test("stores client capabilities", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			manager.updateCapabilities(session.id, { tools: true }, undefined);

			const updated = manager.get(session.id);
			expect(updated?.clientCapabilities).toEqual({ tools: true });
		});

		test("stores server capabilities", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			manager.updateCapabilities(session.id, undefined, { resources: true });

			const updated = manager.get(session.id);
			expect(updated?.serverCapabilities).toEqual({ resources: true });
		});
	});

	describe("delete", () => {
		test("removes session from memory", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			const deleted = manager.delete(session.id);

			expect(deleted).toBe(true);
			expect(manager.get(session.id)).toBeUndefined();
		});

		test("returns false for unknown ID", () => {
			const deleted = manager.delete("non-existent");

			expect(deleted).toBe(false);
		});
	});

	describe("count", () => {
		test("returns total session count", () => {
			const config = { name: "test", transport: "stdio" as const };
			manager.create(config);
			manager.create(config);

			expect(manager.count()).toBe(2);
		});
	});
});
