/**
 * Task Mock Server
 *
 * Mock MCP server with task-augmented execution support.
 * Extends the base mock server with tasks/* methods.
 */

import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { createMockServerTransport } from "./mock-server";

// Track tasks created by this mock server
interface MockTask {
    taskId: string;
    status: "working" | "input_required" | "completed" | "failed" | "cancelled";
    statusMessage?: string;
    createdAt: string;
    lastUpdatedAt: string;
    ttl: number | null;
    pollInterval?: number;
    // For simulation
    completionDelay?: number;
    willFail?: boolean;
}

const mockTasks = new Map<string, MockTask>();
let taskIdCounter = 0;

/**
 * Create a mock server transport with task support.
 */
export function createTaskMockServerTransport() {
    // Base configuration with task-supporting tools
    const baseTransport = createMockServerTransport({
        name: "task-mock-server",
        version: "1.0.0",
        capabilities: {
            tools: true,
            resources: false,
            prompts: false,
            // Task-augmented execution capability (per spec line 72)
            tasks: {
                requests: {
                    tools: { call: true },
                },
            },
        },
        tools: [
            { name: "echo", description: "Echo tool (no task support)" },
            {
                name: "longProcess",
                description: "Long-running process (optional task support)",
            },
            {
                name: "backgroundJob",
                description: "Background job (required task support)",
            },
            {
                name: "quickTask",
                description: "Quick task that completes immediately",
            },
            {
                name: "failingTask",
                description: "Task that fails",
            },
            {
                name: "inputTask",
                description: "Task that requires input (elicitation/sampling)",
            },
        ],
        toolBehaviors: {
            echo: {
                content: [{ type: "text", text: "Echo response" }],
            },
        },
        strictToolValidation: false, // Allow unknown tools for testing
    });

    // Wrap send to intercept task-related methods
    const originalSend = baseTransport.send.bind(baseTransport);

    baseTransport.send = async (message: JSONRPCMessage) => {
        if ("method" in message && "id" in message) {
            const method = message.method;
            const id = message.id;
            const params = message.params as any;

            switch (method) {
                case "tools/list": {
                    // Override to include execution metadata
                    const response = {
                        jsonrpc: "2.0" as const,
                        id,
                        result: {
                            tools: [
                                {
                                    name: "echo",
                                    description: "Echo tool",
                                    inputSchema: { type: "object" },
                                    // No execution = forbidden
                                },
                                {
                                    name: "longProcess",
                                    description: "Long-running process",
                                    inputSchema: { type: "object" },
                                    execution: { taskSupport: "optional" },
                                },
                                {
                                    name: "backgroundJob",
                                    description: "Background job",
                                    inputSchema: { type: "object" },
                                    execution: { taskSupport: "required" },
                                },
                                {
                                    name: "quickTask",
                                    description: "Quick task",
                                    inputSchema: { type: "object" },
                                    execution: { taskSupport: "optional" },
                                },
                                {
                                    name: "failingTask",
                                    description: "Failing task",
                                    inputSchema: { type: "object" },
                                    execution: { taskSupport: "optional" },
                                },
                                {
                                    name: "inputTask",
                                    description: "Task requiring input",
                                    inputSchema: { type: "object" },
                                    execution: { taskSupport: "optional" },
                                },
                            ],
                        },
                    };
                    queueMicrotask(() => {
                        (baseTransport as any).onmessage?.(response);
                    });
                    return;
                }

                case "tools/call": {
                    // Check if this is a task-augmented call
                    if (params?.task !== undefined) {
                        const taskId = `task-${++taskIdCounter}-${Date.now()}`;
                        const now = new Date().toISOString();

                        const willFail = params.name === "failingTask";
                        const isQuick = params.name === "quickTask";
                        const needsInput = params.name === "inputTask";

                        const task: MockTask = {
                            taskId,
                            status: isQuick ? "completed" : needsInput ? "input_required" : "working",
                            statusMessage: needsInput ? "Waiting for user input" : undefined,
                            createdAt: now,
                            lastUpdatedAt: now,
                            ttl: params.task?.ttl ?? null,
                            pollInterval: 100, // Fast polling for tests
                            willFail,
                        };

                        mockTasks.set(taskId, task);

                        // Simulate completion after delay for non-quick tasks
                        if (!isQuick) {
                            setTimeout(() => {
                                const t = mockTasks.get(taskId);
                                if (t && t.status === "working") {
                                    if (t.willFail) {
                                        t.status = "failed";
                                        t.statusMessage = "Task failed intentionally";
                                    } else {
                                        t.status = "completed";
                                    }
                                    t.lastUpdatedAt = new Date().toISOString();
                                }
                            }, 200);
                        }

                        const response = {
                            jsonrpc: "2.0" as const,
                            id,
                            result: {
                                task: {
                                    taskId: task.taskId,
                                    status: task.status,
                                    statusMessage: task.statusMessage,
                                    createdAt: task.createdAt,
                                    lastUpdatedAt: task.lastUpdatedAt,
                                    ttl: task.ttl,
                                    pollInterval: task.pollInterval,
                                },
                            },
                        };
                        queueMicrotask(() => {
                            (baseTransport as any).onmessage?.(response);
                        });
                        return;
                    }
                    // Fall through to base handler for non-task calls
                    break;
                }

                case "tasks/list": {
                    const tasks = Array.from(mockTasks.values()).map(t => ({
                        taskId: t.taskId,
                        status: t.status,
                        statusMessage: t.statusMessage,
                        createdAt: t.createdAt,
                        lastUpdatedAt: t.lastUpdatedAt,
                        ttl: t.ttl,
                        pollInterval: t.pollInterval,
                    }));

                    const response = {
                        jsonrpc: "2.0" as const,
                        id,
                        result: { tasks },
                    };
                    queueMicrotask(() => {
                        (baseTransport as any).onmessage?.(response);
                    });
                    return;
                }

                case "tasks/get": {
                    const task = mockTasks.get(params?.taskId);
                    if (!task) {
                        const errorResponse = {
                            jsonrpc: "2.0" as const,
                            id,
                            error: {
                                code: -32602,
                                message: `Unknown task: ${params?.taskId}`,
                            },
                        };
                        queueMicrotask(() => {
                            (baseTransport as any).onmessage?.(errorResponse);
                        });
                        return;
                    }

                    const response = {
                        jsonrpc: "2.0" as const,
                        id,
                        result: {
                            taskId: task.taskId,
                            status: task.status,
                            statusMessage: task.statusMessage,
                            createdAt: task.createdAt,
                            lastUpdatedAt: task.lastUpdatedAt,
                            ttl: task.ttl,
                            pollInterval: task.pollInterval,
                        },
                    };
                    queueMicrotask(() => {
                        (baseTransport as any).onmessage?.(response);
                    });
                    return;
                }

                case "tasks/result": {
                    const task = mockTasks.get(params?.taskId);
                    if (!task) {
                        const errorResponse = {
                            jsonrpc: "2.0" as const,
                            id,
                            error: {
                                code: -32602,
                                message: `Unknown task: ${params?.taskId}`,
                            },
                        };
                        queueMicrotask(() => {
                            (baseTransport as any).onmessage?.(errorResponse);
                        });
                        return;
                    }

                    // Return the tool result
                    const response = {
                        jsonrpc: "2.0" as const,
                        id,
                        result: {
                            content: [{ type: "text", text: `Task ${task.taskId} result` }],
                            isError: task.status === "failed",
                        },
                    };
                    queueMicrotask(() => {
                        (baseTransport as any).onmessage?.(response);
                    });
                    return;
                }

                case "tasks/cancel": {
                    const task = mockTasks.get(params?.taskId);
                    if (!task) {
                        const errorResponse = {
                            jsonrpc: "2.0" as const,
                            id,
                            error: {
                                code: -32602,
                                message: `Unknown task: ${params?.taskId}`,
                            },
                        };
                        queueMicrotask(() => {
                            (baseTransport as any).onmessage?.(errorResponse);
                        });
                        return;
                    }

                    task.status = "cancelled";
                    task.lastUpdatedAt = new Date().toISOString();

                    const response = {
                        jsonrpc: "2.0" as const,
                        id,
                        result: {},
                    };
                    queueMicrotask(() => {
                        (baseTransport as any).onmessage?.(response);
                    });
                    return;
                }
            }
        }

        // Fall through to base transport for other methods
        return originalSend(message);
    };

    // Add method to clear tasks between tests
    (baseTransport as any).clearTasks = () => {
        mockTasks.clear();
        taskIdCounter = 0;
    };

    return baseTransport;
}
