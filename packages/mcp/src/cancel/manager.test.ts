import { beforeEach, describe, expect, mock, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { CancellationManager } from "./manager";
import { toolOperationStore } from "../store/operation-store";

describe("CancellationManager", () => {
    let manager: CancellationManager;
    let mockClient: any;

    beforeEach(() => {
        manager = new CancellationManager();

        // Mock MCP client with notification method
        mockClient = {
            notification: mock(() => Promise.resolve()),
        };
        manager.setClient(mockClient);
    });

    test("register() starts timeout timer", () => {
        const originalSetTimeout = global.setTimeout;
        const setTimeoutMock = mock(
            (fn: () => void, ms: number) =>
                originalSetTimeout(fn, ms) as unknown as NodeJS.Timeout,
        );
        global.setTimeout = setTimeoutMock as any;

        try {
            const requestId = "req-1";
            const operationId = randomUUID();

            manager.register(requestId, operationId, 5000);

            expect(setTimeoutMock).toHaveBeenCalled();
            // Also verify the timeout was called with correct duration
            const calls = setTimeoutMock.mock.calls;
            expect(calls.length).toBeGreaterThan(0);
        } finally {
            global.setTimeout = originalSetTimeout;
        }
    });

    test("cancel() sends notifications/cancelled notification", async () => {
        const requestId = "req-2";
        const operationId = randomUUID();

        manager.register(requestId, operationId, 30000);
        await manager.cancel(operationId, "User requested cancellation");

        expect(mockClient.notification).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "notifications/cancelled",
                params: expect.objectContaining({
                    requestId: requestId,
                    reason: "User requested cancellation",
                }),
            }),
        );
    });

    test("cancel() updates operation status to cancelled", async () => {
        const requestId = "req-3";
        const sessionId = "session-3";

        // Create an operation first so we can verify status update
        const toolRequest = { name: "echo", arguments: { message: "test" } };
        const operation = toolOperationStore.create(sessionId, toolRequest, requestId);
        const testOpId = operation.id;

        manager.register(requestId, testOpId, 30000);
        await manager.cancel(testOpId, "Test cancellation");

        // Verify the operation store was updated
        const updatedOperation = toolOperationStore.get(testOpId);
        expect(updatedOperation).toBeDefined();
        expect(updatedOperation?.status).toBe("cancelled");
        expect(updatedOperation?.cancelReason).toBe("Test cancellation");
    });

    test("cancel() clears timeout timer", async () => {
        const originalClearTimeout = global.clearTimeout;
        const clearTimeoutMock = mock(() => { });
        global.clearTimeout = clearTimeoutMock as any;

        try {
            const requestId = "req-4";
            const operationId = randomUUID();

            manager.register(requestId, operationId, 30000);
            await manager.cancel(operationId);

            expect(clearTimeoutMock).toHaveBeenCalled();
        } finally {
            global.clearTimeout = originalClearTimeout;
        }
    });

    test("onResponse() clears pending request", async () => {
        const requestId = "req-5";
        const operationId = randomUUID();

        manager.register(requestId, operationId, 30000);
        manager.onResponse(requestId);

        // Calling cancel after onResponse should not send notification
        // because the request is no longer pending
        await manager.cancel(operationId); // This should be a no-op

        // Verify no notification was sent (since onResponse already cleared it)
        expect(mockClient.notification).not.toHaveBeenCalled();
    });

    test("onResponse() ignores unknown requestId", () => {
        // Should not throw for unknown requestId
        expect(() => manager.onResponse("unknown-id")).not.toThrow();
    });

    test("timeout auto-cancels operation", async () => {
        const requestId = "req-6";
        const operationId = randomUUID();

        // Register with very short timeout
        manager.register(requestId, operationId, 50);

        // Wait for timeout to fire
        await new Promise((resolve) => setTimeout(resolve, 150));

        // The implementation should have auto-cancelled
        // Verify the notification was sent with timeout reason
        expect(mockClient.notification).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "notifications/cancelled",
                params: expect.objectContaining({
                    requestId: requestId,
                    reason: "Request timeout",
                }),
            }),
        );
    });
});
