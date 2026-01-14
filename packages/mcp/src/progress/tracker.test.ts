import { beforeEach, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { ProgressTracker } from "./tracker";

describe("ProgressTracker", () => {
	let tracker: ProgressTracker;

	beforeEach(() => {
		tracker = new ProgressTracker();
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

		// We can verify implicitly via getProgress or internal state if exposed,
		// but for now just ensuring it doesn't crash on registration.
	});

	test("handleNotification() processes valid notification", () => {
		const token = tracker.generateToken();
		const opId = randomUUID();

		tracker.register(token, opId);

		tracker.handleNotification({
			progressToken: token,
			progress: 10,
			message: "started",
		});

		const updates = tracker.getProgress(opId);
		expect(updates).toHaveLength(1);
		expect(updates[0]?.progress).toBe(10);
		expect(updates[0]?.message).toBe("started");
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

	test("getProgress() returns updates in order", () => {
		const token = tracker.generateToken();
		const opId = randomUUID();
		tracker.register(token, opId);

		tracker.handleNotification({ progressToken: token, progress: 10 });
		tracker.handleNotification({ progressToken: token, progress: 100 });

		const updates = tracker.getProgress(opId);
		expect(updates).toHaveLength(2);
		expect(updates[0]?.progress).toBe(10);
		expect(updates[1]?.progress).toBe(100);
	});

	test("unregister() removes mapping", () => {
		const token = tracker.generateToken();
		const opId = randomUUID();
		tracker.register(token, opId);

		tracker.unregister(token);

		// Sending notification after unregister should be ignored
		tracker.handleNotification({ progressToken: token, progress: 50 });
		const updates = tracker.getProgress(opId);
		expect(updates).toHaveLength(0);
	});
});
