/**
 * Task Schema Tests
 *
 * Unit tests for Task-related Zod schemas.
 * Task 07: Task-Augmented Execution - Phase 1 Schema Tests
 */

import { describe, expect, it } from "bun:test";
import {
    TaskStatusSchema,
    TaskMetadataSchema,
    RelatedTaskMetadataSchema,
    TaskSchema,
    CreateTaskResultSchema,
    TaskListResultSchema,
    TaskGetResultSchema,
    EmptyResultSchema,
    TaskStatusNotificationSchema,
    type TaskStatus,
    type Task,
} from "./task";

describe("TaskStatusSchema", () => {
    it("parses 'working' status", () => {
        expect(TaskStatusSchema.parse("working")).toBe("working");
    });

    it("parses 'input_required' status", () => {
        expect(TaskStatusSchema.parse("input_required")).toBe("input_required");
    });

    it("parses 'completed' status", () => {
        expect(TaskStatusSchema.parse("completed")).toBe("completed");
    });

    it("parses 'failed' status", () => {
        expect(TaskStatusSchema.parse("failed")).toBe("failed");
    });

    it("parses 'cancelled' status", () => {
        expect(TaskStatusSchema.parse("cancelled")).toBe("cancelled");
    });

    it("rejects invalid status string", () => {
        expect(() => TaskStatusSchema.parse("pending")).toThrow();
    });

    it("rejects non-string values", () => {
        expect(() => TaskStatusSchema.parse(123)).toThrow();
        expect(() => TaskStatusSchema.parse(null)).toThrow();
    });
});

describe("TaskMetadataSchema", () => {
    it("parses empty object (all optional)", () => {
        const result = TaskMetadataSchema.parse({});
        expect(result.ttl).toBeUndefined();
    });

    it("parses ttl as number", () => {
        const result = TaskMetadataSchema.parse({ ttl: 300000 });
        expect(result.ttl).toBe(300000);
    });

    it("rejects non-number ttl", () => {
        expect(() => TaskMetadataSchema.parse({ ttl: "300000" })).toThrow();
    });
});

describe("RelatedTaskMetadataSchema", () => {
    it("parses taskId", () => {
        const result = RelatedTaskMetadataSchema.parse({ taskId: "task-123" });
        expect(result.taskId).toBe("task-123");
    });

    it("requires taskId", () => {
        expect(() => RelatedTaskMetadataSchema.parse({})).toThrow();
    });
});

describe("TaskSchema", () => {
    const validTask: Task = {
        taskId: "task-abc-123",
        status: "working",
        createdAt: "2026-01-16T10:00:00.000Z",
        lastUpdatedAt: "2026-01-16T10:00:05.000Z",
        ttl: null,
    };

    it("parses minimal valid task", () => {
        const result = TaskSchema.parse(validTask);
        expect(result.taskId).toBe("task-abc-123");
        expect(result.status).toBe("working");
        expect(result.ttl).toBeNull();
    });

    it("parses task with statusMessage", () => {
        const task = { ...validTask, statusMessage: "Processing file..." };
        const result = TaskSchema.parse(task);
        expect(result.statusMessage).toBe("Processing file...");
    });

    it("parses task with pollInterval", () => {
        const task = { ...validTask, pollInterval: 5000 };
        const result = TaskSchema.parse(task);
        expect(result.pollInterval).toBe(5000);
    });

    it("parses task with numeric ttl", () => {
        const task = { ...validTask, ttl: 600000 };
        const result = TaskSchema.parse(task);
        expect(result.ttl).toBe(600000);
    });

    it("allows null ttl for unlimited retention", () => {
        const result = TaskSchema.parse(validTask);
        expect(result.ttl).toBeNull();
    });

    it("validates ISO 8601 datetime for createdAt", () => {
        const badTask = { ...validTask, createdAt: "not-a-date" };
        expect(() => TaskSchema.parse(badTask)).toThrow();
    });

    it("validates ISO 8601 datetime for lastUpdatedAt", () => {
        const badTask = { ...validTask, lastUpdatedAt: "2026/01/16" };
        expect(() => TaskSchema.parse(badTask)).toThrow();
    });

    it("requires all mandatory fields", () => {
        expect(() => TaskSchema.parse({ taskId: "test" })).toThrow();
        expect(() => TaskSchema.parse({ status: "working" })).toThrow();
    });

    it("rejects invalid status", () => {
        const badTask = { ...validTask, status: "running" };
        expect(() => TaskSchema.parse(badTask)).toThrow();
    });

    it("parses complete task with all fields", () => {
        const completeTask: Task = {
            taskId: "task-full",
            status: "completed",
            statusMessage: "Done processing",
            createdAt: "2026-01-16T10:00:00.000Z",
            lastUpdatedAt: "2026-01-16T10:05:00.000Z",
            ttl: 3600000,
            pollInterval: 2000,
        };
        const result = TaskSchema.parse(completeTask);
        expect(result.taskId).toBe("task-full");
        expect(result.status).toBe("completed");
        expect(result.statusMessage).toBe("Done processing");
        expect(result.ttl).toBe(3600000);
        expect(result.pollInterval).toBe(2000);
    });
});

