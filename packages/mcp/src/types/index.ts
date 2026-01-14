/**
 * MCP-specific types
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

/**
 * Entry in the MCP client registry.
 * Holds the MCP SDK Client instance along with the transport for a session.
 */
export interface McpClientEntry {
	sessionId: string;
	client: Client;
	transport: LoggingTransport;
	connectedAt: Date;
}

// Forward reference - LoggingTransport is defined in transport module
import type { LoggingTransport } from "../transport";

// Tool operation types (Phase 2a)
export * from "./tool";
