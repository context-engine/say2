/**
 * Tool Annotations Integration Tests
 *
 * Integration tests for tool annotations with mock MCP server.
 * Task 06: Tool Annotations - Phase 2 Integration Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
	createPipeline,
	createStateMachineMiddleware,
	LATEST_PROTOCOL_VERSION,
	SessionManager,
} from "@say2/core";
import { McpClientManager } from "../src/client/manager";
import { McpClientRegistry } from "../src/client/registry";
import { LoggingTransport } from "../src/transport";
import { createMockServerTransport } from "./fixtures/mock-server";

describe("Tool Annotations Integration Tests", () => {
	let sessionManager: SessionManager;
	let pipeline: ReturnType<typeof createPipeline>;
	let registry: McpClientRegistry;
	let clientManager: McpClientManager;

	// Mock Protocol Detector for API compatibility
	const mockDetector = {
		// biome-ignore lint/suspicious/noExplicitAny: mock
		isInitializeRequest: (msg: any) =>
			msg.method === "initialize" && "id" in msg,
		// biome-ignore lint/suspicious/noExplicitAny: mock
		isInitializeResponse: (msg: any) =>
			"result" in msg && "protocolVersion" in msg.result,
		// biome-ignore lint/suspicious/noExplicitAny: mock
		isInitializedNotification: (msg: any) =>
			msg.method === "notifications/initialized",
		// biome-ignore lint/suspicious/noExplicitAny: mock
		extractCapabilities: (msg: any) => msg.result?.capabilities,
		// biome-ignore lint/suspicious/noExplicitAny: mock
		extractServerInfo: (msg: any) => msg.result?.serverInfo,
	};

	beforeEach(() => {
		sessionManager = new SessionManager();
		pipeline = createPipeline();
		// biome-ignore lint/suspicious/noExplicitAny: API mismatch fix
		pipeline.use(
			(createStateMachineMiddleware as any)(sessionManager, mockDetector),
		);
		registry = new McpClientRegistry();
		clientManager = new McpClientManager(registry, sessionManager, pipeline);
	});

	/**
	 * Helper: Set up a connected client with the given server configuration
	 */
	// biome-ignore lint/suspicious/noExplicitAny: flexible config
	async function setupConnectedClient(serverConfig: any) {
		const session = sessionManager.create({
			name: "test",
			transport: "stdio",
			command: "node",
		});

		const mockTransport = createMockServerTransport(serverConfig);
		const loggingTransport = new LoggingTransport(
			mockTransport,
			session,
			pipeline,
		);

		// Manually transition session state
		sessionManager.connect(session.id);
		sessionManager.initialize(session.id);
		sessionManager.activate(
			session.id,
			serverConfig.capabilities ?? {},
			{},
			LATEST_PROTOCOL_VERSION,
		);

		// Create Client and Register
		const client = new Client(
			{ name: "client", version: "1.0.0" },
			{ capabilities: {} },
		);
		await client.connect(loggingTransport);
		registry.register(session.id, client, loggingTransport);

		return { session, client, mockTransport };
	}

	/**
	 * Helper: Store tools in session's discovered capabilities
	 * Uses updateCapabilities() to properly mutate the session state
	 */
	// biome-ignore lint/suspicious/noExplicitAny: flexible tools array
	function storeToolsInSession(sessionId: string, tools: any[]) {
		// Use updateCapabilities to store discovered tools in serverCapabilities
		sessionManager.updateCapabilities(sessionId, undefined, {
			tools: true, // Keep original capability flag
			discovered: { tools },
		});
	}

	// =========================================================================
	// getToolAnnotations() Tests
	// =========================================================================

	describe("getToolAnnotations()", () => {
		test("returns annotations for existing tool with full annotations", async () => {
			const toolsWithAnnotations = [
				{
					name: "read_file",
					description: "Reads a file",
					inputSchema: { type: "object" },
					annotations: {
						title: "Read File",
						readOnlyHint: true,
						destructiveHint: false,
						idempotentHint: true,
						openWorldHint: false,
					},
				},
			];

			const { session } = await setupConnectedClient({
				capabilities: { tools: true },
				tools: [{ name: "read_file", description: "Reads a file" }],
			});

			// Manually store tools with annotations
			storeToolsInSession(session.id, toolsWithAnnotations);

			const annotations = clientManager.getToolAnnotations(
				session.id,
				"read_file",
			);

			expect(annotations).toBeDefined();
			expect(annotations?.title).toBe("Read File");
			expect(annotations?.readOnlyHint).toBe(true);
			expect(annotations?.destructiveHint).toBe(false);
			expect(annotations?.idempotentHint).toBe(true);
			expect(annotations?.openWorldHint).toBe(false);
		});

		test("applies defaults for tool with partial annotations", async () => {
			const toolsWithPartialAnnotations = [
				{
					name: "search",
					inputSchema: { type: "object" },
					annotations: {
						title: "Search Tool",
						// Other hints not specified - should get defaults
					},
				},
			];

			const { session } = await setupConnectedClient({
				capabilities: { tools: true },
				tools: [{ name: "search", description: "Search tool" }],
			});

			storeToolsInSession(session.id, toolsWithPartialAnnotations);

			const annotations = clientManager.getToolAnnotations(
				session.id,
				"search",
			);

			expect(annotations).toBeDefined();
			expect(annotations?.title).toBe("Search Tool");
			// Defaults applied:
			expect(annotations?.readOnlyHint).toBe(false);
			expect(annotations?.destructiveHint).toBe(true);
			expect(annotations?.idempotentHint).toBe(false);
			expect(annotations?.openWorldHint).toBe(true);
		});

		test("applies all defaults for tool without annotations", async () => {
			const toolsWithoutAnnotations = [
				{
					name: "no_hints",
					inputSchema: { type: "object" },
					// No annotations property
				},
			];

			const { session } = await setupConnectedClient({
				capabilities: { tools: true },
				tools: [{ name: "no_hints", description: "Tool without annotations" }],
			});

			storeToolsInSession(session.id, toolsWithoutAnnotations);

			const annotations = clientManager.getToolAnnotations(
				session.id,
				"no_hints",
			);

			// Should return defaults (not undefined) because tool exists
			expect(annotations).toBeDefined();
			expect(annotations?.readOnlyHint).toBe(false);
			expect(annotations?.destructiveHint).toBe(true);
			expect(annotations?.idempotentHint).toBe(false);
			expect(annotations?.openWorldHint).toBe(true);
		});

		test("returns undefined for non-existent tool", async () => {
			const tools = [
				{
					name: "existing_tool",
					inputSchema: { type: "object" },
				},
			];

			const { session } = await setupConnectedClient({
				capabilities: { tools: true },
				tools: [{ name: "existing_tool", description: "Existing" }],
			});

			storeToolsInSession(session.id, tools);

			const annotations = clientManager.getToolAnnotations(
				session.id,
				"non_existent_tool",
			);

			expect(annotations).toBeUndefined();
		});

		test("returns undefined for non-existent session", () => {
			const annotations = clientManager.getToolAnnotations(
				"non-existent-session-id",
				"any_tool",
			);

			expect(annotations).toBeUndefined();
		});

		test("returns undefined when session has no discovered tools", async () => {
			const { session } = await setupConnectedClient({
				capabilities: { tools: true },
				tools: [],
			});

			// Don't store any tools - discovered.tools will be undefined

			const annotations = clientManager.getToolAnnotations(
				session.id,
				"any_tool",
			);

			expect(annotations).toBeUndefined();
		});
	});

	// =========================================================================
	// listToolsTyped() Tests
	// =========================================================================

	describe("listToolsTyped()", () => {
		test("returns all tools with annotation defaults applied", async () => {
			const tools = [
				{
					name: "tool_with_annotations",
					description: "Has annotations",
					inputSchema: { type: "object" },
					annotations: {
						title: "Annotated Tool",
						readOnlyHint: true,
					},
				},
				{
					name: "tool_without_annotations",
					description: "No annotations",
					inputSchema: { type: "object" },
				},
			];

			const { session } = await setupConnectedClient({
				capabilities: { tools: true },
				tools: [
					{ name: "tool_with_annotations", description: "Has annotations" },
					{ name: "tool_without_annotations", description: "No annotations" },
				],
			});

			storeToolsInSession(session.id, tools);

			const typedTools = clientManager.listToolsTyped(session.id);

			expect(typedTools).toHaveLength(2);

			// First tool - has explicit annotations
			const annotatedTool = typedTools.find(
				(t) => t.name === "tool_with_annotations",
			);
			expect(annotatedTool?.annotations?.title).toBe("Annotated Tool");
			expect(annotatedTool?.annotations?.readOnlyHint).toBe(true);
			expect(annotatedTool?.annotations?.destructiveHint).toBe(true); // default
			expect(annotatedTool?.annotations?.idempotentHint).toBe(false); // default
			expect(annotatedTool?.annotations?.openWorldHint).toBe(true); // default

			// Second tool - all defaults applied
			const plainTool = typedTools.find(
				(t) => t.name === "tool_without_annotations",
			);
			expect(plainTool?.annotations?.readOnlyHint).toBe(false);
			expect(plainTool?.annotations?.destructiveHint).toBe(true);
			expect(plainTool?.annotations?.idempotentHint).toBe(false);
			expect(plainTool?.annotations?.openWorldHint).toBe(true);
		});

		test("returns empty array for session with no tools", async () => {
			const { session } = await setupConnectedClient({
				capabilities: { tools: true },
				tools: [],
			});

			// Empty discovered tools
			storeToolsInSession(session.id, []);

			const typedTools = clientManager.listToolsTyped(session.id);

			expect(typedTools).toEqual([]);
		});

		test("returns empty array for non-existent session", () => {
			const typedTools = clientManager.listToolsTyped("non-existent-session");

			expect(typedTools).toEqual([]);
		});

		test("preserves all tool fields alongside annotations", async () => {
			const tools = [
				{
					name: "complete_tool",
					description: "A tool with all fields",
					inputSchema: {
						type: "object",
						properties: { input: { type: "string" } },
						required: ["input"],
					},
					outputSchema: {
						type: "object",
						properties: { output: { type: "number" } },
					},
					annotations: {
						title: "Complete Tool",
					},
					execution: {
						taskSupport: "optional",
					},
					_meta: {
						version: "1.0",
					},
				},
			];

			const { session } = await setupConnectedClient({
				capabilities: { tools: true },
				tools: [{ name: "complete_tool", description: "Complete" }],
			});

			storeToolsInSession(session.id, tools);

			const typedTools = clientManager.listToolsTyped(session.id);

			expect(typedTools).toHaveLength(1);
			const tool = typedTools[0]!;

			// Core fields preserved
			expect(tool.name).toBe("complete_tool");
			expect(tool.description).toBe("A tool with all fields");
			expect(tool.inputSchema).toBeDefined();
			expect(tool.inputSchema.properties).toBeDefined();
			expect(tool.outputSchema).toBeDefined();

			// Annotations with defaults
			expect(tool.annotations?.title).toBe("Complete Tool");

			// Other optional fields preserved
			expect(tool.execution?.taskSupport).toBe("optional");
			expect(tool._meta?.version).toBe("1.0");
		});
	});

	// =========================================================================
	// Edge Cases
	// =========================================================================

	describe("Edge Cases", () => {
		test("handles tools with empty annotations object", async () => {
			const tools = [
				{
					name: "empty_annotations",
					inputSchema: { type: "object" },
					annotations: {}, // Empty but present
				},
			];

			const { session } = await setupConnectedClient({
				capabilities: { tools: true },
				tools: [{ name: "empty_annotations", description: "Empty" }],
			});

			storeToolsInSession(session.id, tools);

			const annotations = clientManager.getToolAnnotations(
				session.id,
				"empty_annotations",
			);

			// All defaults should be applied
			expect(annotations).toBeDefined();
			expect(annotations?.readOnlyHint).toBe(false);
			expect(annotations?.destructiveHint).toBe(true);
			expect(annotations?.idempotentHint).toBe(false);
			expect(annotations?.openWorldHint).toBe(true);
		});

		test("handles multiple tools with varying annotation coverage", async () => {
			const tools = [
				{
					name: "full",
					inputSchema: { type: "object" },
					annotations: {
						title: "Full",
						readOnlyHint: true,
						destructiveHint: false,
						idempotentHint: true,
						openWorldHint: false,
					},
				},
				{
					name: "partial",
					inputSchema: { type: "object" },
					annotations: { title: "Partial" },
				},
				{
					name: "none",
					inputSchema: { type: "object" },
				},
			];

			const { session } = await setupConnectedClient({
				capabilities: { tools: true },
				tools: tools.map((t) => ({ name: t.name, description: t.name })),
			});

			storeToolsInSession(session.id, tools);

			const typedTools = clientManager.listToolsTyped(session.id);

			expect(typedTools).toHaveLength(3);

			// Full - all explicit
			const full = typedTools.find((t) => t.name === "full");
			expect(full?.annotations?.readOnlyHint).toBe(true);
			expect(full?.annotations?.destructiveHint).toBe(false);

			// Partial - mixed
			const partial = typedTools.find((t) => t.name === "partial");
			expect(partial?.annotations?.title).toBe("Partial");
			expect(partial?.annotations?.readOnlyHint).toBe(false); // default

			// None - all defaults
			const none = typedTools.find((t) => t.name === "none");
			expect(none?.annotations?.readOnlyHint).toBe(false);
			expect(none?.annotations?.destructiveHint).toBe(true);
		});
	});
});
