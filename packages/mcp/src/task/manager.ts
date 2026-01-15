/**
 * TaskManager
 *
 * Manages task lifecycle for task-augmented tool execution.
 * Handles registration, polling, caching, and status notifications.
 */

import type { Task, TaskStatus } from "../types/task";

// =============================================================================
// Types
// =============================================================================

export interface TaskManagerOptions {
    /** Default polling interval in milliseconds. Default: 1000 */
    pollIntervalMs?: number;
    /** Maximum polling attempts before timeout. Default: 300 (5 minutes at 1s) */
    maxPollAttempts?: number;
}

// =============================================================================
// TaskManager
// =============================================================================

export class TaskManager {
    private tasks = new Map<string, Task>();
    private pollIntervalMs: number;
    private maxPollAttempts: number;

    constructor(options: TaskManagerOptions = {}) {
        this.pollIntervalMs = options.pollIntervalMs ?? 1000;
        this.maxPollAttempts = options.maxPollAttempts ?? 300;
    }

    /**
     * Register a new task in the manager.
     * @param taskId - The task identifier
     * @param sessionId - The session that owns this task
     * @param initialTask - Initial task state from server
     */
    registerTask(
        taskId: string,
        _sessionId: string,
        initialTask: Partial<Task> = {},
    ): void {
        this.tasks.set(taskId, {
            taskId,
            status: "working",
            createdAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
            ttl: null,
            ...initialTask,
        });
    }

    /**
     * Poll until task reaches a terminal status.
     * @param taskId - The task to poll
     * @param fetchStatus - Callback to fetch current task status from server
     * @param onProgress - Optional callback for status updates
     * @returns The final task state
     */
    async pollUntilComplete(
        taskId: string,
        fetchStatus: () => Promise<Task>,
        onProgress?: (task: Task) => void,
    ): Promise<Task> {
        let attempts = 0;

        while (attempts < this.maxPollAttempts) {
            const task = await fetchStatus();
            this.tasks.set(taskId, task);

            if (onProgress) {
                onProgress(task);
            }

            if (this.isTerminalStatus(task.status)) {
                return task;
            }

            // Use task's suggested pollInterval if available
            const interval = task.pollInterval ?? this.pollIntervalMs;
            await this.sleep(interval);
            attempts++;
        }

        throw new Error(`Task ${taskId} did not complete within timeout`);
    }

    /**
     * Check if a status is terminal (no more updates expected).
     */
    private isTerminalStatus(status: TaskStatus): boolean {
        return ["completed", "failed", "cancelled"].includes(status);
    }

    /**
     * Sleep for specified milliseconds.
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Get a task from the cache.
     * @param taskId - The task identifier
     * @returns The cached task or undefined
     */
    getTask(taskId: string): Task | undefined {
        return this.tasks.get(taskId);
    }

    /**
     * Get all tasks for a session.
     * @param sessionId - The session identifier
     * @returns Array of tasks (note: sessionId filtering not yet implemented)
     */
    getTasksBySession(_sessionId: string): Task[] {
        // TODO: Add sessionId to Task and filter
        return Array.from(this.tasks.values());
    }

    /**
     * Handle incoming task status notification from server.
     * Called by McpClientManager's notification handler.
     * @param params - Task status notification payload
     */
    handleStatusNotification(params: Task): void {
        this.tasks.set(params.taskId, params);
    }

    /**
     * Remove a task from the cache.
     * @param taskId - The task identifier
     */
    removeTask(taskId: string): void {
        this.tasks.delete(taskId);
    }

    /**
     * Clear all tasks from the cache.
     */
    clear(): void {
        this.tasks.clear();
    }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const taskManager = new TaskManager();
