/**
 * McpClientManager
 *
 * Orchestrates the MCP client connection lifecycle.
 * Creates transport stack, connects client, and manages registration.
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { MiddlewarePipeline, SessionManager } from "@say2/core";
import type { McpClientRegistry } from "./registry";

export class McpClientManager {
    constructor(
        private registry: McpClientRegistry,
        private sessionManager: SessionManager,
        private pipeline: MiddlewarePipeline,
    ) { }

    /**
     * Connect to an MCP server for the given session.
     * Creates transport stack and initiates connection.
     * @throws Error if session not found or transport not supported
     */
    async connect(sessionId: string): Promise<void> {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Disconnect from an MCP server.
     * Cleans up client and transport resources.
     */
    async disconnect(sessionId: string): Promise<void> {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Get the MCP SDK Client for a session.
     */
    getClient(sessionId: string): Client | undefined {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Check if a session has an active MCP connection.
     */
    isConnected(sessionId: string): boolean {
        // TODO: Implement
        throw new Error("Not implemented");
    }
}
