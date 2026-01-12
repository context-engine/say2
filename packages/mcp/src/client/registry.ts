/**
 * McpClientRegistry
 *
 * Holds MCP SDK Client instances keyed by sessionId.
 * Simple Map wrapper for client lifecycle management.
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { LoggingTransport } from "../transport";
import type { McpClientEntry } from "../types";

export class McpClientRegistry {
    private clients: Map<string, McpClientEntry> = new Map();

    /**
     * Register a new MCP client for a session.
     * @throws Error if sessionId already exists
     */
    register(
        sessionId: string,
        client: Client,
        transport: LoggingTransport,
    ): void {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Get the client entry for a session.
     */
    get(sessionId: string): McpClientEntry | undefined {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Remove a client entry.
     * @returns true if the entry existed and was removed
     */
    remove(sessionId: string): boolean {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * List all registered client entries.
     */
    list(): McpClientEntry[] {
        // TODO: Implement
        throw new Error("Not implemented");
    }
}
