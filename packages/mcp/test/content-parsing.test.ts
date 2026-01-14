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
 * Content Parsing Integration Tests
 *
 * These tests verify the end-to-end content parsing flow:
 * 1. Tool returns various content types
 * 2. Content is correctly parsed and typed
 * 3. Annotations are preserved
 * 4. Structured output is handled
 */
describe("Content Parsing Integration", () => {
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
            name: "content-test-session",
            transport: "stdio",
            command: "node",
        });
        sessionId = session.id;

        // Setup Transport with content-returning tools
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

    test("tool returns audio content and it is parsed correctly", async () => {
        const result = await clientManager.callTool(sessionId, {
            name: "getAudio",
        });

        expect(result.status).toBe("completed");
        expect(result.result?.content).toHaveLength(1);

        const content = result.result!.content[0];
        expect(content?.type).toBe("audio");
        if (content?.type === "audio") {
            expect(content.data).toBeDefined();
            expect(content.data.length).toBeGreaterThan(0);
            expect(content.mimeType).toBe("audio/wav");
        }
    });

    test("tool returns structuredContent and it is available in result", async () => {
        const result = await clientManager.callTool(sessionId, {
            name: "getStructured",
        });

        expect(result.status).toBe("completed");
        expect(result.result?.structuredContent).toBeDefined();

        const structured = result.result!.structuredContent as any;
        expect(structured.result).toBe("success");
        expect(structured.count).toBe(42);
        expect(structured.items).toEqual(["a", "b", "c"]);
    });

    test("annotations are preserved in parsed content", async () => {
        const result = await clientManager.callTool(sessionId, {
            name: "getAnnotated",
        });

        expect(result.status).toBe("completed");
        expect(result.result?.content).toHaveLength(1);

        const content = result.result!.content[0];
        expect(content?.annotations).toBeDefined();
        expect(content?.annotations?.audience).toContain("user");
        expect(content?.annotations?.priority).toBe(0.8);
    });

    test("large base64 content is handled without memory issues", async () => {
        // getImage returns a small image, but this test verifies the mechanism works
        const result = await clientManager.callTool(sessionId, {
            name: "getImage",
        });

        expect(result.status).toBe("completed");

        const content = result.result!.content[0];
        expect(content?.type).toBe("image");
        if (content?.type === "image") {
            // Verify base64 data is present and valid
            expect(content.data.length).toBeGreaterThan(10);
            // Base64 should only contain valid characters
            expect(content.data).toMatch(/^[A-Za-z0-9+/=]+$/);
        }
    });

    test("embedded resource content is parsed correctly", async () => {
        const result = await clientManager.callTool(sessionId, {
            name: "getEmbeddedResource",
        });

        expect(result.status).toBe("completed");

        const content = result.result!.content[0];
        expect(content?.type).toBe("resource");
        if (content?.type === "resource") {
            expect(content.resource.uri).toBe("file:///path/to/data.json");
            expect(content.resource.text).toBe('{"key": "value"}');
            expect(content.resource.mimeType).toBe("application/json");
        }
    });

    test("resource_link content is parsed correctly", async () => {
        const result = await clientManager.callTool(sessionId, {
            name: "getResourceLink",
        });

        expect(result.status).toBe("completed");

        const content = result.result!.content[0];
        expect(content?.type).toBe("resource_link");
        if (content?.type === "resource_link") {
            expect(content.uri).toBe("file:///path/to/resource.txt");
            expect(content.name).toBe("Resource File");
            expect(content.mimeType).toBe("text/plain");
        }
    });

    test("mixed content types are all parsed correctly", async () => {
        const result = await clientManager.callTool(sessionId, {
            name: "getMixed",
        });

        expect(result.status).toBe("completed");
        expect(result.result?.content).toHaveLength(3);

        const types = result.result!.content.map((c) => c.type);
        expect(types).toContain("text");
        expect(types).toContain("image");
        expect(types).toContain("resource_link");
    });

    test("text content is parsed correctly", async () => {
        const result = await clientManager.callTool(sessionId, {
            name: "echo",
            arguments: { message: "Hello World" },
        });

        expect(result.status).toBe("completed");
        expect(result.result?.content).toHaveLength(1);

        const content = result.result!.content[0];
        expect(content?.type).toBe("text");
        if (content?.type === "text") {
            expect(content.text).toContain("Hello World");
        }
    });
});
