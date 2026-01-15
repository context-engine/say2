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
import { LoggingTransport } from "../src/transport";
import {
	createMockServerTransport,
	type MockServerTransport,
} from "./fixtures/mock-server";
import { scenarioMockConfig } from "./fixtures/tool-scenarios";
import { progressTracker } from "../src/progress/tracker";
import { McpProgressNotificationSchema } from "../src/types/progress";

/**
 * Progress Tracking Integration Tests
 *
 * These tests verify the end-to-end flow of progress tracking:
 * 1. Progress token is added to tool call requests
 * 2. Server sends progress notifications
 * 3. Client receives and stores progress updates
 * 4. Progress is accessible on the ToolOperation
 */
describe("Progress Tracking Integration", () => {
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

		// Mock Protocol Detector (consistent with tool-call.test.ts)
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
			name: "progress-test-session",
			transport: "stdio",
			command: "node",
		});
		sessionId = session.id;

		// Setup Transport with progress-enabled tools
		mockTransport = createMockServerTransport(scenarioMockConfig);
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

		// Set up progress notification handler (mirrors McpClientManager.connect())
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

		registry.register(sessionId, client, loggingTransport);

		// Manually transition to ACTIVE
		sessionManager.connect(sessionId);
		sessionManager.initialize(sessionId);
		sessionManager.activate(sessionId, {}, {}, LATEST_PROTOCOL_VERSION);
	});

	afterEach(async () => {
		// Cleanup: close transport
		if (mockTransport && !mockTransport.isClosed) {
			await mockTransport.close();
		}
	});

	test("callTool() with includeProgress adds progressToken to request _meta", async () => {
		// Capture sent messages to verify progressToken is present
		let capturedRequest: any = null;
		const originalSend = mockTransport.send.bind(mockTransport);
		mockTransport.send = async (msg: any) => {
			if ("method" in msg && msg.method === "tools/call") {
				capturedRequest = msg;
			}
			return originalSend(msg);
		};

		// Call tool with progress enabled
		await clientManager.callTool(
			sessionId,
			{ name: "slowWithProgress", arguments: {} },
			{ includeProgress: true },
		);

		expect(capturedRequest).toBeDefined();
		expect(capturedRequest?.params?._meta?.progressToken).toBeDefined();
	});

	test("callTool() receives progress notifications from server", async () => {
		// Track received notifications
		const receivedNotifications: any[] = [];
		const originalOnMessage = mockTransport.onmessage;
		mockTransport.onmessage = (msg: any) => {
			if ("method" in msg && msg.method === "notifications/progress") {
				receivedNotifications.push(msg);
			}
			originalOnMessage?.(msg);
		};

		// Call the slow tool with progress
		const result = await clientManager.callTool(
			sessionId,
			{ name: "slowWithProgress", arguments: {} },
			{ includeProgress: true },
		);

		expect(result.status).toBe("completed");
		// slowWithProgress is configured with progressSteps: 3
		expect(receivedNotifications.length).toBe(3);
	});

	test("progress notifications contain correct structure", async () => {
		const receivedNotifications: any[] = [];
		const originalOnMessage = mockTransport.onmessage;
		mockTransport.onmessage = (msg: any) => {
			if ("method" in msg && msg.method === "notifications/progress") {
				receivedNotifications.push(msg);
			}
			originalOnMessage?.(msg);
		};

		await clientManager.callTool(
			sessionId,
			{ name: "slowWithProgress", arguments: {} },
			{ includeProgress: true },
		);

		// Verify structure of first notification
		const firstNotification = receivedNotifications[0];
		expect(firstNotification.params.progressToken).toBeDefined();
		expect(typeof firstNotification.params.progress).toBe("number");
		expect(firstNotification.params.total).toBe(3);
		expect(firstNotification.params.message).toContain("Step 1");
	});

	test("progress values are monotonically increasing", async () => {
		const progressValues: number[] = [];
		const originalOnMessage = mockTransport.onmessage;
		mockTransport.onmessage = (msg: any) => {
			if ("method" in msg && msg.method === "notifications/progress") {
				progressValues.push(msg.params.progress);
			}
			originalOnMessage?.(msg);
		};

		await clientManager.callTool(
			sessionId,
			{ name: "slowWithProgress", arguments: {} },
			{ includeProgress: true },
		);

		// Progress should be 1, 2, 3 (monotonically increasing)
		expect(progressValues).toEqual([1, 2, 3]);
		for (let i = 1; i < progressValues.length; i++) {
			expect(progressValues[i]!).toBeGreaterThan(progressValues[i - 1]!);
		}
	});

	test("ToolOperation stores progress updates", async () => {
		const result = await clientManager.callTool(
			sessionId,
			{ name: "slowWithProgress", arguments: {} },
			{ includeProgress: true },
		);

		// The implementation should store progress on the ToolOperation.progressUpdates
		expect(result.progressUpdates).toBeDefined();
		expect(result.progressUpdates?.length).toBe(3);
		expect(result.progressUpdates?.[0]?.progress).toBe(1);
		expect(result.progressUpdates?.[2]?.progress).toBe(3);
	});

	test("progress stops after tool response is received", async () => {
		const progressValues: number[] = [];
		const originalOnMessage = mockTransport.onmessage;
		mockTransport.onmessage = (msg: any) => {
			if ("method" in msg && msg.method === "notifications/progress") {
				progressValues.push(msg.params.progress);
			}
			originalOnMessage?.(msg);
		};

		const result = await clientManager.callTool(
			sessionId,
			{ name: "slowWithProgress", arguments: {} },
			{ includeProgress: true },
		);

		// After completion, no more progress should arrive
		expect(result.status).toBe("completed");
		const finalCount = progressValues.length;

		// Wait a bit to see if any stray notifications arrive
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(progressValues.length).toBe(finalCount);
	});

	test("tool without progress support works normally", async () => {
		// Call a tool without including progress
		const result = await clientManager.callTool(sessionId, {
			name: "echo",
			arguments: { message: "test" },
		});

		expect(result.status).toBe("completed");
		// progress should be undefined or empty when not requested
	});

	test("progressToken correlates notifications to correct operation", async () => {
		const tokenToNotifications = new Map<string | number, any[]>();
		const originalOnMessage = mockTransport.onmessage;
		mockTransport.onmessage = (msg: any) => {
			if ("method" in msg && msg.method === "notifications/progress") {
				const token = msg.params.progressToken;
				if (!tokenToNotifications.has(token)) {
					tokenToNotifications.set(token, []);
				}
				tokenToNotifications.get(token)?.push(msg);
			}
			originalOnMessage?.(msg);
		};

		// Call tool with progress
		await clientManager.callTool(
			sessionId,
			{ name: "slowWithProgress", arguments: {} },
			{ includeProgress: true },
		);

		// We should have exactly one token with 3 notifications
		expect(tokenToNotifications.size).toBe(1);
		const notifications = Array.from(tokenToNotifications.values())[0]!;
		expect(notifications.length).toBe(3);
	});
});
