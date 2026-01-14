import { describe, expect, it, beforeEach } from "bun:test";
import { ToolOperationStore } from "./operation-store";
import type { ToolCallRequest, ToolCallResult, ToolOperation } from "../types/tool";
import { v4 as uuidv4 } from "uuid";

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
            content: [{ type: "text", text: "done" }]
        };

        store.update(created.id, {
            status: "completed",
            result,
            completedAt: new Date()
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
        expect(sessionOps.map(o => o.request.name)).toContain("op1");
        expect(sessionOps.map(o => o.request.name)).toContain("op2");
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
});
