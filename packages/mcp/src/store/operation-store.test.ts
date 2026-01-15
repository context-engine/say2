import { beforeEach, describe, expect, it } from "bun:test";
import { v4 as uuidv4 } from "uuid";
import type { ToolCallRequest, ToolCallResult } from "../types/tool";
import { ToolOperationStore } from "./operation-store";

describe("ToolOperationStore", () => {
	let store: ToolOperationStore;
	const sessionId = uuidv4();

	beforeEach(() => {
		store = new ToolOperationStore();
	});

	it("creates a new operation with correct initial state", () => {
		const request: ToolCallRequest = { name: "test", arguments: {} };
		const requestId = "req-1";

		const op = store.create(sessionId, request, requestId);

		expect(op.id).toBeDefined();
		expect(op.sessionId).toBe(sessionId);
		expect(op.requestId).toBe(requestId);
		expect(op.request).toEqual(request);
		expect(op.status).toBe("pending");
		expect(op.startedAt).toBeInstanceOf(Date);
		expect(op.result).toBeUndefined();
		expect(op.error).toBeUndefined();
	});

	it("retrieves an operation by ID", () => {
		const request: ToolCallRequest = { name: "test" };
		const created = store.create(sessionId, request, "req-1");

		const retrieved = store.get(created.id);
		expect(retrieved).toEqual(created);
	});

	it("updates an operation status and result", () => {
		const created = store.create(sessionId, { name: "test" }, "req-1");
		const result: ToolCallResult = {
			content: [{ type: "text", text: "done" }],
		};

		store.update(created.id, {
			status: "completed",
			result,
			completedAt: new Date(),
		});

		const updated = store.get(created.id);
		expect(updated?.status).toBe("completed");
		expect(updated?.result).toEqual(result);
		expect(updated?.completedAt).toBeInstanceOf(Date);
	});

	it("gets operations by session ID", () => {
		store.create(sessionId, { name: "op1" }, "req-1");
		store.create(sessionId, { name: "op2" }, "req-2");
		store.create(uuidv4(), { name: "other" }, "req-3");

		const sessionOps = store.getBySession(sessionId);
		expect(sessionOps).toHaveLength(2);
		expect(sessionOps.map((o) => o.request.name)).toContain("op1");
		expect(sessionOps.map((o) => o.request.name)).toContain("op2");
	});

	it("gets operation by request ID", () => {
		const created = store.create(sessionId, { name: "test" }, "unique-req-id");

		const found = store.getByRequestId("unique-req-id");
		expect(found).toEqual(created);
	});

	it("clears operations for a session", () => {
		store.create(sessionId, { name: "op1" }, "req-1");
		const otherSession = uuidv4();
		store.create(otherSession, { name: "op2" }, "req-2");

		store.clear(sessionId);

		expect(store.getBySession(sessionId)).toHaveLength(0);
		expect(store.getBySession(otherSession)).toHaveLength(1);
	});

	it("throws when updating non-existent operation", () => {
		expect(() => {
			store.update("fake-id", { status: "completed" });
		}).toThrow();
	});

	describe("Task 03: Progress Tracking", () => {
		it("initializes progressUpdates to empty array on create", () => {
			const op = store.create(sessionId, { name: "test" }, "req-1");
			expect(op.progressUpdates).toEqual([]);
		});

		it("updateProgress adds update to operation", () => {
			const op = store.create(sessionId, { name: "test" }, "req-1");
			const update = {
				id: "pu-1234-5678-9012-3456",
				operationId: op.id,
				progress: 50,
				total: 100,
				message: "Processing...",
				timestamp: new Date(),
			};
			store.updateProgress(op.id, update);

			const updated = store.get(op.id);
			expect(updated?.progressUpdates).toHaveLength(1);
			expect(updated?.progressUpdates[0]!.progress).toBe(50);
			expect(updated?.progressUpdates[0]!.message).toBe("Processing...");
		});

		it("updateProgress throws for non-existent operation", () => {
			expect(() => {
				store.updateProgress("fake-id", {
					id: "pu-1",
					operationId: "fake-id",
					progress: 50,
					timestamp: new Date(),
				});
			}).toThrow();
		});

		it("getProgress returns all updates for operation", () => {
			const op = store.create(sessionId, { name: "test" }, "req-1");
			store.updateProgress(op.id, {
				id: "pu-1",
				operationId: op.id,
				progress: 25,
				timestamp: new Date(),
			});
			store.updateProgress(op.id, {
				id: "pu-2",
				operationId: op.id,
				progress: 50,
				timestamp: new Date(),
			});

			const updates = store.getProgress(op.id);
			expect(updates).toHaveLength(2);
			expect(updates[0]!.progress).toBe(25);
			expect(updates[1]!.progress).toBe(50);
		});

		it("getProgress returns empty array for non-existent operation", () => {
			const updates = store.getProgress("fake-id");
			expect(updates).toEqual([]);
		});

		it("getLatestProgress returns most recent update", () => {
			const op = store.create(sessionId, { name: "test" }, "req-1");
			store.updateProgress(op.id, {
				id: "pu-1",
				operationId: op.id,
				progress: 25,
				timestamp: new Date(),
			});
			store.updateProgress(op.id, {
				id: "pu-2",
				operationId: op.id,
				progress: 75,
				timestamp: new Date(),
			});

			const latest = store.getLatestProgress(op.id);
			expect(latest?.progress).toBe(75);
		});

		it("getLatestProgress returns undefined for no updates", () => {
			const op = store.create(sessionId, { name: "test" }, "req-1");
			const latest = store.getLatestProgress(op.id);
			expect(latest).toBeUndefined();
		});
	});

	describe("Task 04: Cancellation", () => {
		it("initializes cancelRequested to false on create", () => {
			const op = store.create(sessionId, { name: "test" }, "req-1");
			expect(op.cancelRequested).toBe(false);
		});

		it("markCancelled updates status to cancelled", () => {
			const op = store.create(sessionId, { name: "test" }, "req-1");
			store.markCancelled(op.id, "User requested");

			const updated = store.get(op.id);
			expect(updated?.status).toBe("cancelled");
		});

		it("markCancelled sets cancelRequested to true", () => {
			const op = store.create(sessionId, { name: "test" }, "req-1");
			store.markCancelled(op.id);

			const updated = store.get(op.id);
			expect(updated?.cancelRequested).toBe(true);
		});

		it("markCancelled sets cancelReason", () => {
			const op = store.create(sessionId, { name: "test" }, "req-1");
			store.markCancelled(op.id, "Operation timed out");

			const updated = store.get(op.id);
			expect(updated?.cancelReason).toBe("Operation timed out");
		});

		it("markCancelled sets completedAt", () => {
			const op = store.create(sessionId, { name: "test" }, "req-1");
			store.markCancelled(op.id);

			const updated = store.get(op.id);
			expect(updated?.completedAt).toBeDefined();
			expect(updated?.completedAt!.getTime()).toBeGreaterThanOrEqual(
				op.startedAt.getTime(),
			);
		});

		it("markCancelled silently ignores non-existent operation", () => {
			// Should not throw - silently ignores for safety in concurrent scenarios
			store.markCancelled("fake-id", "Test");
			// No assertion needed - just verifying no throw
		});
	});
});
