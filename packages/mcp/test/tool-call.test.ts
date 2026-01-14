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
import {
    scenarioMockConfig,
    scenarioToolDefinitions,
} from "./fixtures/tool-scenarios";
import { v4 as uuidv4 } from "uuid";

describe("Tool Execution Integration", () => {
    let sessionManager: SessionManager;
    let pipeline: ReturnType<typeof createPipeline>;
    let registry: McpClientRegistry;
    let clientManager: McpClientManager;
    let mockTransport: ReturnType<typeof createMockServerTransport>;
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
            name: "test-session",
            transport: "stdio",
            command: "node",
        });
        sessionId = session.id;

        // Setup Transport and Client
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

    test("callTool() executes tool and returns result", async () => {
        const result = await clientManager.callTool(sessionId, {
            name: "echo",
            arguments: { message: "hello" },
        });

        expect(result).toBeDefined();
        expect(result.status).toBe("completed");
        expect(result.result).toBeDefined();
        if (result.result && result.result.content.length > 0) {
            expect(result.result.content[0]?.type).toBe("text");
        } else {
            throw new Error("Expected content result");
        }
    });

    test("callTool() handles image content", async () => {
        const result = await clientManager.callTool(sessionId, {
            name: "getImage",
        });

        expect(result.status).toBe("completed");
        const content = result.result?.content[0];
        expect(content?.type).toBe("image");
        if (content?.type === "image") {
            expect(content.data).toBeDefined();
            expect(content.mimeType).toBe("image/png");
        }
    });

    test("callTool() handles unknown tool error (-32602)", async () => {
        // Expect failure
        // The client.callTool throws error if server returns error?
        // Or does it return ToolOperation with status='error'?
        // MCP SDK client throws. Manager should catch and update status to 'error'?
        // Or manager propagates?
        // Spec says "Status is updated to 'error'".
        // Manager callTool returns Promise<ToolOperation>.
        // So it should return the operation object with status='error'.

        const result = await clientManager.callTool(sessionId, {
            name: "nonExistentTool",
        });

        expect(result.status).toBe("error");
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBe(-32602);
    });

    test("callTool() tracks operation in store", async () => {
        const result = await clientManager.callTool(sessionId, {
            name: "echo",
            arguments: { message: "test" },
        });

        const validId = result.id;
        const stored = clientManager.getToolOperation(validId);
        expect(stored).toBeDefined();
        expect(stored?.id).toBe(validId);
        expect(stored?.status).toBe("completed");
    });

    test("getToolOperations() lists all session operations", async () => {
        await clientManager.callTool(sessionId, { name: "echo", arguments: { message: "1" } });
        await clientManager.callTool(sessionId, { name: "echo", arguments: { message: "2" } });

        const ops = clientManager.getToolOperations(sessionId);
        expect(ops).toHaveLength(2);
    });

    test("callTool() validates request arguments", async () => {
        // Valid request
        const valid = await clientManager.callTool(sessionId, {
            name: "echo",
            arguments: { message: "ok" }
        });
        expect(valid.status).toBe("completed");

        // Invalid request (missing required arg)
        // Mock server 'echo' tool requires 'message'.
        // If strictToolValidation is on, validation error might come from server?
        // SDK might strictly validate if local definition used? No, validation happens on server.
        // Server returns -32602 (Invalid Params).

        const invalid = await clientManager.callTool(sessionId, {
            name: "echo",
            arguments: {} // missing message
        });

        expect(invalid.status).toBe("error");
        // error code for invalid params is -32602 usually
    });
});
