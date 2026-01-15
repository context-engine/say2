/**
 * McpClientManager
 *
 * Orchestrates the MCP client connection lifecycle.
 * Creates transport stack, connects client, and manages registration.
 *
 * Connection flow:
 * 1. Get session from SessionManager
 * 2. Transition to CONNECTING state
 * 3. Create StdioClientTransport with session config
 * 4. Wrap with LoggingTransport for message interception
 * 5. Create MCP SDK Client and connect
 * 6. Register in McpClientRegistry
 * 7. Discover server capabilities (tools, resources, prompts)
 *
 * Phase 1 only supports STDIO transport.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from "zod";
import type { MiddlewarePipeline, SessionManager } from "@say2/core";
import { LoggingTransport } from "../transport";
import type { McpClientRegistry } from "./registry";
import type {
	ToolCallRequest,
	ToolOperation,
	CallToolOptions,
} from "../types/tool";
import { toolOperationStore } from "../store";
import { progressTracker } from "../progress/tracker";
import { McpProgressNotificationSchema } from "../types/progress";
import { cancellationManager } from "../cancel/manager";
import { ContentParser } from "../content/parser";
import {
	applyAnnotationDefaults,
	type Tool,
	type ToolAnnotations,
} from "../types/tool-annotations";
import {
	TaskListResultSchema,
	TaskGetResultSchema,
	EmptyResultSchema,
	TaskStatusNotificationSchema,
	CreateTaskResultSchema,
	type Task,
	type TaskMetadata,
	type CreateTaskResult,
} from "../types/task";
import { taskManager } from "../task/manager";

export class McpClientManager {
	constructor(
		private registry: McpClientRegistry,
		private sessionManager: SessionManager,
		private pipeline: MiddlewarePipeline,
		private clientFactory: (
			clientInfo: { name: string; version: string },
			options?: { capabilities: any },
		) => Client = (info, opts) => new Client(info, opts),
	) { }

	/**
	 * Connect to an MCP server for the given session.
	 * Creates transport stack and initiates connection.
	 * @throws Error if session not found or transport not supported
	 */
	async connect(sessionId: string): Promise<void> {
		// 1. Get session
		const session = this.sessionManager.get(sessionId);
		if (!session) {
			throw new Error(`Session not found: ${sessionId}`);
		}

		// 2. Validate transport type (Phase 1 only supports STDIO)
		if (session.config.transport !== "stdio") {
			throw new Error(
				`Transport type '${session.config.transport}' not supported. Phase 1 only supports 'stdio'.`,
			);
		}

		// Validate STDIO config
		if (!session.config.command) {
			throw new Error("STDIO transport requires 'command' in config");
		}

		// 3. Transition to CONNECTING state
		const connectResult = this.sessionManager.connect(sessionId);
		if (!connectResult.success) {
			throw new Error(
				`Failed to transition to CONNECTING: ${connectResult.error}`,
			);
		}

		try {
			// 4. Create base STDIO transport
			const stdioTransport = new StdioClientTransport({
				command: session.config.command,
				args: session.config.args ?? [],
				env: session.config.env,
			});

			// 5. Wrap with LoggingTransport for message interception
			const loggingTransport = new LoggingTransport(
				stdioTransport,
				session,
				this.pipeline,
			);

			// 6. Create MCP SDK Client
			const client = this.clientFactory(
				{
					name: "Say2",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			// 7. Connect client (this triggers initialize handshake)
			// The StateMachineMiddleware will handle state transitions
			// as it observes the initialize/initialized messages
			await client.connect(loggingTransport);

			// 8. Set up progress notification handler
			client.setNotificationHandler(
				McpProgressNotificationSchema,
				(notification) => {
					progressTracker.handleNotification({
						progressToken: notification.params.progressToken,
						progress: notification.params.progress,
						total: notification.params.total,
						message: notification.params.message,
					});
				},
			);

			// 9. Set up task status notification handler (optional per spec)
			client.setNotificationHandler(
				TaskStatusNotificationSchema,
				(notification) => {
					taskManager.handleStatusNotification(notification.params);
				},
			);

			// 9. Register in registry
			this.registry.register(sessionId, client, loggingTransport);

			// 9. Discover capabilities (Tools, Resources, Prompts)
			// Wait for session to be active (handled by middleware but we can check state)
			await this.discoverCapabilities(sessionId);
		} catch (error) {
			// On failure, mark session as error
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.sessionManager.markError(
				sessionId,
				`Connection failed: ${errorMessage}`,
			);
			throw error;
		}
	}

	/**
	 * Discover server capabilities by querying lists based on declared support.
	 */
	private async discoverCapabilities(sessionId: string): Promise<void> {
		const session = this.sessionManager.get(sessionId);
		if (!session || !session.serverCapabilities) {
			return;
		}

		console.log(
			`[McpClientManager] Discovering capabilities for session ${sessionId}...`,
		);

		// Discovery is "best effort" - log errors but don't fail connection
		try {
			// Tools
			if (session.serverCapabilities.tools) {
				console.log(`[McpClientManager] Discovering tools...`);
				await this.listTools(sessionId);
			}

			// Resources
			if (session.serverCapabilities.resources) {
				console.log(`[McpClientManager] Discovering resources...`);
				await this.listResources(sessionId);
			}

			// Prompts
			if (session.serverCapabilities.prompts) {
				console.log(`[McpClientManager] Discovering prompts...`);
				await this.listPrompts(sessionId);
			}
		} catch (error) {
			console.warn(`[McpClientManager] Capability discovery warning: ${error}`);
		}
	}

	/**
	 * Disconnect from an MCP server.
	 * Cleans up client and transport resources.
	 * Idempotent - no error if not connected.
	 */
	async disconnect(sessionId: string): Promise<void> {
		const entry = this.registry.get(sessionId);
		if (!entry) {
			// Not connected - idempotent, just return
			return;
		}

		try {
			// Close the client (this also closes the transport)
			await entry.client.close();
		} finally {
			// Always remove from registry
			this.registry.remove(sessionId);
		}
	}

	/**
	 * Get the MCP SDK Client for a session.
	 */
	getClient(sessionId: string): Client | undefined {
		return this.registry.get(sessionId)?.client;
	}

	/**
	 * List all tools for a session, automatically following pagination.
	 */
	async listTools(sessionId: string): Promise<{ tools: any[] }> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		let tools: any[] = [];
		let cursor: string | undefined;

		do {
			const result = await client.listTools({ cursor });
			tools = tools.concat(result.tools);
			cursor = result.nextCursor;
		} while (cursor);

		// Cache in session
		const session = this.sessionManager.get(sessionId);
		if (session?.serverCapabilities) {
			const caps = session.serverCapabilities as any;
			if (!caps.discovered) caps.discovered = {};
			caps.discovered.tools = tools;
		}

		return { tools };
	}

	/**
	 * List all resources for a session, automatically following pagination.
	 */
	async listResources(sessionId: string): Promise<{ resources: any[] }> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		let resources: any[] = [];
		let cursor: string | undefined;

		do {
			const result = await client.listResources({ cursor });
			resources = resources.concat(result.resources);
			cursor = result.nextCursor;
		} while (cursor);

		// Cache in session
		const session = this.sessionManager.get(sessionId);
		if (session?.serverCapabilities) {
			const caps = session.serverCapabilities as any;
			if (!caps.discovered) caps.discovered = {};
			caps.discovered.resources = resources;
		}

		return { resources };
	}

	/**
	 * List all resource templates for a session, automatically following pagination.
	 */
	async listResourceTemplates(
		sessionId: string,
	): Promise<{ resourceTemplates: any[] }> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		let resourceTemplates: any[] = [];
		let cursor: string | undefined;

		do {
			const result = await client.listResourceTemplates({ cursor });
			resourceTemplates = resourceTemplates.concat(result.resourceTemplates);
			cursor = result.nextCursor;
		} while (cursor);

		return { resourceTemplates };
	}

	/**
	 * List all prompts for a session, automatically following pagination.
	 */
	async listPrompts(sessionId: string): Promise<{ prompts: any[] }> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		let prompts: any[] = [];
		let cursor: string | undefined;

		do {
			const result = await client.listPrompts({ cursor });
			prompts = prompts.concat(result.prompts);
			cursor = result.nextCursor;
		} while (cursor);

		// Cache in session
		const session = this.sessionManager.get(sessionId);
		if (session?.serverCapabilities) {
			const caps = session.serverCapabilities as any;
			if (!caps.discovered) caps.discovered = {};
			caps.discovered.prompts = prompts;
		}

		return { prompts };
	}

	// =========================================================================
	// Tool Annotations (Phase 2a Task 06)
	// =========================================================================

	/**
	 * List all tools with full typing and annotations applied.
	 * Returns cached tools from session with defaults applied to annotations.
	 *
	 * @param sessionId - The session ID
	 * @returns Array of fully-typed Tool objects with annotation defaults
	 */
	listToolsTyped(sessionId: string): Tool[] {
		const session = this.sessionManager.get(sessionId);
		const discovered = session?.serverCapabilities?.discovered as
			| { tools?: Tool[] }
			| undefined;
		const tools = discovered?.tools ?? [];

		return tools.map((tool) => ({
			...tool,
			annotations: applyAnnotationDefaults(tool.annotations),
		}));
	}

	/**
	 * Retrieve annotations for a specific tool.
	 * Tools are stored during Phase 1 capability discovery.
	 *
	 * @param sessionId - The session ID
	 * @param toolName - The name of the tool
	 * @returns ToolAnnotations with defaults applied, or undefined if not found
	 */
	getToolAnnotations(
		sessionId: string,
		toolName: string,
	): ToolAnnotations | undefined {
		const session = this.sessionManager.get(sessionId);
		const discovered = session?.serverCapabilities?.discovered as
			| { tools?: Tool[] }
			| undefined;

		if (!discovered?.tools) {
			return undefined;
		}

		const tool = discovered.tools.find((t) => t.name === toolName);

		if (!tool) {
			return undefined;
		}

		// Apply defaults to ensure all fields are present
		return applyAnnotationDefaults(tool.annotations);
	}

	// =========================================================================
	// Tool Operations
	// =========================================================================

	/**
	 * Call a tool on the connected MCP server.
	 *
	 * Supports progress tracking when options.includeProgress is true.
	 *
	 * @param sessionId - The session to execute the tool on
	 * @param request - The tool call request (name + arguments)
	 * @param options - Optional configuration (timeout, progress tracking)
	 * @returns A ToolOperation tracking the execution lifecycle
	 * @throws Error if session not connected or tool execution fails
	 */
	async callTool(
		sessionId: string,
		request: ToolCallRequest,
		options?: CallToolOptions,
	): Promise<ToolOperation> {
		const entry = this.registry.get(sessionId);
		if (!entry) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		// Generate request ID for correlation
		const requestId = `call-${Date.now()}-${Math.random().toString(36).slice(2)}`;

		// Create pending operation
		const operation = toolOperationStore.create(sessionId, request, requestId);

		// Progress tracking setup
		let progressToken: string | undefined;
		if (options?.includeProgress) {
			progressToken = progressTracker.generateToken();
			progressTracker.register(progressToken, operation.id);
			toolOperationStore.update(operation.id, { progressToken });
		}

		// Cancellation setup with abort capability
		let cancelReject: ((reason: Error) => void) | undefined;
		const cancelPromise = new Promise<never>((_, reject) => {
			cancelReject = reject;
		});

		cancellationManager.setClient(entry.client);
		cancellationManager.register(requestId, operation.id, options?.timeout, cancelReject);

		try {
			// Build request params with optional progress token
			const callParams: { name: string; arguments: Record<string, unknown>; _meta?: { progressToken: string } } = {
				name: request.name,
				arguments: request.arguments ?? {},
			};
			if (progressToken) {
				callParams._meta = { progressToken };
			}

			// Call tool via MCP SDK with cancellation support
			// Race between the SDK call and the cancel promise
			const result = await Promise.race([
				entry.client.callTool(callParams),
				cancelPromise,
			]);

			// Check if operation was cancelled while waiting for response
			const currentOp = toolOperationStore.get(operation.id);
			if (currentOp?.status === "cancelled") {
				// Response arrived after cancel - ignore it
				return toolOperationStore.get(operation.id)!;
			}

			// Parse and validate content via ContentParser
			const contentParser = new ContentParser();
			let parsedContent;
			try {
				parsedContent = contentParser.parseContent(result.content as unknown[]);
			} catch (parseError) {
				// Content parsing failed - store as error
				toolOperationStore.update(operation.id, {
					status: "error",
					error: {
						code: -32602, // Invalid params
						message: parseError instanceof Error ? parseError.message : String(parseError),
					},
				});
				return toolOperationStore.get(operation.id)!;
			}

			// Validate structured output if schema provided
			const structuredContent = (result as any).structuredContent;
			if (structuredContent && options?.outputSchema) {
				const validation = contentParser.validateStructuredOutput(
					structuredContent,
					options.outputSchema,
				);
				if (!validation.valid) {
					toolOperationStore.update(operation.id, {
						status: "error",
						error: {
							code: -32602, // Invalid params
							message: `Invalid structured output: ${validation.errors?.join(", ")}`,
						},
					});
					return toolOperationStore.get(operation.id)!;
				}
			}

			// Update operation with result
			if (result.isError) {
				toolOperationStore.update(operation.id, {
					status: "error",
					result: {
						content: parsedContent,
						isError: true,
						structuredContent: (result as any).structuredContent,
					},
				});
			} else {
				toolOperationStore.update(operation.id, {
					status: "completed",
					result: {
						content: parsedContent,
						isError: false,
						structuredContent: (result as any).structuredContent,
					},
				});
			}
		} catch (error: any) {
			// Check if this was a cancellation
			const currentOp = toolOperationStore.get(operation.id);
			if (currentOp?.status === "cancelled") {
				// Already marked as cancelled - just return
				return toolOperationStore.get(operation.id)!;
			}

			// Protocol error (JSON-RPC error from server)
			toolOperationStore.update(operation.id, {
				status: "error",
				error: {
					code: error.code ?? -32603,
					message: error.message || String(error),
					data: error.data,
				},
			});
		} finally {
			// Notify cancellation manager that response arrived
			cancellationManager.onResponse(requestId);

			// Cleanup progress token registration
			if (progressToken) {
				progressTracker.unregister(progressToken);
			}
		}

		return toolOperationStore.get(operation.id)!;
	}

	/**
	 * Get a tool operation by ID.
	 * @param operationId - The operation ID
	 * @returns The ToolOperation or undefined if not found
	 */
	getToolOperation(operationId: string): ToolOperation | undefined {
		return toolOperationStore.get(operationId);
	}

	/**
	 * Get all tool operations for a session.
	 * @param sessionId - The session ID
	 * @returns Array of ToolOperations for the session
	 */
	getToolOperations(sessionId: string): ToolOperation[] {
		return toolOperationStore.getBySession(sessionId);
	}

	/**
	 * Check if a session has an active MCP connection.
	 */
	isConnected(sessionId: string): boolean {
		return this.registry.get(sessionId) !== undefined;
	}

	/**
	 * Cancel a running tool operation.
	 * @param operationId - The operation ID
	 * @param reason - Optional cancellation reason
	 */
	async cancelOperation(operationId: string, reason?: string): Promise<void> {
		// Verify operation exists and is still pending
		const operation = toolOperationStore.get(operationId);
		if (!operation) {
			return; // Unknown operation - ignore
		}
		if (operation.status !== "pending") {
			return; // Already completed/error/cancelled - ignore
		}

		await cancellationManager.cancel(operationId, reason);
	}

	// =========================================================================
	// Task Operations (Phase 2a Task 07)
	// =========================================================================

	/**
	 * List all active tasks for a session.
	 * @param sessionId - The session ID
	 * @returns Array of active tasks
	 */
	async listTasks(sessionId: string): Promise<Task[]> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		const tasks: Task[] = [];
		let cursor: string | undefined;

		do {
			const result = await client.request(
				{ method: "tasks/list", params: { cursor } },
				TaskListResultSchema,
			);
			tasks.push(...result.tasks);
			cursor = result.nextCursor;
		} while (cursor);

		return tasks;
	}

	/**
	 * Get a specific task's status.
	 * @param sessionId - The session ID
	 * @param taskId - The task identifier
	 * @returns Task metadata
	 */
	async getTask(sessionId: string, taskId: string): Promise<Task> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		return await client.request(
			{ method: "tasks/get", params: { taskId } },
			TaskGetResultSchema,
		);
	}

	/**
	 * Get the actual result of a completed task.
	 * @param sessionId - The session ID
	 * @param taskId - The task identifier
	 * @returns The tool call result
	 */
	async getTaskResult(sessionId: string, taskId: string): Promise<unknown> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		// Return unknown for now - will be typed when integrating with callTool
		return await client.request(
			{ method: "tasks/result", params: { taskId } },
			z.unknown(),
		);
	}

	/**
	 * Cancel a running task.
	 * @param sessionId - The session ID
	 * @param taskId - The task identifier
	 */
	async cancelTask(sessionId: string, taskId: string): Promise<void> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		await client.request(
			{ method: "tasks/cancel", params: { taskId } },
			EmptyResultSchema,
		);

		// Update local cache
		taskManager.removeTask(taskId);
	}

	/**
	 * Check if a tool supports task-augmented execution.
	 * @param sessionId - The session ID
	 * @param toolName - The tool name
	 * @returns Task support level
	 */
	getToolTaskSupport(
		sessionId: string,
		toolName: string,
	): "forbidden" | "optional" | "required" {
		const session = this.sessionManager.get(sessionId);
		const discovered = session?.serverCapabilities?.discovered as
			| { tools?: Tool[] }
			| undefined;
		const tool = discovered?.tools?.find((t) => t.name === toolName);

		// Default to 'forbidden' if not specified
		return tool?.execution?.taskSupport ?? "forbidden";
	}

	/**
	 * Call a tool with task-augmented execution.
	 * Returns a task that can be polled for completion.
	 *
	 * @param sessionId - The session ID
	 * @param request - The tool call request
	 * @param taskOptions - Task metadata (e.g., ttl)
	 * @returns CreateTaskResult with the created task
	 * @throws Error if tool doesn't support tasks
	 */
	async callToolAsTask(
		sessionId: string,
		request: ToolCallRequest,
		taskOptions: TaskMetadata = {},
	): Promise<CreateTaskResult> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		// 1. Check server-level capability first (per spec)
		const session = this.sessionManager.get(sessionId);
		const serverCaps = session?.serverCapabilities as
			| { tasks?: { requests?: { tools?: { call?: boolean } } } }
			| undefined;

		if (!serverCaps?.tasks?.requests?.tools?.call) {
			throw new Error(
				"Server does not support task-augmented tool execution",
			);
		}

		// 2. Check tool-level support
		const taskSupport = this.getToolTaskSupport(sessionId, request.name);
		if (taskSupport === "forbidden") {
			throw new Error(
				`Tool "${request.name}" does not support task-augmented execution`,
			);
		}

		// Call tool with task metadata
		const result = await client.request(
			{
				method: "tools/call",
				params: {
					name: request.name,
					arguments: request.arguments,
					task: taskOptions,
				},
			},
			CreateTaskResultSchema,
		);

		// Register task in local manager
		taskManager.registerTask(result.task.taskId, sessionId, result.task);

		return result;
	}

	/**
	 * Call a tool as a task and wait for completion.
	 * Combines callToolAsTask with polling.
	 *
	 * @param sessionId - The session ID
	 * @param request - The tool call request
	 * @param taskOptions - Task metadata
	 * @param onProgress - Optional progress callback
	 * @returns The final tool result
	 */
	async callToolAsTaskAndWait(
		sessionId: string,
		request: ToolCallRequest,
		taskOptions: TaskMetadata = {},
		onProgress?: (task: Task) => void,
	): Promise<unknown> {
		// Start the task
		const createResult = await this.callToolAsTask(
			sessionId,
			request,
			taskOptions,
		);

		const taskId = createResult.task.taskId;

		// Poll until complete or input_required (which needs user action)
		const finalTask = await taskManager.pollUntilComplete(
			taskId,
			() => this.getTask(sessionId, taskId),
			onProgress,
			// Stop early on input_required since this method can't provide input
			(task) => task.status === "input_required",
		);

		// Handle terminal states
		if (finalTask.status === "failed") {
			throw new Error(
				finalTask.statusMessage ?? `Task ${taskId} failed`,
			);
		}

		if (finalTask.status === "cancelled") {
			throw new Error(
				finalTask.statusMessage ?? `Task ${taskId} was cancelled`,
			);
		}

		// input_required requires user interaction - this method can't handle it
		if (finalTask.status === "input_required") {
			throw new Error(
				`Task ${taskId} requires input: ${finalTask.statusMessage ?? "waiting for elicitation or sampling"}`,
			);
		}

		// Get the actual result
		return await this.getTaskResult(sessionId, taskId);
	}
}
