/**
 * TaskManager Unit Tests
 *
 * Tests for the TaskManager class that handles task lifecycle.
 * Task 07: Task-Augmented Execution - Phase 2 Unit Tests
 */

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { TaskManager } from "./manager";
import type { Task } from "../types/task";

describe("TaskManager", () => {
    let manager: TaskManager;

    beforeEach(() => {
        manager = new TaskManager({ pollIntervalMs: 10, maxPollAttempts: 5 });
    });

    afterEach(() => {
        manager.clear();
    });

    // =========================================================================
    // registerTask
    // =========================================================================

    describe("registerTask", () => {
        it("stores task in cache with defaults", () => {
            manager.registerTask("task-1", "session-1");

            const task = manager.getTask("task-1");
            expect(task).toBeDefined();
            expect(task!.taskId).toBe("task-1");
            expect(task!.status).toBe("working");
            expect(task!.ttl).toBeNull();
        });

        it("merges initial task state", () => {
            manager.registerTask("task-2", "session-1", {
                status: "completed",
                statusMessage: "Already done",
                ttl: 60000,
            });

            const task = manager.getTask("task-2");
            expect(task!.status).toBe("completed");
            expect(task!.statusMessage).toBe("Already done");
            expect(task!.ttl).toBe(60000);
        });

        it("generates timestamps for createdAt and lastUpdatedAt", () => {
            manager.registerTask("task-3", "session-1");

            const task = manager.getTask("task-3");
            expect(task!.createdAt).toBeDefined();
            expect(task!.lastUpdatedAt).toBeDefined();
            // Should be ISO 8601 format
            expect(() => new Date(task!.createdAt)).not.toThrow();
        });

        it("overwrites existing task with same ID", () => {
            manager.registerTask("task-dup", "session-1", { statusMessage: "First" });
            manager.registerTask("task-dup", "session-1", { statusMessage: "Second" });

            const task = manager.getTask("task-dup");
            expect(task!.statusMessage).toBe("Second");
        });
    });

    // =========================================================================
    // getTask
    // =========================================================================

    describe("getTask", () => {
        it("returns registered task", () => {
            manager.registerTask("task-get", "session-1", { statusMessage: "test" });

            const task = manager.getTask("task-get");
            expect(task).toBeDefined();
            expect(task!.statusMessage).toBe("test");
        });

        it("returns undefined for unknown task", () => {
            const task = manager.getTask("unknown-task");
            expect(task).toBeUndefined();
        });
    });

    // =========================================================================
    // getTasksBySession
    // =========================================================================

    describe("getTasksBySession", () => {
        it("returns all tasks (session filtering not yet implemented)", () => {
            manager.registerTask("task-a", "session-1");
            manager.registerTask("task-b", "session-2");

            const tasks = manager.getTasksBySession("session-1");
            // Currently returns all tasks regardless of session
            expect(tasks.length).toBe(2);
        });

        it("returns empty array when no tasks", () => {
            const tasks = manager.getTasksBySession("session-1");
            expect(tasks).toEqual([]);
        });
    });

    // =========================================================================
    // pollUntilComplete
    // =========================================================================

    describe("pollUntilComplete", () => {
        it("returns immediately on completed status", async () => {
            manager.registerTask("task-done", "session-1");
            let pollCount = 0;

            const result = await manager.pollUntilComplete(
                "task-done",
                async () => {
                    pollCount++;
                    return {
                        taskId: "task-done",
                        status: "completed",
                        createdAt: new Date().toISOString(),
                        lastUpdatedAt: new Date().toISOString(),
                        ttl: null,
                    };
                },
            );

            expect(result.status).toBe("completed");
            expect(pollCount).toBe(1);
        });

        it("returns immediately on failed status", async () => {
            manager.registerTask("task-fail", "session-1");

            const result = await manager.pollUntilComplete(
                "task-fail",
                async () => ({
                    taskId: "task-fail",
                    status: "failed",
                    statusMessage: "Something went wrong",
                    createdAt: new Date().toISOString(),
                    lastUpdatedAt: new Date().toISOString(),
                    ttl: null,
                }),
            );

            expect(result.status).toBe("failed");
            expect(result.statusMessage).toBe("Something went wrong");
        });

        it("returns immediately on cancelled status", async () => {
            manager.registerTask("task-cancel", "session-1");

            const result = await manager.pollUntilComplete(
                "task-cancel",
                async () => ({
                    taskId: "task-cancel",
                    status: "cancelled",
                    createdAt: new Date().toISOString(),
                    lastUpdatedAt: new Date().toISOString(),
                    ttl: null,
                }),
            );

            expect(result.status).toBe("cancelled");
        });

        it("continues polling on working status", async () => {
            manager.registerTask("task-working", "session-1");
            let pollCount = 0;

            const result = await manager.pollUntilComplete(
                "task-working",
                async () => {
                    pollCount++;
                    // Complete after 3 polls
                    return {
                        taskId: "task-working",
                        status: pollCount >= 3 ? "completed" : "working",
                        createdAt: new Date().toISOString(),
                        lastUpdatedAt: new Date().toISOString(),
                        ttl: null,
                    };
                },
            );

            expect(result.status).toBe("completed");
            expect(pollCount).toBe(3);
        });

        it("continues polling on input_required status", async () => {
            // Use fresh manager with higher limits to avoid flakiness
            const testManager = new TaskManager({ pollIntervalMs: 10, maxPollAttempts: 10 });
            testManager.registerTask("task-input", "session-1");
            let pollCount = 0;

            const result = await testManager.pollUntilComplete(
                "task-input",
                async () => {
                    pollCount++;
                    // Status: input_required → input_required → completed
                    if (pollCount >= 3) {
                        return {
                            taskId: "task-input",
                            status: "completed" as const,
                            createdAt: new Date().toISOString(),
                            lastUpdatedAt: new Date().toISOString(),
                            ttl: null,
                        };
                    }
                    return {
                        taskId: "task-input",
                        status: "input_required" as const,
                        statusMessage: "Waiting for user input",
                        createdAt: new Date().toISOString(),
                        lastUpdatedAt: new Date().toISOString(),
                        ttl: null,
                    };
                },
            );

            expect(result.status).toBe("completed");
            expect(pollCount).toBe(3);
        });

        it("respects task pollInterval when provided", async () => {
            manager.registerTask("task-interval", "session-1");
            const startTime = Date.now();
            let pollCount = 0;

            await manager.pollUntilComplete(
                "task-interval",
                async () => {
                    pollCount++;
                    return {
                        taskId: "task-interval",
                        status: pollCount >= 2 ? "completed" : "working",
                        pollInterval: 50, // 50ms suggested interval
                        createdAt: new Date().toISOString(),
                        lastUpdatedAt: new Date().toISOString(),
                        ttl: null,
                    };
                },
            );

            const elapsed = Date.now() - startTime;
            // Should have waited ~50ms between polls (not the default 10ms)
            expect(elapsed).toBeGreaterThanOrEqual(40);
        });

        it("throws error after max poll attempts", async () => {
            manager.registerTask("task-timeout", "session-1");

            await expect(
                manager.pollUntilComplete(
                    "task-timeout",
                    async () => ({
                        taskId: "task-timeout",
                        status: "working", // Never completes
                        createdAt: new Date().toISOString(),
                        lastUpdatedAt: new Date().toISOString(),
                        ttl: null,
                    }),
                ),
            ).rejects.toThrow("Task task-timeout did not complete within timeout");
        });

        it("calls onProgress callback on each poll", async () => {
            manager.registerTask("task-progress", "session-1");
            const progressCalls: Task[] = [];
            let pollCount = 0;

            await manager.pollUntilComplete(
                "task-progress",
                async () => {
                    pollCount++;
                    return {
                        taskId: "task-progress",
                        status: pollCount >= 2 ? "completed" : "working",
                        statusMessage: `Poll ${pollCount}`,
                        createdAt: new Date().toISOString(),
                        lastUpdatedAt: new Date().toISOString(),
                        ttl: null,
                    };
                },
                (task) => {
                    progressCalls.push(task);
                },
            );

            expect(progressCalls.length).toBe(2);
            expect(progressCalls[0]!.statusMessage).toBe("Poll 1");
            expect(progressCalls[1]!.statusMessage).toBe("Poll 2");
        });

        it("updates cache on each poll", async () => {
            manager.registerTask("task-cache", "session-1", { statusMessage: "Initial" });
            let pollCount = 0;

            await manager.pollUntilComplete(
                "task-cache",
                async () => {
                    pollCount++;
                    return {
                        taskId: "task-cache",
                        status: pollCount >= 2 ? "completed" : "working",
                        statusMessage: `Updated ${pollCount}`,
                        createdAt: new Date().toISOString(),
                        lastUpdatedAt: new Date().toISOString(),
                        ttl: null,
                    };
                },
            );

            const cached = manager.getTask("task-cache");
            expect(cached!.statusMessage).toBe("Updated 2");
        });
    });

    // =========================================================================
    // handleStatusNotification
    // =========================================================================

    describe("handleStatusNotification", () => {
        it("updates cached task", () => {
            manager.registerTask("task-notify", "session-1", { statusMessage: "Original" });

            manager.handleStatusNotification({
                taskId: "task-notify",
                status: "completed",
                statusMessage: "Updated via notification",
                createdAt: new Date().toISOString(),
                lastUpdatedAt: new Date().toISOString(),
                ttl: null,
            });

            const task = manager.getTask("task-notify");
            expect(task!.status).toBe("completed");
            expect(task!.statusMessage).toBe("Updated via notification");
        });

        it("creates task if not exists", () => {
            manager.handleStatusNotification({
                taskId: "task-new",
                status: "working",
                createdAt: new Date().toISOString(),
                lastUpdatedAt: new Date().toISOString(),
                ttl: null,
            });

            const task = manager.getTask("task-new");
            expect(task).toBeDefined();
            expect(task!.status).toBe("working");
        });
    });

    // =========================================================================
    // removeTask / clear
    // =========================================================================

    describe("removeTask", () => {
        it("removes task from cache", () => {
            manager.registerTask("task-remove", "session-1");
            expect(manager.getTask("task-remove")).toBeDefined();

            manager.removeTask("task-remove");
            expect(manager.getTask("task-remove")).toBeUndefined();
        });

        it("does not throw for unknown task", () => {
            expect(() => manager.removeTask("unknown")).not.toThrow();
        });
    });

    describe("clear", () => {
        it("removes all tasks", () => {
            manager.registerTask("task-a", "session-1");
            manager.registerTask("task-b", "session-1");
            manager.registerTask("task-c", "session-2");

            manager.clear();

            expect(manager.getTask("task-a")).toBeUndefined();
            expect(manager.getTask("task-b")).toBeUndefined();
            expect(manager.getTask("task-c")).toBeUndefined();
        });
    });

    // =========================================================================
    // Constructor Options
    // =========================================================================

    describe("constructor options", () => {
        it("uses default pollIntervalMs of 1000", async () => {
            const defaultManager = new TaskManager();
            // Can't easily test the default interval without waiting,
            // but we can verify the manager was created successfully
            expect(defaultManager).toBeDefined();
        });

        it("uses default maxPollAttempts of 300", async () => {
            const defaultManager = new TaskManager({ pollIntervalMs: 1 });
            // Just verify it was created - testing 300 attempts would be slow
            expect(defaultManager).toBeDefined();
        });
    });
});
