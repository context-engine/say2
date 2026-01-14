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
		if (this.clients.has(sessionId)) {
			throw new Error(`Client already registered for session: ${sessionId}`);
		}

		const entry: McpClientEntry = {
			sessionId,
			client,
			transport,
			connectedAt: new Date(),
		};

		this.clients.set(sessionId, entry);
	}

	/**
	 * Get the client entry for a session.
	 */
	get(sessionId: string): McpClientEntry | undefined {
		return this.clients.get(sessionId);
	}

	/**
	 * Remove a client entry.
	 * @returns true if the entry existed and was removed
	 */
	remove(sessionId: string): boolean {
		return this.clients.delete(sessionId);
	}

	/**
	 * List all registered client entries.
	 */
	list(): McpClientEntry[] {
		return Array.from(this.clients.values());
	}
}
