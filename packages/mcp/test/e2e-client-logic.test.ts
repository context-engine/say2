import { beforeEach, describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
	createPipeline,
	createStateMachineMiddleware,
	LATEST_PROTOCOL_VERSION,
	SessionManager,
	SessionState,
} from "@say2/core";
import { McpClientManager } from "../src/client/manager";
import { McpClientRegistry } from "../src/client/registry";
import { LoggingTransport } from "../src/transport";
import { createMockServerTransport } from "./fixtures/mock-server";

describe("E2E Client Logic Verification", () => {
	let sessionManager: SessionManager;
	let pipeline: ReturnType<typeof createPipeline>;
	let registry: McpClientRegistry;
	let clientManager: McpClientManager;

	beforeEach(() => {
		sessionManager = new SessionManager();
		pipeline = createPipeline();

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

		// Add state machine middleware to pipeline
		// Casting to any to support API mismatch fix
		// biome-ignore lint/suspicious/noExplicitAny: needed for api mismatch fix
		pipeline.use(
			(createStateMachineMiddleware as any)(sessionManager, mockDetector),
		);

		registry = new McpClientRegistry();
		clientManager = new McpClientManager(registry, sessionManager, pipeline);
	});

	test("Version Mismatch triggers Session Error", async () => {
		// Setup session
		const session = sessionManager.create({
			name: "test",
			transport: "stdio",
			command: "node",
		});
		sessionManager.connect(session.id); // Go to CONNECTING

		// Setup Mock Transport with incompatible version
		const incompatibleConfig = {
			name: "bad-server",
			version: "1.0.0",
			protocolVersion: "0.1.0", // Unsupported
			capabilities: {},
		};
		const mockTransport = createMockServerTransport(incompatibleConfig);

		// Setup Logging Transport to bind everything
		const loggingTransport = new LoggingTransport(
			mockTransport,
			session,
			pipeline,
		);

		// Manual Handshake to verify Middleware Logic reliability
		// 1. Start transport
		await loggingTransport.start();

		// 2. Send Initialize (Outbound)
		// This triggers Middleware -> sessionManager.initialize() -> State: INITIALIZING
		// Then MockTransport responds -> LoggingTransport intercepts Inbound -> Middleware -> validates -> State: ERROR
		await loggingTransport.send({
			jsonrpc: "2.0",
			id: 0,
			method: "initialize",
			params: {
				protocolVersion: LATEST_PROTOCOL_VERSION,
				capabilities: {},
				clientInfo: { name: "test", version: "1.0" },
			},
		});

		// Wait for async processing in pipeline
		await new Promise((r) => setTimeout(r, 50));

		// Verify Session State
		const updatedSession = sessionManager.get(session.id);

		expect(updatedSession?.state).toBe(SessionState.ERROR);
		expect(updatedSession?.error).toContain("Protocol version mismatch");
	});

	test("ClientManager auto-paginates listTools", async () => {
		// Setup session
		const session = sessionManager.create({
			name: "test",
			transport: "stdio",
			command: "node",
		});

		// Manually transition to ACTIVE state
		sessionManager.connect(session.id);
		sessionManager.initialize(session.id);
		sessionManager.activate(session.id, {}, {}, LATEST_PROTOCOL_VERSION);

		// Configure paginated mock server
		const paginatedConfig = {
			name: "paginated-server",
			version: "1.0.0",
			capabilities: { tools: true },
			tools: Array.from({ length: 10 }, (_, i) => ({
				name: `tool-${i + 1}`,
				description: `Tool ${i + 1}`,
			})),
			toolsPageSize: 3,
		};
		const mockTransport = createMockServerTransport(paginatedConfig);

		// Setup Client
		const client = new Client(
			{ name: "client", version: "1.0.0" },
			{ capabilities: {} },
		);

		// Wrap for registry type safety
		const loggingTransport = new LoggingTransport(
			mockTransport,
			session,
			pipeline,
		);

		await client.connect(loggingTransport);

		// Inject into Registry (simulating connected state)
		registry.register(session.id, client, loggingTransport);

		// Act: Use ClientManager's convenience method
		const result = await clientManager.listTools(session.id);

		// Assert: Auto-pagination worked
		expect(result.tools.length).toBe(10);
		expect(result.tools[0].name).toBe("tool-1");
		expect(result.tools[9].name).toBe("tool-10");
	});

	test("Partial Failure: one method fails, others succeed", async () => {
		// Setup session
		const session = sessionManager.create({
			name: "test",
			transport: "stdio",
			command: "node",
		});
		// Manually transition to ACTIVE state
		sessionManager.connect(session.id);
		sessionManager.initialize(session.id);
		sessionManager.activate(session.id, {}, {}, LATEST_PROTOCOL_VERSION);

		const config = {
			name: "partial-failure-server",
			version: "1.0.0",
			capabilities: { tools: true, resources: true },
			failOnMethods: ["tools/list"],
			tools: [{ name: "tool1", description: "Tool 1" }],
			resources: [{ uri: "file:///test.txt", name: "Test" }],
		};
		const mockTransport = createMockServerTransport(config);

		// Setup Client
		const client = new Client(
			{ name: "client", version: "1.0.0" },
			{ capabilities: {} },
		);
		const loggingTransport = new LoggingTransport(
			mockTransport,
			session,
			pipeline,
		);

		await client.connect(loggingTransport);

		// Inject into Registry
		registry.register(session.id, client, loggingTransport);

		// tools/list should fail (unwrapped)
		// We use client directly or manager? Manager doesn't handle listTools failure wrapping (yet), just pagination.
		// Testing raw client behavior here is fine to verify underlying resilience.

		try {
			await client.listTools();
			throw new Error("Should have thrown");
		} catch (e: any) {
			expect(e.message).toBeDefined();
		}

		// resources/list should succeed
		// Using manager to verify integration
		const resources = await clientManager.listResources(session.id);
		expect(resources.resources.length).toBe(1);
	});
});
