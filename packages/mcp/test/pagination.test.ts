/**
 * Pagination Tests (Unit Level)
 *
 * Tests for cursor-based pagination in capability discovery.
 * Tests the mock server pagination logic directly without MCP SDK Client.
 */

import { describe, expect, test } from "bun:test";
import { handleMessage } from "./fixtures/mock-server";

describe("Pagination Unit Tests", () => {
    describe("tools/list pagination", () => {
        test("returns paginated tools with nextCursor when pageSize configured", () => {
            const tools = Array.from({ length: 10 }, (_, i) => ({
                name: `tool-${i + 1}`,
                description: `Tool ${i + 1}`,
            }));

            const config = {
                name: "paginated-server",
                version: "1.0.0",
                capabilities: { tools: true },
                tools,
                toolsPageSize: 3,
            };

            // Page 1
            const response1 = handleMessage(
                {
                    jsonrpc: "2.0" as const,
                    id: 1,
                    method: "tools/list",
                },
                config,
            ) as any;

            expect(response1).not.toBeNull();
            expect(response1.result.tools.length).toBe(3);
            expect(response1.result.tools[0].name).toBe("tool-1");
            expect(response1.result.nextCursor).toBe("3");

            // Page 2
            const response2 = handleMessage(
                {
                    jsonrpc: "2.0" as const,
                    id: 2,
                    method: "tools/list",
                    params: { cursor: "3" },
                },
                config,
            ) as any;

            expect(response2).not.toBeNull();
            expect(response2.result.tools.length).toBe(3);
            expect(response2.result.tools[0].name).toBe("tool-4");
            expect(response2.result.nextCursor).toBe("6");

            // Page 3
            const response3 = handleMessage(
                {
                    jsonrpc: "2.0" as const,
                    id: 3,
                    method: "tools/list",
                    params: { cursor: "6" },
                },
                config,
            ) as any;

            expect(response3).not.toBeNull();
            expect(response3.result.tools.length).toBe(3);
            expect(response3.result.tools[0].name).toBe("tool-7");
            expect(response3.result.nextCursor).toBe("9");

            // Page 4 (final page)
            const response4 = handleMessage(
                {
                    jsonrpc: "2.0" as const,
                    id: 4,
                    method: "tools/list",
                    params: { cursor: "9" },
                },
                config,
            ) as any;

            expect(response4).not.toBeNull();
            expect(response4.result.tools.length).toBe(1);
            expect(response4.result.tools[0].name).toBe("tool-10");
            expect(response4.result.nextCursor).toBeUndefined();
        });

        test("returns all tools without cursor when pagination not configured", () => {
            const tools = Array.from({ length: 5 }, (_, i) => ({
                name: `tool-${i + 1}`,
                description: `Tool ${i + 1}`,
            }));

            const config = {
                name: "non-paginated-server",
                version: "1.0.0",
                capabilities: { tools: true },
                tools,
                // No toolsPageSize
            };

            const response = handleMessage(
                {
                    jsonrpc: "2.0" as const,
                    id: 1,
                    method: "tools/list",
                },
                config,
            ) as any;

            expect(response).not.toBeNull();
            expect(response.result.tools.length).toBe(5);
            expect(response.result.nextCursor).toBeUndefined();
        });

        test("handles empty tools list correctly", () => {
            const config = {
                name: "empty-tools-server",
                version: "1.0.0",
                capabilities: { tools: true },
                tools: [],
                toolsPageSize: 3,
            };

            const response = handleMessage(
                {
                    jsonrpc: "2.0" as const,
                    id: 1,
                    method: "tools/list",
                },
                config,
            ) as any;

            expect(response).not.toBeNull();
            expect(response.result.tools.length).toBe(0);
            expect(response.result.nextCursor).toBeUndefined();
        });
    });

    describe("resources/list pagination", () => {
        test("follows nextCursor to retrieve all resources across multiple pages", () => {
            const resources = Array.from({ length: 7 }, (_, i) => ({
                uri: `file:///resource-${i + 1}.txt`,
                name: `Resource ${i + 1}`,
            }));

            const config = {
                name: "paginated-resources-server",
                version: "1.0.0",
                capabilities: { resources: true },
                resources,
                resourcesPageSize: 2,
            };

            // Collect all pages
            const allResources: any[] = [];
            let cursor: string | undefined = undefined;
            let page = 1;

            do {
                const response = handleMessage(
                    {
                        jsonrpc: "2.0" as const,
                        id: page,
                        method: "resources/list",
                        ...(cursor ? { params: { cursor } } : {}),
                    },
                    config,
                ) as any;

                expect(response).not.toBeNull();
                allResources.push(...response.result.resources);
                cursor = response.result.nextCursor;
                page++;
            } while (cursor);

            expect(allResources.length).toBe(7);
            expect(allResources.map((r) => r.name)).toEqual([
                "Resource 1",
                "Resource 2",
                "Resource 3",
                "Resource 4",
                "Resource 5",
                "Resource 6",
                "Resource 7",
            ]);
            expect(page).toBe(5); // 4 pages + initial
        });

        test("returns all resources without cursor when pagination not configured", () => {
            const resources = Array.from({ length: 3 }, (_, i) => ({
                uri: `file:///resource-${i + 1}.txt`,
                name: `Resource ${i + 1}`,
            }));

            const config = {
                name: "non-paginated-resources-server",
                version: "1.0.0",
                capabilities: { resources: true },
                resources,
                // No resourcesPageSize
            };

            const response = handleMessage(
                {
                    jsonrpc: "2.0" as const,
                    id: 1,
                    method: "resources/list",
                },
                config,
            ) as any;

            expect(response).not.toBeNull();
            expect(response.result.resources.length).toBe(3);
            expect(response.result.nextCursor).toBeUndefined();
        });

        test("handles empty resources list correctly", () => {
            const config = {
                name: "empty-resources-server",
                version: "1.0.0",
                capabilities: { resources: true },
                resources: [],
                resourcesPageSize: 2,
            };

            const response = handleMessage(
                {
                    jsonrpc: "2.0" as const,
                    id: 1,
                    method: "resources/list",
                },
                config,
            ) as any;

            expect(response).not.toBeNull();
            expect(response.result.resources.length).toBe(0);
            expect(response.result.nextCursor).toBeUndefined();
        });
    });
});
