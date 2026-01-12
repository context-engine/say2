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

			// Must go through valid transitions to close
			manager.connect(session1.id);
			manager.initialize(session1.id);
			manager.activate(session1.id);
			manager.close(session1.id);

			const sessions = manager.list();

			expect(sessions.length).toBe(1);
		});

		test("excludes error sessions", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session1 = manager.create(config);
			manager.create(config);
			manager.markError(session1.id, "Test error");

			const sessions = manager.list();

			expect(sessions.length).toBe(1);
		});
	});

	describe("listAll", () => {
		test("returns all sessions including closed and error", () => {
			const config = { name: "test", transport: "stdio" as const };
			const s1 = manager.create(config);
			const s2 = manager.create(config);
			const s3 = manager.create(config);

			// Close s1 (must go through valid transitions)
			manager.connect(s1.id);
			manager.initialize(s1.id);
			manager.activate(s1.id);
			manager.close(s1.id);

			// Set s2 to error
			manager.markError(s2.id, "Test error");

			// list() should only return s3
			expect(manager.list().length).toBe(1);

			// listAll() should return all 3
			const allSessions = manager.listAll();
			expect(allSessions.length).toBe(3);
			const ids = allSessions.map((s) => s.id);
			expect(ids).toContain(s1.id);
			expect(ids).toContain(s2.id);
			expect(ids).toContain(s3.id);
		});
	});

	describe("state transitions", () => {
		test("connect transitions from CREATED to CONNECTING", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			const result = manager.connect(session.id);

			expect(result.success).toBe(true);
			expect(manager.get(session.id)?.state).toBe(SessionState.CONNECTING);
		});

		test("initialize transitions from CONNECTING to INITIALIZING", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			manager.connect(session.id);
			const result = manager.initialize(session.id);

			expect(result.success).toBe(true);
			expect(manager.get(session.id)?.state).toBe(SessionState.INITIALIZING);
		});

		test("activate transitions from INITIALIZING to ACTIVE", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			manager.connect(session.id);
			manager.initialize(session.id);
			const result = manager.activate(session.id);

			expect(result.success).toBe(true);
			expect(manager.get(session.id)?.state).toBe(SessionState.ACTIVE);
		});

		test("activate stores capabilities", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			manager.connect(session.id);
			manager.initialize(session.id);
			manager.activate(
				session.id,
				{ tools: true },
				{ resources: true },
				"1.0.0",
			);

			const updated = manager.get(session.id);
			expect(updated?.clientCapabilities).toEqual({ tools: true });
			expect(updated?.serverCapabilities).toEqual({ resources: true });
			expect(updated?.protocolVersion).toBe("1.0.0");
		});

		test("close transitions from ACTIVE to CLOSED", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			manager.connect(session.id);
			manager.initialize(session.id);
			manager.activate(session.id);
			const result = manager.close(session.id);

			expect(result.success).toBe(true);
			expect(manager.get(session.id)?.state).toBe(SessionState.CLOSED);
		});

		test("markError transitions to ERROR from any state", () => {
			const config = { name: "test", transport: "stdio" as const };

			// From CREATED
			const s1 = manager.create(config);
			expect(manager.markError(s1.id, "Error 1").success).toBe(true);
			expect(manager.get(s1.id)?.state).toBe(SessionState.ERROR);

			// From CONNECTING
			const s1b = manager.create(config);
			manager.connect(s1b.id);
			expect(manager.markError(s1b.id, "Error 1b").success).toBe(true);
			expect(manager.get(s1b.id)?.state).toBe(SessionState.ERROR);

			// From INITIALIZING
			const s2 = manager.create(config);
			manager.connect(s2.id);
			manager.initialize(s2.id);
			expect(manager.markError(s2.id, "Error 2").success).toBe(true);
			expect(manager.get(s2.id)?.state).toBe(SessionState.ERROR);

			// From ACTIVE
			const s3 = manager.create(config);
			manager.connect(s3.id);
			manager.initialize(s3.id);
			manager.activate(s3.id);
			expect(manager.markError(s3.id, "Error 3").success).toBe(true);
			expect(manager.get(s3.id)?.state).toBe(SessionState.ERROR);
		});

		test("transitions through full lifecycle", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			expect(session.state).toBe(SessionState.CREATED);

			manager.connect(session.id);
			expect(manager.get(session.id)?.state).toBe(SessionState.CONNECTING);

			manager.initialize(session.id);
			expect(manager.get(session.id)?.state).toBe(SessionState.INITIALIZING);

			manager.activate(session.id);
			expect(manager.get(session.id)?.state).toBe(SessionState.ACTIVE);

			manager.close(session.id);
			expect(manager.get(session.id)?.state).toBe(SessionState.CLOSED);
		});
	});

	describe("invalid transitions", () => {
		test("cannot activate from CREATED state", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			const result = manager.activate(session.id);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid transition");
			expect(manager.get(session.id)?.state).toBe(SessionState.CREATED);
		});

		test("cannot close from CREATED state", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			const result = manager.close(session.id);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid transition");
			expect(manager.get(session.id)?.state).toBe(SessionState.CREATED);
		});

		test("cannot close from INITIALIZING state", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);
			manager.connect(session.id);
			manager.initialize(session.id);

			const result = manager.close(session.id);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid transition");
			expect(manager.get(session.id)?.state).toBe(SessionState.INITIALIZING);
		});

		test("cannot transition from terminal CLOSED state", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);
			manager.connect(session.id);
			manager.initialize(session.id);
			manager.activate(session.id);
			manager.close(session.id);

			const result = manager.connect(session.id);

			expect(result.success).toBe(false);
			expect(result.error).toContain("terminal state");
		});

		test("cannot transition from terminal ERROR state", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);
			manager.markError(session.id, "Test error");

			const result = manager.connect(session.id);

			expect(result.success).toBe(false);
			expect(result.error).toContain("terminal state");
		});
	});

	describe("updateCapabilities", () => {
		test("updates capabilities in ACTIVE state", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);
			manager.connect(session.id);
			manager.initialize(session.id);
			manager.activate(session.id);

			const result = manager.updateCapabilities(
				session.id,
				{ tools: true },
				{ resources: true },
			);

			expect(result.success).toBe(true);
			const updated = manager.get(session.id);
			expect(updated?.clientCapabilities).toEqual({ tools: true });
			expect(updated?.serverCapabilities).toEqual({ resources: true });
		});

		test("only updates clientCapabilities when serverCapabilities is undefined", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);
			manager.connect(session.id);
			manager.initialize(session.id);
			manager.activate(session.id, { tools: true }, { resources: true });

			// Now update only client
			manager.updateCapabilities(session.id, { prompts: true }, undefined);

			const updated = manager.get(session.id);
			// Client should be updated
			expect(updated?.clientCapabilities).toEqual({ prompts: true });
			// Server should remain unchanged
			expect(updated?.serverCapabilities).toEqual({ resources: true });
		});

		test("only updates serverCapabilities when clientCapabilities is undefined", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);
			manager.connect(session.id);
			manager.initialize(session.id);
			manager.activate(session.id, { tools: true }, { resources: true });

			// Now update only server
			manager.updateCapabilities(session.id, undefined, { sampling: true });

			const updated = manager.get(session.id);
			// Client should remain unchanged
			expect(updated?.clientCapabilities).toEqual({ tools: true });
			// Server should be updated
			expect(updated?.serverCapabilities).toEqual({ sampling: true });
		});

		test("fails for non-ACTIVE sessions", () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);

			const result = manager.updateCapabilities(
				session.id,
				{ tools: true },
				undefined,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Cannot update capabilities");
		});

		test("returns error for unknown session ID", () => {
			const result = manager.updateCapabilities(
				"non-existent",
				{ tools: true },
				{ resources: true },
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Session not found");
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

	describe("timestamp updates", () => {
		test("updates updatedAt on state transitions", async () => {
			const config = { name: "test", transport: "stdio" as const };
			const session = manager.create(config);
			const originalUpdatedAt = session.updatedAt;

			// Actual delay to ensure timestamp differs
			await new Promise((r) => setTimeout(r, 5));
			manager.connect(session.id);

			const updated = manager.get(session.id);
			expect(updated?.updatedAt.getTime()).toBeGreaterThan(
				originalUpdatedAt.getTime(),
			);
		});
	});
});
