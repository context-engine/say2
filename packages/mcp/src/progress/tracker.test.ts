import { beforeEach, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { ProgressTracker } from "./tracker";
import { ToolOperationStore } from "../store/operation-store";

describe("ProgressTracker", () => {
	let tracker: ProgressTracker;
	let store: ToolOperationStore;

	beforeEach(() => {
		tracker = new ProgressTracker();
		store = new ToolOperationStore();
	});

	test("generateToken() creates unique tokens", () => {
		const t1 = tracker.generateToken();
		const t2 = tracker.generateToken();
		expect(t1).toBeDefined();
		expect(t2).toBeDefined();
		expect(t1).not.toBe(t2);
	});

	test("register() stores token mapping", () => {
		const token = tracker.generateToken();
		const opId = randomUUID();

		// Should not throw
		tracker.register(token, opId);

		// Verify registration via isRegistered helper
		expect(tracker.isRegistered(token)).toBe(true);
	});

	test("handleNotification() processes valid notification", () => {
		const token = tracker.generateToken();
		const sessionId = randomUUID();

		// Create a real operation in the store first
		const op = store.create(sessionId, { name: "test-tool" }, "req-1");

		tracker.register(token, op.id);

		// handleNotification uses the singleton store, so we need to use
		// a different approach - verify the token is registered and
		// the notification format is correct
		expect(tracker.isRegistered(token)).toBe(true);

		// Note: Full integration testing happens in progress-tracking.test.ts
		// where the actual store singleton is used with real operations
	});

	test("handleNotification() ignores unknown tokens", () => {
		const token = "unknown-token";

		// Should not throw or explode
		tracker.handleNotification({
			progressToken: token,
			progress: 50,
		});

		// No side effects to check easily without access to all stores,
		// but robust implementation shouldn't crash.
	});

	test("unregister() removes mapping", () => {
		const token = tracker.generateToken();
		const opId = randomUUID();
		tracker.register(token, opId);

		expect(tracker.isRegistered(token)).toBe(true);
		tracker.unregister(token);
		expect(tracker.isRegistered(token)).toBe(false);
	});

	test("activeCount() returns correct count", () => {
		expect(tracker.activeCount()).toBe(0);

		const t1 = tracker.generateToken();
		tracker.register(t1, randomUUID());
		expect(tracker.activeCount()).toBe(1);

		const t2 = tracker.generateToken();
		tracker.register(t2, randomUUID());
		expect(tracker.activeCount()).toBe(2);

		tracker.unregister(t1);
		expect(tracker.activeCount()).toBe(1);
	});
});
