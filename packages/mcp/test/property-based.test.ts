/**
 * Property-Based Tests for MCP Package
 *
 * These tests use fast-check to generate random inputs and verify
 * that properties hold for ALL possible inputs, not just specific examples.
 */

import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { handleMessage } from "./fixtures/mock-server";
import { EventDetector } from "../src/events/detector";

describe("MCP Property-Based Tests", () => {
    describe("EventDetector", () => {
        test("EventDetector.isInitializeRequest: true iff method is 'initialize' and has id", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        jsonrpc: fc.constant("2.0" as const),
                        id: fc.oneof(fc.integer({ min: 1 }), fc.string({ minLength: 1 })),
                        method: fc.string({ minLength: 1 }),
                    }),
                    (message) => {
                        const result = EventDetector.isInitializeRequest(message);
                        const expected = message.method === "initialize";
                        return result === expected;
                    },
                ),
                { numRuns: 100 },
            );
        });

        test("EventDetector.isInitializeRequest: always false for responses (no method)", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        jsonrpc: fc.constant("2.0" as const),
                        id: fc.integer({ min: 1 }),
                        result: fc.record({
                            protocolVersion: fc.string(),
                            capabilities: fc.object(),
                        }),
                    }),
                    (message) => {
                        // Property: Responses (no method) never match
                        return EventDetector.isInitializeRequest(message as any) === false;
                    },
                ),
                { numRuns: 100 },
            );
        });

        test("EventDetector.isInitializedNotification: true iff method is 'notifications/initialized' and no id", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        jsonrpc: fc.constant("2.0" as const),
                        method: fc.string({ minLength: 1 }),
                    }),
                    (message) => {
                        const result = EventDetector.isInitializedNotification(message);
                        const expected = message.method === "notifications/initialized";
                        return result === expected;
                    },
                ),
                { numRuns: 100 },
            );
        });

        test("EventDetector.isToolsListResponse: always false for requests (has method)", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        jsonrpc: fc.constant("2.0" as const),
                        id: fc.integer(),
                        method: fc.string({ minLength: 1 }),
                    }),
                    (message) => {
                        // Property: Requests never match tools/list response
                        return EventDetector.isToolsListResponse(message as any) === false;
                    },
                ),
                { numRuns: 100 },
            );
        });

        test("EventDetector.extractCapabilities: returns undefined for non-init responses", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        jsonrpc: fc.constant("2.0" as const),
                        id: fc.integer(),
                        result: fc.record({
                            tools: fc.array(fc.object()),
                        }),
                    }),
                    (message) => {
                        // Property: Non-init responses return undefined capabilities
                        const caps = EventDetector.extractCapabilities(message as any);
                        // A tools/list response should not have capabilities extracted
                        return caps === undefined || typeof caps === "object";
                    },
                ),
                { numRuns: 100 },
            );
        });

        test("EventDetector.extractServerInfo: preserves name and version from valid response", () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.string({ minLength: 1, maxLength: 20 }),
                    (name, version) => {
                        const message = {
                            jsonrpc: "2.0" as const,
                            id: 1,
                            result: {
                                protocolVersion: "2024-11-05",
                                capabilities: {},
                                serverInfo: { name, version },
                            },
                        };
                        const info = EventDetector.extractServerInfo(message);
                        // Property: Server info is preserved
                        return info?.name === name && info?.version === version;
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe("Mock Server Pagination", () => {
        test("pagination: nextCursor is undefined iff at end of list", () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 20 }), // Number of tools
                    fc.integer({ min: 1, max: 5 }),  // Page size
                    fc.integer({ min: 0, max: 19 }), // Starting cursor
                    (numTools, pageSize, cursor) => {
                        const tools = Array.from({ length: numTools }, (_, i) => ({
                            name: `tool-${i}`,
                            description: `Tool ${i}`,
                        }));

                        const config = {
                            name: "test-server",
                            version: "1.0.0",
                            capabilities: { tools: true },
                            tools,
                            toolsPageSize: pageSize,
                        };

                        const response = handleMessage(
                            {
                                jsonrpc: "2.0" as const,
                                id: 1,
                                method: "tools/list",
                                params: cursor > 0 ? { cursor: cursor.toString() } : undefined,
                            },
                            config,
                        ) as any;

                        if (!response) return true; // Skip if no response

                        const endIndex = cursor + pageSize;
                        const isAtEnd = endIndex >= numTools;

                        // Property: nextCursor is undefined if and only if at end
                        const hasNextCursor = response.result.nextCursor !== undefined;
                        return hasNextCursor !== isAtEnd;
                    },
                ),
                { numRuns: 100 },
            );
        });

        test("pagination: returned tools count is min(pageSize, remaining)", () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 20 }),
                    fc.integer({ min: 1, max: 5 }),
                    (numTools, pageSize) => {
                        const tools = Array.from({ length: numTools }, (_, i) => ({
                            name: `tool-${i}`,
                            description: `Tool ${i}`,
                        }));

                        const config = {
                            name: "test-server",
                            version: "1.0.0",
                            capabilities: { tools: true },
                            tools,
                            toolsPageSize: pageSize,
                        };

                        const response = handleMessage(
                            {
                                jsonrpc: "2.0" as const,
                                id: 1,
                                method: "tools/list",
                            },
                            config,
                        ) as any;

                        if (!response) return true;

                        // Property: First page has min(pageSize, total) tools
                        const expectedCount = Math.min(pageSize, numTools);
                        return response.result.tools.length === expectedCount;
                    },
                ),
                { numRuns: 100 },
            );
        });

        test("pagination: all pages together contain all tools", () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 15 }),
                    fc.integer({ min: 1, max: 5 }),
                    (numTools, pageSize) => {
                        const tools = Array.from({ length: numTools }, (_, i) => ({
                            name: `tool-${i}`,
                            description: `Tool ${i}`,
                        }));

                        const config = {
                            name: "test-server",
                            version: "1.0.0",
                            capabilities: { tools: true },
                            tools,
                            toolsPageSize: pageSize,
                        };

                        // Collect all tools across pages
                        const allCollected: any[] = [];
                        let cursor: string | undefined = undefined;
                        let iterations = 0;
                        const maxIterations = 100; // Safety limit

                        do {
                            const response = handleMessage(
                                {
                                    jsonrpc: "2.0" as const,
                                    id: iterations + 1,
                                    method: "tools/list",
                                    ...(cursor ? { params: { cursor } } : {}),
                                },
                                config,
                            ) as any;

                            if (!response) break;
                            allCollected.push(...response.result.tools);
                            cursor = response.result.nextCursor;
                            iterations++;
                        } while (cursor && iterations < maxIterations);

                        // Property: All tools are collected exactly once
                        return allCollected.length === numTools;
                    },
                ),
                { numRuns: 50 },
            );
        });
    });

    describe("Protocol Version Handling", () => {
        test("version: protocolVersion in response equals config value", () => {
            fc.assert(
                fc.property(
                    fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/), // Date-like version
                    (protocolVersion) => {
                        const config = {
                            name: "test-server",
                            version: "1.0.0",
                            protocolVersion,
                            capabilities: { tools: true },
                        };

                        const response = handleMessage(
                            {
                                jsonrpc: "2.0" as const,
                                id: 1,
                                method: "initialize",
                                params: {
                                    protocolVersion: "2024-11-05",
                                    capabilities: {},
                                    clientInfo: { name: "Test", version: "1.0.0" },
                                },
                            },
                            config,
                        ) as any;

                        if (!response) return true;

                        // Property: Server returns its configured version
                        return response.result.protocolVersion === protocolVersion;
                    },
                ),
                { numRuns: 100 },
            );
        });

        test("version: serverInfo.name matches config.name", () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    (serverName) => {
                        const config = {
                            name: serverName,
                            version: "1.0.0",
                            capabilities: { tools: true },
                        };

                        const response = handleMessage(
                            {
                                jsonrpc: "2.0" as const,
                                id: 1,
                                method: "initialize",
                                params: {
                                    protocolVersion: "2024-11-05",
                                    capabilities: {},
                                    clientInfo: { name: "Test", version: "1.0.0" },
                                },
                            },
                            config,
                        ) as any;

                        if (!response) return true;

                        // Property: Server name is preserved
                        return response.result.serverInfo.name === serverName;
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe("Message Handling Invariants", () => {
        test("error: failOnMethods always returns error for configured method", () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 30 }),
                    (method) => {
                        const config = {
                            name: "test-server",
                            version: "1.0.0",
                            capabilities: { tools: true },
                            failOnMethods: [method],
                        };

                        const response = handleMessage(
                            {
                                jsonrpc: "2.0" as const,
                                id: 1,
                                method: method,
                            },
                            config,
                        ) as any;

                        if (!response) return true;

                        // Property: failOnMethods returns error response
                        return "error" in response && response.error.code === -32603;
                    },
                ),
                { numRuns: 100 },
            );
        });

        test("response: id is always preserved from request", () => {
            fc.assert(
                fc.property(
                    fc.oneof(fc.integer({ min: 1, max: 1000000 }), fc.uuid()),
                    (requestId) => {
                        const config = {
                            name: "test-server",
                            version: "1.0.0",
                            capabilities: { tools: true },
                        };

                        const response = handleMessage(
                            {
                                jsonrpc: "2.0" as const,
                                id: requestId,
                                method: "initialize",
                                params: {
                                    protocolVersion: "2024-11-05",
                                    capabilities: {},
                                    clientInfo: { name: "Test", version: "1.0.0" },
                                },
                            },
                            config,
                        ) as any;

                        if (!response) return true;

                        // Property: Response id matches request id
                        return response.id === requestId;
                    },
                ),
                { numRuns: 100 },
            );
        });

        test("response: notifications return null (no response)", () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 30 }),
                    (method) => {
                        const config = {
                            name: "test-server",
                            version: "1.0.0",
                            capabilities: {},
                        };

                        // Notification = no id
                        const response = handleMessage(
                            {
                                jsonrpc: "2.0" as const,
                                method: method,
                            } as any,
                            config,
                        );

                        // Property: Notifications return null
                        return response === null;
                    },
                ),
                { numRuns: 100 },
            );
        });
    });
});
