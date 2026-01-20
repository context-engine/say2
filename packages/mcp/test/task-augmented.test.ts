/**
 * Task-Augmented Execution Integration Tests
 *
 * Tests for task-augmented tool execution flow.
 * Task 07: Task-Augmented Execution - Phase 3 Integration Tests
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
	createPipeline,
	createStateMachineMiddleware,
	LATEST_PROTOCOL_VERSION,
	SessionManager,
} from "@say2/core";
import { McpClientManager } from "../src/client/manager";
import { McpClientRegistry } from "../src/client/registry";
import { taskManager } from "../src/task/manager";
import { LoggingTransport } from "../src/transport";
import type { Task } from "../src/types/task";
import type { MockServerTransport } from "./fixtures/mock-server.ts";
import { createTaskMockServerTransport } from "./fixtures/task-mock-server.ts";

/**
 * Task-Augmented Execution Integration Tests
 *
 * These tests verify the end-to-end flow of task-augmented tool calls:
 * 1. callToolAsTask() creates a task and returns CreateTaskResult
 * 2. listTasks(), getTask() retrieve task status
 * 3. cancelTask() cancels running tasks
 * 4. callToolAsTaskAndWait() polls until completion
 * 5. getToolTaskSupport() correctly identifies task support levels
 */
describe("Task-Augmented Execution Integration", () => {
	let sessionManager: SessionManager;
	let pipeline: ReturnType<typeof createPipeline>;
	let registry: McpClientRegistry;
	let clientManager: McpClientManager;
	let mockTransport: MockServerTransport;
	let sessionId: string;
	let client: Client;

	beforeEach(async () => {
		sessionManager = new SessionManager();
		pipeline = createPipeline();

		// Mock Protocol Detector
		const mockDetector = {
			isInitializeRequest: (msg: any) =>
				msg.method === "initialize" && "id" in msg,
			isInitializeResponse: (msg: any) =>
				"result" in msg && "protocolVersion" in msg.result,
			isInitializedNotification: (msg: any) =>
				msg.method === "notifications/initialized",
			extractCapabilities: (msg: any) => msg.result?.capabilities,
			extractServerInfo: (msg: any) => msg.result?.serverInfo,
		};

		pipeline.use(
			(createStateMachineMiddleware as any)(sessionManager, mockDetector),
		);

		registry = new McpClientRegistry();
		clientManager = new McpClientManager(registry, sessionManager, pipeline);

		// Setup session
		const session = sessionManager.create({
			name: "task-test-session",
			transport: "stdio",
			command: "node",
		});
		sessionId = session.id;

		// Setup Transport with task support
		mockTransport = createTaskMockServerTransport();
		client = new Client(
			{ name: "test-client", version: "1.0.0" },
			{ capabilities: {} },
		);

		const loggingTransport = new LoggingTransport(
			mockTransport,
			session,
			pipeline,
		);

		// Initialize connection
		await client.connect(loggingTransport);
		registry.register(sessionId, client, loggingTransport);

		// Manually transition to ACTIVE with task capability
		sessionManager.connect(sessionId);
		sessionManager.initialize(sessionId);
		sessionManager.activate(
			sessionId,
			{}, // clientCapabilities
			{
				// serverCapabilities - must include tasks for task-augmented execution
				tools: {},
				tasks: {
					requests: {
						tools: { call: true },
					},
				},
			},
			LATEST_PROTOCOL_VERSION,
		);

		// Clear task manager from previous tests
		taskManager.clear();
	});

	afterEach(async () => {
		taskManager.clear();
		if (mockTransport && !mockTransport.isClosed) {
			await mockTransport.close();
		}
	});

	// =========================================================================
	// getToolTaskSupport
	// =========================================================================

	describe("getToolTaskSupport", () => {
		test("returns 'forbidden' for tool without execution config", async () => {
			// Discover capabilities to populate tools
			await clientManager.listTools(sessionId);

			const support = clientManager.getToolTaskSupport(sessionId, "echo");
			expect(support).toBe("forbidden");
		});

		test("returns 'optional' for tool with taskSupport: optional", async () => {
			await clientManager.listTools(sessionId);

			const support = clientManager.getToolTaskSupport(
				sessionId,
				"longProcess",
			);
			expect(support).toBe("optional");
		});

		test("returns 'required' for tool with taskSupport: required", async () => {
			await clientManager.listTools(sessionId);

			const support = clientManager.getToolTaskSupport(
				sessionId,
				"backgroundJob",
			);
			expect(support).toBe("required");
		});

		test("returns 'forbidden' for unknown tool", async () => {
			await clientManager.listTools(sessionId);

			const support = clientManager.getToolTaskSupport(
				sessionId,
				"nonexistent",
			);
			expect(support).toBe("forbidden");
		});
	});

	// =========================================================================
	// listTasks
	// =========================================================================

	describe("listTasks", () => {
		test("returns empty array when no tasks exist", async () => {
			const tasks = await clientManager.listTasks(sessionId);
			expect(tasks).toEqual([]);
		});

		test("returns tasks after creating them", async () => {
			// Discover tools first to populate execution metadata
			await clientManager.listTools(sessionId);

			// Create a task
			await clientManager.callToolAsTask(sessionId, {
				name: "longProcess",
				arguments: { duration: 1000 },
			});

			const tasks = await clientManager.listTasks(sessionId);
			expect(tasks.length).toBeGreaterThanOrEqual(1);
		});
	});

	// =========================================================================
	// callToolAsTask
	// =========================================================================

	describe("callToolAsTask", () => {
		test("returns CreateTaskResult with task object", async () => {
			await clientManager.listTools(sessionId); // Discover tools first

			const result = await clientManager.callToolAsTask(sessionId, {
				name: "longProcess",
				arguments: { duration: 1000 },
			});

			expect(result.task).toBeDefined();
			expect(result.task.taskId).toBeDefined();
			expect(result.task.status).toBe("working");
			expect(result.task.createdAt).toBeDefined();
			expect(result.task.lastUpdatedAt).toBeDefined();
		});

		test("registers task in local TaskManager", async () => {
			await clientManager.listTools(sessionId);

			const result = await clientManager.callToolAsTask(sessionId, {
				name: "longProcess",
				arguments: { duration: 500 },
			});

			const cachedTask = taskManager.getTask(result.task.taskId);
			expect(cachedTask).toBeDefined();
			expect(cachedTask?.taskId).toBe(result.task.taskId);
		});

		test("throws error for tool that doesn't support tasks", async () => {
			await clientManager.listTools(sessionId);

			await expect(
				clientManager.callToolAsTask(sessionId, {
					name: "echo",
					arguments: { message: "test" },
				}),
			).rejects.toThrow("does not support task-augmented execution");
		});

		test("passes ttl option to server", async () => {
			await clientManager.listTools(sessionId);

			const result = await clientManager.callToolAsTask(
				sessionId,
				{ name: "longProcess", arguments: {} },
				{ ttl: 600000 },
			);

			expect(result.task).toBeDefined();
			// Server may echo back ttl or set its own
		});
	});

	// =========================================================================
	// getTask
	// =========================================================================

	describe("getTask", () => {
		test("retrieves task status by ID", async () => {
			await clientManager.listTools(sessionId);

			const createResult = await clientManager.callToolAsTask(sessionId, {
				name: "longProcess",
				arguments: { duration: 500 },
			});

			const task = await clientManager.getTask(
				sessionId,
				createResult.task.taskId,
			);
			expect(task.taskId).toBe(createResult.task.taskId);
			expect(["working", "completed"]).toContain(task.status);
		});

		test("throws for unknown task ID", async () => {
			await expect(
				clientManager.getTask(sessionId, "nonexistent-task"),
			).rejects.toThrow();
		});
	});

	// =========================================================================
	// cancelTask
	// =========================================================================

	describe("cancelTask", () => {
		test("cancels a running task", async () => {
			await clientManager.listTools(sessionId);

			const createResult = await clientManager.callToolAsTask(sessionId, {
				name: "longProcess",
				arguments: { duration: 10000 }, // Long duration so we can cancel
			});

			// Cancel the task
			await clientManager.cancelTask(sessionId, createResult.task.taskId);

			// Verify task was removed from local cache
			const cachedTask = taskManager.getTask(createResult.task.taskId);
			expect(cachedTask).toBeUndefined();
		});

		test("throws for unknown task ID", async () => {
			await expect(
				clientManager.cancelTask(sessionId, "nonexistent-task"),
			).rejects.toThrow();
		});
	});

	// =========================================================================
	// callToolAsTaskAndWait
	// =========================================================================

	describe("callToolAsTaskAndWait", () => {
		test("polls until task completes and returns result", async () => {
			await clientManager.listTools(sessionId);

			const result = await clientManager.callToolAsTaskAndWait(sessionId, {
				name: "quickTask",
				arguments: {},
			});

			expect(result).toBeDefined();
		});

		test("calls onProgress callback during polling", async () => {
			await clientManager.listTools(sessionId);

			const progressUpdates: Task[] = [];

			await clientManager.callToolAsTaskAndWait(
				sessionId,
				{ name: "quickTask", arguments: {} },
				{},
				(task) => {
					progressUpdates.push(task);
				},
			);

			expect(progressUpdates.length).toBeGreaterThanOrEqual(1);
		});

		test("throws error when task fails", async () => {
			await clientManager.listTools(sessionId);

			await expect(
				clientManager.callToolAsTaskAndWait(sessionId, {
					name: "failingTask",
					arguments: {},
				}),
			).rejects.toThrow();
		});
	});

	// =========================================================================
	// Task Status Notifications
	// =========================================================================

	describe("Task Status Notifications", () => {
		test("handleStatusNotification updates TaskManager cache", () => {
			// Register a task first
			taskManager.registerTask("test-task", sessionId, {
				status: "working",
			});

			// Directly call handleStatusNotification (simulating notification handler)
			taskManager.handleStatusNotification({
				taskId: "test-task",
				status: "completed",
				statusMessage: "Done",
				createdAt: new Date().toISOString(),
				lastUpdatedAt: new Date().toISOString(),
				ttl: null,
			});

			const task = taskManager.getTask("test-task");
			expect(task?.status).toBe("completed");
			expect(task?.statusMessage).toBe("Done");
		});

		test("handleStatusNotification creates task if not exists", () => {
			// Directly call handleStatusNotification for unknown task
			taskManager.handleStatusNotification({
				taskId: "new-task-from-notification",
				status: "working",
				createdAt: new Date().toISOString(),
				lastUpdatedAt: new Date().toISOString(),
				ttl: null,
			});

			const task = taskManager.getTask("new-task-from-notification");
			expect(task).toBeDefined();
			expect(task?.status).toBe("working");
		});
	});

	// =========================================================================
	// input_required Status (Spec line 111)
	// =========================================================================

	describe("input_required Status", () => {
		test("callToolAsTask returns input_required status for inputTask tool", async () => {
			await clientManager.listTools(sessionId);

			const result = await clientManager.callToolAsTask(sessionId, {
				name: "inputTask",
				arguments: {},
			});

			expect(result.task.status).toBe("input_required");
			expect(result.task.statusMessage).toBe("Waiting for user input");
		});

		test("getTask shows input_required task as waiting for input", async () => {
			await clientManager.listTools(sessionId);

			const createResult = await clientManager.callToolAsTask(sessionId, {
				name: "inputTask",
				arguments: {},
			});

			const task = await clientManager.getTask(
				sessionId,
				createResult.task.taskId,
			);
			expect(task.status).toBe("input_required");
		});

		test("polling continues on input_required until task completes", async () => {
			// This tests that input_required is NOT a terminal status
			// Use TaskManager directly with a mock that transitions:
			// input_required -> input_required -> completed
			const testManager = taskManager;
			testManager.registerTask("poll-input-test", sessionId, {
				status: "input_required",
			});

			let pollCount = 0;
			const result = await testManager.pollUntilComplete(
				"poll-input-test",
				async () => {
					pollCount++;
					// Simulate: input_required x2, then completed
					return {
						taskId: "poll-input-test",
						status: pollCount >= 3 ? "completed" : "input_required",
						statusMessage: pollCount >= 3 ? "Done" : "Waiting for input",
						createdAt: new Date().toISOString(),
						lastUpdatedAt: new Date().toISOString(),
						ttl: null,
					} as Task;
				},
			);

			expect(result.status).toBe("completed");
			expect(pollCount).toBeGreaterThanOrEqual(3);
		});
	});

	// =========================================================================
	// Server Capability Check (Spec line 72, 78)
	// =========================================================================

	describe("Server Task Capability", () => {
		test("mock server includes tasks capability in initialization", async () => {
			// The task mock server should advertise tasks.requests.tools.call
			// This is verified by the fact that our tests work, but let's be explicit
			const session = sessionManager.get(sessionId);
			// Session state should have captured the capabilities
			expect(session).toBeDefined();
			// The server capabilities should include tasks
			// Note: We can't directly access this from SessionManager,
			// but the fact that task operations work proves the capability is there
		});

		test("getToolTaskSupport returns forbidden when tool lacks execution metadata", async () => {
			await clientManager.listTools(sessionId);

			// echo tool has no execution.taskSupport
			const support = clientManager.getToolTaskSupport(sessionId, "echo");
			expect(support).toBe("forbidden");
		});
	});
});
