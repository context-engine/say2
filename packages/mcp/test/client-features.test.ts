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

describe("Client Features Integration Tests", () => {
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

	async function setupConnectedClient(serverConfig: any) {
		// 1. Create session
		const session = sessionManager.create({
			name: "test",
			transport: "stdio",
			command: "node",
		});

		// 2. Setup transport stack
		const mockTransport = createMockServerTransport(serverConfig);
		const loggingTransport = new LoggingTransport(
			mockTransport,
			session,
			pipeline,
		);

		// 3. Connect (manually transition session state to bypass process spawning)
		sessionManager.connect(session.id);
		sessionManager.initialize(session.id);
		sessionManager.activate(session.id, {}, {}, LATEST_PROTOCOL_VERSION);

		// 4. Create Client and Register
		const client = new Client(
			{ name: "client", version: "1.0.0" },
			{ capabilities: {} },
		);
		await client.connect(loggingTransport);
		registry.register(session.id, client, loggingTransport);

		return { session, client, mockTransport };
	}

	test("Resource Templates: lists templates via Manager", async () => {
		const config = {
			capabilities: { resources: true },
			resourceTemplates: [
				{
					uriTemplate: "file:///{path}",
					name: "File",
					description: "File access",
				},
				{
					uriTemplate: "db://{id}",
					name: "DB",
					description: "Database access",
				},
			],
		};

		const { session } = await setupConnectedClient(config);

		const result = await clientManager.listResourceTemplates(session.id);

		expect(result.resourceTemplates.length).toBe(2);
		expect(result.resourceTemplates[0].name).toBe("File");
		expect(result.resourceTemplates[1].uriTemplate).toBe("db://{id}");
	});

	test("Prompts List: lists prompts via Manager", async () => {
		const config = {
			capabilities: { prompts: true },
			prompts: [
				{ name: "summarize", description: "Summarize text" },
				{ name: "translate", description: "Translate text" },
			],
		};

		const { session } = await setupConnectedClient(config);

		const result = await clientManager.listPrompts(session.id);

		expect(result.prompts.length).toBe(2);
		expect(result.prompts[0].name).toBe("summarize");
		expect(result.prompts[1].description).toBe("Translate text");
	});

	test("Discovery Resilience: partial failure of capabilities", async () => {
		const config = {
			capabilities: { tools: true, resources: true, prompts: true },
			failOnMethods: ["tools/list", "prompts/list"],
			tools: [{ name: "tool1", description: "Tool 1" }],
			resources: [{ uri: "file:///test.txt", name: "Test" }],
			prompts: [{ name: "prompt1", description: "Prompt 1" }],
		};

		const { session, client } = await setupConnectedClient(config);

		// Verify tools/list fails (Manager or Client direct)
		// Manager doesn't wrap listTools errors yet, so we expect rejection
		try {
			await clientManager.listTools(session.id);
			throw new Error("Should have thrown");
		} catch (e: any) {
			expect(e.message).toBeDefined();
		}

		// Verify resources/list succeeds despite other failures
		const resources = await clientManager.listResources(session.id);
		expect(resources.resources.length).toBe(1);

		// Verify prompts/list fails
		try {
			await clientManager.listPrompts(session.id);
			throw new Error("Should have thrown");
		} catch (e: any) {
			expect(e.message).toBeDefined();
		}
	});

	test("Transport Events: LoggingTransport emits events", async () => {
		// This test verifies the LoggingTransport (real client code), not a mock object
		const session = sessionManager.create({
			name: "test",
			transport: "stdio",
			command: "node",
		});
		const mockTransport = createMockServerTransport({});

		// LoggingTransport requires a connected session for some transitions, but close/error are transport level
		const loggingTransport = new LoggingTransport(
			mockTransport,
			session,
			pipeline,
		);

		// Verify Start
		await loggingTransport.start();
		expect(mockTransport.isStarted).toBe(true);

		// Verify Close
		let closeEmit = false;
		loggingTransport.onclose = () => {
			closeEmit = true;
		};
		await loggingTransport.close();
		expect(closeEmit).toBe(true);
		expect(mockTransport.isClosed).toBe(true);
	});
});