describe("CreateTaskResultSchema", () => {
    const validTask: Task = {
        taskId: "task-new",
        status: "working",
        createdAt: "2026-01-16T10:00:00.000Z",
        lastUpdatedAt: "2026-01-16T10:00:00.000Z",
        ttl: null,
    };

    it("parses result with task only", () => {
        const result = CreateTaskResultSchema.parse({ task: validTask });
        expect(result.task.taskId).toBe("task-new");
        expect(result._meta).toBeUndefined();
    });

    it("parses result with _meta", () => {
        const result = CreateTaskResultSchema.parse({
            task: validTask,
            _meta: { custom: "data", version: 1 },
        });
        expect(result._meta?.custom).toBe("data");
    });

    it("requires task field", () => {
        expect(() => CreateTaskResultSchema.parse({})).toThrow();
        expect(() => CreateTaskResultSchema.parse({ _meta: {} })).toThrow();
    });
});

describe("TaskListResultSchema", () => {
    const task1: Task = {
        taskId: "task-1",
        status: "working",
        createdAt: "2026-01-16T10:00:00.000Z",
        lastUpdatedAt: "2026-01-16T10:00:00.000Z",
        ttl: null,
    };

    const task2: Task = {
        taskId: "task-2",
        status: "completed",
        createdAt: "2026-01-16T09:00:00.000Z",
        lastUpdatedAt: "2026-01-16T09:30:00.000Z",
        ttl: 3600000,
    };

    it("parses empty task list", () => {
        const result = TaskListResultSchema.parse({ tasks: [] });
        expect(result.tasks).toEqual([]);
        expect(result.nextCursor).toBeUndefined();
    });

    it("parses task list with items", () => {
        const result = TaskListResultSchema.parse({ tasks: [task1, task2] });
        expect(result.tasks).toHaveLength(2);
        expect(result.tasks[0]!.taskId).toBe("task-1");
        expect(result.tasks[1]!.taskId).toBe("task-2");
    });

    it("parses task list with pagination cursor", () => {
        const result = TaskListResultSchema.parse({
            tasks: [task1],
            nextCursor: "cursor-abc",
        });
        expect(result.nextCursor).toBe("cursor-abc");
    });

    it("requires tasks array", () => {
        expect(() => TaskListResultSchema.parse({})).toThrow();
        expect(() => TaskListResultSchema.parse({ nextCursor: "abc" })).toThrow();
    });
});

describe("TaskGetResultSchema", () => {
    it("is equivalent to TaskSchema", () => {
        const task: Task = {
            taskId: "task-get",
            status: "failed",
            statusMessage: "Server error",
            createdAt: "2026-01-16T10:00:00.000Z",
            lastUpdatedAt: "2026-01-16T10:01:00.000Z",
            ttl: null,
        };
        const result = TaskGetResultSchema.parse(task);
        expect(result.taskId).toBe("task-get");
        expect(result.status).toBe("failed");
    });
});

describe("EmptyResultSchema", () => {
    it("parses empty object", () => {
        const result = EmptyResultSchema.parse({});
        expect(result).toEqual({});
    });

    it("strips extra fields", () => {
        const result = EmptyResultSchema.parse({ extra: "field" });
        // Zod strips unknown keys in strict mode or preserves in passthrough
        // Default behavior: strips
        expect((result as any).extra).toBeUndefined();
    });
});

describe("Edge Cases", () => {
    it("TaskStatus type inference is correct", () => {
        const status: TaskStatus = "working";
        expect(["working", "input_required", "completed", "failed", "cancelled"]).toContain(status);
    });

    it("Task with all terminal statuses validates", () => {
        const baseTask = {
            taskId: "test",
            createdAt: "2026-01-16T10:00:00.000Z",
            lastUpdatedAt: "2026-01-16T10:00:00.000Z",
            ttl: null,
        };

        expect(TaskSchema.parse({ ...baseTask, status: "completed" }).status).toBe("completed");
        expect(TaskSchema.parse({ ...baseTask, status: "failed" }).status).toBe("failed");
        expect(TaskSchema.parse({ ...baseTask, status: "cancelled" }).status).toBe("cancelled");
    });

    it("safeParse returns success false for invalid data", () => {
        const result = TaskSchema.safeParse({ taskId: "test" });
        expect(result.success).toBe(false);
    });

    it("safeParse returns success true for valid data", () => {
        const result = TaskSchema.safeParse({
            taskId: "test",
            status: "working",
            createdAt: "2026-01-16T10:00:00.000Z",
            lastUpdatedAt: "2026-01-16T10:00:00.000Z",
            ttl: null,
        });
        expect(result.success).toBe(true);
    });
});

describe("TaskStatusNotificationSchema", () => {
    it("parses valid notification with method and params", () => {
        const notification = {
            method: "notifications/tasks/status",
            params: {
                taskId: "task-123",
                status: "completed",
                createdAt: "2026-01-16T10:00:00.000Z",
                lastUpdatedAt: "2026-01-16T10:05:00.000Z",
                ttl: null,
            },
        };
        const result = TaskStatusNotificationSchema.parse(notification);
        expect(result.method).toBe("notifications/tasks/status");
        expect(result.params.taskId).toBe("task-123");
        expect(result.params.status).toBe("completed");
    });

    it("rejects notification with wrong method", () => {
        const notification = {
            method: "notifications/progress",
            params: {
                taskId: "task-123",
                status: "working",
                createdAt: "2026-01-16T10:00:00.000Z",
                lastUpdatedAt: "2026-01-16T10:00:00.000Z",
                ttl: null,
            },
        };
        expect(() => TaskStatusNotificationSchema.parse(notification)).toThrow();
    });

    it("requires params to be valid Task", () => {
        const notification = {
            method: "notifications/tasks/status",
            params: { taskId: "incomplete" }, // Missing required fields
        };
        expect(() => TaskStatusNotificationSchema.parse(notification)).toThrow();
    });
});
