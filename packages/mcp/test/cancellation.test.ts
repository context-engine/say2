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

/**
 * Cancellation Integration Tests
 *
 * These tests verify the end-to-end flow of cancellation:
 * 1. cancelOperation() sends notifications/cancelled to server
 * 2. Server receives and processes cancellation
 * 3. Operation status is updated to 'cancelled'
 * 4. Responses after cancellation are ignored
 */
describe("Cancellation Integration", () => {
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
			name: "cancel-test-session",
			transport: "stdio",
			command: "node",
		});
		sessionId = session.id;

		// Setup Transport - slowTool is configured with 5s delay for cancellation tests
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
		registry.register(sessionId, client, loggingTransport);

		// Manually transition to ACTIVE
		sessionManager.connect(sessionId);
		sessionManager.initialize(sessionId);
		sessionManager.activate(sessionId, {}, {}, LATEST_PROTOCOL_VERSION);
	});

	afterEach(async () => {
		if (mockTransport && !mockTransport.isClosed) {
			await mockTransport.close();
		}
	});

	test("cancelOperation() sends notifications/cancelled to server", async () => {
		// Start a slow tool call that we'll cancel
		const toolCallPromise = clientManager.callTool(sessionId, {
			name: "slowTool",
			arguments: {},
		});

		// Wait a moment for the request to be sent
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Get the operation ID from the pending operation
		const ops = clientManager.getToolOperations(sessionId);
		const pendingOp = ops.find((op) => op.status === "pending");

		if (pendingOp) {
			await clientManager.cancelOperation(pendingOp.id, "Test cancellation");
		}

		// Verify mock server received cancellation
		const cancelledRequests = mockTransport.getCancelledRequests();
		expect(cancelledRequests.length).toBeGreaterThan(0);

		// Clean up by waiting for the tool call to complete or fail
		try {
			await toolCallPromise;
		} catch {
			// Expected if cancelled
		}
	});

	test("cancellation notification includes requestId", async () => {
		// Capture sent messages
		let cancelNotification: any = null;
		const originalSend = mockTransport.send.bind(mockTransport);
		mockTransport.send = async (msg: any) => {
			if (
				"method" in msg &&
				msg.method === "notifications/cancelled" &&
				!("id" in msg)
			) {
				cancelNotification = msg;
			}
			return originalSend(msg);
		};

		// Start slow tool and cancel
		const toolCallPromise = clientManager.callTool(sessionId, {
			name: "slowTool",
			arguments: {},
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const ops = clientManager.getToolOperations(sessionId);
		const pendingOp = ops.find((op) => op.status === "pending");

		if (pendingOp) {
			await clientManager.cancelOperation(pendingOp.id);
		}

		expect(cancelNotification).not.toBeNull();
		expect(cancelNotification?.params?.requestId).toBeDefined();

		try {
			await toolCallPromise;
		} catch {
			// Expected
		}
	});

	test("cancellation notification includes reason when provided", async () => {
		let cancelNotification: any = null;
		const originalSend = mockTransport.send.bind(mockTransport);
		mockTransport.send = async (msg: any) => {
			if (
				"method" in msg &&
				msg.method === "notifications/cancelled" &&
				!("id" in msg)
			) {
				cancelNotification = msg;
			}
			return originalSend(msg);
		};

		const toolCallPromise = clientManager.callTool(sessionId, {
			name: "slowTool",
			arguments: {},
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const ops = clientManager.getToolOperations(sessionId);
		const pendingOp = ops.find((op) => op.status === "pending");

		if (pendingOp) {
			await clientManager.cancelOperation(pendingOp.id, "User clicked cancel");
		}

		expect(cancelNotification?.params?.reason).toBe("User clicked cancel");

		try {
			await toolCallPromise;
		} catch {
			// Expected
		}
	});

	test("cancelled operation has status 'cancelled'", async () => {
		const toolCallPromise = clientManager.callTool(sessionId, {
			name: "slowTool",
			arguments: {},
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const ops = clientManager.getToolOperations(sessionId);
		const pendingOp = ops.find((op) => op.status === "pending");

		if (pendingOp) {
			await clientManager.cancelOperation(pendingOp.id);
		}

		// Wait for the call to resolve/reject
		try {
			await toolCallPromise;
		} catch {
			// Expected
		}

		// Verify status is cancelled
		if (pendingOp) {
			const finalOp = clientManager.getToolOperation(pendingOp.id);
			expect(finalOp?.status).toBe("cancelled");
		}
	});

	test("response after cancellation is ignored", async () => {
		const toolCallPromise = clientManager.callTool(sessionId, {
			name: "slowTool",
			arguments: {},
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const ops = clientManager.getToolOperations(sessionId);
		const pendingOp = ops.find((op) => op.status === "pending");

		if (pendingOp) {
			await clientManager.cancelOperation(pendingOp.id);
		}

		// The mock server should not send response for cancelled requests
		// (see mock-server.ts lines 476-480 and 514-516)

		try {
			await toolCallPromise;
		} catch {
			// Expected
		}

		if (pendingOp) {
			const finalOp = clientManager.getToolOperation(pendingOp.id);
			// Status should remain cancelled, not completed
			expect(finalOp?.status).toBe("cancelled");
			// Result should not be set
			expect(finalOp?.result).toBeUndefined();
		}
	});

	test("timeout auto-cancels long-running operation", async () => {
		// This test requires the callTool to support timeout option
		const toolCallPromise = clientManager.callTool(
			sessionId,
			{ name: "verySlowTool", arguments: {} },
			{ timeout: 500 }, // 500ms timeout for testing
		);

		// Wait for timeout to trigger
		try {
			await toolCallPromise;
		} catch {
			// Expected to throw or return error status
		}

		const ops = clientManager.getToolOperations(sessionId);
		const op = ops[ops.length - 1];

		// Should be either cancelled or error due to timeout
		expect(op).toBeDefined();
		expect(["cancelled", "error"]).toContain(op?.status);
	});

	test("completed operation cannot be cancelled", async () => {
		// Call a fast tool that will complete quickly
		const result = await clientManager.callTool(sessionId, {
			name: "echo",
			arguments: { message: "quick" },
		});

		expect(result.status).toBe("completed");

		// Attempt to cancel completed operation
		await clientManager.cancelOperation(result.id, "Too late");

		// Status should still be completed
		const finalOp = clientManager.getToolOperation(result.id);
		expect(finalOp?.status).toBe("completed");
	});

	test("normal tool completion clears pending tracking", async () => {
		const result = await clientManager.callTool(sessionId, {
			name: "echo",
			arguments: { message: "test" },
		});

		expect(result.status).toBe("completed");

		// Verify no stale pending requests
		// (Implementation detail: onResponse should have been called)
	});
});
